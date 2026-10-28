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

[**#オリジナル 窓の研究Ⅱ - banishment的插画 - pixiv**](https://www.pixiv.net/artworks/68893230)



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
  - 首页
    - 博主信息改为一整张毛玻璃卡片，与下方文章卡片对齐；头像周围多了一粒缓缓绕行的光点。
    - 点击座右铭可以收听这首歌。
    - 社交账号悬停时，强调框会在图标间滑动，并浮出名称。
    - 文章卡片镶上一圈细边，投影更有层次；悬停时浮起，随鼠标微微倾斜、泛起光泽。
    - 点击文章卡片，封面会放大铺满全屏、沉为文章页的背景，标题一路飞到正文顶端。
    - 文章卡片支持中键 / Ctrl + 点击在新标签页中打开。
  - 顶栏
    - 重新设计：页顶时更通透，向下滚动后渐渐变实。
    - 导航的强调框会随鼠标在各项之间弹性滑动。
    - 日夜切换改为太阳 / 月亮图标；设置齿轮在打开时转动。
  - 文章页
    - 正文与评论分别托在两块毛玻璃上，与背景分开一层。
    - 目录重新设计：悬浮的毛玻璃卡片，竖线标出当前章节；收起后缩成右上角的「迷你目录」，点一下即展开，手机端同样适用。
    - 去掉顶部的阅读进度条与文末的版权信息块。
    - 修复页面底部底栏与目录重叠的问题。
  - 底栏重新设计：三张毛玻璃卡片，「时光机」改为时间线，标签改为胶囊样式。
  - 设置新增
    - 「主题色」：天青、藤紫、樱粉、蜜柑、若草、薄荷，一键改变全站的强调色。
    - 「沉浸模式」：向下滚动时收起顶栏，快速上滑才会重新出现。
- 新增「Gizmo」：陈列随手（或认真）做出来的小玩意；入口是首页右侧水面上漂着的那片叶子，手机端在导航里。
- 「CARRiER WAVE.」：悬停同名篇目时，驶过的信号不再让平直的载波起伏。
