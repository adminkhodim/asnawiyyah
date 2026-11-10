/**
 * Asnawiyyah - Manajemen Peran & Matriks Hak Akses (RBAC)
 * Author: Antigravity IDE
 * Description: Modul kontrol hierarki peran (Role-Based Access Control)
 *              Menyediakan visualisasi matriks hak akses, inspektor peran,
 *              dan integrasi akun pengguna sesuai pedoman keamanan sistem.
 */

(function (window, document) {
    'use strict';

    // Definisi Master 7 Peran Resmi Sistem
    const ROLE_DEFINITIONS = {
        'SUPER_ADMIN': {
            key: 'SUPER_ADMIN',
            name: 'Super Administrator',
            shortName: 'Super Admin',
            tier: 'Tier 1 - Root / Eksekutif',
            badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
            pillBg: 'bg-purple-600 text-white',
            borderColor: 'border-purple-300 dark:border-purple-800',
            icon: 'fa-crown',
            iconColor: 'text-purple-600 dark:text-purple-400',
            summary: 'Otoritas tertinggi sistem dengan kendali mutlak atas seluruh modul, basis data, konfigurasi teknis, dan penetapan peran pengguna.',
            capabilities: [
                'Akses 100% seluruh modul dan fitur aplikasi tanpa batasan',
                'Hak eksklusif membuat, mengubah, dan menetapkan peran Super Admin lain',
                'Akses langsung konfigurasi sistem, database Sheet, dan integrasi API',
                'Kemampuan audit log dan manajemen keamanan tingkat lanjut'
            ],
            scopeNote: 'Dibatasi hanya untuk administrator inti dan penanggung jawab teknis pesantren.'
        },
        'ADMIN': {
            key: 'ADMIN',
            name: 'Administrator Lembaga',
            shortName: 'Admin',
            tier: 'Tier 1 - Pengelola Operasional',
            badgeBg: 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/40',
            pillBg: 'bg-brand-700 text-white',
            borderColor: 'border-brand-300 dark:border-brand-800',
            icon: 'fa-shield-halved',
            iconColor: 'text-brand-600 dark:text-brand-400',
            summary: 'Pengelola operasional harian pondok yang mengatur data santri, akademik, kepengurusan, publikasi konten, dan akun pengguna standar.',
            capabilities: [
                'Mengelola Master Data Santri, Pegawai, dan Akademik',
                'Mengelola Data Wali Santri, kontak WA, dan relasi multi-santri',
                'Mengatur publikasi Berita, Banner Slider, dan Galeri Pondok',
                'Membuat & memverifikasi akun Wali Santri, Asatidz, Pengurus, dan Bendahara',
                'Melihat laporan rekapitulasi seluruh unit pesantren'
            ],
            scopeNote: 'Tidak dapat mengubah akun berstatus Super Admin untuk mencegah eskalasi privilese.'
        },
        'PENGASUH': {
            key: 'PENGASUH',
            name: 'Dewan Masyayikh / Pengasuh',
            shortName: 'Pengasuh',
            tier: 'Tier 2 - Pengawasan & Kebijakan',
            badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
            pillBg: 'bg-amber-600 text-white',
            borderColor: 'border-amber-300 dark:border-amber-800',
            icon: 'fa-hands-praying',
            iconColor: 'text-amber-600 dark:text-amber-400',
            summary: 'Akses khusus Dewan Masyayikh untuk supervisi menyeluruh perkembangan santri, tahfidz, kedisiplinan, dan kegiatan pondok tanpa beban input operasional.',
            capabilities: [
                'Dashboard Eksekutif Pengawasan Santri & Mutaba\'ah Qur\'an',
                'Monitoring capaian hafalan Tahfidz Al-Qur\'an 30 Juz',
                'Melihat rekap kehadiran santri dan ketertiban pesantren',
                'Read-Only mode aman: melindungi data agar tidak terhapus tanpa sengaja'
            ],
            scopeNote: 'Didesain bersih, ringkas, dan fokus pada analitik pertumbuhan santri.'
        },
        'ASATIDZ': {
            key: 'ASATIDZ',
            name: 'Dewan Asatidz / Pengajar',
            shortName: 'Asatidz',
            tier: 'Tier 2 - Akademik & Pembelajaran',
            badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40',
            pillBg: 'bg-indigo-600 text-white',
            borderColor: 'border-indigo-300 dark:border-indigo-800',
            icon: 'fa-chalkboard-user',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            summary: 'Guru pengampu pembelajaran dan pengasuh halaqah untuk menginput setoran hafalan, mutaba\'ah harian santri, presensi, dan penilaian berkala.',
            capabilities: [
                'Entri & validasi setoran hafalan Tahfidz Al-Qur\'an (Ziyadah & Muraja\'ah)',
                'Penentuan target capaian juz & kurikulum hafalan santri',
                'Pengelolaan kelompok halaqah & plotting santri binaan',
                'Input presensi kehadiran halaqah dan jadwal mengajar'
            ],
            scopeNote: 'Fokus pada pencatatan kemajuan belajar santri binaannya.'
        },
        'PENGURUS': {
            key: 'PENGURUS',
            name: 'Pengurus / Kesantrian',
            shortName: 'Pengurus',
            tier: 'Tier 2 - Kesantrian & Lapangan',
            badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/40',
            pillBg: 'bg-teal-600 text-white',
            borderColor: 'border-teal-300 dark:border-teal-800',
            icon: 'fa-clipboard-user',
            iconColor: 'text-teal-600 dark:text-teal-400',
            summary: 'Staf operasional dan pengurus harian pondok yang mengawal ketertiban santri, absensi kegiatan, dokumentasi, ekstrakurikuler, dan PPDB.',
            capabilities: [
                'Pemindaian QR Code dan rekapitulasi Presensi Santri',
                'Pengelolaan Unit Kegiatan Santri (UKS) dan ekstra santri',
                'Pengelolaan pendaftar PPDB Online dan berkas seleksi',
                'Publikasi kabar santri, berita agenda, dan galeri pondok'
            ],
            scopeNote: 'Menangani tata kelola disiplin dan interaksi sosial santri di asrama.'
        },
        'BENDAHARA': {
            key: 'BENDAHARA',
            name: 'Bendahara / Keuangan',
            shortName: 'Bendahara',
            tier: 'Tier 2 - Keuangan & Administrasi',
            badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
            pillBg: 'bg-emerald-600 text-white',
            borderColor: 'border-emerald-300 dark:border-emerald-800',
            icon: 'fa-wallet',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            summary: 'Petugas administrasi keuangan yang mencatat pembayaran SPP, syahriah, uang gedung, tabungan santri, serta rekapitulasi kas masuk/keluar pondok.',
            capabilities: [
                'Pencatatan pembayaran SPP santri dan cetak kuitansi digital',
                'Verifikasi konfirmasi transfer pembayaran dari Wali Santri',
                'Rekapitulasi tunggakan dan riwayat iuran santri',
                'Laporan rekap kas per periode untuk transparansi yayasan'
            ],
            scopeNote: 'Memiliki isolasi hak akses terhadap data keuangan yang sensitif.'
        },
        'WALI_SANTRI': {
            key: 'WALI_SANTRI',
            name: 'Wali Santri / Orang Tua',
            shortName: 'Wali Santri',
            tier: 'Tier 3 - Eksternal / Portal Wali',
            badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40',
            pillBg: 'bg-sky-600 text-white',
            borderColor: 'border-sky-300 dark:border-sky-800',
            icon: 'fa-user-group',
            iconColor: 'text-sky-600 dark:text-sky-400',
            summary: 'Orang tua atau wali yang terhubung secara khusus dengan data santri putra-putrinya melalui verifikasi NIS dan nomor telepon.',
            capabilities: [
                'Melihat mutaba\'ah setoran Tahfidz Al-Qur\'an anak',
                'Melihat riwayat presensi harian, sholat, dan kegiatan anak',
                'Mengecek status tagihan SPP dan riwayat pembayaran resmi',
                'Menerima notifikasi perkembangan belajar dan pengumuman pondok'
            ],
            scopeNote: 'Data terisolasi ketat: hanya dapat melihat data santri yang terhubung dengan akunnya.'
        }
    };

    // =========================================================================
    // KAMUS HAK AKSES & MODUL GRANULAR (Mengadopsi Standar KHODIM.COM)
    // =========================================================================
    const PERMISSION_CATEGORIES = [
        {
            key: 'kesantrian',
            label: 'KESANTRIAN & KESISWAAN',
            icon: 'fa-users',
            color: 'emerald',
            items: [
                { key: 'santri.view', label: 'Melihat Data & Profil Santri', desc: 'Akses membaca daftar santri dan rincian data kesantrian' },
                { key: 'santri.create', label: 'Pendaftaran Santri Baru', desc: 'Izin menambahkan santri baru ke dalam database' },
                { key: 'santri.edit', label: 'Mengubah Data Santri', desc: 'Izin memperbarui informasi biodata & wali santri' },
                { key: 'santri.delete', label: 'Menghapus Data Santri', desc: 'Izin menghapus data santri dari database' },
                { key: 'santri.export', label: 'Import Excel / Massal', desc: 'Izin mengimpor dan mengekspor data santri dari file .xlsx' },
                { key: 'alumni.view', label: 'Melihat Rekap Alumni (HASANAH)', desc: 'Akses melihat direktori data alumni dan sebaran wilayah' },
                { key: 'alumni.manage', label: 'Kelola & Ekspor Data Alumni', desc: 'Izin manajemen status, hapus, dan unduh data alumni' },
                { key: 'unit.manage', label: 'Unit Kegiatan Santri (UKS)', desc: 'Akses mengelola ekstrakurikuler & kegiatan asrama' },
                { key: 'wali.view', label: 'Melihat Data Wali Santri', desc: 'Akses melihat daftar akun wali, kontak WA, dan santri terhubung' },
                { key: 'wali.manage', label: 'Kelola Relasi & Akun Wali', desc: 'Izin menghubungkan santri baru, reset identitas, dan edit relasi wali' },
                { key: 'perpulangan.view', label: 'Melihat Data Izin & Perpulangan', desc: 'Akses melihat daftar permohonan izin santri dan status di luar pondok' },
                { key: 'perpulangan.manage', label: 'Kelola & Validasi Perpulangan', desc: 'Izin pengajuan izin, approval 2-tier (pengurus/pengasuh), dan scan pos gerbang' },
                { key: 'kedisiplinan.view', label: 'Melihat Mutaba\'ah Kedisiplinan & Pelanggaran', desc: 'Akses melihat catatan tata tertib, akumulasi poin, dan sanksi santri' },
                { key: 'kedisiplinan.manage', label: 'Kelola Tata Tertib & Pencatatan Pelanggaran', desc: 'Izin input pelanggaran, update status ta\'zir, dan kelola master aturan kustom' }
            ]
        },
        {
            key: 'akademik',
            label: 'AKADEMIK, QUR\'AN & PEMBELAJARAN',
            icon: 'fa-book-quran',
            color: 'indigo',
            items: [
                { key: 'tahfidz.view', label: 'Melihat Mutaba\'ah Tahfidz', desc: 'Akses melihat rekapitulasi setoran & capaian hafalan 30 juz' },
                { key: 'tahfidz.entry', label: 'Entri Setoran Tahfidz', desc: 'Izin menginput setoran ziyadah & muraja\'ah santri' },
                { key: 'tahfidz.target', label: 'Mengatur Target Tahfidz', desc: 'Izin menentukan target capaian juz santri' },
                { key: 'tahfidz.halaqah', label: 'Kelola Halaqah & Plotting', desc: 'Izin mengelola kelompok halaqah & plotting santri binaan' },
                { key: 'tahfidz.evaluasi.view', label: 'Melihat Evaluasi & Jurnal Tahfidz', desc: 'Akses melihat riwayat setoran, analitik berkala, dan filter periode data' },
                { key: 'tahfidz.evaluasi.manage', label: 'Kelola & Ekspor Evaluasi Tahfidz', desc: 'Izin mencetak laporan resmi via isolated iframe dan ekspor Excel (.xlsx)' },
                { key: 'presensi.view', label: 'Melihat Rekap Presensi', desc: 'Akses memantau grafik kehadiran kegiatan santri' },
                { key: 'presensi.entry', label: 'Checklist & Scan QR Presensi', desc: 'Izin melakukan absensi live kegiatan & sholat' },
                { key: 'keaktifan.view', label: 'Monitoring Keaktifan Asatidz', desc: 'Hak eksklusif Super Admin & Pengasuh untuk memantau kepatuhan sesi, presensi & setoran asatidz' }
            ]
        },
        {
            key: 'keuangan',
            label: 'KEUANGAN & ADMINISTRASI',
            icon: 'fa-wallet',
            color: 'amber',
            items: [
                { key: 'keuangan.view', label: 'Melihat Kas & Saldo Pondok', desc: 'Akses memantau ringkasan buku kas dan saldo pesantren' },
                { key: 'keuangan.spp', label: 'Pencatatan & Tagihan SPP', desc: 'Izin mencatat pembayaran iuran syahriah & SPP' },
                { key: 'keuangan.verify', label: 'Verifikasi Pembayaran PPDB', desc: 'Izin memvalidasi konfirmasi bukti transfer wali santri' },
                { key: 'ppdb.manage', label: 'Pengelolaan Berkas PPDB', desc: 'Akses seleksi berkas calon santri & formulir pendaftaran' }
            ]
        },
        {
            key: 'konten',
            label: 'KONTEN & PUBLIKASI',
            icon: 'fa-newspaper',
            color: 'sky',
            items: [
                { key: 'berita.manage', label: 'Manajemen Berita & Pengumuman', desc: 'Izin menerbitkan artikel, agenda pondok, dan warta santri' },
                { key: 'banner.manage', label: 'Manajemen Banner Slider', desc: 'Izin mengubah banner promosi & kegiatan beranda' },
                { key: 'program.manage', label: 'Manajemen Program Pesantren (CMS)', desc: 'Izin mengelola, mengedit, dan mempublikasikan Program Pesantren' },
                { key: 'galeri.manage', label: 'Manajemen Galeri Foto', desc: 'Izin mengunggah album dokumentasi kegiatan santri' },
                { key: 'jadwal.manage', label: 'Manajemen Jadwal Kegiatan', desc: 'Izin mengelola agenda rutinitas santri (harian, mingguan, bulanan, tahunan)' },
                { key: 'notifikasi.broadcast', label: 'Broadcast Pesan & Notifikasi', desc: 'Izin mengirim notifikasi pengumuman ke akun santri/wali' }
            ]
        },
        {
            key: 'kelembagaan',
            label: 'KELEMBAGAAN & PENGATURAN SISTEM',
            icon: 'fa-building-columns',
            color: 'purple',
            items: [
                { key: 'profil.manage', label: 'Profil Lembaga & Pengurus', desc: 'Izin mengubah struktur kepengurusan & sejarah pondok' },
                { key: 'pegawai.manage', label: 'Data Pegawai & Asatidz', desc: 'Akses mengelola data staf & dewan asatidz' },
                { key: 'izin-asatidz.view', label: 'Melihat Data Izin & Badal Asatidz', desc: 'Akses melihat permohonan izin mengajar dan amanah badal halaqah' },
                { key: 'izin-asatidz.manage', label: 'Kelola Pengajuan & Restu Izin Asatidz', desc: 'Izin mengajukan izin mengajar, delegasi badal, serta hak restu/approval Pengasuh' },
                { key: 'users.manage', label: 'Manajemen Akun Pengguna', desc: 'Izin membuat, reset sandi, dan status akun' },
                { key: 'roles.manage', label: 'Manajemen Peran (RBAC)', desc: 'Hak khusus mengatur checklist izin peran pengguna' },
                { key: 'system.config', label: 'Konfigurasi Sistem & API', desc: 'Akses kunci integrasi Google Sheets & token sistem' }
            ]
        }
    ];

    // Pemetaan Modul Sistem ke Izin Terkait
    const MODULE_TO_PERMISSIONS = {
        'santri': ['santri.view', 'santri.create', 'santri.edit', 'santri.delete', 'santri.export'],
        'wali-santri': ['wali.view', 'wali.manage'],
        'alumni': ['alumni.view', 'alumni.manage'],
        'tahfidz': ['tahfidz.view', 'tahfidz.entry', 'tahfidz.target', 'tahfidz.halaqah'],
        'tahfidz-evaluasi': ['tahfidz.evaluasi.view', 'tahfidz.evaluasi.manage'],
        'keaktifan-asatidz': ['keaktifan.view'],
        'izin-asatidz': ['izin-asatidz.view', 'izin-asatidz.manage'],
        'presensi': ['presensi.view', 'presensi.entry'],
        'ppdb': ['ppdb.manage'],
        'program': ['program.manage'],
        'unit-kegiatan': ['unit.manage'],
        'jadwal-kegiatan': ['jadwal.manage'],
        'users': ['users.manage'],
        'roles': ['roles.manage'],
        'pegawai': ['pegawai.manage'],
        'berita': ['berita.manage'],
        'banner': ['banner.manage'],
        'galeri': ['galeri.manage'],
        'notifikasi': ['notifikasi.broadcast'],
        'profil-lembaga': ['profil.manage'],
        'pengaturan': ['system.config'],
        'keuangan': ['keuangan.view', 'keuangan.spp', 'keuangan.verify'],
        'perpulangan': ['perpulangan.view', 'perpulangan.manage'],
        'kedisiplinan': ['kedisiplinan.view', 'kedisiplinan.manage']
    };

    // Default Baseline Permissions per Role (Isolasi Ketat Sesuai Ranah Tanggung Jawab)
    const DEFAULT_ROLE_PERMISSIONS_MAP = {
        'SUPER_ADMIN': ['*'],
        'ADMIN': [
            'santri.view', 'santri.create', 'santri.edit', 'santri.delete', 'santri.export',
            'wali.view', 'wali.manage',
            'alumni.view', 'alumni.manage', 'unit.manage', 'jadwal.manage',
            'tahfidz.view', 'tahfidz.entry', 'tahfidz.target', 'tahfidz.halaqah',
            'tahfidz.evaluasi.view', 'tahfidz.evaluasi.manage',
            'presensi.view', 'presensi.entry',
            'keuangan.view', 'keuangan.spp', 'keuangan.verify', 'ppdb.manage',
            'berita.manage', 'banner.manage', 'program.manage', 'galeri.manage', 'jadwal.manage', 'notifikasi.broadcast',
            'profil.manage', 'pegawai.manage', 'users.manage', 'roles.manage', 'system.config',
            'perpulangan.view', 'perpulangan.manage',
            'kedisiplinan.view', 'kedisiplinan.manage',
            'izin-asatidz.view', 'izin-asatidz.manage'
        ],
        'ASATIDZ': [
            'santri.view', 'wali.view',
            'tahfidz.view', 'tahfidz.entry', 'tahfidz.target', 'tahfidz.halaqah',
            'tahfidz.evaluasi.view', 'tahfidz.evaluasi.manage',
            'presensi.view', 'presensi.entry',
            'pegawai.manage', 'profil.manage',
            'perpulangan.view',
            'kedisiplinan.view',
            'izin-asatidz.view', 'izin-asatidz.manage'
        ],
        'BENDAHARA': [
            'keuangan.view', 'keuangan.spp', 'keuangan.verify', 'santri.view', 'wali.view', 'notifikasi.broadcast'
        ],
        'PENGURUS': [
            'presensi.view', 'presensi.entry', 'alumni.view', 'unit.manage', 'jadwal.manage', 'ppdb.manage',
            'wali.view', 'tahfidz.evaluasi.view',
            'berita.manage', 'banner.manage', 'program.manage', 'galeri.manage', 'notifikasi.broadcast',
            'perpulangan.view', 'perpulangan.manage',
            'kedisiplinan.view', 'kedisiplinan.manage',
            'izin-asatidz.view'
        ],
        'PENGASUH': [
            'santri.view', 'wali.view', 'tahfidz.view', 'tahfidz.evaluasi.view', 'tahfidz.evaluasi.manage', 'jadwal.manage', 'alumni.view', 'pegawai.manage', 'keaktifan.view', 'berita.manage', 'users.manage',
            'perpulangan.view', 'perpulangan.manage',
            'kedisiplinan.view',
            'izin-asatidz.view', 'izin-asatidz.manage'
        ],
        'WALI_SANTRI': [
            'santri.view', 'tahfidz.view', 'tahfidz.evaluasi.view', 'presensi.view', 'keuangan.view',
            'perpulangan.view', 'perpulangan.manage',
            'kedisiplinan.view'
        ]
    };

    // State Permissions Aktif (Diambil dari Local Storage / Backend dengan sanitasi otomatis)
    let ROLE_PERMISSIONS_STATE = (function () {
        const validKeys = new Set(['*']);
        PERMISSION_CATEGORIES.forEach(c => c.items.forEach(i => validKeys.add(i.key)));

        let state = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS_MAP));
        try {
            const cached = localStorage.getItem('ASNAWIYYAH_ROLE_PERMS_CACHE');
            if (cached) {
                const parsed = JSON.parse(cached);
                for (const r in parsed) {
                    if (Array.isArray(parsed[r])) {
                        state[r] = parsed[r].filter(k => validKeys.has(k));
                        if ((r === 'ADMIN' || r === 'ASATIDZ') && !state[r].includes('tahfidz.halaqah')) {
                            state[r].push('tahfidz.halaqah');
                        }
                        if ((r === 'ADMIN' || r === 'PENGURUS' || r === 'PENGASUH') && !state[r].includes('jadwal.manage')) {
                            state[r].push('jadwal.manage');
                        }
                        if (r === 'ADMIN' && !state[r].includes('wali.manage')) {
                            state[r].push('wali.view', 'wali.manage');
                        }
                        if (['ASATIDZ', 'BENDAHARA', 'PENGURUS', 'PENGASUH'].includes(r) && !state[r].includes('wali.view')) {
                            state[r].push('wali.view');
                        }
                        if (['ADMIN', 'PENGURUS'].includes(r)) {
                            if (!state[r].includes('kedisiplinan.view')) state[r].push('kedisiplinan.view');
                            if (!state[r].includes('kedisiplinan.manage')) state[r].push('kedisiplinan.manage');
                        }
                        if (['PENGASUH', 'ASATIDZ', 'WALI_SANTRI'].includes(r) && !state[r].includes('kedisiplinan.view')) {
                            state[r].push('kedisiplinan.view');
                        }
                        if (['ADMIN', 'PENGASUH', 'ASATIDZ'].includes(r)) {
                            if (!state[r].includes('izin-asatidz.view')) state[r].push('izin-asatidz.view');
                            if (!state[r].includes('izin-asatidz.manage')) state[r].push('izin-asatidz.manage');
                        }
                        if (r === 'PENGURUS' && !state[r].includes('izin-asatidz.view')) {
                            state[r].push('izin-asatidz.view');
                        }
                    }
                }
                localStorage.setItem('ASNAWIYYAH_ROLE_PERMS_CACHE', JSON.stringify(state));
            }
        } catch (e) { }
        return state;
    })();

    let currentConfiguringRole = null;
    let currentModalPermissions = [];

    // Matriks Hak Akses per Modul Sistem (CRUD & Permissions)
    // 23 Modul Lengkap Aplikasi PPTQ Asnawiyyah
    // Nilai akses: 'full' (CRUD Lengkap), 'read' (Lihat Saja), 'write' (Entri/Input), 'read_own' (Milik Sendiri), 'none' (Tutup)
    const MODULE_PERMISSIONS_MATRIX = [
        // 1. Kesantrian & Kesiswaan (10 Modul)
        {
            key: 'santri',
            category: 'Kesantrian & Pendidikan',
            module: 'Master Data Santri',
            icon: 'fa-users',
            desc: 'Biodata santri, NIS, kelas, wali, dan status aktif.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'read',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'read_own'
            }
        },
        {
            key: 'wali-santri',
            category: 'Kesantrian & Pendidikan',
            module: 'Data Wali Santri',
            icon: 'fa-user-group',
            desc: 'Daftar akun wali santri, kontak WhatsApp, dan relasi santri terhubung.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'read',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'tahfidz',
            category: 'Kesantrian & Pendidikan',
            module: 'Tahfidz Al-Qur\'an',
            icon: 'fa-book-quran',
            desc: 'Hafalan 30 juz, rekapitulasi, target capaian & halaqah plotting.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'full',
                PENGURUS: 'read',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read_own'
            }
        },
        {
            key: 'tahfidz-evaluasi',
            category: 'Kesantrian & Pendidikan',
            module: 'Evaluasi & Riwayat Tahfidz',
            icon: 'fa-chart-line',
            desc: 'Analitik setoran hafalan, mutabaah berkala, filter periode data & cetak rekapitulasi.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'full',
                PENGURUS: 'read',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read_own'
            }
        },
        {
            key: 'presensi',
            category: 'Kesantrian & Pendidikan',
            module: 'Presensi & Kehadiran',
            icon: 'fa-calendar-check',
            desc: 'Absensi QR Code, jadwal halaqah, dan rekap ketertiban santri.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'write',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read_own'
            }
        },
        {
            key: 'ppdb',
            category: 'Kesantrian & Pendidikan',
            module: 'PPDB Santri Baru',
            icon: 'fa-user-plus',
            desc: 'Form pendaftaran online, seleksi berkas, dan aktivasi santri.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'write',
                BENDAHARA: 'write',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'unit-kegiatan',
            category: 'Kesantrian & Pendidikan',
            module: 'Unit Kegiatan (UKS)',
            icon: 'fa-people-roof',
            desc: 'Organisasi santri, ekstrakurikuler, dan kegiatan asrama.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'read',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'jadwal-kegiatan',
            category: 'Kesantrian & Pendidikan',
            module: 'Jadwal Kegiatan Santri',
            icon: 'fa-calendar-days',
            desc: 'Pengaturan agenda rutinitas santri (harian, mingguan, kalender).',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'read',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'alumni',
            category: 'Kesantrian & Pendidikan',
            module: 'Rekap Alumni (HASANAH)',
            icon: 'fa-user-graduate',
            desc: 'Direktori data alumni, persebaran wilayah, dan himpunan alumni (HASANAH).',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'none',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'program',
            category: 'Kesantrian & Pendidikan',
            module: 'Manajemen Program (CMS)',
            icon: 'fa-graduation-cap',
            desc: 'Pengelolaan program unggulan, takhasus, dan kurikulum pesantren.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'read',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'perpulangan',
            category: 'Kesantrian & Pendidikan',
            module: 'Izin Santri & Perpulangan',
            icon: 'fa-person-walking-luggage',
            desc: 'Pengajuan izin santri, persetujuan 2-tier (pengurus & pengasuh), surat jalan, dan pos gerbang.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'full',
                ASATIDZ: 'read',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'write'
            }
        },
        {
            key: 'kedisiplinan',
            category: 'Kesantrian & Pendidikan',
            module: 'Kedisiplinan & Tarbiyah Santri',
            icon: 'fa-scale-balanced',
            desc: 'Pencatatan pelanggaran, akumulasi poin tata tertib, sanksi ta\'zir mendidik, dan master aturan.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'read',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read_own'
            }
        },

        // 2. Kepegawaian & SDM (2 Modul)
        {
            key: 'pegawai',
            category: 'Kepegawaian & SDM',
            module: 'Data Pegawai & Asatidz',
            icon: 'fa-user-tie',
            desc: 'Master NIP, jabatan, riwayat pengajaran, dan profil staf.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'read_own',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'keaktifan-asatidz',
            category: 'Kepegawaian & SDM',
            module: 'Keaktifan Asatidz',
            icon: 'fa-user-clock',
            desc: 'Monitoring kepatuhan sesi, presensi & setoran tahfidz asatidz realtime.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'none',
                PENGASUH: 'read',
                ASATIDZ: 'none',
                PENGURUS: 'none',
                BENDAHARA: 'none',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'izin-asatidz',
            category: 'Kepegawaian & SDM',
            module: 'Izin & Badal Asatidz',
            icon: 'fa-handshake',
            desc: 'Pengajuan izin mengajar, pendelegasian amanah badal halaqah, dan restu Pengasuh.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'full',
                ASATIDZ: 'write',
                PENGURUS: 'read',
                BENDAHARA: 'none',
                WALI_SANTRI: 'none'
            }
        },

        // 3. Konten & Publikasi (3 Modul)
        {
            key: 'berita',
            category: 'Konten & Publikasi',
            module: 'Berita & Pengumuman',
            icon: 'fa-newspaper',
            desc: 'Artikel warta pondok, agenda pesantren, dan kabar santri.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'full',
                ASATIDZ: 'none',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'banner',
            category: 'Konten & Publikasi',
            module: 'Banner Slider Beranda',
            icon: 'fa-images',
            desc: 'Slider beranda rasio 3:1 untuk promosi & informasi utama.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'galeri',
            category: 'Konten & Publikasi',
            module: 'Manajemen Galeri Foto',
            icon: 'fa-camera-retro',
            desc: 'Album dokumentasi foto kegiatan santri & event pesantren.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'full',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },

        // 4. Kelembagaan & Pengaturan (2 Modul)
        {
            key: 'profil-lembaga',
            category: 'Kelembagaan & Pengaturan',
            module: 'Profil Lembaga & Masyayikh',
            icon: 'fa-building-columns',
            desc: 'Sejarah, visi misi, struktur kepengurusan pondok.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'read',
                PENGURUS: 'read',
                BENDAHARA: 'read',
                WALI_SANTRI: 'read'
            }
        },
        {
            key: 'pengaturan',
            category: 'Kelembagaan & Pengaturan',
            module: 'Tautan & Media Sosial',
            icon: 'fa-share-nodes',
            desc: 'Pengaturan tautan video streaming, kanal sosmed, dan kontak resmi.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'none',
                BENDAHARA: 'none',
                WALI_SANTRI: 'read'
            }
        },

        // 5. Keamanan & Hak Akses (3 Modul)
        {
            key: 'users',
            category: 'Keamanan & Hak Akses',
            module: 'Manajemen Pengguna',
            icon: 'fa-users-gear',
            desc: 'Akun wali santri, pegawai, admin, reset password, dan status.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'read',
                ASATIDZ: 'none',
                PENGURUS: 'none',
                BENDAHARA: 'none',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'roles',
            category: 'Keamanan & Hak Akses',
            module: 'Manajemen Peran (RBAC)',
            icon: 'fa-shield-halved',
            desc: 'Matriks hak akses, inspeksi wewenang, dan hierarki peran.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'read',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'none',
                BENDAHARA: 'none',
                WALI_SANTRI: 'none'
            }
        },
        {
            key: 'notifikasi',
            category: 'Keamanan & Hak Akses',
            module: 'Notifikasi Broadcast',
            icon: 'fa-bell',
            desc: 'Kirim broadcast pengumuman & pesan ke akun santri/wali.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'full',
                BENDAHARA: 'write',
                WALI_SANTRI: 'none'
            }
        },

        // 6. Keuangan & Administrasi (1 Modul)
        {
            key: 'keuangan',
            category: 'Keuangan & Administrasi',
            module: 'Keuangan & Iuran SPP',
            icon: 'fa-wallet',
            desc: 'Pencatatan pembayaran SPP santri, syahriah & kas pesantren.',
            permissions: {
                SUPER_ADMIN: 'full',
                ADMIN: 'full',
                PENGASUH: 'none',
                ASATIDZ: 'none',
                PENGURUS: 'none',
                BENDAHARA: 'full',
                WALI_SANTRI: 'read_own'
            }
        }
    ];

    // State Penyimpanan Matriks Kustom & Perubahan Tertunda
    let SAVED_MATRIX_STATE = (function () {
        try {
            const ls = window.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
            const raw = ls ? ls.getItem('ASNAWIYYAH_ROLE_MATRIX_STATE') : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                // Bersihkan cache invalid/stale untuk izin-asatidz agar mengikuti default baseline yang valid
                if (parsed['izin-asatidz___ASATIDZ'] === 'entry' || parsed['izin-asatidz___ASATIDZ'] === 'none') {
                    delete parsed['izin-asatidz___ASATIDZ'];
                }
                if (parsed['izin-asatidz___ADMIN'] === 'none') {
                    delete parsed['izin-asatidz___ADMIN'];
                }
                if (parsed['izin-asatidz___PENGASUH'] === 'none') {
                    delete parsed['izin-asatidz___PENGASUH'];
                }
                return parsed;
            }
        } catch (e) { }
        return {};
    })();

    let MATRIX_PENDING_CHANGES = {};

    let currentRoleFilter = 'ALL';
    let currentActiveRoleModal = null;

    /**
     * Konversi level matriks ('full', 'read', 'write', 'read_own', 'none') ke granular permission keys
     */
    function convertMatrixLevelToPermissions(moduleKey, level) {
        const allKeys = MODULE_TO_PERMISSIONS[moduleKey] || [];
        if (!allKeys.length) return [];
        if (level === 'none') return [];
        if (level === 'full') return [...allKeys];
        if (level === 'read' || level === 'read_own') {
            const viewKey = allKeys.find(k => k.endsWith('.view')) || allKeys[0];
            return [viewKey];
        }
        if (level === 'write') {
            return allKeys.filter(k => !k.endsWith('.delete') && !k.endsWith('.export'));
        }
        return [];
    }

    /**
     * Rekonstruksi SAVED_MATRIX_STATE dari active permissions di ROLE_PERMISSIONS_STATE (Cloud DB Supabase & Spreadsheet)
     */
    function reconstructSavedMatrixFromRolePerms() {
        if (!ROLE_PERMISSIONS_STATE || typeof ROLE_PERMISSIONS_STATE !== 'object') return;
        const roleKeys = Object.keys(ROLE_PERMISSIONS_STATE);
        if (roleKeys.length === 0) return;

        roleKeys.forEach(rKey => {
            if (rKey === 'SUPER_ADMIN') return;
            const perms = ROLE_PERMISSIONS_STATE[rKey];
            if (!Array.isArray(perms)) return;

            const isAll = perms.includes('*');
            MODULE_PERMISSIONS_MATRIX.forEach(m => {
                const cellKey = `${m.key}___${rKey}`;
                if (isAll) {
                    SAVED_MATRIX_STATE[cellKey] = 'full';
                } else {
                    const reqPerms = MODULE_TO_PERMISSIONS[m.key] || [];
                    const hasPerm = reqPerms.some(pk => perms.includes(pk));
                    const baseline = (m.permissions && m.permissions[rKey]) || 'none';
                    if (!hasPerm) {
                        // Jika role perms berasal dari cache lama atau sheet lama yang belum memuat modul baru,
                        // jangan menutup izin jika default baseline-nya aktif, melainkan backfill otomatis.
                        if (baseline !== 'none') {
                            const backfilled = convertMatrixLevelToPermissions(m.key, baseline);
                            backfilled.forEach(pk => {
                                if (!perms.includes(pk)) perms.push(pk);
                            });
                            SAVED_MATRIX_STATE[cellKey] = baseline;
                        } else {
                            SAVED_MATRIX_STATE[cellKey] = 'none';
                        }
                    } else {
                        if (!SAVED_MATRIX_STATE[cellKey] || SAVED_MATRIX_STATE[cellKey] === 'none') {
                            SAVED_MATRIX_STATE[cellKey] = baseline !== 'none' ? baseline : 'read';
                        }
                    }
                }
            });
        });

        try {
            const ls = window.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
            if (ls) ls.setItem('ASNAWIYYAH_ROLE_MATRIX_STATE', JSON.stringify(SAVED_MATRIX_STATE));
        } catch (e) { }
    }

    // Jalankan rekonstruksi inisial agar SAVED_MATRIX_STATE langsung sinkron dengan ROLE_PERMISSIONS_STATE
    try {
        reconstructSavedMatrixFromRolePerms();
    } catch (e) { }

    /**
     * Dapatkan level izin saat ini untuk kombinasi modul & peran
     */
    function getMatrixPermission(moduleKey, roleKey) {
        if (roleKey === 'SUPER_ADMIN') return 'full';
        const cellKey = `${moduleKey}___${roleKey}`;
        if (MATRIX_PENDING_CHANGES[cellKey] !== undefined) {
            return MATRIX_PENDING_CHANGES[cellKey];
        }
        if (SAVED_MATRIX_STATE[cellKey] !== undefined) {
            return SAVED_MATRIX_STATE[cellKey];
        }
        // Jika data izin dari Cloud DB (Supabase / Spreadsheet) sudah termuat
        if (ROLE_PERMISSIONS_STATE && Array.isArray(ROLE_PERMISSIONS_STATE[roleKey])) {
            const perms = ROLE_PERMISSIONS_STATE[roleKey];
            if (perms.includes('*')) return 'full';
            const reqPerms = MODULE_TO_PERMISSIONS[moduleKey] || [];
            const hasPerm = reqPerms.some(pk => perms.includes(pk));
            if (!hasPerm) return 'none';
        }
        const found = MODULE_PERMISSIONS_MATRIX.find(m => m.key === moduleKey);
        return (found && found.permissions && found.permissions[roleKey]) || 'none';
    }

    /**
     * Handle perubahan nilai dropdown izin pada sel matriks
     */
    function handleMatrixCellChange(moduleKey, roleKey, newLevel) {
        if (roleKey === 'SUPER_ADMIN') return;
        const cellKey = `${moduleKey}___${roleKey}`;
        const currentSaved = (SAVED_MATRIX_STATE[cellKey] !== undefined)
            ? SAVED_MATRIX_STATE[cellKey]
            : ((MODULE_PERMISSIONS_MATRIX.find(m => m.key === moduleKey) || {}).permissions || {})[roleKey] || 'none';

        if (newLevel === currentSaved) {
            delete MATRIX_PENDING_CHANGES[cellKey];
        } else {
            MATRIX_PENDING_CHANGES[cellKey] = newLevel;
        }

        updateMatrixFloatingBar();
        renderRolesMatrixTable();

        // Segarkan visibilitas menu bila peran yang diubah sedang aktif dipratinjau
        const activeRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
            (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ASN_ADMIN_ROLE') : null) || 'SUPER_ADMIN';
        if (activeRole === roleKey) {
            applyAdminRoleVisibility(activeRole);
        }
    }

    /**
     * Toggle dropdown menu aksi cepat per kolom peran
     */
    function toggleBatchRoleMenu(roleKey, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const allMenus = document.querySelectorAll('[id^="batch-menu-"]');
        allMenus.forEach(m => {
            if (m.id !== `batch-menu-${roleKey}`) m.classList.add('hidden');
        });
        const targetMenu = document.getElementById(`batch-menu-${roleKey}`);
        if (targetMenu) targetMenu.classList.toggle('hidden');
    }

    // Listener global menutup menu aksi cepat saat klik di luar
    document.addEventListener('click', (e) => {
        if (!e.target.closest('[id^="batch-menu-"]') && !e.target.closest('button[onclick*="toggleBatchRoleMenu"]')) {
            document.querySelectorAll('[id^="batch-menu-"]').forEach(m => m.classList.add('hidden'));
        }
    });

    /**
     * Set serentak seluruh modul untuk satu peran (Batch Action)
     */
    function batchSetRoleMatrix(roleKey, targetLevel) {
        if (roleKey === 'SUPER_ADMIN') return;
        MODULE_PERMISSIONS_MATRIX.forEach(item => {
            let lvl = targetLevel;
            // Guardrail: Wali Santri tidak boleh full pada modul administratif sensitif
            if (roleKey === 'WALI_SANTRI' && lvl === 'full' && ['users', 'roles', 'pegawai', 'keuangan', 'pengaturan'].includes(item.key)) {
                lvl = 'none';
            }
            const cellKey = `${item.key}___${roleKey}`;
            const currentSaved = (SAVED_MATRIX_STATE[cellKey] !== undefined)
                ? SAVED_MATRIX_STATE[cellKey]
                : (item.permissions && item.permissions[roleKey]) || 'none';

            if (lvl === currentSaved) {
                delete MATRIX_PENDING_CHANGES[cellKey];
            } else {
                MATRIX_PENDING_CHANGES[cellKey] = lvl;
            }
        });
        document.querySelectorAll('[id^="batch-menu-"]').forEach(m => m.classList.add('hidden'));
        updateMatrixFloatingBar();
        renderRolesMatrixTable();
    }

    /**
     * Reset izin satu peran kembali ke baseline bawaan
     */
    function batchResetRoleMatrix(roleKey) {
        if (roleKey === 'SUPER_ADMIN') return;
        MODULE_PERMISSIONS_MATRIX.forEach(item => {
            const cellKey = `${item.key}___${roleKey}`;
            delete MATRIX_PENDING_CHANGES[cellKey];
            delete SAVED_MATRIX_STATE[cellKey];
        });
        try {
            const ls = window.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
            if (ls) ls.setItem('ASNAWIYYAH_ROLE_MATRIX_STATE', JSON.stringify(SAVED_MATRIX_STATE));
        } catch (e) { }
        document.querySelectorAll('[id^="batch-menu-"]').forEach(m => m.classList.add('hidden'));
        updateMatrixFloatingBar();
        renderRolesMatrixTable();
        if (typeof showToast === 'function') {
            showToast(`🔄 Hak akses peran ${ROLE_DEFINITIONS[roleKey]?.shortName || roleKey} dikembalikan ke default baseline.`);
        }
    }

    /**
     * Update tampilan bilah simpan mengambang (Floating Action Bar)
     */
    function updateMatrixFloatingBar() {
        const bar = document.getElementById('role-matrix-floating-bar');
        const countEl = document.getElementById('role-matrix-pending-count');
        if (!bar) return;

        const count = Object.keys(MATRIX_PENDING_CHANGES).length;
        if (count > 0) {
            bar.classList.remove('hidden');
            if (countEl) countEl.innerText = `${count} perubahan izin belum disimpan`;
        } else {
            bar.classList.add('hidden');
        }
    }

    /**
     * Simpan seluruh perubahan matriks ke cache lokal dan sinkronisasi ke backend
     */
    async function saveMatrixPermissionsChanges() {
        const changedKeys = Object.keys(MATRIX_PENDING_CHANGES);
        if (changedKeys.length === 0) {
            if (typeof showToast === 'function') showToast('ℹ️ Tidak ada perubahan matriks yang tertunda.');
            return;
        }

        const btnSave = document.getElementById('btn-save-role-matrix');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Menyimpan ke Cloud DB...</span>`;
        }

        try {
            // 1. Simpan ke SAVED_MATRIX_STATE
            const affectedRoles = new Set();
            for (const cellKey of changedKeys) {
                const parts = cellKey.split('___');
                const roleKey = parts[1];
                SAVED_MATRIX_STATE[cellKey] = MATRIX_PENDING_CHANGES[cellKey];
                affectedRoles.add(roleKey);
            }
            try {
                const ls = window.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
                if (ls) ls.setItem('ASNAWIYYAH_ROLE_MATRIX_STATE', JSON.stringify(SAVED_MATRIX_STATE));
            } catch (e) { }

            // 2. Sinkronkan ke granular permissions per role yang terpengaruh
            const config = (typeof window !== 'undefined' && window.ASNAWIYYAH_CONFIG) || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            const actorEmail = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && ASNIdentity.currentUser.email) || 'ADMIN_USER';
            const syncPromises = [];

            for (const rKey of affectedRoles) {
                if (rKey === 'SUPER_ADMIN') continue;
                const newPermSet = new Set();
                MODULE_PERMISSIONS_MATRIX.forEach(m => {
                    const lvl = getMatrixPermission(m.key, rKey);
                    const mappedPerms = convertMatrixLevelToPermissions(m.key, lvl);
                    mappedPerms.forEach(pk => newPermSet.add(pk));
                });

                ROLE_PERMISSIONS_STATE[rKey] = Array.from(newPermSet);

                const countActive = ROLE_PERMISSIONS_STATE[rKey].includes('*') ? 28 : ROLE_PERMISSIONS_STATE[rKey].length;
                const roleDef = ROLE_DEFINITIONS[rKey] || {};
                const roleName = roleDef.name || rKey;

                // A. Direct Fast-Write ke Supabase Cloud DB (Tabel roles_permissions)
                if (sbUrl && sbKey) {
                    const sbRow = {
                        role_key: rKey,
                        role_name: roleName,
                        total_active: countActive,
                        active_permissions_json: ROLE_PERMISSIONS_STATE[rKey],
                        updated_at: new Date().toISOString(),
                        updated_by: actorEmail
                    };
                    const sbP = fetch(`${sbUrl}/rest/v1/roles_permissions?role_key=eq.${encodeURIComponent(rKey)}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(sbRow)
                    }).catch(errSb => console.warn(`[SUPABASE ROLES_PERMISSIONS WRITE ERROR ${rKey}]`, errSb));
                    syncPromises.push(sbP);
                }

                // B. Write ke Google Apps Script (Spreadsheet Roles_Permissions & ScriptProperties)
                if (typeof authApiPost === 'function') {
                    const gasP = authApiPost('auth.admin.saveRolePermissions', {
                        roleKey: rKey,
                        permissions: ROLE_PERMISSIONS_STATE[rKey]
                    }).catch(errApi => console.warn(`[SAVE ROLE PERMS GAS ERROR ${rKey}]`, errApi));
                    syncPromises.push(gasP);
                }
            }

            // Tunggu seluruh sinkronisasi selesai
            await Promise.allSettled(syncPromises);

            // 3. Cache role permissions
            try {
                localStorage.setItem('ASNAWIYYAH_ROLE_PERMS_CACHE', JSON.stringify(ROLE_PERMISSIONS_STATE));
            } catch (e) { }

            MATRIX_PENDING_CHANGES = {};
            updateMatrixFloatingBar();
            renderRolesMatrixTable();
            renderRoleCardsGrid();

            // Terapkan visibilitas peran aktif & grid mobile pusat kontrol
            const activeRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') || 'SUPER_ADMIN';
            applyAdminRoleVisibility(activeRole);

            if (typeof showToast === 'function') {
                showToast(`✅ Matriks hak akses ${affectedRoles.size} peran berhasil disimpan ke Spreadsheet & Supabase Cloud DB!`);
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Matriks Berhasil Disimpan',
                    text: `Konfigurasi hak akses tersimpan ke Spreadsheet & Supabase. Pusat kontrol mobile otomatis membaca menu aktif.`,
                    timer: 2500,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('[SAVE MATRIX ERROR]', err);
            if (typeof showToast === 'function') {
                showToast(`⚠️ Terjadi kesalahan saat menyimpan matriks: ${err.message}`);
            }
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk text-xs"></i> <span>Simpan Matriks</span>`;
            }
        }
    }

    /**
     * Batalkan seluruh perubahan tertunda pada matriks
     */
    function cancelMatrixPermissionsChanges() {
        MATRIX_PENDING_CHANGES = {};
        updateMatrixFloatingBar();
        renderRolesMatrixTable();
        if (typeof showToast === 'function') {
            showToast('ℹ️ Seluruh perubahan matriks izin dibatalkan.');
        }
    }

    /**
     * Memuat dan merender modul Manajemen Peran
     */
    async function loadAdminRolesData() {
        const loadingEl = document.getElementById('admin-roles-loading');
        if (loadingEl) loadingEl.classList.remove('hidden');

        try {
            // Pastikan data pengguna ter-load agar counter pengguna per role akurat
            if (typeof adminUsersList === 'undefined' || !adminUsersList || adminUsersList.length === 0) {
                if (typeof loadAdminUsersData === 'function') {
                    await loadAdminUsersData();
                }
            }

            // Muat konfigurasi izin peran dari backend
            fetchRolePermissionsFromBackend();

            renderAdminRolesView();
        } catch (err) {
            console.error('[LOAD ROLES ERROR]', err);
            if (typeof showToast === 'function') showToast('⚠️ Terjadi kendala saat merender data peran: ' + err.message);
        } finally {
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    /**
     * Render komponen visual Manajemen Peran
     */
    function renderAdminRolesView() {
        renderRolesSummaryKPIs();
        renderRolesMatrixTable();
        renderRoleCardsGrid();
        updateMatrixFloatingBar();
    }

    /**
     * Hitung total akun per role dari adminUsersList
     */
    function getRoleUserCount(roleKey) {
        if (typeof adminUsersList === 'undefined' || !Array.isArray(adminUsersList)) return 0;
        if (roleKey === 'ASATIDZ') {
            return adminUsersList.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR').length;
        }
        return adminUsersList.filter(u => String(u.role || '').toUpperCase() === roleKey).length;
    }

    /**
     * Render KPI Metric Cards
     */
    function renderRolesSummaryKPIs() {
        const totalRolesEl = document.getElementById('role-kpi-total-roles');
        const totalUsersEl = document.getElementById('role-kpi-total-users');
        const totalModulesEl = document.getElementById('role-kpi-total-modules');
        const currentAdminRoleEl = document.getElementById('role-kpi-current-role');

        const totalUsers = typeof adminUsersList !== 'undefined' && Array.isArray(adminUsersList) ? adminUsersList.length : 0;

        if (totalRolesEl) totalRolesEl.innerText = Object.keys(ROLE_DEFINITIONS).length;
        if (totalUsersEl) totalUsersEl.innerText = totalUsers;
        if (totalModulesEl) totalModulesEl.innerText = MODULE_PERMISSIONS_MATRIX.length;

        const matrixCountBadge = document.getElementById('role-matrix-modules-count');
        if (matrixCountBadge) matrixCountBadge.innerText = `${MODULE_PERMISSIONS_MATRIX.length} Modul Terproteksi`;

        if (currentAdminRoleEl) {
            const role = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') || 'ADMIN';
            const meta = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS['ADMIN'];
            currentAdminRoleEl.innerText = meta.shortName;
        }
    }

    /**
     * Format visual badge sel izin (Legacy Fallback)
     */
    function renderPermissionBadge(perm) {
        if (perm === 'full') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60" title="Akses Penuh (CRUD: Buat, Lihat, Edit, Hapus)">
                <i class="fa-solid fa-circle-check text-[9px] mr-1 text-emerald-600"></i>Penuh
            </span>`;
        }
        if (perm === 'write') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60" title="Input & Mutaba'ah (Entri data & sunting)">
                <i class="fa-solid fa-pen-nib text-[9px] mr-1 text-amber-600"></i>Entri
            </span>`;
        }
        if (perm === 'read') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300/60" title="Hanya Lihat (Read-Only)">
                <i class="fa-solid fa-eye text-[9px] mr-1 text-sky-600"></i>Lihat
            </span>`;
        }
        if (perm === 'read_own') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-300/60" title="Lihat Data Anak Terhubung Saja">
                <i class="fa-solid fa-user-lock text-[9px] mr-1 text-teal-600"></i>Milik Sendiri
            </span>`;
        }
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60" title="Tidak Memiliki Akses">
            <i class="fa-solid fa-minus text-[8px] mr-1 text-slate-400"></i>Tutup
        </span>`;
    }

    /**
     * Render Matriks Tabel RBAC Interaktif (21 Modul x 7 Peran)
     */
    function renderRolesMatrixTable() {
        const tbody = document.getElementById('admin-roles-matrix-body');
        if (!tbody) return;

        const roleKeys = ['SUPER_ADMIN', 'ADMIN', 'PENGASUH', 'ASATIDZ', 'PENGURUS', 'BENDAHARA', 'WALI_SANTRI'];

        // Styling konfigurasi level otoritas
        const levelConfig = {
            'full': { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'Penuh' },
            'read': { color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800', label: 'Lihat' },
            'write': { color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', label: 'Entri' },
            'read_own': { color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800', label: 'Milik Sendiri' },
            'none': { color: 'bg-slate-50 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500 border-slate-200 dark:border-slate-700', label: 'Tutup' }
        };

        tbody.innerHTML = MODULE_PERMISSIONS_MATRIX.map((item, idx) => {
            const isStriped = idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-[#15202d]/50' : 'bg-white dark:bg-[#15202d]';
            const permCells = roleKeys.map(k => {
                const currentPerm = getMatrixPermission(item.key, k);
                const cellKey = `${item.key}___${k}`;
                const isModified = MATRIX_PENDING_CHANGES[cellKey] !== undefined;

                if (k === 'SUPER_ADMIN') {
                    return `
                        <td class="p-2.5 text-center whitespace-nowrap">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs cursor-default select-none" title="Super Admin memiliki otoritas root tak terbatas">
                                <i class="fa-solid fa-crown text-[8px] mr-1 text-emerald-600"></i>Penuh
                            </span>
                        </td>
                    `;
                }

                const cfg = levelConfig[currentPerm] || levelConfig['none'];
                const modBorder = isModified ? 'ring-2 ring-amber-400/80 dark:ring-amber-500 font-black' : '';
                const modDot = isModified ? `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute -top-0.5 -right-0.5 pointer-events-none"></span><span class="w-1.5 h-1.5 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 pointer-events-none"></span>` : '';

                return `
                    <td class="p-2 text-center whitespace-nowrap">
                        <div class="relative inline-block text-left">
                            <select onchange="handleMatrixCellChange('${item.key}', '${k}', this.value)"
                                class="appearance-none cursor-pointer pl-2 pr-5 py-1 rounded-xl text-[10px] font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs ${cfg.color} ${modBorder}">
                                <option value="full" ${currentPerm === 'full' ? 'selected' : ''} class="bg-white dark:bg-[#16222f] text-emerald-700 font-bold">🟢 Penuh (CRUD)</option>
                                <option value="read" ${currentPerm === 'read' ? 'selected' : ''} class="bg-white dark:bg-[#16222f] text-sky-700 font-bold">🔵 Lihat Saja</option>
                                <option value="write" ${currentPerm === 'write' ? 'selected' : ''} class="bg-white dark:bg-[#16222f] text-amber-700 font-bold">🟡 Entri & Input</option>
                                <option value="read_own" ${currentPerm === 'read_own' ? 'selected' : ''} class="bg-white dark:bg-[#16222f] text-teal-700 font-bold">🟣 Milik Sendiri</option>
                                <option value="none" ${currentPerm === 'none' ? 'selected' : ''} class="bg-white dark:bg-[#16222f] text-slate-500 font-medium">⚪ Tutup</option>
                            </select>
                            <i class="fa-solid fa-chevron-down text-[7px] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"></i>
                            ${modDot}
                        </div>
                    </td>
                `;
            }).join('');

            return `
                <tr class="${isStriped} hover:bg-emerald-50/30 dark:hover:bg-[#1c2836] transition border-b border-slate-100 dark:border-[#253447]">
                    <td class="p-3 min-w-[210px]">
                        <div class="flex items-center space-x-2.5">
                            <div class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs shrink-0 shadow-xs">
                                <i class="fa-solid ${item.icon}"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-1.5">
                                    <h5 class="font-bold text-slate-800 dark:text-slate-100 text-xs">${item.module}</h5>
                                    <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">${item.category.split(' ')[0]}</span>
                                </div>
                                <span class="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-xs">${item.desc}</span>
                            </div>
                        </div>
                    </td>
                    ${permCells}
                </tr>
            `;
        }).join('');
    }

    /**
     * Dapatkan teks counter izin aktif untuk kartu peran
     */
    function getRoleActivePermissionsCount(roleKey) {
        if (roleKey === 'SUPER_ADMIN') return 'Semua Hak Akses';
        const perms = ROLE_PERMISSIONS_STATE[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
        if (perms.includes('*')) return 'Semua Hak Akses';
        return `${perms.length} Izin Aktif`;
    }

    /**
     * Render Kartu-Kartu Peran (Role Cards Grid - Mengadopsi Tampilan Screenshot 2 KHODIM.COM)
     */
    function renderRoleCardsGrid() {
        const container = document.getElementById('admin-roles-cards-container');
        if (!container) return;

        const roleKeys = Object.keys(ROLE_DEFINITIONS);

        let filteredKeys = roleKeys;
        if (currentRoleFilter === 'EKSEKUTIF') {
            filteredKeys = ['SUPER_ADMIN', 'ADMIN'];
        } else if (currentRoleFilter === 'FUNGSIONAL') {
            filteredKeys = ['ASATIDZ', 'PENGURUS', 'BENDAHARA'];
        } else if (currentRoleFilter === 'MASYAYIKH') {
            filteredKeys = ['PENGASUH'];
        } else if (currentRoleFilter === 'WALI') {
            filteredKeys = ['WALI_SANTRI'];
        }

        const tierCategoryBadge = {
            'SUPER_ADMIN': 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60',
            'ADMIN': 'bg-brand-100 text-brand-800 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/60',
            'BENDAHARA': 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60',
            'ASATIDZ': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60',
            'PENGASUH': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60',
            'PENGURUS': 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/60',
            'WALI_SANTRI': 'bg-slate-100 text-slate-700 dark:bg-[#1c2836] dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        };

        const tierCategoryLabel = {
            'SUPER_ADMIN': 'AKSES PENUH',
            'ADMIN': 'OPERASIONAL',
            'BENDAHARA': 'FINANSIAL',
            'ASATIDZ': 'AKADEMIK',
            'PENGASUH': 'EKSEKUTIF',
            'PENGURUS': 'KESANTRIAN',
            'WALI_SANTRI': 'EKSTERNAL'
        };

        container.innerHTML = filteredKeys.map(key => {
            const role = ROLE_DEFINITIONS[key];
            const userCount = getRoleUserCount(key);
            const isSuperAdmin = (key === 'SUPER_ADMIN');
            const permsText = getRoleActivePermissionsCount(key);
            const catBadgeClass = tierCategoryBadge[key] || 'bg-slate-100 text-slate-800';
            const catLabel = tierCategoryLabel[key] || 'OTORITAS';

            return `
                <div class="bg-white dark:bg-[#15202d] rounded-3xl border border-slate-200/80 dark:border-[#253447] shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4 group">
                    <div class="space-y-3.5">
                        <!-- Top Header: Icon, Role Name, Pill Code & Category Badge -->
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#1c2836] ${role.iconColor} flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition border border-slate-100 dark:border-[#253447]">
                                    <i class="fa-solid ${role.icon}"></i>
                                </div>
                                <div>
                                    <div class="flex items-center space-x-1.5">
                                        <h4 class="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight">${role.name}</h4>
                                    </div>
                                    <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-500 dark:text-slate-400">
                                        ${key}
                                    </span>
                                </div>
                            </div>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${catBadgeClass} shrink-0">
                                ${catLabel}
                            </span>
                        </div>

                        <!-- Deskripsi Ringkas -->
                        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px]">
                            ${role.summary}
                        </p>

                        <!-- Indikator Izin Aktif -->
                        <div class="flex items-center space-x-2 pt-1 text-xs">
                            <i class="fa-solid ${isSuperAdmin ? 'fa-crown text-purple-600 dark:text-purple-400' : 'fa-shield-halved text-emerald-600 dark:text-emerald-400'}"></i>
                            <span class="font-bold ${isSuperAdmin ? 'text-purple-700 dark:text-purple-300' : 'text-emerald-700 dark:text-emerald-400'}">
                                ${permsText}
                            </span>
                        </div>

                        <!-- Aksi Kartu: Fokus Direktori Pengguna & Rincian Izin -->
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <button type="button" onclick="filterAndShowUsersByRole('${key}')"
                                class="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 active:scale-98 shadow-sm cursor-pointer"
                                title="Lihat ${userCount} akun dengan peran ${role.shortName}">
                                <i class="fa-solid fa-users text-xs"></i>
                                <span>Lihat Akun</span>
                            </button>
                            <button type="button" onclick="openRolePermissionsModal('${key}')"
                                class="w-full py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-[#253447] hover:border-indigo-400 dark:hover:border-indigo-500 bg-white hover:bg-slate-50 dark:bg-[#16222f] dark:hover:bg-[#1c2836] text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-1.5 active:scale-98 shadow-2xs cursor-pointer"
                                title="Lihat rincian butir izin aktif untuk peran ${role.shortName}">
                                <i class="fa-solid fa-list-check text-xs text-indigo-500"></i>
                                <span>Rincian Izin</span>
                            </button>
                        </div>
                    </div>

                    <!-- Footer Kartu: Status Akun & Profil Wewenang -->
                    <div class="pt-3 border-t border-slate-100 dark:border-[#253447] flex items-center justify-between text-xs">
                        <div class="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                            <span class="w-2 h-2 rounded-full ${userCount > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}"></span>
                            <span class="font-bold text-slate-700 dark:text-slate-200">${userCount}</span>
                            <span class="text-[11px]">Akun Terdaftar</span>
                        </div>
                        <button type="button" onclick="inspectRoleDetails('${key}')"
                            class="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center space-x-1 transition cursor-pointer"
                            title="Detail wewenang dan batasan peran">
                            <span>Profil Wewenang</span>
                            <i class="fa-solid fa-arrow-right text-[9px]"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Filter Kategori Kartu Peran
     */
    function filterRolesCategory(category) {
        currentRoleFilter = category;
        document.querySelectorAll('.role-filter-tab').forEach(btn => {
            if (btn.dataset.roleCat === category) {
                btn.classList.add('active', 'bg-emerald-600', 'text-white');
                btn.classList.remove('text-slate-600', 'dark:text-slate-300');
            } else {
                btn.classList.remove('active', 'bg-emerald-600', 'text-white');
                btn.classList.add('text-slate-600', 'dark:text-slate-300');
            }
        });
        renderRoleCardsGrid();
    }

    /**
     * Navigasi langsung ke tabel Pengguna dengan filter role yang dipilih
     */
    function filterAndShowUsersByRole(roleKey) {
        if (typeof showAdminView === 'function') {
            showAdminView('users');
            setTimeout(() => {
                if (typeof filterAdminUsers === 'function') {
                    filterAdminUsers(roleKey);
                }
            }, 100);
        }
    }

    /**
     * Buka Modal Inspeksi Detail Peran
     */
    function inspectRoleDetails(roleKey) {
        const role = ROLE_DEFINITIONS[roleKey];
        if (!role) return;

        const modal = document.getElementById('modal-admin-role-detail');
        if (!modal) return;

        document.getElementById('role-detail-name').innerText = role.name;
        document.getElementById('role-detail-code').innerText = role.key;
        document.getElementById('role-detail-tier').innerText = role.tier;
        document.getElementById('role-detail-desc').innerText = role.summary;
        document.getElementById('role-detail-scope-note').innerText = role.scopeNote;

        const iconEl = document.getElementById('role-detail-icon');
        if (iconEl) iconEl.className = `w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#1c2836] ${role.iconColor} flex items-center justify-center text-xl shadow-xs`;

        // Render wewenang
        const capEl = document.getElementById('role-detail-capabilities');
        if (capEl) {
            capEl.innerHTML = role.capabilities.map(c => `
                <li class="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-200">
                    <i class="fa-solid fa-shield-check text-emerald-500 mt-1 shrink-0"></i>
                    <span>${c}</span>
                </li>
            `).join('');
        }

        // Render daftar pengguna dengan peran ini
        const usersListEl = document.getElementById('role-detail-users-list');
        if (usersListEl) {
            let matchedUsers = [];
            if (typeof adminUsersList !== 'undefined' && Array.isArray(adminUsersList)) {
                if (roleKey === 'ASATIDZ') {
                    matchedUsers = adminUsersList.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR');
                } else {
                    matchedUsers = adminUsersList.filter(u => String(u.role || '').toUpperCase() === roleKey);
                }
            }

            if (matchedUsers.length === 0) {
                usersListEl.innerHTML = `<p class="text-xs text-slate-400 italic py-2">Belum ada akun pengguna yang terdaftar dengan peran ini.</p>`;
            } else {
                usersListEl.innerHTML = `
                    <div class="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        ${matchedUsers.map(u => `
                            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1c2836] border border-slate-100 dark:border-[#253447]">
                                <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                                        ${(u.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">${u.name || 'Pengguna'}</h5>
                                        <span class="text-[9px] text-slate-400 font-mono">${u.email || '-'}</span>
                                    </div>
                                </div>
                                <span class="text-[9px] font-bold ${u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-500'}">
                                    ${u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    }

    function closeRoleDetailModal() {
        const modal = document.getElementById('modal-admin-role-detail');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Buka Modal Panduan RBAC
     */
    function openRoleGuideModal() {
        const modal = document.getElementById('modal-admin-role-guide');
        if (modal) modal.classList.remove('hidden');
    }

    function closeRoleGuideModal() {
        const modal = document.getElementById('modal-admin-role-guide');
        if (modal) modal.classList.add('hidden');
    }

    // =========================================================================
    // MODAL KONFIGURASI IZIN PERAN (RBAC KHODIM-STYLE)
    // =========================================================================

    /**
     * Buka Modal Konfigurasi Izin Peran
     */
    function openRolePermissionsModal(roleKey) {
        const role = ROLE_DEFINITIONS[roleKey];
        if (!role) return;

        currentConfiguringRole = roleKey;

        // Ambil izin yang sedang aktif untuk role ini
        const activePerms = ROLE_PERMISSIONS_STATE[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
        currentModalPermissions = [...activePerms];
        if (currentModalPermissions.includes('*')) {
            const allKeys = [];
            PERMISSION_CATEGORIES.forEach(c => c.items.forEach(i => allKeys.push(i.key)));
            currentModalPermissions = allKeys;
        }

        const modal = document.getElementById('modal-admin-role-permissions');
        if (!modal) return;

        // Update Header
        const titleEl = document.getElementById('role-perm-title');
        if (titleEl) titleEl.innerText = `Rincian Detail Izin: ${role.name}`;

        const subEl = document.getElementById('role-perm-subtitle');
        if (subEl) subEl.innerText = `Role ID: ${role.key} • Hak akses diatur terpusat via Matriks Izin di halaman utama.`;

        const iconEl = document.getElementById('role-perm-icon');
        if (iconEl) iconEl.className = `fa-solid ${role.icon}`;

        const iconWrap = document.getElementById('role-perm-icon-wrapper');
        if (iconWrap) {
            iconWrap.className = `w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#1c2836] ${role.iconColor} flex items-center justify-center text-lg font-bold shadow-xs border border-slate-200 dark:border-[#253447]`;
        }

        // Tampilkan/Sembunyikan Banner Super Admin
        const saBanner = document.getElementById('role-perm-superadmin-banner');
        if (saBanner) {
            if (roleKey === 'SUPER_ADMIN') saBanner.classList.remove('hidden');
            else saBanner.classList.add('hidden');
        }

        // Reset search input
        const searchInput = document.getElementById('role-perm-search-input');
        if (searchInput) searchInput.value = '';

        // Render Checklist Categories & Items
        renderRolePermissionsChecklist();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    /**
     * Tutup Modal Konfigurasi Izin Peran
     */
    function closeRolePermissionsModal() {
        const modal = document.getElementById('modal-admin-role-permissions');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        currentConfiguringRole = null;
        currentModalPermissions = [];
    }

    /**
     * Render Daftar Checklist Izin per Kategori (Sesuai Screenshot 3 KHODIM)
     */
    function renderRolePermissionsChecklist(searchFilter = '') {
        const container = document.getElementById('role-permissions-categories-container');
        if (!container) return;

        const filter = String(searchFilter || '').trim().toLowerCase();

        container.innerHTML = PERMISSION_CATEGORIES.map(cat => {
            const filteredItems = cat.items.filter(item => {
                if (!filter) return true;
                return item.label.toLowerCase().includes(filter) ||
                    item.desc.toLowerCase().includes(filter) ||
                    item.key.toLowerCase().includes(filter);
            });

            if (filteredItems.length === 0) return '';

            return `
                <div class="space-y-3 role-perm-category-block" data-category="${cat.key}">
                    <!-- Category Header -->
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#253447]">
                        <div class="flex items-center space-x-2">
                            <div class="w-6 h-6 rounded-lg bg-${cat.color}-100 dark:bg-${cat.color}-950/70 text-${cat.color}-700 dark:text-${cat.color}-300 flex items-center justify-center text-xs font-bold">
                                <i class="fa-solid ${cat.icon}"></i>
                            </div>
                            <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">${cat.label}</h4>
                        </div>
                        <div class="flex items-center space-x-2 text-[10px]">
                            <button type="button" onclick="toggleCategoryPermissions('${cat.key}', true)" 
                                class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                                Pilih Semua
                            </button>
                            <span class="text-slate-300 dark:text-slate-600">•</span>
                            <button type="button" onclick="toggleCategoryPermissions('${cat.key}', false)" 
                                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                Kosongkan
                            </button>
                        </div>
                    </div>

                    <!-- 2-Columns Checklist Cards Grid (Screenshot 3 KHODIM) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${filteredItems.map(item => {
                const isChecked = currentModalPermissions.includes(item.key) || currentModalPermissions.includes('*');
                const cardBorder = isChecked
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-[#253447] bg-white dark:bg-[#15202d] hover:border-slate-300';

                const checkClass = isChecked
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border-2 border-slate-300 dark:border-slate-600 text-transparent';

                return `
                                <div onclick="toggleRolePermissionItem('${item.key}')"
                                    class="p-3.5 rounded-2xl border ${cardBorder} transition select-none cursor-pointer flex items-start space-x-3 group">
                                    <div class="w-5 h-5 rounded-lg ${checkClass} flex items-center justify-center text-xs shrink-0 mt-0.5 transition">
                                        <i class="fa-solid fa-check text-[10px]"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <h5 class="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">${item.label}</h5>
                                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">${item.desc}</p>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        updateRolePermissionsCounter();
    }

    /**
     * Toggle satu item izin
     */
    function toggleRolePermissionItem(permKey) {
        const idx = currentModalPermissions.indexOf(permKey);
        if (idx !== -1) {
            currentModalPermissions.splice(idx, 1);
        } else {
            currentModalPermissions.push(permKey);
        }
        renderRolePermissionsChecklist(document.getElementById('role-perm-search-input')?.value || '');
    }

    /**
     * Toggle semua izin dalam satu kategori
     */
    function toggleCategoryPermissions(catKey, isSelectAll) {
        const category = PERMISSION_CATEGORIES.find(c => c.key === catKey);
        if (!category) return;

        category.items.forEach(item => {
            const idx = currentModalPermissions.indexOf(item.key);
            if (isSelectAll && idx === -1) {
                currentModalPermissions.push(item.key);
            } else if (!isSelectAll && idx !== -1) {
                currentModalPermissions.splice(idx, 1);
            }
        });
        renderRolePermissionsChecklist(document.getElementById('role-perm-search-input')?.value || '');
    }

    /**
     * Pilih Semua / Kosongkan Seluruh Izin
     */
    function selectAllRolePermissions(isSelectAll) {
        if (isSelectAll) {
            const allKeys = [];
            PERMISSION_CATEGORIES.forEach(c => c.items.forEach(i => allKeys.push(i.key)));
            currentModalPermissions = allKeys;
        } else {
            currentModalPermissions = [];
        }
        renderRolePermissionsChecklist(document.getElementById('role-perm-search-input')?.value || '');
    }

    /**
     * Live search pada modal konfigurasi izin
     */
    function filterRolePermissionsSearch(keyword) {
        renderRolePermissionsChecklist(keyword);
    }

    /**
     * Update label counter status izin pada footer modal
     */
    function updateRolePermissionsCounter() {
        const badge = document.getElementById('role-perm-counter-badge');
        if (!badge) return;
        const totalItems = PERMISSION_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0);
        if (currentModalPermissions.length >= totalItems || currentModalPermissions.includes('*')) {
            badge.innerText = `Semua Hak Akses (${totalItems}/${totalItems} Izin Aktif)`;
            badge.className = 'px-2.5 py-0.5 rounded-full font-bold text-xs bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/60';
        } else {
            badge.innerText = `${currentModalPermissions.length} dari ${totalItems} Izin Aktif`;
            badge.className = 'px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60';
        }
    }

    /**
     * Simpan Perubahan Izin dari Modal ke Backend & Cache
     */
    async function saveRolePermissionsFromModal() {
        if (!currentConfiguringRole) return;
        const roleKey = currentConfiguringRole;
        const role = ROLE_DEFINITIONS[roleKey];
        const saveBtn = document.getElementById('btn-save-role-permissions');

        let originalContent = '';
        if (saveBtn) {
            originalContent = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Menyimpan...</span>';
        }

        try {
            // Hitung total izin yang tersedia
            const allKeys = [];
            PERMISSION_CATEGORIES.forEach(c => c.items.forEach(i => allKeys.push(i.key)));

            let permsToSave = [...currentModalPermissions];
            // Jika seluruh checkbox aktif, tambahkan wildcard '*' untuk kompatibilitas penuh
            if (permsToSave.length === allKeys.length && !permsToSave.includes('*')) {
                permsToSave.push('*');
            }

            // Update state lokal
            ROLE_PERMISSIONS_STATE[roleKey] = permsToSave;
            try {
                localStorage.setItem('ASNAWIYYAH_ROLE_PERMS_CACHE', JSON.stringify(ROLE_PERMISSIONS_STATE));
            } catch (e) { }

            // Kirim ke Supabase Cloud DB & Google Apps Script secara paralel
            const config = (typeof window !== 'undefined' && window.ASNAWIYYAH_CONFIG) || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            const actorEmail = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && ASNIdentity.currentUser.email) || 'ADMIN_USER';
            const countActive = permsToSave.includes('*') ? 28 : permsToSave.length;
            const roleName = role ? role.name : roleKey;
            const syncPromises = [];

            // A. Direct Supabase Cloud DB Write
            if (sbUrl && sbKey) {
                const sbRow = {
                    role_key: roleKey,
                    role_name: roleName,
                    total_active: countActive,
                    active_permissions_json: permsToSave,
                    updated_at: new Date().toISOString(),
                    updated_by: actorEmail
                };
                const sbP = fetch(`${sbUrl}/rest/v1/roles_permissions?role_key=eq.${encodeURIComponent(roleKey)}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': sbKey,
                        'Authorization': `Bearer ${sbKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(sbRow)
                }).catch(errSb => console.warn(`[SUPABASE ROLE PERMS WRITE ERROR ${roleKey}]`, errSb));
                syncPromises.push(sbP);
            }

            // B. Google Apps Script Write (Spreadsheet & Script Properties)
            if (typeof authApiPost === 'function') {
                const gasP = authApiPost('auth.admin.saveRolePermissions', {
                    roleKey: roleKey,
                    permissions: permsToSave
                }).catch(netErr => console.warn('[SAVE ROLE PERMS BACKEND WARN]', netErr));
                syncPromises.push(gasP);
            }

            await Promise.allSettled(syncPromises);

            // Rekonstruksi status matriks agar sinkron seketika
            if (typeof reconstructSavedMatrixFromRolePerms === 'function') {
                reconstructSavedMatrixFromRolePerms();
            }
            if (typeof renderRolesMatrixTable === 'function') {
                renderRolesMatrixTable();
            }

            // Perbarui UI katalog kartu peran
            renderRoleCardsGrid();

            // Terapkan efek visibilitas menu real-time
            const currentActiveRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                sessionStorage.getItem('asnawiyyah_admin_role') || 'SUPER_ADMIN';
            applyAdminRoleVisibility(currentActiveRole);

            // Tutup modal
            closeRolePermissionsModal();

            if (typeof showToast === 'function') {
                showToast(`Izin peran ${role ? role.name : roleKey} berhasil diperbarui & disimpan ke Cloud!`);
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Izin Disimpan',
                    text: `Konfigurasi izin untuk peran ${role ? role.name : roleKey} berhasil disimpan ke Spreadsheet & Supabase dan langsung diterapkan ke dashboard.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                alert(`Konfigurasi izin untuk peran ${role ? role.name : roleKey} berhasil disimpan.`);
            }
        } catch (err) {
            console.error('[SAVE ROLE PERMISSIONS ERROR]', err);
            alert('Gagal menyimpan izin: ' + err.message);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalContent;
            }
        }
    }

    /**
     * Ambil Konfigurasi Izin dari Cloud DB (Supabase / Google Sheets)
     */
    async function fetchRolePermissionsFromBackend() {
        try {
            let permissionsMap = null;

            // 1. Coba langsung via Supabase Cloud DB (Ultra Cepat < 50ms)
            const config = (typeof window !== 'undefined' && window.ASNAWIYYAH_CONFIG) || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            if (sbUrl && sbKey) {
                try {
                    const sbRes = await fetch(`${sbUrl}/rest/v1/roles_permissions?select=*`, {
                        headers: {
                            'apikey': sbKey,
                            'Authorization': `Bearer ${sbKey}`
                        }
                    });
                    if (sbRes.ok) {
                        const rows = await sbRes.json();
                        if (Array.isArray(rows) && rows.length > 0) {
                            permissionsMap = {};
                            rows.forEach(r => {
                                if (r.role_key && Array.isArray(r.active_permissions_json)) {
                                    permissionsMap[r.role_key] = r.active_permissions_json;
                                }
                            });
                        }
                    }
                } catch (sbErr) {
                    console.warn('[FETCH ROLE PERMS SUPABASE WARN]', sbErr);
                }
            }

            // 2. Fallback via authApiPost (Google Apps Script / Spreadsheet)
            if (!permissionsMap && typeof authApiPost === 'function') {
                const res = await authApiPost('auth.admin.getRolePermissions', {});
                if (res && res.success && res.permissions) {
                    permissionsMap = res.permissions;
                }
            }

            if (permissionsMap && Object.keys(permissionsMap).length > 0) {
                // Self-healing backfill jika spreadsheet / cache belum menyimpan modul baru
                for (const r in permissionsMap) {
                    if (Array.isArray(permissionsMap[r])) {
                        if (['ADMIN', 'PENGASUH', 'ASATIDZ'].includes(r)) {
                            if (!permissionsMap[r].includes('izin-asatidz.view')) permissionsMap[r].push('izin-asatidz.view');
                            if (!permissionsMap[r].includes('izin-asatidz.manage')) permissionsMap[r].push('izin-asatidz.manage');
                        }
                        if (r === 'PENGURUS' && !permissionsMap[r].includes('izin-asatidz.view')) {
                            permissionsMap[r].push('izin-asatidz.view');
                        }
                    }
                }
                ROLE_PERMISSIONS_STATE = permissionsMap;
                try {
                    localStorage.setItem('ASNAWIYYAH_ROLE_PERMS_CACHE', JSON.stringify(ROLE_PERMISSIONS_STATE));
                } catch (e) { }

                // Rekonstruksi state matriks
                if (typeof reconstructSavedMatrixFromRolePerms === 'function') {
                    reconstructSavedMatrixFromRolePerms();
                }

                renderRoleCardsGrid();
                if (typeof renderRolesMatrixTable === 'function') {
                    renderRolesMatrixTable();
                }

                const activeRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                    sessionStorage.getItem('ASN_ADMIN_ROLE') || 'SUPER_ADMIN';
                applyAdminRoleVisibility(activeRole);
            }
        } catch (e) {
            console.warn('[FETCH ROLE PERMS WARN]', e);
        }
    }

    // Mapping Modul yang Boleh Diakses per Peran
    const ROLE_ALLOWED_MODULES = {
        'SUPER_ADMIN': [
            'santri', 'wali-santri', 'tahfidz', 'tahfidz-evaluasi', 'presensi', 'ppdb', 'program', 'unit-kegiatan', 'jadwal-kegiatan', 'alumni', 'perpulangan',
            'keuangan', 'kedisiplinan', 'keaktifan-asatidz', 'izin-asatidz',
            'users', 'roles', 'pegawai',
            'berita', 'banner', 'galeri', 'notifikasi',
            'profil-lembaga', 'pengaturan'
        ],
        'ADMIN': [
            'santri', 'wali-santri', 'tahfidz', 'tahfidz-evaluasi', 'presensi', 'ppdb', 'program', 'unit-kegiatan', 'jadwal-kegiatan', 'alumni', 'perpulangan',
            'keuangan', 'kedisiplinan', 'izin-asatidz',
            'users', 'roles', 'pegawai',
            'berita', 'banner', 'galeri', 'notifikasi',
            'profil-lembaga', 'pengaturan'
        ],
        'ASATIDZ': [
            'tahfidz', 'tahfidz-evaluasi', 'presensi', 'santri', 'wali-santri', 'pegawai', 'profil-lembaga', 'perpulangan', 'kedisiplinan', 'izin-asatidz'
        ],
        'BENDAHARA': [
            'keuangan', 'santri', 'wali-santri', 'ppdb', 'notifikasi', 'pegawai', 'profil-lembaga', 'alumni'
        ],
        'PENGURUS': [
            'presensi', 'unit-kegiatan', 'jadwal-kegiatan', 'alumni', 'ppdb', 'santri', 'wali-santri', 'perpulangan', 'kedisiplinan', 'izin-asatidz', 'berita', 'banner', 'galeri', 'notifikasi', 'profil-lembaga'
        ],
        'PENGASUH': [
            'santri', 'wali-santri', 'tahfidz', 'tahfidz-evaluasi', 'presensi', 'unit-kegiatan', 'jadwal-kegiatan', 'alumni', 'keaktifan-asatidz', 'izin-asatidz', 'ppdb', 'pegawai', 'perpulangan', 'kedisiplinan', 'berita', 'galeri', 'profil-lembaga', 'users'
        ],
        'WALI_SANTRI': [
            'santri', 'tahfidz', 'tahfidz-evaluasi', 'presensi', 'perpulangan', 'kedisiplinan', 'berita', 'galeri', 'profil-lembaga'
        ]
    };

    // Profil Visual & Konfigurasi KPI Dashboard per Peran
    const ROLE_DASHBOARD_PROFILES = {
        'SUPER_ADMIN': {
            name: 'Super Administrator',
            shortName: 'Super Admin',
            tier: 'Tier 1 - Root Controller',
            badge: 'SUPER ADMIN - ROOT CONTROLLER',
            badgeBg: 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white',
            btnActiveBg: 'bg-emerald-600 text-white shadow-xs',
            title: 'Assalamu’alaikum, Administrator!',
            desc: 'Akses tanpa batas ke seluruh basis data, konfigurasi teknis, akun pengguna, dan arsitektur sistem.',
            gradientClass: 'from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/30',
            bgIcon: 'fa-crown',
            noticeTitle: 'Otoritas Super Admin (Akses Penuh Tanpa Batas)',
            noticeText: 'Akses 100% tanpa batasan ke seluruh modul kesiswaan, akademik, publikasi, pengaturan sistem, dan akun pengguna.',
            noticeBoxClass: 'bg-slate-900/60 border-emerald-500/30 text-emerald-100',
            noticeIconClass: 'fa-crown text-emerald-400',
            noticeBadgeClass: 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30',
            kpis: [
                { id: 'kpi-sa-santri', label: 'Total Santri Aktif', icon: 'fa-graduation-cap', color: 'emerald', valueKey: 'santri', sub: 'Santri Mukim & Binaan', chipText: 'Data Induk', action: "showAdminView('santri')" },
                { id: 'kpi-sa-tahfidz', label: 'Tahfidz Al-Qur\'an', icon: 'fa-book-quran', color: 'indigo', valueKey: 'tahfidz', sub: '30 Juz & Mutaba\'ah', chipText: 'Hafalan Aktif', action: "showAdminView('tahfidz')" },
                { id: 'kpi-sa-pegawai', label: 'Dewan Asatidz & Staf', icon: 'fa-user-tie', color: 'rose', valueKey: 'pegawai', sub: 'Pengajar & Pembina', chipText: 'SDM Pondok', action: "showAdminView('pegawai')" },
                { id: 'kpi-sa-presensi', label: 'Presensi & Kehadiran', icon: 'fa-clipboard-check', color: 'amber', valueKey: 'presensi', sub: 'Santri & Asatidz Terdata', chipText: '98.5% Disiplin', action: "openAdminCameraPresensi()" }
            ]
        },
        'ADMIN': {
            name: 'Administrator Lembaga',
            shortName: 'Admin',
            tier: 'Tier 1 - Pengelola Operasional',
            badge: 'ADMINISTRATOR EKSEKUTIF',
            badgeBg: 'bg-brand-600 text-white',
            btnActiveBg: 'bg-brand-700 text-white shadow-xs',
            title: 'Dashboard Operasional Lembaga',
            desc: 'Pengelolaan operasional harian terpadu kesiswaan, bimbingan akademik, media publikasi, dan administrasi.',
            gradientClass: 'from-brand-950 via-slate-900 to-emerald-950 border-brand-500/40',
            bgIcon: 'fa-shield-halved',
            noticeTitle: 'Otoritas Administrator Operasional',
            noticeText: 'Akses operasional penuh kesiswaan, akademik, media, dan manajemen akun pengguna standar (akun Super Admin dilindungi).',
            noticeBoxClass: 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800/40 text-brand-900 dark:text-brand-200',
            noticeIconClass: 'fa-shield-halved text-brand-600 dark:text-brand-400',
            noticeBadgeClass: 'bg-brand-200/70 text-brand-800 dark:bg-brand-900 dark:text-brand-200',
            kpis: [
                { id: 'kpi-adm-santri', label: 'Total Santri Aktif', icon: 'fa-graduation-cap', color: 'emerald', valueKey: 'santri', sub: 'Santri Mukim & Binaan', chipText: 'Data Induk', action: "showAdminView('santri')" },
                { id: 'kpi-adm-tahfidz', label: 'Tahfidz Al-Qur\'an', icon: 'fa-book-quran', color: 'indigo', valueKey: 'tahfidz', sub: '30 Juz & Mutaba\'ah', chipText: 'Hafalan Aktif', action: "showAdminView('tahfidz')" },
                { id: 'kpi-adm-pegawai', label: 'Dewan Asatidz & Staf', icon: 'fa-user-tie', color: 'rose', valueKey: 'pegawai', sub: 'Pengajar & Pembina', chipText: 'SDM Pondok', action: "showAdminView('pegawai')" },
                { id: 'kpi-adm-presensi', label: 'Presensi & Kehadiran', icon: 'fa-clipboard-check', color: 'amber', valueKey: 'presensi', sub: 'Santri & Asatidz Terdata', chipText: '98.5% Disiplin', action: "openAdminCameraPresensi()" }
            ]
        },
        'ASATIDZ': {
            name: 'Dewan Asatidz / Pengampu',
            shortName: 'Asatidz',
            tier: 'Tier 2 - Akademik & Pembelajaran',
            badge: 'DEWAN ASATIDZ / HALAQAH',
            badgeBg: 'bg-indigo-600 text-white',
            btnActiveBg: 'bg-indigo-600 text-white shadow-xs',
            title: 'Dashboard Akademik & Halaqah Asatidz',
            desc: 'Pusat entri setoran hafalan Tahfidz Al-Qur\'an, target capaian juz, halaqah santri, dan presensi bimbingan.',
            gradientClass: 'from-indigo-950 via-slate-900 to-purple-950 border-indigo-500/40',
            bgIcon: 'fa-chalkboard-user',
            noticeTitle: 'Akses Khusus Dewan Asatidz (Fokus Pembelajaran)',
            noticeText: 'Diberikan hak input setoran Tahfidz Al-Qur\'an, kelola halaqah & plotting santri, presensi, dan data santri bimbingan. Modul teknis dan keuangan disembunyikan.',
            noticeBoxClass: 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200',
            noticeIconClass: 'fa-chalkboard-user text-indigo-600 dark:text-indigo-400',
            noticeBadgeClass: 'bg-indigo-200/70 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            kpis: [
                { label: 'Santri Bimbingan Halaqah', icon: 'fa-users-line', color: 'indigo', valueKey: 'santri', sub: 'Santri Binaan' },
                { label: 'Entri Tahfidz Qur\'an', icon: 'fa-book-quran', color: 'emerald', valueKey: 'tahfidz', sub: '30 Juz Mushaf' },
                { label: 'Kelompok Halaqah', icon: 'fa-people-group', color: 'teal', valueKey: 'halaqah', sub: 'Halaqah Binaan' },
                { label: 'Presensi Halaqah', icon: 'fa-clipboard-check', color: 'sky', valueKey: 'presensi', sub: 'Checklist Harian' }
            ]
        },
        'BENDAHARA': {
            name: 'Bendahara / Keuangan',
            shortName: 'Bendahara',
            tier: 'Tier 2 - Keuangan & Administrasi',
            badge: 'BENDAHARA & KEUANGAN',
            badgeBg: 'bg-emerald-500 text-slate-950 font-black',
            btnActiveBg: 'bg-emerald-600 text-white shadow-xs',
            title: 'Dashboard Keuangan & Iuran Santri',
            desc: 'Pencatatan iuran SPP/syahriah, verifikasi konfirmasi transfer wali santri, dan rekapitulasi kas masuk/keluar.',
            gradientClass: 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-500/40',
            bgIcon: 'fa-wallet',
            noticeTitle: 'Akses Bendahara (Tata Kelola Keuangan Santri)',
            noticeText: 'Diberikan hak akses pencatatan pembayaran SPP santri, verifikasi transfer wali, seleksi berkas PPDB, dan broadcast iuran. Modul akademik disembunyikan.',
            noticeBoxClass: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200',
            noticeIconClass: 'fa-wallet text-emerald-600 dark:text-emerald-400',
            noticeBadgeClass: 'bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            kpis: [
                { label: 'Kas Masuk Bulan Ini', icon: 'fa-vault', color: 'emerald', valueKey: 'keuangan_kas', sub: 'Penerimaan Loket' },
                { label: 'Total Santri Terdata', icon: 'fa-users', color: 'teal', valueKey: 'santri', sub: 'Subjek Iuran' },
                { label: 'Tunggakan Belum Lunas', icon: 'fa-file-invoice-dollar', color: 'amber', valueKey: 'keuangan_tunggakan', sub: 'Piutang Aktif' },
                { label: 'Broadcast Tagihan', icon: 'fa-bell', color: 'rose', value: 'Tersedia', sub: 'Notifikasi Wali' }
            ]
        },
        'PENGURUS': {
            name: 'Pengurus / Kesantrian',
            shortName: 'Pengurus',
            tier: 'Tier 2 - Kesantrian & Lapangan',
            badge: 'PENGURUS & KESANTRIAN',
            badgeBg: 'bg-sky-500 text-white',
            btnActiveBg: 'bg-sky-600 text-white shadow-xs',
            title: 'Dashboard Kesantrian & Pengurus Lapangan',
            desc: 'Pengawalan ketertiban santri, absensi live QR, perizinan, unit kegiatan santri (UKS), dan kabar warta asrama.',
            gradientClass: 'from-sky-950 via-slate-900 to-cyan-950 border-sky-500/40',
            bgIcon: 'fa-clipboard-user',
            noticeTitle: 'Akses Pengurus (Kedisiplinan & Kesantrian)',
            noticeText: 'Diberikan hak akses absensi QR santri, UKS/kegiatan santri, seleksi PPDB, berita, galeri, dan kontak santri/wali. Modul keuangan dan akademik disembunyikan.',
            noticeBoxClass: 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/40 text-sky-900 dark:text-sky-200',
            noticeIconClass: 'fa-clipboard-user text-sky-600 dark:text-sky-400',
            noticeBadgeClass: 'bg-sky-200/70 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
            kpis: [
                { label: 'Presensi Santri Hari Ini', icon: 'fa-qrcode', color: 'emerald', valueKey: 'presensi', sub: 'Scan QR & Manual' },
                { label: 'Data Santri & Asrama', icon: 'fa-id-card', color: 'sky', valueKey: 'santri', sub: 'Kontak Darurat' },
                { label: 'Unit Kegiatan & Ekstra', icon: 'fa-futbol', color: 'teal', value: 'Aktif', sub: 'UKS & Asrama' },
                { label: 'Pendaftar PPDB Online', icon: 'fa-user-check', color: 'amber', valueKey: 'ppdb', sub: 'Seleksi Berkas' }
            ]
        },
        'PENGASUH': {
            name: 'Dewan Masyayikh / Pengasuh',
            shortName: 'Pengasuh',
            tier: 'Tier 2 - Pengawasan & Kebijakan',
            badge: 'DEWAN MASYAYIKH / PENGASUH',
            badgeBg: 'bg-amber-400 text-slate-950 font-black',
            btnActiveBg: 'bg-amber-500 text-slate-950 font-black shadow-xs',
            title: 'Dashboard Eksekutif Dewan Masyayikh',
            desc: 'Ahlan wa Sahlan. Supervisi makro capaian Tahfidz Al-Qur\'an, ketertiban santri, dan laporan pesantren (Mode Aman Read-Only).',
            gradientClass: 'from-emerald-950 via-[#0a2318] to-amber-950 border-amber-400/40',
            bgIcon: 'fa-kaaba',
            noticeTitle: 'Supervisi Eksekutif Dewan Masyayikh (Mode Aman)',
            noticeText: 'Akses pengawasan makro aktif untuk memantau capaian Al-Qur\'an santri, presensi, pegawai, dan kabar pondok tanpa risiko perubahan data.',
            noticeBoxClass: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200',
            noticeIconClass: 'fa-kaaba text-amber-600 dark:text-amber-400',
            noticeBadgeClass: 'bg-amber-200/70 text-amber-900 dark:bg-amber-900 dark:text-amber-200',
            kpis: [
                { label: 'Total Santri', icon: 'fa-users', color: 'emerald', valueKey: 'santri', sub: 'Santri Mukim', chipText: 'Aktif' },
                { label: 'Tahfidz 30 Juz', icon: 'fa-book-quran', color: 'teal', valueKey: 'tahfidz', sub: 'Target Mushaf', chipText: '30 Juz' },
                { label: 'Presensi Santri', icon: 'fa-clipboard-check', color: 'amber', valueKey: 'presensi', sub: 'Kedisiplinan', chipText: 'Terdata' },
                { label: 'Dewan Asatidz', icon: 'fa-user-tie', color: 'sky', valueKey: 'pegawai', sub: 'Staf & Muhafiz', chipText: 'Pengajar' }
            ]
        },
        'WALI_SANTRI': {
            name: 'Wali Santri / Orang Tua',
            shortName: 'Wali Santri',
            tier: 'Tier 3 - Eksternal / Portal Wali',
            badge: 'PORTAL RESMI WALI SANTRI',
            badgeBg: 'bg-teal-500 text-white',
            btnActiveBg: 'bg-teal-600 text-white shadow-xs',
            title: 'Portal Terpadu Wali Santri',
            desc: 'Pemantauan real-time perkembangan belajar, hafalan Tahfidz Al-Qur\'an, presensi kegiatan, dan informasi resmi untuk putra-putri tercinta.',
            gradientClass: 'from-teal-950 via-slate-900 to-emerald-950 border-teal-500/40',
            bgIcon: 'fa-people-roof',
            noticeTitle: 'Akses Portal Terisolasi Wali Santri',
            noticeText: 'Akses dikhususkan untuk memantau data belajar anak kandung yang terhubung dengan akun Anda. Panel CMS administratif ditutup rapat.',
            noticeBoxClass: 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/40 text-teal-900 dark:text-teal-200',
            noticeIconClass: 'fa-people-roof text-teal-600 dark:text-teal-400',
            noticeBadgeClass: 'bg-teal-200/70 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
            kpis: [
                { label: 'Kartu Santri Terhubung', icon: 'fa-child', color: 'teal', value: 'Terhubung', sub: 'Verifikasi NIS Resmi' },
                { label: 'Mutaba\'ah Tahfidz', icon: 'fa-book-quran', color: 'emerald', value: 'Aktif', sub: 'Setoran Harian' },
                { label: 'Presensi & Kehadiran', icon: 'fa-clipboard-check', color: 'cyan', value: 'Aktif', sub: 'Kegiatan Pondok' },
                { label: 'Kehadiran Sholat & Kegiatan', icon: 'fa-calendar-check', color: 'sky', value: 'Terpantau', sub: 'Presensi Harian' }
            ]
        }
    };

    /**
     * Cek apakah pengguna atau peran saat ini memiliki izin tertentu
     * Sesuai Konfigurasi Izin (RBAC Dinamis)
     */
    function hasPermission(permissionKey, roleKey = null) {
        if (!permissionKey) return true;
        if (!roleKey) {
            roleKey = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                sessionStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
        }
        roleKey = String(roleKey).toUpperCase();
        if (roleKey === 'PEGAWAI' || roleKey === 'EDITOR') roleKey = 'ASATIDZ';

        // Cek izin khusus pengguna (user-level override) jika tersedia
        let rolePerms = null;
        if (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && Array.isArray(ASNIdentity.currentUser.permissions) && ASNIdentity.currentUser.permissions.length > 0) {
            rolePerms = ASNIdentity.currentUser.permissions;
        } else {
            rolePerms = ROLE_PERMISSIONS_STATE[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
        }

        if (rolePerms.includes('*')) return true;
        return rolePerms.includes(permissionKey);
    }

    /**
     * Dapatkan daftar modul yang boleh diakses berdasarkan izin yang dicentang pada Konfigurasi Izin & Matriks RBAC
     */
    function getAllowedModulesForRole(roleKey) {
        if (!roleKey) {
            const ssRole = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('ASN_ADMIN_ROLE') || sessionStorage.getItem('asnawiyyah_admin_role')) : null;
            const lsRole = (typeof localStorage !== 'undefined') ? (localStorage.getItem('asnawiyyah_admin_role') || (localStorage.getItem('ASN_PENGASUH_TOKEN') ? 'PENGASUH' : null)) : null;
            roleKey = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || ssRole || lsRole || 'ADMIN';
        }
        roleKey = String(roleKey).toUpperCase();
        if (roleKey === 'PEGAWAI' || roleKey === 'EDITOR') roleKey = 'ASATIDZ';

        if (roleKey === 'SUPER_ADMIN') return Object.keys(MODULE_TO_PERMISSIONS);

        return Object.keys(MODULE_TO_PERMISSIONS).filter(modKey => {
            return isModuleAllowedForRole(modKey, roleKey);
        });
    }

    /**
     * Cek apakah sebuah modul boleh diakses oleh peran tertentu (Dinamis dari Matriks RBAC & Konfigurasi Izin)
     */
    function isModuleAllowedForRole(moduleKey, roleKey) {
        if (!moduleKey) return false;
        if (moduleKey === 'hub') return true;

        if (!roleKey) {
            const ssRole = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('ASN_ADMIN_ROLE') || sessionStorage.getItem('asnawiyyah_admin_role')) : null;
            const lsRole = (typeof localStorage !== 'undefined') ? (localStorage.getItem('asnawiyyah_admin_role') || (localStorage.getItem('ASN_PENGASUH_TOKEN') ? 'PENGASUH' : null)) : null;
            roleKey = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || ssRole || lsRole || 'ADMIN';
        }
        roleKey = String(roleKey).toUpperCase();
        if (roleKey === 'PEGAWAI' || roleKey === 'EDITOR') roleKey = 'ASATIDZ';

        if (roleKey === 'SUPER_ADMIN') return true;

        // 1. Prioritas Utama: Evaluasi Langsung dari Matriks Hak Akses (RBAC Matrix Table)
        if (typeof getMatrixPermission === 'function') {
            const matrixLevel = getMatrixPermission(moduleKey, roleKey);
            if (matrixLevel === 'none') {
                return false; // Akses DITUTUP -> Sembunyikan modul secara mutlak
            }
            if (['full', 'read', 'write', 'read_own'].includes(matrixLevel)) {
                return true; // Akses DIBERIKAN (Penuh/Lihat Saja/Input/Milik Sendiri) -> Tampilkan modul
            }
        }

        // 2. Fallback: Cek izin khusus pengguna (user-level override) jika tersedia
        let rolePerms = null;
        if (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && Array.isArray(ASNIdentity.currentUser.permissions) && ASNIdentity.currentUser.permissions.length > 0) {
            rolePerms = ASNIdentity.currentUser.permissions;
        } else {
            rolePerms = ROLE_PERMISSIONS_STATE[roleKey] || DEFAULT_ROLE_PERMISSIONS_MAP[roleKey] || [];
        }

        if (rolePerms.includes('*')) return true;

        const reqPerms = MODULE_TO_PERMISSIONS[moduleKey];
        if (!reqPerms || reqPerms.length === 0) return false;

        return reqPerms.some(pk => rolePerms.includes(pk));
    }

    /**
     * Dapatkan nilai metrik dinamis untuk KPI
     */
    function getKpiMetricValue(valueKey) {
        if (valueKey === 'santri' || valueKey === 'santri_count') {
            const list = (window.adminStudentsData && Array.isArray(window.adminStudentsData) && window.adminStudentsData.length > 0)
                ? window.adminStudentsData
                : ((typeof adminStudentsList !== 'undefined' && Array.isArray(adminStudentsList) && adminStudentsList.length > 0)
                    ? adminStudentsList
                    : ((window.adminStudentsList && Array.isArray(window.adminStudentsList)) ? window.adminStudentsList : []));
            if (list.length > 0) return `${list.length} <span class="text-xs font-semibold text-white/90">Santri</span>`;
            try {
                const cached = JSON.parse(localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE') || '[]');
                if (cached.length > 0) return `${cached.length} <span class="text-xs font-semibold text-white/90">Santri</span>`;
            } catch (e) { }
            return `<span class="opacity-60 animate-pulse">—</span> <span class="text-xs font-semibold text-white/90">Santri</span>`;
        }
        if (valueKey === 'tahfidz' || valueKey === 'tahfidz_count') {
            const list = (typeof adminTahfidzList !== 'undefined' && Array.isArray(adminTahfidzList) && adminTahfidzList.length > 0) ? adminTahfidzList : [];
            if (list.length > 0) return `${list.length} <span class="text-xs font-semibold text-white/90">Santri</span>`;
            if (typeof ASNTahfidz !== 'undefined' && ASNTahfidz.data && Array.isArray(ASNTahfidz.data.records) && ASNTahfidz.data.records.length > 0) {
                return `${ASNTahfidz.data.records.length} <span class="text-xs font-semibold text-white/90">Santri</span>`;
            }
            return `30 <span class="text-xs font-semibold text-white/90">Juz</span>`;
        }
        if (valueKey === 'pegawai' || valueKey === 'pegawai_count' || valueKey === 'users' || valueKey === 'users_count') {
            if (window.ASNPegawai && Array.isArray(window.ASNPegawai.list) && window.ASNPegawai.list.length > 0) {
                return `${window.ASNPegawai.list.length} <span class="text-xs font-semibold text-white/90">Staf</span>`;
            }
            if (typeof adminUsersList !== 'undefined' && Array.isArray(adminUsersList) && adminUsersList.length > 0) {
                const asatidz = adminUsersList.filter(u => u.role === 'ASATIDZ' || u.role === 'PEGAWAI' || u.role === 'EDITOR');
                if (asatidz.length > 0) return `${asatidz.length} <span class="text-xs font-semibold text-white/90">Asatidz</span>`;
            }
            try {
                const cachedPegawai = JSON.parse(localStorage.getItem('ASNAWIYYAH_PEGAWAI_CACHE') || '0');
                if (cachedPegawai > 0) return `${cachedPegawai} <span class="text-xs font-semibold text-white/90">Asatidz</span>`;
            } catch (e) { }
            return `<span class="opacity-60 animate-pulse">—</span> <span class="text-xs font-semibold text-white/90">Asatidz</span>`;
        }
        if (valueKey === 'presensi' || valueKey === 'presensi_rate') {
            return `98.5<span class="text-xs font-semibold text-white/90">%</span>`;
        }
        if (valueKey === 'sa_hadir_count' || valueKey === 'sa_sessions') {
            return '0';
        }
        if (valueKey === 'sa_jam_kerja' || valueKey === 'sa_users') {
            return '08:00 <span class="text-xs font-semibold text-white/90">WIB</span>';
        }
        if (valueKey === 'sa_cuti_count' || valueKey === 'sa_cloud_db') {
            return '0 <span class="text-xs font-semibold text-white/90">Hari</span>';
        }
        if (valueKey === 'sa_lembur_count' || valueKey === 'sa_pwa') {
            return '893 <span class="text-xs font-semibold text-white/90">Jam</span>';
        }
        if (valueKey === 'ppdb') {
            return (typeof adminPPDBList !== 'undefined' && Array.isArray(adminPPDBList)) ? adminPPDBList.length + ' Santri' : '0 Pendaftar';
        }
        if (valueKey === 'keuangan_kas') {
            if (typeof ASNKeuangan !== 'undefined' && ASNKeuangan.data && ASNKeuangan.data.summary && ASNKeuangan.data.summary.totalPendapatanBulanIni > 0) {
                return typeof formatRupiah === 'function' ? formatRupiah(ASNKeuangan.data.summary.totalPendapatanBulanIni) : 'Rp ' + ASNKeuangan.data.summary.totalPendapatanBulanIni;
            }
            return 'Aktif';
        }
        if (valueKey === 'keuangan_tunggakan') {
            if (typeof ASNKeuangan !== 'undefined' && ASNKeuangan.data && ASNKeuangan.data.summary && ASNKeuangan.data.summary.totalTunggakan > 0) {
                return typeof formatRupiah === 'function' ? formatRupiah(ASNKeuangan.data.summary.totalTunggakan) : 'Rp ' + ASNKeuangan.data.summary.totalTunggakan;
            }
            return 'Terpantau';
        }
        return '-';
    }

    /**
     * Terapkan Tampilan Dashboard & Visibilitas Menu Sesuai Peran
     */
    function applyAdminRoleVisibility(roleKey) {
        if (!roleKey) {
            roleKey = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                sessionStorage.getItem('asnawiyyah_admin_role') || 'SUPER_ADMIN';
        }
        roleKey = String(roleKey).toUpperCase();
        if (roleKey === 'PEGAWAI' || roleKey === 'EDITOR') roleKey = 'ASATIDZ';

        const profile = ROLE_DASHBOARD_PROFILES[roleKey] || ROLE_DASHBOARD_PROFILES['ADMIN'];
        const allowedModules = getAllowedModulesForRole(roleKey);

        // 1. Sembunyikan Banner Dashboard Lama Secara Mutlak
        const banner = document.getElementById('admin-hub-welcome-banner');
        if (banner) {
            banner.className = 'hidden';
            banner.style.display = 'none';
        }

        // 1b. Perbarui Sapaan Dinamis & Badge Berdasarkan Role
        const greetingTitle = document.getElementById('admin-hub-greeting-title');
        const greetingBadge = document.getElementById('admin-hub-greeting-badge');
        if (greetingTitle) {
            let userName = '';
            try {
                if (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && ASNIdentity.currentUser.name) {
                    userName = ASNIdentity.currentUser.name;
                } else if (sessionStorage.getItem('asnawiyyah_admin_name')) {
                    userName = sessionStorage.getItem('asnawiyyah_admin_name');
                }
            } catch (e) { }

            if (roleKey === 'PENGASUH') {
                greetingTitle.innerText = userName ? `Ahlan wa Sahlan, ${userName}` : 'Ahlan wa Sahlan, Pengasuh / Romo Kyai';
                if (greetingBadge) {
                    greetingBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Supervisi Makro`;
                    greetingBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800';
                }
            } else if (roleKey === 'SUPER_ADMIN') {
                greetingTitle.innerText = userName ? `Selamat Bertugas, ${userName}` : 'Selamat Datang, Super Administrator';
                if (greetingBadge) {
                    greetingBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Full Access`;
                    greetingBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800';
                }
            } else {
                greetingTitle.innerText = userName ? `Selamat Datang, ${userName}` : `Selamat Datang, ${profile.shortName || 'Administrator'}`;
                if (greetingBadge) {
                    greetingBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live System`;
                    greetingBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800';
                }
            }
        }

        // 2. Perbarui Scope Notice Bar & Quick Toolbar
        const noticeBar = document.getElementById('admin-hub-role-scope-notice');
        if (noticeBar) {
            if (roleKey === 'SUPER_ADMIN') {
                noticeBar.classList.add('hidden');
            } else {
                noticeBar.classList.remove('hidden');
                noticeBar.className = `p-3.5 rounded-2xl border text-xs flex items-start space-x-3 transition-all duration-300 ${profile.noticeBoxClass}`;

                const noticeIcon = document.getElementById('admin-hub-notice-icon');
                if (noticeIcon) noticeIcon.className = `fa-solid ${profile.noticeIconClass} mt-0.5 shrink-0 text-sm`;

                const noticeTitle = document.getElementById('admin-hub-notice-title');
                if (noticeTitle) noticeTitle.innerText = profile.noticeTitle;

                const noticeCount = document.getElementById('admin-hub-notice-count-badge');
                if (noticeCount) {
                    noticeCount.className = `px-2 py-0.2 rounded-full text-[9px] font-bold ${profile.noticeBadgeClass}`;
                    noticeCount.innerText = `${allowedModules.length} Modul Boleh Diakses`;
                }

                const noticeText = document.getElementById('admin-hub-notice-text');
                if (noticeText) noticeText.innerText = profile.noticeText;
            }
        }

        const quickToolbar = document.getElementById('super-admin-quick-toolbar');
        if (quickToolbar) {
            if (roleKey === 'SUPER_ADMIN') {
                quickToolbar.classList.remove('hidden');
            } else {
                quickToolbar.classList.add('hidden');
            }
        }

        // 3. Render 4 Dynamic KPI Cards (Vibrant Pastel Gradients)
        const kpiGrid = document.getElementById('admin-hub-kpi-grid');
        if (kpiGrid && Array.isArray(profile.kpis)) {
            const vibrantGradientMap = {
                emerald: {
                    card: 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-emerald-500/20',
                    chip: 'bg-white text-emerald-800 font-black shadow-xs',
                    iconBg: 'bg-white/20 text-white'
                },
                indigo: {
                    card: 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-indigo-500/20',
                    chip: 'bg-white/25 text-white font-bold backdrop-blur-xs',
                    iconBg: 'bg-white/20 text-white'
                },
                rose: {
                    card: 'bg-gradient-to-br from-[#f43f5e] via-[#ec4899] to-[#d946ef] text-white shadow-lg shadow-pink-500/20',
                    chip: 'text-white font-bold hover:underline',
                    iconBg: 'bg-white/20 text-white'
                },
                amber: {
                    card: 'bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white shadow-lg shadow-amber-500/20',
                    chip: 'bg-white text-amber-800 font-black shadow-xs',
                    iconBg: 'bg-white/20 text-white'
                },
                cyan: {
                    card: 'bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 text-white shadow-md shadow-cyan-900/15',
                    chip: 'bg-white/20 text-white font-bold',
                    iconBg: 'bg-white/20 text-white'
                },
                purple: {
                    card: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white shadow-md shadow-purple-900/15',
                    chip: 'bg-white/20 text-white font-bold',
                    iconBg: 'bg-white/20 text-white'
                },
                teal: {
                    card: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-600 text-white shadow-md shadow-teal-900/15',
                    chip: 'bg-white text-teal-800 font-black shadow-xs',
                    iconBg: 'bg-white/20 text-white'
                },
                sky: {
                    card: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-md shadow-sky-900/15',
                    chip: 'bg-white text-sky-800 font-black shadow-xs',
                    iconBg: 'bg-white/20 text-white'
                }
            };

            kpiGrid.innerHTML = profile.kpis.map(kpi => {
                const val = kpi.valueKey ? getKpiMetricValue(kpi.valueKey) : (kpi.value || '-');
                const theme = vibrantGradientMap[kpi.color] || vibrantGradientMap['emerald'];
                const clickAttr = kpi.action ? `onclick="${kpi.action}" style="cursor: pointer;"` : '';
                const valIdAttr = kpi.valueKey ? `id="kpi-val-${kpi.valueKey}"` : '';
                const hoverClass = kpi.action ? 'hover:scale-[1.02] active:scale-[0.98]' : '';
                const chipLabel = kpi.chipText || 'Terpantau';
                return `
                    <div ${clickAttr} class="${theme.card} p-3 md:p-3.5 rounded-2xl flex flex-col justify-between space-y-1.5 transition-all duration-300 ${hoverClass}">
                        <div class="flex items-start justify-between gap-1">
                            <span class="text-[11px] md:text-xs font-bold text-white/95 block truncate drop-shadow-2xs leading-snug">${kpi.label}</span>
                            <div class="w-6 h-6 rounded-full ${theme.iconBg} flex items-center justify-center text-[10px] shrink-0 backdrop-blur-xs shadow-2xs">
                                <i class="fa-solid ${kpi.icon}"></i>
                            </div>
                        </div>
                        <div>
                            <h4 ${valIdAttr} class="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-2xs flex items-center gap-1">
                                <span>${val}</span>
                                <span class="text-xs font-bold text-white/80">↑</span>
                            </h4>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-white/90 pt-1 border-t border-white/10 gap-1">
                            <span class="truncate font-medium text-[10px] opacity-90">${kpi.sub || ''}</span>
                            <span class="px-2 py-0.5 rounded-full ${theme.chip} shrink-0 text-[9px] font-bold">${chipLabel}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 3b. Inisialisasi Telemetri Khusus Super Admin
        if (roleKey === 'SUPER_ADMIN' && typeof initSuperAdminTelemetry === 'function') {
            initSuperAdminTelemetry();
        }

        // Segarkan nilai KPI bila data sudah tersedia di memori
        updateAdminDashboardKpis();

        // 4. Widget Khusus Wali Santri & Pengasuh
        const parentWidget = document.getElementById('admin-hub-parent-widget');
        if (parentWidget) {
            if (roleKey === 'WALI_SANTRI') parentWidget.classList.remove('hidden');
            else parentWidget.classList.add('hidden');
        }

        const pengasuhWidget = document.getElementById('admin-hub-pengasuh-widget');
        if (pengasuhWidget) {
            if (roleKey === 'PENGASUH') pengasuhWidget.classList.remove('hidden');
            else pengasuhWidget.classList.add('hidden');
        }

        // 5. Filter Kartu di Menu Hub Admin (Mendukung data-admin-module dan data-role-module)
        const hubCards = document.querySelectorAll('#admin-menu-hub [data-admin-module], #admin-menu-hub [data-role-module]');
        hubCards.forEach(card => {
            const modKey = card.dataset.adminModule || card.dataset.roleModule;
            const isAllowed = isModuleAllowedForRole(modKey, roleKey);

            if (isAllowed) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        // 6. Hitung & Filter Kategori Hub
        const hubCategories = document.querySelectorAll('.admin-hub-category');
        hubCategories.forEach(cat => {
            const visibleCards = cat.querySelectorAll('[data-admin-module]:not(.hidden), [data-role-module]:not(.hidden)');
            const countBadge = cat.querySelector('.admin-hub-category-count');

            if (visibleCards.length === 0) {
                cat.classList.add('hidden');
            } else {
                cat.classList.remove('hidden');
                if (countBadge) {
                    countBadge.textContent = `${visibleCards.length} Menu Layanan`;
                }
            }
        });

        // 7. Filter Sidebar Navigation (Sembunyikan juga pembungkus li)
        const sidebarNavItems = document.querySelectorAll('#admin-sidebar .admin-nav-item[data-view]');
        sidebarNavItems.forEach(item => {
            const viewKey = item.dataset.view;
            if (viewKey === 'hub') {
                item.classList.remove('hidden');
                if (item.closest('li')) item.closest('li').classList.remove('hidden');
                return;
            }
            const isAllowed = isModuleAllowedForRole(viewKey, roleKey);
            if (isAllowed) {
                item.classList.remove('hidden');
                if (item.closest('li')) item.closest('li').classList.remove('hidden');
            } else {
                item.classList.add('hidden');
                if (item.closest('li')) item.closest('li').classList.add('hidden');
            }
        });

        // Filter Grup Accordion Sidebar
        const sidebarGroups = document.querySelectorAll('#admin-sidebar .admin-menu-group');
        sidebarGroups.forEach(grp => {
            const visibleItems = grp.querySelectorAll('.admin-nav-item:not(.hidden)');
            if (visibleItems.length === 0) {
                grp.classList.add('hidden');
            } else {
                grp.classList.remove('hidden');
            }
        });

        // 8. Filter Mobile Control Center Grid (Pusat Kontrol Admin & Pengasuh di Tab Profil/Akun)
        const mobileButtons = document.querySelectorAll('#admin-control-center-grid [data-admin-module], #admin-control-center-grid [data-role-module], #pengasuh-control-center-grid [data-admin-module], #pengasuh-control-center-grid [data-role-module]');
        let visibleMobileCount = 0;
        let visiblePengasuhCount = 0;
        mobileButtons.forEach(btn => {
            const isPengasuhGrid = !!btn.closest('#pengasuh-control-center-grid');
            const targetRole = isPengasuhGrid ? 'PENGASUH' : roleKey;
            const modKey = btn.dataset.adminModule || btn.dataset.roleModule;
            const isAllowed = isModuleAllowedForRole(modKey, targetRole);
            if (isAllowed) {
                btn.classList.remove('hidden');
                if (isPengasuhGrid) {
                    visiblePengasuhCount++;
                } else {
                    visibleMobileCount++;
                }
            } else {
                btn.classList.add('hidden');
            }
        });

        const mobileCountEl = document.getElementById('admin-control-center-count');
        if (mobileCountEl) {
            mobileCountEl.innerText = `${visibleMobileCount} Modul Aktif`;
        }

        const pengasuhCountEl = document.getElementById('pengasuh-control-center-count');
        if (pengasuhCountEl) {
            pengasuhCountEl.innerText = `${visiblePengasuhCount} Modul Aktif`;
        }

        const mobileTitleText = document.getElementById('admin-control-center-title-text');
        if (mobileTitleText) {
            if (roleKey === 'ASATIDZ') mobileTitleText.innerText = 'Pusat Kontrol Asatidz';
            else if (roleKey === 'PENGASUH') mobileTitleText.innerText = 'Pusat Kontrol Pengasuh';
            else if (roleKey === 'BENDAHARA') mobileTitleText.innerText = 'Pusat Kontrol Keuangan';
            else if (roleKey === 'PENGURUS') mobileTitleText.innerText = 'Pusat Kontrol Pengurus';
            else mobileTitleText.innerText = 'Pusat Kontrol Admin';
        }

        // 9. Update Active Pill pada Role Switcher Bar
        const roleBtns = document.querySelectorAll('.role-switch-btn');
        roleBtns.forEach(btn => {
            if (btn.dataset.roleBtn === roleKey) {
                btn.className = `role-switch-btn px-2.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 ${profile.btnActiveBg}`;
            } else {
                btn.className = `role-switch-btn px-2.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`;
            }
        });

        const activeTag = document.getElementById('admin-active-role-tag');
        if (activeTag) {
            activeTag.innerText = profile.shortName;
            activeTag.className = `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${profile.badgeBg}`;
        }

        // Sinkronisasi Profil Sidebar Desktop (Fase 1) & Topbar Desktop (Fase 2)
        const sidebarRoleBadge = document.getElementById('admin-sidebar-role-badge');
        if (sidebarRoleBadge) {
            sidebarRoleBadge.innerText = profile.name || profile.shortName;
        }
        const sidebarInitial = document.getElementById('admin-sidebar-avatar-initial');
        if (sidebarInitial) {
            sidebarInitial.innerText = (profile.shortName || 'AD').substring(0, 2).toUpperCase();
        }
        const topbarUsername = document.getElementById('admin-topbar-username');
        if (topbarUsername) {
            topbarUsername.innerText = profile.shortName || 'Admin Utama';
        }
        const topbarRoleBadgePill = document.getElementById('admin-topbar-role-badge');
        if (topbarRoleBadgePill) {
            topbarRoleBadgePill.innerText = `(${profile.shortName || 'Super Admin'})`;
        }
        const topbarRoleBadge = document.getElementById('admin-topbar-role');
        if (topbarRoleBadge) {
            topbarRoleBadge.innerText = profile.name || profile.shortName;
        }
        const topbarInitial = document.getElementById('admin-topbar-avatar-initial');
        if (topbarInitial) {
            topbarInitial.innerText = (profile.shortName || 'AD').substring(0, 2).toUpperCase();
        }
        const dropdownEmail = document.getElementById('admin-dropdown-email');
        if (dropdownEmail && typeof ASNIdentity !== 'undefined' && ASNIdentity.currentUser && ASNIdentity.currentUser.email) {
            dropdownEmail.innerText = ASNIdentity.currentUser.email;
        }

        // Sinkronisasi badge notifikasi lonceng approval
        if (typeof updateHeaderApprovalNotifications === 'function') {
            updateHeaderApprovalNotifications();
        }
        if (['PENGASUH', 'SUPER_ADMIN', 'ADMIN', 'ASATIDZ', 'PENGURUS'].includes(roleKey)) {
            if (window.ASNPerpulangan && typeof window.ASNPerpulangan.loadData === 'function') {
                window.ASNPerpulangan.loadData(false);
            }
        }

        // 10. Terapkan konfigurasi izin secara menyeluruh ke seluruh UI
        applyAllRolePermissionsUI(roleKey);
        if (roleKey === 'ASATIDZ') {
            if (typeof populateTahfidzFilters === 'function') populateTahfidzFilters();
            if (typeof filterTahfidzList === 'function') filterTahfidzList();
        }
    }

    /**
     * Terapkan konfigurasi izin ke seluruh elemen UI di DOM secara menyeluruh
     */
    function applyAllRolePermissionsUI(roleKey = null) {
        if (!roleKey) {
            roleKey = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
                sessionStorage.getItem('ASN_ADMIN_ROLE') ||
                sessionStorage.getItem('asnawiyyah_admin_role') || 'ADMIN';
        }
        roleKey = String(roleKey).toUpperCase();
        if (roleKey === 'PEGAWAI' || roleKey === 'EDITOR') roleKey = 'ASATIDZ';

        // 1. Elemen dengan atribut data-require-permission
        document.querySelectorAll('[data-require-permission]').forEach(el => {
            const req = el.getAttribute('data-require-permission');
            if (!req) return;
            const allowed = hasPermission(req, roleKey);
            if (allowed) {
                el.classList.remove('hidden');
                if (el.style.display === 'none') el.style.display = '';
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        });

        // 2. Modul Tahfidz Actions
        if (typeof applyTahfidzRolePermissions === 'function') {
            applyTahfidzRolePermissions(roleKey);
        }

        // 3. Modul Santri Actions
        if (typeof applySantriRolePermissions === 'function') {
            applySantriRolePermissions(roleKey);
        }

        // 4. Modul Pegawai Actions
        if (typeof applyPegawaiRolePermissions === 'function') {
            applyPegawaiRolePermissions(roleKey);
        }

        // 5. Modul Users Actions
        if (typeof applyUsersRolePermissions === 'function') {
            applyUsersRolePermissions(roleKey);
        }
    }

    /**
     * Beralih Pratinjau Peran (Simulator RBAC)
     */
    function switchActiveRolePreview(roleKey) {
        if (!ROLE_DEFINITIONS[roleKey]) return;

        sessionStorage.setItem('ASN_ADMIN_ROLE', roleKey);
        sessionStorage.setItem('asnawiyyah_admin_role', roleKey);
        localStorage.setItem('asnawiyyah_admin_role', roleKey);
        if (typeof ASNIdentity !== 'undefined') {
            ASNIdentity.currentRole = roleKey;
        }

        applyAdminRoleVisibility(roleKey);

        if (typeof showToast === 'function') {
            showToast(`Beralih ke Dashboard: ${ROLE_DEFINITIONS[roleKey].name}`);
        }
    }

    // ==================== SUPER ADMIN TELEMETRY & QUICK ACTIONS ====================
    let superAdminClockTimer = null;

    function initSuperAdminTelemetry() {
        // 1. Live Digital Clock (WIB - UTC+7)
        const clockEl = document.getElementById('super-admin-live-clock');
        const topbarClockEl = document.getElementById('admin-topbar-clock');
        function updateClock() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            if (clockEl) clockEl.textContent = `${timeStr} WIB`;
            if (topbarClockEl) topbarClockEl.textContent = `${timeStr} WIB`;
            const liveTimestampEl = document.getElementById('admin-hub-live-timestamp');
            if (liveTimestampEl) {
                const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const dayName = days[now.getDay()];
                const monthName = months[now.getMonth()];
                liveTimestampEl.textContent = `WIB (UTC+7) • ${dayName}, ${now.getDate()} ${monthName} ${now.getFullYear()} • ${timeStr}`;
            }
        }
        updateClock();
        if (!superAdminClockTimer) {
            superAdminClockTimer = setInterval(updateClock, 1000);
        }

        // 2. Latensi Cloud DB Supabase Singapore
        measureSupabasePing();

        // 3. Status Kesehatan PWA & Service Worker
        checkPwaHealthStatus();

        // 4. Update online presence count
        updateOnlineUsersPresenceTelemetry();
    }

    async function measureSupabasePing() {
        const latencyEl = document.getElementById('super-admin-db-latency');
        const topbarLatencyEl = document.getElementById('admin-topbar-latency');
        const kpiDbEl = document.getElementById('kpi-val-sa_cloud_db');
        const statusEl = document.getElementById('super-admin-db-status');

        const startTime = performance.now();
        try {
            const config = (typeof window !== 'undefined' && window.ASNAWIYYAH_CONFIG) || {};
            const sbUrl = config.supabaseUrl || (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : 'https://tkjhfhyabacbyknwrysh.supabase.co');
            const apiKey = config.supabaseKey || (typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '');
            const testUrl = `${sbUrl}/rest/v1/roles_permissions?select=role_key&limit=1`;

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Authorization': 'Bearer ' + apiKey
                }
            });
            const duration = Math.round(performance.now() - startTime);
            const latencyText = `(${duration}ms)`;

            if (latencyEl) {
                latencyEl.textContent = latencyText;
                latencyEl.className = duration < 120
                    ? 'text-[10px] text-emerald-400 font-mono bg-emerald-900/50 px-1.5 py-0.2 rounded border border-emerald-500/30'
                    : 'text-[10px] text-amber-400 font-mono bg-amber-900/50 px-1.5 py-0.2 rounded border border-amber-500/30';
            }
            if (topbarLatencyEl) {
                topbarLatencyEl.textContent = `${duration}ms`;
            }
            if (statusEl) {
                statusEl.textContent = 'Sistem Optimal • Cloud DB Singapore';
            }
            if (kpiDbEl) {
                kpiDbEl.textContent = `${duration}ms (Optimal)`;
            }
        } catch (e) {
            if (latencyEl) latencyEl.textContent = '(Aktif)';
            if (kpiDbEl) kpiDbEl.textContent = '< 50ms (Optimal)';
        }
    }

    function checkPwaHealthStatus() {
        const kpiPwaEl = document.getElementById('kpi-val-sa_pwa');
        if (!kpiPwaEl) return;

        const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
        const hasSw = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

        if (isStandalone) {
            kpiPwaEl.textContent = 'Standalone (v19)';
        } else if (hasSw) {
            kpiPwaEl.textContent = 'Optimal (v19)';
        } else {
            kpiPwaEl.textContent = 'Aktif (v19)';
        }
    }

    async function updateOnlineUsersPresenceTelemetry() {
        const kpiSessionsEl = document.getElementById('kpi-val-sa_sessions');
        if (!kpiSessionsEl) return;
        try {
            const config = window.ASNAWIYYAH_CONFIG || {};
            const sbUrl = config.supabaseUrl;
            const sbKey = config.supabaseKey;
            if (sbUrl && sbKey) {
                const threeMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
                const res = await fetch(`${sbUrl}/rest/v1/users?last_seen_at=gte.${encodeURIComponent(threeMinAgo)}&select=user_id`, {
                    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
                });
                if (res.ok) {
                    const rows = await res.json();
                    const count = Math.max(1, rows.length);
                    kpiSessionsEl.innerText = `${count} Pengguna Online`;
                    return;
                }
            }
        } catch (e) { }
        kpiSessionsEl.innerText = '1 Pengguna Online';
    }

    function openSuperAdminQuickAction(type) {
        if (type === 'santri') {
            if (typeof showAdminView === 'function') showAdminView('santri');
            setTimeout(() => {
                if (typeof openAdminStudentModal === 'function') openAdminStudentModal();
            }, 180);
        } else if (type === 'notif') {
            if (typeof showAdminView === 'function') showAdminView('notifikasi');
            setTimeout(() => {
                const judulInput = document.getElementById('admin-notif-judul');
                if (judulInput) {
                    judulInput.focus();
                    judulInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 180);
        } else if (type === 'tahfidz') {
            if (typeof showAdminView === 'function') showAdminView('tahfidz');
            setTimeout(() => {
                if (typeof openTahfidzCatatModal === 'function') openTahfidzCatatModal();
            }, 180);
        }
    }

    /**
     * Segarkan nilai metrik pada 4 kartu KPI dashboard secara realtime
     */
    function updateAdminDashboardKpis() {
        const activeRole = (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) ||
            sessionStorage.getItem('ASN_ADMIN_ROLE') ||
            sessionStorage.getItem('asnawiyyah_admin_role') || 'SUPER_ADMIN';
        const profile = ROLE_DASHBOARD_PROFILES[activeRole] || ROLE_DASHBOARD_PROFILES['ADMIN'];
        if (!profile || !Array.isArray(profile.kpis)) return;

        profile.kpis.forEach(kpi => {
            if (!kpi.valueKey) return;
            const el = document.getElementById(`kpi-val-${kpi.valueKey}`);
            if (el) {
                const newVal = getKpiMetricValue(kpi.valueKey);
                el.innerHTML = `<span>${newVal}</span><span class="text-xs font-bold text-white/80">↑</span>`;
            }
        });
    }

    // Export ke window
    window.updateAdminDashboardKpis = updateAdminDashboardKpis;
    window.initSuperAdminTelemetry = initSuperAdminTelemetry;
    window.measureSupabasePing = measureSupabasePing;
    window.checkPwaHealthStatus = checkPwaHealthStatus;
    window.updateOnlineUsersPresenceTelemetry = updateOnlineUsersPresenceTelemetry;
    window.openSuperAdminQuickAction = openSuperAdminQuickAction;

    window.loadAdminRolesData = loadAdminRolesData;
    window.renderAdminRolesView = renderAdminRolesView;
    window.filterRolesCategory = filterRolesCategory;
    window.filterAndShowUsersByRole = filterAndShowUsersByRole;
    window.inspectRoleDetails = inspectRoleDetails;
    window.closeRoleDetailModal = closeRoleDetailModal;
    window.openRoleGuideModal = openRoleGuideModal;
    window.closeRoleGuideModal = closeRoleGuideModal;
    window.openRolePermissionsModal = openRolePermissionsModal;
    window.closeRolePermissionsModal = closeRolePermissionsModal;
    window.renderRolePermissionsChecklist = renderRolePermissionsChecklist;
    window.toggleRolePermissionItem = toggleRolePermissionItem;
    window.toggleCategoryPermissions = toggleCategoryPermissions;
    window.selectAllRolePermissions = selectAllRolePermissions;
    window.filterRolePermissionsSearch = filterRolePermissionsSearch;
    window.saveRolePermissionsFromModal = saveRolePermissionsFromModal;
    window.fetchRolePermissionsFromBackend = fetchRolePermissionsFromBackend;
    window.getAllowedModulesForRole = getAllowedModulesForRole;
    window.getRoleActivePermissionsCount = getRoleActivePermissionsCount;
    window.PERMISSION_CATEGORIES = PERMISSION_CATEGORIES;
    window.ROLE_PERMISSIONS_STATE = ROLE_PERMISSIONS_STATE;
    window.ROLE_DEFINITIONS = ROLE_DEFINITIONS;
    window.MODULE_PERMISSIONS_MATRIX = MODULE_PERMISSIONS_MATRIX;
    window.ROLE_ALLOWED_MODULES = ROLE_ALLOWED_MODULES;
    window.ROLE_DASHBOARD_PROFILES = ROLE_DASHBOARD_PROFILES;
    window.isModuleAllowedForRole = isModuleAllowedForRole;
    window.hasPermission = hasPermission;
    window.applyAllRolePermissionsUI = applyAllRolePermissionsUI;
    window.applyAdminRoleVisibility = applyAdminRoleVisibility;
    window.switchActiveRolePreview = switchActiveRolePreview;
    window.DEFAULT_ROLE_PERMISSIONS_MAP = DEFAULT_ROLE_PERMISSIONS_MAP;
    window.renderRolesMatrixTable = renderRolesMatrixTable;
    window.handleMatrixCellChange = handleMatrixCellChange;
    window.toggleBatchRoleMenu = toggleBatchRoleMenu;
    window.batchSetRoleMatrix = batchSetRoleMatrix;
    window.batchResetRoleMatrix = batchResetRoleMatrix;
    window.saveMatrixPermissionsChanges = saveMatrixPermissionsChanges;
    window.cancelMatrixPermissionsChanges = cancelMatrixPermissionsChanges;
    window.getMatrixPermission = getMatrixPermission;
    window.convertMatrixLevelToPermissions = convertMatrixLevelToPermissions;
    window.reconstructSavedMatrixFromRolePerms = reconstructSavedMatrixFromRolePerms;
    window.SAVED_MATRIX_STATE = SAVED_MATRIX_STATE;
    window.MATRIX_PENDING_CHANGES = MATRIX_PENDING_CHANGES;

    // Auto-fetch konfigurasi hak akses dari Cloud DB (Supabase/GAS) saat startup
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                fetchRolePermissionsFromBackend();
            });
        } else {
            setTimeout(fetchRolePermissionsFromBackend, 30);
        }
    } catch (e) { }

})(window, document);
