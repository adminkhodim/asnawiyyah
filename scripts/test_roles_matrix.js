/**
 * Unit Test: RBAC Matrix 21 Modules x 7 Roles
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Menguji Logika Matriks Izin RBAC (23 Modul x 7 Peran)...');

// Mock browser environment for roles.js
const mockStorage = {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = String(v); },
    removeItem: function(k) { delete this._data[k]; }
};

const mockWindow = {
    addEventListener: () => {},
    localStorage: { ...mockStorage, _data: {} },
    sessionStorage: { ...mockStorage, _data: {} },
    ASNAWIYYAH_CONFIG: { supabaseUrl: '', supabaseKey: '' }
};

const mockDocument = {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
};

const rolesCode = fs.readFileSync(path.join(__dirname, '../js/roles.js'), 'utf8');

const context = vm.createContext({
    window: mockWindow,
    document: mockDocument,
    localStorage: mockWindow.localStorage,
    sessionStorage: mockWindow.sessionStorage,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    performance: { now: () => Date.now() },
    navigator: { standalone: false }
});

vm.runInContext(rolesCode, context);

// 1. Verifikasi 23 Modul
const matrix = mockWindow.MODULE_PERMISSIONS_MATRIX;
assert(Array.isArray(matrix), 'MODULE_PERMISSIONS_MATRIX harus berupa array');
console.log(`✅ Jumlah modul terdaftar: ${matrix.length}`);
assert.strictEqual(matrix.length, 23, `Harus ada tepat 23 modul, ditemukan ${matrix.length}`);

// Validasi struktur tiap modul
matrix.forEach((mod, idx) => {
    assert(mod.key, `Modul #${idx} harus punya key`);
    assert(mod.module, `Modul ${mod.key} harus punya nama modul`);
    assert(mod.category, `Modul ${mod.key} harus punya category`);
    assert(mod.permissions, `Modul ${mod.key} harus punya baseline permissions`);
});
console.log('✅ Semua 23 modul memiliki struktur dan baseline izin yang valid');

// Validasi Modul Data Wali Santri (Modul Mandiri RBAC)
const waliMod = matrix.find(m => m.key === 'wali-santri');
assert(waliMod, 'Modul Data Wali Santri (wali-santri) harus terdaftar dalam matriks');
assert.strictEqual(waliMod.permissions.SUPER_ADMIN, 'full');
assert.strictEqual(waliMod.permissions.ADMIN, 'full');
assert.strictEqual(waliMod.permissions.PENGASUH, 'read');
assert.strictEqual(waliMod.permissions.ASATIDZ, 'read');
assert.strictEqual(waliMod.permissions.PENGURUS, 'read');
assert.strictEqual(waliMod.permissions.BENDAHARA, 'read');
assert.strictEqual(waliMod.permissions.WALI_SANTRI, 'none');
console.log('✅ Modul Data Wali Santri (wali-santri) terverifikasi dengan RBAC 7 Peran');

// Validasi Modul Izin & Perpulangan
const perpulanganMod = matrix.find(m => m.key === 'perpulangan');
assert(perpulanganMod, 'Modul perpulangan harus terdaftar dalam matriks');
assert.strictEqual(perpulanganMod.permissions.SUPER_ADMIN, 'full');
assert.strictEqual(perpulanganMod.permissions.ADMIN, 'full');
assert.strictEqual(perpulanganMod.permissions.PENGASUH, 'full');
assert.strictEqual(perpulanganMod.permissions.ASATIDZ, 'read');
assert.strictEqual(perpulanganMod.permissions.PENGURUS, 'full');
assert.strictEqual(perpulanganMod.permissions.BENDAHARA, 'none');
assert.strictEqual(perpulanganMod.permissions.WALI_SANTRI, 'write');
console.log('✅ Modul Izin & Perpulangan terverifikasi dengan RBAC 2-Tier');

// Validasi Modul Kedisiplinan & Tarbiyah Santri (Modul 22)
const kedisiplinanMod = matrix.find(m => m.key === 'kedisiplinan');
assert(kedisiplinanMod, 'Modul kedisiplinan harus terdaftar dalam matriks');
assert.strictEqual(kedisiplinanMod.permissions.SUPER_ADMIN, 'full');
assert.strictEqual(kedisiplinanMod.permissions.ADMIN, 'full');
assert.strictEqual(kedisiplinanMod.permissions.PENGASUH, 'read');
assert.strictEqual(kedisiplinanMod.permissions.ASATIDZ, 'read');
assert.strictEqual(kedisiplinanMod.permissions.PENGURUS, 'full');
assert.strictEqual(kedisiplinanMod.permissions.BENDAHARA, 'none');
assert.strictEqual(kedisiplinanMod.permissions.WALI_SANTRI, 'read_own');
console.log('✅ Modul Kedisiplinan & Tarbiyah Santri terverifikasi dengan RBAC 7 Peran');

// Validasi Modul Izin & Badal Asatidz (Modul 23)
const izinAsatidzMod = matrix.find(m => m.key === 'izin-asatidz');
assert(izinAsatidzMod, 'Modul izin-asatidz harus terdaftar dalam matriks');
assert.strictEqual(izinAsatidzMod.permissions.SUPER_ADMIN, 'full');
assert.strictEqual(izinAsatidzMod.permissions.ADMIN, 'full');
assert.strictEqual(izinAsatidzMod.permissions.PENGASUH, 'full');
assert.strictEqual(izinAsatidzMod.permissions.ASATIDZ, 'write');
assert.strictEqual(izinAsatidzMod.permissions.PENGURUS, 'read');
assert.strictEqual(izinAsatidzMod.permissions.BENDAHARA, 'none');
assert.strictEqual(izinAsatidzMod.permissions.WALI_SANTRI, 'none');
console.log('✅ Modul Izin & Badal Asatidz terverifikasi dengan RBAC 7 Peran');

// 2. Verifikasi 7 Peran
const roles = Object.keys(mockWindow.ROLE_DEFINITIONS);
assert.strictEqual(roles.length, 7, `Harus ada 7 peran, ditemukan: ${roles.join(', ')}`);
console.log(`✅ 7 Peran terverifikasi: ${roles.join(', ')}`);

// 3. Verifikasi Konversi 5 Level Hak Akses
const testLevels = ['full', 'read', 'write', 'read_own', 'none'];
testLevels.forEach(lvl => {
    const perms = mockWindow.convertMatrixLevelToPermissions('santri', lvl);
    assert(Array.isArray(perms), `Konversi ${lvl} harus mengembalikan array`);
    if (lvl === 'full') {
        assert(perms.includes('santri.view') && perms.includes('santri.edit') && perms.includes('santri.delete'));
    } else if (lvl === 'read') {
        assert(perms.includes('santri.view') && !perms.includes('santri.edit'));
    } else if (lvl === 'write') {
        assert(perms.includes('santri.view') && perms.includes('santri.create') && !perms.includes('santri.delete'));
    } else if (lvl === 'read_own') {
        assert(perms.includes('santri.view'));
    } else if (lvl === 'none') {
        assert.strictEqual(perms.length, 0);
    }
});
console.log('✅ Konversi 5 level hak akses (full, read, write, read_own, none) berhasil');

// 4. Verifikasi Proteksi Super Admin
mockWindow.handleMatrixCellChange('santri', 'SUPER_ADMIN', 'none');
const superAdminLvl = mockWindow.getMatrixPermission('santri', 'SUPER_ADMIN');
assert.strictEqual(superAdminLvl, 'full', 'SUPER_ADMIN tidak boleh bisa diubah dari full');
console.log('✅ Super Admin terkunci aman pada level "full"');

// 5. Verifikasi Proteksi Batch Wali Santri
mockWindow.batchSetRoleMatrix('WALI_SANTRI', 'full');
const waliSantriUsers = mockWindow.getMatrixPermission('users', 'WALI_SANTRI');
const waliSantriRoles = mockWindow.getMatrixPermission('roles', 'WALI_SANTRI');
const waliSantriKeuangan = mockWindow.getMatrixPermission('keuangan', 'WALI_SANTRI');
assert.strictEqual(waliSantriUsers, 'none', 'Wali Santri tidak boleh diberi akses users');
assert.strictEqual(waliSantriRoles, 'none', 'Wali Santri tidak boleh diberi akses roles');
assert.strictEqual(waliSantriKeuangan, 'none', 'Wali Santri tidak boleh diberi akses modul keuangan admin');
console.log('✅ Guardrail proteksi batch Wali Santri bekerja dengan sempurna');

// 6. Verifikasi Simpan & Reset
mockWindow.batchResetRoleMatrix('WALI_SANTRI');
assert.strictEqual(Object.keys(mockWindow.MATRIX_PENDING_CHANGES).length, 0, 'Reset harus mengosongkan pending changes');
console.log('✅ Reset matriks berhasil memulihkan state awal');

// 7. Verifikasi Sinkronisasi Dinamis Pusat Kontrol Pengasuh & Admin (isModuleAllowedForRole)
assert(typeof mockWindow.isModuleAllowedForRole === 'function', 'isModuleAllowedForRole harus didefinisikan');
assert.strictEqual(mockWindow.isModuleAllowedForRole('santri', 'PENGASUH'), true, 'Modul Santri harus boleh diakses (Lihat Saja)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('tahfidz', 'PENGASUH'), true, 'Modul Tahfidz harus boleh diakses (Lihat Saja)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('alumni', 'PENGASUH'), true, 'Modul Alumni harus boleh diakses (Lihat Saja)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('alumni', 'ADMIN'), true, 'Modul Alumni harus boleh diakses oleh ADMIN');
assert.strictEqual(mockWindow.isModuleAllowedForRole('ppdb', 'PENGASUH'), false, 'Modul PPDB harus disembunyikan/tutup (none)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('program', 'PENGASUH'), false, 'Modul Program harus disembunyikan/tutup (none)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('unit-kegiatan', 'PENGASUH'), false, 'Modul Unit Kegiatan harus disembunyikan/tutup (none)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('presensi', 'PENGASUH'), false, 'Modul Presensi harus disembunyikan/tutup (none)');

// 7b. Verifikasi Khusus Modul Data Wali Santri
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'SUPER_ADMIN'), true, 'Modul Data Wali Santri harus boleh diakses oleh SUPER_ADMIN');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'ADMIN'), true, 'Modul Data Wali Santri harus boleh diakses oleh ADMIN');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'PENGASUH'), true, 'Modul Data Wali Santri harus boleh diakses oleh PENGASUH (Lihat Saja)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'ASATIDZ'), true, 'Modul Data Wali Santri harus boleh diakses oleh ASATIDZ (Lihat Saja)');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'WALI_SANTRI'), false, 'Modul Data Wali Santri harus ditutup untuk peran WALI_SANTRI');
console.log('✅ Verifikasi hak akses dinamis Modul Data Wali Santri (wali-santri) berhasil!');

// 8. Verifikasi Keberadaan Tombol Alumni di Kedua Grid (Admin & Pengasuh) pada index.html
const indexHtmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const adminGridStart = indexHtmlContent.indexOf('id="admin-control-center-grid"');
const adminGridEnd = indexHtmlContent.indexOf('<!-- Security & Session Info Card -->', adminGridStart);
const adminGridHtml = indexHtmlContent.substring(adminGridStart, adminGridEnd);
assert(adminGridHtml.includes('data-admin-module="alumni"'), 'admin-control-center-grid harus memiliki tombol data-admin-module="alumni"');
assert(adminGridHtml.includes('data-admin-module="wali-santri"'), 'admin-control-center-grid harus memiliki tombol data-admin-module="wali-santri"');
assert(adminGridHtml.includes('data-admin-module="kedisiplinan"'), 'admin-control-center-grid harus memiliki tombol data-admin-module="kedisiplinan"');
assert(adminGridHtml.includes('data-admin-module="izin-asatidz"'), 'admin-control-center-grid harus memiliki tombol data-admin-module="izin-asatidz"');

const pengasuhGridStart = indexHtmlContent.indexOf('id="pengasuh-control-center-grid"');
const pengasuhGridEnd = indexHtmlContent.indexOf('<!-- Security & Session Info Card', pengasuhGridStart);
const pengasuhGridHtml = indexHtmlContent.substring(pengasuhGridStart, pengasuhGridEnd);
assert(pengasuhGridHtml.includes('data-admin-module="alumni"'), 'pengasuh-control-center-grid harus memiliki tombol data-admin-module="alumni"');
assert(pengasuhGridHtml.includes('data-admin-module="wali-santri"'), 'pengasuh-control-center-grid harus memiliki tombol data-admin-module="wali-santri"');
assert(pengasuhGridHtml.includes('data-admin-module="kedisiplinan"'), 'pengasuh-control-center-grid harus memiliki tombol data-admin-module="kedisiplinan"');
assert(pengasuhGridHtml.includes('data-admin-module="izin-asatidz"'), 'pengasuh-control-center-grid harus memiliki tombol data-admin-module="izin-asatidz"');
console.log('✅ Verifikasi tombol modul Alumni, Wali Santri, Kedisiplinan & Izin Asatidz di admin-control-center-grid & pengasuh-control-center-grid berhasil!');

// Uji coba toggle dinamis realtime lewat matriks (PPDB & Wali Santri)
mockWindow.handleMatrixCellChange('ppdb', 'PENGASUH', 'read');
assert.strictEqual(mockWindow.isModuleAllowedForRole('ppdb', 'PENGASUH'), true, 'Saat PPDB dibuka di matriks, menu harus otomatis muncul');

mockWindow.handleMatrixCellChange('ppdb', 'PENGASUH', 'none');
assert.strictEqual(mockWindow.isModuleAllowedForRole('ppdb', 'PENGASUH'), false, 'Saat PPDB ditutup di matriks, menu harus otomatis disembunyikan');

// Uji coba toggle dinamis realtime untuk wali-santri
mockWindow.handleMatrixCellChange('wali-santri', 'ASATIDZ', 'none');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'ASATIDZ'), false, 'Saat wali-santri ditutup untuk Asatidz di matriks, menu harus otomatis disembunyikan');

mockWindow.handleMatrixCellChange('wali-santri', 'ASATIDZ', 'read');
assert.strictEqual(mockWindow.isModuleAllowedForRole('wali-santri', 'ASATIDZ'), true, 'Saat wali-santri dibuka kembali untuk Asatidz di matriks, menu harus otomatis muncul');
mockWindow.batchResetRoleMatrix('ASATIDZ');
console.log('✅ Sinkronisasi visibilitas menu Pusat Kontrol & Matriks RBAC berhasil!');

console.log('🎉 SEMUA PENGUJIAN MATRIKS IZIN RBAC 100% SUKSES!');
process.exit(0);
