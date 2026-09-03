// lib/views/services/services_hub_screen.dart
import 'package:flutter/material.dart';

import 'ai_assistant_screen.dart';
import 'animal_management_screen.dart';
import 'biosecurity_screen.dart';
import 'dairy_store_screen.dart';
import 'digital_farm_id_screen.dart';
import 'expense_ledger_screen.dart';
import 'medicine_checker_screen.dart';
import 'nearby_vets_map_screen.dart';
import 'nutrition_screen.dart';
import 'offline_knowledge_screen.dart';
import 'outbreak_radar_screen.dart';
import 'placeholder_service_screen.dart';
import 'qr_scanner_screen.dart';
import 'vaccination_center_screen.dart';
import 'veterinary_portal_screen.dart';

class _ServiceItem {
  final String id;
  final String title;
  final String titleUrdu;
  final IconData icon;
  final Color color;

  const _ServiceItem({
    required this.id,
    required this.title,
    required this.titleUrdu,
    required this.icon,
    required this.color,
  });
}

const List<_ServiceItem> _services = [
  _ServiceItem(id: 'animals', title: 'Livestock Herd Registry', titleUrdu: 'مویشیوں کا ریکارڈ', icon: Icons.format_list_numbered, color: Colors.green),
  _ServiceItem(id: 'scanner', title: 'AI Disease Vision Scanner', titleUrdu: 'AI بیماری سکینر', icon: Icons.document_scanner, color: Colors.teal),
  _ServiceItem(id: 'assistant', title: 'AI Voice Farm Doctor', titleUrdu: 'AI فارم ڈاکٹر', icon: Icons.smart_toy, color: Colors.teal),
  _ServiceItem(id: 'dairystore', title: 'Pure Dairy Store', titleUrdu: 'خالص ڈیری اسٹور', icon: Icons.store, color: Colors.blue),
  _ServiceItem(id: 'vets', title: 'Veterinary Appointments', titleUrdu: 'ویٹرنری تعیناتی', icon: Icons.local_hospital, color: Colors.indigo),
  _ServiceItem(id: 'nutrition', title: 'Nutrition & Feed Formulator', titleUrdu: 'غذائی منصوبہ', icon: Icons.grass, color: Colors.amber),
  _ServiceItem(id: 'vaccines', title: 'Vaccination & Bio-Security', titleUrdu: 'ویکسینیشن', icon: Icons.vaccines, color: Colors.purple),
  _ServiceItem(id: 'expenses', title: 'Expense & Profit Ledger', titleUrdu: 'خرچہ و منافع', icon: Icons.trending_down, color: Colors.pink),
  _ServiceItem(id: 'qr_scanner', title: 'QR Tag Smart Scanner', titleUrdu: 'QR ٹیگ سکینر', icon: Icons.qr_code_scanner, color: Colors.black87),
  _ServiceItem(id: 'map', title: 'Nearby Veterinary Map', titleUrdu: 'قریبی ویٹرنری نقشہ', icon: Icons.location_pin, color: Colors.green),
  _ServiceItem(id: 'biosecurity', title: 'Biosecurity Assessment', titleUrdu: 'بائیو سیکیورٹی', icon: Icons.shield, color: Colors.green),
  _ServiceItem(id: 'outbreaks', title: 'Disease Outbreak Radar', titleUrdu: 'وبائی ریڈار', icon: Icons.radar, color: Colors.red),
  _ServiceItem(id: 'medicine', title: 'Medicine Checker', titleUrdu: 'دوائی چیکر', icon: Icons.medication, color: Colors.teal),
  _ServiceItem(id: 'license', title: 'Digital Farm ID & License', titleUrdu: 'ڈیجیٹل فارم ID', icon: Icons.badge, color: Colors.orange),
  _ServiceItem(id: 'offline_knowledge', title: 'Offline Knowledge Book', titleUrdu: 'آف لائن کتاب', icon: Icons.menu_book, color: Colors.blueGrey),
];

class ServicesHubScreen extends StatefulWidget {
  final String initialService;
  const ServicesHubScreen({super.key, this.initialService = 'hub'});

  @override
  State<ServicesHubScreen> createState() => _ServicesHubScreenState();
}

class _ServicesHubScreenState extends State<ServicesHubScreen> {
  late String _activeService;

  @override
  void initState() {
    super.initState();
    _activeService = widget.initialService;
  }

  @override
  Widget build(BuildContext context) {
    if (_activeService != 'hub') {
      return _ServiceShell(
        serviceId: _activeService,
        onBack: () => setState(() => _activeService = 'hub'),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        itemCount: _services.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.1,
        ),
        itemBuilder: (context, index) {
          final s = _services[index];
          return Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => setState(() => _activeService = s.id),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(s.icon, color: s.color, size: 36),
                    const SizedBox(height: 12),
                    Text(
                      s.title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s.titleUrdu,
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ServiceShell extends StatelessWidget {
  final String serviceId;
  final VoidCallback onBack;
  const _ServiceShell({required this.serviceId, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: onBack,
        ),
        title: Text(_title(serviceId)),
      ),
      body: _body(serviceId),
    );
  }

  Widget _body(String id) {
    switch (id) {
      case 'animals':
        return const AnimalManagementScreen();
      case 'scanner':
      case 'assistant':
        return AIAssistantScreen(initialMode: id == 'scanner' ? 'scanner' : 'chat');
      case 'dairystore':
        return const DairyStoreScreen();
      case 'vets':
        return const VeterinaryPortalScreen();
      case 'nutrition':
        return const NutritionScreen();
      case 'vaccines':
        return const VaccinationCenterScreen();
      case 'expenses':
        return const ExpenseLedgerScreen();
      case 'qr_scanner':
        return const QrScannerScreen();
      case 'map':
        return const NearbyVetsMapScreen();
      case 'biosecurity':
        return const BiosecurityScreen();
      case 'outbreaks':
        return const OutbreakRadarScreen();
      case 'medicine':
        return const MedicineCheckerScreen();
      case 'license':
        return const DigitalFarmIdScreen();
      case 'offline_knowledge':
        return const OfflineKnowledgeScreen();
      default:
        return PlaceholderServiceScreen(serviceId: id);
    }
  }

  String _title(String id) {
    final s = _services.firstWhere((s) => s.id == id,
        orElse: () => _services.first);
    return '${s.title} / ${s.titleUrdu}';
  }
}
