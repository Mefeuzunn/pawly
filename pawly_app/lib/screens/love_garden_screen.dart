import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/garden_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class LoveGardenScreen extends StatefulWidget {
  final GardenModel garden;
  final VoidCallback onStateChanged;

  const LoveGardenScreen({
    super.key,
    required this.garden,
    required this.onStateChanged,
  });

  @override
  State<LoveGardenScreen> createState() => _LoveGardenScreenState();
}

class _LoveGardenScreenState extends State<LoveGardenScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  final List<_WaterDrop> _drops = [];
  bool _isWatering = false;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() {
        setState(() {
          for (int i = _drops.length - 1; i >= 0; i--) {
            final d = _drops[i];
            d.y += 18.0;
            d.opacity -= 0.04;
            if (d.opacity <= 0 || d.y > 280) {
              _drops.removeAt(i);
            }
          }
        });
      })
      ..repeat();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  void _waterPlant() {
    AppHaptics.heavyImpact();
    setState(() {
      _isWatering = true;
      final rnd = math.Random();
      for (int i = 0; i < 16; i++) {
        _drops.add(_WaterDrop(
          x: 120.0 + rnd.nextDouble() * 100.0,
          y: 60.0 + rnd.nextDouble() * 40.0,
          opacity: 1.0,
        ));
      }
      widget.garden.water();
    });
    widget.onStateChanged();

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _isWatering = false);
    });
  }

  String _getPlantEmoji() {
    switch (widget.garden.stage) {
      case PlantStage.seed:
        return '🌱';
      case PlantStage.sprout:
        return '🌿';
      case PlantStage.blooming:
        return '🌸';
      case PlantStage.mature:
        return '🌺';
      case PlantStage.fruit:
        return '🍎✨';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Aşk Bahçesi 🌿', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              Text(
                'Her gün birlikte sulayın, sevginiz çiçek açsın!',
                style: AppTypography.bodySmall,
              ),
              const SizedBox(height: 16),

              // Progress Card
              ClayCard(
                color: AppColors.mintLight,
                borderColor: AppColors.mint.withValues(alpha: 0.3),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(widget.garden.stageTitle, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                        Text('${widget.garden.waterCount}/${widget.garden.targetWaters} Damla', style: AppTypography.tag.copyWith(color: AppColors.mint)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: widget.garden.progress,
                        backgroundColor: Colors.white,
                        color: AppColors.mint,
                        minHeight: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Garden Stage with Pot & Plant
              SizedBox(
                height: 320,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Plant Pot
                    Positioned(
                      bottom: 20,
                      child: Container(
                        width: 180,
                        height: 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFFC47B49), // Clay Terracotta Pot
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(50)),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.clayDark.withValues(alpha: 0.5),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: 140,
                            height: 16,
                            decoration: BoxDecoration(
                              color: const Color(0xFF5D4037), // Soil
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Plant
                    Positioned(
                      bottom: 80,
                      child: AnimatedScale(
                        duration: const Duration(milliseconds: 400),
                        scale: _isWatering ? 1.15 : 1.0,
                        child: Text(
                          _getPlantEmoji(),
                          style: TextStyle(
                            fontSize: widget.garden.stage == PlantStage.fruit ? 110 : 90,
                          ),
                        ),
                      ),
                    ),

                    // Water Drops
                    ..._drops.map((d) {
                      return Positioned(
                        left: d.x,
                        top: d.y,
                        child: Opacity(
                          opacity: d.opacity.clamp(0.0, 1.0),
                          child: const Text('💧', style: TextStyle(fontSize: 18)),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              const Spacer(),

              // Water Button
              ClayButton(
                text: 'Bahçeyi Sula 💧🌱',
                color: AppColors.mint,
                height: 56,
                onTap: _waterPlant,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _WaterDrop {
  double x;
  double y;
  double opacity;
  _WaterDrop({required this.x, required this.y, required this.opacity});
}
