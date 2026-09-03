// lib/views/services/nutrition_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/services.dart';
import '../../theme/app_colors.dart';

class NutritionScreen extends StatefulWidget {
  const NutritionScreen({super.key});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  Animal? _selected;
  bool _loading = false;
  FeedPlan? _plan;
  final ApiService _api = ApiService();

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final animals = data.animals;
    if (_selected == null && animals.isNotEmpty) _selected = animals.first;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButton<Animal>(
            value: _selected,
            isExpanded: true,
            hint: const Text('Select Animal'),
            items: animals
                .map((a) => DropdownMenuItem(
                      value: a,
                      child: Text('${a.tagId} - ${a.name}'),
                    ))
                .toList(),
            onChanged: (a) => setState(() {
              _selected = a;
              _plan = null;
            }),
          ),
          const SizedBox(height: 16),
          if (_selected != null) _AnimalSummary(animal: _selected!),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _selected == null || _loading ? null : _generate,
            icon: _loading
                ? const SizedBox(
                    width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.restaurant),
            label: const Text('Generate Feed Plan / خوراک منصوبہ'),
          ),
          if (_plan != null) _PlanCard(plan: _plan!),
        ],
      ),
    );
  }

  Future<void> _generate() async {
    final animal = _selected!;
    final language = context.read<AppProvider>().language.name;
    setState(() => _loading = true);
    try {
      final plan = await _api.generateNutritionPlan(
        animalId: animal.id,
        animalName: animal.name,
        species: animal.species,
        weightKg: animal.weightKg,
        pregnancyStatus: animal.pregnancyStatus,
        milkYieldLitersPerDay: animal.milkYieldLitersPerDay,
        language: language,
      );
      if (!mounted) return;
      setState(() => _plan = plan);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Plan failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _AnimalSummary extends StatelessWidget {
  final Animal animal;
  const _AnimalSummary({required this.animal});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(animal.name, style: Theme.of(context).textTheme.titleLarge),
            Text('Weight: ${animal.weightKg} kg | Milk: ${animal.milkYieldLitersPerDay} L/day'),
            Text('Status: ${animal.pregnancyStatus.name}'),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final FeedPlan plan;
  const _PlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(top: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Daily Feed Plan', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('Water: ${plan.dailyWaterRequirementLiters.toStringAsFixed(1)} L'),
            Text('Est. daily cost: Rs. ${plan.totalDailyCostPKR.toStringAsFixed(0)}'),
            const Divider(height: 24),
            ...plan.items.map((item) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.grass, color: AppColors.primary),
                  title: Text(item.name),
                  subtitle: Text('${item.timeSlot} • ${item.nutritionalValue}'),
                  trailing: Text('${item.amountKg.toStringAsFixed(1)} kg'),
                )),
            if (plan.specialInstructions.isNotEmpty)
              Text('Notes: ${plan.specialInstructions}',
                  style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
