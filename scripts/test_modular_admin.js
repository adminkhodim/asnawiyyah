/**
 * scripts/test_modular_admin.js
 * 
 * Unit Test: Modular Frontend Architecture Verification (js/admin/)
 * Memverifikasi:
 * 1. Keberadaan seluruh 6 sub-modul domain di js/admin/
 * 2. Integritas fungsional dan ekspor pada masing-masing domain
 * 3. Kelancaran proses bundling js/admin.js dari sub-modul
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧩 Menjalankan Modular Frontend Admin Verification Suite...');

const ROOT_DIR = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(ROOT_DIR, 'js', 'admin');
const BUNDLED_PATH = path.join(ROOT_DIR, 'js', 'admin.js');

const EXPECTED_MODULES = [
  { file: '01_core.js', keyMarkers: ['openAdminLoginModal', 'showAdminView', 'playApprovalNotificationSound', 'handleAdminQuickSearch'] },
  { file: '02_cms.js', keyMarkers: ['loadAdminPPDBData', 'loadAdminProfilLembaga', 'renderAdminNewsList', 'toggleAdminNewsForm', 'renderAdminGaleriList'] },
  { file: '03_santri.js', keyMarkers: ['loadAdminStudentsData', 'DEFAULT_PESANTREN_PROGRAMS', 'DEFAULT_KELAS_SEKOLAH', 'openBulkEditClassSchoolModal'] },
  { file: '04_users.js', keyMarkers: ['loadAdminUsersData', 'openOnlineUsersModal', 'handleAdminUserSubmit'] },
  { file: '05_wali.js', keyMarkers: ['loadAdminWaliSantriData', 'adminUnlinkedStudentsList', 'sendWaliFollowupWhatsApp'] },
  { file: '06_alumni.js', keyMarkers: ['loadAdminAlumniData', 'renderAdminAlumniTable', 'exportAdminAlumniCSV'] }
];

// 1. Verifikasi keberadaan dan konten modul per domain
for (const mod of EXPECTED_MODULES) {
  const filePath = path.join(ADMIN_DIR, mod.file);
  assert(fs.existsSync(filePath), `Sub-modul js/admin/${mod.file} harus tersedia.`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.length > 500, `Konten js/admin/${mod.file} tidak boleh kosong.`);

  for (const marker of mod.keyMarkers) {
    assert(content.includes(marker), `Marker '${marker}' harus ditemukan di js/admin/${mod.file}`);
  }
  console.log(`  ✅ [PASS] js/admin/${mod.file} (${content.split('\n').length} baris) terverifikasi.`);
}

// 2. Verifikasi berkas bundle js/admin.js
assert(fs.existsSync(BUNDLED_PATH), 'Berkas js/admin.js harus tersedia.');
const bundled = fs.readFileSync(BUNDLED_PATH, 'utf8');
assert(bundled.split('\n').length > 10000, 'Berkas bundle js/admin.js harus berisi > 10.000 baris.');

for (const mod of EXPECTED_MODULES) {
  for (const marker of mod.keyMarkers) {
    assert(bundled.includes(marker), `Marker '${marker}' dari ${mod.file} harus ada di js/admin.js`);
  }
}
console.log('  ✅ [PASS] Bundled js/admin.js mencakup seluruh fungsionalitas dari ke-6 sub-modul.');

console.log('🎉 Modular Frontend Admin Architecture Suite PASSED.');
process.exit(0);
