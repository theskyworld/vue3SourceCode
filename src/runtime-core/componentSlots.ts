// export function initSlots(instance, children) {
//     // 传入的slots可能为单个对象，也可能为多个对象组成的数组（单个slots或者多个slots）
//     // instance.slots = Array.isArray(children) ? children : [children];

import { ShapeFlags } from "../shared/ShapeFlags";

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
export function initSlots(instance, children) {
    // 只有当children为slot类型时才进行相应插槽的处理
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
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