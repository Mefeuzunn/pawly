import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../models/couple_model.dart';
import '../models/garden_model.dart';
import '../models/adventure_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/dynamic_island_pill.dart';
import '../widgets/pet_3d_interactive_view.dart';
import '../widgets/status_meter.dart';
import '../widgets/floating_hearts_burst.dart';
import 'pet_selector_modal.dart';
import 'pet_room_screen.dart';
import 'miss_you_screen.dart';
import 'candy_jar_screen.dart';
import 'love_garden_screen.dart';
import 'adventure_screen.dart';
import 'couple_status_screen.dart';
import '../core/utils/haptics.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PetModel _pet = PetModel(
    id: 'pet_main',
    name: 'Mochi',
    species: PetSpecies.cat,
    outfit: PetOutfit.bowTie,
  );

  final CoupleModel _couple = CoupleModel();
  final GardenModel _garden = GardenModel();
  final AdventureState _adventure = AdventureState();
  final FloatingHeartsBurstController _heartBurst = FloatingHeartsBurstController();

  int _currentIndex = 0;

  void _openPetSelector() {
    AppHaptics.mediumImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return PetSelectorModal(
          pet: _pet,
          onSelectSpecies: (sp) {
            setState(() {
              // Create new pet or switch species
              Navigator.pop(context);
              _pet.hunger = 85;
            });
            _showSpeciesChange(sp);
          },
          onSelectOutfit: (outfit) {
            setState(() {
              _pet.outfit = outfit;
            });
            Navigator.pop(context);
          },
        );
      },
    );
  }

  void _showSpeciesChange(PetSpecies sp) {
    setState(() {
      // Re-assign species
      final newPet = PetModel(
        id: _pet.id,
        name: sp == PetSpecies.cat ? 'Mochi' : sp == PetSpecies.shiba ? 'Hachi' : sp == PetSpecies.bear ? 'Barnaby' : 'Usagi',
        species: sp,
        outfit: _pet.outfit,
      );
      _pet.hunger = newPet.hunger;
      _pet.cleanliness = newPet.cleanliness;
      _pet.happiness = newPet.happiness;
    });
  }

  void _quickMissYou() {
    setState(() {
      _couple.sendMissYou();
    });
    final size = MediaQuery.of(context).size;
    _heartBurst.burstAt(Offset(size.width / 2, 100), count: 20);
    AppHaptics.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    return FloatingHeartsBurstOverlay(
      controller: _heartBurst,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // 1. Dynamic Island Floating Header
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 4),
                child: Center(
                  child: DynamicIslandPill(
                    pet: _pet,
                    couple: _couple,
                    onQuickMissYou: _quickMissYou,
                  ),
                ),
              ),

              // 2. Main Scrollable Dashboard
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Level Badge & Pet Selector
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.secondaryLight,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
                            ),
                            child: Row(
                              children: [
                                const Text('⭐', style: TextStyle(fontSize: 14)),
                                const SizedBox(width: 4),
                                Text(
                                  'Seviye ${_pet.level} • ${_pet.exp} XP',
                                  style: AppTypography.tag.copyWith(color: AppColors.secondary, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: _openPetSelector,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                                boxShadow: [
                                  BoxShadow(color: AppColors.clayDark.withValues(alpha: 0.3), blurRadius: 6, offset: const Offset(0, 2)),
                                ],
                              ),
                              child: Row(
                                children: [
                                  const Text('🐾', style: TextStyle(fontSize: 14)),
                                  const SizedBox(width: 6),
                                  Text(
                                    _pet.speciesName,
                                    style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                  ),
                                  const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.textSecondary),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // 3. 3D Pet Center Stage Card
                      ClayCard(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Column(
                          children: [
                            // 3D Pet Interactive Viewport
                            Pet3DInteractiveView(
                              pet: _pet,
                              height: 270,
                              onPetTapped: () => setState(() {}),
                            ),

                            // Quick Room Buttons
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildQuickRoomBtn(PetRoom.kitchen, 'Besle 🍲', AppColors.secondary),
                                _buildQuickRoomBtn(PetRoom.bath, 'Yıka 🫧', AppColors.mint),
                                _buildQuickRoomBtn(PetRoom.bedroom, 'Uyu 🛏️', AppColors.lavender),
                                _buildQuickRoomBtn(PetRoom.playroom, 'Oyna 🎾', AppColors.sky),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 4. Quick Status Bars
                      ClayCard(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            Expanded(child: StatusMeter(label: 'Doygunluk', icon: '🍗', value: _pet.hunger, color: AppColors.secondary)),
                            const SizedBox(width: 14),
                            Expanded(child: StatusMeter(label: 'Temizlik', icon: '🫧', value: _pet.cleanliness, color: AppColors.mint)),
                            const SizedBox(width: 14),
                            Expanded(child: StatusMeter(label: 'Mutluluk', icon: '💖', value: _pet.happiness, color: AppColors.primary)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // 5. Bento Grid Widgets (Miss You, Candy Jar, Garden, Adventure, Sleep VS)
                      Text('Çift & Arkadaş Widgetları 🌟', style: AppTypography.displaySmall),
                      const SizedBox(height: 12),

                      // Row 1: 3D Miss You & Candy Jar
                      Row(
                        children: [
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => MissYouScreen(couple: _couple, onMissYouSent: () => setState(() {})),
                                  ),
                                );
                              },
                              color: AppColors.primaryLight,
                              borderColor: AppColors.primary.withValues(alpha: 0.3),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('❤️', style: TextStyle(fontSize: 28)),
                                      Text('${_couple.missYouCount}', style: AppTypography.displaySmall.copyWith(color: AppColors.primaryDark)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Seni Özledim', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                  Text('${_couple.partnerName} için kalp gönder', style: AppTypography.bodySmall),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const CandyJarScreen()),
                                );
                              },
                              color: AppColors.secondaryLight,
                              borderColor: AppColors.secondary.withValues(alpha: 0.3),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('🍬', style: TextStyle(fontSize: 28)),
                                      Text('Fizik', style: AppTypography.tag.copyWith(color: AppColors.secondary)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Şeker Kavanozu', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                  Text('Tatlı aşk notları', style: AppTypography.bodySmall),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Row 2: Love Garden & Adventures
                      Row(
                        children: [
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => LoveGardenScreen(garden: _garden, onStateChanged: () => setState(() {})),
                                  ),
                                );
                              },
                              color: AppColors.mintLight,
                              borderColor: AppColors.mint.withValues(alpha: 0.3),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('🌿', style: TextStyle(fontSize: 28)),
                                      Text('${(_garden.progress * 100).toInt()}%', style: AppTypography.tag.copyWith(color: AppColors.mint, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Aşk Bahçesi', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                  Text(_garden.stageTitle, style: AppTypography.bodySmall),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => AdventureScreen(adventure: _adventure, onStateChanged: () => setState(() {})),
                                  ),
                                );
                              },
                              color: AppColors.skyLight,
                              borderColor: AppColors.sky.withValues(alpha: 0.3),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('✈️', style: TextStyle(fontSize: 28)),
                                      Text('${_adventure.album.length} Anı', style: AppTypography.tag.copyWith(color: AppColors.sky, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Pet Maceraları', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                  Text(
                                    _adventure.isTraveling ? 'Yolculukta...' : 'Dünya Gezileri',
                                    style: AppTypography.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Row 3: Couple Status & Sleep VS
                      ClayCard(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CoupleStatusScreen(couple: _couple, onStateChanged: () => setState(() {})),
                            ),
                          );
                        },
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.lavenderLight,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Text('💕', style: TextStyle(fontSize: 28)),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${_couple.partnerName} ile Bağlantı', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                  Text('Mesafe: ${_couple.distanceKm} km • Günün Sorusu & Uyku VS', style: AppTypography.bodySmall),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.textMuted),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),

              // 6. Bottom Navigation Bar
              _buildBottomNavBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickRoomBtn(PetRoom room, String label, Color color) {
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        _pet.currentRoom = room;
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PetRoomScreen(pet: _pet, onStateChanged: () => setState(() {})),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Text(label, style: AppTypography.tag.copyWith(color: color, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: AppColors.clayDark.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(0, 'Ana Sayfa', Icons.home_rounded, () {}),
          _buildNavItem(1, 'Odalar', Icons.meeting_room_rounded, () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => PetRoomScreen(pet: _pet, onStateChanged: () => setState(() {}))),
            );
          }),
          _buildNavItem(2, 'Özledim', Icons.favorite_rounded, () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => MissYouScreen(couple: _couple, onMissYouSent: () => setState(() {}))),
            );
          }),
          _buildNavItem(3, 'Bahçe', Icons.local_florist_rounded, () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => LoveGardenScreen(garden: _garden, onStateChanged: () => setState(() {}))),
            );
          }),
          _buildNavItem(4, 'Macera', Icons.flight_takeoff_rounded, () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AdventureScreen(adventure: _adventure, onStateChanged: () => setState(() {}))),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, String label, IconData icon, VoidCallback onTap) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        setState(() => _currentIndex = index);
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? AppColors.primary : AppColors.textMuted,
            size: 24,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.tag.copyWith(
              color: isSelected ? AppColors.primary : AppColors.textMuted,
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
