import React, { useState } from 'react';
import { OutbreakReport, Language } from '../types';
import { t } from '../lib/translations';
import { initialOutbreaks } from '../lib/mockData';
import { ShieldAlert, AlertTriangle, Plus, CheckCircle2, MapPin } from 'lucide-react';

interface OutbreakShieldProps {
  language: Language;
}

export const OutbreakShield: React.FC<OutbreakShieldProps> = ({ language }) => {
  const isEn = language === 'en';
  const [outbreaks, setOutbreaks] = useState<OutbreakReport[]>(initialOutbreaks);
  const [showReportModal, setShowReportModal] = useState(false);
  const [diseaseName, setDiseaseName] = useState(isEn ? 'Lumpy Skin Disease (LSD)' : 'لمپی سکن (Lumpy Skin Disease)');
  const [affectedCount, setAffectedCount] = useState(3);
  const [precautionsText, setPrecautionsText] = useState(
    isEn
      ? 'Spray insecticide in shed, isolate affected cattle, and restrict farm visitors.'
      : 'باڑے میں مکھی مار سپرے کریں اور متاثرہ جانور الگ کریں۔'
  );

  const handleReportNewOutbreak = (e: React.FormEvent) => {
    e.preventDefault();
    const newOutbreak: OutbreakReport = {
      id: 'out_' + Date.now(),
      diseaseName,
      district: isEn ? 'Sahiwal' : 'ساہیوال',
      province: isEn ? 'Punjab' : 'پنجاب',
      affectedAnimalsCount: affectedCount,
      precautionsUrdu: precautionsText,
      precautionsEnglish: precautionsText,
      reportedAt: new Date().toLocaleDateString(),
      status: 'active',
    };
    setOutbreaks([newOutbreak, ...outbreaks]);
    setShowReportModal(false);
    alert(
      isEn
        ? 'Thank you! Disease outbreak report has been dispatched to local Veterinary Officer.'
        : 'شکریہ! بیماری کی رپورٹ مقامی ویٹرنری آفیسر کو ارسال کر دی گئی ہے۔'
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <ShieldAlert className="w-6 h-6 text-amber-600 me-2" />
            <span>{t('outbreakShield', language)}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? 'Real-time tracking and safety advisory for regional livestock disease outbreaks.'
              : 'علاقائی وبائی بیماریوں کی بروقت اطلاع اور تحفظ۔'}
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
        >
          <Plus className="w-4 h-4" />
          <span>{isEn ? 'Report Disease Outbreak' : 'بیماری کی رپورٹ کریں'}</span>
        </button>
      </div>

      {/* Outbreak List */}
      <div className="space-y-4">
        {outbreaks.map((outbreak) => (
          <div
            key={outbreak.id}
            className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                  {outbreak.diseaseName}
                </h3>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                {isEn ? `${outbreak.affectedAnimalsCount} Cases Reported` : `${outbreak.affectedAnimalsCount} کیسز متاثرہ`}
              </span>
            </div>

            <p className="text-xs text-amber-800 dark:text-amber-300">
              {isEn ? 'District:' : 'ضلع:'} <strong>{outbreak.district} ({outbreak.province})</strong> • {isEn ? 'Report Date:' : 'رپورٹ تاریخ:'} {outbreak.reportedAt}
            </p>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-200">
              <strong>{isEn ? 'Precautions:' : 'حفاظتی تدابیر:'}</strong> {isEn ? (outbreak.precautionsEnglish || outbreak.precautionsUrdu) : (outbreak.precautionsUrdu || outbreak.precautionsEnglish)}
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Report New Disease Outbreak' : 'نئی وبائی بیماری رپورٹ کریں'}
            </h3>

            <form onSubmit={handleReportNewOutbreak} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">{isEn ? 'Disease Name:' : 'بیماری کا نام:'}</label>
                <input
                  type="text"
                  required
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isEn ? 'Number of Affected Animals:' : 'متاثرہ جانوروں کی تعداد:'}</label>
                <input
                  type="number"
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{isEn ? 'Precautions / Advisory:' : 'حفاظتی مشورہ:'}</label>
                <textarea
                  value={precautionsText}
                  onChange={(e) => setPrecautionsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex space-x-2 rtl:space-x-reverse pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs"
                >
                  {isEn ? 'Submit Outbreak Report' : 'ارسال کریں'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs"
                >
                  {isEn ? 'Cancel' : 'منسوخ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
