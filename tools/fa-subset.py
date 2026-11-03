# -*- coding: utf-8 -*-
"""
Font Awesome 4.7 子集（Glint 用）

原先整套 FA 从 cdnjs 外链（样式 + 约 77KB 字体），放在 <head> 里会阻塞首帧，国内访问 cdnjs 又时快时慢；
实际只用到几十个图标。这里扫描站点用到的图标，从 tools/fa-src/ 的原版字体切出子集，
把 woff2 以 base64 内联进 themes/glint/source/static/fa/fa.css（同源、一个请求、随 asset_url 哈希缓存）。

扫描范围：
  - 模板 / 主题脚本 / scripts/ / source/ 下 md 与 yml 里的 fa-xxx 类名
  - 主题 _config.yml 的 menu_icons、_data/gizmo.yml 的 icon 字段
  - glint.css 里 content: "\fxxx" 直接写码位的伪元素
  - 模板里写死的缺省图标（DEFAULTS）

新增图标后（含 gizmo.yml / menu_icons 换图标）重跑：py -3.9 tools/fa-subset.py
依赖：fontTools + brotli
"""
import base64
import io
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_TTF = os.path.join(ROOT, "tools", "fa-src", "fontawesome-webfont.ttf")
SRC_CSS = os.path.join(ROOT, "tools", "fa-src", "font-awesome.css")
OUT_CSS = os.path.join(ROOT, "themes", "glint", "source", "static", "fa", "fa.css")

# 模板里 `|| 'xxx'` 写死的缺省图标（header.ejs 菜单、gizmo.ejs 卡片）
DEFAULTS = ["home", "circle-o", "cube"]

SCAN_DIRS = [
    ("themes/glint/layout", (".ejs",)),
    ("themes/glint/source/static", (".js", ".css")),
    ("scripts", (".js",)),
    ("source", (".md", ".yml", ".ejs", ".html")),
]
SKIP_DIRS = {"gizmo", "_carrier_wave", "fa", "carrier-wave"}  # 独立小玩意 / CW 不用 FA；fa/ 是本工具的产物


def read(p):
    with open(p, encoding="utf-8", errors="ignore") as f:
        return f.read()


def parse_fa_css(css):
    """类名 -> 码位（含别名）"""
    names = {}
    for sel, code in re.findall(r"([^{}]+)\{\s*content:\s*\"\\(f[0-9a-f]{3})\";\s*\}", css):
        for name in re.findall(r"\.fa-([a-z0-9-]+):before", sel):
            names[name] = int(code, 16)
    return names


def main():
    css = read(SRC_CSS)
    name_map = parse_fa_css(css)

    used_names = set(DEFAULTS)
    codepoints = set()

    for rel, exts in SCAN_DIRS:
        base = os.path.join(ROOT, rel)
        for dirpath, dirnames, files in os.walk(base):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in files:
                if not fn.endswith(exts):
                    continue
                text = read(os.path.join(dirpath, fn))
                used_names.update(re.findall(r"\bfa-([a-z0-9-]+)", text))
                if fn.endswith(".css"):
                    codepoints.update(int(c, 16) for c in re.findall(r"content:\s*[\"']\\(f[0-9a-f]{3})[\"']", text))
                if fn.endswith(".yml"):
                    used_names.update(re.findall(r"^\s*-?\s*icon:\s*['\"]?([a-z0-9-]+)", text, re.M))

    # 主题配置：menu_icons 的值
    theme_cfg = read(os.path.join(ROOT, "themes", "glint", "_config.yml"))
    m = re.search(r"^menu_icons:.*?\n((?:[ \t]+.*\n)+)", theme_cfg, re.M)
    if m:
        used_names.update(re.findall(r":\s*['\"]?([a-z0-9-]+)['\"]?\s*$", m.group(1), re.M))

    icons = sorted(n for n in used_names if n in name_map)
    codepoints.update(name_map[n] for n in icons)
    if not codepoints:
        sys.exit("没有找到任何图标")

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = []
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = []
    opts.notdef_outline = True
    font = TTFont(SRC_TTF)
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=sorted(codepoints))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    lines = [
        "/* 由 tools/fa-subset.py 生成，勿手改。Font Awesome 4.7 by Dave Gandy（字体 SIL OFL 1.1，样式 MIT）",
        "   只含站点用到的 %d 个码位；新增图标后重跑该脚本 */" % len(codepoints),
        "@font-face{font-family:\"FontAwesome\";src:url(data:font/woff2;base64,%s) format(\"woff2\");"
        "font-weight:normal;font-style:normal;font-display:block}" % b64,
        ".fa{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;"
        "text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}",
    ]
    for n in icons:
        lines.append(".fa-%s:before{content:\"\\%x\"}" % (n, name_map[n]))
    os.makedirs(os.path.dirname(OUT_CSS), exist_ok=True)
    with open(OUT_CSS, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print("图标 %d 个，码位 %d 个，woff2 %d 字节 -> %s" % (len(icons), len(codepoints), len(buf.getvalue()), os.path.relpath(OUT_CSS, ROOT)))
    print(" ".join(icons))


if __name__ == "__main__":
    main()
