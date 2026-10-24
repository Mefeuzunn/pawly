import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/adventure_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class AdventureScreen extends StatefulWidget {
  final AdventureState adventure;
  final VoidCallback onStateChanged;

  const AdventureScreen({
    super.key,
    required this.adventure,
    required this.onStateChanged,
  });

  @override
  State<AdventureScreen> createState() => _AdventureScreenState();
}

class _AdventureScreenState extends State<AdventureScreen> {
  Timer? _countdownTimer;
  int _secondsRemaining = 0;

  @override
  void initState() {
    super.initState();
    _checkReturn();
  }

  void _checkReturn() {
    if (widget.adventure.isTraveling && widget.adventure.returnTime != null) {
      final diff = widget.adventure.returnTime!.difference(DateTime.now()).inSeconds;
      if (diff > 0) {
        _secondsRemaining = diff;
        _countdownTimer?.cancel();
        _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
          if (_secondsRemaining > 0) {
            setState(() => _secondsRemaining--);
          } else {
            t.cancel();
            _completeTrip();
          }
        });
      } else {
        _completeTrip();
      }
    }
  }

  void _completeTrip() {
    setState(() {
      widget.adventure.isTraveling = false;
      if (widget.adventure.currentDestination != null) {
        widget.adventure.album.insert(
          0,
          PolaroidPhoto(
            id: 'p_${DateTime.now().millisecondsSinceEpoch}',
            destinationName: widget.adventure.currentDestination!.name,
            landmark: widget.adventure.currentDestination!.landmark,
            date: 'Yeni Döndü!',
            note: '${widget.adventure.currentDestination!.name} gezisinden harika bir anı ve ${widget.adventure.currentDestination!.souvenirName} getirdi! 🎁',
            petEmoji: '🐱✈️',
          ),
        );
      }
      widget.adventure.currentDestination = null;
    });
    widget.onStateChanged();
  }

  void _startTrip(AdventureDestination dest) {
    AppHaptics.heavyImpact();
    setState(() {
      widget.adventure.isTraveling = true;
      widget.adventure.currentDestination = dest;
      _secondsRemaining = 25; // 25 seconds for fast in-app test
      widget.adventure.returnTime = DateTime.now().add(const Duration(seconds: 25));
    });
    _checkReturn();
    widget.onStateChanged();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Pet Maceraları ✈️', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Active Trip Banner
              if (widget.adventure.isTraveling) ...[
                ClayCard(
                  color: AppColors.skyLight,
                  borderColor: AppColors.sky.withValues(alpha: 0.4),
                  child: Row(
                    children: [
                      const Text('✈️', style: TextStyle(fontSize: 36)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${widget.adventure.currentDestination?.name} Yolculuğunda!',
                              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Dönüşe kalan süre: $_secondsRemaining saniye',
                              style: AppTypography.tag.copyWith(color: AppColors.sky),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Destinations Section
              Text('Yeni Bir Maceraya Gönder', style: AppTypography.displaySmall),
              const SizedBox(height: 12),
              SizedBox(
                height: 180,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: AdventureState.destinations.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 14),
                  itemBuilder: (context, i) {
                    final dest = AdventureState.destinations[i];
                    return SizedBox(
                      width: 160,
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(dest.souvenirEmoji, style: const TextStyle(fontSize: 24)),
                                Text(dest.country, style: AppTypography.tag.copyWith(color: AppColors.textMuted)),
                              ],
                            ),
                            const Spacer(),
                            Text(dest.name, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                            Text(dest.landmark, style: AppTypography.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 8),
                            ClayButton(
                              text: widget.adventure.isTraveling ? 'Meşgul' : 'Gönder',
                              height: 34,
                              radius: 12,
                              color: widget.adventure.isTraveling ? Colors.grey : AppColors.sky,
                              onTap: widget.adventure.isTraveling ? () {} : () => _startTrip(dest),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 28),

              // Polaroid Travel Album
              Text('Gezi Albümü & Hatıralar 📸', style: AppTypography.displaySmall),
              const SizedBox(height: 12),

              ...widget.adventure.album.map((p) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: ClayCard(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Polaroid photo frame
                        Container(
                          height: 160,
                          decoration: BoxDecoration(
                            color: AppColors.backgroundSecondary,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(p.petEmoji, style: const TextStyle(fontSize: 48)),
                                const SizedBox(height: 6),
                                Text(
                                  p.landmark,
                                  style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(p.destinationName, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                            Text(p.date, style: AppTypography.bodySmall),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(p.note, style: AppTypography.bodyMedium),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}
