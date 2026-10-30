/**
 * scripts/bundle_admin.js
 * 
 * Menggabungkan 6 sub-modul terpisah dari js/admin/ menjadi berkas tunggal js/admin.js
 * untuk distribusi produksi, Service Worker pre-caching, dan eksekusi browser vanilla.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(ROOT_DIR, 'js', 'admin');
const TARGET_FILE = path.join(ROOT_DIR, 'js', 'admin.js');

const MODULAR_FILES = [
  '01_core.js',
  '02_cms.js',
  '03_santri.js',
  '04_users.js',
  '05_wali.js',
  '06_alumni.js'
];

console.log('🔄 Menggabungkan modul frontend admin dari js/admin/...');

let combinedParts = [];

for (const file of MODULAR_FILES) {
  const filePath = path.join(ADMIN_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Sub-modul admin tidak ditemukan: ${file}`);
    process.exit(1);
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Bersihkan header banner buatan split_admin jika ada agar tidak redundant
  content = content.replace(/^\/\*\*[\s\S]*?\*\/\r?\n\r?\n/, '');
  combinedParts.push(content.trimEnd());
  console.log(`  ➕ Disertakan: js/admin/${file}`);
}

const bundledContent = combinedParts.join('\n\n') + '\n';
fs.writeFileSync(TARGET_FILE, bundledContent, 'utf8');
console.log(`✅ Berhasil menghasilkan ${TARGET_FILE} (${bundledContent.split('\n').length} baris)`);
