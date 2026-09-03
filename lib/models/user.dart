// lib/models/user.dart
import 'enums.dart';

class User {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String farmName;
  final String location;
  final String district;
  final Language language;
  final UserRole role;
  final bool isPremium;
  final bool isVerified;
  final bool hasCompletedOnboarding;
  final String createdAt;
  final String updatedAt;
  final int version;

  User({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.farmName,
    required this.location,
    required this.district,
    this.language = Language.ur,
    this.role = UserRole.user,
    required this.isPremium,
    this.isVerified = false,
    this.hasCompletedOnboarding = false,
    required this.createdAt,
    this.updatedAt = '',
    this.version = 1,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'] ?? '',
        farmName: json['farmName'] ?? json['farm_name'] ?? '',
        location: json['location'] ?? '',
        district: json['district'] ?? '',
        language: _parseLanguage(json['language']),
        role: _parseUserRole(json['role']),
        isPremium: json['isPremium'] ?? json['is_premium'] ?? false,
        isVerified: json['isVerified'] ?? json['is_verified'] ?? false,
        hasCompletedOnboarding: json['hasCompletedOnboarding'] ?? json['has_completed_onboarding'] ?? false,
        createdAt: json['createdAt'] ?? json['created_at'] ?? '',
        updatedAt: json['updatedAt'] ?? json['updated_at'] ?? '',
        version: json['version'] ?? 1,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'farm_name': farmName,
        'location': location,
        'district': district,
        'language': language.name,
        'role': role.name,
        'isPremium': isPremium,
        'isVerified': isVerified,
        'hasCompletedOnboarding': hasCompletedOnboarding,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'version': version,
      };

  User copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? farmName,
    String? location,
    String? district,
    Language? language,
    UserRole? role,
    bool? isPremium,
    bool? isVerified,
    bool? hasCompletedOnboarding,
    String? createdAt,
    String? updatedAt,
    int? version,
  }) =>
      User(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        farmName: farmName ?? this.farmName,
        location: location ?? this.location,
        district: district ?? this.district,
        language: language ?? this.language,
        role: role ?? this.role,
        isPremium: isPremium ?? this.isPremium,
        isVerified: isVerified ?? this.isVerified,
        hasCompletedOnboarding:
            hasCompletedOnboarding ?? this.hasCompletedOnboarding,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        version: version ?? this.version,
      );

  static Language _parseLanguage(dynamic v) {
    try {
      return Language.values.byName((v ?? 'ur').toString());
    } catch (_) {
      return Language.ur;
    }
  }

  static UserRole _parseUserRole(dynamic v) {
    if (v == 'super_admin') return UserRole.superAdmin;
    try {
      return UserRole.values.byName((v ?? 'user').toString());
    } catch (_) {
      return UserRole.user;
    }
  }
}
