// ═══════════════════════════════════════════════════
// popup.js — Dashboard logic with i18n + SVG chart
// ═══════════════════════════════════════════════════

let currentMode = 'focus';
let updateTimer = null;

// DOM
const langBtn = document.getElementById('lang-btn');
const anchorInput = document.getElementById('anchor-input');
const anchorSetBtn = document.getElementById('anchor-set-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const modeDesc = document.getElementById('mode-desc');
const thermometerIndicator = document.getElementById('thermometer-indicator');
const dValue = document.getElementById('d-value');
const dZone = document.getElementById('d-zone');
const hTextBar = document.getElementById('h-text-bar');
const hTextValue = document.getElementById('h-text-value');
const rBar = document.getElementById('r-bar');
const rValue = document.getElementById('r-value');
const hRateBar = document.getElementById('h-rate-bar');
const hRateValue = document.getElementById('h-rate-value');
const gBar = document.getElementById('g-bar');
const gValue = document.getElementById('g-value');
const focusTime = document.getElementById('focus-time');
const roamTime = document.getElementById('roam-time');
const focusRatio = document.getElementById('focus-ratio');
const maxStreak = document.getElementById('max-streak');
const currentDomain = document.getElementById('current-domain');
const currentCategory = document.getElementById('current-category');

const CHART_WIDTH = 340;
const CHART_HEIGHT = 80;

// ═══ i18n ═══

function applyI18n() {
  document.getElementById('lbl-anchor').textContent = t('anchorLabel');
  anchorInput.placeholder = t('anchorPlaceholder');
  anchorSetBtn.textContent = t('anchorSet');

  document.getElementById('lbl-mode').textContent = t('modeLabel');
  document.getElementById('mode-name-focus').textContent = t('modeFocus');
  document.getElementById('mode-name-divergent').textContent = t('modeDivergent');
  document.getElementById('mode-name-manual').textContent = t('modeManual');

  document.getElementById('lbl-entropy').textContent = t('entropyLabel');
  document.getElementById('lbl-focus').textContent = '❄️ ' + t('focusLabel');
  document.getElementById('lbl-roam').textContent = '🔥 ' + t('roamLabel');
  document.getElementById('d-zone').textContent = t('waitingData');

  document.getElementById('lbl-chart').textContent = t('chartLabel');
  document.getElementById('legend-d').textContent = t('chartD');

  document.getElementById('lbl-metrics').textContent = t('metricsLabel');

  document.getElementById('lbl-stats').textContent = t('statsLabel');
  document.getElementById('stat-label-focus').textContent = t('statFocus');
  document.getElementById('stat-label-roam').textContent = t('statRoam');
  document.getElementById('stat-label-ratio').textContent = t('statRatio');
  document.getElementById('stat-label-streak').textContent = t('statStreak');

  document.getElementById('lbl-current').textContent = t('currentLabel');
  document.getElementById('footer-text').textContent = t('footer');

  // Mode descriptions
  const modeDescs = {
    focus: t('modeFocusDesc'),
    divergent: t('modeDivergentDesc'),
    manual: t('modeManualDesc'),
  };
  modeDesc.textContent = modeDescs[currentMode] || '';

  // Lang button shows the OTHER language
  langBtn.textContent = t('langToggle');

  // Zone text
  updateZoneText();
}

function updateZoneText() {
  const D = parseFloat(dValue.textContent.replace('D = ', '')) || 0;
  if (D < 0.3) dZone.textContent = t('zoneFocus');
  else if (D < 0.7) dZone.textContent = t('zoneAlert');
  else dZone.textContent = t('zoneRoam');
}

function toggleLang() {
  const newLang = getLang() === 'en' ? 'zh' : 'en';
  setLang(newLang);
  chrome.runtime.sendMessage({ action: 'setLang', lang: newLang }, () => {
    applyI18n();
    fetchState();
  });
}

// ═══ Init ═══

function init() {
  // Get language from background first
  chrome.runtime.sendMessage({ action: 'getLang' }, (response) => {
    if (response && response.lang) {
      setLang(response.lang);
    }
    applyI18n();
    fetchState();
  });

  langBtn.addEventListener('click', toggleLang);
  anchorSetBtn.addEventListener('click', setAnchor);
  anchorInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') setAnchor(); });
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  updateTimer = setInterval(fetchState, 2000);
}

function fetchState() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    if (response.lang && response.lang !== getLang()) {
      setLang(response.lang);
      applyI18n();
    }
    updateUI(response);
  });
}

function updateUI(response) {
  const { today, realtime } = response;
  if (!realtime) return;

  // Anchor
  if (realtime.anchor && document.activeElement !== anchorInput) {
    anchorInput.value = realtime.anchor;
  }

  // Mode
  currentMode = realtime.mode || 'focus';
  modeBtns.forEach(btn => {
    btn.classList.remove('active', 'focus', 'divergent', 'manual');
    if (btn.dataset.mode === currentMode) {
      btn.classList.add('active', currentMode);
    }
  });

  const modeDescs = {
    focus: t('modeFocusDesc'),
    divergent: t('modeDivergentDesc'),
    manual: t('modeManualDesc'),
  };
  modeDesc.textContent = modeDescs[currentMode] || '';

  // Thermometer
  const D = realtime.D || 0;
  const dPercent = Math.min(100, (D / 1.5) * 100);
  thermometerIndicator.style.left = `calc(${dPercent}% - 2px)`;
  dValue.textContent = `D = ${D.toFixed(2)}`;

  if (D < 0.3) { dZone.textContent = t('zoneFocus'); dZone.className = 'thermometer-zone focus'; }
  else if (D < 0.7) { dZone.textContent = t('zoneAlert'); dZone.className = 'thermometer-zone alert'; }
  else { dZone.textContent = t('zoneRoam'); dZone.className = 'thermometer-zone roam'; }

  // Metrics
  const H_text = realtime.H_text || 0;
  const R = realtime.R || 0;
  const H_rate = realtime.H_rate || 0;
  const G = realtime.G || 0;

  hTextBar.style.width = `${Math.min(100, (H_text / 14) * 100)}%`;
  hTextValue.textContent = H_text.toFixed(1);

  rBar.style.width = `${Math.min(100, (R / 10) * 100)}%`;
  rValue.textContent = R.toFixed(1);

  hRateBar.style.width = `${Math.min(100, (H_rate / 2) * 100)}%`;
  hRateValue.textContent = H_rate.toFixed(2);

  gBar.style.width = `${Math.round(G * 100)}%`;
  gValue.textContent = `${Math.round(G * 100)}%`;

  // Stats
  if (today && today.stats) {
    const s = today.stats;
    focusTime.textContent = formatTime(s.focusMinutes || 0);
    roamTime.textContent = formatTime(s.roamMinutes || 0);
    focusRatio.textContent = `${Math.round((s.focusRatio || 0) * 100)}%`;
    maxStreak.textContent = `${Math.round(s.maxFocusStreak || 0)}m`;
  }

  // Current domain
  if (realtime.domain) {
    currentDomain.textContent = realtime.domain;
    const cat = realtime.category || 'S4';
    currentCategory.textContent = cat;
    currentCategory.className = `category-badge ${cat}`;
  }

  // Chart
  if (today && today.entropySeries) {
    drawChart(today.entropySeries);
  }
}

// ═══ SVG Chart ═══

function drawChart(series) {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const recent = series.filter(p => p.t >= oneHourAgo);
  if (recent.length < 2) return;

  const tMin = recent[0].t;
  const tMax = recent[recent.length - 1].t;
  const tRange = Math.max(1, tMax - tMin);

  function x(t) { return (t - tMin) / tRange * CHART_WIDTH; }
  function y(val, maxVal) {
    return CHART_HEIGHT - (Math.min(maxVal, val) / maxVal) * (CHART_HEIGHT - 4) - 2;
  }

  let dPath = '';
  for (let i = 0; i < recent.length; i++) {
    dPath += (i === 0 ? 'M' : 'L') + x(recent[i].t).toFixed(1) + ',' + y(recent[i].D, 1.5).toFixed(1) + ' ';
  }
  document.getElementById('chart-d-path').setAttribute('d', dPath);

  let hPath = '';
  for (let i = 0; i < recent.length; i++) {
    hPath += (i === 0 ? 'M' : 'L') + x(recent[i].t).toFixed(1) + ',' + y(recent[i].H_text, 14).toFixed(1) + ' ';
  }
  document.getElementById('chart-htext-path').setAttribute('d', hPath);

  let hrPath = '';
  for (let i = 0; i < recent.length; i++) {
    hrPath += (i === 0 ? 'M' : 'L') + x(recent[i].t).toFixed(1) + ',' + y(recent[i].H_rate, 2).toFixed(1) + ' ';
  }
  document.getElementById('chart-hrate-path').setAttribute('d', hrPath);
}

// ═══ Actions ═══

function setAnchor() {
  const anchor = anchorInput.value.trim();
  chrome.runtime.sendMessage({ action: 'setAnchor', anchor }, (response) => {
    if (chrome.runtime.lastError) return;
    anchorSetBtn.textContent = '✓';
    setTimeout(() => { anchorSetBtn.textContent = t('anchorSet'); }, 1000);
  });
}

function setMode(mode) {
  chrome.runtime.sendMessage({ action: 'setMode', mode }, (response) => {
    if (chrome.runtime.lastError) return;
    currentMode = mode;
    modeBtns.forEach(btn => {
      btn.classList.remove('active', 'focus', 'divergent', 'manual');
      if (btn.dataset.mode === mode) {
        btn.classList.add('active', mode);
      }
    });
    const modeDescs = {
      focus: t('modeFocusDesc'),
      divergent: t('modeDivergentDesc'),
      manual: t('modeManualDesc'),
    };
    modeDesc.textContent = modeDescs[mode] || '';
  });
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

init();
