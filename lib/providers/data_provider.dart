// lib/providers/data_provider.dart
// Farmer-side collections with write-through persistence + real-time sync.

import 'dart:async';

import 'package:flutter/material.dart';

import '../models/models.dart';
import '../models/seed_data.dart' as seed;
import '../services/services.dart';

class DataProvider extends ChangeNotifier {
  List<Animal> _animals = [];
  List<FarmExpense> _expenses = [];
  List<Appointment> _appointments = [];
  List<DairyProduct> _dairyProducts = [];
  List<OutbreakReport> _outbreaks = [];
  List<ScanJournalEntry> _scanJournal = [];
  List<VaccinationRecord> _vaccinations = [];
  List<CustomerOrderLead> _customerOrders = [];

  StreamSubscription<Map<String, dynamic>>? _productSub;
  StreamSubscription<Map<String, dynamic>>? _orderSub;
  StreamSubscription<Map<String, dynamic>>? _snapshotSub;

  DataProvider() {
    _load();
  }

  List<Animal> get animals => List.unmodifiable(_animals);
  List<FarmExpense> get expenses => List.unmodifiable(_expenses);
  List<Appointment> get appointments => List.unmodifiable(_appointments);
  List<DairyProduct> get dairyProducts => List.unmodifiable(_dairyProducts);
  List<OutbreakReport> get outbreaks => List.unmodifiable(_outbreaks);
  List<ScanJournalEntry> get scanJournal => List.unmodifiable(_scanJournal);
  List<VaccinationRecord> get vaccinations => List.unmodifiable(_vaccinations);
  List<CustomerOrderLead> get customerOrders => List.unmodifiable(_customerOrders);

  Future<void> _load() async {
    await StorageService.init();

    final animalList = StorageService.getAnimals();
    _animals = animalList.isNotEmpty
        ? animalList.map((e) => Animal.fromJson(e)).toList()
        : List.from(seed.initialAnimals);

    final expenseList = StorageService.getExpenses();
    _expenses = expenseList.isNotEmpty
        ? expenseList.map((e) => FarmExpense.fromJson(e)).toList()
        : List.from(seed.initialExpenses);

    final aptList = StorageService.getAppointments();
    _appointments = aptList.isNotEmpty
        ? aptList.map((e) => Appointment.fromJson(e)).toList()
        : List.from(seed.initialAppointments);

    final dairyList = StorageService.getDairyProducts();
    _dairyProducts = dairyList.isNotEmpty
        ? dairyList.map((e) => DairyProduct.fromJson(e)).toList()
        : List.from(seed.initialDairyProducts);

    final outbreakList = StorageService.getOutbreaks();
    _outbreaks = outbreakList.isNotEmpty
        ? outbreakList.map((e) => OutbreakReport.fromJson(e)).toList()
        : List.from(seed.initialOutbreaks);

    final orderList = StorageService.getList(StorageKeys.customerOrders);
    _customerOrders = orderList.isNotEmpty
        ? orderList.map((e) => CustomerOrderLead.fromJson(e)).toList()
        : [];

    _scanJournal = _animals.expand((a) => a.scanJournal).toList();
    _vaccinations = _animals.expand((a) => a.vaccinationHistory).toList();

    _listenToSocketStreams();
    notifyListeners();
  }

  void _listenToSocketStreams() {
    _productSub?.cancel();
    _orderSub?.cancel();
    _snapshotSub?.cancel();

    _snapshotSub = SocketService.instance.syncSnapshotStream.listen((event) {
      final products = event['products'] as List<dynamic>?;
      if (products != null && products.isNotEmpty) {
        for (final p in products) {
          if (p is Map<String, dynamic>) {
            _mergeDairyProduct(DairyProduct.fromJson(p));
          }
        }
      }

      final orders = event['orders'] as List<dynamic>?;
      if (orders != null) {
        for (final o in orders) {
          if (o is Map<String, dynamic>) {
            _mergeOrder(CustomerOrderLead.fromJson(o));
          }
        }
      }
      notifyListeners();
    });

    _productSub = SocketService.instance.dairyProductStream.listen((event) {
      final origin = event['origin'] as Map<String, dynamic>?;
      if (origin?['clientId'] == SocketService.instance.clientId) return;

      final data = event['data'];
      if (data == null) {
        if (event['hint'] == 'stock_changed') {
          _refreshProductsFromServer();
        }
        return;
      }

      if (data is Map<String, dynamic>) {
        final id = data['id']?.toString();
        if (event.containsKey('deletedAt') || data['deleted_at'] != null) {
          if (id != null) {
            _dairyProducts.removeWhere((p) => p.id == id);
            _persist();
            notifyListeners();
          }
          return;
        }
        _mergeDairyProduct(DairyProduct.fromJson(data));
        _persist();
        notifyListeners();
      }
    });

    _orderSub = SocketService.instance.dairyOrderStream.listen((event) {
      final origin = event['origin'] as Map<String, dynamic>?;
      if (origin?['clientId'] == SocketService.instance.clientId) return;

      final data = event['data'];
      if (data is Map<String, dynamic>) {
        _mergeOrder(CustomerOrderLead.fromJson(data));
        _persist();
        notifyListeners();
      }
    });
  }

  void _mergeDairyProduct(DairyProduct incoming) {
    final idx = _dairyProducts.indexWhere((p) => p.id == incoming.id);
    if (idx >= 0) {
      final existing = _dairyProducts[idx];
      if (incoming.updatedAt.isNotEmpty &&
          existing.updatedAt.isNotEmpty &&
          incoming.updatedAt.compareTo(existing.updatedAt) <= 0) {
        return;
      }
      _dairyProducts[idx] = incoming;
    } else {
      _dairyProducts.insert(0, incoming);
    }
  }

  void _mergeOrder(CustomerOrderLead incoming) {
    final idx = _customerOrders.indexWhere((o) => o.id == incoming.id);
    if (idx >= 0) {
      final existing = _customerOrders[idx];
      if (incoming.updatedAt.isNotEmpty &&
          existing.updatedAt.isNotEmpty &&
          incoming.updatedAt.compareTo(existing.updatedAt) <= 0) {
        return;
      }
      _customerOrders[idx] = incoming;
    } else {
      _customerOrders.insert(0, incoming);
    }
  }

  Future<void> _refreshProductsFromServer() async {
    if (!AuthService.instance.isAuthenticated) return;
    try {
      final api = ApiService();
      final result = await api.getDairyProducts();
      final List<dynamic> list = (result['data'] as List<dynamic>?) ?? [];
      for (final p in list) {
        if (p is Map<String, dynamic>) {
          _mergeDairyProduct(DairyProduct.fromJson(p));
        }
      }
      _persist();
      notifyListeners();
    } catch (_) {
      // silent — will catch up on next sync
    }
  }

  Future<void> _persist() async {
    await StorageService.setAnimals(_animals.map((e) => e.toJson()).toList());
    await StorageService.setExpenses(_expenses.map((e) => e.toJson()).toList());
    await StorageService
        .setAppointments(_appointments.map((e) => e.toJson()).toList());
    await StorageService
        .setDairyProducts(_dairyProducts.map((e) => e.toJson()).toList());
    await StorageService.setOutbreaks(_outbreaks.map((e) => e.toJson()).toList());
    await StorageService.setList(
        StorageKeys.customerOrders, _customerOrders.map((e) => e.toJson()).toList());
  }

  void saveAnimal(Animal animal) {
    final idx = _animals.indexWhere((a) => a.id == animal.id);
    if (idx >= 0) {
      _animals[idx] = animal;
    } else {
      _animals.insert(0, animal);
    }
    _syncJournalAndVaccinations();
    _persist();
    notifyListeners();
  }

  void deleteAnimal(String id) {
    _animals.removeWhere((a) => a.id == id);
    _syncJournalAndVaccinations();
    _persist();
    notifyListeners();
  }

  void saveScanJournal(String animalId, ScanJournalEntry entry) {
    final idx = _animals.indexWhere((a) => a.id == animalId);
    if (idx >= 0) {
      final animal = _animals[idx];
      final updated = [entry, ...animal.scanJournal];
      final newStatus = _severityToHealth(entry.severity);
      _animals[idx] = animal.copyWith(
        scanJournal: updated,
        healthStatus: newStatus,
      );
      _syncJournalAndVaccinations();
      _persist();
      notifyListeners();
    }
  }

  void addVaccination(VaccinationRecord record) {
    _vaccinations.insert(0, record);
    final idx = _animals.indexWhere((a) => a.id == record.animalId);
    if (idx >= 0) {
      final animal = _animals[idx];
      _animals[idx] = animal.copyWith(
        vaccinationHistory: [record, ...animal.vaccinationHistory],
      );
    }
    _persist();
    notifyListeners();
  }

  void addExpense(FarmExpense expense) {
    _expenses.insert(0, expense);
    _persist();
    notifyListeners();
  }

  void bookAppointment(Appointment appointment) {
    _appointments.insert(0, appointment);
    _persist();
    notifyListeners();
  }

  void saveDairyProduct(DairyProduct product) {
    final now = DateTime.now().toUtc().toIso8601String();
    final updated = product.updatedAt.isEmpty
        ? product.copyWith(updatedAt: now)
        : product;

    _mergeDairyProduct(updated);
    _persist();
    notifyListeners();

    if (AuthService.instance.isAuthenticated) {
      SocketService.instance.emitDairyProductUpsert(
        updated.toJson(),
        (ack) {
          if (ack['ok'] == true) {
            final data = ack['data'] as Map<String, dynamic>?;
            if (data != null) {
              _mergeDairyProduct(DairyProduct.fromJson(data));
              _persist();
              notifyListeners();
            }
          } else if (ack['code'] == 'conflict') {
            final serverData = ack['data'] as Map<String, dynamic>?;
            if (serverData != null) {
              _mergeDairyProduct(DairyProduct.fromJson(serverData));
              _persist();
              notifyListeners();
            }
          }
        },
      );
    }
  }

  void deleteDairyProduct(String id) {
    _dairyProducts.removeWhere((p) => p.id == id);
    _persist();
    notifyListeners();

    if (AuthService.instance.isAuthenticated) {
      SocketService.instance.emitDairyProductDelete(id);
    }
  }

  void addCustomerOrder(CustomerOrderLead order) {
    final now = DateTime.now().toUtc().toIso8601String();
    final updated = order.updatedAt.isEmpty
        ? CustomerOrderLead(
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deliveryAddress: order.deliveryAddress,
            items: order.items,
            totalAmountPKR: order.totalAmountPKR,
            date: order.date,
            status: order.status,
            notes: order.notes,
            updatedAt: now,
          )
        : order;

    _mergeOrder(updated);
    _persist();
    notifyListeners();

    if (AuthService.instance.isAuthenticated) {
      SocketService.instance.emitOrderCreate(
        updated.toJson(),
        (ack) {
          if (ack['ok'] == true) {
            final data = ack['data'] as Map<String, dynamic>?;
            if (data != null) {
              _mergeOrder(CustomerOrderLead.fromJson(data));
              _persist();
              notifyListeners();
            }
          }
        },
      );
    }
  }

  void _syncJournalAndVaccinations() {
    _scanJournal = _animals.expand((a) => a.scanJournal).toList();
    _vaccinations = _animals.expand((a) => a.vaccinationHistory).toList();
  }

  HealthStatus _severityToHealth(DiseaseSeverity severity) {
    switch (severity) {
      case DiseaseSeverity.mild:
        return HealthStatus.fair;
      case DiseaseSeverity.moderate:
        return HealthStatus.sick;
      case DiseaseSeverity.severe:
      case DiseaseSeverity.critical:
        return HealthStatus.critical;
    }
  }

  @override
  void dispose() {
    _productSub?.cancel();
    _orderSub?.cancel();
    _snapshotSub?.cancel();
    super.dispose();
  }
}
