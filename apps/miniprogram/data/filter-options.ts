/**
 * 全局筛选的七维筛选链（《全局筛选与条件串》）：分类 → 时间 → 地点 → 状态 → 条件 → 费用 → 排序，
 * 分类、时间、地点、排序按 PRD 7.1；状态、条件、费用的选项是按 PRD 7.2 拟的草案，最终选项和数据覆盖待定（见需求板 R-10）。
 * 这些只是筛选界面的选项，真实筛选逻辑由后端实现。
 */
import type { CategoryKey } from '@schema';

export interface FilterOption {
  value: string;
  text: string;
  /** 不可用时给出原因（PRD 3.4：禁用态要解释原因） */
  disabledReason?: string;
}

export type FilterDim = 'category' | 'time' | 'place' | 'status' | 'condition' | 'cost' | 'sort';

export const CATEGORY_OPTIONS: FilterOption[] = [
  { value: 'all', text: '全部' },
  { value: 'opportunity', text: '就业' },
  { value: 'merchant', text: '商家' },
  { value: 'identity', text: '社团' },
  { value: 'event', text: '活动' },
];

export const TIME_OPTIONS: FilterOption[] = [
  { value: 'any', text: '不限' },
  { value: 'today', text: '今天' },
  { value: 'tomorrow', text: '明天' },
  { value: 'this_week', text: '本周' },
  { value: 'weekend', text: '本周末' },
  { value: 'custom', text: '自定义', disabledReason: '自定义时间开发中' },
];

export const PLACE_OPTIONS: FilterOption[] = [
  { value: 'any', text: '不限' },
  { value: 'campus', text: '校内' },
  { value: 'picked', text: '指定地点', disabledReason: '选择地点需要地点数据，开发中' },
  { value: 'nearby', text: '附近', disabledReason: '需要定位授权和核验坐标' },
  { value: 'online', text: '线上' },
];

/** 状态：报名、招新、营业、截止等实时状态，必须由真实数据驱动（PRD 4.2） */
export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'any', text: '不限' },
  { value: 'open', text: '可参与' },
  { value: 'recruiting', text: '招新中' },
  { value: 'closing_soon', text: '即将截止' },
  { value: 'ended', text: '已结束' },
];

/** 条件：参加资格、经验要求、参与方式（PRD 7.2） */
export const CONDITION_OPTIONS: FilterOption[] = [
  { value: 'any', text: '不限' },
  { value: 'offline', text: '线下' },
  { value: 'online', text: '线上' },
  { value: 'freshman', text: '限新生' },
  { value: 'no_experience', text: '无经验要求' },
  { value: 'booking', text: '需预约' },
];

/** 费用：只在有真实报价 / 费用数据时有意义（PRD 7.1） */
export const COST_OPTIONS: FilterOption[] = [
  { value: 'any', text: '不限' },
  { value: 'free', text: '免费' },
  { value: 'paid', text: '收费' },
  { value: 'student_discount', text: '学生优惠' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'recommended', text: '推荐' },
  { value: 'latest', text: '最新发布' },
  { value: 'starting_soon', text: '即将开始' },
  { value: 'nearest', text: '距离最近', disabledReason: '需要核验坐标后才能按距离排序' },
];

/** 七维筛选链：顺序固定 */
export const FILTER_STEPS: { dim: FilterDim; text: string; title: string; options: FilterOption[] }[] = [
  { dim: 'category', text: '分类', title: '选择分类', options: CATEGORY_OPTIONS },
  { dim: 'time', text: '时间', title: '选择时间', options: TIME_OPTIONS },
  { dim: 'place', text: '地点', title: '选择地点', options: PLACE_OPTIONS },
  { dim: 'status', text: '状态', title: '选择状态', options: STATUS_OPTIONS },
  { dim: 'condition', text: '条件', title: '选择条件', options: CONDITION_OPTIONS },
  { dim: 'cost', text: '费用', title: '选择费用', options: COST_OPTIONS },
  { dim: 'sort', text: '排序', title: '选择排序', options: SORT_OPTIONS },
];

/** 每个维度的默认值（「不限」/「全部」/「推荐」） */
export const DIM_DEFAULTS: Record<FilterDim, string> = {
  category: 'all' satisfies CategoryKey,
  time: 'any',
  place: 'any',
  status: 'any',
  condition: 'any',
  cost: 'any',
  sort: 'recommended',
};

export function optionText(options: FilterOption[], value: string): string {
  return options.find((o) => o.value === value)?.text ?? '';
}
