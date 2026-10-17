import type { InformationCard } from '@schema';
import type { AppGlobal, NavMetrics } from '../../app';
import { listCards } from '../../api/cards';
import { CATEGORIES, campusStore, connectStore, type CampusState, type FeedDensity } from '../../store/campus';
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
    cards: [] as InformationCard[],
    loading: true,
    error: '',
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

    connectStore(
      this,
      (s) => ({
        activeCat: CATEGORIES.findIndex((c) => c.key === s.category),
        density: s.feedDensity,
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

  async loadCards() {
    const s = campusStore.getState();
    this.setData({ loading: true, error: '' });
    try {
      const page = await listCards({ category: s.category, query: s.query, filters: s.filters, sort: s.sort });
      this.setData({ cards: page.items, loading: false });
    } catch (e) {
      const msg = e instanceof ApiError && e.retryable ? '网络异常，请重试' : '加载失败';
      this.setData({ cards: [], loading: false, error: msg });
    }
  },

  onCat(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { index: number }>) {
    campusStore.setState({ category: CATEGORIES[e.currentTarget.dataset.index].key });
  },

  onClearFilters() {
    campusStore.setState({ category: 'all', query: '', filters: {} });
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
