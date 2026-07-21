const https = require('https');

https.get('https://proud-lavoisier.vercel.app/?t=' + Date.now(), (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="\/assets\/index-([^"]+)\.js"/);
    if (match) {
      const scriptUrl = `https://proud-lavoisier.vercel.app/assets/index-${match[1]}.js`;
      console.log('Found script URL:', scriptUrl);
      https.get(scriptUrl, (res2) => {
        let scriptData = '';
        res2.on('data', (chunk) => scriptData += chunk);
        res2.on('end', () => {
          if (scriptData.includes('ccd752abe030dc31bc9ae49e24a4dd23372253615a5ec6a390fe47ba6878abc3')) {
            console.log('✅ Hash found in production bundle!');
          } else {
            console.log('❌ Hash NOT found! The production bundle is out of date.');
          }
        });
      });
    } else {
      console.log('Could not find index.js in HTML');
    }
  });
});
