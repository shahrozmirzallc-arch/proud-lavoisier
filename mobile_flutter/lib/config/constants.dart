// mobile_flutter/lib/config/constants.dart
import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'IDS Pulse';
  static const String appVersion = '1.0.0 (Native Flutter)';
  static const String companyName = 'Integrity Driven Solutions Inc.';
  
  // Cloud Supabase Credentials
  static const String supabaseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

  // High-Contrast Theme Colors (WCAG AAA Compliance)
  static const Color primaryEmerald = Color(0xFF008F72);
  static const Color primaryNavy = Color(0xFF0F172A);
  static const Color accentBlue = Color(0xFF2563EB);
  static const Color bgSlate = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Colors.white;
  static const Color borderSubtle = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color alertRed = Color(0xFFDC2626);
  static const Color warningAmber = Color(0xFFD97706);
  static const Color successGreen = Color(0xFF16A34A);

  // Storage Keys
  static const String hiveBoxName = 'ids_pulse_offline_box';
  static const String authUserKey = 'ids_pulse_active_user';
  static const String offlineQueueKey = 'ids_pulse_sync_queue';
}
