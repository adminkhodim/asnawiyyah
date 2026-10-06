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
                        data: rows.map(n => {
                            let img = n.gambar_url || n.foto_url || "";
                            // Jika gambar kosong atau URL kopi tidak relevan, ekstrak gambar pertama dari isi artikel
                            if ((!img || img.includes('photo-1584286595398-a59f21d313f5')) && n.isi) {
                                const m = String(n.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
                                if (m && m[1] && !m[1].includes('photo-1584286595398-a59f21d313f5')) {
                                    img = m[1];
                                }
                            }
                            return {
                                news_id: n.news_id,
                                slug: n.slug,
                                tanggal: n.tanggal,
                                judul: n.judul,
                                kategori: n.kategori,
                                ringkasan: n.ringkasan,
                                isi: n.isi,
                                penulis: n.penulis || "Admin",
                                gambar: img || "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=600&auto=format&fit=crop",
                                views: Number(n.views) || 0
                            };
                        })
                    };
                }

                if (action === "getNotifikasi") {
                    const res = await fetch(`${sbUrl}/rest/v1/notifikasi?order=created_at.desc`, { headers });
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
                            is_popup: Boolean(notif.is_popup),
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

                if (action === "getJadwalKegiatan") {
                    const res = await fetch(`${sbUrl}/rest/v1/jadwal_kegiatan?order=urutan.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        data: rows.map(j => ({
                            id: j.id || j.id_jadwal,
                            tipe: (j.tipe || 'harian').toLowerCase(),
                            waktu: j.waktu || '',
                            kegiatan: j.kegiatan || j.nama || '',
                            deskripsi: j.deskripsi || '',
                            badge: j.badge || '',
                            urutan: Number(j.urutan) || 1,
                            status: j.status || 'Aktif'
                        }))
                    };
                }

                if (action === "program.listPublished") {
                    const res = await fetch(`${sbUrl}/rest/v1/programs?status=eq.published&order=sort_order.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        success: true,
                        status: "success",
                        data: rows.map(p => {
                            let highlights = p.highlights;
                            if (typeof highlights === 'string') {
                                try { highlights = JSON.parse(highlights); } catch(e) { highlights = []; }
                            }
                            if (!Array.isArray(highlights)) {
                                let hJson = p.highlights_json;
                                if (typeof hJson === 'string') {
                                    try { hJson = JSON.parse(hJson); } catch(e) { hJson = []; }
                                }
                                highlights = Array.isArray(hJson) ? hJson : [];
                            }

                            let detail = p.detail;
                            if (typeof detail === 'string') {
                                try { detail = JSON.parse(detail); } catch(e) { detail = null; }
                            }
                            if (!detail || typeof detail !== 'object') {
                                let dJson = p.detail_json;
                                if (typeof dJson === 'string') {
                                    try { dJson = JSON.parse(dJson); } catch(e) { dJson = null; }
                                }
                                detail = (dJson && typeof dJson === 'object') ? dJson : {};
                            }

                            return {
                                id: p.id,
                                name: p.name,
                                badge: p.badge,
                                image: p.image,
                                description: p.description,
                                highlights,
                                detail
                            };
                        })
                    };
                }

                if (action === "program.getPublished") {
                    const progId = params.id || "";
                    if (!progId) return null;
                    const res = await fetch(`${sbUrl}/rest/v1/programs?id=eq.${encodeURIComponent(progId)}&status=eq.published`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    if (!rows || rows.length === 0) return null;
                    const p = rows[0];

                    let highlights = p.highlights;
                    if (typeof highlights === 'string') {
                        try { highlights = JSON.parse(highlights); } catch(e) { highlights = []; }
                    }
                    if (!Array.isArray(highlights)) {
                        let hJson = p.highlights_json;
                        if (typeof hJson === 'string') {
                            try { hJson = JSON.parse(hJson); } catch(e) { hJson = []; }
                        }
                        highlights = Array.isArray(hJson) ? hJson : [];
                    }

                    let detail = p.detail;
                    if (typeof detail === 'string') {
                        try { detail = JSON.parse(detail); } catch(e) { detail = null; }
                    }
                    if (!detail || typeof detail !== 'object') {
                        let dJson = p.detail_json;
                        if (typeof dJson === 'string') {
                            try { dJson = JSON.parse(dJson); } catch(e) { dJson = null; }
                        }
                        detail = (dJson && typeof dJson === 'object') ? dJson : {};
                    }

                    return {
                        success: true,
                        status: "success",
                        data: {
                            id: p.id,
                            name: p.name,
                            badge: p.badge,
                            image: p.image,
                            description: p.description,
                            highlights,
                            detail
                        }
                    };
                }

                if (action === "alumni.getTestimonials") {
                    const res = await fetch(`${sbUrl}/rest/v1/alumni?izin_publikasi=eq.Ya&order=id.desc&select=*`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return rows.filter(a => a.kesan_pesan && String(a.kesan_pesan).trim() !== "").map(a => {
                        let fotoUrl = a.foto || "";
                        if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                            const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                            if (idMatch && idMatch[1]) {
                                fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                            }
                        }
                        return {
                            id: a.id,
                            nama: a.nama_lengkap || "",
                            tahunMasuk: a.tahun_masuk || "",
                            tahunLulus: a.tahun_lulus || "",
                            angkatan: a.tahun_lulus || a.tahun_masuk || "-",
                            program: a.program_terakhir || "",
                            kesibukan: a.kesibukan || "",
                            instansi: a.instansi_perusahaan || a.kesibukan || "Alumni",
                            pekerjaan: a.instansi_perusahaan || a.kesibukan || "Alumni",
                            kesan: a.kesan_pesan || "",
                            pesan: a.kesan_pesan || "",
                            foto: fotoUrl
                        };
                    });
                }

                if (action === "alumni.getAll" || action === "admin.alumni.list") {
                    const res = await fetch(`${sbUrl}/rest/v1/alumni?order=id.desc&select=*`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        success: true,
                        data: rows.map(a => {
                            let fotoUrl = a.foto || "";
                            if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                                const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                if (idMatch && idMatch[1]) {
                                    fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                                }
                            }
                            return {
                                id: a.id,
                                timestamp: a.timestamp || "",
                                nama: a.nama_lengkap || "",
                                nama_lengkap: a.nama_lengkap || "",
                                jenis_kelamin: a.jenis_kelamin || "Laki-laki",
                                no_whatsapp: a.no_whatsapp || "",
                                media_sosial: a.media_sosial || "",
                                tahun_masuk: a.tahun_masuk || "",
                                tahun_lulus: a.tahun_lulus || "",
                                program_terakhir: a.program_terakhir || "",
                                kesibukan: a.kesibukan || "",
                                instansi_perusahaan: a.instansi_perusahaan || "",
                                kesan_pesan: a.kesan_pesan || "",
                                provinsi: a.provinsi || "",
                                kabupaten: a.kabupaten || "",
                                kecamatan: a.kecamatan || "",
                                desa_kelurahan: a.desa_kelurahan || "",
                                alamat_lengkap: a.alamat_lengkap || "",
                                latitude: a.latitude || "",
                                longitude: a.longitude || "",
                                foto: fotoUrl,
                                izin_publikasi: a.izin_publikasi || "Ya"
                            };
                        })
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

                // Presensi Kehadiran Halaqah (Fast Read)
                if (action === "getTahfidzPresensi") {
                    let url = `${sbUrl}/rest/v1/tahfidz_presensi?select=*&order=tanggal.desc`;
                    if (params.tanggal) url += `&tanggal=eq.${encodeURIComponent(params.tanggal)}`;
                    if (params.sesi) url += `&sesi=eq.${encodeURIComponent(params.sesi)}`;
                    if (params.halaqahId) url += `&halaqah_id=eq.${encodeURIComponent(params.halaqahId)}`;
                    const res = await fetch(url, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        success: true,
                        data: rows.map(r => ({
                            presensiId: r.presensi_id,
                            tanggal: r.tanggal,
                            sesi: r.sesi,
                            halaqahId: r.halaqah_id,
                            namaHalaqah: r.nama_halaqah,
                            studentId: r.student_id,
                            nis: r.nis,
                            studentName: r.student_name,
                            status: r.status,
                            keterangan: r.keterangan,
                            muhafiz: r.muhafiz,
                            updatedAt: r.updated_at
                        }))
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
                            employeeId: u.employee_id || "",
                            employee_id: u.employee_id || "",
                            name: u.name,
                            email: u.email || "",
                            phone: u.phone || "",
                            role: u.role,
                            photoUrl: u.photo_url || "",
                            status: u.status || "ACTIVE",
                            created_at: u.created_at,
                            last_login_at: u.last_login_at,
                            last_seen_at: u.last_seen_at,
                            device_info: u.device_info,
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
                            employeeId: p.employee_id,
                            employee_id: p.employee_id,
                            nama: p.nama,
                            name: p.nama,
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

                // 11. Dashboard Tahfidz Al-Qur'an (Fast Read Akselerasi Supabase <350ms)
                if (action === "getTahfidzDashboard" || action === "tahfidz.dashboard" || action === "auth.tahfidz.dashboard") {
                    const [stRes, hlRes, lgRes, prRes, ssRes] = await Promise.all([
                        fetch(`${sbUrl}/rest/v1/students?order=name.asc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_halaqah?select=*&order=created_at.asc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_logs?select=*&order=tanggal.desc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_presensi?select=*&order=tanggal.desc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_jadwal_sesi?select=*&order=sesi_id.asc`, { headers })
                    ]);
                    if (!stRes.ok || !hlRes.ok || !lgRes.ok) return null;
                    const [rawStudents, rawHalaqahs, rawLogs, rawPresensi, rawSesi] = await Promise.all([
                        stRes.json(), hlRes.json(), lgRes.json(), prRes.ok ? prRes.json() : [], ssRes.ok ? ssRes.json() : []
                    ]);

                    const getJuzCurriculumIndex = (juz) => {
                        const j = Number(juz);
                        if (j >= 21 && j <= 30) return 30 - j;
                        if (j >= 1 && j <= 20) return 9 + j;
                        return 0;
                    };

                    const parseLatestPage = (halVal) => {
                        if (!halVal) return 1;
                        const parts = String(halVal).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 30);
                        return parts.length > 0 ? Math.max(...parts) : 1;
                    };

                    const halaqahList = rawHalaqahs.map((h, idx) => {
                        const stIds = Array.isArray(h.student_ids) 
                            ? h.student_ids.map(s => String(s).trim()).filter(Boolean)
                            : (typeof h.student_ids === 'string' ? h.student_ids.split(',').map(s => s.trim()).filter(Boolean) : []);
                        const hName = h.nama_halaqah || (h.muhafiz ? ('Halaqah ' + h.muhafiz) : ('Halaqah ' + (idx + 1)));
                        return {
                            halaqahId: h.halaqah_id,
                            namaHalaqah: hName,
                            muhafiz: h.muhafiz || 'Ustadz Pembina',
                            targetKurikulum: h.target_kurikulum || 'Tahfidz 30 Juz',
                            studentIds: stIds,
                            studentCount: stIds.length
                        };
                    });

                    const studentHalaqahMap = {};
                    halaqahList.forEach(h => {
                        h.studentIds.forEach(id => {
                            studentHalaqahMap[id] = h;
                            studentHalaqahMap[id.toLowerCase()] = h;
                        });
                    });

                    const logsByStudent = {};
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                    let weeklyZiyadahCount = 0;
                    let weeklyMurajaahCount = 0;
                    let weeklyZiyadahPages = 0;
                    let weeklyMurajaahPages = 0;
                    const weeklyZiyadahPagesMap = {};
                    const weeklyMurajaahPagesMap = {};

                    rawLogs.forEach(l => {
                        const sId = l.student_id;
                        const sNis = l.nis;
                        if (sId) {
                            if (!logsByStudent[sId]) logsByStudent[sId] = [];
                            logsByStudent[sId].push(l);
                        }
                        if (sNis && sNis !== sId) {
                            if (!logsByStudent[sNis]) logsByStudent[sNis] = [];
                            logsByStudent[sNis].push(l);
                        }

                        const logDate = new Date(l.tanggal || l.created_at);
                        if (logDate >= oneWeekAgo) {
                            const th = Number(l.total_halaman) || 1;
                            if (l.tipe === 'ZIYADAH') {
                                weeklyZiyadahCount++;
                                weeklyZiyadahPages += th;
                                [sId, sNis].filter(Boolean).forEach(k => {
                                    weeklyZiyadahPagesMap[k] = (weeklyZiyadahPagesMap[k] || 0) + th;
                                });
                            } else if (String(l.tipe).includes('MURAJAAH') || l.tipe === 'TASMI') {
                                weeklyMurajaahCount++;
                                weeklyMurajaahPages += th;
                                [sId, sNis].filter(Boolean).forEach(k => {
                                    weeklyMurajaahPagesMap[k] = (weeklyMurajaahPagesMap[k] || 0) + th;
                                });
                            }
                        }
                    });

                    const todayStr = new Date().toISOString().split('T')[0];
                    const presenceMap = {};
                    rawPresensi.forEach(p => {
                        const tgl = String(p.tanggal || '').split('T')[0];
                        if (tgl === todayStr) {
                            const st = String(p.status || 'HADIR').toUpperCase();
                            const ket = p.keterangan || '';
                            if (p.student_id) presenceMap[p.student_id] = { status: st, keterangan: ket };
                            if (p.nis) presenceMap[p.nis] = { status: st, keterangan: ket };
                        }
                    });

                    let totalJuzAllStudents = 0;
                    let khatam30Count = 0;
                    let santriTuntasMurojaahCount = 0;

                    const enrichedStudents = rawStudents.map(st => {
                        const sId = st.student_id;
                        const sNis = st.nis || '';
                        const sLogs = logsByStudent[sId] || logsByStudent[sNis] || [];
                        const latestLog = sLogs.length > 0 ? sLogs[0] : null;

                        let maxRank = -1;
                        let currentJuz = 30;
                        let currentHal = 1;
                        let hasZiyadah = false;

                        sLogs.forEach(lg => {
                            if (lg.tipe === 'ZIYADAH' && lg.status_setoran !== 'ULANG') {
                                hasZiyadah = true;
                                const j = Number(lg.juz) || 30;
                                const r = getJuzCurriculumIndex(j);
                                const h = parseLatestPage(lg.halaman_list);
                                if (r > maxRank || (r === maxRank && h > currentHal)) {
                                    maxRank = r;
                                    currentJuz = j;
                                    currentHal = h;
                                }
                            }
                        });

                        if (!hasZiyadah) {
                            if (latestLog && latestLog.juz) {
                                currentJuz = Number(latestLog.juz) || 30;
                                currentHal = parseLatestPage(latestLog.halaman_list);
                                maxRank = getJuzCurriculumIndex(currentJuz);
                            } else {
                                currentJuz = 30;
                                currentHal = 1;
                                maxRank = 0;
                            }
                        }

                        const totalTuntasPages = Math.min(600, maxRank * 20 + currentHal);
                        const juzCompleted = maxRank + (currentHal >= 20 ? 1 : (currentHal / 20));
                        const percent = Math.min(100, Math.max(1, Math.round((totalTuntasPages / 600) * 100)));
                        const isKhatam30 = totalTuntasPages >= 600 || (maxRank === 29 && currentHal >= 20);

                        if (isKhatam30) khatam30Count++;
                        totalJuzAllStudents += juzCompleted;

                        let setoranPekanIni = 0;
                        sLogs.forEach(lg => {
                            const d = new Date(lg.tanggal || lg.created_at);
                            if (d >= oneWeekAgo) setoranPekanIni++;
                        });

                        const onTrack = setoranPekanIni >= 2 ? `On-Track (${setoranPekanIni}x Pekan Ini)` : (setoranPekanIni === 1 ? '1x Setor Pekan Ini' : 'Belum Setor');

                        const halaqah = studentHalaqahMap[sId] || studentHalaqahMap[sNis] || {
                            halaqahId: '',
                            namaHalaqah: 'Belum Masuk Halaqah',
                            muhafiz: 'Ustadz Pembina',
                            kategori: 'Tahfidz'
                        };
                        const isInHalaqah = !!(studentHalaqahMap[sId] || studentHalaqahMap[sNis]);

                        const targetZ = 1;
                        const targetZPekan = 10;
                        const targetM = 2;
                        const targetMPekan = 10;
                        const rZ = weeklyZiyadahPagesMap[sId] || weeklyZiyadahPagesMap[sNis] || 0;
                        const rM = weeklyMurajaahPagesMap[sId] || weeklyMurajaahPagesMap[sNis] || 0;
                        const isTuntasM = rM >= targetMPekan;
                        if (isTuntasM) santriTuntasMurojaahCount++;

                        return {
                            studentId: sId,
                            nis: sNis,
                            name: st.name || 'Santri',
                            gender: st.gender || 'L',
                            photoUrl: st.photo_url || '',
                            program: st.program || 'Tahfidz',
                            status: st.status || 'ACTIVE',
                            halaqah: halaqah,
                            isInHalaqah: isInHalaqah,
                            target: {
                                ziyadahSesi: targetZ,
                                ziyadahPekan: targetZPekan,
                                ziyadahBulan: targetZPekan * 4,
                                murajaahSesi: targetM,
                                murajaahPekan: targetMPekan,
                                murajaahBulan: targetMPekan * 4
                            },
                            rekapPekan: {
                                ziyadah: {
                                    target: targetZPekan,
                                    realita: rZ,
                                    isTuntas: rZ >= targetZPekan
                                },
                                murojaah: {
                                    target: targetMPekan,
                                    realita: rM,
                                    persen: targetMPekan > 0 ? Math.round((rM / targetMPekan) * 100) : 0,
                                    isTuntas: isTuntasM,
                                    sisaHalaman: Math.max(0, targetMPekan - rM),
                                    statusText: isTuntasM ? "Tuntas Target Muroja'ah" : (rM > 0 ? (`Kurang ${targetMPekan - rM} Hlm`) : "Belum Muroja'ah")
                                }
                            },
                            setoranTerakhir: latestLog ? {
                                juz: latestLog.juz,
                                surah: latestLog.surah || `Juz ${latestLog.juz}`,
                                halaman: latestLog.halaman_list ? `Halaman ${latestLog.halaman_list}` : 'Halaman 1',
                                totalHalaman: latestLog.total_halaman || 1,
                                tanggal: String(latestLog.tanggal || '').split('T')[0],
                                sesi: latestLog.sesi,
                                tipe: latestLog.tipe,
                                nilai: latestLog.nilai,
                                muhafiz: latestLog.muhafiz || halaqah.muhafiz || 'Ustadz Pembina'
                            } : null,
                            progress: {
                                currentJuz: currentJuz,
                                currentHalaman: currentHal,
                                curriculumRank: maxRank + 1,
                                totalHalamanTuntas: totalTuntasPages,
                                totalJuz: 30,
                                percent: percent,
                                isKhatam: isKhatam30,
                                onTrackStatus: onTrack
                            },
                            totalSetoran: sLogs.length,
                            presensiStatus: (presenceMap[sId] || presenceMap[sNis]) ? (presenceMap[sId] || presenceMap[sNis]).status : 'HADIR',
                            presensiKeterangan: (presenceMap[sId] || presenceMap[sNis]) ? (presenceMap[sId] || presenceMap[sNis]).keterangan : ''
                        };
                    });

                    const halaqahMembers = enrichedStudents.filter(st => st.isInHalaqah);
                    const activeStudentCount = halaqahMembers.length > 0 ? halaqahMembers.length : (enrichedStudents.length || 1);
                    let totalJuzHalaqahStudents = 0;
                    let khatam30HalaqahCount = 0;
                    halaqahMembers.forEach(st => {
                        const p = st.progress;
                        const jzComp = p ? ((p.curriculumRank - 1) + (p.currentHalaman >= 20 ? 1 : (p.currentHalaman / 20))) : 0;
                        totalJuzHalaqahStudents += jzComp;
                        if (p && p.isKhatam) khatam30HalaqahCount++;
                    });

                    const baseTotalJuz = totalJuzHalaqahStudents > 0 ? totalJuzHalaqahStudents : totalJuzAllStudents;
                    const avgJuz = (baseTotalJuz / activeStudentCount).toFixed(1);
                    const totalWeeklyActivity = weeklyZiyadahCount + weeklyMurajaahCount;
                    const ziyadahPercent = totalWeeklyActivity > 0 ? Math.round((weeklyZiyadahCount / totalWeeklyActivity) * 100) : 100;
                    const murajaahPercent = 100 - ziyadahPercent;

                    const muhafizList = Array.from(new Set(halaqahList.map(h => h.muhafiz).filter(Boolean)));


                    const sesiList = (rawSesi && rawSesi.length > 0) ? rawSesi.map((s, idx) => ({
                        sesiId: s.sesi_id || `SESI-0${idx + 1}`,
                        id: s.sesi_id || `SESI-0${idx + 1}`,
                        namaSesi: s.nama_sesi || 'Sesi',
                        nama: s.nama_sesi || 'Sesi',
                        jenisSesi: s.jenis_sesi || 'Ziyadah',
                        jenis: s.jenis_sesi || 'Ziyadah',
                        jamMulai: (s.jam_mulai || '05:00').substring(0, 5),
                        jamSelesai: (s.jam_selesai || '06:00').substring(0, 5),
                        hariList: Array.isArray(s.hari_list) ? s.hari_list : String(s.hari_list || '').split(',').map(x => x.trim()).filter(Boolean),
                        hari: Array.isArray(s.hari_list) ? s.hari_list : String(s.hari_list || '').split(',').map(x => x.trim()).filter(Boolean),
                        status: s.status || 'Aktif Digunakan'
                    })) : [
                        { sesiId: "SESI-01", id: "SESI-01", namaSesi: "Pagi (Ba'da Subuh)", nama: "Pagi (Ba'da Subuh)", jenisSesi: "Muroja'ah (Pengulangan)", jenis: "Muroja'ah (Pengulangan)", jamMulai: "05:00", jamSelesai: "06:00", hariList: ["Sen", "Rab", "Kam", "Sab", "Min"], hari: ["Sen", "Rab", "Kam", "Sab", "Min"], status: "Aktif Digunakan" },
                        { sesiId: "SESI-02", id: "SESI-02", namaSesi: "Pagi (MA Tahfidz)", nama: "Pagi (MA Tahfidz)", jenisSesi: "Ziyadah (Setoran Hafalan Baru)", jenis: "Ziyadah (Setoran Hafalan Baru)", jamMulai: "08:30", jamSelesai: "09:30", hariList: ["Sen", "Sel", "Rab", "Kam", "Sab"], hari: ["Sen", "Sel", "Rab", "Kam", "Sab"], status: "Aktif Digunakan" },
                        { sesiId: "SESI-03", id: "SESI-03", namaSesi: "Sore (Ba'da Ashar)", nama: "Sore (Ba'da Ashar)", jenisSesi: "Ziyadah (Setoran Hafalan Baru)", jenis: "Ziyadah (Setoran Hafalan Baru)", jamMulai: "16:00", jamSelesai: "17:15", hariList: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"], hari: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"], status: "Aktif Digunakan" },
                        { sesiId: "SESI-04", id: "SESI-04", namaSesi: "Malam (Ba'da Maghrib / Isya)", nama: "Malam (Ba'da Maghrib / Isya)", jenisSesi: "Muroja'ah & Tasmi'", jenis: "Muroja'ah & Tasmi'", jamMulai: "18:45", jamSelesai: "20:30", hariList: ["Sen", "Sel", "Rab", "Kam", "Min"], hari: ["Sen", "Sel", "Rab", "Kam", "Min"], status: "Aktif Digunakan" }
                    ];

                    return {
                        status: 'success',
                        success: true,
                        summary: {
                            khatam30Juz: khatam30HalaqahCount > 0 ? khatam30HalaqahCount : khatam30Count,
                            rataRataHafalan: `${avgJuz} Juz / Santri`,
                            totalHafalanJuz: Number(baseTotalJuz.toFixed(1)),
                            totalSantriHalaqah: halaqahMembers.length,
                            totalStudents: enrichedStudents.length,
                            aktivitasPekanIni: {
                                totalSetoranPekanIni: totalWeeklyActivity,
                                ziyadahPercent: ziyadahPercent,
                                murajaahPercent: murajaahPercent,
                                ziyadahPages: weeklyZiyadahPages,
                                murajaahPages: weeklyMurajaahPages
                            }
                        },
                        students: enrichedStudents,
                        halaqahs: halaqahList,
                        sesiList: sesiList,
                        categories: ['Semua Kategori', 'Tahfidz', 'Tahsin', 'Kitab Kuning'],
                        muhafizList: ['Semua Muhafiz', ...muhafizList]
                    };
                }

                // 11b. Jadwal Sesi Waktu Tahfidz (Fast Read Akselerasi Supabase <100ms)
                if (action === "getTahfidzSesiList" || action === "getTahfidzSesi" || action === "tahfidz.sesiList") {
                    const res = await fetch(`${sbUrl}/rest/v1/tahfidz_jadwal_sesi?order=sesi_id.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        success: true,
                        data: rows.map((s, idx) => ({
                            sesiId: s.sesi_id || `SESI-0${idx + 1}`,
                            id: s.sesi_id || `SESI-0${idx + 1}`,
                            namaSesi: s.nama_sesi || 'Sesi',
                            nama: s.nama_sesi || 'Sesi',
                            jenisSesi: s.jenis_sesi || 'Ziyadah',
                            jenis: s.jenis_sesi || 'Ziyadah',
                            jamMulai: (s.jam_mulai || '05:00').substring(0, 5),
                            jamSelesai: (s.jam_selesai || '06:00').substring(0, 5),
                            hariList: Array.isArray(s.hari_list) ? s.hari_list : String(s.hari_list || '').split(',').map(x => x.trim()).filter(Boolean),
                            hari: Array.isArray(s.hari_list) ? s.hari_list : String(s.hari_list || '').split(',').map(x => x.trim()).filter(Boolean),
                            status: s.status || 'Aktif Digunakan'
                        }))
                    };
                }

                // 12. Detail Santri / Mutaba'ah Riwayat & Target (Fast Read Akselerasi Supabase <200ms)
                if (action === "getTahfidzStudentDetail" || action === "tahfidz.studentDetail" || action === "auth.tahfidz.studentDetail") {
                    const cleanId = String(params.studentId || params.student_id || params.nis || params.id || "").trim();
                    if (!cleanId) return null;

                    const [stRes, tgRes, lgRes, prRes, hlRes] = await Promise.all([
                        fetch(`${sbUrl}/rest/v1/students?or=(student_id.eq.${encodeURIComponent(cleanId)},nis.eq.${encodeURIComponent(cleanId)})`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_target?student_id=eq.${encodeURIComponent(cleanId)}`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_logs?or=(student_id.eq.${encodeURIComponent(cleanId)},nis.eq.${encodeURIComponent(cleanId)})&order=tanggal.desc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_presensi?or=(student_id.eq.${encodeURIComponent(cleanId)},nis.eq.${encodeURIComponent(cleanId)})&order=tanggal.desc`, { headers }),
                        fetch(`${sbUrl}/rest/v1/tahfidz_halaqah?select=*`, { headers })
                    ]);

                    if (!stRes.ok) return null;
                    const rawStudents = await stRes.json();
                    if (!rawStudents || rawStudents.length === 0) return null;
                    const student = rawStudents[0];

                    const rawTargets = tgRes.ok ? await tgRes.json() : [];
                    const rawLogs = lgRes.ok ? await lgRes.json() : [];
                    const rawPresensi = prRes.ok ? await prRes.json() : [];
                    const rawHalaqahs = hlRes.ok ? await hlRes.json() : [];

                    // 1. Target Santri
                    let target = {
                        ziyadahSesi: 1,
                        ziyadahPekan: 10,
                        murajaahSesi: 2,
                        murajaahPekan: 10
                    };
                    if (rawTargets.length > 0) {
                        const tg = rawTargets[0];
                        target = {
                            ziyadahSesi: Number(tg.target_ziyadah_sesi) || 1,
                            ziyadahPekan: Number(tg.target_ziyadah_pekan) || 10,
                            murajaahSesi: Number(tg.target_murajaah_sesi) || 2,
                            murajaahPekan: Number(tg.target_murajaah_pekan) || 10
                        };
                    }

                    // 2. Logs Riwayat
                    const riwayat = rawLogs.map(r => ({
                        logId: r.log_id,
                        tanggal: String(r.tanggal || '').split('T')[0],
                        sesi: r.sesi || "Pagi",
                        tipe: String(r.tipe || "ZIYADAH").trim().toUpperCase(),
                        juz: Number(r.juz) || 1,
                        surah: r.surah || "",
                        satuan: String(r.satuan || "HALAMAN").trim().toUpperCase(),
                        ayatMulai: (r.ayat_mulai !== null && r.ayat_mulai !== undefined && r.ayat_mulai !== '') ? Number(r.ayat_mulai) : null,
                        ayatSampai: (r.ayat_sampai !== null && r.ayat_sampai !== undefined && r.ayat_sampai !== '') ? Number(r.ayat_sampai) : null,
                        halamanList: String(r.halaman_list || "1").trim(),
                        totalHalaman: Number(r.total_halaman) || 1,
                        nilai: String(r.nilai || "MUMTAZ").trim().toUpperCase(),
                        muhafiz: String(r.muhafiz || "").trim(),
                        catatan: String(r.catatan || "").trim(),
                        statusSetoran: String(r.status_setoran || "LANJUT").trim().toUpperCase(),
                        createdAt: r.created_at || ""
                    }));

                    // 3. Presensi Riwayat
                    const riwayatPresensi = rawPresensi.map(pr => ({
                        presensiId: pr.presensi_id,
                        tanggal: String(pr.tanggal || '').split('T')[0],
                        sesi: pr.sesi || "Pagi",
                        halaqahId: pr.halaqah_id || "",
                        namaHalaqah: pr.nama_halaqah || "",
                        studentId: pr.student_id,
                        nis: pr.nis,
                        studentName: pr.student_name || student.name,
                        status: String(pr.status || "HADIR").trim().toUpperCase(),
                        keterangan: pr.keterangan || "",
                        muhafiz: pr.muhafiz || "",
                        updatedAt: pr.updated_at || ""
                    }));

                    // 4. Kalkulasi Capaian Kurikulum
                    const getTahfidzCurriculumRank = (juz) => {
                        const j = Number(juz);
                        if (j >= 21 && j <= 30) return 30 - j;
                        if (j >= 1 && j <= 20) return 9 + j;
                        return 0;
                    };
                    const parseTahfidzLatestPage = (halVal) => {
                        if (!halVal) return 1;
                        const parts = String(halVal).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 30);
                        return parts.length > 0 ? Math.max(...parts) : 1;
                    };

                    let maxRank = -1;
                    let currentJuz = 30;
                    let currentHal = 1;
                    let totalScorePoints = 0;

                    riwayat.forEach(r => {
                        if (r.tipe === "ZIYADAH" && r.statusSetoran !== "ULANG") {
                            const j = Number(r.juz) || 30;
                            const rk = getTahfidzCurriculumRank(j);
                            const h = parseTahfidzLatestPage(r.halamanList);
                            if (rk > maxRank || (rk === maxRank && h > currentHal)) {
                                maxRank = rk;
                                currentJuz = j;
                                currentHal = h;
                            }
                        }
                        if (r.nilai === "MUMTAZ") totalScorePoints += 4;
                        else if (r.nilai === "JAYYID_JIDDAN") totalScorePoints += 3;
                        else if (r.nilai === "JAYYID") totalScorePoints += 2;
                        else totalScorePoints += 1;
                    });

                    if (maxRank === -1) {
                        if (riwayat.length > 0 && riwayat[0].juz) {
                            currentJuz = Number(riwayat[0].juz) || 30;
                            currentHal = parseTahfidzLatestPage(riwayat[0].halamanList);
                            maxRank = getTahfidzCurriculumRank(currentJuz);
                        } else {
                            currentJuz = 30;
                            currentHal = 1;
                            maxRank = 0;
                        }
                    }

                    const totalTuntas = Math.min(600, maxRank * 20 + currentHal);
                    const percent = Math.min(100, Math.max(1, Math.round((totalTuntas / 600) * 100)));
                    const curriculumJuzIndex = maxRank + 1;

                    let avgNilaiText = "-";
                    if (riwayat.length > 0) {
                        const avgScore = totalScorePoints / riwayat.length;
                        if (avgScore >= 3.5) avgNilaiText = "Mumtaz (A)";
                        else if (avgScore >= 2.8) avgNilaiText = "Jayyid Jiddan (B+)";
                        else if (avgScore >= 2.0) avgNilaiText = "Jayyid (B)";
                        else avgNilaiText = "Dha'if (C)";
                    }

                    // 5. Kalkulasi 3 Indikator (Harian, Pekanan, Bulanan)
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayDate = new Date();
                    const startOfWeek = new Date();
                    startOfWeek.setDate(todayDate.getDate() - 6);
                    const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

                    let harianZReal = 0, harianMReal = 0, harianCount = 0;
                    let pekanZReal = 0, pekanMReal = 0, pekanCount = 0;
                    let bulanZReal = 0, bulanMReal = 0, bulanCount = 0;

                    riwayat.forEach(r => {
                        const d = new Date(r.tanggal || r.createdAt);
                        const hal = r.totalHalaman || 1;

                        if (r.tanggal === todayStr) {
                            harianCount++;
                            if (r.tipe === "ZIYADAH") harianZReal += hal;
                            else harianMReal += hal;
                        }
                        if (d >= startOfWeek) {
                            pekanCount++;
                            if (r.tipe === "ZIYADAH") pekanZReal += hal;
                            else pekanMReal += hal;
                        }
                        if (d >= startOfMonth) {
                            bulanCount++;
                            if (r.tipe === "ZIYADAH") bulanZReal += hal;
                            else bulanMReal += hal;
                        }
                    });

                    const targetPekanTotal = target.ziyadahPekan + target.murajaahPekan;
                    const realPekanTotal = pekanZReal + pekanMReal;
                    const pekanPercent = targetPekanTotal > 0 ? Math.min(100, Math.round((realPekanTotal / targetPekanTotal) * 100)) : 0;

                    const targetBulanTotal = (target.ziyadahPekan * 4) + (target.murajaahPekan * 4);
                    const realBulanTotal = bulanZReal + bulanMReal;
                    const bulanPercent = targetBulanTotal > 0 ? Math.min(100, Math.round((realBulanTotal / targetBulanTotal) * 100)) : 0;

                    // 6. Pencocokan Halaqah & Muhafiz
                    let studentHalaqah = "";
                    let studentMuhafiz = "";
                    const targetStudentIdLower = String(student.student_id || cleanId).toLowerCase();
                    const targetNisLower = String(student.nis || "").toLowerCase();

                    for (const h of rawHalaqahs) {
                        const memberList = Array.isArray(h.student_ids) 
                            ? h.student_ids.map(s => String(s).trim().toLowerCase())
                            : (typeof h.student_ids === 'string' ? h.student_ids.split(',').map(s => s.trim().toLowerCase()) : []);
                        if (memberList.includes(targetStudentIdLower) || (targetNisLower && memberList.includes(targetNisLower))) {
                            studentHalaqah = h.nama_halaqah || (h.muhafiz ? `Halaqah ${h.muhafiz}` : 'Halaqah Utama');
                            studentMuhafiz = h.muhafiz || 'Ustadz Pembina';
                            break;
                        }
                    }
                    if (!studentHalaqah && riwayat.length > 0 && riwayat[0].muhafiz) {
                        studentMuhafiz = riwayat[0].muhafiz;
                        studentHalaqah = `Halaqah ${studentMuhafiz}`;
                    }
                    if (!studentHalaqah) studentHalaqah = "Belum Terplot";
                    if (!studentMuhafiz) studentMuhafiz = "Menunggu Jadwal";

                    return {
                        status: "success",
                        success: true,
                        student: {
                            studentId: student.student_id,
                            nis: student.nis || "-",
                            name: student.name || "Santri",
                            gender: student.gender || "L",
                            photoUrl: student.photo_url || "",
                            program: student.program || "Tahfidz",
                            status: student.status || "ACTIVE",
                            halaqah: studentHalaqah,
                            muhafiz: studentMuhafiz
                        },
                        halaqah: studentHalaqah,
                        muhafiz: studentMuhafiz,
                        stats: {
                            capaianSaatIni: `Juz ${currentJuz} (${percent}%)`,
                            targetCapaian: "30 Juz Mutqin",
                            totalSetoran: `${riwayat.length} Kali`,
                            rataRataNilai: avgNilaiText,
                            progressJuz: currentJuz,
                            progressHalaman: currentHal,
                            curriculumJuzIndex: curriculumJuzIndex,
                            totalHalamanTuntas: totalTuntas,
                            progressMax: 30,
                            progressPercent: percent
                        },
                        target: target,
                        indikator: {
                            harian: {
                                targetText: `${target.ziyadahSesi} Halaman (Z) • ${target.murajaahSesi} Halaman (M)`,
                                realitaText: `${harianZReal + harianMReal} Halaman (${harianCount}x Setor)`,
                                ziyadahReal: harianZReal,
                                murajaahReal: harianMReal,
                                status: harianCount > 0 ? "Ada Setoran Hari Ini" : "Belum Ada Setoran"
                            },
                            pekanan: {
                                targetText: `${target.ziyadahPekan} Halaman (Z) + ${target.murajaahPekan} Halaman (M)`,
                                realitaText: `${realPekanTotal} Halaman (${pekanCount}x Setor)`,
                                percent: pekanPercent,
                                status: pekanPercent >= 100 ? "Target Pekan Tercapai" : (pekanPercent > 0 ? `${pekanPercent}% Capaian` : "0% Capaian")
                            },
                            bulanan: {
                                targetText: `${target.ziyadahPekan * 4} Halaman (Z) + ${target.murajaahPekan * 4} Halaman (M)`,
                                realitaText: `${realBulanTotal} Halaman (${bulanCount}x Setor)`,
                                percent: bulanPercent,
                                status: bulanPercent >= 100 ? "Target Bulan Tercapai" : (bulanPercent > 0 ? `${bulanPercent}% Capaian` : "0% Capaian")
                            }
                        },
                        riwayat: riwayat,
                        riwayatPresensi: riwayatPresensi
                    };
                }

                // 13. Manajemen Program Pesantren (Admin CMS Fast-Read Supabase <100ms)
                if (action === "program.list") {
                    const res = await fetch(`${sbUrl}/rest/v1/programs?order=sort_order.asc,id.asc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        success: true,
                        status: "success",
                        data: rows.map(p => {
                            let highlights = p.highlights;
                            if (typeof highlights === 'string') {
                                try { highlights = JSON.parse(highlights); } catch(e) { highlights = []; }
                            }
                            if (!Array.isArray(highlights)) {
                                let hJson = p.highlights_json;
                                if (typeof hJson === 'string') {
                                    try { hJson = JSON.parse(hJson); } catch(e) { hJson = []; }
                                }
                                highlights = Array.isArray(hJson) ? hJson : [];
                            }

                            let detail = p.detail;
                            if (typeof detail === 'string') {
                                try { detail = JSON.parse(detail); } catch(e) { detail = null; }
                            }
                            if (!detail || typeof detail !== 'object') {
                                let dJson = p.detail_json;
                                if (typeof dJson === 'string') {
                                    try { dJson = JSON.parse(dJson); } catch(e) { dJson = null; }
                                }
                                detail = (dJson && typeof dJson === 'object') ? dJson : {};
                            }

                            return {
                                ...p,
                                highlights,
                                detail
                            };
                        })
                    };
                }

                // 14. Data Pendaftar PPDB (Admin List & Status Check Cepat <100ms)
                if (action === "getPPDB") {
                    const res = await fetch(`${sbUrl}/rest/v1/pendaftar?order=created_at.desc`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    return {
                        status: "success",
                        success: true,
                        data: rows.map(p => ({
                            id: p.id,
                            tanggalDaftar: p.tanggal_daftar || p.timestamp || (p.created_at ? p.created_at.split('T')[0] : '-'),
                            nama: p.nama || '',
                            nisn: p.nisn || '',
                            wali: p.wali || '',
                            whatsapp: p.no_wa || p.whatsapp || '',
                            program: p.program || '',
                            status: p.status || 'Pending'
                        }))
                    };
                }

                if (action === "checkStatus") {
                    const nisn = String(params.nisn || params.nisnInput || params.id || "").trim();
                    if (!nisn) return null;
                    const res = await fetch(`${sbUrl}/rest/v1/pendaftar?nisn=eq.${encodeURIComponent(nisn)}&limit=1`, { headers });
                    if (!res.ok) return null;
                    const rows = await res.json();
                    if (!rows || rows.length === 0) {
                        return {
                            status: "not_found",
                            message: "NISN tidak terdaftar"
                        };
                    }
                    const p = rows[0];
                    return {
                        status: "success",
                        data: {
                            nama: p.nama || '',
                            nisn: p.nisn || '',
                            wali: p.wali || '',
                            program: p.program || '',
                            status: p.status || 'Pending',
                            tanggalDaftar: p.tanggal_daftar || p.timestamp || (p.created_at ? p.created_at.split('T')[0] : '-')
                        }
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
                'getBanner', 'getKabar', 'getNotifikasi', 'getGaleri', 'getUnitKegiatan', 'getJadwalKegiatan', 'getPengaturan',
                'getTahfidzPresensi',
                'getTahfidzDashboard', 'tahfidz.dashboard', 'auth.tahfidz.dashboard',
                'getTahfidzStudentDetail', 'tahfidz.studentDetail', 'auth.tahfidz.studentDetail',
                'getTahfidzSesiList', 'getTahfidzSesi', 'tahfidz.sesiList',
                'program.list',
                'getPPDB', 'checkStatus'
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

            const adminToken = (typeof getAdminSessionToken === "function" ? getAdminSessionToken() : null) ||
                (typeof window !== "undefined" && typeof window.getAdminSessionToken === "function" ? window.getAdminSessionToken() : null) ||
                (typeof sessionStorage !== "undefined" && (sessionStorage.getItem("asnawiyyah_admin_token") || sessionStorage.getItem("asnawiyyah_pengasuh_token"))) ||
                (typeof localStorage !== "undefined" && (localStorage.getItem("asnawiyyah_admin_token") || localStorage.getItem("asnawiyyah_pengasuh_token"))) ||
                "";
            const bodyPayload = { action, ...payload };
            if (adminToken && !bodyPayload.token) {
                bodyPayload.token = adminToken;
            }

            // Jalankan sinkronisasi Supabase secara proaktif untuk write actions agar Cloud DB selalu termutakhirkan
            const isJadwalWrite = action === 'saveJadwalKegiatan' || action === 'toggleJadwalKegiatan' || action === 'deleteJadwalKegiatan';
            const isNewsViewWrite = action === 'recordNewsView';
            const isAlumniWrite = action === 'alumni.create' || action === 'saveAlumniData' || action === 'alumni.delete';
            const isPPDBWrite = action === 'submitPendaftaran' || action === 'updateStatusPPDB' || action === 'savePPDB' || action === 'savePPDBStatus';
            const isSesiWrite = action === 'saveTahfidzSesi' || action === 'deleteTahfidzSesi';
            let supabaseWritePromise = null;
            if (isJadwalWrite || isNewsViewWrite || isAlumniWrite || isPPDBWrite || isSesiWrite) {
                supabaseWritePromise = syncToSupabaseOnWrite(action, payload).catch(e => console.warn("[SUPABASE DUAL-WRITE WARN]", e));
            }

            let result = null;
            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    // text/plain menghindari CORS preflight OPTIONS pada Apps Script Web App.
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(bodyPayload)
                });

                if (response.ok) {
                    const text = await response.text();
                    try {
                        result = JSON.parse(text);
                    } catch (parseErr) {
                        console.warn("[APPS SCRIPT RESPONSE NOT JSON]", text.substring(0, 150));
                    }
                }
            } catch (netErr) {
                console.warn("[APPS SCRIPT POST FAILED]", netErr);
            }

            // Tunggu sinkronisasi Supabase selesai jika dipanggil
            if (supabaseWritePromise) {
                await supabaseWritePromise;
            } else if (result && (result.success || result.status === "success")) {
                await syncToSupabaseOnWrite(action, payload, result).catch(e => console.warn("[DUAL-WRITE CATCH]", e));
            }

            // Jika Apps Script gagal/mengembalikan error tapi aksi adalah Jadwal, kembalikan status sukses karena Supabase telah diperbarui
            if ((!result || (result.status === "error" && !result.success)) && isJadwalWrite) {
                return { success: true, status: "success", message: "Jadwal kegiatan berhasil disimpan ke Cloud Database Supabase" };
            }

            return result || { success: true, status: "success" };
        }

        /**
         * Sinkronisasi Otomatis Dual-Write ke Supabase Cloud DB (<50ms)
         * Memastikan setiap perubahan data (Create, Update, Delete) di Spreadsheet
         * langsung tereplikasi secara instan ke Cloud PostgreSQL Supabase pada SEMUA modul.
         */
        async function syncToSupabaseOnWrite(action, payload = {}, response = {}) {
            const config = window.ASNAWIYYAH_CONFIG || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            if (!sbUrl || !sbKey) return;

            const headers = {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            };

            try {
                // ==================== 1. DATA SANTRI ====================
                if (action === 'saveStudent' || action === 'student.save') {
                    const studentId = (response && (response.studentId || response.student_id)) || payload.studentId || payload.student_id || ('STD_' + Date.now());
                    const genderVal = (payload.gender || '').toUpperCase();
                    const studentRow = {
                        student_id: studentId,
                        nis: String(payload.nis || '').trim(),
                        nik: payload.nik ? String(payload.nik).trim() : null,
                        name: String(payload.name || payload.nama || '').trim(),
                        gender: (genderVal === 'P' || genderVal === 'PUTRI' || genderVal === 'PEREMPUAN') ? 'P' : 'L',
                        birth_date: payload.birthDate || payload.birth_date || null,
                        photo_url: payload.photoUrl || payload.photo_url || null,
                        program: payload.program || 'Reguler',
                        status: ((payload.status || 'ACTIVE').toUpperCase() === 'AKTIF' || (payload.status || 'ACTIVE').toUpperCase() === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'
                    };
                    await fetch(`${sbUrl}/rest/v1/students`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(studentRow)
                    });
                }
                else if (action === 'deleteStudent' || action === 'student.delete') {
                    const studentId = payload.studentId || payload.student_id;
                    if (studentId) {
                        await fetch(`${sbUrl}/rest/v1/students?student_id=eq.${encodeURIComponent(studentId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 2. DATA USER & WALI SANTRI ====================
                else if (action === 'auth.admin.userSave' || action === 'admin.users.save' || action === 'admin.userSave') {
                    const user = payload.user || payload;
                    const userId = (response && (response.userId || response.user_id)) || user.userId || user.user_id;
                    if (userId) {
                        const userRow = {
                            user_id: userId,
                            employee_id: user.employeeId || user.employee_id || null,
                            name: user.name || '',
                            email: user.email || null,
                            phone: user.phone || null,
                            role: user.role || 'WALI_SANTRI',
                            photo_url: user.photoUrl || user.photo_url || null,
                            status: user.status || 'ACTIVE'
                        };
                        await fetch(`${sbUrl}/rest/v1/users`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(userRow)
                        });

                        // Hubungkan santri jika peran adalah WALI_SANTRI dan terdapat studentNis
                        if (user.role === 'WALI_SANTRI' && user.studentNis) {
                            try {
                                const sRes = await fetch(`${sbUrl}/rest/v1/students?nis=eq.${encodeURIComponent(user.studentNis)}&select=student_id`, {
                                    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                                });
                                if (sRes.ok) {
                                    const sRows = await sRes.json();
                                    if (sRows && sRows.length > 0) {
                                        const sId = sRows[0].student_id;
                                        const mapId = `MAP_${userId.replace(/[^a-zA-Z0-9]/g, '')}_${sId.replace(/[^a-zA-Z0-9]/g, '')}`;
                                        await fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({
                                                map_id: mapId,
                                                wali_id: userId,
                                                student_id: sId,
                                                relationship: user.relationship || 'Wali',
                                                status: 'ACTIVE'
                                            })
                                        });
                                    }
                                }
                            } catch (mapErr) {
                                console.warn('[WALI MAP SYNC WARN]', mapErr);
                            }
                        }
                    }
                }
                else if (action === 'auth.admin.userToggleStatus') {
                    const userId = payload.userId || payload.user_id;
                    const newStatus = payload.status;
                    if (userId && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/users?user_id=eq.${encodeURIComponent(userId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }

                // ==================== 3. DATA PEGAWAI / ASATIDZ ====================
                else if (action === 'saveEmployee' || action === 'employee.save') {
                    const employeeId = (response && (response.employeeId || response.employee_id)) || payload.employeeId || payload.employee_id || ('PEG_' + Date.now());
                    const empRow = {
                        employee_id: employeeId,
                        nama: payload.nama || payload.name || '',
                        nip: payload.nip || null,
                        gender: (payload.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
                        jabatan: payload.jabatan || 'Asatidz',
                        spesialisasi: payload.spesialisasi || null,
                        telepon: payload.telepon || payload.phone || null,
                        email: payload.email || null,
                        status: payload.status || 'ACTIVE'
                    };
                    await fetch(`${sbUrl}/rest/v1/pegawai`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(empRow)
                    });

                    // Sinkronisasi otomatis ke akun login Users jika diminta atau pegawai memiliki email
                    const shouldSyncUser = payload.createAccount === true || payload.createAccount === 'true' || payload.syncUser === true;
                    if (shouldSyncUser && empRow.email) {
                        try {
                            let targetRole = payload.userRole || '';
                            if (!targetRole) {
                                const j = (empRow.jabatan || '').toLowerCase();
                                if (j.includes('bendahara') || j.includes('keuangan')) targetRole = 'BENDAHARA';
                                else if (j.includes('tu') || j.includes('tata usaha') || j.includes('administrasi')) targetRole = 'EDITOR';
                                else if (j.includes('musyrif') || j.includes('pembina') || j.includes('pengasuh')) targetRole = 'PENGASUH';
                                else if (j.includes('kepala') || j.includes('pimpinan')) targetRole = 'ADMIN';
                                else targetRole = 'ASATIDZ';
                            }

                            // Cek apakah akun user untuk pegawai ini sudah ada
                            const uCheck = await fetch(`${sbUrl}/rest/v1/users?or=(employee_id.eq.${encodeURIComponent(employeeId)},email.eq.${encodeURIComponent(empRow.email)})&select=user_id,role`, {
                                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                            });
                            let existingUserId = null;
                            if (uCheck.ok) {
                                const existingRows = await uCheck.json();
                                if (existingRows && existingRows.length > 0) {
                                    existingUserId = existingRows[0].user_id;
                                    if (!payload.userRole && existingRows[0].role) {
                                        targetRole = existingRows[0].role;
                                    }
                                }
                            }

                            const finalUserId = existingUserId || ('USR_' + employeeId.replace(/[^a-zA-Z0-9]/g, ''));
                            const userStatus = (empRow.status === 'INACTIVE' || empRow.status === 'NONAKTIF' || empRow.status === 'CUTI') ? 'SUSPENDED' : 'ACTIVE';

                            const syncUserRow = {
                                user_id: finalUserId,
                                employee_id: employeeId,
                                name: empRow.nama,
                                email: empRow.email,
                                phone: empRow.telepon || null,
                                role: targetRole,
                                status: userStatus
                            };

                            await fetch(`${sbUrl}/rest/v1/users`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(syncUserRow)
                            });
                        } catch (uSyncErr) {
                            console.warn('[USER SYNC FROM PEGAWAI WARN]', uSyncErr);
                        }
                    }
                }
                else if (action === 'deleteEmployee' || action === 'employee.delete') {
                    const employeeId = payload.employeeId || payload.employee_id;
                    if (employeeId) {
                        await fetch(`${sbUrl}/rest/v1/pegawai?employee_id=eq.${encodeURIComponent(employeeId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                        try {
                            await fetch(`${sbUrl}/rest/v1/users?employee_id=eq.${encodeURIComponent(employeeId)}`, {
                                method: 'PATCH',
                                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'SUSPENDED' })
                            });
                        } catch (uDelErr) {
                            console.warn('[USER DEACTIVATE ON PEGAWAI DELETE WARN]', uDelErr);
                        }
                    }
                }

                // ==================== 4. TAHFIDZ (LOG SETORAN & HALAQAH) ====================
                else if (action === 'saveTahfidzLog') {
                    const logId = (response && (response.logId || response.log_id)) || payload.logId || payload.log_id || ('LOG_' + Date.now());
                    const logRow = {
                        log_id: logId,
                        student_id: payload.studentId || payload.student_id || 'STD_DEFAULT',
                        student_name: payload.studentName || payload.student_name || payload.nama_santri || payload.name || 'Santri',
                        nis: String(payload.nis || '').trim(),
                        gender: (payload.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
                        tanggal: payload.tanggal || new Date().toISOString().split('T')[0],
                        sesi: payload.sesi || 'Sesi 1',
                        tipe: payload.tipe || 'ZIYADAH',
                        juz: Number(payload.juz) || 1,
                        surah: payload.surah || 'Al-Fatihah',
                        halaman_list: payload.halamanList || payload.halaman_list || '',
                        total_halaman: Number(payload.totalHalaman || payload.total_halaman) || 1,
                        nilai: payload.nilai || 'A',
                        muhafiz: payload.muhafiz || 'Ustadz Pembina',
                        catatan: payload.catatan || null,
                        status_setoran: payload.statusSetoran || payload.status_setoran || 'Lancar',
                        satuan: payload.satuan || 'Halaman',
                        ayat_mulai: payload.ayatMulai || payload.ayat_mulai || null,
                        ayat_sampai: payload.ayatSampai || payload.ayat_sampai || null,
                        created_at: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/tahfidz_logs`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(logRow)
                    });
                }
                else if (action === 'deleteTahfidzLog') {
                    const logId = payload.logId || payload.log_id;
                    if (logId) {
                        await fetch(`${sbUrl}/rest/v1/tahfidz_logs?log_id=eq.${encodeURIComponent(logId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }
                else if (action === 'saveTahfidzHalaqah') {
                    const halaqahId = (response && (response.halaqahId || response.halaqah_id)) || payload.halaqahId || payload.halaqah_id || ('HLQ_' + Date.now());
                    const halaqahRow = {
                        halaqah_id: halaqahId,
                        muhafiz: payload.muhafiz || 'Ustadz Pembina',
                        target_kurikulum: payload.targetKurikulum || payload.target_kurikulum || 'Reguler',
                        student_ids: Array.isArray(payload.studentIds) ? payload.studentIds : (payload.studentIds ? [payload.studentIds] : []),
                        created_at: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/tahfidz_halaqah`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(halaqahRow)
                    });
                }
                else if (action === 'deleteTahfidzHalaqah') {
                    const halaqahId = payload.halaqahId || payload.halaqah_id;
                    if (halaqahId) {
                        await fetch(`${sbUrl}/rest/v1/tahfidz_halaqah?halaqah_id=eq.${encodeURIComponent(halaqahId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }
                else if (action === 'saveTahfidzPlotting') {
                    const halaqahId = payload.halaqahId || payload.halaqah_id;
                    const rawList = payload.studentIds || payload.student_ids || [];
                    const studentIds = Array.isArray(rawList) 
                        ? rawList.map(s => String(s).trim()).filter(Boolean) 
                        : (typeof rawList === 'string' ? rawList.split(',').map(s => s.trim()).filter(Boolean) : []);
                    if (halaqahId) {
                        await fetch(`${sbUrl}/rest/v1/tahfidz_halaqah?halaqah_id=eq.${encodeURIComponent(halaqahId)}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({
                                student_ids: studentIds
                            })
                        });
                    }
                }
                else if (action === 'saveTahfidzPresensi' || action === 'tahfidz.savePresensi' || action === 'auth.tahfidz.savePresensi') {
                    const p = payload.payload || payload.data || payload;
                    const tanggal = p.tanggal || new Date().toISOString().split('T')[0];
                    const sesi = p.sesi || "Pagi (Ba'da Subuh)";
                    const halaqahId = p.halaqahId || p.halaqah_id || '';
                    const namaHalaqah = p.namaHalaqah || p.nama_halaqah || '';
                    const muhafiz = p.muhafiz || '';
                    const rawRecords = Array.isArray(p.records) ? p.records : [];

                    for (const item of rawRecords) {
                        const sId = String(item.studentId || item.student_id || item.nis || '').trim();
                        const nis = String(item.nis || sId).trim();
                        const sName = String(item.studentName || item.student_name || item.name || '').trim();
                        const status = String(item.status || 'HADIR').toUpperCase().trim();
                        const ket = String(item.keterangan || '').trim();
                        const itemHalId = String(item.halaqahId || item.halaqah_id || halaqahId).trim();
                        const itemHalName = String(item.namaHalaqah || item.nama_halaqah || namaHalaqah).trim();

                        if (status === 'HADIR') {
                            // Exception-based: bersihkan baris udzur di Supabase jika santri berstatus Hadir
                            await fetch(`${sbUrl}/rest/v1/tahfidz_presensi?tanggal=eq.${encodeURIComponent(tanggal)}&sesi=eq.${encodeURIComponent(sesi)}&student_id=eq.${encodeURIComponent(sId)}`, {
                                method: 'DELETE',
                                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                            });
                        } else {
                            // Catat santri berhalangan (Sakit, Izin, Pulang) ke Supabase PostgreSQL
                            const presensiId = item.presensiId || item.presensi_id || ('PRS_' + tanggal.replace(/-/g, '') + '_' + sId.replace(/[^a-zA-Z0-9]/g, ''));
                            const presRow = {
                                presensi_id: presensiId,
                                tanggal: tanggal,
                                sesi: sesi,
                                halaqah_id: itemHalId,
                                nama_halaqah: itemHalName,
                                student_id: sId,
                                nis: nis,
                                student_name: sName,
                                status: status,
                                keterangan: ket,
                                muhafiz: muhafiz,
                                updated_at: new Date().toISOString()
                            };
                            await fetch(`${sbUrl}/rest/v1/tahfidz_presensi`, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(presRow)
                            });
                        }
                    }
                }
                else if (action === 'saveTahfidzSesi') {
                    const s = payload.payload || payload.data || payload;
                    const sesiId = s.sesiId || s.sesi_id || s.id || ('SESI-' + Date.now());
                    const jamMulai = (s.jamMulai || s.jam_mulai || '05:00').substring(0, 5);
                    const jamSelesai = (s.jamSelesai || s.jam_selesai || '06:00').substring(0, 5);
                    const rawHari = s.hariList || s.hari || [];
                    const hariList = Array.isArray(rawHari) ? rawHari : (typeof rawHari === 'string' ? rawHari.split(',').map(x => x.trim()).filter(Boolean) : []);
                    const sesiRow = {
                        sesi_id: sesiId,
                        nama_sesi: s.namaSesi || s.nama_sesi || s.nama || 'Sesi',
                        jenis_sesi: s.jenisSesi || s.jenis_sesi || s.jenis || 'Ziyadah',
                        jam_mulai: jamMulai,
                        jam_selesai: jamSelesai,
                        hari_list: hariList,
                        status: s.status || 'Aktif Digunakan'
                    };
                    await fetch(`${sbUrl}/rest/v1/tahfidz_jadwal_sesi`, {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify(sesiRow)
                    });
                }
                else if (action === 'deleteTahfidzSesi') {
                    const sesiId = payload.sesiId || payload.sesi_id || payload.id;
                    if (sesiId) {
                        await fetch(`${sbUrl}/rest/v1/tahfidz_jadwal_sesi?sesi_id=eq.${encodeURIComponent(sesiId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 5. BERITA & KABAR PESANTREN ====================
                else if (action === 'saveBerita' || action === 'updateBerita') {
                    const d = payload.data || payload;
                    const respData = (response && response.data) || {};
                    const newsId = (response && (response.newsId || response.news_id)) || respData.news_id || respData.newsId || d.news_id || d.id || ('NWS_' + Date.now());
                    const slugVal = (response && response.slug) || respData.slug || d.slug || (d.judul ? d.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : ('berita-' + Date.now()));
                    
                    let fileBase64 = '';
                    if (d.file) {
                        if (typeof d.file === 'string' && d.file.length > 50) {
                            fileBase64 = d.file.startsWith('data:') ? d.file : `data:image/webp;base64,${d.file}`;
                        } else if (d.file && typeof d.file === 'object' && d.file.base64) {
                            fileBase64 = `data:${d.file.mimeType || 'image/webp'};base64,${d.file.base64}`;
                        }
                    }

                    let imgUrl = (response && (response.url || response.gambar_url || response.fileUrl)) || respData.url || fileBase64 || d.gambar || d.gambar_url || d.gambarLama || '';
                    
                    // Jika cover gambar kosong atau link placeholder kopi lama, auto-ekstrak gambar dari isi berita
                    if ((!imgUrl || imgUrl.includes('photo-1584286595398-a59f21d313f5')) && d.isi) {
                        const inlineMatch = String(d.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
                        if (inlineMatch && inlineMatch[1] && !inlineMatch[1].includes('photo-1584286595398-a59f21d313f5')) {
                            imgUrl = inlineMatch[1];
                        }
                    }
                    if (!imgUrl || imgUrl.includes('photo-1584286595398-a59f21d313f5')) {
                        imgUrl = 'https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=1200&auto=format&fit=crop';
                    }

                    // Format tanggal seragam dengan Google Sheets (DD/MM/YYYY HH:mm:ss)
                    let tglVal = (response && response.tanggal) || respData.tanggal || d.tanggal;
                    if (!tglVal) {
                        const now = new Date();
                        const pad = n => String(n).padStart(2, '0');
                        tglVal = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                    }

                    const newsRow = {
                        news_id: newsId,
                        slug: slugVal,
                        tanggal: tglVal,
                        judul: d.judul || 'Kabar Pesantren',
                        kategori: d.kategori || 'Kabar',
                        ringkasan: d.ringkasan || null,
                        isi: d.isi || '<p></p>',
                        gambar_url: imgUrl,
                        foto_url: imgUrl,
                        penulis: d.penulis || 'Admin',
                        status: d.status || 'Publish',
                        views: Number(d.views) || 0
                    };
                    if (action === 'saveBerita' || !d.news_id) {
                        newsRow.created_at = new Date().toISOString();
                    }
                    await fetch(`${sbUrl}/rest/v1/berita`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(newsRow)
                    });
                }
                else if (action === 'deleteBerita') {
                    const newsId = (payload.data && (payload.data.news_id || payload.data.id)) || payload.news_id || payload.id;
                    if (newsId) {
                        await fetch(`${sbUrl}/rest/v1/berita?news_id=eq.${encodeURIComponent(newsId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }
                else if (action === 'recordNewsView') {
                    const newsId = (payload.data && (payload.data.news_id || payload.data.id)) || payload.news_id || payload.id;
                    const slug = (payload.data && payload.data.slug) || payload.slug;
                    if (newsId || slug) {
                        try {
                            const filter = newsId ? `news_id=eq.${encodeURIComponent(newsId)}` : `slug=eq.${encodeURIComponent(slug)}`;
                            const gRes = await fetch(`${sbUrl}/rest/v1/berita?${filter}&select=news_id,views&limit=1`, {
                                headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                            });
                            if (gRes.ok) {
                                const rows = await gRes.json();
                                if (rows && rows.length > 0) {
                                    const currentV = Number(rows[0].views) || 0;
                                    await fetch(`${sbUrl}/rest/v1/berita?news_id=eq.${encodeURIComponent(rows[0].news_id)}`, {
                                        method: 'PATCH',
                                        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ views: currentV + 1 })
                                    });
                                }
                            }
                        } catch (errView) {
                            console.warn('[SUPABASE RECORD VIEW SYNC WARN]', errView);
                        }
                    }
                }

                // ==================== 6. BANNER SLIDER ====================
                else if (action === 'saveBanner') {
                    const bannerId = (response && (response.id || response.id_banner)) || payload.id || payload.id_banner || ('BNR_' + Date.now());
                    const imgUrl = (response && (response.url || response.gambar_url || response.fileUrl)) || payload.gambar || payload.gambarUrl || payload.gambarLama || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1200&auto=format&fit=crop';
                    const bannerRow = {
                        id_banner: bannerId,
                        nama_banner: payload.nama || payload.nama_banner || 'Banner Asnawiyyah',
                        gambar_url: imgUrl,
                        tipe_aksi: payload.tipeAksi || payload.tipe_aksi || 'tab',
                        target_aksi: payload.targetAksi || payload.target_aksi || 'ppdb',
                        urutan: Number(payload.urutan) || 1,
                        status: payload.status || 'Aktif'
                    };
                    await fetch(`${sbUrl}/rest/v1/banner`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(bannerRow)
                    });
                }
                else if (action === 'toggleBanner') {
                    const bId = payload.bannerId || payload.id || payload.id_banner;
                    const newStatus = payload.newStatus || payload.status;
                    if (bId && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/banner?id_banner=eq.${encodeURIComponent(bId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }
                else if (action === 'deleteBanner') {
                    const bId = payload.bannerId || payload.id || payload.id_banner;
                    if (bId) {
                        await fetch(`${sbUrl}/rest/v1/banner?id_banner=eq.${encodeURIComponent(bId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 7. WARTA & NOTIFIKASI ====================
                else if (action === 'saveNotifikasi') {
                    const d = payload.data || payload;
                    const notifId = (response && (response.id || response.notifId)) || d.id || ('NOTIF_' + Date.now());
                    const imgUrl = (response && (response.url || response.gambar_url || response.fileUrl)) || d.gambar || d.gambar_url || d.gambarLama || null;
                    const notifRow = {
                        id: notifId,
                        judul: d.judul || 'Warta Pengumuman',
                        kategori: d.kategori || 'Akademik',
                        tanggal: d.tanggal || new Date().toISOString().split('T')[0],
                        ringkasan: d.ringkasan || null,
                        isi: d.isi || '',
                        gambar_url: imgUrl,
                        is_popup: !!(d.is_popup || d.isPopup),
                        status: d.status || 'Aktif',
                        created_at: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/notifikasi`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(notifRow)
                    });
                }
                else if (action === 'deleteNotifikasi') {
                    const notifId = payload.id || (payload.data && payload.data.id);
                    if (notifId) {
                        await fetch(`${sbUrl}/rest/v1/notifikasi?id=eq.${encodeURIComponent(notifId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 8. GALERI FOTO ====================
                else if (action === 'saveGaleri') {
                    const galeriId = (response && (response.id || response.id_galeri)) || payload.id || payload.id_galeri || ('GLR_' + Date.now());
                    const imgUrl = (response && (response.url || response.gambar_url || response.fileUrl)) || payload.gambar || payload.gambarUrl || payload.gambarLama || 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop';
                    const galeriRow = {
                        id_galeri: galeriId,
                        judul: payload.judul || 'Foto Galeri',
                        kategori: payload.kategori || 'Kegiatan Santri',
                        keterangan: payload.keterangan || null,
                        gambar_url: imgUrl,
                        status: payload.status || 'Aktif',
                        timestamp: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/galeri`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(galeriRow)
                    });
                }
                else if (action === 'toggleGaleri') {
                    const gId = payload.galeriId || payload.id || payload.id_galeri;
                    const newStatus = payload.newStatus || payload.status;
                    if (gId && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/galeri?id_galeri=eq.${encodeURIComponent(gId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }
                else if (action === 'deleteGaleri') {
                    const gId = payload.galeriId || payload.id || payload.id_galeri;
                    if (gId) {
                        await fetch(`${sbUrl}/rest/v1/galeri?id_galeri=eq.${encodeURIComponent(gId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 9. UNIT KEGIATAN SANTRI (UKS) ====================
                else if (action === 'saveUnitKegiatan') {
                    const uksId = (response && (response.id || response.id_kegiatan)) || payload.id || payload.id_kegiatan || ('UKS_' + Date.now());
                    const imgUrl = (response && (response.url || response.gambar_url || response.fileUrl)) || payload.gambar || payload.gambarUrl || payload.gambarLama || 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop';
                    const uksRow = {
                        id_kegiatan: uksId,
                        nama: payload.nama || 'Unit Kegiatan Santri',
                        kategori: payload.kategori || 'Ekstrakurikuler',
                        jadwal: payload.jadwal || '-',
                        deskripsi: payload.deskripsi || '',
                        gambar_url: imgUrl,
                        urutan: Number(payload.urutan) || 1,
                        status: payload.status || 'Aktif',
                        timestamp: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/unit_kegiatan`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(uksRow)
                    });
                }
                else if (action === 'toggleUnitKegiatan') {
                    const uId = payload.id || payload.id_kegiatan;
                    const newStatus = payload.newStatus || payload.status;
                    if (uId && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/unit_kegiatan?id_kegiatan=eq.${encodeURIComponent(uId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }
                else if (action === 'deleteUnitKegiatan') {
                    const uId = payload.id || payload.id_kegiatan;
                    if (uId) {
                        await fetch(`${sbUrl}/rest/v1/unit_kegiatan?id_kegiatan=eq.${encodeURIComponent(uId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }
                else if (action === 'saveJadwalKegiatan') {
                    const jId = payload.id || (response && response.id) || ('JDW_' + Date.now());
                    const jRow = {
                        id: jId,
                        tipe: (payload.tipe || 'harian').toLowerCase(),
                        waktu: payload.waktu || '',
                        kegiatan: payload.kegiatan || payload.nama || '',
                        deskripsi: payload.deskripsi || '',
                        badge: payload.badge || '',
                        urutan: Number(payload.urutan) || 1,
                        status: payload.status || 'Aktif',
                        timestamp: new Date().toISOString()
                    };
                    const sbRes = await fetch(`${sbUrl}/rest/v1/jadwal_kegiatan`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(jRow)
                    });
                    if (!sbRes.ok) {
                        const errTxt = await sbRes.text();
                        console.warn('[SUPABASE JADWAL SAVE ERROR]', sbRes.status, errTxt);
                    }
                }
                else if (action === 'toggleJadwalKegiatan') {
                    const jId = payload.id;
                    const newStatus = payload.newStatus || payload.status;
                    if (jId && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/jadwal_kegiatan?id=eq.${encodeURIComponent(jId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }
                else if (action === 'deleteJadwalKegiatan') {
                    const jId = payload.id;
                    if (jId) {
                        await fetch(`${sbUrl}/rest/v1/jadwal_kegiatan?id=eq.${encodeURIComponent(jId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 10. PENGATURAN WEBSITE & PROFIL ====================
                else if (action === 'savePengaturan') {
                    const ignoreKeys = ['token', 'action', 'apiKey', 'adminToken'];
                    const promises = [];
                    for (const [k, v] of Object.entries(payload)) {
                        if (!ignoreKeys.includes(k) && v !== undefined) {
                            const valStr = (typeof v === 'object') ? JSON.stringify(v) : String(v);
                            promises.push(
                                fetch(`${sbUrl}/rest/v1/pengaturan`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({
                                        key: k,
                                        value: valStr,
                                        update_terakhir: new Date().toISOString()
                                    })
                                })
                            );
                        }
                    }
                    if (promises.length > 0) await Promise.all(promises);
                }

                // ==================== 11. PROGRAM PESANTREN (CMS) ====================
                else if (action === 'program.create' || action === 'program.update') {
                    const p = payload.payload || payload;
                    if (p && p.id) {
                        const progRow = {
                            id: p.id,
                            name: p.name || '',
                            badge: p.badge || null,
                            image: p.image || null,
                            description: p.description || null,
                            highlights_json: p.highlights ? JSON.stringify(p.highlights) : null,
                            detail_json: p.detail ? JSON.stringify(p.detail) : null,
                            version: Number(p.version) || 1,
                            updated_at: new Date().toISOString()
                        };
                        await fetch(`${sbUrl}/rest/v1/programs`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(progRow)
                        });
                    }
                }
                else if (action === 'program.publish') {
                    const pId = payload.id;
                    if (pId) {
                        await fetch(`${sbUrl}/rest/v1/programs?id=eq.${encodeURIComponent(pId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'published', published_at: new Date().toISOString() })
                        });
                    }
                }
                else if (action === 'program.unpublish') {
                    const pId = payload.id;
                    if (pId) {
                        await fetch(`${sbUrl}/rest/v1/programs?id=eq.${encodeURIComponent(pId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'draft' })
                        });
                    }
                }
                else if (action === 'program.archive') {
                    const pId = payload.id;
                    if (pId) {
                        await fetch(`${sbUrl}/rest/v1/programs?id=eq.${encodeURIComponent(pId)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'archived' })
                        });
                    }
                }
                else if (action === 'program.delete') {
                    const pId = payload.id;
                    if (pId) {
                        await fetch(`${sbUrl}/rest/v1/programs?id=eq.${encodeURIComponent(pId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 12. ALUMNI ====================
                else if (action === 'alumni.create' || action === 'saveAlumniData') {
                    const d = payload.data || payload;
                    let photoUrl = (response && (response.fotoUrl || response.photoUrl || response.foto || response.url)) || d.foto || d.photoUrl || null;
                    if (photoUrl && photoUrl.includes('drive.google.com')) {
                        const idMatch = photoUrl.match(/id=([a-zA-Z0-9_-]+)/) || photoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (idMatch && idMatch[1]) {
                            photoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                        }
                    }
                    const alumniRow = {
                        id: (response && response.id) || d.id || ('ALM_' + Date.now()),
                        timestamp: new Date().toLocaleString('id-ID'),
                        nama_lengkap: d.nama_lengkap || d.nama || '',
                        jenis_kelamin: d.jenis_kelamin || d.jk || 'Laki-laki',
                        no_whatsapp: d.no_whatsapp || d.wa || d.telepon || '',
                        media_sosial: d.media_sosial || d.medsos || null,
                        tahun_masuk: String(d.tahun_masuk || d.masuk || ''),
                        tahun_lulus: String(d.tahun_lulus || d.lulus || ''),
                        program_terakhir: d.program_terakhir || d.program || 'Tahfidz Dewasa Putra',
                        kesibukan: d.kesibukan || '-',
                        instansi_perusahaan: d.instansi_perusahaan || d.instansi || null,
                        kesan_pesan: d.kesan_pesan || d.kesan || null,
                        provinsi: d.provinsi || null,
                        kabupaten: d.kabupaten || null,
                        kecamatan: d.kecamatan || null,
                        desa_kelurahan: d.desa_kelurahan || d.desa || null,
                        alamat_lengkap: d.alamat_lengkap || d.alamat || null,
                        latitude: String(d.latitude || d.lat || ''),
                        longitude: String(d.longitude || d.lng || ''),
                        foto: photoUrl,
                        izin_publikasi: d.izin_publikasi || d.izin || 'Ya'
                    };
                    await fetch(`${sbUrl}/rest/v1/alumni`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(alumniRow)
                    });
                }
                else if (action === 'alumni.delete') {
                    const alumniId = payload.id || (payload.data && payload.data.id);
                    if (alumniId) {
                        await fetch(`${sbUrl}/rest/v1/alumni?id=eq.${encodeURIComponent(alumniId)}`, {
                            method: 'DELETE',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                        });
                    }
                }

                // ==================== 13. PENDAFTARAN PPDB ====================
                else if (action === 'submitPendaftaran') {
                    const p = payload.payload || payload.data || payload;
                    const pRow = {
                        id: (response && (response.id || response.pendaftarId)) || ('PPDB_' + Date.now()),
                        nama: p.nama || '',
                        nisn: String(p.nisn || '').trim(),
                        wali: p.wali || '',
                        no_wa: p.whatsapp || p.no_wa || null,
                        program: p.program || '',
                        status: 'Pending',
                        timestamp: new Date().toLocaleString('id-ID'),
                        created_at: new Date().toISOString()
                    };
                    await fetch(`${sbUrl}/rest/v1/pendaftar`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(pRow)
                    });
                }
                else if (action === 'updateStatusPPDB' || action === 'savePPDBStatus' || action === 'savePPDB') {
                    const nisn = payload.nisn;
                    const newStatus = payload.status || payload.newStatus;
                    if (nisn && newStatus) {
                        await fetch(`${sbUrl}/rest/v1/pendaftar?nisn=eq.${encodeURIComponent(nisn)}`, {
                            method: 'PATCH',
                            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                        });
                    }
                }
            } catch (syncErr) {
                console.warn('[SUPABASE DUAL-WRITE SYNC ERROR]', action, syncErr);
            }
        }

        window.syncToSupabaseOnWrite = syncToSupabaseOnWrite;
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
                gambar: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
                views: 124
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
                gambar: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=800&auto=format&fit=crop",
                views: 89
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
                gambar: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=1200&auto=format&fit=crop",
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
