// shallowReadonly的单元测试

import { isReadonly, shallowReadonly, isProxy } from "../reactive";

describe("shallowReadonly", () => {
    // 测试基本功能
    test("should not make non-reactive properties reactive", () => {
        const props = shallowReadonly({
            n: {
                foo: 1,
            }
        });

        expect(isReadonly(props)).toBe(true);
        expect(isReadonly(props.n)).toBe(false);

        // 测试isProxy的功能
        expect(isProxy(props)).toBe(true);
        expect(isProxy(props.n)).toBe(false);
    });

    // 测试调用set时报出警告的功能
    it("warn when call set", () => {
        console.warn = jest.fn();

        const user = shallowReadonly({
            age: 10,
        });

        user.age = 11;

        expect(console.warn).toBeCalled();
    });
})