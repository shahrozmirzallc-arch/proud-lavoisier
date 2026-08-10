with open("D:/IDS_Pulse_App/lib/main.dart", "r", encoding="utf-8") as f:
    text = f.read()

dup = """  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}

class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {
  final _partNumberController = TextEditingController(text: 'PN 86394644');
  final _rmaController = TextEditingController(text: 'CK062026');
  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');

  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}

class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {
  final _partNumberController = TextEditingController(text: 'PN 86394644');
  final _rmaController = TextEditingController(text: 'CK062026');
  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');"""

clean = """  @override
  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();
}

class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {
  final _partNumberController = TextEditingController(text: 'PN 86394644');
  final _rmaController = TextEditingController(text: 'CK062026');
  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');"""

text = text.replace(dup, clean)
text = text.replace("void _showModuleModal(BuildContext context, String title, Widget content) {(BuildContext context, String title, Widget content) {", "void _showModuleModal(BuildContext context, String title, Widget content) {")

with open("D:/IDS_Pulse_App/lib/main.dart", "w", encoding="utf-8") as f:
    f.write(text)

with open("C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/ids_pulse_app/lib/main.dart", "w", encoding="utf-8") as f:
    f.write(text)

print("Duplicates cleaned!")
