import 'package:flutter_test/flutter_test.dart';
import 'package:pawly_app/models/pet_model.dart';
import 'package:pawly_app/models/couple_model.dart';
import 'package:pawly_app/models/garden_model.dart';
import 'package:pawly_app/models/candy_model.dart';
import 'package:pawly_app/graphics/engine3d/vector3_math.dart';
import 'package:pawly_app/graphics/physics/candy_physics.dart';
import 'package:flutter/material.dart';
import 'package:pawly_app/main.dart';

void main() {
  group('Pawly 3D & Models Unit Tests', () {
    test('3D Vector Math operations', () {
      const v1 = Vec3(1, 2, 3);
      const v2 = Vec3(4, 5, 6);
      final sum = v1 + v2;
      expect(sum.x, 5);
      expect(sum.y, 7);
      expect(sum.z, 9);

      final dot = v1.dot(v2);
      expect(dot, 1 * 4 + 2 * 5 + 3 * 6); // 32

      final norm = const Vec3(3, 0, 0).normalized();
      expect(norm.x, 1);
      expect(norm.y, 0);
      expect(norm.z, 0);
    });

    test('Pet Model stats and lifecycle', () {
      final pet = PetModel(id: 'p1', name: 'Mochi', species: PetSpecies.cat);
      expect(pet.hunger, 85.0);
      expect(pet.cleanliness, 90.0);

      pet.feed(10.0);
      expect(pet.hunger, 95.0);
      expect(pet.action, PetAction.eating);

      pet.wash(10.0);
      expect(pet.cleanliness, 100.0);
      expect(pet.action, PetAction.bathing);

      pet.play(10.0);
      expect(pet.happiness, 100.0);
      expect(pet.action, PetAction.playing);

      pet.toggleSleep();
      expect(pet.isSleeping, true);
      expect(pet.action, PetAction.sleeping);
      expect(pet.currentRoom, PetRoom.bedroom);
    });

    test('Couple Model Miss You counter', () {
      final couple = CoupleModel();
      final initial = couple.missYouCount;
      couple.sendMissYou();
      expect(couple.missYouCount, initial + 1);
      expect(couple.todayMissYouCount, 43);
    });

    test('Garden Model Watering and Stage progression', () {
      final garden = GardenModel(waterCount: 11, targetWaters: 12, stage: PlantStage.seed);
      garden.water();
      expect(garden.stage, PlantStage.sprout);
      expect(garden.waterCount, 0);
    });

    test('Candy 2D Physics collision and damping', () {
      final candies = [
        CandyItem(id: '1', message: 'Hi', sender: 'A', color: Colors.pink, x: 50, y: 50, vx: 10, vy: 10),
        CandyItem(id: '2', message: 'Hello', sender: 'B', color: Colors.blue, x: 55, y: 50, vx: -10, vy: 0),
      ];
      final engine = CandyPhysicsEngine(candies: candies, jarBounds: const Size(200, 200));
      engine.step(0.016);
      expect(candies[0].y > 50, true); // gravity pulled it down
    });
  });

  group('Pawly App Widget Tests', () {
    testWidgets('PawlyApp smoke test', (WidgetTester tester) async {
      await tester.pumpWidget(const PawlyApp());
      await tester.pump();
      expect(find.byType(PawlyApp), findsOneWidget);
      expect(find.text('Mochi'), findsWidgets);
    });
  });
}
