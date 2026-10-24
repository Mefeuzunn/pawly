import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/pet_model.dart';

class ApiService {
  final String _baseUrl;

  ApiService({String? baseUrl}) : _baseUrl = baseUrl ?? ApiConstants.baseUrl;

  Future<bool> syncPet(PetModel pet) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl${ApiConstants.petEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(pet.toJson()),
      ).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      // Graceful offline fallback
      return false;
    }
  }

  Future<int?> sendMissYou(String coupleId) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl${ApiConstants.missYouEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'coupleId': coupleId, 'count': 1}),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['missYouCount'] as int?;
      }
    } catch (_) {}
    return null;
  }
}
