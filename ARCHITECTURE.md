# Gallery · 项目架构与工作流指引

> AI 读取本文件即可掌握项目全貌，无需重复询问。

---

## 目录分工

### D 盘：源码仓库（唯一 Git 管理入口）

```
d:\GitHub\Gallery\               ← Git 仓库根目录 → GitHub: OpenQGIS/Gallery
├── assets/
│   ├── app.js                   ← 【主逻辑源文件】所有功能修改都在这里
│   ├── style.css                ← 全局样式
│   ├── config.js                ← CDN / 资源基座配置
│   ├── theme.js                 ← 主题切换逻辑
│   ├── i18n.js                  ← 国际化
│   ├── avatar.png               ← 品牌头像
│   └── covers/                  ← 门户封面图
├── data/
│   ├── manifest.js              ← 画廊索引（JS 全局变量版）
│   └── themes.js                ← 主题色定义
├── thumbs/                      ← 缩略图 (.webp)
├── tiles/                       ← 本地 GIS 切片（不提交 Git）
├── vendor/
│   └── openseadragon.min.js     ← Deep Zoom 核心引擎
├── index.html                   ← 门户首页（data-page="portal"）
├── gis.html                     ← GIS 展厅（data-page="gis"）
├── original.html                ← 原创展厅（data-page="original"）
├── navigator-demo.html          ← 鹰眼图交互调试沙盒（长期保留）
├── CHANGELOG.md                 ← 版本更新日志
└── ARCHITECTURE.md              ← 本文件
```

### E 盘：本地预览 / 工作目录（无 Git，以 D 盘为准）

```
e:\website\Gallery\
├── app.js                       ← 源文件副本（修改须同步到 D 盘）
├── style.css                    ← 同上
├── dist\                        ← 构建/部署产物，可本地双击预览
│   ├── assets\app.js            ← 部署版 app.js（同步自 e:\website\Gallery\app.js）
│   ├── assets\style.css
│   ├── data\
│   ├── thumbs\
│   ├── tiles\
│   ├── vendor\
│   ├── index.html
│   ├── gis.html
│   └── original.html
└── pic\                         ← 原始高清图片母版（不提交）
```

---

## 工作流规范

### 修改代码的正确顺序

```
1. 编辑  d:\GitHub\Gallery\assets\app.js   （源文件）
2. 同步  Copy-Item "d:\GitHub\Gallery\assets\app.js" "e:\website\Gallery\app.js"
3. 同步  Copy-Item "e:\website\Gallery\app.js" "e:\website\Gallery\dist\assets\app.js"
4. 提交  cd d:\GitHub\Gallery
         git add assets/app.js
         git commit -m "..."
         git push origin main
```

> ⚠️ **不要先改 E 盘再手动拷回 D 盘**，容易造成两边内容偏差。始终以 D 盘为编辑起点。

### CSS 修改同理

```
d:\GitHub\Gallery\assets\style.css  →  e:\website\Gallery\style.css
                                    →  e:\website\Gallery\dist\assets\style.css
```

---

## 页面架构说明

| 页面 | data-page 值 | 路由入口 | 特点 |
|------|-------------|---------|------|
| `index.html` | `portal` | `initPortalPage()` | 门户双分屏 + 分类探索 + 随机瀑布流 |
| `gis.html` | `gis` | `initGalleryPage()` | GIS 作品网格，含顶部 `btnPrevArtwork/btnNextArtwork` |
| `original.html` | `original` | `initGalleryPage()` | 原创作品网格，同上 |

### Viewer Modal 结构差异（重要）

- **`gis.html` / `original.html`**：viewer-header 里有 `#btnPrevArtwork` / `#btnNextArtwork`
- **`index.html`**：无顶部导航按钮，切换依赖左右边缘浮动箭头 `#btnEdgePrev` / `#btnEdgeNext`

`app.js` 中的 `bindViewerModalEvents()` 已做空值守卫兼容两种结构：
```js
if (prevBtn) prevBtn.addEventListener('click', () => navigateArtwork(-1));
if (nextBtn) nextBtn.addEventListener('click', () => navigateArtwork(1));
```

---

## 资源托管

| 资源类型 | 托管位置 |
|---------|---------|
| GIS 切片 | 本地 `tiles/` 或 CDN（`config.js` 中 `gisAssetBaseUrl` 配置） |
| 原创切片 | CangFengCore 私有云 `https://cangfengcore.lidmwork.workers.dev` |
| 缩略图 | `thumbs/*.webp`（随 Git 提交） |
| 封面图 | `assets/covers/*.webp`（随 Git 提交） |

---

## 版本与分支

- 主分支：`main`
- 远端：`https://github.com/OpenQGIS/Gallery.git`
- 当前版本：见 `CHANGELOG.md`
