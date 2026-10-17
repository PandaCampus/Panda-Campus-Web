# api · 数据库与卡片接口

第一阶段 M1 / M2：`Entity / InformationCard / Place / EntityRelation / Capability / MediaAsset / ChangeLog`。

建议接口（PRD 12.3）：`listCards`、`getCard`、`getEntity`、`listPlaces`、`listCardsByPlace`、`getCapability`。
所有查询默认只返回：已审核、在有效期内、当前用户有权访问的数据。

数据定义统一引用 `packages/schema`。状态：未开始。
