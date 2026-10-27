# img2webp

把指定目录下的 `.jpg` / `.jpeg` / `.png` 批量转成 `.webp`，原图保留。

## 使用

```powershell
# 转换默认目录（仓库根的 source/images/webp）
node tools/img2webp/img2webp.js

# 或者指定其他目录
node tools/img2webp/img2webp.js "E:\some\folder"
```

首次运行会自动在本目录安装 `sharp`，之后离线也能用。
本工具特意放在 `tools/` 而非 `source/` 下，避免 `node_modules` 被 Hexo 当作站点资源拷进 `public/` 并部署上线。
