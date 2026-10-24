import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../graphics/kawaii_art.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class EggHatchingScreen extends StatefulWidget {
  final Function(PetModel newPet) onPetHatched;

  const EggHatchingScreen({super.key, required this.onPetHatched});

  @override
  State<EggHatchingScreen> createState() => _EggHatchingScreenState();
}

class _EggHatchingScreenState extends State<EggHatchingScreen>
    with SingleTickerProviderStateMixin {
  int _tapCount = 0;
  static const int _targetTaps = 6;
  bool _isHatched = false;
  double _wobble = 0.0;
  final TextEditingController _nameController = TextEditingController(text: 'Luna');
  PetSpecies _hatchedSpecies = PetSpecies.cat;

  final List<PetSpecies> _possibleSpecies = [
    PetSpecies.cat,
    PetSpecies.shiba,
    PetSpecies.bunny,
    PetSpecies.bear,
  ];

  @override
  void initState() {
    super.initState();
    _hatchedSpecies = _possibleSpecies[math.Random().nextInt(_possibleSpecies.length)];
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _tapEgg() {
    if (_isHatched) return;

    AppHaptics.heavyImpact();
    setState(() {
      _tapCount++;
      _wobble = (_tapCount % 2 == 0 ? 1.0 : -1.0) * 0.25;

      if (_tapCount >= _targetTaps) {
        _isHatched = true;
      }
    });

    Future.delayed(const Duration(milliseconds: 250), () {
      if (mounted) setState(() => _wobble = 0.0);
    });
  }

  void _completeAdoption() {
    AppHaptics.heavyImpact();
    final newPet = PetModel(
      id: 'pet_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameController.text.isNotEmpty ? _nameController.text : 'Luna',
      species: _hatchedSpecies,
      hunger: 90,
      cleanliness: 95,
      happiness: 100,
    );
    widget.onPetHatched(newPet);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9EE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Sihirli Kuluçka Töreni 🥚✨', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              Text(
                _isHatched
                    ? 'Tebrikler! Yeni bir minik dost dünyaya geldi! 🎉'
                    : 'Yumurtaya dokunup ısıtarak çatlamasını sağla!',
                style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),

              // Progress bar
              if (!_isHatched)
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: (_tapCount / _targetTaps).clamp(0.0, 1.0),
                    backgroundColor: const Color(0xFFF3DFCE),
                    color: const Color(0xFFFF6584),
                    minHeight: 12,
                  ),
                ),

              const Spacer(),

              // Egg / Hatched Pet Center Stage
              GestureDetector(
                onTap: _tapEgg,
                child: SizedBox(
                  height: 300,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Straw Nest at bottom
                      Positioned(
                        bottom: 20,
                        child: Container(
                          width: 220,
                          height: 70,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD49962),
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(60)),
                            border: Border.all(color: const Color(0xFF261914), width: 3),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 6))],
                          ),
                          child: Center(
                            child: Container(
                              width: 170,
                              height: 12,
                              decoration: BoxDecoration(
                                color: const Color(0xFFBA7A45),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // If Hatched: Show Kawaii Baby Pet with Golden Halo
                      if (_isHatched) ...[
                        Container(
                          width: 240,
                          height: 240,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [Color(0x66FFD166), Colors.transparent],
                            ),
                          ),
                        ),
                        CustomPaint(
                          size: const Size(220, 220),
                          painter: KawaiiPetPainter(
                            species: _hatchedSpecies,
                            action: PetAction.happy,
                          ),
                        ),
                      ] else ...[
                        // Wobbly Egg with Cracks
                        Transform.rotate(
                          angle: _wobble,
                          child: CustomPaint(
                            size: const Size(180, 230),
                            painter: _EggPainter(crackLevel: _tapCount),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const Spacer(),

              // Bottom Section: Name Input & Adopt Button if Hatched
              if (_isHatched) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFF261914), width: 2.5),
                    boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 4))],
                  ),
                  child: Column(
                    children: [
                      Text('Sahiplenme Belgesi 📜', style: AppTypography.displaySmall.copyWith(fontSize: 18)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _nameController,
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(
                          hintText: 'Yeni dostunun adını koy...',
                          filled: true,
                          fillColor: const Color(0xFFFFF9EE),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF261914), width: 2)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ClayButton(
                  text: 'Dostumu Aileye Kabul Et! 🐾💖',
                  color: const Color(0xFFFF6584),
                  height: 54,
                  onTap: _completeAdoption,
                ),
              ] else ...[
                Text(
                  'Kalan Dokunuş: ${_targetTaps - _tapCount}',
                  style: AppTypography.tag.copyWith(color: const Color(0xFF8B5A2B), fontSize: 13),
                ),
                const SizedBox(height: 8),
                ClayButton(
                  text: 'Yumurtayı Isıt! 🤲✨',
                  color: const Color(0xFFFFA34E),
                  height: 54,
                  onTap: _tapEgg,
                ),
              ],
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _EggPainter extends CustomPainter {
  final int crackLevel;
  _EggPainter({required this.crackLevel});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    final linePaint = Paint()
      ..color = const Color(0xFF261914)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()..style = PaintingStyle.fill;

    // Egg Oval Path
    final eggPath = Path()
      ..moveTo(cx, cy - 95)
      ..cubicTo(cx + 80, cy - 85, cx + 85, cy + 85, cx, cy + 95)
      ..cubicTo(cx - 85, cy + 85, cx - 80, cy - 85, cx, cy - 95)
      ..close();

    // Pastel Cream Speckled Egg
    canvas.drawPath(eggPath, fillPaint..color = const Color(0xFFFFF6ED));
    canvas.drawPath(eggPath, linePaint);

    // Cute pastel spots
    final spotPaint = Paint()..color = const Color(0xFFFFB5A7);
    canvas.drawCircle(Offset(cx - 30, cy - 30), 10, spotPaint);
    canvas.drawCircle(Offset(cx + 35, cy - 10), 14, spotPaint);
    canvas.drawCircle(Offset(cx - 15, cy + 40), 12, spotPaint);
    canvas.drawCircle(Offset(cx + 25, cy + 45), 8, spotPaint);

    // Progressive Cracks
    if (crackLevel >= 2) {
      final crack1 = Path()
        ..moveTo(cx - 10, cy - 40)
        ..lineTo(cx + 8, cy - 20)
        ..lineTo(cx - 6, cy - 5)
        ..lineTo(cx + 12, cy + 15);
      canvas.drawPath(crack1, linePaint);
    }

    if (crackLevel >= 4) {
      final crack2 = Path()
        ..moveTo(cx + 25, cy - 35)
        ..lineTo(cx + 40, cy - 15)
        ..lineTo(cx + 30, cy + 5);
      final crack3 = Path()
        ..moveTo(cx - 40, cy + 5)
        ..lineTo(cx - 20, cy + 25)
        ..lineTo(cx - 35, cy + 45);
      canvas.drawPath(crack2, linePaint);
      canvas.drawPath(crack3, linePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _EggPainter oldDelegate) => oldDelegate.crackLevel != crackLevel;
}
