// H5 对照原型：状态与交互，规则与小程序 store/campus.ts、各组件一致，仅用于和 UI 母版对照。
// 参数：?density=large|showcase|list  ?skeleton=1（停在骨架屏）  ?view=map（地图态）  ?sheet=half|expanded（地图抽屉）
//       ?filter=1（打开全局筛选）  ?applied=1（示例条件串）  ?flat=1（截图模式）  ?h=781（截图高度）  ?chrome=0
const params = new URLSearchParams(location.search);
if (params.get('chrome') === '0') document.body.classList.add('no-chrome');
if (params.get('flat') === '1') document.body.classList.add('flat');
if (params.get('h')) document.getElementById('device').style.height = `${Number(params.get('h'))}px`;

const $ = (id) => document.getElementById(id);
const OPT = window.FILTER_OPTIONS;
const DENSITIES = ['large', 'showcase', 'list'];
const SKELETON_SLOTS = { large: 2, showcase: 4, list: 5 };
const CATEGORY_KEYS = ['all', 'opportunity', 'merchant', 'identity', 'event'];
const STEPS = OPT.steps; // 七维筛选链：分类 → 时间 → 地点 → 状态 → 条件 → 费用 → 排序
const DIM_DEFAULTS = OPT.defaults;
const FILTER_DIMS = ['time', 'place', 'status', 'condition', 'cost'];
const DEFAULT_FILTERS = Object.fromEntries(FILTER_DIMS.map((d) => [d, DIM_DEFAULTS[d]]));
const ADVANCE_DELAY = 180; // 选中后自动进入下一维的延迟
const holdSkeleton = params.get('skeleton') === '1';
const optText = (list, v) => (list.find((o) => o.value === v) || {}).text || '';
const sameFilters = (a, b) => FILTER_DIMS.every((d) => a[d] === b[d]);
/** 某一维当前值：分类、排序在顶层，其余在 filters 里 */
const valueOf = (src, dim) => (dim === 'category' ? src.category : dim === 'sort' ? src.sort : src.filters[dim]);

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
  Object.assign(state, { category: 'event', filters: { ...DEFAULT_FILTERS, time: 'this_week', place: 'campus', status: 'open', cost: 'free' }, filterApplied: true });
}
/** 全局筛选草稿：打开时复制当前条件，点「搜索结果」才写回；step 是当前所在维度 */
let draft = null;
let step = 0;
let advanceTimer;

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
  // 已选的维度各一个下拉胶囊，排序始终显示（与小程序 condition-bar 一致）
  const chips = STEPS.filter((st) => st.dim === 'sort' || valueOf(state, st.dim) !== DIM_DEFAULTS[st.dim]);
  // H5 里点胶囊打开全局筛选并跳到该维度；小程序里是同维度下拉菜单
  const html = chips.map((st) => `<div class="cb-chip" data-open-step="${STEPS.indexOf(st)}">${esc(optText(st.options, valueOf(state, st.dim)))}${icon('caret-down', 'cb-caret')}</div>`).join('');
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

function renderFilter() {
  const root = $('filter-root');
  if (!draft) {
    root.innerHTML = '';
    return;
  }
  const cur = STEPS[step];
  const stepChip = (st, i) => {
    const set = draft[st.dim] !== DIM_DEFAULTS[st.dim] && i !== step;
    const arrow = i === 0 || i === 4 ? '' : '<span class="fs-arrow">→</span>';
    return `${arrow}<div class="fs-step ${i === step ? 'is-cur' : ''} ${set ? 'is-set' : ''}" data-step="${i}">${st.text}</div>`;
  };
  const opts = cur.options.map((o) => `<div class="fs-opt ${draft[cur.dim] === o.value ? 'is-on' : ''} ${o.disabledReason ? 'is-off' : ''}" data-value="${o.value}" data-reason="${esc(o.disabledReason || '')}">${esc(o.text)}</div>`).join('');
  root.innerHTML = `
    <div class="fs-mask" data-mask>
      <div class="fs-sheet">
        <div class="fs-head">
          <span class="fs-title">全局筛选</span>
          <span class="fs-sub">按七个维度逐步筛选，快速定位你需要的内容</span>
          <div class="fs-close" data-close>${icon('close', 'fs-close-ic')}</div>
        </div>
        <div class="fs-steps">
          <div class="fs-step-row">${STEPS.slice(0, 4).map((st, i) => stepChip(st, i)).join('')}</div>
          <div class="fs-step-row">${STEPS.slice(4).map((st, i) => stepChip(st, i + 4)).join('')}</div>
        </div>
        <span class="fs-sec-title">${cur.title}</span>
        <div class="fs-grid">${opts}</div>
        <div class="fs-footer"><div class="fs-btn fs-reset" data-reset>重置筛选</div><div class="fs-btn fs-search" data-search>搜索结果</div></div>
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

function openFilter(atStep = 0) {
  clearTimeout(advanceTimer);
  draft = { category: state.category, ...state.filters, sort: state.sort };
  step = atStep;
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
$('btn-filter').addEventListener('click', () => openFilter());
$('btn-place').addEventListener('click', () => {
  state.viewMode = state.viewMode === 'map' ? 'feed' : 'map';
  renderAll();
  if (state.viewMode === 'feed') restoreAnchor();
});
document.querySelectorAll('.cat').forEach((cat, i) => {
  cat.addEventListener('click', () => {
    state.category = CATEGORY_KEYS[i];
    renderAll();
  });
});
$('cond').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-open-step]');
  if (chip) openFilter(Number(chip.dataset.openStep));
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
  // 搜索结果：草稿写回，条件不全是默认值时显示条件串
  if (t.closest('[data-search]')) {
    clearTimeout(advanceTimer);
    const filters = Object.fromEntries(FILTER_DIMS.map((d) => [d, draft[d]]));
    const changed = draft.category !== state.category || draft.sort !== state.sort || !sameFilters(filters, state.filters);
    const isDefault = draft.category === 'all' && draft.sort === 'recommended' && sameFilters(filters, DEFAULT_FILTERS);
    Object.assign(state, { category: draft.category, filters, sort: draft.sort, filterApplied: !isDefault });
    draft = null;
    if (changed) renderAll();
    else { renderCond(); renderFilter(); } // 条件没变：不重绘列表，保留滚动位置
    return;
  }
  if (t.closest('[data-reset]')) {
    clearTimeout(advanceTimer);
    draft = { ...DIM_DEFAULTS };
    step = 0;
    renderFilter();
    return;
  }
  const stepChip = t.closest('[data-step]');
  if (stepChip) {
    clearTimeout(advanceTimer);
    step = Number(stepChip.dataset.step);
    renderFilter();
    return;
  }
  const opt = t.closest('.fs-opt');
  if (opt) {
    if (opt.dataset.reason) {
      toast(opt.dataset.reason);
      return;
    }
    draft[STEPS[step].dim] = opt.dataset.value;
    renderFilter();
    // 逐维选择：选完自动进入下一维，最后一维（排序）停留
    if (step < STEPS.length - 1) {
      const from = step;
      clearTimeout(advanceTimer);
      advanceTimer = setTimeout(() => {
        if (draft && step === from) {
          step = from + 1;
          renderFilter();
        }
      }, ADVANCE_DELAY);
    }
    return;
  }
  // 点遮罩空白处或关闭按钮：放弃草稿
  if (t.closest('[data-close]') || t.hasAttribute('data-mask')) {
    clearTimeout(advanceTimer);
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
