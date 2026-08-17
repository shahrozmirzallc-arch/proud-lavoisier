// mobile_flutter/lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/constants.dart';
import 'services/supabase_service.dart';
import 'services/offline_storage_service.dart';
import 'services/auth_service.dart';
import 'screens/splash_login_screen.dart';
import 'screens/floor_dashboard_screen.dart';

import 'screens/live_rep_app_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const IdsPulseApp());
}

class IdsPulseApp extends StatelessWidget {
  const IdsPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConstants.primaryEmerald,
          primary: AppConstants.primaryEmerald,
          secondary: AppConstants.primaryNavy,
          surface: AppConstants.surfaceWhite,
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
      ),
      home: const LiveRepAppScreen(),
    );
  }
}
