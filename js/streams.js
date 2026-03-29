export const VIDEO_STREAMS = [
  { id: "al-jazeera", name: "Al Jazeera Live", type: "m3u8", value: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8", region: "Global" },
  { id: "dw-news", name: "DW News Live", type: "m3u8", value: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8", region: "Global" },
  { id: "sky-news", name: "Sky News Live", type: "m3u8", value: "https://skynews-glb-ios.amagi.tv/playlist.m3u8", region: "Global" },
  { id: "cna-news", name: "CNA Live", type: "m3u8", value: "https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a480973e06f1f5/index.m3u8", region: "Global" }
];

export function buildStreamEmbedUrl(stream) {
  if (stream.type === "channel") {
    return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(stream.value)}&autoplay=1&mute=1&rel=0`;
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(stream.value)}?autoplay=1&mute=1&rel=0`;
}

export function buildStreamWatchUrl(stream) {
  if (stream.type === "channel") {
    return `https://www.youtube.com/channel/${encodeURIComponent(stream.value)}/live`;
  }
  return `https://www.youtube.com/watch?v=${encodeURIComponent(stream.value)}`;
}
