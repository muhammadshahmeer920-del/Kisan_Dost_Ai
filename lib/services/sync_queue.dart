// lib/services/sync_queue.dart
// Persists pending sync events to SharedPreferences so they survive app restarts.

import 'dart:convert';

import '../models/pending_event.dart';
import 'storage_service.dart';

class SyncQueue {
  static List<PendingEvent> get pending {
    final raw = StorageService.getString(StorageKeys.syncQueue);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => PendingEvent.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> enqueue(PendingEvent event) async {
    final queue = pending;

    final existingIdx = queue.indexWhere(
        (e) => e.event == event.event && e.payload['id'] == event.payload['id']);

    if (existingIdx >= 0) {
      queue[existingIdx] = event;
    } else {
      queue.add(event);
    }

    await _save(queue);
  }

  static Future<void> remove(String id) async {
    final queue = pending..removeWhere((e) => e.id == id);
    await _save(queue);
  }

  static Future<void> clear() async {
    await StorageService.remove(StorageKeys.syncQueue);
  }

  static Future<void> _save(List<PendingEvent> queue) async {
    final encoded = jsonEncode(queue.map((e) => e.toJson()).toList());
    await StorageService.setString(StorageKeys.syncQueue, encoded);
  }
}
