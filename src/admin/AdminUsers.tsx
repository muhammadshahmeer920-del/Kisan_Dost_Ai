import React, { useState } from 'react';
import { AdminUserItem, UserRole, UserAccountStatus, Language } from '../types';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Key,
  Shield,
  Download
} from 'lucide-react';
import { saveStoredAdminUsers, logAdminAction } from '../lib/storage';
import { getFarmersList, notifyAdminSync } from '../services/adminFarmerSync';

interface AdminUsersProps {
  users?: AdminUserItem[];
  language: Language;
  onRefreshUsers?: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  users = [],
  language,
  onRefreshUsers
}) => {
  const isEn = language === 'en';

  // Merge prop users with dynamic farmers list
  const farmersFromSync = getFarmersList();
  const mergedUsers = [...users];
  farmersFromSync.forEach(f => {
    if (!mergedUsers.some(u => u.id === f.id)) {
      mergedUsers.push(f);
    }
  });
  const safeUsers = mergedUsers;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [formData, setFormData] = useState<Partial<AdminUserItem>>({});

  const handleEditClick = (u: AdminUserItem) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      farmName: u.farmName,
      district: u.district
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = safeUsers.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          ...formData
        };
      }
      return u;
    });

    saveStoredAdminUsers(updated as AdminUserItem[]);
    notifyAdminSync('USER_UPDATED');
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'System Super Admin',
      action: `Updated User Profile & Role for ${editingUser.name} (${editingUser.id})`,
      targetEntity: 'AdminUserItem',
      targetId: editingUser.id,
      previousValue: `Role: ${editingUser.role}, Status: ${editingUser.status}`,
      newValue: `Role: ${formData.role}, Status: ${formData.status}`
    });

    setEditingUser(null);
    if (onRefreshUsers) onRefreshUsers();
  };

  const handleToggleStatus = (u: AdminUserItem) => {
    const nextStatus: UserAccountStatus = u.status === 'active' ? 'suspended' : 'active';
    const updated = safeUsers.map(item => item.id === u.id ? { ...item, status: nextStatus } : item);
    saveStoredAdminUsers(updated);
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'System Super Admin',
      action: `${nextStatus === 'suspended' ? 'Suspended' : 'Activated'} User Account`,
      targetEntity: 'AdminUserItem',
      targetId: u.id,
      previousValue: u.status,
      newValue: nextStatus
    });
    if (onRefreshUsers) onRefreshUsers();
  };

  const filtered = safeUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>{isEn ? 'Identity & Role-Based Access Control' : 'صارفین کی تصدیق و رول مینجمنٹ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'User Accounts Directory' : 'صارفین کی مرکزی ڈائرکٹری'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Manage farmer accounts, grant administrator privileges, inspect audit logs, and toggle account states.' 
              : 'صارفین کے اکاؤنٹس ایڈٹ کریں، ایڈمن اختیارات دیں یا سیکیورٹی مقاصد کے لیے معطل کریں۔'}
          </p>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
            {filtered.length} {isEn ? 'Users Filtered' : 'صارفین موجود'}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by User ID, Name, Phone, Email...' : 'آئی ڈی، نام، موبائل نمبر یا ای میل سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
          >
            <option value="all">{isEn ? 'All Roles' : 'تمام رولز'}</option>
            <option value="user">User / Farmer</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="moderator">Moderator</option>
            <option value="vet">Veterinarian</option>
            <option value="customer">Customer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
          >
            <option value="all">{isEn ? 'All Status' : 'تمام سٹیٹس'}</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-start">{isEn ? 'User Details' : 'صارف کی تفصیل'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Role' : 'رول'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'District / Farm' : 'ضلع و فارم'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Status' : 'اکاؤنٹ سٹیٹس'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Registered' : 'تاریخ شمولیت'}</th>
                <th className="py-3.5 px-4 text-end">{isEn ? 'Actions' : 'اختیارات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 rtl:space-x-reverse">
                          <span>{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({u.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {u.phone} • {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      u.role === 'admin' || u.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : u.role === 'vet'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                    {u.farmName || '—'}<br />
                    <span className="text-[11px] text-slate-400">{u.district}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {u.registrationDate}
                  </td>

                  <td className="py-3.5 px-4 text-end">
                    <div className="flex items-center justify-end space-x-1.5 rtl:space-x-reverse">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                        title={isEn ? 'Edit User & Role' : 'پروفائل اور رول تبدیل کریں'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg border text-xs ${
                          u.status === 'active'
                            ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950 text-rose-600'
                            : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                        }`}
                        title={u.status === 'active' ? (isEn ? 'Suspend Account' : 'اکاؤنٹ معطل کریں') : (isEn ? 'Activate Account' : 'ایکٹیو کریں')}
                      >
                        {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {isEn ? 'Edit User Account & Permissions' : 'صارف کا رول و تفصیلات تبدیل کریں'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {editingUser.name} ({editingUser.id})
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Full Name' : 'مکمل نام'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Assigned System Role' : 'سسٹم رول تفویض کریں'}
                  </label>
                  <select
                    value={formData.role || 'user'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="user">Normal User (Farmer)</option>
                    <option value="admin">Administrator</option>
                    <option value="super_admin">Super Administrator</option>
                    <option value="moderator">Moderator</option>
                    <option value="vet">Veterinarian</option>
                    <option value="customer">Marketplace Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Account Status' : 'اکاؤنٹ سٹیٹس'}
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as UserAccountStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Farm / Enterprise Name' : 'فارم کا نام'}
                </label>
                <input
                  type="text"
                  value={formData.farmName || ''}
                  onChange={e => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'District' : 'ضلع'}
                </label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isEn ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  {isEn ? 'Save User' : 'محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
