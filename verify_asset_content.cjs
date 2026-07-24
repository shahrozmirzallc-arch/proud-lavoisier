const https = require('https');

https.get('https://proud-lavoisier.vercel.app/assets/index-Cj2ijwoq.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Total Script Length:', data.length);
    console.log('Includes logo_transparent_dark:', data.includes('logo_transparent_dark') || data.includes('LOGO_BASE64'));
    console.log('Includes ids_pulse_offline_queue:', data.includes('ids_pulse_offline_queue'));
    console.log('Includes v1.0.5:', data.includes('v1.0.5') || data.includes('853120236'));
    console.log('Includes Donna shortcut:', data.includes('Donna') || data.includes('greg'));
  });
});
