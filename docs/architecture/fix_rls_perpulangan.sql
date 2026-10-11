-- ============================================================================
-- FIX & RECOVERY: ROW-LEVEL SECURITY & DATA SYNC UNTUK IZIN PERPULANGAN
-- Modul 20: Izin Santri & Perpulangan 2-Tier Approval
-- Target: Supabase Cloud Database (public.izin_perpulangan)
-- Tanggal: 12 Oktober 2026
-- ============================================================================

-- 1. PASTIKAN TABEL public.izin_perpulangan ADA DENGAN TIPE DATA YANG FLEKSIBEL
CREATE TABLE IF NOT EXISTS public.izin_perpulangan (
    id_izin VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL DEFAULT '',
    student_nis VARCHAR(32) NOT NULL DEFAULT '',
    student_name VARCHAR(255) NOT NULL DEFAULT '',
    wali_id VARCHAR(64) NOT NULL DEFAULT '',
    wali_name VARCHAR(255) DEFAULT '',
    wali_phone VARCHAR(32) DEFAULT '',
    kategori VARCHAR(128) NOT NULL DEFAULT 'Izin Biasa',
    alasan TEXT NOT NULL DEFAULT '',
    penjemput_nama VARCHAR(128) DEFAULT '',
    penjemput_hubungan VARCHAR(64) DEFAULT 'Orang Tua',
    penjemput_kontak VARCHAR(32) DEFAULT '',
    tgl_mulai VARCHAR(64) NOT NULL DEFAULT '',
    jam_mulai VARCHAR(32) NOT NULL DEFAULT '08:00',
    tgl_kembali VARCHAR(64) NOT NULL DEFAULT '',
    jam_kembali VARCHAR(32) NOT NULL DEFAULT '17:00',
    status VARCHAR(32) NOT NULL DEFAULT 'MENUNGGU_PENGURUS',
    pengurus_approved_by VARCHAR(128) DEFAULT '',
    pengurus_approved_at TIMESTAMPTZ,
    pengurus_catatan TEXT DEFAULT '',
    pengasuh_approved_by VARCHAR(128) DEFAULT '',
    pengasuh_approved_at TIMESTAMPTZ,
    pengasuh_catatan TEXT DEFAULT '',
    alasan_penolakan TEXT DEFAULT '',
    checkout_at TIMESTAMPTZ,
    checkout_petugas VARCHAR(128) DEFAULT '',
    checkin_at TIMESTAMPTZ,
    checkin_petugas VARCHAR(128) DEFAULT '',
    catatan_keterlambatan TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hapus CHECK constraint yang terlalu kaku jika ada agar tidak menggagalkan dual-write
ALTER TABLE public.izin_perpulangan DROP CONSTRAINT IF EXISTS izin_perpulangan_kategori_check;
ALTER TABLE public.izin_perpulangan DROP CONSTRAINT IF EXISTS izin_perpulangan_status_check;

-- 2. RESET & SETUP ROW LEVEL SECURITY (RLS) LENGKAP
ALTER TABLE public.izin_perpulangan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Authenticated Read Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Admin Manage Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Wali Submit Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Full Access Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Select Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Insert Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Update Izin Perpulangan" ON public.izin_perpulangan;
DROP POLICY IF EXISTS "Anon Delete Izin Perpulangan" ON public.izin_perpulangan;

-- Buat policy komprehensif untuk public/anon & authenticated (Client Web Application)
CREATE POLICY "Anon Select Izin Perpulangan" ON public.izin_perpulangan
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anon Insert Izin Perpulangan" ON public.izin_perpulangan
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon Update Izin Perpulangan" ON public.izin_perpulangan
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon Delete Izin Perpulangan" ON public.izin_perpulangan
    FOR DELETE TO anon, authenticated
    USING (true);

-- 3. SINKRONISASI 5 DATA EKSISTING DARI SPREADSHEET KE SUPABASE
-- Memasukkan data aktual agar Fast-Read Supabase (<50ms) langsung aktif dengan data nyata
INSERT INTO public.izin_perpulangan (
    id_izin, student_id, student_nis, student_name, wali_id, wali_name, wali_phone,
    kategori, alasan, penjemput_nama, penjemput_hubungan, penjemput_kontak,
    tgl_mulai, jam_mulai, tgl_kembali, jam_kembali, status, created_at, updated_at
) VALUES
-- 1. Izin Santri Izzat Atabik (Wali: Bpk. Nazir)
(
    'IZN-20261012-6497',
    'STD-000',
    '2018001',
    'Izzat Atabik',
    'USR_WLI_e7bd3d1f1316',
    'Bpk. Nazir',
    '89653887640',
    'Acara Keluarga Penting',
    'Nikahan',
    'Bpk. Nazir',
    'Wali Santri',
    '89653887640',
    '2026-10-11',
    '08:00',
    '2026-10-12',
    '17:00',
    'MENUNGGU_PENGURUS',
    '2026-10-11 17:26:03.659+00',
    '2026-10-11 17:26:03.659+00'
),
-- 2. Izin Santri Ahmad Fauzi (STD-001)
(
    'IZN-20261011-8841',
    'STD-001',
    '2024001',
    'Ahmad Fauzi',
    'ADMIN_MANUAL',
    'H. Sulaiman',
    '081234567890',
    'Pulang ke Rumah / Libur Terjadwal',
    'Kepulangan rutin bulanan',
    'H. Sulaiman',
    'Orang Tua',
    '081234567890',
    '2026-10-11',
    '08:00',
    '2026-10-13',
    '17:00',
    'MENUNGGU_PENGURUS',
    '2026-10-11 08:30:00+00',
    '2026-10-11 08:30:00+00'
),
-- 3. Izin Santri Muhammad Rizky (STD-002)
(
    'IZN-20261011-9214',
    'STD-002',
    '2024002',
    'Muhammad Rizky Pratama',
    'ADMIN_MANUAL',
    'Bpk. Bambang',
    '081398765432',
    'Izin Sakit / Berobat Luar',
    'Kontrol dokter spesialis THT',
    'Bpk. Bambang',
    'Orang Tua',
    '081398765432',
    '2026-10-11',
    '09:00',
    '2026-10-12',
    '16:00',
    'MENUNGGU_PENGASUH',
    '2026-10-11 09:15:00+00',
    '2026-10-11 09:15:00+00'
),
-- 4. Izin Santri Fatimah Az-Zahra (STD-003)
(
    'IZN-20261011-5532',
    'STD-003',
    '2024003',
    'Fatimah Az-Zahra',
    'ADMIN_MANUAL',
    'Ibu Maryam',
    '085612349876',
    'Kepentingan Mendesak Keluarga',
    'Acara pernikahan kakak kandung',
    'Ibu Maryam',
    'Ibu Kandung',
    '085612349876',
    '2026-10-10',
    '08:00',
    '2026-10-12',
    '17:00',
    'DISETUJUI',
    '2026-10-10 14:00:00+00',
    '2026-10-10 14:00:00+00'
),
-- 5. Izin Santri Rifda
(
    'IZN-20261011-1462',
    '',
    '',
    'Rifda',
    'ADMIN_MANUAL',
    'Wali Santri',
    '',
    'Sakit / Berobat',
    'Pijat pinggang sakit',
    'Sutiyem',
    'Kakek/Nenek',
    '895401676165',
    '2026-10-11',
    '16:00',
    '2026-10-13',
    '17:00',
    'MENUNGGU_PENGURUS',
    '2026-10-11 10:58:09.624+00',
    '2026-10-11 10:58:09.624+00'
)
ON CONFLICT (id_izin) DO UPDATE SET
    student_id = EXCLUDED.student_id,
    student_nis = EXCLUDED.student_nis,
    student_name = EXCLUDED.student_name,
    wali_id = EXCLUDED.wali_id,
    wali_name = EXCLUDED.wali_name,
    wali_phone = EXCLUDED.wali_phone,
    kategori = EXCLUDED.kategori,
    alasan = EXCLUDED.alasan,
    penjemput_nama = EXCLUDED.penjemput_nama,
    penjemput_hubungan = EXCLUDED.penjemput_hubungan,
    penjemput_kontak = EXCLUDED.penjemput_kontak,
    tgl_mulai = EXCLUDED.tgl_mulai,
    jam_mulai = EXCLUDED.jam_mulai,
    tgl_kembali = EXCLUDED.tgl_kembali,
    jam_kembali = EXCLUDED.jam_kembali,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 4. VIEW & INDEX OPTIMIZATION
CREATE OR REPLACE VIEW public.santri_leaves AS SELECT * FROM public.izin_perpulangan;

CREATE INDEX IF NOT EXISTS idx_izin_student ON public.izin_perpulangan(student_id);
CREATE INDEX IF NOT EXISTS idx_izin_nis ON public.izin_perpulangan(student_nis);
CREATE INDEX IF NOT EXISTS idx_izin_wali ON public.izin_perpulangan(wali_id);
CREATE INDEX IF NOT EXISTS idx_izin_status ON public.izin_perpulangan(status, created_at DESC);
