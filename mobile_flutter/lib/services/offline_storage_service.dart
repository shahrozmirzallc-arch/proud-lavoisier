// mobile_flutter/lib/services/offline_storage_service.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../config/constants.dart';
import '../models/shift_report.dart';
import '../models/incident.dart';
import '../models/rework_log.dart';
import '../models/time_entry.dart';
import 'supabase_service.dart';

class OfflineStorageService extends ChangeNotifier {
  static final OfflineStorageService _instance = OfflineStorageService._internal();
  factory OfflineStorageService() => _instance;
  OfflineStorageService._internal();

  Box? _box;
  bool _isSyncing = false;

  bool get isSyncing => _isSyncing;

  Future<void> initialize() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(AppConstants.hiveBoxName);
    debugPrint('[IDS PULSE] Hive Offline Storage Initialized');
  }

  // --- Save Operations with Outbox Stamping ---

  Future<void> saveShiftReport(ShiftReport report) async {
    final list = getShiftReports();
    list.insert(0, report);
    await _box?.put('shift_reports', list.map((e) => jsonEncode(e.toJson())).toList());
    
    // Add to outbox queue
    await _addToOutbox('shiftReports', report.toJson());
    notifyListeners();
    
    // Trigger background sync
    triggerBackgroundSync();
  }

  List<ShiftReport> getShiftReports() {
    final raw = _box?.get('shift_reports') as List<dynamic>?;
    if (raw == null) return [];
    return raw.map((e) => ShiftReport.fromJson(jsonDecode(e.toString()))).toList();
  }

  Future<void> saveIncident(Incident incident) async {
    final list = getIncidents();
    list.insert(0, incident);
    await _box?.put('incidents', list.map((e) => jsonEncode(e.toJson())).toList());
    
    // Add to outbox queue
    await _addToOutbox('incidents', incident.toJson());
    notifyListeners();
    
    triggerBackgroundSync();
  }

  List<Incident> getIncidents() {
    final raw = _box?.get('incidents') as List<dynamic>?;
    if (raw == null) return [];
    return raw.map((e) => Incident.fromJson(jsonDecode(e.toString()))).toList();
  }

  Future<void> saveReworkLog(ReworkLog rework) async {
    final list = getReworkLogs();
    list.insert(0, rework);
    await _box?.put('rework_logs', list.map((e) => jsonEncode(e.toJson())).toList());
    
    await _addToOutbox('reworkLogs', rework.toJson());
    notifyListeners();
    
    triggerBackgroundSync();
  }

  List<ReworkLog> getReworkLogs() {
    final raw = _box?.get('rework_logs') as List<dynamic>?;
    if (raw == null) return [];
    return raw.map((e) => ReworkLog.fromJson(jsonDecode(e.toString()))).toList();
  }

  Future<void> saveTimeEntry(TimeEntry timeEntry) async {
    final list = getTimeEntries();
    list.insert(0, timeEntry);
    await _box?.put('time_entries', list.map((e) => jsonEncode(e.toJson())).toList());
    
    await _addToOutbox('timeEntries', timeEntry.toJson());
    notifyListeners();
    
    triggerBackgroundSync();
  }

  List<TimeEntry> getTimeEntries() {
    final raw = _box?.get('time_entries') as List<dynamic>?;
    if (raw == null) return [];
    return raw.map((e) => TimeEntry.fromJson(jsonDecode(e.toString()))).toList();
  }

  // --- Outbox Queue Implementation ---

  Future<void> _addToOutbox(String table, Map<String, dynamic> data) async {
    final queue = getOutboxQueue();
    queue.add({
      'table': table,
      'data': data,
      'client_tx_id': data['client_tx_id'] ?? data['id'],
      'timestamp': DateTime.now().toIso8601String(),
    });
    await _box?.put(AppConstants.offlineQueueKey, queue.map((e) => jsonEncode(e)).toList());
  }

  List<Map<String, dynamic>> getOutboxQueue() {
    final raw = _box?.get(AppConstants.offlineQueueKey) as List<dynamic>?;
    if (raw == null) return [];
    return raw.map((e) => Map<String, dynamic>.from(jsonDecode(e.toString()))).toList();
  }

  int get pendingSyncCount => getOutboxQueue().length;

  Future<void> triggerBackgroundSync() async {
    if (_isSyncing) return;
    _isSyncing = true;
    notifyListeners();

    try {
      final queue = getOutboxQueue();
      if (queue.isEmpty) {
        _isSyncing = false;
        notifyListeners();
        return;
      }

      final remaining = <Map<String, dynamic>>[];
      for (final item in queue) {
        final table = item['table'] as String;
        final data = item['data'] as Map<String, dynamic>;
        bool pushed = false;

        if (table == 'shiftReports') {
          pushed = await SupabaseService().pushShiftReport(ShiftReport.fromJson(data));
        } else if (table == 'incidents') {
          pushed = await SupabaseService().pushIncident(Incident.fromJson(data));
        } else if (table == 'reworkLogs') {
          pushed = await SupabaseService().pushReworkLog(ReworkLog.fromJson(data));
        } else if (table == 'timeEntries') {
          pushed = await SupabaseService().pushTimeEntry(TimeEntry.fromJson(data));
        }

        if (!pushed) {
          remaining.add(item);
        }
      }

      await _box?.put(AppConstants.offlineQueueKey, remaining.map((e) => jsonEncode(e)).toList());
    } catch (e) {
      debugPrint('[IDS PULSE] Background Sync Worker Exception: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }
}
