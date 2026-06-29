import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'logo.png');
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  const base64Data = logoBuffer.toString('base64');
  const base64Url = `data:image/png;base64,${base64Data}`;
  
  const outputPath = path.join(__dirname, 'src', 'components', 'LogoBase64.js');
  fs.writeFileSync(outputPath, `export const LOGO_BASE64 = "${base64Url}";\n`);
  console.log('Logo successfully converted to base64 and saved to src/components/LogoBase64.js');
} else {
  console.error('logo.png not found in public folder!');
}
