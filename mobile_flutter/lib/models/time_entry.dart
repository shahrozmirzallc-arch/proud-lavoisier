// mobile_flutter/lib/models/time_entry.dart
import 'package:uuid/uuid.dart';

class TimeEntry {
  final String id;
  final String repId;
  final String repName;
  final String date;
  final String plantId;
  final String plantName;
  final String supplierId;
  final String supplierName;
  final double regularHours;
  final double overtimeHours;
  final double mileage;
  final String mileageUnit; // 'km', 'mi'
  final String currency; // 'CAD', 'USD'
  final String status; // 'pending', 'approved', 'rejected'
  final String clientReviewStatus;
  final String clientTxId;
  final DateTime createdAt;

  TimeEntry({
    String? id,
    required this.repId,
    required this.repName,
    required this.date,
    required this.plantId,
    required this.plantName,
    required this.supplierId,
    required this.supplierName,
    required this.regularHours,
    this.overtimeHours = 0.0,
    this.mileage = 0.0,
    this.mileageUnit = 'km',
    this.currency = 'CAD',
    this.status = 'pending',
    this.clientReviewStatus = 'pending',
    String? clientTxId,
    DateTime? createdAt,
  })  : id = id ?? 'te_${DateTime.now().millisecondsSinceEpoch}',
        clientTxId = clientTxId ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();

  double get totalHours => regularHours + overtimeHours;

  factory TimeEntry.fromJson(Map<String, dynamic> json) {
    return TimeEntry(
      id: json['id']?.toString(),
      repId: json['rep_id']?.toString() ?? '',
      repName: json['rep_name']?.toString() ?? 'Field Inspector',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T')[0],
      plantId: json['plant_id']?.toString() ?? '',
      plantName: json['plant_name']?.toString() ?? 'Assembly Plant',
      supplierId: json['supplier_id']?.toString() ?? json['client_id']?.toString() ?? '',
      supplierName: json['supplier_name']?.toString() ?? 'Automotive Client',
      regularHours: double.tryParse(json['regular_hours']?.toString() ?? json['hours']?.toString() ?? '8.0') ?? 8.0,
      overtimeHours: double.tryParse(json['overtime_hours']?.toString() ?? '0.0') ?? 0.0,
      mileage: double.tryParse(json['mileage']?.toString() ?? json['miles']?.toString() ?? '0.0') ?? 0.0,
      mileageUnit: json['mileage_unit']?.toString() ?? 'km',
      currency: json['currency']?.toString() ?? 'CAD',
      status: json['status']?.toString() ?? 'pending',
      clientReviewStatus: json['client_review_status']?.toString() ?? 'pending',
      clientTxId: json['client_tx_id']?.toString(),
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
      'regular_hours': regularHours,
      'overtime_hours': overtimeHours,
      'mileage': mileage,
      'mileage_unit': mileageUnit,
      'currency': currency,
      'status': status,
      'client_review_status': clientReviewStatus,
      'client_tx_id': clientTxId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
