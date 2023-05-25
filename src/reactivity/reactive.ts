import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";

// 封装一个reactive
// 版本1
// export function reactive(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get(target, key) {
//             // 使用Reflect.get获取原始对象target中对应key的值
//             const res = Reflect.get(target, key);
            
//             // 同时进行依赖收集
//             track(target, key);
//             return res;
//         },

//         // setter
//         set(target, key, value) {
//             // 使用Reflect.set对原始对象target中对应key的值进行修改
//             const res = Reflect.set(target, key, value);

//             // 同时进行触发依赖
//             trigger(target, key);
//             return res;
//         }
//     })
// }

// // 封装一个readonly
// // 类似于reactive，但是不能调用setter，同时不要进行依赖的收集和依赖的触发
// export function readonly(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get(target, key) {
//             // 使用Reflect.get获取原始对象target中对应key的值
//             const res = Reflect.get(target, key);
//             return res;
//         },

//         // setter
//         set(target, key, value) {
//             return true;
//         }
//     })
// }





// 版本2

// 将以上的reactive和readonly进行优化
// 抽离get和set进行复用
// function createGetter(isReadonly: boolean = false) {
//     return function get(target, key) {
//         const res = Reflect.get(target, key);
//         if (!isReadonly) {
//             track(target, key);
//         }
//         return res;
//     }
// }

// function createSetter(isReadonly: boolean = false) {
//     return function set(target, key, value) {
//         const res = Reflect.set(target, key, value);
//         trigger(target, key);
//         return res;
//     }
// }

// export function reactive(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get : createGetter(),

//         // setter
//         set: createSetter(),
//     })
// }

// export function readonly(raw) {
//     // 返回一个代理对象，对原始对象进行代理
//     return new Proxy(raw, {
//         // getter
//         get: createGetter(true),

//         // setter
//         set(target, key, value) {
//             return true;
//         }
//     })
// }



// 版本3

// 将以上的代码进行优化
// 将上面的createGetter、createSetter和两个return new Proxy()抽离到baseHandlers.ts文件中

// export function reactive(raw) {
//     return new Proxy(raw, mutableHandlers);
// }

// export function readonly(raw) {
//     return new Proxy(raw, readonlyHandlers);
// }



// 版本4

// 将以上代码进行优化，增强可读性
export function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}

// 手动封装一个isReactive()
// 区分reactive和readonly
// export function isReactive(value) {
//     return value["is_reactive"];
// }




function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}


// 将以上的isReactive进行优化
export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly"
}

export function isReactive(value) {
    // 添加!!，当value不是一个reactive响应式对象时，将undefined转换成false
    return !!value[ReactiveFlags.IS_REACTIVE];
}


// 手动封装一个isReadonly
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY];
}

// 手动封装一个shallowReadonly
export function shallowReadonly(raw) {
    console.log(raw);
    return createActiveObject(raw, shallowReadonlyHandlers);
}

// 手动封装一个isProxy
export function isProxy(object : Object) {
    return isReactive(object) || isReadonly(object);
}

















