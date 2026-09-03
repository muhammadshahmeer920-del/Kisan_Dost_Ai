// lib/views/services/digital_farm_id_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class DigitalFarmIdScreen extends StatelessWidget {
  const DigitalFarmIdScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().user;
    final farmId = user?.id ?? 'FARM-UNKNOWN';
    final farmName = user?.farmName ?? 'Kisan Dost Farm';
    final farmerName = user?.name ?? 'Farmer';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.primary,
                    child: Icon(Icons.agriculture,
                        size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Text(farmName,
                      style: Theme.of(context).textTheme.headlineMedium),
                  Text(farmerName,
                      style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 20),
                  QrImageView(
                    data: farmId,
                    version: QrVersions.auto,
                    size: 200,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: AppColors.primary,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Farm ID: $farmId',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.location_on, color: AppColors.primary),
            title: const Text('Location'),
            subtitle: Text(user?.location ?? 'Not set'),
          ),
          ListTile(
            leading: const Icon(Icons.phone, color: AppColors.primary),
            title: const Text('Phone'),
            subtitle: Text(user?.phone ?? 'Not set'),
          ),
          ListTile(
            leading: const Icon(Icons.verified, color: AppColors.success),
            title: const Text('Verification Status'),
            subtitle: Text(user?.isVerified == true ? 'Verified' : 'Pending'),
          ),
        ],
      ),
    );
  }
}
