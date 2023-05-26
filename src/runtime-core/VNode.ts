import { ShapeFlags } from "../shared/ShapeFlags";

export function createVNode(type, props?, children?) {
    // 主要是返回一个vnode对象
    const vnode = {
        type, //根组件，调用createVNode()时传入的rootComponent参数的值
        props, // 组件的props
        children,
        shapeFlag : getShapeFlag(type), // 用于判断虚拟节点的类型和虚拟节点的子节点（children）的类型
        elem : null, // 存储元素虚拟节点的那个DOM元素
    };
    // 对children进行类型判断
    if (typeof children === 'string') {
        // vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
        // 或者
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        // vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN;
        // 或者
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    // 对children是否为slot类型的判断
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }

    return vnode;
}

// 对虚拟节点进行类型判断
function getShapeFlag(type) {
    return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}