import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../graphics/kawaii_art.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class WardrobeScreen extends StatefulWidget {
  final PetModel pet;
  final VoidCallback onOutfitSaved;

  const WardrobeScreen({
    super.key,
    required this.pet,
    required this.onOutfitSaved,
  });

  @override
  State<WardrobeScreen> createState() => _WardrobeScreenState();
}

class _WardrobeScreenState extends State<WardrobeScreen>
    with SingleTickerProviderStateMixin {
  late PetOutfit _selectedOutfit;
  late AnimationController _anim;
  double _elapsedTime = 0.0;
  int _categoryIndex = 0; // 0: Şapkalar, 1: Kıyafetler, 2: Gözlükler

  final List<String> _categories = ['🎩 Şapkalar', '🎀 Kıyafetler', '🕶️ Gözlükler'];

  final List<Map<String, dynamic>> _hatOutfits = [
    {'outfit': PetOutfit.none, 'name': 'Yok', 'icon': '✨'},
    {'outfit': PetOutfit.detectiveHat, 'name': 'Dedektif Kasketi', 'icon': '🕵️'},
    {'outfit': PetOutfit.bucketHat, 'name': 'Kova Şapka', 'icon': '👒'},
    {'outfit': PetOutfit.partyHat, 'name': 'Parti Şapkası', 'icon': '🎉'},
    {'outfit': PetOutfit.nightCap, 'name': 'Gece Başlığı', 'icon': '🌙'},
    {'outfit': PetOutfit.flowerCrown, 'name': 'Çiçek Tacı', 'icon': '🌸'},
  ];

  final List<Map<String, dynamic>> _clothesOutfits = [
    {'outfit': PetOutfit.none, 'name': 'Yok', 'icon': '✨'},
    {'outfit': PetOutfit.bowTie, 'name': 'Kırmızı Papyon', 'icon': '🎀'},
    {'outfit': PetOutfit.sailorShirt, 'name': 'Denizci Çizgili', 'icon': '⛵'},
    {'outfit': PetOutfit.pinkDress, 'name': 'Pembe Elbise', 'icon': '👗'},
    {'outfit': PetOutfit.greenTracksuit, 'name': 'Yeşil Eşofman', 'icon': '🧥'},
  ];

  final List<Map<String, dynamic>> _glassesOutfits = [
    {'outfit': PetOutfit.none, 'name': 'Yok', 'icon': '✨'},
    {'outfit': PetOutfit.heartGlasses, 'name': 'Kalpli Gözlük', 'icon': '💖'},
    {'outfit': PetOutfit.aviatorGoggles, 'name': 'Pilot Gözlüğü', 'icon': '🥽'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedOutfit = widget.pet.outfit;
    _anim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() => setState(() => _elapsedTime += 0.016))
      ..repeat();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  void _saveOutfit() {
    AppHaptics.heavyImpact();
    setState(() {
      widget.pet.outfit = _selectedOutfit;
    });
    widget.onOutfitSaved();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.pet.name} yeni tarzıyla büyüleyici görünüyor! ✨👗'),
        backgroundColor: const Color(0xFFFF6584),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9EE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Pet Butiği & Gardırop 👗✨', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Text(
              '${widget.pet.name} için en sevimli tarzı tasarla!',
              style: AppTypography.bodySmall,
            ),
            const SizedBox(height: 14),

            // Dressing Room Full-Length Mirror Frame
            Center(
              child: Container(
                width: 250,
                height: 290,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBF0DB),
                  borderRadius: BorderRadius.circular(50),
                  border: Border.all(color: const Color(0xFF261914), width: 3.5),
                  boxShadow: const [
                    BoxShadow(color: Color(0x33261914), blurRadius: 18, offset: Offset(0, 8)),
                    BoxShadow(color: Colors.white, blurRadius: 0, offset: Offset(-2, -2)),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Mirror Glass Reflection
                    Positioned.fill(
                      child: Container(
                        margin: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFEBF7FD), Color(0xFFF7FCFF)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(40),
                          border: Border.all(color: const Color(0xFF261914), width: 2),
                        ),
                      ),
                    ),

                    // Live Kawaii Modeling
                    Positioned(
                      bottom: 30,
                      child: CustomPaint(
                        size: const Size(200, 200),
                        painter: KawaiiPetPainter(
                          species: widget.pet.species,
                          action: PetAction.happy,
                          outfit: _selectedOutfit,
                          animationTime: _elapsedTime,
                        ),
                      ),
                    ),

                    // Pedestal Floor
                    Positioned(
                      bottom: 14,
                      child: Container(
                        width: 140,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE4AE7B),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF261914), width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Category Chips (Şapkalar, Kıyafetler, Gözlükler)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(_categories.length, (i) {
                  final isSel = _categoryIndex == i;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        AppHaptics.selectionClick();
                        setState(() => _categoryIndex = i);
                      },
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: isSel ? const Color(0xFFFF6584) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF261914), width: 1.8),
                        ),
                        child: Center(
                          child: Text(
                            _categories[i],
                            style: AppTypography.tag.copyWith(
                              color: isSel ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            const SizedBox(height: 14),

            // Outfits Selector Grid
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildOutfitGrid(),
              ),
            ),

            // Save Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: ClayButton(
                text: 'Kıyafeti Giydir & Kaydet ✨',
                color: const Color(0xFFFF6584),
                height: 52,
                onTap: _saveOutfit,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOutfitGrid() {
    final list = _categoryIndex == 0
        ? _hatOutfits
        : _categoryIndex == 1
            ? _clothesOutfits
            : _glassesOutfits;

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.15,
      ),
      itemCount: list.length,
      itemBuilder: (context, i) {
        final item = list[i];
        final outfit = item['outfit'] as PetOutfit;
        final isSelected = _selectedOutfit == outfit;

        return GestureDetector(
          onTap: () {
            AppHaptics.selectionClick();
            setState(() => _selectedOutfit = outfit);
          },
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFFFF2D6) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? const Color(0xFFFF6584) : const Color(0xFF261914),
                width: isSelected ? 2.5 : 1.8,
              ),
              boxShadow: [
                BoxShadow(
                  color: isSelected ? const Color(0x33FF6584) : const Color(0x1A261914),
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(item['icon'] as String, style: const TextStyle(fontSize: 26)),
                const SizedBox(height: 4),
                Text(
                  item['name'] as String,
                  style: AppTypography.tag.copyWith(
                    fontSize: 10,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                    color: isSelected ? const Color(0xFF8B5A2B) : AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
