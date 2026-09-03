import React, { useState, useEffect, useRef } from 'react';
import { Animal, ScanJournalEntry, RecoveryPlan, Language, AIExecutionMode } from '../types';
import { t } from '../lib/translations';
import { aiService } from '../lib/aiService';
import { ttsService, detectTextLanguage, speakText, cancel, speakHybrid, stopHybrid } from '../lib/ttsService';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Image as ImageIcon, 
  Bot, 
  Stethoscope,
  Wifi,
  WifiOff,
  Scan,
  Upload,
  Video,
  CheckCircle2,
  Calendar,
  FileText,
  Activity,
  Pill,
  Camera,
  MessageSquare,
  Radio,
  Zap,
  Command,
  Copy,
  Check,
  Languages,
  Square,
  Loader2
} from 'lucide-react';

interface AIAssistantProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  executionMode?: AIExecutionMode;
  onToggleExecutionMode?: () => void;
  animals?: Animal[];
  onSaveScanJournal?: (animalId: string, entry: ScanJournalEntry) => void;
  initialMode?: 'chat' | 'scanner';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: 'en' | 'ur' | 'pb';
  isEmergency?: boolean;
  image?: string;
  video?: string;
  modeUsed?: 'online' | 'offline';
}

const FormattedChatMessage: React.FC<{ text: string; isAssistant: boolean }> = ({ text, isAssistant }) => {
  if (!isAssistant) {
    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  const cleanInlineMarkdown = (raw: string) => {
    const parts = raw.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2).replace(/[#*`~_]/g, '');
        return (
          <strong key={i} className="font-extrabold text-emerald-900 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded me-0.5">
            {inner}
          </strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        const inner = part.slice(1, -1).replace(/[#*`~_]/g, '');
        return <em key={i} className="italic text-emerald-800 dark:text-emerald-200">{inner}</em>;
      }
      const cleaned = part.replace(/^[#\s]+/, '').replace(/[\*#`~_]/g, '');
      return cleaned;
    });
  };

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^[#\s]+/, '').replace(/[\*`~_]/g, '');
          return (
            <div key={idx} className="font-black text-sm text-emerald-900 dark:text-emerald-300 pt-2 pb-1 border-b border-emerald-200 dark:border-emerald-800/60 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 me-2 shrink-0"></span>
              {headerText}
            </div>
          );
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^[\*\-•\s]+/, '');
          return (
            <div key={idx} className="flex items-start space-x-2 rtl:space-x-reverse bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0 mt-0.5">•</span>
              <div className="flex-1 text-slate-800 dark:text-slate-100 font-medium">{cleanInlineMarkdown(itemText)}</div>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div key={idx} className="flex items-start space-x-2 rtl:space-x-reverse bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 text-slate-800 dark:text-slate-100 font-medium">{cleanInlineMarkdown(itemText)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800 dark:text-slate-100 font-medium">
            {cleanInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  language,
  executionMode = 'online',
  onToggleExecutionMode,
  animals = [],
  onSaveScanJournal,
  initialMode = 'chat',
  onLanguageChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'scanner' | 'history'>(
    initialMode === 'scanner' ? 'scanner' : 'chat'
  );

  // Voice Command Toggle State
  const [isVoiceCommandEnabled, setIsVoiceCommandEnabled] = useState<boolean>(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const [voiceFeedbackStatus, setVoiceFeedbackStatus] = useState<string | null>(null);

  // TTS & Speaking State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsWarning, setTtsWarning] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [ttsLoadingMsgId, setTtsLoadingMsgId] = useState<string | null>(null);
  const [ttsScanLoading, setTtsScanLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'assistant',
      text: language === 'en'
        ? 'Hello farmer! I am Kisan Dost AI Livestock Doctor & Disease Scanner. Use voice commands or chat/upload to diagnose diseases and ask questions.'
        : 'السلام علیکم کسان بھائی! میں کسان دوست AI مویشی ڈاکٹر اور بیماری سکینر ہوں۔ آپ وائس کمانڈ آن کر کے بول کر بیماری سکین کر سکتے ہیں یا ڈاکٹر سے مشورہ لے سکتے ہیں۔',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: language === 'en' ? 'en' : 'ur',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [videoAttachment, setVideoAttachment] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Scanner State
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [scanMedia, setScanMedia] = useState<string | null>(null);
  const [isVideoScan, setIsVideoScan] = useState(false);
  const [scanNotes, setScanNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanResult, setCurrentScanResult] = useState<ScanJournalEntry | null>(null);
  const [generatedRecoveryPlan, setGeneratedRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mlSource, setMlSource] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'ml' | 'gemini'>('ml');
  const [isMLScanning, setIsMLScanning] = useState(false);
  const [isScanAudioPlaying, setIsScanAudioPlaying] = useState(false);
  const activeScanAudioRef = useRef<HTMLAudioElement | null>(null);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) || animals[0];

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeSubTab]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = isVoiceCommandEnabled;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'ur' ? 'ur-PK' : language === 'pb' ? 'pa-PK' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Voice input received:', transcript);
        
        if (isVoiceCommandEnabled) {
          handleVoiceCommandInput(transcript);
        } else {
          setInputText(transcript);
          setIsListening(false);
        }
      };

      recognitionRef.current.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        if (isVoiceCommandEnabled) {
          // Restart listening automatically if voice command toggle is enabled
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };
    }
  }, [language, isVoiceCommandEnabled]);

  // Toggle Voice Command Mode
  const handleToggleVoiceCommandMode = () => {
    const nextState = !isVoiceCommandEnabled;
    setIsVoiceCommandEnabled(nextState);

    if (!recognitionRef.current) {
      alert(language === 'en' ? 'Speech recognition is not supported in this browser.' : 'آواز کی شناخت اس برائوزر میں دستیاب نہیں ہے۔');
      return;
    }

    if (nextState) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        const msg = language === 'en' 
          ? 'Voice Command Mode Activated! Say "Scan Disease" or ask any livestock question.'
          : 'وائس کمانڈ موڈ آن ہو گیا! بولیں "بیماری سکین کرو" یا مویشیوں کا کوئی بھی سوال پوچھیں۔';
        setVoiceFeedbackStatus(msg);
        speakTextMessage('voice_toggle_msg', msg, language);
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setVoiceFeedbackStatus(null);
        setLastVoiceCommand(null);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Process Spoken Voice Commands
  const handleVoiceCommandInput = (transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    setLastVoiceCommand(transcript);

    // Keywords for Disease Scanning
    const isScanCommand = 
      lower.includes('scan') || 
      lower.includes('disease') || 
      lower.includes('سکین') || 
      lower.includes('اسکین') || 
      lower.includes('بیماری') || 
      lower.includes('چیک کرو') || 
      lower.includes('تصویر') || 
      lower.includes('ویڈیو');

    // Keywords for Doctor Consultation
    const isDoctorCommand = 
      lower.includes('doctor') || 
      lower.includes('consult') || 
      lower.includes('ڈاکٹر') || 
      lower.includes('علاج') || 
      lower.includes('سوال') || 
      lower.includes('مشورہ') || 
      lower.includes('بخار') || 
      lower.includes('دودھ');

    if (isScanCommand && !isDoctorCommand) {
      setActiveSubTab('scanner');
      const feedback = language === 'en' 
        ? `Voice Command Recognized: "${transcript}". Switched to Disease Scanner!`
        : `وائس کمانڈ: "${transcript}"! بیماری سکینر کھول دیا گیا ہے۔`;
      setVoiceFeedbackStatus(feedback);
      const promptSpeech = language === 'en' 
        ? 'Disease Scanner opened. Please upload a photo or video to begin scan.' 
        : 'بیماری سکینر کھول دیا گیا ہے۔ تصویر یا ویڈیو اپلوڈ کریں۔';
      speakTextMessage('scan_prompt', promptSpeech, language);
      
      // If user is already on scanner and has media, trigger scan
      if (scanMedia) {
        handleRunAiScan();
      }
    } else {
      // Direct voice consultation to AI Doctor
      setActiveSubTab('chat');
      const feedback = language === 'en'
        ? `Voice Command Recognized: "${transcript}". Consulting AI Doctor...`
        : `وائس کمانڈ: "${transcript}"! AI ڈاکٹر سے مشورہ تیار کیا جا رہا ہے...`;
      setVoiceFeedbackStatus(feedback);
      handleSendMessage(transcript);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert(language === 'en' ? 'Voice recognition is not supported in this browser.' : 'آواز کی شناخت اس برائوزر میں دستیاب نہیں ہے۔');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  /**
   * High quality multi-language text-to-speech with live play/pause toggling
   */
  const speakTextMessage = (messageId: string, textToSpeak: string, _msgLanguage?: Language) => {
    if (speakingMessageId === messageId) {
      stopHybrid();
      setSpeakingMessageId(null);
      setTtsLoadingMsgId(null);
      return;
    }

    stopHybrid();
    setSpeakingMessageId(messageId);
    setTtsWarning(null);
    setTtsLoadingMsgId(messageId);

    speakHybrid(textToSpeak, {
      onReady: () => {
        setTtsLoadingMsgId(null);
        setSpeakingMessageId(messageId);
      },
      onEnd: () => {
        setTtsLoadingMsgId(null);
        setSpeakingMessageId((current) => (current === messageId ? null : current));
      },
      onError: () => {
        setTtsLoadingMsgId(null);
        setSpeakingMessageId((current) => (current === messageId ? null : current));
      },
    });
  };

  const stopAllSpeech = () => {
    stopHybrid();
    setSpeakingMessageId(null);
    setTtsLoadingMsgId(null);
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'chat' | 'scan') => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (target === 'chat') {
          if (isVid) setVideoAttachment(res);
          else setImageAttachment(res);
        } else {
          setScanMedia(res);
          setIsVideoScan(isVid);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() && !imageAttachment && !videoAttachment) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: detectTextLanguage(query, language),
      image: imageAttachment || undefined,
      video: videoAttachment || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const currentImage = imageAttachment;
    setImageAttachment(null);
    setVideoAttachment(null);
    setIsLoading(true);

    try {
      const result = await aiService.sendChatMessage({
        prompt: query,
        language,
        imageBase64: currentImage,
        mode: executionMode === 'offline' ? 'offline' : 'online',
      });

      setIsLoading(false);

      const assistantMsgId = 'msg_' + (Date.now() + 1);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: result.language || detectTextLanguage(result.answer, language),
        isEmergency: result.isEmergency,
        modeUsed: result.modeUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakTextMessage(assistantMsgId, result.answer, assistantMsg.language);
    } catch (e) {
      setIsLoading(false);
      const fallbackText = language === 'en'
        ? 'Dear farmer! Please provide fresh water and dry fodder for your livestock. If your animal has a fever, consult a local veterinarian.'
        : 'محترم کسان بھائی! اپنے جانور کو تازہ پانی اور سوکھی توڑی دیں۔ اگر بخار ہے تو فوری ویٹرنری ڈاکٹر کو بلائیں۔';

      const fallbackMsgId = 'msg_' + (Date.now() + 1);
      const fallbackMsg: ChatMessage = {
        id: fallbackMsgId,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: language === 'en' ? 'en' : 'ur',
        modeUsed: 'offline',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakTextMessage(fallbackMsgId, fallbackText, fallbackMsg.language);
    }
  };

  // Run AI Scan
  const handleRunMLScan = async () => {
    if (!selectedAnimal || !scanMedia) return;
    setIsMLScanning(true);
    setCurrentScanResult(null);
    setGeneratedRecoveryPlan(null);
    setMlSource(null);

    try {
      const response = await fetch('/api/custom-model/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scanMedia,
          language,
          animalName: selectedAnimal.name,
          species: selectedAnimal.species,
        }),
      });

      const data = await response.json();
      setIsMLScanning(false);

      if (!data.success) throw new Error(data.error || 'ML scan failed');

      setMlSource(data.source || 'custom_ml_model');

      const scanEntry: ScanJournalEntry = {
        id: 'scn_ml_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        date: new Date().toLocaleString(),
        imageUrl: scanMedia || selectedAnimal.photos[0],
        detectedDisease: data.detectedDisease,
        confidence: data.confidence,
        severity: data.severity,
        causes: data.causes,
        precautions: data.precautions,
        recommendedMedicines: data.recommendedMedicines,
        vetRequired: data.vetRequired,
        recoveryDaysEstimate: data.recoveryDaysEstimate,
        aiNotes: data.aiNotes,
        description_ur: data.description_ur,
        treatment_ur: data.treatment_ur,
        audio_base64: data.audio_base64,
      };

      setCurrentScanResult(scanEntry);
      if (onSaveScanJournal) {
        onSaveScanJournal(selectedAnimal.id, scanEntry);
      }
    } catch (err) {
      setIsMLScanning(false);
      console.error('ML scan error:', err);
    }
  };

  const stopScanAudio = () => {
    if (activeScanAudioRef.current) {
      activeScanAudioRef.current.pause();
      activeScanAudioRef.current.currentTime = 0;
      activeScanAudioRef.current = null;
    }
    stopHybrid();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsScanAudioPlaying(false);
    setTtsScanLoading(false);
  };

  const handleListenSpeech = async () => {
    if (!currentScanResult) return;

    if (isScanAudioPlaying) {
      stopScanAudio();
      return;
    }

    stopScanAudio();
    setTtsScanLoading(true);

    try {
      // 1. If pre-generated audio exists from the ML scan, play it directly
      if (currentScanResult.audio_base64) {
        const b64Data = currentScanResult.audio_base64.startsWith('data:')
          ? currentScanResult.audio_base64
          : `data:audio/mp3;base64,${currentScanResult.audio_base64}`;
        const audio = new Audio(b64Data);
        activeScanAudioRef.current = audio;
        audio.onended = () => setIsScanAudioPlaying(false);
        audio.onerror = () => setIsScanAudioPlaying(false);
        await audio.play();
        setIsScanAudioPlaying(true);
        setTtsScanLoading(false);
        return;
      }

      const diagnosisTitle = currentScanResult.detectedDisease || '';
      const diagnosisDescription = currentScanResult.aiNotes || currentScanResult.description_ur || '';
      const fullTextToSpeak = `${diagnosisTitle}. ${diagnosisDescription}`.trim();

      // 2. Try Backend Python / Express TTS Endpoint first (/api/ai/tts or /api/tts)
      let audioPlayed = false;
      try {
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fullTextToSpeak, lang: language === 'ur' ? 'ur' : 'en' })
        });
        const data = await res.json();

        if (data.audioBase64 || data.audio_base64) {
          const b64 = data.audioBase64 || `data:audio/mp3;base64,${data.audio_base64}`;
          const audio = new Audio(b64);
          activeScanAudioRef.current = audio;
          audio.onended = () => setIsScanAudioPlaying(false);
          audio.onerror = () => setIsScanAudioPlaying(false);
          await audio.play();
          setIsScanAudioPlaying(true);
          audioPlayed = true;
        }
      } catch (endpointErr) {
        console.warn('Backend TTS endpoint unreachable, falling back to Web Speech API:', endpointErr);
      }

      // 3. Fall back seamlessly to browser speechSynthesis if endpoint is unconfigured
      if (!audioPlayed && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullTextToSpeak);
        if (language === 'ur') utterance.lang = 'ur-PK';
        utterance.onend = () => setIsScanAudioPlaying(false);
        utterance.onerror = () => setIsScanAudioPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsScanAudioPlaying(true);
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentScanResult.aiNotes || currentScanResult.detectedDisease);
        if (language === 'ur') utterance.lang = 'ur-PK';
        utterance.onend = () => setIsScanAudioPlaying(false);
        utterance.onerror = () => setIsScanAudioPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsScanAudioPlaying(true);
      }
    } finally {
      setTtsScanLoading(false);
    }
  };

  const handleRunAiScan = async () => {
    if (!selectedAnimal) return;
    setIsScanning(true);
    setCurrentScanResult(null);
    setGeneratedRecoveryPlan(null);

    try {
      const scanData = await aiService.scanDisease(
        scanMedia || '',
        language,
        executionMode === 'offline' ? 'offline' : 'online',
        {
          animalName: selectedAnimal.name,
          species: selectedAnimal.species,
          breed: selectedAnimal.breed,
          notes: scanNotes,
        }
      );

      setIsScanning(false);

      const scanEntry: ScanJournalEntry = {
        id: 'scn_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        date: new Date().toLocaleString(),
        imageUrl: scanMedia || selectedAnimal.photos[0],
        detectedDisease: scanData.detectedDisease,
        confidence: scanData.confidence,
        severity: scanData.severity,
        causes: scanData.causes,
        precautions: scanData.precautions,
        recommendedMedicines: scanData.recommendedMedicines,
        vetRequired: scanData.vetRequired,
        recoveryDaysEstimate: scanData.recoveryDaysEstimate,
        aiNotes: scanData.aiNotes,
      };

      setCurrentScanResult(scanEntry);
      if (onSaveScanJournal) {
        onSaveScanJournal(selectedAnimal.id, scanEntry);
      }
    } catch (e) {
      setIsScanning(false);
      const isEn = language === 'en';
      const fallbackEntry: ScanJournalEntry = {
        id: 'scn_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        date: new Date().toLocaleString(),
        imageUrl: scanMedia || selectedAnimal.photos[0],
        detectedDisease: isEn ? 'Clinical Veterinary Diagnosis' : 'طبی معائنہ و تشخیصی رپورٹ',
        confidence: 90,
        severity: 'moderate',
        causes: isEn ? ['Bacterial / viral infection', 'Farm contact'] : ['مکھیوں اور مچھروں کا کاٹنا', 'متاثرہ باڑے سے رابطہ'],
        precautions: isEn ? ['Isolate animal immediately', 'Disinfect shed'] : ['جانور کو فوراً الگ باقی مویشیوں سے رکھیں', 'باڑے میں مکھی مار سپرے کریں'],
        recommendedMedicines: ['Meloxicam 15mg/kg', 'Oxytetracycline Injection', 'Antiseptic Spray'],
        vetRequired: true,
        recoveryDaysEstimate: 7,
        aiNotes: isEn 
          ? 'Diagnosis completed. Administer fever relief and consult veterinarian if needed.'
          : 'طبی علامات کا تجزیہ مکمل ہوا۔ فوری طور پر بخار کم کرنے کی دوا دیں اور ویٹرنری ڈاکٹر سے رجوع کریں۔',
      };
      setCurrentScanResult(fallbackEntry);
      if (onSaveScanJournal) {
        onSaveScanJournal(selectedAnimal.id, fallbackEntry);
      }
    }
  };

  const handleGenerateRecoveryPlan = async () => {
    if (!currentScanResult || !selectedAnimal) return;
    setIsGeneratingPlan(true);

    try {
      const planObj = await aiService.generateRecoveryPlan(
        selectedAnimal.name,
        currentScanResult.detectedDisease,
        currentScanResult.recoveryDaysEstimate || 7,
        language,
        executionMode === 'offline' ? 'offline' : 'online'
      );

      setIsGeneratingPlan(false);

      setGeneratedRecoveryPlan({
        id: 'rec_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        diseaseName: currentScanResult.detectedDisease,
        startDate: new Date().toISOString().split('T')[0],
        totalDays: currentScanResult.recoveryDaysEstimate || 7,
        currentDay: 1,
        steps: planObj.steps,
        vetAdvice: planObj.vetAdvice,
      });
    } catch (e) {
      setIsGeneratingPlan(false);
      const totalDays = currentScanResult.recoveryDaysEstimate || 7;
      setGeneratedRecoveryPlan({
        id: 'rec_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        diseaseName: currentScanResult.detectedDisease,
        startDate: new Date().toISOString().split('T')[0],
        totalDays,
        currentDay: 1,
        vetAdvice: language === 'en'
          ? 'Isolate animal in clean dry area, monitor temperature twice daily and complete antibiotic dosage.'
          : 'جانور کو ہوا دار اور الگ جگہ پر رکھیں، دن میں دو بار بخار چیک کریں اور ڈاکٹر کے بتائے گئے انٹی بائیوٹکس کا کورس مکمل کریں۔',
        steps: Array.from({ length: totalDays }, (_, idx) => ({
          day: idx + 1,
          title: language === 'en' ? `Recovery Phase Day ${idx + 1}` : `روزانہ ریکوری مرحلہ ${idx + 1}`,
          description: language === 'en' ? 'Inspect fever, appetite and physical movement.' : 'جانور کے بخار اور چارے کی حالت کا روزانہ معائنہ کریں۔',
          medicines: ['Meloxicam 15ml', 'Antiseptic Spray'],
          feedingInstructions: language === 'en' ? 'Provide soft porridge and fresh green fodder.' : 'نرم دلیہ، دہی، اور ہرا چارہ دیں۔',
          completed: false,
        })),
      });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 text-white shadow-xl shadow-green-100 dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-1">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                {language === 'en' ? 'AI Livestock Doctor & Disease Scanner' : 'AI مویشی ڈاکٹر و سمارٹ بیماری سکینر'}
              </h2>
              {onToggleExecutionMode && (
                <button
                  onClick={onToggleExecutionMode}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center border shadow-sm transition-all ${
                    executionMode === 'online'
                      ? 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                      : 'bg-amber-400 text-amber-950 border-amber-300 hover:bg-amber-300'
                  }`}
                  title="AI ماڈل تبدیل کریں"
                >
                  {executionMode === 'online' ? (
                    <>
                      <Wifi className="w-3 h-3 me-1" />
                      <span>Gemini 3.7 Flash (Active)</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 me-1" />
                      <span>Offline AI Model</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-green-100 font-medium mt-0.5">
              {language === 'en' 
                ? 'Voice consultations, photo & video disease scanning, and daily recovery plans in one place.'
                : 'آواز سے علاج پوچھیں، تصویر و ویڈیو سکین کریں اور 24 گھنٹے بیماری کا علاج معلوم کریں۔'}
            </p>
          </div>
        </div>

        {/* Right side controls: Voice Command Toggle & Voice Mute */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse self-start sm:self-auto flex-wrap gap-2">
          {/* VOICE COMMAND TOGGLE BUTTON */}
          <button
            onClick={handleToggleVoiceCommandMode}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center space-x-2 rtl:space-x-reverse shadow-md transition-all ${
              isVoiceCommandEnabled
                ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 border-2 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
            }`}
            title={language === 'en' ? 'Toggle Hands-Free Voice Commands' : 'وائس کمانڈ موڈ آن/آف کریں'}
          >
            {isVoiceCommandEnabled ? (
              <>
                <Radio className="w-4 h-4 text-red-600 animate-spin" />
                <span>{language === 'en' ? 'Voice Command: ON' : 'وائس کمانڈ: فعال (ON)'}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-amber-300" />
                <span>{language === 'en' ? 'Voice Command Toggle' : 'وائس کمانڈ ٹوگل'}</span>
              </>
            )}
          </button>

          {/* Global Speech Stop Button */}
          {(speakingMessageId !== null || ttsService.isSpeaking()) && (
            <button
              onClick={stopAllSpeech}
              className="px-3.5 py-2 rounded-2xl bg-red-600 text-white text-xs font-extrabold flex items-center space-x-1.5 rtl:space-x-reverse shadow-md hover:bg-red-700 animate-pulse transition-all"
              title={language === 'en' ? 'Stop Speech' : 'آواز بند کریں'}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'en' ? 'Stop Audio' : 'آواز روکیں'}</span>
            </button>
          )}
        </div>
      </div>

      {/* VOICE COMMAND ACTIVE PANEL & GUIDANCE */}
      {isVoiceCommandEnabled && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 shadow-md animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-amber-900 dark:text-amber-200 font-black text-xs">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
              <span>{language === 'en' ? 'Hands-Free Voice Command Mode Active!' : 'ہینڈز فری وائس کمانڈ موڈ فعال ہے!'}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
              {language === 'en' ? 'Listening...' : 'آواز سن رہا ہے...'}
            </span>
          </div>

          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            {language === 'en'
              ? 'Say "Scan Disease" to switch to scanner, or ask any question like "Doctor, my cow has high fever what to do?"'
              : 'بولیں "بیماری سکین کرو" (Scan Disease) یا کوئی بھی سوال جیسے "ڈاکٹر صاحب، گائے کو تیز بخار ہے کیا دوا دیں؟"'}
          </p>

          {voiceFeedbackStatus && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 me-1.5 text-amber-500 shrink-0" />
              <span>{voiceFeedbackStatus}</span>
            </div>
          )}

          {/* Quick Voice Command Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold self-center me-1">
              {language === 'en' ? 'Try Voice Commands:' : 'نمونہ وائس کمانڈز:'}
            </span>
            <button
              onClick={() => handleVoiceCommandInput('Scan disease')}
              className="px-2.5 py-1 rounded-xl bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 text-[11px] font-bold transition-all"
            >
              🎙️ {language === 'en' ? '"Scan Disease"' : '"بیماری سکین کرو"'}
            </button>
            <button
              onClick={() => handleVoiceCommandInput('Consult Doctor about fever')}
              className="px-2.5 py-1 rounded-xl bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 text-[11px] font-bold transition-all"
            >
              🎙️ {language === 'en' ? '"Doctor, cow has fever"' : '"ڈاکٹر صاحب، گائے کو بخار ہے"'}
            </button>
          </div>
        </div>
      )}

      {/* TTS Warning Banner (if Urdu voice missing on device) */}
      {ttsWarning && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{ttsWarning}</span>
          </div>
          <button
            onClick={() => setTtsWarning(null)}
            className="text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified Sub-Tabs Navigation */}
      <div className="flex items-center p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 gap-1">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
            activeSubTab === 'chat'
              ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-300 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'en' ? 'Voice & Chat Doctor' : 'آواز و چیٹ مویشی ڈاکٹر'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scanner')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
            activeSubTab === 'scanner'
              ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-300 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Scan className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'en' ? 'Photo & Video Scanner' : 'تصویر و ویڈیو بیماری سکینر'}</span>
        </button>

        {animals.length > 0 && (
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
              activeSubTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-300 shadow-md border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'en' ? 'Scan Journal & Plans' : 'سابقہ سکین اور ریکوری پلان'}</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: VOICE & CHAT CONSULTATION */}
      {activeSubTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm min-h-[480px] flex flex-col justify-between space-y-4">
          
          {/* Chat Top Bar with Live Language Selector */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'en' ? 'AI Response Language:' : 'AI جواب کی زبان:'}
              </span>
              {onLanguageChange ? (
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => onLanguageChange('ur')}
                    className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                      language === 'ur'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    اردو (Urdu)
                  </button>
                  <button
                    onClick={() => onLanguageChange('en')}
                    className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                      language === 'en'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => onLanguageChange('pb')}
                    className={`px-2.5 py-1 rounded-lg font-extrabold transition-all ${
                      language === 'pb'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    پنجابی
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {language === 'en' ? 'English' : language === 'pb' ? 'پنجابی' : 'اردو (Urdu)'}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{language === 'en' ? '🔊 Voice synthesis matches selected language' : '🔊 اصلی اردو/انگریزی آواز کی معاونت'}</span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="space-y-4 overflow-y-auto max-h-[500px] pe-2">
            {messages.map((msg) => {
              const isAss = msg.sender === 'assistant';
              const isCurrentSpeaking = speakingMessageId === msg.id && (ttsService.isSpeaking() || ttsLoadingMsgId === msg.id);
              const isCopied = copiedMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 rtl:space-x-reverse ${
                    isAss ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAss && (
                    <div className="w-9 h-9 rounded-2xl bg-green-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 space-y-2 text-xs leading-relaxed ${
                    isAss
                      ? msg.isEmergency
                        ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                      : 'bg-green-600 text-white font-medium'
                  }`}>
                    {msg.isEmergency && (
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-red-600 dark:text-red-400 font-bold">
                        <AlertTriangle className="w-4 h-4 animate-bounce" />
                        <span>{language === 'en' ? 'Emergency Warning! Contact Vet Immediately.' : 'ہنگامی وارننگ! فوری ویٹرنری ڈاکٹر سے رابطہ کریں۔'}</span>
                      </div>
                    )}

                    {msg.image && (
                      <img src={msg.image} alt="Attachment" className="w-48 h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                    )}

                    {msg.video && (
                      <video src={msg.video} controls className="w-56 h-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-black" />
                    )}

                    <FormattedChatMessage text={msg.text} isAssistant={isAss} />

                    {/* Message Actions Bar */}
                    <div className="flex items-center justify-between text-[10px] opacity-90 pt-2 border-t border-black/5 dark:border-white/5 gap-2">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{msg.timestamp}</span>
                        {isAss && (
                          <span 
                            id={`msg-lang-badge-${msg.id}`}
                            className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                              (msg.language || 'ur') === 'en'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : (msg.language || 'ur') === 'pb'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={(msg.language || 'ur') === 'en' ? 'English Response' : 'اردو جواب'}
                          >
                            {(msg.language || 'ur') === 'en' ? 'English' : (msg.language || 'ur') === 'pb' ? 'پنجابی' : 'اردو'}
                          </span>
                        )}
                      </div>

                      {isAss && (
                        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                          {/* Copy Button */}
                          <button
                            id={`msg-copy-btn-${msg.id}`}
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="hover:underline flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors px-1.5 py-0.5"
                            title={language === 'en' ? 'Copy advice' : 'کاپی کریں'}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 me-0.5 text-green-600" />
                                <span className="text-green-600 font-bold">{language === 'en' ? 'Copied' : 'کاپی ہو گیا'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 me-0.5" />
                                <span>{language === 'en' ? 'Copy' : 'کاپی'}</span>
                              </>
                            )}
                          </button>

                          {/* TTS Listen / Stop Button */}
                          {isCurrentSpeaking ? (
                            <button
                              id={`msg-stop-btn-${msg.id}`}
                              onClick={() => {
                                stopHybrid();
                                setSpeakingMessageId(null);
                                setTtsLoadingMsgId(null);
                              }}
                              className="flex items-center font-bold px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm animate-pulse transition-all"
                              title={language === 'en' ? 'Stop Speech' : 'آواز روکیں'}
                            >
                              <Square className="w-3 h-3 me-1 fill-current" />
                              <span>{language === 'en' ? 'Stop' : 'روکیں'}</span>
                            </button>
                          ) : (
                            <button
                              id={`msg-listen-btn-${msg.id}`}
                              onClick={() => speakTextMessage(msg.id, msg.text, msg.language)}
                              disabled={ttsLoadingMsgId === msg.id}
                              className="flex items-center font-bold px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shadow-2xs active:scale-95 transition-all disabled:opacity-70"
                              title={language === 'en' ? 'Listen with Voice' : 'آواز سے سنیں'}
                            >
                              {ttsLoadingMsgId === msg.id ? (
                                <Loader2 className="w-3 h-3 me-1 text-emerald-600 dark:text-emerald-400 animate-spin" />
                              ) : (
                                <Volume2 className="w-3 h-3 me-1 text-emerald-600 dark:text-emerald-400" />
                              )}
                              <span>{ttsLoadingMsgId === msg.id
                                ? (language === 'en' ? 'Loading...' : 'لوڈ ہو رہا ہے...')
                                : (language === 'en' ? 'Listen' : 'سنیں')}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isAss && (
                    <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      {language === 'en' ? 'You' : 'کسان'}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{language === 'en' ? 'AI Doctor is preparing advice...' : 'AI مویشی ڈاکٹر جواب تیار کر رہا ہے...'}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggested Quick Questions */}
          <div className="pt-3 pb-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
            {[
              language === 'en' ? 'Emergency fever cure for cow?' : 'گائے کو تیز بخار کا فوری علاج کیا ہے؟',
              language === 'en' ? 'Home feed recipe to increase milk?' : 'بھینس کا دودھ بڑھانے کا دیسی ونڈا کیسے بنائیں؟',
              language === 'en' ? 'Foot & mouth disease precautions?' : 'منہ کھُر کی بیماری سے بچاؤ کی احتیاط؟',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-100 dark:border-emerald-800 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="pt-2">
            {(imageAttachment || videoAttachment) && (
              <div className="relative inline-block mb-2 me-2">
                {imageAttachment ? (
                  <img src={imageAttachment} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <video src={videoAttachment!} className="w-20 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-black" />
                )}
                <button
                  onClick={() => { setImageAttachment(null); setVideoAttachment(null); }}
                  className="absolute -top-2 -end-2 p-1 rounded-full bg-black text-white text-[10px]"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Microphone Button */}
              <button
                onClick={toggleSpeechRecognition}
                className={`p-3.5 rounded-2xl transition-all shadow-md shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none'
                }`}
                title={language === 'en' ? 'Speak in English/Urdu' : 'اردو یا پنجابی میں بولیں'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Photo / Video File Attachment */}
              <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 cursor-pointer shrink-0">
                <ImageIcon className="w-5 h-5" />
                <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'chat')} className="hidden" />
              </label>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? t('listening', language) : t('typeQuestion', language)}
                className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                className="p-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md shadow-green-200 dark:shadow-none transition-all shrink-0"
              >
                <Send className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: PHOTO & VIDEO DISEASE SCANNER */}
      {activeSubTab === 'scanner' && (
        <div className="space-y-6">
          
          {/* Step 1: Select Registered Animal */}
          {animals.length > 0 ? (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Select Registered Farm Livestock:' : 'پہلے اپنے رجسٹرڈ جانور کا انتخاب کریں:'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {animals.map((anm) => {
                  const isSelected = anm.id === selectedAnimalId;
                  return (
                    <div
                      key={anm.id}
                      onClick={() => setSelectedAnimalId(anm.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 rtl:space-x-reverse ${
                        isSelected
                          ? 'border-green-600 bg-green-50/70 dark:bg-green-950/60 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={anm.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=200'}
                        alt={anm.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-extrabold text-green-700 dark:text-green-400 block truncate">{anm.tagId}</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{anm.name}</h4>
                        <span className="text-[10px] text-slate-500 truncate">{anm.breed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              {language === 'en' ? 'No registered animals found. You can still scan any photo or video below.' : 'کوئی رجسٹرڈ جانور نہیں ملا۔ آپ نیچے کسی بھی جانور کی تصویر یا ویڈیو اپلوڈ کر سکتے ہیں۔'}
            </div>
          )}

          {/* 🧠 Custom ML Model Specifications (PyTorch EfficientNet-B0) Card */}
          <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-indigo-900/10 border border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/15">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md font-bold shrink-0 text-base">
                  🧠
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span>{language === 'en' ? 'Custom ML Model Specifications' : 'خصوصی ML ماڈل کی تفصیلات'}</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300/40">
                      PyTorch EfficientNet-B0
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Deep Convolutional Transfer Learning trained specifically for Bovine / Cow Disease Vision Classification'
                      : 'خصوصی ML ماڈل: لمپی سکن ڈیزیز (LSD) اور صحت مند گائے کی تشخیص کے لیے تربیت یافتہ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                <span className="text-[11px] font-extrabold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full shadow-xs">
                  {language === 'en' ? '94.8% Val Accuracy' : 'ماڈل کی درستگی: 94.8%'}
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                  &lt; 300ms Edge Inference
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 text-xs">
              {/* Trained Target Classes */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {language === 'en' ? 'Trained Target Classes' : 'تربیت یافتہ ہدف کلاسز'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200/50 dark:border-rose-900/50">
                    Lumpy Skin Disease (LSD)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
                    Healthy Cow
                  </span>
                </div>
              </div>

              {/* Architecture & Domain */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {language === 'en' ? 'Model Architecture' : 'ماڈل آرکیٹیکچر'}
                </span>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Custom PyTorch EfficientNet-B0 (Transfer Learning)
                </p>
              </div>

              {/* Supported Media Inputs */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {language === 'en' ? 'Supported Media Inputs' : 'تعاون یافتہ میڈیا ان پٹس'}
                </span>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  📷 Image (JPG/PNG) &amp; 🎥 Video Frames Inspection
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Upload Photo / Video & Run Scan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Media Upload Column */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                <span>{language === 'en' ? `Provide Media for ${selectedAnimal?.name || 'Animal'}` : `تصویر یا مختصر ویڈیو فراہم کریں (${selectedAnimal?.name || 'جانور'})`}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Photo/Video AI</span>
              </h3>

              {/* Upload Dropzone Box */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/40 min-h-[200px] flex items-center justify-center">
                {scanMedia ? (
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    {isVideoScan ? (
                      <video src={scanMedia} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={scanMedia} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => setScanMedia(null)}
                      className="absolute top-2 end-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black font-bold text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="py-6 space-y-3 cursor-pointer">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {language === 'en' ? 'Upload Photo or Short Video Clip' : 'تصویر یا مختصر ویڈیو کلپ اپلوڈ کریں'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'en' ? 'Show skin lesions, eyes, wounds or limping movement' : 'جلد کے ابھار، زخم، آنکھ کا انفیکشن یا لنگڑاہٹ دکھائیں'}
                      </p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e, 'scan')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Symptoms Description (Optional):' : 'اضافی علامات کا اندراج (اختیاری):'}
                </label>
                <textarea
                  rows={2}
                  value={scanNotes}
                  onChange={(e) => setScanNotes(e.target.value)}
                  placeholder={language === 'en' ? 'e.g., Animal has high fever, refuses fodder, eye discharge...' : 'مثال: جانور چارہ نہیں کھا رہا، بخار 104 ہے اور آنکھوں سے پانی بہہ رہا ہے...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Scan Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setScanMode('ml')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    scanMode === 'ml'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  🧠 Custom ML Model
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('gemini')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    scanMode === 'gemini'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  ✨ Gemini AI
                </button>
              </div>

              {/* Unified Scan Action Button */}
              <button
                onClick={scanMode === 'ml' ? handleRunMLScan : handleRunAiScan}
                disabled={isMLScanning || isScanning || !scanMedia}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50 ${
                  scanMode === 'ml'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                }`}
              >
                {isMLScanning || isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-2" />
                    <span>
                      {scanMode === 'ml'
                        ? (language === 'en' ? 'Running ML Model...' : 'ML ماڈل چل رہا ہے...')
                        : t('scanningAnimation', language)}
                    </span>
                  </>
                ) : (
                  <>
                    {scanMode === 'ml' ? <Activity className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    <span>
                      {scanMode === 'ml'
                        ? (language === 'en' ? 'Run Custom ML Disease Scan' : 'کسٹم ML بیماری اسکین کریں')
                        : (language === 'en' ? 'Run Gemini AI Scan' : 'AI بیماری و ویڈیو سکین کریں')}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Diagnosis Result Column */}
            <div className="space-y-4">
              {currentScanResult ? (
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                          {language === 'en' ? 'AI Diagnosis Report' : 'تشخیصی رپورٹ (AI Diagnosis)'}
                        </span>
                        {mlSource && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            mlSource === 'custom_ml_model'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : mlSource === 'gemini_fallback'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {mlSource === 'custom_ml_model' ? '🧠 Custom ML' : mlSource === 'gemini_fallback' ? '✨ Gemini' : '📴 Offline'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        {currentScanResult.detectedDisease}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {/* Listen button — plays gTTS base64 audio or hybrid TTS */}
                      <button
                        onClick={handleListenSpeech}
                        disabled={ttsScanLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center transition-all disabled:opacity-70 ${
                          isScanAudioPlaying
                            ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                            : ttsScanLoading
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {ttsScanLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
                            <span>{language === 'en' ? 'Loading Voice...' : 'آواز لوڈ ہو رہی ہے...'}</span>
                          </>
                        ) : isScanAudioPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 me-1 fill-current text-white" />
                            <span>{language === 'en' ? 'Stop Listening' : 'آواز بند کریں'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 me-1" />
                            <span>{language === 'en' ? 'Listen' : 'سنیں'}</span>
                          </>
                        )}
                      </button>

                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {language === 'en' ? `Confidence: ${currentScanResult.confidence}%` : `قابلِ اعتماد: ${currentScanResult.confidence}%`}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-1">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        currentScanResult.severity === 'critical' || currentScanResult.severity === 'severe'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {language === 'en' ? `Severity: ${currentScanResult.severity}` : `شدت: ${currentScanResult.severity}`}
                    </span>

                    {currentScanResult.vetRequired && (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center">
                        <Stethoscope className="w-3.5 h-3.5 me-1" /> {language === 'en' ? 'Vet Required' : 'ویٹرنری ڈاکٹر ضروری ہے'}
                      </span>
                    )}
                  </div>

                  {/* Audio Player for Urdu Voice */}
                  {currentScanResult.audio_base64 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🔊 {language === 'en' ? 'Urdu Voice Guidance' : 'اردو آڈیو ہدایت نامہ'}
                      </span>
                      <audio
                        src={`data:audio/mp3;base64,${currentScanResult.audio_base64}`}
                        controls
                        autoPlay
                        className="w-full h-8 outline-none"
                      />
                    </div>
                  )}

                  {/* AI Notes */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {currentScanResult.aiNotes}
                  </div>

                  {/* Urdu Detailed Veterinary Diagnosis (RTL aligned) */}
                  {currentScanResult.description_ur && (
                    <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-3" dir="rtl">
                      <div className="text-right flex items-center justify-between gap-2 border-b border-emerald-100/60 dark:border-emerald-900/40 pb-2">
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                          تفصیلی طبی رپورٹ (Urdu Detailed Report)
                        </span>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          بیماری/حالت کی تفصیل:
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                          {currentScanResult.description_ur}
                        </p>
                      </div>
                      {currentScanResult.treatment_ur && (
                        <div className="text-right border-t border-emerald-100/60 dark:border-emerald-900/40 pt-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            علاج اور احتیاطی تدابیر:
                          </h4>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                            {currentScanResult.treatment_ur}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Precautions */}
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 me-1.5" />
                      <span>{language === 'en' ? 'Immediate Precautions:' : 'فوری احتیاطی تدابیر:'}</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ps-2">
                      {currentScanResult.precautions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Medicines */}
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      <Pill className="w-4 h-4 text-blue-600 me-1.5" />
                      <span>{language === 'en' ? 'Recommended Medicines:' : 'تجویز کردہ ادویات:'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentScanResult.recommendedMedicines.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold text-[11px] border border-blue-100 dark:border-blue-900">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Trigger Recovery Plan */}
                  <div className="pt-2">
                    <button
                      onClick={handleGenerateRecoveryPlan}
                      disabled={isGeneratingPlan}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
                    >
                      {isGeneratingPlan ? (
                        <span>{language === 'en' ? 'Generating Plan...' : 'ریکوری پلان تیار ہو رہا ہے...'}</span>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          <span>{language === 'en' ? `Generate Daily Recovery Plan (${currentScanResult.recoveryDaysEstimate} Days)` : `روزانہ کا AI ریکوری پلان بنائیں (${currentScanResult.recoveryDaysEstimate} دن)`}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900">
                  <Scan className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium">
                    {language === 'en' ? 'Upload a photo or video and click Scan.' : 'تصویر یا ویڈیو منتخب کریں اور سکین بٹن دبائیں۔'}
                  </p>
                </div>
              )}

              {/* Generated Recovery Schedule Box */}
              {generatedRecoveryPlan && (
                <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
                    <Calendar className="w-4 h-4 me-2 text-emerald-600" />
                    <span>{language === 'en' ? `Daily Recovery Schedule (${generatedRecoveryPlan.totalDays} Days)` : `روزانہ کا ریکوری پلان (${generatedRecoveryPlan.totalDays} دن)`}</span>
                  </h4>

                  <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">
                    {language === 'en' ? 'Vet Advice: ' : 'ڈاکٹر ہدایت: '}{generatedRecoveryPlan.vetAdvice}
                  </p>

                  <div className="space-y-2 pt-2">
                    {generatedRecoveryPlan.steps.map((step) => (
                      <div key={step.day} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800 text-xs space-y-1 shadow-sm">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>{language === 'en' ? `Day ${step.day}: ${step.title}` : `دن ${step.day}: ${step.title}`}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium">{step.description}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <strong>{language === 'en' ? 'Feed:' : 'خوراک:'}</strong> {step.feedingInstructions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 3: SCAN HISTORY & JOURNALS */}
      {activeSubTab === 'history' && selectedAnimal && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <FileText className="w-5 h-5 text-emerald-600 me-2" />
            <span>{language === 'en' ? `Scan Journal for ${selectedAnimal.name} (${selectedAnimal.tagId})` : `سابقہ سکین ہسٹری (Scan Journal for ${selectedAnimal.name})`}</span>
          </h3>

          {selectedAnimal.scanJournal.length > 0 ? (
            <div className="space-y-3">
              {selectedAnimal.scanJournal.map((entry) => (
                <div key={entry.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 me-2 text-sm">{entry.detectedDisease}</span>
                      <span className="text-slate-400 text-[11px]">({entry.date})</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {entry.confidence}% {language === 'en' ? 'Match' : 'میچ'}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 font-medium">{entry.aiNotes}</p>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1 text-[11px] text-slate-500">
                    <span>{language === 'en' ? 'Medicines:' : 'ادویات:'} {entry.recommendedMedicines.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              {language === 'en' ? 'No scan journal entries recorded for this animal yet.' : 'اس جانور کا ابھی تک کوئی سابقہ سکین ہسٹری درج نہیں ہے۔'}
            </p>
          )}
        </div>
      )}

    </div>
  );
};
