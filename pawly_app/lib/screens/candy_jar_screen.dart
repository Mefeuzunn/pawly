import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/candy_model.dart';
import '../graphics/physics/candy_physics.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class CandyJarScreen extends StatefulWidget {
  const CandyJarScreen({super.key});

  @override
  State<CandyJarScreen> createState() => _CandyJarScreenState();
}

class _CandyJarScreenState extends State<CandyJarScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _physicsTicker;
  late CandyPhysicsEngine _engine;
  final List<CandyItem> _candies = [];
  final TextEditingController _noteCtrl = TextEditingController();

  final List<Color> _candyPalette = const [
    Color(0xFFFF6584), // Coral Pink
    Color(0xFF38C793), // Mint Green
    Color(0xFFFFA34E), // Honey Orange
    Color(0xFF8B5CF6), // Lavender
    Color(0xFF4F8CFF), // Sky Blue
    Color(0xFFFFD166), // Butter Yellow
  ];

  @override
  void initState() {
    super.initState();
    _seedCandies();

    _engine = CandyPhysicsEngine(
      candies: _candies,
      jarBounds: const Size(300, 380),
    );

    _physicsTicker = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..addListener(() {
      setState(() {
        _engine.step(0.016);
      });
    })..repeat();
  }

  void _seedCandies() {
    final notes = [
      'Gülüşün tüm dünyamı aydınlatıyor! ✨',
      'Akşam kahvesini birlikte içelim mi? ☕',
      'Her an aklımdasın sevgilim 💖',
      'Bugün harika görünüyordun! 🌸',
      'Seni çok ama çok seviyorum 🥰',
      'Minik patimiz Mochi de seni özledi! 🐾',
      'Günün çok güzel geçsin birtanem ☀️',
      'Birlikte dünyayı gezeceğiz! ✈️',
    ];

    final rnd = math.Random();
    for (int i = 0; i < notes.length; i++) {
      _candies.add(CandyItem(
        id: 'c_$i',
        message: notes[i],
        sender: i % 2 == 0 ? 'Müge' : 'Efe',
        color: _candyPalette[i % _candyPalette.length],
        x: 60.0 + rnd.nextDouble() * 180.0,
        y: 60.0 + rnd.nextDouble() * 200.0,
        vx: (rnd.nextDouble() - 0.5) * 80.0,
        vy: (rnd.nextDouble() - 0.5) * 80.0,
        radius: 20.0,
      ));
    }
  }

  @override
  void dispose() {
    _physicsTicker.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _onCandyTapped(CandyItem candy) {
    AppHaptics.mediumImpact();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          backgroundColor: AppColors.background,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: candy.color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: candy.color.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: const Center(child: Text('🍬', style: TextStyle(fontSize: 28))),
              ),
              const SizedBox(height: 16),
              Text(
                '${candy.sender} bir şeker notu bıraktı:',
                style: AppTypography.tag.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 12),
              ClayCard(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Text(
                  '"${candy.message}"',
                  style: AppTypography.bodyLarge.copyWith(fontStyle: FontStyle.italic),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Kapat', style: AppTypography.button.copyWith(color: AppColors.primary)),
            ),
          ],
        );
      },
    );
  }

  void _showAddNoteDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            left: 24,
            right: 24,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Kavanoza Şeker Notu Ekle', style: AppTypography.displaySmall),
              const SizedBox(height: 8),
              TextField(
                controller: _noteCtrl,
                decoration: InputDecoration(
                  hintText: 'Partnerine tatlı bir söz yaz...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              ClayButton(
                text: 'Kavanoza At 🍬✨',
                color: AppColors.mint,
                onTap: () {
                  if (_noteCtrl.text.isNotEmpty) {
                    setState(() {
                      _candies.add(CandyItem(
                        id: 'c_${DateTime.now().millisecondsSinceEpoch}',
                        message: _noteCtrl.text,
                        sender: 'Müge',
                        color: _candyPalette[math.Random().nextInt(_candyPalette.length)],
                        x: 150,
                        y: 30,
                        radius: 20.0,
                      ));
                    });
                    _noteCtrl.clear();
                    Navigator.pop(context);
                    AppHaptics.heavyImpact();
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Şeker Kavanozu 🍬', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Şekerlere dokunup partnerinin tatlı notlarını oku!',
                style: AppTypography.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 12),

            // Physics Candy Jar
            Expanded(
              child: Center(
                child: Container(
                  width: 300,
                  height: 380,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.65),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(40),
                      bottom: Radius.circular(60),
                    ),
                    border: Border.all(color: AppColors.border, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.clayDark.withValues(alpha: 0.35),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Jar Glass Highlight
                      Positioned(
                        left: 20,
                        top: 20,
                        bottom: 40,
                        width: 14,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),

                      // Physics Candies
                      ..._candies.map((c) {
                        return Positioned(
                          left: c.x - c.radius,
                          top: c.y - c.radius,
                          child: GestureDetector(
                            onTap: () => _onCandyTapped(c),
                            child: Container(
                              width: c.radius * 2,
                              height: c.radius * 2,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: RadialGradient(
                                  colors: [
                                    Colors.white.withValues(alpha: 0.9),
                                    c.color,
                                    HSLColor.fromColor(c.color).withLightness(0.35).toColor(),
                                  ],
                                  center: const Alignment(-0.3, -0.3),
                                  radius: 0.85,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: c.color.withValues(alpha: 0.4),
                                    blurRadius: 6,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Text('🍬', style: TextStyle(fontSize: 16)),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom Add Note Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: ClayButton(
                text: 'Yeni Şeker Notu Bırak 💌',
                color: AppColors.primary,
                onTap: _showAddNoteDialog,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
