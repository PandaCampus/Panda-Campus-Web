// 底部全局导航：纯文字三 Tab（PRD 3.6），各页面 onShow 时设置 selected
interface TabItem {
  pagePath: string;
  text: string;
}

const TABS: TabItem[] = [
  { pagePath: '/pages/campus/index', text: '校园' },
  { pagePath: '/pages/panda/index', text: '胖达' },
  { pagePath: '/pages/me/index', text: '我' },
];

Component({
  data: {
    selected: 0,
    list: TABS,
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent<Record<string, never>, Record<string, never>, { index: number }>) {
      const index = e.currentTarget.dataset.index;
      if (index === this.data.selected) return;
      wx.switchTab({ url: TABS[index].pagePath });
    },
  },
});
