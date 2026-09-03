import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../lib/translations';
import { BookOpen, Download, Search, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

interface OfflineKnowledgePackProps {
  language: Language;
}

export const OfflineKnowledgePack: React.FC<OfflineKnowledgePackProps> = ({ language }) => {
  const [downloaded, setDownloaded] = useState(true);

  const guides = [
    {
      title: 'لمپی سکن اور منہ کھُر کی مکمل احتیاطی تدابیر',
      category: 'وبائی بیماریاں',
      size: '1.2 MB',
      summaryUrdu: 'بیماری پھیلنے سے پہلے باڑے کی صفائی، ڈس انفیکشن سپرے اور قرنطینہ کی مکمل رہنمائی۔',
    },
    {
      title: 'گرمیاں و ہیٹ سٹریس (Heat Stress) سے مویشیوں کا بچاؤ',
      category: 'موسمی دیکھ بھال',
      size: '850 KB',
      summaryUrdu: 'پنکھوں کا استعمال، تازہ ٹھنڈا پانی اور الیکٹرولائٹس کھلانے کی ہدایت۔',
    },
    {
      title: 'دیسی ونڈا اور سائلیج بنانے کا طریقہ',
      category: 'تغذیہ و خوراک',
      size: '2.4 MB',
      summaryUrdu: 'مکئی سائلج اور برسیم کو محفوظ کرنے کی مکمل ویڈیو و تحریری ہدایت۔',
    },
    {
      title: 'حاملہ گائے اور بھینس کی نگہداشت اور زچگی ہدایت',
      category: 'نسل کشی و زچگی',
      size: '1.8 MB',
      summaryUrdu: 'بچے کی پیدائش کے وقت کی تیاریاں اور نوزائیدہ کٹڑے/بچھڑے کی پہلی خوراک (بولی)۔',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <BookOpen className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('offlineKnowledge', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          بغیر انٹرنیٹ (Offline) بھی بیماریوں، ادویات اور دیسی علاج دی مکمل گائیڈز دستیاب ہیں۔
        </p>
      </div>

      {/* Offline Storage Status Banner */}
      <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              آف لائن نالج پیک (Offline Sync Complete)
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              تمام 12 کتب اور فرسٹ ایڈ رہنما خطوط آپ کے ڈیوائس میموری میں محفوظ ہو چکے ہیں۔
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('آف لائن نالج پیک ری فریش ہو گیا ہے۔')}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
        >
          دوبارہ سنک کریں
        </button>
      </div>

      {/* Guides List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guides.map((g, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {g.category}
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{g.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{g.summaryUrdu}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px]">سائز: {g.size}</span>
              <span className="text-emerald-600 font-bold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 me-1" /> آف لائن دستیاب
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
