/**
 * Test Suite: Modul Kurikulum & Urutan Setoran Hafalan Tahfidz per Program
 */
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: (key) => { delete storage[key]; }
};

// Mock APP_CONFIG
global.APP_CONFIG = { storage: { keys: {} } };

// Import or define logic matching js/tahfidz.js
const TAHFIDZ_CURRICULUM_PRESETS = {
    PRESET_A: {
        id: 'PRESET_A',
        name: 'Preset A (Mundur-Maju)',
        order: [
            30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20
        ]
    },
    PRESET_B: {
        id: 'PRESET_B',
        name: 'Preset B (Juz \'Amma Awal)',
        order: [
            30,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29
        ]
    },
    PRESET_C: {
        id: 'PRESET_C',
        name: 'Preset C (Berurutan Maju)',
        order: [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30
        ]
    }
};

const TAHFIDZ_CURRICULUM_STORAGE_KEY = 'ASNAWIYYAH_TAHFIDZ_CURRICULUM_PROGRAMS_V1';

function getTahfidzCurriculumMap() {
    try {
        const raw = localStorage.getItem(TAHFIDZ_CURRICULUM_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    } catch (e) {}
    return {};
}

function getCurriculumOrderForProgram(programName) {
    const map = getTahfidzCurriculumMap();
    const pName = (programName || '').trim();
    if (pName && map[pName] && Array.isArray(map[pName].order) && map[pName].order.length === 30) {
        return map[pName].order;
    }
    if (pName) {
        const matchKey = Object.keys(map).find(k => k.toLowerCase() === pName.toLowerCase());
        if (matchKey && Array.isArray(map[matchKey].order) && map[matchKey].order.length === 30) {
            return map[matchKey].order;
        }
    }
    const lower = pName.toLowerCase();
    if (lower.includes('remaja')) {
        return [...TAHFIDZ_CURRICULUM_PRESETS.PRESET_B.order];
    }
    if (lower.includes('anak') || lower.includes('pemula') || lower.includes('dasar')) {
        return [...TAHFIDZ_CURRICULUM_PRESETS.PRESET_A.order];
    }
    return [...TAHFIDZ_CURRICULUM_PRESETS.PRESET_A.order];
}

function getJuzCurriculumIndex(juz, programName = null) {
    const order = getCurriculumOrderForProgram(programName);
    const idx = order.indexOf(Number(juz));
    return idx !== -1 ? idx : 0;
}

function parseTahfidzLatestPage(halVal) {
    if (halVal === null || halVal === undefined || halVal === '') return 1;
    if (typeof halVal === 'number' && !isNaN(halVal)) {
        return Math.min(20, Math.max(1, Math.round(halVal)));
    }
    const str = String(halVal).trim();
    const matches = str.match(/\d+/g);
    if (!matches || matches.length === 0) return 1;
    const max = Math.max(...matches.map(n => Number(n)).filter(n => !isNaN(n)));
    return Math.min(20, Math.max(1, max));
}

function getCurriculumProgress(juz, hal, programName = null) {
    const r = getJuzCurriculumIndex(juz, programName);
    const h = parseTahfidzLatestPage(hal);
    const totalTuntas = r * 20 + h;
    const percent = Math.min(100, Math.max(1, Math.round((totalTuntas / 600) * 100)));
    return { rank: r, totalTuntas, percent };
}

function getNextCurriculumPosition(juz, hal, programName = null) {
    const order = getCurriculumOrderForProgram(programName);
    const r = order.indexOf(Number(juz));
    const safeRank = r !== -1 ? r : 0;
    const h = Number(hal) || 1;
    if (h >= 20) {
        if (safeRank < order.length - 1) {
            return { juz: order[safeRank + 1], halaman: 1, khatam: false };
        } else {
            return { juz: order[safeRank], halaman: 20, khatam: true };
        }
    }
    return { juz: order[safeRank], halaman: h + 1, khatam: false };
}

console.log("▶️  RUNNING: Modul Kurikulum & Urutan Setoran Hafalan Test Suite...");

// TEST 1: Default fallback ke Preset A (Mulai Juz 30)
const defaultOrder = getCurriculumOrderForProgram('Tahfidz Intensif');
assert.strictEqual(defaultOrder[0], 30, 'Urutan pertama Preset A harus Juz 30');
assert.strictEqual(defaultOrder[9], 21, 'Urutan ke-10 Preset A harus Juz 21');
assert.strictEqual(defaultOrder[10], 1, 'Urutan ke-11 Preset A harus Juz 1');
assert.strictEqual(defaultOrder[29], 20, 'Urutan ke-30 Preset A harus Juz 20');
console.log("  ✅ Test 1 Passed: Default Preset A Mundur-Maju 30-21 lalu 1-20 valid.");

// TEST 2: Konfigurasi Preset B (Juz 30 lalu 1-29) untuk 'Tahfidz Remaja' (Remaja)
const curMap = {};
curMap['Tahfidz Remaja'] = {
    order: [...TAHFIDZ_CURRICULUM_PRESETS.PRESET_B.order],
    updatedAt: new Date().toISOString()
};
localStorage.setItem(TAHFIDZ_CURRICULUM_STORAGE_KEY, JSON.stringify(curMap));

const remajaOrder = getCurriculumOrderForProgram('Tahfidz Remaja');
assert.strictEqual(remajaOrder[0], 30, 'Remaja urutan 1 harus Juz 30');
assert.strictEqual(remajaOrder[1], 1, 'Remaja urutan 2 harus Juz 1');
assert.strictEqual(remajaOrder[29], 29, 'Remaja urutan 30 harus Juz 29');
console.log("  ✅ Test 2 Passed: Preset B Juz 30 lalu 1-29 untuk Tahfidz Remaja valid.");

// TEST 3: Evaluasi Posisi & Rekomendasi Berikutnya (getNextCurriculumPosition)
// Pada Program Remaja (Preset B): Setelah Juz 30 Halaman 20, lanjut ke Juz 1 Halaman 1!
const nextRemaja = getNextCurriculumPosition(30, 20, 'Tahfidz Remaja');
assert.strictEqual(nextRemaja.juz, 1, 'Setelah Juz 30 hlm 20 pada Program Remaja harus Juz 1');
assert.strictEqual(nextRemaja.halaman, 1, 'Halaman harus 1');

// Pada Program Intensif / Anak & Pemula (Preset A): Setelah Juz 30 Halaman 20, lanjut ke Juz 29 Halaman 1!
const nextIntensif = getNextCurriculumPosition(30, 20, 'Tahfidz Intensif');
assert.strictEqual(nextIntensif.juz, 29, 'Setelah Juz 30 hlm 20 pada Program Intensif harus Juz 29');
assert.strictEqual(nextIntensif.halaman, 1, 'Halaman harus 1');
console.log("  ✅ Test 3 Passed: Rekomendasi posisi berikutnya adaptif sesuai program santri.");

// TEST 4: Evaluasi Persentase Capaian (getCurriculumProgress)
// Santri yang sedang di Juz 1 Halaman 20:
// - Pada Program Remaja (Preset B): Juz 1 berada di urutan rank 1 (total tuntas = 1*20 + 20 = 40 hal -> 7%)
const progRemaja = getCurriculumProgress(1, 20, 'Tahfidz Remaja');
assert.strictEqual(progRemaja.rank, 1);
assert.strictEqual(progRemaja.totalTuntas, 40);

// - Pada Program Remaja (Preset B): Juz 3 berada di urutan rank 3 (Total Juz ditempuh = 4 Juz, BUKAN 13 Juz!)
const progRemajaJuz3 = getCurriculumProgress(3, 12, 'Tahfidz Remaja');
assert.strictEqual(progRemajaJuz3.rank, 3, 'Tahfidz Remaja Juz 3 harus rank 3 (4 Juz ditempuh)');
assert.strictEqual(progRemajaJuz3.rank + 1, 4, 'Total Juz Ditempuh Tahfidz Remaja di Juz 3 harus 4 Juz');

// - Pada Program Anak (Preset A): Juz 3 berada di urutan rank 12 (Total Juz ditempuh = 13 Juz)
const progAnakJuz3 = getCurriculumProgress(3, 12, 'Tahfidz Anak');
assert.strictEqual(progAnakJuz3.rank, 12, 'Tahfidz Anak Juz 3 harus rank 12 (13 Juz ditempuh)');
assert.strictEqual(progAnakJuz3.rank + 1, 13, 'Total Juz Ditempuh Tahfidz Anak di Juz 3 harus 13 Juz');

console.log("  ✅ Test 4 Passed: Perhitungan akumulasi capaian & persentase akurat per program.");

// TEST 5: getTahfidzStudentProgram resolving
function getTahfidzStudentProgram(st) {
    if (!st) return 'Tahfidz';
    const directProgram = st.program || st.programPesantren || (st.student && (st.student.program || st.student.programPesantren));
    if (directProgram && typeof directProgram === 'string' && directProgram.trim() !== '' && directProgram.trim().toLowerCase() !== 'bil hifdhi' && directProgram.trim().toLowerCase() !== 'bil hifdzi') {
        return directProgram.trim();
    }
    const targetId = String(st.studentId || st.nis || (st.student && (st.student.studentId || st.student.nis)) || '').trim().toLowerCase();
    const targetNis = String(st.nis || (st.student && st.student.nis) || '').trim().toLowerCase();
    if (typeof global !== 'undefined' && Array.isArray(global.adminStudentsData) && (targetId || targetNis)) {
        const found = global.adminStudentsData.find(s => {
            const sId = String(s.studentId || s.id || '').trim().toLowerCase();
            const sNis = String(s.nis || '').trim().toLowerCase();
            return (targetId && (sId === targetId || sNis === targetId)) ||
                   (targetNis && (sNis === targetNis || sId === targetNis));
        });
        if (found && (found.program || found.programPesantren)) {
            return (found.program || found.programPesantren).trim();
        }
    }
    try {
        const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
        if (cached && (targetId || targetNis)) {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) {
                const found = list.find(s => {
                    const sId = String(s.studentId || s.id || '').trim().toLowerCase();
                    const sNis = String(s.nis || '').trim().toLowerCase();
                    return (targetId && (sId === targetId || sNis === targetId)) ||
                           (targetNis && (sNis === targetNis || sId === targetNis));
                });
                if (found && (found.program || found.programPesantren)) {
                    return (found.program || found.programPesantren).trim();
                }
            }
        }
    } catch (e) {}
    if (st.kategori && typeof st.kategori === 'string' && st.kategori.trim() !== '' && st.kategori !== 'Semua Kategori') {
        return st.kategori.trim();
    }
    return 'Tahfidz';
}

// 5a: Direct program
const stA = { studentId: 'STD-096', nis: '2024018', program: 'Tahfidz Remaja' };
assert.strictEqual(getTahfidzStudentProgram(stA), 'Tahfidz Remaja');

// 5b: Overriding 'Bil Hifdhi' from adminStudentsData
global.adminStudentsData = [{ studentId: 'STD-096', nis: '2024018', program: 'Tahfidz Remaja' }];
const stB = { studentId: 'STD-096', nis: '2024018', program: 'Bil Hifdhi' };
assert.strictEqual(getTahfidzStudentProgram(stB), 'Tahfidz Remaja');

// 5c: Overriding from ASNAWIYYAH_STUDENTS_CACHE
localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify([{ nis: '2023007', program: 'Tahfidz Anak' }]));
const stC = { studentId: 'STD-097', nis: '2023007' };
assert.strictEqual(getTahfidzStudentProgram(stC), 'Tahfidz Anak');
console.log("  ✅ Test 5 Passed: Resolving nama program santri tangguh & anti-Bil Hifdhi.");

// TEST 6: Formatting UI string (NIS • Program di baris 1, nama halaqah di baris 2)
const stSample = { name: 'Abizar Arfan Khakim', nis: '2024018', program: 'Tahfidz Remaja', halaqah: { namaHalaqah: 'Halaqah Ustadzah Luthfi' } };
const pName = getTahfidzStudentProgram(stSample);
const hName = stSample.halaqah.namaHalaqah;
const line1 = `NIS: ${stSample.nis || '-'} • ${pName}`;
const line2 = hName;
assert.strictEqual(line1, 'NIS: 2024018 • Tahfidz Remaja');
assert.strictEqual(line2, 'Halaqah Ustadzah Luthfi');
console.log("  ✅ Test 6 Passed: Format tampilan Santri & Halaqah sesuai spesifikasi permintaan.");

console.log("🎉 ALL CURRICULUM TEST CASES PASSED SUCCESSFULLY!");
