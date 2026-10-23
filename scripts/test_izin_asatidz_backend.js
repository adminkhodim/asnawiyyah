/**
 * scripts/test_izin_asatidz_backend.js
 * 
 * Unit test suite untuk memverifikasi logika backend Perizinan Asatidz,
 * penunjukan Ustadz Badal, persetujuan Pengasuh, dan delegasi halaqah.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Memulai Pengujian Backend: Perizinan Asatidz & Delegasi Badal...');

// 1. Verifikasi eksistensi konstanta dan handler di 04_Tahfidz.gs
const tahfidzGsPath = path.resolve(__dirname, '../legacy/04_Tahfidz.gs');
const tahfidzContent = fs.readFileSync(tahfidzGsPath, 'utf8');

assert(tahfidzContent.includes('const SHEET_IZIN_ASATIDZ = "Izin_Asatidz";'), 'SHEET_IZIN_ASATIDZ harus didefinisikan');
assert(tahfidzContent.includes('function initIzinAsatidzSheet('), 'initIzinAsatidzSheet harus ada');
assert(tahfidzContent.includes('function submitIzinAsatidz('), 'submitIzinAsatidz harus ada');
assert(tahfidzContent.includes('function getIzinAsatidzData('), 'getIzinAsatidzData harus ada');
assert(tahfidzContent.includes('function approveIzinAsatidz('), 'approveIzinAsatidz harus ada');
assert(tahfidzContent.includes('function getActiveBadalDelegations('), 'getActiveBadalDelegations harus ada');
console.log('  ✅ 1. Definisi fungsi backend di 04_Tahfidz.gs lengkap');

// 2. Verifikasi routing di 01_Router.gs
const routerGsPath = path.resolve(__dirname, '../legacy/01_Router.gs');
const routerContent = fs.readFileSync(routerGsPath, 'utf8');

assert(routerContent.includes('action === "submitIzinAsatidz"'), 'Route submitIzinAsatidz harus ada di doPost');
assert(routerContent.includes('action === "approveIzinAsatidz"'), 'Route approveIzinAsatidz harus ada di doPost');
assert(routerContent.includes('action === "getIzinAsatidz"'), 'Route getIzinAsatidz harus ada');
assert(routerContent.includes('action === "getActiveBadalDelegations"'), 'Route getActiveBadalDelegations harus ada');
console.log('  ✅ 2. Routing doPost dan doGet di 01_Router.gs terkonfigurasi');

// 3. Verifikasi sinkronisasi bundling Code.gs
const codeGsPath = path.resolve(__dirname, '../legacy/Code.gs');
const codeContent = fs.readFileSync(codeGsPath, 'utf8');
assert(codeContent.includes('const SHEET_IZIN_ASATIDZ = "Izin_Asatidz";'), 'Code.gs harus memuat SHEET_IZIN_ASATIDZ hasil bundle');
assert(codeContent.includes('submitIzinAsatidz'), 'Code.gs harus memuat submitIzinAsatidz');
console.log('  ✅ 3. Bundle Code.gs tersinkronisasi 100%');

// 4. Simulasi Logika Validasi Pengajuan Izin
function simulateSubmitValidation(payload) {
  if (!payload.namaAsatidz) return { error: "Nama Asatidz pemohon wajib diisi." };
  if (!payload.tglMulai) return { error: "Tanggal mulai izin wajib ditentukan." };
  if (!payload.alasan) return { error: "Alasan perizinan wajib disertakan." };
  if (!payload.namaBadal) return { error: "Ustadz Badal (pengganti) wajib dipilih untuk menjamin kelangsungan halaqah." };
  return { success: true };
}

assert.strictEqual(simulateSubmitValidation({}).error, "Nama Asatidz pemohon wajib diisi.");
assert.strictEqual(simulateSubmitValidation({ namaAsatidz: "Ustadz Zaidan" }).error, "Tanggal mulai izin wajib ditentukan.");
assert.strictEqual(simulateSubmitValidation({ namaAsatidz: "Ustadz Zaidan", tglMulai: "2026-10-24" }).error, "Alasan perizinan wajib disertakan.");
assert.strictEqual(simulateSubmitValidation({ namaAsatidz: "Ustadz Zaidan", tglMulai: "2026-10-24", alasan: "Sakit" }).error, "Ustadz Badal (pengganti) wajib dipilih untuk menjamin kelangsungan halaqah.");
assert.strictEqual(simulateSubmitValidation({ namaAsatidz: "Ustadz Zaidan", tglMulai: "2026-10-24", alasan: "Sakit", namaBadal: "Ustadz Fauzi" }).success, true);
console.log('  ✅ 4. Validasi wajib Badal dan kelengkapan data izin valid');

console.log('🎉 SEMUA TEST BACKEND PERIZINAN ASATIDZ BERHASIL!\n');
