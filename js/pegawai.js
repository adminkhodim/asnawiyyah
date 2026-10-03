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

        // Update Counter Statistik
        updatePegawaiStatistics(employees);

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
                    <div class="flex items-center justify-center space-x-1.5">
                        <button type="button" onclick="openAdminEmployeeModal('${escapeHtml(empId)}')" class="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 flex items-center justify-center transition" title="Edit Data">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button type="button" onclick="deleteAdminEmployee('${escapeHtml(empId)}', '${escapeHtml(p.nama)}')" class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 flex items-center justify-center transition" title="Hapus Data">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
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

                    <div class="flex items-center space-x-1.5">
                        <button type="button" onclick="openAdminEmployeeModal('${escapeHtml(empId)}')" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button type="button" onclick="deleteAdminEmployee('${escapeHtml(empId)}', '${escapeHtml(p.nama)}')" class="p-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
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
