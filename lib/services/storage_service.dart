// lib/services/storage_service.dart
// Lightweight local persistence backed by shared_preferences.
// Mirrors the React localStorage write-through pattern.

import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class StorageKeys {
  static const String user = 'kisan_user';
  static const String animals = 'kisan_animals';
  static const String expenses = 'kisan_expenses';
  static const String appointments = 'kisan_appointments';
  static const String dairyProducts = 'kisan_dairy_products';
  static const String customerOrders = 'kisan_customer_orders';
  static const String outbreaks = 'kisan_outbreaks';
  static const String unifiedRecords = 'kisan_unified_records';

  static const String language = 'kisan_language';
  static const String darkMode = 'kisan_dark_mode';
  static const String onboardingComplete = 'kisan_onboarding_complete';

  static const String authToken = 'kd_auth_token';
  static const String syncQueue = 'kd_sync_queue';
  static const String clientId = 'kd_client_id';
}

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static SharedPreferences get _instance {
    if (_prefs == null) {
      throw StateError(
          'StorageService not initialized. Call StorageService.init() first.');
    }
    return _prefs!;
  }

  // ── Generic primitives ──

  static Future<bool> setString(String key, String value) async {
    await init();
    return _instance.setString(key, value);
  }

  static String? getString(String key) {
    return _instance.getString(key);
  }

  static Future<bool> setBool(String key, bool value) async {
    await init();
    return _instance.setBool(key, value);
  }

  static bool? getBool(String key) {
    return _instance.getBool(key);
  }

  static Future<bool> remove(String key) async {
    await init();
    return _instance.remove(key);
  }

  // ── JSON collections ──

  static Future<bool> setJson(String key, Map<String, dynamic> value) async {
    return setString(key, jsonEncode(value));
  }

  static Map<String, dynamic>? getJson(String key) {
    final raw = getString(key);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<bool> setList(String key, List<dynamic> value) async {
    return setString(key, jsonEncode(value));
  }

  static List<dynamic> getList(String key) {
    final raw = getString(key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) return decoded;
      return [];
    } catch (_) {
      return [];
    }
  }

  // ── Convenience getters/setters for common collections ──

  static Future<bool> setUser(Map<String, dynamic> user) =>
      setJson(StorageKeys.user, user);

  static Map<String, dynamic>? getUser() => getJson(StorageKeys.user);

  static Future<bool> setAnimals(List<dynamic> list) =>
      setList(StorageKeys.animals, list);

  static List<dynamic> getAnimals() => getList(StorageKeys.animals);

  static Future<bool> setExpenses(List<dynamic> list) =>
      setList(StorageKeys.expenses, list);

  static List<dynamic> getExpenses() => getList(StorageKeys.expenses);

  static Future<bool> setAppointments(List<dynamic> list) =>
      setList(StorageKeys.appointments, list);

  static List<dynamic> getAppointments() => getList(StorageKeys.appointments);

  static Future<bool> setDairyProducts(List<dynamic> list) =>
      setList(StorageKeys.dairyProducts, list);

  static List<dynamic> getDairyProducts() => getList(StorageKeys.dairyProducts);

  static Future<bool> setOutbreaks(List<dynamic> list) =>
      setList(StorageKeys.outbreaks, list);

  static List<dynamic> getOutbreaks() => getList(StorageKeys.outbreaks);
}
