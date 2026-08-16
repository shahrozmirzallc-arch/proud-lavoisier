// mobile_flutter/lib/screens/floor_dashboard_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../services/auth_service.dart';
import '../services/offline_storage_service.dart';
import 'shift_report_screen.dart';
import 'quality_incident_screen.dart';
import 'rework_log_screen.dart';
import 'timesheet_screen.dart';
import 'splash_login_screen.dart';

class FloorDashboardScreen extends StatefulWidget {
  const FloorDashboardScreen({super.key});

  @override
  State<FloorDashboardScreen> createState() => _FloorDashboardScreenState();
}

class _FloorDashboardScreenState extends State<FloorDashboardScreen> {
  bool _isClockedIn = true;
  DateTime _shiftStartTime = DateTime.now().subtract(const Duration(hours: 3, minutes: 45));
  late Timer _clockTimer;
  Duration _elapsed = const Duration(hours: 3, minutes: 45);

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isClockedIn && mounted) {
        setState(() {
          _elapsed = DateTime.now().difference(_shiftStartTime);
        });
      }
    });
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(d.inHours);
    final minutes = twoDigits(d.inMinutes.remainder(60));
    final seconds = twoDigits(d.inSeconds.remainder(60));
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final offlineStorage = Provider.of<OfflineStorageService>(context);
    final user = authService.currentUser;

    final shiftReports = offlineStorage.getShiftReports();
    final incidents = offlineStorage.getIncidents();

    final int totalInspected = shiftReports.fold(0, (sum, r) => sum + r.inspectedCount);
    final int totalDefective = shiftReports.fold(0, (sum, r) => sum + r.defectiveCount);
    final double yieldRate = totalInspected > 0 ? ((totalInspected - totalDefective) / totalInspected) * 100 : 100.0;

    return Scaffold(
      backgroundColor: AppConstants.bgSlate,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryNavy,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppConstants.primaryEmerald,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shield_outlined, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'IDS PULSE FLOOR',
                  style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                ),
                Text(
                  user?.name ?? 'Field Inspector',
                  style: const TextStyle(color: AppConstants.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Sync Outbox Indicator
          if (offlineStorage.pendingSyncCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: ActionChip(
                backgroundColor: AppConstants.warningAmber.withAlpha(40),
                side: const BorderSide(color: AppConstants.warningAmber),
                avatar: const Icon(Icons.cloud_upload_outlined, color: AppConstants.warningAmber, size: 16),
                label: Text(
                  '${offlineStorage.pendingSyncCount} Sync',
                  style: const TextStyle(color: AppConstants.warningAmber, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                onPressed: () => offlineStorage.triggerBackgroundSync(),
              ),
            ),

          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70),
            tooltip: 'Sign Out',
            onPressed: () async {
              await authService.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const SplashLoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Active Shift & Timezone Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppConstants.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(10),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: _isClockedIn ? AppConstants.successGreen : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isClockedIn ? 'ACTIVE ON-SITE SHIFT' : 'CLOCKED OUT',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _isClockedIn ? AppConstants.successGreen : Colors.grey,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        DateFormat('EEE, MMM d').format(DateTime.now()),
                        style: const TextStyle(fontSize: 13, color: AppConstants.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Elapsed Shift Clock Display
                  Text(
                    _formatDuration(_elapsed),
                    style: const TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w900,
                      color: AppConstants.textPrimary,
                      letterSpacing: -1.0,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Ontario Plant Time (EDT)',
                    style: TextStyle(color: AppConstants.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 18),

                  // Clock In / Clock Out Button
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _isClockedIn = !_isClockedIn;
                        if (_isClockedIn) {
                          _shiftStartTime = DateTime.now();
                          _elapsed = Duration.zero;
                        }
                      });
                    },
                    icon: Icon(_isClockedIn ? Icons.stop_circle_outlined : Icons.play_circle_outlined),
                    label: Text(_isClockedIn ? 'Clock Out Shift' : 'Clock In to Plant Floor'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isClockedIn ? AppConstants.alertRed : AppConstants.primaryEmerald,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Active Project & Plant Location Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryEmerald.withAlpha(40),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.factory_outlined, color: AppConstants.primaryEmerald, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Windsor Assembly Plant',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Stellantis Powertrain • PRJ-WINDSOR-500',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryEmerald,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'CAD',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Floor Telemetry Stats Row
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppConstants.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('INSPECTED PCS', style: TextStyle(fontSize: 11, color: AppConstants.textSecondary, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(
                          '$totalInspected',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppConstants.textPrimary),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppConstants.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('QUALITY YIELD', style: TextStyle(fontSize: 11, color: AppConstants.textSecondary, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(
                          '${yieldRate.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: yieldRate >= 98.0 ? AppConstants.successGreen : AppConstants.warningAmber,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Quick Floor Actions Section
            const Text(
              'QUALITY ACTION CENTER',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppConstants.textSecondary, letterSpacing: 0.8),
            ),
            const SizedBox(height: 12),

            // Action 1: Log Shift Report
            _buildActionTile(
              context: context,
              icon: Icons.assignment_outlined,
              iconColor: AppConstants.primaryEmerald,
              title: 'Log Shift Report',
              subtitle: 'Record piece count, conformance rate & routing',
              badge: '${shiftReports.length} Submitted',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ShiftReportScreen()),
              ),
            ),
            const SizedBox(height: 10),

            // Action 2: Report Quality Incident / Containment Hold
            _buildActionTile(
              context: context,
              icon: Icons.warning_amber_rounded,
              iconColor: AppConstants.alertRed,
              title: 'Report Defect / Containment Hold',
              subtitle: '4-point containment stamp, crib lot & photos',
              badge: '${incidents.length} Active',
              badgeColor: AppConstants.alertRed,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const QualityIncidentScreen()),
              ),
            ),
            const SizedBox(height: 10),

            // Action 3: Log Rework & Sorting Feed
            _buildActionTile(
              context: context,
              icon: Icons.build_circle_outlined,
              iconColor: AppConstants.accentBlue,
              title: 'Log Rework & Sorting',
              subtitle: 'De-burring, harness re-route & salvage tracking',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ReworkLogScreen()),
              ),
            ),
            const SizedBox(height: 10),

            // Action 4: Timesheets & Overtime Submission
            _buildActionTile(
              context: context,
              icon: Icons.access_time_outlined,
              iconColor: const Color(0xFF8B5CF6),
              title: 'Timesheets & Overtime',
              subtitle: 'Daily hours split, mileage & client sign-off',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const TimesheetScreen()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    String? badge,
    Color? badgeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppConstants.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(5),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withAlpha(25),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppConstants.textPrimary),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: (badgeColor ?? AppConstants.primaryEmerald).withAlpha(30),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            badge,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: badgeColor ?? AppConstants.primaryEmerald,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppConstants.textSecondary, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppConstants.textSecondary, size: 20),
          ],
        ),
      ),
    );
  }
}
