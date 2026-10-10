        // ==================== MOBILE SPLASH LOGIC ====================
        let isMobileSplashDone = false;

        function initMobileSplash() {
            const splashScreen = document.getElementById('mobile-splash-screen');
            const logoContainer = document.getElementById('mobile-splash-logo-container');

            // Jika di desktop atau splash tidak ada/tersembunyi, langsung tandai selesai
            if (!splashScreen || window.innerWidth >= 768 || window.getComputedStyle(splashScreen).display === 'none') {
                isMobileSplashDone = true;
                return;
            }

            // Tampilkan animasi logo
            setTimeout(() => {
                if (logoContainer) {
                    logoContainer.classList.remove('scale-110', 'opacity-0');
                    logoContainer.classList.add('scale-100', 'opacity-100');
                }
            }, 100);

            // Hilangkan perlahan setelah 2 detik
            setTimeout(() => {
                if (splashScreen) {
                    splashScreen.classList.add('opacity-0');
                }
                isMobileSplashDone = true;
                // Begitu logo splashscreen selesai dan mulai memudar, langsung panggil poster pop-up
                setTimeout(() => {
                    checkHomePosterPopup();
                }, 350);
            }, 2000);

            // Hapus dari DOM
            setTimeout(() => {
                if (splashScreen) {
                    splashScreen.style.display = 'none';
                }
            }, 3000);
        }

        // ==================== INISIALISASI UTAMA (SINGLE ONLOAD) ====================
        window.onload = function () {
            initThemeUI();
            initMobileSplash();
            initializeProgramRuntime();
            // Eksekusi paralel tanpa blocking waterfall (banner & notifikasi sudah diinisialisasi secepat kilat pada DOMContentLoaded)
            loadNews();
            loadGaleri();
            loadPengaturan();
            loadUnitKegiatan();
            if (typeof loadJadwalKegiatan === 'function') {
                loadJadwalKegiatan();
            }
            if (typeof renderCalendar === 'function') {
                try {
                    renderCalendar();
                } catch (calErr) {
                    console.warn("Calendar render skipped/error:", calErr);
                }
            }
            // Client-side routing dieksekusi secara independen agar deep link selalu aktif
            handleClientRouting();

            // Non-blocking ASNIdentity session hydration (tidak menghambat render aplikasi publik)
            if (typeof ASNIdentity !== 'undefined' && typeof ASNIdentity.hydrateSession === 'function') {
                ASNIdentity.hydrateSession().catch(err => {
                    console.warn("ASNIdentity background hydration error:", err);
                });
            }
        };

        // Render banner & notifikasi secepat kilat sebelum window.onload (Stale-While-Revalidate)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadBanners();
                loadNotifikasi();
                if (typeof loadJadwalKegiatan === 'function') loadJadwalKegiatan();
            });
        } else {
            loadBanners();
            loadNotifikasi();
            if (typeof loadJadwalKegiatan === 'function') loadJadwalKegiatan();
        }

        function navigateToNews() {
            const target = '/berita/';

            if (window.location.pathname !== target) {
                history.pushState({}, '', target);
            }

            switchTab('kabar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        function handleClientRouting() {
            // Cek URL fallback dari 404.html (GitHub Pages)
            const params = new URLSearchParams(window.location.search);
            const route = params.get('route');
            if (route) {
                window.history.replaceState({}, '', route);
            }

            const path = window.location.pathname.replace(/\/+$/, '') || '/';

            if (path === '/berita') {
                switchTab('kabar', false);
            } else if (path === '/tentang-kami') {
                switchTab('profil', false);
            } else if (path === '/sejarah-berdirinya') {
                switchTab('sejarah-berdirinya', false);
            } else if (path === '/tujuan-visi-misi') {
                switchTab('tujuan-visi-misi', false);
            } else if (path === '/struktur-kepengurusan') {
                switchTab('struktur-kepengurusan', false);
            } else if (path === '/pendidikan/semua-program-pilihan') {
                switchTab('program-pilihan', false);
            } else if (path === '/pendidikan/sd-islam-unggulan') {
                switchTab('sd-islam', false);
            } else if (path === '/pendidikan/pesantren-tahfidz-anak') {
                switchTab('tahfidz-anak', false);
            } else if (path === '/pendidikan/pesantren-dewasa-putra') {
                switchTab('dewasa-putra', false);
            } else if (path === '/pendidikan/pesantren-dewasa-putri') {
                switchTab('dewasa-putri', false);
            } else if (path === '/kehidupan-santri/jadwal-kegiatan') {
                switchTab('jadwal-kegiatan', false);
            } else if (path === '/kehidupan-santri/unit-kegiatan') {
                switchTab('unit-kegiatan', false);
            } else if (path === '/kehidupan-santri/poskestren') {
                switchTab('poskestren', false);
            } else if (path === '/administrator') {
                const isMobile = window.innerWidth < 768;
                const hasAdminToken = !!(
                    (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('asnawiyyah_admin_token') || sessionStorage.getItem('asnawiyyah_pengasuh_token'))) ||
                    (typeof localStorage !== 'undefined' && (localStorage.getItem('asnawiyyah_admin_token') || localStorage.getItem('asnawiyyah_pengasuh_token')))
                );
                if (isMobile && !isAdminLoggedIn && !hasAdminToken) {
                    window.history.replaceState({ tab: 'pengaturan' }, '', '/');
                    switchTab('pengaturan', false);
                } else {
                    switchTab('admin', false);
                }
            } else if (path === '/pengaturan') {
                const isMobile = window.innerWidth < 768;
                const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || 
                                (typeof ASNIdentity !== 'undefined' && (ASNIdentity.currentRole === 'admin' || ASNIdentity.currentRole === 'editor' || ASNIdentity.currentRole === 'PENGASUH' || (typeof isAsnAdminRole === 'function' && isAsnAdminRole(ASNIdentity.currentRole))));
                if (isMobile) {
                    window.history.replaceState({ tab: 'pengaturan' }, '', '/');
                    switchTab('pengaturan', false);
                } else if (isAdmin) {
                    window.history.replaceState({ tab: 'admin' }, '', '/administrator');
                    switchTab('admin', false);
                } else {
                    switchTab('pengaturan', false);
                }
            } else if (path === '/notifikasi') {
                  switchTab('notifikasi', false);
                  const notifIdParam = params.get('id');
                  if (notifIdParam) {
                      setTimeout(() => openNotifikasiDetail(notifIdParam), 400);
                  }
            } else if (path === '/kehidupan-santri/ikatan-alumni') {
                  switchTab('alumni', false);
              } else if (path === '/kehidupan-santri/ikatan-alumni/form-data-alumni') {
                  switchTab('form-alumni', false);
            } else if (path === '/layanan') {
                switchTab('layanan-hub', false);
            } else if (path === '/layanan/galeri') {
                switchTab('galeri', false);
            } else if (path === '/layanan/kalender') {
                switchTab('kalender', false);
            } else if (path === '/layanan/portal-ibadah') {
                switchTab('ibadah', false);
            } else if (path === '/layanan/portal-ibadah/maulid') {
                switchTab('maulid-hub', false);
            } else if (path === '/layanan/portal-ibadah/maulid/ad-dibai') {
                switchTab('maulid-index', false);
            } else if (path === '/layanan/portal-ibadah/maulid/ad-dibai/baca') {
                switchTab('maulid-detail', false);
            } else if (path === '/layanan/portal-ibadah/burdah') {
                if (typeof openBurdahIndex === 'function') openBurdahIndex();
                else switchTab('burdah-index', false);
            } else if (path === '/layanan/portal-ibadah/tahlil-dan-yasin') {
                if (typeof openTahlilYasinPage === 'function') openTahlilYasinPage();
                else switchTab('tahlil-yasin', false);
            } else if (path === '/layanan/portal-ibadah/quran/pojok') {
                if (typeof openQuranPojokIndexTab === 'function') openQuranPojokIndexTab();
                else switchTab('quran-index', false);
            } else if (path === '/layanan/portal-ibadah/quran/halaman') {
                switchTab('quran-page', false);
            } else if (path.startsWith('/berita/')) {
                const rawSlug = path.split('/berita/')[1];
                const slug = rawSlug ? decodeURIComponent(rawSlug.split('/')[0]).trim() : '';
                if (slug) {
                    bacaBerita(slug, true);
                }
            }

            const legacyId = params.get('id');
            if (legacyId) {
                bacaBerita(legacyId);
            }
        }
        window.addEventListener('popstate', (e) => {
            const path = window.location.pathname.replace(/\/+$/, '') || '/';
            if (path.startsWith('/berita/')) {
                const rawSlug = path.split('/berita/')[1];
                const slug = rawSlug ? decodeURIComponent(rawSlug.split('/')[0]).trim() : '';
                if (slug) bacaBerita(slug, true);
            } else if (path === '/berita') {
                switchTab('kabar', false);
            } else if (path === '/tentang-kami') {
                switchTab('profil', false);
            } else if (path === '/sejarah-berdirinya') {
                switchTab('sejarah-berdirinya', false);
            } else if (path === '/tujuan-visi-misi') {
                switchTab('tujuan-visi-misi', false);
            } else if (path === '/struktur-kepengurusan') {
                switchTab('struktur-kepengurusan', false);
            } else if (path === '/pendidikan/semua-program-pilihan') {
                switchTab('program-pilihan', false);
            } else if (path === '/pendidikan/sd-islam-unggulan') {
                switchTab('sd-islam', false);
            } else if (path === '/pendidikan/pesantren-tahfidz-anak') {
                switchTab('tahfidz-anak', false);
            } else if (path === '/pendidikan/pesantren-dewasa-putra') {
                switchTab('dewasa-putra', false);
            } else if (path === '/pendidikan/pesantren-dewasa-putri') {
                switchTab('dewasa-putri', false);
            } else if (path === '/kehidupan-santri/jadwal-kegiatan') {
                switchTab('jadwal-kegiatan', false);
            } else if (path === '/kehidupan-santri/unit-kegiatan') {
                switchTab('unit-kegiatan', false);
            } else if (path === '/kehidupan-santri/poskestren') {
                switchTab('poskestren', false);
            } else if (path === '/kehidupan-santri/ikatan-alumni') {
                  switchTab('alumni', false);
              } else if (path === '/kehidupan-santri/ikatan-alumni/form-data-alumni') {
                  switchTab('form-alumni', false);
            } else if (path === '/layanan') {
                switchTab('layanan-hub', false);
            } else if (path === '/layanan/galeri') {
                switchTab('galeri', false);
            } else if (path === '/layanan/kalender') {
                switchTab('kalender', false);
            } else if (path === '/layanan/portal-ibadah') {
                switchTab('ibadah', false);
            } else if (path === '/layanan/portal-ibadah/maulid') {
                switchTab('maulid-hub', false);
            } else if (path === '/layanan/portal-ibadah/maulid/ad-dibai') {
                switchTab('maulid-index', false);
            } else if (path === '/layanan/portal-ibadah/burdah') {
                if (typeof openBurdahIndex === 'function') openBurdahIndex();
                else switchTab('burdah-index', false);
            } else if (path === '/layanan/portal-ibadah/tahlil-dan-yasin') {
                if (typeof openTahlilYasinPage === 'function') openTahlilYasinPage();
                else switchTab('tahlil-yasin', false);
            } else if (path === '/layanan/portal-ibadah/quran/pojok') {
                if (typeof openQuranPojokIndexTab === 'function') openQuranPojokIndexTab();
                else switchTab('quran-index', false);
            } else if (path === '/layanan/portal-ibadah/quran/halaman') {
                switchTab('quran-page', false);
            } else if (path === '/administrator') {
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    window.history.replaceState({ tab: 'pengaturan' }, '', '/');
                    switchTab('pengaturan', false);
                } else {
                    switchTab('admin', false);
                }
            } else if (path === '/pengaturan') {
                const isMobile = window.innerWidth < 768;
                const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || (typeof ASNIdentity !== 'undefined' && (ASNIdentity.currentRole === 'admin' || ASNIdentity.currentRole === 'editor'));
                if (isMobile) {
                    window.history.replaceState({ tab: 'pengaturan' }, '', '/');
                    switchTab('pengaturan', false);
                } else if (isAdmin) {
                    window.history.replaceState({ tab: 'admin' }, '', '/administrator');
                    switchTab('admin', false);
                } else {
                    switchTab('pengaturan', false);
                }
            } else {
                switchTab('beranda', false);
            }
        });

        // ==================== SISTEM TABS (NAVIGASI SPA) ====================
        function scrollToSection(id) {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 300);
        }

        function switchTab(tabId, updateUrl = true, customUrl = null) {
            const hasAdminToken = !!(
                (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('asnawiyyah_admin_token') || sessionStorage.getItem('asnawiyyah_pengasuh_token'))) ||
                (typeof localStorage !== 'undefined' && (localStorage.getItem('asnawiyyah_admin_token') || localStorage.getItem('asnawiyyah_pengasuh_token')))
            );
            if (tabId === 'admin' && window.innerWidth < 768 && !isAdminLoggedIn && !hasAdminToken) {
                if (updateUrl) {
                    window.history.replaceState({ tab: 'pengaturan' }, '', '/');
                }
                switchTab('pengaturan', updateUrl);
                return;
            }

            if (tabId === 'pengaturan' && window.innerWidth >= 1024) {
                const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) || 
                                (typeof ASNIdentity !== 'undefined' && (ASNIdentity.currentRole === 'admin' || ASNIdentity.currentRole === 'editor' || ASNIdentity.currentRole === 'PENGASUH' || (typeof isAsnAdminRole === 'function' && isAsnAdminRole(ASNIdentity.currentRole))));
                if (isAdmin) {
                    switchTab('admin', updateUrl);
                    return;
                }
            }

            // Pada mobile, navigasi ke tab 'pengaturan' tidak memodifikasi URL browser (tetap di URL saat ini / bersih tanpa /pengaturan)
            if (tabId === 'pengaturan' && window.innerWidth < 1024) {
                updateUrl = false;
            }

            if (updateUrl) {
                let targetUrl = '/';
                if (customUrl) {
                    targetUrl = customUrl;
                } else if (tabId === 'profil') targetUrl = '/tentang-kami/';
                else if (tabId === 'sejarah-berdirinya') targetUrl = '/sejarah-berdirinya';
                else if (tabId === 'tujuan-visi-misi') targetUrl = '/tujuan-visi-misi';
                else if (tabId === 'struktur-kepengurusan') targetUrl = '/struktur-kepengurusan';
                else if (tabId === 'kabar') targetUrl = '/berita/';
                else if (tabId === 'program-pilihan') targetUrl = '/pendidikan/semua-program-pilihan/';
                else if (tabId === 'sd-islam') targetUrl = '/pendidikan/sd-islam-unggulan/';
                else if (tabId === 'tahfidz-anak') targetUrl = '/pendidikan/pesantren-tahfidz-anak/';
                else if (tabId === 'dewasa-putra') targetUrl = '/pendidikan/pesantren-dewasa-putra/';
                else if (tabId === 'dewasa-putri') targetUrl = '/pendidikan/pesantren-dewasa-putri/';
                else if (tabId === 'jadwal-kegiatan') targetUrl = '/kehidupan-santri/jadwal-kegiatan/';
                else if (tabId === 'unit-kegiatan') targetUrl = '/kehidupan-santri/unit-kegiatan/';
                else if (tabId === 'poskestren') targetUrl = '/kehidupan-santri/poskestren/';
                else if (tabId === 'admin') targetUrl = '/administrator';
                else if (tabId === 'pengaturan') targetUrl = '/pengaturan';
                else if (tabId === 'notifikasi') targetUrl = '/notifikasi';
                else if (tabId === 'alumni') targetUrl = '/kehidupan-santri/ikatan-alumni/';
                else if (tabId === 'form-alumni') targetUrl = '/kehidupan-santri/ikatan-alumni/form-data-alumni/';
                else if (tabId === 'layanan-hub') targetUrl = '/layanan/';
                else if (tabId === 'galeri') targetUrl = '/layanan/galeri/';
                else if (tabId === 'kalender') targetUrl = '/layanan/kalender/';
                else if (tabId === 'ibadah') targetUrl = '/layanan/portal-ibadah/';
                else if (tabId === 'quran-index') targetUrl = '/layanan/portal-ibadah/quran/';
                else if (tabId === 'quran-detail') targetUrl = '/layanan/portal-ibadah/quran/baca/';
                else if (tabId === 'maulid-hub') targetUrl = '/layanan/portal-ibadah/maulid/';
                else if (tabId === 'maulid-index') targetUrl = '/layanan/portal-ibadah/maulid/ad-dibai/';
                else if (tabId === 'maulid-detail') targetUrl = '/layanan/portal-ibadah/maulid/ad-dibai/baca/';
                else if (tabId === 'burdah-index') targetUrl = '/layanan/portal-ibadah/burdah/';
                else if (tabId === 'tahlil-yasin') targetUrl = '/layanan/portal-ibadah/tahlil-dan-yasin/';
                else if (tabId === 'quran-page') targetUrl = '/layanan/portal-ibadah/quran/halaman/';

                if (window.location.pathname !== targetUrl && (
                    tabId === 'profil' || tabId === 'sejarah-berdirinya' || tabId === 'tujuan-visi-misi' || tabId === 'struktur-kepengurusan' ||
                    tabId === 'kabar' || tabId === 'program-pilihan' ||
                    tabId === 'sd-islam' || tabId === 'tahfidz-anak' || tabId === 'dewasa-putra' || tabId === 'dewasa-putri' ||
                    tabId === 'jadwal-kegiatan' || tabId === 'unit-kegiatan' || tabId === 'poskestren' || tabId === 'admin' || tabId === 'pengaturan' || tabId === 'notifikasi' || tabId === 'alumni' || tabId === 'form-alumni' ||
                    tabId === 'layanan-hub' || tabId === 'galeri' || tabId === 'kalender' || tabId === 'ibadah' ||
                    tabId === 'quran-index' || tabId === 'quran-detail' || tabId === 'quran-page' ||
                    tabId === 'maulid-hub' || tabId === 'maulid-index' || tabId === 'maulid-detail' ||
                    tabId === 'burdah-index' || tabId === 'tahlil-yasin' ||
                    tabId === 'beranda')) {
                    history.pushState({ tab: tabId }, '', targetUrl);
                }
            }

            if (tabId === 'profil' || tabId === 'sejarah-berdirinya' || tabId === 'tujuan-visi-misi' || tabId === 'struktur-kepengurusan') {
                loadPublicProfilLembaga();
            }

            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('block');
            });

            const targetTab = document.getElementById(`page-${tabId}`);
            if (targetTab) {
                targetTab.classList.remove('hidden');
                if (!targetTab.classList.contains('flex')) {
                    targetTab.classList.add('block');
                }
            }

            // Sembunyikan header publik dan menu navigasi khusus saat membuka Dashboard Admin
            const mainDesktopHeader = document.getElementById('main-desktop-header');
            const mainMobileHeader = document.getElementById('main-mobile-header');
            const deskNavMenu = document.getElementById('desk-nav-menu');
            const deskActionMenu = document.getElementById('desk-action-menu');
            const mobileBottomNav = document.getElementById('mobile-bottom-nav');
            const mainFooter = document.querySelector('footer');

            if (tabId === 'admin') {
                // Sembunyikan header publik saat di dashboard admin
                if (mainDesktopHeader) mainDesktopHeader.style.display = 'none';
                if (mainMobileHeader) mainMobileHeader.style.display = 'none';
                if (deskNavMenu) deskNavMenu.style.display = 'none';
                if (deskActionMenu) deskActionMenu.style.display = 'none';
                if (mobileBottomNav) mobileBottomNav.style.display = 'none';
                if (mainFooter) mainFooter.style.display = 'none';
                const hasAdminToken = !!(
                    (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('asnawiyyah_admin_token') || sessionStorage.getItem('asnawiyyah_pengasuh_token'))) ||
                    (typeof localStorage !== 'undefined' && (localStorage.getItem('asnawiyyah_admin_token') || localStorage.getItem('asnawiyyah_pengasuh_token')))
                );
                if (!isAdminLoggedIn && !hasAdminToken) {
                    setTimeout(() => {
                        if (typeof openAdminAuthModal === 'function') {
                            openAdminAuthModal();
                        } else if (typeof openAdminLoginModal === 'function') {
                            openAdminLoginModal();
                        }
                    }, 100);
                }
            } else {
                // Kembalikan header publik — hapus inline style agar Tailwind classes berlaku kembali
                // Desktop header: class asli = "hidden md:block ..." (hidden di mobile, tampil di desktop)
                // Mobile header: class asli = "md:hidden ..." (tampil di mobile, hidden di desktop)
                if (mainDesktopHeader) mainDesktopHeader.style.removeProperty('display');
                if (mainMobileHeader) mainMobileHeader.style.removeProperty('display');
                if (deskNavMenu) deskNavMenu.style.removeProperty('display');
                if (deskActionMenu) deskActionMenu.style.removeProperty('display');
                if (mobileBottomNav) mobileBottomNav.style.removeProperty('display');
                if (mainFooter) mainFooter.style.removeProperty('display');
            }

            if (tabId === 'admin') {
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility();
                }
            } else if (tabId === 'alumni') {
                loadAlumniTestimonials();
            }
            if (tabId === 'form-alumni') {
                initWilayah();
            }
            if (tabId === 'quran-index') {
                fetchQuranList();
            } else if (tabId === 'maulid-index') {
                renderMaulidIndex();
            } else if (tabId === 'pengaturan') {
                if (typeof ASNIdentity !== 'undefined' && typeof ASNIdentity.renderAccountCenterUI === 'function') {
                    ASNIdentity.renderAccountCenterUI();
                }
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility();
                }
            } else if (tabId === 'notifikasi') {
                loadNotifikasi();
            } else if (tabId === 'beranda') {
                updateNotifBadge();
                checkHomePosterPopup();
            } else if (tabId === 'jadwal-sholat') {
                if (typeof ASNJadwalSholat !== 'undefined') {
                    ASNJadwalSholat.init();
                }
            } else if (tabId === 'kalender') {
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                }
            } else if (tabId === 'jadwal-kegiatan') {
                if (typeof renderPublicJadwalKegiatan === 'function') {
                    renderPublicJadwalKegiatan();
                }
            }

            // Nav Mobile
            document.querySelectorAll('.nav-mob-btn').forEach(btn => {
                btn.classList.remove('text-emerald-300', 'font-bold');
                btn.classList.add('text-white/80');
            });
            const activeMobBtn = document.getElementById(`mobile-nav-${tabId}`);
            if (activeMobBtn) {
                activeMobBtn.classList.remove('text-white/80');
                activeMobBtn.classList.add('text-emerald-300', 'font-bold');
            }

            // Nav Desktop
            document.querySelectorAll('.nav-desk-btn').forEach(btn => {
                btn.classList.remove('bg-brand-800', 'text-white');
                btn.classList.add('text-emerald-100', 'hover:bg-brand-800', 'hover:text-white');
            });
            const activeDeskBtn = document.getElementById(`desk-nav-${tabId}`);
            if (activeDeskBtn) {
                activeDeskBtn.classList.remove('text-emerald-100', 'hover:bg-brand-800', 'hover:text-white');
                activeDeskBtn.classList.add('bg-brand-800', 'text-white');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const NEWS_CACHE_KEY = 'asnawiyyah_news_cache';

        async function loadNews() {
            // 1. STALE (INSTANT): Render secepat kilat dalam 0 ms dari cache lokal jika ada
            try {
                const cached = localStorage.getItem(NEWS_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        mockNewsData = parsed;
                        renderAllNewsViews(mockNewsData);
                        checkPendingNewsRoute();
                    }
                } else if (Array.isArray(mockNewsData) && mockNewsData.length > 0) {
                    renderAllNewsViews(mockNewsData);
                    checkPendingNewsRoute();
                }
            } catch (e) {
                console.warn("Gagal membaca cache berita:", e);
            }

            if (!isApiConfigured()) return;

            // 2. REVALIDATE: Ambil pembaruan terkini dari backend di latar belakang tanpa memblokir UI
            try {
                const response = await apiGet("getKabar");
                if (response && response.status === "success" &&
                    Array.isArray(response.data) && response.data.length > 0) {
                    
                    // Proteksi Monotonik Views: Nilai views tidak boleh turun jika cache lokal/memori memiliki nilai lebih tinggi
                    const localViewsMap = new Map();
                    if (Array.isArray(mockNewsData)) {
                        mockNewsData.forEach(item => {
                            const key1 = String(item.news_id || item.id || '');
                            const key2 = String(item.slug || '');
                            const v = Number(item.views) || 0;
                            if (key1) localViewsMap.set(key1, Math.max(localViewsMap.get(key1) || 0, v));
                            if (key2) localViewsMap.set(key2, Math.max(localViewsMap.get(key2) || 0, v));
                        });
                    }

                    const mergedNews = response.data.map(serverItem => {
                        const key1 = String(serverItem.news_id || serverItem.id || '');
                        const key2 = String(serverItem.slug || '');
                        const localV = Math.max(localViewsMap.get(key1) || 0, localViewsMap.get(key2) || 0);
                        const serverV = Number(serverItem.views) || 0;
                        return {
                            ...serverItem,
                            views: Math.max(localV, serverV)
                        };
                    });

                    const newDataStr = JSON.stringify(mergedNews);
                    const oldDataStr = localStorage.getItem(NEWS_CACHE_KEY);

                    localStorage.setItem(NEWS_CACHE_KEY, newDataStr);
                    mockNewsData = mergedNews;

                    if (newDataStr !== oldDataStr) {
                        renderAllNewsViews(mockNewsData);
                    }
                }
                checkPendingNewsRoute();
            } catch (err) {
                console.error("Gagal memuat berita via API:", err);
                renderAllNewsViews(mockNewsData);
                checkPendingNewsRoute();
            }
        }

        function checkPendingNewsRoute() {
            const path = window.location.pathname.replace(/\/+$/, '') || '/';
            const params = new URLSearchParams(window.location.search);
            if (path.startsWith('/berita/') || params.get('id')) {
                handleClientRouting();
            }
        }

        function renderAllNewsViews(newsArray) {
            renderNews(newsArray);
            renderHeadlineNews(newsArray);
            renderAdminNewsList();
        }

              // ---------- FUNGSI HELPER EDITORIAL BERITA ----------
        function getNewsThumbnail(news) {
            const defaultNewsImage = "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=600&auto=format&fit=crop";
            let imgSource = (news && news.gambar && String(news.gambar).trim()) ? news.gambar : '';

            // Jika gambar kosong atau URL kopi lama, cari gambar pertama dari isi berita
            if ((!imgSource || imgSource.includes('photo-1584286595398-a59f21d313f5')) && news && news.isi) {
                const match = String(news.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match && match[1] && !match[1].includes('photo-1584286595398-a59f21d313f5')) {
                    imgSource = match[1];
                }
            }
            if (!imgSource || imgSource.includes('photo-1584286595398-a59f21d313f5')) {
                imgSource = defaultNewsImage;
            }
            return imgSource;
        }

        let activeNewsCategory = 'Semua';
        let activeNewsSearchKeyword = '';
        let newsSearchDebounceTimer = null;

        function applyNewsFilterAndSearch() {
            if (!mockNewsData || !Array.isArray(mockNewsData)) return;

            let result = [...mockNewsData];

            // Filter Kategori
            if (activeNewsCategory && activeNewsCategory !== 'Semua') {
                const catLower = activeNewsCategory.toLowerCase().trim();
                result = result.filter(n => {
                    const k = (n.kategori || '').toLowerCase();
                    const j = (n.judul || '').toLowerCase();
                    return k.includes(catLower) || j.includes(catLower);
                });
            }

            // Search Keyword
            if (activeNewsSearchKeyword && activeNewsSearchKeyword.trim() !== '') {
                const kw = activeNewsSearchKeyword.toLowerCase().trim();
                result = result.filter(n => {
                    const jud = (n.judul || '').toLowerCase();
                    const kat = (n.kategori || '').toLowerCase();
                    const ring = (n.ringkasan || '').toLowerCase();
                    const isi = (n.isi || '').toLowerCase();
                    const pen = (n.penulis || '').toLowerCase();
                    return jud.includes(kw) || kat.includes(kw) || ring.includes(kw) || isi.includes(kw) || pen.includes(kw);
                });
            }

            renderNews(result);
        }

        function handleNewsSearch(val) {
            activeNewsSearchKeyword = val || '';
            const clearBtn = document.getElementById('news-search-clear-btn');
            if (clearBtn) {
                if (activeNewsSearchKeyword.trim().length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
            if (newsSearchDebounceTimer) clearTimeout(newsSearchDebounceTimer);
            newsSearchDebounceTimer = setTimeout(() => {
                applyNewsFilterAndSearch();
            }, 180);
        }
        window.handleNewsSearch = handleNewsSearch;

        function clearNewsSearch() {
            const input = document.getElementById('news-search-input');
            const clearBtn = document.getElementById('news-search-clear-btn');
            if (input) input.value = '';
            if (clearBtn) clearBtn.classList.add('hidden');
            activeNewsSearchKeyword = '';
            applyNewsFilterAndSearch();
        }
        window.clearNewsSearch = clearNewsSearch;

        function filterNewsByCategory(category, btnElement) {
            activeNewsCategory = category || 'Semua';

            document.querySelectorAll('.filter-news-btn').forEach(btn => {
                btn.className = "filter-news-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-white/90 hover:bg-emerald-700/80 hover:text-white shrink-0 transition";
            });
            if (btnElement) {
                btnElement.className = "filter-news-btn active-news-filter px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-900 shadow-xs shrink-0 transition";
            }

            applyNewsFilterAndSearch();
        }
        window.filterNewsByCategory = filterNewsByCategory;

        // ---------- RENDER PORTAL BERITA GAYA NU ONLINE (TRI-COLUMN HERO) ----------
        function renderNews(newsArray) {
            const heroContainer = document.getElementById('nu-hero-container');
            const heroLeft = document.getElementById('nu-hero-left');
            const heroCenter = document.getElementById('nu-hero-center');
            const heroRight = document.getElementById('nu-hero-right');
            const emptyState = document.getElementById('nu-news-empty');
            const archiveSection = document.getElementById('nu-archive-section');
            const archiveCount = document.getElementById('nu-archive-count');
            const gridContainer = document.getElementById('news-grid-container');

            if (!gridContainer) return;

            // Bersihkan semua kontainer
            if (heroLeft) heroLeft.innerHTML = "";
            if (heroCenter) heroCenter.innerHTML = "";
            if (heroRight) heroRight.innerHTML = "";
            gridContainer.innerHTML = "";

            if (!newsArray || newsArray.length === 0) {
                if (heroContainer) heroContainer.classList.add('hidden');
                if (archiveSection) archiveSection.classList.add('hidden');
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');
            if (heroContainer) heroContainer.classList.remove('hidden');

            const defaultNewsImage = "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=600&auto=format&fit=crop";

            // Helper kartu berita sub-headline untuk kolom kiri dan kanan
            function createSubHeroCard(news, isLast = false) {
                const thumb = getNewsThumbnail(news);
                const viewsFormatted = Number(news.views || 0).toLocaleString('id-ID');
                const plainExcerpt = (news.ringkasan || news.isi || '').replace(/<[^>]*>?/gm, '').trim();

                const el = document.createElement('article');
                el.className = `group cursor-pointer flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-3 lg:gap-1.5 ${!isLast ? 'border-b border-dashed border-slate-200 dark:border-[#253447] pb-3' : ''}`;
                el.onclick = () => bacaBerita(news.news_id || news.slug);

                el.innerHTML = `
                    <div class="order-2 lg:order-1 w-24 h-20 sm:w-28 sm:h-24 lg:w-full lg:h-32 rounded-lg overflow-hidden relative bg-slate-100 dark:bg-[#1c2836] shrink-0">
                        <img src="${thumb}" alt="${escapeHtml(news.judul)}"
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onerror="this.onerror=null;this.src='${defaultNewsImage}';">
                        <span class="hidden lg:inline-block absolute top-1.5 left-1.5 bg-emerald-800/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                            ${escapeHtml(news.kategori)}
                        </span>
                    </div>
                    <div class="order-1 lg:order-2 flex-1 min-w-0 space-y-1">
                        <div class="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-400 font-medium flex-wrap">
                            <span class="inline-block lg:hidden bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">${escapeHtml(news.kategori)}</span>
                            <span>${news.tanggal}</span>
                            <span>•</span>
                            <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold" title="${viewsFormatted} kali dibaca">
                                <i class="fa-regular fa-eye mr-1"></i>
                                <span data-news-views-id="${news.news_id || news.slug}">${viewsFormatted}</span>
                            </span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                            ${news.judul}
                        </h4>
                        <p class="hidden sm:line-clamp-2 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                            ${plainExcerpt}
                        </p>
                    </div>
                `;
                return el;
            }

            // 1. Kolom Tengah: Berita Utama Besar (Headline Index 0)
            if (newsArray.length > 0 && heroCenter) {
                const mainNews = newsArray[0];
                const mainThumb = getNewsThumbnail(mainNews);
                const mainViews = Number(mainNews.views || 0).toLocaleString('id-ID');
                const mainPlain = (mainNews.ringkasan || mainNews.isi || '').replace(/<[^>]*>?/gm, '').trim();

                const centerEl = document.createElement('article');
                centerEl.className = "group cursor-pointer flex flex-col gap-2";
                centerEl.onclick = () => bacaBerita(mainNews.news_id || mainNews.slug);

                centerEl.innerHTML = `
                    <div class="w-full aspect-[16/10] sm:h-52 md:h-60 max-h-64 rounded-xl overflow-hidden relative bg-slate-900 shadow-sm">
                        <img src="${mainThumb}" alt="${escapeHtml(mainNews.judul)}"
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onerror="this.onerror=null;this.src='${defaultNewsImage}';">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                        <span class="absolute top-2.5 left-2.5 bg-emerald-700 text-white text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                            ${escapeHtml(mainNews.kategori)}
                        </span>
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center flex-wrap gap-2 text-[11px] text-slate-400 dark:text-slate-400">
                            <span class="text-emerald-700 dark:text-emerald-400 font-bold"><i class="fa-solid fa-pen-nib mr-1"></i>${escapeHtml(mainNews.penulis || 'Redaksi Asnawiyyah')}</span>
                            <span>•</span>
                            <span><i class="fa-regular fa-calendar mr-1"></i>${mainNews.tanggal}</span>
                            <span>•</span>
                            <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold" title="${mainViews} kali dibaca">
                                <i class="fa-regular fa-eye mr-1"></i>
                                <span data-news-views-id="${mainNews.news_id || mainNews.slug}">${mainViews}</span>
                            </span>
                        </div>
                        <h2 class="text-base sm:text-lg md:text-xl lg:text-2xl font-serif font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                            ${mainNews.judul}
                        </h2>
                        <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            ${mainPlain}
                        </p>
                        <div class="pt-0.5">
                            <span class="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 group-hover:gap-2 transition-all">
                                Baca Selengkapnya <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </span>
                        </div>
                    </div>
                `;
                heroCenter.appendChild(centerEl);
            }

            // 2. Kolom Kiri: 2 Berita Sub-Headline (Index 1 & 2)
            if (heroLeft) {
                const leftItems = newsArray.slice(1, 3);
                leftItems.forEach((n, i) => {
                    heroLeft.appendChild(createSubHeroCard(n, i === leftItems.length - 1));
                });
            }

            // 3. Kolom Kanan: 2 Berita Sub-Headline (Index 3 & 4)
            if (heroRight) {
                const rightItems = newsArray.slice(3, 5);
                rightItems.forEach((n, i) => {
                    heroRight.appendChild(createSubHeroCard(n, i === rightItems.length - 1));
                });
            }

            // 4. Arsip Berita (Index >= 5)
            const remainingNews = newsArray.slice(5);
            if (remainingNews.length > 0) {
                if (archiveSection) archiveSection.classList.remove('hidden');
                if (archiveCount) archiveCount.textContent = `${remainingNews.length} Berita Lainnya`;

                remainingNews.forEach(news => {
                    const card = document.createElement('article');
                    card.className = "bg-slate-50 dark:bg-[#1c2836] hover:bg-emerald-50/50 dark:hover:bg-[#253447] p-3 md:p-4 rounded-xl border border-slate-100 dark:border-[#253447] hover:border-emerald-200 dark:hover:border-emerald-500/40 flex flex-row md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer group transition duration-200";
                    card.onclick = () => bacaBerita(news.news_id || news.slug);

                    const imgSource = getNewsThumbnail(news);
                    const viewsFormatted = Number(news.views || 0).toLocaleString('id-ID');
                    const excerpt = (news.ringkasan || news.isi || '').replace(/<[^>]*>?/gm, '').trim();

                    card.innerHTML = `
                        <div class="order-2 md:order-1 w-24 h-20 sm:w-28 sm:h-24 md:w-full md:h-40 rounded-lg relative flex items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                            <img src="${imgSource}" alt="${escapeHtml(news.judul)}"
                                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onerror="this.onerror=null;this.src='${defaultNewsImage}';">
                            <span class="hidden md:inline-block absolute top-2.5 left-2.5 bg-emerald-800 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                                ${escapeHtml(news.kategori)}
                            </span>
                        </div>
                        <div class="order-1 md:order-2 flex-1 min-w-0 space-y-1">
                            <div class="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400 dark:text-slate-400">
                                <span class="inline-block md:hidden bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">${escapeHtml(news.kategori)}</span>
                                <span><i class="fa-solid fa-calendar mr-1"></i> ${news.tanggal}</span>
                                <span class="hidden sm:inline">•</span>
                                <span class="hidden sm:inline text-emerald-700 dark:text-emerald-400 font-semibold">${escapeHtml(news.penulis || 'Admin')}</span>
                                <span>•</span>
                                <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold" title="${viewsFormatted} kali dibaca">
                                    <i class="fa-regular fa-eye mr-1"></i>
                                    <span data-news-views-id="${news.news_id || news.slug}">${viewsFormatted}</span>
                                </span>
                            </div>
                            <h3 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                                ${news.judul}
                            </h3>
                            <p class="hidden sm:line-clamp-2 text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                                ${excerpt}
                            </p>
                        </div>
                    `;
                    gridContainer.appendChild(card);
                });
            } else {
                if (archiveSection) archiveSection.classList.add('hidden');
            }
        }

        // ---------- RENDER HEADLINE BERITA DI BERANDA (LANDING PAGE) ----------
        function renderHeadlineNews(newsArray) {
            const containerMobile = document.getElementById('headline-news-container');
            const containerDesktop = document.getElementById('headline-news-container-desktop');
            const topHeadline = (newsArray || []).slice(0, 3);
            const defaultThumb = "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=400&auto=format&fit=crop";

            // Mobile Render
            if (containerMobile) {
                containerMobile.innerHTML = "";
                topHeadline.forEach((news, idx) => {
                    const item = document.createElement('article');
                    item.className = `flex items-center justify-between gap-3 ${idx < topHeadline.length - 1 ? 'border-b border-slate-100 dark:border-[#253447] pb-4' : ''} cursor-pointer group`;
                    item.onclick = () => bacaBerita(news.news_id || news.slug);
                    const thumbSrc = getNewsThumbnail(news);
                    const viewsFormatted = Number(news.views || 0).toLocaleString('id-ID');
                    item.innerHTML = `
                        <div class="space-y-1.5 flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="inline-block px-2.5 py-0.5 bg-emerald-700 text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider">${escapeHtml(news.kategori)}</span>
                                <span class="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold" title="${viewsFormatted} kali dibaca">
                                    <i class="fa-regular fa-eye mr-1"></i>
                                    <span data-news-views-id="${news.news_id || news.slug}">${viewsFormatted}</span>
                                </span>
                            </div>
                            <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                                ${news.judul}
                            </h4>
                        </div>
                        <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-[#253447] bg-slate-100 dark:bg-[#1c2836]">
                            <img src="${thumbSrc}" alt="${escapeHtml(news.judul)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.onerror=null;this.src='${defaultThumb}';">
                        </div>
                    `;
                    containerMobile.appendChild(item);
                });
            }

            // Desktop Render (Editorial Nuansa NU Online)
            if (containerDesktop) {
                containerDesktop.innerHTML = "";
                if (topHeadline.length > 0) {
                    const bigNews = topHeadline[0];
                    const bigThumb = getNewsThumbnail(bigNews);
                    const plainContent = (bigNews.ringkasan || bigNews.isi || "").replace(/<[^>]*>?/gm, '').trim();
                    const viewsFormatted = Number(bigNews.views || 0).toLocaleString('id-ID');

                    let html = `
                        <!-- Featured Big Headline -->
                        <div class="grid grid-cols-12 gap-5 bg-white dark:bg-[#15202d] p-5 rounded-2xl border border-slate-200/80 dark:border-[#253447] shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/40 transition">
                            <div class="col-span-6 rounded-xl overflow-hidden cursor-pointer aspect-[16/10] bg-slate-900" onclick="bacaBerita('${bigNews.news_id || bigNews.slug}')">
                                <img src="${bigThumb}" alt="${escapeHtml(bigNews.judul)}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.onerror=null;this.src='${defaultThumb}';">
                            </div>
                            <div class="col-span-6 flex flex-col justify-between py-1">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex-wrap">
                                        <span class="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold uppercase text-[10px]">${escapeHtml(bigNews.kategori)}</span>
                                        <span>•</span>
                                        <span>${bigNews.tanggal}</span>
                                        <span>•</span>
                                        <span class="inline-flex items-center font-bold" title="${viewsFormatted} kali dibaca">
                                            <i class="fa-regular fa-eye mr-1"></i>
                                            <span data-news-views-id="${bigNews.news_id || bigNews.slug}">${viewsFormatted}</span>
                                        </span>
                                    </div>
                                    <h4 onclick="bacaBerita('${bigNews.news_id || bigNews.slug}')"
                                        class="font-black font-serif text-lg text-slate-900 dark:text-slate-100 leading-snug hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer line-clamp-2">
                                        ${bigNews.judul}
                                    </h4>
                                    <p class="text-xs text-slate-500 dark:text-slate-300 line-clamp-3 leading-relaxed">
                                        ${plainContent}
                                    </p>
                                </div>
                                <button onclick="bacaBerita('${bigNews.news_id || bigNews.slug}')"
                                    class="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200 inline-flex items-center gap-1.5 pt-3 group">
                                    Baca Selengkapnya <span class="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    `;

                    // Sub-Headlines di bawah Headline Utama
                    if (topHeadline.length > 1) {
                        html += `<div class="grid grid-cols-2 gap-4 mt-5">`;
                        for (let i = 1; i < topHeadline.length; i++) {
                            const smallNews = topHeadline[i];
                            const smThumb = getNewsThumbnail(smallNews);
                            const smViews = Number(smallNews.views || 0).toLocaleString('id-ID');
                            html += `
                                <div onclick="bacaBerita('${smallNews.news_id || smallNews.slug}')"
                                    class="bg-white dark:bg-[#15202d] p-3.5 rounded-xl border border-slate-200/70 dark:border-[#253447] hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-xs transition cursor-pointer flex gap-3 group">
                                    <div class="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-[#1c2836]">
                                        <img src="${smThumb}" alt="${escapeHtml(smallNews.judul)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="this.onerror=null;this.src='${defaultThumb}';">
                                    </div>
                                    <div class="min-w-0 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div class="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                <span class="uppercase tracking-wider font-bold">${escapeHtml(smallNews.kategori)}</span>
                                                <span>•</span>
                                                <span>${smallNews.tanggal}</span>
                                            </div>
                                            <h5 class="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 leading-snug transition">
                                                ${smallNews.judul}
                                            </h5>
                                        </div>
                                        <div class="text-[10px] text-slate-400 pt-1">
                                            <span class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold" title="${smViews} kali dibaca">
                                                <i class="fa-regular fa-eye mr-1"></i>
                                                <span data-news-views-id="${smallNews.news_id || smallNews.slug}">${smViews}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        html += `</div>`;
                    }
                    containerDesktop.innerHTML = html;
                }
            }
        }

        let currentActiveNews = null;

        // ---------- FONT SIZE RESIZER UNTUK PEMBACA BERITA ----------
        function setNewsReaderFontSize(sizeKey = 'base') {
            const bodyEl = document.getElementById('detail-news-body');
            const btnSm = document.getElementById('btn-font-sm');
            const btnBase = document.getElementById('btn-font-base');
            const btnLg = document.getElementById('btn-font-lg');

            const activeBtnClass = "bg-brand-700 text-white shadow-xs";
            const inactiveBtnClass = "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

            [btnSm, btnBase, btnLg].forEach(b => {
                if (!b) return;
                b.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition " + inactiveBtnClass;
            });

            let fontSize = "15px";
            let lineHeight = "1.85";

            if (sizeKey === 'sm') {
                fontSize = "13px";
                lineHeight = "1.75";
                if (btnSm) btnSm.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition " + activeBtnClass;
            } else if (sizeKey === 'lg') {
                fontSize = "18px";
                lineHeight = "1.95";
                if (btnLg) btnLg.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition " + activeBtnClass;
            } else {
                sizeKey = 'base';
                fontSize = "15px";
                lineHeight = "1.85";
                if (btnBase) btnBase.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition " + activeBtnClass;
            }

            if (bodyEl) {
                bodyEl.style.fontSize = fontSize;
                bodyEl.style.lineHeight = lineHeight;
            }

            try {
                localStorage.setItem('asnawiyyah_news_font_size', sizeKey);
            } catch (e) {}
        }

        function initNewsReaderFontSize() {
            try {
                const saved = localStorage.getItem('asnawiyyah_news_font_size') || 'base';
                setNewsReaderFontSize(saved);
            } catch (e) {
                setNewsReaderFontSize('base');
            }
        }

        // ---------- TOMBOL SHARE BERITA (WHATSAPP, FACEBOOK, SALIN TAUTAN) ----------
        function getNewsShareUrl() {
            if (currentActiveNews && currentActiveNews.slug) {
                return `${window.location.origin}/berita/${currentActiveNews.slug}`;
            }
            return window.location.href;
        }

        function shareNewsViaWhatsApp() {
            const url = getNewsShareUrl();
            const title = (currentActiveNews && currentActiveNews.judul) ? currentActiveNews.judul : document.title;
            const text = `*${title}*\n\nBaca warta selengkapnya melalui portal resmi Pesantren Asnawiyyah:\n${url}`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        }

        function shareNewsViaFacebook() {
            const url = getNewsShareUrl();
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            window.open(fbUrl, '_blank', 'width=600,height=500');
        }

        async function copyShareLink() {
            const url = getNewsShareUrl();
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(url);
                } else {
                    const tempInput = document.createElement('input');
                    tempInput.value = url;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
                showToast("✅ Tautan berita berhasil disalin ke clipboard!");
            } catch (err) {
                showToast("⚠️ Gagal menyalin tautan: " + err.message);
            }
        }

        // ---------- PENCATATAN VIEW BERITA ATOMIK (NON-BLOCKING) ----------
        function recordNewsViewApi(news) {
            if (!news || !news.news_id) return;
            const storageKey = `asnawiyyah_viewed_news_${news.news_id}`;
            try {
                if (sessionStorage.getItem(storageKey)) {
                    // Sudah dihitung dalam sesi browser ini, hindari duplikasi
                    return;
                }
                sessionStorage.setItem(storageKey, '1');
            } catch (e) {}

            // Increment visual counter secara instan
            news.views = (Number(news.views) || 0) + 1;
            const formatted = Number(news.views).toLocaleString('id-ID');
            const viewsCountEl = document.getElementById('detail-news-views-count');
            if (viewsCountEl) {
                viewsCountEl.innerText = formatted;
            }

            // Sinkronkan elemen view di Headline & Menu Berita secara instan jika ada di DOM
            document.querySelectorAll(`[data-news-views-id="${news.news_id}"], [data-news-views-id="${news.slug}"]`).forEach(el => {
                el.innerText = formatted;
            });

            // Perbarui cache lokal seketika agar saat reload sebelum server sync selesai, angka tidak kembali turun
            try {
                if (Array.isArray(mockNewsData)) {
                    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(mockNewsData));
                }
            } catch (e) {}

            // Sync ke backend GAS & Supabase secara asinkron tanpa memblokir pembaca
            if (isApiConfigured()) {
                apiPost("recordNewsView", {
                    news_id: news.news_id,
                    slug: news.slug,
                    views: Number(news.views) || 0
                }).catch(err => {
                    console.warn("recordNewsView background sync failed:", err);
                });
            }
        }

        async function fetchSingleNewsDirectly(idOrSlug) {
            if (!idOrSlug) return null;
            try {
                const sbUrl = (window.ASNAWIYYAH_CONFIG && window.ASNAWIYYAH_CONFIG.supabaseUrl) || "https://tkjhfhyabacbyknwrysh.supabase.co";
                const sbKey = (window.ASNAWIYYAH_CONFIG && window.ASNAWIYYAH_CONFIG.supabaseKey) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";
                const enc = encodeURIComponent(String(idOrSlug).trim());
                const res = await fetch(`${sbUrl}/rest/v1/berita?or=(slug.eq.${enc},news_id.eq.${enc})&limit=1`, {
                    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` }
                });
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    const row = rows[0];
                    const serverViews = Number(row.views) || 0;
                    let localViews = 0;
                    if (Array.isArray(mockNewsData)) {
                        const localItem = mockNewsData.find(n => n.news_id === row.news_id || n.slug === row.slug);
                        if (localItem) localViews = Number(localItem.views) || 0;
                    }
                    row.views = Math.max(localViews, serverViews);
                    return row;
                }
            } catch (err) {
                console.warn("fetchSingleNewsDirectly error:", err);
            }
            return null;
        }

        function bacaBerita(id, skipHistory = false) {
            const cleanId = typeof id === 'string' ? decodeURIComponent(id).trim() : id;
            let news = (Array.isArray(mockNewsData) ? mockNewsData : []).find(n => n.news_id === cleanId || n.slug === cleanId || n.news_id === id || n.slug === id);
            if (!news) {
                // Ambil langsung artikel ini dari Cloud Supabase (<50ms) jika belum dimuat dalam cache lokal
                fetchSingleNewsDirectly(cleanId || id).then(directNews => {
                    if (directNews) {
                        if (!Array.isArray(mockNewsData)) mockNewsData = [];
                        if (!mockNewsData.find(n => n.news_id === directNews.news_id)) {
                            mockNewsData.unshift(directNews);
                        }
                        bacaBerita(directNews.slug || directNews.news_id, skipHistory);
                    }
                }).catch(e => console.warn("Fetch single news direct error:", e));
                return;
            }

            currentActiveNews = news;

            if (!skipHistory) {
                const canonicalUrl = `/berita/${news.slug}`;
                if (window.location.pathname !== canonicalUrl) {
                    window.history.pushState({ id: news.news_id }, news.judul, canonicalUrl);
                }
            }

            const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
            if (activeTabEl && activeTabEl.id !== 'page-detail-berita') {
                previousTabBeforeNews = activeTabEl.id.replace('page-', '');
            }

            document.getElementById('detail-news-title').innerText = news.judul || '';
            document.getElementById('detail-news-badge').innerText = news.kategori || 'Kabar';
            document.getElementById('detail-news-date').innerHTML = `<i class="fa-solid fa-calendar mr-1"></i> ${news.tanggal || '-'}`;
            document.getElementById('detail-news-author').innerText = news.penulis || 'Admin';

            // Jumlah Views
            const viewsCountEl = document.getElementById('detail-news-views-count');
            if (viewsCountEl) {
                const initialViews = Number(news.views) || 0;
                viewsCountEl.innerText = initialViews.toLocaleString('id-ID');
            }

            // Panggil API pencatatan view
            recordNewsViewApi(news);

            const summaryBox = document.getElementById('detail-news-summary-box');
            const summaryEl = document.getElementById('detail-news-summary');
            if (news.ringkasan && news.ringkasan.trim() !== '') {
                summaryEl.innerText = news.ringkasan;
                summaryBox.classList.remove('hidden');
            } else {
                summaryBox.classList.add('hidden');
            }

            // Render isi berita (dukungan rich content HTML & backwards compatibility plain text)
            const bodyEl = document.getElementById('detail-news-body');
            if (bodyEl) {
                let rawContent = news.isi || '';
                if (/<[a-z][\s\S]*>/i.test(rawContent)) {
                    // Sanitasi tag berbahaya seperti <script>
                    const cleanHtml = rawContent
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/\bon\w+="[^"]*"/gi, '')
                        .replace(/\bon\w+='[^']*'/gi, '');
                    bodyEl.innerHTML = cleanHtml;
                } else {
                    // Konversi artikel teks lama
                    const formattedParas = rawContent
                        .split('\n\n')
                        .map(para => `<p class="mb-3">${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
                        .join('');
                    bodyEl.innerHTML = formattedParas || '<p class="text-slate-400 italic">Belum ada rincian berita.</p>';
                }
            }

            // Terapkan ukuran font tersimpan
            initNewsReaderFontSize();

            const imgEl = document.getElementById('detail-news-img');
            const imgContainer = document.getElementById('detail-news-img-container');
            let coverImg = (news.gambar && news.gambar.trim() !== '') ? news.gambar : '';

            // Jika cover kosong atau URL kopi lama, ekstrak dari isi berita
            if ((!coverImg || coverImg.includes('photo-1584286595398-a59f21d313f5')) && news.isi) {
                const match = String(news.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match && match[1] && !match[1].includes('photo-1584286595398-a59f21d313f5')) {
                    coverImg = match[1];
                }
            }

            if (coverImg && !coverImg.includes('photo-1584286595398-a59f21d313f5')) {
                imgEl.src = coverImg;
                imgContainer.classList.remove('hidden');
            } else {
                imgContainer.classList.add('hidden');
            }

            switchTab('detail-berita');
        }

        function kembaliDariBerita() {
            if (window.location.pathname.startsWith('/berita/')) {
                window.history.pushState(null, '', '/');
            }
            switchTab(previousTabBeforeNews || 'beranda');
        }

        // ==================== SLIDER BANNER BERANDA (OPTIMIZED SWR) ====================
        const BANNER_CACHE_KEY = 'asnawiyyah_banner_cache';

        function optimizeImageUrl(url, width = 1000) {
            if (!url || typeof url !== 'string') return '';
            // Google Drive direct user content
            if (url.includes('googleusercontent.com')) {
                const cleanUrl = url.split('=')[0];
                return `${cleanUrl}=w${width}-rw`;
            }
            // Unsplash images
            if (url.includes('images.unsplash.com')) {
                try {
                    const u = new URL(url);
                    u.searchParams.set('auto', 'format');
                    u.searchParams.set('fit', 'crop');
                    u.searchParams.set('q', '80');
                    u.searchParams.set('w', String(width));
                    return u.toString();
                } catch (e) {
                    return url;
                }
            }
            return url;
        }

        let _isBannerFetching = false;
        async function loadBanners() {
            // 1. STALE: Coba render secepat kilat dari cache lokal jika ada
            try {
                const cached = localStorage.getItem(BANNER_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        mockBannerData = parsed;
                        renderHeroSlider();
                        if (typeof renderAdminBannerList === 'function') renderAdminBannerList();
                    }
                } else if (Array.isArray(mockBannerData) && mockBannerData.length > 0) {
                    renderHeroSlider();
                    if (typeof renderAdminBannerList === 'function') renderAdminBannerList();
                }
            } catch (e) {
                console.warn("Gagal membaca cache banner:", e);
            }

            if (!isApiConfigured() || _isBannerFetching) return;
            _isBannerFetching = true;

            // 2. REVALIDATE: Ambil data segar dari backend di background
            try {
                const response = await apiGet("getBanner");
                if (response && response.status === "success" &&
                    Array.isArray(response.data) && response.data.length > 0) {
                    const newDataStr = JSON.stringify(response.data);
                    const oldDataStr = localStorage.getItem(BANNER_CACHE_KEY);

                    localStorage.setItem(BANNER_CACHE_KEY, newDataStr);
                    mockBannerData = response.data;

                    // Update UI jika ada perubahan data dari cache sebelumnya
                    if (newDataStr !== oldDataStr) {
                        renderHeroSlider();
                        if (typeof renderAdminBannerList === 'function') renderAdminBannerList();
                    }
                }
            } catch (err) {
                console.error("Gagal memuat banner via API:", err);
            } finally {
                _isBannerFetching = false;
            }
        }

        function renderHeroSlider() {
            const isDesktop = window.innerWidth >= 768;
            const sliderPairs = [
                {
                    slider: document.getElementById('hero-slider-container'),
                    dots: document.getElementById('hero-dots-container'),
                    type: 'mobile'
                },
                {
                    slider: document.getElementById('hero-slider-container-desktop'),
                    dots: document.getElementById('hero-dots-container-desktop'),
                    type: 'desktop'
                }
            ];

            const activeBanners = mockBannerData.filter(b => b.status === "Aktif");
            const labelMap = { ppdb: 'Pendaftaran', kabar: 'Berita', 'program-pilihan': 'Program', profil: 'Profil', galeri: 'Galeri', alumni: 'Alumni', beranda: 'Beranda', 'jadwal-kegiatan': 'Jadwal', 'unit-kegiatan': 'Unit', poskestren: 'Poskestren' };

            sliderPairs.forEach(({ slider, dots, type }) => {
                if (!slider || !dots) return;

                if (activeBanners.length === 0) {
                    const emptyClass = type === 'desktop'
                        ? 'w-full h-full flex items-center justify-center text-emerald-400/60 text-xs italic'
                        : 'w-full h-full flex items-center justify-center text-slate-400 text-xs italic bg-slate-100 dark:bg-[#15202d]';
                    slider.innerHTML = `<div class="${emptyClass}">Belum ada banner aktif.</div>`;
                    dots.innerHTML = "";
                    return;
                }

                slider.innerHTML = "";
                dots.innerHTML = "";

                const isCurrentViewport = (type === 'desktop' && isDesktop) || (type === 'mobile' && !isDesktop);
                const targetWidth = type === 'desktop' ? 1200 : 750;

                activeBanners.forEach((banner, idx) => {
                    const slideDiv = document.createElement('div');
                    slideDiv.className = `hero-slide absolute inset-0 transition-opacity duration-500 cursor-pointer ${idx === 0 ? 'opacity-100' : 'opacity-0'}`;

                    if (banner.tipeAksi === "tab" && banner.targetAksi) {
                        slideDiv.onclick = () => switchTab(banner.targetAksi);
                    } else if (banner.tipeAksi === "url" && banner.targetAksi) {
                        slideDiv.onclick = () => window.open(banner.targetAksi, '_blank');
                    }

                    const optImgUrl = optimizeImageUrl(banner.gambar, targetWidth);
                    // Atribut prioritas pemuatan:
                    // Slide 0 pada viewport aktif: eager + high priority untuk LCP instan
                    // Slide lainnya atau viewport tersembunyi: lazy loading
                    const isEager = isCurrentViewport && idx === 0;
                    const loadingAttr = isEager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';

                    if (type === 'desktop') {
                        const label = banner.tipeAksi === 'tab' ? (labelMap[banner.targetAksi] || banner.targetAksi || 'Info') : (banner.tipeAksi === 'url' ? 'Tautan' : 'Info');
                        slideDiv.innerHTML = `
                            <img src="${optImgUrl}" alt="${escapeHtml(banner.nama)}" class="w-full h-full object-cover" ${loadingAttr} decoding="async">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                                <div>
                                    <span class="px-2.5 py-1 rounded bg-emerald-500 text-xs font-bold text-slate-950 uppercase">${escapeHtml(label)}</span>
                                    <p class="text-sm font-medium text-white mt-1">${escapeHtml(banner.nama)}</p>
                                </div>
                            </div>`;
                    } else {
                        slideDiv.innerHTML = `<img src="${optImgUrl}" alt="${escapeHtml(banner.nama)}" class="w-full h-full object-cover" ${loadingAttr} decoding="async">`;
                    }

                    slider.appendChild(slideDiv);

                    const dotBtn = document.createElement('button');
                    dotBtn.className = `hero-dot rounded-full transition-all duration-300 ${idx === 0 ? 'w-2.5 h-2.5 bg-brand-700 dark:bg-emerald-400' : 'w-2 h-2 bg-slate-300 dark:bg-slate-600'}`;
                    dotBtn.onclick = () => setHeroSlide(idx);
                    dots.appendChild(dotBtn);
                });
            });

            currentHeroSlide = 0;
            if (heroSlideTimer) clearInterval(heroSlideTimer);

            if (activeBanners.length > 1) {
                heroSlideTimer = setInterval(() => {
                    const activeSelector = isDesktop ? '#hero-slider-container-desktop .hero-slide' : '#hero-slider-container .hero-slide';
                    const slides = document.querySelectorAll(activeSelector);
                    if (slides.length > 0) {
                        currentHeroSlide = (currentHeroSlide + 1) % slides.length;
                        setHeroSlide(currentHeroSlide);
                    }
                }, 4000);
            }
        }

        function setHeroSlide(index) {
            currentHeroSlide = index;

            const containers = [
                { slides: document.querySelectorAll('#hero-slider-container .hero-slide'), dots: document.querySelectorAll('#hero-dots-container .hero-dot') },
                { slides: document.querySelectorAll('#hero-slider-container-desktop .hero-slide'), dots: document.querySelectorAll('#hero-dots-container-desktop .hero-dot') }
            ];

            containers.forEach(({ slides, dots }) => {
                if (!slides.length) return;

                slides.forEach((slide, i) => {
                    if (i === index) {
                        slide.classList.remove('opacity-0');
                        slide.classList.add('opacity-100');
                    } else {
                        slide.classList.remove('opacity-100');
                        slide.classList.add('opacity-0');
                    }
                });

                dots.forEach((dot, i) => {
                    if (i === index) {
                        dot.className = "hero-dot w-2.5 h-2.5 rounded-full bg-brand-700 dark:bg-emerald-400 transition-all duration-300";
                    } else {
                        dot.className = "hero-dot w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 transition-all duration-300";
                    }
                });
            });
        }


        // ==================== FITUR PENGATURAN USER ====================
        function initThemeUI() {
            const isDark = document.documentElement.classList.contains('dark');
            const toggle = document.getElementById('dark-mode-toggle');
            const icon = document.getElementById('theme-icon');
            const text = document.getElementById('theme-status-text');

            if (toggle) toggle.checked = isDark;
            if (icon) {
                icon.className = isDark ? "fa-solid fa-moon text-indigo-400" : "fa-solid fa-sun text-amber-500";
            }
            if (text) {
                text.innerText = isDark ? "Mode Gelap (Dark)" : "Mode Terang (Light)";
            }
            if (typeof window.applyMushafTheme === 'function') {
                window.applyMushafTheme();
            }
        }

        function toggleDarkMode(isDark) {
            const icon = document.getElementById('theme-icon');
            const text = document.getElementById('theme-status-text');
            const toggle = document.getElementById('dark-mode-toggle');

            if (toggle && toggle.checked !== isDark) {
                toggle.checked = isDark;
            }

            if (isDark) {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
                localStorage.setItem('asnawiyyah_theme', 'dark');
                if (icon) icon.className = "fa-solid fa-moon text-indigo-400";
                if (text) text.innerText = "Mode Gelap (Dark)";
                showToast("Mode Gelap diaktifkan");
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                localStorage.setItem('asnawiyyah_theme', 'light');
                if (icon) icon.className = "fa-solid fa-sun text-amber-500";
                if (text) text.innerText = "Mode Terang (Light)";
                showToast("Mode Terang diaktifkan");
            }

            if (typeof window.applyMushafTheme === 'function') {
                window.applyMushafTheme();
            }
        }

        function openEditProfileModal() { document.getElementById('editProfileModal').classList.remove('hidden'); }
        function closeEditProfileModal() { document.getElementById('editProfileModal').classList.add('hidden'); }

        function saveProfileChanges() {
            const name = document.getElementById('edit-nama-input').value;
            const email = document.getElementById('edit-email-input').value;
            const phone = document.getElementById('edit-phone-input').value;

            if (name) document.getElementById('user-display-name').innerText = name;
            if (email) document.getElementById('user-display-email').innerHTML = `<i class="fa-regular fa-envelope mr-1"></i> ${email}`;
            if (phone) document.getElementById('user-display-phone').innerHTML = `<i class="fa-brands fa-whatsapp mr-1 text-emerald-600"></i> ${phone}`;

            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=15803d&color=fff&size=128`;
            closeEditProfileModal();
            showToast("Profil berhasil diperbarui!");
        }

        function updatePrayerLocation(cityKey) {
            if (typeof ASNJadwalSholat !== 'undefined') {
                ASNJadwalSholat.changeCity(cityKey);
            } else {
                showToast(`Lokasi shalat diubah ke: ${cityKey}`);
            }
        }

        function togglePrayerNotification(enabled) {
            if (typeof ASNJadwalSholat !== 'undefined') {
                ASNJadwalSholat.toggleNotification(enabled);
            } else {
                showToast(enabled ? "Notifikasi Azan diaktifkan" : "Notifikasi Azan dinonaktifkan");
            }
        }

        function testPrayerNotificationAudio() {
            if (typeof ASNJadwalSholat !== 'undefined') {
                ASNJadwalSholat.playPrayerChime(true);
                const city = ASNJadwalSholat.getCurrentCity();
                showToast(`🔔 Uji coba azan berbunyi untuk wilayah ${city.name}!`);
            }
        }

        function stopPrayerNotificationAudio() {
            if (typeof ASNJadwalSholat !== 'undefined') {
                ASNJadwalSholat.stopPrayerAudio();
                showToast("Suara azan dihentikan");
            }
        }
        window.updatePrayerLocation = updatePrayerLocation;
        window.togglePrayerNotification = togglePrayerNotification;
        window.testPrayerNotificationAudio = testPrayerNotificationAudio;
        window.stopPrayerNotificationAudio = stopPrayerNotificationAudio;
        function openFeedbackModal() { document.getElementById('feedbackModal').classList.remove('hidden'); }
        function closeFeedbackModal() { document.getElementById('feedbackModal').classList.add('hidden'); }

        function submitFeedback() {
            const text = document.getElementById('feedback-textarea').value.trim();
            if (!text) {
                showToast("Mohon tuliskan masukan Anda terlebih dahulu!");
                return;
            }
            document.getElementById('feedback-textarea').value = "";
            closeFeedbackModal();
            showToast("Terima kasih! Masukan Anda telah terkirim.");
        }

        function toggleAuthSession() {
            const btnIcon = document.getElementById('auth-btn-icon');
            const btnText = document.getElementById('auth-btn-text');
            const authBtn = document.getElementById('auth-btn');
            const mobileHeaderAuthIcon = document.getElementById('mobile-header-auth-icon');

            if (isLoggedIn) {
                isLoggedIn = false;
                if (btnIcon) btnIcon.className = "fa-solid fa-right-to-bracket";
                if (btnText) btnText.innerText = "Masuk ke Akun (Log In)";
                if (authBtn) authBtn.className = "w-full bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold py-3.5 px-6 rounded-2xl border border-brand-100 transition flex items-center justify-center space-x-2";
                if (mobileHeaderAuthIcon) mobileHeaderAuthIcon.className = "fa-solid fa-right-to-bracket";
                showToast("Anda telah keluar dari akun.");
            } else {
                isLoggedIn = true;
                if (btnIcon) btnIcon.className = "fa-solid fa-right-from-bracket";
                if (btnText) btnText.innerText = "Keluar dari Akun (Log Out)";
                if (authBtn) authBtn.className = "w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3.5 px-6 rounded-2xl border border-rose-100 transition flex items-center justify-center space-x-2";
                if (mobileHeaderAuthIcon) mobileHeaderAuthIcon.className = "fa-solid fa-right-from-bracket";
                showToast("Berhasil masuk ke akun!");
            }
        }

        // ==================== WIDGET SHALAT & COUNTDOWN ====================
        const prayerTimes = [
            { name: "Subuh", time: "04:32" },
            { name: "Dzuhur", time: "11:51" },
            { name: "Ashar", time: "15:12" },
            { name: "Maghrib", time: "17:48" },
            { name: "Isya", time: "18:58" }
        ];

        function initHomePrayerWidget() {
            const now = new Date();

            let activeTimes = prayerTimes;
            let tzLabel = "WIB";

            if (typeof ASNJadwalSholat !== 'undefined' && typeof ASNJadwalSholat.calculateDay === 'function') {
                const curCity = ASNJadwalSholat.getCurrentCity();
                if (curCity) {
                    const cleanCityName = (curCity.name || '').replace(/\s*\(Default\)/gi, '').replace(/\s*\([^)]*\)/gi, '').trim() || 'Kab. Demak';
                    const locText = `${cleanCityName}${curCity.province ? ', ' + curCity.province : ''}`;
                    ['home-prayer-location', 'home-prayer-location-desktop'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.innerText = locText;
                    });
                }
                const calc = ASNJadwalSholat.calculateDay(now, curCity);
                if (calc && calc.times) {
                    activeTimes = [
                        { name: "Subuh", time: calc.times.subuh },
                        { name: "Dhuha", time: calc.times.dhuha },
                        { name: "Zuhur", time: calc.times.zuhur },
                        { name: "Ashar", time: calc.times.ashar },
                        { name: "Maghrib", time: calc.times.maghrib },
                        { name: "Isya", time: calc.times.isya }
                    ];
                    tzLabel = calc.tzName || "WIB";
                }
            }

            const nowInSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

            let nextPrayer = activeTimes[0];
            let targetSeconds = 0;

            for (let i = 0; i < activeTimes.length; i++) {
                const [h, m] = activeTimes[i].time.split(':').map(Number);
                const pSeconds = (h * 3600) + (m * 60);
                if (pSeconds > nowInSeconds) {
                    nextPrayer = activeTimes[i];
                    targetSeconds = pSeconds;
                    break;
                }
            }

            if (targetSeconds === 0) {
                const [h, m] = activeTimes[0].time.split(':').map(Number);
                targetSeconds = (24 * 3600) + (h * 3600) + (m * 60);
            }

            const diffSeconds = targetSeconds - nowInSeconds;
            const hoursLeft = Math.floor(diffSeconds / 3600);
            const minsLeft = Math.floor((diffSeconds % 3600) / 60);
            const secsLeft = diffSeconds % 60;
            const formattedCountdown = `${String(hoursLeft).padStart(2, '0')}:${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;

            const prayerHtml = `${nextPrayer.name} <span class="text-amber-300 font-semibold ml-1">${nextPrayer.time} ${tzLabel}</span>`;

            ['home-next-prayer-name', 'home-next-prayer-name-desktop'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = prayerHtml;
            });

            ['home-prayer-countdown', 'home-prayer-countdown-desktop'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = formattedCountdown;
            });

            // Update Hari, Tanggal Masehi, dan Tanggal Hijriyah
            if (typeof namaHariIndo !== 'undefined' && typeof namaBulanIndo !== 'undefined' && typeof getPasaranJawa !== 'undefined') {
                const hari = namaHariIndo[now.getDay()];
                const pasaran = getPasaranJawa(now);
                const tgl = now.getDate();
                const bln = namaBulanIndo[now.getMonth()];
                const thn = now.getFullYear();

                // 2. Hari (Baris 2 Kiri)
                ['home-current-day', 'home-current-day-desktop'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = `${hari} ${pasaran}`;
                });

                // 5. Tanggal Masehi (Baris 3 Kiri)
                ['home-date-masehi', 'home-date-masehi-desktop'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        const valEl = el.querySelector('.home-date-masehi-val');
                        if (valEl) valEl.innerText = `${tgl} ${bln} ${thn}`;
                        else el.innerText = `${tgl} ${bln} ${thn}`;
                    }
                });

                // 6. Tanggal Hijriyah (Baris 3 Kanan)
                let hijriFormatted = "";
                if (typeof getHijriDate === 'function') {
                    const h = getHijriDate(now);
                    if (h && h.formatted) hijriFormatted = h.formatted;
                } else if (typeof ASNJadwalSholat !== 'undefined' && typeof ASNJadwalSholat.calculateDay === 'function') {
                    const calc = ASNJadwalSholat.calculateDay(now);
                    if (calc && calc.hijri && calc.hijri.formatted) hijriFormatted = calc.hijri.formatted;
                }
                if (hijriFormatted) {
                    ['home-date-hijri', 'home-date-hijri-desktop'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            const valEl = el.querySelector('.home-date-hijri-val');
                            if (valEl) valEl.innerText = hijriFormatted;
                            else el.innerText = hijriFormatted;
                        }
                    });
                }

                // Fallback untuk home-current-date
                ['home-current-date', 'home-current-date-desktop'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = `${hari} ${pasaran}, ${tgl} ${bln} ${thn}`;
                });
            }
        }

        setInterval(initHomePrayerWidget, 1000);
        initHomePrayerWidget();

        // ==================== SUB-TABS & FILTERS ====================
        function toggleJadwalSubPage(subTab) {
            document.querySelectorAll('.jadwal-sub-container').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.jadwal-sub-btn').forEach(btn => {
                btn.className = "jadwal-sub-btn flex-1 text-center py-2 text-[11px] md:text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-900 dark:hover:text-emerald-300 transition";
            });

            const targetContainer = document.getElementById(`jadwal-container-${subTab}`);
            if (targetContainer) targetContainer.classList.remove('hidden');

            const activeBtn = document.getElementById(`jadwal-sub-${subTab}`);
            if (activeBtn) activeBtn.className = "jadwal-sub-btn flex-1 text-center py-2 text-[11px] md:text-xs font-bold rounded-xl bg-white dark:bg-[#253447] text-brand-900 dark:text-emerald-300 shadow-sm dark:shadow-none transition";
        }

        let currentGaleriFilter = "all";

        function renderGaleriList() {
            const gridContainer = document.getElementById('galeri-grid');
            const filterContainer = document.getElementById('galeri-filter-container');

            if (!gridContainer || !filterContainer) return;

            const activeGaleri = mockGaleriData.filter(g => g.status === "Aktif");

            if (activeGaleri.length === 0) {
                filterContainer.innerHTML = '';
                gridContainer.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-[#1c2836] rounded-2xl">Belum ada foto galeri.</div>`;
                return;
            }

            // Generate filter buttons dynamically
            const categories = new Set(activeGaleri.map(g => g.kategori).filter(Boolean));
            let filterHtml = `
                <button onclick="filterGaleri('all')" id="btn-galeri-all" class="btn-filter-galeri px-4 py-2 rounded-2xl text-xs font-bold ${currentGaleriFilter === 'all' ? 'bg-brand-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#253447]'} shrink-0 transition">Semua</button>
            `;

            categories.forEach(cat => {
                const safeCat = cat.replace(/\s+/g, '-').toLowerCase();
                const isActive = currentGaleriFilter === safeCat;
                filterHtml += `
                    <button onclick="filterGaleri('${safeCat}')" id="btn-galeri-${safeCat}" class="btn-filter-galeri px-4 py-2 rounded-2xl text-xs font-bold ${isActive ? 'bg-brand-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#253447]'} shrink-0 transition" data-category="${cat}">${cat}</button>
                `;
            });
            filterContainer.innerHTML = filterHtml;

            // Generate grid
            gridContainer.innerHTML = "";
            let itemsFound = 0;

            activeGaleri.forEach(galeri => {
                const safeCat = (galeri.kategori || "").replace(/\s+/g, '-').toLowerCase();

                if (currentGaleriFilter !== 'all' && currentGaleriFilter !== safeCat) return;

                itemsFound++;

                const bgColors = ["bg-amber-500", "bg-purple-600", "bg-blue-600", "bg-rose-500", "bg-emerald-600"];
                const tagColor = bgColors[Math.abs(galeri.kategori.length) % bgColors.length];

                const card = document.createElement('div');
                card.className = "galeri-item relative aspect-video rounded-2xl overflow-hidden shadow-sm group border border-slate-100 dark:border-[#253447] bg-slate-100 dark:bg-[#1c2836]";
                card.innerHTML = `
                    <img src="${galeri.gambar}" alt="${galeri.judul}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span class="${tagColor} ${tagColor === 'bg-amber-500' ? 'text-brand-dark' : 'text-white'} text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase self-start mb-1 shadow-sm">${galeri.kategori}</span>
                        <h4 class="text-xs font-bold text-white leading-snug">${galeri.judul}</h4>
                        <p class="text-[10px] text-emerald-200 mt-0.5"><i class="fa-solid fa-tag mr-1"></i>${galeri.keterangan || '-'}</p>
                    </div>
                `;
                gridContainer.appendChild(card);
            });

            if (itemsFound === 0) {
                gridContainer.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-[#1c2836] rounded-2xl">Tidak ada foto untuk kategori ini.</div>`;
            }
        }

        function filterGaleri(category) {
            currentGaleriFilter = category;
            renderGaleriList();
        }

        // ==================== PUSAT NOTIFIKASI & POP-UP BERANDA ====================
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        let notifikasiList = [];
        let activeNotifFilter = 'all';
        let currentDetailNotifId = null;

        function toggleNotifRead(event, id) {
            if (event) {
                event.stopPropagation();
            }
            if (!id) return;
            try {
                let ids = getReadNotifIds();
                const index = ids.indexOf(id);
                if (index > -1) {
                    ids.splice(index, 1);
                    if (typeof showToast === 'function') {
                        showToast('Pengumuman ditandai belum dibaca.');
                    }
                } else {
                    ids.push(id);
                    if (typeof showToast === 'function') {
                        showToast('✅ Pengumuman telah diceklis / dibaca.');
                    }
                }
                localStorage.setItem('asn_read_notif_ids', JSON.stringify(ids));
                updateNotifBadge();
                renderNotifikasiList();
            } catch (e) {
                console.warn('toggleNotifRead error:', e);
            }
        }
        window.toggleNotifRead = toggleNotifRead;

        function getReadNotifIds() {
            try {
                const stored = localStorage.getItem('asn_read_notif_ids');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        }

        function saveReadNotifId(id) {
            if (!id) return;
            try {
                const ids = getReadNotifIds();
                if (!ids.includes(id)) {
                    ids.push(id);
                    localStorage.setItem('asn_read_notif_ids', JSON.stringify(ids));
                }
                updateNotifBadge();
            } catch (e) {}
        }

        function updateNotifBadge() {
            try {
                const readIds = getReadNotifIds();
                const activeNotifs = notifikasiList.filter(n => (n.status || 'Aktif') === 'Aktif');
                const unreadCount = activeNotifs.filter(n => !readIds.includes(n.id)).length;

                const mobileBadge = document.getElementById('mobile-notif-badge');
                const deskBadge = document.getElementById('desk-notif-badge');
                const pillBadge = document.getElementById('notif-unread-pill');

                [mobileBadge, deskBadge].forEach(badge => {
                    if (badge) {
                        if (unreadCount > 0) {
                            badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
                            badge.classList.remove('hidden');
                        } else {
                            badge.classList.add('hidden');
                        }
                    }
                });

                if (pillBadge) {
                    if (unreadCount > 0) {
                        pillBadge.innerText = unreadCount;
                        pillBadge.classList.remove('hidden');
                    } else {
                        pillBadge.classList.add('hidden');
                    }
                }
            } catch (e) {
                console.warn('updateNotifBadge error:', e);
            }
        }
        
        let _isNotifFetching = false;

        async function loadNotifikasi() {
            // 1. Render immediate cached data (Stale-While-Revalidate)
            const cached = localStorage.getItem('asn_cached_notifikasi');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const cleanCached = parsed.filter(n => n && n.id && !String(n.id).startsWith('NOTIF_INIT'));
                        if (cleanCached.length > 0) {
                            notifikasiList = cleanCached;
                        }
                    }
                } catch (e) {}
            }
            renderNotifikasiList();
            updateNotifBadge();
            if (notifikasiList.length > 0) {
                checkHomePosterPopup();
            }

            if ((typeof isApiConfigured === 'function' && !isApiConfigured()) || _isNotifFetching) {
                return;
            }
            _isNotifFetching = true;

            // 2. Fetch fresh data from server in background
            try {
                let response = null;
                if (typeof apiGet === 'function') {
                    response = await apiGet('getNotifikasi');
                } else if (typeof API_URL !== 'undefined') {
                    const res = await fetch(`${API_URL}?action=getNotifikasi`);
                    response = await res.json();
                }

                if (response && response.status === 'success' && Array.isArray(response.data)) {
                    notifikasiList = response.data.filter(n => n && n.id && !String(n.id).startsWith('NOTIF_INIT'));
                    try {
                        localStorage.setItem('asn_cached_notifikasi', JSON.stringify(notifikasiList));
                    } catch (e) {}
                    renderNotifikasiList();
                    updateNotifBadge();
                    checkHomePosterPopup();
                }
            } catch (err) {
                console.warn('Gagal memuat notifikasi dari server:', err);
            } finally {
                _isNotifFetching = false;
            }
        }

        function setNotifFilter(filter) {
            activeNotifFilter = filter;
            document.querySelectorAll('.notif-chip').forEach(btn => {
                btn.classList.remove('bg-brand-900', 'text-white', 'shadow-sm');
                btn.classList.add('bg-white', 'dark:bg-[#15202d]', 'text-slate-600', 'dark:text-slate-300');
            });

            const activeBtn = document.getElementById(`notif-filter-${filter}`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-white', 'dark:bg-[#15202d]', 'text-slate-600', 'dark:text-slate-300');
                activeBtn.classList.add('bg-brand-900', 'text-white', 'shadow-sm');
            }

            renderNotifikasiList();
        }

        function renderNotifikasiList() {
            const container = document.getElementById('notifikasi-list-container');
            const emptyState = document.getElementById('notifikasi-empty-state');
            if (!container) return;

            const readIds = getReadNotifIds();
            let filtered = notifikasiList.filter(n => (n.status || 'Aktif') === 'Aktif');

            if (activeNotifFilter === 'unread') {
                filtered = filtered.filter(n => !readIds.includes(n.id));
            } else if (activeNotifFilter !== 'all') {
                filtered = filtered.filter(n => (n.kategori || '').toLowerCase() === activeNotifFilter.toLowerCase());
            }

            if (filtered.length === 0) {
                container.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            container.innerHTML = filtered.map(item => {
                const isRead = readIds.includes(item.id);
                const unreadDot = !isRead 
                    ? `<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="Belum dibaca"></span>`
                    : '';
                const imgThumb = item.gambar 
                    ? `<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-[#253447] bg-slate-100 dark:bg-slate-900">
                         <img src="${escapeHtml(item.gambar)}" alt="${escapeHtml(item.judul)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onerror="this.parentElement.style.display='none'">
                       </div>`
                    : '';

                let badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
                if (item.kategori === 'Pengumuman') badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
                if (item.kategori === 'Pembayaran') badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
                if (item.kategori === 'Kegiatan') badgeBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';

                return `
                    <div onclick="openNotifikasiDetail('${escapeHtml(item.id)}')"
                        class="group bg-white dark:bg-[#15202d] p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-[#253447] hover:border-emerald-300 dark:hover:border-emerald-500/50 transition duration-200 cursor-pointer flex flex-col gap-3 relative overflow-hidden ${!isRead ? 'ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10' : ''}">
                        <div class="flex items-start gap-3.5 sm:gap-4">
                            ${imgThumb}
                            <div class="flex-1 min-w-0 space-y-1">
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center space-x-2">
                                        <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${badgeBg}">
                                            ${escapeHtml(item.kategori || 'Pengumuman')}
                                        </span>
                                        ${(item.is_popup || item.isPopup) ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"><i class="fa-solid fa-star text-[8px] mr-1"></i>Popup Beranda</span>` : ''}
                                    </div>
                                    <div class="flex items-center space-x-1.5 text-[11px] text-slate-400">
                                        <span>${escapeHtml(item.tanggal || '')}</span>
                                        ${unreadDot}
                                    </div>
                                </div>
                                <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-snug">
                                    ${escapeHtml(item.judul)}
                                </h3>
                                <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    ${escapeHtml(item.ringkasan || item.isi)}
                                </p>
                            </div>
                        </div>

                        <!-- Action Bar: Ceklis & Buka Detail -->
                        <div class="pt-2 border-t border-slate-100 dark:border-[#253447] flex items-center justify-between gap-2">
                            <button type="button" onclick="toggleNotifRead(event, '${escapeHtml(item.id)}')"
                                class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95 ${isRead ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:bg-[#1c2836] dark:hover:bg-emerald-950/40 dark:text-slate-300 border border-slate-200 dark:border-[#253447]'}"
                                title="${isRead ? 'Klik untuk tandai belum dibaca' : 'Ceklis bahwa pengumuman telah dibaca'}">
                                <i class="fa-solid ${isRead ? 'fa-circle-check text-emerald-600 dark:text-emerald-400 text-xs' : 'fa-circle text-slate-300 dark:text-slate-500 text-xs'}"></i>
                                <span>${isRead ? 'Sudah Dibaca' : 'Ceklis Telah Dibaca'}</span>
                            </button>
                            <div class="flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition duration-200">
                                <span>Baca Warta Lengkap</span>
                                <i class="fa-solid fa-arrow-right text-[9px] ml-1"></i>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function openNotifikasiDetail(id) {
            const notif = notifikasiList.find(n => String(n.id) === String(id));
            if (!notif) return;

            currentDetailNotifId = notif.id;
            saveReadNotifId(notif.id);

            const modal = document.getElementById('notifikasiDetailModal');
            const content = document.getElementById('notifikasiDetailContent');
            const titleEl = document.getElementById('notif-detail-title');
            const bodyEl = document.getElementById('notif-detail-body');
            const dateEl = document.getElementById('notif-detail-date');
            const badgeEl = document.getElementById('notif-detail-badge');
            const imgWrapper = document.getElementById('notif-detail-img-wrapper');
            const imgEl = document.getElementById('notif-detail-img');

            if (titleEl) titleEl.innerText = notif.judul;
            if (bodyEl) bodyEl.innerText = notif.isi || notif.ringkasan || '';
            if (dateEl) dateEl.innerText = notif.tanggal || '';
            if (badgeEl) badgeEl.innerText = notif.kategori || 'Pengumuman';

            if (imgWrapper && imgEl) {
                if (notif.gambar) {
                    imgEl.src = notif.gambar;
                    imgWrapper.classList.remove('hidden');
                } else {
                    imgWrapper.classList.add('hidden');
                }
            }

            if (modal && content) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 20);
            }
        }

        function closeNotifikasiDetail() {
            const modal = document.getElementById('notifikasiDetailModal');
            const content = document.getElementById('notifikasiDetailContent');
            if (modal && content) {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    currentDetailNotifId = null;
                }, 250);
            }
        }

        function shareNotifToWA(id) {
            const notifId = id || currentDetailNotifId;
            const notif = notifikasiList.find(n => String(n.id) === String(notifId));
            if (!notif) {
                if (typeof showToast === 'function') showToast('Warta tidak ditemukan.');
                return;
            }

            const shareUrl = `https://www.asnawiyyah.or.id/notifikasi?id=${encodeURIComponent(notif.id)}`;
            const text = `*${notif.judul}*\n\n${notif.ringkasan || (notif.isi ? notif.isi.substring(0, 160) : '')}\n\n_Baca warta resmi selengkapnya di:_ \n${shareUrl}\n\n*PPTQ Asnawiyyah Pilangwetan Demak*`;
            const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(waUrl, '_blank');
        }

        function markAllNotifAsRead() {
            const allIds = notifikasiList.map(n => n.id);
            try {
                localStorage.setItem('asn_read_notif_ids', JSON.stringify(allIds));
            } catch (e) {}
            updateNotifBadge();
            renderNotifikasiList();
            if (typeof showToast === 'function') {
                showToast('Semua notifikasi telah ditandai dibaca.');
            }
        }



        // ==================== POPUP POSTER BERANDA ====================
        let homePosterTimer = null;
        let dismissedPosterThisSession = false;

        function checkHomePosterPopup(force = false) {
            try {
                // Pastikan berada di tab Beranda (jika tab lain sedang aktif, jangan munculkan)
                const berandaTab = document.getElementById('page-beranda');
                if (berandaTab && berandaTab.classList.contains('hidden') && !force) {
                    return;
                }

                // Jika mobile splash screen masih aktif berjalan, tunda (akan dipanggil otomatis oleh initMobileSplash setelah splash fadeout)
                const splash = document.getElementById('mobile-splash-screen');
                const isSplashActive = splash && window.innerWidth < 768 && window.getComputedStyle(splash).display !== 'none' && !splash.classList.contains('opacity-0');
                if (isSplashActive && !force) {
                    return;
                }

                // Cari notifikasi aktif dengan flag is_popup === true
                const popupNotif = notifikasiList.find(n => 
                    (n.status || 'Aktif') === 'Aktif' && 
                    (n.is_popup === true || n.is_popup === 1 || String(n.is_popup) === '1' || String(n.is_popup).toLowerCase() === 'true' ||
                     n.isPopup === true || n.isPopup === 1 || String(n.isPopup) === '1' || String(n.isPopup).toLowerCase() === 'true')
                );
                if (!popupNotif) return;

                // Hanya sembunyikan jika user telah menutup popup di sesi tab ini secara eksplisit (tombol X / backdrop)
                if (!force && dismissedPosterThisSession) {
                    return;
                }

                const modal = document.getElementById('homePosterModal');
                const content = document.getElementById('homePosterContent');
                const imgWrapper = document.getElementById('home-poster-img-wrapper');
                const imgEl = document.getElementById('home-poster-img');
                const textWrapper = document.getElementById('home-poster-text-wrapper');
                const titleEl = document.getElementById('home-poster-title');
                const summaryEl = document.getElementById('home-poster-summary');
                const badgeEl = document.getElementById('home-poster-badge');

                const hasValidImg = popupNotif.gambar && !String(popupNotif.gambar).includes('brand-header.png') && String(popupNotif.gambar).trim().length > 5;

                if (hasValidImg) {
                    if (imgEl) imgEl.src = popupNotif.gambar;
                    if (imgWrapper) imgWrapper.classList.remove('hidden');
                    if (textWrapper) textWrapper.classList.add('hidden');
                } else {
                    if (titleEl) titleEl.innerText = popupNotif.judul;
                    if (summaryEl) summaryEl.innerText = popupNotif.ringkasan || (popupNotif.isi ? popupNotif.isi.substring(0, 150) : '');
                    if (badgeEl) badgeEl.innerText = popupNotif.kategori || 'Pengumuman';
                    if (imgWrapper) imgWrapper.classList.add('hidden');
                    if (textWrapper) textWrapper.classList.remove('hidden');
                }

                if (modal && content) {
                    modal.dataset.notifId = popupNotif.id;
                    modal.dataset.isPreview = 'false';

                    // Batalkan timer lama jika ada
                    if (homePosterTimer) clearTimeout(homePosterTimer);

                    // Delay singkat untuk animasi smooth
                    homePosterTimer = setTimeout(() => {
                        const curBeranda = document.getElementById('page-beranda');
                        if (curBeranda && curBeranda.classList.contains('hidden') && !force) return;

                        modal.classList.remove('hidden');
                        setTimeout(() => {
                            content.classList.remove('scale-95', 'opacity-0');
                            content.classList.add('scale-100', 'opacity-100');
                        }, 50);
                    }, 150);
                }
            } catch (e) {
                console.warn('checkHomePosterPopup error:', e);
            }
        }

        function closeHomePoster(dismissSession = true) {
            const modal = document.getElementById('homePosterModal');
            const content = document.getElementById('homePosterContent');
            if (modal && content) {
                const isPreview = modal.dataset.isPreview === 'true';
                if (dismissSession && !isPreview) {
                    dismissedPosterThisSession = true;
                }
                modal.dataset.isPreview = 'false';
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 250);
            }
        }

        function openNotifFromPoster(id) {
            const modal = document.getElementById('homePosterModal');
            const notifId = id || (modal ? modal.dataset.notifId : null);
            closeHomePoster(false);

            switchTab('notifikasi');
            if (typeof setNotifFilter === 'function') {
                setNotifFilter('Pengumuman');
            }

            if (notifId) {
                setTimeout(() => {
                    openNotifikasiDetail(notifId);
                }, 300);
            }
        }

        window.loadNotifikasi = loadNotifikasi;
        window.checkHomePosterPopup = checkHomePosterPopup;
        window.closeHomePoster = closeHomePoster;
        window.openNotifFromPoster = openNotifFromPoster;
