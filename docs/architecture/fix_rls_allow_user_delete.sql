-- ============================================================================
-- SQL PERBAIKAN: IZINKAN HAPUS PENGGUNA UNTUK SUPER ADMIN (DUAL SYNC DELETE)
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE (POSTGRESQL)
-- Project: tkjhfhyabacbyknwrysh
-- ============================================================================
-- Penjelasan:
-- Tombol Hapus Pengguna hanya dapat diakses oleh SUPER_ADMIN pada dashboard.
-- Agar pembersihan akun spam/bot tersinkronisasi tuntas di Supabase Cloud DB,
-- policy DELETE pada tabel public.users dan public.wali_santri_map diaktifkan.
-- Disertakan juga query untuk langsung membersihkan 4 akun spam bot seketika.
-- ============================================================================

-- 1. Policy DELETE untuk tabel Users
DROP POLICY IF EXISTS "Anon Delete Users" ON public.users;

CREATE POLICY "Anon Delete Users" ON public.users
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 2. Policy DELETE untuk tabel Wali Santri Map (Relasi Wali - Santri)
DROP POLICY IF EXISTS "Anon Delete Wali Santri Map" ON public.wali_santri_map;

CREATE POLICY "Anon Delete Wali Santri Map" ON public.wali_santri_map
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 3. Bersihkan langsung 4 akun anomali / spam bot dari Supabase Cloud DB
DELETE FROM public.wali_santri_map
WHERE wali_id IN (
    SELECT user_id FROM public.users 
    WHERE name IN ('hSnVzdQSGcvCcZxoKzC', 'alOFajadzRdfLpWbYI', 'pEeuvqHBqojCMSkejS', 'cmdduJPofyHxoLWKNQvqwhPf')
       OR email IN (
           'o.qi.ze.p.ejac1.9@gmail.com',
           'a.da.m.s.n.atal.ie.a.lg.gp.m.1@gmail.com',
           'pat.ri.ci.ae.dwa.r.dseir.vjv.kr5@gmail.com',
           'c.a.wp.be.l.l.t.y.l.e.r.x.g.iy.7.u.l.q.p6@gmail.com'
       )
);

DELETE FROM public.users 
WHERE name IN ('hSnVzdQSGcvCcZxoKzC', 'alOFajadzRdfLpWbYI', 'pEeuvqHBqojCMSkejS', 'cmdduJPofyHxoLWKNQvqwhPf')
   OR email IN (
       'o.qi.ze.p.ejac1.9@gmail.com',
       'a.da.m.s.n.atal.ie.a.lg.gp.m.1@gmail.com',
       'pat.ri.ci.ae.dwa.r.dseir.vjv.kr5@gmail.com',
       'c.a.wp.be.l.l.t.y.l.e.r.x.g.iy.7.u.l.q.p6@gmail.com'
   );
