-- ============================================================================
-- FIX ROW-LEVEL SECURITY & DATA INTEGRITY: MASTER DATA SANTRI (STUDENTS)
-- Target: Supabase Cloud Database (public.students)
-- Tanggal: 13 Oktober 2026
-- ============================================================================

-- 1. PASTIKAN STRUKTUR TABEL public.students LENGKAP DENGAN KOLOM PROGRAM
CREATE TABLE IF NOT EXISTS public.students (
    student_id VARCHAR(64) PRIMARY KEY,
    nis VARCHAR(32) NOT NULL DEFAULT '',
    nik VARCHAR(32) DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    gender VARCHAR(10) NOT NULL DEFAULT 'L',
    birth_date VARCHAR(32) DEFAULT '',
    photo_url TEXT DEFAULT '',
    program VARCHAR(128) NOT NULL DEFAULT 'Tahfidz Intensif',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    qr_code TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom program ada di tabel students jika tabel sudah ada sebelumnya
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'program'
    ) THEN
        ALTER TABLE public.students ADD COLUMN program VARCHAR(128) NOT NULL DEFAULT 'Tahfidz Intensif';
    END IF;
END $$;

-- Pastikan unique constraint pada student_id dan nis (jika belum ada)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id ON public.students (student_id);

-- 2. RESET & SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- Memberikan hak akses penuh kepada Web Client (anon) dan authenticated user
-- agar perubahan program dan data santri dari portal admin langsung tersimpan permanen.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Students" ON public.students;
DROP POLICY IF EXISTS "Full Access Students" ON public.students;
DROP POLICY IF EXISTS "Anon Read Students" ON public.students;
DROP POLICY IF EXISTS "Authenticated Read Students" ON public.students;
DROP POLICY IF EXISTS "Admin Manage Students" ON public.students;
DROP POLICY IF EXISTS "Anon Select Students" ON public.students;
DROP POLICY IF EXISTS "Anon Insert Students" ON public.students;
DROP POLICY IF EXISTS "Anon Update Students" ON public.students;
DROP POLICY IF EXISTS "Anon Delete Students" ON public.students;

-- Policy SELECT: Izinkan pembacaan data santri oleh anon & authenticated
CREATE POLICY "Anon Select Students" ON public.students
    FOR SELECT TO anon, authenticated
    USING (true);

-- Policy INSERT: Izinkan penambahan santri oleh anon & authenticated
CREATE POLICY "Anon Insert Students" ON public.students
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy UPDATE: Izinkan perubahan data & program santri oleh anon & authenticated
CREATE POLICY "Anon Update Students" ON public.students
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policy DELETE: Izinkan penghapusan data santri oleh anon & authenticated
CREATE POLICY "Anon Delete Students" ON public.students
    FOR DELETE TO anon, authenticated
    USING (true);

-- 3. VERIFIKASI KEBIJAKAN
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'students';
