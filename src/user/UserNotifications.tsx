import React, { useState } from 'react';
import { AdminNotification, Language } from '../types';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Info, 
  AlertTriangle, 
  Sparkles, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { saveStoredNotifications } from '../lib/storage';

interface UserNotificationsProps {
  notifications?: AdminNotification[];
  language: Language;
  onRefreshNotifications?: () => void;
}

export const UserNotifications: React.FC<UserNotificationsProps> = ({
  notifications = [],
  language,
  onRefreshNotifications
}) => {
  const isEn = language === 'en';

  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('user_read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const safeNotifications = notifications || [];

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('user_read_notifications', JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    const allIds = safeNotifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('user_read_notifications', JSON.stringify(allIds));
  };

  const filtered = safeNotifications.filter(n => {
    if (filter === 'unread') return !readIds.includes(n.id);
    if (filter === 'high') return n.priority === 'alert' || n.priority === 'warning';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>{isEn ? 'Notification Dispatch' : 'اطلاعات و نوٹیفیکیشنز'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Announcements & Updates' : 'اعلانات و اہم الرٹس'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Stay informed with vaccination campaign notices, market rate fluctuations, and subsidy approvals.' 
              : 'ویکسین مہم، منڈی ریٹس، اور درخواستوں کی صورتحال کے متعلق باخبر رہیں۔'}
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center space-x-2 rtl:space-x-reverse shrink-0"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>{isEn ? 'Mark All Read' : 'سب پڑھا ہوا نشان زد کریں'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {isEn ? 'All' : 'تمام'} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {isEn ? 'Unread' : 'ان پڑھ'} ({notifications.filter(n => !readIds.includes(n.id)).length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'high'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {isEn ? 'Urgent / Important' : 'اہم الرٹس'}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'No notifications to display' : 'کوئی نیا نوٹیفیکیشن موجود نہیں ہے'}
            </h4>
          </div>
        ) : (
          filtered.map(notif => {
            const isRead = readIds.includes(notif.id);

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                  isRead 
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80' 
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.priority === 'alert' || notif.priority === 'warning'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600'
                    }`}>
                      {notif.priority === 'alert' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {notif.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center space-x-3 rtl:space-x-reverse mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Calendar className="w-3 h-3" />
                          <span>{notif.createdDate}</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize">{isEn ? 'Target: ' : 'ہدف: '}{notif.targetAudience}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                    notif.priority === 'alert' || notif.priority === 'warning'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {notif.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
