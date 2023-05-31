import { isWhiteSpaceLike } from "typescript";
import { effect } from "../reactivity";
import { EMPTY_OBJ, isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { getSequence } from "./helpers";
import { shouldUpdateComponent } from "./helpers/componentUpdateUtils";
import { Fragment } from "./helpers/renderSlots";
import { queueJobs } from "./helpers/scheduler";


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
        if (!oldVnode) {
            mountComponent(newVnode, container, parentComponent);
        } else {
            updateComponent(oldVnode, newVnode);
        }
    }

    function updateComponent(oldVnode, newVnode) {
        const instance = (newVnode.component = oldVnode.component);
        if (shouldUpdateComponent(oldVnode, newVnode)) {
            // console.log("instance",instance);
            instance.nextVnode = newVnode;
            instance.update();
        } else {
            newVnode.elem = oldVnode.elem;
            instance.vnode = newVnode;
        }
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
            // 判断虚拟节点的类型以及虚拟节点所对应的组件的key值
            return vnode1.type === vnode2.type && vnode1.key === vnode2.key;
        }

        // 指针的移动和节点对比阶段
        // 指针从两端开始进行移动
        // 1.从左侧开始对比，i指针向右移动，遇到不相同的节点时停止对比
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

        
        // 2.从右侧开始对比，oe和ne指针向左移动，遇到不同的节点时停止对比
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


        // 处理节点，在不同节点的区域内进行新节点的添加或者旧节点的删除或修改操作
        // 一、处理两端-实现新children中节点的添加或者旧children中节点的删除
        // 如果新的children虚拟节点长度大于旧的-添加新的节点
        // 确定中间的区域为 oe < i <= ne
        // 添加新节点
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

            // 删除旧节点
            // 如果旧的children虚拟节点长度大于新的-删除节点
            // 确定中间的区域为 ne < i <= oe
            // 删除旧的children中i位置的那个节点
        } else if (i > ne) {
            while (i <= oe) {
                hostRemove(oldChildren[i].elem);
                i++;
            }

       // 二、处理中间节点-实现新children中新节点的添加或旧children中旧节点的删除或修改
        } else {
            // 确定中间要进行处理的节点区域
            // 旧新children中要进行比较的区域结束位置分别为oe、ne
            let os = i; // 旧children中要进行比较的起始位置
            let ns = i; // 新children中要进行比较的起始位置
            let toBePatched = ne - ns + 1; //记录新children中要添加或修改的节点数量
            let patched = 0; //记录新children中已经被添加或修改的节点数量
            let moved = false; //控制新children中是否存在需要移动的节点
            let maxNewIndexSoFar = 0; //记录新children中要处理的节点的最大顺序值（要处理的节点的数量 - 1）

            // 通过提供给节点的key属性进行比较
            // 其思路为将新children中要进行对比的节点区域中的所有节点的key以及相应的索引i存入映射表中
            // 然后在旧children中将要进行对比的节点区域中所有的节点进行遍历，看看在映射表中是否存在相应的key（如果节点相同的key相同，则在映射表中能找到）
            // 能找到则说明是已存在的，要被修改或保留；不能找到则说明是要被删除的，然后在映射表中所有新的key所对应的节点都是要新建的


            // 建立新children中节点的key和节点的索引i的映射表
            const keyToNewIndexMap = new Map();


            //解决处理中间节点时需要移动节点位置的情况
            const newIndexToOldIndexArray = new Array(toBePatched);  // 存储所有要处理的中间节点在新children中的索引值
            // 初始化，如果值为0，表示索引要处理的中间节点中第i个位置处的节点在旧的children中不存在，即需要新建的节点
            // 反之，如果例如在newIndexToOldIndexArray中索引为2的位置处值为5，则表示在新的children中第6个节点是需要进行处理的，且在节点在所有要处理的节点中为第3个
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexArray[i] = 0;
            }

            
            // 遍历新children中要对比的区域节点的key并将其对应的索引i存入映射表中
            for (let i = ns; i <= ne; i++) {
                const newChild = newChildren[i];
                keyToNewIndexMap.set(newChild.key, i);
            }
            // 遍历旧children中要对比的区域节点，依次比较key值
            for (let i = os; i <= oe; i++) {
                // 取出当前进行比较的旧节点
                const oldChild = oldChildren[i];


                // 如果新children中要被添加或修改的节点已经处理完毕了，但是还是调用了patch方法导致patched++
                // 当patched >= toBePatched时说明旧的children中存在要被移除的节点
                    if (patched >= toBePatched) {
                    // 直接将当前旧children中的节点移除
                    // 跳出后面的逻辑，进入下次循环
                    hostRemove(oldChild.elem);
                    continue;
                }


                let newIndex;
                if (oldChild.key !== null) {
                    // 方式一：通过提供给节点的key属性进行比较
                    newIndex = keyToNewIndexMap.get(oldChild.key);
                } else {
                    // 方式二；通过遍历进行比较
                    for (let j = ns; j <= ne; j++) {
                        if (isSameVnodeType(oldChild, newChildren[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }

                if (newIndex === undefined) {
                    // 不能找到则说明是要被删除的
                    hostRemove(oldChild.elem);
                } else {
                    // 能找到则说明是已存在的

                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    } else {
                        moved = true;
                    }
        
                    // 给newIndexToOldIndexArray赋值，记录在新的children中所有要进行处理的节点的索引
                    newIndexToOldIndexArray[newIndex - ns] = i + 1;
                    
                    patch(oldChild, newChildren[newIndex], container, parentComponent, null);
                    patched++;
                }
            }

            // 求取newIndexToOldIndexArray中的最长递增子序列（即前后顺序稳定的、不需要移动的节点索引）
                const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexArray) : [];    //返回的数组的值是不需要移动的节点在所有要处理的节点中所对应的顺序
                // 例如[5,3,4]为新children中所有要处理的节点的索引
                // 那么所对应的节点顺序的数组为[0,1,2]，最长递增子序列为[1,2]，即对应的3和4数组

                // let j = 0;
                // for (let i = 0; i < toBePatched; i++) {
                //     if (i !== increasingNewIndexSequence[j]) {
                //         // 需要移动位置的节点对应的顺序
                //     } else {
                //         // 不需要移动位置的节点对应的顺序
                //         j++;
                //     }
                // }

                // 倒序判断和插入节点
                let j = increasingNewIndexSequence.length - 1;
                for (let i = toBePatched - 1; i >= 0; i--) {
                    const nextIndex = i + ns; //所有新children中要处理的节点在要处理的节点中的顺序
                    const nextChild = newChildren[nextIndex];
                    const anchor = nextIndex + 1 < newChildrenLength ? newChildren[nextIndex + 1].elem : null;

                    // console.log("nextChild",nextChild)
                    if (newIndexToOldIndexArray[i] === 0) {
                        // 新建或修改节点
                        patch(null, nextChild, container, parentComponent, anchor);
                    // 移动节点
                    } else if (moved) {
                        
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 要移动位置的节点
                        hostInsert(nextChild.elem, container, anchor);
 
                        } else {
                            j--;
                        }
                    }
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
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
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
        instance.update = effect(() => {
            // 区分页面初始化和更新（组件挂载和更新）
            if (!instance.isMounted) {
                // 初始化
                console.log("初始化")
                const { proxy } = instance;
                const subTree =  (instance.subTree = instance.render.call(proxy, proxy));
                console.log(subTree)
                patch(null, subTree, container, instance);
                vnode.elem = subTree.elem;


                instance.isMounted = true;
            } else {
                // 更新
                console.log("更新");

                // 更新组件的props
                const { nextVnode, vnode: oldVnode } = instance;
                if (nextVnode) {
                    nextVnode.elem = oldVnode.elem;
                    updateComponentPreRender(instance, nextVnode);
                }


                const { proxy } = instance;
                // 之前（更新前）的subTree
                const prevSubTree = instance.subTree;
                // console.log(prevSubTree);
                const subTree = instance.render.call(proxy, proxy);
                // 更新后的subTree
                instance.subTree = subTree;
                // console.log(subTree);

                patch(prevSubTree, subTree, container, instance);
            }
        }, {
            scheduler() {
                console.log("update-scheduler")
                // 收集异步任务
                queueJobs(instance.update);
            }
        }
        )
    }



    // 解决导入render时报错的问题（因为render不再导出了）
    return {
        createApp : createAppAPI(render)
    }
}

function updateComponentPreRender(instance, nextVnode) {

    instance.vnode = nextVnode;
    instance.nextVnode = null;

    instance.props = nextVnode.props;
}