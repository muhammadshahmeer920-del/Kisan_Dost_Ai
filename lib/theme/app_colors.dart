import 'package:flutter/material.dart';

/// AgTech color system matching the web app's Tailwind palette.
abstract class AppColors {
  // Brand
  static const Color primary = Color(0xFF059669);
  static const Color primaryDark = Color(0xFF047857);
  static const Color primaryLight = Color(0xFF10B981);
  static const Color accentMint = Color(0xFF10B981);

  // Backgrounds
  static const Color background = Color(0xFFF4FBF7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color sageTint = Color(0xFFF0FDF4);

  // Dark mode
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkCommand = Color(0xFF0B1320);

  // Semantic
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
  static const Color success = Color(0xFF10B981);

  // Text
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Borders / dividers
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderDark = Color(0xFF334155);

  // Glassmorphism tints
  static Color glassLight = Colors.white.withValues(alpha: 0.82);
  static Color glassDark = Colors.black.withValues(alpha: 0.35);
}
