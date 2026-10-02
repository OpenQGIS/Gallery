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

  let preViewerScrollY = 0;

  const pageMode = document.body.dataset.page || 'gallery';

  const SVG_EXIT_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
  const SVG_FULLSCREEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
  const SVG_ZOOM = '<svg class="icon mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';

  const QMAPFLOW_BASE_SVG = '<svg width="100%" height="100%" viewBox="0 0 154.11621 25.478886" version="1.1" style="display:inline-block;vertical-align:middle;" xmlns="http://www.w3.org/2000/svg">' +
    '<rect style="fill:#80cc28;fill-opacity:1;fill-rule:evenodd;stroke-width:1.48054;stroke-linecap:round;stroke-linejoin:round" width="79.043427" height="42.77319" x="292.11685" y="-135.73831" transform="matrix(0.26458333,0,0,0.26458333,-6.5528481,42.781699)" />' +
    '<g transform="translate(-28.045834,-134.14375)"><g transform="matrix(0.26458333,0,0,0.26458333,21.492986,176.92545)">' +
    '<path d="m 471.01947,-115.27477 c -1.45733,0 -2.68667,1.22933 -2.68667,2.68667 v 11.44533 c 0,1.454666 1.22934,2.683996 2.68667,2.683996 h 11.444 c 1.45733,0 2.68667,-1.22933 2.68667,-2.683996 v -11.44533 c 0,-1.45734 -1.22934,-2.68667 -2.68667,-2.68667 z m 11.444,25.138666 h -11.444 c -6.06933,0 -11.008,-4.93867 -11.008,-11.006666 v -11.44533 c 0,-6.07067 4.93867,-11.00934 11.008,-11.00934 h 11.444 c 6.06933,0 11.008,4.93867 11.008,11.00934 v 11.44533 c 0,6.067996 -4.93867,11.006666 -11.008,11.006666" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 148.51553,-138.56637 h -6.548 c -2.55067,0 -4.89333,0.952 -6.752,2.53467 -1.86,-1.58267 -4.20267,-2.53467 -6.752,-2.53467 h -6.54933 c -6.01734,0 -10.91467,5.26667 -10.91467,11.74267 v 35.950656 c 0,0.82667 0.67067,1.49734 1.49733,1.49734 h 5.328 c 0.82667,0 1.49734,-0.67067 1.49734,-1.49734 V -126.8237 c 0,-1.85334 1.18666,-3.42 2.592,-3.42 h 6.54933 c 1.404,0 2.59067,1.56666 2.59067,3.42 v 35.950656 c 0,0.82667 0.67066,1.49734 1.49733,1.49734 h 5.328 c 0.82667,0 1.49733,-0.67067 1.49733,-1.49734 V -126.8237 c 0,-1.85334 1.18667,-3.42 2.59067,-3.42 h 6.548 c 1.40667,0 2.59333,1.56666 2.59333,3.42 v 35.950656 c 0,0.82667 0.67067,1.49734 1.49734,1.49734 h 5.32666 c 0.828,0 1.49867,-0.67067 1.49867,-1.49734 V -126.8237 c 0,-6.476 -4.89733,-11.74267 -10.916,-11.74267" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 270.17707,-107.44597 c 0,4.956 -4.03067,8.986666 -8.98667,8.986666 h -13.81333 c -4.95333,0 -8.984,-4.030666 -8.984,-8.986666 v -6.904 -6.90667 c 0,-4.956 4.03067,-8.98666 8.984,-8.98666 h 13.81333 c 4.956,0 8.98667,4.03066 8.98667,8.98666 z m -8.98667,-31.12 h -13.81333 c -9.54267,0 -17.30667,7.76533 -17.30667,17.30933 v 6.90667 6.904 34.799996 h 8.32267 v -20.03467 c 2.62267,1.60267 5.692,2.544 8.984,2.544 h 13.81333 c 9.54267,0 17.30934,-7.76533 17.30934,-17.309326 v -13.81067 c 0,-9.544 -7.76667,-17.30933 -17.30934,-17.30933" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 200.35086,-138.56637 h -13.81067 c -9.544,0 -17.30933,7.76667 -17.30933,17.30933 v 13.81067 c 0,9.543996 7.76533,17.309326 17.30933,17.309326 h 13.81067 c 1.57067,0 3.08533,-0.22666 4.53067,-0.624 v -8.968 c -1.336,0.78667 -2.87067,1.27067 -4.53067,1.27067 h -13.81067 c -4.956,0 -8.98666,-4.031996 -8.98666,-8.987996 v -13.81067 c 0,-4.95466 4.03066,-8.98666 8.98666,-8.98666 h 13.81067 c 4.956,0 8.98667,4.032 8.98667,8.98666 v 6.90667 6.904 c 0,0.25067 -0.0533,0.48533 -0.0733,0.73067 v 14.073326 c 0.024,-0.0147 0.0507,-0.024 0.0733,-0.0387 v 2.41467 h 8.32266 v -17.179996 -6.904 -6.90667 c 0,-9.54266 -7.76533,-17.30933 -17.30933,-17.30933" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 403.6536,-144.18224 h 10.98267 v -8.32267 H 403.6536 c -8.58933,0 -15.57733,7.20934 -15.57733,16.068 v 47.811996 h 8.32266 v -25.219996 h 18.23734 v -8.32133 h -18.23734 v -14.27067 c 0,-4.27066 3.25334,-7.74533 7.25467,-7.74533" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 450.50787,-90.136644 h -7.96933 c -9.03067,0 -16.37867,-6.008 -16.37867,-13.391996 v -49.552 h 8.32267 v 49.552 c 0,2.39733 3.308,5.069326 8.056,5.069326 h 7.96933 z" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="m 568.63933,-142.86784 -0.552,5.17467 11.76667,1.25866 -42.456,32.19067 c -0.26667,0.20267 -0.64934,0.012 -0.64934,-0.32267 v -9.04666 c 0,-3.672 -4.17466,-5.784 -7.132,-3.60934 l -16.45066,12.09067 c -0.268,0.19733 -0.64534,0.005 -0.64534,-0.32667 v -18.49066 c 0,-1.01734 -0.82533,-1.84134 -1.84266,-1.84134 h -4.63734 c -1.01733,0 -1.84266,0.824 -1.84266,1.84134 v 28.091996 c 0,3.17066 3.60533,4.996 6.16,3.11733 l 18.068,-13.278666 v 11.233336 c 0,3.19733 3.65866,5.01466 6.20666,3.08266 l 50.31867,-38.154656 -1.31067,11.09333 5.16534,0.608 2.636,-22.27333 z" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '<path d="M 88.750667,-91.703174 H 53.436001 c -7.834666,0 -14.185333,-6.35067 -14.185333,-14.183996 v -32.04533 c 0,-7.83467 6.352,-14.18667 14.186667,-14.18667 h 32.473332 c 7.836,0 14.186663,6.352 14.186663,14.18667 v 33.33733 c 0,1.35867 -0.663997,2.63333 -1.779997,3.412 -1.116,0.78 -2.537333,0.964 -3.817333,0.49333 l -23.997333,-8.82 2.873334,-7.81066 18.398666,6.76133 v -27.37333 c 0,-3.23867 -2.625333,-5.864 -5.864,-5.864 H 53.436001 c -3.238666,0 -5.862666,2.624 -5.862666,5.86266 v 32.04667 c 0,3.23733 2.624,5.86133 5.862666,5.86133 H 70.198667 L 88.992,-93.047174 c 0.725334,0.26933 0.532,1.344 -0.241333,1.344" style="fill:#80cc28;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:1.33333" />' +
    '</g>' +
    '<text xml:space="preserve" style="font-style:normal;font-weight:600;font-size:12.7032px;line-height:10.4398px;font-family:\'MiSans\',-apple-system,sans-serif;text-align:center;letter-spacing:-0.8px;text-anchor:middle;fill:#ffffff;fill-opacity:1;" x="108.68931" y="151.41119"><tspan x="108.68931" y="151.41119">__PRECISION__</tspan></text>' +
    '</g></svg>';

  function getQMapFlowSvg(precision = 100) {
    const cleanVal = String(precision).replace(/%/g, '').trim() || '100';
    return QMAPFLOW_BASE_SVG.replace('__PRECISION__', cleanVal);
  }

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

  function setupData(rawItems) {
    const config = window.CABINET_CONFIG || {};
    const assetBase = (config.assetBaseUrl || '').replace(/\/+$/, '');

    galleryItems = rawItems.map((item, idx) => {
      item.globalIndex = idx;
      if (assetBase) {
        if (item.thumb && !item.thumb.startsWith('http')) {
          item.thumb = assetBase + '/' + item.thumb.replace(/^\/+/, '');
        }
        if (item.tileUrl && !item.tileUrl.startsWith('http')) {
          item.tileUrl = assetBase + '/' + item.tileUrl.replace(/^\/+/, '');
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
    const verygoogItems = galleryItems.filter(i => (i.subCategory && i.subCategory.includes('Verygoogmaps')));
    const standardItems = galleryItems.filter(i => (i.subCategory && i.subCategory.includes('标准地图')));

    // Update Header and Portal Card Counters
    const totalEl = document.getElementById('collectionCount');
    const portalGisCountEl = document.getElementById('portalGisCount');
    const portalOrigCountEl = document.getElementById('portalOriginalCount');
    const randomTotalCountEl = document.getElementById('randomTotalCount');

    if (totalEl) totalEl.textContent = totalCount;
    if (portalGisCountEl) portalGisCountEl.textContent = verygoogItems.length + ' 幅馆藏';
    if (portalOrigCountEl) portalOrigCountEl.textContent = standardItems.length + ' 幅馆藏';
    if (randomTotalCountEl) randomTotalCountEl.textContent = totalCount;

    // Hero Dual Gateways (Clicking enters stream modal filtered by category)
    const portalCards = document.querySelectorAll('.portal-card');
    portalCards.forEach(card => {
      card.addEventListener('click', () => {
        const sub = card.dataset.sub;
        if (sub === 'Verygoogmaps') {
          openStreamModal('gis');
        } else if (sub === '标准地图') {
          openStreamModal('original');
        } else {
          openStreamModal('all');
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Cluster links in Section 2
    const clusterLinks = document.querySelectorAll('.cluster-link');
    clusterLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sub = link.dataset.sub;
        if (sub === 'Verygoogmaps') {
          openStreamModal('gis');
        } else if (sub === '标准地图') {
          openStreamModal('original');
        } else {
          openStreamModal('all');
        }
      });
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });

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
      pool = pool.filter(i => (i.subCategory && i.subCategory.includes('Verygoogmaps')));
    } else if (portalSourceFilter === 'original') {
      pool = pool.filter(i => (i.subCategory && i.subCategory.includes('标准地图')));
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
        poolBadge.textContent = (portalSourceFilter === 'gis' ? '全球遥感' : '标准地图') + ' · ' + pool.length + ' 幅';
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
      pool = pool.filter(i => (i.subCategory && i.subCategory.includes('Verygoogmaps')));
    } else if (streamSourceFilter === 'original') {
      pool = pool.filter(i => (i.subCategory && i.subCategory.includes('标准地图')));
    }

    if (doShuffle) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    currentFilteredItems = [...pool];

    const gisCount = galleryItems.filter(i => (i.subCategory && i.subCategory.includes('Verygoogmaps'))).length;
    const origCount = galleryItems.filter(i => (i.subCategory && i.subCategory.includes('标准地图'))).length;
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
    card.id = 'artCard_' + item.id;
    card.dataset.id = item.id;
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
     3. Deep Zoom Viewer Modal, Info Drawer & High-Precision Navigator
     ------------------------------------------------------------- */
  let isNavCollapsed = window.innerWidth <= 768;

  function toggleNavigator(collapse) {
    const navW = document.getElementById('navWrapper');
    const navL = document.getElementById('navLauncher');
    if (!navW || !navL) return;

    if (collapse === undefined) {
      isNavCollapsed = !isNavCollapsed;
    } else {
      isNavCollapsed = !!collapse;
    }

    if (isNavCollapsed) {
      navW.classList.add('is-collapsed');
      navL.classList.add('is-visible');
    } else {
      navW.classList.remove('is-collapsed');
      navL.classList.remove('is-visible');
    }
    setTimeout(checkToolbarCollision, 50);
  }

  function checkToolbarCollision() {
    const tb = document.querySelector('.viewer-floating-toolbar');
    const navW = document.getElementById('navWrapper');
    const navL = document.getElementById('navLauncher');
    if (!tb || !navW || !navL) return;

    const tbRect = tb.getBoundingClientRect();
    const activeNav = !navW.classList.contains('is-collapsed') ? navW : navL;
    const navRect = activeNav.getBoundingClientRect();

    const isOverlapX = (navRect.right + 20 > tbRect.left);
    if (isOverlapX) {
      navW.classList.add('dodge-toolbar');
      navL.classList.add('dodge-toolbar');
    } else if (window.innerWidth > 1080) {
      navW.classList.remove('dodge-toolbar');
      navL.classList.remove('dodge-toolbar');
    }
  }

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

    const btnCloseNav = document.getElementById('btnCloseNav');
    const btnOpenNav = document.getElementById('btnOpenNav');
    if (btnCloseNav) {
      btnCloseNav.addEventListener('click', () => toggleNavigator(true));
    }
    if (btnOpenNav) {
      btnOpenNav.addEventListener('click', () => toggleNavigator(false));
    }
    window.addEventListener('resize', checkToolbarCollision);

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
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active'); if (window.AtlasMorphicons && window.AtlasMorphicons.info) window.AtlasMorphicons.info.set(false);
      });
    }

    const toolToggleLang = document.getElementById('toolToggleLang');
    if (toolToggleLang) {
      toolToggleLang.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AtlasI18n && typeof window.AtlasI18n.toggle === 'function') {
          window.AtlasI18n.toggle();
        }
      });
    }

    const toolToggleTheme = document.getElementById('toolToggleTheme');
    if (toolToggleTheme) {
      toolToggleTheme.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.GalleryTheme && typeof window.GalleryTheme.toggleTheme === 'function') {
          window.GalleryTheme.toggleTheme();
        }
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
          if (window.AtlasMorphicons && window.AtlasMorphicons.rotate) {
            window.AtlasMorphicons.rotate.rotateNext((nextAngle) => {
              osdViewer.viewport.setRotation(nextAngle);
            });
          } else {
            const curr = osdViewer.viewport.getRotation();
            osdViewer.viewport.setRotation((curr + 90) % 360);
          }
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
          if (window.AtlasMorphicons && window.AtlasMorphicons.fullscreen) {
            window.AtlasMorphicons.fullscreen.set(true);
          } else {
            toolFullscreen.innerHTML = SVG_EXIT_FULLSCREEN;
          }
          toolFullscreen.title = '退出全屏 (F / Esc)';
        }
        // Close drawer if open to maintain immersion
        if (drawerEl) drawerEl.classList.remove('open');
        if (toggleInfoBtn) toggleInfoBtn.classList.remove('active'); if (window.AtlasMorphicons && window.AtlasMorphicons.info) window.AtlasMorphicons.info.set(false);
        // Hide controls immediately on enter
        modalEl.classList.remove('controls-visible');
        clearTimeout(fsIdleTimer);
      } else {
        if (toolFullscreen) {
          if (window.AtlasMorphicons && window.AtlasMorphicons.fullscreen) {
            window.AtlasMorphicons.fullscreen.set(false);
          } else {
            toolFullscreen.innerHTML = SVG_FULLSCREEN;
          }
          toolFullscreen.title = '视口全屏 (F)';
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
        case 'o':
        case 'O':
        case 'm':
        case 'M':
          toggleNavigator();
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

    // 初始化底部工具栏鼠标磁吸跟随特效
    initMagneticDock();
  }

  /* -------------------------------------------------------------
     Magnetic Cursor Follow Dock (底部悬浮工具栏磁吸微动物理特效)
     参考 Framer Motion / Apple Dock 物理微动吸附与弹簧回弹算法
     ------------------------------------------------------------- */
  function initMagneticDock() {
    const dock = document.querySelector('.viewer-floating-toolbar');
    if (!dock || dock.dataset.magneticBound) return;
    dock.dataset.magneticBound = 'true';

    // 触屏设备（移动端/平板）自然支持直接触控，跳过鼠标磁吸微动以确保零开销
    if (window.matchMedia('(hover: none)').matches) return;

    const buttons = dock.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
      let rafId = null;
      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;
      let isHovered = false;
      const innerTarget = btn.querySelector('.icon, .tool-btn-text, span') || btn.firstElementChild;

      function renderFrame() {
        // 高性能 Spring-Lerp 弹性阻尼算法（刚度与阻尼系数平衡在 0.18）
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;

        if (!isHovered && Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05) {
          currentX = 0;
          currentY = 0;
          btn.style.transform = '';
          if (innerTarget) innerTarget.style.transform = '';
          rafId = null;
          return;
        }

        // 按钮主体微位移 (0.35x 磁吸位移)
        btn.style.transform = 'translate3d(' + (currentX * 0.35).toFixed(2) + 'px, ' + (currentY * 0.35).toFixed(2) + 'px, 0)';
        // 内部图标微视差深景深跟随 (0.22x 附加位移，产生 3D 浮雕深度感知)
        if (innerTarget) {
          innerTarget.style.transform = 'translate3d(' + (currentX * 0.22).toFixed(2) + 'px, ' + (currentY * 0.22).toFixed(2) + 'px, 0)';
        }

        rafId = requestAnimationFrame(renderFrame);
      }

      btn.addEventListener('mouseenter', () => {
        isHovered = true;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        // 限制最大位移阈值 (±9px)，确保克制不浮夸、精细优雅
        const maxPull = 9;
        targetX = Math.max(-maxPull, Math.min(maxPull, dx * 0.48));
        targetY = Math.max(-maxPull, Math.min(maxPull, dy * 0.48));
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });

      btn.addEventListener('mouseleave', () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(renderFrame);
      });
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

  /**
   * 格式化日期为仅显示年月 (YYYY.MM 或 YYYY)
   * 兼容 2024.07, 2024.7, 2024-07-15, 2024/07/15, 2024年7月, 2024 等多种格式
   */
  function formatYearMonth(rawDate) {
    if (!rawDate) return '';
    const str = String(rawDate).trim();
    const match = str.match(/^(\d{4})[-/.年](\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = String(parseInt(match[2], 10)).padStart(2, '0');
      return year + '.' + month;
    }
    const matchYear = str.match(/^(\d{4})$/);
    if (matchYear) {
      return matchYear[1];
    }
    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) {
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return year + '.' + month;
    }
    return str;
  }

  function showArtwork(item) {
    const modalEl = document.getElementById('viewerModal');
    if (!modalEl) return;

    if (!modalEl.classList.contains('open')) {
      preViewerScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const activeItem = item;

    const vTitle = document.getElementById('viewerTitle');
    const qmfEl = document.getElementById('viewerQmapFlow');
    if (qmfEl) {
      let precision = '100';
      if (item && item.workflow && item.workflow.QGIS) {
        precision = String(item.workflow.QGIS).replace(/%/g, '').trim();
      }
      qmfEl.innerHTML = getQMapFlowSvg(precision);
    }
    const vDims = document.getElementById('viewerDims');
    const mTitle = document.getElementById('metaTitle');
    const mCat = document.getElementById('metaCategory');
    const mAuthor = document.getElementById('metaAuthor');
    const mDate = document.getElementById('metaDate');
    const mDateBox = document.getElementById('metaDateBox');
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

    // 日期仅显示年月
    const rawDate = item.date || item.year;
    const formattedDate = formatYearMonth(rawDate);
    if (mDate) mDate.textContent = formattedDate || '-';
    if (mDateBox) mDateBox.style.display = formattedDate ? 'block' : 'none';

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
      extractDominantColors(item, 5, function (colors) {
        if (!modalEl.classList.contains('open')) return;
        if (currentViewerIndex >= 0 && currentFilteredItems[currentViewerIndex] && currentFilteredItems[currentViewerIndex].id !== activeItem.id) return;
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

    toggleNavigator(window.innerWidth <= 768);
    loadOpenSeadragon(item);
  }

  function extractDominantColors(target, maxColors, callback) {
    maxColors = maxColors || 5;

    // 优先采用 Markdown Frontmatter 标定的专属色板 (item.colors || item.color)
    if (target && typeof target === 'object') {
      const explicit = target.colors || target.color;
      if (Array.isArray(explicit) && explicit.length > 0) {
        callback(explicit.slice(0, maxColors));
        return;
      }
    }

    const imgSrc = (typeof target === 'string') ? target : (target && target.thumb);
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
    const isMobile = window.innerWidth <= 768;
    const maxNavDim = isMobile ? 150 : 220;
    let navWidth, navHeight;
    const ar = item.aspectRatio || (item.width / item.height);
    if (ar >= 1) {
      navWidth = maxNavDim;
      navHeight = Math.max(isMobile ? 55 : 70, Math.round(maxNavDim / ar));
    } else {
      navHeight = maxNavDim;
      navWidth = Math.max(isMobile ? 55 : 70, Math.round(maxNavDim * ar));
    }

    const navStageContainer = document.getElementById('navStageContainer');
    if (navStageContainer) {
      navStageContainer.style.width = navWidth + 'px';
      navStageContainer.style.height = navHeight + 'px';
    }

    osdViewer = OpenSeadragon({
      id: 'osdStage',
      prefixUrl: '',
      tileSources: tileSource,
      showNavigationControl: false,
      showNavigator: true,
      navigatorId: 'osdNavigator',
      navigatorPosition: 'BOTTOM_LEFT',
      navigatorAutoResize: false,
      navigatorMaintainSizeRatio: false,
      navigatorWidth: navWidth,
      navigatorHeight: navHeight,
      navigatorBackground: 'transparent',
      navigatorBorderColor: '#80cc28',
      navigatorDisplayRegionColor: 'rgba(128, 204, 40, 0.28)',
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
      if (!osdViewer || !osdViewer.viewport) return;
      const curZ = osdViewer.viewport.getZoom();
      const homeZ = osdViewer.viewport.getHomeZoom();
      const isFull = Math.abs(curZ - homeZ) / homeZ < 0.04;

      if (window.AtlasMorphicons && window.AtlasMorphicons.reset) {
        if (isFull) {
          window.AtlasMorphicons.reset.toFit();
        } else {
          window.AtlasMorphicons.reset.toZoomed();
        }
      }

      // 全图完整显示时自动隐藏鹰眼图选区框，聚焦细节时才平滑淡出呈现
      const displayRegion = document.querySelector('#osdNavigator .displayregion');
      if (displayRegion) {
        displayRegion.classList.toggle('is-full-view', isFull);
      }

      const badge = document.getElementById('toolZoomBadge');
      if (!badge) return;
      try {
        const actualZoom = osdViewer.viewport.imageToViewportZoom(1);
        if (actualZoom <= 0) return;
        const percent = Math.round((curZ / actualZoom) * 100);
        badge.textContent = percent + '%';
      } catch (err) {}
    }

    osdViewer.addHandler('open', function () {
      updateZoomBadge();
      setupNavigatorInteractions(item, navWidth, navHeight);
      checkToolbarCollision();
    });

    osdViewer.addHandler('zoom', updateZoomBadge);
    osdViewer.addHandler('animation', updateZoomBadge);

    const stageEl = document.getElementById('osdStage');
    if (stageEl) stageEl.style.backgroundColor = stageBg;
  }

  function setupNavigatorInteractions(item, navWidth, navHeight) {
    const overlay = document.getElementById('navDrawOverlay');
    const box = document.getElementById('navDrawBox');
    if (!overlay || !box) return;

    // 清理旧监听器 (通过节点克隆替换)
    const newOverlay = overlay.cloneNode(true);
    overlay.parentNode.replaceChild(newOverlay, overlay);
    const newBox = newOverlay.querySelector('#navDrawBox');

    let isDrawing = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;

    newOverlay.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      isDrawing = true;
      const rect = newOverlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      currentX = startX;
      currentY = startY;

      newBox.style.left = startX + 'px';
      newBox.style.top = startY + 'px';
      newBox.style.width = '0px';
      newBox.style.height = '0px';
      newBox.style.display = 'none';

      newOverlay.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    newOverlay.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      const rect = newOverlay.getBoundingClientRect();
      currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width > 4 || height > 4) {
        newBox.style.display = 'block';
        newBox.style.left = left + 'px';
        newBox.style.top = top + 'px';
        newBox.style.width = width + 'px';
        newBox.style.height = height + 'px';
      }
      e.preventDefault();
      e.stopPropagation();
    });

    newOverlay.addEventListener('pointerup', (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      try {
        newOverlay.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const rect = newOverlay.getBoundingClientRect();
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width > 6 && height > 6) {
        newBox.style.transition = 'opacity 0.2s ease';
        newBox.style.opacity = '0';
        setTimeout(() => {
          newBox.style.display = 'none';
          newBox.style.opacity = '1';
          newBox.style.transition = '';
        }, 200);

        if (osdViewer && osdViewer.viewport) {
          let targetBounds = null;
          if (osdViewer.navigator && osdViewer.navigator.viewport) {
            try {
              const p1 = osdViewer.navigator.viewport.pointFromPixel(new OpenSeadragon.Point(left, top));
              const p2 = osdViewer.navigator.viewport.pointFromPixel(new OpenSeadragon.Point(left + width, top + height));
              const minX = Math.min(p1.x, p2.x);
              const minY = Math.min(p1.y, p2.y);
              const w = Math.abs(p2.x - p1.x);
              const h = Math.abs(p2.y - p1.y);
              if (w > 0.001 && h > 0.001 && isFinite(minX) && isFinite(minY)) {
                targetBounds = new OpenSeadragon.Rect(minX, minY, w, h);
              }
            } catch (err) {}
          }
          if (!targetBounds) {
            const artAr = item.aspectRatio || (item.width / item.height);
            const normX = left / navWidth;
            const normY = (top / navHeight) * (1 / artAr);
            const normW = width / navWidth;
            const normH = (height / navHeight) * (1 / artAr);
            targetBounds = new OpenSeadragon.Rect(normX, normY, normW, normH);
          }
          osdViewer.viewport.fitBounds(targetBounds, false);
          osdViewer.viewport.applyConstraints();
        }
      } else {
        // 单击操作：快速平移中心到点击位置
        newBox.style.display = 'none';
        if (osdViewer && osdViewer.viewport) {
          let clickPt = null;
          if (osdViewer.navigator && osdViewer.navigator.viewport) {
            try {
              clickPt = osdViewer.navigator.viewport.pointFromPixel(new OpenSeadragon.Point(currentX, currentY));
            } catch (e) {}
          }
          if (!clickPt || !isFinite(clickPt.x) || !isFinite(clickPt.y)) {
            const artAr = item.aspectRatio || (item.width / item.height);
            const normX = currentX / navWidth;
            const normY = (currentY / navHeight) * (1 / artAr);
            clickPt = new OpenSeadragon.Point(normX, normY);
          }
          osdViewer.viewport.panTo(clickPt, false);
          osdViewer.viewport.applyConstraints();
        }
      }
      e.preventDefault();
      e.stopPropagation();
    });

    newOverlay.addEventListener('pointercancel', () => {
      isDrawing = false;
      newBox.style.display = 'none';
    });
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
    if (toggleInfoBtn) toggleInfoBtn.classList.remove('active'); if (window.AtlasMorphicons && window.AtlasMorphicons.info) window.AtlasMorphicons.info.set(false);

    const badge = document.getElementById('toolZoomBadge');
    if (badge) badge.textContent = '100%';

    const navBox = document.getElementById('navDrawBox');
    if (navBox) navBox.style.display = 'none';

    if (osdViewer) {
      osdViewer.destroy();
      osdViewer = null;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // 精确还原至进入深览前的视口滚动位置，优先精准对准当前作品卡片
    const currentItem = (currentFilteredItems && currentFilteredItems[currentViewerIndex]) || null;
    const targetCard = currentItem ? (document.getElementById('artCard_' + currentItem.id) || document.querySelector('.gallery-card[data-id="' + currentItem.id + '"]')) : null;

    requestAnimationFrame(() => {
      if (targetCard) {
        targetCard.scrollIntoView({ block: 'center', behavior: 'auto' });
      } else if (typeof preViewerScrollY === 'number' && preViewerScrollY >= 0) {
        window.scrollTo({ top: preViewerScrollY, behavior: 'auto' });
      }
    });
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


/* =============================================================
   Morphicons Integration Controller for OpenQGIS Atlas
   Manages morphing for:
     Scene A: #toolReset (ResetFit <-> ResetZoomed)
     Scene B: #toolRotate (RotateCw step rotation with spring dynamics)
     Scene C: #toolFullscreen (Maximize <-> Minimize)
     Scene D: #btnToggleInfo (Info <-> X)
     Scene E: #btnLangDropdown & #viewerBtnLangDropdown (Languages <-> Globe)
     Scene F: #btnShareOptLink (Link <-> Check)
   ============================================================= */

(function () {
  'use strict';

  let morphReset = null;
  let morphRotate = null;
  let morphFullscreen = null;
  let morphInfo = null;
  let morphHeaderLang = null;
  let morphViewerLang = null;
  let morphShareLink = null;

  let rotateAngle = 0;
  let isRotateBusy = false;

  function initAtlasMorphicons() {
    if (!window.Morphicons || !window.LucideIcons) {
      console.warn('Morphicons or LucideIcons bundle not found');
      return;
    }

    const { createMorph } = window.Morphicons;
    const {
      ResetFit, ResetZoomed,
      RotateCw,
      Maximize, Minimize,
      CircleHelp, X,
      Languages, Globe,
      Link, Check
    } = window.LucideIcons;

    // A: toolReset
    const pReset = document.getElementById('pathResetMorph');
    if (pReset) {
      const m = createMorph(pReset, ResetFit);
      let isZoomed = false;
      morphReset = {
        toFit() {
          if (!isZoomed) return;
          isZoomed = false;
          m.morphTo(ResetFit, 'snappy');
        },
        toZoomed() {
          if (isZoomed) return;
          isZoomed = true;
          m.morphTo(ResetZoomed, 'snappy');
        },
        toggle() {
          isZoomed = !isZoomed;
          m.morphTo(isZoomed ? ResetZoomed : ResetFit, 'snappy');
        }
      };
    }

    // B: toolRotate (Scheme 3: Pure-torque spring dynamics, scale strictly 1.0)
    const pRotate = document.getElementById('pathRotateMorph');
    const svgRotate = document.getElementById('toolRotateSvg');
    if (pRotate && svgRotate) {
      const m = createMorph(pRotate, RotateCw);
      morphRotate = {
        rotateNext(onComplete) {
          if (isRotateBusy) return;
          isRotateBusy = true;
          const targetAngle = rotateAngle + 90;

          // Stage 1 (0ms): Reverse recoil -22 deg (scale strictly 1.0)
          svgRotate.style.transition = 'transform 0.14s cubic-bezier(0.4, 0, 0.2, 1)';
          svgRotate.style.transform = `rotate(${rotateAngle - 22}deg)`;

          // Stage 2 (140ms): Forward torque sprint, overshoot +14 deg
          setTimeout(() => {
            svgRotate.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
            svgRotate.style.transform = `rotate(${targetAngle + 14}deg)`;
          }, 140);

          // Stage 3 (420ms): Spring damping settling at targetAngle
          setTimeout(() => {
            svgRotate.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
            svgRotate.style.transform = `rotate(${targetAngle}deg)`;
          }, 420);

          // Lock final angle (580ms)
          setTimeout(() => {
            rotateAngle = targetAngle;
            isRotateBusy = false;
            if (typeof onComplete === 'function') onComplete(rotateAngle % 360);
          }, 580);
        },
        reset() {
          rotateAngle = 0;
          isRotateBusy = false;
          if (svgRotate) {
            svgRotate.style.transition = 'none';
            svgRotate.style.transform = 'rotate(0deg)';
          }
        }
      };
    }

    // C: toolFullscreen
    const pFullscreen = document.getElementById('pathFullscreenMorph');
    if (pFullscreen) {
      const m = createMorph(pFullscreen, Maximize);
      let isFs = false;
      morphFullscreen = {
        set(fsState) {
          if (isFs === fsState) return;
          isFs = fsState;
          m.morphTo(isFs ? Minimize : Maximize, 'snappy');
        }
      };
    }

    // D: btnToggleInfo
    // Info icon path: circle with line/dot -> morphs to X
    const pInfo = document.getElementById('pathInfoMorph');
    if (pInfo) {
      const InfoIcon = {
        d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01'
      };
      const m = createMorph(pInfo, InfoIcon);
      let isOpen = false;
      morphInfo = {
        set(openState) {
          if (isOpen === openState) return;
          isOpen = openState;
          m.morphTo(isOpen ? X : InfoIcon, 'snappy');
        }
      };
    }

    // E: Language Dropdowns (Languages <-> Globe)
    const pHeaderLang = document.getElementById('pathHeaderLangMorph');
    if (pHeaderLang) {
      const m = createMorph(pHeaderLang, Languages);
      let isOpen = false;
      morphHeaderLang = {
        set(openState) {
          if (isOpen === openState) return;
          isOpen = openState;
          m.morphTo(isOpen ? Globe : Languages, 'snappy');
        }
      };
    }

    const pViewerLang = document.getElementById('pathViewerLangMorph');
    if (pViewerLang) {
      const m = createMorph(pViewerLang, Languages);
      let isOpen = false;
      morphViewerLang = {
        set(openState) {
          if (isOpen === openState) return;
          isOpen = openState;
          m.morphTo(isOpen ? Globe : Languages, 'snappy');
        }
      };
    }

    // F: btnShareOptLink (Link <-> Check)
    const pShareLink = document.getElementById('pathShareLinkMorph');
    if (pShareLink) {
      const m = createMorph(pShareLink, Link);
      morphShareLink = {
        triggerSuccess(duration = 1800) {
          m.morphTo(Check, 'snappy');
          setTimeout(() => {
            m.morphTo(Link, 'snappy');
          }, duration);
        }
      };
    }

    window.AtlasMorphicons = {
      reset: morphReset,
      rotate: morphRotate,
      fullscreen: morphFullscreen,
      info: morphInfo,
      headerLang: morphHeaderLang,
      viewerLang: morphViewerLang,
      shareLink: morphShareLink
    };
  }

  // Hook into DOM lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAtlasMorphicons);
  } else {
    initAtlasMorphicons();
  }
})();
