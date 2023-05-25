// 手动封装的reactive的单元测试

import { isReactive, reactive, isProxy } from '../reactive';

describe("reactive", () => {
    it("happy path", () => {
        const original = {
            name: 'Alice',
        }
        const observed = reactive(original);
        
        expect(observed).not.toBe(original);
        expect(observed.name).toBe('Alice');

        // 测试isReactive
        expect(isReactive(observed)).toBe(true);
        expect(isReactive(original)).toBe(false);

        // 测试isProxy的功能
        expect(isProxy(observed)).toBe(true);
        expect(isProxy(original)).toBe(false);
    });


    // 测试reactive的嵌套功能（对嵌套的对象进行响应式处理）
    test("nested reactive", () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [{ bar: 2 }],
        };
        const observed = reactive(original);

        expect(isReactive(observed.nested)).toBe(true);
        expect(isReactive(observed.array)).toBe(true);
        expect(isReactive(observed.array[0])).toBe(true);
    })
})