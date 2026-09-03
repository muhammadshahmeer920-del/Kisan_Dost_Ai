// lib/providers/sync_provider.dart
// Tracks online/offline status and pending sync queue size.

import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../services/sync_queue.dart';
import '../services/api_service.dart';

enum SyncStatus { disconnected, connecting, connected, syncing }

class SyncProvider extends ChangeNotifier {
  SyncStatus _status = SyncStatus.disconnected;
  int _pendingCount = 0;
  DateTime? _lastSyncedAt;
  StreamSubscription<SocketStatus>? _socketSub;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  SyncStatus get status => _status;
  int get pendingCount => _pendingCount;
  DateTime? get lastSyncedAt => _lastSyncedAt;
  bool get isOnline => _status == SyncStatus.connected || _status == SyncStatus.syncing;

  SyncProvider() {
    _init();
  }

  void _init() {
    _pendingCount = SyncQueue.pending.length;

    _socketSub = SocketService.instance.statusStream.listen((s) {
      switch (s) {
        case SocketStatus.disconnected:
          _status = SyncStatus.disconnected;
          break;
        case SocketStatus.connecting:
          _status = SyncStatus.connecting;
          break;
        case SocketStatus.connected:
          _status = SyncStatus.connected;
          _flushQueue();
          break;
      }
      notifyListeners();
    });

    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final hasConnection = results.any((r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet);

      if (hasConnection && AuthService.instance.isAuthenticated) {
        if (_status == SyncStatus.disconnected) {
          SocketService.instance.connect();
        }
      }
    });

    if (AuthService.instance.isAuthenticated &&
        SocketService.instance.status == SocketStatus.connected) {
      _status = SyncStatus.connected;
    }
  }

  Future<void> _flushQueue() async {
    final queue = SyncQueue.pending;
    if (queue.isEmpty) return;

    _status = SyncStatus.syncing;
    notifyListeners();

    for (final event in queue) {
      if (event.retryCount > 5) continue;

      try {
        final completer = Completer<Map<String, dynamic>>();

        SocketService.instance.emitWithAck(event.event, event.payload, (ack) {
          completer.complete(ack);
        });

        final ack = await completer.future.timeout(
          const Duration(seconds: 5),
          onTimeout: () => {'ok': false, 'code': 'timeout'},
        );

        if (ack['ok'] == true) {
          await SyncQueue.remove(event.id);
          _pendingCount--;
        } else if (ack['code'] == 'conflict') {
          await SyncQueue.remove(event.id);
          _pendingCount--;
        } else if (ack['code'] == 'invalid') {
          await SyncQueue.remove(event.id);
          _pendingCount--;
        } else {
          event.retryCount++;
          event.lastError = ack['code']?.toString();
        }
      } catch (_) {
        event.retryCount++;
        event.lastError = 'exception';
      }
    }

    await _pullFromServer();

    _status = SyncStatus.connected;
    _lastSyncedAt = DateTime.now();
    _pendingCount = SyncQueue.pending.length;
    notifyListeners();
  }

  Future<void> _pullFromServer() async {
    if (!AuthService.instance.isAuthenticated) return;
    try {
      final api = ApiService();
      await api.getProfile();
    } catch (_) {
      // will catch up on next cycle
    }
  }

  Future<void> forceSync() async {
    if (!AuthService.instance.isAuthenticated) return;

    if (SocketService.instance.status != SocketStatus.connected) {
      SocketService.instance.connect();
      return;
    }

    await _flushQueue();
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    _connectivitySub?.cancel();
    super.dispose();
  }
}
