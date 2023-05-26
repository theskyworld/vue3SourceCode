// 安装 @rollup/plugin-typescript插件
import typescript from '@rollup/plugin-typescript';
// 导入json配置文件时需要添加assert { type : "json"}
import pkg from './package.json' assert { type : "json"};
export default {
    input: "./src/index.ts",
    output: [
        // 打包出两个模块规范
        // cjs（commonjs）规范
        // esm规范
        {
            format: "cjs",
            // file : "lib/guide-mini-vue.cjs.js",
            // 优化
            file : pkg.main,
        },
        {
            format: "esm",
            // file : "lib/guide-mini-vue.esm.js",
            // 优化
            file : pkg.module,
        }
    ],
    plugins: [
        // 用于支持typescript的插件
        typescript(),
    ]
}