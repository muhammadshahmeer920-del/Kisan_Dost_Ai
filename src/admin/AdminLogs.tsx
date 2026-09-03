import React, { useState } from 'react';
import { AdminAuditLogEntry, UserActivityLog, Language } from '../types';
import {
  Activity,
  Search,
  Download,
  Calendar,
  Lock,
  Users,
  Tractor,
  ShoppingBag,
  LogIn,
  UserPlus,
  Filter
} from 'lucide-react';
import { getStoredUserActivityLogs } from '../lib/storage';

interface AdminLogsProps {
  auditLogs?: AdminAuditLogEntry[];
  language: Language;
}

type LogTab = 'audit' | 'activity';

export const AdminLogs: React.FC<AdminLogsProps> = ({
  auditLogs = [],
  language
}) => {
  const isEn = language === 'en';
  const safeAuditLogs = auditLogs || [];

  const [activeTab, setActiveTab] = useState<LogTab>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminFilter, setAdminFilter] = useState<string>('all');

  // User Activity Logs (sign-up/sign-in events)
  const [activityLogs] = useState<UserActivityLog[]>(() => getStoredUserActivityLogs());
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [activityRoleFilter, setActivityRoleFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState('');

  // ── Audit Log filtering ──
  const filteredAudit = safeAuditLogs.filter(log => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetEntity || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAdmin = adminFilter === 'all' || log.adminId === adminFilter;

    return matchesSearch && matchesAdmin;
  });

  // ── User Activity Log filtering ──
  const filteredActivity = activityLogs.filter(log => {
    const matchesSearch =
      (log.name || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.email || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.farmName || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.city || '').toLowerCase().includes(activitySearch.toLowerCase()) ||
      (log.userId || '').toLowerCase().includes(activitySearch.toLowerCase());

    const matchesType = activityTypeFilter === 'all' || log.actionType === activityTypeFilter;
    const matchesRole = activityRoleFilter === 'all' || log.userAccountType === activityRoleFilter;

    return matchesSearch && matchesType && matchesRole;
  });

  // ── CSV export (audit) ──
  const exportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Admin Name', 'Admin ID', 'Action', 'Target Entity', 'Target ID', 'Previous Value', 'New Value'];
    const rows = filteredAudit.map(l => [
      l.id,
      l.timestamp,
      `"${l.adminName.replace(/"/g, '""')}"`,
      l.adminId,
      `"${l.action.replace(/"/g, '""')}"`,
      l.targetEntity,
      l.targetId,
      `"${(l.previousValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `kisan_dost_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── CSV export (activity) ──
  const exportActivityCSV = () => {
    const headers = ['Activity ID', 'Timestamp', 'Last Login', 'User ID', 'Name', 'Email', 'Role', 'Farm Name', 'City/District', 'Action Type'];
    const rows = filteredActivity.map(l => [
      l.id,
      l.timestamp,
      l.lastLogin || '',
      l.userId,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      l.email,
      l.userAccountType,
      `"${(l.farmName || '').replace(/"/g, '""')}"`,
      l.city || '',
      l.actionType
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `kisan_dost_user_activity_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black mb-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isEn ? 'Append-Only Cryptographic Audit Trail' : 'ناقابلِ تنسیخ آڈٹ لاگ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Security & System Audit Logs' : 'سیکیورٹی و سسٹم آڈٹ لاگز'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? 'Complete immutable traceability for administrative decisions, role modifications, and user activity events.'
              : 'ایڈمن فیصلوں، رول تبدیلیوں اور صارفین کی سرگرمیوں کا مکمل تاریخی ریکارڈ۔'}
          </p>
        </div>

        <button
          onClick={activeTab === 'audit' ? exportAuditCSV : exportActivityCSV}
          className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{isEn ? 'Export CSV' : 'CSV ڈاؤن لوڈ'}</span>
        </button>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isEn ? 'System Audit Trail' : 'سسٹم آڈٹ لاگ'}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {filteredAudit.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'activity'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isEn ? 'User Activity Log' : 'صارفین سرگرمی لاگ'}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'activity' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {activityLogs.length}
          </span>
        </button>
      </div>

      {/* ─────────── AUDIT LOG TAB ─────────── */}
      {activeTab === 'audit' && (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isEn ? 'Search audit actions, admin names, entities...' : 'کارروائی، ایڈمن یا ہدف سے تلاش کریں...'}
                className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAudit.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                {isEn ? 'No audit log entries found.' : 'کوئی آڈٹ ریکارڈ نہیں ملا۔'}
              </div>
            ) : filteredAudit.map(log => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="font-mono text-[11px] font-bold text-slate-400">#{log.id}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{log.adminName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {log.targetEntity}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                  {(log.previousValue || log.newValue) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      {log.previousValue && <span>Prev: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-rose-600">{log.previousValue}</code> </span>}
                      {log.newValue && <span>New: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-emerald-600">{log.newValue}</code></span>}
                    </div>
                  )}
                </div>
                <div className="text-end text-slate-400 font-mono text-[11px] shrink-0">
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse sm:justify-end">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{log.timestamp}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─────────── USER ACTIVITY LOG TAB ─────────── */}
      {activeTab === 'activity' && (
        <>
          {/* Activity Log Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: isEn ? 'Total Registrations' : 'کل رجسٹریشن', value: activityLogs.filter(l => l.actionType === 'signup').length, color: 'emerald', icon: UserPlus },
              { label: isEn ? 'Total Logins' : 'کل لاگ ان', value: activityLogs.filter(l => l.actionType === 'login').length, color: 'blue', icon: LogIn },
              { label: isEn ? 'Farmers' : 'کسان', value: activityLogs.filter(l => l.userAccountType === 'farmer').length, color: 'teal', icon: Tractor },
              { label: isEn ? 'General Users' : 'عام صارفین', value: activityLogs.filter(l => l.userAccountType === 'user').length, color: 'violet', icon: ShoppingBag },
            ].map(stat => (
              <div key={stat.label} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm`}>
                <stat.icon className={`w-5 h-5 mb-2 text-${stat.color}-500`} />
                <div className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
              <input
                type="text"
                value={activitySearch}
                onChange={e => setActivitySearch(e.target.value)}
                placeholder={isEn ? 'Search by name, email, farm, city, user ID...' : 'نام، ای میل، فارم، شہر یا ID سے تلاش کریں...'}
                className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                value={activityRoleFilter}
                onChange={e => setActivityRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
              >
                <option value="all">{isEn ? 'All Roles' : 'تمام رولز'}</option>
                <option value="farmer">{isEn ? '🌾 Farmer' : '🌾 کسان'}</option>
                <option value="user">{isEn ? '👤 General User' : '👤 عام صارف'}</option>
              </select>
              <select
                value={activityTypeFilter}
                onChange={e => setActivityTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
              >
                <option value="all">{isEn ? 'All Events' : 'تمام واقعات'}</option>
                <option value="signup">{isEn ? 'Sign Up' : 'نئی رجسٹریشن'}</option>
                <option value="login">{isEn ? 'Login' : 'لاگ ان'}</option>
              </select>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredActivity.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {activityLogs.length === 0
                  ? (isEn ? 'No user activity recorded yet. Activity is logged on every sign-up and sign-in.' : 'ابھی کوئی سرگرمی ریکارڈ نہیں ہوئی۔ ہر لاگ ان اور سائن اپ پر یہاں ریکارڈ ہوگا۔')
                  : (isEn ? 'No records match your filter.' : 'فلٹر کے مطابق کوئی ریکارڈ نہیں ملا۔')
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'User' : 'صارف'}</th>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'Account Type' : 'اکاؤنٹ نوع'}</th>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'Farm / City' : 'فارم / شہر'}</th>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'Event' : 'واقعہ'}</th>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'Timestamp' : 'وقت'}</th>
                      <th className="py-3.5 px-4 text-start">{isEn ? 'Last Login' : 'آخری لاگ ان'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredActivity.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                              log.userAccountType === 'farmer'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}>
                              {(log.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{log.name}</div>
                              <div className="text-[11px] text-slate-400">{log.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.userAccountType === 'farmer'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {log.userAccountType === 'farmer' ? <Tractor className="w-2.5 h-2.5" /> : <ShoppingBag className="w-2.5 h-2.5" />}
                            <span>{log.userAccountType === 'farmer' ? (isEn ? 'Farmer' : 'کسان') : (isEn ? 'User' : 'صارف')}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {log.farmName || '—'}<br />
                          <span className="text-[11px] text-slate-400">{log.city || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center space-x-1 rtl:space-x-reverse px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.actionType === 'signup'
                              ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {log.actionType === 'signup' ? <UserPlus className="w-2.5 h-2.5" /> : <LogIn className="w-2.5 h-2.5" />}
                            <span>{log.actionType === 'signup' ? (isEn ? 'Sign Up' : 'رجسٹریشن') : (isEn ? 'Login' : 'لاگ ان')}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-PK') : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {log.lastLogin ? new Date(log.lastLogin).toLocaleString('en-PK') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
