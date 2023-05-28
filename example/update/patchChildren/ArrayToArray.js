import { h, ref } from "../../../lib/guide-mini-vue.esm.js";



// // 1.对比左侧
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

// 2.对比右侧
const prevChildren = [
    h("p", { key : "A" }, "A"),
    h("p", { key : "B" }, "B"),
    h("p", { key : "C"}, "C"),
]

const nextChildren = [
    h("p", { key : "D" }, "D"),
    h("p", { key: "E" }, "E"),
    h("p", { key : "B" }, "B"),
    h("p", { key : "C" }, "C"),
]


// 3.对比中间
// 3.1如果新的children虚拟节点长度大于旧的-添加新的节点
// 3.1.1左侧对比，添加到最右侧
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

// 3.1.2右侧对比，添加到最左侧
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

// 3.2如果旧的children虚拟节点长度大于新的-删除节点
// 确定中间的区域为 ne < i <= oe
// 删除旧的children中i位置的那个节点

// 3.2.1左侧对比
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
// const prevChildren = [
//     h("p", { key : "A" }, "A"),
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "C"}, "C"),
// ]

// const nextChildren = [
//     h("p", { key: "B" }, "B"),
//     h("p", { key : "C" }, "C"),
// ]





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