import { isWhiteSpaceLike } from "typescript";
import { effect } from "../reactivity";
import { EMPTY_OBJ, isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment } from "./helpers/renderSlots";


// 用于实现一个自定义渲染接口，接收一个options对象作为参数，其中包含多个配置项
export function createRender(options) {
    const {
        // 解构并重命名
        createElement : hostCreateElement,
        handleProps  : hostHandleProps,
        insert: hostInsert,
        remove: hostRemove,
        setElementText : hostSetElementText,
    } = options;


    function render(vnode, container) {
        // 主要是调用patch方法
        patch(null, vnode, container);
    }


    // 增加区分组件的初始化和组件更新的逻辑
    // oldVnode : 更新前的虚拟节点
    // newVnode : 更新后的虚拟节点
    // 如果不存在oldVnode作为初始化，反之为更新
    function patch(oldVnode, newVnode, container = null, parentComponent = null, anchor = null) {
        // 区分组件虚拟节点类型和元素虚拟节点类型的逻辑
        // 通过原始组件在console.log中的结果值判断
        // if (typeof vnode.type === 'string') {
        //     // 元素虚拟节点类型
        //     processElement(vnode, container);
        // } else if (isObject(vnode.type)) {
        //     // 如果虚拟节点为组件类型
        //     // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
        //     // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        //     processComponent(vnode, container);
        // }  
    
        // 将上述代码进行优化
        // 使用ShapeFlags进行位运算的判断
        const { shapeFlag, type } = newVnode;
        // // 判断是否为元素虚拟节点类型
        // if (shapeFlag & ShapeFlags.ELEMENT) {
        //     // 元素虚拟节点类型
        //     processElement(vnode, container);
        //     // 判断是否为组件虚拟节点类型
        // } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        //     // 如果虚拟节点为组件类型
        //     // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
        //     // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        //     processComponent(vnode, container);
        // }


        // 同时考虑Fragment虚拟节点和文本虚拟节点的情况
        switch (type) {
            // Fragment虚拟节点
            case Fragment:
                processFragment(oldVnode, newVnode, container, parentComponent);
                break;
            case Text:
                processText(oldVnode, newVnode, container);
                break;
            default:
                // 判断是否为元素虚拟节点类型
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 元素虚拟节点类型
                    processElement(oldVnode, newVnode, container, parentComponent, anchor);
                    // 判断是否为组件虚拟节点类型
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 如果虚拟节点为组件类型
                    // 则先获取并处理原始组件中的setup函数的返回值跟render函数（如果有的话）
                    // 然后再调用原始组件的render()函数，获取其返回的结果值，元素类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
                    processComponent(oldVnode, newVnode, container, parentComponent);
                }
        }
    }

    function processText(oldVnode, newVnode, contanier) {
        const { children } = newVnode;
        const textNodeElem = (newVnode.elem = document.createTextNode(children));
        contanier.append(textNodeElem);
    }

    function processFragment(oldVnode, newVnode, container, parentComponent) {
        // 其本质就是把片段当作一个或多个children节点，然后将它们通过调用patch来渲染到父元素上（容器）
        mountChildren(newVnode.children, container, parentComponent);
    }

    function mountChildren(children, container, parentComponent) {
        children.forEach(child => {
            patch(null, child, container, parentComponent, null)
        })
    }
    function processComponent(oldVnode, newVnode, container, parentComponent) {
        mountComponent(newVnode, container, parentComponent);
    }

    function processElement(oldVnode, newVnode, container, parentComponent, anchor) {
        if (!oldVnode) {
            mountElement(newVnode, container, parentComponent, anchor);
        } else {
            patchElement(oldVnode, newVnode, container, parentComponent, anchor);
        }
    }

    function patchElement(oldVnode, newVnode, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("old", oldVnode);
        console.log("new", newVnode);

        const oldProps = oldVnode.props || EMPTY_OBJ;
        const newProps = newVnode.props || EMPTY_OBJ;
        const elem = (newVnode.elem = oldVnode.elem);

        patchChildren(oldVnode, newVnode, elem, parentComponent, anchor);
        patchProps(elem, oldProps, newProps);
    }

    // 比较新旧children
    function patchChildren(oldVnode, newVnode, container, parentComponent, anchor) {
        const oldShapeFlag = oldVnode.shapeFlag;
        const newShapeFlag = newVnode.shapeFlag;
        const oldChildren = oldVnode.children;
        const newChildren = newVnode.children;

        // console.log(oldShapeFlag, newShapeFlag)
        
        // 情况2 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为text
        if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {/*如果新的children为text类型*/
            // if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {/*如果老的children为array类型*/
            //     // 清空老的数组类型的children
            //     unmountChildren(oldVnode.children);

            //     // 设置新的text类型的children
            //     hostSetElementText(container, newChildren);

            //     // 情况3 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为text
            // } else {
            //     if (oldChildren !== newChildren) {
            //         hostSetElementText(container, newChildren);
            //     }
            // }
            

            // 优化以上代码
            // 情况2
            if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(oldVnode.children);
            }
            // 情况2，3
            if (oldChildren !== newChildren) {
                // console.log(oldChildren, newChildren)
                hostSetElementText(container, newChildren);
            }
        } else {
            // 情况1 : 旧元素虚拟节点的children类型为text，新元素虚拟节点的children类型为array
            if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                
                // 清除旧的children文本虚拟节点
                hostSetElementText(container, "");
                // 挂载新的children数组虚拟节点
                mountChildren(newChildren, container, parentComponent);
                // 情况4 : 旧元素虚拟节点的children类型为array，新元素虚拟节点的children类型为array
            } else {
                patchKeyedChildren(oldChildren, newChildren, container, parentComponent, anchor);
            }
        }
    }

    // diff算法
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent, parentAnchor) {
        const newChildrenLength = newChildren.length;
        let i = 0;
        // 旧新children数组最后一个值的索引
        let oe = oldChildren.length - 1;
        let ne = newChildrenLength - 1;
        

        // 判断两个虚拟节点是否相同的逻辑
        function isSameVnodeType(vnode1, vnode2) {
            // 判断虚拟节点的类型或者虚拟节点所对应的组件的key值
            return vnode1.type === vnode2.type && vnode1.key === vnode2.key;
        }

        // 1.对比左侧
        // 指针向左移动，遇到不相同的节点时停止对比
        while (i <= oe && i <= ne) {
            const oldVnode = oldChildren[i];
            const newVnode = newChildren[i];

            if (isSameVnodeType(oldVnode, newVnode)) {
                patch(oldVnode, newVnode, container, parentComponent, parentAnchor);
            } else {
                break;
            }
            i++;
        }
        // console.log(i);

        // 2.对比右侧
        // 指针向右移动，遇到不同的节点时停止对比
        while(i <= oe && i <= ne) {
            const oldVnode = oldChildren[oe];
            const newVnode = newChildren[ne];

            if (isSameVnodeType(oldVnode, newVnode)) {
                patch(oldVnode, newVnode, container, parentComponent, parentAnchor);
            } else {
                break;
            }

            // 通过向右移动oe和ne指针
            oe--;
            ne--;
        }
        // console.log(i, oe, ne)


        // 3.对比中间
        // 3.1如果新的children虚拟节点长度大于旧的-添加新的节点
        // 确定中间的区域为 oe < i <= ne
        // i的值为'1.对比左侧'结束后的值
        if (i > oe) {
            if (i <= ne) {
                const nextPos = ne + 1;
                // 指定插入新的节点的位置
                const anchor = nextPos < newChildrenLength ? newChildren[nextPos].elem : null;
                // 可能添加多个节点
                while (i <= ne) {
                    patch(null, newChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }

            // 3.2如果旧的children虚拟节点长度大于新的-删除节点
            // 确定中间的区域为 ne < i <= oe
            // 删除旧的children中i位置的那个节点
        } else if (i > ne) {
            while (i <= oe) {
                hostRemove(oldChildren[i].elem);
                i++;
            }
        }
        // console.log(i)
    }


    function unmountChildren(ArrayChildren: Array<any>) {
        // console.log("unmount")
        for (let i = 0; i < ArrayChildren.length; i++) {
            // 获取当前children所对应的真实DOM元素
            const elem = ArrayChildren[i].elem;
            // 移除该DOM元素
            hostRemove(elem);
        }   
    }

    // 比较新旧Props
    function patchProps(elem, oldProps, newProps) {

        if (oldProps !== newProps) {
            // 处理情况1   foo : value → foo : new-value
            // 处理情况2   foo : value → foo : undefined || null
            // 遍历新的props
            // 取出新的props中所有prop
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];

                // 比较新旧prop的值
                if (prevProp !== nextProp) {
                    // 触发props的更新
                    hostHandleProps(elem, key, prevProp, nextProp);
                }
            }

            // 处理情况3 foo : value →
            if (oldProps !== EMPTY_OBJ) {
                // 遍历旧的props
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostHandleProps(elem, key, oldProps[key], null)
                    }
                }
            }
        }
    }

    function mountElement(vnode, container, parentComponent, anchor) {
        // 如果vnode的类型为元素虚拟节点类型
        // 则vnode中type属性对应元素名（例如div）
        // props属性对应元素上的特性名（例如id）
        // children属性对应元素的内容（子元素）（例如文本内容，元素内容）
        // 此时children就分为string和array类型
        // 如果为string类型，则说明children的值就为一个文本值，是当前元素的文本内容
        // 如果为array类型，则说明children的值为一个存放有一个或多个元素虚拟节点（由h函数创建）的数组

        const { type, props, children, shapeFlag } = vnode;
        // 处理type
        // const elem = (vnode.elem = document.createElement(type));
    
        // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
        // 将以上代码抽离到createElement函数中
        const elem = (vnode.elem = hostCreateElement(type));

        // 处理props
        for (const key in props) {
            const val = props[key];
            // 判断所有的特性中是否存在例如onClick
            // if (key === 'onClick') {
            //     // 处理事件
            //     elem.addEventListener('click', val);
            
            // } else {
            //     elem.setAttribute(key, val);
            // }

            // 将以上的判断逻辑使用正则进行优化
            // const isOn = (key: string) => /^on[A-Z]/.test(key);
            // if (isOn(key)) {
            //     // 处理事件
            //     const eventName = key.slice(2).toLowerCase();
            //     elem.addEventListener(eventName, val);
            
            // } else {
            //     elem.setAttribute(key, val);
            // }

            // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
            // 将以上代码抽离到ptachProps函数中
            hostHandleProps(elem, key, null, val);
    
        }

        // 处理chldren
        handleChildren(children, elem, shapeFlag, parentComponent);

        // 将元素挂载到容器上，使得其在页面上被渲染
        // container.append(elem);

        // 自定义渲染器，使得vue能渲染在例如Canvas、DOM等不同平台上
        // 将以上代码抽离到inset函数中
        hostInsert(elem, container, anchor);
    }

    function handleChildren(children, container, shapeFlag, parentComponent) {
        // children为string类型
        // if (typeof children === 'string') {
        //     container.textContent = children;
        //     // children为array类型
        // } else if(Array.isArray(children)){
        //     // console.log(children);
        //     children.forEach(child => patch(child, container))
        // }
    
        // 将以上代码进行优化
        // 使用ShapeFlags进行位运算的判断
        // 判断children是否为string类型
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = children;
            // 判断children是否为array类型
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // children为array类型
            // console.log(children);
            children.forEach(child => patch(null, child, container, parentComponent))
        }
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        // 先初始化props和slots，然后获取并处理原始组件中的setup函数的返回值
        setupComponent(instance);
        // 调用原始组件的render()函数，获取其返回的结果值，元素虚拟节点类型，然后调用processElement()将元素类型挂载到容器元素上，渲染在页面上
        setupRenderEffect(instance, container, vnode);
    }

    function setupRenderEffect(instance, container, vnode) {
        // const { proxy } = instance;
        // // subTree为一个元素类型的虚拟节点
        // const subTree = instance.render.call(proxy);
        // patch(subTree, container, instance);

        // // subTree的elem属性存放的是一个组件虚拟节点转换为元素虚拟节点之后所对应的那个DOM元素，也是通过$el属性将要获取到的值
        // // 将其赋值给组件实例所对应的虚拟节点中的elem属性上
        // vnode.elem = subTree.elem;



        // 实现update
        // 将以上代码放入effect中作为依赖，当值发生更新时触发依赖的收集和依赖触发
        effect(() => {
            // 区分页面初始化和更新（组件挂载和更新）
            if (!instance.isMounted) {
                // 初始化
                console.log("初始化")
                const { proxy } = instance;
                const subTree =  (instance.subTree = instance.render.call(proxy));
                console.log(subTree)
                patch(null, subTree, container, instance);
                vnode.elem = subTree.elem;


                instance.isMounted = true;
            } else {
                // 更新
                console.log("更新");
                const { proxy } = instance;
                // 之前（更新前）的subTree
                const prevSubTree = instance.subTree;
                // console.log(prevSubTree);
                const subTree = instance.render.call(proxy);
                // 更新后的subTree
                instance.subTree = subTree;
                // console.log(subTree);

                patch(prevSubTree, subTree, container, instance);
            }
        })
    }



    // 解决导入render时报错的问题（因为render不再导出了）
    return {
        createApp : createAppAPI(render)
    }
}