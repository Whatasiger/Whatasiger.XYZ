'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const { JSDOM } = require('jsdom');
const frontMatter = require('hexo-front-matter');
const root = path.resolve(__dirname, '..');

function loadHook(file) {
  let callback;
  const code = fs.readFileSync(path.join(root, 'scripts', file), 'utf8');
  vm.runInNewContext(code, {
    require, Buffer,
    hexo: { extend: { filter: { register(name, fn) {
      assert.equal(name, 'after_generate');
      callback = fn;
    } } } }
  });
  return callback;
}

const destinations = [1, 2, 3, 5, 6, 7, 8].map(n => `posts/${n}/index.html`);
test('legacy redirects have exactly seven encoded, unique, three-field rules', () => {
  let result;
  loadHook('redirects.js').call({
    config: { root: '/' },
    route: { list: () => destinations, set(name, data) {
      assert.equal(name, '_redirects'); result = data;
    } }
  });
  const rules = result.trim().split('\n').filter(line => !line.startsWith('#'));
  assert.equal(rules.length, 7);
  const sources = new Set();
  for (const rule of rules) {
    const fields = rule.split(/\s+/);
    assert.equal(fields.length, 3);
    const [from, to, code] = fields;
    assert.equal(code, '301');
    assert.match(from, /^\/[\x21-\x7e]+\/$/);
    assert.match(to, /^\/posts\/\d+\/$/);
    assert.equal(sources.has(from), false);
    sources.add(from);
    assert.ok(destinations.includes(to.slice(1) + 'index.html'));
  }
  assert.ok(rules.some(line => line.includes('%20')));
  assert.ok(!result.includes('hello-world'));
  assert.ok(!result.includes('*'));
});

test('legacy redirects are root-only and reject absent destinations', () => {
  const hook = loadHook('redirects.js');
  hook.call({ config: { root: '/origin/' }, route: {
    list() { throw new Error('must not inspect Origin routes'); },
    set() { throw new Error('must not write Origin redirects'); }
  } });
  assert.throws(() => hook.call({ config: { root: '/' }, route: {
    list: () => [], set() {}
  } }), /destination was not generated/);
});

test('404 front matter opts out using the real sitemap generator', () => {
  const page = frontMatter.parse(fs.readFileSync(path.join(root, 'source/404.html'), 'utf8'));
  assert.equal(page.sitemap, false);
  const generate = require('hexo-generator-sitemap/lib/generator');
  const empty = { toArray: () => [] };
  assert.equal(generate.call({ config: { sitemap: { path: ['sitemap.xml'], tags: false, categories: false } } }, {
    posts: empty, pages: { toArray: () => [page] }, tags: empty, categories: empty
  }), undefined);
});

test('CW sitemap retains valid XML entities and excludes hidden routes', async () => {
  const routes = [
    'carrier_wave/index.html', 'carrier_wave/published/index.html',
    'carrier_wave/hidden/index.html', 'posts/1/index.html'
  ];
  const data = new Map([
    ['sitemap.xml', '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'],
    ['sitemap.txt', '']
  ]);
  await loadHook('carrier-wave-sitemap.js').call({
    config: { url: 'https://example.test', root: '/', sitemap: { path: [...data.keys()] } },
    locals: { get: () => ({ carrier_wave: { hidden: [{ slug: 'hidden' }] } }) },
    route: {
      list: () => routes,
      get: name => Readable.from([data.get(name)]),
      set: (name, content) => data.set(name, content)
    }
  });
  const xml = new JSDOM(data.get('sitemap.xml'), { contentType: 'application/xml' });
  const urls = [...xml.window.document.querySelectorAll('loc')].map(el => el.textContent);
  assert.deepEqual(urls, ['https://example.test/carrier_wave/', 'https://example.test/carrier_wave/published/']);
  assert.ok(!data.get('sitemap.txt').includes('/hidden/'));
  xml.window.close();
});
