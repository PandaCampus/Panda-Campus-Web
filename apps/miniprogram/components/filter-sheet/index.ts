/**
 * 全局筛选（《全局筛选与条件串》）：七维筛选链，逐维度选择，点「搜索结果」后才生效。
 *   分类 → 时间 → 地点 → 状态 → 条件 → 费用 → 排序
 * - 打开时把 store 的当前条件复制成草稿；在某一维选中选项后自动进入下一维，也可以点步骤胶囊跳到任意一维
 * - 「搜索结果」把草稿写回 store；条件不全是默认值时才显示条件串（PRD：仅全局筛选结果态显示）
 * - 「重置筛选」只清草稿并回到第一维；关闭面板放弃草稿
 * - 浏览密度是显示偏好、不是筛选条件：点一下立即切换（PRD 5.2）
 * 跨维度 AND 的真实查询由后端实现；这里只负责条件的选择和展示。
 */
import type { CategoryKey } from '@schema';
import { DENSITY_OPTIONS, DIM_DEFAULTS, FILTER_STEPS, type FilterDim, type FilterOption } from '../../data/filter-options';
import { campusStore, isDefaultQuery, type CampusState, type FeedDensity } from '../../store/campus';

type Draft = Record<FilterDim, string>;

/** 选中后自动进入下一维的延迟，让选中态先被看到 */
const ADVANCE_DELAY = 180;

function draftFromStore(): Draft {
  const s = campusStore.getState();
  return { category: s.category, ...s.filters, sort: s.sort };
}

interface StepView {
  dim: FilterDim;
  text: string;
  /** 已选了非默认值 */
  set: boolean;
}

function stepViews(draft: Draft): StepView[] {
  return FILTER_STEPS.map((s) => ({ dim: s.dim, text: s.text, set: draft[s.dim] !== DIM_DEFAULTS[s.dim] }));
}

let advanceTimer = 0;

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    visible: { type: Boolean, value: false },
  },

  data: {
    draft: draftFromStore(),
    step: 0,
    steps: stepViews(draftFromStore()),
    title: FILTER_STEPS[0].title,
    options: FILTER_STEPS[0].options as FilterOption[],
    density: 'large' as FeedDensity,
    densityOptions: DENSITY_OPTIONS,
  },

  observers: {
    visible(v: boolean) {
      if (!v) return;
      clearTimeout(advanceTimer);
      this.render(draftFromStore(), 0);
      this.setData({ density: campusStore.getState().feedDensity });
    },
  },

  methods: {
    render(draft: Draft, step: number) {
      const s = FILTER_STEPS[step];
      this.setData({ draft, step, steps: stepViews(draft), title: s.title, options: s.options });
    },

    onStep(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { index: number }>) {
      clearTimeout(advanceTimer);
      this.render(this.data.draft, e.currentTarget.dataset.index);
    },

    onPick(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { value: string; reason?: string }>) {
      const { value, reason } = e.currentTarget.dataset;
      if (reason) {
        wx.showToast({ title: reason, icon: 'none' });
        return;
      }
      const step = this.data.step;
      const draft: Draft = { ...this.data.draft, [FILTER_STEPS[step].dim]: value };
      this.render(draft, step);
      // 逐维选择：选完自动进入下一维，最后一维（排序）停留
      if (step < FILTER_STEPS.length - 1) {
        clearTimeout(advanceTimer);
        advanceTimer = setTimeout(() => this.render(this.data.draft, step + 1), ADVANCE_DELAY) as unknown as number;
      }
    },

    onDensity(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { value: FeedDensity }>) {
      const density = e.currentTarget.dataset.value;
      this.setData({ density });
      campusStore.setState({ feedDensity: density }); // 立即生效，不计入筛选
    },

    onReset() {
      clearTimeout(advanceTimer);
      this.render({ ...DIM_DEFAULTS }, 0);
    },

    onSearch() {
      clearTimeout(advanceTimer);
      const d = this.data.draft;
      const category = d.category as CategoryKey;
      const sort = d.sort as CampusState['sort'];
      const filters = { time: d.time, place: d.place, status: d.status, condition: d.condition, cost: d.cost };
      campusStore.setState({ category, filters, sort, filterApplied: !isDefaultQuery(category, filters, sort) });
      this.triggerEvent('close');
    },

    onClose() {
      clearTimeout(advanceTimer);
      this.triggerEvent('close');
    },

    noop() {},
  },
});
