/**
 * 筛选条件串（《全局筛选与条件串》）：只在通过全局筛选应用条件后显示在分类栏下方。
 * 每个维度一个下拉胶囊，点开可在同一维度内切换；关键属性是多选，点开回到筛选面板。
 */
import type { CardType } from '@schema';
import {
  ATTR_OPTIONS,
  PLACE_OPTIONS,
  SORT_OPTIONS,
  TIME_OPTIONS,
  optionText,
  type FilterOption,
} from '../../data/filter-options';
import { CATEGORIES, campusStore, connectStore, type CampusState } from '../../store/campus';

interface Chip {
  dim: 'category' | 'time' | 'place' | 'attrs' | 'sort';
  text: string;
  active: boolean;
}

function chipsOf(s: CampusState): Chip[] {
  const cat = CATEGORIES.find((c) => c.key === s.category);
  const attrs = s.category === 'all' ? [] : ATTR_OPTIONS[s.category as CardType];
  const attrTexts = s.filters.attrs.map((v) => optionText(attrs, v)).filter(Boolean);
  return [
    { dim: 'category', text: s.category === 'all' ? '类别' : cat?.text ?? '类别', active: s.category !== 'all' },
    { dim: 'time', text: s.filters.time === 'any' ? '时间' : optionText(TIME_OPTIONS, s.filters.time), active: s.filters.time !== 'any' },
    { dim: 'place', text: s.filters.place === 'any' ? '地点' : optionText(PLACE_OPTIONS, s.filters.place), active: s.filters.place !== 'any' },
    { dim: 'attrs', text: attrTexts.length ? attrTexts[0] + (attrTexts.length > 1 ? ` +${attrTexts.length - 1}` : '') : '属性', active: attrTexts.length > 0 },
    { dim: 'sort', text: optionText(SORT_OPTIONS, s.sort), active: s.sort !== 'recommended' },
  ];
}

/** 下拉里只列出可用选项（微信操作菜单最多 6 项） */
function usable(options: FilterOption[]): FilterOption[] {
  return options.filter((o) => !o.disabledReason).slice(0, 6);
}

/** 组件实例不能挂自定义字段，取消订阅函数按实例存放 */
const subscriptions = new WeakMap<object, () => void>();

Component({
  options: { styleIsolation: 'apply-shared' },

  data: { chips: [] as Chip[] },

  lifetimes: {
    attached() {
      subscriptions.set(this, connectStore(this, (s) => ({ chips: chipsOf(s) })));
    },
    detached() {
      subscriptions.get(this)?.();
      subscriptions.delete(this);
    },
  },

  methods: {
    onChip(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { dim: Chip['dim'] }>) {
      const dim = e.currentTarget.dataset.dim;
      if (dim === 'attrs') {
        this.triggerEvent('openfilter');
        return;
      }
      const options: FilterOption[] =
        dim === 'category'
          ? CATEGORIES.map((c) => ({ value: c.key, text: c.text }))
          : usable(dim === 'time' ? TIME_OPTIONS : dim === 'place' ? PLACE_OPTIONS : SORT_OPTIONS);
      wx.showActionSheet({
        itemList: options.map((o) => o.text),
        success: ({ tapIndex }) => {
          const value = options[tapIndex].value;
          const s = campusStore.getState();
          if (dim === 'category') campusStore.setState({ category: value as CampusState['category'], filters: { ...s.filters, attrs: [] } });
          else if (dim === 'sort') campusStore.setState({ sort: value as CampusState['sort'] });
          else campusStore.setState({ filters: { ...s.filters, [dim]: value } });
        },
      });
    },
  },
});
