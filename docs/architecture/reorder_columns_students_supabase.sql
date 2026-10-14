-- ============================================================================
-- REORDER COLUMNS: TABEL PUBLIC.STUDENTS (SUPABASE)
-- Menata ulang urutan kolom secara fisik di PostgreSQL sehingga:
-- Kolom 'kelas_sekolah' berada persis di sebelah kanan kolom 'program' (sebelum 'status')
-- ============================================================================

-- 1. Buat tabel penataan baru dengan urutan kolom yang tepat
CREATE TABLE IF NOT EXISTS public.students_new (
    student_id VARCHAR(64) PRIMARY KEY,
    nis VARCHAR(32) NOT NULL DEFAULT '',
    nik VARCHAR(32) DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    gender VARCHAR(10) NOT NULL DEFAULT 'L',
    birth_date DATE,
    photo_url TEXT DEFAULT '',
    program VARCHAR(128) NOT NULL DEFAULT 'Tahfidz Intensif',
    kelas_sekolah VARCHAR(128) DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    qr_code TEXT DEFAULT ''
);

-- 2. Salin seluruh data santri yang ada saat ini secara aman
INSERT INTO public.students_new (
    student_id, nis, nik, name, gender, birth_date, photo_url,
    program, kelas_sekolah, status, created_at, qr_code
)
SELECT 
    student_id, 
    COALESCE(nis, ''), 
    COALESCE(nik, ''), 
    COALESCE(name, ''), 
    COALESCE(gender, 'L'), 
    birth_date, 
    COALESCE(photo_url, ''),
    COALESCE(program, 'Tahfidz Intensif'), 
    COALESCE(kelas_sekolah, ''), 
    COALESCE(status, 'ACTIVE'), 
    COALESCE(created_at, NOW()), 
    COALESCE(qr_code, '')
FROM public.students;

-- 3. Ganti tabel lama dengan tabel yang sudah tertata rapi
DROP TABLE public.students CASCADE;
ALTER TABLE public.students_new RENAME TO students;

-- 4. Pasang Index untuk query cepat
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id ON public.students (student_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students (nis);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students (program);
CREATE INDEX IF NOT EXISTS idx_students_kelas_sekolah ON public.students (kelas_sekolah);

-- 5. Pasang kembali hak akses & Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon Select Students" ON public.students;
DROP POLICY IF EXISTS "Anon Insert Students" ON public.students;
DROP POLICY IF EXISTS "Anon Update Students" ON public.students;
DROP POLICY IF EXISTS "Anon Delete Students" ON public.students;

CREATE POLICY "Anon Select Students" ON public.students
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon Insert Students" ON public.students
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anon Update Students" ON public.students
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon Delete Students" ON public.students
    FOR DELETE TO anon, authenticated USING (true);

GRANT ALL ON TABLE public.students TO anon, authenticated, service_role;
