/** 卡片接口（PRD 12.3）。服务端负责审核、有效期、权限过滤；前端不自行补数据。 */
import type { CardQuery, InformationCard, Paged } from '@schema';
import { config } from '../config';
import { SAMPLE_CARDS } from '../data/sample-cards';
import { request } from '../utils/request';

export function listCards(query: CardQuery): Promise<Paged<InformationCard>> {
  if (config.USE_SAMPLE_DATA) {
    const items = SAMPLE_CARDS.filter((c) => query.category === 'all' || c.type === query.category);
    return Promise.resolve({ items, total: items.length });
  }
  return request<Paged<InformationCard>>({ path: '/cards', data: query, retry: 1 });
}

export function getCard(cardId: string): Promise<InformationCard> {
  if (config.USE_SAMPLE_DATA) {
    const card = SAMPLE_CARDS.find((c) => c.card_id === cardId);
    return card ? Promise.resolve(card) : Promise.reject(new Error('卡片不存在或已下架'));
  }
  return request<InformationCard>({ path: `/cards/${encodeURIComponent(cardId)}` });
}
