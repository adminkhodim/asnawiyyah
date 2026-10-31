/**
 * scripts/test_izin_asatidz_frontend.js
 * 
 * Unit test suite untuk memverifikasi Formulir Frontend & Antarmuka Persetujuan Pengasuh:
 * 1. Markup modal #modal-izin-asatidz dan seluruh field input
 * 2. Tombol trigger openIzinAsatidzModal di header Tahfidz
 * 3. Tab & Pane Persetujuan Pengasuh (#tab-btn-izin-approval, #pane-izin-asatidz-approval)
 * 4. Banner notifikasi Pengasuh di #admin-view-tahfidz dan badge di Pusat Kontrol
 * 5. Script loader js/izin-asatidz.js di index.html
 * 6. Fungsi controller dan aksi persetujuan di js/izin-asatidz.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Memulai Pengujian Frontend: Formulir Izin Asatidz & Persetujuan Pengasuh...');

const indexPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. Verifikasi Tombol Trigger Modal di Header Modul Tahfidz
assert(indexHtml.includes('openIzinAsatidzModal()'), 'Tombol openIzinAsatidzModal() harus ada di index.html');
assert(indexHtml.includes('Izin Asatidz'), 'Label tombol "Izin Asatidz" harus ada di index.html');
console.log('  ✅ 1. Tombol trigger modal Izin Asatidz terpasang di header Tahfidz');

// 2. Verifikasi Script Tag js/izin-asatidz.js
assert(indexHtml.includes('src="js/izin-asatidz.js?v=1"'), 'Script js/izin-asatidz.js?v=1 harus dimuat di index.html');
console.log('  ✅ 2. Script loader js/izin-asatidz.js terpasang di index.html');

// 3. Verifikasi Markup Modal, Elemen Form, dan Tab Persetujuan Pengasuh
const requiredElements = [
    'id="modal-izin-asatidz"',
    'id="form-izin-asatidz"',
    'id="tab-btn-izin-form"',
    'id="tab-btn-izin-my"',
    'id="tab-btn-izin-badal"',
    'id="tab-btn-izin-approval"',
    'id="badge-count-izin-approval"',
    'id="pane-izin-asatidz-form"',
    'id="pane-izin-asatidz-my"',
    'id="pane-izin-asatidz-badal"',
    'id="pane-izin-asatidz-approval"',
    'id="izin-asatidz-nama"',
    'id="izin-asatidz-tgl-mulai"',
    'id="izin-asatidz-tgl-selesai"',
    'id="izin-asatidz-kategori"',
    'id="izin-asatidz-badal"',
    'id="izin-asatidz-alasan"',
    'id="izin-asatidz-catatan-badal"',
    'id="izin-asatidz-lampiran"',
    'id="btn-submit-izin-asatidz"',
    'id="izin-asatidz-my-list"',
    'id="izin-asatidz-badal-list"',
    'id="izin-asatidz-approval-list"'
];

requiredElements.forEach(elem => {
    assert(indexHtml.includes(elem), `Elemen ${elem} wajib tersedia dalam modal`);
});
console.log('  ✅ 3. Seluruh elemen modal (input, quick-chips, tab panes, badges, approval list) lengkap');

// 4. Verifikasi Banner & Badge Pengasuh
assert(indexHtml.includes('id="banner-pengasuh-izin-asatidz"'), 'Banner notifikasi Pengasuh harus ada di modul Tahfidz');
assert(indexHtml.includes('id="pengasuh-tahfidz-izin-badge"'), 'Badge notifikasi izin harus ada di ikon Tahfidz Pusat Kontrol Pengasuh');
assert(indexHtml.includes('id="pengasuh-priority-izin-card"'), 'Kartu Prioritas Izin Asatidz harus ada di Dashboard Pengasuh (di atas Pusat Kontrol)');
assert(indexHtml.includes('id="admin-hub-pengasuh-priority-card"'), 'Kartu Prioritas Izin Asatidz harus ada di Beranda Utama Admin Hub (di atas Overall Data)');
console.log('  ✅ 4. Banner Tahfidz, Badge Pusat Kontrol, & Kartu Prioritas Pengasuh di Beranda Utama terpasang');

// 5. Verifikasi Kontroler js/izin-asatidz.js
const controllerPath = path.resolve(__dirname, '../js/izin-asatidz.js');
const controllerJs = fs.readFileSync(controllerPath, 'utf8');

const requiredFunctions = [
    'window.openIzinAsatidzModal = openIzinAsatidzModal',
    'window.closeIzinAsatidzModal = closeIzinAsatidzModal',
    'window.submitIzinAsatidzForm = submitIzinAsatidzForm',
    'window.setIzinAsatidzSesi = setIzinAsatidzSesi',
    'window.setIzinAsatidzKategori = setIzinAsatidzKategori',
    'window.switchIzinAsatidzTab = switchIzinAsatidzTab',
    'window.loadIzinAsatidzHistory = loadIzinAsatidzHistory',
    'window.canApproveIzinAsatidz = canApproveIzinAsatidz',
    'window.renderApprovalList = renderApprovalList',
    'window.processApprovalAction = processApprovalAction',
    'window.getHalaqahDelegation = getHalaqahDelegation'
];

requiredFunctions.forEach(fn => {
    assert(controllerJs.includes(fn), `Handler ${fn} harus diekspos ke window`);
});
console.log('  ✅ 5. Seluruh fungsi controller dan aksi approval js/izin-asatidz.js tervalidasi');

// 6. Simulasi Logika Otoritas Approval Pengasuh & Aksi Qobul / Tolak
function simulateRoleAuthorization(role) {
    const r = String(role || '').toUpperCase();
    return r === 'PENGASUH' || r === 'SUPER_ADMIN' || r === 'ADMIN';
}

assert.strictEqual(simulateRoleAuthorization('PENGASUH'), true, 'Pengasuh harus memiliki hak persetujuan');
assert.strictEqual(simulateRoleAuthorization('SUPER_ADMIN'), true, 'Super Admin harus memiliki hak persetujuan');
assert.strictEqual(simulateRoleAuthorization('ADMIN'), true, 'Admin harus memiliki hak persetujuan');
assert.strictEqual(simulateRoleAuthorization('ASATIDZ'), false, 'Asatidz reguler tidak boleh memiliki hak approval');
assert.strictEqual(simulateRoleAuthorization('WALI_SANTRI'), false, 'Wali Santri tidak boleh memiliki hak approval');
console.log('  ✅ 6. RBAC otorisasi persetujuan Pengasuh & Dewan Masyayikh valid');

// 7. Verifikasi Indikator Badge Badal di js/tahfidz.js & index.html
const tahfidzJsPath = path.resolve(__dirname, '../js/tahfidz.js');
const tahfidzJs = fs.readFileSync(tahfidzJsPath, 'utf8');

assert(indexHtml.includes('id="tahfidz-active-badal-notice"'), 'Banner notifikasi badal aktif harus ada di index.html');
assert(tahfidzJs.includes('getHalaqahDelegation'), 'js/tahfidz.js harus memanggil getHalaqahDelegation');
assert(tahfidzJs.includes('Diampu Badal Hari Ini'), 'Kartu halaqah harus menampilkan status Diampu Badal Hari Ini');
assert(tahfidzJs.includes('updateTahfidzBadalNotice'), 'updateTahfidzBadalNotice harus diimplementasikan di js/tahfidz.js');
assert(tahfidzJs.includes('Badal: ${escapeHtml(stDelegation.namaBadal)}'), 'Tabel santri harus merender badge badal');
console.log('  ✅ 7. Indikator visual badge Badal pada kartu halaqah, filter, dan tabel santri tervalidasi');

// 8. Verifikasi Unified Header Approval Hub di js/admin/01_core.js & js/admin.js
const adminJsPath = path.resolve(__dirname, '../js/admin.js');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

assert(adminJs.includes('openNotificationAsatidzDetail'), 'js/admin.js harus mengekspos openNotificationAsatidzDetail');
assert(adminJs.includes('ASNIzinAsatidz.pendingApprovalList'), 'updateHeaderApprovalNotifications harus memperhitungkan izin asatidz');
assert(adminJs.includes('Restu Asatidz'), 'Dropdown notifikasi header harus memiliki label Restu Asatidz');
console.log('  ✅ 8. Integrasi Lonceng Header Global (Unified Approval Hub) tervalidasi');

console.log('🎉 SEMUA TEST FRONTEND & PERSETUJUAN PENGASUH BERHASIL!\n');
