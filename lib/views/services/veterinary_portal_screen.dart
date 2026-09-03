// lib/views/services/veterinary_portal_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart' as seed;
import '../../models/models.dart';
import '../../providers/providers.dart';

class VeterinaryPortalScreen extends StatelessWidget {
  const VeterinaryPortalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final vets = data.animals.isNotEmpty ? seed.initialVets : seed.initialVets;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vets.length,
      itemBuilder: (context, index) {
        final v = vets[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: NetworkImage(v.imageUrl),
            ),
            title: Text(v.name),
            subtitle: Text('${v.specialty}\n${v.distanceKm} km • PKR ${v.consultationFeePKR.toStringAsFixed(0)}'),
            isThreeLine: true,
            trailing: ElevatedButton(
              onPressed: () => _book(context, v),
              child: const Text('Book'),
            ),
          ),
        );
      },
    );
  }

  void _book(BuildContext context, VetDoctor vet) {
    final data = context.read<DataProvider>();
    final animal = data.animals.firstOrNull;
    if (animal == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add an animal first')),
      );
      return;
    }
    final apt = Appointment(
      id: 'apt_${DateTime.now().millisecondsSinceEpoch}',
      farmerId: 'usr_001',
      vetId: vet.id,
      vetName: vet.name,
      animalId: animal.id,
      animalName: animal.name,
      date: DateTime.now().add(const Duration(days: 1)).toIso8601String().split('T').first,
      timeSlot: '11:00 AM',
      type: AppointmentType.video,
      reason: 'General consultation',
    );
    data.bookAppointment(apt);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Appointment booked with ${vet.name}')),
    );
  }
}
