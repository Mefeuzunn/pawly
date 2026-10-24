import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        surface: AppColors.background,
        primary: AppColors.primary,
        secondary: AppColors.secondary,
      ),
      textTheme: TextTheme(
        displayLarge: AppTypography.displayLarge,
        displayMedium: AppTypography.displayMedium,
        displaySmall: AppTypography.displaySmall,
        bodyLarge: AppTypography.bodyLarge,
        bodyMedium: AppTypography.bodyMedium,
        bodySmall: AppTypography.bodySmall,
      ),
    );
  }

  // Claymorphism Box Decorations
  static BoxDecoration clayBox({
    Color color = AppColors.card,
    double radius = 24.0,
    bool pressed = false,
    Color? borderColor,
    double borderWidth = 1.5,
  }) {
    if (pressed) {
      return BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: borderColor ?? AppColors.border,
          width: borderWidth,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.clayDark.withValues(alpha: 0.35),
            offset: const Offset(1, 2),
            blurRadius: 4,
            spreadRadius: -1,
          ),
        ],
      );
    }

    return BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: borderColor ?? AppColors.border.withValues(alpha: 0.7),
        width: borderWidth,
      ),
      boxShadow: [
        // Dark drop shadow
        BoxShadow(
          color: AppColors.clayDark.withValues(alpha: 0.55),
          offset: const Offset(0, 8),
          blurRadius: 16,
          spreadRadius: -2,
        ),
        // Soft ambient blur
        BoxShadow(
          color: AppColors.clayDark.withValues(alpha: 0.25),
          offset: const Offset(0, 2),
          blurRadius: 6,
        ),
        // Top-left white specular rim highlight
        const BoxShadow(
          color: AppColors.clayLight,
          offset: Offset(-2, -2),
          blurRadius: 6,
        ),
      ],
    );
  }

  // Colorful pill button decoration
  static BoxDecoration clayButton({
    required Color color,
    double radius = 20.0,
    bool pressed = false,
  }) {
    final darkShade = HSLColor.fromColor(color).withLightness(
      (HSLColor.fromColor(color).lightness - 0.15).clamp(0.0, 1.0),
    ).toColor();

    if (pressed) {
      return BoxDecoration(
        color: darkShade,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: darkShade.withValues(alpha: 0.5),
            offset: const Offset(0, 1),
            blurRadius: 2,
          ),
        ],
      );
    }

    return BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(radius),
      boxShadow: [
        BoxShadow(
          color: darkShade.withValues(alpha: 0.6),
          offset: const Offset(0, 5),
          blurRadius: 0, // chunky clay button ridge
        ),
        BoxShadow(
          color: darkShade.withValues(alpha: 0.35),
          offset: const Offset(0, 8),
          blurRadius: 10,
        ),
        BoxShadow(
          color: Colors.white.withValues(alpha: 0.4),
          offset: const Offset(0, 2),
          blurRadius: 0,
        ),
      ],
    );
  }
}
