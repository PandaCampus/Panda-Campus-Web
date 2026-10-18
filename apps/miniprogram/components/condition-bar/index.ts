/**
 * 筛选条件串（《全局筛选与条件串》）：只在全局筛选「搜索结果」之后显示在分类栏下方。
 * 已选的维度各一个下拉胶囊（排序始终显示），点开可在同一维度内切换，不用重新打开筛选面板。
 */
import { DIM_DEFAULTS, FILTER_STEPS, optionText, type FilterDim, type FilterOption } from '../../data/filter-options';
import { campusStore, connectStore, type CampusState } from '../../store/campus';

interface Chip {
  dim: FilterDim;
  text: string;
}

function valueOf(s: CampusState, dim: FilterDim): string {
  if (dim === 'category') return s.category;
  if (dim === 'sort') return s.sort;
  return s.filters[dim];
}

function chipsOf(s: CampusState): Chip[] {
  return FILTER_STEPS.filter((step) => step.dim === 'sort' || valueOf(s, step.dim) !== DIM_DEFAULTS[step.dim]).map((step) => ({
    dim: step.dim,
    text: optionText(step.options, valueOf(s, step.dim)),
  }));
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
    onChip(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { dim: FilterDim }>) {
      const dim = e.currentTarget.dataset.dim;
      const step = FILTER_STEPS.find((st) => st.dim === dim);
      if (!step) return;
      const options = usable(step.options);
      wx.showActionSheet({
        itemList: options.map((o) => o.text),
        success: ({ tapIndex }) => {
          const value = options[tapIndex].value;
          const s = campusStore.getState();
          if (dim === 'category') campusStore.setState({ category: value as CampusState['category'] });
          else if (dim === 'sort') campusStore.setState({ sort: value as CampusState['sort'] });
          else campusStore.setState({ filters: { ...s.filters, [dim]: value } });
        },
      });
    },
  },
});
