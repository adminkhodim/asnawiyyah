/**
 * ====================================================================
 * MODUL FRONTEND: TAHFIDZ AL-QUR'AN (PPTQ ASNAWIYYAH)
 * Desain & Alur Mengacu Standar Pesantren Modern (Khodim.com)
 * ====================================================================
 * Fitur:
 * 1. Multi-role: Admin/Musyrif (Kelola), Wali Santri (Pantau Anak), Pengasuh (Makro)
 * 2. Standar Mushaf Pojok: 20 Halaman per Juz, 2 Halaman per Lembar
 * 3. Pemilih Halaman Interaktif (Halaman 1 - 20) dengan Quick Chips
 * 4. Mutaba'ah 3 Indikator (Target vs Realita: Harian, Pekanan, Bulanan)
 * 5. Manajemen Halaqah & Plotting Santri
 */

// Global State Tahfidz
const ASNTahfidz = {
    data: {
        summary: {
            khatam30Juz: 0,
            rataRataHafalan: "0.0 Juz / Santri",
            totalHafalanJuz: 0,
            aktivitasPekanIni: { ziyadahPercent: 100, murajaahPercent: 0, totalSetoranPekanIni: 0 }
        },
        students: [],
        categories: ["Semua Kategori", "Tahfidz Anak", "Tahfidz Dewasa", "Kitab Kuning", "Reguler"],
        halaqahs: [],
        muhafizList: []
    },
    filteredStudents: [],
    activeStudentDetail: null,
    catatState: {
        studentId: "",
        juz: 1,
        tipe: "ZIYADAH", // ZIYADAH, MURAJAAH, TASMI
        selectedPages: [1],
        sesi: "Pagi (Ba'da Subuh)",
        nilai: "MUMTAZ"
    },
    targetState: {
        studentId: "",
        ziyadahSesi: 1,
        ziyadahPekan: 10,
        murajaahSesi: 2,
        murajaahPekan: 10
    },
    halaqahActiveTab: 1,
    detailActiveTab: 1,
    detailFilterTipe: "ALL"
};

// Referensi Surah Awal per Juz untuk Standar Mushaf 30 Juz
const SURAH_JUZ_REFERENCE = {
    1: "Al-Fatihah - Al-Baqarah 141",
    2: "Al-Baqarah 142 - 252",
    3: "Al-Baqarah 253 - Ali 'Imran 92",
    4: "Ali 'Imran 93 - An-Nisa' 23",
    5: "An-Nisa' 24 - 147",
    6: "An-Nisa' 148 - Al-Ma'idah 81",
    7: "Al-Ma'idah 82 - Al-An'am 110",
    8: "Al-An'am 111 - Al-A'raf 87",
    9: "Al-A'raf 88 - Al-Anfal 40",
    10: "Al-Anfal 41 - At-Taubah 92",
    11: "At-Taubah 93 - Hud 5",
    12: "Hud 6 - Yusuf 52",
    13: "Yusuf 53 - Ibrahim 52",
    14: "Al-Hijr 1 - An-Nahl 128",
    15: "Al-Isra' 1 - Al-Kahf 74",
    16: "Al-Kahf 75 - Ta-Ha 135",
    17: "Al-Anbiya' 1 - Al-Hajj 78",
    18: "Al-Mu'minun 1 - Al-Furqan 20",
    19: "Al-Furqan 21 - An-Naml 55",
    20: "An-Naml 56 - Al-'Ankabut 45",
    21: "Al-'Ankabut 46 - Al-Ahzab 30",
    22: "Al-Ahzab 31 - Ya-Sin 27",
    23: "Ya-Sin 28 - Az-Zumar 31",
    24: "Az-Zumar 32 - Fussilat 46",
    25: "Fussilat 47 - Al-Jatsiyah 37",
    26: "Al-Ahqaf 1 - Adz-Dzariyat 30",
    27: "Adz-Dzariyat 31 - Al-Hadid 29",
    28: "Al-Mujadilah 1 - At-Tahrim 12",
    29: "Al-Mulk 1 - Al-Mursalat 50",
    30: "An-Naba' 1 - An-Nas 6 (Juz 'Amma)"
};

// ====================================================================
// 1. DASHBOARD TAHFIDZ (LOAD & RENDER)
// ====================================================================

/**
 * Muat data lengkap dashboard Tahfidz dari Google Apps Script
 */
async function loadAdminTahfidzData() {
    const loader = document.getElementById('admin-tahfidz-loader');
    const tableBody = document.getElementById('admin-tahfidz-table-body');
    const emptyState = document.getElementById('admin-tahfidz-empty');

    if (loader) loader.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const response = await apiPost("getTahfidzDashboard", { token });

        if (response && (response.success || response.status === "success")) {
            ASNTahfidz.data = response;
            ASNTahfidz.filteredStudents = [...(response.students || [])];

            renderTahfidzSummaryCards();
            populateTahfidzFilters();
            renderTahfidzStudentTable();
            updateHubTahfidzBadge();
        } else {
            console.warn("Gagal memuat tahfidz dashboard:", response);
            if (typeof showToast === 'function') {
                showToast("⚠️ " + ((response && response.message) || "Gagal memuat data Tahfidz."));
            }
        }
    } catch (err) {
        console.error("Error loadAdminTahfidzData:", err);
        if (typeof showToast === 'function') {
            showToast("❌ Terjadi kendala saat memuat data Tahfidz.");
        }
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

/**
 * Render 4 Kartu Ringkasan Atas (Screenshot 1)
 */
function renderTahfidzSummaryCards() {
    const sum = ASNTahfidz.data.summary || {};

    const elKhatam = document.getElementById('tahfidz-stat-khatam');
    if (elKhatam) elKhatam.innerText = sum.khatam30Juz || 0;

    const elRata = document.getElementById('tahfidz-stat-rata');
    if (elRata) elRata.innerText = sum.rataRataHafalan || "0.0 Juz / Santri";

    const elTotal = document.getElementById('tahfidz-stat-total');
    if (elTotal) elTotal.innerText = `${sum.totalHafalanJuz || 0} Akumulasi Juz`;

    const elZiyadahBar = document.getElementById('tahfidz-stat-bar-ziyadah');
    const elZiyadahText = document.getElementById('tahfidz-stat-text-ziyadah');
    const elMurajaahText = document.getElementById('tahfidz-stat-text-murajaah');

    const akt = sum.aktivitasPekanIni || { ziyadahPercent: 100, murajaahPercent: 0 };
    if (elZiyadahBar) elZiyadahBar.style.width = `${akt.ziyadahPercent || 100}%`;
    if (elZiyadahText) elZiyadahText.innerText = `Ziyadah ( ${akt.ziyadahPercent || 100}% )`;
    if (elMurajaahText) elMurajaahText.innerText = `Muraja'ah ( ${akt.murajaahPercent || 0}% )`;
}

/**
 * Isi dropdown filter kategori, halaqah, muhafiz
 */
function populateTahfidzFilters() {
    const selKat = document.getElementById('tahfidz-filter-kategori');
    const selHal = document.getElementById('tahfidz-filter-halaqah');
    const selMuh = document.getElementById('tahfidz-filter-muhafiz');

    if (selKat && ASNTahfidz.data.categories) {
        const currentVal = selKat.value;
        selKat.innerHTML = ASNTahfidz.data.categories.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
        if (currentVal) selKat.value = currentVal;
    }

    if (selHal && ASNTahfidz.data.halaqahs) {
        const currentVal = selHal.value;
        let optHtml = `<option value="ALL">Semua Halaqah</option>`;
        ASNTahfidz.data.halaqahs.forEach(h => {
            optHtml += `<option value="${escapeHtml(h.namaHalaqah)}">${escapeHtml(h.namaHalaqah)}</option>`;
        });
        selHal.innerHTML = optHtml;
        if (currentVal) selHal.value = currentVal;
    }

    if (selMuh && ASNTahfidz.data.muhafizList) {
        const currentVal = selMuh.value;
        selMuh.innerHTML = ASNTahfidz.data.muhafizList.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
        if (currentVal) selMuh.value = currentVal;
    }
}

/**
 * Update badge Tahfidz di Hub Admin
 */
function updateHubTahfidzBadge() {
    const hubBadge = document.getElementById('admin-hub-tahfidz-count');
    if (hubBadge) {
        const count = ASNTahfidz.data.students ? ASNTahfidz.data.students.length : 0;
        hubBadge.innerText = `${count} Santri`;
    }
}

/**
 * Filter realtime data tabel
 */
function filterTahfidzList() {
    const q = (document.getElementById('tahfidz-search-input')?.value || '').toLowerCase().trim();
    const kat = document.getElementById('tahfidz-filter-kategori')?.value || 'Semua Kategori';
    const hal = document.getElementById('tahfidz-filter-halaqah')?.value || 'ALL';
    const muh = document.getElementById('tahfidz-filter-muhafiz')?.value || 'Semua Muhafiz';
    const status = document.getElementById('tahfidz-filter-status')?.value || 'ALL';

    const all = ASNTahfidz.data.students || [];

    ASNTahfidz.filteredStudents = all.filter(st => {
        // Query search
        const matchQ = !q ||
            (st.name && st.name.toLowerCase().includes(q)) ||
            (st.nis && st.nis.toLowerCase().includes(q)) ||
            (st.halaqah && st.halaqah.namaHalaqah && st.halaqah.namaHalaqah.toLowerCase().includes(q));

        // Kategori
        const matchKat = (kat === 'Semua Kategori' || kat === 'ALL') ||
            (st.program && st.program.toLowerCase() === kat.toLowerCase()) ||
            (st.halaqah && st.halaqah.kategori && st.halaqah.kategori.toLowerCase() === kat.toLowerCase());

        // Halaqah
        const matchHal = (hal === 'ALL') ||
            (st.halaqah && st.halaqah.namaHalaqah === hal);

        // Muhafiz
        const matchMuh = (muh === 'Semua Muhafiz' || muh === 'ALL') ||
            (st.halaqah && st.halaqah.muhafiz && st.halaqah.muhafiz.includes(muh)) ||
            (st.setoranTerakhir && st.setoranTerakhir.muhafiz && st.setoranTerakhir.muhafiz.includes(muh));

        // Status On-Track
        let matchStatus = true;
        if (status === 'ON_TRACK') {
            matchStatus = st.progress && st.progress.onTrackStatus && st.progress.onTrackStatus.startsWith('On-Track');
        } else if (status === 'BELUM_SETOR') {
            matchStatus = st.progress && st.progress.onTrackStatus && st.progress.onTrackStatus.includes('Belum Setor');
        }

        return matchQ && matchKat && matchHal && matchMuh && matchStatus;
    });

    renderTahfidzStudentTable();
}

/**
 * Render Tabel Data Santri (Desktop & Mobile) sesuai Screenshot 1
 */
function renderTahfidzStudentTable() {
    const tbody = document.getElementById('admin-tahfidz-table-body');
    const mobileContainer = document.getElementById('admin-tahfidz-mobile-list');
    const emptyState = document.getElementById('admin-tahfidz-empty');
    const countEl = document.getElementById('admin-tahfidz-count');

    const students = ASNTahfidz.filteredStudents || [];

    if (countEl) countEl.innerText = `${students.length} Santri`;

    if (students.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (mobileContainer) mobileContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Desktop Table HTML
    if (tbody) {
        tbody.innerHTML = students.map(st => {
            const initials = (st.name || 'Santri').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'SN';
            const halaqahName = st.halaqah?.namaHalaqah || st.program || 'Tahfidz Dewasa';
            const targetZ = st.target?.ziyadahSesi || 1;
            const targetZPekan = st.target?.ziyadahPekan || 10;
            const targetZBulan = st.target?.ziyadahBulan || 40;
            const targetM = st.target?.murajaahSesi || 2;
            const targetMPekan = st.target?.murajaahPekan || 10;
            const targetMBulan = st.target?.murajaahBulan || 40;

            const last = st.setoranTerakhir;
            const currentJuz = st.progress?.currentJuz || 1;
            const percent = st.progress?.percent || 3;
            const onTrackStatus = st.progress?.onTrackStatus || 'Belum Setor';
            const isOnTrack = onTrackStatus.includes('On-Track');

            return `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1c2836]/60 transition border-b border-slate-100 dark:border-[#253447]">
                <!-- 1. SANTRI & HALAQAH -->
                <td class="px-4 py-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                            ${st.photoUrl ? `<img src="${escapeHtml(st.photoUrl)}" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null; this.parentElement.innerText='${initials}';">` : initials}
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-extrabold text-xs md:text-sm text-slate-800 dark:text-slate-100 truncate">${escapeHtml(st.name)}</h4>
                            <p class="text-[10px] text-slate-400 mt-0.5">NIS: ${escapeHtml(st.nis || '-')} • Bil Hifdhi</p>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                ${escapeHtml(halaqahName)}
                            </span>
                        </div>
                    </div>
                </td>

                <!-- 2. TARGET CAPAIAN -->
                <td class="px-4 py-4">
                    <div class="relative group bg-slate-50/70 dark:bg-[#1c2836]/40 p-2 rounded-xl border border-slate-100 dark:border-[#253447] space-y-1.5 w-60">
                        <button type="button" onclick="openTahfidzTargetModal('${st.studentId}')" class="absolute top-1.5 right-1.5 text-slate-400 hover:text-emerald-600 text-xs p-1" title="Ubah Target Santri">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <!-- Ziyadah Target -->
                        <div class="flex items-center justify-between text-[10px]">
                            <span class="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                <i class="fa-solid fa-circle-plus text-[8px]"></i> Ziyadah
                            </span>
                            <span class="font-bold text-slate-700 dark:text-slate-200">${targetZ} Halaman</span>
                        </div>
                        <div class="text-[9px] text-slate-400 flex justify-between">
                            <span>Pekan: ${targetZPekan} Hlm</span>
                            <span>Bln: ${targetZBulan} Hlm</span>
                        </div>
                        <hr class="border-slate-200/60 dark:border-[#283a4e]">
                        <!-- Muroja'ah Target -->
                        <div class="flex items-center justify-between text-[10px]">
                            <span class="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                                <i class="fa-solid fa-rotate text-[8px]"></i> Muroja'ah
                            </span>
                            <span class="font-bold text-slate-700 dark:text-slate-200">${targetM} Halaman</span>
                        </div>
                        <div class="text-[9px] text-slate-400 flex justify-between">
                            <span>Pekan: ${targetMPekan} Hlm</span>
                            <span>Bln: ${targetMBulan} Hlm</span>
                        </div>
                    </div>
                </td>

                <!-- 3. SETORAN TERAKHIR -->
                <td class="px-4 py-4 text-xs">
                    ${last ? `
                    <div class="space-y-1">
                        <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <span class="text-emerald-600 font-extrabold">Juz ${last.juz}</span> • <span>${escapeHtml(last.surah)}</span>
                        </div>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">
                            (${escapeHtml(last.halaman)} [${last.totalHalaman || 1} Halaman])
                        </p>
                        <p class="text-[9px] text-slate-400">
                            ${escapeHtml(last.tanggal)} • ${escapeHtml(last.sesi)}
                        </p>
                        <p class="text-[9px] text-slate-400 italic truncate max-w-[180px]">
                            <i class="fa-regular fa-user mr-0.5"></i> ${escapeHtml(last.muhafiz)}
                        </p>
                    </div>
                    ` : `
                    <div class="text-[10px] text-slate-400 italic">
                        Belum ada riwayat setoran tercatat.
                    </div>
                    `}
                </td>

                <!-- 4. STATUS & NILAI -->
                <td class="px-4 py-4">
                    ${last ? `
                    <div class="space-y-1.5">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${last.tipe === 'ZIYADAH' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : (last.tipe === 'TASMI' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300')}">
                            ${escapeHtml(last.tipe)}
                        </span>
                        <div class="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Nilai: <span class="text-emerald-600">${last.nilai === 'MUMTAZ' ? 'A (Mumtaz)' : (last.nilai === 'JAYYID_JIDDAN' ? 'B+ (Jayyid Jiddan)' : (last.nilai === 'JAYYID' ? 'B (Jayyid)' : 'C (Dha\'if)'))}</span>
                        </div>
                    </div>
                    ` : `<span class="text-[10px] text-slate-400">-</span>`}
                </td>

                <!-- 5. PROGRESS (0 - 30 JUZ) -->
                <td class="px-4 py-4 w-48">
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-xs">
                            <span class="font-extrabold text-slate-800 dark:text-slate-100">Juz ${currentJuz} <span class="text-slate-400 font-normal">/ 30</span></span>
                            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">${percent}%</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-[#1c2836] h-2 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
                        </div>
                        <span class="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${isOnTrack ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-[#1c2836] dark:text-slate-400'}">
                            ${escapeHtml(onTrackStatus)}
                        </span>
                    </div>
                </td>

                <!-- 6. AKSI -->
                <td class="px-4 py-4 text-right">
                    <div class="flex items-center justify-end space-x-1.5">
                        <button type="button" onclick="openTahfidzCatatModal('${st.studentId}')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm active:scale-95" title="Catat Setoran">
                            <i class="fa-solid fa-plus text-[10px]"></i>
                            <span>Catat</span>
                        </button>
                        <button type="button" onclick="openTahfidzStudentDetail('${st.studentId}')" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95" title="Detail Riwayat & Mutaba'ah">
                            <i class="fa-solid fa-clock-rotate-left text-xs"></i>
                        </button>
                        <button type="button" onclick="printTahfidzStudentCard('${st.studentId}')" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-700 dark:text-slate-300 flex items-center justify-center transition active:scale-95" title="Cetak Rapor Mutaba'ah">
                            <i class="fa-solid fa-print text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    // Mobile List Card HTML
    if (mobileContainer) {
        mobileContainer.innerHTML = students.map(st => {
            const initials = (st.name || 'Santri').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'SN';
            const halaqahName = st.halaqah?.namaHalaqah || st.program || 'Tahfidz Dewasa';
            const last = st.setoranTerakhir;
            const currentJuz = st.progress?.currentJuz || 1;
            const percent = st.progress?.percent || 3;

            return `
            <div class="p-4 bg-white dark:bg-[#15202d] rounded-2xl border border-slate-100 dark:border-[#253447] shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 min-w-0">
                        <div class="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                            ${st.photoUrl ? `<img src="${escapeHtml(st.photoUrl)}" class="w-full h-full object-cover rounded-full">` : initials}
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">${escapeHtml(st.name)}</h4>
                            <p class="text-[10px] text-slate-400">NIS: ${escapeHtml(st.nis || '-')}</p>
                            <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">${escapeHtml(halaqahName)}</span>
                        </div>
                    </div>
                    <button type="button" onclick="openTahfidzCatatModal('${st.studentId}')" class="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                        + Catat
                    </button>
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-bold">
                        <span>Capaian: Juz ${currentJuz} / 30</span>
                        <span class="text-emerald-600">${percent}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-[#1c2836] h-2 rounded-full overflow-hidden">
                        <div class="bg-emerald-600 h-full rounded-full" style="width: ${percent}%;"></div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#253447] text-[10px] text-slate-400">
                    <span>${last ? `Terakhir: Juz ${last.juz} (${last.tipe})` : 'Belum setor'}</span>
                    <button type="button" onclick="openTahfidzStudentDetail('${st.studentId}')" class="text-emerald-600 font-bold hover:underline">
                        Lihat Mutaba'ah &gt;
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
}

// ====================================================================
// 2. MODAL: CATAT SETORAN TAHFIDZ (Screenshot 5)
// ====================================================================

/**
 * Buka modal catat setoran cepat
 */
function openTahfidzCatatModal(studentId = null) {
    const modal = document.getElementById('modal-tahfidz-catat');
    if (!modal) return;

    // Reset State
    ASNTahfidz.catatState = {
        studentId: studentId || "",
        juz: 1,
        tipe: "ZIYADAH",
        selectedPages: [1],
        sesi: "Pagi (Ba'da Subuh)",
        nilai: "MUMTAZ"
    };

    // Populate Santri Select
    const selSantri = document.getElementById('tahfidz-catat-santri');
    if (selSantri && ASNTahfidz.data.students) {
        let optHtml = `<option value="">-- Pilih Santri --</option>`;
        ASNTahfidz.data.students.forEach(st => {
            const selected = (studentId && st.studentId === studentId) ? 'selected' : '';
            optHtml += `<option value="${st.studentId}" ${selected}>${escapeHtml(st.name)} (${escapeHtml(st.nis || '-')})</option>`;
        });
        selSantri.innerHTML = optHtml;
    }

    // Set Tanggal hari ini
    const dateInput = document.getElementById('tahfidz-catat-tanggal');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Set Tipe Setoran Buttons (Ziyadah default)
    setTahfidzCatatTipe('ZIYADAH');

    // Populate Juz Dropdown 1 - 30
    const selJuz = document.getElementById('tahfidz-catat-juz');
    if (selJuz) {
        let juzHtml = '';
        for (let j = 1; j <= 30; j++) {
            juzHtml += `<option value="${j}">Juz ${j} (${SURAH_JUZ_REFERENCE[j] || ''})</option>`;
        }
        selJuz.innerHTML = juzHtml;
        selJuz.value = "1";
    }

    // Render Grid Tombol Halaman 1-20 Mushaf Pojok
    renderTahfidzPageSelector();

    modal.classList.remove('hidden');
}

/**
 * Tutup modal catat setoran
 */
function closeTahfidzCatatModal() {
    const modal = document.getElementById('modal-tahfidz-catat');
    if (modal) modal.classList.add('hidden');
}

/**
 * Toggle Tipe Setoran (Ziyadah, Muraja'ah, Tasmi')
 */
function setTahfidzCatatTipe(tipe) {
    ASNTahfidz.catatState.tipe = tipe;

    const btnZ = document.getElementById('btn-tipe-ziyadah');
    const btnM = document.getElementById('btn-tipe-murajaah');
    const btnT = document.getElementById('btn-tipe-tasmi');

    const activeClasses = ['bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-sm'];
    const inactiveClasses = ['bg-slate-50', 'dark:bg-[#1c2836]', 'text-slate-700', 'dark:text-slate-300', 'border-slate-200', 'dark:border-[#283a4e]'];

    [btnZ, btnM, btnT].forEach(b => {
        if (!b) return;
        b.classList.remove(...activeClasses);
        b.classList.add(...inactiveClasses);
    });

    if (tipe === 'ZIYADAH' && btnZ) {
        btnZ.classList.add(...activeClasses);
        btnZ.classList.remove(...inactiveClasses);
    } else if (tipe === 'MURAJAAH' && btnM) {
        btnM.classList.add(...activeClasses);
        btnM.classList.remove(...inactiveClasses);
    } else if (tipe === 'TASMI' && btnT) {
        btnT.classList.add(...activeClasses);
        btnT.classList.remove(...inactiveClasses);
    }
}

/**
 * Render Pemilih Halaman Mushaf Pojok (1 - 20)
 */
function renderTahfidzPageSelector() {
    const container = document.getElementById('tahfidz-page-grid');
    const summaryBadge = document.getElementById('tahfidz-page-summary-badge');
    const summaryList = document.getElementById('tahfidz-page-summary-list');

    if (!container) return;

    const selected = ASNTahfidz.catatState.selectedPages || [1];

    let gridHtml = '';
    for (let p = 1; p <= 20; p++) {
        const isSel = selected.includes(p);
        gridHtml += `
        <button type="button" onclick="toggleTahfidzPage(${p})" class="h-10 rounded-xl font-extrabold text-xs transition border flex items-center justify-center ${isSel ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105' : 'bg-slate-50 dark:bg-[#1c2836] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#283a4e] hover:bg-slate-100'}">
            ${p}
        </button>
        `;
    }
    container.innerHTML = gridHtml;

    // Update Summary
    const count = selected.length;
    if (summaryBadge) {
        summaryBadge.innerText = `TERPILIH: ${count} HALAMAN`;
    }
    if (summaryList) {
        if (selected.length === 1) {
            summaryList.innerText = `Halaman ${selected[0]}`;
        } else if (selected.length > 1) {
            const min = Math.min(...selected);
            const max = Math.max(...selected);
            summaryList.innerText = `Halaman ${min} - ${max} (${count} Halaman)`;
        } else {
            summaryList.innerText = "Belum ada halaman terpilih";
        }
    }
}

/**
 * Toggle satu halaman
 */
function toggleTahfidzPage(pageNumber) {
    let sel = ASNTahfidz.catatState.selectedPages;
    if (sel.includes(pageNumber)) {
        sel = sel.filter(p => p !== pageNumber);
    } else {
        sel.push(pageNumber);
    }
    sel.sort((a, b) => a - b);
    if (sel.length === 0) sel = [pageNumber];
    ASNTahfidz.catatState.selectedPages = sel;
    renderTahfidzPageSelector();
}

/**
 * Pintasan Cepat Pemilih Halaman (Quick Chips)
 * e.g. 0.5 Hal, 1 Hal, 1 Lembar (2 Hal), 1/2 Juz (10 Hal), 1 Juz (20 Hal)
 */
function applyTahfidzQuickChip(pagesCount) {
    const start = (ASNTahfidz.catatState.selectedPages && ASNTahfidz.catatState.selectedPages.length > 0) ? ASNTahfidz.catatState.selectedPages[0] : 1;
    const newPages = [];
    const count = Math.max(1, Math.round(pagesCount));

    for (let i = 0; i < count; i++) {
        const pageVal = start + i;
        if (pageVal <= 20) {
            newPages.push(pageVal);
        }
    }

    if (newPages.length === 0) newPages.push(1);
    ASNTahfidz.catatState.selectedPages = newPages;
    renderTahfidzPageSelector();
}

/**
 * Simpan catatan setoran ke backend
 */
async function submitTahfidzCatat(e) {
    if (e) e.preventDefault();

    const selSantri = document.getElementById('tahfidz-catat-santri');
    const studentId = selSantri ? selSantri.value : "";
    if (!studentId) {
        if (typeof showToast === 'function') showToast("⚠️ Harap pilih santri terlebih dahulu.");
        return;
    }

    const student = (ASNTahfidz.data.students || []).find(s => s.studentId === studentId);
    const tanggal = document.getElementById('tahfidz-catat-tanggal')?.value || "";
    const sesi = document.getElementById('tahfidz-catat-sesi')?.value || "Pagi (Ba'da Subuh)";
    const juz = Number(document.getElementById('tahfidz-catat-juz')?.value || 1);
    const nilai = document.getElementById('tahfidz-catat-nilai')?.value || "MUMTAZ";
    const muhafiz = document.getElementById('tahfidz-catat-muhafiz')?.value || "";
    const catatan = document.getElementById('tahfidz-catat-catatan')?.value || "";

    const selectedPages = ASNTahfidz.catatState.selectedPages || [1];
    const halamanList = selectedPages.join(",");
    const totalHalaman = selectedPages.length;

    const btn = document.getElementById('btn-submit-tahfidz-catat');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Menyimpan...`;
    }

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const payload = {
            token,
            studentId,
            student_id: studentId,
            nis: student?.nis || "",
            studentName: student?.name || "",
            gender: student?.gender || "L",
            tanggal,
            sesi,
            tipe: ASNTahfidz.catatState.tipe,
            juz,
            surah: SURAH_JUZ_REFERENCE[juz] || `Juz ${juz}`,
            halamanList,
            halaman_list: halamanList,
            totalHalaman,
            total_halaman: totalHalaman,
            nilai,
            muhafiz: muhafiz || (student?.halaqah?.muhafiz || "Ustadz Pembina"),
            catatan
        };

        const response = await apiPost("saveTahfidzLog", payload);

        if (response && (response.success || response.status === "success")) {
            if (typeof showToast === 'function') {
                showToast(response.message || "Setoran tahfidz santri berhasil disimpan!");
            }
            closeTahfidzCatatModal();
            await loadAdminTahfidzData();
        } else {
            const msg = (response && response.message) || "Gagal menyimpan setoran.";
            if (typeof showToast === 'function') showToast("❌ " + msg);
        }
    } catch (err) {
        console.error("Gagal submitTahfidzCatat:", err);
        if (typeof showToast === 'function') showToast("❌ Terjadi kendala: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
        }
    }
}

// ====================================================================
// 3. MODAL: DETAIL SANTRI / MUTABA'AH REALITA VS TARGET (Screenshot 4)
// ====================================================================

/**
 * Buka modal detail mutaba'ah (bisa diakses Admin, Pengasuh, & Wali Santri)
 */
async function openTahfidzStudentDetail(studentId) {
    const modal = document.getElementById('modal-tahfidz-detail');
    if (!modal) return;

    modal.classList.remove('hidden');
    ASNTahfidz.detailActiveTab = 1;
    switchTahfidzDetailTab(1);

    const container = document.getElementById('tahfidz-detail-content');
    if (container) {
        container.innerHTML = `
        <div class="py-16 text-center space-y-2">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-600"></i>
            <p class="text-xs text-slate-400 font-bold">Memuat rapor mutaba'ah santri...</p>
        </div>
        `;
    }

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const response = await apiPost("getTahfidzStudentDetail", { token, studentId });

        if (response && (response.success || response.status === "success")) {
            ASNTahfidz.activeStudentDetail = response;
            renderTahfidzStudentDetailView();
        } else {
            if (container) {
                container.innerHTML = `
                <div class="p-6 text-center text-rose-600 text-xs">
                    Gagal memuat detail: ${response?.message || 'Data tidak ditemukan'}
                </div>
                `;
            }
        }
    } catch (err) {
        console.error("Gagal load detail santri:", err);
    }
}

/**
 * Tutup modal detail santri
 */
function closeTahfidzStudentDetail() {
    const modal = document.getElementById('modal-tahfidz-detail');
    if (modal) modal.classList.add('hidden');
    ASNTahfidz.activeStudentDetail = null;
}

/**
 * Ganti tab dalam modal detail santri (Tab 1: Rekap 3 Indikator, Tab 2: Riwayat)
 */
function switchTahfidzDetailTab(tabIndex) {
    ASNTahfidz.detailActiveTab = tabIndex;

    const tab1Btn = document.getElementById('btn-detail-tab-1');
    const tab2Btn = document.getElementById('btn-detail-tab-2');
    const panel1 = document.getElementById('panel-detail-tab-1');
    const panel2 = document.getElementById('panel-detail-tab-2');

    if (tabIndex === 1) {
        if (tab1Btn) {
            tab1Btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-sm transition";
        }
        if (tab2Btn) {
            tab2Btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition";
        }
        if (panel1) panel1.classList.remove('hidden');
        if (panel2) panel2.classList.add('hidden');
    } else {
        if (tab1Btn) {
            tab1Btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition";
        }
        if (tab2Btn) {
            tab2Btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-sm transition";
        }
        if (panel1) panel1.classList.add('hidden');
        if (panel2) panel2.classList.remove('hidden');
    }
}

/**
 * Render Tampilan Rapor Mutaba'ah Santri (Screenshot 4)
 */
function renderTahfidzStudentDetailView() {
    const res = ASNTahfidz.activeStudentDetail;
    if (!res) return;

    const st = res.student || {};
    const stats = res.stats || {};
    const ind = res.indikator || {};
    const riwayat = res.riwayat || [];

    // Header Info
    const elName = document.getElementById('tahfidz-detail-name');
    const elNis = document.getElementById('tahfidz-detail-nis');
    const elAvatar = document.getElementById('tahfidz-detail-avatar');

    if (elName) elName.innerText = st.name || "Santri";
    if (elNis) elNis.innerText = `NIS: ${st.nis || '-'} • Bil Hifdhi`;
    if (elAvatar) {
        const initials = (st.name || 'Santri').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        elAvatar.innerHTML = st.photoUrl ? `<img src="${escapeHtml(st.photoUrl)}" class="w-full h-full object-cover rounded-2xl">` : initials;
    }

    // 4 Strip Stat Cards
    const elCapaian = document.getElementById('tahfidz-detail-stat-capaian');
    const elTarget = document.getElementById('tahfidz-detail-stat-target');
    const elTotal = document.getElementById('tahfidz-detail-stat-total');
    const elNilai = document.getElementById('tahfidz-detail-stat-nilai');

    if (elCapaian) elCapaian.innerText = stats.capaianSaatIni || "Juz 1 (3%)";
    if (elTarget) elTarget.innerText = stats.targetCapaian || "30 Juz";
    if (elTotal) elTotal.innerText = stats.totalSetoran || "0 Kali";
    if (elNilai) elNilai.innerText = stats.rataRataNilai || "-";

    // Progress Bar 30 Juz
    const elProgressText = document.getElementById('tahfidz-detail-progress-text');
    const elProgressBar = document.getElementById('tahfidz-detail-progress-bar');
    if (elProgressText) elProgressText.innerText = `${stats.progressJuz || 1} / 30 Juz`;
    if (elProgressBar) elProgressBar.style.width = `${stats.progressPercent || 3}%`;

    // 3 Indikator (Harian, Pekanan, Bulanan)
    const elHarianTarget = document.getElementById('tahfidz-ind-harian-target');
    const elHarianRealita = document.getElementById('tahfidz-ind-harian-realita');
    const elHarianStatus = document.getElementById('tahfidz-ind-harian-status');

    if (elHarianTarget) elHarianTarget.innerText = ind.harian?.targetText || "-";
    if (elHarianRealita) elHarianRealita.innerText = ind.harian?.realitaText || "0 Hal";
    if (elHarianStatus) elHarianStatus.innerText = ind.harian?.status || "Belum Ada Setoran";

    const elPekanTarget = document.getElementById('tahfidz-ind-pekan-target');
    const elPekanRealita = document.getElementById('tahfidz-ind-pekan-realita');
    const elPekanStatus = document.getElementById('tahfidz-ind-pekan-status');

    if (elPekanTarget) elPekanTarget.innerText = ind.pekanan?.targetText || "-";
    if (elPekanRealita) elPekanRealita.innerText = ind.pekanan?.realitaText || "0 Hal";
    if (elPekanStatus) elPekanStatus.innerText = ind.pekanan?.status || "0% Capaian";

    const elBulanTarget = document.getElementById('tahfidz-ind-bulan-target');
    const elBulanRealita = document.getElementById('tahfidz-ind-bulan-realita');
    const elBulanStatus = document.getElementById('tahfidz-ind-bulan-status');

    if (elBulanTarget) elBulanTarget.innerText = ind.bulanan?.targetText || "-";
    if (elBulanRealita) elBulanRealita.innerText = ind.bulanan?.realitaText || "0 Hal";
    if (elBulanStatus) elBulanStatus.innerText = ind.bulanan?.status || "0% Capaian";

    // Render Riwayat Setoran Table (Tab 2)
    const riwayatTbody = document.getElementById('tahfidz-detail-riwayat-tbody');
    if (riwayatTbody) {
        if (riwayat.length === 0) {
            riwayatTbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-xs text-slate-400">Belum ada riwayat setoran hafalan.</td></tr>`;
        } else {
            riwayatTbody.innerHTML = riwayat.map((r, idx) => `
            <tr class="hover:bg-slate-50 dark:hover:bg-[#1c2836]/50 border-b border-slate-100 dark:border-[#253447] text-xs">
                <td class="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200">${escapeHtml(r.tanggal)}</td>
                <td class="px-3 py-2.5">
                    <span class="px-2 py-0.5 rounded text-[9px] font-extrabold ${r.tipe === 'ZIYADAH' ? 'bg-emerald-100 text-emerald-800' : (r.tipe === 'TASMI' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800')}">
                        ${escapeHtml(r.tipe)}
                    </span>
                </td>
                <td class="px-3 py-2.5">
                    <span class="font-bold text-emerald-700 dark:text-emerald-400">Juz ${r.juz}</span>
                    <span class="text-slate-400 text-[10px]">(${escapeHtml(r.surah)})</span>
                </td>
                <td class="px-3 py-2.5">Halaman ${escapeHtml(r.halamanList || '1')} (${r.totalHalaman} Hlm)</td>
                <td class="px-3 py-2.5 font-bold text-emerald-600">${escapeHtml(r.nilai)}</td>
                <td class="px-3 py-2.5 text-right">
                    <button type="button" onclick="deleteTahfidzLogEntry('${r.logId}')" class="text-slate-400 hover:text-rose-600 text-xs p-1" title="Hapus Riwayat">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `).join('');
        }
    }
}

/**
 * Hapus entri log dari riwayat
 */
async function deleteTahfidzLogEntry(logId) {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan setoran ini?")) return;

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const res = await apiPost("deleteTahfidzLog", { token, logId });
        if (res && (res.success || res.status === "success")) {
            if (typeof showToast === 'function') showToast("Catatan setoran berhasil dihapus.");
            if (ASNTahfidz.activeStudentDetail?.student?.studentId) {
                openTahfidzStudentDetail(ASNTahfidz.activeStudentDetail.student.studentId);
            }
            loadAdminTahfidzData();
        } else {
            if (typeof showToast === 'function') showToast("❌ Gagal menghapus catatan.");
        }
    } catch (e) {
        console.error(e);
    }
}

// ====================================================================
// 4. MODAL: TARGET CAPAIAN SANTRI (Screenshot 3)
// ====================================================================

/**
 * Buka modal atur target santri
 */
function openTahfidzTargetModal(studentId) {
    const modal = document.getElementById('modal-tahfidz-target');
    if (!modal) return;

    const student = (ASNTahfidz.data.students || []).find(s => s.studentId === studentId);
    if (!student) return;

    ASNTahfidz.targetState.studentId = studentId;

    const nameEl = document.getElementById('tahfidz-target-student-name');
    if (nameEl) nameEl.innerText = `${student.name} • NIS: ${student.nis || '-'}`;

    const zSesi = student.target?.ziyadahSesi || 1;
    const zPekan = student.target?.ziyadahPekan || 10;
    const mSesi = student.target?.murajaahSesi || 2;
    const mPekan = student.target?.murajaahPekan || 10;

    const elZSesi = document.getElementById('input-target-ziyadah-sesi');
    const elZPekan = document.getElementById('input-target-ziyadah-pekan');
    const elMSesi = document.getElementById('input-target-murajaah-sesi');
    const elMPekan = document.getElementById('input-target-murajaah-pekan');

    if (elZSesi) elZSesi.value = zSesi;
    if (elZPekan) elZPekan.value = `${zPekan} Halaman (${zPekan / 2} Lembar / ~${(zPekan / 20).toFixed(1)} Juz / Pekan)`;
    if (elMSesi) elMSesi.value = mSesi;
    if (elMPekan) elMPekan.value = `${mPekan} Halaman (${mPekan / 2} Lembar / ~${(mPekan / 20).toFixed(1)} Juz / Pekan)`;

    modal.classList.remove('hidden');
}

/**
 * Tutup modal atur target santri
 */
function closeTahfidzTargetModal() {
    const modal = document.getElementById('modal-tahfidz-target');
    if (modal) modal.classList.add('hidden');
}

/**
 * Quick chip penambah target
 */
function setTahfidzTargetChip(type, val) {
    if (type === 'ZIYADAH') {
        const el = document.getElementById('input-target-ziyadah-sesi');
        const elPekan = document.getElementById('input-target-ziyadah-pekan');
        if (el) el.value = val;
        const pekan = val * 10;
        if (elPekan) elPekan.value = `${pekan} Halaman (${pekan / 2} Lembar / ~${(pekan / 20).toFixed(1)} Juz / Pekan)`;
    } else {
        const el = document.getElementById('input-target-murajaah-sesi');
        const elPekan = document.getElementById('input-target-murajaah-pekan');
        if (el) el.value = val;
        const pekan = val * 5;
        if (elPekan) elPekan.value = `${pekan} Halaman (${pekan / 2} Lembar / ~${(pekan / 20).toFixed(1)} Juz / Pekan)`;
    }
}

/**
 * Simpan target mutaba'ah santri
 */
async function submitTahfidzTarget() {
    const studentId = ASNTahfidz.targetState.studentId;
    if (!studentId) return;

    const zSesi = Number(document.getElementById('input-target-ziyadah-sesi')?.value || 1);
    const mSesi = Number(document.getElementById('input-target-murajaah-sesi')?.value || 2);

    const btn = document.getElementById('btn-save-tahfidz-target');
    if (btn) btn.disabled = true;

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const response = await apiPost("saveTahfidzTarget", {
            token,
            studentId,
            targetZiyadahSesi: zSesi,
            targetZiyadahPekan: zSesi * 10,
            targetMurajaahSesi: mSesi,
            targetMurajaahPekan: mSesi * 5
        });

        if (response && (response.success || response.status === "success")) {
            if (typeof showToast === 'function') showToast("Target santri berhasil diperbarui.");
            closeTahfidzTargetModal();
            loadAdminTahfidzData();
        } else {
            if (typeof showToast === 'function') showToast("❌ " + ((response && response.message) || "Gagal menyimpan target."));
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ====================================================================
// 5. MODAL: KELOLA HALAQAH & PLOTTING (Screenshot 2)
// ====================================================================

/**
 * Buka modal kelola halaqah
 */
function openTahfidzHalaqahModal() {
    const modal = document.getElementById('modal-tahfidz-halaqah');
    if (!modal) return;

    renderTahfidzHalaqahCards();
    modal.classList.remove('hidden');
}

/**
 * Tutup modal kelola halaqah
 */
function closeTahfidzHalaqahModal() {
    const modal = document.getElementById('modal-tahfidz-halaqah');
    if (modal) modal.classList.add('hidden');
}

/**
 * Render daftar kartu halaqah aktif (Screenshot 2)
 */
function renderTahfidzHalaqahCards() {
    const container = document.getElementById('tahfidz-halaqah-cards-container');
    if (!container) return;

    const halaqahs = ASNTahfidz.data.halaqahs || [];

    if (halaqahs.length === 0) {
        container.innerHTML = `<div class="col-span-2 text-center py-6 text-xs text-slate-400">Belum ada kelompok halaqah aktif.</div>`;
        return;
    }

    container.innerHTML = halaqahs.map((h, i) => `
    <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-200 dark:border-[#283a4e] space-y-3">
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-black text-sm text-slate-800 dark:text-slate-100">${escapeHtml(h.namaHalaqah)}</h4>
                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ${escapeHtml(h.kategori || 'Tahfidz')}
                </span>
            </div>
            <span class="w-7 h-7 rounded-lg bg-white dark:bg-[#15202d] text-slate-400 flex items-center justify-center text-xs font-bold shadow-sm">
                ${String.fromCharCode(65 + i)}
            </span>
        </div>
        <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <p class="flex items-center gap-1.5 truncate">
                <i class="fa-solid fa-user-tie text-emerald-600"></i>
                <span>${escapeHtml(h.muhafiz || 'Ustadz Pembina')}</span>
            </p>
            <p class="text-[10px] text-slate-400 truncate">
                <i class="fa-solid fa-flag mr-1"></i> ${escapeHtml(h.targetKurikulum || 'Target Mushaf Pojok Standar')}
            </p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#283a4e] text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-300">${h.studentCount || 0} Santri Binaan</span>
            <button type="button" onclick="openPlottingSantri('${h.halaqahId}')" class="px-2.5 py-1 bg-white dark:bg-[#15202d] hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg border border-slate-200 dark:border-[#283a4e] text-[10px] transition">
                + Atur Santri
            </button>
        </div>
    </div>
    `).join('');
}

/**
 * Tambah halaqah baru
 */
async function submitNewHalaqah(e) {
    if (e) e.preventDefault();

    const nama = document.getElementById('input-halaqah-nama')?.value || '';
    const kat = document.getElementById('input-halaqah-kategori')?.value || 'Tahfidz Anak';
    const muh = document.getElementById('input-halaqah-muhafiz')?.value || '';
    const target = document.getElementById('input-halaqah-target')?.value || '';

    if (!nama) {
        if (typeof showToast === 'function') showToast("⚠️ Nama Halaqah wajib diisi.");
        return;
    }

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const res = await apiPost("saveTahfidzHalaqah", {
            token,
            namaHalaqah: nama,
            kategori: kat,
            muhafiz: muh,
            targetKurikulum: target
        });

        if (res && (res.success || res.status === "success")) {
            if (typeof showToast === 'function') showToast("Halaqah baru berhasil dibuat!");
            // Reset form
            if (document.getElementById('input-halaqah-nama')) document.getElementById('input-halaqah-nama').value = '';
            await loadAdminTahfidzData();
            renderTahfidzHalaqahCards();
        } else {
            if (typeof showToast === 'function') showToast("❌ Gagal membuat halaqah.");
        }
    } catch (err) {
        console.error(err);
    }
}

// ====================================================================
// 6. EXPORT & PRINT
// ====================================================================

/**
 * Cetak Rapor Mutaba'ah Santri Perorangan
 */
function printTahfidzStudentCard(studentId) {
    openTahfidzStudentDetail(studentId);
    setTimeout(() => {
        window.print();
    }, 500);
}

/**
 * Cetak Rekapitulasi Tahfidz Pesantren
 */
function printTahfidzRekap() {
    window.print();
}

/**
 * Ekspor Data Mutaba'ah ke CSV
 */
function exportTahfidzDataCSV() {
    const students = ASNTahfidz.filteredStudents || [];
    if (students.length === 0) {
        if (typeof showToast === 'function') showToast("⚠️ Tidak ada data untuk diekspor.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NIS,Nama Santri,Gender,Program,Halaqah,Capaian Juz,Persentase,Target Ziyadah Harian,Target Ziyadah Pekan,Status On-Track\n";

    students.forEach(st => {
        const row = [
            `"${st.nis || ''}"`,
            `"${st.name || ''}"`,
            `"${st.gender || 'L'}"`,
            `"${st.program || ''}"`,
            `"${st.halaqah?.namaHalaqah || ''}"`,
            `"${st.progress?.currentJuz || 1}"`,
            `"${st.progress?.percent || 0}%"`,
            `"${st.target?.ziyadahSesi || 1}"`,
            `"${st.target?.ziyadahPekan || 10}"`,
            `"${st.progress?.onTrackStatus || ''}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Tahfidz_Asnawiyyah_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ====================================================================
// 7. INTEGRASI WALI SANTRI & PENGASUH
// ====================================================================

/**
 * Buka Pantauan Lengkap Tahfidz untuk Pengasuh
 */
function openTahfidzPengasuhView() {
    // Arahkan ke tab admin view tahfidz
    if (typeof showAdminView === 'function') {
        showAdminView('tahfidz');
    }
}

// Auto-export to global window
window.ASNTahfidz = ASNTahfidz;
window.loadAdminTahfidzData = loadAdminTahfidzData;
window.filterTahfidzList = filterTahfidzList;
window.openTahfidzCatatModal = openTahfidzCatatModal;
window.closeTahfidzCatatModal = closeTahfidzCatatModal;
window.setTahfidzCatatTipe = setTahfidzCatatTipe;
window.toggleTahfidzPage = toggleTahfidzPage;
window.applyTahfidzQuickChip = applyTahfidzQuickChip;
window.submitTahfidzCatat = submitTahfidzCatat;
window.openTahfidzStudentDetail = openTahfidzStudentDetail;
window.closeTahfidzStudentDetail = closeTahfidzStudentDetail;
window.switchTahfidzDetailTab = switchTahfidzDetailTab;
window.deleteTahfidzLogEntry = deleteTahfidzLogEntry;
window.openTahfidzTargetModal = openTahfidzTargetModal;
window.closeTahfidzTargetModal = closeTahfidzTargetModal;
window.setTahfidzTargetChip = setTahfidzTargetChip;
window.submitTahfidzTarget = submitTahfidzTarget;
window.openTahfidzHalaqahModal = openTahfidzHalaqahModal;
window.closeTahfidzHalaqahModal = closeTahfidzHalaqahModal;
window.submitNewHalaqah = submitNewHalaqah;
window.printTahfidzStudentCard = printTahfidzStudentCard;
window.printTahfidzRekap = printTahfidzRekap;
window.exportTahfidzDataCSV = exportTahfidzDataCSV;
window.openTahfidzPengasuhView = openTahfidzPengasuhView;
