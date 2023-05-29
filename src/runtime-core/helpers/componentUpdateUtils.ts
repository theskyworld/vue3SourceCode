// 判断组件是否需要更新
export function shouldUpdateComponent(oldVnode, newVnode) {

    // 当组件的props值发生更改时才更新组件
    const { props: oldProps } = oldVnode;
    const { props: newProps } = newVnode;

    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            return true;
        }
    }

    return false;
}