/* ----
# 压缩生成后的样式 / 脚本（npm run build 的最后一步）
# 只处理 public/ 下各 static/ 目录里的 .css / .js（Glint、Origin、CARRiER WAVE. 的主题资源），源码里的中文注释照常保留
# 文件开头的说明注释（含 Hingle 等署名）原样留在压缩结果最前面
# hexo server 预览的是未压缩的源码；asset_url 的 ?v= 哈希按源码算，源码一改地址即变
# 用法：node tools/minify.js [目录，缺省 public]
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(process.argv[2] || 'public');

function walk(dir, inStatic, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, inStatic || ent.name === 'static', out);
    else if (inStatic && /\.(css|js)$/.test(ent.name) && !/\.min\.(css|js)$/.test(ent.name)) out.push(p);
  }
  return out;
}

// 文件开头的块注释（署名 / 说明），压缩后放回最前面
function leadingComment(code) {
  const m = code.match(/^\uFEFF?\s*(?:@charset\s+"[^"]*";\s*)?(\/\*[\s\S]*?\*\/)/);
  return m && /By|Hingle|Glint|License|作者|Copyright|©/i.test(m[1]) ? m[1] + '\n' : '';
}

if (!fs.existsSync(root)) {
  console.error('找不到目录：' + root);
  process.exit(1);
}

let before = 0, after = 0, count = 0;
for (const file of walk(root, false, [])) {
  const code = fs.readFileSync(file, 'utf8');
  const loader = file.endsWith('.css') ? 'css' : 'js';
  let result;
  try {
    result = esbuild.transformSync(code, { loader, minify: true, legalComments: 'none', charset: 'utf8' });
  } catch (e) {
    // 压缩失败让构建失败：否则有语法错误的文件会照常部署，CI 也照样通过
    console.error('压缩失败：' + path.relative(root, file) + '\n' + e.message);
    process.exit(1);
  }
  // @charset 必须是样式表的第一句，署名注释放在它后面
  const head = leadingComment(code);
  const cs = result.code.match(/^@charset "[^"]*";/);
  const min = cs ? cs[0] + '\n' + head + result.code.slice(cs[0].length) : head + result.code;
  if (min.length >= code.length) continue;
  fs.writeFileSync(file, min);
  before += Buffer.byteLength(code);
  after += Buffer.byteLength(min);
  count++;
}
console.log('[minify] ' + count + ' 个文件：' + Math.round(before / 1024) + ' KB → ' + Math.round(after / 1024) + ' KB');
