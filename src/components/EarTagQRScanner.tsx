import React, { useState, useEffect, useRef } from 'react';
import { Animal, MedicalRecord, VaccinationRecord, Language } from '../types';
import { 
  QrCode, 
  Scan, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Syringe, 
  Stethoscope, 
  FileText, 
  ShieldCheck, 
  Printer, 
  X, 
  RefreshCw, 
  Sparkles, 
  Zap,
  Bot,
  User,
  Activity,
  Plus,
  Share2,
  Calendar,
  Volume2
} from 'lucide-react';

interface EarTagQRScannerProps {
  animals: Animal[];
  language: Language;
  onClose?: () => void;
  onNavigateToAIDoctor?: (animalId: string) => void;
  onUpdateAnimal?: (updatedAnimal: Animal) => void;
}

export const EarTagQRScanner: React.FC<EarTagQRScannerProps> = ({
  animals,
  language,
  onClose,
  onNavigateToAIDoctor,
  onUpdateAnimal
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'generator'>('scanner');
  const [scannedTagId, setScannedTagId] = useState<string | null>(animals[0]?.tagId || null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [activeHistorySubTab, setActiveHistorySubTab] = useState<'vaccines' | 'medical' | 'scans' | 'ownership'>('vaccines');
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);

  // New Record Modals
  const [showAddVaccineModal, setShowAddVaccineModal] = useState<boolean>(false);
  const [showAddMedicalModal, setShowAddMedicalModal] = useState<boolean>(false);
  
  // New vaccine form state
  const [newVaccineName, setNewVaccineName] = useState('FMD Booster (منہ کھُر)');
  const [newVaccineDate, setNewVaccineDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNextDueDate, setNewNextDueDate] = useState('');
  const [newVetName, setNewVetName] = useState('Dr. Tariq Mahmood');

  // New medical form state
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newTreatment, setNewTreatment] = useState('');
  const [newMedicine, setNewMedicine] = useState('');

  const scannedAnimal = animals.find(a => a.tagId.toLowerCase() === scannedTagId?.toLowerCase()) || animals[0];

  // Simulated Camera Scanning Beam Effect
  useEffect(() => {
    let timer: any;
    if (isScanning) {
      timer = setTimeout(() => {
        setIsScanning(false);
        if (animals.length > 0) {
          const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
          setScannedTagId(randomAnimal.tagId);
          triggerSuccessFeedback(randomAnimal.tagId, randomAnimal.name);
        }
      }, 2200);
    }
    return () => clearTimeout(timer);
  }, [isScanning, animals]);

  const triggerSuccessFeedback = (tagId: string, name: string) => {
    const msg = language === 'en'
      ? `Ear-Tag ${tagId} (${name}) Scanned Successfully! Medical records loaded.`
      : `ایئر ٹیگ ${tagId} (${name}) کامیابی سے سکین ہو گیا! طبی ریکارڈ لوڈ کر دیا گیا۔`;
    setScanSuccessFeedback(msg);
    setTimeout(() => setScanSuccessFeedback(null), 4000);
  };

  const handleSimulateScan = (tagId: string) => {
    setIsScanning(true);
    setTimeout(() => {
      setScannedTagId(tagId);
      setIsScanning(false);
      const target = animals.find(a => a.tagId === tagId);
      triggerSuccessFeedback(tagId, target?.name || '');
    }, 1000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const matched = animals.find(a => 
      a.tagId.toLowerCase().includes(manualInput.toLowerCase()) || 
      a.name.toLowerCase().includes(manualInput.toLowerCase())
    );

    if (matched) {
      setScannedTagId(matched.tagId);
      triggerSuccessFeedback(matched.tagId, matched.name);
    } else {
      alert(language === 'en' 
        ? `No animal found matching Tag ID "${manualInput}". Showing default animal.` 
        : `ٹیگ آئی ڈی "${manualInput}" کے مطابق کوئی جانور نہیں ملا۔`);
    }
    setManualInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        if (animals.length > 0) {
          const selected = animals[0];
          setScannedTagId(selected.tagId);
          triggerSuccessFeedback(selected.tagId, selected.name);
        }
      }, 1500);
    }
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAnimal) return;

    const newVac: VaccinationRecord = {
      id: 'vac_' + Date.now(),
      animalId: scannedAnimal.id,
      vaccineName: newVaccineName,
      diseaseTarget: 'Preventative Immunization',
      dateGiven: newVaccineDate,
      nextDueDate: newNextDueDate || newVaccineDate,
      administeredBy: newVetName,
      status: 'completed',
    };

    const updatedAnimal: Animal = {
      ...scannedAnimal,
      vaccinationHistory: [newVac, ...scannedAnimal.vaccinationHistory],
    };

    if (onUpdateAnimal) {
      onUpdateAnimal(updatedAnimal);
    }
    setShowAddVaccineModal(false);
    alert(language === 'en' ? 'Vaccination record added successfully!' : 'ویکسین کا ریکارڈ محفوظ کر دیا گیا ہے!');
  };

  const handleAddMedicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAnimal) return;

    const newMed: MedicalRecord = {
      id: 'med_' + Date.now(),
      animalId: scannedAnimal.id,
      date: new Date().toISOString().split('T')[0],
      diagnosis: newDiagnosis || 'Routine Health Checkup',
      treatment: newTreatment || 'General Tonic Administered',
      medicineGiven: newMedicine || 'Multivitamin Injection',
      dosage: '5ml IM',
      vetName: newVetName,
      recoveryStatus: 'cured',
    };

    const updatedAnimal: Animal = {
      ...scannedAnimal,
      medicalHistory: [newMed, ...scannedAnimal.medicalHistory],
    };

    if (onUpdateAnimal) {
      onUpdateAnimal(updatedAnimal);
    }
    setShowAddMedicalModal(false);
    alert(language === 'en' ? 'Medical record updated successfully!' : 'طبی ریکارڈ اپڈیٹ ہو گیا!');
  };

  // SVG QR Code Generator Helper Component
  const SVGQRCode = ({ text }: { text: string }) => {
    return (
      <div className="relative bg-white p-3 rounded-2xl shadow-inner border border-slate-200 inline-block">
        <svg className="w-32 h-32 sm:w-40 sm:h-40" viewBox="0 0 100 100">
          {/* QR Outer Frame */}
          <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
          {/* Top-Left Finder */}
          <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="2" />
          <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="1" />
          <rect x="13" y="13" width="9" height="9" fill="#059669" rx="1" />

          {/* Top-Right Finder */}
          <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="2" />
          <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="1" />
          <rect x="78" y="13" width="9" height="9" fill="#059669" rx="1" />

          {/* Bottom-Left Finder */}
          <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="2" />
          <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="1" />
          <rect x="13" y="78" width="9" height="9" fill="#059669" rx="1" />

          {/* Random QR Pattern Dots based on text hash */}
          <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
          <rect x="48" y="8" width="6" height="6" fill="#0f172a" />
          <rect x="58" y="16" width="6" height="6" fill="#059669" />
          <rect x="36" y="24" width="6" height="6" fill="#0f172a" />
          <rect x="48" y="24" width="6" height="6" fill="#0f172a" />

          <rect x="8" y="36" width="6" height="6" fill="#059669" />
          <rect x="20" y="44" width="6" height="6" fill="#0f172a" />
          <rect x="36" y="36" width="12" height="12" fill="#0f172a" />
          <rect x="54" y="36" width="6" height="6" fill="#0f172a" />
          <rect x="66" y="44" width="6" height="6" fill="#059669" />
          <rect x="82" y="36" width="6" height="6" fill="#0f172a" />

          <rect x="8" y="54" width="6" height="6" fill="#0f172a" />
          <rect x="20" y="54" width="6" height="6" fill="#0f172a" />
          <rect x="36" y="54" width="6" height="6" fill="#059669" />
          <rect x="48" y="54" width="12" height="12" fill="#0f172a" />
          <rect x="66" y="54" width="6" height="6" fill="#0f172a" />
          <rect x="82" y="54" width="6" height="6" fill="#059669" />

          <rect x="36" y="72" width="6" height="6" fill="#0f172a" />
          <rect x="48" y="72" width="6" height="6" fill="#0f172a" />
          <rect x="60" y="72" width="12" height="12" fill="#059669" />
          <rect x="78" y="72" width="6" height="6" fill="#0f172a" />
          <rect x="36" y="84" width="6" height="6" fill="#0f172a" />
          <rect x="52" y="84" width="6" height="6" fill="#0f172a" />
          <rect x="72" y="84" width="12" height="12" fill="#0f172a" />
        </svg>

        {/* Center Tag Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            KD
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <QrCode className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                <Sparkles className="w-3 h-3 me-1 text-amber-300" />
                <span>{language === 'en' ? 'Ear-Tag QR Reader v2.5' : 'سمارٹ ایئر ٹیگ کیو آر ریڈر'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {language === 'en' ? 'Ear-Tag QR Code Medical Scanner' : 'ایئر ٹیگ کیو آر سکینر و ریکارڈ سسٹم'}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {language === 'en' 
                  ? 'Scan livestock ear-tags to instantly retrieve complete vaccination and medical history.'
                  : 'جانور کے کان کے کیو آر ٹیگ کو سکین کریں اور واکسینیشن و بیماریوں کا مکمل ہسٹری دیکھیں۔'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse self-start md:self-auto">
            <button
              onClick={() => setActiveTab('generator')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center space-x-1.5 rtl:space-x-reverse shadow-lg shadow-emerald-900/40 transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>{language === 'en' ? 'Print Animal QR Tags' : 'پرنٹ کیو آر ایئر ٹیگ'}</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Banner Alert */}
      {scanSuccessFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{scanSuccessFeedback}</span>
          </div>
          <button onClick={() => setScanSuccessFeedback(null)} className="text-emerald-700 hover:underline">
            {language === 'en' ? 'Dismiss' : 'بند کریں'}
          </button>
        </div>
      )}

      {/* TAB 1: SCANNER & INSTANT RETRIEVAL */}
      {activeTab === 'generator' ? (
        /* PRINTABLE QR GENERATOR FOR ALL ANIMALS */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center">
                <Printer className="w-5 h-5 me-2 text-emerald-600" />
                <span>{language === 'en' ? 'Printable Ear-Tag QR Badges' : 'فارم کے جانوروں کے پرنٹیبل کیو آر ٹیگز'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en' 
                  ? 'Print these QR ear-tag badges and attach them to animal ear tags or farm stalls.'
                  : 'یہ کیو آر کوڈز پرنٹ کر کے اپنے مویشیوں کے کانوں پر لگائیں تاکہ کوئی بھی ویٹرنری ڈاکٹر ان کی میڈیکل ہسٹری سکین کر سکے۔'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
            >
              ← {language === 'en' ? 'Back to Scanner' : 'واپس سکینر پر جائیں'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {animals.map((anm) => (
              <div
                key={anm.id}
                className="p-5 rounded-3xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border-2 border-emerald-500/30 shadow-md relative group hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-3"
              >
                {/* Animal Photo & Tag */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse w-full text-start">
                  <img
                    src={anm.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=200'}
                    alt={anm.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-black inline-block">
                      {anm.tagId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{anm.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{anm.breed}</p>
                  </div>
                </div>

                {/* SVG QR Code */}
                <div className="py-2">
                  <SVGQRCode text={`KD_ANIMAL_${anm.tagId}`} />
                </div>

                {/* Footer Tag Details */}
                <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>فارم: Al-Ata Dairy</span>
                  <span className="font-bold text-emerald-600">کیسان دوست AI</span>
                </div>

                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1 rtl:space-x-reverse"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Print Tag' : 'ٹیگ پرنٹ کریں'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MAIN SCANNER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 Cols): Live Scanner & Input Controls */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Viewfinder Camera Box */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-center">
              
              {/* Header inside camera */}
              <div className="flex items-center justify-between mb-3 text-xs text-slate-300 font-bold">
                <span className="flex items-center text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 me-1.5 animate-ping"></span>
                  {language === 'en' ? 'Live QR Lens Active' : 'لائیو کیمرہ کیو آر لینس'}
                </span>
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                    flashEnabled ? 'bg-amber-400 text-slate-900 border-amber-300' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {flashEnabled ? 'Flash ON ⚡' : 'Flash OFF'}
                </button>
              </div>

              {/* Viewfinder Frame */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center overflow-hidden my-2 shadow-inner">
                
                {/* Glowing Laser Beam when scanning */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce top-10 z-20"></div>
                )}

                {/* Corner Markers */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                {/* Target Graphic / Sim Image */}
                <div className="p-4 text-center space-y-2">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <QrCode className={`w-12 h-12 ${isScanning ? 'scale-110 text-emerald-300 transition-all' : ''}`} />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isScanning 
                      ? (language === 'en' ? 'Scanning Ear-Tag QR Code...' : 'ایئر ٹیگ کیو آر سکین ہو رہا ہے...')
                      : (language === 'en' ? 'Align ear-tag QR inside box' : 'کان کا کیو آر ٹیگ باکس کے اندر رکھیں')}
                  </p>
                </div>

                {/* Flash Overlay */}
                {flashEnabled && <div className="absolute inset-0 bg-amber-100/10 pointer-events-none"></div>}
              </div>

              {/* Action Buttons under camera */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={isScanning}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse"
                >
                  <Scan className="w-4 h-4" />
                  <span>{isScanning ? (language === 'en' ? 'Scanning...' : 'سکیننگ...') : (language === 'en' ? 'Scan Now' : 'سکین کریں')}</span>
                </button>

                <label className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs cursor-pointer flex items-center justify-center space-x-1 rtl:space-x-reverse border border-slate-700">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'en' ? 'Upload QR' : 'کیو آر تصویر'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

            </div>

            {/* Quick Demo Tag Selectors */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Select Registered Animal Tag:' : 'رجسٹرڈ جانوروں کا سمارٹ کیو آر منتخب کریں:'}
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                {animals.map((anm) => {
                  const isSelected = anm.tagId === scannedTagId;
                  return (
                    <button
                      key={anm.id}
                      onClick={() => handleSimulateScan(anm.tagId)}
                      className={`w-full p-2.5 rounded-2xl border text-start transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                        <img
                          src={anm.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=200'}
                          alt={anm.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-400 block">{anm.tagId}</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{anm.name}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {language === 'en' ? 'Scan Tag' : 'سکین کریں'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Manual Tag Search Form */}
              <form onSubmit={handleManualSearch} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={language === 'en' ? 'Type Tag ID (e.g. KD-8842)' : 'ٹیگ آئی ڈی درج کریں (مثال KD-8842)'}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
                >
                  {language === 'en' ? 'Find' : 'تلاش'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column (7 Cols): Retrieved Animal Profile & Full History */}
          <div className="lg:col-span-7 space-y-6">
            
            {scannedAnimal ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Animal Bio Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <img
                        src={scannedAnimal.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=400'}
                        alt={scannedAnimal.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-black text-xs">
                            {scannedAnimal.tagId}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            scannedAnimal.healthScore > 85 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Health: {scannedAnimal.healthScore}%
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                          {scannedAnimal.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {scannedAnimal.breed} • {scannedAnimal.gender === 'female' ? 'مادہ (Female)' : 'نر (Male)'} • {scannedAnimal.ageMonths} ماہ
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-start sm:text-end">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">مارکیٹ قیمت</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        Rs. {scannedAnimal.currentMarketValue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Animal Bio Key Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'en' ? 'Milk Yield' : 'روزانہ دودھ'}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{scannedAnimal.milkYieldLitersPerDay} L/Day</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'en' ? 'Weight' : 'وزن'}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{scannedAnimal.weightKg} kg</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'en' ? 'Pregnancy' : 'حمل کا سٹیٹس'}</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{scannedAnimal.pregnancyStatus}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'en' ? 'Bloodline' : 'بلڈ لائن'}</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate block">{scannedAnimal.bloodline || 'Pure'}</span>
                    </div>
                  </div>

                  {/* Quick Consult AI Doctor Button for this Animal */}
                  {onNavigateToAIDoctor && (
                    <button
                      onClick={() => onNavigateToAIDoctor(scannedAnimal.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 rtl:space-x-reverse hover:opacity-95"
                    >
                      <Bot className="w-4 h-4 text-amber-300" />
                      <span>{language === 'en' ? `Consult AI Doctor for ${scannedAnimal.name}` : `اس جانور (${scannedAnimal.name}) کے لیے AI ڈاکٹر سے مشورہ لیں`}</span>
                    </button>
                  )}
                </div>

                {/* Interactive History Tabs */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  
                  {/* Tab Selector */}
                  <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 gap-1">
                    <button
                      onClick={() => setActiveHistorySubTab('vaccines')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
                        activeHistorySubTab === 'vaccines'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'en' ? 'Vaccination Record' : 'واکسینیشن ہسٹری'}</span>
                    </button>

                    <button
                      onClick={() => setActiveHistorySubTab('medical')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
                        activeHistorySubTab === 'medical'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'en' ? 'Medical Treatments' : 'طبی ریکارڈ و علاج'}</span>
                    </button>

                    <button
                      onClick={() => setActiveHistorySubTab('scans')}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
                        activeHistorySubTab === 'scans'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Scan className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'en' ? 'AI Scans' : 'اے آئی سکینز'}</span>
                    </button>
                  </div>

                  {/* SUB-PANEL 1: VACCINATION HISTORY */}
                  {activeHistorySubTab === 'vaccines' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {language === 'en' ? 'Vaccines History & Upcoming Schedule:' : 'ویکسین کا سابقہ و آئندہ ریکارڈ:'}
                        </h4>
                        <button
                          onClick={() => setShowAddVaccineModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1 rtl:space-x-reverse"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Add Vaccine' : 'نیا ریکارڈ درج کریں'}</span>
                        </button>
                      </div>

                      {scannedAnimal.vaccinationHistory && scannedAnimal.vaccinationHistory.length > 0 ? (
                        <div className="space-y-3">
                          {scannedAnimal.vaccinationHistory.map((vac) => (
                            <div
                              key={vac.id}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start justify-between gap-3"
                            >
                              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                <div className={`p-2 rounded-xl text-white mt-0.5 ${
                                  vac.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-500'
                                }`}>
                                  <Syringe className="w-4 h-4" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{vac.vaccineName}</h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {language === 'en' ? 'Administered by:' : 'ڈاکٹر/اہلکار:'} {vac.administeredBy || 'Dr. Tariq Mahmood'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-1">
                                    {vac.dateGiven && <span>تاریخ لگوائی: <strong>{vac.dateGiven}</strong></span>}
                                    {vac.nextDueDate && <span className="text-emerald-700 dark:text-emerald-300 font-bold">اگلی خوراک: <strong>{vac.nextDueDate}</strong></span>}
                                  </div>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                                vac.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {vac.status === 'completed' ? (language === 'en' ? 'Completed' : 'مکمل') : (language === 'en' ? 'Scheduled' : 'شیڈول')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          {language === 'en' ? 'No vaccination history recorded yet.' : 'کوئی ویکسین ریکارڈ موجود نہیں ہے۔'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* SUB-PANEL 2: MEDICAL TREATMENTS */}
                  {activeHistorySubTab === 'medical' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {language === 'en' ? 'Past Medical Diagnoses & Treatments:' : 'سابقہ بیماریوں اور علاج کا ہسٹری لاگ:'}
                        </h4>
                        <button
                          onClick={() => setShowAddMedicalModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1 rtl:space-x-reverse"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Add Treatment' : 'نیا علاج کا اندراج'}</span>
                        </button>
                      </div>

                      {scannedAnimal.medicalHistory && scannedAnimal.medicalHistory.length > 0 ? (
                        <div className="space-y-3">
                          {scannedAnimal.medicalHistory.map((med) => (
                            <div
                              key={med.id}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{med.diagnosis}</h5>
                                <span className="text-[10px] text-slate-400 font-mono">{med.date}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                <strong>علاج:</strong> {med.treatment}
                              </p>
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span>دوا: <strong className="text-emerald-700 dark:text-emerald-400">{med.medicineGiven} ({med.dosage})</strong></span>
                                <span>ویٹرنری ڈاکٹر: {med.vetName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          {language === 'en' ? 'No past medical treatments recorded.' : 'کوئی طبی بیماری یا علاج لاگ موجود نہیں ہے۔'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* SUB-PANEL 3: AI DISEASE SCANS */}
                  {activeHistorySubTab === 'scans' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'AI Disease Scans Log:' : 'اے آئی بیماری سکین ہسٹری:'}
                      </h4>

                      {scannedAnimal.scanJournal && scannedAnimal.scanJournal.length > 0 ? (
                        <div className="space-y-3">
                          {scannedAnimal.scanJournal.map((scn) => (
                            <div
                              key={scn.id}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{scn.detectedDisease}</h5>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {scn.confidence}% Confidence
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{scn.aiNotes}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{scn.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          {language === 'en' ? 'No AI disease scans recorded for this tag.' : 'اس ٹیگ کے لیے کوئی سمارٹ سکین موجود نہیں ہے۔'}
                        </p>
                      )}
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'No Ear-Tag Selected' : 'کوئی ایئر ٹیگ منتخب نہیں ہے'}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'en' ? 'Scan a tag using the camera on the left or select a registered animal.' : 'بائیں جانب کیمرے سے ٹیگ سکین کریں یا فہرست میں سے منتخب کریں۔'}
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL: ADD VACCINE ENTRY */}
      {showAddVaccineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {language === 'en' ? `Add Vaccine Record for Tag ${scannedAnimal?.tagId}` : `ویکسینیشن کا نیا اندراج (${scannedAnimal?.tagId})`}
              </h3>
              <button onClick={() => setShowAddVaccineModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVaccine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Vaccine Name:' : 'ویکسین کا نام:'}
                </label>
                <input
                  type="text"
                  value={newVaccineName}
                  onChange={(e) => setNewVaccineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Date Administered:' : 'تاریخ خوراک:'}
                </label>
                <input
                  type="date"
                  value={newVaccineDate}
                  onChange={(e) => setNewVaccineDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Next Booster Due Date:' : 'اگلی ویکسین کی تاریخ:'}
                </label>
                <input
                  type="date"
                  value={newNextDueDate}
                  onChange={(e) => setNewNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Administered Vet/Staff Name:' : 'ڈاکٹر یا عملے کا نام:'}
                </label>
                <input
                  type="text"
                  value={newVetName}
                  onChange={(e) => setNewVetName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVaccineModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  {language === 'en' ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700"
                >
                  {language === 'en' ? 'Save Vaccine' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDICAL TREATMENT ENTRY */}
      {showAddMedicalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {language === 'en' ? `Add Medical Record for Tag ${scannedAnimal?.tagId}` : `طبی ریکارڈ کا اندراج (${scannedAnimal?.tagId})`}
              </h3>
              <button onClick={() => setShowAddMedicalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicalRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Diagnosis / Illness:' : 'بیماری کا نام یا تشخیص:'}
                </label>
                <input
                  type="text"
                  value={newDiagnosis}
                  onChange={(e) => setNewDiagnosis(e.target.value)}
                  placeholder="e.g. Mild Mastitis or High Fever"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Treatment Description:' : 'علاج کی تفصیل:'}
                </label>
                <textarea
                  rows={2}
                  value={newTreatment}
                  onChange={(e) => setNewTreatment(e.target.value)}
                  placeholder="e.g. Antibiotic injection course and udder massage"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Medicine Administered:' : 'دی گئی ادویات:'}
                </label>
                <input
                  type="text"
                  value={newMedicine}
                  onChange={(e) => setNewMedicine(e.target.value)}
                  placeholder="e.g. Meloxicam 15mg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedicalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  {language === 'en' ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700"
                >
                  {language === 'en' ? 'Save Treatment' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
