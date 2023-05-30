// 支持接收options参数，从函数外部来指定函数内部对数据的处理方式
// 实现函数的可测试性，函数的插件体系
export function transform(root, options) {
    const context = createTransformContext(root, options);
    // 遍历语法树，深度优先搜索算法
    traverseNode(root, context);
}

function createTransformContext(root : any, options : any) : any {
    const context = {
        root,
        nodeTransforms : options.nodeTransforms || [],
    }

    return context;
}


function traverseNode(node, context) {

    // 变动点
    // console.log(node); //打印遍历到的节点
    const nodeTransforms = context.nodeTransforms;
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
         // 修改text节点中的内容
        // 通过传入的options来对节点进行特定的修改
        transform(node);
    }

    // 将函数的变动点和稳定点分离
    // 稳定点
    traverseChildren(node, context);
}

function traverseChildren(node, context) {
    const children = node.children;

    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}