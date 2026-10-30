/**
 * scripts/run_all_tests.js
 * 
 * Master test runner untuk CI/CD dan local testing:
 *   1. Syntax Check (Frontend JS, API, Backend GS)
 *   2. Modular Backend GAS Execution (scratch/test_modular_backend.js)
 *   3. P0 Security Remediation Tests (scratch/test_p0_security_remediation.js)
 *   4. P1 Session TTL & Token Lifecycle Tests (scratch/test_p1_session_ttl.js)
 *   5. Tahfidz Integration & Advanced Architecture (scratch/comprehensive_test_tahfidz.js)
 *   6. RBAC Matrix & Authority Integration (scratch/final_verify_rbac.js)
 */

const { execSync } = require('child_process');
const path = require('path');

const fs = require('fs');
const ROOT_DIR = path.resolve(__dirname, '..');

const ALL_CANDIDATE_SUITES = [
  { name: 'Syntax Integrity (JS & GS)', file: 'scripts/check_syntax.js', required: true },
  { name: 'Keaktifan Asatidz RBAC & Deadline Verification', file: 'scripts/test_keaktifan.js', required: true },
  { name: 'RBAC 21-Modules Permissions Matrix Suite', file: 'scripts/test_roles_matrix.js', required: true },
  { name: 'Modul 20: Izin Santri & Perpulangan Suite', file: 'scripts/test_perpulangan.js', required: true },
  { name: 'Modul 20: Auto-Resolving Santri & NIS Suite', file: 'scripts/test_perpulangan_auto_resolve.js', required: true },
  { name: 'Modul 20: Approval Notif & Web Audio Chime Suite', file: 'scripts/test_perpulangan_approval_notification.js', required: true },
  { name: 'Redesain Portal Berita NU Online Suite', file: 'scripts/test_nu_news_portal.js', required: true },
  { name: 'Wali Santri Quick Login (NIS & PIN) Suite', file: 'scripts/test_parent_quick_login.js', required: true },
  { name: 'Wali Santri Belum Terhubung & Follow-Up WA Suite', file: 'scripts/test_wali_unlinked.js', required: true },
  { name: 'Tahfidz 30-Juz Curriculum & Program Flow Suite', file: 'scripts/test_curriculum_programs.js', required: true },
  { name: 'Master Data Santri: Kelas & Sekolah Suite', file: 'scripts/test_student_class_school.js', required: true },
  { name: 'Kompas Kiblat & Falak Geodesi Verification', file: 'scripts/test_kiblat_compass.js', required: true },
  { name: 'Izin Asatidz & Badal Backend Suite', file: 'scripts/test_izin_asatidz_backend.js', required: true },
  { name: 'Izin Asatidz & Badal Frontend Form Suite', file: 'scripts/test_izin_asatidz_frontend.js', required: true },
  { name: 'P0 Security Remediation Suite', file: 'scripts/test_p0_security_remediation.js', required: true },
  { name: 'P1 Session TTL & Security Expiry Suite', file: 'scripts/test_p1_session_ttl.js', required: true },
  { name: 'Server-Side Supabase Replicator Suite', file: 'scripts/test_backend_replication.js', required: true },
  { name: 'Modular Apps Script Backend Verification', file: 'scratch/test_modular_backend.js', required: false },
  { name: 'Tahfidz Al-Quran Advanced Integration Suite', file: 'scratch/comprehensive_test_tahfidz.js', required: false },
  { name: 'RBAC Matrix & Authority Pipeline Suite', file: 'scratch/final_verify_rbac.js', required: false }
];

console.log('🚀 ========================================================');
console.log('   PPTQ ASNAWIYYAH AUTOMATED TEST RUNNER (CI/CD)');
console.log('   ========================================================\n');

let failedSuites = 0;
let missingSuites = 0;
const results = [];

for (const suite of ALL_CANDIDATE_SUITES) {
  const fullPath = path.join(ROOT_DIR, suite.file);
  if (!fs.existsSync(fullPath)) {
    console.log(`\n⚠️  [SKIPPED - FILE NOT FOUND] ${suite.name} (${suite.file})`);
    results.push({ name: suite.name, status: 'SKIPPED', duration: '-', note: 'File not found' });
    if (suite.required) {
      failedSuites++;
    } else {
      missingSuites++;
    }
    continue;
  }

  console.log(`\n▶️  RUNNING: ${suite.name}...`);
  const startTime = Date.now();
  try {
    const output = execSync(`node ${suite.file}`, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [PASS] ${suite.name} (${duration}s)`);
    results.push({ name: suite.name, status: 'PASS', duration: `${duration}s` });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ [FAIL] ${suite.name} (${duration}s)`);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    failedSuites++;
    results.push({ name: suite.name, status: 'FAIL', duration: `${duration}s` });
  }
}

console.log('\n📊 ========================================================');
console.log('   TEST EXECUTION SUMMARY');
console.log('   ========================================================');
results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : (r.status === 'SKIPPED' ? '⚠️' : '❌');
  console.log(`  ${icon} ${r.status.padEnd(7)} | ${r.duration.padStart(6)} | ${r.name}${r.note ? ` (${r.note})` : ''}`);
});
console.log('--------------------------------------------------------');

if (failedSuites > 0) {
  console.error(`❌ ${failedSuites} test suite(s) failed. Build rejected.`);
  process.exit(1);
} else if (missingSuites > 0) {
  console.log(`⚠️  ALL EXISTING SUITES PASSED (${results.filter(r => r.status === 'PASS').length}), but ${missingSuites} scratch/optional suite(s) were missing.`);
  process.exit(0);
} else {
  console.log('🎉 ALL TEST SUITES PASSED! Codebase is ready for production merge.');
  process.exit(0);
}
