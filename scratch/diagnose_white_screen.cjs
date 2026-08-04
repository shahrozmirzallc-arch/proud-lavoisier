const fs = require('fs');

(async () => {
  try {
    console.log('Fetching index.html from live Vercel...');
    const htmlRes = await fetch('https://proud-lavoisier.vercel.app/?t=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const html = await htmlRes.text();
    console.log('HTML length:', html.length);
    
    // Extract main JS file
    const jsMatches = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!jsMatches) {
      console.log('No index JS file found in HTML!');
      console.log('HTML content:', html);
      return;
    }
    const jsUrl = 'https://proud-lavoisier.vercel.app' + jsMatches[1];
    console.log('Fetching main JS bundle from:', jsUrl);
    const jsRes = await fetch(jsUrl, { headers: { 'Cache-Control': 'no-cache' } });
    console.log('JS HTTP Status:', jsRes.status);
    const jsText = await jsRes.text();
    console.log('JS bundle length:', jsText.length);
    
    // Check if JS contains React root mount or error
    console.log('JS contains createRoot/render:', jsText.includes('createRoot') || jsText.includes('render'));
  } catch (err) {
    console.error('Diagnostic error:', err.message);
  }
})();
