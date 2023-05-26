import { track, trigger } from './effect';
import { reactive, ReactiveFlags, readonly } from './reactive';
import { isObject, extend } from '../shared/index';

function createGetter(isReadonly: boolean = false, isShallowReadonly : boolean = false) {
    return function get(target, key) {
        // 用于实现isReactive的功能
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }

        if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }


        const res = Reflect.get(target, key);

        // 实现reactive和readonly的嵌套功能
        // 判断获取到的res是否为一个object，如果是则再次调用reactive()或者readonly()进行封装成响应式对象
        if (isObject(res) && !isShallowReadonly) {
            // 递归调用reactive()或者readonly()
            return isReadonly ? readonly(res) : reactive(res);
        }

        if (!isReadonly) {
            track(target, key);
        }
        return res;
    }
}

function createSetter(isReadonly: boolean = false) {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    }
}

// export const mutableHandlers = {
//     get: createGetter(),
//     set : createSetter(),
// }

// export const readonlyHandlers = {
//         // getter
//         get: createGetter(true),

//         // setter
//         set(target, key, value) {
//             return true;
//         }
// }


// 将以上代码中的get和set进行优化，缓存一次createGetter和createSetter的结果，避免多次调用
const get = createGetter();
const set = createSetter();
const readonlyGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(true, true);

export const mutableHandlers = {
    get,
    set,
}

export const readonlyHandlers = {
    // getter
    get : readonlyGetter,

        // setter
    set(target, key, value) {
            console.warn(`设置key:${key}失败,因为target为一个readonly对象,${target}`)
            return true;
    }
}



// export const shallowReadonlyHandlers = {
//     get : shallowReadonlyGetter,
//     set(target, key, value) {
//             console.warn(`设置key:${key}失败,因为target为一个readonly对象,${target}`)
//             return true;
//     }
// }

// 或者
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get : shallowReadonlyGetter,
})