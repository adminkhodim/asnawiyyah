/**
 * ============================================================================
 * 03_santri.js - Master Data Santri & Kesiswaan
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Data Santri (Load, Render Tabel, Filter Program/Kelas/Gender, Search)
 *  - Form Input & Edit Santri (openAdminStudentModal, submitAdminStudent, deleteAdminStudent)
 *  - Referensi Master Program Pesantren (DEFAULT_PESANTREN_PROGRAMS, save/delete program)
 *  - Referensi Master Kelas & Sekolah (DEFAULT_KELAS_SEKOLAH, save/delete kelas)
 *  - Bulk Update Program Santri (Modal & Batch Submit)
 *  - Bulk Update Kelas & Sekolah Santri (Modal & Batch Submit)
 *  - Ekspor Data Santri ke Excel (.xlsx / SheetJS) & CSV
 * ============================================================================
 */

        // ==================== DASHBOARD ADMIN: MANAJEMEN DATA SANTRI ====================
        let adminStudentsData = [];
        let filteredAdminStudentsData = [];
        let selectedAdminStudentIds = new Set();
        let pendingDeleteStudentId = null;
        let selectedStudentPhotoFile = null;

        /**
         * Muat seluruh data santri dari backend API
         */
        async function loadAdminStudentsData() {
            const loader = document.getElementById('admin-student-loader');
            const tbody = document.getElementById('admin-student-table-tbody');
            const mobileList = document.getElementById('admin-student-mobile-list');
            const emptyState = document.getElementById('admin-student-empty-state');

            if (loader) loader.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
                let response = null;

                if (typeof apiPost === 'function') {
                    try {
                        response = await apiPost("getStudents", { token });
                    } catch (postErr) {
                        console.warn("apiPost getStudents fallback:", postErr);
                    }
                }

                if (!response || !response.success) {
                    if (typeof apiGet === 'function') {
                        response = await apiGet("getStudents", token ? { token } : {});
                    }
                }

                if (response && (response.status === "success" || response.success)) {
                    adminStudentsData = response.data || [];
                    window.adminStudentsData = adminStudentsData;
                    window.adminStudentsList = adminStudentsData;

                    // Simpan ke localStorage cache agar KPI Dashboard Utama langsung aktual
                    try {
                        localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify(adminStudentsData));
                    } catch(cacheErr) { /* quota exceeded — abaikan */ }

                    // Update Hub Badge & KPI Cards
                    const hubBadge = document.getElementById('admin-hub-santri-count');
                    if (hubBadge) {
                        hubBadge.innerText = `${adminStudentsData.length} Santri`;
                    }
                    if (typeof updateAdminDashboardKpis === 'function') {
                        updateAdminDashboardKpis();
                    }

                    // Update Statistik
                    const summary = response.summary || {};
                    const totalEl = document.getElementById('admin-student-stat-total');
                    const putraEl = document.getElementById('admin-student-stat-putra');
                    const putriEl = document.getElementById('admin-student-stat-putri');
                    const aktifEl = document.getElementById('admin-student-stat-aktif');

                    const totalCount = summary.total !== undefined ? summary.total : adminStudentsData.length;
                    const putraCount = summary.putra !== undefined ? summary.putra : adminStudentsData.filter(s => (s.gender || '').toUpperCase() === 'L').length;
                    const putriCount = summary.putri !== undefined ? summary.putri : adminStudentsData.filter(s => (s.gender || '').toUpperCase() === 'P').length;
                    const aktifCount = summary.aktif !== undefined ? summary.aktif : adminStudentsData.filter(s => (s.status || '').toUpperCase() === 'ACTIVE').length;

                    if (totalEl) totalEl.innerText = totalCount;
                    if (putraEl) putraEl.innerText = putraCount;
                    if (putriEl) putriEl.innerText = putriCount;
                    if (aktifEl) aktifEl.innerText = aktifCount;

                    // Update Dropdown Filter Program & Kelas/Sekolah secara dinamis
                    populateAdminStudentProgramFilter();
                    populateAdminStudentKelasSekolahFilter();

                    // Filter & Render
                    filterAdminStudentsList();
                } else {
                    const msg = (response && response.message) || "Gagal memuat data santri.";
                    if (typeof showToast === 'function') showToast("⚠️ " + msg);
                    if (emptyState) emptyState.classList.remove('hidden');
                }
            } catch (err) {
                console.error("Gagal load data santri:", err);
                if (typeof showToast === 'function') showToast("❌ Gagal memuat data santri: " + err.message);
                if (emptyState) emptyState.classList.remove('hidden');
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }

        // =====================================================================
        // REFERENSI MASTER PROGRAM PESANTREN (UNTUK DATA SANTRI & PPDB)
        // =====================================================================
        const DEFAULT_PESANTREN_PROGRAMS = [
            { id: 'prog-tahfidz-anak', name: 'Tahfidz Anak', status: 'ACTIVE', description: 'Pendidikan Al-Qur\'an tahfidz usia dini / dasar' },
            { id: 'prog-tahfidz-remaja', name: 'Tahfidz Remaja', status: 'ACTIVE', description: 'Program hafalan santri usia remaja / sekolah lanjutan' },
            { id: 'prog-tahfidz-intensif', name: 'Tahfidz Intensif', status: 'ACTIVE', description: 'Program hafalan Al-Qur\'an intensif 30 Juz santri mukim' },
            { id: 'prog-pesantren-tahfidz-anak', name: 'Pesantren Tahfidz Anak', status: 'ACTIVE', description: 'Pendidikan Al-Qur\'an tahfidz usia dini / dasar' },
            { id: 'prog-dewasa-putra', name: 'Pesantren Dewasa Putra', status: 'ACTIVE', description: 'Program santri dewasa ikhwan / mahasiswa / pekerja' },
            { id: 'prog-dewasa-putri', name: 'Pesantren Dewasa Putri', status: 'ACTIVE', description: 'Program santri dewasa akhwat / mahasiswi' },
            { id: 'prog-kitab-kuning', name: 'Kajian Kitab Kuning', status: 'ACTIVE', description: 'Pendalaman kitab salaf dan gramatika Arab' },
            { id: 'prog-madrasah-diniyah', name: 'Madrasah Diniyah', status: 'ACTIVE', description: 'Pendidikan formal diniyah takmiliyah' },
            { id: 'prog-reguler', name: 'Reguler', status: 'ACTIVE', description: 'Program pesantren reguler umum' }
        ];

        function getAdminPesantrenPrograms() {
            try {
                const stored = localStorage.getItem('ASNAWIYYAH_PESANTREN_PROGRAMS_V1');
                let list = [];
                if (stored) {
                    list = JSON.parse(stored);
                }
                if (!Array.isArray(list) || list.length === 0) {
                    list = JSON.parse(JSON.stringify(DEFAULT_PESANTREN_PROGRAMS));
                }

                // Auto-merge program yang ada di data santri aktual agar tidak hilang
                if (Array.isArray(adminStudentsData) && adminStudentsData.length > 0) {
                    const existingNames = new Set(list.map(p => (p.name || '').trim().toLowerCase()));
                    adminStudentsData.forEach(s => {
                        const progName = (s.program || '').trim();
                        if (progName && !existingNames.has(progName.toLowerCase())) {
                            list.push({
                                id: 'prog-' + Math.random().toString(36).substring(2, 9),
                                name: progName,
                                status: 'ACTIVE',
                                description: 'Program terdata dari Master Santri'
                            });
                            existingNames.add(progName.toLowerCase());
                        }
                    });
                }

                return list;
            } catch (e) {
                console.warn("Gagal parse master program:", e);
                return JSON.parse(JSON.stringify(DEFAULT_PESANTREN_PROGRAMS));
            }
        }

        function saveAdminPesantrenPrograms(list) {
            try {
                localStorage.setItem('ASNAWIYYAH_PESANTREN_PROGRAMS_V1', JSON.stringify(list));
            } catch (e) {
                console.warn("Gagal simpan master program ke localStorage:", e);
            }
        }

        /**
         * Isi opsi dropdown Program Pesantren pada modal Tambah/Edit Santri
         */
        function populateAdminStudentProgramDropdown(selectedVal = '') {
            const selectEl = document.getElementById('admin-student-form-program');
            if (!selectEl) return;

            const programs = getAdminPesantrenPrograms();
            let optionsHtml = '';
            let valFound = false;
            const targetVal = (selectedVal || '').trim().toLowerCase();

            programs.forEach(prog => {
                const name = (prog.name || '').trim();
                if (!name) return;
                const isSelected = Boolean(targetVal && targetVal === name.toLowerCase());
                if (isSelected) valFound = true;

                const isInactive = (prog.status || 'ACTIVE').toUpperCase() !== 'ACTIVE';
                const label = isInactive ? `${name} (Nonaktif)` : name;

                if (!isInactive || isSelected) {
                    optionsHtml += `<option value="${escapeHtml(name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
                }
            });

            if (selectedVal && !valFound) {
                optionsHtml = `<option value="${escapeHtml(selectedVal.trim())}" selected>${escapeHtml(selectedVal.trim())}</option>` + optionsHtml;
            }

            selectEl.innerHTML = optionsHtml;
            if (selectedVal) {
                selectEl.value = selectedVal.trim();
            } else if (programs.length > 0) {
                const firstActive = programs.find(p => (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
                if (firstActive) selectEl.value = firstActive.name;
            }
        }

        /**
         * Isi dropdown filter program dari master program dan list santri
         */
        function populateAdminStudentProgramFilter() {
            const selectEl = document.getElementById('admin-student-filter-program');
            if (!selectEl) return;

            const currentVal = selectEl.value;
            const programs = new Set();

            // Ambil dari master program
            const masterList = getAdminPesantrenPrograms();
            masterList.forEach(p => {
                if (p.name && p.name.trim()) programs.add(p.name.trim());
            });

            // Ambil dari list santri jika ada variasi lain
            if (Array.isArray(adminStudentsData)) {
                adminStudentsData.forEach(s => {
                    if (s.program && s.program.trim()) {
                        programs.add(s.program.trim());
                    }
                });
            }

            let html = '<option value="ALL">Semua Program</option>';
            Array.from(programs).sort().forEach(prog => {
                html += `<option value="${escapeHtml(prog)}">${escapeHtml(prog)}</option>`;
            });
            selectEl.innerHTML = html;
            if (currentVal && (currentVal === 'ALL' || Array.from(programs).includes(currentVal))) {
                selectEl.value = currentVal;
            }
        }

        /**
         * Buka modal Kelola Program Pesantren
         */
        function openAdminProgramManagerModal() {
            const modal = document.getElementById('modal-admin-program-manager');
            if (!modal) return;
            resetProgramReferenceForm();
            renderAdminProgramManagerTable();
            modal.classList.remove('hidden');
        }

        /**
         * Tutup modal Kelola Program Pesantren
         */
        function closeAdminProgramManagerModal() {
            const modal = document.getElementById('modal-admin-program-manager');
            if (modal) modal.classList.add('hidden');
            resetProgramReferenceForm();
            // Sinkronkan dropdown modal santri jika sedang terbuka
            const currentSelected = document.getElementById('admin-student-form-program')?.value || '';
            populateAdminStudentProgramDropdown(currentSelected);
            // Sinkronkan filter santri
            populateAdminStudentProgramFilter();
        }

        /**
         * Reset form tambah/edit program di dalam modal
         */
        function resetProgramReferenceForm() {
            const form = document.getElementById('adminProgramReferenceForm');
            if (form) form.reset();
            const idInput = document.getElementById('admin-program-input-id');
            if (idInput) idInput.value = '';
            const statusSelect = document.getElementById('admin-program-input-status');
            if (statusSelect) statusSelect.value = 'ACTIVE';

            const titleEl = document.getElementById('admin-program-form-title');
            if (titleEl) {
                titleEl.innerHTML = '<i class="fa-solid fa-circle-plus text-emerald-500"></i><span>Tambah Referensi Program Baru</span>';
            }
            const btnText = document.getElementById('admin-program-btn-save-text');
            if (btnText) btnText.innerText = 'Simpan Program';
            const btnCancel = document.getElementById('admin-program-btn-cancel-edit');
            if (btnCancel) btnCancel.classList.add('hidden');
        }

        /**
         * Render tabel program di dalam modal kelola
         */
        function renderAdminProgramManagerTable() {
            const tbody = document.getElementById('admin-program-table-body');
            const badgeCount = document.getElementById('admin-program-badge-count');
            if (!tbody) return;

            const programs = getAdminPesantrenPrograms();
            if (badgeCount) badgeCount.innerText = `${programs.length} Program`;

            // Hitung distribusi santri per program dari adminStudentsData
            const studentCounts = {};
            if (Array.isArray(adminStudentsData)) {
                adminStudentsData.forEach(s => {
                    const p = (s.program || '').trim().toLowerCase();
                    if (p) studentCounts[p] = (studentCounts[p] || 0) + 1;
                });
            }

            if (programs.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                            <i class="fa-solid fa-folder-open text-2xl mb-1.5 block"></i>
                            Belum ada referensi program. Tambahkan program baru di atas.
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            programs.forEach((prog, idx) => {
                const count = studentCounts[(prog.name || '').trim().toLowerCase()] || 0;
                const isActive = (prog.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                const statusBadge = isActive 
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">Aktif</span>'
                    : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Nonaktif</span>';

                const studentBadge = count > 0
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40">${count} Santri</span>`
                    : '<span class="text-[11px] text-slate-400 dark:text-slate-500">0 Santri</span>';

                html += `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1f2d3d] transition">
                        <td class="py-2.5 px-3 text-center text-slate-400 font-semibold">${idx + 1}</td>
                        <td class="py-2.5 px-3">
                            <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span>${escapeHtml(prog.name)}</span>
                                ${statusBadge}
                            </div>
                        </td>
                        <td class="py-2.5 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-[11px]">
                            ${escapeHtml(prog.description || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            ${studentBadge}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <div class="flex items-center justify-center space-x-1.5">
                                <button type="button" onclick="editProgramReference('${escapeHtml(prog.id)}')" class="w-7 h-7 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center transition active:scale-95" title="Edit Program">
                                    <i class="fa-solid fa-pen text-xs"></i>
                                </button>
                                <button type="button" onclick="deleteProgramReference('${escapeHtml(prog.id)}')" class="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center transition active:scale-95" title="Hapus Program">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        }

        /**
         * Simpan (Tambah baru / Update) referensi program
         */
        function handleSaveProgramReference(event) {
            if (event) event.preventDefault();

            const idInput = document.getElementById('admin-program-input-id');
            const nameInput = document.getElementById('admin-program-input-name');
            const statusSelect = document.getElementById('admin-program-input-status');
            const descInput = document.getElementById('admin-program-input-desc');

            const progId = (idInput?.value || '').trim();
            const progName = (nameInput?.value || '').trim();
            const progStatus = statusSelect?.value || 'ACTIVE';
            const progDesc = (descInput?.value || '').trim();

            if (!progName) {
                if (typeof showToast === 'function') showToast("⚠️ Nama program wajib diisi!");
                return;
            }

            const list = getAdminPesantrenPrograms();

            if (progId) {
                // EDIT MODE
                const idx = list.findIndex(p => p.id === progId);
                if (idx !== -1) {
                    // Cek duplikasi nama dengan item lain
                    const duplicate = list.some((p, i) => i !== idx && (p.name || '').trim().toLowerCase() === progName.toLowerCase());
                    if (duplicate) {
                        if (typeof showToast === 'function') showToast("⚠️ Nama program sudah digunakan oleh referensi lain.");
                        return;
                    }

                    const oldName = list[idx].name;
                    list[idx].name = progName;
                    list[idx].status = progStatus;
                    list[idx].description = progDesc;

                    // Jika nama berubah, update juga referensi santri di memori jika ada
                    if (oldName !== progName && Array.isArray(adminStudentsData)) {
                        adminStudentsData.forEach(s => {
                            if ((s.program || '').trim().toLowerCase() === oldName.toLowerCase()) {
                                s.program = progName;
                            }
                        });
                    }

                    saveAdminPesantrenPrograms(list);
                    if (typeof showToast === 'function') showToast(`✅ Program "${progName}" berhasil diperbarui.`);
                }
            } else {
                // TAMBAH MODE
                const duplicate = list.some(p => (p.name || '').trim().toLowerCase() === progName.toLowerCase());
                if (duplicate) {
                    if (typeof showToast === 'function') showToast("⚠️ Nama program sudah terdaftar!");
                    return;
                }

                const newProg = {
                    id: 'prog-' + Math.random().toString(36).substring(2, 9),
                    name: progName,
                    status: progStatus,
                    description: progDesc
                };
                list.push(newProg);
                saveAdminPesantrenPrograms(list);
                if (typeof showToast === 'function') showToast(`✅ Program baru "${progName}" berhasil ditambahkan.`);
            }

            resetProgramReferenceForm();
            renderAdminProgramManagerTable();

            // Update dropdown di form santri dan filter santri
            const currentSelected = document.getElementById('admin-student-form-program')?.value || '';
            populateAdminStudentProgramDropdown(currentSelected || progName);
            populateAdminStudentProgramFilter();
        }

        /**
         * Edit referensi program (isi ke form modal)
         */
        function editProgramReference(id) {
            const list = getAdminPesantrenPrograms();
            const prog = list.find(p => p.id === id);
            if (!prog) return;

            document.getElementById('admin-program-input-id').value = prog.id;
            document.getElementById('admin-program-input-name').value = prog.name || '';
            document.getElementById('admin-program-input-status').value = prog.status || 'ACTIVE';
            document.getElementById('admin-program-input-desc').value = prog.description || '';

            const titleEl = document.getElementById('admin-program-form-title');
            if (titleEl) {
                titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i><span>Edit Program: ${escapeHtml(prog.name)}</span>`;
            }
            const btnText = document.getElementById('admin-program-btn-save-text');
            if (btnText) btnText.innerText = 'Perbarui Program';
            const btnCancel = document.getElementById('admin-program-btn-cancel-edit');
            if (btnCancel) btnCancel.classList.remove('hidden');

            document.getElementById('admin-program-input-name')?.focus();
        }

        /**
         * Hapus referensi program (dengan konfirmasi aman)
         */
        function deleteProgramReference(id) {
            const list = getAdminPesantrenPrograms();
            const prog = list.find(p => p.id === id);
            if (!prog) return;

            // Hitung santri yang sedang menggunakan program ini
            let count = 0;
            if (Array.isArray(adminStudentsData)) {
                count = adminStudentsData.filter(s => (s.program || '').trim().toLowerCase() === (prog.name || '').trim().toLowerCase()).length;
            }

            let confirmMsg = `Hapus referensi program "${prog.name}"?`;
            if (count > 0) {
                confirmMsg = `⚠️ PERINGATAN: Program "${prog.name}" saat ini digunakan oleh ${count} data santri!\n\nJika dihapus dari daftar referensi, data santri tidak akan terhapus namun program ini tidak lagi muncul sebagai opsi pilihan baku.\n\nApakah Anda tetap ingin menghapus program ini dari referensi?`;
            }

            if (!confirm(confirmMsg)) return;

            const updatedList = list.filter(p => p.id !== id);
            saveAdminPesantrenPrograms(updatedList);

            if (typeof showToast === 'function') showToast(`🗑️ Referensi program "${prog.name}" dihapus.`);

            resetProgramReferenceForm();
            renderAdminProgramManagerTable();

            // Refresh dropdown dan filter
            const currentSelected = document.getElementById('admin-student-form-program')?.value || '';
            populateAdminStudentProgramDropdown(currentSelected);
            populateAdminStudentProgramFilter();
        }

        window.openAdminProgramManagerModal = openAdminProgramManagerModal;
        window.closeAdminProgramManagerModal = closeAdminProgramManagerModal;
        window.resetProgramReferenceForm = resetProgramReferenceForm;
        window.renderAdminProgramManagerTable = renderAdminProgramManagerTable;
        window.handleSaveProgramReference = handleSaveProgramReference;
        window.editProgramReference = editProgramReference;
        window.deleteProgramReference = deleteProgramReference;
        window.populateAdminStudentProgramDropdown = populateAdminStudentProgramDropdown;
        window.populateAdminStudentProgramFilter = populateAdminStudentProgramFilter;
        window.getAdminPesantrenPrograms = getAdminPesantrenPrograms;

        // =====================================================================
        // REFERENSI MASTER KELAS & SEKOLAH FORMAL (UNTUK DATA SANTRI)
        // =====================================================================
        // REFERENSI MASTER KELAS & SEKOLAH FORMAL (UNTUK DATA SANTRI)
        // =====================================================================
        const DEFAULT_KELAS_SEKOLAH = [
            { id: 'ks-sdiu-1', name: 'Kelas 1 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 1' },
            { id: 'ks-sdiu-2', name: 'Kelas 2 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 2' },
            { id: 'ks-sdiu-3', name: 'Kelas 3 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 3' },
            { id: 'ks-sdiu-4', name: 'Kelas 4 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 4' },
            { id: 'ks-sdiu-5', name: 'Kelas 5 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 5' },
            { id: 'ks-sdiu-6', name: 'Kelas 6 SDIU Asnawiyyah', jenjang: 'SDIU', status: 'ACTIVE', description: 'Pendidikan dasar kelas 6' },
            { id: 'ks-mts-smp-7', name: 'Kelas 7 MTs / SMP', jenjang: 'MTs/SMP', status: 'ACTIVE', description: 'Menengah pertama kelas 7' },
            { id: 'ks-mts-smp-8', name: 'Kelas 8 MTs / SMP', jenjang: 'MTs/SMP', status: 'ACTIVE', description: 'Menengah pertama kelas 8' },
            { id: 'ks-mts-smp-9', name: 'Kelas 9 MTs / SMP', jenjang: 'MTs/SMP', status: 'ACTIVE', description: 'Menengah pertama kelas 9' },
            { id: 'ks-ma-sma-10', name: 'Kelas 10 MA / SMA / SMK', jenjang: 'MA/SMA/SMK', status: 'ACTIVE', description: 'Menengah atas kelas 10' },
            { id: 'ks-ma-sma-11', name: 'Kelas 11 MA / SMA / SMK', jenjang: 'MA/SMA/SMK', status: 'ACTIVE', description: 'Menengah atas kelas 11' },
            { id: 'ks-ma-sma-12', name: 'Kelas 12 MA / SMA / SMK', jenjang: 'MA/SMA/SMK', status: 'ACTIVE', description: 'Menengah atas kelas 12' },
            { id: 'ks-non-formal', name: 'Non-Formal / Belum Sekolah', jenjang: 'Non-Formal', status: 'ACTIVE', description: 'Santri usia dini / prasekolah / non-formal' },
            { id: 'ks-kuliah', name: 'Perguruan Tinggi / Mahasiswa', jenjang: 'Perguruan Tinggi', status: 'ACTIVE', description: 'Santri yang sedang menempuh kuliah' }
        ];

        async function fetchAdminKelasSekolahFromCloud() {
            try {
                const config = window.ASNAWIYYAH_CONFIG || {};
                const sbUrl = config.supabaseUrl;
                const sbKey = config.supabaseKey;
                if (!sbUrl || !sbKey) return null;

                const res = await fetch(`${sbUrl}/rest/v1/pengaturan?key=eq.master_kelas_sekolah&select=value`, {
                    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0 && data[0].value) {
                        const cloudList = JSON.parse(data[0].value);
                        if (Array.isArray(cloudList) && cloudList.length > 0) {
                            localStorage.setItem('ASNAWIYYAH_KELAS_SEKOLAH_V1', JSON.stringify(cloudList));
                            const modal = document.getElementById('modal-admin-class-school-manager');
                            if (modal && !modal.classList.contains('hidden')) {
                                renderAdminClassSchoolManagerTable();
                            }
                            populateAdminStudentKelasSekolahFilter();
                            return cloudList;
                        }
                    }
                }
            } catch (e) {
                console.warn("[KELAS_SEKOLAH] Gagal sinkronisasi dari cloud:", e);
            }
            return null;
        }

        // Panggil sinkronisasi awal dari cloud Supabase di background
        setTimeout(fetchAdminKelasSekolahFromCloud, 300);

        function getAdminKelasSekolah() {
            try {
                const stored = localStorage.getItem('ASNAWIYYAH_KELAS_SEKOLAH_V1');
                let list = [];
                if (stored) {
                    list = JSON.parse(stored);
                }
                if (!Array.isArray(list) || list.length === 0) {
                    list = JSON.parse(JSON.stringify(DEFAULT_KELAS_SEKOLAH));
                }

                // Jika di cache lokal masih menggunakan nama lama 'MI / SD', migrasikan otomatis ke 'SDIU Asnawiyyah'
                let migrated = false;
                list.forEach(k => {
                    if (k.name && /MI\s*\/\s*SD/i.test(k.name)) {
                        k.name = k.name.replace(/MI\s*\/\s*SD/gi, 'SDIU Asnawiyyah');
                        if (k.jenjang === 'MI/SD') k.jenjang = 'SDIU';
                        migrated = true;
                    }
                });
                if (migrated) {
                    saveAdminKelasSekolah(list);
                }

                // Auto-merge data kelas_sekolah dari adminStudentsData
                if (Array.isArray(adminStudentsData) && adminStudentsData.length > 0) {
                    const existingNames = new Set(list.map(k => (k.name || '').trim().toLowerCase()));
                    adminStudentsData.forEach(s => {
                        let ksName = (s.kelas_sekolah || s.kelasSekolah || s.kelas || '').trim();
                        if (ksName && /MI\s*\/\s*SD/i.test(ksName)) {
                            ksName = ksName.replace(/MI\s*\/\s*SD/gi, 'SDIU Asnawiyyah');
                        }
                        if (ksName && ksName !== '-' && !existingNames.has(ksName.toLowerCase())) {
                            list.push({
                                id: 'ks-' + Math.random().toString(36).substring(2, 9),
                                name: ksName,
                                jenjang: 'Lainnya',
                                status: 'ACTIVE',
                                description: 'Terdata dari Master Santri'
                            });
                            existingNames.add(ksName.toLowerCase());
                        }
                    });
                }

                return list;
            } catch (e) {
                console.warn("Gagal parse master kelas sekolah:", e);
                return JSON.parse(JSON.stringify(DEFAULT_KELAS_SEKOLAH));
            }
        }

        function saveAdminKelasSekolah(list) {
            try {
                localStorage.setItem('ASNAWIYYAH_KELAS_SEKOLAH_V1', JSON.stringify(list));
            } catch (e) {
                console.warn("Gagal simpan master kelas sekolah ke localStorage:", e);
            }

            // Dual-Write Cloud Sync: Simpan ke tabel pengaturan Supabase agar tersinkron otomatis antar PC & Mobile
            try {
                const config = window.ASNAWIYYAH_CONFIG || {};
                const sbUrl = config.supabaseUrl;
                const sbKey = config.supabaseKey;
                if (sbUrl && sbKey) {
                    fetch(`${sbUrl}/rest/v1/pengaturan`, {
                        method: 'POST',
                        headers: {
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({
                            key: 'master_kelas_sekolah',
                            value: JSON.stringify(list),
                            keterangan: 'Master Referensi Kelas & Sekolah Formal',
                            update_terakhir: new Date().toISOString()
                        })
                    }).catch(() => {});
                }
            } catch (err) {}
        }

        function populateAdminStudentKelasSekolahDropdown(selectedVal = '') {
            const selectEl = document.getElementById('admin-student-form-kelas-sekolah');
            if (!selectEl) return;

            const list = getAdminKelasSekolah();
            let optionsHtml = '<option value="">-- Pilih Kelas & Sekolah --</option>';
            let valFound = false;
            const targetVal = (selectedVal || '').trim().toLowerCase();

            list.forEach(item => {
                const name = (item.name || '').trim();
                if (!name) return;
                const isSelected = Boolean(targetVal && targetVal === name.toLowerCase());
                if (isSelected) valFound = true;

                const isInactive = (item.status || 'ACTIVE').toUpperCase() !== 'ACTIVE';
                const label = isInactive ? `${name} (Nonaktif)` : name;

                if (!isInactive || isSelected) {
                    optionsHtml += `<option value="${escapeHtml(name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
                }
            });

            if (selectedVal && selectedVal.trim() && !valFound) {
                optionsHtml += `<option value="${escapeHtml(selectedVal.trim())}" selected>${escapeHtml(selectedVal.trim())}</option>`;
            }

            selectEl.innerHTML = optionsHtml;
            if (selectedVal) {
                selectEl.value = selectedVal.trim();
            }
        }

        function populateAdminStudentKelasSekolahFilter() {
            const selectEl = document.getElementById('admin-student-filter-kelas-sekolah');
            if (!selectEl) return;

            const currentVal = selectEl.value;
            const setNames = new Set();

            const masterList = getAdminKelasSekolah();
            masterList.forEach(k => {
                if ((k.status || 'ACTIVE').toUpperCase() === 'ACTIVE' && (k.name || '').trim()) {
                    setNames.add(k.name.trim());
                }
            });

            if (Array.isArray(adminStudentsData)) {
                adminStudentsData.forEach(s => {
                    const ks = (s.kelas_sekolah || s.kelasSekolah || s.kelas || '').trim();
                    if (ks && ks !== '-') setNames.add(ks);
                });
            }

            let html = '<option value="ALL">Semua Kelas & Sekolah</option>';
            setNames.forEach(name => {
                const isSelected = currentVal === name ? 'selected' : '';
                html += `<option value="${escapeHtml(name)}" ${isSelected}>${escapeHtml(name)}</option>`;
            });

            selectEl.innerHTML = html;
            if (currentVal && setNames.has(currentVal)) {
                selectEl.value = currentVal;
            } else {
                selectEl.value = 'ALL';
            }
        }

        async function openAdminClassSchoolManagerModal() {
            const modal = document.getElementById('modal-admin-class-school-manager');
            if (!modal) return;
            resetClassSchoolReferenceForm();
            renderAdminClassSchoolManagerTable();
            modal.classList.remove('hidden');
            
            // Tarik pembaruan referensi kelas dari cloud Supabase segera dan render ulang jika ada pembaruan
            try {
                const cloudData = await fetchAdminKelasSekolahFromCloud();
                if (cloudData && !modal.classList.contains('hidden')) {
                    renderAdminClassSchoolManagerTable();
                }
            } catch (err) {
                console.warn("[KELAS_SEKOLAH] fetch on open failed:", err);
            }
        }

        async function syncClassSchoolFromCloudManual(btn) {
            const icon = btn ? btn.querySelector('i') : null;
            if (icon) icon.classList.add('fa-spin');
            if (btn) btn.disabled = true;

            try {
                const cloudList = await fetchAdminKelasSekolahFromCloud();
                renderAdminClassSchoolManagerTable();
                populateAdminStudentKelasSekolahFilter();
                const currentSelected = document.getElementById('admin-student-form-kelas-sekolah')?.value || '';
                populateAdminStudentKelasSekolahDropdown(currentSelected);

                const totalCount = Array.isArray(cloudList) ? cloudList.length : getAdminKelasSekolah().length;
                const msg = `Berhasil menyinkronkan ${totalCount} data Kelas & Sekolah dari Cloud Supabase!`;
                if (typeof showCustomToast === 'function') {
                    showCustomToast(msg, 'success');
                } else if (typeof showToast === 'function') {
                    showToast(msg, 'success');
                } else {
                    alert(msg);
                }
            } catch (err) {
                console.error("Gagal sinkron manual:", err);
                const errMsg = 'Gagal menyinkronkan data dari Cloud: ' + (err.message || err);
                if (typeof showCustomToast === 'function') {
                    showCustomToast(errMsg, 'error');
                } else if (typeof showToast === 'function') {
                    showToast(errMsg, 'error');
                } else {
                    alert(errMsg);
                }
            } finally {
                if (icon) icon.classList.remove('fa-spin');
                if (btn) btn.disabled = false;
            }
        }

        function closeAdminClassSchoolManagerModal() {
            const modal = document.getElementById('modal-admin-class-school-manager');
            if (modal) modal.classList.add('hidden');
            resetClassSchoolReferenceForm();
            const currentSelected = document.getElementById('admin-student-form-kelas-sekolah')?.value || '';
            populateAdminStudentKelasSekolahDropdown(currentSelected);
            populateAdminStudentKelasSekolahFilter();
        }

        function resetClassSchoolReferenceForm() {
            const form = document.getElementById('adminClassSchoolReferenceForm');
            if (form) form.reset();
            const idInput = document.getElementById('admin-class-school-input-id');
            if (idInput) idInput.value = '';
            const statusSelect = document.getElementById('admin-class-school-input-status');
            if (statusSelect) statusSelect.value = 'ACTIVE';

            const titleEl = document.getElementById('admin-class-school-form-title');
            if (titleEl) {
                titleEl.innerHTML = '<i class="fa-solid fa-circle-plus text-indigo-500"></i><span>Tambah Referensi Kelas & Sekolah Baru</span>';
            }
            const btnText = document.getElementById('admin-class-school-btn-save-text');
            if (btnText) btnText.innerText = 'Simpan Kelas & Sekolah';
            const btnCancel = document.getElementById('admin-class-school-btn-cancel-edit');
            if (btnCancel) btnCancel.classList.add('hidden');
        }

        function renderAdminClassSchoolManagerTable() {
            const tbody = document.getElementById('admin-class-school-table-body');
            const badgeCount = document.getElementById('admin-class-school-badge-count');
            if (!tbody) return;

            const list = getAdminKelasSekolah();
            if (badgeCount) badgeCount.innerText = `${list.length} Kelas/Sekolah`;

            const studentCounts = {};
            if (Array.isArray(adminStudentsData)) {
                adminStudentsData.forEach(s => {
                    const ks = (s.kelas_sekolah || s.kelasSekolah || s.kelas || '').trim().toLowerCase();
                    if (ks) studentCounts[ks] = (studentCounts[ks] || 0) + 1;
                });
            }

            if (list.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                            <i class="fa-solid fa-school-flag text-2xl mb-1.5 block"></i>
                            Belum ada referensi kelas & sekolah. Tambahkan di atas.
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            list.forEach((item, idx) => {
                const count = studentCounts[(item.name || '').trim().toLowerCase()] || 0;
                const isActive = (item.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                const statusBadge = isActive 
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">Aktif</span>'
                    : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Nonaktif</span>';

                const studentBadge = count > 0
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">${count} Santri</span>`
                    : '<span class="text-[11px] text-slate-400 dark:text-slate-500">0 Santri</span>';

                html += `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1f2d3d] transition">
                        <td class="py-2.5 px-3 text-center text-slate-400 font-semibold">${idx + 1}</td>
                        <td class="py-2.5 px-3">
                            <div class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span>${escapeHtml(item.name)}</span>
                                ${statusBadge}
                            </div>
                            <div class="text-[10px] text-slate-400 mt-0.5 sm:hidden">${escapeHtml(item.description || '-')}</div>
                        </td>
                        <td class="py-2.5 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-[11px]">
                            ${escapeHtml(item.description || '-')}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            ${studentBadge}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <div class="flex items-center justify-center gap-1.5">
                                <button type="button" onclick="editClassSchoolReference('${escapeHtml(item.id)}')" class="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-lg flex items-center justify-center transition active:scale-95" title="Edit Kelas & Sekolah">
                                    <i class="fa-solid fa-pen text-xs"></i>
                                </button>
                                <button type="button" onclick="deleteClassSchoolReference('${escapeHtml(item.id)}')" class="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg flex items-center justify-center transition active:scale-95" title="Hapus Kelas & Sekolah">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        }

        function handleSaveClassSchoolReference(event) {
            if (event) event.preventDefault();

            const idInput = document.getElementById('admin-class-school-input-id');
            const nameInput = document.getElementById('admin-class-school-input-name');
            const statusSelect = document.getElementById('admin-class-school-input-status');
            const descInput = document.getElementById('admin-class-school-input-desc');

            const itemId = (idInput?.value || '').trim();
            const itemName = (nameInput?.value || '').trim();
            const itemStatus = statusSelect?.value || 'ACTIVE';
            const itemDesc = (descInput?.value || '').trim();

            if (!itemName) {
                if (typeof showToast === 'function') showToast("⚠️ Nama kelas & sekolah wajib diisi!");
                return;
            }

            const list = getAdminKelasSekolah();

            if (itemId) {
                const idx = list.findIndex(k => k.id === itemId);
                if (idx !== -1) {
                    const duplicate = list.some((k, i) => i !== idx && (k.name || '').trim().toLowerCase() === itemName.toLowerCase());
                    if (duplicate) {
                        if (typeof showToast === 'function') showToast("⚠️ Nama kelas & sekolah sudah digunakan.");
                        return;
                    }

                    const oldName = list[idx].name;
                    list[idx].name = itemName;
                    list[idx].status = itemStatus;
                    list[idx].description = itemDesc;

                    if (oldName !== itemName && Array.isArray(adminStudentsData)) {
                        adminStudentsData.forEach(s => {
                            if ((s.kelas_sekolah || s.kelasSekolah || '').trim().toLowerCase() === oldName.toLowerCase()) {
                                s.kelas_sekolah = itemName;
                                s.kelasSekolah = itemName;
                            }
                        });
                    }

                    saveAdminKelasSekolah(list);
                    if (typeof showToast === 'function') showToast(`✅ Kelas & Sekolah "${itemName}" berhasil diperbarui.`);
                }
            } else {
                const duplicate = list.some(k => (k.name || '').trim().toLowerCase() === itemName.toLowerCase());
                if (duplicate) {
                    if (typeof showToast === 'function') showToast("⚠️ Nama kelas & sekolah sudah terdaftar!");
                    return;
                }

                const newItem = {
                    id: 'ks-' + Math.random().toString(36).substring(2, 9),
                    name: itemName,
                    status: itemStatus,
                    description: itemDesc
                };
                list.push(newItem);
                saveAdminKelasSekolah(list);
                if (typeof showToast === 'function') showToast(`✅ Kelas & Sekolah baru "${itemName}" berhasil ditambahkan.`);
            }

            resetClassSchoolReferenceForm();
            renderAdminClassSchoolManagerTable();

            const currentSelected = document.getElementById('admin-student-form-kelas-sekolah')?.value || '';
            populateAdminStudentKelasSekolahDropdown(currentSelected || itemName);
            populateAdminStudentKelasSekolahFilter();
        }

        function editClassSchoolReference(id) {
            const list = getAdminKelasSekolah();
            const item = list.find(k => k.id === id);
            if (!item) return;

            document.getElementById('admin-class-school-input-id').value = item.id;
            document.getElementById('admin-class-school-input-name').value = item.name || '';
            document.getElementById('admin-class-school-input-status').value = item.status || 'ACTIVE';
            document.getElementById('admin-class-school-input-desc').value = item.description || '';

            const titleEl = document.getElementById('admin-class-school-form-title');
            if (titleEl) {
                titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square text-amber-500"></i><span>Edit Kelas & Sekolah: ${escapeHtml(item.name)}</span>`;
            }
            const btnText = document.getElementById('admin-class-school-btn-save-text');
            if (btnText) btnText.innerText = 'Perbarui Kelas & Sekolah';
            const btnCancel = document.getElementById('admin-class-school-btn-cancel-edit');
            if (btnCancel) btnCancel.classList.remove('hidden');

            document.getElementById('admin-class-school-input-name')?.focus();
        }

        function deleteClassSchoolReference(id) {
            const list = getAdminKelasSekolah();
            const item = list.find(k => k.id === id);
            if (!item) return;

            let count = 0;
            if (Array.isArray(adminStudentsData)) {
                count = adminStudentsData.filter(s => (s.kelas_sekolah || s.kelasSekolah || '').trim().toLowerCase() === (item.name || '').trim().toLowerCase()).length;
            }

            let confirmMsg = `Hapus referensi "${item.name}"?`;
            if (count > 0) {
                confirmMsg = `⚠️ PERINGATAN: Referensi "${item.name}" saat ini digunakan oleh ${count} data santri!\n\nJika dihapus dari daftar referensi, data santri tidak akan terhapus namun pilihan ini tidak lagi muncul sebagai opsi baku.\n\nApakah Anda tetap ingin menghapus?`;
            }

            if (!confirm(confirmMsg)) return;

            const updatedList = list.filter(k => k.id !== id);
            saveAdminKelasSekolah(updatedList);

            if (typeof showToast === 'function') showToast(`🗑️ Referensi "${item.name}" dihapus.`);

            resetClassSchoolReferenceForm();
            renderAdminClassSchoolManagerTable();

            const currentSelected = document.getElementById('admin-student-form-kelas-sekolah')?.value || '';
            populateAdminStudentKelasSekolahDropdown(currentSelected);
            populateAdminStudentKelasSekolahFilter();
        }

        window.openAdminClassSchoolManagerModal = openAdminClassSchoolManagerModal;
        window.closeAdminClassSchoolManagerModal = closeAdminClassSchoolManagerModal;
        window.resetClassSchoolReferenceForm = resetClassSchoolReferenceForm;
        window.renderAdminClassSchoolManagerTable = renderAdminClassSchoolManagerTable;
        window.handleSaveClassSchoolReference = handleSaveClassSchoolReference;
        window.editClassSchoolReference = editClassSchoolReference;
        window.deleteClassSchoolReference = deleteClassSchoolReference;
        window.populateAdminStudentKelasSekolahDropdown = populateAdminStudentKelasSekolahDropdown;
        window.populateAdminStudentKelasSekolahFilter = populateAdminStudentKelasSekolahFilter;
        window.getAdminKelasSekolah = getAdminKelasSekolah;
        window.fetchAdminKelasSekolahFromCloud = fetchAdminKelasSekolahFromCloud;
        window.syncClassSchoolFromCloudManual = syncClassSchoolFromCloudManual;

        /**
         * Filter data santri secara real-time
         */
        function filterAdminStudentsList() {
            const searchInput = (document.getElementById('admin-student-search')?.value || '').trim().toLowerCase();
            const genderFilter = document.getElementById('admin-student-filter-gender')?.value || 'ALL';
            const programFilter = document.getElementById('admin-student-filter-program')?.value || 'ALL';
            const kelasFilter = document.getElementById('admin-student-filter-kelas-sekolah')?.value || 'ALL';
            const statusFilter = document.getElementById('admin-student-filter-status')?.value || 'ALL';

            filteredAdminStudentsData = adminStudentsData.filter(student => {
                // Search term (Nama, NIS, NIK)
                if (searchInput) {
                    const name = (student.name || '').toLowerCase();
                    const nis = (student.nis || student.nisn || '').toLowerCase();
                    const nik = (student.nik || '').toLowerCase();
                    if (!name.includes(searchInput) && !nis.includes(searchInput) && !nik.includes(searchInput)) {
                        return false;
                    }
                }

                // Gender
                if (genderFilter !== 'ALL') {
                    const g = (student.gender || 'L').toUpperCase();
                    if (g !== genderFilter) return false;
                }

                // Program
                if (programFilter !== 'ALL') {
                    const prog = (student.program || '').trim();
                    if (prog !== programFilter) return false;
                }

                // Kelas & Sekolah
                if (kelasFilter !== 'ALL') {
                    const ks = (student.kelas_sekolah || student.kelasSekolah || student.kelas || '').trim();
                    if (ks !== kelasFilter) return false;
                }

                // Status
                if (statusFilter !== 'ALL') {
                    const st = (student.status || 'ACTIVE').toUpperCase();
                    if (st !== statusFilter) return false;
                }

                return true;
            });

            renderAdminStudentsList();
        }

        /**
         * Render data santri ke Desktop Table dan Mobile Cards
         */
        function renderAdminStudentsList() {
            const tbody = document.getElementById('admin-student-table-tbody');
            const mobileList = document.getElementById('admin-student-mobile-list');
            const emptyState = document.getElementById('admin-student-empty-state');
            const countBadge = document.getElementById('admin-student-list-count');

            if (countBadge) {
                countBadge.innerText = `${filteredAdminStudentsData.length} Santri`;
            }

            if (!filteredAdminStudentsData || filteredAdminStudentsData.length === 0) {
                if (tbody) tbody.innerHTML = '';
                if (mobileList) mobileList.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            const canEdit = typeof window.hasPermission === 'function' ? window.hasPermission('santri.edit') : true;
            const canDelete = typeof window.hasPermission === 'function' ? window.hasPermission('santri.delete') : true;

            // Render Desktop Table
            if (tbody) {
                tbody.innerHTML = filteredAdminStudentsData.map((s, index) => {
                    const id = s.studentId || s.student_id || '';
                    const nis = escapeHtml(s.nis || s.nisn || '-');
                    const nik = escapeHtml(s.nik || '-');
                    const name = escapeHtml(s.name || 'Tanpa Nama');
                    const gender = (s.gender || 'L').toUpperCase() === 'P' ? 'P' : 'L';
                    const genderBadge = gender === 'P' 
                        ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300">P</span>`
                        : `<span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">L</span>`;
                    const birth = escapeHtml(s.birthDate || s.birth_date || '-');
                    const prog = escapeHtml(s.program || 'Reguler');
                    const kelas = escapeHtml(s.kelas_sekolah || s.kelasSekolah || s.kelas || '-');
                    const isActive = (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                    const statusBadge = isActive
                        ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">Aktif</span>`
                        : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Nonaktif</span>`;

                    const photoUrl = s.photoUrl || s.photo_url;
                    const avatarHtml = photoUrl
                        ? `<img src="${escapeHtml(photoUrl)}" alt="${name}" class="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-[#253447] shadow-sm" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'36\\' height=\\'36\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2394a3b8\\' stroke-width=\\'2\\'><path d=\\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\\'/><circle cx=\\'12\\' cy=\\'7\\' r=\\'4\\'/></svg>';">`
                        : `<div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1c2836] border border-slate-200 dark:border-[#253447] flex items-center justify-center text-slate-400 text-sm"><i class="fa-solid fa-user"></i></div>`;

                    const studentJson = escapeHtml(JSON.stringify(s));
                    const isChecked = selectedAdminStudentIds.has(id);

                    return `
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1c2836]/60 transition ${isChecked ? 'bg-cyan-50/40 dark:bg-cyan-950/20' : ''}">
                            <td class="py-3 px-3 text-center">
                                <input type="checkbox" class="admin-student-row-checkbox w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600 dark:bg-[#1c2836] cursor-pointer" value="${escapeHtml(id)}" ${isChecked ? 'checked' : ''} onchange="handleStudentRowSelectionChange('${escapeHtml(id)}', this.checked)">
                            </td>
                            <td class="py-3 px-3 font-semibold text-slate-400">${index + 1}</td>
                            <td class="py-3 px-3">${avatarHtml}</td>
                            <td class="py-3 px-3">
                                <div class="font-bold text-slate-800 dark:text-slate-100">${name}</div>
                                <div class="text-[10px] text-slate-400">ID: ${escapeHtml(id)}</div>
                            </td>
                            <td class="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">${nis}</td>
                            <td class="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">${nik}</td>
                            <td class="py-3 px-3 text-center">${genderBadge}</td>
                            <td class="py-3 px-3 text-slate-600 dark:text-slate-300">${birth}</td>
                            <td class="py-3 px-3">
                                <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300">${prog}</span>
                            </td>
                            <td class="py-3 px-3">
                                ${kelas !== '-' 
                                    ? `<span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">${kelas}</span>`
                                    : `<span class="text-[11px] text-slate-400 dark:text-slate-500 italic">-</span>`
                                }
                            </td>
                            <td class="py-3 px-3 text-center">${statusBadge}</td>
                            <td class="py-3 px-3 text-center">
                                <div class="flex items-center justify-center gap-1.5">
                                    ${canEdit ? `
                                    <button type="button" onclick='openAdminStudentModal(${studentJson})' class="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-lg flex items-center justify-center transition active:scale-95" title="Edit Santri">
                                        <i class="fa-solid fa-pen text-xs"></i>
                                    </button>
                                    ` : ''}
                                    ${canDelete ? `
                                    <button type="button" onclick="openAdminStudentDeleteModal('${escapeHtml(id)}', '${escapeHtml(name)}')" class="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg flex items-center justify-center transition active:scale-95" title="Hapus Santri">
                                        <i class="fa-solid fa-trash text-xs"></i>
                                    </button>
                                    ` : ''}
                                    ${!canEdit && !canDelete ? `<span class="text-[10px] text-slate-400 italic">Lihat Saja</span>` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            // Render Mobile Cards
            if (mobileList) {
                mobileList.innerHTML = filteredAdminStudentsData.map(s => {
                    const id = s.studentId || s.student_id || '';
                    const nis = escapeHtml(s.nis || s.nisn || '-');
                    const nik = escapeHtml(s.nik || '-');
                    const name = escapeHtml(s.name || 'Tanpa Nama');
                    const gender = (s.gender || 'L').toUpperCase() === 'P' ? 'P' : 'L';
                    const genderBadge = gender === 'P'
                        ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300">Putri (P)</span>`
                        : `<span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">Putra (L)</span>`;
                    const birth = escapeHtml(s.birthDate || s.birth_date || '-');
                    const prog = escapeHtml(s.program || 'Reguler');
                    const kelas = escapeHtml(s.kelas_sekolah || s.kelasSekolah || s.kelas || '-');
                    const isActive = (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                    const statusBadge = isActive
                        ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">Aktif</span>`
                        : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Nonaktif</span>`;

                    const photoUrl = s.photoUrl || s.photo_url;
                    const avatarHtml = photoUrl
                        ? `<img src="${escapeHtml(photoUrl)}" alt="${name}" class="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-[#253447] shadow-sm shrink-0">`
                        : `<div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1c2836] border border-slate-200 dark:border-[#253447] flex items-center justify-center text-slate-400 text-lg shrink-0"><i class="fa-solid fa-user"></i></div>`;

                    const studentJson = escapeHtml(JSON.stringify(s));
                    const isChecked = selectedAdminStudentIds.has(id);

                    return `
                        <div class="bg-white dark:bg-[#15202d] p-4 rounded-2xl border border-slate-100 dark:border-[#253447] shadow-sm space-y-3 transition ${isChecked ? 'ring-2 ring-cyan-500/40 bg-cyan-50/20 dark:bg-cyan-950/20' : ''}">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-center space-x-3">
                                    <input type="checkbox" class="admin-student-mobile-row-checkbox w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600 dark:bg-[#1c2836] cursor-pointer shrink-0" value="${escapeHtml(id)}" ${isChecked ? 'checked' : ''} onchange="handleStudentRowSelectionChange('${escapeHtml(id)}', this.checked)">
                                    ${avatarHtml}
                                    <div>
                                        <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${name}</h4>
                                        <div class="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                                            <span class="font-mono font-bold text-cyan-700 dark:text-cyan-400">NIS: ${nis}</span>
                                            <span>•</span>
                                            <span>NIK: ${nik}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>${statusBadge}</div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-[#253447]">
                                <div>
                                    <span class="text-[10px] text-slate-400 block">Gender & Program</span>
                                    <div class="flex items-center gap-1.5 mt-0.5">
                                        ${genderBadge}
                                        <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">${prog}</span>
                                    </div>
                                    <div class="mt-1 text-[11px] flex items-center gap-1 truncate">
                                        <span class="text-[10px] text-slate-400">Kelas:</span>
                                        <span class="font-semibold text-indigo-600 dark:text-indigo-400 truncate">${kelas}</span>
                                    </div>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-400 block">Tanggal Lahir</span>
                                    <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">${birth}</span>
                                </div>
                            </div>

                            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#253447]">
                                ${canEdit ? `
                                <button type="button" onclick='openAdminStudentModal(${studentJson})' class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95">
                                    <i class="fa-solid fa-pen text-xs"></i>
                                    <span>Edit</span>
                                </button>
                                ` : ''}
                                ${canDelete ? `
                                <button type="button" onclick="openAdminStudentDeleteModal('${escapeHtml(id)}', '${escapeHtml(name)}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                    <span>Hapus</span>
                                </button>
                                ` : ''}
                                ${!canEdit && !canDelete ? `<span class="text-[10px] text-slate-400 italic">Lihat Saja</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Update bulk action bar & header checkbox state
            updateAdminStudentBulkActionBar();
        }

        /**
         * Sinkronkan state checkbox header "Pilih Semua"
         */
        function syncSelectAllAdminStudentsCheckbox() {
            const selectAllCb = document.getElementById('admin-student-select-all');
            if (!selectAllCb) return;
            const visibleIds = (filteredAdminStudentsData || []).map(s => s.studentId || s.student_id || '').filter(Boolean);
            if (visibleIds.length === 0) {
                selectAllCb.checked = false;
                selectAllCb.indeterminate = false;
                return;
            }
            const allSelected = visibleIds.every(id => selectedAdminStudentIds.has(id));
            const someSelected = visibleIds.some(id => selectedAdminStudentIds.has(id));
            selectAllCb.checked = allSelected;
            selectAllCb.indeterminate = !allSelected && someSelected;
        }

        /**
         * Update Floating Bulk Action Bar tampilan
         */
        function updateAdminStudentBulkActionBar() {
            const bar = document.getElementById('admin-student-bulk-action-bar');
            const countEl = document.getElementById('admin-student-bulk-count');
            const count = selectedAdminStudentIds.size;
            if (countEl) countEl.innerText = count;

            if (bar) {
                if (count > 0) {
                    bar.classList.remove('hidden');
                } else {
                    bar.classList.add('hidden');
                }
            }
            syncSelectAllAdminStudentsCheckbox();
        }

        /**
         * Handler perubahan ceklis pada satu baris santri
         */
        function handleStudentRowSelectionChange(studentId, isChecked) {
            if (!studentId) return;
            if (isChecked) {
                selectedAdminStudentIds.add(studentId);
            } else {
                selectedAdminStudentIds.delete(studentId);
            }
            // Update checkbox di baris desktop & mobile bila ada
            document.querySelectorAll(`.admin-student-row-checkbox[value="${studentId}"], .admin-student-mobile-row-checkbox[value="${studentId}"]`).forEach(cb => {
                cb.checked = isChecked;
            });
            updateAdminStudentBulkActionBar();
        }

        /**
         * Handler pilih semua / hapus semua centang dari header
         */
        function toggleSelectAllAdminStudents(isChecked) {
            const visibleIds = (filteredAdminStudentsData || []).map(s => s.studentId || s.student_id || '').filter(Boolean);
            if (isChecked) {
                visibleIds.forEach(id => selectedAdminStudentIds.add(id));
            } else {
                visibleIds.forEach(id => selectedAdminStudentIds.delete(id));
            }
            // Update seluruh checkbox di DOM tabel & mobile
            document.querySelectorAll('.admin-student-row-checkbox, .admin-student-mobile-row-checkbox').forEach(cb => {
                cb.checked = isChecked;
            });
            updateAdminStudentBulkActionBar();
        }

        /**
         * Batal seluruh pilihan santri terpilih
         */
        function clearSelectedAdminStudents() {
            selectedAdminStudentIds.clear();
            document.querySelectorAll('.admin-student-row-checkbox, .admin-student-mobile-row-checkbox').forEach(cb => {
                cb.checked = false;
            });
            const selectAllCb = document.getElementById('admin-student-select-all');
            if (selectAllCb) {
                selectAllCb.checked = false;
                selectAllCb.indeterminate = false;
            }
            updateAdminStudentBulkActionBar();
        }

        /**
         * Buka Modal Edit Massal Program Santri
         */
        function openBulkEditProgramModal() {
            if (selectedAdminStudentIds.size === 0) {
                if (typeof showToast === 'function') showToast("⚠️ Pilih minimal satu santri untuk diubah programnya.");
                return;
            }
            if (typeof window.hasPermission === 'function' && !window.hasPermission('santri.edit')) {
                if (typeof showToast === 'function') showToast("⛔ Anda tidak memiliki izin untuk mengedit data santri.");
                return;
            }

            const modal = document.getElementById('modal-admin-student-bulk-program');
            const countBadge = document.getElementById('bulk-program-selected-count-badge');
            const namesContainer = document.getElementById('bulk-program-selected-names');
            const selectTarget = document.getElementById('bulk-student-target-program');

            if (!modal) return;

            // Render nama-nama santri terpilih
            const selectedList = (adminStudentsData || []).filter(s => selectedAdminStudentIds.has(s.studentId || s.student_id));
            if (countBadge) countBadge.innerText = `${selectedList.length} Santri`;

            if (namesContainer) {
                namesContainer.innerHTML = selectedList.map(s => {
                    const name = escapeHtml(s.name || 'Tanpa Nama');
                    const prog = escapeHtml(s.program || 'Reguler');
                    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-[#15202d] border border-slate-200 dark:border-[#253447] text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                        <span>${name}</span>
                        <span class="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono">(${prog})</span>
                    </span>`;
                }).join('');
            }

            // Populate pilihan program baru dari referensi
            if (selectTarget) {
                const programs = getAdminPesantrenPrograms();
                let optsHtml = '';
                programs.forEach(p => {
                    const name = (p.name || '').trim();
                    if (!name) return;
                    optsHtml += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
                });
                selectTarget.innerHTML = optsHtml;
            }

            modal.classList.remove('hidden');
        }

        /**
         * Tutup Modal Edit Massal Program Santri
         */
        function closeBulkEditProgramModal() {
            const modal = document.getElementById('modal-admin-student-bulk-program');
            if (modal) modal.classList.add('hidden');
        }

        /**
         * Submit Edit Massal Program Santri
         */
        async function submitBulkEditProgram(event) {
            if (event) event.preventDefault();

            const selectTarget = document.getElementById('bulk-student-target-program');
            const targetProgram = (selectTarget ? selectTarget.value : '').trim();
            if (!targetProgram) {
                if (typeof showToast === 'function') showToast("⚠️ Pilih program tujuan terlebih dahulu!");
                return;
            }

            const idList = Array.from(selectedAdminStudentIds);
            if (idList.length === 0) {
                if (typeof showToast === 'function') showToast("⚠️ Tidak ada santri yang dipilih.");
                return;
            }

            const btn = document.getElementById('bulk-program-submit-btn');
            const btnIcon = document.getElementById('bulk-program-submit-icon');
            const btnText = document.getElementById('bulk-program-submit-text');

            if (btn) btn.disabled = true;
            if (btnIcon) btnIcon.className = "fa-solid fa-spinner fa-spin";
            if (btnText) btnText.innerText = "Menerapkan...";

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";

                // 1. OPTIMISTIC UPDATE: Perbarui memori & UI seketika
                const idSet = new Set(idList);
                const affectedNisList = [];
                if (Array.isArray(adminStudentsData)) {
                    adminStudentsData.forEach(s => {
                        const sid = s.studentId || s.student_id;
                        if (idSet.has(sid)) {
                            s.program = targetProgram;
                            if (s.nis || s.nisn) affectedNisList.push(s.nis || s.nisn);
                        }
                    });
                    window.adminStudentsData = adminStudentsData;
                    window.adminStudentsList = adminStudentsData;
                    try {
                        localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify(adminStudentsData));
                    } catch(e) {}
                    if (typeof filterAdminStudentsList === 'function') {
                        filterAdminStudentsList();
                    }
                }

                if (typeof showToast === 'function') {
                    showToast(`⏳ Memperbarui program untuk ${idList.length} santri...`);
                }

                // 2. DUAL-WRITE KE SUPABASE (Ultra-cepat via PostgREST in.() filter)
                const sbUrl = window.ASNAWIYYAH_CONFIG?.supabaseUrl;
                const sbKey = window.ASNAWIYYAH_CONFIG?.supabaseKey;
                if (sbUrl && sbKey) {
                    try {
                        const inFilter = idList.map(id => `"${id}"`).join(',');
                        await fetch(`${sbUrl}/rest/v1/students?student_id=in.(${encodeURIComponent(inFilter)})`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': sbKey,
                                'Authorization': `Bearer ${sbKey}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({ program: targetProgram })
                        });
                        // Fallback NIS jika ada record dengan student_id berbeda
                        if (affectedNisList.length > 0) {
                            const inNis = affectedNisList.map(n => `"${n}"`).join(',');
                            await fetch(`${sbUrl}/rest/v1/students?nis=in.(${encodeURIComponent(inNis)})`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': sbKey,
                                    'Authorization': `Bearer ${sbKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ program: targetProgram })
                            });
                        }
                    } catch (sbErr) {
                        console.warn('[SUPABASE BATCH WRITE WARN]', sbErr);
                    }
                }

                // 3. REPLIKASI KE GOOGLE APPS SCRIPT SPREADSHEET
                if (typeof apiPost === 'function') {
                    try {
                        await apiPost("batchUpdateStudentProgram", {
                            token,
                            studentIds: idList,
                            program: targetProgram
                        });
                    } catch (gasErr) {
                        console.warn('[GAS BATCH WRITE WARN]', gasErr);
                    }
                }

                if (typeof showToast === 'function') {
                    showToast(`✅ Program untuk ${idList.length} santri berhasil diubah menjadi "${targetProgram}"!`);
                }

                closeBulkEditProgramModal();
                clearSelectedAdminStudents();
                await loadAdminStudentsData();
            } catch (err) {
                console.error("Gagal edit massal program santri:", err);
                if (typeof showToast === 'function') showToast("❌ Gagal edit massal: " + err.message);
            } finally {
                if (btn) btn.disabled = false;
                if (btnIcon) btnIcon.className = "fa-solid fa-check";
                if (btnText) btnText.innerText = "Terapkan Perubahan";
            }
        }

        /**
         * Buka Modal Edit Massal Kelas & Sekolah Santri
         */
        function openBulkEditClassSchoolModal() {
            if (selectedAdminStudentIds.size === 0) {
                if (typeof showToast === 'function') showToast("⚠️ Pilih minimal satu santri untuk diubah kelas & sekolahnya.");
                return;
            }
            if (typeof window.hasPermission === 'function' && !window.hasPermission('santri.edit')) {
                if (typeof showToast === 'function') showToast("⛔ Anda tidak memiliki izin untuk mengedit data santri.");
                return;
            }

            const modal = document.getElementById('modal-admin-student-bulk-class-school');
            const countBadge = document.getElementById('bulk-class-school-selected-count-badge');
            const namesContainer = document.getElementById('bulk-class-school-selected-names');
            const selectTarget = document.getElementById('bulk-student-target-class-school');

            if (!modal) return;

            // Render nama-nama santri terpilih
            const selectedList = (adminStudentsData || []).filter(s => selectedAdminStudentIds.has(s.studentId || s.student_id));
            if (countBadge) countBadge.innerText = `${selectedList.length} Santri`;

            if (namesContainer) {
                namesContainer.innerHTML = selectedList.map(s => {
                    const name = escapeHtml(s.name || 'Tanpa Nama');
                    const cls = escapeHtml(s.kelas_sekolah || s.kelas || '-');
                    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-[#15202d] border border-slate-200 dark:border-[#253447] text-[10px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                        <span>${name}</span>
                        <span class="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono">(${cls})</span>
                    </span>`;
                }).join('');
            }

            // Populate pilihan kelas & sekolah dari referensi
            if (selectTarget) {
                const list = getAdminKelasSekolah();
                let optsHtml = '<option value="">-- Pilih Kelas & Sekolah --</option>';
                optsHtml += '<option value="-">Tanpa Kelas Formal / Belum Ditentukan (-)</option>';
                list.forEach(item => {
                    const name = (item.name || '').trim();
                    if (!name) return;
                    const cat = item.category ? ` [${item.category}]` : '';
                    optsHtml += `<option value="${escapeHtml(name)}">${escapeHtml(name)}${escapeHtml(cat)}</option>`;
                });
                selectTarget.innerHTML = optsHtml;
            }

            modal.classList.remove('hidden');
        }

        /**
         * Tutup Modal Edit Massal Kelas & Sekolah Santri
         */
        function closeBulkEditClassSchoolModal() {
            const modal = document.getElementById('modal-admin-student-bulk-class-school');
            if (modal) modal.classList.add('hidden');
        }

        /**
         * Submit Edit Massal Kelas & Sekolah Santri
         */
        async function submitBulkEditClassSchool(event) {
            if (event) event.preventDefault();

            const selectTarget = document.getElementById('bulk-student-target-class-school');
            const targetClassSchool = (selectTarget ? selectTarget.value : '').trim();
            if (!targetClassSchool) {
                if (typeof showToast === 'function') showToast("⚠️ Pilih kelas & sekolah tujuan terlebih dahulu!");
                return;
            }

            const idList = Array.from(selectedAdminStudentIds);
            if (idList.length === 0) {
                if (typeof showToast === 'function') showToast("⚠️ Tidak ada santri yang dipilih.");
                return;
            }

            const btn = document.getElementById('bulk-class-school-submit-btn');
            const btnIcon = document.getElementById('bulk-class-school-submit-icon');
            const btnText = document.getElementById('bulk-class-school-submit-text');

            if (btn) btn.disabled = true;
            if (btnIcon) btnIcon.className = "fa-solid fa-spinner fa-spin";
            if (btnText) btnText.innerText = "Menerapkan...";

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";

                // 1. OPTIMISTIC UPDATE: Perbarui memori & UI seketika
                const idSet = new Set(idList);
                const affectedNisList = [];
                if (Array.isArray(adminStudentsData)) {
                    adminStudentsData.forEach(s => {
                        const sid = s.studentId || s.student_id;
                        if (idSet.has(sid)) {
                            s.kelas_sekolah = targetClassSchool;
                            s.kelas = targetClassSchool;
                            if (s.nis || s.nisn) affectedNisList.push(s.nis || s.nisn);
                        }
                    });
                    window.adminStudentsData = adminStudentsData;
                    window.adminStudentsList = adminStudentsData;
                    try {
                        localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify(adminStudentsData));
                    } catch(e) {}
                    if (typeof filterAdminStudentsList === 'function') {
                        filterAdminStudentsList();
                    }
                }

                if (typeof showToast === 'function') {
                    showToast(`⏳ Memperbarui kelas & sekolah untuk ${idList.length} santri...`);
                }

                // 2. DUAL-WRITE KE SUPABASE (Via PostgREST in.() filter)
                const sbUrl = window.ASNAWIYYAH_CONFIG?.supabaseUrl;
                const sbKey = window.ASNAWIYYAH_CONFIG?.supabaseKey;
                if (sbUrl && sbKey) {
                    try {
                        const inFilter = idList.map(id => `"${id}"`).join(',');
                        await fetch(`${sbUrl}/rest/v1/students?student_id=in.(${encodeURIComponent(inFilter)})`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': sbKey,
                                'Authorization': `Bearer ${sbKey}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({ kelas_sekolah: targetClassSchool })
                        });
                        // Fallback NIS jika ada record dengan student_id berbeda
                        if (affectedNisList.length > 0) {
                            const inNis = affectedNisList.map(n => `"${n}"`).join(',');
                            await fetch(`${sbUrl}/rest/v1/students?nis=in.(${encodeURIComponent(inNis)})`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': sbKey,
                                    'Authorization': `Bearer ${sbKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ kelas_sekolah: targetClassSchool })
                            });
                        }
                    } catch (sbErr) {
                        console.warn('[SUPABASE BATCH WRITE KELAS WARN]', sbErr);
                    }
                }

                // 3. REPLIKASI KE GOOGLE APPS SCRIPT SPREADSHEET
                if (typeof apiPost === 'function') {
                    try {
                        await apiPost("batchUpdateStudentClassSchool", {
                            token,
                            studentIds: idList,
                            kelas_sekolah: targetClassSchool
                        });
                    } catch (gasErr) {
                        console.warn('[GAS BATCH WRITE KELAS WARN]', gasErr);
                    }
                }

                if (typeof showToast === 'function') {
                    showToast(`✅ Kelas & Sekolah untuk ${idList.length} santri berhasil diubah menjadi "${targetClassSchool}"!`);
                }

                closeBulkEditClassSchoolModal();
                clearSelectedAdminStudents();
                await loadAdminStudentsData();
            } catch (err) {
                console.error("Gagal edit massal kelas santri:", err);
                if (typeof showToast === 'function') showToast("❌ Gagal edit massal: " + err.message);
            } finally {
                if (btn) btn.disabled = false;
                if (btnIcon) btnIcon.className = "fa-solid fa-check";
                if (btnText) btnText.innerText = "Terapkan Perubahan";
            }
        }

        /**
         * Buka Modal Tambah / Edit Santri
         */
        function openAdminStudentModal(student = null) {
            if (student && typeof window.hasPermission === 'function' && !window.hasPermission('santri.edit')) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk mengedit data santri.");
                }
                return;
            }
            if (!student && typeof window.hasPermission === 'function' && !window.hasPermission('santri.create')) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk menambah data santri.");
                }
                return;
            }

            const modal = document.getElementById('modal-admin-student');
            const titleEl = document.getElementById('modal-admin-student-title');
            const submitText = document.getElementById('admin-student-submit-text');
            const form = document.getElementById('adminStudentForm');

            if (!modal) return;

            selectedStudentPhotoFile = null;
            if (form) form.reset();

            const previewImg = document.getElementById('admin-student-avatar-preview');
            const placeholder = document.getElementById('admin-student-avatar-placeholder');
            const removeBtn = document.getElementById('admin-student-photo-remove-btn');

            if (student) {
                // EDIT MODE
                if (titleEl) titleEl.innerText = "Edit Data Santri";
                if (submitText) submitText.innerText = "Perbarui Santri";

                document.getElementById('admin-student-form-id').value = student.studentId || student.student_id || '';
                document.getElementById('admin-student-form-nis').value = student.nis || student.nisn || '';
                document.getElementById('admin-student-form-nik').value = student.nik || '';
                document.getElementById('admin-student-form-name').value = student.name || '';
                document.getElementById('admin-student-form-gender').value = (student.gender || 'L').toUpperCase() === 'P' ? 'P' : 'L';
                document.getElementById('admin-student-form-birthdate').value = student.birthDate || student.birth_date || '';
                populateAdminStudentProgramDropdown(student.program || 'Tahfidz Intensif');
                populateAdminStudentKelasSekolahDropdown(student.kelas_sekolah || student.kelasSekolah || student.kelas || '');
                document.getElementById('admin-student-form-status').value = (student.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
                
                const photoUrl = student.photoUrl || student.photo_url || '';
                document.getElementById('admin-student-form-photo-url').value = photoUrl;

                if (photoUrl && previewImg) {
                    previewImg.src = photoUrl;
                    previewImg.classList.remove('hidden');
                    if (placeholder) placeholder.classList.add('hidden');
                    if (removeBtn) removeBtn.classList.remove('hidden');
                } else {
                    if (previewImg) previewImg.classList.add('hidden');
                    if (placeholder) placeholder.classList.remove('hidden');
                    if (removeBtn) removeBtn.classList.add('hidden');
                }
            } else {
                // TAMBAH MODE
                if (titleEl) titleEl.innerText = "Tambah Data Santri Baru";
                if (submitText) submitText.innerText = "Simpan Data Santri";

                document.getElementById('admin-student-form-id').value = '';
                document.getElementById('admin-student-form-photo-url').value = '';
                document.getElementById('admin-student-form-gender').value = 'L';
                populateAdminStudentProgramDropdown('Tahfidz Intensif');
                populateAdminStudentKelasSekolahDropdown('');
                document.getElementById('admin-student-form-status').value = 'ACTIVE';

                if (previewImg) previewImg.classList.add('hidden');
                if (placeholder) placeholder.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.add('hidden');
            }

            modal.classList.remove('hidden');
        }

        /**
         * Tutup Modal Tambah / Edit Santri
         */
        function closeAdminStudentModal() {
            const modal = document.getElementById('modal-admin-student');
            if (modal) modal.classList.add('hidden');
            selectedStudentPhotoFile = null;
        }

        /**
         * Handler pemilihan file foto profil santri
         */
        function handleStudentPhotoSelect(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                if (typeof showToast === 'function') showToast("⚠️ File harus berupa gambar (JPG, PNG, atau WEBP).");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                if (typeof showToast === 'function') showToast("⚠️ Ukuran foto maksimal 5 MB.");
                return;
            }

            selectedStudentPhotoFile = file;

            const previewImg = document.getElementById('admin-student-avatar-preview');
            const placeholder = document.getElementById('admin-student-avatar-placeholder');
            const removeBtn = document.getElementById('admin-student-photo-remove-btn');

            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImg) {
                    previewImg.src = e.target.result;
                    previewImg.classList.remove('hidden');
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }

        /**
         * Hapus foto dari form
         */
        function removeStudentPhoto() {
            selectedStudentPhotoFile = null;
            const fileInput = document.getElementById('admin-student-photo-file');
            if (fileInput) fileInput.value = '';

            const photoUrlInput = document.getElementById('admin-student-form-photo-url');
            if (photoUrlInput) photoUrlInput.value = '';

            const previewImg = document.getElementById('admin-student-avatar-preview');
            const placeholder = document.getElementById('admin-student-avatar-placeholder');
            const removeBtn = document.getElementById('admin-student-photo-remove-btn');

            if (previewImg) {
                previewImg.src = '';
                previewImg.classList.add('hidden');
            }
            if (placeholder) placeholder.classList.remove('hidden');
            if (removeBtn) removeBtn.classList.add('hidden');
        }

        /**
         * Simpan Data Santri (Upload foto ke Drive jika ada file baru, lalu simpan ke database)
         */
        async function submitAdminStudent(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-student-submit-btn');
            const btnIcon = document.getElementById('admin-student-submit-icon');
            const btnText = document.getElementById('admin-student-submit-text');

            const studentId = document.getElementById('admin-student-form-id')?.value || '';
            const nis = (document.getElementById('admin-student-form-nis')?.value || '').trim();
            const nik = (document.getElementById('admin-student-form-nik')?.value || '').trim();
            const name = (document.getElementById('admin-student-form-name')?.value || '').trim();
            const gender = document.getElementById('admin-student-form-gender')?.value || 'L';
            const birthDate = document.getElementById('admin-student-form-birthdate')?.value || '';
            const program = (document.getElementById('admin-student-form-program')?.value || '').trim() || 'Reguler';
            const kelasSekolah = (document.getElementById('admin-student-form-kelas-sekolah')?.value || '').trim();
            const status = document.getElementById('admin-student-form-status')?.value || 'ACTIVE';
            let photoUrl = document.getElementById('admin-student-form-photo-url')?.value || '';

            if (!nis || !name) {
                if (typeof showToast === 'function') showToast("⚠️ NIS dan Nama Santri wajib diisi!");
                return;
            }

            btn.disabled = true;
            if (btnIcon) btnIcon.className = "fa-solid fa-spinner fa-spin";
            if (btnText) btnText.innerText = "Menyimpan...";

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";

                // STEP 1: Upload Foto ke Google Drive jika ada file baru
                if (selectedStudentPhotoFile) {
                    if (btnText) btnText.innerText = "Mengunggah Foto...";
                    const compressed = await compressImageFile(selectedStudentPhotoFile, 800, 0.90);

                    const uploadRes = await apiPost("uploadStudentPhoto", {
                        token,
                        file: compressed,
                        nis: nis,
                        studentId: studentId
                    });

                    if (uploadRes && (uploadRes.success || uploadRes.status === "success") && uploadRes.url) {
                        photoUrl = uploadRes.url;
                    } else {
                        console.warn("Upload foto santri gagal:", uploadRes);
                        if (typeof showToast === 'function') {
                            showToast("⚠️ Peringatan: Gagal mengunggah foto ke Drive: " + ((uploadRes && uploadRes.message) || ""));
                        }
                    }
                }

                // STEP 2: Simpan data santri ke Spreadsheet Students
                if (btnText) btnText.innerText = "Menyimpan Data...";

                const payload = {
                    token,
                    studentId,
                    student_id: studentId,
                    nis,
                    nik,
                    name,
                    gender,
                    birthDate,
                    birth_date: birthDate,
                    photoUrl,
                    photo_url: photoUrl,
                    program,
                    kelas_sekolah: kelasSekolah,
                    kelasSekolah: kelasSekolah,
                    status
                };

                const saveRes = await apiPost("saveStudent", payload);

                if (saveRes && (saveRes.success || saveRes.status === "success")) {
                    const finalStudentId = (saveRes && (saveRes.studentId || saveRes.student_id)) || payload.studentId || payload.student_id;

                    // 1. Optimistic Update pada State Lokal & UI
                    if (Array.isArray(adminStudentsData)) {
                        const targetIdx = adminStudentsData.findIndex(s => 
                            (finalStudentId && (s.student_id === finalStudentId || s.id === finalStudentId || s.studentId === finalStudentId)) ||
                            (nis && (s.nis === nis || s.nisn === nis))
                        );
                        const updatedRecord = {
                            id: finalStudentId,
                            student_id: finalStudentId,
                            studentId: finalStudentId,
                            nis: nis,
                            nik: nik,
                            name: name,
                            gender: gender,
                            birth_date: birthDate,
                            birthDate: birthDate,
                            photo_url: photoUrl || (targetIdx !== -1 ? (adminStudentsData[targetIdx].photo_url || adminStudentsData[targetIdx].photoUrl) : ''),
                            photoUrl: photoUrl || (targetIdx !== -1 ? (adminStudentsData[targetIdx].photoUrl || adminStudentsData[targetIdx].photo_url) : ''),
                            program: program,
                            kelas_sekolah: kelasSekolah,
                            kelasSekolah: kelasSekolah,
                            status: status
                        };
                        if (targetIdx !== -1) {
                            adminStudentsData[targetIdx] = { ...adminStudentsData[targetIdx], ...updatedRecord };
                        } else {
                            adminStudentsData.unshift(updatedRecord);
                        }
                        window.adminStudentsData = adminStudentsData;
                        window.adminStudentsList = adminStudentsData;
                        try {
                            localStorage.setItem('ASNAWIYYAH_STUDENTS_CACHE', JSON.stringify(adminStudentsData));
                        } catch (cacheErr) {}
                        if (typeof filterAdminStudentsList === 'function') {
                            filterAdminStudentsList();
                        }
                    }

                    if (typeof showToast === 'function') {
                        showToast(saveRes.message || "Data santri berhasil disimpan!");
                    }
                    // 2. Dual-Write ke Supabase Cloud DB (<50ms)
                    if (typeof window.syncToSupabaseOnWrite === 'function') {
                        await window.syncToSupabaseOnWrite('saveStudent', { ...payload, studentId: finalStudentId }, saveRes);
                    }
                    closeAdminStudentModal();
                    await loadAdminStudentsData();
                } else {
                    const msg = (saveRes && saveRes.message) || "Gagal menyimpan data santri.";
                    if (typeof showToast === 'function') showToast("❌ " + msg);
                }
            } catch (err) {
                console.error("Gagal simpan data santri:", err);
                if (typeof showToast === 'function') showToast("❌ " + err.message);
            } finally {
                btn.disabled = false;
                if (btnIcon) btnIcon.className = "fa-solid fa-floppy-disk";
                if (btnText) btnText.innerText = studentId ? "Perbarui Santri" : "Simpan Data Santri";
            }
        }

        /**
         * Buka Modal Konfirmasi Hapus Santri
         */
        function openAdminStudentDeleteModal(studentId, studentName) {
            if (typeof window.hasPermission === 'function' && !window.hasPermission('santri.delete')) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk menghapus data santri.");
                }
                return;
            }

            pendingDeleteStudentId = studentId;
            const desc = document.getElementById('modal-admin-student-delete-desc');
            if (desc) {
                desc.innerText = `Apakah Anda yakin ingin menghapus data santri "${studentName}" (ID: ${studentId}) dari database?`;
            }
            const modal = document.getElementById('modal-admin-student-delete');
            if (modal) modal.classList.remove('hidden');
        }

        /**
         * Tutup Modal Konfirmasi Hapus Santri
         */
        function closeAdminStudentDeleteModal() {
            const modal = document.getElementById('modal-admin-student-delete');
            if (modal) modal.classList.add('hidden');
            pendingDeleteStudentId = null;
        }

        /**
         * Eksekusi Hapus Santri
         */
        async function executeDeleteAdminStudent() {
            if (!pendingDeleteStudentId) return;

            const btn = document.getElementById('admin-student-confirm-delete-btn');
            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Menghapus...</span>';
            }

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
                const response = await apiPost("deleteStudent", {
                    token,
                    studentId: pendingDeleteStudentId
                });

                if (response && (response.success || response.status === "success")) {
                    if (typeof showToast === 'function') {
                        showToast(response.message || "Data santri berhasil dihapus.");
                    }
                    // Dual-Write delete ke Supabase Cloud DB
                    if (typeof window.syncToSupabaseOnWrite === 'function') {
                        await window.syncToSupabaseOnWrite('deleteStudent', { studentId: pendingDeleteStudentId }, response);
                    }
                    closeAdminStudentDeleteModal();
                    await loadAdminStudentsData();
                } else {
                    const msg = (response && response.message) || "Gagal menghapus santri.";
                    if (typeof showToast === 'function') showToast("❌ " + msg);
                }
            } catch (err) {
                console.error("Gagal menghapus santri:", err);
                if (typeof showToast === 'function') showToast("❌ " + err.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        }

