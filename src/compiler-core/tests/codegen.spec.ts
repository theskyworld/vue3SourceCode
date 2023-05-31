import { transform } from "../src/transform";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse"
import { transformExpression } from "../src/utils/transform/transformExpression";
import { transformElement } from "../src/utils/transform/transformElement";
import { transformUnion } from "../src/utils/transform/transformUnion";
import { transformText } from "../src/utils/transform/transformText";


describe("codegen", () => {
    it("string", () => {
        // 基于文本节点，内容为"hi"来生成一个render函数
        const ast = baseParse('hi');
        transform(ast);
        const { code } = generate(ast);
        

        // 生成code的快照
        // 生成的文件在_snapshots_文件夹中查看
        // 每次code更新之后要执行npm test -- -u 来进行相应快照的更新
        // 否则将导致测试失败
        expect(code).toMatchSnapshot();
    });

    
    
    it("interpolation", () => {
        // 基于插值，内容为message来生成一个render函数
        const ast = baseParse('{{message}}');
        transform(ast, {
            nodeTransforms: [transformExpression],
        });
        const { code } = generate(ast);
        

        // 生成code的快照
        // 生成的文件在_snapshots_文件夹中查看
        // 每次code更新之后要执行npm test -- -u 来进行快照的更新
        // 否则将导致测试失败
        expect(code).toMatchSnapshot();
    });

    it("element", () => {
        // 基于元素类型来生成一个render函数
        const ast = baseParse('<div></div>');
        transform(ast, {
            nodeTransforms: [transformElement],
        });
        const { code } = generate(ast);
        

        // 生成code的快照
        // 生成的文件在_snapshots_文件夹中查看
        // 每次code更新之后要执行npm test -- -u 来进行快照的更新
        // 否则将导致测试失败
        expect(code).toMatchSnapshot();
    });


    it("union", () => {
        // 基于联合类型来生成一个render函数
        const ast = baseParse('<div>hi,{{message}}</div>');
        transform(ast, {
            nodeTransforms : [transformExpression, transformElement, transformText], 
        });
        const { code } = generate(ast);
        

        // 生成code的快照
        // 生成的文件在_snapshots_文件夹中查看
        // 每次code更新之后要执行npm test -- -u 来进行快照的更新
        // 否则将导致测试失败
        expect(code).toMatchSnapshot();
    })
})