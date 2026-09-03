// lib/services/api_service.dart
// Functional API service that talks to the existing Express backend (:3000).
// Python ML model is reached through the Express proxy, not directly.

import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../models/models.dart';
import 'auth_service.dart';

class ApiConfig {
  static String baseUrl = _defaultBaseUrl();

  static String _defaultBaseUrl() {
    if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    if (Platform.isIOS) return 'http://127.0.0.1:3000';
    return 'http://localhost:3000';
  }

  static void setBaseUrl(String url) {
    baseUrl = url;
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  late Dio _dio;

  ApiService({String? baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 90),
      sendTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (status) => status != null && status < 600,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = AuthService.instance.token;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        options.headers['X-Client'] = 'flutter';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await AuthService.instance.logout();
        }
        handler.next(error);
      },
    ));
  }

  void setBaseUrl(String url) {
    _dio.options.baseUrl = url;
  }

  // ───────────────────────── Health ─────────────────────────

  Future<Map<String, dynamic>> health() async {
    final res = await _get('/api/health');
    return res.data as Map<String, dynamic>;
  }

  // ───────────────────────── Auth (mock) ─────────────────────────

  Future<Map<String, dynamic>> login({
    String? phone,
    String? email,
    String? otp,
    String language = 'ur',
  }) async {
    final res = await _post('/api/auth/login', body: {
      'phone': phone,
      'email': email,
      'otp': otp,
      'language': language,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register({
    String? name,
    String? phone,
    String? email,
    String? farmName,
    String? location,
    String? district,
    String language = 'ur',
  }) async {
    final res = await _post('/api/auth/register', body: {
      'name': name,
      'phone': phone,
      'email': email,
      'farmName': farmName,
      'location': location,
      'district': district,
      'language': language,
    });
    return res.data as Map<String, dynamic>;
  }

  // ───────────────────────── AI Disease Scan ─────────────────────────

  /// Custom PyTorch ML scan via Express proxy. Returns a ready-to-save journal entry.
  Future<ScanJournalEntry> customModelScan({
    required String imageBase64,
    required String animalName,
    required String species,
    required String animalId,
    String language = 'ur',
  }) async {
    final res = await _post(
      '/api/custom-model/scan',
      body: {
        'imageBase64': imageBase64,
        'language': language,
        'animalName': animalName,
        'species': species,
      },
    );

    final data = _extractData(res);
    if (!(data['success'] == true)) {
      throw ApiException(data['error']?.toString() ?? 'ML scan failed');
    }

    return ScanJournalEntry(
      id: 'scn_ml_${DateTime.now().millisecondsSinceEpoch}',
      animalId: animalId,
      animalName: animalName,
      date: DateTime.now().toLocal().toString(),
      imageUrl: imageBase64,
      detectedDisease: data['detectedDisease'] ?? 'Unknown',
      confidence: (data['confidence'] ?? 0).toDouble(),
      severity: _parseSeverity(data['severity']),
      causes: _toStringList(data['causes']),
      precautions: _toStringList(data['precautions']),
      recommendedMedicines: _toStringList(data['recommendedMedicines']),
      vetRequired: data['vetRequired'] ?? true,
      recoveryDaysEstimate: data['recoveryDaysEstimate'] ?? 7,
      aiNotes: data['aiNotes']?.toString() ?? '',
      descriptionUr: data['description_ur']?.toString(),
      treatmentUr: data['treatment_ur']?.toString(),
      audioBase64: data['audio_base64']?.toString(),
    );
  }

  /// Gemini-only disease scan (fallback path).
  Future<DiseaseScanResult> geminiScan({
    required String animalName,
    required String species,
    String? breed,
    String? imageBase64,
    String? notes,
    String language = 'ur',
  }) async {
    final res = await _post(
      '/api/ai/scan',
      body: {
        'animalName': animalName,
        'species': species,
        'breed': breed,
        'imageBase64': imageBase64,
        'notes': notes,
        'language': language,
      },
    );

    final data = _extractData(res);
    return DiseaseScanResult.fromJson(data);
  }

  // ───────────────────────── AI Assistant / Doctor ─────────────────────────

  Future<Map<String, dynamic>> assistantMessage({
    required String prompt,
    String language = 'ur',
    List<Map<String, dynamic>> history = const [],
    String? imageBase64,
  }) async {
    final res = await _post('/api/ai/assistant', body: {
      'prompt': prompt,
      'language': language,
      'history': history,
      'imageBase64': imageBase64,
    });
    return res.data as Map<String, dynamic>;
  }

  // ───────────────────────── Recovery Plan ─────────────────────────

  Future<RecoveryPlan> generateRecoveryPlan({
    required String animalName,
    required String animalId,
    required String diseaseName,
    int totalDays = 7,
    String language = 'ur',
  }) async {
    final res = await _post('/api/ai/recovery-plan', body: {
      'animalName': animalName,
      'diseaseName': diseaseName,
      'totalDays': totalDays,
      'language': language,
    });

    final Map<String, dynamic> json = res.data as Map<String, dynamic>;
    final planMap = json['plan'] as Map<String, dynamic>? ?? {};

    return RecoveryPlan(
      id: 'rec_${DateTime.now().millisecondsSinceEpoch}',
      animalId: animalId,
      animalName: animalName,
      diseaseName: diseaseName,
      startDate: DateTime.now().toIso8601String().split('T').first,
      totalDays: totalDays,
      currentDay: 1,
      steps: _toList(planMap['steps'] ?? [],
          (e) => RecoveryStep.fromJson(e as Map<String, dynamic>)),
      vetAdvice: planMap['vetAdvice']?.toString() ?? '',
    );
  }

  // ───────────────────────── Nutrition Plan ─────────────────────────

  Future<FeedPlan> generateNutritionPlan({
    required String animalId,
    required String animalName,
    required Species species,
    required double weightKg,
    required PregnancyStatus pregnancyStatus,
    required double milkYieldLitersPerDay,
    String language = 'ur',
  }) async {
    final res = await _post('/api/ai/nutrition', body: {
      'species': species.name,
      'weightKg': weightKg,
      'pregnancyStatus': pregnancyStatus.name,
      'milkYieldLitersPerDay': milkYieldLitersPerDay,
      'language': language,
    });

    final Map<String, dynamic> json = res.data as Map<String, dynamic>;
    final planMap = json['plan'] as Map<String, dynamic>? ?? {};

    return FeedPlan(
      id: 'feed_${DateTime.now().millisecondsSinceEpoch}',
      animalId: animalId,
      animalName: animalName,
      species: species,
      weightKg: weightKg,
      dailyWaterRequirementLiters:
          (planMap['dailyWaterRequirementLiters'] ?? 0).toDouble(),
      items: _toList(planMap['items'] ?? [],
          (e) => FeedRationItem.fromJson(e as Map<String, dynamic>)),
      totalDailyCostPKR: (planMap['totalDailyCostPKR'] ?? 0).toDouble(),
      specialInstructions: planMap['specialInstructions']?.toString() ?? '',
      lastUpdated: DateTime.now().toIso8601String(),
    );
  }

  // ───────────────────────── Medicine Scan ─────────────────────────

  Future<Map<String, dynamic>> medicineScan({
    String? imageBase64,
    String? medicineName,
    String language = 'ur',
  }) async {
    final res = await _post('/api/ai/medicine-scan', body: {
      'imageBase64': imageBase64,
      'medicineName': medicineName,
      'language': language,
    });
    return res.data as Map<String, dynamic>;
  }

  // ───────────────────────── Biosecurity Assessment ─────────────────────────

  Future<BiosecurityAssessment> biosecurityAssessment({
    required String farmName,
    required String farmerName,
    required String district,
    required String province,
    required int herdSize,
    required String speciesPrimary,
    required Map<String, bool> answers,
    List<Map<String, dynamic>> activeLocalThreats = const [],
    String language = 'ur',
  }) async {
    final res = await _post('/api/ai/biosecurity-assessment', body: {
      'farmName': farmName,
      'farmerName': farmerName,
      'district': district,
      'province': province,
      'herdSize': herdSize,
      'speciesPrimary': speciesPrimary,
      'answers': answers,
      'activeLocalThreats': activeLocalThreats,
      'language': language,
    });

    final Map<String, dynamic> json = res.data as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>? ?? {};

    return BiosecurityAssessment.fromJson({
      'id': 'bio_${DateTime.now().millisecondsSinceEpoch}',
      ...data,
      'farmName': farmName,
      'farmerName': farmerName,
      'district': district,
      'province': province,
      'herdSize': herdSize,
      'speciesPrimary': speciesPrimary,
      'answers': answers,
      'createdAt': DateTime.now().toIso8601String(),
    });
  }

  // ───────────────────────── Support Reply ─────────────────────────

  Future<Map<String, dynamic>> supportReply({
    required String prompt,
    String language = 'ur',
    List<Map<String, dynamic>> history = const [],
  }) async {
    final res = await _post('/api/ai/support-reply', body: {
      'prompt': prompt,
      'language': language,
      'history': history,
    });
    return res.data as Map<String, dynamic>;
  }

  // ───────────────────────── Utility helpers ─────────────────────────

  /// Read a file and return a data URI suitable for the Express endpoints.
  static Future<String> fileToBase64DataUri(String path,
      {String mimeType = 'image/jpeg'}) async {
    final bytes = await File(path).readAsBytes();
    final base64 = base64Encode(bytes);
    return 'data:$mimeType;base64,$base64';
  }

  static String bytesToBase64DataUri(Uint8List bytes,
      {String mimeType = 'image/jpeg'}) {
    final base64 = base64Encode(bytes);
    return 'data:$mimeType;base64,$base64';
  }

  // ───────────────────────── User Profile ─────────────────────────

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _get('/api/user/profile');
    final body = _extractData(res);
    return body;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> patch) async {
    final res = await _put('/api/user/profile', body: patch);
    return _extractData(res);
  }

  // ───────────────────────── Dairy Products ─────────────────────────

  Future<Map<String, dynamic>> getDairyProducts({String? since}) async {
    final query = since != null ? '?since=$since' : '';
    final res = await _get('/api/dairy/products$query');
    return _extractData(res);
  }

  Future<Map<String, dynamic>> createDairyProduct(
      Map<String, dynamic> product) async {
    final res = await _post('/api/dairy/products', body: product);
    return _extractData(res);
  }

  Future<Map<String, dynamic>> updateDairyProduct(
      String id, Map<String, dynamic> patch) async {
    final res = await _put('/api/dairy/products/$id', body: patch);
    return _extractData(res);
  }

  Future<void> deleteDairyProduct(String id) async {
    await _delete('/api/dairy/products/$id');
  }

  // ───────────────────────── Dairy Orders ─────────────────────────

  Future<Map<String, dynamic>> getDairyOrders({String? since}) async {
    final query = since != null ? '?since=$since' : '';
    final res = await _get('/api/dairy/orders$query');
    return _extractData(res);
  }

  Future<Map<String, dynamic>> createDairyOrder(
      Map<String, dynamic> order) async {
    final res = await _post('/api/dairy/orders', body: order);
    return _extractData(res);
  }

  Future<Map<String, dynamic>> updateDairyOrder(
      String id, Map<String, dynamic> patch) async {
    final res = await _put('/api/dairy/orders/$id', body: patch);
    return _extractData(res);
  }

  // ───────────────────────── Private HTTP wrappers ─────────────────────────

  Future<Response<dynamic>> _get(String path) async {
    try {
      return await _dio.get(path);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<dynamic>> _post(String path,
      {Map<String, dynamic>? body}) async {
    try {
      return await _dio.post(path, data: body);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<dynamic>> _put(String path,
      {Map<String, dynamic>? body}) async {
    try {
      return await _dio.put(path, data: body);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Response<dynamic>> _delete(String path) async {
    try {
      return await _dio.delete(path);
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Exception _mapDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return ApiException('Connection timed out. Please try again.');
    }
    if (e.response != null) {
      return ApiException(
        e.response?.data?.toString() ?? 'Server error',
        statusCode: e.response?.statusCode,
      );
    }
    return ApiException(e.message ?? 'Network error');
  }

  Map<String, dynamic> _extractData(Response<dynamic> res) {
    final json = res.data as Map<String, dynamic>?;
    if (json == null) return {};
    if (json.containsKey('data')) {
      final d = json['data'];
      if (d is Map<String, dynamic>) return d;
    }
    return json;
  }

  DiseaseSeverity _parseSeverity(dynamic v) {
    try {
      return DiseaseSeverity.values.byName((v ?? 'moderate').toString());
    } catch (_) {
      return DiseaseSeverity.moderate;
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
