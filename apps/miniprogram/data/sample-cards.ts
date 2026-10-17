/**
 * UI 母版（design/ui 三视图）里的 5 张示例卡，只在 config.USE_SAMPLE_DATA 为 true 时使用。
 * 不是数据库真实数据：sample 都为 true，上线前必须关闭示例数据。
 *
 * 标签照图保留（2026-10-17 需求方确认）：「通知」「服务」不在 PRD V1.2 四类里，type 按最接近的类别归入
 * （通知 → event 活动，服务 → merchant 商家·生活服务），只用于分类筛选；标签外观用母版的浅黄色。
 * 母版里运动会显示 560 浏览量，但 PRD 规定严格大于 1000 才显示，所以这里不会显示。
 */
import type { InformationCard } from '@schema';

type BaseFields = 'media_ids' | 'place_ids' | 'responsible_entity_ids' | 'created_by' | 'publish_status' | 'visibility' | 'updated_at' | 'sample';

const base: Pick<InformationCard, BaseFields> = {
  media_ids: [],
  place_ids: [],
  responsible_entity_ids: [],
  created_by: 'sample',
  publish_status: 'published',
  visibility: 'public',
  updated_at: '2026-10-17T00:00:00+08:00',
  sample: true,
};

export const SAMPLE_CARDS: InformationCard[] = [
  {
    ...base,
    card_id: 'sample-001',
    entity_id: 'sample-entity-001',
    publisher_entity_id: 'sample-entity-001',
    type: 'event',
    label: '通知',
    title: '2026 体质测试须知',
    time_info: { kind: 'occurs', text: '9.14 – 10.30', timezone: 'Asia/Shanghai' },
    place_text: '体育场 · 体测中心',
    key_facts: [
      { text: '预约制', rank: 1 },
      { text: '身份证', rank: 3 },
      { text: '不安排补测', rank: 2 },
    ],
    metrics: { views: 1200 },
    capabilities: [{ capability_id: 'view_detail', label: '查看', status: 'enabled' }],
  },
  {
    ...base,
    card_id: 'sample-002',
    entity_id: 'sample-entity-002',
    publisher_entity_id: 'sample-entity-002',
    type: 'merchant',
    label: '服务',
    title: '图书馆 · 数字馆员',
    time_info: { kind: 'business_hours', text: '08:00 – 22:00', timezone: 'Asia/Shanghai' },
    place_text: '图书馆主馆',
    key_facts: [
      { text: 'AI 问答', rank: 1 },
      { text: '书籍推荐', rank: 2 },
      { text: '馆内导航', rank: 3 },
    ],
    metrics: { views: 3400 },
    capabilities: [{ capability_id: 'consult', label: '咨询', status: 'enabled' }],
  },
  {
    ...base,
    card_id: 'sample-003',
    entity_id: 'sample-entity-003',
    publisher_entity_id: 'sample-entity-003',
    type: 'event',
    label: '活动',
    title: '新生趣味运动会',
    time_info: { kind: 'occurs', text: '10.18 14:00', timezone: 'Asia/Shanghai' },
    place_text: '东区运动场',
    key_facts: [
      { text: '团队', rank: 1 },
      { text: '报名进行中', rank: 3 },
      { text: '限新生', rank: 2 },
    ],
    metrics: { views: 560 },
    capabilities: [{ capability_id: 'signup', label: '报名', status: 'enabled', prominent: true }],
  },
  {
    ...base,
    card_id: 'sample-004',
    entity_id: 'sample-entity-004',
    publisher_entity_id: 'sample-entity-004',
    type: 'merchant',
    label: '商家',
    title: 'PANDA CAFÉ',
    time_info: { kind: 'business_hours', text: '08:00 – 21:00', timezone: 'Asia/Shanghai' },
    place_text: '图书馆 C 馆 1F',
    key_facts: [
      { text: '咖啡', rank: 1 },
      { text: '简餐', rank: 2 },
      { text: '学生优惠', rank: 3 },
    ],
    metrics: { views: 2800 },
    capabilities: [{ capability_id: 'coupon', label: '领券', status: 'enabled' }],
  },
  {
    ...base,
    card_id: 'sample-005',
    entity_id: 'sample-entity-005',
    publisher_entity_id: 'sample-entity-005',
    type: 'merchant',
    label: '服务',
    title: '宿舍报修',
    time_info: { kind: 'valid', text: '全天可报', timezone: 'Asia/Shanghai' },
    place_text: '学生公寓',
    key_facts: [
      { text: '水电', rank: 1 },
      { text: '门窗', rank: 2 },
      { text: '设备', rank: 3 },
    ],
    metrics: {},
    capabilities: [{ capability_id: 'repair_submit', label: '提交', status: 'enabled', prominent: true }],
  },
];
