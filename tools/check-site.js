/* ----
# 站点检查（CI 与本地都可用）：先 npm run build，再 node tools/check-site.js [public]
#   1. 站内链接：public/ 下各页（Origin 除外）href / src 指向的站内文件都要存在 —— 有缺失即失败（退出码 1）
#   2. 页面体积：单页 HTML 超过 HTML_BUDGET 给出提醒（长篇小说本身就大，只提醒不失败）
#   3. 图片格式：public/images 下除 ALLOW_RASTER 以外都应是 webp —— 只提醒
#   4. 一叶关卡：node tools/yiye-solve.js 每关都要能解（求解器输出「抵达 ×」即失败）；--skip-yiye 跳过
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith('--')) || 'public');
const HTML_BUDGET = 260 * 1024;
const ALLOW_RASTER = ['images/wechat-qrcode.jpg'];

if (!fs.existsSync(root)) {
  console.error('找不到 ' + root + '：先运行 npm run build');
  process.exit(1);
}

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(root, []);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');

// 站内地址 → 文件：/a/ → a/index.html；/a → a 或 a/index.html 或 a.html
function exists(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch (e) { p = urlPath; }
  p = p.replace(/^\/+/, '');
  const cands = p === '' || p.endsWith('/') ? [p + 'index.html'] : [p, p + '/index.html', p + '.html'];
  return cands.some((c) => fs.existsSync(path.join(root, c)) && fs.statSync(path.join(root, c)).isFile());
}

const broken = [];
const big = [];
let pages = 0;
for (const f of files) {
  const r = rel(f);
  if (!r.endsWith('.html') || r.startsWith('origin/')) continue;
  pages++;
  const html = fs.readFileSync(f, 'utf8');
  if (Buffer.byteLength(html) > HTML_BUDGET) big.push(r + '（' + Math.round(Buffer.byteLength(html) / 1024) + ' KB）');
  // 去掉脚本与样式里的内容，免得把 JS 字符串当链接
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => (/\bsrc=/.test(m.slice(0, m.indexOf('>'))) ? m.slice(0, m.indexOf('>') + 1) : ''))
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const re = /\s(?:href|src)=["']([^"'#?]*)(?:[?#][^"']*)?["']/gi;
  let m;
  while ((m = re.exec(body))) {
    const u = m[1];
    if (!u || !u.startsWith('/') || u.startsWith('//')) continue;
    if (!exists(u)) broken.push(r + ' → ' + u);
  }
}

const rasters = files.map(rel).filter((r) => r.startsWith('images/') && /\.(png|jpe?g|gif|bmp)$/i.test(r) && ALLOW_RASTER.indexOf(r) === -1);

console.log('[check] 检查了 ' + pages + ' 个页面');
if (big.length) console.log('[check] 提醒：以下页面超过 ' + Math.round(HTML_BUDGET / 1024) + ' KB\n  ' + big.join('\n  '));
if (rasters.length) console.log('[check] 提醒：以下图片不是 webp（可用 tools/img2webp 转换）\n  ' + rasters.join('\n  '));

let failed = false;
if (broken.length) {
  failed = true;
  const uniq = Array.from(new Set(broken));
  console.error('[check] 站内链接缺失 ' + uniq.length + ' 处：\n  ' + uniq.slice(0, 80).join('\n  ') + (uniq.length > 80 ? '\n  …' : ''));
} else {
  console.log('[check] 站内链接全部有效');
}

if (args.indexOf('--skip-yiye') === -1) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'yiye-solve.js')], { encoding: 'utf8', timeout: 15 * 60 * 1000 });
    const bad = out.split('\n').filter((l) => /抵达 ×/.test(l));
    if (bad.length) { failed = true; console.error('[check] 一叶有关卡无解：\n  ' + bad.join('\n  ')); }
    else console.log('[check] 一叶关卡全部可解（' + out.trim().split('\n').length + ' 关）');
  } catch (e) {
    failed = true;
    console.error('[check] 一叶求解器运行失败：' + e.message);
  }
}

process.exit(failed ? 1 : 0);
