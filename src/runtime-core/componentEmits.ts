export function emit(instance, eventName, ...args) { //args接收其它参数（用户传入的参数，调用emit时事件名后的参数）
    // console.log(eventName, ...args);

    const { props } = instance;

    const capitalizeFirstLetter = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
    const handleKey = (key: string) => key ? "on" + capitalizeFirstLetter(key) : "";


    // 支持例如add-num的写法
    // 将例如add-num转换为addNum，然后依次调用capitalizeFirstLetter和handleKey得到onAddNum
    const camelize = (key: string) => {
        return key.replace(/-(\w)/g, (_, c: string) => {
            return c ? c.toUpperCase() : "";
        });
    }
    const handlerName = handleKey(camelize(eventName));
    const handler = props[handlerName];
    
    console.log(handlerName)
    // if (handler) {
    //     handler();
    // }
    // 或者
    handler && handler(...args);

}