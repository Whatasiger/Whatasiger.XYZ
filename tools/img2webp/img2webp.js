// img2webp.js — 图片批量转 WebP 工具
// 使用方法：双击运行（需先安装 Node.js）
// 默认扫描 <仓库根>/source/images/webp 目录
// 转换后的 .webp 文件与原文件同目录，原文件保留不删除

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* ========== 配置区 ========== */
const WEBP_QUALITY = 80;           // WebP 画质 (0-100)，80 是体积/画质的甜点
const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png'];

// 工具脚本现已搬出 source/ 目录，以免被 Hexo 当作站点资源拷进 public/
// 默认扫描仓库根的 source/images/webp，可以通过命令行参数覆盖
const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const DEFAULT_TARGET_DIR = path.join(REPO_ROOT, 'source', 'images', 'webp');
const TARGET_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : DEFAULT_TARGET_DIR;
/* ============================ */

const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 首次运行自动安装 sharp（安装到本脚本目录下，不污染站点 source/）
function ensureSharp() {
  try {
    return require('sharp');
  } catch (_) {
    console.log(`${C.yellow}未检测到 sharp 库，正在自动安装到 ${SCRIPT_DIR}...${C.reset}`);
    const pkgPath = path.join(SCRIPT_DIR, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      fs.writeFileSync(pkgPath, JSON.stringify({ private: true }, null, 2));
    }
    try {
      execSync('npm install sharp --no-save', {
        cwd: SCRIPT_DIR,
        stdio: 'pipe',
      });
      console.log(`${C.green}sharp 安装完成！${C.reset}\n`);
      return require('sharp');
    } catch (err) {
      console.error(`${C.red}安装 sharp 失败，请确认已安装 Node.js 并可访问 npm。${C.reset}`);
      console.error(`${C.dim}可手动执行：cd "${SCRIPT_DIR}" && npm install sharp${C.reset}`);
      process.exit(1);
    }
  }
}

async function convertToWebp(sharp, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath, ext);
  const outputPath = path.join(path.dirname(filePath), basename + '.webp');

  if (fs.existsSync(outputPath)) {
    console.log(`  ${C.yellow}跳过${C.reset}  ${basename}${ext} ${C.dim}(已有 ${basename}.webp)${C.reset}`);
    return { skipped: true, saved: 0 };
  }

  const inputSize = fs.statSync(filePath).size;

  await sharp(filePath)
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(outputPath);

  const outputSize = fs.statSync(outputPath).size;
  const saved = inputSize - outputSize;
  const pct = ((1 - outputSize / inputSize) * 100).toFixed(1);
  const arrow = saved > 0 ? `${C.green}↓${pct}%${C.reset}` : `${C.red}↑${Math.abs(pct)}%${C.reset}`;

  console.log(`  ${C.green}完成${C.reset}  ${basename}${ext} → ${basename}.webp  ` +
    `${C.dim}${fmtSize(inputSize)} → ${fmtSize(outputSize)}${C.reset}  ${arrow}`);

  return { skipped: false, saved, count: 1 };
}

async function main() {
  console.log(`\n${C.bright}${C.cyan}╔══════════════════════════════════╗`);
  console.log(`║      图片转 WebP 批量工具       ║`);
  console.log(`╚══════════════════════════════════╝${C.reset}\n`);

  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`${C.red}目标目录不存在：${C.reset}${TARGET_DIR}`);
    console.error(`${C.dim}用法：node img2webp.js [目标目录]${C.reset}\n`);
    pause();
    return;
  }

  const sharp = ensureSharp();

  console.log(`${C.cyan}扫描目录：${C.reset}${TARGET_DIR}`);
  console.log(`${C.cyan}目标画质：${C.reset}${WEBP_QUALITY} / 100\n`);

  const allFiles = fs.readdirSync(TARGET_DIR);
  const imageFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTS.includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log(`${C.yellow}未找到 .jpg / .png / .jpeg 图片文件。${C.reset}`);
    pause();
    return;
  }

  console.log(`${C.bright}找到 ${imageFiles.length} 个图片文件，开始转换：${C.reset}\n`);

  let totalSaved = 0;
  let totalConverted = 0;
  let totalSkipped = 0;

  for (const file of imageFiles) {
    try {
      const result = await convertToWebp(sharp, path.join(TARGET_DIR, file));
      if (result.skipped) {
        totalSkipped++;
      } else {
        totalConverted++;
        totalSaved += result.saved;
      }
    } catch (err) {
      const basename = path.basename(file);
      console.error(`  ${C.red}失败${C.reset}  ${basename} — ${err.message}`);
    }
  }

  console.log(`\n${C.dim}──────────────────────────────────${C.reset}`);
  console.log(`${C.bright}转换完成！${C.reset}  成功 ${C.green}${totalConverted}${C.reset} 个` +
    (totalSkipped > 0 ? `，跳过 ${C.yellow}${totalSkipped}${C.reset} 个` : '') +
    (totalSaved > 0 ? `，共节省 ${C.green}${fmtSize(totalSaved)}${C.reset}` : ''));
  console.log(`${C.dim}原文件已保留，未做任何删除。${C.reset}\n`);

  pause();
}

function pause() {
  if (process.stdin.isTTY) {
    console.log(`${C.dim}按回车键退出...${C.reset}`);
    const buf = Buffer.alloc(1);
    try { fs.readSync(0, buf, 0, 1); } catch (_) { /* ignore */ }
  }
}

main().catch(err => {
  console.error(`${C.red}发生错误：${C.reset}${err.message}`);
  pause();
});
