/**
 * ============================================================================
 * 01_core.js - Admin Core Controller & Navigation
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Autentikasi Modal & Sesi Admin (openAdminLoginModal, closeAdminLoginModal)
 *  - Navigasi & View Router (showAdminView, openAdminModuleFromControlCenter, backFromAdminModule)
 *  - Quick Search Finder (handleAdminGlobalSearchInput, navigateAdminSearchSelection)
 *  - Biometric Controls & Realtime Analytics Chart
 *  - Header Approval Notifications Chime (Web Audio API) & Real-time Polling
 *  - Stagger Animations untuk Seluruh Tampilan Modul
 * ============================================================================
 */

        // ==================== DASHBOARD ADMIN: CORE & NAVIGASI ====================
        function openAdminLoginModal() {
            if (isAdminLoggedIn) {
                switchTab('admin');
                showAdminView('hub');
                renderAdminNewsList();
                renderAdminBannerList();
                loadAdminPPDBData();
                loadAdminStudentsData();
                return;
            }
            if (typeof openAdminAuthModal === 'function') {
                openAdminAuthModal();
                return;
            }
            showToast("Modul autentikasi admin belum siap.");
        }

        function closeAdminLoginModal() {
            if (typeof closeAdminAuthModal === 'function') {
                closeAdminAuthModal();
            }
            const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
            if (activeTabEl && activeTabEl.id === 'page-admin' && !isAdminLoggedIn) {
                switchTab('beranda');
            }
        }

        function logoutAdmin() {
            isAdminLoggedIn = false;
            sessionStorage.removeItem("asnawiyyah_admin_token");
            localStorage.removeItem("asnawiyyah_admin_token");
            sessionStorage.removeItem("asnawiyyah_admin_role");
            localStorage.removeItem("asnawiyyah_admin_role");
            if (typeof ASNIdentity !== 'undefined' && typeof ASNIdentity.logout === 'function') {
                ASNIdentity.logout();
            }
            showToast("Keluar dari Mode Admin.");
            switchTab('beranda');
        }

        function toggleAdminUserDropdown(event) {
            if (event) {
                event.stopPropagation();
            }
            const dropdown = document.getElementById('admin-user-dropdown');
            const chevron = document.getElementById('admin-topbar-chevron');
            if (!dropdown) return;
            const isHidden = dropdown.classList.contains('hidden');
            if (isHidden) {
                dropdown.classList.remove('hidden');
                if (chevron) chevron.classList.add('rotate-180');
            } else {
                dropdown.classList.add('hidden');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        }
        window.toggleAdminUserDropdown = toggleAdminUserDropdown;

        function closeAdminUserDropdown() {
            const dropdown = document.getElementById('admin-user-dropdown');
            const chevron = document.getElementById('admin-topbar-chevron');
            if (dropdown) dropdown.classList.add('hidden');
            if (chevron) chevron.classList.remove('rotate-180');
        }
        window.closeAdminUserDropdown = closeAdminUserDropdown;

        function openAdminProfileSettings() {
            if (typeof showAdminView === 'function') {
                showAdminView('users');
            }
            if (typeof showToast === 'function') {
                const username = document.getElementById('admin-topbar-username')?.innerText || 'Admin Utama';
                showToast(`Profil Pengguna: ${username}`);
            }
        }
        window.openAdminProfileSettings = openAdminProfileSettings;

        // ================= TANDA SUARA & NOTIFIKASI APPROVAL IZIN (WEB AUDIO API) =================
        let notificationAudioContext = null;

        function playApprovalNotificationSound(isTest = false) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                if (!notificationAudioContext) {
                    notificationAudioContext = new AudioCtx();
                }
                if (notificationAudioContext.state === 'suspended') {
                    notificationAudioContext.resume();
                }

                const ctx = notificationAudioContext;
                const now = ctx.currentTime;

                // Master Gain untuk volume keras dan jelas di speaker smartphone/laptop
                const masterGain = ctx.createGain();
                masterGain.gain.setValueAtTime(0.92, now);
                masterGain.connect(ctx.destination);

                // Melodi Arpeggio Chime 4-Nada Elegan & Nyaring (Total durasi ~2.25 detik)
                // Nada 1: G5 (783.99 Hz)
                // Nada 2: C6 (1046.50 Hz)
                // Nada 3: E6 (1318.51 Hz)
                // Nada 4: G6 (1567.98 Hz) - Sustained Reverb Chime
                const melodyNotes = [
                    { freq: 783.99, start: 0.00, dur: 0.65, gain: 0.60 },
                    { freq: 1046.50, start: 0.20, dur: 0.75, gain: 0.75 },
                    { freq: 1318.51, start: 0.42, dur: 0.85, gain: 0.80 },
                    { freq: 1567.98, start: 0.65, dur: 1.60, gain: 0.90 }
                ];

                melodyNotes.forEach(n => {
                    const noteStartTime = now + n.start;
                    const noteEndTime = noteStartTime + n.dur;

                    // Osilator Dasar (Sine Wave - Body nada bulat & tebal)
                    const oscSine = ctx.createOscillator();
                    const gainSine = ctx.createGain();
                    oscSine.type = 'sine';
                    oscSine.frequency.setValueAtTime(n.freq, noteStartTime);

                    gainSine.gain.setValueAtTime(0, noteStartTime);
                    gainSine.gain.linearRampToValueAtTime(n.gain, noteStartTime + 0.02);
                    gainSine.gain.exponentialRampToValueAtTime(0.0001, noteEndTime);

                    oscSine.connect(gainSine);
                    gainSine.connect(masterGain);
                    oscSine.start(noteStartTime);
                    oscSine.stop(noteEndTime);

                    // Osilator Harmoni (Triangle Wave - Gemerincing bell akustik yang menembus kebisingan)
                    const oscTri = ctx.createOscillator();
                    const gainTri = ctx.createGain();
                    oscTri.type = 'triangle';
                    oscTri.frequency.setValueAtTime(n.freq * 2, noteStartTime);

                    gainTri.gain.setValueAtTime(0, noteStartTime);
                    gainTri.gain.linearRampToValueAtTime(n.gain * 0.35, noteStartTime + 0.015);
                    gainTri.gain.exponentialRampToValueAtTime(0.0001, noteStartTime + (n.dur * 0.65));

                    oscTri.connect(gainTri);
                    gainTri.connect(masterGain);
                    oscTri.start(noteStartTime);
                    oscTri.stop(noteStartTime + (n.dur * 0.65));
                });

                if (isTest && typeof showAdminToast === 'function') {
                    showAdminToast('🔔 Tanda suara notifikasi berbunyi nyaring & panjang!', 'success');
                }
            } catch (err) {
                console.warn('Gagal memainkan audio notifikasi:', err);
            }
        }
        window.playApprovalNotificationSound = playApprovalNotificationSound;

        function toggleAdminNotifDropdown(event) {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('admin-notif-dropdown');
            if (!dropdown) return;
            const isHidden = dropdown.classList.contains('hidden');
            if (isHidden) {
                dropdown.classList.remove('hidden');
                updateHeaderApprovalNotifications();
            } else {
                dropdown.classList.add('hidden');
            }
        }
        window.toggleAdminNotifDropdown = toggleAdminNotifDropdown;

        function closeAdminNotifDropdown() {
            const dropdown = document.getElementById('admin-notif-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
        }
        window.closeAdminNotifDropdown = closeAdminNotifDropdown;

        // Handler klik tombol notifikasi mobile (Header Utama)
        function handleMobileNotificationClick(event) {
            if (event) event.stopPropagation();
            const role = (window.ASNIdentity && window.ASNIdentity.currentRole) || 
                         sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                         sessionStorage.getItem('asnawiyyah_admin_role') || 
                         localStorage.getItem('asnawiyyah_admin_role') || '';
            const roleUpper = String(role).toUpperCase();
            const isAuthorized = ['PENGASUH', 'SUPER_ADMIN', 'ADMIN', 'ASATIDZ', 'PENGURUS'].includes(roleUpper);

            if (isAuthorized) {
                toggleAdminNotifDropdown(event);
            } else {
                if (typeof switchTab === 'function') {
                    switchTab('notifikasi');
                }
            }
        }
        window.handleMobileNotificationClick = handleMobileNotificationClick;

        let lastPendingApprovalCount = -1;

        function updateHeaderApprovalNotifications() {
            const badgeDesktop = document.getElementById('admin-notif-badge');
            const badgeMobile = document.getElementById('admin-mobile-notif-badge');
            const badgeMainMobile = document.getElementById('mobile-notif-badge');
            const badgePengasuhGrid = document.getElementById('pengasuh-perpulangan-badge');
            const badgeAdminGrid = document.getElementById('admin-perpulangan-badge');
            const badgeBottomNav = document.getElementById('mobile-nav-pengaturan-badge');
            const statusBadgeEl = document.getElementById('admin-notif-status-badge');
            const container = document.getElementById('admin-notif-list-container');

            const list = (window.ASNPerpulangan && Array.isArray(window.ASNPerpulangan.list)) ? window.ASNPerpulangan.list : [];
            const role = (window.ASNIdentity && window.ASNIdentity.currentRole) || 
                         sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                         sessionStorage.getItem('asnawiyyah_admin_role') || 
                         localStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
            const roleUpper = String(role).toUpperCase();

            // Filter pending approval berdasarkan peran
            let pendingItems = [];
            if (roleUpper === 'PENGASUH') {
                pendingItems = list.filter(item => {
                    const st = String(item.status || '').toUpperCase();
                    return st === 'MENUNGGU_PENGASUH' || st === 'MENUNGGU_PENGURUS';
                }).sort((a, b) => {
                    // Prioritaskan Menunggu Pengasuh di urutan paling atas
                    const aIsPengasuh = String(a.status || '').toUpperCase() === 'MENUNGGU_PENGASUH';
                    const bIsPengasuh = String(b.status || '').toUpperCase() === 'MENUNGGU_PENGASUH';
                    if (aIsPengasuh && !bIsPengasuh) return -1;
                    if (!aIsPengasuh && bIsPengasuh) return 1;
                    return 0;
                });
            } else if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'ADMIN') {
                pendingItems = list.filter(item => {
                    const st = String(item.status || '').toUpperCase();
                    return st === 'MENUNGGU_PENGURUS' || st === 'MENUNGGU_PENGASUH';
                });
            } else if (roleUpper === 'ASATIDZ' || roleUpper === 'PENGURUS') {
                pendingItems = list.filter(item => String(item.status || '').toUpperCase() === 'MENUNGGU_PENGURUS');
            } else {
                pendingItems = list.filter(item => String(item.status || '').toUpperCase() === 'MENUNGGU_PENGURUS');
            }

            const count = pendingItems.length;
            const countLabel = count > 99 ? '99+' : String(count);

            const isAuthorizedRole = ['PENGASUH', 'SUPER_ADMIN', 'ADMIN', 'ASATIDZ', 'PENGURUS'].includes(roleUpper);

            // Bunyikan tanda suara jika ada notifikasi baru yang masuk
            if (isAuthorizedRole && lastPendingApprovalCount !== -1 && count > lastPendingApprovalCount) {
                const diff = count - lastPendingApprovalCount;
                playApprovalNotificationSound(false);
                if (typeof showAdminToast === 'function') {
                    showAdminToast(`🔔 Ada ${diff} permohonan izin santri baru butuh persetujuan!`, 'info');
                }
            }
            lastPendingApprovalCount = count;

            // Helper sinkronisasi badge
            const updateBadge = (el, isDot = false) => {
                if (!el) return;
                if (count > 0 && isAuthorizedRole) {
                    if (!isDot) el.innerText = countLabel;
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            };

            // Sinkronisasi seluruh badge: desktop header, mobile admin navbar, header utama, pusat kontrol, bottom bar
            updateBadge(badgeDesktop);
            updateBadge(badgeMobile);
            updateBadge(badgeMainMobile);
            updateBadge(badgePengasuhGrid);
            updateBadge(badgeAdminGrid);
            updateBadge(badgeBottomNav, true);

            // Update Label Status di Header Popover
            if (statusBadgeEl) {
                statusBadgeEl.innerText = `${count} Butuh Tindakan`;
                if (count > 0) {
                    statusBadgeEl.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60';
                } else {
                    statusBadgeEl.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-[#1c2836] dark:text-slate-300 border border-slate-200 dark:border-slate-700';
                }
            }

            if (!container) return;

            // Render Daftar Kartu Notifikasi
            if (count === 0) {
                container.innerHTML = `
                    <div class="py-6 text-center text-slate-400 text-xs">
                        <i class="fa-solid fa-clipboard-check text-2xl text-slate-300 dark:text-slate-600 mb-1.5 block"></i>
                        <span>Semua pengajuan izin santri telah ditinjau.</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = pendingItems.slice(0, 10).map(item => {
                const isPengasuhTier = String(item.status || '').toUpperCase() === 'MENUNGGU_PENGASUH';
                const tierBadge = isPengasuhTier ? 
                    `<span class="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200">Tier 2 (Pengasuh)</span>` :
                    `<span class="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200">Tier 1 (Pengurus)</span>`;

                const santriName = item.nama_santri || item.namaSantri || 'Santri';
                const keperluan = item.keperluan || item.kategori || 'Izin';
                const waktu = item.tanggal_mulai ? `${item.tanggal_mulai}` : '';

                return `
                    <div onclick="openNotificationIzinDetail('${item.id}')" 
                        class="p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 hover:bg-emerald-50/60 dark:bg-[#1c2836]/60 dark:hover:bg-emerald-950/30 transition cursor-pointer group active:scale-[0.99]">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    ${santriName}
                                </h4>
                                <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">${keperluan}</p>
                            </div>
                            <div class="shrink-0 text-right">
                                ${tierBadge}
                            </div>
                        </div>
                        <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                            <span><i class="fa-regular fa-clock mr-1"></i>${waktu || 'Hari ini'}</span>
                            <span class="text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                                Tinjau <i class="fa-solid fa-chevron-right text-[8px]"></i>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        window.updateHeaderApprovalNotifications = updateHeaderApprovalNotifications;

        function openNotificationIzinDetail(izinId) {
            closeAdminNotifDropdown();
            // Arahkan ke modul perpulangan santri
            if (typeof openAdminModuleFromControlCenter === 'function') {
                openAdminModuleFromControlCenter('perpulangan');
            } else if (typeof showAdminView === 'function') {
                showAdminView('perpulangan');
            }
            if (izinId && window.ASNPerpulangan && typeof window.ASNPerpulangan.openModalApproval === 'function') {
                setTimeout(() => {
                    window.ASNPerpulangan.openModalApproval(izinId);
                }, 300);
            }
        }
        window.openNotificationIzinDetail = openNotificationIzinDetail;

        // Polling notifikasi berkala di background setiap 40 detik
        if (!window._asnApprovalNotifInterval) {
            window._asnApprovalNotifInterval = setInterval(() => {
                const role = (window.ASNIdentity && window.ASNIdentity.currentRole) || 
                             sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                             sessionStorage.getItem('asnawiyyah_admin_role') || 
                             localStorage.getItem('asnawiyyah_admin_role') || '';
                const roleUpper = String(role).toUpperCase();
                if (['PENGASUH', 'SUPER_ADMIN', 'ADMIN', 'ASATIDZ', 'PENGURUS'].includes(roleUpper)) {
                    if (window.ASNPerpulangan && typeof window.ASNPerpulangan.loadData === 'function') {
                        window.ASNPerpulangan.loadData(false);
                    }
                }
            }, 40000);
        }

        // Event listener klik di luar popover & menu dropdown
        document.addEventListener('click', function(e) {
            const wrapper = document.getElementById('admin-user-menu-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                closeAdminUserDropdown();
            }
            
            const notifDropdown = document.getElementById('admin-notif-dropdown');
            const notifBtnDesktop = document.getElementById('admin-notif-btn');
            const notifBtnMobile = document.getElementById('admin-mobile-notif-btn');
            const notifBtnMainMobile = document.getElementById('main-mobile-notif-btn');
            if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
                const isTrigger = (notifBtnDesktop && notifBtnDesktop.contains(e.target)) ||
                                  (notifBtnMobile && notifBtnMobile.contains(e.target)) ||
                                  (notifBtnMainMobile && notifBtnMainMobile.contains(e.target));
                const isInside = notifDropdown.contains(e.target);
                if (!isTrigger && !isInside) {
                    closeAdminNotifDropdown();
                }
            }
        });

        // Toggle Expand / Collapse per kelompok menu sidebar
        function toggleAdminMenuGroup(headerBtn) {
            if (!headerBtn) return;
            const group = headerBtn.closest('.admin-menu-group');
            if (!group) return;
            const list = group.querySelector('ul');
            const arrow = headerBtn.querySelector('.menu-group-arrow');
            if (!list) return;

            const isHidden = list.classList.contains('hidden');
            if (isHidden) {
                list.classList.remove('hidden');
                if (arrow) arrow.classList.remove('-rotate-90');
            } else {
                list.classList.add('hidden');
                if (arrow) arrow.classList.add('-rotate-90');
            }
        }
        window.toggleAdminMenuGroup = toggleAdminMenuGroup;

        
        let adminSidebarCollapsed = false;
        function toggleAdminSidebar() {
            adminSidebarCollapsed = !adminSidebarCollapsed;
            const sidebar = document.getElementById('admin-sidebar');
            const icon = document.getElementById('admin-sidebar-icon');
            const texts = document.querySelectorAll('.sidebar-text');
            
            if (adminSidebarCollapsed) {
                sidebar.classList.remove('w-64');
                sidebar.classList.add('w-16');
                icon.classList.add('rotate-180');
                texts.forEach(el => {
                    el.classList.add('opacity-0', 'invisible', 'w-0');
                    el.classList.remove('opacity-100');
                });
            } else {
                sidebar.classList.remove('w-16');
                sidebar.classList.add('w-64');
                icon.classList.remove('rotate-180');
                texts.forEach(el => {
                    el.classList.remove('opacity-0', 'invisible', 'w-0');
                    el.classList.add('opacity-100');
                });
            }
        }

        // ==================== ADMIN QUICK SEARCH FINDER & SHORTCUT ====================
        const ADMIN_SEARCH_MODULES = [
            { view: 'hub', name: 'Dashboard Utama', category: 'Ringkasan', icon: 'fa-gauge-high' },
            { view: 'tahfidz', name: 'Tahfidz Qur\'an', category: 'Kesantrian', icon: 'fa-book-quran' },
            { view: 'santri', name: 'Data Santri', category: 'Kesantrian', icon: 'fa-id-card-clip' },
            { view: 'wali-santri', name: 'Data Wali Santri', category: 'Kesantrian', icon: 'fa-user-group' },
            { view: 'perpulangan', name: 'Izin & Perpulangan', category: 'Kesantrian', icon: 'fa-person-walking-luggage' },
            { view: 'ppdb', name: 'Pendaftar PPDB', category: 'Kesantrian', icon: 'fa-user-graduate' },
            { view: 'unit-kegiatan', name: 'Unit Kegiatan (UKS)', category: 'Kesantrian', icon: 'fa-people-roof' },
            { view: 'jadwal-kegiatan', name: 'Jadwal Kegiatan', category: 'Kesantrian', icon: 'fa-calendar-check' },
            { view: 'alumni', name: 'Rekap Alumni', category: 'Kesantrian', icon: 'fa-user-graduate' },
            { view: 'program', name: 'Manajemen Program', category: 'Kesantrian', icon: 'fa-graduation-cap' },
            { view: 'pegawai', name: 'Data Pegawai & Asatidz', category: 'Kepegawaian', icon: 'fa-user-tie' },
            { view: 'berita', name: 'Manajemen Berita', category: 'Portal & Media', icon: 'fa-newspaper' },
            { view: 'banner', name: 'Banner Slider', category: 'Portal & Media', icon: 'fa-images' },
            { view: 'galeri', name: 'Manajemen Galeri', category: 'Portal & Media', icon: 'fa-camera-retro' },
            { view: 'profil-lembaga', name: 'Profil & Kepengurusan', category: 'Portal & Media', icon: 'fa-building-columns' },
            { view: 'pengaturan', name: 'Tautan & Sosmed', category: 'Portal & Media', icon: 'fa-share-nodes' },
            { view: 'users', name: 'Manajemen Pengguna', category: 'Sistem', icon: 'fa-users-gear' },
            { view: 'roles', name: 'Manajemen Peran (RBAC)', category: 'Sistem', icon: 'fa-shield-halved' },
            { view: 'notifikasi', name: 'Notifikasi Broadcast', category: 'Sistem', icon: 'fa-bell' }
        ];

        function handleAdminQuickSearch(query) {
            const dropdown = document.getElementById('admin-quick-search-dropdown');
            if (!dropdown) return;
            
            const q = (query || '').trim().toLowerCase();
            const currentRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                sessionStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
            
            const filtered = ADMIN_SEARCH_MODULES.filter(item => {
                if (item.view !== 'hub' && typeof isModuleAllowedForRole === 'function') {
                    if (!isModuleAllowedForRole(item.view, currentRole)) return false;
                }
                if (!q) return true;
                return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
            });

            if (filtered.length === 0) {
                dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 dark:text-slate-500 text-center">Tidak ada modul yang cocok</div>`;
                dropdown.classList.remove('hidden');
                return;
            }

            dropdown.innerHTML = filtered.map(item => `
                <button type="button" onclick="selectAdminQuickSearchResult('${item.view}')" class="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-emerald-50/70 dark:hover:bg-slate-750 text-left transition group">
                    <div class="flex items-center gap-2.5">
                        <i class="fa-solid ${item.icon} text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-xs w-4 text-center"></i>
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">${item.name}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">${item.category}</span>
                </button>
            `).join('');
            dropdown.classList.remove('hidden');
        }

        function selectAdminQuickSearchResult(viewName) {
            const dropdown = document.getElementById('admin-quick-search-dropdown');
            const input = document.getElementById('admin-quick-search-input');
            if (dropdown) dropdown.classList.add('hidden');
            if (input) input.value = '';
            showAdminView(viewName);
        }

        // Event listener klik di luar untuk menutup dropdown search
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('admin-quick-search-dropdown');
            const searchInput = document.getElementById('admin-quick-search-input');
            if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
                dropdown.classList.add('hidden');
            }
        });

        // ==================== OVERALL DATA & BIOMETRIC ANALYTICS CONTROLS ====================
        let currentAdminAnalyticsRange = '7d';

        const ADMIN_ANALYTICS_DATASETS = {
            'today': {
                label: 'Hari Ini',
                badge: 'Today',
                avgLabel: 'Total 204 Presensi Terverifikasi Hari Ini',
                overallRate: '99.2%',
                breakdown: { tepat: '52.4%', lembur: '30.1%', cuti: '17.5%' },
                donut: { tepat: 197.5, lembur: 113.4, cuti: 66.0, offsetLembur: -200, offsetCuti: -315 },
                columns: [
                    { label: 'Subuh 04:30', santri: 138, asatidz: 21, total: 159 },
                    { label: 'Dhuha 07:30', santri: 140, asatidz: 20, total: 160 },
                    { label: 'Dzuhur 12:00', santri: 139, asatidz: 21, total: 160 },
                    { label: 'Ashar 15:30', santri: 140, asatidz: 21, total: 161, peak: true },
                    { label: 'Maghrib 18:00', santri: 140, asatidz: 21, total: 161 },
                    { label: 'Isya 19:30', santri: 139, asatidz: 20, total: 159 }
                ]
            },
            '7d': {
                label: '7 Hari Terakhir',
                badge: 'Last 7 days',
                avgLabel: 'Rata-rata 317 Presensi/Hari',
                overallRate: '98.5%',
                breakdown: { tepat: '46.3%', lembur: '32.6%', cuti: '22.1%' },
                donut: { tepat: 174.5, lembur: 122.9, cuti: 75.0, offsetLembur: -180, offsetCuti: -305 },
                columns: [
                    { label: '05-18', santri: 180, asatidz: 35, total: 215 },
                    { label: '05-19', santri: 210, asatidz: 40, total: 250 },
                    { label: '05-20', santri: 200, asatidz: 38, total: 238 },
                    { label: '05-21', santri: 260, asatidz: 48, total: 308, peak: true },
                    { label: '05-22', santri: 215, asatidz: 42, total: 257 },
                    { label: '05-23', santri: 190, asatidz: 36, total: 226 },
                    { label: '05-24', santri: 170, asatidz: 32, total: 202 }
                ]
            },
            '30d': {
                label: '30 Hari Terakhir',
                badge: 'Last 30 days',
                avgLabel: 'Rata-rata 331 Presensi/Hari',
                overallRate: '98.8%',
                breakdown: { tepat: '48.7%', lembur: '31.2%', cuti: '20.1%' },
                donut: { tepat: 183.5, lembur: 117.6, cuti: 75.8, offsetLembur: -185, offsetCuti: -305 },
                columns: [
                    { label: 'Pekan 1', santri: 285, asatidz: 44, total: 329 },
                    { label: 'Pekan 2', santri: 310, asatidz: 46, total: 356 },
                    { label: 'Pekan 3', santri: 335, asatidz: 49, total: 384, peak: true },
                    { label: 'Pekan 4', santri: 320, asatidz: 45, total: 365 },
                    { label: 'Pekan 5', santri: 305, asatidz: 43, total: 348 }
                ]
            },
            '90d': {
                label: '90 Hari Terakhir',
                badge: 'Last 90 days',
                avgLabel: 'Rata-rata 324 Presensi/Hari',
                overallRate: '97.9%',
                breakdown: { tepat: '45.8%', lembur: '33.5%', cuti: '20.7%' },
                donut: { tepat: 172.6, lembur: 126.2, cuti: 78.0, offsetLembur: -175, offsetCuti: -303 },
                columns: [
                    { label: 'Bulan ke-1', santri: 290, asatidz: 42, total: 332 },
                    { label: 'Bulan ke-2', santri: 330, asatidz: 48, total: 378, peak: true },
                    { label: 'Bulan ke-3', santri: 315, asatidz: 45, total: 360 }
                ]
            },
            'all': {
                label: 'Semua Periode',
                badge: 'All time',
                avgLabel: 'Rata-rata 328 Presensi/Hari (Akumulatif)',
                overallRate: '98.4%',
                breakdown: { tepat: '47.2%', lembur: '32.1%', cuti: '20.7%' },
                donut: { tepat: 177.9, lembur: 121.0, cuti: 78.0, offsetLembur: -180, offsetCuti: -302 },
                columns: [
                    { label: 'Semester 1', santri: 310, asatidz: 44, total: 354 },
                    { label: 'Semester 2', santri: 335, asatidz: 48, total: 383, peak: true },
                    { label: 'Semester 3', santri: 325, asatidz: 46, total: 371 },
                    { label: 'Semester 4', santri: 340, asatidz: 49, total: 389 }
                ]
            }
        };

        function renderAdminAnalyticsChart(rangeKey) {
            const data = ADMIN_ANALYTICS_DATASETS[rangeKey] || ADMIN_ANALYTICS_DATASETS['7d'];
            
            // 1. Update Range Badge Label di Header Grafik
            const rangeBadge = document.getElementById('admin-analytics-chart-range-label');
            if (rangeBadge) {
                rangeBadge.textContent = data.badge;
            }

            // 2. Update Footer Average Label
            const avgLabel = document.getElementById('admin-attendance-avg-label');
            if (avgLabel) {
                avgLabel.textContent = data.avgLabel;
            }

            // 3. Update SVG Stacked Rounded Bars
            const barsGroup = document.getElementById('admin-attendance-bars-group');
            if (barsGroup && Array.isArray(data.columns)) {
                const totalBars = data.columns.length;
                const plotStartX = 50;
                const plotEndX = 510;
                const availableWidth = plotEndX - plotStartX;
                const colWidth = 20;
                const step = totalBars > 1 ? availableWidth / totalBars : availableWidth / 2;
                
                // SVG coordinate reference: y=135 is baseline (0), max reference 400
                const baseLineY = 135;
                const maxHeightPx = 115; // Max height in SVG coordinate
                const scaleUnit = maxHeightPx / 400;

                let barsHtml = '';
                data.columns.forEach((col, idx) => {
                    const cx = plotStartX + (idx * step) + (step / 2);
                    const barX = Math.round(cx - (colWidth / 2));
                    const textX = Math.round(cx);

                    // Height calculation
                    const santriH = Math.max(14, Math.round(col.santri * scaleUnit));
                    const asatidzH = Math.max(8, Math.round(col.asatidz * scaleUnit));
                    const santriY = baseLineY - santriH;
                    const asatidzY = santriY - asatidzH;

                    const isPeak = !!col.peak;
                    const labelColorClass = isPeak ? 'fill-sky-600 dark:fill-sky-400 font-bold' : 'fill-slate-400 group-hover:fill-sky-500 font-medium';

                    barsHtml += `
                        <g class="cursor-pointer group">
                            <title>${col.label}: ${col.santri} Santri, ${col.asatidz} Asatidz (Total: ${col.total || (col.santri + col.asatidz)})${isPeak ? ' [Puncak]' : ''}</title>
                            <rect x="${barX}" y="${santriY}" width="${colWidth}" height="${santriH}" rx="6" fill="#38bdf8" class="group-hover:opacity-90 transition-all duration-300"/>
                            <rect x="${barX}" y="${asatidzY}" width="${colWidth}" height="${asatidzH}" rx="6" fill="#fb923c" class="group-hover:opacity-90 transition-all duration-300"/>
                            <text x="${textX}" y="152" text-anchor="middle" class="text-[10px] ${labelColorClass} transition-colors">${col.label}</text>
                        </g>
                    `;
                });
                barsGroup.innerHTML = barsHtml;
            }

            // 4. Update Donut Ring Chart & Metrics
            const donutCircleTepat = document.getElementById('admin-donut-segment-tepat');
            const donutCircleLembur = document.getElementById('admin-donut-segment-lembur');
            const donutCircleCuti = document.getElementById('admin-donut-segment-cuti');
            const donutPercentText = document.getElementById('admin-donut-percent-text');
            const donutBkTepat = document.getElementById('admin-donut-breakdown-tepat');
            const donutBkLembur = document.getElementById('admin-donut-breakdown-lembur');
            const donutBkCuti = document.getElementById('admin-donut-breakdown-cuti');

            if (donutPercentText) donutPercentText.textContent = data.overallRate;
            if (donutBkTepat) donutBkTepat.textContent = data.breakdown.tepat;
            if (donutBkLembur) donutBkLembur.textContent = data.breakdown.lembur;
            if (donutBkCuti) donutBkCuti.textContent = data.breakdown.cuti;

            if (data.donut) {
                if (donutCircleTepat) {
                    donutCircleTepat.setAttribute('stroke-dasharray', `${data.donut.tepat} 376.99`);
                }
                if (donutCircleLembur) {
                    donutCircleLembur.setAttribute('stroke-dasharray', `${data.donut.lembur} 376.99`);
                    donutCircleLembur.setAttribute('stroke-dashoffset', String(data.donut.offsetLembur || -180));
                }
                if (donutCircleCuti) {
                    donutCircleCuti.setAttribute('stroke-dasharray', `${data.donut.cuti} 376.99`);
                    donutCircleCuti.setAttribute('stroke-dashoffset', String(data.donut.offsetCuti || -305));
                }
            }
        }

        function setAdminAnalyticsTimeRange(btnEl, rangeKey) {
            currentAdminAnalyticsRange = rangeKey;
            
            // Update active pill UI styling
            const pills = document.querySelectorAll('.admin-time-pill');
            pills.forEach(p => {
                p.classList.remove('active', 'bg-sky-500', 'text-white', 'font-bold', 'shadow-xs');
                p.classList.add('text-slate-500', 'dark:text-slate-400');
            });

            const targetBtn = btnEl || document.querySelector(`.admin-time-pill[data-range="${rangeKey}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active', 'bg-sky-500', 'text-white', 'font-bold', 'shadow-xs');
                targetBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
            }

            renderAdminAnalyticsChart(rangeKey);

            const data = ADMIN_ANALYTICS_DATASETS[rangeKey];
            const label = data ? data.label : rangeKey;
            showToast(`Rentang analitik disesuaikan: ${label}`);
        }

        function triggerAdminHubStaggerAnimation() {
            const hub = document.getElementById('admin-menu-hub');
            if (!hub) return;
            const animatedElements = hub.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }

        function triggerTahfidzStaggerAnimation() {
            const tahfidzView = document.getElementById('admin-view-tahfidz');
            if (!tahfidzView) return;
            const animatedElements = tahfidzView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerTahfidzStaggerAnimation = triggerTahfidzStaggerAnimation;

        function triggerSantriStaggerAnimation() {
            const santriView = document.getElementById('admin-view-santri');
            if (!santriView) return;
            const animatedElements = santriView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerSantriStaggerAnimation = triggerSantriStaggerAnimation;

        function triggerAlumniStaggerAnimation() {
            const alumniView = document.getElementById('admin-view-alumni');
            if (!alumniView) return;
            const animatedElements = alumniView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerAlumniStaggerAnimation = triggerAlumniStaggerAnimation;

        function triggerPegawaiStaggerAnimation() {
            const pegawaiView = document.getElementById('admin-view-pegawai');
            if (!pegawaiView) return;
            const animatedElements = pegawaiView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerPegawaiStaggerAnimation = triggerPegawaiStaggerAnimation;

        function triggerKeaktifanStaggerAnimation() {
            const keaktifanView = document.getElementById('admin-view-keaktifan-asatidz');
            if (!keaktifanView) return;
            const animatedElements = keaktifanView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerKeaktifanStaggerAnimation = triggerKeaktifanStaggerAnimation;

        function triggerUsersStaggerAnimation() {
            const usersView = document.getElementById('admin-view-users');
            if (!usersView) return;
            const animatedElements = usersView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerUsersStaggerAnimation = triggerUsersStaggerAnimation;

        function triggerRolesStaggerAnimation() {
            const rolesView = document.getElementById('admin-view-roles');
            if (!rolesView) return;
            const animatedElements = rolesView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerRolesStaggerAnimation = triggerRolesStaggerAnimation;

        function triggerPPDBStaggerAnimation() {
            const ppdbView = document.getElementById('admin-view-ppdb');
            if (!ppdbView) return;
            const animatedElements = ppdbView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerPPDBStaggerAnimation = triggerPPDBStaggerAnimation;

        function triggerProgramStaggerAnimation() {
            const programView = document.getElementById('admin-view-program');
            if (!programView) return;
            const animatedElements = programView.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerProgramStaggerAnimation = triggerProgramStaggerAnimation;

        function triggerBeritaStaggerAnimation() {
            const v = document.getElementById('admin-view-berita');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerBeritaStaggerAnimation = triggerBeritaStaggerAnimation;

        function triggerBannerStaggerAnimation() {
            const v = document.getElementById('admin-view-banner');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerBannerStaggerAnimation = triggerBannerStaggerAnimation;

        function triggerGaleriStaggerAnimation() {
            const v = document.getElementById('admin-view-galeri');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerGaleriStaggerAnimation = triggerGaleriStaggerAnimation;

        function triggerProfilLembagaStaggerAnimation() {
            const v = document.getElementById('admin-view-profil-lembaga');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerProfilLembagaStaggerAnimation = triggerProfilLembagaStaggerAnimation;

        function triggerUnitKegiatanStaggerAnimation() {
            const v = document.getElementById('admin-view-unit-kegiatan');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerUnitKegiatanStaggerAnimation = triggerUnitKegiatanStaggerAnimation;

        function triggerJadwalKegiatanStaggerAnimation() {
            const v = document.getElementById('admin-view-jadwal-kegiatan');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerJadwalKegiatanStaggerAnimation = triggerJadwalKegiatanStaggerAnimation;

        function triggerNotifikasiStaggerAnimation() {
            const v = document.getElementById('admin-view-notifikasi');
            if (!v) return;
            v.querySelectorAll('.animate-fade-in-up').forEach(el => {
                el.classList.remove('animate-fade-in-up');
                void el.offsetWidth;
                el.classList.add('animate-fade-in-up');
            });
        }
        window.triggerNotifikasiStaggerAnimation = triggerNotifikasiStaggerAnimation;

        function refreshAdminAnalyticsData() {
            const refreshBtn = document.getElementById('admin-analytics-refresh-btn');
            const icon = refreshBtn ? refreshBtn.querySelector('i') : null;

            if (icon) {
                icon.classList.add('animate-spin');
            }

            setTimeout(() => {
                if (icon) {
                    icon.classList.remove('animate-spin');
                }
                // Refresh KPI role data if available
                if (typeof ASNIdentity !== 'undefined' && typeof ASNIdentity.getRoleConfig === 'function') {
                    const currentRole = ASNIdentity.currentRole || 'SUPER_ADMIN';
                    if (typeof applyAdminRoleVisibility === 'function') {
                        applyAdminRoleVisibility(currentRole);
                    }
                }
                if (typeof renderAdminAnalyticsChart === 'function') {
                    renderAdminAnalyticsChart(currentAdminAnalyticsRange || '7d');
                }
                if (typeof triggerAdminHubStaggerAnimation === 'function') {
                    triggerAdminHubStaggerAnimation();
                }
                showToast('Data analitik biometrik & KPI telah diperbarui realtime.');
            }, 600);
        }

        function openAdminCameraPresensi() {
            if (typeof openTahfidzPresensiModal === 'function') {
                openTahfidzPresensiModal();
                showToast('Membuka antarmuka presensi biometrik halaqah...');
            } else {
                showToast('Modul kamera presensi biometrik siap disinkronkan.');
            }
        }


        // Shortcut keyboard Alt+F atau Ctrl+K untuk focus search input
        document.addEventListener('keydown', function(e) {
            if ((e.altKey && (e.key === 'f' || e.key === 'F')) || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
                const searchInput = document.getElementById('admin-quick-search-input');
                const pageAdmin = document.getElementById('page-admin');
                if (searchInput && pageAdmin && !pageAdmin.classList.contains('hidden')) {
                    e.preventDefault();
                    searchInput.focus();
                    handleAdminQuickSearch(searchInput.value);
                }
            }
        });

        function showAdminView(viewName) {
            // Guard Navigasi RBAC: Validasi wewenang peran sebelum membuka sub-view
            if (viewName && viewName !== 'hub') {
                const currentRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                    sessionStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
                if (typeof isModuleAllowedForRole === 'function' && !isModuleAllowedForRole(viewName, currentRole)) {
                    if (typeof showToast === 'function') {
                        showToast(`Akses Ditolak: Peran ${currentRole} tidak memiliki hak akses modul ini.`);
                    }
                    viewName = 'hub';
                }
            }

            // Update Topbar Breadcrumb & Sidebar Active state
            const breadcrumbEl = document.getElementById('admin-topbar-breadcrumb');
            if (breadcrumbEl) {
                const viewLabels = {
                    'hub': 'Dashboard Utama',
                    'tahfidz': 'Tahfidz Qur\'an',
                    'santri': 'Data Santri',
                    'wali-santri': 'Data Wali Santri',
                    'ppdb': 'Pendaftar PPDB',
                    'unit-kegiatan': 'Unit Kegiatan (UKS)',
                    'jadwal-kegiatan': 'Jadwal Kegiatan',
                    'alumni': 'Rekap Alumni',
                    'program': 'Manajemen Program',
                    'pegawai': 'Data Pegawai & Asatidz',
                    'keaktifan-asatidz': 'Keaktifan Asatidz',
                    'berita': 'Manajemen Berita',
                    'banner': 'Banner Slider',
                    'galeri': 'Manajemen Galeri',
                    'profil-lembaga': 'Profil & Kepengurusan',
                    'pengaturan': 'Tautan & Sosmed',
                    'users': 'Manajemen Pengguna',
                    'roles': 'Manajemen Peran',
                    'notifikasi': 'Notifikasi Broadcast',
                    'perpulangan': 'Izin & Perpulangan Santri'
                };
                breadcrumbEl.innerText = viewLabels[viewName] || 'Panel Admin';
            }

            document.querySelectorAll('.admin-nav-item').forEach(btn => {
                if (btn.dataset.view === viewName) {
                    btn.classList.add('active');
                    const group = btn.closest('.admin-menu-group');
                    if (group) {
                        const list = group.querySelector('ul');
                        const arrow = group.querySelector('.menu-group-arrow');
                        if (list && list.classList.contains('hidden')) {
                            list.classList.remove('hidden');
                            if (arrow) arrow.classList.remove('-rotate-90');
                        }
                    }
                } else {
                    btn.classList.remove('active');
                }
            });
            

            const hubView = document.getElementById('admin-menu-hub');
            const beritaView = document.getElementById('admin-view-berita');
            const bannerView = document.getElementById('admin-view-banner');
            const santriView = document.getElementById('admin-view-santri');
            const tahfidzView = document.getElementById('admin-view-tahfidz');
            const keaktifanView = document.getElementById('admin-view-keaktifan-asatidz');
            const ppdbView = document.getElementById('admin-view-ppdb');
            const programView = document.getElementById('admin-view-program');
            const galeriView = document.getElementById('admin-view-galeri');
            const pengaturanView = document.getElementById('admin-view-pengaturan');
            const profilLembagaView = document.getElementById('admin-view-profil-lembaga');
            const unitKegiatanView = document.getElementById('admin-view-unit-kegiatan');
            const jadwalKegiatanView = document.getElementById('admin-view-jadwal-kegiatan');
            const alumniView = document.getElementById('admin-view-alumni');
            const notifikasiView = document.getElementById('admin-view-notifikasi');
            const pegawaiView = document.getElementById('admin-view-pegawai');
            const usersView = document.getElementById('admin-view-users');
            const waliSantriView = document.getElementById('admin-view-wali-santri');
            const rolesView = document.getElementById('admin-view-roles');
            const perpulanganView = document.getElementById('admin-view-perpulangan');

            if (!hubView || !beritaView || !bannerView) return;

            hubView.classList.add('hidden');
            beritaView.classList.add('hidden');
            bannerView.classList.add('hidden');
            if (santriView) santriView.classList.add('hidden');
            if (waliSantriView) waliSantriView.classList.add('hidden');
            if (tahfidzView) tahfidzView.classList.add('hidden');
            if (keaktifanView) keaktifanView.classList.add('hidden');
            if (ppdbView) ppdbView.classList.add('hidden');
            if (programView) programView.classList.add('hidden');
            if (galeriView) galeriView.classList.add('hidden');
            if (pengaturanView) pengaturanView.classList.add('hidden');
            if (profilLembagaView) profilLembagaView.classList.add('hidden');
            if (unitKegiatanView) unitKegiatanView.classList.add('hidden');
            if (jadwalKegiatanView) jadwalKegiatanView.classList.add('hidden');
            if (alumniView) alumniView.classList.add('hidden');
            if (notifikasiView) notifikasiView.classList.add('hidden');
            if (pegawaiView) pegawaiView.classList.add('hidden');
            if (usersView) usersView.classList.add('hidden');
            if (rolesView) rolesView.classList.add('hidden');
            if (perpulanganView) perpulanganView.classList.add('hidden');

            if (viewName === 'berita') {
                beritaView.classList.remove('hidden');
                if (typeof toggleAdminNewsForm === 'function' && !document.getElementById('admin-news-id')?.value) {
                    toggleAdminNewsForm(false);
                }
                if (typeof triggerBeritaStaggerAnimation === 'function') {
                    triggerBeritaStaggerAnimation();
                }
                renderAdminNewsList();
            } else if (viewName === 'banner') {
                bannerView.classList.remove('hidden');
                if (typeof triggerBannerStaggerAnimation === 'function') {
                    triggerBannerStaggerAnimation();
                }
                if (typeof toggleAdminBannerForm === 'function' && !document.getElementById('admin-banner-id')?.value) {
                    toggleAdminBannerForm(false);
                }
                renderAdminBannerList();
            } else if (viewName === 'users') {
                if (usersView) usersView.classList.remove('hidden');
                if (typeof triggerUsersStaggerAnimation === 'function') {
                    triggerUsersStaggerAnimation();
                }
                loadAdminUsersData();
            } else if (viewName === 'wali-santri') {
                if (waliSantriView) waliSantriView.classList.remove('hidden');
                if (typeof loadAdminWaliSantriData === 'function') {
                    loadAdminWaliSantriData();
                }
            } else if (viewName === 'roles') {
                if (rolesView) rolesView.classList.remove('hidden');
                if (typeof triggerRolesStaggerAnimation === 'function') {
                    triggerRolesStaggerAnimation();
                }
                if (typeof loadAdminRolesData === 'function') {
                    loadAdminRolesData();
                }
            } else if (viewName === 'santri') {
                if (santriView) santriView.classList.remove('hidden');
                if (typeof triggerSantriStaggerAnimation === 'function') {
                    triggerSantriStaggerAnimation();
                }
                loadAdminStudentsData();
            } else if (viewName === 'pegawai') {
                if (pegawaiView) pegawaiView.classList.remove('hidden');
                if (typeof triggerPegawaiStaggerAnimation === 'function') {
                    triggerPegawaiStaggerAnimation();
                }
                if (typeof loadAdminEmployeesData === 'function') {
                    loadAdminEmployeesData();
                }
            } else if (viewName === 'tahfidz') {
                if (tahfidzView) tahfidzView.classList.remove('hidden');
                if (typeof triggerTahfidzStaggerAnimation === 'function') {
                    triggerTahfidzStaggerAnimation();
                }
                if (typeof loadAdminTahfidzData === 'function') {
                    loadAdminTahfidzData();
                }
                if (typeof applyTahfidzRolePermissions === 'function') {
                    applyTahfidzRolePermissions();
                } else {
                    const activeRole = String((typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                                              sessionStorage.getItem('ASN_ADMIN_ROLE') || 
                                              sessionStorage.getItem('asnawiyyah_admin_role') || '').toUpperCase();
                    const isPengasuh = activeRole === 'PENGASUH' || (typeof ASNTahfidz !== 'undefined' && ASNTahfidz.viewerRole === 'pengasuh');
                    const isAsatidz = activeRole === 'ASATIDZ';
                    document.querySelectorAll('.tahfidz-admin-action').forEach(el => {
                        el.style.display = (isPengasuh || isAsatidz) ? 'none' : '';
                    });
                }
            } else if (viewName === 'keaktifan-asatidz') {
                if (keaktifanView) keaktifanView.classList.remove('hidden');
                if (typeof triggerKeaktifanStaggerAnimation === 'function') {
                    triggerKeaktifanStaggerAnimation();
                }
                if (typeof loadAdminKeaktifanAsatidz === 'function') {
                    loadAdminKeaktifanAsatidz();
                }
            } else if (viewName === 'notifikasi') {
                if (notifikasiView) notifikasiView.classList.remove('hidden');
                if (typeof triggerNotifikasiStaggerAnimation === 'function') {
                    triggerNotifikasiStaggerAnimation();
                }
                loadAdminNotifikasi();
            } else if (viewName === 'galeri') {
                if (galeriView) galeriView.classList.remove('hidden');
                if (typeof triggerGaleriStaggerAnimation === 'function') {
                    triggerGaleriStaggerAnimation();
                }
                renderAdminGaleriList();
            } else if (viewName === 'pengaturan') {
                if (pengaturanView) pengaturanView.classList.remove('hidden');
                loadAdminPengaturan();
            } else if (viewName === 'ppdb') {
                if (ppdbView) ppdbView.classList.remove('hidden');
                if (typeof triggerPPDBStaggerAnimation === 'function') {
                    triggerPPDBStaggerAnimation();
                }
                loadAdminPPDBData();
            } else if (viewName === 'program') {
                if (programView) programView.classList.remove('hidden');
                if (typeof triggerProgramStaggerAnimation === 'function') {
                    triggerProgramStaggerAnimation();
                }
                loadAdminProgramList();
            } else if (viewName === 'profil-lembaga') {
                if (profilLembagaView) profilLembagaView.classList.remove('hidden');
                if (typeof triggerProfilLembagaStaggerAnimation === 'function') {
                    triggerProfilLembagaStaggerAnimation();
                }
                loadAdminProfilLembaga();
            } else if (viewName === 'unit-kegiatan') {
                if (unitKegiatanView) unitKegiatanView.classList.remove('hidden');
                if (typeof triggerUnitKegiatanStaggerAnimation === 'function') {
                    triggerUnitKegiatanStaggerAnimation();
                }
                renderAdminUnitKegiatanList();
            } else if (viewName === 'jadwal-kegiatan') {
                if (jadwalKegiatanView) jadwalKegiatanView.classList.remove('hidden');
                if (typeof triggerJadwalKegiatanStaggerAnimation === 'function') {
                    triggerJadwalKegiatanStaggerAnimation();
                }
                loadJadwalKegiatan();
            } else if (viewName === 'alumni') {
                if (alumniView) alumniView.classList.remove('hidden');
                if (typeof triggerAlumniStaggerAnimation === 'function') {
                    triggerAlumniStaggerAnimation();
                }
                loadAdminAlumniData();
            } else if (viewName === 'perpulangan') {
                if (perpulanganView) perpulanganView.classList.remove('hidden');
                if (typeof loadPerpulanganData === 'function') {
                    loadPerpulanganData();
                }
            } else {
                hubView.classList.remove('hidden');
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility();
                }
                if (typeof renderAdminAnalyticsChart === 'function') {
                    renderAdminAnalyticsChart(currentAdminAnalyticsRange || '7d');
                }
                if (typeof triggerAdminHubStaggerAnimation === 'function') {
                    triggerAdminHubStaggerAnimation();
                }

                // Preload data santri, pegawai & tahfidz agar KPI Dashboard Utama selalu aktual
                if (typeof loadAdminStudentsData === 'function') loadAdminStudentsData();
                if (typeof loadAdminEmployeesData === 'function') loadAdminEmployeesData();
                if (typeof loadAdminTahfidzData === 'function') loadAdminTahfidzData();
            }

            // Sembunyikan double header di layar mobile saat sub-view aktif
            const mobileNavBar = document.getElementById('admin-mobile-nav-bar');
            if (mobileNavBar) {
                if (!viewName || viewName === 'hub') {
                    mobileNavBar.classList.remove('hidden');
                } else {
                    mobileNavBar.classList.add('hidden');
                }
            }

            // Sinkronkan visibilitas tombol & aksi berdasarkan konfigurasi izin
            if (typeof applyAllRolePermissionsUI === 'function') {
                applyAllRolePermissionsUI();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        /**
         * Navigasi Kembali Pintar untuk Sub-View Admin:
         * - KHUSUS TAMPILAN MOBILE (< 1024px atau perangkat ponsel):
         *   Tombol kembali di SETIAP menu langsung mengembalikan pengguna ke Halaman Pengaturan (Tab Pengaturan / Pusat Kontrol),
         *   TIDAK diarahkan ke Dashboard Utama.
         * - Pada desktop (>= 1024px):
         *   Kembali ke Dashboard Utama Admin (Hub Menu).
         */
        function backFromAdminModule() {
            const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                if (typeof showAdminView === 'function') {
                    showAdminView('hub');
                }
                if (typeof switchTab === 'function') {
                    switchTab('pengaturan', false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
            }
            // Tampilan Desktop (>= 1024px): Kembali ke Dashboard Utama Admin
            showAdminView('hub');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.backFromAdminModule = backFromAdminModule;

