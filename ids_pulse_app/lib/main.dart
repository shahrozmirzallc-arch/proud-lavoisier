import 'package:flutter/material.dart';

void main() {
  runApp(const IDSPulseApp());
}

class IDSPulseApp extends StatelessWidget {
  const IDSPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IDS Pulse Operations',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00875A)),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const IDSPulseSplashScreen(),
        '/login': (context) => const IDSPulseLoginScreen(),
        '/home': (context) => const IDSPulseHomeScreen(),
        '/scanner': (context) => const BarcodeScannerScreen(),
      },
    );
  }
}

// ----------------------------------------------------
// 1. ANIMATED SPLIT-CURTAIN SPLASH SCREEN WIDGET
// ----------------------------------------------------
class IDSPulseSplashScreen extends StatefulWidget {
  const IDSPulseSplashScreen({super.key});

  @override
  State<IDSPulseSplashScreen> createState() => _IDSPulseSplashScreenState();
}

class _IDSPulseSplashScreenState extends State<IDSPulseSplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _splitController;
  late AnimationController _logoController;
  late AnimationController _pulseController;

  late Animation<Offset> _topCurtainAnimation;
  late Animation<Offset> _bottomCurtainAnimation;
  late Animation<double> _logoFadeAnimation;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _pulseDrawAnimation;

  @override
  void initState() {
    super.initState();

    _splitController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 750),
    );

    _topCurtainAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, -1.02),
    ).animate(CurvedAnimation(
      parent: _splitController,
      curve: Curves.easeInOutCubic,
    ));

    _bottomCurtainAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0, 1.02),
    ).animate(CurvedAnimation(
      parent: _splitController,
      curve: Curves.easeInOutCubic,
    ));

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _logoFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeOut),
    );
    _logoScaleAnimation = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeOutCubic),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _pulseDrawAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _startSequence();
  }

  void _startSequence() async {
    await Future.delayed(const Duration(milliseconds: 350));
    if (mounted) _splitController.forward();

    await Future.delayed(const Duration(milliseconds: 170));
    if (mounted) _logoController.forward();

    await Future.delayed(const Duration(milliseconds: 630));
    if (mounted) _pulseController.forward();

    await Future.delayed(const Duration(milliseconds: 1100));
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  void dispose() {
    _splitController.dispose();
    _logoController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A192F),
      body: Stack(
        children: [
          Center(
            child: ScaleTransition(
              scale: _logoScaleAnimation,
              child: FadeTransition(
                opacity: _logoFadeAnimation,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset(
                      'assets/ids_logo.png',
                      width: 140,
                      errorBuilder: (ctx, err, stack) => const Icon(
                        Icons.shield_outlined,
                        size: 80,
                        color: Color(0xFF00875A),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'IDS PULSE',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'INTEGRITY DRIVEN SOLUTIONS INC.',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF00875A),
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 30),
                    AnimatedBuilder(
                      animation: _pulseDrawAnimation,
                      builder: (context, child) {
                        return SizedBox(
                          width: 200,
                          height: 30,
                          child: CustomPaint(
                            painter: HeartbeatPulsePainter(
                              progress: _pulseDrawAnimation.value,
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
          SlideTransition(
            position: _topCurtainAnimation,
            child: Container(
              height: MediaQuery.of(context).size.height / 2,
              color: const Color(0xFF0B132B),
              alignment: Alignment.bottomCenter,
              child: Container(
                height: 2,
                color: const Color(0xFF00875A),
              ),
            ),
          ),
          SlideTransition(
            position: _bottomCurtainAnimation,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                height: MediaQuery.of(context).size.height / 2,
                color: const Color(0xFF0B132B),
                alignment: Alignment.topCenter,
                child: Container(
                  height: 2,
                  color: const Color(0xFF00875A),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class HeartbeatPulsePainter extends CustomPainter {
  final double progress;
  HeartbeatPulsePainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00875A)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final w = size.width;
    final h = size.height;
    final mid = h / 2;

    path.moveTo(0, mid);
    path.lineTo(w * 0.35, mid);
    path.lineTo(w * 0.42, mid - 12);
    path.lineTo(w * 0.48, mid + 14);
    path.lineTo(w * 0.54, mid - 22);
    path.lineTo(w * 0.60, mid + 8);
    path.lineTo(w * 0.66, mid);
    path.lineTo(w, mid);

    final pathMetrics = path.computeMetrics().first;
    final extractPath = pathMetrics.extractPath(0, pathMetrics.length * progress);

    canvas.drawPath(extractPath, paint);
  }

  @override
  bool shouldRepaint(covariant HeartbeatPulsePainter oldDelegate) =>
      oldDelegate.progress != progress;
}

// ----------------------------------------------------
// 2. MOBILE LOGIN SCREEN WIDGET
// ----------------------------------------------------
class IDSPulseLoginScreen extends StatefulWidget {
  const IDSPulseLoginScreen({super.key});

  @override
  State<IDSPulseLoginScreen> createState() => _IDSPulseLoginScreenState();
}

class _IDSPulseLoginScreenState extends State<IDSPulseLoginScreen> {
  final _usernameController = TextEditingController(text: 'clarence');
  final _passwordController = TextEditingController(text: 'password123');
  bool _obscurePassword = true;
  bool _isSubmitting = false;

  void _handleSignIn() async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() => _isSubmitting = false);
      Navigator.of(context).pushReplacementNamed('/home');
    }
  }

  void _quickFill(String u, String p) {
    setState(() {
      _usernameController.text = u;
      _passwordController.text = p;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),
              Image.asset(
                'assets/ids_logo.png',
                width: 100,
                errorBuilder: (ctx, err, stack) => const Icon(
                  Icons.shield_outlined,
                  size: 70,
                  color: Color(0xFF00875A),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Welcome Back',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Sign in to access your quality terminal',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 32),

              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Username', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _usernameController,
                    decoration: InputDecoration(
                      hintText: 'Enter username',
                      prefixIcon: const Icon(Icons.person_outline, size: 20),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF00875A), width: 1.8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      hintText: 'Enter password',
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF00875A), width: 1.8),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _handleSignIn,
                  icon: const Icon(Icons.lock_outline, size: 18),
                  label: Text(
                    _isSubmitting ? 'Signing in...' : 'Sign in to IDS Pulse',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00875A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 36),

              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'QUICK 1-CLICK ROLE SIGN-INS:',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _roleChip('Clarence Kuiken (Rep)', 'clarence', 'password123', const Color(0xFFEFF6FF), const Color(0xFF1D4ED8)),
                  _roleChip('Donna Cabral (Admin)', 'donna', 'password123', const Color(0xFFFEF3C7), const Color(0xFFB45309)),
                  _roleChip('Colleen Boyd (Accountant)', 'colleen', 'password123', const Color(0xFFF1F5F9), const Color(0xFF475569)),
                  _roleChip('Magna Client', 'magna_client', 'password123', const Color(0xFFECFDF5), const Color(0xFF047857)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _roleChip(String label, String u, String p, Color bg, Color textCol) {
    return GestureDetector(
      onTap: () => _quickFill(u, p),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: textCol.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: textCol,
          ),
        ),
      ),
    );
  }
}

// ----------------------------------------------------
// 3. HOME SCREEN TERMINAL WIDGET
// ----------------------------------------------------

// ----------------------------------------------------
// 3. BARCODE & VIN CAMERA SCANNER SCREEN
// ----------------------------------------------------
class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _laserController;
  late Animation<double> _laserAnimation;

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(parent: _laserController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _laserController.dispose();
    super.dispose();
  }

  void _returnScannedData(String partNumber, String vin, String rma) {
    Navigator.pop(context, {
      'part_number': partNumber,
      'vin': vin,
      'rma': rma,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('VIN & Part Barcode Scanner', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.amber),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          Container(
            width: double.infinity,
            height: double.infinity,
            color: const Color(0xFF0F172A),
            child: const Center(
              child: Opacity(
                opacity: 0.15,
                child: Icon(Icons.linked_camera, size: 280, color: Colors.white),
              ),
            ),
          ),
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(0.5), width: 1.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  Positioned(top: 0, left: 0, child: _cornerWidget(top: true, left: true)),
                  Positioned(top: 0, right: 0, child: _cornerWidget(top: true, left: false)),
                  Positioned(bottom: 0, left: 0, child: _cornerWidget(top: false, left: true)),
                  Positioned(bottom: 0, right: 0, child: _cornerWidget(top: false, left: false)),
                  AnimatedBuilder(
                    animation: _laserAnimation,
                    builder: (ctx, child) {
                      return Positioned(
                        top: 280 * _laserAnimation.value,
                        left: 10,
                        right: 10,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withOpacity(0.8),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.center_focus_strong, color: Color(0xFF10B981), size: 16),
                      SizedBox(width: 8),
                      Text('Align VIN or Component Barcode inside frame', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () => _returnScannedData('PN 86394644', '1FTVW1EL5PW089201', 'CK062026'),
                  icon: const Icon(Icons.qr_code_scanner, size: 20),
                  label: const Text('Simulate Scan: PN 86394644 (LH HD Light)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () => _returnScannedData('PN 84920194', '2C3CDZAG5NH192840', 'CK072026'),
                  icon: const Icon(Icons.directions_car, size: 20),
                  label: const Text('Scan VIN: 2C3CDZAG5NH192840'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white38),
                    minimumSize: const Size(double.infinity, 46),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _cornerWidget({required bool top, required bool left}) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        border: Border(
          top: top ? const BorderSide(color: Color(0xFF10B981), width: 3.5) : BorderSide.none,
          bottom: !top ? const BorderSide(color: Color(0xFF10B981), width: 3.5) : BorderSide.none,
          left: left ? const BorderSide(color: Color(0xFF10B981), width: 3.5) : BorderSide.none,
          right: !left ? const BorderSide(color: Color(0xFF10B981), width: 3.5) : BorderSide.none,
        ),
      ),
    );
  }
}

class IDSPulseHomeScreen extends StatefulWidget {
  const IDSPulseHomeScreen({super.key});

  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}

class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {
  final _partNumberController = TextEditingController(text: 'PN 86394644');
  final _rmaController = TextEditingController(text: 'CK062026');
  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');

  void _showModuleModal(BuildContext context, String title, Widget content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A))),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const Divider(),
              const SizedBox(height: 10),
              content,
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF10284A),
        foregroundColor: Colors.white,
        title: const Text('IDS Pulse � Floor Terminal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Shift Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Clarence Kuiken � Oakville Assembly (Day Shift)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'QUALITY & SHIFT MODULES',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 1.1),
            ),
            const SizedBox(height: 12),

            _moduleTile(
              context,
              Icons.report_problem_outlined,
              'GCA Incident Defect Report',
              'Capture photos, scan VIN/part barcodes & dispatch 8D alerts',
              const Color(0xFFEF4444),
              () => _showModuleModal(
                context,
                'GCA Quality Incident Report',
                Column(
                  children: [
                    const TextField(decoration: InputDecoration(labelText: 'Part Number (e.g. PN 86394644)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'RMA Number (e.g. CK062026)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(maxLines: 3, decoration: InputDecoration(labelText: 'Defect Description & Findings', border: OutlineInputBorder())),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.send),
                      label: const Text('Submit GCA Incident Report'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            _moduleTile(
              context,
              Icons.fact_check_outlined,
              'Daily Shift Quality Report',
              'Log total inspected volume, defects & shift handover notes',
              const Color(0xFF3B82F6),
              () => _showModuleModal(
                context,
                'Daily Shift Quality Report',
                Column(
                  children: [
                    const TextField(decoration: InputDecoration(labelText: 'Total Inspected Volume (Pcs)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'Total Defects Found (Pcs)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(maxLines: 3, decoration: InputDecoration(labelText: 'Shift Handover & Walk Notes', border: OutlineInputBorder())),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('Submit Daily Shift Report'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            _moduleTile(
              context,
              Icons.build_outlined,
              'Rework & Sorting Activity Log',
              'Record piece-by-piece sorting and floor containment rework',
              const Color(0xFF8B5CF6),
              () => _showModuleModal(
                context,
                'Rework & Sorting Log',
                Column(
                  children: [
                    const TextField(decoration: InputDecoration(labelText: 'Pieces Sorted / Inspected', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'Pieces Reworked / Reclaimed', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'Scrap Pieces Count', border: OutlineInputBorder())),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.save_outlined),
                      label: const Text('Save Rework Entry'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            _moduleTile(
              context,
              Icons.access_time_outlined,
              'Time & Expense Claim Report',
              'Submit shift hours (USD/CAD) and mileage receipts',
              const Color(0xFF10B981),
              () => _showModuleModal(
                context,
                'Time & Expense Claim',
                Column(
                  children: [
                    const TextField(decoration: InputDecoration(labelText: 'Hours Worked (e.g. 8.0 Hrs)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'Billing Currency (USD / CAD)', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    const TextField(decoration: InputDecoration(labelText: 'Mileage / Incidentals (USD/CAD)', border: OutlineInputBorder())),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.attach_money),
                      label: const Text('Submit Claim For Approval'),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 48)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _moduleTile(BuildContext context, IconData icon, String title, String desc, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                  const SizedBox(height: 2),
                  Text(desc, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }
}
