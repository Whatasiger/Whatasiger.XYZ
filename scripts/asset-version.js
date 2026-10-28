/* ----
# Asset Version Helper
# By: Whatasiger
# asset_url('static/glint.css') → /static/glint.css?v=<内容哈希前 8 位>
# 主题的样式 / 脚本地址固定不变时，浏览器（尤其手机）可能拿新 HTML 配缓存里的旧 CSS / JS，新加的元素没有样式；
# 地址带上内容哈希，文件一改地址就变，缓存自然失效。按修改时间缓存哈希，hexo server 下改了文件也会更新
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const cache = new Map();

hexo.extend.helper.register('asset_url', function (p) {
  const url = this.url_for(p);
  const file = path.join(hexo.theme_dir, 'source', p.replace(/^\//, ''));
  try {
    const mtime = fs.statSync(file).mtimeMs;
    let hit = cache.get(file);
    if (!hit || hit.mtime !== mtime) {
      hit = { mtime, hash: crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8) };
      cache.set(file, hit);
    }
    return url + '?v=' + hit.hash;
  } catch (e) {
    return url;
  }
});
