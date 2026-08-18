import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const htmlPath = path.resolve(__dirname, '../docs/IDS_PULSE_MASTER_SYSTEM_BLUEPRINT.html');
  const pdfPath = path.resolve(__dirname, '../docs/IDS_Pulse_Master_System_Blueprint.pdf');

  console.log(`[1/3] Reading HTML source from: ${htmlPath}`);
  console.log(`[2/3] Launching Puppeteer to generate high-res System Blueprint PDF...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    console.log(`[3/3] SUCCESS: Blueprint PDF generated at: ${pdfPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    await browser.close();
  }
}

main();
