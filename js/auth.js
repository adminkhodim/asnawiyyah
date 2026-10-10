// =====================================================================
// ASNAWIYYAH IDENTITY & ACCOUNT CENTER (PHASE 1 & 2A)
// =====================================================================

/**
 * Official Product Roles
 */
const ASN_ROLES = Object.freeze({
    PUBLIC: 'PUBLIC',
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    ASATIDZ: 'ASATIDZ',
    BENDAHARA: 'BENDAHARA',
    PENGURUS: 'PENGURUS',
    WALI_SANTRI: 'WALI_SANTRI',
    PENGASUH: 'PENGASUH'
});

function isAsnAdminRole(role) {
    const r = String(role || '').trim().toUpperCase();
    return [ASN_ROLES.SUPER_ADMIN, ASN_ROLES.ADMIN, ASN_ROLES.EDITOR, ASN_ROLES.ASATIDZ, ASN_ROLES.BENDAHARA, ASN_ROLES.PENGURUS].includes(r);
}

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
    LOGOUT: 'auth.logout',
    USER_UPLOAD_PHOTO: 'auth.user.uploadPhoto',
    ADMIN_USER_LIST: 'auth.admin.userList',
    ADMIN_USER_SAVE: 'auth.admin.userSave',
    ADMIN_USER_TOGGLE_STATUS: 'auth.admin.userToggleStatus'
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
const ASN_PHASE2B_AUTH_URL = (typeof ASNAWIYYAH_CONFIG !== 'undefined' && ASNAWIYYAH_CONFIG.apiUrl)
    ? ASNAWIYYAH_CONFIG.apiUrl
    : (typeof WEB_APP_URL !== 'undefined' ? WEB_APP_URL : "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec");

async function authApiPost(action, payload = {}) {
    // Akselerasi Cepat via Supabase Cloud DB untuk Read User List & Role Permissions (<50ms)
    const fastReadActions = ['auth.admin.userList', 'admin.users.list', 'admin.userList', 'getUsers', 'auth.admin.getRolePermissions', 'getRolePermissions'];
    if (fastReadActions.includes(action) && typeof fetchFromSupabase === 'function') {
        try {
            const sbData = await fetchFromSupabase(action, payload);
            if (sbData && (sbData.success || sbData.status === 'success') && (Array.isArray(sbData.users) || sbData.permissions)) {
                return sbData;
            }
        } catch (sbErr) {
            console.warn('[SUPABASE FAILOVER] authApiPost beralih ke Apps Script:', sbErr);
        }
    }

    const targetUrl = (typeof getApiUrl === 'function' && getApiUrl()) || 
                      (typeof window !== 'undefined' && window.ASNAWIYYAH_CONFIG && window.ASNAWIYYAH_CONFIG.apiUrl) || 
                      ASN_PHASE2B_AUTH_URL || 
                      (typeof WEB_APP_URL !== 'undefined' ? WEB_APP_URL : '');
    if (!targetUrl) throw new Error("Endpoint autentikasi belum dikonfigurasi.");

    // Jangan menyisipkan token lama untuk aksi publik/pra-autentikasi (mencegah token pollution)
    const unauthenticatedActions = [
        'auth.admin.requestOtp',
        'auth.admin.verifyOtp',
        'auth.parent.requestOtp',
        'auth.parent.verifyOtp',
        'auth.wali.requestOtp',
        'auth.wali.verifyOtp',
        'auth.sso.google'
    ];

    let token = payload.token || "";
    if (!token && !unauthenticatedActions.includes(action)) {
        token = (typeof getAdminSessionToken === "function" ? getAdminSessionToken() : (sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN))) || 
                sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || 
                localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) ||
                sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) ||
                localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || "";
    }

    const bodyPayload = { action, ...payload };
    if (token && !bodyPayload.token) {
        bodyPayload.token = token;
    }

    const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: Layanan server sedang mengalami kendala.`);
    const rawText = await response.text();
    let resJson;
    try {
        resJson = JSON.parse(rawText);
    } catch (parseErr) {
        console.warn('[authApiPost] Gagal parse JSON respons:', rawText);
        throw new Error('Respons dari server tidak berformat valid.');
    }
    if (resJson && (resJson.success || resJson.status === "success") && typeof window.syncToSupabaseOnWrite === "function") {
        window.syncToSupabaseOnWrite(action, payload, resJson).catch(e => console.warn("[AUTH DUAL-WRITE CATCH]", e));
    }
    return resJson;
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
            const detailMsg = (err && err.message) ? err.message : 'Pastikan koneksi internet stabil.';
            return {
                success: false,
                unavailable: true,
                message: `Gagal mengirimkan kode OTP ke email pengelola (${detailMsg})`
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
            const detailMsg = (err && err.message) ? err.message : 'Terjadi kendala komunikasi ke server.';
            return {
                success: false,
                unavailable: true,
                message: `Verifikasi OTP gagal. ${detailMsg}`
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
            const detailMsg = (err && err.message) ? err.message : 'Pastikan koneksi internet stabil.';
            return {
                success: false,
                unavailable: true,
                message: `Gagal menghubungi server autentikasi Email OTP (${detailMsg})`
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
            const detailMsg = (err && err.message) ? err.message : 'Terjadi kendala komunikasi ke server.';
            return {
                success: false,
                unavailable: true,
                message: `Verifikasi Email OTP gagal. ${detailMsg}`
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
    },

    async uploadUserPhoto(filePayload, role, identityId) {
        const token = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || 
                      localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || 
                      sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || 
                      localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || 
                      sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || 
                      localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || "";
        return await authApiPost(ASN_AUTH_ACTIONS.USER_UPLOAD_PHOTO, {
            token: token,
            data: {
                file: filePayload,
                role: role,
                identityId: identityId
            }
        });
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
        // Optimistic cache load: periksa sesi lokal terlebih dahulu agar UI instan (0 ms)
        const pengasuhToken = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN);
        const adminToken = sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN);
        const parentToken = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PARENT_TOKEN);

        if (pengasuhToken) {
            this.currentRole = ASN_ROLES.PENGASUH;
            this.currentState = ASN_STATES.PENGASUH_AUTH_ACTIVE;
            try {
                const saved = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_DATA) || localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_DATA);
                if (saved) this.currentUser = JSON.parse(saved);
            } catch (e) {}
            if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
        } else if (adminToken) {
            const savedRole = sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_ROLE) || localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_ROLE) || 'ADMIN';
            const normalizedRole = String(savedRole).toUpperCase();
            this.currentRole = normalizedRole;
            this.currentState = ASN_STATES.ADMIN_AUTH_ACTIVE;
            try {
                const savedData = sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_DATA) || localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_DATA);
                this.currentUser = savedData ? JSON.parse(savedData) : { name: 'Administrator Pesantren', email: 'admin@asnawiyyah.sch.id', role: normalizedRole };
            } catch (e) {}
            if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
        } else if (parentToken) {
            this.currentRole = ASN_ROLES.WALI_SANTRI;
            this.currentState = ASN_STATES.PARENT_AUTH_ACTIVE;
            try {
                const saved = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_DATA) || localStorage.getItem(ASN_STORAGE_KEYS.PARENT_DATA);
                if (saved) this.currentUser = JSON.parse(saved);
                const savedStuds = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_STUDENTS) || localStorage.getItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
                if (savedStuds) this.linkedStudents = JSON.parse(savedStuds);
            } catch (e) {}
        } else {
            this.currentRole = ASN_ROLES.PUBLIC;
            this.currentState = ASN_STATES.PUBLIC;
            this.currentUser = null;
        }

        // Tampilkan antarmuka seketika (0 ms) tanpa kedipan skeleton
        this.renderAccountCenterUI();
        if (typeof applyAdminRoleVisibility === 'function' && (this.currentRole === ASN_ROLES.PENGASUH || isAsnAdminRole(this.currentRole))) {
            applyAdminRoleVisibility(this.currentRole);
        }

        // Silent background session re-validation & Presence Heartbeat
        if (pengasuhToken || adminToken || parentToken) {
            if (typeof startUserPresenceHeartbeat === 'function') startUserPresenceHeartbeat();
            this.hydrateSession(true).catch(err => {
                console.warn('[ASNIdentity] Silent hydration caught error:', err);
            });
        }
    },

    async hydrateSession(isSilent = false) {
        if (this.isHydrating) return;
        this.isHydrating = true;
        if (!isSilent) {
            this.currentState = ASN_STATES.HYDRATING;
            this.renderAccountCenterUI();
        }

        const pengasuhToken = sessionStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.PENGASUH_TOKEN);
        const adminToken = sessionStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN);
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
                // Grace Period: Jika server tidak dapat dihubungi (koneksi offline/timeout), jangan logout paksa
                if (verifyRes.unavailable) {
                    console.warn('[ASNIdentity] Server autentikasi tidak dapat dihubungi, mempertahankan sesi lokal (offline grace period).');
                    this.isHydrating = false;
                    return;
                }
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
            const isAdminTier = (serverRole === 'ADMIN' || serverRole === 'SUPER_ADMIN' || serverRole === 'EDITOR' || serverRole === 'PENGURUS' || serverRole === 'ASATIDZ' || serverRole === 'BENDAHARA');

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
                sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, 'PENGASUH');
                localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, 'PENGASUH');
                if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
                this.currentState = ASN_STATES.PENGASUH_AUTH_ACTIVE;
                this.isHydrating = false;
                this.renderAccountCenterUI();
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility('PENGASUH');
                }
            } else if (isAdminTier) {
                this.currentRole = serverRole;
                this.currentUser = verifyRes.identity || {
                    name: (verifyRes.identity && verifyRes.identity.name) || 'Administrator Pesantren',
                    email: (verifyRes.identity && verifyRes.identity.email) || 'admin@asnawiyyah.sch.id',
                    role: serverRole
                };
                sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, serverRole);
                localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, serverRole);
                sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(this.currentUser));
                localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(this.currentUser));
                if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
                this.currentState = ASN_STATES.ADMIN_AUTH_ACTIVE;
                this.isHydrating = false;
                this.renderAccountCenterUI();
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility(serverRole);
                }
            } else if (serverRole === 'WALI_SANTRI') {
                this.currentRole = ASN_ROLES.WALI_SANTRI;
                if (!isSilent) {
                    this.currentState = ASN_STATES.WALI_HYDRATING;
                    this.renderAccountCenterUI();
                }

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
                    localStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(studRes.students));
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
            console.error('[ASNIdentity] Network exception saat session hydration:', err);
            // Toleransi offline / network spike: pertahankan sesi lokal
            this.isHydrating = false;
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
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, 'PENGASUH');
        localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, 'PENGASUH');
        this.currentRole = ASN_ROLES.PENGASUH;
        this.currentUser = pengasuhData;
        if (typeof isAdminLoggedIn !== 'undefined') isAdminLoggedIn = true;
        this.currentState = ASN_STATES.PENGASUH_AUTH_ACTIVE;
        this.renderAccountCenterUI();
        if (typeof applyAdminRoleVisibility === 'function') {
            applyAdminRoleVisibility('PENGASUH');
        }
    },

    setAdminSession(token, adminData) {
        if (!token) return;
        const role = (adminData && adminData.role) || ASN_ROLES.ADMIN;
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_TOKEN, token);
        localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_TOKEN, token);
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, role);
        localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_ROLE, role);
        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(adminData || {}));
        localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(adminData || {}));
        this.currentRole = role;
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
        localStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(students || []));
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
            localStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(studRes.students));
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
                      localStorage.getItem(ASN_STORAGE_KEYS.ADMIN_TOKEN) || 
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
        localStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_TOKEN);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_ROLE);
        localStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_ROLE);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_DATA);
        localStorage.removeItem(ASN_STORAGE_KEYS.ADMIN_DATA);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_TOKEN);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_DATA);
        localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_DATA);
        sessionStorage.removeItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
        localStorage.removeItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
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
                this.updateAvatarUI(ASN_ROLES.PENGASUH, (this.currentUser && (this.currentUser.photoUrl || this.currentUser.photo_url)) || '');
                if (typeof applyAdminRoleVisibility === 'function') {
                    applyAdminRoleVisibility('PENGASUH');
                }
            }
        } else if (isAsnAdminRole(this.currentRole)) {
            if (window.innerWidth >= 768) {
                const pagePengaturan = document.getElementById('page-pengaturan');
                if (pagePengaturan && !pagePengaturan.classList.contains('hidden')) {
                    setTimeout(() => {
                        if (typeof switchTab === 'function') switchTab('admin');
                        if (typeof showAdminView === 'function') showAdminView('hub');
                    }, 50);
                }
            }
            adminStateEl.classList.remove('hidden');
            const nameEl = document.getElementById('admin-display-name');
            const emailEl = document.getElementById('admin-display-email');
            if (nameEl) nameEl.innerText = (this.currentUser && this.currentUser.name) || 'Administrator';
            if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope mr-1"></i> ${escapeHtml((this.currentUser && this.currentUser.email) || 'admin@asnawiyyah.sch.id')}`;
            this.updateAvatarUI(ASN_ROLES.ADMIN, (this.currentUser && (this.currentUser.photoUrl || this.currentUser.photo_url)) || '');
            if (typeof applyAdminRoleVisibility === 'function') {
                applyAdminRoleVisibility(this.currentRole);
            }
        } else if (this.currentRole === ASN_ROLES.WALI_SANTRI) {
            waliStateEl.classList.remove('hidden');
            const nameEl = document.getElementById('parent-display-name');
            const emailEl = document.getElementById('parent-display-email') || document.getElementById('parent-display-phone');
            if (nameEl) nameEl.innerText = (this.currentUser && this.currentUser.name) || 'Wali Santri';
            if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope mr-1.5 text-emerald-600 dark:text-emerald-400"></i> ${escapeHtml((this.currentUser && this.currentUser.email) || '-')}`;
            this.updateAvatarUI(ASN_ROLES.WALI_SANTRI, (this.currentUser && (this.currentUser.photoUrl || this.currentUser.photo_url)) || '');
            
            // Render linked students
            this.renderLinkedStudents();

            // Load & track perizinan/perpulangan santri wali (Langkah 5)
            try {
                if (window.ASNPerpulangan && typeof window.ASNPerpulangan.loadWaliPerpulanganData === 'function') {
                    window.ASNPerpulangan.loadWaliPerpulanganData();
                } else if (typeof window.loadWaliPerpulanganData === 'function') {
                    window.loadWaliPerpulanganData();
                }
            } catch (errPerp) {
                console.warn('[ASNAuth] Gagal memuat pelacakan perpulangan wali:', errPerp);
            }
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
        } else if (isAsnAdminRole(this.currentRole)) {
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

    activeStudentFilter: 'ALL',

    setStudentFilter(filterId) {
        this.activeStudentFilter = filterId || 'ALL';
        this.renderLinkedStudents();
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

        // Update badge jumlah santri terhubung
        const badgeEl = document.getElementById('parent-linked-count-badge');
        if (badgeEl) {
            badgeEl.innerText = `${(students || []).length} Santri`;
        }

        // Render Child Switcher Tabs jika memiliki 2 atau lebih santri
        const switcherEl = document.getElementById('parent-child-switcher');
        if (switcherEl) {
            if (Array.isArray(students) && students.length > 1) {
                switcherEl.classList.remove('hidden');
                const curFilter = this.activeStudentFilter || 'ALL';
                const allBtnClass = curFilter === 'ALL'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-600 dark:text-slate-300 font-semibold';

                let switcherHtml = `
                    <button type="button" onclick="ASNIdentity.setStudentFilter('ALL')" class="px-2.5 py-1 rounded-lg text-[10px] shrink-0 transition flex items-center gap-1 cursor-pointer ${allBtnClass}">
                        <i class="fa-solid fa-users text-[9px]"></i>
                        <span>Semua Anak (${students.length})</span>
                    </button>
                `;

                students.forEach((s) => {
                    const sId = s.studentId || s.student_id || s.id || s.nis;
                    const sName = s.name || s.nama || 'Santri';
                    const sNis = s.nis || '-';
                    const isSelected = curFilter === String(sId);
                    const btnClass = isSelected
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-600 dark:text-slate-300 font-semibold';
                    switcherHtml += `
                        <button type="button" onclick="ASNIdentity.setStudentFilter('${escapeHtml(String(sId))}')" class="px-2.5 py-1 rounded-lg text-[10px] shrink-0 transition flex items-center gap-1 cursor-pointer ${btnClass}">
                            <i class="fa-solid fa-user-graduate text-[9px]"></i>
                            <span>${escapeHtml(sName)}</span>
                            <span class="opacity-70 text-[9px]">(${escapeHtml(sNis)})</span>
                        </button>
                    `;
                });
                switcherEl.innerHTML = switcherHtml;
            } else {
                switcherEl.classList.add('hidden');
                switcherEl.innerHTML = '';
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

        // Saring daftar santri sesuai tab filter aktif
        const displayedStudents = (this.activeStudentFilter && this.activeStudentFilter !== 'ALL')
            ? students.filter(s => {
                const sId = s.studentId || s.student_id || s.id || s.nis;
                return String(sId) === String(this.activeStudentFilter);
            })
            : students;

        // Render Kartu Digital Santri (KTS Digital) & Kotak Indikator Tahfidz Terpisah
        listContainer.innerHTML = displayedStudents.map((s, idx) => {
            let studentPhoto = s.photoUrl || s.photo_url || '';
            let thumbnailFallback = '';
            if (studentPhoto) {
                const driveMatch = studentPhoto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || studentPhoto.match(/id=([a-zA-Z0-9_-]+)/) || studentPhoto.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (driveMatch && driveMatch[1]) {
                    studentPhoto = "https://lh3.googleusercontent.com/d/" + driveMatch[1];
                    thumbnailFallback = "https://drive.google.com/thumbnail?id=" + driveMatch[1] + "&sz=w400";
                }
            }

            const studentGender = (s.gender || s.jenis || '').toUpperCase();
            const studentNis = s.nis || s.nisn || '-';
            const studentName = s.name || s.nama || 'Santri';
            const studentProgram = s.program || 'Tahfidz Al-Qur\'an';
            const studentId = s.studentId || s.student_id || s.id || s.nis;
            const cleanId = String(studentId || idx).replace(/[^a-zA-Z0-9_-]/g, '_');
            const tahfidz = s.tahfidzSummary || {};
            const studentHalaqah = s.halaqah || tahfidz.halaqah || 'Belum Terplot';
            const studentMuhafiz = s.muhafiz || tahfidz.muhafiz || 'Menunggu Jadwal';
            const currentJuz = tahfidz.currentJuz || 1;
            const percent = tahfidz.percent || Math.round((currentJuz / 30) * 100);
            const targetPekan = tahfidz.targetPekan || 10;
            const avgNilai = tahfidz.avgNilai || (tahfidz.lastSetoran && tahfidz.lastSetoran.nilai) || 'Mumtaz';
            const lastSurah = (tahfidz.lastSetoran && tahfidz.lastSetoran.surah) ? tahfidz.lastSetoran.surah : 'Aktif Bimbingan';
            const studentQrCode = s.qrCode || s.qr_code || ('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(studentNis || studentId));

            // Helper kalkulasi metrik terpadu untuk outer card
            let outerMetrics = {
                currentJuzText: `Juz ${currentJuz}`,
                percent: percent,
                percentText: `${percent}% Juz`,
                jumlahJuzDisetorText: tahfidz.jumlahJuzDisetorText || `${tahfidz.totalSetoranJuz || (currentJuz > 1 ? currentJuz : 1)} Juz`,
                estimasiKhatamText: tahfidz.estimasiKhatamText || "Memuat...",
                estimasiSubText: tahfidz.estimasiSubText || "Proyeksi 30 Juz"
            };

            if (typeof calculateTahfidzMetricsHelper === 'function') {
                outerMetrics = calculateTahfidzMetricsHelper({
                    currentJuz: currentJuz,
                    currentHal: tahfidz.progressHalaman || 1,
                    stats: tahfidz,
                    riwayat: tahfidz.riwayat || [],
                    target: { ziyadahPekan: tahfidz.ziyadahPekan || 4 }
                });
            }

            // Monogram Initials Fallback
            const initials = studentName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'ST';

            // Trigger client-side real-data enrichment if tahfidzSummary is not yet present or needs live hydration
            if (!s.tahfidzSummary || !s.tahfidzSummary.estimasiKhatamText) {
                setTimeout(() => {
                    ASNIdentity.enrichTahfidzDataForStudent(studentId, cleanId);
                }, 100 * (idx + 1));
            }

            return `
            <div class="space-y-3 pb-2">
                <!-- 1. KOTAK KARTU SANTRI DIGITAL (KTS Digital - Proporsi ID Card Fisik Asli CR80) -->
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-[#064e3b] to-[#042f2e] text-white p-4 sm:p-5 border border-emerald-500/40 shadow-xl space-y-3.5 transition-all duration-300">
                    <!-- Background Ambient Watermark & Ornaments -->
                    <div class="absolute -right-6 -bottom-6 text-emerald-400/5 text-9xl pointer-events-none select-none">
                        <i class="fa-solid fa-kaaba"></i>
                    </div>
                    <div class="absolute -top-12 -left-12 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

                    <!-- Header Kartu: Logo Brand di Kiri, QR NIS Minimalis Seukuran Logo di Kanan -->
                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex items-center space-x-2">
                            <img src="assets/img/brand-header.png" alt="PPTQ Asnawiyyah" class="h-7 sm:h-8 w-auto object-contain drop-shadow-sm">
                            <div class="leading-none pl-1.5">
                                <span class="text-[9px] font-extrabold text-amber-300 tracking-wider block uppercase">KTS Digital</span>
                                <span class="text-[8px] text-emerald-200/80 block">Madrasah & Tahfidz</span>
                            </div>
                        </div>
                        
                        <!-- QR NIS Minimalis (Ukuran Sama dengan Logo h-7 sm:h-8) -->
                        <button type="button" 
                            onclick="openStudentQrModal('${escapeHtml(studentNis)}', '${escapeHtml(studentName)}', '${escapeHtml(studentQrCode)}')"
                            class="h-7 w-7 sm:h-8 sm:w-8 p-0.5 rounded-lg bg-white/95 hover:bg-white border border-amber-400/50 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center shrink-0"
                            title="Ketuk untuk memperbesar QR Code NIS">
                            <img src="${escapeHtml(studentQrCode)}" alt="QR NIS" class="w-full h-full object-contain rounded-sm">
                        </button>
                    </div>

                    <!-- Body Kartu: Pasfoto 3x4 di Kiri & Identitas Lengkap di Kanan -->
                    <div class="flex items-center space-x-3 sm:space-x-4 relative z-10 py-1">
                        <!-- Frame Foto Santri (Format 3x4 Proporsional) -->
                        <div id="kts-photo-box-${cleanId}" class="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-md bg-emerald-950 flex items-center justify-center shrink-0 relative">
                            ${studentPhoto ? `
                                <img id="kts-photo-img-${cleanId}" src="${escapeHtml(studentPhoto)}" alt="${escapeHtml(studentName)}" class="w-full h-full object-cover" 
                                    onerror="if (!this.dataset.triedThumbnail && '${escapeHtml(thumbnailFallback)}') { this.dataset.triedThumbnail='1'; this.src='${escapeHtml(thumbnailFallback)}'; } else { this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center text-amber-300/80 bg-emerald-950\\'><i class=\\'fa-solid fa-user-graduate text-2xl\\'></i><span class=\\'text-[9px] mt-1 font-bold text-amber-200\\'>${escapeHtml(initials)}</span></div>'; }">
                            ` : `
                                <div class="w-full h-full flex flex-col items-center justify-center text-amber-300/80 bg-emerald-950">
                                    <i class="fa-solid fa-user-graduate text-2xl"></i>
                                    <span class="text-[9px] mt-1 font-bold text-amber-200">${escapeHtml(initials)}</span>
                                </div>
                            `}
                        </div>

                        <!-- Identitas Detail Santri -->
                        <div class="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
                            <h4 class="text-sm sm:text-base font-extrabold text-white tracking-wide leading-tight line-clamp-2">
                                ${escapeHtml(studentName)}
                            </h4>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="px-2 py-0.5 rounded-md bg-white/10 text-amber-200 text-[10px] font-mono font-bold tracking-wider border border-white/10">
                                    NIS: ${escapeHtml(studentNis)}
                                </span>
                                ${studentGender ? `
                                    <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${studentGender === 'L' ? 'bg-blue-500/25 text-blue-200 border border-blue-400/30' : 'bg-pink-500/25 text-pink-200 border border-pink-400/30'}">
                                        ${studentGender === 'L' ? 'Santri Putra' : 'Santri Putri'}
                                    </span>
                                ` : ''}
                            </div>
                            <p class="text-[11px] text-emerald-100/90 font-medium flex items-center gap-1.5 truncate pt-0.5">
                                <i class="fa-solid fa-book-bookmark text-amber-300 text-[10px] w-3 text-center"></i>
                                <span>${escapeHtml(studentProgram)}</span>
                            </p>
                            <p class="text-[10px] text-slate-200 flex items-center gap-1.5 truncate">
                                <i class="fa-solid fa-chalkboard-user text-emerald-400 text-[10px] w-3 text-center"></i>
                                <span class="text-emerald-300 font-semibold">Halaqah:</span>
                                <span id="kts-halaqah-${cleanId}" class="font-bold text-white">${escapeHtml(studentHalaqah)}</span>
                            </p>
                            <p class="text-[10px] text-slate-200 flex items-center gap-1.5 truncate">
                                <i class="fa-solid fa-user-tie text-amber-300 text-[10px] w-3 text-center"></i>
                                <span class="text-amber-300 font-semibold">Muhafiz:</span>
                                <span id="kts-muhafiz-${cleanId}" class="font-bold text-white">${escapeHtml(studentMuhafiz)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 2. KOTAK INDIKATOR TAHFIDZ & BUKU MUTABA'AH (Terpisah Mandiri) -->
                <div class="relative overflow-hidden rounded-3xl bg-slate-900/95 dark:bg-[#15202d] text-white p-4 sm:p-5 border border-emerald-500/30 shadow-lg space-y-3.5 transition-all">
                    <div class="flex items-center justify-between text-xs font-bold">
                        <span class="flex items-center gap-1.5 text-amber-300 uppercase tracking-wider text-[11px]">
                            <i class="fa-solid fa-star text-xs"></i> Indikator Capaian Tahfidz
                        </span>
                        <span class="text-emerald-300 text-[10px] bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-extrabold">
                            Standar 30 Juz
                        </span>
                    </div>

                    <!-- 3 Metrik Box KPI Terpadu: Capaian Juz Sekarang, Jumlah Juz Disetor, Estimasi Khatam -->
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <!-- 1. Capaian Juz Sekarang -->
                        <div class="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                            <span class="text-[9px] text-slate-400 font-medium">Capaian Juz Sekarang</span>
                            <span class="text-xs sm:text-sm font-extrabold text-amber-300 mt-0.5" id="kts-juz-${cleanId}">${outerMetrics.currentJuzText}</span>
                            <span class="text-[8px] text-emerald-400 mt-0.5 font-bold" id="kts-percent-${cleanId}">${outerMetrics.percentText}</span>
                        </div>

                        <!-- 2. Total Juz Ditempuh -->
                        <div class="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                            <span class="text-[9px] text-slate-400 font-medium">Total Juz Ditempuh</span>
                            <span class="text-xs sm:text-sm font-extrabold text-white mt-0.5" id="kts-juz-disetor-${cleanId}">${outerMetrics.jumlahJuzDisetorText}</span>
                            <span class="text-[8px] text-slate-400 mt-0.5">Sesuai Kurikulum</span>
                        </div>

                        <!-- 3. Estimasi Khatam -->
                        <div class="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                            <span class="text-[9px] text-slate-400 font-medium">Estimasi Khatam</span>
                            <span class="text-xs sm:text-sm font-extrabold text-emerald-400 mt-0.5 truncate" id="kts-estimasi-khatam-${cleanId}">${outerMetrics.estimasiKhatamText}</span>
                            <span class="text-[8px] text-slate-400 mt-0.5 truncate" id="kts-estimasi-sub-${cleanId}">${outerMetrics.estimasiSubText}</span>
                        </div>
                    </div>

                    <!-- Progress Bar 30 Juz -->
                    <div class="space-y-1 pt-0.5">
                        <div class="flex justify-between text-[10px] text-emerald-200/90 font-medium">
                            <span>Progres Khatam Hafalan</span>
                            <span id="kts-bar-label-${cleanId}">Juz ${currentJuz} dari 30 Juz (${percent}%)</span>
                        </div>
                        <div class="w-full h-2.5 rounded-full bg-black/40 overflow-hidden p-0.5 border border-emerald-500/20">
                            <div id="kts-bar-${cleanId}" class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-700" style="width: ${Math.max(4, percent)}%;"></div>
                        </div>
                    </div>

                    <!-- Tombol Aksi Mutaba'ah & Izin Santri -->
                    <div class="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button type="button" data-student-id="${escapeHtml(studentId)}" onclick="openTahfidzStudentDetail(this.getAttribute('data-student-id'), 'parent')" class="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 rounded-2xl font-extrabold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-1.5" title="Buka Buku Mutaba'ah & Capaian Santri">
                            <i class="fa-solid fa-book-quran text-xs text-slate-950"></i>
                            <span>Buku Mutaba'ah</span>
                        </button>
                        <button type="button" onclick="if(window.ASNPerpulangan && typeof window.ASNPerpulangan.openWaliIzinModal === 'function') { window.ASNPerpulangan.openWaliIzinModal('${escapeHtml(studentId)}', '${escapeHtml(studentName)}', '${escapeHtml(studentNis)}'); } else if(typeof window.openWaliIzinModal === 'function') { window.openWaliIzinModal('${escapeHtml(studentId)}', '${escapeHtml(studentName)}', '${escapeHtml(studentNis)}'); }" class="w-full py-2.5 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 border border-emerald-500/40" title="Ajukan Izin / Perpulangan untuk Santri ini">
                            <i class="fa-solid fa-person-walking-luggage text-xs"></i>
                            <span>Ajukan Izin</span>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    /**
     * Client-side real data hydrator: Mengambil detail mutaba'ah tahfidz santri dari backend
     * jika sesi lokal belum memiliki tahfidzSummary, lalu memperbarui tampilan secara live.
     */
    enrichTahfidzDataForStudent(studentId, cleanId) {
        if (!studentId) return;
        const token = (typeof ASNIdentity !== 'undefined' ? (
            sessionStorage.getItem('asnawiyyah_parent_token') ||
            localStorage.getItem('asnawiyyah_parent_token') ||
            sessionStorage.getItem('asnawiyyah_admin_token')
        ) : '') || "";

        if (typeof apiPost !== 'function') return;

        apiPost("getTahfidzStudentDetail", { token, studentId }).then(res => {
            if (res && (res.success || res.status === "success")) {
                const stats = res.stats || {};
                const target = res.target || {};
                const currentJuz = stats.progressJuz || 1;
                const currentHal = stats.progressHalaman || 1;
                const riwayat = res.riwayat || [];

                let metrics = {
                    currentJuzText: `Juz ${currentJuz}`,
                    percent: stats.progressPercent || Math.round((currentJuz / 30) * 100),
                    percentText: `${stats.progressPercent || Math.round((currentJuz / 30) * 100)}% Juz`,
                    jumlahJuzDisetorText: "1 Juz",
                    estimasiKhatamText: "September 2029",
                    estimasiSubText: "Proyeksi 30 Juz"
                };

                if (typeof calculateTahfidzMetricsHelper === 'function') {
                    metrics = calculateTahfidzMetricsHelper({
                        currentJuz: currentJuz,
                        currentHal: currentHal,
                        stats: stats,
                        riwayat: riwayat,
                        target: target
                    });
                }

                const percent = metrics.percent;

                const elJuz = document.getElementById(`kts-juz-${cleanId}`);
                if (elJuz) elJuz.innerText = metrics.currentJuzText;
                const elPercent = document.getElementById(`kts-percent-${cleanId}`);
                if (elPercent) elPercent.innerText = metrics.percentText;
                
                const elDisetor = document.getElementById(`kts-juz-disetor-${cleanId}`);
                if (elDisetor) elDisetor.innerText = metrics.jumlahJuzDisetorText;
                
                const elEstimasi = document.getElementById(`kts-estimasi-khatam-${cleanId}`);
                if (elEstimasi) elEstimasi.innerText = metrics.estimasiKhatamText;
                const elEstimasiSub = document.getElementById(`kts-estimasi-sub-${cleanId}`);
                if (elEstimasiSub) elEstimasiSub.innerText = metrics.estimasiSubText;

                const elBarLabel = document.getElementById(`kts-bar-label-${cleanId}`);
                if (elBarLabel) elBarLabel.innerText = `Juz ${currentJuz} dari 30 Juz (${percent}%)`;
                const elBar = document.getElementById(`kts-bar-${cleanId}`);
                if (elBar) elBar.style.width = `${Math.max(4, percent)}%`;

                // Live Hydrate Halaqah & Muhafiz
                const hName = res.halaqah || (res.student && res.student.halaqah);
                if (hName && hName !== "Belum Terplot") {
                    const elHal = document.getElementById(`kts-halaqah-${cleanId}`);
                    if (elHal) elHal.innerText = hName;
                }
                const mName = res.muhafiz || (res.student && res.student.muhafiz);
                if (mName && mName !== "Menunggu Jadwal") {
                    const elMuh = document.getElementById(`kts-muhafiz-${cleanId}`);
                    if (elMuh) elMuh.innerText = mName;
                }

                // Live Hydrate Foto Santri jika sebelumnya kosong/fallback
                if (res.student && res.student.photoUrl) {
                    const elImg = document.getElementById(`kts-photo-img-${cleanId}`);
                    const photoBox = document.getElementById(`kts-photo-box-${cleanId}`);
                    let nPhoto = res.student.photoUrl;
                    const driveMatch = nPhoto.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || nPhoto.match(/id=([a-zA-Z0-9_-]+)/) || nPhoto.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    let fallbackUrl = '';
                    if (driveMatch && driveMatch[1]) {
                        nPhoto = "https://lh3.googleusercontent.com/d/" + driveMatch[1];
                        fallbackUrl = "https://drive.google.com/thumbnail?id=" + driveMatch[1] + "&sz=w400";
                    }
                    if (elImg) {
                        elImg.src = nPhoto;
                    } else if (photoBox && photoBox.querySelector(".fa-user-graduate")) {
                        photoBox.innerHTML = `<img id="kts-photo-img-${cleanId}" src="${escapeHtml(nPhoto)}" alt="Santri" class="w-full h-full object-cover" onerror="if (!this.dataset.triedThumbnail && '${escapeHtml(fallbackUrl)}') { this.dataset.triedThumbnail='1'; this.src='${escapeHtml(fallbackUrl)}'; }">`;
                    }
                }

                // Update session storage cache
                try {
                    const raw = sessionStorage.getItem(ASN_STORAGE_KEYS.PARENT_STUDENTS);
                    if (raw) {
                        const cached = JSON.parse(raw);
                        const targetSt = cached.find(c => String(c.studentId || c.id || c.nis).trim() === String(studentId).trim());
                        if (targetSt) {
                            if (hName) targetSt.halaqah = hName;
                            if (mName) targetSt.muhafiz = mName;
                            if (res.student && res.student.photoUrl) targetSt.photoUrl = res.student.photoUrl;
                            targetSt.tahfidzSummary = {
                                currentJuz,
                                progressHalaman: currentHal,
                                percent,
                                jumlahJuzDisetorText: metrics.jumlahJuzDisetorText,
                                estimasiKhatamText: metrics.estimasiKhatamText,
                                estimasiSubText: metrics.estimasiSubText,
                                avgNilai: stats.rataRataNilai || "Mumtaz",
                                halaqah: hName || targetSt.halaqah || "Belum Terplot",
                                muhafiz: mName || targetSt.muhafiz || "Menunggu Jadwal",
                                lastSetoran: (riwayat && riwayat.length > 0) ? { surah: riwayat[0].surah, nilai: riwayat[0].nilai } : null
                            };
                            sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(cached));
                            localStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(cached));
                        }
                    }
                } catch (e) {}
            }
        }).catch(e => {
            console.warn("[KTS Hydration] Failed to fetch tahfidz details:", e);
        });
    },

    /**
     * Helper formatting CDN URL untuk foto profil
     */
    formatPhotoUrl(photoUrl) {
        if (!photoUrl) return '';
        const driveMatch = photoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || photoUrl.match(/id=([a-zA-Z0-9_-]+)/) || photoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
        }
        return photoUrl;
    },

    /**
     * Memperbarui elemen Avatar pada UI berdasarkan peran
     */
    updateAvatarUI(role, photoUrl) {
        const normalizedRole = String(role || this.currentRole || '').toUpperCase();
        let imgId = '';
        let iconId = '';

        if (normalizedRole === ASN_ROLES.PENGASUH) {
            imgId = 'pengasuh-avatar-img';
            iconId = 'pengasuh-avatar-icon';
        } else if (isAsnAdminRole(normalizedRole)) {
            imgId = 'admin-avatar-img';
            iconId = 'admin-avatar-icon';
        } else {
            imgId = 'parent-avatar-img';
            iconId = 'parent-avatar-icon';
        }

        const imgEl = document.getElementById(imgId);
        const iconEl = document.getElementById(iconId);
        if (!imgEl) return;

        if (photoUrl) {
            const formatted = this.formatPhotoUrl(photoUrl);
            imgEl.src = formatted;
            imgEl.classList.remove('hidden');
            if (iconEl) iconEl.classList.add('hidden');
            imgEl.onerror = () => {
                imgEl.classList.add('hidden');
                if (iconEl) iconEl.classList.remove('hidden');
            };
        } else {
            imgEl.src = '';
            imgEl.classList.add('hidden');
            if (iconEl) iconEl.classList.remove('hidden');
        }
    },

    /**
     * Trigger file input picker untuk unggah foto profil
     */
    triggerAvatarUpload(role) {
        this._targetAvatarRole = role || this.currentRole;
        const fileInput = document.getElementById('user-avatar-file-input');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    },

    /**
     * Handler saat file foto dipilih
     */
    async handleAvatarFileSelected(input) {
        const file = input && input.files && input.files[0];
        if (!file) return;

        const role = this._targetAvatarRole || this.currentRole;
        const targetId = (this.currentUser && (this.currentUser.identityId || this.currentUser.email)) || '';

        // Validasi tipe mime
        if (!file.type.match(/^image\/(jpeg|png|webp|gif)/i)) {
            if (typeof showToast === 'function') showToast('Format foto tidak didukung. Pilih foto JPG, PNG, atau WEBP.');
            else alert('Format foto tidak didukung. Pilih foto JPG, PNG, atau WEBP.');
            return;
        }

        if (typeof showToast === 'function') {
            showToast('Mengompresi dan mengunggah foto profil...');
        }

        try {
            const compressed = await this.compressImageFile(file, 400, 400, 0.85);
            const result = await ASNAuthAPI.uploadUserPhoto(compressed, role, targetId);

            if (result && (result.success || result.status === 'success')) {
                const photoUrl = result.url || result.fileUrl;
                if (photoUrl) {
                    // Update state memori
                    if (this.currentUser) {
                        this.currentUser.photoUrl = photoUrl;
                        this.currentUser.photo_url = photoUrl;
                    }

                    // Update storage lokal
                    if (role === ASN_ROLES.PENGASUH) {
                        sessionStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(this.currentUser || {}));
                        localStorage.setItem(ASN_STORAGE_KEYS.PENGASUH_DATA, JSON.stringify(this.currentUser || {}));
                    } else if (isAsnAdminRole(role)) {
                        sessionStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(this.currentUser || {}));
                        localStorage.setItem(ASN_STORAGE_KEYS.ADMIN_DATA, JSON.stringify(this.currentUser || {}));
                    } else if (role === ASN_ROLES.WALI_SANTRI) {
                        sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(this.currentUser || {}));
                        localStorage.setItem(ASN_STORAGE_KEYS.PARENT_DATA, JSON.stringify(this.currentUser || {}));
                    }

                    this.updateAvatarUI(role, photoUrl);

                    if (typeof showToast === 'function') {
                        showToast('Foto profil berhasil diperbarui!');
                    } else {
                        alert('Foto profil berhasil diperbarui!');
                    }
                }
            } else {
                const msg = (result && result.message) || 'Gagal mengunggah foto profil.';
                if (typeof showToast === 'function') showToast(msg);
                else alert(msg);
            }
        } catch (err) {
            console.error('[ASNIdentity] Error upload avatar:', err);
            if (typeof showToast === 'function') {
                showToast('Gagal mengunggah foto: ' + (err.message || err));
            } else {
                alert('Gagal mengunggah foto: ' + (err.message || err));
            }
        }
    },

    /**
     * Kompresi gambar client-side dengan canvas ke rasio persegi
     */
    compressImageFile(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = () => reject(new Error('Format gambar tidak valid.'));
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Square crop dari tengah
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;

                        const targetSize = Math.min(maxWidth, maxHeight, minDim);
                        canvas.width = targetSize;
                        canvas.height = targetSize;

                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        const base64 = dataUrl.split(',')[1];

                        resolve({
                            base64: base64,
                            mimeType: 'image/jpeg',
                            name: file.name,
                            size: Math.round((base64.length * 3) / 4)
                        });
                    } catch (err) {
                        // Fallback ke raw read jika canvas gagal
                        const rawBase64 = e.target.result.split(',')[1];
                        resolve({
                            base64: rawBase64,
                            mimeType: file.type || 'image/jpeg',
                            name: file.name,
                            size: file.size
                        });
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
};

// =====================================================================
// QR CODE MODAL PREVIEW CONTROLLER
// =====================================================================
function openStudentQrModal(nis, name, qrUrl) {
    const modal = document.getElementById('modal-student-qr-preview');
    if (!modal) return;
    const nameEl = document.getElementById('qr-modal-student-name');
    const nisEl = document.getElementById('qr-modal-student-nis');
    const imgEl = document.getElementById('qr-modal-image');

    if (nameEl) nameEl.innerText = name || 'Santri';
    if (nisEl) nisEl.innerText = 'NIS: ' + (nis || '-');
    if (imgEl) {
        const finalUrl = qrUrl || ('https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=' + encodeURIComponent(nis || 'ASN'));
        imgEl.src = finalUrl;
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        const content = document.getElementById('modal-student-qr-content');
        if (content) content.classList.remove('scale-95', 'opacity-0');
    }, 30);
}

function closeStudentQrModal() {
    const modal = document.getElementById('modal-student-qr-preview');
    const content = document.getElementById('modal-student-qr-content');
    if (!modal) return;
    if (content) content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

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

// ==================== OTP COOLDOWN & RESEND CONTROLLERS ====================
let adminOtpTimer = null;
let parentOtpTimer = null;

function startAdminOtpCooldown(seconds = 60) {
    if (adminOtpTimer) clearInterval(adminOtpTimer);
    const container = document.getElementById('admin-otp-cooldown');
    if (!container) return;

    let remaining = Math.max(1, parseInt(seconds, 10) || 60);

    const updateDisplay = () => {
        if (remaining > 0) {
            container.innerHTML = `<span class="text-slate-400">Kirim ulang dalam <span class="font-bold text-slate-600 dark:text-slate-200 font-mono">${remaining}s</span></span>`;
            remaining--;
        } else {
            clearInterval(adminOtpTimer);
            adminOtpTimer = null;
            container.innerHTML = `
                <button type="button" onclick="resendAdminOtp()" class="text-brand-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                    <i class="fa-solid fa-rotate-right text-[10px]"></i>
                    <span>Kirim Ulang OTP</span>
                </button>
            `;
        }
    };

    updateDisplay();
    adminOtpTimer = setInterval(updateDisplay, 1000);
}

function stopAdminOtpCooldown() {
    if (adminOtpTimer) {
        clearInterval(adminOtpTimer);
        adminOtpTimer = null;
    }
    const container = document.getElementById('admin-otp-cooldown');
    if (container) {
        container.innerHTML = `<span class="text-slate-400">Kirim ulang dalam 60s</span>`;
    }
}

async function resendAdminOtp() {
    const email = sessionStorage.getItem('asn_temp_admin_email') || document.getElementById('admin-auth-email')?.value?.trim();
    const container = document.getElementById('admin-otp-cooldown');
    const alertBox = document.getElementById('admin-auth-alert');
    const alertText = document.getElementById('admin-auth-alert-text');
    const otpInput = document.getElementById('admin-auth-otp');

    if (!email) {
        if (typeof showToast === 'function') showToast('⚠️ Email tidak ditemukan, silakan ganti email.');
        return;
    }

    if (container) {
        container.innerHTML = `<span class="text-slate-400 text-[11px] flex items-center space-x-1"><i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Mengirim kode baru...</span></span>`;
    }
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.requestAdminOtp(email);
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ Kode OTP baru berhasil dikirim ke email!');
            }
            if (otpInput) {
                otpInput.value = '';
                otpInput.focus();
            }
            startAdminOtpCooldown(result.cooldownSeconds || 60);
        } else {
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Gagal mengirim ulang OTP.';
                alertBox.classList.remove('hidden');
            }
            if (result.cooldownSeconds && result.cooldownSeconds > 0) {
                startAdminOtpCooldown(result.cooldownSeconds);
            } else if (container) {
                container.innerHTML = `
                    <button type="button" onclick="resendAdminOtp()" class="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                        <i class="fa-solid fa-rotate-right text-[10px]"></i>
                        <span>Coba Kirim Ulang</span>
                    </button>
                `;
            }
        }
    } catch (err) {
        console.error('resendAdminOtp error:', err);
        if (container) {
            container.innerHTML = `
                <button type="button" onclick="resendAdminOtp()" class="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                    <i class="fa-solid fa-rotate-right text-[10px]"></i>
                    <span>Coba Kirim Ulang</span>
                </button>
            `;
        }
        if (alertBox && alertText) {
            alertText.innerText = 'Terjadi kesalahan sistem saat meminta kode baru.';
            alertBox.classList.remove('hidden');
        }
    }
}

function startParentOtpCooldown(seconds = 60) {
    if (parentOtpTimer) clearInterval(parentOtpTimer);
    const container = document.getElementById('parent-otp-cooldown');
    if (!container) return;

    let remaining = Math.max(1, parseInt(seconds, 10) || 60);

    const updateDisplay = () => {
        if (remaining > 0) {
            container.innerHTML = `<span class="text-slate-400">Kirim ulang dalam <span class="font-bold text-slate-600 dark:text-slate-200 font-mono">${remaining}s</span></span>`;
            remaining--;
        } else {
            clearInterval(parentOtpTimer);
            parentOtpTimer = null;
            container.innerHTML = `
                <button type="button" onclick="resendParentOtp()" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                    <i class="fa-solid fa-rotate-right text-[10px]"></i>
                    <span>Kirim Ulang OTP</span>
                </button>
            `;
        }
    };

    updateDisplay();
    parentOtpTimer = setInterval(updateDisplay, 1000);
}

function stopParentOtpCooldown() {
    if (parentOtpTimer) {
        clearInterval(parentOtpTimer);
        parentOtpTimer = null;
    }
    const container = document.getElementById('parent-otp-cooldown');
    if (container) {
        container.innerHTML = `<span class="text-slate-400">Kirim ulang dalam 60s</span>`;
    }
}

async function resendParentOtp() {
    const email = sessionStorage.getItem('asn_temp_parent_email') || document.getElementById('parent-auth-email')?.value?.trim();
    const container = document.getElementById('parent-otp-cooldown');
    const alertBox = document.getElementById('parent-auth-alert');
    const alertText = document.getElementById('parent-auth-alert-text');
    const otpInput = document.getElementById('parent-otp-code');

    if (!email) {
        if (typeof showToast === 'function') showToast('⚠️ Email tidak ditemukan, silakan ganti email.');
        return;
    }

    if (container) {
        container.innerHTML = `<span class="text-slate-400 text-[11px] flex items-center space-x-1"><i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Mengirim kode baru...</span></span>`;
    }
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const result = await ASNAuthAPI.requestParentOtp(email);
        if (result.success) {
            if (typeof showToast === 'function') {
                showToast('✅ Kode OTP baru berhasil dikirim ke email!');
            }
            if (otpInput) {
                otpInput.value = '';
                otpInput.focus();
            }
            startParentOtpCooldown(result.cooldownSeconds || 60);
        } else {
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Gagal mengirim ulang OTP.';
                alertBox.classList.remove('hidden');
            }
            if (result.cooldownSeconds && result.cooldownSeconds > 0) {
                startParentOtpCooldown(result.cooldownSeconds);
            } else if (container) {
                container.innerHTML = `
                    <button type="button" onclick="resendParentOtp()" class="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                        <i class="fa-solid fa-rotate-right text-[10px]"></i>
                        <span>Coba Kirim Ulang</span>
                    </button>
                `;
            }
        }
    } catch (err) {
        console.error('resendParentOtp error:', err);
        if (container) {
            container.innerHTML = `
                <button type="button" onclick="resendParentOtp()" class="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                    <i class="fa-solid fa-rotate-right text-[10px]"></i>
                    <span>Coba Kirim Ulang</span>
                </button>
            `;
        }
        if (alertBox && alertText) {
            alertText.innerText = 'Terjadi kesalahan sistem saat meminta kode baru.';
            alertBox.classList.remove('hidden');
        }
    }
}

function resetAdminAuthStep() {
    stopAdminOtpCooldown();
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

            // Jalankan hitungan mundur dinamis
            startAdminOtpCooldown(result.cooldownSeconds || 60);
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
            stopAdminOtpCooldown();
            const role = String((result.admin && result.admin.role) || '').toUpperCase();
            if (role === 'PENGASUH') {
                ASNIdentity.setPengasuhSession(result.token, result.admin);
                closeAdminAuthModal();
                if (typeof showToast === 'function') {
                    showToast(`Ahlan wa Sahlan, ${result.admin?.name || 'Pengasuh'}`);
                }
                setTimeout(() => {
                    if (typeof switchTab === 'function') switchTab('admin', true);
                    if (typeof showAdminView === 'function') showAdminView('hub');
                    if (typeof applyAdminRoleVisibility === 'function') applyAdminRoleVisibility('PENGASUH');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            } else {
                ASNIdentity.setAdminSession(result.token, result.admin);
                closeAdminAuthModal();
                if (typeof showToast === 'function') {
                    showToast('Login Admin Berhasil!');
                }
                if (window.innerWidth >= 768) {
                    if (typeof switchTab === 'function') switchTab('admin');
                    if (typeof showAdminView === 'function') showAdminView('hub');
                }
            }
        } else {
            // Fail safely: tampilkan error, jangan login, jangan bypass!
            if (alertBox && alertText) {
                alertText.innerText = result.message || 'Kode OTP tidak valid atau layanan server belum siap.';
                alertBox.classList.remove('hidden');
            }
            // Jika OTP sudah kedaluwarsa atau tidak ditemukan, segera munculkan tombol kirim ulang
            const errMsg = String(result.message || '').toLowerCase();
            if (errMsg.includes('kedaluwarsa') || errMsg.includes('expired') || errMsg.includes('tidak ditemukan')) {
                const container = document.getElementById('admin-otp-cooldown');
                if (container && (!adminOtpTimer || adminOtpTimer === null)) {
                    container.innerHTML = `
                        <button type="button" onclick="resendAdminOtp()" class="text-brand-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                            <i class="fa-solid fa-rotate-right text-[10px]"></i>
                            <span>Kirim Ulang OTP</span>
                        </button>
                    `;
                }
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
        const nisInput = document.getElementById('parent-login-nis');
        if (nisInput) nisInput.focus();
        if (typeof initGoogleAuth === 'function') initGoogleAuth();
    }, 50);
}

function closeParentAuthModal() {
    stopParentOtpCooldown();
    const modal = document.getElementById('modal-auth-parent');
    const content = document.getElementById('modal-auth-parent-content');
    if (!modal || !content) return;

    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 250);
}

function switchParentAuthMethod(method) {
    const tabNis = document.getElementById('tab-btn-parent-nis');
    const tabOtp = document.getElementById('tab-btn-parent-otp');
    const formNis = document.getElementById('form-parent-nis-login');
    const wrapperOtp = document.getElementById('parent-otp-methods-wrapper');
    const alertBox = document.getElementById('parent-auth-alert');

    if (alertBox) alertBox.classList.add('hidden');

    if (method === 'nis') {
        if (tabNis) {
            tabNis.className = 'flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-white dark:bg-[#15202d] text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-[#2b3b4f]';
        }
        if (tabOtp) {
            tabOtp.className = 'flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
        }
        if (formNis) formNis.classList.remove('hidden');
        if (wrapperOtp) wrapperOtp.classList.add('hidden');
        setTimeout(() => {
            const nisInput = document.getElementById('parent-login-nis');
            if (nisInput) nisInput.focus();
        }, 50);
    } else {
        if (tabOtp) {
            tabOtp.className = 'flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 bg-white dark:bg-[#15202d] text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-[#2b3b4f]';
        }
        if (tabNis) {
            tabNis.className = 'flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
        }
        if (formNis) formNis.classList.add('hidden');
        if (wrapperOtp) wrapperOtp.classList.remove('hidden');
        setTimeout(() => {
            const emailInput = document.getElementById('parent-auth-email');
            if (emailInput) emailInput.focus();
        }, 50);
    }
}

function resetParentAuthStep() {
    stopParentOtpCooldown();
    switchParentAuthMethod('nis');
    const formReq = document.getElementById('form-parent-request-otp');
    const formVer = document.getElementById('form-parent-verify-otp');
    const alertBox = document.getElementById('parent-auth-alert');

    if (formReq) formReq.classList.remove('hidden');
    if (formVer) formVer.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    const otpInput = document.getElementById('parent-otp-code');
    if (otpInput) otpInput.value = '';
    const nisInput = document.getElementById('parent-login-nis');
    if (nisInput) nisInput.value = '';
    const birthInput = document.getElementById('parent-login-birthdate');
    if (birthInput) birthInput.value = '';
}

/**
 * Login Mandiri Cepat via NIS & Tanggal Lahir (Zero-OTP untuk Sosialisasi)
 */
async function handleParentQuickLoginNis(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('btn-parent-nis-login');
    const alertBox = document.getElementById('parent-auth-alert');
    const alertText = document.getElementById('parent-auth-alert-text');
    const nisInput = document.getElementById('parent-login-nis');
    const birthInput = document.getElementById('parent-login-birthdate');

    const nis = (nisInput?.value || '').trim();
    const birthDate = (birthInput?.value || '').trim();

    if (!nis || !birthDate) {
        if (alertBox && alertText) {
            alertText.innerText = 'Nomor Induk Santri (NIS) dan PIN Tanggal Lahir wajib diisi.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs mr-1"></i><span>Memverifikasi Data Santri...</span>`;
    }
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const config = window.ASNAWIYYAH_CONFIG || {};
        const sbUrl = config.supabaseUrl;
        const sbKey = config.supabaseKey;

        const headers = (sbKey) ? {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json'
        } : {};

        // 1. Cari data santri dari memori / cache lokal
        let student = null;
        let localList = [];
        if (typeof window.adminStudentsData !== 'undefined' && Array.isArray(window.adminStudentsData)) {
            localList = window.adminStudentsData;
        } else {
            try {
                const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
                if (cached) localList = JSON.parse(cached);
            } catch(e) {}
        }

        const cleanNis = nis.toLowerCase();
        student = localList.find(s => {
            const sNis = String(s.nis || s.nisn || '').toLowerCase().trim();
            const sId = String(s.studentId || s.student_id || '').toLowerCase().trim();
            return sNis === cleanNis || sId === cleanNis;
        });

        // Jika belum ada di memori, query ke Supabase REST API
        if (!student && sbUrl && sbKey) {
            const encNis = encodeURIComponent(nis);
            const queryUrl = `${sbUrl}/rest/v1/students?or=(nis.eq.${encNis},student_id.eq.${encNis},nisn.eq.${encNis})&limit=1`;
            try {
                const sRes = await fetch(queryUrl, { headers });
                if (sRes.ok) {
                    const resArr = await sRes.json();
                    if (Array.isArray(resArr) && resArr.length > 0) {
                        student = resArr[0];
                    }
                }
            } catch (errSup) {
                console.warn('[QUICK LOGIN] Supabase lookup error:', errSup);
            }
        }

        // Fallback jika belum ketemu juga: coba cek via Google Apps Script endpoint jika tersedia
        if (!student && typeof authApiPost === 'function') {
            try {
                const fbRes = await authApiPost('getStudentByNis', { nis: nis });
                if (fbRes && (fbRes.student || fbRes.data)) {
                    student = fbRes.student || fbRes.data;
                }
            } catch(e) {}
        }

        if (!student) {
            throw new Error(`Data santri dengan NIS "${nis}" tidak ditemukan. Mohon periksa kembali NIS santri Anda atau hubungi panitia.`);
        }

        // 2. Verifikasi PIN Tanggal Lahir Santri
        const rawStudentBirth = student.birthDate || student.birth_date || student.tanggal_lahir || student.tgl_lahir || '';
        if (rawStudentBirth) {
            const normInput = typeof normalizeBirthDate === 'function' ? normalizeBirthDate(birthDate) : birthDate.replace(/[^0-9]/g, '');
            const normDb = typeof normalizeBirthDate === 'function' ? normalizeBirthDate(rawStudentBirth) : rawStudentBirth.replace(/[^0-9]/g, '');
            if (normInput && normDb && normInput !== normDb) {
                throw new Error('PIN Tanggal Lahir tidak cocok dengan data resmi madrasah. Pastikan PIN tanggal lahir tepat.');
            }
        }

        const studentId = student.studentId || student.student_id || student.id || student.nis;

        // Normalisasi objek student agar sesuai dengan tampilan dashboard
        const normalizedStudent = {
            studentId: studentId,
            id: studentId,
            name: student.name || student.nama || ('Santri ' + nis),
            nis: student.nis || nis,
            nisn: student.nisn || '',
            gender: student.gender || student.jenis_kelamin || 'L',
            kelas: student.kelas || student.grade || 'Aktif',
            kamar: student.kamar || student.room || '-',
            status: student.status || 'AKTIF',
            foto: student.foto || student.photo || student.avatar || '',
            tanggal_lahir: rawStudentBirth || birthDate,
            birthDate: rawStudentBirth || birthDate
        };

        // 3. Resolusi Profil Wali
        let parentData = {
            userId: 'USR_WLI_' + (student.nis || studentId),
            identityId: 'ID_WLI_' + (student.nis || studentId),
            id: 'WLI_' + (student.nis || studentId),
            name: student.nama_wali || student.wali || student.nama_ayah || student.nama_ibu || ('Wali Santri (' + normalizedStudent.name + ')'),
            email: student.email_wali || ('wali.' + (student.nis || studentId) + '@asnawiyyah.wali'),
            phone: student.no_hp_wali || student.no_wa_wali || student.telepon_wali || '',
            role: 'WALI_SANTRI'
        };

        let linkedStudentsList = [normalizedStudent];

        // Cari di Supabase wali_santri_map apakah sudah ada profil & saudara terdaftar
        if (sbUrl && sbKey) {
            try {
                const mapRes = await fetch(`${sbUrl}/rest/v1/wali_santri_map?student_id=eq.${encodeURIComponent(studentId)}&select=*,wali_identities(*)&limit=1`, { headers });
                if (mapRes.ok) {
                    const mapArr = await mapRes.json();
                    if (Array.isArray(mapArr) && mapArr.length > 0) {
                        const m = mapArr[0];
                        if (m.wali_identities) {
                            parentData.name = m.wali_identities.name || parentData.name;
                            parentData.email = m.wali_identities.email || parentData.email;
                            parentData.phone = m.wali_identities.phone || parentData.phone;
                            parentData.userId = m.wali_identities.user_id || m.wali_identities.wali_id || parentData.userId;
                            parentData.identityId = m.wali_identities.identity_id || m.wali_identities.wali_id || parentData.identityId;
                        }
                        if (m.wali_id) {
                            // Cek saudara kandung yang terdaftar dengan wali_id yang sama
                            const sibRes = await fetch(`${sbUrl}/rest/v1/wali_santri_map?wali_id=eq.${encodeURIComponent(m.wali_id)}&select=student_id`, { headers });
                            if (sibRes.ok) {
                                const sibArr = await sibRes.json();
                                if (Array.isArray(sibArr) && sibArr.length > 1) {
                                    const sibIds = sibArr.map(x => x.student_id).filter(id => String(id) !== String(studentId));
                                    if (sibIds.length > 0) {
                                        const encIds = sibIds.map(encodeURIComponent).join(',');
                                        const otherStudsRes = await fetch(`${sbUrl}/rest/v1/students?student_id=in.(${encIds})`, { headers });
                                        if (otherStudsRes.ok) {
                                            const otherArr = await otherStudsRes.json();
                                            if (Array.isArray(otherArr)) {
                                                otherArr.forEach(os => {
                                                    linkedStudentsList.push({
                                                        studentId: os.studentId || os.student_id || os.id || os.nis,
                                                        id: os.studentId || os.student_id || os.id || os.nis,
                                                        name: os.name || os.nama || 'Santri',
                                                        nis: os.nis || '',
                                                        gender: os.gender || os.jenis_kelamin || 'L',
                                                        kelas: os.kelas || os.grade || 'Aktif',
                                                        kamar: os.kamar || os.room || '-',
                                                        status: os.status || 'AKTIF',
                                                        foto: os.foto || os.photo || ''
                                                    });
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Belum ada mapping, otomatis buatkan mapping di Supabase
                        const nowIso = new Date().toISOString();
                        const newMapId = `MAP_${parentData.userId.replace(/[^a-zA-Z0-9]/g, '')}_${String(studentId).replace(/[^a-zA-Z0-9]/g, '')}`;
                        fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
                            method: 'POST',
                            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
                            body: JSON.stringify({
                                map_id: newMapId,
                                wali_id: parentData.userId,
                                student_id: studentId,
                                relationship: 'GUARDIAN',
                                status: 'VERIFIED',
                                created_at: nowIso
                            })
                        }).catch(e => console.warn('[AUTO-MAP CATCH]', e));
                    }
                }
            } catch (errRel) {
                console.warn('[QUICK LOGIN] Map resolution catch:', errRel);
            }
        }

        // 4. Generate Session Token & Login
        const sessionToken = 'WALI_QUICK_TOKEN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        ASNIdentity.setParentSession(sessionToken, parentData, linkedStudentsList);

        // 5. Tutup modal & navigasikan ke dashboard wali
        closeParentAuthModal();

        if (typeof switchTab === 'function') {
            switchTab('pengaturan');
        }

        if (typeof showToast === 'function') {
            showToast(`Ahlan wa Sahlan, ${parentData.name}! Berhasil masuk ke Dashboard Wali Santri.`);
        }

        const waliDashboard = document.getElementById('account-state-wali');
        if (waliDashboard) {
            setTimeout(() => {
                waliDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }

    } catch (err) {
        if (alertBox && alertText) {
            alertText.innerText = err.message || 'Gagal memverifikasi identitas santri.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>Masuk ke Dashboard Wali Santri</span><i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>`;
        }
    }
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

            // Jalankan hitungan mundur dinamis
            startParentOtpCooldown(result.cooldownSeconds || 60);
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
            stopParentOtpCooldown();
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
            // Jika OTP sudah kedaluwarsa atau tidak ditemukan, segera munculkan tombol kirim ulang
            const errMsg = String(result.message || '').toLowerCase();
            if (errMsg.includes('kedaluwarsa') || errMsg.includes('expired') || errMsg.includes('tidak ditemukan')) {
                const container = document.getElementById('parent-otp-cooldown');
                if (container && (!parentOtpTimer || parentOtpTimer === null)) {
                    container.innerHTML = `
                        <button type="button" onclick="resendParentOtp()" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 transition">
                            <i class="fa-solid fa-rotate-right text-[10px]"></i>
                            <span>Kirim Ulang OTP</span>
                        </button>
                    `;
                }
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
        const nisInput = document.getElementById('activation-nis') || document.getElementById('activation-nisn');
        if (nisInput) nisInput.focus();
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
    const nis = (document.getElementById('activation-nis')?.value || document.getElementById('activation-nisn')?.value || '').trim();
    const birthDate = (document.getElementById('activation-birth-date')?.value || '').trim();
    const waliName = (document.getElementById('activation-wali-name')?.value || '').trim();
    const waliEmail = (document.getElementById('activation-wali-email')?.value || '').trim().toLowerCase();
    const waliPhone = (document.getElementById('activation-wali-phone')?.value || '').trim();
    const relationship = (document.getElementById('activation-relationship')?.value || 'GUARDIAN').trim();

    const btn = document.getElementById('btn-activation-step1');
    const alertBox = document.getElementById('activation-alert');
    const alertText = document.getElementById('activation-alert-text');

    if (!nis || !waliEmail) {
        if (alertBox && alertText) {
            alertText.innerText = 'NIS Santri dan Email Wali wajib diisi.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Mencocokkan Data Santri...</span>`;
    if (alertBox) alertBox.classList.add('hidden');

    const payload = {
        nis,
        nisn: nis, // alias backward compatible
        birthDate: birthDate || '',
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

    const hasNis = payload.nis || payload.nisn;
    if (!hasNis || !payload.waliEmail) {
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
            // Real-time Dual-Write ke Supabase Cloud DB
            syncWaliActivationToSupabase(result, payload);
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

/**
 * Sinkronisasi Real-Time (Dual-Write) Aktivasi Wali Santri & Relasi Santri ke Supabase Cloud
 */
async function syncWaliActivationToSupabase(result, payload = {}) {
    try {
        const config = window.ASNAWIYYAH_CONFIG || {};
        const sbUrl = config.supabaseUrl;
        const sbKey = config.supabaseKey;
        if (!sbUrl || !sbKey) return;

        const headers = {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        };

        const wali = result.parent || result.identity || {};
        const waliId = wali.userId || wali.identityId || "";
        if (!waliId) return;

        const nowIso = new Date().toISOString();
        const email = wali.email || payload.waliEmail || null;
        const phone = wali.phone || payload.waliPhone || null;
        const name = wali.name || payload.waliName || 'Wali Santri';
        const rel = payload.relationship || 'GUARDIAN';

        // 1. Simpan ke public.users
        const userRow = {
            user_id: waliId,
            email: email,
            phone: phone,
            name: name,
            role: 'WALI_SANTRI',
            status: 'ACTIVE',
            created_at: nowIso
        };
        await fetch(`${sbUrl}/rest/v1/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify(userRow)
        });

        // 2. Simpan ke public.wali_identities
        const waliRow = {
            identity_id: waliId,
            email: email,
            phone: phone,
            name: name,
            role: 'WALI_SANTRI',
            status: 'ACTIVE',
            created_at: nowIso
        };
        await fetch(`${sbUrl}/rest/v1/wali_identities`, {
            method: 'POST',
            headers,
            body: JSON.stringify(waliRow)
        });

        // 3. Simpan ke public.wali_santri_map untuk semua santri yang terhubung
        const students = Array.isArray(result.students) ? result.students : [];
        if (students.length > 0) {
            for (const s of students) {
                const sId = s.studentId || s.student_id;
                if (!sId) continue;
                const mapId = `MAP_${waliId.replace(/[^a-zA-Z0-9]/g, '')}_${sId.replace(/[^a-zA-Z0-9]/g, '')}`;
                await fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        map_id: mapId,
                        wali_id: waliId,
                        student_id: sId,
                        relationship: s.relationship || rel,
                        status: 'VERIFIED',
                        created_at: nowIso
                    })
                });
            }
        } else if (payload.studentId || payload.student_id) {
            const sId = payload.studentId || payload.student_id;
            const mapId = `MAP_${waliId.replace(/[^a-zA-Z0-9]/g, '')}_${sId.replace(/[^a-zA-Z0-9]/g, '')}`;
            await fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    map_id: mapId,
                    wali_id: waliId,
                    student_id: sId,
                    relationship: rel,
                    status: 'VERIFIED',
                    created_at: nowIso
                })
            });
        }
        console.log('[SUPABASE SYNC] Berhasil sinkronisasi aktivasi wali santri:', waliId);
    } catch (syncErr) {
        console.warn('[SUPABASE SYNC WARN] Gagal sinkronisasi ke Supabase:', syncErr);
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
    const currentRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                        sessionStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
    if (typeof isModuleAllowedForRole === 'function' && !isModuleAllowedForRole(viewName, currentRole)) {
        if (typeof showToast === 'function') {
            showToast(`Akses Ditolak: Peran ${currentRole} tidak memiliki izin untuk modul ini.`);
        } else {
            alert(`Akses Ditolak: Peran ${currentRole} tidak memiliki izin untuk modul ini.`);
        }
        return;
    }
    if ((currentRole === 'PENGASUH' || currentRole === 'pengasuh') && viewName === 'tahfidz' && typeof openTahfidzPengasuhView === 'function') {
        openTahfidzPengasuhView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
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
const AUTH_API_URL = (typeof ASNAWIYYAH_CONFIG !== 'undefined' && ASNAWIYYAH_CONFIG.apiUrl)
    ? ASNAWIYYAH_CONFIG.apiUrl
    : ASN_PHASE2B_AUTH_URL; 
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
                
                // Langsung arahkan masuk ke tampilan Dashboard Eksekutif Dewan Masyayikh
                setTimeout(() => {
                    if (typeof switchTab === 'function') switchTab('admin', true);
                    if (typeof showAdminView === 'function') showAdminView('hub');
                    if (typeof applyAdminRoleVisibility === 'function') applyAdminRoleVisibility('PENGASUH');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
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

// ==================== USER PRESENCE & HEARTBEAT ENGINE ====================
let userPresenceTimer = null;

function detectClientDeviceInfo() {
    if (typeof window === 'undefined') return 'Desktop Browser';
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    
    let os = 'Desktop';
    if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';

    if (isStandalone) {
        return `📱 PWA ${os}`;
    }
    if (os === 'Android' || os === 'iOS') {
        return `📱 Mobile ${browser} (${os})`;
    }
    return `💻 ${browser} ${os}`;
}

async function sendUserPresenceHeartbeat() {
    const config = window.ASNAWIYYAH_CONFIG || {};
    const sbUrl = config.supabaseUrl;
    const sbKey = config.supabaseKey;
    if (!sbUrl || !sbKey) return;

    let currentId = null;
    let currentEmail = null;
    let currentPhone = null;

    if (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser) {
        const u = ASNIdentity.currentUser;
        currentId = u.userId || u.user_id || u.identityId || u.id;
        currentEmail = u.email;
        currentPhone = u.phone || u.telepon;
    }

    if (!currentId && !currentEmail && !currentPhone) {
        try {
            const adminData = JSON.parse(sessionStorage.getItem('asnawiyyah_admin_data') || localStorage.getItem('asnawiyyah_admin_data') || '{}');
            currentId = adminData.userId || adminData.id || adminData.user_id;
            currentEmail = adminData.email;
            currentPhone = adminData.phone;
        } catch (e) {}
    }

    if (!currentId && !currentEmail && !currentPhone) return;

    let filterParam = '';
    if (currentId && currentEmail) {
        filterParam = `or=(user_id.eq.${encodeURIComponent(currentId)},email.eq.${encodeURIComponent(currentEmail)})`;
    } else if (currentId) {
        filterParam = `user_id=eq.${encodeURIComponent(currentId)}`;
    } else if (currentEmail) {
        filterParam = `email=eq.${encodeURIComponent(currentEmail)}`;
    } else if (currentPhone) {
        filterParam = `phone=eq.${encodeURIComponent(currentPhone)}`;
    }

    try {
        const deviceInfo = detectClientDeviceInfo();
        await fetch(`${sbUrl}/rest/v1/users?${filterParam}`, {
            method: 'PATCH',
            headers: {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                last_seen_at: new Date().toISOString(),
                device_info: deviceInfo
            })
        });
    } catch (e) {
        // Silent failover
    }
}

function startUserPresenceHeartbeat() {
    sendUserPresenceHeartbeat();
    if (!userPresenceTimer && typeof setInterval !== 'undefined') {
        userPresenceTimer = setInterval(sendUserPresenceHeartbeat, 60000);
    }
}

function calculateUserOnlineStatus(lastSeenAt) {
    if (!lastSeenAt) return { status: 'offline', label: 'Offline', color: 'slate', text: 'Belum aktif', isOnline: false };
    const diffMs = Date.now() - new Date(lastSeenAt).getTime();
    if (isNaN(diffMs) || diffMs < 0) return { status: 'online', label: 'Online', color: 'emerald', text: 'Online sekarang', isOnline: true };
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins <= 5) return { status: 'online', label: 'Online', color: 'emerald', text: 'Online sekarang', isOnline: true };
    if (diffMins <= 10) return { status: 'idle', label: 'Idle', color: 'amber', text: `${diffMins} mnt lalu (Idle)`, isOnline: true };
    if (diffMins < 60) return { status: 'offline', label: 'Offline', color: 'slate', text: `${diffMins} mnt lalu`, isOnline: false };
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return { status: 'offline', label: 'Offline', color: 'slate', text: `${diffHours} jam lalu`, isOnline: false };
    return { status: 'offline', label: 'Offline', color: 'slate', text: `${Math.floor(diffHours / 24)} hari lalu`, isOnline: false };
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            sendUserPresenceHeartbeat();
        }
    });
}

// Export ke window
window.detectClientDeviceInfo = detectClientDeviceInfo;
window.sendUserPresenceHeartbeat = sendUserPresenceHeartbeat;
window.startUserPresenceHeartbeat = startUserPresenceHeartbeat;
window.calculateUserOnlineStatus = calculateUserOnlineStatus;
window.startAdminOtpCooldown = startAdminOtpCooldown;
window.stopAdminOtpCooldown = stopAdminOtpCooldown;
window.resendAdminOtp = resendAdminOtp;
window.startParentOtpCooldown = startParentOtpCooldown;
window.stopParentOtpCooldown = stopParentOtpCooldown;
window.resendParentOtp = resendParentOtp;

// ============================================================================
// SELF-SERVICE CONNECT STUDENT (OPSI B: HUBUNGKAN ANAK LAIN DI DASHBOARD WALI)
// ============================================================================

function openSelfServiceConnectStudentModal() {
    const modal = document.getElementById('modal-self-service-connect-student');
    const alertBox = document.getElementById('self-connect-alert');
    if (alertBox) alertBox.classList.add('hidden');
    const nisInput = document.getElementById('self-connect-nis');
    const birthInput = document.getElementById('self-connect-birthdate');
    if (nisInput) nisInput.value = '';
    if (birthInput) birthInput.value = '';
    if (modal) modal.classList.remove('hidden');
    if (nisInput) setTimeout(() => nisInput.focus(), 150);
}

function closeSelfServiceConnectStudentModal() {
    const modal = document.getElementById('modal-self-service-connect-student');
    if (modal) modal.classList.add('hidden');
}

function normalizeBirthDate(d) {
    if (!d) return '';
    const str = String(d).trim();
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // Format DD/MM/YYYY atau DD-MM-YYYY
    const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
    try {
        const dt = new Date(str);
        if (!isNaN(dt.getTime())) {
            const yr = dt.getFullYear();
            const mo = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            return `${yr}-${mo}-${day}`;
        }
    } catch (e) {}
    return str.replace(/[^0-9]/g, '');
}

async function handleSelfServiceConnectStudent(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-self-connect-submit');
    const alertBox = document.getElementById('self-connect-alert');
    const alertText = document.getElementById('self-connect-alert-text');
    const nisInput = document.getElementById('self-connect-nis');
    const birthInput = document.getElementById('self-connect-birthdate');
    const relInput = document.getElementById('self-connect-relationship');

    const nis = (nisInput?.value || '').trim();
    const birthDate = (birthInput?.value || '').trim();
    const relationship = (relInput?.value || 'GUARDIAN').trim();

    if (!nis || !birthDate) {
        if (alertBox && alertText) {
            alertText.innerText = 'NIS dan Tanggal Lahir santri wajib diisi.';
            alertBox.classList.remove('hidden');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs mr-1"></i><span>Memverifikasi Identitas...</span>`;
    }
    if (alertBox) alertBox.classList.add('hidden');

    try {
        const config = window.ASNAWIYYAH_CONFIG || {};
        const sbUrl = config.supabaseUrl;
        const sbKey = config.supabaseKey;
        if (!sbUrl || !sbKey) throw new Error('Konfigurasi database server tidak tersedia.');

        const headers = {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json'
        };

        // 1. Cari data santri dari memori / database resmi
        let student = null;
        let localList = [];
        if (typeof window.adminStudentsData !== 'undefined' && Array.isArray(window.adminStudentsData)) {
            localList = window.adminStudentsData;
        } else {
            try {
                const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
                if (cached) localList = JSON.parse(cached);
            } catch(e) {}
        }

        const cleanNis = nis.toLowerCase();
        student = localList.find(s => {
            const sNis = String(s.nis || s.nisn || '').toLowerCase().trim();
            const sId = String(s.studentId || s.student_id || '').toLowerCase().trim();
            return sNis === cleanNis || sId === cleanNis;
        });

        // Jika belum ada di memori, query ke Supabase REST API
        if (!student) {
            const encNis = encodeURIComponent(nis);
            const queryUrl = `${sbUrl}/rest/v1/students?or=(nis.eq.${encNis},student_id.eq.${encNis},nisn.eq.${encNis})&limit=1`;
            const sRes = await fetch(queryUrl, { headers });
            if (sRes.ok) {
                const resArr = await sRes.json();
                if (Array.isArray(resArr) && resArr.length > 0) {
                    student = resArr[0];
                }
            }
        }

        if (!student) {
            throw new Error(`Santri dengan NIS "${nis}" tidak ditemukan di database resmi madrasah.`);
        }

        // 2. Verifikasi PIN Tanggal Lahir Santri
        const rawStudentBirth = student.birthDate || student.birth_date || student.tanggal_lahir || '';
        if (rawStudentBirth) {
            const normInput = normalizeBirthDate(birthDate);
            const normDb = normalizeBirthDate(rawStudentBirth);
            if (normInput && normDb && normInput !== normDb) {
                throw new Error('Tanggal Lahir santri tidak sesuai dengan catatan madrasah. Pastikan PIN tanggal lahir tepat.');
            }
        }

        // 3. Cek apakah santri sudah terhubung ke akun ini
        const studentId = student.studentId || student.student_id || student.id || student.nis;
        const currentLinked = Array.isArray(ASNIdentity.linkedStudents) ? ASNIdentity.linkedStudents : [];
        const isAlreadyLinked = currentLinked.some(s => {
            const existingId = s.studentId || s.student_id || s.id || s.nis;
            return String(existingId).toLowerCase() === String(studentId).toLowerCase() ||
                   (s.nis && String(s.nis).toLowerCase() === cleanNis);
        });

        if (isAlreadyLinked) {
            throw new Error(`Ananda "${student.name || nis}" sudah terhubung di dalam akun Anda.`);
        }

        // 4. Dapatkan Wali ID dari sesi login aktif
        const currentUser = ASNIdentity.currentUser || {};
        const waliId = currentUser.userId || currentUser.identityId || currentUser.id || 
                       sessionStorage.getItem('asn_temp_parent_id') || 
                       (currentUser.email ? `USR_WLI_${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}` : '');

        if (!waliId) {
            throw new Error('Sesi akun wali tidak valid. Silakan muat ulang halaman atau login kembali.');
        }

        // 5. Simpan relasi ke public.wali_santri_map Supabase Cloud
        const nowIso = new Date().toISOString();
        const mapId = `MAP_${waliId.replace(/[^a-zA-Z0-9]/g, '')}_${String(studentId).replace(/[^a-zA-Z0-9]/g, '')}`;

        const saveMapRes = await fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                map_id: mapId,
                wali_id: waliId,
                student_id: studentId,
                relationship: relationship,
                status: 'VERIFIED',
                created_at: nowIso
            })
        });

        if (!saveMapRes.ok) {
            const errJson = await saveMapRes.json().catch(() => ({}));
            throw new Error(errJson.message || `Gagal menyimpan tautan anak ke database (${saveMapRes.status})`);
        }

        // 6. Update state sesi lokal (Memori + Storage)
        const newStudentObj = {
            studentId: studentId,
            student_id: studentId,
            name: student.name || 'Santri',
            nis: student.nis || student.nisn || nis,
            gender: student.gender || 'L',
            program: student.program || student.kelas || 'Reguler',
            relationship: relationship,
            photoUrl: student.photoUrl || student.photo_url || ''
        };

        ASNIdentity.linkedStudents.push(newStudentObj);
        sessionStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(ASNIdentity.linkedStudents));
        localStorage.setItem(ASN_STORAGE_KEYS.PARENT_STUDENTS, JSON.stringify(ASNIdentity.linkedStudents));

        // 7. Render ulang KTS Digital & Pelacak Perpulangan
        ASNIdentity.setStudentFilter('ALL');

        try {
            if (window.ASNPerpulangan && typeof window.ASNPerpulangan.loadWaliPerpulanganData === 'function') {
                window.ASNPerpulangan.loadWaliPerpulanganData();
            } else if (typeof window.loadWaliPerpulanganData === 'function') {
                window.loadWaliPerpulanganData();
            }
        } catch (e) {}

        closeSelfServiceConnectStudentModal();

        if (typeof showToast === 'function') {
            showToast(`Alhamdulillah! Ananda ${student.name || 'Santri'} berhasil dihubungkan ke akun Anda.`);
        }

    } catch (err) {
        console.warn('[SelfServiceConnectStudent Error]', err);
        if (alertBox && alertText) {
            alertText.innerText = err.message || 'Terjadi kesalahan saat memverifikasi santri.';
            alertBox.classList.remove('hidden');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-link text-xs mr-1"></i><span>Verifikasi & Hubungkan Santri</span>`;
        }
    }
}

// Window exports
window.openSelfServiceConnectStudentModal = openSelfServiceConnectStudentModal;
window.closeSelfServiceConnectStudentModal = closeSelfServiceConnectStudentModal;
window.normalizeBirthDate = normalizeBirthDate;
window.handleSelfServiceConnectStudent = handleSelfServiceConnectStudent;
window.switchParentAuthMethod = switchParentAuthMethod;
window.handleParentQuickLoginNis = handleParentQuickLoginNis;