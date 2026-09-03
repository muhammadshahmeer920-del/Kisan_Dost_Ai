import React from 'react';
import { User, Language, AIExecutionMode, AppFrontageMode } from '../types';
import { t } from '../lib/translations';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Globe, 
  Sun, 
  Moon, 
  Sparkles,
  Award,
  ArrowRight,
  ArrowLeft,
  Home,
  Store,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  user: User;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  executionMode: AIExecutionMode;
  onToggleExecutionMode: () => void;
  onTriggerSos: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  activeTab?: string;
  onGoBack?: () => void;
  frontageMode?: AppFrontageMode;
  onToggleFrontageMode?: (mode: AppFrontageMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  language,
  onLanguageChange,
  executionMode,
  onToggleExecutionMode,
  onTriggerSos,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  activeTab = 'overview',
  onGoBack,
  frontageMode = 'admin',
  onToggleFrontageMode
}) => {
  const isRtl = language === 'ur' || language === 'pb';
  const isEn = language === 'en';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors h-16 sm:h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Brand & Title + Return Back Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 rtl:space-x-reverse min-w-0 shrink">
          {activeTab !== 'overview' && onGoBack && (
            <button
              onClick={onGoBack}
              title={language === 'en' ? 'Return to Previous Page' : 'پچھلے صفحے یا ہوم ڈیش بورڈ پر واپس جائیں'}
              className="flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md active:scale-95 shrink-0"
            >
              {isRtl ? (
                <ArrowRight className="w-4 h-4 text-white" />
              ) : (
                <ArrowLeft className="w-4 h-4 text-white" />
              )}
              <span className="hidden sm:inline">
                {language === 'en' ? 'Back' : 'واپس'}
              </span>
            </button>
          )}

          <div 
            onClick={onGoBack}
            className="flex items-center space-x-1.5 sm:space-x-2.5 rtl:space-x-reverse cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 group-hover:bg-green-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200/60 dark:shadow-none shrink-0 transition-colors">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <h1 className="text-xs sm:text-base md:text-xl font-extrabold tracking-tight text-green-900 dark:text-green-300 truncate">
                  {t('appName', language)}
                </h1>
                {user.isPremium && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    <Award className="w-3 h-3 me-1 text-green-600" /> Premium
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {user.farmName} • {user.district}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Prominent Admin vs Customer Frontage Switcher */}
        {onToggleFrontageMode && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
            <button
              onClick={() => onToggleFrontageMode('admin')}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all ${
                frontageMode === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isEn ? 'Switch to Farm Owner Admin Portal' : 'فارم ایڈمن و سیل پرچیز پورٹل پر جائیں'}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isEn ? 'Admin' : 'ایڈمن'}</span>
            </button>

            <button
              onClick={() => onToggleFrontageMode('customer')}
              className={`flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition-all ${
                frontageMode === 'customer'
                  ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isEn ? 'Switch to Customer Marketplace & Dairy Shop' : 'کسٹمر بازار و ڈیری شاپ فرنٹ پیج پر جائیں'}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{isEn ? 'Customer' : 'کسٹمر شاپ'}</span>
            </button>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2.5 rtl:space-x-reverse shrink-0">
          
          {/* Direct Return Home Button (If deep inside a feature) */}
          {activeTab !== 'overview' && onGoBack && (
            <button
              onClick={onGoBack}
              className="p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all sm:hidden"
              title={language === 'en' ? 'Return to Dashboard' : 'واپس ہوم ڈیش بورڈ'}
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          {/* Online / Offline AI Hybrid Indicator */}
          <button
            onClick={onToggleExecutionMode}
            title={language === 'en' ? 'Toggle AI & Network Mode' : 'انٹرنیٹ اور AI موڈ تبدیل کریں'}
            className={`flex items-center px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all ${
              executionMode === 'online'
                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/80 dark:text-green-300 dark:border-green-800'
                : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {executionMode === 'online' ? (
              <>
                <span className="relative flex h-2 w-2 me-1 sm:me-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 sm:me-1" />
                <span className="hidden md:inline">{t('onlineMode', language)}</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 me-1 sm:me-1.5"></span>
                <WifiOff className="w-3.5 h-3.5 sm:me-1" />
                <span className="hidden md:inline">{t('offlineMode', language)}</span>
              </>
            )}
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onTriggerSos}
            className="flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-0.5 sm:me-1 animate-bounce" />
            <span>SOS</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="appearance-none cursor-pointer flex items-center px-2 sm:px-3 py-1.5 pe-5 sm:pe-7 rounded-xl text-[11px] sm:text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 outline-none transition-all"
            >
              <option value="ur">اردو</option>
              <option value="en">English</option>
              <option value="pb">پنجابی</option>
            </select>
            <Globe className="w-3 h-3 text-slate-400 absolute end-1.5 sm:end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Dark Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center space-x-1.5 rtl:space-x-reverse p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 hover:bg-amber-900/60' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={language === 'en' ? 'Toggle Dark/Light Mode' : (darkMode ? "روشن تھیم پر سوئچ کریں" : "تاریک تھیم پر سوئچ کریں")}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-extrabold hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* User Profile / Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 rtl:space-x-reverse p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
              {user.name ? user.name[0] : 'U'}
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};

