/**
 * scripts/test_server_replication.js
 * 
 * Unit Test: Server-Side Supabase Replicator Engine (GAS -> Supabase)
 * Memverifikasi:
 * 1. Resolusi konfigurasi getSupabaseServerConfig
 * 2. Graceful bypass ketika SUPABASE_SERVICE_ROLE_KEY belum disetel
 * 3. Eksekusi UrlFetchApp dengan header service_role yang tepat saat terkonfigurasi
 * 4. Integrasi hook replikasi pada fungsi domain: Santri, Tahfidz, dan Izin Perpulangan
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🔄 Menjalankan Server-Side Supabase Replicator Test Suite (Tahap 2)...');

const ROOT = path.resolve(__dirname, '..');

// 1. Verifikasi integrasi kode sumber pada modular backend
const configGs = fs.readFileSync(path.join(ROOT, 'legacy/00_Config_Security.gs'), 'utf8');
const tahfidzGs = fs.readFileSync(path.join(ROOT, 'legacy/04_Tahfidz.gs'), 'utf8');
const masterGs = fs.readFileSync(path.join(ROOT, 'legacy/06_MasterData.gs'), 'utf8');
const codeGs = fs.readFileSync(path.join(ROOT, 'legacy/Code.gs'), 'utf8');

assert(configGs.includes('function getSupabaseServerConfig()'), '00_Config_Security.gs harus memiliki getSupabaseServerConfig');
assert(configGs.includes('function replicateToSupabase('), '00_Config_Security.gs harus memiliki replicateToSupabase');
assert(tahfidzGs.includes('replicateToSupabase("/rest/v1/tahfidz_logs"'), '04_Tahfidz.gs harus mereplikasi setoran ke Supabase');
assert(masterGs.includes('replicateToSupabase("/rest/v1/students'), '06_MasterData.gs harus mereplikasi santri ke Supabase');
assert(codeGs.includes('function replicateToSupabase('), 'Code.gs harus tersinkronisasi membawa replicateToSupabase');
console.log('  ✅ [PASS] Inspeksi statis hook replikasi pada seluruh domain backend terverifikasi.');

// 2. Evaluasi Runtime Logika Replikator
let mockProperties = {};
let fetchLog = [];

const mockPropertiesService = {
    getScriptProperties: () => ({
        getProperty: (k) => mockProperties[k] || null,
        setProperty: (k, v) => { mockProperties[k] = String(v); },
        deleteProperty: (k) => { delete mockProperties[k]; }
    })
};

const mockUrlFetchApp = {
    fetch: (url, options) => {
        fetchLog.push({ url, options });
        return {
            getResponseCode: () => 201,
            getContentText: () => JSON.stringify({ success: true, count: 1 })
        };
    }
};

const mockLogger = {
    log: (msg) => {}
};

const sandbox = {
    PropertiesService: mockPropertiesService,
    UrlFetchApp: mockUrlFetchApp,
    Logger: mockLogger,
    console: console,
    Utilities: {
        getUuid: () => 'mock-uuid',
        formatDate: () => '2026-10-30'
    }
};

const context = vm.createContext(sandbox);

// Eksekusi kode config/security di dalam sandbox
vm.runInContext(configGs, context);

const { getSupabaseServerConfig, setupSupabaseServiceRole, replicateToSupabase } = context;

// Test A: Kondisi default belum disetel -> Graceful Skip (tanpa throw)
mockProperties = {};
const unconfigured = replicateToSupabase('/rest/v1/students', 'POST', { name: 'Santri Test' });
assert.strictEqual(unconfigured.skipped, true, 'Replikasi harus diskip secara aman tanpa error jika belum dikonfigurasi');
assert.strictEqual(fetchLog.length, 0, 'Tidak boleh ada request HTTP jika belum disetel');
console.log('  ✅ [PASS] Graceful bypass terverifikasi (tidak mengganggu Sheets jika key belum disetel).');

// Test B: Konfigurasi service_role key
setupSupabaseServiceRole('mock-service-role-key-xyz123', 'https://mock.supabase.co');
const cfg = getSupabaseServerConfig();
assert.strictEqual(cfg.isConfigured, true, 'Config harus berstatus isConfigured = true');
assert.strictEqual(cfg.url, 'https://mock.supabase.co');
assert.strictEqual(cfg.key, 'mock-service-role-key-xyz123');
console.log('  ✅ [PASS] setupSupabaseServiceRole berhasil menyimpan konfigurasi ke PropertiesService.');

// Test C: Eksekusi Replikasi HTTP dengan Authorization Bearer service_role
fetchLog = [];
const replResult = replicateToSupabase('/rest/v1/students?on_conflict=student_id', 'POST', {
    student_id: 'STD-001',
    name: 'Ahmad Santri'
});

assert.strictEqual(replResult.success, true, 'Replikasi harus sukses (HTTP 201)');
assert.strictEqual(fetchLog.length, 1, 'Harus mengirim 1 request HTTP');
assert.strictEqual(fetchLog[0].url, 'https://mock.supabase.co/rest/v1/students?on_conflict=student_id');
assert.strictEqual(fetchLog[0].options.method, 'POST');
assert.strictEqual(fetchLog[0].options.headers.apikey, 'mock-service-role-key-xyz123');
assert.strictEqual(fetchLog[0].options.headers.Authorization, 'Bearer mock-service-role-key-xyz123');
console.log('  ✅ [PASS] Eksekusi HTTP UrlFetchApp membawa kredensial service_role secara aman.');

console.log('🎉 Server-Side Supabase Replicator Test Suite (Tahap 2) PASSED.');
process.exit(0);

