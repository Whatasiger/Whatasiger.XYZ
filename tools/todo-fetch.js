/* ----
# 首页 TO DO 的数据抓取（网易云周榜 + Bangumi 在看 / 在玩）
# 两处共用：scripts/todo-sidebar.js（hexo generate 时）与 tools/todo-refresh.js（CI 每天单独刷新周榜）
# 只用 Node 内置模块，不依赖 hexo
---- */

'use strict';

var https = require('https');

var USER_AGENT = 'whatasiger-blog/1.0 (https://github.com/Whatasiger)';
var REQUEST_TIMEOUT_MS = 8000;
var MAX_BODY_BYTES = 2 * 1024 * 1024;
var SONG_LIMIT = 10;
var BGM_LIMIT = 30;
var BGM_SUBJECT_TYPES = [2, 4]; // 2 动画 / 4 游戏

function fetchJson(targetUrl, headers) {
  return new Promise(function (resolve, reject) {
    var req = https.get(targetUrl, {
      headers: Object.assign({ 'User-Agent': USER_AGENT, 'Accept': 'application/json' }, headers || {})
    }, function (res) {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode + ' for ' + targetUrl));
        return;
      }
      var chunks = [];
      var size = 0;
      res.on('data', function (chunk) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          req.destroy(new Error('Response too large: ' + targetUrl));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', function () {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (err) {
          reject(new Error('Invalid JSON from ' + targetUrl + ': ' + err.message));
        }
      });
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, function () {
      req.destroy(new Error('Timeout: ' + targetUrl));
    });
    req.on('error', reject);
  });
}

function toHttps(url) {
  return typeof url === 'string' ? url.replace(/^http:\/\//i, 'https://') : '';
}

async function fetchNeteaseWeek(uid) {
  var url = 'https://music.163.com/api/v1/play/record?uid=' + encodeURIComponent(uid) + '&type=1';
  var json = await fetchJson(url, { 'Referer': 'https://music.163.com/', 'User-Agent': 'Mozilla/5.0' });
  if (!json || json.code !== 200 || !Array.isArray(json.weekData)) {
    throw new Error('Unexpected NetEase response (code ' + (json && json.code) + ')');
  }
  return json.weekData.slice(0, SONG_LIMIT).map(function (item) {
    var song = item.song || {};
    var album = song.al || {};
    return {
      id: song.id,
      name: song.name || '',
      artists: (song.ar || []).map(function (a) { return a.name; }).filter(Boolean).join(' / '),
      cover: album.picUrl ? toHttps(album.picUrl) + '?param=80y80' : '',
      url: 'https://music.163.com/#/song?id=' + song.id
    };
  });
}

function simplifyBangumi(c) {
  var subject = c.subject || {};
  var images = subject.images || {};
  return {
    id: c.subject_id,
    name: subject.name_cn || subject.name || '',
    type: c.subject_type,
    cover: images.small || images.grid || '',
    epStatus: c.ep_status || 0,
    eps: subject.eps || 0,
    updatedAt: c.updated_at || '',
    url: 'https://bgm.tv/subject/' + c.subject_id
  };
}

async function fetchBangumiDoing(user) {
  var lists = await Promise.all(BGM_SUBJECT_TYPES.map(function (subjectType) {
    var url = 'https://api.bgm.tv/v0/users/' + encodeURIComponent(user) +
      '/collections?type=3&subject_type=' + subjectType + '&limit=' + BGM_LIMIT;
    return fetchJson(url).then(function (json) {
      return (json && Array.isArray(json.data)) ? json.data : [];
    });
  }));
  var all = [].concat.apply([], lists).map(simplifyBangumi);
  all.sort(function (a, b) { return Date.parse(b.updatedAt) - Date.parse(a.updatedAt); });
  return all;
}

// 线上 /todo.json 的内容：只有周榜（Bangumi 浏览器端会实时拉取，不需要）
function todoJson(netease) {
  return JSON.stringify({ netease: { songs: netease.songs, fetchedAt: netease.fetchedAt } }) + '\n';
}

module.exports = {
  fetchNeteaseWeek: fetchNeteaseWeek,
  fetchBangumiDoing: fetchBangumiDoing,
  todoJson: todoJson
};
