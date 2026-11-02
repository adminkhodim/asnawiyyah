-- ============================================================================
-- SCRIPT PEMBERSIHAN DUPLIKAT & SINKRONISASI TAHFIDZ LOGS
-- PPTQ ASNAWIYYAH - SUPABASE POSTGRESQL
-- ============================================================================

-- 1. Hapus 2.402 baris duplikat hantu yang dibuat oleh dual-write lama (format log_id TFZ-179*)
DELETE FROM public.tahfidz_logs 
WHERE log_id LIKE 'TFZ-179%';

-- 2. Pastikan Setoran Izzat Atabik (STD-000) tanggal 2 November 2026 langsung masuk ke Supabase
INSERT INTO public.tahfidz_logs (
    log_id, student_id, nis, student_name, gender, tanggal, sesi, tipe, 
    juz, surah, satuan, ayat_mulai, ayat_sampai, halaman_list, total_halaman, 
    nilai, muhafiz, catatan, status_setoran, created_at
)
VALUES (
    'TFZ-20261102-171253-5903',
    'STD-000',
    '2018001',
    'Izzat Atabik',
    'Putra',
    '2026-11-02',
    'Pagi (Ba''da Subuh)',
    'ZIYADAH',
    30,
    'An-Naba'' 1 - An-Nas 6 (Juz ''Amma)',
    'HALAMAN',
    NULL,
    NULL,
    '4,5',
    2.0,
    'MUMTAZ',
    'Ustadz',
    NULL,
    'LANJUT',
    '2026-11-02T10:12:53.534Z'
)
ON CONFLICT (log_id) DO UPDATE SET
    tanggal = EXCLUDED.tanggal,
    tipe = EXCLUDED.tipe,
    juz = EXCLUDED.juz,
    surah = EXCLUDED.surah,
    halaman_list = EXCLUDED.halaman_list,
    total_halaman = EXCLUDED.total_halaman,
    nilai = EXCLUDED.nilai,
    status_setoran = EXCLUDED.status_setoran;

-- 3. Cek hasil: total baris setelah pembersihan
-- SELECT count(*) FROM public.tahfidz_logs;

