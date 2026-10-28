'use strict';

// 只发布人工审核过的现有提交；预览完全离线，不 add、commit 或 fetch。
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const EXPECTED_REMOTE = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)Whatasiger\/Whatasiger\.XYZ(?:\.git)?$/;

function sensitivePath(file) {
  const parts = file.toLowerCase().split('/');
  const name = parts.at(-1);
  if (parts.some(part => ['.ssh', '.aws', '.azure', '.gnupg', '.config', '.kube', '.git', 'secrets', 'credentials'].includes(part))) return true;
  if (/^\.env/.test(name) && !/^\.env\.(?:example|sample|template)$/.test(name)) return true;
  return /(?:\.(?:pem|key|p12|pfx|keystore|local)|(?:^|\.)(?:credentials|secret|secrets))$/.test(name)
    || /^(?:id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?|(?:credentials|secrets?)(?:\.[a-z0-9_-]+)?|\.netrc|\.npmrc|\.pypirc|authorized_keys|known_hosts)$/.test(name);
}

function parseArgs(argv) {
  const options = { publish: false, confirm: false, review: null };
  const seen = new Set();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (seen.has(arg)) throw new Error('重复参数；拒绝发布。');
    seen.add(arg);
    if (arg === '--publish') options.publish = true;
    else if (arg === '--confirm') options.confirm = true;
    else if (arg === '--review') {
      options.review = argv[++i];
      if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(options.review || '')) throw new Error('--review 必须是预览得到的完整提交 SHA。');
    } else throw new Error('未知参数；仅支持 --publish --confirm --review <SHA>。');
  }
  if (options.publish && (!options.confirm || !options.review)) throw new Error('发布必须同时提供 --publish --confirm --review <已审核的完整 HEAD SHA>。');
  if (!options.publish && (options.confirm || options.review)) throw new Error('--confirm / --review 只能与 --publish 一起使用。');
  return options;
}

function main(argv = process.argv.slice(2), dependencies = {}) {
  const options = parseArgs(argv);
  const cwd = dependencies.cwd || path.resolve(__dirname, '..');
  const execute = dependencies.execFileSync || execFileSync;
  const log = dependencies.log || console.log;
  function git(args) {
    try {
      return execute('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
        cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1' }
      });
    } catch {
      // 不转印 Git stderr：其中可能包含远端凭证、文件内容或敏感本机路径。
      throw new Error('Git 检查或推送失败；已隐藏可能含凭证的原始错误。请在本机检查仓库状态。');
    }
  }
  function checkRepository() {
    if (git(['rev-parse', '--show-prefix']).trim()) throw new Error('必须在仓库根目录操作。');
    if (git(['symbolic-ref', '--short', 'HEAD']).trim() !== 'main') throw new Error('仅允许 main 分支。');
    for (const direction of [[], ['--push']]) {
      const urls = git(['remote', 'get-url', ...direction, '--all', 'origin']).trim().split('\n');
      if (urls.length !== 1 || !EXPECTED_REMOTE.test(urls[0])) throw new Error('origin 必须唯一且指向预期的 Whatasiger/Whatasiger.XYZ；不显示实际 URL。');
    }
    if (git(['status', '--porcelain=v1', '-z', '--untracked-files=all']).length) throw new Error('工作区不干净（包含 staged / unstaged / untracked）；请人工检查，工具不会略过、stage 或 commit。');
  }
  checkRepository();
  const head = git(['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  const base = git(['rev-parse', '--verify', 'refs/remotes/origin/main^{commit}']).trim();
  git(['merge-base', '--is-ancestor', base, head]);
  if (options.review && options.review !== head) throw new Error('HEAD 与已审核 SHA 不一致；请重新预览审核。');
  const commits = git(['rev-list', '--reverse', `${base}..${head}`]).trim().split('\n').filter(Boolean);

  // 不只检查 diff：HEAD 已跟踪的敏感文件、待推历史中后来删除的敏感文件也必须阻止。
  for (const commit of new Set([base, head, ...commits])) {
    const tree = git(['ls-tree', '-r', '-z', commit]).split('\0').filter(Boolean);
    for (const entry of tree) {
      const separator = entry.indexOf('\t');
      const metadata = entry.slice(0, separator);
      const file = entry.slice(separator + 1);
      if (sensitivePath(file)) throw new Error('检测到已跟踪的敏感路径；拒绝发布（路径已隐藏）。删除当前文件不能清除待推历史中的秘密。');
      if (/^(?:120000|160000) /.test(metadata)) throw new Error('检测到符号链接或子模块，无法审核其外部内容；拒绝发布（路径已隐藏）。');
    }
  }
  log(`模式：${options.publish ? '显式发布' : '离线预览（不会 push / fetch）'}`);
  log('目标：Whatasiger/Whatasiger.XYZ main（独立源码发布，不属于 hexo deploy）');
  log(`本地 origin/main 基线：${base}（可能过期；不联网更新）`);
  log(`待审核 HEAD：${head}`);
  log(`待推提交：${commits.length}`);
  for (const commit of commits) {
    log(`提交 ${commit}`);
    const changes = git(['diff-tree', '--root', '-m', '--no-commit-id', '--name-status', '-r', '-z', '--no-renames', commit]).split('\0').filter(Boolean);
    for (let i = 0; i < changes.length; i += 2) {
      if (sensitivePath(changes[i + 1])) throw new Error('提交变更包含敏感路径；拒绝发布（路径已隐藏）。');
      log(`  ${changes[i]} ${JSON.stringify(changes[i + 1])}${changes[i] === 'A' ? ' [新增文件：须人工审核内容]' : ''}`);
    }
  }
  log('审核每个提交及文件内容；路径防护不是秘密内容扫描，.env.example 等示例文件也不能含真实凭证。');
  if (!commits.length) { log('没有待推提交；不执行 push。'); return { head, base, commits, pushed: false }; }
  if (!options.publish) {
    log(`审核完成后：npm run source:publish -- --confirm --review ${head}`);
    return { head, base, commits, pushed: false };
  }
  // 再检查一次，推送绑定审核过的 SHA；显式 lease 防止本地 remote-tracking 过期而覆盖远端。
  checkRepository();
  if (git(['rev-parse', 'HEAD']).trim() !== head) throw new Error('审核后 HEAD 已变化；拒绝发布。');
  git(['-c', 'push.followTags=false', 'push', '--porcelain', `--force-with-lease=refs/heads/main:${base}`, 'origin', `${head}:refs/heads/main`]);
  log(`已推送已审核提交 ${head}（未创建提交，未推送 tags）。`);
  return { head, base, commits, pushed: true };
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main, parseArgs, sensitivePath };
