-- ============================================================================
-- SQL PERBAIKAN: AKTIFKAN HAK HAPUS PENGGUNA UNTUK SUPER ADMIN (RLS DELETE)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Penjelasan:
-- Supabase saat ini menolak operasi DELETE dari client karena RLS belum memiliki
-- policy DELETE untuk role anon. Script ini membuka izin DELETE agar tombol hapus
-- di web dashboard Super Admin berfungsi nyata, sekaligus langsung memusnahkan
-- ke-4 akun bot spam tersebut dari Supabase.
-- ============================================================================

-- 1. Berikan Policy DELETE pada tabel public.users
DROP POLICY IF EXISTS "Anon Delete Users" ON public.users;

CREATE POLICY "Anon Delete Users" ON public.users
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 2. Berikan Policy DELETE pada tabel public.wali_santri_map
DROP POLICY IF EXISTS "Anon Delete Wali Santri Map" ON public.wali_santri_map;

CREATE POLICY "Anon Delete Wali Santri Map" ON public.wali_santri_map
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 3. Hapus langsung 4 akun spam bot anomali berdasarkan user_id tepatnya
DELETE FROM public.wali_santri_map
WHERE wali_id IN (
    'USR_8d08aabefd7b',
    'USR_75264a66d03a',
    'USR_21e9c148a5e0',
    'USR_fa37d8196188'
);

DELETE FROM public.users 
WHERE user_id IN (
    'USR_8d08aabefd7b',
    'USR_75264a66d03a',
    'USR_21e9c148a5e0',
    'USR_fa37d8196188'
);

-- 4. Verifikasi sisa data (seharusnya menjadi 27 akun pengguna valid)
SELECT COUNT(*) AS total_pengguna_aktif FROM public.users;
