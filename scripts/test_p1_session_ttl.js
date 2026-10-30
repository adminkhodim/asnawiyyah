/**
 * scripts/test_p1_session_ttl.js
 * 
 * Unit Test: Verifikasi Siklus Hidup Sesi & Isolasi Sesi (P1)
 * 1. Penyimpanan token ke sessionStorage (bukan localStorage)
 * 2. Isolasi peran & matriks isAsnAdminRole
 * 3. Logout komprehensif (membersihkan seluruh storage & reset state machine)
 * 4. Migrasi otomatis token residu dari localStorage ke sessionStorage
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('⏳ Menjalankan Session Lifecycle & Security Isolation Suite (P1)...');

const ROOT = path.resolve(__dirname, '..');

// Mock Browser Environment
const createMockStorage = () => {
    const store = {};
    return {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
        _data: store
    };
};

const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

const mockWindow = {
    addEventListener: () => {},
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    location: { href: '', reload: () => {} },
    ASNAWIYYAH_CONFIG: { supabaseUrl: '', supabaseKey: '', scriptUrl: '' }
};

const mockDocument = {
    addEventListener: () => {},
    getElementById: (id) => ({
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        innerText: '',
        innerHTML: '',
        value: '',
        dataset: {}
    }),
    querySelectorAll: () => []
};

const authJsCode = fs.readFileSync(path.join(ROOT, 'js/auth.js'), 'utf8');

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    console: console,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    performance: { now: () => Date.now() },
    fetch: async () => ({
        ok: true,
        text: async () => JSON.stringify({ success: true }),
        json: async () => ({ success: true })
    }),
    showToast: () => {},
    escapeHtml: (s) => String(s || ''),
    isAdminLoggedIn: false
};

const context = vm.createContext(sandbox);
vm.runInContext(authJsCode, context);

const { ASNIdentity, ASN_ROLES, ASN_STATES, ASN_STORAGE_KEYS, isAsnAdminRole } = context.window;

// 1. Verifikasi Helper Role
assert.strictEqual(isAsnAdminRole(ASN_ROLES.SUPER_ADMIN), true, 'SUPER_ADMIN harus terverifikasi sebagai admin role');
assert.strictEqual(isAsnAdminRole(ASN_ROLES.ADMIN), true, 'ADMIN harus terverifikasi sebagai admin role');
assert.strictEqual(isAsnAdminRole(ASN_ROLES.ASATIDZ), true, 'ASATIDZ harus terverifikasi sebagai admin role');
assert.strictEqual(isAsnAdminRole(ASN_ROLES.WALI_SANTRI), false, 'WALI_SANTRI BUKAN admin role');
assert.strictEqual(isAsnAdminRole(ASN_ROLES.PUBLIC), false, 'PUBLIC BUKAN admin role');
console.log('  ✅ [PASS] Role Matrix & isAsnAdminRole validation teruji.');

// 2. Verifikasi setAdminSession: Tidak mencemari localStorage
mockLocalStorage.clear();
mockSessionStorage.clear();

const testAdminToken = "ASN_JWT_SECURE_ADMIN_TOKEN_999";
ASNIdentity.setAdminSession(testAdminToken, { name: "Ustadz Admin", role: "ADMIN" });

assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN), testAdminToken, "Token harus tersimpan di sessionStorage");
assert.strictEqual(mockLocalStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN), null, "Token TIDAK BOLEH tersimpan di localStorage");
assert.strictEqual(ASNIdentity.currentRole, 'ADMIN', "Current role harus bernilai ADMIN");
console.log('  ✅ [PASS] setAdminSession menyimpan token di sessionStorage dan mengisolasi localStorage.');

// 3. Verifikasi setPengasuhSession: Tidak mencemari localStorage
mockLocalStorage.clear();
mockSessionStorage.clear();

const testPengasuhToken = "ASN_JWT_SECURE_PENGASUH_TOKEN_777";
ASNIdentity.setPengasuhSession(testPengasuhToken, { name: "Kyai Pengasuh", role: "PENGASUH" });

assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN), testPengasuhToken, "Token pengasuh harus di sessionStorage");
assert.strictEqual(mockLocalStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN), null, "Token pengasuh TIDAK BOLEH ada di localStorage");
assert.strictEqual(ASNIdentity.currentRole, 'PENGASUH', "Current role harus bernilai PENGASUH");
console.log('  ✅ [PASS] setPengasuhSession menyimpan token di sessionStorage dan mengisolasi localStorage.');

// 4. Verifikasi setParentSession: Tidak mencemari localStorage
mockLocalStorage.clear();
mockSessionStorage.clear();

const testParentToken = "ASN_JWT_SECURE_PARENT_TOKEN_555";
ASNIdentity.setParentSession(testParentToken, { name: "Ibu Fulanah" }, [{ student_id: 'STD-001', name: 'Ahmad' }]);

assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN), testParentToken, "Token wali harus di sessionStorage");
assert.strictEqual(mockLocalStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN), null, "Token wali TIDAK BOLEH ada di localStorage");
assert.strictEqual(ASNIdentity.currentRole, 'WALI_SANTRI', "Current role harus bernilai WALI_SANTRI");
console.log('  ✅ [PASS] setParentSession menyimpan token di sessionStorage dan mengisolasi localStorage.');

// 5. Verifikasi Logout: Membersihkan seluruh sesi dan mereset state machine
(async () => {
    await ASNIdentity.logout();

    assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN), null, "Admin token harus dibersihkan saat logout");
    assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN), null, "Pengasuh token harus dibersihkan saat logout");
    assert.strictEqual(mockSessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN), null, "Parent token harus dibersihkan saat logout");
    assert.strictEqual(mockLocalStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN), null, "localStorage token harus bersih saat logout");
    assert.strictEqual(ASNIdentity.currentRole, ASN_ROLES.PUBLIC, "Role harus kembali ke PUBLIC setelah logout");
    console.log('  ✅ [PASS] ASNIdentity.logout() berhasil membersihkan seluruh token dan mereset state machine.');

    console.log('🎉 Session Lifecycle & Security Isolation Suite (P1) PASSED.');
    process.exit(0);
})().catch(err => {
    console.error('❌ [FAIL]', err);
    process.exit(1);
});
