// scratch/clean_all_emojis.cjs
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (emojiRegex.test(content)) {
    console.log(`Cleaning emojis from: ${path.relative(ROOT_DIR, filePath)}`);
    // Specific replacements for known patterns
    content = content.replace(/🔴 Concerns Found/g, '[CONCERNS FOUND]')
                     .replace(/🟢 No Concerns/g, '[NO CONCERNS]')
                     .replace(/✅ Completed/g, '[COMPLETED]')
                     .replace(/⏳ Pending/g, '[PENDING]')
                     .replace(/⚠️/g, '!')
                     .replace(/❌/g, '[X]')
                     .replace(/✅/g, '[OK]')
                     .replace(/🟢/g, '[OK]')
                     .replace(/🔴/g, '[HOLD]')
                     .replace(/🟡/g, '[ALERT]')
                     .replace(emojiRegex, '');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walkDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.gradle'].includes(item.name)) {
        walkDir(fullPath);
      }
    } else if (['.js', '.jsx', '.ts', '.tsx', '.dart'].some(ext => item.name.endsWith(ext))) {
      cleanFile(fullPath);
    }
  }
}

walkDir(path.join(ROOT_DIR, 'src'));
walkDir(path.join(ROOT_DIR, 'mobile_flutter', 'lib'));
console.log('Emoji cleanup complete.');
