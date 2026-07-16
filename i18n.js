// ═══════════════════════════════════════════════════
// i18n.js — Shared internationalization module
// Loaded by: background.js (importScripts), content.js (manifest), popup.js (script tag)
// ═══════════════════════════════════════════════════

const I18N = {
  en: {
    // Header
    settings: 'Settings',
    langToggle: '中文',

    // Anchor
    anchorLabel: "Today's Anchor",
    anchorPlaceholder: 'e.g. Write paper chapter 3',
    anchorSet: 'Set',

    // Mode
    modeLabel: 'Mode',
    modeFocus: 'Focus',
    modeDivergent: 'Divergent',
    modeManual: 'Manual',
    modeFocusDesc: '🎯 Focus: Alerts when D exceeds threshold for 5+ min. Goal: stay low-entropy.',
    modeDivergentDesc: '🌊 Divergent: 10-min high-entropy window for creative exploration.',
    modeManualDesc: '📊 Manual: Observation only, no alerts. Build your personal baseline.',

    // Thermometer
    entropyLabel: 'Attention Entropy',
    focusLabel: 'Focus',
    roamLabel: 'Roam',
    zoneFocus: 'Focus Zone',
    zoneAlert: 'Alert Zone',
    zoneRoam: 'Roam Zone',
    waitingData: 'Waiting for data...',

    // Chart
    chartLabel: 'Entropy Timeline (last 1h)',
    chartD: 'D Distraction',

    // Metrics
    metricsLabel: 'Real-time',

    // Stats
    statsLabel: 'Today',
    statFocus: 'Focus',
    statRoam: 'Roam',
    statRatio: 'Focus %',
    statStreak: 'Max Streak',

    // Current
    currentLabel: 'Current:',

    // Footer
    footer: 'Feed on negentropy, starve the noise.',

    // Overlay
    overlayWaiting: 'Waiting',
    overlayFocus: 'Focus',
    overlayAlert: 'Alert',
    overlayRoam: 'Roam',
    overlayAnchor: 'Anchor',

    // Notifications
    notifTitle: '⚠️ Negentropy — High Attention Entropy',
    notifBody: 'Distraction index D={d}, info rate R={r}/s\nDeviated from anchor "{anchor}"',
    notifBackToAnchor: 'Back to anchor',
    notifEnterDivergent: 'Enter divergent mode',
    notifDivergentEndTitle: 'Divergent mode ended',
    notifDivergentEndBody: 'Divergent time used up. Switching back to focus mode.',
  },

  zh: {
    // Header
    settings: '设置',
    langToggle: 'EN',

    // Anchor
    anchorLabel: '今日锚点',
    anchorPlaceholder: '例如：写论文第三章',
    anchorSet: '设定',

    // Mode
    modeLabel: '模式',
    modeFocus: '专注',
    modeDivergent: '发散',
    modeManual: '手动',
    modeFocusDesc: '🎯 专注：D值超阈值持续5分钟后提醒，目标是保持低熵',
    modeDivergentDesc: '🌊 发散：允许10分钟高熵时段，用于创造性探索',
    modeManualDesc: '📊 手动：只记录不提醒，纯观测建立个人基线',

    // Thermometer
    entropyLabel: '注意力熵',
    focusLabel: '专注',
    roamLabel: '漫游',
    zoneFocus: '专注区',
    zoneAlert: '警戒区',
    zoneRoam: '漫游区',
    waitingData: '等待数据...',

    // Chart
    chartLabel: '熵曲线（最近1小时）',
    chartD: 'D 分心指数',

    // Metrics
    metricsLabel: '实时指标',

    // Stats
    statsLabel: '今日统计',
    statFocus: '专注',
    statRoam: '漫游',
    statRatio: '专注比',
    statStreak: '最长专注',

    // Current
    currentLabel: '当前:',

    // Footer
    footer: '以负熵为食，饿死噪声。',

    // Overlay
    overlayWaiting: '等待',
    overlayFocus: '专注',
    overlayAlert: '警戒',
    overlayRoam: '漫游',
    overlayAnchor: '锚点',

    // Notifications
    notifTitle: '⚠️ Negentropy — 注意力熵偏高',
    notifBody: '分心指数 D={d}，信息流速率 R={r}/s\n已偏离锚点「{anchor}」',
    notifBackToAnchor: '回到锚点',
    notifEnterDivergent: '进入发散模式',
    notifDivergentEndTitle: '发散模式结束',
    notifDivergentEndBody: '发散时间已用完，自动切回专注模式',
  },
};

let _lang = 'en';

function setLang(lang) {
  _lang = (lang === 'zh') ? 'zh' : 'en';
}

function getLang() {
  return _lang;
}

function t(key, params) {
  const strings = I18N[_lang] || I18N.en;
  let s = strings[key] || I18N.en[key] || key;
  if (params) {
    for (const k in params) {
      s = s.replace('{' + k + '}', params[k]);
    }
  }
  return s;
}
