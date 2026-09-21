/**
 * Gallery · 中央画廊门户配置
 *
 * 挂载与隔离安全逻辑：
 * 1. 个人原创作品：超高清切片物理隔离于 CangFengCore 私有云端，由系统统一索引 Cloudflare CDN (https://cangfengcore.lidmwork.workers.dev)。
 * 2. 网上 GIS 作品：在 main 分支优先读取本地 tiles/ 瓦片；在 website 分支解耦通过 CDN 挂载。
 */
window.GALLERY_CONFIG = {
  // 本地/全量分支保持空字符串，直接读取相对路径 tiles/
  gisAssetBaseUrl: '',

  // CangFengCore 私有云端切片基座
  cangfengCoreUrl: 'https://cangfengcore.lidmwork.workers.dev',

  // 外部子库友好直达导航
  cabinetUrl: 'https://github.com/OpenQGIS/Cabinet',
  cangfengUrl: 'https://github.com/OpenQGIS/CangFeng'
};
