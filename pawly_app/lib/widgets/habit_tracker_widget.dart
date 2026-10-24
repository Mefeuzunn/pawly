import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/utils/haptics.dart';

class HabitTrackerWidget extends StatefulWidget {
  const HabitTrackerWidget({super.key});

  @override
  State<HabitTrackerWidget> createState() => _HabitTrackerWidgetState();
}

class _HabitTrackerWidgetState extends State<HabitTrackerWidget> {
  final List<String> _days = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']; // Days of week

  final List<Map<String, dynamic>> _habits = [
    {
      'title': 'Su Tüketimi (2L)',
      'icon': '💧',
      'color': const Color(0xFF4F8CFF),
      'status': [2, 2, 2, 2, 2, 1, 0], // 0: empty, 1: half, 2: full
    },
    {
      'title': 'Ruh Hali & Sevgi',
      'icon': '💖',
      'color': const Color(0xFFFF6584),
      'status': [2, 2, 2, 2, 1, 0, 0],
    },
    {
      'title': 'Günlük Yürüyüş',
      'icon': '🚶',
      'color': const Color(0xFF38C793),
      'status': [2, 1, 2, 2, 0, 0, 0],
    },
    {
      'title': 'Düzenli Uyku',
      'icon': '😴',
      'color': const Color(0xFF8B5CF6),
      'status': [2, 2, 1, 2, 2, 0, 0],
    },
  ];

  void _toggleDot(int habitIndex, int dayIndex) {
    AppHaptics.selectionClick();
    setState(() {
      final current = _habits[habitIndex]['status'][dayIndex] as int;
      _habits[habitIndex]['status'][dayIndex] = (current + 1) % 3;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF261914), width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3)),
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
                  const Text('📅', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text('Haftalık Alışkanlık & Ruh Hali', style: AppTypography.displaySmall.copyWith(fontSize: 16)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF81C784)),
                ),
                child: Text('Bu Hafta', style: AppTypography.tag.copyWith(fontSize: 10, color: const Color(0xFF2E7D32))),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Days Header
          Row(
            children: [
              const SizedBox(width: 110),
              ..._days.map((d) => Expanded(
                child: Center(
                  child: Text(
                    d,
                    style: AppTypography.tag.copyWith(
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              )),
            ],
          ),
          const SizedBox(height: 8),

          // Habit Rows with Interactive Dots
          ...List.generate(_habits.length, (hIdx) {
            final h = _habits[hIdx];
            final statusList = h['status'] as List<int>;
            final color = h['color'] as Color;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  SizedBox(
                    width: 110,
                    child: Row(
                      children: [
                        Text(h['icon'] as String, style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            h['title'] as String,
                            style: AppTypography.tag.copyWith(color: AppColors.textPrimary, fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ...List.generate(7, (dIdx) {
                    final status = statusList[dIdx];
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => _toggleDot(hIdx, dIdx),
                        child: Center(
                          child: Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: status == 2
                                  ? color
                                  : status == 1
                                      ? const Color(0xFFFFA34E)
                                      : const Color(0xFFEDE7DF),
                              border: Border.all(
                                color: status > 0 ? const Color(0xFF261914) : const Color(0xFFD6C7B2),
                                width: 1.5,
                              ),
                            ),
                            child: status == 2
                                ? const Icon(Icons.check, size: 10, color: Colors.white)
                                : null,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
