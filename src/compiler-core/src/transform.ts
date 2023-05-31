// 支持接收options参数，从函数外部来指定函数内部对数据的处理方式

import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./utils/transform/runtimeHelpers";

// 实现函数的可测试性，函数的插件体系
export function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 遍历语法树，深度优先搜索算法
    traverseNode(root, context);

    createRootCodegen(root);

    root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root) {
    // 获取语法树中的入口节点（root节点的第一个子节点，并赋值给root.codegenNode）
    // 以后处理语法树都基于入口节点处理
    // root.codegenNode = root.children[0];

    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    } else {
        root.codegenNode = root.children[0];
    }
}

function createTransformContext(root : any, options : any) : any {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    }

    return context;
}


function traverseNode(node, context) {

    // 变动点
    // console.log(node); //打印遍历到的节点
    const nodeTransforms = context.nodeTransforms;
    const exitFns : any = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
         // 修改text节点中的内容
        // 通过传入的options来对节点进行特定的修改
        // transform(node, context);
        const onExit = transform(node, context);
        if (onExit) exitFns.push(onExit);
    }

    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
            break;
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context);
            break;
        default:
            break;
    }

    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
    // 将函数的变动点和稳定点分离
    // 稳定点
    // traverseChildren(node, context);
}

function traverseChildren(node, context) {
    const children = node.children;

    // if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    // }
}