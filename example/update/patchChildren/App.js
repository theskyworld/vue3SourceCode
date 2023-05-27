import { h } from "../../../lib/guide-mini-vue.esm.js"
import { TextToText } from "./TextToText.js";
import { TextToArray } from "./TextToArray.js";
import { ArrayToText } from "./ArrayToText.js";
import { ArrayToArray } from "./ArrayToArray.js";

export default {
    name: "App",
    setup() { },
    
    render() {
        return h(
            "div",
            { tId: 1 },
            [
                h("p", {}, "主页"),

                // // 情况1 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为array
                h(TextToArray),

                // // 情况2 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为text
                // h(ArrayToText),

                
                // // 情况3 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为text
                // h(TextToText),

                // // 情况4 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为array
                // h(ArrayToArray),
            ]
        )
    }
}