// lib/models/pending_event.dart
// Represents a queued sync event waiting to be flushed to the server.

class PendingEvent {
  final String id;
  final String event;
  final Map<String, dynamic> payload;
  final String createdAt;
  int retryCount;
  String? lastError;

  PendingEvent({
    required this.id,
    required this.event,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
    this.lastError,
  });

  factory PendingEvent.fromJson(Map<String, dynamic> json) => PendingEvent(
        id: json['id'] ?? '',
        event: json['event'] ?? '',
        payload: Map<String, dynamic>.from(json['payload'] ?? {}),
        createdAt: json['createdAt'] ?? '',
        retryCount: json['retryCount'] ?? 0,
        lastError: json['lastError'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'event': event,
        'payload': payload,
        'createdAt': createdAt,
        'retryCount': retryCount,
        'lastError': lastError,
      };
}
