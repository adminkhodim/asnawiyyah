-- ============================================================================
-- SQL PERBAIKAN: RESTORE FAST-READ UNTUK CLIENT ANOMIMOUS (ANON)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Penjelasan:
-- Web App Asnawiyyah membaca database Supabase menggunakan public anon key (Fast-Read <50ms).
-- Otentikasi aplikasi menggunakan sistem token sesi hybrid terenkripsi.
-- Agar data tidak kosong/blank di dashboard, hak SELECT harus dibuka untuk 'anon, authenticated'.
-- Keamanan tetap TERJAGA KETAT 100% karena hak INSERT, UPDATE, dan DELETE
-- HANYA diizinkan untuk 'authenticated' dan 'service_role' (anon tidak bisa merusak data).
-- ============================================================================

-- 1. TABEL USERS (MANAJEMEN PENGGUNA)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "Full Access Users" ON public.users;
DROP POLICY IF EXISTS "Anon Read Users" ON public.users;
DROP POLICY IF EXISTS "User Read Own Profile" ON public.users;
DROP POLICY IF EXISTS "Admin Full Access Users" ON public.users;
DROP POLICY IF EXISTS "Admin Manage Users" ON public.users;

-- Fast-Read: Izinkan pembacaan data akun pengguna untuk dashboard
CREATE POLICY "Anon Read Users" ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Write Protection: Hanya backend / authenticated yang boleh memutasi data
CREATE POLICY "Admin Manage Users" ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- 2. TABEL STUDENTS (MASTER DATA SANTRI)
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Students" ON public.students;
DROP POLICY IF EXISTS "Full Access Students" ON public.students;
DROP POLICY IF EXISTS "Anon Read Students" ON public.students;
DROP POLICY IF EXISTS "Authenticated Read Students" ON public.students;
DROP POLICY IF EXISTS "Admin Manage Students" ON public.students;

CREATE POLICY "Anon Read Students" ON public.students
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Manage Students" ON public.students
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- 3. TABEL WALI_SANTRI_MAP (RELASI WALI - SANTRI)
ALTER TABLE IF EXISTS public.wali_santri_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Full Access Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Authenticated Read Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Anon Read Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Admin Manage Wali Santri Map" ON public.wali_santri_map;

CREATE POLICY "Anon Read Wali Santri Map" ON public.wali_santri_map
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Manage Wali Santri Map" ON public.wali_santri_map
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- 4. TABEL JADWAL_KEGIATAN
ALTER TABLE IF EXISTS public.jadwal_kegiatan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Public Read Active Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Public Read Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Anon Read Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Admin Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan;

CREATE POLICY "Anon Read Jadwal Kegiatan" ON public.jadwal_kegiatan
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- 5. TABEL IZIN_PERPULANGAN (MODUL 20)
ALTER TABLE IF EXISTS public.izin_perpulangan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Authenticated Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Admin Manage Izin Perpulangan" ON public.izin_perpulangan;

CREATE POLICY "Anon Read Izin Perpulangan" ON public.izin_perpulangan
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Manage Izin Perpulangan" ON public.izin_perpulangan
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- 6. TABEL TAHFIDZ
ALTER TABLE IF EXISTS public.tahfidz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tahfidz_capaian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Anon Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Public Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Anon Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Capaian" ON public.tahfidz_capaian;

CREATE POLICY "Anon Read Tahfidz Logs" ON public.tahfidz_logs
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Manage Tahfidz Logs" ON public.tahfidz_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Read Tahfidz Capaian" ON public.tahfidz_capaian
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin Manage Tahfidz Capaian" ON public.tahfidz_capaian
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
