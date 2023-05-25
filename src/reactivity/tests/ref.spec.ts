// ref的单元测试
import { effect } from '../effect';
import { reactive } from '../reactive';
import { ref, isRef, unRef, proxyRefs } from '../ref';

describe("ref", () => {
    // 测试基本功能
    it("happy path", () => {
        const a = ref(1);
        expect(a.value).toBe(1);
    });


    // 测试给原始变量赋相同值时不引起依赖的触发的功能 
    it("should be reactive", () => {
        const a = ref(1);
        let dummy;
        let calls = 0;
        effect(() => {
            calls++;
            dummy = a.value;
        });

        expect(calls).toBe(1);
        expect(dummy).toBe(1);

        a.value = 2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2);

        // 如果给a赋相同的值，则不引起依赖的触发
        a.value = 2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2);
    })

    // 测试ref的内嵌功能（能够对raw为基本类型值和引用类型的值进行分别处理）
    it("should make nested properties reactive", () => {
        const a = ref({
            count: 1,
        });
        let dummy;
        effect(() => {
            dummy = a.value.count;
        });
        expect(dummy).toBe(1);

        a.value.count = 2;
        expect(dummy).toBe(2);
    });

    // 测试isRef()的功能
    it("isRef", () => {
        const a = ref(1);
        const user = reactive({
            age: 1,
        });

        expect(isRef(a)).toBe(true);
        expect(isRef(1)).toBe(false);
        expect(isRef(user)).toBe(false);
    });


    // 测试unRef()的功能
    it("unRef", () => {
        const a = ref(1);
        
        expect(unRef(a)).toBe(1);
        expect(unRef(1)).toBe(1);
    })


    // 测试proxyRefs
    // 使用proxyRefs包装后的对象不需要使用.value即可获取到值
    it("proxyRefs", () => {
        const user = {
            name: 'Alice',
            age: ref(10),
        };
        const proxyUser = proxyRefs(user);

        // get
        expect(user.age.value).toBe(10);
        expect(proxyUser.age).toBe(10);
        expect(proxyUser.name).toBe('Alice');


        // set
        proxyUser.age = 20;

        expect(proxyUser.age).toBe(20);
        expect(user.age.value).toBe(20);

        proxyUser.age = ref(10);
        
        expect(proxyUser.age).toBe(10);
        expect(user.age.value).toBe(10);
    })

})