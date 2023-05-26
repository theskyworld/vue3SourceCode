import { h } from "../lib/guide-mini-vue.esm.js";

// export const Foo = {
//     setup(props) {
//         console.log(props.count); // 1

//         // 获取到的props只读，不可被修改
//         props.count++;
//         console.log(props.count);
//     },

//     render() {
//         return h('div', {}, "foo:" + this.count)
//     }
// }


//  测试emit功能
export const Foo = {
    setup(props, { emit }) {
        const emitAdd = () => {
            // console.log('emit add');
            // emit("add");
            // 支持传入参数
            emit("add", 1, 2, 3);
            // 支持例如add-num的写法
            emit('add-num',1, 2)
        };
        return {
            emitAdd,
            name : 'Alice',
        }
    },

    render() {
            const btn = h(
                "button",
                {
                    onClick: this.emitAdd,
                },
                "emitAdd"
            );
            const foo = h("p", {}, "hello " + this.name);
            return h('div', {}, [foo, btn])
        }
}

