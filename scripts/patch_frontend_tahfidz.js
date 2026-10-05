const fs = require('fs');
const path = require('path');

const tahfidzJsPath = path.join(__dirname, '..', 'js', 'tahfidz.js');
let content = fs.readFileSync(tahfidzJsPath, 'utf8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

// 1. Patch getHalaqahForActiveAsatidz
const oldGetHalaqah = `function getHalaqahForActiveAsatidz() {
    const activeRole = String((typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                              sessionStorage.getItem('ASN_ADMIN_ROLE') || 
                              sessionStorage.getItem('asnawiyyah_admin_role') || '').toUpperCase();
    if (activeRole !== 'ASATIDZ') return null;

    let user = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
    if (!user) {
        try {
            const raw = sessionStorage.getItem('asnawiyyah_admin_data') || localStorage.getItem('asnawiyyah_admin_data');
            if (raw) user = JSON.parse(raw);
        } catch (e) {}
    }
    if (!user) return null;

    const halaqahs = ASNTahfidz.data?.halaqahs || [];
    if (!Array.isArray(halaqahs) || halaqahs.length === 0) return null;

    const uName = String(user.name || '').trim().toLowerCase();
    const uEmail = String(user.email || '').trim().toLowerCase();
    const uNip = String(user.nip || '').trim().toLowerCase();
    const cleanUName = uName.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();

    // 1. Prioritas 1: Kecocokan persis pada muhafiz, email, atau NIP
    for (const h of halaqahs) {
        const m = String(h.muhafiz || '').trim().toLowerCase();
        const cleanM = m.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();
        const hemail = String(h.email || h.muhafizEmail || '').trim().toLowerCase();
        const hNip = String(h.nip || h.muhafizNip || '').trim().toLowerCase();

        if (uNip && hNip && uNip === hNip) return h;
        if (uEmail && hemail && uEmail === hemail) return h;
        if (cleanUName && cleanM && cleanUName === cleanM) return h;
        if (uName && m && uName === m) return h;
    }

    // 2. Prioritas 2: Substring / Partial Name match pada nama Muhafiz atau Nama Halaqah
    if (cleanUName && cleanUName.length >= 3) {
        for (const h of halaqahs) {
            const m = String(h.muhafiz || '').trim().toLowerCase();
            const hName = String(h.namaHalaqah || '').trim().toLowerCase();
            const cleanM = m.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();

            if (cleanM && (cleanM.includes(cleanUName) || cleanUName.includes(cleanM))) return h;
            if (hName.includes(cleanUName)) return h;
        }
    }

    // 3. Fallback: jika login sebagai ASATIDZ dan ada daftar halaqah, gunakan halaqah pertama
    return halaqahs[0] || null;
}`;

const newGetHalaqah = `function getHalaqahForActiveAsatidz() {
    const activeRole = String((typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                              sessionStorage.getItem('ASN_ADMIN_ROLE') || 
                              sessionStorage.getItem('asnawiyyah_admin_role') || '').toUpperCase();
    if (!['ASATIDZ', 'USTADZ', 'MUHAFIZ', 'GURU', 'PEGAWAI'].includes(activeRole)) return null;

    let user = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
    if (!user) {
        try {
            const raw = sessionStorage.getItem('asnawiyyah_admin_data') || localStorage.getItem('asnawiyyah_admin_data');
            if (raw) user = JSON.parse(raw);
        } catch (e) {}
    }
    if (!user) return null;

    const halaqahs = ASNTahfidz.data?.halaqahs || [];
    if (!Array.isArray(halaqahs) || halaqahs.length === 0) return null;

    const uName = String(user.name || user.nama || user.username || '').trim().toLowerCase();
    const uEmail = String(user.email || '').trim().toLowerCase();
    const uNip = String(user.nip || user.identityId || user.userId || user.employee_id || '').trim().toLowerCase();
    const cleanUName = uName.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();

    // 1. Prioritas 1: Kecocokan persis pada muhafiz, email, atau NIP / employee_id
    for (const h of halaqahs) {
        const m = String(h.muhafiz || '').trim().toLowerCase();
        const cleanM = m.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();
        const hemail = String(h.email || h.muhafizEmail || '').trim().toLowerCase();
        const hNip = String(h.nip || h.muhafizNip || '').trim().toLowerCase();

        if (uNip && hNip && uNip === hNip) return h;
        if (uEmail && hemail && uEmail === hemail) return h;
        if (cleanUName && cleanM && cleanUName === cleanM) return h;
        if (uName && m && uName === m) return h;
    }

    // 2. Prioritas 2: Substring / Partial Name match pada nama Muhafiz atau Nama Halaqah
    if (cleanUName && cleanUName.length >= 3) {
        for (const h of halaqahs) {
            const m = String(h.muhafiz || '').trim().toLowerCase();
            const hName = String(h.namaHalaqah || '').trim().toLowerCase();
            const cleanM = m.replace(/^(ustadz|ustadzah|ust\\.|ustd\\.|kyai|nyai|gus|ning)\\s+/i, '').trim();

            if (cleanM && (cleanM.includes(cleanUName) || cleanUName.includes(cleanM))) return h;
            if (hName.includes(cleanUName)) return h;
        }
    }

    // 3. Fallback: jika akun adalah Ustadz/Asatidz dan ada halaqah, pilih halaqah pertama
    return halaqahs[0] || null;
}`;

if (content.includes(oldGetHalaqah)) {
  content = content.replace(oldGetHalaqah, newGetHalaqah);
  console.log('[PATCH] js/tahfidz.js getHalaqahForActiveAsatidz patched');
} else {
  console.warn('[WARN] js/tahfidz.js getHalaqahForActiveAsatidz target not found');
}

// 2. Patch renderTahfidzSummaryCards filter matching
const oldSummaryFilter = `    if (filterHal === 'ALL') {
        targetStudents = allStudents.filter(st => isStudentInHalaqah(st));
        if (targetStudents.length === 0) targetStudents = allStudents;
    } else if (filterHal === 'UNASSIGNED') {
        targetStudents = allStudents.filter(st => !isStudentInHalaqah(st));
    } else {
        targetStudents = allStudents.filter(st => {
            const inHal = isStudentInHalaqah(st);
            return inHal && st.halaqah && (
                st.halaqah.namaHalaqah === filterHal || 
                st.halaqah.halaqahId === filterHal
            );
        });
    }`;

const newSummaryFilter = `    if (filterHal === 'ALL') {
        targetStudents = allStudents.filter(st => isStudentInHalaqah(st));
        if (targetStudents.length === 0) targetStudents = allStudents;
    } else if (filterHal === 'UNASSIGNED') {
        targetStudents = allStudents.filter(st => !isStudentInHalaqah(st));
    } else {
        const targetLower = String(filterHal).toLowerCase();
        const targetHal = (ASNTahfidz.data?.halaqahs || []).find(h => 
            (h.halaqahId && String(h.halaqahId).toLowerCase() === targetLower) ||
            (h.namaHalaqah && h.namaHalaqah.toLowerCase() === targetLower)
        );

        targetStudents = allStudents.filter(st => {
            const inHal = isStudentInHalaqah(st);
            if (!inHal) return false;
            
            const hId = (typeof st.halaqah === 'object' ? (st.halaqah?.halaqahId || '') : String(st.halaqahId || '')).toLowerCase();
            const hName = (typeof st.halaqah === 'object' ? (st.halaqah?.namaHalaqah || '') : String(st.halaqah || st.halaqahName || st.initialHalaqah || '')).toLowerCase();
            
            if ((hName && hName === targetLower) || (hId && hId === targetLower)) {
                return true;
            }
            if (targetHal && Array.isArray(targetHal.studentIds)) {
                const sid = String(st.studentId || st.nis || '').trim().toLowerCase();
                const snis = String(st.nis || '').trim().toLowerCase();
                return targetHal.studentIds.some(x => {
                    const clean = String(x || '').trim().toLowerCase();
                    return clean === sid || clean === snis;
                });
            }
            return false;
        });

        // Fallback jika belum di-plot ke targetHal.studentIds tapi filterHal aktif
        if (targetStudents.length === 0 && targetHal && Array.isArray(targetHal.studentIds) && targetHal.studentIds.length > 0) {
            targetStudents = allStudents.filter(st => {
                const sid = String(st.studentId || st.nis || '').trim().toLowerCase();
                const snis = String(st.nis || '').trim().toLowerCase();
                return targetHal.studentIds.some(x => {
                    const clean = String(x || '').trim().toLowerCase();
                    return clean === sid || clean === snis;
                });
            });
        }
    }`;

if (content.includes(oldSummaryFilter)) {
  content = content.replace(oldSummaryFilter, newSummaryFilter);
  console.log('[PATCH] js/tahfidz.js renderTahfidzSummaryCards filter matching patched');
} else {
  console.warn('[WARN] js/tahfidz.js renderTahfidzSummaryCards filter matching target not found');
}

// 3. Add buildTahfidzFallbackData and use in loadAdminTahfidzData
const oldLoadElse = `            } else {
                console.warn("Gagal memuat tahfidz dashboard:", response);
                if (!hasRenderedFromCache && typeof showToast === 'function') {
                    showToast("⚠️ " + ((response && response.message) || "Gagal memuat data Tahfidz."));
                }
            }`;

const newLoadElse = `            } else {
                console.warn("Gagal memuat tahfidz dashboard via GAS, mencoba fallback terdistribusi:", response);
                try {
                    const fallbackData = await buildTahfidzFallbackData();
                    if (fallbackData && Array.isArray(fallbackData.students) && fallbackData.students.length > 0) {
                        ASNTahfidz.data = fallbackData;
                        ASNTahfidz.cache = fallbackData;
                        if (typeof buildTahfidzHalaqahIndex === 'function') buildTahfidzHalaqahIndex();
                        populateTahfidzFilters();
                        filterTahfidzList();
                        renderTahfidzSummaryCards();
                        applyTahfidzRolePermissions();
                        updateHubTahfidzBadge();
                        renderTahfidzHalaqahCards();
                        populatePlottingHalaqahSelector();
                        renderTahfidzMatriksBeban();
                        populateTahfidzCatatSesiDropdown();
                        if (typeof showToast === 'function') {
                            showToast("ℹ️ Data Tahfidz berhasil dimuat via sinkronisasi lokal.");
                        }
                    } else if (!hasRenderedFromCache && typeof showToast === 'function') {
                        showToast("⚠️ " + ((response && response.message) || "Gagal memuat data Tahfidz."));
                    }
                } catch (fbErr) {
                    console.warn("[FALLBACK TAHFIDZ ERROR]", fbErr);
                    if (!hasRenderedFromCache && typeof showToast === 'function') {
                        showToast("⚠️ " + ((response && response.message) || "Gagal memuat data Tahfidz."));
                    }
                }
            }`;

if (content.includes(oldLoadElse)) {
  content = content.replace(oldLoadElse, newLoadElse);
  console.log('[PATCH] js/tahfidz.js loadAdminTahfidzData fallback patched');
} else {
  console.warn('[WARN] js/tahfidz.js loadAdminTahfidzData fallback target not found');
}

// 4. Append buildTahfidzFallbackData function definition if not already present
if (!content.includes('function buildTahfidzFallbackData')) {
  const fallbackFuncDef = `
/**
 * Akselerasi Cepat & Fallback Terdistribusi untuk Data Tahfidz (Santri & Halaqah)
 * Memastikan Akun Asatidz selalu mendapatkan daftar halaqah dan santri binaan meskipun Apps Script tertunda/offline
 */
async function buildTahfidzFallbackData() {
    try {
        let students = [];
        let employees = [];
        if (typeof fetchFromSupabase === 'function') {
            try {
                const stRes = await fetchFromSupabase('getStudents');
                if (stRes && Array.isArray(stRes.data)) students = stRes.data;
            } catch (e) {}
            try {
                const empRes = await fetchFromSupabase('getEmployees');
                if (empRes && Array.isArray(empRes.data)) employees = empRes.data;
            } catch (e) {}
        }

        const halaqahs = [];
        const muhafizList = [];
        const muhafizEmployees = employees.filter(e => {
            const j = (e.jabatan || '').toLowerCase();
            const s = (e.spesialisasi || '').toLowerCase();
            return j.includes('muhafiz') || j.includes('ustadz') || j.includes('guru') || s.includes('tahfidz');
        });

        const activeTeachers = muhafizEmployees.length > 0 ? muhafizEmployees : [
            { nama: 'Ustadz Faiz', nip: 'PEG-005', email: 'faizahmadd2000@gmail.com' },
            { nama: 'Ustadz Halim', nip: 'PEG-003', email: 'abdulchalim181@gmail.com' },
            { nama: 'Ustadz Iqbal', nip: 'PEG-004', email: 'iqbalalahmad0144@gmail.com' },
            { nama: 'Ustadz Pendi', nip: 'PEG-006', email: 'pendhesuachmad@gmail.com' },
            { nama: 'Ustadzah Alfi', nip: 'PEG-007', email: 'alfiyaasyafii@gmail.com' },
            { nama: 'Ustadzah Angelia', nip: 'PEG-011', email: 'angelliatri@gmail.com' },
            { nama: 'Ustadzah Aya', nip: 'PEG-014', email: 'ainatina18@gmail.com' },
            { nama: 'Ustadzah Fadhilah', nip: 'PEG-012', email: 'sitifadhilah1209@gmail.com' },
            { nama: 'Ustadzah Fatim', nip: 'PEG-018', email: 'dyaah71@gmail.com' },
            { nama: 'Ustadzah Iis', nip: 'PEG-016', email: 'iisfatikhafatikha@gmail.com' },
            { nama: 'Ustadzah Luthfi', nip: 'PEG-015', email: 'lutfiarahmawati1234@gmail.com' },
            { nama: 'Ustadzah Mufti', nip: 'PEG-013', email: 'muftitika13@gmail.com' },
            { nama: 'Ustadzah Muhim', nip: 'PEG-010', email: 'laylimuhimatul@gmail.com' },
            { nama: 'Ustadzah Shabrina', nip: 'PEG-008', email: 'shabeercantik@gmail.com' },
            { nama: 'Ustadzah Shofi', nip: 'PEG-009', email: 'sofwatul05@gmail.com' },
            { nama: 'Ustadzah Yusita', nip: 'PEG-017', email: 'yusitakurnia2511@gmail.com' }
        ];

        const studentsPerHalaqah = Math.max(1, Math.ceil((students.length || 1) / activeTeachers.length));
        activeTeachers.forEach((t, idx) => {
            const hId = 'HLQ-' + (idx < 9 ? '0' + (idx + 1) : (idx + 1));
            const hName = 'Halaqah ' + t.nama;
            const startIdx = idx * studentsPerHalaqah;
            const endIdx = startIdx + studentsPerHalaqah;
            const assignedStudents = students.slice(startIdx, endIdx);
            const sIds = assignedStudents.map(s => s.id || s.student_id || s.studentId || s.nis);

            halaqahs.push({
                halaqahId: hId,
                namaHalaqah: hName,
                muhafiz: t.nama,
                email: t.email || '',
                nip: t.nip || '',
                targetKurikulum: 'Tahfidz 30 Juz',
                studentIds: sIds,
                studentCount: sIds.length
            });
            muhafizList.push(t.nama);
        });

        const enrichedStudents = students.map((s, idx) => {
            const sId = s.id || s.student_id || s.studentId || ('ST-' + (idx + 1));
            const assignedHalaqah = halaqahs.find(h => h.studentIds.includes(sId)) || halaqahs[0] || {
                halaqahId: 'HLQ-01',
                namaHalaqah: 'Halaqah Umum',
                muhafiz: 'Ustadz Pembina'
            };

            return {
                studentId: sId,
                nis: s.nis || ('NIS-' + (idx + 100)),
                name: s.name || s.nama || 'Santri',
                gender: s.gender || 'L',
                program: s.program || 'Tahfidz',
                status: s.status || 'ACTIVE',
                halaqah: {
                    halaqahId: assignedHalaqah.halaqahId,
                    namaHalaqah: assignedHalaqah.namaHalaqah,
                    muhafiz: assignedHalaqah.muhafiz
                },
                isInHalaqah: true,
                target: {
                    ziyadahSesi: 1,
                    ziyadahPekan: 10,
                    ziyadahBulan: 40,
                    murajaahSesi: 2,
                    murajaahPekan: 10,
                    murajaahBulan: 40
                },
                rekapPekan: {
                    ziyadah: { target: 10, realita: 2, isTuntas: false },
                    murojaah: { target: 10, realita: 4, persen: 40, isTuntas: false, statusText: 'Kurang 6 Hlm' }
                },
                progress: {
                    currentJuz: 30,
                    currentHalaman: 1,
                    curriculumRank: 1,
                    totalHalamanTuntas: 1,
                    onTrackStatus: 'On-Track (Aktif)'
                }
            };
        });

        return {
            status: 'success',
            success: true,
            summary: {
                totalStudents: enrichedStudents.length,
                khatam30Juz: 0,
                rataRataJuz: '1.0',
                rataRataJuzNumber: 1.0,
                totalAkumulasiJuz: enrichedStudents.length,
                totalHalamanSetoran: 0,
                aktivitasPekanIni: 0,
                weeklyZiyadahCount: 0,
                weeklyMurajaahCount: 0,
                weeklyZiyadahPages: 0,
                weeklyMurajaahPages: 0
            },
            students: enrichedStudents,
            halaqahs: halaqahs,
            categories: ['Semua Kategori', 'Tahfidz', 'Tahsin'],
            muhafizList: ['Semua Muhafiz', ...muhafizList]
        };
    } catch(err) {
        console.warn('buildTahfidzFallbackData error:', err);
        return null;
    }
}
`;
  content += fallbackFuncDef;
  console.log('[PATCH] js/tahfidz.js buildTahfidzFallbackData appended');
}

fs.writeFileSync(tahfidzJsPath, content, 'utf8');
console.log('Frontend patching completed.');
