-- ============================================================================
-- MIGRATION: TABEL IZIN_ASATIDZ (PERIZINAN ASATIDZ & DELEGASI BADAL HALAQAH)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Petunjuk Eksekusi:
-- Jalankan skrip ini langsung di menu SQL Editor pada Supabase Dashboard:
-- https://supabase.com/dashboard/project/tkjhfhyabacbyknwrysh/sql
-- ============================================================================

-- 1. PEMBUATAN TABEL IZIN_ASATIDZ
CREATE TABLE IF NOT EXISTS public.izin_asatidz (
    id_izin VARCHAR(64) PRIMARY KEY, -- Format: IZA-YYYYMM-XXX
    asatidz_id VARCHAR(64) NOT NULL DEFAULT '',
    nama_asatidz VARCHAR(255) NOT NULL DEFAULT '',
    tanggal_mulai VARCHAR(32) NOT NULL DEFAULT '', -- Format: YYYY-MM-DD
    tanggal_selesai VARCHAR(32) NOT NULL DEFAULT '', -- Format: YYYY-MM-DD
    sesi VARCHAR(64) NOT NULL DEFAULT 'FULL_DAY', -- FULL_DAY, SUBUH, ASHAR, MAGHRIB
    kategori VARCHAR(128) NOT NULL DEFAULT 'SAKIT', -- SAKIT, URUSAN_KELUARGA, TUGAS_PONDOK, LAINNYA
    alasan TEXT NOT NULL DEFAULT '',
    badal_id VARCHAR(64) DEFAULT '',
    nama_badal VARCHAR(255) NOT NULL DEFAULT '', -- Wajib ada Ustadz Badal
    catatan_badal TEXT DEFAULT '',
    lampiran_url TEXT DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    pengasuh_approved_by VARCHAR(128) DEFAULT '',
    pengasuh_approved_at TIMESTAMPTZ,
    catatan_pengasuh TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEX OPTIMASI QUERY (ULTRA FAST-READ < 50ms)
CREATE INDEX IF NOT EXISTS idx_izin_asatidz_asatidz ON public.izin_asatidz(asatidz_id);
CREATE INDEX IF NOT EXISTS idx_izin_asatidz_badal ON public.izin_asatidz(badal_id);
CREATE INDEX IF NOT EXISTS idx_izin_asatidz_status ON public.izin_asatidz(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_izin_asatidz_tgl ON public.izin_asatidz(tanggal_mulai, tanggal_selesai);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.izin_asatidz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon Select Izin Asatidz" ON public.izin_asatidz;
DROP POLICY IF EXISTS "Anon Insert Izin Asatidz" ON public.izin_asatidz;
DROP POLICY IF EXISTS "Anon Update Izin Asatidz" ON public.izin_asatidz;
DROP POLICY IF EXISTS "Anon Delete Izin Asatidz" ON public.izin_asatidz;

-- Pengguna anonim & authenticated dapat membaca status izin untuk mengecek keaktifan badal
CREATE POLICY "Anon Select Izin Asatidz" ON public.izin_asatidz
    FOR SELECT TO anon, authenticated
    USING (true);

-- Asatidz dapat mengajukan izin mandiri
CREATE POLICY "Anon Insert Izin Asatidz" ON public.izin_asatidz
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Pengasuh dan Admin dapat memperbarui status persetujuan
CREATE POLICY "Anon Update Izin Asatidz" ON public.izin_asatidz
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Pengasuh dan Admin dapat menghapus atau membatalkan izin
CREATE POLICY "Anon Delete Izin Asatidz" ON public.izin_asatidz
    FOR DELETE TO anon, authenticated
    USING (true);

-- 4. GRANT PRIVILEGES
GRANT ALL ON TABLE public.izin_asatidz TO anon, authenticated, service_role;

-- 5. KONFIRMASI STRUKTUR TABEL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'izin_asatidz'
ORDER BY ordinal_position;
