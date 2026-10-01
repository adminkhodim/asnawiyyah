/**
 * scripts/split_backend.js
 * 
 * Script otomatis untuk memecah monolit legacy/Code.gs menjadi file-file modular
 * per domain untuk deployment Google Apps Script via Clasp:
 *   - 00_Config_Security.gs
 *   - 01_Router.gs
 *   - 02_Auth_RBAC.gs
 *   - 03_PPDB.gs
 *   - 04_Tahfidz.gs
 *   - 05_CMS.gs
 *   - 06_MasterData.gs
 * 
 * Serta menyinkronkan legacy/.claspignore dan menyediakan bundle validation.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const LEGACY_DIR = path.join(ROOT_DIR, 'legacy');
const CODE_GS_PATH = path.join(LEGACY_DIR, 'Code.gs');

if (!fs.existsSync(CODE_GS_PATH)) {
  console.error('❌ legacy/Code.gs not found at:', CODE_GS_PATH);
  process.exit(1);
}

const rawCode = fs.readFileSync(CODE_GS_PATH, 'utf8');
const lines = rawCode.split('\n');

console.log(`📖 Reading legacy/Code.gs (${lines.length} lines)...`);

// Helper to extract line ranges (1-indexed inclusive)
function sliceLines(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

console.log('✂️  Partitioning domain modules...');

// 00_Config_Security
const configSecurityContent = `/**
 * ============================================================================
 * 00_Config_Security.gs
 * PPTQ Asnawiyyah Backend Architecture - Configuration, Security & Core Helpers
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Error Classes & Response Envelopes (createJsonResponse, formatDate)
 *  - Script Properties & Cryptographic Salt / Secrets Management
 *  - Session TTL Configuration, HMAC Token Generation & Verification
 *  - Password Hashing & Verification (SHA-256)
 *  - LockService Concurrency & Security Audit Log
 *  - Database Spreadsheet Accessor & Base Sheet Schemas
 * ============================================================================
 */

${sliceLines(641, 650)}

${sliceLines(828, 839)}

${sliceLines(2513, 2598)}

${sliceLines(3013, 3373)}

${sliceLines(4551, 4569)}

${sliceLines(5345, 5435)}

${sliceLines(5586, 5720)}

${sliceLines(6418, 6440)}
`;

// 01_Router
const routerContent = `/**
 * ============================================================================
 * 01_Router.gs
 * PPTQ Asnawiyyah Backend Architecture - HTTP Gateway & Request Router
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - HTTP POST Gateway (doPost): Action dispatcher, payload parsing,
 *    CORS handling, unified RBAC guards, dan payload routing ke domain handler.
 *  - HTTP GET Gateway (doGet): Public query dispatcher, fallback redirect
 *    ke portal Vercel resmi (https://asnawiyyah.vercel.app/) dan JSON status envelope.
 *  - Drive Permission Helper (mintaIzinDrive).
 * ============================================================================
 */

${sliceLines(1, 640)}

${sliceLines(1360, 1368)}

${sliceLines(1369, 1536)}
`;

// 02_Auth_RBAC
const authRbacContent = `/**
 * ============================================================================
 * 02_Auth_RBAC.gs
 * PPTQ Asnawiyyah Backend Architecture - Identity, Authentication & RBAC
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Autentikasi Pengguna: Admin, Wali Santri, Pengasuh, Asatidz
 *  - RBAC (Role-Based Access Control) Matrix & Permissions Management
 *  - One-Time Password (OTP) Generation, Verification & Delivery (Email / WA)
 *  - Google SSO (One-Click Authentication)
 *  - Session Store, Token Verification, dan Revocation (Logout)
 *  - Aktivasi Akun Wali Santri & Multi-Identity Synchronization
 *  - Action Dispatcher: handleAuthApiAction
 * ============================================================================
 */

${sliceLines(4547, 4549)}

${sliceLines(4570, 4771)}

${sliceLines(4772, 5344)}

${sliceLines(5436, 5584)}

${sliceLines(5721, 6417)}

${sliceLines(6595, 7394)}

${sliceLines(7898, 8322)}

${sliceLines(8323, 8391)}

${sliceLines(8392, 9308)}
`;

// 03_PPDB
const ppdbContent = `/**
 * ============================================================================
 * 03_PPDB.gs
 * PPTQ Asnawiyyah Backend Architecture - Penerimaan Peserta Didik Baru
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Pengecekan Status Pendaftaran Santri Baru (checkStatusPendaftar via NISN)
 *  - Form Submission Pendaftaran Baru (submitPendaftaran)
 *  - Ambil Data Seluruh Pendaftar untuk Dashboard Admin (getPendaftarData)
 * ============================================================================
 */

${sliceLines(654, 827)}
`;

// 04_Tahfidz
const tahfidzContent = `/**
 * ============================================================================
 * 04_Tahfidz.gs
 * PPTQ Asnawiyyah Backend Architecture - Modul Tahfidz Al-Qur'an Terintegrasi
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Mutaba'ah & Riwayat Setoran Tahfidz (saveTahfidzLog, deleteTahfidzLog)
 *  - Halaqah Management & Santri Plotting (saveTahfidzHalaqah, saveTahfidzPlotting)
 *  - Target Tahfidz Individu & Bulk Target (saveTahfidzTarget, saveBulkTahfidzTarget)
 *  - Rekap Capaian & Deduplikasi Real-Time (cleanTahfidzCapaianDuplicates)
 *  - Jadwal Sesi Tahfidz Waktu (saveTahfidzSesi, deleteTahfidzSesi)
 *  - Dashboard Agregat Makro & Detail Santri (getTahfidzDashboard, getTahfidzStudentDetail)
 *  - Inisialisasi Sheet & Migrasi Skema Standar Mubarokah (initTahfidzSheets)
 * ============================================================================
 */

${sliceLines(9309, 11737)}
`;

// 05_CMS
const cmsContent = `/**
 * ============================================================================
 * 05_CMS.gs
 * PPTQ Asnawiyyah Backend Architecture - Content Management System & Media
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Berita & Kabar Pondok (CRUD Berita, SEO Slug, View Tracker, Inline Images)
 *  - Hero Banners & Pengumuman Beranda (CRUD Banner, Toggle Status)
 *  - Galeri Kegiatan & YouTube Video Embeds (CRUD Galeri, Toggle Status)
 *  - Pengaturan Profil Pondok & Kontak (getPengaturanData, simpanPengaturan)
 *  - Unit Kegiatan Santri / UKS (CRUD Unit Kegiatan, Toggle Status)
 *  - Notifikasi Pop-up Beranda (CRUD Notifikasi)
 *  - Single Media Upload ke Google Drive (uploadMediaToDrive)
 * ============================================================================
 */

${sliceLines(840, 1359)}

${sliceLines(1537, 1626)}

${sliceLines(1627, 1780)}

${sliceLines(1781, 1955)}

${sliceLines(1956, 2038)}

${sliceLines(2039, 2252)}

${sliceLines(2253, 2396)}

${sliceLines(2397, 2506)}
`;

// 06_MasterData
const masterDataContent = `/**
 * ============================================================================
 * 06_MasterData.gs
 * PPTQ Asnawiyyah Backend Architecture - Master Data Management
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Data Santri (getAllStudentsData, saveStudentData, deleteStudentData,
 *    pencarian NIS/NISN, upload foto santri ke Google Drive)
 *  - Master Data Pegawai / Asatidz / Muhafiz (getAllEmployeesData, saveEmployeeData,
 *    deleteEmployeeData, Sheet Pegawai)
 *  - Data Alumni & Testimoni (saveAlumniData, getAlumniTestimonials)
 *  - Program Data Source v2.0 Repository & Seeder Tooling (ProgramRepository,
 *    DTO transformation, optimistic locking, data migration tooling)
 * ============================================================================
 */

${sliceLines(2599, 3011)}

${sliceLines(3374, 4410)}

${sliceLines(4411, 4546)}

${sliceLines(6444, 6594)}

${sliceLines(7396, 7897)}

${sliceLines(11738, lines.length)}
`;

const MODULES = [
  { file: '00_Config_Security.gs', content: configSecurityContent },
  { file: '01_Router.gs', content: routerContent },
  { file: '02_Auth_RBAC.gs', content: authRbacContent },
  { file: '03_PPDB.gs', content: ppdbContent },
  { file: '04_Tahfidz.gs', content: tahfidzContent },
  { file: '05_CMS.gs', content: cmsContent },
  { file: '06_MasterData.gs', content: masterDataContent }
];

console.log('💾 Validating syntax and writing modular files to legacy/...');
MODULES.forEach(mod => {
  // Validate syntax using vm.Script
  try {
    new vm.Script(mod.content, { filename: mod.file });
  } catch (syntaxErr) {
    console.error(`❌ Syntax validation failed for ${mod.file}:`, syntaxErr.message);
    process.exit(1);
  }

  const filePath = path.join(LEGACY_DIR, mod.file);
  fs.writeFileSync(filePath, mod.content, 'utf8');
  const lineCount = mod.content.split('\n').length;
  console.log(`  ✅ ${mod.file} (${lineCount} lines, ${(Buffer.byteLength(mod.content) / 1024).toFixed(1)} KB)`);
});

// Update legacy/.claspignore
const claspignoreContent = `# Ignore all files by default
**/*

# Whitelist modular Google Apps Script domain files
!00_Config_Security.gs
!01_Router.gs
!02_Auth_RBAC.gs
!03_PPDB.gs
!04_Tahfidz.gs
!05_CMS.gs
!06_MasterData.gs
!appsscript.json
`;

const claspignorePath = path.join(LEGACY_DIR, '.claspignore');
fs.writeFileSync(claspignorePath, claspignoreContent, 'utf8');
console.log('✅ legacy/.claspignore updated with modular whitelist (Index.html and Code.gs removed).');

console.log('\n🎉 Backend successfully modularized into 7 domain files!');
