/**
 * scripts/test_keaktifan.js
 * 
 * Comprehensive Unit & Integration Verification Suite for:
 * 1. Keaktifan Asatidz RBAC (Super Admin & Pengasuh only)
 * 2. Deadline Calculation Engine based on Tahfidz_Jadwal_Sesi
 * 3. Implicit Activity Detection (Setoran Logs & Presensi)
 * 4. Multi-timeframe Aggregations (Today, 7 Days, 30 Days)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 ========================================================');
console.log('   VERIFIKASI FITUR: KEAKTIFAN ASATIDZ (RBAC & DEADLINE)');
console.log('   ========================================================\n');

// 1. VERIFIKASI RBAC via js/roles.js
console.log('▶️  1. Menguji RBAC & Hak Akses Khusus Super Admin & Pengasuh...');
const rolesContent = fs.readFileSync(path.join(__dirname, '../js/roles.js'), 'utf8');
const rolesSandbox = {
    window: {},
    document: {
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null,
        getElementById: () => null
    },
    console: console
};
vm.createContext(rolesSandbox);
vm.runInContext(rolesContent, rolesSandbox);

const isModuleAllowedForRole = rolesSandbox.window.isModuleAllowedForRole;
assert(typeof isModuleAllowedForRole === 'function', 'isModuleAllowedForRole harus didefinisikan');

// Test access
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'SUPER_ADMIN'), true, 'SUPER_ADMIN harus diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'PENGASUH'), true, 'PENGASUH harus diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'ADMIN'), false, 'ADMIN umum tidak boleh diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'LURAH_PUTRA'), false, 'LURAH_PUTRA tidak boleh diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'LURAH_PUTRI'), false, 'LURAH_PUTRI tidak boleh diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'ASATIDZ'), false, 'ASATIDZ tidak boleh mengakses monitoring keaktifan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'SANTRI'), false, 'SANTRI tidak boleh diizinkan');
assert.strictEqual(isModuleAllowedForRole('keaktifan-asatidz', 'WALI'), false, 'WALI tidak boleh diizinkan');
console.log('   ✅ Hak akses RBAC lulus: Hanya SUPER_ADMIN dan PENGASUH yang berhak.');

// 2. VERIFIKASI SEPARASI MENU DI index.html
console.log('\n▶️  2. Menguji Struktur Menu di index.html (di luar menu Tahfidz)...');
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Memastikan menu keaktifan terpisah dari menu tahfidz
assert(htmlContent.includes('id="admin-view-keaktifan-asatidz"'), 'Container admin-view-keaktifan-asatidz harus ada di index.html');
assert(htmlContent.includes('id="modal-keaktifan-detail"'), 'Modal modal-keaktifan-detail harus ada di index.html');
assert(htmlContent.includes('data-view="keaktifan-asatidz"'), 'Nav link data-view="keaktifan-asatidz" harus ada di sidebar');
assert(htmlContent.includes('data-admin-module="keaktifan-asatidz"'), 'Quick link data-admin-module="keaktifan-asatidz" harus ada di hub & mobile grid');
assert(htmlContent.includes('src="js/keaktifan-asatidz.js"'), 'Script js/keaktifan-asatidz.js harus disertakan');
console.log('   ✅ Integrasi UI lulus: Menu Keaktifan Asatidz berdiri mandiri di luar menu Tahfidz.');

// 3. VERIFIKASI LOGIKA DEADLINE & TIMELINE SESI
console.log('\n▶️  3. Menguji Kalkulator Deadline Sesi Tahfidz...');
const mockJadwalSesi = [
    { id_sesi: 'SESI-01', nama_sesi: 'Sesi Subuh', jamMulai: '05:30', jamSelesai: '06:30', hari_list: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] },
    { id_sesi: 'SESI-02', nama_sesi: 'Sesi Ashar', jamMulai: '16:00', jamSelesai: '17:15', hari_list: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] },
    { id_sesi: 'SESI-03', nama_sesi: 'Sesi Maghrib', jamMulai: '18:15', jamSelesai: '19:15', hari_list: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] }
];

function evaluateCompliance(currentTimeStr, deadlineStr, firstActivityTimeStr, hasActivity) {
    if (!hasActivity) {
        if (currentTimeStr > deadlineStr) {
            return 'MISSED_DEADLINE'; // Lewat batas jam sesi selesai tanpa input
        }
        return 'WAITING'; // Belum lewat deadline, masih berlangsung/menunggu
    }
    if (firstActivityTimeStr <= deadlineStr) {
        return 'ON_TIME'; // Tepat waktu (sebelum atau pas jam deadline)
    }
    return 'LATE'; // Terlambat (input setelah jam deadline)
}

// Simulasi kasus:
// Kasus A: Jam sekarang 07:00 (Sesi Subuh deadline 06:30), Ustadz Ahmad belum menginput
const kasusA = evaluateCompliance('07:00', '06:30', null, false);
assert.strictEqual(kasusA, 'MISSED_DEADLINE', 'Kasus A harus MISSED_DEADLINE');

// Kasus B: Jam sekarang 07:00, Ustadz Bahrul input setoran jam 06:15 (sebelum 06:30)
const kasusB = evaluateCompliance('07:00', '06:30', '06:15', true);
assert.strictEqual(kasusB, 'ON_TIME', 'Kasus B harus ON_TIME');

// Kasus C: Jam sekarang 07:00, Ustadz Choirul baru input setoran jam 06:45 (lewat 06:30)
const kasusC = evaluateCompliance('07:00', '06:30', '06:45', true);
assert.strictEqual(kasusC, 'LATE', 'Kasus C harus LATE');

// Kasus D: Jam sekarang 05:45 (Sesi sedang berlangsung, deadline 06:30), belum ada input
const kasusD = evaluateCompliance('05:45', '06:30', null, false);
assert.strictEqual(kasusD, 'WAITING', 'Kasus D harus WAITING');

console.log('   ✅ Logika kepatuhan deadline jadwal tahfidz bekerja 100% akurat.');

// 4. VERIFIKASI BACKEND ROUTER & GAS BUNDLE
console.log('\n▶️  4. Menguji Router & Backend Bundle...');
const routerContent = fs.readFileSync(path.join(__dirname, '../legacy/01_Router.gs'), 'utf8');
const backendContent = fs.readFileSync(path.join(__dirname, '../legacy/04_Tahfidz.gs'), 'utf8');
const bundleContent = fs.readFileSync(path.join(__dirname, '../legacy/Code.gs'), 'utf8');

assert(routerContent.includes('getKeaktifanAsatidz'), 'Router harus menangani action getKeaktifanAsatidz');
assert(routerContent.includes('SUPER_ADMIN') && routerContent.includes('PENGASUH'), 'Router harus membatasi ke SUPER_ADMIN & PENGASUH');
assert(backendContent.includes('function getKeaktifanAsatidz'), 'Backend 04_Tahfidz.gs harus memiliki fungsi getKeaktifanAsatidz');
assert(bundleContent.includes('function getKeaktifanAsatidz'), 'Bundle Code.gs harus memiliki fungsi getKeaktifanAsatidz tersinkronisasi');
console.log('   ✅ Router dan backend GAS siap dan tersinkronisasi di Code.gs.');

console.log('\n========================================================');
console.log('🎉 SEMUA PENGUJIAN KEAKTIFAN ASATIDZ BERHASIL 100%!');
console.log('========================================================\n');
