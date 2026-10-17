/**
 * PANDA CAMPUS 共享数据定义（PRD V1.2 第 12.2 节、地点地图专题第 06 章）。
 * 只放类型，不放运行时代码：小程序只能打包自己目录内的文件，这里的类型通过 `import type` 引用，编译后会被擦除。
 */

/** 四类业务（内部 ID，不用界面文案当 ID） */
export type CardType = 'opportunity' | 'merchant' | 'identity' | 'event';

/** 首页分类入口：「全部」是聚合视图，不是第五个业务类别 */
export type CategoryKey = 'all' | CardType;

export type PublishStatus = 'draft' | 'pending_review' | 'published' | 'withdrawn';

export type Visibility = 'public' | 'campus' | 'restricted';

/** 时间值和它的含义：发生、截止、营业、有效 */
export interface TimeInfo {
  kind: 'occurs' | 'deadline' | 'business_hours' | 'valid';
  /** ISO 8601；营业时间等周期性信息用 text 表达 */
  start?: string;
  end?: string;
  /** 已排版好的展示文本，例如「9.14 – 10.30」 */
  text: string;
  timezone: string;
}

export interface CardMetrics {
  /** 真实浏览量；前台严格大于 1000 才显示（PRD 4.2） */
  views?: number;
  signups?: number;
  remaining?: number;
}

export interface Capability {
  capability_id: string;
  /** CTA 文案动词：查看、申请、咨询、加入、报名… */
  label: string;
  status: 'enabled' | 'disabled' | 'external';
  /** 高优先级行动（如报名、提交）：紧凑列表里也显示按钮；否则列表只显示「>」进入详情 */
  prominent?: boolean;
  /** 小程序内路由或官方外链 */
  route?: string;
  disabled_reason?: string;
}

/** 关键属性（小标签来源）。数组顺序是展示顺序，rank 是重要度（1 最重要），橱窗等窄卡按 rank 取前几项 */
export interface KeyFact {
  text: string;
  rank: number;
}

export interface InformationCard {
  card_id: string;
  entity_id: string;
  type: CardType;
  subtype?: string;
  /** 大标签，最多两个汉字，例如「就业」「创业」「社团」 */
  label: string;
  title: string;
  summary?: string;
  media_ids: string[];
  /** 媒体地址（由 media_ids 解析得到，前台直接使用） */
  cover_url?: string;
  time_info?: TimeInfo;
  place_ids: string[];
  /** 展示用的地点文本，例如「体育场 · 体测中心」或「线上」 */
  place_text?: string;
  /** 经过核对的关键属性，作为小标签来源（1–3 个） */
  key_facts: KeyFact[];
  metrics: CardMetrics;
  publisher_entity_id: string;
  responsible_entity_ids: string[];
  created_by: string;
  on_behalf_of?: string;
  capabilities: Capability[];
  publish_status: PublishStatus;
  valid_from?: string;
  valid_until?: string;
  visibility: Visibility;
  updated_at: string;
  /** 示例数据标记：UI 母版示例卡为 true，真实数据为 false */
  sample?: boolean;
}

export interface Entity {
  entity_id: string;
  kind: 'person' | 'organization' | 'merchant';
  name: string;
  avatar_url?: string;
  verified: boolean;
  bio?: string;
}

export interface Place {
  place_id: string;
  campus_id: string;
  name: string;
  /** 经过核验的坐标；没有就不上图 */
  latitude: number;
  longitude: number;
  verified_at: string;
  visibility: Visibility;
}

export interface CardPlaceRelation {
  card_id: string;
  place_id: string;
  relation_type: 'held_at' | 'located_at' | 'service_area' | 'nearby';
  verified_at: string;
}

/** listCards 的分页结果：total 是真实查询计数，不是演示数字 */
export interface Paged<T> {
  items: T[];
  total: number;
  cursor?: string;
}

export interface CardQuery {
  category: CategoryKey;
  query?: string;
  filters?: Record<string, string[]>;
  sort?: 'recommended' | 'latest' | 'starting_soon' | 'nearest';
  cursor?: string;
}
