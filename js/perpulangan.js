/**
 * Asnawiyyah - Modul 20: Izin Santri & Perpulangan
 * Author: Antigravity IDE / PPTQ Asnawiyyah
 * Description: Controller lengkap untuk alur perizinan santri:
 *              1. Pengajuan Izin (Wali / Admin / Pengurus)
 *              2. Two-Tier Approval (Tier 1 Pengurus -> Tier 2 Dewan Pengasuh)
 *              3. Pos Gerbang Keamanan (QR Check-Out & Check-In dengan deteksi keterlambatan)
 *              4. Cetak Surat Jalan & Kartu Izin Resmi (Kop Pesantren & QR Verifikasi)
 */

(function (window, document) {
    'use strict';

    // State Management Modul Perpulangan
    const ASNPerpulangan = {
        list: [],
        filteredList: [],
        activeFilter: 'ALL',
        searchQuery: '',
        isLoading: false,
        selectedIzin: null,
        stats: {
            total: 0,
            menungguPengurus: 0,
            menungguPengasuh: 0,
            disetujui: 0,
            keluar: 0,
            kembali: 0,
            terlambat: 0,
            ditolak: 0
        }
    };

    window.ASNPerpulangan = ASNPerpulangan;

    // Helper: Dapatkan Role Pengguna Aktif
    function getCurrentUserRole() {
        const savedAdmin = sessionStorage.getItem('ASN_ADMIN_ROLE') || 
                           sessionStorage.getItem('asnawiyyah_admin_role') || 
                           localStorage.getItem('asnawiyyah_admin_role');
        if (savedAdmin && String(savedAdmin).toUpperCase() !== 'WALI_SANTRI') {
            return String(savedAdmin).toUpperCase();
        }
        if (window.ASNIdentity && window.ASNIdentity.currentRole) {
            return String(window.ASNIdentity.currentRole).toUpperCase();
        }
        return String(savedAdmin || 'ADMIN').toUpperCase();
    }

    // Helper: Format Tanggal Indonesia
    function formatDateIndo(dateStr) {
        if (!dateStr) return '-';
        try {
            if (dateStr instanceof Date) {
                return dateStr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            const s = String(dateStr).trim();
            // Cek format YYYY-MM-DD
            const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoMatch) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const day = parseInt(isoMatch[3], 10);
                const month = months[parseInt(isoMatch[2], 10) - 1] || isoMatch[2];
                const year = isoMatch[1];
                return `${day} ${month} ${year}`;
            }
            // Cek parsing Date standar JS / GAS
            const parsed = new Date(s);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
                return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            return s;
        } catch (e) {
            return dateStr;
        }
    }

    // Helper: Format Jam
    function formatTimeIndo(timeStr) {
        if (!timeStr) return '';
        try {
            const s = String(timeStr).trim();
            // Cocokkan jam:menit
            const m = s.match(/(\d{1,2}):(\d{2})/);
            if (m) {
                return `${m[1].padStart(2, '0')}:${m[2]} WIB`;
            }
            return `${s} WIB`;
        } catch (e) {
            return `${timeStr} WIB`;
        }
    }

    // Helper: Dapatkan Badge Status dengan Warna Harmonis
    function getStatusBadgeConfig(status) {
        const s = String(status || '').toUpperCase();
        switch (s) {
            case 'MENUNGGU_PENGURUS':
                return {
                    label: 'Menunggu Pengurus (Tier 1)',
                    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
                    dot: 'bg-amber-500',
                    icon: 'fa-user-clock'
                };
            case 'MENUNGGU_PENGASUH':
                return {
                    label: 'Menunggu Pengasuh (Tier 2)',
                    bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
                    dot: 'bg-indigo-500',
                    icon: 'fa-hands-praying'
                };
            case 'DISETUJUI':
                return {
                    label: 'Disetujui (Siap Berangkat)',
                    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
                    dot: 'bg-emerald-500',
                    icon: 'fa-circle-check'
                };
            case 'KELUAR':
                return {
                    label: 'Santri di Luar Pondok',
                    bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
                    dot: 'bg-sky-500 animate-pulse',
                    icon: 'fa-person-walking-luggage'
                };
            case 'KEMBALI':
                return {
                    label: 'Kembali (Selesai Tepat Waktu)',
                    bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
                    dot: 'bg-teal-500',
                    icon: 'fa-circle-check'
                };
            case 'TERLAMBAT':
                return {
                    label: 'Terlambat Masuk',
                    bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
                    dot: 'bg-rose-500 animate-ping',
                    icon: 'fa-triangle-exclamation'
                };
            case 'DITOLAK':
                return {
                    label: 'Permohonan Ditolak',
                    bg: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-200/80 dark:border-red-800/60',
                    dot: 'bg-red-500',
                    icon: 'fa-circle-xmark'
                };
            default:
                return {
                    label: s || 'Draft',
                    bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    dot: 'bg-slate-400',
                    icon: 'fa-clock'
                };
        }
    }

    /**
     * Memuat Seluruh Data Perizinan Perpulangan
     */
    async function loadPerpulanganData(forceRefresh = false) {
        const tableBody = document.getElementById('perpulangan-table-body');
        const emptyState = document.getElementById('perpulangan-empty-state');
        const loadingSkeleton = document.getElementById('perpulangan-loading-skeleton');

        ASNPerpulangan.isLoading = true;
        if (loadingSkeleton) loadingSkeleton.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (tableBody) tableBody.innerHTML = '';

        try {
            if (typeof window.getIzinPerpulanganList !== 'function') {
                throw new Error('Fungsi API getIzinPerpulanganList belum tersedia.');
            }

            const response = await window.getIzinPerpulanganList();
            let rawList = [];

            if (response && response.status === 'success' && Array.isArray(response.data)) {
                rawList = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
                rawList = response.data;
            } else if (Array.isArray(response)) {
                rawList = response;
            }

            ASNPerpulangan.list = rawList;
            calculatePerpulanganMetrics(rawList);
            renderPerpulanganMetrics();
            applyPerpulanganFilterAndSearch();

            if (typeof showToast === 'function' && forceRefresh) {
                showToast('Data perizinan santri berhasil diperbarui.', 'success');
            }
        } catch (error) {
            console.error('[ASNPerpulangan] Gagal memuat data:', error);
            if (typeof showToast === 'function') {
                showToast(`Gagal memuat data izin: ${error.message}`, 'error');
            }
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-4 py-8 text-center text-xs text-rose-500 dark:text-rose-400">
                            <i class="fa-solid fa-triangle-exclamation text-xl mb-2 block"></i>
                            Gagal memuat data perizinan santri. Silakan klik tombol "Refresh".
                        </td>
                    </tr>
                `;
            }
        } finally {
            ASNPerpulangan.isLoading = false;
            if (loadingSkeleton) loadingSkeleton.classList.add('hidden');
        }
    }

    /**
     * Hitung Angka Ringkasan Metrics
     */
    function calculatePerpulanganMetrics(list) {
        const stats = {
            total: list.length,
            menungguPengurus: 0,
            menungguPengasuh: 0,
            disetujui: 0,
            keluar: 0,
            kembali: 0,
            terlambat: 0,
            ditolak: 0
        };

        list.forEach(item => {
            const st = String(item.status || '').toUpperCase();
            if (st === 'MENUNGGU_PENGURUS') stats.menungguPengurus++;
            else if (st === 'MENUNGGU_PENGASUH') stats.menungguPengasuh++;
            else if (st === 'DISETUJUI') stats.disetujui++;
            else if (st === 'KELUAR') stats.keluar++;
            else if (st === 'KEMBALI') stats.kembali++;
            else if (st === 'TERLAMBAT') stats.terlambat++;
            else if (st === 'DITOLAK') stats.ditolak++;
        });

        ASNPerpulangan.stats = stats;
    }

    /**
     * Tampilkan Statistik pada Card UI
     */
    function renderPerpulanganMetrics() {
        const s = ASNPerpulangan.stats;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setVal('perpulangan-metric-total', s.total);
        setVal('perpulangan-metric-pengurus', s.menungguPengurus);
        setVal('perpulangan-metric-pengasuh', s.menungguPengasuh);
        setVal('perpulangan-metric-disetujui', s.disetujui);
        setVal('perpulangan-metric-keluar', s.keluar);
        setVal('perpulangan-metric-kembali', s.kembali);
        setVal('perpulangan-metric-terlambat', s.terlambat);
        setVal('perpulangan-metric-ditolak', s.ditolak);
    }

    /**
     * Ganti Filter Tab Status
     */
    function setPerpulanganFilter(filterKey) {
        ASNPerpulangan.activeFilter = filterKey;

        // Update styling tombol tab filter
        document.querySelectorAll('.perpulangan-filter-btn').forEach(btn => {
            const key = btn.dataset.filter;
            if (key === filterKey) {
                btn.className = 'perpulangan-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm transition active:scale-95';
            } else {
                btn.className = 'perpulangan-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#1c2836] dark:hover:bg-[#253447] dark:text-slate-300 transition active:scale-95';
            }
        });

        applyPerpulanganFilterAndSearch();
    }

    /**
     * Handler Pencarian
     */
    function handlePerpulanganSearch(query) {
        ASNPerpulangan.searchQuery = String(query || '').trim().toLowerCase();
        applyPerpulanganFilterAndSearch();
    }

    /**
     * Terapkan Filter & Pencarian ke Tabel
     */
    function applyPerpulanganFilterAndSearch() {
        let result = [...ASNPerpulangan.list];

        // 1. Filter Status
        const filter = ASNPerpulangan.activeFilter;
        if (filter !== 'ALL') {
            result = result.filter(item => String(item.status || '').toUpperCase() === filter);
        }

        // 2. Pencarian
        const q = ASNPerpulangan.searchQuery;
        if (q) {
            result = result.filter(item => {
                const sName = String(item.student_name || item.nama_santri || '').toLowerCase();
                const sNis = String(item.student_nis || item.nis || '').toLowerCase();
                const idIzin = String(item.id_izin || item.id || '').toLowerCase();
                const alasan = String(item.alasan || '').toLowerCase();
                const wali = String(item.wali_name || item.penjemput_nama || '').toLowerCase();
                return sName.includes(q) || sNis.includes(q) || idIzin.includes(q) || alasan.includes(q) || wali.includes(q);
            });
        }

        ASNPerpulangan.filteredList = result;
        renderPerpulanganTable();
    }

    /**
     * Render Baris Tabel Perizinan Santri (Desktop Tabular & Mobile Card List)
     */
    function renderPerpulanganTable() {
        const tableBody = document.getElementById('perpulangan-table-body');
        const cardsContainer = document.getElementById('perpulangan-mobile-cards');
        const emptyState = document.getElementById('perpulangan-empty-state');
        const counterEl = document.getElementById('perpulangan-table-count');

        if (!tableBody && !cardsContainer) return;

        const list = ASNPerpulangan.filteredList;
        if (counterEl) counterEl.innerText = `${list.length} Data Ditampilkan`;

        if (list.length === 0) {
            if (tableBody) tableBody.innerHTML = '';
            if (cardsContainer) cardsContainer.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        const role = getCurrentUserRole();
        const isSuperAdmin = role === 'SUPER_ADMIN';
        const isAdmin = role === 'ADMIN';
        const isPengurus = ['PENGURUS', 'PENGURUS_KEAMANAN', 'KEAMANAN'].includes(role);
        const isAsatidz = ['ASATIDZ', 'DEWAN_ASATIDZ', 'GURU'].includes(role);
        const isPengasuh = ['PENGASUH', 'MASYAYIKH'].includes(role);

        // Hak Akses: Asatidz & Pengurus dapat melakukan Tier 1; Dewan Pengasuh & Admin dapat Tier 2
        const canTier1 = isSuperAdmin || isAdmin || isPengurus || isAsatidz || (role !== 'WALI_SANTRI');
        const canTier2 = isSuperAdmin || isPengasuh || isAdmin || (role !== 'WALI_SANTRI');
        const canGate = canTier1;

        let tableHtml = '';
        let cardsHtml = '';

        list.forEach((item, index) => {
            const idIzin = item.id_izin || item.idIzin || item.id || `IZN-${index + 1}`;
            const studentName = item.student_name || item.studentName || item.nama_santri || item.nama || 'Santri';
            const studentNis = item.student_nis || item.studentNis || item.nis || '-';
            const kategori = item.kategori || 'Izin Biasa';
            const alasan = item.alasan || '-';
            const penjemput = item.penjemput_nama || item.penjemputNama || item.wali_name || item.waliName || '-';
            const hubungan = item.penjemput_hubungan || item.penjemputHubungan || 'Keluarga';
            const noHp = item.penjemput_kontak || item.penjemputKontak || item.wali_phone || item.waliPhone || '';
            const tglMulai = formatDateIndo(item.tgl_mulai || item.tglMulai);
            const jamMulai = formatTimeIndo(item.jam_mulai || item.jamMulai);
            const tglKembali = formatDateIndo(item.tgl_kembali || item.tglKembali);
            const jamKembali = formatTimeIndo(item.jam_kembali || item.jamKembali);
            const status = String(item.status || 'MENUNGGU_PENGURUS').toUpperCase();
            const badgeCfg = getStatusBadgeConfig(status);

            // Logika Akses Aksi Berdasarkan Peran & Status Izin
            let actionButtons = `
                <button type="button" onclick="window.ASNPerpulangan.openModalDetail('${idIzin}')" 
                    class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1c2836] dark:hover:bg-[#253447] dark:text-slate-300 transition active:scale-95" 
                    title="Lihat Detail & Timeline Izin">
                    <i class="fa-solid fa-eye text-xs"></i>
                </button>
            `;

            // Cetak Surat Izin (Hanya jika disetujui / keluar / kembali / terlambat)
            if (['DISETUJUI', 'KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(status)) {
                actionButtons += `
                    <button type="button" onclick="window.ASNPerpulangan.openModalPrintSuratIzin('${idIzin}')" 
                        class="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 transition active:scale-95" 
                        title="Cetak Surat Jalan & QR Code">
                        <i class="fa-solid fa-print text-xs"></i>
                    </button>
                `;
            }

            // Aksi Tier 1: Persetujuan Pengurus Keamanan / Asatidz Piket
            if (status === 'MENUNGGU_PENGURUS' && canTier1) {
                actionButtons += `
                    <button type="button" onclick="window.ASNPerpulangan.openModalApproval('${idIzin}', 'PENGURUS')" 
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm" 
                        title="Setujui Tier 1 (Pengurus / Asatidz)">
                        <i class="fa-solid fa-check text-[11px]"></i>
                        <span>Tier 1</span>
                    </button>
                    <button type="button" onclick="window.ASNPerpulangan.openModalReject('${idIzin}')" 
                        class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 transition active:scale-95" 
                        title="Tolak Permohonan Izin">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                `;
            }

            // Aksi Tier 2: Persetujuan Dewan Pengasuh / Masyayikh
            if (status === 'MENUNGGU_PENGASUH' && canTier2) {
                actionButtons += `
                    <button type="button" onclick="window.ASNPerpulangan.openModalApproval('${idIzin}', 'PENGASUH')" 
                        class="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm" 
                        title="Persetujuan Akhir Dewan Pengasuh">
                        <i class="fa-solid fa-hands-praying text-[11px]"></i>
                        <span>Tier 2 (Pengasuh)</span>
                    </button>
                    <button type="button" onclick="window.ASNPerpulangan.openModalReject('${idIzin}')" 
                        class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 transition active:scale-95" 
                        title="Tolak Permohonan Izin">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                `;
            }

            // Aksi Pos Gerbang: Check-Out (Santri Keluar Gerbang)
            if (status === 'DISETUJUI' && canGate) {
                actionButtons += `
                    <button type="button" onclick="window.ASNPerpulangan.openModalGateCheck('${idIzin}', 'OUT')" 
                        class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm" 
                        title="Check-Out Pos Gerbang (Santri Keluar)">
                        <i class="fa-solid fa-door-open text-[11px]"></i>
                        <span>Check-Out</span>
                    </button>
                `;
            }

            // Aksi Pos Gerbang: Check-In (Santri Masuk Kembali ke Pondok)
            if (status === 'KELUAR' && canGate) {
                actionButtons += `
                    <button type="button" onclick="window.ASNPerpulangan.openModalGateCheck('${idIzin}', 'IN')" 
                        class="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm" 
                        title="Check-In Pos Gerbang (Santri Tiba di Pondok)">
                        <i class="fa-solid fa-right-to-bracket text-[11px]"></i>
                        <span>Check-In</span>
                    </button>
                `;
            }

            // WhatsApp Penjemput Action
            let waButton = '';
            let waButtonMobile = '';
            if (noHp) {
                const cleanPhone = noHp.replace(/\D/g, '').replace(/^0/, '62');
                waButton = `
                    <a href="https://wa.me/${cleanPhone}?text=Assalamu%27alaikum%20Warahmatullah%2C%20terkait%20izin%20santri%20${encodeURIComponent(studentName)}" 
                        target="_blank" rel="noopener noreferrer" 
                        class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-[11px] ml-1" 
                        title="Hubungi via WhatsApp">
                        <i class="fa-brands fa-whatsapp text-xs text-emerald-500"></i> ${noHp}
                    </a>
                `;
                waButtonMobile = `
                    <a href="https://wa.me/${cleanPhone}?text=Assalamu%27alaikum%20Warahmatullah%2C%20terkait%20izin%20santri%20${encodeURIComponent(studentName)}" 
                        target="_blank" rel="noopener noreferrer" 
                        class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-[11px]" 
                        title="Hubungi Penjemput via WhatsApp">
                        <i class="fa-brands fa-whatsapp text-xs text-emerald-500"></i> ${noHp}
                    </a>
                `;
            }

            // 1. Render Baris Tabel Desktop (md: ke atas)
            tableHtml += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1a2634] transition-colors border-b border-slate-100 dark:border-[#223142]">
                    <!-- No & ID Izin -->
                    <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        <span class="font-bold text-slate-700 dark:text-slate-200">#${index + 1}</span>
                        <div class="font-mono text-[10px] text-slate-400 dark:text-slate-300 mt-0.5">${idIzin}</div>
                    </td>

                    <!-- Data Santri -->
                    <td class="px-4 py-3">
                        <div class="flex items-center space-x-2.5">
                            <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                                ${studentName.charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0">
                                <span class="font-bold text-xs text-slate-800 dark:text-slate-100 block truncate">${studentName}</span>
                                <span class="text-[11px] text-slate-400 dark:text-slate-300">NIS: ${studentNis}</span>
                            </div>
                        </div>
                    </td>

                    <!-- Kategori & Alasan -->
                    <td class="px-4 py-3 text-xs max-w-xs">
                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-[#1c2836] dark:text-slate-300 mb-1 border border-slate-200/60 dark:border-slate-700/60">
                            ${kategori}
                        </span>
                        <p class="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed" title="${alasan}">
                            ${alasan}
                        </p>
                    </td>

                    <!-- Penjemput & Kontak -->
                    <td class="px-4 py-3 text-xs whitespace-nowrap">
                        <div class="font-semibold text-slate-700 dark:text-slate-200">${penjemput}</div>
                        <div class="text-[11px] text-slate-400 dark:text-slate-300">Hubungan: ${hubungan}</div>
                        ${waButton}
                    </td>

                    <!-- Waktu Izin & Batas Kembali -->
                    <td class="px-4 py-3 text-xs whitespace-nowrap">
                        <div class="text-slate-700 dark:text-slate-200">
                            <span class="text-slate-400 dark:text-slate-300">Keluar:</span> ${tglMulai} ${jamMulai}
                        </div>
                        <div class="font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                            <span class="text-slate-400 dark:text-slate-300">Kembali:</span> ${tglKembali} ${jamKembali}
                        </div>
                    </td>

                    <!-- Status Badge -->
                    <td class="px-4 py-3 whitespace-nowrap text-xs">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeCfg.bg}">
                            <span class="w-1.5 h-1.5 rounded-full ${badgeCfg.dot}"></span>
                            <i class="fa-solid ${badgeCfg.icon} text-[10px]"></i>
                            <span>${badgeCfg.label}</span>
                        </span>
                    </td>

                    <!-- Aksi -->
                    <td class="px-4 py-3 whitespace-nowrap text-xs text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;

            // 2. Render Kartu Mobile (Layar Smartphone: 100% Fit, Responsif & Tanpa Scroll Horizontal)
            cardsHtml += `
                <div class="p-3.5 hover:bg-slate-50/60 dark:hover:bg-[#1a2634]/60 transition-colors space-y-2.5">
                    <!-- Header Kartu: No, ID Izin, dan Status Badge -->
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 min-w-0">
                            <span class="font-bold text-xs text-slate-700 dark:text-slate-200">#${index + 1}</span>
                            <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1e2a38] px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-[#2b3a4d]">${idIzin}</span>
                        </div>
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCfg.bg}">
                                <span class="w-1.5 h-1.5 rounded-full ${badgeCfg.dot}"></span>
                                <i class="fa-solid ${badgeCfg.icon} text-[9px]"></i>
                                <span>${badgeCfg.label}</span>
                            </span>
                        </div>
                    </div>

                    <!-- Profil Santri & Kategori -->
                    <div class="flex items-start gap-2.5">
                        <div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800 mt-0.5">
                            ${studentName.charAt(0).toUpperCase()}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-1">
                                <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">${studentName}</h4>
                                <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 dark:bg-[#1c2836] dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-slate-700/60">${kategori}</span>
                            </div>
                            <div class="text-[11px] text-slate-400 dark:text-slate-300">NIS: ${studentNis}</div>
                        </div>
                    </div>

                    <!-- Kotak Rincian Keperluan, Penjemput, & Jadwal -->
                    <div class="bg-slate-50 dark:bg-[#182330] rounded-xl p-2.5 text-[11px] space-y-1.5 border border-slate-100 dark:border-[#223142]">
                        <div class="text-slate-600 dark:text-slate-300 leading-snug">
                            <span class="font-semibold text-slate-500 dark:text-slate-400">Keperluan:</span> ${alasan}
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-y-1 text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-[#223142]">
                            <div>
                                <span class="font-semibold text-slate-600 dark:text-slate-300">Penjemput:</span> ${penjemput} <span class="text-slate-400 text-[10px]">(${hubungan})</span>
                            </div>
                            ${waButtonMobile}
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#223142] text-[10.5px]">
                            <div>
                                <span class="text-slate-400 dark:text-slate-400 block text-[9.5px]">Keluar:</span>
                                <span class="font-medium text-slate-700 dark:text-slate-200">${tglMulai} ${jamMulai}</span>
                            </div>
                            <div>
                                <span class="text-amber-600 dark:text-amber-400 block text-[9.5px]">Batas Kembali:</span>
                                <span class="font-semibold text-amber-700 dark:text-amber-400">${tglKembali} ${jamKembali}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Tombol Aksi (Tampil Utuh & Nyaman di-tap di HP) -->
                    <div class="flex items-center justify-end gap-1.5 pt-1">
                        ${actionButtons}
                    </div>
                </div>
            `;
        });

        if (tableBody) tableBody.innerHTML = tableHtml;
        if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
    }

    /**
     * Dapatkan Seluruh Master Santri dari Memori / Cache / Backend
     */
    function getAllAvailableStudents() {
        const isWali = (window.ASNIdentity && window.ASNIdentity.currentRole === 'WALI_SANTRI') || (typeof getCurrentUserRole === 'function' && getCurrentUserRole() === 'WALI_SANTRI');

        // Jika Wali Santri, ambil linkedStudents
        if (isWali && window.ASNIdentity && Array.isArray(window.ASNIdentity.linkedStudents) && window.ASNIdentity.linkedStudents.length > 0) {
            return window.ASNIdentity.linkedStudents;
        }

        // Ambil dari window.adminStudentsData
        if (Array.isArray(window.adminStudentsData) && window.adminStudentsData.length > 0) {
            return window.adminStudentsData;
        }
        if (Array.isArray(window.adminStudentsList) && window.adminStudentsList.length > 0) {
            return window.adminStudentsList;
        }

        // Ambil dari localStorage cache jika ada
        try {
            const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    window.adminStudentsData = parsed;
                    return parsed;
                }
            }
        } catch (e) {}

        // Fallback global santriData
        if (Array.isArray(window.santriData) && window.santriData.length > 0) {
            return window.santriData;
        }
        if (window.ASNStudents && Array.isArray(window.ASNStudents.list) && window.ASNStudents.list.length > 0) {
            return window.ASNStudents.list;
        }

        return [];
    }

    /**
     * Pastikan Master Santri Ter-load di background jika memori kosong
     */
    async function ensureStudentsLoaded() {
        const current = getAllAvailableStudents();
        if (current.length > 0) {
            updateStudentIndicator(current.length);
            return current;
        }

        try {
            const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
            let res = null;
            if (typeof apiGet === 'function') {
                res = await apiGet('getStudents', token ? { token } : {});
            } else if (typeof apiPost === 'function') {
                res = await apiPost('getStudents', { token });
            }

            if (res && (res.status === 'success' || res.success) && Array.isArray(res.data)) {
                window.adminStudentsData = res.data;
                try {
                    localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify(res.data));
                } catch(e) {}
                updateStudentIndicator(res.data.length);
                return res.data;
            }
        } catch (err) {
            console.warn('[ASNPerpulangan] Gagal preload master santri:', err);
        }
        return [];
    }

    function updateStudentIndicator(count) {
        const ind = document.getElementById('perpulangan-student-data-indicator');
        if (ind) {
            ind.innerHTML = `<i class="fa-solid fa-circle-check text-[9px] text-emerald-500"></i> ${count} Santri Terhubung`;
        }
    }

    /**
     * Live Search Input Handler untuk Santri
     */
    function onSearchStudentInput(query) {
        const clearBtn = document.getElementById('perpulangan-student-search-clear-btn');
        if (clearBtn) {
            if (query && query.trim()) clearBtn.classList.remove('hidden');
            else clearBtn.classList.add('hidden');
        }

        renderStudentSearchDropdown(query);
    }

    function onSearchStudentFocus() {
        const input = document.getElementById('perpulangan-student-search-input');
        renderStudentSearchDropdown(input ? input.value : '');
    }

    function clearStudentSearch() {
        const input = document.getElementById('perpulangan-student-search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        const clearBtn = document.getElementById('perpulangan-student-search-clear-btn');
        if (clearBtn) clearBtn.classList.add('hidden');
        renderStudentSearchDropdown('');
    }

    function renderStudentSearchDropdown(query) {
        const dropdown = document.getElementById('perpulangan-student-search-dropdown');
        if (!dropdown) return;

        const all = getAllAvailableStudents();
        const q = (query || '').toLowerCase().trim();

        let matched = [];
        if (!q) {
            matched = all.slice(0, 10);
        } else {
            matched = all.filter(s => {
                const name = String(s.name || s.nama || s.nama_santri || '').toLowerCase();
                const nis = String(s.nis || s.nisn || '').toLowerCase();
                return name.includes(q) || nis.includes(q);
            }).slice(0, 20);
        }

        if (matched.length === 0) {
            dropdown.innerHTML = `
                <div class="p-4 text-center text-slate-400 space-y-1">
                    <i class="fa-solid fa-user-xmark text-lg text-slate-300 dark:text-slate-600 mb-1"></i>
                    <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">Santri tidak ditemukan</p>
                    <p class="text-[10px] text-slate-400">Tidak ada santri dengan nama atau NIS "${escapeHtml(query)}" di Data Santri.</p>
                </div>
            `;
            dropdown.classList.remove('hidden');
            return;
        }

        dropdown.innerHTML = matched.map(s => {
            const id = s.studentId || s.student_id || s.id || s.nis;
            const name = s.name || s.nama || s.nama_santri || 'Santri';
            const nis = s.nis || s.nisn || '-';
            const gender = (s.gender || 'L').toUpperCase() === 'P' ? 'Putri' : 'Putra';
            const prog = s.program || s.kelas || 'Santri';
            const photoUrl = s.photoUrl || s.photo_url || '';

            const avatarHtml = photoUrl
                ? `<img src="${escapeHtml(photoUrl)}" class="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-[#253447]" onerror="this.onerror=null;this.src='';this.className='hidden';">`
                : `<div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0"><i class="fa-solid fa-user-graduate"></i></div>`;

            const studentDataStr = escapeHtml(JSON.stringify({
                id: id,
                studentId: id,
                name: name,
                nis: nis,
                program: prog,
                gender: gender,
                photoUrl: photoUrl
            }));

            return `
                <div class="p-2.5 hover:bg-emerald-50 dark:hover:bg-[#1f2d3d] cursor-pointer flex items-center justify-between transition group"
                    onclick='window.ASNPerpulangan.selectStudentFromSearch(${JSON.stringify(studentDataStr)})'>
                    <div class="flex items-center space-x-2.5 min-w-0">
                        ${avatarHtml}
                        <div class="min-w-0">
                            <div class="font-bold text-slate-800 dark:text-slate-100 text-xs truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                                ${escapeHtml(name)}
                            </div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">NIS: ${escapeHtml(nis)}</span>
                                <span>•</span>
                                <span>${escapeHtml(prog)} (${gender})</span>
                            </div>
                        </div>
                    </div>
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-1 shrink-0">
                        Pilih <i class="fa-solid fa-arrow-right text-[9px]"></i>
                    </span>
                </div>
            `;
        }).join('');

        dropdown.classList.remove('hidden');
    }

    function selectStudentFromSearch(student) {
        if (typeof student === 'string') {
            try { student = JSON.parse(student); } catch(e) {}
        }
        if (!student) return;

        const id = student.studentId || student.id || student.nis || '';
        const name = student.name || student.nama || student.nama_santri || '';
        const nis = student.nis || student.nisn || '';
        const extra = `${student.program || 'Santri'} • ${student.gender || 'Aktif'}`;
        const photoUrl = student.photoUrl || student.photo_url || '';

        // Isi hidden fields
        const idInput = document.getElementById('perpulangan-form-student-id');
        const nameInput = document.getElementById('perpulangan-form-student-name');
        const nisInput = document.getElementById('perpulangan-form-student-nis');
        if (idInput) idInput.value = id;
        if (nameInput) nameInput.value = name;
        if (nisInput) nisInput.value = nis;

        // Update Kartu Santri Terpilih
        const card = document.getElementById('perpulangan-selected-student-card');
        const searchBox = document.getElementById('perpulangan-search-box-wrapper');
        const quickWali = document.getElementById('perpulangan-wali-quick-students');
        const nameEl = document.getElementById('perpulangan-selected-student-name');
        const nisEl = document.getElementById('perpulangan-selected-student-nis');
        const extraEl = document.getElementById('perpulangan-selected-student-extra');
        const avatarEl = document.getElementById('perpulangan-selected-student-avatar');

        if (nameEl) nameEl.innerText = name;
        if (nisEl) nisEl.innerText = `NIS: ${nis || '-'}`;
        if (extraEl) extraEl.innerText = extra;

        if (avatarEl) {
            if (photoUrl) {
                avatarEl.innerHTML = `<img src="${escapeHtml(photoUrl)}" class="w-full h-full object-cover">`;
            } else {
                avatarEl.innerHTML = `<i class="fa-solid fa-user-graduate"></i>`;
            }
        }

        // Switch View ke Card
        if (searchBox) searchBox.classList.add('hidden');
        if (quickWali) quickWali.classList.add('hidden');
        if (card) card.classList.remove('hidden');

        // Sembunyikan dropdown
        const dropdown = document.getElementById('perpulangan-student-search-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    }

    function resetSelectedStudent() {
        const idInput = document.getElementById('perpulangan-form-student-id');
        const nameInput = document.getElementById('perpulangan-form-student-name');
        const nisInput = document.getElementById('perpulangan-form-student-nis');
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (nisInput) nisInput.value = '';

        const card = document.getElementById('perpulangan-selected-student-card');
        const searchBox = document.getElementById('perpulangan-search-box-wrapper');
        const input = document.getElementById('perpulangan-student-search-input');
        const dropdown = document.getElementById('perpulangan-student-search-dropdown');

        if (card) card.classList.add('hidden');
        if (searchBox) searchBox.classList.remove('hidden');
        if (dropdown) dropdown.classList.add('hidden');

        renderWaliQuickChips();

        if (input) {
            input.value = '';
            input.focus();
        }
    }

    function renderWaliQuickChips() {
        const isWali = (window.ASNIdentity && window.ASNIdentity.currentRole === 'WALI_SANTRI') || (typeof getCurrentUserRole === 'function' && getCurrentUserRole() === 'WALI_SANTRI');
        const container = document.getElementById('perpulangan-wali-quick-students');
        const chipsContainer = document.getElementById('perpulangan-wali-quick-chips');

        if (!container || !chipsContainer) return;

        if (!isWali) {
            container.classList.add('hidden');
            return;
        }

        const linked = (window.ASNIdentity && Array.isArray(window.ASNIdentity.linkedStudents)) ? window.ASNIdentity.linkedStudents : [];
        if (linked.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        chipsContainer.innerHTML = linked.map(s => {
            const sName = s.nama || s.name || 'Santri';
            const sNis = s.nis || s.nisn || '';
            const sId = s.id || s.studentId || sNis;
            const dataObj = escapeHtml(JSON.stringify({ id: sId, studentId: sId, name: sName, nis: sNis }));
            return `
                <button type="button" onclick='window.ASNPerpulangan.selectStudentFromSearch(${JSON.stringify(dataObj)})'
                    class="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300/60 dark:border-emerald-800 transition active:scale-95 inline-flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-user-check text-[9px]"></i>
                    <span>${escapeHtml(sName)}</span>
                </button>
            `;
        }).join('');
    }

    /**
     * Modal Form Pengajuan / Input Izin Santri Baru
     */
    function openModalFormIzin(prefill = {}) {
        const modal = document.getElementById('modal-perpulangan-form');
        const form = document.getElementById('form-perpulangan-input');
        if (!modal || !form) return;

        form.reset();
        resetSelectedStudent();

        // Default tanggal hari ini dan besok
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const toInputDate = d => d.toISOString().split('T')[0];
        const dateStartInput = document.getElementById('perpulangan-form-tgl-mulai');
        const dateEndInput = document.getElementById('perpulangan-form-tgl-kembali');
        const timeStartInput = document.getElementById('perpulangan-form-jam-mulai');
        const timeEndInput = document.getElementById('perpulangan-form-jam-kembali');

        if (dateStartInput) dateStartInput.value = toInputDate(now);
        if (dateEndInput) dateEndInput.value = toInputDate(tomorrow);
        if (timeStartInput) timeStartInput.value = '08:00';
        if (timeEndInput) timeEndInput.value = '17:00';

        // Preload master santri agar pencarian instan
        ensureStudentsLoaded();

        if (prefill.student_id || prefill.student_name || prefill.name) {
            selectStudentFromSearch({
                studentId: prefill.student_id || '',
                id: prefill.student_id || '',
                name: prefill.student_name || prefill.name || '',
                nis: prefill.student_nis || prefill.nis || ''
            });
        }

        modal.classList.remove('hidden');
    }

    function closeModalFormIzin() {
        const modal = document.getElementById('modal-perpulangan-form');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Submit Form Pengajuan Izin
     */
    async function submitFormIzin(event) {
        if (event) event.preventDefault();

        const hiddenId = document.getElementById('perpulangan-form-student-id')?.value;
        const hiddenName = document.getElementById('perpulangan-form-student-name')?.value;
        const hiddenNis = document.getElementById('perpulangan-form-student-nis')?.value;
        const searchInput = document.getElementById('perpulangan-student-search-input')?.value;

        const kategori = document.getElementById('perpulangan-form-kategori')?.value;
        const alasan = document.getElementById('perpulangan-form-alasan')?.value;
        const penjemputNama = document.getElementById('perpulangan-form-penjemput-nama')?.value;
        const penjemputHubungan = document.getElementById('perpulangan-form-penjemput-hubungan')?.value;
        const penjemputKontak = document.getElementById('perpulangan-form-penjemput-kontak')?.value;
        const tglMulai = document.getElementById('perpulangan-form-tgl-mulai')?.value;
        const jamMulai = document.getElementById('perpulangan-form-jam-mulai')?.value;
        const tglKembali = document.getElementById('perpulangan-form-tgl-kembali')?.value;
        const jamKembali = document.getElementById('perpulangan-form-jam-kembali')?.value;

        let studentId = hiddenId || '';
        let studentName = hiddenName || (searchInput ? searchInput.trim() : '');
        let studentNis = hiddenNis || '';

        // Jika user mengetikkan nama di search input tanpa klik list dropdown
        if (!studentName && searchInput && searchInput.trim()) {
            studentName = searchInput.trim();
        }

        if (!studentName) {
            if (typeof showToast === 'function') {
                showToast('Harap cari dan pilih Santri terlebih dahulu.', 'warning');
            }
            const sInput = document.getElementById('perpulangan-student-search-input');
            if (sInput) sInput.focus();
            return;
        }

        if (!alasan || !penjemputNama || !tglMulai || !tglKembali) {
            if (typeof showToast === 'function') showToast('Harap lengkapi alasan, nama penjemput, serta tanggal izin.', 'warning');
            return;
        }

        const currentActor = (window.ASNIdentity && window.ASNIdentity.currentUser) || {};
        const isWali = (window.ASNIdentity && window.ASNIdentity.currentRole === 'WALI_SANTRI') || (typeof getCurrentUserRole === 'function' && getCurrentUserRole() === 'WALI_SANTRI');

        const payload = {
            student_id: studentId,
            student_nis: studentNis,
            student_name: studentName,
            wali_id: isWali ? (currentActor.id || currentActor.userId || '') : '',
            wali_name: isWali ? (currentActor.name || penjemputNama) : '',
            wali_phone: isWali ? (currentActor.phone || currentActor.email || penjemputKontak) : '',
            kategori: kategori || 'Izin Biasa',
            alasan: alasan,
            penjemput_nama: penjemputNama,
            penjemput_hubungan: penjemputHubungan || 'Keluarga',
            penjemput_kontak: penjemputKontak || '',
            tgl_mulai: tglMulai,
            jam_mulai: jamMulai || '08:00',
            tgl_kembali: tglKembali,
            jam_kembali: jamKembali || '17:00'
        };

        const submitBtn = document.getElementById('perpulangan-btn-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Menyimpan...';
        }

        try {
            if (typeof window.submitPermohonanIzin !== 'function') {
                throw new Error('Fungsi submitPermohonanIzin belum terhubung.');
            }

            const res = await window.submitPermohonanIzin(payload);
            if (res && (res.success || res.status === 'success')) {
                if (typeof showToast === 'function') {
                    showToast('Permohonan izin santri berhasil diajukan! Menunggu persetujuan Pengurus.', 'success');
                }
                closeModalFormIzin();
                await loadPerpulanganData(true);
                if (typeof loadWaliPerpulanganData === 'function') {
                    await loadWaliPerpulanganData();
                }
            } else {
                throw new Error(res?.message || 'Gagal menyimpan permohonan izin.');
            }
        } catch (error) {
            console.error('[ASNPerpulangan] Gagal submit izin:', error);
            if (typeof showToast === 'function') {
                showToast(`Gagal: ${error.message}`, 'error');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1.5"></i> Ajukan Izin Santri';
            }
        }
    }

    /**
     * Modal Approval Two-Tier (Tier 1 Pengurus -> Tier 2 Pengasuh)
     */
    /**
     * Helper Parser Tanggal & Jam ke Format Input HTML (YYYY-MM-DD & HH:mm)
     */
    function parseDateToIsoInput(val) {
        if (!val) return '';
        const s = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m) {
            return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return '';
    }

    function parseTimeToIsoInput(val) {
        if (!val) return '08:00';
        const s = String(val).trim();
        const m = s.match(/(\d{1,2}):(\d{2})/);
        if (m) {
            return `${m[1].padStart(2, '0')}:${m[2]}`;
        }
        return '08:00';
    }

    function openModalApproval(idIzin, tier) {
        const item = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
        if (!item) return;

        ASNPerpulangan.selectedIzin = item;

        const modal = document.getElementById('modal-perpulangan-approval');
        if (!modal) return;

        const titleEl = document.getElementById('perpulangan-approval-title');
        const badgeEl = document.getElementById('perpulangan-approval-tier-badge');
        const detailsEl = document.getElementById('perpulangan-approval-details');
        const catatanInput = document.getElementById('perpulangan-approval-catatan');
        const confirmBtn = document.getElementById('perpulangan-approval-btn-confirm');

        // Pre-fill input jadwal izin yang editable untuk konfirmasi durasi
        const tglMulaiInput = document.getElementById('perpulangan-approval-tgl-mulai');
        const jamMulaiInput = document.getElementById('perpulangan-approval-jam-mulai');
        const tglKembaliInput = document.getElementById('perpulangan-approval-tgl-kembali');
        const jamKembaliInput = document.getElementById('perpulangan-approval-jam-kembali');

        if (tglMulaiInput) tglMulaiInput.value = parseDateToIsoInput(item.tgl_mulai || item.tglMulai);
        if (jamMulaiInput) jamMulaiInput.value = parseTimeToIsoInput(item.jam_mulai || item.jamMulai || '08:00');
        if (tglKembaliInput) tglKembaliInput.value = parseDateToIsoInput(item.tgl_kembali || item.tglKembali);
        if (jamKembaliInput) jamKembaliInput.value = parseTimeToIsoInput(item.jam_kembali || item.jamKembali || '17:00');

        if (catatanInput) catatanInput.value = '';

        if (tier === 'PENGASUH') {
            if (titleEl) titleEl.innerText = 'Persetujuan Dewan Pengasuh (Tier 2)';
            if (badgeEl) {
                badgeEl.innerText = 'Tier 2 - Otoritas Masyayikh';
                badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
            }
            if (confirmBtn) {
                confirmBtn.innerHTML = '<i class="fa-solid fa-hands-praying mr-1.5"></i> Konfirmasi Persetujuan Tier 2';
                confirmBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition active:scale-95';
                confirmBtn.onclick = () => submitApprovalDecision('PENGASUH', idIzin);
            }
        } else {
            if (titleEl) titleEl.innerText = 'Persetujuan Pengurus Keamanan / Piket (Tier 1)';
            if (badgeEl) {
                badgeEl.innerText = 'Tier 1 - Verifikasi Pengurus';
                badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
            }
            if (confirmBtn) {
                confirmBtn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Konfirmasi Persetujuan Tier 1';
                confirmBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95';
                confirmBtn.onclick = () => submitApprovalDecision('PENGURUS', idIzin);
            }
        }

        if (detailsEl) {
            const sName = item.student_name || item.studentName || item.nama_santri || item.nama || 'Santri';
            const sNis = item.student_nis || item.studentNis || item.nis || '-';
            const sPenjemput = item.penjemput_nama || item.penjemputNama || item.wali_name || item.waliName || 'Wali Santri';
            const sHub = item.penjemput_hubungan || item.penjemputHubungan || 'Keluarga';
            const sTglMulai = formatDateIndo(item.tgl_mulai || item.tglMulai);
            const sJamMulai = formatTimeIndo(item.jam_mulai || item.jamMulai);
            const sTglKembali = formatDateIndo(item.tgl_kembali || item.tglKembali);
            const sJamKembali = formatTimeIndo(item.jam_kembali || item.jamKembali);

            detailsEl.innerHTML = `
                <div class="p-3 bg-slate-50 dark:bg-[#1a2634] rounded-xl border border-slate-200/80 dark:border-[#25374a] space-y-1.5 text-xs">
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-300">Nama Santri:</span>
                        <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(sName)} (${escapeHtml(sNis)})</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-300">Kategori & Alasan:</span>
                        <span class="font-semibold text-slate-700 dark:text-slate-200 text-right">${escapeHtml(item.kategori || 'Izin')} - ${escapeHtml(item.alasan || '-')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-300">Penjemput:</span>
                        <span class="font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(sPenjemput)} (${escapeHtml(sHub)})</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-300">Pengajuan Wali:</span>
                        <span class="font-bold text-slate-700 dark:text-slate-200 text-right">
                            ${sTglMulai} ${sJamMulai} s/d ${sTglKembali} ${sJamKembali}
                        </span>
                    </div>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    function closeModalApproval() {
        const modal = document.getElementById('modal-perpulangan-approval');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Eksekusi Keputusan Approval
     */
    async function submitApprovalDecision(tier, idIzin) {
        const catatanInput = document.getElementById('perpulangan-approval-catatan');
        const catatan = catatanInput ? catatanInput.value.trim() : '';

        // Ambil nilai jadwal izin yang telah dikonfirmasi / diedit oleh Tier 1 / Tier 2
        const tglMulaiVal = document.getElementById('perpulangan-approval-tgl-mulai')?.value || '';
        const jamMulaiVal = document.getElementById('perpulangan-approval-jam-mulai')?.value || '08:00';
        const tglKembaliVal = document.getElementById('perpulangan-approval-tgl-kembali')?.value || '';
        const jamKembaliVal = document.getElementById('perpulangan-approval-jam-kembali')?.value || '17:00';

        const scheduleUpdates = {
            tgl_mulai: tglMulaiVal,
            jam_mulai: jamMulaiVal,
            tgl_kembali: tglKembaliVal,
            jam_kembali: jamKembaliVal,
            tglMulai: tglMulaiVal,
            jamMulai: jamMulaiVal,
            tglKembali: tglKembaliVal,
            jamKembali: jamKembaliVal
        };

        const confirmBtn = document.getElementById('perpulangan-approval-btn-confirm');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Memproses...';
        }

        try {
            let res;
            if (tier === 'PENGASUH') {
                res = await window.approveIzinPengasuh(idIzin, catatan, scheduleUpdates);
            } else {
                res = await window.approveIzinPengurus(idIzin, catatan, scheduleUpdates);
            }

            if (res && (res.success || res.status === 'success')) {
                // Perbarui memori lokal agar tabel dan kartu langsung mencerminkan jadwal baru
                const currentItem = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
                if (currentItem) {
                    if (tglMulaiVal) { currentItem.tgl_mulai = tglMulaiVal; currentItem.tglMulai = tglMulaiVal; }
                    if (jamMulaiVal) { currentItem.jam_mulai = jamMulaiVal; currentItem.jamMulai = jamMulaiVal; }
                    if (tglKembaliVal) { currentItem.tgl_kembali = tglKembaliVal; currentItem.tglKembali = tglKembaliVal; }
                    if (jamKembaliVal) { currentItem.jam_kembali = jamKembaliVal; currentItem.jamKembali = jamKembaliVal; }
                }

                const msg = tier === 'PENGASUH'
                    ? 'Izin disetujui penuh oleh Dewan Pengasuh! Santri siap cetak surat jalan.'
                    : 'Persetujuan Tier 1 tersimpan. Izin diteruskan ke antrean Dewan Pengasuh.';
                if (typeof showToast === 'function') showToast(msg, 'success');
                closeModalApproval();
                await loadPerpulanganData(true);
            } else {
                throw new Error(res?.message || 'Gagal menyimpan persetujuan.');
            }
        } catch (error) {
            console.error('[ASNPerpulangan] Approval error:', error);
            if (typeof showToast === 'function') showToast(`Gagal: ${error.message}`, 'error');
        } finally {
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    /**
     * Modal Penolakan Izin
     */
    function openModalReject(idIzin) {
        const item = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
        if (!item) return;

        ASNPerpulangan.selectedIzin = item;

        const modal = document.getElementById('modal-perpulangan-reject');
        if (!modal) return;

        const infoEl = document.getElementById('perpulangan-reject-info');
        const alasanInput = document.getElementById('perpulangan-reject-alasan');
        const confirmBtn = document.getElementById('perpulangan-reject-btn-confirm');

        if (alasanInput) alasanInput.value = '';
        if (infoEl) {
            infoEl.innerText = `Menolak permohonan izin atas nama: ${item.student_name || item.nama_santri} (${item.kategori})`;
        }
        if (confirmBtn) {
            confirmBtn.onclick = () => submitRejectDecision(idIzin);
        }

        modal.classList.remove('hidden');
    }

    function closeModalReject() {
        const modal = document.getElementById('modal-perpulangan-reject');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Eksekusi Penolakan Izin
     */
    async function submitRejectDecision(idIzin) {
        const alasanInput = document.getElementById('perpulangan-reject-alasan');
        const alasan = alasanInput ? alasanInput.value.trim() : '';

        if (!alasan) {
            if (typeof showToast === 'function') showToast('Alasan penolakan wajib diisi.', 'warning');
            return;
        }

        const confirmBtn = document.getElementById('perpulangan-reject-btn-confirm');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Menyimpan...';
        }

        try {
            const res = await window.rejectPermohonanIzin(idIzin, alasan);
            if (res && (res.success || res.status === 'success')) {
                if (typeof showToast === 'function') showToast('Permohonan izin santri ditolak.', 'info');
                closeModalReject();
                await loadPerpulanganData(true);
            } else {
                throw new Error(res?.message || 'Gagal menolak izin.');
            }
        } catch (error) {
            console.error('[ASNPerpulangan] Reject error:', error);
            if (typeof showToast === 'function') showToast(`Gagal: ${error.message}`, 'error');
        } finally {
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    /**
     * Modal Pos Gerbang Keamanan (Check-Out / Check-In)
     */
    function openModalGateCheck(idIzin, mode = 'OUT') {
        const item = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
        if (!item) return;

        ASNPerpulangan.selectedIzin = item;

        const modal = document.getElementById('modal-perpulangan-gate');
        if (!modal) return;

        const titleEl = document.getElementById('perpulangan-gate-title');
        const detailsEl = document.getElementById('perpulangan-gate-details');
        const catatanInput = document.getElementById('perpulangan-gate-catatan');
        const confirmBtn = document.getElementById('perpulangan-gate-btn-confirm');

        if (catatanInput) catatanInput.value = '';

        const isOut = mode === 'OUT';
        if (titleEl) {
            titleEl.innerText = isOut ? 'Pos Gerbang: Check-Out (Santri Keluar)' : 'Pos Gerbang: Check-In (Santri Kembali)';
        }

        if (confirmBtn) {
            confirmBtn.innerText = isOut ? 'Konfirmasi Santri Keluar' : 'Konfirmasi Santri Kembali';
            confirmBtn.className = isOut
                ? 'px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition active:scale-95'
                : 'px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition active:scale-95';
            confirmBtn.onclick = () => submitGateCheckDecision(idIzin, mode);
        }

        // Cek keterlambatan potensial jika check-in
        let lateNotice = '';
        if (!isOut && item.tgl_kembali) {
            const returnTarget = new Date(`${item.tgl_kembali}T${item.jam_kembali || '17:00'}:00`);
            const now = new Date();
            if (now > returnTarget) {
                const diffHours = Math.round((now - returnTarget) / (1000 * 60 * 60));
                lateNotice = `
                    <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                        <span><strong>Peringatan:</strong> Santri melewati batas waktu kembali (+/- ${diffHours} jam). Sistem akan menandai sebagai status TERLAMBAT.</span>
                    </div>
                `;
            }
        }

        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="space-y-2 text-xs">
                    <div class="p-3 bg-slate-50 dark:bg-[#1a2634] rounded-xl border border-slate-200/80 dark:border-[#25374a] space-y-1">
                        <div class="font-bold text-sm text-slate-800 dark:text-slate-100">${item.student_name || item.nama_santri}</div>
                        <div class="text-slate-500 dark:text-slate-300">NIS: ${item.student_nis || item.nis || '-'} | ID Izin: ${idIzin}</div>
                        <div class="text-slate-600 dark:text-slate-300 pt-1">Penjemput: <strong>${item.penjemput_nama}</strong> (${item.penjemput_hubungan})</div>
                        <div class="text-amber-700 dark:text-amber-400 font-semibold">Batas Kembali: ${formatDateIndo(item.tgl_kembali)} pukul ${formatTimeIndo(item.jam_kembali)}</div>
                    </div>
                    ${lateNotice}
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    function closeModalGateCheck() {
        const modal = document.getElementById('modal-perpulangan-gate');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Eksekusi Pos Gerbang (Check-Out / Check-In)
     */
    async function submitGateCheckDecision(idIzin, mode) {
        const catatanInput = document.getElementById('perpulangan-gate-catatan');
        const catatan = catatanInput ? catatanInput.value.trim() : '';

        const confirmBtn = document.getElementById('perpulangan-gate-btn-confirm');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Menyimpan Log...';
        }

        try {
            const res = await window.gateCheckIzin(idIzin, mode, catatan);
            if (res && (res.success || res.status === 'success')) {
                const msg = mode === 'OUT'
                    ? 'Check-Out berhasil dicatat. Status santri kini: KELUAR PONDOK.'
                    : 'Check-In berhasil dicatat. Santri telah kembali ke pondok.';
                if (typeof showToast === 'function') showToast(msg, 'success');
                closeModalGateCheck();
                await loadPerpulanganData(true);
            } else {
                throw new Error(res?.message || 'Gagal memproses pos gerbang.');
            }
        } catch (error) {
            console.error('[ASNPerpulangan] Gate error:', error);
            if (typeof showToast === 'function') showToast(`Gagal: ${error.message}`, 'error');
        } finally {
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    /**
     * Quick Gate Search / Scan (Input Cepat NIS atau ID Izin di Pos Gerbang)
     */
    function handleQuickGateSearch(query) {
        const q = String(query || '').trim().toLowerCase();
        if (!q) return;

        const found = ASNPerpulangan.list.find(x => {
            const id = String(x.id_izin || x.id || '').toLowerCase();
            const nis = String(x.student_nis || x.nis || '').toLowerCase();
            return id === q || nis === q;
        });

        if (!found) {
            if (typeof showToast === 'function') showToast(`Data santri / ID izin "${query}" tidak ditemukan.`, 'warning');
            return;
        }

        const status = String(found.status || '').toUpperCase();
        if (status === 'DISETUJUI') {
            openModalGateCheck(found.id_izin || found.id, 'OUT');
        } else if (status === 'KELUAR') {
            openModalGateCheck(found.id_izin || found.id, 'IN');
        } else {
            openModalDetail(found.id_izin || found.id);
        }
    }

    /**
     * Modal Pratinjau Surat Jalan & Kartu Izin Digital Resmi
     */
    function openModalPrintSuratIzin(idIzin) {
        const item = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
        if (!item) return;

        ASNPerpulangan.selectedIzin = item;

        const modal = document.getElementById('modal-perpulangan-print');
        if (!modal) return;

        const container = document.getElementById('perpulangan-print-document');
        if (!container) return;

        const qrData = `ASNAWIYYAH-IZIN|${idIzin}|${item.student_nis || '-'}|${item.student_name || '-'}|${item.status || 'DISETUJUI'}|VERIFIED`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;

        container.innerHTML = `
            <div class="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl max-w-2xl mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 font-sans">
                <!-- KOP SURAT RESMI PESANTREN -->
                <div class="border-b-2 border-emerald-800 pb-4 mb-5 flex items-center justify-between gap-4">
                    <img src="/assets/img/logo-asnawiyyah.jpg" alt="Logo PPTQ Asnawiyyah" class="w-16 h-16 object-contain rounded-full shadow-xs shrink-0" onerror="this.style.display='none'">
                    <div class="text-center flex-1">
                        <div class="font-serif font-bold text-xs tracking-widest text-emerald-900 uppercase">Pondok Pesantren Tahfidzul Qur'an</div>
                        <h1 class="font-serif font-black text-lg sm:text-xl text-emerald-950 tracking-wide uppercase">ASNAWIYYAH</h1>
                        <p class="text-[11px] text-slate-600 leading-tight">
                            Pilangwetan RT 03 RW 02, Kebonagung, Demak, Jawa Tengah 59582<br>
                            Website: asnawiyyah.or.id | WhatsApp Khodim: 0812-3456-7890
                        </p>
                    </div>
                    <div class="w-16 hidden sm:block shrink-0 text-right">
                        <span class="inline-block px-2 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">RESMI</span>
                    </div>
                </div>

                <!-- JUDUL SURAT -->
                <div class="text-center my-4">
                    <h2 class="font-bold text-sm sm:text-base text-slate-900 underline uppercase tracking-wider">SURAT JALAN & IZIN PERPULANGAN SANTRI</h2>
                    <p class="text-xs text-slate-500 font-mono mt-0.5">Nomor: ${idIzin}/PPTQ-ASN/IZN/${new Date().getFullYear()}</p>
                </div>

                <!-- ISI SURAT -->
                <p class="text-xs text-slate-700 leading-relaxed mb-3">
                    Pengurus Pondok Pesantren Tahfidzul Qur'an (PPTQ) Asnawiyyah menerangkan bahwa santri berikut telah memperoleh izin resmi untuk meninggalkan lingkungan pesantren:
                </p>

                <!-- TABEL DATA SANTRI -->
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs mb-4">
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Nama Santri</span>
                        <span class="col-span-2 font-bold text-slate-800">: ${item.student_name || item.nama_santri}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Nomor Induk (NIS)</span>
                        <span class="col-span-2 font-medium text-slate-800">: ${item.student_nis || item.nis || '-'}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Kategori Izin</span>
                        <span class="col-span-2 font-bold text-emerald-800">: ${item.kategori}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Keperluan / Alasan</span>
                        <span class="col-span-2 text-slate-800">: ${item.alasan}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Penjemput Resmi</span>
                        <span class="col-span-2 text-slate-800">: ${item.penjemput_nama} (${item.penjemput_hubungan}) - HP: ${item.penjemput_kontak || '-'}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Waktu Keluar</span>
                        <span class="col-span-2 text-slate-800">: ${formatDateIndo(item.tgl_mulai)} pukul ${formatTimeIndo(item.jam_mulai)}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <span class="text-slate-500">Wajib Kembali</span>
                        <span class="col-span-2 font-bold text-rose-700">: ${formatDateIndo(item.tgl_kembali)} pukul ${formatTimeIndo(item.jam_kembali)}</span>
                    </div>
                </div>

                <!-- TATA TERTIB SINGKAT -->
                <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1 mb-6">
                    <span class="font-bold block"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Ketentuan Selama Izin:</span>
                    <ol class="list-decimal pl-4 space-y-0.5 text-slate-700">
                        <li>Santri wajib menjaga nama baik almamater, akhlakul karimah, dan shalat berjamaah.</li>
                        <li>Wajib kembali ke pondok tepat waktu sesuai batas jam di atas. Keterlambatan dikenakan ta'zir tata tertib.</li>
                        <li>Surat jalan ini wajib ditunjukkan dan divalidasi ke Pos Gerbang Keamanan saat keluar & kembali.</li>
                    </ol>
                </div>

                <!-- TANDA TANGAN & QR CODE VERIFIKASI -->
                <div class="grid grid-cols-3 gap-4 text-center items-end text-xs pt-2">
                    <!-- Tanda Tangan Penjemput -->
                    <div class="space-y-12">
                        <div>Penjemput / Wali Santri,</div>
                        <div class="font-bold underline text-slate-800 pt-4">${item.penjemput_nama || 'Wali Santri'}</div>
                    </div>

                    <!-- QR Code Validasi Pos Gerbang -->
                    <div class="flex flex-col items-center justify-center space-y-1">
                        <img src="${qrUrl}" alt="QR Validasi" class="w-24 h-24 border border-slate-300 p-1 rounded-lg bg-white shadow-xs">
                        <span class="text-[9px] font-mono text-slate-500">Scan Validasi Gerbang</span>
                    </div>

                    <!-- Tanda Tangan Masyayikh / Pengurus -->
                    <div class="space-y-12">
                        <div>Pilangwetan, ${formatDateIndo(new Date().toISOString().split('T')[0])}<br>Dewan Pengasuh / Pengurus,</div>
                        <div class="font-bold underline text-slate-800 pt-4">${item.pengasuh_approved_by || item.pengurus_approved_by || 'Khodim Pesantren'}</div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    function closeModalPrintSuratIzin() {
        const modal = document.getElementById('modal-perpulangan-print');
        if (modal) modal.classList.add('hidden');
    }

    function printSuratIzinDocument() {
        window.print();
    }

    /**
     * Modal Detail & Riwayat Audit Izin
     */
    function openModalDetail(idIzin) {
        const item = ASNPerpulangan.list.find(x => (x.id_izin || x.id) === idIzin);
        if (!item) return;

        ASNPerpulangan.selectedIzin = item;

        const modal = document.getElementById('modal-perpulangan-detail');
        if (!modal) return;

        const contentEl = document.getElementById('perpulangan-detail-content');
        if (!contentEl) return;

        const statusCfg = getStatusBadgeConfig(item.status);
        const sName = item.student_name || item.studentName || item.nama_santri || item.nama || 'Santri';
        const sNis = item.student_nis || item.studentNis || item.nis || '-';
        const st = String(item.status || 'MENUNGGU_PENGURUS').toUpperCase();

        contentEl.innerHTML = `
            <div class="space-y-4 text-xs">
                <!-- Header Info -->
                <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#1a2634] rounded-2xl border border-slate-200/80 dark:border-[#25374a]">
                    <div>
                        <div class="font-mono text-[10px] text-slate-400">ID Izin: ${escapeHtml(idIzin)}</div>
                        <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">${escapeHtml(sName)}</h3>
                        <div class="text-[11px] text-slate-500">NIS: ${escapeHtml(sNis)}</div>
                    </div>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg}">
                        <span class="w-2 h-2 rounded-full ${statusCfg.dot}"></span>
                        <span>${statusCfg.label}</span>
                    </span>
                </div>

                <!-- Timeline Persetujuan & Pos Gerbang -->
                <div class="space-y-3">
                    <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400">Timeline Proses Perizinan</h4>
                    <div class="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#25374a]">
                        <!-- 1. Pengajuan -->
                        <div class="relative">
                            <span class="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-file-signature"></i>
                            </span>
                            <div class="font-bold text-slate-700 dark:text-slate-200">Pengajuan Izin Diajukan</div>
                            <div class="text-slate-500 text-[11px]">Kategori: ${escapeHtml(item.kategori || 'Izin')} | Alasan: ${escapeHtml(item.alasan || '-')}</div>
                            <div class="text-slate-400 text-[10px]">${item.created_at || '-'}</div>
                        </div>

                        <!-- 2. Tier 1 Pengurus -->
                        <div class="relative">
                            <span class="absolute -left-6 top-0 w-5 h-5 rounded-full ${item.pengurus_approved_at ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'} flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-user-check"></i>
                            </span>
                            <div class="font-bold text-slate-700 dark:text-slate-200">Tier 1: Verifikasi Pengurus Keamanan / Asatidz</div>
                            <div class="text-slate-500 text-[11px]">
                                ${item.pengurus_approved_by ? `Disetujui oleh: ${escapeHtml(item.pengurus_approved_by)}` : 'Menunggu persetujuan pengurus / asatidz'}
                                ${item.pengurus_catatan ? `<br>Catatan: "${escapeHtml(item.pengurus_catatan)}"` : ''}
                            </div>
                            <div class="text-slate-400 text-[10px]">${item.pengurus_approved_at || '-'}</div>
                        </div>

                        <!-- 3. Tier 2 Dewan Pengasuh -->
                        <div class="relative">
                            <span class="absolute -left-6 top-0 w-5 h-5 rounded-full ${item.pengasuh_approved_at ? 'bg-purple-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'} flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-hands-praying"></i>
                            </span>
                            <div class="font-bold text-slate-700 dark:text-slate-200">Tier 2: Otorisasi Dewan Pengasuh</div>
                            <div class="text-slate-500 text-[11px]">
                                ${item.pengasuh_approved_by ? `Disetujui oleh: ${escapeHtml(item.pengasuh_approved_by)}` : 'Menunggu otorisasi dewan pengasuh'}
                                ${item.pengasuh_catatan ? `<br>Catatan: "${escapeHtml(item.pengasuh_catatan)}"` : ''}
                            </div>
                            <div class="text-slate-400 text-[10px]">${item.pengasuh_approved_at || '-'}</div>
                        </div>

                        <!-- 4. Pos Gerbang Check-Out -->
                        <div class="relative">
                            <span class="absolute -left-6 top-0 w-5 h-5 rounded-full ${item.checkout_at ? 'bg-sky-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'} flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-door-open"></i>
                            </span>
                            <div class="font-bold text-slate-700 dark:text-slate-200">Pos Gerbang: Check-Out (Keluar Pondok)</div>
                            <div class="text-slate-500 text-[11px]">
                                ${item.checkout_petugas ? `Petugas: ${escapeHtml(item.checkout_petugas)}` : 'Belum check-out'}
                            </div>
                            <div class="text-slate-400 text-[10px]">${item.checkout_at || '-'}</div>
                        </div>

                        <!-- 5. Pos Gerbang Check-In -->
                        <div class="relative">
                            <span class="absolute -left-6 top-0 w-5 h-5 rounded-full ${item.checkin_at ? 'bg-teal-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'} flex items-center justify-center text-[10px]">
                                <i class="fa-solid fa-right-to-bracket"></i>
                            </span>
                            <div class="font-bold text-slate-700 dark:text-slate-200">Pos Gerbang: Check-In (Kembali ke Pondok)</div>
                            <div class="text-slate-500 text-[11px]">
                                ${item.checkin_petugas ? `Petugas: ${escapeHtml(item.checkin_petugas)}` : 'Belum check-in'}
                                ${item.catatan_keterlambatan ? `<br><span class="text-rose-500 font-bold">Keterlambatan: ${escapeHtml(item.catatan_keterlambatan)}</span>` : ''}
                            </div>
                            <div class="text-slate-400 text-[10px]">${item.checkin_at || '-'}</div>
                        </div>
                    </div>
                </div>

                <!-- Panel Aksi Keputusan Langsung dari Modal Detail -->
                <div class="pt-4 mt-2 border-t border-slate-200/80 dark:border-[#25374a] space-y-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tindakan Persetujuan:</div>
                    ${st === 'MENUNGGU_PENGURUS' ? `
                        <div class="flex flex-wrap items-center justify-end gap-2">
                            <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalReject('${idIzin}')" 
                                class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-xs transition active:scale-95 flex items-center gap-1">
                                <i class="fa-solid fa-xmark text-xs"></i> Tolak Izin
                            </button>
                            <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalApproval('${idIzin}', 'PENGURUS')" 
                                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5">
                                <i class="fa-solid fa-check text-xs"></i> Konfirmasi Persetujuan Tier 1
                            </button>
                        </div>
                    ` : (st === 'MENUNGGU_PENGASUH' ? `
                        <div class="flex flex-wrap items-center justify-end gap-2">
                            <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalReject('${idIzin}')" 
                                class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-xs transition active:scale-95 flex items-center gap-1">
                                <i class="fa-solid fa-xmark text-xs"></i> Tolak Izin
                            </button>
                            <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalApproval('${idIzin}', 'PENGASUH')" 
                                class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5">
                                <i class="fa-solid fa-hands-praying text-xs"></i> Konfirmasi Persetujuan Tier 2 (Pengasuh)
                            </button>
                        </div>
                    ` : (['DISETUJUI', 'KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(st) ? `
                        <div class="flex flex-wrap items-center justify-end gap-2">
                            <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalPrintSuratIzin('${idIzin}')" 
                                class="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold text-xs transition active:scale-95 flex items-center gap-1.5">
                                <i class="fa-solid fa-print text-xs"></i> Buka Surat Jalan & QR
                            </button>
                            ${st === 'DISETUJUI' ? `
                                <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalGateCheck('${idIzin}', 'OUT')" 
                                    class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5">
                                    <i class="fa-solid fa-door-open text-xs"></i> Check-Out Pos Gerbang
                                </button>
                            ` : (st === 'KELUAR' ? `
                                <button type="button" onclick="window.ASNPerpulangan.closeModalDetail(); window.ASNPerpulangan.openModalGateCheck('${idIzin}', 'IN')" 
                                    class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5">
                                    <i class="fa-solid fa-right-to-bracket text-xs"></i> Check-In Pos Gerbang
                                </button>
                            ` : '')}
                        </div>
                    ` : `
                        <div class="text-[11px] text-slate-400 italic">Tidak ada tindakan lebih lanjut yang diperlukan untuk status ini.</div>
                    `))}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    function closeModalDetail() {
        const modal = document.getElementById('modal-perpulangan-detail');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * =========================================================================
     * INTEGRASI PORTAL WALI SANTRI (LANGKAH 5)
     * =========================================================================
     */

    /**
     * Buka Modal Form Izin dari Sudut Pandang Orang Tua / Wali Santri
     */
    function openWaliIzinModal(studentId = '', studentName = '', studentNis = '') {
        openModalFormIzin({
            student_id: studentId,
            student_name: studentName,
            student_nis: studentNis
        });

        // Auto-fill nama & kontak wali santri dari sesi login
        const actor = (window.ASNIdentity && window.ASNIdentity.currentUser) || {};
        const penjemputInput = document.getElementById('perpulangan-form-penjemput-nama');
        const kontakInput = document.getElementById('perpulangan-form-penjemput-kontak');
        const hubunganSelect = document.getElementById('perpulangan-form-penjemput-hubungan');

        if (penjemputInput && !penjemputInput.value) {
            penjemputInput.value = actor.name || 'Wali Santri';
        }
        if (kontakInput && !kontakInput.value) {
            kontakInput.value = actor.phone || '';
        }
        if (hubunganSelect) {
            hubunganSelect.value = 'Wali Santri';
        }
    }

    /**
     * Memuat dan Menyaring Data Perizinan Khusus Anak-Anak Wali Santri
     */
    async function loadWaliPerpulanganData() {
        const container = document.getElementById('parent-perpulangan-tracking-list');
        if (!container) return;

        container.innerHTML = `
            <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] text-center space-y-1 animate-pulse">
                <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-lg mb-1"></i>
                <p class="text-xs font-bold text-slate-700 dark:text-slate-200">Memuat status izin santri...</p>
            </div>
        `;

        try {
            if (typeof window.getIzinPerpulanganList !== 'function') {
                throw new Error('Fungsi getIzinPerpulanganList belum tersedia.');
            }

            const response = await window.getIzinPerpulanganList();
            let rawList = [];
            if (response && response.status === 'success' && Array.isArray(response.data)) {
                rawList = response.data;
            } else if (response && response.success && Array.isArray(response.data)) {
                rawList = response.data;
            } else if (Array.isArray(response)) {
                rawList = response;
            }

            // Dapatkan daftar santri yang terhubung ke wali ini
            let linked = (window.ASNIdentity && Array.isArray(window.ASNIdentity.linkedStudents)) ? window.ASNIdentity.linkedStudents : [];
            if (linked.length === 0) {
                try {
                    const raw = sessionStorage.getItem('asnawiyyah_parent_students');
                    if (raw) linked = JSON.parse(raw);
                } catch (e) {}
            }

            const myNisList = linked.map(s => String(s.nis || s.nisn || s.NIS || '').toLowerCase().trim()).filter(Boolean);
            const myStudentIds = linked.map(s => String(s.studentId || s.student_id || s.id || '').toLowerCase().trim()).filter(Boolean);
            const myWaliId = String((window.ASNIdentity && window.ASNIdentity.currentUser && (window.ASNIdentity.currentUser.id || window.ASNIdentity.currentUser.userId)) || '').toLowerCase().trim();

            const myIzinList = rawList.filter(item => {
                const sNis = String(item.student_nis || item.studentNis || item.nis || '').toLowerCase().trim();
                const sId = String(item.student_id || item.studentId || '').toLowerCase().trim();
                const wId = String(item.wali_id || item.waliId || '').toLowerCase().trim();
                return (myNisList.length > 0 && myNisList.includes(sNis)) ||
                       (myStudentIds.length > 0 && myStudentIds.includes(sId)) ||
                       (myWaliId && wId === myWaliId);
            });

            renderWaliIzinTracking(myIzinList);
        } catch (error) {
            console.error('[ASNPerpulangan] Gagal memuat data izin wali:', error);
            container.innerHTML = `
                <div class="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center space-y-1">
                    <i class="fa-solid fa-triangle-exclamation text-rose-600 text-base"></i>
                    <p class="text-xs font-bold text-rose-800 dark:text-rose-200">Gagal memuat status izin santri.</p>
                    <button type="button" onclick="window.ASNPerpulangan.loadWaliPerpulanganData()" class="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    /**
     * Render Kartu Status & Pelacakan Izin Santri Realtime di Portal Wali
     */
    function renderWaliIzinTracking(list) {
        const container = document.getElementById('parent-perpulangan-tracking-list');
        const badgeCount = document.getElementById('parent-perpulangan-count-badge');
        if (!container) return;

        if (badgeCount) {
            badgeCount.innerText = `${list.length} Izin`;
        }

        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="p-5 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] text-center space-y-2">
                    <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-base">
                        <i class="fa-solid fa-person-walking-luggage"></i>
                    </div>
                    <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">Belum Ada Pengajuan Izin</h4>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Putra/putri Anda saat ini tercatat berada di lingkungan pondok dan mengikuti kegiatan rutin.
                    </p>
                    <div class="pt-1">
                        <button type="button" onclick="window.ASNPerpulangan.openWaliIzinModal()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 inline-flex items-center gap-1.5">
                            <i class="fa-solid fa-plus text-xs"></i>
                            <span>Ajukan Izin Santri</span>
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const escapeHtml = str => String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

        container.innerHTML = list.map((item, idx) => {
            const idIzin = item.id_izin || item.idIzin || item.id || `IZN-${idx + 1}`;
            const studentName = item.student_name || item.studentName || item.nama_santri || 'Santri';
            const studentNis = item.student_nis || item.studentNis || item.nis || '-';
            const kategori = item.kategori || 'Izin';
            const alasan = item.alasan || '-';
            const status = String(item.status || 'MENUNGGU_PENGURUS').toUpperCase();
            const badgeCfg = getStatusBadgeConfig(status);

            const tglMulai = formatDateIndo(item.tgl_mulai || item.tglMulai);
            const jamMulai = formatTimeIndo(item.jam_mulai || item.jamMulai);
            const tglKembali = formatDateIndo(item.tgl_kembali || item.tglKembali);
            const jamKembali = formatTimeIndo(item.jam_kembali || item.jamKembali);

            const stepPengurusActive = ['MENUNGGU_PENGASUH', 'DISETUJUI', 'KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(status);
            const stepPengasuhActive = ['DISETUJUI', 'KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(status);
            const stepGerbangActive = ['KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(status);
            const isDitolak = status === 'DITOLAK';

            let printBtn = '';
            if (['DISETUJUI', 'KELUAR', 'KEMBALI', 'TERLAMBAT'].includes(status)) {
                printBtn = `
                    <button type="button" onclick="window.ASNPerpulangan.openModalPrintSuratIzin('${idIzin}')" 
                        class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95">
                        <i class="fa-solid fa-qrcode text-xs"></i>
                        <span>Buka Surat Jalan & QR</span>
                    </button>
                `;
            }

            return `
            <div class="p-4 bg-white dark:bg-[#15202d] rounded-2xl border border-slate-100 dark:border-[#253447] shadow-xs space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-800">
                <!-- Bar Atas: Nama Santri & Status Badge -->
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">${escapeHtml(studentName)}</h4>
                            <span class="text-[10px] font-mono text-slate-400">NIS: ${escapeHtml(studentNis)}</span>
                        </div>
                        <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300">
                            ${escapeHtml(kategori)}
                        </span>
                    </div>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${badgeCfg.bg}">
                        <span class="w-1.5 h-1.5 rounded-full ${badgeCfg.dot}"></span>
                        <span>${badgeCfg.label}</span>
                    </span>
                </div>

                <!-- Alasan & Jadwal Kepulangan -->
                <div class="p-2.5 bg-slate-50 dark:bg-[#1a2634] rounded-xl border border-slate-100 dark:border-[#25374a] space-y-1.5 text-[11px]">
                    <div class="text-slate-600 dark:text-slate-300">
                        <span class="text-slate-400">Keperluan:</span> <strong>${escapeHtml(alasan)}</strong>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:justify-between text-slate-500 dark:text-slate-300 gap-1 pt-0.5 border-t border-slate-200/60 dark:border-[#25374a]">
                        <div><i class="fa-solid fa-clock text-emerald-500 mr-1"></i> Berangkat: <strong>${tglMulai} ${jamMulai}</strong></div>
                        <div class="text-amber-700 dark:text-amber-400"><i class="fa-solid fa-circle-exclamation mr-1"></i> Batas Kembali: <strong>${tglKembali} ${jamKembali}</strong></div>
                    </div>
                </div>

                <!-- LIVE TRACKER STEPPER -->
                ${!isDitolak ? `
                <div class="pt-1">
                    <div class="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Pelacakan Persetujuan:</div>
                    <div class="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                        <!-- Step 1: Diajukan -->
                        <div class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 font-bold">
                            <i class="fa-solid fa-file-signature block text-xs mb-0.5"></i>
                            <span>Diajukan</span>
                        </div>
                        <!-- Step 2: Pengurus -->
                        <div class="p-1.5 rounded-lg ${stepPengurusActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 font-bold' : 'bg-slate-100 dark:bg-[#1c2836] text-slate-400 border border-transparent'}">
                            <i class="fa-solid fa-user-check block text-xs mb-0.5"></i>
                            <span>Tier 1 Pengurus</span>
                        </div>
                        <!-- Step 3: Pengasuh -->
                        <div class="p-1.5 rounded-lg ${stepPengasuhActive ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 font-bold' : 'bg-slate-100 dark:bg-[#1c2836] text-slate-400 border border-transparent'}">
                            <i class="fa-solid fa-hands-praying block text-xs mb-0.5"></i>
                            <span>Tier 2 Pengasuh</span>
                        </div>
                        <!-- Step 4: Pos Gerbang -->
                        <div class="p-1.5 rounded-lg ${stepGerbangActive ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 font-bold' : 'bg-slate-100 dark:bg-[#1c2836] text-slate-400 border border-transparent'}">
                            <i class="fa-solid fa-door-open block text-xs mb-0.5"></i>
                            <span>Pos Gerbang</span>
                        </div>
                    </div>
                </div>
                ` : `
                <!-- Box Penolakan -->
                <div class="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300">
                    <span class="font-bold block mb-0.5"><i class="fa-solid fa-circle-xmark mr-1"></i> Alasan Penolakan dari Pesantren:</span>
                    <span>${escapeHtml(item.alasan_penolakan || 'Tidak memperoleh rekomendasi dari dewan pengurus/pengasuh.')}</span>
                </div>
                `}

                <!-- Bar Bawah Aksi -->
                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#253447]">
                    <span class="font-mono text-[9px] text-slate-400">ID: ${idIzin}</span>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.ASNPerpulangan.openModalDetail('${idIzin}')" 
                            class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1c2836] dark:hover:bg-[#253447] dark:text-slate-300 text-xs font-semibold transition active:scale-95">
                            Detail Timeline
                        </button>
                        ${printBtn}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // Click outside listener untuk menutup dropdown pencarian santri
    document.addEventListener('click', (e) => {
        const searchBox = document.getElementById('perpulangan-search-box-wrapper');
        const dropdown = document.getElementById('perpulangan-student-search-dropdown');
        if (searchBox && dropdown && !searchBox.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Export API ke Objek Global
    ASNPerpulangan.loadData = loadPerpulanganData;
    ASNPerpulangan.setFilter = setPerpulanganFilter;
    ASNPerpulangan.handleSearch = handlePerpulanganSearch;
    ASNPerpulangan.openModalFormIzin = openModalFormIzin;
    ASNPerpulangan.closeModalFormIzin = closeModalFormIzin;
    ASNPerpulangan.submitFormIzin = submitFormIzin;
    ASNPerpulangan.onSearchStudentInput = onSearchStudentInput;
    ASNPerpulangan.onSearchStudentFocus = onSearchStudentFocus;
    ASNPerpulangan.clearStudentSearch = clearStudentSearch;
    ASNPerpulangan.selectStudentFromSearch = selectStudentFromSearch;
    ASNPerpulangan.resetSelectedStudent = resetSelectedStudent;
    ASNPerpulangan.openModalApproval = openModalApproval;
    ASNPerpulangan.closeModalApproval = closeModalApproval;
    ASNPerpulangan.openModalReject = openModalReject;
    ASNPerpulangan.closeModalReject = closeModalReject;
    ASNPerpulangan.openModalGateCheck = openModalGateCheck;
    ASNPerpulangan.closeModalGateCheck = closeModalGateCheck;
    ASNPerpulangan.handleQuickGateSearch = handleQuickGateSearch;
    ASNPerpulangan.openModalPrintSuratIzin = openModalPrintSuratIzin;
    ASNPerpulangan.closeModalPrintSuratIzin = closeModalPrintSuratIzin;
    ASNPerpulangan.printSuratIzinDocument = printSuratIzinDocument;
    ASNPerpulangan.openModalDetail = openModalDetail;
    ASNPerpulangan.closeModalDetail = closeModalDetail;
    ASNPerpulangan.openWaliIzinModal = openWaliIzinModal;
    ASNPerpulangan.loadWaliPerpulanganData = loadWaliPerpulanganData;
    ASNPerpulangan.renderWaliIzinTracking = renderWaliIzinTracking;

    // Export window level alias untuk kemudahan integrasi event handler onclick
    window.loadPerpulanganData = loadPerpulanganData;
    window.openModalFormIzin = openModalFormIzin;
    window.closeModalFormIzin = closeModalFormIzin;
    window.openWaliIzinModal = openWaliIzinModal;
    window.loadWaliPerpulanganData = loadWaliPerpulanganData;

})(window, document);
