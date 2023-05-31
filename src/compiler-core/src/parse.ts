import { NodeTypes } from "./ast";

const enum TagType{
    Start,
    End,
}

export function baseParse(content : string) {

    const context = createParserContext(content);
    return createRoot(parseChildren(context, []))


}

function parseChildren(context, ancestors) {
    // 使用ancestors收集所有的标签名
    // 用于判断是否存在缺少结束标签的标签或者获取某个指定标签

    const nodes: Array<any> = [];
   
    // 循环解析一个或多个children
    while (!isEnd(context, ancestors)) {
        let node;
         // 判断解析插值
        if (context.source.startsWith("{{")) {
            node = parseInterpolation(context);
            // 判断解析元素
        } else if (context.source[0] === "<" && /[a-z]/i.test(context.source[1])) {
            // console.log('parse element')
            node = parseElement(context, ancestors);
        }

        // 判断解析文本
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }

    return nodes;
}

function isEnd(context, ancestors) {
    // 确定while循环结束的条件
    // 1.当遇到结束标签时
    const s = context.source;
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //     return true;
    // }

    // 当每次遇到结束标签时，判断ancestors中是否存在相应匹配的开始标签
    if (s.startsWith("</")) {
        // for (let i = 0; i < ancestors.length; i++) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            // 取出ancestors中每个标签的标签名
            const tag = ancestors[i].tag;
            // 截取出结束标签的标签名并进行对比
            // if (s.slice(2, 2 + tag.length) === tag) {
            //     return true;
            // }

            if (isStartsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }

    // 2.当source处理完成时
    return !s;

}

function parseText(context) {

    // 解析三种类型的联合类型
    // 字符串的部分是指在插值类型的"{{"前的部分
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // 在context.source中找到了"{{"，说明存在插值
        // 字符串的部分是指在插值类型的"{{"或者元素类型的"<"（嵌套元素内）两者之中第一个前的部分
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    
    


    // // 获取字符串内容
    // const content = context.source.slice(0, endIndex);

    // // 删除已经处理的内容
    // advanceBy(context, content.length);
    const content = parseTextData(context, endIndex);

    


    return {
        type: NodeTypes.TEXT,
        content,
    }
}

function parseTextData(context, length) {
     // 获取字符串内
    const content = context.source.slice(0, length);

    // 删除已经处理的内容
    advanceBy(context, length);

    return content;
}

function parseElement(context, ancestors) {
    // 解析<div>
    const element: any = parseTag(context, TagType.Start);
    
    ancestors.push(element); //将每个element收集进入ancestors

    // 解析三种类型的联合类型
    // 解析元素类型的时候，其下面可能存在多个或多层嵌套的children需要解析
    // 递归进行解析
    element.children = parseChildren(context, ancestors);

    ancestors.pop();

    // if (context.source.slice(2, 2 + element.tag.length) === element.tag) {
    if(isStartsWithEndTagOpen(context.source, element.tag)){
            // 解析</div>
        parseTag(context, TagType.End);
    } else {
        throw new Error(`缺少结束标签:${element.tag}`)
    }

    return element;
}

function isStartsWithEndTagOpen(source, tag) {
    return source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();

}
function parseTag(context, tagType : TagType) {
    // 使用正则解析出tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source);
    // console.log(match); // "<div"
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
    // const rawcontent = context.source.slice(0, rawContentLength);
    const rawcontent = parseTextData(context, rawContentLength)
    // 处理空格
    const content = rawcontent.trim();
    // console.log(content); // "message"
    // 删除插值字符串后的（"}}"后的）所有内容

    // context.source = context.source.slice(rawContentLength + closeDelimiter.length);
    // advanceBy(context, rawContentLength + closeDelimiter.length);
    advanceBy(context, closeDelimiter.length);

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
        type : NodeTypes.ROOT,
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