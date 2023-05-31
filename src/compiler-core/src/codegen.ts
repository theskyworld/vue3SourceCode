import { NodeTypes } from "./ast";
import { isEmpty } from "./utils/utils";
import { CREATE_ELEMENT_BLOCK, helperMapName, OPENBLOCK, TO_DISPLAY_STRING } from "./utils/transform/runtimeHelpers";
import { isString } from "../../shared";

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


// 处理元素类型（<div></div>），最终要生成的模板为
// const { openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue

// return function render(_ctx, _cache, $props, $setup, $data, $options) {
//   return (_openBlock(), _createElementBlock("div"))
// }


// 处理联合类型（<div>hi{{message}}</div>），最终要生成的模板为
// const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue

// return function render(_ctx, _cache, $props, $setup, $data, $options) {
//   return (_openBlock(), _createElementBlock("div", null, "hi" + _toDisplayString(_ctx.message), 1 /* TEXT */))
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
    const { push, helper } = context;
    const VueBegining = "Vue";
    // const helpers = ["toDisplayString"];
    const aliasHelper = (s) => `${helper(s)} : _${helper(s)}`;
    // push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${VueBegining}`);

    // 优化
    if (ast.helpers.length > 0) {
        // console.log("🚀 ~ file: codegen.ts:102 ~ getFunctionPreamble ~ ast.helpers:", ast.helpers)
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
            return `${helperMapName[key]}`;
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
        // 处理元素类型
        case NodeTypes.ELEMENT:
            genElement(node, context);
            break;
        // 处理联合类型
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompundExpression(node, context);
            break;
        default:
            break;
            
    }
}

function genCompundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        } else {
            genNode(child, context);
        }
    }
}


function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push("(");

    console.log("node", node.children)
    // 纯元素类型（例如<div></div>）
    // 实现元素类型中的"(_openBlock(), _createElementBlock("div"))"部分
    if ((children && isEmpty(children)) || !children) {
        push(`_${helper(OPENBLOCK)}(), _${helper(CREATE_ELEMENT_BLOCK)}("${tag}"`)
    } else {
        // 联合类型
        // 实现联合类型中的"(_openBlock(), _createElementBlock("div", null, "hi" + _toDisplayString(_ctx.message), 1 /* TEXT */))"部分
        push(`_${helper(OPENBLOCK)}(), _${helper(CREATE_ELEMENT_BLOCK)}(`);
        genNodeList(genNullable([tag, props, children]), context);
        if (node.children) {
            
            if (node.children.type === NodeTypes.COMPOUND_EXPRESSION) {
                const compundChildren = node.children.children;
                for (let i = 0; i < compundChildren.length; i++) {
                    const child = compundChildren[i];
                    if (typeof child  !== "object") {
                        continue;
                    }
                    
                    if (child.type === NodeTypes.INTERPOLATION) {
                        push(`, ${child.content && child.content.type} /* TEXT */`)
                    }
                }
            }
        }
    }
    
    push(")");
    push(")");
}

function genNodeList(nodes, context) {
  const { push } = context;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      node === "null" ? push(null) : push(`"${node}"`);
    } else {
      genNode(node, context);
    }

    if(i < nodes.length -1){
      push(", ")
    }
  }
}

function genNullable(args: any) {
  return args.map((arg) => arg || "null");
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
    push(`_${helper(TO_DISPLAY_STRING)}(`);
    // 进入genNode中的处理插值中的简单表达式分支
    genNode(node.content, context);
    push(")");
}