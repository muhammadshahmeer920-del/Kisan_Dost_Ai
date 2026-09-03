// lib/views/services/ai_assistant_screen.dart
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/services.dart';
import '../../theme/app_colors.dart';

class _ChatMessage {
  final String id;
  final String text;
  final bool isUser;

  _ChatMessage({
    required this.id,
    required this.text,
    required this.isUser,
  });
}

class AIAssistantScreen extends StatefulWidget {
  final String initialMode;
  const AIAssistantScreen({super.key, this.initialMode = 'chat'});

  @override
  State<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends State<AIAssistantScreen> {
  late String _mode;
  final List<_ChatMessage> _messages = [];
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ApiService _api = ApiService();
  final AudioService _audio = AudioService();
  bool _isBusy = false;
  String? _scanImageBase64;
  ScanJournalEntry? _lastScan;
  String _scanEngine = 'ml'; // 'ml' | 'gemini'

  @override
  void initState() {
    super.initState();
    _mode = widget.initialMode;
    _addWelcome();
  }

  void _addWelcome() {
    _messages.add(_ChatMessage(
      id: 'welcome',
      text:
          'السلام علیکم! میں کسان دوست AI فارم ڈاکٹر ہوں۔ آپ کیسے مدد کر سکتا ہوں؟',
      isUser: false,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    return Column(
      children: [
        _ModeToggle(
          mode: _mode,
          onChanged: (m) => setState(() => _mode = m),
        ),
        Expanded(
          child: _mode == 'scanner' ? _buildScanner(context) : _buildChat(),
        ),
        if (_mode == 'chat') _buildInput(app),
      ],
    );
  }

  Widget _buildChat() {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(12),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final m = _messages[index];
        final isUser = m.isUser;
        return Align(
          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isUser ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: isUser ? null : Border.all(color: AppColors.border),
            ),
            child: Text(
              m.text,
              style: TextStyle(
                color: isUser ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInput(AppProvider app) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: _listenVoice,
          ),
          IconButton(
            icon: const Icon(Icons.image),
            onPressed: _pickImage,
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: const InputDecoration(hintText: 'اپنا سوال لکھیں...'),
              onSubmitted: (_) => _send(app),
            ),
          ),
          IconButton(
            icon: _isBusy
                ? const SizedBox(
                    width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            onPressed: _isBusy ? null : () => _send(app),
          ),
        ],
      ),
    );
  }

  Future<void> _send(AppProvider app) async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    setState(() {
      _messages.add(_ChatMessage(id: 'u${DateTime.now().millisecondsSinceEpoch}', text: text, isUser: true));
      _isBusy = true;
    });
    _scrollToBottom();

    try {
      final res = await _api.assistantMessage(
        prompt: text,
        language: app.language.name,
      );
      final answer = res['answer']?.toString() ??
          'معذرت، براہ کرم دوبارہ کوشش کریں۔';
      setState(() {
        _messages.add(_ChatMessage(
          id: 'a${DateTime.now().millisecondsSinceEpoch}',
          text: answer,
          isUser: false,
        ));
      });
    } catch (e) {
      setState(() {
        _messages.add(_ChatMessage(
          id: 'a${DateTime.now().millisecondsSinceEpoch}',
          text: 'Error: $e',
          isUser: false,
        ));
      });
    } finally {
      setState(() => _isBusy = false);
      _scrollToBottom();
    }
  }

  Widget _buildScanner(BuildContext context) {
    final data = context.watch<DataProvider>();
    final animals = data.animals;
    Animal? selected = animals.isNotEmpty ? animals.first : null;

    return StatefulBuilder(
      builder: (context, setScannerState) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButton<Animal>(
                value: selected,
                isExpanded: true,
                hint: const Text('Select Animal'),
                items: animals
                    .map((a) => DropdownMenuItem(
                          value: a,
                          child: Text('${a.tagId} - ${a.name}'),
                        ))
                    .toList(),
                onChanged: (a) => setScannerState(() => selected = a),
              ),
              const SizedBox(height: 16),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'ml', label: Text('Custom ML')),
                  ButtonSegment(value: 'gemini', label: Text('Gemini AI')),
                ],
                selected: {_scanEngine},
                onSelectionChanged: (set) {
                  setScannerState(() => _scanEngine = set.first);
                },
              ),
              const SizedBox(height: 16),
              if (_scanImageBase64 != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    File(_scanImageBase64!.replaceFirst('file://', '')),
                    height: 200,
                    fit: BoxFit.cover,
                  ),
                )
              else
                Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppColors.sageTint,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(child: Text('Tap to upload image')),
                ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _pickScanImage(setScannerState),
                icon: const Icon(Icons.camera_alt),
                label: const Text('Choose Photo'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: selected == null || _scanImageBase64 == null || _isBusy
                    ? null
                    : () => _runScan(selected!),
                child: _isBusy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Run AI Scan'),
              ),
              if (_lastScan != null) _ScanResultCard(entry: _lastScan!, audio: _audio),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickScanImage(void Function(void Function()) setScannerState) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setScannerState(() => _scanImageBase64 = picked.path);
  }

  Future<void> _runScan(Animal animal) async {
    if (_scanImageBase64 == null) return;
    setState(() => _isBusy = true);
    final data = context.read<DataProvider>();
    final app = context.read<AppProvider>();
    final base64 = await ApiService.fileToBase64DataUri(_scanImageBase64!);
    if (!mounted) return;
    try {
      ScanJournalEntry entry;
      if (_scanEngine == 'ml') {
        entry = await _api.customModelScan(
          imageBase64: base64,
          animalName: animal.name,
          species: animal.species.name,
          animalId: animal.id,
          language: app.language.name,
        );
      } else {
        final result = await _api.geminiScan(
          animalName: animal.name,
          species: animal.species.name,
          breed: animal.breed,
          imageBase64: base64,
          language: app.language.name,
        );
        entry = ScanJournalEntry(
          id: 'scn_g_${DateTime.now().millisecondsSinceEpoch}',
          animalId: animal.id,
          animalName: animal.name,
          date: DateTime.now().toLocal().toString(),
          imageUrl: base64,
          detectedDisease: result.detectedDisease,
          confidence: result.confidence,
          severity: result.severity,
          causes: result.causes,
          precautions: result.precautions,
          recommendedMedicines: result.recommendedMedicines,
          vetRequired: result.vetRequired,
          recoveryDaysEstimate: result.recoveryDaysEstimate,
          aiNotes: result.aiNotes,
        );
      }
      data.saveScanJournal(animal.id, entry);
      setState(() => _lastScan = entry);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Scan failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    await picker.pickImage(source: ImageSource.gallery);
  }

  void _listenVoice() {
    // Placeholder for speech_to_text integration.
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Voice input coming soon')),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _audio.dispose();
    super.dispose();
  }
}

class _ModeToggle extends StatelessWidget {
  final String mode;
  final ValueChanged<String> onChanged;
  const _ModeToggle({required this.mode, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'chat', label: Text('Chat / بات چیت')),
          ButtonSegment(value: 'scanner', label: Text('Scanner / سکینر')),
          ButtonSegment(value: 'history', label: Text('History / تاریخ')),
        ],
        selected: {mode},
        onSelectionChanged: (set) => onChanged(set.first),
      ),
    );
  }
}

class _ScanResultCard extends StatelessWidget {
  final ScanJournalEntry entry;
  final AudioService audio;
  const _ScanResultCard({required this.entry, required this.audio});

  @override
  Widget build(BuildContext context) {
    final text = '${entry.descriptionUr ?? ''}۔ ${entry.treatmentUr ?? entry.aiNotes}';
    return Card(
      margin: const EdgeInsets.only(top: 20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Detected: ${entry.detectedDisease}',
                style: Theme.of(context).textTheme.headlineMedium),
            Text('Confidence: ${entry.confidence.toStringAsFixed(0)}%'),
            Text('Severity: ${entry.severity.name}'),
            const SizedBox(height: 8),
            Text(entry.aiNotes),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => audio.speak(
                text: text,
                audioBase64: entry.audioBase64,
              ),
              icon: const Icon(Icons.volume_up),
              label: const Text('آڈیو سنیں / Listen'),
            ),
          ],
        ),
      ),
    );
  }
}
