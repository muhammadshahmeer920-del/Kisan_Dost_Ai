import React from 'react';
import { User, Animal, Language } from '../types';
import { t } from '../lib/translations';
import { Award, QrCode, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DigitalLicenseCardProps {
  user: User;
  animals: Animal[];
  language: Language;
}

export const DigitalLicenseCard: React.FC<DigitalLicenseCardProps> = ({ user, animals, language }) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Award className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('digitalLicense', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          حکومت پاکستان اور لائیو سٹاک ڈیپارٹمنٹ سے تصدیق شدہ ڈیجیٹل فارم و مویشی ملکیت سرٹیفکیٹ۔
        </p>
      </div>

      {/* Main Digital Card Visual */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white shadow-2xl relative overflow-hidden border border-emerald-600/30">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-emerald-300">
              KD
            </div>
            <div>
              <h3 className="text-lg font-bold">کسان دوست AI - قومی لائیو سٹاک کارڈ</h3>
              <p className="text-xs text-emerald-200">حکومتِ پنجاب لائیو سٹاک اینڈ ڈیری ڈیولپمنٹ</p>
            </div>
          </div>

          <QrCode className="w-14 h-14 text-emerald-300 opacity-90 shrink-0" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-6">
          <div>
            <span className="text-emerald-300/70 block text-[10px]">مالک / کسان:</span>
            <span className="font-bold text-sm">{user.name}</span>
          </div>
          <div>
            <span className="text-emerald-300/70 block text-[10px]">فارم نام:</span>
            <span className="font-bold text-sm">{user.farmName}</span>
          </div>
          <div>
            <span className="text-emerald-300/70 block text-[10px]">ضلع و مقام:</span>
            <span className="font-bold text-sm">{user.location}</span>
          </div>
          <div>
            <span className="text-emerald-300/70 block text-[10px]">رجسٹرڈ مویشی:</span>
            <span className="font-bold text-sm">{animals.length} راس</span>
          </div>
          <div>
            <span className="text-emerald-300/70 block text-[10px]">لائسنس سٹیٹس:</span>
            <span className="font-bold text-emerald-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 me-1" /> تصدیق شدہ (Active)
            </span>
          </div>
          <div>
            <span className="text-emerald-300/70 block text-[10px]">تکافل/انشورنس:</span>
            <span className="font-bold text-emerald-400">پاک تکافل کورڈ</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-200 text-[10px]">کارڈ آئی ڈی: PK-LIVESTOCK-8842-2026</span>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 shadow-md transition-all flex items-center space-x-1 rtl:space-x-reverse"
          >
            <Download className="w-4 h-4" />
            <span>پرنٹ / ڈاؤن لوڈ کارڈ</span>
          </button>
        </div>
      </div>

    </div>
  );
};
