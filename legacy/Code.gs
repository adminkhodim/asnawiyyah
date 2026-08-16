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

    if (action === "getPPDB") {
      return createJsonResponse(
        getPendaftarData()
      );
    }

    // ========================================================
    // ADMIN API
    //
    // STEP 3:
    // HTTP routing sudah tersedia.
    // Authentication/Authorization belum diaktifkan.
    // Akan ditambahkan pada tahap Security.
    // ========================================================

    if (action === "saveBerita") {
      return createJsonResponse(
        simpanBerita(payload.data || payload)
      );
    }

    if (action === "saveBanner") {
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

    if (action === "toggleBanner") {

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

    // ========================================================
    // PROGRAM DATA SOURCE v2.0 API ROUTER (POST)
    // ========================================================
    if (action.startsWith("program.") || action === "admin.login") {
      return handleProgramApiAction(action, payload, e);
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

function simpanBerita(formData) {
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
      sheet.appendRow(["Tanggal", "Judul", "Kategori", "Penulis", "Gambar_URL", "Ringkasan", "Isi"]);
    }

    sheet.appendRow([
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

    if (action === "getPPDB") {
      return createJsonResponse(
        getPendaftarData()
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

    // Baris 1 adalah Header, ambil mulai baris 2 (index 1) dari yang paling baru
    for (let i = data.length - 1; i >= 1; i--) {
      const judul = String(data[i][1] || "").trim();
      if (judul !== "") {
        newsList.push({
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

    return { status: "success", data: newsList };
  } catch (err) {
    return { status: "error", message: err.toString(), data: [] };
  }
}

// ==================== PENGELOLAAN BANNER SLIDER ====================
const BANNER_SHEET_NAME = "Banner";

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
    if (!session || !session.valid) {
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
    return val || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Generates Server-Signed Session Token (HMAC SHA-256)
 */
function generateSessionToken(userId, role, ttlHours = 8) {
  const secret = getServerSecret("TOKEN_SIGNING_SECRET", "ASNAWIYYAH_DEFAULT_SECRET_2026");
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
 * Verifies Session Token (Checks HMAC Signature, Expiry, & TOKEN_VERSION)
 */
function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== "string" || !tokenString.includes(".")) {
    throw new AuthenticationError("Authentication token is missing or malformed.");
  }

  const parts = tokenString.split(".");
  if (parts.length !== 2) {
    throw new AuthenticationError("Authentication token format invalid.");
  }

  const payloadStr = parts[0];
  const signatureStr = parts[1];

  const secret = getServerSecret("TOKEN_SIGNING_SECRET", "ASNAWIYYAH_DEFAULT_SECRET_2026");
  const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadStr, secret);
  const expectedSigStr = Utilities.base64Encode(expectedSigBytes);

  if (signatureStr !== expectedSigStr) {
    throw new AuthenticationError("Authentication token signature verification failed (tampered).");
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

    const name = String(inputPayload.name || (existing ? existing.name : "")).trim();
    if (!name) {
      throw new ValidationError("Program name is required.");
    }

    const now = new Date().toISOString();
    const userId = actorContext.userId;

    // Build ProgramRecord with Server-Managed Lifecycle Fields
    const recordToSave = Object.freeze({
      id: id,
      name: name,
      badge: String(inputPayload.badge || (existing ? existing.badge : "")).trim(),
      image: String(inputPayload.image || (existing ? existing.image : "")).trim(),
      description: String(inputPayload.description || (existing ? existing.description : "")).trim(),
      highlights: Array.isArray(inputPayload.highlights) ? inputPayload.highlights : (existing ? existing.highlights : []),
      detail: (inputPayload.detail && typeof inputPayload.detail === "object") ? inputPayload.detail : (existing ? existing.detail : {}),

      // SERVER-MANAGED FIELDS:
      status: existing ? existing.status : ProgramStatus.DRAFT,
      sort_order: Number(inputPayload.sort_order) || (existing ? existing.sort_order : 0),
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      created_by: existing ? existing.created_by : userId,
      updated_by: userId,
      published_at: existing ? existing.published_at : null,
      published_by: existing ? existing.published_by : null,
      version: isEdit ? (Number(inputPayload.version) || (existing ? existing.version + 1 : 1)) : 1
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