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
    total,
    version: Date.now().toString(36)
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

  return routes;
});
