import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:/Users/Sharoz/.gemini/antigravity/brain/4c35684b-2cd3-442f-8986-5b75cde644e6';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function capture375pxProof() {
  console.log('=== CAPTURING 375PX TOGGLE HEIGHT & TEXT WRAP PROOF ===\n');

  // Launch Puppeteer with viewport 375 x 812 (iPhone SE / Standard Mobile 375px width)
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 375, height: 812, isMobile: true, hasTouch: true }
  });

  const page = await browser.newPage();
  console.log('Navigating to Phone Simulator at 375px viewport width...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    localStorage.removeItem('ids_pulse_db');
    localStorage.removeItem('ids_pulse_db_version');
    const clarenceUser = {
      id: 'rep_clarence',
      name: 'Clarence Kuiken',
      role: 'rep',
      username: 'clarence'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(clarenceUser));
    sessionStorage.setItem('ids_pulse_role', 'rep');
    sessionStorage.setItem('ids_pulse_username', 'clarence');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1200);

  // Directly open Incident Form Step 3
  console.log('Opening Incident Alert Form Step 3...');
  await page.evaluate(() => {
    if (window.__setIncStep) window.__setIncStep(3);
  });
  await delay(1000);

  // Scroll to Supplier Follow-up section
  await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll('*'));
    const sectionHeader = textEls.find(el => el.textContent.includes('Supplier Follow-up'));
    if (sectionHeader) sectionHeader.scrollIntoView({ block: 'center' });
  });
  await delay(500);

  // Measure measured button height and check text wrapping
  const buttonMetrics = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.phone-toggle-btn'));
    return btns.map(b => {
      const rect = b.getBoundingClientRect();
      const groupRect = b.parentElement ? b.parentElement.getBoundingClientRect() : null;
      return {
        text: b.textContent.trim(),
        width: rect.width,
        height: rect.height,
        groupHeight: groupRect ? groupRect.height : null,
        computedMinHeight: window.getComputedStyle(b).minHeight,
        fontSize: window.getComputedStyle(b).fontSize,
        isWrapped: b.clientHeight < b.scrollHeight || b.clientWidth < b.scrollWidth
      };
    });
  });

  console.log('MEASURED BUTTON METRICS AT 375PX VIEWPORT:');
  console.log(JSON.stringify(buttonMetrics, null, 2));

  // Take screenshot of 375px viewport showing questions & toggles
  const screenshotPath = path.join(artifactDir, 'phase2_375px_toggle_touch_targets_13px.png');
  await page.screenshot({ path: screenshotPath });
  console.log('\nSAVED PROOF (375px Viewport Toggle Touch Targets):', screenshotPath);

  await browser.close();
  console.log('=== CAPTURE COMPLETE ===');
}

capture375pxProof().catch(console.error);
