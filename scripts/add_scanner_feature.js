const fs = require('fs');

const scannerWidget = `
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
`;

let content = fs.readFileSync('D:/IDS_Pulse_App/lib/main.dart', 'utf8');
if (!content.includes('/scanner')) {
  content = content.replace("'/home': (context) => const IDSPulseHomeScreen(),", "'/home': (context) => const IDSPulseHomeScreen(),\n        '/scanner': (context) => const BarcodeScannerScreen(),");
  content = content.replace('class IDSPulseHomeScreen extends StatelessWidget {', scannerWidget + '\nclass IDSPulseHomeScreen extends StatefulWidget {');
  fs.writeFileSync('D:/IDS_Pulse_App/lib/main.dart', content, 'utf8');
  fs.writeFileSync('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/ids_pulse_app/lib/main.dart', content, 'utf8');
  console.log('Scanner feature added successfully!');
} else {
  console.log('Scanner feature already present');
}
