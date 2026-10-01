        // ==================== ASNAWIYYAH GLOBAL CONFIGURATION ====================
        // Seluruh komunikasi backend melewati adapter ini dengan konfigurasi tersentralisasi.
        window.ASNAWIYYAH_CONFIG = window.ASNAWIYYAH_CONFIG || {};
        if (!window.ASNAWIYYAH_CONFIG.apiUrl) {
            window.ASNAWIYYAH_CONFIG.apiUrl = "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec";
        }
        window.ASNAWIYYAH_CONFIG.supabaseUrl = "https://tkjhfhyabacbyknwrysh.supabase.co";
        window.ASNAWIYYAH_CONFIG.supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";
        window.ASNAWIYYAH_CONFIG.dbProvider = "hybrid";

        // Backward-compatibility alias
        const WEB_APP_URL = window.ASNAWIYYAH_CONFIG.apiUrl;

        function getApiUrl() {
            return (window.ASNAWIYYAH_CONFIG && window.ASNAWIYYAH_CONFIG.apiUrl) || WEB_APP_URL || "";
        }

        /**
         * Akselerasi Query Cepat (Fast-Read) langsung dari Supabase REST API (<50ms).
         * Menyediakan fallback otomatis ke Google Apps Script jika terjadi offline / network issue.
         */
        async function fetchFromSupabase(action, params = {}) {
            const config = window.ASNAWIYYAH_CONFIG || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            if (!sbUrl || !sbKey) return null;

            const headers = {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`,
                'Accept': 'application/json'
            };

            try {
                if (action === "getBanner") {
                    const res = await fetch(`${sbUrl}/rest/v1/banner?status=eq.Aktif&order=urutan.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(b => ({
                            id: b.id_banner,
                            nama: b.nama_banner,
                            gambar: b.gambar_url,
                            tipeAksi: b.tipe_aksi,
                            targetAksi: b.target_aksi,
                            urutan: b.urutan,
                            status: b.status
                        }))
                    };
                }

                if (action === "getKabar") {
                    const res = await fetch(`${sbUrl}/rest/v1/berita?status=eq.Publish&order=created_at.desc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(n => ({
                            news_id: n.news_id,
                            slug: n.slug,
                            tanggal: n.tanggal,
                            judul: n.judul,
                            kategori: n.kategori,
                            ringkasan: n.ringkasan,
                            isi: n.isi,
                            penulis: n.penulis || "Admin",
                            gambar: n.gambar_url || n.foto_url || ""
                        }))
                    };
                }

                if (action === "getNotifikasi") {
                    const res = await fetch(`${sbUrl}/rest/v1/notifikasi?status=eq.Aktif&order=created_at.desc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(notif => ({
                            id: notif.id,
                            judul: notif.judul,
                            kategori: notif.kategori,
                            tanggal: notif.tanggal,
                            ringkasan: notif.ringkasan,
                            isi: notif.isi,
                            gambar: notif.gambar_url || "",
                            isPopup: Boolean(notif.is_popup),
                            status: notif.status
                        }))
                    };
                }

                if (action === "getGaleri") {
                    const res = await fetch(`${sbUrl}/rest/v1/galeri?status=eq.Aktif&order=timestamp.desc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(g => ({
                            id: g.id_galeri,
                            judul: g.judul,
                            kategori: g.kategori,
                            keterangan: g.keterangan,
                            gambar: g.gambar_url,
                            status: g.status,
                            timestamp: g.timestamp
                        }))
                    };
                }

                if (action === "getUnitKegiatan") {
                    const res = await fetch(`${sbUrl}/rest/v1/unit_kegiatan?status=eq.Aktif&order=urutan.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(u => ({
                            id: u.id_kegiatan,
                            nama: u.nama,
                            kategori: u.kategori,
                            jadwal: u.jadwal,
                            deskripsi: u.deskripsi,
                            gambar: u.gambar_url,
                            urutan: u.urutan,
                            status: u.status
                        }))
                    };
                }

                if (action === "program.listPublished") {
                    const res = await fetch(`${sbUrl}/rest/v1/programs?status=eq.published&order=sort_order.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows
                    };
                }

                if (action === "alumni.getTestimonials") {
                    const res = await fetch(`${sbUrl}/rest/v1/alumni?izin_publikasi=eq.Ya&select=*`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(a => ({
                            nama: a.nama_lengkap,
                            angkatan: a.tahun_lulus,
                            pekerjaan: a.kesibukan,
                            pesan: a.kesan_pesan,
                            foto: a.foto
                        }))
                    };
                }

                if (action === "getPengaturan") {
                    const res = await fetch(`${sbUrl}/rest/v1/pengaturan?select=*`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    const settings = {};
                    rows.forEach(r => { settings[r.key] = r.value; });
                    return {
                        status: "success",
                        data: settings
                    };
                }

                // 8. Manajemen Pengguna Terpadu (Users + Wali Santri Map)
                if (action === "auth.admin.userList" || action === "admin.users.list" || action === "admin.userList" || action === "getUsers") {
                    const res = await fetch(`${sbUrl}/rest/v1/users?order=created_at.desc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();

                    let mapRows = [];
                    try {
                        const mRes = await fetch(`${sbUrl}/rest/v1/wali_santri_map?select=*`, { headers });
                        if (mRes.ok) mapRows = await mRes.json();
                    } catch (e) {}

                    const users = rows.map(u => {
                        const userMaps = mapRows.filter(m => m.wali_id === u.user_id);
                        return {
                            userId: u.user_id,
                            name: u.name,
                            email: u.email || "",
                            phone: u.phone || "",
                            role: u.role,
                            photoUrl: u.photo_url || "",
                            status: u.status || "ACTIVE",
                            created_at: u.created_at,
                            last_login_at: u.last_login_at,
                            linkedStudents: userMaps.map(m => ({
                                studentId: m.student_id,
                                relationship: m.relationship
                            }))
                        };
                    });

                    const summary = {
                        total: users.length,
                        wali: users.filter(u => u.role === 'WALI_SANTRI').length,
                        asatidz: users.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR').length,
                        pengurus: users.filter(u => u.role === 'PENGURUS').length,
                        bendahara: users.filter(u => u.role === 'BENDAHARA').length,
                        pengasuh: users.filter(u => u.role === 'PENGASUH').length,
                        admin: users.filter(u => u.role === 'ADMIN').length,
                        superAdmin: users.filter(u => u.role === 'SUPER_ADMIN').length
                    };

                    return {
                        success: true,
                        status: "success",
                        users: users,
                        summary: summary
                    };
                }

                // 9. Master Data Santri (Students)
                if (action === "getStudents" || action === "student.list" || action === "auth.student.list") {
                    const res = await fetch(`${sbUrl}/rest/v1/students?order=name.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    const students = rows.map(s => ({
                        id: s.student_id,
                        student_id: s.student_id,
                        nis: s.nis || "",
                        nik: s.nik || "",
                        name: s.name,
                        gender: s.gender || "L",
                        birth_date: s.birth_date || "",
                        program: s.program || "Tahfidz",
                        status: s.status || "ACTIVE",
                        photo_url: s.photo_url || ""
                    }));

                    return {
                        success: true,
                        status: "success",
                        data: students,
                        summary: {
                            total: students.length,
                            putra: students.filter(s => (s.gender || '').toUpperCase() === 'L').length,
                            putri: students.filter(s => (s.gender || '').toUpperCase() === 'P').length,
                            aktif: students.filter(s => (s.status || '').toUpperCase() === 'ACTIVE').length
                        }
                    };
                }

                // 10. Data Pegawai / Asatidz
                if (action === "getEmployees" || action === "employee.list" || action === "auth.employee.list") {
                    const res = await fetch(`${sbUrl}/rest/v1/pegawai?order=nama.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        success: true,
                        status: "success",
                        data: rows.map(p => ({
                            id: p.employee_id,
                            employee_id: p.employee_id,
                            nama: p.nama,
                            nip: p.nip || "",
                            gender: p.gender || "L",
                            jabatan: p.jabatan || "Pengajar",
                            spesialisasi: p.spesialisasi || "",
                            telepon: p.telepon || "",
                            email: p.email || "",
                            status: p.status || "ACTIVE"
                        }))
                    };
                }
            } catch (err) {
                console.warn("[SUPABASE FETCH ERROR]", action, err);
                return null;
            }

            return null;
        }

        async function apiGet(action, params = {}) {
            // 1. Akselerasi tercepat via Supabase Cloud DB
            try {
                const sbData = await fetchFromSupabase(action, params);
                if (sbData) return sbData;
            } catch (sbErr) {
                console.warn("[SUPABASE FAILOVER] Beralih ke Google Apps Script:", sbErr);
            }

            // 2. Fallback aman ke Google Apps Script
            const endpoint = getApiUrl();
            if (!endpoint) throw new Error("API URL belum dikonfigurasi.");

            const url = new URL(endpoint);
            url.searchParams.set("action", action);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
            });

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: { "Accept": "application/json" }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        }

        async function apiPost(action, payload = {}) {
            // Akselerasi Cepat via Supabase untuk Read Actions
            const fastReadActions = [
                'auth.admin.userList', 'admin.users.list', 'admin.userList', 'getUsers',
                'getStudents', 'student.list', 'auth.student.list',
                'getEmployees', 'employee.list', 'auth.employee.list',
                'getBanner', 'getKabar', 'getNotifikasi', 'getGaleri', 'getUnitKegiatan', 'getPengaturan'
            ];
            if (fastReadActions.includes(action)) {
                try {
                    const sbData = await fetchFromSupabase(action, payload);
                    if (sbData) return sbData;
                } catch (sbErr) {
                    console.warn('[SUPABASE FAILOVER] apiPost beralih ke Apps Script:', sbErr);
                }
            }

            const endpoint = getApiUrl();
            if (!endpoint) throw new Error("API URL belum dikonfigurasi.");

            const adminToken = (typeof getAdminSessionToken === "function" ? getAdminSessionToken() : sessionStorage.getItem("asnawiyyah_admin_token")) || "";
            const bodyPayload = { action, ...payload };
            if (adminToken && !bodyPayload.token) {
                bodyPayload.token = adminToken;
            }

            const response = await fetch(endpoint, {
                method: "POST",
                // text/plain menghindari CORS preflight OPTIONS pada Apps Script Web App.
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                    "Accept": "application/json"
                },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        }

        window.fetchFromSupabase = fetchFromSupabase;
        window.apiGet = apiGet;
        window.apiPost = apiPost;

        function isApiConfigured() {
            return Boolean(getApiUrl());
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        /**
         * Mengonversi semua variasi URL YouTube (watch?v=, youtu.be/, shorts/, playlist)
         * menjadi URL embed resmi yang aman disematkan dalam <iframe> tanpa terblokir X-Frame-Options.
         */
        /**
         * Mengonversi semua variasi URL YouTube (watch?v=, youtu.be/, shorts/, playlist, m.youtube.com)
         * menjadi URL embed resmi yang aman disematkan dalam <iframe> tanpa terblokir X-Frame-Options.
         */
        function formatYoutubeEmbedUrl(rawUrl) {
            if (!rawUrl || typeof rawUrl !== 'string') return "https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0";
            const trimmed = rawUrl.trim();
            if (!trimmed) return "https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0";

            // Jika sudah berformat embed, kembalikan langsung dengan rel=0
            if (trimmed.includes('youtube.com/embed/') || trimmed.includes('youtube-nocookie.com/embed/')) {
                return trimmed.includes('?') ? trimmed : `${trimmed}?rel=0`;
            }

            // 1. Playlist: youtube.com/playlist?list=ID
            const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
            if (playlistMatch && playlistMatch[1] && !trimmed.includes('watch?v=')) {
                return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&rel=0`;
            }

            // 2. Short Link: youtu.be/VIDEO_ID
            const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (shortMatch && shortMatch[1]) {
                return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
            }

            // 3. Watch Link (desktop www atau mobile m.youtube.com): watch?v=VIDEO_ID
            const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            if (watchMatch && watchMatch[1]) {
                return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
            }

            // 4. Shorts: youtube.com/shorts/VIDEO_ID
            const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (shortsMatch && shortsMatch[1]) {
                return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0`;
            }

            // Sanitasi ketat: jika bukan link video yang valid, JANGAN kembalikan URL mentah (seperti m.youtube.com)
            // agar iframe tidak memicu 'X-Frame-Options: sameorigin'. Gunakan fallback embed resmi pesantren.
            return "https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0";
        }

        // ==================== STATE MANAGEMENT DATA ====================
        let mockNewsData = [
            {
                news_id: "NEWS_1",
                slug: "santri-pptq-asnawiyyah-sabet-juara-olimpiade-matematika",
                tanggal: "5 Juli 2026",
                kategori: "Prestasi",
                judul: "Santri PPTQ Asnawiyyah Sabet Juara Olimpiade Matematika",
                ringkasan: "Alhamdulillah, santri PPTQ Asnawiyyah kembali meraih prestasi membanggakan dengan meraih juara pertama olimpiade matematika...",
                isi: "Alhamdulillah, santri PPTQ Asnawiyyah kembali meraih prestasi membanggakan dengan meraih juara pertama olimpiade matematika tingkat Provinsi Jawa Tengah.\n\nKeberhasilan ini membuktikan bahwa kurikulum terintegrasi yang menggabungkan khazanah salaf klasik dan sains teknologi mampu bersaing di kancah nasional. Semoga prestasi ini memacu santri lainnya.",
                penulis: "Humas Pesantren",
                gambar: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop"
            },
            {
                news_id: "NEWS_2",
                slug: "silahturahmi-tokoh-ulama-nasional-pengarahan-keilmuan",
                tanggal: "2 Juli 2026",
                kategori: "Kajian",
                judul: "Silahturahmi Tokoh Ulama Nasional & Pengarahan Keilmuan",
                ringkasan: "Pesantren menyambut hangat silaturahmi tokoh ulama nasional yang memberikan wejangan mendalam bagi para santri...",
                isi: "Pesantren menyambut hangat silaturahmi tokoh ulama nasional di Aula Utama. Beliau memberikan pengarahan keilmuan kepada seluruh santri agar tetap bersemangat menuntut ilmu di tengah derasnya modernitas global.\n\nBeliau menekankan pentingnya penguasaan literatur klasik sebagai akar moderasi beragama.",
                penulis: "Kesiswaan",
                gambar: "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=800&auto=format&fit=crop"
            }
        ];

        let mockBannerData = [
            {
                id: "BAN_1",
                nama: "Penerimaan Santri Baru TA 2026/2027",
                gambar: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop",
                tipeAksi: "tab",
                targetAksi: "ppdb",
                urutan: 1,
                status: "Aktif"
            },
            {
                id: "BAN_2",
                nama: "Dokumentasi Sema'an Rutin Bil-Ghaib",
                gambar: "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?q=80&w=1200&auto=format&fit=crop",
                tipeAksi: "tab",
                targetAksi: "kabar",
                urutan: 2,
                status: "Aktif"
            },
            {
                id: "BAN_3",
                nama: "Program Unggulan Tahfidz & Kepesantrenan",
                gambar: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1200&auto=format&fit=crop",
                tipeAksi: "tab",
                targetAksi: "program-pilihan",
                urutan: 3,
                status: "Aktif"
            }
        ];

        let heroSlideTimer = null;
        let currentHeroSlide = 0;
        let previousTabBeforeNews = 'beranda';
        let isAdminLoggedIn = !!(
            (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('asnawiyyah_admin_token') || sessionStorage.getItem('asnawiyyah_pengasuh_token'))) ||
            (typeof localStorage !== 'undefined' && (localStorage.getItem('asnawiyyah_admin_token') || localStorage.getItem('asnawiyyah_pengasuh_token')))
        );
        let isLoggedIn = true;


        // ==================== UTILITY, MODAL & KALENDER ====================
        function showToast(message) {
            const toast = document.getElementById('toastMessage');
            const toastText = document.getElementById('toastText');
            toastText.innerText = message;
            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3500);
        }

        function simulateDownload(fileName) {
            showToast(`Mengunduh berkas: ${fileName}...`);
        }

        function copyShareLink() {
            const dummy = document.createElement('input');
            dummy.value = window.location.href;
            document.body.appendChild(dummy);
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            showToast("Tautan berhasil disalin!");
        }

        // ==================== LOGIKA KALENDER (TRI-KALENDER: MASEHI, HIJRIYAH & JAWA) ====================
        let currentCalDate = new Date();
        const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const namaHariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const pasaranJawa = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];

        const namaBulanHijriyah = [
            "",
            "Muharram",
            "Safar",
            "Rabi'ul Awwal",
            "Rabi'ul Akhir",
            "Jumadil Ula",
            "Jumadil Akhirah",
            "Rajab",
            "Sya'ban",
            "Ramadhan",
            "Syawal",
            "Dzulqa'dah",
            "Dzulhijjah"
        ];

        // Database Hari Besar Islam Berdasarkan Kalender Hijriyah (Format: "Bulan-Tanggal")
        const HARI_BESAR_ISLAM = {
            "1-1": { title: "Tahun Baru Islam", desc: "1 Muharram - Awal Tahun Baru Hijriyah", type: "holiday", badgeColor: "amber", icon: "fa-star-and-crescent" },
            "1-9": { title: "Puasa Tasu'a", desc: "9 Muharram - Puasa Sunnah Tasu'a", type: "fasting", badgeColor: "emerald", icon: "fa-moon" },
            "1-10": { title: "Hari Asyura & Puasa Asyura", desc: "10 Muharram - Puasa Sunnah Pelebur Dosa Setahun", type: "fasting", badgeColor: "emerald", icon: "fa-moon" },
            "3-12": { title: "Maulid Nabi Muhammad SAW", desc: "12 Rabi'ul Awwal - Peringatan Kelahiran Rasulullah SAW", type: "holiday", badgeColor: "amber", icon: "fa-mosque" },
            "7-27": { title: "Isra' Mi'raj Nabi Muhammad SAW", desc: "27 Rajab - Peristiwa Agung Isra' & Mi'raj", type: "holiday", badgeColor: "amber", icon: "fa-mosque" },
            "8-15": { title: "Malam Nisfu Sya'ban", desc: "15 Sya'ban - Malam Pertengahan Bulan Sya'ban & Doa Bersama", type: "event", badgeColor: "indigo", icon: "fa-star" },
            "9-1": { title: "Awal Puasa Ramadhan", desc: "1 Ramadhan - Pembuka Ibadah Puasa Wajib Umat Islam", type: "ramadhan", badgeColor: "emerald", icon: "fa-moon" },
            "9-17": { title: "Peringatan Nuzulul Qur'an", desc: "17 Ramadhan - Peringatan Turunnya Al-Qur'anul Karim", type: "holiday", badgeColor: "amber", icon: "fa-book-quran" },
            "10-1": { title: "Hari Raya Idul Fitri", desc: "1 Syawal - Hari Kemenangan & Shalat Ied (Haram Puasa)", type: "eid", badgeColor: "rose", icon: "fa-mosque" },
            "10-2": { title: "Hari Raya Idul Fitri (Hari Ke-2)", desc: "2 Syawal - Silaturahmi Syawal & Halalbihalal", type: "eid", badgeColor: "rose", icon: "fa-mosque" },
            "12-8": { title: "Hari Tarwiyah", desc: "8 Dzulhijjah - Puasa Sunnah Tarwiyah", type: "fasting", badgeColor: "emerald", icon: "fa-moon" },
            "12-9": { title: "Hari Arafah", desc: "9 Dzulhijjah - Puasa Sunnah Arafah Penghapus Dosa 2 Tahun", type: "fasting", badgeColor: "emerald", icon: "fa-moon" },
            "12-10": { title: "Hari Raya Idul Adha", desc: "10 Dzulhijjah - Shalat Ied Qurban & Penyembelihan (Haram Puasa)", type: "eid", badgeColor: "rose", icon: "fa-cow" },
            "12-11": { title: "Hari Tasyrik Ke-1", desc: "11 Dzulhijjah - Hari Tasyrik Qurban (Haram Puasa)", type: "tasyrik", badgeColor: "rose", icon: "fa-ban" },
            "12-12": { title: "Hari Tasyrik Ke-2", desc: "12 Dzulhijjah - Hari Tasyrik Qurban (Haram Puasa)", type: "tasyrik", badgeColor: "rose", icon: "fa-ban" },
            "12-13": { title: "Hari Tasyrik Ke-3", desc: "13 Dzulhijjah - Hari Tasyrik Qurban (Haram Puasa)", type: "tasyrik", badgeColor: "rose", icon: "fa-ban" }
        };

        // Agenda Tahunan Nasional & Pesantren (Berdasarkan Penanggalan Masehi "Bulan-Tanggal")
        const AGENDA_MASEHI = {
            "8-17": { title: "HUT Kemerdekaan RI", desc: "17 Agustus - Upacara Bendera Santri & Asatidz", type: "national", badgeColor: "red", icon: "fa-flag" },
            "10-22": { title: "Hari Santri Nasional", desc: "22 Oktober - Apel Akbar & Kirab Resolusi Jihad", type: "pesantren", badgeColor: "emerald", icon: "fa-users" }
        };

        // Standar Koreksi Kalender Hijriyah Lembaga Falakiyah PBNU (LF PBNU) & Kemenag RI
        // Kalender Ummul Qura (Arab Saudi) umumnya mendahului 1 hari dibanding Imkanur Rukyah MABIMS LF PBNU di Indonesia.
        const HIJRI_OFFSET_PBNU = -1;

        function getPasaranJawa(dateObj) {
            const timestamp = dateObj.getTime();
            const totalHari = Math.floor((timestamp + (7 * 3600 * 1000)) / 86400000);
            const pasaranIdx = (totalHari + 3) % 5;
            return pasaranJawa[(pasaranIdx + 5) % 5];
        }

        function getHijriDate(dateObj, offsetDays = HIJRI_OFFSET_PBNU) {
            if (!dateObj) dateObj = new Date();
            try {
                // Terapkan penyesuaian hari sesuai hisab / rukyah LF PBNU
                const targetTime = dateObj.getTime() + (offsetDays * 86400000);
                const adjustedDate = new Date(targetTime);

                let fmt;
                try {
                    fmt = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                    });
                } catch (e1) {
                    fmt = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                    });
                }
                const parts = fmt.formatToParts(adjustedDate);
                let day = 1, month = 1, year = 1448;
                for (const p of parts) {
                    if (p.type === 'day') day = parseInt(p.value, 10);
                    if (p.type === 'month') month = parseInt(p.value, 10);
                    if (p.type === 'year') {
                        const cleanYear = p.value.replace(/[^0-9]/g, '');
                        if (cleanYear) year = parseInt(cleanYear, 10);
                    }
                }
                const monthName = namaBulanHijriyah[month] || `Bulan ${month}`;
                return {
                    day,
                    month,
                    year,
                    monthName,
                    formatted: `${day} ${monthName} ${year} H`
                };
            } catch (e) {
                return {
                    day: 1,
                    month: 1,
                    year: 1448,
                    monthName: "Hijriyah",
                    formatted: "1448 H"
                };
            }
        }

        function getIslamicCalendarInfo(dateObj) {
            const hijri = getHijriDate(dateObj);
            const dayOfWeek = dateObj.getDay();
            const masehiKey = `${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
            const hijriKey = `${hijri.month}-${hijri.day}`;

            const holiday = HARI_BESAR_ISLAM[hijriKey] || null;
            const national = AGENDA_MASEHI[masehiKey] || null;

            // Hari yang Diharamkan Berpuasa (1 Syawal & 10-13 Dzulhijjah)
            const isHaramPuasa = (hijri.month === 10 && hijri.day === 1) ||
                                 (hijri.month === 12 && [10, 11, 12, 13].includes(hijri.day));

            // Puasa Wajib Ramadhan
            const isRamadhan = (hijri.month === 9);

            // Puasa Sunnah Ayyamul Bidh (13, 14, 15 Hijriyah) kecuali Ramadhan & 13 Dzulhijjah
            const isAyyamulBidh = !isRamadhan && !isHaramPuasa && [13, 14, 15].includes(hijri.day);

            // Puasa Sunnah Rutin Senin & Kamis
            const isSeninKamis = !isRamadhan && !isHaramPuasa && (dayOfWeek === 1 || dayOfWeek === 4);

            let fastingInfo = null;
            if (isRamadhan) {
                fastingInfo = { name: `Puasa Ramadhan (Hari Ke-${hijri.day})`, type: 'ramadhan' };
            } else if (isAyyamulBidh) {
                const urutan = hijri.day === 13 ? "Hari Ke-1" : hijri.day === 14 ? "Hari Ke-2" : "Hari Ke-3";
                fastingInfo = { name: `Puasa Sunnah Ayyamul Bidh (${urutan})`, type: 'ayyamul-bidh' };
            } else if (isSeninKamis) {
                fastingInfo = { name: `Puasa Sunnah ${dayOfWeek === 1 ? 'Senin' : 'Kamis'}`, type: 'senin-kamis' };
            }

            return {
                hijri,
                holiday,
                national,
                fastingInfo,
                isHaramPuasa,
                isSayyidulAyyam: dayOfWeek === 5
            };
        }

        function renderCalendar() {
            const year = currentCalDate.getFullYear();
            const month = currentCalDate.getMonth();

            const monthYearText = document.getElementById('cal-month-year-text');
            if (monthYearText) monthYearText.innerText = `${namaBulanIndo[month]} ${year}`;

            const firstDateObj = new Date(year, month, 1);
            const lastDate = new Date(year, month + 1, 0).getDate();
            const lastDateObj = new Date(year, month, lastDate);

            // Subheader Rentang Bulan Hijriyah
            const hijriMonthText = document.getElementById('cal-hijri-month-text');
            if (hijriMonthText) {
                const hStart = getHijriDate(firstDateObj);
                const hEnd = getHijriDate(lastDateObj);
                if (hStart.month === hEnd.month) {
                    hijriMonthText.innerText = `${hStart.monthName} ${hStart.year} H`;
                } else if (hStart.year === hEnd.year) {
                    hijriMonthText.innerText = `${hStart.monthName} - ${hEnd.monthName} ${hEnd.year} H`;
                } else {
                    hijriMonthText.innerText = `${hStart.monthName} ${hStart.year} - ${hEnd.monthName} ${hEnd.year} H`;
                }
            }

            const gridContainer = document.getElementById('calendar-days-grid');
            if (!gridContainer) return;
            gridContainer.innerHTML = "";

            const firstDayIndex = firstDateObj.getDay();

            for (let i = 0; i < firstDayIndex; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = "p-1 min-h-[44px] sm:min-h-[52px] md:min-h-[58px] bg-slate-50/40 dark:bg-[#15202d]/30 rounded-xl md:rounded-2xl";
                gridContainer.appendChild(emptyCell);
            }

            const today = new Date();
            const eventsInMonth = [];

            for (let day = 1; day <= lastDate; day++) {
                const thisDate = new Date(year, month, day);
                const dayOfWeek = thisDate.getDay();
                const pasaran = getPasaranJawa(thisDate);
                const calInfo = getIslamicCalendarInfo(thisDate);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                // Koleksi Agenda & Hari Besar Bulan Ini
                if (calInfo.holiday) {
                    eventsInMonth.push({
                        day,
                        title: calInfo.holiday.title,
                        desc: calInfo.holiday.desc,
                        badgeText: "Hari Besar Islam",
                        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                        boxBg: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
                    });
                }
                if (calInfo.national) {
                    eventsInMonth.push({
                        day,
                        title: calInfo.national.title,
                        desc: calInfo.national.desc,
                        badgeText: "Agenda Nasional",
                        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
                        boxBg: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-300"
                    });
                }
                if (calInfo.hijri.day === 13 && !calInfo.isHaramPuasa && calInfo.hijri.month !== 9) {
                    eventsInMonth.push({
                        day,
                        title: `Awal Puasa Ayyamul Bidh (${calInfo.hijri.monthName})`,
                        desc: `Puasa Sunnah 13, 14, 15 ${calInfo.hijri.monthName} ${calInfo.hijri.year} H`,
                        badgeText: "Puasa Sunnah",
                        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
                        boxBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300"
                    });
                }

                // Dot Indikator di Kotak Kalender
                let dotIndicator = `<span class="w-1.5 h-1.5 inline-block"></span>`;
                if (calInfo.holiday) {
                    dotIndicator = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="${calInfo.holiday.title}"></span>`;
                } else if (calInfo.fastingInfo) {
                    dotIndicator = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="${calInfo.fastingInfo.name}"></span>`;
                } else if (calInfo.isSayyidulAyyam) {
                    dotIndicator = `<span class="w-1.5 h-1.5 rounded-full bg-teal-400/80 shrink-0" title="Sayyidul Ayyam"></span>`;
                }

                const dayCell = document.createElement('div');
                let cellStyle = "p-1 min-h-[44px] sm:min-h-[52px] md:min-h-[58px] rounded-xl md:rounded-2xl flex flex-col justify-between items-center cursor-pointer transition border border-slate-100 dark:border-[#253447] hover:border-brand-600 dark:hover:border-emerald-500 ";

                if (isToday) {
                    cellStyle += "bg-brand-700 dark:bg-emerald-600 text-white font-bold shadow-md ring-2 ring-brand-500/30 dark:ring-emerald-400/30";
                } else if (dayOfWeek === 0) {
                    cellStyle += "bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40";
                } else if (dayOfWeek === 5) {
                    cellStyle += "bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40";
                } else {
                    cellStyle += "bg-slate-50/70 dark:bg-[#1c2836] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#253447]";
                }

                dayCell.className = cellStyle;
                dayCell.onclick = () => selectCalDate(year, month, day, pasaran, dayOfWeek);

                const hijriColor = isToday ? "text-amber-200" : "text-emerald-600 dark:text-emerald-400";
                const pasaranColor = isToday ? "text-amber-300" : (dayOfWeek === 0 ? "text-red-400 dark:text-red-400" : "text-slate-400 dark:text-slate-400");

                dayCell.innerHTML = `
                    <div class="flex justify-between items-center w-full px-0.5 sm:px-1 leading-none">
                        <div class="flex items-center">${dotIndicator}</div>
                        <span class="text-[8.5px] sm:text-[9.5px] font-bold ${hijriColor}">${calInfo.hijri.day}</span>
                    </div>
                    <span class="text-xs sm:text-sm font-extrabold my-0 leading-tight">${day}</span>
                    <span class="text-[7.5px] sm:text-[8.5px] font-semibold leading-none ${pasaranColor}">${pasaran}</span>
                `;
                gridContainer.appendChild(dayCell);
            }

            // Render Daftar Agenda & Hari Besar Bulan Ini
            renderCalendarEvents(eventsInMonth, month);

            // Set Tanggal Terpilih Default
            if (month === today.getMonth() && year === today.getFullYear()) {
                selectCalDate(today.getFullYear(), today.getMonth(), today.getDate(), getPasaranJawa(today), today.getDay());
            } else {
                selectCalDate(year, month, 1, getPasaranJawa(firstDateObj), firstDateObj.getDay());
            }
        }

        function renderCalendarEvents(events, month) {
            const container = document.getElementById('calendar-events-container');
            const countEl = document.getElementById('cal-events-count');
            if (!container) return;

            if (countEl) {
                countEl.innerText = `${events.length} Agenda`;
            }

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full p-4 text-center rounded-2xl bg-slate-50 dark:bg-[#1c2836] border border-dashed border-slate-200 dark:border-[#253447] text-xs text-slate-400 dark:text-slate-500">
                        <i class="fa-solid fa-calendar-check text-base text-slate-300 dark:text-slate-600 mb-1 block"></i>
                        Tidak ada peringatan hari besar khusus di bulan ${namaBulanIndo[month]}. Kegiatan pengajian & KBM santri berjalan normal.
                    </div>
                `;
                return;
            }

            const shortMonth = namaBulanIndo[month].substring(0, 3);
            container.innerHTML = events.map(ev => `
                <div class="p-3 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] flex items-center space-x-3 transition hover:border-emerald-500/40">
                    <div class="w-10 h-10 ${ev.boxBg} rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                        <span class="text-xs font-extrabold leading-none">${ev.day}</span>
                        <span class="text-[8px] uppercase font-semibold leading-none mt-0.5">${shortMonth}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${ev.title}</h4>
                            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${ev.badgeClass}">${ev.badgeText}</span>
                        </div>
                        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">${ev.desc}</p>
                    </div>
                </div>
            `).join('');
        }

        function changeCalMonth(delta) {
            currentCalDate.setMonth(currentCalDate.getMonth() + delta);
            renderCalendar();
        }

        function selectCalDate(year, month, day, pasaran, dayOfWeek) {
            const thisDate = new Date(year, month, day);
            const today = new Date();
            const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
            const info = getIslamicCalendarInfo(thisDate);
            const hari = namaHariIndo[dayOfWeek];
            const bulan = namaBulanIndo[month];

            const statusBadgeEl = document.getElementById('selected-date-status-badge');
            const titleEl = document.getElementById('selected-date-title');
            const subtitleEl = document.getElementById('selected-date-subtitle');
            const tagEl = document.getElementById('selected-date-tag');

            // Baris 1: Status Badge (Hari Ini / Tanggal Terpilih)
            if (statusBadgeEl) {
                if (isToday) {
                    statusBadgeEl.innerText = "Hari Ini";
                    statusBadgeEl.className = "text-[9px] font-extrabold uppercase bg-amber-400/25 text-amber-300 px-2 py-0.5 rounded tracking-wider shrink-0";
                } else {
                    statusBadgeEl.innerText = "Tanggal Terpilih";
                    statusBadgeEl.className = "text-[9px] font-bold uppercase bg-white/15 text-slate-200 px-2 py-0.5 rounded tracking-wider shrink-0";
                }
            }

            // Baris 1: Tag Ibadah / Peringatan / Agenda
            if (tagEl) {
                if (info.holiday) {
                    tagEl.innerHTML = `<i class="fa-solid ${info.holiday.icon} text-amber-300 mr-1.5"></i> ${info.holiday.title}`;
                } else if (info.isHaramPuasa) {
                    tagEl.innerHTML = `<i class="fa-solid fa-ban text-rose-300 mr-1.5"></i> Hari Diharamkan Berpuasa`;
                } else if (info.fastingInfo) {
                    tagEl.innerHTML = `<i class="fa-solid fa-moon text-emerald-300 mr-1.5"></i> ${info.fastingInfo.name}`;
                } else if (info.national) {
                    tagEl.innerHTML = `<i class="fa-solid ${info.national.icon} text-amber-300 mr-1.5"></i> ${info.national.title}`;
                } else if (hari === "Jumat") {
                    tagEl.innerHTML = `<i class="fa-solid fa-mosque text-emerald-300 mr-1.5"></i> Sayyidul Ayyam`;
                } else if (hari === "Minggu") {
                    tagEl.innerHTML = `<i class="fa-solid fa-mug-hot text-amber-300 mr-1.5"></i> Libur KBM Santri`;
                } else {
                    tagEl.innerHTML = `<i class="fa-solid fa-book-quran text-amber-300 mr-1.5"></i> Kegiatan Normal`;
                }
            }

            // Baris 2: Hari, tgl bln thn MASEHI
            if (titleEl) {
                titleEl.innerText = `${hari} ${pasaran}, ${day} ${bulan} ${year}`;
            }

            // Baris 3: Hari, tgl bln thn HIJRIYAH (Standar LF PBNU)
            if (subtitleEl) {
                subtitleEl.innerText = `${hari} ${pasaran}, ${info.hijri.day} ${info.hijri.monthName} ${info.hijri.year} H`;
            }
        }

        window.renderCalendar = renderCalendar;
        window.changeCalMonth = changeCalMonth;
        window.selectCalDate = selectCalDate;
        window.getHijriDate = getHijriDate;
        window.getPasaranJawa = getPasaranJawa;
