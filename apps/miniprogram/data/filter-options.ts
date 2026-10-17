/**
 * 筛选维度与选项（PRD 7.1 / 7.2）：类别｜时间｜地点｜关键属性｜排序，外加无障碍用的浏览密度。
 * 关键属性按所选类别动态出现；「全部」时不显示，避免扁平标签墙。
 * 这些只是筛选界面的选项，真实筛选逻辑和各选项的数据覆盖要等后端接口（见需求板）。
 */
import type { CardType } from '@schema';

export interface FilterOption {
  value: string;
  text: string;
  /** 不可用时给出原因（PRD 3.4：禁用态要解释原因） */
  disabledReason?: string;
}

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

export const ATTR_OPTIONS: Record<CardType, FilterOption[]> = {
  opportunity: [
    { value: 'internship', text: '实习' },
    { value: 'part_time', text: '兼职' },
    { value: 'full_time', text: '全职' },
    { value: 'startup', text: '创业' },
    { value: 'online', text: '线上' },
    { value: 'offline', text: '线下' },
    { value: 'no_experience', text: '无经验要求' },
    { value: 'salary_public', text: '薪酬公开' },
  ],
  merchant: [
    { value: 'food', text: '餐饮' },
    { value: 'beauty', text: '美妆' },
    { value: 'life_service', text: '生活服务' },
    { value: 'consultable', text: '可咨询' },
    { value: 'bookable', text: '可预约' },
  ],
  identity: [
    { value: 'recruiting', text: '招新中' },
    { value: 'open_contact', text: '开放联系' },
  ],
  event: [
    { value: 'signup_open', text: '报名中' },
    { value: 'ended', text: '已结束' },
    { value: 'free', text: '免费' },
    { value: 'online', text: '线上' },
    { value: 'offline', text: '线下' },
  ],
};

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'recommended', text: '推荐' },
  { value: 'latest', text: '最新发布' },
  { value: 'starting_soon', text: '即将开始' },
  { value: 'nearest', text: '距离最近', disabledReason: '需要核验坐标后才能按距离排序' },
];

export const DENSITY_OPTIONS: FilterOption[] = [
  { value: 'large', text: '卡片' },
  { value: 'showcase', text: '橱窗' },
  { value: 'list', text: '列表' },
];

export function optionText(options: FilterOption[], value: string): string {
  return options.find((o) => o.value === value)?.text ?? '';
}
