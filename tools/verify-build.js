'use strict';

// 构建后只读检查；不启动服务器、不部署、不访问线上。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const yaml = require('js-yaml');
const base = path.resolve(__dirname, '..');
const publicDir = path.join(base, 'public');
const read = name => fs.readFileSync(path.join(publicDir, name), 'utf8');
const album = yaml.load(fs.readFileSync(path.join(base, 'source/_data/carrier_wave.yml'), 'utf8'));

const xml = new JSDOM(read('sitemap.xml'), { contentType: 'application/xml' });
const urls = [...xml.window.document.querySelectorAll('loc')].map(el => el.textContent);
assert.equal(new Set(urls).size, urls.length, 'sitemap loc must be unique');
assert.ok(urls.length > 0);
assert.ok(!urls.some(url => new URL(url).pathname === '/404.html'));
assert.ok(!urls.some(url => new URL(url).pathname.startsWith('/origin/')));
for (const track of album.hidden || []) {
  assert.ok(!urls.some(url => new URL(url).pathname === `/carrier_wave/${track.slug}/`));
}
assert.ok(urls.some(url => new URL(url).pathname === '/carrier_wave/'));
for (const url of urls) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const relative = pathname.replace(/^\//, '') + (pathname.endsWith('/') ? 'index.html' : '');
  assert.ok(fs.existsSync(path.join(publicDir, relative)), `missing sitemap output: ${pathname}`);
}
const txtUrls = read('sitemap.txt').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
assert.deepEqual([...new Set(txtUrls)].sort(), [...new Set(urls)].sort());
xml.window.close();

const redirects = read('_redirects').split(/\r?\n/).filter(line => line && !line.startsWith('#'));
assert.equal(redirects.length, 7);
for (const line of redirects) {
  const [from, to, status, extra] = line.split(/\s+/);
  assert.equal(extra, undefined);
  assert.equal(status, '301');
  assert.ok(!from.includes('*'));
  assert.ok(to.startsWith('/posts/'));
  assert.ok(fs.existsSync(path.join(publicDir, to.slice(1), 'index.html')));
}
assert.ok(!fs.existsSync(path.join(publicDir, 'origin/_redirects')));
assert.equal(read('robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://whatasiger.xyz/sitemap.xml\n');

const home = new JSDOM(read('index.html'));
const doc = home.window.document;
for (const selector of ['.toggle-btn', '.light-btn', '.settings-btn', '.search-btn']) {
  const control = doc.querySelector(selector);
  assert.ok(control, selector);
  assert.equal(control.tagName, 'BUTTON');
  assert.equal(control.type, 'button');
  assert.ok(control.getAttribute('aria-label'));
}
const search = doc.getElementById('local-search-input');
assert.ok(search.getAttribute('aria-label') || doc.querySelector('label[for="local-search-input"]'));
home.window.close();

const origin = new JSDOM(read('origin/posts/1/index.html'));
const originDoc = origin.window.document;
assert.ok(originDoc.querySelector('meta[name="robots"]').content.includes('noindex'));
assert.equal(new URL(originDoc.querySelector('link[rel="canonical"]').href).pathname, '/posts/1/');
origin.window.close();
console.log(`Build checks passed: ${urls.length} sitemap URLs, ${redirects.length} exact redirects, Glint controls and Origin canonical/noindex.`);
