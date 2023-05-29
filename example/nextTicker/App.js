import { h, ref, nextTick, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";


export default {
    name: "App",
    setup() {
        const count = ref(1);
        const instance = getCurrentInstance();

        // 默认情况下，执行onClick时，count的值每次都会变化，页面会因此同步更新100次
        // 为了进行优化，让页面进行异步更新，只需要取到count最后一次的值，然后将该值进行渲染即可，让视图只进行一个更新
        // 但是在for循环结束之前，页面更新之间都获取不到更新之后的组件
        // 此时实现nextTick()来获取更新后的视图和组件
        function onClick() {
            for (let i = 0; i < 100; i++) {
                console.log('update');
                count.value = i;
            }
        }

        nextTick(() => {
            // 获取更新后的视图
            console.log("instance", instance);
        })

        return {
            onClick,
            count,      
        }
    },

    render() {
        const button = h(
            "button",
            {
                onClick: this.onClick
            },
            "update"
        );

        const p = h("p", {}, "count : " + this.count);

        return h("div", {}, [button, p]);
    }
}