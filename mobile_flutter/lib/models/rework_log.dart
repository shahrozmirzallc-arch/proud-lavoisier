// mobile_flutter/lib/models/rework_log.dart
import 'package:uuid/uuid.dart';

class ReworkLog {
  final String id;
  final String reworkNumber;
  final String date;
  final String repId;
  final String repName;
  final String plantId;
  final String plantName;
  final String supplierId;
  final String supplierName;
  final String partNumber;
  final int reworkedCount;
  final double hoursWorked;
  final String actionTaken;
  final String disposition; // 'Approved', 'Scrapped', 'Pending'
  final String clientTxId;
  final DateTime createdAt;

  ReworkLog({
    String? id,
    String? reworkNumber,
    required this.date,
    required this.repId,
    required this.repName,
    required this.plantId,
    required this.plantName,
    required this.supplierId,
    required this.supplierName,
    required this.partNumber,
    required this.reworkedCount,
    required this.hoursWorked,
    required this.actionTaken,
    this.disposition = 'Approved',
    String? clientTxId,
    DateTime? createdAt,
  })  : id = id ?? 'rw_${DateTime.now().millisecondsSinceEpoch}',
        reworkNumber = reworkNumber ?? 'RW-${DateTime.now().year}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        clientTxId = clientTxId ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();

  factory ReworkLog.fromJson(Map<String, dynamic> json) {
    return ReworkLog(
      id: json['id']?.toString(),
      reworkNumber: json['rework_number']?.toString() ?? json['id']?.toString() ?? 'RW-2026-001',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T')[0],
      repId: json['rep_id']?.toString() ?? '',
      repName: json['rep_name']?.toString() ?? 'Field Inspector',
      plantId: json['plant_id']?.toString() ?? '',
      plantName: json['plant_name']?.toString() ?? 'Assembly Plant',
      supplierId: json['supplier_id']?.toString() ?? json['client_id']?.toString() ?? '',
      supplierName: json['supplier_name']?.toString() ?? 'Automotive Client',
      partNumber: json['part_number']?.toString() ?? '',
      reworkedCount: int.tryParse(json['reworked_count']?.toString() ?? json['pieces_reworked']?.toString() ?? '0') ?? 0,
      hoursWorked: double.tryParse(json['hours_worked']?.toString() ?? json['hours']?.toString() ?? '0.0') ?? 0.0,
      actionTaken: json['action_taken']?.toString() ?? json['narrative']?.toString() ?? '',
      disposition: json['disposition']?.toString() ?? 'Approved',
      clientTxId: json['client_tx_id']?.toString(),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'rework_number': reworkNumber,
      'date': date,
      'rep_id': repId,
      'rep_name': repName,
      'plant_id': plantId,
      'plant_name': plantName,
      'supplier_id': supplierId,
      'supplier_name': supplierName,
      'part_number': partNumber,
      'reworked_count': reworkedCount,
      'hours_worked': hoursWorked,
      'action_taken': actionTaken,
      'disposition': disposition,
      'client_tx_id': clientTxId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
