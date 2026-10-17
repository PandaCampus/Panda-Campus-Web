import type { InformationCard } from '@schema';
import type { AppGlobal, NavMetrics } from '../../app';
import { listCards } from '../../api/cards';
import { CATEGORIES, DEFAULT_FILTERS, campusStore, connectStore, type CampusState, type FeedDensity } from '../../store/campus';
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
  },

  onLoad(options: Record<string, string | undefined>) {
    const nav = app.globalData.nav;
    const scale = nav.windowWidth / 390;
    this.setData({
      nav,
      brandTop: nav.statusBar + nav.capsuleCenter - (BRAND_H * scale) / 2 + BRAND_OFFSET * scale,
    });

    // 调试入口：pages/campus/index?density=list（正式切换方式是双指缩放 / 筛选面板，后续实现）
    const density = options.density as FeedDensity | undefined;
    if (density && DENSITIES.includes(density)) campusStore.setState({ feedDensity: density });
    // 调试入口：?skeleton=1 一直停在骨架屏；?skeleton=list 同时指定密度（开发者工具命令行不便传多个参数）
    const sk = options.skeleton as FeedDensity | '1' | undefined;
    if (sk && sk !== '1' && DENSITIES.includes(sk)) campusStore.setState({ feedDensity: sk });
    this.holdSkeleton = !!sk;
    // 调试入口：?view=map 打开地图态；?filter=1 打开筛选面板；?applied=1 显示示例条件串
    if (options.view === 'map') campusStore.setState({ viewMode: 'map' });
    if (options.applied === '1') {
      campusStore.setState({ category: 'event', filters: { time: 'this_week', place: 'campus', attrs: ['free'] }, filterApplied: true });
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
      },
    );
    this.loadCards();
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    tabBar?.setData({ selected: 0 });
  },

  queryChanged(a: CampusState, b: CampusState): boolean {
    return a.category !== b.category || a.query !== b.query || a.filters !== b.filters || a.sort !== b.sort;
  },

  holdSkeleton: false,

  async loadCards() {
    const s = campusStore.getState();
    this.setData({ loading: true, error: '' });
    if (this.holdSkeleton) return;
    try {
      const filters = { time: [s.filters.time], place: [s.filters.place], attrs: s.filters.attrs };
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

  onOpenFilter() {
    this.setData({ filterVisible: true });
    wx.hideTabBar({ animation: false });
  },

  onCloseFilter() {
    this.setData({ filterVisible: false });
    wx.showTabBar({ animation: false });
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
