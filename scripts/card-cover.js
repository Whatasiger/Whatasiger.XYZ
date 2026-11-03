/* ----
# Card Cover Helper
# By: Whatasiger
# card_cover('/images/webp/xxx.webp') → { x1, x2, set, thumb }
#   x1 / x2：卡片用的 1 倍 / 2 倍封面（tools/card-covers.py 生成在 /images/webp/card/），没有就回退原图
#   set：写进内联 background-image 的 image-set(...)，浏览器按设备像素比挑一张
#   thumb：360px 宽的小封面（归档时间线 / 搜索结果），没有就用 x1
# 卡片不必加载 3000–4000px 的原图；原图只给文章页背景（悬停卡片时 prebake 才加载）
---- */

'use strict';

const fs = require('fs');
const path = require('path');

hexo.extend.helper.register('card_cover', function (url) {
  url = String(url || '');
  const m = url.match(/^\/images\/webp\/([^/]+)\.webp$/);
  let x1 = url, x2 = url, thumb = '';
  if (m) {
    const dir = path.join(hexo.source_dir, 'images', 'webp', 'card');
    if (fs.existsSync(path.join(dir, m[1] + '.webp'))) x1 = '/images/webp/card/' + m[1] + '.webp';
    if (fs.existsSync(path.join(dir, m[1] + '@2x.webp'))) x2 = '/images/webp/card/' + m[1] + '@2x.webp';
    if (fs.existsSync(path.join(dir, m[1] + '@thumb.webp'))) thumb = '/images/webp/card/' + m[1] + '@thumb.webp';
  }
  thumb = this.url_for(thumb || x1);
  x1 = this.url_for(x1);
  x2 = this.url_for(x2);
  const set = x1 === x2
    ? "url('" + x1 + "')"
    : "image-set(url('" + x1 + "') 1x, url('" + x2 + "') 2x)";
  return { x1, x2, set, thumb };
});
