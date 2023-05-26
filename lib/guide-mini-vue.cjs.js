'use strict';

const extend = Object.assign;
const isObject = value => {
    return value !== null && typeof value === 'object';
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

const publicPropertiesMap = {
    $el: instance => instance.vnode.elem,
    // $slots: instance => instance.vnode.children, //获取当前虚拟节点上的children
    $slots: instance => instance.slots,
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
    return;
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

let currentInstance = null;
function createComponentInstance(vnode) {
    // 基于虚拟节点对象创建一个组件实例对象并返回
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
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
        instance.setupState = setupResult;
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

function createVNode(type, props, children) {
    // 主要是返回一个vnode对象
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        elem: null, // 存储元素虚拟节点的那个DOM元素
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

function render(vnode, container) {
    // 主要是调用patch方法
    patch(vnode, container);
}
function patch(vnode, container) {
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
    const { shapeFlag, type } = vnode;
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
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            // 判断是否为元素虚拟节点类型
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 元素虚拟节点类型
                processElement(vnode, container);
                // 判断是否为组件虚拟节点类型
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 如果虚拟节点为组件类型
                // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
                // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
                processComponent(vnode, container);
            }
    }
}
function processText(vnode, contanier) {
    const { children } = vnode;
    const textNodeElem = (vnode.elem = document.createTextNode(children));
    contanier.append(textNodeElem);
}
function processFragment(vnode, container) {
    // 其本质就是把片段当作一个或多个children节点，然后将它们通过调用patch来渲染到父元素上（容器）
    mountChildren(vnode, container);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(child => {
        patch(child, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 如果vnode的类型为元素虚拟节点类型
    // 则vnode中type属性对应元素名（例如div）
    // props属性对应元素上的特性名（例如id）
    // children属性对应元素的内容（子元素）（例如文本内容，元素内容）
    // 此时children就分为string和array类型
    // 如果为string类型，则说明children的值就为一个文本值，是当前元素的文本内容
    // 如果为array类型，则说明children的值为一个存放有一个或多个元素虚拟节点（由h函数创建）的数组
    const { type, props, children, shapeFlag } = vnode;
    // 处理type
    const elem = (vnode.elem = document.createElement(type));
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
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // 处理事件
            const eventName = key.slice(2).toLowerCase();
            elem.addEventListener(eventName, val);
        }
        else {
            elem.setAttribute(key, val);
        }
    }
    // 处理chldren
    handleChildren(children, elem, shapeFlag);
    // 将元素挂载到容器上，使得其在页面上被渲染
    container.append(elem);
}
function handleChildren(children, container, shapeFlag) {
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
        children.forEach(child => patch(child, container));
    }
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    // 先初始化props和slots，然后获取并处理原始组件中的setup函数的返回值
    setupComponent(instance);
    // 调用原始组件的render()函数，获取其返回的结果值，元素虚拟节点类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
    setupRenderEffect(instance, container, vnode);
}
function setupRenderEffect(instance, container, vnode) {
    const { proxy } = instance;
    // subTree为一个元素类型的虚拟节点
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // subTree的elem属性存放的是一个组件虚拟节点转换为元素虚拟节点之后所对应的那个DOM元素，也是通过$el属性将要获取到的值
    // 将其赋值给组件实例所对应的虚拟节点中的elem属性上
    vnode.elem = subTree.elem;
}

// 手动封装一个createApp
// 原始组件 → 虚拟节点对象 → 组件实例对象
// 接收一个根组件作为参数
function createApp(rootComponent) {
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
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.renderSlots = renderSlots;
