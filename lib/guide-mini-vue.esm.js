const publicPropertiesMap = {
    $el: instance => instance.vnode.elem, // 获取当前元素虚拟节点的那个DOM元素
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState的值为组件中setup函数的返回的那个对象，其中包含了在setup中创建的数据
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
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

function createComponentInstance(vnode) {
    // 基于虚拟节点对象创建一个组件实例对象并返回
    const component = {
        vnode,
        type: vnode.type,
        setupState: {}, // 存储原始组件中setup函数的返回值对象
    };
    return component;
}
function setupComponent(instance) {
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
        const setupResult = setup();
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
    const { shapeFlag } = vnode;
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
        elem.setAttribute(key, val);
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
    return vnode;
}
// 对虚拟节点进行类型判断
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

export { createApp, h };