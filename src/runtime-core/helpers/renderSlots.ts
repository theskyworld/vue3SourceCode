import { createVNode } from "../VNode";

export function renderSlots(slots, name, args) {
    // return createVNode("div", {}, slots[name]);

    // 同时实现作用域插槽
    const slot = slots[name];

    // args接收通过slots传递的参数
    if (slot && typeof slot === 'function' && args) {
        // 如果slot的类型为function，则说明使用的是作用域插槽，通过函数传递参数
        return createVNode("div", {}, slot(args));
        // 否则使用的是普通插槽或者具名插槽
    } else {
        return createVNode("div", {}, slots[name]);
    }
}