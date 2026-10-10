-- ============================================================================
-- MIGRATION: TABEL IZIN_PERPULANGAN (MODUL KE-20)
-- SISTEM IZIN SANTRI & PERPULANGAN DENGAN 2-TIER APPROVAL & GATE CHECK
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Petunjuk Eksekusi:
-- Jalankan skrip ini langsung di menu SQL Editor pada Supabase Dashboard:
-- https://supabase.com/dashboard/project/tkjhfhyabacbyknwrysh/sql
-- ============================================================================

-- 1. PEMBUATAN TABEL IZIN_PERPULANGAN
CREATE TABLE IF NOT EXISTS public.izin_perpulangan (
    id_izin VARCHAR(64) PRIMARY KEY, -- Format: IZN-YYYYMMDD-XXXX
    student_id VARCHAR(64) NOT NULL,
    student_nis VARCHAR(32) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    wali_id VARCHAR(64) NOT NULL, -- ID Akun Wali Santri / Admin Pengaju
    wali_name VARCHAR(255),
    wali_phone VARCHAR(32),
    kategori VARCHAR(64) NOT NULL CHECK (kategori IN (
        'Pulang ke Rumah / Libur Terjadwal',
        'Kepentingan Mendesak Keluarga',
        'Izin Sakit / Berobat Luar',
        'Tugas / Delegasi Pondok'
    )),
    alasan TEXT NOT NULL,
    penjemput_nama VARCHAR(128),
    penjemput_hubungan VARCHAR(64) DEFAULT 'Orang Tua',
    penjemput_kontak VARCHAR(32),
    tgl_mulai VARCHAR(32) NOT NULL, -- Format: YYYY-MM-DD
    jam_mulai VARCHAR(16) NOT NULL, -- Format: HH:mm
    tgl_kembali VARCHAR(32) NOT NULL, -- Format: YYYY-MM-DD
    jam_kembali VARCHAR(16) NOT NULL, -- Format: HH:mm
    status VARCHAR(32) NOT NULL DEFAULT 'MENUNGGU_PENGURUS' CHECK (status IN (
        'MENUNGGU_PENGURUS',
        'MENUNGGU_PENGASUH',
        'DISETUJUI',
        'DITOLAK',
        'KELUAR',
        'KEMBALI',
        'TERLAMBAT'
    )),
    
    -- Tier 1 Approval: Pengurus Keamanan / Asatidz Piket
    pengurus_approved_by VARCHAR(128),
    pengurus_approved_at TIMESTAMPTZ,
    pengurus_catatan TEXT,
    
    -- Tier 2 Approval: Dewan Pengasuh
    pengasuh_approved_by VARCHAR(128),
    pengasuh_approved_at TIMESTAMPTZ,
    pengasuh_catatan TEXT,
    
    -- Alasan jika ditolak di salah satu tahapan
    alasan_penolakan TEXT,
    
    -- Gate Operations (Pos Gerbang Pondok)
    checkout_at TIMESTAMPTZ,
    checkout_petugas VARCHAR(128),
    checkin_at TIMESTAMPTZ,
    checkin_petugas VARCHAR(128),
    catatan_keterlambatan TEXT,
    
    -- Timestamp Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEX OPTIMASI QUERY
CREATE INDEX IF NOT EXISTS idx_izin_student ON public.izin_perpulangan(student_id);
CREATE INDEX IF NOT EXISTS idx_izin_nis ON public.izin_perpulangan(student_nis);
CREATE INDEX IF NOT EXISTS idx_izin_wali ON public.izin_perpulangan(wali_id);
CREATE INDEX IF NOT EXISTS idx_izin_status ON public.izin_perpulangan(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_izin_tgl_kembali ON public.izin_perpulangan(tgl_kembali);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.izin_perpulangan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Full Access Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Authenticated Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Admin Manage Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Wali Submit Izin Perpulangan" ON public.izin_perpulangan;

-- Pengguna terautentikasi dapat membaca data perizinan
CREATE POLICY "Authenticated Read Izin Perpulangan" ON public.izin_perpulangan
    FOR SELECT
    TO authenticated
    USING (true);

-- Pengurus, Asatidz, Pengasuh, dan Admin memiliki wewenang penuh mengelola dan memvalidasi
CREATE POLICY "Admin Manage Izin Perpulangan" ON public.izin_perpulangan
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. VIEW ALIAS UNTUK KOMPATIBILITAS PENAMAAN
CREATE OR REPLACE VIEW public.santri_leaves AS SELECT * FROM public.izin_perpulangan;

-- 5. KONFIRMASI STATUS TABEL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'izin_perpulangan'
ORDER BY ordinal_position;
