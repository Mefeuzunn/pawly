import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../models/couple_model.dart';
import '../widgets/ios_widget_cards.dart';
import '../core/utils/haptics.dart';

enum SimulatorView { lockScreen, homeScreen }

class WidgetSimulatorScreen extends StatefulWidget {
  final PetModel pet;
  final CoupleModel couple;

  const WidgetSimulatorScreen({
    super.key,
    required this.pet,
    required this.couple,
  });

  @override
  State<WidgetSimulatorScreen> createState() => _WidgetSimulatorScreenState();
}

class _WidgetSimulatorScreenState extends State<WidgetSimulatorScreen> {
  SimulatorView _view = SimulatorView.lockScreen;
  int _wallpaperIndex = 0;

  final List<List<Color>> _wallpapers = [
    [const Color(0xFFFFD6E0), const Color(0xFFFFF0F5), const Color(0xFFFFE3E8)], // Soft Rose
    [const Color(0xFFDFF6FD), const Color(0xFFE8F1FF), const Color(0xFFC7EBF2)], // Sky Blue
    [const Color(0xFFFFF5EA), const Color(0xFFFBF0DB), const Color(0xFFFFFDF9)], // Milk & Honey
    [const Color(0xFFE8F8F0), const Color(0xFFD8F3E5), const Color(0xFFB7E4C7)], // Mint Sprout
    [const Color(0xFF242038), const Color(0xFF1B1B3A), const Color(0xFF0F0E17)], // Midnight Dark
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = _wallpaperIndex == 4;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F0E6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('iOS Widget Stüdyosu 📱', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // View Mode Toggle (Kilit Ekranı vs Ana Ekran)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF261914), width: 2),
                ),
                child: Row(
                  children: [
                    _buildToggleItem(SimulatorView.lockScreen, '🔒 Kilit Ekranı'),
                    _buildToggleItem(SimulatorView.homeScreen, '📱 Ana Ekran'),
                  ],
                ),
              ),
            ),

            // Wallpaper Swatches
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_wallpapers.length, (i) {
                  final isSelected = _wallpaperIndex == i;
                  return GestureDetector(
                    onTap: () {
                      AppHaptics.selectionClick();
                      setState(() => _wallpaperIndex = i);
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: _wallpapers[i]),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? const Color(0xFF261914) : Colors.transparent,
                          width: isSelected ? 3 : 1,
                        ),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                      ),
                    ),
                  );
                }),
              ),
            ),

            // iPhone Frame Simulator
            Expanded(
              child: Center(
                child: Container(
                  width: 320,
                  height: 540,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(50),
                    border: Border.all(color: const Color(0xFF1C1C1E), width: 10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.35),
                        blurRadius: 30,
                        offset: const Offset(0, 16),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _wallpapers[_wallpaperIndex],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Dynamic Island Pill at top of iPhone
                          Positioned(
                            top: 10,
                            child: Container(
                              width: 100,
                              height: 26,
                              decoration: BoxDecoration(
                                color: Colors.black,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                children: [
                                  Text(widget.pet.moodEmoji, style: const TextStyle(fontSize: 12)),
                                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle)),
                                ],
                              ),
                            ),
                          ),

                          // Mode-specific content
                          if (_view == SimulatorView.lockScreen)
                            _buildLockScreenContent(isDark)
                          else
                            _buildHomeScreenContent(isDark),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Bottom action tip
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Text(
                'Widgetlara dokunarak canlı tepkileri test edebilirsiniz!',
                style: AppTypography.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleItem(SimulatorView view, String title) {
    final isSelected = _view == view;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          AppHaptics.selectionClick();
          setState(() => _view = view);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFFF6584) : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              title,
              style: AppTypography.tag.copyWith(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // iPHONE LOCK SCREEN CONTENT (Big 09:41 Clock, Date, Lock Widgets)
  // -------------------------------------------------------------
  Widget _buildLockScreenContent(bool isDark) {
    final textColor = isDark ? Colors.white : const Color(0xFF261914);

    return Column(
      children: [
        const SizedBox(height: 50),
        // Date
        Text(
          'Perşembe, 24 Ekim',
          style: AppTypography.tag.copyWith(
            color: textColor.withValues(alpha: 0.8),
            fontWeight: FontWeight.w600,
          ),
        ),
        // Big Clock
        Text(
          '09:41',
          style: TextStyle(
            fontSize: 68,
            fontWeight: FontWeight.w800,
            color: textColor,
            fontFamily: 'Fredoka',
            letterSpacing: -2,
            height: 1.0,
          ),
        ),

        const SizedBox(height: 16),

        // Lock Screen Inline Widgets Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Circular Widget: Hatching Egg / Sleep
              _buildLockScreenPill(
                icon: '🥚',
                title: 'Yumurta',
                subtitle: '18s kaldı',
                textColor: textColor,
              ),
              const SizedBox(width: 8),
              // Rectangular Widget: Miss You
              _buildLockScreenPill(
                icon: '❤️',
                title: '${widget.couple.partnerName} Özledi',
                subtitle: '${widget.couple.missYouCount} kez',
                textColor: textColor,
              ),
            ],
          ),
        ),

        const Spacer(),

        // Lock Screen Pet Couple Interactive Dialog (1:1 from Screenshot)
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0x33FFFFFF) : const Color(0x99FFFFFF),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white24 : const Color(0x33261914)),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
          ),
          child: Row(
            children: [
              Text(widget.pet.moodEmoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Bekle! Seni öpmeyi unuttum! 💋', style: AppTypography.tag.copyWith(color: textColor, fontWeight: FontWeight.bold)),
                    Text('${widget.couple.partnerName} ile mesafe: ${widget.couple.distanceKm} km', style: AppTypography.bodySmall.copyWith(color: textColor.withValues(alpha: 0.7), fontSize: 10)),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Bottom Flashlight & Camera Shortcuts
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildCircleButton(Icons.flashlight_on_rounded),
              _buildCircleButton(Icons.camera_alt_rounded),
            ],
          ),
        ),

        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildLockScreenPill({required String icon, required String title, required String subtitle, required Color textColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.tag.copyWith(fontSize: 11, color: textColor, fontWeight: FontWeight.bold)),
              Text(subtitle, style: AppTypography.bodySmall.copyWith(fontSize: 9, color: textColor.withValues(alpha: 0.75))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }

  // -------------------------------------------------------------
  // iPHONE HOME SCREEN CONTENT (App Icons & Medium Widgetable Widgets)
  // -------------------------------------------------------------
  Widget _buildHomeScreenContent(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          const SizedBox(height: 52),

          // Medium 4x2 Home Screen Sleep VS Widget
          SleepVSWidget(
            couple: widget.couple,
            onTap: () {},
          ),

          const SizedBox(height: 16),

          // Row of iOS App Icons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildAppIcon('Safari', Icons.explore, const Color(0xFF007AFF)),
              _buildAppIcon('Fotoğraflar', Icons.photo_library, const Color(0xFFFF2D55)),
              _buildAppIcon('Pawly', Icons.pets, const Color(0xFFFF6584)),
              _buildAppIcon('Hava Durumu', Icons.wb_sunny, const Color(0xFFFF9500)),
            ],
          ),

          const SizedBox(height: 16),

          // Small 2x2 Widgets Row
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 125,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF261914), width: 2),
                    boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('❤️', style: TextStyle(fontSize: 22)),
                          Text('${widget.couple.missYouCount}', style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Spacer(),
                      Text('Özledim', style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold)),
                      Text('${widget.couple.partnerName} için', style: AppTypography.bodySmall.copyWith(fontSize: 10)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  height: 125,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFF261914), width: 2),
                    boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('🍬', style: TextStyle(fontSize: 22)),
                          Text('20 Not', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFFFA34E))),
                        ],
                      ),
                      const Spacer(),
                      Text('Şekerler', style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold)),
                      Text('Sevgi notları', style: AppTypography.bodySmall.copyWith(fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildAppIcon(String name, IconData icon, Color color) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(13),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
          ),
          child: Icon(icon, color: Colors.white, size: 26),
        ),
        const SizedBox(height: 4),
        Text(name, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
      ],
    );
  }
}
