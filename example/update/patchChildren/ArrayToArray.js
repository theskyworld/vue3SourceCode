import { h, ref } from "../../../lib/guide-mini-vue.esm.js";


// 一、处理两端
// 指针的移动和节点对比阶段
// // 1.对比左侧，i指针向右移动
// a b c
// a b d e

// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
//     h("p", { key : "C"}, "C"),
// ]

// const nextChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "D" }, "D"),
//     h("p", { key : "E" }, "E"),
// ]

// 2.对比右侧，oe和ne指针向左移动
// a b c
// d e b c

// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
//     h("p", { key : "C"}, "C"),
// ]

// const nextChildren = [
//     h("p", { key : "D" }, "D"),
//     h("p", { key: "E" }, "E"),
//     h("p", { key : "B" }, "B"),
//     h("p", { key : "C" }, "C"),
// ]


// 节点的处理节点（实现新children中节点的添加或者旧children中节点的删除）
// 1.如果新的children虚拟节点长度大于旧的-添加新的节点
// 1.1左侧开始对比，添加到最右侧
// a b
// a b c d
// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
// ]

// const nextChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
//     h("p", { key: "C" }, "C"),
//     h("p", { key : "D"}, "D"),
// ]

// 1.2右侧开始对比，添加到最左侧
// a b
// d c a b
// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
// ]

// const nextChildren = [
//     h("p", { key : "D"}, "D"),
//     h("p", { key : "C"}, "C"),
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
// ]

// 2.如果旧的children虚拟节点长度大于新的-删除节点
// 确定中间的区域为 ne < i <= oe
// 删除旧的children中i位置的那个节点

// 2.1左侧对比
// a b c
// a b
// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "C"}, "C"),
// ]

// const nextChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key : "B" }, "B"),
// ]

// 3.2.2右侧对比
// a d b c
// b c
// const prevChildren = [
//     h("p", { key: "A" }, "A"),
//     h("p", { key : "D" }, "D"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "C"}, "C"),
// ]

// const nextChildren = [
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "C" }, "C"),
// ]



// 二、处理中间-实现新children中新节点的添加或旧children中旧节点的删除或修改
// 中间，不是绝对的中间，指的是先从左右两端进行比较，排除两端相同节点后的区域，如果存在例如第一个索引位置节点就不同的情况，那么此时中间也从这第一个索引位置开始
// 3.1-实现新children中新节点的添加或旧节点的修改
// 3.1.1要处理的节点数量前后一样的情况
// a b c d f g
// a b e c f g
// 删除d节点，修改c节点（节点属性前后发生了变化），添加e节点

// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key: "C" , id : 'c-prev' }, "C"),
//     h("p", { key : "D" }, "D"),
//     h("p", { key: "F" }, "F"),
//     h("p", { key : "G"}, "G"),
// ]

// const nextChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "E" }, "E"),
//     h("p", { key: "C" , id : 'c-next' }, "C"),
//     h("p", { key: "F" }, "F"),
//     h("p", { key : "G"}, "G"),
// ]



// 3.1.2要处理的节点数量旧的大于新的情况
// a b c e d f g
// a b e c f g
// 先确定好新children中要添加的节点和要修改的节点
// 然后记录旧children中要被移除的节点数量，移除时一次性移除

// const prevChildren = [
//     h("p", { key : "A" , id : "a-prev"}, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key: "C" , id : 'c-prev' }, "C"),
//     h("p", { key: "D" }, "D"),
//     h("p", { key : "E" }, "E"),
//     h("p", { key: "F" }, "F"),
//     h("p", { key : "G"}, "G"),
// ]

// const nextChildren = [
//     h("p", { key : "A" , id : "a-next"}, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "E" }, "E"),
//     h("p", { key: "C" , id : 'c-next' }, "C"),
//     h("p", { key: "F" }, "F"),
//     h("p", { key : "G"}, "G"),
// ]


// 3.2实现新children中新节点的位置移动

export const ArrayToArray = {
    name : "ArrayToArray",
    setup() {
        const text = "ArrayToArray"
        const isChange = ref(false);
        window.isChange = isChange;

        return {
            isChange,
            text
        }
    },

    render() {
        const self = this;
        const title = h("h3", {}, this.text);

        return h(
            "div",
            {},
            self.isChange ? nextChildren :
                            prevChildren,
        )
    }
}