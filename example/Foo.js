import { h } from "../lib/guide-mini-vue.esm.js";

export const Foo = {
    setup(props) {
        console.log(props.count); // 1

        // 获取到的props只读，不可被修改
        props.count++;
        console.log(props.count);
    },

    render() {
        return h('div', {}, "foo:" + this.count)
    }
}