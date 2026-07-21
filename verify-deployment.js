import puppeteer from 'puppeteer';

(async () => {
  console.log("Checking live deployment at https://proud-lavoisier.vercel.app/?v=" + Date.now());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.setCacheEnabled(false);
    await page.goto('https://proud-lavoisier.vercel.app/?v=' + Date.now(), { waitUntil: 'networkidle2' });
    
    const pageTitle = await page.title();
    console.log(`Page Title: ${pageTitle}`);

    // Check for any text inside a button
    const buttonTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0);
    });
    
    console.log(`Button texts on page: ${JSON.stringify(buttonTexts)}`);

  } catch (error) {
    console.error("Error accessing the page:", error.message);
  } finally {
    await browser.close();
  }
})();
