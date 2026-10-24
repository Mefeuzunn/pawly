import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../models/couple_model.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class CoparentingHubScreen extends StatefulWidget {
  final PetModel pet;
  final CoupleModel couple;
  final VoidCallback onStateChanged;

  const CoparentingHubScreen({
    super.key,
    required this.pet,
    required this.couple,
    required this.onStateChanged,
  });

  @override
  State<CoparentingHubScreen> createState() => _CoparentingHubScreenState();
}

class _CoparentingHubScreenState extends State<CoparentingHubScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _wheelAnim;
  double _wheelAngle = 0.0;
  bool _isSpinning = false;
  final TextEditingController _partnerCodeCtrl = TextEditingController();

  final List<String> _loveDares = [
    'Ona tatlı bir ses kaydı at 🎙️',
    'Birlikte kahve molası verin ☕',
    'Ekranına 5 aşk öpücüğü gönder 💋',
    'Günün en komik fotoğrafını çekip paylaş 📸',
    'Ona sevdiğin bir şarkıyı armağan et 🎵',
    'Bugün en sevdiği tatlıyı hazırla 🍰',
  ];

  @override
  void initState() {
    super.initState();
    _wheelAnim = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
  }

  @override
  void dispose() {
    _wheelAnim.dispose();
    _partnerCodeCtrl.dispose();
    super.dispose();
  }

  void _spinWheel() {
    if (_isSpinning) return;

    AppHaptics.heavyImpact();
    setState(() => _isSpinning = true);

    final rnd = math.Random();
    final targetSpins = 4 + rnd.nextInt(3);
    final selectedIdx = rnd.nextInt(_loveDares.length);
    final targetAngle = _wheelAngle + (targetSpins * 2 * math.pi) + (selectedIdx * (2 * math.pi / _loveDares.length));

    final anim = Tween<double>(begin: _wheelAngle, end: targetAngle).animate(
      CurvedAnimation(parent: _wheelAnim, curve: Curves.easeOutCubic),
    );

    _wheelAnim.reset();
    anim.addListener(() {
      setState(() => _wheelAngle = anim.value);
    });

    _wheelAnim.forward().then((_) {
      setState(() => _isSpinning = false);
      _showDareResult(_loveDares[selectedIdx]);
    });
  }

  void _showDareResult(String dare) {
    AppHaptics.heavyImpact();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          backgroundColor: const Color(0xFFFFF9EE),
          title: Text('Aşk Görevi! 🎡💖', style: AppTypography.displaySmall, textAlign: TextAlign.center),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF261914), width: 2),
                ),
                child: Text(
                  dare,
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Bu görevi eşinle tamamla ve aşk bağınızı güçlendir!',
                style: AppTypography.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            Center(
              child: ClayButton(
                text: 'Görevi Kabul Et! ✨',
                color: const Color(0xFFFF6584),
                onTap: () => Navigator.pop(context),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9EE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Ortak Ebeveynlik Hub 🐾', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Co-Parenting Hero Card (Müge & Efe + Streak + Pet Stage)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFE8EE), Color(0xFFFFF2D6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: const Color(0xFF261914), width: 2.5),
                  boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 4))],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildParentBubble(widget.couple.myName, widget.couple.myAvatar, 'Anne / Bakıcı'),
                        Column(
                          children: [
                            const Text('💖', style: TextStyle(fontSize: 24)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF6584),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '🔥 14 Gün Seri',
                                style: AppTypography.tag.copyWith(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                        _buildParentBubble(widget.couple.partnerName, widget.couple.partnerAvatar, 'Baba / Bakıcı'),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Evolution Stage Progress
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFF261914), width: 1.5),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${widget.pet.name} • ${widget.pet.stageName}',
                                style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${widget.pet.exp} XP • Seviye ${widget.pet.level}',
                                style: AppTypography.tag.copyWith(color: AppColors.secondary, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: widget.pet.stageProgress,
                              backgroundColor: const Color(0xFFF3DFCE),
                              color: const Color(0xFFFF6584),
                              minHeight: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 22),

              // 2. Aşk Çarkıfeleği (Couples Wheel of Fortune)
              Text('Çift Aşk Çarkıfeleği 🎡', style: AppTypography.displaySmall),
              Text('Günün romantik veya tatlı görevini belirle!', style: AppTypography.bodySmall),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF261914), width: 2),
                  boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
                ),
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Transform.rotate(
                          angle: _wheelAngle,
                          child: CustomPaint(
                            size: const Size(190, 190),
                            painter: _WheelPainter(dares: _loveDares),
                          ),
                        ),
                        // Center Pin / Button
                        GestureDetector(
                          onTap: _spinWheel,
                          child: Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: _isSpinning ? Colors.grey : const Color(0xFFFF6584),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF261914), width: 2.5),
                              boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
                            ),
                            child: Center(
                              child: Text(
                                _isSpinning ? '...' : 'ÇEVİR',
                                style: AppTypography.tag.copyWith(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    ClayButton(
                      text: _isSpinning ? 'Çark Dönüyor... 🎡' : 'Aşk Çarkını Çevir! 💖',
                      color: const Color(0xFFFF6584),
                      height: 44,
                      onTap: _spinWheel,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. Ortak Bakım Akışı (Live Care Log Timeline)
              Text('Ortak Bakım Akışı 📋', style: AppTypography.displaySmall),
              Text('Dostunuzla kim ne zaman ilgilendi?', style: AppTypography.bodySmall),
              const SizedBox(height: 12),

              ...widget.pet.careLogs.map((log) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF261914), width: 1.8),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: log.color.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: log.color, width: 1.5),
                          ),
                          child: Center(child: Text(log.emoji, style: const TextStyle(fontSize: 18))),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    log.author,
                                    style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold, color: log.color),
                                  ),
                                  Text(log.timeAgo, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(log.action, style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),

              const SizedBox(height: 20),

              // 4. Partner Eşleşme & Davet Kodu Kartı
              ClayCard(
                color: const Color(0xFFF3E8FF),
                borderColor: const Color(0xFF8B5CF6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Partner Davet Kodu 🔗', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text('Eşine bu kodu vererek ortak bir pet büyütün:', style: AppTypography.bodySmall),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF261914), width: 1.5),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('PAWLY-7749', style: AppTypography.displaySmall.copyWith(fontSize: 18, letterSpacing: 2)),
                          ClayButton(
                            text: 'Kopyala 📋',
                            height: 32,
                            radius: 10,
                            color: const Color(0xFF8B5CF6),
                            onTap: () {
                              AppHaptics.lightImpact();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Davet kodu panoya kopyalandı! 📋✨'),
                                  duration: Duration(seconds: 2),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildParentBubble(String name, String avatar, String role) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF261914), width: 2),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: Center(child: Text(avatar, style: const TextStyle(fontSize: 28))),
        ),
        const SizedBox(height: 4),
        Text(name, style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold)),
        Text(role, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
      ],
    );
  }
}

class _WheelPainter extends CustomPainter {
  final List<String> dares;
  _WheelPainter({required this.dares});

  final List<Color> _colors = const [
    Color(0xFFFFD6E0),
    Color(0xFFFFF2D6),
    Color(0xFFE8F8F0),
    Color(0xFFEAF2FF),
    Color(0xFFF3E8FF),
    Color(0xFFFFE8D6),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final angle = 2 * math.pi / dares.length;

    final linePaint = Paint()
      ..color = const Color(0xFF261914)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;

    for (int i = 0; i < dares.length; i++) {
      final fill = Paint()
        ..color = _colors[i % _colors.length]
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * angle,
        angle,
        true,
        fill,
      );
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * angle,
        angle,
        true,
        linePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WheelPainter oldDelegate) => false;
}
