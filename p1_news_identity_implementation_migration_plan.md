# P1 Identity Implementation & Migration Plan

## 1. Executive Summary

Dokumen ini merupakan perencanaan teknis (Implementation & Migration Plan) untuk memberlakukan sistem *Dual Identity* (`news_id` dan `slug`) pada fitur Berita/Kabar di sistem Asnawiyyah. Perencanaan ini meliputi perubahan pada skema Google Sheet, algoritma migrasi, analisis dampak pada backend (`Code.gs`) serta frontend (`index.html`), dan strategi mitigasi risiko tanpa langsung melakukan implementasi.

## 2. Approved Identity Contract

### A. Internal CRUD Identity (`news_id`)
- **Format:** `NWS_<timestamp>_<4-char-random>`
- **Sifat:** Server-generated, Immutable, Unique.
- **Validasi:** Wajib terdapat collision check pada server-side saat pembuatan. Frontend sama sekali tidak diperbolehkan meng-generate atau menentukan value ini untuk record baru.

### B. Public SEO/Routing Identity (`slug`)
- **Format:** `<judul-kebab-case>-<4-char-random>`
- **Sifat:** Server-generated, Immutable setelah CREATE (perubahan judul selanjutnya tidak mengubah slug), Unique.
- **Karakter Valid:** Lowercase, kebab-case, hanya boleh memuat `a-z`, `0-9`, dan `-`.
- **Validasi:** Whitespace dan punctuation di-normalize, dengan server-side collision check.

## 3. Target Sheet Schema

Perubahan pada Sheet `Berita` (Penambahan kolom pada posisi A dan B, menggeser sisa data ke kanan):

| Column | Field        |
| ------ | ------------ |
| A      | `news_id`    |
| B      | `slug`       |
| C      | `Tanggal`    |
| D      | `Judul`      |
| E      | `Kategori`   |
| F      | `Penulis`    |
| G      | `Gambar_URL` |
| H      | `Ringkasan`  |
| I      | `Isi`        |

## 4. Current → Target Mapping

| Existing Column Index | Existing Field | Target Column Index | Target Field |
| --------------------- | -------------- | ------------------- | ------------ |
| *New*                 | -              | 0 (A)               | `news_id`    |
| *New*                 | -              | 1 (B)               | `slug`       |
| 0 (A)                 | `Tanggal`      | 2 (C)               | `Tanggal`    |
| 1 (B)                 | `Judul`        | 3 (D)               | `Judul`      |
| 2 (C)                 | `Kategori`     | 4 (E)               | `Kategori`   |
| 3 (D)                 | `Penulis`      | 5 (F)               | `Penulis`    |
| 4 (E)                 | `Gambar_URL`   | 6 (G)               | `Gambar_URL` |
| 5 (F)                 | `Ringkasan`    | 7 (H)               | `Ringkasan`  |
| 6 (G)                 | `Isi`          | 8 (I)               | `Isi`        |

## 5. Code.gs Impact Matrix

Perubahan ini akan berdampak pada fungsi yang melakukan pembacaan dan penulisan ke Sheet `Berita`.

| Fungsi | Dampak / Perubahan yang Diperlukan |
| ------ | ---------------------------------- |
| `simpanBerita()` | - Modifikasi array yang di-append ke sheet (return 9 kolom).<br>- Pembuatan `news_id` dan `slug` sebelum mengeksekusi `sheet.appendRow()`.<br>- **Wajib menerapkan Shared LockService Discipline** sebelum operasi write. |
| `getKabarData()` | - Geser seluruh index pembacaan array sebesar +2 (contoh: `data[i][0]` menjadi `data[i][2]`).<br>- Tambahkan ekstraksi value `news_id` dan `slug`. |
| `updateBerita()` & `deleteBerita()` | *(Future/CRUD Implementation)* Wajib menerapkan Shared LockService Discipline sebelum melakukan read-modify-write ke Sheet. |
| Utility Functions | - Perlu fungsi pembantu (`generateNewsId()`, `generateSlug(judul)`, `checkCollision()`). |

## 6. Frontend Impact Matrix

| Komponen `index.html` | Dampak / Perubahan yang Diperlukan |
| --------------------- | ---------------------------------- |
| State Management | Hapus ketergantungan pada index array (`idx`) dan ganti dengan referensi `news_id` untuk aktivitas CRUD state client. |
| Detail Berita (`bacaBerita`) | - Routing SEO/URL idealnya direpresentasikan via parameter `slug`.<br>- Pencarian berdasarkan `news_id` / `slug`. |
| List Berita | Rendering komponen iterasi wajib menetapkan `news_id` sebagai internal DOM identifier. |
| Admin News Form | Hidden input `<input type="hidden" id="admin-news-id">` akan meng-hold nilai `news_id`. |
| Edit & Delete Action | POST update/delete API beralih menggunakan payload yang spesifik identifier `news_id`. |
| Payload API | API CREATE tak mengirim `news_id`, API UPDATE/DELETE wajib mengirim `news_id`. |

## 7. Migration Algorithm

### Shared LockService / Write-Lock Discipline
Seluruh operasi yang memodifikasi Sheet `Berita` (**Migration, `simpanBerita()`, `updateBerita()`, `deleteBerita()`**) WAJIB menggunakan **shared locking discipline** yang kompatibel.

**Tujuan:** Mencegah *race condition* (contoh: Migration sedang read/transform data, tiba-tiba `simpanBerita()` berjalan dan memodifikasi baris). Migration lock saja TIDAK CUKUP jika fungsi write lain membypass lock tersebut.

**Ketentuan Lock:**
- Migration dan semua fungsi mutasi News wajib memperoleh lock yang sama sebelum read/write.
- Lock wajib dilepas menggunakan struktur `finally`.
- Jika lock gagal diperoleh → operasi **ABORT**.

**Sequence Migration:**
```
Acquire Shared LockService
        ↓
Validate Sheet State
        ↓
Create / Verify Backup
        ↓
Run Migration
        ↓
Post-Migration Validation
        ↓
Release Lock (via finally)
```

### Deteksi Migration State
- **STATE A (Legacy / Pre-Migration):** Kolom `A:G`. Migrasi **hanya** berjalan dari state ini.
- **STATE B (Migrated):** Kolom `A:I` (A=`news_id`, B=`slug`). Migrasi mendeteksi sebagai *already migrated* dan **TIDAK** menambah kolom duplikat.
- **UNKNOWN STATE:** Jika skema sheet tidak merefleksikan STATE A atau STATE B → **ABORT**.

### Mekanisme Eksekusi Migrasi
1. Jika terdeteksi di STATE A, lakukan penyisipan 2 kolom baru di sebelah kiri, jadikan header A = `news_id`, B = `slug`.
2. Iterasi record demi record.

## 8. Migration Safety & Handling Aturan

### A. Blank Row Protection
- **Blank / empty row (Baris kosong) BUKAN news record.**
- Baris kosong **TIDAK** boleh dibuatkan `news_id` atau `slug`, dan tidak dianggap sebagai sebuah artikel.

### B. Empty Title Slug Policy
Untuk existing record yang memiliki field `Judul` bernilai kosong/null, gunakan aturan fallback berikut:
- **Aturan Generasi:** Hasilkan slug fallback `berita-<4-char-random>` (contoh: `berita-a7f2`).
- **Larangan:** Migrasi TIDAK BOLEH menghasilkan slug seperti `-a7f2` (tanpa prefix) dan TIDAK BOLEH mengubah nilai original kolom `Judul` existing di sheet.
- **Sifat:** Uniqueness check dan suffix 4-karakter tetap berlaku normal. `news_id` tetap mengikuti contract normal.
- **Logging:** Catat record dengan judul kosong sebagai **migration warning** untuk review administratif.

### C. Partial Identity Handling (Preserve-First)
- **Valid `news_id` + Valid `slug`**: PRESERVE keduanya.
- **Valid `news_id` + Missing/Invalid `slug`**: PRESERVE `news_id`, generate `slug` saja.
- **Missing/Invalid `news_id` + Valid `slug`**: PRESERVE `slug`, generate `news_id` saja.
- **Duplicate `news_id` / `slug`**: REPAIR (generate ulang) yang duplicate.
- **Invalid kedua identity**: Generate ulang hanya identity yang invalid.
- **JANGAN** pernah me-regenerate identity yang masih valid!

## 9. Pre-Migration Checklist
- [ ] Memastikan akses Google Drive/Spreadsheet tidak diblokir.
- [ ] Record jumlah row total saat ini.
- [ ] Validasi struktur existing sheet `Berita` (Pastikan sesuai STATE A).
- [ ] **Backup/Snapshot Strategy:** Buat duplikat tab sheet `Berita` menjadi `Berita_Backup_PreMigrate` dan sembunyikan.

## 10. Post-Migration Verification
- Row count tab `Berita` wajib persis sama dengan row count `Berita_Backup_PreMigrate`.
- Perbedaan yang jelas antara jumlah **article records** (memiliki konten dan kedua identity) dan **blank rows** (tanpa identity).
- Pengecekan keunikan (uniqueness) pada kolom A (`news_id`) dan B (`slug`) untuk seluruh article records.

## 11. Rollback / Failure Strategy

**PENTING: Rollback TIDAK BOLEH otomatis!**

```
Migration Failure
      ↓
STOP
      ↓
Preserve evidence / log
      ↓
Integrity assessment
      ↓
ADMINISTRATOR APPROVAL
      ↓
Manual rollback jika disetujui
```
- Backup tetap digunakan sebagai recovery source, namun **jangan pernah menghapus Sheet Berita dan melakukan restore secara otomatis**.
- Rollback wajib mempertimbangkan kemungkinan adanya update data (seperti news masuk) yang terjadi setelah backup.

## 12. CRUD Dependency
- `CREATE`: Server secara otomatis membentuk pondasi `news_id` dan `slug` dengan collision prevention.
- `READ`: Menggunakan `slug` untuk lookup frontend, atau `news_id` untuk backend.
- `UPDATE`: Payload spesifik dengan `news_id`.
- `DELETE`: Secara aman menghapus row berdasarkan `news_id`.

## 13. Acceptance Criteria
- [ ] Skema A:I Mapping diterapkan dengan geseran index aktual.
- [ ] **LockService** meng-cover proses Migration beserta operasi mutasi News CRUD (`simpanBerita`, dll) agar tersinkronisasi.
- [ ] Implementasi **Empty-title slug policy** didokumentasikan (fallback `berita-<random>`).
- [ ] Strategi deteksi STATE, perlindungan Blank Row, dan Partial Identity ditangani.
- [ ] Rollback manual jika terjadi kegagalan (Administrator-approved).
- [ ] Rencana perubahan Code.gs dan Frontend terdokumentasi rapi.

## 14. Implementation Sequence
1. Tulis kode migrasi standalone.
2. Tulis utilitas `generateNewsId` & `generateSlug` di `Code.gs`.
3. Sesuaikan fungsi mutasi News (`simpanBerita()`) dengan Shared LockService Discipline.
4. Jalankan script Migrasi.
5. Verifikasi data di Sheet (Post-migration check).
6. Adaptasi layer Frontend di `index.html`.

## 15. Explicit Out-of-Scope Items
- Perubahan styling/UI halaman Berita pada Frontend.
- Implementasi SSR untuk URL Slug.
