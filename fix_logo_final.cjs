// fix_logo_final.cjs
const fs = require('fs');
const path = require('path');

const logoJpgPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\\.user_uploaded\\media__1784886504263.jpg';
const publicLogoPath = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\public\\logo.png';
const logoBase64Path = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\src\\components\\LogoBase64.js';

if (fs.existsSync(logoJpgPath)) {
  fs.copyFileSync(logoJpgPath, publicLogoPath);

  const imgBuf = fs.readFileSync(logoJpgPath);
  const base64Str = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;

  const jsContent = `export const LOGO_BASE64 = "${base64Str}";\n`;
  fs.writeFileSync(logoBase64Path, jsContent, 'utf8');
  console.log("Successfully converted actual Logo 2 (media__1784886504263.jpg) to LogoBase64.js!");
} else {
  console.error("Logo file not found:", logoJpgPath);
}
