// lib/models/dairy.dart
import 'enums.dart';

class DairyProduct {
  final String id;
  final String farmName;
  final String sellerName;
  final String sellerPhone;
  final String sellerCity;
  final String name;
  final DairyCategory category;
  final double pricePKR;
  final ProductUnit unit;
  final String dailyCapacity;
  final bool isOrganic;
  final bool inStock;
  final String description;
  final String imageUrl;
  final double? rating;
  final String updatedAt;

  DairyProduct({
    required this.id,
    required this.farmName,
    required this.sellerName,
    required this.sellerPhone,
    required this.sellerCity,
    required this.name,
    required this.category,
    required this.pricePKR,
    this.unit = ProductUnit.liter,
    required this.dailyCapacity,
    this.isOrganic = true,
    this.inStock = true,
    required this.description,
    required this.imageUrl,
    this.rating,
    required this.updatedAt,
  });

  factory DairyProduct.fromJson(Map<String, dynamic> json) => DairyProduct(
        id: json['id'] ?? '',
        farmName: json['farmName'] ?? '',
        sellerName: json['sellerName'] ?? '',
        sellerPhone: json['sellerPhone'] ?? '',
        sellerCity: json['sellerCity'] ?? '',
        name: json['name'] ?? '',
        category: _parseCategory(json['category']),
        pricePKR: (json['pricePKR'] ?? 0).toDouble(),
        unit: ProductUnitExt.fromString(json['unit']),
        dailyCapacity: json['dailyCapacity'] ?? '',
        isOrganic: json['isOrganic'] ?? true,
        inStock: json['inStock'] ?? true,
        description: json['description'] ?? '',
        imageUrl: json['imageUrl'] ?? '',
        rating: json['rating']?.toDouble(),
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'farmName': farmName,
        'sellerName': sellerName,
        'sellerPhone': sellerPhone,
        'sellerCity': sellerCity,
        'name': name,
        'category': category.name,
        'pricePKR': pricePKR,
        'unit': unit.value,
        'dailyCapacity': dailyCapacity,
        'isOrganic': isOrganic,
        'inStock': inStock,
        'description': description,
        'imageUrl': imageUrl,
        'rating': rating,
        'updatedAt': updatedAt,
      };

  DairyProduct copyWith({
    String? id,
    String? farmName,
    String? sellerName,
    String? sellerPhone,
    String? sellerCity,
    String? name,
    DairyCategory? category,
    double? pricePKR,
    ProductUnit? unit,
    String? dailyCapacity,
    bool? isOrganic,
    bool? inStock,
    String? description,
    String? imageUrl,
    double? rating,
    String? updatedAt,
  }) =>
      DairyProduct(
        id: id ?? this.id,
        farmName: farmName ?? this.farmName,
        sellerName: sellerName ?? this.sellerName,
        sellerPhone: sellerPhone ?? this.sellerPhone,
        sellerCity: sellerCity ?? this.sellerCity,
        name: name ?? this.name,
        category: category ?? this.category,
        pricePKR: pricePKR ?? this.pricePKR,
        unit: unit ?? this.unit,
        dailyCapacity: dailyCapacity ?? this.dailyCapacity,
        isOrganic: isOrganic ?? this.isOrganic,
        inStock: inStock ?? this.inStock,
        description: description ?? this.description,
        imageUrl: imageUrl ?? this.imageUrl,
        rating: rating ?? this.rating,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  static DairyCategory _parseCategory(dynamic v) {
    try {
      return DairyCategory.values.byName((v ?? 'milk').toString());
    } catch (_) {
      return DairyCategory.milk;
    }
  }
}

class CustomerCartItem {
  final DairyProduct product;
  int quantity;

  CustomerCartItem({required this.product, this.quantity = 1});

  double get lineTotal => product.pricePKR * quantity;
}

class CustomerOrderLeadItem {
  final String? productId;
  final String name;
  final int quantity;
  final String unit;
  final double pricePKR;

  CustomerOrderLeadItem({
    this.productId,
    required this.name,
    required this.quantity,
    required this.unit,
    required this.pricePKR,
  });

  factory CustomerOrderLeadItem.fromJson(Map<String, dynamic> json) =>
      CustomerOrderLeadItem(
        productId: json['productId'],
        name: json['name'] ?? '',
        quantity: json['quantity'] ?? 0,
        unit: json['unit'] ?? '',
        pricePKR: (json['pricePKR'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'quantity': quantity,
        'unit': unit,
        'pricePKR': pricePKR,
      };
}

class CustomerOrderLead {
  final String id;
  final String customerName;
  final String customerPhone;
  final String deliveryAddress;
  final List<CustomerOrderLeadItem> items;
  final double totalAmountPKR;
  final String date;
  final CustomerOrderStatus status;
  final String? notes;
  final String updatedAt;

  CustomerOrderLead({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.deliveryAddress,
    required this.items,
    required this.totalAmountPKR,
    required this.date,
    this.status = CustomerOrderStatus.new_,
    this.notes,
    this.updatedAt = '',
  });

  factory CustomerOrderLead.fromJson(Map<String, dynamic> json) =>
      CustomerOrderLead(
        id: json['id'] ?? '',
        customerName: json['customerName'] ?? json['customer_name'] ?? '',
        customerPhone: json['customerPhone'] ?? json['customer_phone'] ?? '',
        deliveryAddress: json['deliveryAddress'] ?? json['delivery_address'] ?? '',
        items: _toList(json['items'],
            (e) => CustomerOrderLeadItem.fromJson(e as Map<String, dynamic>)),
        totalAmountPKR: (json['totalAmountPKR'] ?? json['total_amount_pkr'] ?? 0).toDouble(),
        date: json['date'] ?? '',
        status: _parseStatus(json['status']),
        notes: json['notes'],
        updatedAt: json['updatedAt'] ?? json['updated_at'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'deliveryAddress': deliveryAddress,
        'items': items.map((e) => e.toJson()).toList(),
        'totalAmountPKR': totalAmountPKR,
        'date': date,
        'status': status.name,
        'notes': notes,
        'updatedAt': updatedAt,
      };

  static CustomerOrderStatus _parseStatus(dynamic v) {
    try {
      return CustomerOrderStatus.values.byName((v ?? 'new_').toString());
    } catch (_) {
      return CustomerOrderStatus.new_;
    }
  }

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) return value.map(mapper).toList();
    return [];
  }
}
