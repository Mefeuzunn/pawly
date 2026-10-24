import 'package:flutter/material.dart';
import '../core/theme/app_typography.dart';
import '../models/couple_model.dart';
import '../models/pet_model.dart';
import '../core/utils/haptics.dart';

class DynamicIslandPill extends StatefulWidget {
  final PetModel pet;
  final CoupleModel couple;
  final VoidCallback onQuickMissYou;

  const DynamicIslandPill({
    super.key,
    required this.pet,
    required this.couple,
    required this.onQuickMissYou,
  });

  @override
  State<DynamicIslandPill> createState() => _DynamicIslandPillState();
}

class _DynamicIslandPillState extends State<DynamicIslandPill> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        AppHaptics.selectionClick();
        setState(() => _isExpanded = !_isExpanded);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutBack,
        width: _isExpanded ? 340 : 210,
        height: _isExpanded ? 80 : 38,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF18151D),
          borderRadius: BorderRadius.circular(_isExpanded ? 24 : 20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: _isExpanded ? _buildExpanded() : _buildCompact(),
      ),
    );
  }

  Widget _buildCompact() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(widget.pet.moodEmoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 6),
            Text(
              widget.pet.name,
              style: AppTypography.tag.copyWith(color: Colors.white, fontSize: 13),
            ),
          ],
        ),
        Row(
          children: [
            Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              widget.couple.partnerName,
              style: AppTypography.tag.copyWith(color: const Color(0xFFE5E7EB), fontSize: 13),
            ),
            const SizedBox(width: 4),
            Text(widget.couple.partnerAvatar, style: const TextStyle(fontSize: 14)),
          ],
        ),
      ],
    );
  }

  Widget _buildExpanded() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Text(widget.pet.moodEmoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 6),
                Text(
                  '${widget.pet.name} Mutlu!',
                  style: AppTypography.bodySmall.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${widget.couple.partnerName} ile mesafe: ${widget.couple.distanceKm} km',
              style: AppTypography.tag.copyWith(color: const Color(0xFF9CA3AF)),
            ),
          ],
        ),
        GestureDetector(
          onTap: () {
            AppHaptics.heavyImpact();
            widget.onQuickMissYou();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF6584), Color(0xFFFF4081)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Text('❤️', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                Text(
                  'Özle!',
                  style: AppTypography.tag.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
