import { NodeTypes } from "../ast";

export function isEmpty(arr : Array<any>) {
    return arr.length === 0;
}

export function isText(node) {
    return (
      node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
    );
}