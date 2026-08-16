// mobile_flutter/lib/services/supabase_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/shift_report.dart';
import '../models/incident.dart';
import '../models/rework_log.dart';
import '../models/time_entry.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient? _client;
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      await Supabase.initialize(
        url: AppConstants.supabaseUrl,
        anonKey: AppConstants.supabaseAnonKey,
      );
      _client = Supabase.instance.client;
      _initialized = true;
      debugPrint('[IDS PULSE] Supabase Flutter SDK Initialized Successfully');
    } catch (e) {
      debugPrint('[IDS PULSE] Supabase Init Warning (will operate offline-first): $e');
    }
  }

  SupabaseClient? get client => _client;

  Future<bool> pushShiftReport(ShiftReport report) async {
    if (_client == null) return false;
    try {
      await _client!.from('shiftReports').upsert(report.toJson());
      return true;
    } catch (e) {
      debugPrint('[IDS PULSE] Shift Report Sync Error: $e');
      return false;
    }
  }

  Future<bool> pushIncident(Incident incident) async {
    if (_client == null) return false;
    try {
      await _client!.from('incidents').upsert(incident.toJson());
      return true;
    } catch (e) {
      debugPrint('[IDS PULSE] Incident Sync Error: $e');
      return false;
    }
  }

  Future<bool> pushReworkLog(ReworkLog rework) async {
    if (_client == null) return false;
    try {
      await _client!.from('reworkLogs').upsert(rework.toJson());
      return true;
    } catch (e) {
      debugPrint('[IDS PULSE] Rework Log Sync Error: $e');
      return false;
    }
  }

  Future<bool> pushTimeEntry(TimeEntry timeEntry) async {
    if (_client == null) return false;
    try {
      await _client!.from('timeEntries').upsert(timeEntry.toJson());
      return true;
    } catch (e) {
      debugPrint('[IDS PULSE] Time Entry Sync Error: $e');
      return false;
    }
  }
}
