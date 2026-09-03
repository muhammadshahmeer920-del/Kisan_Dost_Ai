import React, { useState } from 'react';
import { FarmExpense, Language } from '../types';
import { t } from '../lib/translations';
import { Receipt, Plus, DollarSign, Calendar, TrendingDown, Tag } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: FarmExpense[];
  onAddExpense: (expense: FarmExpense) => void;
  language: Language;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onAddExpense, language }) => {
  const [category, setCategory] = useState<'feed' | 'medicine' | 'vaccine' | 'vet_fee' | 'labor' | 'equipment' | 'other'>('feed');
  const [amountPKR, setAmountPKR] = useState(15000);
  const [description, setDescription] = useState('سبز چارہ اور 2 بوڑیاں ونڈا خریداری');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: FarmExpense = {
      id: 'exp_' + Date.now(),
      farmerId: 'usr_001',
      category,
      amountPKR,
      description,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Chaudhry Ahmed Ali',
    };
    onAddExpense(newExp);
    alert('خرچہ کامیابی سے لائیو ریکارڈ میں شامل ہو گیا۔');
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amountPKR, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Receipt className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('expenseManager', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          چارے، ادویات، ڈاکٹر فیس اور فارم ملازمین دا روزانہ خرچہ ریکارڈ رکھیں۔
        </p>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 to-green-700 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-emerald-100 block">فارم دا کل خرچہ (Total Expense Recorded):</span>
          <h3 className="text-3xl font-bold mt-1">PKR {totalExpense.toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
          <TrendingDown className="w-8 h-8 text-amber-300" />
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">نیا خرچہ درج کریں</h3>

        <form onSubmit={handleCreateExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">کٹیگری:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            >
              <option value="feed">چارہ / ونڈا (Feed & Fodder)</option>
              <option value="medicine">ادویات (Medicines)</option>
              <option value="vaccine">ویکسین (Vaccines)</option>
              <option value="vet_fee">ڈاکٹر فیس (Vet Consultation)</option>
              <option value="labor">مزدوری (Labor)</option>
              <option value="equipment">سامان / آلات (Equipment)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم (PKR):</label>
            <input
              type="number"
              value={amountPKR}
              onChange={(e) => setAmountPKR(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تفصیل:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-all"
            >
              خرچہ محفوظ کریں
            </button>
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">سابقہ اخراجات دی فہرست</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.map((exp) => (
            <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{exp.description}</span>
                <span className="text-[10px] text-slate-400">{exp.date} • {exp.category}</span>
              </div>
              <span className="font-bold text-red-600 text-sm">- PKR {exp.amountPKR.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
