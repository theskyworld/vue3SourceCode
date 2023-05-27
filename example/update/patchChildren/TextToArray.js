import { h, ref } from "../../../lib/guide-mini-vue.esm.js";

const prevChildren = "oldChildren";
const nextChildren = [h("div", {}, "A"), h("div", {}, "B")]


export const TextToArray = {
    name : "TextToArray",
    setup() {
        const text = "TextToArray"
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