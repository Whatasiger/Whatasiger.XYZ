# -*- coding: utf-8 -*-
"""
重新取顶栏专用字体「Glint UI」的子集（themes/glint/layout/_partial/ui-font.ejs）

ui-font.ejs 内联了一份思源黑体 600 的 woff2 子集，只含顶栏 / 导航的固定文字。顶栏或导航改字（含发版改版本名、加导航项）后，
新字不在子集里会回退到外链字体，又出现「先雅黑后思源」。用法：

    py -3.9 tools/ui-font.py            # 取现有子集里的字 + 主题 _config.yml 菜单名 + header.ejs 版本名 / 占位文字
    py -3.9 tools/ui-font.py 新字 …      # 另外追加若干字

做法：读出现有子集的字表，并上要加的字，向 Google Fonts 的 css2 接口（loli.net 镜像对 text= 子集返回的是 EOT，不能用）带 text= 取 woff2，base64 后写回。
"""
import base64
import io
import os
import re
import sys
import urllib.parse
import urllib.request

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EJS = os.path.join(ROOT, "themes", "glint", "layout", "_partial", "ui-font.ejs")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    src = open(EJS, encoding="utf-8").read()
    m = re.search(r"base64,([A-Za-z0-9+/=]+)", src)
    font = TTFont(io.BytesIO(base64.b64decode(m.group(1))))
    chars = set(chr(c) for c in font.getBestCmap())

    cfg = open(os.path.join(ROOT, "themes", "glint", "_config.yml"), encoding="utf-8").read()
    menu = re.search(r"^menu:.*?\n((?:[ \t]+.*\n)+)", cfg, re.M)
    if menu:
        for name in re.findall(r"^\s*'([^']+)'\s*:", menu.group(1), re.M):
            chars.update(name)
    header = open(os.path.join(ROOT, "themes", "glint", "layout", "_partial", "header.ejs"), encoding="utf-8").read()
    for pat in (r'class="header-logo-name">([^<]+)<', r'class="header-logo-ver">([^<]+)<', r'placeholder="([^"]+)"'):
        for t in re.findall(pat, header):
            chars.update(t)
    for arg in sys.argv[1:]:
        chars.update(arg)
    chars.discard("\n")

    text = "".join(sorted(chars))
    css = fetch("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@600&display=block&text=" + urllib.parse.quote(text)).decode("utf-8")
    urls = re.findall(r"url\((https://[^)]+)\)", css)
    if len(urls) != 1:
        sys.exit("字体接口返回了 %d 个文件，预期 1 个：\n%s" % (len(urls), css))
    raw = fetch(urls[0])
    # 接口给的文件带 hinting 与整套 OpenType 特性，再用 fontTools 精简一遍（只留这些字，去掉 hinting）
    from fontTools import subset
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.hinting = False
    opts.desubroutinize = True
    opts.layout_features = ["kern", "palt"]
    opts.name_IDs = [1, 2]
    f = TTFont(io.BytesIO(raw))
    sub = subset.Subsetter(options=opts)
    sub.populate(text=text)
    sub.subset(f)
    f.flavor = "woff2"
    buf = io.BytesIO()
    f.save(buf)
    woff2 = buf.getvalue()
    b64 = base64.b64encode(woff2).decode("ascii")

    out = src[:m.start(1)] + b64 + src[m.end(1):]
    with open(EJS, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    print("Glint UI：%d 字，woff2 %d 字节" % (len(chars), len(woff2)))
    print(text)


if __name__ == "__main__":
    main()
