const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      if (!name.includes('node_modules') && !name.includes('.git')) {
        getFiles(name, filesList);
      }
    } else {
      filesList.push(name);
    }
  }
  return filesList;
}

const allFiles = getFiles('C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src');
const fileSet = new Set(allFiles.map(f => f.toLowerCase().replace(/\\/g, '/')));
const actualFilesMap = new Map();
allFiles.forEach(f => {
  actualFilesMap.set(f.toLowerCase().replace(/\\/g, '/'), f.replace(/\\/g, '/'));
});

let errorsFound = 0;

allFiles.forEach(file => {
  if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;
  const content = fs.readFileSync(file, 'utf8');
  
  // Match import statements
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Ignore node_modules imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
    
    const dir = path.dirname(file);
    let resolvedPath = path.resolve(dir, importPath).replace(/\\/g, '/');
    
    // We need to try adding .js, .jsx, etc.
    const extensions = ['', '.js', '.jsx', '.css', '/index.js', '/index.jsx'];
    let found = false;
    let actualCasing = null;
    
    for (const ext of extensions) {
      const p = (resolvedPath + ext).toLowerCase();
      if (fileSet.has(p)) {
        found = true;
        actualCasing = actualFilesMap.get(p);
        
        // Check if the original resolvedPath string casing matches the actualCasing
        const resolvedBase = path.basename(resolvedPath + ext);
        const actualBase = path.basename(actualCasing);
        
        if (resolvedBase !== actualBase && resolvedBase.toLowerCase() === actualBase.toLowerCase()) {
           console.error(`CASE SENSITIVITY ERROR in ${file}:`);
           console.error(`Imported: '${importPath}' -> Resolves to '${resolvedBase}'`);
           console.error(`Actual file on disk: '${actualBase}'`);
           errorsFound++;
        }
        break;
      }
    }
  }
});

if (errorsFound === 0) {
  console.log("No case sensitivity issues found.");
} else {
  console.log(`Found ${errorsFound} case sensitivity issues.`);
}
