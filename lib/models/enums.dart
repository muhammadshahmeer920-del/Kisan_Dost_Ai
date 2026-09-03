// lib/models/enums.dart
// Ported from src/types.ts

enum Language { ur, en, pb }

enum AIExecutionMode { online, offline }

enum Species { cow, buffalo, goat, sheep, camel, horse }

enum Gender { male, female }

enum PregnancyStatus { none, pregnant, lactating, dry }

enum DiseaseSeverity { mild, moderate, severe, critical }

enum UserRole { user, moderator, admin, superAdmin, customer, vet }

enum UserAccountStatus { active, inactive, suspended }

enum UserNavRoute {
  services,
  support,
  profile,
  settings,
}

enum DairyCategory { milk, yogurt, ghee, butter, cheese, khoya, lassi, other }

enum ProductUnit { liter, kg, pack, g250, g500, halfLiter }

extension ProductUnitExt on ProductUnit {
  String get value {
    switch (this) {
      case ProductUnit.liter:
        return 'liter';
      case ProductUnit.kg:
        return 'kg';
      case ProductUnit.pack:
        return 'pack';
      case ProductUnit.g250:
        return '250g';
      case ProductUnit.g500:
        return '500g';
      case ProductUnit.halfLiter:
        return 'half_liter';
    }
  }

  static ProductUnit fromString(String? v) {
    switch (v) {
      case 'liter':
        return ProductUnit.liter;
      case 'kg':
        return ProductUnit.kg;
      case 'pack':
        return ProductUnit.pack;
      case '250g':
        return ProductUnit.g250;
      case '500g':
        return ProductUnit.g500;
      case 'half_liter':
        return ProductUnit.halfLiter;
      default:
        return ProductUnit.liter;
    }
  }
}

enum VaccinationStatus { completed, scheduled, overdue }

enum HealthStatus { excellent, good, fair, sick, critical }

enum RecoveryStatus { treating, recovering, cured, chronic }

enum AppointmentType { video, clinicVisit, farmVisit }

enum AppointmentStatus { pending, confirmed, completed, cancelled }

enum ExpenseCategory {
  feed,
  medicine,
  vet,
  vetFee,
  vaccine,
  equipment,
  labor,
  other,
}

enum OutbreakStatus { active, contained, monitored }

enum RecordModuleType {
  livestock,
  dairy,
  mandi,
  expenses,
  appointments,
  orders,
  scans,
  outbreaks,
}

enum ApplicationType {
  farmLicense,
  mandiSeller,
  dairyCertification,
  vetVerification,
  livestockImport,
  subsidyGrant,
}

enum ApplicationStatus { pending, underReview, approved, rejected, completed }

enum ComplaintCategory {
  delivery,
  milkQuality,
  pricing,
  technicalBug,
  vetMisconduct,
  mandiFraud,
  general,
}

enum ComplaintStatus {
  new_,
  underReview,
  inProgress,
  resolved,
  rejected,
}

enum ReportType {
  outbreakAlert,
  healthIncident,
  financialAudit,
  productionAnalytics,
  fraudFlag,
  systemError,
}

enum ReportStatus {
  new_,
  investigating,
  reviewed,
  resolved,
  closed,
  underInvestigation,
}

enum NotificationTargetAudience { all, farmers, dairyBuyers, vets, admins }

enum NotificationStatus { draft, active, sent, expired }

enum NotificationPriority { info, warning, alert, announcement }

enum SupportThreadStatus { open, inProgress, resolved, archived }

enum SupportSenderRole { user, admin }

enum AIQueryType {
  diseaseScan,
  doctorAssistant,
  nutritionPlan,
  recoveryPlan,
  digitalTwin,
  medicineScan,
}

enum AIActivityStatus { success, fallback, error }

enum AuditActionStatus { success, failed }

enum BiosecurityGrade { A, B, C }

enum BiosecurityStatus { secure, moderateRisk, highRisk }

enum ActionPriority { urgent, high, medium }

enum CustomerOrderStatus { new_, contacted, delivered, cancelled }
