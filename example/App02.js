// 测试provide和inject

import { h, provide, inject } from '../lib/guide-mini-vue.esm.js';


const Provider = {
    name: "Provider",
    setup() {
        provide("foo", "fooValue");
        provide("bar", "barValue");
    },
    render() {
        return h("div", {}, [
            h("p", {}, "Provider"),
            h(Provider02),
        ]);
    },
}

// 测试跨组件
// 测试中间组件能够提供属于自己的同名依赖，例如下面的foo
const Provider02 = {
    name: "Provider",
    setup() {
        provide("foo", "foo02");
        const foo = inject('foo');
        return {
            foo,
        }
    },
    render() {
        return h("div", {}, [
            h("p", {}, `Provider02 foo : ${this.foo}`),
            h(Consumer),
        ]);
    },
}


const Consumer = {
    name: "Consumer",
    setup() {
        const foo = inject("foo");
        const bar = inject("bar");
        // 测试获取依赖时能够提供默认值
        // const baz = inject("baz", 'bazDefault');
        // 支持将函数作为默认值
        const baz = inject("baz", () => 'bazDefault')

        return {
            foo,
            bar,
            baz,
        }
    },

    render() {
        return h("div", {}, `Consumer : -${this.foo} - ${this.bar} - ${this.baz}`);
    }
};


const App =  {
    name: "App",
    setup() { },
    render() {
        return h("div", {}, [
            h("p", {}, "apiInject"),
            h(Provider)
        ])
    }
}

export {
    App
}