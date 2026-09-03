// lib/views/services/placeholder_service_screen.dart
import 'package:flutter/material.dart';

class PlaceholderServiceScreen extends StatelessWidget {
  final String serviceId;
  const PlaceholderServiceScreen({super.key, required this.serviceId});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Service "$serviceId" screen coming soon.',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
    );
  }
}
