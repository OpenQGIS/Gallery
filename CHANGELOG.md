# Changelog · 典藏画廊 (Gallery)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范，版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)。

---

## [1.2.0] - 2026-09-21

### 变更 (Changed)
- **接入 CangFengCore 私有云端切片基座 (CangFengCore Integration)**：
  - 在 `assets/config.js` 中确立双轨挂载模型：原创作品超高清切片物理隔离于 `CangFengCore` 私有云端（`https://cangfengcore.lidmwork.workers.dev`），GIS 测绘作品支持本地或 CDN 优雅自适应。
  - 增强 `.gitignore` 规则，坚决防止大体积或私有切片母版意外提交。
- **元数据与分类管道统一**：
  - 规范化馆藏成果分类、解析度定义及主调色板萃取机制。

---

## [1.1.0] - 2026-09-21

### 新增 (Added)
- **Deep Zoom WebP 原生格式支持**：
  - 在 OpenSeadragon 引擎初始化前注入 `setImageFormatsSupported({ webp: true })`，确保高压缩率 WebP 瓦片极速渲染。
- **全景分类探索器 (Taxonomy Explorer) & 随机发现流 (Masonry Stream)**：
  - 新增首页分类聚合卡片，直达横幅、条幅与专题分类。
  - 新增全屏无缝平铺瀑布流与单屏视窗展台。

---

## [1.0.0] - 2026-09-20

### 新增 (Added)
- **中央画廊聚合门户初始发布 (Aggregator Portal Initial Release)**：
  - 首页三维视差双卡片导流设计（分别通往原创空间工造《藏锋录》与空间制图遥感《珍奇柜》）。
  - 支持单列聚焦与双列并置对比布局（Dual Gallery Layout）。
  - 纯原生 HTML5/CSS3/ES6 架构，支持全平台深浅主题即时响应。
