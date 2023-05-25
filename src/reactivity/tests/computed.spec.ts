// computed的单元测试
// 要求监听的对象为一个响应式对象，因为只有响应式对象在属性的值发生更改时才会触发依赖
import { reactive } from '../reactive';
import { computed } from '../computed';

describe("computed", () => {
    // 基本功能
    it("happy path", () => {
        const user = reactive({
            age: 1,
        });
        const age = computed(() => {
            return user.age;
            ;
        });

        expect(age.value).toBe(1);
    });

    // 测试缓存机制，懒执行
    it("should compute lazily", () => {
        const value = reactive({
            foo: 1,
        });
        const getter = jest.fn(() => {
            return value.foo;
        });
        // cValue通过computed的getter来获取返回值
        const cValue = computed(getter);

        expect(getter).not.toHaveBeenCalled();
        expect(cValue.value).toBe(1);
        // 使用了cValue.value来读取cValue的值，触发getter的执行
        expect(getter).toHaveBeenCalledTimes(1);

        cValue.value;
        // 但是由于computed存在懒执行机制，如果响应式对象的值未发生更改，那么将不调用getter，直接返回初始化时返回的value值
        expect(getter).toBeCalledTimes(1);


        // 触发trigger
        // 调用getter获取值
        value.foo = 2;
        expect(getter).toHaveBeenCalledTimes(1);

        expect(cValue.value).toBe(2);
        expect(getter).toHaveBeenCalledTimes(2);

        cValue.value;
        expect(getter).toHaveBeenCalledTimes(2);

    })
})