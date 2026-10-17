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

function renderFeed() {
  const feed = $('feed');
  const d = state.density;
  const cards = holdSkeleton
    ? Array.from({ length: SKELETON_SLOTS[d] })
    : window.SAMPLE_CARDS.filter((c) => state.category === 'all' || c.type === state.category);
  if (!holdSkeleton && !cards.length) {
    feed.innerHTML = '<div class="empty">没有找到符合条件的信息</div>';
    return;
  }
  const items = cards.map((c) => `<div class="feed-item">${d === 'list' ? listRow(c, holdSkeleton) : verticalCard(c, d, holdSkeleton)}</div>`).join('');
  feed.innerHTML = `<div class="feed-${d}">${items}</div>`;
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
          ${section('浏览密度', chips(chipRow('density', OPT.density, (v) => v === draft.density)), true)}
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
  draft = { category: state.category, time: state.filters.time, place: state.filters.place, attrs: [...state.filters.attrs], sort: state.sort, density: state.density };
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
    Object.assign(state, {
      category: draft.category,
      filters: { time: draft.time, place: draft.place, attrs: draft.attrs },
      sort: draft.sort,
      density: draft.density,
      filterApplied: true,
    });
    draft = null;
    renderAll();
    return;
  }
  if (t.closest('[data-reset]')) {
    draft = { category: 'all', ...DEFAULT_FILTERS, attrs: [], sort: 'recommended', density: draft.density };
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

renderAll();
if (params.get('filter') === '1') openFilter();
