import type { InformationCard } from '@schema';
import type { AppGlobal, NavMetrics } from '../../app';
import { listCards } from '../../api/cards';
import { CATEGORIES, DEFAULT_FILTERS, campusStore, connectStore, sameFilters, type CampusState, type FeedDensity } from '../../store/campus';
import { DENSITY_NAMES, pinchDirection, stepDensity, touchDistance } from '../../utils/density-zoom';
import { ApiError } from '../../utils/request';

const app = getApp<AppGlobal>();

// 品牌字标实测：宽 189、高 17.5（390 基准），中心比胶囊中心低 1.2
const BRAND_H = 17.5;
const BRAND_OFFSET = 1.2;
const DENSITIES: FeedDensity[] = ['large', 'showcase', 'list'];

Page({
  data: {
    nav: {} as NavMetrics,
    brandTop: 0,
    cats: CATEGORIES,
    activeCat: 0,
    density: 'large' as FeedDensity,
    hasUnread: true,
    viewMode: 'feed' as CampusState['viewMode'],
    filterApplied: false,
    filterVisible: false,
    cards: [] as InformationCard[],
    loading: true,
    error: '',
    /** 每档骨架数量：大概铺满一屏 */
    skeletonSlots: { large: [1, 2], showcase: [1, 2, 3, 4], list: [1, 2, 3, 4, 5] },
    /** 密度切换：动画重放用的 key、恢复位置用的锚点、状态提示 */
    animKey: 0,
    anchorId: '',
    densityNames: DENSITY_NAMES,
    hintVisible: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const nav = app.globalData.nav;
    const scale = nav.windowWidth / 390;
    this.setData({
      nav,
      brandTop: nav.statusBar + nav.capsuleCenter - (BRAND_H * scale) / 2 + BRAND_OFFSET * scale,
    });

    // 调试入口：pages/campus/index?density=list（正式切换方式是双指缩放，或筛选面板里的「浏览密度」）
    const density = options.density as FeedDensity | undefined;
    if (density && DENSITIES.includes(density)) campusStore.setState({ feedDensity: density });
    // 调试入口：?skeleton=1 一直停在骨架屏；?skeleton=list 同时指定密度（开发者工具命令行不便传多个参数）
    const sk = options.skeleton as FeedDensity | '1' | undefined;
    if (sk && sk !== '1' && DENSITIES.includes(sk)) campusStore.setState({ feedDensity: sk });
    this.holdSkeleton = !!sk;
    // 调试入口：?view=map 打开地图态；?filter=1 打开筛选面板；?applied=1 显示示例条件串
    if (options.view === 'map') campusStore.setState({ viewMode: 'map' });
    if (options.applied === '1') {
      campusStore.setState({ category: 'event', filters: { ...DEFAULT_FILTERS, time: 'this_week', place: 'campus', status: 'open', cost: 'free' }, filterApplied: true });
    }
    if (options.filter === '1') setTimeout(() => this.onOpenFilter(), 300);

    connectStore(
      this,
      (s) => ({
        activeCat: CATEGORIES.findIndex((c) => c.key === s.category),
        density: s.feedDensity,
        viewMode: s.viewMode,
        filterApplied: s.filterApplied,
      }),
      (state, prev) => {
        if (this.queryChanged(state, prev)) this.loadCards();
        if (state.feedDensity !== prev.feedDensity) this.afterDensityChange();
        // 从地图回到信息流：恢复进入地图前看到的那张卡（PRD 8.4）
        if (prev.viewMode === 'map' && state.viewMode === 'feed') this.restoreAnchor();
      },
    );
    this.loadCards();
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    tabBar?.setData({ selected: 0 });
  },

  queryChanged(a: CampusState, b: CampusState): boolean {
    // 按值比较：条件没变就不重新加载，避免闪骨架屏、丢失滚动位置
    return a.category !== b.category || a.query !== b.query || !sameFilters(a.filters, b.filters) || a.sort !== b.sort;
  },

  holdSkeleton: false,

  // ---------- 三级语义缩放（PRD 5.2） ----------
  pinchStart: 0,
  pinchFired: false,
  /** 当前视口顶部第一张卡的节点 id：只跟随用户自己的滚动更新，程序恢复位置引起的滚动不改写它 */
  lastAnchor: '',
  restoringUntil: 0,
  scrollTimer: 0 as number,
  hintTimer: 0 as number,

  onFeedTouchStart(e: WechatMiniprogram.TouchEvent) {
    if (e.touches.length === 2) {
      this.pinchStart = touchDistance(e.touches[0], e.touches[1]);
      this.pinchFired = false;
    }
  },

  onFeedTouchMove(e: WechatMiniprogram.TouchEvent) {
    if (e.touches.length !== 2 || !this.pinchStart || this.pinchFired) return;
    const dir = pinchDirection(touchDistance(e.touches[0], e.touches[1]) / this.pinchStart);
    if (!dir) return;
    this.pinchFired = true; // 一次手势只切一档
    const current = campusStore.getState().feedDensity;
    const next = stepDensity(current, dir);
    if (next === current) this.showHint(); // 已到头：只提示当前档位
    else campusStore.setState({ feedDensity: next });
  },

  onFeedTouchEnd(e: WechatMiniprogram.TouchEvent) {
    if (e.touches.length < 2) this.pinchStart = 0;
  },

  onFeedScroll() {
    if (Date.now() < this.restoringUntil) return;
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => this.captureAnchor(), 120) as unknown as number;
  },

  /** 记下视口里第一张露出的卡，作为切换密度、往返地图时的位置锚点 */
  captureAnchor() {
    wx.createSelectorQuery()
      .in(this)
      .select('.viewport')
      .boundingClientRect()
      .selectAll('.feed-item')
      .boundingClientRect()
      .exec((res: [WechatMiniprogram.BoundingClientRectCallbackResult | null, WechatMiniprogram.BoundingClientRectCallbackResult[] | null]) => {
        const [vp, items] = res;
        if (!vp || !items) return;
        const first = items.find((r) => r.bottom > vp.top + 8);
        this.lastAnchor = first?.id ?? '';
      });
  },

  afterDensityChange() {
    // 新 key 让列表容器重建，从而重放进场动画；随后滚动到锚点卡片
    this.setData({ animKey: this.data.animKey + 1 }, () => this.restoreAnchor());
    // 在筛选面板里切换时提示会被遮罩挡住，面板本身已高亮当前档位，不再弹提示
    if (!this.data.filterVisible) this.showHint();
  },

  restoreAnchor() {
    if (!this.lastAnchor) return;
    this.restoringUntil = Date.now() + 500;
    // 先清空再设置，保证同一个 id 也会重新触发滚动
    this.setData({ anchorId: '' }, () => wx.nextTick(() => this.setData({ anchorId: this.lastAnchor })));
  },

  showHint() {
    clearTimeout(this.hintTimer);
    this.setData({ hintVisible: true });
    this.hintTimer = setTimeout(() => this.setData({ hintVisible: false }), 900) as unknown as number;
  },

  async loadCards() {
    const s = campusStore.getState();
    this.setData({ loading: true, error: '' });
    if (this.holdSkeleton) return;
    try {
      const f = s.filters;
      const filters = { time: [f.time], place: [f.place], status: [f.status], condition: [f.condition], cost: [f.cost] };
      const page = await listCards({ category: s.category, query: s.query, filters, sort: s.sort });
      this.setData({ cards: page.items, loading: false });
    } catch (e) {
      const msg = e instanceof ApiError && e.retryable ? '网络异常，请重试' : '加载失败';
      this.setData({ cards: [], loading: false, error: msg });
    }
  },

  onCat(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { index: number }>) {
    campusStore.setState({ category: CATEGORIES[e.currentTarget.dataset.index].key });
  },

  // 不要调用 wx.hideTabBar / wx.showTabBar：项目用的是自定义 tabBar，这两个接口会把原生 tabBar 也显示出来，
  // 底部出现两排 Tab。筛选面板停在自定义 Tab 上方，Tab 保持可见。
  onOpenFilter() {
    this.setData({ filterVisible: true });
  },

  onCloseFilter() {
    this.setData({ filterVisible: false });
  },

  /** 「地点」是 feed ⇄ map 切换器；切回信息流时密度、筛选不变（PRD 8.4） */
  onTogglePlace() {
    const s = campusStore.getState();
    campusStore.setState({ viewMode: s.viewMode === 'map' ? 'feed' : 'map' });
  },

  onClearFilters() {
    campusStore.setState({ category: 'all', query: '', filters: DEFAULT_FILTERS, filterApplied: false });
  },

  onRetry() {
    this.loadCards();
  },

  // 以下入口的二级页面尚未实现，先给出明确提示，不伪造结果（PRD A09）
  onOpenCard() {
    wx.showToast({ title: '详情页开发中', icon: 'none' });
  },
  onCardMedia() {
    wx.showToast({ title: '媒体预览开发中', icon: 'none' });
  },
  onCardAction() {
    wx.showToast({ title: '功能暂未开放', icon: 'none' });
  },
});
