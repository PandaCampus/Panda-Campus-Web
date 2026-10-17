# agent · 胖达检索与百科式推荐

第一阶段 M3：只读工具 `searchCampusCards`、`getCampusCard`、`getPublicEntity`，返回与校园 Tab 相同的 `card_id`（PRD 6.1、12.3）。

边界约定（方便以后拆成独立仓库）：
- 只通过 `services/api` 的接口或工具访问数据，**不直接连数据库，不写数据表**
- 使用独立目录、独立依赖、独立部署
- 模型 API Key 等密钥只放在环境变量或部署平台里，仓库只放 `.env.example`
- 数据定义引用 `packages/schema`，不要另抄一份字段

胖达的聊天界面属于小程序「胖达」Tab，代码在 `apps/miniprogram`。状态：未开始。
