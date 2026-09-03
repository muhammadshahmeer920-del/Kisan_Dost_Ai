import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../lib/translations';
import { Sparkles, Grid, Scan, Mic, Syringe, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  language: Language;
}

export const OnboardingModal: React.FC<OnboardingProps> = ({ isOpen, onComplete, language }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: t('onboardingStep1Title', language),
      desc: t('onboardingStep1Desc', language),
      icon: Grid,
      color: 'from-emerald-500 to-green-600',
      tips: [
        'ہر گائے، بھینس یا بکری کا منفرد ٹیگ نمبر رکھیں',
        'وزن اور دودھ کی پیداوار کا ہسٹری گراف دیکھیں',
        'ڈیجیٹل ملکیت سرٹیفکیٹ ڈاؤن لوڈ کریں'
      ]
    },
    {
      title: t('onboardingStep2Title', language),
      desc: t('onboardingStep2Desc', language),
      icon: Scan,
      color: 'from-blue-500 to-indigo-600',
      tips: [
        'جانور کی متاثرہ جلد یا آنکھ کی تصویر بنائیں',
        'AI سمارٹ ماڈل سیکنڈوں میں بیماری پہچانے گا',
        'فوری طور پر روزانہ کا AI ریکوری پلان حاصل کریں'
      ]
    },
    {
      title: t('onboardingStep3Title', language),
      desc: t('onboardingStep3Desc', language),
      icon: Mic,
      color: 'from-amber-500 to-orange-600',
      tips: [
        'صرف مائیک کا بٹن دبا کر اردو یا پنجابی میں بولیں',
        '24 گھنٹے کسی بھی بیماری یا خوراک کے بارے میں پوچھیں',
        'ہنگامی صورتحال میں فوری انتباہ اور ڈاکٹر رابطہ'
      ]
    },
    {
      title: t('onboardingStep4Title', language),
      desc: t('onboardingStep4Desc', language),
      icon: Syringe,
      color: 'from-purple-500 to-pink-600',
      tips: [
        'منہ کھُر، لمپی سکن اور گل گھوٹو کی ویکسین کے الرٹ',
        'فارم کے چارے اور ادویات کا روزانہ خرچہ ریکارڈ کریں',
        'فارم کی کل مالیاتی قدر اور منافع دیکھیں'
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Step Indicator Top Header */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm">
              {currentStep + 1}
            </div>
            <span className="text-xs font-semibold text-slate-400">
              مرحلہ {currentStep + 1} از {steps.length}
            </span>
          </div>
          <button
            onClick={onComplete}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            اسکپ کریں (Skip)
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="text-center py-4">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${steps[currentStep].color} text-white flex items-center justify-center shadow-lg mb-6 transform transition-transform hover:scale-105`}>
            <StepIcon className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {steps[currentStep].desc}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-start space-y-2 mb-6 border border-slate-200/60 dark:border-slate-700">
            {steps[currentStep].tips.map((tip, idx) => (
              <div key={idx} className="flex items-start space-x-2 rtl:space-x-reverse text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className={`flex items-center px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowRight className="w-4 h-4 me-1 rtl:rotate-180" />
            <span>پچھلا</span>
          </button>

          {/* Dots */}
          <div className="flex space-x-1.5 rtl:space-x-reverse">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <span>{currentStep === steps.length - 1 ? t('startFarmBtn', language) : 'اگلا'}</span>
            <ArrowLeft className="w-4 h-4 ms-1 rtl:rotate-180" />
          </button>
        </div>

      </div>
    </div>
  );
};
