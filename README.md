# MarketPulse India

MarketPulse India is a white-theme, high-density web dashboard for Indian traders and stock market learners.

It includes:
- RSS aggregation from Indian market, policy, and regulator sources
- Auto-refreshing timeline with sentiment and keyword extraction
- YouTube live stream wall for market channels
- AI Q&A over latest feed context
- Translation + voice output flow (Chat API -> Translate API -> TTS API)
- Legal-safe guardrails that block direct buy/sell style instructions

## Stack
- Frontend: HTML, CSS, JavaScript (runs without backend)
- Optional backend: Python FastAPI proxy for secure API key usage

## Project Structure

```text
.
|-- index.html
|-- styles.css
|-- app.js
|-- backend/
|   |-- app.py
|   |-- requirements.txt
|   |-- .env.example
```

## Quick Start (Frontend-Only)

1. Serve the folder (recommended, avoid opening as file://):

```bash
python -m http.server 5500
```

2. Open `http://localhost:5500`.
3. Click **API Settings** and add your Sarvam API key and endpoints.
4. Use **Refresh Now** to load feeds.
5. Ask AI questions in the AI panel.

## Optional Backend Proxy (Recommended for Public Deployment)

Use this so API keys are not exposed in browser code.

1. Setup backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

2. Update `.env` with your real `SARVAM_API_KEY`.
3. Run server:

```bash
uvicorn app:app --reload --port 8000
```

4. In frontend **API Settings**:
- Set mode to `Backend Proxy`
- Set backend URL to `http://127.0.0.1:8000`

## AI Safety Layer

The app applies two levels of safety:
1. Prompt-level instructions to avoid direct trading directives.
2. Output compliance filter that blocks phrases like direct buy/sell, target, stop-loss instructions.

This project is for education and market awareness only.

## Data Sources (Default)

The default feed list includes India-focused sources such as:
- Economic Times Markets/Stocks/IPO feeds
- Livemint Markets feed
- Business Standard Markets and Companies feeds
- SEBI RSS
- RBI Press Releases and Notifications RSS
- PIB economy feed
- Google News India market query RSS

You can add your own RSS URLs from the dashboard.

## Notes

- Some RSS providers can block direct browser requests. The app uses fallback methods (`allorigins` and `rss2json`) to improve reliability.
- If Sarvam endpoint formats change, update them in **API Settings** without touching code.
- TTS falls back to browser `speechSynthesis` if API audio fails.

## Open Source

You can publish this repo directly and extend it with:
- Portfolio tracking
- Alert rules and notifications
- Watchlist analytics
- Broker integrations

## Sarvam API Docs
- Chat Completions: https://docs.sarvam.ai/api-reference-docs/chat/completions
- Text to Speech: https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert

(Translation endpoint names can vary by account/version. Keep endpoint configurable in settings.)
