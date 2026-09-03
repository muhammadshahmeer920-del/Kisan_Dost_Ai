import React, { useState } from 'react';
import { DairyProduct, DairyCategory, Language, User, Order } from '../types';
import { 
  Milk, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  X, 
  DollarSign, 
  Tag, 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  Check, 
  PackageCheck,
  Building,
  Store,
  UserCheck,
  MessageSquare,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface DairyStoreProps {
  products: DairyProduct[];
  user: User;
  onSaveProduct: (product: DairyProduct) => void;
  onDeleteProduct: (id: string) => void;
  onCreateOrder?: (order: Order) => void; // ⭐ NEW: Order creation callback
  language: Language;
}

export const DairyStore: React.FC<DairyStoreProps> = ({
  products,
  user,
  onSaveProduct,
  onDeleteProduct,
  onCreateOrder,
  language,
}) => {
  const isEn = language === 'en';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DairyProduct | null>(null);
  
  // Quick Price Edit Modal
  const [quickPriceModalProduct, setQuickPriceModalProduct] = useState<DairyProduct | null>(null);
  const [newQuickPrice, setNewQuickPrice] = useState<number>(220);

  // ⭐ BUY / CHECKOUT ORDER MODAL
  const [orderModalProduct, setOrderModalProduct] = useState<DairyProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);

  // ⭐ CHECKOUT FORM DETAILS
  const [checkoutCustomerName, setCheckoutCustomerName] = useState(user.name || 'Customer Name');
  const [checkoutPhone, setCheckoutPhone] = useState(user.phone || '0300-1234567');
  const [checkoutAddress, setCheckoutAddress] = useState(user.district ? `${user.location || 'City Area'}, ${user.district}` : 'City Address');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'mobile_wallet' | 'bank_transfer'>('cod');

  // ⭐ CONFIRMED RECEIPT MODAL STATE
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  // Product Photo Presets
  const photoPresets = [
    { label: 'خالص دودھ (Milk)', category: 'milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
    { label: 'گاڑھا دہی (Yogurt)', category: 'yogurt', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600' },
    { label: 'دیسی گھی (Desi Ghee)', category: 'ghee', url: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=600' },
    { label: 'سفید مکھن (White Butter)', category: 'butter', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=600' },
    { label: 'کھویا (Pure Khoya)', category: 'khoya', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600' },
    { label: 'مکھن لسی (Lassi)', category: 'lassi', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600' },
  ];

  // Add/Edit Form State
  const [formData, setFormData] = useState<Partial<DairyProduct>>({
    name: 'خالص گائے کا دودھ (Fresh Milk)',
    category: 'milk',
    pricePKR: 220,
    unit: 'liter',
    dailyCapacity: '50 لیٹر روزانہ',
    isOrganic: true,
    inStock: true,
    description: '100% خالص آرگینک مصنوعات، بغیر کسی کیمیائی ملاوٹ یا پانی کے۔',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
    farmName: user.farmName || 'Al-Madina Dairy & Cattle Farm',
    sellerName: user.name || 'Chaudhry Ahmed Ali',
    sellerPhone: user.phone || '0300-1234567',
    sellerCity: user.district || 'Sahiwal',
  });

  // ⭐ CHECK IF CURRENT USER IS PRODUCT OWNER
  const isProductOwner = (product: DairyProduct): boolean => {
    return product.sellerId === user.id;
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
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
    setIsAddEditModalOpen(true);
  };

  // Open Edit Product Modal (Only for Owner)
  const handleOpenEdit = (prod: DairyProduct) => {
    if (!isProductOwner(prod)) {
      alert(isEn ? 'You can only edit your own listings.' : 'آپ صرف اپنی اشتہاریں ترمیم کر سکتے ہیں۔');
      return;
    }
    setEditingProduct(prod);
    setFormData({ ...prod });
    setIsAddEditModalOpen(true);
  };

  // Open Quick Price Edit (Only for Owner)
  const handleOpenQuickPrice = (prod: DairyProduct) => {
    if (!isProductOwner(prod)) {
      alert(isEn ? 'You can only edit your own listings.' : 'آپ صرف اپنی اشتہاریں ترمیم کر سکتے ہیں۔');
      return;
    }
    setQuickPriceModalProduct(prod);
    setNewQuickPrice(prod.pricePKR);
  };

  // Save Quick Price (Only for Owner)
  const handleSaveQuickPrice = () => {
    if (!quickPriceModalProduct) return;
    if (!isProductOwner(quickPriceModalProduct)) return;
    
    const updated: DairyProduct = {
      ...quickPriceModalProduct,
      pricePKR: Number(newQuickPrice),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProduct(updated);
    setQuickPriceModalProduct(null);
  };

  // Toggle In Stock Status (Only for Owner)
  const handleToggleStock = (prod: DairyProduct) => {
    if (!isProductOwner(prod)) {
      alert(isEn ? 'You can only edit your own listings.' : 'آپ صرف اپنی اشتہاریں ترمیم کر سکتے ہیں۔');
      return;
    }
    
    const updated: DairyProduct = {
      ...prod,
      inStock: !prod.inStock,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProduct(updated);
  };

  // Submit Add / Edit Form
  const handleSubmitProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pricePKR) return;

    const prodToSave: DairyProduct = {
      id: editingProduct ? editingProduct.id : 'dry_' + Date.now(),
      sellerId: editingProduct?.sellerId || user.id, // ⭐ SET SELLER ID
      farmName: formData.farmName || user.farmName || 'Al-Madina Dairy Farm',
      sellerName: formData.sellerName || user.name || 'Chaudhry Ahmed Ali',
      sellerPhone: formData.sellerPhone || user.phone || '0300-1234567',
      sellerCity: formData.sellerCity || user.district || 'Sahiwal',
      name: formData.name,
      category: (formData.category as DairyCategory) || 'milk',
      pricePKR: Number(formData.pricePKR),
      unit: formData.unit || 'liter',
      dailyCapacity: formData.dailyCapacity || '20 کلو / لیٹر',
      isOrganic: formData.isOrganic !== undefined ? formData.isOrganic : true,
      inStock: formData.inStock !== undefined ? formData.inStock : true,
      description: formData.description || 'خالص فارم فریش پروڈکٹ',
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600',
      rating: editingProduct?.rating || 4.9,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveProduct(prodToSave);
    setIsAddEditModalOpen(false);
  };

  // ⭐ CONFIRM AND PLACE CHECKOUT ORDER
  const handleConfirmCheckoutOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalProduct) return;

    const orderId = 'KD-' + Math.floor(100000 + Math.random() * 900000);
    
    const newOrder: Order = {
      id: orderId,
      buyerId: user.id,
      sellerId: orderModalProduct.sellerId, // ⭐ SELLER ID FROM PRODUCT
      productId: orderModalProduct.id,
      productName: orderModalProduct.name,
      productImage: orderModalProduct.imageUrl,
      quantity: orderQuantity,
      unit: orderModalProduct.unit,
      pricePerUnit: orderModalProduct.pricePKR,
      totalAmountPKR: orderQuantity * orderModalProduct.pricePKR,
      
      // Buyer Details
      buyerName: checkoutCustomerName,
      buyerPhone: checkoutPhone,
      buyerEmail: user.email,
      
      // Seller Details (denormalized)
      sellerName: orderModalProduct.sellerName,
      sellerFarmName: orderModalProduct.farmName,
      sellerPhone: orderModalProduct.sellerPhone,
      sellerCity: orderModalProduct.sellerCity,
      
      // Delivery
      deliveryAddress: checkoutAddress,
      deliveryCity: user.district,
      
      // Payment
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      
      // Status
      status: 'pending',
      
      // Timestamps
      createdAt: new Date().toISOString(),
    };

    // ⭐ CALLBACK TO PARENT TO SAVE ORDER TO DATABASE
    if (onCreateOrder) {
      onCreateOrder(newOrder);
    }

    // Show confirmation with order details
    setConfirmedOrder({
      ...newOrder,
      date: new Date().toLocaleDateString(),
    });

    // Reset modal
    setOrderModalProduct(null);
  };

  // Upload Custom Photo
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ⭐ SEPARATE OWN LISTINGS FROM OTHERS
  const ownListings = filteredProducts.filter(p => isProductOwner(p));
  const otherListings = filteredProducts.filter(p => !isProductOwner(p));

  // Category Translation Helpers
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'milk': return 'دودھ (Milk)';
      case 'yogurt': return 'دہی (Yogurt)';
      case 'ghee': return 'دیسی گھی (Ghee)';
      case 'butter': return 'مکھن (Butter)';
      case 'cheese': return 'پنیر (Cheese)';
      case 'khoya': return 'کھویا (Khoya)';
      case 'lassi': return 'لسی (Lassi)';
      default: return 'دیگر (Other)';
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'liter': return 'فی لیٹر';
      case 'kg': return 'فی کلو';
      case 'pack': return 'فی پیکٹ';
      case '250g': return 'فی 250 گرام';
      case '500g': return 'فی 500 گرام';
      case 'half_liter': return 'فی نصف لیٹر';
      default: return 'فی یونٹ';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold flex items-center">
                <Store className="w-3.5 h-3.5 me-1" />
                فارم ڈائری سٹور (Farm Dairy Store)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 me-1" />
                100% آرگینک تصدیق شدہ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {user.farmName || 'Al-Madina Dairy Farm'} - ڈیری پروڈکٹس سٹور
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              فارم کے تازہ اور آرگینک ڈیری پروڈکٹس (دودھ، دہی، دیسی گھی، مکھن، کھویا، لسی) کی فہرست، قیمتوں کی ایڈجسٹمنٹ اور آن لائن خریداری پورٹل۔
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center space-x-2 rtl:space-x-reverse shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>نیا پروڈکٹ شامل کریں</span>
          </button>
        </div>

        {/* FARM STATS STRIP */}
        <div className="mt-6 pt-4 border-t border-emerald-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">کل ڈائری مصنوعات</span>
            <span className="text-base font-black text-white">{products.length} پروڈکٹس</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">دستیاب اسٹاک</span>
            <span className="text-base font-black text-amber-300">{products.filter(p => p.inStock).length} پروڈکٹس سٹاک میں</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">آپ کی اشتہاریں</span>
            <span className="text-base font-black text-emerald-300">{ownListings.length} آپ کے</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">دوسری فارمز</span>
            <span className="text-base font-black text-emerald-300">{otherListings.length} دوسروں کے</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute top-3.5 right-3 text-slate-400" />
            <input
              type="text"
              placeholder="پروڈکٹ کا نام یا فارم تلاش کریں..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'تمام (All)' },
              { id: 'milk', label: 'دودھ' },
              { id: 'yogurt', label: 'دہی' },
              { id: 'ghee', label: 'دیسی گھی' },
              { id: 'butter', label: 'مکھن' },
              { id: 'khoya', label: 'کھویا' },
              { id: 'lassi', label: 'لسی' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {/* ⭐ YOUR LISTINGS SECTION */}
          {ownListings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-600 to-transparent"></div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center space-x-1.5 rtl:space-x-reverse shrink-0">
                  <UserCheck className="w-4 h-4" />
                  <span>⭐ آپ کی اشتہاریں (Your Listings) - {ownListings.length}</span>
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-emerald-600 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ownListings.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                    {/* Product Photo */}
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-md flex items-center space-x-1 rtl:space-x-reverse z-10">
                        <span>⭐ آپ کا اشتہار</span>
                      </div>
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800'; }} />
                      <div className="absolute top-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white">{getCategoryLabel(product.category)}</div>
                      <div className="absolute top-12 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500 text-slate-950">✓ {product.inStock ? 'دستیاب' : 'ختم'}</div>
                      {product.isOrganic && <div className="absolute bottom-3 right-3 bg-emerald-900/90 text-emerald-200 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">🌿 100% آرگینک</div>}
                    </div>
                    
                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{product.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{product.description}</p>
                        <div className="flex items-center text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl">
                          <span className="me-1.5">🏡</span>
                          <span className="truncate">{product.farmName || 'Al-Madina Dairy'} ({product.sellerCity})</span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">قیمت</span>
                          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">PKR {product.pricePKR.toLocaleString()}</span>
                        </div>
                        <button onClick={() => handleOpenQuickPrice(product)} className="px-2.5 py-1.5 rounded-xl bg-white text-emerald-700 text-xs font-bold border border-emerald-200">
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {/* Actions */}
                      <div className="pt-2 flex gap-2">
                        <button onClick={() => handleToggleStock(product)} className="flex-1 py-2 rounded-xl font-bold text-xs bg-amber-100 text-amber-900 hover:bg-amber-200">
                          <CheckCircle2 className="w-3.5 h-3.5 inline me-1" />
                          {product.inStock ? 'بند' : 'فعال'}
                        </button>
                        <button onClick={() => handleOpenEdit(product)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (window.confirm('حذف کریں؟')) onDeleteProduct(product.id); }} className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⭐ OTHER LISTINGS SECTION */}
          {otherListings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex-1 h-px bg-gradient-to-r from-blue-600 to-transparent"></div>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-black flex items-center space-x-1.5 rtl:space-x-reverse shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                  <span>🛒 دیگر فارمز سے خریداری (Available from Other Farms) - {otherListings.length}</span>
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-blue-600 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {otherListings.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                    {/* Product Photo */}
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800'; }} />
                      <div className="absolute top-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white">{getCategoryLabel(product.category)}</div>
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500 text-slate-950">✓ {product.inStock ? 'دستیاب' : 'ختم'}</div>
                      {product.isOrganic && <div className="absolute bottom-3 right-3 bg-emerald-900/90 text-emerald-200 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">🌿 100% آرگینک</div>}
                    </div>
                    
                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{product.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{product.description}</p>
                        <div className="flex items-center text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl">
                          <span className="me-1.5">🏡</span>
                          <span className="truncate">{product.farmName || 'Al-Madina Dairy'} ({product.sellerCity})</span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60">
                        <div>
                          <span className="text-[10px] text-blue-700 dark:text-blue-400 block font-semibold">قیمت</span>
                          <span className="text-xl font-black text-blue-700 dark:text-blue-300">PKR {product.pricePKR.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Buy Button */}
                      <button onClick={() => { setOrderModalProduct(product); setOrderQuantity(1); }} disabled={!product.inStock} className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse ${product.inStock ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{product.inStock ? '🛒 آرڈر کریں' : '✕ ختم'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            کوئی پروڈکٹ نہیں ملا
          </h3>
          <p className="text-xs text-slate-400">
            آپ کے منتخب کردہ فلٹر کے مطابق ڈیری مصنوعات موجود نہیں ہیں۔
          </p>
        </div>
      )}

      {/* QUICK PRICE EDIT MODAL */}
      {quickPriceModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-5 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center">
                <DollarSign className="w-5 h-5 text-emerald-600 me-2" />
                قیمت اپڈیٹ کریں (Quick Price Edit)
              </h3>
              <button
                onClick={() => setQuickPriceModalProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3 rtl:space-x-reverse">
                <img src={quickPriceModalProduct.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{quickPriceModalProduct.name}</h4>
                  <p className="text-[11px] text-slate-500">سابقہ قیمت: PKR {quickPriceModalProduct.pricePKR.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  نئی قیمت (PKR میں)
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">PKR</span>
                  <input
                    type="number"
                    value={newQuickPrice}
                    onChange={(e) => setNewQuickPrice(Number(e.target.value))}
                    className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
              <button
                onClick={() => setQuickPriceModalProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                منسوخ کریں
              </button>
              <button
                onClick={handleSaveQuickPrice}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                قیمت محفوظ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl my-8 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center">
                <Store className="w-5 h-5 text-emerald-600 me-2" />
                {editingProduct ? 'ڈیری پروڈکٹ کی تفصیلات تبدیل کریں' : 'نیا ڈیری پروڈکٹ شامل کریں'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProductForm} className="space-y-4 text-start">
              {/* Preset Image Options */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  پروڈکٹ تصویر منتخب کریں یا اپلوڈ کریں
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {photoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        imageUrl: preset.url,
                        category: preset.category as DairyCategory
                      }))}
                      className={`p-1.5 rounded-xl border text-center transition-all ${
                        formData.imageUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-full h-12 object-cover rounded-lg mb-1" />
                      <span className="text-[10px] font-bold block truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="dairy-custom-photo"
                    className="hidden"
                  />
                  <label
                    htmlFor="dairy-custom-photo"
                    className="cursor-pointer px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center space-x-1.5 rtl:space-x-reverse"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>اپنی گیلری سے تصویر لگائیں</span>
                  </label>
                </div>
              </div>

              {/* Product Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  پروڈکٹ کا نام (نام و قسم)
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثلاً: خالص ساہیوال گائے کا دودھ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    کٹیگری (Category)
                  </label>
                  <select
                    value={formData.category || 'milk'}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as DairyCategory }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="milk">دودھ (Milk)</option>
                    <option value="yogurt">دہی (Yogurt)</option>
                    <option value="ghee">دیسی گھی (Desi Ghee)</option>
                    <option value="butter">مکھن (Butter)</option>
                    <option value="khoya">کھویا (Khoya)</option>
                    <option value="lassi">لسی (Lassi)</option>
                    <option value="cheese">پنیر (Cheese)</option>
                    <option value="other">دیگر (Other)</option>
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    پیمائش کی اکائی (Unit)
                  </label>
                  <select
                    value={formData.unit || 'liter'}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="liter">فی لیٹر (Per Liter)</option>
                    <option value="kg">فی کلو (Per Kg)</option>
                    <option value="half_liter">فی نصف لیٹر (Per Half Liter)</option>
                    <option value="500g">فی 500 گرام (Per 500g)</option>
                    <option value="250g">فی 250 گرام (Per 250g)</option>
                    <option value="pack">فی پیکٹ (Per Pack)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Price */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    قیمت (PKR میں)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.pricePKR || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePKR: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Daily Capacity */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    روزانہ دستیابی صلاحیت
                  </label>
                  <input
                    type="text"
                    value={formData.dailyCapacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyCapacity: e.target.value }))}
                    placeholder="مثلاً: 50 لیٹر روزانہ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  پروڈکٹ کی تفصیل و معیار
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="خالص آرگینک معیار کی تفصیل لکھیں..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center space-x-4 rtl:space-x-reverse pt-1">
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">اسٹاک میں دستیاب ہے (In Stock)</span>
                </label>

                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOrganic !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isOrganic: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">100% آرگینک تصدیق</span>
                </label>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  {editingProduct ? 'محفوظ کریں' : 'پروڈکٹ شامل کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCTION-GRADE CHECKOUT & PAYMENT MODAL */}
      {orderModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl my-8 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center">
                <ShoppingBag className="w-5 h-5 text-emerald-600 me-2" />
                <span>{isEn ? 'Checkout & Place Order' : 'آن لائن آرڈر و پیمنٹ چیک آؤٹ'}</span>
              </h3>
              <button
                onClick={() => setOrderModalProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckoutOrder} className="space-y-4 text-xs">
              
              {/* Order Summary Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-3 rtl:space-x-reverse">
                <img
                  src={orderModalProduct.imageUrl}
                  alt={orderModalProduct.name}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800'; }}
                  className="w-16 h-16 rounded-xl object-cover border border-emerald-300 shrink-0"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {isEn ? (orderModalProduct.nameEn || orderModalProduct.name) : (orderModalProduct.nameUr || orderModalProduct.name)}
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                    PKR {orderModalProduct.pricePKR.toLocaleString()} / {getUnitLabel(orderModalProduct.unit)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    🏡 {orderModalProduct.farmName || 'Al-Madina Dairy'} • {orderModalProduct.sellerCity}
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">
                    {isEn ? 'Select Quantity:' : 'میقدار منتخب کریں:'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {orderQuantity} x {getUnitLabel(orderModalProduct.unit)}
                  </span>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-base flex items-center justify-center border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100 px-2">
                    {orderQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(prev => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-base flex items-center justify-center border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Details Inputs */}
              <div className="space-y-3 pt-1">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                  <PackageCheck className="w-4 h-4 text-emerald-600 me-1.5" />
                  {isEn ? 'Delivery Details' : 'ڈیلیوری معلومات'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isEn ? 'Full Name:' : 'نام:'}</label>
                    <input
                      type="text"
                      required
                      value={checkoutCustomerName}
                      onChange={(e) => setCheckoutCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isEn ? 'Phone Number:' : 'فون نمبر:'}</label>
                    <input
                      type="text"
                      required
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{isEn ? 'Delivery Address:' : 'ڈیلیوری کا پتہ:'}</label>
                  <textarea
                    rows={2}
                    required
                    value={checkoutAddress}
                    onChange={(e) => setCheckoutAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Radio Selection */}
              <div className="space-y-2 pt-1">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                  <CreditCard className="w-4 h-4 text-emerald-600 me-1.5" />
                  {isEn ? 'Payment Method' : 'ادائیگی کا طریقہ'}
                </span>

                <div className="grid grid-cols-1 gap-2">
                  <label className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {isEn ? 'Cash on Delivery (COD)' : 'کیش آن ڈیلیوری (COD)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isEn ? 'Pay cash upon receiving fresh dairy item' : 'سامان وصول کرنے پر نقد رقم ادا کریں'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">💵</span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'mobile_wallet'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'mobile_wallet'}
                        onChange={() => setPaymentMethod('mobile_wallet')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {isEn ? 'JazzCash / EasyPaisa Wallet' : 'جاز کیش / ایزی پیسہ والٹ'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isEn ? 'Instant mobile money transfer' : 'فوری موبائل رقم ٹرانسفر'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">📱</span>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {isEn ? 'Direct Bank Transfer (IBAN)' : 'ڈائریکٹ بینک ٹرانسفر (IBAN)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isEn ? 'Online bank account transaction' : 'آن لائن بینک اکاؤنٹ ٹرانسفر'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">🏦</span>
                  </label>
                </div>
              </div>

              {/* Total Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isEn ? 'Total Payable Amount:' : 'کل واجب الادا رقم:'}</span>
                  <span className="text-lg font-black text-emerald-400">
                    PKR {(orderQuantity * orderModalProduct.pricePKR).toLocaleString()}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isEn ? 'Confirm & Place Order' : 'آرڈر کی تصدیق کریں'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ⭐ CONFIRMED RECEIPT SUCCESS MODAL */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                آرڈر کامیابی سے درج ہو گیا!
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Invoice #{confirmedOrder.id}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 text-start border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">پروڈکٹ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{confirmedOrder.productName} ({confirmedOrder.quantity}x)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">کل رقم:</span>
                <span className="font-black text-blue-600">PKR {confirmedOrder.totalAmountPKR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">خریدار:</span>
                <span className="font-bold">{confirmedOrder.buyerName} ({confirmedOrder.buyerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ادائیگی:</span>
                <span className="font-bold uppercase text-blue-700">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">فارم:</span>
                <span className="font-bold">{confirmedOrder.sellerFarmName || 'Al-Madina Dairy'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-center">
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                ✅ فارم کے مالک آپ سے جلد رابطہ کریں گے۔<br />
                براہ کرم اپنے فون کو دستیاب رکھیں۔
              </p>
            </div>

            <button
              onClick={() => setConfirmedOrder(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg transition-all"
            >
              شکریہ! واپس ڈیری شاپ پر جائیں
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
