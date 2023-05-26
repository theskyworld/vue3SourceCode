import { h, renderSlots } from "../lib/guide-mini-vue.esm.js";


// 测试props功能
// export const Foo = {
//     setup(props) {
//         console.log(props.count); // 1

//         // 获取到的props只读，不可被修改
//         props.count++;
//         console.log(props.count);
//     },

//     render() {
//         return h('div', {}, "foo:" + this.count)
//     }
// }


//  测试emit功能
// export const Foo = {
//     setup(props, { emit }) {
//         const emitAdd = () => {
//             // console.log('emit add');
//             // emit("add");
//             // 支持传入参数
//             emit("add", 1, 2, 3);
//             // 支持例如add-num的写法
//             emit('add-num',1, 2)
//         };
//         return {
//             emitAdd,
//             name : 'Alice',
//         }
//     },

//     render() {
//             const btn = h(
//                 "button",
//                 {
//                     onClick: this.emitAdd,
//                 },
//                 "emitAdd"
//             );
//             const foo = h("p", {}, "hello " + this.name);
//             return h('div', {}, [foo, btn])
//         }
// }

// 测试slots功能
export const Foo = {
    setup() {
        return {};
    },
    render() {
        const foo = h("p", {}, "foo");

        // return h("div", {}, [
        //     foo,
        //     this.$slots
        // ]);

        // 当传入的slots为单个或者多个（多个slots组成的一个数组时）时
        // return h("div", {}, [
        //     foo,
        //     renderSlots(this.$slots)
        // ])

        // 具名插槽
        // 测试指定slots的渲染位置
        // return h("div", {}, [
            renderSlots(this.$slots, "header"),
            foo,
            renderSlots(this.$slots, 'footer')
        // ])


        // 作用域插槽
        // 传递参数
        const age = 16;
        return h("div", {}, [
            // 传递age参数给App.js组件
            renderSlots(this.$slots, "header", {
                age
            }),
            foo,
            renderSlots(this.$slots, 'footer')
        ])
    }
}