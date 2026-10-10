-- ============================================================================
-- SQL PERBAIKAN: AKTIFKAN DETEKSI USER ONLINE (PRESENCE HEARTBEAT)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Penjelasan:
-- Fitur deteksi pengguna online bekerja dengan mengirim sinyal heartbeat (last_seen_at)
-- secara berkala dari browser ke Supabase.
-- Agar heartbeat dapat memperbarui timestamp last_seen_at, kita menambahkan
-- kebijakan RLS UPDATE khusus untuk 'anon, authenticated'.
-- ============================================================================

-- 1. Tambahkan Policy UPDATE untuk anon agar heartbeat last_seen_at tersimpan
DROP POLICY IF EXISTS "Anon Update Presence" ON public.users;

CREATE POLICY "Anon Update Presence" ON public.users
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Pastikan kolom last_seen_at dan device_info ada dan siap digunakan
ALTER TABLE IF EXISTS public.users 
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS device_info JSONB,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 3. Update pengguna Admin Utama saat ini agar langsung terdeteksi online
UPDATE public.users 
SET last_seen_at = timezone('utc'::text, now())
WHERE role IN ('SUPER_ADMIN', 'ADMIN') 
   OR email IN ('izzatatabik@gmail.com', 'adminkhodim@gmail.com');
