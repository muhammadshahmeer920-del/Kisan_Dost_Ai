import React, { useState } from 'react';
import { SystemReport, Language } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  Activity,
  PlusCircle,
  X
} from 'lucide-react';
import { saveStoredSystemReports, logAdminAction } from '../lib/storage';

interface AdminReportsProps {
  reports?: SystemReport[];
  language: Language;
  onRefreshReports?: () => void;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  reports = [],
  language,
  onRefreshReports
}) => {
  const isEn = language === 'en';
  const safeReports = reports || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemReport>>({
    reportType: 'outbreak_alert',
    severity: 'high',
    status: 'under_investigation'
  });

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: SystemReport = {
      id: `REP-${Date.now().toString(36).toUpperCase()}`,
      reportType: formData.reportType || 'outbreak_alert',
      district: formData.district || 'Sahiwal',
      diseaseName: formData.diseaseName || 'Foot & Mouth Disease',
      severity: formData.severity || 'high',
      affectedCount: formData.affectedCount || 10,
      reportedDate: new Date().toISOString().split('T')[0],
      status: formData.status || 'under_investigation',
      details: formData.details || 'Surveillance report initiated by District Admin.'
    };

    const updated = [newReport, ...safeReports];
    saveStoredSystemReports(updated);
    logAdminAction({
      adminId: 'admin_sys',
      adminName: 'Surveillance Officer',
      action: `Created new System Health Report ${newReport.id} for ${newReport.district}`,
      targetEntity: 'SystemReport',
      targetId: newReport.id
    });

    setShowAddModal(false);
    if (onRefreshReports) onRefreshReports();
  };

  const filtered = safeReports.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.diseaseName && r.diseaseName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDistrict = districtFilter === 'all' || r.district === districtFilter;

    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-black mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isEn ? 'Bio-Security Surveillance' : 'بیماریوں اور وباؤں کی علاقائی نگرانی'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Epidemic & Outbreak Reports' : 'وبائی الرٹس و ضلعی رپورٹس'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Real-time bio-surveillance, quarantine status, and livestock disease tracking across Punjab districts.' 
              : 'اضلاع میں جانوروں کے امراض اور حفاظتی ٹیکہ جات کی صورتحال کی مانیٹرنگ۔'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-red-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isEn ? 'Issue Outbreak Alert' : 'نیا الرٹ جاری کریں'}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by Report ID, District, Disease Name...' : 'رپورٹ نمبر، ضلع یا بیماری سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={districtFilter}
          onChange={e => setDistrictFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
        >
          <option value="all">{isEn ? 'All Districts' : 'تمام اضلاع'}</option>
          <option value="Sahiwal">Sahiwal</option>
          <option value="Lahore">Lahore</option>
          <option value="Faisalabad">Faisalabad</option>
          <option value="Multan">Multan</option>
          <option value="Bahawalpur">Bahawalpur</option>
          <option value="Kasur">Kasur</option>
          <option value="Sargodha">Sargodha</option>
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(r => (
          <div
            key={r.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-red-500/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-400">
                  #{r.id}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  r.severity === 'critical' || r.severity === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {r.severity} Severity
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2 rtl:space-x-reverse">
                <span>{r.diseaseName}</span>
                <span className="text-xs font-normal text-slate-500">in {r.district}</span>
              </h3>

              <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{isEn ? 'Affected Animals:' : 'متاثرہ جانور:'} <strong className="text-red-600">{r.affectedCount}</strong></span>
                <span>•</span>
                <span className="capitalize">{r.status.replace('_', ' ')}</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {r.details}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse">
                <Calendar className="w-3.5 h-3.5" />
                <span>{r.reportedDate}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {r.district}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {isEn ? 'Issue Bio-Security & Outbreak Report' : 'نئی وبائی صورتحال الرٹ جاری کریں'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isEn ? 'Enter the details of the health surveillance incident.' : 'ضلع اور متاثرہ جانوروں کی تعداد درج کریں۔'}
            </p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Disease Name' : 'بیماری کا نام'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foot & Mouth Disease (FMD)"
                  value={formData.diseaseName || ''}
                  onChange={e => setFormData({ ...formData, diseaseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'District' : 'ضلع'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahiwal"
                    value={formData.district || ''}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Affected Animals Count' : 'متاثرہ جانوروں کی تعداد'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.affectedCount || ''}
                    onChange={e => setFormData({ ...formData, affectedCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Clinical Observations & Quarantine Instructions' : 'تفصیلات و قرنطینہ ہدایات'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe transmission radius, vaccination urgency..."
                  value={formData.details || ''}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isEn ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all"
                >
                  {isEn ? 'Publish Alert' : 'الرٹ شائع کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
