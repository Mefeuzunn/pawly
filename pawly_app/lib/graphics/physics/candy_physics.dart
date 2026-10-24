import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/candy_model.dart';

class CandyPhysicsEngine {
  final List<CandyItem> candies;
  final Size jarBounds;

  CandyPhysicsEngine({required this.candies, required this.jarBounds});

  void step(double dt, {double gravity = 700.0, double tiltX = 0.0}) {
    final damping = 0.98;
    final restitution = 0.65;

    for (int i = 0; i < candies.length; i++) {
      final c = candies[i];

      // Accelerate
      c.vx += tiltX * 800.0 * dt;
      c.vy += gravity * dt;

      // Velocity damping
      c.vx *= damping;
      c.vy *= damping;

      // Integrate position
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      // Wall boundaries
      final minX = c.radius + 12;
      final maxX = jarBounds.width - c.radius - 12;
      final minY = c.radius + 10;
      final maxY = jarBounds.height - c.radius - 14;

      if (c.x < minX) {
        c.x = minX;
        c.vx = -c.vx * restitution;
      } else if (c.x > maxX) {
        c.x = maxX;
        c.vx = -c.vx * restitution;
      }

      if (c.y < minY) {
        c.y = minY;
        c.vy = -c.vy * restitution;
      } else if (c.y > maxY) {
        c.y = maxY;
        c.vy = -c.vy * restitution;
      }
    }

    // Pairwise circle-circle collisions
    for (int i = 0; i < candies.length; i++) {
      for (int j = i + 1; j < candies.length; j++) {
        final c1 = candies[i];
        final c2 = candies[j];

        final dx = c2.x - c1.x;
        final dy = c2.y - c1.y;
        final dist = math.sqrt(dx * dx + dy * dy);
        final minDist = c1.radius + c2.radius;

        if (dist < minDist && dist > 0) {
          final overlap = (minDist - dist) * 0.5;
          final nx = dx / dist;
          final ny = dy / dist;

          // Push apart
          c1.x -= nx * overlap;
          c1.y -= ny * overlap;
          c2.x += nx * overlap;
          c2.y += ny * overlap;

          // Relative velocity bounce
          final kx = c1.vx - c2.vx;
          final ky = c1.vy - c2.vy;
          final p = 2 * (nx * kx + ny * ky) / 2;

          c1.vx -= p * nx * restitution;
          c1.vy -= p * ny * restitution;
          c2.vx += p * nx * restitution;
          c2.vy += p * ny * restitution;
        }
      }
    }
  }
}
