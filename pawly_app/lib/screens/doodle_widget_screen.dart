import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../widgets/clay_button.dart';
import '../core/utils/haptics.dart';

class DrawnLine {
  final List<Offset> points;
  final Color color;
  final double strokeWidth;

  DrawnLine({
    required this.points,
    required this.color,
    required this.strokeWidth,
  });
}

class DoodleWidgetScreen extends StatefulWidget {
  final VoidCallback onDoodleSent;

  const DoodleWidgetScreen({super.key, required this.onDoodleSent});

  @override
  State<DoodleWidgetScreen> createState() => _DoodleWidgetScreenState();
}

class _DoodleWidgetScreenState extends State<DoodleWidgetScreen> {
  final List<DrawnLine> _lines = [];
  DrawnLine? _currentLine;
  Color _selectedColor = const Color(0xFFFF6584);
  double _strokeWidth = 4.0;

  final List<Color> _palette = const [
    Color(0xFFFF6584), // Love Pink
    Color(0xFFFFA34E), // Peach
    Color(0xFFFFD166), // Butter Yellow
    Color(0xFF38C793), // Mint
    Color(0xFF4F8CFF), // Sky Blue
    Color(0xFF8B5CF6), // Lavender
    Color(0xFF261914), // Dark Chocolate
  ];

  void _sendDoodle() {
    AppHaptics.heavyImpact();
    widget.onDoodleSent();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Çiziminiz eşinizin ana ekranına başarıyla gönderildi! 🎨💌'),
        backgroundColor: Color(0xFF38C793),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _addStamp(String stamp) {
    AppHaptics.selectionClick();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$stamp çıkartması eklendi!'),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9EE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Canlı Çizim Widgetı 🎨', style: AppTypography.displaySmall),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.undo_rounded, color: AppColors.textPrimary),
            onPressed: () {
              if (_lines.isNotEmpty) {
                AppHaptics.selectionClick();
                setState(() => _lines.removeLast());
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFE63946)),
            onPressed: () {
              AppHaptics.mediumImpact();
              setState(() => _lines.clear());
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              Text(
                'Eşinin ekranında anında görünecek sevimli bir not veya kalp çiz!',
                style: AppTypography.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),

              // Drawing Canvas Area (White Tablet Frame)
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: const Color(0xFF261914), width: 3),
                    boxShadow: const [
                      BoxShadow(color: Color(0xFF261914), offset: Offset(0, 4)),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(29),
                    child: GestureDetector(
                      onPanStart: (details) {
                        setState(() {
                          _currentLine = DrawnLine(
                            points: [details.localPosition],
                            color: _selectedColor,
                            strokeWidth: _strokeWidth,
                          );
                          _lines.add(_currentLine!);
                        });
                      },
                      onPanUpdate: (details) {
                        setState(() {
                          _currentLine?.points.add(details.localPosition);
                        });
                      },
                      onPanEnd: (_) {
                        setState(() => _currentLine = null);
                      },
                      child: CustomPaint(
                        painter: _DoodlePainter(lines: _lines),
                        child: _lines.isEmpty
                            ? Center(
                                child: Text(
                                  'Parmağınla buraya çiz... ✍️✨',
                                  style: AppTypography.tag.copyWith(color: AppColors.textMuted),
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Stamp Stickers Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildStampButton('❤️'),
                  _buildStampButton('🐾'),
                  _buildStampButton('⭐'),
                  _buildStampButton('💋'),
                  _buildStampButton('🌸'),
                  _buildStampButton('💌'),
                ],
              ),

              const SizedBox(height: 14),

              // Color Palette Swatches & Brush Sizes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Palette
                  Row(
                    children: _palette.map((c) {
                      final isSel = _selectedColor == c;
                      return GestureDetector(
                        onTap: () {
                          AppHaptics.selectionClick();
                          setState(() => _selectedColor = c);
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: c,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSel ? const Color(0xFF261914) : Colors.transparent,
                              width: isSel ? 3 : 1,
                            ),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  // Stroke Width Toggle
                  Row(
                    children: [3.0, 6.0, 10.0].map((w) {
                      final isSel = _strokeWidth == w;
                      return GestureDetector(
                        onTap: () {
                          AppHaptics.selectionClick();
                          setState(() => _strokeWidth = w);
                        },
                        child: Container(
                          margin: const EdgeInsets.only(left: 6),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isSel ? const Color(0xFF261914) : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF261914), width: 1.5),
                          ),
                          child: Center(
                            child: Container(
                              width: w * 0.8,
                              height: w * 0.8,
                              decoration: BoxDecoration(
                                color: isSel ? Colors.white : const Color(0xFF261914),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Send Button
              ClayButton(
                text: 'Eşimin Ekranına Gönder 💌🚀',
                color: const Color(0xFFFF6584),
                height: 52,
                onTap: _sendDoodle,
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStampButton(String emoji) {
    return GestureDetector(
      onTap: () => _addStamp(emoji),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF261914), width: 1.5),
          boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 2))],
        ),
        child: Text(emoji, style: const TextStyle(fontSize: 20)),
      ),
    );
  }
}

class _DoodlePainter extends CustomPainter {
  final List<DrawnLine> lines;
  _DoodlePainter({required this.lines});

  @override
  void paint(Canvas canvas, Size size) {
    for (final line in lines) {
      if (line.points.length < 2) continue;

      final paint = Paint()
        ..color = line.color
        ..strokeWidth = line.strokeWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      final path = Path()..moveTo(line.points.first.dx, line.points.first.dy);
      for (int i = 1; i < line.points.length; i++) {
        path.lineTo(line.points[i].dx, line.points[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _DoodlePainter oldDelegate) => true;
}
