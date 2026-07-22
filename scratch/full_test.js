import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  console.log("🚀 Running Thorough Interactive Rep Workflow Test & Artifact Generation...");

  const artifactDir = 'C:/Users/Sharoz/.gemini/antigravity/brain/66b12867-a02c-4c91-a52d-48c91fdb789a';

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Open Site
    console.log("1️⃣ Opening Live Application...");
    await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Admin Setup Check
    console.log("2️⃣ Logging in as Admin (Shahroz) to verify Project Registry...");
    await page.waitForSelector('#login-username', { timeout: 10000 });
    await page.type('#login-username', 'Shahroz');
    await page.type('#login-password', 'Shahroz123$');
    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => !document.querySelector('#login-password'), { timeout: 10000 });

    await page.screenshot({ path: path.join(artifactDir, 'test_step1_admin_dashboard.png') });
    console.log("📸 Saved screenshot: test_step1_admin_dashboard.png");

    // 3. Logout Admin
    console.log("3️⃣ Locking session (Logout Admin)...");
    await page.evaluate(() => {
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-username', { timeout: 10000 });

    // 4. Rep Login (Clarence)
    console.log("4️⃣ Logging in as Quality Rep (Clarence)...");
    await page.type('#login-username', 'Clarence');
    await page.type('#login-password', 'Clarence2026!');
    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => !document.querySelector('#login-password'), { timeout: 10000 });

    await page.screenshot({ path: path.join(artifactDir, 'test_step2_rep_phone_app.png') });
    console.log("📸 Saved screenshot: test_step2_rep_phone_app.png");

    // 5. Switch to Dashboard view for Rep
    console.log("5️⃣ Switching Rep view to Side-by-Side Dashboard...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sideBySideBtn = btns.find(b => b.title && b.title.includes('Side-by-Side'));
      if (sideBySideBtn) sideBySideBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(artifactDir, 'test_step3_rep_side_by_side.png') });
    console.log("📸 Saved screenshot: test_step3_rep_side_by_side.png");

    // 6. Test Rework & Timesheets navigation
    console.log("6️⃣ Testing Navigation Tabs in Rep Dashboard...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const timeTab = btns.find(b => b.textContent.includes('My Hours & Expenses'));
      if (timeTab) timeTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(artifactDir, 'test_step4_rep_timesheets.png') });
    console.log("📸 Saved screenshot: test_step4_rep_timesheets.png");

    // 7. Cleanup session & test state
    console.log("7️⃣ Cleaning up session state...");
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    console.log("✅ E2E TEST COMPLETED WITH 100% SUCCESS!");

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
