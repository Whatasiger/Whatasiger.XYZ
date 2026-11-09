---
title: 关于网站
date: 2026-02-20
description: 建站使用的教程和工具
cover: /images/webp/043eba537105a620.webp
---

### **数据统计（2026-04-17 始）**

<style>
#bsz-stats {
  display: none;
  gap: 1rem;
  margin: 0 0 2rem;
}
#bsz-stats.loaded { display: flex; }
.bsz-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  padding: 1.4rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  transition: transform .25s, box-shadow .25s;
}
.bsz-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.11);
}
.bsz-icon {
  font-size: 1.4rem;
  color: var(--blue);
}
.bsz-num {
  font-size: 2rem;
  font-weight: 700;
  color: var(--blue);
  line-height: 1.15;
}
.bsz-label {
  font-size: .78rem;
  color: #999;
  font-weight: 500;
  letter-spacing: .04em;
}
.dark-theme .bsz-card {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.dark-theme .bsz-label { color: #666; }
@media (max-width: 600px) {
  #bsz-stats { flex-direction: column; }
}
</style>

<div id="bsz-stats">
  <div class="bsz-card">
    <span class="bsz-icon"><i class="fa fa-eye"></i></span>
    <span class="bsz-num"><span id="busuanzi_container_site_pv" style="display:inline;"><span id="busuanzi_value_site_pv">…</span></span></span>
    <span class="bsz-label">本站访问量（PV）</span>
  </div>
  <div class="bsz-card">
    <span class="bsz-icon"><i class="fa fa-user"></i></span>
    <span class="bsz-num"><span id="busuanzi_container_site_uv" style="display:inline;"><span id="busuanzi_value_site_uv">…</span></span></span>
    <span class="bsz-label">本站访客数（UV）</span>
  </div>
</div>

<script>
(function () {
  function check() {
    var pv = document.getElementById('busuanzi_value_site_pv');
    var uv = document.getElementById('busuanzi_value_site_uv');
    if (pv && uv && pv.textContent.trim() && pv.textContent.trim() !== '…'
        && uv.textContent.trim() && uv.textContent.trim() !== '…') {
      document.getElementById('bsz-stats').classList.add('loaded');
    } else {
      setTimeout(check, 250);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }
})();
</script>

### **基本信息**

搭建：[**Hexo**](https://hexo.io)

基础主题：[**Hingle**](https://github.com/Dreamer-Paul/Hingle)

托管：[**Cloudflare Pages**](https://www.Cloudflare.com)

---

### **订阅**

<style>
.feed-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 0 1rem;
  padding: 1.1rem 1.3rem;
  border-radius: 16px;
  color: inherit;
  text-decoration: none !important;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
  transition: transform .25s, box-shadow .25s;
}
.feed-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0, 0, 0, 0.11); }
.feed-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 12px;
  font-size: 1.2rem;
  color: #fff;
  background: var(--blue);
}
.feed-text { display: flex; flex-direction: column; gap: .1rem; line-height: 1.5; }
.feed-text strong { color: var(--blue); }
.feed-text span { font-size: .85rem; opacity: .7; }
.dark-theme .feed-card {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
</style>

<a class="feed-card" href="/atom.xml"><span class="feed-icon"><i class="fa fa-rss"></i></span><span class="feed-text"><strong>订阅本站（RSS / Atom）</strong><span>加进 RSS 阅读器，有新文章时自动送到；点开查看订阅方法</span></span></a>

订阅地址：`https://whatasiger.xyz/atom.xml`（阅读器只认 RSS 2.0 时可用 [**rss2.xml**](/rss2.xml)）

---

### **版权声明**

对于转载 / 二创等：[**CC BY-NC-SA 4.0**](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)

对于 LLM 训练：[**CC0 1.0**](https://creativecommons.org/publicdomain/zero/1.0/deed.zh-hans)

---



### **建站流程**

[**成为冻鳗糕手第一步？教你零基础搭建属于自己的个人博客！丨Hexo建站经验分享**](https://www.bilibili.com/video/BV1odZYBKEQV/)

建站初期 with [**Gemini 3.1 Pro**](https://aistudio.google.com/prompts/new_chat?model=gemini-3.1-pro-preview)

~ GA 1.3 with [**Cursor**](https://cursor.com/)

GA 1.3 ~ with [**Codex**](https://chatgpt.com/zh-Hans-CN/codex/)

GA 2.0 ~ with [**Claude Code**](https://claude.com/product/claude-code)

---



### **背景图**

**[#オリジナル 窓の研究Ⅱ - banishment的插画 - pixiv](https://www.pixiv.net/artworks/68893230)**

**[#風景 新作《雨后》 - 画师JW的插画 - pixiv](https://www.pixiv.net/artworks/124089112)**

**[#オリジナル 欠片 - コーラ的插画 - pixiv](https://www.pixiv.net/artworks/118435175)**

**[#風景 新作《生之向往》 - 画师JW的插画 - pixiv](https://www.pixiv.net/artworks/144486189)**

**[#雲 夕 - 磯部トースト＠お仕事募集中的插画 - pixiv](https://www.pixiv.net/artworks/21315033)**

**[#クリック推奨 ■□廊下□■ - 磯部トースト＠お仕事募集中的插画 - pixiv](https://www.pixiv.net/artworks/6095368)**

**[#風景 错过日出可以等待，错过美景可以再来。 - 画师JW的插画 - pixiv](https://www.pixiv.net/artworks/78792385)**



---



### **文本编辑**

[**Typora**](https://typoraio.cn/)

[**Typora 免费安装教程（支持版本：1.9.5）**](https://blog.csdn.net/qq_61621323/article/details/141036982)



---



### **更新日志**

#### **Pre-alpha**（2026-02-20）

- 网站建立

---

#### **Alpha**（2026-02-21）

- 由 Github Pages 更换为 Cloudflare Pages 驱动。
- 购入专属域名。
- 修复了 about-me 界面的一个格式错误。

---

#### **Beta 1**（2026-02-22）

- 重构主页美学设计
     - 文章预览优化：标题+图片 预览，鼠标移上卡片时后显示日期、标签、简介。
     - 新增头像、个性签名
     - 新增顶栏毛玻璃效果
     - 将社交账号图标用深色胶囊框起
     - 新增顶栏左侧专属标识
     - 微调字重
     - 深色模式设为默认
     - 直接展示搜索框而非搜索图标
- 阅读体验优化
    - 阅读文章时的不透明度拉高
    - 新增「回到顶部」功能
- 点击头像、昵称可直接跳转至「关于我」界面

---

#### **Beta 2**（2026-02-22）

- 新增功能
     - 文章内字数统计和阅读时间估计
     - 搜索功能（支持搜索标签）
     - 开关灯模式记忆
     - PC 端目录可收起
- 视觉优化
     - 底栏增加毛玻璃效果
     - 开灯模式的背景不透明度调整
     - 平台账号图标显示优化
- 添加更多个人平台账号

---

#### **Beta 3**（2026-02-22）

- 修复「回到顶部」「目录」按钮被置底的 Bug
- 优化细节
     - 优化目录章节跳转不到位的问题
     - 优化主页文章卡片阴影
     - 文章之间跳转不会触发背景透明度渐变
- 加入「更新日志」板块

---

#### **RC 1**（2026-03-07）

- 新增「设置」界面
  - 可选思源黑体，调整字号、字间距、字重
  - 可调整背景可见度，或者直接隐藏背景图片
  - 可隐藏「回到顶部」按钮
- 细节优化
  - 不同文章的阅读界面现有各自的背景图
  - 优化开灯模式下，头像、ID、个性签名的显示效果
  - 将「关于网站」界面并入顶栏

---

#### **RC 2**（2026-03-12）

- 美学优化
  - 新增首页背景水波纹动画，点击触发
  - 新增鼠标移上头像时轻微放大的动画
  - 修改手机端左上顶栏展开样式
- 修复 Bug
  - 修复手机端搜索功能无作用的 Bug
  - 修复图片放大后亮度偏低的 Bug
- 文章二级链接后缀优化

---

#### **RC 3**（2026-03-29）

- 全面精简重构前端样式代码（.css），提升渲染性能。
- 图片加载体验优化
  - 由 .png 格式改为 .webp 格式，节省空间占用。
  - 图片链接到本地存放，无需图床外链。
- 阅读体验优化
  - 新增「背景模糊度」设置，可调整文章背景的高斯模糊程度。
  - 优化手机端「目录」「回到顶部」按钮显示逻辑：向上滑动时弹出按钮，向下滑动时收起到右侧边。
  - 去除较旧文章开头的提示。
  - 修复超出 60 分钟的预计阅读时间显示问题。
- 细节优化
  - 微调首页默认背景可见度、头像亮度。

---

#### **RC 3.1**（2026-04-13）
- 微调首页文章卡片圆角、动画、模糊、缩放效果。
- 修复文章内图片在深色模式下偏暗的问题。

---

#### **GA 1.0**（2026-04-17）
- 添加基于 [Twikoo](https://twikoo.js.org/) 的评论功能。
- 添加基于 [不蒜子](https://www.busuanzi.cc/) 的文章阅读量、网站访问量统计功能。

---

#### **GA 1.1**（2026-04-18）
- 修复 Bug
  - 修复首页的背景模糊度设为默认时，滑块未归位的问题。
  - 修复用户评论的头像显示错误问题。
- 新增404页面[彩蛋](www.whatasiger.xyz/404)。

---

#### **GA 1.2**（2026-04-30）
- 搜索功能已支持搜索文章内文本。
- 文章内目录界面优化
  - 高亮所在片段，可滚动跟随。
  - 桌面端可点击目录按钮收起。
  - 优化 UI 与动画的美观度。
- 其他优化：
  - 思源黑体加载速度优化。
  - 补全并优化 SEO，上线 RSS / Atom / Sitemap 订阅与索引。

---

#### **GA 1.3**（2026-05-10）
- 重新设计了设置界面的滑动条样式。
- 重新设计了 Markdown 引用 / 标注 相关的样式，支持收起。
- 改进首页背景水波纹动画。

---

#### **GA 2.0**（2026-10-03）
- 全新界面：短篇辑「CARRiER WAVE.」。
- 全新功能：包含 Bangumi 和网易云音乐的「TO DO」列表。

---

#### **GA 2.1**（2026-10-17）
- 重新设计开灯模式的配色：取色自首页背景图的天空与晚霞，告别灰蒙蒙的背景。
  - 首页头像、ID、个性签名加上柔和光晕，在背景图上更加醒目。
  - 文章页背景改为由浅蓝到暖杏的渐变，阅读更通透。
- 「TO DO」列表背景改为毛玻璃。
- 优化 Markdown 引用 / 标注 的展开与收起动画，更加顺滑。
- 将「CARRiER WAVE.」目录和全部已发布篇目加入站点地图，方便搜索引擎发现。

---

#### **GA 2.2**（2026-10-24）
- 优化了从首页进入「CARRiER WAVE.」的过渡动画。
  - 解决了突兀的字体跳变。
  - 优先反馈点击操作，动画的触发更跟手。
  - 优化了性能，减少掉帧和卡顿。
- 重新制作首页背景水波纹：画面更细腻、动画更流畅。
- 重新设计设置面板与手机端导航菜单，统一风格，优化外观。
- 修改 手机端-桌面端 的判断逻辑，以防特定条件下的元素重叠。

---

#### **Ciel**（2026-10-27）
- 从这一版起，版本以名字称呼。
- 全新的界面风格「Glint」：通透的毛玻璃、分明的层次，以及更有弹性的动画。
  - 可在设置中随时切换回改版前的界面「Origin」。
- 新功能
  - 首页右上角新增一枚小胶囊（手机端在导航里）：
    - 「背景」：从几张壁纸中挑一张作首页背景，会记住你的选择；新增五张壁纸，并注明画师与出处。
      - 也可以选「每日轮换」，每天换一张。
    - 「沉浸」：中央的卡片与叶子悄悄隐去，只留背景与水面；往下一滑就是底栏。
  - 「续读」：读到一半离开，再打开这篇时底部会提示上次读到哪里，点「继续阅读」即回到那一段。
  - 「Gizmo」：陈列随手（或认真）做出来的小玩意；入口是首页右侧水面上漂着的那片叶子，手机端在导航里。
  - 设置新增「主题色」：天青、藤紫、樱粉、蜜柑、若草、薄荷，一键改变全站的强调色。
  - 设置新增「沉浸模式」：向下滚动时收起顶栏，快速上滑才会重新出现。
  - 全新的站内搜索：
    - 每个页面都能搜，按 <kbd>/</kbd> 或 <kbd>Ctrl</kbd> + <kbd>K</kbd> 随时唤起。
    - 除了文章，也能搜到 CARRiER WAVE. 的各篇、独立页面与 Gizmo。
    - 空格隔开多个词一起搜；结果按相关程度排列，摘出命中的段落并高亮。
    - 键盘 ↑ ↓ 选择、回车打开；点开文章时，标题会一路飞到正文顶端。
  - 「归档」重新设计为时间线，按年份排列，每篇附上小封面、简介与字数；标签页同样如此，导航里多了它的入口。
  - 脚注可以就地预览：把鼠标停在脚注标号上（手机上点一下），旁边就会浮出注释，不必跳到文末再跳回来。
  - 图片可以点开放大查看：支持双指 / 滚轮缩放、拖动、左右滑动切换，下拉即可关闭。
  - 设置新增阅读排版：正文可选宋体，可调行距、段距、行宽，可开启段首缩进；中文与英文、数字之间会自动留出一点空隙。
  - 设置新增「日夜」：夜间、白天或跟随系统，会记住你的选择；顶栏的日月按钮仍可临时切换。
  - 文末新增「继续阅读」：前后两篇的卡片与几篇相关文章；点进去时，标题同样一路飞到正文顶端。
  - 「续读」更进一步：
    - 读到一半的文章，会在首页卡片与归档里显示「读到 x%」。
    - 目录会为读过的章节打勾，并提示本章还剩几分钟。
  - 新增「写作统计」页：字数、篇目、标签与写作日历一览；入口在归档页与页尾。
  - CARRiER WAVE.：
    - 读完的篇目会在目录里标为「已读」。
    - 有新的篇目时，首页卡片会亮起「新信号」。
    - 新增专属的订阅源。
  - 更新日志的旧版本默认收起；网站发布新版本后，再来访时会收到一次提示。
- 「Glint」的细节
  - 首页
    - 博主信息改为一整张毛玻璃卡片，与下方文章卡片对齐；头像周围多了一粒缓缓绕行的光点。
    - 点击座右铭可以收听这首歌。
    - 社交账号悬停时，强调框会在图标间滑动，并浮出名称。
    - 文章卡片镶上一圈细边，投影更有层次；悬停时浮起、随鼠标立体地倾斜，泛起一片柔和的光。
    - 点击文章卡片，封面会放大铺满全屏、沉为文章页的背景，标题一路飞到正文顶端。
    - 在首页拖动鼠标划水面时，不会再选中一片文字。
  - 顶栏
    - 重新设计：页顶时更通透，向下滚动后渐渐变实。
    - 导航的强调框会随鼠标在各项之间弹性滑动。
  - 文章页
    - 正文与评论分别托在两块毛玻璃上，与背景分开一层。
    - 目录重新设计：悬浮的毛玻璃卡片，竖线标出当前章节；收起后缩成右上角的「迷你目录」，点一下即展开，手机端同样适用。
    - 去掉顶部的阅读进度条与文末的版权信息块。
  - 底栏重新设计：三张毛玻璃卡片，「时光机」改为时间线，标签改为胶囊样式。
  - 「TO DO」列表重新设计：浮起的毛玻璃卡片，在看的番剧显示观看进度，展开时内容依次浮现。
  - 设置面板重新整理为「外观」「阅读」两页，比原先短了一半多。
    - 滑动条重新设计为「液态胶囊」，拖动无级、跟手；字重松手后吸附到最近一档。
    - 二选一的按钮和分页都可以按住直接拖过去选。
  - 顶栏导航同样可以按住拖动，松手即前往那一页。
  - 切换日夜模式时，新的配色会从按钮处一圈圈扩散开。
  - 「TO DO」里的网易云周榜会注明是几天前更新的。
  - 背景与卡片封面的模糊更细腻，暗处不再有色块和一圈圈的色带。
- 修复与改进
  - 加载更快、更省流量：
    - 首页卡片改用尺寸合适的封面图，往下滚到附近才加载；文章页也只提前准备屏幕上看得到的那几篇。
    - 图标、脚本与样式更精简，换页时多半直接从缓存读取。
    - 评论区快滚到时才开始加载；文中图片看到时才加载，加载前就占好位置，不再撑开跳动。
  - 拖动设置里的滑动条时不再卡顿。
  - 首页的「背景模糊」滑块改为调整文章页的模糊，不再意外把首页背景变模糊。
  - 字数改为「约 3.8 万字」这样的写法。
  - 可以把网站添加到手机主屏，图标更清晰。
  - 修复刷新或返回首页时，顶栏与背景轻微跳动的问题。
  - 从文章回到首页时，不再把背景可见度重置为默认值。
  - 修复文章页底栏与目录重叠的问题。
  - 文章标题的锚点与带锚点的分享链接恢复可用。
  - 手机端
    - 首页背景与「TO DO」标签不再随地址栏伸缩上下跳动。
    - 导航里的背景缩略图铺满排列，不再留空格。
    - 导航卡片里「归档」与「Gizmo」两块并排，更紧凑。
  - 打印文章时只保留标题与正文，不再带上浮层与背景。
