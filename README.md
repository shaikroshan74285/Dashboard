# 🇮🇳 MarketPulse India — Trader Intelligence Dashboard

> **Real-time market intelligence, 35+ data panels, live news streams, and multilingual AI chat — 100% frontend, zero backend required.**

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222?logo=github&logoColor=white)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 📊 Live Market Data
- **TradingView Ticker Tapes** — Real-time scrolling prices for Indian stocks, global indices, crypto, forex, and commodities
- **NSE Stock Heatmap** — Full-width interactive heatmap of NSE-listed stocks by sector and market cap
- **India & Global Live Snapshots** — Nifty 50, Sensex, Bank Nifty, S&P 500, Nasdaq, Hang Seng, and more
- **Forex Cross Rates** — Live currency pair matrix (USD, INR, EUR, JPY, GBP, AUD, CAD)
- **Crypto Screener** — Top cryptocurrencies with price, volume, and market cap
- **Economic Calendar** — Upcoming high-impact economic events filtered for India, US, Europe
- **Top Gainers & Losers** — Market movers ranked by performance
- **Global Economy & GDP** — Gold, India Bond Yield, Crude Oil, and VIX overview charts

### 📰 RSS News Feeds
- **15+ curated RSS sources** across categories:
  - India Markets (Economic Times, LiveMint, MoneyControl)
  - Global Markets (Reuters, Bloomberg, CNBC)
  - Crypto (CoinTelegraph, CoinDesk)
  - Tech & AI (OpenAI, TechCrunch)
  - Viral & Hot Topics
- Automatic sentiment tagging (positive / neutral / negative) on every headline
- Multi-proxy CORS fallback chain for reliable feed fetching

### 📺 Live News Streams
- **DW News** — Deutsche Welle 24/7 live stream (HLS)
- **Sky News** — Global news coverage (HLS)
- **CNA** — Channel NewsAsia live stream (HLS)
- All streams use HLS.js for native browser playback — no YouTube embed blocks

### 🧠 30+ Insight & Visualization Panels
| Category | Panels |
|---|---|
| **Pulse Meters** | Market Mood Meter, Risk Thermometer, Breadth Meter, News Velocity, Sentiment Mix, Safe Haven Meter, Volatility Radar, FII-DII Proxy, **Fear & Greed Index** |
| **Alerts & Trending** | Keyword Cloud, Trending Topics, Breaking Alerts, Regulation Alerts, IPO Monitor, Earnings Radar |
| **Maps & Flows** | Sector Rotation, Source Diversity, Category Flow, 24h Timeline, News Age Distribution, India Regions Map, Global Cues Map, **Sector Heatmap**, **News Frequency Tracker**, **Session Clock** |
| **Market Boards** | India Leaders, Global Leaders, Commodity Board, Forex Board, Crypto Board, **Currency Strength Meter**, **Top Movers Board** |
| **Articles & Briefs** | Top Story Cards, Action Watchlist, Beginner Brief, Next Watch Signals |

### 🤖 AI Market Chat (Sarvam AI)
- Contextual market Q&A powered by live RSS feed data
- **Multilingual support** — 11 Indian languages (Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia)
- **Text-to-Speech** — AI responses read aloud in your chosen language
- Compliance-aware responses (no direct trade instructions)

### 🎨 Premium UI
- Dark theme with glassmorphism panels and gradient accents
- Drag-and-drop panel reordering
- Collapsible, resizable panels
- Responsive grid layout (mobile-friendly)
- Sticky navigation bar with live IST clock and market session status

---

## 🚀 Live Demo

Deploy to GitHub Pages and access your dashboard at:
```
https://<your-username>.github.io/<repo-name>/
```

---

## 📁 Project Structure

```
dashboard/
├── index.html              # Main HTML shell
├── styles/
│   ├── base.css            # Design tokens, typography, buttons, inputs
│   ├── layout.css          # Grid system, topbar, status strip, ticker tape
│   ├── panels.css          # Panel cards, insight visualizations, new panel styles
│   ├── widgets.css         # TradingView widget hosts, modals, panel selection UI
│   └── ai.css              # AI chat drawer styles
├── js/
│   ├── main.js             # App bootstrap, event binding, data refresh loop
│   ├── state.js            # Global state, localStorage persistence, default panels
│   ├── panels.js           # Panel rendering, drag-and-drop, add/remove/resize
│   ├── insights.js         # 35+ insight panel renderers and data analysis engine
│   ├── widgets.js          # TradingView widget definitions and mount logic
│   ├── streams.js          # Live video stream URLs (HLS) and embed builders
│   ├── feeds.js            # RSS feed registry with 15+ curated sources
│   ├── fetcher.js          # Multi-proxy RSS fetch with CORS fallback chain
│   ├── parser.js           # RSS XML/JSON parsing and normalization
│   ├── sentiment.js        # Headline sentiment analysis (keyword-based)
│   ├── market.js           # Market quote fetching (Yahoo Finance fallback)
│   ├── clock.js            # IST clock and market session status
│   ├── ai.js               # Sarvam AI chat, translation, TTS integration
│   └── utils.js            # Shared utilities (escaping, formatting, debounce)
├── .gitignore
└── README.md
```

---

## 🛠️ Setup & Deployment

### Option 1: GitHub Pages (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit - MarketPulse India Dashboard"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to **Settings → Pages** in your repository
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
   - Click **Save**

3. **Access your dashboard**
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Option 2: Local Development

```bash
# Using any static file server
npx http-server . -p 5500 -c-1 --cors

# Then open
http://127.0.0.1:5500/
```

> **Note**: Opening `index.html` directly via `file://` protocol will block ES module imports. Always use an HTTP server.

---

## ⚙️ Configuration

Click **API Settings** in the top navigation bar to configure:

| Setting | Description | Required |
|---|---|---|
| Sarvam API Key | API key for AI chat, translation, and TTS | For AI features |
| Chat Endpoint | Sarvam chat completions URL | Optional (has default) |
| Chat Model | Model name (e.g., `sarvam-m`) | Optional (has default) |
| Translation Endpoint | Sarvam translate API URL | Optional |
| TTS Endpoint | Text-to-speech API URL | Optional |
| TTS Model | TTS model (e.g., `bulbul:v2`) | Optional |
| Speaker | Voice name (e.g., `anushka`) | Optional |
| RSS Proxy URL | Custom CORS proxy template | Optional |
| Broker Snapshot URL | Custom market quotes API | Optional |

All settings are saved in `localStorage` and persist across sessions.

---

## 🔌 Technology Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 semantic markup |
| **Styling** | Vanilla CSS with CSS custom properties |
| **Logic** | Vanilla JavaScript (ES modules) |
| **Charts** | TradingView embedded widgets (CDN) |
| **Live Video** | HLS.js for m3u8 stream playback (CDN) |
| **Fonts** | Google Fonts (Manrope, Space Grotesk) |
| **AI** | Sarvam AI API (optional, user-provided key) |
| **Hosting** | GitHub Pages (static files only) |

**Zero build tools. Zero npm dependencies. Zero backend.**

---

## 📋 Panel Management

- **Add panels**: Click `+ Add Panel` → browse by category or search → click `+ Add`
- **Remove panels**: Click the `x` button on any panel header
- **Collapse panels**: Click the `_` button to minimize
- **Reorder panels**: Drag panel headers to rearrange
- **Panel state**: Layout, sizes, and panel selection persist in localStorage

---

## 🌐 Data Sources

| Source | Type | Notes |
|---|---|---|
| TradingView | Widgets | Free embeddable market widgets |
| Yahoo Finance | Quotes | Market snapshot data (via CORS proxy) |
| RSS Feeds | News | 15+ feeds via public CORS proxy chain |
| HLS Streams | Video | DW News, Sky News, CNA — direct m3u8 |
| Sarvam AI | Chat | User-provided API key required |

---

## 🔒 Disclaimer

> This dashboard is for **education and market awareness only**. AI responses avoid direct trade instructions, target prices, and execution calls. Always do independent research and consult licensed professionals before making investment decisions.

---

## 📄 License

MIT License — free to use, modify, and distribute.
