import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const htmlPath = path.resolve(__dirname, '../docs/IDS_PULSE_PRODUCT_DESIGNER_SPECIFICATION.html');
  const pdfPath = path.resolve(__dirname, '../docs/IDS_Pulse_Product_Designer_Guide.pdf');

  console.log(`[1/3] Reading HTML source from: ${htmlPath}`);
  console.log(`[2/3] Launching Puppeteer to generate high-res PDF...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log(`[3/3] SUCCESS: PDF generated at: ${pdfPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    await browser.close();
  }
}

main();
