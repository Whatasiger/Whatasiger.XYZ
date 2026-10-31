# Whatasiger.XYZ

[Whatasiger](https://whatasiger.xyz) 的个人博客源码 —— 小说、随笔、日记、评析。

基于 [Hexo 8](https://hexo.io) 生成，部署在 GitHub Pages（[Whatasiger.github.io](https://github.com/Whatasiger/Whatasiger.github.io)）。

## 站点里有什么

- **文章**：小说、随笔、日记与评析，按标签归类
- **CARRiER WAVE.**：短篇辑，有自己独立的目录页与阅读页（[/carrier_wave/](https://whatasiger.xyz/carrier_wave/)）
- **Gizmo**：小玩意陈列页（[/gizmo/](https://whatasiger.xyz/gizmo/)），其中有小游戏《一叶》
- **两套界面**：当前的 **Glint**，以及改版前的 **Origin**（`/origin/`），可在设置里随时切换

## 目录结构

```
source/
  _posts/          文章
  _carrier_wave/   CARRiER WAVE. 正文
  _data/           篇目与配置数据（CARRiER WAVE.、Gizmo、背景、音乐、友链等）
  gizmo/           Gizmo 页与其中的独立小玩意（原样输出，不套主题）
  images/webp/     图片（统一 webp）
themes/
  glint/           当前界面主题
  origin/          改版前的界面（冻结，不再更新）
scripts/           Hexo 扩展：脚注、Quote Box、首页隐藏、友链抓取、静态资源版本号等
tools/             构建与维护脚本：Origin 构建、图片转 webp、背景缩略图、关卡求解器等
```

## 本地运行

需要 Node.js（推荐 20 及以上）。

```bash
npm install
npm run server        # 本地预览（只有 Glint）：http://localhost:4000
npm run build         # 完整生成 Glint + Origin 到 public/
npx hexo server -s    # 生成后以静态模式预览两套界面
npm run clean         # 清理生成物与缓存
```

> 部署前请用 `npm run build`，只跑 `hexo generate` 不会更新 Origin。

## 写文章

文章放在 `source/_posts/`，front matter 约定：

```yaml
---
title: 标题
abbrlink: 12          # 数字短链，生成 /posts/12/
tag: 随笔             # 随笔 / 小说 / 评析 / 特殊
cover: /images/webp/xxx.webp
description: 摘要
hideIndex: true       # 可选：不在首页显示
---
```

## 主题

- **Glint**（`themes/glint`）基于 Dreamer-Paul 的 [Hingle](https://github.com/Dreamer-Paul/Hingle) 大幅改写：毛玻璃卡片、多种主题色、日夜模式、阅读页目录与续读、沉浸模式、首页水波纹、跨页一镜到底过渡等。详见 [themes/glint/README.md](themes/glint/README.md)
- **Origin**（`themes/origin`）保留改版前的样子

## 版权与许可

- **文章内容**：未注明转载的文章均为原创，采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) 授权，转载请注明来源
- **主题代码**：Glint 与 Origin 沿用 Hingle 的 [MIT 协议](themes/glint/LICENSE)，保留原作者版权声明

## 致谢

- [Hexo](https://hexo.io)
- [Hingle](https://github.com/Dreamer-Paul/Hingle) / [Kico Style](https://github.com/Dreamer-Paul/Kico-Style)（Dreamer-Paul）
- [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
