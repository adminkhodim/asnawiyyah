# P1 CLOUD SYNC AUDIT

## Current Local State
Saat ini, file `legacy/Code.gs` di local repository benar-benar **memiliki** seluruh implementasi kode baru yang dikerjakan pada scope P1, termasuk:
- Fungsi `migrateBeritaIdentity()`
- Fungsi `generateNewsId()` & `generateSlug()`
- Validasi tambahan dalam `simpanBerita()` dan pembacaan schema pada `getKabarData()`.

## Current Cloud State
Fungsi `migrateBeritaIdentity()` **belum pernah dikirim maupun tersimpan** di environment Google Apps Script (GAS) cloud production. Secara konseptual, versi cloud Apps Script saat ini masih merupakan versi "lawas" (A:G schema constraint) sebelum adanya implementasi P1 News Identity, yang berarti tidak mengetahui sedikitpun keberadaan logika identity maupun perintah migration tersebut.

## Sync/Deployment Mechanism
Berdasarkan audit repositori, **tidak ditemukan** mekanisme sinkronisasi maupun deployment untuk script GAS dari lingkungan lokal ini:
- **TIDAK ADA** file konfigurasi clasp (`.clasp.json`).
- **TIDAK ADA** manifest GAS (`appsscript.json`).
- **TIDAK ADA** dependency `package.json` yang memuat Google Apps Script CLI (clasp).
- **TIDAK ADA** script shell, pipeline (GitHub Actions), maupun skrip sinkronisasi manual lainnya.
- File `vercel.json` hanya diperuntukkan untuk deploy asset statis web (HTML/JS/CSS ke Vercel Serverless static hosting), bukan melempar environment Apps Script (Gas runtime) ke infrastruktur Google.

Mekanisme update saat ini secara harfiah bersifat **"Manual Copy"**: Administrator selama ini perlu memblok teks dari `legacy/Code.gs` secara lokal, melakukan *copy*, lalu mem-*paste* secara mandiri ke jendela editor Google Apps Script di browser, lalu menekan Save/Deploy.

## Evidence
- Perintah `dir -Force` pada root folder membuktikan ketidakhadiran file `.clasp.json`, `appsscript.json`, atau konfigurasi Node.js (`package.json`).
- Folder `legacy/` murni berisi `Code.gs` dan `Index.html` saja tanpa file deployment meta.

## Gap Analysis
Terdapat kesenjangan (Gap) mutlak antara repositori Git (Local) dengan Google Cloud / Google Workspace runtime (Cloud). Repositori ini hanya bertindak sebagai "brankas" *source of truth* lokal yang bersifat pasif, bukan *pipeline* otomatis. Oleh karenanya, perintah apa pun yang dijalankan developer (atau agen) di sisi lokal pada `legacy/Code.gs` tidak akan memicu API Cloud tanpa aksi manual manusia.

## Production Risk
Bila data production saat ini mengalami mutasi, atau apabila frontend `index.html` (yang baru saja diperbarui untuk menggunakan `news_id`) di-deploy ke Vercel *sebelum* `Code.gs` P1 di-copy dan di-publish ke Apps Script, sistem production **akan rusak total**. 
- API `doGet`/`doPost` lawas di cloud akan merespons dengan skema A:G.
- Frontend di URL publik menuntut payload A:I (menggunakan pemanggilan properti identifier `news.news_id`). 
- Fungsi update atau migrasi via frontend akan memberikan *undefined*.

## Recommended Sync Path
Jalur sinkronisasi **paling aman** saat ini untuk mempertahankan kesesuaian antara Local dan Cloud adalah:
1. **Manual Copy-Paste yang Terkendali**: Salin seluruh teks dari `legacy/Code.gs` lokal, kemudian paste-kan ke Editor Web Google Apps Script untuk mereplace `Code.gs` lama. Simpan, namun **JANGAN DULU** membuat (Deploy/Publish) *New Version* / *New Web App URL*.
2. Setup **clasp (Command Line Apps Script Projects)** ke depannya jika dirasa proses manual Copy-Paste sangat rentan keliru.

## Preconditions Before Sync
Sebelum Administrator melakukan Copy-Paste ke Apps Script Cloud, pastikan:
- Pastikan tidak ada Admin lain yang sedang mengedit Apps Script Cloud secara bersamaan yang dapat menyebabkan versi tertimpa.
- Aplikasi web sedang diumumkan maintance kepada publik (bila memungkinkan) karena adanya fase perpindahan yang dapat melempar API error sebelum skema migrasi tuntas.

## Explicit Out-of-Scope
- Audit ini TIDAK MENGUBAH / MEN-DELEGATE perubahan sync apa pun, karena itu di luar lingkup perintah.
- Sinkronisasi deployment `index.html` ke Vercel dan efeknya secara live diabaikan pada audit khusus GAS ini.
- `doGet`, `doPost`, `simpanBerita`, dan `getKabarData` tidak disentuh atau dibongkar logic-nya oleh hasil report ini.

## Final Verdict
**BLOCKED** (Murni terhambat di ranah Deployment Sinkronisasi). Kode lokal `legacy/Code.gs` berstatus matang dan sempurna, namun belum memiliki "kendaraan" untuk berpindah ke Production Environment. Migrasi Google Sheet tidak mungkin dieksekusi selama kode `migrateBeritaIdentity()` tersebut hanya ada di hard drive lokal Anda. Administrator wajib turun tangan melakukan manual copy-paste ke GAS Editor.
