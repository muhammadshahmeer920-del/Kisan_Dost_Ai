// lib/views/services/nearby_vets_map_screen.dart
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class NearbyVetsMapScreen extends StatefulWidget {
  const NearbyVetsMapScreen({super.key});

  @override
  State<NearbyVetsMapScreen> createState() => _NearbyVetsMapScreenState();
}

class _NearbyVetsMapScreenState extends State<NearbyVetsMapScreen> {
  GoogleMapController? _mapController;
  VetDoctor? _selected;

  static const LatLng _defaultCenter = LatLng(30.6682, 73.1114); // Sahiwal

  @override
  Widget build(BuildContext context) {
    final vets = context.watch<DataProvider>().appointments.isEmpty
        ? <VetDoctor>[]
        : seedVets;
    final markers = vets
        .where((v) => v.coordinates != null)
        .map((v) => Marker(
              markerId: MarkerId(v.id),
              position: LatLng(v.coordinates!.lat, v.coordinates!.lng),
              infoWindow: InfoWindow(title: v.name, snippet: v.specialty),
              onTap: () => setState(() => _selected = v),
            ))
        .toSet();

    return Column(
      children: [
        Expanded(
          flex: 3,
          child: GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: const CameraPosition(
              target: _defaultCenter,
              zoom: 12,
            ),
            markers: markers,
            onMapCreated: (controller) => _mapController = controller,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
          ),
        ),
        Expanded(
          flex: 2,
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: vets.length,
            itemBuilder: (context, index) {
              final v = vets[index];
              return Card(
                color: _selected?.id == v.id
                    ? AppColors.sageTint
                    : null,
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.info,
                    child: Icon(Icons.local_hospital, color: Colors.white),
                  ),
                  title: Text(v.name),
                  subtitle: Text('${v.specialty} • ${v.distanceKm} km'),
                  trailing: IconButton(
                    icon: const Icon(Icons.phone),
                    onPressed: () => _call(v.phone),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _call(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }
}

final List<VetDoctor> seedVets = [
  VetDoctor(
    id: 'vet_001',
    name: 'Dr. Tariq Mahmood',
    specialty: 'Senior Livestock Specialist & Surgeon',
    qualifications: 'DVM, M.Phil (UVAS)',
    experienceYears: 14,
    phone: '0301-7654321',
    clinicAddress: 'Civil Veterinary Hospital, Sahiwal',
    city: 'Sahiwal',
    distanceKm: 4.2,
    rating: 4.9,
    consultationFeePKR: 1000,
    imageUrl: '',
    availableForVideo: true,
    availableForEmergency: true,
    coordinates: LatLngField(lat: 30.6682, lng: 73.1114),
  ),
  VetDoctor(
    id: 'vet_002',
    name: 'Dr. Sanaullah Khan',
    specialty: 'Bovine Reproduction & AI',
    qualifications: 'DVM, MSc',
    experienceYears: 9,
    phone: '0333-8899001',
    clinicAddress: 'Kisan Cattle Care Clinic',
    city: 'Sahiwal',
    distanceKm: 7.8,
    rating: 4.8,
    consultationFeePKR: 800,
    imageUrl: '',
    availableForVideo: true,
    availableForEmergency: true,
    coordinates: LatLngField(lat: 30.6500, lng: 73.1300),
  ),
];
