import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../models/couple_model.dart';
import '../models/garden_model.dart';
import '../models/adventure_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/dynamic_island_pill.dart';
import '../widgets/ios_widget_cards.dart';
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
  bool _showTamagotchiOnHome = true;

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
    _heartBurst.burstAt(Offset(size.width / 2, 100), count: 24);
    AppHaptics.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    return FloatingHeartsBurstOverlay(
      controller: _heartBurst,
      child: Scaffold(
        backgroundColor: const Color(0xFFFDFBF7),
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // 1. Dynamic Island Floating Header
              Padding(
                padding: const EdgeInsets.only(top: 6, bottom: 4),
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
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Level & Pet Selector & Tamagotchi toggle
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF2D6),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF261914), width: 2),
                            ),
                            child: Row(
                              children: [
                                const Text('⭐', style: TextStyle(fontSize: 14)),
                                const SizedBox(width: 4),
                                Text(
                                  'Seviye ${_pet.level}',
                                  style: AppTypography.tag.copyWith(color: const Color(0xFF8B5A2B), fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => setState(() => _showTamagotchiOnHome = !_showTamagotchiOnHome),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: _showTamagotchiOnHome ? const Color(0xFFFFD166) : Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFF261914), width: 1.8),
                                  ),
                                  child: Text(
                                    _showTamagotchiOnHome ? '👾 Tamagotchi' : '🏡 Ev Modu',
                                    style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _openPetSelector,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFF261914), width: 2),
                                    boxShadow: const [
                                      BoxShadow(color: Color(0xFF261914), offset: Offset(0, 2)),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      const Text('🐾', style: TextStyle(fontSize: 13)),
                                      const SizedBox(width: 4),
                                      Text(
                                        _pet.name,
                                        style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                      ),
                                      const Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textPrimary),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // 3. Featured Center Stage: Retro Tamagotchi or Pet Room Card
                      Center(
                        child: _showTamagotchiOnHome
                            ? TamagotchiPetWidget(
                                pet: _pet,
                                onFeed: () {
                                  setState(() => _pet.feed(18));
                                  _heartBurst.burstAt(Offset(MediaQuery.of(context).size.width / 2, 260), count: 12);
                                },
                                onWash: () {
                                  setState(() => _pet.wash(20));
                                  _heartBurst.burstAt(Offset(MediaQuery.of(context).size.width / 2, 260), count: 12);
                                },
                                onPlay: () {
                                  setState(() => _pet.play(15));
                                  _heartBurst.burstAt(Offset(MediaQuery.of(context).size.width / 2, 260), count: 12);
                                },
                              )
                            : GestureDetector(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => PetRoomScreen(pet: _pet, onStateChanged: () => setState(() {}))),
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFBF0DB),
                                    borderRadius: BorderRadius.circular(28),
                                    border: Border.all(color: const Color(0xFF261914), width: 2.5),
                                    boxShadow: const [
                                      BoxShadow(color: Color(0xFF261914), offset: Offset(0, 4)),
                                    ],
                                  ),
                                  child: Column(
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text("kitty's home 🏡", style: AppTypography.displaySmall.copyWith(fontSize: 18)),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: const Color(0xFF261914), width: 1.5),
                                            ),
                                            child: Text('Odaya Gir 🚪', style: AppTypography.tag),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Besle, banyo yaptır, uyut veya oyun oyna!',
                                        style: AppTypography.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                      ),

                      const SizedBox(height: 16),

                      // Status Meters
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF261914), width: 2),
                          boxShadow: const [
                            BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3)),
                          ],
                        ),
                        child: Row(
                          children: [
                            Expanded(child: StatusMeter(label: 'Doygunluk', icon: '🍗', value: _pet.hunger, color: AppColors.secondary)),
                            const SizedBox(width: 12),
                            Expanded(child: StatusMeter(label: 'Temizlik', icon: '🫧', value: _pet.cleanliness, color: AppColors.mint)),
                            const SizedBox(width: 12),
                            Expanded(child: StatusMeter(label: 'Mutluluk', icon: '💖', value: _pet.happiness, color: AppColors.primary)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 22),

                      // 4. Authentic Widgetable iOS Widgets Header
                      Text('Canlı iOS Widgetları 📱', style: AppTypography.displaySmall),
                      Text('Kilit ve Ana ekran widget standartları', style: AppTypography.bodySmall),
                      const SizedBox(height: 12),

                      // Widget 1: Sleep VS Battle Card (1:1 from Widgetable)
                      SleepVSWidget(
                        couple: _couple,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => CoupleStatusScreen(couple: _couple, onStateChanged: () => setState(() {}))),
                          );
                        },
                      ),

                      const SizedBox(height: 14),

                      // Widget 2: Together & Distance Card (1:1 from Widgetable)
                      TogetherDistanceWidget(
                        couple: _couple,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => CoupleStatusScreen(couple: _couple, onStateChanged: () => setState(() {}))),
                          );
                        },
                      ),

                      const SizedBox(height: 14),

                      // Widget 3 & 4: Miss You Heart & Candy Jar Grid
                      Row(
                        children: [
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => MissYouScreen(couple: _couple, onMissYouSent: () => setState(() {}))),
                                );
                              },
                              color: const Color(0xFFFFE8EE),
                              borderColor: const Color(0xFFFF6584),
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
                              color: const Color(0xFFFFF3E0),
                              borderColor: const Color(0xFFFFA34E),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('🍬', style: TextStyle(fontSize: 28)),
                                      Text('20 Not', style: AppTypography.tag.copyWith(color: AppColors.secondary)),
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

                      // Widget 5 & 6: Love Garden & Pet Adventures
                      Row(
                        children: [
                          Expanded(
                            child: ClayCard(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => LoveGardenScreen(garden: _garden, onStateChanged: () => setState(() {}))),
                                );
                              },
                              color: const Color(0xFFE8F8F0),
                              borderColor: const Color(0xFF38C793),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('🌸', style: TextStyle(fontSize: 28)),
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
                                  MaterialPageRoute(builder: (_) => AdventureScreen(adventure: _adventure, onStateChanged: () => setState(() {}))),
                                );
                              },
                              color: const Color(0xFFEAF2FF),
                              borderColor: const Color(0xFF4F8CFF),
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

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),

              // Bottom Navigation Bar
              _buildBottomNavBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: Color(0xFF261914), width: 2)),
        boxShadow: [
          BoxShadow(color: Color(0xFF261914), offset: Offset(0, -3)),
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
            color: isSelected ? const Color(0xFFFF6584) : const Color(0xFFA1887F),
            size: 24,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.tag.copyWith(
              color: isSelected ? const Color(0xFFFF6584) : const Color(0xFFA1887F),
              fontSize: 10,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
