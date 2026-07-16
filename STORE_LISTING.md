# Chrome Web Store Listing

## Extension Name (max 45 chars)
Negentropy — Attention Entropy Monitor

## Summary (max 132 chars)
Measure the entropy of your digital mind. A thermodynamic approach to attention management.

## Description

Your attention is a thermodynamic system.

When you focus, your attention is ordered — low entropy, predictable, goal-directed. When you mind-wander through short videos and infinite feeds, your attention becomes disordered — high entropy, random, unpredictable.

Negentropy measures this entropy in real-time, right in your browser.

═══ How It Works ═══

▸ Set your daily anchor — what you're trying to focus on today
▸ Browse normally — Negentropy silently measures 5 entropy metrics
▸ Watch the entropy thermometer — see your attention state at a glance
▸ Get gentle alerts when your distraction index stays high
▸ Review your entropy timeline — spot when and why you wander

═══ Five Entropy Metrics ═══

• H_text — Shannon entropy of page content (information density)
• R — Information flow rate (new content per second)
• H_rate — Navigation transition entropy (how randomly you jump between sites)
• G — Goal relevance (how related is this page to your anchor)
• D — Distraction Index (composite: D = H_rate × (1-G) × switch frequency)

═══ Three Modes ═══

🎯 Focus — Alerts when D exceeds threshold for 5+ minutes
🌊 Divergent — 10-minute timed high-entropy window for creative exploration
📊 Manual — Observation only, no alerts. Build your personal baseline.

═══ Features ═══

• Real-time floating overlay — always visible, draggable, collapsible
• Entropy thermometer — visual gradient from blue (focus) to red (roam)
• Entropy timeline chart — 1-hour SVG curve of D, H_text, H_rate
• Daily statistics — focus/roam minutes, focus ratio, max streak
• Bilingual — English and Chinese, switch instantly
• 100% local — no cloud, no sync, no tracking, no external APIs
• Zero dependencies — pure JavaScript, no frameworks

═══ Privacy ═══

All data stays in chrome.storage.local. Nothing leaves your browser. No analytics, no telemetry, no external calls. Read our full privacy policy.

═══ The Science ═══

Inspired by Schrödinger's "What is Life?" — "Life feeds on negative entropy." Your attention does too. Focus requires a continuous input of negentropy (goals, reminders, structure) to resist the natural tendency toward entropy (distraction, wandering, noise).

═══ Perfect For ═══

• Researchers and students who get lost in the information ocean
• Developers who fall into Stack Overflow rabbit holes
• Writers who "research" for 3 hours instead of writing
• Anyone who has ever opened YouTube "just for a minute"

═══ Free Forever ═══

Negentropy v1.0 is completely free. Future versions may add optional Pro features (AI-powered interventions, cross-device sync), but the core entropy measurement will always be free.

═══════════════════════════════════════

Feed on negentropy, starve the noise.

## Category
Productivity

## Language
English
中文 (简体)

## Single Purpose
Measure and visualize the information entropy of web browsing activity to help users recognize and reduce mind-wandering.

## Permission Justification

| Permission | Justification |
|---|---|
| activeTab | Access current tab content to compute text entropy — only visible text, first 2000 chars, processed locally |
| scripting | Inject content script that samples page text every 5 seconds for entropy calculation |
| storage | Store entropy metrics, daily anchor, mode settings, and language preference in chrome.storage.local |
| webNavigation | Detect page navigations to record domain transitions for navigation entropy calculation |
| tabs | Query active tabs to broadcast real-time metrics updates to the floating overlay |
| alarms | Schedule periodic checks (every 1 minute) for distraction threshold alerts and data cleanup |
| notifications | Display desktop notification when distraction index exceeds threshold for 5+ minutes in Focus mode |

## Screenshots (to capture)

1. **Dashboard overview** — Popup with entropy thermometer, real-time metrics, mode selector
2. **Entropy timeline chart** — SVG curve showing D/H_text/H_rate over 1 hour
3. **Floating overlay** — On a real webpage, showing the draggable widget
4. **Alert notification** — Desktop notification when D exceeds threshold
5. **Bilingual demo** — Same dashboard in Chinese

## Promotional Images (to create)

- Small promo: 440x280 — Entropy thermometer + tagline
- Large promo: 920x680 — Dashboard screenshot + "Your attention is a thermodynamic system"
- Marquee: 1400x560 — Hero image with gradient background
