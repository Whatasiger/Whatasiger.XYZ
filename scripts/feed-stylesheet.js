/* ----
# Feed Stylesheet
# 给订阅源（hexo-generator-feed 的 atom.xml / rss2.xml、CARRiER WAVE. 的 carrier_wave/atom.xml）加上
# <?xml-stylesheet type="text/xsl" href="/feed.xsl"?>：浏览器直接打开时由 source/feed.xsl 显示成说明页，
# RSS 阅读器不理会样式表，照常读 XML。
---- */

'use strict';

hexo.extend.filter.register('after_generate', async function () {
  const feed = this.config.feed || {};
  const paths = new Set(['carrier_wave/atom.xml']);
  if (feed.enable !== false) {
    [].concat(feed.path || 'atom.xml').forEach(p => paths.add(String(p).replace(/^\//, '')));
  }
  const href = this.config.root.replace(/\/?$/, '/') + 'feed.xsl';
  const pi = '<?xml-stylesheet type="text/xsl" href="' + href + '"?>';

  for (const path of paths) {
    const stream = this.route.get(path);
    if (!stream) continue;
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    let content = Buffer.concat(chunks).toString('utf8');
    if (content.includes('<?xml-stylesheet')) continue;
    // 处理指令须在 XML 声明之后、根元素之前
    content = /^\s*<\?xml[^?]*\?>/.test(content)
      ? content.replace(/^(\s*<\?xml[^?]*\?>)/, '$1\n' + pi)
      : pi + '\n' + content;
    this.route.set(path, content);
  }
});
