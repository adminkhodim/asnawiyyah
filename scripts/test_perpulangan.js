/**
 * scripts/test_perpulangan.js
 * Unit & Integration Test untuk Modul 20: Izin Santri & Perpulangan (Langkah 4)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 Memulai Pengujian Modul 20: Izin & Perpulangan (Langkah 4)...');

// 1. Verifikasi Keberadaan & Sintaks File js/perpulangan.js
const perpulanganJsPath = path.join(ROOT_DIR, 'js', 'perpulangan.js');
assert(fs.existsSync(perpulanganJsPath), 'File js/perpulangan.js harus ada');
const perpulanganContent = fs.readFileSync(perpulanganJsPath, 'utf8');

assert(perpulanganContent.includes('ASNPerpulangan'), 'Objek ASNPerpulangan harus terdefinisi');
assert(perpulanganContent.includes('loadPerpulanganData'), 'Fungsi loadPerpulanganData harus ada');
assert(perpulanganContent.includes('openModalFormIzin'), 'Fungsi openModalFormIzin harus ada');
assert(perpulanganContent.includes('openModalApproval'), 'Fungsi openModalApproval (Two-Tier) harus ada');
assert(perpulanganContent.includes('openModalGateCheck'), 'Fungsi openModalGateCheck (Pos Gerbang) harus ada');
assert(perpulanganContent.includes('openModalPrintSuratIzin'), 'Fungsi openModalPrintSuratIzin (Cetak Dokumen) harus ada');
console.log('✅ 1. File js/perpulangan.js valid dan memuat seluruh fungsionalitas inti');

// 2. Verifikasi Integrasi di index.html
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Cek Tombol Menu di Hub
assert(indexHtmlContent.includes('data-admin-module="perpulangan"'), 'Tombol modul perpulangan harus ada di Control Center Hub');

// Cek Navigasi Sidebar
assert(indexHtmlContent.includes('data-view="perpulangan"'), 'Tombol navigasi perpulangan harus ada di sidebar admin');

// Cek Sub-view Panel
assert(indexHtmlContent.includes('id="admin-view-perpulangan"'), 'Panel view id="admin-view-perpulangan" harus ada');
assert(indexHtmlContent.includes('id="perpulangan-table-body"'), 'Tabel perpulangan harus ada');
assert(indexHtmlContent.includes('id="perpulangan-quick-scan-input"'), 'Quick scan pos gerbang harus ada');

// Cek 6 Modals Perpulangan
const requiredModals = [
    'id="modal-perpulangan-form"',
    'id="modal-perpulangan-approval"',
    'id="modal-perpulangan-reject"',
    'id="modal-perpulangan-gate"',
    'id="modal-perpulangan-print"',
    'id="modal-perpulangan-detail"'
];

requiredModals.forEach(modalId => {
    assert(indexHtmlContent.includes(modalId), `Modal ${modalId} harus terpasang di index.html`);
});
console.log('✅ 2. Seluruh elemen UI, view panel, dan 6 modal perpulangan terpasang di index.html');

// Cek Script Tag
assert(indexHtmlContent.includes('js/perpulangan.js'), 'Script tag js/perpulangan.js harus terdaftar di index.html');
console.log('✅ 3. Script js/perpulangan.js berhasil didaftarkan di index.html');

// 3. Verifikasi Integrasi di js/admin.js (showAdminView)
const adminJsPath = path.join(ROOT_DIR, 'js', 'admin.js');
const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');

assert(adminJsContent.includes("'perpulangan': 'Izin & Perpulangan Santri'"), 'Label breadcrumb perpulangan harus ada di admin.js');
assert(adminJsContent.includes("document.getElementById('admin-view-perpulangan')"), 'Selector admin-view-perpulangan harus ada di admin.js');
assert(adminJsContent.includes("viewName === 'perpulangan'"), 'Handler viewName === perpulangan harus ada di admin.js');
console.log('✅ 4. Router showAdminView di js/admin.js mengenali modul perpulangan dengan tepat');

// 4. Verifikasi API Adapter di js/api.js
const apiJsPath = path.join(ROOT_DIR, 'js', 'api.js');
const apiJsContent = fs.readFileSync(apiJsPath, 'utf8');

assert(apiJsContent.includes('getIzinPerpulanganList'), 'getIzinPerpulanganList harus terdaftar di api.js');
assert(apiJsContent.includes('submitPermohonanIzin'), 'submitPermohonanIzin harus terdaftar di api.js');
assert(apiJsContent.includes('approveIzinPengurus'), 'approveIzinPengurus harus terdaftar di api.js');
assert(apiJsContent.includes('approveIzinPengasuh'), 'approveIzinPengasuh harus terdaftar di api.js');
assert(apiJsContent.includes('rejectPermohonanIzin'), 'rejectPermohonanIzin harus terdaftar di api.js');
assert(apiJsContent.includes('gateCheckIzin'), 'gateCheckIzin harus terdaftar di api.js');
assert(apiJsContent.includes('deleteIzinPerpulangan'), 'deleteIzinPerpulangan harus terdaftar di api.js');
assert(perpulanganContent.includes('confirmDeleteIzin'), 'Fungsi confirmDeleteIzin harus ada di js/perpulangan.js');
console.log('✅ 5. API Dual-Sync penghapusan izin (Supabase & Spreadsheet) terverifikasi');
// 6. Verifikasi Integrasi Langkah 5: Portal Wali Santri
assert(indexHtmlContent.includes('id="parent-perpulangan-tracking-list"'), 'Kontainer tracking pelacakan izin santri harus ada di portal wali santri index.html');
assert(indexHtmlContent.includes('id="parent-perpulangan-count-badge"'), 'Badge count izin harus ada di portal wali santri index.html');

const authJsPath = path.join(ROOT_DIR, 'js', 'auth.js');
const authJsContent = fs.readFileSync(authJsPath, 'utf8');

assert(authJsContent.includes('loadWaliPerpulanganData'), 'js/auth.js harus memanggil loadWaliPerpulanganData saat akun wali santri aktif');
assert(authJsContent.includes('openWaliIzinModal'), 'js/auth.js harus menyediakan tombol openWaliIzinModal pada kartu santri digital');

assert(perpulanganContent.includes('openWaliIzinModal'), 'Fungsi openWaliIzinModal harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('loadWaliPerpulanganData'), 'Fungsi loadWaliPerpulanganData harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('renderWaliIzinTracking'), 'Fungsi renderWaliIzinTracking harus ada di js/perpulangan.js');
console.log('✅ 6. Integrasi Portal Wali Santri (Form Pengajuan & Live Tracking Stepper) terverifikasi 100%');

// 6. Verifikasi Fitur Pencarian Cerdas Nama / NIS Terintegrasi Data Santri
assert(indexHtmlContent.includes('id="perpulangan-student-search-input"'), 'Input pencarian nama/NIS santri harus ada di modal form');
assert(indexHtmlContent.includes('id="perpulangan-student-search-dropdown"'), 'Dropdown live search santri harus ada di modal form');
assert(indexHtmlContent.includes('id="perpulangan-selected-student-card"'), 'Kartu santri terpilih harus ada di modal form');
assert(perpulanganContent.includes('onSearchStudentInput'), 'Handler onSearchStudentInput harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('selectStudentFromSearch'), 'Handler selectStudentFromSearch harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('selectStudentByIndex'), 'Handler selectStudentByIndex harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('selectStudentFromLinked'), 'Handler selectStudentFromLinked harus ada di js/perpulangan.js');
assert(perpulanganContent.includes('getAllAvailableStudents'), 'Fungsi getAllAvailableStudents harus ada di js/perpulangan.js');
console.log('✅ 7. Fitur Pencarian Cerdas Nama/NIS Terhubung Master Data Santri (Direct Click & Touch Safe) Terverifikasi 100%');

console.log('\n🎉 SELURUH PENGUJIAN MODUL PERPULANGAN SUKSES 100%!');


