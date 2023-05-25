import { h } from '../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {

    // 模板编译后的函数
    render() {
        // 给window的self属性进行赋值，使得可以直接使用例如self.$el对当前组件虚拟节点中的$el属性进行访问
        window.self = this;
        return h(
            "div",
            {
                id: 'root',
                class: ["red", "hard"],
                // 注册一个点击事件
                // 同时会为元素添加一个名为"onClick"的特性
                onClick() {
                    console.log('click');
                },
                // 以上等价于，即添加一个名为onClick的特性，值为一个函数
                // onClick = () => console.log('click');

                onMousedown() {
                    console.log('mousedown')
                }
            },
            // 此时children为string类型
            // "text-test" + this.msg
            // "hello Alice"

            // 此时children为array类型
            // [
            // h("p", { class: 'red' }, 'Alice1'),
            // h("p", { class: 'blue' }, 'Alice2'),
            // h("p", { class : 'green'}, 'Alice3')
            // ],

            // 用于实现组件的props功能
            [
                h('div', {}, "hi," + this.msg),
                h(Foo, {
                    count : 1,
                })
            ]
        );
    },
    setup() {
        return {
            msg: "hello hello",
        }
    }
}