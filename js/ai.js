import {
  DEFAULT_SETTINGS,
  SUPPORTED_LANGUAGES,
  persistChatHistory,
  persistSettings,
  refs,
  state,
} from "./state.js";
import { escapeHtml, formatDateTime } from "./utils.js";

const STARTER_MESSAGE =
  "Ask about sentiment, sector trends, risk triggers, or how to read today's market context. Direct trade calls are blocked.";

export function openAiDrawer() {
  if (!refs.aiDrawer || !refs.aiOverlay) return;
  refs.aiDrawer.classList.add("open");
  refs.aiDrawer.setAttribute("aria-hidden", "false");
  refs.aiOverlay.classList.remove("hidden");
  refs.chatQuestionInput?.focus();
}

export function closeAiDrawer() {
  if (!refs.aiDrawer || !refs.aiOverlay) return;
  refs.aiDrawer.classList.remove("open");
  refs.aiDrawer.setAttribute("aria-hidden", "true");
  refs.aiOverlay.classList.add("hidden");
}

export function renderLanguageSelects() {
  const options = SUPPORTED_LANGUAGES.map((lang) => {
    return `<option value="${lang.code}">${lang.label} (${lang.code})</option>`;
  }).join("");

  if (refs.defaultLanguageSelect) {
    refs.defaultLanguageSelect.innerHTML = options;
    refs.defaultLanguageSelect.value = state.lastResponseLanguage || "en-IN";
  }
  if (refs.voiceLanguageSelect) {
    refs.voiceLanguageSelect.innerHTML = options;
    refs.voiceLanguageSelect.value = state.lastResponseLanguage || "en-IN";
  }
}

export function renderSettingsForm() {
  if (refs.sarvamApiKeyInput) refs.sarvamApiKeyInput.value = state.settings.sarvamApiKey;
  if (refs.chatUrlInput) refs.chatUrlInput.value = state.settings.chatUrl;
  if (refs.chatModelInput) refs.chatModelInput.value = state.settings.chatModel;
  if (refs.translateUrlInput) refs.translateUrlInput.value = state.settings.translateUrl;
  if (refs.ttsUrlInput) refs.ttsUrlInput.value = state.settings.ttsUrl;
  if (refs.ttsModelInput) refs.ttsModelInput.value = state.settings.ttsModel;
  if (refs.speakerInput) refs.speakerInput.value = state.settings.speaker;
  if (refs.rssProxyUrlInput) refs.rssProxyUrlInput.value = state.settings.rssProxyUrl || "";
  if (refs.brokerApiUrlInput) refs.brokerApiUrlInput.value = state.settings.brokerApiUrl || "";
}

export function renderChatHistory() {
  if (!refs.aiChatThread) return;
  if (!state.aiChatHistory.length) {
    refs.aiChatThread.innerHTML = `<div class="chat-empty">${escapeHtml(STARTER_MESSAGE)}</div>`;
    return;
  }

  refs.aiChatThread.innerHTML = state.aiChatHistory
    .map((item) => {
      const cls = item.role === "user" ? "chat-msg chat-user" : "chat-msg chat-ai";
      const label = item.role === "user" ? "You" : `AI (${item.lang || "en-IN"})`;
      const stamp = item.ts ? formatDateTime(new Date(item.ts)) : "";
      return `<article class="${cls}">
        <header><strong>${escapeHtml(label)}</strong><span>${escapeHtml(stamp)}</span></header>
        <p>${escapeHtml(item.text || "")}</p>
      </article>`;
    })
    .join("");

  refs.aiChatThread.scrollTop = refs.aiChatThread.scrollHeight;
}

function pushChatMessage(message) {
  state.aiChatHistory.push(message);
  state.aiChatHistory = state.aiChatHistory.slice(-30);
  persistChatHistory();
  renderChatHistory();
}

export async function askAi() {
  const question = refs.chatQuestionInput?.value?.trim();
  if (!question) return setAiOutput("Enter a question first.");
  if (!state.feedItems.length) return setAiOutput("Feed context is empty. Add RSS panels and refresh.");

  openAiDrawer();
  pushChatMessage({ role: "user", text: question, lang: refs.defaultLanguageSelect?.value || "en-IN", ts: Date.now() });
  if (refs.chatQuestionInput) refs.chatQuestionInput.value = "";
  setAiOutput("Thinking with latest feed context...");

  try {
    const englishAnswer = enforceLegalCompliance(await requestChat(question, buildAiContext()));
    const targetLang = refs.defaultLanguageSelect?.value || "en-IN";
    let finalText = englishAnswer;
    let finalLang = "en-IN";
    const translations = { "en-IN": englishAnswer };

    if (targetLang !== "en-IN") {
      try {
        finalText = await translateText(englishAnswer, targetLang);
        finalLang = targetLang;
        translations[targetLang] = finalText;
      } catch (_) {
        finalText = englishAnswer;
        finalLang = "en-IN";
      }
    }

    state.lastAiResponse = englishAnswer;
    state.lastTranslatedResponse = finalText;
    state.lastResponseLanguage = finalLang;
    pushChatMessage({
      role: "assistant",
      text: finalText,
      lang: finalLang,
      baseEnglish: englishAnswer,
      translations,
      ts: Date.now(),
    });
    setAiOutput(`Response ready in ${finalLang}.`);
  } catch (error) {
    setAiOutput(`AI request failed: ${error.message}`);
  }
}



export async function runVoiceFlow() {
  const last = getLastAssistantMessage();
  if (!last) return setAiOutput("Ask AI first before voice output.");

  const targetLang = refs.voiceLanguageSelect?.value || refs.defaultLanguageSelect?.value || "en-IN";
  let text = last.translations?.[targetLang] || "";

  if (!text) {
    const englishText = last.baseEnglish || last.text;
    if (targetLang === "en-IN") {
      text = englishText;
    } else {
      try {
        text = await translateText(englishText, targetLang);
      } catch (_) {
        text = englishText;
      }
    }
    last.translations = { ...(last.translations || {}), [targetLang]: text, "en-IN": englishText };
  }

  setAiOutput(`Generating voice in ${targetLang}...`);
  try {
    await speakWithApi(text, targetLang);
    setAiOutput(`Voice played in ${targetLang}.`);
  } catch (apiError) {
    try {
      await browserSpeak(text, targetLang);
      setAiOutput(`Browser voice played in ${targetLang}.`);
    } catch {
      setAiOutput(`Voice failed: ${apiError.message}`);
    }
  }

  last.text = text;
  last.lang = targetLang;
  state.lastTranslatedResponse = text;
  state.lastResponseLanguage = targetLang;
  persistChatHistory();
  renderChatHistory();
}

export function onSaveSettings() {
  state.settings = {
    ...state.settings,
    sarvamApiKey: refs.sarvamApiKeyInput?.value.trim() || "",
    chatUrl: refs.chatUrlInput?.value.trim() || DEFAULT_SETTINGS.chatUrl,
    chatModel: refs.chatModelInput?.value.trim() || DEFAULT_SETTINGS.chatModel,
    translateUrl: refs.translateUrlInput?.value.trim() || DEFAULT_SETTINGS.translateUrl,
    ttsUrl: refs.ttsUrlInput?.value.trim() || DEFAULT_SETTINGS.ttsUrl,
    ttsModel: refs.ttsModelInput?.value.trim() || DEFAULT_SETTINGS.ttsModel,
    speaker: refs.speakerInput?.value.trim() || DEFAULT_SETTINGS.speaker,
    rssProxyUrl: refs.rssProxyUrlInput?.value.trim() || "",
    brokerApiUrl: refs.brokerApiUrlInput?.value.trim() || "",
  };
  persistSettings();
  if (refs.settingsModal) refs.settingsModal.classList.add("hidden");
  setAiOutput("Settings saved.");
}

function getLastAssistantMessage() {
  for (let i = state.aiChatHistory.length - 1; i >= 0; i -= 1) {
    if (state.aiChatHistory[i].role === "assistant") return state.aiChatHistory[i];
  }
  return null;
}

async function requestChat(question, context) {
  const systemPrompt = [
    "You are a market explainer for Indian retail users.",
    "Rules:",
    "1) Do not provide direct buy/sell/hold advice, target, stop-loss, or execution instructions.",
    "2) Explain what is happening, why it matters, and what users should watch next.",
    "3) Use only the provided feed context and mention uncertainty.",
    "4) Keep response clear for beginners in short paragraphs.",
    "5) Add: Not investment advice.",
    "6) Respond in plain English.",
  ].join("\n");

  const history = state.aiChatHistory
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-8)
    .map((item) => `${item.role.toUpperCase()}: ${item.baseEnglish || item.text}`)
    .join("\n");

  const payload = {
    model: state.settings.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Feed context:\n${context}\n\nRecent conversation:\n${history}\n\nUser question:\n${question}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 900,
  };

  const resp = await fetch(state.settings.chatUrl, {
    method: "POST",
    headers: buildSarvamHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content || json?.answer || json?.response || "";
  if (!text) throw new Error("No answer text in API response");
  return text.trim();
}

async function translateText(text, targetLanguage) {
  if (targetLanguage === "en-IN") return text;
  const payload = {
    input: text,
    source_language_code: "en-IN",
    target_language_code: targetLanguage,
    mode: "formal",
  };
  const resp = await fetch(state.settings.translateUrl, {
    method: "POST",
    headers: buildSarvamHeaders(),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const translated = json?.translated_text || json?.translation || json?.data?.translation || "";
  if (!translated) throw new Error("No translated text returned");
  return translated;
}

function chunkText(text, maxLen = 420) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const chunks = [];
  let current = "";
  cleaned.split(/(?<=[.!?;])\s+/).forEach((part) => {
    if (!part) return;
    if ((current + " " + part).trim().length <= maxLen) {
      current = `${current} ${part}`.trim();
      return;
    }
    if (current) chunks.push(current);
    if (part.length <= maxLen) {
      current = part;
      return;
    }
    for (let i = 0; i < part.length; i += maxLen) chunks.push(part.slice(i, i + maxLen));
    current = "";
  });
  if (current) chunks.push(current);
  return chunks;
}

async function speakWithApi(text, targetLanguage) {
  const chunks = chunkText(text);
  if (!chunks.length) throw new Error("No text to speak");

  for (const chunk of chunks) {
    const payload = {
      text: chunk,
      target_language_code: targetLanguage,
      model: state.settings.ttsModel,
      speaker: state.settings.speaker,
    };
    const resp = await fetch(state.settings.ttsUrl, {
      method: "POST",
      headers: buildSarvamHeaders(),
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const audioBase64 = json?.audios?.[0] || json?.audio || json?.data?.audio || "";
    if (!audioBase64) throw new Error("No audio stream received");
    const audio = base64ToAudio(audioBase64);
    await playAudio(audio);
  }
}

async function browserSpeak(text, lang) {
  if (!("speechSynthesis" in window)) throw new Error("Speech synthesis unavailable");
  const chunks = chunkText(text, 240);
  window.speechSynthesis.cancel();

  for (const chunk of chunks) {
    await new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Browser speech failed"));
      window.speechSynthesis.speak(utterance);
    });
  }
}

function playAudio(audio) {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().catch(reject);
  });
}

function base64ToAudio(base64) {
  const clean = base64.includes(",") ? base64.split(",").pop() : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Audio(URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })));
}

function buildSarvamHeaders() {
  const key = state.settings.sarvamApiKey;
  if (!key) throw new Error("Sarvam API key missing. Open API Settings and add your key.");
  return { "Content-Type": "application/json", "api-subscription-key": key };
}

function buildAiContext() {
  return state.feedItems
    .slice(0, 80)
    .map((item, idx) => {
      return `${idx + 1}. [${item.source}] ${item.title} | ${formatDateTime(item.publishedAt)} | ${item.sentiment.label}`;
    })
    .join("\n");
}

function enforceLegalCompliance(answer) {
  const text = (answer || "").trim();
  if (!text) return "No response generated.";
  const blocked = [
    /\b(?:buy now|sell now|strong buy|strong sell|go long|go short)\b/i,
    /\b(?:target price|stop ?loss|entry price|exit price)\b/i,
    /\b(?:i recommend|you should buy|you should sell)\b/i,
  ];
  if (blocked.some((pattern) => pattern.test(text))) {
    return "Compliance filter blocked direct trading instructions. Ask for neutral analysis instead. Not investment advice.";
  }
  return /not investment advice/i.test(text) ? text : `${text}\n\nNot investment advice.`;
}

export function setAiOutput(message) {
  if (refs.aiStatusText) refs.aiStatusText.textContent = message;
}
