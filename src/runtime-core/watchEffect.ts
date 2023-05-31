import { ReactiveEffect } from "../reactivity/effect";
import { queuePreFlushCb } from "./helpers/scheduler";

export function watchEffect(source) {
    function job() {
        // fn();
        // 通过effect.run()来调用fn
        effect.run();
    }


    // 实现cleanup
    let cleanup;
    // 初始化时不调用cleanup，只是进行赋值
    const onCleanup = (fn) => {
        cleanup = fn;
        effect.onStop = () => {
            fn();
        }
    }

    function getter() {
        // 调用getter时才调用cleanup
        if (cleanup) {
            cleanup();
        }
        source(onCleanup);
    }

    const effect = new ReactiveEffect(getter, () => {
        queuePreFlushCb(job);
    });
    effect.run();

    // 实现stop功能
    return () => {
        effect.stop();
    }
}