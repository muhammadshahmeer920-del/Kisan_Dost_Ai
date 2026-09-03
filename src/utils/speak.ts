/**
 * src/utils/speak.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Kisan Dost AI — Hybrid Text-to-Speech Utility
 *
 * PUBLIC API for all "سنیں / Listen" buttons in the application.
 *
 * ROUTING LOGIC:
 *   1. If text contains Urdu characters (U+0600-U+06FF):
 *      -> POST /api/ai/tts  ->  Python gTTS generates MP3  ->  play via Audio()
 *   2. If backend is offline or returns an error:
 *      -> fallback to window.speechSynthesis (ur-PK voice)
 *   3. If text is pure English / Latin:
 *      -> window.speechSynthesis (en-US voice)
 *
 * USAGE:
 *   import { speakHybrid, stopHybrid, detectTextLanguage } from '../utils/speak';
 *
 *   // In a component:
 *   await speakHybrid(urduText, {
 *     onStart:  () => setLoading(true),
 *     onReady:  () => setLoading(false),   // called when audio begins playing
 *     onEnd:    () => setPlaying(false),
 *     onError:  () => setLoading(false),
 *   });
 *
 * REACT HOOK:
 *   import { useTTS } from '../utils/speak';
 *
 *   const { speak, stop, isLoading, isPlaying } = useTTS();
 *   <button onClick={() => speak(text)} disabled={isLoading}>
 *     {isLoading ? 'لوڈ...' : 'سنیں'}
 *   </button>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef } from 'react';
import {
  speakHybrid as _speakHybrid,
  stopHybrid as _stopHybrid,
  speakText,
  cancel,
  cleanTextForSpeech,
  detectTextLanguage,
  isSpeaking,
} from '../lib/ttsService';

export type { TTSCallOptions } from '../lib/ttsService';

// Re-export core utilities
export { detectTextLanguage, cleanTextForSpeech, isSpeaking };

/**
 * Stop any active hybrid TTS session (both audio element and speechSynthesis).
 */
export function stopHybrid(): void {
  _stopHybrid();
}

/**
 * Hybrid TTS - primary entry point for all listen buttons.
 * Detects Urdu text and routes to backend gTTS for high-quality MP3.
 * Falls back seamlessly to browser speechSynthesis if backend is unavailable.
 */
export async function speakHybrid(
  text: string,
  options?: {
    onStart?: () => void;
    onReady?: () => void;
    onEnd?: () => void;
    onError?: (err?: unknown) => void;
  }
): Promise<boolean> {
  return _speakHybrid(text, options);
}

export { speakText, cancel };

// React Hook: useTTS
export interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  toggle: (text: string) => Promise<void>;
}

/**
 * React hook that wraps speakHybrid() with built-in loading and playing state.
 *
 * Example:
 *   const { speak, stop, isLoading, isPlaying, toggle } = useTTS();
 *   <button onClick={() => toggle(urduText)} disabled={isLoading}>
 *     {isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
 *     <span>{isLoading ? 'لوڈ ہو رہا ہے...' : isPlaying ? 'بند کریں' : 'سنیں'}</span>
 *   </button>
 */
export function useTTS(): UseTTSReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const abortedRef = useRef(false);

  const stop = useCallback(() => {
    abortedRef.current = true;
    stopHybrid();
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    stop();
    abortedRef.current = false;
    setIsLoading(true);
    setIsPlaying(false);

    await speakHybrid(text, {
      onStart: () => { if (!abortedRef.current) setIsLoading(true); },
      onReady: () => {
        if (!abortedRef.current) {
          setIsLoading(false);
          setIsPlaying(true);
        }
      },
      onEnd: () => { setIsLoading(false); setIsPlaying(false); },
      onError: () => { setIsLoading(false); setIsPlaying(false); },
    });
  }, [stop]);

  const toggle = useCallback(async (text: string) => {
    if (isPlaying || isLoading) { stop(); } else { await speak(text); }
  }, [isPlaying, isLoading, speak, stop]);

  return { speak, stop, isLoading, isPlaying, toggle };
}
