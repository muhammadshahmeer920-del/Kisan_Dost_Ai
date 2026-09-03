// lib/models/offline_knowledge.dart
class OfflineKnowledgeItem {
  final String diseaseNameUrdu;
  final String diseaseNameEn;
  final List<String> symptoms;
  final List<String> firstAidSteps;
  final List<String> commonMedicines;
  final String preventionGuidance;

  OfflineKnowledgeItem({
    required this.diseaseNameUrdu,
    required this.diseaseNameEn,
    required this.symptoms,
    required this.firstAidSteps,
    required this.commonMedicines,
    required this.preventionGuidance,
  });

  factory OfflineKnowledgeItem.fromJson(Map<String, dynamic> json) =>
      OfflineKnowledgeItem(
        diseaseNameUrdu: json['diseaseNameUrdu'] ?? '',
        diseaseNameEn: json['diseaseNameEn'] ?? '',
        symptoms: _toStringList(json['symptoms']),
        firstAidSteps: _toStringList(json['firstAidSteps']),
        commonMedicines: _toStringList(json['commonMedicines']),
        preventionGuidance: json['preventionGuidance'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'diseaseNameUrdu': diseaseNameUrdu,
        'diseaseNameEn': diseaseNameEn,
        'symptoms': symptoms,
        'firstAidSteps': firstAidSteps,
        'commonMedicines': commonMedicines,
        'preventionGuidance': preventionGuidance,
      };

  static List<String> _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}
