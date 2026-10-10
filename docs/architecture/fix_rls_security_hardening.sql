-- ============================================================================
-- SQL REMEDIASI KEAMANAN: HARDENING ROW LEVEL SECURITY (RLS) v1.0
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Petunjuk Eksekusi:
-- 1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/tkjhfhyabacbyknwrysh/sql
-- 2. Buat "New Query", salin seluruh isi file ini, lalu klik "Run".
-- 3. Seluruh tabel sensitif akan terkunci aman dari kebocoran anonim.
-- ============================================================================

-- ============================================================================
-- 1. TABEL JADWAL_KEGIATAN
-- Celah: Policy "Full Access Jadwal Kegiatan" mengizinkan siapa saja (anon) menulis & menghapus.
-- Perbaikan: Hanya izinkan SELECT untuk status 'Aktif'. Kunci write untuk anon.
-- ============================================================================
ALTER TABLE IF EXISTS public.jadwal_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Public Read Active Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Public Read Jadwal Kegiatan" ON public.jadwal_kegiatan;
DROP POLICY IF EXISTS "Admin Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan;

-- Publik hanya boleh membaca agenda yang aktif
CREATE POLICY "Public Read Active Jadwal Kegiatan" ON public.jadwal_kegiatan
    FOR SELECT
    TO anon, authenticated
    USING (status = 'Aktif');

-- Hanya authenticated user / service_role yang boleh INSERT, UPDATE, DELETE
CREATE POLICY "Admin Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- 2. TABEL STUDENTS (MASTER DATA SANTRI & IDENTITAS ANAK)
-- Celah: Role anon dapat men-scrape seluruh data santri (NIS, NIK, tanggal lahir, dll).
-- Perbaikan: Kunci penuh dari akses anonim. Hanya user terautentikasi & backend yang boleh akses.
-- ============================================================================
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Students" ON public.students;
DROP POLICY IF EXISTS "Full Access Students" ON public.students;
DROP POLICY IF EXISTS "Anon Read Students" ON public.students;
DROP POLICY IF EXISTS "Authenticated Read Students" ON public.students;
DROP POLICY IF EXISTS "Admin Manage Students" ON public.students;

-- Akses read hanya untuk pengguna terautentikasi (admin / asatidz / pengasuh)
CREATE POLICY "Authenticated Read Students" ON public.students
    FOR SELECT
    TO authenticated
    USING (true);

-- Akses write (insert/update/delete) hanya untuk authenticated / service_role
CREATE POLICY "Admin Manage Students" ON public.students
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- 3. TABEL USERS (IDENTITAS PENGGUNA, EMAIL, NOMOR TELEPON, PASSWORD HASH)
-- Celah: Role anon dapat membaca data kontak & akun pengguna serta menyisipkan akun baru.
-- Perbaikan: Kunci penuh dari akses publik.
-- ============================================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "Full Access Users" ON public.users;
DROP POLICY IF EXISTS "Anon Read Users" ON public.users;
DROP POLICY IF EXISTS "User Read Own Profile" ON public.users;
DROP POLICY IF EXISTS "Admin Full Access Users" ON public.users;

-- Pengguna terautentikasi dapat membaca data profil miliknya sendiri
CREATE POLICY "User Read Own Profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = email);

-- Admin dan peran pengelola memiliki akses penuh
CREATE POLICY "Admin Full Access Users" ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- 4. TABEL WALI_SANTRI_MAP (RELASI WALI KE SANTRI BINAAN)
-- ============================================================================
ALTER TABLE IF EXISTS public.wali_santri_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Full Access Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Authenticated Read Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Admin Manage Wali Santri Map" ON public.wali_santri_map;

CREATE POLICY "Authenticated Read Wali Santri Map" ON public.wali_santri_map
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin Manage Wali Santri Map" ON public.wali_santri_map
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- 5. TABEL TAHFIDZ (LOGS SETORAN & CAPAIAN MUTABA'AH)
-- ============================================================================
ALTER TABLE IF EXISTS public.tahfidz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tahfidz_capaian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Full Access Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Authenticated Read Tahfidz Logs" ON public.tahfidz_logs;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Logs" ON public.tahfidz_logs;

DROP POLICY IF EXISTS "Public Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Full Access Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Authenticated Read Tahfidz Capaian" ON public.tahfidz_capaian;
DROP POLICY IF EXISTS "Admin Manage Tahfidz Capaian" ON public.tahfidz_capaian;

CREATE POLICY "Authenticated Read Tahfidz Logs" ON public.tahfidz_logs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin Manage Tahfidz Logs" ON public.tahfidz_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated Read Tahfidz Capaian" ON public.tahfidz_capaian
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin Manage Tahfidz Capaian" ON public.tahfidz_capaian
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================================
-- 6. TABEL KONTEN PUBLIK (READ-ONLY STATUS AKTIF UNTUK ANON, WRITE UNTUK AUTH)
-- ============================================================================
ALTER TABLE IF EXISTS public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.galeri ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Berita" ON public.berita;
DROP POLICY IF EXISTS "Public Read Active Banner" ON public.banner;
DROP POLICY IF EXISTS "Public Read Active Notifikasi" ON public.notifikasi;
DROP POLICY IF EXISTS "Public Read Active Galeri" ON public.galeri;
DROP POLICY IF EXISTS "Public Read Published Programs" ON public.programs;

DROP POLICY IF EXISTS "Admin Manage Berita" ON public.berita;
DROP POLICY IF EXISTS "Admin Manage Banner" ON public.banner;
DROP POLICY IF EXISTS "Admin Manage Notifikasi" ON public.notifikasi;
DROP POLICY IF EXISTS "Admin Manage Galeri" ON public.galeri;
DROP POLICY IF EXISTS "Admin Manage Programs" ON public.programs;

-- Publik hanya boleh membaca konten yang berstatus aktif/publish
CREATE POLICY "Public Read Active Berita" ON public.berita
    FOR SELECT TO anon, authenticated USING (status = 'Publish');

CREATE POLICY "Public Read Active Banner" ON public.banner
    FOR SELECT TO anon, authenticated USING (status = 'Aktif');

CREATE POLICY "Public Read Active Notifikasi" ON public.notifikasi
    FOR SELECT TO anon, authenticated USING (status = 'Aktif');

CREATE POLICY "Public Read Active Galeri" ON public.galeri
    FOR SELECT TO anon, authenticated USING (status = 'Aktif');

CREATE POLICY "Public Read Published Programs" ON public.programs
    FOR SELECT TO anon, authenticated USING (status = 'published');

-- Mutasi konten publik hanya boleh dilakukan oleh authenticated / service_role
CREATE POLICY "Admin Manage Berita" ON public.berita FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Manage Banner" ON public.banner FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Manage Notifikasi" ON public.notifikasi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Manage Galeri" ON public.galeri FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Manage Programs" ON public.programs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFIKASI STATUS POLICY
-- ============================================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'students', 'jadwal_kegiatan', 'berita', 'banner')
ORDER BY tablename, policyname;
