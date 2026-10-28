'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ejs = require('ejs');
const root = path.join(__dirname, '..');
const source = p => fs.readFileSync(path.join(root, p), 'utf8');
const headerSource = source('themes/glint/layout/_partial/header.ejs');
const js = source('themes/glint/source/static/glint.js');
const kico = source('themes/glint/source/static/kico.js');
const tick = () => new Promise(resolve => setImmediate(resolve));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function header(article = false) {
  return ejs.render(headerSource, { is_post: () => article, is_page: () => false,
    is_home: () => !article, is_current: () => false, config: { title: 'Test' },
    theme: { menu: { Archive: '/archives/' } }, url_for: p => p || '/' });
}
function setup(t, { width = 390, content = '', article = false, saved, fromArticle = false, io = false } = {}) {
  const dom = new JSDOM('<!doctype html><body>' + header(article) + '<main class="wrap">' +
    (content ? '<article class="post-content">' + content + '</article>' : '') + '</main><div class="buttons"></div>',
    { url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.innerWidth = width;
  w.console.log = () => {};
  w.matchMedia = query => ({ matches: query.includes('max-width') ? width < 800 : query.includes('reduced-motion'), addEventListener() {}, addListener() {} });
  w.HTMLCanvasElement.prototype.getContext = () => ({ measureText: s => ({ width: s.length * 10 }) });
  w.HTMLElement.prototype.scrollIntoView = function () { this.scrolled = true; };
  if (io) w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  if (saved) w.localStorage.setItem('whatasiger_reader_settings', JSON.stringify(saved));
  if (fromArticle) w.sessionStorage.setItem('is_from_article', 'true');
  const requests = [];
  w.XMLHttpRequest = class {
    open() {} send() { requests.push(this); }
    respond(xml, status = 200) { this.status = status; this.responseXML = new w.DOMParser().parseFromString(xml, 'text/xml'); this.onload(); }
    fail() { this.onerror(); }
  };
  for (const script of w.document.querySelectorAll('script')) w.eval(script.textContent);
  w.eval(kico);
  w.eval(js);
  new w.Glint({});
  return { w, d: w.document, requests };
}
const xml = '<search><entry><title>最新中文</title><url>/new/</url><tags><tag>标签</tag></tags><content>正文关键字</content></entry><entry><title>旧查询</title><url>/old/</url><content>old</content></entry></search>';

test('TOC preserves IDs, encodes hrefs, avoids global collisions and safely scrolls punctuation IDs', async t => {
  const { w, d } = setup(t, { content: '<div id="title-2"></div><h2 id="中文 [a]:#%">章</h2><h3 id="child">子节</h3><h2>无ID</h2><div class="footnotes"><h2 id="fn">脚注</h2></div>' });
  const links = d.querySelectorAll('.article-list-body a');
  assert.equal(links.length, 3);
  assert.equal(links[0].getAttribute('href'), '#' + encodeURIComponent('中文 [a]:#%'));
  assert.equal(d.querySelectorAll('h2')[0].id, '中文 [a]:#%');
  assert.equal(d.querySelectorAll('h2')[1].id, 'title-2-1');
  links[0].click();
  assert.equal(d.getElementById('中文 [a]:#%').scrolled, true);
  assert.equal(d.getElementById('fn').id, 'fn');
  const mini = d.querySelector('.toc-mini');
  mini.click(); await tick();
  links[0].focus();
  links[0].dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await tick();
  assert.equal(d.querySelector('.article-list').hasAttribute('inert'), true);
  assert.equal(d.activeElement, mini);
});

test('header native controls, labels, inert isolation, Esc return and responsive navigation', async t => {
  const { w, d } = setup(t);
  for (const button of d.querySelectorAll('.head-action > *')) {
    assert.equal(button.tagName, 'BUTTON'); assert.equal(button.type, 'button'); assert.ok(button.getAttribute('aria-label'));
  }
  assert.equal(d.getElementById('local-search-input').labels.length, 1);
  const panel = d.getElementById('reader-settings-panel'), trigger = d.querySelector('.settings-btn');
  assert.ok(panel.hasAttribute('inert'));
  trigger.click(); assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  d.getElementById('setting-immersive').focus();
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, trigger); assert.ok(panel.hasAttribute('inert'));
  const menu = d.querySelector('.head-menu'), toggle = d.querySelector('.toggle-btn');
  assert.ok(menu.hasAttribute('inert'));
  toggle.click(); assert.equal(menu.hasAttribute('inert'), false);
  menu.querySelector('a').focus();
  d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, toggle); assert.ok(menu.hasAttribute('inert'));
  d.documentElement.classList.remove('nav-collapsed'); await tick();
  assert.equal(menu.hasAttribute('inert'), false);
  d.documentElement.classList.add('nav-collapsed'); await tick();
  assert.equal(menu.hasAttribute('inert'), true);
});

test('Escape does not dismiss desktop navigation/search after their mobile active state survives resize', async t => {
  const { w, d } = setup(t);
  const menu = d.querySelector('.head-menu'), search = d.querySelector('.head-search');
  d.querySelector('.toggle-btn').click();
  d.querySelector('.search-btn').click();
  w.innerWidth = 1024;
  w.dispatchEvent(new w.Event('resize'));
  d.documentElement.classList.remove('nav-collapsed');
  // 模拟断点间保留的 active（不依赖 header 测宽是否恰好清掉它）。
  menu.classList.add('active');
  await tick();
  const link = menu.querySelector('a'); link.focus();
  link.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, link);
  assert.equal(menu.classList.contains('active'), true);
  const input = d.getElementById('local-search-input'); input.focus();
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, input);
  assert.equal(search.classList.contains('active'), true);
  assert.equal(search.hasAttribute('inert'), false);
});

test('Escape in desktop TOC dismisses that TOC, not unrelated settings; desktop search only dismisses results', async t => {
  const { w, d } = setup(t, { width: 1024, content: '<h2 id="one">One</h2>' });
  const settings = d.getElementById('reader-settings-panel');
  d.querySelector('.settings-btn').click();
  const link = d.querySelector('.article-list a'); link.focus();
  link.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await tick();
  assert.equal(settings.classList.contains('open'), true);
  assert.equal(d.querySelector('.article-list').hasAttribute('inert'), true);
  assert.equal(d.activeElement, d.querySelector('.toc-mini'));
  d.querySelector('.toc-mini').click(); await tick();
  // 让设置成为 on-top，再聚焦目录触发器，仍只收起目录。
  settings.classList.add('on-top');
  const mini = d.querySelector('.toc-mini'); mini.focus();
  mini.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await tick();
  assert.equal(settings.classList.contains('open'), true);
  assert.equal(d.querySelector('.article-list').hasAttribute('inert'), true);
  const input = d.getElementById('local-search-input'); input.focus();
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(settings.classList.contains('open'), true);
  assert.equal(d.activeElement, input);
});

test('search loads once on demand and searches current value when asynchronous index resolves', async t => {
  const { w, d, requests } = setup(t, { width: 1024 });
  const input = d.getElementById('local-search-input'), result = d.getElementById('local-search-result');
  assert.equal(requests.length, 0);
  input.focus(); assert.equal(requests.length, 1);
  input.value = '旧'; input.dispatchEvent(new w.Event('input'));
  input.value = '最新'; input.dispatchEvent(new w.Event('input'));
  await wait(90); assert.equal(requests.length, 1);
  requests[0].respond(xml); await tick();
  assert.match(result.textContent, /最新中文/); assert.doesNotMatch(result.textContent, /旧查询/);
  input.focus(); assert.equal(requests.length, 1);
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(result.style.display, 'none');
});

test('search failures retry, IME does not search mid-composition, focusout/Esc prevents stale reopening', async t => {
  const { w, d, requests } = setup(t);
  const input = d.getElementById('local-search-input'), result = d.getElementById('local-search-result');
  d.querySelector('.search-btn').click();
  input.value = '最新'; input.dispatchEvent(new w.Event('input'));
  requests[0].fail(); await tick();
  assert.match(result.textContent, /失败/);
  result.querySelector('button').click(); assert.equal(requests.length, 2);
  input.dispatchEvent(new w.CompositionEvent('compositionstart'));
  requests[1].respond(xml); await tick();
  assert.doesNotMatch(result.textContent, /最新中文/);
  input.dispatchEvent(new w.CompositionEvent('compositionend')); await tick();
  assert.match(result.textContent, /最新中文/);
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await tick();
  assert.equal(d.activeElement, d.querySelector('.search-btn'));
  assert.equal(result.style.display, 'none');
  d.querySelector('.search-btn').click(); input.value = '最新';
  d.querySelector('.light-btn').focus(); await tick();
  assert.equal(result.style.display, 'none');
});

test('pending search never reopens on Escape or focusout', async t => {
  const { w, d, requests } = setup(t, { width: 1024 });
  const input = d.getElementById('local-search-input'), result = d.getElementById('local-search-result');
  input.value = '最新'; input.focus();
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  requests[0].respond(xml); await tick();
  assert.equal(result.style.display, 'none');
  input.blur(); input.focus(); d.querySelector('.light-btn').focus(); await tick();
  assert.equal(result.style.display, 'none');
});

test('article-to-home navigation preserves all stored preferences and uses default opacity 55', t => {
  const saved = { bgOpacity: 82, accent: 'mint', bgBlur: 12, custom: 'keep' };
  const { w, d } = setup(t, { saved, fromArticle: true });
  assert.deepEqual(JSON.parse(w.localStorage.getItem('whatasiger_reader_settings')), saved);
  assert.equal(d.body.style.getPropertyValue('--bg-opacity'), '0.82');
  const other = setup(t, { fromArticle: true });
  assert.equal(other.d.body.style.getPropertyValue('--bg-opacity'), '0.55');
});

test('without IntersectionObserver real image src is retained or restored', t => {
  const { d } = setup(t, { content: '<img id="real" src="/real.webp"><img id="restore" src="blank.gif" ks-original="/restore.webp"><div class="is-special"></div>' });
  assert.equal(d.getElementById('real').getAttribute('src'), '/real.webp');
  assert.equal(d.getElementById('restore').getAttribute('src'), '/restore.webp');
});

test('social keyboard focus cancels pending hide timer', async t => {
  const html = ejs.render(source('themes/glint/layout/_partial/social.ejs'), { theme: { social: [
    { title: 'One', link: '/one', icon: 'x' }, { title: 'Two', link: '/two', icon: 'x' }
  ] } });
  const dom = new JSDOM(html, { url: 'https://example.test', runScripts: 'dangerously' });
  t.after(() => dom.window.close());
  const { document: d } = dom.window, dock = d.querySelector('.home-social'), links = dock.querySelectorAll('a');
  links[0].focus(); links[1].focus(); await wait(150);
  assert.equal(dock.classList.contains('is-pointing'), true);
  assert.equal(d.querySelector('.home-social-tip').textContent, 'Two');
  // 键盘聚焦只留强调框；指针移上去再恢复名称标签
  assert.equal(dock.classList.contains('tip-off'), true);
  links[0].dispatchEvent(new dom.window.Event('pointerenter'));
  assert.equal(dock.classList.contains('tip-off'), false);
});

test('touch background layer height stays locked while only the viewport height changes', t => {
  const dom = new JSDOM('<!doctype html><body>' + header() + '</body>',
    { url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const w = dom.window;
  Object.defineProperty(w, 'innerWidth', { value: 390, configurable: true, writable: true });
  Object.defineProperty(w, 'innerHeight', { value: 700, configurable: true, writable: true });
  Object.defineProperty(w, 'screen', { value: { width: 390, height: 844 }, configurable: true });
  w.matchMedia = query => ({ matches: query.includes('pointer: coarse'), addEventListener() {}, addListener() {} });
  w.CSS = { supports: () => true };
  w.eval(w.document.querySelector('script').textContent);
  const lock = () => w.document.documentElement.style.getPropertyValue('--bg-lock-h');
  assert.equal(lock(), '844px');
  for (const h of [760, 640, 900]) {
    w.innerHeight = h;
    w.dispatchEvent(new w.Event('resize'));
  }
  assert.equal(lock(), '900px', 'only grows within the same width');
  w.innerWidth = 844; w.innerHeight = 390;
  w.dispatchEvent(new w.Event('resize'));
  assert.equal(lock(), '390px', 'rotation recomputes from the landscape screen side');
});
