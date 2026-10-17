/**
 * 三级语义缩放（PRD 5.2）：双指捏合缩小 = 大卡 → 橱窗 → 列表，张开放大 = 反向。
 * 一次手势只切换一档；切换不改变筛选、排序、card_id 和位置锚点。
 */
import type { FeedDensity } from '../store/campus';

export const DENSITY_ORDER: FeedDensity[] = ['large', 'showcase', 'list'];

export const DENSITY_NAMES: { key: FeedDensity; text: string }[] = [
  { key: 'large', text: '卡片' },
  { key: 'showcase', text: '橱窗' },
  { key: 'list', text: '列表' },
];

/** 捏合到起始距离的 80% 以下算缩小，放大到 125% 以上算放大 */
export const PINCH_IN = 0.8;
export const PINCH_OUT = 1.25;

interface Point {
  clientX: number;
  clientY: number;
}

export function touchDistance(a: Point, b: Point): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/** dir = 1 往更紧凑（列表）走，-1 往更宽松（大卡）走；到头时返回原值 */
export function stepDensity(current: FeedDensity, dir: 1 | -1): FeedDensity {
  const i = DENSITY_ORDER.indexOf(current);
  return DENSITY_ORDER[Math.min(DENSITY_ORDER.length - 1, Math.max(0, i + dir))];
}

/** 根据捏合比例判断方向；未达阈值返回 0 */
export function pinchDirection(ratio: number): 1 | -1 | 0 {
  if (ratio < PINCH_IN) return 1;
  if (ratio > PINCH_OUT) return -1;
  return 0;
}
