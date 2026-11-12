'use strict';

// 首页「TO DO」侧边栏数据：构建时抓取网易云周榜 + Bangumi 在看/在玩
// 网易云接口不支持 CORS，只能在这里抓；Bangumi 在浏览器端还会实时刷新，这里的数据作为兜底
// 抓取逻辑在 tools/todo-fetch.js（CI 每天单独刷新周榜的 tools/todo-refresh.js 也用它）
// 周榜另生成 /todo.json：CI 每天只替换线上这一个文件，首页脚本读到更新的就换上（不必整站重建部署）

var fs = require('fs');
var path = require('path');
var todoFetch = require('../tools/todo-fetch');
var fetchNeteaseWeek = todoFetch.fetchNeteaseWeek;
var fetchBangumiDoing = todoFetch.fetchBangumiDoing;

var TODO_CACHE_PATH = path.join('source', '_data', 'todo-cache.json');

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

// /todo.json：与 CI 每天写到线上的是同一格式；本地部署时用构建当时的数据（首页脚本取两者中较新的一份）
// Origin 构建（tools/build-origin.js）删掉了这个生成器
hexo.extend.generator.register('todo_json', function () {
  var cache = loadCache(path.join(hexo.base_dir, TODO_CACHE_PATH), hexo.log);
  if (!cache.netease || !Array.isArray(cache.netease.songs)) return [];
  return { path: 'todo.json', data: todoFetch.todoJson(cache.netease) };
});
