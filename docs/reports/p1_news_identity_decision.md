# P1 News Identity Decision

**STATUS:** 🟡 REVISE (Belum APPROVE)

Proposal dual-identity secara prinsip DISETUJUI dengan revisi pada beberapa bagian untuk memastikan keamanan migrasi dan konsistensi arsitektur.

## 1. CANONICAL FIELD NAME

Gunakan `news_id` sebagai canonical field name di SEMUA layer:
- Architecture
- Apps Script
- API
- Frontend
- Google Sheets

*(Jangan gunakan `ID_Berita` sebagai nama alternatif.)*

### Proposed Sheet Schema
Kolom | Field
---|---
A | news_id
B | slug
C | Tanggal
D | Judul
E | Kategori
F | Penulis
G | Gambar_URL
H | Ringkasan
I | Isi

## 2. MIGRATION SAFETY

Migration strategy harus dilakukan secara aman dan dapat dijalankan ulang (idempotent).

### PRE-MIGRATION
→ validate expected headers
→ record current row count
→ backup/snapshot strategy

### MIGRATION
→ add identity columns
→ generate missing news_id
→ generate missing slug
→ collision detection
→ uniqueness validation
→ preserve all existing content exactly

### POST-MIGRATION
→ row count unchanged
→ every article has news_id
→ every article has slug
→ news_id unique
→ slug unique
→ existing fields unchanged
→ getKabarData mapping verified

### Re-run Safety (Idempotency)
Migration harus aman terhadap re-run:
- existing valid news_id TIDAK boleh diganti
- existing valid slug TIDAK boleh diganti
- jangan generate identity baru untuk record yang sudah memiliki identity

## 3. SLUG CONTRACT

Aturan untuk `slug` ditetapkan secara eksplisit:
- lowercase
- kebab-case
- hanya karakter `a-z`, `0-9` dan `-`
- normalize whitespace/punctuation
- random suffix 4 karakter
- collision check tetap wajib dilakukan server-side
- slug immutable setelah CREATE
- perubahan judul TIDAK mengubah slug

## 4. NEWS_ID CONTRACT

Aturan untuk `news_id` ditetapkan secara eksplisit:
- Format: `NWS_<timestamp>_<4-char-random>`
- Wajib terdapat server-side uniqueness check
- Jika collision terjadi, sistem harus men-generate ulang.
