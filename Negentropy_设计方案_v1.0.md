# Negentropy — 注意力熵度量与干预系统 设计方案 v1.0

> 日期: 2026-07-16
> 作者: Spencer + Hermes
> 前身: Attention Pet (注意力宠物) — 保留扩展骨架, 核心思路重构
> 域名: negentropy.io (待注册)
> 定位: 以信息熵为理论框架的注意力量化与反馈系统

---

# 一、为什么从"注意力宠物"转向"Negentropy"

## 注意力宠物的问题

注意力宠物的核心思路是"情感羁绊驱动行为改变"——宠物因为你分心而受伤/死亡。
这个方向有感染力, 但存在根本性的局限:

1. **不本质**: 情感只是干预手段, 没有触及"为什么分心"的本质。宠物告诉你"你分心了", 但不告诉你"你的注意力状态有多混乱"
2. **不可量化**: HP是一个游戏化数值, 跟实际的认知状态没有数学关系。-15 HP意味着什么? 没有物理意义
3. **不可泛化**: 宠物模型依赖"情感投射", 但不同人的情感反应差异极大, 难以形成通用产品
4. **缺乏学术深度**: 无法支撑论文, 无法形成理论壁垒

## Negentropy的核心洞察

**无意识漫游的本质是注意力系统的熵增。**

人的注意力是一个热力学系统:
- 专注 = 低熵 = 有序 = 目标导向 = 可预测
- 漫游 = 高熵 = 无序 = 随机游走 = 不可预测

薛定谔在《生命是什么》中说: "生命以负熵为食。" 
你的注意力也是如此——专注状态需要持续输入"负熵流"(目标、提醒、限制)来抵抗自发熵增。

**Negentropy做的事: 量化你注意力的熵, 然后帮你注入负熵。**

这比"宠物受伤"深刻得多, 因为:
1. 熵是可测量的物理量, 有严格的数学定义
2. 熵的变化可以实时追踪, 形成时间序列
3. 熵的理论框架可以发表论文, 形成学术壁垒
4. 熵的概念本身就是Product Hunt的传播点——"你的注意力是一个热力学系统"

---

# 二、理论框架

## 2.1 信息熵与注意力

### 香农熵与内容不可预测性

一个网页内容的香农熵:
```
H_text = -Σ p_i log p_i
```
其中 p_i 是第 i 个词(或n-gram)在页面文本中的频率。

- 低熵: 重复内容、空白页、单一主题长文(条件熵低, 知道前文后文可预测)
- 高熵: 碎片化信息流、话题跳跃、标签密集、热词爆发

### 注意力的可变奖励机制

短视频/信息流的高成瘾性, 核心是"可变奖励"(variable reward)——你不知道下一条是什么。
这本质上是高信息熵: 每个新内容出现的概率分布很平坦, 新词、新画面难以预测。
高熵环境持续制造"预测失效", 多巴胺被持续点燃, 导致无意识漫游。

### 条件熵与深度阅读

传统长文/教科书虽然信息量大, 但上下文连贯, 条件熵低:
H(X_t | X_{t-1}, X_{t-2}, ...) << H(X_t)

知道前文, 后文的不确定性大幅下降。这正是"有益学习"和"有害漫游"的区别。

## 2.2 五个熵指标

### 指标 1: 内容文本熵 H_text

定义: 页面可见文本的词频Shannon熵。

提取: content.js 提取 document.body.innerText, 采样前2000字符。
分词: 空格分词(英文) + 字符级n-gram(中文)。
计算: 统计词频, 计算 H = -Σ p_i log2(p_i), 单位 bit。

特征:
- 空白页/重复内容: H_text ~ 2-4 bit
- 深度文章: H_text ~ 7-9 bit
- 碎片化信息流: H_text ~ 10-12 bit

局限: 高H_text不绝对等于分心(维基百科也高)。需结合指标3和5。

### 指标 2: 信息流速率 R

定义: 单位时间内页面新信息的涌现速率。

实现: 每5秒采样一次页面文本, 计算文本内容的变化量。
```
R(t) = H(text[t]) - H(text[t-Δt])    (简化版)
     或 = |unique_words[t] \ unique_words[t-Δt]| / Δt    (新词率)
```

特征:
- 深度阅读(停留同一页): R → 0 (文字不变)
- 刷短视频(每次滑动新内容): R极高且持续
- 无意识漫游: 高R + 高切换频率

核心洞察: R才是击中"无意识漫游"的关键指标。
大脑一直处于预测失效状态 → 多巴胺持续被点燃 → 漫游持续。

### 指标 3: 导航转移熵率 H_rate

定义: 把用户的浏览序列看作Markov链, 计算熵率。

状态空间 (4类):
```
S1: 目标相关深度页 (白名单域名 + 锚点关键词匹配)
S2: 浅层信息页 (搜索引擎、新闻聚合、邮件)
S3: 社交/视频页 (黑名单域名: youtube, twitter, reddit, bilibili等)
S4: 其他 (灰名单, 未分类)
```

转移概率矩阵 P_ij: 在滑动窗口(30分钟)内统计从状态i到状态j的转移次数, 归一化。
平稳分布 π_i: 状态i在窗口内的占比。

熵率:
```
H_rate = -Σ_i Σ_j π_i P_ij log2 P_ij
```

特征:
- 高度有序(始终在目标页内): H_rate → 0
- 无意识漫游(随机跳转): H_rate → 2 bit (4状态的均匀分布最大熵)

### 指标 4: 目标相关度 G

定义: 当前页面与用户设定的今日锚点的相关度, [0, 1]。

v1.0 计算 (纯本地, 无LLM):
```
G = max(
  域名匹配度 (白名单=1, 黑名单=0, 灰名单=0.5),
  标题关键词与锚点的Jaccard相似度,
  meta description与锚点的关键词重叠率
)
```

### 指标 5: 综合分心指数 D

定义: 综合以上指标的实时分心程度评估。

```
D = H_rate × (1 - G) × f(切换频率)
```

其中 f(x) = min(1, x / 10), x是过去5分钟的域名切换次数。

D的取值范围: [0, 2] (理论最大值), 实际经验范围 [0, 1.5]。

阈值 (初始值, 可根据个人基线校准):
- D < 0.3: 专注区 (蓝色)
- 0.3 ≤ D < 0.7: 警戒区 (黄色)
- D ≥ 0.7: 漫游区 (红色) → 触发提醒

## 2.3 注意力热力学模型

将"人-数字环境"看作耦合系统:

```
dS_attn/dt = (信息环境熵注入) - (目标导向的负熵流) - (自组织耗散)
```

- 信息环境熵注入: R × H_text (高熵信息流持续注入注意力系统)
- 目标导向负熵流: 目标提醒、专注模式限制 (外部输入的秩序)
- 自组织耗散: 大脑的自然注意力衰减 (疲劳)

专注 = 负熵流 > 熵注入
漫游 = 熵注入 > 负熵流 (系统自发走向高熵)

这个模型不是严格的物理方程, 而是一个有用的隐喻框架:
1. 它解释了为什么"提醒"有效 (注入负熵)
2. 它解释了为什么"疲劳后更容易分心" (负熵流衰减)
3. 它给出了量化方向: 测量熵注入率, 匹配负熵流

---

# 三、v1.0 产品定义

## 3.1 核心功能

v1.0 只做三件事:

1. **测量**: 实时计算5个熵指标, 形成注意力熵时间序列
2. **反馈**: 仪表盘可视化 + 阈值提醒
3. **记录**: 历史数据存储, 漫游热力图, 日报/周报

## 3.2 工作模式

### 专注模式 (Focus)
- D超阈值即提醒
- 目标: 保持低熵
- 提醒方式: 仪表盘变红 + 桌面通知

### 发散模式 (Divergent)
- 允许一定比例的高熵时段
- 用户设定比例 (如: 每50分钟允许10分钟高熵)
- 用于创造性探索、信息收集
- 发散模式下高熵不触发提醒, 但仍记录
- 发散模式时间到了会自动切回专注模式

### 手动模式
- 不提醒, 只记录
- 纯观测模式, 建立个人基线

## 3.3 仪表盘设计

仪表盘是Product Hunt截图的核心素材, 必须好看。

### 实时面板 (popup.html)

```
┌─────────────────────────────────────────────┐
│  Negentropy                          [⚙]    │
│                                              │
│  今日锚点: 写论文第三章                       │
│  模式: [专注] [发散] [手动]                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │                                       │   │
│  │    熵温度计                           │   │
│  │    ❄️━━━━━━━━━━━━━━━━🔥              │   │
│  │    0.28  [专注区]                     │   │
│  │                                       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  实时指标:                                    │
│  H_text  ████░░░░░░  7.2 bit                │
│  R       ██░░░░░░░░  1.8 word/s             │
│  H_rate  █░░░░░░░░░  0.3 bit                │
│  G       ████████░░  0.85                   │
│  D       ██░░░░░░░░  0.28  [专注区]         │
│                                              │
│  今日统计:                                    │
│  专注 2h 15m  |  漫游 0h 45m  |  比例 75%   │
│                                              │
│  [查看漫游热力图 →]                           │
│                                              │
└─────────────────────────────────────────────┘
```

### 熵温度计

从蓝色(低熵/专注/晶体)到红色(高熵/漫游/气态)的渐变条。
当前D值用指示器标记。
这是核心视觉符号, 所有截图和demo视频的中心。

### 漫游热力图 (dashboard页面)

24小时 x 7天的网格, 每个格子颜色代表该时段的平均D值。
红色 = 高熵漫游时段, 蓝色 = 低熵专注时段。
用户可以直观看到: "下午3点我总是漫游"

### 熵曲线图

过去N小时的D值时间序列曲线。
叠加锚点变化、模式切换事件标记。
类似股票K线图, 但是是注意力的"K线"。

## 3.4 提醒机制

### 阈值提醒
- D连续5分钟超过0.7 → 桌面通知
- 通知内容: "注意力熵持续偏高。当前信息流速率 R=X, 已偏离锚点「写论文」"
- 通知带两个按钮: [回到锚点] [进入发散模式]

### 锚点遗忘提醒
- 连续30分钟没有设定锚点 → 提醒设定
- "没有目标的浏览本身就是高熵状态"

### 日报
- 每天结束(或用户主动触发), 生成当日注意力熵报告
- 包含: 专注/漫游时长比例, D值曲线, 高熵时段top3, 低熵专注streak
- 可以截图分享 (Product Hunt传播素材)

## 3.5 v1.0 不做

- 不做agent / LLM语义判断 (v2.0加)
- 不做宠物 (可视化用熵温度计+曲线图替代)
- 不做声音
- 不做移动端
- 不做社交/排行榜
- 不做账号系统 (v1.0纯本地数据)
- 不做跨设备同步

## 3.6 v1.0 技术栈

- Chrome Extension MV3
- 纯 JS/CSS/SVG (零依赖, 零框架)
- chrome.storage.local (熵时间序列数据)
- chrome.alarms (定时采样)
- 无外部API调用

---

# 四、技术架构

## 4.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                    Chrome Extension (MV3)                      │
│                                                                │
│  ┌────────────────┐    ┌─────────────────┐    ┌────────────┐ │
│  │ background.js   │    │ content.js      │    │ popup.html │ │
│  │ (service worker)│    │ (每页注入)       │    │ (仪表盘)    │ │
│  │                 │    │                 │    │            │ │
│  │ - 熵计算引擎     │    │ - 文本采样       │    │ - 熵温度计  │ │
│  │ - 状态管理       │    │ - URL检测       │    │ - 实时指标  │ │
│  │ - 导航序列记录   │    │ - 页面变化检测   │    │ - 热力图    │ │
│  │ - 阈值判断       │    │ - 滚动/点击频率  │    │ - 日报      │ │
│  │ - 提醒触发       │    │                 │    │ - 锚点设置  │ │
│  │                 │    │                 │    │ - 模式切换  │ │
│  └───────┬─────────┘    └───────┬─────────┘    └─────┬──────┘ │
│          │                      │                     │        │
│          └──────────────────────┴─────────────────────┘        │
│                              │                                 │
│                     chrome.storage.local                       │
│               (熵时间序列/锚点/模式/配置/历史)                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## 4.2 文件结构

```
negentropy/
├── manifest.json
├── background.js          # service worker: 熵计算引擎 + 状态管理 + 提醒
├── content.js             # 每页注入: 文本采样 + URL检测 + 行为监控
├── popup.html             # 仪表盘UI
├── popup.js               # 仪表盘逻辑
├── popup.css              # 仪表盘样式
├── dashboard.html         # 详细热力图+曲线图页面 (可选, 也可集成在popup)
├── dashboard.js
├── vendor/
│   └── (无外部依赖)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 4.3 熵计算引擎 (核心算法)

### 文本采样 (content.js)

```javascript
// 每5秒采样一次
function samplePageText() {
  const text = document.body.innerText || '';
  // 采样前2000字符, 避免大页面的性能问题
  const sample = text.substring(0, 2000).toLowerCase();
  return sample;
}

// 检测页面内容变化 (信息流速率R的计算基础)
let lastTextHash = '';
function detectContentChange() {
  const currentText = samplePageText();
  const currentHash = simpleHash(currentText);
  const changed = currentHash !== lastTextHash;
  lastTextHash = currentHash;
  return { changed, text: currentText };
}
```

### 词频熵计算 (background.js)

```javascript
function calculateTextEntropy(text) {
  // 分词: 英文按空格, 中文按字符(2-gram)
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;

  // 统计词频
  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  // Shannon熵
  const N = tokens.length;
  let H = 0;
  for (const word in freq) {
    const p = freq[word] / N;
    H -= p * Math.log2(p);
  }
  return H; // 单位: bit
}

function tokenize(text) {
  const tokens = [];
  // 英文单词
  const englishWords = text.match(/[a-z]+/gi) || [];
  tokens.push(...englishWords.filter(w => w.length > 2));
  // 中文2-gram
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars[i] + chineseChars[i + 1]);
  }
  return tokens;
}
```

### 信息流速率计算

```javascript
// 维护一个滑动窗口, 每5秒一个数据点
const TEXT_SAMPLES_WINDOW = [];  // [{timestamp, H, newWords}]

function calculateInfoRate() {
  if (TEXT_SAMPLES_WINDOW.length < 2) return 0;
  const recent = TEXT_SAMPLES_WINDOW.slice(-6); // 最近30秒(6个5秒样本)
  let totalNewWords = 0;
  let totalTime = 0;
  for (let i = 1; i < recent.length; i++) {
    const prevWords = new Set(recent[i-1].words || []);
    const currWords = new Set(recent[i].words || []);
    const newWords = [...currWords].filter(w => !prevWords.has(w)).length;
    totalNewWords += newWords;
    totalTime += (recent[i].timestamp - recent[i-1].timestamp) / 1000;
  }
  return totalTime > 0 ? totalNewWords / totalTime : 0; // word/s
}
```

### 导航转移熵率计算

```javascript
// 状态分类
const DOMAIN_CATEGORIES = {
  // S1: 目标相关深度页 — 动态, 基于锚点匹配
  // S2: 浅层信息页
  search: ['google.com', 'bing.com', 'baidu.com', 'duckduckgo.com'],
  mail: ['mail.google.com', 'outlook.com'],
  news: ['news.google.com', 'news.ycombinator.com'],
  // S3: 社交/视频页
  social: ['youtube.com', 'twitter.com', 'x.com', 'reddit.com', 'bilibili.com',
           'tiktok.com', 'instagram.com', 'facebook.com', 'weibo.com', 'zhihu.com'],
  // S4: 其他
};

function categorizeDomain(domain, anchor) {
  // 先检查是否目标相关 (锚点关键词匹配)
  if (isAnchorRelated(domain, anchor)) return 'S1';
  for (const [cat, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => domain === d || domain.endsWith('.' + d))) {
      if (cat === 'social') return 'S3';
      return 'S2';
    }
  }
  return 'S4';
}

// 滑动窗口内的导航序列
const NAV_SEQUENCE = []; // [{timestamp, domain, category}]

function calculateTransitionEntropyRate() {
  const windowMs = 30 * 60 * 1000; // 30分钟窗口
  const now = Date.now();
  const recent = NAV_SEQUENCE.filter(n => now - n.timestamp < windowMs);
  if (recent.length < 2) return 0;

  const states = ['S1', 'S2', 'S3', 'S4'];
  const N = states.length;

  // 统计转移概率矩阵
  const transCount = Array(N).fill(0).map(() => Array(N).fill(0));
  const stateCount = Array(N).fill(0);

  for (let i = 1; i < recent.length; i++) {
    const from = states.indexOf(recent[i-1].category);
    const to = states.indexOf(recent[i].category);
    transCount[from][to]++;
    stateCount[from]++;
  }

  // 计算熵率 H = -Σ π_i P_ij log P_ij
  const totalTrans = recent.length - 1;
  let H_rate = 0;
  for (let i = 0; i < N; i++) {
    const pi = stateCount[i] / totalTrans;
    if (pi === 0) continue;
    for (let j = 0; j < N; j++) {
      const Pij = stateCount[i] > 0 ? transCount[i][j] / stateCount[i] : 0;
      if (Pij > 0) {
        H_rate -= pi * Pij * Math.log2(Pij);
      }
    }
  }
  return H_rate; // 单位: bit, 范围 [0, 2]
}
```

### 综合分心指数

```javascript
function calculateDistractionIndex() {
  const H_rate = calculateTransitionEntropyRate();
  const G = calculateGoalRelevance();
  const switchCount = countDomainSwitches(5 * 60 * 1000); // 过去5分钟
  const f_switch = Math.min(1, switchCount / 10);

  const D = H_rate * (1 - G) * f_switch;
  return D;
}
```

## 4.4 数据结构

```javascript
// chrome.storage.local

// 每日数据
{
  "2026-07-16": {
    anchor: "写论文第三章",
    mode: "focus",          // focus / divergent / manual
    modeConfig: {
      divergentRatio: 0.2,  // 发散模式占比 (仅divergent模式)
      threshold: 0.7,       // D阈值
    },
    entropySeries: [
      // 每5秒一个数据点 (仅活跃时段)
      { t: 1690000000, H_text: 7.2, R: 1.8, H_rate: 0.3, G: 0.85, D: 0.28, domain: "overleaf.com", category: "S1" },
      // ...
    ],
    navSequence: [
      { t: 1690000000, domain: "overleaf.com", category: "S1" },
      { t: 1690000300, domain: "google.com", category: "S2" },
      // ...
    ],
    stats: {
      focusMinutes: 135,
      roamMinutes: 45,
      focusRatio: 0.75,
      maxFocusStreak: 48,    // 最长连续低熵时段(分钟)
      distractionEvents: 3,   // D超阈值次数
      peakD: 1.2,
      avgD: 0.35,
    }
  }
}

// 全局配置
{
  "config": {
    whitelist: ["scholar.google.com", "github.com", "overleaf.com", "docs.google.com"],
    blacklist: ["youtube.com", "twitter.com", "x.com", "reddit.com", "bilibili.com",
                "tiktok.com", "instagram.com", "facebook.com", "weibo.com", "zhihu.com"],
    defaultMode: "focus",
    samplingInterval: 5,       // 秒
    alertThreshold: 0.7,
    alertDuration: 300,        // 连续超阈值多少秒才提醒
    enabled: true,
  }
}
```

### 存储优化

熵时间序列数据量: 每5秒1个数据点 × 每天8小时 = 5760个点/天
每个点约100字节 → 每天~576KB

优化策略:
- 只在页面活跃(非hidden)时采样
- 超过7天的数据自动降采样(从5秒→1分钟)
- 超过30天的数据只保留每日统计摘要

---

# 五、小论文规划

## 5.1 定位

方法论短文, 不是系统论文。目标是给产品学术背书 + arXiv占坑。

## 5.2 标题

"Quantifying Digital Mind-Wandering with Information-Theoretic Entropy Measures"

## 5.3 结构

### 1. Introduction
- 问题: 数字环境中的无意识漫游 (digital mind-wandering) 普遍但缺乏量化工具
- 现有工具(RescueTime, Forest等)只追踪"用了多久", 不测量"信息环境的无序程度"
- 提出用信息熵框架量化注意力状态

### 2. Related Work
- Mind-wandering研究 (心理学: Smallwood & Schooler, 2006)
- 数字分心 (digital distraction) 研究
- 信息熵在HCI中的应用 (搜索行为熵、交互熵)
- 注意力管理工具 (Forest, one sec, RescueTime)

### 3. Method
- 3.1 理论框架: 注意力热力学模型
- 3.2 五个熵指标的定义与计算
- 3.3 实现: Chrome扩展, 纯本地计算

### 4. Pilot Study
- N=1 自我实验 (作者使用2周)
- 数据: 熵时间序列 + 每日自评专注度 (1-10分)
- 分析:
  - D值与自评专注度的相关性 (预期负相关)
  - 高熵时段的行为模式分析
  - 熵指标区分"专注学习"和"无意识漫游"的能力

### 5. Discussion
- 负熵流作为注意力管理的理论框架
- 熵指标的局限性 (高熵≠有害, 需结合目标相关度)
- 从量化到干预: 闭环反馈系统的设计

### 6. Conclusion & Future Work
- v1.0纯算法度量, 未来加入agent主动干预
- 从桌面浏览器扩展到移动端
- 多用户数据验证

## 5.4 投稿目标

1. 首选: arXiv preprint (cs.HC) — 快速占坑, Product Hunt listing可引用
2. 正式投稿: CHI Workshop 或 INTERACT (2027 deadline)
3. 中文备选: 《计算机应用》或《软件学报》(快速发表)

## 5.5 时间线

- Week 1: 完成v1.0开发, 开始自我实验数据收集
- Week 2: 继续数据收集, 写论文Method和Related Work
- Week 3: 数据分析, 写Pilot Study和Discussion
- Week 4: 完成初稿, 上传arXiv

---

# 六、Product Hunt 发布计划

## 6.1 定位

Tagline: "Feed on negentropy, starve the noise."
副标题: "A thermodynamic approach to attention management — measure the entropy of your digital mind."

品类: Productivity + Developer Tools (跨品类增加曝光)

## 6.2 发布素材

### 必备
- [ ] 产品图标 (128x128, 熵温度计图标)
- [ ] 5张截图:
  1. 仪表盘全貌 (熵温度计 + 实时指标)
  2. 漫游热力图 (视觉冲击力最强)
  3. 熵曲线图 (时间序列)
  4. 提醒通知 (D值超阈值)
  5. 日报页面 (可截图分享)
- [ ] 1分钟demo视频: 展示从"专注→漫游→提醒→回到专注"的完整循环
- [ ] Product Hunt gallery图 (640x400或1280x800)

### Landing page (negentropy.io)
- Hero: 熵温度计动画 + tagline
- "How it works" 3步: 测量 → 反馈 → 优化
- 理论框架section (信息熵公式 + 注意力热力学模型)
- "Backed by research" section (链接arXiv论文)
- 安装按钮 (Chrome Web Store链接)

### 文案要点
- 第一句话: "Your attention is a thermodynamic system."
- 核心差异: "Most tools tell you HOW LONG you spent. Negentropy tells you HOW ENTROPIC your information environment was."
- 学术背书: "Based on information-theoretic entropy measures. Read the paper →"
- 物理学者彩蛋: 薛定谔"生命以负熵为食"的引用

## 6.3 传播策略

### Product Hunt launch day
- 找10-20个支持者提前准备好 (同事、朋友、Twitter粉丝)
- 美西时间00:01发布 (PH的排名算法 favor early upvotes)
- 发布当天每隔2小时发一条Twitter/X更新

### 内容营销 (launch前1-2周)
1. Twitter/X thread: "I built a Chrome extension that measures the entropy of your attention. Here's the physics behind it."
2. Reddit r/productivity: "I quantified my digital mind-wandering using information entropy. Here's what I found." (分享论文+产品)
3. Hacker News: "Show HN: Negentropy — Measuring attention entropy with a Chrome extension" (技术角度切入)

### 病毒性设计
- 日报可一键截图分享: "今天我的注意力熵是X, 专注比例Y%"
- 漫游热力图截图天然有传播力
- "你的注意力温度" 概念本身有话题性

## 6.4 定价

v1.0 完全免费。目标: 获取用户 + 论文引用 + PH排名。

v2.0 (加agent后):
- Free: 基础熵度量 + 专注模式
- Pro ($5/月): 发散模式 + 详细分析 + agent主动干预 + 跨设备同步

---

# 七、开发计划

## Phase 1: 熵计算引擎 (Day 1-2)

1. 从attention-pet复制扩展骨架 (manifest.json, content.js基础结构)
2. 实现文本采样 + tokenize + H_text计算
3. 实现信息流速率R计算 (页面变化检测)
4. 实现导航序列记录 + H_rate计算
5. 实现目标相关度G计算
6. 实现综合分心指数D计算
7. chrome.storage数据结构搭建

## Phase 2: 仪表盘UI (Day 3-4)

1. popup.html: 熵温度计 (CSS渐变 + 指示器)
2. popup.html: 5个实时指标条形图
3. popup.html: 今日统计摘要
4. popup.html: 锚点设置 + 模式切换
5. dashboard: 漫游热力图 (CSS grid + 颜色映射)
6. dashboard: 熵曲线图 (SVG折线图, 零依赖)

## Phase 3: 提醒与反馈 (Day 5)

1. chrome.alarms定时检查D值
2. 桌面通知 (chrome.notifications API)
3. 阈值判断逻辑 (连续N秒超阈值)
4. 日报生成 (每日摘要 + 截图分享)

## Phase 4: 自测与打磨 (Day 6-7)

1. 自己用1-2天, 验证熵指标的行为
2. 调参: 阈值、采样间隔、窗口大小
3. 边界情况: 空页面、超大页面、SPA路由
4. 性能优化: 采样开销 < 5ms
5. 录demo视频

## Phase 5: 论文 + PH准备 (Week 2)

1. 开始自我实验数据收集 (用v1.0记录2周)
2. 写论文初稿
3. 搭建landing page (negentropy.io)
4. 准备PH素材

---

# 八、与Attention Pet的关系

## 保留
- Chrome Extension MV3骨架 (manifest.json结构)
- background.js的导航监控/URL提取/域名判断逻辑
- content.js的URL变化检测/SPA路由检测
- chrome.storage数据管理思路
- 锚点(anchor)概念 — 保留并升级为目标相关度G的输入

## 废弃
- 宠物系统 (pet.js, pet.css) — 用熵温度计替代
- HP系统 — 用D值(分心指数)替代
- 情感对话气泡 — 用桌面通知替代
- 4种模式(硬核/三思/表情/宽松) — 用3种工作模式(专注/发散/手动)替代
- LLM语义判断 — v1.0移除, v2.0加agent时恢复

## 升级
- 黑白名单 → 域名分类(4类状态) + 动态锚点匹配
- 简单停留计时 → 信息流速率R计算
- 单一HP数值 → 5维熵指标体系
- 游戏化反馈 → 数据可视化反馈

---

# 九、风险与应对

## 技术风险

1. **MV3 service worker休眠**
   - 熵计算需要持续采样
   - 应对: chrome.alarms最短1分钟, 但content.js可以做秒级采样, 定期上报background
   - content.js存活时间 = 页面存活时间, 不受service worker休眠影响

2. **页面文本提取的跨域限制**
   - content.js只能操作当前页面DOM, 无法访问跨域iframe
   - 应对: 只提取主框架的document.body.innerText, 覆盖95%场景

3. **性能影响**
   - 每5秒采样一次页面文本, 可能影响页面性能
   - 应对: 采样限制在前2000字符, tokenize用正则而非NLP分词, 目标 < 5ms

4. **存储增长**
   - 熵时间序列数据量较大
   - 应对: 7天后降采样, 30天后只保留摘要

## 产品风险

1. **熵指标不直观**
   - 普通用户不懂"bit"是什么
   - 应对: UI上不显示单位, 只显示温度计颜色和百分比; 技术细节放在"关于"页面

2. **高熵≠分心的误判**
   - 维基百科/学习网站也是高熵
   - 应对: D值乘以(1-G), 目标相关度高时即使高熵也不判为分心

3. **用户觉得被监控**
   - 熵度量需要读取页面内容
   - 应对: 全部本地计算, 数据不离开浏览器; 隐私政策明确说明

---

# 十、长期路线图

## v1.0 (2026-07)
- 5个熵指标 + 仪表盘 + 专注/发散/手动模式
- 纯本地, 纯算法, 无agent
- Chrome Web Store免费发布
- arXiv论文

## v1.5 (2026-09)
- 个人基线校准 (自动学习用户的高/低熵模式)
- 周报/月报
- 数据导出 (CSV/JSON)
- Firefox支持

## v2.0 (2026-11)
- Agent主动干预 (LLM语义判断, 个性化提醒措辞)
- 移动端 (Screen Time API代理指标)
- 跨设备同步
- Pro版付费

## v3.0 (2027)
- 群体熵分析 (匿名数据, "你的注意力熵 vs 同龄人")
- 与生产力工具集成 (Notion, Todoist, Calendar)
- 开放API (第三方可以读取熵数据)
- 学术合作 (注意力研究数据集)
