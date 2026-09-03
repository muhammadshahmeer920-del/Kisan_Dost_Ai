// lib/views/services/biosecurity_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/services.dart';
import '../../theme/app_colors.dart';

class BiosecurityScreen extends StatefulWidget {
  const BiosecurityScreen({super.key});

  @override
  State<BiosecurityScreen> createState() => _BiosecurityScreenState();
}

class _BiosecurityScreenState extends State<BiosecurityScreen> {
  final Map<String, bool> _answers = {};
  bool _loading = false;
  BiosecurityAssessment? _result;
  final ApiService _api = ApiService();

  final List<Map<String, dynamic>> _questions = [
    {'key': 'gate_dip', 'text': 'Main gate has foot/dip bath?'},
    {'key': 'quarantine', 'text': 'Sick/new animals are quarantined?'},
    {'key': 'cleaning', 'text': 'Daily dung and waste removal?'},
    {'key': 'vaccination', 'text': 'Vaccination records up to date?'},
    {'key': 'vector_control', 'text': 'Regular tick/fly spray done?'},
  ];

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    if (_result != null) return _ResultView(result: _result!);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Biosecurity Checklist / چیک لسٹ',
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          ..._questions.map((q) {
            final key = q['key'] as String;
            return Card(
              child: CheckboxListTile(
                title: Text(q['text'] as String),
                value: _answers[key] ?? false,
                onChanged: (v) => setState(() => _answers[key] = v ?? false),
              ),
            );
          }),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : () => _assess(app),
            child: _loading
                ? const SizedBox(
                    width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Assess Farm / اسیسمنٹ کریں'),
          ),
        ],
      ),
    );
  }

  Future<void> _assess(AppProvider app) async {
    final user = app.user;
    setState(() => _loading = true);
    final language = app.language.name;
    try {
      final result = await _api.biosecurityAssessment(
        farmName: user?.farmName ?? 'Farm',
        farmerName: user?.name ?? 'Farmer',
        district: user?.district ?? 'Sahiwal',
        province: 'Punjab',
        herdSize: 10,
        speciesPrimary: 'cow',
        answers: _answers,
        language: language,
      );
      if (!mounted) return;
      setState(() => _result = result);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Assessment failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _ResultView extends StatelessWidget {
  final BiosecurityAssessment result;
  const _ResultView({required this.result});

  @override
  Widget build(BuildContext context) {
    final score = result.score.toInt();
    final color = score >= 80
        ? AppColors.success
        : score >= 60
            ? AppColors.warning
            : AppColors.error;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: color.withValues(alpha: 0.1),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text('Grade ${result.grade.name.toUpperCase()}',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(color: color)),
                  Text('Score: $score%',
                      style: Theme.of(context).textTheme.headlineMedium),
                  Text(result.status.name),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('AI Summary', style: Theme.of(context).textTheme.titleLarge),
          Text(result.aiSummary),
          const SizedBox(height: 16),
          Text('Action Steps', style: Theme.of(context).textTheme.titleLarge),
          ...result.actionSteps.map((s) => ListTile(
                leading: Icon(Icons.circle, color: _priorityColor(s.priority)),
                title: Text(s.title),
                subtitle: Text(s.detail),
                trailing: Text(s.timeFrame),
              )),
          const SizedBox(height: 16),
          Text('7-Day Upgrade Plan', style: Theme.of(context).textTheme.titleLarge),
          ...result.upgradePlan7Days.map((d) => ListTile(
                leading: CircleAvatar(child: Text('${d.day}')),
                title: Text(d.dayTitle),
                subtitle: Text(d.taskUrdu),
              )),
        ],
      ),
    );
  }

  Color _priorityColor(ActionPriority p) {
    switch (p) {
      case ActionPriority.urgent:
        return AppColors.error;
      case ActionPriority.high:
        return AppColors.warning;
      case ActionPriority.medium:
        return AppColors.info;
    }
  }
}
