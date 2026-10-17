# PANDA CAMPUS

校园本地信息发现与行动入口。当前范围：校园 Tab（第一阶段：搜索、浏览、胖达百科式推荐）。

## 目录

```text
apps/
  miniprogram/     微信小程序前端（AppID wxe20ca5becd49789b）
  admin/           SFOS 运营录入后台（未开始）
  h5-prototype/    H5 对照原型，用于和 UI 母版逐像素比对
services/
  api/             数据库与卡片接口（未开始）
  agent/           胖达检索与推荐（未开始）
packages/
  schema/          共享数据定义（未开始）
docs/
  prd/             PRD V1.2（交付包中的 .md 与参考图，原 01–05 子目录已合并到这一层）
  需求板.md         缺素材、待确认问题、已确认的决策（只在本地维护，不进仓库）
  screenshots/     还原对照截图
design/
  ui/              UI 母版原图
```

## 小程序

用微信开发者工具导入**仓库根目录**即可，`project.config.json` 已经把 `miniprogramRoot` 指向 `apps/miniprogram/`。

命令行生成预览二维码（需先在开发者工具「设置 → 安全设置」里打开服务端口）：

```bash
"/e/微信web开发者工具/cli.bat" preview --project "E:\Desktop\Panda-Campus" --qr-format image --qr-output "E:\Desktop\Panda-Campus\.preview\preview-qr.png"
```

### 开发约定

- 语言：TypeScript（开发者工具的 `typescript` 编译插件，无需额外构建）。类型检查：`npm install` 后运行 `npm run typecheck`
- 共享数据类型写在 `packages/schema/src`，小程序里用 `import type { ... } from '@schema'` 引用（只引用类型，编译后会被擦除）
- 样式：颜色、圆角用 `app.wxss` 里的 CSS 变量；尺寸直接写 rpx（设计稿 390 css px = 750rpx）
- 状态：`store/campus.ts` 统一管理分类、搜索、筛选、密度、视图模式，页面用 `connectStore` 订阅
- 请求：统一走 `utils/request.ts`，错误抛 `ApiError`；接口未就绪时 `config.ts` 的 `USE_SAMPLE_DATA` 为 true，只显示标记为示例的卡片
- 信息卡：`components/info-card`，`density` 取值 `large` / `showcase` / `list`。调试时可以用启动参数 `pages/campus/index?density=list` 直接打开某一档

## H5 原型

H5 只用于和 UI 母版逐像素对照。卡片样式和示例数据从小程序同步，不要在 H5 里手改：

```bash
python tools/sync-h5-styles.py
```

```bash
node tools/sync-h5-data.js
```

URL 参数：`?density=large|showcase|list`、`?skeleton=1`（停在骨架屏）、`?flat=1&h=781`（截图模式）。对照截图在 `docs/screenshots/`。


```bash
python -m http.server 5173 --directory apps/h5-prototype
```

打开 http://localhost:5173 。加 `?flat=1` 是对照截图模式（固定 390×781，贴左上角）。

## 提交规范

提交信息用中文，格式为 `类型: 说明`，例如 `init: 第一次提交`、`feat: 新增筛选抽屉`、`fix: 修复胶囊对齐`、`docs: 更新需求板`。
