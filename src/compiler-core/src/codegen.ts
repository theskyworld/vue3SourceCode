// export function generate(ast) {
//     // 进行以下返回内容字符串的拼接生成
//     let code = '';
//     code += "return ";

import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./utils/transform/runtimeHelpers";

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
// }


// 处理文本类型，最终要生成的模板为
// return function render(_ctx, _cache, $props, $setup, $data, $options) {
//   return "hi"
// }



// 处理插值类型，最终要生成的模板为
// const { toDisplayString: _toDisplayString } = Vue

// return function render(_ctx, _cache, $props, $setup, $data, $options) {
//   return _toDisplayString(_ctx.message)
// }



// 逻辑抽离
export function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;

    // 处理插值类型中的"const { toDisplayString: _toDisplayString } = Vue"部分
    // const VueBegining = "Vue";
    // // const helpers = ["toDisplayString"];
    // const aliasHelper = (s) => `${s} : _${s}`;
    // // push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${VueBegining}`);
    // // 优化
    // push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBegining}`);
    // push("\n");

    // 进行抽离
    getFunctionPreamble(ast, context);



    // 处理字符串类型
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const argsSignature = args.join(", ");
    
    push(` function ${functionName}(${argsSignature}){`);
    push(`return `);

    genNode(ast.codegenNode, context);
    push("}");

    return {
        code : context.code,
    }

}

function getFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBegining = "Vue";
    // const helpers = ["toDisplayString"];
    const aliasHelper = (s) => `${s} : _${s}`;
    // push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${VueBegining}`);
    // 优化
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBegining}`);
    }

    push("\n");
    push(`return`);
}

function createCodegenContext() : any {
    const context = {
        code: "",
        // 实现code字符串的拼接
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    }

    return context;
}

function genNode(node, context) {
    switch (node.type) {
        // 处理文本类型
        case NodeTypes.TEXT:
            genText(node, context);
            break;
        // 处理插值类型
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context);
            break;
        // 处理插值中的简单表达式
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context);
            break;
    }
}

function genExpression(node, context) {
    const { push } = context;
    // push(`_ctx.${node.content}`);
    // 將添加"_ctx."的逻辑抽离至transformExpression函数中
    push(`${node.content}`);
}

function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}


// 生成插值类型中的"_toDisplayString(_ctx.message)"部分
function genInterpolation(node, context) {
    const { push, helper } = context;
    // push(`_toDisplayString(`);
    // 优化：使用helper()进行TO_DISPLAY_STRING和字符串"toDisplayString"的映射和"_"的拼接，避免直接书写字符串
    push(`${helper(TO_DISPLAY_STRING)}(`);
    // 进入genNode中的处理插值中的简单表达式分支
    genNode(node.content, context);
    push(")");
}