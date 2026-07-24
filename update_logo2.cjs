// update_logo2.cjs
const fs = require('fs');
const path = require('path');

const userUploadedLogo2 = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\\.user_uploaded\\media__1784883449836.png';
const publicLogoPath = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\public\\logo.png';
const publicLogoPath2 = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\public\\logo2.png';
const logoBase64Path = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\src\\components\\LogoBase64.js';

if (fs.existsSync(userUploadedLogo2)) {
  fs.copyFileSync(userUploadedLogo2, publicLogoPath);
  fs.copyFileSync(userUploadedLogo2, publicLogoPath2);

  const imgBuf = fs.readFileSync(userUploadedLogo2);
  const base64Str = `data:image/png;base64,${imgBuf.toString('base64')}`;

  const jsContent = `export const LOGO_BASE64 = "${base64Str}";\n`;
  fs.writeFileSync(logoBase64Path, jsContent, 'utf8');
  console.log("Successfully updated LogoBase64.js with Image 2 logo!");
} else {
  console.error("Logo 2 file not found at:", userUploadedLogo2);
}
