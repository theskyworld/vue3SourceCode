import { CREATE_ELEMENT_BLOCK, OPENBLOCK } from "./utils/transform/runtimeHelpers";
import { isEmpty } from "./utils/utils";


export const enum NodeTypes {
    INTERPOLATION,
    SIMPLE_EXPRESSION,
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND_EXPRESSION,
}

export function createVNodeCall(context, tag, props, children) {
  // 实现元素和联合类型中的"const { openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue"部分
  context.helper(CREATE_ELEMENT_BLOCK);
  context.helper(OPENBLOCK);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}