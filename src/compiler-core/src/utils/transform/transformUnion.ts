import { NodeTypes } from "../../ast"
import { CREATE_ELEMENT_BLOCK, OPENBLOCK, TO_DISPLAY_STRING } from "./runtimeHelpers"


// 实现联合类型中的"const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue"
export function transformUnion(node, context) {
    const { helper } = context
    if (node.type === NodeTypes.ELEMENT) {
        helper(OPENBLOCK);
        helper(CREATE_ELEMENT_BLOCK);
        node.children.forEach((child) => {
            if (child.type === NodeTypes.TEXT) {
                helper(TO_DISPLAY_STRING);
            };
        })
        
    }
}