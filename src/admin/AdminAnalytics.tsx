import React from 'react';
import { 
  AdminUserItem, 
  UnifiedRecord, 
  UserApplication, 
  AIActivityLog, 
  Language 
} from '../types';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Users, 
  Cpu, 
  FileCheck, 
  Sparkles,
  Calendar,
  Activity
} from 'lucide-react';

interface AdminAnalyticsProps {
  users: AdminUserItem[];
  records: UnifiedRecord[];
  applications: UserApplication[];
  aiLogs: AIActivityLog[];
  language: Language;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  users,
  records,
  applications,
  aiLogs,
  language
}) => {
  const isEn = language === 'en';

  // Compute breakdown by module
  const moduleCounts: Record<string, number> = {};
  records.forEach(r => {
    moduleCounts[r.module] = (moduleCounts[r.module] || 0) + 1;
  });

  // Compute breakdown by user roles
  const roleCounts: Record<string, number> = {};
  users.forEach(u => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  // Compute application statuses
  const appStatusCounts: Record<string, number> = {};
  applications.forEach(a => {
    appStatusCounts[a.status] = (appStatusCounts[a.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isEn ? 'Cross-Platform Intelligence & Trends' : 'سسٹم اینالیٹکس و کارکردگی'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {isEn ? 'System Analytics & Data Visualizations' : 'جامع ڈیٹا اینالیٹکس'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isEn 
            ? 'Deep metrics on farmer adoption rates, livestock record volume, grant processing efficiency, and AI diagnostics usage.' 
            : 'صارفین کے اضافے، ریکارڈز کے حجم اور اے آئی استعمال کے شماریاتی گراف۔'}
        </p>
      </div>

      {/* Top 3 High Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {isEn ? 'Average Milk Yield Monitored' : 'اوسط یومیہ دودھ پیداوار'}
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            18.2 <span className="text-xs font-bold text-slate-500">Liters / Cow / Day</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            +14% vs. District Average
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {isEn ? 'AI Disease Scan Confidence' : 'اے آئی تشخیصی درستی'}
          </span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            94.8% <span className="text-xs font-bold text-slate-500">Avg Precision</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Gemini 2.5 Flash Multimodal
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block mb-1">
            {isEn ? 'Grant Processing Speed' : 'درخواستوں پر اوسط کارروائی'}
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            1.8 <span className="text-xs font-bold text-slate-500">Days</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            92% SLA Compliance
          </span>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'Records Distribution by Module' : 'ماڈیول کے لحاظ سے ریکارڈز'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(moduleCounts).map(([module, count]) => {
              const percentage = Math.round((count / records.length) * 100) || 0;
              return (
                <div key={module} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="capitalize">{module}</span>
                    <span>{count} records ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Roles & Permissions Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'Registered Roles Breakdown' : 'صارفین کی رول تقسیم'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(roleCounts).map(([role, count]) => {
              const percentage = Math.round((count / users.length) * 100) || 0;
              return (
                <div key={role} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="capitalize">{role.replace('_', ' ')}</span>
                    <span>{count} accounts ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications Outcomes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>{isEn ? 'Application Status Pipeline' : 'درخواستوں کے نتائج'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(appStatusCounts).map(([status, count]) => {
              const percentage = Math.round((count / applications.length) * 100) || 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span>{count} applications ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Throughput Telemetry */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>{isEn ? 'AI Vision Inferences Volume' : 'اے آئی وژن اسکیننگ سرگرمی'}</span>
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-2">
            <div className="flex justify-between">
              <span>{isEn ? 'Total Disease Diagnoses:' : 'کل تشخیصی معائنے:'}</span>
              <strong>{aiLogs.length} Scans</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'Average Latency:' : 'اوسط رسپانس ٹائم:'}</span>
              <strong>840 ms</strong>
            </div>
            <div className="flex justify-between">
              <span>{isEn ? 'Model Execution Mode:' : 'ماڈل آپریشن موڈ:'}</span>
              <strong>Dual Mode (Cloud Gemini + Offline Heuristic)</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
