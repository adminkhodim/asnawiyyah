const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('▶️  TESTING: PWA Smart In-App Update System...');

const rootDir = path.resolve(__dirname, '..');

// 1. Verifikasi version.json
const versionJsonPath = path.join(rootDir, 'version.json');
assert(fs.existsSync(versionJsonPath), 'File version.json harus ada di root');
const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
assert(typeof versionData.version === 'string' && versionData.version.length > 0, 'version.json harus memiliki field version');
assert(Array.isArray(versionData.highlights), 'version.json harus memiliki array highlights');
console.log(`   ✅ version.json valid: v${versionData.version}`);

// 2. Verifikasi sw.js
const swPath = path.join(rootDir, 'sw.js');
assert(fs.existsSync(swPath), 'sw.js harus ada');
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('skipWaiting'), 'sw.js harus mendukung skipWaiting');
assert(swContent.includes('asnawiyyah-cache-v87'), 'sw.js cache name harus termutakhirkan');
console.log('   ✅ sw.js mendukung message skipWaiting & cache v87');

// 3. Verifikasi js/pwa.js
const pwaJsPath = path.join(rootDir, 'js', 'pwa.js');
const pwaContent = fs.readFileSync(pwaJsPath, 'utf8');
assert(pwaContent.includes('SmartUpdateManager'), 'js/pwa.js harus mendefinisikan SmartUpdateManager');
assert(pwaContent.includes('isUserActivelyInputting'), 'js/pwa.js harus memiliki Smart Interruption Guard');
assert(pwaContent.includes('applyAppUpdateNow'), 'js/pwa.js harus mengekspos applyAppUpdateNow');
assert(pwaContent.includes('dismissUpdateBannerTemporarily'), 'js/pwa.js harus mengekspos dismissUpdateBannerTemporarily');
assert(pwaContent.includes('checkVersionJson'), 'js/pwa.js harus mendukung version polling');
console.log('   ✅ js/pwa.js mengimplementasikan SmartUpdateManager & Interruption Guard');

// 4. Verifikasi index.html
const indexPath = path.join(rootDir, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert(indexContent.includes('id="pwa-update-banner"'), 'index.html harus memuat elemen #pwa-update-banner');
assert(indexContent.includes('applyAppUpdateNow()'), 'index.html harus memiliki tombol applyAppUpdateNow()');
assert(indexContent.includes('bindServiceWorker'), 'index.html harus menghubungkan SW registration ke SmartUpdateManager');
console.log('   ✅ index.html memuat UI Floating Update Banner & SW binding');

console.log('🎉 PWA Smart In-App Update System TEST PASSED!\n');
