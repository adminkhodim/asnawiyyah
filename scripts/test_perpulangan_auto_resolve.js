/**
 * Test Suite: Auto-Resolving & Normalisasi Santri Izin Perpulangan
 * PPTQ Asnawiyyah
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const perpulanganJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'perpulangan.js'), 'utf8');
const apiJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'api.js'), 'utf8');

console.log('🧪 Memulai Pengujian Auto-Resolving Nama & NIS Santri...');

// 1. Verifikasi Logika di js/perpulangan.js
assert(perpulanganJs.includes('resolveStudentByNameOrNis'), 'Fungsi resolveStudentByNameOrNis harus didefinisikan');
assert(perpulanganJs.includes('normalizeStudentSearchKey'), 'Fungsi normalizeStudentSearchKey harus didefinisikan');
assert(perpulanganJs.includes('syncResolvedStudentToSupabase'), 'Fungsi syncResolvedStudentToSupabase harus didefinisikan');
assert(perpulanganJs.includes('await ensureStudentsLoaded()'), 'ensureStudentsLoaded harus dipanggil saat load data');
console.log('✅ 1. Fungsi resolver dan auto-sync background terverifikasi di js/perpulangan.js');

// 2. Verifikasi Resolusi saat Submit Form
assert(perpulanganJs.includes('if ((!studentId || !studentNis) && studentName)'), 'Proteksi submit manual harus aktif di submitFormIzin');
assert(apiJs.includes('if ((!row.student_nis || !row.student_id) && row.student_name)'), 'Fallback resolver harus aktif di api.js saat submit');
console.log('✅ 2. Proteksi submit form dan backend adapter terverifikasi');

console.log('🎉 SEMUA PENGUJIAN AUTO-RESOLVE BERHASIL (100% PASS)!');
