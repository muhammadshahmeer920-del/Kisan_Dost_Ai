import React, { useState, useEffect } from 'react';
import { 
  User, 
  Animal, 
  Language, 
  UnifiedRecord, 
  UserApplication, 
  AdminNotification, 
  SupportMessageThread,
  UserNavRoute
} from '../types';
import { 
  Sparkles, 
  Activity, 
  Scan, 
  Wheat, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  Calendar,
  AlertCircle,
  Stethoscope,
  Store,
  ChevronRight,
  Droplets,
  DollarSign,
  HeartPulse,
  Award,
  Layers,
  ArrowUpRight,
  Plus
} from 'lucide-react';

interface UserDashboardProps {
  user: User;
  animals?: Animal[];
  records?: UnifiedRecord[];
  applications?: UserApplication[];
  notifications?: AdminNotification[];
  messageThread?: SupportMessageThread;
  language: Language;
  onNavigateUser: (route: UserNavRoute, extraTab?: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  animals = [],
  records = [],
  applications = [],
  notifications = [],
  messageThread,
  language,
  onNavigateUser
}) => {
  const isEn = language === 'en';

  // Expandable Search State Sync
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const handleSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setSearchQuery(customEvent.detail);
      }
    };
    window.addEventListener('dashboard_search', handleSearch);
    return () => window.removeEventListener('dashboard_search', handleSearch);
  }, []);

  const pendingApps = (applications || []).filter(a => a.status === 'pending' || a.status === 'under_review');
  const activeAnimals = animals || [];
  
  const filteredAnimals = activeAnimals.filter((animal) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (animal.name && animal.name.toLowerCase().includes(q)) ||
      (animal.tagId && animal.tagId.toLowerCase().includes(q)) ||
      (animal.breed && animal.breed.toLowerCase().includes(q))
    );
  });
  const totalMarketValPKR = activeAnimals.reduce((acc, a) => acc + (a.currentMarketValue || a.purchasePrice || 0), 0);
  const totalMilkToday = activeAnimals.reduce((acc, a) => acc + (a.milkYieldLitersPerDay || 0), 0);
  const lactatingAnimals = activeAnimals.filter(a => (a.milkYieldLitersPerDay || 0) > 0);
  const healthyCount = activeAnimals.filter(a => a.healthStatus !== 'sick' && a.healthStatus !== 'critical').length;
  const healthRate = activeAnimals.length > 0 ? Math.round((healthyCount / activeAnimals.length) * 100) : 100;
  const lactationRate = activeAnimals.length > 0 ? Math.round((lactatingAnimals.length / activeAnimals.length) * 100) : 65;

  const spotlightAnimal = activeAnimals[0] || ({
    id: 'PK-LIV-01',
    name: 'Sahiwal Queen',
    tagId: 'SAH-901',
    breed: 'Sahiwal Pure',
    species: 'cow',
    healthStatus: 'excellent',
    milkYieldLitersPerDay: 22
  } as unknown as Animal);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Kisan Smart Farm Hub' : 'کسان سمارٹ فارم ہب'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEn ? 'Farm Dashboard' : 'ڈیش بورڈ'}
          </h1>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <button
            onClick={() => onNavigateUser('services', 'scanner')}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Scan className="w-4 h-4" />
            <span>{isEn ? 'AI Health Scan' : 'اے آئی سکین'}</span>
          </button>

          <button
            onClick={() => onNavigateUser('services', 'animals')}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'Add Cattle' : 'جانور کا اندراج'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid inspired by the reference screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Span 7 on LG): Next Game / Milestone & Standings / Herd Table */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Next Milestone / Health Spotlight Card */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn ? 'Next Scheduled Checkup' : 'اگلا معائنہ و ویکسین'}
              </span>
              <button 
                onClick={() => onNavigateUser('services', 'vaccination')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 rtl:space-x-reverse"
              >
                <span>{isEn ? 'View Calendar' : 'کیلنڈر دیکھیں'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Sub-label & Schedule Time */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-400 dark:text-slate-500 mb-6">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {isEn ? 'FMD & HS Bi-Annual Booster' : 'منہ کھر اور گل گھوٹو ویکسین'}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-500">11:00 AM, 28 Aug 2026</span>
            </div>

            {/* Spotlight Matchup / Cattle Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/70 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/50 dark:border-slate-700/50 gap-3">
              <div className="flex items-center space-x-3.5 rtl:space-x-reverse">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-base flex items-center justify-center shadow-inner shrink-0">
                  🐮
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {spotlightAnimal.name || 'Sahiwal Cow #1'}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono block truncate">
                    {spotlightAnimal.tagId} • {spotlightAnimal.breed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/40 dark:border-slate-700/40">
                {/* Center VS / Badge */}
                <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black shrink-0">
                  {isEn ? 'Priority' : 'اہم'}
                </div>

                <div className="text-end shrink-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-400 block">
                    {isEn ? 'Expected Yield' : 'متوقع پیداوار'}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {spotlightAnimal.milkYieldLitersPerDay || 18} <span className="text-xs font-normal text-slate-400">L/d</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Standings / Herd Roster Table */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isEn ? 'Livestock Herd Standings' : 'فارم جانوروں کی فہرست و درجہ بندی'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn ? 'Ranked by daily yield and health scores' : 'پیداوار اور صحت کی بنیاد پر فہرست'}
                </p>
              </div>
              <button 
                onClick={() => onNavigateUser('services', 'animals')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 rtl:space-x-reverse"
              >
                <span>{isEn ? 'View all' : 'تمام دیکھیں'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Clean Table matching reference aesthetic */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold">
                    <th className="pb-3 text-start ps-2 w-8">#</th>
                    <th className="pb-3 text-start">{isEn ? 'Animal Tag' : 'جانور'}</th>
                    <th className="pb-3 text-center">{isEn ? 'Yield' : 'پیداوار'}</th>
                    <th className="pb-3 text-center">{isEn ? 'Health' : 'صحت'}</th>
                    <th className="pb-3 text-end pe-2">{isEn ? 'Status' : 'سٹیٹس'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                  {filteredAnimals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-medium">
                        {isEn ? `No animals match "${searchQuery}"` : `کوئی جانور "${searchQuery}" سے مطابقت نہیں رکھتا`}
                      </td>
                    </tr>
                  ) : (
                    filteredAnimals.slice(0, 10).map((animal, idx) => (
                      <tr 
                        key={animal.id}
                        onClick={() => onNavigateUser('services', 'animals')}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 ps-2 font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              {animal.species === 'cow' ? '🐄' : animal.species === 'buffalo' ? '🐃' : '🐐'}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                                {animal.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {animal.tagId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {animal.milkYieldLitersPerDay ? `${animal.milkYieldLitersPerDay} L` : '—'}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {animal.healthStatus !== 'sick' && animal.healthStatus !== 'critical' ? '98%' : '75%'}
                          </span>
                        </td>
                        <td className="py-3.5 text-end pe-2">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            animal.healthStatus !== 'sick' && animal.healthStatus !== 'critical'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {animal.healthStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Right Column (Span 5 on LG): Statistics + 4 Stat Cards + Action Banner */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Performance & Health Statistics with Progress Segment */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn ? 'Farm Statistics' : 'فارم پیداواری گراف'}
              </span>
              <button 
                onClick={() => onNavigateUser('records')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 rtl:space-x-reverse"
              >
                <span>{isEn ? 'View all statistics' : 'مکمل رپورٹ'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Segmented Progress Bar matching reference design */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1 mb-6">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${healthRate}%` }} title="Healthy" />
              <div className="h-full bg-teal-400 rounded-full" style={{ width: `${lactationRate}%` }} title="Lactating" />
              <div className="h-full bg-rose-400 rounded-full" style={{ width: `${100 - healthRate}%` }} title="Under Observation" />
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">PL</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{activeAnimals.length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{isEn ? 'HEALTHY' : 'صحت مند'}</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{healthyCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{isEn ? 'IN-MILK' : 'دودھ'}</span>
                <span className="text-base font-black text-teal-600 dark:text-teal-400">{lactatingAnimals.length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{isEn ? 'ALERTS' : 'الرٹس'}</span>
                <span className="text-base font-black text-slate-400">{activeAnimals.length - healthyCount}</span>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards in 2x2 Grid (Pastel Icons & Clear Typographic Contrast) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Stat 1: Efficiency / Possession */}
            <div 
              onClick={() => onNavigateUser('services', 'nutrition')}
              className="glass-card glass-card-hover rounded-3xl p-5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Lactation Index' : 'پیداواری شرح'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {lactationRate}%
              </div>
            </div>

            {/* Stat 2: Overall Asset Value */}
            <div 
              onClick={() => onNavigateUser('records')}
              className="glass-card glass-card-hover rounded-3xl p-5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-300 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Livestock Value' : 'کل جانور مالیت'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                PKR {(totalMarketValPKR / 1000000).toFixed(1)}M
              </div>
            </div>

            {/* Stat 3: Daily Milk Yield */}
            <div 
              onClick={() => onNavigateUser('services', 'dairystore')}
              className="glass-card glass-card-hover rounded-3xl p-5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-3">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Daily Milk Yield' : 'روزانہ دودھ'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {totalMilkToday.toFixed(0)} <span className="text-xs font-normal text-slate-400">Liters</span>
              </div>
            </div>

            {/* Stat 4: Average Herd Score */}
            <div 
              onClick={() => onNavigateUser('services', 'scanner')}
              className="glass-card glass-card-hover rounded-3xl p-5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-300 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isEn ? 'Health Score' : 'صحت کا اسکور'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {(healthRate / 10).toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span>
              </div>
            </div>

          </div>

          {/* Action Spotlight Banner Card matching reference bottom right container */}
          <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20">
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                {isEn ? "DON'T FORGET" : 'یاد دہانی'}
              </span>
              <h4 className="text-lg font-black text-white leading-tight">
                {isEn ? 'Setup AI diagnostic & ration for next week' : 'اگلے ہفتے کے لیے اے آئی معائنہ و خوراک پلان مکمل کریں'}
              </h4>
              <button
                onClick={() => onNavigateUser('services', 'nutrition')}
                className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all inline-flex items-center space-x-1.5 rtl:space-x-reverse"
              >
                <span>{isEn ? 'Go to Training & Ration Center' : 'راشن کیلکولیٹر کھولیں'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Decorative background shape */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>

        </div>

      </div>

    </div>
  );
};

