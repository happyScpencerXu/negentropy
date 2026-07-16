# Negentropy — Privacy Policy

**Last updated: July 16, 2026**

## Our Promise

Negentropy is built on a simple principle: **your data never leaves your browser.**

All data collection, processing, and storage happens entirely on your local device. We do not operate any servers. We do not collect, transmit, or store any personal data.

## What Data We Access

Negentropy is a Chrome extension that measures the "entropy" (information density and unpredictability) of the web pages you visit. To do this, it accesses:

1. **Page text content** — The extension reads the visible text of web pages you visit (`document.body.innerText`, first 2000 characters) to compute Shannon entropy. This text is processed in memory and **never stored in raw form**. Only the computed entropy value (a number) is saved locally.

2. **URL and page title** — The extension records the domain name and page title to categorize pages and compute goal relevance. Only the domain name is stored; full URLs and page titles are used transiently in memory.

3. **Scroll and click events** — The extension counts (anonymously) how many times you scroll or click during a 5-second sampling window. Only the count (a number) is used; no content of your interactions is recorded.

4. **Browser tab activity** — The extension monitors which tab is active to pause sampling when you switch away. No tab content or browsing history is transmitted.

## Where Data Is Stored

All data is stored in `chrome.storage.local`, which lives on your device inside Chrome's local profile. Data is **never** synced to Google Cloud, never sent to any external server, and never accessible to us or any third party.

## What Data We Do NOT Collect

- We do NOT collect or store raw page text
- We do NOT collect or store full URLs
- We do NOT collect or store browsing history
- We do NOT use analytics, telemetry, or tracking pixels
- We do NOT use any external API calls
- We do NOT have access to your passwords, cookies, or authentication tokens
- We do NOT collect any personally identifiable information

## Data Retention

- Entropy time-series data is stored locally for 30 days
- After 7 days, data is automatically downsampled (from 5-second to 1-minute resolution)
- After 30 days, data is automatically deleted
- You can clear all data at any time by removing the extension or clearing Chrome's local storage

## Third-Party Services

**None.** Negentropy does not communicate with any third-party service. There are no analytics SDKs, no crash reporters, no advertisement libraries, and no external API calls.

## Permissions Explained

| Permission | Why We Need It |
|---|---|
| `activeTab` | To access the current tab's page content for entropy calculation |
| `scripting` | To inject the content script that samples page text |
| `storage` | To store entropy metrics and settings locally |
| `webNavigation` | To detect when you navigate to a new page |
| `tabs` | To know which tab is active (for sampling) and broadcast updates |
| `alarms` | To run periodic entropy checks and alerts |
| `notifications` | To show desktop notifications when distraction index exceeds threshold |

## Open Source

Negentropy's source code is open. You can inspect every line of code to verify our privacy claims.

## Changes to This Policy

If we ever need to change this policy (e.g., adding optional cloud sync in a future version), we will:
1. Update this document
2. Clearly notify users in the extension
3. Require explicit opt-in for any data transmission

## Contact

For privacy questions, open an issue on our GitHub repository or contact: [your-email@example.com]

## License

This privacy policy is provided as-is for the Negentropy Chrome extension version 1.0.0.
