Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/campus/index', text: '校园' },
      { pagePath: '/pages/panda/index', text: '胖达' },
      { pagePath: '/pages/me/index', text: '我' },
    ],
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      if (index === this.data.selected) return;
      wx.switchTab({ url: this.data.list[index].pagePath });
    },
  },
});
