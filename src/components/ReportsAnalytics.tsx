import React from 'react';
import { Animal, FarmExpense, Language } from '../types';
import { t } from '../lib/translations';
import { BarChart3, TrendingUp, Milk, DollarSign, PieChart, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Pie, Cell } from 'recharts';

interface ReportsAnalyticsProps {
  animals: Animal[];
  expenses: FarmExpense[];
  language: Language;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ animals, expenses, language }) => {
  // Milk Yield Data over months
  const milkData = [
    { month: 'مارچ', milk: 28 },
    { month: 'اپریل', milk: 31 },
    { month: 'مئی', milk: 34.5 },
    { month: 'جون', milk: 33 },
    { month: 'جولائی', milk: 36 },
  ];

  // Expenses Data
  const expenseCategories = [
    { name: 'چارہ (Fodder)', value: 125000, color: '#10b981' },
    { name: 'ادویات (Medicine)', value: 24000, color: '#3b82f6' },
    { name: 'ویکسین (Vaccines)', value: 15000, color: '#8b5cf6' },
    { name: 'مزدوری (Labor)', value: 35000, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <BarChart3 className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('analytics', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          فارم دی مالیاتی پیش رفت، دودھ دی پیداوار اور اخراجات دا تفصیلی تجزیہ۔
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Milk Yield Trend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Milk className="w-4 h-4 text-sky-600 me-2" />
            <span>ماہانہ دودھ کی کل پیداوار (لیٹر)</span>
          </h3>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={milkData}>
                <defs>
                  <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="milk" name="دودھ (لیٹر)" stroke="#0284c7" fillOpacity={1} fill="url(#colorMilk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense Breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <DollarSign className="w-4 h-4 text-emerald-600 me-2" />
            <span>اخراجات کی تقسیم (Expense Categories)</span>
          </h3>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategories}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" name="رقم (PKR)" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
