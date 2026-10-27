'use strict';

var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var URL = require('url').URL;
var yaml = require('js-yaml');

var FRIENDS_DATA_PATH = path.join('source', '_data', 'friends.yml');
var FRIENDS_CACHE_PATH = path.join('source', '_data', 'friends-cache.json');

var DEFAULT_AVATAR = '/static/img/icon.png';
var DEFAULT_DESCRIPTION = '这个朋友还没有简介。';
var USER_AGENT = 'Mozilla/5.0 (compatible; Hexo-Friend-Bot/1.0; +https://hexo.io/)';
var REQUEST_TIMEOUT_MS = 8000;
var MAX_REDIRECTS = 5;
var MAX_HTML_BYTES = 512 * 1024;
var CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

var lastFetchPromise = null;

function ensureDir(filePath) {
  var dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pickFirstString() {
  for (var i = 0; i < arguments.length; i++) {
    var value = arguments[i];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  var value = rawUrl.trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    value = 'https://' + value;
  }
  try {
    return new URL(value).toString();
  } catch (err) {
    return '';
  }
}

function fallbackNameFromUrl(friendUrl) {
  try {
    return new URL(friendUrl).hostname.replace(/^www\./i, '');
  } catch (err) {
    return friendUrl;
  }
}

function parseFriendsList(filePath, logger) {
  if (!fs.existsSync(filePath)) {
    logger.warn('[friends] Data file not found: ' + filePath);
    return [];
  }

  var content = fs.readFileSync(filePath, 'utf8');
  if (!content.trim()) return [];

  var parsed;
  try {
    parsed = yaml.load(content);
  } catch (err) {
    logger.warn('[friends] Invalid YAML in friends.yml: ' + err.message);
    return [];
  }

  var list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && Array.isArray(parsed.friends)) {
    list = parsed.friends;
  } else {
    logger.warn('[friends] friends.yml should be an array.');
    return [];
  }

  var normalized = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (typeof item === 'string') {
      normalized.push({ url: item });
      continue;
    }
    if (item && typeof item === 'object') {
      normalized.push({
        url: item.url,
        name: item.name,
        description: item.description,
        avatar: item.avatar
      });
    }
  }
  return normalized;
}

function loadCache(filePath, logger) {
  if (!fs.existsSync(filePath)) return {};
  try {
    var text = fs.readFileSync(filePath, 'utf8');
    if (!text.trim()) return {};
    var parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    logger.warn('[friends] Invalid friends-cache.json, cache ignored: ' + err.message);
    return {};
  }
}

function saveCache(filePath, cache) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

function isCacheFresh(entry) {
  if (!entry || !entry.fetchedAt) return false;
  var ts = Date.parse(entry.fetchedAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < CACHE_TTL_MS;
}

function decodeEntities(text) {
  if (!text) return '';
  return String(text)
    .replace(/&#(\d+);/g, function (_, num) {
      var code = parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripTags(text) {
  return decodeEntities(String(text || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTagAttr(tag, attrName) {
  var re = new RegExp(attrName + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>"\']+))', 'i');
  var match = tag.match(re);
  return match ? (match[2] || match[3] || match[4] || '') : '';
}

function extractMetaContent(html, key) {
  var safeKey = escapeRegExp(key);
  var patternA = new RegExp('<meta[^>]+(?:property|name)\\s*=\\s*["\']' + safeKey + '["\'][^>]*content\\s*=\\s*["\']([^"\']+)["\'][^>]*>', 'i');
  var patternB = new RegExp('<meta[^>]+content\\s*=\\s*["\']([^"\']+)["\'][^>]*(?:property|name)\\s*=\\s*["\']' + safeKey + '["\'][^>]*>', 'i');

  var match = html.match(patternA) || html.match(patternB);
  return match ? stripTags(match[1]) : '';
}

function extractTitle(html) {
  var metaTitle = pickFirstString(
    extractMetaContent(html, 'og:title'),
    extractMetaContent(html, 'twitter:title')
  );
  if (metaTitle) return metaTitle;

  var match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : '';
}

function extractDescription(html) {
  return pickFirstString(
    extractMetaContent(html, 'og:description'),
    extractMetaContent(html, 'twitter:description'),
    extractMetaContent(html, 'description')
  );
}

function extractIconHref(html) {
  var linkTagRe = /<link\s+[^>]*>/gi;
  var match;
  while ((match = linkTagRe.exec(html)) !== null) {
    var tag = match[0];
    var rel = getTagAttr(tag, 'rel').toLowerCase();
    if (!rel) continue;
    if (rel.indexOf('icon') === -1) continue;
    var href = getTagAttr(tag, 'href');
    if (href) return href;
  }
  return '';
}

function toAbsoluteUrl(baseUrl, maybeRelativeUrl) {
  if (!maybeRelativeUrl) return '';
  try {
    return new URL(maybeRelativeUrl, baseUrl).toString();
  } catch (err) {
    return '';
  }
}

function extractAvatar(html, pageUrl) {
  var avatar = pickFirstString(
    extractMetaContent(html, 'og:image'),
    extractMetaContent(html, 'twitter:image'),
    extractIconHref(html)
  );
  return toAbsoluteUrl(pageUrl, avatar);
}

function fetchHtmlPage(targetUrl, redirectCount) {
  return new Promise(function (resolve, reject) {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error('Too many redirects'));
      return;
    }

    var parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (err) {
      reject(err);
      return;
    }

    var client = parsedUrl.protocol === 'http:' ? http : https;
    var req = client.request(parsedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml'
      }
    }, function (res) {
      var statusCode = res.statusCode || 0;
      var location = res.headers.location;

      if (statusCode >= 300 && statusCode < 400 && location) {
        var redirectUrl = toAbsoluteUrl(targetUrl, location);
        res.resume();
        fetchHtmlPage(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (statusCode >= 400) {
        res.resume();
        reject(new Error('HTTP ' + statusCode));
        return;
      }

      var contentType = String(res.headers['content-type'] || '').toLowerCase();
      if (contentType && contentType.indexOf('text/html') === -1 && contentType.indexOf('application/xhtml+xml') === -1) {
        res.resume();
        reject(new Error('Unsupported content-type: ' + contentType));
        return;
      }

      var totalBytes = 0;
      var chunks = [];

      res.on('data', function (chunk) {
        totalBytes += chunk.length;
        if (totalBytes > MAX_HTML_BYTES) {
          req.destroy(new Error('Response too large'));
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', function () {
        var html = Buffer.concat(chunks).toString('utf8');
        resolve({ html: html, finalUrl: targetUrl });
      });
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, function () {
      req.destroy(new Error('Request timeout'));
    });

    req.on('error', function (err) {
      reject(err);
    });

    req.end();
  });
}

async function fetchFriendMeta(targetUrl) {
  var page = await fetchHtmlPage(targetUrl, 0);
  var title = extractTitle(page.html);
  var description = extractDescription(page.html);
  var avatar = extractAvatar(page.html, page.finalUrl);

  return {
    sourceUrl: page.finalUrl,
    name: title || '',
    description: description || '',
    avatar: avatar || '',
    fetchedAt: new Date().toISOString()
  };
}

function resolveFriendsSync(hexoCtx) {
  var baseDir = hexoCtx.base_dir;
  var logger = hexoCtx.log;
  var friendsPath = path.join(baseDir, FRIENDS_DATA_PATH);
  var cachePath = path.join(baseDir, FRIENDS_CACHE_PATH);

  var friendsList = parseFriendsList(friendsPath, logger);
  var cache = loadCache(cachePath, logger);
  var resolved = [];

  for (var i = 0; i < friendsList.length; i++) {
    var friend = friendsList[i];
    var friendUrl = normalizeUrl(friend.url);
    if (!friendUrl) continue;
    var cacheEntry = cache[friendUrl] || {};
    resolved.push({
      url: friendUrl,
      name: pickFirstString(friend.name, cacheEntry.name, fallbackNameFromUrl(friendUrl)),
      description: pickFirstString(friend.description, cacheEntry.description, DEFAULT_DESCRIPTION),
      avatar: pickFirstString(friend.avatar, cacheEntry.avatar, DEFAULT_AVATAR)
    });
  }

  return resolved;
}

async function refreshFriendsCache(hexoCtx) {
  var logger = hexoCtx.log;
  var baseDir = hexoCtx.base_dir;
  var friendsPath = path.join(baseDir, FRIENDS_DATA_PATH);
  var cachePath = path.join(baseDir, FRIENDS_CACHE_PATH);

  var friendsList = parseFriendsList(friendsPath, logger);
  var oldCache = loadCache(cachePath, logger);
  var newCache = {};
  var fetchedCount = 0;

  for (var i = 0; i < friendsList.length; i++) {
    var friend = friendsList[i];
    var friendUrl = normalizeUrl(friend.url);
    if (!friendUrl) {
      logger.warn('[friends] Skip invalid url at index ' + i + ': ' + String(friend.url || ''));
      continue;
    }

    var cacheEntry = oldCache[friendUrl] || {};
    if (!isCacheFresh(cacheEntry)) {
      try {
        cacheEntry = await fetchFriendMeta(friendUrl);
        fetchedCount++;
      } catch (err) {
        logger.warn('[friends] Fetch failed for ' + friendUrl + ': ' + err.message);
        cacheEntry = oldCache[friendUrl] || {};
      }
    }

    newCache[friendUrl] = cacheEntry;
  }

  saveCache(cachePath, newCache);
  logger.info('[friends] Cache ready (' + friendsList.length + ' total, ' + fetchedCount + ' refetched).');
}

function ensureRefresh(hexoCtx) {
  if (!lastFetchPromise) {
    lastFetchPromise = refreshFriendsCache(hexoCtx).catch(function (err) {
      hexoCtx.log.warn('[friends] Refresh failed: ' + err.message);
    });
  }
  return lastFetchPromise;
}

ensureRefresh(hexo);

hexo.extend.filter.register('before_generate', function () {
  return ensureRefresh(hexo);
});

hexo.extend.helper.register('get_friend_cards', function () {
  return resolveFriendsSync(hexo);
});
