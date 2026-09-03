import React, { useState, useMemo } from 'react';
import { DairyProduct, Animal, Language, CustomerCartItem, CustomerOrderLead } from '../types';
import { 
  Milk, 
  ShoppingBag, 
  Search, 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Check, 
  Store, 
  Award, 
  Activity, 
  DollarSign, 
  UserCheck, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

interface CustomerFrontageProps {
  products: DairyProduct[];
  animals: Animal[];
  language: Language;
  onSwitchToAdmin: () => void;
  onPlaceOrder?: (order: CustomerOrderLead) => void;
}

export const CustomerFrontage: React.FC<CustomerFrontageProps> = ({
  products,
  animals,
  language,
  onSwitchToAdmin,
  onPlaceOrder,
}) => {
  const isEn = language === 'en';
  const isRtl = language === 'ur' || language === 'pb';

  // Active Customer Sub-Tab
  const [activeSection, setActiveSection] = useState<'dairy' | 'livestock' | 'cart'>('dairy');

  // Search & Category Filter for Dairy
  const [dairyCategory, setDairyCategory] = useState<string>('all');
  const [dairySearch, setDairySearch] = useState<string>('');

  // Search & Filter for Livestock Mandi
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [livestockSearch, setLivestockSearch] = useState<string>('');

  // Shopping Cart State
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmittedSuccess, setOrderSubmittedSuccess] = useState(false);

  // Animal Inquiry / Detail Modal
  const [selectedAnimalForInquiry, setSelectedAnimalForInquiry] = useState<Animal | null>(null);

  // Dairy Categories Definition
  const dairyCategories = [
    { id: 'all', label: isEn ? 'All Dairy Items' : 'تمام ڈیری آئٹمز', icon: '🥛' },
    { id: 'milk', label: isEn ? 'Fresh Pure Milk' : 'خالص تازہ دودھ', icon: '🥛' },
    { id: 'ghee', label: isEn ? 'Desi Ghee' : 'خالص دیسی گھی', icon: '🧈' },
    { id: 'yogurt', label: isEn ? 'Thick Yogurt' : 'گاڑھا دہی', icon: '🥣' },
    { id: 'butter', label: isEn ? 'White Butter' : 'سفید مکھن', icon: '🧈' },
    { id: 'khoya', label: isEn ? 'Fresh Khoya' : 'تازہ کھویا', icon: '🥮' },
    { id: 'lassi', label: isEn ? 'Chatti Lassi' : 'مکھن لسی', icon: '🥤' },
  ];

  // Species Filter Definition
  const speciesList = [
    { id: 'all', label: isEn ? 'All Livestock' : 'تمام مویشی' },
    { id: 'cow', label: isEn ? 'Cows (گائے)' : 'گائے' },
    { id: 'buffalo', label: isEn ? 'Buffaloes (بھینس)' : 'بھینس' },
    { id: 'goat', label: isEn ? 'Goats (بکریاں)' : 'بکریاں' },
    { id: 'sheep', label: isEn ? 'Sheep (دنبے/بھیڑیں)' : 'دنبے/بھیڑیں' },
  ];

  // Filtered Dairy Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = dairyCategory === 'all' || p.category === dairyCategory;
      const matchSearch = 
        p.name.toLowerCase().includes(dairySearch.toLowerCase()) ||
        p.description.toLowerCase().includes(dairySearch.toLowerCase()) ||
        p.sellerCity.toLowerCase().includes(dairySearch.toLowerCase()) ||
        p.farmName.toLowerCase().includes(dairySearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, dairyCategory, dairySearch]);

  // Filtered Livestock for Sale
  const forSaleAnimals = useMemo(() => {
    return animals.filter((a) => {
      // Listed for sale or standard market showcase
      const isListed = a.isListedForSale !== false;
      const matchSpecies = speciesFilter === 'all' || a.species === speciesFilter;
      const matchSearch =
        a.name.toLowerCase().includes(livestockSearch.toLowerCase()) ||
        a.breed.toLowerCase().includes(livestockSearch.toLowerCase()) ||
        (a.sellerCity || '').toLowerCase().includes(livestockSearch.toLowerCase());
      return isListed && matchSpecies && matchSearch;
    });
  }, [animals, speciesFilter, livestockSearch]);

  // Cart Calculations
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.pricePKR * item.quantity, 0);
  }, [cart]);

  const cartTotalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Actions
  const handleAddToCart = (product: DairyProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CustomerCartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Submit Order / Generate WhatsApp Inquiry
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || cart.length === 0) return;

    const orderId = 'ord_' + Date.now().toString().slice(-6);
    const newOrder: CustomerOrderLead = {
      id: orderId,
      customerName,
      customerPhone,
      deliveryAddress: deliveryAddress || 'Address to be confirmed on call',
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        unit: c.product.unit,
        pricePKR: c.product.pricePKR,
      })),
      totalAmountPKR: cartTotalAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'new',
      notes: orderNotes,
    };

    if (onPlaceOrder) {
      onPlaceOrder(newOrder);
    }

    // Build WhatsApp message for first seller phone or standard
    const sellerPhone = cart[0]?.product.sellerPhone || '03001234567';
    const cleanPhone = sellerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;

    const itemDetails = cart
      .map((c) => `• ${c.product.name} x ${c.quantity} (${c.product.unit}) = Rs. ${c.product.pricePKR * c.quantity}`)
      .join('%0A');

    const message = `*السلام علیکم! کسان دوست ڈیری شاپ سے نیا آرڈر*%0A%0A*گاہک کا نام:* ${encodeURIComponent(customerName)}%0A*فون:* ${encodeURIComponent(customerPhone)}%0A*پتہ:* ${encodeURIComponent(deliveryAddress || 'نامعلوم')}%0A%0A*آرڈر تفصیلات:*%0A${itemDetails}%0A%0A*کل رقم:* Rs. ${cartTotalAmount}%0A*خصوصی ہدایات:* ${encodeURIComponent(orderNotes || 'کوئی نہیں')}%0A%0A_براہ کرم ڈیلیوری کی تصدیق فرمائیں_`;

    setOrderSubmittedSuccess(true);

    setTimeout(() => {
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
      setCart([]);
      setIsCheckoutModalOpen(false);
      setOrderSubmittedSuccess(false);
    }, 1200);
  };

  // Direct WhatsApp contact for a single product
  const handleDirectProductInquiry = (product: DairyProduct) => {
    const cleanPhone = (product.sellerPhone || '03001234567').replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const msg = `السلام علیکم! میں *${product.name}* (Rs. ${product.pricePKR} فی ${product.unit}) فارم *${product.farmName}* سے خریدنا چاہتا ہوں۔ براہ کرم دستیابی اور ڈیلیوری کی تفصیلات بتائیں۔`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Direct WhatsApp for livestock animal
  const handleDirectLivestockInquiry = (animal: Animal) => {
    const phone = animal.sellerPhone || '0300-1234567';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const asking = animal.askingPrice || animal.currentMarketValue || 250000;
    const msg = `السلام علیکم! میں آپ کا جانور *${animal.name}* (ٹیگ: ${animal.tagId}، نسل: ${animal.breed}، قیمت: Rs. ${asking.toLocaleString()}) خریدنے میں دلچسپی رکھتا ہوں۔ کیا یہ ابھی دستیاب ہے؟`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Customer Hero Banner with Switch to Admin Badge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-emerald-700/80 border border-emerald-400/40 text-emerald-100 text-xs font-black shadow-sm">
              <Store className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{isEn ? 'Direct Farmer Marketplace Frontage' : 'کسان ڈائریکٹ بازار و ڈیری شاپ فرنٹ پیج'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {isEn ? 'Pure Farm Dairy & Livestock Marketplace' : 'خالص فارم ڈیری مصنوعات اور مویشی منڈی'}
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
              {isEn 
                ? '100% pure chemical-free farm milk, desi ghee, fresh butter, and certified healthy livestock directly from verified farmers without middleman commissions.'
                : '100% خالص اور کیمیکل سے پاک فارم دودھ، دیسی گھی، تازہ مکھن اور تصدیق شدہ صحت مند مویشی براہِ راست کسانوں سے حاصل کریں۔ زیرو کمیشن، مکمل تسلی!'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center text-[11px] font-bold bg-white/15 px-3 py-1 rounded-xl text-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 me-1.5" />
                {isEn ? 'Lab Verified 100% Pure' : 'لیب ٹیسٹ شدہ خالص اشیاء'}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold bg-white/15 px-3 py-1 rounded-xl text-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 me-1.5" />
                {isEn ? 'Direct From Verified Barn' : 'براہ راست تصدیق شدہ باڑے سے'}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold bg-white/15 px-3 py-1 rounded-xl text-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300 me-1.5" />
                {isEn ? 'Instant WhatsApp Delivery Order' : 'فوری واٹس ایپ ہوم ڈیلیوری'}
              </span>
            </div>
          </div>

          {/* Right Action: Admin Switcher & Cart Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
            {/* Switch to Admin Portal Button */}
            <button
              onClick={onSwitchToAdmin}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg shadow-amber-950/20 border border-amber-300 transition-all"
              title={isEn ? 'Open Farm Owner Admin Portal' : 'فارم اونر ایڈمن پورٹل کھولیں'}
            >
              <UserCheck className="w-4 h-4 text-amber-950" />
              <span>{isEn ? 'Farmer Admin Portal' : 'فارم ایڈمن کنٹرول پورٹل'}</span>
              <ChevronRight className="w-4 h-4 text-amber-950" />
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg transition-all relative"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>{isEn ? 'My Order Basket' : 'میری شاپنگ ٹوکری'}</span>
              {cartTotalItemsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">
                  {cartTotalItemsCount}
                </span>
              )}
              {cartTotalAmount > 0 && (
                <span className="text-xs font-bold text-slate-500">
                  (Rs. {cartTotalAmount.toLocaleString()})
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Bar (Dairy Products vs Livestock Mandi) */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setActiveSection('dairy')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center space-x-2 rtl:space-x-reverse transition-all ${
              activeSection === 'dairy'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Milk className="w-4 h-4" />
            <span>{isEn ? 'Fresh Dairy Store' : 'خالص ڈیری شاپ (دودھ، گھی، مکھن)'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
              {filteredProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('livestock')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center space-x-2 rtl:space-x-reverse transition-all ${
              activeSection === 'livestock'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{isEn ? 'Live Animals Purchase Mandi' : 'لائیو مویشی خریداری منڈی'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
              {forSaleAnimals.length}
            </span>
          </button>
        </div>

        {/* Live Trust Guarantee Tag */}
        <div className="hidden lg:flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 me-1.5 text-emerald-600" />
          <span>{isEn ? '100% Pure Organic Verified Guarantee' : '100% اصلی و خالص اشیاء کی مکمل ضمانت'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FRESH DAIRY STOREFRONT                                         */}
      {/* ========================================================================= */}
      {activeSection === 'dairy' && (
        <div className="space-y-6">
          
          {/* Filters & Search Row */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search pure milk, desi ghee, butter, farm name...' : 'خالص دودھ، دیسی گھی، مکھن، شہر تلاش کریں...'}
                  value={dairySearch}
                  onChange={(e) => setDairySearch(e.target.value)}
                  className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {dairySearch && (
                  <button 
                    onClick={() => setDairySearch('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status / Showing Count */}
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 self-start sm:self-auto">
                {isEn ? `Showing ${filteredProducts.length} Fresh Items` : `${filteredProducts.length} تازہ پراڈکٹس دستیاب ہیں`}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dairyCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setDairyCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
                    dairyCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dairy Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Milk className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'No dairy items found matching your search' : 'کوئی ڈیری آئٹم نہیں ملا'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? 'Try changing your category or search query' : 'براہ کرم کیٹیگری یا سرچ کے الفاظ تبدیل کر کے کوشش کریں۔'}
              </p>
              <button
                onClick={() => { setDairyCategory('all'); setDairySearch(''); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                {isEn ? 'Clear All Filters' : 'تمام فلٹرز ختم کریں'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((prod) => {
                const inCart = cart.find((c) => c.product.id === prod.id);
                const unitLabel = 
                  prod.unit === 'liter' ? (isEn ? '/ liter' : 'روپے فی لیٹر') :
                  prod.unit === 'kg' ? (isEn ? '/ kg' : 'روپے فی کلو') :
                  prod.unit === 'half_liter' ? (isEn ? '/ half liter' : 'روپے آدھا لیٹر') :
                  (isEn ? '/ pack' : 'روپے فی پیک');

                return (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Product Image Box */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Price Tag Pill */}
                      <div className="absolute top-3 start-3 px-3 py-1 rounded-full bg-emerald-700/95 backdrop-blur-md text-white text-xs font-black shadow-lg">
                        Rs. {prod.pricePKR.toLocaleString()} {unitLabel}
                      </div>

                      {/* Organic / Stock Badges */}
                      <div className="absolute top-3 end-3 flex flex-col gap-1.5 items-end">
                        {prod.isOrganic && (
                          <span className="px-2.5 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-black shadow-md flex items-center">
                            <Sparkles className="w-2.5 h-2.5 me-1" />
                            100% Organic
                          </span>
                        )}
                        {prod.inStock ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 text-[10px] font-bold backdrop-blur-sm">
                            {isEn ? 'In Stock Daily' : 'تازہ اسٹاک دستیاب'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                            {isEn ? 'Out of Stock' : 'ختم ہو چکا ہے'}
                          </span>
                        )}
                      </div>

                      {/* Farm Origin Bar at bottom of photo */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                        <p className="text-xs font-bold truncate flex items-center">
                          <MapPin className="w-3 h-3 me-1 text-emerald-400 shrink-0" />
                          <span>{prod.farmName} • {prod.sellerCity}</span>
                        </p>
                      </div>
                    </div>

                    {/* Product Details Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                          {prod.name}
                        </h3>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {prod.dailyCapacity}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {prod.sellerName}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        {/* Cart Stepper or Add to Cart Button */}
                        {inCart ? (
                          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-1.5">
                            <button
                              onClick={() => handleUpdateQuantity(prod.id, -1)}
                              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="text-center px-3">
                              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                                {inCart.quantity} {prod.unit}
                              </span>
                              <div className="text-[10px] text-slate-500 font-bold">
                                Rs. {(prod.pricePKR * inCart.quantity).toLocaleString()}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUpdateQuantity(prod.id, 1)}
                              className="p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(prod)}
                            disabled={!prod.inStock}
                            className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse transition-all ${
                              prod.inStock
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{isEn ? 'Add to Basket' : 'ٹوکری میں ڈالیں'}</span>
                          </button>
                        )}

                        {/* Direct WhatsApp Instant Buy */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleDirectProductInquiry(prod)}
                            className="py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isEn ? 'WhatsApp' : 'واٹس ایپ'}</span>
                          </button>

                          <a
                            href={`tel:${prod.sellerPhone || '03001234567'}`}
                            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-[11px] flex items-center justify-center space-x-1.5 rtl:space-x-reverse transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isEn ? 'Call Farm' : 'کال کریں'}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE ANIMALS PURCHASE MANDI                                   */}
      {/* ========================================================================= */}
      {activeSection === 'livestock' && (
        <div className="space-y-6">
          
          {/* Mandi Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isEn ? 'Search cattle breed, tag ID, seller city...' : 'نسل، ایئر ٹیگ، گائے، بھینس یا شہر تلاش کریں...'}
                  value={livestockSearch}
                  onChange={(e) => setLivestockSearch(e.target.value)}
                  className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {livestockSearch && (
                  <button 
                    onClick={() => setLivestockSearch('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isEn ? `${forSaleAnimals.length} Verified Animals for Sale` : `${forSaleAnimals.length} تصدیق شدہ مویشی برائے فروخت`}
              </div>
            </div>

            {/* Species Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {speciesList.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setSpeciesFilter(sp.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    speciesFilter === sp.id
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Livestock Grid */}
          {forSaleAnimals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'No animals available in this category' : 'اس کیٹیگری میں مویشی موجود نہیں'}
              </h3>
              <button
                onClick={() => { setSpeciesFilter('all'); setLivestockSearch(''); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                {isEn ? 'View All Mandi Animals' : 'تمام مویشی دیکھیں'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {forSaleAnimals.map((animal) => {
                const askingPrice = animal.askingPrice || animal.currentMarketValue || 250000;
                const photo = (animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800';

                return (
                  <div
                    key={animal.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                  >
                    {/* Animal Photo with Price Tag */}
                    <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={photo}
                        alt={animal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />

                      {/* Asking Price Tag */}
                      <div className="absolute top-3 start-3 px-3.5 py-1.5 rounded-full bg-emerald-700/95 backdrop-blur-md text-white text-xs sm:text-sm font-black shadow-lg">
                        Rs. {askingPrice.toLocaleString()}
                      </div>

                      {/* Health Score Pill */}
                      <div className="absolute top-3 end-3 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-[10px] font-black flex items-center">
                        <ShieldCheck className="w-3 h-3 me-1 text-emerald-400" />
                        <span>Health: {animal.healthScore}/100</span>
                      </div>

                      {/* Tag ID & Breed Pill */}
                      <div className="absolute bottom-3 start-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
                        {animal.tagId} • {animal.breed}
                      </div>
                    </div>

                    {/* Animal Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                              {animal.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {animal.sellerCity || 'Sahiwal'} • {animal.gender === 'female' ? 'مادہ (Female)' : 'نر (Male)'}
                            </p>
                          </div>
                          
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {animal.ageMonths} {isEn ? 'months' : 'ماہ'}
                          </span>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                            <span className="text-slate-400 text-[10px] block">{isEn ? 'Live Weight' : 'وزن'}</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">{animal.weightKg} کلوگرام</span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                            <span className="text-slate-400 text-[10px] block">{isEn ? 'Daily Milk' : 'دودھ کی پیداوار'}</span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                              {animal.milkYieldLitersPerDay > 0 ? `${animal.milkYieldLitersPerDay} لیٹر روزانہ` : 'برائے گوشت/نسل'}
                            </span>
                          </div>
                        </div>

                        {animal.saleDescription && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">
                            "{animal.saleDescription}"
                          </p>
                        )}
                      </div>

                      {/* Contact Seller Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleDirectLivestockInquiry(animal)}
                          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{isEn ? 'WhatsApp Farmer / Negotiate' : 'واٹس ایپ پر سودا کریں'}</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedAnimalForInquiry(animal)}
                            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-[11px] flex items-center justify-center space-x-1 rtl:space-x-reverse transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isEn ? 'Inspection Cert' : 'صحت سرٹیفکیٹ'}</span>
                          </button>

                          <a
                            href={`tel:${animal.sellerPhone || '03001234567'}`}
                            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-[11px] flex items-center justify-center space-x-1 rtl:space-x-reverse transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isEn ? 'Call Owner' : 'کال کریں'}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOPPING CART / BASKET SLIDE-OUT DRAWER                                   */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-s border-slate-200 dark:border-slate-800">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {isEn ? 'Your Shopping Basket' : 'آپ کی شاپنگ ٹوکری'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                  {cartTotalItemsCount} {isEn ? 'items' : 'اشیاء'}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {isEn ? 'Your basket is empty' : 'آپ کی شاپنگ ٹوکری خالی ہے'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isEn ? 'Add fresh farm milk, desi ghee or butter to start your order.' : 'تازہ دودھ، دیسی گھی یا مکھن شامل کر کے اپنا آرڈر شروع کریں۔'}
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Rs. {item.product.pricePKR} / {item.product.unit}
                        </p>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="p-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black min-w-[20px] text-center text-slate-800 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 rounded-lg bg-emerald-600 text-white shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ms-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer & Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isEn ? 'Subtotal' : 'اشیاء کی کل رقم'}</span>
                    <span className="font-bold">Rs. {cartTotalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isEn ? 'Delivery Charge' : 'ہوم ڈیلیوری فیس'}</span>
                    <span className="font-bold text-emerald-600">{isEn ? 'Free / Standard' : 'مفت / فارم ریٹ'}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>{isEn ? 'Total Payable Amount' : 'کل واجب الادا رقم'}</span>
                    <span className="text-emerald-600">Rs. {cartTotalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isEn ? 'Proceed to Order (WhatsApp Delivery)' : 'آرڈر مکمل کریں (واٹس ایپ ڈیلیوری)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKOUT / DELIVERY DETAILS MODAL                                         */}
      {/* ========================================================================= */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {isEn ? 'Complete Your Delivery Order' : 'ڈیلیوری و آرڈر کی تصدیق'}
                </h3>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSubmittedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                  {isEn ? 'Order Prepared Successfully!' : 'آرڈر تیار ہے! واٹس ایپ کھل رہا ہے...'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Connecting directly to farm owner for fresh delivery confirmation.' : 'فارم اونر کو واٹس ایپ پر پیغام بھیجا جا رہا ہے۔'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Your Full Name' : 'آپ کا پورا نام *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Muhammad Usman' : 'مثلاً: محمد عثمان'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'WhatsApp / Phone Number' : 'واٹس ایپ / موبائل نمبر *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Home / Shop Delivery Address' : 'گھر یا دکان کا پتہ (شہر اور گلی نمبر)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isEn ? 'House #, Street, Colony, City' : 'مکان نمبر، گلی، محلہ، نزدیکی نشان اور شہر'}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isEn ? 'Special Instructions / Delivery Timing' : 'خصوصی ہدایات یا ڈیلیوری کا وقت'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. Deliver fresh before 8:00 AM' : 'مثلاً: صبح 8 بجے سے پہلے تازہ دودھ درکار ہے'}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Order Summary Box */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                    <span>{isEn ? 'Total Order Value' : 'آرڈر کی کل رقم:'}</span>
                    <span className="text-sm font-black">Rs. {cartTotalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {isEn ? 'Payment: Cash on Delivery / Direct to Farmer' : 'ادائیگی: کیش آن ڈیلیوری / فارم پر براہ راست'}
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 font-bold"
                  >
                    {isEn ? 'Cancel' : 'منسوخ'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/30"
                  >
                    {isEn ? 'Confirm & Send to WhatsApp' : 'تصدیق اور واٹس ایپ آرڈر'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANIMAL INSPECTION & CERTIFICATE MODAL                                     */}
      {/* ========================================================================= */}
      {selectedAnimalForInquiry && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedAnimalForInquiry.name} ({selectedAnimalForInquiry.tagId})
                </h3>
              </div>
              <button onClick={() => setSelectedAnimalForInquiry(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">{isEn ? 'Species & Breed' : 'نسل'}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedAnimalForInquiry.breed}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">{isEn ? 'Health Inspection' : 'صحت کا سکور'}</span>
                  <span className="font-extrabold text-emerald-600">{selectedAnimalForInquiry.healthScore}/100 ({selectedAnimalForInquiry.healthStatus})</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">{isEn ? 'Age & Weight' : 'عمر اور وزن'}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedAnimalForInquiry.ageMonths} ماہ • {selectedAnimalForInquiry.weightKg} کلو</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">{isEn ? 'Digital Farm Passport' : 'ڈیجیٹل لائسنس'}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedAnimalForInquiry.digitalLicenseNumber || 'PK-VERIFIED-LIVESTOCK'}</span>
                </div>
              </div>

              {/* Vaccination Status */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center mb-1">
                  <CheckCircle2 className="w-4 h-4 me-1.5 text-emerald-600" />
                  <span>{isEn ? 'Vaccination History Cleared' : 'ویکسینیشن مکمل و محفوظ'}</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isEn 
                    ? 'All standard mandatory vaccines (FMD, Black Quarter, Hemorrhagic Septicemia) verified up to date.'
                    : 'منہ کھر، گل گھوٹو اور چوکڑی کی لازمی ویکسینز دی جا چکی ہیں۔ جانور ہر قسم کی وبائی بیماری سے محفوظ ہے۔'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                Rs. {(selectedAnimalForInquiry.askingPrice || selectedAnimalForInquiry.currentMarketValue || 250000).toLocaleString()}
              </span>

              <button
                onClick={() => {
                  const a = selectedAnimalForInquiry;
                  setSelectedAnimalForInquiry(null);
                  handleDirectLivestockInquiry(a);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 rtl:space-x-reverse shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isEn ? 'WhatsApp Seller' : 'واٹس ایپ پر رابطہ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
