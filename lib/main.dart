// lib/main.dart
// Startup: restore auth from storage, then render app.

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'providers/providers.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KisanDostApp());
}

class KisanDostApp extends StatefulWidget {
  const KisanDostApp({super.key});

  @override
  State<KisanDostApp> createState() => _KisanDostAppState();
}

class _KisanDostAppState extends State<KisanDostApp> {
  late final Future<void> _bootstrapFuture = _bootstrap();

  Future<void> _bootstrap() async {
    await StorageService.init();
    await AuthService.instance.restoreFromStorage();

    if (AuthService.instance.isAuthenticated) {
      SocketService.instance.connect();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _bootstrapFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme(language: 'ur'),
            darkTheme: AppTheme.darkTheme(language: 'ur'),
            themeMode: ThemeMode.light,
            home: const _BrandedSplash(),
          );
        }

        return MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AppProvider()),
            ChangeNotifierProvider(create: (_) => DataProvider()),
            ChangeNotifierProvider(create: (_) => SyncProvider()),
          ],
          child: Consumer<AppProvider>(
            builder: (context, app, _) {
              final isRtl = app.isUrdu;

              if (app.isLoading) {
                return MaterialApp(
                  debugShowCheckedModeBanner: false,
                  theme: AppTheme.lightTheme(language: app.language.name),
                  darkTheme: AppTheme.darkTheme(language: app.language.name),
                  themeMode: ThemeMode.light,
                  home: const _BrandedSplash(),
                );
              }

              return MaterialApp(
                title: 'Kisan Dost AI',
                debugShowCheckedModeBanner: false,
                theme: AppTheme.lightTheme(language: app.language.name),
                darkTheme: AppTheme.darkTheme(language: app.language.name),
                themeMode: app.darkMode ? ThemeMode.dark : ThemeMode.light,
                builder: (context, child) {
                  return Directionality(
                    textDirection:
                        isRtl ? TextDirection.rtl : TextDirection.ltr,
                    child: child!,
                  );
                },
                home: const AppShell(),
              );
            },
          ),
        );
      },
    );
  }
}

class _BrandedSplash extends StatelessWidget {
  const _BrandedSplash();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF043927),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.eco, size: 96, color: Color(0xFFF59E0B)),
            SizedBox(height: 24),
            Text(
              'Kisan Dost AI',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Smart Livestock & Farm Platform',
              style: TextStyle(color: Color(0xFFA7F3D0), fontSize: 12),
            ),
            SizedBox(height: 40),
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
