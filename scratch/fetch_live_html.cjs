const fs = require('fs');

(async () => {
  const res = await fetch('https://proud-lavoisier.vercel.app/?cacheBust=' + Date.now());
  const html = await res.text();
  console.log('Full HTML from Vercel:');
  console.log(html);
})();
