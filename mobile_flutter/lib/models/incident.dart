// mobile_flutter/lib/models/incident.dart
import 'package:uuid/uuid.dart';

class Incident {
  final String id;
  final String incidentNumber;
  final String date;
  final String repId;
  final String repName;
  final String plantId;
  final String plantName;
  final String supplierId;
  final String supplierName;
  final String partNumber;
  final String lotNumber;
  final String defectType;
  final String levelOfConcern; // 'minor', 'major', 'critical'
  final int piecesDefective;
  final String quarantineLocation;
  final String immediateAction;
  final String defectDescription;
  final List<String> photoUrls;
  final String status; // 'open', 'contained', 'closed'
  final String clientTxId;
  final DateTime createdAt;

  Incident({
    String? id,
    String? incidentNumber,
    required this.date,
    required this.repId,
    required this.repName,
    required this.plantId,
    required this.plantName,
    required this.supplierId,
    required this.supplierName,
    required this.partNumber,
    required this.lotNumber,
    required this.defectType,
    required this.levelOfConcern,
    required this.piecesDefective,
    required this.quarantineLocation,
    required this.immediateAction,
    required this.defectDescription,
    this.photoUrls = const [],
    this.status = 'open',
    String? clientTxId,
    DateTime? createdAt,
  })  : id = id ?? 'inc_${DateTime.now().millisecondsSinceEpoch}',
        incidentNumber = incidentNumber ?? 'INC-${DateTime.now().year}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        clientTxId = clientTxId ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now();

  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id']?.toString(),
      incidentNumber: json['incident_number']?.toString() ?? json['id']?.toString() ?? 'INC-2026-001',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().split('T')[0],
      repId: json['rep_id']?.toString() ?? '',
      repName: json['rep_name']?.toString() ?? 'Field Inspector',
      plantId: json['plant_id']?.toString() ?? '',
      plantName: json['plant_name']?.toString() ?? 'Assembly Plant',
      supplierId: json['supplier_id']?.toString() ?? json['client_id']?.toString() ?? '',
      supplierName: json['supplier_name']?.toString() ?? 'Automotive Client',
      partNumber: json['part_number']?.toString() ?? '',
      lotNumber: json['lot_number']?.toString() ?? 'N/A',
      defectType: json['defect_type']?.toString() ?? 'Dimensional Out of Spec',
      levelOfConcern: json['level_of_concern']?.toString().toLowerCase() ?? 'minor',
      piecesDefective: int.tryParse(json['pieces_defective']?.toString() ?? json['defect_quantity']?.toString() ?? '1') ?? 1,
      quarantineLocation: json['quarantine_location']?.toString() ?? 'Quality Crib 4',
      immediateAction: json['immediate_action']?.toString() ?? '100% Sort & Segregation Initiated',
      defectDescription: json['defect_description']?.toString() ?? json['description']?.toString() ?? '',
      photoUrls: (json['photo_urls'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? 
                 (json['image_url'] != null ? [json['image_url'].toString()] : []),
      status: json['status']?.toString() ?? 'open',
      clientTxId: json['client_tx_id']?.toString(),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now() : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'incident_number': incidentNumber,
      'date': date,
      'rep_id': repId,
      'rep_name': repName,
      'plant_id': plantId,
      'plant_name': plantName,
      'supplier_id': supplierId,
      'supplier_name': supplierName,
      'part_number': partNumber,
      'lot_number': lotNumber,
      'defect_type': defectType,
      'level_of_concern': levelOfConcern,
      'pieces_defective': piecesDefective,
      'quarantine_location': quarantineLocation,
      'immediate_action': immediateAction,
      'defect_description': defectDescription,
      'photo_urls': photoUrls,
      'status': status,
      'client_tx_id': clientTxId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
