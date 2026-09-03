// lib/app.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/providers.dart';
import 'views/auth/onboarding_screen.dart';
import 'views/user/user_layout.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    if (!app.onboardingComplete) {
      return const OnboardingScreen();
    }

    return const Scaffold(
      body: Column(
        children: [
          _SyncBanner(),
          Expanded(child: UserLayout()),
        ],
      ),
    );
  }
}

class _SyncBanner extends StatelessWidget {
  const _SyncBanner();

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();

    if (sync.status == SyncStatus.connected && sync.pendingCount == 0) {
      return const SizedBox.shrink();
    }

    Color bg;
    String label;

    switch (sync.status) {
      case SyncStatus.disconnected:
        bg = Colors.orange.shade700;
        label = sync.pendingCount > 0
            ? 'Offline — ${sync.pendingCount} pending'
            : 'Offline';
        break;
      case SyncStatus.connecting:
        bg = Colors.amber.shade700;
        label = 'Reconnecting...';
        break;
      case SyncStatus.syncing:
        bg = Colors.blue.shade600;
        label = 'Syncing...';
        break;
      case SyncStatus.connected:
        if (sync.pendingCount > 0) {
          bg = Colors.orange.shade600;
          label = '${sync.pendingCount} pending';
        } else {
          return const SizedBox.shrink();
        }
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
      color: bg,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (sync.status == SyncStatus.connecting ||
              sync.status == SyncStatus.syncing)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          if (sync.status == SyncStatus.connecting ||
              sync.status == SyncStatus.syncing)
            const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (sync.status == SyncStatus.disconnected ||
              sync.status == SyncStatus.connected)
            const SizedBox(width: 8),
          if (sync.status == SyncStatus.disconnected ||
              sync.status == SyncStatus.connected)
            GestureDetector(
              onTap: () => sync.forceSync(),
              child: const Text(
                'Retry',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
