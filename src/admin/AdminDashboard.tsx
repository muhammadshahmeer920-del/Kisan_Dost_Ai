import React from 'react';
import { 
  AdminUserItem, 
  UnifiedRecord, 
  UserApplication, 
  UserComplaint, 
  SystemReport, 
  AIActivityLog, 
  AdminAuditLogEntry,
  AdminNavRoute,
  Language
} from '../types';
import { 
  Users, 
  FolderOpen, 
  FileCheck, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Server,
  Database,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  users?: AdminUserItem[];
  records?: UnifiedRecord[];
  applications?: UserApplication[];
  complaints?: UserComplaint[];
  reports?: SystemReport[];
  aiLogs?: AIActivityLog[];
  auditLogs?: AdminAuditLogEntry[];
  language: Language;
  onNavigateAdmin: (route: AdminNavRoute) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users = [],
  records = [],
  applications = [],
  complaints = [],
  reports = [],
  aiLogs = [],
  auditLogs = [],
  language,
  onNavigateAdmin
}) => {
  const isEn = language === 'en';

  const safeUsers = users || [];
  const safeRecords = records || [];
  const safeApplications = applications || [];
  const safeComplaints = complaints || [];
  const safeReports = reports || [];
  const safeAiLogs = aiLogs || [];
  const safeAuditLogs = auditLogs || [];

  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter(u => u.status === 'active').length;
  const pendingApps = safeApplications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const openComplaints = safeComplaints.filter(c => c.status === 'new' || c.status === 'in_progress').length;
  const activeReports = safeReports.filter(r => r.status === 'under_investigation' || r.status === 'investigating').length;
  const totalScans = safeAiLogs.length;

  const recentUsers = safeUsers.slice(0, 4);
  const recentAudit = safeAuditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Enterprise Executive Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Server className="w-3.5 h-3.5" />
              <span>{isEn ? 'Central System Governance & Telemetry' : 'مرکزی ایڈمنسٹریشن و نگرانی کنٹرول'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isEn ? 'System Command Center' : 'ایڈمن کنٹرول ڈیش بورڈ'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isEn 
                ? 'Real-time database records, user authentication audit logs, AI diagnostic throughput, and government application verification pipeline.'
                : 'ڈیٹابیس ریکارڈز، کسان اکاؤنٹس کا انتظام، سبسڈیز کی تصدیق، اور اے آئی تشخیص کے تفصیلی آڈٹ لاگز۔'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateAdmin('records')}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>{isEn ? 'Database Explorer' : 'مرکزی ڈیٹابیس'}</span>
            </button>
            <button
              onClick={() => onNavigateAdmin('applications')}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs active:scale-95 transition-all"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>{isEn ? 'Review Grants' : 'درخواستوں کی جانچ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => onNavigateAdmin('users')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isEn ? 'Total Users' : 'کل صارفین'}</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalUsers}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {activeUsers} {isEn ? 'Active & Verified' : 'ایکٹیو اور تصدیق شدہ'}
          </p>
        </div>

        <div 
          onClick={() => onNavigateAdmin('records')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isEn ? 'Total Records' : 'کل سسٹم ریکارڈز'}</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {records.length}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
            {isEn ? 'Unified Multi-Module' : 'مویشی، ڈیری، اخراجات'}
          </p>
        </div>

        <div 
          onClick={() => onNavigateAdmin('applications')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isEn ? 'Pending Grants / Apps' : 'زیرِ جائزہ درخواستیں'}</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {pendingApps}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
            {applications.length - pendingApps} {isEn ? 'Processed' : 'پراسیس شدہ'}
          </p>
        </div>

        <div 
          onClick={() => onNavigateAdmin('ai_activity')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{isEn ? 'AI Health Inferences' : 'اے آئی میڈیکل سکینز'}</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalScans}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
            {isEn ? '99.4% Inference Success' : 'کامیاب ماڈل ریسپانس'}
          </p>
        </div>

      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onNavigateAdmin('complaints')}
          className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                {isEn ? 'Grievances & Complaints' : 'کسان شکایات و حل'}
              </span>
              <span className="text-[11px] text-rose-700 dark:text-rose-400">
                {openComplaints} {isEn ? 'Active Open Cases' : 'کھلے کیسز'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 rtl:rotate-180" />
        </div>

        <div 
          onClick={() => onNavigateAdmin('reports')}
          className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                {isEn ? 'Disease Outbreak Radar' : 'وبا و سرولینس رپورٹس'}
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                {activeReports} {isEn ? 'Active District Alerts' : 'علاقائی الرٹس'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 rtl:rotate-180" />
        </div>

        <div 
          onClick={() => onNavigateAdmin('analytics')}
          className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                {isEn ? 'System Analytics & Charts' : 'سسٹم اینالیٹکس و چارٹس'}
              </span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400">
                {isEn ? 'Real-time charts & trends' : 'گروتھ و سرگرمی گراف'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-500 rtl:rotate-180" />
        </div>

      </div>

      {/* Two Column Layout: Recent Users & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: User Directory Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isEn ? 'Recently Registered Users' : 'حالیہ رجسٹرڈ صارفین'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateAdmin('users')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isEn ? 'Manage All' : 'مکمل فہرست'}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentUsers.map(u => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {u.farmName || u.email} • {u.district}
                    </p>
                  </div>
                </div>

                <div className="text-end">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    u.role === 'admin' || u.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {u.role}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {u.registrationDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security & Audit Trail Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isEn ? 'Admin Audit Trail & Security' : 'ایڈمن آڈٹ لاگ و سیکیورٹی'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateAdmin('logs')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isEn ? 'View All Logs' : 'مکمل لاگز'}
            </button>
          </div>

          <div className="space-y-3">
            {recentAudit.map(entry => (
              <div key={entry.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {entry.adminName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {entry.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {entry.targetEntity} ({entry.targetId})
                  </p>
                </div>

                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {entry.timestamp.split(' ')[1] || entry.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
