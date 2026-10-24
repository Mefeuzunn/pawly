class AdventureDestination {
  final String id;
  final String name;
  final String country;
  final String landmark;
  final String souvenirName;
  final String souvenirEmoji;
  final int durationMinutes;
  final String imageUrl;

  const AdventureDestination({
    required this.id,
    required this.name,
    required this.country,
    required this.landmark,
    required this.souvenirName,
    required this.souvenirEmoji,
    required this.durationMinutes,
    required this.imageUrl,
  });
}

class PolaroidPhoto {
  final String id;
  final String destinationName;
  final String landmark;
  final String date;
  final String note;
  final String petEmoji;

  const PolaroidPhoto({
    required this.id,
    required this.destinationName,
    required this.landmark,
    required this.date,
    required this.note,
    required this.petEmoji,
  });
}

class AdventureState {
  static const List<AdventureDestination> destinations = [
    AdventureDestination(
      id: 'tokyo',
      name: 'Tokyo',
      country: 'Japonya',
      landmark: 'Shibuya & Kiraz Çiçekleri 🌸',
      souvenirName: 'Şans Kedisi Maneki-Neko',
      souvenirEmoji: '🐱',
      durationMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600',
    ),
    AdventureDestination(
      id: 'paris',
      name: 'Paris',
      country: 'Fransa',
      landmark: 'Eyfel Kulesi & Seine Nehri 🗼',
      souvenirName: 'Mini Altın Eyfel Heykelciği',
      souvenirEmoji: '🥐',
      durationMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
    ),
    AdventureDestination(
      id: 'cappadocia',
      name: 'Kapadokya',
      country: 'Türkiye',
      landmark: 'Peri Bacaları & Sıcak Hava Balonları 🎈',
      souvenirName: 'Minyatür Sıcak Hava Balonu',
      souvenirEmoji: '🏺',
      durationMinutes: 10,
      imageUrl: 'https://images.unsplash.com/photo-1609865138885-a95f9c5d0ef6?w=600',
    ),
    AdventureDestination(
      id: 'newyork',
      name: 'New York',
      country: 'ABD',
      landmark: 'Times Square & Central Park 🗽',
      souvenirName: 'Vintage Sarı Taksi Plakası',
      souvenirEmoji: '🚕',
      durationMinutes: 30,
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600',
    ),
  ];

  bool isTraveling;
  AdventureDestination? currentDestination;
  DateTime? returnTime;
  List<PolaroidPhoto> album;

  AdventureState({
    this.isTraveling = false,
    this.currentDestination,
    this.returnTime,
    List<PolaroidPhoto>? album,
  }) : album = album ?? [
    const PolaroidPhoto(
      id: 'p1',
      destinationName: 'Tokyo',
      landmark: 'Shibuya Crossing',
      date: '24 Ekim 2026',
      note: 'Mochi kiraz çiçekleri altında yeni arkadaşlarıyla tanıştı! 🌸🐾',
      petEmoji: '🐱🌸',
    ),
    const PolaroidPhoto(
      id: 'p2',
      destinationName: 'Kapadokya',
      landmark: 'Aşk Vadisi Balonları',
      date: '20 Ekim 2026',
      note: 'Sabah gün doğumunda gökyüzü renk cümbüşüydü! 🎈✨',
      petEmoji: '🐱🎈',
    ),
  ];
}
