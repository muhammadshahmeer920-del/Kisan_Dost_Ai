import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final user = app.user;
    final isEnglish = app.language == Language.en;

    final tiles = <_ProfileTileData>[
      _ProfileTileData(
        icon: Icons.agriculture,
        title: isEnglish ? 'Farm name' : 'فارم کا نام',
        value: user?.farmName ?? (isEnglish ? 'Not set yet' : 'ابھی درج نہیں'),
      ),
      _ProfileTileData(
        icon: Icons.location_on_outlined,
        title: isEnglish ? 'Location' : 'مقام',
        value: user?.location ?? (isEnglish ? 'Not set yet' : 'ابھی درج نہیں'),
      ),
      _ProfileTileData(
        icon: Icons.map_outlined,
        title: isEnglish ? 'District' : 'ضلع',
        value: user?.district ?? (isEnglish ? 'Not set yet' : 'ابھی درج نہیں'),
      ),
      _ProfileTileData(
        icon: Icons.phone_outlined,
        title: isEnglish ? 'Phone' : 'فون',
        value: user?.phone ?? (isEnglish ? 'Not set yet' : 'ابھی درج نہیں'),
      ),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  child: Text(
                    (user?.name.isNotEmpty == true
                            ? user!.name.characters.first
                            : 'K')
                        .toUpperCase(),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'Kisan Dost User',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? user?.phone ?? '',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...tiles.map(
          (tile) => Card(
            child: ListTile(
              leading: Icon(tile.icon),
              title: Text(tile.title),
              subtitle: Text(tile.value),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProfileTileData {
  final IconData icon;
  final String title;
  final String value;

  const _ProfileTileData({
    required this.icon,
    required this.title,
    required this.value,
  });
}
