import 'package:flutter/material.dart';

enum PetSpecies { cat, shiba, bear, bunny }

enum PetRoom { kitchen, bath, bedroom, playroom }

enum PetAction { idle, eating, bathing, sleeping, playing, happy, petted }

enum PetStage { baby, toddler, adult }

enum PetOutfit {
  none,
  bowTie,
  partyHat,
  nightCap,
  aviatorGoggles,
  flowerCrown,
  detectiveHat,
  sailorShirt,
  pinkDress,
  greenTracksuit,
  bucketHat,
  heartGlasses,
}

class CareLogEntry {
  final String author;
  final String action;
  final String emoji;
  final String timeAgo;
  final Color color;

  const CareLogEntry({
    required this.author,
    required this.action,
    required this.emoji,
    required this.timeAgo,
    this.color = const Color(0xFFFF6584),
  });
}

class PetModel {
  final String id;
  final String name;
  final PetSpecies species;
  double hunger; // 0 - 100
  double cleanliness; // 0 - 100
  double energy; // 0 - 100
  double happiness; // 0 - 100
  int level;
  int exp;
  PetRoom currentRoom;
  PetAction action;
  PetOutfit outfit;
  bool isSleeping;
  DateTime lastUpdated;
  List<CareLogEntry> careLogs;

  PetModel({
    required this.id,
    required this.name,
    required this.species,
    this.hunger = 85.0,
    this.cleanliness = 90.0,
    this.energy = 80.0,
    this.happiness = 95.0,
    this.level = 3,
    this.exp = 240,
    this.currentRoom = PetRoom.kitchen,
    this.action = PetAction.idle,
    this.outfit = PetOutfit.bowTie,
    this.isSleeping = false,
    DateTime? lastUpdated,
    List<CareLogEntry>? careLogs,
  })  : lastUpdated = lastUpdated ?? DateTime.now(),
        careLogs = careLogs ?? [
          const CareLogEntry(
            author: 'Müge',
            action: 'Izgara Somon Balığı yedirdi 🐟',
            emoji: '🍲',
            timeAgo: '15 dk önce',
            color: Color(0xFFFFA34E),
          ),
          const CareLogEntry(
            author: 'Efe',
            action: 'Köpüklü küvette banyo yaptırdı 🫧',
            emoji: '🛁',
            timeAgo: '1 saat önce',
            color: Color(0xFF38C793),
          ),
          const CareLogEntry(
            author: 'Müge',
            action: 'Salonda tenis topu oynattı 🎾',
            emoji: '🎾',
            timeAgo: '3 saat önce',
            color: Color(0xFF4F8CFF),
          ),
          const CareLogEntry(
            author: 'Efe',
            action: 'Gece lambasını kapatıp uyuttu 🌙',
            emoji: '🛏️',
            timeAgo: 'Dün gece',
            color: Color(0xFF8B5CF6),
          ),
        ];

  PetStage get stage {
    if (exp < 100) return PetStage.baby;
    if (exp < 250) return PetStage.toddler;
    return PetStage.adult;
  }

  String get stageName {
    switch (stage) {
      case PetStage.baby:
        return 'Yavru Patili 🍼';
      case PetStage.toddler:
        return 'Küçük Kaşif 🎈';
      case PetStage.adult:
        return 'Yetişkin Dost 👑';
    }
  }

  double get stageProgress {
    if (stage == PetStage.baby) return (exp / 100.0).clamp(0.0, 1.0);
    if (stage == PetStage.toddler) return ((exp - 100) / 150.0).clamp(0.0, 1.0);
    return ((exp - 250) / 250.0).clamp(0.0, 1.0);
  }

  String get speciesName {
    switch (species) {
      case PetSpecies.cat:
        return 'Mochi (Kedi)';
      case PetSpecies.shiba:
        return 'Hachi (Shiba Inu)';
      case PetSpecies.bear:
        return 'Barnaby (Ayıcık)';
      case PetSpecies.bunny:
        return 'Usagi (Tavşan)';
    }
  }

  String get moodEmoji {
    if (isSleeping) return '😴';
    if (hunger < 30) return '🤤';
    if (cleanliness < 30) return '🫧';
    if (happiness > 80) return '🥰';
    return '😺';
  }

  void addExp(int amount) {
    exp += amount;
    level = (exp ~/ 80) + 1;
  }

  void feed(double amount, {String author = 'Müge'}) {
    hunger = (hunger + amount).clamp(0.0, 100.0);
    happiness = (happiness + 5.0).clamp(0.0, 100.0);
    action = PetAction.eating;
    addExp(15);
    lastUpdated = DateTime.now();
    careLogs.insert(
      0,
      CareLogEntry(
        author: author,
        action: 'Lezzetli mama yedirdi (+15 XP)',
        emoji: '🍲',
        timeAgo: 'Az önce',
        color: const Color(0xFFFFA34E),
      ),
    );
  }

  void wash(double amount, {String author = 'Efe'}) {
    cleanliness = (cleanliness + amount).clamp(0.0, 100.0);
    happiness = (happiness + 4.0).clamp(0.0, 100.0);
    action = PetAction.bathing;
    addExp(20);
    lastUpdated = DateTime.now();
    careLogs.insert(
      0,
      CareLogEntry(
        author: author,
        action: 'Köpük banyosu yaptırdı (+20 XP)',
        emoji: '🛁',
        timeAgo: 'Az önce',
        color: const Color(0xFF38C793),
      ),
    );
  }

  void play(double amount, {String author = 'Müge'}) {
    happiness = (happiness + amount).clamp(0.0, 100.0);
    energy = (energy - 8.0).clamp(0.0, 100.0);
    hunger = (hunger - 5.0).clamp(0.0, 100.0);
    action = PetAction.playing;
    addExp(15);
    lastUpdated = DateTime.now();
    careLogs.insert(
      0,
      CareLogEntry(
        author: author,
        action: 'Tenis topu fırlatıp eğlendirdi (+15 XP)',
        emoji: '🎾',
        timeAgo: 'Az önce',
        color: const Color(0xFF4F8CFF),
      ),
    );
  }

  void toggleSleep({String author = 'Efe'}) {
    isSleeping = !isSleeping;
    if (isSleeping) {
      currentRoom = PetRoom.bedroom;
      action = PetAction.sleeping;
      careLogs.insert(
        0,
        CareLogEntry(
          author: author,
          action: 'Gece lambasını kapatıp uyuttu 🌙',
          emoji: '🛏️',
          timeAgo: 'Az önce',
          color: const Color(0xFF8B5CF6),
        ),
      );
    } else {
      action = PetAction.idle;
    }
    lastUpdated = DateTime.now();
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'species': species.name,
    'hunger': hunger,
    'cleanliness': cleanliness,
    'energy': energy,
    'happiness': happiness,
    'level': level,
    'exp': exp,
    'currentRoom': currentRoom.name,
    'action': action.name,
    'outfit': outfit.name,
    'isSleeping': isSleeping,
    'lastUpdated': lastUpdated.toIso8601String(),
  };

  factory PetModel.fromJson(Map<String, dynamic> json) {
    return PetModel(
      id: json['id'] as String? ?? 'pet_1',
      name: json['name'] as String? ?? 'Mochi',
      species: PetSpecies.values.firstWhere(
        (e) => e.name == json['species'],
        orElse: () => PetSpecies.cat,
      ),
      hunger: (json['hunger'] as num?)?.toDouble() ?? 85.0,
      cleanliness: (json['cleanliness'] as num?)?.toDouble() ?? 90.0,
      energy: (json['energy'] as num?)?.toDouble() ?? 80.0,
      happiness: (json['happiness'] as num?)?.toDouble() ?? 95.0,
      level: (json['level'] as num?)?.toInt() ?? 3,
      exp: (json['exp'] as num?)?.toInt() ?? 240,
      currentRoom: PetRoom.values.firstWhere(
        (e) => e.name == json['currentRoom'],
        orElse: () => PetRoom.kitchen,
      ),
      action: PetAction.values.firstWhere(
        (e) => e.name == json['action'],
        orElse: () => PetAction.idle,
      ),
      outfit: PetOutfit.values.firstWhere(
        (e) => e.name == json['outfit'],
        orElse: () => PetOutfit.bowTie,
      ),
      isSleeping: json['isSleeping'] as bool? ?? false,
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.tryParse(json['lastUpdated'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
