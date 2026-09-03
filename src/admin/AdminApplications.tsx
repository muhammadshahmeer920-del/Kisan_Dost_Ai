import React, { useState } from 'react';
import { UserApplication, Language } from '../types';
import { 
  FileCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  X, 
  MessageSquare, 
  Phone, 
  Calendar,
  FileText
} from 'lucide-react';
import { saveStoredApplications, logAdminAction } from '../lib/storage';
import { updateGrantStatus } from '../services/adminFarmerSync';

interface AdminApplicationsProps {
  applications?: UserApplication[];
  language: Language;
  onRefreshApplications?: () => void;
}

export const AdminApplications: React.FC<AdminApplicationsProps> = ({
  applications = [],
  language,
  onRefreshApplications
}) => {
  const isEn = language === 'en';
  const safeApplications = applications || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');

  const handleUpdateStatus = (appId: string, status: UserApplication['status'], notes?: string) => {
    updateGrantStatus(appId, status, notes);
    setSelectedApp(null);
    if (onRefreshApplications) onRefreshApplications();
  };

  const filtered = safeApplications.filter(a => {
    const matchesSearch = 
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.applicationType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isEn ? 'Government Grants & Verification Pipeline' : 'درخواستوں اور سبسڈیز کی جانچ پڑتال'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Application Review & Approvals' : 'درخواستوں کی منظوری و فیصلے'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Review farmer applications for silage grants, official livestock certifications, and mandi merchant badges.' 
              : 'کسانوں کی طرف سے جمع شدہ گرانٹس، فارم لائسنس اور سرٹیفکیٹس کی جانچ کریں۔'}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
          {filtered.length} {isEn ? 'Applications' : 'درخواستیں'}
        </span>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by ID, Farmer Name, Grant Type...' : 'درخواست آئی ڈی یا کسان کے نام سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
        >
          <option value="all">{isEn ? 'All Status' : 'تمام اسٹیٹس'}</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(app => (
          <div
            key={app.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all"
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

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2 rtl:space-x-reverse">
                <span>{isEn ? 'Applicant:' : 'درخواست گزار:'} <strong className="text-slate-700 dark:text-slate-200">{app.userName}</strong></span>
                {app.userPhone && (
                  <>
                    <span>•</span>
                    <span>{app.userPhone}</span>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">
                {app.description}
              </p>

              {app.adminNotes && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">{isEn ? 'Admin Decision Notes:' : 'ایڈمن فیصلے کے نوٹس:'}</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{app.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse">
                <Calendar className="w-3.5 h-3.5" />
                <span>{app.submissionDate}</span>
              </span>

              <button
                onClick={() => {
                  setSelectedApp(app);
                  setAdminNotesInput(app.adminNotes || '');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs shadow-sm transition-all"
              >
                {isEn ? 'Review & Decide' : 'معائنہ و فیصلہ'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-mono text-xs text-slate-400">#{selectedApp.id}</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {selectedApp.title || selectedApp.applicationType}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedApp.userName} ({selectedApp.userPhone}) • Submitted: {selectedApp.submissionDate}
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedApp.description}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Admin Official Feedback / Notes' : 'ایڈمنسٹریشن کے ریمارکس و ہدایات'}
              </label>
              <textarea
                rows={3}
                value={adminNotesInput}
                onChange={e => setAdminNotesInput(e.target.value)}
                placeholder={isEn ? 'Enter instructions, approval conditions, or reasons for rejection...' : 'منظوری کی شرائط یا ریمارکس درج کریں...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedApp.id, 'under_review', adminNotesInput)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs hover:bg-blue-100"
              >
                {isEn ? 'Mark Under Review' : 'زیرِ غور'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'rejected', adminNotesInput)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs hover:bg-rose-100"
                >
                  {isEn ? 'Reject' : 'مسترد'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'approved', adminNotesInput)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
                >
                  {isEn ? 'Approve & Grant' : 'منظور کریں'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
