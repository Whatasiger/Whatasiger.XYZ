/* ----
# Lazy Images Filter
# By: Whatasiger
# 正文图片在构建期加上 loading="lazy" decoding="async"，站内图片（/images/ 下的 webp / png / jpg）再写上 width / height：
#   - 原生懒加载由浏览器在解析 HTML 时就生效；原先 glint.js 在页尾才把 src 换成空白 GIF，那时预加载扫描器早已开始下载原图，
#     换完图片又塌成 1px 再撑开，版面会跳
#   - 写了宽高，图片下载前就按比例占好位置（glint.css 的 article img 配 height: auto）
# 已写了 loading / width 的 <img> 不动
---- */

'use strict';

const fs = require('fs');
const path = require('path');

const sizeCache = new Map();

// 只读文件头取尺寸，不依赖第三方库
function imageSize(file) {
  let buf;
  try {
    const fd = fs.openSync(file, 'r');
    buf = Buffer.alloc(64 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    buf = buf.subarray(0, n);
  } catch (e) {
    return null;
  }
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // WebP
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) };
    }
    return null;
  }
  // JPEG：找 SOF 段
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

function localSize(src) {
  const m = String(src).match(/^\/(images\/[^?#"']+\.(?:webp|png|jpe?g))(?:[?#].*)?$/i);
  if (!m) return null;
  let rel;
  try { rel = decodeURIComponent(m[1]); } catch (e) { rel = m[1]; }
  const file = path.join(hexo.source_dir, rel);
  let mtime;
  try { mtime = fs.statSync(file).mtimeMs; } catch (e) { return null; }
  const hit = sizeCache.get(file);
  if (hit && hit.mtime === mtime) return hit.size;
  const size = imageSize(file);
  sizeCache.set(file, { mtime, size });
  return size;
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<img') === -1) return data;
  data.content = data.content.replace(/<img\b([^>]*?)(\s*\/?)>/gi, function (tag, attrs, close) {
    let extra = '';
    if (!/\sloading=/i.test(attrs)) extra += ' loading="lazy"';
    if (!/\sdecoding=/i.test(attrs)) extra += ' decoding="async"';
    if (!/\swidth=/i.test(attrs) && !/\sheight=/i.test(attrs)) {
      const m = attrs.match(/\ssrc=["']([^"']+)["']/i);
      const size = m && localSize(m[1]);
      if (size && size.w && size.h) extra += ' width="' + size.w + '" height="' + size.h + '"';
    }
    return extra ? '<img' + attrs + extra + close + '>' : tag;
  });
  return data;
});
