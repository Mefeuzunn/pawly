import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/couple_model.dart';
import '../models/pet_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';
import 'coparenting_hub_screen.dart';

class CoupleStatusScreen extends StatefulWidget {
  final CoupleModel couple;
  final PetModel? pet;
  final VoidCallback onStateChanged;

  const CoupleStatusScreen({
    super.key,
    required this.couple,
    this.pet,
    required this.onStateChanged,
  });

  @override
  State<CoupleStatusScreen> createState() => _CoupleStatusScreenState();
}

class _CoupleStatusScreenState extends State<CoupleStatusScreen> {
  final TextEditingController _statusCtrl = TextEditingController();
  final TextEditingController _qaCtrl = TextEditingController();

  @override
  void dispose() {
    _statusCtrl.dispose();
    _qaCtrl.dispose();
    super.dispose();
  }

  void _updateStatus() {
    if (_statusCtrl.text.isNotEmpty) {
      setState(() {
        widget.couple.myStatus = _statusCtrl.text;
      });
      _statusCtrl.clear();
      Navigator.pop(context);
      widget.onStateChanged();
      AppHaptics.mediumImpact();
    }
  }

  void _showStatusDialog() {
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
              Text('Canlı Durumunu Güncelle', style: AppTypography.displaySmall),
              const SizedBox(height: 10),
              TextField(
                controller: _statusCtrl,
                decoration: InputDecoration(
                  hintText: 'Şu an ne yapıyorsun? (örn: Kahve içiyor ☕)',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),
              ClayButton(
                text: 'Durumu Kaydet ✨',
                color: AppColors.primary,
                onTap: _updateStatus,
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
        title: Text('Çift & Bağlantı 💕', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Distance & Together Mode Card
              ClayCard(
                color: AppColors.cardElevated,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: const BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
                              child: Text(widget.couple.myAvatar, style: const TextStyle(fontSize: 32)),
                            ),
                            const SizedBox(height: 6),
                            Text(widget.couple.myName, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                            Text(widget.couple.myStatus, style: AppTypography.bodySmall, maxLines: 1),
                          ],
                        ),
                        Column(
                          children: [
                            const Text('💖', style: TextStyle(fontSize: 24)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${widget.couple.distanceKm} km',
                                style: AppTypography.tag.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: const BoxDecoration(color: AppColors.secondaryLight, shape: BoxShape.circle),
                              child: Text(widget.couple.partnerAvatar, style: const TextStyle(fontSize: 32)),
                            ),
                            const SizedBox(height: 6),
                            Text(widget.couple.partnerName, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                            Text(widget.couple.partnerStatus, style: AppTypography.bodySmall, maxLines: 1),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ClayButton(
                      text: 'Durumumu Paylaş 💬',
                      height: 40,
                      radius: 14,
                      color: AppColors.primary,
                      onTap: _showStatusDialog,
                    ),
                  ],
                ),
              ),

              if (widget.pet != null) ...[
                const SizedBox(height: 16),
                ClayCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CoparentingHubScreen(
                          pet: widget.pet!,
                          couple: widget.couple,
                          onStateChanged: widget.onStateChanged,
                        ),
                      ),
                    );
                  },
                  color: const Color(0xFFFFF7E6),
                  borderColor: const Color(0xFFFF9F1C),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFE0B2),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFF261914), width: 1.8),
                        ),
                        child: const Text('🐾', style: TextStyle(fontSize: 26)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text('Ortak Patili Ebeveynliği', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFF6584),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text('ÇİFT MODU', style: AppTypography.tag.copyWith(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${widget.pet!.name} ile 24 günlük kesintisiz seri! • Çarkı çevir',
                              style: AppTypography.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF261914)),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // 2. Sleep VS Comparative Card & Trophy
              Text('Uyku Düzeni Karşılaştırması 🌙', style: AppTypography.displaySmall),
              const SizedBox(height: 10),
              ClayCard(
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Text('🏆', style: TextStyle(fontSize: 36)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Dün Gece Şampiyonu: ${widget.couple.partnerSleepHours > widget.couple.mySleepHours ? widget.couple.partnerName : widget.couple.myName}',
                                style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${widget.couple.partnerSleepHours} saat dinlendirici uyku',
                                style: AppTypography.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildSleepBar(widget.couple.myName, widget.couple.mySleepHours, AppColors.primary),
                    const SizedBox(height: 10),
                    _buildSleepBar(widget.couple.partnerName, widget.couple.partnerSleepHours, AppColors.lavender),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. Couples Daily Q&A Card
              Text('Günün Çift Sorusu 💌', style: AppTypography.displaySmall),
              const SizedBox(height: 10),
              ClayCard(
                color: AppColors.primaryLight,
                borderColor: AppColors.primary.withValues(alpha: 0.3),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('❓', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            widget.couple.dailyQuestion,
                            style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (widget.couple.myAnswer != null) ...[
                      _buildAnswerBubble('${widget.couple.myName}:', widget.couple.myAnswer!, Colors.white),
                      const SizedBox(height: 10),
                    ],
                    if (widget.couple.partnerAnswer != null) ...[
                      _buildAnswerBubble('${widget.couple.partnerName}:', widget.couple.partnerAnswer!, const Color(0xFFFFF0F5)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSleepBar(String name, double hours, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(name, style: AppTypography.tag.copyWith(color: AppColors.textPrimary)),
            Text('${hours}s', style: AppTypography.tag.copyWith(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: (hours / 10.0).clamp(0.0, 1.0),
            backgroundColor: color.withValues(alpha: 0.2),
            color: color,
            minHeight: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildAnswerBubble(String author, String answer, Color bg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(author, style: AppTypography.tag.copyWith(color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(answer, style: AppTypography.bodyMedium),
        ],
      ),
    );
  }
}
