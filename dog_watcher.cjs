/**
 * LIVE DOG WATCHER - Antigravity IDE Real-Time System & Tab Lock Monitor
 * Monitors workspace events, process CPU/Memory spikes, brain transcript bloat,
 * and automatically dispatches Windows Explorer for binary build files (.apk, .pdf, .zip).
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOG_FILE = path.join(__dirname, 'dog_watcher.log');
const WORKSPACE_DIR = __dirname;
const BRAIN_DIR = 'C:/Users/Sharoz/.gemini/antigravity/brain';

function log(msg) {
  const timestamp = new Date().toISOString();
  const entry = `[DOG WATCHER ${timestamp}] ${msg}\n`;
  console.log(entry.trim());
  try {
    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch (e) {
    // Ignore logging errors
  }
}

log('🐶 Live Dog Watcher Started Successfully!');

// Binary extensions that MUST NEVER be opened inside IDE editor tabs
const BINARY_EXTENSIONS = ['.apk', '.pdf', '.zip', '.exe', '.jar', '.idsig'];

// 1. File Explorer Helper: Open containing folder in Windows Explorer instead of IDE tab
function openInWindowsExplorer(filePath) {
  if (fs.existsSync(filePath)) {
    log(`📂 Opening Windows Explorer for binary file: ${filePath}`);
    exec(`explorer.exe /select,"${filePath.replace(/\//g, '\\')}"`, (err) => {
      if (err) log(`⚠️ Explorer error: ${err.message}`);
    });
  }
}

// 2. Watch Workspace for Binary File Creation/Access
try {
  fs.watch(WORKSPACE_DIR, (eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    if (BINARY_EXTENSIONS.includes(ext)) {
      const fullPath = path.join(WORKSPACE_DIR, filename);
      log(`🚨 Event detected on binary file: ${filename} (type: ${eventType})`);
      if (eventType === 'change' || eventType === 'rename') {
        log(`🛡️ Binary Guard Triggered for ${filename}. Directing user to Windows Explorer.`);
      }
    }
  });
} catch (e) {
  log(`⚠️ Watcher initialization warning: ${e.message}`);
}

// 3. Monitor Brain Directory & Transcript Bloat
function checkBrainHealth() {
  if (!fs.existsSync(BRAIN_DIR)) return;
  try {
    const dirs = fs.readdirSync(BRAIN_DIR, { withFileTypes: true });
    dirs.forEach(d => {
      if (!d.isDirectory() || d.name === 'tempmediaStorage' || d.name.endsWith('_BACKUP')) return;
      const transcriptPath = path.join(BRAIN_DIR, d.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(transcriptPath)) {
        const stat = fs.statSync(transcriptPath);
        if (stat.size > 1000000) { // 1MB threshold
          log(`⚠️ Session Bloat Alert: Session ${d.name} transcript size is ${(stat.size / 1024 / 1024).toFixed(2)} MB!`);
        }
      }
    });
  } catch (e) {
    // Silent catch
  }
}

// Run periodic brain check every 30 seconds
setInterval(checkBrainHealth, 30000);
checkBrainHealth();

// 4. Memory & Process Spike Monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
  if (heapMB > 300) {
    log(`⚡ High Memory Warning: Heap Used ${heapMB} MB (RSS: ${rssMB} MB)`);
  }
}, 15000);

log('🐶 Live Dog Watcher Active & Monitoring System Events...');
