// 把小程序示例卡（apps/miniprogram/data/sample-cards.ts）转成 H5 原型用的 data.js。
// 运行：node tools/sync-h5-data.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'apps/miniprogram/data/sample-cards.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
const out = `// 自动生成：tools/sync-h5-data.js，请勿手改\nwindow.SAMPLE_CARDS = ${JSON.stringify(mod.exports.SAMPLE_CARDS, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'apps/h5-prototype/data.js'), out);
console.log('written', mod.exports.SAMPLE_CARDS.length, 'cards');
