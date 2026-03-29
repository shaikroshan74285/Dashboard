function gn(query, region = "IN", lang = "en") {
  const hl = `${lang}-${region}`;
  const ceid = `${region}:${lang}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${region}&ceid=${ceid}`;
}

export const FEED_CATEGORIES = [
  "India Equities",
  "India Economy and Policy",
  "Corporate and IPO",
  "Global Markets",
  "Commodities and Energy",
  "Forex and Rates",
  "Banking and Regulation",
  "Crypto and Digital Assets",
  "Technology and AI",
  "Viral Trends and Hot Topics",
  "Brokers and Apps",
  "Beginner Learning",
];

export const RSS_FEEDS = [
  {
    id: "et-markets",
    name: "Economic Times Markets",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    category: "India Equities",
    region: "India",
  },
  {
    id: "et-stocks",
    name: "Economic Times Stocks",
    url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    category: "India Equities",
    region: "India",
  },
  {
    id: "livemint-markets",
    name: "LiveMint Markets",
    url: gn("LiveMint India markets stocks", "IN"),
    category: "India Equities",
    region: "India",
  },
  {
    id: "business-standard-markets",
    name: "Business Standard Markets",
    url: "https://www.business-standard.com/rss/markets-106.rss",
    category: "India Equities",
    region: "India",
  },
  {
    id: "moneycontrol-markets",
    name: "Moneycontrol Markets",
    url: gn("Moneycontrol markets Nifty Sensex", "IN"),
    category: "India Equities",
    region: "India",
  },
  {
    id: "nse-updates",
    name: "NSE Updates",
    url: gn("NSE India market updates", "IN"),
    category: "India Equities",
    region: "India",
  },
  {
    id: "bse-updates",
    name: "BSE Updates",
    url: gn("BSE India market updates", "IN"),
    category: "India Equities",
    region: "India",
  },
  {
    id: "india-economy-policy",
    name: "India Economy Policy",
    url: gn("India economy policy GDP inflation RBI", "IN"),
    category: "India Economy and Policy",
    region: "India",
  },
  {
    id: "pib-finance",
    name: "PIB Finance",
    url: gn("Press Information Bureau finance ministry India", "IN"),
    category: "India Economy and Policy",
    region: "India",
  },
  {
    id: "imf-economy",
    name: "IMF Economy",
    url: gn("IMF global economy growth outlook", "US"),
    category: "India Economy and Policy",
    region: "Global",
  },
  {
    id: "et-ipo",
    name: "Economic Times IPO",
    url: "https://economictimes.indiatimes.com/markets/ipos/fpos/rssfeeds/32997685.cms",
    category: "Corporate and IPO",
    region: "India",
  },
  {
    id: "livemint-companies",
    name: "LiveMint Companies",
    url: gn("LiveMint companies India corporate earnings", "IN"),
    category: "Corporate and IPO",
    region: "India",
  },
  {
    id: "bs-companies",
    name: "Business Standard Companies",
    url: "https://www.business-standard.com/rss/companies-101.rss",
    category: "Corporate and IPO",
    region: "India",
  },
  {
    id: "corporate-filings",
    name: "Corporate Filings and Results",
    url: gn("India corporate filing quarterly results", "IN"),
    category: "Corporate and IPO",
    region: "India",
  },
  {
    id: "reuters-markets",
    name: "Reuters Markets",
    url: gn("Reuters markets stocks bonds forex", "US"),
    category: "Global Markets",
    region: "Global",
  },
  {
    id: "wsj-markets",
    name: "WSJ Markets",
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    category: "Global Markets",
    region: "Global",
  },
  {
    id: "cnbc-top",
    name: "CNBC Top News",
    url: gn("CNBC markets economy inflation rates", "US"),
    category: "Global Markets",
    region: "Global",
  },
  {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
    category: "Global Markets",
    region: "Global",
  },
  {
    id: "marketwatch",
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    category: "Global Markets",
    region: "Global",
  },
  {
    id: "oil-and-energy",
    name: "Oil and Energy",
    url: "https://oilprice.com/rss/main",
    category: "Commodities and Energy",
    region: "Global",
  },
  {
    id: "gold-prices",
    name: "Gold and Bullion",
    url: gn("gold prices bullion MCX India", "IN"),
    category: "Commodities and Energy",
    region: "India",
  },
  {
    id: "commodity-outlook",
    name: "Commodity Outlook",
    url: gn("commodity market crude silver copper", "US"),
    category: "Commodities and Energy",
    region: "Global",
  },
  {
    id: "usd-inr",
    name: "USD INR",
    url: gn("USD INR rupee forex RBI", "IN"),
    category: "Forex and Rates",
    region: "India",
  },
  {
    id: "forex-global",
    name: "Global Forex",
    url: gn("forex markets dollar index rates", "US"),
    category: "Forex and Rates",
    region: "Global",
  },
  {
    id: "bond-yields",
    name: "Bond Yields",
    url: gn("bond yields treasury India GSec", "US"),
    category: "Forex and Rates",
    region: "Global",
  },
  {
    id: "sebi",
    name: "SEBI Announcements",
    url: "https://www.sebi.gov.in/sebirss.xml",
    category: "Banking and Regulation",
    region: "India",
  },
  {
    id: "rbi-press",
    name: "RBI Press Releases",
    url: "https://www.rbi.org.in/pressreleases_rss.xml",
    category: "Banking and Regulation",
    region: "India",
  },
  {
    id: "rbi-notifications",
    name: "RBI Notifications",
    url: "https://www.rbi.org.in/notifications_rss.xml",
    category: "Banking and Regulation",
    region: "India",
  },
  {
    id: "banking-sector",
    name: "Banking Sector News",
    url: gn("India banking NPA credit growth HDFC ICICI SBI", "IN"),
    category: "Banking and Regulation",
    region: "India",
  },
  {
    id: "cointelegraph",
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    category: "Crypto and Digital Assets",
    region: "Global",
  },
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "Crypto and Digital Assets",
    region: "Global",
  },
  {
    id: "crypto-india",
    name: "India Crypto Policy",
    url: gn("India crypto regulation taxation Web3", "IN"),
    category: "Crypto and Digital Assets",
    region: "India",
  },
  {
    id: "openai-news",
    name: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    category: "Technology and AI",
    region: "Global",
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "Technology and AI",
    region: "Global",
  },
  {
    id: "ai-markets",
    name: "AI in Trading",
    url: gn("AI trading algorithms market analysis", "US"),
    category: "Technology and AI",
    region: "Global",
  },
  {
    id: "investopedia",
    name: "Investopedia Learning",
    url: "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=article_daily",
    category: "Beginner Learning",
    region: "Global",
  },
  {
    id: "viral-news-in",
    name: "India Viral Market News",
    url: gn("India stock market breaking viral news", "IN"),
    category: "Viral Trends and Hot Topics",
    region: "India",
  },
  {
    id: "zerodha-tech",
    name: "Zerodha Tech Blog",
    url: "https://zerodha.tech/index.xml",
    category: "Brokers and Apps",
    region: "India",
  },
  {
    id: "upstox-news",
    name: "Upstox Updates",
    url: gn("Upstox new features trading", "IN"),
    category: "Brokers and Apps",
    region: "India",
  },
  {
    id: "trading-basics",
    name: "Trading Basics",
    url: gn("stock market basics beginner India trading", "IN"),
    category: "Beginner Learning",
    region: "India",
  },
  {
    id: "personal-finance-india",
    name: "Personal Finance India",
    url: gn("personal finance SIP insurance tax India", "IN"),
    category: "Beginner Learning",
    region: "India",
  },
];

export function getFeedsByCategory(category) {
  return RSS_FEEDS.filter((feed) => feed.category === category);
}

export function searchFeeds(query) {
  const q = query.toLowerCase();
  return RSS_FEEDS.filter((feed) => {
    return (
      feed.name.toLowerCase().includes(q) ||
      feed.category.toLowerCase().includes(q) ||
      feed.region.toLowerCase().includes(q)
    );
  });
}
