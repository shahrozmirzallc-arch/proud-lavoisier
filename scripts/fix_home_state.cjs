const fs = require('fs');

let content = fs.readFileSync('D:/IDS_Pulse_App/lib/main.dart', 'utf8');

const target = `class IDSPulseHomeScreen extends StatefulWidget {
  const IDSPulseHomeScreen({super.key});`;

const replacement = `class IDSPulseHomeScreen extends StatefulWidget {
  const IDSPulseHomeScreen({super.key});

  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('D:/IDS_Pulse_App/lib/main.dart', content, 'utf8');
  fs.writeFileSync('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/ids_pulse_app/lib/main.dart', content, 'utf8');
  console.log('IDSPulseHomeScreen createState fixed successfully!');
} else {
  console.log('Target string not found');
}
