const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/App.jsx',
  'C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/WebDashboard.jsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backgrounds
  content = content.replace(/\bbg-slate-950(?:\/\d+)?\b/g, 'bg-surface');
  content = content.replace(/\bbg-slate-900(?:\/\d+)?\b/g, 'bg-surface-elevated');
  content = content.replace(/\bbg-slate-800(?:\/\d+)?\b/g, 'bg-surface-elevated');
  content = content.replace(/\bbg-slate-850(?:\/\d+)?\b/g, 'bg-surface-elevated');
  content = content.replace(/\bbg-slate-700(?:\/\d+)?\b/g, 'bg-surface-elevated');
  content = content.replace(/bg-\[\#0b111e\]/g, 'bg-bg');
  content = content.replace(/bg-\[\#0f172a\]/g, 'bg-surface');
  
  // Text primary
  content = content.replace(/\btext-white\b/g, 'text-text-primary');
  content = content.replace(/\btext-slate-100\b/g, 'text-text-primary');
  content = content.replace(/\btext-slate-200\b/g, 'text-text-primary');
  content = content.replace(/\btext-slate-300\b/g, 'text-text-primary');
  content = content.replace(/\btext-slate-350\b/g, 'text-text-primary');
  
  // Text secondary
  content = content.replace(/\btext-slate-400\b/g, 'text-text-secondary');
  content = content.replace(/\btext-slate-500\b/g, 'text-text-secondary');
  
  // Borders
  content = content.replace(/\bborder-slate-700(?:\/\d+)?\b/g, 'border-border-subtle');
  content = content.replace(/\bborder-slate-800(?:\/\d+)?\b/g, 'border-border-subtle');
  content = content.replace(/\bborder-slate-850(?:\/\d+)?\b/g, 'border-border-subtle');
  content = content.replace(/\bborder-slate-900(?:\/\d+)?\b/g, 'border-border-subtle');
  
  // Hover states backgrounds
  content = content.replace(/\bhover:bg-slate-950(?:\/\d+)?\b/g, 'hover:bg-surface-elevated');
  content = content.replace(/\bhover:bg-slate-900(?:\/\d+)?\b/g, 'hover:bg-surface');
  content = content.replace(/\bhover:bg-slate-800(?:\/\d+)?\b/g, 'hover:bg-surface');
  content = content.replace(/\bhover:bg-slate-700(?:\/\d+)?\b/g, 'hover:bg-surface');
  
  // Hover states text
  content = content.replace(/\bhover:text-white\b/g, 'hover:text-text-primary');
  
  // Placeholders
  content = content.replace(/\bplaceholder-slate-600\b/g, 'placeholder-text-secondary');
  content = content.replace(/\bplaceholder-slate-500\b/g, 'placeholder-text-secondary');
  content = content.replace(/\bplaceholder-slate-400\b/g, 'placeholder-text-secondary');
  content = content.replace(/\bplaceholder-slate-650\b/g, 'placeholder-text-secondary');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${filePath}`);
}

files.forEach(f => {
  if (fs.existsSync(f)) {
    processFile(f);
  } else {
    console.log(`File not found: ${f}`);
  }
});
