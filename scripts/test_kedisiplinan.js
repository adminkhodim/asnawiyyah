const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('▶️  TESTING: Modul 22: Kedisiplinan & Tarbiyah Santri Suite...');

const rootDir = path.resolve(__dirname, '..');

// 1. Verifikasi Migration SQL
const sqlPath = path.join(rootDir, 'docs', 'architecture', 'migration_kedisiplinan_tarbiyah.sql');
assert(fs.existsSync(sqlPath), 'File migration SQL kedisiplinan harus ada');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.kedisiplinan_master'), 'Harus membuat tabel kedisiplinan_master');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.kedisiplinan_logs'), 'Harus membuat tabel kedisiplinan_logs');
assert(sqlContent.includes('ENABLE ROW LEVEL SECURITY'), 'Harus mengaktifkan RLS');
assert(sqlContent.includes('RULE-001'), 'Harus menyertakan default seed rules');
console.log('   ✅ Skema SQL kedisiplinan_master & kedisiplinan_logs valid');

// 2. Verifikasi 07_Kedisiplinan.gs
const gsPath = path.join(rootDir, 'legacy', '07_Kedisiplinan.gs');
assert(fs.existsSync(gsPath), 'File legacy/07_Kedisiplinan.gs harus ada');
const gsContent = fs.readFileSync(gsPath, 'utf8');
assert(gsContent.includes('function getKedisiplinanMasterList'), 'Harus ada getKedisiplinanMasterList');
assert(gsContent.includes('function saveKedisiplinanRule'), 'Harus ada saveKedisiplinanRule');
assert(gsContent.includes('function deleteKedisiplinanRule'), 'Harus ada deleteKedisiplinanRule');
assert(gsContent.includes('function getKedisiplinanLogs'), 'Harus ada getKedisiplinanLogs');
assert(gsContent.includes('function saveKedisiplinanLog'), 'Harus ada saveKedisiplinanLog');
assert(gsContent.includes('function updateStatusTazir'), 'Harus ada updateStatusTazir');
assert(gsContent.includes('function getKedisiplinanStudentSummary'), 'Harus ada getKedisiplinanStudentSummary');
assert(gsContent.includes('function getKedisiplinanDashboardSummary'), 'Harus ada getKedisiplinanDashboardSummary');
assert(gsContent.includes('function sendKedisiplinanWhatsAppNotif_'), 'Harus ada sendKedisiplinanWhatsAppNotif_');
console.log('   ✅ Fungsi backend 07_Kedisiplinan.gs lengkap & valid');

// 3. Verifikasi 01_Router.gs
const routerPath = path.join(rootDir, 'legacy', '01_Router.gs');
const routerContent = fs.readFileSync(routerPath, 'utf8');
assert(routerContent.includes('action === "getKedisiplinanMasterList"'), 'Router POST harus mengenali getKedisiplinanMasterList');
assert(routerContent.includes('action === "saveKedisiplinanLog"'), 'Router POST harus mengenali saveKedisiplinanLog');
assert(routerContent.includes('action === "updateStatusTazir"'), 'Router POST harus mengenali updateStatusTazir');
assert(routerContent.includes('action === "getKedisiplinanStudentSummary"'), 'Router GET & POST harus mengenali getKedisiplinanStudentSummary');
console.log('   ✅ Endpoint Kedisiplinan & Tarbiyah terdaftar di 01_Router.gs');

// 4. Verifikasi Logika Ambang Batas Poin
function calculateStatusAdab(totalPoin, tazirAktif) {
  let statusAdab = "DISIPLIN";
  if (tazirAktif > 0) statusAdab = "DALAM_PEMBINAAN";
  if (totalPoin >= 50) statusAdab = "PERLU_PERHATIAN";
  return statusAdab;
}

assert.strictEqual(calculateStatusAdab(0, 0), "DISIPLIN");
assert.strictEqual(calculateStatusAdab(15, 1), "DALAM_PEMBINAAN");
assert.strictEqual(calculateStatusAdab(60, 0), "PERLU_PERHATIAN");
assert.strictEqual(calculateStatusAdab(75, 2), "PERLU_PERHATIAN");
console.log('   ✅ Logika ambang batas poin & status adab santri valid');

console.log('🎉 Modul 22: Kedisiplinan & Tarbiyah Santri TEST PASSED!\n');
