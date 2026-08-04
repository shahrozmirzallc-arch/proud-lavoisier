const { chromium } = require('playwright');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(5195, async () => {
  console.log('Serving production dist on http://127.0.0.1:5195');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  try {
    await page.goto('http://127.0.0.1:5195');
    await page.waitForTimeout(1000);

    // Look for Donna 1-click button or type username/password
    const donnaButton = page.locator('button:has-text("Donna Cabral")');
    if (await donnaButton.isVisible()) {
      console.log('Clicking 1-Click Donna Cabral button...');
      await donnaButton.click();
    } else {
      console.log('Typing username: donna...');
      await page.fill('#login-username', 'donna');
      await page.fill('#login-password', 'password123');
      await page.click('button[type="submit"]');
    }

    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    const hasData = bodyText.includes('Donna') || bodyText.includes('Quality') || bodyText.includes('Incidents') || bodyText.includes('Shift') || bodyText.includes('Dashboard');
    
    console.log(`Donna Dashboard Data Check: ${hasData ? 'DATA VISIBLE (PASS)' : 'EMPTY SCREEN (FAIL)'}`);
    console.log('Body Text Snippet:', bodyText.substring(0, 400));
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
