// 启动时测量状态栏和微信原生胶囊，供自定义顶栏排版（PRD 3.1：不写死坐标）
App({
  globalData: { nav: null },

  onLaunch() {
    const win = wx.getWindowInfo();
    const capsule = wx.getMenuButtonBoundingClientRect();
    const statusBar = win.statusBarHeight;
    // 品牌行与胶囊上下等距：设计稿状态栏 47、胶囊 53–89 → 行高 48
    const rowHeight = (capsule.top - statusBar) * 2 + capsule.height;
    this.globalData.nav = {
      statusBar,
      rowHeight,
      navHeight: statusBar + rowHeight,
      capsuleCenter: capsule.top + capsule.height / 2 - statusBar,
      capsuleLeft: capsule.left,
      windowWidth: win.windowWidth,
    };
  },
});
