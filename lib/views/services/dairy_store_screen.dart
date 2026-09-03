// lib/views/services/dairy_store_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/dairy.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';

class DairyStoreScreen extends StatelessWidget {
  const DairyStoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final products = data.dairyProducts;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final p = products[index];
        return Card(
          child: ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(p.imageUrl, width: 56, height: 56, fit: BoxFit.cover),
            ),
            title: Text(p.name),
            subtitle: Text('PKR ${p.pricePKR.toStringAsFixed(0)} / ${p.unit.name}'),
            trailing: ElevatedButton(
              onPressed: () => _order(context, p),
              child: const Text('Order'),
            ),
          ),
        );
      },
    );
  }

  void _order(BuildContext context, DairyProduct product) {
    final data = context.read<DataProvider>();
    final order = CustomerOrderLead(
      id: 'ord_${DateTime.now().millisecondsSinceEpoch}',
      customerName: data.animals.firstOrNull?.ownerId ?? 'Buyer',
      customerPhone: '0300-0000000',
      deliveryAddress: 'Sahiwal',
      items: [
        CustomerOrderLeadItem(
          productId: product.id,
          name: product.name,
          quantity: 1,
          unit: product.unit.name,
          pricePKR: product.pricePKR,
        ),
      ],
      totalAmountPKR: product.pricePKR,
      date: DateTime.now().toIso8601String(),
    );
    data.addCustomerOrder(order);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Order placed for ${product.name}')),
    );
  }
}
