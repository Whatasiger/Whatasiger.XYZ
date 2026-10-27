#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import re
import sys
import time
from io import BytesIO
from pathlib import Path
from typing import Dict, Iterable, Set, Tuple
from urllib.request import Request, urlopen

from PIL import Image


URL_PATTERN = re.compile(
    r"https?://[^\s)\"'<>]+?\.(?:png|jpe?g)(?:\?[^\s)\"'<>]*)?",
    re.IGNORECASE,
)


def target_files(root: Path) -> Iterable[Path]:
    source_dir = root / "source"
    for md_file in source_dir.rglob("*.md"):
        yield md_file

    theme_config = root / "themes" / "glint" / "_config.yml"
    if theme_config.exists():
        yield theme_config


def collect_urls(files: Iterable[Path]) -> Tuple[Dict[Path, str], Set[str]]:
    file_text: Dict[Path, str] = {}
    urls: Set[str] = set()

    for file_path in files:
        text = file_path.read_text(encoding="utf-8")
        file_text[file_path] = text
        for match in URL_PATTERN.finditer(text):
            urls.add(match.group(0))

    return file_text, urls


def download_bytes(url: str) -> bytes:
    req = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            )
        },
    )
    last_error: Exception | None = None
    for _ in range(3):
        try:
            with urlopen(req, timeout=30) as response:
                return response.read()
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1)
    if last_error is not None:
        raise last_error
    raise RuntimeError("下载失败")


def convert_to_webp(image_data: bytes, output_path: Path) -> None:
    with Image.open(BytesIO(image_data)) as img:
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        img.save(output_path, format="WEBP", quality=85, method=6)


def build_local_path(url: str) -> str:
    name = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16] + ".webp"
    return f"/images/webp/{name}"


def replace_urls(text: str, mapping: Dict[str, str]) -> str:
    def _repl(match: re.Match[str]) -> str:
        url = match.group(0)
        return mapping.get(url, url)

    return URL_PATTERN.sub(_repl, text)


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "source" / "images" / "webp"
    output_dir.mkdir(parents=True, exist_ok=True)

    files = list(target_files(root))
    file_text, urls = collect_urls(files)

    if not urls:
        print("未发现 .png/.jpg 外链，无需处理。")
        return 0

    print(f"共发现 {len(urls)} 个外链图片，开始下载并转换为 webp...")

    mapping: Dict[str, str] = {}
    failed = []

    for url in sorted(urls):
        local_web_path = build_local_path(url)
        local_file_path = output_dir / local_web_path.split("/")[-1]
        try:
            if not local_file_path.exists():
                image_bytes = download_bytes(url)
                convert_to_webp(image_bytes, local_file_path)
                print(f"[OK] 转换成功: {url} -> {local_web_path}")
            else:
                print(f"[SKIP] 已存在: {local_web_path}")
            mapping[url] = local_web_path
        except Exception as exc:  # noqa: BLE001
            failed.append((url, str(exc)))
            print(f"[FAIL] {url} -> {exc}")

    changed_files = 0
    for file_path, text in file_text.items():
        updated = replace_urls(text, mapping)
        if updated != text:
            file_path.write_text(updated, encoding="utf-8")
            changed_files += 1
            print(f"[UPDATE] 已更新引用: {file_path.relative_to(root)}")

    print(f"\n处理完成：共更新 {changed_files} 个文件。")
    if failed:
        print(f"有 {len(failed)} 个外链处理失败：")
        for url, reason in failed:
            print(f"- {url} ({reason})")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
