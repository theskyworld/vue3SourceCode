// 导出runtime-core库中的函数，供外部导入使用
// export { createApp } from './createApp';
export { h } from './h';
export { renderSlots } from './helpers/renderSlots';
export { createTextVnode } from './VNode';
export { getCurrentInstance } from './component';
export { provide, inject } from './apiInject';
export { createRender } from "./renderer";