# Negentropy

> Feed on negentropy, starve the noise.

A Chrome extension that measures the entropy of your digital attention using information-theoretic measures.

## Quick Start

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this folder
5. Open the extension popup to set your daily anchor

## How It Works

Negentropy treats your attention as a thermodynamic system:

- **Focus** = low entropy = ordered = goal-directed = predictable
- **Mind-wandering** = high entropy = disordered = random walk = unpredictable

### Five Entropy Metrics

| Metric | Symbol | Description |
|--------|--------|-------------|
| Content Text Entropy | H_text | Shannon entropy of page text word frequencies |
| Information Flow Rate | R | Rate of new word emergence over time |
| Transition Entropy Rate | H_rate | Markov chain entropy rate of domain navigation sequence |
| Goal Relevance | G | Correlation between current page and your daily anchor |
| Distraction Index | D | Composite: D = H_rate × (1-G) × f(switch_count) |

### Three Modes

- **Focus**: Alerts when D exceeds threshold for 5+ minutes
- **Divergent**: Allows timed high-entropy periods for creative exploration
- **Manual**: Observation only, no alerts

## Architecture

```
background.js  — Service Worker: entropy engine + state + alerts
content.js     — Per-page: text sampling + URL detection + behavior tracking
popup.html/js  — Dashboard: entropy thermometer + real-time metrics + stats
```

Pure JavaScript, zero dependencies, zero external API calls. All computation is local.

## Privacy

All data stays in `chrome.storage.local`. No cloud, no sync, no tracking.

## License

MIT
