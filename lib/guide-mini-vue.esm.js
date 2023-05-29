function createVNode(type, props, children) {
    // 主要是返回一个vnode对象
    const vnode = {
        type,
        props,
        children,
        component: null,
        shapeFlag: getShapeFlag(type),
        elem: null,
        key: props && props.key,
    };
    // 对children进行类型判断
    if (typeof children === 'string') {
        // vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
        // 或者
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        // vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN;
        // 或者
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 对children是否为slot类型的判断
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
// 对虚拟节点进行类型判断
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

const Fragment = Symbol('Fragment');
function renderSlots(slots, name, args) {
    // return createVNode("div", {}, slots[name]);
    // 同时实现作用域插槽
    console.log("slots", slots);
    const slot = slots[name];
    console.log("slot", slot);
    if (slot) {
        console.log(name, typeof slot);
        // 如果slot的类型为function，则说明使用的是作用域插槽，通过函数传递参数
        if (typeof slot === 'function') {
            // args接收通过slots传递的参数
            // return createVNode("div", {}, slot(args));
            // 同时处理Fragment类型的虚拟节点，其处理方式就是把fragment虚拟节点当作children节点渲染到其父元素上（容器）
            return createVNode(Fragment, {}, slot(args));
        }
        // 否则使用的是普通插槽或者具名插槽
    }
}

const extend = Object.assign;
const isObject = value => {
    return value !== null && typeof value === 'object';
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const hasChanged = (oldVal, newVal) => !Object.is(oldVal, newVal);
const EMPTY_OBJ = {};

const publicPropertiesMap = {
    $el: instance => instance.vnode.elem,
    // $slots: instance => instance.vnode.children, //获取当前虚拟节点上的children
    $slots: instance => instance.slots,
    $props: instance => instance.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState的值为组件中setup函数的返回的那个对象，其中包含了在setup中创建的数据
        const { setupState, props } = instance;
        // if (key in setupState) {
        //     return setupState[key];
        // }
        // 同时用于实现props功能
        // 将获取到的props中对应的属性值进行返回
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // 获取元素虚拟节点的那个DOM元素
        // if (key === '$el') {
        // return instance.vnode.elem;
        // }
        // 进行优化，将以上的逻辑抽离到publicPropertiesMap对象中
        // 使得在publicPropertiesMap中能够存在多个公共属性与其getter函数的映射，例如$el、$data、$props等
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initProps(instance, rawProps) {
    // 获取props
    instance.props = rawProps || {};
}

// 手动封装一个effect
// 保存当前的effect对象（依赖）
let activeEffect;
// 解决obj.prop++时stop的功能测试不通过的问题
// 控制是否收集依赖
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        // 用于实现stop
        // 存储dep
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    // 调用run时，通过调用fn()对依赖的值进行修改
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        // 添加return,实现测试中runner()函数的功能
        return res;
    }
    // stop功能
    stop() {
        // 添加active，防止频繁清空
        if (this.active) {
            cleanUpEffect(this);
            // 实现onStop
            this.onStop ? this.onStop() : null;
            this.active = false;
        }
    }
}
function cleanUpEffect(effect) {
    // 清空deps中的所有dep
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
// 依赖收集，收集当前的effect对象
// 将target存储在targetMap中，Map(target, depsMap) → Map(target, new Map()/Map(key,dep)) → Map(target, new Map()/Map(key,new Set()/Set(activeEffect)))
// 将effect存储在dep中，Set(activeEffect)
// 下面函数中创建了两个Map，一个Set，作用分别为：
// 第一个Map也就是targetMap用于存放target和第二个Map的一一映射关系，即Map(target, new Map())
// 第二个Map也就是depsMap用于存放key和dep的一一映射关系，即Map(key, dep)
// Set也就是dep，用于存放多个依赖effect对象，即Set(activeEffect)
// 存储target的容器
const targetMap = new Map();
function track(target, key) {
    // 初始化阶段
    // 获取指定的target对应的dep容器（用于存储依赖），每个target原始对象要与其相应的依赖effect对象一一对应
    // 从targetMap中获取target对应的depsMap值
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        // 存储依赖的容器
        dep = new Set();
        depsMap.set(key, dep);
    }
    // 如果shouldTrack为false，则停止依赖的收集
    if (!shouldTrack)
        return;
    trackEffect(dep);
}
// 抽离出来的收集依赖的可复用代码
// 例如在ref.ts中对该逻辑代码进行了使用
function trackEffect(dep) {
    if (activeEffect && !dep.has(activeEffect)) {
        // 收集依赖
        // 将当前的effect对象（依赖添加进容器dep中）
        dep.add(activeEffect);
        // 用于实现stop
        activeEffect.deps.push(dep);
    }
}
// 触发依赖
// 触发m每个effect对象中的run()（fn()）函数
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
// 抽离出来的收集依赖的可复用代码
// 例如在ref.ts中对该逻辑代码进行了使用
function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    // 获取scheduler，实现scheduler的功能
    const scheduler = options.scheduler;
    // 创建effect对象
    const _effect = new ReactiveEffect(fn, scheduler);
    // 获取onStop
    // _effect.onStop = options.onStop;
    // 进行优化
    // 以上代码等价于使用
    // Object.assign(_effect, options);
    // 将以上代码抽离到shared文件夹中
    extend(_effect, options);
    // 实现依赖的触发
    _effect.run();
    // 实现测试中runner()函数的功能
    const runner = _effect.run.bind(_effect);
    // 用于实现stop功能
    runner.effect = _effect;
    return runner;
}

function createGetter(isReadonly = false, isShallowReadonly = false) {
    return function get(target, key) {
        // 用于实现isReactive的功能
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 实现reactive和readonly的嵌套功能
        // 判断获取到的res是否为一个object，如果是则再次调用reactive()或者readonly()进行封装成响应式对象
        if (isObject(res) && !isShallowReadonly) {
            // 递归调用reactive()或者readonly()
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter(isReadonly = false) {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
// export const mutableHandlers = {
//     get: createGetter(),
//     set : createSetter(),
// }
// export const readonlyHandlers = {
//         // getter
//         get: createGetter(true),
//         // setter
//         set(target, key, value) {
//             return true;
//         }
// }
// 将以上代码中的get和set进行优化，缓存一次createGetter和createSetter的结果，避免多次调用
const get = createGetter();
const set = createSetter();
const readonlyGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(true, true);
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    // getter
    get: readonlyGetter,
    // setter
    set(target, key, value) {
        console.warn(`设置key:${key}失败,因为target为一个readonly对象,${target}`);
        return true;
    }
};
// export const shallowReadonlyHandlers = {
//     get : shallowReadonlyGetter,
//     set(target, key, value) {
//             console.warn(`设置key:${key}失败,因为target为一个readonly对象,${target}`)
//             return true;
//     }
// }
// 或者
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGetter,
});

// 封装一个reactive
// 版本1
// export function reactive(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get(target, key) {
//             // 使用Reflect.get获取原始对象target中对应key的值
//             const res = Reflect.get(target, key);
//             // 同时进行依赖收集
//             track(target, key);
//             return res;
//         },
//         // setter
//         set(target, key, value) {
//             // 使用Reflect.set对原始对象target中对应key的值进行修改
//             const res = Reflect.set(target, key, value);
//             // 同时进行触发依赖
//             trigger(target, key);
//             return res;
//         }
//     })
// }
// // 封装一个readonly
// // 类似于reactive，但是不能调用setter，同时不要进行依赖的收集和依赖的触发
// export function readonly(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get(target, key) {
//             // 使用Reflect.get获取原始对象target中对应key的值
//             const res = Reflect.get(target, key);
//             return res;
//         },
//         // setter
//         set(target, key, value) {
//             return true;
//         }
//     })
// }
// 版本2
// 将以上的reactive和readonly进行优化
// 抽离get和set进行复用
// function createGetter(isReadonly: boolean = false) {
//     return function get(target, key) {
//         const res = Reflect.get(target, key);
//         if (!isReadonly) {
//             track(target, key);
//         }
//         return res;
//     }
// }
// function createSetter(isReadonly: boolean = false) {
//     return function set(target, key, value) {
//         const res = Reflect.set(target, key, value);
//         trigger(target, key);
//         return res;
//     }
// }
// export function reactive(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get : createGetter(),
//         // setter
//         set: createSetter(),
//     })
// }
// export function readonly(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get: createGetter(true),
//         // setter
//         set(target, key, value) {
//             return true;
//         }
//     })
// }
// 版本3
// 将以上的代码进行优化
// 将上面的createGetter、createSetter和两个return new Proxy()抽离到baseHandlers.ts文件中
// export function reactive(raw) {
//     return new Proxy(raw, mutableHandlers);
// }
// export function readonly(raw) {
//     return new Proxy(raw, readonlyHandlers);
// }
// 版本4
// 将以上代码进行优化，增强可读性
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
// 手动封装一个isReactive()
// 区分reactive和readonly
// export function isReactive(value) {
//     return value["is_reactive"];
// }
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
// 手动封装一个shallowReadonly
function shallowReadonly(raw) {
    console.log(raw);
    return createActiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, eventName, ...args) {
    // console.log(eventName, ...args);
    const { props } = instance;
    const handlerName = handleEventName(eventName);
    const handler = props[handlerName];
    // console.log(handlerName)
    // 执行事件的回调函数
    // if (handler) {
    //     handler();
    // }
    // 或者
    handler && handler(...args);
}
// 根据转换后的eventName从props中获取对应属性的值（根据事件名获取对应事件的回调函数）
// 即传入时（转换前）：
//  emit('add', 1, 2);
//  emit('add-num', 1, 2);
// "add" "add-num"
// 转换后
// onAdd onAddNum
// 从Props中获取对应的事件回调函数
// props
// {
//     onAdd(a, b, c) {
//         console.log('onAdd', a, b, c)
//     },
//     // 即
//     // onAdd = (a, b, c) => console.log('onAdd', a, b, c)
//     onAddNum(a, b, c) {
//         console.log('onAddNum', a, b, c)
//     }
// }
function handleEventName(eventName) {
    // add→ Add   add-num → Add-num
    const capitalizeFirstLetter = (key) => key.charAt(0).toUpperCase() + key.slice(1);
    // onAdd  onAdd-num
    const handleKey = (key) => key ? "on" + capitalizeFirstLetter(key) : "";
    // 支持例如add-num的写法
    // 将例如add-num转换为addNum，然后依次调用capitalizeFirstLetter和handleKey得到onAddNum
    const camelize = (key) => {
        return key.replace(/-(\w)/g, (_, c) => {
            return c ? c.toUpperCase() : "";
        });
    };
    // onAdd onAddNum
    return handleKey(camelize(eventName));
}

// export function initSlots(instance, children) {
//     // 传入的slots可能为单个对象，也可能为多个对象组成的数组（单个slots或者多个slots）
//     // instance.slots = Array.isArray(children) ? children : [children];
//     // 同时实现可以指定slots的渲染位置的需求
//     const slots = {};
//     // key为slot的名字，value为对应的slot
//     for (const key in children) {
//         const value = children[key];
//         slots[key] = Array.isArray(value) ? value : [value];;
//     }
//     instance.slots = slots;
// }
// 将以上代码进行抽离优化
function initSlots(instance, children) {
    // 只有当children为slot类型时才进行相应插槽的处理
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slots[key] = normalizeSlotValue(value);
        // 同时实现作用域插槽
        // 使用value(args)表示作用域插槽，传递了args参数，否则表示普通或者具名插槽
        slots[key] = args => normalizeSlotValue(args ? value(args) : value);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 手动封装一个ref
// 对于ref(raw)
// 使用typeof对raw进行判单
// 如果raw为一个基本类型的值，则不对其进行转换，通过ref()返回的对象get或者set value时操作的是raw本身，通过进行依赖收集或者触发依赖的操作
// 如果raw为一个引用类型的值，则先通过reactive将其转换为一个响应式对象，通过ref()返回的对象get或者set value时操作的是转换后的那个响应式对象
class RefImpl {
    constructor(value) {
        // 是否为ref的标志
        this.__v_isRef = true;
        this._rawValue = value;
        // 如果传入给ref(value)中的参数value为一个对象，则需要先将其通过reactive进行转换
        // this._value = isObject(value) ? reactive(value) : value;
        // 抽离可复用的代码，将上行代码抽离
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 依赖收集
        trackEffect(this.dep);
        return this._value;
    }
    set value(newVal) {
        // 如果newVal和之前的值相同，则不进行值的修改和依赖的触发
        // if (Object.is(newVal, this._value)) return;
        // 将Object.is(newVal, this._value)抽离到shared下的index.ts文件中，用于作为公共工具
        if (!hasChanged(this._rawValue, newVal))
            return;
        // 如果传入给ref()中的参数value或者newVal为一个对象，对比hasChanged时使用reactive转换前的原始对象_rawValue和newVal进行对比
        this._rawValue = newVal;
        // this._value = isObject(newVal) ? reactive(newVal) : newVal;
        // 抽离可复用的代码，将上行代码抽离
        this._value = convert(newVal);
        // 触发依赖
        triggerEffect(this.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
// 手动封装一个ref
function ref(value) {
    return new RefImpl(value);
}
// 手动封装一个isRef
function isRef(ref) {
    // 添加!!，防止最后返回例如undefined的情况
    return !!(ref === null || ref === void 0 ? void 0 : ref.__v_isRef);
}
// 手动封装一个unRef
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 手动封装一个proxyRefs
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    // console.log(parent)
    // 基于虚拟节点对象创建一个组件实例对象并返回
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        // provides: {},
        // 实现跨组件
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        update: () => { },
        nextVnode: null,
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 实现组件的props功能
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 获取原始组件中的setup函数的返回值，并进行处理
function setupStatefulComponent(instance) {
    // 获取原始组件（转换为虚拟节点前的组件）
    const component = instance.type;
    //为组件实例上添加一个proxy代理对象属性，代理那个包含有组件中公共属性的对象
    // 实现在组件中的render()函数中能够访问组件的setup()函数返回的对象中的属性，例如this.msg 
    // 实现对组件中公共属性的访问，例如$el、$data
    // instance.proxy = new Proxy({}, {
    //     get(target, key) {
    //         // setupState的值为组件中setup函数的返回的那个对象，其中包含了在setup中创建的数据
    //         const { setupState } = instance;
    //         if (key in setupState) {
    //             return setupState[key];
    //         }
    //         // 获取元素虚拟节点的那个DOM元素
    //         if (key === '$el') {
    //             return instance.vnode.elem;
    //         }
    //     }
    // });
    // 将以上代码进行优化，抽离到src/componentPublicInstance.ts文件中的PublicInstanceProxyHandlers对象中
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // 获取原始组件中的setup
    const { setup } = component;
    if (setup) {
        // 用于实现getCurrentInstance
        // currentInstance = instance;
        // 优化
        setCurrentInstance(instance);
        // 获取到的props对象只读，不可被修改，使用shallowReadonly()进行封装
        // const setupResult = setup(shallowReadonly(instance.props));
        // 实现props和emit的功能
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        // 根据在创建组件时的书写习惯，setup()函数可能返回一个函数，也可能返回一个对象
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO 实现一个对setupResult的类型为一个函数时的处理逻辑
    if (typeof setupResult === 'object') {
        // 将组件中setup()函数的返回值赋值给组件实例中的setupState属性
        // instance.setupState = setupResult;
        // 解包使用ref封装的响应式对象，获取.value值
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    // 如果组件上存在render函数，则调用该render函数
    if (component.render) {
        instance.render = component.render;
    }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存储数据
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 实现中间组件能够提供属于自己的同名依赖，例如foo
        // 第一次获取时进行初始化
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // 将数据的key和value存储到组件实例的provides对象上
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 获取数据
    // 从当前组件的上一级组件（父组件）的组件实例的provides对象中获取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        // 实现获取依赖时能够提供默认值的功能
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// 手动封装一个createApp
// 原始组件 → 虚拟节点对象 → 组件实例对象
// import { render } from './renderer';
// 解决导入render时报错的问题（因为render不再导出了）
function createAppAPI(render) {
    // 接收一个根组件作为参数
    return function createApp(rootComponent) {
        // 最后返回一个app对象，其中包含一个mount方法，将根组件挂载到根容器上
        return {
            mount(rootContainer) {
                // 先将根组件转换为虚拟节点vnode
                // 然后以后的操作的基于vnode进行
                const vnode = createVNode(rootComponent);
                // 将vnode渲染到根容器上
                render(vnode, rootContainer);
            },
        };
    };
}
// // 接收一个根组件作为参数
// export function createApp(rootComponent) {
//     // 最后返回一个app对象，其中包含一个mount方法，将根组件挂载到根容器上
//     return {
//         mount(rootContainer) {
//             // 先将根组件转换为虚拟节点vnode
//             // 然后以后的操作的基于vnode进行
//             const vnode = createVNode(rootComponent);
//             // 将vnode渲染到根容器上
//             render(vnode, rootContainer);
//         },
//     }
// }

// 求最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 判断组件是否需要更新
function shouldUpdateComponent(oldVnode, newVnode) {
    // 当组件的props值发生更改时才更新组件
    const { props: oldProps } = oldVnode;
    const { props: newProps } = newVnode;
    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            return true;
        }
    }
    return false;
}

// 用于实现一个自定义渲染接口，接收一个options对象作为参数，其中包含多个配置项
function createRender(options) {
    const { 
    // 解构并重命名
    createElement: hostCreateElement, handleProps: hostHandleProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 主要是调用patch方法
        patch(null, vnode, container);
    }
    // 增加区分组件的初始化和组件更新的逻辑
    // oldVnode : 更新前的虚拟节点
    // newVnode : 更新后的虚拟节点
    // 如果不存在oldVnode作为初始化，反之为更新
    function patch(oldVnode, newVnode, container = null, parentComponent = null, anchor = null) {
        // 区分组件虚拟节点类型和元素虚拟节点类型的逻辑
        // 通过原始组件在console.log中的结果值判断
        // if (typeof vnode.type === 'string') {
        //     // 元素虚拟节点类型
        //     processElement(vnode, container);
        // } else if (isObject(vnode.type)) {
        //     // 如果虚拟节点为组件类型
        //     // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
        //     // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        //     processComponent(vnode, container);
        // }  
        // 将上述代码进行优化
        // 使用ShapeFlags进行位运算的判断
        const { shapeFlag, type } = newVnode;
        // // 判断是否为元素虚拟节点类型
        // if (shapeFlag & ShapeFlags.ELEMENT) {
        //     // 元素虚拟节点类型
        //     processElement(vnode, container);
        //     // 判断是否为组件虚拟节点类型
        // } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        //     // 如果虚拟节点为组件类型
        //     // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
        //     // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        //     processComponent(vnode, container);
        // }
        // 同时考虑Fragment虚拟节点和文本虚拟节点的情况
        switch (type) {
            // Fragment虚拟节点
            case Fragment:
                processFragment(oldVnode, newVnode, container, parentComponent);
                break;
            case Text:
                processText(oldVnode, newVnode, container);
                break;
            default:
                // 判断是否为元素虚拟节点类型
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 元素虚拟节点类型
                    processElement(oldVnode, newVnode, container, parentComponent, anchor);
                    // 判断是否为组件虚拟节点类型
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 如果虚拟节点为组件类型
                    // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
                    // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
                    processComponent(oldVnode, newVnode, container, parentComponent);
                }
        }
    }
    function processText(oldVnode, newVnode, contanier) {
        const { children } = newVnode;
        const textNodeElem = (newVnode.elem = document.createTextNode(children));
        contanier.append(textNodeElem);
    }
    function processFragment(oldVnode, newVnode, container, parentComponent) {
        // 其本质就是把片段当作一个或多个children节点，然后将它们通过调用patch来渲染到父元素上（容器）
        mountChildren(newVnode.children, container, parentComponent);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach(child => {
            patch(null, child, container, parentComponent, null);
        });
    }
    function processComponent(oldVnode, newVnode, container, parentComponent) {
        if (!oldVnode) {
            mountComponent(newVnode, container, parentComponent);
        }
        else {
            updateComponent(oldVnode, newVnode);
        }
    }
    function updateComponent(oldVnode, newVnode) {
        const instance = (newVnode.component = oldVnode.component);
        if (shouldUpdateComponent(oldVnode, newVnode)) {
            // console.log("instance",instance);
            instance.nextVnode = newVnode;
            instance.update();
        }
        else {
            newVnode.elem = oldVnode.elem;
            instance.vnode = newVnode;
        }
    }
    function processElement(oldVnode, newVnode, container, parentComponent, anchor) {
        if (!oldVnode) {
            mountElement(newVnode, container, parentComponent, anchor);
        }
        else {
            patchElement(oldVnode, newVnode, container, parentComponent, anchor);
        }
    }
    function patchElement(oldVnode, newVnode, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("old", oldVnode);
        console.log("new", newVnode);
        const oldProps = oldVnode.props || EMPTY_OBJ;
        const newProps = newVnode.props || EMPTY_OBJ;
        const elem = (newVnode.elem = oldVnode.elem);
        patchChildren(oldVnode, newVnode, elem, parentComponent, anchor);
        patchProps(elem, oldProps, newProps);
    }
    // 比较新旧children
    function patchChildren(oldVnode, newVnode, container, parentComponent, anchor) {
        const oldShapeFlag = oldVnode.shapeFlag;
        const newShapeFlag = newVnode.shapeFlag;
        const oldChildren = oldVnode.children;
        const newChildren = newVnode.children;
        // console.log(oldShapeFlag, newShapeFlag)
        // 情况2 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为text
        if (newShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) { /*如果新的children为text类型*/
            // if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {/*如果老的children为array类型*/
            //     // 清空老的数组类型的children
            //     unmountChildren(oldVnode.children);
            //     // 设置新的text类型的children
            //     hostSetElementText(container, newChildren);
            //     // 情况3 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为text
            // } else {
            //     if (oldChildren !== newChildren) {
            //         hostSetElementText(container, newChildren);
            //     }
            // }
            // 优化以上代码
            // 情况2
            if (oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(oldVnode.children);
            }
            // 情况2，3
            if (oldChildren !== newChildren) {
                // console.log(oldChildren, newChildren)
                hostSetElementText(container, newChildren);
            }
        }
        else {
            // 情况1 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为array
            if (oldShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 清除旧的children文本虚拟节点
                hostSetElementText(container, "");
                // 挂载新的children数组虚拟节点
                mountChildren(newChildren, container, parentComponent);
                // 情况4 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为array
            }
            else {
                patchKeyedChildren(oldChildren, newChildren, container, parentComponent, anchor);
            }
        }
    }
    // diff算法
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent, parentAnchor) {
        const newChildrenLength = newChildren.length;
        let i = 0;
        // 旧新children数组最后一个值的索引
        let oe = oldChildren.length - 1;
        let ne = newChildrenLength - 1;
        // 判断两个虚拟节点是否相同的逻辑
        function isSameVnodeType(vnode1, vnode2) {
            // 判断虚拟节点的类型以及虚拟节点所对应的组件的key值
            return vnode1.type === vnode2.type && vnode1.key === vnode2.key;
        }
        // 指针的移动和节点对比阶段
        // 指针从两端开始进行移动
        // 1.从左侧开始对比，i指针向右移动，遇到不相同的节点时停止对比
        while (i <= oe && i <= ne) {
            const oldVnode = oldChildren[i];
            const newVnode = newChildren[i];
            if (isSameVnodeType(oldVnode, newVnode)) {
                patch(oldVnode, newVnode, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // console.log(i);
        // 2.从右侧开始对比，oe和ne指针向左移动，遇到不同的节点时停止对比
        while (i <= oe && i <= ne) {
            const oldVnode = oldChildren[oe];
            const newVnode = newChildren[ne];
            if (isSameVnodeType(oldVnode, newVnode)) {
                patch(oldVnode, newVnode, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            // 通过向右移动oe和ne指针
            oe--;
            ne--;
        }
        // console.log(i, oe, ne)
        // 处理节点，在不同节点的区域内进行新节点的添加或者旧节点的删除或修改操作
        // 一、处理两端-实现新children中节点的添加或者旧children中节点的删除
        // 如果新的children虚拟节点长度大于旧的-添加新的节点
        // 确定中间的区域为 oe < i <= ne
        // 添加新节点
        if (i > oe) {
            if (i <= ne) {
                const nextPos = ne + 1;
                // 指定插入新的节点的位置
                const anchor = nextPos < newChildrenLength ? newChildren[nextPos].elem : null;
                // 可能添加多个节点
                while (i <= ne) {
                    patch(null, newChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }
            // 删除旧节点
            // 如果旧的children虚拟节点长度大于新的-删除节点
            // 确定中间的区域为 ne < i <= oe
            // 删除旧的children中i位置的那个节点
        }
        else if (i > ne) {
            while (i <= oe) {
                hostRemove(oldChildren[i].elem);
                i++;
            }
            // 二、处理中间节点-实现新children中新节点的添加或旧children中旧节点的删除或修改
        }
        else {
            // 确定中间要进行处理的节点区域
            // 旧新children中要进行比较的区域结束位置分别为oe、ne
            let os = i; // 旧children中要进行比较的起始位置
            let ns = i; // 新children中要进行比较的起始位置
            let toBePatched = ne - ns + 1; //记录新children中要添加或修改的节点数量
            let patched = 0; //记录新children中已经被添加或修改的节点数量
            let moved = false; //控制新children中是否存在需要移动的节点
            let maxNewIndexSoFar = 0; //记录新children中要处理的节点的最大顺序值（要处理的节点的数量 - 1）
            // 通过提供给节点的key属性进行比较
            // 其思路为将新children中要进行对比的节点区域中的所有节点的key以及相应的索引i存入映射表中
            // 然后在旧children中将要进行对比的节点区域中所有的节点进行遍历，看看在映射表中是否存在相应的key（如果节点相同的key相同，则在映射表中能找到）
            // 能找到则说明是已存在的，要被修改或保留；不能找到则说明是要被删除的，然后在映射表中所有新的key所对应的节点都是要新建的
            // 建立新children中节点的key和节点的索引i的映射表
            const keyToNewIndexMap = new Map();
            //解决处理中间节点时需要移动节点位置的情况
            const newIndexToOldIndexArray = new Array(toBePatched); // 存储所有要处理的中间节点在新children中的索引值
            // 初始化，如果值为0，表示索引要处理的中间节点中第i个位置处的节点在旧的children中不存在，即需要新建的节点
            // 反之，如果例如在newIndexToOldIndexArray中索引为2的位置处值为5，则表示在新的children中第6个节点是需要进行处理的，且在节点在所有要处理的节点中为第3个
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexArray[i] = 0;
            }
            // 遍历新children中要对比的区域节点的key并将其对应的索引i存入映射表中
            for (let i = ns; i <= ne; i++) {
                const newChild = newChildren[i];
                keyToNewIndexMap.set(newChild.key, i);
            }
            // 遍历旧children中要对比的区域节点，依次比较key值
            for (let i = os; i <= oe; i++) {
                // 取出当前进行比较的旧节点
                const oldChild = oldChildren[i];
                // 如果新children中要被添加或修改的节点已经处理完毕了，但是还是调用了patch方法导致patched++
                // 当patched >= toBePatched时说明旧的children中存在要被移除的节点
                if (patched >= toBePatched) {
                    // 直接将当前旧children中的节点移除
                    // 跳出后面的逻辑，进入下次循环
                    hostRemove(oldChild.elem);
                    continue;
                }
                let newIndex;
                if (oldChild.key !== null) {
                    // 方式一：通过提供给节点的key属性进行比较
                    newIndex = keyToNewIndexMap.get(oldChild.key);
                }
                else {
                    // 方式二；通过遍历进行比较
                    for (let j = ns; j <= ne; j++) {
                        if (isSameVnodeType(oldChild, newChildren[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 不能找到则说明是要被删除的
                    hostRemove(oldChild.elem);
                }
                else {
                    // 能找到则说明是已存在的
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 给newIndexToOldIndexArray赋值，记录在新的children中所有要进行处理的节点的索引
                    newIndexToOldIndexArray[newIndex - ns] = i + 1;
                    patch(oldChild, newChildren[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 求取newIndexToOldIndexArray中的最长递增子序列（即前后顺序稳定的、不需要移动的节点索引）
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexArray) : []; //返回的数组的值是不需要移动的节点在所有要处理的节点中所对应的顺序
            // 例如[5,3,4]为新children中所有要处理的节点的索引
            // 那么所对应的节点顺序的数组为[0,1,2]，最长递增子序列为[1,2]，即对应的3和4数组
            // let j = 0;
            // for (let i = 0; i < toBePatched; i++) {
            //     if (i !== increasingNewIndexSequence[j]) {
            //         // 需要移动位置的节点对应的顺序
            //     } else {
            //         // 不需要移动位置的节点对应的顺序
            //         j++;
            //     }
            // }
            // 倒序判断和插入节点
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + ns; //所有新children中要处理的节点在要处理的节点中的顺序
                const nextChild = newChildren[nextIndex];
                const anchor = nextIndex + 1 < newChildrenLength ? newChildren[nextIndex + 1].elem : null;
                // console.log("nextChild",nextChild)
                if (newIndexToOldIndexArray[i] === 0) {
                    // 新建或修改节点
                    patch(null, nextChild, container, parentComponent, anchor);
                    // 移动节点
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 要移动位置的节点
                        hostInsert(nextChild.elem, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
        // console.log(i)
    }
    function unmountChildren(ArrayChildren) {
        // console.log("unmount")
        for (let i = 0; i < ArrayChildren.length; i++) {
            // 获取当前children所对应的真实DOM元素
            const elem = ArrayChildren[i].elem;
            // 移除该DOM元素
            hostRemove(elem);
        }
    }
    // 比较新旧Props
    function patchProps(elem, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 处理情况1   foo : value → foo : new-value
            // 处理情况2   foo : value → foo : undefined || null
            // 遍历新的props
            // 取出新的props中所有prop
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                // 比较新旧prop的值
                if (prevProp !== nextProp) {
                    // 触发props的更新
                    hostHandleProps(elem, key, prevProp, nextProp);
                }
            }
            // 处理情况3 foo : value →
            if (oldProps !== EMPTY_OBJ) {
                // 遍历旧的props
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostHandleProps(elem, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // 如果vnode的类型为元素虚拟节点类型
        // 则vnode中type属性对应元素名（例如div）
        // props属性对应元素上的特性名（例如id）
        // children属性对应元素的内容（子元素）（例如文本内容，元素内容）
        // 此时children就分为string和array类型
        // 如果为string类型，则说明children的值就为一个文本值，是当前元素的文本内容
        // 如果为array类型，则说明children的值为一个存放有一个或多个元素虚拟节点（由h函数创建）的数组
        const { type, props, children, shapeFlag } = vnode;
        // 处理type
        // const elem = (vnode.elem = document.createElement(type));
        // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
        // 将以上代码抽离到createElement函数中
        const elem = (vnode.elem = hostCreateElement(type));
        // 处理props
        for (const key in props) {
            const val = props[key];
            // 判断所有的特性中是否存在例如onClick
            // if (key === 'onClick') {
            //     // 处理事件
            //     elem.addEventListener('click', val);
            // } else {
            //     elem.setAttribute(key, val);
            // }
            // 将以上的判断逻辑使用正则进行优化
            // const isOn = (key: string) => /^on[A-Z]/.test(key);
            // if (isOn(key)) {
            //     // 处理事件
            //     const eventName = key.slice(2).toLowerCase();
            //     elem.addEventListener(eventName, val);
            // } else {
            //     elem.setAttribute(key, val);
            // }
            // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
            // 将以上代码抽离到ptachProps函数中
            hostHandleProps(elem, key, null, val);
        }
        // 处理chldren
        handleChildren(children, elem, shapeFlag, parentComponent);
        // 将元素挂载到容器上，使得其在页面上被渲染
        // container.append(elem);
        // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
        // 将以上代码抽离到inset函数中
        hostInsert(elem, container, anchor);
    }
    function handleChildren(children, container, shapeFlag, parentComponent) {
        // children为string类型
        // if (typeof children === 'string') {
        //     container.textContent = children;
        //     // children为array类型
        // } else if(Array.isArray(children)){
        //     // console.log(children);
        //     children.forEach(child => patch(child, container))
        // }
        // 将以上代码进行优化
        // 使用ShapeFlags进行位运算的判断
        // 判断children是否为string类型
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            container.textContent = children;
            // 判断children是否为array类型
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // children为array类型
            // console.log(children);
            children.forEach(child => patch(null, child, container, parentComponent));
        }
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        // 先初始化props和slots，然后获取并处理原始组件中的setup函数的返回值
        setupComponent(instance);
        // 调用原始组件的render()函数，获取其返回的结果值，元素虚拟节点类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        setupRenderEffect(instance, container, vnode);
    }
    function setupRenderEffect(instance, container, vnode) {
        // const { proxy } = instance;
        // // subTree为一个元素类型的虚拟节点
        // const subTree = instance.render.call(proxy);
        // patch(subTree, container, instance);
        // // subTree的elem属性存放的是一个组件虚拟节点转换为元素虚拟节点之后所对应的那个DOM元素，也是通过$el属性将要获取到的值
        // // 将其赋值给组件实例所对应的虚拟节点中的elem属性上
        // vnode.elem = subTree.elem;
        // 实现update
        // 将以上代码放入effect中作为依赖，当值发生更新时触发依赖的收集和依赖触发
        instance.update = effect(() => {
            // 区分页面初始化和更新（组件挂载和更新）
            if (!instance.isMounted) {
                // 初始化
                console.log("初始化");
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                console.log(subTree);
                patch(null, subTree, container, instance);
                vnode.elem = subTree.elem;
                instance.isMounted = true;
            }
            else {
                // 更新
                console.log("更新");
                // 更新组件的props
                const { nextVnode, vnode: oldVnode } = instance;
                if (nextVnode) {
                    nextVnode.elem = oldVnode.elem;
                    updateComponentPreRender(instance, nextVnode);
                }
                const { proxy } = instance;
                // 之前（更新前）的subTree
                const prevSubTree = instance.subTree;
                // console.log(prevSubTree);
                const subTree = instance.render.call(proxy);
                // 更新后的subTree
                instance.subTree = subTree;
                // console.log(subTree);
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    // 解决导入render时报错的问题（因为render不再导出了）
    return {
        createApp: createAppAPI(render)
    };
}
function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.nextVnode = null;
    instance.props = nextVnode.props;
}

// 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
// 在此处实现的是基于DOM自定义元素的创建、特性处理、插入容器元素中的接口，使用的都是DOM中提供的API
// 基于canvas的见example/customRenderer/main.js
// 支持接收参数来传入不同平台中渲染元素时所需要的API
function createElement(type) {
    return document.createElement(type);
}
function handleProps(elem, key, oldVal, newVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 处理事件
        const eventName = key.slice(2).toLowerCase();
        elem.addEventListener(eventName, newVal);
        // 处理情况2 foo : value → foo : undefined || null
    }
    else if (newVal === undefined || newVal === null) {
        elem.removeAttribute(key);
    }
    else {
        elem.setAttribute(key, newVal);
    }
}
function insert(child, container, anchor) {
    // container.append(elem);
    // 实现能够指定child插入的位置的功能，diff算法中的child插入逻辑
    container.insertBefore(child, anchor || null);
}
function remove(childElem) {
    const parentElem = childElem.parentNode;
    if (parentElem) {
        parentElem.removeChild(childElem);
    }
}
function setElementText(container, textChildren) {
    // console.log("container",container,"textChildren",textChildren);
    container.textContent = textChildren;
}
const renderer = createRender({
    createElement,
    handleProps,
    insert,
    remove,
    setElementText,
});
// 解决导入render时报错的问题（因为render不再导出了）
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRender, createTextVnode, effect, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
