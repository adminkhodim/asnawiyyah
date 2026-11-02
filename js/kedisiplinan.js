/**
 * ==============================================================================
 * MODUL 22: KEDISIPLINAN & TARBIYAH SANTRI (PPTQ ASNAWIYYAH)
 * ==============================================================================
 * File: js/kedisiplinan.js
 * Deskripsi:
 *  - Controller Frontend untuk Manajemen Tata Tertib & Kedisiplinan Santri
 *  - Manajemen Master Data Aturan Kustom (Admin)
 *  - Form Pencatatan Cepat Lapangan Berfitur Auto-Fill Cerdas
 *  - Siklus Pembinaan / Ta'zir (DIPROSES -> SEDANG_TAZIR -> TUNTAS)
 *  - Akselerasi Fast-Read Supabase Cloud Database (<150ms)
 *  - Widget Mutaba'ah Adab untuk Portal Wali Santri & Profil Santri
 * ==============================================================================
 */

(function () {
    'use strict';

    const ASNKedisiplinan = {
        masterRules: [],
        logs: [],
        currentFilter: {
            kategori: 'SEMUA',
            statusTazir: 'SEMUA',
            gender: 'SEMUA',
            search: ''
        },
        activeTab: 'logs', // 'logs' | 'master'
        isLoading: false,

        /**
         * Inisialisasi Modul Kedisiplinan
         */
        async init() {
            console.log('[KEDISIPLINAN] Menginisialisasi Modul Kedisiplinan & Tarbiyah Santri...');
            await this.loadMasterRules();
            await this.loadLogs();
            this.bindEvents();
        },

        /**
         * Fast-Read Master Data Aturan Tata Tertib dari Supabase
         */
        async loadMasterRules(forceRefresh = false) {
            if (this.masterRules.length > 0 && !forceRefresh) return this.masterRules;

            const config = window.ASNAWIYYAH_CONFIG || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;

            if (sbUrl && sbKey) {
                try {
                    const res = await fetch(`${sbUrl}/rest/v1/kedisiplinan_master?select=*&order=urutan.asc`, {
                        headers: {
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Cache-Control': 'no-cache'
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        this.masterRules = data.map(r => ({
                            ruleId: r.rule_id,
                            kodePasal: r.kode_pasal || '',
                            namaPelanggaran: r.nama_pelanggaran,
                            kategori: r.kategori || 'RINGAN',
                            poinDefault: Number(r.poin_default) || 5,
                            rekomendasiTazir: r.rekomendasi_tazir || '',
                            status: r.status || 'AKTIF',
                            urutan: Number(r.urutan) || 1
                        }));
                        return this.masterRules;
                    }
                } catch (e) {
                    console.warn('[KEDISIPLINAN] Supabase read master failed, fallback to API:', e);
                }
            }

            // Fallback ke Google Apps Script API
            try {
                if (typeof apiGet === 'function') {
                    const res = await apiGet('getKedisiplinanMasterList');
                    if (res && res.data) {
                        this.masterRules = res.data;
                        return this.masterRules;
                    }
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Failed to load master rules:', err);
            }
            return [];
        },

        /**
         * Fast-Read Riwayat Log Pelanggaran dari Supabase
         */
        async loadLogs(forceRefresh = false) {
            if (this.logs.length > 0 && !forceRefresh) return this.logs;

            const config = window.ASNAWIYYAH_CONFIG || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;

            if (sbUrl && sbKey) {
                try {
                    const res = await fetch(`${sbUrl}/rest/v1/kedisiplinan_logs?select=*&order=tanggal.desc`, {
                        headers: {
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Cache-Control': 'no-cache'
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        this.logs = data.map(r => ({
                            recordId: r.record_id,
                            studentId: r.student_id,
                            nis: r.nis || '',
                            studentName: r.student_name,
                            gender: r.gender || 'Putra',
                            kamarAsrama: r.kamar_asrama || '',
                            namaHalaqah: r.nama_halaqah || '',
                            ruleId: r.rule_id || '',
                            namaPelanggaran: r.nama_pelanggaran,
                            kategori: r.kategori || 'RINGAN',
                            poin: Number(r.poin) || 0,
                            tanggal: r.tanggal,
                            waktu: r.waktu || '',
                            lokasi: r.lokasi || '',
                            kronologi: r.kronologi || '',
                            bentukTazir: r.bentuk_tazir || '',
                            statusTazir: r.status_tazir || 'DIPROSES',
                            tanggalTuntas: r.tanggal_tuntas || null,
                            pencatatId: r.pencatat_id || '',
                            namaPencatat: r.nama_pencatat || '',
                            notifWaliStatus: r.notif_wali_status || 'PENDING',
                            notifWaliTime: r.notif_wali_time || null,
                            createdAt: r.created_at
                        }));
                        this.renderDashboard();
                        return this.logs;
                    }
                } catch (e) {
                    console.warn('[KEDISIPLINAN] Supabase read logs failed, fallback to API:', e);
                }
            }

            // Fallback ke Google Apps Script
            try {
                if (typeof apiGet === 'function') {
                    const res = await apiGet('getKedisiplinanLogs');
                    if (res && res.data) {
                        this.logs = res.data;
                        this.renderDashboard();
                        return this.logs;
                    }
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Failed to load logs:', err);
            }
            return [];
        },

        /**
         * Render Dashboard Kedisiplinan & Tarbiyah
         */
        renderDashboard() {
            this.renderKPIs();
            this.renderLogsList();
            this.renderMasterRulesTable();
        },

        /**
         * Hitung & Tampilkan Indikator Utama (KPI Cards)
         */
        renderKPIs() {
            const now = new Date();
            const curMonth = String(now.getMonth() + 1).padStart(2, '0');
            const curYear = String(now.getFullYear());
            const curMonthPrefix = `${curYear}-${curMonth}`;

            let totalKasusBulanIni = 0;
            let tazirAktif = 0;
            const studentPointMap = {};

            this.logs.forEach(log => {
                if (String(log.tanggal || '').startsWith(curMonthPrefix)) {
                    totalKasusBulanIni++;
                }
                if (log.statusTazir !== 'TUNTAS') {
                    tazirAktif++;
                }
                const sId = log.studentId || log.nis || log.studentName;
                if (!studentPointMap[sId]) {
                    studentPointMap[sId] = {
                        name: log.studentName,
                        nis: log.nis,
                        points: 0
                    };
                }
                studentPointMap[sId].points += Number(log.poin) || 0;
            });

            const santriKritisCount = Object.values(studentPointMap).filter(s => s.points >= 50).length;

            const elTotalBulan = document.getElementById('kpi-kedisiplinan-total-bulan');
            if (elTotalBulan) elTotalBulan.textContent = totalKasusBulanIni;

            const elTazirAktif = document.getElementById('kpi-kedisiplinan-tazir-aktif');
            if (elTazirAktif) elTazirAktif.textContent = tazirAktif;

            const elSantriKritis = document.getElementById('kpi-kedisiplinan-santri-kritis');
            if (elSantriKritis) elSantriKritis.textContent = santriKritisCount;

            const elTotalAturan = document.getElementById('kpi-kedisiplinan-total-aturan');
            if (elTotalAturan) elTotalAturan.textContent = this.masterRules.filter(r => r.status === 'AKTIF').length;

            // Update Badges & Priority Alert Card for Pengasuh / Admin
            const pengasuhBadge = document.getElementById('pengasuh-kedisiplinan-badge');
            const adminBadge = document.getElementById('admin-kedisiplinan-badge');
            if (pengasuhBadge) {
                if (santriKritisCount > 0) {
                    pengasuhBadge.textContent = santriKritisCount;
                    pengasuhBadge.classList.remove('hidden');
                } else {
                    pengasuhBadge.classList.add('hidden');
                }
            }
            if (adminBadge) {
                if (tazirAktif > 0) {
                    adminBadge.textContent = tazirAktif;
                    adminBadge.classList.remove('hidden');
                } else {
                    adminBadge.classList.add('hidden');
                }
            }

            const priorityCard = document.getElementById('pengasuh-priority-kedisiplinan-card');
            const priorityBadge = document.getElementById('pengasuh-priority-kedisiplinan-badge');
            const priorityText = document.getElementById('pengasuh-priority-kedisiplinan-text');
            if (priorityCard) {
                const currentRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                    sessionStorage.getItem('asnawiyyah_admin_role') || '';
                const isPengasuhOrAdmin = ['PENGASUH', 'SUPER_ADMIN', 'ADMIN'].includes(currentRole.toUpperCase());
                if (isPengasuhOrAdmin && santriKritisCount > 0) {
                    priorityCard.classList.remove('hidden');
                    if (priorityBadge) priorityBadge.textContent = `${santriKritisCount} Santri Perlu Perhatian`;
                    if (priorityText) priorityText.textContent = `Terdapat ${santriKritisCount} santri dengan akumulasi poin tata tertib mencapai >= 50 poin (Ambang batas SP 1 / pemanggilan wali santri ke Ndalem Pengasuh).`;
                } else {
                    priorityCard.classList.add('hidden');
                }
            }
        },

        /**
         * Render Daftar Riwayat Pelanggaran Santri
         */
        renderLogsList() {
            const container = document.getElementById('kedisiplinan-logs-container');
            if (!container) return;

            const filter = this.currentFilter;
            const searchKeyword = String(filter.search || '').toLowerCase().trim();

            const filteredLogs = this.logs.filter(log => {
                if (filter.kategori !== 'SEMUA' && log.kategori !== filter.kategori) return false;
                if (filter.statusTazir !== 'SEMUA' && log.statusTazir !== filter.statusTazir) return false;
                if (filter.gender !== 'SEMUA' && !log.gender.toUpperCase().startsWith(filter.gender.substring(0, 1))) return false;
                if (searchKeyword) {
                    const matchName = String(log.studentName || '').toLowerCase().includes(searchKeyword);
                    const matchNis = String(log.nis || '').toLowerCase().includes(searchKeyword);
                    const matchPel = String(log.namaPelanggaran || '').toLowerCase().includes(searchKeyword);
                    const matchKamar = String(log.kamarAsrama || '').toLowerCase().includes(searchKeyword);
                    if (!matchName && !matchNis && !matchPel && !matchKamar) return false;
                }
                return true;
            });

            if (filteredLogs.length === 0) {
                container.innerHTML = `
                    <div class="py-12 px-4 text-center text-slate-400 dark:text-slate-500">
                        <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-300 dark:text-slate-600 text-2xl">
                            <i class="fa-solid fa-scale-balanced"></i>
                        </div>
                        <p class="font-bold text-sm text-slate-600 dark:text-slate-400">Belum Ada Catatan Kedisiplinan</p>
                        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Tidak ditemukan riwayat yang sesuai dengan filter pencarian.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredLogs.map(log => {
                const isTuntas = log.statusTazir === 'TUNTAS';

                // Badge Kategori
                let badgeKatClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/40';
                if (log.kategori === 'SEDANG') {
                    badgeKatClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/40';
                } else if (log.kategori === 'BERAT') {
                    badgeKatClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/40';
                }

                // Badge Status Ta'zir
                let statusBadge = isTuntas
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40"><i class="fa-solid fa-circle-check text-[10px]"></i> Tuntas</span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40"><i class="fa-solid fa-hourglass-half text-[10px] animate-spin-slow"></i> Sedang Ta'zir</span>`;

                return `
                    <div class="p-4 rounded-2xl bg-white dark:bg-[#15202d] border border-slate-100 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200">
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-sm shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                                    ${(log.studentName || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div class="min-w-0">
                                    <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${escapeHtml(log.studentName)}</h4>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                        <span>NIS: ${escapeHtml(log.nis || '-')}</span>
                                        <span>•</span>
                                        <span>${escapeHtml(log.gender || 'Putra')}</span>
                                        ${log.kamarAsrama ? `<span>•</span><span>${escapeHtml(log.kamarAsrama)}</span>` : ''}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${badgeKatClass} border">
                                    <span>${escapeHtml(log.kategori)}</span>
                                    <span>+${log.poin}</span>
                                </div>
                                <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                    ${log.tanggal}
                                </div>
                            </div>
                        </div>

                        <div class="my-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-xs">
                            <div class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                                <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                                <span>${escapeHtml(log.namaPelanggaran)}</span>
                            </div>
                            <div class="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                <span class="font-semibold text-slate-700 dark:text-slate-300">Tindakan Tarbiyah (Ta'zir):</span> ${escapeHtml(log.bentukTazir || '-')}
                            </div>
                            ${log.kronologi ? `<div class="text-slate-500 dark:text-slate-400 text-[11px] mt-1 italic">"${escapeHtml(log.kronologi)}"</div>` : ''}
                        </div>

                        <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                            <div class="flex items-center gap-2">
                                ${statusBadge}
                                ${log.notifWaliStatus === 'TERKIRIM' 
                                    ? `<span class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"><i class="fa-brands fa-whatsapp text-xs"></i> Wali Terhubung</span>`
                                    : `<span class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><i class="fa-solid fa-clock text-[9px]"></i> WA Pending</span>`}
                            </div>
                            <div class="flex items-center gap-2">
                                ${!isTuntas ? `
                                    <button onclick="ASNKedisiplinan.tandaiTuntas('${log.recordId}')"
                                        class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                                        <i class="fa-solid fa-check text-xs"></i>
                                        <span>Tandai Tuntas</span>
                                    </button>
                                ` : `
                                    <span class="text-[11px] text-slate-400 dark:text-slate-500 italic">Selesai ${log.tanggalTuntas || ''}</span>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * Render Tabel Master Aturan (Pengaturan Admin)
         */
        renderMasterRulesTable() {
            const container = document.getElementById('kedisiplinan-master-container');
            if (!container) return;

            if (this.masterRules.length === 0) {
                container.innerHTML = `
                    <div class="py-8 text-center text-slate-400 text-xs">
                        Belum ada aturan master. Tekan tombol <b>+ Tambah Aturan</b> untuk membuat aturan baru.
                    </div>
                `;
                return;
            }

            container.innerHTML = this.masterRules.map(r => {
                const isAktif = r.status === 'AKTIF';
                let badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300';
                if (r.kategori === 'SEDANG') badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300';
                if (r.kategori === 'BERAT') badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300';

                return `
                    <div class="p-3.5 rounded-2xl bg-white dark:bg-[#15202d] border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <span class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${badgeClass}">${r.kategori} (${r.poinDefault} Poin)</span>
                                ${r.kodePasal ? `<span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">${escapeHtml(r.kodePasal)}</span>` : ''}
                                ${!isAktif ? `<span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold">Nonaktif</span>` : ''}
                            </div>
                            <h5 class="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">${escapeHtml(r.namaPelanggaran)}</h5>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                <i class="fa-solid fa-seedling text-emerald-500 mr-1"></i>Ta'zir: ${escapeHtml(r.rekomendasiTazir || 'Bimbingan lisan')}
                            </p>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button onclick="ASNKedisiplinan.openEditRuleModal('${r.ruleId}')"
                                class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                                title="Edit Aturan">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button onclick="ASNKedisiplinan.deleteRule('${r.ruleId}')"
                                class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition"
                                title="Hapus Aturan">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * Buka Modal Form Catat Pelanggaran Cepat
         */
        openCatatModal(prefillStudent = null) {
            const modal = document.getElementById('modal-catat-kedisiplinan');
            if (!modal) return;

            // Isi dropdown aturan master
            const ruleSelect = document.getElementById('catat-kedisiplinan-rule-select');
            if (ruleSelect) {
                ruleSelect.innerHTML = `<option value="">-- Pilih Jenis Pelanggaran --</option>` +
                    this.masterRules
                        .filter(r => r.status === 'AKTIF')
                        .map(r => `<option value="${r.ruleId}">[${r.kategori} - ${r.poinDefault} Poin] ${escapeHtml(r.namaPelanggaran)}</option>`)
                        .join('') +
                    `<option value="CUSTOM">+ Pelanggaran Khusus / Lainnya...</option>`;
            }

            // Atur tanggal hari ini
            const tglEl = document.getElementById('catat-kedisiplinan-tanggal');
            if (tglEl) tglEl.value = new Date().toISOString().split('T')[0];

            // Atur jam saat ini
            const jamEl = document.getElementById('catat-kedisiplinan-waktu');
            if (jamEl) {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                jamEl.value = `${hh}:${mm} WIB`;
            }

            // Populasi datalist santri jika ada data santri di cache/window
            const datalist = document.getElementById('kedisiplinan-santri-datalist');
            const studentsList = window.adminStudentsData || (window.ASNPerpulangan && typeof window.ASNPerpulangan.getAllAvailableStudents === 'function' ? window.ASNPerpulangan.getAllAvailableStudents() : []);
            if (datalist && Array.isArray(studentsList) && studentsList.length > 0) {
                datalist.innerHTML = studentsList.map(s => {
                    const sName = s.name || s.nama || '';
                    const sNis = s.nis || '';
                    return `<option value="${escapeHtml(sName)}">${sNis ? `[NIS: ${sNis}]` : ''} ${escapeHtml(sName)}</option>`;
                }).join('');
            }

            // Jika ada prefill santri
            if (prefillStudent) {
                const sId = document.getElementById('catat-kedisiplinan-student-id');
                if (sId) sId.value = prefillStudent.studentId || prefillStudent.id || '';
                const sName = document.getElementById('catat-kedisiplinan-student-name');
                if (sName) sName.value = prefillStudent.name || prefillStudent.studentName || '';
                const sNis = document.getElementById('catat-kedisiplinan-nis');
                if (sNis) sNis.value = prefillStudent.nis || '';
            }

            modal.classList.remove('hidden');
        },

        /**
         * Auto-Fill saat Pengurus Memilih Aturan dari Dropdown
         */
        handleRuleSelectChange(ruleId) {
            const namaEl = document.getElementById('catat-kedisiplinan-nama-pelanggaran');
            const katEl = document.getElementById('catat-kedisiplinan-kategori');
            const poinEl = document.getElementById('catat-kedisiplinan-poin');
            const tazirEl = document.getElementById('catat-kedisiplinan-tazir');
            const customBox = document.getElementById('catat-kedisiplinan-custom-box');

            if (!ruleId || ruleId === 'CUSTOM') {
                if (customBox) customBox.classList.remove('hidden');
                if (namaEl && !ruleId) namaEl.value = '';
                if (katEl) katEl.value = 'RINGAN';
                if (poinEl) poinEl.value = 5;
                if (tazirEl && !ruleId) tazirEl.value = '';
                return;
            }

            if (customBox) customBox.classList.add('hidden');

            const rule = this.masterRules.find(r => r.ruleId === ruleId);
            if (rule) {
                if (namaEl) namaEl.value = rule.namaPelanggaran;
                if (katEl) katEl.value = rule.kategori;
                if (poinEl) poinEl.value = rule.poinDefault;
                if (tazirEl) tazirEl.value = rule.rekomendasiTazir || 'Bimbingan & Nasihat Pengurus';
            }
        },

        /**
         * Simpan Catatan Pelanggaran Baru (Dual Write + Trigger WA)
         */
        async submitCatat(e) {
            if (e) e.preventDefault();

            const ruleSelect = document.getElementById('catat-kedisiplinan-rule-select');
            const ruleId = ruleSelect ? ruleSelect.value : '';

            const studentId = document.getElementById('catat-kedisiplinan-student-id')?.value?.trim();
            const nis = document.getElementById('catat-kedisiplinan-nis')?.value?.trim();
            const studentName = document.getElementById('catat-kedisiplinan-student-name')?.value?.trim();

            if (!studentName && !studentId) {
                alert('Silakan pilih atau masukkan data santri.');
                return;
            }

            const namaPelanggaran = document.getElementById('catat-kedisiplinan-nama-pelanggaran')?.value?.trim();
            if (!namaPelanggaran) {
                alert('Nama pelanggaran wajib diisi.');
                return;
            }

            const kategori = document.getElementById('catat-kedisiplinan-kategori')?.value || 'RINGAN';
            const poin = Number(document.getElementById('catat-kedisiplinan-poin')?.value) || 5;
            const tanggal = document.getElementById('catat-kedisiplinan-tanggal')?.value || new Date().toISOString().split('T')[0];
            const waktu = document.getElementById('catat-kedisiplinan-waktu')?.value || '';
            const lokasi = document.getElementById('catat-kedisiplinan-lokasi')?.value || 'Lingkungan Pondok';
            const bentukTazir = document.getElementById('catat-kedisiplinan-tazir')?.value || 'Nasihat Pembina';
            const kronologi = document.getElementById('catat-kedisiplinan-kronologi')?.value || '';
            const statusTazir = document.getElementById('catat-kedisiplinan-status-tazir')?.value || 'DIPROSES';

            const padZ = (n) => String(n).padStart(2, '0');
            const dNow = new Date();
            const autoRecordId = `DSC-${dNow.getFullYear()}${padZ(dNow.getMonth() + 1)}${padZ(dNow.getDate())}-${padZ(dNow.getHours())}${padZ(dNow.getMinutes())}${padZ(dNow.getSeconds())}-${Math.floor(1000 + Math.random() * 9000)}`;

            const payload = {
                recordId: autoRecordId,
                record_id: autoRecordId,
                studentId: studentId || 'STD-000',
                student_id: studentId || 'STD-000',
                nis: nis,
                studentName: studentName,
                student_name: studentName,
                ruleId: (ruleId && ruleId !== 'CUSTOM') ? ruleId : null,
                namaPelanggaran: namaPelanggaran,
                nama_pelanggaran: namaPelanggaran,
                kategori: kategori,
                poin: poin,
                tanggal: tanggal,
                waktu: waktu,
                lokasi: lokasi,
                bentukTazir: bentukTazir,
                bentuk_tazir: bentukTazir,
                kronologi: kronologi,
                statusTazir: statusTazir,
                status_tazir: statusTazir,
                pencatatId: window.CURRENT_USER?.userId || 'KAMTIB',
                namaPencatat: window.CURRENT_USER?.name || 'Pengurus Kamtib'
            };

            const btn = document.getElementById('btn-submit-catat-kedisiplinan');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...`;
            }

            try {
                let res = null;
                if (typeof apiPost === 'function') {
                    res = await apiPost('saveKedisiplinanLog', payload);
                }

                if (res && (res.success || res.status === 'success')) {
                    if (typeof showCustomToast === 'function') {
                        showCustomToast(`Catatan kedisiplinan ${studentName} berhasil disimpan! Pesan notifikasi WA diproses.`, 'success');
                    } else {
                        alert(`Catatan kedisiplinan ${studentName} berhasil disimpan!`);
                    }

                    // Tutup modal
                    const modal = document.getElementById('modal-catat-kedisiplinan');
                    if (modal) modal.classList.add('hidden');

                    // Refresh data
                    await this.loadLogs(true);
                } else {
                    alert((res && res.message) || 'Gagal menyimpan catatan kedisiplinan.');
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Error save log:', err);
                alert('Terjadi kesalahan saat menyimpan catatan.');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Simpan & Kirim Notifikasi`;
                }
            }
        },

        /**
         * Tandai Status Ta'zir Menjadi Tuntas (1-Klik)
         */
        async tandaiTuntas(recordId) {
            if (!confirm('Apakah santri yang bersangkutan telah menyelesaikan tugas tarbiyah / ta\'zir mendidik dengan tuntas?')) {
                return;
            }

            try {
                let res = null;
                if (typeof apiPost === 'function') {
                    res = await apiPost('updateStatusTazir', {
                        recordId: recordId,
                        record_id: recordId,
                        statusTazir: 'TUNTAS',
                        status_tazir: 'TUNTAS'
                    });
                }

                if (res && (res.success || res.status === 'success')) {
                    if (typeof showCustomToast === 'function') {
                        showCustomToast('Alhamdulillah, status ta\'zir santri telah ditandai TUNTAS!', 'success');
                    }
                    await this.loadLogs(true);
                } else {
                    alert((res && res.message) || 'Gagal memperbarui status ta\'zir.');
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Error mark tuntas:', err);
                alert('Terjadi kesalahan jaringan.');
            }
        },

        /**
         * Buka Modal Edit / Tambah Aturan Master
         */
        openEditRuleModal(ruleId = null) {
            const modal = document.getElementById('modal-edit-master-rule');
            if (!modal) return;

            const titleEl = document.getElementById('modal-edit-rule-title');
            const idEl = document.getElementById('edit-rule-id');
            const pasalEl = document.getElementById('edit-rule-pasal');
            const namaEl = document.getElementById('edit-rule-nama');
            const katEl = document.getElementById('edit-rule-kategori');
            const poinEl = document.getElementById('edit-rule-poin');
            const tazirEl = document.getElementById('edit-rule-tazir');
            const statusEl = document.getElementById('edit-rule-status');

            if (ruleId) {
                const rule = this.masterRules.find(r => r.ruleId === ruleId);
                if (titleEl) titleEl.textContent = 'Sunting Aturan Tata Tertib';
                if (idEl) idEl.value = rule.ruleId;
                if (pasalEl) pasalEl.value = rule.kodePasal || '';
                if (namaEl) namaEl.value = rule.namaPelanggaran;
                if (katEl) katEl.value = rule.kategori;
                if (poinEl) poinEl.value = rule.poinDefault;
                if (tazirEl) tazirEl.value = rule.rekomendasiTazir || '';
                if (statusEl) statusEl.value = rule.status;
            } else {
                if (titleEl) titleEl.textContent = 'Tambah Aturan Tata Tertib Baru';
                if (idEl) idEl.value = '';
                if (pasalEl) pasalEl.value = '';
                if (namaEl) namaEl.value = '';
                if (katEl) katEl.value = 'RINGAN';
                if (poinEl) poinEl.value = 5;
                if (tazirEl) tazirEl.value = '';
                if (statusEl) statusEl.value = 'AKTIF';
            }

            modal.classList.remove('hidden');
        },

        /**
         * Simpan Perubahan Aturan Master
         */
        async submitSaveRule(e) {
            if (e) e.preventDefault();

            const ruleId = document.getElementById('edit-rule-id')?.value;
            const kodePasal = document.getElementById('edit-rule-pasal')?.value?.trim();
            const namaPelanggaran = document.getElementById('edit-rule-nama')?.value?.trim();
            if (!namaPelanggaran) {
                alert('Nama pelanggaran wajib diisi.');
                return;
            }

            const kategori = document.getElementById('edit-rule-kategori')?.value || 'RINGAN';
            const poinDefault = Number(document.getElementById('edit-rule-poin')?.value) || 5;
            const rekomendasiTazir = document.getElementById('edit-rule-tazir')?.value?.trim();
            const status = document.getElementById('edit-rule-status')?.value || 'AKTIF';

            const payload = {
                ruleId: ruleId || ('RULE-' + Math.floor(100 + Math.random() * 900)),
                kodePasal,
                namaPelanggaran,
                kategori,
                poinDefault,
                rekomendasiTazir,
                status
            };

            try {
                let res = null;
                if (typeof apiPost === 'function') {
                    res = await apiPost('saveKedisiplinanRule', payload);
                }

                if (res && (res.success || res.status === 'success')) {
                    if (typeof showCustomToast === 'function') {
                        showCustomToast('Aturan tata tertib berhasil disimpan!', 'success');
                    }
                    const modal = document.getElementById('modal-edit-master-rule');
                    if (modal) modal.classList.add('hidden');
                    await this.loadMasterRules(true);
                    this.renderMasterRulesTable();
                } else {
                    alert((res && res.message) || 'Gagal menyimpan aturan.');
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Error save rule:', err);
                alert('Terjadi kesalahan.');
            }
        },

        /**
         * Hapus Aturan Master
         */
        async deleteRule(ruleId) {
            if (!confirm('Apakah Anda yakin ingin menghapus aturan tata tertib ini dari master data?')) {
                return;
            }

            try {
                let res = null;
                if (typeof apiPost === 'function') {
                    res = await apiPost('deleteKedisiplinanRule', { ruleId });
                }

                if (res && (res.success || res.status === 'success')) {
                    if (typeof showCustomToast === 'function') {
                        showCustomToast('Aturan berhasil dihapus.', 'info');
                    }
                    await this.loadMasterRules(true);
                    this.renderMasterRulesTable();
                } else {
                    alert((res && res.message) || 'Gagal menghapus aturan.');
                }
            } catch (err) {
                console.error('[KEDISIPLINAN] Error delete rule:', err);
                alert('Terjadi kesalahan jaringan.');
            }
        },

        /**
         * Buka Modal Mutaba'ah Kedisiplinan & Adab Santri (Untuk Wali Santri & Profil Santri)
         */
        async openStudentDisciplineModal(studentId, studentName, studentNis) {
            let modal = document.getElementById('modal-wali-kedisiplinan-detail');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-wali-kedisiplinan-detail';
                modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4 hidden';
                modal.innerHTML = `
                    <div class="bg-white dark:bg-[#15202d] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-[#253447] flex flex-col max-h-[92vh] transform transition-all">
                        <div class="px-5 py-4 bg-slate-50 dark:bg-[#1c2836] border-b border-slate-100 dark:border-[#253447] flex justify-between items-center shrink-0">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-8 h-8 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-xl flex items-center justify-center text-sm font-bold">
                                    <i class="fa-solid fa-scale-balanced"></i>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100" id="wali-disiplin-modal-name">Mutaba'ah Adab Santri</h3>
                                    <p class="text-[10px] text-slate-400" id="wali-disiplin-modal-sub">Catatan Tata Tertib &amp; Pembinaan Karakter</p>
                                </div>
                            </div>
                            <button type="button" onclick="document.getElementById('modal-wali-kedisiplinan-detail').classList.add('hidden')" class="w-8 h-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#253447] rounded-xl flex items-center justify-center transition active:scale-95">
                                <i class="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>
                        <div id="wali-disiplin-modal-content" class="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                            <div class="py-8 text-center text-slate-400">
                                <i class="fa-solid fa-spinner animate-spin text-2xl text-amber-500 mb-2"></i>
                                <p>Memuat catatan adab santri...</p>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const titleName = document.getElementById('wali-disiplin-modal-name');
            const subTitle = document.getElementById('wali-disiplin-modal-sub');
            const contentBox = document.getElementById('wali-disiplin-modal-content');
            if (titleName) titleName.textContent = studentName || 'Mutaba\'ah Adab Santri';
            if (subTitle) subTitle.textContent = `NIS: ${studentNis || '-'} • Pembinaan Akhlak Santri`;
            modal.classList.remove('hidden');

            try {
                let summaryData = null;
                if (typeof apiGet === 'function') {
                    const res = await apiGet('getKedisiplinanStudentSummary', {
                        studentId: studentId,
                        nis: studentNis
                    });
                    if (res && res.data) summaryData = res.data;
                }

                if (!summaryData) {
                    contentBox.innerHTML = `
                        <div class="py-8 text-center text-slate-400">
                            <p>Data belum dapat dimuat saat ini. Periksa koneksi internet Anda.</p>
                        </div>
                    `;
                    return;
                }

                const totalPoin = summaryData.totalPoin || 0;
                const activeTazirCount = summaryData.activeTazirCount || 0;
                const logs = summaryData.logs || [];

                let statusBadgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
                let statusLabel = 'Terpuji (Sangat Baik)';
                if (totalPoin >= 100) {
                    statusBadgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
                    statusLabel = 'Pemanggilan Wali Santri (SP 3)';
                } else if (totalPoin >= 75) {
                    statusBadgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
                    statusLabel = 'Perlu Perhatian Serius (SP 2)';
                } else if (totalPoin >= 50) {
                    statusBadgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
                    statusLabel = 'Peringatan Pertama (SP 1)';
                } else if (totalPoin >= 30) {
                    statusBadgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
                    statusLabel = 'Tahap Pembinaan Lisan';
                }

                let logsHtml = '';
                if (logs.length === 0) {
                    logsHtml = `
                        <div class="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto text-xl mb-2">
                                <i class="fa-solid fa-award"></i>
                            </div>
                            <h5 class="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Alhamdulillah, Nihil Pelanggaran!</h5>
                            <p class="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">Santri menjaga tata krama dan tata tertib pesantren dengan sangat baik. Semoga istiqomah dalam menuntut ilmu.</p>
                        </div>
                    `;
                } else {
                    logsHtml = `
                        <div class="space-y-2">
                            <h5 class="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                                <i class="fa-solid fa-list-check text-amber-500"></i>
                                <span>Riwayat Catatan Tata Tertib:</span>
                            </h5>
                            <div class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                ${logs.map(log => `
                                    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                                        <div class="flex items-start justify-between gap-2 mb-1">
                                            <span class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(log.namaPelanggaran)}</span>
                                            <span class="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">+${log.poin} Poin</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>Tanggal: ${log.tanggal}</span> • <span>Ta'zir: ${escapeHtml(log.bentukTazir || '-')}</span>
                                        </div>
                                        <div class="mt-1.5 flex items-center justify-between">
                                            <span class="text-[10px] ${log.statusTazir === 'TUNTAS' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}">
                                                ${log.statusTazir === 'TUNTAS' ? '✓ Ta\'zir Tuntas Diselesaikan' : '⏳ Sedang Menjalani Ta\'zir'}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                contentBox.innerHTML = `
                    <!-- Summary Score Grid -->
                    <div class="grid grid-cols-2 gap-2.5">
                        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-[#1c2836] border border-slate-100 dark:border-[#253447]">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Akumulasi Poin</div>
                            <div class="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">${totalPoin} <span class="text-xs font-normal text-slate-400">Poin</span></div>
                        </div>
                        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-[#1c2836] border border-slate-100 dark:border-[#253447]">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ta'zir Aktif</div>
                            <div class="text-xl font-black ${activeTazirCount > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-0.5">${activeTazirCount} <span class="text-xs font-normal text-slate-400">Tugas</span></div>
                        </div>
                    </div>

                    <!-- Status Banner -->
                    <div class="p-3 rounded-2xl ${statusBadgeBg} border border-current/20 flex items-center justify-between">
                        <div>
                            <div class="text-[10px] uppercase font-extrabold opacity-75">Status Akhlak &amp; Adab</div>
                            <div class="text-xs font-extrabold">${statusLabel}</div>
                        </div>
                        <i class="fa-solid fa-shield-halved text-lg opacity-80"></i>
                    </div>

                    ${logsHtml}
                `;
            } catch (e) {
                console.error('[KEDISIPLINAN] Error open student modal:', e);
                contentBox.innerHTML = `<div class="py-4 text-center text-rose-500">Gagal memuat data.</div>`;
            }
        },

        /**
         * Event Listeners Binding
         */
        bindEvents() {
            // Search Input Listener
            const searchInput = document.getElementById('filter-kedisiplinan-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.currentFilter.search = e.target.value;
                    this.renderLogsList();
                });
            }

            // Kategori Filter Listener
            const katFilter = document.getElementById('filter-kedisiplinan-kategori');
            if (katFilter) {
                katFilter.addEventListener('change', (e) => {
                    this.currentFilter.kategori = e.target.value;
                    this.renderLogsList();
                });
            }

            // Status Ta'zir Filter Listener
            const statusFilter = document.getElementById('filter-kedisiplinan-status');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    this.currentFilter.statusTazir = e.target.value;
                    this.renderLogsList();
                });
            }

            // Student Name Input Auto-Resolve NIS
            const studentInput = document.getElementById('catat-kedisiplinan-student-name');
            if (studentInput) {
                studentInput.addEventListener('input', (e) => {
                    const val = (e.target.value || '').trim().toLowerCase();
                    const studentsList = window.adminStudentsData || [];
                    const matched = studentsList.find(s => (s.name || s.nama || '').toLowerCase() === val);
                    if (matched) {
                        const sIdEl = document.getElementById('catat-kedisiplinan-student-id');
                        const sNisEl = document.getElementById('catat-kedisiplinan-nis');
                        if (sIdEl) sIdEl.value = matched.student_id || matched.studentId || matched.id || '';
                        if (sNisEl) sNisEl.value = matched.nis || '';
                    }
                });
            }
        }
    };

    function switchKedisiplinanTab(tab) {
        const logsSec = document.getElementById('kedisiplinan-tab-logs-section');
        const masterSec = document.getElementById('kedisiplinan-tab-master-section');
        const btnLogs = document.getElementById('tab-btn-kedisiplinan-logs');
        const btnMaster = document.getElementById('tab-btn-kedisiplinan-master');
        if (!logsSec || !masterSec) return;

        if (tab === 'master') {
            logsSec.classList.add('hidden');
            masterSec.classList.remove('hidden');
            if (btnLogs) btnLogs.className = 'pb-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition flex items-center gap-1.5';
            if (btnMaster) btnMaster.className = 'pb-2.5 border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 transition flex items-center gap-1.5';
            if (window.ASNKedisiplinan) window.ASNKedisiplinan.renderMasterRulesTable();
        } else {
            masterSec.classList.add('hidden');
            logsSec.classList.remove('hidden');
            if (btnMaster) btnMaster.className = 'pb-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition flex items-center gap-1.5';
            if (btnLogs) btnLogs.className = 'pb-2.5 border-b-2 border-amber-500 text-amber-600 dark:text-amber-400 transition flex items-center gap-1.5';
            if (window.ASNKedisiplinan) window.ASNKedisiplinan.renderLogsList();
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Expose to window
    window.ASNKedisiplinan = ASNKedisiplinan;
    window.switchKedisiplinanTab = switchKedisiplinanTab;

})();
