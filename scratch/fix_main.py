with open("D:/IDS_Pulse_App/lib/main.dart.bak", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_home = False

for line in lines:
    if "class IDSPulseHomeScreen extends StatefulWidget {" in line:
        in_home = True
        new_lines.append("class IDSPulseHomeScreen extends StatefulWidget {\n")
        new_lines.append("  const IDSPulseHomeScreen({super.key});\n\n")
        new_lines.append("  @override\n")
        new_lines.append("  State<IDSPulseHomeScreen> createState() => _IDSPulseHomeScreenState();\n")
        new_lines.append("}\n\n")
        new_lines.append("class _IDSPulseHomeScreenState extends State<IDSPulseHomeScreen> {\n")
        new_lines.append("  final _partNumberController = TextEditingController(text: 'PN 86394644');\n")
        new_lines.append("  final _rmaController = TextEditingController(text: 'CK062026');\n")
        new_lines.append("  final _vinController = TextEditingController(text: '1FTVW1EL5PW089201');\n\n")
        continue

    if in_home and "const IDSPulseHomeScreen({super.key});" in line:
        continue

    new_lines.append(line)

content = "".join(new_lines)
with open("D:/IDS_Pulse_App/lib/main.dart", "w", encoding="utf-8") as f:
    f.write(content)

with open("C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/ids_pulse_app/lib/main.dart", "w", encoding="utf-8") as f:
    f.write(content)

print("FIXED MAIN DART CLEANLY!")
