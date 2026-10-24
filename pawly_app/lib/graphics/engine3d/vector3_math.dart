import 'dart:math' as math;
import 'package:flutter/material.dart';

class Vec3 {
  final double x;
  final double y;
  final double z;

  const Vec3(this.x, this.y, this.z);

  static const Vec3 zero = Vec3(0, 0, 0);
  static const Vec3 up = Vec3(0, 1, 0);
  static const Vec3 right = Vec3(1, 0, 0);
  static const Vec3 forward = Vec3(0, 0, 1);

  Vec3 operator +(Vec3 o) => Vec3(x + o.x, y + o.y, z + o.z);
  Vec3 operator -(Vec3 o) => Vec3(x - o.x, y - o.y, z - o.z);
  Vec3 operator *(double s) => Vec3(x * s, y * s, z * s);
  Vec3 operator /(double s) => Vec3(x / s, y / s, z / s);

  double dot(Vec3 o) => x * o.x + y * o.y + z * o.z;

  Vec3 cross(Vec3 o) => Vec3(
    y * o.z - z * o.y,
    z * o.x - x * o.z,
    x * o.y - y * o.x,
  );

  double get length => math.sqrt(x * x + y * y + z * z);

  Vec3 normalized() {
    final len = length;
    if (len == 0) return Vec3.zero;
    return this / len;
  }

  Vec3 rotateY(double angleRad) {
    final cosA = math.cos(angleRad);
    final sinA = math.sin(angleRad);
    return Vec3(x * cosA + z * sinA, y, -x * sinA + z * cosA);
  }

  Vec3 rotateX(double angleRad) {
    final cosA = math.cos(angleRad);
    final sinA = math.sin(angleRad);
    return Vec3(x, y * cosA - z * sinA, y * sinA + z * cosA);
  }

  Vec3 rotateZ(double angleRad) {
    final cosA = math.cos(angleRad);
    final sinA = math.sin(angleRad);
    return Vec3(x * cosA - y * sinA, x * sinA + y * cosA, z);
  }
}

/// Simple 3D Sphere primitive for Clay modeling
class ClaySphere {
  final Vec3 center;
  final double radiusX;
  final double radiusY;
  final double radiusZ;
  final Color baseColor;
  final double roughness;
  final double specular;

  const ClaySphere({
    required this.center,
    required this.radiusX,
    required this.radiusY,
    required this.radiusZ,
    required this.baseColor,
    this.roughness = 0.4,
    this.specular = 0.6,
  });

  factory ClaySphere.uniform({
    required Vec3 center,
    required double radius,
    required Color baseColor,
    double roughness = 0.4,
    double specular = 0.6,
  }) {
    return ClaySphere(
      center: center,
      radiusX: radius,
      radiusY: radius,
      radiusZ: radius,
      baseColor: baseColor,
      roughness: roughness,
      specular: specular,
    );
  }
}
