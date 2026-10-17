/**
 * Information Card：同一张卡、同一个 card_id，按 density 渲染三档（PRD 5.2）。
 * 字段顺序固定：媒体 → 大标签＋标题 → 时间 → 地点 → 小标签 → 关键数据 → CTA。
 *
 * 事件：
 *   open   点卡片正文 → Card-to-Mini-App
 *   media  点媒体 → 媒体预览（不触发点赞）
 *   action 点 CTA → Button-to-Mini-Contract
 */
import type { Capability, InformationCard } from '@schema';

export type Density = 'large' | 'showcase' | 'list';

/** 每档最多显示的小标签数（按母版：大卡 3、橱窗 2、列表 3） */
const CHIP_LIMIT: Record<Density, number> = { large: 3, showcase: 2, list: 3 };

/** 真实浏览量严格大于 1000 才显示（PRD 4.2），格式化为 1.2k */
export function formatViews(views?: number): string {
  if (views === undefined || views <= 1000) return '';
  const k = Math.floor(views / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
}

function primaryCapability(caps: Capability[]): Capability | null {
  return caps.find((c) => c.status === 'enabled' || c.status === 'external') ?? null;
}

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    card: { type: Object, value: null as unknown as InformationCard },
    density: { type: String, value: 'large' as Density },
  },

  data: {
    chips: [] as string[],
    viewsText: '',
    cta: null as Capability | null,
    /** 只是「进入详情」的 CTA，在列表里显示为「>」（PRD 5.2） */
    ctaIsDetail: false,
  },

  observers: {
    'card, density'(card: InformationCard | null, density: Density) {
      if (!card) return;
      const cta = primaryCapability(card.capabilities);
      this.setData({
        chips: card.key_facts.slice(0, CHIP_LIMIT[density] ?? 3),
        viewsText: formatViews(card.metrics.views),
        cta,
        ctaIsDetail: cta?.capability_id === 'view_detail',
      });
    },
  },

  methods: {
    onOpen() {
      this.triggerEvent('open', { cardId: (this.data.card as InformationCard).card_id });
    },
    onMedia() {
      this.triggerEvent('media', { cardId: (this.data.card as InformationCard).card_id });
    },
    onAction() {
      const cta = this.data.cta;
      if (!cta) return;
      this.triggerEvent('action', { cardId: (this.data.card as InformationCard).card_id, capabilityId: cta.capability_id });
    },
  },
});
