import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initProps } from '../runtime-core/componentProps';
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmits';
import { initSlots } from './componentSlots';


export function createComponentInstance(vnode) {
    // 基于虚拟节点对象创建一个组件实例对象并返回
    const component = {
        vnode,  //原始组件（rootComponent）转换为虚拟节点后的虚拟节点
        type: vnode.type,  //原始组件（rootComponent）
        setupState: {}, // 存储原始组件中setup函数的返回值对象
        props: {}, // 组件上的props
        emit: () => { }, // 组件上的emit
        slots : {},
    };
    component.emit = emit.bind(null, component) as any;
    return component;
}

export function setupComponent(instance) {
    // 实现组件的props功能
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);

    setupStatefulComponent(instance);
}



// 获取原始组件中的setup函数的返回值，并进行处理
function setupStatefulComponent(instance) {
    // 获取原始组件（转换为虚拟节点前的组件）
    const component = instance.type;

    //为组件实例上添加一个proxy代理对象属性，代理那个包含有组件中公共属性的对象
    // 实现在组件中的render()函数中能够访问组件的setup()函数返回的对象中的属性，例如this.msg 
    // 实现对组件中公共属性的访问，例如$el、$data
    // instance.proxy = new Proxy({}, {
    //     get(target, key) {
    //         // setupState的值为组件中setup函数的返回的那个对象，其中包含了在setup中创建的数据
    //         const { setupState } = instance;
    //         if (key in setupState) {
    //             return setupState[key];
    //         }

    //         // 获取元素虚拟节点的那个DOM元素
    //         if (key === '$el') {
    //             return instance.vnode.elem;
    //         }

    //     }
    // });

    // 将以上代码进行优化，抽离到src/componentPublicInstance.ts文件中的PublicInstanceProxyHandlers对象中
    instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers)

    
    // 获取原始组件中的setup
    const { setup } = component;

    if (setup) {
        // 获取到的props对象只读，不可被修改，使用shallowReadonly()进行封装
        // const setupResult = setup(shallowReadonly(instance.props));
        
        // 实现props和emit的功能
        const setupResult = setup(shallowReadonly(instance.props), {
            emit : instance.emit
        });
        // 根据在创建组件时的书写习惯，setup()函数可能返回一个函数，也可能返回一个对象
        handleSetupResult(instance, setupResult);
    }

}

function handleSetupResult(instance, setupResult) {
    // TODO 实现一个对setupResult的类型为一个函数时的处理逻辑


    if (typeof setupResult === 'object') {
        // 将组件中setup()函数的返回值赋值给组件实例中的setupState属性
        instance.setupState = setupResult;
    }

    finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
    const component = instance.type;
    // 如果组件上存在render函数，则调用该render函数
    if (component.render) {
        instance.render = component.render;
    }
}








