import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../widgets/clay_card.dart';
import '../core/utils/haptics.dart';

class PetSelectorModal extends StatelessWidget {
  final PetModel pet;
  final Function(PetSpecies) onSelectSpecies;
  final Function(PetOutfit) onSelectOutfit;

  const PetSelectorModal({
    super.key,
    required this.pet,
    required this.onSelectSpecies,
    required this.onSelectOutfit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text('3D Hayvanını Seç', style: AppTypography.displaySmall),
          const SizedBox(height: 4),
          Text('Gerçekçi doku ve sevimli fiziklerle 4 farklı dost', style: AppTypography.bodySmall),
          const SizedBox(height: 16),

          // Species Selection Grid
          Row(
            children: [
              _buildSpeciesCard(PetSpecies.cat, 'Mochi', '🐱', 'Calico Kedi'),
              const SizedBox(width: 12),
              _buildSpeciesCard(PetSpecies.shiba, 'Hachi', '🐕', 'Shiba Inu'),
              const SizedBox(width: 12),
              _buildSpeciesCard(PetSpecies.bear, 'Barnaby', '🧸', 'Ayıcık'),
              const SizedBox(width: 12),
              _buildSpeciesCard(PetSpecies.bunny, 'Usagi', '🐰', 'Tavşan'),
            ],
          ),

          const SizedBox(height: 24),
          Text('3D Aksesuar & Kıyafet', style: AppTypography.displaySmall),
          const SizedBox(height: 12),

          // Outfits Selection
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildOutfitChip(PetOutfit.none, 'Yok', '✨'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.bowTie, 'Papyon', '🎀'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.partyHat, 'Parti Şapkası', '🎉'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.nightCap, 'Uyku Başlığı', '🌙'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.aviatorGoggles, 'Pilot Gözlüğü', '🥽'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.flowerCrown, 'Çiçek Tacı', '🌸'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.detectiveHat, 'Dedektif', '🕵️'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.sailorShirt, 'Denizci', '⚓'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.pinkDress, 'Prenses Elbisesi', '👗'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.greenTracksuit, 'Spor Takım', '🏃'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.bucketHat, 'Bucket Şapka', '👒'),
                const SizedBox(width: 8),
                _buildOutfitChip(PetOutfit.heartGlasses, 'Kalp Gözlük', '🕶️'),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSpeciesCard(PetSpecies species, String name, String emoji, String desc) {
    final isSelected = pet.species == species;
    return Expanded(
      child: ClayCard(
        onTap: () {
          AppHaptics.selectionClick();
          onSelectSpecies(species);
        },
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        color: isSelected ? AppColors.primaryLight : AppColors.card,
        borderColor: isSelected ? AppColors.primary : AppColors.border,
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 6),
            Text(
              name,
              style: AppTypography.tag.copyWith(
                color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: AppTypography.bodySmall.copyWith(fontSize: 10),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOutfitChip(PetOutfit outfit, String name, String icon) {
    final isSelected = pet.outfit == outfit;
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        onSelectOutfit(outfit);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryDark : AppColors.border,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.clayDark.withValues(alpha: 0.2),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 6),
            Text(
              name,
              style: AppTypography.tag.copyWith(
                color: isSelected ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
