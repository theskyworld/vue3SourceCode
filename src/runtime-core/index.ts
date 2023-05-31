// 导出runtime-core库中的函数，供外部导入使用
// export { createApp } from './createApp';
export { h } from './h';
export { renderSlots } from './helpers/renderSlots';
export { createTextVnode, createElementBlock } from './VNode';
export { getCurrentInstance, registerRuntimeCompiler } from './component';
export { provide, inject } from './apiInject';
export { createRender } from "./renderer";  
export { nextTick } from "./helpers/scheduler";
export { toDisplayString } from "../shared";
export { openBlock } from "../shared";
export * from "../reactivity";