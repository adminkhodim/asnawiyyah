/**
 * BACKEND API GOOGLE APPS SCRIPT
 * Hubungkan script ini dengan Google Sheets untuk mengelola database pesantren.
 */

// Tangani Request POST (Menyimpan Pendaftaran Santri Baru)
function doPost(e) {

  try {

    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Payload POST tidak ditemukan"
      });
    }

    const payload = JSON.parse(e.postData.contents);

    const action =
      payload.action ||
      (e.parameter && e.parameter.action) ||
      null;

    if (!action) {
      return createJsonResponse({
        status: "error",
        message: "Parameter action wajib diisi"
      });
    }

    // ========================================================
    // PUBLIC API
    // ========================================================

    if (action === "submitPPDB") {
      return createJsonResponse(
        submitPendaftaran(payload.data || payload)
      );
    }

    // ========================================================
    // ADMIN API
    // ========================================================

    if (action === "getPPDB") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        getPendaftarData()
      );
    }

    if (action === "saveBerita") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        simpanBerita(payload.data || payload)
      );
    }

    if (action === "updateBerita") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        updateBerita(payload.data || payload)
      );
    }

    if (action === "deleteBerita") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        deleteBeritaData(payload.data || payload)
      );
    }

    if (action === "saveBanner") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        simpanBanner(payload.data || payload)
      );
    }

    if (action === "uploadMedia") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(
        uploadMediaToDrive(payload.data || payload, token)
      );
    }

    if (action === "deleteBanner") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }

      const bannerId =
        payload.bannerId ||
        payload.id ||
        (payload.data && (payload.data.bannerId || payload.data.id));

      if (!bannerId) {
        return createJsonResponse({
          status: "error",
          message: "ID Banner wajib diisi"
        });
      }

      return createJsonResponse(
        hapusBanner(bannerId)
      );
    }

    if (action === "getNotifikasi") {
      return createJsonResponse(
        getNotifikasiData()
      );
    }

    if (action === "saveNotifikasi" || action === "admin.saveNotifikasi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        simpanNotifikasi(payload.data || payload)
      );
    }

    if (action === "deleteNotifikasi" || action === "admin.deleteNotifikasi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        deleteNotifikasiData(payload.data || payload)
      );
    }

    if (action === "toggleBanner") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }

      const source =
        payload.data || payload;

      const bannerId =
        source.bannerId ||
        source.id;

      const newStatus =
        source.newStatus ||
        source.status;

      if (!bannerId || !newStatus) {
        return createJsonResponse({
          status: "error",
          message: "ID Banner dan status wajib diisi"
        });
      }

      return createJsonResponse(
        toggleStatusBanner(
          bannerId,
          newStatus
        )
      );
    }

    if (action === "saveGaleri") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanGaleri(payload.data || payload));
    }

    if (action === "savePengaturan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanPengaturan(payload.data || payload));
    }

    if (action === "deleteGaleri") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const galeriId = payload.galeriId || payload.id || (payload.data && (payload.data.galeriId || payload.data.id));
      if (!galeriId) {
        return createJsonResponse({ status: "error", message: "ID Galeri wajib diisi" });
      }
      return createJsonResponse(hapusGaleri(galeriId));
    }

    if (action === "toggleGaleri") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const galeriId = payload.galeriId || payload.id;
      const newStatus = payload.newStatus || payload.status;
      if (!galeriId || !newStatus) {
        return createJsonResponse({ status: "error", message: "ID Galeri dan status wajib diisi" });
      }
      return createJsonResponse(toggleStatusGaleri(galeriId, newStatus));
    }

    // ========================================================
    // UNIT KEGIATAN SANTRI (UKS) API ROUTER (POST)
    // ========================================================
    if (action === "saveUnitKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanUnitKegiatan(payload.data || payload));
    }

    if (action === "deleteUnitKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const kegiatanId = payload.id || (payload.data && payload.data.id);
      if (!kegiatanId) {
        return createJsonResponse({ status: "error", message: "ID Kegiatan wajib diisi" });
      }
      return createJsonResponse(hapusUnitKegiatan(kegiatanId));
    }

    if (action === "toggleUnitKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const kegiatanId = payload.id || (payload.data && payload.data.id);
      const newStatus = payload.newStatus || (payload.data && payload.data.newStatus);
      if (!kegiatanId || !newStatus) {
        return createJsonResponse({ status: "error", message: "ID Kegiatan dan status wajib diisi" });
      }
      return createJsonResponse(toggleStatusUnitKegiatan(kegiatanId, newStatus));
    }

    if (action === "alumni.getTestimonials") {
      return createJsonResponse(getAlumniTestimonials());
    }

    if (action === "alumni.create") {
      return createJsonResponse(saveAlumniData(payload));
    }

    if (action === "auditSecurityStatus") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        verifySessionToken(token);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse({
        status: "success",
        data: auditSecurityConfig()
      });
    }

    // ========================================================
    // PROGRAM DATA SOURCE v2.0 API ROUTER (POST)
    // ========================================================
    if (action.startsWith("program.") || action === "admin.login") {
      return handleProgramApiAction(action, payload, e);
    }

    // ========================================================
    // IDENTITY & AUTHENTICATION ARCHITECTURE v2.0 (PHASE 2B)
    // ========================================================
    if (action.startsWith("auth.")) {
      return handleAuthApiAction(action, payload, e);
    }

    if (action === "request_otp") {
      return createJsonResponse(handleRequestOTP(payload));
    }
    if (action === "verify_otp") {
      return createJsonResponse(handleVerifyOTP(payload));
    }
    if (action === "login") {
      return createJsonResponse(handleLogin(payload));
    }
    if (action === "google_login") {
      return createJsonResponse(handleGoogleLogin(payload));
    }

    return createJsonResponse({
      status: "error",
      message: "Action tidak dikenal",
      action: action
    });

  } catch (error) {

    console.error(error);

    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada server."
    });
  }
}

// Helper untuk membuat response bertipe JSON dengan dukungan CORS
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

// Helper format tanggal agar lebih rapi dibaca di Indonesia

// ============================================================
// PUBLIC API: CHECK STATUS PENDAFTAR
// ============================================================

function checkStatusPendaftar(nisn) {

  const pendaftarSheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Pendaftar");

  if (!pendaftarSheet) {
    return {
      status: "error",
      message: "Sheet Pendaftar tidak ditemukan"
    };
  }

  const data =
    pendaftarSheet
      .getDataRange()
      .getValues();

  let foundStudent = null;

  for (let i = 1; i < data.length; i++) {

    if (
      String(data[i][2]).trim() ===
      String(nisn).trim()
    ) {

      foundStudent = {
        nama: data[i][1],
        nisn: data[i][2],
        wali: data[i][3],
        program: data[i][5],
        status: data[i][6] || "Pending",
        tanggalDaftar: formatDate(data[i][0])
      };

      break;
    }
  }

  if (foundStudent) {
    return {
      status: "success",
      data: foundStudent
    };
  }

  return {
    status: "not_found",
    message: "NISN tidak terdaftar"
  };
}


// ============================================================
// PUBLIC API: SUBMIT PENDAFTARAN PPDB
// ============================================================

function submitPendaftaran(payload) {

  const pendaftarSheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Pendaftar");

  if (!pendaftarSheet) {
    return {
      status: "error",
      message: "Sheet Pendaftar tidak ditemukan"
    };
  }

  const nama = payload.nama;
  const nisn = payload.nisn;
  const wali = payload.wali;
  const whatsapp = payload.whatsapp;
  const program = payload.program;
  const status = "Pending";
  const timestamp = new Date();

  if (!nama || !nisn || !whatsapp || !program) {
    return {
      status: "error",
      message: "Data pendaftaran tidak lengkap"
    };
  }

  const rawData =
    pendaftarSheet
      .getDataRange()
      .getValues();

  for (let i = 1; i < rawData.length; i++) {

    if (
      String(rawData[i][2]).trim() ===
      String(nisn).trim()
    ) {

      return {
        status: "duplicate",
        message:
          "NISN tersebut sudah terdaftar di sistem!"
      };
    }
  }

  pendaftarSheet.appendRow([
    timestamp,
    nama,
    String(nisn),
    wali,
    String(whatsapp),
    program,
    status
  ]);

  return {
    status: "success",
    message: "Pendaftaran berhasil disimpan"
  };
}


// ============================================================
// ADMIN API: GET ALL PENDAFTAR PPDB
// ============================================================

function getPendaftarData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pendaftarSheet = ss.getSheetByName("Pendaftar");
    if (!pendaftarSheet) {
      return {
        status: "success",
        data: []
      };
    }

    const data = pendaftarSheet.getDataRange().getValues();
    const listPendaftar = [];

    for (let i = 1; i < data.length; i++) {
      if (!data[i][1]) continue;

      listPendaftar.push({
        tanggalDaftar: formatDate(data[i][0]),
        nama: String(data[i][1] || ""),
        nisn: String(data[i][2] || ""),
        wali: String(data[i][3] || ""),
        whatsapp: String(data[i][4] || ""),
        program: String(data[i][5] || ""),
        status: String(data[i][6] || "Pending")
      });
    }

    return {
      status: "success",
      data: listPendaftar
    };
  } catch (err) {
    return {
      status: "error",
      message: err.toString(),
      data: []
    };
  }
}


function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('id-ID', options);
  } catch (e) {
    return dateString;
  }
}

const FOLDER_ID = "1xKMwCsHJ9-XHUe2m9A6_NV4IBvqgW_WD"; // Ganti dengan ID folder Drive
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

function simpanBerita(formData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { success: false, message: "Sistem sedang sibuk. Silakan coba lagi. (Lock gagal)" };
  }

  try {
    var fileUrl = "";

    // 1. Upload ke Google Drive jika ada file gambar
    if (formData.file && formData.file.base64) {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var decodedData = Utilities.base64Decode(formData.file.base64);
      var blob = Utilities.newBlob(
        decodedData,
        formData.file.mimeType,
        "BERITA_" + new Date().getTime() + "_" + formData.file.name
      );

      var newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    // 2. Simpan ke Google Spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      sheet.appendRow(["news_id", "slug", "Tanggal", "Judul", "Kategori", "Penulis", "Gambar_URL", "Ringkasan", "Isi"]);
    }
    
    // Check if the sheet header represents STATE A (Legacy)
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (header[0] === "Tanggal") {
       throw new Error("Migrasi identitas belum dilakukan. Harap jalankan migrasi terlebih dahulu.");
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
      formData.isi
    ]);

    return { success: true, message: "Berita berhasil dipublikasikan!" };
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
    if (formData.file && formData.file.base64) {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var decodedData = Utilities.base64Decode(formData.file.base64);
      var blob = Utilities.newBlob(decodedData, formData.file.mimeType, "BERITA_UPD_" + new Date().getTime() + "_" + formData.file.name);
      var newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    var judul = formData.judul !== undefined ? formData.judul : data[targetRow - 1][3];
    var kategori = formData.kategori !== undefined ? formData.kategori : data[targetRow - 1][4];
    var penulis = formData.penulis !== undefined ? formData.penulis : data[targetRow - 1][5];
    var ringkasan = formData.ringkasan !== undefined ? formData.ringkasan : data[targetRow - 1][7];
    var isi = formData.isi !== undefined ? formData.isi : data[targetRow - 1][8];

    // Array to update: D to I (Judul, Kategori, Penulis, Gambar_URL, Ringkasan, Isi)
    sheet.getRange(targetRow, 4, 1, 6).setValues([[judul, kategori, penulis, fileUrl, ringkasan, isi]]);

    return { success: true, message: "Berita berhasil diperbarui!" };
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

function mintaIzinDrive() {
  // Memicu izin tulis & buat file (Create File Scope) secara paksa
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var fileUji = folder.createFile("uji_izin.txt", "Tes Izin Drive PPTQ");
  fileUji.setTrashed(true); // Langsung hapus file uji coba ke sampah
  Logger.log("✅ Izin Drive Penuh Berhasil Diaktifkan!");
}

// Tangani Request GET (Satu-satunya GET Router / API Entry Point)
function doGet(e) {

  const action =
    e && e.parameter
      ? e.parameter.action
      : null;

  // ==========================================================
  // LEGACY ACCESS
  // Tetap menampilkan Index.html jika URL dibuka tanpa action.
  // ==========================================================

  if (!action) {

    return HtmlService
      .createHtmlOutputFromFile("Index")
      .setTitle("PPTQ Asnawiyyah")
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      )
      .addMetaTag(
        "viewport",
        "width=device-width, initial-scale=1"
      );
  }

  try {

    // ========================================================
    // PUBLIC GET API
    // ========================================================

    if (action === "getKabar") {
      return createJsonResponse(
        getKabarData()
      );
    }

    if (action === "getBanner") {
      return createJsonResponse(
        getBannerData()
      );
    }

    if (action === "getGaleri") {
      return createJsonResponse(
        getGaleriData()
      );
    }

    if (action === "getNotifikasi") {
      return createJsonResponse(
        getNotifikasiData()
      );
    }

    if (action === "alumni.getTestimonials") {
      return createJsonResponse(getAlumniTestimonials());
    }

    if (action === "getPengaturan") {
      return createJsonResponse(
        getPengaturanData()
      );
    }

    if (action === "checkStatus") {

      const nisn =
        e.parameter.nisn;

      if (!nisn) {
        return createJsonResponse({
          status: "error",
          message: "NISN wajib diisi"
        });
      }

      return createJsonResponse(
        checkStatusPendaftar(nisn)
      );
    }

    if (action === "getUnitKegiatan") {
      return createJsonResponse(
        getUnitKegiatanData()
      );
    }

    // ========================================================
    // PROGRAM DATA SOURCE v2.0 API ROUTER (GET)
    // ========================================================
    if (action.startsWith("program.")) {
      return handleProgramApiAction(action, null, e);
    }

    return createJsonResponse({
      status: "error",
      message: "Action tidak dikenal",
      action: action
    });

  } catch (error) {

    console.error(error);

    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada server."
    });
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
            penulis: "Admin",
            gambar: data[i][6] ? String(data[i][6]) : "",
            ringkasan: data[i][7] ? String(data[i][7]) : "",
            isi: data[i][8] ? String(data[i][8]) : ""
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

// ==================== PENGATURAN PROFIL ====================
function getPengaturanData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(PENGATURAN_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(PENGATURAN_SHEET_NAME);
      sheet.appendRow(["Key", "Value", "Keterangan", "Update_Terakhir"]);
      sheet.appendRow(["video_highlight", "https://www.youtube.com/embed/videoseries?list=PL_XQ&rel=0", "URL Embed Youtube untuk Galeri", new Date().toISOString()]);
      sheet.appendRow(["link_instagram", "https://instagram.com", "URL Profil Instagram", new Date().toISOString()]);
      sheet.appendRow(["link_youtube", "https://youtube.com", "URL Channel YouTube", new Date().toISOString()]);
      sheet.appendRow(["link_facebook", "https://facebook.com", "URL Halaman Facebook", new Date().toISOString()]);
    }
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      if (key) {
        config[key] = String(data[i][1]).trim();
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
// ============================================================================
// PROGRAM DATA SOURCE v2.0 — PHASE 4B-1: BACKEND FOUNDATION
// Pure domain abstractions, error models, contracts, and service skeletons.
// (Zero persistence I/O, zero HTTP coupling, zero auth implementation in 4B-1).
// ============================================================================

/**
 * Domain Status Enum
 */
const ProgramStatus = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived"
});

/**
 * Domain Error Codes (HTTP-Agnostic)
 */
const ProgramErrorCode = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONCURRENCY_CONFLICT: "CONCURRENCY_CONFLICT",
  SERIALIZATION_ERROR: "SERIALIZATION_ERROR",
  PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
  AUTHENTICATION_ERROR: "UNAUTHORIZED_TOKEN",
  AUTHORIZATION_ERROR: "FORBIDDEN_ACTION"
});

/**
 * Base HTTP-Agnostic Domain Error
 */
class DomainError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends DomainError {
  constructor(message, details = null) {
    super(ProgramErrorCode.VALIDATION_ERROR, message, details);
    this.name = "ValidationError";
  }
}

class NotFoundError extends DomainError {
  constructor(message = "Program data not found", details = null) {
    super(ProgramErrorCode.NOT_FOUND, message, details);
    this.name = "NotFoundError";
  }
}

class ConcurrencyConflictError extends DomainError {
  constructor(message = "Optimistic concurrency conflict detected. Record has been updated by another user.", details = null) {
    super(ProgramErrorCode.CONCURRENCY_CONFLICT, message, details);
    this.name = "ConcurrencyConflictError";
  }
}

class SerializationError extends DomainError {
  constructor(message = "Failed to serialize/deserialize program JSON payload (Fail-Closed)", details = null) {
    super(ProgramErrorCode.SERIALIZATION_ERROR, message, details);
    this.name = "SerializationError";
  }
}

class PersistenceError extends DomainError {
  constructor(message = "Persistence layer error", details = null) {
    super(ProgramErrorCode.PERSISTENCE_ERROR, message, details);
    this.name = "PersistenceError";
  }
}

class AuthenticationError extends DomainError {
  constructor(message = "Authentication required or token invalid", details = null) {
    super(ProgramErrorCode.AUTHENTICATION_ERROR, message, details);
    this.name = "AuthenticationError";
  }
}

class AuthorizationError extends DomainError {
  constructor(message = "Insufficient permissions for requested action", details = null) {
    super(ProgramErrorCode.AUTHORIZATION_ERROR, message, details);
    this.name = "AuthorizationError";
  }
}

/**
 * Domain Contract Interfaces & Helper Factories (Conceptual Value Objects)
 */
function createActorContext(userId, role, authenticatedAt = new Date().toISOString(), requestId = "") {
  if (!userId || !role) {
    throw new ValidationError("ActorContext requires valid userId and role");
  }
  return Object.freeze({
    userId: String(userId),
    role: String(role),
    authenticatedAt: String(authenticatedAt),
    requestId: String(requestId)
  });
}

function createAuditMetadata(actorContext, isPublishing = false) {
  const now = new Date().toISOString();
  const meta = {
    updated_at: now,
    updated_by: actorContext ? actorContext.userId : "system"
  };
  if (isPublishing) {
    meta.published_at = now;
    meta.published_by = actorContext ? actorContext.userId : "system";
  }
  return meta;
}

/**
 * Abstract ProgramRepository Interface (Pure Data-Access Contract)
 * Completely decoupled from HTTP, token, PIN, browser, or SpreadsheetApp.
 */
class ProgramRepository {
  findPublished() {
    throw new Error("ProgramRepository.findPublished() must be implemented by subclass");
  }

  findAll() {
    throw new Error("ProgramRepository.findAll() must be implemented by subclass");
  }

  findById(id) {
    throw new Error("ProgramRepository.findById() must be implemented by subclass");
  }

  save(record) {
    throw new Error("ProgramRepository.save() must be implemented by subclass");
  }

  updateStatus(id, status, metadata) {
    throw new Error("ProgramRepository.updateStatus() must be implemented by subclass");
  }
}

/**
 * GoogleSheetsProgramAdapter Implementation
 * Production-oriented Google Sheets Persistence Adapter satisfying the ProgramRepository contract.
 * Features: Sheet discovery, Header validation, Row mapping, LockService critical section,
 * Optimistic Concurrency, and Fail-Closed JSON serialization.
 */
class GoogleSheetsProgramAdapter extends ProgramRepository {
  constructor(customSheetName = "Programs") {
    super();
    this.sheetName = customSheetName;
    this.expectedHeaders = [
      "id", "name", "badge", "image", "description",
      "highlights_json", "detail_json", "status", "sort_order",
      "created_at", "updated_at", "created_by", "updated_by",
      "published_at", "published_by", "version"
    ];
  }

  /**
   * Internal helper: Discovers the "Programs" sheet and validates the 16-column header schema.
   * Throws PersistenceError if sheet does not exist or header schema is invalid.
   */
  _getProgramsSheet() {
    let ss = null;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      throw new PersistenceError("SpreadsheetApp active spreadsheet is unavailable: " + e.message);
    }
    if (!ss) {
      throw new PersistenceError("Active spreadsheet object is null.");
    }

    const sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) {
      throw new PersistenceError(`Sheet '${this.sheetName}' not found in spreadsheet.`);
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    if (!values || values.length === 0) {
      throw new PersistenceError(`Sheet '${this.sheetName}' is completely empty (missing header row).`);
    }

    const headerRow = values[0];
    if (headerRow.length < this.expectedHeaders.length) {
      throw new PersistenceError(
        `Sheet '${this.sheetName}' header schema mismatch: expected at least ${this.expectedHeaders.length} columns, found ${headerRow.length}.`
      );
    }

    // Verify critical column header names (case-insensitive trim match)
    for (let colIdx = 0; colIdx < this.expectedHeaders.length; colIdx++) {
      const expectedCol = this.expectedHeaders[colIdx];
      const actualCol = String(headerRow[colIdx] || "").trim().toLowerCase();
      if (actualCol !== expectedCol) {
        throw new PersistenceError(
          `Sheet '${this.sheetName}' header schema mismatch at column ${colIdx + 1}: expected '${expectedCol}', found '${actualCol}'.`
        );
      }
    }

    return sheet;
  }

  /**
   * Internal Helper: Maps a spreadsheet row array (16 columns) to a ProgramRecord domain object.
   * Enforces FAIL-CLOSED serialization boundary: invalid JSON throws SerializationError immediately.
   */
  _mapRowToRecord(row) {
    if (!row || row.length < 16) {
      throw new PersistenceError("Row data incomplete or truncated (fewer than 16 columns).");
    }

    const id = String(row[0] || "").trim();
    if (!id) {
      throw new PersistenceError("Program row missing required 'id' field.");
    }

    const name = String(row[1] || "").trim();
    const badge = String(row[2] || "").trim();
    const image = String(row[3] || "").trim();
    const description = String(row[4] || "").trim();

    // Deserialize highlights and detail (Fail-Closed!)
    const highlights = deserializeProgramPayload(row[5]);
    const detail = deserializeProgramPayload(row[6]);

    const status = String(row[7] || ProgramStatus.DRAFT).trim().toLowerCase();
    const sortOrder = Number(row[8]) || 0;
    const createdAt = row[9] ? new Date(row[9]).toISOString() : new Date().toISOString();
    const updatedAt = row[10] ? new Date(row[10]).toISOString() : new Date().toISOString();
    const createdBy = String(row[11] || "system").trim();
    const updatedBy = String(row[12] || "system").trim();
    const publishedAt = row[13] ? new Date(row[13]).toISOString() : null;
    const publishedBy = row[14] ? String(row[14]).trim() : null;
    const version = Number(row[15]) || 1;

    return Object.freeze({
      id,
      name,
      badge,
      image,
      description,
      highlights,
      detail,
      status,
      sort_order: sortOrder,
      created_at: createdAt,
      updated_at: updatedAt,
      created_by: createdBy,
      updated_by: updatedBy,
      published_at: publishedAt,
      published_by: publishedBy,
      version
    });
  }

  /**
   * Internal Helper: Maps a ProgramRecord domain object to a 16-element spreadsheet row array.
   */
  _mapRecordToRow(record) {
    if (!record || !record.id) {
      throw new ValidationError("Cannot map invalid record object to spreadsheet row.");
    }

    const highlightsJson = serializeProgramPayload(record.highlights || []);
    const detailJson = serializeProgramPayload(record.detail || {});

    return [
      record.id,
      record.name || "",
      record.badge || "",
      record.image || "",
      record.description || "",
      highlightsJson,
      detailJson,
      record.status || ProgramStatus.DRAFT,
      Number(record.sort_order) || 0,
      record.created_at || new Date().toISOString(),
      record.updated_at || new Date().toISOString(),
      record.created_by || "system",
      record.updated_by || "system",
      record.published_at || "",
      record.published_by || "",
      Number(record.version) || 1
    ];
  }

  /**
   * Reads and returns all records with status === "published", sorted by sort_order ASC.
   * Fail-Closed: If any row fails JSON parsing, operation fails with SerializationError.
   */
  findPublished() {
    const sheet = this._getProgramsSheet();
    const values = sheet.getDataRange().getValues();
    const records = [];

    // Rows 1..N (Index 0 is header)
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row[0] || String(row[0]).trim() === "") continue; // Skip blank rows

      const record = this._mapRowToRecord(row);
      if (record.status === ProgramStatus.PUBLISHED) {
        records.push(record);
      }
    }

    // Sort by sort_order ASC, tie-breaker id ASC
    records.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.id.localeCompare(b.id);
    });

    return records;
  }

  /**
   * Reads and returns all program records regardless of status.
   * Fail-Closed: Invalid cell JSON throws SerializationError immediately.
   */
  findAll() {
    const sheet = this._getProgramsSheet();
    const values = sheet.getDataRange().getValues();
    const records = [];

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row[0] || String(row[0]).trim() === "") continue;

      const record = this._mapRowToRecord(row);
      records.push(record);
    }

    records.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.id.localeCompare(b.id);
    });

    return records;
  }

  /**
   * Reads and returns a single program record by ID, or null if not found.
   */
  findById(id) {
    if (!id || String(id).trim() === "") return null;
    const targetId = String(id).trim();

    const sheet = this._getProgramsSheet();
    const values = sheet.getDataRange().getValues();

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (String(row[0] || "").trim() === targetId) {
        return this._mapRowToRecord(row);
      }
    }

    return null; // ID not found
  }

  /**
   * Inserts or updates a ProgramRecord atomically using LockService.getScriptLock().
   * Enforces optimistic concurrency counter comparison on updates.
   */
  save(record) {
    if (!record || !record.id) {
      throw new ValidationError("ProgramRecord.id is required for save operation.");
    }

    let lock = null;
    try {
      lock = LockService.getScriptLock();
    } catch (e) {
      throw new PersistenceError("LockService is unavailable: " + e.message);
    }

    const hasLock = lock.tryLock(10000); // 10s critical section lock timeout
    if (!hasLock) {
      throw new PersistenceError("Failed to acquire script lock for write operation within 10 seconds.");
    }

    try {
      const sheet = this._getProgramsSheet();
      const values = sheet.getDataRange().getValues();
      const targetId = String(record.id).trim();

      let targetRowIndex = -1;
      let storedRecord = null;

      for (let r = 1; r < values.length; r++) {
        if (String(values[r][0] || "").trim() === targetId) {
          targetRowIndex = r + 1; // 1-indexed row number in Spreadsheet
          storedRecord = this._mapRowToRecord(values[r]);
          break;
        }
      }

      if (targetRowIndex > 0 && storedRecord) {
        // UPDATE EXISTING RECORD: Enforce Optimistic Concurrency Check
        // Record version passed from service/client should equal (storedRecord.version)
        const expectedVersion = Number(record.version) - 1; // Service increments version before saving
        checkOptimisticVersion(storedRecord.version, expectedVersion);

        const rowData = this._mapRecordToRow(record);
        sheet.getRange(targetRowIndex, 1, 1, 16).setValues([rowData]);
      } else {
        // INSERT NEW RECORD
        const rowData = this._mapRecordToRow(record);
        sheet.appendRow(rowData);
      }

      return record;
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Atomically updates status and audit metadata of a ProgramRecord using LockService.getScriptLock().
   */
  updateStatus(id, newStatus, metadata = {}) {
    if (!id || String(id).trim() === "") {
      throw new ValidationError("Program ID is required for updateStatus.");
    }
    if (!newStatus || !Object.values(ProgramStatus).includes(newStatus)) {
      throw new ValidationError(`Invalid target ProgramStatus: '${newStatus}'.`);
    }

    let lock = null;
    try {
      lock = LockService.getScriptLock();
    } catch (e) {
      throw new PersistenceError("LockService is unavailable: " + e.message);
    }

    const hasLock = lock.tryLock(10000);
    if (!hasLock) {
      throw new PersistenceError("Failed to acquire script lock for updateStatus within 10 seconds.");
    }

    try {
      const sheet = this._getProgramsSheet();
      const values = sheet.getDataRange().getValues();
      const targetId = String(id).trim();

      let targetRowIndex = -1;
      let storedRecord = null;

      for (let r = 1; r < values.length; r++) {
        if (String(values[r][0] || "").trim() === targetId) {
          targetRowIndex = r + 1;
          storedRecord = this._mapRowToRecord(values[r]);
          break;
        }
      }

      if (targetRowIndex <= 0 || !storedRecord) {
        throw new NotFoundError(`Program with ID '${id}' not found.`);
      }

      // Increment version counter atomically
      const nextVersion = storedRecord.version + 1;
      const nowIso = new Date().toISOString();
      const updatedBy = metadata.updated_by || (metadata.actorContext ? metadata.actorContext.userId : "system");

      let publishedAt = storedRecord.published_at;
      let publishedBy = storedRecord.published_by;

      if (newStatus === ProgramStatus.PUBLISHED) {
        publishedAt = metadata.published_at || nowIso;
        publishedBy = metadata.published_by || updatedBy;
      }

      const updatedRecord = Object.freeze({
        ...storedRecord,
        status: newStatus,
        version: nextVersion,
        updated_at: metadata.updated_at || nowIso,
        updated_by: updatedBy,
        published_at: publishedAt,
        published_by: publishedBy
      });

      const rowData = this._mapRecordToRow(updatedRecord);
      sheet.getRange(targetRowIndex, 1, 1, 16).setValues([rowData]);

      return true;
    } finally {
      lock.releaseLock();
    }
  }
}

/**
 * Server Secrets Helper (Reads PropertiesService)
 */
function getServerSecret(key, defaultValue = "") {
  try {
    const props = PropertiesService.getScriptProperties();
    const val = props ? props.getProperty(key) : null;
    if (!val && key === "TOKEN_SIGNING_SECRET") {
      console.warn("[SECURITY ALERT] TOKEN_SIGNING_SECRET belum dikonfigurasi di ScriptProperties! Menggunakan fallback.");
    }
    return val || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Setup Script Security Properties Helper
 * Jalankan fungsi ini satu kali dari Google Apps Script Editor untuk mengonfigurasi
 * secret key unik dan versi token secara otomatis ke PropertiesService.
 */
function setupScriptSecurityProperties(customSecret, customVersion) {
  try {
    const props = PropertiesService.getScriptProperties();
    const newSecret = customSecret || ("ASN_" + Utilities.getUuid().replace(/-/g, "") + "_" + new Date().getTime());
    const newVersion = customVersion || "1";
    
    props.setProperty("TOKEN_SIGNING_SECRET", newSecret);
    props.setProperty("TOKEN_VERSION", String(newVersion));
    
    Logger.log("✅ Script Security Properties berhasil dikonfigurasi!");
    Logger.log("TOKEN_SIGNING_SECRET telah disetel (panjang: " + newSecret.length + " karakter).");
    Logger.log("TOKEN_VERSION: " + newVersion);
    
    return {
      status: "success",
      message: "Security properties configured successfully",
      tokenVersion: newVersion
    };
  } catch (err) {
    Logger.log("❌ Gagal mengonfigurasi Script Properties: " + err.message);
    throw err;
  }
}

/**
 * Audit Konfigurasi Keamanan Script
 * Mengecek apakah TOKEN_SIGNING_SECRET dan kunci rahasia Phase 2B sudah terisolasi dan disetel.
 */
function auditSecurityConfig() {
  const props = PropertiesService.getScriptProperties();
  const legacySecret = props ? props.getProperty("TOKEN_SIGNING_SECRET") : null;
  const authSecret = props ? props.getProperty("AUTH_TOKEN_SIGNING_SECRET") : null;
  const otpSecret = props ? props.getProperty("OTP_HASH_SECRET") : null;
  const idSecret = props ? props.getProperty("IDENTIFIER_HASH_SECRET") : null;
  const salt = props ? props.getProperty("PASSWORD_SALT") : null;
  const version = props ? props.getProperty("TOKEN_VERSION") : null;
  
  const isLegacyDefault = !legacySecret || legacySecret === "ASNAWIYYAH_DEFAULT_SECRET_2026";
  const isPhase2BConfigured = Boolean(authSecret && otpSecret && idSecret && salt);
  
  return {
    status: (isLegacyDefault || !isPhase2BConfigured) ? "warning" : "ok",
    legacyAuth: {
      isConfigured: !!legacySecret,
      isUsingFallback: isLegacyDefault
    },
    phase2B: {
      isConfigured: isPhase2BConfigured,
      hasAuthTokenSecret: !!authSecret,
      hasOtpHashSecret: !!otpSecret,
      hasIdentifierHashSecret: !!idSecret,
      hasPasswordSalt: !!salt,
      tokenVersion: version || "1"
    },
    recommendation: !isPhase2BConfigured
      ? "Jalankan setupPhase2BScriptProperties() di Script Editor untuk mengonfigurasi rahasia Phase 2B secara otomatis tanpa mengganggu legacy auth."
      : "Seluruh kunci rahasia terisolasi dan token version aktif."
  };
}

/**
 * Setup Script Security Properties Phase 2B (Non-destructive Isolation)
 * Menginisialisasi kunci rahasia mandiri untuk Phase 2B:
 * - AUTH_TOKEN_SIGNING_SECRET
 * - OTP_HASH_SECRET
 * - IDENTIFIER_HASH_SECRET
 * - PASSWORD_SALT
 * - TOKEN_VERSION
 * Menjaga dan TIDAK merotasi TOKEN_SIGNING_SECRET legacy yang sedang berjalan.
 * Fungsi ini HANYA dapat dijalankan manual oleh Administrator (bukan via HTTP request).
 */
function setupPhase2BScriptProperties(forceRegenerate = false) {
  try {
    const props = PropertiesService.getScriptProperties();
    if (!props) throw new Error("PropertiesService tidak dapat diakses.");

    // 1. Pastikan legacy secret tetap ada dan tidak diubah jika sudah ada
    let legacySecret = props.getProperty("TOKEN_SIGNING_SECRET");
    if (!legacySecret) {
      legacySecret = "ASN_LEGACY_" + Utilities.getUuid().replace(/-/g, "");
      props.setProperty("TOKEN_SIGNING_SECRET", legacySecret);
    }

    // 2. Inisialisasi AUTH_TOKEN_SIGNING_SECRET
    let authSecret = props.getProperty("AUTH_TOKEN_SIGNING_SECRET");
    if (!authSecret || forceRegenerate) {
      authSecret = "ASN_AUTH_" + Utilities.getUuid().replace(/-/g, "") + "_" + Date.now();
      props.setProperty("AUTH_TOKEN_SIGNING_SECRET", authSecret);
    }

    // 3. Inisialisasi OTP_HASH_SECRET
    let otpSecret = props.getProperty("OTP_HASH_SECRET");
    if (!otpSecret || forceRegenerate) {
      otpSecret = "ASN_OTP_" + Utilities.getUuid().replace(/-/g, "") + "_" + Date.now();
      props.setProperty("OTP_HASH_SECRET", otpSecret);
    }

    // 4. Inisialisasi IDENTIFIER_HASH_SECRET (P1-5 terisolasi dari PASSWORD_SALT)
    let idSecret = props.getProperty("IDENTIFIER_HASH_SECRET");
    if (!idSecret || forceRegenerate) {
      idSecret = "ASN_ID_" + Utilities.getUuid().replace(/-/g, "") + "_" + Date.now();
      props.setProperty("IDENTIFIER_HASH_SECRET", idSecret);
    }

    // 5. Inisialisasi PASSWORD_SALT (tetap aman untuk legacy auth jika sudah ada)
    let salt = props.getProperty("PASSWORD_SALT");
    if (!salt || forceRegenerate) {
      salt = "ASN_SALT_" + Utilities.getUuid().replace(/-/g, "") + "_" + Date.now();
      props.setProperty("PASSWORD_SALT", salt);
    }

    // 6. Inisialisasi TOKEN_VERSION
    let version = props.getProperty("TOKEN_VERSION");
    if (!version) {
      props.setProperty("TOKEN_VERSION", "1");
      version = "1";
    }

    Logger.log("✅ Phase 2B Script Properties berhasil dikonfigurasi dengan isolasi rahasia penuh.");
    Logger.log("- TOKEN_SIGNING_SECRET (Legacy): Tetap dipertahankan");
    Logger.log("- AUTH_TOKEN_SIGNING_SECRET: Aktif");
    Logger.log("- OTP_HASH_SECRET: Aktif");
    Logger.log("- IDENTIFIER_HASH_SECRET: Aktif");
    Logger.log("- PASSWORD_SALT: Aktif");
    Logger.log("- TOKEN_VERSION: " + version);

    return {
      status: "success",
      message: "Phase 2B Script Properties configured with complete secret isolation.",
      tokenVersion: version
    };
  } catch (err) {
    Logger.log("❌ Gagal mengonfigurasi Phase 2B Script Properties: " + err.message);
    throw err;
  }
}

/**
 * Generates Server-Signed Session Token (HMAC SHA-256)
 * Menggunakan AUTH_TOKEN_SIGNING_SECRET secara eksplisit.
 */
function generateSessionToken(userId, role, ttlHours = 8, sessionId = null, identityId = null) {
  const secret = getServerSecret("AUTH_TOKEN_SIGNING_SECRET", getServerSecret("TOKEN_SIGNING_SECRET", ""));
  if (!secret) {
    throw new AuthenticationError("Signing secret is not configured on server.");
  }
  const tokenVersion = getServerSecret("TOKEN_VERSION", "1");
  const now = new Date().getTime();
  const expiresAt = now + (ttlHours * 60 * 60 * 1000);

  const payload = {
    userId: String(userId),
    role: String(role),
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    tokenVersion: String(tokenVersion)
  };
  if (sessionId) payload.sessionId = String(sessionId);
  if (identityId) payload.identityId = String(identityId);

  const payloadStr = Utilities.base64Encode(JSON.stringify(payload));
  const signatureBytes = Utilities.computeHmacSha256Signature(payloadStr, secret);
  const signatureStr = Utilities.base64Encode(signatureBytes);

  const token = payloadStr + "." + signatureStr;
  return {
    token: token,
    expiresAt: payload.expiresAt
  };
}

/**
 * Verifies Session Token
 * @param {string} tokenString
 * @param {boolean} requireAuthSecret - Jika true (Phase 2B), HANYA memverifikasi signature dengan AUTH_TOKEN_SIGNING_SECRET dan menolak mutlak token legacy.
 */
function verifySessionToken(tokenString, requireAuthSecret = false) {
  if (!tokenString || typeof tokenString !== "string" || !tokenString.includes(".")) {
    throw new AuthenticationError("Authentication token is missing or malformed.");
  }

  const parts = tokenString.split(".");
  if (parts.length !== 2) {
    throw new AuthenticationError("Authentication token format invalid.");
  }

  const payloadStr = parts[0];
  const signatureStr = parts[1];

  const authSecret = getServerSecret("AUTH_TOKEN_SIGNING_SECRET", "");
  const legacySecret = getServerSecret("TOKEN_SIGNING_SECRET", "");

  if (!authSecret && !legacySecret) {
    throw new AuthenticationError("Signing secrets are not configured on server.");
  }

  let validSig = false;

  if (requireAuthSecret) {
    // P0-1 STRICT ISOLATION: Endpoint Phase 2B WAJIB ditandatangani dengan AUTH_TOKEN_SIGNING_SECRET.
    // Tidak ada fallback ke legacySecret! Token legacy ditolak secara deterministik.
    if (!authSecret) {
      throw new AuthenticationError("AUTH_TOKEN_SIGNING_SECRET is not configured on server.");
    }
    const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadStr, authSecret);
    if (signatureStr === Utilities.base64Encode(expectedSigBytes)) {
      validSig = true;
    }
  } else {
    // Jalur Legacy CMS: periksa authSecret, jika gagal fallback ke legacySecret
    if (authSecret) {
      const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadStr, authSecret);
      if (signatureStr === Utilities.base64Encode(expectedSigBytes)) {
        validSig = true;
      }
    }
    if (!validSig && legacySecret) {
      const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadStr, legacySecret);
      if (signatureStr === Utilities.base64Encode(expectedSigBytes)) {
        validSig = true;
      }
    }
  }

  if (!validSig) {
    throw new AuthenticationError(
      requireAuthSecret 
        ? "Invalid authentication token signature. Legacy tokens cannot access Phase 2B endpoints."
        : "Authentication token signature verification failed (tampered)."
    );
  }

  let claims = null;
  try {
    const jsonStr = Utilities.newBlob(Utilities.base64Decode(payloadStr)).getDataAsString();
    claims = JSON.parse(jsonStr);
  } catch (e) {
    throw new AuthenticationError("Failed to parse token payload claims.");
  }

  if (!claims || !claims.expiresAt || !claims.userId || !claims.role) {
    throw new AuthenticationError("Authentication token payload is incomplete.");
  }

  const expTime = new Date(claims.expiresAt).getTime();
  if (isNaN(expTime) || Date.now() >= expTime) {
    throw new AuthenticationError("Authentication token has expired. Please log in again.");
  }

  const activeTokenVersion = getServerSecret("TOKEN_VERSION", "1");
  if (String(claims.tokenVersion) !== String(activeTokenVersion)) {
    throw new AuthenticationError("Authentication token has been revoked.");
  }

  // P0 SERVER-SIDE SESSION AUTHORITY: Validasi terhadap Auth_Sessions jika memuat sessionId
  if (claims.sessionId && typeof getSessionById === "function") {
    const session = getSessionById(claims.sessionId);
    if (!session || session.status !== "ACTIVE") {
      throw new AuthenticationError("Session has been revoked or is inactive on the server.");
    }
    const sessionExpTime = new Date(session.expires_at).getTime();
    if (isNaN(sessionExpTime) || Date.now() >= sessionExpTime) {
      throw new AuthenticationError("Server session registry has expired. Please log in again.");
    }
  }

  return claims;
}

/**
 * Action Authorization Matrix
 */
const AllowedRoles = Object.freeze({
  ADMIN: "admin",
  EDITOR: "editor"
});

function authorizeAction(actorContext, actionName) {
  const publicActions = ["program.listPublished", "program.getPublished"];
  if (publicActions.includes(actionName)) {
    return true; // Public access allowed
  }

  if (!actorContext || !actorContext.role) {
    throw new AuthenticationError("Authentication required for action: " + actionName);
  }

  const role = actorContext.role;

  const editorActions = [
    "program.list",
    "program.get",
    "program.create",
    "program.update"
  ];

  const adminActions = [
    "program.publish",
    "program.unpublish",
    "program.archive"
  ];

  if (adminActions.includes(actionName)) {
    if (role !== AllowedRoles.ADMIN) {
      throw new AuthorizationError(`Role '${role}' is forbidden from performing action '${actionName}'.`);
    }
    return true;
  }

  if (editorActions.includes(actionName)) {
    if (role !== AllowedRoles.ADMIN && role !== AllowedRoles.EDITOR) {
      throw new AuthorizationError(`Role '${role}' is forbidden from performing action '${actionName}'.`);
    }
    return true;
  }

  throw new AuthorizationError("Unrecognized action for authorization check: " + actionName);
}

/**
 * DTO Boundary Mapping Helpers
 */
function mapToPublicProgramDTO(record) {
  if (!record) return null;
  return Object.freeze({
    id: record.id,
    name: record.name,
    badge: record.badge,
    image: record.image,
    description: record.description,
    highlights: record.highlights,
    detail: record.detail
  });
}

function mapToAdminProgramDTO(record) {
  if (!record) return null;
  return Object.freeze({
    id: record.id,
    name: record.name,
    badge: record.badge,
    image: record.image,
    description: record.description,
    highlights: record.highlights,
    detail: record.detail,
    status: record.status,
    sort_order: record.sort_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
    created_by: record.created_by,
    updated_by: record.updated_by,
    published_at: record.published_at,
    published_by: record.published_by,
    version: record.version
  });
}

/**
 * ProgramService Implementation
 * Application service orchestrating business rules, field ownership, and lifecycle logic.
 */
class ProgramService {
  constructor(programRepository) {
    if (!programRepository) {
      throw new ValidationError("ProgramService requires a valid ProgramRepository instance");
    }
    this.repository = programRepository;
  }

  getPublishedPrograms() {
    const records = this.repository.findPublished();
    return records.map(r => mapToPublicProgramDTO(r));
  }

  getPublishedProgramById(id) {
    if (!id) throw new ValidationError("Program ID is required.");
    const record = this.repository.findById(id);
    if (!record || record.status !== ProgramStatus.PUBLISHED) {
      throw new NotFoundError(`Published program '${id}' not found.`);
    }
    return mapToPublicProgramDTO(record);
  }

  getAllPrograms(actorContext) {
    authorizeAction(actorContext, "program.list");
    const records = this.repository.findAll();
    return records.map(r => mapToAdminProgramDTO(r));
  }

  getProgramById(id, actorContext) {
    authorizeAction(actorContext, "program.get");
    if (!id) throw new ValidationError("Program ID is required.");
    const record = this.repository.findById(id);
    if (!record) {
      throw new NotFoundError(`Program with ID '${id}' not found.`);
    }
    return mapToAdminProgramDTO(record);
  }

  saveProgram(inputPayload, actorContext) {
    if (!inputPayload || typeof inputPayload !== "object") {
      throw new ValidationError("Invalid program payload.");
    }

    const id = String(inputPayload.id || "").trim();
    if (!id) {
      throw new ValidationError("Program ID is required.");
    }

    let existing = null;
    try {
      existing = this.repository.findById(id);
    } catch (e) {
      existing = null;
    }

    const isEdit = Boolean(existing);
    const actionName = isEdit ? "program.update" : "program.create";
    authorizeAction(actorContext, actionName);

    // OPTIMISTIC CONCURRENCY VALIDATION
    // Client wajib mengirim version saat melakukan edit.
    if (
      isEdit &&
      inputPayload.version !== undefined &&
      inputPayload.version !== null
    ) {
      checkOptimisticVersion(
        existing.version,
        Number(inputPayload.version)
      );
    }

    const name = String(
      inputPayload.name || (existing ? existing.name : "")
    ).trim();

    if (!name) {
      throw new ValidationError("Program name is required.");
    }

    const now = new Date().toISOString();
    const userId = actorContext.userId;

    // Build ProgramRecord with Server-Managed Lifecycle Fields
    const recordToSave = Object.freeze({
      id: id,
      name: name,
      badge: String(
        inputPayload.badge || (existing ? existing.badge : "")
      ).trim(),
      image: String(
        inputPayload.image || (existing ? existing.image : "")
      ).trim(),
      description: String(
        inputPayload.description || (existing ? existing.description : "")
      ).trim(),
      highlights: Array.isArray(inputPayload.highlights)
        ? inputPayload.highlights
        : (existing ? existing.highlights : []),
      detail: (
        inputPayload.detail &&
        typeof inputPayload.detail === "object"
      )
        ? inputPayload.detail
        : (existing ? existing.detail : {}),

      // SERVER-MANAGED FIELDS
      status: existing
        ? existing.status
        : ProgramStatus.DRAFT,

      sort_order: Number(inputPayload.sort_order) ||
        (existing ? existing.sort_order : 0),

      created_at: existing
        ? existing.created_at
        : now,

      updated_at: now,

      created_by: existing
        ? existing.created_by
        : userId,

      updated_by: userId,

      published_at: existing
        ? existing.published_at
        : null,

      published_by: existing
        ? existing.published_by
        : null,

      // SERVER-SIDE VERSION INCREMENT
      version: isEdit
        ? (Number(existing.version) + 1)
        : 1
    });

    const saved = this.repository.save(recordToSave);
    return mapToAdminProgramDTO(saved);
  }

  publishProgram(id, actorContext, expectedVersion = null) {
    authorizeAction(actorContext, "program.publish");
    const existing = this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Program '${id}' not found for publish action.`);
    }
    if (expectedVersion !== null && expectedVersion !== undefined) {
      checkOptimisticVersion(existing.version, expectedVersion);
    }

    const meta = createAuditMetadata(actorContext, true);
    this.repository.updateStatus(id, ProgramStatus.PUBLISHED, meta);
    return mapToAdminProgramDTO(this.repository.findById(id));
  }

  unpublishProgram(id, actorContext, expectedVersion = null) {
    authorizeAction(actorContext, "program.unpublish");
    const existing = this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Program '${id}' not found for unpublish action.`);
    }
    if (expectedVersion !== null && expectedVersion !== undefined) {
      checkOptimisticVersion(existing.version, expectedVersion);
    }

    const meta = createAuditMetadata(actorContext, false);
    this.repository.updateStatus(id, ProgramStatus.DRAFT, meta);
    return mapToAdminProgramDTO(this.repository.findById(id));
  }

  archiveProgram(id, actorContext, expectedVersion = null) {
    authorizeAction(actorContext, "program.archive");
    const existing = this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Program '${id}' not found for archive action.`);
    }
    if (expectedVersion !== null && expectedVersion !== undefined) {
      checkOptimisticVersion(existing.version, expectedVersion);
    }

    const meta = createAuditMetadata(actorContext, false);
    this.repository.updateStatus(id, ProgramStatus.ARCHIVED, meta);
    return mapToAdminProgramDTO(this.repository.findById(id));
  }
}

/**
 * Application Response Envelope Generator (HTTP-Agnostic JSON Wrapper)
 */
function createAppResponse(success, dataOrMessage, errorObj = null, requestId = "") {
  const reqId = requestId || ("req_" + new Date().getTime());
  if (success) {
    return createJsonResponse({
      success: true,
      data: dataOrMessage,
      requestId: reqId
    });
  } else {
    const code = (errorObj && errorObj.code) || "SERVER_ERROR";
    const message = (errorObj && errorObj.message) || String(dataOrMessage || "An internal error occurred.");
    return createJsonResponse({
      success: false,
      error: {
        code: code,
        message: message,
        requestId: reqId
      },
      requestId: reqId
    });
  }
}

/**
 * API Gateway Dispatcher for Program Data Source v2.0 Actions
 */
function handleProgramApiAction(action, payload, e) {
  const requestId = "req_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
  try {
    // Shared Adapter & Service Factory
    const repository = new GoogleSheetsProgramAdapter("Programs");
    const service = new ProgramService(repository);

    // 1. PUBLIC GET ACTIONS (No Token Required)
    if (action === "program.listPublished") {
      const data = service.getPublishedPrograms();
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.getPublished") {
      const id = (payload && payload.id) || (e && e.parameter && e.parameter.id);
      const data = service.getPublishedProgramById(id);
      return createAppResponse(true, data, null, requestId);
    }

    // 2. ADMIN LOGIN ACTION
    if (action === "admin.login") {
      const pin = (payload && payload.pin) || (payload && payload.data && payload.data.pin);
      if (!pin) {
        throw new ValidationError("PIN is required for admin login.");
      }

      const configuredHash = getServerSecret("ADMIN_PIN_HASH", "");
      let isPinValid = false;

      if (configuredHash) {
        const inputBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pin));
        const inputHash = Utilities.base64Encode(inputBytes);
        isPinValid = (inputHash === configuredHash);
      } else {
        // Safe Fallback PIN check if ScriptProperties hash is not configured yet
        isPinValid = (String(pin) === "123456");
      }

      if (!isPinValid) {
        throw new AuthenticationError("Invalid Admin PIN.");
      }

      const tokenData = generateSessionToken("admin_principal", AllowedRoles.ADMIN, 8);
      return createAppResponse(true, tokenData, null, requestId);
    }

    // 3. PROTECTED ACTIONS (Token & Auth Context Required)
    const token = payload && payload.token;
    const claims = verifySessionToken(token);
    const actorContext = createActorContext(claims.userId, claims.role, claims.issuedAt, requestId);

    if (action === "program.list") {
      const data = service.getAllPrograms(actorContext);
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.get") {
      const id = (payload && payload.id) || (payload && payload.data && payload.data.id);
      const data = service.getProgramById(id, actorContext);
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.create" || action === "program.update") {
      const input = (payload && payload.payload) || (payload && payload.data) || payload;
      const data = service.saveProgram(input, actorContext);
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.publish") {
      const id = (payload && payload.id) || (payload && payload.data && payload.data.id);
      const ver = payload && payload.version;
      const data = service.publishProgram(id, actorContext, ver);
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.unpublish") {
      const id = (payload && payload.id) || (payload && payload.data && payload.data.id);
      const ver = payload && payload.version;
      const data = service.unpublishProgram(id, actorContext, ver);
      return createAppResponse(true, data, null, requestId);
    }
    if (action === "program.archive") {
      const id = (payload && payload.id) || (payload && payload.data && payload.data.id);
      const ver = payload && payload.version;
      const data = service.archiveProgram(id, actorContext, ver);
      return createAppResponse(true, data, null, requestId);
    }

    throw new ValidationError("Unknown program API action: " + action);

  } catch (err) {
    if (err instanceof DomainError) {
      return createAppResponse(false, null, err, requestId);
    }
    return createAppResponse(false, null, new PersistenceError(err.message || String(err)), requestId);
  }
}

/**
 * Serialization Boundary Helpers (FAIL-CLOSED logic, no static fallback)
 */
function serializeProgramPayload(detailObj) {
  try {
    if (detailObj === undefined || detailObj === null) {
      throw new Error("Detail payload is null or undefined");
    }
    return JSON.stringify(detailObj);
  } catch (err) {
    throw new SerializationError("Failed to serialize program detail object: " + err.message);
  }
}

function deserializeProgramPayload(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    throw new SerializationError("Cannot deserialize empty or non-string cell payload (Fail-Closed)");
  }
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Parsed payload is not an object");
    }
    return parsed;
  } catch (err) {
    throw new SerializationError("Cell JSON payload is corrupted or invalid (Fail-Closed): " + err.message);
  }
}

/**
 * Optimistic Concurrency Verification Helper
 */
function checkOptimisticVersion(storedVersion, expectedVersion) {
  const sVer = Number(storedVersion);
  const eVer = Number(expectedVersion);
  if (isNaN(sVer) || isNaN(eVer) || sVer !== eVer) {
    throw new ConcurrencyConflictError(
      `Optimistic concurrency version mismatch (stored: ${storedVersion}, expected: ${expectedVersion})`
    );
  }
  return sVer + 1;
}

// ============================================================================
// PROGRAM DATA SOURCE v2.0 — PHASE 4B-4: MIGRATION & SEEDING TOOLING
// Isolated Migration Engine with Extraction, Validation, Snapshot, Seeding,
// Re-read, Structural Reconciliation, Rollback, and Observability.
// (NO RUNTIME CUTOVER, NO AUTOMATIC EXECUTION ON PAGE LOAD/API REQUESTS).
// ============================================================================

/**
 * A. SOURCE EXTRACTION
 * Returns the exact canonical PROGRAM_DATA v1.0 records.
 */
function getCanonicalMigrationSource() {
  return [
    {
      id: "tahfidz-anak",
      name: "Pesantren Tahfidz Anak",
      badge: "Anak-Anak",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop",
      description: "Program khusus hafalan Al-Qur'an untuk anak-anak dengan metode seru dan menyenangkan.",
      highlights: [
        "Metode Muri-Q & Tajwid Aisyah",
        "Target 30 Juz Mutqin Usia Belia",
        "Pendampingan Pengasuh 24 Jam"
      ],
      detail: {
        tagline: "Mencetak Generasi Rabbani Berjiwa Qur'ani Sejak Dini",
        summary: "Program Pesantren Tahfidz Anak didesain khusus untuk membentuk karakter santri usia sekolah dasar agar mencintai Al-Qur'an melalui suasana belajar yang hangat, ramah anak, dan terstruktur. Fokus utama kami tidak hanya hafalan, tetapi juga pembentukan akhlakul karimah.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Dokumentasi Kegiatan Santri Tahfidz Anak PPTQ Asnawiyyah",
        keunggulan: [
          { title: "Metode Seru & Ramah Anak", desc: "Menghafal dengan pendekatan fun learning, muraja'ah bersama, dan metode visual audio yang efektif.", icon: "fa-heart", iconBg: "bg-red-50 text-red-600" },
          { title: "Target Mutqin 30 Juz", desc: "Kurikulum bertahap yang disesuaikan dengan kemampuan anak tanpa tekanan psikologis berlebih.", icon: "fa-book-quran", iconBg: "bg-emerald-50 text-emerald-600" },
          { title: "Fasilitas Khusus Anak", desc: "Kamar tidur ber-AC, tempat bermain edukatif, serta asupan gizi seimbang untuk tumbuh kembang.", icon: "fa-child", iconBg: "bg-amber-50 text-amber-600" }
        ],
        targetOutput: [
          "Hafal 30 Juz Al-Qur'an dengan Tajwid & Makhraj yang Benar",
          "Memiliki Kebiasaan Shalat Fardhu & Sunnah Berjamaah",
          "Mampu Membaca Doa-Doa Harian & Adab Islama",
          "Karakter Mandiri, Disiplin, dan Santun kepada Orang Tua",
          "Khatam Ziyadah & Muraja'ah Rutin Setiap Pekan",
          "Berprestasi dalam Musabaqah Hifdzil Qur'an (MHQ)"
        ],
        gallery: [
          { image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop", caption: "Setoran Hafalan Pagi Bersama Ustadz", sliderId: "anak-1" },
          { image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", caption: "Kegiatan Olahraga & Edukasi Luar Ruangan", sliderId: "anak-2" },
          { image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop", caption: "Suasana Asrama yang Nyaman & Bersih", sliderId: "anak-3" }
        ],
        fasilitas: [
          { text: "Gedung Asrama AC & Kasur Busa Berkualitas", icon: "fa-bed", iconColor: "text-emerald-600" },
          { text: "Makan 3x Sehari Menu Seimbang & Higienis", icon: "fa-utensils", iconColor: "text-amber-600" },
          { text: "Klinik Poskestren & Layanan Kesehatan Santri", icon: "fa-notes-medical", iconColor: "text-blue-600" }
        ],
        prosedur: {
          items: [
            { step: "01", title: "Pendaftaran Online", desc: "Mengisi formulir calon santri melalui situs resmi PPDB." },
            { step: "02", title: "Tes Pemetaan (Observasi)", desc: "Tes kelancaran membaca Al-Qur'an dan wawancara orang tua." },
            { step: "03", title: "Pengumuman Hasil", desc: "Pengumuman kelulusan melalui WhatsApp & Akun PPDB." },
            { step: "04", title: "Daftar Ulang & Masuk Asrama", desc: "Penyelesaian administrasi dan kedatangan santri baru." }
          ],
          image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop",
          imageAlt: "Prosedur PPDB Asnawiyyah"
        },
        persyaratan: [
          { title: "Berusia 7 - 12 Tahun", desc: "Lulus atau sedang menempuh tingkat SD/MI sederajat.", icon: "fa-cake-candles" },
          { title: "Fotokopi Akta & KK", desc: "Menyerahkan dokumen administrasi kependudukan lengkap 2 lembar.", icon: "fa-file-lines" },
          { title: "Pas Foto Terbaru", desc: "Foto berwarna 3x4 sebanyak 4 lembar berlatar biru.", icon: "fa-image" },
          { title: "Surat Sehat Dokter", desc: "Bebas dari penyakit menular atau kondisi kronis tertentu.", icon: "fa-file-medical" }
        ],
        biaya: {
          pendaftaran: { nominal: "Rp 250.000", note: "Sekali saat pendaftaran" },
          syahriyah: { nominal: "Rp 1.200.000", note: "Per bulan (Asrama + Makan + Pendidikan)" }
        },
        cta: {
          title: "Ingin Anak Anda Hafal Al-Qur'an Sejak Dini?",
          description: "Segera daftarkan putra/putri Anda. Kuota terbatas untuk 30 santri baru setiap angkatan.",
          waLink: "https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20Program%20Tahfidz%20Anak",
          waBtnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
          waText: "Konsultasi PPDB via WhatsApp"
        }
      }
    },
    {
      id: "dewasa-putra",
      name: "Pesantren Dewasa Putra",
      badge: "Dewasa Putra",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop",
      description: "Program intensif tahfidz dan pendalaman kitab kuning untuk santri dewasa putra.",
      highlights: [
        "Kombinasi Tahfidz & Dirasah Islamiyah",
        "Sanad Al-Qur'an s/d Rasulullah SAW",
        "Lingkungan Kondusif & Bebas Gadget"
      ],
      detail: {
        tagline: "Membentuk Huffazh Berwawasan Luas & Berakhlak Qur'ani",
        summary: "Program Dewasa Putra dirancang bagi lulusan SMP/SMA/Mahasiswa/Umum yang ingin fokus menghafal Al-Qur'an 30 Juz secara intensif disertai dengan pengusaan ilmu tajwid sanad, bahasa Arab dasar, dan pemahaman kitab-kitab turats (kitab kuning).",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Suasana Belajar & Setoran Santri Dewasa Putra",
        keunggulan: [
          { title: "Bimbingan Muqri' Bersanad", desc: "Diampu langsung oleh ustadz pengajar yang memiliki sanad Al-Qur'an muttashil.", icon: "fa-certificate", iconBg: "bg-emerald-50 text-emerald-600" },
          { title: "Kurikulum Terintegrasi", desc: "Perpaduan efisien antara program Ziyadah (hafalan baru), Muraja'ah, dan Kajian Fiqih/Nahwu.", icon: "fa-book", iconBg: "bg-blue-50 text-blue-600" },
          { title: "Disiplin & Kemandirian High-Level", desc: "Pola hidup terstruktur untuk melatih kedisiplinan, kepemimpinan, dan mental da'i.", icon: "fa-user-shield", iconBg: "bg-amber-50 text-amber-600" }
        ],
        targetOutput: [
          "Setoran 30 Juz Lulus Ujian Imtihan Sanad / Syahadah",
          "Menguasai Ilmu Tajwid Qira'at Imam 'Ashim Riwayat Hafsh",
          "Memahami Fiqih Ibadah Dasar & Bahasa Arab Praktis",
          "Kesiapan Menjadi Imam Masjid & Pengajar Al-Qur'an",
          "Tradisi Muraja'ah Mandiri Minimal 1-2 Juz Per Hari",
          "Karakter Beradab, Tawadhu, dan Berjiwa Kepemimpinan"
        ],
        gallery: [
          { image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop", caption: "Halaqah Tahfidz Pagi di Masjid Utama", sliderId: "putra-1" },
          { image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop", caption: "Kajian Kitab Kuning Bersama Pengasuh", sliderId: "putra-2" },
          { image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", caption: "Kegiatan Rihlah & Olahraga Sunnah", sliderId: "putra-3" }
        ],
        fasilitas: [
          { text: "Asrama Khusus Putra dengan Lemari & Kasur Mandiri", icon: "fa-building", iconColor: "text-emerald-600" },
          { text: "Masjid Utama 2 Lantai untuk Halaqah & Shalat", icon: "fa-mosque", iconColor: "text-blue-600" },
          { text: "Perpustakaan Kitab Turats & Ruang Baca", icon: "fa-book-open", iconColor: "text-amber-600" }
        ],
        prosedur: {
          items: [
            { step: "01", title: "Pendaftaran Online", desc: "Mengisi biodata diri dan memilih opsi program dewasa putra." },
            { step: "02", title: "Tes Tahsin & Al-Qur'an", desc: "Ujian kelancaran membaca Al-Qur'an secara virtual/luring." },
            { step: "03", title: "Wawancara Komitmen", desc: "Wawancara komitmen menghafal dan menaati tata tertib pesantren." },
            { step: "04", title: "Daftar Ulang", desc: "Penyelesaian administrasi dan orientasi kehidupan asrama." }
          ],
          image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
          imageAlt: "Prosedur PPDB Dewasa Putra"
        },
        persyaratan: [
          { title: "Usia Minimal 13 Tahun", desc: "Lulusan SMP/SMA/Mahasiswa/Umum yang bertekad kuat.", icon: "fa-user" },
          { title: "Lancar Membaca Al-Qur'an", desc: "Memiliki dasar tajwid & makhraj membaca Al-Qur'an yang cukup.", icon: "fa-book-quran" },
          { title: "Dokumen Identitas", desc: "Fotokopi KTP/Kartu Pelajar, KK, dan ijazah terakhir.", icon: "fa-id-card" },
          { title: "Surat Komitmen Waktu", desc: "Bersedia mengikuti seluruh rangkaian program tanpa gangguan.", icon: "fa-clock" }
        ],
        biaya: {
          pendaftaran: { nominal: "Rp 300.000", note: "Sekali saat pendaftaran & tes" },
          syahriyah: { nominal: "Rp 1.100.000", note: "Per bulan (Asrama + Makan 3x + Bimbingan)" }
        },
        cta: {
          title: "Siap Menjadi Hafiz Al-Qur'an Berpendidikan & Bersanad?",
          description: "Segera daftarkan diri Anda atau putra Anda. Gelombang pendaftaran aktif dibuka.",
          waLink: "https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20Program%20Dewasa%20Putra",
          waBtnClass: "bg-blue-600 hover:bg-blue-700 text-white",
          waText: "Daftar Dewasa Putra via WA"
        }
      }
    },
    {
      id: "dewasa-putri",
      name: "Pesantren Dewasa Putri",
      badge: "Dewasa Putri",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop",
      description: "Program intensif tahfidz Al-Qur'an dan fiqih wanita untuk santri dewasa putri.",
      highlights: [
        "Asrama Khusus & Steril Khusus Putri",
        "Bimbingan Musyrifah Hafizhah Bersanad",
        "Kajian Nisa'iyyah & Keterampilan Muslimah"
      ],
      detail: {
        tagline: "Mencetak Haafizhah Shalihat, Pendidik Generasi Masa Depan",
        summary: "Program Dewasa Putri difokuskan untuk membantu mahasiswi/alumni/umum menghafal Al-Qur'an dalam lingkungan asrama putri yang sangat aman, privat, dan kondusif. Didampingi ustadzah haafizhah bersanad serta dibekali pemahaman fikih wanita.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoTitle: "Profil & Kegiatan Asrama Tahfidz Dewasa Putri",
        keunggulan: [
          { title: "Privasi & Keamanan Terjaga", desc: "Lingkungan kompleks putri terpisah penuh dengan sistem keamanan 24 jam.", icon: "fa-lock", iconBg: "bg-rose-50 text-rose-600" },
          { title: "Musyrifah Pengajar Khusus Putri", desc: "Halaqah setoran dan muraja'ah diampu oleh ustadzah lulusan Al-Azhar & Pesantren Sanad.", icon: "fa-user-graduate", iconBg: "bg-purple-50 text-purple-600" },
          { title: "Kajian Fiqih An-Nisa'", desc: "Kajian rutin hukum-hukum wanita, kepengurusan rumah tangga muslimah, & adab.", icon: "fa-hands-praying", iconBg: "bg-emerald-50 text-emerald-600" }
        ],
        targetOutput: [
          "Khatam Hafalan 30 Juz Lulus Syahadah & Ujian Ziyadah",
          "Pemahaman Tajwid Rasm Utsmani & Fiqih Wanita (Fiqh An-Nisa')",
          "Kebiasaan Ibadah Sunnah, Shalat Malam, & Dzikir Al-Ma'tsurat",
          "Keterampilan Tata Kelola Kebersihan, Tata Busana, & Adab",
          "Kemampuan Menjadi Pengajar Al-Qur'an di Rumah / Lembaga",
          "Karakter Anggun, Guarded, dan Berilmu Syar'i"
        ],
        gallery: [
          { image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", caption: "Halaqah Setoran Putri Bersama Ustadzah", sliderId: "putri-1" },
          { image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop", caption: "Kajian Rutin Fiqih Wanita di Aula Putri", sliderId: "putri-2" },
          { image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop", caption: "Taman Asrama Putri yang Asri", sliderId: "putri-3" }
        ],
        fasilitas: [
          { text: "Asrama Putri Privat Khusus Ber-AC & Kamar Mandi Dalam", icon: "fa-house-lock", iconColor: "text-purple-600" },
          { text: "Dapur Mandiri & Katering Pilihan Sehat", icon: "fa-utensils", iconColor: "text-rose-600" },
          { text: "Aula Pertemuan & Ruang Belajar Nyaman", icon: "fa-chair", iconColor: "text-emerald-600" }
        ],
        prosedur: {
          items: [
            { step: "01", title: "Pendaftaran Online", desc: "Mengisi formulir calon santri putri di portal PPDB." },
            { step: "02", title: "Tes Tahsin Virtual", desc: "Ujian kelancaran membaca Al-Qur'an oleh Tim Ustadzah." },
            { step: "03", title: "Wawancara Orang Tua/Wali", desc: "Wawancara kesiapan serta komitmen asrama." },
            { step: "04", title: "Masuk Asrama Putri", desc: "Penyelesaian registrasi dan penempatan kamar." }
          ],
          image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
          imageAlt: "Prosedur PPDB Dewasa Putri"
        },
        persyaratan: [
          { title: "Usia Minimal 13 Tahun", desc: "SMP/SMA/Mahasiswi/Umum yang berkeinginan kuat.", icon: "fa-user" },
          { title: "Lancar Membaca Al-Qur'an", desc: "Memiliki dasar tajwid membaca Al-Qur'an yang baik.", icon: "fa-book-quran" },
          { title: "Dokumen Administrasi", desc: "Fotokopi KTP/KK/Kartu Pelajar & Pas Foto Jilbab Rapi.", icon: "fa-file-lines" },
          { title: "Izin Orang Tua/Suami", desc: "Mendapat persetujuan tertulis dari wali resmi.", icon: "fa-file-signature" }
        ],
        biaya: {
          pendaftaran: { nominal: "Rp 300.000", note: "Sekali saat pendaftaran & tes" },
          syahriyah: { nominal: "Rp 1.150.000", note: "Per bulan (Asrama AC + Makan 3x + Bimbingan)" }
        },
        cta: {
          title: "Wujudkan Cita-Cita Menjadi Haafizhah Qur'an?",
          description: "Daftarkan diri Anda di Pesantren Dewasa Putri PPTQ Asnawiyyah.",
          waLink: "https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20tentang%20Program%20Dewasa%20Putri",
          waBtnClass: "bg-purple-600 hover:bg-purple-700 text-white",
          waText: "Daftar Dewasa Putri via WA"
        }
      }
    }
  ];
}

/**
 * B. CONTRACT VALIDATION
 * Validates source objects against the PROGRAM DATA CONTRACT.
 * Throws ValidationError if any required field or nested structure is invalid.
 */
function validateMigrationSource(sourceArray) {
  if (!Array.isArray(sourceArray) || sourceArray.length === 0) {
    throw new ValidationError("Migration source array is empty or invalid.");
  }

  const seenIds = new Set();
  const requiredTopFields = ["id", "name", "badge", "image", "description", "highlights", "detail"];

  for (let idx = 0; idx < sourceArray.length; idx++) {
    const item = sourceArray[idx];
    if (!item || typeof item !== "object") {
      throw new ValidationError(`Source item at index ${idx} is not an object.`);
    }

    // Top-level field validation
    for (let f of requiredTopFields) {
      if (item[f] === undefined || item[f] === null || item[f] === "") {
        throw new ValidationError(`Source item '${item.id || idx}' missing required top-level field '${f}'.`);
      }
    }

    // ID Uniqueness Check
    if (seenIds.has(item.id)) {
      throw new ValidationError(`Duplicate canonical program ID '${item.id}' detected in migration source.`);
    }
    seenIds.add(item.id);

    // Highlights array check
    if (!Array.isArray(item.highlights) || item.highlights.length === 0) {
      throw new ValidationError(`Source program '${item.id}' must have a non-empty highlights array.`);
    }

    // Nested Detail structure check
    const d = item.detail;
    if (!d || typeof d !== "object") {
      throw new ValidationError(`Source program '${item.id}' detail payload is invalid.`);
    }

    const requiredDetailFields = [
      "tagline", "summary", "video", "videoTitle",
      "keunggulan", "targetOutput", "gallery", "fasilitas",
      "prosedur", "persyaratan", "biaya", "cta"
    ];

    for (let df of requiredDetailFields) {
      if (d[df] === undefined || d[df] === null) {
        throw new ValidationError(`Source program '${item.id}' detail payload missing field '${df}'.`);
      }
    }

    // Check nested arrays & objects
    if (!Array.isArray(d.keunggulan) || d.keunggulan.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.keunggulan must be non-empty array.`);
    }
    if (!Array.isArray(d.targetOutput) || d.targetOutput.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.targetOutput must be non-empty array.`);
    }
    if (!Array.isArray(d.gallery) || d.gallery.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.gallery must be non-empty array.`);
    }
    if (!Array.isArray(d.fasilitas) || d.fasilitas.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.fasilitas must be non-empty array.`);
    }
    if (!d.prosedur || !Array.isArray(d.prosedur.items) || d.prosedur.items.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.prosedur.items must be non-empty array.`);
    }
    if (!Array.isArray(d.persyaratan) || d.persyaratan.length === 0) {
      throw new ValidationError(`Source program '${item.id}' detail.persyaratan must be non-empty array.`);
    }
    if (!d.biaya || !d.biaya.pendaftaran || !d.biaya.syahriyah) {
      throw new ValidationError(`Source program '${item.id}' detail.biaya must contain pendaftaran and syahriyah objects.`);
    }
    if (!d.cta || !d.cta.title || !d.cta.waLink) {
      throw new ValidationError(`Source program '${item.id}' detail.cta must contain title and waLink.`);
    }
  }

  return true;
}

/**
 * C. SNAPSHOT / BACKUP
 * Creates an in-memory or tab backup of the existing Programs sheet state.
 */
function createMigrationSnapshot(sheetName = "Programs") {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new PersistenceError("SpreadsheetApp is unavailable for migration snapshot: " + e.message);
  }

  const sheet = ss ? ss.getSheetByName(sheetName) : null;
  if (!sheet) {
    return Object.freeze({
      exists: false,
      sheetName: sheetName,
      rows: []
    });
  }

  const data = sheet.getDataRange().getValues();
  // Deep clone row values array
  const clonedRows = JSON.parse(JSON.stringify(data));

  return Object.freeze({
    exists: true,
    sheetName: sheetName,
    rows: clonedRows
  });
}

/**
 * D. SHEET PREPARATION
 * Prepares the Programs sheet and validates/creates the 16-column header schema.
 * Note: Sheet creation is authorized ONLY within explicit migration tooling.
 */
function prepareProgramsSheet(sheetName = "Programs", options = { dryRun: false }) {
  if (options && options.dryRun) {
    Logger.log("[DRY-RUN] [SHEET_PREPARED] Would discover/create sheet '" + sheetName + "'");
    return true;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new PersistenceError("Active spreadsheet unavailable.");
  }

  let sheet = ss.getSheetByName(sheetName);
  const expectedHeaders = [
    "id", "name", "badge", "image", "description",
    "highlights_json", "detail_json", "status", "sort_order",
    "created_at", "updated_at", "created_by", "updated_by",
    "published_at", "published_by", "version"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(expectedHeaders);
  } else {
    const values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      sheet.appendRow(expectedHeaders);
    } else {
      const headerRow = values[0];
      if (headerRow.length < expectedHeaders.length) {
        throw new PersistenceError(`Existing sheet '${sheetName}' header schema mismatch (fewer than 16 columns).`);
      }
    }
  }

  return sheet;
}

/**
 * E. CONTROLLED SEEDING
 * Writes canonical source records into the Programs sheet.
 */
function seedProgramsData(sourceArray, options = { dryRun: false, force: false }, sheetName = "Programs") {
  if (options && options.dryRun) {
    Logger.log("[DRY-RUN] [SEED_STARTED] Would seed " + sourceArray.length + " canonical records into '" + sheetName + "'");
    return true;
  }

  const sheet = prepareProgramsSheet(sheetName, options);
  const existingValues = sheet.getDataRange().getValues();
  const existingIds = new Set();

  for (let r = 1; r < existingValues.length; r++) {
    if (existingValues[r][0]) {
      existingIds.add(String(existingValues[r][0]).trim());
    }
  }

  // Idempotency check: if IDs already exist and force is false, reject
  const duplicateIds = sourceArray.filter(item => existingIds.has(item.id));
  if (duplicateIds.length > 0 && !(options && options.force)) {
    throw new PersistenceError(
      "Migration idempotency conflict: canonical ID(s) [" + duplicateIds.map(d => d.id).join(", ") + "] already exist in sheet. Use force=true to overwrite."
    );
  }

  const nowIso = new Date().toISOString();
  const migrationIdentity = "migration:v2.0";

  for (let idx = 0; idx < sourceArray.length; idx++) {
    const item = sourceArray[idx];
    const sortOrder = idx + 1;
    const highlightsJson = serializeProgramPayload(item.highlights);
    const detailJson = serializeProgramPayload(item.detail);

    const rowData = [
      item.id,
      item.name,
      item.badge,
      item.image,
      item.description,
      highlightsJson,
      detailJson,
      ProgramStatus.PUBLISHED, // Initial status = "published"
      sortOrder,
      nowIso,
      nowIso,
      migrationIdentity,
      migrationIdentity,
      nowIso,
      migrationIdentity,
      1 // Initial version = 1
    ];

    // Check if updating existing or appending new
    let targetRowIdx = -1;
    for (let r = 1; r < existingValues.length; r++) {
      if (String(existingValues[r][0]).trim() === item.id) {
        targetRowIdx = r + 1;
        break;
      }
    }

    if (targetRowIdx > 0) {
      sheet.getRange(targetRowIdx, 1, 1, 16).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
  }

  return true;
}

/**
 * F. RE-READ VERIFICATION
 * Reads back persisted rows via GoogleSheetsProgramAdapter and deserializes cell JSON.
 */
function verifySeededRecords(sheetName = "Programs") {
  const adapter = new GoogleSheetsProgramAdapter(sheetName);
  const persistedRecords = adapter.findAll();
  return persistedRecords;
}

/**
 * G. STRUCTURAL RECONCILIATION
 * Deep structural comparison of all canonical content fields between source and re-read persisted objects.
 * Throws ValidationError if any property mismatches.
 */
function reconcileMigrationData(sourceArray, persistedArray) {
  if (!Array.isArray(persistedArray) || persistedArray.length < sourceArray.length) {
    throw new ValidationError(
      `Reconciliation failed: expected at least ${sourceArray.length} records, but re-read ${persistedArray ? persistedArray.length : 0} records.`
    );
  }

  const persistedMap = new Map();
  persistedArray.forEach(rec => persistedMap.set(rec.id, rec));

  const compareKeys = [
    "id", "name", "badge", "image", "description"
  ];

  for (let source of sourceArray) {
    const target = persistedMap.get(source.id);
    if (!target) {
      throw new ValidationError(`Reconciliation failed: record ID '${source.id}' not found in re-read persisted data.`);
    }

    // Top level scalar comparison
    for (let key of compareKeys) {
      if (String(source[key]).trim() !== String(target[key]).trim()) {
        throw new ValidationError(`Reconciliation mismatch on '${source.id}.${key}': source='${source[key]}', persisted='${target[key]}'.`);
      }
    }

    // Highlights array structural comparison
    if (JSON.stringify(source.highlights) !== JSON.stringify(target.highlights)) {
      throw new ValidationError(`Reconciliation mismatch on '${source.id}.highlights': JSON payload differs.`);
    }

    // Detail object deep structural comparison
    if (JSON.stringify(source.detail) !== JSON.stringify(target.detail)) {
      throw new ValidationError(`Reconciliation mismatch on '${source.id}.detail': JSON payload differs.`);
    }
  }

  return true;
}

/**
 * H. ROLLBACK CAPABILITY
 * Restores the Programs sheet to the exact state saved in the snapshot.
 */
function rollbackMigration(snapshot, sheetName = "Programs") {
  let ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new PersistenceError("SpreadsheetApp unavailable for rollback: " + e.message);
  }

  if (!ss) throw new PersistenceError("Spreadsheet object null during rollback.");

  const sheet = ss.getSheetByName(sheetName);

  if (!snapshot || !snapshot.exists) {
    // If sheet didn't exist before migration, clear or delete sheet
    if (sheet) {
      sheet.clear();
    }
  } else {
    // Restore exact snapshot rows
    if (sheet) {
      sheet.clear();
      if (snapshot.rows && snapshot.rows.length > 0) {
        sheet.getRange(1, 1, snapshot.rows.length, snapshot.rows[0].length).setValues(snapshot.rows);
      }
    }
  }

  Logger.log("[ROLLBACK_COMPLETED] Sheet '" + sheetName + "' successfully restored from pre-migration snapshot.");
  return true;
}

/**
 * MASTER MIGRATION TOOLING ORCHESTRATOR
 * Controlled explicit tool execution with dry-run, validation, snapshot, seeding, reconciliation, and rollback.
 * (NO AUTOMATIC EXECUTION).
 */
function runMigrationTooling(options = { dryRun: false, force: false, sheetName: "Programs" }) {
  const migrationId = "migration:v2.0:" + new Date().getTime();
  const isDryRun = Boolean(options && options.dryRun);
  const sheetName = (options && options.sheetName) || "Programs";

  Logger.log(`[START] [${migrationId}] Mode: ${isDryRun ? "DRY-RUN" : "EXECUTION"}`);

  let snapshot = null;
  try {
    // 1. Source Extraction
    const sourceArray = getCanonicalMigrationSource();
    Logger.log(`[SOURCE_EXTRACTED] [${migrationId}] Loaded ${sourceArray.length} canonical records.`);

    // 2. Contract Validation
    validateMigrationSource(sourceArray);
    Logger.log(`[SOURCE_VALIDATED] [${migrationId}] All canonical records satisfy contract schema.`);

    if (isDryRun) {
      Logger.log(`[DRY-RUN] [COMPLETED] [${migrationId}] Validation PASS. No changes made.`);
      return {
        status: "DRY_RUN_PASSED",
        migrationId: migrationId,
        recordCount: sourceArray.length,
        message: "Dry-run validation successful. Zero database mutations performed."
      };
    }

    // 3. Snapshot / Backup
    snapshot = createMigrationSnapshot(sheetName);
    Logger.log(`[SNAPSHOT_CREATED] [${migrationId}] Pre-migration snapshot taken (Sheet exists: ${snapshot.exists}).`);

    // 4. Sheet Preparation
    prepareProgramsSheet(sheetName, options);
    Logger.log(`[SHEET_PREPARED] [${migrationId}] Sheet '${sheetName}' prepared.`);

    // 5. Seeding
    Logger.log(`[SEED_STARTED] [${migrationId}] Seeding ${sourceArray.length} records...`);
    seedProgramsData(sourceArray, options, sheetName);
    Logger.log(`[SEED_COMPLETED] [${migrationId}] Records written to sheet.`);

    // 6. Re-Read Verification
    Logger.log(`[RECONCILIATION_STARTED] [${migrationId}] Re-reading persisted records...`);
    const persistedArray = verifySeededRecords(sheetName);

    // 7. Structural Reconciliation
    reconcileMigrationData(sourceArray, persistedArray);
    Logger.log(`[RECONCILIATION_PASSED] [${migrationId}] Structural reconciliation 100% matched.`);

    Logger.log(`[MIGRATION_SUCCESS] [${migrationId}] Migration completed and verified successfully.`);
    return {
      status: "MIGRATION_SUCCESS",
      migrationId: migrationId,
      recordCount: sourceArray.length,
      message: "Migration completed, verified, and structurally reconciled with 100% precision."
    };

  } catch (err) {
    Logger.log(`[FAILED] [${migrationId}] Migration failed: ${err.message}`);

    if (snapshot && !isDryRun) {
      Logger.log(`[ROLLBACK_STARTED] [${migrationId}] Initiating automated rollback...`);
      try {
        rollbackMigration(snapshot, sheetName);
        return {
          status: "MIGRATION_FAILED_ROLLED_BACK",
          migrationId: migrationId,
          error: err.message,
          message: "Migration failed during execution. Pre-migration state was successfully restored."
        };
      } catch (rbErr) {
        Logger.log(`[ROLLBACK_ERROR] [${migrationId}] Critical: Rollback failed: ${rbErr.message}`);
        return {
          status: "MIGRATION_FAILED_ROLLBACK_ERROR",
          migrationId: migrationId,
          error: err.message,
          rollbackError: rbErr.message,
          message: "CRITICAL: Migration failed and rollback encountered an error."
        };
      }
    }

    return {
      status: "MIGRATION_FAILED_PRE_MUTATION",
      migrationId: migrationId,
      error: err.message,
      message: "Migration failed during validation before any sheet mutation occurred."
    };
  }
}
// ==================== PENGELOLAAN ALUMNI ====================
function saveAlumniData(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ALUMNI_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(ALUMNI_SHEET_NAME);
      const headers = [
        "Timestamp", "Nama Lengkap", "Jenis Kelamin", "No WhatsApp", "Media Sosial",
        "Tahun Masuk", "Tahun Lulus", "Program Terakhir", "Kesibukan", "Instansi/Perusahaan",
        "Kesan & Pesan", "Provinsi", "Kabupaten", "Kecamatan", "Desa/Kelurahan", "Alamat Lengkap", "Latitude", "Longitude",
        "Foto", "Izin Publikasi"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
    } else {
        const lastCol = sheet.getLastColumn();
        if (lastCol > 0) {
            const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
            if (currentHeaders.indexOf("Foto") === -1) {
                sheet.getRange(1, lastCol + 1).setValue("Foto").setFontWeight("bold").setBackground("#dcfce7");
                sheet.getRange(1, lastCol + 2).setValue("Izin Publikasi").setFontWeight("bold").setBackground("#dcfce7");
            }
        }
    }
    
    let fileUrl = "";
    if (payload.file && payload.file.base64) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decodedData = Utilities.base64Decode(payload.file.base64);
      const blob = Utilities.newBlob(
        decodedData, 
        payload.file.mimeType, 
        "ALUMNI_" + new Date().getTime() + "_" + payload.file.name
      );
      const newFile = folder.createFile(blob);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    }

    const timestamp = new Date();
    const row = [
      timestamp,
      payload.nama || "",
      payload.jk || "",
      payload.wa || "",
      payload.medsos || "",
      payload.masuk || "",
      payload.lulus || "",
      payload.program || "",
      payload.kesibukan || "",
      payload.instansi || "",
      payload.kesan || "",
      payload.provinsi || "",
        payload.kabupaten || "",
        payload.kecamatan || "",
        payload.desa || "",
        payload.alamat || "",
        payload.lat || "",
        payload.lng || "",
        fileUrl,
        payload.izin || ""
      ];
    
    sheet.appendRow(row);
    return { success: true, message: "Data alumni berhasil disimpan." };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}


function getAlumniTestimonials() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ALUMNI_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // Only headers

    const headers = data[0];
    const idxNama = headers.indexOf("Nama Lengkap");
    const idxMasuk = headers.indexOf("Tahun Masuk");
    const idxLulus = headers.indexOf("Tahun Lulus");
    const idxProgram = headers.indexOf("Program Terakhir");
    const idxKesibukan = headers.indexOf("Kesibukan");
    const idxInstansi = headers.indexOf("Instansi/Perusahaan");
    const idxKesan = headers.indexOf("Kesan & Pesan");
    const idxFoto = headers.indexOf("Foto");
    const idxIzin = headers.indexOf("Izin Publikasi");

    if (idxIzin === -1 || idxKesan === -1 || idxNama === -1) return [];

    let results = [];
    
    // Loop backwards to get latest first
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const izin = row[idxIzin] ? String(row[idxIzin]).trim() : "";
      const kesan = row[idxKesan] ? String(row[idxKesan]).trim() : "";

      if (izin === "Ya" && kesan !== "") {
        results.push({
          nama: String(row[idxNama] || ""),
          tahunMasuk: String(row[idxMasuk] || ""),
          tahunLulus: String(row[idxLulus] || ""),
          program: String(row[idxProgram] || ""),
          kesibukan: String(row[idxKesibukan] || ""),
          instansi: String(row[idxInstansi] || ""),
          kesan: kesan,
          foto: (idxFoto !== -1) ? String(row[idxFoto] || "") : ""
        });

        if (results.length >= 5) {
          break; // Max 5 testimonials
        }
      }
    }

    return results;
  } catch (e) {
    return [];
  }
}

// ==========================================
// BUSINESS LOGIC: AUTHENTICATION
// ==========================================

// ==========================================
// BUSINESS LOGIC: AUTHENTICATION (SECURED)
// ==========================================

const SHEET_USERS = "Users";
const SHEET_OTP = "OTP_Cache";

/**
 * Hash password menggunakan SHA-256 dengan Salt Server
 */
function hashPassword(password) {
  const salt = getServerSecret("PASSWORD_SALT", "ASNAWIYYAH_SALT_2026_SECURE");
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + salt, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * Verifikasi password dengan dukungan migrasi backward-compatibility
 */
function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;
  // Backward compatibility untuk data lama yang sempat tersimpan plain-text
  if (storedPassword === inputPassword) return true;
  return hashPassword(inputPassword) === storedPassword;
}

function handleRequestOTP(data) {
  const email = data.email ? data.email.toLowerCase().trim() : '';
  if (!email) return { success: false, message: "Email wajib diisi" };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiryTime = new Date(new Date().getTime() + 5 * 60000); 

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_OTP);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_OTP);
    sheet.appendRow(["Email", "OTP", "Expiry", "Timestamp"]);
  }

  sheet.appendRow([email, otp, expiryTime.toISOString(), new Date().toISOString()]);

  const subject = "Kode Verifikasi Login - PPTQ Asnawiyyah";
  const body = `Halo,\n\nKode verifikasi Anda adalah: ${otp}\n\nKode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.\n\nTerima kasih,\nTim PPTQ Asnawiyyah`;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });

  return { success: true, message: "OTP berhasil dikirim ke email." };
}

function handleVerifyOTP(data) {
  const email = data.email ? data.email.toLowerCase().trim() : '';
  const otp = data.otp;
  const password = data.password;
  
  if (!email || !otp || !password) return { success: false, message: "Email, OTP, dan Password wajib diisi" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const otpSheet = ss.getSheetByName(SHEET_OTP);
  if (!otpSheet) return { success: false, message: "Sistem belum siap (Sheet OTP tidak ditemukan)" };

  const otpData = otpSheet.getDataRange().getValues();
  let valid = false;

  for (let i = otpData.length - 1; i > 0; i--) {
    if (otpData[i][0] === email) {
      const storedOtp = otpData[i][1].toString();
      const expiry = new Date(otpData[i][2]);
      
      if (storedOtp === otp.toString()) {
        if (new Date() > expiry) {
          return { success: false, message: "Kode OTP sudah kadaluarsa. Silakan minta kode baru." };
        }
        valid = true;
        break;
      } else {
        return { success: false, message: "Kode OTP salah." };
      }
    }
  }

  if (!valid) return { success: false, message: "Kode OTP tidak ditemukan atau salah." };

  let userSheet = ss.getSheetByName(SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_USERS);
    userSheet.appendRow(["ID", "Email", "Password", "Nama", "Telepon", "Metode_Login", "Dibuat_Pada"]);
  }

  const usersData = userSheet.getDataRange().getValues();
  let userExists = false;
  let userName = "Santri / Alumni";
  const hashedPassword = hashPassword(password);

  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === email) {
      userExists = true;
      userName = usersData[i][3] || userName;
      userSheet.getRange(i + 1, 3).setValue(hashedPassword);
      break;
    }
  }

  if (!userExists) {
    const newId = "USR_" + new Date().getTime();
    userSheet.appendRow([newId, email, hashedPassword, "Santri / Alumni", "", "Email", new Date().toISOString()]);
  }

  const tokenData = generateSessionToken(email, "user", 24 * 30);

  return { 
    success: true, 
    message: "Verifikasi berhasil.",
    token: tokenData.token,
    user: { email: email, name: userName }
  };
}

function handleLogin(data) {
  const email = data.email ? data.email.toLowerCase().trim() : '';
  const password = data.password;

  if (!email || !password) return { success: false, message: "Email dan Password wajib diisi" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(SHEET_USERS);
  if (!userSheet) return { success: false, message: "Belum ada pengguna terdaftar." };

  const usersData = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === email) {
      const storedPassword = usersData[i][2];
      if (verifyPassword(password, storedPassword)) {
        // Upgrade password plain-text menjadi hash secara otomatis jika ditemukan format lama
        if (storedPassword === password) {
          userSheet.getRange(i + 1, 3).setValue(hashPassword(password));
        }
        const tokenData = generateSessionToken(email, "user", 24 * 30);
        return {
          success: true,
          message: "Login berhasil",
          token: tokenData.token,
          user: {
            email: email,
            name: usersData[i][3] || "Pengguna",
            phone: usersData[i][4] || ""
          }
        };
      } else {
        return { success: false, message: "Password salah" };
      }
    }
  }

  return { success: false, message: "Email belum terdaftar. Silakan daftar menggunakan OTP." };
}

function handleGoogleLogin(data) {
  let email = data.email ? data.email.toLowerCase().trim() : '';
  let name = data.name || "Pengguna Google";

  // Verifikasi Google ID Token jika credential disertakan
  if (data.credential) {
    try {
      const googleVerifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(data.credential);
      const res = UrlFetchApp.fetch(googleVerifyUrl, { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const tokenInfo = JSON.parse(res.getContentText());
        if (tokenInfo && tokenInfo.email) {
          email = tokenInfo.email.toLowerCase().trim();
          name = tokenInfo.name || name;
        }
      } else {
        return { success: false, message: "Token autentikasi Google tidak valid atau kedaluwarsa." };
      }
    } catch (err) {
      console.warn("Gagal menghubungi Google OAuth tokeninfo:", err);
    }
  }

  if (!email) return { success: false, message: "Data Google tidak valid (Email kosong)" };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName(SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_USERS);
    userSheet.appendRow(["ID", "Email", "Password", "Nama", "Telepon", "Metode_Login", "Dibuat_Pada"]);
  }

  const usersData = userSheet.getDataRange().getValues();
  let userExists = false;
  let storedName = name;
  let phone = "";

  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === email) {
      userExists = true;
      storedName = usersData[i][3] || name;
      phone = usersData[i][4] || "";
      break;
    }
  }

  if (!userExists) {
    const newId = "USR_" + new Date().getTime();
    userSheet.appendRow([newId, email, "OAUTH_GOOGLE", name, "", "Google", new Date().toISOString()]);
  }

  const tokenData = generateSessionToken(email, "user", 24 * 30);

  return {
    success: true,
    message: "Google Login berhasil",
    token: tokenData.token,
    user: {
      email: email,
      name: storedName,
      phone: phone
    }
  };
}


// =====================================================================
// BACKEND IDENTITY & AUTHENTICATION ARCHITECTURE v2.0 (PHASE 2B)
// =====================================================================

const SHEET_ADMIN_IDENTITIES = "Admin_Identities";
const SHEET_WALI_IDENTITIES = "Wali_Identities";
const SHEET_STUDENTS = "Students";
const SHEET_WALI_SANTRI_MAP = "Wali_Santri_Map";
const SHEET_OTP_CHALLENGES = "OTP_Challenges";
const SHEET_AUTH_SESSIONS = "Auth_Sessions";
const SHEET_AUTH_AUDIT_LOG = "Auth_Audit_Log";

const RELATIONSHIP_ENUM = Object.freeze({
  FATHER: "FATHER",
  MOTHER: "MOTHER",
  GUARDIAN: "GUARDIAN",
  OTHER: "OTHER"
});

/**
 * Inisialisasi Otomatis Tabel-tabel Autentikasi Phase 2B jika belum ada.
 */
function setupAuthSystemSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = [
    {
      name: SHEET_ADMIN_IDENTITIES,
      headers: ["identity_id", "email", "name", "role", "status", "created_at"]
    },
    {
      name: SHEET_WALI_IDENTITIES,
      headers: ["identity_id", "email", "phone", "name", "role", "status", "created_at"]
    },
    {
      name: SHEET_STUDENTS,
      headers: ["student_id", "nisn", "name", "program", "class_name", "status", "created_at"]
    },
    {
      name: SHEET_WALI_SANTRI_MAP,
      headers: ["map_id", "wali_id", "student_id", "relationship", "status", "created_at"]
    },
    {
      name: SHEET_OTP_CHALLENGES,
      headers: ["challenge_id", "identity_id", "channel", "identifier_hash", "otp_hash", "attempts", "max_attempts", "expires_at", "status", "created_at", "consumed_at", "request_id"]
    },
    {
      name: SHEET_AUTH_SESSIONS,
      headers: ["session_id", "identity_id", "role", "issued_at", "expires_at", "status", "revoked_at", "created_at", "token_version"]
    },
    {
      name: SHEET_AUTH_AUDIT_LOG,
      headers: ["event_id", "timestamp", "event_type", "identity_id", "session_id", "channel", "success", "request_id", "metadata"]
    }
  ];

  defs.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      sheet.getRange(1, 1, 1, def.headers.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      Logger.log(`[SCHEMA] Sheet '${def.name}' berhasil dibuat.`);
    }
  });

  return { status: "success", message: "Tabel autentikasi Phase 2B siap digunakan." };
}

/**
 * Concurrency Lock Wrapper menggunakan LockService
 */
function withAuthScriptLock(callback, timeoutMs = 10000) {
  const lock = LockService.getScriptLock();
  const acquired = lock.tryLock(timeoutMs);
  if (!acquired) {
    throw new Error("Server sibuk memproses antrean keamanan. Silakan coba beberapa saat lagi.");
  }
  try {
    return callback();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      console.warn("Gagal melepaskan script lock:", e);
    }
  }
}

/**
 * Unbiased Rejection Sampling OTP Generator
 * Menggunakan Utilities.getUuid() untuk menjamin entropy tanpa Math.random() dan tanpa modulo bias.
 */
function generateSecureOtpDigits() {
  const MAX_UNBIASED = 4294800000; // 4772 * 900000
  while (true) {
    const rawUuid = Utilities.getUuid().replace(/-/g, "");
    const hex8 = rawUuid.substring(0, 8);
    const intVal = parseInt(hex8, 16);
    if (!isNaN(intVal) && intVal < MAX_UNBIASED) {
      const num = (intVal % 900000) + 100000;
      return String(num);
    }
  }
}

function hashOtpCode(otpCode) {
  const salt = getServerSecret("OTP_HASH_SECRET", getServerSecret("PASSWORD_SALT", "ASNAWIYYAH_SALT_2026_SECURE"));
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(otpCode) + salt, Utilities.Charset.UTF_8);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function hashIdentifier(identifier) {
  const secret = getServerSecret("IDENTIFIER_HASH_SECRET", getServerSecret("PASSWORD_SALT", "ASNAWIYYAH_IDENTIFIER_SALT_2026"));
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(identifier).trim().toLowerCase() + secret, Utilities.Charset.UTF_8);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

/**
 * P1 Audit Log Writer
 * Dilarang menyimpan plaintext OTP, password, API key, atau token lengkap.
 */
/**
 * P1 Audit Log Writer
 * Dilarang menyimpan plaintext OTP, password, API key, atau token lengkap.
 */
function writeAuthAuditLog(eventType, identityId, sessionId, channel, success, requestId, metadataObj = {}) {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = getAuthSheet(ss, SHEET_AUTH_AUDIT_LOG);
    if (!sheet) {
      console.warn("[SECURITY AUDIT] Sheet 'Auth_Audit_Log' belum diinisialisasi oleh administrator.");
      return;
    }

    const eventId = "EVT_" + Utilities.getUuid().replace(/-/g, "").substring(0, 16);
    const timestamp = new Date().toISOString();
    const safeMetadata = JSON.stringify(metadataObj || {});

    sheet.appendRow([
      eventId,
      timestamp,
      String(eventType || "UNKNOWN"),
      String(identityId || "ANONYMOUS"),
      String(sessionId || ""),
      String(channel || "SYSTEM"),
      Boolean(success),
      String(requestId || ""),
      safeMetadata
    ]);
  } catch (err) {
    console.error("Gagal mencatat audit log:", err);
  }
}

/**
 * Dispatcher Pengiriman WhatsApp via Gateway Eksternal
 */
function sendWhatsAppOtpMessage(targetPhone, otpCode) {
  const gatewayUrl = getServerSecret("WA_GATEWAY_URL", "");
  const gatewayApiKey = getServerSecret("WA_GATEWAY_API_KEY", "");

  if (!gatewayUrl) {
    console.warn("[WA GATEWAY] WA_GATEWAY_URL belum dikonfigurasi di Script Properties.");
    return false;
  }

  const message = `*PPTQ Asnawiyyah Pilangwetan*\n\nKode verifikasi login Anda adalah: *${otpCode}*\n\nKode ini berlaku selama 5 menit. JANGAN berikan kode ini kepada siapapun demi keamanan data putra/putri Anda.`;

  const payload = {
    phone: targetPhone,
    message: message
  };

  const headers = {
    "Content-Type": "application/json"
  };
  if (gatewayApiKey) {
    headers["Authorization"] = "Bearer " + gatewayApiKey;
  }

  const options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(gatewayUrl, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return true;
    } else {
      console.warn("[WA GATEWAY] HTTP " + code + ": " + response.getContentText().substring(0, 100));
      return false;
    }
  } catch (err) {
    console.error("[WA GATEWAY ERROR]", err);
    return false;
  }
}

/**
 * Dispatcher Pengiriman Email OTP via Native MailApp
 */
function sendAdminOtpEmail(email, otpCode) {
  const subject = "Kode Verifikasi Login Administrator - PPTQ Asnawiyyah";
  const body = `Yth. Pengelola PPTQ Asnawiyyah,\n\nKode verifikasi 6-digit Anda adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit. Jangan membagikan kode ini kepada pihak lain demi menjaga keamanan sistem operasional pesantren.\n\nTerima kasih,\nTim Keamanan Sistem PPTQ Asnawiyyah`;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
  return true;
}

/**
 * Dispatcher Pengiriman Email OTP Wali Santri via Native MailApp (Phase 2B)
 */
function sendWaliOtpEmail(email, otpCode, name = "") {
  const subject = "Kode OTP Login Wali Santri — ASNawiyyah";
  const body = `Assalamu'alaikum,\n\nKode OTP Anda untuk login ke ASNawiyyah adalah: ${otpCode}\n\nKode ini berlaku selama 5 menit. Jangan berikan kode OTP ini kepada siapa pun.\n\nJika Anda tidak merasa melakukan permintaan login, abaikan email ini.\n\nASNawiyyah`;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
  return true;
}

// ==================== DATA ACCESS REPOSITORY LAYER ====================

/**
 * Helper Resolusi Database Spreadsheet
 * Mendukung override SPREADSHEET_ID eksplisit via Script Properties
 * dengan fallback aman ke getActiveSpreadsheet() kontainer bawaan.
 */
function getDatabaseSpreadsheet() {
  const explicitId = getServerSecret("SPREADSHEET_ID", "");
  if (explicitId) {
    try {
      return SpreadsheetApp.openById(explicitId);
    } catch (e) {
      console.warn("[DB] Gagal membuka spreadsheet eksplisit ID: " + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Helper Resolusi Sheet Tab Resilien (Toleran Spasi & Huruf Besar/Kecil)
 */
function getAuthSheet(ss, targetName) {
  if (!ss) return null;
  const direct = ss.getSheetByName(targetName);
  if (direct) return direct;

  const cleanTarget = String(targetName || "").replace(/[\s_]+/g, "").toLowerCase();
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName();
    if (name.trim().toLowerCase() === String(targetName).trim().toLowerCase() ||
        name.replace(/[\s_]+/g, "").toLowerCase() === cleanTarget) {
      return sheets[i];
    }
  }
  return null;
}

function getAdminIdentityByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_ADMIN_IDENTITIES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("identity_id");
  let emailIdx = header.indexOf("email");
  let nameIdx = header.indexOf("name");
  let roleIdx = header.indexOf("role");
  let statusIdx = header.indexOf("status");
  let createdAtIdx = header.indexOf("created_at");

  if (idIdx === -1) idIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (roleIdx === -1) roleIdx = 3;
  if (statusIdx === -1) statusIdx = 4;
  if (createdAtIdx === -1) createdAtIdx = 5;

  for (let i = 1; i < data.length; i++) {
    const rowEmail = String(data[i][emailIdx] || "").trim().toLowerCase();
    if (rowEmail === normalized) {
      return {
        identityId: String(data[i][idIdx] || ""),
        email: String(data[i][emailIdx] || ""),
        name: String(data[i][nameIdx] || ""),
        role: String(data[i][roleIdx] || "ADMIN"),
        status: String(data[i][statusIdx] || "").trim().toUpperCase(),
        createdAt: String(data[i][createdAtIdx] || "")
      };
    }
  }
  return null;
}

function getAdminIdentityById(identityId) {
  if (!identityId) return null;
  const targetId = String(identityId).trim();

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_ADMIN_IDENTITIES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("identity_id");
  let emailIdx = header.indexOf("email");
  let nameIdx = header.indexOf("name");
  let roleIdx = header.indexOf("role");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (roleIdx === -1) roleIdx = 3;
  if (statusIdx === -1) statusIdx = 4;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx] || "").trim() === targetId) {
      return {
        identityId: String(data[i][idIdx] || ""),
        email: String(data[i][emailIdx] || ""),
        name: String(data[i][nameIdx] || ""),
        role: String(data[i][roleIdx] || "ADMIN"),
        status: String(data[i][statusIdx] || "").trim().toUpperCase()
      };
    }
  }
  return null;
}

/**
 * Lookup Identitas Wali Santri berdasarkan Email (Phase 2B Active Path)
 */
function getWaliIdentityByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_WALI_IDENTITIES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("identity_id");
  let emailIdx = header.indexOf("email");
  let phoneIdx = header.indexOf("phone");
  let nameIdx = header.indexOf("name");
  let roleIdx = header.indexOf("role");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (phoneIdx === -1) phoneIdx = 2;
  if (nameIdx === -1) nameIdx = 3;
  if (roleIdx === -1) roleIdx = 4;
  if (statusIdx === -1) statusIdx = 5;

  for (let i = 1; i < data.length; i++) {
    const storedEmail = String(data[i][emailIdx] || "").trim().toLowerCase();
    if (storedEmail === normalized) {
      return {
        identityId: String(data[i][idIdx] || ""),
        email: storedEmail,
        phone: phoneIdx !== -1 ? String(data[i][phoneIdx] || "") : "",
        name: nameIdx !== -1 ? String(data[i][nameIdx] || "") : "",
        role: roleIdx !== -1 ? String(data[i][roleIdx] || "WALI_SANTRI") : "WALI_SANTRI",
        status: statusIdx !== -1 ? String(data[i][statusIdx] || "").trim().toUpperCase() : "ACTIVE"
      };
    }
  }
  return null;
}

/**
 * Lookup Identitas Wali Santri berdasarkan Phone (Retained as Future WhatsApp Capability)
 */
function getWaliIdentityByPhone(phone) {
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  const normalized = cleanPhone.startsWith("62") ? cleanPhone : cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : "62" + cleanPhone;

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_WALI_IDENTITIES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("identity_id");
  let emailIdx = header.indexOf("email");
  let phoneIdx = header.indexOf("phone");
  let nameIdx = header.indexOf("name");
  let roleIdx = header.indexOf("role");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (phoneIdx === -1) phoneIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (roleIdx === -1) roleIdx = 3;
  if (statusIdx === -1) statusIdx = 4;

  for (let i = 1; i < data.length; i++) {
    const storedPhone = String(data[i][phoneIdx] || "").replace(/[^0-9]/g, "");
    if (storedPhone === normalized) {
      return {
        identityId: String(data[i][idIdx] || ""),
        email: emailIdx !== -1 ? String(data[i][emailIdx] || "").trim().toLowerCase() : "",
        phone: String(data[i][phoneIdx] || ""),
        name: String(data[i][nameIdx] || ""),
        role: String(data[i][roleIdx] || "WALI_SANTRI"),
        status: String(data[i][statusIdx] || "").trim().toUpperCase()
      };
    }
  }
  return null;
}

function getWaliIdentityById(identityId) {
  if (!identityId) return null;
  const targetId = String(identityId).trim();

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_WALI_IDENTITIES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("identity_id");
  let emailIdx = header.indexOf("email");
  let phoneIdx = header.indexOf("phone");
  let nameIdx = header.indexOf("name");
  let roleIdx = header.indexOf("role");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (phoneIdx === -1) phoneIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (roleIdx === -1) roleIdx = 3;
  if (statusIdx === -1) statusIdx = 4;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx] || "").trim() === targetId) {
      return {
        identityId: String(data[i][idIdx] || ""),
        email: emailIdx !== -1 ? String(data[i][emailIdx] || "").trim().toLowerCase() : "",
        phone: String(data[i][phoneIdx] || ""),
        name: String(data[i][nameIdx] || ""),
        role: String(data[i][roleIdx] || "WALI_SANTRI"),
        status: String(data[i][statusIdx] || "").trim().toUpperCase()
      };
    }
  }
  return null;
}

function getSessionById(sessionId) {
  if (!sessionId) return null;
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_AUTH_SESSIONS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(sessionId).trim()) {
      return {
        session_id: String(data[i][0]),
        identity_id: String(data[i][1]),
        role: String(data[i][2]),
        issued_at: String(data[i][3]),
        expires_at: String(data[i][4]),
        status: String(data[i][5]),
        revoked_at: String(data[i][6] || ""),
        token_version: String(data[i][8] || "")
      };
    }
  }
  return null;
}

function createAuthSessionRecord(identityId, role, ttlHours = 8) {
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_AUTH_SESSIONS);
  if (!sheet) {
    throw new Error("Tabel sesi 'Auth_Sessions' belum diinisialisasi oleh administrator.");
  }

  const sessionId = "SES_" + Utilities.getUuid().replace(/-/g, "");
  const now = new Date();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + (ttlHours * 3600000)).toISOString();
  const tokenVersion = String(getServerSecret("TOKEN_VERSION", "1"));

  sheet.appendRow([
    sessionId,
    identityId,
    role,
    issuedAt,
    expiresAt,
    "ACTIVE",
    "",
    issuedAt,
    tokenVersion
  ]);

  return {
    sessionId: sessionId,
    expiresAt: expiresAt,
    tokenVersion: tokenVersion
  };
}

function revokeAuthSessionRecord(sessionId) {
  if (!sessionId) return false;
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_AUTH_SESSIONS);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(sessionId).trim()) {
      sheet.getRange(i + 1, 6).setValue("REVOKED");
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

function getLinkedStudentsForWali(waliId) {
  if (!waliId) return [];
  const ss = getDatabaseSpreadsheet();
  const mapSheet = getAuthSheet(ss, SHEET_WALI_SANTRI_MAP);
  const studentsSheet = getAuthSheet(ss, SHEET_STUDENTS);

  if (!mapSheet || !studentsSheet) return [];

  const mapData = mapSheet.getDataRange().getValues();
  const activeStudentIds = [];
  const relationshipMap = {};

  for (let i = 1; i < mapData.length; i++) {
    if (String(mapData[i][1]).trim() === String(waliId).trim()) {
      const status = String(mapData[i][4] || "VERIFIED").toUpperCase();
      if (status === "VERIFIED") {
        const studentId = String(mapData[i][2]).trim();
        activeStudentIds.push(studentId);
        relationshipMap[studentId] = String(mapData[i][3] || RELATIONSHIP_ENUM.GUARDIAN).toUpperCase();
      }
    }
  }

  if (activeStudentIds.length === 0) return [];

  const studentData = studentsSheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < studentData.length; i++) {
    const id = String(studentData[i][0]).trim();
    if (activeStudentIds.includes(id)) {
      results.push({
        studentId: id,
        nisn: String(studentData[i][1] || ""),
        name: String(studentData[i][2] || "Santri"),
        program: String(studentData[i][3] || "Reguler"),
        className: String(studentData[i][4] || ""),
        status: String(studentData[i][5] || "Aktif"),
        relationship: relationshipMap[id] || RELATIONSHIP_ENUM.GUARDIAN
      });
    }
  }

  return results;
}

function findPendingOtpChallenge(channel, identifierHash) {
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).trim() === String(channel).trim() &&
        String(data[i][3]).trim() === String(identifierHash).trim() &&
        String(data[i][8]).trim() === "PENDING") {
      
      const expDate = new Date(data[i][7]);
      return {
        rowIndex: i + 1,
        challengeId: String(data[i][0]),
        identityId: String(data[i][1]),
        otpHash: String(data[i][4]),
        attempts: Number(data[i][5] || 0),
        maxAttempts: Number(data[i][6] || 3),
        expiresAt: expDate,
        isExpired: now > expDate
      };
    }
  }
  return null;
}

function cancelPreviousChallenges(channel, identifierHash) {
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][2]).trim() === String(channel).trim() &&
        String(data[i][3]).trim() === String(identifierHash).trim() &&
        String(data[i][8]).trim() === "PENDING") {
      sheet.getRange(i + 1, 9).setValue("CANCELLED");
    }
  }
}

// ==================== AUTHORIZATION PIPELINE ====================

/**
 * Stage 1: Authenticate Session Token
 * P0-1: Memverifikasi token HANYA dengan AUTH_TOKEN_SIGNING_SECRET (strict mode).
 * Token legacy yang ditandatangani dengan TOKEN_SIGNING_SECRET ditolak secara deterministik.
 */
function authenticateSession(tokenString) {
  const claims = verifySessionToken(tokenString, true);

  if (!claims.sessionId || !claims.identityId) {
    throw new AuthenticationError("Token does not contain valid Phase 2B identity claims.");
  }

  // P0-1: Verifikasi status sesi di registry server Auth_Sessions
  const session = getSessionById(claims.sessionId);
  if (!session || session.status !== "ACTIVE") {
    throw new AuthenticationError("Server session is not active or has been revoked.");
  }

  // P0-1: Cek Status Identitas di Master (Admin / Wali)
  let identity = null;
  if (claims.role === "ADMIN" || claims.role === "EDITOR") {
    identity = getAdminIdentityById(claims.identityId);
  } else if (claims.role === "WALI_SANTRI") {
    identity = getWaliIdentityById(claims.identityId);
  }

  if (!identity || identity.status !== "ACTIVE") {
    throw new AuthenticationError("Identity is suspended or not found.");
  }

  return {
    sessionId: claims.sessionId,
    identityId: claims.identityId,
    role: claims.role,
    issuedAt: claims.issuedAt,
    expiresAt: claims.expiresAt,
    identity: identity
  };
}

/**
 * Stage 2: Authorize Role
 */
function authorizeRole(actor, allowedRoles = []) {
  if (!actor || !actor.role) {
    throw new AuthorizationError("Authentication required.");
  }
  if (!allowedRoles.includes(actor.role)) {
    throw new AuthorizationError(`Role '${actor.role}' is forbidden from accessing this resource.`);
  }
  return true;
}

/**
 * P0-3: Request ID Sanitizer (Metadata only, never used for authorization/session lookup)
 */
function sanitizeRequestId(clientReqId) {
  if (clientReqId && typeof clientReqId === "string") {
    const cleaned = clientReqId.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
    if (cleaned.length >= 8) return cleaned;
  }
  return "req_" + Utilities.getUuid().replace(/-/g, "").substring(0, 16);
}

// ==================== API ACTION DISPATCHER (PHASE 2B) ====================

function handleAuthApiAction(action, payload, e) {
  const requestId = sanitizeRequestId(payload && payload.requestId);

  try {
    // ----------------------------------------------------
    // 1. ADMIN REQUEST OTP
    // ----------------------------------------------------
    if (action === "auth.admin.requestOtp") {
      return withAuthScriptLock(() => {
        const email = String(payload.email || "").trim().toLowerCase();
        const idHash = hashIdentifier(email);

        // Anti-Enumeration: generic response statement
        const genericResponse = {
          success: true,
          message: "Jika akun memenuhi syarat dan terdaftar, kode verifikasi 6 digit telah dikirimkan.",
          cooldownSeconds: 60,
          requestId: requestId
        };

        const admin = getAdminIdentityByEmail(email);
        if (!admin || admin.status !== "ACTIVE") {
          writeAuthAuditLog("OTP_REQUEST_IGNORED", "ANONYMOUS", "", "EMAIL", false, requestId, { reason: "Admin identity not found or suspended" });
          return createJsonResponse(genericResponse);
        }

        // Cek challenge pending berumur < 60 detik (cooldown check)
        const pending = findPendingOtpChallenge("EMAIL", idHash);
        if (pending && !pending.isExpired) {
          const elapsed = (new Date().getTime() - new Date(pending.expiresAt.getTime() - 300000).getTime()) / 1000;
          if (elapsed < 60) {
            return createJsonResponse({
              success: true,
              message: "Kode verifikasi telah dikirim sebelumnya. Silakan tunggu jeda kirim ulang.",
              cooldownSeconds: Math.ceil(60 - elapsed),
              requestId: requestId
            });
          }
        }

        // Batalkan challenge aktif sebelumnya
        cancelPreviousChallenges("EMAIL", idHash);

        // Generate CSPRNG OTP
        const otpCode = generateSecureOtpDigits();
        const otpHash = hashOtpCode(otpCode);
        const challengeId = "CHL_" + Utilities.getUuid().replace(/-/g, "").substring(0, 16);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 300000).toISOString();

        const ss = getDatabaseSpreadsheet();
        const otpSheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);
        if (!otpSheet) {
          console.error("[AUTH] Sheet 'OTP_Challenges' belum disetup oleh administrator.");
          return createJsonResponse(genericResponse);
        }

        otpSheet.appendRow([
          challengeId,
          admin.identityId,
          "EMAIL",
          idHash,
          otpHash,
          0,
          3,
          expiresAt,
          "PENDING",
          now.toISOString(),
          "",
          requestId
        ]);

        const challengeRow = otpSheet.getLastRow();
        let emailSuccess = false;
        try {
          emailSuccess = sendAdminOtpEmail(admin.email, otpCode);
        } catch (mailErr) {
          console.error("Gagal mengirim email OTP Admin:", mailErr);
          emailSuccess = false;
        }

        // P0-2: Jika pengiriman gagal, batalkan challenge dan catat OTP_DISPATCH_FAIL
        if (!emailSuccess) {
          otpSheet.getRange(challengeRow, 9).setValue("CANCELLED");
          writeAuthAuditLog("OTP_DISPATCH_FAIL", admin.identityId, "", "EMAIL", false, requestId, { reason: "Admin email delivery failed" });
          return createJsonResponse(genericResponse);
        }

        writeAuthAuditLog("OTP_REQUEST_SENT", admin.identityId, "", "EMAIL", true, requestId, { channel: "EMAIL" });
        return createJsonResponse(genericResponse);
      });
    }

    // ----------------------------------------------------
    // 2. ADMIN VERIFY OTP
    // ----------------------------------------------------
    if (action === "auth.admin.verifyOtp") {
      return withAuthScriptLock(() => {
        const email = String(payload.email || "").trim().toLowerCase();
        const otp = String(payload.otp || "").trim();
        const idHash = hashIdentifier(email);

        const challenge = findPendingOtpChallenge("EMAIL", idHash);
        if (!challenge) {
          writeAuthAuditLog("OTP_VERIFY_NOT_FOUND", "ANONYMOUS", "", "EMAIL", false, requestId, {});
          return createJsonResponse({ success: false, message: "Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru." });
        }

        if (challenge.isExpired) {
          writeAuthAuditLog("OTP_VERIFY_EXPIRED", challenge.identityId, "", "EMAIL", false, requestId, { challengeId: challenge.challengeId });
          return createJsonResponse({ success: false, message: "Kode OTP telah kedaluwarsa. Silakan minta kode baru." });
        }

        if (challenge.attempts >= challenge.maxAttempts) {
          writeAuthAuditLog("OTP_VERIFY_EXHAUSTED", challenge.identityId, "", "EMAIL", false, requestId, { challengeId: challenge.challengeId });
          return createJsonResponse({ success: false, message: "Batas percobaan verifikasi telah habis. Silakan minta kode baru." });
        }

        const inputHash = hashOtpCode(otp);
        const ss = getDatabaseSpreadsheet();
        const otpSheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);

        if (inputHash !== challenge.otpHash) {
          const newAttempts = challenge.attempts + 1;
          otpSheet.getRange(challenge.rowIndex, 6).setValue(newAttempts);
          if (newAttempts >= challenge.maxAttempts) {
            otpSheet.getRange(challenge.rowIndex, 9).setValue("EXHAUSTED");
          }
          writeAuthAuditLog("OTP_VERIFY_FAIL", challenge.identityId, "", "EMAIL", false, requestId, { attempts: newAttempts });
          return createJsonResponse({
            success: false,
            message: `Kode verifikasi salah. Sisa kesempatan: ${Math.max(0, challenge.maxAttempts - newAttempts)}`
          });
        }

        // OTP Valid => Konsumsi Challenge
        otpSheet.getRange(challenge.rowIndex, 9).setValue("CONSUMED");
        otpSheet.getRange(challenge.rowIndex, 11).setValue(new Date().toISOString());

        // Resolve Identitas dari row challenge
        const admin = getAdminIdentityById(challenge.identityId);
        if (!admin || admin.status !== "ACTIVE") {
          return createJsonResponse({ success: false, message: "Identitas akun tidak aktif." });
        }

        // Buat Sesi Server
        const session = createAuthSessionRecord(admin.identityId, admin.role, 8);
        const tokenData = generateSessionToken(admin.email, admin.role, 8, session.sessionId, admin.identityId);

        writeAuthAuditLog("OTP_VERIFY_SUCCESS", admin.identityId, session.sessionId, "EMAIL", true, requestId, {});
        writeAuthAuditLog("SESSION_CREATED", admin.identityId, session.sessionId, "EMAIL", true, requestId, { role: admin.role });

        return createJsonResponse({
          success: true,
          token: tokenData.token,
          data: {
            token: tokenData.token,
            role: admin.role,
            admin: {
              identityId: admin.identityId,
              name: admin.name,
              email: admin.email,
              role: admin.role
            }
          },
          identity: {
            identityId: admin.identityId,
            name: admin.name,
            email: admin.email,
            role: admin.role
          },
          requestId: requestId
        });
      });
    }

    // ----------------------------------------------------
    // 3. WALI REQUEST OTP (Email OTP - Phase 2B)
    // ----------------------------------------------------
    if (action === "auth.parent.requestOtp" || action === "auth.wali.requestOtp") {
      return withAuthScriptLock(() => {
        const email = String(payload.email || "").trim().toLowerCase();
        const idHash = hashIdentifier(email);

        const genericResponse = {
          success: true,
          message: "Jika akun memenuhi syarat dan terdaftar, kode verifikasi 6 digit telah dikirimkan ke email Anda.",
          cooldownSeconds: 60,
          requestId: requestId
        };

        const wali = getWaliIdentityByEmail(email);
        if (!wali || wali.status !== "ACTIVE") {
          writeAuthAuditLog("OTP_REQUEST_IGNORED", "ANONYMOUS", "", "EMAIL", false, requestId, { reason: "Wali not found or inactive" });
          return createJsonResponse(genericResponse);
        }

        const pending = findPendingOtpChallenge("EMAIL", idHash);
        if (pending && !pending.isExpired) {
          const elapsed = (new Date().getTime() - new Date(pending.expiresAt.getTime() - 300000).getTime()) / 1000;
          if (elapsed < 60) {
            return createJsonResponse({
              success: true,
              message: "Kode verifikasi telah dikirimkan sebelumnya. Silakan tunggu jeda kirim ulang.",
              cooldownSeconds: Math.ceil(60 - elapsed),
              requestId: requestId
            });
          }
        }

        cancelPreviousChallenges("EMAIL", idHash);

        const otpCode = generateSecureOtpDigits();
        const otpHash = hashOtpCode(otpCode);
        const challengeId = "CHL_" + Utilities.getUuid().replace(/-/g, "").substring(0, 16);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 300000).toISOString();

        const ss = getDatabaseSpreadsheet();
        const otpSheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);
        if (!otpSheet) {
          console.error("[AUTH] Sheet 'OTP_Challenges' belum disetup oleh administrator.");
          return createJsonResponse(genericResponse);
        }

        otpSheet.appendRow([
          challengeId,
          wali.identityId,
          "EMAIL",
          idHash,
          otpHash,
          0,
          3,
          expiresAt,
          "PENDING",
          now.toISOString(),
          "",
          requestId
        ]);

        const challengeRow = otpSheet.getLastRow();
        let emailSuccess = false;
        try {
          emailSuccess = sendWaliOtpEmail(wali.email, otpCode, wali.name);
        } catch (mailErr) {
          console.error("Gagal mengirim email OTP Wali:", mailErr);
          emailSuccess = false;
        }

        // P0-2: Jika pengiriman gagal, batalkan challenge dan catat OTP_DISPATCH_FAIL
        if (!emailSuccess) {
          otpSheet.getRange(challengeRow, 9).setValue("CANCELLED");
          writeAuthAuditLog("OTP_DISPATCH_FAIL", wali.identityId, "", "EMAIL", false, requestId, { reason: "Wali email delivery failed" });
          return createJsonResponse(genericResponse);
        }

        writeAuthAuditLog("OTP_REQUEST_SENT", wali.identityId, "", "EMAIL", true, requestId, { channel: "EMAIL" });
        return createJsonResponse(genericResponse);
      });
    }

    // ----------------------------------------------------
    // 4. WALI VERIFY OTP (Email OTP - Phase 2B)
    // ----------------------------------------------------
    if (action === "auth.parent.verifyOtp" || action === "auth.wali.verifyOtp") {
      return withAuthScriptLock(() => {
        const email = String(payload.email || "").trim().toLowerCase();
        const otp = String(payload.otp || "").trim();
        const idHash = hashIdentifier(email);

        const challenge = findPendingOtpChallenge("EMAIL", idHash);
        if (!challenge) {
          writeAuthAuditLog("OTP_VERIFY_NOT_FOUND", "ANONYMOUS", "", "EMAIL", false, requestId, {});
          return createJsonResponse({ success: false, message: "Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru." });
        }

        if (challenge.isExpired) {
          writeAuthAuditLog("OTP_VERIFY_EXPIRED", challenge.identityId, "", "EMAIL", false, requestId, { challengeId: challenge.challengeId });
          return createJsonResponse({ success: false, message: "Kode OTP telah kedaluwarsa. Silakan minta kode baru." });
        }

        if (challenge.attempts >= challenge.maxAttempts) {
          writeAuthAuditLog("OTP_VERIFY_EXHAUSTED", challenge.identityId, "", "EMAIL", false, requestId, { challengeId: challenge.challengeId });
          return createJsonResponse({ success: false, message: "Batas percobaan verifikasi telah habis. Silakan minta kode baru." });
        }

        const inputHash = hashOtpCode(otp);
        const ss = getDatabaseSpreadsheet();
        const otpSheet = getAuthSheet(ss, SHEET_OTP_CHALLENGES);

        if (inputHash !== challenge.otpHash) {
          const newAttempts = challenge.attempts + 1;
          otpSheet.getRange(challenge.rowIndex, 6).setValue(newAttempts);
          if (newAttempts >= challenge.maxAttempts) {
            otpSheet.getRange(challenge.rowIndex, 9).setValue("EXHAUSTED");
          }
          writeAuthAuditLog("OTP_VERIFY_FAIL", challenge.identityId, "", "EMAIL", false, requestId, { attempts: newAttempts });
          return createJsonResponse({
            success: false,
            message: `Kode verifikasi salah. Sisa kesempatan: ${Math.max(0, challenge.maxAttempts - newAttempts)}`
          });
        }

        otpSheet.getRange(challenge.rowIndex, 9).setValue("CONSUMED");
        otpSheet.getRange(challenge.rowIndex, 11).setValue(new Date().toISOString());

        const wali = getWaliIdentityById(challenge.identityId);
        if (!wali || wali.status !== "ACTIVE") {
          return createJsonResponse({ success: false, message: "Identitas akun tidak aktif." });
        }

        const session = createAuthSessionRecord(wali.identityId, "WALI_SANTRI", 24);
        const tokenData = generateSessionToken(wali.email, "WALI_SANTRI", 24, session.sessionId, wali.identityId);
        const students = getLinkedStudentsForWali(wali.identityId);

        writeAuthAuditLog("OTP_VERIFY_SUCCESS", wali.identityId, session.sessionId, "EMAIL", true, requestId, {});
        writeAuthAuditLog("SESSION_CREATED", wali.identityId, session.sessionId, "EMAIL", true, requestId, { role: "WALI_SANTRI" });

        return createJsonResponse({
          success: true,
          token: tokenData.token,
          data: {
            token: tokenData.token,
            role: "WALI_SANTRI",
            parent: {
              identityId: wali.identityId,
              name: wali.name,
              email: wali.email,
              phone: wali.phone
            },
            students: students
          },
          identity: {
            identityId: wali.identityId,
            name: wali.name,
            email: wali.email,
            phone: wali.phone,
            role: "WALI_SANTRI"
          },
          students: students,
          requestId: requestId
        });
      });
    }

    // ----------------------------------------------------
    // 5. VERIFY SESSION (auth.session)
    // ----------------------------------------------------
    if (action === "auth.session") {
      const token = payload.token || (payload.data && payload.data.token) || "";
      const actor = authenticateSession(token);

      return createJsonResponse({
        success: true,
        valid: true,
        identity: actor.identity,
        role: actor.role,
        requestId: requestId
      });
    }

    // ----------------------------------------------------
    // 6. REVOKE SESSION (auth.logout)
    // ----------------------------------------------------
    if (action === "auth.logout") {
      return withAuthScriptLock(() => {
        const token = payload.token || (payload.data && payload.data.token) || "";
        const actor = authenticateSession(token);

        revokeAuthSessionRecord(actor.sessionId);
        writeAuthAuditLog("SESSION_REVOKED", actor.identityId, actor.sessionId, "HTTP_POST", true, requestId, {});

        return createJsonResponse({
          success: true,
          message: "Sesi telah diakhiri dan dicabut dari server.",
          requestId: requestId
        });
      });
    }

    // ----------------------------------------------------
    // 7. WALI PROFILE (auth.parent.me)
    // ----------------------------------------------------
    if (action === "auth.parent.me") {
      const token = payload.token || (payload.data && payload.data.token) || "";
      const actor = authenticateSession(token);
      authorizeRole(actor, ["WALI_SANTRI", "ADMIN"]);

      const wali = getWaliIdentityById(actor.identityId);
      return createJsonResponse({
        success: true,
        parent: wali,
        requestId: requestId
      });
    }

    // ----------------------------------------------------
    // 8. WALI LINKED STUDENTS (auth.parent.students)
    // ----------------------------------------------------
    if (action === "auth.parent.students") {
      const token = payload.token || (payload.data && payload.data.token) || "";
      const actor = authenticateSession(token);
      authorizeRole(actor, ["WALI_SANTRI", "ADMIN"]);

      const students = getLinkedStudentsForWali(actor.identityId);
      return createJsonResponse({
        success: true,
        students: students,
        requestId: requestId
      });
    }

    return createJsonResponse({
      success: false,
      message: `Action '${action}' tidak dikenali pada modul autentikasi Phase 2B.`,
      requestId: requestId
    });

  } catch (err) {
    console.error("[AUTH API ERROR]", err);
    writeAuthAuditLog("AUTH_ERROR", "SYSTEM", "", "HTTP_POST", false, requestId, { error: err.message, action: action });
    return createJsonResponse({
      success: false,
      message: err.message || "Terjadi kesalahan internal pada layanan autentikasi.",
      requestId: requestId
    });
  }
}


