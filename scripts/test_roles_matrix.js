/**
 * Unit Test: RBAC Matrix 19 Modules x 7 Roles
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Menguji Logika Matriks Izin RBAC (19 Modul x 7 Peran)...');

// Mock browser environment for roles.js
const mockWindow = {
    addEventListener: () => {},
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
    },
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
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    performance: { now: () => Date.now() },
    navigator: { standalone: false }
});

vm.runInContext(rolesCode, context);

// 1. Verifikasi 19 Modul
const matrix = mockWindow.MODULE_PERMISSIONS_MATRIX;
assert(Array.isArray(matrix), 'MODULE_PERMISSIONS_MATRIX harus berupa array');
console.log(`✅ Jumlah modul terdaftar: ${matrix.length}`);
assert.strictEqual(matrix.length, 19, `Harus ada tepat 19 modul, ditemukan ${matrix.length}`);

// Validasi struktur tiap modul
matrix.forEach((mod, idx) => {
    assert(mod.key, `Modul #${idx} harus punya key`);
    assert(mod.module, `Modul ${mod.key} harus punya nama modul`);
    assert(mod.category, `Modul ${mod.key} harus punya category`);
    assert(mod.permissions, `Modul ${mod.key} harus punya baseline permissions`);
});
console.log('✅ Semua 19 modul memiliki struktur dan baseline izin yang valid');

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

console.log('🎉 SEMUA PENGUJIAN MATRIKS IZIN RBAC 100% SUKSES!');
process.exit(0);
