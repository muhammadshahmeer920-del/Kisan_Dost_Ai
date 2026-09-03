import React, { useState } from 'react';
import { User, UserApplication, Language } from '../types';
import { 
  FileCheck, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Upload, 
  X, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { createUserApplication, cancelUserApplication } from '../lib/storage';
import { notifyAdminSync } from '../services/adminFarmerSync';

interface UserRequestsProps {
  user: User;
  applications?: UserApplication[];
  language: Language;
  onRefreshApplications?: () => void;
}

export const UserRequests: React.FC<UserRequestsProps> = ({
  user,
  applications = [],
  language,
  onRefreshApplications
}) => {
  const isEn = language === 'en';
  const safeApplications = applications || [];

  const [showModal, setShowModal] = useState(false);
  const [appType, setAppType] = useState<UserApplication['applicationType']>('subsidy_grant');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    createUserApplication({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      applicationType: appType,
      title: title || `${appType.replace('_', ' ').toUpperCase()} Application`,
      description: description,
      documents: ['National_CNIC_Scan.pdf', 'Farm_Ownership_Proof.pdf']
    });

    notifyAdminSync('GRANT_SUBMITTED');
    setIsSubmitting(false);
    setShowModal(false);
    setTitle('');
    setDescription('');
    if (onRefreshApplications) onRefreshApplications();
    setActionSuccess(isEn ? 'Application submitted successfully to Admin for review!' : 'درخواست کامیابی سے ایڈمنسٹریشن کو جمع کر دی گئی ہے!');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleCancel = (appId: string) => {
    if (window.confirm(isEn ? 'Are you sure you want to cancel this pending application?' : 'کیا آپ واقعی اس درخواست کو منسوخ کرنا چاہتے ہیں؟')) {
      cancelUserApplication(appId, user.id);
      notifyAdminSync('GRANT_CANCELLED');
      if (onRefreshApplications) onRefreshApplications();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Government & Platform Subsidies' : 'حکومتی و اداراتی فنڈز و سرٹیفکیٹس'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'My Applications & Requests' : 'میری فارم درخواستیں و این او سی'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Submit official requests for silage subsidies, livestock farm licensing, mandi seller badges, or health approvals.'
              : 'سائلج سبسڈی، فارم ڈیجیٹل لائسنس، منڈی تصدیق یا سرکاری گرانٹ کے لیے آن لائن درخواست جمع کریں۔'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isEn ? 'Submit New Application' : '+ نئی درخواست جمع کریں'}</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeApplications.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'No active applications found' : 'آپ کی کوئی درخواست زیرِ التواء نہیں ہے'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {isEn ? 'You can apply for government livestock grants, pure dairy certification, or farm verification.' : 'آپ ڈیری سبسڈی یا تصدیقی لائسنس کے لیے ابھی درخواست دے سکتے ہیں۔'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
            >
              {isEn ? 'Create Application' : 'درخواست شروع کریں'}
            </button>
          </div>
        ) : (
          safeApplications.map(app => (
            <div 
              key={app.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    #{app.id}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    app.status === 'approved' || app.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : app.status === 'under_review'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : app.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {app.title || app.applicationType.replace('_', ' ').toUpperCase()}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {app.description || (isEn ? 'Official application submitted for verification.' : 'سرکاری جانچ پڑتال کے لیے جمع شدہ درخواست۔')}
                </p>

                {app.adminNotes && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {isEn ? 'Admin Official Response:' : 'ایڈمنسٹریشن کا جواب:'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
                      {app.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:divide-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{app.submissionDate}</span>
                </span>

                {app.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(app.id)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    {isEn ? 'Cancel Request' : 'درخواست واپس لیں'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Application Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {isEn ? 'Submit New Application / Grant' : 'نئی درخواست یا سبسڈی فارم'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {isEn ? 'Fill in the required information for official administrator review.' : 'درخواست کی درست تفصیل درج کریں تاکہ ایڈمن فوری کارروائی کر سکے۔'}
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Application Category' : 'درخواست کی قسم'}
                </label>
                <select
                  value={appType}
                  onChange={e => setAppType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="subsidy_grant">{isEn ? 'Government Livestock Subsidy / Silage Grant' : 'حکومتی لائیو اسٹاک و سائلج سبسڈی'}</option>
                  <option value="farm_license">{isEn ? 'Digital Farm Verification & License' : 'ڈیجیٹل فارم لائسنس و رجسٹریشن'}</option>
                  <option value="mandi_seller">{isEn ? 'Mandi Verified Seller Badge' : 'آن لائن منڈی تصدیق شدہ بیوپاری بیج'}</option>
                  <option value="dairy_certification">{isEn ? 'Pure Dairy Organic Quality Certificate' : 'خالص ڈیری آرگینک کوالٹی سرٹیفکیٹ'}</option>
                  <option value="vet_approval">{isEn ? 'Emergency Veterinary Home Visit Request' : 'ایمرجنسی ویٹرنری ڈاکٹر وزٹ درخواست'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Request Subject / Title' : 'درخواست کا عنوان'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Silage Grant for 20 Cattle' : 'مثال: 20 جانوروں کے لیے سائلج سبسڈی'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Description & Requirements' : 'تفصیلات و ضروریات'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={isEn ? 'Explain why you are requesting this grant/service...' : 'درخواست کی تفصیلی وجہ یا فارم کے جانوروں کی تعداد درج کریں...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Simulated Document Attachment */}
              <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isEn ? 'Attach Supporting Documents' : 'شناختی کارڈ یا فارم دستاویزات منسلک کریں'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isEn ? 'Auto-attaching CNIC & Farm Registry (Simulated)' : 'سی این آئی سی و رجسٹری خودکار منسلک ہیں'}
                </span>
              </div>

              <div className="pt-3 flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isEn ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {isEn ? 'Submit Application' : 'درخواست بھیجیں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
