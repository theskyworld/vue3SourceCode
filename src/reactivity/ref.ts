// 手动封装一个ref
// 对于ref(raw)
// 使用typeof对raw进行判单
// 如果raw为一个基本类型的值，则不对其进行转换，通过ref()返回的对象get或者set value时操作的是raw本身，通过进行依赖收集或者触发依赖的操作
// 如果raw为一个引用类型的值，则先通过reactive将其转换为一个响应式对象，通过ref()返回的对象get或者set value时操作的是转换后的那个响应式对象

import { trackEffect, triggerEffect } from "./effect";
import { hasChanged, isObject } from '../shared'
import { reactive } from "./reactive";

class RefImpl {
    private _value: any;
    public dep: Set<any>;
    private _rawValue: any;
    // 是否为ref的标志
    private __v_isRef: boolean = true;
    constructor(value) {
        this._rawValue = value;
        // 如果传入给ref(value)中的参数value为一个对象，则需要先将其通过reactive进行转换
        // this._value = isObject(value) ? reactive(value) : value;
        // 抽离可复用的代码，将上行代码抽离
        this._value = convert(value);
        this.dep = new Set();
    }

    get value() {
        // 依赖收集
        trackEffect(this.dep);
        return this._value;
    }

    set value(newVal) {
        // 如果newVal和之前的值相同，则不进行值的修改和依赖的触发
        // if (Object.is(newVal, this._value)) return;
        // 将Object.is(newVal, this._value)抽离到shared下的index.ts文件中，用于作为公共工具
        if (!hasChanged(this._rawValue, newVal)) return;

        // 如果传入给ref()中的参数value或者newVal为一个对象，对比hasChanged时使用reactive转换前的原始对象_rawValue和newVal进行对比
        this._rawValue = newVal;
        // this._value = isObject(newVal) ? reactive(newVal) : newVal;
        // 抽离可复用的代码，将上行代码抽离
        this._value = convert(newVal);
        // 触发依赖
        triggerEffect(this.dep);
        
    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

// 手动封装一个ref
export function ref(value) {
    return new RefImpl(value);
}

// 手动封装一个isRef
export function isRef(ref) {
    // 添加!!，防止最后返回例如undefined的情况
    return !!ref?.__v_isRef;
}

// 手动封装一个unRef
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

// 手动封装一个proxyRefs
export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },

        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            } else {
                return Reflect.set(target, key, value);
            }
        }
    })
}




