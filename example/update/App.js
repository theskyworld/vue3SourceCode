import { h, ref } from "../../lib/guide-mini-vue.esm.js";


export const App = {
    name: "App",
    
    setup() {
        const count = ref(0);
        const props = ref({
            foo: "foo-value",
            bar : "bar-value",
        })

        const onClick = () => {
            count.value++;
        }

        // foo : value → foo : new-value
        const onChangePropsDemo1 = () => {
            props.value.foo = "new foo-value"
        }

        // foo : value → foo : undefined || null
        const onChangePropsDemo2 = () => {
            props.value.foo = undefined
        }

        // foo : value → 
        const onChangePropsDemo3 = () => {
            props.value = {
                foo : "foo-value"
            }
        }


        return {
            count,
            onClick,
            props,
            onChangePropsDemo1,
            onChangePropsDemo2,
            onChangePropsDemo3,
        };
    },

    render() {
        return h(
            "div",
            {
                id: 'root',
                ...this.props,
            },
            [
                h('div', {}, "count:" + this.count),
                h(
                    "button",
                    {
                        onClick : this.onClick,
                    },
                    "click",
                ),
                h(
                    "button",
                    {
                        onClick : this.onChangePropsDemo1,
                    },
                    "foo : value → foo : new-value",
                ),
                h(
                    "button",
                    {
                        onClick : this.onChangePropsDemo2,
                    },
                    "foo : value → foo : undefined || null",
                ),
                h(
                    "button",
                    {
                        onClick : this.onChangePropsDemo3,
                    },
                    "bar : value → ",
                )
            ]
        )
    }
}