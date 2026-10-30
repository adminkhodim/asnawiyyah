/**
 * ============================================================================
 * 04_users.js - Manajemen Pengguna & Otorisasi RBAC
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Akun Pengguna Terpadu (Load, Render, Filter Role/Status, Search)
 *  - Form Akun Pengguna (openAdminUserModal, handleAdminUserSubmit, deleteAdminUser)
 *  - Pemilihan Hubungan Data Pegawai/Guru dengan Akun Pengguna
 *  - Modal Pemantau Pengguna Online (Realtime Heartbeat Monitor & Device Info)
 * ============================================================================
 */

        // =====================================================================
        // MANAJEMEN PENGGUNA TERPADU (USERS MASTER CONTROLLER)
        // =====================================================================
        let adminUsersList = [];
        let adminUsersFilterRole = 'ALL';
        let adminUsersSearchQuery = '';

        /**
         * Helper sanitasi teks aman HTML
         */
        function escapeUserHtml(str) {
            if (typeof escapeHtml === 'function') return escapeHtml(str);
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        /**
         * Memuat data seluruh pengguna dari sheet Users via API
         */
        async function loadAdminUsersData() {
            const loadingEl = document.getElementById('admin-users-loading');
            const emptyEl = document.getElementById('admin-users-empty');
            const tbody = document.getElementById('admin-users-table-body');

            if (loadingEl) loadingEl.classList.remove('hidden');
            if (emptyEl) emptyEl.classList.add('hidden');
            if (tbody) tbody.innerHTML = '';

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || localStorage.getItem("asnawiyyah_admin_token") || "";
                
                let response = null;
                if (typeof fetchFromSupabase === 'function') {
                    try {
                        response = await fetchFromSupabase('auth.admin.userList');
                    } catch (e) {
                        console.warn('[SUPABASE FAILOVER] loadAdminUsersData:', e);
                    }
                }
                if (!response || (!response.success && response.status !== 'success')) {
                    if (typeof authApiPost === 'function') {
                        response = await authApiPost('auth.admin.userList', { token });
                    } else if (typeof apiPost === 'function') {
                        response = await apiPost('auth.admin.userList', { token });
                    }
                }

                if (response && (response.success || response.status === 'success')) {
                    adminUsersList = response.users || [];

                    // Update ringkasan metric card
                    const summary = response.summary || {};
                    const totalCount = summary.total !== undefined ? summary.total : adminUsersList.length;
                    const waliCount = summary.wali !== undefined ? summary.wali : adminUsersList.filter(u => u.role === 'WALI_SANTRI').length;
                    const asatidzCount = summary.asatidz !== undefined ? summary.asatidz : adminUsersList.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR').length;
                    const pengurusCount = summary.pengurus !== undefined ? summary.pengurus : adminUsersList.filter(u => u.role === 'PENGURUS').length;
                    const bendaharaCount = summary.bendahara !== undefined ? summary.bendahara : adminUsersList.filter(u => u.role === 'BENDAHARA').length;
                    const pengasuhCount = summary.pengasuh !== undefined ? summary.pengasuh : adminUsersList.filter(u => u.role === 'PENGASUH').length;
                    const adminCount = summary.admin !== undefined ? summary.admin : adminUsersList.filter(u => u.role === 'ADMIN').length;
                    const superAdminCount = summary.superAdmin !== undefined ? summary.superAdmin : adminUsersList.filter(u => u.role === 'SUPER_ADMIN').length;

                    const totalEl = document.getElementById('user-count-total');
                    const waliEl = document.getElementById('user-count-wali');
                    const pengasuhEl = document.getElementById('user-count-pengasuh');
                    const adminEl = document.getElementById('user-count-admin');

                    if (totalEl) totalEl.innerText = totalCount;
                    if (waliEl) waliEl.innerText = waliCount;
                    if (pengasuhEl) pengasuhEl.innerText = pengasuhCount;
                    if (adminEl) adminEl.innerText = adminCount + superAdminCount;

                    // Update Hub Badge
                    const hubBadge = document.getElementById('admin-hub-users-count');
                    if (hubBadge) hubBadge.innerText = `${totalCount} Pengguna`;

                    // Update Tab Counts
                    const tabAll = document.getElementById('user-tab-count-all');
                    const tabWali = document.getElementById('user-tab-count-wali');
                    const tabAsatidz = document.getElementById('user-tab-count-asatidz');
                    const tabPengurus = document.getElementById('user-tab-count-pengurus');
                    const tabBendahara = document.getElementById('user-tab-count-bendahara');
                    const tabPengasuh = document.getElementById('user-tab-count-pengasuh');
                    const tabAdmin = document.getElementById('user-tab-count-admin');

                    if (tabAll) tabAll.innerText = totalCount;
                    if (tabWali) tabWali.innerText = waliCount;
                    if (tabAsatidz) tabAsatidz.innerText = asatidzCount;
                    if (tabPengurus) tabPengurus.innerText = pengurusCount;
                    if (tabBendahara) tabBendahara.innerText = bendaharaCount;
                    if (tabPengasuh) tabPengasuh.innerText = pengasuhCount;
                    if (tabAdmin) tabAdmin.innerText = adminCount + superAdminCount;

                    // Update Tab Online & KPI Super Admin
                    let activeUserEmail = '';
                    let activeUserId = '';
                    try {
                        const cur = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
                        if (cur) {
                            activeUserEmail = (cur.email || '').toLowerCase();
                            activeUserId = cur.userId || cur.user_id || cur.id || '';
                        }
                    } catch (e) {}

                    const onlineCount = adminUsersList.filter(u => {
                        const st = typeof calculateUserOnlineStatus === 'function' ? calculateUserOnlineStatus(u.last_seen_at) : { isOnline: false };
                        const isSelf = (activeUserEmail && u.email && u.email.toLowerCase() === activeUserEmail) || 
                                       (activeUserId && (u.user_id === activeUserId || u.userId === activeUserId));
                        return st.isOnline || isSelf;
                    }).length;
                    const tabOnline = document.getElementById('user-tab-count-online');
                    if (tabOnline) tabOnline.innerText = onlineCount;

                    const kpiSessionsEl = document.getElementById('kpi-val-sa_sessions');
                    if (kpiSessionsEl) {
                        kpiSessionsEl.innerText = `${Math.max(1, onlineCount)} Pengguna Online`;
                    }

                    renderAdminUsersTable();
                } else {
                    const msg = (response && response.message) || 'Gagal memuat data pengguna.';
                    if (typeof showToast === 'function') showToast('⚠️ ' + msg);
                    if (emptyEl) emptyEl.classList.remove('hidden');
                }
            } catch (err) {
                console.error('[LOAD USERS ERROR]', err);
                if (typeof showToast === 'function') showToast('❌ Gagal memuat pengguna: ' + err.message);
                if (emptyEl) emptyEl.classList.remove('hidden');
            } finally {
                if (loadingEl) loadingEl.classList.add('hidden');
            }
        }

        /**
         * Render tabel pengguna dengan filter role dan pencarian
         */
        function renderAdminUsersTable() {
            const tbody = document.getElementById('admin-users-table-body');
            const emptyEl = document.getElementById('admin-users-empty');
            if (!tbody) return;

            let filtered = adminUsersList.slice();

            // Filter Peran & Status Online
            if (adminUsersFilterRole && adminUsersFilterRole !== 'ALL') {
                if (adminUsersFilterRole === 'ONLINE') {
                    let activeUserEmail = '';
                    let activeUserId = '';
                    try {
                        const cur = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
                        if (cur) {
                            activeUserEmail = (cur.email || '').toLowerCase();
                            activeUserId = cur.userId || cur.user_id || cur.id || '';
                        }
                    } catch (e) {}

                    filtered = filtered.filter(u => {
                        const presence = typeof calculateUserOnlineStatus === 'function' 
                            ? calculateUserOnlineStatus(u.last_seen_at) 
                            : { isOnline: false };
                        const isSelf = (activeUserEmail && u.email && u.email.toLowerCase() === activeUserEmail) || 
                                       (activeUserId && (u.user_id === activeUserId || u.userId === activeUserId));
                        return presence.isOnline || isSelf;
                    });
                } else if (adminUsersFilterRole === 'ASATIDZ' || adminUsersFilterRole === 'PEGAWAI') {
                    filtered = filtered.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR');
                } else if (adminUsersFilterRole === 'ADMIN') {
                    filtered = filtered.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
                } else {
                    filtered = filtered.filter(u => u.role === adminUsersFilterRole);
                }
            }

            // Filter Pencarian
            if (adminUsersSearchQuery) {
                const q = adminUsersSearchQuery.toLowerCase();
                filtered = filtered.filter(u => {
                    const matchName = String(u.name || '').toLowerCase().includes(q);
                    const matchEmail = String(u.email || '').toLowerCase().includes(q);
                    const matchPhone = String(u.phone || '').includes(q);
                    const matchId = String(u.userId || '').toLowerCase().includes(q);
                    const matchStudent = (u.linkedStudents || []).some(s => 
                        String(s.name || '').toLowerCase().includes(q) || 
                        String(s.nis || '').includes(q)
                    );
                    return matchName || matchEmail || matchPhone || matchId || matchStudent;
                });
            }

            if (filtered.length === 0) {
                tbody.innerHTML = '';
                if (emptyEl) emptyEl.classList.remove('hidden');
                return;
            }

            if (emptyEl) emptyEl.classList.add('hidden');

            const canManageUsers = typeof window.hasPermission === 'function' ? window.hasPermission('users.manage') : true;
            const currentActorRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                     sessionStorage.getItem('ASN_ADMIN_ROLE') || 'ADMIN';
            const isSuperAdminActor = currentActorRole === 'SUPER_ADMIN';

            tbody.innerHTML = filtered.map(user => {
                const safeUserId = String(user.userId || user.identityId || '').replace(/'/g, "\\'");
                const safeName = escapeUserHtml(user.name || 'Pengguna');
                const safeEmail = escapeUserHtml(user.email || '-');
                const safePhone = escapeUserHtml(user.phone || '-');
                const photoUrl = user.photoUrl || '';
                const role = String(user.role || 'WALI_SANTRI').toUpperCase();
                const status = String(user.status || 'ACTIVE').toUpperCase();
                const isActive = status === 'ACTIVE';

                // Badge Role Styling
                let roleBadge = '';
                if (role === 'WALI_SANTRI') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"><i class="fa-solid fa-user-group text-[9px] mr-1"></i>Wali Santri</span>`;
                } else if (role === 'PENGASUH') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"><i class="fa-solid fa-hands-praying text-[9px] mr-1"></i>Pengasuh</span>`;
                } else if (role === 'ASATIDZ' || role === 'PEGAWAI' || role === 'EDITOR') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40"><i class="fa-solid fa-chalkboard-user text-[9px] mr-1"></i>Asatidz</span>`;
                } else if (role === 'PENGURUS') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40"><i class="fa-solid fa-clipboard-user text-[9px] mr-1"></i>Pengurus</span>`;
                } else if (role === 'BENDAHARA') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"><i class="fa-solid fa-wallet text-[9px] mr-1"></i>Bendahara</span>`;
                } else if (role === 'SUPER_ADMIN') {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"><i class="fa-solid fa-crown text-[9px] mr-1"></i>Super Admin</span>`;
                } else {
                    roleBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40"><i class="fa-solid fa-shield-halved text-[9px] mr-1"></i>Administrator</span>`;
                }

                // Avatar / Foto Profil
                const avatarHtml = photoUrl
                    ? `<img src="${photoUrl}" alt="${safeName}" class="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-[#253447] shadow-sm shrink-0" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=059669&color=fff'">`
                    : `<div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">${(user.name || 'U').charAt(0).toUpperCase()}</div>`;

                // Santri / Pegawai Terhubung
                let linkedHtml = '';
                if (role === 'WALI_SANTRI') {
                    const students = user.linkedStudents || [];
                    if (students.length > 0) {
                        linkedHtml = `<div class="flex flex-wrap gap-1">${students.map(s => `
                            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#1c2836] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253447]" title="NIS: ${s.nis || '-'} (${s.relationship || 'Wali'})">
                                <i class="fa-solid fa-child-reaching text-[9px] text-cyan-600 mr-1"></i>${escapeUserHtml(s.name || 'Santri')}
                                ${s.nis ? `<span class="ml-1 text-[9px] text-slate-400 font-mono">#${s.nis}</span>` : ''}
                            </span>
                        `).join('')}</div>`;
                    } else {
                        linkedHtml = `<span class="text-[10px] text-slate-400 italic">Belum terhubung</span>`;
                    }
                } else if (user.employeeId || user.employee_id) {
                    const empId = user.employeeId || user.employee_id;
                    linkedHtml = `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40" title="Tertaut ke Data Pegawai: ${empId}">
                        <i class="fa-solid fa-user-tie text-[9px] text-indigo-600 mr-1"></i>Pegawai: ${escapeUserHtml(empId)}
                    </span>`;
                } else {
                    linkedHtml = `<span class="text-[10px] text-slate-400">-</span>`;
                }

                // Status Badge
                const statusBadge = isActive
                    ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>Aktif</span>`
                    : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>Nonaktif</span>`;

                // WhatsApp link
                const cleanPhone = String(user.phone || '').replace(/[^0-9]/g, '');
                const waLink = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone) : '';
                const phoneHtml = user.phone ? `
                    <div class="flex items-center space-x-1">
                        <span class="font-mono text-slate-600 dark:text-slate-300 text-xs">${safePhone}</span>
                        ${waLink ? `<a href="https://wa.me/${waLink}" target="_blank" rel="noopener" class="text-emerald-600 hover:text-emerald-700 ml-1" title="Chat WhatsApp"><i class="fa-brands fa-whatsapp text-xs"></i></a>` : ''}
                    </div>
                ` : `<span class="text-slate-400 text-[10px]">-</span>`;

                // Status Kehadiran Online
                let isRowUserSelf = false;
                try {
                    const cur = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
                    if (cur) {
                        const curEmail = (cur.email || '').toLowerCase();
                        const curId = cur.userId || cur.user_id || cur.id || '';
                        if ((curEmail && user.email && user.email.toLowerCase() === curEmail) || 
                            (curId && (user.user_id === curId || user.userId === curId))) {
                            isRowUserSelf = true;
                        }
                    }
                } catch (e) {}

                let presence = typeof calculateUserOnlineStatus === 'function' 
                    ? calculateUserOnlineStatus(user.last_seen_at) 
                    : { status: 'offline', label: 'Offline', color: 'slate', text: 'Offline', isOnline: false };

                if (isRowUserSelf && !presence.isOnline) {
                    presence = { status: 'online', label: 'Online', color: 'emerald', text: 'Online sekarang (Sesi Anda)', isOnline: true };
                }

                const onlineIndicator = presence.isOnline 
                    ? `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#15202d] animate-pulse shrink-0 inline-block" title="Online Sekarang (${user.device_info || 'Perangkat'})"></span>`
                    : (presence.status === 'idle'
                        ? `<span class="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#15202d] shrink-0 inline-block" title="Idle (${presence.text})"></span>`
                        : `<span class="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-2 ring-white dark:ring-[#15202d] shrink-0 inline-block" title="${presence.text}"></span>`);

                const presenceBadge = presence.isOnline 
                    ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Online • ${escapeUserHtml(user.device_info || 'Aktif')}</span>`
                    : `<span class="text-[9px] text-slate-400 font-medium">${presence.text}</span>`;

                return `
                    <tr class="hover:bg-slate-50/70 dark:hover:bg-[#1c2836]/40 transition">
                        <td class="p-3.5">
                            <div class="flex items-center space-x-3">
                                <div class="relative shrink-0">
                                    ${avatarHtml}
                                    <span class="absolute -bottom-0.5 -right-0.5">${onlineIndicator}</span>
                                </div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-1.5">
                                        <h4 class="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight truncate">${safeName}</h4>
                                    </div>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-[10px] text-slate-400 font-mono truncate">${safeEmail}</span>
                                        <span class="text-slate-300 dark:text-slate-700">•</span>
                                        ${presenceBadge}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="p-3.5 whitespace-nowrap">${phoneHtml}</td>
                        <td class="p-3.5 whitespace-nowrap">${roleBadge}</td>
                        <td class="p-3.5 max-w-xs">${linkedHtml}</td>
                        <td class="p-3.5 text-center whitespace-nowrap">${statusBadge}</td>
                        <td class="p-3.5 text-right whitespace-nowrap">
                            ${canManageUsers ? `
                            <div class="flex items-center justify-end space-x-1.5">
                                <button type="button" onclick="openAdminUserModal('${safeUserId}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition active:scale-95" title="Edit Akun">
                                    <i class="fa-solid fa-pen-to-square text-[11px] mr-1"></i>Edit
                                </button>
                                <button type="button" onclick="toggleAdminUserStatus('${safeUserId}', '${status}')" class="px-2 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}" title="${isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}">
                                    <i class="fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'} text-[11px]"></i>
                                </button>
                                ${isSuperAdminActor && !isRowUserSelf ? `
                                <button type="button" onclick="deleteAdminUser('${safeUserId}', '${safeName}', '${safeEmail}')" class="px-2 py-1 rounded-lg text-xs font-semibold transition active:scale-95 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40" title="Hapus Akun Pengguna Permanen (Khusus Super Admin)">
                                    <i class="fa-solid fa-trash-can text-[11px]"></i>
                                </button>
                                ` : ''}
                            </div>
                            ` : `<span class="text-xs text-slate-400 italic">Lihat Saja</span>`}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        /**
         * Filter peran pengguna (Semua, Online, Wali, Pengasuh, Admin)
         */
        function filterAdminUsers(role) {
            adminUsersFilterRole = role;
            document.querySelectorAll('.admin-user-tab').forEach(btn => {
                if (btn.dataset.roleFilter === role) {
                    btn.classList.add('active', 'bg-emerald-600', 'text-white');
                    btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'text-emerald-700', 'dark:text-emerald-300');
                } else {
                    btn.classList.remove('active', 'bg-emerald-600', 'text-white');
                    if (btn.dataset.roleFilter === 'ONLINE') {
                        btn.classList.add('text-emerald-700', 'dark:text-emerald-300');
                    } else {
                        btn.classList.add('text-slate-600', 'dark:text-slate-300');
                    }
                }
            });
            renderAdminUsersTable();
        }

        /**
         * Live search filter pengguna
         */
        function handleAdminUsersSearch(query) {
            adminUsersSearchQuery = String(query || '').trim();
            renderAdminUsersTable();
        }

        /**
         * Buka modal form tambah / edit pengguna
         */
        function openAdminUserModal(userId) {
            if (typeof window.hasPermission === 'function' && !window.hasPermission('users.manage')) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk mengelola data pengguna.");
                }
                return;
            }

            const modal = document.getElementById('modal-admin-user-form');
            const titleEl = document.getElementById('modal-admin-user-title');
            const form = document.getElementById('adminUserForm');
            if (!modal) return;

            if (form) form.reset();

            const idInput = document.getElementById('admin-user-form-id');
            const roleSelect = document.getElementById('admin-user-form-role');
            const nameInput = document.getElementById('admin-user-form-name');
            const emailInput = document.getElementById('admin-user-form-email');
            const phoneInput = document.getElementById('admin-user-form-phone');
            const statusSelect = document.getElementById('admin-user-form-status');
            const studentNisInput = document.getElementById('admin-user-form-student-nis');
            const relationshipSelect = document.getElementById('admin-user-form-relationship');

            const currentActorRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                sessionStorage.getItem('ASN_ADMIN_ROLE') || 'ADMIN';
            const isSuperAdminActor = currentActorRole === 'SUPER_ADMIN';

            // Kelola ketersediaan opsi SUPER_ADMIN di dropdown modal form
            if (roleSelect) {
                const superAdminOpt = roleSelect.querySelector('option[value="SUPER_ADMIN"]');
                if (superAdminOpt) {
                    superAdminOpt.disabled = !isSuperAdminActor;
                    if (!isSuperAdminActor && roleSelect.value === 'SUPER_ADMIN') {
                        roleSelect.value = 'ADMIN';
                    }
                }
            }

            if (userId) {
                const user = adminUsersList.find(u => String(u.userId || u.identityId || '') === String(userId));
                if (user) {
                    if (titleEl) titleEl.innerText = 'Edit Data Pengguna';
                    if (idInput) idInput.value = user.userId || user.identityId || '';
                    if (roleSelect) roleSelect.value = user.role || 'WALI_SANTRI';
                    if (nameInput) nameInput.value = user.name || '';
                    if (emailInput) {
                        emailInput.value = user.email || '';
                    }
                    if (phoneInput) phoneInput.value = user.phone || '';
                    if (statusSelect) statusSelect.value = user.status || 'ACTIVE';

                    // Linked student info jika ada
                    const linked = (user.linkedStudents && user.linkedStudents[0]) || null;
                    if (studentNisInput) studentNisInput.value = linked ? (linked.nis || '') : '';
                    if (relationshipSelect) relationshipSelect.value = linked ? (linked.relationship || 'GUARDIAN') : 'GUARDIAN';

                    const linkedEmpId = user.employeeId || user.employee_id || '';
                    populatePegawaiDropdownInUserModal(linkedEmpId);
                    handleUserFormRoleChange(user.role || 'WALI_SANTRI');
                }
            } else {
                if (titleEl) titleEl.innerText = 'Tambah Pengguna Baru';
                if (idInput) idInput.value = '';
                if (roleSelect) roleSelect.value = 'WALI_SANTRI';
                if (statusSelect) statusSelect.value = 'ACTIVE';
                populatePegawaiDropdownInUserModal('');
                handleUserFormRoleChange('WALI_SANTRI');
            }

            modal.classList.remove('hidden');
        }

        /**
         * Tutup modal form pengguna
         */
        function closeAdminUserModal() {
            const modal = document.getElementById('modal-admin-user-form');
            if (modal) modal.classList.add('hidden');
        }

        /**
         * Mengisi pilihan dropdown pegawai di modal Tambah/Edit Pengguna
         */
        async function populatePegawaiDropdownInUserModal(selectedId = '') {
            const selectEl = document.getElementById('admin-user-form-employee-id');
            const badgeEl = document.getElementById('badge-admin-user-pegawai-link');
            if (!selectEl) return;

            let employees = (window.ASNPegawai && Array.isArray(window.ASNPegawai.list)) ? window.ASNPegawai.list : [];
            if (employees.length === 0 && typeof window.loadAdminEmployeesData === 'function') {
                try {
                    await window.loadAdminEmployeesData();
                    employees = (window.ASNPegawai && Array.isArray(window.ASNPegawai.list)) ? window.ASNPegawai.list : [];
                } catch (e) {
                    console.warn('[LOAD EMPLOYEES FOR USER MODAL WARN]', e);
                }
            }

            let optHtml = '<option value="">-- Tidak Ditautkan / Pilih Pegawai --</option>';
            let foundMatch = null;

            employees.forEach(p => {
                const empId = p.id || p.employee_id || '';
                const isSelected = selectedId && (String(selectedId) === String(empId));
                if (isSelected) foundMatch = p;
                const statusTag = (p.status && p.status !== 'ACTIVE' && p.status !== 'AKTIF') ? ` [${p.status}]` : '';
                optHtml += `<option value="${escapeUserHtml(empId)}" ${isSelected ? 'selected' : ''}>${escapeUserHtml(p.nama)} (${escapeUserHtml(p.jabatan || 'Pegawai')}) - ${escapeUserHtml(empId)}${statusTag}</option>`;
            });

            selectEl.innerHTML = optHtml;
            if (selectedId) selectEl.value = selectedId;

            if (badgeEl) {
                if (foundMatch) {
                    badgeEl.innerText = `Terhubung: ${foundMatch.nama}`;
                    badgeEl.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800';
                } else if (selectedId) {
                    badgeEl.innerText = `ID: ${selectedId}`;
                    badgeEl.className = 'text-[10px] font-bold text-indigo-600 dark:text-indigo-400';
                } else {
                    badgeEl.innerText = 'Pilih Pegawai';
                    badgeEl.className = 'text-[10px] font-bold text-slate-400 dark:text-slate-500';
                }
            }
        }

        /**
         * Auto-populate form saat admin memilih pegawai dari dropdown
         */
        function handleSelectPegawaiForUser(employeeId) {
            const badgeEl = document.getElementById('badge-admin-user-pegawai-link');
            const nameInput = document.getElementById('admin-user-form-name');
            const emailInput = document.getElementById('admin-user-form-email');
            const phoneInput = document.getElementById('admin-user-form-phone');
            const roleSelect = document.getElementById('admin-user-form-role');

            if (!employeeId) {
                if (badgeEl) {
                    badgeEl.innerText = 'Pilih Pegawai';
                    badgeEl.className = 'text-[10px] font-bold text-slate-400 dark:text-slate-500';
                }
                return;
            }

            const employees = (window.ASNPegawai && Array.isArray(window.ASNPegawai.list)) ? window.ASNPegawai.list : [];
            const emp = employees.find(p => String(p.id || p.employee_id) === String(employeeId));

            if (emp) {
                if (badgeEl) {
                    badgeEl.innerText = `Terhubung: ${emp.nama}`;
                    badgeEl.className = 'text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800';
                }

                if (nameInput) {
                    if (!nameInput.value || nameInput.value.trim() === '') {
                        nameInput.value = emp.nama || '';
                    }
                }
                if (emailInput && emp.email && (!emailInput.value || emailInput.value.trim() === '')) {
                    emailInput.value = emp.email;
                }
                if (phoneInput && (!phoneInput.value || phoneInput.value.trim() === '')) {
                    const phoneVal = emp.telepon || emp.no_hp || emp.phone || '';
                    if (phoneVal) phoneInput.value = phoneVal;
                }
                if (roleSelect && typeof window.suggestRoleFromJabatan === 'function') {
                    const suggested = window.suggestRoleFromJabatan(emp.jabatan);
                    if (suggested && (roleSelect.value === 'WALI_SANTRI' || !roleSelect.value)) {
                        roleSelect.value = suggested;
                        handleUserFormRoleChange(suggested);
                    }
                }
            }
        }

        /**
         * Penyesuaian form saat pilihan role berubah (tampilkan/sembunyikan input santri / pegawai)
         */
        function handleUserFormRoleChange(role) {
            const waliExtra = document.getElementById('admin-user-wali-extra');
            const pegawaiExtra = document.getElementById('admin-user-pegawai-extra');

            const isEmployeeRole = ['ASATIDZ', 'PENGASUH', 'BENDAHARA', 'PENGURUS', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(role);

            if (role === 'WALI_SANTRI') {
                if (waliExtra) waliExtra.classList.remove('hidden');
                if (pegawaiExtra) pegawaiExtra.classList.add('hidden');
            } else if (isEmployeeRole) {
                if (waliExtra) waliExtra.classList.add('hidden');
                if (pegawaiExtra) {
                    pegawaiExtra.classList.remove('hidden');
                    const sel = document.getElementById('admin-user-form-employee-id');
                    if (sel && sel.options.length <= 1) {
                        populatePegawaiDropdownInUserModal(sel.value || '');
                    }
                }
            } else {
                if (waliExtra) waliExtra.classList.add('hidden');
                if (pegawaiExtra) pegawaiExtra.classList.add('hidden');
            }
        }

        /**
         * Submit form simpan pengguna ke backend
         */
        async function handleAdminUserSubmit(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-admin-user-submit');
            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Menyimpan...</span>';
            }

            const id = (document.getElementById('admin-user-form-id')?.value || '').trim();
            const role = (document.getElementById('admin-user-form-role')?.value || 'WALI_SANTRI').trim();
            const name = (document.getElementById('admin-user-form-name')?.value || '').trim();
            const email = (document.getElementById('admin-user-form-email')?.value || '').trim().toLowerCase();
            const phone = (document.getElementById('admin-user-form-phone')?.value || '').trim();
            const status = (document.getElementById('admin-user-form-status')?.value || 'ACTIVE').trim();
            const studentNis = (document.getElementById('admin-user-form-student-nis')?.value || '').trim();
            const relationship = (document.getElementById('admin-user-form-relationship')?.value || 'GUARDIAN').trim();
            const employeeId = (document.getElementById('admin-user-form-employee-id')?.value || '').trim();

            const payload = {
                userId: id,
                role: role,
                name: name,
                email: email,
                phone: phone,
                status: status,
                studentNis: studentNis,
                relationship: relationship,
                employeeId: employeeId,
                employee_id: employeeId
            };

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || localStorage.getItem("asnawiyyah_admin_token") || "";
                let response = null;

                if (typeof authApiPost === 'function') {
                    response = await authApiPost('auth.admin.userSave', { token, user: payload });
                } else if (typeof apiPost === 'function') {
                    response = await apiPost('auth.admin.userSave', { token, user: payload });
                }

                if (response && (response.success || response.status === 'success')) {
                    if (typeof showToast === 'function') {
                        showToast(response.message || 'Data pengguna berhasil disimpan!');
                    }
                    // Dual-Write ke Supabase Cloud DB (<50ms)
                    const finalUserId = (response && (response.userId || response.user_id)) || payload.userId;
                    if (typeof window.syncToSupabaseOnWrite === 'function') {
                        await window.syncToSupabaseOnWrite('auth.admin.userSave', { user: { ...payload, userId: finalUserId } }, response);
                    }
                    closeAdminUserModal();
                    await loadAdminUsersData();
                    if (typeof window.loadAdminEmployeesData === 'function') {
                        window.loadAdminEmployeesData().catch(err => console.warn('[REFRESH EMPLOYEES WARN]', err));
                    }
                } else {
                    const msg = (response && response.message) || 'Gagal menyimpan data pengguna.';
                    if (typeof showToast === 'function') showToast('❌ ' + msg);
                }
            } catch (err) {
                console.error('[SAVE USER ERROR]', err);
                if (typeof showToast === 'function') showToast('❌ ' + err.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        }

        /**
         * Toggle status pengguna (ACTIVE <-> SUSPENDED)
         */
        async function toggleAdminUserStatus(userId, currentStatus) {
            if (!userId) return;

            if (typeof window.hasPermission === 'function' && !window.hasPermission('users.manage')) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses ditolak: Anda tidak memiliki izin untuk mengubah status pengguna.");
                }
                return;
            }

            const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
            const actionText = newStatus === 'ACTIVE' ? 'mengaktifkan' : 'menonaktifkan';

            if (!confirm(`Apakah Anda yakin ingin ${actionText} akun pengguna ini?`)) {
                return;
            }

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || localStorage.getItem("asnawiyyah_admin_token") || "";
                let response = null;

                const payload = {
                    userId: userId,
                    status: newStatus
                };

                if (typeof authApiPost === 'function') {
                    response = await authApiPost('auth.admin.userToggleStatus', { token, ...payload });
                } else if (typeof apiPost === 'function') {
                    response = await apiPost('auth.admin.userToggleStatus', { token, ...payload });
                }

                if (response && (response.success || response.status === 'success')) {
                    if (typeof showToast === 'function') {
                        showToast(response.message || `Status akun berhasil diubah menjadi ${newStatus}!`);
                    }
                    // Dual-Write status ke Supabase Cloud DB
                    if (typeof window.syncToSupabaseOnWrite === 'function') {
                        await window.syncToSupabaseOnWrite('auth.admin.userToggleStatus', payload, response);
                    }
                    await loadAdminUsersData();
                } else {
                    const msg = (response && response.message) || 'Gagal mengubah status akun.';
                    if (typeof showToast === 'function') showToast('❌ ' + msg);
                }
            } catch (err) {
                console.error('[TOGGLE STATUS ERROR]', err);
                if (typeof showToast === 'function') showToast('❌ ' + err.message);
            }
        }

        /**
         * Hapus akun pengguna secara permanen (Khusus Super Administrator)
         */
        async function deleteAdminUser(userId, userName, userEmail) {
            if (!userId) return;

            const currentActorRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                     sessionStorage.getItem('ASN_ADMIN_ROLE') || 'ADMIN';
            const isSuperAdminActor = currentActorRole === 'SUPER_ADMIN';

            if (!isSuperAdminActor) {
                if (typeof showToast === 'function') {
                    showToast("⛔ Akses Ditolak: Hanya Super Administrator yang berhak menghapus akun pengguna secara permanen.");
                }
                return;
            }

            // Proteksi akun diri sendiri (Self-deletion prevention)
            let isRowUserSelf = false;
            try {
                const cur = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) || null;
                if (cur) {
                    const curEmail = (cur.email || '').toLowerCase();
                    const curId = cur.userId || cur.user_id || cur.id || '';
                    if ((curEmail && userEmail && userEmail.toLowerCase() === curEmail) || 
                        (curId && (userId === curId))) {
                        isRowUserSelf = true;
                    }
                }
            } catch (e) {}

            if (isRowUserSelf) {
                if (typeof showToast === 'function') {
                    showToast("⚠️ Ditolak: Anda tidak dapat menghapus akun Super Admin Anda sendiri yang sedang aktif!");
                }
                return;
            }

            const targetName = userName || userId;
            const targetEmail = userEmail || '-';

            const confirmMsg = `⚠️ PERINGATAN SUPER ADMINISTRATOR:\n\nApakah Anda yakin ingin MENGHAPUS PERMANEN akun pengguna berikut?\n\n• Nama: ${targetName}\n• Email: ${targetEmail}\n• ID: ${userId}\n\nAkun akan dibersihkan dari Google Sheets dan Cloud Database Supabase. Tindakan ini TIDAK DAPAT DIBATALKAN.\n\nLanjutkan penghapusan?`;
            
            if (!confirm(confirmMsg)) {
                return;
            }

            if (typeof showToast === 'function') {
                showToast(`⏳ Sedang menghapus akun "${targetName}"...`);
            }

            try {
                const token = (typeof getAdminSessionToken === 'function' ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || localStorage.getItem("asnawiyyah_admin_token") || "";
                let response = null;

                const payload = {
                    userId: userId,
                    email: userEmail
                };

                if (typeof authApiPost === 'function') {
                    response = await authApiPost('auth.admin.userDelete', { token, ...payload });
                } else if (typeof apiPost === 'function') {
                    response = await apiPost('auth.admin.userDelete', { token, ...payload });
                }

                // Dual-Delete ke Supabase Cloud DB
                if (typeof window.syncToSupabaseOnWrite === 'function') {
                    await window.syncToSupabaseOnWrite('auth.admin.userDelete', payload, response).catch(e => console.warn('[SUPABASE DUAL-DELETE WARN]', e));
                }

                if (response && (response.success || response.status === 'success')) {
                    if (typeof showToast === 'function') {
                        showToast(response.message || `✅ Akun "${targetName}" berhasil dihapus permanen!`);
                    }
                } else {
                    const msg = (response && response.message) || `Akun ${targetName} telah dibersihkan.`;
                    if (typeof showToast === 'function') showToast(`ℹ️ ${msg}`);
                }

                // Refresh tabel pengguna seketika
                await loadAdminUsersData();
            } catch (err) {
                console.error('[DELETE USER ERROR]', err);
                if (typeof showToast === 'function') showToast('❌ Gagal menghapus akun: ' + err.message);
                await loadAdminUsersData();
            }
        }

        // ==================== ONLINE USERS MODAL HANDLER ====================
        let onlineUsersModalQuery = '';

        function openOnlineUsersModal() {
            const modal = document.getElementById('modal-online-users');
            if (!modal) return;
            modal.classList.remove('hidden');
            refreshOnlineUsersModal();
        }

        function closeOnlineUsersModal() {
            const modal = document.getElementById('modal-online-users');
            if (!modal) return;
            modal.classList.add('hidden');
        }

        async function refreshOnlineUsersModal() {
            const container = document.getElementById('modal-online-users-container');
            if (container) {
                container.innerHTML = `
                    <div class="py-8 text-center text-xs text-slate-400 space-y-2">
                        <i class="fa-solid fa-spinner fa-spin text-xl text-emerald-600"></i>
                        <p>Memuat status real-time pengguna...</p>
                    </div>
                `;
            }

            try {
                let users = [];
                if (typeof fetchFromSupabase === 'function') {
                    const res = await fetchFromSupabase('auth.admin.userList');
                    if (res && res.users) users = res.users;
                }
                if (users.length === 0 && typeof adminUsersList !== 'undefined' && adminUsersList.length > 0) {
                    users = adminUsersList;
                }

                renderOnlineUsersModalList(users, onlineUsersModalQuery);
            } catch (e) {
                if (container) {
                    container.innerHTML = `<div class="p-6 text-center text-xs text-rose-500">Gagal memuat status online: ${e.message}</div>`;
                }
            }
        }

        function filterOnlineUsersModalList(query) {
            onlineUsersModalQuery = (query || '').toLowerCase().trim();
            const users = (typeof adminUsersList !== 'undefined' && Array.isArray(adminUsersList) && adminUsersList.length > 0)
                ? adminUsersList
                : [];
            renderOnlineUsersModalList(users, onlineUsersModalQuery);
        }

        function renderOnlineUsersModalList(users, query = '') {
            const container = document.getElementById('modal-online-users-container');
            const badge = document.getElementById('modal-online-count-badge');
            if (!container) return;

            const onlineUsers = users.filter(u => {
                const presence = typeof calculateUserOnlineStatus === 'function' 
                    ? calculateUserOnlineStatus(u.last_seen_at) 
                    : { isOnline: false };
                return presence.isOnline;
            });

            if (badge) badge.innerText = `${onlineUsers.length} Online`;

            let displayList = onlineUsers;
            if (query) {
                displayList = onlineUsers.filter(u => 
                    String(u.name || '').toLowerCase().includes(query) ||
                    String(u.email || '').toLowerCase().includes(query) ||
                    String(u.role || '').toLowerCase().includes(query) ||
                    String(u.device_info || '').toLowerCase().includes(query)
                );
            }

            if (displayList.length === 0) {
                container.innerHTML = `
                    <div class="py-12 text-center space-y-2">
                        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1c2836] text-slate-400 flex items-center justify-center mx-auto text-lg">
                            <i class="fa-solid fa-user-clock"></i>
                        </div>
                        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">Tidak Ada Pengguna Online</h4>
                        <p class="text-[10px] text-slate-400 max-w-xs mx-auto">
                            ${query ? 'Tidak ada pengguna online yang cocok dengan pencarian.' : 'Saat ini belum ada sesi pengguna lain yang sedang aktif.'}
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = displayList.map(u => {
                const presence = typeof calculateUserOnlineStatus === 'function' ? calculateUserOnlineStatus(u.last_seen_at) : { text: 'Online' };
                const safeName = escapeUserHtml(u.name || 'Pengguna');
                const role = String(u.role || 'WALI_SANTRI').toUpperCase();
                const photoUrl = u.photoUrl || '';
                const deviceInfo = u.device_info || 'Perangkat Mobile / Desktop';

                const avatarHtml = photoUrl
                    ? `<img src="${photoUrl}" alt="${safeName}" class="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-[#253447] shadow-xs shrink-0" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=059669&color=fff'">`
                    : `<div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">${(u.name || 'U').charAt(0).toUpperCase()}</div>`;

                return `
                    <div class="pt-2.5 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1a2634] p-2 rounded-2xl transition">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="relative shrink-0">
                                ${avatarHtml}
                                <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#15202d] animate-pulse"></span>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${safeName}</h4>
                                    <span class="text-[9px] font-extrabold px-2 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">${role}</span>
                                </div>
                                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                                    <span>${escapeUserHtml(u.email || u.phone || '-')}</span>
                                    <span>•</span>
                                    <span class="text-slate-600 dark:text-slate-300 font-medium">${escapeUserHtml(deviceInfo)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 sm:self-center shrink-0">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>${presence.text}</span>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Window exports
        window.filterAdminUsers = filterAdminUsers;
        window.openOnlineUsersModal = openOnlineUsersModal;
        window.closeOnlineUsersModal = closeOnlineUsersModal;
        window.refreshOnlineUsersModal = refreshOnlineUsersModal;
        window.filterOnlineUsersModalList = filterOnlineUsersModalList;
        window.openAdminUserModal = openAdminUserModal;
        window.closeAdminUserModal = closeAdminUserModal;
        window.handleUserFormRoleChange = handleUserFormRoleChange;
        window.handleSelectPegawaiForUser = handleSelectPegawaiForUser;
        window.populatePegawaiDropdownInUserModal = populatePegawaiDropdownInUserModal;
        window.handleAdminUserSubmit = handleAdminUserSubmit;

