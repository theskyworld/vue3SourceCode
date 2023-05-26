import { h, createTextVnode, getCurrentInstance } from '../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

// 测试props功能
// window.self = null;
// export const App = {

//     // 模板编译后的函数
//     render() {
//         // 给window的self属性进行赋值，使得可以直接使用例如self.$el对当前组件虚拟节点中的$el属性进行访问
//         window.self = this;
//         return h(
//             "div",
//             {
//                 id: 'root',
//                 class: ["red", "hard"],
//                 // 注册一个点击事件
//                 // 同时会为元素添加一个名为"onClick"的特性
//                 onClick() {
//                     console.log('click');
//                 },
//                 // 以上等价于，即添加一个名为onClick的特性，值为一个函数
//                 // onClick = () => console.log('click');

//                 onMousedown() {
//                     console.log('mousedown')
//                 }
//             },
//             // 此时children为string类型
//             // "text-test" + this.msg
//             // "hello Alice"

//             // 此时children为array类型
//             // [
//             // h("p", { class: 'red' }, 'Alice1'),
//             // h("p", { class: 'blue' }, 'Alice2'),
//             // h("p", { class : 'green'}, 'Alice3')
//             // ],

//             // 用于实现组件的props功能
//             [
//                 h('div', {}, "hi," + this.msg),
//                 h(Foo, {
//                     count : 1,
//                 })
//             ]
//         );
//     },
//     setup() {
//         return {
//             msg: "hello hello",
//         }
//     }
// }


// 测试emit功能
// export const App = {
//     name: 'App',
//     render() {
//         return h('div', {}, [
//             h('div', {}, "App"),
//             h(Foo, {
//                 onAdd(a, b, c) {
//                     console.log("onAdd", a, b, c)
//                 },
//                 onAddNum(a, b) {
//                     console.log('onAddNum', a, b)
//                 }
//             })
            
//         ])
//     },
//     setup() {
//         return {};
//     },
// }


// 测试slots功能
export const App = {
    name: "App",
    render() {
        const app = h("div", {}, "App");
        // 传递的children即为传递给Foo.js的slots
        // 可以传递单个或多个slots(多个组成的一个数组)
        // const foo = h(Foo, {}, [
        //     h("p", {}, "hello"),
        //     h("p", {}, "hi")
        // ]
        // );

        // 具名插槽
        // 测试指定slots的位置
        // 此时通过对象的形式将slots进行传递
        // const foo = h(Foo, {}, {
        //     header: h("p", {}, "header"),
        //     footer : h("p", {}, "footer")
        // })


        // 测试作用域插槽，Fragmemnt虚拟节点
        // 接收参数
        // 通过函数的形式接收参数并使用
        // 如果传递的参数存放在一个对象中，需要进行解构
        // const foo = h(Foo, {}, {
        //     header: ({ age }) => h("p", {}, "header" + age),
        //     footer : h("p", {}, "footer")
        // })
        

        // 测试文本虚拟节点
        // const foo = h(Foo, {}, {
        //     header: ({ age }) => [
        //         h("p", {}, "header" + age),
        //         createTextVnode("hello Alice, how are you")
        //     ],
        //     footer : h("p", {}, "footer")
        // })


        // return h("div", {}, [
        //     app,
        //     foo
        // ]);

        // 测试getCurrentInstance()
        return h("div", {}, [h("p", {}, "currentInstance demo"), h(Foo)]);
   
    },
    setup() {
        // 测试getCurrentInstance()
        const instance = getCurrentInstance();
        console.log("App", instance);
        return {

        }
    }
}