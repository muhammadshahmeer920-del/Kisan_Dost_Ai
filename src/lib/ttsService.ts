/**
 * Modular Text-to-Speech (TTS) Service using Web Speech Synthesis API.
 * 
 * Features:
 * - Intelligent voice selection for Urdu ('ur-PK', 'ur') and English ('en-US', 'en-GB')
 * - Modular `speakText(text, language)` and `cancel()` functions
 * - Markdown & symbol sanitization for natural pronunciation
 * - Automatic language script detection (Urdu vs. English)
 * - Full backward compatibility with existing application components
 */

import { Language } from '../types';

export interface TTSCallOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export interface TTSOptions extends TTSCallOptions {
  text: string;
  language?: Language | string;
  onNoVoiceWarning?: (msg: string) => void;
}

/**
 * Strips markdown symbols, formatting, emojis, and code blocks for clean vocalization.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold / italics
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown headers and links
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove emojis
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    // Format list markers
    .replace(/^[\*\-•]\s+/gm, ' ')
    .replace(/^(\d+)[\.\)]\s+/gm, '$1. ')
    // Normalize whitespace
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Detects whether text contains Urdu/Arabic characters or English Latin alphabet.
 */
export function detectTextLanguage(text: string, fallbackLang: Language | string = 'ur'): 'ur' | 'en' {
  if (!text || typeof text !== 'string') return fallbackLang === 'en' ? 'en' : 'ur';

  const clean = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .trim();

  if (!clean) return fallbackLang === 'en' ? 'en' : 'ur';

  // Urdu & Arabic unicode blocks
  const urduArabicMatches = clean.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const urduCount = urduArabicMatches ? urduArabicMatches.length : 0;

  // Latin letters
  const latinMatches = clean.match(/[a-zA-Z]/g);
  const latinCount = latinMatches ? latinMatches.length : 0;

  if (urduCount > 0 && urduCount >= latinCount * 0.4) {
    return 'ur';
  }

  if (latinCount > urduCount) {
    return 'en';
  }

  // Check unique Urdu characters
  if (/[\u06D2\u06BA\u0679\u0688\u0691\u06C1\u06BE]/.test(clean)) {
    return 'ur';
  }

  return fallbackLang === 'en' ? 'en' : 'ur';
}

/**
 * Returns available voices from SpeechSynthesis, ensuring browser voice list is populated.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Finds the optimal voice for Urdu ('ur-PK', 'ur') or English ('en-US', 'en-GB').
 */
export function getBestVoice(language: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) {
    return null;
  }

  const langKey = (language || 'ur').toLowerCase().trim();

  if (langKey.startsWith('ur') || langKey === 'pb' || langKey === 'pa') {
    // 1. Exact Urdu match: ur-PK, ur_PK, ur
    const exactUrdu = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return l === 'ur-pk' || l === 'ur' || l.startsWith('ur-') || n.includes('urdu') || n.includes('pakistan');
    });
    if (exactUrdu) return exactUrdu;

    // 2. Punjabi match (pa-PK, pa-IN, pa)
    const exactPunjabi = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      const n = v.name.toLowerCase();
      return l === 'pa-pk' || l === 'pa-in' || l.startsWith('pa') || n.includes('punjabi');
    });
    if (exactPunjabi) return exactPunjabi;

    // 3. Regional phonetic fallback for vowel structures (hi-IN, ar-SA)
    const regionalVoice = voices.find((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith('hi') || l.startsWith('ar');
    });
    if (regionalVoice) return regionalVoice;

    return null;
  }

  // English Voice Selection (Priority: en-US, en-GB, en-PK)
  const enUS = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'en-us';
  });
  if (enUS) return enUS;

  const enGB = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'en-gb';
  });
  if (enGB) return enGB;

  const anyEnglish = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return l.startsWith('en') || n.includes('english');
  });

  return anyEnglish || voices[0] || null;
}

/**
 * Cancels and immediately halts any ongoing speech synthesis playback.
 */
export function cancel(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error canceling speech synthesis:', e);
    }
  }
}

/**
 * Alias for cancel() to ensure seamless compatibility.
 */
export const stopSpeech = cancel;

/**
 * Checks if speech synthesis is currently active.
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking;
}

/**
 * Main modular function to speak text using the Web Speech Synthesis API.
 * 
 * @param text The text message to speak
 * @param language Target language ('ur' | 'ur-PK' | 'en' | 'en-US' | 'en-GB' | etc.)
 * @param options Optional voice rate, pitch, volume, and event callbacks
 * @returns boolean indicating whether speech was successfully initiated
 */
export function speakText(
  text: string,
  language: string = 'ur',
  options?: TTSCallOptions
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.onError) {
      options.onError(new Error('Web Speech Synthesis API is not supported in this environment.'));
    }
    return false;
  }

  // Cancel any prior active utterance
  cancel();

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) {
    return false;
  }

  // Resolve target language code and script detection
  const resolvedLang = language ? language.toLowerCase() : 'ur';
  const isUrdu = resolvedLang.startsWith('ur') || resolvedLang === 'pb' || detectTextLanguage(cleanedText) === 'ur';

  const targetLangCode = isUrdu ? 'ur-PK' : (resolvedLang.startsWith('en') ? resolvedLang : 'en-US');
  const utterance = new SpeechSynthesisUtterance(cleanedText);

  utterance.lang = targetLangCode;

  const chosenVoice = getBestVoice(isUrdu ? 'ur' : 'en');
  if (chosenVoice) {
    utterance.voice = chosenVoice;
  }

  // Voice parameters
  utterance.rate = options?.rate ?? (isUrdu ? 0.92 : 0.96);
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;

  // Event handlers
  utterance.onstart = () => {
    if (options?.onStart) options.onStart();
  };

  utterance.onend = () => {
    if (options?.onEnd) options.onEnd();
  };

  utterance.onerror = (event) => {
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      console.warn('SpeechSynthesis error:', event);
      if (options?.onError) options.onError(event);
    } else {
      if (options?.onEnd) options.onEnd();
    }
  };

  if (options?.onBoundary) {
    utterance.onboundary = options.onBoundary;
  }

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Failed to trigger window.speechSynthesis.speak:', err);
    if (options?.onError) options.onError(err);
    return false;
  }
}

// ── Hybrid TTS: server gTTS for Urdu, browser speechSynthesis for English ──

const URDU_REGEX = /[\u0600-\u06FF]/;
let hybridAudioRef: HTMLAudioElement | null = null;
let hybridAbortRef: AbortController | null = null;

/**
 * Stops any in-flight hybrid TTS request and halts audio playback.
 */
export function stopHybrid(): void {
  if (hybridAudioRef) {
    hybridAudioRef.pause();
    hybridAudioRef.currentTime = 0;
    hybridAudioRef = null;
  }
  if (hybridAbortRef) {
    hybridAbortRef.abort();
    hybridAbortRef = null;
  }
  cancel();
}

/**
 * Hybrid TTS: detects Urdu characters in text and routes to backend gTTS
 * for high-quality MP3 audio. Falls back to browser speechSynthesis for English.
 *
 * @param text Text to speak
 * @param options Callbacks for loading state (onStart fires when audio begins loading, onReady when playback starts, onEnd when finished)
 * @returns Promise<boolean> — true if speech was initiated successfully
 */
export async function speakHybrid(
  text: string,
  options?: TTSCallOptions & { onReady?: () => void }
): Promise<boolean> {
  stopHybrid();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    options?.onEnd?.();
    return false;
  }

  const isUrdu = URDU_REGEX.test(cleaned);

  if (!isUrdu) {
    options?.onStart?.();
    const result = speakText(cleaned, 'en', {
      onEnd: options?.onEnd,
      onError: options?.onError,
      onBoundary: options?.onBoundary,
    });
    if (result) options?.onReady?.();
    return result;
  }

  // Urdu path: call backend gTTS
  options?.onStart?.();
  hybridAbortRef = new AbortController();

  try {
    const response = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleaned, lang: 'ur' }),
      signal: hybridAbortRef.signal,
    });

    const data = await response.json() as {
      success: boolean;
      audioBase64?: string;
      error?: string;
    };

    if (!data.success || !data.audioBase64) {
      console.warn('[HybridTTS] Backend failed, falling back to browser speech:', data.error);
      options?.onReady?.();
      return speakText(cleaned, 'ur', {
        onEnd: options?.onEnd,
        onError: options?.onError,
      });
    }

    const audio = new Audio(data.audioBase64);
    hybridAudioRef = audio;

    audio.onended = () => {
      hybridAudioRef = null;
      options?.onEnd?.();
    };

    audio.onerror = (e) => {
      hybridAudioRef = null;
      console.warn('[HybridTTS] Audio playback error, falling back to browser speech:', e);
      options?.onReady?.();
      speakText(cleaned, 'ur', {
        onEnd: options?.onEnd,
        onError: options?.onError,
      });
    };

    options?.onReady?.();
    await audio.play();
    return true;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      options?.onEnd?.();
      return false;
    }
    console.warn('[HybridTTS] Fetch failed, falling back to browser speech:', err);
    options?.onReady?.();
    return speakText(cleaned, 'ur', {
      onEnd: options?.onEnd,
      onError: options?.onError,
    });
  }
}

/**
 * Singleton Class Wrapper for existing component integrations.
 */
class TTSService {
  private static instance: TTSService;

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  public speak(options: TTSOptions): { success: boolean; languageUsed: 'ur' | 'en'; warning?: string } {
    const lang = (options.language as string) || 'ur';
    const success = speakText(options.text, lang, {
      rate: options.rate,
      pitch: options.pitch,
      onStart: options.onStart,
      onEnd: options.onEnd,
      onError: options.onError
    });
    const detected = detectTextLanguage(options.text, options.language as Language);
    return { success, languageUsed: detected };
  }

  public stop(): void {
    cancel();
  }

  public cancel(): void {
    cancel();
  }

  public isSpeaking(): boolean {
    return isSpeaking();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return getAvailableVoices();
  }

  public findVoiceForLanguage(lang: 'ur' | 'en' | 'pb'): { voice: SpeechSynthesisVoice | null; isExactMatch: boolean } {
    const voice = getBestVoice(lang);
    return { voice, isExactMatch: !!voice };
  }
}

export const ttsService = TTSService.getInstance();
