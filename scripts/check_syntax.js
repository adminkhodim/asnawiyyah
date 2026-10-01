/**
 * scripts/check_syntax.js
 * 
 * Otomatisasi pengujian sintaks untuk seluruh file JavaScript (Frontend, API, Service Worker)
 * dan file Google Apps Script (legacy/*.gs).
 * Digunakan pada pipeline CI/CD GitHub Actions dan local pre-commit.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
let hasError = false;

function testFileSyntax(filePath, isModule = false) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    new vm.Script(code, { filename: relativePath });
    console.log(`  ✅ [PASS] ${relativePath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${relativePath}: ${err.message}`);
    hasError = true;
    return false;
  }
}

function scanDirectory(dirPath, extensions = ['.js', '.gs']) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.vercel') {
        files = files.concat(scanDirectory(fullPath, extensions));
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

console.log('🔍 ========================================================');
console.log('   PEMERIKSAAN SINTAKS CODEBASE (ASNAWIYYAH CI/CD)');
console.log('   ========================================================\n');

// 1. Root and Standalone scripts
console.log('📂 1. Scanning Root & Config Scripts...');
const rootFiles = ['sw.js', 'data-maulid-dibai.js', 'data-qasidah-burdah.js', 'data-tahlil-yasin.js', 'tailwind.config.js'];
rootFiles.forEach(file => {
  const p = path.join(ROOT_DIR, file);
  if (fs.existsSync(p)) testFileSyntax(p);
});

// 2. Frontend JS
console.log('\n📂 2. Scanning Frontend JS (js/)...');
const jsFiles = scanDirectory(path.join(ROOT_DIR, 'js'), ['.js']);
jsFiles.forEach(f => testFileSyntax(f));

// 3. API Handlers
console.log('\n📂 3. Scanning API Handlers (api/)...');
const apiFiles = scanDirectory(path.join(ROOT_DIR, 'api'), ['.js']);
apiFiles.forEach(f => testFileSyntax(f));

// 4. Scripts Directory
console.log('\n📂 4. Scanning Automation Scripts (scripts/)...');
const scriptFiles = scanDirectory(path.join(ROOT_DIR, 'scripts'), ['.js']);
scriptFiles.forEach(f => testFileSyntax(f));

// 5. Backend Google Apps Script (legacy/*.gs)
console.log('\n📂 5. Scanning Modular Apps Script Backend (legacy/*.gs)...');
const gsFiles = scanDirectory(path.join(ROOT_DIR, 'legacy'), ['.gs']);
gsFiles.forEach(f => testFileSyntax(f));

console.log('\n--------------------------------------------------------');
if (hasError) {
  console.error('❌ PEMERIKSAAN SINTAKS GAGAL: Ditemukan kesalahan sintaks pada kode.');
  process.exit(1);
} else {
  console.log('🎉 SEMUA FILE SINTAKS VALID DAN SIAP DIPRODUKSI!');
  process.exit(0);
}
