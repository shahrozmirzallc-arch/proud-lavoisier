// update_new_logo.cjs
const fs = require('fs');
const path = require('path');

const userUploadedPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\\.user_uploaded\\media__1784871424146.png';
const publicLogoPath = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\public\\logo.png';
const publicLogoPath2 = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\public\\new_integrity_logo.png';
const logoBase64Path = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\src\\components\\LogoBase64.js';

if (fs.existsSync(userUploadedPath)) {
  fs.copyFileSync(userUploadedPath, publicLogoPath);
  fs.copyFileSync(userUploadedPath, publicLogoPath2);
  console.log("Copied user uploaded image to public/logo.png");

  // Read base64
  const imageBuffer = fs.readFileSync(userUploadedPath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  
  const fileContent = `export const LOGO_BASE64 = "${base64Image}";\n`;
  fs.writeFileSync(logoBase64Path, fileContent, 'utf8');
  console.log("Updated LogoBase64.js with new base64 string!");
} else {
  console.error("User uploaded logo file not found at:", userUploadedPath);
}
