// 手动封装一个effect

import { extend } from "../shared/index";


// 保存当前的effect对象（依赖）
let activeEffect;
// 解决obj.prop++时stop的功能测试不通过的问题
// 控制是否收集依赖
let shouldTrack;
export class ReactiveEffect {
    private _fn: any;
    
    // 用于实现stop
    // 存储dep
    deps = [];
    active = true;

    // 用于实现onStop
    onStop?: () => void;
    constructor(fn,  public scheduler?) {
        this._fn = fn;
    }


    // 调用run时，通过调用fn()对依赖的值进行修改
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;


        const res = this._fn();
        shouldTrack = false;
        // 添加return,实现测试中runner()函数的功能
        return res;
    }

    // stop功能
    stop() {
        // 添加active，防止频繁清空
        if (this.active) {
            cleanUpEffect(this);
            
            // 实现onStop
            this.onStop ? this.onStop() : null;

            this.active = false;
        }
    }
}

function cleanUpEffect(effect) {
    // 清空deps中的所有dep
        effect.deps.forEach((dep : Set<object>) => {
            dep.delete(effect);
        })
}

// 依赖收集，收集当前的effect对象
// 将target存储在targetMap中，Map(target, depsMap) → Map(target, new Map()/Map(key,dep)) → Map(target, new Map()/Map(key,new Set()/Set(activeEffect)))
// 将effect存储在dep中，Set(activeEffect)
// 下面函数中创建了两个Map，一个Set，作用分别为：
// 第一个Map也就是targetMap用于存放target和第二个Map的一一映射关系，即Map(target, new Map())
// 第二个Map也就是depsMap用于存放key和dep的一一映射关系，即Map(key, dep)
// Set也就是dep，用于存放多个依赖effect对象，即Set(activeEffect)

// 存储target的容器
const targetMap = new Map();
export function track(target, key) {
    // 初始化阶段
    // 获取指定的target对应的dep容器（用于存储依赖），每个target原始对象要与其相应的依赖effect对象一一对应
    // 从targetMap中获取target对应的depsMap值
    let depsMap = targetMap.get(target);

    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }

    let dep = depsMap.get(key);
    if (!dep) {
        // 存储依赖的容器
        dep = new Set();
        depsMap.set(key, dep);
    }

    // 如果shouldTrack为false，则停止依赖的收集
    if (!shouldTrack) return;
    trackEffect(dep);
     
}

// 抽离出来的收集依赖的可复用代码
// 例如在ref.ts中对该逻辑代码进行了使用
export function trackEffect(dep) {
    if (activeEffect && !dep.has(activeEffect)) {
        // 收集依赖
        // 将当前的effect对象（依赖添加进容器dep中）
        dep.add(activeEffect);

        // 用于实现stop
        
        activeEffect.deps.push(dep);
    }
}

// 触发依赖
// 触发m每个effect对象中的run()（fn()）函数
export function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);

    triggerEffect(dep);
}

// 抽离出来的收集依赖的可复用代码
// 例如在ref.ts中对该逻辑代码进行了使用
export function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        } else {
            effect.run();
        }
    }
}



export function effect(fn, options : any = {}) {
    // 获取scheduler，实现scheduler的功能
    const scheduler = options.scheduler;
    // 创建effect对象
    const _effect = new ReactiveEffect(fn, scheduler);

    // 获取onStop
    // _effect.onStop = options.onStop;
    // 进行优化
    // 以上代码等价于使用
    // Object.assign(_effect, options);
    // 将以上代码抽离到shared文件夹中
    extend(_effect, options);

    // 实现依赖的触发
    _effect.run();  


    // 实现测试中runner()函数的功能
    const runner: any = _effect.run.bind(_effect);

    // 用于实现stop功能
    runner.effect = _effect;
    
    return runner;
}

// 实现stop
export function stop(runner) {
    runner.effect.stop();
}



