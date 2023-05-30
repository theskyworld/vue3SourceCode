import { transform } from "../src/transform";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse"


describe("codegen", () => {
    it("string", () => {
        // 基于文本节点，内容为"hi"来生成一个render函数
        const ast = baseParse('hi');
        transform(ast);
        const { code } = generate(ast);
        

        // 生成code的快照
        // 生成的文件在_snapshots_文件夹中查看
        // 每次code更新之后要执行npm test -- -u 来进行快照的更新
        // 否则将导致测试失败
        expect(code).toMatchSnapshot();
    })
})