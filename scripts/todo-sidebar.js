'use strict';

// 首页「TO DO」侧边栏数据：构建时抓取网易云周榜 + Bangumi 在看/在玩
// 网易云接口不支持 CORS，只能在这里抓；Bangumi 在浏览器端还会实时刷新，这里的数据作为兜底

var fs = require('fs');
var path = require('path');
var https = require('https');

var TODO_CACHE_PATH = path.join('source', '_data', 'todo-cache.json');

var USER_AGENT = 'whatasiger-blog/1.0 (https://github.com/Whatasiger)';
var REQUEST_TIMEOUT_MS = 8000;
var MAX_BODY_BYTES = 2 * 1024 * 1024;
var SONG_LIMIT = 10;
var BGM_LIMIT = 30;
var BGM_SUBJECT_TYPES = [2, 4]; // 2 动画 / 4 游戏

var lastFetchPromise = null;

function ensureDir(filePath) {
  var dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCache(filePath, logger) {
  if (!fs.existsSync(filePath)) return {};
  try {
    var text = fs.readFileSync(filePath, 'utf8');
    if (!text.trim()) return {};
    var parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    logger.warn('[todo] Invalid todo-cache.json, cache ignored: ' + err.message);
    return {};
  }
}

function saveCache(filePath, cache) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

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

async function refreshTodoCache(hexoCtx) {
  var cfg = (hexoCtx.theme.config && hexoCtx.theme.config.todo) || {};
  if (cfg.enable === false) return;

  var logger = hexoCtx.log;
  var cachePath = path.join(hexoCtx.base_dir, TODO_CACHE_PATH);
  var cache = loadCache(cachePath, logger);
  var changed = false;

  var tasks = [];
  if (cfg.netease_uid) {
    tasks.push(fetchNeteaseWeek(String(cfg.netease_uid)).then(function (songs) {
      cache.netease = { songs: songs, fetchedAt: new Date().toISOString() };
      changed = true;
    }, function (err) {
      logger.warn('[todo] NetEase fetch failed, keeping old cache: ' + err.message);
    }));
  }
  if (cfg.bangumi_user) {
    tasks.push(fetchBangumiDoing(String(cfg.bangumi_user)).then(function (items) {
      cache.bangumi = { items: items, fetchedAt: new Date().toISOString() };
      changed = true;
    }, function (err) {
      logger.warn('[todo] Bangumi fetch failed, keeping old cache: ' + err.message);
    }));
  }

  await Promise.all(tasks);
  if (changed) {
    saveCache(cachePath, cache);
    logger.info('[todo] Cache updated: ' + ((cache.netease && cache.netease.songs.length) || 0) +
      ' songs, ' + ((cache.bangumi && cache.bangumi.items.length) || 0) + ' bangumi items');
  }
}

function ensureRefresh(hexoCtx) {
  if (!lastFetchPromise) {
    lastFetchPromise = refreshTodoCache(hexoCtx).catch(function (err) {
      hexoCtx.log.warn('[todo] Refresh failed: ' + err.message);
    });
  }
  return lastFetchPromise;
}

hexo.extend.filter.register('before_generate', function () {
  return ensureRefresh(hexo);
});

hexo.extend.helper.register('get_todo_data', function () {
  var cache = loadCache(path.join(hexo.base_dir, TODO_CACHE_PATH), hexo.log);
  return {
    songs: (cache.netease && cache.netease.songs) || [],
    songsFetchedAt: (cache.netease && cache.netease.fetchedAt) || '',
    bangumi: (cache.bangumi && cache.bangumi.items) || []
  };
});
