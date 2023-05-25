// readonly的单元测试
import { readonly, isReadonly, isProxy } from '../reactive'
describe("readonly", () => {
    // 测试基本功能
    it("happy path", () => {
        const original = {
            foo: 1,
            bar: {
                baz: 2,
            }
        };
        const wrapped = readonly(original);

        expect(wrapped).not.toBe(original);
        expect(wrapped.foo).toBe(1);


        // 测试isReadonly
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReadonly(original)).toBe(false);

        // 测试readonly的嵌套功能
        expect(isReadonly(wrapped.bar)).toBe(true);
        expect(isReadonly(original.bar)).toBe(false);

        // 测试isProxy的功能
        expect(isProxy(wrapped)).toBe(true);
        expect(isProxy(original)).toBe(false);
    });

    // 测试调用set方法时报出警告的功能
    it("warn when call set", () => {
        console.warn = jest.fn();

        const user = readonly({
            age: 10,
        });

        user.age = 11;

        expect(console.warn).toBeCalled();
    });    
})