/**
 * ============================================================================
 * 05_CMS.gs
 * PPTQ Asnawiyyah Backend Architecture - Content Management System & Media
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Berita & Kabar Pondok (CRUD Berita, SEO Slug, View Tracker, Inline Images)
 *  - Hero Banners & Pengumuman Beranda (CRUD Banner, Toggle Status)
 *  - Galeri Kegiatan & YouTube Video Embeds (CRUD Galeri, Toggle Status)
 *  - Pengaturan Profil Pondok & Kontak (getPengaturanData, simpanPengaturan)
 *  - Unit Kegiatan Santri / UKS (CRUD Unit Kegiatan, Toggle Status)
 *  - Notifikasi Pop-up Beranda (CRUD Notifikasi)
 *  - Single Media Upload ke Google Drive (uploadMediaToDrive)
 * ============================================================================
 */

const SHEET_NAME = "Berita"; // Sesuaikan nama tab sheet

function generateNewsId() {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 6).toLowerCase();
  return "NWS_" + timestamp + "_" + randomStr;
}

function generateSlug(judul) {
  const randomStr = Math.random().toString(36).substring(2, 6).toLowerCase();
  if (!judul || String(judul).trim() === "") {
    return "berita-" + randomStr;
  }
  let slug = String(judul).trim().toLowerCase();
  slug = slug.replace(/[^a-z0-9\s-]/g, ""); // hanya karakter a-z, 0-9 dan -
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/-+/g, "-");
  return slug + "-" + randomStr;
}

function generateUniqueIdentities(sheet, judul) {
  let newsId, slug;
  let isUnique = false;
  let attempts = 0;
  
  // Baca semua existing ID/Slug
  let existingNewsIds = new Set();
  let existingSlugs = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      existingNewsIds.add(String(data[i][0] || "").trim());
      existingSlugs.add(String(data[i][1] || "").trim());
    }
  }

  while (!isUnique && attempts < 10) {
    newsId = generateNewsId();
    slug = generateSlug(judul);
    if (!existingNewsIds.has(newsId) && !existingSlugs.has(slug)) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error("Gagal meng-generate identity unik setelah 10 percobaan.");
  }
  return { newsId, slug };
}

// ==================== MIGRATION TOOL ====================
function migrateBeritaIdentity() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    Logger.log("ABORT: Gagal mendapatkan lock. Sistem sedang sibuk.");
    return { status: "error", message: "Gagal mendapatkan lock." };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
       throw new Error("Sheet Berita tidak ditemukan.");
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow === 0) {
       throw new Error("Sheet kosong.");
    }
    
    let data = sheet.getDataRange().getValues();
    let headers = data[0];
    
    // Validate State
    if (headers[0] === "news_id" && headers[1] === "slug") {
      Logger.log("ABORT: Sheet sudah di-migrate (STATE B).");
      return { status: "success", message: "Sudah di-migrate." };
    }
    
    if (headers[0] !== "Tanggal" || headers[1] !== "Judul" || lastCol < 7) {
      Logger.log("ABORT: Struktur tidak dikenali (UNKNOWN STATE).");
      throw new Error("UNKNOWN STATE");
    }
    
    // STATE A terdeteksi. Mulai migrasi.
    let backupSheetName = SHEET_NAME + "_Backup_PreMigrate";
    let existingBackup = ss.getSheetByName(backupSheetName);
    if (existingBackup) {
      ss.deleteSheet(existingBackup);
    }
    let backupSheet = sheet.copyTo(ss);
    backupSheet.setName(backupSheetName);
    backupSheet.hideSheet();
    
    // Insert Kolom A dan B
    sheet.insertColumnsBefore(1, 2);
    sheet.getRange(1, 1).setValue("news_id");
    sheet.getRange(1, 2).setValue("slug");
    
    data = sheet.getDataRange().getValues();
    
    let existingNewsIds = new Set();
    let existingSlugs = new Set();
    let updates = []; 
    
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      let nId = String(row[0] || "").trim();
      let slg = String(row[1] || "").trim();
      let judul = row[3];
      
      let isBlank = (String(row[2]||"") === "" && String(row[3]||"") === "" && String(row[4]||"") === "" && String(row[5]||"") === "" && String(row[6]||"") === "");
      if (isBlank) {
        updates.push(["", ""]);
        continue; // Blank row protection
      }
      
      let finalNewsId = nId;
      let finalSlug = slg;
      
      if (!finalNewsId || existingNewsIds.has(finalNewsId)) {
        do { finalNewsId = generateNewsId(); } while (existingNewsIds.has(finalNewsId));
      }
      existingNewsIds.add(finalNewsId);
      
      if (!finalSlug || existingSlugs.has(finalSlug)) {
        do { finalSlug = generateSlug(judul); } while (existingSlugs.has(finalSlug));
      }
      existingSlugs.add(finalSlug);
      
      if (String(judul||"").trim() === "") {
        Logger.log("Migration warning: Empty title pada baris " + (i+1));
      }
      
      updates.push([finalNewsId, finalSlug]);
    }
    
    if (updates.length > 0) {
      sheet.getRange(2, 1, updates.length, 2).setValues(updates);
    }
    
    Logger.log("Migrasi selesai. " + updates.length + " baris diproses.");
    return { status: "success", message: "Migrasi selesai." };
    
  } catch (err) {
    Logger.log("ERROR MIGRATION: " + err.message);
    return { status: "error", message: err.message };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// MIGRASI PENAMBAHAN KOLOM VIEWS (KOLOM J) PADA SHEET BERITA
// ============================================================================
function migrasiKolomViewsBerita() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    Logger.log("ABORT: Gagal mendapatkan lock. Sistem sedang sibuk.");
    return { status: "error", success: false, message: "Gagal mendapatkan lock sistem." };
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheetByName("Berita") || ss.getSheetByName("Kabar");
    if (!sheet) {
      throw new Error("Sheet Berita tidak ditemukan.");
    }

    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      throw new Error("Sheet Berita kosong.");
    }

    // 1. Pastikan Header Kolom 10 (J) adalah "Views"
    const headerCell = sheet.getRange(1, 10);
    const currentHeaderVal = String(headerCell.getValue() || "").trim();
    if (currentHeaderVal !== "Views") {
      headerCell.setValue("Views");
      headerCell.setFontWeight("bold");
      try {
        const prevBg = sheet.getRange(1, 9).getBackground();
        if (prevBg) headerCell.setBackground(prevBg);
        const prevColor = sheet.getRange(1, 9).getFontColor();
        if (prevColor) headerCell.setFontColor(prevColor);
      } catch (styleErr) {}
    }

    // 2. Isi default 0 untuk semua baris berita yang kolom J-nya masih kosong
    let updatedRows = 0;
    if (lastRow >= 2) {
      const rangeViews = sheet.getRange(2, 10, lastRow - 1, 1);
      const values = rangeViews.getValues();
      let hasChanges = false;

      for (let i = 0; i < values.length; i++) {
        const val = values[i][0];
        if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
          values[i][0] = 0;
          hasChanges = true;
          updatedRows++;
        }
      }

      if (hasChanges) {
        rangeViews.setValues(values);
      }
    }

    const resultMsg = `Berhasil! Kolom J (Views) telah aktif. ${updatedRows} baris berita diinisialisasi dengan 0 view.`;
    Logger.log(resultMsg);
    return { status: "success", success: true, message: resultMsg, updatedRows: updatedRows };
  } catch (err) {
    Logger.log("ERROR migrasiKolomViewsBerita: " + err.message);
    return { status: "error", success: false, message: err.message };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// HELPER: EKSTRAK INLINE BASE64 IMAGES KE GOOGLE DRIVE AGAR SHEET RINGAN
// ============================================================================
function processNewsInlineImages(folder, isiHtml) {
  if (!isiHtml || typeof isiHtml !== 'string' || isiHtml.indexOf("data:image/") === -1) {
    return isiHtml;
  }

  // Regex mencari tag <img ... src="data:image/(...);base64,(...)" ...>
  var regex = /<img([^>]*?)src=["']data:image\/([a-zA-Z0-9.+_-]+);base64,([^"']+)["']([^>]*?)>/gi;
  
  return isiHtml.replace(regex, function(match, prefix, ext, base64Data, suffix) {
    try {
      var decoded = Utilities.base64Decode(base64Data);
      var normalizedExt = String(ext).toLowerCase();
      if (normalizedExt === 'jpeg') normalizedExt = 'jpg';
      var mimeType = "image/" + (normalizedExt === 'jpg' ? 'jpeg' : normalizedExt);
      var fileName = "BERITA_INLINE_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000) + "." + normalizedExt;
      var blob = Utilities.newBlob(decoded, mimeType, fileName);
      var newFile = folder.createFile(blob);
      try {
        newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (aclErr) {}
      var driveUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
      return '<img' + prefix + 'src="' + driveUrl + '"' + suffix + '>';
    } catch (err) {
      Logger.log("processNewsInlineImages error: " + err.message);
      return match;
    }
  });
}

function simpanBerita(formData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Sistem sedang sibuk. Silakan coba lagi. (Lock gagal)" };
  }

  try {
    var fileUrl = "";
    var folder = null;

    // 1. Upload ke Google Drive jika ada file gambar utama
    if (formData.file) {
      var base64Str = formData.file.base64;
      var mimeType = formData.file.mimeType || "image/webp";
      var fileName = formData.file.name || ("BERITA_" + new Date().getTime() + ".webp");

      if (!base64Str && typeof formData.file === 'string' && formData.file.indexOf(',') > -1) {
        var parts = formData.file.split(',');
        var match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
        base64Str = parts[1];
      }

      if (base64Str) {
        folder = DriveApp.getFolderById(FOLDER_ID);
        var decodedData = Utilities.base64Decode(base64Str);
        var blob = Utilities.newBlob(decodedData, mimeType, fileName);
        var newFile = folder.createFile(blob);
        try {
          newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (aclErr) {}
        fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
      }
    }

    // 2. Ekstrak foto inline di dalam isi berita (jika ada) ke Google Drive agar sheet tidak lemot
    var cleanIsi = formData.isi || "";
    if (cleanIsi.indexOf("data:image/") > -1) {
      if (!folder) folder = DriveApp.getFolderById(FOLDER_ID);
      cleanIsi = processNewsInlineImages(folder, cleanIsi);
    }

    // 2b. Jika tidak ada file utama diunggah namun ada gambar di dalam artikel, jadikan gambar pertama sebagai cover
    if (!fileUrl && cleanIsi) {
      var inlineMatch = cleanIsi.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (inlineMatch && inlineMatch[1] && inlineMatch[1].indexOf('photo-1584286595398-a59f21d313f5') === -1) {
        fileUrl = inlineMatch[1];
      }
    }

    // 3. Simpan ke Google Spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      sheet.appendRow(["news_id", "slug", "Tanggal", "Judul", "Kategori", "Penulis", "Gambar_URL", "Ringkasan", "Isi", "Views"]);
    }
    
    // Check if the sheet header represents STATE A (Legacy)
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (header[0] === "Tanggal") {
       throw new Error("Migrasi identitas belum dilakukan. Harap jalankan migrasi terlebih dahulu.");
    }

    // Pastikan kolom ke-10 adalah Views
    if (header[0] === "news_id" && (!header[9] || String(header[9]).trim() === "")) {
      sheet.getRange(1, 10).setValue("Views");
    }
    
    var identities = generateUniqueIdentities(sheet, formData.judul);

    sheet.appendRow([
      identities.newsId,
      identities.slug,
      new Date(),
      formData.judul,
      formData.kategori,
      formData.penulis,
      fileUrl,
      formData.ringkasan,
      cleanIsi,
      0 // Views awal
    ]);

    return {
      success: true,
      message: "Berita berhasil dipublikasikan!",
      data: { news_id: identities.newsId, slug: identities.slug },
      news_id: identities.newsId,
      newsId: identities.newsId,
      slug: identities.slug,
      url: fileUrl,
      fileUrl: fileUrl
    };
  } catch (error) {
    return { success: false, message: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

function updateBerita(formData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Sistem sedang sibuk. Silakan coba lagi. (Lock gagal)" };
  }

  try {
    var news_id = formData.news_id || formData.id;
    if (!news_id) {
       return { success: false, message: "ID Berita (news_id) wajib disertakan untuk update." };
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return { success: false, message: "Sheet Berita tidak ditemukan." };
    }

    var data = sheet.getDataRange().getValues();
    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(news_id).trim()) {
        targetRow = i + 1; // 1-indexed for getRange
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "NOT_FOUND: Berita dengan ID tersebut tidak ditemukan." };
    }

    var fileUrl = data[targetRow - 1][6]; // Keep existing Gambar_URL by default
    var folder = null;

    if (formData.file) {
      var base64Str = formData.file.base64;
      var mimeType = formData.file.mimeType || "image/webp";
      var fileName = formData.file.name || ("BERITA_UPD_" + new Date().getTime() + ".webp");

      if (!base64Str && typeof formData.file === 'string' && formData.file.indexOf(',') > -1) {
        var parts = formData.file.split(',');
        var match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
        base64Str = parts[1];
      }

      if (base64Str) {
        folder = DriveApp.getFolderById(FOLDER_ID);
        var decodedData = Utilities.base64Decode(base64Str);
        var blob = Utilities.newBlob(decodedData, mimeType, fileName);
        var newFile = folder.createFile(blob);
        try {
          newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (aclErr) {}
        fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
      }
    }

    var judul = formData.judul !== undefined ? formData.judul : data[targetRow - 1][3];
    var kategori = formData.kategori !== undefined ? formData.kategori : data[targetRow - 1][4];
    var penulis = formData.penulis !== undefined ? formData.penulis : data[targetRow - 1][5];
    var ringkasan = formData.ringkasan !== undefined ? formData.ringkasan : data[targetRow - 1][7];
    var isi = formData.isi !== undefined ? formData.isi : data[targetRow - 1][8];

    // Ekstrak foto inline jika ada
    if (isi && isi.indexOf("data:image/") > -1) {
      if (!folder) folder = DriveApp.getFolderById(FOLDER_ID);
      isi = processNewsInlineImages(folder, isi);
    }



    // Array to update: D to I (Judul, Kategori, Penulis, Gambar_URL, Ringkasan, Isi)
    sheet.getRange(targetRow, 4, 1, 6).setValues([[judul, kategori, penulis, fileUrl, ringkasan, isi]]);

    return { success: true, message: "Berita berhasil diperbarui!", url: fileUrl, fileUrl: fileUrl };
  } catch (error) {
    return { success: false, message: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

function deleteBeritaData(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Sistem sedang sibuk. Silakan coba lagi. (Lock gagal)" };
  }

  try {
    var news_id = payload.news_id || payload.id;
    if (!news_id) {
       return { success: false, message: "ID Berita (news_id) wajib disertakan untuk hapus." };
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return { success: false, message: "Sheet Berita tidak ditemukan." };
    }

    var data = sheet.getDataRange().getValues();
    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(news_id).trim()) {
        targetRow = i + 1; // 1-indexed for deleteRow
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "NOT_FOUND: Berita dengan ID tersebut tidak ditemukan." };
    }

    sheet.deleteRow(targetRow);

    return { success: true, message: "Berita berhasil dihapus!" };
  } catch (error) {
    return { success: false, message: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

function recordNewsView(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return { success: false, message: "Sistem sibuk (Lock timeout)" };
  }

  try {
    var news_id = payload.news_id || payload.id;
    var slug = payload.slug;
    if (!news_id && !slug) {
      return { success: false, message: "ID berita atau slug wajib disertakan." };
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return { success: false, message: "Sheet Berita tidak ditemukan." };
    }

    // Pastikan header kolom Views (kolom 10) ada
    var lastCol = Math.max(sheet.getLastColumn(), 10);
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (header[0] === "news_id" && (!header[9] || String(header[9]).trim() === "")) {
      sheet.getRange(1, 10).setValue("Views");
    }

    var reqNewsId = news_id ? String(news_id).trim() : "";
    var reqSlug = slug ? String(slug).trim().toLowerCase() : "";
    var reqJudul = (payload.judul || (payload.data && payload.data.judul)) ? String(payload.judul || payload.data.judul).trim().toLowerCase() : "";

    var data = sheet.getDataRange().getValues();
    var targetRow = -1;
    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0] || "").trim();
      var rowSlug = String(data[i][1] || "").trim().toLowerCase();
      var rowJudul = String(data[i][3] || "").trim().toLowerCase();

      var matchId = reqNewsId && (rowId === reqNewsId);
      var matchSlug = reqSlug && (rowSlug === reqSlug || rowSlug.indexOf(reqSlug) === 0 || reqSlug.indexOf(rowSlug) === 0);
      var matchJudul = reqJudul && (rowJudul === reqJudul);

      if (matchId || matchSlug || matchJudul) {
        targetRow = i + 1; // 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: "Berita tidak ditemukan." };
    }

    var currentViews = Number(sheet.getRange(targetRow, 10).getValue()) || 0;
    var clientViews = Number(payload.views || (payload.data && payload.data.views)) || 0;
    var newViews = Math.max(currentViews + 1, clientViews);
    sheet.getRange(targetRow, 10).setValue(newViews);

    return { success: true, views: newViews };
  } catch (err) {
    return { success: false, message: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

// Fungsi Ambil Berita (Bisa dipanggil oleh doGet maupun google.script.run)
function getKabarData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Cari tab 'Berita' atau 'Kabar' secara fleksibel (kebal typo huruf besar/kecil/spasi)
    let beritaSheet = ss.getSheetByName("Berita") || ss.getSheetByName("Kabar");
    if (!beritaSheet) {
      const sheets = ss.getSheets();
      for (let s of sheets) {
        const name = s.getName().trim().toLowerCase();
        if (name === "berita" || name === "kabar") {
          beritaSheet = s;
          break;
        }
      }
    }

    if (!beritaSheet) {
      return { status: "error", message: "Sheet Berita tidak ditemukan", data: [] };
    }

    const data = beritaSheet.getDataRange().getValues();
    const newsList = [];
    
    let isMigrated = false;
    if (data.length > 0 && data[0][0] === "news_id" && data[0][1] === "slug") {
      isMigrated = true;
    }

    // Auto-ensure kolom J (Views) ada di sheet jika belum ada
    if (isMigrated && (data[0].length < 10 || !data[0][9] || String(data[0][9]).trim() === "")) {
      try {
        beritaSheet.getRange(1, 10).setValue("Views");
        beritaSheet.getRange(1, 10).setFontWeight("bold");
      } catch (errCol) {
        console.warn("Auto-set Views header warning:", errCol);
      }
    }

    // Baris 1 adalah Header, ambil mulai baris 2 (index 1) dari yang paling baru
    for (let i = data.length - 1; i >= 1; i--) {
      if (isMigrated) {
        const judul = String(data[i][3] || "").trim();
        const news_id = String(data[i][0] || "").trim();
        const slug = String(data[i][1] || "").trim();
        if (judul !== "" || news_id !== "") {
          newsList.push({
            news_id: news_id,
            slug: slug,
            tanggal: data[i][2] ? formatDate(data[i][2]) : "",
            judul: judul,
            kategori: data[i][4] ? String(data[i][4]) : "Kabar",
            penulis: data[i][5] ? String(data[i][5]) : "Admin",
            gambar: data[i][6] ? String(data[i][6]) : "",
            ringkasan: data[i][7] ? String(data[i][7]) : "",
            isi: data[i][8] ? String(data[i][8]) : "",
            views: Number(data[i][9]) || 0
          });
        }
      } else {
        const judul = String(data[i][1] || "").trim();
        if (judul !== "") {
          newsList.push({
            news_id: "",
            slug: "",
            tanggal: data[i][0] ? formatDate(data[i][0]) : "",
            judul: judul,
            kategori: data[i][2] ? String(data[i][2]) : "Kabar",
            penulis: data[i][3] ? String(data[i][3]) : "Admin",
            gambar: data[i][4] ? String(data[i][4]) : "",
            ringkasan: data[i][5] ? String(data[i][5]) : "",
            isi: data[i][6] ? String(data[i][6]) : ""
          });
        }
      }
    }

    return { status: "success", data: newsList };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// ==================== PENGELOLAAN BANNER SLIDER ====================
const BANNER_SHEET_NAME = "Banner";
const GALERI_SHEET_NAME = "Galeri";
const UNIT_KEGIATAN_SHEET_NAME = "Unit_Kegiatan";
const JADWAL_KEGIATAN_SHEET_NAME = "Jadwal_Kegiatan";
const PENGATURAN_SHEET_NAME = "Pengaturan";
const ALUMNI_SHEET_NAME = "Data_Alumni";


// 1. Mengambil Data Banner Aktif (Untuk Beranda & Admin)
function getBannerData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let bannerSheet = ss.getSheetByName(BANNER_SHEET_NAME);

    // Jika sheet belum ada, buat otomatis beserta headernya
    if (!bannerSheet) {
      bannerSheet = ss.insertSheet(BANNER_SHEET_NAME);
      bannerSheet.appendRow(["ID_Banner", "Nama_Banner", "Gambar_URL", "Tipe_Aksi", "Target_Aksi", "Urutan", "Status"]);
      // Tambahkan 1 banner contoh awal
      bannerSheet.appendRow([
        "BAN_" + new Date().getTime(),
        "Banner Utama PPDB 2026/2027",
        "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop",
        "tab",
        "ppdb",
        1,
        "Aktif"
      ]);
    }

    const data = bannerSheet.getDataRange().getValues();
    const bannerList = [];

    // Baca baris 2 sampai akhir
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Pastikan ID tidak kosong
        bannerList.push({
          id: String(data[i][0]),
          nama: String(data[i][1] || ""),
          gambar: String(data[i][2] || ""),
          tipeAksi: String(data[i][3] || "none"),
          targetAksi: String(data[i][4] || ""),
          urutan: Number(data[i][5]) || (i),
          status: String(data[i][6] || "Aktif")
        });
      }
    }

    // Urutkan berdasarkan nomor urutan
    bannerList.sort((a, b) => a.urutan - b.urutan);

    return { status: "success", data: bannerList };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// 2. Simpan atau Perbarui Banner (Termasuk Upload Foto ke Drive)
function simpanBanner(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let bannerSheet = ss.getSheetByName(BANNER_SHEET_NAME);
    if (!bannerSheet) {
      getBannerData(); // Buat sheet jika belum ada
      bannerSheet = ss.getSheetByName(BANNER_SHEET_NAME);
    }

    var fileUrl = formData.gambarLama || "";

    // Upload gambar baru ke Drive jika ada file yang diunggah
    if (formData.file && formData.file.base64) {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var decodedData = Utilities.base64Decode(formData.file.base64);
      var blob = Utilities.newBlob(
        decodedData,
        formData.file.mimeType,
        "BANNER_" + new Date().getTime() + "_" + formData.file.name
      );
      var newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    const data = bannerSheet.getDataRange().getValues();
    let isEdit = false;

    // Jika Mode Edit (ID sudah ada)
    if (formData.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(formData.id)) {
          bannerSheet.getRange(i + 1, 2).setValue(formData.nama);
          if (fileUrl) bannerSheet.getRange(i + 1, 3).setValue(fileUrl);
          bannerSheet.getRange(i + 1, 4).setValue(formData.tipeAksi);
          bannerSheet.getRange(i + 1, 5).setValue(formData.targetAksi);
          bannerSheet.getRange(i + 1, 6).setValue(formData.urutan);
          bannerSheet.getRange(i + 1, 7).setValue(formData.status);
          isEdit = true;
          break;
        }
      }
    }

    // Jika Mode Tambah Baru
    if (!isEdit) {
      const newId = "BAN_" + new Date().getTime();
      bannerSheet.appendRow([
        newId,
        formData.nama,
        fileUrl,
        formData.tipeAksi,
        formData.targetAksi,
        formData.urutan,
        formData.status || "Aktif"
      ]);
    }

    return { success: true, message: isEdit ? "Banner berhasil diperbarui!" : "Banner baru berhasil ditambahkan!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// 3. Hapus Banner
function hapusBanner(bannerId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bannerSheet = ss.getSheetByName(BANNER_SHEET_NAME);
    if (!bannerSheet) return { success: false, message: "Sheet tidak ditemukan" };

    const data = bannerSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(bannerId)) {
        bannerSheet.deleteRow(i + 1);
        return { success: true, message: "Banner berhasil dihapus!" };
      }
    }
    return { success: false, message: "ID Banner tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// 4. Toggle Status Banner (Aktif / Nonaktif)
function toggleStatusBanner(bannerId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bannerSheet = ss.getSheetByName(BANNER_SHEET_NAME);
    const data = bannerSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(bannerId)) {
        bannerSheet.getRange(i + 1, 7).setValue(newStatus);
        return { success: true, message: "Status banner diubah ke: " + newStatus };
      }
    }
    return { success: false, message: "ID Banner tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================== PENGELOLAAN GALERI ====================


// 1. Mengambil Data Galeri
function getGaleriData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let galeriSheet = ss.getSheetByName(GALERI_SHEET_NAME);

    // Jika sheet belum ada, buat otomatis beserta headernya
    if (!galeriSheet) {
      galeriSheet = ss.insertSheet(GALERI_SHEET_NAME);
      galeriSheet.appendRow(["ID_Galeri", "Judul", "Kategori", "Keterangan", "Gambar_URL", "Status", "Timestamp"]);
      // Tambahkan contoh awal
      galeriSheet.appendRow([
        "GLR_" + new Date().getTime(),
        "Halaqah Hafalan Santri",
        "Kegiatan Santri",
        "Harian Asrama",
        "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=800&auto=format&fit=crop",
        "Aktif",
        new Date().toISOString()
      ]);
    }

    const data = galeriSheet.getDataRange().getValues();
    const galeriList = [];

    // Baca baris 2 sampai akhir
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Pastikan ID tidak kosong
        galeriList.push({
          id: String(data[i][0]),
          judul: String(data[i][1] || ""),
          kategori: String(data[i][2] || ""),
          keterangan: String(data[i][3] || ""),
          gambar: String(data[i][4] || ""),
          status: String(data[i][5] || "Aktif"),
          timestamp: String(data[i][6] || "")
        });
      }
    }

    // Urutkan terbaru di atas (reverse)
    galeriList.reverse();

    return { status: "success", data: galeriList };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// 2. Tambah / Edit Galeri
function simpanGaleri(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let galeriSheet = ss.getSheetByName(GALERI_SHEET_NAME);
    if (!galeriSheet) {
      getGaleriData(); // Buat sheet jika belum ada
      galeriSheet = ss.getSheetByName(GALERI_SHEET_NAME);
    }

    var fileUrl = formData.gambarLama || "";

    // Upload gambar baru ke Drive jika ada file yang diunggah
    if (formData.file && formData.file.base64) {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var decodedData = Utilities.base64Decode(formData.file.base64);
      var blob = Utilities.newBlob(
        decodedData,
        formData.file.mimeType,
        "GALERI_" + new Date().getTime() + "_" + formData.file.name
      );
      var newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    const data = galeriSheet.getDataRange().getValues();
    let isEdit = false;

    // Jika Mode Edit (ID sudah ada)
    if (formData.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(formData.id)) {
          galeriSheet.getRange(i + 1, 2).setValue(formData.judul);
          galeriSheet.getRange(i + 1, 3).setValue(formData.kategori);
          galeriSheet.getRange(i + 1, 4).setValue(formData.keterangan);
          if (fileUrl) galeriSheet.getRange(i + 1, 5).setValue(fileUrl);
          galeriSheet.getRange(i + 1, 6).setValue(formData.status);
          isEdit = true;
          break;
        }
      }
    }

    // Jika Mode Tambah Baru
    if (!isEdit) {
      const newId = "GLR_" + new Date().getTime();
      galeriSheet.appendRow([
        newId,
        formData.judul,
        formData.kategori,
        formData.keterangan,
        fileUrl,
        formData.status || "Aktif",
        new Date().toISOString()
      ]);
    }

    return { success: true, message: "Galeri berhasil disimpan", url: fileUrl };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan galeri: " + err.message };
  }
}

// 3. Hapus Galeri
function hapusGaleri(galeriId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const galeriSheet = ss.getSheetByName(GALERI_SHEET_NAME);
    const data = galeriSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(galeriId)) {
        galeriSheet.deleteRow(i + 1);
        return { success: true, message: "Galeri berhasil dihapus" };
      }
    }
    return { success: false, message: "ID Galeri tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// 4. Toggle Status Galeri
function toggleStatusGaleri(galeriId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const galeriSheet = ss.getSheetByName(GALERI_SHEET_NAME);
    const data = galeriSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(galeriId)) {
        galeriSheet.getRange(i + 1, 6).setValue(newStatus);
        return { success: true, message: "Status galeri diubah ke: " + newStatus };
      }
    }
    return { success: false, message: "ID Galeri tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function formatYoutubeEmbedUrlBackend(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.includes("youtube.com/embed/") || trimmed.includes("youtube-nocookie.com/embed/")) {
    return trimmed;
  }
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1] && !trimmed.includes("watch?v=")) {
    return "https://www.youtube.com/embed/videoseries?list=" + playlistMatch[1] + "&rel=0";
  }
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return "https://www.youtube.com/embed/" + shortMatch[1] + "?rel=0";
  }
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return "https://www.youtube.com/embed/" + watchMatch[1] + "?rel=0";
  }
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return "https://www.youtube.com/embed/" + shortsMatch[1] + "?rel=0";
  }
  return trimmed;
}


// ==================== PENGATURAN PROFIL ====================
function getPengaturanData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(PENGATURAN_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(PENGATURAN_SHEET_NAME);
      sheet.appendRow(["Key", "Value", "Keterangan", "Update_Terakhir"]);
      sheet.appendRow(["video_highlight", "https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0", "URL Embed Youtube untuk Galeri", new Date().toISOString()]);
      sheet.appendRow(["link_instagram", "https://instagram.com", "URL Profil Instagram", new Date().toISOString()]);
      sheet.appendRow(["link_youtube", "https://youtube.com", "URL Channel YouTube", new Date().toISOString()]);
      sheet.appendRow(["link_facebook", "https://facebook.com", "URL Halaman Facebook", new Date().toISOString()]);
    }
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      if (key) {
        let val = String(data[i][1]).trim();
        if (key === "video_highlight") {
          // Bersihkan dummy playlist rusak atau ubah link youtu.be menjadi embed URL
          if (val.includes("list=PL_XQ")) {
            val = "https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0";
          } else {
            val = formatYoutubeEmbedUrlBackend(val);
          }
        }
        config[key] = val;
      }
    }
    
    return { status: "success", data: config };
  } catch (err) {
    return { status: "error", message: err.toString(), data: {} };
  }
}

function simpanPengaturan(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(PENGATURAN_SHEET_NAME);
    if (!sheet) {
      getPengaturanData();
      sheet = ss.getSheetByName(PENGATURAN_SHEET_NAME);
    }
    
    if (payload.video_highlight) {
      payload.video_highlight = formatYoutubeEmbedUrlBackend(payload.video_highlight);
    }
    
    const keysToUpdate = Object.keys(payload);
    const data = sheet.getDataRange().getValues();
    
    for (let k of keysToUpdate) {
      if (k === "action") continue;
      
      let foundRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === k) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 2).setValue(payload[k]);
        sheet.getRange(foundRow, 4).setValue(new Date().toISOString());
      } else {
        sheet.appendRow([k, payload[k], "", new Date().toISOString()]);
      }
    }
    
    return { success: true, message: "Pengaturan berhasil disimpan!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================== PENGELOLAAN UNIT KEGIATAN SANTRI (UKS) ====================


// 1. Mengambil Data Unit Kegiatan
function getUnitKegiatanData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(UNIT_KEGIATAN_SHEET_NAME);

    // Jika sheet belum ada, buat otomatis beserta header dan 5 data default
    if (!sheet) {
      sheet = ss.insertSheet(UNIT_KEGIATAN_SHEET_NAME);
      sheet.appendRow(["ID_Kegiatan", "Nama", "Kategori", "Jadwal", "Deskripsi", "Gambar_URL", "Urutan", "Status", "Timestamp"]);
      
      const defaultData = [
        [
          "UKS_01_SEMUT",
          "Teater \"SEMUT\"",
          "Divisi Teater IKASAPNA",
          "2x Semesta / Tahun",
          "Unit kegiatan santri PPTQ Asnawiyyah yang berfokus pada pementasan drama atau teater di bawah naungan lembaga semi otonom IKASAPNA. Ditujukan sebagai wadah kreativitas untuk melatih mental dan rasa percaya diri santri saat berada di tengah masyarakat.",
          "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop",
          1,
          "Aktif",
          new Date().toISOString()
        ],
        [
          "UKS_02_MADING",
          "Mading \"EL-Fata\"",
          "Karya Literasi",
          "Awal Bulan Hijriyah",
          "Unit kegiatan yang berfokus pada kreasi majalah dinding sebagai salah satu media untuk menampilkan karya seni, tulisan, dan kreativitas santri PPTQ Asnawiyyah yang terbit secara berkala setiap awal bulan Hijriyah.",
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop",
          2,
          "Aktif",
          new Date().toISOString()
        ],
        [
          "UKS_03_PERPUS",
          "Perpustakaan \"Bait Al-Hikmah\"",
          "Pusat Baca Santri",
          "IKASAPNA",
          "Perpustakaan milik PPTQ Asnawiyyah yang berada di bawah naungan IKASAPNA. Dibangun guna melestarikan budaya membaca di kalangan santri serta menjadi jembatan penghubung antara santri dengan wawasan dunia luar lewat koleksi buku yang tersedia.",
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop",
          3,
          "Aktif",
          new Date().toISOString()
        ],
        [
          "UKS_04_REBANA",
          "Rebana \"Az-Zahra\"",
          "Seni Musik Islami",
          "Malam Jumat & Event",
          "Unit kegiatan seni musik dengan aliran Hadroh Banjari Kontemporer (terbang, tam, darbuka, jidor). Ditampilkan rutin pada malam Jumat saat acara diba'an dan sebagai pembuka acara-acara penting di PPTQ Asnawiyyah.",
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
          4,
          "Aktif",
          new Date().toISOString()
        ],
        [
          "UKS_05_PERS",
          "Divisi PERS Asnawiyyah",
          "Media & Publikasi",
          "Dokumentasi",
          "Divisi khusus yang berkonsentrasi pada media sosial resmi pesantren (Facebook, Instagram, YouTube, Twitter/X). Berperan mengabadikan dan mempublikasikan seluruh kegiatan serta event pesantren untuk mengenalkan PPTQ Asnawiyyah ke dunia luar.",
          "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop",
          5,
          "Aktif",
          new Date().toISOString()
        ]
      ];

      for (var d = 0; d < defaultData.length; d++) {
        sheet.appendRow(defaultData[d]);
      }
    }

    const data = sheet.getDataRange().getValues();
    const list = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        list.push({
          id: String(data[i][0]),
          nama: String(data[i][1] || ""),
          kategori: String(data[i][2] || ""),
          jadwal: String(data[i][3] || ""),
          deskripsi: String(data[i][4] || ""),
          gambar: String(data[i][5] || ""),
          urutan: Number(data[i][6]) || 1,
          status: String(data[i][7] || "Aktif"),
          timestamp: String(data[i][8] || "")
        });
      }
    }

    // Urutkan berdasarkan urutan ASC
    list.sort(function(a, b) {
      return a.urutan - b.urutan;
    });

    return { status: "success", data: list };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// 2. Tambah / Edit Unit Kegiatan
function simpanUnitKegiatan(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(UNIT_KEGIATAN_SHEET_NAME);
    if (!sheet) {
      getUnitKegiatanData();
      sheet = ss.getSheetByName(UNIT_KEGIATAN_SHEET_NAME);
    }

    var fileUrl = formData.gambarLama || formData.gambar || "";

    // Upload file ke Google Drive jika ada file base64
    if (formData.file && formData.file.base64) {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var decodedData = Utilities.base64Decode(formData.file.base64);
      var blob = Utilities.newBlob(
        decodedData,
        formData.file.mimeType,
        "UKS_" + new Date().getTime() + "_" + formData.file.name
      );
      var newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    const data = sheet.getDataRange().getValues();
    let isEdit = false;

    // Jika Mode Edit (ID sudah ada)
    if (formData.id) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(formData.id)) {
          sheet.getRange(i + 1, 2).setValue(formData.nama || formData.judul || "");
          sheet.getRange(i + 1, 3).setValue(formData.kategori || "");
          sheet.getRange(i + 1, 4).setValue(formData.jadwal || "");
          sheet.getRange(i + 1, 5).setValue(formData.deskripsi || "");
          if (fileUrl) sheet.getRange(i + 1, 6).setValue(fileUrl);
          sheet.getRange(i + 1, 7).setValue(Number(formData.urutan) || 1);
          sheet.getRange(i + 1, 8).setValue(formData.status || "Aktif");
          isEdit = true;
          break;
        }
      }
    }

    // Jika Tambah Baru
    if (!isEdit) {
      const newId = "UKS_" + new Date().getTime();
      sheet.appendRow([
        newId,
        formData.nama || formData.judul || "",
        formData.kategori || "",
        formData.jadwal || "",
        formData.deskripsi || "",
        fileUrl,
        Number(formData.urutan) || data.length,
        formData.status || "Aktif",
        new Date().toISOString()
      ]);
    }

    return { success: true, message: "Data Unit Kegiatan berhasil disimpan", url: fileUrl };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan Unit Kegiatan: " + err.message };
  }
}

// 3. Hapus Unit Kegiatan
function hapusUnitKegiatan(kegiatanId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(UNIT_KEGIATAN_SHEET_NAME);
    if (!sheet) return { success: false, message: "Sheet Unit Kegiatan tidak ditemukan" };

    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(kegiatanId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Unit Kegiatan berhasil dihapus" };
      }
    }
    return { success: false, message: "ID Unit Kegiatan tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// 4. Toggle Status Unit Kegiatan
function toggleStatusUnitKegiatan(kegiatanId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(UNIT_KEGIATAN_SHEET_NAME);
    if (!sheet) return { success: false, message: "Sheet Unit Kegiatan tidak ditemukan" };

    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(kegiatanId)) {
        sheet.getRange(i + 1, 8).setValue(newStatus);
        return { success: true, message: "Status Unit Kegiatan diubah ke: " + newStatus };
      }
    }
    return { success: false, message: "ID Unit Kegiatan tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}


// ==================== PENGELOLAAN JADWAL KEGIATAN SANTRI ====================

// 1. Ambil Data Jadwal Kegiatan (Auto-Create & Seeding 25 Agenda Awal jika Sheet Belum Ada)
function getJadwalKegiatanData() {
  try {
    const ss = (typeof getDatabaseSpreadsheet === "function" ? getDatabaseSpreadsheet() : null) || SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { status: "error", message: "Spreadsheet database tidak ditemukan", data: [] };

    let sheet = ss.getSheetByName(JADWAL_KEGIATAN_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(JADWAL_KEGIATAN_SHEET_NAME);
      sheet.appendRow(["ID_Jadwal", "Tipe", "Waktu", "Kegiatan", "Deskripsi", "Badge", "Urutan", "Status", "Timestamp"]);

      const defaultData = [
        ["JDW_HARIAN_01", "harian", "03.30 – 04.30 WIB", "Bangun Pagi & Qiyamul Lail", "Shalat Tahajud, Hajat, Witir, & Persiapan Shalat Subuh.", "24 Jam", 1, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_02", "harian", "04.30 – 05.30 WIB", "Shalat Subuh Berjamaah & Zikir Pagi", "Shalat Subuh di Masjid Utama, dilanjutkan Pembacaan Zikir Ratib Pagi.", "", 2, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_03", "harian", "05.30 – 07.00 WIB", "Halaqah Hafalan Al-Qur'an (Pagi)", "Setoran Hafalan Baru (Sabaq) & Bimbingan Talaqqi bersama Asatidz.", "Hafalan", 3, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_04", "harian", "07.00 – 08.00 WIB", "Makan Pagi & Persiapan KBM", "Sarapan, MCK, dan persiapan masuk kelas formal/madrasah.", "", 4, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_05", "harian", "08.00 – 11.30 WIB", "Kegiatan Belajar Mengajar (KBM)", "Pelajaran Sekolah Formal / Pengajian Kitab Diniyah secara terstruktur.", "", 5, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_06", "harian", "11.30 – 12.30 WIB", "Shalat Dzuhur & Makan Siang", "Shalat Dzuhur Berjamaah dilanjutkan makan siang santri.", "", 6, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_07", "harian", "12.30 – 15.00 WIB", "Istirahat Siang (Qailulah)", "Tidur siang sunnah & Pendalaman materi hafalan mandiri.", "", 7, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_08", "harian", "15.00 – 17.30 WIB", "Shalat Ashar & Muraja'ah Sore", "Shalat Ashar Berjamaah, Muraja'ah Hafalan Pekanan, & Olahraga ringan.", "", 8, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_09", "harian", "17.30 – 19.30 WIB", "Maghrib, Ratib, & Kajian Kitab", "Shalat Maghrib Berjamaah, Pembacaan Ratib Al-Haddad, & Pengajian Kitab Kuning.", "Kajian", 9, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_10", "harian", "19.30 – 21.30 WIB", "Shalat Isya, Makan Malam & Belajar Mandiri", "Shalat Isya Berjamaah, Makan Malam, & Belajar Mandiri terpadu di asrama.", "", 10, "Aktif", new Date().toISOString()],
        ["JDW_HARIAN_11", "harian", "21.30 – 03.30 WIB", "Istirahat Malam (Jam Wajib Tidur)", "Seluruh fasilitas penerangan umum dimatikan untuk pengkondisian istirahat santri.", "Wajib Tidur", 11, "Aktif", new Date().toISOString()],
        ["JDW_MINGGUAN_01", "mingguan", "Senin & Kamis", "Puasa Sunnah & Buka Bersama", "Pelaksanaan Puasa Sunnah Senin-Kamis dilanjutkan doa & buka puasa bersama santri di aula.", "Sunnah", 1, "Aktif", new Date().toISOString()],
        ["JDW_MINGGUAN_02", "mingguan", "Selasa Kliwon", "Pengajian Akbar Ihya 'Ulumuddin", "Kajian rutin Seloso Kliwon pengajian kitab Ihya 'Ulumuddin bersama Pengasuh Utama.", "Rutin", 2, "Aktif", new Date().toISOString()],
        ["JDW_MINGGUAN_03", "mingguan", "Jumat (Sayyidul Ayyam)", "Ro'an Kebersihan & Al-Kahfi", "Kerja bakti lingkungan (Ro'an), pembacaan Surat Al-Kahfi, Yasin & Tahlil, serta Shalat Jumat Berjamaah.", "Utama", 3, "Aktif", new Date().toISOString()],
        ["JDW_MINGGUAN_04", "mingguan", "Sabtu", "Muhadharah & Seni Hadroh", "Latihan public speaking 3 bahasa (Muhadharah), seni rebana/hadroh, & keahlian IT santri.", "Ekstrakurikuler", 4, "Aktif", new Date().toISOString()],
        ["JDW_MINGGUAN_05", "mingguan", "Ahad", "Kunjungan Wali Santri & Olahraga", "Pagi hari olahraga bersama & kegiatan jalan sehat, dilanjutkan waktu kunjungan resmi wali santri.", "Sambang Wali", 5, "Aktif", new Date().toISOString()],
        ["JDW_BULANAN_01", "bulanan", "Pekan Ke-1", "Sema'an Al-Qur'an Bil-Ghaib", "Khataman Al-Qur'an hafalan santri secara bergantian dalam satu hari di majlis utama.", "P-1", 1, "Aktif", new Date().toISOString()],
        ["JDW_BULANAN_02", "bulanan", "Pekan Ke-2", "Ujian Hafalan Bulanan (Munaqasyah)", "Evaluasi ketercapaian target hafalan baru & kualitas tajwid santri langsung di depan Dewan Penguji.", "P-2", 2, "Aktif", new Date().toISOString()],
        ["JDW_BULANAN_03", "bulanan", "Pekan Ke-3", "Majlis Ta'lim & Silaturahmi Wali Santri", "Pengajian rutin bulanan khusus orang tua/wali santri bersama jajaran Pengasuh Pesantren.", "P-3", 3, "Aktif", new Date().toISOString()],
        ["JDW_BULANAN_04", "bulanan", "Pekan Ke-4", "Santunan Yatim & Bakti Sosial", "Kegiatan kepedulian sosial santri berbagi kepada anak yatim & warga sekitar lingkungan pesantren.", "P-4", 4, "Aktif", new Date().toISOString()],
        ["JDW_TAHUNAN_01", "tahunan", "Bulan Muharram", "Peringatan Tahun Baru Islam & Santunan", "Peringatan 1 Muharram 1448 H, pawai obor santri, dan santunan akbar anak yatim.", "Muharram", 1, "Aktif", new Date().toISOString()],
        ["JDW_TAHUNAN_02", "tahunan", "Bulan Rabiul Awal", "Peringatan Maulid Nabi Muhammad SAW", "Pembacaan Kitab Simtuddurar / Barzanji bersama habaib dan alim ulama Demak.", "Maulid", 2, "Aktif", new Date().toISOString()],
        ["JDW_TAHUNAN_03", "tahunan", "Rajab & Sya'ban", "Wisuda Tahfidz & Haul Pesantren", "Ujian Imtihan Akhirussanah, Wisuda Khotmil Qur'an, & Peringatan Haul Masyayikh PPTQ Asnawiyyah.", "Wisuda", 3, "Aktif", new Date().toISOString()],
        ["JDW_TAHUNAN_04", "tahunan", "Bulan Ramadhan", "Karantina Tahfidz & Pasaran Kitab", "Program percepatan hafalan Ramadhan & pengajian pasaran kitab kuning kilatan.", "Ramadhan", 4, "Aktif", new Date().toISOString()],
        ["JDW_TAHUNAN_05", "tahunan", "Bulan Syawal", "Libur Idul Fitri & Halal Bihalal", "Masa perpulangan libur Idul Fitri santri dan silaturahmi Halal Bihalal Keluarga Besar PPTQ Asnawiyyah.", "Syawal", 5, "Aktif", new Date().toISOString()]
      ];

      for (var d = 0; d < defaultData.length; d++) {
        sheet.appendRow(defaultData[d]);
      }
    }

    const data = sheet.getDataRange().getValues();
    const list = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        list.push({
          id: String(data[i][0]),
          tipe: String(data[i][1] || "harian").toLowerCase(),
          waktu: String(data[i][2] || ""),
          kegiatan: String(data[i][3] || ""),
          deskripsi: String(data[i][4] || ""),
          badge: String(data[i][5] || ""),
          urutan: Number(data[i][6]) || 1,
          status: String(data[i][7] || "Aktif"),
          timestamp: String(data[i][8] || "")
        });
      }
    }

    list.sort(function(a, b) {
      return a.urutan - b.urutan;
    });

    return { status: "success", data: list };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// 2. Tambah / Edit Jadwal Kegiatan
function simpanJadwalKegiatan(formData) {
  try {
    const ss = (typeof getDatabaseSpreadsheet === "function" ? getDatabaseSpreadsheet() : null) || SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, status: "error", message: "Spreadsheet database tidak ditemukan" };

    let sheet = ss.getSheetByName(JADWAL_KEGIATAN_SHEET_NAME);
    if (!sheet) {
      getJadwalKegiatanData();
      sheet = ss.getSheetByName(JADWAL_KEGIATAN_SHEET_NAME);
    }
    if (!sheet) return { success: false, status: "error", message: "Sheet Jadwal Kegiatan gagal diinisialisasi" };

    const data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    var targetId = formData.id;

    if (targetId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(targetId).trim()) {
          rowIndex = i + 1;
          break;
        }
      }
    }

    const tipe = (formData.tipe || "harian").toLowerCase();
    const waktu = formData.waktu || "";
    const kegiatan = formData.kegiatan || formData.nama || "";
    const deskripsi = formData.deskripsi || "";
    const badge = formData.badge || "";
    const urutan = Number(formData.urutan) || 1;
    const status = formData.status || "Aktif";
    const timestamp = new Date().toISOString();

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 2, 1, 8).setValues([[
        tipe, waktu, kegiatan, deskripsi, badge, urutan, status, timestamp
      ]]);
      return { success: true, status: "success", message: "Jadwal kegiatan berhasil diperbarui", id: targetId };
    } else {
      var newId = targetId || ("JDW_" + (tipe.toUpperCase()) + "_" + new Date().getTime());
      sheet.appendRow([
        newId, tipe, waktu, kegiatan, deskripsi, badge, urutan, status, timestamp
      ]);
      return { success: true, status: "success", message: "Jadwal kegiatan baru berhasil ditambahkan", id: newId };
    }
  } catch (err) {
    return { success: false, status: "error", message: err.toString() };
  }
}

// 3. Hapus Jadwal Kegiatan
function hapusJadwalKegiatan(jadwalId) {
  try {
    const ss = (typeof getDatabaseSpreadsheet === "function" ? getDatabaseSpreadsheet() : null) || SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, status: "error", message: "Spreadsheet database tidak ditemukan" };

    const sheet = ss.getSheetByName(JADWAL_KEGIATAN_SHEET_NAME);
    if (!sheet) return { success: false, status: "error", message: "Sheet Jadwal Kegiatan tidak ditemukan" };

    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(jadwalId).trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, status: "success", message: "Jadwal kegiatan berhasil dihapus", id: jadwalId };
      }
    }
    return { success: false, status: "error", message: "ID Jadwal Kegiatan tidak ditemukan" };
  } catch (err) {
    return { success: false, status: "error", message: err.toString() };
  }
}

// 4. Toggle Status Jadwal Kegiatan
function toggleStatusJadwalKegiatan(jadwalId, newStatus) {
  try {
    const ss = (typeof getDatabaseSpreadsheet === "function" ? getDatabaseSpreadsheet() : null) || SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, status: "error", message: "Spreadsheet database tidak ditemukan" };

    const sheet = ss.getSheetByName(JADWAL_KEGIATAN_SHEET_NAME);
    if (!sheet) return { success: false, status: "error", message: "Sheet Jadwal Kegiatan tidak ditemukan" };

    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(jadwalId).trim()) {
        sheet.getRange(i + 1, 8).setValue(newStatus);
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
        return { success: true, status: "success", message: "Status Jadwal Kegiatan diubah ke: " + newStatus, id: jadwalId, newStatus: newStatus };
      }
    }
    return { success: false, status: "error", message: "ID Jadwal Kegiatan tidak ditemukan" };
  } catch (err) {
    return { success: false, status: "error", message: err.toString() };
  }
}

// ==================== PENGELOLAAN NOTIFIKASI & POP-UP BERANDA ====================
const NOTIFIKASI_SHEET_NAME = "Notifikasi";


function getNotifikasiSheet(ss) {
  let sheet = ss.getSheetByName(NOTIFIKASI_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(NOTIFIKASI_SHEET_NAME);
    sheet.appendRow([
      "ID", "Judul", "Kategori", "Tanggal", "Ringkasan", "Isi", "Gambar_URL", "Is_Popup", "Status", "CreatedAt"
    ]);
    sheet.appendRow([
      "NOTIF_" + new Date().getTime(),
      "Selamat Datang di Portal Resmi PPTQ Asnawiyyah",
      "Pengumuman",
      new Date().toISOString().split('T')[0],
      "Informasi dan pengumuman resmi seputar pesantren, kegiatan santri, dan administrasi.",
      "Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nSelamat datang di Portal Informasi Resmi PPTQ Asnawiyyah Pilangwetan. Melalui sistem ini, bapak/ibu wali santri dan masyarakat dapat memantau perkembangan, pengumuman penting, dan agenda kegiatan pesantren secara langsung.\n\nSemoga ikhtiar ini membawa keberkahan bagi kita semua.",
      "assets/img/brand-header.png",
      1,
      "Aktif",
      new Date().toISOString()
    ]);
  }
  return sheet;
}

function getNotifikasiData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getNotifikasiSheet(ss);
    const values = sheet.getDataRange().getValues();
    const list = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0]) {
        list.push({
          id: String(row[0]),
          judul: String(row[1] || ""),
          kategori: String(row[2] || "Pengumuman"),
          tanggal: row[3] ? Utilities.formatDate(new Date(row[3]), "GMT+7", "yyyy-MM-dd") : "",
          ringkasan: String(row[4] || ""),
          isi: String(row[5] || ""),
          gambar: String(row[6] || ""),
          is_popup: (row[7] === 1 || String(row[7]).toLowerCase() === "true" || String(row[7]) === "1"),
          status: String(row[8] || "Aktif"),
          createdAt: String(row[9] || "")
        });
      }
    }

    list.sort(function(a, b) {
      return (b.id > a.id ? 1 : -1);
    });

    return { status: "success", data: list };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

function simpanNotifikasi(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getNotifikasiSheet(ss);
    let fileUrl = formData.gambarLama || formData.gambar || "";

    if (formData.file && formData.file.base64) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decodedData = Utilities.base64Decode(formData.file.base64);
      const blob = Utilities.newBlob(
        decodedData,
        formData.file.mimeType,
        "NOTIF_" + new Date().getTime() + "_" + formData.file.name
      );
      const newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    const data = sheet.getDataRange().getValues();
    let isEdit = false;
    const isPopupVal = (formData.is_popup === true || formData.is_popup === 1 || String(formData.is_popup) === "1" || String(formData.is_popup).toLowerCase() === "true") ? 1 : 0;
    const tanggalVal = formData.tanggal || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

    if (formData.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(formData.id)) {
          sheet.getRange(i + 1, 2).setValue(formData.judul || "");
          sheet.getRange(i + 1, 3).setValue(formData.kategori || "Pengumuman");
          sheet.getRange(i + 1, 4).setValue(tanggalVal);
          sheet.getRange(i + 1, 5).setValue(formData.ringkasan || "");
          sheet.getRange(i + 1, 6).setValue(formData.isi || "");
          if (fileUrl !== undefined) sheet.getRange(i + 1, 7).setValue(fileUrl);
          sheet.getRange(i + 1, 8).setValue(isPopupVal);
          sheet.getRange(i + 1, 9).setValue(formData.status || "Aktif");
          isEdit = true;
          break;
        }
      }
    }

    if (!isEdit) {
      const newId = "NOTIF_" + new Date().getTime();
      sheet.appendRow([
        newId,
        formData.judul || "",
        formData.kategori || "Pengumuman",
        tanggalVal,
        formData.ringkasan || "",
        formData.isi || "",
        fileUrl,
        isPopupVal,
        formData.status || "Aktif",
        new Date().toISOString()
      ]);
    }

    return { status: "success", message: isEdit ? "Notifikasi berhasil diperbarui!" : "Notifikasi berhasil ditambahkan!" };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

function deleteNotifikasiData(formData) {
  try {
    const notifId = typeof formData === "object" ? (formData.id || formData.notifId) : formData;
    if (!notifId) return { status: "error", message: "ID Notifikasi tidak diberikan" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getNotifikasiSheet(ss);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(notifId)) {
        sheet.deleteRow(i + 1);
        return { status: "success", message: "Notifikasi berhasil dihapus!" };
      }
    }

    return { status: "error", message: "Notifikasi tidak ditemukan." };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}


// 5. Upload Media Tunggal ke Google Drive (Khusus Admin/Editor Terautentikasi)
function uploadMediaToDrive(formData, token) {
  try {
    // 1. Validasi Autentikasi Sesi Admin
    if (!token) {
      return {
        success: false,
        status: "error",
        statusCode: 401,
        message: "Sesi admin tidak ditemukan. Silakan login kembali."
      };
    }

    const session = verifySessionToken(token);
    if (!session || !session.userId || !session.role) {
      return {
        success: false,
        status: "error",
        statusCode: 401,
        message: "Sesi admin tidak valid atau telah kedaluwarsa. Silakan login kembali."
      };
    }

    // 2. Validasi Otorisasi Role (ADMIN atau EDITOR)
    const role = String(session.role || "").toLowerCase();
    if (role !== "admin" && role !== "editor") {
      return {
        success: false,
        status: "error",
        statusCode: 403,
        message: "Akses ditolak: Anda tidak memiliki izin untuk mengunggah media."
      };
    }

    // 3. Validasi Payload File
    const fileData = (formData && formData.file) || formData;
    if (!fileData || !fileData.base64 || !fileData.name) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Data file (base64 dan nama file) wajib dikirimkan."
      };
    }

    // 4. Strict MIME Type Whitelist (Hanya Gambar)
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const rawMime = String(fileData.mimeType || "").trim().toLowerCase();
    if (!allowedMimes.includes(rawMime)) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Format file tidak didukung. Hanya gambar (JPG, PNG, WEBP, GIF) yang diperbolehkan."
      };
    }

    // 5. Decode Base64 & Validasi Ukuran Binary (Maksimal 5 MB)
    var decodedData = Utilities.base64Decode(fileData.base64);
    if (!decodedData || decodedData.length === 0) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Data biner file kosong atau tidak valid."
      };
    }

    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (decodedData.length > maxBytes) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Ukuran file melebihi batas maksimal 5 MB."
      };
    }

    // 6. Simpan File ke Google Drive
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var cleanName = String(fileData.name || "media.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    var prefix = String(fileData.prefix || "PROGRAM").toUpperCase().replace(/[^A-Z0-9]/g, "");
    var blob = Utilities.newBlob(
      decodedData,
      rawMime,
      prefix + "_" + new Date().getTime() + "_" + cleanName
    );
    var newFile = folder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();

    return {
      success: true,
      status: "success",
      statusCode: 200,
      url: fileUrl,
      fileUrl: fileUrl,
      fileId: newFile.getId(),
      message: "Media berhasil diunggah ke Google Drive!"
    };
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return { success: false, status: "error", statusCode: 401, message: err.message };
    }
    if (err instanceof AuthorizationError) {
      return { success: false, status: "error", statusCode: 403, message: err.message };
    }
    return { success: false, status: "error", message: err.toString() };
  }
}
