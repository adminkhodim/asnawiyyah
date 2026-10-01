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

const ROOT_DIR = path.resolve(__dirname, '..');

const SUITES = [
  { name: 'Syntax Integrity (JS & GS)', cmd: 'node scripts/check_syntax.js' },
  { name: 'Modular Apps Script Backend Verification', cmd: 'node scratch/test_modular_backend.js' },
  { name: 'P0 Security Remediation Suite', cmd: 'node scratch/test_p0_security_remediation.js' },
  { name: 'P1 Session TTL & Security Expiry Suite', cmd: 'node scratch/test_p1_session_ttl.js' },
  { name: 'Tahfidz Al-Quran Advanced Integration Suite', cmd: 'node scratch/comprehensive_test_tahfidz.js' },
  { name: 'RBAC Matrix & Authority Pipeline Suite', cmd: 'node scratch/final_verify_rbac.js' }
];

console.log('🚀 ========================================================');
console.log('   PPTQ ASNAWIYYAH AUTOMATED TEST RUNNER (CI/CD)');
console.log('   ========================================================\n');

let failedSuites = 0;
const results = [];

for (const suite of SUITES) {
  console.log(`\n▶️  RUNNING: ${suite.name}...`);
  const startTime = Date.now();
  try {
    const output = execSync(suite.cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe' });
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
  const icon = r.status === 'PASS' ? '✅' : '❌';
  console.log(`  ${icon} ${r.status.padEnd(6)} | ${r.duration.padStart(6)} | ${r.name}`);
});
console.log('--------------------------------------------------------');

if (failedSuites > 0) {
  console.error(`❌ ${failedSuites} test suite(s) failed. Build rejected.`);
  process.exit(1);
} else {
  console.log('🎉 ALL TEST SUITES PASSED! Codebase is ready for production merge.');
  process.exit(0);
}
