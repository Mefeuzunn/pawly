import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/utils/haptics.dart';

class PoopCleanGame extends StatefulWidget {
  final VoidCallback onCleaned;

  const PoopCleanGame({super.key, required this.onCleaned});

  @override
  State<PoopCleanGame> createState() => _PoopCleanGameState();
}

class _PoopCleanGameState extends State<PoopCleanGame>
    with SingleTickerProviderStateMixin {
  int _sprayCount = 0;
  static const int _targetSprays = 4;
  bool _isCleaned = false;
  final List<Offset> _sprays = [];

  void _spray(TapDownDetails details) {
    if (_isCleaned) return;

    AppHaptics.mediumImpact();
    setState(() {
      _sprayCount++;
      _sprays.add(details.localPosition);

      if (_sprayCount >= _targetSprays) {
        _isCleaned = true;
        widget.onCleaned();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF9EE),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF261914), width: 2),
        boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Hijyen Görevi: Kaka Temizliği 🧼', style: AppTypography.displaySmall.copyWith(fontSize: 16)),
              Text(_isCleaned ? 'Tertemiz! ✨' : '$_sprayCount/$_targetSprays Fısfıs', style: AppTypography.tag.copyWith(color: AppColors.secondary)),
            ],
          ),
          const SizedBox(height: 10),

          // Interactive Spray Target Area
          GestureDetector(
            onTapDown: _spray,
            child: Container(
              height: 140,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF261914), width: 1.5),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_isCleaned) ...[
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('✨💖✨', style: TextStyle(fontSize: 36)),
                        const SizedBox(height: 4),
                        Text(
                          'Oda pırıl pırıl oldu! (+25 XP)',
                          style: AppTypography.tag.copyWith(color: const Color(0xFF38C793), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ] else ...[
                    // Cute Poop Mascot
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('💩', style: TextStyle(fontSize: 54)),
                        Text('Fısfısla temizle!', style: AppTypography.tag.copyWith(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                    // Spray bubbles
                    ..._sprays.map((pos) => Positioned(
                      left: pos.dx - 12,
                      top: pos.dy - 12,
                      child: const Text('🫧', style: TextStyle(fontSize: 20)),
                    )),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
