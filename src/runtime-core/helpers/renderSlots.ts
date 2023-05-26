import { createVNode } from "../VNode";

export const Fragment = Symbol('Fragment');
export const Text = Symbol("Text");

export function renderSlots(slots, name, args) {
    // return createVNode("div", {}, slots[name]);

    // 同时实现作用域插槽
    console.log("slots",slots);
    
    const slot = slots[name];
    console.log("slot",slot)
    if (slot) {
        console.log(name,typeof slot)
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