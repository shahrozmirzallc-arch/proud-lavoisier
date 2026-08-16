// mobile_flutter/lib/screens/quality_incident_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/incident.dart';
import '../services/auth_service.dart';
import '../services/offline_storage_service.dart';

class QualityIncidentScreen extends StatefulWidget {
  const QualityIncidentScreen({super.key});

  @override
  State<QualityIncidentScreen> createState() => _QualityIncidentScreenState();
}

class _QualityIncidentScreenState extends State<QualityIncidentScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedClient = 'Stellantis Powertrain Systems';
  String _selectedPlant = 'Windsor Assembly Plant';
  final TextEditingController _partNumberController = TextEditingController(text: 'PN-84920194');
  final TextEditingController _lotNumberController = TextEditingController(text: 'LOT-2026-W08');
  final TextEditingController _quarantineLocationController = TextEditingController(text: 'Quality Crib 4 - Red Hold Area');
  final TextEditingController _immediateActionController = TextEditingController(text: '100% Sort & Segregation Initiated; Line Feed Stopped');
  final TextEditingController _descriptionController = TextEditingController(text: 'Porosity and sub-surface voiding detected on machined mating face.');

  String _defectType = 'Porosity & Casting Void';
  String _levelOfConcern = 'critical';
  int _piecesDefective = 8;

  @override
  void dispose() {
    _partNumberController.dispose();
    _lotNumberController.dispose();
    _quarantineLocationController.dispose();
    _immediateActionController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final authService = Provider.of<AuthService>(context, listen: false);
    final offlineStorage = Provider.of<OfflineStorageService>(context, listen: false);
    final user = authService.currentUser;

    final incident = Incident(
      date: DateTime.now().toIso8601String().split('T')[0],
      repId: user?.id ?? 'rep_clarence_kuiken',
      repName: user?.name ?? 'Clarence Kuiken',
      plantId: 'plant_windsor_01',
      plantName: _selectedPlant,
      supplierId: 'sup_stellantis',
      supplierName: _selectedClient,
      partNumber: _partNumberController.text.trim(),
      lotNumber: _lotNumberController.text.trim(),
      defectType: _defectType,
      levelOfConcern: _levelOfConcern,
      piecesDefective: _piecesDefective,
      quarantineLocation: _quarantineLocationController.text.trim(),
      immediateAction: _immediateActionController.text.trim(),
      defectDescription: _descriptionController.text.trim(),
    );

    await offlineStorage.saveIncident(incident);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppConstants.alertRed,
          content: Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.white),
              SizedBox(width: 10),
              Text('Containment Hold Alert Stamped & Dispatched!', style: TextStyle(fontWeight: FontWeight.bold)),
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
        backgroundColor: AppConstants.alertRed,
        elevation: 0,
        title: const Text(
          'Report Defect / Containment',
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
              // 4-Point Containment Stamp Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppConstants.alertRed.withAlpha(20),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppConstants.alertRed.withAlpha(60)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.shield_outlined, color: AppConstants.alertRed, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'MANDATORY 4-POINT AUTOMOTIVE CONTAINMENT STAMP',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppConstants.alertRed, letterSpacing: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Containment Core Fields Container
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
                    const Text('1. TRACEABILITY & SEVERITY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 14),

                    // Level of Concern / Severity Radio Tabs
                    Row(
                      children: [
                        _buildSeverityOption('minor', 'Minor (Alert)'),
                        const SizedBox(width: 8),
                        _buildSeverityOption('major', 'Major (Hold)'),
                        const SizedBox(width: 8),
                        _buildSeverityOption('critical', 'Critical (Spill)'),
                      ],
                    ),
                    const SizedBox(height: 14),

                    DropdownButtonFormField<String>(
                      initialValue: _defectType,
                      decoration: InputDecoration(
                        labelText: 'Defect Classification',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Porosity & Casting Void', child: Text('Porosity & Casting Void')),
                        DropdownMenuItem(value: 'Dimensional Out of Spec', child: Text('Dimensional Out of Spec')),
                        DropdownMenuItem(value: 'Surface Scratch / Tool Mark', child: Text('Surface Scratch / Tool Mark')),
                        DropdownMenuItem(value: 'Burrs / Flash on Edge', child: Text('Burrs / Flash on Edge')),
                        DropdownMenuItem(value: 'Spill / Contamination', child: Text('Spill / Contamination')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _defectType = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _partNumberController,
                            decoration: InputDecoration(
                              labelText: 'Part Number',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: AppConstants.bgSlate,
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _lotNumberController,
                            decoration: InputDecoration(
                              labelText: 'Lot / Batch #',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: true,
                              fillColor: AppConstants.bgSlate,
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Physical Containment Actions Container
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
                    const Text('2. QUARANTINE CRIB & CONTAINMENT ACTION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _quarantineLocationController,
                      decoration: InputDecoration(
                        labelText: 'Physical Quarantine Crib Location',
                        prefixIcon: const Icon(Icons.place_outlined, color: AppConstants.textSecondary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Please specify Crib Location' : null,
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _immediateActionController,
                      decoration: InputDecoration(
                        labelText: 'Immediate Action Taken',
                        prefixIcon: const Icon(Icons.bolt_outlined, color: AppConstants.textSecondary),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Please specify Immediate Action' : null,
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Defect Narrative & Visual Description',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Please enter defect description' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Submit Containment Button
              ElevatedButton.icon(
                onPressed: _handleSubmit,
                icon: const Icon(Icons.warning_amber_rounded),
                label: const Text('Broadcast Containment Hold to Client Portal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.alertRed,
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

  Widget _buildSeverityOption(String val, String label) {
    final isSelected = _levelOfConcern == val;
    Color activeColor = AppConstants.primaryEmerald;
    if (val == 'major') activeColor = AppConstants.warningAmber;
    if (val == 'critical') activeColor = AppConstants.alertRed;

    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _levelOfConcern = val),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? activeColor.withAlpha(25) : AppConstants.bgSlate,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? activeColor : AppConstants.borderSubtle, width: isSelected ? 2 : 1),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
              color: isSelected ? activeColor : AppConstants.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
