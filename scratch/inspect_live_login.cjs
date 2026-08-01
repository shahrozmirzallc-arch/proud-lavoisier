const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent.trim(),
      className: b.className
    }));
  });

  console.log('Live Login Screen Buttons:', buttons);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      placeholder: i.placeholder,
      name: i.name,
      type: i.type
    }));
  });

  console.log('Live Login Screen Inputs:', inputs);

  await browser.close();
})();
