const { chromium } = require('playwright');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(path.join(__dirname, '../dist')));
const server = app.listen(5199, async () => {
  console.log('Serving production dist on http://127.0.0.1:5199');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  try {
    await page.goto('http://127.0.0.1:5199');
    await page.waitForTimeout(1000);

    const artifactPath = path.join(__dirname, '../../antigravity/brain/89428d1a-6335-42dd-8036-39f9c953213b/01_login_view.png');
    await page.screenshot({ path: artifactPath, fullPage: false });
    console.log('Captured login view screenshot to:', artifactPath);
  } catch (err) {
    console.error('Screenshot error:', err.message);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
