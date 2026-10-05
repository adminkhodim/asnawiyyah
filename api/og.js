const fs = require('fs');
const path = require('path');

const GAS_API_URL = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://tkjhfhyabacbyknwrysh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";

async function fetchNewsItem(slug) {
    if (!slug) return null;
    const cleanSlug = encodeURIComponent(slug.trim());

    // 1. Akselerasi tercepat via Supabase Cloud (<50ms)
    try {
        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/berita?or=(slug.eq.${cleanSlug},news_id.eq.${cleanSlug})&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            signal: AbortSignal.timeout(2500)
        });
        if (sbRes.ok) {
            const rows = await sbRes.json();
            if (Array.isArray(rows) && rows.length > 0) {
                return rows[0];
            }
        }
    } catch (sbErr) {
        console.warn("Supabase fetch in OG failed, falling back to GAS:", sbErr.message);
    }

    // 2. Fallback via Google Apps Script
    try {
        const scriptUrl = `${GAS_API_URL}?action=getKabar`;
        const response = await fetch(scriptUrl, { signal: AbortSignal.timeout(4000) });
        const data = await response.json();
        if (data && data.status === 'success' && Array.isArray(data.data)) {
            return data.data.find(n => n.slug === slug || n.news_id === slug) || null;
        }
    } catch (gasErr) {
        console.warn("GAS fetch in OG failed:", gasErr.message);
    }

    return null;
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
            const description = newsItem.ringkasan || `Baca selengkapnya tentang ${newsItem.judul}`;
            
            // Prioritas gambar cover: newsItem.gambar -> gambar pertama di isi -> banner resmi
            let image = (newsItem.gambar && String(newsItem.gambar).trim()) ? newsItem.gambar : '';
            if ((!image || image.includes('photo-1584286595398-a59f21d313f5')) && newsItem.isi) {
                const match = String(newsItem.isi).match(/<img[^>]+src=["']([^"']+)["']/i);
                if (match && match[1] && !match[1].includes('photo-1584286595398-a59f21d313f5')) {
                    image = match[1];
                }
            }
            if (!image || image.includes('photo-1584286595398-a59f21d313f5')) {
                image = "https://asnawiyyah.or.id/assets/img/og-banner.jpg";
            }

            const url = `https://asnawiyyah.or.id/berita/${newsItem.slug || slug}`;

            const metaTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
            `;

            // Replace existing title and inject metadata
            html = html.replace(/<title>.*?<\/title>/is, metaTags);
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

