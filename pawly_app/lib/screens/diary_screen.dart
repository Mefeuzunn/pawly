import 'package:flutter/material.dart';
import '../core/theme/app_typography.dart';
import '../models/pet_model.dart';

class DiaryEntry {
  final String title;
  final String date;
  final String description;
  final String emoji;
  final Color tagColor;
  final String tag;

  const DiaryEntry({
    required this.title,
    required this.date,
    required this.description,
    required this.emoji,
    required this.tagColor,
    required this.tag,
  });
}

class DiaryScreen extends StatelessWidget {
  final PetModel pet;

  const DiaryScreen({super.key, required this.pet});

  static const List<DiaryEntry> entries = [
    DiaryEntry(
      title: 'İlk Karşılaşma & Sıcak Yuva',
      date: '24 Ekim 2026',
      description: 'Mochi minik bir yumurtadan sevgiyle çatlayarak aramıza katıldı! Evin yeni neşesi oldu.',
      emoji: '🐣🐾',
      tagColor: Color(0xFFFF6584),
      tag: 'Doğum Günü',
    ),
    DiaryEntry(
      title: 'İlk Somon Balığı Şöleni',
      date: '24 Ekim 2026',
      description: 'Mutfak masasında lezzetli ızgara somonu afiyetle yedi, bıyıklarını keyifle yaladı!',
      emoji: '🐟😋',
      tagColor: Color(0xFFFFA34E),
      tag: 'Beslenme',
    ),
    DiaryEntry(
      title: '1,000 Kalp Barajı Aşıldı!',
      date: '23 Ekim 2026',
      description: 'Müge ve Efe birbirlerine 1,000 kez "Seni Özledim" kalbi gönderdi. Aşk bahçesi çiçek açtı.',
      emoji: '💖✨',
      tagColor: Color(0xFF8B5CF6),
      tag: 'Çift Başarısı',
    ),
    DiaryEntry(
      title: 'Kapadokya Balon Turu',
      date: '20 Ekim 2026',
      description: 'Peri bacaları üzerinde gün doğumunda sıcak hava balonuyla süzüldü ve minyatür balon getirdi.',
      emoji: '🎈🏺',
      tagColor: Color(0xFF4F8CFF),
      tag: 'Macera',
    ),
    DiaryEntry(
      title: 'Köpük Banyosu Partisi',
      date: '18 Ekim 2026',
      description: 'Porselen küvette sabun köpüklerini patlatırken çok eğlendi, mis gibi koktu!',
      emoji: '🛁🫧',
      tagColor: Color(0xFF38C793),
      tag: 'Temizlik',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF9EE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('${pet.name}\'nin Günlüğü 📖✨', style: AppTypography.displaySmall),
        centerTitle: true,
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          itemCount: entries.length,
          separatorBuilder: (context, index) => const SizedBox(height: 14),
          itemBuilder: (context, i) {
            final e = entries[i];
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF261914), width: 2),
                boxShadow: const [BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3))],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF2D6),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF261914), width: 1.5),
                    ),
                    child: Center(child: Text(e.emoji, style: const TextStyle(fontSize: 26))),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: e.tagColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                e.tag,
                                style: AppTypography.tag.copyWith(color: e.tagColor, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                            Text(e.date, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(e.title, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(e.description, style: AppTypography.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
