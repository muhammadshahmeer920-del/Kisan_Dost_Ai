// lib/views/services/outbreak_radar_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/enums.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class OutbreakRadarScreen extends StatelessWidget {
  const OutbreakRadarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final outbreaks = context.watch<DataProvider>().outbreaks;

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.all(16),
          color: AppColors.error.withValues(alpha: 0.1),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.radar, color: AppColors.error, size: 40),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Active Outbreaks / فعال وبائیں',
                          style: Theme.of(context).textTheme.titleLarge),
                      Text('${outbreaks.length} reported in your region',
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: outbreaks.length,
            itemBuilder: (context, index) {
              final o = outbreaks[index];
              return Card(
                child: ExpansionTile(
                  leading: Icon(Icons.warning,
                      color: _severityColor(o.severity)),
                  title: Text(o.diseaseName),
                  subtitle: Text('${o.district} • ${o.region ?? ''}'),
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Affected animals: ${o.affectedAnimalsCount}'),
                          Text('Detected: ${o.detectedDate ?? 'N/A'}'),
                          const SizedBox(height: 8),
                          Text('Precautions / احتیاطی تدابیر:',
                              style: Theme.of(context).textTheme.titleMedium),
                          Text(o.precautionsUrdu),
                          if (o.precautionsEnglish != null)
                            Text(o.precautionsEnglish!),
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

  Color _severityColor(DiseaseSeverity? s) {
    switch (s) {
      case DiseaseSeverity.critical:
        return AppColors.error;
      case DiseaseSeverity.severe:
      case DiseaseSeverity.moderate:
        return AppColors.warning;
      case DiseaseSeverity.mild:
        return AppColors.info;
      case null:
        return AppColors.textMuted;
    }
  }
}
