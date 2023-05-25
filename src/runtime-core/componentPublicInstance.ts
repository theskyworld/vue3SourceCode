const publicPropertiesMap = {
    $el: instance => instance.vnode.elem, // 获取当前元素虚拟节点的那个DOM元素
};


export const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState的值为组件中setup函数的返回的那个对象，其中包含了在setup中创建的数据
         const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }

        // 获取元素虚拟节点的那个DOM元素
        // if (key === '$el') {
            // return instance.vnode.elem;
        // }
    
        // 进行优化，将以上的逻辑抽离到publicPropertiesMap对象中
        // 使得在publicPropertiesMap中能够存在多个公共属性与其getter函数的映射，例如$el、$data、$props等
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
}