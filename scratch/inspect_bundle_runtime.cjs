const fs = require('fs');

(async () => {
  const res = await fetch('https://proud-lavoisier.vercel.app/assets/index-DDaMNVn_.js');
  const code = await res.text();

  // Search for any unhandled reference or global error triggers
  console.log('Bundle code size:', code.length);
  console.log('Contains VITE_DEMO_MODE in bundle:', code.includes('VITE_DEMO_MODE'));
  
  // Check if main entry point is executed
  const entryMatches = code.match(/createRoot\([^)]+\)/g);
  console.log('createRoot calls found:', entryMatches);
})();
