// 把小程序的示例卡和筛选选项转成 H5 原型用的 data.js。
// 运行：node tools/sync-h5-data.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function load(rel) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
  return mod.exports;
}

const { SAMPLE_CARDS } = load('apps/miniprogram/data/sample-cards.ts');
const opts = load('apps/miniprogram/data/filter-options.ts');
const FILTER_OPTIONS = {
  steps: opts.FILTER_STEPS,
  defaults: opts.DIM_DEFAULTS,
};
const out = `// 自动生成：tools/sync-h5-data.js，请勿手改
window.SAMPLE_CARDS = ${JSON.stringify(SAMPLE_CARDS, null, 2)};
window.FILTER_OPTIONS = ${JSON.stringify(FILTER_OPTIONS, null, 2)};
`;
fs.writeFileSync(path.join(root, 'apps/h5-prototype/data.js'), out);
console.log('written', SAMPLE_CARDS.length, 'cards +', FILTER_OPTIONS.steps.length, 'filter steps');
