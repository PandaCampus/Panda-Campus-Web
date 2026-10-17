// 底部三 Tab 切换 + 分类选中态（仅框架，未接数据）
const params = new URLSearchParams(location.search);
if (params.get('chrome') === '0') document.body.classList.add('no-chrome');
if (params.get('flat') === '1') document.body.classList.add('flat');

const tabs = document.querySelectorAll('.tab');
const pages = document.querySelectorAll('.page');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    pages.forEach((p) => { p.hidden = p.dataset.page !== tab.dataset.target; });
  });
});

document.querySelectorAll('.cat').forEach((cat, _, all) => {
  cat.addEventListener('click', () => {
    all.forEach((c) => c.classList.toggle('is-active', c === cat));
  });
});
