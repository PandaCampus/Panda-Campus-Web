/**
 * 校园 Tab 共享状态（地点地图专题 02 章）：信息流和地图共用同一份分类、搜索、筛选，
 * viewMode 与 feedDensity 分开保存，切到地图时冻结密度，切回来恢复。
 */
import type { CategoryKey, CardQuery } from '@schema';

export type ViewMode = 'feed' | 'map';
export type FeedDensity = 'large' | 'showcase' | 'list';
export type SheetState = 'closed' | 'peek' | 'half' | 'expanded';

export interface CampusState {
  viewMode: ViewMode;
  feedDensity: FeedDensity;
  category: CategoryKey;
  query: string;
  filters: Record<string, string[]>;
  sort: NonNullable<CardQuery['sort']>;
  feedScrollTop: number;
  selectedPlaceId: string | null;
  sheetState: SheetState;
}

type Listener<S> = (state: S, prev: S) => void;

function createStore<S extends object>(initial: S) {
  let state = initial;
  const listeners = new Set<Listener<S>>();
  return {
    getState: (): S => state,
    setState(patch: Partial<S>) {
      const prev = state;
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn(state, prev));
    },
    subscribe(fn: Listener<S>): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const campusStore = createStore<CampusState>({
  viewMode: 'feed',
  feedDensity: 'large',
  category: 'all',
  query: '',
  filters: {},
  sort: 'recommended',
  feedScrollTop: 0,
  selectedPlaceId: null,
  sheetState: 'closed',
});

/** 首页分类：顺序锁定（PRD V1.2） */
export const CATEGORIES: { key: CategoryKey; text: string }[] = [
  { key: 'all', text: '全部' },
  { key: 'opportunity', text: '就业' },
  { key: 'merchant', text: '商家' },
  { key: 'identity', text: '社团' },
  { key: 'event', text: '活动' },
];

/**
 * 把 store 的一部分映射进页面 data，并在页面卸载时自动取消订阅。
 * 用法：onLoad() { connectStore(this, (s) => ({ density: s.feedDensity })) }
 */
export function connectStore<T extends Record<string, unknown>>(
  page: WechatMiniprogram.Page.TrivialInstance | WechatMiniprogram.Component.TrivialInstance,
  select: (s: CampusState) => T,
  onChange?: (state: CampusState, prev: CampusState) => void,
): void {
  page.setData(select(campusStore.getState()));
  const unsubscribe = campusStore.subscribe((state, prev) => {
    page.setData(select(state));
    onChange?.(state, prev);
  });
  const host = page as unknown as { onUnload?: () => void; detached?: () => void };
  const original = host.onUnload;
  host.onUnload = function (this: unknown) {
    unsubscribe();
    original?.call(this);
  };
}
