import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/pet_model.dart';

/// Professional Studio-Quality Kawaii Vector Art Engine
/// Matching the exact visual aesthetic, bold dark outlines (2.5px),
/// pastel fills, and chibi proportions of Widgetable pets!
class KawaiiPetPainter extends CustomPainter {
  final PetSpecies species;
  final PetAction action;
  final PetOutfit outfit;
  final double animationTime;
  final bool isSleeping;
  final double squish;
  final bool showStickerBorder;

  KawaiiPetPainter({
    required this.species,
    this.action = PetAction.idle,
    this.outfit = PetOutfit.none,
    this.animationTime = 0.0,
    this.isSleeping = false,
    this.squish = 0.0,
    this.showStickerBorder = false,
  });

  static const Color outlineColor = Color(0xFF261914); // Deep dark chocolate line
  static const double strokeW = 3.0; // Bold Widgetable outline weight

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 + 10);
    final scale = math.min(size.width, size.height) * 0.44;

    // Organic idle breathe & bounce
    final breathe = isSleeping
        ? math.sin(animationTime * 2.2) * 0.03
        : math.sin(animationTime * 4.0) * 0.02;

    // Squish matrix
    final sy = (1.0 - squish * 0.22 + breathe);
    final sxz = (1.0 + squish * 0.14 - breathe * 0.4);

    // Dynamic ground contact shadow
    _drawContactShadow(canvas, center, scale, sxz);

    // Save canvas for transform
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(sxz, sy);

    switch (species) {
      case PetSpecies.cat:
        _drawCat(canvas, scale);
        break;
      case PetSpecies.shiba:
        _drawShiba(canvas, scale);
        break;
      case PetSpecies.bear:
        _drawBear(canvas, scale);
        break;
      case PetSpecies.bunny:
        _drawBunny(canvas, scale);
    }

    _drawOutfit(canvas, scale);

    canvas.restore();
  }

  void _drawContactShadow(Canvas canvas, Offset center, double scale, double sxz) {
    final shadowPaint = Paint()
      ..color = const Color(0x24261914)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(center.dx, center.dy + scale * 0.88),
        width: scale * 1.25 * sxz,
        height: scale * 0.32,
      ),
      shadowPaint,
    );
  }

  // -------------------------------------------------------------
  // 1. WIDGETABLE CAT (Mochi - White & Peach Kawaii Kitten)
  // -------------------------------------------------------------
  void _drawCat(Canvas canvas, double scale) {
    const furWhite = Color(0xFFFFFFFF);
    const patchPeach = Color(0xFFFFB5A7);
    const pinkEar = Color(0xFFFF85A1);
    const collarRed = Color(0xFFFF4D6D);

    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Tail (wagging back and forth)
    final tailWag = math.sin(animationTime * 5.0) * 12.0;
    final tailPath = Path()
      ..moveTo(-scale * 0.35, scale * 0.35)
      ..cubicTo(
        -scale * 0.75 + tailWag, scale * 0.20,
        -scale * 0.65 + tailWag * 1.5, -scale * 0.15,
        -scale * 0.45 + tailWag, -scale * 0.30,
      );
    canvas.drawPath(tailPath, linePaint..strokeWidth = scale * 0.14);
    canvas.drawPath(tailPath, Paint()..color = furWhite..style = PaintingStyle.stroke..strokeWidth = scale * 0.14 - 5);
    linePaint.strokeWidth = strokeW;

    // Body (Round chubby bean)
    final bodyRect = Rect.fromCenter(
      center: Offset(0, scale * 0.30),
      width: scale * 0.86,
      height: scale * 0.74,
    );
    canvas.drawOval(bodyRect, fillPaint..color = furWhite);
    canvas.drawOval(bodyRect, linePaint);

    // Paws (left & right feet)
    final leftPaw = Rect.fromCenter(center: Offset(-scale * 0.28, scale * 0.62), width: scale * 0.26, height: scale * 0.18);
    final rightPaw = Rect.fromCenter(center: Offset(scale * 0.28, scale * 0.62), width: scale * 0.26, height: scale * 0.18);
    canvas.drawOval(leftPaw, fillPaint..color = furWhite);
    canvas.drawOval(leftPaw, linePaint);
    canvas.drawOval(rightPaw, fillPaint..color = furWhite);
    canvas.drawOval(rightPaw, linePaint);

    // Collar ribbon with bell
    final collarPath = Path()
      ..moveTo(-scale * 0.30, scale * 0.05)
      ..quadraticBezierTo(0, scale * 0.16, scale * 0.30, scale * 0.05)
      ..quadraticBezierTo(0, scale * 0.24, -scale * 0.30, scale * 0.05);
    canvas.drawPath(collarPath, fillPaint..color = collarRed);
    canvas.drawPath(collarPath, linePaint);
    // Golden bell
    canvas.drawCircle(Offset(0, scale * 0.14), scale * 0.07, fillPaint..color = const Color(0xFFFFD166));
    canvas.drawCircle(Offset(0, scale * 0.14), scale * 0.07, linePaint);

    // Head (Large rounded chibi head)
    final headRect = Rect.fromCenter(
      center: Offset(0, -scale * 0.20),
      width: scale * 1.05,
      height: scale * 0.82,
    );

    // Ears (Pointed cat ears with inner pink)
    _drawCatEar(canvas, scale, -1.0, furWhite, pinkEar, linePaint, fillPaint);
    _drawCatEar(canvas, scale, 1.0, patchPeach, pinkEar, linePaint, fillPaint);

    // Head base
    canvas.drawOval(headRect, fillPaint..color = furWhite);

    // Peach Calico Spot on right forehead
    final patchPath = Path()
      ..moveTo(scale * 0.10, -scale * 0.50)
      ..quadraticBezierTo(scale * 0.50, -scale * 0.45, scale * 0.48, -scale * 0.15)
      ..quadraticBezierTo(scale * 0.25, -scale * 0.22, scale * 0.10, -scale * 0.50);
    canvas.drawPath(patchPath, fillPaint..color = patchPeach);

    // Head outline
    canvas.drawOval(headRect, linePaint);

    // Face Details
    _drawFaceDetails(canvas, scale, Offset(0, -scale * 0.20), hasWhiskers: true);
  }

  void _drawCatEar(Canvas canvas, double scale, double dir, Color bg, Color inner, Paint line, Paint fill) {
    final tip = Offset(dir * scale * 0.44, -scale * 0.65);
    final b1 = Offset(dir * scale * 0.18, -scale * 0.42);
    final b2 = Offset(dir * scale * 0.52, -scale * 0.24);

    final path = Path()
      ..moveTo(b1.dx, b1.dy)
      ..lineTo(tip.dx, tip.dy)
      ..lineTo(b2.dx, b2.dy)
      ..close();

    canvas.drawPath(path, fill..color = bg);
    canvas.drawPath(path, line);

    // Inner pink triangle
    final innerPath = Path()
      ..moveTo(b1.dx + dir * 6, b1.dy - 2)
      ..lineTo(tip.dx - dir * 4, tip.dy + 10)
      ..lineTo(b2.dx - dir * 6, b2.dy - 4)
      ..close();
    canvas.drawPath(innerPath, fill..color = inner);
  }

  // -------------------------------------------------------------
  // 2. WIDGETABLE SHIBA INU (Hachi - Golden Shiba with Sailor Cap)
  // -------------------------------------------------------------
  void _drawShiba(Canvas canvas, double scale) {
    const shibaGold = Color(0xFFF39C12);
    const urajiroWhite = Color(0xFFFFFDF8);
    const earInner = Color(0xFFFFD1A9);

    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Curled Tail
    final tailRect = Rect.fromCenter(center: Offset(-scale * 0.44, scale * 0.15), width: scale * 0.30, height: scale * 0.30);
    canvas.drawOval(tailRect, fillPaint..color = shibaGold);
    canvas.drawOval(tailRect, linePaint);
    canvas.drawCircle(Offset(-scale * 0.40, scale * 0.10), scale * 0.08, fillPaint..color = urajiroWhite);

    // Body
    final bodyRect = Rect.fromCenter(center: Offset(0, scale * 0.30), width: scale * 0.88, height: scale * 0.74);
    canvas.drawOval(bodyRect, fillPaint..color = shibaGold);
    // White chest patch
    final chestRect = Rect.fromCenter(center: Offset(0, scale * 0.32), width: scale * 0.56, height: scale * 0.55);
    canvas.drawOval(chestRect, fillPaint..color = urajiroWhite);
    canvas.drawOval(bodyRect, linePaint);

    // Paws
    final leftPaw = Rect.fromCenter(center: Offset(-scale * 0.28, scale * 0.62), width: scale * 0.26, height: scale * 0.18);
    final rightPaw = Rect.fromCenter(center: Offset(scale * 0.28, scale * 0.62), width: scale * 0.26, height: scale * 0.18);
    canvas.drawOval(leftPaw, fillPaint..color = urajiroWhite);
    canvas.drawOval(leftPaw, linePaint);
    canvas.drawOval(rightPaw, fillPaint..color = urajiroWhite);
    canvas.drawOval(rightPaw, linePaint);

    // Head
    final headRect = Rect.fromCenter(center: Offset(0, -scale * 0.20), width: scale * 1.08, height: scale * 0.84);

    // Shiba Pointed Triangular Ears
    _drawCatEar(canvas, scale, -1.0, shibaGold, earInner, linePaint, fillPaint);
    _drawCatEar(canvas, scale, 1.0, shibaGold, earInner, linePaint, fillPaint);

    // Head Fill & Outline
    canvas.drawOval(headRect, fillPaint..color = shibaGold);

    // White Urajiro Cheeks & Muzzle
    final whiteMuzzlePath = Path()
      ..moveTo(-scale * 0.42, -scale * 0.12)
      ..quadraticBezierTo(-scale * 0.20, -scale * 0.30, 0, -scale * 0.18)
      ..quadraticBezierTo(scale * 0.20, -scale * 0.30, scale * 0.42, -scale * 0.12)
      ..quadraticBezierTo(scale * 0.35, scale * 0.18, 0, scale * 0.20)
      ..quadraticBezierTo(-scale * 0.35, scale * 0.18, -scale * 0.42, -scale * 0.12);
    canvas.drawPath(whiteMuzzlePath, fillPaint..color = urajiroWhite);

    canvas.drawOval(headRect, linePaint);

    // Maro Eyebrow White Dots
    canvas.drawCircle(Offset(-scale * 0.24, -scale * 0.40), scale * 0.07, fillPaint..color = urajiroWhite);
    canvas.drawCircle(Offset(-scale * 0.24, -scale * 0.40), scale * 0.07, linePaint..strokeWidth = 2);
    canvas.drawCircle(Offset(scale * 0.24, -scale * 0.40), scale * 0.07, fillPaint..color = urajiroWhite);
    canvas.drawCircle(Offset(scale * 0.24, -scale * 0.40), scale * 0.07, linePaint..strokeWidth = 2);
    linePaint.strokeWidth = strokeW;

    _drawFaceDetails(canvas, scale, Offset(0, -scale * 0.20), hasTongue: true);
  }

  // -------------------------------------------------------------
  // 3. WIDGETABLE TEDDY BEAR (Barnaby - Honey Brown Bear)
  // -------------------------------------------------------------
  void _drawBear(Canvas canvas, double scale) {
    const bearBrown = Color(0xFFA06A42);
    const muzzleCream = Color(0xFFFDE8D0);

    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Body
    final bodyRect = Rect.fromCenter(center: Offset(0, scale * 0.32), width: scale * 0.92, height: scale * 0.78);
    canvas.drawOval(bodyRect, fillPaint..color = bearBrown);
    final bellyRect = Rect.fromCenter(center: Offset(0, scale * 0.34), width: scale * 0.58, height: scale * 0.54);
    canvas.drawOval(bellyRect, fillPaint..color = muzzleCream);
    canvas.drawOval(bodyRect, linePaint);

    // Paws
    final leftPaw = Rect.fromCenter(center: Offset(-scale * 0.32, scale * 0.64), width: scale * 0.28, height: scale * 0.20);
    final rightPaw = Rect.fromCenter(center: Offset(scale * 0.32, scale * 0.64), width: scale * 0.28, height: scale * 0.20);
    canvas.drawOval(leftPaw, fillPaint..color = bearBrown);
    canvas.drawOval(leftPaw, linePaint);
    canvas.drawOval(rightPaw, fillPaint..color = bearBrown);
    canvas.drawOval(rightPaw, linePaint);

    // Round Bear Ears
    final leftEar = Offset(-scale * 0.44, -scale * 0.48);
    final rightEar = Offset(scale * 0.44, -scale * 0.48);
    canvas.drawCircle(leftEar, scale * 0.22, fillPaint..color = bearBrown);
    canvas.drawCircle(leftEar, scale * 0.22, linePaint);
    canvas.drawCircle(leftEar, scale * 0.12, fillPaint..color = muzzleCream);

    canvas.drawCircle(rightEar, scale * 0.22, fillPaint..color = bearBrown);
    canvas.drawCircle(rightEar, scale * 0.22, linePaint);
    canvas.drawCircle(rightEar, scale * 0.12, fillPaint..color = muzzleCream);

    // Head
    final headRect = Rect.fromCenter(center: Offset(0, -scale * 0.20), width: scale * 1.10, height: scale * 0.86);
    canvas.drawOval(headRect, fillPaint..color = bearBrown);
    canvas.drawOval(headRect, linePaint);

    // Muzzle Oval
    final muzzleRect = Rect.fromCenter(center: Offset(0, -scale * 0.14), width: scale * 0.54, height: scale * 0.38);
    canvas.drawOval(muzzleRect, fillPaint..color = muzzleCream);
    canvas.drawOval(muzzleRect, linePaint);

    _drawFaceDetails(canvas, scale, Offset(0, -scale * 0.20));
  }

  // -------------------------------------------------------------
  // 4. WIDGETABLE BUNNY (Usagi - Soft Cream Bunny with Long Ears)
  // -------------------------------------------------------------
  void _drawBunny(Canvas canvas, double scale) {
    const bunnyWhite = Color(0xFFFFFBF7);
    const pinkInner = Color(0xFFFFB4C8);

    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Pofuduk Round Tail
    canvas.drawCircle(Offset(-scale * 0.44, scale * 0.42), scale * 0.18, fillPaint..color = bunnyWhite);
    canvas.drawCircle(Offset(-scale * 0.44, scale * 0.42), scale * 0.18, linePaint);

    // Body
    final bodyRect = Rect.fromCenter(center: Offset(0, scale * 0.30), width: scale * 0.86, height: scale * 0.74);
    canvas.drawOval(bodyRect, fillPaint..color = bunnyWhite);
    canvas.drawOval(bodyRect, linePaint);

    // Paws
    final leftPaw = Rect.fromCenter(center: Offset(-scale * 0.26, scale * 0.62), width: scale * 0.24, height: scale * 0.18);
    final rightPaw = Rect.fromCenter(center: Offset(scale * 0.26, scale * 0.62), width: scale * 0.24, height: scale * 0.18);
    canvas.drawOval(leftPaw, fillPaint..color = bunnyWhite);
    canvas.drawOval(leftPaw, linePaint);
    canvas.drawOval(rightPaw, fillPaint..color = bunnyWhite);
    canvas.drawOval(rightPaw, linePaint);

    // Long Floppy Ears
    _drawBunnyEar(canvas, scale, -1.0, bunnyWhite, pinkInner, linePaint, fillPaint);
    _drawBunnyEar(canvas, scale, 1.0, bunnyWhite, pinkInner, linePaint, fillPaint);

    // Head
    final headRect = Rect.fromCenter(center: Offset(0, -scale * 0.18), width: scale * 1.04, height: scale * 0.82);
    canvas.drawOval(headRect, fillPaint..color = bunnyWhite);
    canvas.drawOval(headRect, linePaint);

    _drawFaceDetails(canvas, scale, Offset(0, -scale * 0.18));
  }

  void _drawBunnyEar(Canvas canvas, double scale, double dir, Color bg, Color inner, Paint line, Paint fill) {
    final earSway = math.sin(animationTime * 4.0 + (dir > 0 ? 1 : 0)) * 6.0;
    final earRect = Rect.fromCenter(
      center: Offset(dir * scale * 0.28 + earSway, -scale * 0.68),
      width: scale * 0.28,
      height: scale * 0.65,
    );
    canvas.drawOval(earRect, fill..color = bg);
    canvas.drawOval(earRect, line);

    final innerRect = Rect.fromCenter(
      center: Offset(dir * scale * 0.28 + earSway, -scale * 0.68),
      width: scale * 0.16,
      height: scale * 0.48,
    );
    canvas.drawOval(innerRect, fill..color = inner);
  }

  // -------------------------------------------------------------
  // KAWAII FACIAL EXPRESSIONS (Eyes, Pupils, Blushing, Mouth)
  // -------------------------------------------------------------
  void _drawFaceDetails(Canvas canvas, double scale, Offset headCenter, {
    bool hasWhiskers = false,
    bool hasTongue = false,
  }) {
    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    final eyeDist = scale * 0.26;
    final eyeY = headCenter.dy + scale * 0.02;

    // Rosy Blushing Cheeks
    final cheekPaint = Paint()..color = const Color(0x66FF6B8B);
    canvas.drawOval(Rect.fromCenter(center: Offset(headCenter.dx - eyeDist * 1.35, eyeY + scale * 0.14), width: scale * 0.20, height: scale * 0.12), cheekPaint);
    canvas.drawOval(Rect.fromCenter(center: Offset(headCenter.dx + eyeDist * 1.35, eyeY + scale * 0.14), width: scale * 0.20, height: scale * 0.12), cheekPaint);

    if (isSleeping) {
      // Sleeping curved peaceful eyes: (^ . ^)
      _drawHappyArcEye(canvas, Offset(headCenter.dx - eyeDist, eyeY), scale * 0.12, linePaint);
      _drawHappyArcEye(canvas, Offset(headCenter.dx + eyeDist, eyeY), scale * 0.12, linePaint);
    } else if (action == PetAction.eating) {
      // Chewing happy squinting eyes: (> w <)
      _drawSquintEye(canvas, Offset(headCenter.dx - eyeDist, eyeY), scale * 0.10, isLeft: true, line: linePaint);
      _drawSquintEye(canvas, Offset(headCenter.dx + eyeDist, eyeY), scale * 0.10, isLeft: false, line: linePaint);
    } else {
      // Cute large glossy cartoon eyes with dual sparkle reflections
      _drawChibiEye(canvas, Offset(headCenter.dx - eyeDist, eyeY), scale * 0.10, fillPaint);
      _drawChibiEye(canvas, Offset(headCenter.dx + eyeDist, eyeY), scale * 0.10, fillPaint);
    }

    // Tiny Triangle Nose
    final noseY = eyeY + scale * 0.08;
    final nosePath = Path()
      ..moveTo(headCenter.dx, noseY + scale * 0.05)
      ..lineTo(headCenter.dx - scale * 0.05, noseY)
      ..lineTo(headCenter.dx + scale * 0.05, noseY)
      ..close();
    canvas.drawPath(nosePath, fillPaint..color = outlineColor);

    // Mouth
    final mouthY = noseY + scale * 0.06;
    if (action == PetAction.eating) {
      // Open mouth chewing with cute tooth
      final chewCycle = math.sin(animationTime * 14.0).abs() * scale * 0.14;
      final mouthRect = Rect.fromCenter(center: Offset(headCenter.dx, mouthY + chewCycle * 0.5), width: scale * 0.20, height: chewCycle + 6);
      canvas.drawOval(mouthRect, fillPaint..color = const Color(0xFFC0392B));
      canvas.drawOval(mouthRect, linePaint);
    } else if (hasTongue && !isSleeping) {
      // Happy panting tongue
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(headCenter.dx - scale * 0.07, mouthY, scale * 0.14, scale * 0.16),
          const Radius.circular(8),
        ),
        fillPaint..color = const Color(0xFFFF6584),
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(headCenter.dx - scale * 0.07, mouthY, scale * 0.14, scale * 0.16),
          const Radius.circular(8),
        ),
        linePaint..strokeWidth = 2,
      );
    } else {
      // Cute 'w' kitty/puppy smile
      final mouthW = scale * 0.09;
      final leftMouth = Path()
        ..moveTo(headCenter.dx, mouthY)
        ..quadraticBezierTo(headCenter.dx - mouthW * 0.5, mouthY + mouthW * 0.7, headCenter.dx - mouthW, mouthY + mouthW * 0.2);
      final rightMouth = Path()
        ..moveTo(headCenter.dx, mouthY)
        ..quadraticBezierTo(headCenter.dx + mouthW * 0.5, mouthY + mouthW * 0.7, headCenter.dx + mouthW, mouthY + mouthW * 0.2);
      canvas.drawPath(leftMouth, linePaint);
      canvas.drawPath(rightMouth, linePaint);
    }

    // Whiskers (if Cat)
    if (hasWhiskers) {
      final wy = headCenter.dy + scale * 0.06;
      canvas.drawLine(Offset(headCenter.dx - scale * 0.32, wy - 3), Offset(headCenter.dx - scale * 0.55, wy - 8), linePaint..strokeWidth = 2.2);
      canvas.drawLine(Offset(headCenter.dx - scale * 0.32, wy + 5), Offset(headCenter.dx - scale * 0.52, wy + 10), linePaint);
      canvas.drawLine(Offset(headCenter.dx + scale * 0.32, wy - 3), Offset(headCenter.dx + scale * 0.55, wy - 8), linePaint);
      canvas.drawLine(Offset(headCenter.dx + scale * 0.32, wy + 5), Offset(headCenter.dx + scale * 0.52, wy + 10), linePaint);
    }
  }

  void _drawChibiEye(Canvas canvas, Offset center, double radius, Paint fill) {
    // Solid dark pupil
    canvas.drawCircle(center, radius, fill..color = outlineColor);
    // Big top sparkle reflection
    canvas.drawCircle(Offset(center.dx - radius * 0.32, center.dy - radius * 0.32), radius * 0.40, fill..color = Colors.white);
    // Little bottom-right sparkle
    canvas.drawCircle(Offset(center.dx + radius * 0.35, center.dy + radius * 0.35), radius * 0.20, fill..color = Colors.white);
  }

  void _drawHappyArcEye(Canvas canvas, Offset center, double radius, Paint line) {
    final path = Path()
      ..moveTo(center.dx - radius, center.dy)
      ..quadraticBezierTo(center.dx, center.dy - radius * 0.8, center.dx + radius, center.dy);
    canvas.drawPath(path, line);
  }

  void _drawSquintEye(Canvas canvas, Offset center, double radius, {required bool isLeft, required Paint line}) {
    final dir = isLeft ? 1.0 : -1.0;
    final path = Path()
      ..moveTo(center.dx - dir * radius, center.dy - radius * 0.6)
      ..lineTo(center.dx + dir * radius, center.dy)
      ..lineTo(center.dx - dir * radius, center.dy + radius * 0.6);
    canvas.drawPath(path, line);
  }

  // -------------------------------------------------------------
  // OUTFITS & ACCESSORIES (Sailor Hat, Bow, Sleeping Cap, Goggles)
  // -------------------------------------------------------------
  void _drawOutfit(Canvas canvas, double scale) {
    final linePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    switch (outfit) {
      case PetOutfit.none:
        break;
      case PetOutfit.partyHat:
        // Red & Yellow Striped Party Cone
        final hatBase = Offset(0, -scale * 0.58);
        final hatTip = Offset(0, -scale * 1.05);
        final hatPath = Path()
          ..moveTo(hatBase.dx - scale * 0.24, hatBase.dy)
          ..lineTo(hatTip.dx, hatTip.dy)
          ..lineTo(hatBase.dx + scale * 0.24, hatBase.dy)
          ..close();
        canvas.drawPath(hatPath, fillPaint..color = const Color(0xFFFF5252));
        canvas.drawPath(hatPath, linePaint);
        // Yellow stripes
        canvas.drawLine(Offset(-scale * 0.12, hatBase.dy - scale * 0.18), Offset(scale * 0.12, hatBase.dy - scale * 0.18), linePaint..color = const Color(0xFFFFD166)..strokeWidth = 6);
        // Pom-pom on top
        canvas.drawCircle(hatTip, scale * 0.09, fillPaint..color = Colors.white);
        canvas.drawCircle(hatTip, scale * 0.09, linePaint..color = outlineColor..strokeWidth = strokeW);
        break;

      case PetOutfit.bowTie:
        // Cute Ribbon Bow Tie on Chest
        final bowCenter = Offset(0, scale * 0.12);
        final leftWing = Path()
          ..moveTo(bowCenter.dx, bowCenter.dy)
          ..lineTo(bowCenter.dx - scale * 0.22, bowCenter.dy - scale * 0.12)
          ..lineTo(bowCenter.dx - scale * 0.22, bowCenter.dy + scale * 0.12)
          ..close();
        final rightWing = Path()
          ..moveTo(bowCenter.dx, bowCenter.dy)
          ..lineTo(bowCenter.dx + scale * 0.22, bowCenter.dy - scale * 0.12)
          ..lineTo(bowCenter.dx + scale * 0.22, bowCenter.dy + scale * 0.12)
          ..close();
        canvas.drawPath(leftWing, fillPaint..color = const Color(0xFFFF4D6D));
        canvas.drawPath(leftWing, linePaint);
        canvas.drawPath(rightWing, fillPaint..color = const Color(0xFFFF4D6D));
        canvas.drawPath(rightWing, linePaint);
        canvas.drawCircle(bowCenter, scale * 0.08, fillPaint..color = const Color(0xFFC9184A));
        canvas.drawCircle(bowCenter, scale * 0.08, linePaint);
        break;

      case PetOutfit.nightCap:
        // Cozy Droopy Nightcap with golden star
        final capBase = Offset(0, -scale * 0.54);
        final capPath = Path()
          ..moveTo(capBase.dx - scale * 0.36, capBase.dy)
          ..cubicTo(
            capBase.dx, capBase.dy - scale * 0.35,
            capBase.dx + scale * 0.45, capBase.dy - scale * 0.40,
            capBase.dx + scale * 0.62, capBase.dy + scale * 0.10,
          )
          ..lineTo(capBase.dx + scale * 0.36, capBase.dy)
          ..close();
        canvas.drawPath(capPath, fillPaint..color = const Color(0xFF3A5A98));
        canvas.drawPath(capPath, linePaint);
        // Fluffy pom-pom on tip
        canvas.drawCircle(Offset(capBase.dx + scale * 0.62, capBase.dy + scale * 0.10), scale * 0.12, fillPaint..color = Colors.white);
        canvas.drawCircle(Offset(capBase.dx + scale * 0.62, capBase.dy + scale * 0.10), scale * 0.12, linePaint);
        break;

      case PetOutfit.aviatorGoggles:
        // Retro Aviator Goggles on Forehead
        final goggleY = -scale * 0.38;
        final leftGoggle = Rect.fromCenter(center: Offset(-scale * 0.24, goggleY), width: scale * 0.28, height: scale * 0.28);
        final rightGoggle = Rect.fromCenter(center: Offset(scale * 0.24, goggleY), width: scale * 0.28, height: scale * 0.28);
        canvas.drawOval(leftGoggle, fillPaint..color = const Color(0xFF81D4FA));
        canvas.drawOval(leftGoggle, linePaint..strokeWidth = 4);
        canvas.drawOval(rightGoggle, fillPaint..color = const Color(0xFF81D4FA));
        canvas.drawOval(rightGoggle, linePaint..strokeWidth = 4);
        // Bridge
        canvas.drawLine(Offset(-scale * 0.10, goggleY), Offset(scale * 0.10, goggleY), linePaint..strokeWidth = 4);
        break;

      case PetOutfit.flowerCrown:
        // Flower Wreath
        final crownY = -scale * 0.52;
        final colors = [Colors.pinkAccent, Colors.yellow, Colors.white, Colors.orangeAccent];
        for (int i = 0; i < 5; i++) {
          final fx = -scale * 0.32 + i * scale * 0.16;
          canvas.drawCircle(Offset(fx, crownY + math.sin(i * 1.2) * 5), scale * 0.08, fillPaint..color = colors[i % colors.length]);
          canvas.drawCircle(Offset(fx, crownY + math.sin(i * 1.2) * 5), scale * 0.08, linePaint..strokeWidth = 2);
          canvas.drawCircle(Offset(fx, crownY + math.sin(i * 1.2) * 5), scale * 0.03, fillPaint..color = Colors.amber);
        }
        break;
    }
  }

  @override
  bool shouldRepaint(covariant KawaiiPetPainter oldDelegate) => true;
}
