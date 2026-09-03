// lib/models/vet_appointment.dart
import 'enums.dart';

class LatLngField {
  final double lat;
  final double lng;

  LatLngField({required this.lat, required this.lng});

  factory LatLngField.fromJson(Map<String, dynamic> json) => LatLngField(
        lat: (json['lat'] ?? 0).toDouble(),
        lng: (json['lng'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};
}

class VetDoctor {
  final String id;
  final String name;
  final String specialty;
  final String qualifications;
  final int experienceYears;
  final String phone;
  final String clinicAddress;
  final String city;
  final double distanceKm;
  final double rating;
  final double consultationFeePKR;
  final String imageUrl;
  final bool availableForVideo;
  final bool availableForEmergency;
  final bool isVerified;
  final LatLngField? coordinates;

  VetDoctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.qualifications,
    required this.experienceYears,
    required this.phone,
    required this.clinicAddress,
    required this.city,
    required this.distanceKm,
    required this.rating,
    required this.consultationFeePKR,
    required this.imageUrl,
    required this.availableForVideo,
    required this.availableForEmergency,
    this.isVerified = false,
    this.coordinates,
  });

  factory VetDoctor.fromJson(Map<String, dynamic> json) => VetDoctor(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        specialty: json['specialty'] ?? '',
        qualifications: json['qualifications'] ?? '',
        experienceYears: json['experienceYears'] ?? 0,
        phone: json['phone'] ?? '',
        clinicAddress: json['clinicAddress'] ?? '',
        city: json['city'] ?? '',
        distanceKm: (json['distanceKm'] ?? 0).toDouble(),
        rating: (json['rating'] ?? 0).toDouble(),
        consultationFeePKR: (json['consultationFeePKR'] ?? 0).toDouble(),
        imageUrl: json['imageUrl'] ?? '',
        availableForVideo: json['availableForVideo'] ?? false,
        availableForEmergency: json['availableForEmergency'] ?? false,
        isVerified: json['isVerified'] ?? false,
        coordinates: json['coordinates'] != null
            ? LatLngField.fromJson(json['coordinates'] as Map<String, dynamic>)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'specialty': specialty,
        'qualifications': qualifications,
        'experienceYears': experienceYears,
        'phone': phone,
        'clinicAddress': clinicAddress,
        'city': city,
        'distanceKm': distanceKm,
        'rating': rating,
        'consultationFeePKR': consultationFeePKR,
        'imageUrl': imageUrl,
        'availableForVideo': availableForVideo,
        'availableForEmergency': availableForEmergency,
        'isVerified': isVerified,
        'coordinates': coordinates?.toJson(),
      };
}

class Appointment {
  final String id;
  final String farmerId;
  final String vetId;
  final String vetName;
  final String animalId;
  final String animalName;
  final String date;
  final String timeSlot;
  final AppointmentType type;
  final AppointmentStatus status;
  final String reason;
  final String? prescriptionUrl;
  final String? notes;

  Appointment({
    required this.id,
    required this.farmerId,
    required this.vetId,
    required this.vetName,
    required this.animalId,
    required this.animalName,
    required this.date,
    required this.timeSlot,
    required this.type,
    this.status = AppointmentStatus.pending,
    required this.reason,
    this.prescriptionUrl,
    this.notes,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) => Appointment(
        id: json['id'] ?? '',
        farmerId: json['farmerId'] ?? '',
        vetId: json['vetId'] ?? '',
        vetName: json['vetName'] ?? '',
        animalId: json['animalId'] ?? '',
        animalName: json['animalName'] ?? '',
        date: json['date'] ?? '',
        timeSlot: json['timeSlot'] ?? '',
        type: _parseType(json['type']),
        status: _parseStatus(json['status']),
        reason: json['reason'] ?? '',
        prescriptionUrl: json['prescriptionUrl'],
        notes: json['notes'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'farmerId': farmerId,
        'vetId': vetId,
        'vetName': vetName,
        'animalId': animalId,
        'animalName': animalName,
        'date': date,
        'timeSlot': timeSlot,
        'type': type.name,
        'status': status.name,
        'reason': reason,
        'prescriptionUrl': prescriptionUrl,
        'notes': notes,
      };

  Appointment copyWith({
    String? id,
    String? farmerId,
    String? vetId,
    String? vetName,
    String? animalId,
    String? animalName,
    String? date,
    String? timeSlot,
    AppointmentType? type,
    AppointmentStatus? status,
    String? reason,
    String? prescriptionUrl,
    String? notes,
  }) =>
      Appointment(
        id: id ?? this.id,
        farmerId: farmerId ?? this.farmerId,
        vetId: vetId ?? this.vetId,
        vetName: vetName ?? this.vetName,
        animalId: animalId ?? this.animalId,
        animalName: animalName ?? this.animalName,
        date: date ?? this.date,
        timeSlot: timeSlot ?? this.timeSlot,
        type: type ?? this.type,
        status: status ?? this.status,
        reason: reason ?? this.reason,
        prescriptionUrl: prescriptionUrl ?? this.prescriptionUrl,
        notes: notes ?? this.notes,
      );

  static AppointmentType _parseType(dynamic v) {
    final s = (v ?? 'farm_visit').toString();
    if (s == 'clinic_visit') return AppointmentType.clinicVisit;
    if (s == 'farm_visit') return AppointmentType.farmVisit;
    try {
      return AppointmentType.values.byName(s);
    } catch (_) {
      return AppointmentType.farmVisit;
    }
  }

  static AppointmentStatus _parseStatus(dynamic v) {
    try {
      return AppointmentStatus.values.byName((v ?? 'pending').toString());
    } catch (_) {
      return AppointmentStatus.pending;
    }
  }
}
