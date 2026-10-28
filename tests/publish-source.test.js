'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { main, parseArgs, sensitivePath } = require('../tools/push-source');

// Git 只在临时仓库创建测试提交；所有 push 由 dependency injection 截获，绝不联网。
function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-source-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
  function git(...args) { return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  git('init', '-b', 'main');
  fs.writeFileSync(path.join(cwd, 'README.md'), 'public fixture\n');
  git('add', 'README.md'); git('commit', '-m', 'base fixture');
  const base = git('rev-parse', 'HEAD');
  git('remote', 'add', 'origin', 'https://github.com/Whatasiger/Whatasiger.XYZ.git');
  git('update-ref', 'refs/remotes/origin/main', base);
  function commit(file, content = 'public fixture\n') {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), content);
    git('add', '--', file); git('commit', '-m', 'fixture');
    return git('rev-parse', 'HEAD');
  }
  const calls = []; const output = [];
  const deps = { cwd, log: line => output.push(line), execFileSync(command, args, options) {
    calls.push(args);
    if (args.includes('push')) return 'stubbed push';
    return execFileSync(command, args, { ...options, env });
  } };
  const pushes = () => calls.filter(args => args.includes('push'));
  return { cwd, git, commit, base, calls, output, deps, pushes };
}

test('deploy stays separate and source publish requires caller confirmation', () => {
  const { scripts } = require('../package.json');
  assert.equal(scripts.deploy, 'hexo deploy');
  assert.equal(scripts['source:preview'], 'node tools/push-source.js');
  assert.equal(scripts['source:publish'], 'node tools/push-source.js --publish');
});

test('default preview lists exact commits and added files without push/fetch/add/commit', t => {
  const f = fixture(t); const head = f.commit('new public.txt');
  const before = f.git('status', '--porcelain');
  const result = main([], f.deps);
  assert.equal(result.pushed, false); assert.deepEqual(result.commits, [head]);
  assert.match(f.output.join('\n'), /new public\.txt/); assert.match(f.output.join('\n'), /新增文件/);
  assert.match(f.output.join('\n'), new RegExp(head));
  assert.equal(f.pushes().length, 0);
  assert.equal(f.calls.some(args => args.some(arg => ['fetch', 'add', 'commit'].includes(arg))), false);
  assert.equal(f.git('status', '--porcelain'), before);
});

test('explicit gate rejects partial, duplicate, unknown, abbreviated or mismatched review', t => {
  for (const args of [['--publish'], ['--publish', '--confirm'], ['--confirm'], ['--publish', '--confirm', '--review', 'HEAD'], ['--publish', '--publish'], ['--dry-run'], ['--publish=false']]) {
    assert.throws(() => parseArgs(args));
  }
  const f = fixture(t); f.commit('public.txt');
  assert.throws(() => main(['--publish', '--confirm', '--review', f.base], f.deps), /SHA/);
  assert.equal(f.pushes().length, 0);
});

for (const state of ['untracked', 'unstaged', 'staged']) {
  test(`dirty ${state} blocks preview and explicit publish`, t => {
    const f = fixture(t); const head = f.commit('public.txt');
    const file = state === 'untracked' ? 'unreviewed.txt' : 'README.md';
    fs.writeFileSync(path.join(f.cwd, file), 'dirty\n');
    if (state === 'staged') f.git('add', file);
    for (const args of [[], ['--publish', '--confirm', '--review', head]]) assert.throws(() => main(args, f.deps), /工作区不干净/);
    assert.equal(f.pushes().length, 0);
  });
}

for (const file of ['.env', 'nested/.env.production', '.ssh/id_ed25519', 'private.pem', 'nested/private.key', 'config.local', 'credentials.json']) {
  test(`tracked sensitive path blocks without exposing its path: ${file}`, t => {
    const f = fixture(t); const head = f.commit(file, 'FIXTURE_ONLY_NOT_A_SECRET');
    for (const args of [[], ['--publish', '--confirm', '--review', head]]) {
      assert.throws(() => main(args, f.deps), error => /敏感路径/.test(error.message) && !error.message.includes(file));
    }
    assert.equal(f.pushes().length, 0); assert.equal(f.output.length, 0);
  });
}

test('sensitive tracked baseline is rejected even when not part of pending diff', t => {
  const f = fixture(t); const base = f.commit('.env');
  f.git('update-ref', 'refs/remotes/origin/main', base); f.commit('public.txt');
  assert.throws(() => main([], f.deps), /敏感路径/); assert.equal(f.pushes().length, 0);
});

test('sensitive file added and then removed in outgoing history still blocks', t => {
  const f = fixture(t); f.commit('.ssh/id_rsa'); f.git('rm', '.ssh/id_rsa'); f.git('commit', '-m', 'remove fixture');
  assert.throws(() => main([], f.deps), /敏感路径/); assert.equal(f.pushes().length, 0);
});

test('only exact env example names are exceptions', t => {
  const f = fixture(t);
  for (const file of ['.env.example', '.env.sample', '.env.template']) { assert.equal(sensitivePath(file), false); f.commit(file); }
  assert.equal(sensitivePath('.env.example.local'), true);
  assert.equal(main([], f.deps).pushed, false);
});

test('branch, remote push URL, multiple remotes and divergence fail closed', t => {
  const f = fixture(t); f.commit('public.txt');
  f.git('checkout', '-b', 'other'); assert.throws(() => main([], f.deps), /main/); f.git('checkout', 'main');
  f.git('remote', 'set-url', '--push', 'origin', 'https://token@example.invalid/secret');
  assert.throws(() => main([], f.deps), error => /origin/.test(error.message) && !error.message.includes('token'));
  f.git('config', '--unset-all', 'remote.origin.pushurl');
  f.git('remote', 'set-url', '--add', 'origin', 'https://github.com/Other/repo.git');
  assert.throws(() => main([], f.deps), /origin/);
  f.git('config', '--unset-all', 'remote.origin.url'); f.git('remote', 'set-url', 'origin', 'git@github.com:Whatasiger/Whatasiger.XYZ.git');
  f.git('checkout', '-b', 'diverged', f.base); const remoteHead = f.commit('remote.txt'); f.git('checkout', 'main');
  f.git('update-ref', 'refs/remotes/origin/main', remoteHead);
  assert.throws(() => main([], f.deps), /Git/); assert.equal(f.pushes().length, 0);
});

test('explicit publish sends only reviewed SHA with expected-base lease to stub', t => {
  const f = fixture(t); const head = f.commit('public.txt');
  const result = main(['--publish', '--confirm', '--review', head], f.deps);
  assert.equal(result.pushed, true); assert.equal(f.pushes().length, 1);
  const args = f.pushes()[0];
  assert.ok(args.includes(`${head}:refs/heads/main`));
  assert.ok(args.includes(`--force-with-lease=refs/heads/main:${f.base}`));
  assert.ok(args.includes('push.followTags=false'));
  assert.equal(f.git('rev-parse', 'HEAD'), head); assert.equal(f.git('status', '--porcelain'), '');
});

test('nothing pending never pushes, even after explicit confirmation', t => {
  const f = fixture(t);
  assert.equal(main(['--publish', '--confirm', '--review', f.base], f.deps).pushed, false);
  assert.equal(f.pushes().length, 0);
});

test('symlinks fail closed rather than following external content', t => {
  const f = fixture(t);
  fs.symlinkSync('README.md', path.join(f.cwd, 'public-link'));
  f.git('add', 'public-link'); f.git('commit', '-m', 'link fixture');
  assert.throws(() => main([], f.deps), /符号链接/); assert.equal(f.pushes().length, 0);
});

test('HEAD changes after review cannot race into the push', t => {
  const f = fixture(t); const head = f.commit('public.txt');
  const execute = f.deps.execFileSync;
  const deps = { ...f.deps, execFileSync(command, args, options) {
    if (args.at(-1) === 'HEAD' && args.includes('rev-parse')) return `${f.base}\n`;
    return execute(command, args, options);
  } };
  assert.throws(() => main(['--publish', '--confirm', '--review', head], deps), /HEAD 已变化/);
  assert.equal(f.pushes().length, 0);
});

test('ignore rules hide local secrets but keep env templates reviewable', t => {
  const f = fixture(t);
  fs.copyFileSync(path.resolve(__dirname, '../.gitignore'), path.join(f.cwd, '.gitignore'));
  f.git('add', '.gitignore'); f.git('commit', '-m', 'ignore fixture');
  const files = ['.env', '.env.production', 'x.local', 'x.pem', 'x.key', '.vscode/settings.json', '.env.example', '.env.sample', '.env.template'];
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(f.cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(f.cwd, file), 'fixture');
  }
  const untracked = f.git('ls-files', '--others', '--exclude-standard').split('\n').sort();
  assert.deepEqual(untracked, ['.env.example', '.env.sample', '.env.template']);
});

test('git errors never print captured stderr or credentials', t => {
  const f = fixture(t);
  assert.throws(() => main([], { ...f.deps, execFileSync() { throw new Error('SECRET_TOKEN'); } }), error => !error.message.includes('SECRET_TOKEN'));
});
