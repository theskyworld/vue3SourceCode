import { NodeTypes } from "./ast";

export function baseParse(content : string) {

    const context = createParserContext(content);
    return createRoot(parseChildren(context))


}

function parseChildren(context) {
    const nodes: Array<any> = [];
    // 判断是否处理插值
    let node;
    if (context.source.startsWith("{{")) {
        node = parseInterpolation(context);
    }
    nodes.push(node);

    return nodes;
}

function parseInterpolation(context) {
    // 解析接收到的插值
    // 取出字符串例如"{{message}}"中"{{}}"之间的内容message的值
    // "{{message}}"
    const openDelimiter = "{{";
    const closeDelimiter = "}}";

    const closeIndex = context.source.indexOf(closeDelimiter, closeDelimiter.length);
    // context.source = context.source.slice(openDelimiter.length)
    advanceBy(context, openDelimiter.length);

    // console.log(context.source); // "message}}"
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawcontent = context.source.slice(0, rawContentLength);
    // 处理空格
    const content = rawcontent.trim();
    // console.log(content); // "message"
    // 删除插值字符串后的（"}}"后的）所有内容

    // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
    advanceBy(context, rawContentLength + closeDelimiter.length)

    // console.log(content);
    return {
        // type: "interpolation",
        type : NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content : content,
        }
            
        
        
    }
}

function createRoot(children) {
    return {
        children,
    }
}

function createParserContext(content : string) : any {
    return {
        source : content,
    }
}

function advanceBy(context : any, length : number) {
    context.source = context.source.slice(length);;
}