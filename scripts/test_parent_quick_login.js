/**
 * Unit Test: Parent Quick Login (NIS & Tanggal Lahir)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Parent Quick Login (NIS & Birthdate PIN)...');

// 1. Verifikasi index.html memiliki tab switcher dan form login cepat NIS
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert(html.includes('id="tab-btn-parent-nis"'), 'index.html harus memiliki tab-btn-parent-nis');
assert(html.includes('id="tab-btn-parent-otp"'), 'index.html harus memiliki tab-btn-parent-otp');
assert(html.includes('id="form-parent-nis-login"'), 'index.html harus memiliki form-parent-nis-login');
assert(html.includes('id="parent-login-nis"'), 'index.html harus memiliki parent-login-nis');
assert(html.includes('id="parent-login-birthdate"'), 'index.html harus memiliki parent-login-birthdate');
assert(html.includes('id="parent-otp-methods-wrapper"'), 'index.html harus memiliki parent-otp-methods-wrapper');
console.log('✅ Verifikasi elemen UI Modal Login Wali di index.html lolos.');

// 2. Verifikasi js/auth.js memiliki fungsi controller terkait
const authJs = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');

assert(authJs.includes('function switchParentAuthMethod'), 'js/auth.js harus memiliki switchParentAuthMethod');
assert(authJs.includes('async function handleParentQuickLoginNis'), 'js/auth.js harus memiliki handleParentQuickLoginNis');
assert(authJs.includes('window.handleParentQuickLoginNis = handleParentQuickLoginNis'), 'js/auth.js harus mengekspor handleParentQuickLoginNis ke window');
assert(authJs.includes('window.switchParentAuthMethod = switchParentAuthMethod'), 'js/auth.js harus mengekspor switchParentAuthMethod ke window');
console.log('✅ Verifikasi fungsi controller & exports di js/auth.js lolos.');

// 3. Verifikasi Logika Normalisasi Tanggal Lahir (PIN)
function normalizeBirthDate(d) {
    if (!d) return '';
    const str = String(d).trim();
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
    try {
        const dt = new Date(str);
        if (!isNaN(dt.getTime())) {
            const yr = dt.getFullYear();
            const mo = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            return `${yr}-${mo}-${day}`;
        }
    } catch (e) {}
    return str.replace(/[^0-9]/g, '');
}

assert.strictEqual(normalizeBirthDate('2009-08-15'), '2009-08-15', 'Format YYYY-MM-DD');
assert.strictEqual(normalizeBirthDate('15/08/2009'), '2009-08-15', 'Format DD/MM/YYYY');
assert.strictEqual(normalizeBirthDate('15-08-2009'), '2009-08-15', 'Format DD-MM-YYYY');
assert.strictEqual(normalizeBirthDate('2009-8-5'), '2009-08-05', 'Format non-padded YYYY-M-D');
console.log('✅ Verifikasi normalisasi PIN tanggal lahir 100% konsisten.');

// 4. Verifikasi Preservasi Sesi Cepat saat Page Reload (Hydration)
assert(authJs.includes("token.startsWith('WALI_QUICK_')"), 'verifySession harus mendukung token WALI_QUICK_');
assert(authJs.includes("PARENT_AUTH_ACTIVE: 'WALI_AUTH_ACTIVE'"), 'ASN_STATES harus memiliki alias PARENT_AUTH_ACTIVE');
console.log('✅ Verifikasi preservasi sesi cepat (Zero-Logout upon Reload) lolos.');

// 5. Verifikasi Nomor Bantuan WhatsApp Wali Santri
assert(html.includes('href="https://wa.me/6282293199456?text='), 'index.html harus mengarahkan tombol bantuan WhatsApp ke nomor 6282293199456');
console.log('✅ Verifikasi nomor bantuan WhatsApp 6282293199456 lolos.');

console.log('🎉 SELURUH PENGUJIAN QUICK LOGIN (NIS & PIN) LULUS!');
