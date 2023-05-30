import { transform } from "../src/transform";
import { baseParse } from "../src/parse"
import { NodeTypes } from "../src/ast";


describe("transform", () => {
    it("revise 'hi,' to 'hi, mini-vue' ", () => {
        const ast = baseParse("<div>hi,{{message}}</div>");

        // 实现逻辑函数的可测试性思想
        // 在执行逻辑函数的时候支持在测试中传入要执行的逻辑options
        // 逻辑函数通过执行options来对数据进行特定的处理
        // 创建一个plugin来指定对数据修改的方式，并作为逻辑函数的options参数来进行传入
        const plugin = (node) => {
            if (node.type === NodeTypes.TEXT) {
                node.content = node.content + " mini-vue";
            }
        };

        transform(ast, {
            nodeTransforms : [plugin],
        });

        const nodeText = ast.children[0].children[0];
        expect(nodeText.content).toBe("hi, mini-vue")
    })
})