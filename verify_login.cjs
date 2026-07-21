const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser window for the user...");
  // Launch non-headless browser so the user can see it!
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const pages = await browser.pages();
  const page = pages[0]; // Use the initially opened tab

  try {
    console.log("Navigating to production Vercel URL...");
    // Use a timestamp to bust Vercel edge caching
    const timestamp = new Date().getTime();
    await page.goto(`https://proud-lavoisier.vercel.app/?t=${timestamp}`, { waitUntil: 'networkidle2' });
    
    // Slight pause for dramatic effect / visual confirm
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Entering username: colleen");
    await page.type('input[type="text"]', 'colleen', { delay: 150 });
    
    console.log("Entering password: Colleen2026!");
    await page.type('input[type="password"]', 'Colleen2026!', { delay: 150 });
    
    await new Promise(r => setTimeout(r, 500));
    
    console.log("Clicking submit...");
    await page.click('button[type="submit"]');
    
    // We intentionally DO NOT close the browser, so the user can interact with the dashboard.
    // The browser will stay open.
    console.log("Login submitted! The browser will stay open for the user.");
  } catch (err) {
    console.error("Puppeteer error:", err);
  }
})();
