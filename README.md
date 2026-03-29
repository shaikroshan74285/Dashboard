# MarketPulse India (GitHub Pages Ready)

MarketPulse India is a **frontend-only** market monitor focused on Indian traders.  
It now includes:

- 30+ versatile data panels (meters, maps, alerts, trending, boards, story cards, streams, widgets)
- RSS + quote fallback logic that works without backend routes
- Multilingual AI chat + voice flow (with optional Sarvam API key)
- Drag/reorder/resize dashboard panels

## Stack

- HTML + CSS + JS modules
- TradingView embedded widgets
- Public RSS/quote CORS-friendly fallback chain
- Optional Sarvam endpoints for chat, translation, and TTS

## Run Local

```bash
python -m http.server 5500
```

Open `http://localhost:5500`.

Windows quick start:

```bash
start-local.bat
```

Important: do not open `index.html` directly with `file://` if you expect live RSS/quote data.

## Deploy To GitHub Pages

1. Push this repo to GitHub.
2. In GitHub: `Settings -> Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main` (or your target branch), folder: `/ (root)`.
5. Save and wait for Pages build.

No backend setup is required.

## API Settings (Optional)

From `API Settings` inside the app you can set:

- Sarvam API key
- Chat endpoint/model
- Translation endpoint
- TTS endpoint/model + speaker
- Optional custom RSS proxy URL (`{url}` placeholder supported)
- Optional custom quote snapshot URL (`{symbols}` placeholder supported)

## Safety

AI output is constrained to educational analysis and blocks direct buy/sell execution instructions.  
Always do independent research.
