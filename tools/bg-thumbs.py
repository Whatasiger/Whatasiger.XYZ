#!/usr/bin/env python3
"""首页背景的极缩略图。

读 source/_data/backgrounds.yml 里每一项的 src，缩成 160px 宽的 webp，
存到 source/images/webp/thumb/ 下同名文件（与 _partial/bg-tiles.ejs 的推算一致）。
已存在的跳过，加 --force 全部重做。

用法：py -3.9 tools/bg-thumbs.py [--force]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

WIDTH = 160      # 缩略图宽度（px）：磁贴约 80px 宽，按 2 倍密度
QUALITY = 60

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source"
DATA = SOURCE / "_data" / "backgrounds.yml"


def main() -> int:
    force = "--force" in sys.argv[1:]
    # 只取 src 一个字段，不必为此引入 YAML 库
    srcs = re.findall(r"^\s*-?\s*src:\s*['\"]?([^'\"#\s]+)", DATA.read_text(encoding="utf-8"), re.M)
    if not srcs:
        print("backgrounds.yml 里没有找到 src")
        return 1

    for src in srcs:
        image = SOURCE / src.lstrip("/")
        thumb = image.parent / "thumb" / image.name
        if not image.exists():
            print(f"缺少原图：{src}")
            continue
        if thumb.exists() and not force:
            print(f"已有：{thumb.relative_to(SOURCE)}")
            continue
        thumb.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(image) as im:
            im = im.convert("RGB")
            height = max(1, round(im.height * WIDTH / im.width))
            im.resize((WIDTH, height), Image.LANCZOS).save(thumb, "WEBP", quality=QUALITY, method=6)
        print(f"生成：{thumb.relative_to(SOURCE)}（{thumb.stat().st_size} 字节）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
