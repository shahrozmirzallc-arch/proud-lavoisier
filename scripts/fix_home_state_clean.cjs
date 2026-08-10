const fs = require('fs');

let content = fs.readFileSync('D:/IDS_Pulse_App/lib/main.dart', 'utf8');

const oldHomeBlock = `class IDSPulseHomeScreen extends StatefulWidget {
  const IDSPulseHomeScreen({super.key});

  void _showModuleModal(BuildContext context, String title, Widget content) {`;

const newHomeBlock = `class IDSPulseHomeScreen extends StatefulWidget {
  const IDSPulseHomeScreen({super.key});

  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}

class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {
  final _partNumberController = TextEditingController(text: 'PN 86394644');
  final _rmaController = TextEditingController(text: 'CK062026');
  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');

  void _showModuleModal(BuildContext context, String title, Widget content) {`;

// Normalize whitespace for replacement
content = content.replace(/class IDSPulseHomeScreen extends StatefulWidget\s*\{\s*const IDSPulseHomeScreen\(\{super\.key\}\);\s*void _showModuleModal/, newHomeBlock);

fs.writeFileSync('D:/IDS_Pulse_App/lib/main.dart', content, 'utf8');
fs.writeFileSync('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/ids_pulse_app/lib/main.dart', content, 'utf8');
console.log('Fixed IDSPulseHomeScreen successfully!');
