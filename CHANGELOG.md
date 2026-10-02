# Changelog · 典藏画廊 (Gallery)

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范，版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)。

---

## [1.2.1] - 2026-10-03

### 特性与交互升级 (Features & Interaction Enhancements)
- **全功能高精交互式鹰眼图系统与四层防撞避让体系 (High-Precision Interactive Navigator & 4-Tier Collision Dodge)**：
  - **左下角纯净锚定**：鹰眼图挂载至左下角，去除常驻冗余文字，全靠悬停弹窗呈现操作指引，按 `O`/`M` 键快速开合；
  - **光学反色虚线画框缩放**：拖拽画框实时以 `mix-blend-mode: difference` 光学反色显示，松手平滑缩放至指定画框选区，单击快速平移；
  - **全貌自适应隐框**：全图状态自动隐藏 `.displayregion`，放大局部时自动呈现；
  - **液态玻璃收起胶囊**：收起后化为液态玻璃胶囊，悬停显示【按 O 键再次打开鹰眼图】气泡；
  - **四层防碰撞动态避让**：中屏自动错层抬高至 `bottom: 84px`，移动端默认胶囊化并适配 Safe Area，彻底解决与居中底栏的重叠冲突；
  - **调试沙盒保留**：保留 `navigator-demo.html` 作为长期交互调试实验室。

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
