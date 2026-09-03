import React from 'react';
import { User, Language } from '../types';
import { t } from '../lib/translations';
import { Settings, User as UserIcon, Globe, Moon, Sun, Trash2, LogOut, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Settings className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('settings', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          کسان پروفائل، زبان، ڈارک موڈ اور ڈیٹا سیٹنگز۔
        </p>
      </div>

      {/* User Info Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <UserIcon className="w-4 h-4 text-emerald-600 me-2" />
          <span>کسان پروفائل معلومات</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">کسان نام:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">فارم نام:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user.farmName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">موبائل نمبر:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user.phone}</span>
          </div>
          <div>
            <span className="text-slate-400 block">مقام / ضلع:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user.location}</span>
          </div>
        </div>
      </div>

      {/* Preferences Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Globe className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">زبان کی تبدیلی (Language)</h4>
              <p className="text-[11px] text-slate-400">اپنی پسندیدہ زبان کا انتخاب کریں</p>
            </div>
          </div>

          <div className="flex space-x-1 rtl:space-x-reverse">
            {[
              { code: 'ur', name: 'اردو' },
              { code: 'en', name: 'English' },
              { code: 'pb', name: 'پنجابی' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code as Language)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === lang.code
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('darkMode', language)}</h4>
              <p className="text-[11px] text-slate-400">رات کے وقت آنکھوں کی حفاظت کے لیے ڈارک تھیم</p>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              darkMode ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                darkMode ? 'start-6' : 'start-0.5'
              }`}
            />
          </button>
        </div>

        {/* Clear Data & Logout */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLogout}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            <LogOut className="w-4 h-4" />
            <span>اکاؤنٹ سے لاگ آؤٹ کریں</span>
          </button>
        </div>

      </div>

    </div>
  );
};
