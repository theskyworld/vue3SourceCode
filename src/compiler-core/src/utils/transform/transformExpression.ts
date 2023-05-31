import { NodeTypes } from "../../ast";

export function transformExpression(node, context) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = processExpression(node.content, context);
    }
}
function processExpression(node, context) {
    node.content = `_ctx.${node.content}`;
    return node;
}