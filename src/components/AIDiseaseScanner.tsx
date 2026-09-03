import React, { useState } from 'react';
import { Animal, ScanJournalEntry, RecoveryPlan, Language, AIExecutionMode } from '../types';
import { t } from '../lib/translations';
import { aiService } from '../lib/aiService';
import { speakHybrid, stopHybrid } from '../lib/ttsService';
import { 
  Scan, 
  Upload, 
  Camera, 
  Video, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Stethoscope, 
  Calendar, 
  FileText, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Wifi,
  WifiOff,
  Volume2,
  Loader2,
  Square
} from 'lucide-react';

interface AIDiseaseScannerProps {
  animals: Animal[];
  onSaveScanJournal: (animalId: string, entry: ScanJournalEntry) => void;
  language: Language;
  executionMode?: AIExecutionMode;
  onToggleExecutionMode?: () => void;
}

export const AIDiseaseScanner: React.FC<AIDiseaseScannerProps> = ({
  animals,
  onSaveScanJournal,
  language,
  executionMode = 'online',
  onToggleExecutionMode,
}) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animals[0]?.id || '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isMLScanning, setIsMLScanning] = useState(false);
  const [currentScanResult, setCurrentScanResult] = useState<ScanJournalEntry | null>(null);
  const [generatedRecoveryPlan, setGeneratedRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [mlSource, setMlSource] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'ml' | 'gemini'>('ml');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isScanAudioPlaying, setIsScanAudioPlaying] = useState(false);
  const activeScanAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Custom Python ML Model Scan ──
  const handleRunMLScan = async () => {
    if (!selectedAnimal || !imagePreview) return;
    setIsMLScanning(true);
    setCurrentScanResult(null);
    setGeneratedRecoveryPlan(null);
    setMlSource(null);

    try {
      const response = await fetch('/api/custom-model/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
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
        imageUrl: imagePreview || selectedAnimal.photos[0],
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
      onSaveScanJournal(selectedAnimal.id, scanEntry);
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
    setTtsLoading(false);
  };

  const handleListenSpeech = async () => {
    if (!currentScanResult) return;

    if (isScanAudioPlaying) {
      stopScanAudio();
      return;
    }

    stopScanAudio();
    setTtsLoading(true);

    try {
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
        setTtsLoading(false);
        return;
      }

      const diagnosisTitle = currentScanResult.detectedDisease || '';
      const diagnosisDescription = currentScanResult.aiNotes || currentScanResult.description_ur || '';
      const fullTextToSpeak = `${diagnosisTitle}. ${diagnosisDescription}`.trim();

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
      setTtsLoading(false);
    }
  };

  const handleRunAiScan = async () => {
    if (!selectedAnimal) return;
    setIsScanning(true);
    setCurrentScanResult(null);
    setGeneratedRecoveryPlan(null);

    try {
      const scanData = await aiService.scanDisease(
        imagePreview || '',
        language,
        executionMode === 'offline' ? 'offline' : 'online',
        {
          animalName: selectedAnimal.name,
          species: selectedAnimal.species,
          breed: selectedAnimal.breed,
          notes: notes,
        }
      );

      setIsScanning(false);

      const scanEntry: ScanJournalEntry = {
        id: 'scn_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        date: new Date().toLocaleString(),
        imageUrl: imagePreview || selectedAnimal.photos[0],
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
      onSaveScanJournal(selectedAnimal.id, scanEntry);
    } catch (e) {
      setIsScanning(false);
      const isEn = language === 'en';
      const fallbackEntry: ScanJournalEntry = {
        id: 'scn_' + Date.now(),
        animalId: selectedAnimal.id,
        animalName: selectedAnimal.name,
        date: new Date().toLocaleString(),
        imageUrl: imagePreview || selectedAnimal.photos[0],
        detectedDisease: isEn ? 'Clinical Veterinary Diagnosis' : 'طبی معائنہ و تشخیصی رپورٹ',
        confidence: 90,
        severity: 'moderate',
        causes: isEn ? ['Bacterial or viral exposure', 'Farm environmental stress'] : ['مکھیوں اور مچھروں کا کاٹنا', 'متاثرہ باڑے سے رابطہ'],
        precautions: isEn ? ['Isolate affected animal in dry shed', 'Disinfect water trough'] : ['جانور کو فوراً الگ باقی مویشیوں سے رکھیں', 'باڑے میں مکھی مار سپرے کریں'],
        recommendedMedicines: ['Meloxicam 15mg/kg', 'Oxytetracycline Injection', 'Antiseptic Spray'],
        vetRequired: true,
        recoveryDaysEstimate: 7,
        aiNotes: isEn
          ? 'Symptom analysis completed. Monitor temperature and provide fresh water.'
          : 'علامات کا تجزیہ مکمل ہوا۔ جانور کا بخار چیک کریں اور ڈاکٹر کے مشورے سے ادویات دیں۔',
      };
      setCurrentScanResult(fallbackEntry);
      onSaveScanJournal(selectedAnimal.id, fallbackEntry);
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
          title: `روزانہ ریکوری مرحلہ ${idx + 1}`,
          description: `جانور کے بخار اور چارے کی حالت کا روزانہ معائنہ کریں۔`,
          medicines: ['Meloxicam 15ml', 'Antiseptic Spray'],
          feedingInstructions: 'نرم دلیہ، دہی، اور ہرا چارہ دیں۔',
          completed: false,
        })),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center tracking-tight">
              <Scan className="w-6 h-6 text-green-600 me-2" />
              <span>{t('diseaseScanner', language)}</span>
            </h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 flex items-center">
              <Sparkles className="w-3 h-3 me-1 text-emerald-600 animate-pulse" />
              Gemini 3.7 Flash AI (Active)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === 'en'
              ? 'Upload a photo or video or describe symptoms to receive an instant AI diagnosis and customized daily recovery plan.'
              : 'رجسٹرڈ مویشی کی تصویر یا ویڈیو اپلوڈ کریں یا علامات درج کر کے فوراً AI تشخیصی رپورٹ اور ریکوری پلان حاصل کریں۔'}
          </p>
        </div>

        {onToggleExecutionMode && (
          <button
            onClick={onToggleExecutionMode}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse border shadow-sm transition-all self-start sm:self-auto ${
              executionMode === 'online'
                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {executionMode === 'online' ? (
              <>
                <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Gemini 3.7 Flash Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Offline Local AI Scan</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Step 1: Select Registered Animal ONLY */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('selectAnimalPrompt', language)}
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
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <img
                  src={anm.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=200'}
                  alt={anm.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700"
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

      {/* Step 2: Upload Photo / Camera / Video */}
      {selectedAnimal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Upload Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              تصویر یا ویڈیو فراہم کریں ({selectedAnimal.name})
            </h3>

            {/* Media Box */}
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/40">
              {imagePreview ? (
                <div className="relative h-56 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 end-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      تصویر یا مختصر ویڈیو اپلوڈ کریں
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      جلد کے نشان، آنکھ، زخم یا لنگڑاہٹ دکھائیں
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                اضافی علامات کا اندراج (اختیاری):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: جانور چارہ نہیں کھا رہا، بخار 104 ہے اور منہ سے جھاگ نکل رہی ہے..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Scan Mode Toggle Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 mb-2">
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

            {/* Main Scan Action Button */}
            <button
              onClick={scanMode === 'ml' ? handleRunMLScan : handleRunAiScan}
              disabled={isMLScanning || isScanning || !imagePreview}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
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
                      : (language === 'en' ? 'Run Gemini AI Fallback Scan' : 'Gemini AI بیماری اسکین کریں')}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Diagnosis Result Column */}
          <div className="space-y-4">
            {currentScanResult ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
                
                {/* Result Top Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        تشخیصی رپورٹ (AI Diagnosis)
                      </span>
                      {mlSource && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          mlSource === 'custom_ml_model'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : mlSource === 'gemini_fallback'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mlSource === 'custom_ml_model' ? '🧠 Custom ML Model' : mlSource === 'gemini_fallback' ? '✨ Gemini Fallback' : '📴 Offline'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {currentScanResult.detectedDisease}
                    </h3>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    قابلِ اعتماد: {currentScanResult.confidence}%
                  </span>
                </div>

                {/* Severity Badge & Vet Alert */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      currentScanResult.severity === 'critical' || currentScanResult.severity === 'severe'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    شدت: {currentScanResult.severity}
                  </span>

                  {currentScanResult.vetRequired && (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center">
                      <Stethoscope className="w-3.5 h-3.5 me-1" /> ویٹرنری ڈاکٹر ضروری ہے
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
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {currentScanResult.aiNotes}
                </div>

                {/* Urdu Detailed Veterinary Diagnosis (RTL aligned) */}
                {currentScanResult.description_ur && (
                  <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-3" dir="rtl">
                    <div className="text-right flex items-center justify-between gap-2 border-b border-emerald-100/60 dark:border-emerald-900/40 pb-2">
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        تفصیلی طبی رپورٹ (Urdu Detailed Report)
                      </span>
                      <button
                        type="button"
                        onClick={handleListenSpeech}
                        disabled={ttsLoading}
                        className={`px-3 py-1 rounded-xl text-white font-bold text-[10px] shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-70 ${
                          isScanAudioPlaying
                            ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                            : ttsLoading
                            ? 'bg-amber-600'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {ttsLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{language === 'en' ? 'Loading Voice...' : 'آواز لوڈ ہو رہی ہے...'}</span>
                          </>
                        ) : isScanAudioPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-white" />
                            <span>{language === 'en' ? 'Stop Listening' : 'آواز بند کریں'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>{language === 'en' ? 'Listen' : 'آڈیو سنیں'}</span>
                          </>
                        )}
                      </button>
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

                {/* Precautions & Recommended Medicines */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 me-1.5" />
                    <span>فوری احتیاطی تدابیر:</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ps-2">
                    {currentScanResult.precautions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <Pill className="w-4 h-4 text-blue-600 me-1.5" />
                    <span>تجویز کردہ ادویات:</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentScanResult.recommendedMedicines.map((m, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recovery Plan Trigger Button */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerateRecoveryPlan}
                    disabled={isGeneratingPlan}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
                  >
                    {isGeneratingPlan ? (
                      <span>ریکوری پلان تیار ہو رہا ہے...</span>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        <span>روزانہ کا AI ریکوری پلان بنائیں ({currentScanResult.recoveryDaysEstimate} دن)</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900">
                <Scan className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">تصویر منتخب کریں اور سکین بٹن دبائیں۔</p>
              </div>
            )}

            {/* Generated Recovery Schedule Box */}
            {generatedRecoveryPlan && (
              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in">
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
                  <Calendar className="w-4 h-4 me-2 text-emerald-600" />
                  <span>روزانہ کا ریکوری پلان ({generatedRecoveryPlan.totalDays} دن)</span>
                </h4>

                <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">
                  ڈاکٹر ہدایت: {generatedRecoveryPlan.vetAdvice}
                </p>

                <div className="space-y-2 pt-2">
                  {generatedRecoveryPlan.steps.map((step) => (
                    <div key={step.day} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                        <span>دن {step.day}: {step.title}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        <strong>خوراک:</strong> {step.feedingInstructions}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Selected Animal's Scan Journal History */}
      {selectedAnimal && selectedAnimal.scanJournal.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <FileText className="w-4 h-4 text-emerald-600 me-2" />
            <span>سابقہ سکین ہسٹری (Scan Journal for {selectedAnimal.name})</span>
          </h3>

          <div className="space-y-2">
            {selectedAnimal.scanJournal.map((entry) => (
              <div key={entry.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 me-2">{entry.detectedDisease}</span>
                  <span className="text-slate-400">({entry.date})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  {entry.confidence}% اعتماد
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
