import { getCurrentInstance } from "./component";

export function provide(key, value) {
    // 存储数据

    const currentInstance : any = getCurrentInstance();

    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;

        // 实现中间组件能够提供属于自己的同名依赖，例如foo
        // 第一次获取时进行初始化
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }

        // 将数据的key和value存储到组件实例的provides对象上
        (provides as any)[key] = value
    }
}


export function inject(key, defaultValue?) {
    // 获取数据
    // 从当前组件的上一级组件（父组件）的组件实例的provides对象中获取
    const currentInstance: any = getCurrentInstance();
    
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;

        // 实现获取依赖时能够提供默认值的功能
        if (key in parentProvides) {
            return parentProvides[key];
        } else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}