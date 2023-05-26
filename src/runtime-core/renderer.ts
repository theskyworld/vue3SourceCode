import { isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment } from "./helpers/renderSlots";

export function render(vnode, container, parentComponent) {
    // 主要是调用patch方法
    patch(vnode, container, parentComponent);   
}

function patch(vnode, container, parentComponent) {
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
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            // 判断是否为元素虚拟节点类型
            if (shapeFlag & ShapeFlags.ELEMENT) {
                // 元素虚拟节点类型
                processElement(vnode, container, parentComponent);
                // 判断是否为组件虚拟节点类型
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                // 如果虚拟节点为组件类型
                // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
                // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
                processComponent(vnode, container, parentComponent);
            }
    }
}   

function processText(vnode, contanier) {
    const { children } = vnode;
    const textNodeElem = (vnode.elem = document.createTextNode(children));
    contanier.append(textNodeElem);
}

function processFragment(vnode, container, parentComponent) {
    // 其本质就是把片段当作一个或多个children节点，然后将它们通过调用patch来渲染到父元素上（容器）
    mountChildren(vnode, container, parentComponent);
}

function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(child => {
        patch(child, container, parentComponent)
    })
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}

function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}

function mountElement(vnode, container, parentComponent) {
    // 如果vnode的类型为元素虚拟节点类型
    // 则vnode中type属性对应元素名（例如div）
    // props属性对应元素上的特性名（例如id）
    // children属性对应元素的内容（子元素）（例如文本内容，元素内容）
    // 此时children就分为string和array类型
    // 如果为string类型，则说明children的值就为一个文本值，是当前元素的文本内容
    // 如果为array类型，则说明children的值为一个存放有一个或多个元素虚拟节点（由h函数创建）的数组

    const { type, props, children, shapeFlag } = vnode;
    // 处理type
    const elem = (vnode.elem =  document.createElement(type));
    
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
        const isOn = (key: string) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // 处理事件
            const eventName = key.slice(2).toLowerCase();
            elem.addEventListener(eventName, val);
            
        } else {
            elem.setAttribute(key, val);
        }

        
    }

    // 处理chldren
    handleChildren(children, elem, shapeFlag, parentComponent);

    // 将元素挂载到容器上，使得其在页面上被渲染
    container.append(elem); 
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
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = children;
            // 判断children是否为array类型
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // children为array类型
            // console.log(children);
            children.forEach(child => patch(child, container, parentComponent))
        }
}
function mountComponent(vnode, container, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);
    // 先初始化props和slots，然后获取并处理原始组件中的setup函数的返回值
    setupComponent(instance);
    // 调用原始组件的render()函数，获取其返回的结果值，元素虚拟节点类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
    setupRenderEffect(instance, container, vnode);
}

function setupRenderEffect(instance, container, vnode) {
    const { proxy } = instance;
    // subTree为一个元素类型的虚拟节点
    const subTree = instance.render.call(proxy); 
    patch(subTree, container, instance);

    // subTree的elem属性存放的是一个组件虚拟节点转换为元素虚拟节点之后所对应的那个DOM元素，也是通过$el属性将要获取到的值
    // 将其赋值给组件实例所对应的虚拟节点中的elem属性上
    vnode.elem = subTree.elem;
}