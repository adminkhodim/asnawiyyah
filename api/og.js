const fs = require('fs');
const path = require('path');

const GAS_API_URL = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://tkjhfhyabacbyknwrysh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function resolveImageUrl(newsItem) {
    const DEFAULT_BANNER = 'https://asnawiyyah.or.id/assets/img/og-banner.jpg';
    if (!newsItem) return DEFAULT_BANNER;

    // Periksa semua kemungkinan nama properti gambar di Supabase, GAS, dan form input
    let raw = newsItem.gambar_url || newsItem.foto_url || newsItem.gambar || newsItem.Gambar_URL || newsItem.image || newsItem.thumbnail || '';
    if (typeof raw === 'string') raw = raw.trim();

    // WhatsApp dan Open Graph TIDAK mendukung data:image/ base64 sebagai og:image.
    // Jika berupa base64, buang agar mencari alternatif gambar URL atau fallback resmi.
    if (raw.startsWith('data:')) {
        raw = '';
    }

    // Jika kosong atau gambar placeholder default unsplash, coba cari dari tag <img> di dalam isi berita
    if ((!raw || raw.includes('photo-1584286595398-a59f21d313f5')) && newsItem.isi) {
        const match = String(newsItem.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
            const foundSrc = match[1].trim();
            if (!foundSrc.startsWith('data:') && !foundSrc.includes('photo-1584286595398-a59f21d313f5')) {
                raw = foundSrc;
            }
        }
    }

    if (!raw || raw.startsWith('data:') || raw.includes('photo-1584286595398-a59f21d313f5')) {
        return DEFAULT_BANNER;
    }

    // Normalisasi Google Drive link HANYA jika domain/pola Google Drive terkonfirmasi
    // (Mencegah false-positive regex pada string panjang acak)
    const isGoogleDomain = raw.includes('googleusercontent.com') || raw.includes('drive.google.com') || raw.includes('docs.google.com');
    if (isGoogleDomain) {
        const driveMatch = raw.match(/(?:id=|d\/|open\?id=)([a-zA-Z0-9_-]{25,})/);
        if (driveMatch && driveMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
        }
    }

    // Pastikan URL absolut
    if (raw.startsWith('/')) {
        return `https://asnawiyyah.or.id${raw}`;
    } else if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
        return `https://asnawiyyah.or.id/${raw}`;
    }

    return raw;
}

async function fetchNewsItem(slug) {
    if (!slug) return null;
    const cleanSlug = encodeURIComponent(slug.trim());
    let itemFromSb = null;

    // 1. Akselerasi tercepat via Supabase Cloud (<50ms)
    try {
        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/berita?or=(slug.eq.${cleanSlug},news_id.eq.${cleanSlug})&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            signal: AbortSignal.timeout(2500)
        });
        if (sbRes.ok) {
            const rows = await sbRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
                itemFromSb = rows[0];
                const rawImg = itemFromSb.gambar_url || itemFromSb.foto_url || '';
                // Jika data Supabase sudah memiliki URL HTTP yang valid (bukan Base64), langsung return
                if (rawImg && rawImg.startsWith('http')) {
                    return itemFromSb;
                }
            }
        }
    } catch (sbErr) {
        console.warn("Supabase fetch in OG failed, falling back to GAS:", sbErr.message);
    }

    // 2. Fallback via Google Apps Script (termasuk jika Supabase ada namun gambarnya masih Base64)
    try {
        const scriptUrl = `${GAS_API_URL}?action=getKabar`;
        const response = await fetch(scriptUrl, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();
        if (data && data.status === 'success' && Array.isArray(data.data)) {
            const gasItem = data.data.find(n => n.slug === slug || n.news_id === slug) || null;
            if (gasItem) {
                if (itemFromSb) {
                    // Gabungkan foto valid dari GAS ke data Supabase
                    itemFromSb.gambar_url = gasItem.gambar || gasItem.Gambar_URL || itemFromSb.gambar_url;
                    return itemFromSb;
                }
                return gasItem;
            }
        }
    } catch (gasErr) {
        console.warn("GAS fetch in OG failed:", gasErr.message);
    }

    return itemFromSb;
}

module.exports = async function handler(req, res) {
    const { slug } = req.query;

    try {
        const newsItem = await fetchNewsItem(slug);

        // Read local index.html
        const indexPath = path.join(process.cwd(), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');

        if (newsItem) {
            const title = `${newsItem.judul} | PPTQ Asnawiyyah`;
            let rawDesc = newsItem.ringkasan || (newsItem.isi ? String(newsItem.isi).replace(/<[^>]*>/g, '').substring(0, 160) : '') || `Baca warta selengkapnya tentang ${newsItem.judul}`;
            rawDesc = rawDesc.replace(/\s+/g, ' ').trim();
            const description = rawDesc;
            
            const image = resolveImageUrl(newsItem);
            const url = `https://asnawiyyah.or.id/berita/${newsItem.slug || slug}`;

            // Bersihkan semua metadata lama agar tidak duplikat dan membingungkan crawler (WhatsApp, FB, Twitter, dll)
            html = html
                .replace(/<title>[\s\S]*?<\/title>/i, '')
                .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
                .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '')
                .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
                .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
                .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
                .replace(/<link\s+rel=["']image_src["'][^>]*>/gi, '');

            const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />

    <!-- Open Graph (WhatsApp, Facebook, Telegram, LinkedIn) -->
    <meta property="og:site_name" content="PPTQ Asnawiyyah" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(newsItem.judul || 'Berita PPTQ Asnawiyyah')}" />
    <link rel="image_src" href="${escapeHtml(image)}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(url)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
            `;

            // Sisipkan meta tags baru tepat di awal <head>
            html = html.replace(/<head>/i, `<head>\n${metaTags}`);
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // Server cache 1 min, SWR 5 min
        res.status(200).send(html);

    } catch (error) {
        console.error("Error generating OG preview:", error);
        try {
            const indexPath = path.join(process.cwd(), 'index.html');
            const html = fs.readFileSync(indexPath, 'utf8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.status(200).send(html);
        } catch (readError) {
            res.status(500).send("Internal Server Error");
        }
    }
};
