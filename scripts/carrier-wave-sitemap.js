/* ----
# Carrier Wave Sitemap
# 将独立生成的短篇辑目录、已发布篇目补入站点地图。
# 隐藏篇目（曲目表 hidden）不收录，只能从首屏标题里的入口找到。
---- */

'use strict';

const { full_url_for, escapeHTML } = require('hexo-util');

hexo.extend.filter.register('after_generate', async function () {
  const sitemap = this.config.sitemap;
  if (!sitemap || !sitemap.path) return;

  const data = this.locals.get('data') || {};
  const album = data.carrier_wave || {};
  const hidden = new Set((album.hidden || []).map(t => 'carrier_wave/' + t.slug + '/index.html'));

  // 以本轮生成的阅读页为准，避免将未接收或草稿篇目加入索引。
  const urls = [...new Set(this.route.list()
    .filter(route => /^carrier_wave\/(?:[^/]+\/)?index\.html$/.test(route) && !hidden.has(route))
    .map(route => full_url_for.call(this, route.replace(/index\.html$/, ''))))];
  if (!urls.length) return;

  const paths = [].concat(sitemap.path);
  for (const path of paths) {
    if (!/\.(xml|txt)$/.test(path)) continue;
    const stream = this.route.get(path);
    if (!stream) continue;
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const content = Buffer.concat(chunks).toString('utf8');

    if (path.endsWith('.xml')) {
      const entries = urls.map(escapeHTML)
        .filter(url => !content.includes('<loc>' + url + '</loc>'))
        .map(url => '  <url><loc>' + url + '</loc></url>\n').join('');
      this.route.set(path, content.replace('</urlset>', entries + '</urlset>'));
    } else {
      const existing = new Set(content.split(/\r?\n/).map(line => line.trim()));
      const entries = urls.filter(url => !existing.has(url));
      if (entries.length) this.route.set(path, content.trimEnd() + '\n' + entries.join('\n') + '\n');
    }
  }
});
