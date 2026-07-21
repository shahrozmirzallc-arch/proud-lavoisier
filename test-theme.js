import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting Theme Persistence Test...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Need to handle vite port (default 5173, but it started on 5175)
  try {
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle2' });
  } catch (error) {
    console.error("Failed to connect to dev server. Is 'npm run dev' running?");
    process.exit(1);
  }

  // 1. Check Initial State (Dark Mode default based on current logic, or royal-blue)
  let initialMode = await page.evaluate(() => localStorage.getItem('ids_pulse_daynight') || 'day');
  console.log(`Initial Mode in localStorage: ${initialMode}`);

  let isLightModeClass = await page.evaluate(() => document.body.classList.contains('mode-light'));
  console.log(`Is .mode-light class present: ${isLightModeClass}`);

  // 2. Click the Theme Toggle
  console.log("Clicking theme toggle button...");
  
  // We identify the toggle button by looking for the switch mode text inside the button
  await page.waitForSelector('button');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const toggleBtn = buttons.find(b => b.textContent.includes('Switch to'));
    if (toggleBtn) {
      toggleBtn.click();
    } else {
      throw new Error("Toggle button not found");
    }
  });
  
  // Wait a moment for transitions
  await new Promise(r => setTimeout(r, 500));
  
  // 3. Verify State Switched
  let newMode = await page.evaluate(() => localStorage.getItem('ids_pulse_daynight'));
  console.log(`New Mode in localStorage: ${newMode}`);
  if (newMode === initialMode) {
    console.error("❌ TEST FAILED: localStorage did not update on toggle.");
    process.exit(1);
  }

  isLightModeClass = await page.evaluate(() => document.body.classList.contains('mode-light'));
  console.log(`Is .mode-light class present: ${isLightModeClass}`);
  
  // 4. Verify Persistence (Reload Page)
  console.log("Reloading page to test persistence...");
  await page.reload({ waitUntil: 'networkidle2' });
  
  let persistedMode = await page.evaluate(() => localStorage.getItem('ids_pulse_daynight'));
  console.log(`Persisted Mode after reload: ${persistedMode}`);
  
  if (persistedMode !== newMode) {
    console.error("❌ TEST FAILED: Mode did not persist across reloads.");
    process.exit(1);
  }
  
  // 5. Verify WCAG Contrast on a prominent element (Optional check of the text color vs background)
  // Check the main background color variable
  const bodyBgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log(`Body Background Color computed as: ${bodyBgColor}`);

  console.log("✅ ALL THEME SWITCHING & PERSISTENCE TESTS PASSED.");
  await browser.close();
  process.exit(0);
})();
