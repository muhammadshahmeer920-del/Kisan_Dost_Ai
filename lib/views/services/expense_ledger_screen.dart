// lib/views/services/expense_ledger_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/enums.dart';
import '../../providers/providers.dart';
import '../../theme/app_colors.dart';

class ExpenseLedgerScreen extends StatelessWidget {
  const ExpenseLedgerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<DataProvider>();
    final expenses = data.expenses;
    final total = expenses.fold<double>(0, (sum, e) => sum + e.amountPKR);

    return Column(
      children: [
        Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.account_balance_wallet, color: AppColors.primary, size: 40),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Expenses / کل خرچہ',
                        style: Theme.of(context).textTheme.bodyMedium),
                    Text('Rs. ${total.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.headlineMedium),
                  ],
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: expenses.length,
            itemBuilder: (context, index) {
              final e = expenses[index];
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _colorForCategory(e.category),
                    child: Icon(_iconForCategory(e.category), color: Colors.white),
                  ),
                  title: Text(e.description),
                  subtitle: Text(e.date),
                  trailing: Text('Rs. ${e.amountPKR.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Color _colorForCategory(ExpenseCategory category) {
    switch (category) {
      case ExpenseCategory.feed:
        return AppColors.primary;
      case ExpenseCategory.medicine:
      case ExpenseCategory.vaccine:
        return AppColors.error;
      case ExpenseCategory.vet:
      case ExpenseCategory.vetFee:
        return AppColors.info;
      default:
        return AppColors.warning;
    }
  }

  IconData _iconForCategory(ExpenseCategory category) {
    switch (category) {
      case ExpenseCategory.feed:
        return Icons.grass;
      case ExpenseCategory.medicine:
      case ExpenseCategory.vaccine:
        return Icons.medication;
      case ExpenseCategory.vet:
      case ExpenseCategory.vetFee:
        return Icons.local_hospital;
      default:
        return Icons.shopping_bag;
    }
  }
}
