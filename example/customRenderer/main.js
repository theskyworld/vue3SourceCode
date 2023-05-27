// 使用PIXI演示将vue渲染在canvas中

import { createApp, createRender } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./App.js";

// console.log(PIXI)
const game = new PIXI.Application({
    width: 500,
    height : 500,
})
document.body.append(game.view);

const renderer = createRender({
    // 实现基于canvas的渲染元素的接口并作为参数传入给createRender
    // 此时实现的是基于canvas的接口，使用的是canvas中相应的API
    // 基于DOM的见runtime-dom/index.ts
    createElement(type) {
        if (type === "rect") {
            const rect = new PIXI.Graphics();
            rect.beginFill(0xff0000);
            rect.drawRect(0, 0, 100, 100);
            rect.endFill();

            return rect;
        }
    },
    patchProps(elem, key, val) {
        elem[key] = val;
    },
    insert(elem, container) {
        // 类似于DOM中的append()
        container.addChild(elem);
    }
})

renderer.createApp(App).mount(game.stage);

// const rootContainer = document.getElementById('app');
// createApp(App).mount(rootContainer);