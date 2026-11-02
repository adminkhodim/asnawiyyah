-- ==============================================================================
-- MIGRATION: MODUL KEDISIPLINAN & TARBIYAH SANTRI
-- Target: Supabase Cloud Database (PostgreSQL)
-- PPTQ Asnawiyyah Pilangwetan
-- ==============================================================================

-- 1. TABEL MASTER ATURAN TATA TERTIB (kedisiplinan_master)
CREATE TABLE IF NOT EXISTS public.kedisiplinan_master (
    rule_id VARCHAR(50) PRIMARY KEY,
    kode_pasal VARCHAR(50),
    nama_pelanggaran VARCHAR(255) NOT NULL,
    kategori VARCHAR(20) NOT NULL DEFAULT 'RINGAN', -- RINGAN, SEDANG, BERAT
    poin_default INTEGER NOT NULL DEFAULT 5,
    rekomendasi_tazir TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'AKTIF', -- AKTIF, NONAKTIF
    urutan INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks kedisiplinan_master
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_master_status ON public.kedisiplinan_master(status);
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_master_kategori ON public.kedisiplinan_master(kategori);

-- 2. TABEL LOG KEDISIPLINAN & TARBIYAH SANTRI (kedisiplinan_logs)
CREATE TABLE IF NOT EXISTS public.kedisiplinan_logs (
    record_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    nis VARCHAR(50),
    student_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) DEFAULT 'Putra',
    kamar_asrama VARCHAR(100),
    nama_halaqah VARCHAR(100),
    rule_id VARCHAR(50),
    nama_pelanggaran VARCHAR(255) NOT NULL,
    kategori VARCHAR(20) NOT NULL DEFAULT 'RINGAN',
    poin INTEGER NOT NULL DEFAULT 5,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu VARCHAR(30),
    lokasi VARCHAR(100),
    kronologi TEXT,
    bentuk_tazir TEXT,
    status_tazir VARCHAR(20) NOT NULL DEFAULT 'DIPROSES', -- DIPROSES, SEDANG_TAZIR, TUNTAS
    tanggal_tuntas DATE,
    pencatat_id VARCHAR(50),
    nama_pencatat VARCHAR(150),
    notif_wali_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, TERKIRIM, GAGAL
    notif_wali_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks kedisiplinan_logs
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_logs_student ON public.kedisiplinan_logs(student_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_logs_nis ON public.kedisiplinan_logs(nis);
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_logs_status_tazir ON public.kedisiplinan_logs(status_tazir);
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_logs_kategori ON public.kedisiplinan_logs(kategori);
CREATE INDEX IF NOT EXISTS idx_kedisiplinan_logs_tanggal ON public.kedisiplinan_logs(tanggal DESC);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.kedisiplinan_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kedisiplinan_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Cepat (Fast-Read & Write)
DROP POLICY IF EXISTS "Anon Select Kedisiplinan Master" ON public.kedisiplinan_master;
CREATE POLICY "Anon Select Kedisiplinan Master" ON public.kedisiplinan_master
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Insert Kedisiplinan Master" ON public.kedisiplinan_master;
CREATE POLICY "Anon Insert Kedisiplinan Master" ON public.kedisiplinan_master
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Update Kedisiplinan Master" ON public.kedisiplinan_master;
CREATE POLICY "Anon Update Kedisiplinan Master" ON public.kedisiplinan_master
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Delete Kedisiplinan Master" ON public.kedisiplinan_master;
CREATE POLICY "Anon Delete Kedisiplinan Master" ON public.kedisiplinan_master
    FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Select Kedisiplinan Logs" ON public.kedisiplinan_logs;
CREATE POLICY "Anon Select Kedisiplinan Logs" ON public.kedisiplinan_logs
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Insert Kedisiplinan Logs" ON public.kedisiplinan_logs;
CREATE POLICY "Anon Insert Kedisiplinan Logs" ON public.kedisiplinan_logs
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Update Kedisiplinan Logs" ON public.kedisiplinan_logs;
CREATE POLICY "Anon Update Kedisiplinan Logs" ON public.kedisiplinan_logs
    FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Delete Kedisiplinan Logs" ON public.kedisiplinan_logs;
CREATE POLICY "Anon Delete Kedisiplinan Logs" ON public.kedisiplinan_logs
    FOR DELETE TO anon, authenticated USING (true);

-- 4. DATA AWAL (SEEDING DEFAULT DATA MASTER ATURAN)
INSERT INTO public.kedisiplinan_master (rule_id, kode_pasal, nama_pelanggaran, kategori, poin_default, rekomendasi_tazir, status, urutan)
VALUES
    ('RULE-001', 'Pasal 3 Ayat 1', 'Terlambat Mengikuti Sholat Berjamaah Maktubah', 'RINGAN', 5, 'Membaca Dzikir / Wirid Ba''da Sholat di Serambi Masjid', 'AKTIF', 1),
    ('RULE-002', 'Pasal 3 Ayat 2', 'Tidak Hadir / Terlambat Masuk Halaqah Tahfidz', 'RINGAN', 5, 'Menambah Setoran Ziyadah 1 Halaman di Luar Jam Wajib', 'AKTIF', 2),
    ('RULE-003', 'Pasal 4 Ayat 1', 'Tidak Mengenakan Peci / Busana Standar Santri', 'RINGAN', 5, 'Nasihat lisan & merapikan atribut seragam santri', 'AKTIF', 3),
    ('RULE-004', 'Pasal 4 Ayat 3', 'Kamar / Loker Berantakan (Mengabaikan Piket)', 'RINGAN', 10, 'Membersihkan area lorong asrama selama 1 hari', 'AKTIF', 4),
    ('RULE-005', 'Pasal 5 Ayat 1', 'Keluar Area Pondok Tanpa Surat Izin Resmi (Nglencer)', 'SEDANG', 25, 'Membaca Al-Qur''an 2 Juz di Serambi Masjid & Khidmah Ndalem', 'AKTIF', 5),
    ('RULE-006', 'Pasal 5 Ayat 4', 'Membawa / Mengonsumsi Makanan di Kamar Tidur Santri', 'SEDANG', 15, 'Membersihkan ruang makan & dapur pondok', 'AKTIF', 6),
    ('RULE-007', 'Pasal 6 Ayat 1', 'Membawa / Menyimpan HP Ilegal Tanpa Izin Pengurus', 'BERAT', 50, 'Penyitaan barang, penerbitan SP 1 & pemanggilan Wali Santri', 'AKTIF', 7),
    ('RULE-008', 'Pasal 6 Ayat 2', 'Merokok / Menghisap Vape di Lingkungan Pondok', 'BERAT', 75, 'Penerbitan SP 2, ta''zir khidmah 3 hari & pemanggilan resmi Wali Santri', 'AKTIF', 8),
    ('RULE-009', 'Pasal 6 Ayat 3', 'Perkelahian Fisik / Intimidasi (Bullying) Terhadap Teman', 'BERAT', 75, 'Mediasi khusus Ndalem Pengasuh, SP 2 & takzir pembinaan akhlak', 'AKTIF', 9),
    ('RULE-010', 'Pasal 6 Ayat 5', 'Meninggalkan Pondok Tanpa Izin Berhari-hari (Kabur/Bolos)', 'BERAT', 100, 'Pemanggilan langsung Wali Santri ke Ndalem Pengasuh & evaluasi status santri', 'AKTIF', 10)
ON CONFLICT (rule_id) DO NOTHING;

