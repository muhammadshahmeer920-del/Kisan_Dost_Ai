import React, { useState } from 'react';
import { 
  User, 
  Animal, 
  Language, 
  AIExecutionMode, 
  DairyProduct, 
  Appointment, 
  FarmExpense,
  CustomerOrderLead,
  Order
} from '../types';
import { 
  Scan, 
  Bot, 
  Stethoscope, 
  Wheat, 
  Syringe, 
  TrendingDown, 
  Award, 
  Pill, 
  BookOpen, 
  Store, 
  QrCode, 
  ListOrdered,
  ArrowLeft,
  Sparkles,
  MapPin,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

import { AnimalManagement } from '../components/AnimalManagement';
import { DairyStore } from '../components/DairyStore';
import { AIAssistant } from '../components/AIAssistant';
import { VeterinaryPortal } from '../components/VeterinaryPortal';
import { NutritionPlanner } from '../components/NutritionPlanner';
import { VaccinationCenter } from '../components/VaccinationCenter';
import { ExpenseManager } from '../components/ExpenseManager';
import { DigitalLicenseCard } from '../components/DigitalLicenseCard';
import { MedicineChecker } from '../components/MedicineChecker';
import { OfflineKnowledgePack } from '../components/OfflineKnowledgePack';
import { EarTagQRScanner } from '../components/EarTagQRScanner';
import { NearbyVetsMap } from '../components/NearbyVetsMap';
import { OutbreakShield } from '../components/OutbreakShield';
import { BiosecurityAssessment } from '../components/BiosecurityAssessment';

interface UserServicesProps {
  initialService?: string;
  user: User;
  animals: Animal[];
  dairyProducts: DairyProduct[];
  appointments: Appointment[];
  expenses: FarmExpense[];
  customerOrders: CustomerOrderLead[];
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  executionMode: AIExecutionMode;
  onToggleExecutionMode: () => void;
  onSaveAnimal: (animal: Animal) => void;
  onDeleteAnimal: (id: string) => void;
  onSaveDairyProduct: (product: DairyProduct) => void;
  onDeleteDairyProduct: (id: string) => void;
  onCreateOrder?: (order: Order) => void;
  onBookAppointment: (appointment: Appointment) => void;
  handleAddVaccination: (animalId: string, vaccination: any) => void;
  handleAddExpense: (expense: FarmExpense) => void;
  handleSaveScanJournal: (animalId: string, entry: any) => void;
}

export const UserServices: React.FC<UserServicesProps> = ({
  initialService = 'hub',
  user,
  animals,
  dairyProducts,
  appointments,
  expenses,
  customerOrders,
  language,
  onLanguageChange,
  executionMode,
  onToggleExecutionMode,
  onSaveAnimal,
  onDeleteAnimal,
  onSaveDairyProduct,
  onDeleteDairyProduct,
  onCreateOrder,
  onBookAppointment,
  handleAddVaccination,
  handleAddExpense,
  handleSaveScanJournal
}) => {
  const isEn = language === 'en';
  const [activeService, setActiveService] = useState<string>(initialService);

  const servicesList = [
    {
      id: 'animals',
      title: isEn ? 'Livestock Herd Registry' : 'مویشی فارم مینجمنٹ',
      desc: isEn ? 'Digital records, lactation, breeding history' : 'جانوروں کا اندراج، دودھ، اور بریڈنگ ریکارڈ',
      icon: ListOrdered,
      color: 'bg-emerald-600',
      badge: `${animals.length} Heads`
    },
    {
      id: 'assistant',
      title: isEn ? 'AI Voice Farm Doctor' : 'اے آئی وائس فارم ڈاکٹر',
      desc: isEn ? 'Multilingual farm voice consultation & camera scanning' : 'اردو، پنجابی میں کیمرہ معائنہ اور جانوروں کے امراض پر مفت رہنمائی',
      icon: Bot,
      color: 'bg-teal-600',
      badge: 'Voice & Scanner'
    },
    {
      id: 'dairystore',
      title: isEn ? 'Pure Dairy Store' : 'خالص دودھ و ڈیری شاپ',
      desc: isEn ? 'Direct consumer sales and pricing' : 'کھویا، دیسی گھی، اور دودھ کی براہ راست سیلز',
      icon: Store,
      color: 'bg-blue-600',
      badge: `${dairyProducts.length} Products`
    },
    {
      id: 'vets',
      title: isEn ? 'Veterinary Appointments' : 'ویٹرنری ڈاکٹر بکنگ',
      desc: isEn ? 'Certified local vets for on-site farm visits' : 'ماہر ڈاکٹرز سے وقت لیں یا آن لائن مشورہ کریں',
      icon: Stethoscope,
      color: 'bg-indigo-600',
      badge: 'Verified Vets'
    },
    {
      id: 'nutrition',
      title: isEn ? 'Nutrition & Feed Formulator' : 'خوراک و ونڈا راشن پلانر',
      desc: isEn ? 'Maximize daily milk yield & cut feeding cost' : 'دودھ بڑھانے اور ونڈے کے سستے فارمولے',
      icon: Wheat,
      color: 'bg-amber-600',
      badge: 'Yield Boost'
    },
    {
      id: 'vaccines',
      title: isEn ? 'Vaccination & Bio-Security' : 'حفاظتی ٹیکہ جات سینٹر',
      desc: isEn ? 'Automated scheduling for FMD, Anthrax' : 'منہ کھر، گل گھوٹو، اور لمپی سکن شیڈول',
      icon: Syringe,
      color: 'bg-purple-600',
      badge: 'Auto Alerts'
    },
    {
      id: 'expenses',
      title: isEn ? 'Expense & Profit Ledger' : 'فارم اخراجات و منافع کھاتہ',
      desc: isEn ? 'Feed, labor, medicine, and revenue tracking' : 'خوراک، لیبر، ادویات اور منافع کا مکمل حساب',
      icon: TrendingDown,
      color: 'bg-rose-600',
      badge: 'Financials'
    },
    {
      id: 'qr_scanner',
      title: isEn ? 'QR Tag Smart Scanner' : 'کیو آر ٹیگ کیمرہ سکینر',
      desc: isEn ? 'Instant animal lookup from ear tags' : 'کان کے ٹیگ سے جانور کی مکمل ہسٹری تلاش کریں',
      icon: QrCode,
      color: 'bg-slate-700',
      badge: 'Camera'
    },
    {
      id: 'map',
      title: isEn ? 'Nearby Veterinary Map' : 'قریبی ویٹرنری کلینک میپ',
      desc: isEn ? 'Locate hospitals and drug stores' : 'ضلع کے قریبی ہسپتال اور ادویات کی دکانیں',
      icon: MapPin,
      color: 'bg-emerald-800',
      badge: 'GPS Map'
    },
    {
      id: 'biosecurity',
      title: isEn ? 'Biosecurity Assessment' : 'فارم بائیو سیکیورٹی اسسمنٹ',
      desc: isEn ? 'Self-audit shed biosecurity & AI local disease risk defense' : 'فارم معائنہ، وبائی خطرات کا تجزیہ و اے آئی حفاظتی پلان',
      icon: ShieldCheck,
      color: 'bg-emerald-600',
      badge: 'AI Shield'
    },
    {
      id: 'outbreaks',
      title: isEn ? 'Disease Outbreak Radar' : 'وبا و الرٹ ریڈار',
      desc: isEn ? 'Bio-security alerts and radius safety' : 'علاقے میں پھیلنے والی بیماریوں سے پیشگی آگاہی',
      icon: ShieldAlert,
      color: 'bg-red-700',
      badge: 'Bio-Shield'
    },
    {
      id: 'medicine',
      title: isEn ? 'Veterinary Medicine Checker' : 'ادویات و ڈوز چیکر',
      desc: isEn ? 'Verify dosage, withdrawal periods, and usage' : 'صحیح مقدار اور احتیاطی تدابیر کی جانچ',
      icon: Pill,
      color: 'bg-teal-700',
      badge: 'Safe Dose'
    },
    {
      id: 'license',
      title: isEn ? 'Digital Farm ID & License' : 'ڈیجیٹل کسان فارم کارڈ',
      desc: isEn ? 'Download verified certificate' : 'قومی ڈیجیٹل کسان تصدیقی کارڈ ڈاؤن لوڈ کریں',
      icon: Award,
      color: 'bg-yellow-700',
      badge: 'Verified ID'
    },
    {
      id: 'offline_knowledge',
      title: isEn ? 'Offline Knowledge Book' : 'آف لائن فارمنگ انسائیکلوپیڈیا',
      desc: isEn ? 'Complete Urdu livestock guide' : 'بغیر انٹرنیٹ کے مویشی پال گائیڈ',
      icon: BookOpen,
      color: 'bg-slate-800',
      badge: '100% Offline'
    }
  ];

  if (activeService === 'hub') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Complete Livestock Ecosystem' : 'مکمل فارمنگ ٹولز و سروسز'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Farm Operations & AI Services' : 'فارم سروسز اور سہولیات کا مرکز'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn 
              ? 'Select any professional module to record livestock data, run AI diagnoses, manage dairy production, or consult vets.'
              : 'جانوروں کا اندراج کرنے، اے آئی معائنے، ڈیری سیلز یا ڈاکٹر رابطہ کے لیے متعلقہ سروس منتخب کریں۔'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicesList.map(srv => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                onClick={() => setActiveService(srv.id)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${srv.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {srv.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{isEn ? 'Launch Service' : 'اوپن کریں'}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Service View with Back to Hub Navigation
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveService('hub')}
          className="flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isEn ? 'All Farm Services' : 'تمام فارم سروسز پر واپس'}</span>
        </button>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {activeService.replace('_', ' ')}
        </span>
      </div>

      {activeService === 'animals' && (
        <AnimalManagement
          animals={animals}
          onSaveAnimal={onSaveAnimal}
          onDeleteAnimal={onDeleteAnimal}
          language={language}
          onNavigateToDairyStore={() => setActiveService('dairystore')}
        />
      )}

      {activeService === 'dairystore' && (
        <DairyStore
          products={dairyProducts}
          user={user}
          onSaveProduct={onSaveDairyProduct}
          onDeleteProduct={onDeleteDairyProduct}
          onCreateOrder={onCreateOrder}
          language={language}
        />
      )}

      {(activeService === 'scanner' || activeService === 'assistant') && (
        <AIAssistant
          language={language}
          onLanguageChange={onLanguageChange}
          executionMode={executionMode}
          onToggleExecutionMode={onToggleExecutionMode}
          animals={animals}
          onSaveScanJournal={handleSaveScanJournal}
          initialMode={activeService === 'scanner' ? 'scanner' : 'chat'}
        />
      )}

      {activeService === 'vets' && (
        <VeterinaryPortal
          animals={animals}
          appointments={appointments}
          onBookAppointment={onBookAppointment}
          language={language}
        />
      )}

      {activeService === 'nutrition' && (
        <NutritionPlanner animals={animals} language={language} executionMode={executionMode} />
      )}

      {activeService === 'vaccines' && (
        <VaccinationCenter
          animals={animals}
          onAddVaccination={handleAddVaccination}
          language={language}
        />
      )}

      {activeService === 'expenses' && (
        <ExpenseManager expenses={expenses} onAddExpense={handleAddExpense} language={language} />
      )}

      {activeService === 'qr_scanner' && (
        <EarTagQRScanner
          animals={animals}
          language={language}
          onClose={() => setActiveService('hub')}
          onNavigateToAIDoctor={() => setActiveService('assistant')}
          onUpdateAnimal={onSaveAnimal}
        />
      )}

      {activeService === 'map' && <NearbyVetsMap language={language} />}
      {activeService === 'biosecurity' && (
        <BiosecurityAssessment
          user={user}
          animals={animals}
          language={language}
          executionMode={executionMode}
        />
      )}
      {activeService === 'outbreaks' && <OutbreakShield language={language} />}
      {activeService === 'license' && <DigitalLicenseCard user={user} animals={animals} language={language} />}
      {activeService === 'medicine' && <MedicineChecker language={language} />}
      {activeService === 'offline_knowledge' && <OfflineKnowledgePack language={language} />}
    </div>
  );
};
