/**
 * UI 母版里的示例卡，只在 config.USE_SAMPLE_DATA 为 true 时使用。
 * 不是数据库真实数据：sample 标记为 true，上线前必须关闭示例数据。
 * 母版其余示例（图书馆数字馆员、PANDA CAFÉ 等）属于「通知 / 服务」类，不在 PRD V1.2 的四类里，没有搬过来。
 */
import type { InformationCard } from '@schema';

export const SAMPLE_CARDS: InformationCard[] = [
  {
    card_id: 'sample-event-001',
    entity_id: 'sample-entity-001',
    type: 'event',
    label: '活动',
    title: '2026 体质测试须知',
    media_ids: [],
    time_info: { kind: 'occurs', text: '9.14 – 10.30', timezone: 'Asia/Shanghai' },
    place_ids: [],
    place_text: '体育场 · 体测中心',
    key_facts: ['预约制', '身份证', '不安排补测'],
    metrics: { views: 1200 },
    publisher_entity_id: 'sample-entity-001',
    responsible_entity_ids: [],
    created_by: 'sample',
    capabilities: [{ capability_id: 'view_detail', label: '查看', status: 'enabled' }],
    publish_status: 'published',
    visibility: 'public',
    updated_at: '2026-10-17T00:00:00+08:00',
    sample: true,
  },
];
