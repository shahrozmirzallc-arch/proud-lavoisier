// mobile_flutter/lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/constants.dart';
import 'services/supabase_service.dart';
import 'services/offline_storage_service.dart';
import 'services/auth_service.dart';
import 'screens/splash_login_screen.dart';
import 'screens/floor_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize offline storage
  final offlineStorage = OfflineStorageService();
  await offlineStorage.initialize();

  // Initialize Supabase in background
  final supabaseService = SupabaseService();
  await supabaseService.initialize();

  // Initialize Auth state
  final authService = AuthService();
  await authService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authService),
        ChangeNotifierProvider.value(value: offlineStorage),
      ],
      child: const IdsPulseApp(),
    ),
  );
}

class IdsPulseApp extends StatelessWidget {
  const IdsPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

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
        scaffoldBackgroundColor: AppConstants.bgSlate,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppConstants.primaryNavy,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: authService.isLoggedIn ? const FloorDashboardScreen() : const SplashLoginScreen(),
    );
  }
}
