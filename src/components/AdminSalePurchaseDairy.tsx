import React, { useState, useMemo } from 'react';
import { Animal, DairyProduct, FarmExpense, Language, User, CustomerOrderLead, Species } from '../types';
import { 
  Store, 
  Milk, 
  TrendingUp, 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Tag, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRightLeft, 
  FileText, 
  Eye, 
  ExternalLink,
  Filter,
  Layers,
  Activity,
  PackageCheck,
  UserCheck,
  Building,
  Clock,
  Send,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminSalePurchaseDairyProps {
  animals: Animal[];
  dairyProducts: DairyProduct[];
  expenses: FarmExpense[];
  customerOrders: CustomerOrderLead[];
  user: User;
  language: Language;
  onSaveAnimal: (animal: Animal) => void;
  onSaveDairyProduct: (product: DairyProduct) => void;
  onDeleteDairyProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: 'new' | 'contacted' | 'delivered' | 'cancelled') => void;
  onSwitchToCustomerView: () => void;
  onNavigateTab: (tab: any) => void;
}

export const AdminSalePurchaseDairy: React.FC<AdminSalePurchaseDairyProps> = ({
  animals,
  dairyProducts,
  expenses,
  customerOrders,
  user,
  language,
  onSaveAnimal,
  onSaveDairyProduct,
  onDeleteDairyProduct,
  onUpdateOrderStatus,
  onSwitchToCustomerView,
  onNavigateTab,
}) => {
  const isEn = language === 'en';
  const isRtl = language === 'ur' || language === 'pb';

  // Sub-tabs in Admin Commerce Portal
  const [activeAdminSection, setActiveAdminSection] = useState<'overview' | 'livestock_sale_purchase' | 'dairy_inventory' | 'customer_orders'>('overview');

  // Search & Filter States
  const [livestockSearch, setLivestockSearch] = useState('');
  const [dairySearch, setDairySearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Quick Price Edit Modal for Dairy
  const [quickPriceProduct, setQuickPriceProduct] = useState<DairyProduct | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<number>(220);

  // Add/Edit Dairy Product Modal
  const [isDairyModalOpen, setIsDairyModalOpen] = useState(false);
  const [editingDairyProduct, setEditingDairyProduct] = useState<DairyProduct | null>(null);
  const [dairyFormData, setDairyFormData] = useState<Partial<DairyProduct>>({
    name: 'خالص گائے کا دودھ (Fresh Cow Milk)',
    category: 'milk',
    pricePKR: 220,
    unit: 'liter',
    dailyCapacity: '50 لیٹر روزانہ',
    isOrganic: true,
    inStock: true,
    description: '100% خالص آرگینک مصنوعات، بغیر کسی کیمیائی ملاوٹ یا پانی کے۔',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
    farmName: user.farmName || 'Al-Madina Dairy Farm',
    sellerName: user.name || 'Chaudhry Ahmed Ali',
    sellerPhone: user.phone || '0300-1234567',
    sellerCity: user.district || 'Sahiwal',
  });

  // Quick Edit Livestock Sale Modal
  const [selectedAnimalForSaleModal, setSelectedAnimalForSaleModal] = useState<Animal | null>(null);
  const [askingPriceInput, setAskingPriceInput] = useState<number>(250000);
  const [saleDescInput, setSaleDescInput] = useState<string>('');
  const [sellerCityInput, setSellerCityInput] = useState<string>('Sahiwal');

  // Photo presets for Dairy
  const photoPresets = [
    { label: 'خالص دودھ (Milk)', category: 'milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
    { label: 'گاڑھا دہی (Yogurt)', category: 'yogurt', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600' },
    { label: 'دیسی گھی (Desi Ghee)', category: 'ghee', url: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=600' },
    { label: 'سفید مکھن (White Butter)', category: 'butter', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600' },
    { label: 'کھویا (Pure Khoya)', category: 'khoya', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600' },
    { label: 'مکھن لسی (Lassi)', category: 'lassi', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600' },
  ];

  // Calculated Commerce Metrics
  const metrics = useMemo(() => {
    const totalAnimals = animals.length;
    const totalMarketValue = animals.reduce((sum, a) => sum + (a.currentMarketValue || 0), 0);
    const totalPurchaseCost = animals.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
    const capitalAppreciation = totalMarketValue - totalPurchaseCost;
    const appreciationPercent = totalPurchaseCost > 0 ? ((capitalAppreciation / totalPurchaseCost) * 100).toFixed(1) : '0';

    const listedForSaleAnimals = animals.filter((a) => a.isListedForSale !== false);
    const totalMandiAskingValue = listedForSaleAnimals.reduce(
      (sum, a) => sum + (a.askingPrice || a.currentMarketValue || 0), 
      0
    );

    const totalDairyProducts = dairyProducts.length;
    const inStockProducts = dairyProducts.filter((p) => p.inStock).length;
    
    // Daily milk yield revenue calculation
    const dailyMilkLiters = animals.reduce((sum, a) => sum + (a.milkYieldLitersPerDay || 0), 0);
    const milkPricePerLiter = dairyProducts.find((p) => p.category === 'milk')?.pricePKR || 220;
    const estimatedDailyMilkRevenue = Math.round(dailyMilkLiters * milkPricePerLiter);
    const estimatedMonthlyMilkRevenue = estimatedDailyMilkRevenue * 30;

    const newOrdersCount = customerOrders.filter((o) => o.status === 'new').length;
    const totalOrdersVolumePKR = customerOrders.reduce((sum, o) => sum + o.totalAmountPKR, 0);

    return {
      totalAnimals,
      totalMarketValue,
      totalPurchaseCost,
      capitalAppreciation,
      appreciationPercent,
      listedForSaleCount: listedForSaleAnimals.length,
      totalMandiAskingValue,
      totalDairyProducts,
      inStockProducts,
      dailyMilkLiters,
      estimatedDailyMilkRevenue,
      estimatedMonthlyMilkRevenue,
      newOrdersCount,
      totalOrdersVolumePKR,
    };
  }, [animals, dairyProducts, customerOrders]);

  // Handle Toggle List for Sale
  const handleToggleListForSale = (animal: Animal) => {
    const isCurrentlyListed = animal.isListedForSale !== false;
    const updated: Animal = {
      ...animal,
      isListedForSale: !isCurrentlyListed,
      askingPrice: animal.askingPrice || Math.round(animal.currentMarketValue * 1.05),
      sellerCity: animal.sellerCity || user.district || 'Sahiwal',
      sellerPhone: animal.sellerPhone || user.phone || '0300-1234567',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveAnimal(updated);
  };

  // Save Livestock Listing Changes
  const handleSaveLivestockSaleModal = () => {
    if (!selectedAnimalForSaleModal) return;
    const updated: Animal = {
      ...selectedAnimalForSaleModal,
      isListedForSale: true,
      askingPrice: Number(askingPriceInput),
      saleDescription: saleDescInput,
      sellerCity: sellerCityInput,
      sellerPhone: selectedAnimalForSaleModal.sellerPhone || user.phone || '0300-1234567',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveAnimal(updated);
    setSelectedAnimalForSaleModal(null);
  };

  // Handle Quick Dairy Price Change
  const handleSaveQuickPrice = () => {
    if (!quickPriceProduct) return;
    const updated: DairyProduct = {
      ...quickPriceProduct,
      pricePKR: Number(quickPriceValue),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveDairyProduct(updated);
    setQuickPriceProduct(null);
  };

  // Toggle Dairy Stock
  const handleToggleDairyStock = (prod: DairyProduct) => {
    const updated: DairyProduct = {
      ...prod,
      inStock: !prod.inStock,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveDairyProduct(updated);
  };

  // Open Add Dairy
  const handleOpenAddDairy = () => {
    setEditingDairyProduct(null);
    setDairyFormData({
      name: 'خالص گائے کا دودھ (Fresh Cow Milk)',
      category: 'milk',
      pricePKR: 220,
      unit: 'liter',
      dailyCapacity: '50 لیٹر روزانہ',
      isOrganic: true,
      inStock: true,
      description: '100% خالص آرگینک مصنوعات، بغیر کسی کیمیائی ملاوٹ یا پانی کے۔',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
      farmName: user.farmName || 'Al-Madina Dairy Farm',
      sellerName: user.name || 'Chaudhry Ahmed Ali',
      sellerPhone: user.phone || '0300-1234567',
      sellerCity: user.district || 'Sahiwal',
    });
    setIsDairyModalOpen(true);
  };

  // Open Edit Dairy
  const handleOpenEditDairy = (prod: DairyProduct) => {
    setEditingDairyProduct(prod);
    setDairyFormData({ ...prod });
    setIsDairyModalOpen(true);
  };

  // Submit Dairy Modal Form
  const handleSubmitDairyForm = (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave: DairyProduct = {
      id: editingDairyProduct?.id || 'dry_' + Date.now(),
      sellerId: editingDairyProduct?.sellerId || user.id,
      name: dairyFormData.name || 'Fresh Milk',
      category: dairyFormData.category || 'milk',
      pricePKR: Number(dairyFormData.pricePKR) || 220,
      unit: dairyFormData.unit || 'liter',
      dailyCapacity: dairyFormData.dailyCapacity || '50 لیٹر',
      isOrganic: dairyFormData.isOrganic ?? true,
      inStock: dairyFormData.inStock ?? true,
      description: dairyFormData.description || '100% خالص مصنوعات۔',
      imageUrl: dairyFormData.imageUrl || photoPresets[0].url,
      farmName: user.farmName || 'Al-Madina Dairy Farm',
      sellerName: user.name || 'Chaudhry Ahmed Ali',
      sellerPhone: user.phone || '0300-1234567',
      sellerCity: user.district || 'Sahiwal',
      rating: editingDairyProduct?.rating || 5.0,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveDairyProduct(productToSave);
    setIsDairyModalOpen(false);
  };

  // Filtered Livestock List for Admin
  const filteredLivestock = useMemo(() => {
    return animals.filter((a) => {
      return (
        a.name.toLowerCase().includes(livestockSearch.toLowerCase()) ||
        a.tagId.toLowerCase().includes(livestockSearch.toLowerCase()) ||
        a.breed.toLowerCase().includes(livestockSearch.toLowerCase())
      );
    });
  }, [animals, livestockSearch]);

  // Filtered Dairy Products for Admin
  const filteredDairy = useMemo(() => {
    return dairyProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(dairySearch.toLowerCase()) ||
        p.category.toLowerCase().includes(dairySearch.toLowerCase())
      );
    });
  }, [dairyProducts, dairySearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((o) => {
      if (orderFilter === 'all') return true;
      return o.status === orderFilter;
    });
  }, [customerOrders, orderFilter]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Admin Commercial Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-black shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEn ? 'Farm Executive Admin & Commerce Portal' : 'فارم ایڈمن و سیل پرچیز کنٹرول سینٹر'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isEn ? 'Livestock Sales, Purchases & Dairy Production' : 'لائیو اسٹاک سیل پرچیز اور ڈیری پروڈکشن منیجر'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {isEn
                ? 'Manage mandi sale listings, live animal purchase valuations, dairy store pricing, stock capacity, and customer order delivery leads.'
                : 'مویشی منڈی میں سیل لسٹنگ، جانوروں کی خریداری کا حساب، ڈیری پروڈکٹس کی قیمتیں، اسٹاک کنٹرول اور گاہکوں کے آرڈرز کا مکمل انتظام کریں۔'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-bold text-slate-300">
              <span className="bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                {user.farmName} ({user.district})
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-800/60">
                {metrics.inStockProducts} {isEn ? 'Active Dairy Items' : 'ڈیری مصنوعات لائیو'}
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-800/60">
                {metrics.listedForSaleCount} {isEn ? 'Animals for Sale' : 'جانور منڈی میں لسٹڈ'}
              </span>
            </div>
          </div>

          {/* Right Fast Switch to Customer View */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
            <button
              onClick={onSwitchToCustomerView}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg shadow-emerald-500/20 transition-all"
              title={isEn ? 'Open Customer Frontage' : 'کسٹمر بازار فرنٹ پیج کھولیں'}
            >
              <Store className="w-4 h-4 text-slate-950" />
              <span>{isEn ? 'View Customer Frontage' : 'کسٹمر بازار فرنٹ پیج دیکھیں'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
            </button>

            <button
              onClick={handleOpenAddDairy}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse border border-white/20 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? '+ Add New Dairy Item' : '+ نئی ڈیری پروڈکٹ شامل کریں'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Herd Valuation */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Herd Valuation' : 'کل مویشی مارکیٹ ویلیو'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              Rs. {metrics.totalMarketValue.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{metrics.appreciationPercent}% {isEn ? 'Capital Gain' : 'منافع کی شرح'}
            </div>
          </div>
        </div>

        {/* Live Mandi Listed Animals */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Mandi Active Listings' : 'منڈی میں برائے فروخت'}
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.listedForSaleCount} {isEn ? 'Animals' : 'جانور'}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-0.5">
              Rs. {metrics.totalMandiAskingValue.toLocaleString()} {isEn ? 'Asking Val' : 'کل ڈیمانڈ'}
            </div>
          </div>
        </div>

        {/* Daily Milk Production Value */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Daily Dairy Yield' : 'روزانہ دودھ کی پیداوار'}
            </span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Milk className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.dailyMilkLiters} {isEn ? 'Liters / Day' : 'لیٹر روزانہ'}
            </div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              Rs. {metrics.estimatedDailyMilkRevenue.toLocaleString()} {isEn ? 'Est. Daily' : 'آمدن روزانہ'}
            </div>
          </div>
        </div>

        {/* Customer Inquiries & Leads */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Customer Order Leads' : 'کسٹمر آرڈرز و لیڈز'}
            </span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.newOrdersCount} {isEn ? 'New Orders' : 'نئے آرڈرز'}
            </div>
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              Rs. {metrics.totalOrdersVolumePKR.toLocaleString()} {isEn ? 'Total Volume' : 'کل مالیت'}
            </div>
          </div>
        </div>

      </div>

      {/* Admin Section Tabs Navigation */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-none">
        
        <button
          onClick={() => setActiveAdminSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
            activeAdminSection === 'overview'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>{isEn ? 'Commerce Dashboard' : 'سیل پرچیز و ڈیری ڈیش بورڈ'}</span>
        </button>

        <button
          onClick={() => setActiveAdminSection('livestock_sale_purchase')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
            activeAdminSection === 'livestock_sale_purchase'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>{isEn ? 'Livestock Sale & Purchase Mandi' : 'مویشی فروخت و خریداری منڈی'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {animals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSection('dairy_inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
            activeAdminSection === 'dairy_inventory'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Milk className="w-3.5 h-3.5" />
          <span>{isEn ? 'Dairy Products & Instant Pricing' : 'ڈیری پراڈکٹس و قیمتیں منیجر'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {dairyProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminSection('customer_orders')}
          className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
            activeAdminSection === 'customer_orders'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isEn ? 'Customer Inquiries & Orders' : 'کسٹمر آرڈرز و لیڈز'}</span>
          {metrics.newOrdersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {metrics.newOrdersCount}
            </span>
          )}
        </button>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: COMMERCE & PRODUCTION OVERVIEW                                 */}
      {/* ========================================================================= */}
      {activeAdminSection === 'overview' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Sale Purchase Quick Matrix */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Actions Panel */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 me-2" />
                    <span>{isEn ? 'Quick Commercial Actions' : 'فوری کمرشل اور سیل پرچیز ایکشنز'}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <button
                    onClick={() => setActiveAdminSection('dairy_inventory')}
                    className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold hover:bg-emerald-100 transition-all text-start space-y-1"
                  >
                    <Milk className="w-5 h-5 text-emerald-600" />
                    <span className="block font-black">{isEn ? 'Update Dairy Prices' : 'ڈیری قیمتیں اپ ڈیٹ کریں'}</span>
                    <span className="text-[11px] text-slate-500 font-normal block">{isEn ? 'Change rate in 1-click' : 'ایک کلک میں ریٹ بدلیں'}</span>
                  </button>

                  <button
                    onClick={() => setActiveAdminSection('livestock_sale_purchase')}
                    className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold hover:bg-amber-100 transition-all text-start space-y-1"
                  >
                    <Store className="w-5 h-5 text-amber-600" />
                    <span className="block font-black">{isEn ? 'List Animal in Mandi' : 'جانور منڈی میں لسٹ کریں'}</span>
                    <span className="text-[11px] text-slate-500 font-normal block">{isEn ? 'Toggle sale status' : 'گاہکوں کے لیے لائیو کریں'}</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('license')}
                    className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold hover:bg-purple-100 transition-all text-start space-y-1"
                  >
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="block font-black">{isEn ? 'Digital Farm Passport' : 'سیل بل و ڈیجیٹل پاسپورٹ'}</span>
                    <span className="text-[11px] text-slate-500 font-normal block">{isEn ? 'Ownership receipts' : 'ٹرانسفر رسید اور کیو آر'}</span>
                  </button>
                </div>
              </div>

              {/* Active Listed Animals Quick Table */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {isEn ? 'Currently Listed in Customer Mandi' : 'کسٹمر منڈی میں برائے فروخت مویشی'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isEn ? 'These animals are visible on the public customer front page.' : 'یہ جانور پبلک کسٹمر بازار کے فرنٹ پیج پر لائیو نظر آ رہے ہیں۔'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveAdminSection('livestock_sale_purchase')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    {isEn ? 'Manage All' : 'سب دیکھیں'}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {animals.slice(0, 3).map((a) => (
                    <div key={a.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                        <img
                          src={(a.photos && a.photos[0]) || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600'}
                          alt={a.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                            {a.name} ({a.tagId})
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {a.breed} • {a.weightKg} kg
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 rtl:space-x-reverse shrink-0">
                        <div className="text-end">
                          <div className="font-black text-emerald-600">
                            Rs. {(a.askingPrice || a.currentMarketValue).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isEn ? 'Purchase: ' : 'خریداری: '}Rs. {(a.purchasePrice || 0).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleListForSale(a)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold ${
                            a.isListedForSale !== false
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {a.isListedForSale !== false ? (isEn ? 'Listed' : 'لسٹڈ ہے') : (isEn ? 'Delisted' : 'ہٹا دیا گیا')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Live Dairy Inventory & Orders Widget */}
            <div className="space-y-6">
              
              {/* Daily Dairy Catalog Summary */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                    <Milk className="w-4 h-4 text-emerald-600 me-2" />
                    <span>{isEn ? 'Active Dairy Stock' : 'ڈیری مصنوعات و قیمتیں'}</span>
                  </h3>

                  <button
                    onClick={() => setActiveAdminSection('dairy_inventory')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    {isEn ? 'Edit Rates' : 'ریٹ بدلیں'}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {dairyProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {p.dailyCapacity}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-black text-emerald-600 block">
                          Rs. {p.pricePKR} / {p.unit}
                        </span>
                        <span className={`text-[10px] font-bold ${p.inStock ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {p.inStock ? (isEn ? 'In Stock' : 'دستیاب') : (isEn ? 'Out' : 'ختم')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Customer Inquiries Box */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                    <ShoppingBag className="w-4 h-4 text-purple-600 me-2" />
                    <span>{isEn ? 'Recent Customer Leads' : 'تازہ کسٹمر آرڈرز'}</span>
                  </h3>
                  <span className="text-xs font-bold text-purple-600">
                    {metrics.newOrdersCount} {isEn ? 'New' : 'نئے'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {customerOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-purple-950 dark:text-purple-200">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                          Rs. {order.totalAmountPKR.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        {order.deliveryAddress}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">{order.date}</span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-[11px] font-bold text-emerald-600 flex items-center hover:underline"
                        >
                          <Phone className="w-3 h-3 me-1" />
                          <span>{order.customerPhone}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveAdminSection('customer_orders')}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {isEn ? 'View All Customer Orders' : 'تمام آرڈرز اور لیڈز دیکھیں'}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIVESTOCK SALE & PURCHASE MANDI MANAGEMENT                      */}
      {/* ========================================================================= */}
      {activeAdminSection === 'livestock_sale_purchase' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="text"
                placeholder={isEn ? 'Search by tag ID, animal name, breed...' : 'ایئر ٹیگ، جانور کا نام یا نسل تلاش کریں...'}
                value={livestockSearch}
                onChange={(e) => setLivestockSearch(e.target.value)}
                className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
              <button
                onClick={() => onNavigateTab('animals')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? '+ Register New Purchase' : '+ نیا جانور رجسٹر / خریداری کریں'}</span>
              </button>
            </div>
          </div>

          {/* Animals Sale/Purchase Inventory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 text-start">{isEn ? 'Animal & Tag ID' : 'جانور و ایئر ٹیگ'}</th>
                    <th className="p-4 text-start">{isEn ? 'Purchase Price' : 'خریداری قیمت'}</th>
                    <th className="p-4 text-start">{isEn ? 'Current Valuation' : 'موجودہ مارکیٹ ویلیو'}</th>
                    <th className="p-4 text-start">{isEn ? 'Mandi Asking Price' : 'منڈی ڈیمانڈ ریٹ'}</th>
                    <th className="p-4 text-center">{isEn ? 'Mandi Status' : 'منڈی اسٹیٹس'}</th>
                    <th className="p-4 text-end">{isEn ? 'Actions' : 'ایکشنز'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredLivestock.map((a) => {
                    const isListed = a.isListedForSale !== false;
                    const gain = (a.currentMarketValue || 0) - (a.purchasePrice || 0);
                    const gainPercent = a.purchasePrice ? ((gain / a.purchasePrice) * 100).toFixed(1) : '0';

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Animal Info */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <img
                              src={(a.photos && a.photos[0]) || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=600'}
                              alt={a.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="font-black text-slate-900 dark:text-slate-100 block">
                                {a.name}
                              </span>
                              <span className="text-[11px] text-emerald-600 font-bold">
                                {a.tagId} • {a.breed}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {a.weightKg} kg • Health {a.healthScore}/100
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Purchase Price */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-700 dark:text-slate-300">
                            Rs. {(a.purchasePrice || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{a.dob}</span>
                        </td>

                        {/* Market Valuation */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            Rs. {(a.currentMarketValue || 0).toLocaleString()}
                          </div>
                          <span className={`text-[10px] font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {gain >= 0 ? `+${gainPercent}% Gain` : `${gainPercent}% Loss`}
                          </span>
                        </td>

                        {/* Asking Price */}
                        <td className="p-4">
                          <div className="font-black text-emerald-700 dark:text-emerald-400">
                            Rs. {(a.askingPrice || a.currentMarketValue).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {a.sellerCity || 'Sahiwal'}
                          </span>
                        </td>

                        {/* Toggle Status */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleListForSale(a)}
                            className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                              isListed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isListed ? (isEn ? 'Active in Mandi' : 'منڈی میں لائیو') : (isEn ? 'Private Herd' : 'صرف ذاتی فارم')}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-end">
                          <div className="flex items-center justify-end space-x-1.5 rtl:space-x-reverse">
                            <button
                              onClick={() => {
                                setSelectedAnimalForSaleModal(a);
                                setAskingPriceInput(a.askingPrice || a.currentMarketValue || 250000);
                                setSaleDescInput(a.saleDescription || '');
                                setSellerCityInput(a.sellerCity || user.district || 'Sahiwal');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold"
                              title={isEn ? 'Edit Sale Details' : 'قیمت اور تفصیلات بدلیں'}
                            >
                              <Edit3 className="w-3.5 h-3.5 inline me-1" />
                              <span>{isEn ? 'Edit Rate' : 'قیمت بدلیں'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: DAIRY PRODUCTS & INSTANT PRICING MANAGER                       */}
      {/* ========================================================================= */}
      {activeAdminSection === 'dairy_inventory' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="text"
                placeholder={isEn ? 'Search dairy items...' : 'ڈیری پروڈکٹ تلاش کریں...'}
                value={dairySearch}
                onChange={(e) => setDairySearch(e.target.value)}
                className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleOpenAddDairy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 rtl:space-x-reverse shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? '+ Add New Product' : '+ نئی ڈیری پروڈکٹ شامل کریں'}</span>
            </button>
          </div>

          {/* Dairy Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDairy.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stock Status Badge */}
                    <button
                      onClick={() => handleToggleDairyStock(prod)}
                      className={`absolute top-3 end-3 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md shadow-md ${
                        prod.inStock
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-rose-600/90 text-white'
                      }`}
                    >
                      {prod.inStock ? (isEn ? 'In Stock (Active)' : 'دستیاب ہے') : (isEn ? 'Out of Stock' : 'ختم ہے')}
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">{isEn ? 'Current Price' : 'موجودہ قیمت'}</span>
                        <span className="font-black text-emerald-600 text-sm">
                          Rs. {prod.pricePKR} / {prod.unit}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">{isEn ? 'Daily Capacity' : 'روزانہ گنجائش'}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {prod.dailyCapacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setQuickPriceProduct(prod);
                      setQuickPriceValue(prod.pricePKR);
                    }}
                    className="py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors"
                  >
                    {isEn ? 'Quick Price' : 'ریٹ بدلیں'}
                  </button>

                  <button
                    onClick={() => handleOpenEditDairy(prod)}
                    className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"
                  >
                    {isEn ? 'Edit All' : 'ترمیم'}
                  </button>

                  <button
                    onClick={() => onDeleteDairyProduct(prod.id)}
                    className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
                  >
                    {isEn ? 'Delete' : 'حذف'}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CUSTOMER INQUIRIES & ORDER LEADS HUB                           */}
      {/* ========================================================================= */}
      {activeAdminSection === 'customer_orders' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
              <span className="font-bold text-slate-500">{isEn ? 'Filter by Status:' : 'اسٹیٹس فلٹر:'}</span>
              {['all', 'new', 'contacted', 'delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`px-3 py-1 rounded-xl font-bold uppercase text-[11px] transition-all ${
                    orderFilter === st
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st === 'all' ? (isEn ? 'All' : 'تمام') :
                   st === 'new' ? (isEn ? 'New' : 'نئے') :
                   st === 'contacted' ? (isEn ? 'Contacted' : 'رابطہ شدہ') :
                   (isEn ? 'Delivered' : 'ڈیلیورڈ')}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-slate-500">
              {isEn ? `${filteredOrders.length} Orders in Record` : `${filteredOrders.length} آرڈرز ریکارڈ میں موجود ہیں`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {order.customerName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.deliveryAddress}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    order.status === 'new'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                      : order.status === 'contacted'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>• {it.name} x {it.quantity} ({it.unit})</span>
                      <span className="font-bold">Rs. {(it.pricePKR * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-black text-slate-900 dark:text-slate-100">
                    <span>{isEn ? 'Total Order Amount' : 'کل رقم:'}</span>
                    <span className="text-emerald-600">Rs. {order.totalAmountPKR.toLocaleString()}</span>
                  </div>
                </div>

                {order.notes && (
                  <p className="text-xs text-slate-500 italic bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50">
                    "{order.notes}"
                  </p>
                )}

                {/* Actions & Status Changer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Call' : 'کال کریں'}</span>
                    </a>

                    <a
                      href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام علیکم! کسان دوست فارم سے آپ کے ڈیری آرڈر کی تصدیق کے لیے رابطہ کر رہے ہیں۔')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-bold flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isEn ? 'WhatsApp' : 'واٹس ایپ'}</span>
                    </a>
                  </div>

                  <select
                    value={order.status}
                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                    className="p-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="new">New (نیا)</option>
                    <option value="contacted">Contacted (رابطہ ہو گیا)</option>
                    <option value="delivered">Delivered (ڈیلیورڈ)</option>
                    <option value="cancelled">Cancelled (منسوخ)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PRICE MODAL FOR DAIRY                                               */}
      {/* ========================================================================= */}
      {quickPriceProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {isEn ? 'Quick Price Update' : 'فوری قیمت اپ ڈیٹ'}
            </h3>
            <p className="text-xs text-slate-500">
              {quickPriceProduct.name} ({quickPriceProduct.unit})
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'New Rate (PKR)' : 'نیا ریٹ (روپے) *'}
              </label>
              <input
                type="number"
                value={quickPriceValue}
                onChange={(e) => setQuickPriceValue(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
              <button
                onClick={() => setQuickPriceProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button
                onClick={handleSaveQuickPrice}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isEn ? 'Save Price' : 'محفوظ کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT LIVESTOCK SALE MODAL                                                 */}
      {/* ========================================================================= */}
      {selectedAnimalForSaleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {isEn ? 'Set Mandi Asking Price & Details' : 'منڈی میں قیمت اور تفصیلات سیٹ کریں'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedAnimalForSaleModal.name} ({selectedAnimalForSaleModal.tagId})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Asking Price (PKR) *' : 'طلب کردہ قیمت (ڈیمانڈ روپے) *'}
                </label>
                <input
                  type="number"
                  value={askingPriceInput}
                  onChange={(e) => setAskingPriceInput(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Seller Location / City' : 'شہر / لوکیشن'}
                </label>
                <input
                  type="text"
                  value={sellerCityInput}
                  onChange={(e) => setSellerCityInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Sale Description / Notes' : 'مویشی کی خصوصیات / تشریح'}
                </label>
                <textarea
                  rows={2}
                  value={saleDescInput}
                  onChange={(e) => setSaleDescInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
              <button
                onClick={() => setSelectedAnimalForSaleModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button
                onClick={handleSaveLivestockSaleModal}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isEn ? 'Publish in Mandi' : 'منڈی میں شائع کریں'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT DAIRY PRODUCT MODAL                                            */}
      {/* ========================================================================= */}
      {isDairyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {editingDairyProduct ? (isEn ? 'Edit Dairy Product' : 'ڈیری پروڈکٹ میں ترمیم') : (isEn ? 'Add New Dairy Product' : 'نئی ڈیری پروڈکٹ کا اندراج')}
              </h3>
              <button onClick={() => setIsDairyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDairyForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Product Name *' : 'پروڈکٹ کا نام *'}
                </label>
                <input
                  type="text"
                  required
                  value={dairyFormData.name}
                  onChange={(e) => setDairyFormData({ ...dairyFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Category' : 'کیٹیگری'}
                  </label>
                  <select
                    value={dairyFormData.category}
                    onChange={(e) => setDairyFormData({ ...dairyFormData, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="milk">خالص دودھ (Milk)</option>
                    <option value="ghee">دیسی گھی (Desi Ghee)</option>
                    <option value="butter">سفید مکھن (Butter)</option>
                    <option value="yogurt">گاڑھا دہی (Yogurt)</option>
                    <option value="khoya">تازہ کھویا (Khoya)</option>
                    <option value="lassi">مکھن لسی (Lassi)</option>
                    <option value="other">دیگر (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Unit' : 'پیمانہ'}
                  </label>
                  <select
                    value={dairyFormData.unit}
                    onChange={(e) => setDairyFormData({ ...dairyFormData, unit: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="liter">فی لیٹر (Per Liter)</option>
                    <option value="kg">فی کلوگرام (Per KG)</option>
                    <option value="half_liter">آدھا لیٹر (Half Liter)</option>
                    <option value="pack">فی پیک (Per Pack)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Price (PKR) *' : 'قیمت (روپے) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={dairyFormData.pricePKR}
                    onChange={(e) => setDairyFormData({ ...dairyFormData, pricePKR: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Daily Capacity' : 'روزانہ گنجائش'}
                  </label>
                  <input
                    type="text"
                    value={dairyFormData.dailyCapacity}
                    onChange={(e) => setDairyFormData({ ...dairyFormData, dailyCapacity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Product Photo Presets' : 'تصویر کا انتخاب'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {photoPresets.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setDairyFormData({ ...dairyFormData, imageUrl: preset.url })}
                      className={`p-1.5 rounded-xl border text-center transition-all ${
                        dairyFormData.imageUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 rounded-lg object-cover" />
                      <span className="text-[10px] font-bold truncate block mt-1">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-3">
                <button
                  type="button"
                  onClick={() => setIsDairyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  {isEn ? 'Cancel' : 'منسوخ'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md"
                >
                  {isEn ? 'Save Product' : 'پروڈکٹ محفوظ کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
