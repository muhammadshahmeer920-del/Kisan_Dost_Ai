import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/auth_service.dart';
import '../../services/socket_service.dart';
import '../../theme/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _nameController = TextEditingController(text: 'Chaudhry Ahmed Ali');
  final _phoneController = TextEditingController(text: '03001234567');
  final _farmController =
      TextEditingController(text: 'Al-Madina Dairy & Cattle Farm');
  final _locationController = TextEditingController(text: 'Lahore');
  final _districtController = TextEditingController(text: 'Lahore');
  Language _language = Language.ur;
  bool _submitting = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Icon(Icons.eco, size: 80, color: Colors.green[700]),
              const SizedBox(height: 24),
              Text(
                'کسان دوست AI',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Smart livestock & dairy management for Pakistani farmers',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Farmer Name'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '03XXXXXXXXX',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _farmController,
                decoration: const InputDecoration(labelText: 'Farm Name'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _locationController,
                decoration: const InputDecoration(labelText: 'Location'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _districtController,
                decoration: const InputDecoration(labelText: 'District'),
              ),
              const SizedBox(height: 16),
              SegmentedButton<Language>(
                segments: const [
                  ButtonSegment(value: Language.ur, label: Text('اردو')),
                  ButtonSegment(value: Language.en, label: Text('English')),
                ],
                selected: {_language},
                onSelectionChanged: (set) {
                  setState(() => _language = set.first);
                },
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: TextStyle(color: Colors.red[700], fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _submitting ? null : _complete,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Start Farming'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _submitting ? null : _continueOffline,
                child: const Text('Continue Offline'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _complete() async {
    final phone = _phoneController.text.replaceAll(RegExp(r'[^\d]'), '');
    if (phone.length < 10 || phone.length > 12) {
      setState(() => _error = 'Please enter a valid phone number (10-12 digits)');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    final app = context.read<AppProvider>();
    app.setLanguage(_language);

    try {
      User user;
      try {
        user = await AuthService.instance.register(
          name: _nameController.text,
          phone: phone,
          farmName: _farmController.text,
          location: _locationController.text,
          district: _districtController.text,
          language: _language.name,
        );
      } on AuthException catch (e) {
        if (e.code == 'user_exists') {
          user = await AuthService.instance.login(
            phone: phone,
            language: _language.name,
          );
        } else {
          rethrow;
        }
      }

      if (!mounted) return;
      final serverUser = user.copyWith(
        name: _nameController.text,
        farmName: _farmController.text,
        location: _locationController.text,
        district: _districtController.text,
        language: _language,
        hasCompletedOnboarding: true,
      );
      await app.completeOnboarding(serverUser);
      SocketService.instance.connect();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not connect to server. Try again or continue offline.';
        _submitting = false;
      });
    }
  }

  void _continueOffline() {
    final app = context.read<AppProvider>();
    app.setLanguage(_language);
    final user = User(
      id: 'offline_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameController.text,
      phone: _phoneController.text.replaceAll(RegExp(r'[^\d]'), ''),
      email: '',
      farmName: _farmController.text,
      location: _locationController.text,
      district: _districtController.text,
      language: _language,
      isPremium: false,
      createdAt: DateTime.now().toIso8601String(),
      hasCompletedOnboarding: true,
    );
    app.completeOnboarding(user);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _farmController.dispose();
    _locationController.dispose();
    _districtController.dispose();
    super.dispose();
  }
}
