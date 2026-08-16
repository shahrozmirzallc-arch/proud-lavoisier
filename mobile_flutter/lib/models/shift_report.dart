// mobile_flutter/lib/models/shift_report.dart
import 'package:uuid/uuid.dart';

class ShiftReport {
  final String id;
  final String repId;
  final String repName;
  final String date;
  final String plantId;
  final String plantName;
  final String supplierId;
  final String supplierName;
  final String partNumber;
  final int inspectedCount;
  final int defectiveCount;
  final int reworkedCount;
  final double hoursWorked;
  final String shiftArea;
  final String shiftNotes;
  final String status; // 'Submitted', 'published'
  final String clientTxId;
  final List<String> routingContacts;
  final DateTime createdAt;

  ShiftReport({
    String? id,
    required this.repId,
    required this.repName,
    required this.date,
    required this.plantId,
    required this.plantName,
    required this.supplierId,
    required this.supplierName,
    required this.partNumber,
    required this.inspectedCount,
    required this.defectiveCount,
    required this.reworkedCount,
    required this.hoursWorked,
    this.shiftArea = 'Main Assembly Line',
    this.shiftNotes = '',
    this.status = 'Submitted',
    String? clientTxId,
    List<String>? routingContacts,
    DateTime? createdAt,
  })  : id = id ?? 'sr_${DateTime.now().millisecondsSinceEpoch}',
        clientTxId = clientTxId ?? const Uuid().v4(),
        routingContacts = routingContacts ?? [],
        createdAt = createdAt ?? DateTime.now();

  double get conformanceYield {
    if (inspectedCount <= 0) return 100.0;
    final nonDefective = (inspectedCount - defectiveCount).clamp(0, inspectedCount);
    return (nonDefective / inspectedCount) * 100.0;
  }

  int get defectPpm {
    if (inspectedCount <= 0) return 0;
    return ((defectiveCount / inspectedCount) * 1000000).round();
  }

  factory ShiftReport.fromJson(Map<String, dynamic> json) {
    return ShiftReport(
      id: json['id']?.toString(),
      repId: json['rep_id']?.toString() ?? '',
      repName: json['rep_name']?.toString() ?? json['inspector_name']?.toString() ?? 'Field Inspector',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T')[0],
      plantId: json['plant_id']?.toString() ?? '',
      plantName: json['plant_name']?.toString() ?? 'Assembly Plant',
      supplierId: json['supplier_id']?.toString() ?? json['client_id']?.toString() ?? '',
      supplierName: json['supplier_name']?.toString() ?? 'Automotive Client',
      partNumber: json['part_number']?.toString() ?? '',
      inspectedCount: int.tryParse(json['inspected_count']?.toString() ?? json['pieces_inspected']?.toString() ?? '0') ?? 0,
      defectiveCount: int.tryParse(json['defective_count']?.toString() ?? json['pieces_defective']?.toString() ?? '0') ?? 0,
      reworkedCount: int.tryParse(json['reworked_count']?.toString() ?? json['pieces_reworked']?.toString() ?? '0') ?? 0,
      hoursWorked: double.tryParse(json['hours_worked']?.toString() ?? json['hours']?.toString() ?? '8.0') ?? 8.0,
      shiftArea: json['shift_area']?.toString() ?? 'Main Assembly Line',
      shiftNotes: json['shift_notes']?.toString() ?? json['notes']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Submitted',
      clientTxId: json['client_tx_id']?.toString(),
      routingContacts: (json['routing_contacts'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'rep_id': repId,
      'rep_name': repName,
      'date': date,
      'plant_id': plantId,
      'plant_name': plantName,
      'supplier_id': supplierId,
      'supplier_name': supplierName,
      'part_number': partNumber,
      'inspected_count': inspectedCount,
      'defective_count': defectiveCount,
      'reworked_count': reworkedCount,
      'hours_worked': hoursWorked,
      'shift_area': shiftArea,
      'shift_notes': shiftNotes,
      'status': status,
      'client_tx_id': clientTxId,
      'routing_contacts': routingContacts,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
