import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {
    // 解析插值的测试
    describe("interpolation", () => {
        test("simple interpolation", () => {
            const ast = baseParse("{{ message }}");

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content : "message",
                }
            })
        })
    })

    // 解析元素的测试
     describe("element", () => {
        test("simple element div", () => {
            const ast = baseParse("<div></div>");

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag : "div",
            })
        })
    })
})