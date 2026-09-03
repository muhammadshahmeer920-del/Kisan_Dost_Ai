import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../lib/translations';
import { Pill, Search, ShieldCheck, CheckCircle2, Calculator, Camera, Upload, Sparkles, Brain } from 'lucide-react';

interface MedicineCheckerProps {
  language: Language;
}

export const MedicineChecker: React.FC<MedicineCheckerProps> = ({ language }) => {
  const isEn = language === 'en';
  const [searchName, setSearchName] = useState('');
  const [animalWeightKg, setAnimalWeightKg] = useState(350);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);

  // Photo Analysis State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMedicinePhoto = async () => {
    if (!imagePreview) return;
    setIsAnalyzingImage(true);
    try {
      const res = await fetch('/api/ai/medicine-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          language,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
      }
    } catch (e) {
      console.error('Failed to scan medicine:', e);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const medicines = [
    {
      name: isEn ? 'Oxytetracycline 20% LA (Antibiotic)' : 'Oxytetracycline 20% LA (اینٹی بائیوٹک)',
      category: 'Antibiotic Injection',
      dosagePerKg: '1 ml per 10 kg body weight',
      purpose: isEn
        ? 'For hemorrhagic septicemia, high fever, and wound infections.'
        : 'گل گھوٹو، تیز بخار اور زخموں کے انفیکشن کے لیے۔',
      authenticBatchPrefix: 'OXY-PK',
    },
    {
      name: isEn ? 'Meloxicam 15mg/ml (Anti-inflammatory)' : 'Meloxicam 15mg/ml (درد و بخار کش)',
      category: 'NSAID / Painkiller',
      dosagePerKg: '0.5 mg per kg body weight',
      purpose: isEn
        ? 'For inflammation, lumpy skin fever, and hoof pain relief.'
        : 'سوزش، لمپی سکن کا بخار اور سموں کا درد ختم کرنے کے لیے۔',
      authenticBatchPrefix: 'MEL-PK',
    },
    {
      name: isEn ? 'Ivermectin 1% (Dewormer Injection)' : 'Ivermectin 1% (کرم کش انجکشن)',
      category: 'Dewormer',
      dosagePerKg: '1 ml per 50 kg body weight',
      purpose: isEn
        ? 'For internal worms, ticks, lice, and mange treatment.'
        : 'پیٹ کے کیڑے، چچڑ اور کھجلی ختم کرنے کے لیے۔',
      authenticBatchPrefix: 'IVM-PK',
    },
  ];

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(searchName.toLowerCase()));

  // Calculated Dose
  const calculatedDoseMl = selectedMed
    ? selectedMed.category.includes('Dewormer')
      ? (animalWeightKg / 50).toFixed(1)
      : (animalWeightKg / 10).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Pill className="w-6 h-6 text-emerald-600 me-2" />
            <span>{t('medicineChecker', language)}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? 'Veterinary medicine dosage calculator and AI label verification (Gemini 3.1 Pro).'
              : 'مویشیوں دی ادویات دا خوراک کیلکولیٹر اور AI تصویر معائنہ (Gemini 3.1 Pro)۔'}
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
          <Brain className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>High Thinking Mode (Gemini 3.1 Pro) Active</span>
        </div>
      </div>

      {/* AI Photo Scanner Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-green-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Camera className="w-4 h-4 text-emerald-600 me-2" />
            <span>{isEn ? 'Analyze Medicine Label or Prescription Photo' : 'دوا یا نسخے کی تصویر سے تصدیق'}</span>
          </h3>
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
            AI Vision + High Thinking
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-center">
              <Upload className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {imagePreview
                  ? (isEn ? 'Change Photo' : 'تصویر تبدیل کریں')
                  : (isEn ? 'Upload medicine bottle or prescription photo' : 'دوا کی بوتل یا نسخے کی تصویر اپلوڈ کریں')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG supported</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <div>
            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-100 dark:bg-slate-800">
                  <img src={imagePreview} alt="Medicine Label" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={handleAnalyzeMedicinePhoto}
                  disabled={isAnalyzingImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-md transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isAnalyzingImage
                      ? (isEn ? 'Gemini 3.1 Pro analyzing label...' : 'Gemini 3.1 Pro سوچ اور تجزیہ کر رہا ہے...')
                      : (isEn ? 'Analyze Photo with AI Vision' : 'AI سے تصویر کا مکمل تجزیہ کریں')}
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-2">
                <div className="flex items-center text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 me-1.5" />
                  <span>{isEn ? 'Protection Against Fake Medicines' : 'جعلی ادویات سے تحفظ'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isEn
                    ? 'Snap a photo of any injection, syrup, or feed supplement. AI will verify formula, dosage, milk/meat withdrawal periods, and authenticity.'
                    : 'کسی بھی انجکشن، شربت یا فیڈ سپلیمنٹ کی تصویر لیں، ماڈل فارمولا، خوراک، دودھ/گوشت پرہیز اور اصلیت چیک کرے گا۔'}
                </p>
              </div>
            )}
          </div>
        </div>

        {analysisResult && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  {analysisResult.medicineName}
                </span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                {analysisResult.category}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900">
                <span className="font-bold text-slate-500 block mb-0.5">{isEn ? 'Recommended Dosage:' : 'تجویز کردہ خوراک:'}</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{analysisResult.dosageGuide}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900">
                <span className="font-bold text-slate-500 block mb-0.5">{isEn ? 'Milk & Meat Withdrawal Period:' : 'دودھ اور گوشت میں اثر (Withdrawal):'}</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">{analysisResult.withdrawalPeriodDays}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl">
              {analysisResult.aiNotes}
            </p>
          </div>
        )}
      </div>

      {/* Search & Counterfeit Checker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Medicine Search */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isEn ? 'Search Veterinary Medicine' : 'دوا تلاش کریں'}</h3>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={isEn ? 'Type medicine name (e.g. Oxytetracycline)...' : 'دوا کا نام لکھیں (مثال: Oxytetracycline)...'}
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          <div className="space-y-2">
            {filteredMeds.map((med, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMed(med)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedMed?.name === med.name
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{med.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{med.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dosage Calculator */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Calculator className="w-4 h-4 text-emerald-600 me-2" />
            <span>{isEn ? 'Dosage Calculator' : 'خوراک کیلکولیٹر (Dosage Calculator)'}</span>
          </h3>

          {selectedMed ? (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                <span className="text-xs text-slate-400 block">{isEn ? 'Selected Medicine:' : 'منتخب دوا:'}</span>
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">{selectedMed.name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isEn ? 'Animal Weight (kg):' : 'جانور کا وزن (کلوگرام):'}</label>
                <input
                  type="number"
                  value={animalWeightKg}
                  onChange={(e) => setAnimalWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center">
                <span className="text-xs text-slate-400 block">{isEn ? 'Recommended Dosage:' : 'تجویز کردہ مقدار (Dose):'}</span>
                <span className="text-2xl font-bold text-emerald-600">{calculatedDoseMl} ml</span>
                <span className="text-[10px] text-slate-500 block mt-1">{isEn ? 'Subcutaneous or Intramuscular Injection' : 'زیرِ جلد یا گوشت میں انجکشن'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">{isEn ? 'Select a medicine from the left list or upload a photo above.' : 'بائیں طرف سے دوا منتخب کریں یا اوپر تصویر اپلوڈ کریں۔'}</p>
          )}
        </div>

      </div>

    </div>
  );
};
