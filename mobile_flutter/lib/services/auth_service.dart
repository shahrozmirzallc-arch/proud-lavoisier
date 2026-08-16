// mobile_flutter/lib/services/auth_service.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../config/constants.dart';
import '../models/user_profile.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  UserProfile? _currentUser;
  bool _isLoggedIn = false;

  UserProfile? get currentUser => _currentUser;
  bool get isLoggedIn => _isLoggedIn;

  // Authoritative Demo Rep Accounts for 1-Click Floor Login
  static final List<UserProfile> demoReps = [
    UserProfile(
      id: 'rep_clarence_kuiken',
      name: 'Clarence Kuiken',
      username: 'clarence_kuiken',
      email: 'clarence.kuiken@integrityds.com',
      role: 'rep',
      plantId: 'plant_windsor_01',
      title: 'Senior Automotive Quality Rep',
      payCurrency: 'CAD',
    ),
    UserProfile(
      id: 'rep_hugo_ramos',
      name: 'Hugo Ramos',
      username: 'hugo_ramos',
      email: 'hugo.ramos@integrityds.com',
      role: 'rep',
      plantId: 'plant_detroit_02',
      title: 'Field Containment Specialist',
      payCurrency: 'USD',
    ),
    UserProfile(
      id: 'rep_nabil',
      name: 'Nabil',
      username: 'nabil_quality',
      email: 'nabil@integrityds.com',
      role: 'rep',
      plantId: 'plant_warren_03',
      title: 'Quality Liaison Rep',
      payCurrency: 'USD',
    ),
    UserProfile(
      id: 'rep_rogelio',
      name: 'Rogelio',
      username: 'rogelio_inspector',
      email: 'rogelio@integrityds.com',
      role: 'rep',
      plantId: 'plant_toledo_04',
      title: 'Field Quality Inspector',
      payCurrency: 'USD',
    ),
  ];

  Future<void> initialize() async {
    final box = Hive.box(AppConstants.hiveBoxName);
    final rawUser = box.get(AppConstants.authUserKey);
    if (rawUser != null) {
      _currentUser = UserProfile.fromJson(Map<String, dynamic>.from(jsonDecode(rawUser.toString())));
      _isLoggedIn = true;
      notifyListeners();
    }
  }

  Future<bool> login(String usernameOrEmail, String password) async {
    // 1. Check local demo reps first for instant floor bypass
    final normInput = usernameOrEmail.toLowerCase().trim();
    final matched = demoReps.firstWhere(
      (r) => r.username.toLowerCase() == normInput || r.email.toLowerCase() == normInput || r.name.toLowerCase() == normInput,
      orElse: () => UserProfile(
        id: 'rep_${DateTime.now().millisecondsSinceEpoch}',
        name: usernameOrEmail,
        username: usernameOrEmail,
        email: '$usernameOrEmail@integrityds.com',
        role: 'rep',
      ),
    );

    _currentUser = matched;
    _isLoggedIn = true;

    final box = Hive.box(AppConstants.hiveBoxName);
    await box.put(AppConstants.authUserKey, jsonEncode(matched.toJson()));
    notifyListeners();
    return true;
  }

  Future<void> loginAsDemoRep(UserProfile rep) async {
    _currentUser = rep;
    _isLoggedIn = true;

    final box = Hive.box(AppConstants.hiveBoxName);
    await box.put(AppConstants.authUserKey, jsonEncode(rep.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    _isLoggedIn = false;

    final box = Hive.box(AppConstants.hiveBoxName);
    await box.delete(AppConstants.authUserKey);
    notifyListeners();
  }
}
