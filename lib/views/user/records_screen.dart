// lib/views/user/records_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/providers.dart';

class RecordsScreen extends StatelessWidget {
  const RecordsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final scans = data.scanJournal;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: scans.length,
      itemBuilder: (context, index) {
        final s = scans[index];
        return Card(
          child: ListTile(
            leading: const Icon(Icons.document_scanner),
            title: Text(s.detectedDisease),
            subtitle: Text('${s.animalName} • ${s.date}'),
            trailing: Chip(label: Text('${s.confidence.toInt()}%')),
          ),
        );
      },
    );
  }
}
