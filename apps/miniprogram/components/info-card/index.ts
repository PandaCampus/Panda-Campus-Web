/**
 * Information Card：同一张卡、同一个 card_id，按 density 渲染三档（PRD 5.2）。
 * 字段顺序固定：媒体 → 大标签＋标题 → 时间 → 地点 → 小标签 → 关键数据 → CTA。
 * skeleton 为 true 时渲染同一套几何的灰色骨架（PRD 13.3），保证加载完成时不跳动。
 *
 * 事件：
 *   open   点卡片正文 → Card-to-Mini-App
 *   media  点媒体 → 媒体预览（不触发点赞）
 *   action 点 CTA → Button-to-Mini-Contract
 */
import type { Capability, CardType, InformationCard, KeyFact } from '@schema';

export type Density = 'large' | 'showcase' | 'list';

/** 每档最多显示的小标签数（按母版：大卡 3、橱窗 2、列表 3） */
const CHIP_LIMIT: Record<Density, number> = { large: 3, showcase: 2, list: 3 };

/** PRD 4.1 每类允许的大标签；不在表里的（如母版的「通知」「服务」）用 legacy 外观 */
const PRD_LABELS: Record<CardType, string[]> = {
  opportunity: ['就业', '创业'],
  merchant: ['商家'],
  identity: ['社团', '组织', '个人'],
  event: ['活动'],
};

/** 真实浏览量严格大于 1000 才显示（PRD 4.2），格式化为 1.2k */
export function formatViews(views?: number): string {
  if (views === undefined || views <= 1000) return '';
  const k = Math.floor(views / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
}

/** 按重要度取前 n 项，再按原展示顺序排列 */
export function pickChips(facts: KeyFact[], n: number): string[] {
  const keep = new Set([...facts].sort((a, b) => a.rank - b.rank).slice(0, n));
  return facts.filter((f) => keep.has(f)).map((f) => f.text);
}

function primaryCapability(caps: Capability[]): Capability | null {
  return caps.find((c) => c.status === 'enabled' || c.status === 'external') ?? null;
}

Component({
  options: { styleIsolation: 'apply-shared' },

  properties: {
    card: { type: Object, value: null as unknown as InformationCard },
    density: { type: String, value: 'large' as Density },
    skeleton: { type: Boolean, value: false },
  },

  data: {
    chips: [] as string[],
    viewsText: '',
    tagClass: '',
    cta: null as Capability | null,
    /** 紧凑列表是否显示按钮；否则显示「>」+ 浏览量 */
    listShowsCta: false,
  },

  observers: {
    'card, density'(card: InformationCard | null, density: Density) {
      if (!card) return;
      const cta = primaryCapability(card.capabilities);
      this.setData({
        chips: pickChips(card.key_facts, CHIP_LIMIT[density] ?? 3),
        viewsText: formatViews(card.metrics.views),
        tagClass: PRD_LABELS[card.type].includes(card.label) ? `tag-${card.type}` : 'tag-legacy',
        cta,
        listShowsCta: !!cta?.prominent,
      });
    },
  },

  methods: {
    onOpen() {
      if (this.data.skeleton) return;
      this.triggerEvent('open', { cardId: (this.data.card as InformationCard).card_id });
    },
    onMedia() {
      if (this.data.skeleton) return;
      this.triggerEvent('media', { cardId: (this.data.card as InformationCard).card_id });
    },
    onAction() {
      const cta = this.data.cta;
      if (this.data.skeleton || !cta) return;
      this.triggerEvent('action', { cardId: (this.data.card as InformationCard).card_id, capabilityId: cta.capability_id });
    },
  },
});
