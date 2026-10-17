"""
把小程序的信息卡样式同步到 H5 原型：rpx → px（750rpx = 390px），输出 apps/h5-prototype/card.css。
H5 只用于和 UI 母版逐像素对照；改卡片样式请改小程序，然后运行：python tools/sync-h5-styles.py
"""
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
mp = root / 'apps' / 'miniprogram'
K = 390 / 750


def to_px(css: str) -> str:
    def f(m):
        v = round(float(m.group(1)) * K, 2)
        return f"{int(v) if v == int(v) else v}px"
    return re.sub(r'(-?\d+(?:\.\d+)?)rpx', f, css)


def tokens(app_wxss: str) -> str:
    body = app_wxss[app_wxss.index('page {') + len('page {'):]
    body = body[:body.index('background: var(--surface);')]
    return ':root {' + to_px(body) + '}\n'


def feed_rules(campus_wxss: str) -> str:
    start = campus_wxss.index('/* 第 5 层')
    end = campus_wxss.index('/* 空态')
    lines = campus_wxss[start:end].splitlines()
    # .viewport 的定位由 H5 自己的 style.css 负责
    return to_px('\n'.join(l for l in lines if not l.startswith('.viewport')))


out = ['/* 自动生成：tools/sync-h5-styles.py，请勿手改 */',
       tokens((mp / 'app.wxss').read_text(encoding='utf-8')),
       feed_rules((mp / 'pages/campus/index.wxss').read_text(encoding='utf-8')),
       to_px((mp / 'components/info-card/index.wxss').read_text(encoding='utf-8'))]
(root / 'apps/h5-prototype/card.css').write_text('\n'.join(out), encoding='utf-8', newline='\n')
print('written', root / 'apps/h5-prototype/card.css')
