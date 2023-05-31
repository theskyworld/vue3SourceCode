import { reactive } from "../../reactivity/reactive"
import { nextTick } from "../../runtime-dom";
import { watchEffect } from "../watchEffect";

describe("watchEffect", () => {

    // 测试基本功能
    it("effect", async () => {
        const state = reactive({
            count: 0,
        });
        let dummy;
        watchEffect(() => {
            dummy = state.count;
        });
        expect(dummy).toBe(0);

        state.count++;

        await nextTick();
        expect(dummy).toBe(1);
    });

    // 测试stop功能
    it("stopping the watcher", async () => {
        const state = reactive({
            count: 0,
        });
        let dummy;
        const stop: any = watchEffect(() => {
            dummy = state.count;
        });
        expect(dummy).toBe(0);

        stop();
        state.count++;
        await nextTick();
        expect(dummy).toBe(0);
    });

    // 测试cleanup功能
    it("cleanup registration", async () => {
        const state = reactive({
            count: 0,
        });
        const cleanup = jest.fn();
        let dummy;
        const stop: any = watchEffect((onCleanup) => {
            onCleanup(cleanup);
            dummy = state.count;
        });
        expect(dummy).toBe(0);

        state.count++;
        await nextTick();
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(dummy).toBe(1);

        stop();
        expect(cleanup).toHaveBeenCalledTimes(2);
    })
})