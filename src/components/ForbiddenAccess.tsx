import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { Language } from '../types';

interface ForbiddenAccessProps {
  language: Language;
  onReturnToUser: () => void;
  onSwitchToAdminLogin: () => void;
}

export const ForbiddenAccess: React.FC<ForbiddenAccessProps> = ({
  language,
  onReturnToUser,
  onSwitchToAdminLogin
}) => {
  const isEn = language === 'en';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>HTTP 403 — Unauthorized Access</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
          {isEn ? 'Admin Access Restricted' : 'ایڈمن کنٹرول پینل تک رسائی ممنوع ہے'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {isEn 
            ? 'Your current user account does not have Administrator permissions to access system governance tools and central database records.'
            : 'آپ کے موجودہ نارمل کسان اکاؤنٹ کو مرکزی ایڈمنسٹریشن پینل تک رسائی کی اجازت نہیں ہے۔ برائے مہربانی اپنے کسان ڈیش بورڈ پر واپس جائیں یا ایڈمن لاگ ان کریں۔'}
        </p>

        <div className="space-y-3">
          <button
            onClick={onReturnToUser}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isEn ? 'Return to User Dashboard' : 'اپنے کسان ڈیش بورڈ پر واپس جائیں'}</span>
          </button>

          <button
            onClick={onSwitchToAdminLogin}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'Sign in with Admin Credentials' : 'ایڈمنسٹریٹر اکاؤنٹ سے لاگ ان کریں'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
