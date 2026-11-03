# -*- coding: utf-8 -*-
"""
首页 / 归档卡片的封面图（两档）

卡片最宽约 800 CSS px：1 倍屏用约 1280px 宽、2 倍及以上用约 2048px 宽就足够清晰
（悬停放大 1.45 倍时上面已盖着模糊层；模糊层由 glint.js 按屏幕精度另行烘焙），不必让卡片加载 3000–4000px 的原图。
原图仍留给文章页背景（悬停卡片时 prebake 才加载，读者表现出兴趣才下载）。

输出：source/images/webp/card/<名字>.webp（1x）与 <名字>@2x.webp（2x）
原图本就不比该档宽太多时不生成（模板里的 card_cover 辅助函数找不到文件就回退原图）。
另有一档 <名字>@thumb.webp（360px 宽，总会生成）：归档时间线与搜索结果里的小封面。
新增 / 更换文章封面或主题默认背景后重跑：py -3.9 tools/card-covers.py
"""
import glob
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "source")
OUT = os.path.join(SRC, "images", "webp", "card")
TIERS = [("", 1280), ("@2x", 2048)]
THUMB = ("@thumb", 360)     # 小封面：不论原图多大都生成
SLACK = 1.15      # 原图不超过该档宽度的 1.15 倍时直接用原图
QUALITY = 88


def covers():
    found = set()
    for p in glob.glob(os.path.join(SRC, "_posts", "*.md")):
        head = open(p, encoding="utf-8-sig").read().split("\n---", 1)[0]
        m = re.search(r"^cover:\s*['\"]?([^'\"#\s]+)", head, re.M)
        if m:
            found.add(m.group(1))
    cfg = open(os.path.join(ROOT, "themes", "glint", "_config.yml"), encoding="utf-8").read()
    m = re.search(r"^background:\s*['\"]?([^'\"#\s]+)", cfg, re.M)
    if m:
        found.add(m.group(1))
    return sorted(u for u in found if u.startswith("/images/"))


def main():
    os.makedirs(OUT, exist_ok=True)
    for url in covers():
        src = os.path.join(SRC, url.lstrip("/").replace("/", os.sep))
        if not os.path.exists(src):
            print("缺少", url)
            continue
        name = os.path.splitext(os.path.basename(src))[0]
        im = Image.open(src)
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        for suffix, width in TIERS + [THUMB]:
            dst = os.path.join(OUT, name + suffix + ".webp")
            if suffix != THUMB[0] and im.width <= width * SLACK:
                if os.path.exists(dst):
                    os.remove(dst)
                continue
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                continue
            h = round(im.height * width / im.width)
            im.resize((width, h), Image.LANCZOS).save(dst, "WEBP", quality=QUALITY if suffix != THUMB[0] else 80, method=6)
            print("%s%s  %dx%d  %d KB -> %d KB" % (name, suffix, width, h, os.path.getsize(src) // 1024, os.path.getsize(dst) // 1024))


if __name__ == "__main__":
    main()
