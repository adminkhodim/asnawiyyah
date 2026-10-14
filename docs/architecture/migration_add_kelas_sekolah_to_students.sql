-- ============================================================================
-- MIGRATION: PENAMBAHAN KOLOM KELAS & SEKOLAH PADA MASTER DATA SANTRI
-- Target: Supabase Cloud Database (public.students)
-- Tanggal: 14 Oktober 2026
-- ============================================================================

-- 1. TAMBAH KOLOM kelas_sekolah JIKA BELUM ADA
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'kelas_sekolah'
    ) THEN
        ALTER TABLE public.students ADD COLUMN kelas_sekolah VARCHAR(128) NOT NULL DEFAULT '';
        RAISE NOTICE 'Kolom kelas_sekolah berhasil ditambahkan ke tabel public.students';
    ELSE
        RAISE NOTICE 'Kolom kelas_sekolah sudah ada di tabel public.students';
    END IF;
END $$;

-- 2. BUAT INDEX UNTUK MEMPERCEPAT PENCARIAN & FILTERING BERDASARKAN KELAS & SEKOLAH
CREATE INDEX IF NOT EXISTS idx_students_kelas_sekolah ON public.students (kelas_sekolah);

-- 3. VERIFIKASI STRUKTUR KOLOM
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'students'
ORDER BY ordinal_position;
