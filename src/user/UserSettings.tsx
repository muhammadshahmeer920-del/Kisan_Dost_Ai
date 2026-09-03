import React from 'react';
import { User, Language, AIExecutionMode } from '../types';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  Bell, 
  ShieldCheck, 
  LogOut,
  Smartphone
} from 'lucide-react';

interface UserSettingsProps {
  user: User;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  executionMode: AIExecutionMode;
  onToggleExecutionMode: () => void;
  onLogout: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({
  user,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  executionMode,
  onToggleExecutionMode,
  onLogout
}) => {
  const isEn = language === 'en';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isEn ? 'Preferences & Account Settings' : 'ایپ ترتیبات و صارف ترجیحات'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Manage language, display themes, and AI diagnostic preferences' : 'زبان، نائٹ موڈ، اور اے آئی رفتار کی ترتیبات'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Options Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        
        {/* Language Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isEn ? 'Interface Language' : 'ایپ کی زبان منتخب کریں'}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Select Urdu, English, or Punjabi' : 'اردو، انگریزی، یا پنجابی'}
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onLanguageChange('ur')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'ur' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('pb')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'pb' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              پنجابی
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isEn ? 'Night / Dark Theme' : 'ڈارک تھیم (نائٹ موڈ)'}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Optimized for night-time barn inspections' : 'رات کے وقت فارم معائنے کے لیے آرام دہ'}
            </p>
          </div>

          <button
            onClick={onToggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              darkMode ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* AI Offline / Online Engine */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {executionMode === 'online' ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isEn ? 'AI Processing Engine' : 'اے آئی پراسیسنگ موڈ'}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {executionMode === 'online' 
                ? (isEn ? 'High-accuracy Cloud Gemini 2.5 Flash' : 'کلاؤڈ جیمنائی 2.5 (اعلیٰ ترین درستگی)')
                : (isEn ? 'Offline On-Device Rules (No Internet needed)' : 'آف لائن فارم رولز (بغیر انٹرنیٹ)')}
            </p>
          </div>

          <button
            onClick={onToggleExecutionMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              executionMode === 'online' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {executionMode === 'online' ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Sign Out Option */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-xs transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{isEn ? 'Log Out of Account' : 'اکاؤنٹ سے لاگ آؤٹ کریں'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
