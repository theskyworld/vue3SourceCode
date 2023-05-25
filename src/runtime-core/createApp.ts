// 手动封装一个createApp
// 原始组件 → 虚拟节点对象 → 组件实例对象
import { render } from './renderer';
import { createVNode } from './VNode';

// 接收一个根组件作为参数
export function createApp(rootComponent) {

    // 最后返回一个app对象，其中包含一个mount方法，将根组件挂载到根容器上
    return {
        mount(rootContainer) {
            // 先将根组件转换为虚拟节点vnode
            // 然后以后的操作的基于vnode进行
            const vnode = createVNode(rootComponent);
            // 将vnode渲染到根容器上
            render(vnode, rootContainer);
        },
    }
}

