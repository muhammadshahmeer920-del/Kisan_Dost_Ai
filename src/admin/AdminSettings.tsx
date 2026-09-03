import React, { useState } from 'react';
import { AdminSystemSettings, Language } from '../types';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  Cpu, 
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { saveStoredSystemSettings, logAdminAction, resetSystemToFactoryDefaults } from '../lib/storage';

interface AdminSettingsProps {
  settings: AdminSystemSettings;
  language: Language;
  onRefreshSettings: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  language,
  onRefreshSettings
}) => {
  const isEn = language === 'en';

  const [formData, setFormData] = useState<AdminSystemSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSystemSettings(formData);
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'Lead DevOps Admin',
      action: 'Updated Core System Configuration',
      targetEntity: 'AdminSystemSettings',
      targetId: 'GLOBAL_SETTINGS',
      newValue: JSON.stringify(formData)
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefreshSettings();
  };

  const handleFactoryReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    resetSystemToFactoryDefaults();
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'Lead DevOps Admin',
      action: 'FACTORY_RESET_ALL_RECORDS',
      targetEntity: 'UnifiedDatabase',
      targetId: 'ALL'
    });

    setResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>{isEn ? 'System Engine & AI Parameters' : 'سسٹم ترتیبات و پیرامیٹرز'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {isEn ? 'Platform & Infrastructure Settings' : 'مرکزی پلیٹ فارم ترتیبات'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isEn 
            ? 'Configure maintenance windows, farmer registration gates, default roles, and Gemini AI execution models.' 
            : 'سسٹم مینٹیننس، رجسٹریشن کنٹرول، اور اے آئی ماڈل کے پیرامیٹرز سیٹ کریں۔'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core System Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'System Access & Maintenance' : 'سسٹم رسائی و مینٹیننس'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {isEn ? 'Maintenance Mode' : 'مینٹیننس موڈ'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Temporarily lock user interface for routine maintenance' : 'عارضی طور پر سسٹم لاک کریں'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={e => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {isEn ? 'Allow New Registrations' : 'نئے کسانوں کی رجسٹریشن کھلی رکھیں'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Accept new farmer onboarding requests' : 'نئے اکاؤنٹس کی اجازت'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.allowUserRegistration}
                onChange={e => setFormData({ ...formData, allowUserRegistration: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* AI Model Parameters */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>{isEn ? 'Gemini AI Inferences Engine' : 'اے آئی ماڈل کنفیگریشن'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Active Gemini Model' : 'ایکٹو ماڈل'}
              </label>
              <select
                value={formData.activeAIModel}
                onChange={e => setFormData({ ...formData, activeAIModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-Fast Vision & Chat)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Clinical Reasoning)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Default Execution Mode' : 'پہلے سے طے شدہ آپریشن'}
              </label>
              <select
                value={formData.defaultExecutionMode}
                onChange={e => setFormData({ ...formData, defaultExecutionMode: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="cloud">Cloud-Connected AI (Official Gemini SDK)</option>
                <option value="offline">Offline Rule-Based Diagnostic Simulator</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions & Save */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleFactoryReset}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              resetConfirm
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            {resetConfirm 
              ? (isEn ? 'Click again to confirm factory reset!' : 'تصدیق کے لیے دوبارہ کلک کریں!') 
              : (isEn ? 'Reset All Data to Demo Defaults' : 'تمام ڈیٹا کو ڈیمو حالت پر ری سیٹ کریں')}
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isEn ? 'Save System Configuration' : 'ترتیبات محفوظ کریں'}</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEn ? 'System configuration saved and synced across cluster!' : 'سسٹم ترتیبات کامیابی سے محفوظ ہوگئیں!'}</span>
          </div>
        )}

      </form>

    </div>
  );
};
