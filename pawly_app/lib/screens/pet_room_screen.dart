import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';
import '../widgets/pet_3d_interactive_view.dart';
import '../graphics/kawaii_art.dart';
import '../graphics/cozy_room_painter.dart';
import '../widgets/status_meter.dart';
import '../widgets/clay_card.dart';
import '../widgets/clay_button.dart';
import '../graphics/physics/bubble_physics.dart';
import '../core/utils/haptics.dart';

enum RoomViewMode { kawaii2D, clay3D, tamagotchi }

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
  RoomViewMode _viewMode = RoomViewMode.kawaii2D;

  Offset _ballPos = const Offset(200, 180);
  bool _isBallThrown = false;
  double _squish = 0.0;
  RoomWeather _weather = RoomWeather.sunny;
  int _speechIndex = 0;
  final List<String> _petPhrases = [
    'Mefe seni çok seviyor! ❤️',
    'Bugün çok tatlısın Müge! ✨',
    'Karnım mırıldıyor, biraz somon balığı var mı? 🐟',
    'Beni sevdikçe daha çok gülümsüyorum! 🌸',
    'Hadi birlikte oyun oynayalım! 🎾',
    'Seninle geçirdiğim her an çok huzurlu... 🥰',
  ];

  @override
  void initState() {
    super.initState();
    _roomAnim = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..addListener(() {
        setState(() {
          _elapsedTime += 0.016;
          _bubbleEngine.update(0.016, _elapsedTime);
          if (_squish > 0.01) {
            _squish *= 0.88;
          } else {
            _squish = 0.0;
          }
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
      _squish = 1.0;
    });
    widget.onStateChanged();

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
      _squish = 0.8;
    });
    widget.onStateChanged();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.pet.name} banyodan mis gibi ve tertemiz çıktı! 🧼🫧'),
        backgroundColor: const Color(0xFF38C793),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _throwBall(Offset tapPos) {
    AppHaptics.mediumImpact();
    setState(() {
      _ballPos = tapPos;
      _isBallThrown = true;
      _squish = 0.9;
      widget.pet.play(15.0);
    });
    widget.onStateChanged();

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _isBallThrown = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isNight = widget.pet.currentRoom == PetRoom.bedroom && widget.pet.isSleeping;

    return Scaffold(
      backgroundColor: isNight ? const Color(0xFF131424) : AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          children: [
            Text(
              "kitty's home • ${widget.pet.name}",
              style: AppTypography.displaySmall.copyWith(
                color: isNight ? Colors.white : AppColors.textPrimary,
                fontSize: 18,
              ),
            ),
            Text(
              widget.pet.speciesName,
              style: AppTypography.bodySmall.copyWith(fontSize: 11),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          // View Mode Selector (2D Kawaii / 3D Clay / Tamagotchi)
          PopupMenuButton<RoomViewMode>(
            icon: const Icon(Icons.style_rounded, color: AppColors.primary),
            onSelected: (mode) => setState(() => _viewMode = mode),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: RoomViewMode.kawaii2D,
                child: Row(
                  children: [
                    Text('🎨'),
                    SizedBox(width: 8),
                    Text('Widgetable 2D Kawaii'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: RoomViewMode.clay3D,
                child: Row(
                  children: [
                    Text('🪐'),
                    SizedBox(width: 8),
                    Text('3D Clay Motoru'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: RoomViewMode.tamagotchi,
                child: Row(
                  children: [
                    Text('👾'),
                    SizedBox(width: 8),
                    Text('Tamagotchi Cihazı'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Room Selection Tabs (Mutfak, Banyo, Yatak, Salon)
            _buildRoomTabs(isNight),

            // Weather Selector (Güneşli, Yağmurlu, Karlı, Yıldızlı)
            _buildWeatherSelector(isNight),

            // Pet Status Pill Meters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              child: ClayCard(
                color: isNight ? const Color(0xFF1E1E38) : Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  children: [
                    Expanded(child: StatusMeter(label: 'Doygunluk', icon: '🍗', value: widget.pet.hunger, color: AppColors.secondary)),
                    const SizedBox(width: 12),
                    Expanded(child: StatusMeter(label: 'Temizlik', icon: '🫧', value: widget.pet.cleanliness, color: AppColors.mint)),
                    const SizedBox(width: 12),
                    Expanded(child: StatusMeter(label: 'Mutluluk', icon: '💖', value: widget.pet.happiness, color: AppColors.primary)),
                  ],
                ),
              ),
            ),

            // Main Room Canvas Viewport
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // 1. Cozy Room Interior Painter
                  Positioned.fill(
                    child: CustomPaint(
                      painter: CozyRoomPainter(
                        room: widget.pet.currentRoom,
                        isNight: isNight || _weather == RoomWeather.starryNight,
                        animationTime: _elapsedTime,
                        weather: _weather,
                      ),
                    ),
                  ),

                  // 2. Pet Render (Kawaii 2D or 3D Clay Viewport)
                  if (_viewMode == RoomViewMode.clay3D)
                    Positioned.fill(
                      child: Pet3DInteractiveView(
                        pet: widget.pet,
                        height: 300,
                        onFoodDropped: _handleFeed,
                        onPetTapped: () {
                          setState(() => _squish = 1.0);
                          widget.onStateChanged();
                        },
                      ),
                    )
                  else
                    Positioned(
                      bottom: widget.pet.currentRoom == PetRoom.kitchen ? 80 : 50,
                      child: DragTarget<String>(
                        onAcceptWithDetails: (details) => _handleFeed(details.data),
                        builder: (context, candidateData, _) {
                          return GestureDetector(
                            onTap: () {
                              AppHaptics.mediumImpact();
                              setState(() {
                                _squish = 1.0;
                                _speechIndex = (_speechIndex + 1) % _petPhrases.length;
                                widget.pet.play(5.0);
                              });
                              widget.onStateChanged();
                            },
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Speech Bubble above Pet
                                Positioned(
                                  top: -24,
                                  child: GestureDetector(
                                    onTap: () {
                                      AppHaptics.selectionClick();
                                      setState(() {
                                        _speechIndex = (_speechIndex + 1) % _petPhrases.length;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFF261914), width: 2),
                                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3))],
                                      ),
                                      child: Text(
                                        widget.pet.isSleeping
                                            ? 'Zzz... Tatlı rüyalar 🌙'
                                            : widget.pet.action == PetAction.eating
                                                ? 'Çok lezzetli! Ham ham 😋'
                                                : widget.pet.hunger < 40
                                                    ? 'Karnım gurulduyor! Acıktım 🥺'
                                                    : _petPhrases[_speechIndex],
                                        style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ),
                                ),

                                // 2D Kawaii Mascot
                                CustomPaint(
                                  size: const Size(220, 220),
                                  painter: KawaiiPetPainter(
                                    species: widget.pet.species,
                                    action: widget.pet.action,
                                    outfit: widget.pet.outfit,
                                    animationTime: _elapsedTime,
                                    isSleeping: widget.pet.isSleeping,
                                    squish: _squish,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),

                  // 3. Bath Room Floating Bubbles
                  if (widget.pet.currentRoom == PetRoom.bath)
                    Positioned.fill(
                      child: GestureDetector(
                        onPanUpdate: (details) {
                          _bubbleEngine.spawnAt(details.localPosition, count: 2);
                          AppHaptics.lightImpact();
                        },
                        child: CustomPaint(painter: _BubblePainter(bubbles: _bubbleEngine.bubbles)),
                      ),
                    ),

                  // 4. Playroom Tossable Ball
                  if (widget.pet.currentRoom == PetRoom.playroom)
                    Positioned(
                      left: _ballPos.dx - 24,
                      top: _ballPos.dy - 24,
                      child: GestureDetector(
                        onPanUpdate: (details) {
                          setState(() {
                            _ballPos = Offset(
                              (_ballPos.dx + details.delta.dx).clamp(30.0, MediaQuery.of(context).size.width - 30),
                              (_ballPos.dy + details.delta.dy).clamp(80.0, 320.0),
                            );
                          });
                        },
                        onPanEnd: (_) => _throwBall(_ballPos),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          transform: Matrix4.diagonal3Values(_isBallThrown ? 1.3 : 1.0, _isBallThrown ? 1.3 : 1.0, 1.0),
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: Color(0xFFD4E157),
                            shape: BoxShape.circle,
                            border: Border.fromBorderSide(BorderSide(color: Color(0xFF261914), width: 2.5)),
                            boxShadow: [
                              BoxShadow(color: Color(0x66261914), blurRadius: 8, offset: Offset(0, 4)),
                            ],
                          ),
                          child: const Center(child: Text('🎾', style: TextStyle(fontSize: 24))),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Interactive Room Controls (Food Tray, Sponge, Bed Light, Ball)
            _buildBottomRoomControls(isNight),
            const SizedBox(height: 10),
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
        color: isNight ? const Color(0xFF1E1E38) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF261914), width: 2),
      ),
      child: Row(
        children: [
          _buildRoomTabItem(PetRoom.kitchen, 'Mutfak', '🍲', isNight),
          _buildRoomTabItem(PetRoom.bath, 'Banyo', '🛁', isNight),
          _buildRoomTabItem(PetRoom.bedroom, 'Yatak', '🛏️', isNight),
          _buildRoomTabItem(PetRoom.playroom, 'Salon', '🎾', isNight),
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
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFFF6584) : Colors.transparent,
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

  Widget _buildWeatherSelector(bool isNight) {
    final weathers = [
      {'weather': RoomWeather.sunny, 'label': 'Güneşli', 'icon': '☀️'},
      {'weather': RoomWeather.rainy, 'label': 'Yağmurlu', 'icon': '🌧️'},
      {'weather': RoomWeather.snowy, 'label': 'Karlı', 'icon': '❄️'},
      {'weather': RoomWeather.starryNight, 'label': 'Yıldızlı', 'icon': '🌙'},
    ];

    return Container(
      margin: const EdgeInsets.only(left: 20, right: 20, top: 4, bottom: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: weathers.map((w) {
          final isSel = _weather == w['weather'];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () {
                AppHaptics.selectionClick();
                setState(() => _weather = w['weather'] as RoomWeather);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isSel ? const Color(0xFFFFD166) : (isNight ? const Color(0xFF252646) : Colors.white),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSel ? const Color(0xFF261914) : const Color(0xFFDCD2C4),
                    width: isSel ? 1.8 : 1.2,
                  ),
                  boxShadow: isSel
                      ? const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 1.5))]
                      : null,
                ),
                child: Row(
                  children: [
                    Text(w['icon'] as String, style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 4),
                    Text(
                      w['label'] as String,
                      style: AppTypography.tag.copyWith(
                        color: isSel ? const Color(0xFF261914) : (isNight ? Colors.white70 : AppColors.textPrimary),
                        fontSize: 10,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
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
      {'name': 'Izgara Somon', 'emoji': '🐟', 'pts': '+20 Doygunluk'},
      {'name': 'Tereyağlı Kruvasan', 'emoji': '🥐', 'pts': '+15 Doygunluk'},
      {'name': 'Biftek', 'emoji': '🥩', 'pts': '+25 Doygunluk'},
      {'name': 'Çilekli Süt', 'emoji': '🍼', 'pts': '+15 Enerji'},
      {'name': 'Donut', 'emoji': '🍩', 'pts': '+10 Mutluluk'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Yiyecekleri hayvana doğru sürükle:', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
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
                          border: Border.all(color: const Color(0xFF261914), width: 2),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
                        ),
                        child: Text(f['emoji']!, style: const TextStyle(fontSize: 40)),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF261914), width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        children: [
          Text(f['emoji']!, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 2),
          Text(f['name']!, style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontSize: 11)),
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
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE3F8EE),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF261914), width: 2),
              ),
              child: Row(
                children: [
                  const Text('🧼', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Küvetin içinde parmağını gezdirerek köpükler oluştur!',
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
            color: const Color(0xFF38C793),
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
            text: isNight ? 'Uyandır ☀️' : 'Komodin Lambasını Kapat & Uyu 🌙',
            color: isNight ? const Color(0xFFFFA34E) : const Color(0xFF8B5CF6),
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
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F1FF),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF261914), width: 2),
              ),
              child: Row(
                children: [
                  const Text('🎾', style: TextStyle(fontSize: 26)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tenis topunu havaya fırlat, dostun kapsın!',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          ClayButton(
            text: 'Topu Fırlat! 🚀',
            color: const Color(0xFF4F8CFF),
            onTap: () => _throwBall(const Offset(190, 150)),
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
      canvas.drawCircle(Offset(b.x, b.y), b.radius, Paint()..color = const Color(0xFF261914)..style = PaintingStyle.stroke..strokeWidth = 1.5);
      // Shine
      canvas.drawCircle(Offset(b.x - b.radius * 0.35, b.y - b.radius * 0.35), b.radius * 0.25, Paint()..color = Colors.white);
    }
  }

  @override
  bool shouldRepaint(covariant _BubblePainter oldDelegate) => true;
}
