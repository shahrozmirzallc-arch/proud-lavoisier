// mobile_flutter/lib/screens/rework_log_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/rework_log.dart';
import '../services/auth_service.dart';
import '../services/offline_storage_service.dart';

class ReworkLogScreen extends StatefulWidget {
  const ReworkLogScreen({super.key});

  @override
  State<ReworkLogScreen> createState() => _ReworkLogScreenState();
}

class _ReworkLogScreenState extends State<ReworkLogScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedClient = 'Stellantis Powertrain Systems';
  String _selectedPlant = 'Windsor Assembly Plant';
  final TextEditingController _partNumberController = TextEditingController(text: 'PN-84920194');
  final TextEditingController _actionTakenController = TextEditingController(text: 'De-burred sharp mounting tabs and re-routed wiring harness to clear assembly clearance channel.');
  
  int _reworkedCount = 45;
  double _hoursWorked = 2.5;
  String _disposition = 'Approved';

  @override
  void dispose() {
    _partNumberController.dispose();
    _actionTakenController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final authService = Provider.of<AuthService>(context, listen: false);
    final offlineStorage = Provider.of<OfflineStorageService>(context, listen: false);
    final user = authService.currentUser;

    final rework = ReworkLog(
      date: DateTime.now().toIso8601String().split('T')[0],
      repId: user?.id ?? 'rep_clarence_kuiken',
      repName: user?.name ?? 'Clarence Kuiken',
      plantId: 'plant_windsor_01',
      plantName: _selectedPlant,
      supplierId: 'sup_stellantis',
      supplierName: _selectedClient,
      partNumber: _partNumberController.text.trim(),
      reworkedCount: _reworkedCount,
      hoursWorked: _hoursWorked,
      actionTaken: _actionTakenController.text.trim(),
      disposition: _disposition,
    );

    await offlineStorage.saveReworkLog(rework);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppConstants.accentBlue,
          content: Row(
            children: const [
              Icon(Icons.check_circle_outline, color: Colors.white),
              SizedBox(width: 10),
              Text('Rework & Sorting Log Stored!', style: TextStyle(fontWeight: FontWeight.bold)),
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
        backgroundColor: AppConstants.accentBlue,
        elevation: 0,
        title: const Text(
          'Log Rework & Sorting Feed',
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
                    const Text('REWORK DISPOSITION & DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _partNumberController,
                      decoration: InputDecoration(
                        labelText: 'Part Number',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Reworked Pieces', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  IconButton(onPressed: () => setState(() => _reworkedCount = (_reworkedCount - 5).clamp(1, 10000)), icon: const Icon(Icons.remove_circle_outline)),
                                  Text('$_reworkedCount', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  IconButton(onPressed: () => setState(() => _reworkedCount += 5), icon: const Icon(Icons.add_circle_outline)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Hours Spent', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  IconButton(onPressed: () => setState(() => _hoursWorked = (_hoursWorked - 0.5).clamp(0.5, 24.0)), icon: const Icon(Icons.remove_circle_outline)),
                                  Text('${_hoursWorked.toStringAsFixed(1)}h', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  IconButton(onPressed: () => setState(() => _hoursWorked += 0.5), icon: const Icon(Icons.add_circle_outline)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _actionTakenController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Rework Action Taken & Method',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: AppConstants.bgSlate,
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Please describe rework action' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton.icon(
                onPressed: _handleSubmit,
                icon: const Icon(Icons.save_outlined),
                label: const Text('Log Rework Units to Operations Feed', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.accentBlue,
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
}
