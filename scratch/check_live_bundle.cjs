const fs = require('fs');

(async () => {
  try {
    const res = await fetch('https://proud-lavoisier.vercel.app/');
    const html = await res.text();
    console.log('Live Vercel HTML contains Reset Password:', html.includes('Reset') || html.includes('password') || html.includes('assets'));
    const matches = html.match(/assets\/index-[^"]+\.js/g);
    console.log('Live JS Bundle Asset:', matches ? matches[0] : 'None');
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
