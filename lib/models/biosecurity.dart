// lib/models/biosecurity.dart
import 'enums.dart';

class BiosecurityCategoryScores {
  final double entryControl;
  final double quarantine;
  final double sanitation;
  final double vaccination;
  final double wasteManagement;

  BiosecurityCategoryScores({
    required this.entryControl,
    required this.quarantine,
    required this.sanitation,
    required this.vaccination,
    required this.wasteManagement,
  });

  factory BiosecurityCategoryScores.fromJson(Map<String, dynamic> json) =>
      BiosecurityCategoryScores(
        entryControl: (json['entryControl'] ?? 0).toDouble(),
        quarantine: (json['quarantine'] ?? 0).toDouble(),
        sanitation: (json['sanitation'] ?? 0).toDouble(),
        vaccination: (json['vaccination'] ?? 0).toDouble(),
        wasteManagement: (json['wasteManagement'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'entryControl': entryControl,
        'quarantine': quarantine,
        'sanitation': sanitation,
        'vaccination': vaccination,
        'wasteManagement': wasteManagement,
      };
}

class BiosecurityThreat {
  final String disease;
  final String severity; // critical | high | moderate
  final double affectedRadiusKm;
  final String precautionUrdu;
  final String precautionEnglish;

  BiosecurityThreat({
    required this.disease,
    required this.severity,
    required this.affectedRadiusKm,
    required this.precautionUrdu,
    required this.precautionEnglish,
  });

  factory BiosecurityThreat.fromJson(Map<String, dynamic> json) =>
      BiosecurityThreat(
        disease: json['disease'] ?? '',
        severity: json['severity'] ?? 'moderate',
        affectedRadiusKm: (json['affectedRadiusKm'] ?? 0).toDouble(),
        precautionUrdu: json['precautionUrdu'] ?? '',
        precautionEnglish: json['precautionEnglish'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'disease': disease,
        'severity': severity,
        'affectedRadiusKm': affectedRadiusKm,
        'precautionUrdu': precautionUrdu,
        'precautionEnglish': precautionEnglish,
      };
}

class BiosecurityActionStep {
  final ActionPriority priority;
  final String title;
  final String titleUrdu;
  final String detail;
  final String detailUrdu;
  final String? estimatedCostPKR;
  final String timeFrame;

  BiosecurityActionStep({
    required this.priority,
    required this.title,
    required this.titleUrdu,
    required this.detail,
    required this.detailUrdu,
    this.estimatedCostPKR,
    required this.timeFrame,
  });

  factory BiosecurityActionStep.fromJson(Map<String, dynamic> json) =>
      BiosecurityActionStep(
        priority: _parsePriority(json['priority']),
        title: json['title'] ?? '',
        titleUrdu: json['titleUrdu'] ?? '',
        detail: json['detail'] ?? '',
        detailUrdu: json['detailUrdu'] ?? '',
        estimatedCostPKR: json['estimatedCostPKR']?.toString(),
        timeFrame: json['timeFrame'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'priority': priority.name,
        'title': title,
        'titleUrdu': titleUrdu,
        'detail': detail,
        'detailUrdu': detailUrdu,
        'estimatedCostPKR': estimatedCostPKR,
        'timeFrame': timeFrame,
      };

  static ActionPriority _parsePriority(dynamic v) {
    try {
      return ActionPriority.values.byName((v ?? 'medium').toString());
    } catch (_) {
      return ActionPriority.medium;
    }
  }
}

class BiosecurityUpgradeDay {
  final int day;
  final String dayTitle;
  final String taskUrdu;
  final String taskEnglish;

  BiosecurityUpgradeDay({
    required this.day,
    required this.dayTitle,
    required this.taskUrdu,
    required this.taskEnglish,
  });

  factory BiosecurityUpgradeDay.fromJson(Map<String, dynamic> json) =>
      BiosecurityUpgradeDay(
        day: json['day'] ?? 0,
        dayTitle: json['dayTitle'] ?? '',
        taskUrdu: json['taskUrdu'] ?? '',
        taskEnglish: json['taskEnglish'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'day': day,
        'dayTitle': dayTitle,
        'taskUrdu': taskUrdu,
        'taskEnglish': taskEnglish,
      };
}

class BiosecurityDisinfectant {
  final String name;
  final String nameUrdu;
  final String dilution;
  final String usage;
  final String costEstimate;

  BiosecurityDisinfectant({
    required this.name,
    required this.nameUrdu,
    required this.dilution,
    required this.usage,
    required this.costEstimate,
  });

  factory BiosecurityDisinfectant.fromJson(Map<String, dynamic> json) =>
      BiosecurityDisinfectant(
        name: json['name'] ?? '',
        nameUrdu: json['nameUrdu'] ?? '',
        dilution: json['dilution'] ?? '',
        usage: json['usage'] ?? '',
        costEstimate: json['costEstimate'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'nameUrdu': nameUrdu,
        'dilution': dilution,
        'usage': usage,
        'costEstimate': costEstimate,
      };
}

class BiosecurityAssessment {
  final String id;
  final String? userId;
  final String farmName;
  final String farmerName;
  final String district;
  final String province;
  final int herdSize;
  final String speciesPrimary;
  final double score;
  final BiosecurityGrade grade;
  final BiosecurityStatus status;
  final BiosecurityCategoryScores categoryScores;
  final Map<String, bool> answers;
  final List<BiosecurityThreat> activeLocalThreats;
  final String aiSummary;
  final List<String> criticalVulnerabilities;
  final List<BiosecurityActionStep> actionSteps;
  final List<BiosecurityUpgradeDay> upgradePlan7Days;
  final List<BiosecurityDisinfectant> recommendedDisinfectants;
  final String createdAt;

  BiosecurityAssessment({
    required this.id,
    this.userId,
    required this.farmName,
    required this.farmerName,
    required this.district,
    required this.province,
    required this.herdSize,
    required this.speciesPrimary,
    required this.score,
    required this.grade,
    required this.status,
    required this.categoryScores,
    required this.answers,
    required this.activeLocalThreats,
    required this.aiSummary,
    required this.criticalVulnerabilities,
    required this.actionSteps,
    required this.upgradePlan7Days,
    required this.recommendedDisinfectants,
    required this.createdAt,
  });

  factory BiosecurityAssessment.fromJson(Map<String, dynamic> json) =>
      BiosecurityAssessment(
        id: json['id'] ?? '',
        userId: json['userId'],
        farmName: json['farmName'] ?? '',
        farmerName: json['farmerName'] ?? '',
        district: json['district'] ?? '',
        province: json['province'] ?? '',
        herdSize: json['herdSize'] ?? 0,
        speciesPrimary: json['speciesPrimary'] ?? '',
        score: (json['score'] ?? 0).toDouble(),
        grade: _parseGrade(json['grade']),
        status: _parseStatus(json['status']),
        categoryScores: BiosecurityCategoryScores.fromJson(
            json['categoryScores'] ?? {}),
        answers: (json['answers'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, v == true)),
        activeLocalThreats: _toList(json['activeLocalThreats'],
            (e) => BiosecurityThreat.fromJson(e as Map<String, dynamic>)),
        aiSummary: json['aiSummary'] ?? '',
        criticalVulnerabilities: _toStringList(json['criticalVulnerabilities']),
        actionSteps: _toList(json['actionSteps'],
            (e) => BiosecurityActionStep.fromJson(e as Map<String, dynamic>)),
        upgradePlan7Days: _toList(json['upgradePlan7Days'],
            (e) => BiosecurityUpgradeDay.fromJson(e as Map<String, dynamic>)),
        recommendedDisinfectants: _toList(
            json['recommendedDisinfectants'],
            (e) =>
                BiosecurityDisinfectant.fromJson(e as Map<String, dynamic>)),
        createdAt: json['createdAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'farmName': farmName,
        'farmerName': farmerName,
        'district': district,
        'province': province,
        'herdSize': herdSize,
        'speciesPrimary': speciesPrimary,
        'score': score,
        'grade': grade.name,
        'status': status.name,
        'categoryScores': categoryScores.toJson(),
        'answers': answers,
        'activeLocalThreats': activeLocalThreats.map((e) => e.toJson()).toList(),
        'aiSummary': aiSummary,
        'criticalVulnerabilities': criticalVulnerabilities,
        'actionSteps': actionSteps.map((e) => e.toJson()).toList(),
        'upgradePlan7Days': upgradePlan7Days.map((e) => e.toJson()).toList(),
        'recommendedDisinfectants':
            recommendedDisinfectants.map((e) => e.toJson()).toList(),
        'createdAt': createdAt,
      };

  static BiosecurityGrade _parseGrade(dynamic v) {
    try {
      return BiosecurityGrade.values.byName((v ?? 'C').toString());
    } catch (_) {
      return BiosecurityGrade.C;
    }
  }

  static BiosecurityStatus _parseStatus(dynamic v) {
    try {
      return BiosecurityStatus.values.byName((v ?? 'high_risk').toString());
    } catch (_) {
      return BiosecurityStatus.highRisk;
    }
  }

  static List<String> _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) return value.map(mapper).toList();
    return [];
  }
}
