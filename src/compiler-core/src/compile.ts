import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./utils/transform/transformElement";
import { transformExpression } from "./utils/transform/transformExpression";
import { transformText } from "./utils/transform/transformText";

export function baseCompile(template) {
  const ast: any = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });

  return generate(ast);
}