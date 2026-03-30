export const WIDGETS = [
  {
    id: "tv-india-quotes",
    name: "India Live Snapshot",
    category: "India",
    script: "embed-widget-market-quotes.js",
    config: {
      width: "100%",
      height: "100%",
      symbolsGroups: [
        {
          name: "Indices & Top Stocks",
          originalName: "Indices",
          symbols: [
            { name: "Nifty 50", title: "Nifty 50" },
            { name: "BSE:SENSEX", title: "Sensex" },
            { name: "BSE:BANKNIFTY", title: "Bank Nifty" },
            { name: "NSE:RELIANCE", title: "Reliance" },
            { name: "NSE:TCS", title: "TCS" },
            { name: "NSE:HDFCBANK", title: "HDFC" }
          ]
        }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      colorTheme: "dark",
      locale: "en"
    }
  },
  {
    id: "tv-global-quotes",
    name: "Global Live Snapshot",
    category: "Global",
    script: "embed-widget-market-quotes.js",
    config: {
      width: "100%",
      height: "100%",
      symbolsGroups: [
        {
          name: "World Indices",
          originalName: "Indices",
          symbols: [
            { name: "OANDA:SPX500USD", title: "S&P 500" },
            { name: "OANDA:NAS100USD", title: "Nasdaq 100" },
            { name: "OANDA:HK33HKD", title: "Hang Seng" },
            { name: "OANDA:DE30EUR", title: "DAX" },
            { name: "OANDA:UK100GBP", title: "FTSE 100" }
          ]
        }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      colorTheme: "dark",
      locale: "en"
    }
  },
  {
    id: "tv-heatmap",
    name: "NSE Heatmap",
    category: "India",
    script: "embed-widget-stock-heatmap.js",
    config: {
      dataSource: "NSE",
      blockSize: "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: "en",
      colorTheme: "light",
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: 420,
    },
  },
  {
    id: "tv-technical",
    name: "Nifty Technicals",
    category: "Technical",
    script: "embed-widget-technical-analysis.js",
    config: {
      interval: "1D",
      width: "100%",
      height: 420,
      symbol: "NSE:NIFTY",
      showIntervalTabs: true,
      locale: "en",
      colorTheme: "light",
    },
  },
  {
    id: "tv-forex",
    name: "Forex Cross Rates",
    category: "Forex",
    script: "embed-widget-forex-cross-rates.js",
    config: {
      width: "100%",
      height: 420,
      currencies: ["USD", "INR", "EUR", "JPY", "GBP", "AUD", "CAD"],
      isTransparent: false,
      colorTheme: "light",
      locale: "en",
    },
  },
  {
    id: "tv-calendar",
    name: "Economic Calendar",
    category: "Macro",
    script: "embed-widget-events.js",
    config: {
      colorTheme: "light",
      width: "100%",
      height: 420,
      locale: "en",
      importanceFilter: "-1,0,1",
      currencyFilter: "INR,USD,EUR,GBP,JPY",
    },
  },
  {
    id: "tv-crypto",
    name: "Crypto Screener",
    category: "Crypto",
    script: "embed-widget-screener.js",
    config: {
      width: "100%",
      height: 420,
      defaultColumn: "overview",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      colorTheme: "light",
      locale: "en",
    },
  },
  {
    id: "tv-hotlists",
    name: "Top Gainers & Losers",
    category: "Market",
    script: "embed-widget-hotlists.js",
    config: {
      colorTheme: "light",
      dateRange: "12M",
      exchange: "US",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: 420,
    },
  },
  {
    id: "tv-gdp",
    name: "Global Economy & GDP",
    category: "Macro",
    script: "embed-widget-symbol-overview.js",
    config: {
      symbols: [
        ["Gold", "TVC:GOLD|1D"],
        ["India Bond Yield", "TVC:IN10Y|1D"],
        ["Crude Oil", "TVC:USOIL|1D"],
        ["S&P 500 VIX", "CBOE:VIX|1D"],
      ],
      chartOnly: false,
      width: "100%",
      height: 420,
      locale: "en",
      colorTheme: "light",
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
    },
  },
];

export function mountTradingViewWidget(hostId, scriptName, config) {
  const host = document.getElementById(hostId);
  if (!host) return;

  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "tradingview-widget-container";

  const widget = document.createElement("div");
  widget.className = "tradingview-widget-container__widget";
  container.appendChild(widget);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `https://s3.tradingview.com/external-embedding/${scriptName}`;
  script.innerHTML = JSON.stringify(config);
  container.appendChild(script);

  host.appendChild(container);
}
