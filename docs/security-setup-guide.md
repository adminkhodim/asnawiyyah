# Panduan Pengaturan Keamanan & Script Properties Google Apps Script

Dokumen ini berisi panduan untuk Administrator dalam mengonfigurasi kunci rahasia HMAC (*Session Token*) dan memelihara keamanan backend Google Apps Script PPTQ Asnawiyyah.

---

## 1. Mengapa Kunci Rahasia Ini Penting?

Backend PPTQ Asnawiyyah menggunakan token sesi berbasis **HMAC SHA-256** untuk memvalidasi identitas Administrator dan Editor saat melakukan perubahan data (seperti menambah berita, mengunggah banner, mengelola UKS, atau memverifikasi santri).

Jika kunci rahasia tidak disetel secara mandiri di **Script Properties**, sistem akan berjalan menggunakan kunci cadangan bawaan (*fallback default*). Kunci bawaan tersebut tercatat di repositori publik/git, sehingga **wajib diganti** dengan rahasia unik milik lembaga Anda.

---

## 2. Cara Mengonfigurasi `TOKEN_SIGNING_SECRET`

Ada 2 cara yang dapat dipilih oleh Administrator:

### Cara A: Otomatis via Function Execution (Sangat Direkomendasikan)
1. Buka project Google Apps Script Anda di browser ([script.google.com](https://script.google.com)).
2. Salin isi terbaru dari `legacy/Code.gs` dan tempel (*paste*) ke editor Apps Script, lalu klik tombol **Save** (Ctrl+S / Cmd+S).
3. Di bilah menu atas editor Apps Script, pada dropdown pilihan fungsi (biasanya tertulis `doGet`), pilih fungsi:
   ```text
   setupScriptSecurityProperties
   ```
4. Klik tombol **Run** (Jalankan).
5. Buka tab **Execution log** di bagian bawah. Anda akan melihat pesan:
   ```text
   ✅ Script Security Properties berhasil dikonfigurasi!
   TOKEN_SIGNING_SECRET telah disetel (panjang: 45 karakter).
   TOKEN_VERSION: 1
   ```
   *Fungsi ini secara otomatis membuat UUID rahasia acak berkeamanan tinggi dan menyimpannya ke Script Properties.*

---

### Cara B: Manual via Menu GUI Script Settings
Jika Anda ingin menentukan string password/secret sendiri:
1. Di editor Google Apps Script, klik ikon gerigi **Project Settings** di bilah navigasi kiri.
2. Gulir ke bawah ke bagian **Script Properties**.
3. Klik **Add script property**, lalu masukkan:
   * **Property:** `TOKEN_SIGNING_SECRET`
   * **Value:** *(Masukkan string acak minimal 32 karakter, contoh: `k7$M9#vP2!wL8@zQ5*nR4&xT1^bY0%jH`)*
4. Klik **Add script property** lagi, lalu masukkan:
   * **Property:** `TOKEN_VERSION`
   * **Value:** `1`
5. Klik tombol **Save script properties**.

---

## 3. Cara Rotasi Token (Jika Terjadi Kebocoran Sesi)

Bila suatu saat Anda mencurigai ada akun admin yang login di perangkat umum dan belum logout, Anda dapat membatalkan (**revoke**) seluruh sesi aktif secara instan:
1. Buka **Project Settings > Script Properties**.
2. Ubah nilai `TOKEN_VERSION` dari `1` menjadi `2` (atau angka selanjutnya), lalu klik **Save**.
3. Seketika itu juga, semua token admin yang sedang aktif di browser manapun akan langsung ditolak dan pengguna dipaksa untuk login ulang.

---

## 4. Cara Melakukan Audit Keamanan Berkala

Anda dapat memanggil fungsi `auditSecurityConfig()` langsung dari editor Apps Script kapan saja untuk memeriksa status keamanan serverless backend:
* Jika status `ok`: Kunci unik sudah terpasang aman.
* Jika status `warning`: Sistem masih memakai default secret dan perlu disetel.

---

## 5. Prosedur Deploy / Publish Versi Baru

Setelah `Code.gs` diperbarui dan Script Properties disetel:
1. Di editor Google Apps Script, klik tombol biru **Deploy** di pojok kanan atas.
2. Pilih **Manage deployments**.
3. Klik ikon pensil (**Edit**) pada deployment aktif Anda.
4. Pada dropdown **Version**, pilih **New version**.
5. Klik tombol **Deploy**.
6. Pastikan URL Web App (`/exec`) tetap sama dengan yang tercantum di `index.html`.

---

## 6. Konfigurasi `SUPABASE_SERVICE_ROLE_KEY` & Replikasi Server-Side

Untuk menjaga keamanan tingkat tinggi, frontend browser dilarang melakukan operasi mutasi langsung ke Supabase dengan anon key. Seluruh operasi tulis dialirkan melalui Google Apps Script, yang kemudian mereplikasi perubahan ke Supabase menggunakan kunci berwenang tinggi (`service_role` secret key).

### Langkah Konfigurasi Otomatis (1x Jalan):
1. Buka project Google Apps Script Anda.
2. Di bilah menu atas dropdown fungsi, pilih:
   ```text
   setupSupabaseServiceRole
   ```
3. Klik tombol **Run** (Jalankan).
4. Periksa **Execution log** untuk memastikan pesan:
   ```text
   ✅ Supabase Service Role Key berhasil dikonfigurasi di PropertiesService!
   ```

---

## 7. Rekonsiliasi Data Historis (Google Sheets -> Supabase)

Bila terdapat riwayat data di Google Spreadsheet yang perlu disinkronkan ke Supabase:
1. Buka Google Spreadsheet database PPTQ Asnawiyyah Anda.
2. Pada bilah menu atas, klik menu kustom:
   **PPTQ Asnawiyyah** $\rightarrow$ **🔄 Sinkronkan Seluruh Riwayat ke Supabase**.
3. Sistem akan secara otomatis memproses master santri, setoran tahfidz, capaian tahfidz, izin perpulangan, dan data pegawai tanpa jeda dan tanpa risiko data duplikat (*idempotent upsert*).

