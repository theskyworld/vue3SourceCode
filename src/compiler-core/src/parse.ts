import { NodeTypes } from "./ast";

const enum TagType{
    Start,
    End,
}

export function baseParse(content : string) {

    const context = createParserContext(content);
    return createRoot(parseChildren(context))


}

function parseChildren(context) {
    const nodes: Array<any> = [];
    // 判断解析插值
    let node;
    if (context.source.startsWith("{{")) {
        node = parseInterpolation(context);
        // 判断解析元素
    } else if (context.source[0] === "<" && /[a-z]/i.test(context.source[1])) {
        // console.log('parse element')
        node = parseElement(context);
    }
    nodes.push(node);

    return nodes;
}

function parseElement(context) {
    // 解析<div>
    const element = parseTag(context, TagType.Start);
    // 解析</div>
    parseTag(context, TagType.End);

    return element;
}

function parseTag(context, tagType : TagType) {
    // 使用正则解析出tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    console.log(match); // "<div"
    const tag = match[1];

    // 删除处理完成的代码
    // 删除"<div>"
    advanceBy(context, match[0].length);
    advanceBy(context, 1);

    if (tagType === TagType.End) return;
    return {
        type: NodeTypes.ELEMENT,
        tag,
    }
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