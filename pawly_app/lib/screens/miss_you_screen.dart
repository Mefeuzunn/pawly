import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/couple_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../widgets/floating_hearts_burst.dart';
import '../core/utils/haptics.dart';

class MissYouScreen extends StatefulWidget {
  final CoupleModel couple;
  final VoidCallback onMissYouSent;

  const MissYouScreen({
    super.key,
    required this.couple,
    required this.onMissYouSent,
  });

  @override
  State<MissYouScreen> createState() => _MissYouScreenState();
}

class _MissYouScreenState extends State<MissYouScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  final FloatingHeartsBurstController _burstController = FloatingHeartsBurstController();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _sendMissYou(TapDownDetails details) {
    AppHaptics.heavyImpact();
    setState(() {
      widget.couple.sendMissYou();
    });
    _burstController.burstAt(details.globalPosition, count: 24);
    widget.onMissYouSent();
  }

  void _sendLoveBomb() {
    AppHaptics.heavyImpact();
    setState(() {
      widget.couple.missYouCount += 10;
      widget.couple.todayMissYouCount += 10;
    });
    final size = MediaQuery.of(context).size;
    _burstController.burstAt(Offset(size.width / 2, size.height / 2), count: 50);
    widget.onMissYouSent();
  }

  @override
  Widget build(BuildContext context) {
    return FloatingHeartsBurstOverlay(
      controller: _burstController,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text('Seni Özledim 💖', style: AppTypography.displaySmall),
          centerTitle: true,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 12),
                // Couple Status Card
                ClayCard(
                  color: AppColors.primaryLight,
                  borderColor: AppColors.primary.withValues(alpha: 0.3),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Text(widget.couple.partnerAvatar, style: const TextStyle(fontSize: 28)),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${widget.couple.partnerName} Seni Düşünüyor...',
                              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Mesafe: ${widget.couple.distanceKm} km • Durum: ${widget.couple.partnerStatus}',
                              style: AppTypography.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Center 3D Clay Heart with Pulse Animation
                GestureDetector(
                  onTapDown: _sendMissYou,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      final scale = 1.0 + _pulseController.value * 0.08;
                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 220,
                          height: 220,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const RadialGradient(
                              colors: [
                                Color(0xFFFF859E),
                                Color(0xFFFF5277),
                                Color(0xFFE82E55),
                              ],
                              center: Alignment(-0.3, -0.3),
                              radius: 0.9,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF5277).withValues(alpha: 0.45),
                                blurRadius: 28,
                                offset: const Offset(0, 14),
                              ),
                              const BoxShadow(
                                color: Colors.white,
                                blurRadius: 10,
                                offset: Offset(-4, -4),
                              ),
                            ],
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              const Text('❤️', style: TextStyle(fontSize: 100)),
                              Positioned(
                                bottom: 28,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Text(
                                    'DOKUN!',
                                    style: AppTypography.tag.copyWith(
                                      color: const Color(0xFFE82E55),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                // Counters
                Text(
                  '${widget.couple.missYouCount}',
                  style: AppTypography.displayLarge.copyWith(
                    fontSize: 48,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Toplam Özlem Gönderimi (Bugün: ${widget.couple.todayMissYouCount})',
                  style: AppTypography.bodySmall,
                ),

                const Spacer(),

                // Love Bomb CTA Button
                ClayButton(
                  text: 'Aşk Bombası Patlat! 💣💖',
                  color: AppColors.primary,
                  height: 56,
                  onTap: _sendLoveBomb,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
