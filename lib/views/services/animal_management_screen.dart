// lib/views/services/animal_management_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';

class AnimalManagementScreen extends StatelessWidget {
  const AnimalManagementScreen({super.key});

  String _emoji(Species s) {
    switch (s) {
      case Species.cow:
        return '🐄';
      case Species.buffalo:
        return '🐃';
      case Species.goat:
        return '🐐';
      case Species.sheep:
        return '🐑';
      case Species.camel:
        return '🐪';
      case Species.horse:
        return '🐴';
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final animals = data.animals.where((a) => !a.isListedForSale).toList();

    return Scaffold(
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: animals.length,
        itemBuilder: (context, index) {
          final a = animals[index];
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundImage:
                    a.photos.isNotEmpty ? NetworkImage(a.photos.first) : null,
                child: a.photos.isEmpty ? Text(_emoji(a.species)) : null,
              ),
              title: Text('${_emoji(a.species)} ${a.name}'),
              subtitle: Text(
                  '${a.tagId} • ${a.breed} • ${a.milkYieldLitersPerDay} L/day'),
              trailing: Chip(
                label: Text(a.healthStatus.name),
                backgroundColor: _healthColor(a.healthStatus),
              ),
              onTap: () => _showAnimalDetails(context, a),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }

  Color _healthColor(HealthStatus status) {
    switch (status) {
      case HealthStatus.excellent:
      case HealthStatus.good:
        return Colors.green.shade100;
      case HealthStatus.fair:
        return Colors.amber.shade100;
      case HealthStatus.sick:
      case HealthStatus.critical:
        return Colors.red.shade100;
    }
  }

  void _showAnimalDetails(BuildContext context, Animal animal) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(animal.name,
                style: Theme.of(context).textTheme.headlineMedium),
            Text('Tag: ${animal.tagId}'),
            Text('Weight: ${animal.weightKg} kg'),
            Text('Health Score: ${animal.healthScore}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}
