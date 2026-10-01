# P1 CLOUD SYNC IMPLEMENTATION PLAN

## 1. Executive Summary
Dokumen ini menguraikan prosedur aman untuk melakukan sinkronisasi `legacy/Code.gs` (mengandung implementasi P1 News Identity) menuju environment production Google Apps Script (GAS). Mengingat tidak adanya *sync mechanisms* seperti `clasp` pada repositori ini, plan ini merancang *Selective Function Merge* manual yang ketat untuk mencegah *overwriting* (penghapusan tidak sengaja) terhadap perbaikan kode produksi di cloud yang mungkin belum masuk ke repository Git lokal.

## 2. Source of Truth Decision
Terdapat dua entitas source yang harus divalidasi secara komparatif sebelum digabungkan:
- **Local Source Candidate**: File `legacy/Code.gs` di sistem lokal ini, yang menjadi spesifikasi _Source of Truth_ mutlak **khusus untuk logika P1 News Identity**.
- **Production Cloud Source**: Source code `Code.gs` aktif yang sedang berjalan di Google Apps Script IDE, yang merupakan _Source of Truth_ mutlak **untuk seluruh logika sistem API lainnya**.
- **Potensi Divergence**: Kemungkinan tinggi (Divergent). Developer atau Administrator terdahulu bisa saja melakukan *hot-fix* atau penambahan endpoint di IDE GAS (Cloud) tanpa meng-commit/push perubahannya ke repository Git lokal.

## 3. Local vs Cloud Divergence (Conceptual Diff)
Fungsi-fungsi di bawah ini perlu mendapatkan perlakukan spesifik saat proses inspeksi diffferensial manual:

| Komponen / Fungsi | Analisis Perbedaan (Expected) |
| --- | --- |
| `doGet` / `doPost` | Bisa jadi memiliki patch terbaru di Cloud. (Wajib pertahankan versi Cloud bila ada konflik non-News). |
| `simpanBerita` | Local (P1): Mendukung 9 Kolom + LockService + Identity gen. Cloud: 7 Kolom legacy. |
| `getKabarData` | Local (P1): Mendukung Mapping 9 kolom dengan fallback 7 kolom. Cloud: 7 kolom mutlak. |
| Fungsi News Identity | Local (P1): Hadir (`generateNewsId`, `generateSlug`, dll). Cloud: Tidak Ada. |
| `migrateBeritaIdentity`| Local (P1): Hadir (dengan LockService & Safe Abort). Cloud: Tidak Ada. |
| Modul lain (Dependency) | Diprediksi sama, tetapi perbaikan *hot-fix* di Cloud sangat mungkin terjadi. |

## 4. P1 Change Set
Tepat 6 elemen berikut adalah **satu-satunya** kumpulan fungsi (Change Set) yang wajib disuntikkan dari Local `Code.gs` menuju Cloud `Code.gs`:
1. Blok fungsi `generateNewsId()`
2. Blok fungsi `generateSlug()`
3. Blok fungsi `generateUniqueIdentities()`
4. Blok fungsi utuh `migrateBeritaIdentity()`
5. Modifikasi utuh pada fungsi `simpanBerita()` (Replace Cloud dengan versi P1 Local)
6. Modifikasi utuh pada fungsi `getKabarData()` (Replace Cloud dengan versi P1 Local)

## 5. Production Preservation Strategy
Metode yang harus ditempuh adalah **Selective Function Merge**, BUKAN Full File Replacement (Select All -> Copy -> Paste).
**Alasan:** Apabila terjadi Full Replacement, semua update atau variabel global non-Berita yang ditambahkan oleh Administrator langsung di Apps Script Editor selama setahun terakhir akan hilang tanpa jejak (wipeout), dan menyebabkan Web App down seketika.

## 6. Risk Matrix
- **doGet / doPost Routing**: Risiko rendah jika _selective merge_ dipakai, namun berisiko down total bila terjadi _full file replace_.
- **Endpoint API Existing**: Risiko rendah selama blok fungsi program atau donasi tidak disentuh secara membabi buta.
- **Spreadsheet Access**: Terlindungi secara native melalui `LockService` di payload P1.
- **Deployment Web App Existing**: Menggabungkan source code (Ctrl+S di Cloud) belum berdampak sebelum Deploy Version baru diciptakan. Terdapat risiko jeda versi antara Frontend dan API backend bila Web App lambat dipublikasikan.

## 7. Recommended Sync Sequence
Tatanan langkah eksekusi sinkronisasi harus berjalan sekuensial dan dilarang lompat urutan:
1. **PRE-SYNC BACKUP**: Administrator masuk ke GAS IDE, copy seluruh source `Code.gs` produksi yang aktif, dan simpan sebagai file `.txt`/`.js` terpisah di komputernya.
2. **CLOUD SOURCE CAPTURE**: Pastikan semua window GAS terbuka.
3. **LOCAL/CLOUD DIFF**: Administrator mensejajarkan file Backup Cloud vs Local `Code.gs`.
4. **SELECTIVE MERGE**: Administrator mem-paste **hanya** ke-6 elemen (P1 Change Set) ke dalam GAS IDE dengan hati-hati.
5. **STATIC VERIFICATION**: Memastikan tidak ada syntax error (merah) yang menyala di IDE GAS.
6. **SAVE CLOUD SOURCE**: Menekan tombol Save (Ctrl+S / Cmd+S).
7. **DEPLOYMENT REVIEW**: Memeriksa tab Deployments GAS.
8. **CONTROLLED PRODUCTION DEPLOYMENT**: Men-deploy _New Version_ dan memastikan Web App menunjuk ke versi baru tersebut.
9. **POST-DEPLOYMENT VERIFICATION**: Mengakses Web (via Vercel/Localhost) dan memastikan endpoint `getKabarData` masih mengembalikan object data (legacy version) dengan sempurna tanpa patah.
10. **ONLY THEN → MIGRATION PREFLIGHT**: Barulah fase migrasi sheet diizinkan untuk dieksekusi oleh manusia.

## 8. Deployment Boundary
Sangat krusial untuk dipahami oleh Administrator bahwa ekosistem Google Apps Script memisahkan state kode:
- **Source Synchronization**: Meng-copy teks kode ke GAS IDE.
- **Apps Script Save**: Menekan "Save" pada IDE. Ini **TIDAK** mengubah API `doPost` yang dikonsumsi oleh live Frontend. Ini hanya mengubah state `HEAD` (Development Mode).
- **Deployment Version**: Pembuatan *snapshot* immutable dari kode yang tersave tadi (e.g., Version 42).
- **Production Web App Deployment**: API publik hanya akan bereaksi terhadap skema P1 apabila Web App secara eksplisit diperbarui (Manage Deployments -> Edit -> Ganti Version ke yang terbaru).

## 9. Rollback Strategy
Jika sinkronisasi mengakibatkan API production gagal dan Frontend hancur:
1. **Deployment Rollback (Mekanisme Utama)**: Deployment rollback ke previous production version adalah mekanisme rollback **utama** untuk memulihkan production API. Buka Web App Deployments di GAS > Edit > Kembalikan pilihan **Version** ke versi Deployment sebelumnya (misal dari V42 ke V41). Web App akan langsung pulih ke versi lawas.
2. **Source Code Restore (Mekanisme Sekunder)**: Full source restore (mengambil dari Pre-Sync Backup) **hanya boleh dilakukan** setelah memastikan tidak ada perubahan cloud pasca-sync yang harus dipertahankan.
   - **JANGAN** melakukan blind full-file replacement saat rollback.
   - **PRE-SYNC BACKUP** wajib dipertahankan sebagai evidence dan recovery source tanpa batas waktu.

## 10. Migration Dependency Gate
Eksekusi `migrateBeritaIdentity()` memiliki status **BLOCKED** secara sistem, kecuali:
- Source Cloud telah menerima ke-6 modul P1 Change Set.
- Static Verification di Cloud menyatakan lulus syntax error.
- Web App API telah di-Deploy ke versi terbaru (Deployment Boundary dilewati).
- Pengujian post-deployment menyatakan API responsif.

**[P1-REV-07] CREATE FREEZE BEFORE MIGRATION:**
Setelah P1 Cloud Sync berhasil di-deploy ke Production, tetapi *sebelum* `migrateBeritaIdentity()` berhasil dieksekusi dan diverifikasi, berlaku aturan *Safety Gate Sementara*:
- `getKabarData()` (READ) **masih diperbolehkan**.
- `simpanBerita()` (CREATE/WRITE) **tidak boleh digunakan**.
- Administrator wajib menahan seluruh aktivitas CREATE/UPDATE/DELETE Berita sampai migration selesai.
- Jangan melakukan *production acceptance test* yang melakukan *write* terhadap Berita pada window tersebut. (Ini adalah pembatasan sementara, bukan permanen).

## 11. Acceptance Criteria
Pintu sinkronisasi ini baru dinyatakan PASS dan selesai apabila:
- [ ] P1 Change Set telah di-merge tanpa menimpa (`overwrite`) perubahan non-news di Cloud.
- [ ] API URL Production GAS telah mengarah ke Web App Version yang mengandung fungsi `simpanBerita()` dan `getKabarData()` P1.
- [ ] Endpoint fallback (`getKabarData` pada Sheet STATE A) tetap mengembalikan JSON berita yang valid kepada client Frontend.
- [ ] Tidak ada aplikasi yang down (blank screen/500 Server Error).

## 12. Explicit Out-of-Scope
- Rencana ini menolak penerapan CI/CD instan via `clasp` dikarenakan kurangnya testing credentials.
- Plan ini tidak mengasumsikan sinkronisasi repo frontend ke Vercel. Frontend update dianggap ditangani di siklus deployment terpisah (meskipun harus align).
- Logika CRUD di luar Berita (e.g. Program, Santri, Donasi) berada di luar perlindungan dan scope dokumen ini.

## 13. Final Verdict
**PASS — CLOUD SYNC IMPLEMENTATION PLAN COMPLETED**
Blueprint ini telah mengisolasi jalur aman bagi Administrator untuk menggabungkan dua source secara deterministik. Proceed dengan kehati-hatian tingkat tinggi.
