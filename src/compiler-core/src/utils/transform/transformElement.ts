import { createVNodeCall, NodeTypes } from "../../ast";
import { CREATE_ELEMENT_BLOCK, OPENBLOCK } from "./runtimeHelpers";


// 实现元素类型中的"const { openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue"部分
export function transformElement(node, context) {
    // const { helper } = context;
    // if (node.type === NodeTypes.ELEMENT) {
    //     helper(OPENBLOCK);
    //     helper(CREATE_ELEMENT_BLOCK);
    // }

    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            // tag
            const vnodeTag = `${node.tag}`;

            // props
            let vnodeProps;

            // children
            const children = node.children;
            let vnodeChildren = children[0];

            node.codegenNode = createVNodeCall(
                context,
                vnodeTag,
                vnodeProps,
                vnodeChildren
            );
        };
  }
}