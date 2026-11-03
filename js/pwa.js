/**
 * PPTQ Asnawiyyah - PWA Controller
 * Menangani Smart Install Prompt untuk Android/Desktop,
 * Deteksi Mode Standalone, dan Panduan Visual untuk iPhone (iOS Safari).
 */

(function () {
    'use strict';

    // Global reference
    window.deferredPwaPrompt = null;

    /**
     * Memeriksa apakah aplikasi sedang berjalan dalam mode standalone (sudah terinstal)
     */
    function isRunningStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
    }

    /**
     * Deteksi apakah pengguna menggunakan perangkat Apple iOS (iPhone/iPad/iPod)
     */
    function isIosDevice() {
        const ua = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(ua);
    }

    /**
     * Cek apakah banner install baru saja ditutup dalam periode tertentu (default 7 hari)
     */
    function isBannerDismissed() {
        try {
            const dismissedAt = localStorage.getItem('asnawiyyah_pwa_dismissed');
            if (!dismissedAt) return false;
            const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            return diffDays < 7; // Ditutup kurang dari 7 hari yang lalu
        } catch (e) {
            return false;
        }
    }

    /**
     * Memperbarui tampilan tombol Pasang Aplikasi di navigasi Header
     */
    function updateNavInstallButtons(show) {
        const deskBtn = document.getElementById('desk-btn-install-app');
        const mobileBtn = document.getElementById('mobile-btn-install-app');

        if (deskBtn) {
            if (show) {
                deskBtn.classList.remove('hidden');
                deskBtn.classList.add('flex');
            } else {
                deskBtn.classList.add('hidden');
                deskBtn.classList.remove('flex');
            }
        }

        if (mobileBtn) {
            if (show) {
                mobileBtn.classList.remove('hidden');
                mobileBtn.classList.add('flex');
            } else {
                mobileBtn.classList.add('hidden');
                mobileBtn.classList.remove('flex');
            }
        }
    }

    /**
     * Menampilkan Smart Floating Install Banner
     */
    function showFloatingInstallBanner() {
        if (isRunningStandalone() || isBannerDismissed()) {
            return;
        }

        const banner = document.getElementById('pwa-smart-install-banner');
        if (!banner) return;

        banner.classList.remove('hidden');
        // Trigger animasi slide up
        setTimeout(() => {
            banner.classList.remove('translate-y-full', 'opacity-0');
            banner.classList.add('translate-y-0', 'opacity-100');
        }, 120);
    }

    /**
     * Menutup Smart Floating Install Banner
     */
    window.dismissPwaBanner = function (remember) {
        const banner = document.getElementById('pwa-smart-install-banner');
        if (banner) {
            banner.classList.remove('translate-y-0', 'opacity-100');
            banner.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 300);
        }

        if (remember) {
            try {
                localStorage.setItem('asnawiyyah_pwa_dismissed', Date.now().toString());
            } catch (e) {}
        }
    };

    /**
     * Membuka Modal Panduan Instalasi Khusus iPhone (iOS Safari)
     */
    window.openIosInstallGuideModal = function () {
        const modal = document.getElementById('modal-ios-install-guide');
        const content = document.getElementById('modal-ios-install-content');
        if (!modal) return;

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            if (content) {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        }, 20);
    };

    /**
     * Menutup Modal Panduan Instalasi Khusus iPhone
     */
    window.closeIosInstallGuideModal = function () {
        const modal = document.getElementById('modal-ios-install-guide');
        const content = document.getElementById('modal-ios-install-content');
        if (!modal) return;

        if (content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
        }
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 250);
    };

    /**
     * Trigger Utama Instalasi Aplikasi (Bisa dipanggil dari tombol mana pun)
     */
    window.triggerInstallApp = async function () {
        // 1. Jika pengguna di perangkat iOS (iPhone / iPad)
        if (isIosDevice()) {
            window.dismissPwaBanner(false);
            window.openIosInstallGuideModal();
            return;
        }

        // 2. Jika prompt instalasi bawaan browser (Android Chrome / Edge / Desktop) tersedia
        if (window.deferredPwaPrompt) {
            try {
                window.deferredPwaPrompt.prompt();
                const choiceResult = await window.deferredPwaPrompt.userChoice;
                if (choiceResult.outcome === 'accepted') {
                    console.log('Pengguna menyetujui pemasangan PWA Asnawiyyah');
                    window.dismissPwaBanner(true);
                } else {
                    console.log('Pengguna membatalkan pemasangan PWA');
                }
                window.deferredPwaPrompt = null;
            } catch (err) {
                console.warn('Gagal memicu prompt instalasi:', err);
            }
            return;
        }

        // 3. Fallback jika dibuka dari browser Android/Desktop lain tanpa prompt otomatis
        if (typeof showCustomToast === 'function') {
            showCustomToast(
                'Untuk memasang aplikasi, buka menu browser (titik 3 di kanan atas) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".',
                'info'
            );
        } else {
            alert('Untuk memasang aplikasi: buka menu browser (titik 3) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".');
        }
    };

    // ==========================================
    // Event Listeners Lifecycle PWA
    // ==========================================

    // Tangkap event sebelum prompt instalasi muncul (Android & Chrome Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Cegah mini-infobar default browser agar kita bisa menampilkan UI yang lebih elegan
        e.preventDefault();
        window.deferredPwaPrompt = e;

        if (!isRunningStandalone()) {
            updateNavInstallButtons(true);
            showFloatingInstallBanner();
        }
    });

    // Ketika aplikasi berhasil dipasang
    window.addEventListener('appinstalled', () => {
        window.deferredPwaPrompt = null;
        updateNavInstallButtons(false);
        window.dismissPwaBanner(true);

        if (typeof showCustomToast === 'function') {
            showCustomToast('Alhamdulillah, aplikasi PPTQ Asnawiyyah berhasil dipasang di perangkat Anda!', 'success');
        }
        console.log('Aplikasi PPTQ Asnawiyyah berhasil dipasang sebagai PWA.');
    });

    // ==========================================
    // Smart In-App Update Controller (Tahap 1 & 2)
    // ==========================================
    const CURRENT_CLIENT_VERSION = '2.5.0';
    const UPDATE_SNOOZE_KEY = 'asnawiyyah_update_snooze';

    const SmartUpdateManager = {
        swWaitingWorker: null,
        swRegistration: null,
        latestVersionData: null,
        isPromptVisible: false,
        checkIntervalTimer: null,
        guardCheckTimer: null,

        /**
         * Smart Interruption Guard: Jangan ganggu user jika sedang mengetik atau membuka form modal
         */
        isUserActivelyInputting() {
            try {
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                    return true;
                }
                const catatModal = document.getElementById('modal-catat-setoran');
                if (catatModal && !catatModal.classList.contains('hidden')) return true;

                const formIzin = document.getElementById('modal-form-izin');
                if (formIzin && !formIzin.classList.contains('hidden')) return true;

                const badalModal = document.getElementById('modal-izin-asatidz');
                if (badalModal && !badalModal.classList.contains('hidden')) return true;
            } catch (e) {}
            return false;
        },

        /**
         * Cek apakah user baru saja menekan tombol 'Nanti' dalam 15 menit terakhir
         */
        isSnoozed() {
            try {
                const snoozeUntil = sessionStorage.getItem(UPDATE_SNOOZE_KEY);
                if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) {
                    return true;
                }
            } catch (e) {}
            return false;
        },

        /**
         * Tampilkan Floating Update Banner
         */
        showUpdateBanner(versionInfo) {
            if (this.isPromptVisible) return;
            if (this.isSnoozed()) return;

            // Jika user sedang aktif mengetik, tunda 15 detik dan cek ulang
            if (this.isUserActivelyInputting()) {
                if (!this.guardCheckTimer) {
                    this.guardCheckTimer = setTimeout(() => {
                        this.guardCheckTimer = null;
                        this.showUpdateBanner(versionInfo);
                    }, 15000);
                }
                return;
            }

            const banner = document.getElementById('pwa-update-banner');
            if (!banner) return;

            this.latestVersionData = versionInfo || { version: CURRENT_CLIENT_VERSION };

            const tagEl = document.getElementById('pwa-update-version-tag');
            if (tagEl && this.latestVersionData.version) {
                tagEl.textContent = 'v' + this.latestVersionData.version;
            }

            const descEl = document.getElementById('pwa-update-desc');
            if (descEl && this.latestVersionData.highlights && this.latestVersionData.highlights.length > 0) {
                descEl.textContent = this.latestVersionData.highlights[0] || 'Fitur dan perbaikan sistem terbaru telah siap.';
            }

            // Sembunyikan banner install jika terbuka agar tidak tumpang tindih
            const installBanner = document.getElementById('pwa-smart-install-banner');
            if (installBanner) installBanner.classList.add('hidden');

            banner.classList.remove('hidden');
            setTimeout(() => {
                banner.classList.remove('translate-y-full', 'opacity-0');
                banner.classList.add('translate-y-0', 'opacity-100');
                this.isPromptVisible = true;
            }, 100);
        },

        /**
         * Sembunyikan sementara banner update jika ditekan tombol Nanti / Silang
         */
        dismissBanner(temporary = true) {
            const banner = document.getElementById('pwa-update-banner');
            if (banner) {
                banner.classList.remove('translate-y-0', 'opacity-100');
                banner.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => {
                    banner.classList.add('hidden');
                    this.isPromptVisible = false;
                }, 300);
            }
            if (temporary) {
                // Snooze 15 menit selama sesi browser berlangsung
                sessionStorage.setItem(UPDATE_SNOOZE_KEY, String(Date.now() + 15 * 60 * 1000));
            }
        },

        /**
         * Eksekusi pembaruan instan (1-Klik):
         * 1. Beri tahu Service Worker untuk skipWaiting
         * 2. Bersihkan cache lama
         * 3. Soft reload halaman tanpa memutus sesi login
         */
        async applyUpdateNow() {
            const btnText = document.getElementById('btn-apply-pwa-update-text');
            const btn = document.getElementById('btn-apply-pwa-update');
            if (btnText) btnText.textContent = 'Memperbarui...';
            if (btn) btn.disabled = true;

            try {
                if (this.latestVersionData && this.latestVersionData.version) {
                    localStorage.setItem('asnawiyyah_installed_version', this.latestVersionData.version);
                    localStorage.setItem('asnawiyyah_just_updated', '1');
                }
            } catch (e) {}

            // 1. PostMessage ke Service Worker jika ada worker yang menunggu
            if (this.swWaitingWorker) {
                try {
                    this.swWaitingWorker.postMessage({ action: 'skipWaiting', type: 'SKIP_WAITING' });
                } catch (e) {}
            }

            // 2. Bersihkan Cache API
            if ('caches' in window) {
                try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                } catch (e) {
                    console.warn('[PWA] Cache purge warn:', e);
                }
            }

            // 3. Muat ulang halaman secara halus (kompatibel iOS Safari Standalone & Android Chrome)
            setTimeout(() => {
                if (window.navigator.standalone || isRunningStandalone()) {
                    // Di iOS Standalone PWA, location.href dengan query timestamp mencegah WebKit memuat ulang dari bfcache
                    const baseOrigin = window.location.origin || (window.location.protocol + '//' + window.location.host);
                    window.location.href = baseOrigin + window.location.pathname + '?_t=' + Date.now() + window.location.hash;
                } else {
                    window.location.reload();
                }
            }, 300);
        },

        /**
         * Hubungkan Service Worker Registration dari index.html
         */
        bindServiceWorker(registration) {
            this.swRegistration = registration;

            // Jika sudah ada worker yang menunggu aktivasi (waiting)
            if (registration.waiting) {
                this.swWaitingWorker = registration.waiting;
                this.showUpdateBanner({ version: CURRENT_CLIENT_VERSION });
                return;
            }

            // Jika ada worker yang sedang di-install
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.swWaitingWorker = newWorker;
                        this.showUpdateBanner({ version: CURRENT_CLIENT_VERSION });
                    }
                });
            });

            // Pantau pergantian controller (setelah skipWaiting)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        },

        /**
         * Cek file version.json di server (Active Version Polling)
         */
        async checkVersionJson() {
            if (this.isPromptVisible) return;
            try {
                const res = await fetch('/version.json?_t=' + Date.now(), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!data || !data.version) return;

                const installedVer = localStorage.getItem('asnawiyyah_installed_version') || CURRENT_CLIENT_VERSION;
                if (data.version !== installedVer) {
                    console.log(`[PWA UPDATE] Versi baru terdeteksi: ${data.version} (versi saat ini: ${installedVer})`);
                    this.showUpdateBanner(data);
                }
            } catch (err) {
                // Silent fail jika offline
            }
        },

        /**
         * Periksa apakah aplikasi baru saja berhasil diperbarui, jika ya munculkan pesan syukur
         */
        checkPostUpdateWelcome() {
            try {
                const justUpdated = localStorage.getItem('asnawiyyah_just_updated');
                if (justUpdated === '1') {
                    localStorage.removeItem('asnawiyyah_just_updated');
                    const curVer = localStorage.getItem('asnawiyyah_installed_version') || CURRENT_CLIENT_VERSION;
                    setTimeout(() => {
                        if (typeof showCustomToast === 'function') {
                            showCustomToast(`Alhamdulillah! Aplikasi telah diperbarui ke versi v${curVer} dengan performa prima.`, 'success');
                        } else if (typeof showToast === 'function') {
                            showToast(`Alhamdulillah! Aplikasi telah diperbarui ke versi v${curVer}.`);
                        }
                    }, 1200);
                }
            } catch (e) {}
        },

        /**
         * Inisialisasi Lifecycle Tracker
         */
        init() {
            this.checkPostUpdateWelcome();

            // Cek saat pertama kali load
            setTimeout(() => this.checkVersionJson(), 3000);

            // Cek saat pengguna kembali membuka browser/aplikasi dari background
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.checkVersionJson();
                    if (this.swRegistration) {
                        try { this.swRegistration.update(); } catch (e) {}
                    }
                }
            });

            // Polling santai setiap 20 menit
            this.checkIntervalTimer = setInterval(() => {
                this.checkVersionJson();
                if (this.swRegistration) {
                    try { this.swRegistration.update(); } catch (e) {}
                }
            }, 20 * 60 * 1000);
        }
    };

    // Global Expose
    window.SmartUpdateManager = SmartUpdateManager;
    window.applyAppUpdateNow = function () { SmartUpdateManager.applyUpdateNow(); };
    window.dismissUpdateBannerTemporarily = function () { SmartUpdateManager.dismissBanner(true); };

    // Inisialisasi saat DOM siap atau jika sudah siap
    function initPwa() {
        // Inisialisasi Update Tracker
        SmartUpdateManager.init();

        // Jika sudah standalone, pastikan semua promo install disembunyikan
        if (isRunningStandalone()) {
            updateNavInstallButtons(false);
            const banner = document.getElementById('pwa-smart-install-banner');
            if (banner) banner.classList.add('hidden');
            return;
        }

        // Jika di iOS dan belum standalone, tampilkan tombol Pasang di navbar dan banner
        if (isIosDevice()) {
            updateNavInstallButtons(true);
            showFloatingInstallBanner();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPwa);
    } else {
        initPwa();
    }

})();

