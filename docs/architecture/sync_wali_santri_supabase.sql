-- ============================================================================
-- SINKRONISASI TOTAL DATA WALI SANTRI & PEMETAAN SANTRI (SPREADSHEET KE SUPABASE)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================

-- ============================================================================
-- BAGIAN 1: PENYETELAN KEAMANAN & IZIN AKSES (ROW LEVEL SECURITY / RLS)
-- ============================================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wali_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wali_santri_map ENABLE ROW LEVEL SECURITY;

-- 1. Izin Baca Cepat (Fast-Read <50ms) untuk Pengunjung Web & Admin
DROP POLICY IF EXISTS "Anon Read Users" ON public.users;
CREATE POLICY "Anon Read Users" ON public.users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Read Wali Identities" ON public.wali_identities;
CREATE POLICY "Anon Read Wali Identities" ON public.wali_identities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anon Read Wali Santri Map" ON public.wali_santri_map;
CREATE POLICY "Anon Read Wali Santri Map" ON public.wali_santri_map FOR SELECT TO anon, authenticated USING (true);

-- 2. Izin Tulis untuk Aktivasi Mandiri Wali Santri & Admin
DROP POLICY IF EXISTS "Anon Insert Wali Users" ON public.users;
CREATE POLICY "Anon Insert Wali Users" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (role = 'WALI_SANTRI');

DROP POLICY IF EXISTS "Admin Manage Users" ON public.users;
CREATE POLICY "Admin Manage Users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Manage Wali Identities" ON public.wali_identities;
CREATE POLICY "Anon Manage Wali Identities" ON public.wali_identities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Manage Wali Santri Map" ON public.wali_santri_map;
CREATE POLICY "Anon Manage Wali Santri Map" ON public.wali_santri_map FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ============================================================================
-- BAGIAN 2: SINKRONISASI TABEL users (MANAJEMEN PENGGUNA TERPADU)
-- ============================================================================
INSERT INTO public.users (user_id, email, phone, name, role, status, created_at)
VALUES
  ('USR_WLI_2bf386f3bcef', 'iraruswita22@gmail.com', '82242870939', 'Ira Ruswita', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:05:04.994Z'),
  ('USR_WLI_0f844d427545', 'fasikhatul.munawaroh@gmail.com', '85640286285', 'Fasikhatul Munawaroh', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:23:49.900Z'),
  ('USR_WLI_bbb8374e004d', 'ka.astrueblue@gmail.com', '895395169988', 'Kasful Asrori/ Luluk Barokah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:24:53.598Z'),
  ('USR_WLI_392646c0f71c', 'lintangrizky1987@gmail.com', '85935254147', 'Nurohmah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:28:39.235Z'),
  ('USR_WLI_91d3b7d60e47', 'alrcatir112@gmail.com', '85726959334', 'FITRIYATUN NAFIAH', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:31:14.015Z'),
  ('USR_WLI_c9099f55ef48', 'all.alimah47@gmail.com', '81228476687', 'Mu''alimah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:34:47.207Z'),
  ('USR_WLI_50194a43d005', 'burhanalya@gmail.com', '81225040333', 'Burhan Aly Azhar', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:51:48.333Z'),
  ('USR_WLI_f96f0f952d68', 'saekhulhadi872@gmail.com', '85229446068', 'Saekhul Hadi', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:03:42.462Z'),
  ('USR_WLI_ad9693f75311', 'milakamilah10@gmail.com', '85727027963', 'Mubrotun kamilah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:04:48.429Z'),
  ('USR_WLI_e7bd3d1f1316', 'facenovaid@gmail.com', '89653887640', 'Bpk. Nazir', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:30.382Z'),
  ('USR_WLI_bfc982e5d396', 'mardliyahsiap@gmail.com', '83148481474', 'Muhammad Islahuddin', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:57.566Z'),
  ('USR_WLI_9d2dd57660eb', 'dulkemplu6@gmail.com', '82314089535', 'Abdul Adlim', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:20:54.974Z'),
  ('USR_b4ac3d63a39a', 'shopiah1905@gmail.com', '8895236264', 'Shopiah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:23:11.143Z'),
  ('USR_WLI_a82346c424aa', 'lutfiaturohmah04@gmail.com', '89637476557', 'Alayya naufalyn fikria', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:22.282Z'),
  ('USR_WLI_5ce00e2a8d35', 'faisalalazis93@gmail.com', '81325324487', 'Nur khasanah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:46.755Z'),
  ('USR_WLI_c4b2d616e647', 'afifudin079@gmail.com', '85640674693', 'Afifudin', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:55:40.189Z'),
  ('USR_WLI_4026cc8de2e3', 'eka.septiana8888@gmail.com', '81215480789', 'Eka Septiana Pujaningrum', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:56:46.018Z'),
  ('USR_WLI_489ceba2514d', 'alanafif29@gmail.com', '895604429383', 'Lisanah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:59:19.429Z'),
  ('USR_WLI_d9552bf65d4b', 'riyantosulkhan@gmail.com', '85216899942', 'Sulkhan Riyanto', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:07:29.924Z'),
  ('USR_WLI_cb65d17ec3ee', 'abinasuha02@gmail.com', '81225888950', 'Winarko', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:10:41.010Z'),
  ('USR_WLI_cd90faebaddb', 'liyahlailiyah131@gmail.com', '81330408602', 'Alvino123@gmail.com 07122009', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:26:28.256Z'),
  ('USR_WLI_8ba7f5643257', 'sriharyo212@gmail.com', NULL, 'Sriharyo 12', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:27:31.928Z'),
  ('USR_WLI_057061bf5b8d', 'warnotoprojek@gmail.com', '82322272021', 'Warnoto', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:34:24.749Z'),
  ('USR_WLI_7c5c4bf2cf6c', 'dmuzaki4@gmail.com', '82244220052', 'Muhamad Ali imron', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:12:06.725Z'),
  ('USR_WLI_3d6cc31c69ff', 'lurahbu783@gmail.com', '82134038536', 'Ali Mustain S.H / Muzaroah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:13:51.930Z'),
  ('USR_WLI_bc2ffd3c46c9', 'sitisolekah0592@gmail.com', '895363645642', 'Agus supriyadi/Siti solekah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:41:10.745Z'),
  ('USR_WLI_e93e161c16d0', 'ahmadghozali339@gmail.com', '87736381437', 'Ali Ma''rup', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:49:28.780Z')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;


-- ============================================================================
-- BAGIAN 3: SINKRONISASI TABEL wali_identities (IDENTITY & PROFIL WALI)
-- ============================================================================
INSERT INTO public.wali_identities (identity_id, email, phone, name, role, status, created_at)
VALUES
  ('USR_WLI_2bf386f3bcef', 'iraruswita22@gmail.com', '82242870939', 'Ira Ruswita', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:05:04.994Z'),
  ('USR_WLI_0f844d427545', 'fasikhatul.munawaroh@gmail.com', '85640286285', 'Fasikhatul Munawaroh', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:23:49.900Z'),
  ('USR_WLI_bbb8374e004d', 'ka.astrueblue@gmail.com', '895395169988', 'Kasful Asrori/ Luluk Barokah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:24:53.598Z'),
  ('USR_WLI_392646c0f71c', 'lintangrizky1987@gmail.com', '85935254147', 'Nurohmah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:28:39.235Z'),
  ('USR_WLI_91d3b7d60e47', 'alrcatir112@gmail.com', '85726959334', 'FITRIYATUN NAFIAH', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:31:14.015Z'),
  ('USR_WLI_c9099f55ef48', 'all.alimah47@gmail.com', '81228476687', 'Mu''alimah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:34:47.207Z'),
  ('USR_WLI_50194a43d005', 'burhanalya@gmail.com', '81225040333', 'Burhan Aly Azhar', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:51:48.333Z'),
  ('USR_WLI_f96f0f952d68', 'saekhulhadi872@gmail.com', '85229446068', 'Saekhul Hadi', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:03:42.462Z'),
  ('USR_WLI_ad9693f75311', 'milakamilah10@gmail.com', '85727027963', 'Mubrotun kamilah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:04:48.429Z'),
  ('USR_WLI_e7bd3d1f1316', 'facenovaid@gmail.com', '89653887640', 'Bpk. Nazir', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:30.382Z'),
  ('USR_WLI_bfc982e5d396', 'mardliyahsiap@gmail.com', '83148481474', 'Muhammad Islahuddin', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:57.566Z'),
  ('USR_WLI_9d2dd57660eb', 'dulkemplu6@gmail.com', '82314089535', 'Abdul Adlim', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:20:54.974Z'),
  ('USR_b4ac3d63a39a', 'shopiah1905@gmail.com', '8895236264', 'Shopiah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:23:11.143Z'),
  ('USR_WLI_a82346c424aa', 'lutfiaturohmah04@gmail.com', '89637476557', 'Alayya naufalyn fikria', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:22.282Z'),
  ('USR_WLI_5ce00e2a8d35', 'faisalalazis93@gmail.com', '81325324487', 'Nur khasanah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:46.755Z'),
  ('USR_WLI_c4b2d616e647', 'afifudin079@gmail.com', '85640674693', 'Afifudin', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:55:40.189Z'),
  ('USR_WLI_4026cc8de2e3', 'eka.septiana8888@gmail.com', '81215480789', 'Eka Septiana Pujaningrum', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:56:46.018Z'),
  ('USR_WLI_489ceba2514d', 'alanafif29@gmail.com', '895604429383', 'Lisanah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:59:19.429Z'),
  ('USR_WLI_d9552bf65d4b', 'riyantosulkhan@gmail.com', '85216899942', 'Sulkhan Riyanto', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:07:29.924Z'),
  ('USR_WLI_cb65d17ec3ee', 'abinasuha02@gmail.com', '81225888950', 'Winarko', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:10:41.010Z'),
  ('USR_WLI_cd90faebaddb', 'liyahlailiyah131@gmail.com', '81330408602', 'Alvino123@gmail.com 07122009', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:26:28.256Z'),
  ('USR_WLI_8ba7f5643257', 'sriharyo212@gmail.com', NULL, 'Sriharyo 12', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:27:31.928Z'),
  ('USR_WLI_057061bf5b8d', 'warnotoprojek@gmail.com', '82322272021', 'Warnoto', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:34:24.749Z'),
  ('USR_WLI_7c5c4bf2cf6c', 'dmuzaki4@gmail.com', '82244220052', 'Muhamad Ali imron', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:12:06.725Z'),
  ('USR_WLI_3d6cc31c69ff', 'lurahbu783@gmail.com', '82134038536', 'Ali Mustain S.H / Muzaroah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:13:51.930Z'),
  ('USR_WLI_bc2ffd3c46c9', 'sitisolekah0592@gmail.com', '895363645642', 'Agus supriyadi/Siti solekah', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:41:10.745Z'),
  ('USR_WLI_e93e161c16d0', 'ahmadghozali339@gmail.com', '87736381437', 'Ali Ma''rup', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:49:28.780Z')
ON CONFLICT (identity_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;


-- ============================================================================
-- BAGIAN 4: SINKRONISASI TABEL wali_santri_map (PEMETAAN RELASI KE SANTRI)
-- Termasuk Wali yang memiliki Multi-Santri (Contoh: Ira Ruswita -> STD-032 & STD-102)
-- ============================================================================
INSERT INTO public.wali_santri_map (map_id, wali_id, student_id, relationship, status, created_at)
VALUES
  ('MAP_122f358512154d56', 'USR_WLI_2bf386f3bcef', 'STD-032', 'MOTHER', 'VERIFIED', '2026-10-10T12:05:04.994Z'),
  ('MAP_1fdfec0c83014ca9', 'USR_WLI_0f844d427545', 'STD-094', 'GUARDIAN', 'VERIFIED', '2026-10-10T12:23:49.900Z'),
  ('MAP_0410bb2d1ff043c9', 'USR_WLI_bbb8374e004d', 'STD-136', 'GUARDIAN', 'VERIFIED', '2026-10-10T12:24:53.598Z'),
  ('MAP_a47938e098eb4ec6', 'USR_WLI_392646c0f71c', 'STD-126', 'MOTHER', 'VERIFIED', '2026-10-10T12:28:39.235Z'),
  ('MAP_dde70a70eb5e4d63', 'USR_WLI_91d3b7d60e47', 'STD-016', 'MOTHER', 'VERIFIED', '2026-10-10T12:31:14.015Z'),
  ('MAP_7d422f937d3e4a06', 'USR_WLI_c9099f55ef48', 'STD-056', 'MOTHER', 'VERIFIED', '2026-10-10T12:34:47.207Z'),
  ('MAP_99a3701c008a42cf', 'USR_WLI_50194a43d005', 'STD-025', 'FATHER', 'VERIFIED', '2026-10-10T12:51:48.333Z'),
  ('MAP_03d46438a9ab42e9', 'USR_WLI_f96f0f952d68', 'STD-051', 'GUARDIAN', 'VERIFIED', '2026-10-10T13:03:42.462Z'),
  ('MAP_2a24ecfac7404c37', 'USR_WLI_ad9693f75311', 'STD-044', 'MOTHER', 'VERIFIED', '2026-10-10T13:04:48.429Z'),
  ('MAP_369e7f58e2c84a3f', 'USR_WLI_e7bd3d1f1316', 'STD-000', 'GUARDIAN', 'VERIFIED', '2026-10-10T13:18:30.382Z'),
  ('MAP_2e9575f1940549a4', 'USR_WLI_bfc982e5d396', 'STD-022', 'FATHER', 'VERIFIED', '2026-10-10T13:18:57.566Z'),
  ('MAP_94d25dc697684ec6', 'USR_WLI_9d2dd57660eb', 'STD-002', 'FATHER', 'VERIFIED', '2026-10-10T13:20:54.974Z'),
  ('MAP_04a580797c45',     'USR_b4ac3d63a39a',     'STD-062', 'MOTHER', 'VERIFIED', '2026-10-10T13:23:11.143Z'),
  ('MAP_a1e4b832cb5f4569', 'USR_WLI_a82346c424aa', 'STD-109', 'GUARDIAN', 'VERIFIED', '2026-10-10T13:26:22.282Z'),
  ('MAP_4cd501f97fb24031', 'USR_WLI_5ce00e2a8d35', 'STD-040', 'GUARDIAN', 'VERIFIED', '2026-10-10T13:26:46.755Z'),
  ('MAP_60fcebc4587c4312', 'USR_WLI_c4b2d616e647', 'STD-118', 'FATHER', 'VERIFIED', '2026-10-10T13:55:40.189Z'),
  ('MAP_e98f39fbe8054435', 'USR_WLI_4026cc8de2e3', 'STD-131', 'MOTHER', 'VERIFIED', '2026-10-10T13:56:46.018Z'),
  ('MAP_92d05b47e3db4b47', 'USR_WLI_489ceba2514d', 'STD-017', 'MOTHER', 'VERIFIED', '2026-10-10T13:59:19.429Z'),
  ('MAP_30bcbc80e78d4894', 'USR_WLI_d9552bf65d4b', 'STD-055', 'FATHER', 'VERIFIED', '2026-10-10T14:07:29.924Z'),
  ('MAP_ccd6014b77e346a5', 'USR_WLI_cb65d17ec3ee', 'STD-065', 'FATHER', 'VERIFIED', '2026-10-10T14:10:41.010Z'),
  ('MAP_7c8be17ba7d64bc6', 'USR_WLI_cd90faebaddb', 'STD-133', 'GUARDIAN', 'VERIFIED', '2026-10-10T14:26:28.256Z'),
  ('MAP_95c4ab19787e4f96', 'USR_WLI_8ba7f5643257', 'STD-125', 'GUARDIAN', 'VERIFIED', '2026-10-10T14:27:31.928Z'),
  ('MAP_55413a93dad342e1', 'USR_WLI_057061bf5b8d', 'STD-068', 'GUARDIAN', 'VERIFIED', '2026-10-10T14:34:24.749Z'),
  ('MAP_571d9e565e334623', 'USR_WLI_7c5c4bf2cf6c', 'STD-041', 'FATHER', 'VERIFIED', '2026-10-10T15:12:06.725Z'),
  ('MAP_1850f5f6a451465e', 'USR_WLI_3d6cc31c69ff', 'STD-106', 'GUARDIAN', 'VERIFIED', '2026-10-10T15:13:51.930Z'),
  ('MAP_b8ea0cf8f16f4d33', 'USR_WLI_2bf386f3bcef', 'STD-102', 'MOTHER', 'VERIFIED', '2026-10-10T15:24:42.064Z'),
  ('MAP_3ebfaa0773294b4e', 'USR_WLI_bc2ffd3c46c9', 'STD-028', 'FATHER', 'VERIFIED', '2026-10-10T15:41:10.745Z'),
  ('MAP_a42abcee8e034933', 'USR_WLI_e93e161c16d0', 'STD-123', 'GUARDIAN', 'VERIFIED', '2026-10-10T15:49:28.780Z')
ON CONFLICT (map_id) DO UPDATE SET
  wali_id = EXCLUDED.wali_id,
  student_id = EXCLUDED.student_id,
  relationship = EXCLUDED.relationship,
  status = EXCLUDED.status;
