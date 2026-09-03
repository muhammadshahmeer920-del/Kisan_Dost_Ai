import React, { useState, useRef } from 'react';
import { Volume2, Square, Loader2, AlertTriangle, ShieldCheck, Stethoscope, CheckCircle2, Clock } from 'lucide-react';

export interface AiDiagnosisReportProps {
  result: {
    detectedDisease: string;
    confidence: number;
    severity?: string;
    causes?: string[];
    precautions?: string[];
    recommendedMedicines?: string[];
    vetRequired?: boolean;
    recoveryDaysEstimate?: number;
    aiNotes?: string;
    description_ur?: string;
    treatment_ur?: string;
    audio_base64?: string;
    source?: string;
  };
  language?: 'ur' | 'en';
  animalName?: string;
  onClose?: () => void;
}

export const AiDiagnosisReport: React.FC<AiDiagnosisReportProps> = ({
  result,
  language = 'ur',
  animalName,
  onClose,
}) => {
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const isEn = language === 'en';
  const isUrdu = !isEn;

  const diagnosisTitle = result.detectedDisease || (isEn ? 'Disease Diagnostic Report' : 'تشخیصی رپورٹ');
  const diagnosisDescription = result.aiNotes || result.description_ur || '';

  // Resolve system voices reliably — Chrome loads them async after first paint.
  const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
    new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve([]);
        return;
      }
      const existing = window.speechSynthesis.getVoices();
      if (existing && existing.length > 0) {
        resolve(existing);
        return;
      }
      const onLoaded = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onLoaded);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', onLoaded);
      // Safety timeout so we never hang waiting for voices
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onLoaded);
        resolve(window.speechSynthesis.getVoices());
      }, 1500);
    });

  // Detect Urdu characters (Arabic Unicode block) to pick correct locale + voice
  const detectLocale = (text: string): { isUrdu: boolean; lang: string } => {
    const hasUrdu = /[\u0600-\u06FF]/.test(text);
    return { isUrdu: hasUrdu, lang: hasUrdu ? 'ur-PK' : 'en-US' };
  };

  const pickVoice = (
    voices: SpeechSynthesisVoice[],
    locale: { isUrdu: boolean; lang: string }
  ): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    if (locale.isUrdu) {
      return (
        voices.find((v) => v.lang === 'ur-PK') ||
        voices.find((v) => v.lang === 'ur') ||
        voices.find((v) => v.lang.startsWith('ur')) ||
        null
      );
    }
    // English path: explicitly prefer a male-sounding English voice
    const maleNameTokens = [
      'Male',
      'David',
      'Mark',
      'George',
      'James',
      'Daniel',
      'Aaron',
      'Arthur',
      'Oliver',
      'Google US English',
      'Google UK English Male',
      'Microsoft David',
      'Microsoft Mark',
      'Microsoft George',
    ];
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    const maleVoice =
      englishVoices.find((v) =>
        maleNameTokens.some((token) => v.name.toLowerCase().includes(token.toLowerCase()))
      ) ||
      // "Natural" neural voices are often male-leaning on Chromium
      englishVoices.find((v) => /natural/i.test(v.name)) ||
      null;
    return (
      maleVoice ||
      englishVoices.find((v) => v.lang === 'en-US') ||
      englishVoices.find((v) => v.lang === 'en-GB') ||
      englishVoices[0] ||
      null
    );
  };

  const speakWithLocale = async (text: string): Promise<SpeechSynthesisUtterance> => {
    const locale = detectLocale(text);
    const voices = await getVoicesAsync();
    const voice = pickVoice(voices, locale);

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = locale.isUrdu ? 'ur-PK' : 'en-US';
    // Male-leaning English tuning; Urdu keeps same rate for clarity
    utterance.rate = locale.isUrdu ? 0.95 : 0.9;
    utterance.pitch = locale.isUrdu ? 1.0 : 0.85; // Lower pitch for natural male tone
    return utterance;
  };

  const stopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsLoadingAudio(true);

    try {
      // If pre-generated Base64 audio exists (from Python ML model / gTTS), play it directly
      if (result.audio_base64) {
        const b64Data = result.audio_base64.startsWith('data:')
          ? result.audio_base64
          : `data:audio/mp3;base64,${result.audio_base64}`;
        const audio = new Audio(b64Data);
        activeAudioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        await audio.play();
        setIsPlaying(true);
        setIsLoadingAudio(false);
        return;
      }

      // Combine title, description, and treatment into clean text
      const fullTextToSpeak = `${diagnosisTitle}. ${diagnosisDescription} ${
        result.treatment_ur || (result.precautions ? result.precautions.join('. ') : '')
      }`.trim();

      // 1. Try Express / Python TTS endpoint first (/api/ai/tts or /api/tts)
      let audioPlayed = false;
      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fullTextToSpeak, lang: isUrdu ? 'ur' : 'en' }),
        });
        const data = await res.json();

        if (data.audioBase64 || data.audio_base64) {
          const b64 = data.audioBase64 || `data:audio/mp3;base64,${data.audio_base64}`;
          const audio = new Audio(b64);
          activeAudioRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          await audio.play();
          setIsPlaying(true);
          audioPlayed = true;
        }
      } catch (endpointErr) {
        console.warn('Backend TTS endpoint unreachable, falling back to Web Speech API:', endpointErr);
      }

      // 2. Fall back seamlessly to browser SpeechSynthesis if endpoint fails/unconfigured
      if (!audioPlayed && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = await speakWithLocale(fullTextToSpeak);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      // Last resort Web Speech API Fallback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = await speakWithLocale(diagnosisDescription);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden text-slate-800 dark:text-slate-100 transition-all">
      {/* Header Bar with Listen Button */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
              {isEn ? 'AI Diagnostic Verdict' : 'تشخیصی رپورٹ'}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              {diagnosisTitle}
            </h3>
          </div>
        </div>

        {/* Listen Button with 3 visual feedback states */}
        <button
          onClick={handlePlayAudio}
          disabled={isLoadingAudio}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg flex items-center space-x-2 rtl:space-x-reverse transition-all active:scale-95 cursor-pointer border ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 animate-pulse'
              : isLoadingAudio
              ? 'bg-amber-500/80 text-white border-amber-300 cursor-wait opacity-90'
              : 'bg-white text-emerald-900 hover:bg-emerald-50 border-white/40 shadow-emerald-900/20'
          }`}
          title={isEn ? 'Listen to Voice Guidance' : 'آواز میں سنیں'}
        >
          {isLoadingAudio ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isEn ? 'Loading Voice...' : 'آواز لوڈ ہو رہی ہے...'}</span>
            </>
          ) : isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current text-white" />
              <span>{isEn ? 'Stop Listening' : 'آواز بند کریں'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-600" />
              <span>{isEn ? 'Listen' : 'آڈیو سنیں'}</span>
            </>
          )}
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isEn ? `Confidence: ${result.confidence}%` : `اعتماد: ${result.confidence}%`}
          </span>

          {result.severity && (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              result.severity === 'severe' || result.severity === 'critical'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}>
              {isEn ? `Severity: ${result.severity}` : `شدت: ${result.severity}`}
            </span>
          )}

          {result.vetRequired && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isEn ? 'Urgent Vet Required' : 'ویٹرنری ڈاکٹر کی فوری ضرورت'}
            </span>
          )}

          {result.recoveryDaysEstimate && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isEn ? `Recovery: ~${result.recoveryDaysEstimate} Days` : `بحالی کا تخمینہ: ${result.recoveryDaysEstimate} دن`}
            </span>
          )}
        </div>

        {/* Main AI Explanation */}
        {result.aiNotes && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {result.aiNotes}
          </div>
        )}

        {/* Urdu Diagnosis Card if available */}
        {result.description_ur && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2 text-right" dir="rtl">
            <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
              طبی وضاحت (Urdu Clinical Explanation):
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {result.description_ur}
            </p>
          </div>
        )}

        {/* Treatment / Precautions */}
        {(result.treatment_ur || (result.precautions && result.precautions.length > 0)) && (
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-2">
            <h4 className="text-xs font-black text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>{isEn ? 'Recommended Actions & Precautions' : 'تجاویز اور پرہیز'}</span>
            </h4>
            {result.treatment_ur ? (
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed text-right" dir="rtl">
                {result.treatment_ur}
              </p>
            ) : (
              <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {result.precautions?.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiDiagnosisReport;
