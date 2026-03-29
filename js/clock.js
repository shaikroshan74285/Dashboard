// ─── IST Clock & Market Session Status ───────────────────

import { refs } from "./state.js";
import { formatISTTime } from "./utils.js";

export function tickClock() {
  const now = new Date();
  if (refs.istClock) refs.istClock.textContent = formatISTTime(now);
  if (refs.marketStatus) refs.marketStatus.textContent = getMarketStatus(now);
}

export function getMarketStatus(date) {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = istDate.getDay();
  if (day === 0 || day === 6) return "Closed (Weekend)";
  const minutes = istDate.getHours() * 60 + istDate.getMinutes();
  if (minutes >= 540 && minutes < 555) return "Pre-Open";
  if (minutes >= 555 && minutes <= 930) return "Market Open";
  if (minutes > 930 && minutes <= 960) return "Post-Market";
  return "Closed";
}
