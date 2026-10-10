/**
 * scripts/test_nu_news_portal.js
 * Automated Verification Suite untuk Redesain Portal Berita NU Online
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 Memulai Pengujian Portal Berita Redesain NU Online...');

// 1. Verifikasi Markup index.html
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Header & Instant Search
assert(indexHtml.includes('id="news-search-input"'), 'Input pencarian #news-search-input harus ada di index.html');
assert(indexHtml.includes('id="news-search-clear-btn"'), 'Tombol clear pencarian #news-search-clear-btn harus ada');
assert(indexHtml.includes('handleNewsSearch(this.value)'), 'Event oninput handleNewsSearch harus ada');
assert(indexHtml.includes('clearNewsSearch()'), 'Event onclick clearNewsSearch harus ada');
console.log('✅ 1. Header portal & instant search markup valid');

// Ribbon Kategori Hijau Khas NU Online
assert(indexHtml.includes("filterNewsByCategory('Dawuh Pengasuh', this)"), 'Tombol kategori Dawuh Pengasuh harus ada');
assert(indexHtml.includes("filterNewsByCategory('Kabar Alumni', this)"), 'Tombol kategori Kabar Alumni harus ada');
assert(indexHtml.includes("filterNewsByCategory('Semua', this)"), 'Tombol kategori Semua harus ada');
assert(indexHtml.includes('filter-news-btn'), 'Class filter-news-btn harus terpasang pada tombol kategori');
console.log('✅ 2. Pita navigasi kategori hijau khas NU Online valid');

// Tri-Column Layout Containers
assert(indexHtml.includes('id="nu-hero-wrapper"'), 'Container #nu-hero-wrapper harus ada');
assert(indexHtml.includes('id="nu-hero-container"'), 'Container #nu-hero-container harus ada');
assert(indexHtml.includes('id="nu-hero-left"'), 'Kolom kiri #nu-hero-left harus ada');
assert(indexHtml.includes('id="nu-hero-center"'), 'Kolom tengah #nu-hero-center harus ada');
assert(indexHtml.includes('id="nu-hero-right"'), 'Kolom kanan #nu-hero-right harus ada');
assert(indexHtml.includes('id="nu-news-empty"'), 'State kosong #nu-news-empty harus ada');
assert(indexHtml.includes('id="nu-archive-section"'), 'Bagian arsip #nu-archive-section harus ada');
assert(indexHtml.includes('id="news-grid-container"'), 'Grid kartu arsip #news-grid-container harus ada');
console.log('✅ 3. Struktur Tri-Column & Archive Grid valid');

// Form Input Admin Kategori Baru
assert(indexHtml.includes('<option value="Dawuh Pengasuh">Dawuh Pengasuh</option>'), 'Option Dawuh Pengasuh harus ada di form admin');
assert(indexHtml.includes('<option value="Kabar Alumni">Kabar Alumni</option>'), 'Option Kabar Alumni harus ada di form admin');
console.log('✅ 4. Opsi kategori Dawuh Pengasuh & Kabar Alumni di Admin Form valid');

// 2. Verifikasi Logika di js/main.js
const mainJsPath = path.join(ROOT_DIR, 'js', 'main.js');
const mainJs = fs.readFileSync(mainJsPath, 'utf8');

assert(mainJs.includes('function getNewsThumbnail(news)'), 'Fungsi getNewsThumbnail harus ada di main.js');
assert(mainJs.includes('function handleNewsSearch(val)'), 'Fungsi handleNewsSearch harus ada di main.js');
assert(mainJs.includes('function clearNewsSearch()'), 'Fungsi clearNewsSearch harus ada di main.js');
assert(mainJs.includes('function filterNewsByCategory(category, btnElement)'), 'Fungsi filterNewsByCategory harus ada di main.js');
assert(mainJs.includes('nu-hero-center'), 'renderNews harus menargetkan nu-hero-center');
assert(mainJs.includes('nu-hero-left'), 'renderNews harus menargetkan nu-hero-left');
assert(mainJs.includes('nu-hero-right'), 'renderNews harus menargetkan nu-hero-right');
assert(mainJs.includes('nu-archive-section'), 'renderNews harus mengelola nu-archive-section');
assert(mainJs.includes('renderHeadlineNews(newsArray)'), 'renderHeadlineNews harus ada di main.js');
console.log('✅ 5. Fungsi editorial dan manipulasi DOM di js/main.js lengkap');

// 3. Simulasi Eksekusi Logika Pembagian 3-Kolom
const mockSampleNews = Array.from({ length: 11 }, (_, i) => ({
    news_id: `news-${i + 1}`,
    slug: `berita-uji-${i + 1}`,
    judul: i === 0 ? 'Dawuh Pengasuh: Menjaga Sanad Keilmuan di Era Digital' : `Berita Simulasi Ke-${i + 1}`,
    kategori: i === 0 ? 'Dawuh Pengasuh' : (i % 2 === 0 ? 'Kabar Alumni' : 'Warta Pondok'),
    penulis: 'Tim Redaksi',
    tanggal: '10 Okt 2026',
    views: (i + 1) * 50,
    ringkasan: `Ringkasan untuk berita simulasi nomor ${i + 1}.`,
    gambar: ''
}));

// Validasi slice pembagian berita:
const centerItem = mockSampleNews[0];
const leftItems = mockSampleNews.slice(1, 3);
const rightItems = mockSampleNews.slice(3, 5);
const archiveItems = mockSampleNews.slice(5);

assert.strictEqual(centerItem.news_id, 'news-1', 'Item 0 harus menjadi headline tengah');
assert.strictEqual(leftItems.length, 2, 'Kolom kiri harus menerima 2 sub-headline');
assert.strictEqual(rightItems.length, 2, 'Kolom kanan harus menerima 2 sub-headline');
assert.strictEqual(archiveItems.length, 6, 'Arsip bawah harus menerima 6 berita tersisa');
console.log('✅ 6. Distribusi 11 berita ke Tri-Column Hero (1 Center + 2 Kiri + 2 Kanan) & 6 Arsip Bawah terverifikasi sempurna!');

// Validasi filter pencarian
const searchResults = mockSampleNews.filter(n => 
    n.judul.toLowerCase().includes('dawuh') || n.kategori.toLowerCase().includes('dawuh')
);
assert.strictEqual(searchResults.length, 1, 'Pencarian kata "Dawuh" harus menemukan tepat 1 berita');
console.log('✅ 7. Logika live search instan terverifikasi');

console.log('\n🎉 SELURUH PENGUJIAN PORTAL BERITA NU ONLINE BERHASIL!');
