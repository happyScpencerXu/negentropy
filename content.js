// ═══════════════════════════════════════════════════
// content.js — 每页注入
// 职责: 文本采样 + 浮动overlay + 行为监控 + 导航上报
// ═══════════════════════════════════════════════════

(function() {
  'use strict';

  if (window.__negentropyContentLoaded) return;
  window.__negentropyContentLoaded = true;

  if (location.protocol === 'chrome:' || location.protocol === 'chrome-extension:' || location.protocol === 'edge:') return;

  const SAMPLE_INTERVAL = 5000;
  let lastUrl = location.href;
  let lastTextHash = '';
  let scrollEvents = 0;
  let clickEvents = 0;
  let sampleTimer = null;
  let overlay = null;
  let overlayVisible = true;

  // ═══ 浮动 Overlay Widget ═══

  function createOverlay() {
    // 容器
    overlay = document.createElement('div');
    overlay.id = 'negentropy-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      pointer-events: auto;
      user-select: none;
      transition: opacity 0.3s, transform 0.3s;
    `;

    // 从storage恢复位置
    try {
      const savedPos = sessionStorage.getItem('neg-overlay-pos');
      if (savedPos) {
        const pos = JSON.parse(savedPos);
        overlay.style.left = pos.x + 'px';
        overlay.style.top = pos.y + 'px';
        overlay.style.right = 'auto';
      }
    } catch {}

    overlay.innerHTML = `
      <style>
        #negentropy-overlay * { box-sizing: border-box; margin: 0; padding: 0; }
        #neg-overlay-body {
          background: rgba(13, 17, 23, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(48, 54, 61, 0.8);
          border-radius: 12px;
          padding: 8px 12px;
          min-width: 120px;
          cursor: move;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          font-size: 11px;
          color: #e6edf3;
        }
        #neg-overlay-body.collapsed { min-width: auto; padding: 6px 10px; }
        #neg-overlay-body.collapsed .neg-detail { display: none; }

        .neg-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .neg-title {
          font-size: 10px;
          color: #7d8590;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .neg-collapse-btn {
          background: none; border: none; color: #7d8590;
          font-size: 14px; cursor: pointer; padding: 0 2px; line-height: 1;
        }
        .neg-collapse-btn:hover { color: #e6edf3; }

        .neg-thermometer {
          height: 6px;
          border-radius: 3px;
          margin: 6px 0 4px;
          background: linear-gradient(90deg, #58a6ff 0%, #3fb950 25%, #d29922 60%, #f85149 100%);
          position: relative;
          opacity: 0.4;
        }
        .neg-thermometer-dot {
          position: absolute;
          top: -2px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #0d1117;
          transform: translateX(-50%);
          transition: left 0.5s ease, background 0.3s;
          left: 0%;
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
        }

        .neg-d-value {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin: 2px 0;
          font-variant-numeric: tabular-nums;
          transition: color 0.3s;
        }
        .neg-d-zone {
          text-align: center;
          font-size: 10px;
          margin-bottom: 4px;
          transition: color 0.3s;
        }

        .neg-detail {
          border-top: 1px solid rgba(48,54,61,0.5);
          padding-top: 4px;
          margin-top: 4px;
        }
        .neg-metric {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #7d8590;
          margin: 1px 0;
        }
        .neg-metric-val {
          color: #e6edf3;
          font-variant-numeric: tabular-nums;
        }
        .neg-anchor {
          font-size: 10px;
          color: #7d8590;
          text-align: center;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 130px;
        }
        .neg-mode-badge {
          display: inline-block;
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 8px;
          font-weight: 600;
          margin-left: 4px;
        }
        .neg-mode-badge.focus { background: rgba(88,166,255,0.2); color: #58a6ff; }
        .neg-mode-badge.divergent { background: rgba(188,140,255,0.2); color: #bc8cff; }
        .neg-mode-badge.manual { background: rgba(125,133,144,0.2); color: #7d8590; }

        /* Pulse animation for alert */
        @keyframes neg-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 4px 20px rgba(248,81,73,0.5); }
        }
        #neg-overlay-body.alert { animation: neg-pulse 2s infinite; }
      </style>
      <div id="neg-overlay-body">
        <div class="neg-header">
          <span class="neg-title">❄️ Negentropy</span>
          <button class="neg-collapse-btn" id="neg-collapse">−</button>
        </div>
        <div class="neg-thermometer">
          <div class="neg-thermometer-dot" id="neg-dot"></div>
        </div>
        <div class="neg-d-value" id="neg-d">--</div>
        <div class="neg-d-zone" id="neg-zone">Waiting</div>
        <div class="neg-detail" id="neg-detail">
          <div class="neg-metric">H_text <span class="neg-metric-val" id="neg-htext">--</span></div>
          <div class="neg-metric">R <span class="neg-metric-val" id="neg-r">--</span></div>
          <div class="neg-metric">H_rate <span class="neg-metric-val" id="neg-hrate">--</span></div>
          <div class="neg-metric">G <span class="neg-metric-val" id="neg-g">--</span></div>
        </div>
        <div class="neg-anchor" id="neg-anchor"></div>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    // 拖拽
    makeDraggable();

    // 折叠
    const collapseBtn = document.getElementById('neg-collapse');
    const body = document.getElementById('neg-overlay-body');
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      body.classList.toggle('collapsed');
      collapseBtn.textContent = body.classList.contains('collapsed') ? '+' : '−';
    });

    // 请求初始状态
    requestState();
  }

  function makeDraggable() {
    const body = document.getElementById('neg-overlay-body');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    body.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = overlay.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      body.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 50, startLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 30, startTop + dy));
      overlay.style.left = newLeft + 'px';
      overlay.style.top = newTop + 'px';
      overlay.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      body.style.cursor = 'move';
      // 保存位置
      const rect = overlay.getBoundingClientRect();
      try {
        sessionStorage.setItem('neg-overlay-pos', JSON.stringify({ x: rect.left, y: rect.top }));
      } catch {}
    });
  }

  function updateOverlay(rt) {
    if (!overlay) return;
    const dot = document.getElementById('neg-dot');
    const dEl = document.getElementById('neg-d');
    const zoneEl = document.getElementById('neg-zone');
    const body = document.getElementById('neg-overlay-body');
    const htextEl = document.getElementById('neg-htext');
    const rEl = document.getElementById('neg-r');
    const hrateEl = document.getElementById('neg-hrate');
    const gEl = document.getElementById('neg-g');
    const anchorEl = document.getElementById('neg-anchor');

    const D = rt.D || 0;
    const dPercent = Math.min(100, (D / 1.5) * 100);
    dot.style.left = dPercent + '%';

    // Sync language from background
    if (rt.lang && rt.lang !== getLang()) {
      setLang(rt.lang);
    }

    let color, zoneKey;
    if (D < 0.3) { color = '#58a6ff'; zoneKey = 'overlayFocus'; }
    else if (D < 0.7) { color = '#d29922'; zoneKey = 'overlayAlert'; }
    else { color = '#f85149'; zoneKey = 'overlayRoam'; }

    dot.style.background = color;
    dEl.textContent = D.toFixed(2);
    dEl.style.color = color;
    zoneEl.textContent = t(zoneKey);
    zoneEl.style.color = color;

    // Alert pulse
    if (D >= 0.7 && rt.mode === 'focus') body.classList.add('alert');
    else body.classList.remove('alert');

    htextEl.textContent = (rt.H_text || 0).toFixed(1);
    rEl.textContent = (rt.R || 0).toFixed(1);
    hrateEl.textContent = (rt.H_rate || 0).toFixed(2);
    gEl.textContent = Math.round((rt.G || 0) * 100) + '%';

    // Anchor + mode badge
    let anchorHtml = '';
    if (rt.anchor) anchorHtml += t('overlayAnchor') + ': ' + rt.anchor;
    if (rt.mode) {
      const modeKeys = { focus: 'modeFocus', divergent: 'modeDivergent', manual: 'modeManual' };
      const modeLabel = t(modeKeys[rt.mode] || rt.mode);
      anchorHtml += ` <span class="neg-mode-badge ${rt.mode}">${modeLabel}</span>`;
    }
    anchorEl.innerHTML = anchorHtml;
  }

  // ═══ 接收background的消息 ═══
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'metricsUpdate' && message.realtime) {
      updateOverlay(message.realtime);
    } else if (message.action === 'stateUpdate' && message.realtime) {
      updateOverlay(message.realtime);
    }
    sendResponse({});
    return false;
  });

  function requestState() {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setTimeout(requestState, 2000);
        return;
      }
      if (response.realtime) updateOverlay(response.realtime);
    });
  }

  // ═══ 文本采样 ═══
  function samplePageText() {
    let text = '';
    try { text = document.body?.innerText || ''; } catch { text = ''; }
    return text.substring(0, 2000);
  }

  function getMetaDescription() {
    const meta = document.querySelector('meta[name="description"], meta[property="og:description"]');
    return meta ? (meta.getAttribute('content') || '') : '';
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  function collectAndSend() {
    if (document.hidden) return;
    const text = samplePageText();
    const currentHash = simpleHash(text);
    lastTextHash = currentHash;

    const sample = {
      text, url: location.href,
      title: document.title || '',
      description: getMetaDescription(),
      scrollActivity: scrollEvents, clickActivity: clickEvents,
    };
    scrollEvents = 0;
    clickEvents = 0;

    try {
      chrome.runtime.sendMessage({ action: 'sample', sample }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response && response.metrics) {
          // 用metrics更新overlay (比等broadcast更及时)
          // 但用full realtime snapshot更好
        }
      });
    } catch {}
  }

  // ═══ 导航检测 ═══
  function reportNavigation() {
    const url = location.href;
    if (url === lastUrl) return;
    const oldUrl = lastUrl;
    lastUrl = url;
    try {
      const oldDomain = new URL(oldUrl).hostname.replace(/^www\./, '');
      const newDomain = new URL(url).hostname.replace(/^www\./, '');
      if (oldDomain !== newDomain) {
        chrome.runtime.sendMessage({
          action: 'pageNavigation',
          url, title: document.title || '', description: getMetaDescription(),
        }, () => { if (chrome.runtime.lastError) {} });
      }
    } catch {}
  }

  let urlCheckInterval = setInterval(reportNavigation, 2000);

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(reportNavigation, 100);
  };
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(reportNavigation, 100);
  };
  window.addEventListener('popstate', () => setTimeout(reportNavigation, 100));

  // ═══ 行为监控 ═══
  let scrollThrottle = null;
  window.addEventListener('scroll', () => {
    scrollEvents++;
    if (scrollThrottle) return;
    scrollThrottle = setTimeout(() => { scrollThrottle = null; }, 500);
  }, { passive: true });

  document.addEventListener('click', () => { clickEvents++; }, { passive: true });

  // ═══ 可见性 ═══
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(collectAndSend, 500);
  });

  // ═══ 启动 ═══
  function start() {
    // 创建overlay (延迟500ms确保DOM就绪)
    setTimeout(createOverlay, 500);
    // 延迟采样
    setTimeout(collectAndSend, 2000);
    // 定时采样
    sampleTimer = setInterval(collectAndSend, SAMPLE_INTERVAL);
    console.log('[Negentropy] content.js loaded on', location.href);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
