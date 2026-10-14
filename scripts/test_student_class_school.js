/**
 * scripts/test_student_class_school.js
 * 
 * Test Suite: Fitur Kelola Kelas & Sekolah Formal & Kolom Baru Data Santri
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 ========================================================');
console.log('   TEST SUITE: KELOLA KELAS & SEKOLAH DATA SANTRI');
console.log('   ========================================================\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(ROOT_DIR, 'js/admin.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(ROOT_DIR, 'js/api.js'), 'utf8');
const codeGs = fs.readFileSync(path.join(ROOT_DIR, 'legacy/Code.gs'), 'utf8');
const sqlMigration = fs.readFileSync(path.join(ROOT_DIR, 'docs/architecture/migration_add_kelas_sekolah_to_students.sql'), 'utf8');

// Test 1: Tombol dan Modal di index.html
console.log('▶️  Test 1: Memverifikasi elemen UI Kelola Kelas & Sekolah di index.html...');
assert(indexHtml.includes('openAdminClassSchoolManagerModal()'), 'Tombol openAdminClassSchoolManagerModal() harus ada di index.html');
assert(indexHtml.includes('id="modal-admin-class-school-manager"'), 'Modal modal-admin-class-school-manager harus ada di index.html');
assert(indexHtml.includes('id="admin-student-filter-kelas-sekolah"'), 'Dropdown filter admin-student-filter-kelas-sekolah harus ada di index.html');
assert(indexHtml.includes('id="admin-student-form-kelas-sekolah"'), 'Form input admin-student-form-kelas-sekolah harus ada di modal santri');
assert(indexHtml.includes('<th>Kelas & Sekolah</th>') || indexHtml.includes('Kelas & Sekolah'), 'Header kolom Kelas & Sekolah harus ada di tabel master data santri');
console.log('   ✅ UI elements & modal verified in index.html');

// Test 2: Master Reference Data & Functions di js/admin.js
console.log('▶️  Test 2: Memverifikasi logika referensi Kelas & Sekolah di js/admin.js...');
assert(adminJs.includes('DEFAULT_KELAS_SEKOLAH'), 'DEFAULT_KELAS_SEKOLAH harus didefinisikan');
assert(adminJs.includes('function getAdminKelasSekolah()'), 'Fungsi getAdminKelasSekolah() harus ada');
assert(adminJs.includes('function saveAdminKelasSekolah('), 'Fungsi saveAdminKelasSekolah() harus ada');
assert(adminJs.includes('function populateAdminStudentKelasSekolahDropdown('), 'Fungsi populateAdminStudentKelasSekolahDropdown() harus ada');
assert(adminJs.includes('function populateAdminStudentKelasSekolahFilter('), 'Fungsi populateAdminStudentKelasSekolahFilter() harus ada');
assert(adminJs.includes('function openAdminClassSchoolManagerModal()'), 'Fungsi openAdminClassSchoolManagerModal() harus ada');
assert(adminJs.includes('function closeAdminClassSchoolManagerModal()'), 'Fungsi closeAdminClassSchoolManagerModal() harus ada');
assert(adminJs.includes('function handleSaveClassSchoolReference('), 'Fungsi handleSaveClassSchoolReference() harus ada');
assert(adminJs.includes('function editClassSchoolReference('), 'Fungsi editClassSchoolReference() harus ada');
assert(adminJs.includes('function deleteClassSchoolReference('), 'Fungsi deleteClassSchoolReference() harus ada');
console.log('   ✅ Logic functions for master Kelas & Sekolah verified in js/admin.js');

// Test 3: Filter dan Render Kolom Baru di js/admin.js
console.log('▶️  Test 3: Memverifikasi filtering dan kolom tabel di js/admin.js...');
assert(adminJs.includes('admin-student-filter-kelas-sekolah'), 'Filter admin-student-filter-kelas-sekolah harus dibaca di filterAdminStudentsList()');
assert(adminJs.includes('s.kelas_sekolah || s.kelasSekolah'), 'Data santri kelas_sekolah harus di-render di tabel dan kartu santri');
assert(adminJs.includes('kelas_sekolah: kelasSekolah'), 'kelas_sekolah harus disimpan ke payload dan state saat submitAdminStudent()');
console.log('   ✅ Column rendering and filtering verified in js/admin.js');

// Test 4: Supabase Integration & Dual-Write di js/api.js
console.log('▶️  Test 4: Memverifikasi mapping Supabase di js/api.js...');
assert(apiJs.includes('kelas_sekolah: s.kelas_sekolah || s.kelas'), 'kelas_sekolah harus dipetakan dari Supabase di getStudents');
assert(apiJs.includes('kelas_sekolah: payload.kelas_sekolah || payload.kelasSekolah'), 'kelas_sekolah harus dikirim saat dual-write ke Supabase');
console.log('   ✅ Supabase mapping & dual-write verified in js/api.js');

// Test 5: Google Apps Script Backend di legacy/Code.gs
console.log('▶️  Test 5: Memverifikasi dukungan kolom di legacy/Code.gs...');
assert(codeGs.includes('kelasIdx = headers.indexOf("kelas_sekolah")'), 'getAllStudentsData harus mendeteksi kolom kelas_sekolah');
assert(codeGs.includes('kelas_sekolah: kelasSekolah'), 'getAllStudentsData harus mengembalikan properti kelas_sekolah');
assert(codeGs.includes('inputKelasSekolah'), 'saveStudentData harus menyimpan nilai inputKelasSekolah');
console.log('   ✅ Apps Script backend integration verified in legacy/Code.gs');

// Test 6: SQL Migration Script
console.log('▶️  Test 6: Memverifikasi file migrasi SQL...');
assert(sqlMigration.includes('ALTER TABLE public.students ADD COLUMN kelas_sekolah'), 'SQL migration harus menambahkan kolom kelas_sekolah');
console.log('   ✅ SQL migration script verified');

// Test 7: UI & Modal Ubah Kelas & Sekolah Massal
console.log('▶️  Test 7: Memverifikasi UI & Modal Ubah Kelas & Sekolah Massal...');
assert(indexHtml.includes('openBulkEditClassSchoolModal()'), 'Tombol openBulkEditClassSchoolModal() harus ada di bulk action bar index.html');
assert(indexHtml.includes('id="modal-admin-student-bulk-class-school"'), 'Modal modal-admin-student-bulk-class-school harus ada di index.html');
assert(indexHtml.includes('id="bulk-student-target-class-school"'), 'Select bulk-student-target-class-school harus ada di modal');
assert(adminJs.includes('function openBulkEditClassSchoolModal()'), 'Fungsi openBulkEditClassSchoolModal() harus ada di js/admin.js');
assert(adminJs.includes('function closeBulkEditClassSchoolModal()'), 'Fungsi closeBulkEditClassSchoolModal() harus ada di js/admin.js');
assert(adminJs.includes('function submitBulkEditClassSchool('), 'Fungsi submitBulkEditClassSchool() harus ada di js/admin.js');
assert(adminJs.includes('window.openBulkEditClassSchoolModal = openBulkEditClassSchoolModal'), 'openBulkEditClassSchoolModal harus diekspos ke window');
console.log('   ✅ Bulk edit UI, modal, and functions verified');

// Test 8: Backend Google Apps Script Batch Update Kelas & Sekolah
console.log('▶️  Test 8: Memverifikasi batchUpdateStudentClassSchool di legacy/Code.gs...');
assert(codeGs.includes('action === "batchUpdateStudentClassSchool"'), 'Router Apps Script harus mendukung action batchUpdateStudentClassSchool');
assert(codeGs.includes('function batchUpdateStudentClassSchool('), 'Fungsi batchUpdateStudentClassSchool harus diimplementasikan di legacy/Code.gs');
console.log('   ✅ Apps Script batch update backend verified');

// Test 9: Otomatisasi Sisip Kolom E (kelas_sekolah) di Google Spreadsheet
console.log('▶️  Test 9: Memverifikasi fungsi otomatis penyisipan Kolom E (kelas_sekolah) di legacy/Code.gs...');
assert(codeGs.includes('function ensureStudentSheetColumnLayout('), 'Fungsi ensureStudentSheetColumnLayout harus ada di legacy/Code.gs');
assert(codeGs.includes('sheet.insertColumnAfter(progCol1Based)'), 'Harus menyisipkan kolom baru tepat setelah kolom program');
assert(codeGs.includes('"kelas_sekolah"'), 'Header kolom baru harus dinamai kelas_sekolah');
assert(codeGs.includes('action === "autoMigrateStudentColumns"'), 'Router harus mendukung action autoMigrateStudentColumns');
console.log('   ✅ Automatic column E layout migration verified');

console.log('\n🎉 SELURUH VERIFIKASI KELAS & SEKOLAH DATA SANTRI LULUS 100%!');
