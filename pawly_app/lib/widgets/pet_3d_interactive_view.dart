import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/pet_model.dart';
import '../graphics/engine3d/pet_3d_renderer.dart';
import '../core/utils/haptics.dart';

class Pet3DInteractiveView extends StatefulWidget {
  final PetModel pet;
  final Function(String foodItem)? onFoodDropped;
  final VoidCallback? onPetTapped;
  final double height;

  const Pet3DInteractiveView({
    super.key,
    required this.pet,
    this.onFoodDropped,
    this.onPetTapped,
    this.height = 310,
  });

  @override
  State<Pet3DInteractiveView> createState() => _Pet3DInteractiveViewState();
}

class _Pet3DInteractiveViewState extends State<Pet3DInteractiveView>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  double _yaw = 0.0;
  double _pitch = 0.0;
  double _squish = 0.0;
  Offset _lookAt = Offset.zero;
  double _blink = 0.0;
  double _eatingCycle = 0.0;
  double _elapsedTime = 0.0;
  int _pettingStreak = 0;

  // Floating mini hearts on pet
  final List<_PetHeart> _floatingHearts = [];

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..addListener(_onTick);
    _animCtrl.repeat();
  }

  void _onTick() {
    setState(() {
      _elapsedTime += 0.016;

      // Natural blink cycle (blinks every ~3.5 seconds)
      final cycle = _elapsedTime % 3.5;
      if (cycle > 3.35) {
        _blink = math.sin((cycle - 3.35) / 0.15 * math.pi);
      } else {
        _blink = 0.0;
      }

      // Eating chewing cycle
      if (widget.pet.action == PetAction.eating) {
        _eatingCycle = (_elapsedTime * 6.0) % 1.0;
      } else {
        _eatingCycle = 0.0;
      }

      // Smooth decay of squish
      if (_squish > 0.01) {
        _squish *= 0.88;
      } else {
        _squish = 0.0;
      }

      // Smooth decay of yaw/pitch back toward front
      _yaw *= 0.94;
      _pitch *= 0.94;
      _lookAt = Offset(_lookAt.dx * 0.95, _lookAt.dy * 0.95);

      // Update floating mini hearts
      for (int i = _floatingHearts.length - 1; i >= 0; i--) {
        final h = _floatingHearts[i];
        h.y -= 2.2;
        h.opacity -= 0.025;
        if (h.opacity <= 0) {
          _floatingHearts.removeAt(i);
        }
      }
    });
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _triggerPetReaction() {
    AppHaptics.mediumImpact();
    setState(() {
      _squish = 1.0;
      _pettingStreak++;
      // Spawn heart particle above head
      _floatingHearts.add(_PetHeart(
        x: (math.Random().nextDouble() - 0.5) * 80,
        y: -40,
        opacity: 1.0,
      ));
    });
    widget.onPetTapped?.call();
  }

  @override
  Widget build(BuildContext context) {
    return DragTarget<String>(
      onAcceptWithDetails: (details) {
        AppHaptics.heavyImpact();
        widget.onFoodDropped?.call(details.data);
      },
      builder: (context, candidateData, rejectedData) {
        return GestureDetector(
          onTapDown: (_) => _triggerPetReaction(),
          onPanUpdate: (details) {
            setState(() {
              _yaw = (_yaw + details.delta.dx * 0.012).clamp(-0.8, 0.8);
              _pitch = (_pitch + details.delta.dy * 0.012).clamp(-0.4, 0.4);
              _lookAt = Offset(
                (_lookAt.dx + details.delta.dx * 0.04).clamp(-1.0, 1.0),
                (_lookAt.dy + details.delta.dy * 0.04).clamp(-1.0, 1.0),
              );

              // Petting swipe
              if (details.delta.distance > 8) {
                _pettingStreak++;
                if (_pettingStreak % 5 == 0) {
                  _floatingHearts.add(_PetHeart(
                    x: (math.Random().nextDouble() - 0.5) * 90,
                    y: -30,
                    opacity: 1.0,
                  ));
                  AppHaptics.lightImpact();
                }
              }
            });
          },
          child: SizedBox(
            height: widget.height,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // 3D Canvas
                CustomPaint(
                  size: Size(double.infinity, widget.height),
                  painter: _PetCanvasPainter(
                    pet: widget.pet,
                    time: _elapsedTime,
                    yaw: _yaw,
                    pitch: _pitch,
                    squish: _squish,
                    lookAt: _lookAt,
                    blink: _blink,
                    eatingCycle: _eatingCycle,
                  ),
                ),

                // Floating Hearts Overlay
                ..._floatingHearts.map((h) => Positioned(
                  top: widget.height / 2 + h.y,
                  left: MediaQuery.of(context).size.width / 2 + h.x,
                  child: Opacity(
                    opacity: h.opacity.clamp(0.0, 1.0),
                    child: const Text('💖', style: TextStyle(fontSize: 22)),
                  ),
                )),

                // Drag candidate highlight glow
                if (candidateData.isNotEmpty)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.pink.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: Colors.pinkAccent, width: 2),
                      ),
                      alignment: Alignment.topCenter,
                      padding: const EdgeInsets.only(top: 24),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Text(
                          'Yiyeceği bırak ve yedir! 😋',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.pink),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PetHeart {
  double x;
  double y;
  double opacity;
  _PetHeart({required this.x, required this.y, required this.opacity});
}

class _PetCanvasPainter extends CustomPainter {
  final PetModel pet;
  final double time;
  final double yaw;
  final double pitch;
  final double squish;
  final Offset lookAt;
  final double blink;
  final double eatingCycle;

  _PetCanvasPainter({
    required this.pet,
    required this.time,
    required this.yaw,
    required this.pitch,
    required this.squish,
    required this.lookAt,
    required this.blink,
    required this.eatingCycle,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final renderer = Pet3DRenderer(
      pet: pet,
      animationTime: time,
      yaw: yaw,
      pitch: pitch,
      squish: squish,
      lookAtOffset: lookAt,
      blinkValue: blink,
      eatingCycle: eatingCycle,
    );
    renderer.paint(canvas, size);
  }

  @override
  bool shouldRepaint(covariant _PetCanvasPainter oldDelegate) => true;
}
