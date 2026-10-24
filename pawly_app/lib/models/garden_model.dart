enum PlantStage {
  seed,
  sprout,
  blooming,
  mature,
  fruit,
}

class GardenModel {
  int waterCount;
  int targetWaters;
  PlantStage stage;
  DateTime lastWatered;

  GardenModel({
    this.waterCount = 8,
    this.targetWaters = 12,
    this.stage = PlantStage.blooming,
    DateTime? lastWatered,
  }) : lastWatered = lastWatered ?? DateTime.now();

  double get progress => (waterCount / targetWaters).clamp(0.0, 1.0);

  String get stageTitle {
    switch (stage) {
      case PlantStage.seed:
        return 'Tohum Aşamasında';
      case PlantStage.sprout:
        return 'Minik Filiz';
      case PlantStage.blooming:
        return 'Gonca Çiçek';
      case PlantStage.mature:
        return 'Aşk Çiçeği Açtı!';
      case PlantStage.fruit:
        return 'Sonsuzluk Meyvesi';
    }
  }

  void water() {
    waterCount++;
    if (waterCount >= targetWaters) {
      if (stage == PlantStage.seed) {
        stage = PlantStage.sprout;
      } else if (stage == PlantStage.sprout) {
        stage = PlantStage.blooming;
      } else if (stage == PlantStage.blooming) {
        stage = PlantStage.mature;
      } else if (stage == PlantStage.mature) {
        stage = PlantStage.fruit;
      }
      waterCount = 0;
      targetWaters += 4;
    }
    lastWatered = DateTime.now();
  }
}
