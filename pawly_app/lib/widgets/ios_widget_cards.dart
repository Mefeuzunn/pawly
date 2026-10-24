import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/couple_model.dart';
import '../models/pet_model.dart';
import '../graphics/kawaii_art.dart';
import '../core/utils/haptics.dart';

// -------------------------------------------------------------
// 1. SLEEP VS BATTLE WIDGET (1:1 from Widgetable screenshot)
// -------------------------------------------------------------
class SleepVSWidget extends StatelessWidget {
  final CoupleModel couple;
  final VoidCallback onTap;

  const SleepVSWidget({super.key, required this.couple, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border, width: 2),
          boxShadow: [
            BoxShadow(
              color: const Color(0x1A261914),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            // Speech bubble
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA5D6A7)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('💬', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 6),
                    Text(
                      'Uyu artık sevgilim, çok yoruldun 🥰',
                      style: AppTypography.tag.copyWith(color: const Color(0xFF2E7D32)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Ring Charts with VS Badge in Middle
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // Me (Left)
                _buildSleepRing(
                  name: couple.myName,
                  hours: couple.mySleepHours,
                  status: 'Harika 😴',
                  color: const Color(0xFF2ECC71),
                  avatarEmoji: '🐻',
                ),

                // VS Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6584),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(color: const Color(0x44FF6584), blurRadius: 8, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: Text(
                    'VS',
                    style: AppTypography.tag.copyWith(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ),

                // Partner (Right)
                _buildSleepRing(
                  name: couple.partnerName,
                  hours: couple.partnerSleepHours,
                  status: 'Az Uyudu 🥱',
                  color: const Color(0xFFFF7675),
                  avatarEmoji: '🥺',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSleepRing({
    required String name,
    required double hours,
    required String status,
    required Color color,
    required String avatarEmoji,
  }) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 76,
              height: 76,
              child: CircularProgressIndicator(
                value: (hours / 9.0).clamp(0.0, 1.0),
                strokeWidth: 7,
                backgroundColor: color.withValues(alpha: 0.18),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Text(avatarEmoji, style: const TextStyle(fontSize: 32)),
          ],
        ),
        const SizedBox(height: 8),
        Text(name, style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        Text(status, style: AppTypography.tag.copyWith(color: color, fontSize: 11)),
        Text('${hours}s uyku', style: AppTypography.bodySmall.copyWith(fontSize: 11)),
      ],
    );
  }
}

// -------------------------------------------------------------
// 2. RETRO TAMAGOTCHI PET DEVICE (1:1 from Widgetable screenshot)
// -------------------------------------------------------------
class TamagotchiPetWidget extends StatelessWidget {
  final PetModel pet;
  final VoidCallback onFeed;
  final VoidCallback onWash;
  final VoidCallback onPlay;

  const TamagotchiPetWidget({
    super.key,
    required this.pet,
    required this.onFeed,
    required this.onWash,
    required this.onPlay,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFDF70), // Retro Tamagotchi Yellow Case
        borderRadius: BorderRadius.circular(44),
        border: Border.all(color: const Color(0xFF261914), width: 3.5),
        boxShadow: [
          const BoxShadow(color: Color(0x33261914), blurRadius: 20, offset: Offset(0, 10)),
          const BoxShadow(color: Colors.white, blurRadius: 0, offset: Offset(-3, -3)),
        ],
      ),
      child: Column(
        children: [
          // Tamagotchi Top Logo
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF2A8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF261914), width: 2),
            ),
            child: Text(
              'Pawly-gotchi 🐾',
              style: AppTypography.tag.copyWith(
                color: const Color(0xFF8B5A2B),
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // LCD Screen Area (White Bezel + Cream Screen)
          Container(
            width: double.infinity,
            height: 220,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF9EE),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFF261914), width: 3),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Speech Bubble Dialog
                Positioned(
                  top: 12,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF261914), width: 2),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                    ),
                    child: Text(
                      pet.hunger < 40 ? 'Karnım acıktı! 🥺' : 'Çok mutluyum! 🥰',
                      style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontSize: 11),
                    ),
                  ),
                ),

                // 2D Chibi Kawaii Pet Painter
                CustomPaint(
                  size: const Size(200, 160),
                  painter: KawaiiPetPainter(
                    species: pet.species,
                    action: pet.action,
                    outfit: pet.outfit,
                    isSleeping: pet.isSleeping,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 3 Bottom Hardware Pill Buttons (Feed 🍗, Clean 🫧, Play 🎾)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildTamagotchiButton('🍗', 'Besle', onFeed, const Color(0xFFFF9F43)),
              _buildTamagotchiButton('🫧', 'Yıka', onWash, const Color(0xFF54A0FF)),
              _buildTamagotchiButton('🎾', 'Oyna', onPlay, const Color(0xFF1DD1A1)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTamagotchiButton(String emoji, String label, VoidCallback onTap, Color bg) {
    return GestureDetector(
      onTap: () {
        AppHaptics.mediumImpact();
        onTap();
      },
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: bg,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF261914), width: 2.5),
              boxShadow: const [
                BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3)),
              ],
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(height: 4),
          Text(label, style: AppTypography.tag.copyWith(fontSize: 10, color: const Color(0xFF5B3A1E))),
        ],
      ),
    );
  }
}

// -------------------------------------------------------------
// 3. TOGETHER & DISTANCE ROUTE WIDGET (1:1 from Screenshot)
// -------------------------------------------------------------
class TogetherDistanceWidget extends StatelessWidget {
  final CoupleModel couple;
  final VoidCallback onTap;

  const TogetherDistanceWidget({super.key, required this.couple, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFD6E0), Color(0xFFFFF0F5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFFF8FA3), width: 2),
          boxShadow: [
            BoxShadow(
              color: const Color(0x22FF6584),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('💕', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 6),
                    Text('Birlikteyiz', style: AppTypography.displaySmall.copyWith(fontSize: 17, color: const Color(0xFFC9184A))),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFF8FA3)),
                  ),
                  child: Text(
                    '${couple.distanceKm} km',
                    style: AppTypography.tag.copyWith(color: const Color(0xFFC9184A), fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Route with 2 avatars and heart trail
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildAvatarBubble(couple.myName, couple.myAvatar, '🏠 Evde'),
                Expanded(
                  child: Column(
                    children: [
                      const Text('💖 • • • 💖', style: TextStyle(fontSize: 12, color: Color(0xFFFF4D6D))),
                      Text(
                        'Aramızdaki Aşk Yolu',
                        style: AppTypography.tag.copyWith(fontSize: 10, color: const Color(0xFFA53860)),
                      ),
                    ],
                  ),
                ),
                _buildAvatarBubble(couple.partnerName, couple.partnerAvatar, '🐾 Dışarıda'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarBubble(String name, String avatar, String status) {
    return Column(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF261914), width: 2),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: Center(child: Text(avatar, style: const TextStyle(fontSize: 26))),
        ),
        const SizedBox(height: 4),
        Text(name, style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        Text(status, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
      ],
    );
  }
}
