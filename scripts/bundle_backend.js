/**
 * scripts/bundle_backend.js
 * 
 * Re-bundles the 7 modular .gs files in legacy/ into a single Code.gs if needed
 * for legacy test harnesses or single-file verification.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LEGACY_DIR = path.join(ROOT_DIR, 'legacy');
const CODE_GS_PATH = path.join(LEGACY_DIR, 'Code.gs');

const MODULAR_FILES = [
  '00_Config_Security.gs',
  '01_Router.gs',
  '02_Auth_RBAC.gs',
  '03_PPDB.gs',
  '04_Tahfidz.gs',
  '05_CMS.gs',
  '06_MasterData.gs',
  '07_Kedisiplinan.gs'
];

console.log('🔄 Bundling modular backend files in alphabetical order...');
let combined = '/**\n * BUNDLED PPTQ ASNAWIYYAH BACKEND (AUTO-GENERATED)\n * Generated from modular domain files in legacy/\n */\n\n';

for (const file of MODULAR_FILES) {
  const filePath = path.join(LEGACY_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Modular file missing: ${file}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  combined += `\n// >>>>>>>>>>>>>>>>>> BEGIN FILE: ${file} <<<<<<<<<<<<<<<<<<\n\n`;
  combined += content;
  combined += `\n// >>>>>>>>>>>>>>>>>> END FILE: ${file} <<<<<<<<<<<<<<<<<<\n\n`;
  console.log(`  ➕ Bundled ${file}`);
}

fs.writeFileSync(CODE_GS_PATH, combined, 'utf8');
console.log(`✅ Successfully generated ${CODE_GS_PATH} (${combined.split('\n').length} lines)`);
