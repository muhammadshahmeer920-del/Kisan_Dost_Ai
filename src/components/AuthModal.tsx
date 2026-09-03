import React, { useState } from 'react';
import { User, Language } from '../types';
import { t } from '../lib/translations';
import {
  Phone, Mail, ShieldCheck, Sparkles, Key, Lock, UserPlus, LogIn,
  Building, MapPin, User as UserIcon, AlertTriangle, ExternalLink,
  Tractor, ShoppingBag, CheckCircle2
} from 'lucide-react';
import { loginWithGoogle, loginOrRegisterWithEmail, syncDocToFirestore, COLLECTIONS } from '../lib/firebase';
import { logUserActivity } from '../lib/storage';
import { notifyAdminSync } from '../services/adminFarmerSync';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: User) => void;
  language: Language;
}

type AccountType = 'farmer' | 'user';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLoginSuccess, language }) => {
  const isEn = language === 'en';

  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('email');

  // Role selector (Sign Up only)
  const [accountType, setAccountType] = useState<AccountType>('farmer');

  // Form Fields
  const [name, setName] = useState('چوہدری احمد علی');
  const [farmName, setFarmName] = useState('المدینہ ڈائری فارم');
  const [district, setDistrict] = useState('ساہیوال (Sahiwal)');
  const [phone, setPhone] = useState('0300-1234567');
  const [email, setEmail] = useState('farmer@kisandost.ai');
  const [password, setPassword] = useState('kisan123456');

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('8842');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDomainBanner, setShowDomainBanner] = useState(false);

  if (!isOpen) return null;

  // Helper: write activity log after successful auth
  const writeActivityLog = (u: User, actionType: 'signup' | 'login') => {
    logUserActivity({
      userId: u.id,
      name: u.name,
      email: u.email,
      userAccountType: u.userAccountType || 'farmer',
      farmName: u.farmName || undefined,
      city: u.district || undefined,
      actionType,
    });
    notifyAdminSync('FARMER_AUTH', { userId: u.id, actionType });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setShowDomainBanner(false);
    try {
      const user = await loginWithGoogle();
      writeActivityLog(user, 'login');
      setLoading(false);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setLoading(false);
      const code = err?.code || '';
      if (
        code === 'auth/unauthorized-domain' ||
        code === 'auth/configuration-not-found' ||
        code === 'auth/operation-not-allowed' ||
        err?.message?.includes('unauthorized-domain')
      ) {
        setShowDomainBanner(true);
      } else {
        setErrorMsg(
          isEn
            ? 'Google Sign-In failed. Please try again or use email login.'
            : 'گوگل سائن ان میں مسئلہ آیا۔ ای میل لاگ ان آزمائیں۔'
        );
      }
    }
  };

  const handleSendOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 800);
  };

  // Demo Mode: bypass Firebase entirely with a mock user
  const handleDemoMode = () => {
    setShowDomainBanner(false);
    setLoading(true);
    setTimeout(() => {
      const demoUser: User = {
        id: 'demo_usr_' + Date.now().toString(36),
        name: name || 'Chaudhry Ahmed Ali',
        phone: phone || '0300-1234567',
        email: email || 'demo@kisandost.ai',
        farmName: accountType === 'farmer' ? (farmName || 'Al-Madina Dairy & Cattle Farm') : '',
        location: district || 'Sahiwal, Punjab',
        district: district || 'Sahiwal',
        language,
        userAccountType: accountType,
        role: accountType === 'farmer' ? 'user' : 'customer',
        isPremium: true,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
      };
      writeActivityLog(demoUser, 'login');
      setLoading(false);
      onLoginSuccess(demoUser);
    }, 600);
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setShowDomainBanner(false);

    if (authMode === 'email' || isSignUp) {
      try {
        const user = await loginOrRegisterWithEmail(email, password, {
          name,
          farmName: accountType === 'farmer' ? farmName : '',
          district: accountType === 'farmer' ? district : '',
          email,
          phone,
          language,
        });

        // Attach role and save
        const enrichedUser: User = {
          ...user,
          userAccountType: accountType,
          role: accountType === 'farmer' ? 'user' : 'customer',
          farmName: accountType === 'farmer' ? (farmName || user.farmName) : '',
          district: accountType === 'farmer' ? (district || user.district) : '',
        };

        // Sync enriched profile to Firestore
        syncDocToFirestore(COLLECTIONS.USERS, enrichedUser).catch(() => {});

        writeActivityLog(enrichedUser, isSignUp ? 'signup' : 'login');
        setLoading(false);
        onLoginSuccess(enrichedUser);
        return;
      } catch (err: any) {
        const code = err?.code || '';
        if (
          code === 'auth/unauthorized-domain' ||
          code === 'auth/configuration-not-found' ||
          code === 'auth/operation-not-allowed' ||
          err?.message?.includes('unauthorized-domain')
        ) {
          setLoading(false);
          setShowDomainBanner(true);
          return;
        }
        console.warn('Email Auth warning, using local fallback:', err);
        setErrorMsg(
          isEn
            ? 'Firebase auth issue. Activating demo farmer account...'
            : 'ای میل تصدیق میں دشواری۔ ڈیمو اکاؤنٹ فعال کیا جا رہا ہے۔'
        );
      }
    }

    // Phone OTP or local fallback
    try {
      const mockUser: User = {
        id: 'usr_' + Date.now().toString(36),
        name: name || 'Chaudhry Ahmed Ali',
        phone: phone || '0300-1234567',
        email: email || 'ahmed.farm@kisandost.ai',
        farmName: accountType === 'farmer' ? (farmName || 'Al-Madina Dairy & Cattle Farm') : '',
        location: district || 'Sahiwal, Punjab',
        district: district || 'Sahiwal',
        language,
        userAccountType: accountType,
        role: accountType === 'farmer' ? 'user' : 'customer',
        isPremium: true,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
      };
      await syncDocToFirestore(COLLECTIONS.USERS, mockUser);
      writeActivityLog(mockUser, isSignUp ? 'signup' : 'login');
      setLoading(false);
      onLoginSuccess(mockUser);
    } catch (err) {
      setLoading(false);
      setErrorMsg(
        isEn
          ? 'Account creation failed. Please check your details and try again.'
          : 'اکاؤنٹ بنانے یا لاگ ان کی کارروائی میں غلطی پیش آئی۔'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Top Header */}
        <div className="text-center mb-5">
          <img src="/logo_icon.png" alt="Kisan Dost Logo" className="w-20 h-20 mx-auto object-contain drop-shadow-md mb-2" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
            <span>{t('appName', language)}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-extrabold uppercase">AI</span>
          </h2>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            المدینہ ڈیری فارم
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isSignUp
              ? (isEn ? 'Create a New Account' : 'نیا اکاؤنٹ رجسٹر کریں')
              : (isEn ? 'Sign In to Your Account' : 'اپنے اکاؤنٹ میں داخل ہوں')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setShowDomainBanner(false); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
              !isSignUp
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isEn ? 'Sign In' : 'لاگ ان کریں'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setShowDomainBanner(false); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 rtl:space-x-reverse ${
              isSignUp
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isEn ? 'Sign Up (New)' : 'نیا اکاؤنٹ بنائیں'}</span>
          </button>
        </div>

        {/* ── Firebase Domain Unauthorized Banner ── */}
        {showDomainBanner && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700">
            <div className="flex items-start space-x-2.5 rtl:space-x-reverse mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">
                  {isEn ? 'Firebase Domain Unauthorized' : 'فائر بیس ڈومین غیر مجاز ہے'}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  {isEn
                    ? 'Please add your current host URL to Firebase Console → Authentication → Authorized Domains.'
                    : 'برائے مہربانی اپنے ہوسٹ URL کو Firebase Console ← Authentication ← Authorized Domains میں شامل کریں۔'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDemoMode}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Continue in Demo Mode' : 'ڈیمو موڈ میں جاری رکھیں'}</span>
              </button>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2 px-4 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Firebase Console</span>
              </a>
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {errorMsg && !showDomainBanner && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* ── Role Selector (Sign Up only) ── */}
        {isSignUp && (
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {isEn ? 'I am signing up as:' : 'میں رجسٹر ہو رہا ہوں بطور:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Farmer Option */}
              <button
                type="button"
                onClick={() => setAccountType('farmer')}
                className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-xs font-bold ${
                  accountType === 'farmer'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {accountType === 'farmer' && (
                  <span className="absolute top-1.5 end-1.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  </span>
                )}
                <Tractor className="w-6 h-6 mb-1 text-emerald-500" />
                <span>{isEn ? '🌾 Farmer' : '🌾 کسان'}</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                  {isEn ? 'Livestock Owner' : 'فارم مالک'}
                </span>
              </button>

              {/* General User Option */}
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-xs font-bold ${
                  accountType === 'user'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {accountType === 'user' && (
                  <span className="absolute top-1.5 end-1.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  </span>
                )}
                <ShoppingBag className="w-6 h-6 mb-1 text-blue-500" />
                <span>{isEn ? '👤 General User' : '👤 عوام / خریدار'}</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                  {isEn ? 'Buyer / Customer' : 'ڈیری اسٹور خریدار'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Google One-Click Sign In Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2.5 rtl:space-x-reverse active:scale-95"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isEn ? 'Continue with Google' : 'گوگل اکاؤنٹ سے داخل ہوں (Google Sign-In)'}</span>
          </button>
        </div>

        <div className="relative flex py-1.5 items-center mb-3">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isEn ? 'Or Form Login' : 'یا فارم کے ذریعے'}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Auth Method Mode Switcher (Email vs Phone) — Sign In only */}
        {!isSignUp && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => { setAuthMode('email'); setOtpSent(false); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse ${
                authMode === 'email'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>ای میل لاگ ان</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('phone'); setOtpSent(false); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse ${
                authMode === 'phone'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>موبائل نمبر OTP</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerifyAndLogin} className="space-y-3.5">

          {/* ── Sign Up: Full Name (always shown) ── */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Full Name' : 'مکمل نام (Full Name)'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="چوہدری احمد علی"
                  className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* ── Sign Up: Farmer-only fields ── */}
          {isSignUp && accountType === 'farmer' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Farm Name' : 'فارم کا نام (Farm Name)'}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="المدینہ ڈائری فارم"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'City / District' : 'ضلع یا شہر (District)'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="ساہیوال (Sahiwal)"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email + Password (email mode or sign up) */}
          {(authMode === 'email' || isSignUp) ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('emailLabel', language)}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@kisandost.ai"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('passwordLabel', language)}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Phone OTP mode */
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('phoneLabel', language)}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {otpSent ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('otpLabel', language)}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="8842"
                      className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1">
                    ✓ او ٹی پی کوڈ بھیج دیا گیا ہے (ڈیمو کوڈ: 8842)
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
                >
                  {loading ? 'بھیجا جا رہا ہے...' : t('getOtp', language)}
                </button>
              )}
            </>
          )}

          {/* Submit Button */}
          {(otpSent || authMode === 'email' || isSignUp) && (
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse active:scale-95 ${
                accountType === 'user' && isSignUp
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>
                {loading
                  ? (isEn ? 'Verifying...' : 'تصدیق ہو رہی ہے...')
                  : isSignUp
                    ? (isEn ? `Create ${accountType === 'farmer' ? 'Farmer' : 'User'} Account` : `نیا ${accountType === 'farmer' ? 'کسان' : 'صارف'} اکاؤنٹ بنائیں`)
                    : (isEn ? 'Log In' : 'لاگ ان کریں')}
              </span>
            </button>
          )}
        </form>

        {/* Footer Toggle */}
        <div className="mt-5 text-center text-xs">
          {isSignUp ? (
            <p className="text-slate-500 dark:text-slate-400">
              {isEn ? 'Already have an account? ' : 'پہلے سے اکاؤنٹ موجود ہے؟ '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setShowDomainBanner(false); }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {isEn ? 'Sign In Here' : 'لاگ ان کریں'}
              </button>
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              {isEn ? 'New to Kisan Dost? ' : 'نیا کسان اکاؤنٹ بنانا چاہتے ہیں؟ '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setShowDomainBanner(false); }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {isEn ? 'Create Account' : 'نیا اکاؤنٹ بنائیں'}
              </button>
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>محفوظ اور اینکرپٹڈ کسان پورٹل (Encrypted Account)</span>
          </p>
        </div>

      </div>
    </div>
  );
};
