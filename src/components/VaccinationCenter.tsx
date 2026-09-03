import React, { useState, useMemo } from 'react';
import { Animal, Vaccination, Language, Species } from '../types';
import { t } from '../lib/translations';
import {
  calculateLivestockVaccinationSchedule,
  CalculatedVaccineDue,
  VACCINE_PROTOCOLS,
} from '../lib/vaccinationCalculator';
import {
  Syringe,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Clock,
  Filter,
  Search,
  Check,
  Info,
  CalendarDays,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  AlertCircle,
  HelpCircle,
  Baby,
} from 'lucide-react';

interface VaccinationCenterProps {
  animals: Animal[];
  onAddVaccination: (animalId: string, vac: Vaccination) => void;
  language: Language;
}

export const VaccinationCenter: React.FC<VaccinationCenterProps> = ({
  animals,
  onAddVaccination,
  language,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'smart_calculator' | 'register_manual' | 'history' | 'protocols_guide'>('smart_calculator');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'upcoming'>('all');
  const [selectedAnimalFilter, setSelectedAnimalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual Schedule Form State
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.id || '');
  const [vaccineName, setVaccineName] = useState('گل گھوٹو (Hemorrhagic Septicemia)');
  const [scheduledDate, setScheduledDate] = useState('2026-08-25');
  const [batchNumber, setBatchNumber] = useState('BATCH-2026-HS-88');
  const [adminVet, setAdminVet] = useState('Govt Civil Veterinary Hospital');

  // Quick Administer Modal / State
  const [administeringItem, setAdministeringItem] = useState<CalculatedVaccineDue | null>(null);
  const [administeredDate, setAdministeredDate] = useState('2026-08-18');
  const [adminBatch, setAdminBatch] = useState('BATCH-2026-AUG-99');
  const [adminBy, setAdminBy] = useState('Dr. Tariq Mahmood');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute calculated vaccination schedule based on age and history
  const vaccinationSummary = useMemo(() => {
    return calculateLivestockVaccinationSchedule(animals, '2026-08-18');
  }, [animals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Manual Form Submit
  const handleRegisterVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId) return;

    const targetAnimal = animals.find((a) => a.id === selectedAnimalId);

    const newVac: Vaccination = {
      id: 'vac_' + Date.now(),
      animalId: selectedAnimalId,
      vaccineName,
      scheduledDate,
      status: 'scheduled',
      batchNumber,
      administeredBy: adminVet,
      notes: 'دستی طور پر شیڈول کی گئی ویکسین',
    };

    onAddVaccination(selectedAnimalId, newVac);
    showToast(
      language === 'en'
        ? `Vaccine scheduled successfully for ${targetAnimal?.name || 'Animal'}!`
        : `ویکسین ${targetAnimal?.name || 'جانور'} کے لیے کامیابی سے شیڈول کر دی گئی ہے!`
    );
  };

  // Handle Mark Administered from Smart Calculator
  const handleConfirmAdministered = (e: React.FormEvent) => {
    e.preventDefault();
    if (!administeringItem) return;

    // Calculate next due date
    const nextDate = new Date(administeredDate);
    nextDate.setMonth(nextDate.getMonth() + administeringItem.frequencyMonths);
    const nextDueDateStr = nextDate.toISOString().split('T')[0];

    const newVac: Vaccination = {
      id: 'vac_' + Date.now(),
      animalId: administeringItem.animalId,
      vaccineName: administeringItem.vaccineName,
      diseaseTarget: administeringItem.diseaseTarget,
      dateGiven: administeredDate,
      nextDueDate: nextDueDateStr,
      status: 'completed',
      batchNumber: adminBatch,
      administeredBy: adminBy,
      notes: `عمر ${administeringItem.ageMonths} ماہ پر لگائی گئی خوراک۔ اگلا بوسٹر: ${nextDueDateStr}`,
    };

    onAddVaccination(administeringItem.animalId, newVac);
    setAdministeringItem(null);
    showToast(
      language === 'en'
        ? `Marked ${administeringItem.vaccineName} as completed for ${administeringItem.animalName}!`
        : `${administeringItem.animalName} کے لیے ${administeringItem.vaccineName} کا حفاظتی ٹیکہ مکمل درج کر لیا گیا!`
    );
  };

  // Filter items for smart calculator
  const filteredCalculatedItems = useMemo(() => {
    return vaccinationSummary.items.filter((item) => {
      // Status filter
      if (statusFilter === 'overdue' && item.status !== 'overdue') return false;
      if (statusFilter === 'due_soon' && item.status !== 'due_soon' && item.status !== 'due_today') return false;
      if (statusFilter === 'upcoming' && item.status !== 'upcoming') return false;

      // Animal filter
      if (selectedAnimalFilter !== 'all' && item.animalId !== selectedAnimalFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.animalName.toLowerCase().includes(q);
        const matchesTag = item.tagId.toLowerCase().includes(q);
        const matchesVaccine = item.vaccineName.toLowerCase().includes(q);
        const matchesDisease = item.diseaseTarget.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesVaccine && !matchesDisease) return false;
      }

      return true;
    });
  }, [vaccinationSummary.items, statusFilter, selectedAnimalFilter, searchQuery]);

  // Collect all historical vaccines across all animals
  const allHistoricalVaccines = useMemo(() => {
    const list: { animalName: string; tagId: string; vac: Vaccination }[] = [];
    animals.forEach((a) => {
      a.vaccinationHistory.forEach((v) => {
        list.push({ animalName: a.name, tagId: a.tagId, vac: v });
      });
    });
    // Sort descending by date
    return list.sort((a, b) => {
      const dateA = a.vac.dateGiven || a.vac.scheduledDate || '';
      const dateB = b.vac.dateGiven || b.vac.scheduledDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [animals]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center space-x-2 rtl:space-x-reverse animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-700 to-green-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md mb-2">
              <Sparkles className="w-3.5 h-3.5 me-1 text-emerald-300" />
              <span>{language === 'en' ? 'Smart Age & History Vaccination Engine' : 'سمارٹ عمر و ہسٹری ویکسینیشن انجن'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center">
              <Syringe className="w-7 h-7 me-2.5 text-emerald-300" />
              <span>{t('vaccinationCenter', language)}</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50 mt-1 max-w-2xl leading-relaxed">
              {language === 'en'
                ? 'Automated calculation of livestock immunization due dates based on species, calfhood age milestones, and booster intervals.'
                : 'جانور دی عمر، پچھلی ہسٹری اور پیدائش کی تاریخ کے مطابق گل گھوٹو، منہ کھُر اور لمپی سکن کے واجب الادا شیڈول کا خودکار حساب۔'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                {language === 'en' ? 'Protection Rate' : 'حفاظتی شرح'}
              </span>
              <span className="text-2xl font-black text-white">
                {vaccinationSummary.protectionRatePercent}%
              </span>
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-300 h-full rounded-full transition-all"
                  style={{ width: `${vaccinationSummary.protectionRatePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Statistical Cards with Due Notifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Overdue Alert Card */}
        <div
          onClick={() => {
            setActiveSubTab('smart_calculator');
            setStatusFilter('overdue');
          }}
          className={`p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all ${
            vaccinationSummary.overdueCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 shadow-md shadow-rose-600/10 hover:border-rose-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {language === 'en' ? 'Overdue' : 'تاخیر شدہ ویکسین'}
            </span>
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2">
            {vaccinationSummary.overdueCount}
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-1 font-medium">
            {vaccinationSummary.overdueCount > 0 
              ? (language === 'en' ? 'Immediate dose required' : 'فوری ٹیکہ کاری درکار ہے') 
              : (language === 'en' ? 'No overdue vaccines' : 'کوئی تاخیر نہیں')}
          </p>
        </div>

        {/* Due Soon Card */}
        <div
          onClick={() => {
            setActiveSubTab('smart_calculator');
            setStatusFilter('due_soon');
          }}
          className={`p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all ${
            vaccinationSummary.dueSoonCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 shadow-md shadow-amber-600/10 hover:border-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              {language === 'en' ? 'Due in 30 Days' : 'عنقریب (30 دن)'}
            </span>
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-amber-800 dark:text-amber-300 mt-2">
            {vaccinationSummary.dueSoonCount + vaccinationSummary.dueTodayCount}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1 font-medium">
            {language === 'en' ? 'Due within this month' : 'اس ماہ حفاظتی ٹیکے کی تاریخ'}
          </p>
        </div>

        {/* Upcoming Schedule Card */}
        <div
          onClick={() => {
            setActiveSubTab('smart_calculator');
            setStatusFilter('upcoming');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {language === 'en' ? 'Upcoming' : 'آئندہ شیڈول'}
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {vaccinationSummary.upcomingCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {language === 'en' ? 'Scheduled beyond 30 days' : '30 دن کے بعد کے شیڈولز'}
          </p>
        </div>

        {/* Total Administered / Protected */}
        <div
          onClick={() => setActiveSubTab('history')}
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {language === 'en' ? 'Completed Logs' : 'مکمل ریکارڈز'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {allHistoricalVaccines.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {language === 'en' ? 'Total doses recorded on farm' : 'فارم پر لگائے گئے تمام ٹیکے'}
          </p>
        </div>

      </div>

      {/* Main Tab Navigation Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveSubTab('smart_calculator')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse transition-all shrink-0 ${
              activeSubTab === 'smart_calculator'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'en' ? 'Smart Due Dates Calculator' : 'سمارٹ واجب الادا ویکسین کیلکولیٹر'}</span>
            {vaccinationSummary.overdueCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono animate-pulse">
                {vaccinationSummary.overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('register_manual')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse transition-all shrink-0 ${
              activeSubTab === 'register_manual'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Manual Registration' : 'نئی ویکسین شیڈول کریں'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse transition-all shrink-0 ${
              activeSubTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>{language === 'en' ? 'Vaccination History' : 'تمام ریکارڈ ہسٹری'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {allHistoricalVaccines.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('protocols_guide')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 rtl:space-x-reverse transition-all shrink-0 ${
              activeSubTab === 'protocols_guide'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{language === 'en' ? 'Age & Protocols Guide' : 'عمر کے مطابق چارٹ و رہنمائی'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SMART DUE DATE CALCULATOR (CORE FEATURE) */}
      {activeSubTab === 'smart_calculator' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Status Filter Pills */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'en' ? 'All' : 'تمام'} ({vaccinationSummary.items.length})
              </button>

              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 rtl:space-x-reverse ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Overdue' : 'تاخیر شدہ'} ({vaccinationSummary.overdueCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('due_soon')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 rtl:space-x-reverse ${
                  statusFilter === 'due_soon'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Due Soon (30d)' : 'عنقریب 30 دن'} ({vaccinationSummary.dueSoonCount + vaccinationSummary.dueTodayCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}
              >
                {language === 'en' ? 'Upcoming' : 'آئندہ شیڈول'} ({vaccinationSummary.upcomingCount})
              </button>
            </div>

            {/* Animal Selector & Search */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="relative min-w-[160px]">
                <select
                  value={selectedAnimalFilter}
                  onChange={(e) => setSelectedAnimalFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                >
                  <option value="all">{language === 'en' ? 'All Animals' : 'تمام جانور (All Animals)'}</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tagId} - {a.ageMonths}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search vaccine or tag...' : 'ویکسین یا ٹیگ نمبر...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                />
              </div>
            </div>

          </div>

          {/* Overdue Banner if any */}
          {vaccinationSummary.overdueCount > 0 && statusFilter !== 'upcoming' && (
            <div className="p-4 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200 flex items-start justify-between gap-3 animate-fade-in">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-sm">
                    {language === 'en' 
                      ? `Urgent: ${vaccinationSummary.overdueCount} Vaccination(s) are Overdue!`
                      : `حفاظتی انتباہ: ${vaccinationSummary.overdueCount} حفاظتی ٹیکے تاخیر کا شکار ہیں!`}
                  </h4>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                    {language === 'en'
                      ? 'Protect your livestock from seasonal diseases by vaccinating the following animals promptly.'
                      : 'موسمی تبدیلی اور وائرل وباء سے بچاؤ کے لیے درج ذیل جانوروں کو فوری حفاظتی ٹیکے لگوائیں اور ریکارڈ اپڈیٹ کریں۔'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* List of Calculated Vaccination Due Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCalculatedItems.length > 0 ? (
              filteredCalculatedItems.map((item) => {
                const isOverdue = item.status === 'overdue';
                const isDueToday = item.status === 'due_today';
                const isDueSoon = item.status === 'due_soon';

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isOverdue
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-md shadow-rose-900/5'
                        : isDueToday || isDueSoon
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-md shadow-amber-900/5'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    {/* Card Top */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isOverdue
                                ? 'bg-rose-600 text-white'
                                : isDueToday || isDueSoon
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            <Syringe className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                {item.vaccineName}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {language === 'en' ? 'Target: ' : 'ہدف: '}{item.diseaseTarget}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isOverdue ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center space-x-1 rtl:space-x-reverse animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{Math.abs(item.daysRemaining)} {language === 'en' ? 'days overdue!' : 'دن تاخیر!'}</span>
                            </span>
                          ) : isDueToday ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white text-[10px] font-extrabold flex items-center">
                              {language === 'en' ? 'Due Today!' : 'آج کی تاریخ!'}
                            </span>
                          ) : isDueSoon ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 text-[10px] font-bold">
                              {item.daysRemaining} {language === 'en' ? 'days remaining' : 'دن باقی'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {item.daysRemaining} {language === 'en' ? 'days away' : 'دن بعد'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Animal Info Bar */}
                      <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.animalName}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                            {item.tagId}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {language === 'en' ? 'Age: ' : 'عمر: '}{item.ageMonths} {language === 'en' ? 'months' : 'ماہ'} ({item.species})
                        </span>
                      </div>

                      {/* Schedule Logic Note */}
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">{language === 'en' ? 'Due Date:' : 'حساب شدہ تاریخ (Due Date):'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {item.calculatedDueDate}
                          </span>
                        </div>

                        {item.lastGivenDate ? (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">{language === 'en' ? 'Past History:' : 'پچھلی خوراک (Past History):'}</span>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {item.lastGivenDate} ({language === 'en' ? `Every ${item.frequencyMonths}m` : `ہر ${item.frequencyMonths} ماہ بعد`})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">{language === 'en' ? 'Primary Dose:' : 'پہلی خوراک (Primary Calfhood):'}</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {language === 'en' ? `First at ${item.recommendedAgeMonths} months` : `عمر ${item.recommendedAgeMonths} ماہ پر پہلی بار`}
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5 p-2 rounded-xl leading-relaxed">
                          📌 {language === 'en' && item.notesUrdu ? item.vaccineName + ' protocol applied for livestock protection.' : item.notesUrdu}
                        </p>

                        {item.seasonAlertUrdu && (
                          <div className="flex items-center text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                            <Flame className="w-3.5 h-3.5 me-1 text-amber-600 shrink-0" />
                            <span>{language === 'en' ? 'Seasonal Risk Alert' : item.seasonAlertUrdu}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAdministeringItem(item);
                          setAdministeredDate('2026-08-18');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'en' ? 'Mark Administered' : 'ویکسین لگ گئی (Mark Done)'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAnimalId(item.animalId);
                          setVaccineName(item.vaccineName);
                          setScheduledDate(item.calculatedDueDate);
                          setActiveSubTab('register_manual');
                        }}
                        className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
                        title={language === 'en' ? 'Edit schedule' : 'شیڈول میں ترمیم کریں'}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  {language === 'en' ? 'All livestock vaccinations are up-to-date!' : 'تمام جانوروں کی ویکسینیشن مکمل اور اپ ٹو ڈیٹ ہے!'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {language === 'en' 
                    ? 'No overdue or due-soon vaccinations under the selected filter.' 
                    : 'منتخب کردہ فلٹر میں کوئی تاخیر شدہ یا عنقریب واجب الادا ویکسین موجود نہیں ہے۔'}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: MANUAL REGISTRATION FORM */}
      {activeSubTab === 'register_manual' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in max-w-3xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center">
              <Plus className="w-5 h-5 text-emerald-600 me-2" />
              <span>{language === 'en' ? 'Schedule / Record Vaccination' : 'نئی ویکسین کا اندراج یا شیڈول'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'en' 
                ? 'Enter completed or upcoming vaccination details administered by veterinary teams or clinics.'
                : 'ویٹرنری ٹیم کے آنے پر یا ہسپتال سے کروائی گئی ویکسین کا تفصیلی اندراج کریں۔'}
            </p>
          </div>

          <form onSubmit={handleRegisterVaccine} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Select Animal:' : 'جانور کا انتخاب کریں:'}
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tagId}) - {a.breed} ({a.ageMonths} {language === 'en' ? 'm' : 'ماہ'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Vaccine Type:' : 'حفاظتی ٹیکے کی قسم:'}
                </label>
                <select
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  {VACCINE_PROTOCOLS.map((p) => (
                    <option key={p.key} value={p.nameUrdu}>
                      {language === 'en' ? `${p.key.toUpperCase()} - ${p.nameUrdu}` : p.nameUrdu}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Scheduled / Given Date:' : 'مقررہ تاریخ (Scheduled Date):'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Vaccine Batch No:' : 'بیچ نمبر (Vaccine Batch No):'}
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. BATCH-2026-HS-88' : 'مثلاً: BATCH-2026-HS-88'}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Administered By (Doctor / Center):' : 'لگانے والا ڈاکٹر / ادارہ (Administered By):'}
                </label>
                <input
                  type="text"
                  value={adminVet}
                  onChange={(e) => setAdminVet(e.target.value)}
                  placeholder={language === 'en' ? 'Civil Veterinary Hospital / Private Vet Name' : 'سرکاری سول ویٹرنری ہسپتال یا پرائیویٹ ڈاکٹر کا نام'}
                  className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{language === 'en' ? 'Save Vaccination Schedule' : 'ویکسین شیڈول محفوظ کریں'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: COMPLETE VACCINATION HISTORY LOGS */}
      {activeSubTab === 'history' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {language === 'en' ? 'Farm Vaccination History Logs' : 'فارم کے تمام تاریخی ویکسین ریکارڈز (Vaccination History Log)'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'en' ? 'All administered doses and upcoming booster dates.' : 'تمام لگائے گئے حفاظتی ٹیکے اور اگلے بوسٹر کی تاریخیں۔'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {language === 'en' ? 'Total Logs: ' : 'کل ریکارڈز: '}{allHistoricalVaccines.length}
            </span>
          </div>

          <div className="space-y-3">
            {allHistoricalVaccines.length > 0 ? (
              allHistoricalVaccines.map(({ animalName, tagId, vac }, idx) => {
                const isCompleted = vac.status === 'completed';
                return (
                  <div
                    key={vac.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        <Syringe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <h4 className="font-black text-slate-800 dark:text-slate-100">
                            {vac.vaccineName}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {tagId} ({animalName})
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {language === 'en' ? 'Date: ' : 'لگانے کی تاریخ: '}{vac.dateGiven || vac.scheduledDate} • {language === 'en' ? 'Vet: ' : 'ڈاکٹر: '}{vac.administeredBy || 'N/A'} • {language === 'en' ? 'Batch: ' : 'بیچ: '}{vac.batchNumber || 'N/A'}
                        </p>
                        {vac.nextDueDate && (
                          <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                            {language === 'en' ? 'Next Booster: ' : 'اگلا بوسٹر: '}{vac.nextDueDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full font-extrabold text-[11px] self-start sm:self-center ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isCompleted 
                        ? (language === 'en' ? 'Administered' : 'مکمل شدہ') 
                        : (language === 'en' ? 'Scheduled' : 'شیڈول شدہ')}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                {language === 'en' ? 'No vaccination records found.' : 'کوئی ویکسین ریکارڈ موجود نہیں۔'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VETERINARY PROTOCOLS & AGE MILESTONES GUIDE */}
      {activeSubTab === 'protocols_guide' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center">
                <Info className="w-5 h-5 text-emerald-600 me-2" />
                <span>{language === 'en' ? 'Livestock Vaccination Protocols & Age Schedules' : 'پاکستان میں لائیو اسٹاک ویکسینیشن شیڈول اور عمر کے اصول'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'en' 
                  ? 'Official recommendations from Department of Livestock & Dairy Development:' 
                  : 'محکمہ لائیو اسٹاک و ڈیری ڈویلپمنٹ پنجاب و سندھ کے تصدیق شدہ پروٹوکولز:'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VACCINE_PROTOCOLS.map((protocol) => (
                <div
                  key={protocol.key}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {language === 'en' ? `${protocol.key.toUpperCase()} - ${protocol.nameUrdu}` : protocol.nameUrdu}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {protocol.targetSpecies.join(', ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">{language === 'en' ? 'First Dose Age:' : 'پہلی خوراک کی عمر:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {protocol.firstDoseAgeMonths} {language === 'en' ? 'months' : 'ماہ'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'en' ? 'Frequency / Booster:' : 'دہرائی (بوسٹر):'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {protocol.frequencyMonths === 999 
                          ? (language === 'en' ? 'Once in lifetime' : 'زندگی میں ایک بار') 
                          : (language === 'en' ? `Every ${protocol.frequencyMonths} months` : `ہر ${protocol.frequencyMonths} ماہ بعد`)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'en' ? 'Dosage & Route:' : 'مقدار و طریقہ:'}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {language === 'en' ? `${protocol.dosageUrdu} (${protocol.routeUrdu})` : protocol.dosageUrdu}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'en' ? 'Seasonal Alert:' : 'موسمی الرٹ:'}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {protocol.seasonAlertUrdu || (language === 'en' ? 'Annual' : 'سالانہ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl">
                    {protocol.descriptionUrdu}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADMINISTER MODAL POPUP */}
      {administeringItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {language === 'en' ? 'Record Vaccination Completion' : 'ویکسین کی تکمیل درج کریں (Mark Administered)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {administeringItem.animalName} ({administeringItem.tagId})
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmAdministered} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-extrabold text-sm">{administeringItem.vaccineName}</p>
                <p className="text-[11px]">
                  {language === 'en' 
                    ? `Dose: ${administeringItem.dosageUrdu} • Route: ${administeringItem.routeUrdu}` 
                    : `مقدار: ${administeringItem.dosageUrdu} • ${administeringItem.routeUrdu}`}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Administered Date:' : 'لگانے کی تاریخ (Administered Date):'}
                </label>
                <input
                  type="date"
                  value={administeredDate}
                  onChange={(e) => setAdministeredDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Batch Number:' : 'بیچ نمبر (Batch Number):'}
                </label>
                <input
                  type="text"
                  value={adminBatch}
                  onChange={(e) => setAdminBatch(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                  placeholder="BATCH-2026-AUG-99"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Veterinary Doctor Name:' : 'ویٹرنری ڈاکٹر کا نام:'}
                </label>
                <input
                  type="text"
                  value={adminBy}
                  onChange={(e) => setAdminBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-none"
                  placeholder={language === 'en' ? 'Dr. Tariq Mehmood' : 'ڈاکٹر طارق محمود'}
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdministeringItem(null)}
                  className="w-1/3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50"
                >
                  {language === 'en' ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20"
                >
                  {language === 'en' ? 'Save & Schedule Booster' : 'محفوظ کریں اور بوسٹر شیڈول کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
