/* ----
# 单独刷新首页的网易云周榜：node tools/todo-refresh.js <todo.json 路径>
# 供 .github/workflows/todo.yml 每天运行：抓周榜写进线上站点仓库的 todo.json，不重建、不动其他文件
#   - 网易云 ID 取自 themes/glint/_config.yml 的 todo.netease_uid
#   - 榜单与文件里的一样就不写（fetchedAt 不变，避免每天一个空提交）；变了才写入并更新 fetchedAt
#   - 抓取失败退出码 1，不改文件（线上继续显示旧榜）
---- */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { fetchNeteaseWeek, todoJson } = require('./todo-fetch');

const out = process.argv[2];
if (!out) {
  console.error('用法：node tools/todo-refresh.js <todo.json 路径>');
  process.exit(2);
}

const theme = yaml.load(fs.readFileSync(path.join(__dirname, '..', 'themes', 'glint', '_config.yml'), 'utf8')) || {};
const uid = theme.todo && theme.todo.netease_uid;
if (!uid || theme.todo.enable === false) {
  console.log('主题配置里没有启用网易云周榜，跳过');
  process.exit(0);
}

let old = null;
try { old = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) { /* 没有或损坏：直接写新的 */ }

fetchNeteaseWeek(String(uid)).then((songs) => {
  const oldSongs = old && old.netease && old.netease.songs;
  if (oldSongs && JSON.stringify(oldSongs) === JSON.stringify(songs)) {
    console.log('周榜没有变化（' + songs.length + ' 首），不改文件');
    return;
  }
  fs.writeFileSync(out, todoJson({ songs, fetchedAt: new Date().toISOString() }), 'utf8');
  console.log('周榜已更新：' + songs.map((s, i) => (i + 1) + '. ' + s.name).join('  '));
}, (err) => {
  console.error('抓取网易云周榜失败：' + err.message);
  process.exit(1);
});
