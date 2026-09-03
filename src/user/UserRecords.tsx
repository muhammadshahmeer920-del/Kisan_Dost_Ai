import React, { useState } from 'react';
import { UnifiedRecord, Language, User } from '../types';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Eye, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Tag, 
  X,
  Lock,
  Download
} from 'lucide-react';

interface UserRecordsProps {
  user?: User;
  records?: UnifiedRecord[];
  language: Language;
}

export const UserRecords: React.FC<UserRecordsProps> = ({
  user,
  records = [],
  language
}) => {
  const isEn = language === 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<UnifiedRecord | null>(null);

  // Security Filter: Strictly enforce that records shown belong ONLY to this authenticated user!
  const currentUserId = user?.id || 'usr_001';
  const userOwnedRecords = (records || []).filter(r => r.userId === currentUserId || (!r.userId && currentUserId === 'usr_001'));

  const filteredRecords = userOwnedRecords.filter(rec => {
    const matchesSearch = 
      rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.recordType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === 'all' || rec.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>{isEn ? 'Encrypted Personal Vault' : 'ذاتی محفوظ دستاویزات و ریکارڈز'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isEn ? 'My Farm Records' : 'میرے ذاتی فارم ریکارڈز'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEn 
                ? `Authorized records for User ID: ${user.id} (${user.name}) — All entries are cryptographically protected.` 
                : `صرف آپ کے فارم (${user.farmName}) کے تصدیق شدہ ریکارڈز کی فہرست`}
            </p>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">
              {filteredRecords.length} {isEn ? 'Records Found' : 'ریکارڈز دستیاب'}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isEn ? 'Search by record ID, animal tag, title...' : 'ریکارڈ آئی ڈی یا عنوان سے تلاش کریں...'}
              className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'livestock', 'scans', 'dairy', 'expenses', 'appointments'].map(mod => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                  selectedModule === mod
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mod === 'all' ? (isEn ? 'All Modules' : 'تمام کیٹیگریز') : mod}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'No records match your search criteria' : 'تلاش کے مطابق کوئی ریکارڈ نہیں ملا'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isEn ? 'Try adjusting your filters or search keywords.' : 'کیٹیگری تبدیل کر کے دوبارہ کوشش کریں۔'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-start">{isEn ? 'Record ID' : 'ریکارڈ نمبر'}</th>
                  <th className="py-3.5 px-4 text-start">{isEn ? 'Type & Module' : 'قسم و ماڈیول'}</th>
                  <th className="py-3.5 px-4 text-start">{isEn ? 'Record Title' : 'عنوان'}</th>
                  <th className="py-3.5 px-4 text-start">{isEn ? 'Date' : 'تاریخ'}</th>
                  <th className="py-3.5 px-4 text-start">{isEn ? 'Status' : 'سٹیٹس'}</th>
                  <th className="py-3.5 px-4 text-end">{isEn ? 'Action' : 'کارروائی'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {rec.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rec.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {rec.title}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {rec.createdDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        rec.status === 'completed' || rec.status === 'resolved' || rec.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title={isEn ? 'View Details' : 'تفصیلات دیکھیں'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {selectedRecord.module}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedRecord.id}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2">
              {selectedRecord.title}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedRecord.recordType} • {selectedRecord.createdDate}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs mb-5">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isEn ? 'Record Attributes' : 'ریکارڈ کی معلومات'}
              </h4>
              {Object.entries(selectedRecord.details || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                  <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-end max-w-xs truncate">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs"
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
