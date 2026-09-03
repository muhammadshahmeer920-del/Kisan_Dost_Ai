// lib/providers/app_provider.dart
// Mirrors App.tsx global UI state.

import 'dart:async';

import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/services.dart';

class AppProvider extends ChangeNotifier {
  User? _user;
  Language _language = Language.ur;
  bool _darkMode = false;
  UserNavRoute _userRoute = UserNavRoute.services;
  String _initialUserService = 'hub';
  AIExecutionMode _executionMode = AIExecutionMode.online;
  bool _onboardingComplete = false;
  bool _isLoading = true;

  StreamSubscription<Map<String, dynamic>>? _profileSub;

  AppProvider() {
    _load();
  }

  User? get user => _user;
  Language get language => _language;
  bool get darkMode => _darkMode;
  UserNavRoute get userRoute => _userRoute;
  String get initialUserService => _initialUserService;
  AIExecutionMode get executionMode => _executionMode;
  bool get onboardingComplete => _onboardingComplete;
  bool get isLoading => _isLoading;

  bool get isUrdu => _language == Language.ur || _language == Language.pb;

  Future<void> _load() async {
    await StorageService.init();

    if (AuthService.instance.isAuthenticated) {
      _user = AuthService.instance.user;
      _onboardingComplete = _user?.hasCompletedOnboarding ?? false;
    } else {
      final userJson = StorageService.getJson(StorageKeys.user);
      if (userJson != null) {
        _user = User.fromJson(userJson);
        _onboardingComplete = _user?.hasCompletedOnboarding ?? false;
      }
    }

    final lang = StorageService.getString(StorageKeys.language) ?? 'ur';
    _language = _parseLanguage(lang);

    _darkMode = StorageService.getBool(StorageKeys.darkMode) ?? false;

    _listenToProfileStream();

    _isLoading = false;
    notifyListeners();
  }

  void _listenToProfileStream() {
    _profileSub?.cancel();
    _profileSub = SocketService.instance.profileStream.listen((event) {
      if (_user == null) return;
      final origin = event['origin'] as Map<String, dynamic>?;
      if (origin?['clientId'] == SocketService.instance.clientId) return;

      final data = event['data'] as Map<String, dynamic>?;
      if (data == null) return;

      final incoming = User.fromJson(data);
      final serverTs = event['updatedAt']?.toString() ?? incoming.updatedAt;
      if (serverTs.isNotEmpty && serverTs.compareTo(_user!.updatedAt) > 0) {
        _user = incoming;
        AuthService.instance.updateUser(incoming);
        notifyListeners();
      }
    });
  }

  void setUser(User? value) {
    _user = value;
    if (value != null) {
      StorageService.setJson(StorageKeys.user, value.toJson());
    } else {
      StorageService.remove(StorageKeys.user);
    }
    notifyListeners();
  }

  void setLanguage(Language value) {
    _language = value;
    StorageService.setString(StorageKeys.language, value.name);
    notifyListeners();
  }

  void setDarkMode(bool value) {
    _darkMode = value;
    StorageService.setBool(StorageKeys.darkMode, value);
    notifyListeners();
  }

  void toggleDarkMode() => setDarkMode(!_darkMode);

  void setUserRoute(UserNavRoute value) {
    _userRoute = value;
    _initialUserService = 'hub';
    notifyListeners();
  }

  void navigateToService(String serviceId) {
    _initialUserService = serviceId;
    _userRoute = UserNavRoute.services;
    notifyListeners();
  }

  void setExecutionMode(AIExecutionMode value) {
    _executionMode = value;
    notifyListeners();
  }

  void toggleExecutionMode() {
    _executionMode = _executionMode == AIExecutionMode.online
        ? AIExecutionMode.offline
        : AIExecutionMode.online;
    notifyListeners();
  }

  void setOnboardingComplete(bool value) {
    _onboardingComplete = value;
    StorageService.setBool(StorageKeys.onboardingComplete, value);
    notifyListeners();
  }

  Future<void> completeOnboarding(User user) async {
    setUser(user.copyWith(hasCompletedOnboarding: true));
    setOnboardingComplete(true);
  }

  Future<void> updateProfile(Map<String, dynamic> patch) async {
    if (_user == null) return;

    final optimistic = _user!.copyWith(
      name: patch['name'] ?? _user!.name,
      farmName: patch['farm_name'] ?? patch['farmName'] ?? _user!.farmName,
      location: patch['location'] ?? _user!.location,
      district: patch['district'] ?? _user!.district,
      updatedAt: DateTime.now().toUtc().toIso8601String(),
    );
    setUser(optimistic);

    SocketService.instance.emitProfileUpdate(
      optimistic.toJson(),
      (ack) {
        if (ack['ok'] == true) {
          final data = ack['data'] as Map<String, dynamic>?;
          if (data != null) {
            final serverUser = User.fromJson(data);
            setUser(serverUser);
            AuthService.instance.updateUser(serverUser);
          }
        } else if (ack['code'] == 'conflict') {
          final serverData = ack['data'] as Map<String, dynamic>?;
          if (serverData != null) {
            final serverUser = User.fromJson(serverData);
            setUser(serverUser);
            AuthService.instance.updateUser(serverUser);
          }
        }
      },
    );
  }

  Future<void> logout() async {
    _profileSub?.cancel();
    SocketService.instance.disconnect();
    await AuthService.instance.logout();
    _user = null;
    _onboardingComplete = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _profileSub?.cancel();
    super.dispose();
  }

  static Language _parseLanguage(String v) {
    try {
      return Language.values.byName(v);
    } catch (_) {
      return Language.ur;
    }
  }
}
