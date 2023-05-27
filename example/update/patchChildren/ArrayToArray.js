import { h } from "../../../lib/guide-mini-vue.esm.js";

export const ArrayToArray = {
    setup() {
        const text = "ArrayToArray";
        return {
            text,
        }
    },

    render() {
        return h("div", {}, [
            h("h3", {}, this.text),
        ])
    }   
}