// 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
// 在此处实现的是基于DOM自定义元素的创建、特性处理、插入容器元素中的接口，使用的都是DOM中提供的API
// 基于canvas的见example/customRenderer/main.js
// 支持接收参数来传入不同平台中渲染元素时所需要的API
import { createRender } from '../runtime-core'
function createElement(type) {
    return document.createElement(type);
}


function patchProps(elem, key, val) {
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 处理事件
        const eventName = key.slice(2).toLowerCase();
        elem.addEventListener(eventName, val);
    
    } else {
        elem.setAttribute(key, val);
    }
           
}


function insert(elem, container) {
    container.append(elem);
}


const renderer : any = createRender({
    createElement,
    patchProps,
    insert,
}) 


// 解决导入render时报错的问题（因为render不再导出了）
export function createApp(...args) {
    return renderer.createApp(...args);
}

export * from '../runtime-core'; 