import React, { useState } from 'react';
import { UserComplaint, Language } from '../types';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { saveStoredComplaints, logAdminAction } from '../lib/storage';
import { updateGrievanceStatus } from '../services/adminFarmerSync';

interface AdminComplaintsProps {
  complaints?: UserComplaint[];
  language: Language;
  onRefreshComplaints?: () => void;
}

export const AdminComplaints: React.FC<AdminComplaintsProps> = ({
  complaints = [],
  language,
  onRefreshComplaints
}) => {
  const isEn = language === 'en';
  const safeComplaints = complaints || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeComplaint, setActiveComplaint] = useState<UserComplaint | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  const handleUpdateComplaint = (id: string, status: UserComplaint['status'], resolution?: string) => {
    updateGrievanceStatus(id, status, resolution);
    setActiveComplaint(null);
    if (onRefreshComplaints) onRefreshComplaints();
  };

  const filtered = safeComplaints.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isEn ? 'Farmer Grievance Redressal Cell' : 'شکایات کا فوری ازالہ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Complaints & Incident Management' : 'کسان شکایات و حل'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Handle farmer disputes, doctor response delays, milk pricing discrepancies, and platform issues.' 
              : 'کسانوں کے مسائل، ڈاکٹر تاخیر یا ادائیگی سے متعلق شکایات کا حل کریں۔'}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
          {filtered.length} {isEn ? 'Total Grievances' : 'شکایات'}
        </span>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by complaint ID, farmer, or category...' : 'شکایت نمبر یا کسان کے نام سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
        >
          <option value="all">{isEn ? 'All Status' : 'تمام اسٹیٹس'}</option>
          <option value="new">New / Unopened</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Grievances List */}
      <div className="space-y-4">
        {filtered.map(comp => (
          <div
            key={comp.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-rose-500/40 transition-all"
          >
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="font-mono text-xs font-bold text-slate-400">#{comp.id}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {comp.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  comp.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : comp.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {comp.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {comp.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {comp.description}
              </p>

              <div className="flex items-center space-x-3 rtl:space-x-reverse text-[11px] text-slate-400 pt-1">
                <span>{isEn ? 'Farmer:' : 'کسان:'} <strong className="text-slate-700 dark:text-slate-200">{comp.userName}</strong></span>
                <span>•</span>
                <span>{comp.userPhone}</span>
                <span>•</span>
                <span>{comp.submissionDate}</span>
              </div>

              {comp.adminResponse && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                  <strong>{isEn ? 'Resolution Note:' : 'ازالے کی تفصیل:'}</strong> {comp.adminResponse}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
              <a
                href={`tel:${comp.userPhone}`}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 text-xs font-bold"
                title={isEn ? 'Call Farmer' : 'فون کال کریں'}
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{isEn ? 'Call' : 'کال'}</span>
              </a>

              <button
                onClick={() => {
                  setActiveComplaint(comp);
                  setResolutionInput(comp.adminResponse || '');
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                {isEn ? 'Resolve Case' : 'کیس حل کریں'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resolution Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveComplaint(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-mono text-xs text-slate-400">#{activeComplaint.id}</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {activeComplaint.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {activeComplaint.userName} ({activeComplaint.userPhone})
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              {activeComplaint.description}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Official Resolution Note / Action Taken' : 'کارروائی و حل کی تفصیل'}
              </label>
              <textarea
                rows={3}
                value={resolutionInput}
                onChange={e => setResolutionInput(e.target.value)}
                placeholder={isEn ? 'Describe how the issue was investigated and resolved...' : 'مسئلے کے حل کی تفصیلی رپورٹ درج کریں...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleUpdateComplaint(activeComplaint.id, 'in_progress', resolutionInput)}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs hover:bg-blue-100"
              >
                {isEn ? 'Mark In Progress' : 'زیرِ کارروائی'}
              </button>

              <button
                onClick={() => handleUpdateComplaint(activeComplaint.id, 'resolved', resolutionInput)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
              >
                {isEn ? 'Mark Resolved' : 'مسئلہ حل ہو گیا'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
