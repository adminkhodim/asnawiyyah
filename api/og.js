const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
    const { slug } = req.query;

    try {
        // Fetch data from Google Apps Script
        const scriptUrl = "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec?action=getKabar";
        const response = await fetch(scriptUrl);
        const data = await response.json();

        let newsItem = null;
        if (data && data.status === 'success' && Array.isArray(data.data)) {
            newsItem = data.data.find(n => n.slug === slug || n.news_id === slug);
        }

        // Read local index.html
        const indexPath = path.join(process.cwd(), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');

        if (newsItem) {
            const title = `${newsItem.judul} | PPTQ Asnawiyyah`;
            const description = newsItem.ringkasan || `Baca selengkapnya tentang ${newsItem.judul}`;
            const image = newsItem.gambar || "https://asnawiyyah.vercel.app/assets/img/logo-asnawiyyah.jpg"; // Fallback image
            const url = `https://asnawiyyah.vercel.app/berita/${newsItem.slug}`;

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
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // Server cache for 1 min, SWR 5 min
        res.status(200).send(html);

    } catch (error) {
        console.error("Error generating OG preview:", error);
        try {
            // Fallback to sending original index.html on error
            const indexPath = path.join(process.cwd(), 'index.html');
            const html = fs.readFileSync(indexPath, 'utf8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.status(200).send(html);
        } catch (readError) {
            res.status(500).send("Internal Server Error");
        }
    }
}
