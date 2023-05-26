export function emit(instance, eventName, ...args) { //args接收其它参数（用户传入的参数，调用emit时事件名后的参数）
    // console.log(eventName, ...args);

    const { props } = instance;

    const handlerName = handleEventName(eventName);
    const handler = props[handlerName];
    
    // console.log(handlerName)

    // 执行事件的回调函数
    // if (handler) {
    //     handler();
    // }
    // 或者
    handler && handler(...args);
}



    // 根据转换后的eventName从props中获取对应属性的值（根据事件名获取对应事件的回调函数）
    // 即传入时（转换前）：
    //  emit('add', 1, 2);
    //  emit('add-num', 1, 2);
    // "add" "add-num"
    // 转换后
    // onAdd onAddNum
    // 从Props中获取对应的事件回调函数
    // props
    // {
    //     onAdd(a, b, c) {
    //         console.log('onAdd', a, b, c)
    //     },
    //     // 即
    //     // onAdd = (a, b, c) => console.log('onAdd', a, b, c)
    //     onAddNum(a, b, c) {
    //         console.log('onAddNum', a, b, c)
    //     }
    // }
function handleEventName(eventName) {
    // add→ Add   add-num → Add-num
    const capitalizeFirstLetter = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
    // onAdd  onAdd-num
    const handleKey = (key: string) => key ? "on" + capitalizeFirstLetter(key) : "";


    // 支持例如add-num的写法
    // 将例如add-num转换为addNum，然后依次调用capitalizeFirstLetter和handleKey得到onAddNum
    const camelize = (key: string) => {
        return key.replace(/-(\w)/g, (_, c: string) => {
            return c ? c.toUpperCase() : "";
        });
    }
    // onAdd onAddNum
    return handleKey(camelize(eventName));
}