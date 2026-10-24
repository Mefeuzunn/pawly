enum PetSpecies { cat, shiba, bear, bunny }

enum PetRoom { kitchen, bath, bedroom, playroom }

enum PetAction { idle, eating, bathing, sleeping, playing, happy, petted }

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
  }) : lastUpdated = lastUpdated ?? DateTime.now();

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

  void feed(double amount) {
    hunger = (hunger + amount).clamp(0.0, 100.0);
    happiness = (happiness + 5.0).clamp(0.0, 100.0);
    action = PetAction.eating;
    lastUpdated = DateTime.now();
  }

  void wash(double amount) {
    cleanliness = (cleanliness + amount).clamp(0.0, 100.0);
    happiness = (happiness + 4.0).clamp(0.0, 100.0);
    action = PetAction.bathing;
    lastUpdated = DateTime.now();
  }

  void play(double amount) {
    happiness = (happiness + amount).clamp(0.0, 100.0);
    energy = (energy - 8.0).clamp(0.0, 100.0);
    hunger = (hunger - 5.0).clamp(0.0, 100.0);
    action = PetAction.playing;
    lastUpdated = DateTime.now();
  }

  void toggleSleep() {
    isSleeping = !isSleeping;
    if (isSleeping) {
      currentRoom = PetRoom.bedroom;
      action = PetAction.sleeping;
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
