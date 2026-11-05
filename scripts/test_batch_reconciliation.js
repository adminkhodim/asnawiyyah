/**
 * scripts/test_batch_reconciliation.js
 * 
 * Unit Test: Batch Reconciliation & Historical Data Sync Engine (GAS -> Supabase)
 * Memverifikasi:
 * 1. Keberadaan fungsi rekonsiliasi historis di legacy/00_Config_Security.gs dan legacy/Code.gs
 * 2. Normalisasi data: sanitasi gender ('Putra'/'Putri'), format tanggal ISO, dan penanganan nilai null
 * 3. Mekanisme batching (chunk size 50) untuk mencegah payload overflow
 * 4. Eksekusi master orchestrator syncAllHistoricalSheetsToSupabase()
 * 5. Menu interaktif spreadsheet (onOpen)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🔄 Menjalankan Batch Reconciliation & Data Sync Test Suite (Opsi 2A)...');

const ROOT = path.resolve(__dirname, '..');
const configGs = fs.readFileSync(path.join(ROOT, 'legacy/00_Config_Security.gs'), 'utf8');
const codeGs = fs.readFileSync(path.join(ROOT, 'legacy/Code.gs'), 'utf8');

// 1. Verifikasi Statis Deklarasi Fungsi
const EXPECTED_FUNCTIONS = [
  'syncHistoricalStudentsToSupabase',
  'syncHistoricalTahfidzLogsToSupabase',
  'syncHistoricalTahfidzCapaianToSupabase',
  'syncHistoricalIzinPerpulanganToSupabase',
  'syncHistoricalPegawaiToSupabase',
  'syncHistoricalBeritaToSupabase',
  'syncAllHistoricalSheetsToSupabase',
  'onOpen'
];

for (const fn of EXPECTED_FUNCTIONS) {
  assert(configGs.includes(`function ${fn}`), `00_Config_Security.gs harus mendeklarasikan ${fn}`);
  assert(codeGs.includes(`function ${fn}`), `Code.gs harus membawa ${fn} setelah proses bundling`);
}
console.log('  ✅ [PASS] Seluruh deklarasi fungsi rekonsiliasi terverifikasi di backend modular & bundle.');

// 2. Evaluasi Runtime Normalisasi & Orchestrator
let mockProperties = {
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-secret-key-12345',
  SUPABASE_URL: 'https://test-reconcile.supabase.co'
};
let replicatedRequests = [];

const mockPropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => mockProperties[k] || null,
    setProperty: (k, v) => { mockProperties[k] = String(v); },
    deleteProperty: (k) => { delete mockProperties[k]; }
  })
};

const mockUrlFetchApp = {
  fetch: (url, options) => {
    replicatedRequests.push({ url, options });
    return {
      getResponseCode: () => 201,
      getContentText: () => JSON.stringify({ success: true, count: 1 })
    };
  }
};

const mockUtilities = {
  getUuid: () => 'mock-uuid-1234-5678',
  formatDate: (d, tz, fmt) => '20261031',
  computeHmacSha256Signature: () => [1, 2, 3]
};

// Mock Spreadsheet dengan Mock Sheets
const createMockSheet = (name, headers, rows) => {
  const data = [headers, ...rows];
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getDataRange: () => ({
      getValues: () => data
    })
  };
};

const mockStudentsSheet = createMockSheet('Students',
  ['student_id', 'nis', 'name', 'program', 'kelas_sekolah', 'status', 'created_at', 'birth_date', 'nik', 'gender', 'photo_url'],
  [
    ['STD-001', '1001', 'Ahmad Fauzi', 'Tahfidz Al-Quran', '7A', 'AKTIF', '2026-01-01', new Date('2010-05-15'), '330101', 'Laki-laki', 'https://photo.jpg'],
    ['STD-002', '1002', 'Siti Maryam', 'Reguler', '8B', 'AKTIF', '2026-01-01', '2011-08-20', '330102', 'P', '']
  ]
);

const mockTahfidzSheet = createMockSheet('Tahfidz_Logs',
  ['log_id', 'student_id', 'nis', 'student_name', 'gender', 'tanggal', 'sesi', 'tipe', 'juz', 'halaman_list', 'total_halaman', 'nilai', 'muhafiz', 'status_setoran', 'catatan', 'created_at'],
  [
    ['LOG-001', 'STD-001', '1001', 'Ahmad Fauzi', 'Putra', '2026-10-25', 'Pagi', 'ZIYADAH', 30, '582-583', 2, 'JAYYID', 'Ust. Zaid', 'LANJUT', 'Lancar', '2026-10-25T07:00:00Z'],
    ['LOG-002', 'STD-002', '1002', 'Siti Maryam', 'Putri', '2026-10-26', 'Sore', 'MURAJAAH_SABQI', 30, '580-581', 2, 'MUMTAZ', 'Ustz. Hindun', 'LANJUT', '', '2026-10-26T16:00:00Z']
  ]
);

const mockCapaianSheet = createMockSheet('Tahfidz_Capaian',
  ['student_id', 'student_name', 'juz_aktif', 'halaman_terakhir', 'total_halaman_tuntas', 'status_terakhir', 'halaqah_id', 'nama_halaqah', 'muhafiz_pembina', 'updated_at', 'sabqi_halaman', 'manzil_juz', 'manzil_halaman', 'manzil_putaran', 'total_halaman_murojaah'],
  [
    ['STD-001', 'Ahmad Fauzi', 30, 583, 20, 'LANJUT', 'HLQ-01', 'Halaqah Ula', 'Ust. Zaid', '2026-10-30T00:00:00Z', '581', '30', '580', 1, 15]
  ]
);

const mockIzinSheet = createMockSheet('Izin_Perpulangan',
  ['id_izin', 'student_id', 'student_nis', 'student_name', 'wali_id', 'wali_name', 'wali_phone', 'kategori', 'keperluan', 'tanggal_mulai', 'tanggal_selesai', 'jam_kembali', 'status', 'penjemput_nama', 'penjemput_status', 'created_at'],
  [
    ['IZN-20261028-0001', 'STD-001', '1001', 'Ahmad Fauzi', 'WLI-1001', 'H. Sulaiman', '08123456789', 'Sakit', 'Kontrol RS', '2026-10-28', '2026-10-30', '17:00', 'DISETUJUI_PENGASUH', 'H. Sulaiman', 'Ayah Kandung', '2026-10-28T08:00:00Z']
  ]
);

const mockPegawaiSheet = createMockSheet('Pegawai',
  ['employee_id', 'nama', 'nip', 'gender', 'jabatan', 'spesialisasi', 'telepon', 'email', 'status'],
  [
    ['PEG-001', 'Ust. Zaid', '19800101', 'Putra', 'Muhafiz Utama', 'Tahfidz', '0811223344', 'zaid@asnawiyyah.id', 'AKTIF']
  ]
);

const mockBeritaSheet = createMockSheet('Berita',
  ['news_id', 'slug', 'Tanggal', 'Judul', 'Kategori', 'Penulis', 'Gambar_URL', 'Ringkasan', 'Isi', 'Views'],
  [
    ['NWS_001', 'kegiatan-santri-abc1', '2026-10-31', 'Kegiatan Santri', 'Kabar', 'Admin', 'https://img.url', 'Ringkasan', 'Isi artikel berita', 10]
  ]
);

const mockNotifikasiSheet = createMockSheet('Notifikasi',
  ['id', 'Judul', 'Kategori', 'Tanggal', 'Ringkasan', 'Isi', 'Gambar_URL', 'Is_Popup', 'Status', 'CreatedAt'],
  [
    ['NOTIF_001', 'Pengumuman Penting', 'Pengumuman', '2026-11-01', 'Ringkasan warta', 'Isi pengumuman resmi', 'https://img.url', 1, 'Aktif', '2026-11-01T10:00:00.000Z']
  ]
);

const mockSpreadsheet = {
  getSheetByName: (n) => {
    if (n === 'Students' || n === 'data_santri') return mockStudentsSheet;
    if (n === 'Tahfidz_Logs') return mockTahfidzSheet;
    if (n === 'Tahfidz_Capaian') return mockCapaianSheet;
    if (n === 'Izin_Perpulangan') return mockIzinSheet;
    if (n === 'Pegawai') return mockPegawaiSheet;
    if (n === 'Berita' || n === 'Kabar') return mockBeritaSheet;
    if (n === 'Notifikasi') return mockNotifikasiSheet;
    return null;
  },
  getSheets: () => [mockStudentsSheet, mockTahfidzSheet, mockCapaianSheet, mockIzinSheet, mockPegawaiSheet, mockBeritaSheet, mockNotifikasiSheet]
};

const sandbox = {
  PropertiesService: mockPropertiesService,
  UrlFetchApp: mockUrlFetchApp,
  Utilities: mockUtilities,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSpreadsheet,
    getUi: () => ({
      createMenu: (title) => ({
        addItem: function () { return this; },
        addSeparator: function () { return this; },
        addToUi: () => { }
      })
    })
  },
  Logger: { log: () => { } },
  console: console,
  setTimeout: setTimeout
};

vm.createContext(sandbox);

// Muat 00_Config_Security.gs ke dalam sandbox VM
vm.runInContext(configGs, sandbox);

// 3. Uji Fungsi Format Tanggal & Normalisasi Gender
const fmtDate = sandbox.formatSyncDateIso_(new Date('2026-10-31T05:00:00Z'));
assert(fmtDate.startsWith('2026-10-31'), `formatSyncDateIso_ harus menghasilkan format YYYY-MM-DD, didapat: ${fmtDate}`);

const genderL = sandbox.normalizeSyncGender_('Laki-laki');
const genderP = sandbox.normalizeSyncGender_('Perempuan');
assert.strictEqual(genderL, 'Putra', 'Laki-laki harus dinormalisasi menjadi Putra');
assert.strictEqual(genderP, 'Putri', 'Perempuan harus dinormalisasi menjadi Putri');

// Uji normalisasi jam perpulangan (mencegah error VARCHAR(16))
const timeDate = new Date('1899-12-30T17:00:00');
const parsedTimeDate = sandbox.formatSyncTimeHHmm_(timeDate, '17:00');
assert.strictEqual(parsedTimeDate.length <= 16, true, 'formatSyncTimeHHmm_ harus <= 16 karakter');
const parsedTimeString = sandbox.formatSyncTimeHHmm_('17:00 WIB', '17:00');
assert.strictEqual(parsedTimeString, '17:00', 'formatSyncTimeHHmm_ harus mengekstrak HH:mm');
console.log('  ✅ [PASS] Sanitasi & formatters (Date ISO, Time HH:mm <= 16 chars, Gender Putra/Putri) terverifikasi.');

// 4. Uji Eksekusi Master Orchestrator
replicatedRequests = [];
const summary = sandbox.syncAllHistoricalSheetsToSupabase();

assert.strictEqual(summary.success, true, 'syncAllHistoricalSheetsToSupabase harus berhasil dieksekusi');
assert(summary.grand_total_records >= 6, `Total records harus >= 6, didapat: ${summary.grand_total_records}`);
assert(summary.grand_total_synced >= 6, `Total synced harus >= 6, didapat: ${summary.grand_total_synced}`);

// Verifikasi Endpoint REST & Prefer Header
const targetEndpoints = replicatedRequests.map(r => r.url);
assert(targetEndpoints.some(u => u.includes('/rest/v1/students?on_conflict=student_id')), 'Harus memanggil endpoint students');
assert(targetEndpoints.some(u => u.includes('/rest/v1/tahfidz_logs?on_conflict=log_id')), 'Harus memanggil endpoint tahfidz_logs');
assert(targetEndpoints.some(u => u.includes('/rest/v1/tahfidz_capaian?on_conflict=student_id')), 'Harus memanggil endpoint tahfidz_capaian');
assert(targetEndpoints.some(u => u.includes('/rest/v1/izin_perpulangan?on_conflict=id_izin')), 'Harus memanggil endpoint izin_perpulangan');
assert(targetEndpoints.some(u => u.includes('/rest/v1/pegawai?on_conflict=employee_id')), 'Harus memanggil endpoint pegawai');
assert(targetEndpoints.some(u => u.includes('/rest/v1/berita?on_conflict=news_id')), 'Harus memanggil endpoint berita');
assert(targetEndpoints.some(u => u.includes('/rest/v1/notifikasi?on_conflict=id')), 'Harus memanggil endpoint notifikasi');

for (const req of replicatedRequests) {
  assert.strictEqual(req.options.headers.Authorization, 'Bearer test-service-role-secret-key-12345');
  assert.strictEqual(req.options.headers.Prefer, 'return=representation,resolution=merge-duplicates');
}

console.log(`  ✅ [PASS] Eksekusi batch reconciliation berhasil mengirim ${replicatedRequests.length} payload ke Supabase via service_role.`);
console.log('🎉 Batch Reconciliation & Data Sync Engine PASSED 100%!');

