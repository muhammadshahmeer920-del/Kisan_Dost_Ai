import React, { useMemo } from 'react';
import { Animal, FarmExpense, OutbreakReport, Language } from '../types';
import { t } from '../lib/translations';
import { calculateLivestockVaccinationSchedule } from '../lib/vaccinationCalculator';
import { 
  Grid, 
  Heart, 
  TrendingUp, 
  Syringe, 
  Milk, 
  Activity, 
  Sun, 
  Scan, 
  Mic, 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  QrCode,
  FileText,
  Stethoscope,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface FarmOverviewProps {
  animals: Animal[];
  expenses: FarmExpense[];
  outbreaks: OutbreakReport[];
  language: Language;
  onNavigateTab: (tab: any) => void;
  onOpenAddAnimalModal: () => void;
}

export const FarmOverview: React.FC<FarmOverviewProps> = ({
  animals,
  expenses,
  outbreaks,
  language,
  onNavigateTab,
  onOpenAddAnimalModal,
}) => {
  // Calculated Metrics
  const totalAnimals = animals.length;
  const avgHealth = totalAnimals > 0 ? Math.round(animals.reduce((acc, a) => acc + a.healthScore, 0) / totalAnimals) : 0;
  const totalValuation = animals.reduce((acc, a) => acc + a.currentMarketValue, 0);
  const totalPurchasePrice = animals.reduce((acc, a) => acc + a.purchasePrice, 0);
  const totalDailyMilk = animals.reduce((acc, a) => acc + a.milkYieldLitersPerDay, 0);
  
  // Smart calculated vaccination schedule based on animal age & past history
  const vaccinationSummary = useMemo(() => {
    return calculateLivestockVaccinationSchedule(animals, '2026-08-18');
  }, [animals]);

  // Active Diseases / Recoveries
  const activeRecoveries = animals.filter((a) => a.healthStatus === 'sick' || a.healthStatus === 'fair' || a.medicalHistory.some((m) => m.recoveryStatus === 'recovering' || m.recoveryStatus === 'treating'));

  // Active Regional Outbreaks
  const activeOutbreaks = outbreaks.filter((o) => o.status === 'active');

  // Next due vaccine for the featured animal
  const featuredAnimal = animals[0];
  const featuredAnimalNextVaccine = featuredAnimal 
    ? vaccinationSummary.items.find((i) => i.animalId === featuredAnimal.id)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-6 sm:p-8 text-white shadow-xl shadow-green-100 dark:shadow-none overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md mb-2">
              <Sun className="w-3.5 h-3.5 me-1 text-amber-300" />
              <span>{language === 'en' ? 'Weather: 34°C (THI: 78 - Heat Alert)' : 'موسم: 34°C (THI: 78 - ہیٹ الرٹ)'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'en' ? 'Welcome, Al-Ata Dairy Farm!' : 'السلام علیکم، العطاء ڈیری فارم!'}
            </h2>
            <p className="text-xs sm:text-sm text-green-50 mt-1 max-w-xl font-medium">
              {language === 'en'
                ? `All your ${totalAnimals} livestock animals are monitored. Protection rate is ${vaccinationSummary.protectionRatePercent}%.`
                : `آپ کے تمام ${totalAnimals} مویشی زیر نگرانی ہیں۔ فارم کی حفاظتی شرح ${vaccinationSummary.protectionRatePercent}% ہے۔`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('qr_scanner')}
              className="w-full sm:w-auto justify-center px-5 py-3 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-black text-xs shadow-lg shadow-black/10 transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <QrCode className="w-4 h-4 text-slate-900" />
              <span>{language === 'en' ? 'Scan Ear-Tag QR' : 'ایئر ٹیگ کیو آر سکین'}</span>
            </button>

            <button
              onClick={onOpenAddAnimalModal}
              className="w-full sm:w-auto justify-center px-5 py-3 rounded-2xl bg-white text-green-800 hover:bg-green-50 font-extrabold text-xs shadow-lg shadow-black/10 transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <Plus className="w-4 h-4 text-green-700" />
              <span>{t('addAnimal', language)}</span>
            </button>

            <button
              onClick={() => onNavigateTab('scanner')}
              className="w-full sm:w-auto justify-center px-5 py-3 rounded-2xl bg-green-900/60 hover:bg-green-900 text-white font-extrabold text-xs border border-white/20 backdrop-blur-md transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <Scan className="w-4 h-4 text-green-300" />
              <span>{t('scanAnimal', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROMINENT VACCINATION DUE NOTIFICATION INDICATOR BANNER */}
      {(vaccinationSummary.overdueCount > 0 || vaccinationSummary.dueSoonCount > 0) && (
        <div className={`p-4 sm:p-5 rounded-3xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition-all animate-fade-in ${
          vaccinationSummary.overdueCount > 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 shadow-rose-900/10'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-amber-900/10'
        }`}>
          <div className="flex items-start sm:items-center space-x-3.5 rtl:space-x-reverse">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              vaccinationSummary.overdueCount > 0
                ? 'bg-rose-600 text-white animate-bounce'
                : 'bg-amber-500 text-white'
            }`}>
              <Syringe className="w-6 h-6" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  vaccinationSummary.overdueCount > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {vaccinationSummary.overdueCount > 0
                    ? (language === 'en' ? 'Urgent Vaccination Action' : 'فوری ویکسین انتباہ')
                    : (language === 'en' ? 'Upcoming Due Dates' : 'واجب الادا ویکسین الرٹ')}
                </span>
                
                {vaccinationSummary.overdueCount > 0 && (
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    🚨 {vaccinationSummary.overdueCount} {language === 'en' ? 'Overdue Doses' : (language === 'pb' ? 'لیٹ ٹیکے' : 'تاخیر شدہ')}
                  </span>
                )}
                {vaccinationSummary.dueSoonCount > 0 && (
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    ⏰ {vaccinationSummary.dueSoonCount} {language === 'en' ? 'Due in Next 30 Days' : (language === 'pb' ? 'اگلے 30 دناں وچ واجب' : 'اگلے 30 دن میں واجب الادا')}
                  </span>
                )}
              </div>

              <p className="text-xs mt-1 font-medium leading-relaxed">
                {language === 'en'
                  ? `Vaccination engine calculated ${vaccinationSummary.totalDueCount} doses due for your livestock based on age milestones and past boosters.`
                  : (language === 'pb'
                    ? `ویکسین انجن نے ڈنگراں دی عمر تے ہسٹری مطابق ${vaccinationSummary.totalDueCount} ٹیکے واجب کیتے نیں۔ فوری ٹیکے لواؤ۔`
                    : `ویکسین انجن نے جانوروں کی عمر، ہسٹری اور موسمی شیڈول کے مطابق ${vaccinationSummary.totalDueCount} خوراکیں واجب الادا کی ہیں۔ فوری حفاظتی ٹیکے لگوائیں۔`)}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('vaccines')}
            className={`px-5 py-3 rounded-2xl font-black text-xs shrink-0 self-stretch md:self-center shadow-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
              vaccinationSummary.overdueCount > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
            }`}
          >
            <Syringe className="w-4 h-4" />
            <span>{language === 'en' ? 'Open Vaccination Center' : (language === 'pb' ? 'ٹیکیاں دا سینٹر ویکھو' : 'ویکسینیشن شیڈول دیکھیں')}</span>
          </button>
        </div>
      )}

      {/* Regional Outbreak Alert Box */}
      {activeOutbreaks.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {language === 'en'
                    ? `Regional Outbreak Alert: ${activeOutbreaks[0].diseaseName} (${activeOutbreaks[0].district})`
                    : (language === 'pb'
                      ? `علاقے وچ بیماری دا الرٹ: ${activeOutbreaks[0].diseaseName} (${activeOutbreaks[0].district})`
                      : `علاقائی بیماری کا الرٹ: ${activeOutbreaks[0].diseaseName} (${activeOutbreaks[0].district})`)}
                </h4>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold bg-amber-200 text-amber-900">
                  {activeOutbreaks[0].affectedAnimalsCount} {language === 'en' ? 'Reported Cases' : 'کیسز رپورٹس'}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                {language === 'en' ? activeOutbreaks[0].precautionsEn : activeOutbreaks[0].precautionsUrdu}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('outbreaks')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-center shadow-sm"
          >
            {language === 'en' ? 'View Details' : 'تفصیلات دیکھیں'}
          </button>
        </div>
      )}

      {/* Sleek Stats Row (4 Columns including Smart Vaccination Metric) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Animals Card */}
        <div 
          onClick={() => onNavigateTab('animals')}
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {language === 'en' ? 'Total Livestock' : (language === 'pb' ? 'کل ڈنگر' : 'کل جانور')}
          </p>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {totalAnimals} <span className="text-xs font-medium text-slate-400">{language === 'en' ? 'Heads' : (language === 'pb' ? 'سر' : 'راس')}</span>
          </p>
          <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-xs font-bold">
            <span className="me-1">↑</span> 
            {language === 'en'
              ? `${animals.filter(a => a.species === 'cow').length} Cows • ${animals.filter(a => a.species === 'buffalo').length} Buffaloes`
              : (language === 'pb'
                ? `${animals.filter(a => a.species === 'cow').length} گاں • ${animals.filter(a => a.species === 'buffalo').length} مجھاں`
                : `${animals.filter(a => a.species === 'cow').length} گائے • ${animals.filter(a => a.species === 'buffalo').length} بھینس`)}
          </div>
        </div>

        {/* Farm Market Value Card */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {language === 'en' ? 'Estimated Farm Valuation' : (language === 'pb' ? 'فارم دی کل قیمت' : 'فارم کی کل قیمت')}
          </p>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 mt-2">
            Rs. {(totalValuation / 1000000).toFixed(1)}M
          </p>
          <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-xs font-bold">
            <span className="me-1">+</span> Rs. {((totalValuation - totalPurchasePrice) / 1000).toFixed(0)}k {language === 'en' ? 'Net Gain' : 'اضافہ'}
          </div>
        </div>

        {/* Health Score Progress Card */}
        <div 
          onClick={() => onNavigateTab('scanner')}
          className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {language === 'en' ? 'Average Health Score' : (language === 'pb' ? 'صحت دا اوسط سکور' : 'اوسط صحت سکور')}
          </p>
          <p className="text-3xl sm:text-4xl font-black text-green-600 dark:text-green-400 mt-2">
            {avgHealth}%
          </p>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${avgHealth}%` }}></div>
          </div>
        </div>

        {/* VACCINATION STATUS METRIC CARD */}
        <div 
          onClick={() => onNavigateTab('vaccines')}
          className={`p-5 sm:p-6 rounded-3xl border shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
            vaccinationSummary.overdueCount > 0
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80'
              : vaccinationSummary.dueSoonCount > 0
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-slate-600 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider">
              {t('pendingVaccines', language)}
            </p>
            <span className={`w-2.5 h-2.5 rounded-full ${
              vaccinationSummary.overdueCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
            }`}></span>
          </div>

          <p className="text-3xl sm:text-4xl font-black mt-2 flex items-baseline gap-2">
            <span className={vaccinationSummary.overdueCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}>
              {vaccinationSummary.totalDueCount}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Due' : (language === 'pb' ? 'باقی' : 'واجب الادا')}
            </span>
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
            <span className="text-rose-600 dark:text-rose-400">
              {vaccinationSummary.overdueCount} {language === 'en' ? 'Overdue' : 'تاخیر'}
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {vaccinationSummary.dueSoonCount} {language === 'en' ? 'Next 30d' : 'اگلا ماہ'}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {vaccinationSummary.protectionRatePercent}% {language === 'en' ? 'Protected' : 'محفوظ'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Animals Summary & Active Recovery Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 Cols): Featured Animal & Recent Scans */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Featured Animal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'en' ? 'Featured Animal' : (language === 'pb' ? 'خاص ڈنگر' : 'نمایاں جانور')}
              </h3>
              <button
                onClick={() => onNavigateTab('animals')}
                className="text-green-600 dark:text-green-400 text-xs font-bold hover:underline flex items-center"
              >
                <span>{language === 'en' ? 'View All' : 'تمام دیکھیں'}</span>
                <ChevronLeft className="w-4 h-4 ms-1 rtl:rotate-180" />
              </button>
            </div>

            <div className="p-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 rtl:space-x-reverse items-start">
              <div 
                onClick={() => onNavigateTab('animals')}
                className="w-full sm:w-48 h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl flex-shrink-0 relative overflow-hidden shadow-inner cursor-pointer group"
                title={language === 'en' ? 'Click to view full animal profile' : 'جانور کا مکمل پروفائل دیکھیں'}
              >
                <img
                  src={animals[0]?.photos[0] || "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=400"}
                  alt={animals[0]?.name || "Featured Animal"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white font-extrabold text-xs">Tag ID: {animals[0]?.tagId || "KD-0042"}</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div onClick={() => onNavigateTab('animals')} className="cursor-pointer">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Name' : 'نام'}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 transition-colors">{animals[0]?.name || (language === 'en' ? 'Mano Cow' : 'مانو')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Breed' : 'نسل'}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{animals[0]?.breed || (language === 'en' ? 'Sahiwal Pure' : 'ساہیوال')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Status' : 'حالت'}</p>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs font-bold rounded-lg inline-block mt-0.5">
                    {animals[0]?.pregnancyStatus === 'pregnant' 
                      ? (language === 'en' ? 'Pregnant' : 'حاملہ') 
                      : (language === 'en' ? 'Healthy' : 'صحت مند')}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{language === 'en' ? 'Market Value' : 'مارکیٹ ویلیو'}</p>
                  <p className="text-lg font-extrabold text-green-600 dark:text-green-400">
                    Rs. {(animals[0]?.currentMarketValue || 245000).toLocaleString()}
                  </p>
                </div>

                <div className="col-span-2 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Calculated Next Due Vaccine:' : 'اگلی مقررہ ویکسین:'}
                      </p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1.5 rtl:space-x-reverse mt-0.5">
                        <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {featuredAnimalNextVaccine 
                            ? `${featuredAnimalNextVaccine.vaccineName} (${featuredAnimalNextVaccine.calculatedDueDate})` 
                            : (animals[0]?.vaccinationHistory[0]?.vaccineName || 'Foot & Mouth - 2026-09-10')}
                        </span>
                        {featuredAnimalNextVaccine && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            featuredAnimalNextVaccine.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {featuredAnimalNextVaccine.status === 'overdue' 
                              ? (language === 'en' ? '🚨 Overdue!' : '🚨 تاخیر!') 
                              : (language === 'en' ? `${featuredAnimalNextVaccine.daysRemaining} days left` : `${featuredAnimalNextVaccine.daysRemaining} دن باقی`)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigateTab('animals')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-1 rtl:space-x-reverse"
                        title={language === 'en' ? 'View & Update Animal Profile' : 'جانور کا پروفائل دیکھئے یا ریکارڑ اپڈیٹ کریں'}
                      >
                        <span>{language === 'en' ? 'Animal Profile & Record' : 'جانور کا پروفائل و ریکارڈ'}</span>
                      </button>
                      <button
                        onClick={() => onNavigateTab('vaccines')}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all"
                        title={language === 'en' ? 'Vaccination Center' : 'ویکسینیشن سینٹر'}
                      >
                        {language === 'en' ? 'Vaccines' : 'ویکسین سینٹر'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Disease Scans */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'en' ? 'Recent Health Scans' : (language === 'pb' ? 'تازہ اسکینز' : 'تازہ ترین ہیلتھ اسکینز')}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-950/80 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 font-extrabold text-xs">
                    SCAN
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'en' ? 'Lumpy Skin Disease Scan - Sahiwal Cow 01' : 'لمپی سکن اسکین - ساہیوال گائے 01'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {language === 'en' ? 'Yesterday, 4:30 PM' : 'گزشتہ روز، 4:30 PM'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs font-bold rounded-full">
                  {language === 'en' ? 'Negative (Healthy)' : 'محفوظ (صحت مند)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/80 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                    SCAN
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'en' ? 'Mastitis Udder Check - Nili Buffalo 02' : 'میسٹائٹس چیک - نیلی بھینس 02'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {language === 'en' ? '3 days ago' : '3 دن پہلے'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold rounded-full">
                  {language === 'en' ? 'Minor Symptoms' : 'ہلکی علامات'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 Cols): Sleek Ear-Tag QR Widget, AI Doctor & Alerts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Ear-Tag QR Scanner Quick Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-500/30 dark:border-emerald-800/50 shadow-md relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'en' ? 'Ear-Tag QR Reader' : (language === 'pb' ? 'ایئر ٹیگ کیو آر سکینر' : 'ایئر ٹیگ کیو آر سکینر')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'en' ? 'Scan for Medical & Vaccine History' : 'میڈیکل اور واکسینیشن ہسٹری سکین'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {animals[0]?.tagId || 'KD-8842'} ({animals[0]?.breed || 'Sahiwal'})
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                {animals[0]?.vaccinationHistory.length || 3} {language === 'en' ? 'Vaccines' : 'ٹیکے'}
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('qr_scanner')}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all"
            >
              <QrCode className="w-4 h-4 text-emerald-200" />
              <span>{language === 'en' ? 'Open Ear-Tag Scanner' : 'ایئر ٹیگ سکینر کھولیں'}</span>
            </button>
          </div>

          {/* AI Livestock Assistant Widget */}
          <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-6 text-white shadow-xl shadow-green-100 dark:shadow-none relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">
                {language === 'en' ? 'AI Livestock Doctor' : (language === 'pb' ? 'AI ڈنگراں دا ڈاکٹر' : 'AI لائیو اسٹاک ڈاکٹر')}
              </h3>
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Mic className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <p className="text-green-50 text-xs leading-relaxed mb-6 italic">
              {language === 'en' 
                ? '"My cow is not eating fodder, what should I do?"'
                : '"میری گائے چارہ نہیں کھا رہی، کیا کروں؟"'}
            </p>
            <button
              onClick={() => onNavigateTab('assistant')}
              className="w-full bg-white text-green-800 font-extrabold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-black/10 hover:bg-green-50 transition-all text-xs"
            >
              <Mic className="w-4 h-4 text-green-700" />
              <span>{language === 'en' ? 'Tap to Talk' : 'بات کریں'}</span>
            </button>
            <p className="mt-3 text-center text-[10px] text-green-200 uppercase tracking-widest font-extrabold">
              {language === 'en' ? 'Voice & Text Assistant Enabled' : 'اردو و انگریزی وائس اسسٹنٹ'}
            </p>
          </div>

          {/* Smart Alerts with Dynamic Vaccination Due Item */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {language === 'en' ? 'Alerts & Reminders' : 'الرٹس اور یاددہانی'}
              </h3>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>

            <div className="space-y-3">
              {/* Dynamic Vaccine Alert in List */}
              {vaccinationSummary.items[0] && (
                <div 
                  onClick={() => onNavigateTab('vaccines')}
                  className={`flex space-x-3 rtl:space-x-reverse p-3.5 rounded-2xl border cursor-pointer hover:opacity-90 transition-all ${
                    vaccinationSummary.items[0].status === 'overdue'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="text-xl">💉</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold">
                        {vaccinationSummary.items[0].status === 'overdue' 
                          ? (language === 'en' ? 'Overdue Vaccine' : 'تاخیر شدہ ٹیکہ') 
                          : (language === 'en' ? 'Next Due Vaccine' : 'اگلا حفاظتی ٹیکہ')}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 dark:bg-slate-900/80">
                        {vaccinationSummary.items[0].calculatedDueDate}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {language === 'en'
                        ? `${vaccinationSummary.items[0].animalName} (${vaccinationSummary.items[0].tagId}) requires ${vaccinationSummary.items[0].vaccineName}.`
                        : `${vaccinationSummary.items[0].animalName} (${vaccinationSummary.items[0].tagId}) کو ${vaccinationSummary.items[0].vaccineName} درکار ہے۔`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 rtl:space-x-reverse p-3.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl border border-yellow-100 dark:border-yellow-900/50">
                <div className="text-xl">🌡️</div>
                <div>
                  <p className="text-xs font-bold text-yellow-900 dark:text-yellow-200">
                    {language === 'en' ? 'Heat Stress Alert' : 'گرمی کا انتباہ'}
                  </p>
                  <p className="text-[11px] text-yellow-700 dark:text-yellow-400 mt-0.5">
                    {language === 'en'
                      ? 'Keep fresh water and shade/fans active during noon (Temp > 38°C).'
                      : 'دوپہر کو پانی اور پنکھا آن رکھیں (Temp > 38°C)۔'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => onNavigateTab('vaccines')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="text-2xl mb-1">💉</div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                {language === 'en' ? 'Vaccine Center' : 'ویکسین سینٹر'}
              </span>
            </div>
            <div
              onClick={() => onNavigateTab('expenses')}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className="text-2xl mb-1">📊</div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                {language === 'en' ? 'Expenses' : 'اخراجات'}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
