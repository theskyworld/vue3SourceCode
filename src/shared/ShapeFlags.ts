// 在path函数的执行过程中存在对元素虚拟节点和组件虚拟节点以及字符串类型的子元素和数组类型的子元素的区分
// 将以上的四种情况存放在一个对象中，可以对其进行查找和修改的操作
// const ShapeFlags = {
//     // 属性的值0表示不是，1表示是
//     element: 0,
//     stateful_component: 0,
//     text_children: 0,
//     array_children : 0,
// }
// 例如在修改时：
// ShapeFlags.stateful_component = 1;
// ShapeFlags.array_children = 1;
// 在查找时
// if (ShapeFlags.element) { };
// if (ShapeFlags.stateful_component) { };


// 但是，通过位运算的方式可以使得上述查找和修改的过程更高效
// 包含四位，零位上为1表示为element，一位上位1表示为stateful_component，二位上为1表示为text_children，三位上为1表示为array_children
// 即：
// 0001  element
// 0010  stateful_component
// 0100  text_children
// 1000  array_children
// 1010  stateful_component  array_children
// 查找或修改时只需要在相应位数上进行操作即可
// 查找时通过&运算符（两个都为1，结果才为1）
// 例如想要查找element，则将以上的多种情况都分别&0001，最后只有0001 & 0001的结果才为 0001，代表找到目标
// 例如想要查找text_children，则将以上的多种情况都分别&0100，最后只有0100 & 0100的结果才为 0100，代表找到目标
// 修改时通过|运算符（两个都为0，结果才为0）
// 例如将element修改为element text_children，则直接0001 | 0100，结果为0101，表示element text_children
// 将stateful_component修改为stateful_component array_children，则直接0010 | 1000，结果为1010，表示stateful_component  array_children

export const enum ShapeFlags {
    ELEMENT = 1, // 0001
    STATEFUL_COMPONENT = 1 << 1, // 0010
    TEXT_CHILDREN = 1 << 2, // 0100
    ARRAY_CHILDREN = 1 << 3, // 1000
    //  用于实现插槽（children类型为slot）
    SLOT_CHILDREN = 1 << 4,  // 10000
}