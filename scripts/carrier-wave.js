/* ----
# Carrier Wave Generator
# By: Whatasiger
# 生成短篇辑「CARRiER WAVE.」的独立页面：
#   /carrier_wave/          目录页（layout: carrier-wave-index）
#   /carrier_wave/<slug>/   阅读页（layout: carrier-wave-reader）
# 曲目表来自 source/_data/carrier_wave.yml，正文来自 source/_carrier_wave/<slug>.md。
# 正文不存在或 front matter 写了 draft: true 的篇目视为「未接收」，只在目录中占位。
# hidden 中的篇目只生成阅读页，不进入目录，也不参与上一篇/下一篇。
# source/_carrier_wave 以下划线开头，不会被 Hexo 当作页面处理，也不会被 hexo server 监听，
# 修改正文后需重启 hexo server。
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const { parse: parseFrontMatter } = require('hexo-front-matter');

const BASE = 'carrier_wave';

function countWords(html) {
  const text = String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const latin = (text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9\u00C0-\u024F]+/g) || []).length;
  return cjk + latin;
}

function formatWords(n) {
  return n ? n.toLocaleString('en-US') + ' 字' : '';
}

// 已接收（会生成阅读页）的篇目 slug：与下方生成器同一判断（正文文件存在、front matter 没写 draft）
// 首页 CW 卡片用它判断有没有读者还没见过的新篇目（archive-list.ejs 的「新信号」）
function publishedSlugs(album) {
  const dir = path.join(hexo.source_dir, '_carrier_wave');
  return (album && Array.isArray(album.tracks) ? album.tracks : []).filter((raw) => {
    const file = path.join(dir, raw.slug + '.md');
    if (!fs.existsSync(file)) return false;
    const src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
    const fm = /^(-{3,}|;{3,})\r?\n/.test(src) ? parseFrontMatter(src) : {};
    return !fm.draft;
  }).map((raw) => raw.slug);
}
hexo.extend.helper.register('cw_published', function () {
  return publishedSlugs(this.site.data && this.site.data.carrier_wave);
});
// 是否暂时隐藏入口（carrier_wave.yml 的 hide_entry；不是 hidden，那是隐藏篇目列表）：首页换预告卡片、站内搜索跳过
hexo.extend.helper.register('cw_hidden', function () {
  const album = this.site.data && this.site.data.carrier_wave;
  return !!(album && album.hide_entry === true);
});
// 写作统计页（layout stats）用：篇目总数、已接收篇数、已接收篇目的字数（按正文 Markdown 估算，与阅读页的字数口径相近）
hexo.extend.helper.register('cw_stats', function () {
  const album = this.site.data && this.site.data.carrier_wave;
  const slugs = publishedSlugs(album);
  const dir = path.join(hexo.source_dir, '_carrier_wave');
  let words = 0;
  slugs.forEach((slug) => {
    const src = fs.readFileSync(path.join(dir, slug + '.md'), 'utf8').replace(/^﻿/, '');
    const fm = /^(-{3,}|;{3,})\r?\n/.test(src) ? parseFrontMatter(src) : { _content: src };
    words += countWords(fm._content || '');
  });
  return { total: album && Array.isArray(album.tracks) ? album.tracks.length : 0, published: slugs.length, words };
});

function xmlEscape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

hexo.extend.generator.register('carrier_wave', async function (locals) {
  const album = locals.data && locals.data.carrier_wave;
  if (!album || !Array.isArray(album.tracks)) return [];

  const dir = path.join(hexo.source_dir, '_carrier_wave');
  const total = album.tracks.length;

  const load = async (raw, i, hidden) => {
    const track = {
      slug: raw.slug,
      title: raw.title,
      part: raw.part ? String(raw.part) : '',
      lead: !!raw.lead,
      tint: raw.tint || '#B7C4D4',
      wave: raw.wave || '',
      flat: !!raw.flat,
      index: hidden ? 0 : i + 1,
      no: hidden ? '？？' : String(i + 1).padStart(2, '0'),
      hidden: !!hidden,
      published: false,
      url: '',
      content: '',
      words: 0,
      wordsLabel: ''
    };

    const file = path.join(dir, track.slug + '.md');
    if (!fs.existsSync(file)) return track;

    // 只认文件开头的 --- 为 front matter；否则正文里的 --- 分隔线会让之前的内容被当成 YAML
    const src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
    const fm = /^(-{3,}|;{3,})\r?\n/.test(src) ? parseFrontMatter(src) : { _content: src };
    if (fm.draft) return track;

    track.content = await hexo.render.render({ text: fm._content || '', engine: 'markdown' });
    track.words = countWords(track.content);
    track.wordsLabel = formatWords(track.words);
    track.description = fm.description || '';
    track.updated = fs.statSync(file).mtime;
    track.published = true;
    track.url = '/' + BASE + '/' + track.slug + '/';
    return track;
  };

  const tracks = await Promise.all(album.tracks.map((raw, i) => load(raw, i, false)));
  const hidden = await Promise.all((album.hidden || []).map((raw, i) => load(raw, i, true)));

  const published = tracks.filter(t => t.published);
  const meta = {
    title: album.title || 'CARRiER WAVE.',
    subtitle: album.subtitle || '',
    caption: album.caption || '',
    epigraph: album.epigraph || '',
    url: '/' + BASE + '/',
    total
  };

  const routes = [{
    path: BASE + '/index.html',
    layout: ['carrier-wave-index'],
    data: { album: meta, tracks, title: meta.title, path: BASE + '/' }
  }];

  published.forEach((track, i) => {
    routes.push({
      path: BASE + '/' + track.slug + '/index.html',
      layout: ['carrier-wave-reader'],
      data: {
        album: meta,
        track,
        prev: published[i - 1] || null,
        next: published[i + 1] || null,
        title: track.title + (track.part ? ' ' + track.part : ''),
        path: BASE + '/' + track.slug + '/'
      }
    });
  });

  hidden.filter(t => t.published).forEach(track => {
    routes.push({
      path: BASE + '/' + track.slug + '/index.html',
      layout: ['carrier-wave-reader'],
      data: {
        album: meta,
        track,
        prev: null,
        next: null,
        title: track.title,
        path: BASE + '/' + track.slug + '/'
      }
    });
  });

  // 订阅源 /carrier_wave/atom.xml：已接收的篇目（篇目没有日期，按正文文件的修改时间排）
  const site = (hexo.config.url || '').replace(/\/+$/, '');
  const feedItems = published.slice().sort((a, b) => b.updated - a.updated);
  const feedUpdated = (feedItems[0] ? feedItems[0].updated : new Date()).toISOString();
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <title>' + xmlEscape(meta.title + ' ' + meta.subtitle + ' · ' + hexo.config.title) + '</title>',
    '  <subtitle>' + xmlEscape(meta.epigraph) + '</subtitle>',
    '  <link href="' + site + '/' + BASE + '/atom.xml" rel="self"/>',
    '  <link href="' + site + '/' + BASE + '/"/>',
    '  <id>' + site + '/' + BASE + '/</id>',
    '  <updated>' + feedUpdated + '</updated>',
    '  <author><name>' + xmlEscape(hexo.config.author) + '</name></author>'
  ];
  feedItems.forEach((t) => {
    lines.push('  <entry>',
      '    <title>' + xmlEscape(t.no + ' ' + t.title + (t.part ? ' ' + t.part : '')) + '</title>',
      '    <link href="' + site + t.url + '"/>',
      '    <id>' + site + t.url + '</id>',
      '    <updated>' + t.updated.toISOString() + '</updated>');
    if (t.description) lines.push('    <summary>' + xmlEscape(t.description) + '</summary>');
    lines.push('    <content type="html">' + xmlEscape(t.content) + '</content>', '  </entry>');
  });
  lines.push('</feed>', '');
  routes.push({ path: BASE + '/atom.xml', data: lines.join('\n') });

  return routes;
});
