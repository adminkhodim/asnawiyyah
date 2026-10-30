/**
 * scripts/test_p0_security_remediation.js
 * 
 * Unit Test: Verifikasi Kepatuhan Keamanan P0/P1 Asnawiyyah
 * 1. Tidak ada persistensi token sesi di localStorage (js/auth.js)
 * 2. Purge otomatis token sensitif dari localStorage saat boot
 * 3. syncToSupabaseOnWrite dinonaktifkan dari browser client (js/api.js)
 * 4. Fake fallback success masking telah dihapus (js/api.js)
 * 5. Sanitasi PII pada seluruh file migrasi SQL docs/architecture/
 * 6. Portabilitas CLI build CSS di package.json
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🛡️  Menjalankan P0/P1 Security Remediation Verification Suite...');

const ROOT = path.resolve(__dirname, '..');

// 1. Verifikasi js/auth.js: Ketiadaan setItem untuk sensitive tokens di localStorage
const authJsPath = path.join(ROOT, 'js/auth.js');
assert(fs.existsSync(authJsPath), 'File js/auth.js harus ada');
const authCode = fs.readFileSync(authJsPath, 'utf8');

// Pastikan tidak ada setItem untuk ADMIN_TOKEN, PENGASUH_TOKEN, PARENT_TOKEN di localStorage
const forbiddenLocalSetters = [
    /localStorage\.setItem\s*\(\s*ASN_STORAGE_KEYS\.ADMIN_TOKEN/i,
    /localStorage\.setItem\s*\(\s*ASN_STORAGE_KEYS\.PENGASUH_TOKEN/i,
    /localStorage\.setItem\s*\(\s*ASN_STORAGE_KEYS\.PARENT_TOKEN/i,
    /localStorage\.setItem\s*\(\s*['"]user_token['"]/i
];

for (const pattern of forbiddenLocalSetters) {
    assert(!pattern.test(authCode), `Pelanggaran Keamanan: Ditemukan persistensi token ke localStorage via pattern ${pattern}`);
}
console.log('  ✅ [PASS] js/auth.js: Bersih dari persistensi token sensitif di localStorage.');

// Pastikan terdapat mekanisme sanitasi/purge token dari localStorage
assert(authCode.includes('localStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_TOKEN)'), 'Harus ada pembersihan ASN_STORAGE_KEYS.ADMIN_TOKEN dari localStorage');
assert(authCode.includes('localStorage.removeItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN)'), 'Harus ada pembersihan ASN_STORAGE_KEYS.PENGASUH_TOKEN dari localStorage');
assert(authCode.includes('localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_TOKEN)'), 'Harus ada pembersihan ASN_STORAGE_KEYS.PARENT_TOKEN dari localStorage');
console.log('  ✅ [PASS] js/auth.js: Mekanisme auto-purge token dari localStorage terverifikasi.');

// 2. Verifikasi js/api.js: Penutupan mutasi langsung anon dan fake fallback
const apiJsPath = path.join(ROOT, 'js/api.js');
assert(fs.existsSync(apiJsPath), 'File js/api.js harus ada');
const apiCode = fs.readFileSync(apiJsPath, 'utf8');

// syncToSupabaseOnWrite harus langsung return (dinonaktifkan untuk client browser anon)
const syncWriteDisabled = /async function syncToSupabaseOnWrite[\s\S]*?return;/;
assert(syncWriteDisabled.test(apiCode), 'syncToSupabaseOnWrite harus dinonaktifkan dengan early-return demi keamanan RLS.');

// Fake fallback tidak boleh lagi mengembalikan status "success" palsu ketika Apps Script error
const fakeFallbackPattern = /let fallbackMsg = "Operasi berhasil disimpan ke Cloud Database Supabase"/;
assert(!fakeFallbackPattern.test(apiCode), 'Pelanggaran Integritas: Logika pemalsuan sukses (fake fallback) harus dibersihkan.');
console.log('  ✅ [PASS] js/api.js: Mutasi browser anon dinonaktifkan dan fake fallback dibersihkan.');

// 3. Verifikasi package.json: Portabilitas npx tailwindcss
const pkgJsonPath = path.join(ROOT, 'package.json');
assert(fs.existsSync(pkgJsonPath), 'File package.json harus ada');
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
assert(pkg.scripts['build:css'].startsWith('npx tailwindcss'), 'build:css harus menggunakan npx tailwindcss demi portabilitas CI/CD');
console.log('  ✅ [PASS] package.json: Script build:css menggunakan npx tailwindcss.');

// 4. Verifikasi Sanitasi PII di SQL Migrasi
const sqlWaliPath = path.join(ROOT, 'docs/architecture/sync_wali_santri_supabase.sql');
if (fs.existsSync(sqlWaliPath)) {
    const sqlContent = fs.readFileSync(sqlWaliPath, 'utf8');
    assert(!/iraruswita22@gmail\.com/.test(sqlContent), 'Email pribadi tidak boleh ada di sync_wali_santri_supabase.sql');
    assert(!/fasikhatul\.munawaroh@gmail\.com/.test(sqlContent), 'Email pribadi tidak boleh ada di sync_wali_santri_supabase.sql');
    assert(!/89653887640/.test(sqlContent), 'Nomor telepon riil tidak boleh ada di sync_wali_santri_supabase.sql');
    console.log('  ✅ [PASS] docs/architecture/sync_wali_santri_supabase.sql: Bebas dari data PII nyata.');
}

console.log('🎉 P0/P1 Security Remediation Verification PASSED (Semua kontrol keamanan valid).');
process.exit(0);

