# admin · SFOS 运营录入后台

第一阶段 M1：SFOS 代理录入、核验、上下架四类信息（就业 / 商家 / 社团 / 活动）。

- 必须分开记录实际录入人 `created_by`、原归属主体 `publisher_entity_id` 和代理关系 `on_behalf_of`（PRD 4.3）
- 只能通过 `services/api` 读写数据，不直接连数据库

状态：未开始。
