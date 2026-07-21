(async () => {
    const urls = [
      'https://proud-lavoisier.vercel.app/?t=' + Date.now()
    ];
    
    for (const url of urls) {
      console.log('Checking URL:', url);
      const html = await fetch(url).then(r => r.text());
      const jsMatch = html.match(/assets\/index-[^"]+\.js/);
      if (jsMatch) {
          const jsUrl = new URL(jsMatch[0], url).href;
          console.log('Fetching JS:', jsUrl);
          const code = await fetch(jsUrl).then(r => r.text());
          console.log('HAS COLLEEN HASH?', code.includes('ccd752abe030dc31bc9ae49e24a4dd23372253615a5ec6a390fe47ba6878abc3'));
      } else {
          console.log('NO JS BUNDLE FOUND', html.substring(0, 100));
      }
      console.log('---');
    }
})();
