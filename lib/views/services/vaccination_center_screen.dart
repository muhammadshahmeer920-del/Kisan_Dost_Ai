// lib/views/services/vaccination_center_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class VaccinationCenterScreen extends StatelessWidget {
  const VaccinationCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final upcoming = data.vaccinations
        .where((v) => v.status != VaccinationStatus.completed)
        .toList();
    final completed = data.vaccinations
        .where((v) => v.status == VaccinationStatus.completed)
        .toList();

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Upcoming / آئندہ'),
              Tab(text: 'History / تاریخ'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _VaccineList(vaccinations: upcoming, showActions: true),
                _VaccineList(vaccinations: completed, showActions: false),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VaccineList extends StatelessWidget {
  final List<VaccinationRecord> vaccinations;
  final bool showActions;

  const _VaccineList({required this.vaccinations, required this.showActions});

  @override
  Widget build(BuildContext context) {
    if (vaccinations.isEmpty) {
      return const Center(child: Text('No records available / کوئی ریکارڈ نہیں'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: vaccinations.length,
      itemBuilder: (context, index) {
        final v = vaccinations[index];
        final animals = context.read<DataProvider>().animals;
        final animal = animals.where((a) => a.id == v.animalId).firstOrNull;
        return Card(
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: AppColors.primary,
              child: Icon(Icons.vaccines, color: Colors.white),
            ),
            title: Text(v.vaccineName),
            subtitle: Text(
                '${animal?.name ?? v.animalId} - Next due: ${v.nextDueDate ?? v.scheduledDate ?? 'N/A'}'),
            trailing: showActions
                ? ElevatedButton(
                    onPressed: () => _markDone(context, v),
                    child: const Text('Done'),
                  )
                : Chip(label: Text(v.status.name)),
          ),
        );
      },
    );
  }

  void _markDone(BuildContext context, VaccinationRecord record) {
    final data = context.read<DataProvider>();
    final updated = VaccinationRecord(
      id: record.id,
      animalId: record.animalId,
      vaccineName: record.vaccineName,
      diseaseTarget: record.diseaseTarget,
      dateGiven: DateTime.now().toIso8601String().split('T').first,
      nextDueDate: record.nextDueDate,
      administeredBy: 'Self',
      status: VaccinationStatus.completed,
      notes: record.notes,
    );
    data.addVaccination(updated);
  }
}
