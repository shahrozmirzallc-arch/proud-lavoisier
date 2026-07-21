const https = require('https');
https.get('https://proud-lavoisier.vercel.app/?v=' + Date.now(), (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data.includes('index-CvzwdRoZ.js') ? 'YES: Latest build is live!' : 'NO: Old build is still live.');
    console.log("Found js:", data.match(/index-[a-zA-Z0-9_-]+\.js/)[0]);
  });
}).on('error', (err) => {
  console.error(err.message);
});
