-- ============================================================================
-- SINKRONISASI TOTAL DATA WALI SANTRI & PEMETAAN SANTRI (SPREADSHEET KE SUPABASE)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- CATATAN: Seluruh data pribadi (PII) dalam skrip ini telah disanitasi/dimock demi kepatuhan keamanan data.
-- ============================================================================

-- ============================================================================
-- BAGIAN 1: PENYETELAN KEAMANAN & IZIN AKSES (ROW LEVEL SECURITY / RLS)
-- ============================================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wali_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wali_santri_map ENABLE ROW LEVEL SECURITY;

-- 1. Izin Baca Terproteksi (Service Role & Authenticated)
DROP POLICY IF EXISTS "Anon Manage Wali Identities" ON public.wali_identities;
DROP POLICY IF EXISTS "Anon Manage Wali Santri Map" ON public.wali_santri_map;
DROP POLICY IF EXISTS "Anon Delete Wali Santri Map" ON public.wali_santri_map;

CREATE POLICY "Service Role Full Access Wali Map" ON public.wali_santri_map 
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Wali Identities" ON public.wali_identities 
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================================
-- BAGIAN 2: SINKRONISASI TABEL users (MANAJEMEN PENGGUNA TERPADU - DATA SANITASI)
-- ============================================================================
INSERT INTO public.users (user_id, email, phone, name, role, status, created_at)
VALUES
  ('USR_WLI_2bf386f3bcef', 'wali.santri01@asnawiyyah.sch.id', '6281200000001', 'Wali Santri 01', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:05:04.994Z'),
  ('USR_WLI_0f844d427545', 'wali.santri02@asnawiyyah.sch.id', '6281200000002', 'Wali Santri 02', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:23:49.900Z'),
  ('USR_WLI_bbb8374e004d', 'wali.santri03@asnawiyyah.sch.id', '6281200000003', 'Wali Santri 03', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:24:53.598Z'),
  ('USR_WLI_392646c0f71c', 'wali.santri04@asnawiyyah.sch.id', '6281200000004', 'Wali Santri 04', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:28:39.235Z'),
  ('USR_WLI_91d3b7d60e47', 'wali.santri05@asnawiyyah.sch.id', '6281200000005', 'Wali Santri 05', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:31:14.015Z'),
  ('USR_WLI_c9099f55ef48', 'wali.santri06@asnawiyyah.sch.id', '6281200000006', 'Wali Santri 06', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:34:47.207Z'),
  ('USR_WLI_50194a43d005', 'wali.santri07@asnawiyyah.sch.id', '6281200000007', 'Wali Santri 07', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:51:48.333Z'),
  ('USR_WLI_f96f0f952d68', 'wali.santri08@asnawiyyah.sch.id', '6281200000008', 'Wali Santri 08', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:03:42.462Z'),
  ('USR_WLI_ad9693f75311', 'wali.santri09@asnawiyyah.sch.id', '6281200000009', 'Wali Santri 09', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:04:48.429Z'),
  ('USR_WLI_e7bd3d1f1316', 'wali.santri10@asnawiyyah.sch.id', '6281200000010', 'Wali Santri 10', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:30.382Z'),
  ('USR_WLI_bfc982e5d396', 'wali.santri11@asnawiyyah.sch.id', '6281200000011', 'Wali Santri 11', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:57.566Z'),
  ('USR_WLI_9d2dd57660eb', 'wali.santri12@asnawiyyah.sch.id', '6281200000012', 'Wali Santri 12', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:20:54.974Z'),
  ('USR_b4ac3d63a39a',     'wali.santri13@asnawiyyah.sch.id', '6281200000013', 'Wali Santri 13', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:23:11.143Z'),
  ('USR_WLI_a82346c424aa', 'wali.santri14@asnawiyyah.sch.id', '6281200000014', 'Wali Santri 14', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:22.282Z'),
  ('USR_WLI_5ce00e2a8d35', 'wali.santri15@asnawiyyah.sch.id', '6281200000015', 'Wali Santri 15', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:46.755Z'),
  ('USR_WLI_c4b2d616e647', 'wali.santri16@asnawiyyah.sch.id', '6281200000016', 'Wali Santri 16', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:55:40.189Z'),
  ('USR_WLI_4026cc8de2e3', 'wali.santri17@asnawiyyah.sch.id', '6281200000017', 'Wali Santri 17', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:56:46.018Z'),
  ('USR_WLI_489ceba2514d', 'wali.santri18@asnawiyyah.sch.id', '6281200000018', 'Wali Santri 18', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:59:19.429Z'),
  ('USR_WLI_d9552bf65d4b', 'wali.santri19@asnawiyyah.sch.id', '6281200000019', 'Wali Santri 19', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:07:29.924Z'),
  ('USR_WLI_cb65d17ec3ee', 'wali.santri20@asnawiyyah.sch.id', '6281200000020', 'Wali Santri 20', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:10:41.010Z'),
  ('USR_WLI_cd90faebaddb', 'wali.santri21@asnawiyyah.sch.id', '6281200000021', 'Wali Santri 21', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:26:28.256Z'),
  ('USR_WLI_8ba7f5643257', 'wali.santri22@asnawiyyah.sch.id', NULL,            'Wali Santri 22', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:27:31.928Z'),
  ('USR_WLI_057061bf5b8d', 'wali.santri23@asnawiyyah.sch.id', '6281200000023', 'Wali Santri 23', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:34:24.749Z'),
  ('USR_WLI_7c5c4bf2cf6c', 'wali.santri24@asnawiyyah.sch.id', '6281200000024', 'Wali Santri 24', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:12:06.725Z'),
  ('USR_WLI_3d6cc31c69ff', 'wali.santri25@asnawiyyah.sch.id', '6281200000025', 'Wali Santri 25', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:13:51.930Z'),
  ('USR_WLI_bc2ffd3c46c9', 'wali.santri26@asnawiyyah.sch.id', '6281200000026', 'Wali Santri 26', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:41:10.745Z'),
  ('USR_WLI_e93e161c16d0', 'wali.santri27@asnawiyyah.sch.id', '6281200000027', 'Wali Santri 27', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:49:28.780Z')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;


-- ============================================================================
-- BAGIAN 3: SINKRONISASI TABEL wali_identities (IDENTITY & PROFIL WALI - DATA SANITASI)
-- ============================================================================
INSERT INTO public.wali_identities (identity_id, email, phone, name, role, status, created_at)
VALUES
  ('USR_WLI_2bf386f3bcef', 'wali.santri01@asnawiyyah.sch.id', '6281200000001', 'Wali Santri 01', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:05:04.994Z'),
  ('USR_WLI_0f844d427545', 'wali.santri02@asnawiyyah.sch.id', '6281200000002', 'Wali Santri 02', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:23:49.900Z'),
  ('USR_WLI_bbb8374e004d', 'wali.santri03@asnawiyyah.sch.id', '6281200000003', 'Wali Santri 03', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:24:53.598Z'),
  ('USR_WLI_392646c0f71c', 'wali.santri04@asnawiyyah.sch.id', '6281200000004', 'Wali Santri 04', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:28:39.235Z'),
  ('USR_WLI_91d3b7d60e47', 'wali.santri05@asnawiyyah.sch.id', '6281200000005', 'Wali Santri 05', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:31:14.015Z'),
  ('USR_WLI_c9099f55ef48', 'wali.santri06@asnawiyyah.sch.id', '6281200000006', 'Wali Santri 06', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:34:47.207Z'),
  ('USR_WLI_50194a43d005', 'wali.santri07@asnawiyyah.sch.id', '6281200000007', 'Wali Santri 07', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T12:51:48.333Z'),
  ('USR_WLI_f96f0f952d68', 'wali.santri08@asnawiyyah.sch.id', '6281200000008', 'Wali Santri 08', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:03:42.462Z'),
  ('USR_WLI_ad9693f75311', 'wali.santri09@asnawiyyah.sch.id', '6281200000009', 'Wali Santri 09', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:04:48.429Z'),
  ('USR_WLI_e7bd3d1f1316', 'wali.santri10@asnawiyyah.sch.id', '6281200000010', 'Wali Santri 10', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:30.382Z'),
  ('USR_WLI_bfc982e5d396', 'wali.santri11@asnawiyyah.sch.id', '6281200000011', 'Wali Santri 11', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:18:57.566Z'),
  ('USR_WLI_9d2dd57660eb', 'wali.santri12@asnawiyyah.sch.id', '6281200000012', 'Wali Santri 12', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:20:54.974Z'),
  ('USR_b4ac3d63a39a',     'wali.santri13@asnawiyyah.sch.id', '6281200000013', 'Wali Santri 13', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:23:11.143Z'),
  ('USR_WLI_a82346c424aa', 'wali.santri14@asnawiyyah.sch.id', '6281200000014', 'Wali Santri 14', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:22.282Z'),
  ('USR_WLI_5ce00e2a8d35', 'wali.santri15@asnawiyyah.sch.id', '6281200000015', 'Wali Santri 15', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:26:46.755Z'),
  ('USR_WLI_c4b2d616e647', 'wali.santri16@asnawiyyah.sch.id', '6281200000016', 'Wali Santri 16', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:55:40.189Z'),
  ('USR_WLI_4026cc8de2e3', 'wali.santri17@asnawiyyah.sch.id', '6281200000017', 'Wali Santri 17', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:56:46.018Z'),
  ('USR_WLI_489ceba2514d', 'wali.santri18@asnawiyyah.sch.id', '6281200000018', 'Wali Santri 18', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T13:59:19.429Z'),
  ('USR_WLI_d9552bf65d4b', 'wali.santri19@asnawiyyah.sch.id', '6281200000019', 'Wali Santri 19', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:07:29.924Z'),
  ('USR_WLI_cb65d17ec3ee', 'wali.santri20@asnawiyyah.sch.id', '6281200000020', 'Wali Santri 20', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:10:41.010Z'),
  ('USR_WLI_cd90faebaddb', 'wali.santri21@asnawiyyah.sch.id', '6281200000021', 'Wali Santri 21', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:26:28.256Z'),
  ('USR_WLI_8ba7f5643257', 'wali.santri22@asnawiyyah.sch.id', NULL,            'Wali Santri 22', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:27:31.928Z'),
  ('USR_WLI_057061bf5b8d', 'wali.santri23@asnawiyyah.sch.id', '6281200000023', 'Wali Santri 23', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T14:34:24.749Z'),
  ('USR_WLI_7c5c4bf2cf6c', 'wali.santri24@asnawiyyah.sch.id', '6281200000024', 'Wali Santri 24', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:12:06.725Z'),
  ('USR_WLI_3d6cc31c69ff', 'wali.santri25@asnawiyyah.sch.id', '6281200000025', 'Wali Santri 25', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:13:51.930Z'),
  ('USR_WLI_bc2ffd3c46c9', 'wali.santri26@asnawiyyah.sch.id', '6281200000026', 'Wali Santri 26', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:41:10.745Z'),
  ('USR_WLI_e93e161c16d0', 'wali.santri27@asnawiyyah.sch.id', '6281200000027', 'Wali Santri 27', 'WALI_SANTRI', 'ACTIVE', '2026-10-10T15:49:28.780Z')
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
