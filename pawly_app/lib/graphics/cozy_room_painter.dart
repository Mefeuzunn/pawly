import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/pet_model.dart';

enum RoomWeather { sunny, rainy, snowy, starryNight }

/// Professional Painter rendering the exact "kitty's home" aesthetic from Widgetable
/// with dynamic weather and atmospheric room lighting!
class CozyRoomPainter extends CustomPainter {
  final PetRoom room;
  final bool isNight;
  final double animationTime;
  final RoomWeather weather;

  CozyRoomPainter({
    required this.room,
    this.isNight = false,
    this.animationTime = 0.0,
    this.weather = RoomWeather.sunny,
  });

  static const Color outline = Color(0xFF382319);
  static const double strokeW = 2.4;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Wall and Floor
    _drawWallAndFloor(canvas, w, h);

    // 2. Weather Window in Background (applicable to all rooms)
    _drawWeatherWindow(canvas, w, h);

    // 3. Room specific interior furnishings
    switch (room) {
      case PetRoom.kitchen:
        _drawDiningRoomInterior(canvas, w, h);
        break;
      case PetRoom.bath:
        _drawBathroomInterior(canvas, w, h);
        break;
      case PetRoom.bedroom:
        _drawBedroomInterior(canvas, w, h);
        break;
      case PetRoom.playroom:
        _drawLivingRoomInterior(canvas, w, h);
        break;
    }

    // 4. Atmospheric Light Overlay
    _drawWeatherLighting(canvas, w, h);
  }

  void _drawWallAndFloor(Canvas canvas, double w, double h) {
    final linePaint = Paint()
      ..color = outline
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW;

    final wallH = h * 0.54;

    // Wall Color (Warm cream, Rainy Gray-Cream, or Night Indigo)
    Color wallColor;
    if (isNight || weather == RoomWeather.starryNight) {
      wallColor = const Color(0xFF1B1B3A);
    } else if (weather == RoomWeather.rainy) {
      wallColor = const Color(0xFFE8E5DD);
    } else {
      wallColor = const Color(0xFFFBF0DB);
    }

    canvas.drawRect(Rect.fromLTWH(0, 0, w, wallH), Paint()..color = wallColor);

    // Floor Color (Honey oak parquet wood)
    final floorColor = (isNight || weather == RoomWeather.starryNight)
        ? const Color(0xFF2C243B)
        : const Color(0xFFE4AE7B);
    canvas.drawRect(Rect.fromLTWH(0, wallH, w, h - wallH), Paint()..color = floorColor);

    // Floor Baseboard line
    final baseboardColor = (isNight || weather == RoomWeather.starryNight)
        ? const Color(0xFF221A30)
        : const Color(0xFFD09660);
    canvas.drawRect(Rect.fromLTWH(0, wallH - 8, w, 14), Paint()..color = baseboardColor);
    canvas.drawLine(Offset(0, wallH - 8), Offset(w, wallH - 8), linePaint);
    canvas.drawLine(Offset(0, wallH + 6), Offset(w, wallH + 6), linePaint);

    // Parquet Wood Seams
    final seamPaint = Paint()
      ..color = (isNight ? Colors.black26 : const Color(0x3394582E))
      ..strokeWidth = 1.5;

    for (double y = wallH + 28; y < h; y += 32) {
      canvas.drawLine(Offset(0, y), Offset(w, y), seamPaint);
    }
    for (double x = 40; x < w; x += 75) {
      canvas.drawLine(Offset(x, wallH + 6), Offset(x, h), seamPaint);
    }
  }

  // -------------------------------------------------------------
  // DYNAMIC WEATHER WINDOW
  // -------------------------------------------------------------
  void _drawWeatherWindow(Canvas canvas, double w, double h) {
    if (room == PetRoom.bath) return; // Bathroom has mirror instead

    final linePaint = Paint()
      ..color = outline
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    final winRect = Rect.fromCenter(center: Offset(w - 75, h * 0.22), width: 78, height: 85);

    // Outside Sky depending on weather
    Color skyColor;
    switch (weather) {
      case RoomWeather.sunny:
        skyColor = const Color(0xFFBCE7FD);
        break;
      case RoomWeather.rainy:
        skyColor = const Color(0xFF7B92A8);
        break;
      case RoomWeather.snowy:
        skyColor = const Color(0xFFD6E5F3);
        break;
      case RoomWeather.starryNight:
        skyColor = const Color(0xFF10142A);
        break;
    }

    // Window arch
    canvas.drawRRect(RRect.fromRectAndRadius(winRect, const Radius.circular(36)), fillPaint..color = skyColor);

    // Weather particles outside the window
    canvas.save();
    canvas.clipRRect(RRect.fromRectAndRadius(winRect, const Radius.circular(36)));

    if (weather == RoomWeather.sunny) {
      // Golden Sun
      canvas.drawCircle(Offset(winRect.left + 20, winRect.top + 20), 16, fillPaint..color = const Color(0xFFFFD166));
    } else if (weather == RoomWeather.starryNight) {
      // Golden Crescent Moon
      canvas.drawCircle(Offset(winRect.left + 24, winRect.top + 24), 12, fillPaint..color = const Color(0xFFFFE082));
      canvas.drawCircle(Offset(winRect.left + 28, winRect.top + 22), 10, fillPaint..color = skyColor);
      // Stars
      for (int i = 0; i < 5; i++) {
        final sx = winRect.left + 15 + (i * 14) % 60;
        final sy = winRect.top + 15 + (i * 17) % 55;
        canvas.drawCircle(Offset(sx, sy), 1.8, fillPaint..color = Colors.white);
      }
    } else if (weather == RoomWeather.rainy) {
      // Falling Rain Drops
      final rainPaint = Paint()..color = const Color(0xCCFFFFFF)..strokeWidth = 2;
      for (int i = 0; i < 8; i++) {
        final rx = winRect.left + 10 + (i * 12 + animationTime * 40) % (winRect.width - 20);
        final ry = winRect.top + 10 + (i * 18 + animationTime * 120) % (winRect.height - 20);
        canvas.drawLine(Offset(rx, ry), Offset(rx - 3, ry + 10), rainPaint);
      }
    } else if (weather == RoomWeather.snowy) {
      // Falling Snow Flakes
      final snowPaint = Paint()..color = Colors.white;
      for (int i = 0; i < 9; i++) {
        final sx = winRect.left + 10 + (i * 11 + math.sin(animationTime * 2 + i) * 6) % (winRect.width - 20);
        final sy = winRect.top + 10 + (i * 14 + animationTime * 30) % (winRect.height - 20);
        canvas.drawCircle(Offset(sx, sy), 2.5, snowPaint);
      }
    }

    canvas.restore();

    // Window Frame Outlines
    canvas.drawRRect(RRect.fromRectAndRadius(winRect, const Radius.circular(36)), linePaint);
    canvas.drawLine(Offset(winRect.center.dx, winRect.top), Offset(winRect.center.dx, winRect.bottom), linePaint);
    canvas.drawLine(Offset(winRect.left, winRect.center.dy), Offset(winRect.right, winRect.center.dy), linePaint);

    // Window Sill
    final sill = Rect.fromCenter(center: Offset(winRect.center.dx, winRect.bottom), width: winRect.width + 14, height: 8);
    canvas.drawRRect(RRect.fromRectAndRadius(sill, const Radius.circular(4)), fillPaint..color = Colors.white);
    canvas.drawRRect(RRect.fromRectAndRadius(sill, const Radius.circular(4)), linePaint);
  }

  void _drawWeatherLighting(Canvas canvas, double w, double h) {
    if (weather == RoomWeather.sunny && !isNight) {
      // Gentle sunbeam polygon on floor
      final path = Path()
        ..moveTo(w - 75, h * 0.30)
        ..lineTo(w - 30, h * 0.30)
        ..lineTo(w * 0.70, h)
        ..lineTo(w * 0.20, h)
        ..close();
      canvas.drawPath(path, Paint()..color = const Color(0x18FFD166));
    } else if (weather == RoomWeather.rainy) {
      // Cool rainy tint
      canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0x123A506B));
    }
  }

  // -------------------------------------------------------------
  // DINING ROOM INTERIOR (Kitchen / Food Table with Gingham Cloth)
  // -------------------------------------------------------------
  void _drawDiningRoomInterior(Canvas canvas, double w, double h) {
    final linePaint = Paint()..color = outline..style = PaintingStyle.stroke..strokeWidth = strokeW;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Kitchen Refrigerator & Stove in background
    final fridgeRect = Rect.fromLTWH(24, h * 0.18, 56, h * 0.34);
    canvas.drawRRect(RRect.fromRectAndRadius(fridgeRect, const Radius.circular(8)), fillPaint..color = const Color(0xFFC7EBF2));
    canvas.drawRRect(RRect.fromRectAndRadius(fridgeRect, const Radius.circular(8)), linePaint);
    // Fridge handle
    canvas.drawLine(Offset(70, h * 0.28), Offset(70, h * 0.38), linePaint..strokeWidth = 3);

    // Kitchen Stove / Counter
    final stoveRect = Rect.fromLTWH(92, h * 0.26, 75, h * 0.26);
    canvas.drawRRect(RRect.fromRectAndRadius(stoveRect, const Radius.circular(6)), fillPaint..color = const Color(0xFFFFF7EA));
    canvas.drawRRect(RRect.fromRectAndRadius(stoveRect, const Radius.circular(6)), linePaint);
    // Pot with steam
    canvas.drawOval(Rect.fromCenter(center: Offset(130, h * 0.24), width: 32, height: 18), fillPaint..color = const Color(0xFF9E9E9E));
    canvas.drawOval(Rect.fromCenter(center: Offset(130, h * 0.24), width: 32, height: 18), linePaint);

    // Dining Table with Blue Checkered Gingham Tablecloth
    final tableTopY = h * 0.60;
    final tableRect = Rect.fromLTWH(w * 0.15, tableTopY, w * 0.70, h * 0.32);

    // Table shadow
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.5, h * 0.88), width: w * 0.75, height: 35),
      Paint()..color = const Color(0x33261914)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
    );

    // Blue Gingham Tablecloth Skirt
    canvas.drawRRect(RRect.fromRectAndRadius(tableRect, const Radius.circular(20)), fillPaint..color = const Color(0xFF8FB5E8));
    _drawGinghamCheckers(canvas, tableRect);
    canvas.drawRRect(RRect.fromRectAndRadius(tableRect, const Radius.circular(20)), linePaint);

    // Table Top Oval Surface
    final topSurface = Rect.fromCenter(center: Offset(w * 0.5, tableTopY), width: w * 0.72, height: 50);
    canvas.drawOval(topSurface, fillPaint..color = const Color(0xFFB8D3F7));
    _drawGinghamCheckers(canvas, topSurface);
    canvas.drawOval(topSurface, linePaint);
  }

  void _drawGinghamCheckers(Canvas canvas, Rect bounds) {
    final checkPaint = Paint()..color = const Color(0x33FFFFFF)..style = PaintingStyle.fill;
    final checkDark = Paint()..color = const Color(0x221B4F93)..style = PaintingStyle.fill;

    const size = 18.0;
    canvas.save();
    canvas.clipRect(bounds);
    for (double x = bounds.left; x < bounds.right; x += size) {
      for (double y = bounds.top; y < bounds.bottom; y += size) {
        if (((x / size).toInt() + (y / size).toInt()) % 2 == 0) {
          canvas.drawRect(Rect.fromLTWH(x, y, size, size), checkPaint);
        } else {
          canvas.drawRect(Rect.fromLTWH(x, y, size, size), checkDark);
        }
      }
    }
    canvas.restore();
  }

  // -------------------------------------------------------------
  // BATHROOM INTERIOR (Bubble Bathtub with Iridescent Water)
  // -------------------------------------------------------------
  void _drawBathroomInterior(Canvas canvas, double w, double h) {
    final linePaint = Paint()..color = outline..style = PaintingStyle.stroke..strokeWidth = strokeW;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Bathroom Pastel Turquoise Tiles in background
    final tilePaint = Paint()..color = const Color(0x2238C793)..strokeWidth = 1.2;
    for (double y = 0; y < h * 0.54; y += 22) {
      canvas.drawLine(Offset(0, y), Offset(w, y), tilePaint);
    }
    for (double x = 0; x < w; x += 22) {
      canvas.drawLine(Offset(x, 0), Offset(x, h * 0.54), tilePaint);
    }

    // Wall Mirror with bubbles
    final mirrorRect = Rect.fromCenter(center: Offset(w * 0.5, h * 0.22), width: 90, height: 90);
    canvas.drawOval(mirrorRect, fillPaint..color = const Color(0xFFDFF6FD));
    canvas.drawOval(mirrorRect, linePaint);
    // Mirror shine
    canvas.drawLine(Offset(w * 0.5 - 20, h * 0.14), Offset(w * 0.5 + 20, h * 0.18), Paint()..color = Colors.white..strokeWidth = 3);

    // Large Porcelain Bathtub
    final tubCenter = Offset(w * 0.5, h * 0.68);
    final tubRect = Rect.fromCenter(center: tubCenter, width: w * 0.82, height: h * 0.36);

    // Shadow
    canvas.drawOval(Rect.fromCenter(center: Offset(tubCenter.dx, h * 0.86), width: w * 0.85, height: 35), Paint()..color = const Color(0x28261914)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10));

    // Outer Tub porcelain
    canvas.drawOval(tubRect, fillPaint..color = Colors.white);
    canvas.drawOval(tubRect, linePaint);

    // Inner Tub with sparkling water
    final waterRect = Rect.fromCenter(center: Offset(tubCenter.dx, tubCenter.dy + 8), width: w * 0.74, height: h * 0.28);
    canvas.drawOval(waterRect, fillPaint..color = const Color(0xFF6ED0F6));
    canvas.drawOval(waterRect, linePaint);

    // Floating Bubble Cluster on rim
    final bubbleColors = [const Color(0xCCBDEEFC), const Color(0xCCF7CFF7), const Color(0xCCE7FED7)];
    for (int i = 0; i < 9; i++) {
      final bx = tubRect.left + 30 + i * (tubRect.width - 60) / 8;
      final by = tubRect.top + 16 + math.sin(i * 1.5) * 8;
      canvas.drawCircle(Offset(bx, by), 14, fillPaint..color = bubbleColors[i % 3]);
      canvas.drawCircle(Offset(bx, by), 14, linePaint);
      canvas.drawCircle(Offset(bx - 4, by - 4), 3, Paint()..color = Colors.white);
    }
  }

  // -------------------------------------------------------------
  // BEDROOM INTERIOR (Wooden Bedstead, Quilt, Nightstand & Lamp)
  // -------------------------------------------------------------
  void _drawBedroomInterior(Canvas canvas, double w, double h) {
    final linePaint = Paint()..color = outline..style = PaintingStyle.stroke..strokeWidth = strokeW;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Bedside Nightstand & Lamp
    final standRect = Rect.fromLTWH(20, h * 0.44, 52, h * 0.22);
    canvas.drawRRect(RRect.fromRectAndRadius(standRect, const Radius.circular(8)), fillPaint..color = const Color(0xFFD49962));
    canvas.drawRRect(RRect.fromRectAndRadius(standRect, const Radius.circular(8)), linePaint);

    // Lamp on Nightstand
    final lampCenter = Offset(46, h * 0.38);
    final lampPath = Path()
      ..moveTo(lampCenter.dx - 18, lampCenter.dy + 12)
      ..lineTo(lampCenter.dx + 18, lampCenter.dy + 12)
      ..lineTo(lampCenter.dx + 12, lampCenter.dy - 16)
      ..lineTo(lampCenter.dx - 12, lampCenter.dy - 16)
      ..close();
    canvas.drawPath(lampPath, fillPaint..color = (isNight || weather == RoomWeather.starryNight) ? const Color(0xFFFFD166) : const Color(0xFFFFF8E7));
    canvas.drawPath(lampPath, linePaint);
    // Lamp glow halo if night
    if (isNight || weather == RoomWeather.starryNight) {
      canvas.drawCircle(lampCenter, 60, Paint()..color = const Color(0x44FFD166)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 24));
    }

    // Cozy Wooden Bedstead
    final bedRect = Rect.fromLTWH(w * 0.22, h * 0.48, w * 0.72, h * 0.40);
    // Headboard
    final headboardRect = Rect.fromLTWH(bedRect.left - 8, h * 0.32, 22, h * 0.40);
    canvas.drawRRect(RRect.fromRectAndRadius(headboardRect, const Radius.circular(10)), fillPaint..color = const Color(0xFFBA7A45));
    canvas.drawRRect(RRect.fromRectAndRadius(headboardRect, const Radius.circular(10)), linePaint);

    // Blue Checkered Quilt
    final quiltRect = Rect.fromLTWH(bedRect.left + 8, h * 0.54, bedRect.width - 16, h * 0.32);
    canvas.drawRRect(RRect.fromRectAndRadius(quiltRect, const Radius.circular(16)), fillPaint..color = const Color(0xFF5B89C9));
    _drawGinghamCheckers(canvas, quiltRect);
    canvas.drawRRect(RRect.fromRectAndRadius(quiltRect, const Radius.circular(16)), linePaint);

    // Pillow
    final pillowRect = Rect.fromCenter(center: Offset(bedRect.left + 45, h * 0.50), width: 62, height: 38);
    canvas.drawRRect(RRect.fromRectAndRadius(pillowRect, const Radius.circular(12)), fillPaint..color = Colors.white);
    canvas.drawRRect(RRect.fromRectAndRadius(pillowRect, const Radius.circular(12)), linePaint);
  }

  // -------------------------------------------------------------
  // LIVING ROOM INTERIOR (Fireplace, Green Sofa, Rug & Wall Frame)
  // -------------------------------------------------------------
  void _drawLivingRoomInterior(Canvas canvas, double w, double h) {
    final linePaint = Paint()..color = outline..style = PaintingStyle.stroke..strokeWidth = strokeW;
    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Brick Fireplace on Left
    final fireRect = Rect.fromLTWH(18, h * 0.20, 84, h * 0.36);
    canvas.drawRRect(RRect.fromRectAndRadius(fireRect, const Radius.circular(8)), fillPaint..color = const Color(0xFFD38B6B));
    canvas.drawRRect(RRect.fromRectAndRadius(fireRect, const Radius.circular(8)), linePaint);
    // Firebox opening
    final firebox = Rect.fromLTWH(34, h * 0.34, 52, h * 0.20);
    canvas.drawRRect(RRect.fromRectAndRadius(firebox, const Radius.circular(18)), fillPaint..color = const Color(0xFF381F15));
    // Warm fire flame
    final fireGlow = Offset(60, h * 0.44);
    canvas.drawCircle(fireGlow, 14, fillPaint..color = const Color(0xFFFF9F1C));
    canvas.drawCircle(fireGlow, 8, fillPaint..color = const Color(0xFFFFD166));

    // Wall Picture Frame: "kitty's home" with Pet Portraits
    final frameRect = Rect.fromCenter(center: Offset(w * 0.55, h * 0.18), width: 130, height: 60);
    canvas.drawRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(10)), fillPaint..color = const Color(0xFFFDE8C7));
    canvas.drawRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(10)), linePaint);
    // Frame roof banner
    final bannerRect = Rect.fromLTWH(frameRect.left + 15, frameRect.top - 12, frameRect.width - 30, 18);
    canvas.drawRRect(RRect.fromRectAndRadius(bannerRect, const Radius.circular(6)), fillPaint..color = const Color(0xFFF39C12));
    canvas.drawRRect(RRect.fromRectAndRadius(bannerRect, const Radius.circular(6)), linePaint);

    // Cozy Plush Green Sofa in Background
    final sofaRect = Rect.fromCenter(center: Offset(w * 0.50, h * 0.48), width: w * 0.65, height: 75);
    canvas.drawRRect(RRect.fromRectAndRadius(sofaRect, const Radius.circular(28)), fillPaint..color = const Color(0xFF7EBA74));
    canvas.drawRRect(RRect.fromRectAndRadius(sofaRect, const Radius.circular(28)), linePaint);

    // Round Woven Cream Area Rug on Floor
    final rugRect = Rect.fromCenter(center: Offset(w * 0.50, h * 0.76), width: w * 0.78, height: h * 0.32);
    canvas.drawOval(rugRect, fillPaint..color = const Color(0xFFFFF9EE));
    canvas.drawOval(rugRect, linePaint);
    canvas.drawOval(Rect.fromCenter(center: Offset(w * 0.50, h * 0.76), width: w * 0.68, height: h * 0.24), linePaint..color = const Color(0xFFE8D7C0));
  }

  @override
  bool shouldRepaint(covariant CozyRoomPainter oldDelegate) =>
      oldDelegate.room != room ||
      oldDelegate.isNight != isNight ||
      oldDelegate.weather != weather ||
      oldDelegate.animationTime != animationTime;
}
