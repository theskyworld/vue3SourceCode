import { isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
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
    if (shapeFlag & ShapeFlags.ELEMENT) {
        // 元素虚拟节点类型
        processElement(vnode, container);
        // 判断是否为组件虚拟节点类型
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
    const elem = (vnode.elem =  document.createElement(type));
    
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
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = children;
            // 判断children是否为array类型
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // children为array类型
            // console.log(children);
            children.forEach(child => patch(child, container))
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