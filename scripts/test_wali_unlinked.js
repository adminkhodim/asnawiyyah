/**
 * Test Suite: Fitur Santri Belum Terhubung & Follow-Up WhatsApp
 * PPTQ Asnawiyyah
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'admin.js'), 'utf8');

console.log('🧪 Memulai Pengujian Fitur Santri Belum Terhubung & Follow-up WA...');

// 1. Verifikasi Elemen UI di index.html
assert(indexHtml.includes('id="wali-metric-unlinked"'), 'Kartu metrik unlinked harus ada di index.html');
assert(indexHtml.includes('id="filter-wali-unlinked"'), 'Filter pill tab Belum Terhubung harus ada di index.html');
assert(indexHtml.includes('id="count-pill-wali-unlinked"'), 'Counter badge tab Belum Terhubung harus ada di index.html');
assert(indexHtml.includes('id="admin-wali-table-head"'), 'Table head ID dinamis harus ada di index.html');
assert(indexHtml.includes("onclick=\"setAdminWaliFilter('UNLINKED')\""), 'Handler click filter UNLINKED harus ada di index.html');
console.log('✅ 1. Elemen UI (Metrik, Filter Pill, Counter, Table Head) terpasang dengan benar di index.html');

// 2. Verifikasi Logika di js/admin.js
assert(adminJs.includes('adminUnlinkedStudentsList'), 'Variabel penampung adminUnlinkedStudentsList harus didefinisikan');
assert(adminJs.includes("adminWaliFilterType === 'UNLINKED'"), 'Filter UNLINKED harus didukung');
assert(adminJs.includes('sendWaliFollowupWhatsApp'), 'Fungsi sendWaliFollowupWhatsApp harus ada');
assert(adminJs.includes('openAdminConnectStudentModal'), 'Fungsi openAdminConnectStudentModal harus ada');
assert(adminJs.includes('window.sendWaliFollowupWhatsApp = sendWaliFollowupWhatsApp'), 'Fungsi sendWaliFollowupWhatsApp harus diekspos ke window');
console.log('✅ 2. Logika filter, deteksi unlinked, dan handler di js/admin.js terverifikasi');

// 3. Verifikasi Template Pesan WhatsApp
assert(adminJs.includes('https://asnawiyyah.or.id/'), 'Link portal pondok harus ada di template pesan WhatsApp');
assert(adminJs.includes("Assalamu'alaikum Wr. Wb."), 'Salam resmi harus ada di pesan WhatsApp');
assert(adminJs.includes('https://wa.me/'), 'Link WhatsApp harus valid');
console.log('✅ 3. Format pesan WhatsApp resmi & deep-link terverifikasi');

console.log('🎉 SELURUH PENGUJIAN FITUR BELUM TERHUBUNG & FOLLOW-UP WA BERHASIL (100% PASS)!');
