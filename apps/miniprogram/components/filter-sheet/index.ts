/**
 * 全局筛选面板（C-05，外观照《筛选视图》，维度按 PRD 7.1）。
 * 打开时把 store 的当前条件复制成草稿；「确定筛选」才写回 store 并标记 filterApplied，「重置」只清草稿。
 * 跨维度 AND、同维度多选 OR 的真实查询由后端实现；这里只负责条件的选择和展示。
 */
import type { CardType, CategoryKey } from '@schema';
import {
  ATTR_OPTIONS,
  DENSITY_OPTIONS,
  PLACE_OPTIONS,
  SORT_OPTIONS,
  TIME_OPTIONS,
  type FilterOption,
} from '../../data/filter-options';
import { CATEGORIES, DEFAULT_FILTERS, campusStore, type CampusState, type FeedDensity } from '../../store/campus';

interface Draft {
  category: CategoryKey;
  time: string;
  place: string;
  attrs: string[];
  sort: CampusState['sort'];
  density: FeedDensity;
}

type Dimension = 'category' | 'time' | 'place' | 'attrs' | 'sort' | 'density';

function draftFromStore(): Draft {
  const s = campusStore.getState();
  return { category: s.category, time: s.filters.time, place: s.filters.place, attrs: [...s.filters.attrs], sort: s.sort, density: s.feedDensity };
}

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    visible: { type: Boolean, value: false },
  },

  data: {
    draft: draftFromStore(),
    categoryOptions: CATEGORIES.map((c) => ({ value: c.key, text: c.text })) as FilterOption[],
    timeOptions: TIME_OPTIONS,
    placeOptions: PLACE_OPTIONS,
    attrOptions: [] as FilterOption[],
    sortOptions: SORT_OPTIONS,
    densityOptions: DENSITY_OPTIONS,
  },

  observers: {
    visible(v: boolean) {
      if (v) this.setDraft(draftFromStore());
    },
  },

  methods: {
    setDraft(draft: Draft) {
      const attrOptions = draft.category === 'all' ? [] : ATTR_OPTIONS[draft.category as CardType];
      this.setData({ draft, attrOptions });
    },

    onPick(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { dim: Dimension; value: string; reason?: string }>) {
      const { dim, value, reason } = e.currentTarget.dataset;
      if (reason) {
        wx.showToast({ title: reason, icon: 'none' });
        return;
      }
      const draft: Draft = { ...this.data.draft, attrs: [...this.data.draft.attrs] };
      if (dim === 'attrs') {
        // 同一维度多选（PRD 7.2：同维度 OR）
        const i = draft.attrs.indexOf(value);
        if (i >= 0) draft.attrs.splice(i, 1);
        else draft.attrs.push(value);
      } else if (dim === 'category') {
        draft.category = value as CategoryKey;
        draft.attrs = []; // 换类别后专属属性不再适用
      } else if (dim === 'sort') {
        draft.sort = value as Draft['sort'];
      } else if (dim === 'density') {
        draft.density = value as FeedDensity;
      } else {
        draft[dim] = value;
      }
      this.setDraft(draft);
    },

    onReset() {
      this.setDraft({ ...DEFAULT_FILTERS, attrs: [], category: 'all', sort: 'recommended', density: this.data.draft.density });
    },

    onConfirm() {
      const d = this.data.draft;
      campusStore.setState({
        category: d.category,
        filters: { time: d.time, place: d.place, attrs: d.attrs },
        sort: d.sort,
        feedDensity: d.density,
        filterApplied: true,
      });
      this.triggerEvent('close');
    },

    onClose() {
      this.triggerEvent('close');
    },

    noop() {},
  },
});
