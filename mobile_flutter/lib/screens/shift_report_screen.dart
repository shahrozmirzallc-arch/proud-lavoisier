// mobile_flutter/lib/screens/shift_report_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/shift_report.dart';
import '../services/auth_service.dart';
import '../services/offline_storage_service.dart';

class ShiftReportScreen extends StatefulWidget {
  const ShiftReportScreen({super.key});

  @override
  State<ShiftReportScreen> createState() => _ShiftReportScreenState();
}

class _ShiftReportScreenState extends State<ShiftReportScreen> {
  final _formKey = GlobalKey<FormState>();
  
  String _selectedClient = 'Stellantis Powertrain Systems';
  String _selectedPlant = 'Windsor Assembly Plant';
  final TextEditingController _partNumberController = TextEditingController(text: 'PN-84920194');
  final TextEditingController _shiftAreaController = TextEditingController(text: 'Main Assembly Line');
  final TextEditingController _notesController = TextEditingController();
  
  int _inspectedCount = 120;
  int _defectiveCount = 0;
  int _reworkedCount = 0;
  double _hoursWorked = 8.0;

  final Set<String> _selectedContacts = {'Mark Vance (mark.vance@stellantis.com)'};

  final List<String> _availableContacts = [
    'Mark Vance (mark.vance@stellantis.com)',
    'Sandra Bullock (sandra.b@stellantis.com)',
    'Robert Sterling (r.sterling@magna.com)',
    'Elena Rostova (e.rostova@magna.com)',
    'Donna Cabral (donna.cabral@integrityds.com)',
  ];

  @override
  void dispose() {
    _partNumberController.dispose();
    _shiftAreaController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  double get _conformanceYield {
    if (_inspectedCount <= 0) return 100.0;
    final nonDefective = (_inspectedCount - _defectiveCount).clamp(0, _inspectedCount);
    return (nonDefective / _inspectedCount) * 100.0;
  }

  int get _ppm {
    if (_inspectedCount <= 0) return 0;
    return ((_defectiveCount / _inspectedCount) * 1000000).round();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final authService = Provider.of<AuthService>(context, listen: false);
    final offlineStorage = Provider.of<OfflineStorageService>(context, listen: false);
    final user = authService.currentUser;

    final report = ShiftReport(
      repId: user?.id ?? 'rep_clarence_kuiken',
      repName: user?.name ?? 'Clarence Kuiken',
      date: DateTime.now().toIso8601String().split('T')[0],
      plantId: 'plant_windsor_01',
      plantName: _selectedPlant,
      supplierId: 'sup_stellantis',
      supplierName: _selectedClient,
      partNumber: _partNumberController.text.trim(),
      inspectedCount: _inspectedCount,
      defectiveCount: _defectiveCount,
      reworkedCount: _reworkedCount,
      hoursWorked: _hoursWorked,
      shiftArea: _shiftAreaController.text.trim(),
      shiftNotes: _notesController.text.trim(),
      routingContacts: _selectedContacts.toList(),
    );

    await offlineStorage.saveShiftReport(report);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppConstants.primaryEmerald,
          content: Row(
            children: const [
              Icon(Icons.check_circle_outline, color: Colors.white),
              SizedBox(width: 10),
              Text('Shift Report Logged & Dispatched!', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.bgSlate,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryNavy,
        elevation: 0,
        title: const Text(
          'Log Shift Report',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Client & Plant Information Container
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppConstants.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('CLIENT & ASSEMBLY PLANT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 12),

                    DropdownButtonFormField<String>(
                      initialValue: _selectedClient,
                      decoration: InputDecoration(
                        labelText: 'Client Company',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Stellantis Powertrain Systems', child: Text('Stellantis Powertrain Systems')),
                        DropdownMenuItem(value: 'Magna Powertrain International', child: Text('Magna Powertrain International')),
                        DropdownMenuItem(value: 'General Motors CAMI Assembly', child: Text('General Motors CAMI Assembly')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedClient = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      initialValue: _selectedPlant,
                      decoration: InputDecoration(
                        labelText: 'Assembly Plant Location',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Windsor Assembly Plant', child: Text('Windsor Assembly Plant (ON)')),
                        DropdownMenuItem(value: 'Oshawa Assembly Complex', child: Text('Oshawa Assembly Complex (ON)')),
                        DropdownMenuItem(value: 'Sterling Heights Assembly Plant', child: Text('Sterling Heights Assembly Plant (MI)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedPlant = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _partNumberController,
                      decoration: InputDecoration(
                        labelText: 'Suspect Part Number',
                        prefixIcon: const Icon(Icons.qr_code, color: AppConstants.textSecondary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Please enter Part Number' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Production Counters Container
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppConstants.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('PRODUCTION & QUALITY METRICS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 14),

                    // Counter 1: Total Inspected
                    _buildCounterRow(
                      label: 'Total Inspected Pieces',
                      count: _inspectedCount,
                      color: AppConstants.primaryEmerald,
                      onChanged: (v) => setState(() => _inspectedCount = v.clamp(0, 100000)),
                    ),
                    const Divider(height: 24),

                    // Counter 2: Defective Pieces
                    _buildCounterRow(
                      label: 'Defective Pieces Found',
                      count: _defectiveCount,
                      color: AppConstants.alertRed,
                      onChanged: (v) => setState(() => _defectiveCount = v.clamp(0, _inspectedCount)),
                    ),
                    const Divider(height: 24),

                    // Counter 3: Reworked Pieces
                    _buildCounterRow(
                      label: 'Reworked / Sorted Pieces',
                      count: _reworkedCount,
                      color: AppConstants.accentBlue,
                      onChanged: (v) => setState(() => _reworkedCount = v.clamp(0, _inspectedCount)),
                    ),
                    const SizedBox(height: 18),

                    // Real-Time Conformance Yield Gauge
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _conformanceYield >= 98.0 ? AppConstants.successGreen.withAlpha(20) : AppConstants.warningAmber.withAlpha(20),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _conformanceYield >= 98.0 ? AppConstants.successGreen.withAlpha(60) : AppConstants.warningAmber.withAlpha(60)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('CONFORMANCE YIELD', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                              const SizedBox(height: 2),
                              Text(
                                '${_conformanceYield.toStringAsFixed(1)}%',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: _conformanceYield >= 98.0 ? AppConstants.successGreen : AppConstants.warningAmber,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('DEFECT PPM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                              const SizedBox(height: 2),
                              Text(
                                '$_ppm PPM',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppConstants.textPrimary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Quality Contacts Routing Container
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppConstants.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('CLIENT QUALITY CONTACT ROUTING', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 10),

                    ..._availableContacts.map((contact) {
                      final isSelected = _selectedContacts.contains(contact);
                      return CheckboxListTile(
                        value: isSelected,
                        activeColor: AppConstants.primaryEmerald,
                        contentPadding: EdgeInsets.zero,
                        title: Text(contact, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        onChanged: (checked) {
                          setState(() {
                            if (checked == true) {
                              _selectedContacts.add(contact);
                            } else {
                              _selectedContacts.remove(contact);
                            }
                          });
                        },
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Submit Button
              ElevatedButton.icon(
                onPressed: _handleSubmit,
                icon: const Icon(Icons.send_outlined),
                label: const Text('Submit Shift Report to Command Center', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryEmerald,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCounterRow({
    required String label,
    required int count,
    required Color color,
    required ValueChanged<int> onChanged,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppConstants.textPrimary)),
        ),
        Row(
          children: [
            IconButton(
              onPressed: () => onChanged(count - 10),
              icon: const Icon(Icons.remove_circle_outline),
              color: AppConstants.textSecondary,
            ),
            Container(
              constraints: const BoxConstraints(minWidth: 50),
              alignment: Alignment.center,
              child: Text(
                '$count',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
              ),
            ),
            IconButton(
              onPressed: () => onChanged(count + 10),
              icon: const Icon(Icons.add_circle_outline),
              color: color,
            ),
          ],
        ),
      ],
    );
  }
}
