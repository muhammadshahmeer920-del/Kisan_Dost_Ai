// lib/models/animal.dart
import 'enums.dart';
import 'scan_journal.dart';

class AuditLog {
  final String id;
  final String timestamp;
  final String fieldChanged;
  final String oldValue;
  final String newValue;
  final String updatedBy;

  AuditLog({
    required this.id,
    required this.timestamp,
    required this.fieldChanged,
    required this.oldValue,
    required this.newValue,
    required this.updatedBy,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) => AuditLog(
        id: json['id'] ?? '',
        timestamp: json['timestamp'] ?? '',
        fieldChanged: json['fieldChanged'] ?? '',
        oldValue: json['oldValue']?.toString() ?? '',
        newValue: json['newValue']?.toString() ?? '',
        updatedBy: json['updatedBy'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'timestamp': timestamp,
        'fieldChanged': fieldChanged,
        'oldValue': oldValue,
        'newValue': newValue,
        'updatedBy': updatedBy,
      };
}

class VaccinationRecord {
  final String id;
  final String animalId;
  final String vaccineName;
  final String? diseaseTarget;
  final String? scheduledDate;
  final String? dateGiven;
  final String? nextDueDate;
  final String? administeredBy;
  final VaccinationStatus status;
  final String? notes;

  VaccinationRecord({
    required this.id,
    required this.animalId,
    required this.vaccineName,
    this.diseaseTarget,
    this.scheduledDate,
    this.dateGiven,
    this.nextDueDate,
    this.administeredBy,
    this.status = VaccinationStatus.scheduled,
    this.notes,
  });

  factory VaccinationRecord.fromJson(Map<String, dynamic> json) =>
      VaccinationRecord(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        vaccineName: json['vaccineName'] ?? '',
        diseaseTarget: json['diseaseTarget'],
        scheduledDate: json['scheduledDate'],
        dateGiven: json['dateGiven'],
        nextDueDate: json['nextDueDate'],
        administeredBy: json['administeredBy'],
        status: _parseStatus(json['status']),
        notes: json['notes'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'vaccineName': vaccineName,
        'diseaseTarget': diseaseTarget,
        'scheduledDate': scheduledDate,
        'dateGiven': dateGiven,
        'nextDueDate': nextDueDate,
        'administeredBy': administeredBy,
        'status': status.name,
        'notes': notes,
      };

  static VaccinationStatus _parseStatus(dynamic v) {
    try {
      return VaccinationStatus.values.byName((v ?? 'scheduled').toString());
    } catch (_) {
      return VaccinationStatus.scheduled;
    }
  }
}

class MedicalRecord {
  final String id;
  final String animalId;
  final String date;
  final String diagnosis;
  final String treatment;
  final String medicineGiven;
  final String dosage;
  final String vetName;
  final String? followUpDate;
  final RecoveryStatus recoveryStatus;

  MedicalRecord({
    required this.id,
    required this.animalId,
    required this.date,
    required this.diagnosis,
    required this.treatment,
    required this.medicineGiven,
    required this.dosage,
    required this.vetName,
    this.followUpDate,
    this.recoveryStatus = RecoveryStatus.treating,
  });

  factory MedicalRecord.fromJson(Map<String, dynamic> json) => MedicalRecord(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        date: json['date'] ?? '',
        diagnosis: json['diagnosis'] ?? '',
        treatment: json['treatment'] ?? '',
        medicineGiven: json['medicineGiven'] ?? '',
        dosage: json['dosage'] ?? '',
        vetName: json['vetName'] ?? '',
        followUpDate: json['followUpDate'],
        recoveryStatus: _parseRecovery(json['recoveryStatus']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'date': date,
        'diagnosis': diagnosis,
        'treatment': treatment,
        'medicineGiven': medicineGiven,
        'dosage': dosage,
        'vetName': vetName,
        'followUpDate': followUpDate,
        'recoveryStatus': recoveryStatus.name,
      };

  static RecoveryStatus _parseRecovery(dynamic v) {
    try {
      return RecoveryStatus.values.byName((v ?? 'treating').toString());
    } catch (_) {
      return RecoveryStatus.treating;
    }
  }
}

class OwnershipRecord {
  final String id;
  final String date;
  final String sellerName;
  final String buyerName;
  final String buyerPhone;
  final double salePrice;
  final String certificateNumber;

  OwnershipRecord({
    required this.id,
    required this.date,
    required this.sellerName,
    required this.buyerName,
    required this.buyerPhone,
    required this.salePrice,
    required this.certificateNumber,
  });

  factory OwnershipRecord.fromJson(Map<String, dynamic> json) => OwnershipRecord(
        id: json['id'] ?? '',
        date: json['date'] ?? '',
        sellerName: json['sellerName'] ?? '',
        buyerName: json['buyerName'] ?? '',
        buyerPhone: json['buyerPhone'] ?? '',
        salePrice: (json['salePrice'] ?? 0).toDouble(),
        certificateNumber: json['certificateNumber'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'sellerName': sellerName,
        'buyerName': buyerName,
        'buyerPhone': buyerPhone,
        'salePrice': salePrice,
        'certificateNumber': certificateNumber,
      };
}

class InsuranceDetail {
  final String policyNumber;
  final String provider;
  final double insuredValue;
  final String startDate;
  final String expiryDate;
  final String status;

  InsuranceDetail({
    required this.policyNumber,
    required this.provider,
    required this.insuredValue,
    required this.startDate,
    required this.expiryDate,
    this.status = 'active',
  });

  factory InsuranceDetail.fromJson(Map<String, dynamic> json) => InsuranceDetail(
        policyNumber: json['policyNumber'] ?? '',
        provider: json['provider'] ?? '',
        insuredValue: (json['insuredValue'] ?? 0).toDouble(),
        startDate: json['startDate'] ?? '',
        expiryDate: json['expiryDate'] ?? '',
        status: json['status'] ?? 'active',
      );

  Map<String, dynamic> toJson() => {
        'policyNumber': policyNumber,
        'provider': provider,
        'insuredValue': insuredValue,
        'startDate': startDate,
        'expiryDate': expiryDate,
        'status': status,
      };
}

class Animal {
  final String id;
  final String ownerId;
  final String tagId;
  final String name;
  final Species species;
  final String breed;
  final Gender gender;
  final int ageMonths;
  final double weightKg;
  final String dob;
  final double purchasePrice;
  final double currentMarketValue;
  final double marketValueChangePercent;
  final bool importStatus;
  final String? countryOfOrigin;
  final String? importLicenseNumber;
  final String? bloodline;
  final String? sireInfo;
  final String? damInfo;
  final PregnancyStatus pregnancyStatus;
  final int? pregnancyMonths;
  final double milkYieldLitersPerDay;
  final double healthScore;
  final HealthStatus healthStatus;
  final List<String> photos;
  final List<String> videos;
  final List<VaccinationRecord> vaccinationHistory;
  final List<MedicalRecord> medicalHistory;
  final List<ScanJournalEntry> scanJournal;
  final List<AuditLog> auditLogs;
  final List<OwnershipRecord> ownershipHistory;
  final String? digitalLicenseNumber;
  final InsuranceDetail? insuranceDetails;
  final bool isQuarantined;
  final String? quarantineReason;
  final bool isListedForSale;
  final double? askingPrice;
  final String? sellerName;
  final String? sellerPhone;
  final String? sellerCity;
  final String? saleDescription;
  final double? marketRateBenchmarkPKR;
  final String createdAt;
  final String updatedAt;

  Animal({
    required this.id,
    required this.ownerId,
    required this.tagId,
    required this.name,
    required this.species,
    required this.breed,
    required this.gender,
    required this.ageMonths,
    required this.weightKg,
    required this.dob,
    required this.purchasePrice,
    required this.currentMarketValue,
    required this.marketValueChangePercent,
    this.importStatus = false,
    this.countryOfOrigin,
    this.importLicenseNumber,
    this.bloodline,
    this.sireInfo,
    this.damInfo,
    required this.pregnancyStatus,
    this.pregnancyMonths,
    required this.milkYieldLitersPerDay,
    required this.healthScore,
    required this.healthStatus,
    List<String>? photos,
    List<String>? videos,
    List<VaccinationRecord>? vaccinationHistory,
    List<MedicalRecord>? medicalHistory,
    List<ScanJournalEntry>? scanJournal,
    List<AuditLog>? auditLogs,
    List<OwnershipRecord>? ownershipHistory,
    this.digitalLicenseNumber,
    this.insuranceDetails,
    this.isQuarantined = false,
    this.quarantineReason,
    this.isListedForSale = false,
    this.askingPrice,
    this.sellerName,
    this.sellerPhone,
    this.sellerCity,
    this.saleDescription,
    this.marketRateBenchmarkPKR,
    required this.createdAt,
    required this.updatedAt,
  })  : photos = photos ?? [],
        videos = videos ?? [],
        vaccinationHistory = vaccinationHistory ?? [],
        medicalHistory = medicalHistory ?? [],
        scanJournal = scanJournal ?? [],
        auditLogs = auditLogs ?? [],
        ownershipHistory = ownershipHistory ?? [];

  factory Animal.fromJson(Map<String, dynamic> json) => Animal(
        id: json['id'] ?? '',
        ownerId: json['ownerId'] ?? '',
        tagId: json['tagId'] ?? '',
        name: json['name'] ?? '',
        species: _parseSpecies(json['species']),
        breed: json['breed'] ?? '',
        gender: _parseGender(json['gender']),
        ageMonths: json['ageMonths'] ?? 0,
        weightKg: (json['weightKg'] ?? 0).toDouble(),
        dob: json['dob'] ?? '',
        purchasePrice: (json['purchasePrice'] ?? 0).toDouble(),
        currentMarketValue: (json['currentMarketValue'] ?? 0).toDouble(),
        marketValueChangePercent:
            (json['marketValueChangePercent'] ?? 0).toDouble(),
        importStatus: json['importStatus'] ?? false,
        countryOfOrigin: json['countryOfOrigin'],
        importLicenseNumber: json['importLicenseNumber'],
        bloodline: json['bloodline'],
        sireInfo: json['sireInfo'],
        damInfo: json['damInfo'],
        pregnancyStatus: _parsePregnancyStatus(json['pregnancyStatus']),
        pregnancyMonths: json['pregnancyMonths'],
        milkYieldLitersPerDay: (json['milkYieldLitersPerDay'] ?? 0).toDouble(),
        healthScore: (json['healthScore'] ?? 0).toDouble(),
        healthStatus: _parseHealthStatus(json['healthStatus']),
        photos: _toStringList(json['photos']),
        videos: _toStringList(json['videos']),
        vaccinationHistory: _toList(json['vaccinationHistory'],
            (e) => VaccinationRecord.fromJson(e as Map<String, dynamic>)),
        medicalHistory: _toList(json['medicalHistory'],
            (e) => MedicalRecord.fromJson(e as Map<String, dynamic>)),
        scanJournal: _toList(json['scanJournal'],
            (e) => ScanJournalEntry.fromJson(e as Map<String, dynamic>)),
        auditLogs: _toList(json['auditLogs'],
            (e) => AuditLog.fromJson(e as Map<String, dynamic>)),
        ownershipHistory: _toList(json['ownershipHistory'],
            (e) => OwnershipRecord.fromJson(e as Map<String, dynamic>)),
        digitalLicenseNumber: json['digitalLicenseNumber'],
        insuranceDetails: json['insuranceDetails'] != null
            ? InsuranceDetail.fromJson(json['insuranceDetails'])
            : null,
        isQuarantined: json['isQuarantined'] ?? false,
        quarantineReason: json['quarantineReason'],
        isListedForSale: json['isListedForSale'] ?? false,
        askingPrice: json['askingPrice']?.toDouble(),
        sellerName: json['sellerName'],
        sellerPhone: json['sellerPhone'],
        sellerCity: json['sellerCity'],
        saleDescription: json['saleDescription'],
        marketRateBenchmarkPKR: json['marketRateBenchmarkPKR']?.toDouble(),
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'tagId': tagId,
        'name': name,
        'species': species.name,
        'breed': breed,
        'gender': gender.name,
        'ageMonths': ageMonths,
        'weightKg': weightKg,
        'dob': dob,
        'purchasePrice': purchasePrice,
        'currentMarketValue': currentMarketValue,
        'marketValueChangePercent': marketValueChangePercent,
        'importStatus': importStatus,
        'countryOfOrigin': countryOfOrigin,
        'importLicenseNumber': importLicenseNumber,
        'bloodline': bloodline,
        'sireInfo': sireInfo,
        'damInfo': damInfo,
        'pregnancyStatus': pregnancyStatus.name,
        'pregnancyMonths': pregnancyMonths,
        'milkYieldLitersPerDay': milkYieldLitersPerDay,
        'healthScore': healthScore,
        'healthStatus': healthStatus.name,
        'photos': photos,
        'videos': videos,
        'vaccinationHistory': vaccinationHistory.map((e) => e.toJson()).toList(),
        'medicalHistory': medicalHistory.map((e) => e.toJson()).toList(),
        'scanJournal': scanJournal.map((e) => e.toJson()).toList(),
        'auditLogs': auditLogs.map((e) => e.toJson()).toList(),
        'ownershipHistory': ownershipHistory.map((e) => e.toJson()).toList(),
        'digitalLicenseNumber': digitalLicenseNumber,
        'insuranceDetails': insuranceDetails?.toJson(),
        'isQuarantined': isQuarantined,
        'quarantineReason': quarantineReason,
        'isListedForSale': isListedForSale,
        'askingPrice': askingPrice,
        'sellerName': sellerName,
        'sellerPhone': sellerPhone,
        'sellerCity': sellerCity,
        'saleDescription': saleDescription,
        'marketRateBenchmarkPKR': marketRateBenchmarkPKR,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  Animal copyWith({
    String? id,
    String? ownerId,
    String? tagId,
    String? name,
    Species? species,
    String? breed,
    Gender? gender,
    int? ageMonths,
    double? weightKg,
    String? dob,
    double? purchasePrice,
    double? currentMarketValue,
    double? marketValueChangePercent,
    bool? importStatus,
    String? countryOfOrigin,
    String? importLicenseNumber,
    String? bloodline,
    String? sireInfo,
    String? damInfo,
    PregnancyStatus? pregnancyStatus,
    int? pregnancyMonths,
    double? milkYieldLitersPerDay,
    double? healthScore,
    HealthStatus? healthStatus,
    List<String>? photos,
    List<String>? videos,
    List<VaccinationRecord>? vaccinationHistory,
    List<MedicalRecord>? medicalHistory,
    List<ScanJournalEntry>? scanJournal,
    List<AuditLog>? auditLogs,
    List<OwnershipRecord>? ownershipHistory,
    String? digitalLicenseNumber,
    InsuranceDetail? insuranceDetails,
    bool? isQuarantined,
    String? quarantineReason,
    bool? isListedForSale,
    double? askingPrice,
    String? sellerName,
    String? sellerPhone,
    String? sellerCity,
    String? saleDescription,
    double? marketRateBenchmarkPKR,
    String? createdAt,
    String? updatedAt,
  }) =>
      Animal(
        id: id ?? this.id,
        ownerId: ownerId ?? this.ownerId,
        tagId: tagId ?? this.tagId,
        name: name ?? this.name,
        species: species ?? this.species,
        breed: breed ?? this.breed,
        gender: gender ?? this.gender,
        ageMonths: ageMonths ?? this.ageMonths,
        weightKg: weightKg ?? this.weightKg,
        dob: dob ?? this.dob,
        purchasePrice: purchasePrice ?? this.purchasePrice,
        currentMarketValue: currentMarketValue ?? this.currentMarketValue,
        marketValueChangePercent:
            marketValueChangePercent ?? this.marketValueChangePercent,
        importStatus: importStatus ?? this.importStatus,
        countryOfOrigin: countryOfOrigin ?? this.countryOfOrigin,
        importLicenseNumber: importLicenseNumber ?? this.importLicenseNumber,
        bloodline: bloodline ?? this.bloodline,
        sireInfo: sireInfo ?? this.sireInfo,
        damInfo: damInfo ?? this.damInfo,
        pregnancyStatus: pregnancyStatus ?? this.pregnancyStatus,
        pregnancyMonths: pregnancyMonths ?? this.pregnancyMonths,
        milkYieldLitersPerDay:
            milkYieldLitersPerDay ?? this.milkYieldLitersPerDay,
        healthScore: healthScore ?? this.healthScore,
        healthStatus: healthStatus ?? this.healthStatus,
        photos: photos ?? this.photos,
        videos: videos ?? this.videos,
        vaccinationHistory: vaccinationHistory ?? this.vaccinationHistory,
        medicalHistory: medicalHistory ?? this.medicalHistory,
        scanJournal: scanJournal ?? this.scanJournal,
        auditLogs: auditLogs ?? this.auditLogs,
        ownershipHistory: ownershipHistory ?? this.ownershipHistory,
        digitalLicenseNumber: digitalLicenseNumber ?? this.digitalLicenseNumber,
        insuranceDetails: insuranceDetails ?? this.insuranceDetails,
        isQuarantined: isQuarantined ?? this.isQuarantined,
        quarantineReason: quarantineReason ?? this.quarantineReason,
        isListedForSale: isListedForSale ?? this.isListedForSale,
        askingPrice: askingPrice ?? this.askingPrice,
        sellerName: sellerName ?? this.sellerName,
        sellerPhone: sellerPhone ?? this.sellerPhone,
        sellerCity: sellerCity ?? this.sellerCity,
        saleDescription: saleDescription ?? this.saleDescription,
        marketRateBenchmarkPKR:
            marketRateBenchmarkPKR ?? this.marketRateBenchmarkPKR,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) {
      return value.map(mapper).toList();
    }
    return [];
  }

  static List<String> _toStringList(dynamic value) {
    if (value is List) {
      return value.map((e) => e.toString()).toList();
    }
    return [];
  }

  static Species _parseSpecies(dynamic v) {
    try {
      return Species.values.byName((v ?? 'cow').toString());
    } catch (_) {
      return Species.cow;
    }
  }

  static Gender _parseGender(dynamic v) {
    try {
      return Gender.values.byName((v ?? 'female').toString());
    } catch (_) {
      return Gender.female;
    }
  }

  static PregnancyStatus _parsePregnancyStatus(dynamic v) {
    try {
      return PregnancyStatus.values.byName((v ?? 'none').toString());
    } catch (_) {
      return PregnancyStatus.none;
    }
  }

  static HealthStatus _parseHealthStatus(dynamic v) {
    try {
      return HealthStatus.values.byName((v ?? 'good').toString());
    } catch (_) {
      return HealthStatus.good;
    }
  }
}

