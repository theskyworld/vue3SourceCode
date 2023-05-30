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
                tag: "div",
                children : [],
            })
        })
     })
    
    // 解析文本的测试
    describe("text", () => {
        test("simple text", () => {
            const ast = baseParse("some text");

            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content : "some text",
            })
        })
    })
    

    // 三种类型联合解析的测试
    test("interpolation element text (hello world)", () => {
        const ast = baseParse("<div>hi,{{ message }}</div>");
        // 正确的ast结构应当为
        //     element
        //  ⬇           ⬇
        // text     interpolation

        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: "div",
            children: [
                {
                    type: NodeTypes.TEXT,
                    content : "hi,",
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content : "message",
                    }
                }
            ]
        })

    })


    // 处理嵌套的元素类型的测试
    test("nested element", () => {
        const ast = baseParse("<div><p>hi</p>{{ message }}</div>");

        expect(ast.children[0]).toStrictEqual({
            type: NodeTypes.ELEMENT,
            tag: "div",
            children: [
                {
                    type: NodeTypes.ELEMENT,
                    tag: "p",
                    children: [
                        {
                            type: NodeTypes.TEXT,
                            content : 'hi',
                        }
                    ]
                },
                {
                    type: NodeTypes.INTERPOLATION,
                    content: {
                        type: NodeTypes.SIMPLE_EXPRESSION,
                        content : "message",
                    }
                }
            ]
        })
    })
    

    // 测试缺少元素的结束标签时抛出错误
    test("should throw error when lack end tag", () => {
        expect(() => {
            baseParse("<div><span></div>");  //"span"标签缺少结束标签
        }).toThrow();
    })
})