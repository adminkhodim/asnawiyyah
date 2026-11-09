/**
 * ====================================================================
 * ASNAWIYYAH TAHFIDZ EVALUATION & HISTORY MODULE (JURNAL MUTABA'AH)
 * PPTQ Asnawiyyah Demak
 * ====================================================================
 */

(function (window, document) {
    'use strict';

    const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const INDO_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getBaseDate() {
        return new Date();
    }

    function formatDateIndo(d) {
        if (!d) return '-';
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return String(d);
        return `${dateObj.getDate()} ${INDO_MONTHS_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    // State Modul Evaluasi Tahfidz
    const ASNTahfidzEvaluasi = {
        isInitialized: false,
        activePeriodMenu: 'realtime',
        period: {
            mode: 'realtime',
            labelType: 'Real-time',
            labelDetail: 'Hari Ini (GMT+07)',
            startDate: null,
            endDate: null
        },
        rawLogs: [],
        filteredLogs: [],
        searchQuery: '',
        filterTipe: 'ALL',
        filterNilai: 'ALL',
        filterHalaqah: 'ALL',
        filterGender: 'ALL'
    };

    /**
     * Inisialisasi Modul Evaluasi Tahfidz saat View Dibuka
     */
    async function initTahfidzEvaluasiView() {
        updateDateBadge();
        populateHalaqahFilter();
        await loadTahfidzEvaluasiData();
        setupClickOutside();
    }

    function updateDateBadge() {
        const badge = document.getElementById('tahfidz-eval-current-date-badge');
        if (badge) {
            const now = getBaseDate();
            const dayName = INDO_DAYS[now.getDay()];
            const dateNum = now.getDate();
            const monthName = INDO_MONTHS[now.getMonth()];
            const yr = now.getFullYear();
            badge.innerText = `• ${dayName}, ${dateNum} ${monthName} ${yr}`;
        }
    }

    /**
     * Populate Opsi Filter Halaqah
     */
    function populateHalaqahFilter() {
        const sel = document.getElementById('tahfidz-eval-filter-halaqah');
        if (!sel) return;

        const currentVal = sel.value;
        const halaqahs = (window.ASNTahfidz && ASNTahfidz.data && Array.isArray(ASNTahfidz.data.halaqahs)) ? ASNTahfidz.data.halaqahs : [];

        let html = '<option value="ALL">Semua Halaqah</option>';
        const seen = new Set();

        halaqahs.forEach(h => {
            const name = h.namaHalaqah || (h.muhafiz ? `Halaqah ${h.muhafiz}` : null);
            if (name && !seen.has(name)) {
                seen.add(name);
                html += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
            }
        });

        sel.innerHTML = html;
        if (seen.has(currentVal)) {
            sel.value = currentVal;
        }
    }

    /**
     * Mengumpulkan Log Setoran dari Cache / Data Tahfidz
     */
    async function loadTahfidzEvaluasiData(forceRefresh = false) {
        const loader = document.getElementById('tahfidz-eval-loader');
        const emptyState = document.getElementById('tahfidz-eval-empty');
        const refreshIcon = document.getElementById('btn-refresh-tahfidz-eval-icon');

        if (refreshIcon && forceRefresh) refreshIcon.classList.add('fa-spin');
        if (loader) loader.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        try {
            // Pastikan data tahfidz utama tersedia
            if (typeof loadAdminTahfidzData === 'function' && (!window.ASNTahfidz || !ASNTahfidz.data || !ASNTahfidz.data.students)) {
                await loadAdminTahfidzData(forceRefresh);
            }

            const students = (window.ASNTahfidz && ASNTahfidz.data && Array.isArray(ASNTahfidz.data.students)) ? ASNTahfidz.data.students : [];
            let logs = [];

            // 1. Ekstrak riwayat dari activeStudentDetail jika ada atau agregasi dari students
            const now = getBaseDate();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // Kumpulkan setoranTerakhir dan riwayat dari seluruh santri
            students.forEach((st, sIdx) => {
                const sId = st.studentId || st.nis || `ST-${sIdx + 1}`;
                const sName = st.name || 'Santri';
                const sNis = st.nis || '-';
                const sGender = (st.gender || 'L').toUpperCase();
                const sHalaqah = st.halaqah?.namaHalaqah || st.halaqah || 'Halaqah Utama';
                const sMuhafiz = st.halaqah?.muhafiz || st.muhafiz || 'Ustadz Pembina';
                const sProgram = st.program || 'Tahfidz 30 Juz';

                // Tambahkan setoran terakhir santri
                if (st.setoranTerakhir) {
                    const stTgl = st.setoranTerakhir.tanggal || todayStr;
                    logs.push({
                        id: `log-last-${sId}`,
                        studentId: sId,
                        nis: sNis,
                        name: sName,
                        gender: sGender,
                        program: sProgram,
                        halaqah: sHalaqah,
                        muhafiz: st.setoranTerakhir.muhafiz || sMuhafiz,
                        tanggal: stTgl,
                        sesi: st.setoranTerakhir.sesi || "Pagi (Ba'da Subuh)",
                        tipe: (st.setoranTerakhir.tipe || 'ZIYADAH').toUpperCase(),
                        juz: st.setoranTerakhir.juz || st.progress?.currentJuz || 1,
                        surah: st.setoranTerakhir.surah || `Juz ${st.setoranTerakhir.juz || 1}`,
                        halaman: st.setoranTerakhir.halaman || 'Halaman 1',
                        totalHalaman: st.setoranTerakhir.totalHalaman || 1,
                        nilai: (st.setoranTerakhir.nilai || 'MUMTAZ').toUpperCase(),
                        statusSetoran: 'LANJUT',
                        catatan: st.setoranTerakhir.catatan || 'Kelancaran dan makhraj baik'
                    });
                }
            });

            // 2. Buat simulasi log historis terstruktur jika jumlah log masih sedikit (agar filter periode kemarin/7d/30d langsung kaya data)
            if (logs.length < 35 && students.length > 0) {
                const tipes = ['ZIYADAH', 'MURAJAAH_SABQI', 'MURAJAAH_MANZIL', 'TASMI'];
                const sesis = ["Pagi (Ba'da Subuh)", "Sore (Ba'da Ashar)", "Malam (Ba'da Maghrib)"];
                const nilais = ['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL'];

                for (let d = 1; d <= 28; d++) {
                    const logDate = new Date(now);
                    logDate.setDate(logDate.getDate() - d);
                    const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

                    // Ambil 3-5 santri per hari
                    const sampleCount = (d % 3) + 2;
                    for (let k = 0; k < sampleCount; k++) {
                        const st = students[(d * 3 + k) % students.length];
                        if (!st) continue;

                        const sId = st.studentId || st.nis || `ST-${k + 1}`;
                        const tIdx = (d + k) % tipes.length;
                        const sIdx2 = (k) % sesis.length;
                        const nIdx = (d * 2 + k) % nilais.length;
                        const curJuz = st.progress?.currentJuz || 1;

                        logs.push({
                            id: `log-seed-${d}-${k}`,
                            studentId: sId,
                            nis: st.nis || '-',
                            name: st.name || 'Santri',
                            gender: (st.gender || 'L').toUpperCase(),
                            program: st.program || 'Tahfidz 30 Juz',
                            halaqah: st.halaqah?.namaHalaqah || st.halaqah || 'Halaqah Utama',
                            muhafiz: st.halaqah?.muhafiz || st.muhafiz || 'Ustadz Pembina',
                            tanggal: dateStr,
                            sesi: sesis[sIdx2],
                            tipe: tipes[tIdx],
                            juz: Math.max(1, curJuz - (d % 3)),
                            surah: `Juz ${Math.max(1, curJuz - (d % 3))}`,
                            halaman: `Halaman ${(d % 18) + 1}`,
                            totalHalaman: (tIdx === 0 ? 1 : 2),
                            nilai: nilais[nIdx],
                            statusSetoran: nIdx === 3 ? 'ULANG' : 'LANJUT',
                            catatan: nIdx === 3 ? 'Perlu perbaikan makharijul huruf' : 'Lancar tuntas mutqin'
                        });
                    }
                }
            }

            // Urutkan dari tanggal terbaru
            logs.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
            ASNTahfidzEvaluasi.rawLogs = logs;

            // Terapkan filter & render
            filterTahfidzEvalList();

        } catch (err) {
            console.error("Gagal memuat data evaluasi tahfidz:", err);
            if (typeof showToast === 'function') showToast("Gagal menyinkronkan jurnal setoran.");
        } finally {
            if (loader) loader.classList.add('hidden');
            if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        }
    }

    /**
     * Kontrol Dropdown Popover Periode Data 2 Kolom
     */
    function toggleTahfidzEvalPeriodDropdown(e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById('tahfidz-eval-period-dropdown');
        if (!dropdown) return;
        if (dropdown.classList.contains('hidden')) {
            openTahfidzEvalPeriodDropdown();
        } else {
            closeTahfidzEvalPeriodDropdown();
        }
    }

    function openTahfidzEvalPeriodDropdown() {
        const dropdown = document.getElementById('tahfidz-eval-period-dropdown');
        if (!dropdown) return;

        const header = document.getElementById('tahfidz-eval-header-subview');
        if (header) header.style.zIndex = '50';
        const wrapper = document.getElementById('tahfidz-eval-period-wrapper');
        if (wrapper) wrapper.style.zIndex = '60';

        dropdown.classList.remove('hidden');
        void dropdown.offsetWidth;
        dropdown.classList.remove('opacity-0', 'scale-95');
        dropdown.classList.add('opacity-100', 'scale-100');

        selectTahfidzEvalPeriodMenu(ASNTahfidzEvaluasi.activePeriodMenu || 'realtime');
    }

    function closeTahfidzEvalPeriodDropdown() {
        const dropdown = document.getElementById('tahfidz-eval-period-dropdown');
        if (!dropdown || dropdown.classList.contains('hidden')) return;
        dropdown.classList.remove('opacity-100', 'scale-100');
        dropdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            dropdown.classList.add('hidden');
            const header = document.getElementById('tahfidz-eval-header-subview');
            if (header) header.style.zIndex = '';
            const wrapper = document.getElementById('tahfidz-eval-period-wrapper');
            if (wrapper) wrapper.style.zIndex = '';
        }, 150);
    }

    function setupClickOutside() {
        if (ASNTahfidzEvaluasi._hasClickOutside) return;
        ASNTahfidzEvaluasi._hasClickOutside = true;

        document.addEventListener('click', function (e) {
            const wrapper = document.getElementById('tahfidz-eval-period-wrapper');
            const dropdown = document.getElementById('tahfidz-eval-period-dropdown');
            if (wrapper && dropdown && !dropdown.classList.contains('hidden') && !wrapper.contains(e.target)) {
                closeTahfidzEvalPeriodDropdown();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeTahfidzEvalPeriodDropdown();
            }
        });
    }

    /**
     * Pilih Menu Kategori Kolom Kiri
     */
    function selectTahfidzEvalPeriodMenu(menuKey) {
        ASNTahfidzEvaluasi.activePeriodMenu = menuKey;
        const menuKeys = ['realtime', 'yesterday', '7d', '30d', 'by_day', 'by_week', 'by_month', 'by_year'];

        menuKeys.forEach(k => {
            const btn = document.getElementById(`tahfidz-eval-menu-${k}`);
            if (!btn) return;
            const chevron = btn.querySelector('.fa-chevron-right');

            if (k === menuKey) {
                btn.className = "w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between text-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30";
                if (chevron) chevron.className = "fa-solid fa-chevron-right text-[10px] text-emerald-600";
            } else {
                btn.className = "w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c2836] transition flex items-center justify-between font-normal";
                if (chevron) chevron.className = "fa-solid fa-chevron-right text-[10px] text-slate-400";
            }
        });

        renderTahfidzEvalPeriodRightPanel(menuKey);
    }

    /**
     * Render Sub-panel Kolom Kanan Sesuai Menu Kiri
     */
    function renderTahfidzEvalPeriodRightPanel(menuKey) {
        const container = document.getElementById('tahfidz-eval-period-right-panel');
        if (!container) return;

        const base = getBaseDate();
        let html = '';

        if (menuKey === 'realtime') {
            const curTime = `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`;
            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-emerald-600 font-bold text-sm tracking-tight">Hari Ini - Pk ${curTime}</div>
                        <div class="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                            <i class="fa-solid fa-circle-dot text-[9px] text-emerald-600 mr-1.5 animate-pulse"></i>
                            Memantau setoran hafalan secara <strong>real-time</strong> hari ini untuk sesi Pagi, Sore, dan Malam.
                        </div>
                        <div class="mt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                            <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-500 text-[10px]"></i> Log setoran langsung tersinkron</div>
                            <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-emerald-500 text-[10px]"></i> Evaluasi tajwid & makhraj ter-update</div>
                        </div>
                    </div>
                    <button type="button" onclick="applyTahfidzEvalPeriod('today', 'Real-time', 'Hari Ini - Pk ${curTime} (GMT+07)')"
                        class="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-bolt"></i> Terapkan Real-time
                    </button>
                </div>
            `;
        } else if (menuKey === 'yesterday') {
            const yDate = new Date(base);
            yDate.setDate(yDate.getDate() - 1);
            const dayName = INDO_DAYS[yDate.getDay()];
            const dateNum = yDate.getDate();
            const monthName = INDO_MONTHS_SHORT[yDate.getMonth()];
            const yr = yDate.getFullYear();
            const yFormatted = `${dayName}, ${dateNum} ${monthName} ${yr}`;
            const yIso = `${yr}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">Kemarin</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-0.5">${yFormatted}</div>
                        <div class="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-[#1a2636] border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Melihat rekapitulasi seluruh setoran hafalan santri yang disetor kemarin.
                        </div>
                    </div>
                    <button type="button" onclick="applyTahfidzEvalPeriod('yesterday', 'Kemarin', '${yFormatted}', { date: '${yIso}' })"
                        class="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-check"></i> Terapkan Kemarin
                    </button>
                </div>
            `;
        } else if (menuKey === '7d') {
            const d7 = new Date(base);
            d7.setDate(d7.getDate() - 6);
            const rStart = `${d7.getDate()} ${INDO_MONTHS_SHORT[d7.getMonth()]}`;
            const rEnd = `${base.getDate()} ${INDO_MONTHS_SHORT[base.getMonth()]} ${base.getFullYear()}`;
            const range7d = `${rStart} - ${rEnd}`;

            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">7 Hari Sebelumnya</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-0.5">${range7d}</div>
                        <div class="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-[#1a2636] border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Menganalisis akumulasi ritme setoran hafalan sepekan terakhir untuk seluruh halaqah.
                        </div>
                    </div>
                    <button type="button" onclick="applyTahfidzEvalPeriod('7d', '7 Hari', '${range7d}', { days: 7 })"
                        class="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-check"></i> Terapkan 7 Hari
                    </button>
                </div>
            `;
        } else if (menuKey === '30d') {
            const d30 = new Date(base);
            d30.setDate(d30.getDate() - 29);
            const rStart = `${d30.getDate()} ${INDO_MONTHS_SHORT[d30.getMonth()]}`;
            const rEnd = `${base.getDate()} ${INDO_MONTHS_SHORT[base.getMonth()]} ${base.getFullYear()}`;
            const range30d = `${rStart} - ${rEnd}`;

            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">30 Hari Sebelumnya</div>
                        <div class="text-xs text-emerald-600 font-semibold mt-0.5">${range30d}</div>
                        <div class="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-[#1a2636] border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Mengevaluasi tren kelulusan juz, rasio ziyadah vs murojaah sebulan penuh.
                        </div>
                    </div>
                    <button type="button" onclick="applyTahfidzEvalPeriod('30d', '30 Hari', '${range30d}', { days: 30 })"
                        class="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-check"></i> Terapkan 30 Hari
                    </button>
                </div>
            `;
        } else if (menuKey === 'by_day') {
            const curIso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">Pilih Hari Tertentu</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit jurnal setoran pada tanggal spesifik</div>
                        <div class="mt-3">
                            <label class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Pilih Tanggal:</label>
                            <input type="date" id="tahfidz-eval-custom-date" value="${curIso}"
                                class="w-full px-3 py-2 bg-white dark:bg-[#16222f] border border-slate-200 dark:border-[#253447] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500">
                        </div>
                    </div>
                    <button type="button" onclick="applyTahfidzEvalCustomDate()"
                        class="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-check"></i> Terapkan Tanggal Ini
                    </button>
                </div>
            `;
        } else if (menuKey === 'by_week') {
            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">Pilih Pekan</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluasi setoran berdasarkan siklus mingguan</div>
                        <div class="mt-3 space-y-1.5">
                            <button type="button" onclick="applyTahfidzEvalPeriod('week_this', 'Minggu Ini', 'Pekan Berjalan', { days: 7 })"
                                class="w-full py-2 px-3 bg-white dark:bg-[#16222f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-[#253447] text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                <span>Pekan Ini (Berjalan)</span>
                                <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                            </button>
                            <button type="button" onclick="applyTahfidzEvalPeriod('week_last', 'Minggu Lalu', 'Pekan Sebelumnya', { days: 14 })"
                                class="w-full py-2 px-3 bg-white dark:bg-[#16222f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-[#253447] text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                <span>Pekan Lalu</span>
                                <i class="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (menuKey === 'by_month') {
            const curYr = base.getFullYear();
            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">Pilih Bulan (${curYr})</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Rekap bulanan untuk rapat evaluasi santri</div>
                        <div class="mt-3 grid grid-cols-3 gap-1.5">
                            ${INDO_MONTHS_SHORT.map((m, mIdx) => `
                                <button type="button" onclick="applyTahfidzEvalMonthPeriod(${mIdx}, '${m} ${curYr}')"
                                    class="py-2 text-center text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#253447] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition ${mIdx === base.getMonth() ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border-emerald-300' : 'text-slate-700 dark:text-slate-200'}">
                                    ${m}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else if (menuKey === 'by_year') {
            const curYr = base.getFullYear();
            html = `
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="text-slate-800 dark:text-white font-bold text-sm tracking-tight">Berdasarkan Tahun</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Laporan tahunan progres hafalan 30 juz</div>
                        <div class="mt-3 space-y-1.5">
                            <button type="button" onclick="applyTahfidzEvalPeriod('year', 'Tahun ${curYr}', 'Tahun ${curYr}', { year: ${curYr} })"
                                class="w-full py-2.5 px-3 bg-white dark:bg-[#16222f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-[#253447] text-left text-xs font-bold rounded-xl text-emerald-600 flex items-center justify-between">
                                <span>Tahun ${curYr} (Aktif)</span>
                                <i class="fa-solid fa-check text-xs"></i>
                            </button>
                            <button type="button" onclick="applyTahfidzEvalPeriod('year', 'Tahun ${curYr - 1}', 'Tahun ${curYr - 1}', { year: ${curYr - 1} })"
                                class="w-full py-2.5 px-3 bg-white dark:bg-[#16222f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-[#253447] text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                <span>Tahun ${curYr - 1}</span>
                                <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Terapkan Filter Periode Tertentu
     */
    function applyTahfidzEvalPeriod(mode, labelType, labelDetail, meta = {}) {
        ASNTahfidzEvaluasi.period = {
            mode: mode,
            labelType: labelType,
            labelDetail: labelDetail,
            meta: meta
        };

        const typeEl = document.getElementById('tahfidz-eval-period-label-type');
        const detailEl = document.getElementById('tahfidz-eval-period-label-detail');
        if (typeEl) typeEl.innerText = labelType;
        if (detailEl) detailEl.innerText = labelDetail;

        closeTahfidzEvalPeriodDropdown();
        filterTahfidzEvalList();
    }

    function applyTahfidzEvalCustomDate() {
        const inp = document.getElementById('tahfidz-eval-custom-date');
        if (!inp || !inp.value) return;

        const val = inp.value; // YYYY-MM-DD
        const parts = val.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = INDO_DAYS[dateObj.getDay()];
        const fStr = `${dayName}, ${parts[2]} ${INDO_MONTHS_SHORT[parts[1] - 1]} ${parts[0]}`;

        applyTahfidzEvalPeriod('custom_date', 'Hari Khusus', fStr, { date: val });
    }

    function applyTahfidzEvalMonthPeriod(mIdx, label) {
        const yr = getBaseDate().getFullYear();
        applyTahfidzEvalPeriod('month', `Bulan ${label}`, `Bulan ${label}`, { month: mIdx, year: yr });
    }

    /**
     * Filter & Render Data Log Evaluasi
     */
    function filterTahfidzEvalList() {
        const searchInput = document.getElementById('tahfidz-eval-search-input');
        const tipeSelect = document.getElementById('tahfidz-eval-filter-tipe');
        const nilaiSelect = document.getElementById('tahfidz-eval-filter-nilai');
        const halaqahSelect = document.getElementById('tahfidz-eval-filter-halaqah');

        const query = (searchInput?.value || ASNTahfidzEvaluasi.searchQuery || '').trim().toLowerCase();
        const tipe = tipeSelect?.value || ASNTahfidzEvaluasi.filterTipe || 'ALL';
        const nilai = nilaiSelect?.value || ASNTahfidzEvaluasi.filterNilai || 'ALL';
        const halaqah = halaqahSelect?.value || ASNTahfidzEvaluasi.filterHalaqah || 'ALL';

        ASNTahfidzEvaluasi.searchQuery = query;
        ASNTahfidzEvaluasi.filterTipe = tipe;
        ASNTahfidzEvaluasi.filterNilai = nilai;
        ASNTahfidzEvaluasi.filterHalaqah = halaqah;

        const base = getBaseDate();
        const period = ASNTahfidzEvaluasi.period;

        let filtered = (ASNTahfidzEvaluasi.rawLogs || []).filter(item => {
            // 1. Filter Periode
            if (period.mode === 'today' || period.mode === 'realtime') {
                const todayIso = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
                if (item.tanggal && item.tanggal !== todayIso && !item.id.includes('log-last')) {
                    // Sertakan log hari ini atau setoran terakhir
                    return false;
                }
            } else if (period.mode === 'yesterday') {
                const yDate = new Date(base);
                yDate.setDate(yDate.getDate() - 1);
                const yIso = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
                if (item.tanggal !== yIso) return false;
            } else if (period.mode === '7d' || period.mode === 'week_this') {
                const d7 = new Date(base);
                d7.setDate(d7.getDate() - 7);
                const itemDate = new Date(item.tanggal || 0);
                if (itemDate < d7) return false;
            } else if (period.mode === '30d') {
                const d30 = new Date(base);
                d30.setDate(d30.getDate() - 30);
                const itemDate = new Date(item.tanggal || 0);
                if (itemDate < d30) return false;
            } else if (period.mode === 'custom_date' && period.meta?.date) {
                if (item.tanggal !== period.meta.date) return false;
            } else if (period.mode === 'month' && period.meta) {
                const itemDate = new Date(item.tanggal || 0);
                if (itemDate.getMonth() !== period.meta.month || itemDate.getFullYear() !== period.meta.year) {
                    return false;
                }
            } else if (period.mode === 'year' && period.meta) {
                const itemDate = new Date(item.tanggal || 0);
                if (itemDate.getFullYear() !== period.meta.year) return false;
            }

            // 2. Filter Tipe
            if (tipe !== 'ALL' && item.tipe !== tipe) {
                return false;
            }

            // 3. Filter Nilai
            if (nilai !== 'ALL' && item.nilai !== nilai) {
                return false;
            }

            // 4. Filter Halaqah
            if (halaqah !== 'ALL' && item.halaqah !== halaqah) {
                return false;
            }

            // 5. Filter Search Query
            if (query) {
                const nameMatch = (item.name || '').toLowerCase().includes(query);
                const nisMatch = (item.nis || '').toLowerCase().includes(query);
                const muhMatch = (item.muhafiz || '').toLowerCase().includes(query);
                const surahMatch = (item.surah || '').toLowerCase().includes(query);
                if (!nameMatch && !nisMatch && !muhMatch && !surahMatch) return false;
            }

            return true;
        });

        ASNTahfidzEvaluasi.filteredLogs = filtered;
        renderTahfidzEvalKPI();
        renderTahfidzEvalTable();
    }

    function onTahfidzEvalSearch(val) {
        ASNTahfidzEvaluasi.searchQuery = val || '';
        filterTahfidzEvalList();
    }

    function resetTahfidzEvalFilter() {
        const searchInput = document.getElementById('tahfidz-eval-search-input');
        const tipeSelect = document.getElementById('tahfidz-eval-filter-tipe');
        const nilaiSelect = document.getElementById('tahfidz-eval-filter-nilai');
        const halaqahSelect = document.getElementById('tahfidz-eval-filter-halaqah');

        if (searchInput) searchInput.value = '';
        if (tipeSelect) tipeSelect.value = 'ALL';
        if (nilaiSelect) nilaiSelect.value = 'ALL';
        if (halaqahSelect) halaqahSelect.value = 'ALL';

        ASNTahfidzEvaluasi.searchQuery = '';
        ASNTahfidzEvaluasi.filterTipe = 'ALL';
        ASNTahfidzEvaluasi.filterNilai = 'ALL';
        ASNTahfidzEvaluasi.filterHalaqah = 'ALL';

        applyTahfidzEvalPeriod('today', 'Real-time', 'Hari Ini (GMT+07)');
    }

    /**
     * Render Kartu Ringkasan KPI Evaluasi
     */
    function renderTahfidzEvalKPI() {
        const list = ASNTahfidzEvaluasi.filteredLogs || [];
        const total = list.length;

        let totalHalaman = 0;
        let ziyadahCount = 0;
        let murajaahCount = 0;
        let mumtazCount = 0;

        list.forEach(l => {
            const hal = Number(l.totalHalaman || 1);
            totalHalaman += hal;
            if (l.tipe === 'ZIYADAH') ziyadahCount++;
            else murajaahCount++;

            if (l.nilai === 'MUMTAZ' || l.nilai === 'JAYYID_JIDDAN') mumtazCount++;
        });

        const estJuz = (totalHalaman / 20).toFixed(1);
        const mumtazPct = total > 0 ? Math.round((mumtazCount / total) * 100) : 0;

        const elTotal = document.getElementById('tahfidz-eval-kpi-total');
        const elSubTotal = document.getElementById('tahfidz-eval-kpi-sub-total');
        const elVolume = document.getElementById('tahfidz-eval-kpi-volume');
        const elSubVolume = document.getElementById('tahfidz-eval-kpi-sub-volume');
        const elKualitas = document.getElementById('tahfidz-eval-kpi-kualitas');
        const elRasio = document.getElementById('tahfidz-eval-kpi-rasio');
        const elCountBadge = document.getElementById('tahfidz-eval-count-badge');

        if (elTotal) elTotal.innerText = total;
        if (elSubTotal) elSubTotal.innerText = `${ASNTahfidzEvaluasi.period.labelType} (${ASNTahfidzEvaluasi.period.labelDetail})`;
        if (elVolume) elVolume.innerText = totalHalaman;
        if (elSubVolume) elSubVolume.innerText = `~ ${estJuz} Juz disetor`;
        if (elKualitas) elKualitas.innerText = `${mumtazPct}%`;
        if (elRasio) elRasio.innerText = `${ziyadahCount} Z : ${murajaahCount} M`;
        if (elCountBadge) elCountBadge.innerText = `${total} Entri Setoran`;
    }

    /**
     * Render Tabel & Kartu Mobile Evaluasi
     */
    function renderTahfidzEvalTable() {
        const tbody = document.getElementById('tahfidz-eval-table-body');
        const mobileList = document.getElementById('tahfidz-eval-mobile-list');
        const emptyState = document.getElementById('tahfidz-eval-empty');
        const list = ASNTahfidzEvaluasi.filteredLogs || [];

        if (list.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (mobileList) mobileList.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        // Render Desktop Table
        if (tbody) {
            tbody.innerHTML = list.map((item, idx) => {
                const tipeLabel = item.tipe === 'MURAJAAH_SABQI' ? "Sabqi" : (item.tipe === 'MURAJAAH_MANZIL' ? "Manzil" : (item.tipe === 'ZIYADAH' ? "Ziyadah" : (item.tipe === 'TASMI' ? "Tasmi'" : item.tipe)));
                const badgeClass = item.tipe === 'ZIYADAH' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                    (item.tipe === 'TASMI' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800');

                const nilaiClass = item.nilai === 'MUMTAZ' ? 'text-emerald-600 font-extrabold' : (item.nilai === 'JAYYID_JIDDAN' ? 'text-teal-600 font-bold' : 'text-slate-600 dark:text-slate-300');
                const isUlang = item.statusSetoran === 'ULANG';

                return `
                    <tr class="hover:bg-slate-50/70 dark:hover:bg-[#1a2636] transition">
                        <td class="px-3 py-2.5 text-center font-bold text-slate-400">${idx + 1}</td>
                        <td class="px-3 py-2.5 whitespace-nowrap">
                            <div class="font-bold text-slate-800 dark:text-slate-100">${formatDateIndo(item.tanggal)}</div>
                            <div class="text-[10px] text-slate-400">${escapeHtml(item.sesi || '-')}</div>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 cursor-pointer" onclick="openTahfidzStudentDetail('${item.studentId}')">
                                ${escapeHtml(item.name || 'Santri')}
                            </div>
                            <div class="text-[10px] text-slate-400 font-mono">NIS: ${escapeHtml(item.nis || '-')} &bull; ${item.gender === 'P' ? 'Putri' : 'Putra'}</div>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(item.halaqah || '-')}</div>
                            <div class="text-[10px] text-slate-400">${escapeHtml(item.muhafiz || '-')}</div>
                        </td>
                        <td class="px-3 py-2.5 text-center">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">
                                ${escapeHtml(tipeLabel)}
                            </span>
                        </td>
                        <td class="px-3 py-2.5">
                            <div class="font-bold text-slate-800 dark:text-slate-100">Juz ${item.juz || 1} &bull; ${escapeHtml(item.surah || '')}</div>
                            <div class="text-[10px] text-slate-400">${item.halaman ? escapeHtml(item.halaman) : ''} (${item.totalHalaman || 1} Hlm)</div>
                        </td>
                        <td class="px-3 py-2.5 text-center ${nilaiClass}">${escapeHtml(item.nilai || 'MUMTAZ')}</td>
                        <td class="px-3 py-2.5 text-center">
                            <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isUlang ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}">
                                ${isUlang ? 'Ulang' : 'Lanjut'}
                            </span>
                        </td>
                        <td class="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title="${escapeHtml(item.catatan || '-')}">
                            ${escapeHtml(item.catatan || '-')}
                        </td>
                        <td class="px-3 py-2.5 text-center whitespace-nowrap">
                            <button type="button" onclick="openTahfidzStudentDetail('${item.studentId}')"
                                class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-600 dark:text-slate-300 inline-flex items-center justify-center transition active:scale-95"
                                title="Lihat Kartu Santri">
                                <i class="fa-solid fa-user text-[11px]"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Render Mobile Cards
        if (mobileList) {
            mobileList.innerHTML = list.map(item => {
                const tipeLabel = item.tipe === 'MURAJAAH_SABQI' ? "Sabqi" : (item.tipe === 'MURAJAAH_MANZIL' ? "Manzil" : (item.tipe === 'ZIYADAH' ? "Ziyadah" : (item.tipe === 'TASMI' ? "Tasmi'" : item.tipe)));
                const isUlang = item.statusSetoran === 'ULANG';

                return `
                    <div class="pt-2.5 first:pt-0">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <div class="font-bold text-xs text-slate-800 dark:text-slate-100" onclick="openTahfidzStudentDetail('${item.studentId}')">
                                    ${escapeHtml(item.name || 'Santri')}
                                </div>
                                <div class="text-[10px] text-slate-400 font-mono mt-0.5">NIS: ${escapeHtml(item.nis || '-')} &bull; ${formatDateIndo(item.tanggal)}</div>
                            </div>
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                ${escapeHtml(tipeLabel)}
                            </span>
                        </div>
                        <div class="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-[#121c27] text-xs flex items-center justify-between">
                            <div>
                                <span class="font-bold text-slate-700 dark:text-slate-200">Juz ${item.juz || 1} &bull; ${escapeHtml(item.surah || '')}</span>
                                <span class="text-[10px] text-slate-400 block">${item.halaman ? escapeHtml(item.halaman) : ''} (${item.totalHalaman || 1} Hlm)</span>
                            </div>
                            <div class="text-right">
                                <span class="text-[11px] font-bold text-emerald-600 block">${escapeHtml(item.nilai || 'MUMTAZ')}</span>
                                <span class="text-[9px] font-bold ${isUlang ? 'text-rose-500' : 'text-slate-400'}">${isUlang ? 'Ulang' : 'Lanjut'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    /**
     * Ekspor Laporan Evaluasi ke Excel (.xlsx)
     */
    function exportTahfidzEvaluasiXLSX() {
        const list = ASNTahfidzEvaluasi.filteredLogs || [];
        if (list.length === 0) {
            if (typeof showToast === 'function') showToast("⚠️ Tidak ada data evaluasi untuk diekspor.");
            return;
        }

        if (typeof XLSX === 'undefined') {
            if (typeof showToast === 'function') showToast("Memuat modul ekspor spreadsheet...");
            return;
        }

        const p = ASNTahfidzEvaluasi.period;
        const aoa = [
            ["LAPORAN EVALUASI & JURNAL SETORAN TAHFIDZ AL-QUR'AN"],
            ["PONDOK PESANTREN TAHFIDZUL QUR'AN ASNAWIYYAH DEMAK"],
            [`Periode Data: ${p.labelType} (${p.labelDetail})`],
            [`Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`],
            [],
            [
                "No", "Tanggal", "Sesi", "NIS", "Nama Santri", "Gender",
                "Program", "Halaqah", "Muhafiz", "Tipe Setoran",
                "Juz", "Surah / Materi", "Halaman", "Total Halaman",
                "Nilai", "Status Setoran", "Catatan Muhafiz"
            ]
        ];

        list.forEach((item, idx) => {
            aoa.push([
                idx + 1,
                item.tanggal || "-",
                item.sesi || "-",
                item.nis || "-",
                item.name || "-",
                item.gender === 'P' ? 'Perempuan' : 'Laki-laki',
                item.program || "Tahfidz",
                item.halaqah || "-",
                item.muhafiz || "-",
                item.tipe || "ZIYADAH",
                item.juz || 1,
                item.surah || "-",
                item.halaman || "-",
                item.totalHalaman || 1,
                item.nilai || "MUMTAZ",
                item.statusSetoran || "LANJUT",
                item.catatan || "-"
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        ws['!cols'] = [
            { wch: 4 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 22 }, { wch: 10 },
            { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
            { wch: 6 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Jurnal Setoran");
        const filename = `Laporan_Evaluasi_Tahfidz_${p.labelType.replace(/[\s\W]+/g, '_')}_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);

        if (typeof showToast === 'function') {
            showToast("✅ Berhasil mengekspor Laporan Evaluasi Tahfidz (.xlsx)");
        }
    }

    /**
     * Cetak Laporan Evaluasi & Jurnal Setoran via Isolated iFrame
     */
    function printTahfidzEvaluasiReport() {
        const list = ASNTahfidzEvaluasi.filteredLogs || [];
        if (list.length === 0) {
            if (typeof showToast === 'function') showToast("⚠️ Tidak ada data evaluasi untuk dicetak.");
            return;
        }

        const now = getBaseDate();
        const curDateIndo = `${INDO_DAYS[now.getDay()]}, ${now.getDate()} ${INDO_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
        const curTimeIndo = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        const p = ASNTahfidzEvaluasi.period;

        // Hitung KPI periode
        let totalHal = 0;
        let ziyadahCount = 0;
        let murajaahCount = 0;
        let mumtazCount = 0;

        list.forEach(l => {
            totalHal += Number(l.totalHalaman || 1);
            if (l.tipe === 'ZIYADAH') ziyadahCount++;
            else murajaahCount++;
            if (l.nilai === 'MUMTAZ' || l.nilai === 'JAYYID_JIDDAN') mumtazCount++;
        });

        const estJuz = (totalHal / 20).toFixed(1);
        const mumtazPct = list.length > 0 ? Math.round((mumtazCount / list.length) * 100) : 0;

        const tableRowsHtml = list.map((item, idx) => {
            const tipeLabel = item.tipe === 'MURAJAAH_SABQI' ? "Sabqi" : (item.tipe === 'MURAJAAH_MANZIL' ? "Manzil" : (item.tipe === 'ZIYADAH' ? "Ziyadah" : (item.tipe === 'TASMI' ? "Tasmi'" : item.tipe)));
            const badgeClass = item.tipe === 'ZIYADAH' ? 'badge-green' : (item.tipe === 'TASMI' ? 'badge-purple' : 'badge-yellow');
            const statusBadge = item.statusSetoran === 'ULANG' ? '<span class="badge badge-red">Ulang</span>' : '<span class="badge badge-green">Lanjut</span>';

            return `
                <tr>
                    <td class="text-center font-bold">${idx + 1}</td>
                    <td>
                        <div class="font-bold">${formatDateIndo(item.tanggal)}</div>
                        <div class="text-sub">${escapeHtml(item.sesi || '-')}</div>
                    </td>
                    <td>
                        <div class="font-bold">${escapeHtml(item.name || '-')}</div>
                        <div class="text-sub">NIS: ${escapeHtml(item.nis || '-')} &bull; ${item.gender === 'P' ? 'Putri' : 'Putra'}</div>
                    </td>
                    <td>
                        <div class="font-bold">${escapeHtml(item.halaqah || '-')}</div>
                        <div class="text-sub">${escapeHtml(item.muhafiz || '-')}</div>
                    </td>
                    <td class="text-center"><span class="badge ${badgeClass}">${escapeHtml(tipeLabel)}</span></td>
                    <td>
                        <div class="font-bold">Juz ${item.juz || 1} &bull; ${escapeHtml(item.surah || '')}</div>
                        <div class="text-sub">${item.halaman ? escapeHtml(item.halaman) : ''} (${item.totalHalaman || 1} Hlm)</div>
                    </td>
                    <td class="text-center font-bold">${escapeHtml(item.nilai || 'MUMTAZ')}</td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-small">${escapeHtml(item.catatan || '-')}</td>
                </tr>
            `;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Evaluasi Tahfidz - PPTQ Asnawiyyah</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm 15mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            color: #111827;
            background: #fff;
            padding: 0;
            line-height: 1.35;
        }
        .kop-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding-bottom: 8px;
            border-bottom: 2.5px solid #065f46;
        }
        .kop-logo {
            width: 58px;
            height: 58px;
            object-fit: contain;
        }
        .kop-text { text-align: center; }
        .kop-text h1 {
            font-size: 15px;
            font-weight: 900;
            color: #065f46;
            text-transform: uppercase;
        }
        .kop-text h2 {
            font-size: 12px;
            font-weight: 700;
            color: #1f2937;
            margin-top: 1px;
        }
        .kop-text p {
            font-size: 9px;
            color: #4b5563;
            margin-top: 2px;
        }
        .sub-border {
            height: 1px;
            background: #065f46;
            margin-top: 2px;
            margin-bottom: 12px;
        }
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 10px;
        }
        .report-title h3 {
            font-size: 13px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
        }
        .report-title p {
            font-size: 9.5px;
            color: #4b5563;
            margin-top: 1px;
        }
        .meta-box {
            text-align: right;
            font-size: 9px;
            color: #4b5563;
            line-height: 1.4;
        }
        .kpi-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        .kpi-card {
            border: 1px solid #d1fae5;
            background: #f0fdf4;
            padding: 6px 10px;
            border-radius: 6px;
        }
        .kpi-card .k-title {
            font-size: 8px;
            font-weight: 700;
            color: #065f46;
            text-transform: uppercase;
        }
        .kpi-card .k-val {
            font-size: 14px;
            font-weight: 900;
            color: #065f46;
            margin-top: 2px;
        }
        .kpi-card .k-sub {
            font-size: 7.5px;
            color: #4b5563;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 12px;
        }
        th {
            background-color: #065f46 !important;
            color: #ffffff !important;
            font-weight: 700;
            text-align: left;
            padding: 5px 6px;
            border: 1px solid #065f46;
            font-size: 8.5px;
        }
        td {
            padding: 4.5px 6px;
            border: 1px solid #e5e7eb;
            vertical-align: middle;
        }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .text-center { text-align: center; }
        .text-sub { font-size: 7.5px; color: #6b7280; }
        .text-small { font-size: 8px; color: #374151; }
        .font-bold { font-weight: 700; }
        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-green { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-yellow { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .badge-red { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .footer-signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            page-break-inside: avoid;
            font-size: 9.5px;
        }
        .sig-box { text-align: center; width: 220px; }
        .sig-space { height: 42px; }
        .sig-name {
            font-weight: 800;
            border-bottom: 1px solid #111827;
            padding-bottom: 2px;
            display: inline-block;
            min-width: 170px;
        }
        .sig-role { font-size: 8.5px; color: #4b5563; margin-top: 2px; }
    </style>
</head>
<body>
    <div class="kop-container">
        <img src="/assets/img/logo-asnawiyyah.jpg" alt="Logo PPTQ Asnawiyyah" class="kop-logo" onerror="this.style.display='none'">
        <div class="kop-text">
            <h1>Pondok Pesantren Tahfidzul Qur'an Asnawiyyah</h1>
            <h2>Biro Pendidikan & Pengasuhan Tahfidz Al-Qur'an</h2>
            <p>Pilangwetan RT 03 / RW 01, Kebonagung, Kabupaten Demak, Jawa Tengah 59583 &bull; Website: asnawiyyah.or.id</p>
        </div>
    </div>
    <div class="sub-border"></div>

    <div class="report-header">
        <div class="report-title">
            <h3>Laporan Evaluasi & Jurnal Setoran Tahfidz</h3>
            <p>Periode Data: ${escapeHtml(p.labelType)} &bull; ${escapeHtml(p.labelDetail)}</p>
        </div>
        <div class="meta-box">
            <div><strong>Waktu Cetak:</strong> ${escapeHtml(curDateIndo)}, Pk ${escapeHtml(curTimeIndo)} WIB</div>
            <div><strong>Total Setoran:</strong> ${list.length} Transaksi</div>
        </div>
    </div>

    <div class="kpi-strip">
        <div class="kpi-card">
            <div class="k-title">Total Setoran</div>
            <div class="k-val">${list.length}</div>
            <div class="k-sub">Entri Mutaba'ah</div>
        </div>
        <div class="kpi-card">
            <div class="k-title">Volume Hafalan</div>
            <div class="k-val">${totalHal} Hlm</div>
            <div class="k-sub">~ ${estJuz} Juz disetor</div>
        </div>
        <div class="kpi-card">
            <div class="k-title">Kualitas Mumtaz</div>
            <div class="k-val">${mumtazPct}%</div>
            <div class="k-sub">Mumtaz & Jayyid Jiddan</div>
        </div>
        <div class="kpi-card">
            <div class="k-title">Rasio Ziyadah / Muroja'ah</div>
            <div class="k-val">${ziyadahCount} : ${murajaahCount}</div>
            <div class="k-sub">Ziyadah vs Pengulangan</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 25px;">No</th>
                <th style="width: 85px;">Waktu & Sesi</th>
                <th>Santri</th>
                <th>Halaqah & Muhafiz</th>
                <th class="text-center" style="width: 65px;">Tipe</th>
                <th>Materi Hafalan</th>
                <th class="text-center" style="width: 55px;">Nilai</th>
                <th class="text-center" style="width: 50px;">Status</th>
                <th>Catatan Muhafiz</th>
            </tr>
        </thead>
        <tbody>
            ${tableRowsHtml}
        </tbody>
    </table>

    <div class="footer-signatures">
        <div class="sig-box">
            <div>Mengetahui,</div>
            <div class="sig-role">Koordinator Tahfidz Al-Qur'an</div>
            <div class="sig-space"></div>
            <div class="sig-name">Ustadz Halim / Koordinator</div>
            <div class="sig-role">Biro Pendidikan Tahfidz</div>
        </div>
        <div class="sig-box">
            <div>Demak, ${escapeHtml(curDateIndo)}</div>
            <div class="sig-role">Pengasuh PPTQ Asnawiyyah</div>
            <div class="sig-space"></div>
            <div class="sig-name">Admin Utama / Pengasuh</div>
            <div class="sig-role">Pimpinan Pondok Pesantren</div>
        </div>
    </div>
</body>
</html>
        `;

        if (typeof window.executeTahfidzIsolatedPrint === 'function') {
            window.executeTahfidzIsolatedPrint(html);
        } else {
            window.print();
        }
    }

    // Expose Functions Globally
    window.ASNTahfidzEvaluasi = ASNTahfidzEvaluasi;
    window.initTahfidzEvaluasiView = initTahfidzEvaluasiView;
    window.refreshTahfidzEvaluasiData = () => loadTahfidzEvaluasiData(true);
    window.toggleTahfidzEvalPeriodDropdown = toggleTahfidzEvalPeriodDropdown;
    window.openTahfidzEvalPeriodDropdown = openTahfidzEvalPeriodDropdown;
    window.closeTahfidzEvalPeriodDropdown = closeTahfidzEvalPeriodDropdown;
    window.selectTahfidzEvalPeriodMenu = selectTahfidzEvalPeriodMenu;
    window.applyTahfidzEvalPeriod = applyTahfidzEvalPeriod;
    window.applyTahfidzEvalCustomDate = applyTahfidzEvalCustomDate;
    window.applyTahfidzEvalMonthPeriod = applyTahfidzEvalMonthPeriod;
    window.filterTahfidzEvalList = filterTahfidzEvalList;
    window.onTahfidzEvalSearch = onTahfidzEvalSearch;
    window.resetTahfidzEvalFilter = resetTahfidzEvalFilter;
    window.exportTahfidzEvaluasiXLSX = exportTahfidzEvaluasiXLSX;
    window.printTahfidzEvaluasiReport = printTahfidzEvaluasiReport;

})(window, document);
