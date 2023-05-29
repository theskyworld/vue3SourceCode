import { h, ref } from "../../../lib/guide-mini-vue.esm.js";
import { Child } from "./Child.js"

export const App = {
    name: "App",
    setup() {
        const msg = ref("123");
        const count = ref(1);

        window.msg = msg;
        window.count = count;

        const changeChildProps = () => {
            msg.value = `${Math.random() * 5}`;
        };
        const changeCount = () => count.value++;

        return {
            msg,
            count,
            changeChildProps,
            changeCount,
        }
    },

    render() {
        return h(
            "div",
            {},
            [
                h('div', {}, "hello"),
                h(
                    "button",
                    {
                        onClick: this.changeChildProps,
                    },
                    "change child props"
                ),
                h(Child, {
                    msg: this.msg,
                }),
                h(
                    "button",
                    {
                        onClick: this.changeCount
                    },
                    "change self count"
                ),
                h("p", {}, "count :" + this.count),
            ]
        )
    }
}