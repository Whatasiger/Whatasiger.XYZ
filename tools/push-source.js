// 部署后把整个工作区（源码）提交并推送到展示仓库 Whatasiger.XYZ
// 由 npm run deploy 在 hexo deploy 之后调用；没有改动时只推送，不产生空提交
const { execSync } = require('child_process');

const run = cmd => execSync(cmd, { stdio: 'inherit' });
const changed = () => execSync('git status --porcelain').toString().trim() !== '';

const pad = n => String(n).padStart(2, '0');
const d = new Date();
const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

if (changed()) {
  run('git add -A');
  run(`git commit -m "部署 ${stamp}"`);
}
run('git push origin main');
