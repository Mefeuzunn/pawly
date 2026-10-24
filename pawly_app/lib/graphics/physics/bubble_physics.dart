import 'dart:math' as math;
import 'package:flutter/material.dart';

class FoamBubble {
  double x;
  double y;
  double radius;
  double vy;
  double wobbleSpeed;
  double wobblePhase;
  Color tint;
  bool isPopped;

  FoamBubble({
    required this.x,
    required this.y,
    required this.radius,
    required this.vy,
    required this.wobbleSpeed,
    required this.wobblePhase,
    required this.tint,
    this.isPopped = false,
  });
}

class BubbleEngine {
  final List<FoamBubble> bubbles = [];
  final math.Random random = math.Random();

  void spawnAt(Offset pos, {int count = 4}) {
    final colors = [
      const Color(0xCCB3E5FC),
      const Color(0xCCE1BEE7),
      const Color(0xCCFFF9C4),
      const Color(0xCCC8E6C9),
    ];

    for (int i = 0; i < count; i++) {
      final r = 12.0 + random.nextDouble() * 18.0;
      final angle = random.nextDouble() * 2 * math.pi;
      final dist = random.nextDouble() * 25.0;

      bubbles.add(FoamBubble(
        x: pos.dx + math.cos(angle) * dist,
        y: pos.dy + math.sin(angle) * dist,
        radius: r,
        vy: -30.0 - random.nextDouble() * 45.0, // float upwards
        wobbleSpeed: 2.0 + random.nextDouble() * 3.0,
        wobblePhase: random.nextDouble() * 6.28,
        tint: colors[random.nextInt(colors.length)],
      ));
    }
  }

  void update(double dt, double time) {
    for (int i = bubbles.length - 1; i >= 0; i--) {
      final b = bubbles[i];
      b.y += b.vy * dt;
      b.x += math.sin(time * b.wobbleSpeed + b.wobblePhase) * 20.0 * dt;

      // Despawn if floated off-screen
      if (b.y < -50 || b.isPopped) {
        bubbles.removeAt(i);
      }
    }
  }

  void clear() {
    bubbles.clear();
  }
}
