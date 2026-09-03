// lib/views/services/qr_scanner_screen.dart
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  String? _scannedValue;
  bool _scanning = true;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final animals = data.animals;

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Scan / سکین'),
              Tab(text: 'My Tags / میرے ٹیگ'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildScanner(),
                _buildMyTags(animals),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanner() {
    return Column(
      children: [
        Expanded(
          child: _scanning
              ? MobileScanner(
                  onDetect: (capture) {
                    final barcode = capture.barcodes.firstOrNull;
                    if (barcode != null && barcode.rawValue != null) {
                      setState(() {
                        _scannedValue = barcode.rawValue;
                        _scanning = false;
                      });
                    }
                  },
                )
              : Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle,
                          color: AppColors.success, size: 64),
                      const SizedBox(height: 16),
                      Text('Scanned: $_scannedValue',
                          style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => setState(() {
                          _scanning = true;
                          _scannedValue = null;
                        }),
                        child: const Text('Scan Again'),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildMyTags(List<Animal> animals) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: animals.length,
      itemBuilder: (context, index) {
        final a = animals[index];
        return Card(
          child: ListTile(
            leading: SizedBox(
              width: 56,
              height: 56,
              child: QrImageView(
                data: a.digitalLicenseNumber ?? a.tagId,
                version: QrVersions.auto,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: AppColors.primary,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: AppColors.primary,
                ),
              ),
            ),
            title: Text(a.name),
            subtitle: Text(a.digitalLicenseNumber ?? a.tagId),
            trailing: IconButton(
              icon: const Icon(Icons.share),
              onPressed: () {},
            ),
          ),
        );
      },
    );
  }
}
