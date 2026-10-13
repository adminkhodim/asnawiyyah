/**
 * Test Suite: Notifikasi Approval Izin Santri & Perpulangan (Mobile, Web Audio Chime, Multi-Role)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Memeriksa integrasi Notifikasi Approval Izin Santri & Perpulangan...');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const adminJsPath = path.join(__dirname, '..', 'js', 'admin.js');
const rolesJsPath = path.join(__dirname, '..', 'js', 'roles.js');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');
const rolesJs = fs.readFileSync(rolesJsPath, 'utf8');

// 1. Periksa elemen badge & lonceng di index.html
console.log('1. Memeriksa elemen lonceng & badge di index.html...');
assert(indexHtml.includes('id="admin-notif-btn"'), 'Desktop notif button harus ada');
assert(indexHtml.includes('id="admin-notif-badge"'), 'Desktop notif badge harus ada');
assert(indexHtml.includes('id="admin-mobile-notif-btn"'), 'Mobile admin notif button harus ada');
assert(indexHtml.includes('id="admin-mobile-notif-badge"'), 'Mobile admin notif badge harus ada');
assert(indexHtml.includes('id="mobile-notif-badge"'), 'Main mobile header notif badge harus ada');
assert(indexHtml.includes('id="pengasuh-perpulangan-badge"'), 'Badge tombol perpulangan di Pengasuh Control Center harus ada');
assert(indexHtml.includes('id="admin-perpulangan-badge"'), 'Badge tombol perpulangan di Admin Control Center harus ada');
assert(indexHtml.includes('id="mobile-nav-pengaturan-badge"'), 'Badge dot di bottom nav pengaturan harus ada');
assert(indexHtml.includes('id="admin-notif-dropdown"'), 'Modal/Popover notifikasi harus ada');
console.log('   ✅ Seluruh markup badge, lonceng, dan popover terpasang lengkap.');

// 2. Periksa Web Audio Chime di admin.js
console.log('2. Memeriksa logika Web Audio API Chime di js/admin.js...');
assert(adminJs.includes('playApprovalNotificationSound'), 'Fungsi playApprovalNotificationSound harus ada');
assert(adminJs.includes('AudioContext'), 'Harus menggunakan Web Audio API');
assert(adminJs.includes('1046.5'), 'Frekuensi nada C6 bell primer harus ada');
assert(adminJs.includes('1318.5'), 'Frekuensi nada E6 harmonik sekunder harus ada');
console.log('   ✅ Web Audio chime generator dua nada harmonik terverifikasi.');

// 3. Periksa sinkronisasi multi-role & background polling
console.log('3. Memeriksa filter peran dan auto-polling di js/admin.js...');
assert(adminJs.includes('updateHeaderApprovalNotifications'), 'Fungsi updateHeaderApprovalNotifications harus ada');
assert(adminJs.includes("roleUpper === 'PENGASUH'"), 'Role Pengasuh harus memfilter MENUNGGU_PENGASUH');
assert(adminJs.includes("roleUpper === 'SUPER_ADMIN' || roleUpper === 'ADMIN'"), 'Role Admin harus melihat perizinan pengurus dan pengasuh');
assert(adminJs.includes('handleMobileNotificationClick'), 'Handler notifikasi mobile harus ada');
assert(adminJs.includes('openNotificationIzinDetail'), 'Fungsi openNotificationIzinDetail harus ada');
assert(adminJs.includes('window._asnApprovalNotifInterval'), 'Interval background polling harus aktif');
console.log('   ✅ Logika RBAC approval notifikasi dan auto-polling terverifikasi.');

// 4. Periksa integrasi di roles.js
console.log('4. Memeriksa sinkronisasi roles.js saat login / pergantian akun...');
assert(rolesJs.includes('updateHeaderApprovalNotifications'), 'roles.js harus memanggil updateHeaderApprovalNotifications');
assert(rolesJs.includes("['PENGASUH', 'SUPER_ADMIN', 'ADMIN', 'ASATIDZ', 'PENGURUS'].includes(roleKey)"), 'roles.js harus preload data perpulangan');
console.log('   ✅ roles.js sinkronisasi terverifikasi.');

console.log('\n🎉 SEMUA PENGUJIAN NOTIFIKASI APPROVAL & SUARA IZIN BERHASIL 100%!');
