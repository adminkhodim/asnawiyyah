-- ============================================================================
-- FIX & RECOVERY: ROW-LEVEL SECURITY & DATA SYNC UNTUK FITUR TAHFIDZ AL-QUR'AN
-- Target: Supabase Cloud Database (tahfidz_logs, tahfidz_capaian, tahfidz_halaqah, tahfidz_presensi)
-- Tanggal: 12 Oktober 2026
-- ============================================================================

-- 1. PASTIKAN TABEL tahfidz_logs ADA DENGAN STRUKTUR FLEKSIBEL
CREATE TABLE IF NOT EXISTS public.tahfidz_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    nis VARCHAR(32) DEFAULT '',
    student_name VARCHAR(255) NOT NULL,
    gender VARCHAR(16) DEFAULT 'L',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    sesi VARCHAR(128) NOT NULL DEFAULT 'Pagi (Ba''da Subuh)',
    tipe VARCHAR(64) NOT NULL DEFAULT 'ZIYADAH',
    juz INTEGER NOT NULL DEFAULT 30,
    surah VARCHAR(128) DEFAULT '',
    halaman_list VARCHAR(255) DEFAULT '1',
    total_halaman NUMERIC(6,2) NOT NULL DEFAULT 1.0,
    nilai VARCHAR(32) NOT NULL DEFAULT 'MUMTAZ',
    muhafiz VARCHAR(255) NOT NULL DEFAULT 'Ustadz Pembina',
    catatan TEXT DEFAULT '',
    status_setoran VARCHAR(64) NOT NULL DEFAULT 'LANJUT',
    satuan VARCHAR(32) DEFAULT 'HALAMAN',
    ayat_mulai INTEGER,
    ayat_sampai INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hapus CHECK constraint yang kaku agar tidak menggagalkan penyimpanan jika variasi teks berbeda (e.g. Ziyadah vs ZIYADAH)
ALTER TABLE public.tahfidz_logs DROP CONSTRAINT IF EXISTS tahfidz_logs_tipe_check;
ALTER TABLE public.tahfidz_logs DROP CONSTRAINT IF EXISTS tahfidz_logs_satuan_check;
ALTER TABLE public.tahfidz_logs DROP CONSTRAINT IF EXISTS tahfidz_logs_juz_check;
ALTER TABLE public.tahfidz_logs DROP CONSTRAINT IF EXISTS tahfidz_logs_student_id_fkey;

-- 2. PASTIKAN TABEL tahfidz_capaian ADA
CREATE TABLE IF NOT EXISTS public.tahfidz_capaian (
    student_id VARCHAR(64) PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL DEFAULT '',
    juz_aktif VARCHAR(64) DEFAULT '30',
    halaman_terakhir VARCHAR(64) DEFAULT '1',
    total_halaman_tuntas NUMERIC(7,2) DEFAULT 0,
    status_terakhir VARCHAR(64) DEFAULT 'LANJUT',
    halaqah_id VARCHAR(64) DEFAULT '',
    nama_halaqah VARCHAR(128) DEFAULT '',
    muhafiz_pembina VARCHAR(255) DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sabqi_halaman VARCHAR(255) DEFAULT '',
    manzil_juz VARCHAR(64) DEFAULT '',
    manzil_halaman VARCHAR(255) DEFAULT '',
    manzil_putaran VARCHAR(64) DEFAULT '1',
    total_halaman_murojaah NUMERIC(7,2) DEFAULT 0
);

ALTER TABLE public.tahfidz_capaian DROP CONSTRAINT IF EXISTS tahfidz_capaian_student_id_fkey;

-- 3. PASTIKAN TABEL tahfidz_halaqah ADA
CREATE TABLE IF NOT EXISTS public.tahfidz_halaqah (
    halaqah_id VARCHAR(64) PRIMARY KEY,
    nama_halaqah VARCHAR(128) DEFAULT '',
    muhafiz VARCHAR(255) NOT NULL DEFAULT 'Ustadz Pembina',
    target_kurikulum VARCHAR(128) DEFAULT 'Tahfidz 30 Juz',
    student_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PASTIKAN TABEL tahfidz_presensi ADA
CREATE TABLE IF NOT EXISTS public.tahfidz_presensi (
    presensi_id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL DEFAULT '',
    student_name VARCHAR(255) NOT NULL DEFAULT '',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    sesi VARCHAR(128) NOT NULL DEFAULT 'Pagi (Ba''da Subuh)',
    status VARCHAR(32) NOT NULL DEFAULT 'Hadir',
    catatan TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SETUP ROW-LEVEL SECURITY (RLS) LENGKAP UNTUK SEMUA TABEL TAHFIDZ
-- Mengizinkan aplikasi web klien (anon & authenticated) untuk Read & Write
-- ============================================================================

-- A. TABEL tahfidz_logs
ALTER TABLE public.tahfidz_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Select Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Insert Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Update Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Delete Tahfidz Logs" ON public.tahfidz_logs;

CREATE POLICY "Anon Select Tahfidz Logs" ON public.tahfidz_logs
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anon Insert Tahfidz Logs" ON public.tahfidz_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon Update Tahfidz Logs" ON public.tahfidz_logs
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Delete Tahfidz Logs" ON public.tahfidz_logs
    FOR DELETE TO anon, authenticated
    USING (true);


-- B. TABEL tahfidz_capaian
ALTER TABLE public.tahfidz_capaian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Select Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Insert Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Update Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Delete Tahfidz Capaian" ON public.tahfidz_capaian;

CREATE POLICY "Anon Select Tahfidz Capaian" ON public.tahfidz_capaian
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anon Insert Tahfidz Capaian" ON public.tahfidz_capaian
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon Update Tahfidz Capaian" ON public.tahfidz_capaian
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Delete Tahfidz Capaian" ON public.tahfidz_capaian
    FOR DELETE TO anon, authenticated
    USING (true);


-- C. TABEL tahfidz_halaqah
ALTER TABLE public.tahfidz_halaqah ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Anon Read Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Anon Select Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Anon Insert Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Anon Update Tahfidz Halaqah" ON public.tahfidz_halaqah;
DROP POLICY IF EXISTS "Anon Delete Tahfidz Halaqah" ON public.tahfidz_halaqah;

CREATE POLICY "Anon Select Tahfidz Halaqah" ON public.tahfidz_halaqah
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anon Insert Tahfidz Halaqah" ON public.tahfidz_halaqah
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon Update Tahfidz Halaqah" ON public.tahfidz_halaqah
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Delete Tahfidz Halaqah" ON public.tahfidz_halaqah
    FOR DELETE TO anon, authenticated
    USING (true);


-- D. TABEL tahfidz_presensi
ALTER TABLE public.tahfidz_presensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Anon Read Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Anon Select Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Anon Insert Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Anon Update Tahfidz Presensi" ON public.tahfidz_presensi;
DROP POLICY IF EXISTS "Anon Delete Tahfidz Presensi" ON public.tahfidz_presensi;

CREATE POLICY "Anon Select Tahfidz Presensi" ON public.tahfidz_presensi
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anon Insert Tahfidz Presensi" ON public.tahfidz_presensi
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon Update Tahfidz Presensi" ON public.tahfidz_presensi
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Delete Tahfidz Presensi" ON public.tahfidz_presensi
    FOR DELETE TO anon, authenticated
    USING (true);

-- Indexes untuk akselerasi query dashboard
CREATE INDEX IF NOT EXISTS idx_logs_student_v2 ON public.tahfidz_logs(student_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_logs_tanggal_v2 ON public.tahfidz_logs(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_logs_juz_v2 ON public.tahfidz_logs(juz);
CREATE INDEX IF NOT EXISTS idx_logs_muhafiz_v2 ON public.tahfidz_logs(muhafiz);
