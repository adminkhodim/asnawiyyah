# P1 CLOUD SYNC SELECTIVE MERGE STAGING

## 1. Production Baseline
**Source:** `Code.gs.production-pre-P1-cloud-sync.backup.txt`
- `simpanBerita(formData)` (Baris 348 - 388): Menulis 7 kolom, belum memiliki `LockService`, identity generation, maupun deteksi migration state.
- `getKabarData()` (Baris 491 - 534): Membaca Sheet `Berita` secara kaku dengan pemetaan 7 kolom legacy (Judul ada di indeks 1, dll).
- Struktur Sheet Asumsi Produksi: STATE A (Legacy A:G).
- Router Terkait: `doGet()` pada blok public API memanggil `getKabarData()`. `simpanBerita()` kemungkinan dieksekusi via `google.script.run` dari frontend.
- Tidak ditemukan `LockService` di dalam blok News.

## 2. Local P1 Baseline
**Source:** `legacy/Code.gs`
- Berisi implementasi P1 News Identity secara utuh dan terverifikasi secara lokal.
- Terdiri atas 4 utilitas baru (Identity Utils & Migration Tool) dan 2 fungsi modifikasi (`simpanBerita`, `getKabarData`).
- Terdapat diverjensi *non-news* (formatting `ProgramService` berbeda dengan versi Cloud), menegaskan larangan keras melakukan *Full File Replacement*.

## 3. Protected Non-News Regions (MUST NOT CHANGE)
Seluruh bagian di luar komponen P1 wajib dijaga dan tidak boleh dimodifikasi selama proses merge. Termasuk namun tidak terbatas pada:
- `mintaIzinDrive()` (Baris 390-396)
- `doGet(e)` (Baris 398-488)
- Seluruh router API (`getBanner`, `getPPDB`, `checkStatus`, `program.*`)
- `getBannerData()`, `getPendaftarData()`, `checkStatusPendaftar()`
- Seluruh modul terkait `ProgramService`, `Programs`, otentikasi, maupun utilitas deployment.

## 4. 6-Component Merge Matrix
| P1 Component | Production State | Local State | Merge Required | Conflict | Risk |
|--------------|------------------|-------------|----------------|----------|------|
| `generateNewsId()` | Tidak ada | Ada | ADD | NONE | LOW |
| `generateSlug(judul)` | Tidak ada | Ada | ADD | NONE | LOW |
| `generateUniqueIdentities()` | Tidak ada | Ada | ADD | NONE | LOW |
| `migrateBeritaIdentity()` | Tidak ada | Ada | ADD | NONE | LOW |
| `simpanBerita(formData)` | Legacy (7 kolom) | P1 (9 kolom, lock)| MODIFY | NONE | MED |
| `getKabarData()` | Legacy (7 kolom) | P1 (fallback map) | MODIFY | NONE | MED |

## 5. Exact Insertion Points & Replacement Boundaries

### INSERTION A: Identity Utilities & Migration Tool
**Posisi:** Tepat di atas `function simpanBerita(formData) {` (Di Cloud backup berada di sekitar baris 347).
**Aksi:** `ADD` blok kode fungsi baru berikut:
```javascript
// ==================== NEWS IDENTITY UTILITIES ====================
function generateNewsId() { /* ... */ }
function generateSlug(judul) { /* ... */ }
function generateUniqueIdentities(sheet, judul) { /* ... */ }

// ==================== MIGRATION TOOL ====================
function migrateBeritaIdentity() { /* ... */ }
```

### MODIFICATION B: simpanBerita
**Posisi Boundary:** Dari `function simpanBerita(formData) {` sampai dengan tutup kurung kurawalnya (Cloud: Baris 348 - 388).
**Aksi:** `REPLACE` dengan fungsi `simpanBerita` versi Local P1 yang telah dilengkapi dengan `LockService`, `header` state validation, dan `generateUniqueIdentities`.

### MODIFICATION C: getKabarData
**Posisi Boundary:** Dari `function getKabarData() {` sampai dengan tutup kurung kurawalnya (Cloud: Baris 491 - 534).
**Aksi:** `REPLACE` dengan fungsi `getKabarData` versi Local P1 yang memiliki logic deteksi `isMigrated` (STATE B/A fallback mapping).

## 6. Dependency Requirements
- Seluruh 4 utilitas baru (generate id/slug, migration) bertindak independen tanpa eksternal dependency di luar library GAS (`Math.random`, `SpreadsheetApp`, `LockService`).
- Fungsi `simpanBerita` bergantung pada `generateUniqueIdentities` yang sudah dimasukkan pada Insertion A. Dependency *resolve*.

## 7. Conflict Findings
- Secara fungsi News, **TIDAK ADA KONFLIK** (Clean Merge).
- Conflict hanya terdapat pada formatting kelas non-news seperti `ProgramService`, yang dilindungi penuh (protected) lewat arsitektur *Selective Merge* ini.

## 8. Expected Resulting Architecture
Setelah merge selesai di Cloud Editor, file `Code.gs` Cloud akan mempertahankan seluruh *hot-fix* non-News produksi, namun spesifik di area Berita, Cloud akan memiliki infrastruktur Dual Identity yang kuat dan siap menampung transisi skema Sheet dari A:G menjadi A:I ketika Migration Command dieksekusi.

## 9. Verification Checklist
- [ ] 4 Fungsi baru disalin sempurna.
- [ ] `simpanBerita` sudah mengandung try/catch `LockService`.
- [ ] `getKabarData` memiliki logika `if (isMigrated)`.
- [ ] Fungsi `doGet` dan kode `ProgramService` masih utuh (tidak rusak).
- [ ] Syntax error panel GAS Editor menyatakan bersih.
