/**
 * scripts/split_admin.js
 * 
 * Script otomatis untuk memecah monolit js/admin.js (10.854 baris)
 * menjadi modul-modul terpisah berbasis domain di direktori js/admin/:
 *   - 01_core.js   : Dashboard navigation, quick search, biometric & approval notifications, stagger animations
 *   - 02_cms.js    : PPDB, Profil Lembaga, Berita, Banner, Galeri, UKS, Jadwal, Notifikasi, Program CMS
 *   - 03_santri.js : Master Santri, referensi program & kelas sekolah, bulk update modal, export excel
 *   - 04_users.js  : Manajemen pengguna, roles & permissions, online users heartbeat modal
 *   - 05_wali.js   : Manajemen wali santri, relasi multi-santri, deteksi unlinked & follow-up WhatsApp
 *   - 06_alumni.js : Rekapitulasi data alumni Hasanah admin controller & initializers
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ADMIN_JS_PATH = path.join(ROOT_DIR, 'js', 'admin.js');
const ADMIN_DIR = path.join(ROOT_DIR, 'js', 'admin');

if (!fs.existsSync(ADMIN_JS_PATH)) {
  console.error('❌ js/admin.js tidak ditemukan di:', ADMIN_JS_PATH);
  process.exit(1);
}

if (!fs.existsSync(ADMIN_DIR)) {
  fs.mkdirSync(ADMIN_DIR, { recursive: true });
}

const rawCode = fs.readFileSync(ADMIN_JS_PATH, 'utf8');
const lines = rawCode.split('\n');

console.log(`📖 Membaca js/admin.js (${lines.length} baris)...`);

function sliceLines(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

console.log('✂️  Mempartisi modul domain frontend...');

// 1. Core
const coreContent = `/**
 * ============================================================================
 * 01_core.js - Admin Core Controller & Navigation
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Autentikasi Modal & Sesi Admin (openAdminLoginModal, closeAdminLoginModal)
 *  - Navigasi & View Router (showAdminView, openAdminModuleFromControlCenter, backFromAdminModule)
 *  - Quick Search Finder (handleAdminGlobalSearchInput, navigateAdminSearchSelection)
 *  - Biometric Controls & Realtime Analytics Chart
 *  - Header Approval Notifications Chime (Web Audio API) & Real-time Polling
 *  - Stagger Animations untuk Seluruh Tampilan Modul
 * ============================================================================
 */

${sliceLines(1, 1246)}
`;

// 2. CMS
const cmsContent = `/**
 * ============================================================================
 * 02_cms.js - Content Management System (CMS) & Lembaga
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - PPDB Data Controller & Detail Modal (lines 1247-1276)
 *  - Profil Lembaga & Pengaturan Publik/Admin (Sejarah, Visi Misi, Pengurus)
 *  - Manajemen Berita (Kategori, Form, Draft, Publikasi, Hapus)
 *  - Manajemen Banner & Carousel Beranda
 *  - Manajemen Galeri Foto Dokumentasi Pesantren
 *  - Manajemen Unit Kegiatan Santri (UKS / Ekstrakurikuler)
 *  - Manajemen Jadwal Kegiatan Harian Santri
 *  - Manajemen Program Pesantren CMS & Galeri Program
 *  - Manajemen Notifikasi & Pengumuman Pop-up Beranda
 * ============================================================================
 */

${sliceLines(1247, 6522)}
`;

// 3. Santri
const santriContent = `/**
 * ============================================================================
 * 03_santri.js - Master Data Santri & Kesiswaan
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Data Santri (Load, Render Tabel, Filter Program/Kelas/Gender, Search)
 *  - Form Input & Edit Santri (openAdminStudentModal, submitAdminStudent, deleteAdminStudent)
 *  - Referensi Master Program Pesantren (DEFAULT_PESANTREN_PROGRAMS, save/delete program)
 *  - Referensi Master Kelas & Sekolah (DEFAULT_KELAS_SEKOLAH, save/delete kelas)
 *  - Bulk Update Program Santri (Modal & Batch Submit)
 *  - Bulk Update Kelas & Sekolah Santri (Modal & Batch Submit)
 *  - Ekspor Data Santri ke Excel (.xlsx / SheetJS) & CSV
 * ============================================================================
 */

${sliceLines(6523, 8560)}
`;

// 4. Users
const usersContent = `/**
 * ============================================================================
 * 04_users.js - Manajemen Pengguna & Otorisasi RBAC
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Akun Pengguna Terpadu (Load, Render, Filter Role/Status, Search)
 *  - Form Akun Pengguna (openAdminUserModal, handleAdminUserSubmit, deleteAdminUser)
 *  - Pemilihan Hubungan Data Pegawai/Guru dengan Akun Pengguna
 *  - Modal Pemantau Pengguna Online (Realtime Heartbeat Monitor & Device Info)
 * ============================================================================
 */

${sliceLines(8561, 9513)}
`;

// 5. Wali Santri
const waliContent = `/**
 * ============================================================================
 * 05_wali.js - Data Wali Santri & Multi-Santri Mapping
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Akun & Identitas Wali Santri Terdaftar (Load, Render, Filter)
 *  - Mode Deteksi Santri Belum Terhubung (Unlinked) & Follow-Up WhatsApp Otomatis
 *  - Modal Detail Wali Santri & Relasi Keluarga Santri (Multi-Santri)
 *  - Hubungkan Santri Baru ke Akun Wali secara Mandiri/Manual
 *  - Pemeriksaan Izin Peran Santri & Users (applySantriRolePermissions)
 * ============================================================================
 */

${sliceLines(9514, 10278)}
`;

// 6. Alumni
const alumniContent = `/**
 * ============================================================================
 * 06_alumni.js - Rekapitulasi Data Alumni (Hasanah) & Initializer
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Rekap Master Data Alumni Hasanah (Load, Render Tabel, Filter Tahun/Status)
 *  - Modal Tambah & Edit Data Alumni
 *  - Ekspor Data Alumni ke Excel
 *  - Window Export Finalizer & Auto-Initialize DOM Ready Analytics
 * ============================================================================
 */

${sliceLines(10279, lines.length)}
`;

const MODULES = [
  { name: '01_core.js', content: coreContent },
  { name: '02_cms.js', content: cmsContent },
  { name: '03_santri.js', content: santriContent },
  { name: '04_users.js', content: usersContent },
  { name: '05_wali.js', content: waliContent },
  { name: '06_alumni.js', content: alumniContent }
];

MODULES.forEach(mod => {
  const modPath = path.join(ADMIN_DIR, mod.name);
  fs.writeFileSync(modPath, mod.content, 'utf8');
  console.log(`  ✅ Dihasilkan: js/admin/${mod.name} (${mod.content.split('\n').length} baris)`);
});

console.log('🎉 Pemecahan modular js/admin/ selesai dengan sukses!');
