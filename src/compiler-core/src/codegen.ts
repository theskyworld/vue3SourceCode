// export function generate(ast) {
//     // 进行以下返回内容字符串的拼接生成
//     let code = '';
//     code += "return ";

//     const functionName = "render";
//     const args = ["_ctx", "_cache"];
//     const argsSignature = args.join(", ");
//     // const node = ast.children[0];
//     const node = ast.codegenNode;

//     code += `function ${functionName}(${argsSignature}){`;
//     code += `return '${node.content}'`;
//     code += "}";

//     return {
//         code,
//     }


//     // return {
//     //     code: `
//     //     return function render(_ctx, _cache, $props, $setup, $data, $options) {
//     //             return "hi";
//     //         }
//     //     `
//     // }
// }


// 逻辑抽离
export function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    push("return");

    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const argsSignature = args.join(", ");
    
    push(` function ${functionName}(${argsSignature}){`);
    push("return");

    genNode(ast.codegenNode, context);
    push("}");

    return {
        code : context.code,
    }

}

function createCodegenContext() : any {
    const context = {
        code: "",
        // 实现code字符串的拼接
        push(source) {
            context.code += source;
        }
    }

    return context;
}

function genNode(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}