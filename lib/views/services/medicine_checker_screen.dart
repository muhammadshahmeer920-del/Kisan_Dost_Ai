// lib/views/services/medicine_checker_screen.dart
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../services/services.dart';
import '../../theme/app_colors.dart';

class MedicineCheckerScreen extends StatefulWidget {
  const MedicineCheckerScreen({super.key});

  @override
  State<MedicineCheckerScreen> createState() => _MedicineCheckerScreenState();
}

class _MedicineCheckerScreenState extends State<MedicineCheckerScreen> {
  final TextEditingController _controller = TextEditingController();
  final ApiService _api = ApiService();
  bool _loading = false;
  Map<String, dynamic>? _result;
  String? _imagePath;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Medicine Checker / دوائی معلومات',
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              hintText: 'Enter medicine name / دوائی کا نام لکھیں',
              prefixIcon: Icon(Icons.medication),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.camera_alt),
            label: const Text('Scan Medicine Label / لیبل سکین کریں'),
          ),
          if (_imagePath != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Image selected: $_imagePath'),
            ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loading ? null : _check,
            child: _loading
                ? const SizedBox(
                    width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Check / چیک کریں'),
          ),
          if (_result != null) _ResultCard(result: _result!),
        ],
      ),
    );
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera);
    if (picked != null) setState(() => _imagePath = picked.path);
  }

  Future<void> _check() async {
    final name = _controller.text.trim();
    if (name.isEmpty && _imagePath == null) return;
    setState(() => _loading = true);
    try {
      String? imageBase64;
      if (_imagePath != null) {
        imageBase64 = await ApiService.fileToBase64DataUri(_imagePath!);
      }
      final res = await _api.medicineScan(
        medicineName: name.isEmpty ? null : name,
        imageBase64: imageBase64,
      );
      if (!mounted) return;
      setState(() => _result = res);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Check failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _ResultCard extends StatelessWidget {
  final Map<String, dynamic> result;
  const _ResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final data = result['data'] ?? result;
    return Card(
      margin: const EdgeInsets.only(top: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Result / نتیجہ',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (data['medicineName'] != null)
              Text('Name: ${data['medicineName']}'),
            if (data['usage'] != null) Text('Usage: ${data['usage']}'),
            if (data['dosage'] != null) Text('Dosage: ${data['dosage']}'),
            if (data['warnings'] != null)
              Text('Warnings: ${data['warnings']}',
                  style: const TextStyle(color: AppColors.error)),
            if (data['answer'] != null) Text(data['answer'].toString()),
          ],
        ),
      ),
    );
  }
}
