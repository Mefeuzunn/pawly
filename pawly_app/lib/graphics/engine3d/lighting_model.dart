import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'vector3_math.dart';

class ClayLighting {
  static const Vec3 lightDir = Vec3(0.45, 0.75, -0.65);
  static const Color ambientLight = Color(0xFFFDEFD9);

  /// Computes shaded gradient paint for a 3D sphere rendered in perspective
  static Paint createClayPaint({
    required Offset screenCenter,
    required double screenRadiusX,
    required double screenRadiusY,
    required Color baseColor,
    required Vec3 normal,
    double specularIntensity = 0.5,
  }) {
    // Normalization
    final norm = normal.normalized();
    final lDir = lightDir.normalized();

    // Diffuse dot product
    final nDotL = math.max(0.0, norm.dot(lDir));

    // Specular highlight offset towards the light source
    final lightOffset = Offset(
      -screenRadiusX * 0.32,
      -screenRadiusY * 0.35,
    );

    // Clay gradient with soft ambient rim and highlight
    final hsl = HSLColor.fromColor(baseColor);
    final darkShade = hsl.withLightness((hsl.lightness - 0.22).clamp(0.0, 1.0)).toColor();
    final midShade = hsl.toColor();
    final lightShade = hsl.withLightness((hsl.lightness + 0.18).clamp(0.0, 1.0)).toColor();
    final specularWhite = Colors.white.withValues(alpha: (0.45 * specularIntensity + 0.25 * nDotL).clamp(0.0, 0.9));

    return Paint()
      ..shader = RadialGradient(
        center: Alignment(
          lightOffset.dx / (screenRadiusX > 0 ? screenRadiusX : 1),
          lightOffset.dy / (screenRadiusY > 0 ? screenRadiusY : 1),
        ),
        radius: 0.95,
        colors: [
          specularWhite,
          lightShade,
          midShade,
          darkShade,
        ],
        stops: const [0.0, 0.22, 0.65, 1.0],
      ).createShader(
        Rect.fromCenter(
          center: screenCenter,
          width: screenRadiusX * 2,
          height: screenRadiusY * 2,
        ),
      );
  }
}
