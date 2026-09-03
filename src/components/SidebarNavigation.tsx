import React, { useState, useEffect } from 'react';
import { Language, AppFrontageMode, AIExecutionMode } from '../types';
import { t } from '../lib/translations';
import { 
  Home, 
  LayoutDashboard, 
  Scan, 
  Mic, 
  Stethoscope, 
  Wheat, 
  Syringe, 
  BarChart3, 
  Receipt, 
  MapPin, 
  ShieldAlert, 
  Award, 
  Pill, 
  BookOpen, 
  Settings, 
  Grid, 
  Store, 
  QrCode, 
  Menu, 
  X, 
  Search, 
  Sparkles, 
  ShoppingBag, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  WifiOff, 
  UserCheck, 
  PanelLeftClose, 
  PanelLeftOpen 
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'qr_scanner'
  | 'animals' 
  | 'dairystore'
  | 'customer_orders'
  | 'scanner' 
  | 'assistant' 
  | 'vets' 
  | 'nutrition' 
  | 'vaccines' 
  | 'reports' 
  | 'expenses' 
  | 'map' 
  | 'outbreaks' 
  | 'license' 
  | 'medicine' 
  | 'offline_knowledge' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
  pendingVaccinesCount?: number;
  mandiCount?: number;
  dairyCount?: number;
  pendingOrdersCount?: number;
  frontageMode?: AppFrontageMode;
  onToggleFrontageMode?: (mode: AppFrontageMode) => void;
  executionMode?: AIExecutionMode;
  onToggleExecutionMode?: () => void;
}

interface NavGroup {
  id: string;
  titleEn: string;
  titleUr: string;
  icon: any;
  items: {
    id: NavTab;
    labelEn: string;
    labelUr: string;
    icon: any;
    badge?: string;
    badgeVariant?: 'default' | 'urgent' | 'accent' | 'ai';
  }[];
}

export const SidebarNavigation: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  language,
  pendingVaccinesCount = 0,
  mandiCount = 0,
  dairyCount = 0,
  pendingOrdersCount = 0,
  frontageMode = 'admin',
  onToggleFrontageMode,
  executionMode = 'online',
  onToggleExecutionMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    } catch (e) {
      console.error(e);
    }
  }, [isCollapsed]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isRtl = language === 'ur' || language === 'pb';
  const isEn = language === 'en';

  // Toggle category collapse
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Keyboard shortcut listener (/ to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('smart-sidebar-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clean Grouped Navigation Data
  const navigationGroups: NavGroup[] = [
    {
      id: 'core',
      titleEn: 'Core & Overview',
      titleUr: 'کنٹرول و فارم جائزہ',
      icon: LayoutDashboard,
      items: [
        {
          id: 'overview',
          labelEn: 'Farm Overview',
          labelUr: 'فارم جائزہ و ڈیش بورڈ',
          icon: Home,
          badge: isEn ? 'Live' : 'لائیو',
          badgeVariant: 'default'
        },
        {
          id: 'qr_scanner',
          labelEn: 'Ear-Tag QR Reader',
          labelUr: 'ایئر ٹیگ کیو آر سکینر',
          icon: QrCode,
          badge: 'QR',
          badgeVariant: 'accent'
        }
      ]
    },
    {
      id: 'commerce',
      titleEn: 'Commerce & Mandi',
      titleUr: 'مارکیٹ و منڈی سیل',
      icon: Store,
      items: [
        {
          id: 'animals',
          labelEn: 'Livestock Mandi',
          labelUr: 'مویشی منڈی و خریداری',
          icon: Grid,
          badge: mandiCount > 0 ? `${mandiCount} Mandi` : (isEn ? 'Mandi' : 'منڈی'),
          badgeVariant: 'accent'
        },
        {
          id: 'dairystore',
          labelEn: 'Pure Dairy Store',
          labelUr: 'خالص ڈیری شاپ و قیمتیں',
          icon: Store,
          badge: dairyCount > 0 ? `${dairyCount} Items` : (isEn ? 'Dairy' : 'ڈیری'),
          badgeVariant: 'default'
        },
        {
          id: 'customer_orders',
          labelEn: 'Customer Inquiries',
          labelUr: 'کسٹمر آرڈرز و لیڈز',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} New` : undefined,
          badgeVariant: pendingOrdersCount > 0 ? 'urgent' : 'default'
        }
      ]
    },
    {
      id: 'health',
      titleEn: 'Health & AI Diagnostics',
      titleUr: 'طبی و اے آئی علاج',
      icon: Scan,
      items: [
        {
          id: 'scanner',
          labelEn: 'AI Disease Scanner',
          labelUr: 'اے آئی بیماری سکینر (کیمرہ)',
          icon: Scan,
          badge: 'Vision AI',
          badgeVariant: 'ai'
        },
        {
          id: 'assistant',
          labelEn: 'Livestock Doctor (Voice)',
          labelUr: 'صوتی مویشی ڈاکٹر',
          icon: Mic,
          badge: 'Voice AI',
          badgeVariant: 'ai'
        },
        {
          id: 'vets',
          labelEn: 'Veterinary Clinic Portal',
          labelUr: 'ویٹرنری کلینک و رابطہ',
          icon: Stethoscope,
          badge: isEn ? 'Vets' : 'ڈاکٹر'
        },
        {
          id: 'outbreaks',
          labelEn: 'Outbreak Shield',
          labelUr: 'وبا الرٹ و بائیو سیکیورٹی',
          icon: ShieldAlert,
          badge: isEn ? 'Alerts' : 'الرٹ',
          badgeVariant: 'urgent'
        }
      ]
    },
    {
      id: 'care',
      titleEn: 'Nutrition & Herd Care',
      titleUr: 'خوراک و دیکھ بھال',
      icon: Wheat,
      items: [
        {
          id: 'nutrition',
          labelEn: 'Feed & Ration Planner',
          labelUr: 'خوراک و ونڈا راشن پلانر',
          icon: Wheat
        },
        {
          id: 'vaccines',
          labelEn: 'Vaccination Center',
          labelUr: 'ویکسینیشن سینٹر و شیڈول',
          icon: Syringe,
          badge: pendingVaccinesCount > 0 ? `${pendingVaccinesCount} Due` : undefined,
          badgeVariant: pendingVaccinesCount > 0 ? 'urgent' : 'default'
        },
        {
          id: 'medicine',
          labelEn: 'Medicine & Drug Safety',
          labelUr: 'ادویات و خوراک سیفٹی',
          icon: Pill
        }
      ]
    },
    {
      id: 'finance',
      titleEn: 'Finance & Records',
      titleUr: 'فنانس و ریکارڈز',
      icon: BarChart3,
      items: [
        {
          id: 'reports',
          labelEn: 'Financial Analytics',
          labelUr: 'مالیاتی تجزیہ و منافع',
          icon: BarChart3
        },
        {
          id: 'expenses',
          labelEn: 'Expense Ledger',
          labelUr: 'اخراجات و کیش فلو',
          icon: Receipt
        },
        {
          id: 'license',
          labelEn: 'Digital Farm License',
          labelUr: 'ڈیجیٹل فارم لائسنس کارڈ',
          icon: Award,
          badge: 'Platinum'
        },
        {
          id: 'offline_knowledge',
          labelEn: 'Offline Encyclopedia',
          labelUr: 'آف لائن فارمنگ گائیڈ',
          icon: BookOpen,
          badge: '100% Offline'
        }
      ]
    },
    {
      id: 'system',
      titleEn: 'System & Sync',
      titleUr: 'سسٹم و سیٹنگز',
      icon: Settings,
      items: [
        {
          id: 'settings',
          labelEn: 'Application Settings',
          labelUr: 'ایپلیکیشن سیٹنگز',
          icon: Settings
        }
      ]
    }
  ];

  // Flat array for quick search
  const allNavItems = navigationGroups.flatMap(g => g.items);

  const filteredItems = searchQuery.trim() === ''
    ? null
    : allNavItems.filter(item => {
        const title = isEn ? item.labelEn : item.labelUr;
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.labelUr.toLowerCase().includes(searchQuery.toLowerCase());
      });

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const getBadgeStyle = (variant?: 'default' | 'urgent' | 'accent' | 'ai') => {
    switch (variant) {
      case 'urgent':
        return 'bg-red-500 text-white animate-pulse';
      case 'accent':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300';
      case 'ai':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
    }
  };

  return (
    <>
      {/* ========================================================
          DESKTOP SMART SIDEBAR (Sticky Left Navigation Bar)
          ======================================================== */}
      <aside 
        className={`hidden lg:flex flex-col justify-between bg-white dark:bg-slate-900 border-e border-slate-200/80 dark:border-slate-800 shrink-0 rounded-3xl shadow-sm h-[calc(100vh-6rem)] sticky top-24 transition-all duration-300 overflow-hidden ${
          isCollapsed ? 'w-20 p-2.5' : 'w-72 p-3.5'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header Strip with Collapse Toggle */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            {!isCollapsed && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm">
                  KD
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate tracking-tight">
                    {isEn ? 'Kisan Dost AI' : 'کسان دوست'}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                    {isEn ? 'Smart Navigation' : 'سمارٹ نیویگیشن'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto lg:mx-0"
              title={isCollapsed ? (isEn ? 'Expand Sidebar' : 'سائیڈ بار کھولیں') : (isEn ? 'Collapse Sidebar' : 'سائیڈ بار سمیٹیں')}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Search Input (When Expanded) */}
          {!isCollapsed && (
            <div className="mb-3 px-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="smart-sidebar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search app... ( / )' : 'موڈیول تلاش کریں... ( / )'}
                  className="w-full ps-8 pe-6 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items List (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            
            {/* If Search is active */}
            {filteredItems ? (
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-400 px-2">
                  {isEn ? `Search Results (${filteredItems.length})` : `تلاش کے نتائج (${filteredItems.length})`}
                </div>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    {isEn ? 'No modules found' : 'کوئی موڈیول نہیں ملا'}
                  </div>
                ) : (
                  filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const label = isEn ? item.labelEn : item.labelUr;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] overflow-visible ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0 overflow-visible">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className={`${isRtl ? 'leading-relaxed line-clamp-2 overflow-visible' : 'truncate'}`}>{label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${getBadgeStyle(item.badgeVariant)}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              // Default Categorized Group Listing
              navigationGroups.map((group) => {
                const isGroupCollapsed = collapsedGroups[group.id];
                const groupTitle = isEn ? group.titleEn : group.titleUr;

                return (
                  <div key={group.id} className="space-y-1">
                    
                    {/* Category Header */}
                    {!isCollapsed && (
                      <button
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors tracking-wider"
                      >
                        <span>{groupTitle}</span>
                        {isGroupCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Category Items */}
                    {(!isGroupCollapsed || isCollapsed) && (
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          const label = isEn ? item.labelEn : item.labelUr;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              title={isCollapsed ? label : undefined}
                              className={`w-full flex items-center ${
                                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                              } rounded-xl text-xs font-bold transition-all group relative min-h-[44px] overflow-visible ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0 overflow-visible">
                                <span className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${
                                  isActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-transparent group-hover:bg-slate-300'
                                }`} />
                                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                }`} />
                                {!isCollapsed && (
                                  <span className={`${isRtl ? 'leading-relaxed line-clamp-2 overflow-visible' : 'truncate'}`}>{label}</span>
                                )}
                              </div>

                              {!isCollapsed && item.badge && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ms-1 ${getBadgeStyle(item.badgeVariant)}`}>
                                  {item.badge}
                                </span>
                              )}

                              {/* Floating Tooltip in Collapsed Mode */}
                              {isCollapsed && (
                                <div className="absolute start-full ms-2 z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xl whitespace-nowrap pointer-events-none">
                                  {label}
                                  {item.badge && (
                                    <span className="ms-1.5 text-[9px] px-1 rounded bg-emerald-500 text-slate-950 font-bold">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>

          {/* Footer Strip: AI Engine & Status */}
          {!isCollapsed && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              
              {/* AI Engine Status Pill */}
              {onToggleExecutionMode && (
                <button
                  onClick={onToggleExecutionMode}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  title={isEn ? 'Click to toggle Online/Offline AI Mode' : 'آن لائن و آف لائن موڈ تبدیل کریں'}
                >
                  <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                    {executionMode === 'online' ? (
                      <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">
                      {executionMode === 'online' ? 'Gemini 2.5 Flash' : 'Edge LLM Offline'}
                    </span>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${executionMode === 'online' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
                </button>
              )}

              {/* Version & Badge */}
              <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-medium">
                <span>{isEn ? 'Farm Control OS' : 'فارم کنٹرول او ایس'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">v2.5 Pro</span>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION BAR (< lg screens)
          ======================================================== */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-around">
        
        {/* Home / Admin Overview */}
        <button
          onClick={() => handleSelectTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'overview'
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-emerald-100 dark:bg-emerald-950/80 scale-105' : ''
          }`}>
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 leading-none tracking-tight">
            {isEn ? 'Admin' : 'ایڈمن'}
          </span>
        </button>

        {/* Mandi */}
        <button
          onClick={() => handleSelectTab('animals')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'animals'
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'animals' ? 'bg-emerald-100 dark:bg-emerald-950/80 scale-105' : ''
          }`}>
            <Grid className={`w-5 h-5 ${activeTab === 'animals' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 leading-none tracking-tight">
            {isEn ? 'Mandi' : 'منڈی'}
          </span>
        </button>

        {/* Dairy Store */}
        <button
          onClick={() => handleSelectTab('dairystore')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'dairystore'
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'dairystore' ? 'bg-emerald-100 dark:bg-emerald-950/80 scale-105' : ''
          }`}>
            <Store className={`w-5 h-5 ${activeTab === 'dairystore' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 leading-none tracking-tight">
            {isEn ? 'Dairy' : 'ڈیری'}
          </span>
        </button>

        {/* AI Scanner */}
        <button
          onClick={() => handleSelectTab('scanner')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] active:scale-95 ${
            activeTab === 'scanner'
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'scanner' ? 'bg-emerald-100 dark:bg-emerald-950/80 scale-105' : ''
          }`}>
            <Scan className={`w-5 h-5 ${activeTab === 'scanner' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
          </div>
          <span className="text-[10px] mt-0.5 leading-none tracking-tight">
            {isEn ? 'AI Scan' : 'اے آئی سکین'}
          </span>
        </button>

        {/* MORE MENU DRAWER TRIGGER */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] active:scale-95 ${
            mobileMenuOpen
              ? 'text-emerald-700 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none tracking-tight">
            {isEn ? 'All Apps' : 'تمام فیچرز'}
          </span>
        </button>
      </div>

      {/* ========================================================
          MOBILE ALL-FEATURES DRAWER OVERLAY
          ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {isEn ? 'Smart Farm Navigation' : 'سمارٹ فارم نیویگیشن و کنٹرول'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? 'Select any module to navigate directly' : 'تمام موڈیولز و فارم ٹولز ایک جگہ'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search any module...' : 'کوئی بھی موڈیول تلاش کریں...'}
                  className="w-full ps-9 pe-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Mobile Categorized Grid */}
            <div className="p-4 overflow-y-auto space-y-4 max-h-[62vh]">
              {navigationGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 block px-1">
                    {isEn ? group.titleEn : group.titleUr}
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const label = isEn ? item.labelEn : item.labelUr;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`p-3 rounded-2xl border text-start flex items-center space-x-2.5 rtl:space-x-reverse transition-all active:scale-95 min-h-[48px] overflow-visible ${
                            isActive
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1 overflow-visible">
                            <span className={`text-xs font-bold block ${isRtl ? 'leading-relaxed line-clamp-2 overflow-visible' : 'truncate'}`}>{label}</span>
                            {item.badge && (
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded inline-block mt-0.5 ${getBadgeStyle(item.badgeVariant)}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Close Bar */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-black text-xs shadow-md"
              >
                {isEn ? 'Close Menu' : 'مینُو بند کریں'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
