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
assert(/asnawiyyah-cache-v\d+/.test(swContent), 'sw.js cache name harus termutakhirkan');
console.log('   ✅ sw.js mendukung message skipWaiting & dynamic cache version');

// 3. Verifikasi js/pwa.js
const pwaJsPath = path.join(rootDir, 'js', 'pwa.js');
const pwaContent = fs.readFileSync(pwaJsPath, 'utf8');
assert(pwaContent.includes('SmartUpdateManager'), 'js/pwa.js harus mendefinisikan SmartUpdateManager');
assert(pwaContent.includes('isUserActivelyInputting'), 'js/pwa.js harus memiliki Smart Interruption Guard');
assert(pwaContent.includes('applyAppUpdateNow'), 'js/pwa.js harus mengekspos applyAppUpdateNow');
assert(pwaContent.includes('dismissUpdateBannerTemporarily'), 'js/pwa.js harus mengekspos dismissUpdateBannerTemporarily');
assert(pwaContent.includes('checkVersionJson'), 'js/pwa.js harus mendukung version polling');
assert(pwaContent.includes('window.navigator.standalone') || pwaContent.includes('isRunningStandalone'), 'js/pwa.js harus mendukung reload khusus standalone iOS');
console.log('   ✅ js/pwa.js mengimplementasikan SmartUpdateManager & Interruption Guard & iOS standalone reload');

// 4. Verifikasi index.html
const indexPath = path.join(rootDir, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert(indexContent.includes('id="pwa-update-banner"'), 'index.html harus memuat elemen #pwa-update-banner');
assert(indexContent.includes('applyAppUpdateNow()'), 'index.html harus memiliki tombol applyAppUpdateNow()');
assert(indexContent.includes('bindServiceWorker'), 'index.html harus menghubungkan SW registration ke SmartUpdateManager');
assert(indexContent.includes('safe-area-inset-bottom'), 'index.html harus mendukung iOS Safe Area Inset');
assert(indexContent.includes('min-h-[44px]'), 'index.html harus memenuhi standar ukuran touch target iOS/Android');
assert(indexContent.includes('touch-manipulation'), 'index.html harus mengoptimalkan touch event tanpa delay 300ms');
console.log('   ✅ index.html memuat UI Floating Update Banner dengan Safe Area & Touch Target iOS/Android');

console.log('🎉 PWA Smart In-App Update System TEST PASSED!\n');

