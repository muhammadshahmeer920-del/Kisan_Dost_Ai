import React, { useState, useEffect } from 'react';
import { User, Language, UserNavRoute } from '../types';
import { 
  Home, 
  Sparkles, 
  FolderOpen, 
  FileCheck, 
  Bell, 
  MessageSquare, 
  User as UserIcon, 
  Settings, 
  LogOut,
  Layers,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Search,
  UserCheck,
  ChevronRight,
  Menu,
  X,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Eye,
  EyeOff,
  Key,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { t } from '../lib/translations';

interface UserLayoutProps {
  user: User;
  language: Language;
  currentRoute: UserNavRoute;
  onNavigate: (route: UserNavRoute, extraTab?: string) => void;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onSwitchToAdminPortal?: () => void;
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({
  user,
  language,
  currentRoute,
  onNavigate,
  unreadNotificationsCount,
  unreadMessagesCount,
  darkMode,
  onToggleDarkMode,
  onLanguageChange,
  onLogout,
  onSwitchToAdminPortal,
  children
}) => {
  const isEn = language === 'en';
  const isRtl = language === 'ur' || language === 'pb';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Expandable Search Bar State
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  // Sidebar Collapsed State Persisted in LocalStorage
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

  // Admin Passcode Security Gate State
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleAdminSwitchClick = () => {
    // ALWAYS force passcode modal prompt every time Admin Command is clicked
    setAdminPasswordInput('');
    setAuthError('');
    setShowPassword(false);
    setIsAdminAuthModalOpen(true);
  };

  const handleVerifyAdminPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'password123') {
      setIsAdminAuthModalOpen(false);
      setAdminPasswordInput('');
      setAuthError('');
      if (onSwitchToAdminPortal) onSwitchToAdminPortal();
    } else {
      setAuthError(isEn ? 'Incorrect Admin Passcode. Access Denied.' : 'غیر صحیح ایڈمن پاس کوڈ! رسائی مسترد۔');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Keydown ESC listener to collapse search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchExpanded) {
        setHeaderSearchQuery('');
        setIsSearchExpanded(false);
        window.dispatchEvent(new CustomEvent('dashboard_search', { detail: '' }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchExpanded]);

  const navItems = [
    { id: 'dashboard' as UserNavRoute, label: isEn ? 'Dashboard' : 'ڈیش بورڈ', icon: Home },
    { id: 'services' as UserNavRoute, label: isEn ? 'Farm Services' : 'فارم سروسز', icon: Layers },
    { id: 'requests' as UserNavRoute, label: isEn ? 'My Requests' : 'میری درخواستیں', icon: FileCheck },
    { id: 'records' as UserNavRoute, label: isEn ? 'My Records' : 'محفوظ ریکارڈز', icon: FolderOpen },
    { 
      id: 'messages' as UserNavRoute, 
      label: isEn ? 'Support Desk' : 'سپورٹ پیغامات', 
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined 
    },
    { 
      id: 'notifications' as UserNavRoute, 
      label: isEn ? 'Notifications' : 'اعلانات', 
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined 
    },
    { id: 'profile' as UserNavRoute, label: isEn ? 'Farmer Profile' : 'پروفائل', icon: UserIcon },
    { id: 'settings' as UserNavRoute, label: isEn ? 'Settings' : 'ترتیبات', icon: Settings }
  ];

  return (
    <div className={`min-h-screen text-slate-900 dark:text-slate-100 transition-colors flex ${isRtl ? 'rtl flex-row-reverse' : 'ltr'}`}>
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Desktop & Mobile Floating Collapsible Sidebar */}
      <aside className={`fixed top-0 bottom-0 start-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-e border-slate-200/70 dark:border-slate-800/80 p-4 flex flex-col justify-between transition-all duration-300 ease-out shadow-2xl lg:shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64 sm:w-72'
      } ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0'
      }`}>
        
        {/* Top: Brand Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div 
              onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
              className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer group min-w-0"
            >
              <img src="/logo_icon.png" alt="Kisan Dost Logo" className="w-9 h-9 object-contain rounded-xl drop-shadow-md group-hover:scale-105 transition-transform shrink-0" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                      Kisan<span className="text-emerald-600 dark:text-emerald-400">Dost</span>
                    </span>
                    <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold truncate max-w-[120px]">
                    المدینہ ڈیری فارم
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? (isEn ? 'Expand Sidebar' : 'سائیڈ بار کھولیں') : (isEn ? 'Collapse Sidebar' : 'سائیڈ بار سمیٹیں')}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-4 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isEn ? 'Main Menu' : 'مرکزی مینیو'}
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              return (
                <button
                  key={item.id}
                  id={`user-nav-${item.id}`}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                  } rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 border border-emerald-400/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                    }`} />
                    {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Floating Badge in Collapsed Mode */}
                  {isCollapsed && item.badge && (
                    <span className="absolute top-1 end-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                  )}

                  {/* Floating Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute start-full ms-3 z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xl whitespace-nowrap pointer-events-none">
                      {item.label}
                      {item.badge && (
                        <span className="ms-1.5 text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Role Switcher, Language & Profile */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          
          {/* Admin Switch button if available */}
          {onSwitchToAdminPortal && (
            <button
              onClick={handleAdminSwitchClick}
              title={isCollapsed ? (isEn ? 'Admin Portal' : 'ایڈمن پورٹل') : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } rounded-2xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-bold shadow-sm transition-all group relative`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && <span>{isEn ? 'Admin Command' : 'ایڈمن پورٹل'}</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              )}
              {isCollapsed && (
                <div className="absolute start-full ms-3 z-50 hidden group-hover:flex items-center px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xl whitespace-nowrap pointer-events-none">
                  {isEn ? 'Admin Command' : 'ایڈمن پورٹل'}
                </div>
              )}
            </button>
          )}

          {/* User Capsule */}
          <div className={`p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            <div 
              onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
              className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer min-w-0"
              title={isCollapsed ? user.name : undefined}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {user.district || 'Verified Farmer'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={isEn ? 'Logout' : 'لاگ آؤٹ'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
        isCollapsed ? 'lg:ps-20' : 'lg:ps-72'
      }`}>
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 rtl:space-x-reverse flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize">
                {navItems.find(n => n.id === currentRoute)?.label || (isEn ? 'Dashboard' : 'ڈیش بورڈ')}
              </h1>
              {/* Dynamic Welcome Greeting Tag — role-aware */}
              <span className={`text-xs sm:text-sm font-medium px-3 py-1 rounded-full border ${
                user.userAccountType === 'user' || user.role === 'customer'
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/50'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50'
              }`}>
                {user.userAccountType === 'user' || user.role === 'customer'
                  ? (isEn
                    ? `Welcome, ${user.name || 'User'} 👋`
                    : `خوش آمدید، ${user.name || 'صارف'} 👋`)
                  : (user.farmName
                    ? (isEn
                      ? `Welcome, ${user.name || 'Farmer'} (${user.farmName}) 👋`
                      : `خوش آمدید، ${user.name || 'کسان'} (${user.farmName}) 👋`)
                    : (isEn
                      ? `Welcome, ${user.name || 'Chaudhry Ahmed Ali'} 👋`
                      : `خوش آمدید، ${user.name || 'چوہدری احمد علی'} 👋`))
                }
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse shrink-0">
            
            {/* Interactive Expandable Search Bar */}
            <div className="relative flex items-center">
              {isSearchExpanded ? (
                <div className="relative flex items-center animate-fade-in">
                  <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={headerSearchQuery}
                    onChange={(e) => {
                      setHeaderSearchQuery(e.target.value);
                      window.dispatchEvent(new CustomEvent('dashboard_search', { detail: e.target.value }));
                    }}
                    placeholder={isEn ? "Search animals, records, tags..." : "جانور یا ریکارڈ تلاش کریں..."}
                    className="w-64 md:w-80 transition-all duration-300 ps-9 pe-8 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-emerald-500/60 dark:border-emerald-500/60 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => {
                      setHeaderSearchQuery('');
                      setIsSearchExpanded(false);
                      window.dispatchEvent(new CustomEvent('dashboard_search', { detail: '' }));
                    }}
                    className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg"
                    title={isEn ? "Close Search (ESC)" : "تلاش ختم کریں"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                  title={isEn ? "Search animals, records, tags..." : "جانور یا ریکارڈ تلاش کریں"}
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  language === 'en' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ur')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  language === 'ur' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'
                }`}
              >
                اردو
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? (isEn ? 'Switch to Light Mode' : 'لائٹ موڈ') : (isEn ? 'Switch to Dark Mode' : 'ڈارک موڈ')}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

          </div>

        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>

      </div>

      {/* 🔒 ADMIN PASSCODE SECURITY MODAL ── */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <style>{`
            @keyframes shakeKeyframes {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-10px); }
              40%, 80% { transform: translateX(10px); }
            }
            .animate-shake-modal {
              animation: shakeKeyframes 0.4s ease-in-out;
            }
          `}</style>
          <div
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative overflow-hidden transition-all ${
              isShaking ? 'animate-shake-modal border-rose-500/80 shadow-rose-500/20' : ''
            }`}
          >
            {/* Header Icon */}
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-lg mb-3 border border-slate-700">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <span>🔒 {isEn ? 'Admin Command Security Access' : 'ایڈمن کنٹرول سیکیورٹی ایکسیس'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                {isEn
                  ? 'Enter system administrator key to switch to KisanDost Control Engine.'
                  : 'کسان دوست ایڈمن پورٹل میں داخل ہونے کے لیے سیکیورٹی پاس کوڈ درج کریں۔'}
              </p>
            </div>

            {/* Error Message Alert */}
            {authError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerifyAdminPasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isEn ? 'System Administrator Passcode' : 'ایڈمنسٹریٹر پاس کوڈ'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5 pointer-events-none" />
                  <input
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPasswordInput}
                    onChange={e => { setAdminPasswordInput(e.target.value); setAuthError(''); }}
                    placeholder={isEn ? 'Enter Admin Passcode...' : 'ایڈمن پاس کوڈ درج کریں...'}
                    className="w-full ps-10 pe-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    setAdminPasswordInput('');
                    setAuthError('');
                  }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
                >
                  {isEn ? 'Cancel' : 'منسوخ کریں'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isEn ? 'Unlock Control Center' : 'ایڈمن پورٹل کھولیں'}</span>
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 font-mono">
              <span>{isEn ? 'Authorized personnel only · Protected by KisanDost Auth' : 'سیکیورٹی کوڈ: password123'}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
