// lib/views/user/user_layout.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../services/ai_assistant_screen.dart';
import '../services/services_hub_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class UserLayout extends StatelessWidget {
  const UserLayout({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_title(app.userRoute)),
        actions: [
          IconButton(
            icon: Icon(app.darkMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => app.toggleDarkMode(),
          ),
          PopupMenuButton<String>(
            itemBuilder: (_) => [
              PopupMenuItem(
                child: Text(app.language == Language.ur ? 'English' : 'اردو'),
                onTap: () {
                  app.setLanguage(
                      app.language == Language.ur ? Language.en : Language.ur);
                },
              ),
            ],
          ),
        ],
      ),
      body: _screenFor(app.userRoute, app.initialUserService),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: UserNavRoute.values.indexOf(app.userRoute),
        onTap: (index) => app.setUserRoute(UserNavRoute.values[index]),
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.layers),
            label: _label(app, english: 'Farm Services', urdu: 'فارم سروسز'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.support_agent),
            label: _label(app, english: 'Support Desk', urdu: 'سپورٹ ڈیسک'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person),
            label: _label(app, english: 'User Profile', urdu: 'پروفائل'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.settings),
            label: _label(app, english: 'Settings', urdu: 'ترتیبات'),
          ),
        ],
      ),
    );
  }

  Widget _screenFor(UserNavRoute route, String initialService) {
    switch (route) {
      case UserNavRoute.services:
        return ServicesHubScreen(initialService: initialService);
      case UserNavRoute.support:
        return const AIAssistantScreen(initialMode: 'chat');
      case UserNavRoute.profile:
        return const ProfileScreen();
      case UserNavRoute.settings:
        return const SettingsScreen();
    }
  }

  String _title(UserNavRoute route) {
    switch (route) {
      case UserNavRoute.services:
        return 'فارم سروسز';
      case UserNavRoute.support:
        return 'سپورٹ ڈیسک';
      case UserNavRoute.profile:
        return 'پروفائل';
      case UserNavRoute.settings:
        return 'ترتیبات';
    }
  }

  String _label(AppProvider app,
      {required String english, required String urdu}) {
    return app.language == Language.en ? english : urdu;
  }
}
