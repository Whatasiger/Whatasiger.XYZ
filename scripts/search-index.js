/* ----
# Search Index Generator
# By: Whatasiger
# 生成 Glint 站内搜索用的精简索引 /search.json（glint.js setupSearch 读取）：
#   文章、独立页面（关于 / 留言板 / 友链…）、CARRiER WAVE. 各篇、Gizmo 陈列的小玩意
#   每条 { k: 类别, t: 标题, u: 地址, d: 日期, g: [标签], c: 纯文本正文, i: 小封面 }
# 正文去掉 HTML、脚注回跳符号与多余空白；比 hexo-generator-searchdb 的 search.xml（带整段 HTML）小得多
# search.xml 仍保留：Origin 界面（冻结的旧版）还在用它
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const { parse: parseFrontMatter } = require('hexo-front-matter');

function plain(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<a[^>]*data-footnote-backref[^>]*>[\s\S]*?<\/a>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t　]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function day(d) {
  return d && d.format ? d.format('YYYY-MM-DD') : '';
}

hexo.extend.generator.register('search_json', async function (locals) {
  const helpers = hexo.extend.helper.list();
  const ctx = { url_for: (p) => helpers.url_for.call(hexo, p) };
  const urlFor = ctx.url_for;
  const cardCover = (u) => helpers.card_cover.call(ctx, u);
  const theme = hexo.theme.config || {};
  const items = [];

  locals.posts.sort('-date').forEach((post) => {
    const cover = post.cover || theme.background || '';
    items.push({
      k: '文章',
      t: String(post.title || '').trim(),
      u: urlFor(post.path),
      d: day(post.date),
      g: post.tags ? post.tags.map((t) => t.name) : [],
      s: post.description || '',
      i: cover ? cardCover(cover).thumb : '',
      c: plain(post.content)
    });
  });

  locals.pages.forEach((page) => {
    if (page.layout === false || page.layout === 'false' || page.sitemap === false) return;
    if (page.layout === 'gizmo') return;           // Gizmo 陈列页本身没有正文，下面按小玩意逐个收录
    const title = String(page.title || '').trim();
    if (!title) return;
    items.push({ k: '页面', t: title, u: urlFor(page.path), d: '', g: [], s: '', i: '', c: plain(page.content) });
  });

  // CARRiER WAVE.：目录里已接收的篇目（隐藏篇目是彩蛋，不进搜索）
  const album = locals.data && locals.data.carrier_wave;
  if (album && !album.hidden && Array.isArray(album.tracks)) {   // hidden：入口暂时隐藏时也不进搜索
    const dir = path.join(hexo.source_dir, '_carrier_wave');
    for (const raw of album.tracks) {
      const file = path.join(dir, raw.slug + '.md');
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
      const fm = /^(-{3,}|;{3,})\r?\n/.test(src) ? parseFrontMatter(src) : { _content: src };
      if (fm.draft || !String(fm._content || '').trim()) continue;
      const html = await hexo.render.render({ text: fm._content || '', engine: 'markdown' });
      items.push({
        k: 'CARRiER WAVE.',
        t: raw.title + (raw.part ? ' ' + raw.part : ''),
        u: urlFor('/carrier_wave/' + raw.slug + '/'),
        d: '',
        g: [],
        s: fm.description || '',
        i: '',
        c: plain(html)
      });
    }
  }

  // Gizmo：陈列的小玩意（站内的链到独立页面，外链原样）
  (Array.isArray(locals.data && locals.data.gizmo) ? locals.data.gizmo : []).forEach((g) => {
    const link = String(g.link || '/gizmo/');
    items.push({
      k: 'Gizmo',
      t: String(g.name || ''),
      u: /^https?:\/\//.test(link) ? link : urlFor(link),
      d: g.date ? String(g.date instanceof Date ? g.date.toISOString().slice(0, 10) : g.date) : '',
      g: g.type ? [String(g.type)] : [],
      s: g.desc || '',
      i: '',
      c: String(g.desc || '')
    });
  });

  return { path: 'search.json', data: JSON.stringify(items) };
});
