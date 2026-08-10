const emojiRegex = require('emoji-regex');
const fs = require('fs');
const content = fs.readFileSync('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/WebDashboard.jsx', 'utf8');
const regex = emojiRegex();
let count = 0;
const newContent = content.split('\n').map(line => {
    if (regex.test(line)) {
        count++;
        let nl = line.replace(regex, '').replace(/ +/g, ' ').replace(/^ +/, m => line.match(/^ */)[0]);
        nl = nl.replace(/\(\" /g, '(\"');
        nl = nl.replace(/\(\' /g, "('");
        nl = nl.replace(/\` /g, "`");
        nl = nl.replace(/> /g, '>');
        return nl;
    }
    return line;
}).join('\n');
fs.writeFileSync('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/WebDashboard.jsx', newContent);
console.log('Replaced emojis in ' + count + ' lines');
