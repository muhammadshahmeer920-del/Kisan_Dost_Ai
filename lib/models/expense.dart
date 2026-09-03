// lib/models/expense.dart
import 'enums.dart';

class FarmExpense {
  final String id;
  final String? farmerId;
  final String date;
  final ExpenseCategory category;
  final double amountPKR;
  final String? animalId;
  final String? animalName;
  final String description;
  final String? recordedBy;
  final String? receiptImage;

  FarmExpense({
    required this.id,
    this.farmerId,
    required this.date,
    required this.category,
    required this.amountPKR,
    this.animalId,
    this.animalName,
    required this.description,
    this.recordedBy,
    this.receiptImage,
  });

  factory FarmExpense.fromJson(Map<String, dynamic> json) => FarmExpense(
        id: json['id'] ?? '',
        farmerId: json['farmerId'],
        date: json['date'] ?? '',
        category: _parseCategory(json['category']),
        amountPKR: (json['amountPKR'] ?? 0).toDouble(),
        animalId: json['animalId'],
        animalName: json['animalName'],
        description: json['description'] ?? '',
        recordedBy: json['recordedBy'],
        receiptImage: json['receiptImage'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'farmerId': farmerId,
        'date': date,
        'category': category.name,
        'amountPKR': amountPKR,
        'animalId': animalId,
        'animalName': animalName,
        'description': description,
        'recordedBy': recordedBy,
        'receiptImage': receiptImage,
      };

  FarmExpense copyWith({
    String? id,
    String? farmerId,
    String? date,
    ExpenseCategory? category,
    double? amountPKR,
    String? animalId,
    String? animalName,
    String? description,
    String? recordedBy,
    String? receiptImage,
  }) =>
      FarmExpense(
        id: id ?? this.id,
        farmerId: farmerId ?? this.farmerId,
        date: date ?? this.date,
        category: category ?? this.category,
        amountPKR: amountPKR ?? this.amountPKR,
        animalId: animalId ?? this.animalId,
        animalName: animalName ?? this.animalName,
        description: description ?? this.description,
        recordedBy: recordedBy ?? this.recordedBy,
        receiptImage: receiptImage ?? this.receiptImage,
      );

  static ExpenseCategory _parseCategory(dynamic v) {
    final s = (v ?? 'other').toString();
    if (s == 'vet_fee') return ExpenseCategory.vetFee;
    try {
      return ExpenseCategory.values.byName(s);
    } catch (_) {
      return ExpenseCategory.other;
    }
  }
}
