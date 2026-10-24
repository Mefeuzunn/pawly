import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../widgets/pet_3d_interactive_view.dart';
import '../widgets/status_meter.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../graphics/physics/bubble_physics.dart';
import '../core/utils/haptics.dart';

class PetRoomScreen extends StatefulWidget {
  final PetModel pet;
  final VoidCallback onStateChanged;

  const PetRoomScreen({
    super.key,
    required this.pet,
    required this.onStateChanged,
  });

  @override
  State<PetRoomScreen> createState() => _PetRoomScreenState();
}

class _PetRoomScreenState extends State<PetRoomScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _roomAnim;
  final BubbleEngine _bubbleEngine = BubbleEngine();
  double _elapsedTime = 0.0;

  // Playroom ball position
  Offset _ballPos = const Offset(200, 180);
  bool _isBallThrown = false;

  @override
  void initState() {
    super.initState();
    _roomAnim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() {
        setState(() {
          _elapsedTime += 0.016;
          _bubbleEngine.update(0.016, _elapsedTime);
        });
      })
      ..repeat();
  }

  @override
  void dispose() {
    _roomAnim.dispose();
    super.dispose();
  }

  void _switchRoom(PetRoom room) {
    AppHaptics.selectionClick();
    setState(() {
      widget.pet.currentRoom = room;
      if (room == PetRoom.bedroom) {
        widget.pet.isSleeping = true;
        widget.pet.action = PetAction.sleeping;
      } else {
        widget.pet.isSleeping = false;
        widget.pet.action = PetAction.idle;
      }
    });
    widget.onStateChanged();
  }

  void _handleFeed(String foodName) {
    AppHaptics.heavyImpact();
    setState(() {
      widget.pet.feed(18.0);
    });
    widget.onStateChanged();

    // Reset action to idle after chewing
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted && widget.pet.action == PetAction.eating) {
        setState(() {
          widget.pet.action = PetAction.idle;
        });
      }
    });
  }

  void _rinseBath() {
    AppHaptics.heavyImpact();
    setState(() {
      _bubbleEngine.clear();
      widget.pet.wash(25.0);
    });
    widget.onStateChanged();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.pet.name} tertemiz ve mis gibi koktu! ✨🧼'),
        backgroundColor: AppColors.mint,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _throwBall(Offset tapPos) {
    AppHaptics.mediumImpact();
    setState(() {
      _ballPos = tapPos;
      _isBallThrown = true;
      widget.pet.play(15.0);
    });
    widget.onStateChanged();

    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) {
        setState(() {
          _isBallThrown = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isNight = widget.pet.currentRoom == PetRoom.bedroom && widget.pet.isSleeping;

    return Scaffold(
      backgroundColor: isNight ? AppColors.nightBg : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          widget.pet.name,
          style: AppTypography.displaySmall.copyWith(
            color: isNight ? AppColors.nightText : AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(
              isNight ? Icons.nightlight_round : Icons.wb_sunny_rounded,
              color: isNight ? AppColors.nightAccent : AppColors.secondary,
            ),
            onPressed: () {
              AppHaptics.selectionClick();
              setState(() {
                widget.pet.toggleSleep();
              });
              widget.onStateChanged();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Room Tabs (Kitchen, Bath, Bedroom, Playroom)
            _buildRoomTabs(isNight),

            // Pet Status Meters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: ClayCard(
                color: isNight ? AppColors.nightCard : AppColors.card,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: StatusMeter(
                        label: 'Doygunluk',
                        icon: '🐟',
                        value: widget.pet.hunger,
                        color: AppColors.secondary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: StatusMeter(
                        label: 'Temizlik',
                        icon: '🫧',
                        value: widget.pet.cleanliness,
                        color: AppColors.mint,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: StatusMeter(
                        label: 'Mutluluk',
                        icon: '💖',
                        value: widget.pet.happiness,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Center 3D Stage & Room Interactions
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // 3D Pet Interactive Viewport
                  Pet3DInteractiveView(
                    pet: widget.pet,
                    height: 320,
                    onFoodDropped: _handleFeed,
                    onPetTapped: () => widget.onStateChanged(),
                  ),

                  // Bath Room Floating Bubbles Layer
                  if (widget.pet.currentRoom == PetRoom.bath)
                    Positioned.fill(
                      child: GestureDetector(
                        onPanUpdate: (details) {
                          _bubbleEngine.spawnAt(details.localPosition, count: 2);
                          AppHaptics.lightImpact();
                        },
                        child: CustomPaint(
                          painter: _BubblePainter(bubbles: _bubbleEngine.bubbles),
                        ),
                      ),
                    ),

                  // Playroom Tossable Ball
                  if (widget.pet.currentRoom == PetRoom.playroom)
                    Positioned(
                      left: _ballPos.dx - 22,
                      top: _ballPos.dy - 22,
                      child: GestureDetector(
                        onPanUpdate: (details) {
                          setState(() {
                            _ballPos = Offset(
                              (_ballPos.dx + details.delta.dx).clamp(30.0, MediaQuery.of(context).size.width - 30),
                              (_ballPos.dy + details.delta.dy).clamp(80.0, 300.0),
                            );
                          });
                        },
                        onPanEnd: (_) => _throwBall(_ballPos),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          transform: Matrix4.diagonal3Values(_isBallThrown ? 1.25 : 1.0, _isBallThrown ? 1.25 : 1.0, 1.0),
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(
                            color: Color(0xFFCDDC39),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(color: Color(0x66827717), blurRadius: 10, offset: Offset(0, 4)),
                            ],
                          ),
                          child: const Center(
                            child: Text('🎾', style: TextStyle(fontSize: 24)),
                          ),
                        ),
                      ),
                    ),

                  // Night room Zzz overlay
                  if (isNight)
                    Positioned(
                      top: 40,
                      right: 60,
                      child: Text(
                        'Zzz...',
                        style: AppTypography.displayMedium.copyWith(
                          color: AppColors.nightAccent.withValues(alpha: 0.8),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Room Interactive Controls
            _buildBottomRoomControls(isNight),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomTabs(bool isNight) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isNight ? AppColors.nightCard : AppColors.cardElevated,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isNight ? Colors.white10 : AppColors.border),
      ),
      child: Row(
        children: [
          _buildRoomTabItem(PetRoom.kitchen, 'Mutfak', '🍲', isNight),
          _buildRoomTabItem(PetRoom.bath, 'Banyo', '🛁', isNight),
          _buildRoomTabItem(PetRoom.bedroom, 'Yatak', '🛏️', isNight),
          _buildRoomTabItem(PetRoom.playroom, 'Oyun', '🎾', isNight),
        ],
      ),
    );
  }

  Widget _buildRoomTabItem(PetRoom room, String title, String emoji, bool isNight) {
    final isSelected = widget.pet.currentRoom == room;
    return Expanded(
      child: GestureDetector(
        onTap: () => _switchRoom(room),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (isNight ? AppColors.lavender : AppColors.primary)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 4),
              Text(
                title,
                style: AppTypography.tag.copyWith(
                  color: isSelected ? Colors.white : (isNight ? Colors.white70 : AppColors.textPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomRoomControls(bool isNight) {
    switch (widget.pet.currentRoom) {
      case PetRoom.kitchen:
        return _buildKitchenControls();
      case PetRoom.bath:
        return _buildBathControls();
      case PetRoom.bedroom:
        return _buildBedroomControls(isNight);
      case PetRoom.playroom:
        return _buildPlayroomControls();
    }
  }

  // Kitchen Food Tray
  Widget _buildKitchenControls() {
    final foods = [
      {'name': 'Somon Balığı', 'emoji': '🐟', 'desc': '+20 Doygunluk'},
      {'name': 'Kruvasan', 'emoji': '🥐', 'desc': '+15 Doygunluk'},
      {'name': 'Biftek', 'emoji': '🥩', 'desc': '+25 Doygunluk'},
      {'name': 'Çilekli Süt', 'emoji': '🍼', 'desc': '+15 Enerji'},
      {'name': 'Donut', 'emoji': '🍩', 'desc': '+10 Mutluluk'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Yiyecekleri hayvana sürükleyip yedir:', style: AppTypography.bodySmall),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: foods.map((f) {
                return Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Draggable<String>(
                    data: f['name']!,
                    feedback: Material(
                      color: Colors.transparent,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 10),
                          ],
                        ),
                        child: Text(f['emoji']!, style: const TextStyle(fontSize: 38)),
                      ),
                    ),
                    childWhenDragging: Opacity(
                      opacity: 0.3,
                      child: _buildFoodItemCard(f),
                    ),
                    child: _buildFoodItemCard(f),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFoodItemCard(Map<String, String> f) {
    return ClayCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      radius: 18,
      child: Column(
        children: [
          Text(f['emoji']!, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 4),
          Text(f['name']!, style: AppTypography.tag.copyWith(color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  // Bath Controls
  Widget _buildBathControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: ClayCard(
              padding: const EdgeInsets.all(12),
              color: AppColors.mintLight,
              child: Row(
                children: [
                  const Text('🧼', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Ekrana dokunarak köpük çıkar!',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          ClayButton(
            text: 'Durula ✨',
            color: AppColors.mint,
            icon: const Icon(Icons.shower, color: Colors.white),
            onTap: _rinseBath,
          ),
        ],
      ),
    );
  }

  // Bedroom Controls
  Widget _buildBedroomControls(bool isNight) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ClayButton(
            text: isNight ? 'Uyandır ☀️' : 'Gece Lambasını Kapat & Uyu 🌙',
            color: isNight ? AppColors.secondary : AppColors.lavender,
            onTap: () {
              AppHaptics.mediumImpact();
              setState(() {
                widget.pet.toggleSleep();
              });
              widget.onStateChanged();
            },
          ),
        ],
      ),
    );
  }

  // Playroom Controls
  Widget _buildPlayroomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: ClayCard(
              padding: const EdgeInsets.all(12),
              color: AppColors.skyLight,
              child: Row(
                children: [
                  const Text('🎾', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Topu fırlat, dostun havada kapsın!',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          ClayButton(
            text: 'Fırlat! 🚀',
            color: AppColors.sky,
            onTap: () => _throwBall(const Offset(200, 140)),
          ),
        ],
      ),
    );
  }
}

class _BubblePainter extends CustomPainter {
  final List<FoamBubble> bubbles;
  _BubblePainter({required this.bubbles});

  @override
  void paint(Canvas canvas, Size size) {
    for (final b in bubbles) {
      final paint = Paint()
        ..color = b.tint
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(b.x, b.y), b.radius, paint);

      // White shine arc
      final shinePaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.75)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;
      canvas.drawArc(
        Rect.fromCircle(center: Offset(b.x, b.y), radius: b.radius * 0.7),
        math.pi * 1.1,
        math.pi * 0.45,
        false,
        shinePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BubblePainter oldDelegate) => true;
}
