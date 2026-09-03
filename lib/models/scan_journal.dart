// lib/models/scan_journal.dart
import 'enums.dart';

class DiseaseScanResult {
  final String detectedDisease;
  final double confidence;
  final DiseaseSeverity severity;
  final List<String> causes;
  final List<String> precautions;
  final List<String> recommendedMedicines;
  final bool vetRequired;
  final int recoveryDaysEstimate;
  final String aiNotes;

  DiseaseScanResult({
    required this.detectedDisease,
    required this.confidence,
    required this.severity,
    required this.causes,
    required this.precautions,
    required this.recommendedMedicines,
    required this.vetRequired,
    required this.recoveryDaysEstimate,
    required this.aiNotes,
  });

  factory DiseaseScanResult.fromJson(Map<String, dynamic> json) =>
      DiseaseScanResult(
        detectedDisease: json['detectedDisease'] ?? '',
        confidence: (json['confidence'] ?? 0).toDouble(),
        severity: _parseSeverity(json['severity']),
        causes: _toStringList(json['causes']),
        precautions: _toStringList(json['precautions']),
        recommendedMedicines: _toStringList(json['recommendedMedicines']),
        vetRequired: json['vetRequired'] ?? false,
        recoveryDaysEstimate: json['recoveryDaysEstimate'] ?? 7,
        aiNotes: json['aiNotes'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'detectedDisease': detectedDisease,
        'confidence': confidence,
        'severity': severity.name,
        'causes': causes,
        'precautions': precautions,
        'recommendedMedicines': recommendedMedicines,
        'vetRequired': vetRequired,
        'recoveryDaysEstimate': recoveryDaysEstimate,
        'aiNotes': aiNotes,
      };

  static DiseaseSeverity _parseSeverity(dynamic v) {
    try {
      return DiseaseSeverity.values.byName((v ?? 'moderate').toString());
    } catch (_) {
      return DiseaseSeverity.moderate;
    }
  }

  static List<String> _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}

class ScanJournalEntry {
  final String id;
  final String animalId;
  final String animalName;
  final String date;
  final String? imageUrl;
  final String? videoUrl;
  final String detectedDisease;
  final double confidence;
  final DiseaseSeverity severity;
  final List<String> causes;
  final List<String> precautions;
  final List<String> recommendedMedicines;
  final bool vetRequired;
  final int recoveryDaysEstimate;
  final String aiNotes;
  final String? descriptionUr;
  final String? treatmentUr;
  final String? audioBase64;

  ScanJournalEntry({
    required this.id,
    required this.animalId,
    required this.animalName,
    required this.date,
    this.imageUrl,
    this.videoUrl,
    required this.detectedDisease,
    required this.confidence,
    required this.severity,
    required this.causes,
    required this.precautions,
    required this.recommendedMedicines,
    required this.vetRequired,
    required this.recoveryDaysEstimate,
    required this.aiNotes,
    this.descriptionUr,
    this.treatmentUr,
    this.audioBase64,
  });

  factory ScanJournalEntry.fromJson(Map<String, dynamic> json) =>
      ScanJournalEntry(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        animalName: json['animalName'] ?? '',
        date: json['date'] ?? '',
        imageUrl: json['imageUrl'],
        videoUrl: json['videoUrl'],
        detectedDisease: json['detectedDisease'] ?? '',
        confidence: (json['confidence'] ?? 0).toDouble(),
        severity: _parseSeverity(json['severity']),
        causes: _toStringList(json['causes']),
        precautions: _toStringList(json['precautions']),
        recommendedMedicines: _toStringList(json['recommendedMedicines']),
        vetRequired: json['vetRequired'] ?? false,
        recoveryDaysEstimate: json['recoveryDaysEstimate'] ?? 7,
        aiNotes: json['aiNotes'] ?? '',
        descriptionUr: json['description_ur'],
        treatmentUr: json['treatment_ur'],
        audioBase64: json['audio_base64'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'animalName': animalName,
        'date': date,
        'imageUrl': imageUrl,
        'videoUrl': videoUrl,
        'detectedDisease': detectedDisease,
        'confidence': confidence,
        'severity': severity.name,
        'causes': causes,
        'precautions': precautions,
        'recommendedMedicines': recommendedMedicines,
        'vetRequired': vetRequired,
        'recoveryDaysEstimate': recoveryDaysEstimate,
        'aiNotes': aiNotes,
        'description_ur': descriptionUr,
        'treatment_ur': treatmentUr,
        'audio_base64': audioBase64,
      };

  static DiseaseSeverity _parseSeverity(dynamic v) {
    try {
      return DiseaseSeverity.values.byName((v ?? 'moderate').toString());
    } catch (_) {
      return DiseaseSeverity.moderate;
    }
  }

  static List<String> _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}

class RecoveryStep {
  final int day;
  final String title;
  final String description;
  final List<String> medicines;
  final String feedingInstructions;
  bool completed;

  RecoveryStep({
    required this.day,
    required this.title,
    required this.description,
    required this.medicines,
    required this.feedingInstructions,
    this.completed = false,
  });

  factory RecoveryStep.fromJson(Map<String, dynamic> json) => RecoveryStep(
        day: json['day'] ?? 0,
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        medicines: _toStringList(json['medicines']),
        feedingInstructions: json['feedingInstructions'] ?? '',
        completed: json['completed'] ?? false,
      );

  Map<String, dynamic> toJson() => {
        'day': day,
        'title': title,
        'description': description,
        'medicines': medicines,
        'feedingInstructions': feedingInstructions,
        'completed': completed,
      };

  static List<String> _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}

class RecoveryPlan {
  final String id;
  final String animalId;
  final String animalName;
  final String diseaseName;
  final String startDate;
  final int totalDays;
  final int currentDay;
  final List<RecoveryStep> steps;
  final String vetAdvice;

  RecoveryPlan({
    required this.id,
    required this.animalId,
    required this.animalName,
    required this.diseaseName,
    required this.startDate,
    required this.totalDays,
    this.currentDay = 1,
    required this.steps,
    required this.vetAdvice,
  });

  factory RecoveryPlan.fromJson(Map<String, dynamic> json) => RecoveryPlan(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        animalName: json['animalName'] ?? '',
        diseaseName: json['diseaseName'] ?? '',
        startDate: json['startDate'] ?? '',
        totalDays: json['totalDays'] ?? 7,
        currentDay: json['currentDay'] ?? 1,
        steps: _toList(json['steps'],
            (e) => RecoveryStep.fromJson(e as Map<String, dynamic>)),
        vetAdvice: json['vetAdvice'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'animalName': animalName,
        'diseaseName': diseaseName,
        'startDate': startDate,
        'totalDays': totalDays,
        'currentDay': currentDay,
        'steps': steps.map((e) => e.toJson()).toList(),
        'vetAdvice': vetAdvice,
      };

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) return value.map(mapper).toList();
    return [];
  }
}

class FeedRationItem {
  final String name;
  final double amountKg;
  final String timeSlot;
  final String nutritionalValue;
  final double estimatedCostPKR;

  FeedRationItem({
    required this.name,
    required this.amountKg,
    required this.timeSlot,
    required this.nutritionalValue,
    required this.estimatedCostPKR,
  });

  factory FeedRationItem.fromJson(Map<String, dynamic> json) => FeedRationItem(
        name: json['name'] ?? '',
        amountKg: (json['amountKg'] ?? 0).toDouble(),
        timeSlot: json['timeSlot'] ?? '',
        nutritionalValue: json['nutritionalValue'] ?? '',
        estimatedCostPKR: (json['estimatedCostPKR'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'amountKg': amountKg,
        'timeSlot': timeSlot,
        'nutritionalValue': nutritionalValue,
        'estimatedCostPKR': estimatedCostPKR,
      };
}

class FeedPlan {
  final String id;
  final String animalId;
  final String animalName;
  final Species species;
  final double weightKg;
  final double dailyWaterRequirementLiters;
  final List<FeedRationItem> items;
  final double totalDailyCostPKR;
  final String specialInstructions;
  final String lastUpdated;

  FeedPlan({
    required this.id,
    required this.animalId,
    required this.animalName,
    required this.species,
    required this.weightKg,
    required this.dailyWaterRequirementLiters,
    required this.items,
    required this.totalDailyCostPKR,
    required this.specialInstructions,
    required this.lastUpdated,
  });

  factory FeedPlan.fromJson(Map<String, dynamic> json) => FeedPlan(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        animalName: json['animalName'] ?? '',
        species: _parseSpecies(json['species']),
        weightKg: (json['weightKg'] ?? 0).toDouble(),
        dailyWaterRequirementLiters:
            (json['dailyWaterRequirementLiters'] ?? 0).toDouble(),
        items: _toList(json['items'],
            (e) => FeedRationItem.fromJson(e as Map<String, dynamic>)),
        totalDailyCostPKR: (json['totalDailyCostPKR'] ?? 0).toDouble(),
        specialInstructions: json['specialInstructions'] ?? '',
        lastUpdated: json['lastUpdated'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'animalName': animalName,
        'species': species.name,
        'weightKg': weightKg,
        'dailyWaterRequirementLiters': dailyWaterRequirementLiters,
        'items': items.map((e) => e.toJson()).toList(),
        'totalDailyCostPKR': totalDailyCostPKR,
        'specialInstructions': specialInstructions,
        'lastUpdated': lastUpdated,
      };

  static Species _parseSpecies(dynamic v) {
    try {
      return Species.values.byName((v ?? 'cow').toString());
    } catch (_) {
      return Species.cow;
    }
  }

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) return value.map(mapper).toList();
    return [];
  }
}

class NutritionIngredient {
  final String name;
  final double amountKg;
  final double costPKR;
  final String category;

  NutritionIngredient({
    required this.name,
    required this.amountKg,
    required this.costPKR,
    required this.category,
  });

  factory NutritionIngredient.fromJson(Map<String, dynamic> json) =>
      NutritionIngredient(
        name: json['name'] ?? '',
        amountKg: (json['amountKg'] ?? 0).toDouble(),
        costPKR: (json['costPKR'] ?? 0).toDouble(),
        category: json['category'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'amountKg': amountKg,
        'costPKR': costPKR,
        'category': category,
      };
}

class NutritionRecipe {
  final String id;
  final String animalId;
  final String animalName;
  final double targetMilkLiters;
  final double totalDailyCostPKR;
  final double greenFodderKg;
  final double dryFodderKg;
  final double concentrateKg;
  final double mineralMixGrams;
  final double waterLitersDay;
  final List<NutritionIngredient> ingredients;
  final String mixingInstructions;
  final String benefitsUrdu;

  NutritionRecipe({
    required this.id,
    required this.animalId,
    required this.animalName,
    required this.targetMilkLiters,
    required this.totalDailyCostPKR,
    required this.greenFodderKg,
    required this.dryFodderKg,
    required this.concentrateKg,
    required this.mineralMixGrams,
    required this.waterLitersDay,
    required this.ingredients,
    required this.mixingInstructions,
    required this.benefitsUrdu,
  });

  factory NutritionRecipe.fromJson(Map<String, dynamic> json) =>
      NutritionRecipe(
        id: json['id'] ?? '',
        animalId: json['animalId'] ?? '',
        animalName: json['animalName'] ?? '',
        targetMilkLiters: (json['targetMilkLiters'] ?? 0).toDouble(),
        totalDailyCostPKR: (json['totalDailyCostPKR'] ?? 0).toDouble(),
        greenFodderKg: (json['greenFodderKg'] ?? 0).toDouble(),
        dryFodderKg: (json['dryFodderKg'] ?? 0).toDouble(),
        concentrateKg: (json['concentrateKg'] ?? 0).toDouble(),
        mineralMixGrams: (json['mineralMixGrams'] ?? 0).toDouble(),
        waterLitersDay: (json['waterLitersDay'] ?? 0).toDouble(),
        ingredients: _toList(json['ingredients'],
            (e) => NutritionIngredient.fromJson(e as Map<String, dynamic>)),
        mixingInstructions: json['mixingInstructions'] ?? '',
        benefitsUrdu: json['benefitsUrdu'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'animalId': animalId,
        'animalName': animalName,
        'targetMilkLiters': targetMilkLiters,
        'totalDailyCostPKR': totalDailyCostPKR,
        'greenFodderKg': greenFodderKg,
        'dryFodderKg': dryFodderKg,
        'concentrateKg': concentrateKg,
        'mineralMixGrams': mineralMixGrams,
        'waterLitersDay': waterLitersDay,
        'ingredients': ingredients.map((e) => e.toJson()).toList(),
        'mixingInstructions': mixingInstructions,
        'benefitsUrdu': benefitsUrdu,
      };

  static List<T> _toList<T>(dynamic value, T Function(dynamic) mapper) {
    if (value is List) return value.map(mapper).toList();
    return [];
  }
}
