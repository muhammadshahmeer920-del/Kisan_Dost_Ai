import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Animal, 
  FarmExpense, 
  Appointment, 
  OutbreakReport, 
  Language, 
  AIExecutionMode, 
  DairyProduct, 
  AppFrontageMode, 
  CustomerOrderLead,
  Order,
  AppInterface,
  UserNavRoute,
  AdminNavRoute,
  AdminUserItem,
  UnifiedRecord,
  UserApplication,
  UserComplaint,
  SystemReport,
  AdminNotification,
  SupportMessageThread,
  AIActivityLog,
  AdminAuditLogEntry,
  AdminSystemSettings
} from './types';

import { 
  initialUser, 
  initialAnimals, 
  initialExpenses, 
  initialAppointments, 
  initialOutbreaks, 
  initialDairyProducts 
} from './lib/mockData';

import { 
  saveUser, 
  getUser, 
  getAnimals, 
  saveAnimals, 
  getExpenses, 
  saveExpenses, 
  getAppointments, 
  saveAppointments, 
  getDairyProducts, 
  saveDairyProducts, 
  getCustomerOrders, 
  saveCustomerOrders,
  getStoredAdminUsers,
  getStoredUnifiedRecords,
  getStoredApplications,
  getStoredComplaints,
  getStoredSystemReports,
  getStoredNotifications,
  getStoredSupportThreads,
  getStoredAILogs,
  getStoredAuditLogs,
  getStoredSystemSettings,
  getStoredLanguage,
  saveStoredLanguage,
  getUserAuthorizedRecords,
  getUserApplications,
  getUserComplaints,
  getUserSupportThread,
  getStoredUserActivityLogs
} from './lib/storage';
import { subscribeToAdminSync } from './services/adminFarmerSync';
import * as syncApi from './lib/syncApi';

import { 
  seedFirestoreInitialData, 
  subscribeToFirestoreCollection, 
  COLLECTIONS, 
  subscribeToAuth, 
  fetchOrCreateUserProfile, 
  logoutFirebaseUser 
} from './lib/firebase';

// User Space Components
import { UserLayout } from './layouts/UserLayout';
import { UserDashboard } from './user/UserDashboard';
import { UserServices } from './user/UserServices';
import { UserRequests } from './user/UserRequests';
import { UserRecords } from './user/UserRecords';
import { UserNotifications } from './user/UserNotifications';
import { UserMessages } from './user/UserMessages';
import { UserProfile } from './user/UserProfile';
import { UserSettings } from './user/UserSettings';

// Admin Space Components
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminUsers } from './admin/AdminUsers';
import { AdminRecords } from './admin/AdminRecords';
import { AdminApplications } from './admin/AdminApplications';
import { AdminComplaints } from './admin/AdminComplaints';
import { AdminReports } from './admin/AdminReports';
import { AdminNotifications } from './admin/AdminNotifications';
import { AdminMessages } from './admin/AdminMessages';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminAIActivity } from './admin/AdminAIActivity';
import { AdminLogs } from './admin/AdminLogs';
import { AdminSettings } from './admin/AdminSettings';

// Security Guard
import { ForbiddenAccess } from './components/ForbiddenAccess';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  // Main User & Core Entities
  const [user, setUser] = useState<User>(() => getUser() || initialUser);
  const [animals, setAnimals] = useState<Animal[]>(() => {
    const saved = getAnimals();
    return saved.length > 0 ? saved : initialAnimals;
  });
  const [expenses, setExpenses] = useState<FarmExpense[]>(() => {
    const saved = getExpenses();
    return saved.length > 0 ? saved : initialExpenses;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = getAppointments();
    return saved.length > 0 ? saved : initialAppointments;
  });
  const [dairyProducts, setDairyProducts] = useState<DairyProduct[]>(() => {
    const saved = getDairyProducts();
    return saved.length > 0 ? saved : initialDairyProducts;
  });
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderLead[]>(() => {
    return getCustomerOrders() || [];
  });
  const [outbreaks] = useState<OutbreakReport[]>(initialOutbreaks);

  // Administrative / Unified Store State
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>(() => getStoredAdminUsers());
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedRecord[]>(() => getStoredUnifiedRecords());
  const [applications, setApplications] = useState<UserApplication[]>(() => getStoredApplications());
  const [complaints, setComplaints] = useState<UserComplaint[]>(() => getStoredComplaints());
  const [systemReports, setSystemReports] = useState<SystemReport[]>(() => getStoredSystemReports());
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => getStoredNotifications());
  const [supportThreads, setSupportThreads] = useState<SupportMessageThread[]>(() => getStoredSupportThreads());
  const [aiLogs, setAiLogs] = useState<AIActivityLog[]>(() => getStoredAILogs());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(() => getStoredAuditLogs());
  const [systemSettings, setSystemSettings] = useState<AdminSystemSettings>(() => getStoredSystemSettings());

  // Dual-Interface Architecture State
  const [appInterface, setAppInterface] = useState<AppInterface>(() => {
    try {
      const saved = localStorage.getItem('kisan_active_interface');
      if (saved === 'admin' || saved === 'user') return saved;
      if (window.location.hash.includes('admin')) return 'admin';
      return 'user';
    } catch {
      return 'user';
    }
  });

  const [userRoute, setUserRoute] = useState<UserNavRoute>('dashboard');
  const [adminRoute, setAdminRoute] = useState<AdminNavRoute>('dashboard');
  const [initialUserService, setInitialUserService] = useState<string>('hub');

  // App Configuration
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveStoredLanguage(newLang);
  };
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kisan_dark_mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [executionMode, setExecutionMode] = useState<AIExecutionMode>('online');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync active interface to localStorage
  const handleSwitchInterface = (targetInterface: AppInterface) => {
    setAppInterface(targetInterface);
    try {
      localStorage.setItem('kisan_active_interface', targetInterface);
      sessionStorage.removeItem('kisan_admin_auth');
    } catch (e) {
      console.warn('Could not persist active interface:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reload admin data from storage
  const refreshAdminData = () => {
    setAdminUsers(getStoredAdminUsers());
    setUnifiedRecords(getStoredUnifiedRecords());
    setApplications(getStoredApplications());
    setComplaints(getStoredComplaints());
    setSystemReports(getStoredSystemReports());
    setNotifications(getStoredNotifications());
    setSupportThreads(getStoredSupportThreads());
    setAiLogs(getStoredAILogs());
    setAuditLogs(getStoredAuditLogs());
    setSystemSettings(getStoredSystemSettings());
  };

  // Real-time synchronization listener across tabs & windows (<50ms)
  useEffect(() => {
    const unsub = subscribeToAdminSync(refreshAdminData);
    return () => unsub();
  }, []);

  // Sync state to storage
  useEffect(() => {
    saveUser(user);
    if (!user.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('kisan_dark_mode', JSON.stringify(darkMode));
    } catch (e) {
      console.warn('Could not save dark mode:', e);
    }
  }, [darkMode]);

  // Dynamic Language & text direction (RTL/LTR) support
  useEffect(() => {
    if (language) {
      document.documentElement.lang = language;
      document.documentElement.dir = (language === 'ur' || language === 'pb') ? 'rtl' : 'ltr';
    }
  }, [language]);

  // Ensure user support thread exists in storage
  useEffect(() => {
    if (user.id) {
      getUserSupportThread(user.id, user.name, user.phone);
      setSupportThreads(getStoredSupportThreads());
    }
  }, [user.id, user.name, user.phone]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchOrCreateUserProfile(firebaseUser);
        setUser(userProfile);
        setShowAuthModal(false);
      }
    });
    return () => {
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  // Server session restore + Socket.io sync
  useEffect(() => {
    let cancelled = false;

    async function restoreAndConnect() {
      const token = syncApi.getToken();
      if (!token) return;

      const session = await syncApi.restoreSession();
      if (cancelled) return;

      if (session.ok && session.user) {
        setUser(prev => ({ ...prev, ...session.user! }));
      }

      if (token) {
        syncApi.connectSocket(token, {
          onProfileUpdated: (payload) => {
            if (payload?.data) {
              const serverUser = {
                id: payload.data.id,
                name: payload.data.name || '',
                phone: payload.data.phone || '',
                email: payload.data.email || '',
                farmName: payload.data.farm_name || '',
                location: payload.data.location || '',
                district: payload.data.district || '',
                language: payload.data.language || 'ur',
                isPremium: payload.data.is_premium === 1,
                hasCompletedOnboarding: payload.data.has_completed_onboarding === 1,
                createdAt: payload.data.created_at || '',
                updatedAt: payload.data.updated_at,
              };
              setUser(prev => {
                if (payload.data.updated_at && (prev as any).updatedAt && (prev as any).updatedAt >= payload.data.updated_at) {
                  return prev;
                }
                return { ...prev, ...serverUser };
              });
            }
          },
          onProductEvent: (event, payload) => {
            if (event === 'deleted' && payload?.data?.id) {
              setDairyProducts(prev => prev.filter(p => p.id !== payload.data.id));
            } else if (payload?.data) {
              const adapted = syncApi.adaptServerProduct(payload.data);
              setDairyProducts(prev => {
                const idx = prev.findIndex(p => p.id === adapted.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = { ...next[idx], ...adapted };
                  return next;
                }
                return [adapted, ...prev];
              });
            }
          },
          onOrderEvent: (event, payload) => {
            if (event === 'deleted' && payload?.data?.id) {
              setCustomerOrders(prev => prev.filter(o => o.id !== payload.data.id));
            } else if (payload?.data) {
              const adapted = syncApi.adaptServerOrder(payload.data);
              setCustomerOrders(prev => {
                const idx = prev.findIndex(o => o.id === adapted.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = { ...next[idx], ...adapted };
                  return next;
                }
                return [adapted, ...prev];
              });
            }
          },
          onSnapshot: (data) => {
            if (data?.profile) {
              const su = data.profile;
              setUser(prev => ({
                ...prev,
                id: su.id || prev.id,
                name: su.name || prev.name,
                phone: su.phone || prev.phone,
                email: su.email || prev.email,
                farmName: su.farm_name || prev.farmName,
                location: su.location || prev.location,
                district: su.district || prev.district,
              }));
            }
          },
          onConnect: () => console.log('[App] sync socket connected'),
          onDisconnect: () => console.log('[App] sync socket disconnected'),
        });
      }
    }

    restoreAndConnect();
    return () => { cancelled = true; syncApi.disconnectSocket(); };
  }, []);

  // Firestore Realtime Synchronization & Initial Seeding
  useEffect(() => {
    seedFirestoreInitialData(user, animals, expenses, appointments, dairyProducts);

    const unsubAnimals = subscribeToFirestoreCollection<Animal>(COLLECTIONS.ANIMALS, (items) => {
      if (items && items.length > 0) setAnimals(items);
    });

    const unsubExpenses = subscribeToFirestoreCollection<FarmExpense>(COLLECTIONS.EXPENSES, (items) => {
      if (items && items.length > 0) setExpenses(items);
    });

    const unsubAppointments = subscribeToFirestoreCollection<Appointment>(COLLECTIONS.APPOINTMENTS, (items) => {
      if (items && items.length > 0) setAppointments(items);
    });

    const unsubDairy = subscribeToFirestoreCollection<DairyProduct>(COLLECTIONS.DAIRY_PRODUCTS, (items) => {
      if (items && items.length > 0) setDairyProducts(items);
    });

    return () => {
      if (typeof unsubAnimals === 'function') unsubAnimals();
      if (typeof unsubExpenses === 'function') unsubExpenses();
      if (typeof unsubAppointments === 'function') unsubAppointments();
      if (typeof unsubDairy === 'function') unsubDairy();
    };
  }, []);

  useEffect(() => { saveAnimals(animals); }, [animals]);
  useEffect(() => { saveExpenses(expenses); }, [expenses]);
  useEffect(() => { saveAppointments(appointments); }, [appointments]);
  useEffect(() => { saveDairyProducts(dairyProducts); }, [dairyProducts]);

  // Handlers
  const handleSaveAnimal = (animalToSave: Animal) => {
    setAnimals((prev) => {
      const idx = prev.findIndex((a) => a.id === animalToSave.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = animalToSave;
        return next;
      }
      return [animalToSave, ...prev];
    });
    refreshAdminData();
  };

  const handleDeleteAnimal = (id: string) => {
    setAnimals((prev) => prev.filter((a) => a.id !== id));
    refreshAdminData();
  };

  const handleSaveScanJournal = (animalId: string, scanEntry: any) => {
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id === animalId) {
          return {
            ...a,
            scanJournal: [scanEntry, ...a.scanJournal],
            healthStatus: scanEntry.severity === 'severe' || scanEntry.severity === 'critical' ? 'sick' : 'fair',
          };
        }
        return a;
      })
    );
    refreshAdminData();
  };

  const handleAddVaccination = (animalId: string, vac: any) => {
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id === animalId) {
          return {
            ...a,
            vaccinationHistory: [vac, ...a.vaccinationHistory],
          };
        }
        return a;
      })
    );
    refreshAdminData();
  };

  const handleAddExpense = (expense: FarmExpense) => {
    setExpenses((prev) => [expense, ...prev]);
    refreshAdminData();
  };

  const handleBookAppointment = (apt: Appointment) => {
    setAppointments((prev) => [apt, ...prev]);
    refreshAdminData();
  };

  const handleSaveDairyProduct = (product: DairyProduct) => {
    setDairyProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });
    refreshAdminData();

    if (syncApi.getToken()) {
      syncApi.emitProductUpsert({
        id: product.id,
        name_en: product.nameEn || product.name,
        name_ur: product.nameUr || product.name,
        category: product.category,
        category_en: product.categoryEn || product.category,
        price_pkr: product.pricePKR || product.price || 0,
        unit: product.unit,
        unit_ur: product.unitUr || product.unit,
        stock: product.stock ?? 0,
        daily_capacity: product.dailyCapacity || '',
        is_organic: product.isOrganic ? 1 : 0,
        in_stock: product.inStock ? 1 : 0,
        description_en: product.descriptionEn || product.description,
        description_ur: product.descriptionUr || product.description,
        image_url: product.imageUrl || '',
        seller_name: product.sellerName || '',
        seller_phone: product.sellerPhone || '',
        seller_city: product.sellerCity || '',
        farm_name: product.farmName || '',
        updated_at: product.updatedAt,
      }).then(res => {
        if (res?.ok && res.data) {
          setDairyProducts(prev => prev.map(p =>
            p.id === product.id ? { ...p, updatedAt: res.data.updated_at } : p
          ));
        }
      }).catch(() => {});
    }
  };

  const handleDeleteDairyProduct = (id: string) => {
    setDairyProducts((prev) => prev.filter((p) => p.id !== id));
    refreshAdminData();

    if (syncApi.getToken()) {
      syncApi.emitProductDelete(id).catch(() => {});
    }
  };

  const handleCreateOrder = (order: Order) => {
    // Save order to state (could also be saved to database via API)
    console.log('Order created:', order);
    
    // Optionally: notify seller about new order
    // Could implement: send notification, email seller, SMS, etc.
    
    // For now, just log success
    console.log(`Order ${order.id} created successfully. Seller ${order.sellerId} will be notified.`);
  };

  const handleCompleteOnboarding = () => {
    const updatedUser = { ...user, hasCompletedOnboarding: true };
    setUser(updatedUser);
    setShowOnboarding(false);
  };

  const handleNavigateToService = (serviceId: string) => {
    setInitialUserService(serviceId);
    setUserRoute('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // User-specific data slices (Security-enforced)
  const userAuthorizedRecords = useMemo(() => {
    return getUserAuthorizedRecords(user.id, animals, expenses, appointments, dairyProducts, customerOrders);
  }, [user.id, animals, expenses, appointments, dairyProducts, customerOrders]);

  const userAuthorizedApplications = useMemo(() => {
    return getUserApplications(user.id);
  }, [user.id, applications]);

  const userAuthorizedComplaints = useMemo(() => {
    return getUserComplaints(user.id);
  }, [user.id, complaints]);

  const userSupportThread = useMemo(() => {
    return supportThreads.find(t => t.userId === user.id || t.userId === 'usr_001') || null;
  }, [user.id, supportThreads]);

  const pendingAppsCount = applications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const openComplaintsCount = complaints.filter(c => c.status === 'new' || c.status === 'in_progress').length;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. NORMAL USER INTERFACE (Farmer Portal)
         ───────────────────────────────────────────────────────────── */}
      {appInterface === 'user' && (
        <UserLayout
          user={user}
          language={language}
          currentRoute={userRoute}
          onNavigate={setUserRoute}
          unreadNotificationsCount={notifications.length}
          unreadMessagesCount={userSupportThread ? userSupportThread.messages.filter(m => m.senderRole === 'admin').length : 0}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onLanguageChange={handleLanguageChange}
          onLogout={async () => {
            await logoutFirebaseUser();
            setShowAuthModal(true);
          }}
          onSwitchToAdminPortal={() => handleSwitchInterface('admin')}
        >
          {userRoute === 'dashboard' && (
            <UserDashboard
              user={user}
              animals={animals}
              records={userAuthorizedRecords}
              applications={userAuthorizedApplications}
              notifications={notifications}
              messageThread={userSupportThread}
              language={language}
              onNavigateUser={setUserRoute}
            />
          )}

          {userRoute === 'services' && (
            <UserServices
              initialService={initialUserService}
              user={user}
              animals={animals}
              dairyProducts={dairyProducts}
              appointments={appointments}
              expenses={expenses}
              customerOrders={customerOrders}
              language={language}
              onLanguageChange={handleLanguageChange}
              executionMode={executionMode}
              onToggleExecutionMode={() => setExecutionMode(prev => prev === 'online' ? 'offline' : 'online')}
              onSaveAnimal={handleSaveAnimal}
              onDeleteAnimal={handleDeleteAnimal}
              onSaveDairyProduct={handleSaveDairyProduct}
              onDeleteDairyProduct={handleDeleteDairyProduct}
              onCreateOrder={handleCreateOrder}
              onBookAppointment={handleBookAppointment}
              handleAddVaccination={handleAddVaccination}
              handleAddExpense={handleAddExpense}
              handleSaveScanJournal={handleSaveScanJournal}
            />
          )}

          {userRoute === 'requests' && (
            <UserRequests
              user={user}
              applications={userAuthorizedApplications}
              language={language}
              onRefreshApplications={refreshAdminData}
            />
          )}

          {userRoute === 'records' && (
            <UserRecords
              user={user}
              records={userAuthorizedRecords}
              language={language}
            />
          )}

          {userRoute === 'notifications' && (
            <UserNotifications
              notifications={notifications}
              language={language}
              onRefreshNotifications={refreshAdminData}
            />
          )}

          {userRoute === 'messages' && (
            <UserMessages
              user={user}
              thread={userSupportThread}
              language={language}
              onRefreshMessages={refreshAdminData}
            />
          )}

          {userRoute === 'profile' && (
            <UserProfile
              user={user}
              language={language}
              onUpdateUser={setUser}
            />
          )}

          {userRoute === 'settings' && (
            <UserSettings
              user={user}
              language={language}
              onLanguageChange={handleLanguageChange}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              executionMode={executionMode}
              onToggleExecutionMode={() => setExecutionMode(prev => prev === 'online' ? 'offline' : 'online')}
              onLogout={async () => {
                await logoutFirebaseUser();
                localStorage.clear();
                setShowAuthModal(true);
              }}
            />
          )}
        </UserLayout>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. ADMIN INTERFACE (Command & Control Center)
         ───────────────────────────────────────────────────────────── */}
      {appInterface === 'admin' && (
        <AdminLayout
          user={user}
          language={language}
          currentRoute={adminRoute}
          onNavigate={setAdminRoute}
          pendingApplicationsCount={pendingAppsCount}
          openComplaintsCount={openComplaintsCount}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onLanguageChange={handleLanguageChange}
          onLogout={async () => {
            await logoutFirebaseUser();
            handleSwitchInterface('user');
          }}
          onSwitchToUserPortal={() => handleSwitchInterface('user')}
        >
          {adminRoute === 'dashboard' && (
            <AdminDashboard
              users={adminUsers}
              records={unifiedRecords}
              applications={applications}
              complaints={complaints}
              reports={systemReports}
              aiLogs={aiLogs}
              auditLogs={auditLogs}
              language={language}
              onNavigateAdmin={setAdminRoute}
            />
          )}

          {adminRoute === 'users' && (
            <AdminUsers
              users={adminUsers}
              language={language}
              onRefreshUsers={refreshAdminData}
            />
          )}

          {adminRoute === 'records' && (
            <AdminRecords
              records={unifiedRecords}
              language={language}
              onRefreshRecords={refreshAdminData}
            />
          )}

          {adminRoute === 'applications' && (
            <AdminApplications
              applications={applications}
              language={language}
              onRefreshApplications={refreshAdminData}
            />
          )}

          {adminRoute === 'complaints' && (
            <AdminComplaints
              complaints={complaints}
              language={language}
              onRefreshComplaints={refreshAdminData}
            />
          )}

          {adminRoute === 'reports' && (
            <AdminReports
              reports={systemReports}
              language={language}
              onRefreshReports={refreshAdminData}
            />
          )}

          {adminRoute === 'notifications' && (
            <AdminNotifications
              notifications={notifications}
              language={language}
              onRefreshNotifications={refreshAdminData}
            />
          )}

          {adminRoute === 'messages' && (
            <AdminMessages
              threads={supportThreads}
              language={language}
              onRefreshThreads={refreshAdminData}
            />
          )}

          {adminRoute === 'analytics' && (
            <AdminAnalytics
              users={adminUsers}
              records={unifiedRecords}
              applications={applications}
              aiLogs={aiLogs}
              language={language}
            />
          )}

          {adminRoute === 'ai_activity' && (
            <AdminAIActivity
              aiLogs={aiLogs}
              language={language}
            />
          )}

          {adminRoute === 'logs' && (
            <AdminLogs
              auditLogs={auditLogs}
              language={language}
            />
          )}

          {adminRoute === 'settings' && (
            <AdminSettings
              settings={systemSettings}
              language={language}
              onRefreshSettings={refreshAdminData}
            />
          )}
        </AdminLayout>
      )}

      {/* Global Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
        language={language}
      />

      <AuthModal
        isOpen={showAuthModal}
        onLoginSuccess={(u) => {
          setUser(u);
          setShowAuthModal(false);
          // Role-based routing: General Users → Dairy Store, Farmers → Dashboard
          if (u.userAccountType === 'user' || u.role === 'customer') {
            setInitialUserService('dairy-store');
            setUserRoute('services');
          } else {
            setUserRoute('dashboard');
          }
        }}
        language={language}
      />
    </>
  );
};

export default App;
