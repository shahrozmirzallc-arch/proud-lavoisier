const fs = require('fs');

(async () => {
  try {
    const res = await fetch('https://proud-lavoisier.vercel.app/assets/index-DDaMNVn_.js');
    console.log('Live JS bundle status:', res.status);
    const text = await res.text();
    console.log('Live JS bundle snippet:', text.substring(0, 300));
  } catch (e) {
    console.error('Error fetching JS bundle:', e.message);
  }
})();
