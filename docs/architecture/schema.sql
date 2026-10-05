-- ============================================================================
-- PPTQ ASNAWIYYAH DATABASE SCHEMA v2.1 (POSTGRESQL / SUPABASE)
-- HASIL AUDIT MENYELURUH 26 TABEL SPREADSHEET RESMI PPTQ ASNAWIYYAH
-- ============================================================================
-- Skema ini dirancang 100% siap impor (ready-to-import) untuk seluruh 26 tab
-- spreadsheet, baik tabel primer modern, tabel warisan (legacy), maupun cache.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CLUSTER AUTENTIKASI, IDENTITAS & RBAC (Tab 1, 3, 4, 5, 6, 7, 8, 9, 10, 11)
-- ============================================================================

-- [TAB 1] Users (Master Identity Terpadu Phase 2B)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY, -- USR-xxx / ADM-xxx / WAL-xxx / PGS-xxx
    employee_id VARCHAR(64), -- Foreign Key ke pegawai(employee_id) jika akun milik pegawai
    email VARCHAR(128) UNIQUE,
    phone VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'PENGASUH', 'ASATIDZ', 'BENDAHARA', 'WALI_SANTRI', 'SANTRI')),
    photo_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- [TAB 3] Wali_Identities (Legacy Identity Tab / Fallback Storage)
CREATE TABLE IF NOT EXISTS wali_identities (
    identity_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128),
    phone VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'WALI_SANTRI',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    photo_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_wali_identities_email ON wali_identities(LOWER(email));

-- [TAB 4] Wali_Santri_Map / Wali_Santri_Maps (Relasi Wali ke Santri)
CREATE TABLE IF NOT EXISTS wali_santri_map (
    map_id VARCHAR(64) PRIMARY KEY, -- MAP-xxx
    wali_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    relationship VARCHAR(32) NOT NULL DEFAULT 'Wali',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wali_map_wali ON wali_santri_map(wali_id);
CREATE INDEX IF NOT EXISTS idx_wali_map_student ON wali_santri_map(student_id);

-- [TAB 5] Admin_Identities (Legacy Identity Tab / Fallback Storage)
CREATE TABLE IF NOT EXISTS admin_identities (
    identity_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'ADMIN',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    photo_url TEXT
);

-- [TAB 6] Roles_Permissions / Roles_permissions (Matrix RBAC)
CREATE TABLE IF NOT EXISTS roles_permissions (
    role_key VARCHAR(64) PRIMARY KEY, -- SUPER_ADMIN, ADMIN, dll.
    role_name VARCHAR(128) NOT NULL,
    total_active INTEGER DEFAULT 0,
    active_permissions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(128)
);

-- [TAB 7] OTP_Challenges (Sistem OTP Challenge v2)
CREATE TABLE IF NOT EXISTS otp_challenges (
    challenge_id VARCHAR(64) PRIMARY KEY,
    identity_id VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL', 'WHATSAPP', 'SMS')),
    identifier_hash VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONSUMED', 'EXPIRED', 'EXHAUSTED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    request_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_otp_identity ON otp_challenges(identity_id, status);

-- [TAB 8] Auth_Sessions (Session Store Aktif)
CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id VARCHAR(64) PRIMARY KEY, -- SES-xxx
    identity_id VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    token_version VARCHAR(32) DEFAULT 'v2'
);

CREATE INDEX IF NOT EXISTS idx_sessions_identity ON auth_sessions(identity_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON auth_sessions(expires_at);

-- [TAB 9] Auth_Audit_Log (Pencatatan Jejak Audit Keamanan)
CREATE TABLE IF NOT EXISTS auth_audit_log (
    event_id VARCHAR(64) PRIMARY KEY, -- EVT-xxx
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    event_type VARCHAR(64) NOT NULL,
    identity_id VARCHAR(128) NOT NULL,
    session_id VARCHAR(128),
    channel VARCHAR(32) DEFAULT 'SYSTEM',
    success BOOLEAN NOT NULL,
    request_id VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_identity ON auth_audit_log(identity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON auth_audit_log(timestamp DESC);

-- [TAB 10] OTP_Cache / OTP Chache (Legacy Temporary Cache)
CREATE TABLE IF NOT EXISTS otp_cache (
    email VARCHAR(128) PRIMARY KEY,
    otp VARCHAR(16) NOT NULL,
    expiry TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 11] Pengasuh_Identities (Legacy Identity Tab / Fallback Storage)
CREATE TABLE IF NOT EXISTS pengasuh_identities (
    identity_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128),
    phone VARCHAR(32),
    title_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'PENGASUH',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    photo_url TEXT
);

-- ============================================================================
-- 2. CLUSTER KESISWAAN & KEPEGAWAIAN (Tab 2, 12)
-- ============================================================================

-- [TAB 2] Students (Master Data Santri)
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(64) PRIMARY KEY, -- STD-xxx
    nis VARCHAR(32) UNIQUE NOT NULL,
    nik VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('Putra', 'Putri', 'L', 'P')),
    birth_date DATE,
    photo_url TEXT,
    program VARCHAR(128) DEFAULT 'Reguler',
    status VARCHAR(32) NOT NULL DEFAULT 'AKTIF' CHECK (status IN ('AKTIF', 'ACTIVE', 'LULUS', 'MUTASI', 'NONAKTIF', 'INACTIVE')),
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- [TAB 12] Pegawai (Master Data Asatidz & Karyawan)
CREATE TABLE IF NOT EXISTS pegawai (
    employee_id VARCHAR(64) PRIMARY KEY, -- PEG-xxx
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(64),
    gender VARCHAR(16) CHECK (gender IN ('L', 'P', 'Putra', 'Putri')),
    jabatan VARCHAR(128) NOT NULL,
    spesialisasi VARCHAR(255),
    telepon VARCHAR(32),
    email VARCHAR(128),
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CUTI', 'AKTIF', 'NONAKTIF')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pegawai_status ON pegawai(status);

-- ============================================================================
-- 3. CLUSTER TAHFIDZ AL-QUR'AN (Tab 13, 14, 15, 16, 17)
-- ============================================================================

-- [TAB 13] Tahfidz_Jadwal_Sesi (Sesi Waktu Halaqah)
CREATE TABLE IF NOT EXISTS tahfidz_jadwal_sesi (
    sesi_id VARCHAR(64) PRIMARY KEY, -- SESI-01
    nama_sesi VARCHAR(128) NOT NULL,
    jenis_sesi VARCHAR(128) NOT NULL, -- Ziyadah / Muroja'ah
    status VARCHAR(64) DEFAULT 'Aktif Digunakan',
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    hari_list VARCHAR(255) DEFAULT 'Sen,Sel,Rab,Kam,Sab,Min',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 14] Tahfidz_Halaqah (5 Kolom Standar Mubarokah)
CREATE TABLE IF NOT EXISTS tahfidz_halaqah (
    halaqah_id VARCHAR(64) PRIMARY KEY, -- HLQ-xxx
    muhafiz VARCHAR(255) NOT NULL,
    target_kurikulum VARCHAR(128) DEFAULT 'Tahfidz Standar',
    student_ids JSONB DEFAULT '[]'::jsonb, -- Array ID Santri ['STD-001', 'STD-002']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 15] Tahfidz_Target (Target Individu Santri)
CREATE TABLE IF NOT EXISTS tahfidz_target (
    student_id VARCHAR(64) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    target_ziyadah_sesi NUMERIC(5,2) DEFAULT 0.5,
    target_ziyadah_pekan NUMERIC(5,2) DEFAULT 2.5,
    target_murajaah_sesi NUMERIC(5,2) DEFAULT 2.0,
    target_murajaah_pekan NUMERIC(5,2) DEFAULT 10.0,
    target_juz INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 16] Tahfidz_Logs (Riwayat Setoran Harian - High Frequency OLTP)
CREATE TABLE IF NOT EXISTS tahfidz_logs (
    log_id VARCHAR(64) PRIMARY KEY, -- LOG-xxx / UUID
    student_id VARCHAR(64) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    nis VARCHAR(32),
    student_name VARCHAR(255) NOT NULL,
    gender VARCHAR(16),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    sesi VARCHAR(128) NOT NULL,
    tipe VARCHAR(64) NOT NULL CHECK (tipe IN ('Ziyadah', 'Muroja''ah', 'Murojaah', 'Sabaq', 'Sabqi', 'Manzil', 'Tasmi''', 'Tasmi', 'Ujian')),
    juz INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
    surah VARCHAR(128),
    halaman_list VARCHAR(255),
    total_halaman NUMERIC(6,2) NOT NULL DEFAULT 1.0,
    nilai VARCHAR(16) NOT NULL DEFAULT 'A',
    muhafiz VARCHAR(255) NOT NULL,
    catatan TEXT,
    status_setoran VARCHAR(64) NOT NULL DEFAULT 'Lancar',
    satuan VARCHAR(32) DEFAULT 'Halaman' CHECK (satuan IN ('Halaman', 'Ayat', 'Juz')),
    ayat_mulai INTEGER,
    ayat_sampai INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_student ON tahfidz_logs(student_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_logs_tanggal ON tahfidz_logs(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_logs_juz ON tahfidz_logs(juz);
CREATE INDEX IF NOT EXISTS idx_logs_muhafiz ON tahfidz_logs(muhafiz);

-- [TAB 17] Tahfidz_Capaian (Snapshot Capaian Santri - 1 Santri = 1 Baris)
CREATE TABLE IF NOT EXISTS tahfidz_capaian (
    student_id VARCHAR(64) PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    juz_aktif VARCHAR(64) DEFAULT '1',
    halaman_terakhir VARCHAR(64) DEFAULT '1',
    total_halaman_tuntas NUMERIC(7,2) DEFAULT 0,
    status_terakhir VARCHAR(64) DEFAULT 'Lancar',
    halaqah_id VARCHAR(64),
    nama_halaqah VARCHAR(128),
    muhafiz_pembina VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sabqi_halaman VARCHAR(255) DEFAULT '',
    manzil_juz VARCHAR(64) DEFAULT '',
    manzil_halaman VARCHAR(255) DEFAULT '',
    manzil_putaran VARCHAR(64) DEFAULT '0',
    total_halaman_murojaah NUMERIC(7,2) DEFAULT 0
);

-- ============================================================================
-- 4. CLUSTER CMS, PUBLIKASI & PENDAFTARAN (Tab 18, 19, 20, 21, 22, 23, 24, 25, 26)
-- ============================================================================

-- [TAB 18] Notifikasi / Notofikasi (Pop-up & Pengumuman)
CREATE TABLE IF NOT EXISTS notifikasi (
    id VARCHAR(64) PRIMARY KEY, -- NOTIF-xxx
    judul VARCHAR(255) NOT NULL,
    kategori VARCHAR(64) DEFAULT 'Pengumuman',
    tanggal VARCHAR(64),
    ringkasan TEXT,
    isi TEXT,
    gambar_url TEXT,
    is_popup BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_status ON notifikasi(status, tanggal DESC);

-- [TAB 19] Unit_Kegiatan (Unit Kegiatan Santri / UKS)
CREATE TABLE IF NOT EXISTS unit_kegiatan (
    id_kegiatan VARCHAR(64) PRIMARY KEY, -- UKS-xxx
    nama VARCHAR(255) NOT NULL,
    kategori VARCHAR(64),
    jadwal VARCHAR(128),
    deskripsi TEXT,
    gambar_url TEXT,
    urutan INTEGER DEFAULT 1,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 19.1] Jadwal_Kegiatan (Jadwal Rutinitas & Agenda Santri)
CREATE TABLE IF NOT EXISTS jadwal_kegiatan (
    id VARCHAR(64) PRIMARY KEY, -- JDW_xxx
    tipe VARCHAR(32) NOT NULL CHECK (tipe IN ('harian', 'mingguan', 'bulanan', 'tahunan')),
    waktu VARCHAR(128) NOT NULL,
    kegiatan VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    badge VARCHAR(64),
    urutan INTEGER DEFAULT 1,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jadwal_tipe_urutan ON jadwal_kegiatan(tipe, urutan ASC);
CREATE INDEX IF NOT EXISTS idx_jadwal_status ON jadwal_kegiatan(status);

-- [TAB 20] Banner (Hero Slider Beranda)
CREATE TABLE IF NOT EXISTS banner (
    id_banner VARCHAR(64) PRIMARY KEY, -- BAN-xxx
    nama_banner VARCHAR(255) NOT NULL,
    gambar_url TEXT NOT NULL,
    tipe_aksi VARCHAR(64) DEFAULT 'tab',
    target_aksi VARCHAR(255) DEFAULT 'ppdb',
    urutan INTEGER DEFAULT 1,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif', 'Draft'))
);

CREATE INDEX IF NOT EXISTS idx_banner_status ON banner(status, urutan ASC);

-- [TAB 21] Pengaturan (Key-Value Store Profil & Pengaturan Lembaga)
CREATE TABLE IF NOT EXISTS pengaturan (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    keterangan VARCHAR(255),
    update_terakhir TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 22] Berita / Kabar (Portal Berita & Artikel)
CREATE TABLE IF NOT EXISTS berita (
    news_id VARCHAR(64) PRIMARY KEY, -- NWS-xxx
    slug VARCHAR(255) UNIQUE NOT NULL,
    tanggal VARCHAR(64),
    judul VARCHAR(255) NOT NULL,
    kategori VARCHAR(64) DEFAULT 'Berita',
    ringkasan TEXT,
    isi TEXT NOT NULL,
    penulis VARCHAR(128) DEFAULT 'Admin',
    gambar_url TEXT,
    foto_url TEXT,
    status VARCHAR(32) DEFAULT 'Publish',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_berita_slug ON berita(slug);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status, tanggal DESC);

-- [TAB 23] Data_Alumni / Alumni (Database Alumni Pesantren)
CREATE TABLE IF NOT EXISTS alumni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp VARCHAR(64),
    nama_lengkap VARCHAR(255) NOT NULL,
    jenis_kelamin VARCHAR(16) NOT NULL,
    no_whatsapp VARCHAR(32) NOT NULL,
    media_sosial VARCHAR(128),
    tahun_masuk VARCHAR(16),
    tahun_lulus VARCHAR(16) NOT NULL,
    program_terakhir VARCHAR(128),
    kesibukan VARCHAR(255),
    instansi_perusahaan VARCHAR(255),
    kesan_pesan TEXT,
    provinsi VARCHAR(128),
    kabupaten VARCHAR(128),
    kecamatan VARCHAR(128),
    desa_kelurahan VARCHAR(128),
    alamat_lengkap TEXT,
    latitude VARCHAR(64),
    longitude VARCHAR(64),
    foto TEXT,
    izin_publikasi VARCHAR(32) DEFAULT 'Ya'
);

-- [TAB 24] Programs (Program Pendidikan Pesantren v2.0)
CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    badge VARCHAR(64),
    image TEXT,
    description TEXT,
    highlights_json JSONB DEFAULT '[]'::jsonb,
    detail_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(128),
    updated_by VARCHAR(128),
    published_at TIMESTAMPTZ,
    published_by VARCHAR(128),
    version INTEGER DEFAULT 1
);

-- [TAB 25] Galeri (Dokumentasi Foto & Video YouTube)
CREATE TABLE IF NOT EXISTS galeri (
    id_galeri VARCHAR(64) PRIMARY KEY, -- GLR-xxx
    judul VARCHAR(255) NOT NULL,
    kategori VARCHAR(64) DEFAULT 'Kegiatan Santri',
    keterangan TEXT,
    gambar_url TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- [TAB 26] Pendaftar (PPDB Santri Baru)
CREATE TABLE IF NOT EXISTS pendaftar_ppdb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal_daftar VARCHAR(64),
    timestamp VARCHAR(64),
    nama VARCHAR(255) NOT NULL,
    nisn VARCHAR(32) NOT NULL,
    wali VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(32),
    no_wa VARCHAR(32),
    program VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppdb_nisn ON pendaftar_ppdb(nisn);

-- ============================================================================
-- 5. ALIAS VIEWS UNTUK KOMPATIBILITAS PENAMAAN SPREADSHEET (100% SEAMLESS)
-- ============================================================================
-- View ini memastikan bahwa ekspor CSV dengan penamaan varian tetap dapat
-- di-query dengan mulus di Supabase tanpa modifikasi aplikasi.

CREATE OR REPLACE VIEW wali_santri_maps AS SELECT * FROM wali_santri_map;
CREATE OR REPLACE VIEW data_alumni AS SELECT * FROM alumni;
CREATE OR REPLACE VIEW notofikasi AS SELECT * FROM notifikasi;
CREATE OR REPLACE VIEW pendaftar AS SELECT * FROM pendaftar_ppdb;
CREATE OR REPLACE VIEW otp_chache AS SELECT * FROM otp_cache;
CREATE OR REPLACE VIEW "otp chache" AS SELECT * FROM otp_cache;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahfidz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahfidz_capaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftar_ppdb ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeri ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_kegiatan ENABLE ROW LEVEL SECURITY;

-- Publik read-only untuk portal landing page
CREATE POLICY "Public Read Active Berita" ON berita FOR SELECT USING (status = 'Publish');
CREATE POLICY "Public Read Active Banner" ON banner FOR SELECT USING (status = 'Aktif');
CREATE POLICY "Public Read Active Notifikasi" ON notifikasi FOR SELECT USING (status = 'Aktif');
CREATE POLICY "Public Read Active Galeri" ON galeri FOR SELECT USING (status = 'Aktif');
CREATE POLICY "Public Read Published Programs" ON programs FOR SELECT USING (status = 'published');
CREATE POLICY "Public Read Active Jadwal Kegiatan" ON jadwal_kegiatan FOR SELECT USING (true);
CREATE POLICY "Full Access Jadwal Kegiatan" ON jadwal_kegiatan FOR ALL USING (true) WITH CHECK (true);

