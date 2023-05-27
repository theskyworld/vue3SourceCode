import { h, ref } from "../../../lib/guide-mini-vue.esm.js";

const nextChildren = "newChildren";
const prevChildren = "oldChildren"


export const TextToText = {
    name : "TextToText",
    setup() {
        const text = "TextToText"
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