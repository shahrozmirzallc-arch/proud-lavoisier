import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { LOGO_BASE64, LOGO_BASE64_DARK_TEXT, LOGO_BASE64_WHITE_TEXT } from '../src/components/LogoBase64.js';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const cropImage = async (dataUrl) => {
    return await page.evaluate((data) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imgData.data;

          let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const alpha = data[(y * img.width + x) * 4 + 3];
              if (alpha > 5) { // non-transparent threshold
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          const cropWidth = maxX - minX + 1;
          const cropHeight = maxY - minY + 1;

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          const croppedCtx = croppedCanvas.getContext('2d');
          croppedCtx.drawImage(
            canvas,
            minX, minY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          resolve({
            croppedDataUrl: croppedCanvas.toDataURL('image/png'),
            origWidth: img.width,
            origHeight: img.height,
            bounds: { minX, minY, maxX, maxY, cropWidth, cropHeight, aspect: (cropWidth / cropHeight).toFixed(2) }
          });
        };
        img.src = data;
      });
    }, dataUrl);
  };

  console.log('Cropping LOGO_BASE64...');
  const res1 = await cropImage(LOGO_BASE64);
  console.log('LOGO_BASE64 bounds:', res1.bounds);

  console.log('Cropping LOGO_BASE64_DARK_TEXT...');
  const res2 = await cropImage(LOGO_BASE64_DARK_TEXT);
  console.log('LOGO_BASE64_DARK_TEXT bounds:', res2.bounds);

  console.log('Cropping LOGO_BASE64_WHITE_TEXT...');
  const res3 = await cropImage(LOGO_BASE64_WHITE_TEXT);
  console.log('LOGO_BASE64_WHITE_TEXT bounds:', res3.bounds);

  await browser.close();

  const newContent = `export const LOGO_BASE64 = "${res1.croppedDataUrl}";
export const LOGO_BASE64_DARK_TEXT = "${res2.croppedDataUrl}";
export const LOGO_BASE64_WHITE_TEXT = "${res3.croppedDataUrl}";
`;

  fs.writeFileSync(path.join(process.cwd(), 'src', 'components', 'LogoBase64.js'), newContent, 'utf8');
  console.log('Updated src/components/LogoBase64.js successfully with cropped PNG base64 data!');
})();
