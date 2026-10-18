// H5 对照原型：状态与交互，规则与小程序 store/campus.ts、各组件一致，仅用于和 UI 母版对照。
// 参数：?density=large|showcase|list  ?skeleton=1（停在骨架屏）  ?view=map（地图态）  ?sheet=half|expanded（地图抽屉）
//       ?filter=1（打开筛选面板）  ?applied=1（示例条件串）  ?flat=1（截图模式）  ?h=781（截图高度）  ?chrome=0
const params = new URLSearchParams(location.search);
if (params.get('chrome') === '0') document.body.classList.add('no-chrome');
if (params.get('flat') === '1') document.body.classList.add('flat');
if (params.get('h')) document.getElementById('device').style.height = `${Number(params.get('h'))}px`;

const $ = (id) => document.getElementById(id);
const OPT = window.FILTER_OPTIONS;
const DENSITIES = ['large', 'showcase', 'list'];
const SKELETON_SLOTS = { large: 2, showcase: 4, list: 5 };
const CATEGORY_KEYS = ['all', 'opportunity', 'merchant', 'identity', 'event'];
const CATEGORY_OPTIONS = [
  { value: 'all', text: '全部' }, { value: 'opportunity', text: '就业' }, { value: 'merchant', text: '商家' },
  { value: 'identity', text: '社团' }, { value: 'event', text: '活动' },
];
const DEFAULT_FILTERS = { time: 'any', place: 'any', attrs: [] };
const holdSkeleton = params.get('skeleton') === '1';
const optText = (list, v) => (list.find((o) => o.value === v) || {}).text || '';
const sameFilters = (a, b) => a.time === b.time && a.place === b.place && a.attrs.length === b.attrs.length && a.attrs.every((v, i) => v === b.attrs[i]);

const state = {
  viewMode: params.get('view') === 'map' ? 'map' : 'feed',
  density: DENSITIES.includes(params.get('density')) ? params.get('density') : 'large',
  category: 'all',
  filters: { ...DEFAULT_FILTERS },
  sort: 'recommended',
  filterApplied: false,
  sheetState: ['half', 'expanded'].includes(params.get('sheet')) ? params.get('sheet') : 'peek',
};
if (params.get('applied') === '1') {
  Object.assign(state, { category: 'event', filters: { time: 'this_week', place: 'campus', attrs: ['free'] }, filterApplied: true });
}
/** 筛选面板草稿：打开时复制当前条件，「确定筛选」才写回 */
let draft = null;

function renderFeed(animate = false) {
  const feed = $('feed');
  const d = state.density;
  const cards = holdSkeleton
    ? Array.from({ length: SKELETON_SLOTS[d] })
    : window.SAMPLE_CARDS.filter((c) => state.category === 'all' || c.type === state.category);
  if (!holdSkeleton && !cards.length) {
    feed.innerHTML = '<div class="empty">没有找到符合条件的信息</div>';
    return;
  }
  const items = cards.map((c) => `<div class="feed-item" ${c ? `data-card="${c.card_id}"` : ''}>${d === 'list' ? listRow(c, holdSkeleton) : verticalCard(c, d, holdSkeleton)}</div>`).join('');
  feed.innerHTML = `<div class="feed-${d} ${animate ? 'feed-anim' : ''}">${items}</div>`;
}

function renderCond() {
  document.querySelector('.page-campus').classList.toggle('has-cond', state.filterApplied);
  if (!state.filterApplied) {
    $('cond').innerHTML = '';
    return;
  }
  const attrs = state.category === 'all' ? [] : OPT.attrs[state.category];
  const at = state.filters.attrs.map((v) => optText(attrs, v)).filter(Boolean);
  const chips = [
    [state.category === 'all' ? '类别' : optText(CATEGORY_OPTIONS, state.category), state.category !== 'all'],
    [state.filters.time === 'any' ? '时间' : optText(OPT.time, state.filters.time), state.filters.time !== 'any'],
    [state.filters.place === 'any' ? '地点' : optText(OPT.place, state.filters.place), state.filters.place !== 'any'],
    [at.length ? at[0] + (at.length > 1 ? ` +${at.length - 1}` : '') : '属性', at.length > 0],
    [optText(OPT.sort, state.sort), state.sort !== 'recommended'],
  ];
  // H5 里点胶囊直接打开筛选面板；小程序里是同维度下拉菜单
  const html = chips.map(([t, on]) => `<div class="cb-chip ${on ? 'is-active' : ''}" data-open-filter>${esc(t)}${icon('caret-down', 'cb-caret')}</div>`).join('');
  $('cond').innerHTML = `<div class="cb"><div class="cb-inner">${html}</div></div>`;
}

function renderMap() {
  const isMap = state.viewMode === 'map';
  document.querySelector('.page-campus').classList.toggle('is-map', isMap);
  $('btn-place').classList.toggle('is-on', isMap);
  $('feed').hidden = isMap;
  $('map').hidden = !isMap;
  if (!isMap) {
    $('map').innerHTML = '';
    return;
  }
  // 半屏 / 展开时只用骨架预览将来的地点卡片集合，不放虚构内容
  const preview = state.sheetState === 'peek' ? '' : `
        <div class="mv-preview">
          <span class="mv-preview-label">选中地点后，这里列出该地点关联的就业、商家、社团、活动卡片</span>
          ${[1, 2, 3].map(() => listRow(null, true)).join('')}
        </div>`;
  $('map').innerHTML = `
    <div class="mv">
      <div class="mv-missing">
        <span class="mv-missing-title">缺：授权底图与核验点位</span>
        <span class="mv-missing-sub">数据就绪前不显示任何点位、距离或楼层</span>
      </div>
      <div class="mv-sheet mv-sheet-${state.sheetState}">
        <div class="mv-locate" data-locate>${icon('locate', 'mv-locate-ic')}</div>
        <div class="mv-grip" data-grip>
          <div class="mv-handle"></div>
          <div class="mv-head"><span class="mv-head-title">地点 · 暂无已核验数据</span></div>
        </div>
        <div class="mv-body">
          <div class="mv-empty">
            <span class="mv-empty-text">地图在拿到授权底图和核验坐标后上线。<br>没有坐标的内容，仍可在信息流里查看。</span>
            <div class="mv-back" data-back>返回信息流</div>
          </div>${preview}
        </div>
      </div>
    </div>`;
}

function chipRow(dim, options, isOn) {
  return options.map((o) => {
    const cls = `fs-chip ${isOn(o.value) ? 'is-on' : ''} ${o.disabledReason ? 'is-off' : ''}`;
    const more = o.value === 'custom' ? icon('chevron-sm', 'fs-more') : '';
    return `<div class="${cls}" data-dim="${dim}" data-value="${o.value}" data-reason="${esc(o.disabledReason || '')}">${esc(o.text)}${more}</div>`;
  }).join('');
}

function renderFilter() {
  const root = $('filter-root');
  if (!draft) {
    root.innerHTML = '';
    return;
  }
  const attrs = draft.category === 'all' ? [] : OPT.attrs[draft.category];
  const section = (title, body, last) => `<div class="fs-section ${last ? 'fs-section-last' : ''}"><span class="fs-sec-title">${title}</span>${body}</div>`;
  const chips = (inner) => `<div class="fs-chips">${inner}</div>`;
  root.innerHTML = `
    <div class="fs-mask" data-mask>
      <div class="fs-sheet">
        <div class="fs-handle"></div>
        <div class="fs-header"><span class="fs-title">筛选条件</span><div class="fs-close" data-close>${icon('close', 'fs-close-ic')}</div></div>
        <div class="fs-body">
          ${section('类别', chips(chipRow('category', CATEGORY_OPTIONS, (v) => v === draft.category)))}
          ${section('时间', chips(chipRow('time', OPT.time, (v) => v === draft.time)))}
          ${section('地点', chips(chipRow('place', OPT.place, (v) => v === draft.place)))}
          ${section('关键属性<span class="fs-sec-sub">可多选</span>', attrs.length
            ? chips(chipRow('attrs', attrs, (v) => draft.attrs.includes(v)))
            : '<span class="fs-hint">选择具体类别后显示该类别的专属条件</span>')}
          ${section('排序方式', chips(chipRow('sort', OPT.sort, (v) => v === draft.sort)))}
          ${section('浏览密度<span class="fs-sec-sub">点击立即切换，不计入筛选</span>', chips(chipRow('density', OPT.density, (v) => v === state.density)), true)}
        </div>
        <div class="fs-footer"><div class="fs-btn fs-reset" data-reset>重置</div><div class="fs-btn fs-confirm" data-confirm>确定筛选</div></div>
      </div>
    </div>`;
}

function renderAll() {
  document.querySelectorAll('.cat').forEach((c, i) => c.classList.toggle('is-active', CATEGORY_KEYS[i] === state.category));
  renderCond();
  renderMap();
  if (state.viewMode === 'feed') renderFeed();
  renderFilter();
}

function openFilter() {
  draft = { category: state.category, time: state.filters.time, place: state.filters.place, attrs: [...state.filters.attrs], sort: state.sort };
  renderFilter();
}

let toastTimer;
function toast(msg) {
  let el = document.querySelector('.h5-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'h5-toast';
    $('device').appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 1600);
}

// ---------- 事件 ----------
$('btn-filter').addEventListener('click', openFilter);
$('btn-place').addEventListener('click', () => {
  state.viewMode = state.viewMode === 'map' ? 'feed' : 'map';
  renderAll();
  if (state.viewMode === 'feed') restoreAnchor();
});
document.querySelectorAll('.cat').forEach((cat, i) => {
  cat.addEventListener('click', () => {
    state.category = CATEGORY_KEYS[i];
    state.filters.attrs = [];
    renderAll();
  });
});
$('cond').addEventListener('click', (e) => {
  if (e.target.closest('[data-open-filter]')) openFilter();
});
$('map').addEventListener('click', (e) => {
  if (e.target.closest('[data-back]')) {
    state.viewMode = 'feed';
    renderAll();
    restoreAnchor();
  } else if (e.target.closest('[data-locate]')) {
    toast('定位与校区选择开发中');
  } else if (e.target.closest('[data-grip]')) {
    const order = ['peek', 'half', 'expanded'];
    state.sheetState = order[(order.indexOf(state.sheetState) + 1) % 3];
    renderMap();
  }
});
$('filter-root').addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-confirm]')) {
    const filters = { time: draft.time, place: draft.place, attrs: draft.attrs };
    const changed = draft.category !== state.category || draft.sort !== state.sort || !sameFilters(filters, state.filters);
    const isDefault = draft.category === 'all' && draft.sort === 'recommended' && sameFilters(filters, DEFAULT_FILTERS);
    Object.assign(state, { category: draft.category, filters, sort: draft.sort, filterApplied: !isDefault });
    draft = null;
    if (changed) renderAll();
    else { renderCond(); renderFilter(); } // 条件没变：不重绘列表，保留滚动位置
    return;
  }
  if (t.closest('[data-reset]')) {
    draft = { category: 'all', ...DEFAULT_FILTERS, attrs: [], sort: 'recommended' };
    renderFilter();
    return;
  }
  const chip = t.closest('.fs-chip');
  if (chip) {
    if (chip.dataset.reason) {
      toast(chip.dataset.reason);
      return;
    }
    const { dim, value } = chip.dataset;
    if (dim === 'density') {
      // 浏览密度是显示偏好：立即切换，不等「确定」，也不算筛选条件（PRD 5.2）
      changeDensity(value, { quiet: true });
      renderFilter();
      return;
    }
    if (dim === 'attrs') draft.attrs = draft.attrs.includes(value) ? draft.attrs.filter((v) => v !== value) : [...draft.attrs, value];
    else if (dim === 'category') {
      draft.category = value;
      draft.attrs = [];
    } else draft[dim] = value;
    renderFilter();
    return;
  }
  // 点遮罩空白处或关闭按钮
  if (t.closest('[data-close]') || t.hasAttribute('data-mask')) {
    draft = null;
    renderFilter();
  }
});

// 底部三 Tab
const tabs = document.querySelectorAll('.tab');
const pages = document.querySelectorAll('.page');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    pages.forEach((p) => { p.hidden = p.dataset.page !== tab.dataset.target; });
  });
});

// ---------- 三级语义缩放（PRD 5.2）：双指捏合；电脑上用触控板捏合或 Ctrl + 滚轮 ----------
const DENSITY_NAMES = [{ key: 'large', text: '卡片' }, { key: 'showcase', text: '橱窗' }, { key: 'list', text: '列表' }];
/** 锚点只跟随用户自己的滚动；程序恢复位置时滚不到（被内容高度截住）也不改写它，避免越切越漂 */
let lastAnchor = '';
let restoringUntil = 0;
let scrollTimer;
let hintTimer;

/** 记下视口里第一张露出的卡 */
function captureAnchor() {
  const feed = $('feed');
  const top = feed.getBoundingClientRect().top;
  const first = [...feed.querySelectorAll('.feed-item[data-card]')].find((el) => el.getBoundingClientRect().bottom > top + 8);
  lastAnchor = first ? first.dataset.card : '';
}

function restoreAnchor() {
  const feed = $('feed');
  const el = lastAnchor && feed.querySelector(`.feed-item[data-card="${lastAnchor}"]`);
  restoringUntil = Date.now() + 300;
  feed.scrollTop = el ? el.offsetTop - 6 : 0;
}

function showHint() {
  let el = document.querySelector('.dz-hint');
  if (!el) {
    el = document.createElement('div');
    el.className = 'dz-hint';
    $('device').appendChild(el);
  }
  el.innerHTML = DENSITY_NAMES.map((n) => `<span class="dz-seg ${n.key === state.density ? 'is-cur' : ''}">${n.text}</span>`).join('');
  requestAnimationFrame(() => el.classList.add('is-on'));
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('is-on'), 900);
}

function changeDensity(next, { quiet = false } = {}) {
  if (next === state.density) {
    if (!quiet) showHint(); // 已到头：只提示当前档位
    return;
  }
  state.density = next;
  renderFeed(true);
  restoreAnchor();
  if (!quiet) showHint(); // 在筛选面板里切换时面板本身已高亮当前档位
}

function stepDensity(dir) {
  const i = DENSITIES.indexOf(state.density);
  changeDensity(DENSITIES[Math.min(DENSITIES.length - 1, Math.max(0, i + dir))]);
}

const feedEl = $('feed');
feedEl.addEventListener('scroll', () => {
  if (Date.now() < restoringUntil) return;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(captureAnchor, 120);
}, { passive: true });
let pinchStart = 0;
let pinchFired = false;
const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
feedEl.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) { pinchStart = dist(e.touches); pinchFired = false; }
}, { passive: true });
feedEl.addEventListener('touchmove', (e) => {
  if (e.touches.length !== 2 || !pinchStart || pinchFired) return;
  e.preventDefault(); // 阻止浏览器自身的页面缩放
  const r = dist(e.touches) / pinchStart;
  if (r < 0.8) { pinchFired = true; stepDensity(1); } else if (r > 1.25) { pinchFired = true; stepDensity(-1); }
}, { passive: false });
feedEl.addEventListener('touchend', (e) => { if (e.touches.length < 2) pinchStart = 0; });

// 触控板捏合在浏览器里表现为 ctrlKey + wheel；累计到阈值切一档，随后短暂冷却
let wheelAcc = 0;
let wheelCooldown = 0;
feedEl.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  if (Date.now() < wheelCooldown) return;
  wheelAcc += e.deltaY;
  if (Math.abs(wheelAcc) > 40) {
    stepDensity(wheelAcc > 0 ? 1 : -1);
    wheelAcc = 0;
    wheelCooldown = Date.now() + 450;
  }
}, { passive: false });

renderAll();
if (params.get('filter') === '1') openFilter();
