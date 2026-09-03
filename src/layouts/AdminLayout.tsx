import React, { useState, useEffect } from 'react';
import { User, Language, AdminNavRoute } from '../types';
import { 
  ShieldCheck, 
  Home, 
  Users, 
  FolderOpen, 
  FileCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  TrendingUp, 
  Cpu, 
  Activity, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Sparkles, 
  Server, 
  Radio, 
  ChevronRight, 
  ChevronLeft, 
  PanelLeftClose, 
  PanelLeft, 
  Lock,
  Layers
} from 'lucide-react';

interface AdminLayoutProps {
  user: User;
  language: Language;
  currentRoute: AdminNavRoute;
  onNavigate: (route: AdminNavRoute) => void;
  pendingApplicationsCount: number;
  openComplaintsCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onSwitchToUserPortal?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  language,
  currentRoute,
  onNavigate,
  pendingApplicationsCount,
  openComplaintsCount,
  darkMode,
  onToggleDarkMode,
  onLanguageChange,
  onLogout,
  onSwitchToUserPortal,
  children
}) => {
  const isEn = language === 'en';
  const isRtl = language === 'ur' || language === 'pb';
  
  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Desktop collapsible state (persisted in localStorage for convenience)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kisan_admin_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('kisan_admin_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save sidebar state:', e);
      }
      return next;
    });
  };

  const navSections = [
    {
      title: isEn ? 'Governance' : 'مرکزی کنٹرول',
      items: [
        { id: 'dashboard' as AdminNavRoute, label: isEn ? 'Command Center' : 'ایڈمن ڈیش بورڈ', icon: Home, shortLabel: isEn ? 'Dashboard' : 'ڈیش بورڈ' },
        { id: 'users' as AdminNavRoute, label: isEn ? 'User Accounts' : 'صارفین کی فہرست', icon: Users, shortLabel: isEn ? 'Users' : 'صارفین' },
        { id: 'records' as AdminNavRoute, label: isEn ? 'Unified Records' : 'مرکزی ریکارڈز', icon: FolderOpen, shortLabel: isEn ? 'Records' : 'ریکارڈز' },
      ]
    },
    {
      title: isEn ? 'Verification & Redressal' : 'درخواستیں و شکایات',
      items: [
        { 
          id: 'applications' as AdminNavRoute, 
          label: isEn ? 'Grants & Applications' : 'درخواستیں و سبسڈیز', 
          icon: FileCheck,
          shortLabel: isEn ? 'Grants' : 'درخواستیں',
          badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined
        },
        { 
          id: 'complaints' as AdminNavRoute, 
          label: isEn ? 'Grievances / Complaints' : 'کسان شکایات', 
          icon: AlertTriangle,
          shortLabel: isEn ? 'Grievances' : 'شکایات',
          badge: openComplaintsCount > 0 ? openComplaintsCount : undefined
        },
        { id: 'reports' as AdminNavRoute, label: isEn ? 'Bio-Security Reports' : 'وبائی الرٹس', icon: ShieldAlert, shortLabel: isEn ? 'Bio-Reports' : 'وبائی الرٹس' },
      ]
    },
    {
      title: isEn ? 'Communication' : 'رابطہ و پیغامات',
      items: [
        { id: 'notifications' as AdminNavRoute, label: isEn ? 'Broadcast Engine' : 'مرکزی اعلانات', icon: Radio, shortLabel: isEn ? 'Broadcast' : 'اعلانات' },
        { id: 'messages' as AdminNavRoute, label: isEn ? 'Support Desk Chat' : 'سپورٹ پیغامات', icon: MessageSquare, shortLabel: isEn ? 'Support' : 'سپورٹ' },
      ]
    },
    {
      title: isEn ? 'Telemetry & Security' : 'سیکیورٹی و اینالیٹکس',
      items: [
        { id: 'analytics' as AdminNavRoute, label: isEn ? 'System Analytics' : 'سسٹم اینالیٹکس', icon: TrendingUp, shortLabel: isEn ? 'Analytics' : 'اینالیٹکس' },
        { id: 'ai_activity' as AdminNavRoute, label: isEn ? 'AI Health Diagnostics' : 'اے آئی معائنے لاگ', icon: Cpu, shortLabel: isEn ? 'AI Telemetry' : 'اے آئی لاگز' },
        { id: 'logs' as AdminNavRoute, label: isEn ? 'Audit Trail' : 'سیکیورٹی آڈٹ لاگ', icon: Activity, shortLabel: isEn ? 'Audit' : 'آڈٹ لاگ' },
        { id: 'settings' as AdminNavRoute, label: isEn ? 'Platform Settings' : 'سسٹم ترتیبات', icon: Settings, shortLabel: isEn ? 'Settings' : 'ترتیبات' },
      ]
    }
  ];

  // Find active label for breadcrumbs
  const activeItem = navSections
    .flatMap(s => s.items)
    .find(item => item.id === currentRoute);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex ${isRtl ? 'rtl flex-row-reverse' : 'ltr'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside 
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 start-0 z-50 bg-slate-900/95 backdrop-blur-xl border-e border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          // Mobile state
          mobileSidebarOpen 
            ? 'translate-x-0 w-72' 
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0'
        } ${
          // Desktop collapsed state
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        
        {/* Brand Header */}
        <div>
          <div className={`p-4 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all`}>
            
            <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isCollapsed ? 'hidden' : 'flex'}`}>
              <div className="relative">
                <img src="/logo_icon.png" alt="Kisan Dost Logo" className="w-10 h-10 object-contain rounded-xl drop-shadow-md" />
                <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <span className="text-sm font-black text-white tracking-tight">KisanDost</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Control
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">المدینہ ڈیری فارم</p>
              </div>
            </div>

            {/* Collapsed Brand Icon */}
            {isCollapsed && (
              <div className="hidden lg:flex flex-col items-center group relative cursor-pointer" onClick={toggleCollapsed} title="Expand Sidebar">
                <img src="/logo_icon.png" alt="Kisan Dost Logo" className="w-10 h-10 object-contain rounded-xl drop-shadow-md hover:scale-105 transition-transform" />
                <span className="text-[9px] font-bold text-emerald-400 mt-1 uppercase tracking-tighter">Admin</span>
              </div>
            )}

            {/* Desktop Collapse Toggle Button */}
            <button
              id="admin-sidebar-collapse-btn"
              onClick={toggleCollapsed}
              title={isCollapsed ? (isEn ? 'Expand sidebar' : 'سائیڈبار کھولیں') : (isEn ? 'Collapse sidebar' : 'سائیڈبار سمیٹیں')}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 shadow-sm transition-all active:scale-95"
            >
              {isCollapsed ? (
                isRtl ? <ChevronLeft className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-400" />
              ) : (
                isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-170px)] scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                
                {/* Section Title (Expanded mode only) */}
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400/90 font-mono">
                      {section.title}
                    </span>
                    <span className="h-px bg-slate-800/60 flex-1 ms-2" />
                  </div>
                )}

                {/* Collapsed Divider */}
                {isCollapsed && idx > 0 && (
                  <div className="w-8 h-px bg-slate-800 mx-auto my-2" />
                )}

                <div className="space-y-1">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentRoute === item.id;

                    return (
                      <div key={item.id} className="relative group">
                        <button
                          id={`admin-nav-${item.id}`}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full relative flex items-center rounded-2xl text-xs font-bold transition-all duration-200 group outline-none ${
                            isCollapsed 
                              ? 'justify-center p-3 h-12 w-12 mx-auto' 
                              : 'justify-between px-3.5 py-2.5'
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/30'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                          }`}
                        >
                          {/* Active Left Marker Pill (Expanded mode) */}
                          {isActive && !isCollapsed && (
                            <span className="absolute inset-y-2 start-0 w-1 bg-white rounded-e-full shadow-sm" />
                          )}

                          {/* Left / Icon Area */}
                          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 rtl:space-x-reverse'}`}>
                            <div className={`relative flex items-center justify-center ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-transform'
                            }`}>
                              <Icon className="w-4 h-4 shrink-0" />
                              
                              {/* Collapsed notification dot badge */}
                              {isCollapsed && item.badge && (
                                <span className="absolute -top-1.5 -end-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            {!isCollapsed && (
                              <span className="tracking-tight text-xs">{item.label}</span>
                            )}
                          </div>

                          {/* Right Badge Count (Expanded mode) */}
                          {!isCollapsed && item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                              isActive 
                                ? 'bg-white text-emerald-800 ring-1 ring-emerald-200' 
                                : 'bg-rose-500/90 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {/* Active glowing background accent */}
                          {isActive && (
                            <div className="absolute inset-0 bg-emerald-400/10 rounded-2xl pointer-events-none" />
                          )}
                        </button>

                        {/* Collapsed Hover Tooltip */}
                        {isCollapsed && (
                          <div className="hidden lg:group-hover:flex absolute start-full top-1/2 -translate-y-1/2 ms-3 z-50 items-center pointer-events-none">
                            <div className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap flex items-center space-x-2 rtl:space-x-reverse">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                                  {item.badge}
                                </span>
                              )}
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Mode Switcher & Logged In Profile */}
        <div className={`p-3 border-t border-slate-800/80 space-y-2.5 bg-slate-900/90 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          
          {/* Switch to Farmer User Portal */}
          {onSwitchToUserPortal && (
            <button
              id="admin-switch-to-farmer-btn"
              onClick={onSwitchToUserPortal}
              title={isCollapsed ? (isEn ? 'Switch to Farmer Portal' : 'کسان پورٹل پر جائیں') : undefined}
              className={`flex items-center rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-700 hover:to-slate-700/90 border border-slate-700/70 text-slate-200 text-xs font-extrabold active:scale-95 transition-all group ${
                isCollapsed 
                  ? 'justify-center p-2.5 w-12 h-12' 
                  : 'w-full justify-between px-3.5 py-2.5'
              }`}
            >
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 group-hover:rotate-12 transition-transform" />
                {!isCollapsed && <span>{isEn ? 'Farmer View' : 'کسان موڈ'}</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              )}
            </button>
          )}

          {/* Admin User Info & Logout */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between pt-1'}`}>
            <div className={`flex items-center space-x-2.5 rtl:space-x-reverse ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                A
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Lead DevOps Admin</span>
                  <span className="text-[10px] text-emerald-400 flex items-center space-x-1 rtl:space-x-reverse font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">Cluster SuperUser</span>
                  </span>
                </div>
              )}
            </div>

            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className={`rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-all ${
                isCollapsed ? 'p-2' : 'p-1.5'
              }`}
              title={isEn ? 'Logout System' : 'لاگ آؤٹ'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* Main Content Viewport */}
      <div className={`flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ps-20' : 'lg:ps-72'
      }`}>
        
        {/* Top Sticky Admin Action Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          
          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              id="admin-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shrink-0"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Quick Collapse/Expand icon button in header */}
            <button
              onClick={toggleCollapsed}
              title={isCollapsed ? (isEn ? 'Expand sidebar' : 'سائیڈبار کھولیں') : (isEn ? 'Collapse sidebar' : 'سائیڈبار سمیٹیں')}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 active:scale-95 transition-all"
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4 text-emerald-400" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb Navigation indicator */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse text-xs min-w-0">
              <span className="font-mono text-slate-400 hidden sm:inline">Control Center</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <div className="flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 truncate">
                  {activeItem ? activeItem.label : currentRoute.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2.5 rtl:space-x-reverse shrink-0">
            
            {/* Health Status Pill */}
            <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300">
              <Server className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Gemini 2.5: Active</span>
            </div>

            {/* Language Switch */}
            <button
              id="admin-lang-btn"
              onClick={() => onLanguageChange(language === 'ur' ? 'en' : 'ur')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-700 text-[11px] sm:text-xs font-black bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 transition-all shrink-0"
            >
              {language === 'ur' ? 'English' : 'اردو'}
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="admin-dark-mode-btn"
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white bg-slate-800 active:scale-95 transition-all shrink-0"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Switch to User Mode button */}
            {onSwitchToUserPortal && (
              <button
                id="admin-farmer-portal-switch"
                onClick={onSwitchToUserPortal}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-emerald-900/30 active:scale-95 transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Farmer Portal' : 'کسان پورٹل'}</span>
                <span className="sm:hidden">{isEn ? 'Farmer' : 'کسان'}</span>
              </button>
            )}

          </div>

        </header>

        {/* Dynamic Admin Body */}
        <main className="p-3 sm:p-6 lg:p-8 flex-1 w-full max-w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
};

