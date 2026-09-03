import React, { useState } from 'react';
import { User, Language } from '../types';
import * as syncApi from '../lib/syncApi';
import {
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Calendar, 
  Award, 
  Edit3, 
  CheckCircle2, 
  Key,
  Camera
} from 'lucide-react';

interface UserProfileProps {
  user: User;
  language: Language;
  onUpdateUser: (updated: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  language,
  onUpdateUser
}) => {
  const isEn = language === 'en';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    farmName: user.farmName || '',
    location: user.location || '',
    district: user.district || ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (syncApi.getToken()) {
      setSyncing(true);
      try {
        const result = await syncApi.updateProfile(updated);
        if (result?.ok && result.data) {
          const su = result.data;
          onUpdateUser({
            ...updated,
            farmName: su.farm_name || updated.farmName,
            isPremium: su.is_premium === 1 ? true : updated.isPremium,
            hasCompletedOnboarding: su.has_completed_onboarding === 1 ? true : updated.hasCompletedOnboarding,
            updatedAt: su.updated_at,
          } as User);
        } else if (result?.code === 'conflict' && result.data) {
          const su = result.data;
          onUpdateUser({
            ...user,
            name: su.name || user.name,
            phone: su.phone || user.phone,
            email: su.email || user.email,
            farmName: su.farm_name || user.farmName,
            location: su.location || user.location,
            district: su.district || user.district,
            updatedAt: su.updated_at,
          } as User);
        }
      } catch (err) {
        console.warn('[UserProfile] server sync failed, local-only:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-600/20">
                {user.name ? user.name.charAt(0) : 'K'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {user.name}
                </h2>
                {user.isPremium && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center">
                    <Award className="w-3 h-3 me-1 text-emerald-600" /> Premium Farmer
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {user.farmName} • {user.district}
              </p>
              <div className="flex items-center space-x-3 rtl:space-x-reverse mt-2 text-[11px] text-slate-400">
                <span>{isEn ? 'ID:' : 'یوزر کوڈ:'} <strong className="text-slate-700 dark:text-slate-300">{user.id}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center text-emerald-600 font-bold">
                  ● {isEn ? 'Account Active' : 'ایکٹیو اکاؤنٹ'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center space-x-2 rtl:space-x-reverse active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? (isEn ? 'Cancel Editing' : 'منسوخ کریں') : (isEn ? 'Edit Profile' : 'پروفائل تبدیل کریں')}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{isEn ? 'Profile information successfully updated and synced.' : 'پروفائل کی ترتیبات کامیابی سے محفوظ کر لی گئی ہیں۔'}</span>
        </div>
      )}

      {/* Profile Form / Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-6 flex items-center space-x-2 rtl:space-x-reverse">
          <UserIcon className="w-4 h-4 text-emerald-600" />
          <span>{isEn ? 'Account & Farm Details' : 'اکاؤنٹ اور فارم کی تفصیلات'}</span>
        </h3>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Full Name' : 'مکمل نام'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Phone Number' : 'موبائل نمبر'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Email Address' : 'ای میل ایڈریس'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Dairy / Farm Name' : 'فارم یا ڈیری کا نام'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.farmName}
                  onChange={e => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'District' : 'ضلع یا ڈویژن'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Full Farm Address / Village' : 'مکمل فارم کا پتہ و چک نمبر'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                {isEn ? 'Save Profile' : 'محفوظ کریں'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <Phone className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Phone Number' : 'موبائل نمبر'}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.phone}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <Mail className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Email Address' : 'ای میل ایڈریس'}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <Building className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Farm Name' : 'فارم کا نام'}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.farmName}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <MapPin className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'District & Location' : 'ضلع و علاقہ'}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.location || user.district}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <Calendar className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Registration Date' : 'رجسٹریشن کی تاریخ'}</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {user.createdAt ? user.createdAt.split('T')[0] : '2026-01-10'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start space-x-3 rtl:space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 font-medium">{isEn ? 'Digital Security Status' : 'سیکیورٹی سٹیٹس'}</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{isEn ? 'Verified & Authenticated' : 'تصدیق شدہ و محفوظ'}</p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
