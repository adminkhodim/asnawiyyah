-- ============================================================================
-- SQL PERBAIKAN: AKTIFKAN HAK PUBLIKASI BERITA SUPABASE (RLS PERMISSION)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Penjelasan:
-- Aplikasi PPTQ Asnawiyyah menggunakan arsitektur Fast-Sync dari browser
-- dengan Supabase Public Anon Key.
-- Karena tabel public.berita saat ini membatasi operasi INSERT/UPDATE hanya
-- untuk role 'authenticated', request publikasi berita dari web browser
-- diblokir oleh Postgres RLS (Row Level Security).
--
-- Menjalankan script ini akan memberikan hak INSERT, UPDATE, dan DELETE
-- kepada client aplikasi (anon, authenticated) atau menonaktifkan RLS
-- agar sinkronisasi berita dari Admin & Pengasuh langsung tersimpan.
-- ============================================================================

-- Opsi Utama: Berikan izin penuh pengelolaan berita untuk anon & authenticated
ALTER TABLE IF EXISTS public.berita ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Manage Berita" ON public.berita;
DROP POLICY IF EXISTS "Anon Manage Berita" ON public.berita;
DROP POLICY IF EXISTS "Public Read Active Berita" ON public.berita;

-- 1. Izin Baca Berita
CREATE POLICY "Anon Read Berita" ON public.berita
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. Izin Tulis, Edit, & Hapus Berita
CREATE POLICY "Anon Manage Berita" ON public.berita
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- ALTERNATIF CEPAT (Jika ingin bebas hambatan seperti tabel Alumni/Pegawai):
-- ALTER TABLE public.berita DISABLE ROW LEVEL SECURITY;
-- ============================================================================

-- Verifikasi hasil policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'berita';
