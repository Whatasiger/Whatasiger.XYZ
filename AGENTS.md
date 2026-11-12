# Whatasiger 博客

Hexo 8 静态博客，中文内容（小说/随笔/日记/评析），部署到 GitHub Pages。

## 规则
- 不要改动文章正文内容，除非我明确要求（这是我的创作）
- `public/`、`.deploy_git/`、`db.json` 是生成物，不要编辑
- 部署、源码发布只在我明确要求时执行
- 若无特殊说明，前端改动只做在 Glint（`themes/glint`），Origin（`themes/origin`）冻结、不同步
- 维护本文件：
  - 改动让本文件某处描述失效时（改名、挪位置、删功能），顺手改正或删掉那一条
  - 只有满足以下之一才新增条目：① 不看本文件就容易做错、且看代码不易察觉的约束（写成「不要……」「须同时改……」）；② 改完必须执行的步骤（重跑脚本、加版本号）；③ 跨多个文件、单看一处找不全的关联（如同一判断分布在三个模板）
  - 不要写进来：单次 Bug 的经过与排查过程、实测数值、纯视觉参数（尺寸、时长、配色）、「原先……现在……」的变迁、看代码一眼就知道的实现细节；需要的话写进相关代码的注释
  - 每条尽量一两句，写「是什么 / 在哪 / 不要怎样」，原因最多半句；优先合并进已有条目或「通用前端约定」，不要另起长段
  - 代码注释同理：写约束和原因，不写修改历史

## 常用命令
- `npm run server`：本地预览（只有 Glint，未压缩源码）
- `npm run build`：生成 Glint + Origin，最后 `tools/minify.js` 用 esbuild 压缩 `public/` 下各 `static/` 的 CSS / JS（保留文件头署名注释，压缩失败即构建失败）。生成一律带 `--force`，**不要去掉**（`hexo s` 会把新哈希写进 `db.json`，不带 force 时 `public/` 会留下旧文件）
- 预览两套界面：`npm run build` 后 `npx hexo server -s`
- 部署：先 `npm run build`，再 `npm run deploy`（hexo-deployer-git → Whatasiger.github.io main）；**不要只跑 `hexo generate` 就部署**（Origin 不会更新）
- 源码发布（Whatasiger/Whatasiger.XYZ main）与部署分开：`npm run source:preview` 离线列出待推内容；人工审核、手动提交且工作区干净后，经我授权才执行 `npm run source:publish -- --confirm --review <完整HEAD SHA>`（工具不 add / commit，遇敏感路径拒绝）
- `npm run clean`

## 两套界面：Glint / Origin
- **Glint**（`themes/glint`，站点根路径，当前设计）与 **Origin**（`themes/origin`，改版前界面，生成在 `/origin/`），同一份 `source/`、`scripts/` 生成两遍：`tools/build-origin.js` 叠加 `_config.build-origin.yml`（root `/origin/`、输出 `public/origin/`、缓存 `.origin-build/`）；图片只在根路径放一份
- 切换：两套各自的 `_partial/ui-switch.ejs`（`<head>` 最前），选择存 localStorage `whatasiger_ui`，不符时跳到另一套的同一路径
- Origin 页面 `noindex`，canonical 指向 Glint；订阅源 / 站点地图指向根路径。Origin 只为能在 `/origin/` 下工作做过必要改动（绝对路径改 `url_for`、加切换项）
- **CARRiER WAVE. 与界面无关**：只在 Glint 根路径生成一份，Origin 里的链接写死 `/carrier_wave/`，CW 页面不引用 ui-switch
- Glint 原名 hingle（基于 Dreamer-Paul 的 Hingle），已更名为 `glint.css` / `glint.js` / 构造函数 `Glint`；对 Hingle 的署名（页尾、文件头、README、LICENSE、关于页）须保留。Origin 的 `hingle.*` 不改名

## 内容与数据
- 文章：`source/_posts/`，只用 tag 不用分类（随笔/小说/评析/特殊）。front matter：title / abbrlink（数字短链）/ alias / tag / cover / description / hideIndex: true（不上首页）/ related: [abbrlink…]
- 地址一律带结尾斜杠（`pretty_urls` 两项为 false），站内链接写 `/about-me/`
- 不进站点地图的页面写 `sitemap: false`
- 图片统一 webp，放 `source/images/webp/`；外链图用 `tools/external_images_to_webp.py` 转换。正文 `<img>` 由 `scripts/lazy-images.js` 构建期加懒加载与宽高，不要再用 JS 换 src
- 自定义扩展在 `scripts/`：脚注、quote-box、hide-from-index、友链抓取、`asset_url`、搜索索引、卡片封面等
- 更新日志：`source/about-website/index.md` 最底部，`---` 分隔 + `#### **版本名**（YYYY-MM-DD）` + 简短中文列表（可二级缩进），口吻面向读者、不写实现细节，参考近几次措辞。自 Ciel 起版本以名字称呼，之前是 GA x.y
- 发版：Logo 版本名写死在 `header.ejs` 的 `.header-logo-ver`，手动改并重取 `Glint UI` 子集。更新提示：footer.ejs 在 glint.js **之前**写 `window.GLINT_RELEASE`（取更新日志最后一条），与 localStorage `whatasiger_seen_release` 不同时在非阅读页浮出一次；**同一版本名下追加内容不会触发，改版本名或日期才会**

## 需要重新生成的东西
- **卡片封面**：新增 / 更换封面或默认背景后重跑 `tools/card-covers.py`（生成 `source/images/webp/card/<名>.webp`、`@2x`、`@thumb`；模板经 `card_cover()`（`scripts/card-cover.js`）写成内联 `image-set`，原图不比该档宽多少时回退原图；原图地址记在 `data-cover`，悬停预烤文章页背景用它）
- **首页背景缩略图**：`py -3.9 tools/bg-thumbs.py`（`source/images/webp/thumb/` 同名文件）
- **图标**：Font Awesome 4.7 不外链，由 `tools/fa-subset.py` 扫描用到的图标（模板 / 脚本 / md / yml 的 `fa-xxx`、`menu_icons`、gizmo.yml 的 icon、glint.css 的 `content: "\fxxx"`）切子集内联在 `static/fa/fa.css`（原版字体在 `tools/fa-src/`），**新增图标后重跑**，否则显示空白
- **顶栏字体 `Glint UI`**（`_partial/ui-font.ejs`）：顶栏 / 导航改字（含版本名）后跑 `py -3.9 tools/ui-font.py [追加的字]`（走 Google Fonts；loli.net 镜像对 text= 子集返回 EOT，不能用）
- **CW 标题字体 `CW Title`**（`_partial/cw-title-font.ejs`）、**预告手写字 `CW Soon`**（`_partial/soon-font.ejs`）同为子集，改字须重取
- **一叶**：改关卡后跑 `node tools/yiye-solve.js` 检验可解并参考 par（求解器只模拟「停稳再点」，步数是上界）；改 `game.js` / `sim.js` 后把 `index.html` 里的 `?v=` 加一

## 通用前端约定（Glint）
- 样式在 `themes/glint/source/static/glint.css`，按「0 变量 / 1 夜间 / 2 页眉 / … / 8 白天配色」分节，中文行尾注释
- 引用主题 CSS / JS 一律 `<%- asset_url('static/xxx.js') %>`（带内容哈希 `?v=`），不要写死路径或用 `css()` / `js()`；CW 的 cw.css / cw.js 同样
- 大段脚本不要内联进每页 HTML，做成 `static/` 外链；只把首帧前必须执行的少量逻辑内联
- **主题色**：用第 0 节色阶 `--tc-ice / pale / light / glow / soft / main / dim / deep / ink / warm / warm-deep`，半透明写 `color-mix(in srgb, var(--tc-x) N%, transparent)`，**不要写死蓝色 hex / rgba**。其他主题由 `html[data-accent]` 换 `--tc-h`（OKLCH 只换色相）；新增主题色要同时改第 0 节与 `header.ejs` 的 `accents`。CW 页面不加载 glint.css
- **日夜**：`body.dark-theme` 为夜间。只改白天写 `body:not(.dark-theme) …` 集中在第 8 节，夜间用 `.dark-theme …`。首帧判断在 `header.ejs`：本次浏览点过日月按钮（sessionStorage `theme-pick`）就照它，否则按设置 `themeMode`（`dark` 默认 / `light` / `auto` 跟随系统）；结果写 sessionStorage `theme`（一叶等独立页面读它）并改 `<meta name="theme-color">`。glint.js `setDark()` 切换、`night()` 是日月按钮（写 `theme-pick`），改模式时清掉 `theme-pick`
- **毛玻璃**：
  - 浮层卡片共用 `--glass-*`（squircle 圆角，展开 `--ease-spring`、收起 `--ease-exit`），新增浮层沿用
  - 带 backdrop-filter 的元素不能嵌套（所以浮层放在 `<header>` 外）；祖先透明度 < 1 时其中的毛玻璃失效，入场动画挂在玻璃元素自身
  - 常驻屏上的毛玻璃在第 7 节开头统一减半模糊、去 saturate，新增的照此处理
- **动画性能**：悬停 / 过渡只动 transform / opacity，不要过渡 `box-shadow`、`filter`、渐变位置（投影用两层伪元素交叉淡化）。图片只写在元素内联 `background-image` 上，不要经 CSS 变量传 `url()`。独立属性 `translate`/`scale` 与 `transform` 不要混用同一属性。入场动画别用 `both` 填充去碰悬停要过渡的属性，用 `backwards`
- **canvas 烤图**一律导出无损 PNG（有损 WebP 暗部出方块）、加 ±1 级抖动噪点去色带
- 滚动处理用 glint.js 的 `onScrollFrame(fn)` 登记
- 根滚动：`html { overflow-x: hidden; scrollbar-gutter: stable }` + `body { overflow-x: clip }`，不要让 html、body 同时 hidden，不要去掉 scrollbar-gutter
- kico.css 会给 checkbox 加伪元素方框、给 range 加 overflow / min-height，新增表单控件注意覆盖
- 「一排选项 + 一枚强调框」的控件接入 `window.glintDragPick`（拖动选择），横向拖动的控件写 `touch-action: pan-y`
- 有副作用的脚本（计数、上报）等页面真正激活（`document.prerendering` 为假 / `prerenderingchange`）后再执行；评论等重活等 `window.vtSettled`
- 新增浮层 / 常驻控件加进 glint.css「打印样式」的隐藏列表
- 读正文文字用 `textContent`，不要用 `innerText`（等字体期间正文 visibility: hidden，会取到空串）

## 页面类型
- 阅读页 = 文章与独立页面（`body.post-page`）。`gizmo` / `stats` / `soon` 三种 layout 不算阅读页，判断分布在 `layout.ejs`（`isReading`）、`header.ejs`（`isArticle`）、`head.ejs`，新增同类 layout 三处都要排除；这些页面底栏只留版权
- 有目录的阅读页由 `layout.ejs` 服务端挂 `has-trees`（与 glint.js `tree()` 判断一致）

## 背景
- `body:before` 伪元素，由 `--page-bg-image` / `--bg-opacity` / `--bg-blur` 控制；有 cover 的文章由 `head.ejs` 服务端把封面写进 `--page-bg-image`（「关于网站」除外）
- 阅读页首帧就挂 `.bg-faded`、模糊度直接取最终值（`header.ejs`），**不要改回进页后靠过渡变淡**
- 烘焙：glint.js `bgBake` 把模糊背景用 canvas 烤成 blob 图，body 挂 `.bg-baked`（不再挂 blur 滤镜），桌面与手机都烤。改背景层滤镜时同步 `.bg-baked` / `html.bg-prebaked` 的规则。换图前 `whenBgIdle()` 等背景过渡走完且 `no-bg-transition` 已撤掉；glint.js 初始化时 `--bg-blur` 已由 header.ejs 设过就不再覆盖
- 预烤交接：首页卡片进视口时 `bgBake.prebake()` 按目标页模糊度烤好，存 sessionStorage `glint-bg-prebake`；目标页 `head.ejs` 首帧前比对，对得上就挂 `html.bg-prebaked`。文章卡片与 CW 预告卡片已接入，**今后新增「跨页过渡进入用模糊背景的页面」都要接预烤**（否则过渡全程是实时模糊，边缘一圈暗边）
- 首页背景切换：篇目 `source/_data/backgrounds.yml`（可写 `artist` / `link`，主题 `background` 须在其中；首项「每日轮换」`@daily`，head.ejs 与 glint.js `todayId()` 同一算法）。所选存 localStorage `whatasiger_home_bg`（选默认即删除），写成 head 里的 `#bg-choice` 覆盖 `--page-bg-image`：`head.ejs` 首帧前对所有用主页背景的页面套用（有封面的文章不受影响），glint.js `setupBgSwitch()` 运行时切换并让 bgBake 重烤。缩略图等打开浮层 / 导航卡片才加载，原图选中后才加载、解码好再换（`body.bg-swapping`）。署名 `.bg-credit` 只在桌面浮层显示（手机导航卡片里按用户要求不显示）。入口：导航横排时右上角 `.bg-dock` → `.corner-morph` 浮层（按钮形变成卡片，尺寸变量 `--corner-btn` / `--corner-pad`，由 glint.js `cornerMorph()` 量好写入，不进 `.on-top` 层级），收起时为导航卡片里的 `.head-menu-bg`（div，不进导航测量）；磁贴共用 `_partial/bg-tiles.ejs`

## 顶栏、导航与设置
- 顶栏配色 `--hd-*`（挂在 body 上；第 2 节夜间、第 8 节白天）
- 导航收起不按断点，由 `header.ejs` 紧跟 nav 的内联脚本实测（会碰到 Logo / 搜索框或宽 < 600px 时挂 `html.nav-collapsed`）。相关 CSS 用 `html.nav-collapsed` / `html:not(.nav-collapsed)`，不要写进 600px 媒体查询；改 `.head-menu > a` 的 padding / margin-right 须同步脚本里的 `PAD` / `SPACE`。设置面板仍按 600px 切换。收起判断的 MutationObserver 只在 body 内联 `font-family` 变了时重算
- 桌面导航强调框 `.head-menu-pill` 由脚本写 `--pill-x/--pill-w`；Gizmo 磁贴 `.head-menu-gizmo`、背景 / 沉浸磁贴不参与测量与强调框。「归档」的当前页也包括标签页、年月归档页
- 手机端导航图标在主题 `_config.yml` 的 `menu_icons`
- 沉浸模式（设置项 `immersive`）：glint.js `setupImmersive()` 下滑挂 `html.header-hidden`，参数 `REVEAL_WINDOW / REVEAL_DISTANCE`
- 设置面板（`header.ejs`，放在 header 外；设置存 localStorage `whatasiger_reader_settings`）：「外观」「阅读」两页；控件只用 `.settings-chip`（开关）、`.settings-tile`（两两并排的滑动条）、`.settings-segment`（分段），新增设置项照此放进对应页，**不要再加长列表**。滑动条是 glint.js `makeSlider()`（配置 `GS_SLIDERS`，部件为 `gs-*` 自定义元素，避开 `.settings-row span` 等规则），拖动时每帧最多应用一次（`applySoon`）、松手才写存储；字重松手吸附到档位（`snap`）；排版类拖动期间撤掉正文 `.is-laid-out`，背景类挂 `body.bg-tuning` 撤掉背景层过渡。「背景模糊」分首页 / 阅读页两项，只改设置不改当前页
- 已按用户要求删除、**不要再加回**：「回到顶部」按钮、「显示回到顶部」「隐藏背景图片」开关、文末作者 / 版权信息块、手机端阅读页玻璃底板、桌面右下角目录开关
- 两个浮层同时打开时由 glint.js `bringToFront` 挂 `.on-top`

## 字体
- 阅读页等字体：`head.ejs` 给 html 挂 `page-loading`（`main` / 迷你目录隐藏、入场动画暂停），`document.fonts.ready` 后撤掉（最多 1.2s，选系统字体不等）；卡片一镜到底时由 `post-vt.ejs` 在 pagereveal 调 `pageReveal()` 立即撤掉。样式在 glint.css「阅读页等字体」
- 顶栏与导航先用内联子集 `Glint UI`；选系统字体时 html 挂 `font-system`
- 正文宋体选中才加载（head.ejs 首帧与 glint.js `loadSerif` 两处地址一致）；排版变量 `--reader-*`（第 0 节），首帧由 header.ejs 写好

## 首页
- 博主卡 `.home-hero`（`index.ejs` + `_partial/social.ejs`）：一整张毛玻璃，里面不能再用毛玻璃；配色 `--hero-*`；座右铭在 `index.ejs` 顶部 `motto`；社交图标用 SVG mask + `currentColor`（照 `.fa-xxx-icon` 写）；`.home-title` 归档页也在用，首页专属样式限定 `.home-hero`
- 文章卡片结构：`.post-card-shadow`（投影）、`.post-card-bg > .post-card-zoom > .post-card-img ×3`（原图 / 轻模糊 / 重模糊，由 glint.js `setupCardBlur()` 烤图）、`.post-card-light`（细边与悬停高光，光斑只平移不缩放，不要加小而亮的光芯）；卡片本身不裁切。倾斜由 `setupCardFloat()` 写内联 transform（透视须与 CSS 一致）。前两张卡片封面直接内联，其余写 `data-bg-style` 进视口附近才写上
- 首页内容 `user-select: none`、链接图片不可拖动（划水面用）
- 水波纹 `static/water-ripple.js`（WebGL2）：静水时须与 CSS 背景一致，改背景层叠方式要同步这里；尺寸按画布 / `body:before` 实际大小量，**不要用 `innerWidth / innerHeight`**（含 scrollbar-gutter）；物理网格按 CSS px 定格宽（`minCell`）；`stiffness` 必须 < 2，物理通道用 texelFetch 取格并钳位（否则个别手机 GPU 发散成满屏泛白）；触摸参数 `TOUCH_SLOP / TOUCH_HOLD`
- Gizmo 叶片 `.gizmo-leaf`（`static/gizmo-leaf.js`，图形 `_partial/gizmo-leaf-svg.ejs`，与 Gizmo 页 `.gizmo-emblem`、一叶的叶子共用同一路径）：仅导航横排时显示，借 `window.waterRipple` 激发 / 采样水面，参数在 CFG
- 首页沉浸：glint.js `setupHomeZen()` 挂 `html.home-zen`，sessionStorage `glint-home-zen`；样式「首页沉浸」
- TO DO 抽屉（`_partial/todo-sidebar.ejs` + `static/todo-sidebar.js`）：只位移外层 `.todo-drawer`；条目按 `--i` 依次浮现（模板与脚本都要写）；封面 `data-src` 首次展开才加载；收起时 `inert`；设置关掉时不请求 Bangumi
- 周榜：`/todo.json` 构建时生成（Origin 不生成），`.github/workflows/todo.yml` 每天北京时间 06:30 不重建、只替换线上 `/todo.json`（`tools/todo-refresh.js`；榜单没变不提交，抓取失败则运行失败、线上留旧榜；同样要 `DEPLOY_TOKEN`），抓取逻辑 `tools/todo-fetch.js` 与 `scripts/todo-sidebar.js` 共用；页面读到更新的 `fetchedAt` 才换上，本地 deploy 覆盖线上那份无妨

## 跨页过渡（View Transitions）
- **`vtFlip`**（`_partial/vt-flip.ejs` → `static/vt-flip.js`，须在各页 pagereveal 脚本之前引入）：取消浏览器默认组动画，改为只动 transform 的动画（合成线程）。调用 `vtFlip(vt, { 名字: { old, new, radius, el, box } })`：
  - 每个名字写上新页对应元素的选择器 `el`，移动时按新终点重建动画并沿用 `startTime`；**不要改成 `setKeyframes` 原地改写，也不要用 `currentTime` 接续**
  - `el` 为返回矩形的函数时须同时写 `box`（坐标基准不同，手机地址栏会让终点错位）；过渡中视口高度变了（地址栏在新页激活后才挤进来）终点按 `innerHeight` 的差值下移，**不要删**
  - 只在旧页存在的层用 `{ follow: 领头名, how: 'box' | 'content' }`
  - 组的 transform 是「旋转 + 等比缩放 + 平移」时角度一并过渡，其余按外接矩形
  - 带过渡名的元素与 root 在过渡中应保持静止（入场动画要关掉），否则每帧重截快照；过渡名尽量只在离场时临时挂上；新加过渡名时同步写快照显示方式与 `el`
- **首页 → 文章**（只做这一方向，离开文章页的其余跳转一律 skip）：卡片是 `<a>`，speculation rules 悬停 / 按下即 prerender，另 prefetch 视口上下各一屏的卡片（`head.ejs`，Save-Data / 2G 不预取），触屏滚动停下后预渲染屏幕中央那张。按下即挂 `is-pressed`（与 CW 卡片同一套 `pressable()`）。不蒜子由 `footer.ejs` 在页面激活后才加载。pageswap 的 `leaveToPost` 给被点卡片各层挂 `post-cover` / `post-title` / `post-shadow` / `post-light` / `post-info`；**离场前不要再改卡片画面**（截图就在下一帧，会截到黑底或残图）。文章页 `_partial/post-vt.ejs` 挂 `vt-from-card` / `vt-card-in`，全屏空层 `.vt-cover` 接封面、`h2` 接标题；模糊由新页给：背景已是烤好的图时挂 `vt-cover-live`，`.vt-cover` 画上那张图与卡片快照一起放大、淡入后淡出，否则只放大卡片快照；圆角裁切在 image-pair 上（`post-vt-unround`，时长缓动与组一致）；过渡期间 `body:before` 去掉 transition。`<link rel="expect" href="#vt-post-title" blocking="render">` 不能删。编排在 glint.css「文章卡片一镜到底」
- **首页 → CW 目录页**：预渲染目录页；`head.ejs` 离场挂 `cw-leaving` 并写 `cw-wave-hop` 对准载波，目录页画布在 `cw-from-home` 期间定格；载波终点用 cw.js 的 `cwCarrierRect`；首页 CW 卡片的过渡名只在 `html.cw-leaving` / `html.cw-back` 时挂；圆角裁切在 `::view-transition-image-pair(cw-stage)`（`cw-vt-unround`，时长缓动与组一致）
- **首页 → Gizmo**：`leaveToGizmo` + `_partial/gizmo-vt.ejs`（sessionStorage `gizmo-leaf-hop`）；内容在 `gizmo-from-leaf` 期间隐藏，常驻的 `gizmo-leaf-in` 关掉入场动画
- **首页 → CW 预告页**：`leaveToSoon` 挂 `html.soon-leaving` + `_partial/soon-vt.ejs`（sessionStorage `soon-hop`），过渡名 `soon-sheet / soon-tape / soon-wave / soon-title / soon-hand`，其余碎片等 `soon-scraps-wait` 撤掉后落下；常驻的 `soon-card-in` 关掉带名元素的入场，过渡期间背景不走模糊度过渡。所有碎片单独挂名、组的 z-index 照抄画板层叠（留在 root 里会被底片压住）；纸条快速不透明放下（不要改回慢淡入）；手写字换墨窗口保持短（0.2s）。编排在 glint.css「CW 预告页」末尾
- **标题一镜到底**（`_partial/title-hop.ejs`）：搜索结果 / 归档 / 文末卡片点进文章时标题飞到正文标题处；各页 pageswap 先调 `takeTitleHop(e)`（首页 head.ejs、post-vt.ejs、gizmo-vt.ejs 已接入；其余页面由 title-hop.ejs 声明 `@view-transition` 并默认跳过），文章页挂 `vt-from-hop`；新增「点标题进文章」的列表照此接入（`data-title-hop` / `data-hop-title`）
- CW 篇目之间靠 `view-transition-name: cw-t-<slug>`；文末翻页篇名只在经它跳转时临时挂名
- 正文直接子 `p` 带 `content-visibility: auto` 加快首帧，`vtSettled` 后挂 `.is-laid-out` 撤掉；跳转定位前须先整篇排好
- 诊断：`vt-debug.ejs`（平时一行判断，开启才载入 `static/vt-debug.js`）；localStorage `cw-vt-slow` 设倍数可慢放。经 Chrome 扩展测试时过渡常因视口抖动被中止，逐帧审视用无头 Chrome + CDP `Animation.setPlaybackRate`
- 日夜切换在支持视图过渡时从日月按钮圆形扩散（`html.theme-flipping`）

## 阅读页
- 玻璃底板画在 `.reading-sheet` 与 `.post-comments` 的 `::before` 上，配色 `--sheet-*`；**不要给 `.wrap`、`.reading-sheet`、`.post-comments` 本身加 backdrop-filter / filter / transform / 透明度动画**（会让 fixed 的目录错位、毛玻璃失效）。手机端（≤ 599px）不用底板
- 文章目录 `.article-list`（glint.js `tree()`）：`--glass-*` 卡片 + 竖线轨道，配色 `--toc-*`；收起为右上角迷你目录 `.toc-mini`，开合由 tocMorph 用 `.toc-ghost` 替身线条形变，状态以类名为准。桌面端让位只给 `main` 和 `footer` 加 `padding-right`（**不要用 body 的 margin-right**），卡片本身不加 opacity / transform 动画，不要给 `.wrap` 做 translate FLIP
- 续读（glint.js 末尾）：按「正文第几块 + 块内比例」记在 localStorage `whatasiger_read_progress`，`vtSettled` 后浮出 `.resume-bar`；读过的最远位置记在 `whatasiger_read_max`（目录打勾、「读到 x%」胶囊）
- 脚注预览 `setupFootnotePeek`；图片灯箱在 glint.js 末尾（取代 kico 的 `ks.image`）；更新日志折叠在 glint.js 末尾
- 正文 Markdown 外观见 glint.css 同名一节（变量 `--md-*`）：链接悬停下划线不接管带 class 的卡片链接、脚注标号与回跳、包图片的链接；表格用 `border-collapse: separate`，行线画在 td 上（kico 画在 tr 上的边框此时不生效）
- 文末「继续阅读」（post.ejs，配色 `--near-*`）：Hexo 的 `next` 是较早、`prev` 是较新；相关阅读先取 `related`，再按标签补足到 3 篇
- 字数显示：满一万写「x.x 万字」，不足一万取整到百（各处口径一致，数据来自 `page.length`）
- Quote Box 折叠用 grid 行高 `min-content 1fr ↔ 0fr`，顶栏行必须 `min-content`

## 其他页面与功能
- **底栏**（`_partial/footer.ejs`）：底板自带毛玻璃，三张 `.footer-card` 不再嵌套模糊；配色 `--footer-*`
- **站内搜索**（glint.js `local_search`）：索引 `scripts/search-index.js` → `/search.json`，首次聚焦才下载；`search.xml` 留给 Origin，不要删
- **归档 / 标签页**（`layout/archive.ejs`，「归档时间线」，配色 `--arc-*`）：不分页（`_config.yml` 的 `archive_generator` / `tag_generator` per_page: 0）
- **写作统计** `/stats/`（layout `stats`，「写作统计」）：构建时统计，CW 字数来自 `cw_stats()`
- **Gizmo** `/gizmo/`（layout `gizmo`，篇目 `source/_data/gizmo.yml`，加东西只改数据）：独立小玩意放 `source/gizmo/<名字>/`，`skip_render` 原样输出；自包含、相对路径（返回写 `../`）。示范《一叶》`source/gizmo/yiye/`：`sim.js` 纯物理（无 DOM、确定性）、`game.js` 画面输入、进度 localStorage `whatasiger_gizmo_yiye`，首帧读博客主题色与 sessionStorage `theme`
- **订阅源**：`scripts/feed-stylesheet.js` 给 `atom.xml` / `rss2.xml` / `carrier_wave/atom.xml` 插入 `/feed.xsl`（`source/feed.xsl`，XSLT 1.0，Origin 不含）
- **评论**：`static/comments.js`（defer，接近视口才加载 Twikoo，`vtSettled` 之后）
- 站点图标在 `static/img/`，manifest `source/site.webmanifest`

## CARRiER WAVE.（【特殊】短篇辑）
- 正文 `source/_carrier_wave/`，篇目 `source/_data/carrier_wave.yml`，由 `scripts/carrier-wave.js` 单独生成；页面不加载 glint.css
- 暂时隐藏入口：`carrier_wave.yml` 顶部 `hide_entry: true`（**不能叫 `hidden`**，文件里已有同名键，重复会让整个文件解析失败）。此时首页显示预告卡片 `.cw-card.is-soon`，点进 `/carrier_wave/soon/`（layout `soon`，glint.css「CW 预告页」），`search.json` 不收录（`cw_hidden()`），CW 页面照常生成；Origin 首页不显示卡片。预告卡片只接 `pressable`、不预取目录页；预告页背景用「阅读页」那项模糊度，拼贴画板按 cqi 等比缩放、窄屏另一套位置。删掉该行或改 false 即恢复（预告页随之转去目录页）
- 目录页载波画布 `.cw-wave` 是 280px 高的窄带，由 cw.js 用 transform 跟随中线；阅读页标题字号按 `--len` 自动缩小
- 读者记录：读完记 localStorage `whatasiger_cw_read`（目录 `is-read`）；见过的篇目记 `whatasiger_cw_seen`，首页卡片（`data-cw-tracks`，来自 `cw_published()`）有新篇目时挂 `has-new`
- 订阅源 `/carrier_wave/atom.xml`：篇目无日期，按正文文件修改时间排
- 视觉更新前的备份在 `.backup/carrier-wave-2026-10-23/`（见 RESTORE.md）

## CI
- `.github/workflows/site.yml`：push / PR 时构建并跑 `tools/check-site.js`；部署须配 `DEPLOY_TOKEN`（只注入部署那一步，job 级只有 `HAS_DEPLOY_TOKEN`）且手动运行时勾选，部署是提交 public/ 到 Whatasiger.github.io（不强推）。**不要加定时整站部署**（源码仓库常落后于线上，会把线上改回旧版）

## 调试提示
- 无头浏览器截图时页面常卡在 loading（外部脚本），DOMContentLoaded 绑定的交互不会生效
