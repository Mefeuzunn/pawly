import 'dart:math' as math;
import 'package:flutter/material.dart';

class LoveHeartParticle {
  double x;
  double y;
  double vx;
  double vy;
  double scale;
  double rotation;
  double rotationSpeed;
  double opacity;
  String emoji;

  LoveHeartParticle({
    required this.x,
    required this.y,
    required this.vx,
    required this.vy,
    required this.scale,
    required this.rotation,
    required this.rotationSpeed,
    required this.opacity,
    required this.emoji,
  });
}

class FloatingHeartsBurstController extends ChangeNotifier {
  final List<LoveHeartParticle> particles = [];
  final math.Random random = math.Random();

  void burstAt(Offset origin, {int count = 28}) {
    final emojis = ['💖', '❤️', '💕', '💗', '✨', '🌸', '💘', '🧸'];

    for (int i = 0; i < count; i++) {
      final angle = random.nextDouble() * 2 * math.pi;
      final speed = 120.0 + random.nextDouble() * 260.0;
      particles.add(LoveHeartParticle(
        x: origin.dx,
        y: origin.dy,
        vx: math.cos(angle) * speed,
        vy: math.sin(angle) * speed - 150.0, // bias upwards
        scale: 0.6 + random.nextDouble() * 0.8,
        rotation: random.nextDouble() * 2 * math.pi,
        rotationSpeed: (random.nextDouble() - 0.5) * 6.0,
        opacity: 1.0,
        emoji: emojis[random.nextInt(emojis.length)],
      ));
    }
    notifyListeners();
  }

  void update(double dt) {
    if (particles.isEmpty) return;

    for (int i = particles.length - 1; i >= 0; i--) {
      final p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220.0 * dt; // gravity
      p.rotation += p.rotationSpeed * dt;
      p.opacity -= 0.65 * dt;

      if (p.opacity <= 0) {
        particles.removeAt(i);
      }
    }
    notifyListeners();
  }
}

class FloatingHeartsBurstOverlay extends StatefulWidget {
  final FloatingHeartsBurstController controller;
  final Widget child;

  const FloatingHeartsBurstOverlay({
    super.key,
    required this.controller,
    required this.child,
  });

  @override
  State<FloatingHeartsBurstOverlay> createState() => _FloatingHeartsBurstOverlayState();
}

class _FloatingHeartsBurstOverlayState extends State<FloatingHeartsBurstOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() {
        widget.controller.update(0.016);
      })
      ..repeat();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        AnimatedBuilder(
          animation: widget.controller,
          builder: (context, _) {
            if (widget.controller.particles.isEmpty) return const SizedBox.shrink();

            return IgnorePointer(
              child: Stack(
                children: widget.controller.particles.map((p) {
                  return Positioned(
                    left: p.x - 20,
                    top: p.y - 20,
                    child: Opacity(
                      opacity: p.opacity.clamp(0.0, 1.0),
                      child: Transform.rotate(
                        angle: p.rotation,
                        child: Transform.scale(
                          scale: p.scale,
                          child: Text(p.emoji, style: const TextStyle(fontSize: 32)),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            );
          },
        ),
      ],
    );
  }
}
