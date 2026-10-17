const app = getApp();

// 品牌字标实测：宽 189、高 17.5（390 基准），中心比胶囊中心低 1.2
const BRAND_H = 17.5;
const BRAND_OFFSET = 1.2;

Page({
  data: {
    nav: {},
    brandTop: 0,
    cats: ['全部', '就业', '商家', '社团', '活动'],
    activeCat: 0,
    hasUnread: true,
  },

  onLoad() {
    const nav = app.globalData.nav;
    const scale = nav.windowWidth / 390;
    this.setData({
      nav,
      brandTop: nav.statusBar + nav.capsuleCenter - (BRAND_H * scale) / 2 + BRAND_OFFSET * scale,
    });
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 0 });
  },

  onCat(e) {
    this.setData({ activeCat: e.currentTarget.dataset.index });
  },
});
