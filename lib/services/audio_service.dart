// lib/services/audio_service.dart
// Native Urdu TTS: prefers Base64 MP3 from backend, falls back to flutter_tts.

import 'dart:convert';

import 'package:flutter_tts/flutter_tts.dart';
import 'package:just_audio/just_audio.dart';

class AudioService {
  final AudioPlayer _player = AudioPlayer();
  final FlutterTts _flutterTts = FlutterTts();

  bool _isPlayingBase64 = false;

  AudioService() {
    _initTts();
  }

  Future<void> _initTts() async {
    await _flutterTts.setLanguage('ur-PK');
    await _flutterTts.setSpeechRate(0.9);
    await _flutterTts.setVolume(1.0);
    await _flutterTts.setPitch(1.0);
  }

  /// Speaks the provided text. If [audioBase64] is available it is played as
  /// an MP3; otherwise [text] is spoken via the device TTS engine.
  Future<void> speak({
    String? text,
    String? audioBase64,
  }) async {
    await stop();

    if (audioBase64 != null && audioBase64.isNotEmpty) {
      try {
        final bytes = base64Decode(audioBase64);
        await _player.setAudioSource(
          CustomAudioSource(bytes),
          preload: true,
        );
        _isPlayingBase64 = true;
        await _player.play();
        return;
      } catch (e) {
        // ignore: avoid_print
        print('[AudioService] Base64 playback failed: $e');
      }
    }

    if (text != null && text.isNotEmpty) {
      await _flutterTts.speak(text);
    }
  }

  Future<void> stop() async {
    if (_isPlayingBase64) {
      await _player.stop();
      _isPlayingBase64 = false;
    }
    await _flutterTts.stop();
  }

  Future<void> dispose() async {
    await _player.dispose();
    await _flutterTts.stop();
  }
}

/// In-memory audio source for base64 MP3 bytes.
// ignore: experimental_member_use
class CustomAudioSource extends StreamAudioSource {
  final List<int> bytes;

  CustomAudioSource(this.bytes);

  @override
  // ignore: experimental_member_use
  Future<StreamAudioResponse> request([int? start, int? end]) async {
    start ??= 0;
    end ??= bytes.length;
    // ignore: experimental_member_use
    return StreamAudioResponse(
      sourceLength: bytes.length,
      contentLength: end - start,
      offset: start,
      stream: Stream.fromIterable([bytes.sublist(start, end)]),
      contentType: 'audio/mpeg',
    );
  }
}
