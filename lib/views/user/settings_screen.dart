import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final isEnglish = app.language == Language.en;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: SwitchListTile(
            secondary: const Icon(Icons.dark_mode_outlined),
            title: Text(isEnglish ? 'Dark mode' : 'ڈارک موڈ'),
            subtitle: Text(
              isEnglish ? 'Use the darker app theme.' : 'گہرا تھیم استعمال کریں۔',
            ),
            value: app.darkMode,
            onChanged: app.setDarkMode,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.language),
            title: Text(isEnglish ? 'Language' : 'زبان'),
            subtitle: Text(
              app.language == Language.en ? 'English' : 'اردو',
            ),
            trailing: SegmentedButton<Language>(
              segments: const [
                ButtonSegment(
                  value: Language.en,
                  label: Text('EN'),
                ),
                ButtonSegment(
                  value: Language.ur,
                  label: Text('اردو'),
                ),
              ],
              selected: {app.language == Language.pb ? Language.ur : app.language},
              onSelectionChanged: (selection) {
                app.setLanguage(selection.first);
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: SwitchListTile(
            secondary: const Icon(Icons.hub_outlined),
            title: Text(isEnglish ? 'Offline-first AI mode' : 'آف لائن AI موڈ'),
            subtitle: Text(
              app.executionMode == AIExecutionMode.offline
                  ? (isEnglish ? 'Offline mode enabled.' : 'آف لائن موڈ فعال ہے۔')
                  : (isEnglish ? 'Online mode enabled.' : 'آن لائن موڈ فعال ہے۔'),
            ),
            value: app.executionMode == AIExecutionMode.offline,
            onChanged: (_) => app.toggleExecutionMode(),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.logout),
            title: Text(isEnglish ? 'Log out' : 'لاگ آؤٹ'),
            subtitle: Text(
              isEnglish
                  ? 'Clear the current session on this device.'
                  : 'اس ڈیوائس پر موجودہ سیشن ختم کریں۔',
            ),
            onTap: () => app.logout(),
          ),
        ),
      ],
    );
  }
}
