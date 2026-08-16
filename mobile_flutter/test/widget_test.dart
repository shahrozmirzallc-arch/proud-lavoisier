// mobile_flutter/test/widget_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:ids_pulse_mobile/models/shift_report.dart';
import 'package:ids_pulse_mobile/models/incident.dart';
import 'package:ids_pulse_mobile/models/time_entry.dart';
import 'package:ids_pulse_mobile/models/user_profile.dart';

void main() {
  group('IDS Pulse Flutter Models & Quality Formulas Suite', () {
    test('1. ShiftReport accurately calculates Conformance Yield and Defect PPM', () {
      final report = ShiftReport(
        repId: 'rep_clarence_kuiken',
        repName: 'Clarence Kuiken',
        date: '2026-08-16',
        plantId: 'plant_windsor_01',
        plantName: 'Windsor Assembly Plant',
        supplierId: 'sup_stellantis',
        supplierName: 'Stellantis Powertrain Systems',
        partNumber: 'PN-84920194',
        inspectedCount: 120,
        defectiveCount: 6,
        reworkedCount: 6,
        hoursWorked: 8.0,
      );

      // Yield = ((120 - 6) / 120) * 100 = 95.0%
      expect(report.conformanceYield, 95.0);

      // PPM = (6 / 120) * 1,000,000 = 50,000 PPM
      expect(report.defectPpm, 50000);

      // Client transaction ID must be non-empty UUID
      expect(report.clientTxId.isNotEmpty, isTrue);
    });

    test('2. Incident model stamps 4-point containment parameters correctly', () {
      final incident = Incident(
        date: '2026-08-16',
        repId: 'rep_hugo_ramos',
        repName: 'Hugo Ramos',
        plantId: 'plant_detroit_02',
        plantName: 'Detroit Assembly Complex',
        supplierId: 'sup_magna',
        supplierName: 'Magna Powertrain',
        partNumber: 'PN-MAG-8821',
        lotNumber: 'LOT-992',
        defectType: 'Porosity & Casting Void',
        levelOfConcern: 'critical',
        piecesDefective: 14,
        quarantineLocation: 'Quality Crib 2',
        immediateAction: '100% Sort & Segregation Initiated',
        defectDescription: 'Porosity detected on oil seal flange.',
      );

      final json = incident.toJson();
      expect(json['level_of_concern'], 'critical');
      expect(json['quarantine_location'], 'Quality Crib 2');
      expect(json['immediate_action'], '100% Sort & Segregation Initiated');
      expect(json['pieces_defective'], 14);

      final reconstructed = Incident.fromJson(json);
      expect(reconstructed.incidentNumber, incident.incidentNumber);
    });

    test('3. TimeEntry correctly calculates total hours and respects location currency', () {
      final cadEntry = TimeEntry(
        repId: 'rep_clarence_kuiken',
        repName: 'Clarence Kuiken',
        date: '2026-08-16',
        plantId: 'plant_windsor_01',
        plantName: 'Windsor Assembly Plant',
        supplierId: 'sup_stellantis',
        supplierName: 'Stellantis Powertrain Systems',
        regularHours: 8.0,
        overtimeHours: 2.5,
        mileage: 45.0,
        mileageUnit: 'km',
        currency: 'CAD',
      );

      expect(cadEntry.totalHours, 10.5);
      expect(cadEntry.currency, 'CAD');
      expect(cadEntry.mileageUnit, 'km');

      final usdEntry = TimeEntry(
        repId: 'rep_hugo_ramos',
        repName: 'Hugo Ramos',
        date: '2026-08-16',
        plantId: 'plant_detroit_02',
        plantName: 'Detroit Assembly Complex',
        supplierId: 'sup_gm',
        supplierName: 'General Motors',
        regularHours: 8.0,
        overtimeHours: 0.0,
        mileage: 30.0,
        mileageUnit: 'mi',
        currency: 'USD',
      );

      expect(usdEntry.totalHours, 8.0);
      expect(usdEntry.currency, 'USD');
      expect(usdEntry.mileageUnit, 'mi');
    });

    test('4. UserProfile parses authoritative role and permissions cleanly', () {
      final user = UserProfile.fromJson({
        'id': 'rep_clarence_kuiken',
        'name': 'Clarence Kuiken',
        'username': 'clarence_kuiken',
        'email': 'clarence.kuiken@integrityds.com',
        'role': 'rep',
        'pay_currency': 'CAD',
      });

      expect(user.role, 'rep');
      expect(user.payCurrency, 'CAD');
      expect(user.name, 'Clarence Kuiken');
    });
  });
}
