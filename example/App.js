import { h } from '../lib/guide-mini-vue.esm.js';

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
                class : ["red", "hard"]
            },
            // 此时children为string类型
            // "text-test" + this.msg
            // "hello Alice"

            // 此时children为array类型
            [
            h("p", { class: 'red' }, 'Alice1'),
            h("p", { class: 'blue' }, 'Alice2'),
            h("p", { class : 'green'}, 'Alice3')
            ]
        );
    },
    setup() {
        return {
            msg: "hello hello",
        }
    }
}