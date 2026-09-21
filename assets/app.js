/**
 * Collection Gallery Application (v1.5.0)
 * Rijksmuseum Aesthetic · WebP DeepZoom Viewer
 * Multi-Page Split Architecture: Portal (index.html), GIS (gis.html), Original (original.html)
 * Zero-Emoji · High-Precision SVG · Design Tokens Architecture
 */

(function () {
  'use strict';

  // Global State
  let galleryItems = [];
  let currentFilteredItems = [];
  let currentViewerIndex = -1;
  let osdViewer = null;

  // Portal Specific State
  let portalSourceFilter = 'all';
  let portalDimFilter = 'all';
  let portalSubFilter = null;
  let portalRandomSelection = [];
  let streamSourceFilter = 'all';

  const pageMode = document.body.dataset.page || 'gallery';

  const SVG_EXIT_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
  const SVG_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SVG_ZOOM = '<svg class="icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

  // Initialize
  async function init() {
    bindAntiTheft();

    if (window.GALLERY_MANIFEST) {
      setupData(window.GALLERY_MANIFEST);
      routePage();
      return;
    }

    try {
      const res = await fetch('data/manifest.json');
      if (!res.ok) throw new Error('Manifest not found');
      const data = await res.json();
      setupData(data);
      routePage();
    } catch (err) {
      console.error('Failed to load gallery manifest:', err);
      const grid = document.getElementById('galleryGrid') || document.getElementById('randomGalleryGrid');
      if (grid) {
        grid.innerHTML = '<div style="padding: 24px; color: #ff5555; font-family: var(--font-mono); font-size: 0.85rem;">' +
          '[Error] 无法读取画廊索引 (data/manifest.json)，若为本地双击打开，请确保已生成 data/manifest.js。</div>';
      }
    }
  }

  const CANGFENG_CORE_CDN = 'https://cangfengcore.lidmwork.workers.dev';

  function setupData(rawItems) {
    galleryItems = rawItems.map((item, idx) => {
      item.globalIndex = idx;
      if (item.category === 'original') {
        // 个人原创作品：瓦片统一从 CangFengCore 私有云基座拉取，物理隔离本地切片防泄密
        if (item.tileUrl && !item.tileUrl.startsWith('http')) {
          item.tileUrl = CANGFENG_CORE_CDN + '/' + item.tileUrl.replace(/^\/+/, '');
        }
        if (item.dzi && item.dzi.Image && item.dzi.Image.Url && !item.dzi.Image.Url.startsWith('http')) {
          item.dzi.Image.Url = CANGFENG_CORE_CDN + '/' + item.dzi.Image.Url.replace(/^\/+/, '');
        }
      }
      return item;
    });
  }

  function routePage() {
    if (pageMode === 'portal') {
      initPortalPage();
    } else {
      initGalleryPage();
    }
  }

  /* -------------------------------------------------------------
     1. Portal Page (index.html)
     ------------------------------------------------------------- */
  function initPortalPage() {
    const totalCount = galleryItems.length;
    const gisItems = galleryItems.filter(i => i.category === 'gis');
    const originalItems = galleryItems.filter(i => i.category === 'original');

    // Update Header and Portal Card Counters
    const totalEl = document.getElementById('collectionCount');
    const breakdownEl = document.getElementById('collectionBreakdown');
    const portalGisCountEl = document.getElementById('portalGisCount');
    const portalOrigCountEl = document.getElementById('portalOriginalCount');
    const randomTotalCountEl = document.getElementById('randomTotalCount');

    if (totalEl) totalEl.textContent = totalCount;
    if (breakdownEl) breakdownEl.textContent = 'GIS ' + gisItems.length + ' · 原创 ' + originalItems.length;
    if (portalGisCountEl) portalGisCountEl.textContent = gisItems.length + ' 幅馆藏';
    if (portalOrigCountEl) portalOrigCountEl.textContent = originalItems.length + ' 幅馆藏';
    if (randomTotalCountEl) randomTotalCountEl.textContent = totalCount;

    // Smooth Scroll Hint to Explore Section
    const scrollHint = document.getElementById('scrollHint');
    if (scrollHint) {
      scrollHint.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('exploreSection');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Taxonomy Category Chips (Clicking highlights and filters random stream, clicking thumb opens Deep Zoom)
    const taxonomyChips = document.querySelectorAll('.taxonomy-card-chip');
    taxonomyChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        // If clicking on the representative thumbnail, open that artwork directly in Deep Zoom
        const thumbWrap = e.target.closest('.chip-thumb-wrap');
        if (thumbWrap) {
          e.stopPropagation();
          const artId = chip.dataset.artworkId;
          const targetItem = galleryItems.find(i => i.id === artId);
          if (targetItem) {
            openViewerByItem(targetItem);
            return;
          }
        }

        const sub = chip.dataset.sub;
        const cat = chip.dataset.category;

        if (chip.classList.contains('active')) {
          // Toggle off
          chip.classList.remove('active');
          portalSubFilter = null;
          portalSourceFilter = 'all';
          updateSourceChips('all');
        } else {
          taxonomyChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          portalSubFilter = sub;
          portalSourceFilter = cat || 'all';
          updateSourceChips(portalSourceFilter);
        }

        shuffleAndRenderPortal(true);

        // Smoothly scroll to random discovery stream
        const randomSec = document.getElementById('randomSection');
        if (randomSec) {
          randomSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chip.click();
        }
      });
    });

    // Dimension Quick Filters
    const dimChips = document.querySelectorAll('[data-dim]');
    dimChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dimChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        portalDimFilter = chip.dataset.dim;
        shuffleAndRenderPortal(true);
      });
    });

    // Source Filter Chips (All / GIS / Original)
    const sourceChips = document.querySelectorAll('[data-source]');
    sourceChips.forEach(chip => {
      chip.addEventListener('click', () => {
        updateSourceChips(chip.dataset.source);
        portalSourceFilter = chip.dataset.source;
        portalSubFilter = null;
        // Uncheck taxonomy chips
        taxonomyChips.forEach(c => c.classList.remove('active'));
        shuffleAndRenderPortal(true);
      });
    });

    // Shuffle Button (换一批)
    const btnShuffle = document.getElementById('btnShuffleRandom');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        shuffleAndRenderPortal(false);
      });
    }

    // Initial Random Recommendation Render
    shuffleAndRenderPortal(false);

    // Bind Viewer Modal for Index page
    bindViewerModalEvents();

    // Bind Fullscreen Stream Modal
    bindStreamModalEvents();

    // Bind Native Linkless Navigation (彻底消除浏览器左下角 URL 悬停提示气泡)
    setupDataHrefNavigation();

    // Enable Fullpage Snap Scrolling & Dot Pagination
    setupPortalScrollSnap();
  }

  function setupDataHrefNavigation() {
    document.querySelectorAll('[data-href]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const url = el.dataset.href;
        if (!url) return;
        if (e.ctrlKey || e.metaKey || e.button === 1) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const url = el.dataset.href;
          if (url) window.location.href = url;
        }
      });
    });
  }

  function setupPortalScrollSnap() {
    const heroEl = document.getElementById('heroSection');
    const exploreEl = document.getElementById('exploreSection');
    const randomEl = document.getElementById('randomSection');
    if (!heroEl || !exploreEl || !randomEl) return;

    const sections = [heroEl, exploreEl, randomEl];
    const navDots = document.querySelectorAll('.page-nav-dot');
    const headerHeight = 56;

    function getSnapY(el) {
      if (el === heroEl) return 0;
      return Math.max(0, el.offsetTop - headerHeight);
    }

    // Dot click navigation
    navDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = dot.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          window.scrollTo({
            top: getSnapY(targetEl),
            behavior: 'smooth'
          });
        }
      });
    });

    // IntersectionObserver to keep active dot synchronized
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) {
            navDots.forEach((dot, dIdx) => {
              dot.classList.toggle('active', dIdx === idx);
            });
          }
        }
      });
    }, {
      threshold: 0.35
    });

    sections.forEach(sec => observer.observe(sec));

    // Wheel event snap controller (单次滚轮即平滑翻页定位)
    let isSnapping = false;
    let snapLockTimer = null;

    function executeSnap(targetY) {
      isSnapping = true;
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
      clearTimeout(snapLockTimer);
      snapLockTimer = setTimeout(() => {
        isSnapping = false;
      }, 650);
    }

    window.addEventListener('wheel', (e) => {
      // Don't interfere if Deep Zoom viewer or Fullscreen Stream Modal is open
      const viewerModal = document.getElementById('viewerModal');
      if (viewerModal && viewerModal.classList.contains('open')) return;

      const streamModal = document.getElementById('streamModal');
      if (streamModal && streamModal.classList.contains('open')) return;

      // Ignore small trackpad drift
      if (Math.abs(e.deltaY) < 25) return;

      const currentY = window.scrollY;
      const exploreY = getSnapY(exploreEl);
      const randomY = getSnapY(randomEl);

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (currentY < exploreY - 80) {
          // From Hero -> Snap to Explore
          e.preventDefault();
          if (!isSnapping) executeSnap(exploreY);
        } else if (currentY >= exploreY - 80 && currentY < randomY - 80) {
          // From Explore -> Snap to Random
          e.preventDefault();
          if (!isSnapping) executeSnap(randomY);
        }
      } else {
        // Scrolling UP
        if (currentY >= randomY - 80) {
          // From Random -> Snap back to Explore
          e.preventDefault();
          if (!isSnapping) executeSnap(exploreY);
        } else if (currentY > 60 && currentY <= exploreY + 80) {
          // Inside Explore -> Snap back to Hero
          e.preventDefault();
          if (!isSnapping) executeSnap(0);
        }
      }
    }, { passive: false });

    // Keyboard PageUp / PageDown support
    window.addEventListener('keydown', (e) => {
      const viewerModal = document.getElementById('viewerModal');
      if (viewerModal && viewerModal.classList.contains('open')) return;

      const streamModal = document.getElementById('streamModal');
      if (streamModal && streamModal.classList.contains('open')) return;

      const currentY = window.scrollY;
      const exploreY = getSnapY(exploreEl);
      const randomY = getSnapY(randomEl);

      if (e.key === 'PageDown') {
        if (currentY < exploreY - 60) {
          e.preventDefault();
          executeSnap(exploreY);
        } else if (currentY < randomY - 60) {
          e.preventDefault();
          executeSnap(randomY);
        }
      } else if (e.key === 'PageUp') {
        if (currentY > randomY - 60) {
          e.preventDefault();
          executeSnap(exploreY);
        } else if (currentY > 60) {
          e.preventDefault();
          executeSnap(0);
        }
      }
    });
  }

  function updateSourceChips(sourceVal) {
    const sourceChips = document.querySelectorAll('[data-source]');
    sourceChips.forEach(chip => {
      if (chip.dataset.source === sourceVal) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function shuffleAndRenderPortal(keepFullPool = false) {
    let pool = [...galleryItems];

    // Filter by source
    if (portalSourceFilter === 'gis') {
      pool = pool.filter(i => i.category === 'gis');
    } else if (portalSourceFilter === 'original') {
      pool = pool.filter(i => i.category === 'original');
    }

    // Filter by subcategory
    if (portalSubFilter) {
      pool = pool.filter(i => (i.subCategory && i.subCategory.includes(portalSubFilter)));
    }

    // Filter by dimension
    if (portalDimFilter === 'wide') {
      pool = pool.filter(i => i.aspectRatio >= 1.2);
    } else if (portalDimFilter === 'tall') {
      pool = pool.filter(i => i.aspectRatio <= 0.8);
    } else if (portalDimFilter === 'hd') {
      pool = pool.filter(i => ((i.width * i.height) >= 10000000));
    }

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Populate Section 3 Showcase Preview Track with 4 diverse cards
    const previewTrack = document.getElementById('randomPreviewTrack');
    if (previewTrack) {
      previewTrack.innerHTML = '';
      const previewItems = pool.slice(0, 4);
      if (previewItems.length < 4) {
        for (const item of galleryItems) {
          if (!previewItems.includes(item)) previewItems.push(item);
          if (previewItems.length >= 4) break;
        }
      }
      previewItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'random-preview-card';
        card.style.cursor = 'pointer';
        card.title = '点击全屏深览 · ' + escapeHtml(item.title);
        card.innerHTML = '<img class="random-preview-img" src="' + item.thumb + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />';
        card.addEventListener('click', () => {
          openViewerByItem(item);
        });
        previewTrack.appendChild(card);
      });
    }

    const poolBadge = document.getElementById('randomPoolBadge');
    if (poolBadge) {
      if (portalSubFilter) {
        poolBadge.textContent = '专题【' + portalSubFilter + '】· ' + pool.length + ' 幅';
      } else if (portalSourceFilter !== 'all') {
        poolBadge.textContent = (portalSourceFilter === 'gis' ? '网上GIS' : '原创设计') + ' · ' + pool.length + ' 幅';
      } else {
        poolBadge.textContent = '全库 ' + galleryItems.length + ' 幅';
      }
    }

    // Sync stream source filter with portal filter
    streamSourceFilter = portalSourceFilter;
    updateStreamSourceChips(streamSourceFilter);
    renderStreamModal(false);
  }

  /* -------------------------------------------------------------
     Fullscreen Random Masonry Stream Modal Logic
     ------------------------------------------------------------- */
  function openStreamModal(source = null) {
    const modal = document.getElementById('streamModal');
    if (!modal) return;
    if (source) {
      streamSourceFilter = source;
      updateStreamSourceChips(source);
    }
    renderStreamModal(false);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const body = document.getElementById('streamBody');
    if (body) body.scrollTop = 0;
  }

  function closeStreamModal() {
    const modal = document.getElementById('streamModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    const viewerModal = document.getElementById('viewerModal');
    if (!viewerModal || !viewerModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function updateStreamSourceChips(sourceVal) {
    const chips = document.querySelectorAll('[data-stream-source]');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.streamSource === sourceVal);
    });
  }

  function renderStreamModal(doShuffle = false) {
    let pool = [...galleryItems];
    if (streamSourceFilter === 'gis') {
      pool = pool.filter(i => i.category === 'gis');
    } else if (streamSourceFilter === 'original') {
      pool = pool.filter(i => i.category === 'original');
    }

    if (doShuffle) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    currentFilteredItems = [...pool];

    const gisCount = galleryItems.filter(i => i.category === 'gis').length;
    const origCount = galleryItems.filter(i => i.category === 'original').length;
    const badgeEl = document.getElementById('streamItemCountBadge');
    const allEl = document.getElementById('streamAllCount');
    const gisEl = document.getElementById('streamGisCount');
    const origEl = document.getElementById('streamOriginalCount');

    if (badgeEl) badgeEl.textContent = pool.length + ' 幅';
    if (allEl) allEl.textContent = galleryItems.length;
    if (gisEl) gisEl.textContent = gisCount;
    if (origEl) origEl.textContent = origCount;

    const streamGrid = document.getElementById('streamGalleryGrid');
    if (!streamGrid) return;
    streamGrid.innerHTML = '';

    if (pool.length === 0) {
      streamGrid.innerHTML = '<div class="column-empty" style="padding: 48px 24px; color: var(--text-muted); font-size: 0.88rem; text-align: center; width: 100%;">' +
        '当前分类条件下暂无画作</div>';
      return;
    }

    pool.forEach((item, localIdx) => {
      streamGrid.appendChild(createCard(item, localIdx, true));
    });
  }

  function bindStreamModalEvents() {
    const btnOpenTop = document.getElementById('btnOpenStreamTop');
    const btnOpenBanner = document.getElementById('btnOpenStreamBanner');
    const stage = document.getElementById('randomWindowStage');
    const btnClose = document.getElementById('btnCloseStream');
    const btnCloseCross = document.getElementById('btnCloseStreamCross');
    const btnShuffle = document.getElementById('btnStreamShuffle');

    if (btnOpenTop) {
      btnOpenTop.addEventListener('click', (e) => {
        e.stopPropagation();
        openStreamModal();
      });
    }

    if (btnOpenBanner) {
      btnOpenBanner.addEventListener('click', (e) => {
        e.stopPropagation();
        openStreamModal();
      });
    }

    if (stage) {
      stage.addEventListener('click', () => {
        openStreamModal();
      });
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openStreamModal();
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', closeStreamModal);
    }
    if (btnCloseCross) {
      btnCloseCross.addEventListener('click', closeStreamModal);
    }

    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        renderStreamModal(true);
      });
    }

    const streamChips = document.querySelectorAll('[data-stream-source]');
    streamChips.forEach(chip => {
      chip.addEventListener('click', () => {
        updateStreamSourceChips(chip.dataset.streamSource);
        streamSourceFilter = chip.dataset.streamSource;
        renderStreamModal(false);
      });
    });

    window.addEventListener('keydown', (e) => {
      const viewerModal = document.getElementById('viewerModal');
      if (viewerModal && viewerModal.classList.contains('open')) return;
      const streamModal = document.getElementById('streamModal');
      if (streamModal && streamModal.classList.contains('open') && e.key === 'Escape') {
        closeStreamModal();
      }
    });
  }

  /* -------------------------------------------------------------
     2. Dedicated Gallery Pages (gis.html & original.html)
     ------------------------------------------------------------- */
  function initGalleryPage() {
    let targetCategory = null;
    if (pageMode === 'gis') targetCategory = 'gis';
    else if (pageMode === 'original') targetCategory = 'original';

    let categoryItems = targetCategory 
      ? galleryItems.filter(i => i.category === targetCategory)
      : [...galleryItems];

    // Update Counter
    const pageItemCountEl = document.getElementById('pageItemCount');
    if (pageItemCountEl) pageItemCountEl.textContent = categoryItems.length;

    // Generate Dynamic Subcategory Filter Chips
    buildSubcategoryChips(categoryItems);

    // Initial Filter (Check URL parameters like ?sub=Verygoogmaps)
    const urlParams = new URLSearchParams(window.location.search);
    const initialSub = urlParams.get('sub');

    if (initialSub) {
      currentFilteredItems = categoryItems.filter(i => (i.subCategory && i.subCategory.includes(initialSub)));
      // Activate chip in UI
      const filterGroup = document.getElementById('filterGroup');
      if (filterGroup) {
        const targetChip = Array.from(filterGroup.querySelectorAll('.filter-chip')).find(c => c.dataset.filter === 'sub:' + initialSub || c.textContent.includes(initialSub));
        if (targetChip) {
          filterGroup.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          targetChip.classList.add('active');
        }
      }
    } else {
      currentFilteredItems = [...categoryItems];
    }

    renderGrid(currentFilteredItems);

    // View Density Controls
    const btnDense = document.getElementById('btnGridDense');
    const btnComfort = document.getElementById('btnGridComfort');
    const gridEl = document.getElementById('galleryGrid');

    if (btnDense && btnComfort && gridEl) {
      btnDense.addEventListener('click', () => {
        btnDense.classList.add('active');
        btnComfort.classList.remove('active');
        gridEl.classList.remove('comfort');
      });
      btnComfort.addEventListener('click', () => {
        btnComfort.classList.add('active');
        btnDense.classList.remove('active');
        gridEl.classList.add('comfort');
      });
    }

    bindViewerModalEvents();
  }

  function buildSubcategoryChips(items) {
    const filterGroup = document.getElementById('filterGroup');
    if (!filterGroup) return;

    const subCats = new Set();
    items.forEach(item => {
      if (item.subCategory && item.subCategory.trim()) {
        subCats.add(item.subCategory.trim());
      }
    });

    const wideBtn = filterGroup.querySelector('[data-filter="wide"]');

    subCats.forEach(sub => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip';
      chip.dataset.filter = 'sub:' + sub;
      chip.textContent = sub;
      if (wideBtn) {
        filterGroup.insertBefore(chip, wideBtn);
      } else {
        filterGroup.appendChild(chip);
      }
    });

    const allChips = filterGroup.querySelectorAll('.filter-chip');
    allChips.forEach(chip => {
      chip.addEventListener('click', () => {
        allChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyGalleryFilter(chip.dataset.filter, items);
      });
    });
  }

  function applyGalleryFilter(filterKey, baseItems) {
    if (!filterKey || filterKey === 'all') {
      currentFilteredItems = [...baseItems];
    } else if (filterKey.startsWith('sub:')) {
      const sub = filterKey.replace('sub:', '');
      currentFilteredItems = baseItems.filter(i => i.subCategory === sub);
    } else if (filterKey === 'wide') {
      currentFilteredItems = baseItems.filter(i => i.aspectRatio >= 1.2);
    } else if (filterKey === 'tall') {
      currentFilteredItems = baseItems.filter(i => i.aspectRatio <= 0.8);
    }

    const countEl = document.getElementById('pageItemCount');
    if (countEl) countEl.textContent = currentFilteredItems.length;

    renderGrid(currentFilteredItems);
  }

  function renderGrid(items) {
    const gridEl = document.getElementById('galleryGrid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    if (items.length === 0) {
      gridEl.innerHTML = '<div class="column-empty" style="padding: 48px 24px; color: var(--text-muted); font-size: 0.88rem; text-align: center; width: 100%;">' +
        '暂无符合当前筛选条件的画作</div>';
      return;
    }

    items.forEach((item, localIdx) => {
      gridEl.appendChild(createCard(item, localIdx, false));
    });
  }

  function createCard(item, localIdx, isPortal = false) {
    const card = document.createElement('article');
    card.className = 'gallery-card' + (isPortal ? ' portal-seamless-card' : '');
    card.tabIndex = 0;
    card.style.setProperty('--aspect-ratio', item.aspectRatio);

    if (isPortal) {
      // 首页纯图最大化展示：不显示标题、尺寸、分辨率等任何文字遮挡
      card.innerHTML = 
        '<div class="card-media">' +
          '<img class="card-img" src="' + item.thumb + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' +
        '</div>';
    } else {
      const subCatLabel = item.subCategory ? ('<span class="tag-pill tag-pill-secondary">' + escapeHtml(item.subCategory) + '</span>') : '';

      card.innerHTML = 
        '<div class="card-media">' +
          '<img class="card-img" src="' + item.thumb + '" alt="' + escapeHtml(item.title) + '" loading="lazy" />' +
          '<div class="card-scrim-mask">' +
            '<div class="card-scrim-content">' +
              '<h3 class="card-title" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</h3>' +
              '<div class="card-meta-row">' +
                '<div class="card-tags">' +
                  subCatLabel +
                '</div>' +
                '<div class="card-action-hint">' +
                  SVG_ZOOM +
                  ' <span>阅览</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    const img = card.querySelector('.card-img');
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.onload = () => img.classList.add('loaded');
    }

    card.addEventListener('click', () => openViewerByItem(item));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViewerByItem(item);
      }
    });

    return card;
  }

  /* -------------------------------------------------------------
     3. Deep Zoom Viewer Modal & Info Drawer
     ------------------------------------------------------------- */
  function bindViewerModalEvents() {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl || modalEl.dataset.bound) return;
    modalEl.dataset.bound = 'true';

    const backdropEl = document.getElementById('viewerBackdrop');
    const closeBtn = document.getElementById('btnCloseViewer');
    const prevBtn = document.getElementById('btnPrevArtwork');
    const nextBtn = document.getElementById('btnNextArtwork');
    const toggleInfoBtn = document.getElementById('btnToggleInfo');
    const drawerEl = document.getElementById('viewerDrawer');
    const drawerCloseBtn = document.getElementById('btnDrawerClose');

    const toolZoomIn = document.getElementById('toolZoomIn');
    const toolZoomOut = document.getElementById('toolZoomOut');
    const toolReset = document.getElementById('toolReset');
    const toolRotate = document.getElementById('toolRotate');
    const toolFullscreen = document.getElementById('toolFullscreen');

    backdropEl.addEventListener('click', closeViewer);
    closeBtn.addEventListener('click', closeViewer);
    prevBtn.addEventListener('click', () => navigateArtwork(-1));
    nextBtn.addEventListener('click', () => navigateArtwork(1));

    // Left & Right Edge Navigation Paddles (左右视口边缘切换)
    const edgePrevBtn = document.getElementById('btnEdgePrev');
    const edgeNextBtn = document.getElementById('btnEdgeNext');
    if (edgePrevBtn) edgePrevBtn.addEventListener('click', () => navigateArtwork(-1));
    if (edgeNextBtn) edgeNextBtn.addEventListener('click', () => navigateArtwork(1));

    if (toggleInfoBtn && drawerEl) {
      toggleInfoBtn.addEventListener('click', () => {
        const isOpen = drawerEl.classList.toggle('open');
        toggleInfoBtn.classList.toggle('active', isOpen);
      });
    }

    if (drawerCloseBtn && drawerEl) {
      drawerCloseBtn.addEventListener('click', () => {
        drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
      });
    }

    const toolActualSize = document.getElementById('toolActualSize');
    if (toolActualSize) {
      toolActualSize.addEventListener('click', () => {
        if (osdViewer && osdViewer.viewport) {
          const targetZoom = osdViewer.viewport.imageToViewportZoom(1);
          osdViewer.viewport.zoomTo(targetZoom);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

    if (toolZoomIn) {
      toolZoomIn.addEventListener('click', () => {
        if (osdViewer) {
          osdViewer.viewport.zoomBy(1.35);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

    if (toolZoomOut) {
      toolZoomOut.addEventListener('click', () => {
        if (osdViewer) {
          osdViewer.viewport.zoomBy(1 / 1.35);
          osdViewer.viewport.applyConstraints();
        }
      });
    }

    if (toolReset) {
      toolReset.addEventListener('click', () => {
        if (osdViewer) osdViewer.viewport.goHome();
      });
    }

    if (toolRotate) {
      toolRotate.addEventListener('click', () => {
        if (osdViewer) {
          const curr = osdViewer.viewport.getRotation();
          osdViewer.viewport.setRotation((curr + 90) % 360);
        }
      });
    }

    let fsIdleTimer = null;
    function showControlsTemporarily() {
      if (!modalEl.classList.contains('fullscreen-mode')) return;
      modalEl.classList.add('controls-visible');
      clearTimeout(fsIdleTimer);
      fsIdleTimer = setTimeout(() => {
        if (modalEl.classList.contains('fullscreen-mode')) {
          modalEl.classList.remove('controls-visible');
        }
      }, 2400);
    }

    modalEl.addEventListener('mousemove', showControlsTemporarily);

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      modalEl.classList.toggle('fullscreen-mode', isFs);
      if (isFs) {
        if (toolFullscreen) {
          toolFullscreen.innerHTML = SVG_EXIT_FULLSCREEN;
          toolFullscreen.title = '退出沉浸全屏 (F / Esc)';
        }
        // Close drawer if open to maintain immersion
        if (drawerEl) drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');
        // Hide controls immediately on enter
        modalEl.classList.remove('controls-visible');
        clearTimeout(fsIdleTimer);
      } else {
        if (toolFullscreen) {
          toolFullscreen.innerHTML = SVG_FULLSCREEN;
          toolFullscreen.title = '全屏视界 (F)';
        }
        modalEl.classList.remove('controls-visible');
        clearTimeout(fsIdleTimer);
      }
    });

    if (toolFullscreen) {
      toolFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          modalEl.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!modalEl.classList.contains('open')) return;

      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            closeViewer();
          }
          break;
        case 'ArrowLeft':
          navigateArtwork(-1);
          break;
        case 'ArrowRight':
          navigateArtwork(1);
          break;
        case '1':
          if (toolActualSize) toolActualSize.click();
          break;
        case '+':
        case '=':
          if (osdViewer) {
            osdViewer.viewport.zoomBy(1.25);
            osdViewer.viewport.applyConstraints();
          }
          break;
        case '-':
        case '_':
          if (osdViewer) {
            osdViewer.viewport.zoomBy(1 / 1.25);
            osdViewer.viewport.applyConstraints();
          }
          break;
        case '0':
        case 'Home':
          if (osdViewer) osdViewer.viewport.goHome();
          break;
        case 'f':
        case 'F':
          if (toolFullscreen) toolFullscreen.click();
          break;
        case 'i':
        case 'I':
          if (toggleInfoBtn) toggleInfoBtn.click();
          break;
      }
    });

    window.addEventListener('themeChanged', (e) => {
      if (osdViewer) {
        const isDark = (e.detail.theme === 'dark');
        const stage = document.getElementById('osdStage');
        if (stage) stage.style.backgroundColor = isDark ? '#07080b' : '#e5e8ed';
      }
    });
  }

  function openViewerByItem(item) {
    const idx = currentFilteredItems.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      currentViewerIndex = idx;
    } else {
      currentViewerIndex = 0;
    }
    showArtwork(item);
  }

  function navigateArtwork(direction) {
    if (currentFilteredItems.length === 0) return;
    currentViewerIndex = (currentViewerIndex + direction + currentFilteredItems.length) % currentFilteredItems.length;
    showArtwork(currentFilteredItems[currentViewerIndex]);
  }

  function showArtwork(item) {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;

    const vTitle = document.getElementById('viewerTitle');
    const vDims = document.getElementById('viewerDims');
    const mTitle = document.getElementById('metaTitle');
    const mCat = document.getElementById('metaCategory');
    const mAuthor = document.getElementById('metaAuthor');
    const mDesc = document.getElementById('metaDescription');
    const mDescBox = document.getElementById('metaDescBox');
    const mFile = document.getElementById('metaFilename');
    const mRes = document.getElementById('metaResolution');
    const mAspect = document.getElementById('metaAspect');
    const mLevels = document.getElementById('metaLevels');
    const mPaletteBox = document.getElementById('metaColorPaletteBox');
    const mSwatches = document.getElementById('metaColorSwatches');

    if (vTitle) vTitle.textContent = item.title;
    if (vDims) vDims.style.display = 'none';
    if (mTitle) mTitle.textContent = item.title;
    if (mCat) mCat.textContent = item.categoryName + (item.subCategory ? ' · ' + item.subCategory : '');
    if (mAuthor) mAuthor.textContent = item.author || (item.category === 'original' ? '原创作者' : '网络精选');

    if (mDesc) {
      if (item.description && item.description.trim()) {
        mDesc.textContent = item.description.trim();
        if (mDescBox) mDescBox.style.display = 'block';
      } else {
        if (mDescBox) mDescBox.style.display = 'none';
      }
    }

    if (mFile) mFile.textContent = item.filename;
    if (mRes) mRes.textContent = item.width + ' × ' + item.height;
    if (mAspect) mAspect.textContent = item.aspectRatio + ':1 (原始画幅比)';
    if (mLevels) mLevels.textContent = '共 ' + (item.maxLevel + 1) + ' 级超高清多精度金字塔 (Level 0 ~ ' + item.maxLevel + ')';

    // Extract & Populate Dominant Colors Palette
    if (mSwatches) {
      mSwatches.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">提取色彩中...</span>';
      if (mPaletteBox) mPaletteBox.style.display = 'flex';
      extractDominantColors(item.thumb, 5, function (colors) {
        if (!modalEl.classList.contains('open')) return;
        mSwatches.innerHTML = '';
        if (!colors || colors.length === 0) {
          if (mPaletteBox) mPaletteBox.style.display = 'none';
          return;
        }
        if (mPaletteBox) mPaletteBox.style.display = 'flex';
        colors.forEach(function (hex) {
          const btn = document.createElement('button');
          btn.className = 'meta-swatch';
          btn.title = '点击复制色彩 ' + hex;
          btn.innerHTML = '<span class="meta-swatch-dot" style="background-color: ' + hex + ';"></span>' +
                          '<span class="meta-swatch-hex">' + hex + '</span>';
          btn.addEventListener('click', function () {
            copyToClipboard(hex);
            btn.classList.add('copied');
            const hexSpan = btn.querySelector('.meta-swatch-hex');
            if (hexSpan) hexSpan.textContent = '已复制!';
            setTimeout(function () {
              btn.classList.remove('copied');
              if (hexSpan) hexSpan.textContent = hex;
            }, 1400);
          });
          mSwatches.appendChild(btn);
        });
      });
    }

    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    loadOpenSeadragon(item);
  }

  function extractDominantColors(imgSrc, maxColors, callback) {
    if (!imgSrc) {
      callback([]);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback([]);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = {};

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 16 || lum > 242) continue;

          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = (qr << 16) | (qg << 8) | qb;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { r: qr, g: qg, b: qb, count: 0 };
          }
          colorBuckets[key].count++;
        }

        const sorted = Object.values(colorBuckets).sort(function (a, b) {
          return b.count - a.count;
        });
        const result = [];

        function colorDistance(c1, c2) {
          const dr = c1.r - c2.r;
          const dg = c1.g - c2.g;
          const db = c1.b - c2.b;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        }

        for (let i = 0; i < sorted.length; i++) {
          if (result.length >= maxColors) break;
          const candidate = sorted[i];
          const tooClose = result.some(function (c) {
            return colorDistance(c, candidate) < 40;
          });
          if (!tooClose) {
            result.push(candidate);
          }
        }

        if (result.length < maxColors) {
          for (let i = 0; i < sorted.length; i++) {
            if (result.length >= maxColors) break;
            const candidate = sorted[i];
            if (!result.includes(candidate)) {
              result.push(candidate);
            }
          }
        }

        const hexList = result.map(function (c) {
          const toHex = function (n) {
            return Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
          };
          return ('#' + toHex(c.r) + toHex(c.g) + toHex(c.b)).toUpperCase();
        });

        callback(hexList);
      } catch (err) {
        console.warn('Dominant color extraction error:', err);
        callback([]);
      }
    };
    img.onerror = function () {
      callback([]);
    };
    img.src = imgSrc;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function loadOpenSeadragon(item) {
    if (osdViewer) {
      osdViewer.destroy();
      osdViewer = null;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const stageBg = currentTheme === 'light' ? '#e5e8ed' : '#07080b';

    const tileBase = (item.tileUrl || (item.dzi && item.dzi.Image && item.dzi.Image.Url) || '').replace(/\/+$/, '') + '/';
    const tileWidth = item.width || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Width);
    const tileHeight = item.height || (item.dzi && item.dzi.Image && item.dzi.Image.Size && item.dzi.Image.Size.Height);
    const tileMaxLevel = item.maxLevel !== undefined ? item.maxLevel : Math.ceil(Math.log2(Math.max(tileWidth, tileHeight)));

    const tileSource = {
      width: tileWidth,
      height: tileHeight,
      tileSize: item.tileSize || 256,
      tileOverlap: item.overlap || 0,
      minLevel: 0,
      maxLevel: tileMaxLevel,
      getTileUrl: function (level, x, y) {
        return tileBase + level + '/' + x + '_' + y + '.' + (item.format || 'webp');
      }
    };

    // Calculate exact navigator dimensions matching artwork aspect ratio (100% full-bleed, 0 white edges)
    const maxNavDim = 200;
    let navWidth, navHeight;
    const ar = item.aspectRatio || (item.width / item.height);
    if (ar >= 1) {
      navWidth = maxNavDim;
      navHeight = Math.max(65, Math.round(maxNavDim / ar));
    } else {
      navHeight = maxNavDim;
      navWidth = Math.max(65, Math.round(maxNavDim * ar));
    }

    osdViewer = OpenSeadragon({
      id: 'osdStage',
      prefixUrl: '',
      tileSources: tileSource,
      showNavigationControl: false,
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT',
      navigatorAutoResize: false,
      navigatorMaintainSizeRatio: false,
      navigatorWidth: navWidth,
      navigatorHeight: navHeight,
      navigatorBackground: 'transparent',
      navigatorBorderColor: '#80cc28',
      navigatorDisplayRegionColor: 'rgba(128, 204, 40, 0.35)',
      navigatorDisplayOnLogicalClick: true,
      animationTime: 0.45,
      springStiffness: 9.0,
      visibilityRatio: 0.9,
      constrainDuringPan: true,
      minZoomImageRatio: 0.8,
      maxZoomPixelRatio: 3.5,
      zoomPerClick: 1.6,
      zoomPerScroll: 1.25,
      backgroundColor: stageBg,
      crossOriginPolicy: false,
      ajaxWithCredentials: false,
      placeholderFillStyle: stageBg
    });

    osdViewer.addHandler('open-failed', function (e) {
      console.error('OpenSeadragon open-failed:', e);
    });

    osdViewer.addHandler('tile-load-failed', function (e) {
      console.warn('OpenSeadragon tile-load-failed:', e);
    });

    function updateZoomBadge() {
      const badge = document.getElementById('toolZoomBadge');
      if (!badge || !osdViewer || !osdViewer.viewport) return;
      try {
        const actualZoom = osdViewer.viewport.imageToViewportZoom(1);
        if (actualZoom <= 0) return;
        const currentZoom = osdViewer.viewport.getZoom();
        const percent = Math.round((currentZoom / actualZoom) * 100);
        badge.textContent = percent + '%';
      } catch (err) {
        // silently ignore if viewport not ready
      }
    }

    osdViewer.addHandler('open', function () {
      updateZoomBadge();
      if (osdViewer && osdViewer.navigator) {
        osdViewer.navigator.setWidth(navWidth);
        osdViewer.navigator.setHeight(navHeight);
        if (osdViewer.navigator.element) {
          osdViewer.navigator.element.style.width = navWidth + 'px';
          osdViewer.navigator.element.style.height = navHeight + 'px';
          osdViewer.navigator.element.style.border = '2px solid var(--accent)';
          osdViewer.navigator.element.style.borderRadius = 'var(--radius-sm)';
          osdViewer.navigator.element.style.overflow = 'hidden';
          osdViewer.navigator.element.style.background = 'transparent';
          osdViewer.navigator.element.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
        }
      }
    });

    osdViewer.addHandler('zoom', updateZoomBadge);
    osdViewer.addHandler('animation', updateZoomBadge);

    const stageEl = document.getElementById('osdStage');
    if (stageEl) stageEl.style.backgroundColor = stageBg;
  }

  function closeViewer() {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;

    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    const streamModal = document.getElementById('streamModal');
    if (!streamModal || !streamModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }

    const drawerEl = document.getElementById('viewerDrawer');
    const toggleInfoBtn = document.getElementById('btnToggleInfo');
    if (drawerEl) drawerEl.classList.remove('open');
    if (toggleInfoBtn) toggleInfoBtn.classList.remove('active');

    const badge = document.getElementById('toolZoomBadge');
    if (badge) badge.textContent = '100%';

    if (osdViewer) {
      osdViewer.destroy();
      osdViewer = null;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* -------------------------------------------------------------
     4. Anti-theft & Utilities
     ------------------------------------------------------------- */
  function bindAntiTheft() {
    document.addEventListener('contextmenu', (e) => {
      if (document.getElementById('viewerModal')?.classList.contains('open') || e.target.closest('.gallery-card') || e.target.closest('.portal-card')) {
        e.preventDefault();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
