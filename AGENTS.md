# Whatasiger 博客

Hexo 8 静态博客，中文内容（小说/随笔/日记/评析），部署到 GitHub Pages。

## 常用命令
- `npm run server` 本地预览（只有 Glint）/ `npm run build` 生成（Glint + Origin）/ `npm run clean`
- 预览两套界面：`npm run build` 后 `npx hexo server -s`（静态模式，直接伺服 public/）
- 部署：先 `npm run build`，再 `npm run deploy`（hexo-deployer-git → Whatasiger.github.io main；随后 `tools/push-source.js` 把整个工作区提交为「部署 日期时间」并推送到源码展示仓库 Whatasiger/Whatasiger.XYZ main，工作区本身即该仓库，生成物见 `.gitignore`）—— 只在我明确要求时执行；**不要只跑 `hexo generate` 就部署**，那样 Origin 不会更新

## 界面主题：Glint / Origin
- 全站有两套界面，在设置卡片里切换：**Glint**（当前设计，`themes/glint`，站点根路径）与 **Origin**（本轮改版前的界面，`themes/origin`，取自 `blog_bak/themes/hingle`，生成在 `/origin/` 下）
- 两套是同一份内容（`source/`、`scripts/`）生成的两个站点：`tools/build-origin.js` 用 `_config.yml` + `_config.build-origin.yml`（root `/origin/`、theme origin、输出 `public/origin/`、缓存 `.origin-build/`）再生成一遍；图片只在根路径放一份（Origin 不复制 `source/images`）
- 切换逻辑在两套主题各自的 `_partial/ui-switch.ejs`（`<head>` 最前面）：选择存 localStorage `whatasiger_ui`，页面与选择不符时跳到另一套的同一路径（加 / 去 `/origin` 前缀）
- **CARRiER WAVE. 与界面主题无关**：只有 Glint 根路径下一份，Origin 构建不生成它，Origin 里指向它的链接一律写死 `/carrier_wave/`，CW 页面也不引用 ui-switch
- Origin 页面带 `noindex`，规范链接指向 Glint 同一页；订阅源 / 站点地图链接指向根路径
- 以下「主题与样式要点」除特别说明外都是 Glint 的；Origin 原则上保持改版前的样子，只为能在 `/origin/` 下工作做过必要改动（绝对路径改 `url_for`、加切换项）
- **今后若无特殊说明，所有前端改动只做在 Glint（`themes/glint`）上，Origin（`themes/origin`）不再更新**，不要顺手同步到 Origin
- Glint 原名 hingle（基于 Dreamer-Paul 的 Hingle 改写），已整体更名：目录 `themes/glint`、`glint.css` / `glint.js`、构造函数 `Glint`；对 Hingle 的署名（页尾、文件头、README、LICENSE、关于页）须保留。Origin 里的 `hingle.css` / `hingle.js` 属冻结旧版，不改名

## 结构要点
- 文章：`source/_posts/`，只用 tag 不用分类（随笔/小说/评析/特殊）
- 【特殊】短篇辑 CARRiER WAVE.：正文 `source/_carrier_wave/`，篇目 `source/_data/carrier_wave.yml`，由 `scripts/` 单独生成
- 主题：`themes/glint`（Glint，自定义 EJS；Origin 见上），样式在 `themes/glint/source/static/glint.css`（按「0 变量 / 1 夜间 / 2 页眉 / … / 8 白天配色」分节，注释风格为中文行尾注释）
- 自定义扩展在 `scripts/`：脚注、quote-box、hide-from-index、友链抓取
- 【Gizmo】小玩意陈列页 `/gizmo/`：`source/gizmo/index.md` 只有 front matter（`layout: gizmo`），模板 `themes/glint/layout/gizmo.ejs`，篇目在 `source/_data/gizmo.yml`（加东西只改数据）；站内独立的小玩意放 `source/gizmo/<名字>/`，由 `_config.yml` 的 `skip_render: gizmo/*/**` 原样输出、不套主题。Gizmo 页不算阅读页（`layout.ejs` 的 `isReading`、`header.ejs` 的 `isArticle` 都排除 `page.layout === 'gizmo'`，body 挂 `gizmo-page`），底栏只留版权信息
- 图片统一 webp，放 `source/images/webp/`；外链图转换用 `tools/external_images_to_webp.py`

## 主题与样式要点
- 主题色：全站强调色取自 glint.css 第 0 节的色阶 `--tc-ice / pale / light / glow / soft / main / dim / deep / ink / warm / warm-deep`（按明度排列，各处按用途取不同级；`--blue`、`--hd-*`、`--footer-*`、`--hero-*` 都引用它）。默认「天青」即原先的蓝，数值原样；其余主题由 `html[data-accent]` 设 `--tc-h`，整组用 OKLCH 同明度同彩度只换色相。半透明一律写 `color-mix(in srgb, var(--tc-x) N%, transparent)`，**新增样式不要再写死蓝色 hex / rgba**。设置保存在 `whatasiger_reader_settings.accent`，`header.ejs` 开头首帧前挂属性；新增主题色要同时改第 0 节与 `header.ejs` 的 `accents` 列表。CARRiER WAVE. 页面不加载 glint.css，不受主题色影响
- 日夜模式：`body.dark-theme` 为夜间；默认即夜间，仅当 sessionStorage `theme=light` 时为白天（逻辑在 `layout/_partial/header.ejs` 开头）
- 只改白天模式时，选择器统一用 `body:not(.dark-theme) …`，集中写在 glint.css 第 8 节；夜间同理用 `.dark-theme …`
- 背景图：`body:before` 伪元素，由 `--page-bg-image` / `--bg-opacity` / `--bg-blur` 控制；有 cover 的文章会把背景换成封面；阅读页加 `.bg-faded` 淡化——阅读页首帧就挂 `.bg-faded`、模糊度直接取最终值（`header.ejs`），**不要再改回进页后靠过渡变淡**：载入时主线程忙，过渡时间线照走，看起来就是亮背景硬切成灰
- 阅读页等字体：`head.ejs` 在字体样式表后给 html 挂 `page-loading`，`main` / 迷你目录 `visibility: hidden`、其中入场动画暂停在起点，思源黑体就绪（`document.fonts.ready`）后撤掉、动画从头播；超 300ms 才浮出 `body.post-page:after` 转圈，最多等 1.2s；选系统字体不等；等待期间脚本读正文文字**不要用 `innerText`**（visibility: hidden 的文字会被跳过，取到空串，目录曾因此只剩竖线），用 `textContent`；卡片一镜到底时 `post-vt.ejs` 在 pagereveal 调 `pageReveal()` 立即撤掉。样式在 glint.css「阅读页等字体」
- 顶栏字体：顶栏与导航（`header`、`.head-menu`）先用内联的思源黑体 600 子集 `Glint UI`（`_partial/ui-font.ejs`，只含站名、版本名、导航四项、Gizmo 长条、搜索框占位的字），首帧即是思源黑体；**顶栏 / 导航改字（含发版改版本名）须重新取子集**，否则新字会回退到外链字体、又出现先雅黑后思源。选了系统字体时 html 挂 `font-system`（`header.ejs` 首帧 + glint.js 设置）不用它
- 手机端滚动性能（< 600px）：
  - 背景模糊由 glint.js 的 `bgBake` 在页面载入约 1s 后用 canvas 烤进一张 blob 图，写回 `--page-bg-image` 并给 body 挂 `.bg-baked`（`body:before` 不再挂 blur 滤镜，白天的提亮 / 饱和照留）；拖模糊度滑块时先撤回 CSS 模糊预览，松手再烤。改背景层的滤镜时记得同步 `.bg-baked` / `html.bg-prebaked` 的几条规则
  - **桌面端同样烘焙**（全屏固定层挂实时模糊时，上面任何东西在动——卡片悬停、跨页过渡——GPU 每帧都要重算整屏模糊）；画布密度按模糊半径降低（`min(dpr, 4 / blur)` px / CSS px）
  - 预烤交接：首页指针移上 / 按下 / 聚焦文章卡片时 `bgBake.prebake()` 按文章页的模糊度（设置 `bgBlur`，缺省 8）把该封面烤好，以 data URL 存 sessionStorage `glint-bg-prebake`；文章页 `head.ejs` 在首帧前比对图 / 模糊度 / 视口，对得上就插入 `#bg-prebake` 样式并挂 `html.bg-prebaked`，glint.js 载入后转成普通的 `.bg-baked` 状态（不再重烤）
  - 滚动时常驻屏上的毛玻璃（顶栏、迷你目录、首页博主卡、底栏）在 glint.css 第 7 节开头统一减半模糊、去掉 saturate；新增常驻屏上的毛玻璃也照此处理
  - 根滚动：`html { overflow-x: hidden }` + `body { overflow-x: clip }`，**不要再让 html、body 同时 hidden**（body 会自成滚动盒，iOS 惯性滚动受影响）
  - glint.js 的滚动处理统一用 `onScrollFrame(fn)` 登记（一个监听、每帧最多一次）；目录高亮用 IntersectionObserver 记录标题是否越过阅读线
  - 首页水波纹的触摸：轻点激发、按住 300ms 才进入长按 / 拖拽，一滑动就作废（`water-ripple.js` 的 `TOUCH_SLOP / TOUCH_HOLD`）
- CARRiER WAVE. 一镜到底靠 `view-transition-name: cw-t-<slug>`：目录篇名、阅读页标题静态带名；文末翻页的篇名只在经它跳转时由 `carrier-wave-head.ejs` 临时挂名（否则回目录时会从页底飞出）
- 首页 → CARRiER WAVE. 目录页：首页用 speculation rules 预渲染目录页（悬停/按下卡片即开始），点击后过渡立即开始；大标题字体是内联的子集 `CW Title`（`_partial/cw-title-font.ejs`，标题改字须重新取子集）；离场时 `head.ejs` 给 html 挂 `cw-leaving` 撤掉卡片悬停态，并把卡片载波的波长/相位/振幅对准目录页画布（`cw-wave-hop`），画布在 `cw-from-home` 期间定格（时钟停住，只在载波位置 / 缩放因滚动改变时按同一时刻重画）（过渡中凡是带过渡名的元素和 root 都应保持静止，否则每帧都要重新截取快照）。首页 CW 卡片的四个过渡名只在 `html.cw-leaving`（离开去目录页）/ `html.cw-back`（从目录页回来）时挂上，常驻会让点文章卡片时也多截四张快照。目录页一侧的圆角裁切挂在 `::view-transition-image-pair(cw-stage)` 上（`cw-vt-unround`，时长 / 缓动须与组一致，`vtFlip` 会按组的缩放逐帧折算成椭圆半径）
- 目录页载波画布 `.cw-wave` 是 280px 高的窄带，由 cw.js 用 transform 跟随载波中线平移（`band` 选项），不是全屏画布
- CARRiER WAVE. 视觉更新前的备份在 `.backup/carrier-wave-2026-10-23/`（还原方法见其中 RESTORE.md）
- Quote Box 折叠动画用 grid 行高 `min-content 1fr ↔ 0fr` 实现；顶栏行必须是 `min-content`（`auto` 会在过渡中被拉高）
- 浮层卡片（设置面板、手机端导航卡片）共用 `--glass-*` 变量（第 0 节定义、第 1 节夜间覆盖）：毛玻璃 + squircle 圆角（`corner-shape`，不支持时退回普通圆角）+ 展开用 `--ease-spring`、收起用 `--ease-exit`；新增浮层沿用这套
- 顶栏导航的展开 / 收起不按宽度断点，而由 `header.ejs` 中紧跟 nav 的内联脚本实测：四个按钮居中排开会碰到左侧 Logo 或右侧搜索框 / 按钮（或宽度 < 600px）时给 html 挂 `.nav-collapsed`，导航变为汉堡按钮 + 卡片。相关 CSS 用 `html.nav-collapsed` / `html:not(.nav-collapsed)` 区分，不要再写进 600px 媒体查询；设置面板仍按 600px 切换
- 顶栏配色走 `--hd-*` 变量（挂在 body 上，因为导航 `.head-menu` 在 header 之外；第 2 节为夜间，第 8 节白天覆盖）。页顶时较透，`header:before` 是滚动后渐显的实层（`animation-timeline: scroll()`，前 160px）。桌面导航的强调框是 nav 里唯一一枚 `.head-menu-pill`，由 `header.ejs` 的脚本写 `--pill-x/--pill-w` 在各项之间滑动（缓动 `--ease-glide`，支持 `linear()` 时为带回弹的弹簧）；`.head-menu > a` 的左右 padding / margin-right 改动时须同步收起判断里的 `PAD` / `SPACE`。Logo 版本名写死在 `header.ejs` 的 `.header-logo-ver`（现为 Ciel），发版时手动改；站名与版本号靠 `text-box: trim-both cap alphabetic` 按字形中线对齐
- 沉浸模式（设置开关，`whatasiger_reader_settings.immersive`，默认关）：开启后 body 挂 `.immersive`，glint.js `setupImmersive()` 在下滑时给 html 挂 `.header-hidden`（顶栏与桌面横排导航一起收起，目录卡片 / 迷你目录上移到 1em），上滑须在 450ms 内滚过 ≥250px 才唤出（`REVEAL_WINDOW / REVEAL_DISTANCE`），离页顶 64px 内或有浮层 / 搜索时始终显示
- 带 backdrop-filter 的浮层不能放进 `<header>`（header 自身有 backdrop-filter，嵌套会让毛玻璃失效），所以设置面板放在 header 之外；手机端导航图标在主题 `_config.yml` 的 `menu_icons`
- kico.css 会给 checkbox 加 `::before/::after` 方框对勾、给 range 加 `overflow:hidden` 和 `min-height`；设置面板的开关与滑动条已针对性覆盖，新增表单控件时注意；两个浮层同时打开时由 glint.js 的 `bringToFront` 挂 `.on-top` 决定上下
- Gizmo 入口：桌面端（`html:not(.nav-collapsed)`）是首页右侧水面上的叶片 `.gizmo-leaf`（`index.ejs` + `static/gizmo-leaf.js`，图形是 `_partial/gizmo-leaf-svg.ejs`，与 Gizmo 页标题处的 `.gizmo-emblem` 共用）；顶栏导航收起时叶片隐藏，入口是导航卡片里横占一整排的 `.head-menu-gizmo`（桌面横排导航里 display:none，收起判断与强调框的当前项都要排除它）。叶片随风漂动、留尾流，靠 `window.waterRipple` 的 `drop / stroke` 激发水波、`setProbe / sample` 取叶片处水面（PBO + fence 异步读回，不阻塞 GPU）被水波推动；推力系数在 `gizmo-leaf.js` 的 CFG，注释里有实测位移。首页 → Gizmo 叶片一镜到底：`head.ejs` 的 `leaveToGizmo` 在 pageswap 给叶身挂 `gizmo-leaf` 并写 sessionStorage `gizmo-leaf-hop`，`_partial/gizmo-vt.ejs` 据此接过渡，内容在 `gizmo-from-leaf` 期间隐藏、落定后浮现（常驻的 `gizmo-leaf-in` 关掉内容的入场动画）
- 首页水波纹 `static/water-ripple.js`：WebGL2 实现，物理与渲染都在 GPU；画布 `z-index:-1` 平时隐藏，激发时把 body 底色 + `body:before` 背景图（读其实际 opacity/blur）合成为纹理，静水时与 CSS 背景一致，改动背景层叠方式时需同步这里；物理网格按 CSS px 定格宽（`minCell`），手机与桌面波速一致；波动系数 `stiffness` 必须 < 2（显式格式稳定极限），物理通道用 texelFetch 取格并钳位，否则个别手机 GPU 上会发散成满屏泛白
- CARRiER WAVE. 阅读页标题字号取 `min(原 clamp, 200cqi / --len)`，`--len` 由 reader 模板按字数（序号折算 1.5 字）写入，长标题自动缩小以保持篇名与序号同行居中
- 首页博主信息（`index.ejs` 的 `.home-hero` + `_partial/social.ejs`）：一整张毛玻璃卡片，宽度 / 圆角 24px / 投影与下方文章卡片一致；头像在顶端居中，ID / 座右铭 / 社交图标依次居中纵排（头像链接 `display: contents`，头像与 ID 各占一行）。卡片自身有 backdrop-filter，里面的元素不能再用毛玻璃（名称标签用实色底）。配色走 `--hero-*`（第 3 节夜间，第 8 节白天）。座右铭文字写在 `index.ejs` 顶部的 `motto` 变量，隐形整句与打字文字叠在同一格，打字时行高不跳。社交图标是 SVG 遮罩 + `currentColor`（新增图标照 `.fa-xxx-icon` 写 `mask-image`）；社交栏的强调框 / 名称标签与顶栏导航强调框同一套做法（`social.ejs` 内联脚本写 `--x/--w`）。入场动画必须挂在玻璃元素自身：祖先透明度 < 1 时其中的 backdrop-filter 会失效；`.home-title` 归档页也在用，首页专属样式一律限定 `.home-hero`
- 文章卡片一镜到底（只做首页 → 文章）：卡片本身是 `<a>`（标题只是 `<span>`），首页用 speculation rules 对卡片 **prerender**（指针停留 / 按下即开始，点击后过渡立即开始），另有一条 `immediate` 的 **prefetch** 在首页载入后就预取所有卡片文章页的 HTML（预渲染没跑完就点下去时不必再等网络）；为此不蒜子由 `footer.ejs` 在页面真正打开（`document.prerendering` 为假 / `prerenderingchange`）后才加载，预渲染中的 bgBake 立即烘焙。新增有副作用的脚本（计数、上报）同样要等激活。按下卡片即挂 `is-pressed`（微沉；文章卡片同时开始放大、模糊），与 CW 卡片同一套 `pressable()`。首页 `pageswap`（`head.ejs` 的 `leaveToPost`）只给被点那张挂 `post-cover` / 其标题文字 `span`（行内块，盒子只包住文字）挂 `post-title`，html 挂 `post-leaving`（封面定格在悬停的模糊态；投影 `.post-card-shadow`、高光与细边 `.post-card-light`、摘要信息 `.post-card-info` 分别挂 `post-shadow` / `post-light` / `post-info`，保持原样，由 `vtFlip` 的 `follow` 跟着封面放大、前段渐隐，不在点击瞬间消失）；文章页 `_partial/post-vt.ejs` 声明 `@view-transition`，确认来自首页（含分页）后挂 `vt-from-card`，`post.ejs` 顶部的全屏**空层** `.vt-cover`（平时 display:none）接 `post-cover`、正文 `h2`（inline-block）接 `post-title`。封面全程只放大那张模糊的卡片快照（新页一侧不画大图，省去每帧重绘），末段淡出露出最终背景；其余离开文章页的跳转一律 skip。文章页 head 里的 `<link rel="expect" href="#vt-post-title" blocking="render">` 不能删：首帧须等正文标题解析完，否则新页快照里还没有 `.vt-cover` 与标题，配不上对，只剩整页淡入淡出。过渡期间 `body:before` 去掉 transition，背景直接落到阅读状态，封面组淡出时露出的就是最终画面。文章封面背景改由 `head.ejs` 服务端直接写进 `--page-bg-image`（「关于网站」除外），不再由 post.ejs 脚本设置。编排在 glint.css「文章卡片一镜到底」。从卡片进来时 html 另挂常驻的 `vt-card-in` 关掉标题区自带的入场动画（带过渡名的元素须静止），评论（Twikoo）等 `window.vtSettled`（过渡结束）后才加载，不与过渡抢主线程
- 跨页面过渡的形变走合成线程：`_partial/vt-flip.ejs` 定义 `vtFlip(vt, { 名字: { old, new, radius } })`（首页、文章页、CW 页的 head 都引入，须在各自的 pagereveal 脚本之前）。浏览器默认的组动画同时动画 width / height，只能在主线程跑，新页面一忙就掉帧；`vtFlip` 在 ready 时取消原组动画，新建只动 transform 的动画（组固定终点尺寸 + 非等比缩放，快照按 auto / fill / cover 反向缩放，按缓动逐帧取样成线性关键帧），与原动画逐帧一致。**不要改成 `setKeyframes` 原地改写**：合成动画等待启动的那几帧会沿用旧样式，组停在旧尺寸上与快照错位。调用处给每个名字写上新页面对应元素的选择器 `el`：过渡期间逐帧量它，一移动（滚动、版面变化）就按新终点重建动画、沿用旧动画的 `startTime` 接着播（与原生追随实时位置一致；**不要改用 `currentTime` 接续**，新动画等合成线程启动的几帧会停住，连续重建会越拖越慢）。`el` 也可以是返回屏幕矩形的函数，只改终点不改组的盒子（CW 载波用 cw.js 的 `cwCarrierRect`：吸顶后的位置与缩小的振幅）；带过渡名的新元素仍应尽量静止（入场动画须关掉），新加过渡名时同步写上快照的显示方式与 `el`。只在旧页存在的层可写 `{ follow: 领头名, how: 'box' | 'content' }` 跟着领头组的轨迹走（box 随盒子伸缩，content 等比缩放、中心随盒子）
- 正文首帧只排屏幕附近的段落：阅读页正文的直接子 `p` 带 `content-visibility: auto`（glint.css 第 0 节「首帧只排屏幕附近的段落」），过渡落定（`vtSettled`）后 glint.js 空闲时给正文挂 `.is-laid-out` 撤掉它、整篇排好。长文（上千段）首次整篇排版要 0.5–1s+，不这样做首帧、预渲染完成与一镜到底的开始都得等它；但不能常驻——按估计高度占位时目录 / 脚注跳转会落错位置。实测（本地、长文 posts/5）点击到过渡开始：未预渲染 ~2s → <0.1s，已预渲染 ~0.4–0.6s → <0.1s。跨页过渡诊断（`vt-debug.ejs`）的 `ready` 记的是 pagereveal 到过渡开始的毫秒数
- 有目录的阅读页由 `layout.ejs` 在服务端给 body 挂 `has-trees`（判断与 glint.js `tree()` 一致：正文脚注之外有标题），首帧即让出目录位置，一镜到底的标题不会途中横移；glint.js 以实际标题为准，没有就撤掉
- 首页卡片悬停只动 transform / opacity（合成线程），不要再过渡 `box-shadow`、`filter`、渐变位置：
  - 投影：`::before`（静止，`--card-shadow`）与 `::after`（悬停，`--card-shadow-hover`）交叉淡化——文章卡片画在单独的 `.post-card-shadow` 上（一镜到底时要单独成层），CW 卡片画在卡片自身；卡片本身**不裁切**（`overflow` 可见），需要裁切的 `.post-card-bg`、`.post-card-overlay` 各自带圆角裁切。上浮用独立的 `translate` 属性
  - 封面：`.post-card-bg > .post-card-zoom > .post-card-img ×3`（原图、`.post-card-soft` 3px 轻模糊、`.post-card-blur` 10px 模糊压暗），整组放大，两层模糊按原弹簧曲线换算的 `linear()` 缓动接力淡入（单层交叉淡入前段会透出清晰细节）。两层模糊由 glint.js `setupCardBlur()` 用 canvas 烤成小图（`.is-baked`），没烤好时退回静态 CSS filter。**图片只写在元素的内联 `background-image` 上**，不要经 CSS 变量传 `url()`：过渡中每次样式重算都会被当成换了图，合成层逐帧重绘
  - 封面卡片：`.post-card-light`（自带圆角裁切）的 `::after` 是 mask 挖空的 1px 上亮下暗细边；其中的 `.post-card-sheen` 是悬停高光（背景为顶部天光，其中的光斑 `.post-card-spot` 由 glint.js 创建，只用 transform 移到指针处、按到最远角的距离缩放）。倾斜由 `setupCardFloat()` 的弹簧逐帧写内联 `transform: perspective(1000px) rotateX() rotateY()`（仅精确指针、未要求减少动效时）；配色变量白天在第 8 节覆盖
- 阅读页（`body.post-page`，即文章与独立页面）玻璃底板：正文（模板里包在 `.reading-sheet` 中：标题 / 正文 / 标签）与评论区 `.post-comments` 各一块，中间留空；玻璃画在两者的 `::before` 上（z-index -1，两者不建立层叠上下文）。**不要给 `.wrap`、`.reading-sheet`、`.post-comments` 本身加 backdrop-filter / filter / transform / 透明度动画**——目录 `.article-list`（position: fixed）挂在 `.wrap` 里会错位，正文里的毛玻璃元素会嵌套失效，祖先透明度 < 1 时玻璃会失去模糊。`.wrap` 最大宽度 = 50em + 两侧玻璃内边距，正文行宽不变。配色走 `--sheet-*`（第 4 节夜间，第 8 节白天）。**手机端（≤ 599px）不用玻璃底板**（两侧描边干扰阅读，按用户要求去掉），正文与评论直接铺在背景上。文末的作者 / 版权信息块已按用户要求删除
- 文章目录 `.article-list`（glint.js `tree()` 生成：`.article-list-head` 标题栏 + `.article-list-body` 滚动列表）：外层是 `--glass-*` 毛玻璃卡片，列表是左侧细竖线轨道式（当前章节点亮自己那段轨道 + 加粗，子章节缩进成自己的轨道、所属章节激活时展开），配色走 `--toc-*`。桌面端有目录时只给 `main` 和 `footer` 加 `padding-right` 让位（**不要再用 body 的 margin-right**：body 有 overflow-x: clip，底栏会被截成与目录重叠的一截）；收起后卡片缩进右上角的迷你目录 `.toc-mini`（短横线代表一级章节，当前章节亮起，点击展开），桌面端不再显示右下角的目录开关。手机端同理：平时右上角（顶栏下方）露出迷你目录，点击从右上角展开铺满屏宽的卡片，点章节 / 卡片外 / 收起按钮即缩回；右下角的目录开关 `.toggle-list` 已不再显示（glint.js 仍会创建它，放进 footer 的 `.buttons`，CSS 整组隐藏）。「回到顶部」按钮以及设置里的「显示回到顶部」「隐藏背景图片」开关已按用户要求删除，不要再加回
- 底栏（`_partial/footer.ejs`）：footer 底板自带 backdrop-filter，里面三张 `.footer-card` 不再嵌套模糊，只靠半透明渐变 + 内高光 + 投影分层；配色全走 `--footer-*` 变量（第 5 节为夜间，第 8 节白天覆盖）。卡片入场用滚动驱动动画改 `translate`/`scale` 独立属性，悬停用 `transform`，两者不能混用同一属性
- 无头浏览器截图时页面常卡在 loading（外部脚本），DOMContentLoaded 绑定的交互不会生效

## 更新日志
- 写在 `source/about-website/index.md` 最底部，格式：`---` 分隔 + `#### **版本名**（YYYY-MM-DD）`（自 Ciel 起版本以名字称呼，之前是 GA x.y） + 简短中文列表（可二级缩进），口吻面向读者、不写实现细节。可参考学习近几次更新日志的措辞

## 文章 front matter 约定
title / abbrlink（数字短链）/ alias / tag / cover / description / hideIndex: true（不上首页）

## 规则
- 不要改动文章正文内容，除非我明确要求（这是我的创作）
- `public/`、`.deploy_git/`、`db.json` 是生成物，不要编辑
- 若在工作过程中，以上描述内容存在变化，或有新增值得注意的要点，可以添加或修改该 AGENTS.md。对于代码内的注释同理
