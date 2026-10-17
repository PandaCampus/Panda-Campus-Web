Page({
  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;
    tabBar?.setData({ selected: 2 });
  },
});
