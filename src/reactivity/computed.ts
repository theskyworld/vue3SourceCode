// 手动封装一个computed
import { ReactiveEffect } from './effect'
// 使用effect的逻辑来实现
// 第一次获取时通过调用getter来获取，之后都通过shedluer来获取
// 除非当响应式对象的值发生更改时，触发了依赖，

class ComputedRefImpl {
    private _getter: any;
    // 记录是否存在缓存，控制是否调用getter
    private _dirty: boolean = true;
    private _value: any;
    private _effect: any;
    constructor(getter) {
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            // 该scheduler的功能为对_dirty的值进行修改
            if(!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        if (this._dirty) {
            // 第一次获取值时，_dirty默认值为true，进入该分支，调用getter来返回结果值，同时也进行_value的初始化
            // 后续当响应式对象的值发生更改时，触发了依赖，调用了依赖的scheduler方法，将_dirty的false值改为了true值，进入该分支，调用getter来返回结果值
            this._dirty = false;
            // this._value = this._getter();

            // 同时实现触发trigger后面的功能
            this._value = this._effect.run();
        }

        // 如果响应式对象的值未发生更改，后续获取值时都是不调用getter，直接返回初始化时返回的结果值
        return this._value;
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter);
}