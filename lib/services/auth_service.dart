// lib/services/auth_service.dart
// Singleton auth service — lives outside the widget tree so Dio interceptors
// and SocketService can reach it without a BuildContext.

import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';

import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

enum AuthState { unauthenticated, authenticating, authenticated }

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  String? _token;
  User? _user;
  AuthState _state = AuthState.unauthenticated;

  final _controller = StreamController<AuthState>.broadcast();

  String? get token => _token;
  User? get user => _user;
  AuthState get state => _state;
  bool get isAuthenticated => _state == AuthState.authenticated && _token != null;
  Stream<AuthState> get changes => _controller.stream;

  Dio get _dio {
    final d = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (s) => s != null && s < 600,
    ));
    return d;
  }

  Future<void> restoreFromStorage() async {
    await StorageService.init();
    final saved = StorageService.getString(StorageKeys.authToken);
    if (saved == null || saved.isEmpty) return;

    _token = saved;
    _setState(AuthState.authenticating);

    try {
      final res = await _dio.get(
        '/api/auth/me',
        options: Options(headers: {'Authorization': 'Bearer $_token'}),
      );
      if (res.statusCode == 200 && res.data != null) {
        final body = res.data is String ? jsonDecode(res.data) : res.data;
        final data = body['data'] as Map<String, dynamic>? ?? body as Map<String, dynamic>;
        _user = User.fromJson(data);
        _setState(AuthState.authenticated);
        return;
      }
    } catch (_) {
      // fall through to clear
    }

    await _clearToken();
    _setState(AuthState.unauthenticated);
  }

  Future<User> register({
    required String name,
    required String phone,
    String email = '',
    String farmName = '',
    String location = '',
    String district = '',
    String language = 'ur',
  }) async {
    _setState(AuthState.authenticating);
    try {
      final res = await _dio.post('/api/auth/register', data: {
        'name': name,
        'phone': phone,
        'email': email.isNotEmpty ? email : null,
        'farmName': farmName,
        'location': location,
        'district': district,
        'language': language,
      });

      if (res.statusCode == 409) {
        final body = res.data is String ? jsonDecode(res.data) : res.data;
        throw AuthException(
          body['error']?.toString() ?? 'User already exists',
          code: 'user_exists',
        );
      }

      if (res.statusCode != 200 && res.statusCode != 201) {
        final body = res.data is String ? jsonDecode(res.data) : res.data;
        throw AuthException(body['error']?.toString() ?? 'Registration failed');
      }

      return _handleAuthResponse(res.data);
    } on AuthException {
      _setState(AuthState.unauthenticated);
      rethrow;
    } catch (e) {
      _setState(AuthState.unauthenticated);
      throw AuthException(e.toString());
    }
  }

  Future<User> login({
    String? phone,
    String? email,
    String language = 'ur',
  }) async {
    _setState(AuthState.authenticating);
    try {
      final res = await _dio.post('/api/auth/login', data: {
        'phone': phone,
        'email': email,
        'language': language,
      });

      if (res.statusCode != 200) {
        final body = res.data is String ? jsonDecode(res.data) : res.data;
        throw AuthException(body['error']?.toString() ?? 'Login failed');
      }

      return _handleAuthResponse(res.data);
    } on AuthException {
      _setState(AuthState.unauthenticated);
      rethrow;
    } catch (e) {
      _setState(AuthState.unauthenticated);
      throw AuthException(e.toString());
    }
  }

  Future<void> logout() async {
    await _clearToken();
    _user = null;
    _setState(AuthState.unauthenticated);
  }

  void updateUser(User updated) {
    _user = updated;
    StorageService.setJson(StorageKeys.user, updated.toJson());
  }

  User _handleAuthResponse(dynamic responseData) {
    final body = responseData is String ? jsonDecode(responseData) : responseData;
    final Map<String, dynamic> envelope = body is Map<String, dynamic> ? body : {};

    final tokenStr = envelope['token']?.toString();
    if (tokenStr == null || tokenStr.isEmpty) {
      throw AuthException('Server did not return an auth token');
    }

    _token = tokenStr;
    StorageService.setString(StorageKeys.authToken, tokenStr);

    final data = envelope['data'] as Map<String, dynamic>? ??
        envelope['user'] as Map<String, dynamic>? ??
        envelope;
    _user = User.fromJson(data);
    StorageService.setJson(StorageKeys.user, _user!.toJson());

    _setState(AuthState.authenticated);
    return _user!;
  }

  Future<void> _clearToken() async {
    _token = null;
    await StorageService.remove(StorageKeys.authToken);
  }

  void _setState(AuthState s) {
    _state = s;
    _controller.add(s);
  }

  void dispose() {
    _controller.close();
  }
}

class AuthException implements Exception {
  final String message;
  final String? code;
  AuthException(this.message, {this.code});

  @override
  String toString() => 'AuthException($code): $message';
}
