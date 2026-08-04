const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, '../src/components/LoginScreen.jsx');
const appPath = path.join(__dirname, '../src/App.jsx');
const envPath = path.join(__dirname, '../.env');

const envContent = fs.readFileSync(envPath, 'utf8');
const loginContent = fs.readFileSync(loginPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

console.log('.env VITE_DEMO_MODE:', envContent.includes('VITE_DEMO_MODE=true'));
console.log('App.jsx passes demoEnabled:', appContent.includes('demoEnabled={demoEnabled}'));
console.log('LoginScreen renders demoEnabled:', loginContent.includes('demoEnabled &&'));
