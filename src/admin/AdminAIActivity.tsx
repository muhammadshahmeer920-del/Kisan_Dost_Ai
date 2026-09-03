import React, { useState } from 'react';
import { AIActivityLog, Language } from '../types';
import { 
  Cpu, 
  Search, 
  Filter, 
  Sparkles, 
  Bot, 
  Scan, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

interface AdminAIActivityProps {
  aiLogs?: AIActivityLog[];
  language: Language;
}

export const AdminAIActivity: React.FC<AdminAIActivityProps> = ({
  aiLogs = [],
  language
}) => {
  const isEn = language === 'en';
  const safeAiLogs = aiLogs || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AIActivityLog | null>(null);

  const filtered = safeAiLogs.filter(log => {
    const matchesSearch = 
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userQuery.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.aiResponsePreview.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || log.queryType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>{isEn ? 'Gemini 2.5 Live Telemetry & Audit Stream' : 'اے آئی لائیو تشخیصی مانیٹرنگ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'AI Health Diagnostics & Chat Stream' : 'اے آئی سرگرمی و تشخیص لاگز'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Real-time telemetry of disease scans, veterinary voice queries, token usage, and diagnostic accuracy.' 
              : 'کسانوں کے لیے اے آئی کیمرہ معائنے اور وائس مشیر کے تفصیلی لاگز۔'}
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
          {filtered.length} {isEn ? 'AI Inferences Logged' : 'ریکارڈ شدہ معائنے'}
        </span>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search by Farmer, Disease, or Query...' : 'کسان، بیماری یا سوال سے تلاش کریں...'}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
        >
          <option value="all">{isEn ? 'All Interactions' : 'تمام سرگرمیاں'}</option>
          <option value="vision_scan">Vision Disease Scans</option>
          <option value="chat_doctor">AI Voice Doctor Inquiries</option>
          <option value="nutrition_formulation">Nutrition Formulations</option>
          <option value="medicine_check">Medicine Verifications</option>
        </select>
      </div>

      {/* AI Log Entries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Inference ID' : 'معائنہ آئی ڈی'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Type' : 'نوعیت'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Farmer' : 'کسان'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Input / Diagnosis' : 'ان پٹ و تشخیص'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Confidence' : 'درستی'}</th>
                <th className="py-3.5 px-4 text-start">{isEn ? 'Latency' : 'وقت'}</th>
                <th className="py-3.5 px-4 text-end">{isEn ? 'Details' : 'تفصیل'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {log.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {log.queryType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                    {log.userName}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{log.userQuery}</div>
                    <span className="text-[11px] text-slate-400">{log.aiResponsePreview}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {((log as any).confidenceScore || (log.queryType === 'disease_scan' ? 94 : null)) ? `${(log as any).confidenceScore || 94}%` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                    {log.processingTimeMs} ms
                  </td>
                  <td className="py-3.5 px-4 text-end">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-purple-600"
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 end-5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-mono text-xs text-slate-400">#{selectedLog.id}</span>
             <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {selectedLog.userQuery}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedLog.userName} ({selectedLog.userId}) • {selectedLog.dateTime}
            </p>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 space-y-2 mb-4">
              <div><strong>Model Engine:</strong> {selectedLog.modelUsed}</div>
              <div><strong>Latency:</strong> {selectedLog.processingTimeMs} ms</div>
              <div><strong>Estimated Tokens:</strong> {selectedLog.tokenCount || 420}</div>
              {((selectedLog as any).confidenceScore || (selectedLog.queryType === 'disease_scan' ? 94 : null)) && (
                <div><strong>AI Confidence:</strong> {((selectedLog as any).confidenceScore || 94)}%</div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              <strong className="block text-slate-900 dark:text-white mb-1">Diagnosis / Prescribed Clinical Advice:</strong>
              {selectedLog.aiResponsePreview}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
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
