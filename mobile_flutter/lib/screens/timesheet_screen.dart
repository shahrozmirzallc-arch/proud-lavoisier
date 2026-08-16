// mobile_flutter/lib/screens/timesheet_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/time_entry.dart';
import '../services/auth_service.dart';
import '../services/offline_storage_service.dart';

class TimesheetScreen extends StatefulWidget {
  const TimesheetScreen({super.key});

  @override
  State<TimesheetScreen> createState() => _TimesheetScreenState();
}

class _TimesheetScreenState extends State<TimesheetScreen> {
  final _formKey = GlobalKey<FormState>();

  String _selectedClient = 'Stellantis Powertrain Systems';
  String _selectedPlant = 'Windsor Assembly Plant';
  double _regularHours = 8.0;
  double _overtimeHours = 0.0;
  final TextEditingController _mileageController = TextEditingController(text: '45.0');

  @override
  void dispose() {
    _mileageController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final offlineStorage = Provider.of<OfflineStorageService>(context, listen: false);
    final user = authService.currentUser;

    final entry = TimeEntry(
      date: DateTime.now().toIso8601String().split('T')[0],
      repId: user?.id ?? 'rep_clarence_kuiken',
      repName: user?.name ?? 'Clarence Kuiken',
      plantId: 'plant_windsor_01',
      plantName: _selectedPlant,
      supplierId: 'sup_stellantis',
      supplierName: _selectedClient,
      regularHours: _regularHours,
      overtimeHours: _overtimeHours,
      mileage: double.tryParse(_mileageController.text.trim()) ?? 0.0,
      mileageUnit: user?.payCurrency == 'USD' ? 'mi' : 'km',
      currency: user?.payCurrency ?? 'CAD',
      status: 'pending',
    );

    await offlineStorage.saveTimeEntry(entry);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF8B5CF6),
          content: Row(
            children: const [
              Icon(Icons.check_circle_outline, color: Colors.white),
              SizedBox(width: 10),
              Text('Timesheet Logged for Payroll Audit!', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final offlineStorage = Provider.of<OfflineStorageService>(context);
    final user = authService.currentUser;
    final timeEntries = offlineStorage.getTimeEntries();

    final isUs = user?.payCurrency == 'USD';

    return Scaffold(
      backgroundColor: AppConstants.bgSlate,
      appBar: AppBar(
        backgroundColor: const Color(0xFF8B5CF6),
        elevation: 0,
        title: const Text(
          'Timesheets & Overtime',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Log Hours Card
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('LOG SHIFT HOURS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withAlpha(25),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${user?.payCurrency ?? "CAD"} Pay',
                          style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Regular Hours
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Regular Hours (Max 8.0h)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      Row(
                        children: [
                          IconButton(onPressed: () => setState(() => _regularHours = (_regularHours - 0.5).clamp(1.0, 8.0)), icon: const Icon(Icons.remove_circle_outline)),
                          Text('${_regularHours.toStringAsFixed(1)}h', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          IconButton(onPressed: () => setState(() => _regularHours = (_regularHours + 0.5).clamp(1.0, 8.0)), icon: const Icon(Icons.add_circle_outline)),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Overtime Hours
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Overtime (Pre-Approved)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      Row(
                        children: [
                          IconButton(onPressed: () => setState(() => _overtimeHours = (_overtimeHours - 0.5).clamp(0.0, 12.0)), icon: const Icon(Icons.remove_circle_outline)),
                          Text('${_overtimeHours.toStringAsFixed(1)}h', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppConstants.warningAmber)),
                          IconButton(onPressed: () => setState(() => _overtimeHours += 0.5), icon: const Icon(Icons.add_circle_outline, color: AppConstants.warningAmber)),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Mileage
                  TextFormField(
                    controller: _mileageController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: isUs ? 'Travel Mileage (Miles)' : 'Travel Mileage (Kilometers)',
                      prefixIcon: const Icon(Icons.directions_car_outlined, color: AppConstants.textSecondary),
                      suffixText: isUs ? 'mi (@ \$0.73/mi)' : 'km (@ \$0.65/km)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      filled: true,
                      fillColor: AppConstants.bgSlate,
                    ),
                  ),
                  const SizedBox(height: 18),

                  ElevatedButton.icon(
                    onPressed: _handleSubmit,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Submit Timesheet for Payroll', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8B5CF6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Timesheet History List
            const Text(
              'RECENT LOGGED TIMESHEETS',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary, letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),

            if (timeEntries.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppConstants.borderSubtle),
                ),
                alignment: Alignment.center,
                child: const Text('No timesheets logged today yet.', style: TextStyle(color: AppConstants.textSecondary)),
              )
            else
              ...timeEntries.map((entry) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppConstants.borderSubtle),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry.plantName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(
                            '${entry.date} • ${entry.totalHours.toStringAsFixed(1)} hrs total (${entry.regularHours.toStringAsFixed(1)}h reg + ${entry.overtimeHours.toStringAsFixed(1)}h OT)',
                            style: const TextStyle(fontSize: 12, color: AppConstants.textSecondary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppConstants.primaryEmerald.withAlpha(20),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'LOGGED',
                          style: TextStyle(color: AppConstants.primaryEmerald, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
