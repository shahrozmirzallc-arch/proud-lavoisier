// update_transparent_base64.cjs
const fs = require('fs');
const path = require('path');

const logoDarkPath = path.join(__dirname, 'public', 'logo_transparent_dark.png');
const logoWhitePath = path.join(__dirname, 'public', 'logo_transparent_white.png');
const logoBase64File = path.join(__dirname, 'src', 'components', 'LogoBase64.js');

if (fs.existsSync(logoDarkPath) && fs.existsSync(logoWhitePath)) {
  const darkBuf = fs.readFileSync(logoDarkPath);
  const whiteBuf = fs.readFileSync(logoWhitePath);

  const base64Dark = `data:image/png;base64,${darkBuf.toString('base64')}`;
  const base64White = `data:image/png;base64,${whiteBuf.toString('base64')}`;

  const fileContent = `export const LOGO_BASE64 = "${base64Dark}";\nexport const LOGO_BASE64_DARK_TEXT = "${base64Dark}";\nexport const LOGO_BASE64_WHITE_TEXT = "${base64White}";\n`;
  fs.writeFileSync(logoBase64File, fileContent, 'utf8');

  // Copy logo_transparent_dark.png to public/logo.png
  fs.copyFileSync(logoDarkPath, path.join(__dirname, 'public', 'logo.png'));
  console.log("Successfully updated LogoBase64.js with 100% transparent background logo assets!");
} else {
  console.error("Transparent logo files not found in public/");
}
