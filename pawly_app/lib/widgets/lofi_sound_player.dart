import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/utils/haptics.dart';

class LofiSoundPlayer extends StatefulWidget {
  const LofiSoundPlayer({super.key});

  @override
  State<LofiSoundPlayer> createState() => _LofiSoundPlayerState();
}

class _LofiSoundPlayerState extends State<LofiSoundPlayer>
    with SingleTickerProviderStateMixin {
  bool _isPlaying = false;
  int _trackIndex = 0;
  late AnimationController _waveAnim;

  final List<Map<String, String>> _tracks = [
    {'title': 'Huzurlu Yağmur', 'icon': '🌧️', 'desc': 'Sakinleştirici yağmur sesleri'},
    {'title': 'Çıtırdayan Şömine', 'icon': '🔥', 'desc': 'Sıcak oda şöminesi'},
    {'title': 'Tatlı Müzik Kutusu', 'icon': '🎵', 'desc': 'Lo-Fi ninni melodisi'},
    {'title': 'Esintili Orman', 'icon': '🍃', 'desc': 'Kuş cıvıltıları ve yapraklar'},
  ];

  @override
  void initState() {
    super.initState();
    _waveAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _waveAnim.dispose();
    super.dispose();
  }

  void _togglePlay() {
    AppHaptics.mediumImpact();
    setState(() => _isPlaying = !_isPlaying);
  }

  void _nextTrack() {
    AppHaptics.selectionClick();
    setState(() {
      _trackIndex = (_trackIndex + 1) % _tracks.length;
    });
  }

  @override
  Widget build(BuildContext context) {
    final track = _tracks[_trackIndex];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF261914), width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0xFF261914), offset: Offset(0, 3)),
        ],
      ),
      child: Row(
        children: [
          // Track Icon & Wave animation
          GestureDetector(
            onTap: _nextTrack,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF2D6),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF261914), width: 1.5),
              ),
              child: Text(track['icon']!, style: const TextStyle(fontSize: 20)),
            ),
          ),
          const SizedBox(width: 10),

          // Track Info
          Expanded(
            child: GestureDetector(
              onTap: _nextTrack,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        track['title']!,
                        style: AppTypography.tag.copyWith(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(width: 6),
                      Text('• Değiştir', style: AppTypography.bodySmall.copyWith(fontSize: 10, color: AppColors.primary)),
                    ],
                  ),
                  Text(
                    track['desc']!,
                    style: AppTypography.bodySmall.copyWith(fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),

          // Waveform indicator
          if (_isPlaying) ...[
            AnimatedBuilder(
              animation: _waveAnim,
              builder: (context, _) {
                return Row(
                  children: List.generate(4, (i) {
                    final h = 6.0 + math.sin(_waveAnim.value * math.pi + i * 1.2).abs() * 14.0;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      width: 3,
                      height: h,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6584),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                );
              },
            ),
            const SizedBox(width: 10),
          ],

          // Play / Pause Button
          GestureDetector(
            onTap: _togglePlay,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _isPlaying ? const Color(0xFFFF6584) : const Color(0xFF38C793),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF261914), width: 2),
              ),
              child: Icon(
                _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
