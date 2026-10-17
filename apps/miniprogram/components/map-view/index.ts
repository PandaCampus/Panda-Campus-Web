/**
 * 地点地图（同框视图，地点地图专题 3.2 / 5.2）：只占分类栏下方到底部 Tab 上方的内容视口。
 * 现阶段没有授权底图和核验坐标：只画中性占位底图，不画任何点位、距离、楼层（PRD 8.5、地图专题 06 章）。
 * 抽屉三档相对地图视口：peek 30% / half 55% / expanded 82%。
 */
import { campusStore, connectStore, type SheetState } from '../../store/campus';

const ORDER: SheetState[] = ['peek', 'half', 'expanded'];
const subscriptions = new WeakMap<object, () => void>();
let touchStartY = 0;

Component({
  options: { styleIsolation: 'apply-shared' },

  data: {
    sheetState: 'peek' as SheetState,
    skeletonRows: [1, 2, 3],
  },

  lifetimes: {
    attached() {
      if (campusStore.getState().sheetState === 'closed') campusStore.setState({ sheetState: 'peek' });
      subscriptions.set(this, connectStore(this, (s) => ({ sheetState: s.sheetState === 'closed' ? 'peek' : s.sheetState })));
    },
    detached() {
      subscriptions.get(this)?.();
      subscriptions.delete(this);
    },
  },

  methods: {
    step(dir: 1 | -1) {
      const i = ORDER.indexOf(this.data.sheetState);
      const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, i + dir))];
      campusStore.setState({ sheetState: next });
    },
    onHandleTap() {
      const i = ORDER.indexOf(this.data.sheetState);
      campusStore.setState({ sheetState: ORDER[(i + 1) % ORDER.length] });
    },
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      touchStartY = e.touches[0].clientY;
    },
    onTouchEnd(e: WechatMiniprogram.TouchEvent) {
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dy < -30) this.step(1);
      else if (dy > 30) this.step(-1);
    },
    onLocate() {
      // 未接入定位与校区数据；PRD：没有定位授权也要能手动选校区（校区数据就绪后实现）
      wx.showToast({ title: '定位与校区选择开发中', icon: 'none' });
    },
    onBackToFeed() {
      campusStore.setState({ viewMode: 'feed' });
    },
  },
});
