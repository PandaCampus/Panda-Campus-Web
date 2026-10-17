// 信息卡模板：与小程序 components/info-card 同一套结构和规则（大卡 / 橱窗 / 列表 / 骨架）
const CHIP_LIMIT = { large: 3, showcase: 2, list: 3 };
const PRD_LABELS = { opportunity: ['就业', '创业'], merchant: ['商家'], identity: ['社团', '组织', '个人'], event: ['活动'] };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const icon = (name, cls) => `<img class="${cls}" src="icons/${name}.svg" alt="">`;

function formatViews(v) {
  if (v === undefined || v <= 1000) return '';
  const k = Math.floor(v / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}k`;
}
function pickChips(facts, n) {
  const keep = new Set([...facts].sort((a, b) => a.rank - b.rank).slice(0, n));
  return facts.filter((f) => keep.has(f)).map((f) => f.text);
}

function view(card, d) {
  const cta = card.capabilities.find((c) => c.status === 'enabled' || c.status === 'external') || null;
  return {
    chips: pickChips(card.key_facts, CHIP_LIMIT[d]),
    views: formatViews(card.metrics.views),
    tagClass: PRD_LABELS[card.type].includes(card.label) ? `tag-${card.type}` : 'tag-legacy',
    cta,
    listShowsCta: !!(cta && cta.prominent),
  };
}

const skBar = (cls) => `<div class="sk-bar ${cls}"></div>`;
const skChips = (n) => Array.from({ length: n }, () => '<div class="chip sk-chip"><div class="sk-chip-bar"></div></div>').join('');

function verticalCard(card, d, sk) {
  const v = sk ? null : view(card, d);
  const large = d === 'large';
  const media = sk
    ? icon('sk-image', `sk-img-icon ${large ? 'sk-img-icon-l' : 'sk-img-icon-s'}`)
    : `<span class="ph-label">缺：卡片主图${large && card.sample ? '\n示例卡 · 非真实数据' : ''}</span>`;
  const titleRow = sk
    ? `<div class="tag sk-tag"></div>${skBar('sk-title')}`
    : `<span class="tag ${v.tagClass}">${esc(card.label)}</span><span class="title">${esc(card.title)}</span>`;
  const time = sk ? skBar('sk-meta') : `<span class="num">${esc(card.time_info.text)}</span>`;
  const place = sk ? skBar('sk-meta sk-meta-2') : `<span class="${large ? '' : 'ellipsis'}">${esc(card.place_text)}</span>`;
  const chips = sk ? skChips(large ? 3 : 2) : v.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('');
  const views = sk
    ? `${icon('eye', 'ic-eye')}${skBar('sk-views')}`
    : v.views ? `${icon('eye', 'ic-eye')}<span class="num">${v.views}</span>` : '';
  const cta = sk ? '<div class="cta sk-cta"></div>' : v.cta ? `<button class="cta" type="button">${esc(v.cta.label)}</button>` : '';
  return `
    <article class="card card-${d} ${sk ? 'is-skeleton' : ''}">
      <div class="media media-${d}">${media}</div>
      <div class="body-${d}">
        <div class="title-row">${titleRow}</div>
        <div class="meta">${icon('clock', 'ic-meta')}${time}</div>
        <div class="meta meta-2">${icon('meta-pin', 'ic-meta ic-meta-pin')}${place}</div>
        <div class="chips">${chips}</div>
        <div class="foot"><div class="views">${views}</div>${cta}</div>
      </div>
    </article>`;
}

function listRow(card, sk) {
  const v = sk ? null : view(card, 'list');
  const titleRow = sk
    ? `<div class="tag sk-tag"></div>${skBar('sk-title')}`
    : `<span class="tag ${v.tagClass}">${esc(card.label)}</span><span class="title">${esc(card.title)}</span>`;
  const meta = sk
    ? `${icon('clock', 'ic-meta')}${skBar('sk-meta sk-meta-time')}${icon('meta-pin', 'ic-meta ic-meta-pin')}${skBar('sk-meta sk-meta-2')}`
    : `${icon('clock', 'ic-meta')}<span class="num meta-time">${esc(card.time_info.text)}</span>${icon('meta-pin', 'ic-meta ic-meta-pin')}<span class="ellipsis">${esc(card.place_text)}</span>`;
  const chips = sk ? skChips(2) : v.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('');
  let right;
  if (!sk && v.listShowsCta) right = `<button class="cta" type="button">${esc(v.cta.label)}</button>`;
  else {
    const views = sk ? `${icon('eye', 'ic-eye')}${skBar('sk-views')}` : v.views ? `${icon('eye', 'ic-eye')}<span class="num">${v.views}</span>` : '';
    right = `${icon('chevron', 'chevron')}${views ? `<div class="views">${views}</div>` : ''}`;
  }
  return `
    <article class="row-list ${sk ? 'is-skeleton' : ''}">
      <div class="media media-list">${sk ? icon('sk-image', 'sk-img-icon sk-img-icon-s') : '<span class="ph-label">缺图</span>'}</div>
      <div class="body-list">
        <div class="title-row">${titleRow}</div>
        <div class="meta">${meta}</div>
        <div class="chips">${chips}</div>
        ${right}
      </div>
    </article>`;
}
