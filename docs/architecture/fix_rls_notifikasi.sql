-- ============================================================================
-- SINKRONISASI & PERBAIKAN RLS (ROW LEVEL SECURITY) NOTIFIKASI
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE POSTGRESQL
-- ============================================================================
-- Masalah:
-- 1. Policy lama "Public Read Active Notifikasi" hanya mengizinkan SELECT WHERE status = 'Aktif'.
-- 2. Policy lama "Admin Manage Notifikasi" hanya untuk role 'authenticated', 
--    sedangkan frontend menggunakan anon key sehingga INSERT/UPDATE/DELETE ditolak (Error 401: code 42501).
-- 3. Terjadi penumpukan duplikat di Google Sheets karena saat edit dilakukan dengan ID yang belum
--    tercatat di Sheets, Google Sheets melakukan appendRow baru.
-- ============================================================================

-- 1. Buka Izin RLS (Row Level Security) untuk tabel public.notifikasi
ALTER TABLE IF EXISTS public.notifikasi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Notifikasi" ON public.notifikasi;
DROP POLICY IF EXISTS "Admin Manage Notifikasi" ON public.notifikasi;
DROP POLICY IF EXISTS "Anon Read Notifikasi" ON public.notifikasi;
DROP POLICY IF EXISTS "Anon Manage Notifikasi" ON public.notifikasi;

-- Izinkan pembacaan seluruh warta/notifikasi (Aktif maupun Nonaktif)
CREATE POLICY "Anon Read Notifikasi" ON public.notifikasi
    FOR SELECT TO anon, authenticated USING (true);

-- Izinkan manipulasi data (Insert, Update status, Delete) untuk anon & authenticated
CREATE POLICY "Anon Manage Notifikasi" ON public.notifikasi
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Bersihkan ID lama yang sudah dihapus / tidak ada di Spreadsheet
DELETE FROM public.notifikasi WHERE id = 'NOTIF_1791165526610';

-- 3. Sinkronkan Warta Riil Resmi (INFO SAMBANGAN) ke Supabase
INSERT INTO public.notifikasi (id, judul, kategori, tanggal, ringkasan, isi, gambar_url, is_popup, status, created_at)
VALUES 
(
  'NOTIF_1791729965634',
  'INFO SAMBANGAN',
  'Pengumuman',
  '2026-10-05',
  '✨Saatnya Menjalin Silaturahmi, Melepas Rindu, dan Sowan kepada Pengasuh.',
  '*INFO SAMBANGAN*
*PESANTREN TAHFIDZ ANAK DAN TAHFIDZ REMAJA PROGRAM KHUSUS ASNAWIYYAH*

السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ
بِسْمِ اللّهِ الرَّحْمَنِ الرَّحِيْم

Semoga Bapak Ibu Pinaringan Shihah wa ''Afiyah
Sambangan pada hari *Ahad, 11 Oktober 2026* dg Tehnis sebagai berikut :

◼️ Pintu gerbang dibuka pukul 07.30 - 17.00 WIB.
◾ Taklim bersama abi H. Ibrahim cholillullah
◼️ Wali santri wajib menyimak putra/putrinya atas perolehan hafalan minimal 15 menit di Aula Multimedia, sebelum keluar area Pesantren
◼️Administrasi sampai bulan Oktober
(*bagi Wali Santri yang masih mempunyai tanggungan mohon segera diselesaikan, Semua akan kembali ke putra putri masing2*)
◼️Menitipkan uang jajan kepada Ustadz/ah & komunikasi tentang perkembangan anak
◼️Bawakan Susu, Vitamin dan Jajan secukupnya 
◼️ Wajib menjaga kebersihan lingkungan di area sambangan.
◼️ *Santri kembali ke Pesantren pukul 16.00 WIB*
Pukul 17.00 WIB, gerbang ditutup
◼️ *Mentaati aturan Pesantren merupakan Salah satu Ikhtiyar supaya anak kerasan dan menjadi Sholih/Sholihah, Manfaah - Barokah Ilmunya.*

Demikian informasi kami sampaikan harap untuk diperhatikan dan ditaati.

*وَالْعَفْوُ مِنْكُمْ* 
*وَالله المُوَفِّق إلى أَقْوَمِ الطَّرِيْق* 
*والسَّــــــــــــلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَATُه*',
  'https://lh3.googleusercontent.com/d/1P65ZzB3dXCVTqqKIGsL_9oaDtigYvfdO',
  FALSE,
  'Nonaktif',
  '2026-10-11T14:46:05.634Z'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  is_popup = EXCLUDED.is_popup,
  judul = EXCLUDED.judul,
  kategori = EXCLUDED.kategori,
  tanggal = EXCLUDED.tanggal,
  ringkasan = EXCLUDED.ringkasan,
  isi = EXCLUDED.isi,
  gambar_url = EXCLUDED.gambar_url;
