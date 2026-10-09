/**
 * ====================================================================
 * MODUL DATA PEGAWAI (ASATIDZ, MUHAFIZ, GURU, & STAF KARYAWAN)
 * PPTQ Asnawiyyah Dashboard & Control Center
 * ====================================================================
 */

window.ASNPegawai = {
    list: [],
    filtered: [],
    isLoading: false
};

/**
 * Muat data pegawai dari backend Google Sheets
 */
async function loadAdminEmployeesData() {
    const loader = document.getElementById('admin-pegawai-loader');
    const tbody = document.getElementById('admin-pegawai-table-tbody');
    const mobileList = document.getElementById('admin-pegawai-mobile-list');
    const emptyState = document.getElementById('admin-pegawai-empty-state');

    if (loader) loader.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    ASNPegawai.isLoading = true;

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        let response = null;

        if (typeof apiPost === 'function') {
            try {
                response = await apiPost("getEmployees", { token });
            } catch (err) {
                console.warn("apiPost getEmployees error, fallback to legacy/get:", err);
            }
        }

        if (!response || (!response.data && !Array.isArray(response))) {
            // Fallback via URL fetch
            const apiUrl = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "");
            if (apiUrl) {
                const res = await fetch(`${apiUrl}?action=getEmployees&token=${encodeURIComponent(token)}`);
                response = await res.json();
            }
        }

        let employees = [];
        if (response && Array.isArray(response.data)) {
            employees = response.data;
        } else if (Array.isArray(response)) {
            employees = response;
        }

        // Muat daftar users jika belum tersedia untuk pencocokan akun otomatis
        let userList = (typeof adminUsersList !== 'undefined' && Array.isArray(adminUsersList) && adminUsersList.length > 0) ? adminUsersList : [];
        if (userList.length === 0 && typeof apiPost === 'function') {
            try {
                const uRes = await apiPost("getUsers", { token });
                if (uRes && (uRes.users || uRes.data)) {
                    userList = uRes.users || uRes.data;
                    if (typeof adminUsersList !== 'undefined') {
                        adminUsersList = userList;
                    }
                }
            } catch (uErr) {
                console.warn("[LOAD USERS FOR PEGAWAI WARN]", uErr);
            }
        }

        // Normalisasi data pegawai & hubungkan status akun pengguna (Users)
        employees = employees.map(p => {
            const rawId = p.employeeId || p.employee_id || p.id || p.nip || ('PEG_' + Math.random().toString(36).substring(2, 9));
            const empIdStr = String(rawId).trim();
            const pEmail = (p.email || '').toLowerCase().trim();
            const pPhone = (p.telepon || p.phone || '').replace(/\D/g, '');

            // Cocokkan dengan akun di tabel Users
            const matchedUser = userList.find(u => {
                const uEmpId = String(u.employeeId || u.employee_id || '').trim();
                const uEmail = (u.email || '').toLowerCase().trim();
                const uPhone = (u.phone || '').replace(/\D/g, '');
                return (uEmpId && uEmpId === empIdStr) || 
                       (pEmail && uEmail && pEmail === uEmail) ||
                       (pPhone && uPhone && pPhone.length >= 8 && uPhone.endsWith(pPhone.slice(-8)));
            });

            return {
                ...p,
                employeeId: empIdStr,
                employee_id: empIdStr,
                id: empIdStr,
                nama: p.nama || p.name || '',
                nip: p.nip || '',
                gender: (p.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
                jabatan: p.jabatan || 'Ustadz / Muhafiz',
                spesialisasi: p.spesialisasi || '',
                telepon: p.telepon || p.phone || '',
                email: p.email || '',
                status: (p.status || 'ACTIVE').toUpperCase(),
                hasAccount: Boolean(matchedUser),
                userId: matchedUser ? (matchedUser.userId || matchedUser.user_id) : null,
                userRole: matchedUser ? matchedUser.role : null,
                userStatus: matchedUser ? matchedUser.status : null
            };
        });

        ASNPegawai.list = employees;
        ASNPegawai.filtered = [...employees];

        // Simpan jumlah pegawai ke localStorage cache agar KPI Dashboard Utama langsung aktual
        try {
            localStorage.setItem('ASNAWIYYAH_PEGAWAI_CACHE', JSON.stringify(employees.length));
        } catch(cacheErr) { /* quota exceeded — abaikan */ }

        // Update Counter Statistik
        updatePegawaiStatistics(employees);

        if (typeof updateAdminDashboardKpis === 'function') {
            updateAdminDashboardKpis();
        }

        // Update Hub Counter jika ada
        const hubBadge = document.getElementById('admin-hub-pegawai-count');
        if (hubBadge) hubBadge.innerText = `${employees.length} Pegawai`;

        // Render Table & Cards
        renderAdminPegawaiTable();

    } catch (err) {
        console.error("[LOAD PEGAWAI ERROR]", err);
        if (typeof showToast === 'function') {
            showToast("❌ Gagal memuat data pegawai: " + (err.message || "Terjadi kesalahan jaringan"));
        }
    } finally {
        if (loader) loader.classList.add('hidden');
        ASNPegawai.isLoading = false;
    }
}

/**
 * Utility escape HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Pemetaan cerdas peran RBAC berdasarkan jabatan kepegawaian
 */
function suggestRoleFromJabatan(jabatan) {
    const j = String(jabatan || '').toLowerCase();
    if (j.includes('bendahara') || j.includes('keuangan')) return 'BENDAHARA';
    if (j.includes('tu') || j.includes('tata usaha') || j.includes('administrasi')) return 'EDITOR';
    if (j.includes('musyrif') || j.includes('pembina') || j.includes('pengasuh')) return 'PENGASUH';
    if (j.includes('kepala') || j.includes('pimpinan')) return 'ADMIN';
    return 'ASATIDZ';
}

/**
 * Toggle tampilan opsi peran login pengguna di modal pegawai
 */
function toggleEmployeeUserSyncUI() {
    const chk = document.getElementById('input-employee-sync-user');
    const container = document.getElementById('container-employee-user-role');
    if (!container) return;
    if (chk && chk.checked) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

/**
 * Kalkulasi ringkasan statistik data pegawai
 */
function updatePegawaiStatistics(employees) {
    const total = employees.length;
    let asatidzCount = 0;
    let stafCount = 0;
    let aktifCount = 0;

    employees.forEach(p => {
        const j = String(p.jabatan || "").toLowerCase();
        const s = String(p.status || "ACTIVE").toUpperCase();

        if (j.includes("muhafiz") || j.includes("ustadz") || j.includes("guru") || j.includes("pengajar")) {
            asatidzCount++;
        } else {
            stafCount++;
        }

        if (s === "ACTIVE" || s === "AKTIF") {
            aktifCount++;
        }
    });

    const elTotal = document.getElementById('admin-pegawai-stat-total');
    const elAsatidz = document.getElementById('admin-pegawai-stat-asatidz');
    const elStaf = document.getElementById('admin-pegawai-stat-staf');
    const elAktif = document.getElementById('admin-pegawai-stat-aktif');

    if (elTotal) elTotal.innerText = total;
    if (elAsatidz) elAsatidz.innerText = asatidzCount;
    if (elStaf) elStaf.innerText = stafCount;
    if (elAktif) elAktif.innerText = aktifCount;
}

/**
 * Filter realtime data pegawai
 */
function filterAdminPegawaiList() {
    const searchVal = (document.getElementById('admin-pegawai-search')?.value || "").toLowerCase().trim();
    const jabatanVal = (document.getElementById('admin-pegawai-filter-jabatan')?.value || "ALL").toLowerCase();
    const statusVal = (document.getElementById('admin-pegawai-filter-status')?.value || "ALL").toUpperCase();

    ASNPegawai.filtered = ASNPegawai.list.filter(p => {
        // Query search
        const matchQuery = !searchVal ||
            (p.nama && p.nama.toLowerCase().includes(searchVal)) ||
            (p.nip && p.nip.toLowerCase().includes(searchVal)) ||
            (p.telepon && p.telepon.toLowerCase().includes(searchVal)) ||
            (p.spesialisasi && p.spesialisasi.toLowerCase().includes(searchVal));

        // Filter Jabatan
        let matchJabatan = true;
        if (jabatanVal !== "all") {
            const j = (p.jabatan || "").toLowerCase();
            if (jabatanVal === "muhafiz") {
                matchJabatan = j.includes("muhafiz") || j.includes("ustadz") || j.includes("ustadzah");
            } else if (jabatanVal === "guru") {
                matchJabatan = j.includes("guru") || j.includes("pengajar") || j.includes("diniyah");
            } else if (jabatanVal === "staf") {
                matchJabatan = j.includes("staf") || j.includes("tu") || j.includes("tata usaha") || j.includes("administrasi");
            } else if (jabatanVal === "pembina") {
                matchJabatan = j.includes("musyrif") || j.includes("musyrifah") || j.includes("pembina") || j.includes("pengasuhan");
            }
        }

        // Filter Status
        const st = String(p.status || "ACTIVE").toUpperCase();
        const matchStatus = (statusVal === "ALL") || (statusVal === "ACTIVE" ? (st === "ACTIVE" || st === "AKTIF") : (st !== "ACTIVE" && st !== "AKTIF"));

        return matchQuery && matchJabatan && matchStatus;
    });

    renderAdminPegawaiTable();
}

/**
 * Render Tabel Desktop & Kartu Mobile
 */
function renderAdminPegawaiTable() {
    const tbody = document.getElementById('admin-pegawai-table-tbody');
    const mobileList = document.getElementById('admin-pegawai-mobile-list');
    const emptyState = document.getElementById('admin-pegawai-empty-state');

    const data = ASNPegawai.filtered || [];

    if (data.length === 0) {
        if (tbody) tbody.innerHTML = "";
        if (mobileList) mobileList.innerHTML = "";
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const canManagePegawai = typeof window.hasPermission === 'function' ? window.hasPermission('pegawai.manage') : true;

    // 1. Render Desktop Table Rows
    if (tbody) {
        tbody.innerHTML = data.map((p, idx) => {
            const empId = p.employeeId || p.employee_id || p.id || '';
            const isAktif = (p.status || "ACTIVE").toUpperCase() === "ACTIVE" || (p.status || "").toUpperCase() === "AKTIF";
            const initials = (p.nama || "P").substring(0, 2).toUpperCase();
            const waClean = (p.telepon || "").replace(/\D/g, "");
            const waLink = waClean ? `https://wa.me/${waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean}` : "";

            // Badge Akun Login Pengguna
            let accountBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" title="Pegawai belum memiliki akun login">
                <i class="fa-regular fa-circle text-[8px] text-slate-400"></i> Belum Ada
            </span>`;
            if (p.hasAccount) {
                const isUserActive = (p.userStatus || 'ACTIVE').toUpperCase() === 'ACTIVE';
                accountBadge = `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${isUserActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-100 dark:border-rose-900/60'}" title="Akun: ${p.userId || '-'} (${p.userRole || 'ASATIDZ'})">
                    <span class="w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                    <span>${escapeHtml(p.userRole || 'ASATIDZ')}</span>
                </span>`;
            }

            return `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1c2836] border-b border-slate-100 dark:border-[#253447] transition">
                <td class="px-4 py-3 text-slate-400 font-semibold text-center">${idx + 1}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-9 h-9 rounded-xl ${p.gender === 'P' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            ${initials}
                        </div>
                        <div>
                            <div class="font-bold text-slate-800 dark:text-slate-100">${escapeHtml(p.nama)}</div>
                            <div class="text-[10px] text-slate-400 font-mono">NIP: ${escapeHtml(p.nip || '-')}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                        ${escapeHtml(p.jabatan || 'Pegawai')}
                    </span>
                    ${p.spesialisasi ? `<span class="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(p.spesialisasi)}</span>` : ''}
                </td>
                <td class="px-4 py-3">
                    ${waLink ? `
                        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition">
                            <i class="fa-brands fa-whatsapp text-emerald-600"></i>
                            <span>${escapeHtml(p.telepon)}</span>
                        </a>
                    ` : `<span class="text-slate-400 text-[11px]">-</span>`}
                </td>
                <td class="px-4 py-3 text-center">
                    ${accountBadge}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${isAktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
                        ${isAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    ${canManagePegawai ? `
                    <div class="flex items-center justify-center space-x-1.5">
                        <button type="button" onclick="openAdminEmployeeModal('${escapeHtml(empId)}')" class="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 flex items-center justify-center transition" title="Edit Data">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button type="button" onclick="deleteAdminEmployee('${escapeHtml(empId)}', '${escapeHtml(p.nama)}')" class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 flex items-center justify-center transition" title="Hapus Data">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                    ` : `<span class="text-xs text-slate-400 italic">Lihat Saja</span>`}
                </td>
            </tr>
            `;
        }).join('');
    }

    // 2. Render Mobile Cards
    if (mobileList) {
        mobileList.innerHTML = data.map(p => {
            const empId = p.employeeId || p.employee_id || p.id || '';
            const isAktif = (p.status || "ACTIVE").toUpperCase() === "ACTIVE" || (p.status || "").toUpperCase() === "AKTIF";
            const initials = (p.nama || "P").substring(0, 2).toUpperCase();
            const waClean = (p.telepon || "").replace(/\D/g, "");
            const waLink = waClean ? `https://wa.me/${waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean}` : "";

            let accountBadgeMobile = `<span class="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">Belum Ada Akun</span>`;
            if (p.hasAccount) {
                const isUserActive = (p.userStatus || 'ACTIVE').toUpperCase() === 'ACTIVE';
                accountBadgeMobile = `<span class="px-2 py-0.5 rounded text-[9px] font-extrabold ${isUserActive ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-rose-100 text-rose-800'}">Akun: ${escapeHtml(p.userRole || 'ASATIDZ')}</span>`;
            }

            return `
            <div class="bg-white dark:bg-[#15202d] p-4 rounded-2xl border border-slate-100 dark:border-[#253447] shadow-sm space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl ${p.gender === 'P' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'} flex items-center justify-center font-bold text-sm shrink-0">
                            ${initials}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${escapeHtml(p.nama)}</h4>
                            <p class="text-[10px] text-slate-400 font-mono">NIP: ${escapeHtml(p.nip || '-')}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <span class="px-2 py-0.5 rounded text-[9px] font-extrabold ${isAktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}">
                            ${isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                        ${accountBadgeMobile}
                    </div>
                </div>

                <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1c2836] flex items-center justify-between text-xs">
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase font-bold block">Jabatan</span>
                        <span class="font-bold text-indigo-700 dark:text-indigo-300">${escapeHtml(p.jabatan || 'Pegawai')}</span>
                    </div>
                    ${p.spesialisasi ? `
                        <div class="text-right">
                            <span class="text-[10px] text-slate-400 uppercase font-bold block">Bidang</span>
                            <span class="font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(p.spesialisasi)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#253447]">
                    ${waLink ? `
                        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                            <i class="fa-brands fa-whatsapp text-emerald-600"></i>
                            <span>${escapeHtml(p.telepon)}</span>
                        </a>
                    ` : `<span class="text-[11px] text-slate-400">Tidak ada kontak</span>`}

                    ${canManagePegawai ? `
                    <div class="flex items-center space-x-1.5">
                        <button type="button" onclick="openAdminEmployeeModal('${escapeHtml(empId)}')" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button type="button" onclick="deleteAdminEmployee('${escapeHtml(empId)}', '${escapeHtml(p.nama)}')" class="p-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');
    }
}

/**
 * Buka Modal Form Tambah / Edit Pegawai
 */
function openAdminEmployeeModal(employeeId = null) {
    if (typeof window.hasPermission === 'function' && !window.hasPermission('pegawai.manage')) {
        if (typeof showToast === 'function') {
            showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk mengelola pegawai.");
        }
        return;
    }

    const modal = document.getElementById('modal-employee-form');
    const form = document.getElementById('form-employee');
    const modalTitle = document.getElementById('modal-employee-title');
    const btnSubmit = document.getElementById('btn-save-employee');
    if (!modal) return;

    if (form) form.reset();

    const idInput = document.getElementById('input-employee-id');
    const namaInput = document.getElementById('input-employee-nama');
    const nipInput = document.getElementById('input-employee-nip');
    const genderInput = document.getElementById('input-employee-gender');
    const jabatanSelect = document.getElementById('input-employee-jabatan');
    const spesialisasiInput = document.getElementById('input-employee-spesialisasi');
    const teleponInput = document.getElementById('input-employee-telepon');
    const emailInput = document.getElementById('input-employee-email');
    const statusSelect = document.getElementById('input-employee-status');

    // Elemen Sinkronisasi Akun Pengguna
    const syncUserChk = document.getElementById('input-employee-sync-user');
    const syncUserBadge = document.getElementById('badge-employee-user-status');
    const userRoleSelect = document.getElementById('input-employee-user-role');
    const userRoleContainer = document.getElementById('container-employee-user-role');

    if (idInput) idInput.value = '';
    if (statusSelect) statusSelect.value = 'ACTIVE';
    if (genderInput) genderInput.value = 'L';

    // Handler otomatisasi pilihan role saat jabatan diubah
    if (jabatanSelect) {
        jabatanSelect.onchange = function() {
            if (userRoleSelect && (!emp || !emp.hasAccount)) {
                userRoleSelect.value = suggestRoleFromJabatan(jabatanSelect.value);
            }
        };
    }

    // Treat 'undefined', 'null', '', or false as no ID (Tambah Baru)
    const cleanId = (employeeId && employeeId !== 'undefined' && employeeId !== 'null') ? String(employeeId).trim() : null;

    let emp = null;
    if (cleanId) {
        emp = (ASNPegawai.list || []).find(p => {
            const pId = String(p.employeeId || p.employee_id || p.id || '').trim();
            const pNip = String(p.nip || '').trim();
            return pId === cleanId || (pNip && pNip === cleanId);
        });
    }

    if (emp) {
        // Mode Edit Data Pegawai
        if (modalTitle) modalTitle.innerText = "Edit Data Pegawai / Ustadz";
        if (btnSubmit) {
            btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Simpan Perubahan</span>`;
        }

        const validEmpId = emp.employeeId || emp.employee_id || emp.id || cleanId;
        if (idInput) idInput.value = validEmpId;
        if (namaInput) namaInput.value = emp.nama || emp.name || '';
        if (nipInput) nipInput.value = emp.nip || '';
        if (genderInput) genderInput.value = (emp.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';

        // Set Jabatan (tambahkan opsi dinamis bila jabatan custom / belum terdaftar)
        if (jabatanSelect) {
            const targetJabatan = emp.jabatan || 'Ustadz / Muhafiz';
            let foundOption = false;
            for (let i = 0; i < jabatanSelect.options.length; i++) {
                if (jabatanSelect.options[i].value.toLowerCase() === targetJabatan.toLowerCase()) {
                    jabatanSelect.selectedIndex = i;
                    foundOption = true;
                    break;
                }
            }
            if (!foundOption) {
                const opt = document.createElement('option');
                opt.value = targetJabatan;
                opt.innerText = targetJabatan;
                jabatanSelect.appendChild(opt);
                jabatanSelect.value = targetJabatan;
            }
        }

        if (spesialisasiInput) spesialisasiInput.value = emp.spesialisasi || '';
        if (teleponInput) teleponInput.value = emp.telepon || emp.phone || '';
        if (emailInput) emailInput.value = emp.email || '';
        if (statusSelect) {
            const st = (emp.status || 'ACTIVE').toUpperCase();
            statusSelect.value = (st === 'INACTIVE' || st === 'NONAKTIF' || st === 'CUTI') ? 'INACTIVE' : 'ACTIVE';
        }

        // Status Akun Pengguna Terkait
        if (emp.hasAccount) {
            if (syncUserChk) syncUserChk.checked = true;
            if (userRoleSelect && emp.userRole) userRoleSelect.value = emp.userRole;
            if (syncUserBadge) {
                syncUserBadge.className = "px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0";
                syncUserBadge.innerText = `🟢 Akun Aktif (${emp.userRole || 'ASATIDZ'})`;
            }
            if (userRoleContainer) userRoleContainer.classList.remove('hidden');
        } else {
            if (syncUserChk) syncUserChk.checked = false;
            const suggested = suggestRoleFromJabatan(emp.jabatan);
            if (userRoleSelect) userRoleSelect.value = suggested;
            if (syncUserBadge) {
                syncUserBadge.className = "px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0";
                syncUserBadge.innerText = "⚪ Belum Ada Akun";
            }
            if (userRoleContainer) userRoleContainer.classList.add('hidden');
        }

    } else {
        // Mode Tambah Pegawai Baru
        if (modalTitle) modalTitle.innerText = "Tambah Pegawai / Ustadz Baru";
        if (btnSubmit) {
            btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Simpan Pegawai</span>`;
        }

        // Auto-provision aktif untuk kemudahan admin
        if (syncUserChk) syncUserChk.checked = true;
        if (userRoleSelect) userRoleSelect.value = 'ASATIDZ';
        if (syncUserBadge) {
            syncUserBadge.className = "px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0";
            syncUserBadge.innerText = "✨ Akun Baru Otomatis";
        }
        if (userRoleContainer) userRoleContainer.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
}

/**
 * Tutup Modal Form Pegawai
 */
function closeAdminEmployeeModal() {
    const modal = document.getElementById('modal-employee-form');
    if (modal) modal.classList.add('hidden');
}

/**
 * Simpan Data Pegawai (Submit Handler)
 */
async function saveAdminEmployee(e) {
    if (e) e.preventDefault();

    const employeeId = document.getElementById('input-employee-id')?.value || '';
    const isEdit = Boolean(employeeId);
    const nama = document.getElementById('input-employee-nama')?.value?.trim() || '';
    const nip = document.getElementById('input-employee-nip')?.value?.trim() || '';
    const gender = document.getElementById('input-employee-gender')?.value || 'L';
    const jabatan = document.getElementById('input-employee-jabatan')?.value || '';
    const spesialisasi = document.getElementById('input-employee-spesialisasi')?.value?.trim() || '';
    const telepon = document.getElementById('input-employee-telepon')?.value?.trim() || '';
    const email = document.getElementById('input-employee-email')?.value?.trim() || '';
    const status = document.getElementById('input-employee-status')?.value || 'ACTIVE';

    const syncUser = document.getElementById('input-employee-sync-user')?.checked || false;
    const userRole = document.getElementById('input-employee-user-role')?.value || 'ASATIDZ';

    if (!nama) {
        if (typeof showToast === 'function') showToast("⚠️ Nama lengkap pegawai wajib diisi.");
        return;
    }

    if (syncUser && !email) {
        if (typeof showToast === 'function') showToast("⚠️ Email wajib diisi jika ingin menyinkronkan/membuat akun login pengguna.");
        document.getElementById('input-employee-email')?.focus();
        return;
    }

    const payload = {
        employeeId,
        employee_id: employeeId,
        id: employeeId,
        nama,
        name: nama,
        nip,
        gender,
        jabatan,
        spesialisasi,
        telepon,
        email,
        status,
        syncUser,
        createAccount: syncUser,
        userRole
    };

    const btnSubmit = document.getElementById('btn-save-employee');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
    }

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const res = await apiPost("saveEmployee", { ...payload, token });

        if (res && (res.success || res.status === "success")) {
            if (typeof showToast === 'function') {
                showToast(isEdit ? "✅ Data pegawai berhasil diperbarui!" : "✅ Pegawai baru berhasil ditambahkan!");
            }
            closeAdminEmployeeModal();
            await loadAdminEmployeesData();

            // Bila modul Tahfidz aktif, refresh pilihan muhafiz
            if (typeof ASNTahfidz !== 'undefined' && typeof populateTahfidzMuhafizDropdown === 'function') {
                populateTahfidzMuhafizDropdown();
            }
        } else {
            if (typeof showToast === 'function') {
                showToast("❌ Gagal menyimpan: " + ((res && res.message) || "Terjadi kesalahan"));
            }
        }
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') {
            showToast("❌ Terjadi kesalahan jaringan saat menyimpan data pegawai.");
        }
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>${isEdit ? 'Simpan Perubahan' : 'Simpan Pegawai'}</span>`;
        }
    }
}

/**
 * Hapus Data Pegawai
 */
async function deleteAdminEmployee(employeeId, nama) {
    if (!employeeId || employeeId === 'undefined' || employeeId === 'null') return;

    if (typeof window.hasPermission === 'function' && !window.hasPermission('pegawai.manage')) {
        if (typeof showToast === 'function') {
            showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk menghapus data pegawai.");
        }
        return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus data pegawai "${nama || employeeId}"?`)) {
        return;
    }

    try {
        const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
        const res = await apiPost("deleteEmployee", { employeeId, employee_id: employeeId, token });

        if (res && (res.success || res.status === "success")) {
            if (typeof showToast === 'function') {
                showToast("🗑️ Data pegawai berhasil dihapus!");
            }
            await loadAdminEmployeesData();

            if (typeof ASNTahfidz !== 'undefined' && typeof populateTahfidzMuhafizDropdown === 'function') {
                populateTahfidzMuhafizDropdown();
            }
        } else {
            if (typeof showToast === 'function') {
                showToast("❌ Gagal menghapus: " + ((res && res.message) || "Terjadi kesalahan"));
            }
        }
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') {
            showToast("❌ Terjadi kesalahan saat menghapus data.");
        }
    }
}

/**
 * Populate Dropdown Pilihan Ustadz / Muhafiz Pembina
 * Untuk digunakan di Form Kelola Halaqah & Plotting Santri
 */
function populateTahfidzMuhafizDropdown() {
    const sel = document.getElementById('input-halaqah-muhafiz');
    if (!sel) return;

    const currentVal = sel.value;
    const employees = ASNPegawai.list || [];

    // Filter pegawai berjabatan Ustadz, Muhafiz, Guru, Pengajar, atau spesialisasi Tahfidz
    const asatidz = employees.filter(p => {
        const j = String(p.jabatan || "").toLowerCase();
        const sp = String(p.spesialisasi || "").toLowerCase();
        const st = String(p.status || "ACTIVE").toUpperCase();
        return (st === "ACTIVE" || st === "AKTIF") && (
            j.includes("muhafiz") || j.includes("ustadz") || j.includes("guru") || j.includes("pengajar") || sp.includes("tahfidz")
        );
    });

    let optHtml = `<option value="">-- Pilih Ustadz / Muhafiz Pembina --</option>`;

    if (asatidz.length > 0) {
        asatidz.forEach(u => {
            const label = u.nama + (u.jabatan ? ` (${u.jabatan})` : '');
            optHtml += `<option value="${escapeHtml(u.nama)}">${escapeHtml(label)}</option>`;
        });
    } else if (employees.length > 0) {
        employees.forEach(u => {
            optHtml += `<option value="${escapeHtml(u.nama)}">${escapeHtml(u.nama)}</option>`;
        });
    } else if (window.ASNTahfidz && ASNTahfidz.data && ASNTahfidz.data.muhafizList) {
        // Fallback dari backend tahfidz
        ASNTahfidz.data.muhafizList.filter(m => m !== 'Semua Muhafiz').forEach(m => {
            optHtml += `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`;
        });
    }

    sel.innerHTML = optHtml;
    if (currentVal) sel.value = currentVal;
}

/**
 * ============================================================================
 * TAHAP 3: WIZARD SINKRONISASI MASAL AKUN PEGAWAI (DATA LAMA)
 * ============================================================================
 */
let syncCandidatesList = [];

/**
 * Buka modal wizard sinkronisasi masal akun pegawai
 */
async function openPegawaiAccountSyncWizard() {
    const modal = document.getElementById('modal-pegawai-sync-wizard');
    if (!modal) return;

    modal.classList.remove('hidden');

    const totalEl = document.getElementById('sync-stat-total');
    const hasAccEl = document.getElementById('sync-stat-has-account');
    const needSyncEl = document.getElementById('sync-stat-need-sync');
    const candidateListEl = document.getElementById('sync-wizard-candidate-list');
    const countEl = document.getElementById('sync-wizard-candidate-count');
    const progressBox = document.getElementById('sync-wizard-progress-box');
    const btnExecute = document.getElementById('btn-execute-mass-sync');

    if (progressBox) progressBox.classList.add('hidden');
    if (btnExecute) {
        btnExecute.disabled = false;
        btnExecute.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>Mulai Sinkronisasi Masal</span>`;
        btnExecute.className = "px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 active:scale-95";
    }

    if (candidateListEl) {
        candidateListEl.innerHTML = `
            <div class="py-8 text-center text-xs text-slate-400 space-y-2">
                <i class="fa-solid fa-spinner fa-spin text-xl text-emerald-600"></i>
                <p>Memindai dan mencocokkan data pegawai dengan akun pengguna...</p>
            </div>
        `;
    }

    // Pastikan data pegawai terbaru
    let employees = ASNPegawai.list || [];
    if (employees.length === 0) {
        await loadAdminEmployeesData();
        employees = ASNPegawai.list || [];
    }

    // Ambil daftar users terbaru
    let users = [];
    const config = window.ASNAWIYYAH_CONFIG || {};
    if (config.supabaseUrl && config.supabaseKey) {
        try {
            const res = await fetch(`${config.supabaseUrl}/rest/v1/users?select=user_id,employee_id,email,role,status`, {
                headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` }
            });
            if (res.ok) users = await res.json();
        } catch (e) {
            console.warn('[SYNC WIZARD SUPABASE FETCH WARN]', e);
        }
    }
    if (users.length === 0 && typeof adminUsersList !== 'undefined' && adminUsersList.length > 0) {
        users = adminUsersList;
    }

    // Buat map user berdasarkan employee_id dan email
    const userByEmpId = new Map();
    const userByEmail = new Map();
    users.forEach(u => {
        const eId = u.employee_id || u.employeeId;
        if (eId) userByEmpId.set(String(eId).toLowerCase(), u);
        if (u.email) userByEmail.set(String(u.email).toLowerCase(), u);
    });

    let countTotal = employees.length;
    let countHasAccount = 0;
    syncCandidatesList = [];

    employees.forEach(emp => {
        const empId = String(emp.employeeId || emp.employee_id || emp.id || '').trim();
        const empEmail = String(emp.email || '').trim().toLowerCase();

        const matchUser = (empId && userByEmpId.get(empId.toLowerCase())) ||
                          (empEmail && userByEmail.get(empEmail)) || null;

        if (matchUser) {
            countHasAccount++;
            emp.hasAccount = true;
            emp.userRole = matchUser.role || 'ASATIDZ';
        } else {
            emp.hasAccount = false;
            const suggestedRole = suggestRoleFromJabatan(emp.jabatan);
            // Siapkan email default jika pegawai belum memiliki email
            const fallbackEmail = empEmail || (emp.nip ? `${emp.nip.replace(/[^a-zA-Z0-9]/g, '')}@asnawiyyah.sch.id` : `${empId.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}@asnawiyyah.sch.id`);

            syncCandidatesList.push({
                employee: emp,
                empId: empId,
                targetRole: suggestedRole,
                email: fallbackEmail,
                hasOriginalEmail: !!empEmail
            });
        }
    });

    const countNeedSync = syncCandidatesList.length;

    if (totalEl) totalEl.innerText = countTotal;
    if (hasAccEl) hasAccEl.innerText = countHasAccount;
    if (needSyncEl) needSyncEl.innerText = countNeedSync;
    if (countEl) countEl.innerText = `${countNeedSync} Pegawai`;

    if (candidateListEl) {
        if (syncCandidatesList.length === 0) {
            candidateListEl.innerHTML = `
                <div class="py-8 text-center space-y-2">
                    <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                    <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Semua Pegawai Sudah Memiliki Akun!</h4>
                    <p class="text-[10px] text-slate-400">Seluruh data pegawai (${countTotal} orang) telah tersinkronisasi 100% dengan akun pengguna aplikasi.</p>
                </div>
            `;
            if (btnExecute) btnExecute.disabled = true;
        } else {
            candidateListEl.innerHTML = syncCandidatesList.map((item, idx) => {
                const emp = item.employee;
                return `
                    <div id="sync-candidate-card-${idx}" class="p-2.5 bg-slate-50 dark:bg-[#1c2836] rounded-xl border border-slate-200/80 dark:border-[#253447] flex items-center justify-between gap-2.5 transition">
                        <div class="min-w-0 flex items-center space-x-2.5">
                            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                                ${(emp.nama || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(emp.nama || '-')}</h5>
                                    <span class="text-[9px] font-semibold text-slate-400">${item.empId}</span>
                                </div>
                                <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <span class="truncate">${escapeHtml(emp.jabatan || 'Pegawai')}</span>
                                    <span>•</span>
                                    <span class="font-mono ${item.hasOriginalEmail ? 'text-slate-600 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}">${escapeHtml(item.email)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Role: ${item.targetRole}
                            </span>
                            <span id="sync-candidate-status-${idx}" class="text-[10px] font-bold text-slate-400">Siap</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

/**
 * Tutup modal wizard sinkronisasi
 */
function closePegawaiAccountSyncWizard() {
    const modal = document.getElementById('modal-pegawai-sync-wizard');
    if (modal) modal.classList.add('hidden');
}

/**
 * Eksekusi Sinkronisasi Masal ke Cloud Database Supabase & Users
 */
async function executePegawaiMassSync() {
    if (!syncCandidatesList || syncCandidatesList.length === 0) {
        if (typeof showToast === 'function') showToast("Semua pegawai sudah memiliki akun login.");
        return;
    }

    const btn = document.getElementById('btn-execute-mass-sync');
    const progressBox = document.getElementById('sync-wizard-progress-box');
    const progressBar = document.getElementById('sync-wizard-progress-bar');
    const progressPct = document.getElementById('sync-wizard-progress-pct');
    const progressLog = document.getElementById('sync-wizard-progress-log');
    const progressTitle = document.getElementById('sync-wizard-progress-title');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Menyinkronkan...</span>`;
    }

    if (progressBox) progressBox.classList.remove('hidden');

    const total = syncCandidatesList.length;
    let successCount = 0;
    let failCount = 0;

    const config = window.ASNAWIYYAH_CONFIG || {};
    const sbUrl = config.supabaseUrl;
    const sbKey = config.supabaseKey;

    for (let i = 0; i < total; i++) {
        const item = syncCandidatesList[i];
        const emp = item.employee;
        const candidateCard = document.getElementById(`sync-candidate-card-${i}`);
        const candidateStatus = document.getElementById(`sync-candidate-status-${i}`);

        const pct = Math.round(((i + 1) / total) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPct) progressPct.innerText = `${pct}%`;
        if (progressLog) progressLog.innerText = `Menyinkronkan (${i + 1}/${total}): ${emp.nama}...`;

        if (candidateStatus) {
            candidateStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-emerald-600"></i>`;
        }

        try {
            const finalUserId = 'USR_' + item.empId.replace(/[^a-zA-Z0-9]/g, '');
            const empStatus = (emp.status || 'ACTIVE').toUpperCase();
            const userStatus = (empStatus === 'INACTIVE' || empStatus === 'NONAKTIF' || empStatus === 'CUTI') ? 'SUSPENDED' : 'ACTIVE';

            const userRow = {
                user_id: finalUserId,
                employee_id: item.empId,
                name: emp.nama || '',
                email: item.email || null,
                phone: emp.telepon || emp.phone || emp.no_hp || null,
                role: item.targetRole || 'ASATIDZ',
                status: userStatus
            };

            // Simpan langsung ke Supabase Cloud DB jika config tersedia
            if (sbUrl && sbKey) {
                const res = await fetch(`${sbUrl}/rest/v1/users`, {
                    method: 'POST',
                    headers: {
                        'apikey': sbKey,
                        'Authorization': `Bearer ${sbKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates,return=representation'
                    },
                    body: JSON.stringify(userRow)
                });
                if (!res.ok) {
                    console.warn('[MASS SYNC ROW WARN]', await res.text());
                }
            } else if (typeof window.syncToSupabaseOnWrite === 'function') {
                await window.syncToSupabaseOnWrite('auth.admin.userSave', { user: userRow });
            }

            // Tandai sukses pada card
            if (candidateStatus) {
                candidateStatus.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fa-solid fa-check mr-1"></i>Tersinkron</span>`;
            }
            if (candidateCard) {
                candidateCard.classList.remove('bg-slate-50', 'dark:bg-[#1c2836]');
                candidateCard.classList.add('bg-emerald-50/60', 'dark:bg-emerald-950/30', 'border-emerald-200');
            }
            successCount++;
        } catch (err) {
            console.error(`[SYNC ERROR ${item.empId}]`, err);
            if (candidateStatus) {
                candidateStatus.innerHTML = `<span class="text-rose-500 font-bold"><i class="fa-solid fa-xmark mr-1"></i>Gagal</span>`;
            }
            failCount++;
        }

        // Sedikit jeda agar UI responsif dan animasi progress bar mulus
        await new Promise(r => setTimeout(r, 60));
    }

    if (progressTitle) {
        progressTitle.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> Sinkronisasi Selesai!`;
    }
    if (progressLog) {
        progressLog.innerText = `Selesai: ${successCount} akun berhasil disinkronkan${failCount > 0 ? `, ${failCount} gagal` : ''}.`;
    }

    if (typeof showToast === 'function') {
        showToast(`🎉 Berhasil menyinkronkan ${successCount} akun pegawai!`);
    }

    // Refresh data di kedua modul (Pegawai & Users)
    try {
        await loadAdminEmployeesData();
        if (typeof window.loadAdminUsersData === 'function') {
            await window.loadAdminUsersData();
        }
    } catch (e) {
        console.warn('[RELOAD AFTER MASS SYNC WARN]', e);
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-check"></i><span>Sinkronisasi Selesai</span>`;
        btn.className = "px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2";
    }
}

// Pasang ke window object
window.loadAdminEmployeesData = loadAdminEmployeesData;
window.filterAdminPegawaiList = filterAdminPegawaiList;
window.renderAdminPegawaiTable = renderAdminPegawaiTable;
window.openAdminEmployeeModal = openAdminEmployeeModal;
window.closeAdminEmployeeModal = closeAdminEmployeeModal;
window.saveAdminEmployee = saveAdminEmployee;
window.deleteAdminEmployee = deleteAdminEmployee;
window.populateTahfidzMuhafizDropdown = populateTahfidzMuhafizDropdown;
window.toggleEmployeeUserSyncUI = toggleEmployeeUserSyncUI;
window.suggestRoleFromJabatan = suggestRoleFromJabatan;
window.openPegawaiAccountSyncWizard = openPegawaiAccountSyncWizard;
window.closePegawaiAccountSyncWizard = closePegawaiAccountSyncWizard;
window.executePegawaiMassSync = executePegawaiMassSync;

/**
 * Terapkan Hak Akses Izin Role pada Antarmuka Pegawai
 */
function applyPegawaiRolePermissions(roleKey = null) {
    const canManage = typeof window.hasPermission === 'function' ? window.hasPermission('pegawai.manage', roleKey) : true;
    
    // Tombol tambah pegawai di header
    const addBtn = document.querySelector('button[onclick*="openAdminEmployeeModal()"]');
    if (addBtn) {
        if (canManage) {
            addBtn.classList.remove('hidden');
            if (addBtn.style.display === 'none') addBtn.style.display = '';
        } else {
            addBtn.classList.add('hidden');
            addBtn.style.display = 'none';
        }
    }

    // Tombol sinkronkan akun login
    const syncBtn = document.querySelector('button[onclick*="openPegawaiAccountSyncWizard"]');
    if (syncBtn) {
        if (canManage) {
            syncBtn.classList.remove('hidden');
            if (syncBtn.style.display === 'none') syncBtn.style.display = '';
        } else {
            syncBtn.classList.add('hidden');
            syncBtn.style.display = 'none';
        }
    }
}
window.applyPegawaiRolePermissions = applyPegawaiRolePermissions;


