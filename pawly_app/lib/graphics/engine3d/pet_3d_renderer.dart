import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/pet_model.dart';
import 'vector3_math.dart';
import 'lighting_model.dart';

class Pet3DRenderer {
  final PetModel pet;
  final double animationTime; // in seconds
  final double yaw; // radians
  final double pitch; // radians
  final double squish; // 0.0 = normal, 1.0 = squished
  final Offset lookAtOffset; // normalized -1.0 to 1.0
  final double blinkValue; // 0.0 open, 1.0 closed
  final double eatingCycle; // 0.0 to 1.0
  final bool isPurring;

  Pet3DRenderer({
    required this.pet,
    required this.animationTime,
    this.yaw = 0.0,
    this.pitch = 0.0,
    this.squish = 0.0,
    this.lookAtOffset = Offset.zero,
    this.blinkValue = 0.0,
    this.eatingCycle = 0.0,
    this.isPurring = false,
  });

  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 + 10);
    final scale = math.min(size.width, size.height) * 0.42;

    // Breathing wave
    final breathe = pet.isSleeping
        ? math.sin(animationTime * 2.2) * 0.04
        : math.sin(animationTime * 3.5) * 0.025;

    // Squish deformation
    final scaleY = (1.0 - squish * 0.25 + breathe);
    final scaleXZ = (1.0 + squish * 0.15 - breathe * 0.5);

    // 1. Draw contact ground shadow
    _drawContactShadow(canvas, center, scale, scaleXZ);

    // 2. Render Pet depending on species
    switch (pet.species) {
      case PetSpecies.cat:
        _renderCat(canvas, center, scale, scaleXZ, scaleY);
        break;
      case PetSpecies.shiba:
        _renderShiba(canvas, center, scale, scaleXZ, scaleY);
        break;
      case PetSpecies.bear:
        _renderBear(canvas, center, scale, scaleXZ, scaleY);
        break;
      case PetSpecies.bunny:
        _renderBunny(canvas, center, scale, scaleXZ, scaleY);
        break;
    }

    // 3. Render 3D Outfit / Accessory
    _renderOutfit(canvas, center, scale, scaleXZ, scaleY);
  }

  void _drawContactShadow(Canvas canvas, Offset center, double scale, double scaleXZ) {
    final shadowY = center.dy + scale * 0.82;
    final shadowWidth = scale * 1.15 * scaleXZ;
    final shadowHeight = scale * 0.28 * (1.0 - squish * 0.1);

    final shadowPaint = Paint()
      ..color = const Color(0x334A2E1C)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);

    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(center.dx, shadowY),
        width: shadowWidth,
        height: shadowHeight,
      ),
      shadowPaint,
    );
  }

  // -------------------------------------------------------------
  // 1. CAT RENDERING (Mochi - Calico / Soft Peach & Cream)
  // -------------------------------------------------------------
  void _renderCat(Canvas canvas, Offset center, double scale, double sxz, double sy) {
    const furColor = Color(0xFFFBE4D2); // Peach Cream
    const patchColor = Color(0xFFF28F60); // Calico Orange Spot
    const earInner = Color(0xFFFFB4C0); // Pink Inner Ear

    // Head center with look-at tilt
    final headCenter = Offset(
      center.dx + lookAtOffset.dx * 16 + math.sin(yaw) * 12,
      center.dy - scale * 0.28 * sy + lookAtOffset.dy * 8,
    );

    // Tail (sways in back)
    _renderTail(canvas, center, scale, furColor, isCat: true);

    // Body
    final bodyCenter = Offset(center.dx, center.dy + scale * 0.22 * sy);
    _drawClayEllipsoid(
      canvas,
      bodyCenter,
      scale * 0.72 * sxz,
      scale * 0.62 * sy,
      furColor,
    );

    // Belly patch
    _drawClayEllipsoid(
      canvas,
      Offset(bodyCenter.dx, bodyCenter.dy + scale * 0.05),
      scale * 0.44 * sxz,
      scale * 0.42 * sy,
      const Color(0xFFFFF7F0),
    );

    // Paws (left & right)
    final pawY = bodyCenter.dy + scale * 0.48 * sy;
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx - scale * 0.38 * sxz, pawY), scale * 0.16, scale * 0.13, const Color(0xFFFFFFFF));
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx + scale * 0.38 * sxz, pawY), scale * 0.16, scale * 0.13, const Color(0xFFFFFFFF));

    // Head
    final headRadiusX = scale * 0.62 * sxz;
    final headRadiusY = scale * 0.52 * sy;
    _drawClayEllipsoid(canvas, headCenter, headRadiusX, headRadiusY, furColor);

    // Calico Spot over left ear/eye
    _drawCalicoPatch(canvas, headCenter, scale, patchColor);

    // Ears (Cat triangular pointed ears with 3D bevel)
    _renderCatEar(canvas, headCenter, scale, isLeft: true, baseColor: furColor, innerColor: earInner);
    _renderCatEar(canvas, headCenter, scale, isLeft: false, baseColor: patchColor, innerColor: earInner);

    // Face (Eyes, Nose, Cheeks, Whiskers, Mouth)
    _renderFaceDetails(canvas, headCenter, scale);
  }

  // -------------------------------------------------------------
  // 2. SHIBA INU RENDERING (Hachi - Golden Shiba with Urajiro)
  // -------------------------------------------------------------
  void _renderShiba(Canvas canvas, Offset center, double scale, double sxz, double sy) {
    const shibaGold = Color(0xFFE58835); // Shiba Orange Gold
    const urajiroWhite = Color(0xFFFFF6ED); // White muzzle/chest

    final headCenter = Offset(
      center.dx + lookAtOffset.dx * 16 + math.sin(yaw) * 12,
      center.dy - scale * 0.26 * sy + lookAtOffset.dy * 8,
    );

    // Shiba Curled Tail
    _renderShibaTail(canvas, center, scale, shibaGold);

    // Body
    final bodyCenter = Offset(center.dx, center.dy + scale * 0.24 * sy);
    _drawClayEllipsoid(canvas, bodyCenter, scale * 0.74 * sxz, scale * 0.64 * sy, shibaGold);
    // Urajiro White Chest
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx, bodyCenter.dy + scale * 0.06), scale * 0.48 * sxz, scale * 0.45 * sy, urajiroWhite);

    // Paws
    final pawY = bodyCenter.dy + scale * 0.50 * sy;
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx - scale * 0.40 * sxz, pawY), scale * 0.18, scale * 0.14, urajiroWhite);
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx + scale * 0.40 * sxz, pawY), scale * 0.18, scale * 0.14, urajiroWhite);

    // Head
    _drawClayEllipsoid(canvas, headCenter, scale * 0.64 * sxz, scale * 0.54 * sy, shibaGold);
    // White muzzle (Snout)
    _drawClayEllipsoid(canvas, Offset(headCenter.dx, headCenter.dy + scale * 0.14), scale * 0.38, scale * 0.26, urajiroWhite);

    // White Eyebrow Dots ("Maro")
    _drawClayEllipsoid(canvas, Offset(headCenter.dx - scale * 0.22, headCenter.dy - scale * 0.22), scale * 0.08, scale * 0.06, urajiroWhite);
    _drawClayEllipsoid(canvas, Offset(headCenter.dx + scale * 0.22, headCenter.dy - scale * 0.22), scale * 0.08, scale * 0.06, urajiroWhite);

    // Shiba Pointed Ears
    _renderCatEar(canvas, headCenter, scale, isLeft: true, baseColor: shibaGold, innerColor: const Color(0xFFFEE7CE));
    _renderCatEar(canvas, headCenter, scale, isLeft: false, baseColor: shibaGold, innerColor: const Color(0xFFFEE7CE));

    _renderFaceDetails(canvas, headCenter, scale, hasTongue: true);
  }

  // -------------------------------------------------------------
  // 3. BEAR RENDERING (Barnaby - Fluffy Teddy Bear)
  // -------------------------------------------------------------
  void _renderBear(Canvas canvas, Offset center, double scale, double sxz, double sy) {
    const bearBrown = Color(0xFFA6683E); // Teddy Bear Brown
    const muzzleCream = Color(0xFFEED5B8);

    final headCenter = Offset(
      center.dx + lookAtOffset.dx * 14 + math.sin(yaw) * 10,
      center.dy - scale * 0.26 * sy + lookAtOffset.dy * 8,
    );

    // Body
    final bodyCenter = Offset(center.dx, center.dy + scale * 0.26 * sy);
    _drawClayEllipsoid(canvas, bodyCenter, scale * 0.80 * sxz, scale * 0.68 * sy, bearBrown);
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx, bodyCenter.dy + scale * 0.06), scale * 0.50 * sxz, scale * 0.44 * sy, muzzleCream);

    // Paws
    final pawY = bodyCenter.dy + scale * 0.52 * sy;
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx - scale * 0.42 * sxz, pawY), scale * 0.20, scale * 0.16, bearBrown);
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx + scale * 0.42 * sxz, pawY), scale * 0.20, scale * 0.16, bearBrown);

    // Head
    _drawClayEllipsoid(canvas, headCenter, scale * 0.68 * sxz, scale * 0.56 * sy, bearBrown);

    // Bear Round Ears
    _renderBearEar(canvas, headCenter, scale, isLeft: true, baseColor: bearBrown, innerColor: muzzleCream);
    _renderBearEar(canvas, headCenter, scale, isLeft: false, baseColor: bearBrown, innerColor: muzzleCream);

    // Snout
    _drawClayEllipsoid(canvas, Offset(headCenter.dx, headCenter.dy + scale * 0.12), scale * 0.36, scale * 0.26, muzzleCream);

    _renderFaceDetails(canvas, headCenter, scale);
  }

  // -------------------------------------------------------------
  // 4. BUNNY RENDERING (Usagi - Soft Pastel Bunny with Long Ears)
  // -------------------------------------------------------------
  void _renderBunny(Canvas canvas, Offset center, double scale, double sxz, double sy) {
    const bunnyWhite = Color(0xFFFFF9F5);
    const pinkInner = Color(0xFFFFB6C1);

    final headCenter = Offset(
      center.dx + lookAtOffset.dx * 14 + math.sin(yaw) * 10,
      center.dy - scale * 0.24 * sy + lookAtOffset.dy * 8,
    );

    // Fluffy round bunny tail
    final tailY = center.dy + scale * 0.38;
    _drawClayEllipsoid(canvas, Offset(center.dx - scale * 0.48, tailY), scale * 0.18, scale * 0.18, Colors.white);

    // Body
    final bodyCenter = Offset(center.dx, center.dy + scale * 0.26 * sy);
    _drawClayEllipsoid(canvas, bodyCenter, scale * 0.72 * sxz, scale * 0.64 * sy, bunnyWhite);

    // Paws
    final pawY = bodyCenter.dy + scale * 0.50 * sy;
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx - scale * 0.34 * sxz, pawY), scale * 0.16, scale * 0.14, bunnyWhite);
    _drawClayEllipsoid(canvas, Offset(bodyCenter.dx + scale * 0.34 * sxz, pawY), scale * 0.16, scale * 0.14, bunnyWhite);

    // Long Floppy Bunny Ears with spring sway
    _renderBunnyEar(canvas, headCenter, scale, isLeft: true, baseColor: bunnyWhite, innerColor: pinkInner);
    _renderBunnyEar(canvas, headCenter, scale, isLeft: false, baseColor: bunnyWhite, innerColor: pinkInner);

    // Head
    _drawClayEllipsoid(canvas, headCenter, scale * 0.62 * sxz, scale * 0.52 * sy, bunnyWhite);

    _renderFaceDetails(canvas, headCenter, scale, isBunny: true);
  }

  // -------------------------------------------------------------
  // HELPER 3D PRIMITIVE PAINTERS
  // -------------------------------------------------------------
  void _drawClayEllipsoid(Canvas canvas, Offset center, double rx, double ry, Color color) {
    final paint = ClayLighting.createClayPaint(
      screenCenter: center,
      screenRadiusX: rx,
      screenRadiusY: ry,
      baseColor: color,
      normal: const Vec3(0, 0, 1),
    );
    canvas.drawOval(Rect.fromCenter(center: center, width: rx * 2, height: ry * 2), paint);
  }

  void _renderCatEar(Canvas canvas, Offset headCenter, double scale, {
    required bool isLeft,
    required Color baseColor,
    required Color innerColor,
  }) {
    final dir = isLeft ? -1.0 : 1.0;
    final earSway = math.sin(animationTime * 4.0 + (isLeft ? 0 : 1)) * 0.05;
    final earTip = Offset(
      headCenter.dx + dir * scale * 0.44 + earSway * scale,
      headCenter.dy - scale * 0.58,
    );
    final earBase1 = Offset(headCenter.dx + dir * scale * 0.16, headCenter.dy - scale * 0.32);
    final earBase2 = Offset(headCenter.dx + dir * scale * 0.55, headCenter.dy - scale * 0.20);

    final path = Path()
      ..moveTo(earBase1.dx, earBase1.dy)
      ..quadraticBezierTo(earTip.dx, earTip.dy, earTip.dx, earTip.dy)
      ..lineTo(earBase2.dx, earBase2.dy)
      ..close();

    final paint = ClayLighting.createClayPaint(
      screenCenter: earTip,
      screenRadiusX: scale * 0.22,
      screenRadiusY: scale * 0.25,
      baseColor: baseColor,
      normal: const Vec3(0, 0.5, 0.8),
    );
    canvas.drawPath(path, paint);

    // Inner pink hollow
    final innerTip = Offset(earTip.dx - dir * 4, earTip.dy + 8);
    final innerPath = Path()
      ..moveTo(earBase1.dx + dir * 6, earBase1.dy - 2)
      ..lineTo(innerTip.dx, innerTip.dy)
      ..lineTo(earBase2.dx - dir * 4, earBase2.dy - 4)
      ..close();
    canvas.drawPath(innerPath, Paint()..color = innerColor);
  }

  void _renderBearEar(Canvas canvas, Offset headCenter, double scale, {
    required bool isLeft,
    required Color baseColor,
    required Color innerColor,
  }) {
    final dir = isLeft ? -1.0 : 1.0;
    final earCenter = Offset(
      headCenter.dx + dir * scale * 0.48,
      headCenter.dy - scale * 0.45,
    );
    _drawClayEllipsoid(canvas, earCenter, scale * 0.22, scale * 0.20, baseColor);
    _drawClayEllipsoid(canvas, earCenter, scale * 0.12, scale * 0.11, innerColor);
  }

  void _renderBunnyEar(Canvas canvas, Offset headCenter, double scale, {
    required bool isLeft,
    required Color baseColor,
    required Color innerColor,
  }) {
    final dir = isLeft ? -1.0 : 1.0;
    final sway = math.sin(animationTime * 3.0 + (isLeft ? 0 : 0.8)) * 0.12;
    final earCenter = Offset(
      headCenter.dx + dir * scale * 0.32 + sway * scale,
      headCenter.dy - scale * 0.68,
    );
    _drawClayEllipsoid(canvas, earCenter, scale * 0.18, scale * 0.46, baseColor);
    _drawClayEllipsoid(canvas, earCenter, scale * 0.10, scale * 0.34, innerColor);
  }

  void _renderTail(Canvas canvas, Offset center, double scale, Color color, {bool isCat = true}) {
    final tailSway = math.sin(animationTime * 4.5) * 18.0;
    final tailPath = Path()
      ..moveTo(center.dx - scale * 0.35, center.dy + scale * 0.40)
      ..cubicTo(
        center.dx - scale * 0.70 + tailSway,
        center.dy + scale * 0.20,
        center.dx - scale * 0.60 + tailSway * 1.5,
        center.dy - scale * 0.10,
        center.dx - scale * 0.45 + tailSway,
        center.dy - scale * 0.25,
      );

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = scale * 0.14
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(tailPath, paint);
  }

  void _renderShibaTail(Canvas canvas, Offset center, double scale, Color color) {
    final tailCenter = Offset(center.dx - scale * 0.50, center.dy + scale * 0.15);
    _drawClayEllipsoid(canvas, tailCenter, scale * 0.22, scale * 0.20, color);
    _drawClayEllipsoid(canvas, Offset(tailCenter.dx + 6, tailCenter.dy - 8), scale * 0.14, scale * 0.13, const Color(0xFFFFF6ED));
  }

  void _drawCalicoPatch(Canvas canvas, Offset headCenter, double scale, Color color) {
    final patchCenter = Offset(headCenter.dx - scale * 0.28, headCenter.dy - scale * 0.16);
    _drawClayEllipsoid(canvas, patchCenter, scale * 0.28, scale * 0.24, color);
  }

  // -------------------------------------------------------------
  // FACE DETAILS (Pupils, Eye tracking, Cheeks, Mouth, Whiskers)
  // -------------------------------------------------------------
  void _renderFaceDetails(Canvas canvas, Offset headCenter, double scale, {
    bool hasTongue = false,
    bool isBunny = false,
  }) {
    final eyeDistance = scale * 0.25;
    final eyeY = headCenter.dy - scale * 0.02;

    // Eye tracking touch position
    final pupilLookX = (lookAtOffset.dx * 3.5).clamp(-4.0, 4.0);
    final pupilLookY = (lookAtOffset.dy * 3.0).clamp(-3.0, 3.0);

    // Left and Right eye centers
    final leftEye = Offset(headCenter.dx - eyeDistance, eyeY);
    final rightEye = Offset(headCenter.dx + eyeDistance, eyeY);

    if (pet.isSleeping || blinkValue > 0.6) {
      // Sleeping / Happy closed eyes (^ . ^)
      _drawClosedEye(canvas, leftEye, scale * 0.12);
      _drawClosedEye(canvas, rightEye, scale * 0.12);
    } else {
      // 3D Shiny Glossy Eyes
      _drawOpenEye(canvas, leftEye, scale * 0.09, pupilLookX, pupilLookY);
      _drawOpenEye(canvas, rightEye, scale * 0.09, pupilLookX, pupilLookY);
    }

    // Rosy Blush Cheeks
    final cheekY = eyeY + scale * 0.13;
    final cheekPaint = Paint()
      ..color = const Color(0x66FF8A9B)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawCircle(Offset(headCenter.dx - eyeDistance * 1.35, cheekY), scale * 0.12, cheekPaint);
    canvas.drawCircle(Offset(headCenter.dx + eyeDistance * 1.35, cheekY), scale * 0.12, cheekPaint);

    // Nose (Tiny cute triangle or oval)
    final noseCenter = Offset(headCenter.dx, eyeY + scale * 0.10);
    final nosePaint = Paint()..color = const Color(0xFF4A2810);
    canvas.drawOval(
      Rect.fromCenter(center: noseCenter, width: scale * 0.09, height: scale * 0.07),
      nosePaint,
    );

    // Mouth / Eating / Tongue
    final mouthY = noseCenter.dy + scale * 0.06;
    if (pet.action == PetAction.eating) {
      final chewOpen = (math.sin(animationTime * 14.0).abs() * 0.14) * scale;
      final mouthRect = Rect.fromCenter(
        center: Offset(headCenter.dx, mouthY + chewOpen * 0.5),
        width: scale * 0.16,
        height: chewOpen + 4,
      );
      canvas.drawOval(mouthRect, Paint()..color = const Color(0xFF8B2635));
      // Little tooth
      canvas.drawCircle(Offset(headCenter.dx, mouthRect.top + 3), 3, Paint()..color = Colors.white);
    } else if (hasTongue && !pet.isSleeping) {
      // Shiba happy panting pink tongue
      final tonguePaint = Paint()..color = const Color(0xFFFF7A8A);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(headCenter.dx - scale * 0.06, mouthY, scale * 0.12, scale * 0.15),
          const Radius.circular(8),
        ),
        tonguePaint,
      );
    } else {
      // Cute curvy mouth (w)
      _drawCurvyMouth(canvas, headCenter.dx, mouthY, scale * 0.08);
    }

    // Whiskers (if Cat)
    if (pet.species == PetSpecies.cat) {
      _drawWhiskers(canvas, headCenter, scale);
    }
  }

  void _drawOpenEye(Canvas canvas, Offset center, double radius, double lookX, double lookY) {
    // Sclera / Base
    canvas.drawCircle(center, radius, Paint()..color = const Color(0xFF26180D));
    // Pupil highlight
    final highlightPos = Offset(center.dx - radius * 0.35 + lookX * 0.5, center.dy - radius * 0.35 + lookY * 0.5);
    canvas.drawCircle(highlightPos, radius * 0.38, Paint()..color = Colors.white);
    // Secondary micro-sparkle
    canvas.drawCircle(Offset(center.dx + radius * 0.35, center.dy + radius * 0.35), radius * 0.18, Paint()..color = Colors.white);
  }

  void _drawClosedEye(Canvas canvas, Offset center, double width) {
    final path = Path()
      ..moveTo(center.dx - width, center.dy)
      ..quadraticBezierTo(center.dx, center.dy - width * 0.6, center.dx + width, center.dy);
    canvas.drawPath(
      path,
      Paint()
        ..color = const Color(0xFF381F0E)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round,
    );
  }

  void _drawCurvyMouth(Canvas canvas, double cx, double cy, double r) {
    final mouthPaint = Paint()
      ..color = const Color(0xFF4A2810)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;

    final leftArc = Path()
      ..moveTo(cx, cy)
      ..quadraticBezierTo(cx - r * 0.5, cy + r * 0.7, cx - r, cy + r * 0.2);
    final rightArc = Path()
      ..moveTo(cx, cy)
      ..quadraticBezierTo(cx + r * 0.5, cy + r * 0.7, cx + r, cy + r * 0.2);

    canvas.drawPath(leftArc, mouthPaint);
    canvas.drawPath(rightArc, mouthPaint);
  }

  void _drawWhiskers(Canvas canvas, Offset headCenter, double scale) {
    final whiskerPaint = Paint()
      ..color = const Color(0x664A2810)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final wy = headCenter.dy + scale * 0.08;
    // Left whiskers
    canvas.drawLine(Offset(headCenter.dx - scale * 0.30, wy - 4), Offset(headCenter.dx - scale * 0.58, wy - 10), whiskerPaint);
    canvas.drawLine(Offset(headCenter.dx - scale * 0.30, wy + 4), Offset(headCenter.dx - scale * 0.56, wy + 8), whiskerPaint);
    // Right whiskers
    canvas.drawLine(Offset(headCenter.dx + scale * 0.30, wy - 4), Offset(headCenter.dx + scale * 0.58, wy - 10), whiskerPaint);
    canvas.drawLine(Offset(headCenter.dx + scale * 0.30, wy + 4), Offset(headCenter.dx + scale * 0.56, wy + 8), whiskerPaint);
  }

  // -------------------------------------------------------------
  // OUTFITS & ACCESSORIES (3D Models)
  // -------------------------------------------------------------
  void _renderOutfit(Canvas canvas, Offset center, double scale, double sxz, double sy) {
    switch (pet.outfit) {
      case PetOutfit.none:
        break;
      case PetOutfit.partyHat:
        _drawPartyHat(canvas, center, scale, sy);
        break;
      case PetOutfit.bowTie:
        _drawBowTie(canvas, center, scale, sy);
        break;
      case PetOutfit.nightCap:
        _drawNightCap(canvas, center, scale, sy);
        break;
      case PetOutfit.aviatorGoggles:
        _drawGoggles(canvas, center, scale, sy);
        break;
      case PetOutfit.flowerCrown:
        _drawFlowerCrown(canvas, center, scale, sy);
        break;
      default:
        // Other kawaii outfits rendered in 2D vector mode
        break;
    }
  }

  void _drawPartyHat(Canvas canvas, Offset center, double scale, double sy) {
    final hatBase = Offset(center.dx, center.dy - scale * 0.74 * sy);
    final hatTip = Offset(center.dx + 4, center.dy - scale * 1.15 * sy);

    final path = Path()
      ..moveTo(hatBase.dx - scale * 0.22, hatBase.dy)
      ..lineTo(hatTip.dx, hatTip.dy)
      ..lineTo(hatBase.dx + scale * 0.22, hatBase.dy)
      ..close();

    canvas.drawPath(path, Paint()..color = const Color(0xFFFF5252));
    // Yellow stripes
    final stripePaint = Paint()..color = const Color(0xFFFFD700)..strokeWidth = 5;
    canvas.drawLine(Offset(hatBase.dx - scale * 0.12, hatBase.dy - scale * 0.12), Offset(hatBase.dx + scale * 0.12, hatBase.dy - scale * 0.12), stripePaint);

    // Pom pom on tip
    canvas.drawCircle(hatTip, scale * 0.08, Paint()..color = Colors.white);
  }

  void _drawBowTie(Canvas canvas, Offset center, double scale, double sy) {
    final bowCenter = Offset(center.dx, center.dy + scale * 0.08 * sy);
    final leftWing = Path()
      ..moveTo(bowCenter.dx, bowCenter.dy)
      ..lineTo(bowCenter.dx - scale * 0.18, bowCenter.dy - scale * 0.10)
      ..lineTo(bowCenter.dx - scale * 0.18, bowCenter.dy + scale * 0.10)
      ..close();
    final rightWing = Path()
      ..moveTo(bowCenter.dx, bowCenter.dy)
      ..lineTo(bowCenter.dx + scale * 0.18, bowCenter.dy - scale * 0.10)
      ..lineTo(bowCenter.dx + scale * 0.18, bowCenter.dy + scale * 0.10)
      ..close();

    final bowPaint = Paint()..color = const Color(0xFFFF4081);
    canvas.drawPath(leftWing, bowPaint);
    canvas.drawPath(rightWing, bowPaint);
    canvas.drawCircle(bowCenter, scale * 0.06, Paint()..color = const Color(0xFFD81B60));
  }

  void _drawNightCap(Canvas canvas, Offset center, double scale, double sy) {
    final capBase = Offset(center.dx, center.dy - scale * 0.70 * sy);
    final path = Path()
      ..moveTo(capBase.dx - scale * 0.35, capBase.dy)
      ..cubicTo(
        capBase.dx, capBase.dy - scale * 0.30,
        capBase.dx + scale * 0.40, capBase.dy - scale * 0.35,
        capBase.dx + scale * 0.55, capBase.dy + scale * 0.10,
      )
      ..lineTo(capBase.dx + scale * 0.35, capBase.dy)
      ..close();

    canvas.drawPath(path, Paint()..color = const Color(0xFF3F51B5));
    // Star on cap
    canvas.drawCircle(Offset(capBase.dx + scale * 0.10, capBase.dy - scale * 0.12), 4, Paint()..color = const Color(0xFFFFD54F));
    // Pom pom
    canvas.drawCircle(Offset(capBase.dx + scale * 0.55, capBase.dy + scale * 0.10), scale * 0.10, Paint()..color = Colors.white);
  }

  void _drawGoggles(Canvas canvas, Offset center, double scale, double sy) {
    final goggleY = center.dy - scale * 0.50 * sy;
    final rimPaint = Paint()..color = const Color(0xFFD4AF37)..style = PaintingStyle.stroke..strokeWidth = 4;
    final glassPaint = Paint()..color = const Color(0x9981D4FA);

    canvas.drawCircle(Offset(center.dx - scale * 0.22, goggleY), scale * 0.14, glassPaint);
    canvas.drawCircle(Offset(center.dx - scale * 0.22, goggleY), scale * 0.14, rimPaint);

    canvas.drawCircle(Offset(center.dx + scale * 0.22, goggleY), scale * 0.14, glassPaint);
    canvas.drawCircle(Offset(center.dx + scale * 0.22, goggleY), scale * 0.14, rimPaint);

    // Bridge
    canvas.drawLine(Offset(center.dx - scale * 0.08, goggleY), Offset(center.dx + scale * 0.08, goggleY), rimPaint);
  }

  void _drawFlowerCrown(Canvas canvas, Offset center, double scale, double sy) {
    final crownY = center.dy - scale * 0.65 * sy;
    final colors = [Colors.pinkAccent, Colors.yellow, Colors.white, Colors.orangeAccent];
    for (int i = 0; i < 5; i++) {
      final fx = center.dx - scale * 0.32 + i * scale * 0.16;
      canvas.drawCircle(Offset(fx, crownY + math.sin(i * 1.2) * 5), scale * 0.07, Paint()..color = colors[i % colors.length]);
      canvas.drawCircle(Offset(fx, crownY + math.sin(i * 1.2) * 5), scale * 0.03, Paint()..color = Colors.amber);
    }
  }
}
