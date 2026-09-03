// lib/views/services/offline_knowledge_screen.dart
import 'package:flutter/material.dart';

import '../../models/seed_data.dart' as seed;
import '../../theme/app_colors.dart';

class OfflineKnowledgeScreen extends StatefulWidget {
  const OfflineKnowledgeScreen({super.key});

  @override
  State<OfflineKnowledgeScreen> createState() => _OfflineKnowledgeScreenState();
}

class _OfflineKnowledgeScreenState extends State<OfflineKnowledgeScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final items = seed.offlineKnowledgeBase
        .where((i) =>
            i.diseaseNameUrdu.toLowerCase().contains(_query.toLowerCase()) ||
            i.diseaseNameEn.toLowerCase().contains(_query.toLowerCase()))
        .toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Search offline topics / تلاش کریں',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return Card(
                child: ExpansionTile(
                  leading: const Icon(Icons.menu_book, color: AppColors.primary),
                  title: Text(item.diseaseNameUrdu),
                  subtitle: Text(item.diseaseNameEn),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Symptoms:', style: Theme.of(context).textTheme.titleMedium),
                          ...item.symptoms.map((s) => Text('• $s')),
                          const SizedBox(height: 8),
                          Text('First Aid:', style: Theme.of(context).textTheme.titleMedium),
                          ...item.firstAidSteps.map((s) => Text('• $s')),
                          const SizedBox(height: 8),
                          Text('Medicines:', style: Theme.of(context).textTheme.titleMedium),
                          ...item.commonMedicines.map((s) => Text('• $s')),
                          const SizedBox(height: 8),
                          Text('Prevention: ${item.preventionGuidance}'),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
