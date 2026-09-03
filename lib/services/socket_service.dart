// lib/services/socket_service.dart
// Socket.io client singleton for real-time sync with the Express server.

import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:uuid/uuid.dart';

import 'auth_service.dart';
import 'api_service.dart';
import '../models/pending_event.dart';
import 'storage_service.dart';
import 'sync_queue.dart';

enum SocketStatus { disconnected, connecting, connected }

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  io.Socket? _socket;
  SocketStatus _status = SocketStatus.disconnected;
  String? _clientId;

  final _profileController = StreamController<Map<String, dynamic>>.broadcast();
  final _dairyProductController = StreamController<Map<String, dynamic>>.broadcast();
  final _dairyOrderController = StreamController<Map<String, dynamic>>.broadcast();
  final _syncSnapshotController = StreamController<Map<String, dynamic>>.broadcast();
  final _statusController = StreamController<SocketStatus>.broadcast();

  SocketStatus get status => _status;
  String get clientId => _clientId ??= _initClientId();
  Stream<Map<String, dynamic>> get profileStream => _profileController.stream;
  Stream<Map<String, dynamic>> get dairyProductStream => _dairyProductController.stream;
  Stream<Map<String, dynamic>> get dairyOrderStream => _dairyOrderController.stream;
  Stream<Map<String, dynamic>> get syncSnapshotStream => _syncSnapshotController.stream;
  Stream<SocketStatus> get statusStream => _statusController.stream;

  String _initClientId() {
    final saved = StorageService.getString(StorageKeys.clientId);
    if (saved != null && saved.isNotEmpty) {
      _clientId = saved;
      return saved;
    }
    final id = 'fl_${DateTime.now().millisecondsSinceEpoch}';
    StorageService.setString(StorageKeys.clientId, id);
    _clientId = id;
    return id;
  }

  void connect() {
    final token = AuthService.instance.token;
    if (token == null) return;

    _setStatus(SocketStatus.connecting);

    _socket = io.io(
      ApiConfig.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .setPath('/socket.io')
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .build(),
    );

    _socket!.onConnect((_) {
      _setStatus(SocketStatus.connected);
    });

    _socket!.onConnectError((data) {
      _setStatus(SocketStatus.disconnected);
    });

    _socket!.onDisconnect((_) {
      _setStatus(SocketStatus.disconnected);
    });

    _socket!.on('profile:updated', (data) {
      if (data is Map<String, dynamic>) {
        _profileController.add(data);
      }
    });

    _socket!.on('dairy:product:created', (data) {
      if (data is Map<String, dynamic>) _dairyProductController.add(data);
    });
    _socket!.on('dairy:product:updated', (data) {
      if (data is Map<String, dynamic>) _dairyProductController.add(data);
    });
    _socket!.on('dairy:product:deleted', (data) {
      if (data is Map<String, dynamic>) _dairyProductController.add(data);
    });

    _socket!.on('dairy:order:created', (data) {
      if (data is Map<String, dynamic>) _dairyOrderController.add(data);
    });
    _socket!.on('dairy:order:updated', (data) {
      if (data is Map<String, dynamic>) _dairyOrderController.add(data);
    });

    _socket!.on('sync:snapshot', (data) {
      if (data is Map<String, dynamic>) {
        _syncSnapshotController.add(data);
      }
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _setStatus(SocketStatus.disconnected);
  }

  void emitWithAck(
    String event,
    Map<String, dynamic> payload,
    void Function(Map<String, dynamic>) ack,
  ) {
    if (_socket == null || !_socket!.connected) {
      final pending = PendingEvent(
        id: const Uuid().v4(),
        event: event,
        payload: payload,
        createdAt: DateTime.now().toUtc().toIso8601String(),
      );
      SyncQueue.enqueue(pending);
      ack({'ok': false, 'code': 'queued'});
      return;
    }
    _socket!.emitWithAck(event, {
      ...payload,
      'origin': {'clientId': clientId},
    }, ack: (response) {
      if (response is Map<String, dynamic>) {
        ack(response);
      } else {
        ack({'ok': true, 'data': response});
      }
    });
  }

  void emitProfileUpdate(Map<String, dynamic> payload,
      [void Function(Map<String, dynamic>)? ack]) {
    if (ack != null) {
      emitWithAck('profile:update', payload, ack);
    } else {
      _socket?.emit('profile:update', {
        ...payload,
        'origin': {'clientId': clientId},
      });
    }
  }

  void emitDairyProductUpsert(Map<String, dynamic> payload,
      [void Function(Map<String, dynamic>)? ack]) {
    if (ack != null) {
      emitWithAck('dairy:product:upsert', payload, ack);
    } else {
      _socket?.emit('dairy:product:upsert', {
        ...payload,
        'origin': {'clientId': clientId},
      });
    }
  }

  void emitDairyProductDelete(String productId,
      [void Function(Map<String, dynamic>)? ack]) {
    if (ack != null) {
      emitWithAck('dairy:product:delete', {'id': productId}, ack);
    } else {
      _socket?.emit('dairy:product:delete', {
        'id': productId,
        'origin': {'clientId': clientId},
      });
    }
  }

  void emitOrderCreate(Map<String, dynamic> payload,
      [void Function(Map<String, dynamic>)? ack]) {
    if (ack != null) {
      emitWithAck('dairy:order:create', payload, ack);
    } else {
      _socket?.emit('dairy:order:create', {
        ...payload,
        'origin': {'clientId': clientId},
      });
    }
  }

  void emitOrderStatus(String orderId, String status,
      [void Function(Map<String, dynamic>)? ack]) {
    if (ack != null) {
      emitWithAck('dairy:order:status', {'id': orderId, 'status': status}, ack);
    } else {
      _socket?.emit('dairy:order:status', {
        'id': orderId,
        'status': status,
        'origin': {'clientId': clientId},
      });
    }
  }

  void _setStatus(SocketStatus s) {
    _status = s;
    _statusController.add(s);
  }

  void dispose() {
    disconnect();
    _profileController.close();
    _dairyProductController.close();
    _dairyOrderController.close();
    _syncSnapshotController.close();
    _statusController.close();
  }
}
