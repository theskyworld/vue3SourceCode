// effect的单元测试
import { reactive } from '../reactive';
import { effect, stop } from '../effect';

describe("effect", () => {
    // 测试依赖收集和触发依赖的功能、track()和trigger()函数的功能
    it("happy path", () => {
        const user = reactive({
            age: 10,
        });

        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        });

        expect(nextAge).toBe(11);


        // 更新数据
        user.age++;
        expect(nextAge).toBe(12);
    })

    // 测试runner函数的功能
    it("should return runner when call effect", () => {
        let foo = 10;
        const runner = effect(() => {
            foo++;
            return "foo";
        });

        expect(foo).toBe(11);

        const r = runner();
        expect(foo).toBe(12);
        expect(r).toBe("foo");

    })

    // 测试scheduler的功能
    it("scheduler", () => {
        let dummy;
        let run: any;
        const scheduler = jest.fn(() => {
            run = runner;
        });
        const obj = reactive({
            foo: 1,
        });
        // 此时effect应当接收两个参数，第一个为一个fn函数，实现之前的run()的功能；第二个为一个配置选项，其中包含一个scheduler
        // 当effect第一次执行的时候，执行其中的fn函数。执行runner时会再次执行fn
        // 当响应式对象的值发生更新时(执行trigger()函数时)，执行scheduler，而不执行fn 
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            { scheduler }
        );

        expect(scheduler).not.toHaveBeenCalled();
        expect(dummy).toBe(1);

        // 更新响应式对象属性的值，触发trigger()函数的执行，从而触发scheduler的调用
        obj.foo++;
        
        expect(scheduler).toHaveBeenCalledTimes(1);
        expect(dummy).toBe(1);

        run();
        expect(dummy).toBe(2);
    })


    // 测试stop的功能
    it("stop", () => {
        let dummy;
        const obj = reactive({
            prop: 1,
        });
        const runner = effect(() => {
            dummy = obj.prop;
        });

        // 修改响应式对象属性的值
        obj.prop = 2;
        expect(dummy).toBe(2);

        // 停止依赖的触发
        stop(runner);
        // obj.prop = 3;

        // 问题，使用obj.prop++时将导致测试不通过
        // 原因为obj.prop++ = obj.prop + 1  会同时触发get和set，但是在get中触发依赖收集的时候未添加对stop功能的实现处理
        obj.prop++;
        expect(dummy).toBe(2);

        // 再次触发依赖
        runner();
        expect(dummy).toBe(3);
    })

    // 测试onStop的功能
    it("onStop", () => {
        const obj = reactive(
            {
                foo: 1,
            }
        );
        const onStop = jest.fn();
        let dummy;
        const runner = effect(
            () => {
                dummy = obj.foo;
            },
            { onStop }
        );

        stop(runner);
        expect(onStop).toBeCalledTimes(1);
    })
})