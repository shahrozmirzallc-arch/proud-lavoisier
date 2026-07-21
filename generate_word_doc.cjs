const fs = require('fs');
const { marked } = require('marked');
const htmlDocx = require('html-docx-js');

const mdPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\66b12867-a02c-4c91-a52d-48c91fdb789a\\IDS_Pulse_User_Roles_Permissions.md';
const docxPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\66b12867-a02c-4c91-a52d-48c91fdb789a\\IDS_Pulse_User_Roles_Permissions.docx';

const markdownString = fs.readFileSync(mdPath, 'utf8');
const htmlString = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; }
  h1 { color: #1E3A5F; border-bottom: 2px solid #22D3EE; }
  h2 { color: #0EA5E9; margin-top: 20px; }
  strong { color: #333; }
  li { margin-bottom: 5px; }
</style>
</head>
<body>
${marked.parse(markdownString)}
</body>
</html>
`;

(async () => {
  const converted = htmlDocx.asBlob(htmlString);
  const arrayBuffer = await converted.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(docxPath, buffer);
  console.log('Successfully created Word document at:', docxPath);
})();
