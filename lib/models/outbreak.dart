// lib/models/outbreak.dart
import 'enums.dart';

class OutbreakReport {
  final String id;
  final String district;
  final String? region;
  final String? province;
  final String diseaseName;
  final DiseaseSeverity? severity;
  final int affectedAnimalsCount;
  final Map<String, double>? coordinates;
  final String? detectedDate;
  final String? reportedAt;
  final String precautionsUrdu;
  final String? precautionsEn;
  final String? precautionsEnglish;
  final OutbreakStatus status;

  OutbreakReport({
    required this.id,
    required this.district,
    this.region,
    this.province,
    required this.diseaseName,
    this.severity,
    required this.affectedAnimalsCount,
    this.coordinates,
    this.detectedDate,
    this.reportedAt,
    required this.precautionsUrdu,
    this.precautionsEn,
    this.precautionsEnglish,
    this.status = OutbreakStatus.active,
  });

  factory OutbreakReport.fromJson(Map<String, dynamic> json) => OutbreakReport(
        id: json['id'] ?? '',
        district: json['district'] ?? '',
        region: json['region'],
        province: json['province'],
        diseaseName: json['diseaseName'] ?? '',
        severity: json['severity'] != null
            ? _parseSeverity(json['severity'])
            : null,
        affectedAnimalsCount: json['affectedAnimalsCount'] ?? 0,
        coordinates: json['coordinates'] != null
            ? {
                'lat': (json['coordinates']['lat'] ?? 0).toDouble(),
                'lng': (json['coordinates']['lng'] ?? 0).toDouble(),
              }
            : null,
        detectedDate: json['detectedDate'],
        reportedAt: json['reportedAt'],
        precautionsUrdu: json['precautionsUrdu'] ?? '',
        precautionsEn: json['precautionsEn'],
        precautionsEnglish: json['precautionsEnglish'],
        status: _parseStatus(json['status']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'district': district,
        'region': region,
        'province': province,
        'diseaseName': diseaseName,
        'severity': severity?.name,
        'affectedAnimalsCount': affectedAnimalsCount,
        'coordinates': coordinates,
        'detectedDate': detectedDate,
        'reportedAt': reportedAt,
        'precautionsUrdu': precautionsUrdu,
        'precautionsEn': precautionsEn,
        'precautionsEnglish': precautionsEnglish,
        'status': status.name,
      };

  static DiseaseSeverity _parseSeverity(dynamic v) {
    try {
      return DiseaseSeverity.values.byName((v ?? 'moderate').toString());
    } catch (_) {
      return DiseaseSeverity.moderate;
    }
  }

  static OutbreakStatus _parseStatus(dynamic v) {
    try {
      return OutbreakStatus.values.byName((v ?? 'active').toString());
    } catch (_) {
      return OutbreakStatus.active;
    }
  }
}
