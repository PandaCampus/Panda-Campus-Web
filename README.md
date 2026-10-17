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
  需求板.md         缺素材、待确认问题、已确认的决策
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

## H5 原型

```bash
python -m http.server 5173 --directory apps/h5-prototype
```

打开 http://localhost:5173 。加 `?flat=1` 是对照截图模式（固定 390×781，贴左上角）。

## 提交规范

提交信息用中文，格式为 `类型: 说明`，例如 `init: 第一次提交`、`feat: 新增筛选抽屉`、`fix: 修复胶囊对齐`、`docs: 更新需求板`。
