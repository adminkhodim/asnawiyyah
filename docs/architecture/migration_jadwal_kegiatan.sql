-- ============================================================================
-- MIGRATION: TABEL JADWAL_KEGIATAN & SEED DATA 25 AGENDA SANTRI
-- PPTQ Asnawiyyah - Cloud Database Supabase (PostgreSQL)
-- ============================================================================
-- Jalankan skrip ini langsung di menu SQL Editor pada Supabase Dashboard.
-- https://supabase.com/dashboard/project/tkjhfhyabacbyknwrysh/sql
-- ============================================================================

-- 1. PEMBUATAN TABEL JADWAL_KEGIATAN
CREATE TABLE IF NOT EXISTS public.jadwal_kegiatan (
    id VARCHAR(64) PRIMARY KEY,
    tipe VARCHAR(32) NOT NULL CHECK (tipe IN ('harian', 'mingguan', 'bulanan', 'tahunan')),
    waktu VARCHAR(128) NOT NULL,
    kegiatan VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    badge VARCHAR(64),
    urutan INTEGER DEFAULT 1,
    status VARCHAR(32) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEX OPTIMASI QUERY
CREATE INDEX IF NOT EXISTS idx_jadwal_tipe_urutan ON public.jadwal_kegiatan(tipe, urutan ASC);
CREATE INDEX IF NOT EXISTS idx_jadwal_status ON public.jadwal_kegiatan(status);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.jadwal_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Jadwal Kegiatan" ON public.jadwal_kegiatan;
CREATE POLICY "Public Read Active Jadwal Kegiatan" ON public.jadwal_kegiatan 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan;
CREATE POLICY "Full Access Jadwal Kegiatan" ON public.jadwal_kegiatan 
    FOR ALL USING (true) WITH CHECK (true);

-- 4. SEEDING 25 DATA AGENDA RESMI SANTRI
INSERT INTO public.jadwal_kegiatan (id, tipe, waktu, kegiatan, deskripsi, badge, urutan, status, timestamp)
VALUES
    -- --- HARIAN (11 Agenda) ---
    ('JDW_HARIAN_01', 'harian', '03.30 – 04.30 WIB', 'Bangun Pagi & Qiyamul Lail', 'Shalat Tahajud, Hajat, Witir, & Persiapan Shalat Subuh.', '24 Jam', 1, 'Aktif', NOW()),
    ('JDW_HARIAN_02', 'harian', '04.30 – 05.30 WIB', 'Shalat Subuh Berjamaah & Zikir Pagi', 'Shalat Subuh di Masjid Utama, dilanjutkan Pembacaan Zikir Ratib Pagi.', '', 2, 'Aktif', NOW()),
    ('JDW_HARIAN_03', 'harian', '05.30 – 07.00 WIB', 'Halaqah Hafalan Al-Qur''an (Pagi)', 'Setoran Hafalan Baru (Sabaq) & Bimbingan Talaqqi bersama Asatidz.', 'Hafalan', 3, 'Aktif', NOW()),
    ('JDW_HARIAN_04', 'harian', '07.00 – 08.00 WIB', 'Makan Pagi & Persiapan KBM', 'Sarapan, MCK, dan persiapan masuk kelas formal/madrasah.', '', 4, 'Aktif', NOW()),
    ('JDW_HARIAN_05', 'harian', '08.00 – 11.30 WIB', 'Kegiatan Belajar Mengajar (KBM)', 'Pelajaran Sekolah Formal / Pengajian Kitab Diniyah secara terstruktur.', '', 5, 'Aktif', NOW()),
    ('JDW_HARIAN_06', 'harian', '11.30 – 12.30 WIB', 'Shalat Dzuhur & Makan Siang', 'Shalat Dzuhur Berjamaah dilanjutkan makan siang santri.', '', 6, 'Aktif', NOW()),
    ('JDW_HARIAN_07', 'harian', '12.30 – 15.00 WIB', 'Istirahat Siang (Qailulah)', 'Tidur siang sunnah & Pendalaman materi hafalan mandiri.', '', 7, 'Aktif', NOW()),
    ('JDW_HARIAN_08', 'harian', '15.00 – 17.30 WIB', 'Shalat Ashar & Muraja''ah Sore', 'Shalat Ashar Berjamaah, Muraja''ah Hafalan Pekanan, & Olahraga ringan.', '', 8, 'Aktif', NOW()),
    ('JDW_HARIAN_09', 'harian', '17.30 – 19.30 WIB', 'Maghrib, Ratib, & Kajian Kitab', 'Shalat Maghrib Berjamaah, Pembacaan Ratib Al-Haddad, & Pengajian Kitab Kuning.', 'Kajian', 9, 'Aktif', NOW()),
    ('JDW_HARIAN_10', 'harian', '19.30 – 21.30 WIB', 'Shalat Isya, Makan Malam & Belajar Mandiri', 'Shalat Isya Berjamaah, Makan Malam, & Belajar Mandiri terpadu di asrama.', '', 10, 'Aktif', NOW()),
    ('JDW_HARIAN_11', 'harian', '21.30 – 03.30 WIB', 'Istirahat Malam (Jam Wajib Tidur)', 'Seluruh fasilitas penerangan umum dimatikan untuk pengkondisian istirahat santri.', 'Wajib Tidur', 11, 'Aktif', NOW()),

    -- --- MINGGUAN (5 Agenda) ---
    ('JDW_MINGGUAN_01', 'mingguan', 'Senin & Kamis', 'Puasa Sunnah & Buka Bersama', 'Pelaksanaan Puasa Sunnah Senin-Kamis dilanjutkan doa & buka puasa bersama santri di aula.', 'Sunnah', 1, 'Aktif', NOW()),
    ('JDW_MINGGUAN_02', 'mingguan', 'Selasa Kliwon', 'Pengajian Akbar Ihya ''Ulumuddin', 'Kajian rutin Seloso Kliwon pengajian kitab Ihya ''Ulumuddin bersama Pengasuh Utama.', 'Rutin', 2, 'Aktif', NOW()),
    ('JDW_MINGGUAN_03', 'mingguan', 'Jumat (Sayyidul Ayyam)', 'Ro''an Kebersihan & Al-Kahfi', 'Kerja bakti lingkungan (Ro''an), pembacaan Surat Al-Kahfi, Yasin & Tahlil, serta Shalat Jumat Berjamaah.', 'Utama', 3, 'Aktif', NOW()),
    ('JDW_MINGGUAN_04', 'mingguan', 'Sabtu', 'Muhadharah & Seni Hadroh', 'Latihan public speaking 3 bahasa (Muhadharah), seni rebana/hadroh, & keahlian IT santri.', 'Ekstrakurikuler', 4, 'Aktif', NOW()),
    ('JDW_MINGGUAN_05', 'mingguan', 'Ahad', 'Kunjungan Wali Santri & Olahraga', 'Pagi hari olahraga bersama & kegiatan jalan sehat, dilanjutkan waktu kunjungan resmi wali santri.', 'Sambang Wali', 5, 'Aktif', NOW()),

    -- --- BULANAN (4 Agenda) ---
    ('JDW_BULANAN_01', 'bulanan', 'Pekan Ke-1', 'Sema''an Al-Qur''an Bil-Ghaib', 'Khataman Al-Qur''an hafalan santri secara bergantian dalam satu hari di majlis utama.', 'P-1', 1, 'Aktif', NOW()),
    ('JDW_BULANAN_02', 'bulanan', 'Pekan Ke-2', 'Ujian Hafalan Bulanan (Munaqasyah)', 'Evaluasi ketercapaian target hafalan baru & kualitas tajwid santri langsung di depan Dewan Penguji.', 'P-2', 2, 'Aktif', NOW()),
    ('JDW_BULANAN_03', 'bulanan', 'Pekan Ke-3', 'Majlis Ta''lim & Silaturahmi Wali Santri', 'Pengajian rutin bulanan khusus orang tua/wali santri bersama jajaran Pengasuh Pesantren.', 'P-3', 3, 'Aktif', NOW()),
    ('JDW_BULANAN_04', 'bulanan', 'Pekan Ke-4', 'Santunan Yatim & Bakti Sosial', 'Kegiatan kepedulian sosial santri berbagi kepada anak yatim & warga sekitar lingkungan pesantren.', 'P-4', 4, 'Aktif', NOW()),

    -- --- TAHUNAN (5 Agenda) ---
    ('JDW_TAHUNAN_01', 'tahunan', 'Bulan Muharram', 'Peringatan Tahun Baru Islam & Santunan', 'Peringatan 1 Muharram 1448 H, pawai obor santri, dan santunan akbar anak yatim.', 'Muharram', 1, 'Aktif', NOW()),
    ('JDW_TAHUNAN_02', 'tahunan', 'Bulan Rabiul Awal', 'Peringatan Maulid Nabi Muhammad SAW', 'Pembacaan Kitab Simtuddurar / Barzanji bersama habaib dan alim ulama Demak.', 'Maulid', 2, 'Aktif', NOW()),
    ('JDW_TAHUNAN_03', 'tahunan', 'Rajab & Sya''ban', 'Wisuda Tahfidz & Haul Pesantren', 'Ujian Imtihan Akhirussanah, Wisuda Khotmil Qur''an, & Peringatan Haul Masyayikh PPTQ Asnawiyyah.', 'Wisuda', 3, 'Aktif', NOW()),
    ('JDW_TAHUNAN_04', 'tahunan', 'Bulan Ramadhan', 'Karantina Tahfidz & Pasaran Kitab', 'Program percepatan hafalan Ramadhan & pengajian pasaran kitab kuning kilatan.', 'Ramadhan', 4, 'Aktif', NOW()),
    ('JDW_TAHUNAN_05', 'tahunan', 'Bulan Syawal', 'Libur Idul Fitri & Halal Bihalal', 'Masa perpulangan libur Idul Fitri santri dan silaturahmi Halal Bihalal Keluarga Besar PPTQ Asnawiyyah.', 'Syawal', 5, 'Aktif', NOW())
ON CONFLICT (id) DO UPDATE SET
    tipe = EXCLUDED.tipe,
    waktu = EXCLUDED.waktu,
    kegiatan = EXCLUDED.kegiatan,
    deskripsi = EXCLUDED.deskripsi,
    badge = EXCLUDED.badge,
    urutan = EXCLUDED.urutan,
    status = EXCLUDED.status,
    timestamp = EXCLUDED.timestamp;

-- Konfirmasi total baris tersimpan
SELECT count(*) AS total_jadwal_kegiatan FROM public.jadwal_kegiatan;
