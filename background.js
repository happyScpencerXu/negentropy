// ═══════════════════════════════════════════════════
// background.js — Service Worker
// Negentropy: 熵计算引擎 + 状态管理 + 提醒系统
// ═══════════════════════════════════════════════════

importScripts('i18n.js');

// ═══ 常量 ═══
const NAV_WINDOW_MS = 30 * 60 * 1000;   // 30分钟窗口
const ALERT_THRESHOLD = 0.7;
const ALERT_DURATION_SEC = 300;
const DIVERGENT_DEFAULT_SEC = 600;       // 发散模式默认10分钟

const DOMAIN_CATEGORIES = {
  search: ['google.com', 'bing.com', 'baidu.com', 'duckduckgo.com'],
  mail: ['mail.google.com', 'outlook.com', 'outlook.live.com'],
  news: ['news.google.com', 'news.ycombinator.com', 'techcrunch.com'],
  docs: ['docs.google.com', 'notion.so', 'overleaf.com'],
  code: ['github.com', 'gitlab.com', 'stackoverflow.com', 'codepen.io'],
  scholar: ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'semanticscholar.org'],
  social: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'bilibili.com',
           'tiktok.com', 'instagram.com', 'facebook.com', 'weibo.com', 'zhihu.com',
           'linkedin.com', 'tumblr.com', 'pinterest.com', 'snapchat.com'],
  shopping: ['amazon.com', 'taobao.com', 'jd.com', 'ebay.com'],
  entertainment: ['netflix.com', 'spotify.com', 'twitch.tv', 'disney.com', 'hulu.com'],
};

const DEFAULT_CONFIG = {
  whitelist: ['scholar.google.com', 'github.com', 'overleaf.com', 'docs.google.com', 'arxiv.org'],
  blacklist: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'bilibili.com',
              'tiktok.com', 'instagram.com', 'facebook.com', 'weibo.com', 'zhihu.com'],
  defaultMode: 'focus',
  alertThreshold: ALERT_THRESHOLD,
  alertDuration: ALERT_DURATION_SEC,
  enabled: true,
};

// ═══ 日期工具 ═══
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ═══ 状态 ═══
let state = { today: null, config: null };

let realtime = {
  currentDomain: '',
  currentCategory: '',
  currentH_text: 0,
  currentR: 0,
  currentH_rate: 0,
  currentG: 0,
  currentD: 0,
  textSamples: [],
  navSequence: [],
  alertStartTime: null,
  lastSampleTime: 0,
  anchor: '',
  mode: 'focus',
  divergentStart: null,
  divergentAllowance: 0,
  focusStreakStart: null,
};

// ═══ 初始化 ═══
async function init() {
  const data = await chrome.storage.local.get(['today', 'config', 'realtimeCache', 'lang']);

  state.config = data.config || DEFAULT_CONFIG;

  // 语言
  const lang = data.lang || 'en';
  setLang(lang);

  const todayKey = getTodayKey();
  if (data.today && data.today.date === todayKey) {
    state.today = data.today;
    realtime.anchor = state.today.anchor || '';
    realtime.mode = state.today.mode || 'focus';
  } else {
    state.today = createNewDay(todayKey);
    await saveState();
  }

  // 恢复实时缓存 (service worker重启后)
  if (data.realtimeCache && data.realtimeCache.date === todayKey) {
    realtime.navSequence = data.realtimeCache.navSequence || [];
    realtime.textSamples = []; // textSamples不持久化(含Set,无法序列化)
    realtime.currentDomain = data.realtimeCache.currentDomain || '';
    realtime.focusStreakStart = data.realtimeCache.focusStreakStart || null;
  }

  setupAlarms();
  console.log('[Negentropy] 初始化完成, anchor:', realtime.anchor, 'mode:', realtime.mode,
              'navSeq len:', realtime.navSequence.length);
}

function createNewDay(dateKey) {
  return {
    date: dateKey,
    anchor: '',
    mode: state.config ? state.config.defaultMode : 'focus',
    modeConfig: { divergentRatio: 0.2, threshold: ALERT_THRESHOLD },
    entropySeries: [],
    stats: {
      focusMinutes: 0, roamMinutes: 0, focusRatio: 0,
      maxFocusStreak: 0, distractionEvents: 0,
      peakD: 0, avgD: 0, avgH_text: 0, avgR: 0, avgH_rate: 0,
      _sumD: 0, _sumH_text: 0, _sumR: 0, _sumH_rate: 0, _count: 0,
    },
  };
}

async function saveState() {
  await chrome.storage.local.set({
    today: state.today,
    config: state.config,
    realtimeCache: {
      date: getTodayKey(),
      navSequence: realtime.navSequence.slice(-200),
      currentDomain: realtime.currentDomain,
      focusStreakStart: realtime.focusStreakStart,
    },
  });
}

// ═══ 定时器 ═══
function setupAlarms() {
  chrome.alarms.create('entropy-check', { periodInMinutes: 1 });
  chrome.alarms.create('daily-cleanup', { periodInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'entropy-check') checkEntropyAndAlert();
  else if (alarm.name === 'daily-cleanup') cleanupOldData();
});

// ═══ 熵计算引擎 ═══

function tokenize(text) {
  const tokens = [];
  const englishWords = text.match(/[a-z]{3,}/gi) || [];
  tokens.push(...englishWords.map(w => w.toLowerCase()));
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars[i] + chineseChars[i + 1]);
  }
  return tokens;
}

// 指标1: H_text
function calculateTextEntropy(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const N = tokens.length;
  let H = 0;
  for (const word in freq) {
    const p = freq[word] / N;
    H -= p * Math.log2(p);
  }
  return H;
}

// 指标2: R
function calculateInfoRate() {
  if (realtime.textSamples.length < 2) return 0;
  const recent = realtime.textSamples.slice(-6);
  let totalNewWords = 0;
  let totalTime = 0;
  for (let i = 1; i < recent.length; i++) {
    const prevWords = recent[i-1].words;
    const currWords = recent[i].words;
    let newCount = 0;
    for (const w of currWords) {
      if (!prevWords.has(w)) newCount++;
    }
    totalNewWords += newCount;
    totalTime += (recent[i].t - recent[i-1].t);
  }
  return totalTime > 0 ? totalNewWords / totalTime : 0;
}

// 指标3: H_rate — 修复: 使用 timestamp 键 + 毫秒一致
function calculateTransitionEntropyRate() {
  const now = Date.now();
  const recent = realtime.navSequence.filter(n => now - n.timestamp < NAV_WINDOW_MS);
  if (recent.length < 2) return 0;

  // 同时计算类别级和域名级的转移熵,取较大值
  const states4 = ['S1', 'S2', 'S3', 'S4'];

  // --- 类别级转移熵 ---
  const transCount4 = Array(4).fill(0).map(() => Array(4).fill(0));
  const stateCount4 = Array(4).fill(0);
  for (let i = 1; i < recent.length; i++) {
    const from = states4.indexOf(recent[i-1].category);
    const to = states4.indexOf(recent[i].category);
    if (from >= 0 && to >= 0) {
      transCount4[from][to]++;
      stateCount4[from]++;
    }
  }
  let H_cat = 0;
  const totalTrans = recent.length - 1;
  for (let i = 0; i < 4; i++) {
    const pi = stateCount4[i] / totalTrans;
    if (pi === 0) continue;
    for (let j = 0; j < 4; j++) {
      const Pij = stateCount4[i] > 0 ? transCount4[i][j] / stateCount4[i] : 0;
      if (Pij > 0) H_cat -= pi * Pij * Math.log2(Pij);
    }
  }

  // --- 域名级转移熵 (更细粒度) ---
  const domains = [...new Set(recent.map(n => n.domain))];
  if (domains.length < 2) return H_cat;
  const N = domains.length;
  const transCountD = {};
  const stateCountD = {};
  for (const d of domains) { transCountD[d] = {}; stateCountD[d] = 0; }
  for (let i = 1; i < recent.length; i++) {
    const from = recent[i-1].domain;
    const to = recent[i].domain;
    transCountD[from][to] = (transCountD[from][to] || 0) + 1;
    stateCountD[from]++;
  }
  let H_dom = 0;
  for (const i of domains) {
    const pi = stateCountD[i] / totalTrans;
    if (pi === 0) continue;
    for (const j of domains) {
      const Pij = stateCountD[i] > 0 ? (transCountD[i][j] || 0) / stateCountD[i] : 0;
      if (Pij > 0) H_dom -= pi * Pij * Math.log2(Pij);
    }
  }

  // 域名级熵通常更高,但归一化到 [0, 2] 范围
  return Math.min(2, Math.max(H_cat, H_dom * 0.5));
}

// 域名分类
function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function categorizeDomain(domain, anchor) {
  if (!domain) return 'S4';
  if (anchor && isAnchorRelated(domain, anchor)) return 'S1';
  const wl = (state.config && state.config.whitelist) || [];
  if (wl.some(d => domain === d || domain.endsWith('.' + d))) return 'S1';
  const bl = (state.config && state.config.blacklist) || [];
  if (bl.some(d => domain === d || domain.endsWith('.' + d))) return 'S3';
  for (const [cat, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => domain === d || domain.endsWith('.' + d))) {
      if (cat === 'social' || cat === 'shopping' || cat === 'entertainment') return 'S3';
      if (cat === 'search' || cat === 'mail' || cat === 'news') return 'S2';
      if (cat === 'docs' || cat === 'code' || cat === 'scholar') return 'S1';
    }
  }
  return 'S4';
}

function isAnchorRelated(domain, anchor) {
  if (!anchor || anchor.length < 2) return false;
  const anchorLower = anchor.toLowerCase();
  const anchorWords = anchorLower.split(/[\s,，]+/).filter(w => w.length > 1);
  const domainLower = domain.toLowerCase();
  for (const w of anchorWords) {
    if (domainLower.includes(w)) return true;
  }
  return false;
}

// 指标4: G — 修复: 加入基线,不返回0
function calculateGoalRelevance(domain, pageTitle, pageDescription) {
  const anchor = realtime.anchor;
  // 无锚点: 中性 0.5
  if (!anchor || anchor.length < 2) return 0.5;

  const anchorLower = anchor.toLowerCase();
  const anchorWords = anchorLower.split(/[\s,，]+/).filter(w => w.length > 1);
  const domainLower = (domain || '').toLowerCase();
  const titleLower = (pageTitle || '').toLowerCase();
  const descLower = (pageDescription || '').toLowerCase();

  // 白名单 = 1.0
  const wl = (state.config && state.config.whitelist) || [];
  if (wl.some(d => domain === d || domain.endsWith('.' + d))) return 1.0;

  // 黑名单 = 0.0
  const bl = (state.config && state.config.blacklist) || [];
  if (bl.some(d => domain === d || domain.endsWith('.' + d))) return 0.0;

  // 域名匹配
  let domainMatch = 0;
  for (const w of anchorWords) {
    if (domainLower.includes(w)) { domainMatch = 0.8; break; }
  }

  // 标题匹配
  let titleHits = 0;
  for (const w of anchorWords) {
    if (titleLower.includes(w)) titleHits++;
  }
  const titleMatch = anchorWords.length > 0 ? titleHits / anchorWords.length : 0;

  // 描述匹配
  let descHits = 0;
  for (const w of anchorWords) {
    if (descLower.includes(w)) descHits++;
  }
  const descMatch = anchorWords.length > 0 ? descHits / anchorWords.length : 0;

  const G = Math.max(domainMatch * 0.5, titleMatch * 0.3 + descMatch * 0.2, 0.3); // 基线0.3
  return G;
}

// 指标5: D
function calculateDistractionIndex() {
  const H_rate = realtime.currentH_rate;
  const G = realtime.currentG;
  const now = Date.now();
  const recentNavs = realtime.navSequence.filter(n => now - n.timestamp < 5 * 60 * 1000);
  const switchCount = Math.max(0, recentNavs.length - 1);
  const f_switch = Math.min(1, switchCount / 10);
  const D = H_rate * (1 - G) * f_switch;
  return D;
}

// ═══ 采样处理 ═══
function processSample(sample) {
  const { text, url, title, description } = sample;
  const domain = extractDomain(url);
  const category = categorizeDomain(domain, realtime.anchor);
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);

  // H_text
  const H_text = calculateTextEntropy(text);
  const tokens = tokenize(text);
  const wordsSet = new Set(tokens);

  // 更新文本样本窗口
  realtime.textSamples.push({ t: nowSec, H: H_text, words: wordsSet });
  if (realtime.textSamples.length > 72) realtime.textSamples.shift();

  // R
  const R = calculateInfoRate();

  // 导航序列 — 修复: 使用 timestamp 键 + 毫秒
  if (domain && domain !== realtime.currentDomain) {
    realtime.navSequence.push({ timestamp: nowMs, t: nowSec, domain, category });
    if (realtime.navSequence.length > 200) realtime.navSequence.shift();
  }
  realtime.currentDomain = domain;
  realtime.currentCategory = category;

  // H_rate
  const H_rate = calculateTransitionEntropyRate();

  // G
  const G = calculateGoalRelevance(domain, title, description);

  // 更新实时状态
  realtime.currentH_text = H_text;
  realtime.currentR = R;
  realtime.currentH_rate = H_rate;
  realtime.currentG = G;
  realtime.lastSampleTime = nowSec;

  // D
  realtime.currentD = calculateDistractionIndex();

  // 记录到时间序列
  if (state.today) {
    state.today.entropySeries.push({
      t: nowSec,
      H_text: Math.round(H_text * 100) / 100,
      R: Math.round(R * 100) / 100,
      H_rate: Math.round(H_rate * 100) / 100,
      G: Math.round(G * 100) / 100,
      D: Math.round(realtime.currentD * 100) / 100,
      domain, category,
    });

    // 统计
    updateStats(realtime.currentD);

    // 最长专注streak
    const threshold = state.today.modeConfig?.threshold || ALERT_THRESHOLD;
    if (realtime.currentD < threshold) {
      realtime.focusStreakStart = realtime.focusStreakStart || nowSec;
      const streakMin = Math.floor((nowSec - realtime.focusStreakStart) / 60);
      state.today.stats.maxFocusStreak = Math.max(state.today.stats.maxFocusStreak || 0, streakMin);
    } else {
      realtime.focusStreakStart = null;
    }

    // 每10个样本保存一次
    if (state.today.entropySeries.length % 10 === 0) saveState();
  }

  // 广播给所有tab的overlay
  broadcastToTabs();

  return {
    H_text: realtime.currentH_text,
    R: realtime.currentR,
    H_rate: realtime.currentH_rate,
    G: realtime.currentG,
    D: realtime.currentD,
    category,
  };
}

function updateStats(D) {
  if (!state.today) return;
  const s = state.today.stats;
  const threshold = state.today.modeConfig?.threshold || ALERT_THRESHOLD;
  const sampleMin = 5 / 60; // 5秒 = 1/12分钟

  if (D > threshold) s.roamMinutes += sampleMin;
  else s.focusMinutes += sampleMin;

  s.peakD = Math.max(s.peakD, D);
  s._sumD = (s._sumD || 0) + D;
  s._sumH_text = (s._sumH_text || 0) + realtime.currentH_text;
  s._sumR = (s._sumR || 0) + realtime.currentR;
  s._sumH_rate = (s._sumH_rate || 0) + realtime.currentH_rate;
  s._count = (s._count || 0) + 1;
  s.avgD = s._sumD / s._count;
  s.avgH_text = s._sumH_text / s._count;
  s.avgR = s._sumR / s._count;
  s.avgH_rate = s._sumH_rate / s._count;
  s.focusRatio = s.focusMinutes / (s.focusMinutes + s.roamMinutes || 1);
}

// ═══ 提醒系统 ═══
function checkEntropyAndAlert() {
  if (!state.today || !state.config.enabled) return;
  if (realtime.mode === 'manual') return;

  if (realtime.mode === 'divergent') {
    checkDivergentTimeout();
    return;
  }

  // focus mode
  const threshold = state.today.modeConfig?.threshold || ALERT_THRESHOLD;
  const alertDuration = state.config.alertDuration || ALERT_DURATION_SEC;
  const now = Math.floor(Date.now() / 1000);

  if (realtime.currentD > threshold) {
    if (!realtime.alertStartTime) {
      realtime.alertStartTime = now;
    } else if (now - realtime.alertStartTime >= alertDuration) {
      triggerAlert();
      realtime.alertStartTime = null;
      state.today.stats.distractionEvents++;
    }
  } else {
    realtime.alertStartTime = null;
  }
}

function triggerAlert() {
  const anchor = realtime.anchor || '—';
  const D = realtime.currentD.toFixed(2);
  const R = realtime.currentR.toFixed(1);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: t('notifTitle'),
    message: t('notifBody', { d: D, r: R, anchor }),
    priority: 2,
    buttons: [
      { title: t('notifBackToAnchor') },
      { title: t('notifEnterDivergent') },
    ],
  });
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) {
    const wl = (state.config && state.config.whitelist) || [];
    if (wl.length > 0) chrome.tabs.create({ url: `https://${wl[0]}` });
  } else if (btnIdx === 1) {
    setMode('divergent');
  }
});

function checkDivergentTimeout() {
  if (!realtime.divergentStart) return;
  const elapsed = Math.floor(Date.now() / 1000) - realtime.divergentStart;
  if (elapsed >= realtime.divergentAllowance) {
    setMode('focus');
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon128.png',
      title: t('notifDivergentEndTitle'), message: t('notifDivergentEndBody'), priority: 1,
    });
  }
}

// ═══ 消息处理 ═══
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sample') {
    const result = processSample(message.sample);
    sendResponse({ success: true, metrics: result });
  } else if (message.action === 'getState') {
    sendResponse({
      today: state.today,
      config: state.config,
      realtime: getRealtimeSnapshot(),
      lang: getLang(),
    });
  } else if (message.action === 'setAnchor') {
    realtime.anchor = message.anchor;
    if (state.today) { state.today.anchor = message.anchor; saveState(); }
    sendResponse({ success: true });
  } else if (message.action === 'setMode') {
    setMode(message.mode);
    sendResponse({ success: true });
  } else if (message.action === 'setLang') {
    setLang(message.lang);
    chrome.storage.local.set({ lang: message.lang }).then(() => {
      broadcastToTabs();
      sendResponse({ success: true });
    });
    return true; // async
  } else if (message.action === 'getLang') {
    sendResponse({ lang: getLang() });
  } else if (message.action === 'pageNavigation') {
    const domain = extractDomain(message.url);
    const category = categorizeDomain(domain, realtime.anchor);
    if (domain && domain !== realtime.currentDomain) {
      realtime.navSequence.push({ timestamp: Date.now(), t: Math.floor(Date.now()/1000), domain, category });
      if (realtime.navSequence.length > 200) realtime.navSequence.shift();
      realtime.currentDomain = domain;
      realtime.currentCategory = category;
      realtime.currentG = calculateGoalRelevance(domain, message.title, message.description);
      realtime.currentH_rate = calculateTransitionEntropyRate();
      realtime.currentD = calculateDistractionIndex();
      broadcastToTabs();
    }
    sendResponse({ success: true });
  }
  return true;
});

function setMode(mode) {
  realtime.mode = mode;
  if (state.today) {
    state.today.mode = mode;
    if (mode === 'divergent') {
      realtime.divergentStart = Math.floor(Date.now() / 1000);
      realtime.divergentAllowance = DIVERGENT_DEFAULT_SEC;
    } else {
      realtime.divergentStart = null;
    }
    saveState();
  }
  broadcastToTabs();
}

// ═══ 广播 ═══
function getRealtimeSnapshot() {
  return {
    H_text: realtime.currentH_text,
    R: realtime.currentR,
    H_rate: realtime.currentH_rate,
    G: realtime.currentG,
    D: realtime.currentD,
    domain: realtime.currentDomain,
    category: realtime.currentCategory,
    anchor: realtime.anchor,
    mode: realtime.mode,
    divergentRemaining: realtime.divergentStart
      ? Math.max(0, realtime.divergentAllowance - (Math.floor(Date.now()/1000) - realtime.divergentStart))
      : 0,
    navSequenceLen: realtime.navSequence.length,
    lang: getLang(),
  };
}

function broadcastToTabs() {
  const snapshot = getRealtimeSnapshot();
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'metricsUpdate', realtime: snapshot }).catch(() => {});
    }
  });
}

// ═══ 数据清理 ═══
async function cleanupOldData() {
  const data = await chrome.storage.local.get(null);
  const todayKey = getTodayKey();
  const todayDate = new Date();
  for (const key in data) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && key !== todayKey) {
      const ageDays = (todayDate - new Date(key)) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) {
        await chrome.storage.local.remove(key);
      } else if (ageDays > 7 && data[key].entropySeries) {
        const series = data[key].entropySeries;
        const downsampled = [];
        for (let i = 0; i < series.length; i += 12) {
          const bucket = series.slice(i, i + 12);
          if (bucket.length === 0) continue;
          downsampled.push({
            t: bucket[0].t,
            H_text: avg(bucket.map(b => b.H_text)),
            R: avg(bucket.map(b => b.R)),
            H_rate: avg(bucket.map(b => b.H_rate)),
            G: avg(bucket.map(b => b.G)),
            D: avg(bucket.map(b => b.D)),
            domain: bucket[bucket.length-1].domain,
            category: bucket[bucket.length-1].category,
          });
        }
        data[key].entropySeries = downsampled;
        await chrome.storage.local.set({ [key]: data[key] });
      }
    }
  }
}

function avg(arr) { return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length; }

// ═══ 启动 ═══
init();
