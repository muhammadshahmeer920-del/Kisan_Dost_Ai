// lib/views/user/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final data = context.watch<DataProvider>();
    final animals = data.animals;

    final activeAnimals = animals.where((a) => !a.isListedForSale).toList();
    final totalMarketVal = activeAnimals.fold<double>(
        0, (sum, a) => sum + (a.currentMarketValue));
    final totalMilk = activeAnimals.fold<double>(
        0, (sum, a) => sum + a.milkYieldLitersPerDay);
    final lactating = activeAnimals.where((a) => a.milkYieldLitersPerDay > 0).length;
    final healthy = activeAnimals.where((a) =>
        a.healthStatus != HealthStatus.sick &&
        a.healthStatus != HealthStatus.critical).length;
    final healthRate = activeAnimals.isEmpty
        ? 0.0
        : (healthy / activeAnimals.length) * 100;
    final lactationRate = activeAnimals.isEmpty
        ? 0.0
        : (lactating / activeAnimals.length) * 100;

    final spotlight = activeAnimals.isNotEmpty
        ? activeAnimals.first
        : Animal(
            id: 'demo',
            ownerId: '',
            tagId: 'SAH-901',
            name: 'Sahiwal Queen',
            species: Species.cow,
            breed: 'Sahiwal Pure',
            gender: Gender.female,
            ageMonths: 48,
            weightKg: 485,
            dob: '2022-08-15',
            purchasePrice: 320000,
            currentMarketValue: 385000,
            marketValueChangePercent: 20,
            pregnancyStatus: PregnancyStatus.lactating,
            milkYieldLitersPerDay: 22,
            healthScore: 92,
            healthStatus: HealthStatus.excellent,
            createdAt: '',
            updatedAt: '',
          );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, ${app.user?.name ?? 'Farmer'}',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          Text(
            app.user?.farmName ?? '',
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),
          _SpotlightCard(animal: spotlight),
          const SizedBox(height: 20),
          _MetricBar(healthRate: healthRate, lactationRate: lactationRate),
          const SizedBox(height: 20),
          _MetricsGrid(
            totalMilk: totalMilk,
            totalValue: totalMarketVal,
            healthy: healthy,
            alerts: activeAnimals.length - healthy,
          ),
          const SizedBox(height: 20),
          Text('Quick Actions',
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _ActionChip(
                icon: Icons.scanner,
                label: 'AI Health Scan',
                onTap: () => app.navigateToService('scanner'),
              ),
              _ActionChip(
                icon: Icons.add_circle,
                label: 'Add Cattle',
                onTap: () => app.navigateToService('animals'),
              ),
              _ActionChip(
                icon: Icons.local_hospital,
                label: 'Book Vet',
                onTap: () => app.navigateToService('vets'),
              ),
              _ActionChip(
                icon: Icons.store,
                label: 'Dairy Store',
                onTap: () => app.navigateToService('dairystore'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SpotlightCard extends StatelessWidget {
  final Animal animal;
  const _SpotlightCard({required this.animal});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundImage: animal.photos.isNotEmpty
                  ? NetworkImage(animal.photos.first)
                  : null,
              child: animal.photos.isEmpty ? const Text('🐮') : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Chip(
                    label: Text('Priority / اہم'),
                    backgroundColor: AppColors.sageTint,
                  ),
                  Text(animal.name,
                      style: Theme.of(context).textTheme.headlineMedium),
                  Text('${animal.tagId} • ${animal.breed}'),
                  Text('Yield: ${animal.milkYieldLitersPerDay} L/day'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricBar extends StatelessWidget {
  final double healthRate;
  final double lactationRate;
  const _MetricBar({required this.healthRate, required this.lactationRate});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: LinearProgressIndicator(
        value: (healthRate + lactationRate) / 200,
        minHeight: 12,
        backgroundColor: AppColors.border,
        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  final double totalMilk;
  final double totalValue;
  final int healthy;
  final int alerts;
  const _MetricsGrid({
    required this.totalMilk,
    required this.totalValue,
    required this.healthy,
    required this.alerts,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Healthy', healthy.toString(), Icons.favorite),
      ('In-Milk', totalMilk.toStringAsFixed(1), Icons.water_drop),
      ('Value', 'PKR ${(totalValue / 100000).toStringAsFixed(1)}M', Icons.wallet),
      ('Alerts', alerts.toString(), Icons.warning_amber),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: items
          .map((i) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(i.$3, color: AppColors.primary),
                      const Spacer(),
                      Text(i.$2,
                          style: Theme.of(context).textTheme.headlineMedium),
                      Text(i.$1,
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, color: AppColors.primary),
      label: Text(label),
      onPressed: onTap,
    );
  }
}
