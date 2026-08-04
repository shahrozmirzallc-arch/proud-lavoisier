import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 2 IDS Rep Workflow] Executing Step 2: Clarence Kuiken Mobile Shift & Incident Release...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('AUTO-DISMISS DIALOG:', dialog.message());
    await dialog.dismiss();
  });

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Log in as IDS Rep (Clarence Kuiken)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Active Assignment Home
  const imgHome = path.join(ARTIFACTS_DIR, '02a_rep_active_assignment_home.png');
  await page.screenshot({ path: imgHome, fullPage: false });
  console.log(`Saved 02a: ${imgHome}`);

  // 2. Click Add Today's Hours
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes("Add Today's Hours") || b.innerText.includes('Log Shift Hours'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Fill in Hours Form (8.0 regular) using React nativeInputValueSetter
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    const hrsInput = inputs.find(i => i.placeholder && (i.placeholder.includes('0.5') || i.placeholder.includes('Supports')));
    if (hrsInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(hrsInput, '8');
      hrsInput.dispatchEvent(new Event('input', { bubbles: true }));
      hrsInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const notesInput = inputs.find(i => i.tagName === 'TEXTAREA' || (i.placeholder && i.placeholder.includes('reason')));
    if (notesInput) {
      const nativeAreaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeAreaSetter.call(notesInput, 'Urgent emergency containment sorting on Ford Oakville line #2 after hairline crack detection.');
      notesInput.dispatchEvent(new Event('input', { bubbles: true }));
      notesInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const imgHoursModal = path.join(ARTIFACTS_DIR, '02c_rep_log_hours_form_filled.png');
  await page.screenshot({ path: imgHoursModal, fullPage: false });
  console.log(`Saved 02c: ${imgHoursModal}`);

  // Click Submit Hours initial form button using real Puppeteer click
  const submitBtns = await page.$$('button[type="submit"]');
  if (submitBtns.length > 0) {
    await submitBtns[submitBtns.length - 1].click();
  }
  await new Promise(r => setTimeout(r, 1500));

  // Check if split confirm modal popped up and click its Submit button if present
  const nextSubmitBtns = await page.$$('button');
  for (const b of nextSubmitBtns) {
    const txt = await page.evaluate(el => el.innerText, b);
    if (txt && txt.trim() === 'Submit Hours') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));

  const imgHoursDone = path.join(ARTIFACTS_DIR, '02d_rep_hours_submitted_home.png');
  await page.screenshot({ path: imgHoursDone, fullPage: false });
  console.log(`Saved 02d: ${imgHoursDone}`);

  await browser.close();
  console.log('[Step 2 IDS Rep Workflow] Complete!');
}

run().catch(err => {
  console.error('[Step 2 IDS Rep Workflow Error]:', err);
  process.exit(1);
});
