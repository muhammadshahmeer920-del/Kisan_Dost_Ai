import React, { useState } from 'react';
import { AdminNotification, Language } from '../types';
import { 
  Bell, 
  Send, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  Calendar, 
  X,
  Radio
} from 'lucide-react';
import { saveStoredNotifications, logAdminAction } from '../lib/storage';
import { sendAdminBroadcast } from '../services/adminFarmerSync';

interface AdminNotificationsProps {
  notifications?: AdminNotification[];
  language: Language;
  onRefreshNotifications?: () => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  notifications = [],
  language,
  onRefreshNotifications
}) => {
  const isEn = language === 'en';
  const safeNotifications = notifications || [];

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<AdminNotification['targetAudience']>('all');
  const [priority, setPriority] = useState<AdminNotification['priority']>('info');

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    sendAdminBroadcast(
      title,
      message,
      priority,
      priority === 'alert'
    );

    setShowModal(false);
    setTitle('');
    setMessage('');
    if (onRefreshNotifications) onRefreshNotifications();
  };

  const handleDeleteNotif = (id: string) => {
    const updated = safeNotifications.filter(n => n.id !== id);
    saveStoredNotifications(updated);
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'Platform Broadcast Lead',
      action: `Deleted notification #${id}`,
      targetEntity: 'AdminNotification',
      targetId: id
    });
    if (onRefreshNotifications) onRefreshNotifications();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>{isEn ? 'Universal Broadcast & Push Engine' : 'مرکزی پش نوٹیفیکیشن ڈسپیچ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Broadcast Notification Center' : 'مرکزی اعلانات و پیغامات'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Send targeted announcements to all registered livestock farmers, dairy buyers, or local veterinary doctors.' 
              : 'تمام کسانوں یا مخصوص کیٹیگری کو الرٹس اور اعلانات بھیجیں۔'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>{isEn ? 'Send New Broadcast' : 'نیا اعلان جاری کریں'}</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-400">
                  #{notif.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  notif.priority === 'alert' || notif.priority === 'warning'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {notif.priority}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {notif.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {notif.message}
              </p>

              <div className="flex items-center space-x-2 rtl:space-x-reverse mt-3 text-xs text-slate-500 dark:text-slate-400">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Audience: ' : 'مخاطب: '} <strong className="capitalize text-slate-800 dark:text-slate-200">{notif.targetAudience}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse">
                <Calendar className="w-3.5 h-3.5" />
                <span>{notif.createdDate}</span>
              </span>

              <button
                onClick={() => handleDeleteNotif(notif.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                title={isEn ? 'Delete Broadcast' : 'حذف کریں'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
              {isEn ? 'Dispatch Broadcast Notification' : 'نیا سسٹم نوٹیفیکیشن بھیجیں'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isEn ? 'Target specific user groups or notify the entire farm network.' : 'ہدف اور ترجیح منتخب کریں۔'}
            </p>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Notification Title' : 'عنوان'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Vaccination Campaign in Sahiwal"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Target Audience' : 'ہدف سامعین'}
                  </label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All App Users</option>
                    <option value="farmers">Farmers Only</option>
                    <option value="dairy_buyers">Dairy Buyers</option>
                    <option value="vets">Veterinary Doctors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Priority' : 'ترجیح'}
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Message Body' : 'پیغام کی تفصیل'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed notification message text..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {isEn ? 'Broadcast Now' : 'ابھی نشر کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
