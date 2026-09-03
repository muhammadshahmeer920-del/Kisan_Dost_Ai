import React, { useState } from 'react';
import { UnifiedRecord, Language } from '../types';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  FileSpreadsheet, 
  ArrowUpDown,
  Calendar,
  Layers
} from 'lucide-react';
import { logAdminAction } from '../lib/storage';

interface AdminRecordsProps {
  records?: UnifiedRecord[];
  language: Language;
  onRefreshRecords?: () => void;
}

export const AdminRecords: React.FC<AdminRecordsProps> = ({
  records = [],
  language,
  onRefreshRecords
}) => {
  const isEn = language === 'en';
  const safeRecords = records || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<UnifiedRecord | null>(null);

  const filtered = safeRecords.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recordType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === 'all' || r.module === selectedModule;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;

    return matchesSearch && matchesModule && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Record ID', 'Module', 'Type', 'Title', 'User', 'Date', 'Status', 'Amount PKR'];
    const rows = filtered.map(r => [
      r.id,
      r.module,
      r.recordType,
      `"${r.title.replace(/"/g, '""')}"`,
      r.userName,
      r.createdDate,
      r.status,
      r.amountPKR || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kisan_dost_records_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'System Admin',
      action: `Exported ${filtered.length} unified records to CSV`,
      targetEntity: 'UnifiedRecord',
      targetId: 'BULK_EXPORT'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>{isEn ? 'Universal Database Schema Aggregator' : 'تمام فارم و کسان ڈیٹا کا مرکزی ذخیرہ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Unified System Records' : 'مرکزی ڈیٹابیس ریکارڈز'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Complete cross-module ledger indexing livestock entries, disease diagnostics, dairy listings, and financial logs.' 
              : 'مویشی، اے آئی بیماری سکینز، ڈیری مصنوعات، اور کسان اخراجات کے تمام ریکارڈز۔'}
          </p>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? 'Export CSV' : 'سی ایس وی ایکسپورٹ'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by Record ID, Title, Farmer Name...' : 'آئی ڈی، عنوان یا کسان کے نام سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
          >
            <option value="all">{isEn ? 'All Modules' : 'تمام ماڈیولز'}</option>
            <option value="livestock">Livestock</option>
            <option value="scans">AI Diagnostics</option>
            <option value="dairy">Dairy Store</option>
            <option value="orders">Market Orders</option>
            <option value="expenses">Expenses</option>
            <option value="appointments">Vet Clinics</option>
            <option value="outbreaks">Outbreaks</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
          >
            <option value="all">{isEn ? 'All Status' : 'تمام سٹیٹس'}</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Record ID' : 'ریکارڈ نمبر'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Module' : 'ماڈیول'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Title & Type' : 'عنوان و قسم'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Associated User' : 'متعلقہ کسان'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Date' : 'تاریخ'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Status' : 'سٹیٹس'}</th>
                <th className="py-3.5 px-4 text-end">{isEn ? 'Actions' : 'اختیارات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {r.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {r.module}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    <div className="font-bold">{r.title}</div>
                    <span className="text-[11px] text-slate-400">{r.recordType}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {r.userName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {r.createdDate}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      r.status === 'completed' || r.status === 'resolved' || r.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title={isEn ? 'Inspect Record' : 'تفصیلات دیکھیں'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {selectedRecord.module}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedRecord.id}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
              {selectedRecord.title}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedRecord.recordType} • {selectedRecord.userName} ({selectedRecord.userId})
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs mb-5">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isEn ? 'Record Structured Data' : 'ڈیٹا کی تفصیل'}
              </h4>
              {Object.entries(selectedRecord.details || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                  <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-end max-w-xs truncate">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
              >
                {isEn ? 'Close' : 'بند کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
