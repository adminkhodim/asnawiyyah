const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Fetching latest news from Google Apps Script Web App...");
    const res = await fetch('https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec?action=getKabar');
    const json = await res.json();
    const data = json.data || [];
    console.log(`Found ${data.length} news items from Google Sheets.`);

    const news11 = data.find(x => x.news_id === 'NWS_1791633317427_mqpu');

    const escapeSql = (str) => {
        if (!str) return 'NULL';
        return "'" + String(str).replace(/'/g, "''") + "'";
    };

    let sql = `-- ============================================================================
-- SINKRONISASI TOTAL BERITA & VIEWS ANTARA GOOGLE SHEETS & SUPABASE
-- PPTQ ASNAWIYYAH - CLOUD DATABASE SUPABASE
-- ============================================================================

-- 1. Buka Izin RLS (Row Level Security) agar Insert & Update Views diizinkan
ALTER TABLE IF EXISTS public.berita ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Manage Berita" ON public.berita;
DROP POLICY IF EXISTS "Anon Manage Berita" ON public.berita;
DROP POLICY IF EXISTS "Public Read Active Berita" ON public.berita;
DROP POLICY IF EXISTS "Anon Read Berita" ON public.berita;

CREATE POLICY "Anon Read Berita" ON public.berita FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon Manage Berita" ON public.berita FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Masukkan Berita ke-11 (Podcast Alumni yang baru dipublish Pengasuh)
INSERT INTO public.berita (news_id, slug, tanggal, judul, kategori, penulis, gambar_url, foto_url, ringkasan, isi, views, status, created_at)
VALUES (
  ${escapeSql(news11.news_id)},
  ${escapeSql(news11.slug)},
  ${escapeSql(news11.tanggal)},
  ${escapeSql(news11.judul)},
  ${escapeSql(news11.kategori)},
  ${escapeSql(news11.penulis)},
  ${escapeSql(news11.gambar)},
  ${escapeSql(news11.gambar)},
  ${escapeSql(news11.ringkasan)},
  ${escapeSql(news11.isi)},
  0,
  'Publish',
  NOW()
) ON CONFLICT (news_id) DO UPDATE SET
  judul = EXCLUDED.judul,
  slug = EXCLUDED.slug,
  isi = EXCLUDED.isi,
  gambar_url = EXCLUDED.gambar_url,
  foto_url = EXCLUDED.foto_url;

-- 3. Sinkronkan Nilai Views Seluruh Berita ke Angka Riil Terbaru di Google Sheets
`;

    data.forEach(n => {
        sql += `UPDATE public.berita SET views = ${Number(n.views) || 0} WHERE news_id = '${n.news_id}';\n`;
    });

    sql += `\n-- 4. Verifikasi Hasil Sinkronisasi (Harus Menampilkan Tepat 11 Berita)\nSELECT news_id, judul, views, status FROM public.berita ORDER BY created_at DESC;\n`;

    const outPath = path.join(__dirname, '../docs/architecture/sync_all_berita_supabase.sql');
    fs.writeFileSync(outPath, sql, 'utf8');
    console.log(`✅ SQL sync file created at ${outPath} (${sql.length} bytes)`);
}

main().catch(console.error);
