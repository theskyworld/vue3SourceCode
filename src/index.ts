// rollup打包的入口文件
// mini-vue源码模块库的出口文件
// export * from './runtime-core/index';
// 将以上代码的导出放入runtime-dom/index.ts文件中

//
//      → compiler-core
// vue
//      → runtime-dom → runtime-core → reactivity
//
// 
// 避免以上图示中上下部分模块之间的强依赖关系，使用vue作为中间桥梁（顶层src下的index.ts文件），上下部分模块之间通过该文件进行模块的导入和导出
export * from "./runtime-dom";
// 因爲runtime-core模块依赖于reactivity模块，所以将以下的导出放到runtime-core下的index.ts文件中
// export * from "./reactivity";

import { baseCompile } from "./compiler-core/src";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

// function compileToFunction(template) {
//     const { code } = baseCompile(template);

//     const render = renderFunction("Vue");
// }

// function renderFunction(Vue) {
//     const {
//         toDisplayString: _toDisplayString,
//         openBlock: _openBlock,
//         createElementBlock: _createElementBlock,
//     } = Vue;

//     return function render(_ctx, _cache, $props, $setup, $data, $options) {
//         return (_openBlock(), _createElementBlock("div", null, "hi," + _toDisplayString(_ctx.message), 1 /* TEXT */))
//     }
// }


// 进行上面图示中上下部分模块之间导入导出的解耦
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}

registerRuntimeCompiler(compileToFunction);