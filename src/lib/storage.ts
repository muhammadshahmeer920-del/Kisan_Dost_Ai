import { 
  Animal, 
  User, 
  VetDoctor, 
  FarmExpense, 
  OutbreakReport, 
  Appointment, 
  AIExecutionMode, 
  DairyProduct,
  CustomerOrderLead,
  AdminUserItem,
  UnifiedRecord,
  UserApplication,
  UserComplaint,
  SystemReport,
  AdminNotification,
  SupportMessageThread,
  AIActivityLog,
  AdminAuditLogEntry,
  AdminSystemSettings,
  BiosecurityAssessment,
  UserActivityLog
} from '../types';
import { 
  initialUser, 
  initialAnimals, 
  initialVets, 
  initialExpenses, 
  initialOutbreaks, 
  initialAppointments, 
  initialDairyProducts,
  initialAdminUsers,
  initialApplications,
  initialComplaints,
  initialSystemReports,
  initialNotifications,
  initialMessageThreads,
  initialAIActivityLogs,
  initialAdminAuditLogs,
  initialAdminSystemSettings
} from './mockData';
import { syncDocToFirestore, COLLECTIONS } from './firebase';

const KEYS = {
  USER: 'kisan_dost_user',
  LANGUAGE: 'kisan_dost_language',
  ANIMALS: 'kisan_dost_animals',
  EXPENSES: 'kisan_dost_expenses',
  APPOINTMENTS: 'kisan_dost_appointments',
  DAIRY_PRODUCTS: 'kisan_dost_dairy_products',
  CUSTOMER_ORDERS: 'kisan_dost_customer_orders',
  ADMIN_USERS: 'kisan_dost_admin_users',
  APPLICATIONS: 'kisan_dost_applications',
  COMPLAINTS: 'kisan_dost_complaints',
  SYSTEM_REPORTS: 'kisan_dost_system_reports',
  NOTIFICATIONS: 'kisan_dost_notifications',
  MESSAGES: 'kisan_dost_messages',
  AI_ACTIVITY: 'kisan_dost_ai_activity',
  AUDIT_LOGS: 'kisan_dost_audit_logs',
  SETTINGS: 'kisan_dost_admin_settings',
  CURRENT_ADMIN_ROLE: 'kisan_dost_current_admin_role',
  FRONTAGE_MODE: 'kisan_dost_frontage_mode',
  MODE: 'kisan_dost_ai_mode',
  OFFLINE_QUEUE: 'kisan_dost_offline_queue',
  BIOSECURITY: 'kisan_dost_biosecurity_assessments',
  USER_ACTIVITY_LOGS: 'kisan_dost_user_activity_logs',  // New: sign-up/sign-in events
};

// Language Persistence
export function getStoredLanguage(): 'ur' | 'en' | 'pb' {
  try {
    const lang = localStorage.getItem(KEYS.LANGUAGE) || localStorage.getItem('kisan_language');
    if (lang === 'ur' || lang === 'en' || lang === 'pb') {
      return lang;
    }
    return 'ur';
  } catch {
    return 'ur';
  }
}

export function saveStoredLanguage(lang: 'ur' | 'en' | 'pb'): void {
  try {
    localStorage.setItem(KEYS.LANGUAGE, lang);
    localStorage.setItem('kisan_language', lang);
  } catch (e) {
    console.error('Error saving language preference', e);
  }
}

// Admin Active Role (for RBAC testing and enforcement)
export function getCurrentAdminRole(): 'user' | 'moderator' | 'admin' | 'super_admin' {
  try {
    const role = localStorage.getItem(KEYS.CURRENT_ADMIN_ROLE);
    if (role === 'user' || role === 'moderator' || role === 'admin' || role === 'super_admin') {
      return role;
    }
    return 'super_admin';
  } catch {
    return 'super_admin';
  }
}

export function setCurrentAdminRole(role: 'user' | 'moderator' | 'admin' | 'super_admin'): void {
  try {
    localStorage.setItem(KEYS.CURRENT_ADMIN_ROLE, role);
  } catch (e) {
    console.error('Error saving current admin role', e);
  }
}

// Admin Users
export function getStoredAdminUsers(): AdminUserItem[] {
  try {
    const data = localStorage.getItem(KEYS.ADMIN_USERS);
    return data ? JSON.parse(data) : initialAdminUsers;
  } catch {
    return initialAdminUsers;
  }
}

export function saveStoredAdminUsers(users: AdminUserItem[]): void {
  try {
    localStorage.setItem(KEYS.ADMIN_USERS, JSON.stringify(users));
    users.forEach(u => syncDocToFirestore(COLLECTIONS.ADMIN_USERS, u));
  } catch (e) {
    console.error('Error saving admin users', e);
  }
}

// Applications
export function getStoredApplications(): UserApplication[] {
  try {
    const data = localStorage.getItem(KEYS.APPLICATIONS);
    return data ? JSON.parse(data) : initialApplications;
  } catch {
    return initialApplications;
  }
}

export function saveStoredApplications(apps: UserApplication[]): void {
  try {
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
    apps.forEach(a => syncDocToFirestore(COLLECTIONS.APPLICATIONS, a));
  } catch (e) {
    console.error('Error saving applications', e);
  }
}

// Complaints
export function getStoredComplaints(): UserComplaint[] {
  try {
    const data = localStorage.getItem(KEYS.COMPLAINTS);
    return data ? JSON.parse(data) : initialComplaints;
  } catch {
    return initialComplaints;
  }
}

export function saveStoredComplaints(complaints: UserComplaint[]): void {
  try {
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(complaints));
    complaints.forEach(c => syncDocToFirestore(COLLECTIONS.COMPLAINTS, c));
  } catch (e) {
    console.error('Error saving complaints', e);
  }
}

// System Reports
export function getStoredSystemReports(): SystemReport[] {
  try {
    const data = localStorage.getItem(KEYS.SYSTEM_REPORTS);
    return data ? JSON.parse(data) : initialSystemReports;
  } catch {
    return initialSystemReports;
  }
}

export function saveStoredSystemReports(reports: SystemReport[]): void {
  try {
    localStorage.setItem(KEYS.SYSTEM_REPORTS, JSON.stringify(reports));
    reports.forEach(r => syncDocToFirestore(COLLECTIONS.SYSTEM_REPORTS, r));
  } catch (e) {
    console.error('Error saving system reports', e);
  }
}

// Notifications
export function getStoredNotifications(): AdminNotification[] {
  try {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : initialNotifications;
  } catch {
    return initialNotifications;
  }
}

export function saveStoredNotifications(notifs: AdminNotification[]): void {
  try {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifs.forEach(n => syncDocToFirestore(COLLECTIONS.NOTIFICATIONS, n));
  } catch (e) {
    console.error('Error saving notifications', e);
  }
}

// Support Messages
export function getStoredMessageThreads(): SupportMessageThread[] {
  try {
    const data = localStorage.getItem(KEYS.MESSAGES);
    return data ? JSON.parse(data) : initialMessageThreads;
  } catch {
    return initialMessageThreads;
  }
}

export function saveStoredMessageThreads(threads: SupportMessageThread[]): void {
  try {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(threads));
    threads.forEach(t => syncDocToFirestore(COLLECTIONS.MESSAGES, t));
  } catch (e) {
    console.error('Error saving message threads', e);
  }
}

// AI Activity Logs
export function getStoredAIActivityLogs(): AIActivityLog[] {
  try {
    const data = localStorage.getItem(KEYS.AI_ACTIVITY);
    return data ? JSON.parse(data) : initialAIActivityLogs;
  } catch {
    return initialAIActivityLogs;
  }
}

export function logAIActivity(entry: Omit<AIActivityLog, 'id' | 'dateTime'> & { id?: string; dateTime?: string }): void {
  try {
    const logs = getStoredAIActivityLogs();
    const newLog: AIActivityLog = {
      id: entry.id || 'ai_' + Math.random().toString(36).substring(2, 9),
      dateTime: entry.dateTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...entry
    };
    const updated = [newLog, ...logs].slice(0, 200); // keep last 200 logs
    localStorage.setItem(KEYS.AI_ACTIVITY, JSON.stringify(updated));
    syncDocToFirestore(COLLECTIONS.AI_ACTIVITY, newLog);
  } catch (e) {
    console.error('Error logging AI activity', e);
  }
}

// Audit Logs
export function getStoredAuditLogs(): AdminAuditLogEntry[] {
  try {
    const data = localStorage.getItem(KEYS.AUDIT_LOGS);
    return data ? JSON.parse(data) : initialAdminAuditLogs;
  } catch {
    return initialAdminAuditLogs;
  }
}

export function logAdminAction(entry: Omit<AdminAuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
  try {
    const logs = getStoredAuditLogs();
    const newLog: AdminAuditLogEntry = {
      id: entry.id || 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...entry
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(updated));
    syncDocToFirestore(COLLECTIONS.AUDIT_LOGS, newLog);
  } catch (e) {
    console.error('Error recording admin audit log', e);
  }
}

// User Activity Logs (sign-up & sign-in events for Admin Panel)
export function getStoredUserActivityLogs(): UserActivityLog[] {
  try {
    const data = localStorage.getItem(KEYS.USER_ACTIVITY_LOGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function logUserActivity(entry: Omit<UserActivityLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
  try {
    const logs = getStoredUserActivityLogs();
    const now = new Date().toISOString();
    const newLog: UserActivityLog = {
      id: entry.id || 'act_' + Math.random().toString(36).substring(2, 9),
      timestamp: entry.timestamp || now,
      lastLogin: now,
      ...entry
    };
    // Deduplicate by userId (update existing record's lastLogin instead of appending duplicates)
    const existingIdx = logs.findIndex(l => l.userId === newLog.userId);
    let updated: UserActivityLog[];
    if (existingIdx >= 0 && newLog.actionType === 'login') {
      updated = logs.map((l, i) => i === existingIdx ? { ...l, lastLogin: now, timestamp: now } : l);
    } else {
      updated = [newLog, ...logs].slice(0, 500); // keep last 500 records
    }
    localStorage.setItem(KEYS.USER_ACTIVITY_LOGS, JSON.stringify(updated));
    // Optionally sync to Firestore
    syncDocToFirestore('user_activity_logs', newLog).catch(() => {});
  } catch (e) {
    console.error('Error logging user activity', e);
  }
}

// Admin System Settings
export function getStoredSystemSettings(): AdminSystemSettings {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : initialAdminSystemSettings;
  } catch {
    return initialAdminSystemSettings;
  }
}

export function saveStoredSystemSettings(settings: AdminSystemSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    syncDocToFirestore(COLLECTIONS.SETTINGS, { id: 'primary', ...settings });
  } catch (e) {
    console.error('Error saving system settings', e);
  }
}

// Dynamic Unified Records Aggregator (System-Wide for Admin)
export function generateUnifiedRecords(
  animals: Animal[] = [],
  expenses: FarmExpense[] = [],
  appointments: Appointment[] = [],
  dairyProducts: DairyProduct[] = [],
  customerOrders: CustomerOrderLead[] = [],
  outbreaks: OutbreakReport[] = []
): UnifiedRecord[] {
  const list: UnifiedRecord[] = [];

  // 1. Livestock Animals
  animals.forEach(a => {
    list.push({
      id: `REC-LIV-${a.id}`,
      userId: a.ownerId || 'usr_001',
      userName: a.sellerName || 'Chaudhry Ahmed Ali',
      module: 'livestock',
      recordType: a.isListedForSale ? 'Mandi Listed Animal' : 'Registered Livestock Profile',
      title: `${a.name} (${a.tagId} - ${a.breed})`,
      details: {
        tagId: a.tagId,
        species: a.species,
        breed: a.breed,
        weightKg: a.weightKg,
        healthStatus: a.healthStatus,
        marketValue: a.currentMarketValue || a.purchasePrice,
        milkYield: a.milkYieldLitersPerDay,
        vaccineCount: a.vaccinationHistory?.length || 0
      },
      createdDate: a.createdAt || '2026-01-10',
      updatedDate: a.updatedAt || '2026-08-20',
      status: a.healthStatus === 'critical' || a.healthStatus === 'sick' ? 'pending' : 'active',
      assignedAdmin: 'Chaudhry Ahmed Ali',
      amountPKR: a.currentMarketValue || a.purchasePrice,
      attachments: a.photos || []
    });

    // Add disease scans from animal journal
    a.scanJournal?.forEach(s => {
      list.push({
        id: `REC-SCN-${s.id}`,
        userId: a.ownerId || 'usr_001',
        userName: a.sellerName || 'Chaudhry Ahmed Ali',
        module: 'scans',
        recordType: 'AI Disease Scan Report',
        title: `Disease Scan: ${s.detectedDisease} (${a.name})`,
        details: {
          animalName: a.name,
          confidence: s.confidence,
          severity: s.severity,
          vetRequired: s.vetRequired,
          recommendedMedicines: s.recommendedMedicines
        },
        createdDate: s.date || '2026-08-15',
        updatedDate: s.date || '2026-08-15',
        status: s.severity === 'critical' || s.severity === 'severe' ? 'pending' : 'resolved',
        assignedAdmin: 'Dr. Tariq Mahmood',
        attachments: s.imageUrl ? [s.imageUrl] : []
      });
    });
  });

  // 2. Dairy Products
  dairyProducts.forEach(p => {
    list.push({
      id: `REC-DRY-${p.id}`,
      userId: 'usr_001',
      userName: p.sellerName || 'Chaudhry Ahmed Ali',
      userPhone: p.sellerPhone,
      module: 'dairy',
      recordType: 'Dairy Store Product Listing',
      title: `${p.name} (PKR ${p.pricePKR}/${p.unit})`,
      details: {
        category: p.category,
        pricePKR: p.pricePKR,
        unit: p.unit,
        dailyCapacity: p.dailyCapacity,
        isOrganic: p.isOrganic,
        inStock: p.inStock
      },
      createdDate: '2026-08-01',
      updatedDate: p.updatedAt || '2026-08-20',
      status: p.inStock ? 'active' : 'pending',
      assignedAdmin: 'Chaudhry Ahmed Ali',
      amountPKR: p.pricePKR,
      attachments: p.imageUrl ? [p.imageUrl] : []
    });
  });

  // 3. Customer Orders
  customerOrders.forEach(o => {
    list.push({
      id: `REC-ORD-${o.id}`,
      userId: 'usr_001',
      userName: o.customerName,
      userPhone: o.customerPhone,
      module: 'orders',
      recordType: 'Customer Marketplace Order',
      title: `Order #${o.id} by ${o.customerName}`,
      details: {
        items: o.items,
        totalAmountPKR: o.totalAmountPKR,
        deliveryAddress: o.deliveryAddress,
        notes: o.notes
      },
      createdDate: o.date || '2026-08-20',
      updatedDate: o.date || '2026-08-20',
      status: o.status === 'delivered' ? 'completed' : o.status === 'cancelled' ? 'rejected' : 'pending',
      assignedAdmin: 'Chaudhry Ahmed Ali',
      amountPKR: o.totalAmountPKR
    });
  });

  // 4. Farm Expenses
  expenses.forEach(e => {
    list.push({
      id: `REC-EXP-${e.id}`,
      userId: e.farmerId || 'usr_001',
      userName: e.recordedBy || 'Chaudhry Ahmed Ali',
      module: 'expenses',
      recordType: `Farm Expense (${e.category})`,
      title: `${e.description} - PKR ${(e.amountPKR || 0).toLocaleString()}`,
      details: {
        category: e.category,
        amountPKR: e.amountPKR || 0,
        animalName: e.animalName,
        date: e.date
      },
      createdDate: e.date || '2026-08-10',
      updatedDate: e.date || '2026-08-10',
      status: 'completed',
      assignedAdmin: 'Chaudhry Ahmed Ali',
      amountPKR: e.amountPKR || 0,
      attachments: e.receiptImage ? [e.receiptImage] : []
    });
  });

  // 5. Appointments / Vet Bookings
  appointments.forEach(apt => {
    list.push({
      id: `REC-APT-${apt.id}`,
      userId: apt.farmerId || 'usr_001',
      userName: 'Chaudhry Ahmed Ali',
      module: 'appointments',
      recordType: 'Veterinary Appointment Booking',
      title: `${apt.vetName} for ${apt.animalName} (${apt.type})`,
      details: {
        vetName: apt.vetName,
        animalName: apt.animalName,
        timeSlot: apt.timeSlot,
        type: apt.type,
        reason: apt.reason,
        notes: apt.notes
      },
      createdDate: apt.date || '2026-08-12',
      updatedDate: apt.date || '2026-08-12',
      status: apt.status === 'completed' ? 'completed' : apt.status === 'cancelled' ? 'rejected' : 'pending',
      assignedAdmin: 'Dr. Tariq Mahmood'
    });
  });

  // 6. Outbreaks
  outbreaks.forEach(ob => {
    list.push({
      id: `REC-OUT-${ob.id}`,
      userId: 'system',
      userName: 'District Health Surveillance',
      module: 'outbreaks',
      recordType: 'Bio-Security Outbreak Alert',
      title: `${ob.diseaseName} Outbreak in ${ob.district}`,
      details: {
        district: ob.district,
        affectedCount: ob.affectedAnimalsCount,
        precautions: ob.precautionsUrdu
      },
      createdDate: ob.detectedDate || ob.reportedAt || '2026-08-18',
      updatedDate: ob.detectedDate || ob.reportedAt || '2026-08-18',
      status: ob.status === 'contained' ? 'resolved' : 'active',
      assignedAdmin: 'Dr. Tariq Mahmood'
    });
  });

  return list;
}

// User-Specific Authorized Records (Security Enforcement)
export function getUserAuthorizedRecords(
  userId: string,
  animals: Animal[] = [],
  expenses: FarmExpense[] = [],
  appointments: Appointment[] = [],
  dairyProducts: DairyProduct[] = [],
  customerOrders: CustomerOrderLead[] = []
): UnifiedRecord[] {
  const all = generateUnifiedRecords(animals, expenses, appointments, dairyProducts, customerOrders, []);
  // Strictly filter by userId or standard primary account
  return all.filter(r => r.userId === userId || (!r.userId && userId === 'usr_001'));
}

// User Applications / Requests
export function getUserApplications(userId: string): UserApplication[] {
  const all = getStoredApplications();
  return all.filter(a => a.userId === userId || a.userId === 'usr_001');
}

export function createUserApplication(newApp: Omit<UserApplication, 'id' | 'submissionDate' | 'status'> & { id?: string }): UserApplication {
  const all = getStoredApplications();
  const created: UserApplication = {
    id: newApp.id || `APP-${Date.now().toString(36).toUpperCase()}`,
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    ...newApp
  };
  const updated = [created, ...all];
  saveStoredApplications(updated);
  return created;
}

export function cancelUserApplication(appId: string, userId: string): boolean {
  const all = getStoredApplications();
  const app = all.find(a => a.id === appId);
  if (app && (app.userId === userId || userId === 'usr_001') && app.status === 'pending') {
    const updated = all.map(a => a.id === appId ? { ...a, status: 'rejected' as const, adminNotes: 'Cancelled by applicant' } : a);
    saveStoredApplications(updated);
    return true;
  }
  return false;
}

// User Complaints
export function getUserComplaints(userId: string): UserComplaint[] {
  const all = getStoredComplaints();
  return all.filter(c => c.userId === userId || c.userId === 'usr_001');
}

export function createUserComplaint(newComp: Omit<UserComplaint, 'id' | 'submissionDate' | 'status'> & { id?: string }): UserComplaint {
  const all = getStoredComplaints();
  const created: UserComplaint = {
    id: newComp.id || `CMP-${Date.now().toString(36).toUpperCase()}`,
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'new',
    ...newComp
  };
  const updated = [created, ...all];
  saveStoredComplaints(updated);
  return created;
}

// User Message Threads
export function getUserSupportThread(userId: string, userName: string = 'Chaudhry Ahmed Ali', userPhone: string = '0300-1234567'): SupportMessageThread {
  const all = getStoredMessageThreads();
  const existing = all.find(t => t.userId === userId || t.userId === 'usr_001');
  if (existing) return existing;

  const defaultThread: SupportMessageThread = {
    id: `thr_${userId}`,
    userId,
    userName,
    userEmail: `${userId}@kisandost.ai`,
    userPhone,
    subject: 'Direct Farmer Support & Inquiries',
    category: 'General Support',
    status: 'open',
    unreadCount: 0,
    lastMessageDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    messages: [
      {
        id: 'msg_init',
        senderId: 'admin_sys',
        senderName: 'Kisan Dost Support Officer',
        senderRole: 'admin',
        message: 'السلام علیکم! کسان دوست ہیلپ ڈیسک میں خوش آمدید۔ آپ فارم مینجمنٹ، ویٹرنری ڈاکٹر یا سبسڈی سے متعلق کوئی بھی سوال پوچھ سکتے ہیں۔',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
    ]
  };

  const updated = [defaultThread, ...all];
  saveStoredMessageThreads(updated);
  return defaultThread;
}

export function sendUserSupportMessage(userId: string, userName: string, messageText: string): SupportMessageThread {
  const all = getStoredMessageThreads();
  let thread = all.find(t => t.userId === userId || t.userId === 'usr_001');
  const newMsg = {
    id: 'msg_' + Date.now().toString(36),
    senderId: userId,
    senderName: userName,
    senderRole: 'user' as const,
    message: messageText,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  if (thread) {
    const updatedMessages = [...thread.messages, newMsg];
    const updatedThread: SupportMessageThread = {
      ...thread,
      messages: updatedMessages,
      lastMessageDate: newMsg.timestamp,
      status: 'in_progress',
      unreadCount: thread.unreadCount + 1
    };
    const updatedAll = all.map(t => t.id === thread!.id ? updatedThread : t);
    saveStoredMessageThreads(updatedAll);
    return updatedThread;
  } else {
    const newThread: SupportMessageThread = {
      id: `thr_${userId}`,
      userId,
      userName,
      userEmail: `${userId}@kisandost.ai`,
      userPhone: '0300-1234567',
      subject: 'Farmer Direct Assistance',
      category: 'General Support',
      status: 'in_progress',
      unreadCount: 1,
      lastMessageDate: newMsg.timestamp,
      messages: [newMsg]
    };
    saveStoredMessageThreads([newThread, ...all]);
    return newThread;
  }
}


export function getFrontageMode(): 'admin' | 'customer' {
  try {
    const mode = localStorage.getItem(KEYS.FRONTAGE_MODE);
    return mode === 'customer' ? 'customer' : 'admin';
  } catch (e) {
    return 'admin';
  }
}

export function setFrontageMode(mode: 'admin' | 'customer'): void {
  try {
    localStorage.setItem(KEYS.FRONTAGE_MODE, mode);
  } catch (e) {
    console.error('Error saving frontage mode', e);
  }
}

export function getStoredCustomerOrders(): any[] {
  try {
    const data = localStorage.getItem(KEYS.CUSTOMER_ORDERS);
    return data ? JSON.parse(data) : [
      {
        id: 'ord_101',
        customerName: 'Muhammad Irfan (Lahore)',
        customerPhone: '0321-7654321',
        deliveryAddress: 'House 42, Block B, Model Town, Lahore',
        items: [
          { name: 'خالص گائے کا دودھ (Fresh Cow Milk)', quantity: 5, unit: 'liter', pricePKR: 220 },
          { name: 'خالص چاٹی کا دیسی گھی (Pure Traditional Desi Ghee)', quantity: 1, unit: 'kg', pricePKR: 2600 }
        ],
        totalAmountPKR: 3700,
        date: '2026-08-20',
        status: 'new',
        notes: 'صبح 7 بجے تازہ ڈیلیوری درکار ہے۔'
      },
      {
        id: 'ord_102',
        customerName: 'Haji Aslam (Sahiwal)',
        customerPhone: '0301-9876543',
        deliveryAddress: 'Main Bazar, Sahiwal City',
        items: [
          { name: 'تازہ میٹھا دہی (Fresh Thick Yogurt)', quantity: 3, unit: 'kg', pricePKR: 240 }
        ],
        totalAmountPKR: 720,
        date: '2026-08-19',
        status: 'delivered',
        notes: 'پیمنٹ کیش آن ڈیلیوری ادا کر دی گئی ہے۔'
      }
    ];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomerOrders(orders: any[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOMER_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving customer orders', e);
  }
}

export const getCustomerOrders = getStoredCustomerOrders;
export const saveCustomerOrders = saveStoredCustomerOrders;

export function getStoredUser(): User {
  try {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : initialUser;
  } catch (e) {
    return initialUser;
  }
}

export const getUser = getStoredUser;
export const saveUser = saveStoredUser;
export const getAnimals = getStoredAnimals;
export const saveAnimals = saveStoredAnimals;
export const getExpenses = getStoredExpenses;
export const saveExpenses = saveStoredExpenses;
export const getAppointments = getStoredAppointments;
export const saveAppointments = saveStoredAppointments;

export function saveStoredUser(user: User): void {
  try {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    if (user && user.id) {
      syncDocToFirestore(COLLECTIONS.USERS, user);
    }
  } catch (e) {
    console.error('Error saving user', e);
  }
}

export function getStoredAnimals(): Animal[] {
  try {
    const data = localStorage.getItem(KEYS.ANIMALS);
    return data ? JSON.parse(data) : initialAnimals;
  } catch (e) {
    return initialAnimals;
  }
}

export function saveStoredAnimals(animals: Animal[]): void {
  try {
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(animals));
    animals.forEach(animal => {
      syncDocToFirestore(COLLECTIONS.ANIMALS, animal);
    });
  } catch (e) {
    console.error('Error saving animals', e);
  }
}

export function getStoredExpenses(): FarmExpense[] {
  try {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : initialExpenses;
  } catch (e) {
    return initialExpenses;
  }
}

export function saveStoredExpenses(expenses: FarmExpense[]): void {
  try {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
    expenses.forEach(expense => {
      syncDocToFirestore(COLLECTIONS.EXPENSES, expense);
    });
  } catch (e) {
    console.error('Error saving expenses', e);
  }
}

export function getStoredAppointments(): Appointment[] {
  try {
    const data = localStorage.getItem(KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : initialAppointments;
  } catch (e) {
    return initialAppointments;
  }
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
    appointments.forEach(apt => {
      syncDocToFirestore(COLLECTIONS.APPOINTMENTS, apt);
    });
  } catch (e) {
    console.error('Error saving appointments', e);
  }
}

export function getStoredDairyProducts(): DairyProduct[] {
  try {
    const data = localStorage.getItem(KEYS.DAIRY_PRODUCTS);
    return data ? JSON.parse(data) : initialDairyProducts;
  } catch (e) {
    return initialDairyProducts;
  }
}

export function saveStoredDairyProducts(products: DairyProduct[]): void {
  try {
    localStorage.setItem(KEYS.DAIRY_PRODUCTS, JSON.stringify(products));
    products.forEach(p => {
      syncDocToFirestore(COLLECTIONS.DAIRY_PRODUCTS, p);
    });
  } catch (e) {
    console.error('Error saving dairy products', e);
  }
}

export const getDairyProducts = getStoredDairyProducts;
export const saveDairyProducts = saveStoredDairyProducts;

export function getExecutionMode(): AIExecutionMode {
  try {
    const mode = localStorage.getItem(KEYS.MODE);
    return mode === 'offline' ? 'offline' : 'online';
  } catch (e) {
    return 'online';
  }
}

export function setExecutionMode(mode: AIExecutionMode): void {
  try {
    localStorage.setItem(KEYS.MODE, mode);
  } catch (e) {
    console.error('Error setting execution mode', e);
  }
}

export function getOfflineQueue(): any[] {
  try {
    const data = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addToOfflineQueue(item: { type: string; payload: any; timestamp: string }): void {
  try {
    const queue = getOfflineQueue();
    queue.push(item);
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Error queueing offline item', e);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
  } catch (e) {
    console.error('Error clearing offline queue', e);
  }
}

export function resetDemoData(): void {
  try {
    localStorage.setItem(KEYS.USER, JSON.stringify(initialUser));
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(initialAnimals));
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(initialExpenses));
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
    localStorage.setItem(KEYS.MODE, 'online');
    clearOfflineQueue();
  } catch (e) {
    console.error('Error resetting demo data', e);
  }
}

export function resetSystemToFactoryDefaults(): void {
  try {
    localStorage.clear();
    resetDemoData();
  } catch (e) {
    console.error('Error in factory reset', e);
  }
}

export function getStoredUnifiedRecords(): UnifiedRecord[] {
  return generateUnifiedRecords(
    getStoredAnimals(),
    getStoredExpenses(),
    getStoredAppointments(),
    getStoredDairyProducts(),
    getStoredCustomerOrders(),
    initialOutbreaks
  );
}

export const getStoredSupportThreads = getStoredMessageThreads;
export const saveStoredSupportThreads = saveStoredMessageThreads;
export const getStoredAILogs = getStoredAIActivityLogs;

export function getStoredBiosecurityAssessments(): BiosecurityAssessment[] {
  try {
    const data = localStorage.getItem(KEYS.BIOSECURITY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading biosecurity assessments', e);
    return [];
  }
}

export function saveStoredBiosecurityAssessment(assessment: BiosecurityAssessment): void {
  try {
    const current = getStoredBiosecurityAssessments();
    const updated = [assessment, ...current.filter(a => a.id !== assessment.id)];
    localStorage.setItem(KEYS.BIOSECURITY, JSON.stringify(updated));
    // Optional sync to firestore if online
    syncDocToFirestore('biosecurity_assessments', assessment);
  } catch (e) {
    console.error('Error saving biosecurity assessment', e);
  }
}


