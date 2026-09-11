// =====================================================================
// ASNAWIYYAH IDENTITY & ACCOUNT CENTER (PHASE 1 & 2A)
// =====================================================================

/**
 * Official Product Roles
 */
const ASN_ROLES = Object.freeze({
    PUBLIC: 'PUBLIC',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    WALI_SANTRI: 'WALI_SANTRI',
    PENGASUH: 'PENGASUH'
});

/**
 * Frontend Identity State Machine States (Phase 3)
 */
const ASN_STATES = Object.freeze({
    UNINITIALIZED: 'UNINITIALIZED',
    HYDRATING: 'HYDRATING',
    PUBLIC: 'PUBLIC',
    WALI_LOGIN: 'WALI_LOGIN',
    WALI_OTP: 'WALI_OTP',
    WALI_ACTIVATION: 'WALI_ACTIVATION',
    WALI_ACTIVATION_OTP: 'WALI_ACTIVATION_OTP',
    WALI_HYDRATING: 'WALI_HYDRATING',
    WALI_AUTH_ACTIVE: 'WALI_AUTH_ACTIVE',
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    ADMIN_OTP: 'ADMIN_OTP',
    ADMIN_AUTH_ACTIVE: 'ADMIN_AUTH_ACTIVE',
    PENGASUH_LOGIN: 'PENGASUH_LOGIN',
    PENGASUH_AUTH_ACTIVE: 'PENGASUH_AUTH_ACTIVE',
    LOGGING_OUT: 'LOGGING_OUT',
    SESSION_EXPIRED: 'SESSION_EXPIRED'
});

/**
 * Endpoint Contract Definition for Phase 2B Backend Baseline (Version 57)
 */
const ASN_AUTH_ACTIONS = Object.freeze({
    ADMIN_REQUEST_OTP: 'auth.admin.requestOtp',
    ADMIN_VERIFY_OTP: 'auth.admin.verifyOtp',
    PARENT_REQUEST_OTP: 'auth.parent.requestOtp',
    PARENT_VERIFY_OTP: 'auth.parent.verifyOtp',
    PARENT_ACTIVATE: 'auth.parent.activate',
    PARENT_VERIFY_ACTIVATION: 'auth.parent.verifyActivation',
    SESSION_VERIFY: 'auth.session',
    PARENT_ME: 'auth.parent.me',
    PARENT_STUDENTS: 'auth.parent.students',
    PENGASUH_ME: 'auth.pengasuh.me',
    SSO_GOOGLE: 'auth.sso.google',
    LOGOUT: 'auth.logout'
});

/**
 * Storage Keys for Session Integrity
 */
const ASN_STORAGE_KEYS = Object.freeze({
    ADMIN_TOKEN: 'asnawiyyah_admin_token',
    ADMIN_ROLE: 'asnawiyyah_admin_role',
    ADMIN_DATA: 'asnawiyyah_admin_data',
    PARENT_TOKEN: 'asnawiyyah_parent_token',
    PARENT_DATA: 'asnawiyyah_parent_data',
    PARENT_STUDENTS: 'asnawiyyah_parent_students',
    PENGASUH_TOKEN: 'asnawiyyah_pengasuh_token',
    PENGASUH_DATA: 'asnawiyyah_pengasuh_data'
});

/**
 * Dedicated Phase 2B Auth API Endpoint
 * Mengarahkan panggilan autentikasi Phase 2B ke deployment aktif
 * tanpa mengganggu WEB_APP_URL legacy yang menjadi anchor rollback.
 */
const ASN_PHASE2B_AUTH_URL = "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec";

async function authApiPost(action, payload = {}) {
    const targetUrl = ASN_PHASE2B_AUTH_URL || (typeof WEB_APP_URL !== 'undefined' ? WEB_APP_URL : '');
    if (!targetUrl) throw new Error("Endpoint autentikasi belum dikonfigurasi.");

    const token = payload.token || 
                  (typeof getAdminSessionToken === "function" ? getAdminSessionToken() : sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN)) || 
                  sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || 
                  localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) ||
                  sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) ||
                  localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || "";

    const bodyPayload = { action, ...payload };
    if (token && !bodyPayload.token) {
        bodyPayload.token = token;
    }

    const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
            "Accept": "application/json"
        },
        body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

/**
 * Authentication API Abstraction Layer (Fail-Safe)
 * Bertindak sebagai boundary interface antara UI dan Backend.
 */
const ASNAuthAPI = {
    async requestAdminOtp(email) {
        if (!email || !email.includes('@')) {
            return { success: false, message: 'Alamat email tidak valid.' };
        }

        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.ADMIN_REQUEST_OTP, { email: email.trim() });
            if (response && response.success) {
                return { 
                    success: true, 
                    message: response.message || 'OTP berhasil dikirim ke email.',
                    cooldownSeconds: response.cooldownSeconds || 60
                };
            }

            return {
                success: false,
                unavailable: false,
                message: (response && response.message) 
                    ? response.message 
                    : 'Gagal mengirimkan kode OTP ke email pengelola.'
            };
        } catch (err) {
            console.warn('[ASNAuthAPI] requestAdminOtp error:', err);
            return {
                success: false,
                unavailable: true,
                message: 'Gagal menghubungi server autentikasi. Pastikan koneksi internet stabil.'
            };
        }
    },

    async verifyAdminOtp(email, otp) {
        if (!email || !otp || otp.length !== 6) {
            return { success: false, message: 'Kode OTP harus berupa 6 digit angka.' };
        }

        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.ADMIN_VERIFY_OTP, { 
                email: email.trim(), 
                otp: otp.trim() 
            });

            if (response && response.success) {
                const token = response.token || (response.data && response.data.token);
                const role = response.role || (response.data && response.data.role) || ASN_ROLES.ADMIN;
                const adminData = response.identity || (response.data && response.data.admin) || { email: email, name: 'Administrator' };

                if (token) {
                    return {
                        success: true,
                        token: token,
                        role: role,
                        admin: adminData
                    };
                }
            }

            return {
                success: false,
                unavailable: false,
                message: (response && response.message) 
                    ? response.message 
                    : 'Verifikasi OTP gagal.'
            };
        } catch (err) {
            console.warn('[ASNAuthAPI] verifyAdminOtp error:', err);
            return {
                success: false,
                unavailable: true,
                message: 'Verifikasi OTP gagal. Terjadi kendala komunikasi ke server.'
            };
        }
    },

    async requestParentOtp(email) {
        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized || !normalized.includes('@')) {
            return { success: false, message: 'Alamat email tidak valid.' };
        }

        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_REQUEST_OTP, { email: normalized });
            if (response && response.success) {
                return { 
                    success: true, 
                    message: response.message || 'Kode OTP telah dikirimkan ke email Anda.',
                    cooldownSeconds: response.cooldownSeconds || 60
                };
            }

            return {
                success: false,
                unavailable: false,
                message: (response && response.message) 
                    ? response.message 
                    : 'Gagal mengirimkan kode OTP ke email.'
            };
        } catch (err) {
            console.warn('[ASNAuthAPI] requestParentOtp error:', err);
            return {
                success: false,
                unavailable: true,
                message: 'Gagal menghubungi server autentikasi Email OTP.'
            };
        }
    },

    async verifyParentOtp(email, otp) {
        const normalized = String(email || '').trim().toLowerCase();
        const cleanOtp = String(otp || '').trim();
        if (!normalized || !cleanOtp || cleanOtp.length !== 6) {
            return { success: false, message: 'Kode OTP harus berupa 6 digit angka.' };
        }

        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_VERIFY_OTP, { 
                email: normalized, 
                otp: cleanOtp 
            });

            if (response && response.success) {
                const token = response.token || (response.data && response.data.token);
                const role = response.role || (response.data && response.data.role) || ASN_ROLES.WALI_SANTRI;
                const parentData = response.identity || (response.data && response.data.parent) || { email: normalized, name: 'Wali Santri' };
                const students = response.students || (response.data && response.data.students) || [];

                if (token) {
                    return {
                        success: true,
                        token: token,
                        role: role,
                        parent: parentData,
                        students: students
                    };
                }
            }

            return {
                success: false,
                unavailable: false,
                message: (response && response.message) 
                    ? response.message 
                    : 'Verifikasi Email OTP gagal.'
            };
        } catch (err) {
            console.warn('[ASNAuthAPI] verifyParentOtp error:', err);
            return {
                success: false,
                unavailable: true,
                message: 'Verifikasi Email OTP gagal. Terjadi kendala komunikasi ke server.'
            };
        }
    },

    async verifySession(token) {
        if (!token) return { success: false, valid: false };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.SESSION_VERIFY, { token: token });
            if (response && response.success && response.valid) {
                return {
                    success: true,
                    valid: true,
                    role: response.role,
                    identity: response.identity
                };
            }
            return { success: false, valid: false, message: (response && response.message) || 'Sesi tidak valid.' };
        } catch (err) {
            console.warn('[ASNAuthAPI] verifySession error:', err);
            return { success: false, valid: false, unavailable: true, message: 'Gagal memverifikasi sesi ke server.' };
        }
    },

    async getParentProfile(token) {
        if (!token) return { success: false };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_ME, { token: token });
            if (response && response.success && response.parent) {
                return { success: true, parent: response.parent };
            }
            return { success: false, message: (response && response.message) || 'Gagal memuat profil wali santri.' };
        } catch (err) {
            console.warn('[ASNAuthAPI] getParentProfile error:', err);
            return { success: false, unavailable: true, message: 'Gagal menghubungi server.' };
        }
    },

    async getParentStudents(token) {
        if (!token) return { success: false, students: [] };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_STUDENTS, { token: token });
            if (response && response.success && Array.isArray(response.students)) {
                return { success: true, students: response.students };
            }
            return { success: false, students: [], message: (response && response.message) || 'Gagal memuat daftar santri.' };
        } catch (err) {
            console.warn('[ASNAuthAPI] getParentStudents error:', err);
            return { success: false, students: [], unavailable: true, message: 'Gagal menghubungi server.' };
        }
    },

    async logoutSession(token) {
        if (!token) return { success: true };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.LOGOUT, { token: token });
            return response || { success: true };
        } catch (err) {
            console.warn('[ASNAuthAPI] logoutSession error:', err);
            return { success: false, error: err.message };
        }
    },

    async ssoGoogle(credential, targetRole = "") {
        if (!credential) return { success: false, message: "Kredensial token Google tidak ditemukan." };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.SSO_GOOGLE, {
                credential: credential,
                targetRole: targetRole
            });
            return response;
        } catch (err) {
            console.warn('[ASNAuthAPI] ssoGoogle error:', err);
            return { success: false, unavailable: true, message: 'Gagal menghubungi server Google SSO.' };
        }
    },

    async activateParent(payload) {
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_ACTIVATE, payload);
            return response;
        } catch (err) {
            console.warn('[ASNAuthAPI] activateParent error:', err);
            return { success: false, unavailable: true, message: 'Gagal menghubungi server aktivasi santri.' };
        }
    },

    async verifyParentActivation(payload) {
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PARENT_VERIFY_ACTIVATION, payload);
            return response;
        } catch (err) {
            console.warn('[ASNAuthAPI] verifyParentActivation error:', err);
            return { success: false, unavailable: true, message: 'Gagal memverifikasi aktivasi santri.' };
        }
    },

    async getPengasuhProfile(token) {
        if (!token) return { success: false };
        try {
            const response = await authApiPost(ASN_AUTH_ACTIONS.PENGASUH_ME, { token: token });
            return response;
        } catch (err) {
            console.warn('[ASNAuthAPI] getPengasuhProfile error:', err);
            return { success: false, unavailable: true, message: 'Gagal memuat profil pengasuh.' };
        }
    }
};

/**
 * Identity Manager & State Machine (Phase 3)
 */
const ASNIdentity = {
    currentState: ASN_STATES.UNINITIALIZED,
    currentRole: ASN_ROLES.PUBLIC,
    currentUser: null,
    linkedStudents: [],
    isHydrating: false,
    studentsLoadFailed: false,

    init() {
        // Non-blocking hydration at startup
        this.hydrateSession().catch(err => {
            console.warn('[ASNIdentity] Hydration caught error:', err);
        });
        this.renderAccountCenterUI();
    },

    async hydrateSession() {
        if (this.isHydrating) return;
        this.isHydrating = true;
        this.currentState = ASN_STATES.HYDRATING;
        this.renderAccountCenterUI();

        const pengasuhToken = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN);
        const adminToken = sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN);
        const parentToken = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        const token = pengasuhToken || adminToken || parentToken;

        if (!token) {
            this.clearLocalSession();
            this.currentState = ASN_STATES.PUBLIC;
            this.currentRole = ASN_ROLES.PUBLIC;
            this.currentUser = null;
            this.isHydrating = false;
            this.renderAccountCenterUI();
            return;
        }

        try {
            const verifyRes = await ASNAuthAPI.verifySession(token);
            if (!verifyRes.success || !verifyRes.valid) {
                console.warn('[ASNIdentity] Sesi ditolak atau telah dicabut server.');
                this.clearLocalSession();
                this.currentState = ASN_STATES.SESSION_EXPIRED;
                this.currentRole = ASN_ROLES.PUBLIC;
                this.currentUser = null;
                this.isHydrating = false;
                this.renderAccountCenterUI();
                return;
            }

            const serverRole = String(verifyRes.role || '').toUpperCase();
            if (serverRole === 'PENGASUH') {
                this.currentRole = ASN_ROLES.PENGASUH;
                const profRes = await ASNAuthAPI.getPengasuhProfile(token);
                if (profRes.success && profRes.pengasuh) {
                    this.currentUser = profRes.pengasuh;
                    sessionStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(profRes.pengasuh));
                    localStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(profRes.pengasuh));
                } else if (verifyRes.identity) {
                    this.currentUser = verifyRes.identity;
                }
                this.currentState = ASN_STATES.PENGASUH_AUTH_ACTIVE;
                this.isHydrating = false;
                this.renderAccountCenterUI();
            } else if (serverRole === 'ADMIN' || serverRole === 'EDITOR') {
                this.currentRole = ASN_ROLES.ADMIN;
                this.currentUser = verifyRes.identity || {
                    name: 'Administrator Pesantren',
                    email: 'admin@asnawiyyah.sch.id',
                    role: serverRole
                };
                sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, serverRole);
                sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(this.currentUser));
                if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
                this.currentState = ASN_STATES.ADMIN_AUTH_ACTIVE;
                this.isHydrating = false;
                this.renderAccountCenterUI();
            } else if (serverRole === 'WALI_SANTRI') {
                this.currentRole = ASN_ROLES.WALI_SANTRI;
                this.currentState = ASN_STATES.WALI_HYDRATING;
                this.renderAccountCenterUI();

                // Hydrate parent profile & student relationships from server
                const [profRes, studRes] = await Promise.all([
                    ASNAuthAPI.getParentProfile(token),
                    ASNAuthAPI.getParentStudents(token)
                ]);

                if (profRes.success && profRes.parent) {
                    this.currentUser = profRes.parent;
                    sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(profRes.parent));
                    localStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(profRes.parent));
                } else if (verifyRes.identity) {
                    this.currentUser = verifyRes.identity;
                }

                if (studRes.success && Array.isArray(studRes.students)) {
                    this.linkedStudents = studRes.students;
                    sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(studRes.students));
                    this.studentsLoadFailed = false;
                } else {
                    console.warn('[ASNIdentity] Gagal memuat daftar santri terhubung.');
                    this.studentsLoadFailed = true;
                }

                this.currentState = ASN_STATES.WALI_AUTH_ACTIVE;
                this.isHydrating = false;
                this.renderAccountCenterUI();
            } else {
                this.clearLocalSession();
                this.currentState = ASN_STATES.PUBLIC;
                this.currentRole = ASN_ROLES.PUBLIC;
                this.currentUser = null;
                this.isHydrating = false;
                this.renderAccountCenterUI();
            }
        } catch (err) {
            console.error('[ASNIdentity] Exception saat session hydration:', err);
            this.clearLocalSession();
            this.currentState = ASN_STATES.PUBLIC;
            this.currentRole = ASN_ROLES.PUBLIC;
            this.currentUser = null;
            this.isHydrating = false;
            this.renderAccountCenterUI();
        }
    },

    getRole() {
        return this.currentRole;
    },

    getUser() {
        return this.currentUser;
    },

    resolveIdentity() {
        return this.currentRole;
    },

    setPengasuhSession(token, pengasuhData) {
        if (!token) return;
        sessionStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN, token);
        localStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN, token);
        sessionStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(pengasuhData || {}));
        localStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(pengasuhData || {}));
        this.currentRole = ASN_ROLES.PENGASUH;
        this.currentUser = pengasuhData;
        this.currentState = ASN_STATES.PENGASUH_AUTH_ACTIVE;
        this.renderAccountCenterUI();
    },

    setAdminSession(token, adminData) {
        if (!token) return;
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_TOKEN, token);
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, ASN_ROLES.ADMIN);
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(adminData || {}));
        this.currentRole = ASN_ROLES.ADMIN;
        this.currentUser = adminData;
        if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
        this.currentState = ASN_STATES.ADMIN_AUTH_ACTIVE;
        this.renderAccountCenterUI();
    },

    setParentSession(token, parentData, students) {
        if (!token) return;
        sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_TOKEN, token);
        localStorage.setItem(ASN_STORAGE_KEYS.PARENT_TOKEN, token);
        sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(parentData || {}));
        localStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(parentData || {}));
        sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(students || []));
        this.currentRole = ASN_ROLES.WALI_SANTRI;
        this.currentUser = parentData;
        this.linkedStudents = Array.isArray(students) ? students : [];
        this.studentsLoadFailed = false;
        this.currentState = ASN_STATES.WALI_AUTH_ACTIVE;
        this.renderAccountCenterUI();
    },

    async retryLoadStudents() {
        const token = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        if (!token) return;
        const listContainer = document.getElementById('parent-linked-students-list');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] text-center space-y-1">
                    <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-lg mb-1"></i>
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-200">Memuat ulang data santri...</p>
                </div>
            `;
        }

        const studRes = await ASNAuthAPI.getParentStudents(token);
        if (studRes.success && Array.isArray(studRes.students)) {
            this.linkedStudents = studRes.students;
            sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(studRes.students));
            this.studentsLoadFailed = false;
            this.renderLinkedStudents();
        } else {
            this.studentsLoadFailed = true;
            this.renderLinkedStudents();
            if (typeof showToast === 'function') {
                showToast('Gagal memuat santri. Silakan periksa koneksi.');
            }
        }
    },

    async logout(triggerBtn) {
        if (triggerBtn) {
            try {
                triggerBtn.disabled = true;
                triggerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i><span class="ml-1 text-xs">Keluar...</span>';
            } catch (e) {}
        }
        try {
            document.querySelectorAll('button[onclick*="logout"]').forEach(b => {
                b.disabled = true;
                b.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i><span class="ml-1 text-xs">Keluar...</span>';
            });
        } catch (e) {}

        const token = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || 
                      localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || 
                      sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || 
                      sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) ||
                      localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN);

        this.currentState = ASN_STATES.LOGGING_OUT;
        this.renderAccountCenterUI();

        // 1. Server-Side Revocation (Phase 2B): beritahu backend untuk mencabut sesi
        if (token) {
            try {
                await ASNAuthAPI.logoutSession(token);
            } catch (e) {
                console.warn('[ASNIdentity] Server logout notice failed:', e);
            }
        }

        // 2. Clear local storage & memory state
        this.clearLocalSession();

        this.currentRole = ASN_ROLES.PUBLIC;
        this.currentUser = null;
        this.linkedStudents = [];
        this.studentsLoadFailed = false;
        this.currentState = ASN_STATES.PUBLIC;
        if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = false;

        this.renderAccountCenterUI();
        if (typeof showToast === 'function') {
            showToast('Anda telah keluar dari akun.');
        }
    },

    clearLocalSession() {
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN);
        localStorage.removeItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PENGASUH_DATA);
        localStorage.removeItem(ASN_STORAGE_KEYS.PENGASUH_DATA);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_TOKEN);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_ROLE);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_DATA);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_DATA);
        localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_DATA);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
        sessionStorage.removeItem('asn_temp_admin_email');
        sessionStorage.removeItem('asn_temp_parent_email');
        sessionStorage.removeItem('asn_temp_parent_phone');
        sessionStorage.removeItem('asn_temp_activation_data');

        // Bersihkan token legacy jika ada
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
    },

    renderAccountCenterUI() {
        const hydratingEl = document.getElementById('account-state-hydrating');
        const publicStateEl = document.getElementById('account-state-public');
        const adminStateEl = document.getElementById('account-state-admin');
        const waliStateEl = document.getElementById('account-state-wali');
        const pengasuhStateEl = document.getElementById('account-state-pengasuh');

        if (!publicStateEl || !adminStateEl || !waliStateEl) return;

        // Reset visibility
        if (hydratingEl) hydratingEl.classList.add('hidden');
        publicStateEl.classList.add('hidden');
        adminStateEl.classList.add('hidden');
        waliStateEl.classList.add('hidden');
        if (pengasuhStateEl) pengasuhStateEl.classList.add('hidden');

        // Update Desktop Navigation button
        this.updateDesktopNavButton();

        if (this.currentState === ASN_STATES.HYDRATING) {
            if (hydratingEl) hydratingEl.classList.remove('hidden');
            return;
        }

        if (this.currentRole === ASN_ROLES.PENGASUH) {
            if (pengasuhStateEl) {
                pengasuhStateEl.classList.remove('hidden');
                const nameEl = document.getElementById('pengasuh-display-name');
                const emailEl = document.getElementById('pengasuh-display-email');
                if (nameEl) nameEl.innerText = (this.currentUser && (this.currentUser.titleName || this.currentUser.name)) || 'Pengasuh Pesantren';
                if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope mr-1.5 text-amber-400"></i> ${escapeHtml((this.currentUser && this.currentUser.email) || '-')}`;
            }
        } else if (this.currentRole === ASN_ROLES.ADMIN || this.currentRole === ASN_ROLES.EDITOR) {
            adminStateEl.classList.remove('hidden');
            const nameEl = document.getElementById('admin-display-name');
            const emailEl = document.getElementById('admin-display-email');
            if (nameEl) nameEl.innerText = (this.currentUser && this.currentUser.name) || 'Administrator';
            if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope mr-1"></i> ${escapeHtml((this.currentUser && this.currentUser.email) || 'admin@asnawiyyah.sch.id')}`;
        } else if (this.currentRole === ASN_ROLES.WALI_SANTRI) {
            waliStateEl.classList.remove('hidden');
            const nameEl = document.getElementById('parent-display-name');
            const emailEl = document.getElementById('parent-display-email') || document.getElementById('parent-display-phone');
            if (nameEl) nameEl.innerText = (this.currentUser && this.currentUser.name) || 'Wali Santri';
            if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope mr-1.5 text-emerald-600 dark:text-emerald-400"></i> ${escapeHtml((this.currentUser && this.currentUser.email) || '-')}`;
            
            // Render linked students
            this.renderLinkedStudents();
        } else {
            // PUBLIC
            publicStateEl.classList.remove('hidden');
        }
    },

    updateDesktopNavButton() {
        const btn = document.getElementById('desk-nav-account-btn');
        const label = document.getElementById('desk-nav-account-label');
        const icon = document.getElementById('desk-nav-account-icon');
        if (!btn || !label) return;

        if (this.currentRole === ASN_ROLES.PENGASUH) {
            label.innerText = 'Pengasuh';
            if (icon) icon.className = 'fa-solid fa-kaaba text-xs text-amber-300';
            btn.className = 'bg-emerald-950 hover:bg-emerald-900 text-amber-200 border border-amber-500/40 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 flex items-center space-x-1.5';
        } else if (this.currentRole === ASN_ROLES.ADMIN || this.currentRole === ASN_ROLES.EDITOR) {
            label.innerText = 'Pengelola';
            if (icon) icon.className = 'fa-solid fa-shield-halved text-xs text-emerald-300';
            btn.className = 'bg-brand-800 hover:bg-brand-700 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 flex items-center space-x-1.5';
        } else if (this.currentRole === ASN_ROLES.WALI_SANTRI) {
            label.innerText = 'Wali Santri';
            if (icon) icon.className = 'fa-solid fa-people-roof text-xs text-emerald-300';
            btn.className = 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500/30 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 flex items-center space-x-1.5';
        } else {
            label.innerText = 'Masuk / Akun';
            if (icon) icon.className = 'fa-solid fa-user-lock text-xs text-emerald-200';
            btn.className = 'bg-brand-800/80 hover:bg-brand-800 text-emerald-100 hover:text-white border border-emerald-500/20 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all duration-200 flex items-center space-x-1.5';
        }
    },

    renderLinkedStudents() {
        const listContainer = document.getElementById('parent-linked-students-list');
        if (!listContainer) return;

        if (this.currentState === ASN_STATES.WALI_HYDRATING) {
            listContainer.innerHTML = `
                <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] text-center space-y-1 animate-pulse">
                    <i class="fa-solid fa-spinner fa-spin text-emerald-600 text-lg mb-1"></i>
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-200">Memuat data santri dari database...</p>
                </div>
            `;
            return;
        }

        if (this.studentsLoadFailed) {
            listContainer.innerHTML = `
                <div class="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center space-y-2">
                    <i class="fa-solid fa-triangle-exclamation text-rose-600 text-lg"></i>
                    <h4 class="text-xs font-bold text-rose-800 dark:text-rose-200">Gagal Memuat Data Santri</h4>
                    <p class="text-[10px] text-rose-600 dark:text-rose-300">Terjadi kendala saat mengambil data santri terhubung.</p>
                    <button type="button" onclick="ASNIdentity.retryLoadStudents()" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition">
                        Coba Muat Ulang Data Santri
                    </button>
                </div>
            `;
            return;
        }

        let students = this.linkedStudents;
        if (!Array.isArray(students) || students.length === 0) {
            try {
                const raw = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
                if (raw) students = JSON.parse(raw);
            } catch (e) {
                students = [];
            }
        }

        if (!Array.isArray(students) || students.length === 0) {
            listContainer.innerHTML = `
                <div class="p-5 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] text-center space-y-1.5">
                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-base">
                        <i class="fa-solid fa-user-graduate"></i>
                    </div>
                    <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">Belum Ada Santri Terhubung</h4>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Silakan hubungi bagian administrasi madrasah untuk verifikasi data putra/putri Anda.</p>
                </div>
            `;
            return;
        }

        // Server-authorized data rendered directly without client-side ID filtering
        listContainer.innerHTML = students.map(s => `
            <div class="p-3.5 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] flex items-center justify-between">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(s.name || s.nama || 'Santri')}</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">NISN: ${escapeHtml(s.nisn || '-')} • ${escapeHtml(s.program || s.className || 'Reguler')}</p>
                    </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    ${escapeHtml(s.status || 'Aktif')}
                </span>
            </div>
        `).join('');
    }
};

// =====================================================================
// PHASE 2A: AUTHENTICATION UI CONTROLLERS
// =====================================================================

// ----- Admin Modal Controllers -----
function openAdminAuthModal() {
    const modal = document.getElementById('modal-auth-admin');
    const content = document.getElementById('modal-auth-admin-content');
    if (!modal || !content) return;

    resetAdminAuthStep();
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        const emailInput = document.getElementById('admin-auth-email');
        if (emailInput) emailInput.focus();
        if (typeof initGoogleAuth === 'function') initGoogleAuth();
    }, 50);
}

function closeAdminAuthModal() {
    const modal = document.getElementById('modal-auth-admin');
    const content = document.getElementById('modal-auth-admin-content');
    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
        if (activeTabEl && activeTabEl.id === 'page-admin' && (typeof isAdminLoggedIn === 'undefined' || !isAdminLoggedIn)) {
            if (typeof switchTab === 'function') switchTab('beranda');
        }
    }, 250);
}

function resetAdminAuthStep() {
    const formReq = document.getElementById('form-admin-request-otp');
    const formVer = document.getElementById('form-admin-verify-otp');
    const alertBox = document.getElementById('admin-auth-alert');

    if (formReq) formReq.classList.remove('hidden');
    if (formVer) formVer.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    const otpInput = document.getElementById('admin-auth-otp');
    if (otpInput) otpInput.value = '';
}

async function handleAdminRequestOtp(e) {
    e.preventDefault();
    const emailInput = document.getElementById('admin-auth-email');
    const btn = document.getElementById('btn-admin-request-otp');
    const alertBox = document.getElementById('admin-auth-alert');
    const alertText = document.getElementById('admin-auth-alert-text');

    if (!emailInput || !btn) return;
    const email = emailInput.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.requestAdminOtp(email);
        if (result.success) {
            // Pindah ke step 2
            document.getElementById('form-admin-request-otp').classList.add('hidden');
            document.getElementById('form-admin-verify-otp').classList.remove('hidden');
            document.getElementById('admin-auth-target-email').innerText = email;
            sessionStorage.setItem('asn_temp_admin_email', email);

            const otpInput = document.getElementById('admin-auth-otp');
            if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 150);
            }
        } else {
            // Tampilkan error secara aman (fail safely)
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Gagal meminta OTP.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Terjadi kesalahan sistem saat meminta OTP.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Kirim Kode OTP</span><i class="fa-solid fa-arrow-right"></i>`;
    }
}

async function handleAdminVerifyOtp(e) {
    e.preventDefault();
    const email = sessionStorage.getItem('asn_temp_admin_email');
    const otpInput = document.getElementById('admin-auth-otp');
    const btn = document.getElementById('btn-admin-verify-otp');
    const alertBox = document.getElementById('admin-auth-alert');
    const alertText = document.getElementById('admin-auth-alert-text');

    if (!otpInput || !btn) return;
    const otp = otpInput.value.trim();

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Memverifikasi...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.verifyAdminOtp(email, otp);
        if (result.success && result.token) {
            ASNIdentity.setAdminSession(result.token, result.admin);
            closeAdminAuthModal();
            if (typeof showToast === 'function') {
                showToast('Login Admin Berhasil!');
            }
            if (window.innerWidth >= 1024 && (window.location.pathname.replace(/\/+$/, '') === '/administrator' || document.getElementById('page-admin')?.classList.contains('block'))) {
                if (typeof switchTab === 'function') switchTab('admin');
                if (typeof showAdminView === 'function') showAdminView('hub');
            }
        } else {
            // Fail safely: tampilkan error, jangan login, jangan bypass!
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Kode OTP tidak valid atau layanan server belum siap.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Verifikasi OTP gagal.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Verifikasi & Masuk</span><i class="fa-solid fa-check"></i>`;
    }
}

// ----- Parent / Wali Santri Modal Controllers -----
function openParentAuthModal() {
    const modal = document.getElementById('modal-auth-parent');
    const content = document.getElementById('modal-auth-parent-content');
    if (!modal || !content) return;

    resetParentAuthStep();
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        const emailInput = document.getElementById('parent-auth-email') || document.getElementById('parent-auth-phone');
        if (emailInput) emailInput.focus();
        if (typeof initGoogleAuth === 'function') initGoogleAuth();
    }, 50);
}

function closeParentAuthModal() {
    const modal = document.getElementById('modal-auth-parent');
    const content = document.getElementById('modal-auth-parent-content');
    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 250);
}

function resetParentAuthStep() {
    const formReq = document.getElementById('form-parent-request-otp');
    const formVer = document.getElementById('form-parent-verify-otp');
    const alertBox = document.getElementById('parent-auth-alert');

    if (formReq) formReq.classList.remove('hidden');
    if (formVer) formVer.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    const otpInput = document.getElementById('parent-otp-code');
    if (otpInput) otpInput.value = '';
}

async function handleParentRequestOtp(e) {
    e.preventDefault();
    const emailInput = document.getElementById('parent-auth-email') || document.getElementById('parent-auth-phone');
    const btn = document.getElementById('btn-parent-request-otp');
    const alertBox = document.getElementById('parent-auth-alert');
    const alertText = document.getElementById('parent-auth-alert-text');

    if (!emailInput || !btn) return;
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.requestParentOtp(email);
        if (result.success) {
            document.getElementById('form-parent-request-otp').classList.add('hidden');
            document.getElementById('form-parent-verify-otp').classList.remove('hidden');
            const targetEl = document.getElementById('parent-auth-target-email') || document.getElementById('parent-auth-target-phone');
            if (targetEl) targetEl.innerText = email;
            sessionStorage.setItem('asn_temp_parent_email', email);

            const otpInput = document.getElementById('parent-otp-code');
            if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 150);
            }
        } else {
            // Fail safely: tampilkan error, jangan login, jangan bypass!
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Gagal meminta OTP.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Terjadi kesalahan sistem saat meminta OTP.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Kirim Kode OTP ke Email</span><i class="fa-solid fa-paper-plane"></i>`;
    }
}

async function handleParentVerifyOtp(e) {
    e.preventDefault();
    const email = sessionStorage.getItem('asn_temp_parent_email') || sessionStorage.getItem('asn_temp_parent_phone');
    const otpInput = document.getElementById('parent-otp-code');
    const btn = document.getElementById('btn-parent-verify-otp');
    const alertBox = document.getElementById('parent-auth-alert');
    const alertText = document.getElementById('parent-auth-alert-text');

    if (!otpInput || !btn) return;
    const otp = otpInput.value.trim();

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Memverifikasi...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.verifyParentOtp(email, otp);
        if (result.success && result.token) {
            ASNIdentity.setParentSession(result.token, result.parent, result.students);
            closeParentAuthModal();
            if (typeof showToast === 'function') {
                showToast('Login Wali Santri Berhasil!');
            }
        } else {
            // Fail safely: tampilkan error, jangan login, jangan bypass!
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Kode OTP tidak valid atau layanan server belum siap.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Verifikasi OTP gagal.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Verifikasi & Masuk Dashboard Wali</span><i class="fa-solid fa-check"></i>`;
    }
}

// ----- Wali Santri Activation Controllers -----
function openParentActivationModal(prefillEmail = "", prefillName = "") {
    const modal = document.getElementById('modal-parent-activation');
    const content = document.getElementById('modal-parent-activation-content');
    if (!modal || !content) return;

    resetParentActivationStep();
    if (prefillEmail) {
        const emailInput = document.getElementById('activation-wali-email');
        if (emailInput) emailInput.value = prefillEmail;
    }
    if (prefillName) {
        const nameInput = document.getElementById('activation-wali-name');
        if (nameInput) nameInput.value = prefillName;
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        const nisnInput = document.getElementById('activation-nisn');
        if (nisnInput) nisnInput.focus();
    }, 50);
}

function closeParentActivationModal() {
    const modal = document.getElementById('modal-parent-activation');
    const content = document.getElementById('modal-parent-activation-content');
    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 250);
}

function resetParentActivationStep() {
    const step1 = document.getElementById('form-activation-step1');
    const step2 = document.getElementById('form-activation-step2');
    const alertBox = document.getElementById('activation-alert');

    if (step1) step1.classList.remove('hidden');
    if (step2) step2.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    const otpInput = document.getElementById('activation-otp-code');
    if (otpInput) otpInput.value = '';
}

async function handleParentActivationRequest(e) {
    e.preventDefault();
    const nisn = (document.getElementById('activation-nisn')?.value || '').trim();
    const birthDate = (document.getElementById('activation-birth-date')?.value || '').trim();
    const waliName = (document.getElementById('activation-wali-name')?.value || '').trim();
    const waliEmail = (document.getElementById('activation-wali-email')?.value || '').trim().toLowerCase();
    const waliPhone = (document.getElementById('activation-wali-phone')?.value || '').trim();
    const relationship = (document.getElementById('activation-relationship')?.value || 'GUARDIAN').trim();

    const btn = document.getElementById('btn-activation-step1');
    const alertBox = document.getElementById('activation-alert');
    const alertText = document.getElementById('activation-alert-text');

    if (!nisn || !birthDate || !waliEmail) {
        if (alertBox && alertText) {
            alertText.innerText = 'NISN, Tanggal Lahir, dan Email Wali wajib diisi.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Mencocokkan Data Santri...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    const payload = {
        nisn,
        birthDate,
        waliName,
        waliEmail,
        waliPhone,
        relationship
    };

    try {
        const result = await ASNAuthAPI.activateParent(payload);
        if (result && result.success) {
            sessionStorage.setItem('asn_temp_activation_data', JSON.stringify(payload));
            document.getElementById('form-activation-step1').classList.add('hidden');
            document.getElementById('form-activation-step2').classList.remove('hidden');

            const targetEmail = document.getElementById('activation-target-email');
            if (targetEmail) targetEmail.innerText = waliEmail;

            const targetStudent = document.getElementById('activation-target-student');
            if (targetStudent) targetStudent.innerText = result.studentName || 'Santri Ditemukan';

            const otpInput = document.getElementById('activation-otp-code');
            if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 150);
            }
        } else {
            if (alertBox && alertText) {
                alertText.innerText = (result && result.message) || 'Data santri tidak cocok.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Terjadi kesalahan sistem saat meminta kode verifikasi.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Lanjut Verifikasi OTP</span><i class="fa-solid fa-arrow-right"></i>`;
    }
}

async function handleParentActivationVerify(e) {
    e.preventDefault();
    const otp = (document.getElementById('activation-otp-code')?.value || '').trim();
    const btn = document.getElementById('btn-activation-step2');
    const alertBox = document.getElementById('activation-alert');
    const alertText = document.getElementById('activation-alert-text');

    let payload = {};
    try {
        const raw = sessionStorage.getItem('asn_temp_activation_data');
        if (raw) payload = JSON.parse(raw);
    } catch (e) {}

    if (!payload.nisn || !payload.waliEmail) {
        if (alertBox && alertText) {
            alertText.innerText = 'Sesi aktivasi kedaluwarsa. Silakan isi ulang data formulir.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    payload.otp = otp;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Mengaktifkan Akun...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.verifyParentActivation(payload);
        if (result && result.success && result.token) {
            sessionStorage.removeItem('asn_temp_activation_data');
            ASNIdentity.setParentSession(result.token, result.parent || result.identity, result.students);
            closeParentActivationModal();
            if (typeof showToast === 'function') {
                showToast(result.message || 'Akun Wali Santri berhasil diaktifkan!');
            }
        } else {
            if (alertBox && alertText) {
                alertText.innerText = (result && result.message) || 'Kode OTP aktivasi salah atau kedaluwarsa.';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = 'Verifikasi aktivasi gagal.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Selesaikan Aktivasi</span><i class="fa-solid fa-circle-check"></i>`;
    }
}

// ----- Pengasuh Modal Controllers -----
function openPengasuhAuthModal() {
    const modal = document.getElementById('modal-auth-pengasuh');
    const content = document.getElementById('modal-auth-pengasuh-content');
    if (!modal || !content) return;

    const alertBox = document.getElementById('pengasuh-auth-alert');
    if (alertBox) alertBox.classList.add('hidden');

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        if (typeof initGoogleAuth === 'function') initGoogleAuth();
    }, 50);
}

function closePengasuhAuthModal() {
    const modal = document.getElementById('modal-auth-pengasuh');
    const content = document.getElementById('modal-auth-pengasuh-content');
    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 250);
}

function togglePintuAksesResmi() {
    const dropdown = document.getElementById('dropdown-pintu-akses');
    const icon = document.getElementById('icon-pintu-akses');
    const btn = document.getElementById('btn-pintu-akses');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
        dropdown.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
        dropdown.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
}

function openAdminModuleFromControlCenter(viewName) {
    if (typeof switchTab === 'function') {
        switchTab('admin', false);
    }
    if (typeof showAdminView === 'function') {
        showAdminView(viewName);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleLegacyAuthPanel() {
    const panel = document.getElementById('legacy-auth-panel');
    const chevron = document.getElementById('legacy-auth-chevron');
    if (!panel) return;

    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
    } else {
        panel.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
}


// =====================================================================
// LEGACY AUTHENTICATION COMPATIBILITY LAYER
// (Dipertahankan untuk kompatibilitas backward selama migrasi)
// =====================================================================
const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbz074VHNTe4YpDAAn7dD-uTkTGGJKxxd6vYX6DHU0oI7j0FBVzIMfyje4E5tYuY9sEKqg/exec"; 
const GOOGLE_CLIENT_ID = "967127815898-6padn433letamnjfuacb5eg8pnv728p4.apps.googleusercontent.com"; 

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Identity Architecture baru
    ASNIdentity.init();

    // Kompatibilitas Legacy
    checkAuthState();
    initGoogleAuth();
});

function checkAuthState() {
    // Sesi baru diutamakan
    ASNIdentity.resolveIdentity();
    ASNIdentity.renderAccountCenterUI();

    const token = localStorage.getItem('user_token');
    const userDataStr = localStorage.getItem('user_data');
    
    const legacyLoggedInView = document.getElementById('profile-logged-in');
    const legacyLoggedOutView = document.getElementById('profile-logged-out');
    
    if (legacyLoggedInView && legacyLoggedOutView) {
        if (token && userDataStr) {
            legacyLoggedInView.classList.remove('hidden');
            legacyLoggedOutView.classList.add('hidden');
        } else {
            legacyLoggedInView.classList.add('hidden');
            legacyLoggedOutView.classList.remove('hidden');
        }
    }
}

function handleLogout() {
    ASNIdentity.logout();
}

async function handleEmailAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('btn-auth-email');
    const errorMsg = document.getElementById('login-error-msg');
    
    if (!email || !password) return;
    
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memproses...`;
    btn.disabled = true;
    if (errorMsg) errorMsg.classList.add('hidden');
    
    try {
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email: email, password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            checkAuthState();
            if (typeof showToast === 'function') showToast('Login berhasil!');
        } else {
            if (data.message && (data.message.includes('belum terdaftar') || data.message.includes('not found'))) {
                const otpResp = await fetch(AUTH_API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'request_otp', email: email })
                });
                const otpData = await otpResp.json();
                
                if (otpData.success) {
                    const targetEl = document.getElementById('otp-target-email');
                    if (targetEl) targetEl.innerText = email;
                    
                    sessionStorage.setItem('temp_reg_email', email);
                    sessionStorage.setItem('temp_reg_password', password);
                    
                    const modal = document.getElementById('otpModal');
                    if (modal) {
                        modal.classList.remove('hidden');
                        setTimeout(() => {
                            const content = document.getElementById('otpModalContent');
                            if (content) content.classList.remove('scale-95', 'opacity-0');
                        }, 50);
                    }
                } else {
                    throw new Error(otpData.message || "Gagal mengirim OTP");
                }
            } else {
                throw new Error(data.message || "Login gagal");
            }
        }
    } catch (error) {
        if (errorMsg) {
            errorMsg.innerText = error.message;
            errorMsg.classList.remove('hidden');
        }
    } finally {
        btn.innerHTML = `Masuk (Legacy)`;
        btn.disabled = false;
    }
}

function closeOtpModal() {
    const content = document.getElementById('otpModalContent');
    const modal = document.getElementById('otpModal');
    if (content) content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        if (modal) modal.classList.add('hidden');
    }, 300);
}

async function submitOtp(e) {
    e.preventDefault();
    const otp = document.getElementById('otp-input').value;
    const email = sessionStorage.getItem('temp_reg_email');
    const password = sessionStorage.getItem('temp_reg_password');
    const btn = document.getElementById('btn-submit-otp');
    const errorMsg = document.getElementById('otp-error-msg');
    
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...`;
    btn.disabled = true;
    if (errorMsg) errorMsg.classList.add('hidden');
    
    try {
        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'verify_otp', email: email, otp: otp, password: password })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            
            sessionStorage.removeItem('temp_reg_email');
            sessionStorage.removeItem('temp_reg_password');
            
            closeOtpModal();
            checkAuthState();
            if (typeof showToast === 'function') showToast('Akun berhasil diverifikasi!');
        } else {
            throw new Error(data.message || "Verifikasi OTP gagal");
        }
    } catch (error) {
        if (errorMsg) {
            errorMsg.innerText = error.message;
            errorMsg.classList.remove('hidden');
        }
    } finally {
        btn.innerHTML = `<span>Verifikasi Akun</span><i class="fa-solid fa-check-circle"></i>`;
        btn.disabled = false;
    }
}

function initGoogleAuth() {
    if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(initGoogleAuth, 500);
        return;
    }
    
    if (GOOGLE_CLIENT_ID.includes('GANTI_DENGAN')) return;

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    const pengasuhBtn = document.getElementById("google-signin-pengasuh");
    if (pengasuhBtn) {
        google.accounts.id.renderButton(
            pengasuhBtn,
            { theme: "filled_blue", size: "large", text: "continue_with", shape: "pill" }
        );
    }

    const parentBtn = document.getElementById("google-signin-parent");
    if (parentBtn) {
        google.accounts.id.renderButton(
            parentBtn,
            { theme: "outline", size: "large", text: "continue_with", shape: "pill" }
        );
    }

    const adminBtn = document.getElementById("google-signin-admin");
    if (adminBtn) {
        google.accounts.id.renderButton(
            adminBtn,
            { theme: "outline", size: "large", text: "continue_with", shape: "pill" }
        );
    }

    const legacyContainer = document.getElementById("google-signin-container");
    if (legacyContainer) {
        google.accounts.id.renderButton(
            legacyContainer,
            { theme: "outline", size: "large", text: "continue_with", shape: "pill" }
        );
    }
}

async function handleCredentialResponse(response) {
    const token = response.credential;
    if (!token) return;

    // Deteksi modal atau tab mana yang sedang aktif
    let roleHint = "";
    const pengasuhModalOpen = document.getElementById('modal-auth-pengasuh') && !document.getElementById('modal-auth-pengasuh').classList.contains('hidden');
    const adminModalOpen = document.getElementById('modal-auth-admin') && !document.getElementById('modal-auth-admin').classList.contains('hidden');
    const parentModalOpen = document.getElementById('modal-auth-parent') && !document.getElementById('modal-auth-parent').classList.contains('hidden');

    if (pengasuhModalOpen) roleHint = "PENGASUH";
    else if (adminModalOpen) roleHint = "ADMIN";
    else if (parentModalOpen) roleHint = "WALI_SANTRI";

    if (typeof showToast === 'function') {
        showToast('Memverifikasi akun Google...');
    }

    try {
        const ssoResult = await ASNAuthAPI.ssoGoogle(token, roleHint);
        if (ssoResult && ssoResult.success) {
            const role = String(ssoResult.role || '').toUpperCase();
            if (role === 'PENGASUH') {
                ASNIdentity.setPengasuhSession(ssoResult.token, ssoResult.pengasuh || ssoResult.identity);
                if (typeof closePengasuhAuthModal === 'function') closePengasuhAuthModal();
                if (typeof showToast === 'function') showToast(`Ahlan wa Sahlan, ${ssoResult.identity?.name || 'Pengasuh'}`);
            } else if (role === 'ADMIN' || role === 'EDITOR') {
                ASNIdentity.setAdminSession(ssoResult.token, ssoResult.admin || ssoResult.identity);
                if (typeof closeAdminAuthModal === 'function') closeAdminAuthModal();
                if (typeof showToast === 'function') showToast('Login Pengelola Berhasil!');
                if (window.innerWidth >= 1024 && (window.location.pathname.replace(/\/+$/, '') === '/administrator' || document.getElementById('page-admin')?.classList.contains('block'))) {
                    if (typeof switchTab === 'function') switchTab('admin');
                    if (typeof showAdminView === 'function') showAdminView('hub');
                }
            } else if (role === 'WALI_SANTRI') {
                ASNIdentity.setParentSession(ssoResult.token, ssoResult.parent || ssoResult.identity, ssoResult.students);
                if (typeof closeParentAuthModal === 'function') closeParentAuthModal();
                if (typeof showToast === 'function') showToast('Login Wali Santri Berhasil!');
            }
            return;
        }

        if (ssoResult && ssoResult.notRegistered) {
            if (roleHint === 'WALI_SANTRI' || !roleHint) {
                if (typeof closeParentAuthModal === 'function') closeParentAuthModal();
                if (typeof openParentActivationModal === 'function') {
                    openParentActivationModal(ssoResult.email, ssoResult.name);
                }
                if (typeof showToast === 'function') {
                    showToast('Email belum terdaftar. Silakan aktivasi akun menggunakan NISN & Tanggal Lahir santri.');
                }
            } else {
                const alertEl = document.getElementById(roleHint === 'ADMIN' ? 'admin-auth-alert' : 'pengasuh-auth-alert');
                const alertText = document.getElementById(roleHint === 'ADMIN' ? 'admin-auth-alert-text' : 'pengasuh-auth-alert-text');
                if (alertEl && alertText) {
                    alertText.innerText = ssoResult.message || 'Email Google tidak terdaftar dalam daftar resmi.';
                    alertEl.classList.remove('hidden');
                } else if (typeof showToast === 'function') {
                    showToast(ssoResult.message || 'Email Google tidak terdaftar.');
                }
            }
            return;
        }

        const msg = (ssoResult && ssoResult.message) || 'Verifikasi Google Sign-In gagal.';
        if (typeof showToast === 'function') showToast(msg);
    } catch (e) {
        console.error('[Google SSO] Exception:', e);
        if (typeof showToast === 'function') showToast('Terjadi kendala memproses Google Sign-In.');
    }
}