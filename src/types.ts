/**
 * Kisan Dost AI - Core Types & Interfaces
 */

export type Language = 'ur' | 'en' | 'pb';

export type AIExecutionMode = 'online' | 'offline';

export type Species = 'cow' | 'buffalo' | 'goat' | 'sheep' | 'camel' | 'horse';

export type Gender = 'male' | 'female';

export type PregnancyStatus = 'none' | 'pregnant' | 'lactating' | 'dry';

export type DiseaseSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type AppFrontageMode = 'admin' | 'customer';

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin' | 'customer' | 'vet';

export type UserAccountStatus = 'active' | 'inactive' | 'suspended';

export type AppInterface = 'user' | 'admin';

export type UserNavRoute = 
  | 'dashboard'
  | 'services'
  | 'requests'
  | 'records'
  | 'notifications'
  | 'messages'
  | 'profile'
  | 'settings';

export type AdminNavRoute = 
  | 'dashboard'
  | 'users'
  | 'records'
  | 'applications'
  | 'complaints'
  | 'reports'
  | 'notifications'
  | 'messages'
  | 'analytics'
  | 'ai_activity'
  | 'logs'
  | 'settings';

export type AdminTab = 
  | 'overview'
  | 'users'
  | 'all_records'
  | 'applications'
  | 'complaints'
  | 'reports'
  | 'notifications'
  | 'messages'
  | 'ai_activity'
  | 'analytics'
  | 'activity_logs'
  | 'settings';

export type DairyCategory = 'milk' | 'yogurt' | 'ghee' | 'butter' | 'cheese' | 'khoya' | 'lassi' | 'other';

export interface DairyProduct {
  id: string;
  sellerId: string; // ⭐ NEW: Track product owner for permission-based editing
  farmName?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  name: string;
  nameEn?: string;
  nameUr?: string;
  category: DairyCategory | string;
  categoryEn?: string;
  price?: number;
  pricePKR: number;
  unit: string;
  unitUr?: string;
  dailyCapacity?: string;
  stock?: number;
  isOrganic?: boolean;
  inStock: boolean;
  description: string;
  descriptionEn?: string;
  descriptionUr?: string;
  imageUrl: string;
  rating?: number;
  updatedAt?: string;
}

export interface CustomerCartItem {
  product: DairyProduct;
  quantity: number;
}

export interface CustomerOrderLead {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: {
    productId?: string;
    name: string;
    quantity: number;
    unit: string;
    pricePKR: number;
  }[];
  totalAmountPKR: number;
  date: string;
  status: 'new' | 'contacted' | 'delivered' | 'cancelled';
  notes?: string;
}

// ⭐ NEW: Order Interface for Direct Product Purchases (Dairy Store)
export interface Order {
  id: string; // Order ID (e.g., "KD-1234")
  buyerId: string; // Customer/Buyer user ID
  sellerId: string; // Seller/Farm owner user ID
  productId: string; // The dairy product being ordered
  productName: string;
  productImage?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmountPKR: number;
  
  // Buyer Details
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  
  // Seller Details (denormalized for quick access)
  sellerName?: string;
  sellerFarmName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  
  // Delivery Information
  deliveryAddress: string;
  deliveryCity?: string;
  
  // Payment Information
  paymentMethod: 'cod' | 'mobile_wallet' | 'bank_transfer';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  
  // Order Status
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  
  // Notes
  notes?: string;
  sellerNotes?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  farmName: string;
  location: string;
  district: string;
  language: Language;
  role?: UserRole;
  userAccountType?: 'user' | 'farmer';  // Signup role: General User or Farmer/Livestock Owner
  isPremium: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Activity log for every sign-up and sign-in event (rendered in Admin Panel)
export interface UserActivityLog {
  id: string;
  userId: string;
  name: string;
  email: string;
  userAccountType: 'user' | 'farmer';
  farmName?: string;
  city?: string;
  actionType: 'signup' | 'login';  // Type of auth event
  timestamp: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
}

export interface Vaccination {
  id: string;
  animalId: string;
  vaccineName: string;
  diseaseTarget?: string;
  scheduledDate?: string;
  dateGiven?: string;
  nextDueDate?: string;
  administeredBy?: string;
  batchNumber?: string;
  status: 'completed' | 'scheduled' | 'overdue';
  notes?: string;
}

export type VaccinationRecord = Vaccination;

export interface NutritionIngredient {
  name: string;
  amountKg: number;
  costPKR: number;
  category: string;
}

export interface NutritionRecipe {
  id: string;
  animalId: string;
  animalName: string;
  targetMilkLiters: number;
  totalDailyCostPKR: number;
  greenFodderKg: number;
  dryFodderKg: number;
  concentrateKg: number;
  mineralMixGrams: number;
  waterLitersDay: number;
  ingredients: NutritionIngredient[];
  mixingInstructions: string;
  benefitsUrdu: string;
}

export interface MedicalRecord {
  id: string;
  animalId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  medicineGiven: string;
  dosage: string;
  vetName: string;
  followUpDate?: string;
  recoveryStatus: 'treating' | 'recovering' | 'cured' | 'chronic';
}

export interface DiseaseScanResult {
  detectedDisease: string;
  confidence: number;
  severity: DiseaseSeverity;
  causes: string[];
  precautions: string[];
  recommendedMedicines: string[];
  vetRequired: boolean;
  recoveryDaysEstimate: number;
  aiNotes: string;
}

export interface ScanJournalEntry {
  id: string;
  animalId: string;
  animalName: string;
  date: string;
  imageUrl?: string;
  videoUrl?: string;
  detectedDisease: string;
  confidence: number;
  severity: DiseaseSeverity;
  causes: string[];
  precautions: string[];
  recommendedMedicines: string[];
  vetRequired: boolean;
  recoveryDaysEstimate: number;
  aiNotes: string;
  description_ur?: string;
  treatment_ur?: string;
  audio_base64?: string;
}

export interface OwnershipRecord {
  id: string;
  date: string;
  sellerName: string;
  buyerName: string;
  buyerPhone: string;
  salePrice: number;
  certificateNumber: string;
}

export interface InsuranceDetail {
  policyNumber: string;
  provider: string;
  insuredValue: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
}

export interface Animal {
  id: string;
  ownerId: string;
  tagId: string; // Unique Animal ID e.g. KD-8842
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  weightKg: number;
  dob: string;
  purchasePrice: number;
  currentMarketValue: number;
  marketValueChangePercent: number;
  importStatus: boolean;
  countryOfOrigin?: string;
  importLicenseNumber?: string;
  bloodline?: string;
  sireInfo?: string; // Father name / ID
  damInfo?: string; // Mother name / ID
  pregnancyStatus: PregnancyStatus;
  pregnancyMonths?: number;
  milkYieldLitersPerDay: number;
  healthScore: number; // 0-100
  healthStatus: 'excellent' | 'good' | 'fair' | 'sick' | 'critical';
  photos: string[];
  videos: string[];
  vaccinationHistory: VaccinationRecord[];
  medicalHistory: MedicalRecord[];
  scanJournal: ScanJournalEntry[];
  auditLogs: AuditLog[];
  ownershipHistory: OwnershipRecord[];
  digitalLicenseNumber?: string;
  insuranceDetails?: InsuranceDetail;
  isQuarantined?: boolean;
  quarantineReason?: string;
  isListedForSale?: boolean;
  askingPrice?: number;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  saleDescription?: string;
  marketRateBenchmarkPKR?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryStep {
  day: number;
  title: string;
  description: string;
  medicines: string[];
  feedingInstructions: string;
  completed: boolean;
}

export interface RecoveryPlan {
  id: string;
  animalId: string;
  animalName: string;
  diseaseName: string;
  startDate: string;
  totalDays: number;
  currentDay: number;
  steps: RecoveryStep[];
  vetAdvice: string;
}

export interface FeedRationItem {
  name: string;
  amountKg: number;
  timeSlot: string;
  nutritionalValue: string; // e.g. "Protein 14%, Digestible Fiber"
  estimatedCostPKR: number;
}

export interface FeedPlan {
  id: string;
  animalId: string;
  animalName: string;
  species: Species;
  weightKg: number;
  dailyWaterRequirementLiters: number;
  items: FeedRationItem[];
  totalDailyCostPKR: number;
  specialInstructions: string;
  lastUpdated: string;
}

export interface VetDoctor {
  id: string;
  name: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  phone: string;
  clinicAddress: string;
  city: string;
  distanceKm: number;
  rating: number;
  consultationFeePKR: number;
  imageUrl: string;
  availableForVideo: boolean;
  availableForEmergency: boolean;
  isVerified?: boolean;
}

export interface Appointment {
  id: string;
  farmerId: string;
  vetId: string;
  vetName: string;
  animalId: string;
  animalName: string;
  date: string;
  timeSlot: string;
  type: 'video' | 'clinic_visit' | 'farm_visit';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  prescriptionUrl?: string;
  notes?: string;
}

export interface FarmExpense {
  id: string;
  farmerId?: string;
  date: string;
  category: 'feed' | 'medicine' | 'vet' | 'vet_fee' | 'vaccine' | 'equipment' | 'labor' | 'other';
  amountPKR: number;
  animalId?: string;
  animalName?: string;
  description: string;
  recordedBy?: string;
  receiptImage?: string;
}

export interface OutbreakReport {
  id: string;
  district: string;
  region?: string;
  province?: string;
  diseaseName: string;
  severity?: DiseaseSeverity;
  affectedAnimalsCount: number;
  coordinates?: { lat: number; lng: number };
  detectedDate?: string;
  reportedAt?: string;
  precautionsUrdu: string;
  precautionsEn?: string;
  precautionsEnglish?: string;
  status: 'active' | 'contained' | 'monitored';
}

export interface DigitalTwinRisk {
  animalId: string;
  animalName: string;
  overallRiskScore: number; // 0-100 (higher = riskier)
  fmdProbabilityPercent: number;
  mastitisProbabilityPercent: number;
  heatStressProbabilityPercent: number;
  projectedMarketValue6MonthsPKR: number;
  recommendedActionUrdu: string;
  recommendedActionEn: string;
  recommendedActionPb: string;
}

export interface OfflineKnowledgeItem {
  diseaseNameUrdu: string;
  diseaseNameEn: string;
  symptoms: string[];
  firstAidSteps: string[];
  commonMedicines: string[];
  preventionGuidance: string;
}

// ----------------------------------------------------
// Admin Hub Detailed Data Models
// ----------------------------------------------------

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserAccountStatus;
  registrationDate: string;
  lastLogin: string;
  farmName?: string;
  location?: string;
  district?: string;
  language?: Language;
  isVerified?: boolean;
  notes?: string;
  totalRecordsCount?: number;
  totalAIRequestsCount?: number;
}

export type RecordModuleType = 
  | 'livestock'
  | 'dairy'
  | 'mandi'
  | 'expenses'
  | 'appointments'
  | 'orders'
  | 'scans'
  | 'outbreaks';

export interface UnifiedRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  module: RecordModuleType;
  recordType: string;
  title: string;
  details: Record<string, any>;
  createdDate: string;
  updatedDate: string;
  status: 'active' | 'pending' | 'completed' | 'resolved' | 'rejected' | 'archived';
  assignedAdmin?: string;
  adminNotes?: string;
  attachments?: string[];
  amountPKR?: number;
}

export interface UserApplication {
  id: string;
  userId: string;
  applicantName?: string;
  userName?: string;
  userPhone?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  title?: string;
  description?: string;
  applicationType: 'farm_license' | 'mandi_seller' | 'dairy_certification' | 'vet_verification' | 'livestock_import' | 'subsidy_grant';
  submissionDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';
  assignedAdmin?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  documents?: string[];
  adminNotes?: string;
  decisionDate?: string;
  details?: {
    farmName?: string;
    cnicOrRegistration?: string;
    livestockCount?: number;
    dailyMilkCapacityLiters?: number;
    requestSummary?: string;
    district?: string;
    licenseGrade?: string;
  };
}

export interface UserComplaint {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  category: 'delivery' | 'milk_quality' | 'pricing' | 'technical_bug' | 'vet_misconduct' | 'mandi_fraud' | 'general';
  title: string;
  description: string;
  submissionDate: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
  assignedAdmin?: string;
  adminResponse?: string;
  resolvedDate?: string;
  attachments?: string[];
}

export interface SystemReport {
  id: string;
  userId?: string;
  userName?: string;
  reportType: 'outbreak_alert' | 'health_incident' | 'financial_audit' | 'production_analytics' | 'fraud_flag' | 'system_error';
  title?: string;
  summary?: string;
  date?: string;
  reportedDate?: string;
  diseaseName?: string;
  district?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  status: 'new' | 'investigating' | 'reviewed' | 'resolved' | 'closed' | 'under_investigation';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedAdmin?: string;
  metrics?: Record<string, any>;
  adminNotes?: string;
  affectedCount?: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'farmers' | 'dairy_buyers' | 'vets' | 'admins';
  createdDate: string;
  scheduledDate?: string;
  status: 'draft' | 'active' | 'sent' | 'expired';
  priority: 'info' | 'warning' | 'alert' | 'announcement';
  createdBy?: string;
  recipientCount?: number;
  readCount?: number;
}

export interface SupportMessageThread {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'archived';
  unreadCount: number;
  lastMessageDate: string;
  assignedAdmin?: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'user' | 'admin';
    message: string;
    timestamp: string;
    attachments?: string[];
  }[];
}

export interface AIActivityLog {
  id: string;
  userId: string;
  userName: string;
  dateTime: string;
  queryType: 'disease_scan' | 'doctor_assistant' | 'nutrition_plan' | 'recovery_plan' | 'digital_twin' | 'medicine_scan';
  userQuery: string;
  aiResponsePreview: string;
  fullResponse?: any;
  modelUsed: string;
  status: 'success' | 'fallback' | 'error';
  processingTimeMs: number;
  tokenCount?: number;
  feedbackScore?: number;
}

export interface AdminAuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminRole?: string;
  action: string;
  targetModule?: string;
  targetEntity?: string;
  targetRecordId?: string;
  targetId?: string;
  targetUserId?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: string;
  status?: 'success' | 'failed';
}

export interface AdminSystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations?: boolean;
  allowUserRegistration?: boolean;
  defaultUserRole?: 'user' | 'moderator' | 'admin';
  activeAIModel?: string;
  geminiModel?: string;
  defaultExecutionMode?: 'cloud' | 'offline';
  enableAIImageDiagnosis?: boolean;
  enableLiveOfflineSync?: boolean;
  maxDailyAIRequestsPerUser?: number;
  autoApproveLowRiskApplications?: boolean;
  backupSchedule?: string;
  superAdminEmails?: string[];
}

export interface BiosecurityAssessment {
  id: string;
  userId?: string;
  farmName: string;
  farmerName: string;
  district: string;
  province: string;
  herdSize: number;
  speciesPrimary: string;
  score: number; // 0 to 100
  grade: 'A' | 'B' | 'C';
  status: 'secure' | 'moderate_risk' | 'high_risk';
  categoryScores: {
    entryControl: number; // percentage
    quarantine: number;
    sanitation: number;
    vaccination: number;
    wasteManagement: number;
  };
  answers: Record<string, boolean>;
  activeLocalThreats: {
    disease: string;
    severity: 'critical' | 'high' | 'moderate';
    affectedRadiusKm: number;
    precautionUrdu: string;
    precautionEnglish: string;
  }[];
  aiSummary: string;
  criticalVulnerabilities: string[];
  actionSteps: {
    priority: 'urgent' | 'high' | 'medium';
    title: string;
    titleUrdu: string;
    detail: string;
    detailUrdu: string;
    estimatedCostPKR?: string;
    timeFrame: string;
  }[];
  upgradePlan7Days: {
    day: number;
    dayTitle: string;
    taskUrdu: string;
    taskEnglish: string;
  }[];
  recommendedDisinfectants: {
    name: string;
    nameUrdu: string;
    dilution: string;
    usage: string;
    costEstimate: string;
  }[];
  createdAt: string;
}


