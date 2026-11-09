/**
 * ============================================================================
 * 00_Config_Security.gs
 * PPTQ Asnawiyyah Backend Architecture - Configuration, Security & Core Helpers
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Error Classes & Response Envelopes (createJsonResponse, formatDate)
 *  - Script Properties & Cryptographic Salt / Secrets Management
 *  - Session TTL Configuration, HMAC Token Generation & Verification
 *  - Password Hashing & Verification (SHA-256)
 *  - LockService Concurrency & Security Audit Log
 *  - Database Spreadsheet Accessor & Base Sheet Schemas
 * ============================================================================
 */

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
// ==================== SESSION TTL CONFIGURATION ====================
// Role-specific bounded session lifetimes (Kebijakan Operasional Pesantren)
const SESSION_TTL_SUPER_ADMIN_HOURS = 720;     // 30 Hari (720 Jam)
const SESSION_TTL_ADMIN_HOURS = 720;           // 30 Hari (720 Jam)
const SESSION_TTL_EDITOR_HOURS = 720;          // 30 Hari (720 Jam) (Editor / Pengurus / Bendahara / Pegawai)
const SESSION_TTL_PENGASUH_HOURS = 2160;       // 90 Hari (~3 Bulan / 2.160 Jam)
const SESSION_TTL_ASATIDZ_HOURS = 720;         // 30 Hari (720 Jam) (Asatidz / Muhafiz)
const SESSION_TTL_WALI_HOURS = 2160;           // 90 Hari (~3 Bulan / 2.160 Jam) (Wali Santri)
const SESSION_TTL_DEFAULT_HOURS = 720;         // 30 Hari (720 Jam) Default Fallback

function getSessionTtlHoursForRole(role) {
  const r = String(role || "").trim().toUpperCase();
  if (r === "SUPER_ADMIN") return SESSION_TTL_SUPER_ADMIN_HOURS;
  if (r === "ADMIN") return SESSION_TTL_ADMIN_HOURS;
  if (r === "EDITOR" || r === "PENGURUS" || r === "BENDAHARA" || r === "PEGAWAI") return SESSION_TTL_EDITOR_HOURS;
  if (r === "ASATIDZ" || r === "MUHAFIZ") return SESSION_TTL_ASATIDZ_HOURS;
  if (r === "PENGASUH") return SESSION_TTL_PENGASUH_HOURS;
  if (r === "WALI_SANTRI") return SESSION_TTL_WALI_HOURS;
  return SESSION_TTL_DEFAULT_HOURS;
}

function generateSessionToken(userId, role, ttlHours = null, sessionId = null, identityId = null) {
  const secret = getServerSecret("AUTH_TOKEN_SIGNING_SECRET", getServerSecret("TOKEN_SIGNING_SECRET", ""));
  if (!secret) {
    throw new AuthenticationError("Signing secret is not configured on server.");
  }
  const effectiveTtlHours = (typeof ttlHours === "number" && ttlHours > 0) ? ttlHours : getSessionTtlHoursForRole(role);
  const tokenVersion = getServerSecret("TOKEN_VERSION", "1");
  const now = new Date().getTime();
  const expiresAt = now + (effectiveTtlHours * 60 * 60 * 1000);

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

  // P1-1 STRICT TOKEN EXPIRATION: Token kedaluwarsa jika waktu sekarang melebihi claims.expiresAt.
  // Bypass server-active dihapus agar sesi bounded TTL berlaku deterministik.
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
  }

  return claims;
}

/**
 * Action Authorization Matrix
 */
const AllowedRoles = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  PENGASUH: "pengasuh",
  EDITOR: "editor",
  PENGURUS: "pengurus"
});

function authorizeAction(actorContext, actionName) {
  const publicActions = ["program.listPublished", "program.getPublished"];
  if (publicActions.includes(actionName)) {
    return true; // Public access allowed
  }

  if (!actorContext || !actorContext.role) {
    throw new AuthenticationError("Authentication required for action: " + actionName);
  }

  const role = String(actorContext.role || "").trim().toLowerCase();

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

  const adminRoles = ["admin", "super_admin", "pengasuh", "administrator"];
  const editorRoles = ["admin", "super_admin", "pengasuh", "administrator", "editor", "pengurus"];

  if (adminActions.includes(actionName)) {
    if (!adminRoles.includes(role)) {
      throw new AuthorizationError(`Role '${actorContext.role}' is forbidden from performing action '${actionName}'.`);
    }
    return true;
  }

  if (editorActions.includes(actionName)) {
    if (!editorRoles.includes(role)) {
      throw new AuthorizationError(`Role '${actorContext.role}' is forbidden from performing action '${actionName}'.`);
    }
    return true;
  }

  throw new AuthorizationError("Unrecognized action for authorization check: " + actionName);
}

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
 * Verifikasi password hash SHA-256
 */
function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword || !inputPassword) return false;
  return hashPassword(inputPassword) === storedPassword;
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

function verifyOtpHash(otpCode, storedHash) {
  if (!otpCode || !storedHash) return false;
  return hashOtpCode(otpCode) === String(storedHash).trim();
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
 * Memastikan skema tabel mutakhir secara non-destruktif on-the-fly.
 * Menambahkan kolom yang belum ada (seperti birth_date pada Students).
 */
function ensureAuthSheetSchema(sheet, targetName) {
  if (!sheet || !targetName || !AUTH_SHEET_SCHEMAS || !AUTH_SHEET_SCHEMAS[targetName]) return;
  try {
    const expectedHeaders = AUTH_SHEET_SCHEMAS[targetName];
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      return;
    }

    // 1. Auto-rename header nisn -> nis jika ada pada sheet Students
    if (targetName === SHEET_STUDENTS) {
      const firstRowValues = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (let c = 0; c < firstRowValues.length; c++) {
        if (String(firstRowValues[c] || "").trim().toLowerCase() === "nisn") {
          sheet.getRange(1, c + 1).setValue("nis");
          Logger.log(`[AUTO-MIGRATION] Header 'nisn' di sheet '${targetName}' kolom ${c + 1} berhasil diubah menjadi 'nis'.`);
          break;
        }
      }

      // 2. Pastikan tata letak kolom Students memiliki kelas_sekolah di kolom E (setelah program)
      if (typeof ensureStudentSheetColumnLayout === 'function') {
        ensureStudentSheetColumnLayout(sheet);
      }
    }

    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h || "").trim().toLowerCase());
    const missingHeaders = expectedHeaders.filter(eh => {
      const lower = eh.toLowerCase();
      if (lower === "nis") {
        return !currentHeaders.includes("nis") && !currentHeaders.includes("nisn");
      }
      if (lower === "birth_date") {
        return !currentHeaders.includes("birth_date") && !currentHeaders.includes("tanggal_lahir") && !currentHeaders.includes("tgl_lahir");
      }
      if (lower === "gender") {
        return !currentHeaders.includes("gender") && !currentHeaders.includes("jenis") && !currentHeaders.includes("jenis_kelamin");
      }
      if (lower === "photo_url") {
        return !currentHeaders.includes("photo_url") && !currentHeaders.includes("foto_profil") && !currentHeaders.includes("foto");
      }
      return !currentHeaders.includes(lower);
    });

    if (missingHeaders.length > 0) {
      const updatedLastCol = sheet.getLastColumn();
      missingHeaders.forEach((mh, idx) => {
        const colIdx = updatedLastCol + idx + 1;
        sheet.getRange(1, colIdx).setValue(mh).setFontWeight("bold").setBackground("#dcfce7");
      });
      Logger.log(`[AUTO-MIGRATION] Kolom [${missingHeaders.join(", ")}] otomatis ditambahkan ke sheet '${targetName}'.`);
    }
  } catch (err) {
    console.warn(`[AUTO-MIGRATION WARNING] Gagal sinkronisasi skema untuk '${targetName}':`, err);
  }
}

/**
 * Helper Resolusi Sheet Tab Resilien & Auto-Init On-Demand.
 * 1. Jika tabel sudah ada, lakukan schema sync (tambah kolom baru bila ada).
 * 2. Jika tabel belum ada, otomatis buat sheet baru dengan header lengkap & format resmi.
 */
function getAuthSheet(ss, targetName) {
  if (!ss) return null;
  let targetSheet = ss.getSheetByName(targetName);

  if (!targetSheet) {
    const cleanTarget = String(targetName || "").replace(/[\s_]+/g, "").toLowerCase();
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const name = sheets[i].getName();
      const cleanName = name.replace(/[\s_]+/g, "").toLowerCase();
      if (name.trim().toLowerCase() === String(targetName).trim().toLowerCase() ||
          cleanName === cleanTarget ||
          (cleanTarget === "students" && cleanName === "student") ||
          (cleanTarget === "student" && cleanName === "students")) {
        targetSheet = sheets[i];
        break;
      }
    }
  }

  // Jika tabel belum ada sama sekali di spreadsheet, auto-create on-the-fly!
  if (!targetSheet && AUTH_SHEET_SCHEMAS && AUTH_SHEET_SCHEMAS[targetName]) {
    try {
      targetSheet = ss.insertSheet(targetName);
      const headers = AUTH_SHEET_SCHEMAS[targetName];
      targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      targetSheet.setFrozenRows(1);
      Logger.log(`[SCHEMA AUTO-INIT] Tab '${targetName}' berhasil dibuat otomatis di Google Sheets.`);
    } catch (e) {
      console.warn(`[SCHEMA AUTO-INIT WARN] Gagal insert sheet '${targetName}': ${e.message}`);
      targetSheet = ss.getSheetByName(targetName); // fallback jika terjadi concurrency
    }
  }

  if (targetSheet) {
    ensureAuthSheetSchema(targetSheet, targetName);
  }

  return targetSheet;
}


/**
 * Normalisasi format tanggal untuk pencocokan toleran (YYYY-MM-DD)
 */
function normalizeDateString(val) {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  const mYmd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (mYmd) {
    return `${mYmd[1]}-${String(mYmd[2]).padStart(2, "0")}-${String(mYmd[3]).padStart(2, "0")}`;
  }
  const mDmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (mDmy) {
    return `${mDmy[3]}-${String(mDmy[2]).padStart(2, "0")}-${String(mDmy[1]).padStart(2, "0")}`;
  }
  return s;
}



/**
 * ============================================================================
 * SUPABASE SERVER-SIDE REPLICATOR ENGINE (GAS -> SUPABASE via SERVICE_ROLE)
 * ============================================================================
 * Menghubungkan Google Apps Script langsung ke Supabase REST API menggunakan
 * service_role key yang tersimpan secara privat di ScriptProperties.
 * Memastikan data di Google Sheets dan Supabase selalu sinkron secara otomatis.
 * ============================================================================
 */

function getSupabaseServerConfig() {
  const url = getServerSecret("SUPABASE_URL", "https://tkjhfhyabacbyknwrysh.supabase.co");
  const key = getServerSecret("SUPABASE_SERVICE_ROLE_KEY", "");
  return {
    url: String(url || "").replace(/\/+$/, ""),
    key: String(key || "").trim(),
    isConfigured: Boolean(url && key)
  };
}

/**
 * Konfigurasi Supabase Service Role Key ke ScriptProperties (Jalankan 1x dari Apps Script Editor)
 */
function setupSupabaseServiceRole(serviceRoleKey, customUrl) {
  try {
    const props = PropertiesService.getScriptProperties();
    if (serviceRoleKey) {
      props.setProperty("SUPABASE_SERVICE_ROLE_KEY", String(serviceRoleKey).trim());
    }
    if (customUrl) {
      props.setProperty("SUPABASE_URL", String(customUrl).trim());
    }
    Logger.log("✅ Supabase Service Role Key berhasil dikonfigurasi di PropertiesService!");
    return { success: true, message: "Kunci service_role Supabase berhasil disimpan." };
  } catch (e) {
    Logger.log("❌ Gagal menyimpan service_role key: " + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Replikasi generik data ke Supabase REST API
 */
function replicateToSupabase(endpointPath, method, payload) {
  const config = getSupabaseServerConfig();
  if (!config.isConfigured) {
    // Graceful bypass jika admin belum menyetel service_role key di ScriptProperties
    return { success: false, skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  }

  const cleanPath = endpointPath.startsWith("/") ? endpointPath : ("/" + endpointPath);
  const targetUrl = config.url + cleanPath;
  const httpMethod = (method || "POST").toUpperCase();

  const headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates"
  };

  const options = {
    method: httpMethod,
    headers: headers,
    muteHttpExceptions: true
  };

  if (payload && (httpMethod === "POST" || httpMethod === "PATCH" || httpMethod === "PUT")) {
    options.payload = JSON.stringify(payload);
  }

  try {
    const response = UrlFetchApp.fetch(targetUrl, options);
    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code >= 200 && code < 300) {
      let data = null;
      try { data = JSON.parse(body); } catch (e) { data = body; }
      return { success: true, status: code, data: data };
    } else {
      console.warn(`[SUPABASE REPL WARN] ${httpMethod} ${cleanPath} HTTP ${code}: ${body.substring(0, 150)}`);
      return { success: false, status: code, error: body };
    }
  } catch (err) {
    console.warn(`[SUPABASE REPL ERROR] ${httpMethod} ${cleanPath}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * ============================================================================
 * MODUL REKONSILIASI & SINKRONISASI BATCH (Google Sheets -> Supabase)
 * ============================================================================
 * Memindahkan seluruh data riwayat historis dari Google Sheets ke Supabase
 * menggunakan service_role key melalui REST API. Aman, idempoten (upsert on_conflict),
 * dan terbagi dalam batch agar tidak melampaui kuota eksekusi Apps Script.
 * ============================================================================
 */

function formatSyncDateIso_(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  return null;
}

function formatSyncDateTimeIso_(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString();
  }
  const s = String(val).trim();
  if (!s) return null;
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return null;
}

function formatSyncTimeHHmm_(val, defaultTime) {
  defaultTime = defaultTime || "08:00";
  if (!val) return defaultTime;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return defaultTime;
    const h = String(val.getHours()).padStart(2, "0");
    const m = String(val.getMinutes()).padStart(2, "0");
    return h + ":" + m;
  }
  const s = String(val).trim();
  if (!s) return defaultTime;
  const match = s.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const h = String(match[1]).padStart(2, "0");
    const m = String(match[2]);
    return h + ":" + m;
  }
  return s.substring(0, 16);
}

function normalizeSyncGender_(val) {
  if (!val) return "Putra";
  const s = String(val).trim().toUpperCase();
  if (s === "L" || s.indexOf("LAKI") !== -1 || s.indexOf("PUTRA") !== -1 || s === "PRIA") return "Putra";
  if (s === "P" || s.indexOf("PEREMPUAN") !== -1 || s.indexOf("PUTRI") !== -1 || s === "WANITA") return "Putri";
  return "Putra";
}

function normalizeSyncIzinKategori_(kat) {
  if (!kat) return "Pulang ke Rumah / Libur Terjadwal";
  const k = String(kat).trim().toLowerCase();
  if (k.indexOf("sakit") !== -1 || k.indexOf("obat") !== -1 || k.indexOf("medis") !== -1) return "Izin Sakit / Berobat Luar";
  if (k.indexOf("mendesak") !== -1 || k.indexOf("keluarga") !== -1 || k.indexOf("nikah") !== -1 || k.indexOf("duka") !== -1 || k.indexOf("sambang") !== -1) return "Kepentingan Mendesak Keluarga";
  if (k.indexOf("tugas") !== -1 || k.indexOf("delegasi") !== -1 || k.indexOf("lomba") !== -1 || k.indexOf("kegiatan") !== -1) return "Tugas / Delegasi Pondok";
  return "Pulang ke Rumah / Libur Terjadwal";
}

function normalizeSyncIzinStatus_(st) {
  if (!st) return "MENUNGGU_PENGURUS";
  const s = String(st).trim().toUpperCase();
  if (s.indexOf("PENGASUH") !== -1) return "MENUNGGU_PENGASUH";
  if (s.indexOf("SETUJU") !== -1 || s.indexOf("APPROV") !== -1) return "DISETUJUI";
  if (s.indexOf("TOLAK") !== -1 || s.indexOf("REJECT") !== -1) return "DITOLAK";
  if (s === "KELUAR") return "KELUAR";
  if (s === "KEMBALI") return "KEMBALI";
  if (s === "TERLAMBAT") return "TERLAMBAT";
  return "MENUNGGU_PENGURUS";
}

function cleanSyncVal_(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

/**
 * 1. Batch Sync Master Santri (Students -> Supabase students)
 */
function syncHistoricalStudentsToSupabase(ss) {
  ss = ss || getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName("Students");
  if (!sheet) sheet = ss.getSheetByName("data_santri");
  if (!sheet || sheet.getLastRow() < 2) {
    return { domain: "students", total: 0, synced: 0, message: "Sheet Students kosong atau tidak ditemukan." };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/\s+/g, "_"));
  const idIdx = headers.indexOf("student_id");
  const nisIdx = headers.indexOf("nis") !== -1 ? headers.indexOf("nis") : headers.indexOf("nisn");
  const nameIdx = headers.indexOf("name") !== -1 ? headers.indexOf("name") : headers.indexOf("nama");
  const genderIdx = headers.indexOf("gender") !== -1 ? headers.indexOf("gender") : headers.indexOf("jenis_kelamin");
  const birthIdx = headers.indexOf("birth_date") !== -1 ? headers.indexOf("birth_date") : headers.indexOf("tanggal_lahir");
  const nikIdx = headers.indexOf("nik");
  const photoIdx = headers.indexOf("photo_url") !== -1 ? headers.indexOf("photo_url") : headers.indexOf("foto");
  const progIdx = headers.indexOf("program");
  const classIdx = headers.indexOf("kelas_sekolah") !== -1 ? headers.indexOf("kelas_sekolah") : headers.indexOf("kelas");
  const statusIdx = headers.indexOf("status");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nis = nisIdx !== -1 ? cleanSyncVal_(row[nisIdx]) : null;
    const name = nameIdx !== -1 ? cleanSyncVal_(row[nameIdx]) : null;
    if (!nis && !name) continue;

    let studentId = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    if (!studentId) {
      studentId = nis ? ("STD_" + nis) : ("STD_" + Utilities.getUuid().replace(/-/g, "").substring(0, 10));
    }

    records.push({
      student_id: String(studentId),
      nis: String(nis || studentId),
      nik: nikIdx !== -1 ? cleanSyncVal_(row[nikIdx]) : null,
      name: String(name || "Santri"),
      gender: normalizeSyncGender_(genderIdx !== -1 ? row[genderIdx] : "Putra"),
      birth_date: birthIdx !== -1 ? formatSyncDateIso_(row[birthIdx]) : null,
      photo_url: photoIdx !== -1 ? cleanSyncVal_(row[photoIdx]) : null,
      program: progIdx !== -1 && cleanSyncVal_(row[progIdx]) ? String(row[progIdx]).trim() : "Reguler",
      kelas_sekolah: classIdx !== -1 && cleanSyncVal_(row[classIdx]) ? String(row[classIdx]).trim() : "-",
      status: statusIdx !== -1 && cleanSyncVal_(row[statusIdx]) ? String(row[statusIdx]).trim().toUpperCase() : "AKTIF"
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/students?on_conflict=student_id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC STUDENTS BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL STUDENTS] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "students", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 2. Batch Sync Setoran Tahfidz (Tahfidz_Logs -> Supabase tahfidz_logs)
 */
function syncHistoricalTahfidzLogsToSupabase(ss) {
  ss = ss || getDatabaseSpreadsheet();
  const sheet = ss.getSheetByName("Tahfidz_Logs");
  if (!sheet || sheet.getLastRow() < 2) {
    return { domain: "tahfidz_logs", total: 0, synced: 0, message: "Sheet Tahfidz_Logs kosong atau tidak ditemukan." };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
  const idIdx = headers.findIndex(h => h === "logid" || h === "id");
  const sIdIdx = headers.findIndex(h => h === "studentid");
  const nisIdx = headers.findIndex(h => h === "nis");
  const nameIdx = headers.findIndex(h => h === "studentname" || h === "nama");
  const genderIdx = headers.findIndex(h => h === "gender" || h === "jeniskelamin");
  const tglIdx = headers.findIndex(h => h === "tanggal" || h === "date");
  const sesiIdx = headers.findIndex(h => h === "sesi");
  const tipeIdx = headers.findIndex(h => h === "tipe");
  const juzIdx = headers.findIndex(h => h === "juz");
  const halIdx = headers.findIndex(h => h === "halamanlist" || h === "halaman");
  const totIdx = headers.findIndex(h => h === "totalhalaman");
  const nilaiIdx = headers.findIndex(h => h === "nilai");
  const muhIdx = headers.findIndex(h => h === "muhafiz" || h === "pembina");
  const stIdx = headers.findIndex(h => h === "statussetoran" || h === "status");
  const catIdx = headers.findIndex(h => h === "catatan" || h === "keterangan");
  const surahIdx = headers.findIndex(h => h === "surah");
  const satuanIdx = headers.findIndex(h => h === "satuan");
  const ayatMulaiIdx = headers.findIndex(h => h === "ayatmulai");
  const ayatSampaiIdx = headers.findIndex(h => h === "ayatsampai");
  const crtIdx = headers.findIndex(h => h === "createdat");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let logId = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    let sId = sIdIdx !== -1 ? cleanSyncVal_(row[sIdIdx]) : null;
    const nis = nisIdx !== -1 ? cleanSyncVal_(row[nisIdx]) : null;
    const sName = nameIdx !== -1 ? cleanSyncVal_(row[nameIdx]) : null;

    if (!sId && !nis && !sName) continue;
    if (!sId) sId = nis ? ("STD_" + nis) : "STD_UNKNOWN";
    if (!logId) logId = "LOG_" + Utilities.getUuid().replace(/-/g, "").substring(0, 12);

    const tipeVal = tipeIdx !== -1 && cleanSyncVal_(row[tipeIdx]) ? String(row[tipeIdx]).trim().toUpperCase() : "ZIYADAH";
    const statusVal = stIdx !== -1 && cleanSyncVal_(row[stIdx]) ? String(row[stIdx]).trim().toUpperCase() : "LANJUT";
    const aMulai = ayatMulaiIdx !== -1 && cleanSyncVal_(row[ayatMulaiIdx]) ? (Number(row[ayatMulaiIdx]) || null) : null;
    const aSampai = ayatSampaiIdx !== -1 && cleanSyncVal_(row[ayatSampaiIdx]) ? (Number(row[ayatSampaiIdx]) || null) : null;

    records.push({
      log_id: String(logId),
      student_id: String(sId),
      nis: nis ? String(nis) : null,
      student_name: String(sName || "Santri"),
      gender: genderIdx !== -1 ? normalizeSyncGender_(row[genderIdx]) : "Putra",
      tanggal: tglIdx !== -1 ? formatSyncDateIso_(row[tglIdx]) : formatSyncDateIso_(new Date()),
      sesi: sesiIdx !== -1 && cleanSyncVal_(row[sesiIdx]) ? String(row[sesiIdx]).trim() : "Pagi",
      tipe: tipeVal,
      juz: juzIdx !== -1 ? (Number(row[juzIdx]) || 1) : 1,
      surah: surahIdx !== -1 && cleanSyncVal_(row[surahIdx]) ? String(row[surahIdx]).trim() : null,
      satuan: satuanIdx !== -1 && cleanSyncVal_(row[satuanIdx]) ? String(row[satuanIdx]).trim().toUpperCase() : "HALAMAN",
      ayat_mulai: aMulai,
      ayat_sampai: aSampai,
      halaman_list: halIdx !== -1 && cleanSyncVal_(row[halIdx]) ? String(row[halIdx]).trim() : "1",
      total_halaman: totIdx !== -1 ? (Number(row[totIdx]) || 1) : 1,
      nilai: nilaiIdx !== -1 && cleanSyncVal_(row[nilaiIdx]) ? String(row[nilaiIdx]).trim().toUpperCase() : "JAYYID",
      muhafiz: muhIdx !== -1 && cleanSyncVal_(row[muhIdx]) ? String(row[muhIdx]).trim() : "Ustadz Pembina",
      status_setoran: statusVal,
      catatan: catIdx !== -1 ? cleanSyncVal_(row[catIdx]) : null,
      created_at: crtIdx !== -1 ? formatSyncDateTimeIso_(row[crtIdx]) : formatSyncDateTimeIso_(new Date())
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/tahfidz_logs?on_conflict=log_id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC TAHFIDZ LOGS BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL TAHFIDZ LOGS] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "tahfidz_logs", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 3. Batch Sync Capaian Tahfidz (Tahfidz_Capaian -> Supabase tahfidz_capaian)
 */
function syncHistoricalTahfidzCapaianToSupabase(ss) {
  ss = ss || getDatabaseSpreadsheet();
  // Jalankan kalkulasi deduplikasi capaian terlebih dahulu jika tersedia
  if (typeof syncTahfidzCapaianSheet_ === "function") {
    try {
      syncTahfidzCapaianSheet_(ss);
    } catch (e) {
      console.warn("[SYNC CAPAIAN PRE-CALC WARN]", e);
    }
  }

  const sheet = ss.getSheetByName("Tahfidz_Capaian");
  if (!sheet || sheet.getLastRow() < 2) {
    return { domain: "tahfidz_capaian", total: 0, synced: 0, message: "Sheet Tahfidz_Capaian kosong atau tidak ditemukan." };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
  const sIdIdx = headers.findIndex(h => h === "studentid" || h === "id");
  const nameIdx = headers.findIndex(h => h === "studentname" || h === "nama");
  const juzIdx = headers.findIndex(h => h === "juzaktif" || h === "juz");
  const halIdx = headers.findIndex(h => h === "halamanfinal" || h === "halamanterakhir" || h === "halaman");
  const totTuntasIdx = headers.findIndex(h => h === "totalhalamantuntas");
  const stIdx = headers.findIndex(h => h === "statusterakhir" || h === "status");
  const hlqIdIdx = headers.findIndex(h => h === "halaqahid");
  const hlqNameIdx = headers.findIndex(h => h === "namahalaqah");
  const muhIdx = headers.findIndex(h => h === "muhafizpembina" || h === "muhafiz");
  const sabqiIdx = headers.findIndex(h => h === "sabqihalaman");
  const manzilJuzIdx = headers.findIndex(h => h === "manziljuz");
  const manzilHalIdx = headers.findIndex(h => h === "manzilhalaman");
  const putaranIdx = headers.findIndex(h => h === "manzilputaran");
  const totMurojaahIdx = headers.findIndex(h => h === "totalhalamanmurojaah");
  const updIdx = headers.findIndex(h => h === "updatedat");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sId = sIdIdx !== -1 ? cleanSyncVal_(row[sIdIdx]) : null;
    const sName = nameIdx !== -1 ? cleanSyncVal_(row[nameIdx]) : null;
    if (!sId) continue;

    records.push({
      student_id: String(sId).toUpperCase(),
      student_name: String(sName || sId),
      juz_aktif: juzIdx !== -1 && cleanSyncVal_(row[juzIdx]) ? String(row[juzIdx]) : "30",
      halaman_terakhir: halIdx !== -1 && cleanSyncVal_(row[halIdx]) ? String(row[halIdx]) : "1",
      total_halaman_tuntas: totTuntasIdx !== -1 ? (Number(row[totTuntasIdx]) || 0) : 0,
      status_terakhir: stIdx !== -1 && cleanSyncVal_(row[stIdx]) ? String(row[stIdx]) : "LANJUT",
      halaqah_id: hlqIdIdx !== -1 ? cleanSyncVal_(row[hlqIdIdx]) : null,
      nama_halaqah: hlqNameIdx !== -1 ? cleanSyncVal_(row[hlqNameIdx]) : null,
      muhafiz_pembina: muhIdx !== -1 ? cleanSyncVal_(row[muhIdx]) : null,
      sabqi_halaman: sabqiIdx !== -1 ? cleanSyncVal_(row[sabqiIdx]) : null,
      manzil_juz: manzilJuzIdx !== -1 ? cleanSyncVal_(row[manzilJuzIdx]) : null,
      manzil_halaman: manzilHalIdx !== -1 ? cleanSyncVal_(row[manzilHalIdx]) : null,
      manzil_putaran: putaranIdx !== -1 ? (Number(row[putaranIdx]) || 1) : 1,
      total_halaman_murojaah: totMurojaahIdx !== -1 ? (Number(row[totMurojaahIdx]) || 0) : 0,
      updated_at: updIdx !== -1 ? formatSyncDateTimeIso_(row[updIdx]) : formatSyncDateTimeIso_(new Date())
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/tahfidz_capaian?on_conflict=student_id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC CAPAIAN BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL CAPAIAN] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "tahfidz_capaian", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 4. Batch Sync Izin Perpulangan (Izin_Perpulangan -> Supabase izin_perpulangan)
 */
function syncHistoricalIzinPerpulanganToSupabase(ss) {
  ss = ss || getDatabaseSpreadsheet();
  const sheet = ss.getSheetByName("Izin_Perpulangan");
  if (!sheet || sheet.getLastRow() < 2) {
    return { domain: "izin_perpulangan", total: 0, synced: 0, message: "Sheet Izin_Perpulangan kosong atau tidak ditemukan." };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
  const idIdx = headers.findIndex(h => h === "idizin" || h === "id");
  const sIdIdx = headers.findIndex(h => h === "studentid");
  const nisIdx = headers.findIndex(h => h === "studentnis" || h === "nis");
  const nameIdx = headers.findIndex(h => h === "studentname" || h === "namasantri" || h === "nama");
  const wIdIdx = headers.findIndex(h => h === "waliid");
  const wNameIdx = headers.findIndex(h => h === "waliname" || h === "namawali");
  const wPhoneIdx = headers.findIndex(h => h === "waliphone" || h === "nowawali" || h === "hpwali");
  const katIdx = headers.findIndex(h => h === "kategori");
  const alasanIdx = headers.findIndex(h => h === "alasan" || h === "keperluan");
  const mulIdx = headers.findIndex(h => h === "tglmulai" || h === "tanggalmulai");
  const jamMulaiIdx = headers.findIndex(h => h === "jammulai");
  const selIdx = headers.findIndex(h => h === "tglkembali" || h === "tanggalkembali" || h === "tanggalselesai");
  const jamKembaliIdx = headers.findIndex(h => h === "jamkembali");
  const stIdx = headers.findIndex(h => h === "status");
  const pJemputIdx = headers.findIndex(h => h === "namapenjemput" || h === "penjemputnama");
  const pHubIdx = headers.findIndex(h => h === "hubunganpenjemput" || h === "penjemputhubungan" || h === "penjemputstatus");
  const pKontakIdx = headers.findIndex(h => h === "kontakpenjemput" || h === "penjemputkontak");
  const crtIdx = headers.findIndex(h => h === "createdat");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let idIzin = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    let sId = sIdIdx !== -1 ? cleanSyncVal_(row[sIdIdx]) : null;
    const sNis = nisIdx !== -1 ? cleanSyncVal_(row[nisIdx]) : null;
    const sName = nameIdx !== -1 ? cleanSyncVal_(row[nameIdx]) : null;

    if (!idIzin && !sName) continue;
    if (!idIzin) idIzin = "IZN-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-" + Utilities.getUuid().substring(0, 4).toUpperCase();
    if (!sId) sId = sNis ? ("STD_" + sNis) : "STD_UNKNOWN";

    const tglMulaiVal = mulIdx !== -1 ? (formatSyncDateIso_(row[mulIdx]) || "2026-01-01") : "2026-01-01";
    const tglKembaliVal = selIdx !== -1 ? (formatSyncDateIso_(row[selIdx]) || tglMulaiVal) : tglMulaiVal;
    const alasanVal = alasanIdx !== -1 && cleanSyncVal_(row[alasanIdx]) ? String(row[alasanIdx]).trim() : "Izin perpulangan santri";

    records.push({
      id_izin: String(idIzin),
      student_id: String(sId),
      student_nis: String(sNis || sId),
      student_name: String(sName || "Santri"),
      wali_id: wIdIdx !== -1 && cleanSyncVal_(row[wIdIdx]) ? String(row[wIdIdx]) : "WALI_SYSTEM",
      wali_name: wNameIdx !== -1 && cleanSyncVal_(row[wNameIdx]) ? String(row[wNameIdx]).trim().substring(0, 255) : null,
      wali_phone: wPhoneIdx !== -1 && cleanSyncVal_(row[wPhoneIdx]) ? String(row[wPhoneIdx]).trim().substring(0, 32) : null,
      kategori: normalizeSyncIzinKategori_(katIdx !== -1 ? row[katIdx] : null),
      alasan: alasanVal,
      penjemput_nama: pJemputIdx !== -1 && cleanSyncVal_(row[pJemputIdx]) ? String(row[pJemputIdx]).trim().substring(0, 128) : null,
      penjemput_hubungan: pHubIdx !== -1 && cleanSyncVal_(row[pHubIdx]) ? String(row[pHubIdx]).trim().substring(0, 64) : "Orang Tua",
      penjemput_kontak: pKontakIdx !== -1 && cleanSyncVal_(row[pKontakIdx]) ? String(row[pKontakIdx]).trim().substring(0, 32) : null,
      tgl_mulai: tglMulaiVal,
      jam_mulai: formatSyncTimeHHmm_(jamMulaiIdx !== -1 ? row[jamMulaiIdx] : null, "08:00"),
      tgl_kembali: tglKembaliVal,
      jam_kembali: formatSyncTimeHHmm_(jamKembaliIdx !== -1 ? row[jamKembaliIdx] : null, "17:00"),
      status: normalizeSyncIzinStatus_(stIdx !== -1 ? row[stIdx] : null),
      created_at: crtIdx !== -1 ? formatSyncDateTimeIso_(row[crtIdx]) : formatSyncDateTimeIso_(new Date())
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/izin_perpulangan?on_conflict=id_izin", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC IZIN BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL IZIN] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "izin_perpulangan", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 5. Batch Sync Pegawai (Pegawai -> Supabase pegawai)
 */
function syncHistoricalPegawaiToSupabase(ss) {
  ss = ss || getDatabaseSpreadsheet();
  const sheet = ss.getSheetByName("Pegawai");
  if (!sheet || sheet.getLastRow() < 2) {
    return { domain: "pegawai", total: 0, synced: 0, message: "Sheet Pegawai kosong atau tidak ditemukan." };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
  const idIdx = headers.findIndex(h => h === "employeeid" || h === "pegawaiid" || h === "id");
  const nameIdx = headers.findIndex(h => h === "nama" || h === "name");
  const nipIdx = headers.findIndex(h => h === "nip");
  const genderIdx = headers.findIndex(h => h === "gender" || h === "jeniskelamin");
  const jabIdx = headers.findIndex(h => h === "jabatan");
  const specIdx = headers.findIndex(h => h === "spesialisasi" || h === "unit");
  const phoneIdx = headers.findIndex(h => h === "telepon" || h === "phone" || h === "hp");
  const emailIdx = headers.findIndex(h => h === "email");
  const stIdx = headers.findIndex(h => h === "status");
  const crtIdx = headers.findIndex(h => h === "createdat");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let id = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    const name = nameIdx !== -1 ? cleanSyncVal_(row[nameIdx]) : null;
    if (!id && !name) continue;
    if (!id) id = "PEG_" + Utilities.getUuid().replace(/-/g, "").substring(0, 8);

    records.push({
      employee_id: String(id),
      nama: String(name || "Pegawai"),
      nip: nipIdx !== -1 ? cleanSyncVal_(row[nipIdx]) : null,
      gender: genderIdx !== -1 ? normalizeSyncGender_(row[genderIdx]) : "Putra",
      jabatan: jabIdx !== -1 && cleanSyncVal_(row[jabIdx]) ? String(row[jabIdx]).trim() : "Asatidz",
      spesialisasi: specIdx !== -1 ? cleanSyncVal_(row[specIdx]) : null,
      telepon: phoneIdx !== -1 ? cleanSyncVal_(row[phoneIdx]) : null,
      email: emailIdx !== -1 ? cleanSyncVal_(row[emailIdx]) : null,
      status: stIdx !== -1 && cleanSyncVal_(row[stIdx]) ? String(row[stIdx]).trim().toUpperCase() : "AKTIF",
      created_at: crtIdx !== -1 ? formatSyncDateTimeIso_(row[crtIdx]) : formatSyncDateTimeIso_(new Date())
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/pegawai?on_conflict=employee_id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC PEGAWAI BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL PEGAWAI] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "pegawai", total: records.length, synced: totalSynced, errors: errors };
}



/**
 * 5f. Sinkronisasi Historis Berita & Artikel ke Supabase
 */
function syncHistoricalBeritaToSupabase(ss) {
  if (!ss) ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName("Berita") || ss.getSheetByName("Kabar");
  if (!sheet) {
    const sheets = ss.getSheets();
    for (let s of sheets) {
      const name = s.getName().trim().toLowerCase();
      if (name === "berita" || name === "kabar") {
        sheet = s;
        break;
      }
    }
  }

  if (!sheet) {
    console.warn("Sheet Berita tidak ditemukan.");
    return { domain: "berita", total: 0, synced: 0, errors: ["Sheet Berita tidak ditemukan"] };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { domain: "berita", total: 0, synced: 0, errors: [] };
  }

  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""));

  const idIdx = headers.findIndex(h => h === "newsid" || h === "id");
  const slugIdx = headers.findIndex(h => h === "slug");
  const dateIdx = headers.findIndex(h => h === "tanggal" || h === "date");
  const judulIdx = headers.findIndex(h => h === "judul" || h === "title");
  const katIdx = headers.findIndex(h => h === "kategori" || h === "category");
  const penulisIdx = headers.findIndex(h => h === "penulis" || h === "author");
  const imgIdx = headers.findIndex(h => h === "gambarurl" || h === "gambar" || h === "fotourl" || h === "foto");
  const ringkasanIdx = headers.findIndex(h => h === "ringkasan" || h === "excerpt" || h === "summary");
  const isiIdx = headers.findIndex(h => h === "isi" || h === "konten" || h === "content");
  const viewsIdx = headers.findIndex(h => h === "views" || h === "view");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let newsId = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    let slug = slugIdx !== -1 ? cleanSyncVal_(row[slugIdx]) : null;
    let judul = judulIdx !== -1 ? cleanSyncVal_(row[judulIdx]) : null;
    let isi = isiIdx !== -1 ? cleanSyncVal_(row[isiIdx]) : null;

    if (!judul && !isi) continue;
    if (!newsId) {
      newsId = "NWS_" + new Date().getTime() + "_" + Math.random().toString(36).substring(2, 6);
    }
    if (!slug) {
      slug = String(judul || newsId).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") + "-" + newsId.slice(-4);
    }

    const rawDate = dateIdx !== -1 ? row[dateIdx] : null;
    const formattedDate = rawDate ? formatDate(rawDate) : formatDate(new Date());
    const createdAtIso = rawDate ? formatSyncDateTimeIso_(rawDate) : formatSyncDateTimeIso_(new Date());
    const imgUrl = imgIdx !== -1 ? cleanSyncVal_(row[imgIdx]) : "";

    records.push({
      news_id: String(newsId),
      slug: String(slug),
      tanggal: String(formattedDate),
      judul: String(judul || "Berita"),
      kategori: katIdx !== -1 && cleanSyncVal_(row[katIdx]) ? String(row[katIdx]).trim() : "Berita",
      penulis: penulisIdx !== -1 && cleanSyncVal_(row[penulisIdx]) ? String(row[penulisIdx]).trim() : "Admin",
      gambar_url: imgUrl || "",
      foto_url: imgUrl || "",
      ringkasan: ringkasanIdx !== -1 ? cleanSyncVal_(row[ringkasanIdx]) : "",
      isi: String(isi || ""),
      status: "Publish",
      views: viewsIdx !== -1 ? (Number(row[viewsIdx]) || 0) : 0,
      created_at: createdAtIso
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 25;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/berita?on_conflict=news_id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC BERITA BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL BERITA] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "berita", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 5g. Sinkronisasi Historis Notifikasi ke Supabase
 */
function syncHistoricalNotifikasiToSupabase(ss) {
  if (!ss) ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName("Notifikasi");
  if (!sheet && typeof ss.getSheets === "function") {
    const sheets = ss.getSheets();
    for (let s of sheets) {
      const name = s.getName().trim().toLowerCase();
      if (name === "notifikasi") {
        sheet = s;
        break;
      }
    }
  }

  if (!sheet) {
    console.warn("Sheet Notifikasi tidak ditemukan.");
    return { domain: "notifikasi", total: 0, synced: 0, errors: [] };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { domain: "notifikasi", total: 0, synced: 0, errors: [] };
  }

  const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""));

  const idIdx = headers.findIndex(h => h === "id" || h === "notifid");
  const judulIdx = headers.findIndex(h => h === "judul" || h === "title");
  const katIdx = headers.findIndex(h => h === "kategori" || h === "category");
  const tglIdx = headers.findIndex(h => h === "tanggal" || h === "date");
  const ringkasanIdx = headers.findIndex(h => h === "ringkasan" || h === "summary");
  const isiIdx = headers.findIndex(h => h === "isi" || h === "content");
  const imgIdx = headers.findIndex(h => h === "gambarurl" || h === "gambar" || h === "foto");
  const popupIdx = headers.findIndex(h => h === "ispopup" || h === "popup");
  const statusIdx = headers.findIndex(h => h === "status");
  const createdIdx = headers.findIndex(h => h === "createdat" || h === "created");

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let notifId = idIdx !== -1 ? cleanSyncVal_(row[idIdx]) : null;
    let judul = judulIdx !== -1 ? cleanSyncVal_(row[judulIdx]) : null;
    let isi = isiIdx !== -1 ? cleanSyncVal_(row[isiIdx]) : null;

    if (!judul && !isi) continue;
    if (!notifId) {
      notifId = "NOTIF_" + new Date().getTime() + "_" + i;
    }

    const rawDate = tglIdx !== -1 ? row[tglIdx] : null;
    const formattedDate = rawDate ? (rawDate instanceof Date ? Utilities.formatDate(rawDate, "GMT+7", "yyyy-MM-dd") : String(rawDate).trim()) : Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const rawCreated = createdIdx !== -1 ? row[createdIdx] : null;
    const createdAtIso = rawCreated ? (rawCreated instanceof Date ? rawCreated.toISOString() : String(rawCreated).trim()) : new Date().toISOString();
    const rawPopup = popupIdx !== -1 ? row[popupIdx] : 0;
    const isPopupVal = (rawPopup === 1 || String(rawPopup).toLowerCase() === "true" || String(rawPopup) === "1");
    const statusVal = (statusIdx !== -1 && String(row[statusIdx]).trim() === "Nonaktif") ? "Nonaktif" : "Aktif";

    records.push({
      id: String(notifId),
      judul: String(judul || "Pengumuman"),
      kategori: katIdx !== -1 && cleanSyncVal_(row[katIdx]) ? String(row[katIdx]).trim() : "Pengumuman",
      tanggal: formattedDate,
      ringkasan: ringkasanIdx !== -1 && cleanSyncVal_(row[ringkasanIdx]) ? String(row[ringkasanIdx]).trim() : null,
      isi: String(isi || ""),
      gambar_url: imgIdx !== -1 && cleanSyncVal_(row[imgIdx]) ? String(row[imgIdx]).trim() : null,
      is_popup: isPopupVal,
      status: statusVal,
      created_at: createdAtIso
    });
  }

  let totalSynced = 0;
  const errors = [];
  const BATCH_SIZE = 25;

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase("/rest/v1/notifikasi?on_conflict=id", "POST", batch);
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC NOTIFIKASI BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL NOTIFIKASI] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "notifikasi", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * 5h. Rekonsiliasi Izin Asatidz & Badal Mengajar (Sheets: 'Izin_Asatidz' -> Supabase: 'izin_asatidz')
 */
function syncHistoricalIzinAsatidzToSupabase(ss) {
  const sheet = ss.getSheetByName("Izin_Asatidz");
  if (!sheet) {
    console.warn("[SYNC IZIN ASATIDZ] Sheet 'Izin_Asatidz' tidak ditemukan.");
    return { domain: "izin_asatidz", total: 0, synced: 0, skipped: 0, errors: ["Sheet 'Izin_Asatidz' tidak ditemukan"] };
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { domain: "izin_asatidz", total: 0, synced: 0, skipped: 0, errors: [] };
  }

  const headers = values[0].map(h => String(h || "").trim().toLowerCase());
  const col = {};
  headers.forEach((h, idx) => { col[h] = idx; });

  const records = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const idIzin = String(row[col["id_izin"]] || "").trim();
    if (!idIzin) continue;

    const rawTglMulai = row[col["tanggal_mulai"]];
    const rawTglSelesai = row[col["tanggal_selesai"]] || rawTglMulai;
    const tglMulai = formatSyncDateIso_(rawTglMulai) || String(rawTglMulai || "").substring(0, 10);
    const tglSelesai = formatSyncDateIso_(rawTglSelesai) || tglMulai;

    const rawCreatedAt = row[col["created_at"]];
    const rawUpdatedAt = row[col["updated_at"]];
    const createdAt = formatSyncDateTimeIso_(rawCreatedAt) || new Date().toISOString();
    const updatedAt = formatSyncDateTimeIso_(rawUpdatedAt) || createdAt;

    const rawApprovedAt = row[col["pengasuh_approved_at"]];
    const approvedAt = rawApprovedAt ? formatSyncDateTimeIso_(rawApprovedAt) : null;

    records.push({
      id_izin: idIzin,
      asatidz_id: String(row[col["asatidz_id"]] || "").trim(),
      nama_asatidz: String(row[col["nama_asatidz"]] || "").trim(),
      tanggal_mulai: tglMulai,
      tanggal_selesai: tglSelesai,
      sesi: String(row[col["sesi"]] || "FULL_DAY").trim(),
      kategori: String(row[col["kategori"]] || "Izin").trim(),
      alasan: String(row[col["alasan"]] || "").trim(),
      badal_id: String(row[col["badal_id"]] || "").trim(),
      nama_badal: String(row[col["nama_badal"]] || "").trim(),
      catatan_badal: String(row[col["catatan_badal"]] || "").trim(),
      lampiran_url: String(row[col["lampiran_url"]] || "").trim(),
      status: String(row[col["status"]] || "PENDING").trim().toUpperCase(),
      pengasuh_approved_by: String(row[col["pengasuh_approved_by"]] || "").trim(),
      pengasuh_approved_at: approvedAt,
      catatan_pengasuh: String(row[col["catatan_pengasuh"]] || "").trim(),
      created_at: createdAt,
      updated_at: updatedAt
    });
  }

  const BATCH_SIZE = 100;
  let totalSynced = 0;
  const errors = [];

  // Bersihkan data sampah / orphan tanpa id_izin di Supabase
  try {
    replicateToSupabase("/rest/v1/izin_asatidz?id_izin=eq.", "DELETE");
  } catch (cleanErr) {
    console.warn("[SYNC IZIN ASATIDZ CLEAN ERROR]", cleanErr);
  }

  for (let b = 0; b < records.length; b += BATCH_SIZE) {
    const batch = records.slice(b, b + BATCH_SIZE);
    const res = replicateToSupabase(
      "/rest/v1/izin_asatidz?on_conflict=id_izin",
      "POST",
      batch
    );
    if (res.success) {
      totalSynced += batch.length;
    } else {
      errors.push(`Batch ${b / BATCH_SIZE + 1} gagal: ${res.error || res.status}`);
      console.warn(`[SYNC IZIN ASATIDZ BATCH ERROR]`, res);
    }
  }

  console.log(`[SYNC HISTORICAL IZIN ASATIDZ] Total: ${records.length}, Terkirim: ${totalSynced}, Gagal: ${errors.length}`);
  return { domain: "izin_asatidz", total: records.length, synced: totalSynced, errors: errors };
}

/**
 * Helper Mandiri: Jalankan sinkronisasi Izin Asatidz langsung dari Apps Script Editor tanpa parameter
 */
function syncIzinAsatidzSheetToSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = syncHistoricalIzinAsatidzToSupabase(ss);
  Logger.log("✅ [SYNC IZIN ASATIDZ] Hasil: " + JSON.stringify(res));
  return res;
}

/**
 * Helper Mandiri: Jalankan sinkronisasi Notifikasi langsung dari Apps Script Editor tanpa parameter
 */
function syncNotifikasiSheetToSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = syncHistoricalNotifikasiToSupabase(ss);
  Logger.log("✅ [SYNC NOTIFIKASI] Hasil: " + JSON.stringify(res));
  return res;
}

/**
 * 6. Master Orchestrator: Eksekusi Rekonsiliasi Seluruh Data Historis
 */
function syncAllHistoricalSheetsToSupabase() {
  const startTime = new Date().getTime();
  Logger.log("🚀 ========================================================");
  Logger.log("   MEMULAI SINKRONISASI BATCH HISTORIS GOOGLE SHEETS -> SUPABASE");
  Logger.log("   ========================================================");

  const config = getSupabaseServerConfig();
  if (!config.isConfigured) {
    const msg = "❌ SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di ScriptProperties. Jalankan setupSupabaseServiceRole(key) terlebih dahulu.";
    Logger.log(msg);
    return { success: false, message: msg };
  }

  const ss = getDatabaseSpreadsheet();
  const summary = {
    started_at: new Date().toISOString(),
    domains: {}
  };

  try {
    Logger.log("\n📦 1. Menyinkronkan Master Santri...");
    summary.domains.students = syncHistoricalStudentsToSupabase(ss);

    Logger.log("\n📦 2. Menyinkronkan Log Setoran Tahfidz...");
    summary.domains.tahfidz_logs = syncHistoricalTahfidzLogsToSupabase(ss);

    Logger.log("\n📦 3. Menyinkronkan Capaian Tahfidz Santri...");
    summary.domains.tahfidz_capaian = syncHistoricalTahfidzCapaianToSupabase(ss);

    Logger.log("\n📦 4. Menyinkronkan Izin Perpulangan...");
    summary.domains.izin_perpulangan = syncHistoricalIzinPerpulanganToSupabase(ss);

    Logger.log("\n📦 5. Menyinkronkan Data Pegawai / Asatidz...");
    summary.domains.pegawai = syncHistoricalPegawaiToSupabase(ss);

    Logger.log("\n📦 6. Menyinkronkan Berita & Artikel...");
    summary.domains.berita = syncHistoricalBeritaToSupabase(ss);

    Logger.log("\n📦 7. Menyinkronkan Notifikasi & Pengumuman...");
    summary.domains.notifikasi = syncHistoricalNotifikasiToSupabase(ss);

    Logger.log("\n📦 8. Menyinkronkan Izin Asatidz & Badal...");
    summary.domains.izin_asatidz = syncHistoricalIzinAsatidzToSupabase(ss);

    const durationSec = Math.round((new Date().getTime() - startTime) / 1000);
    summary.completed_at = new Date().toISOString();
    summary.duration_seconds = durationSec;

    let grandTotal = 0;
    let grandSynced = 0;
    Object.keys(summary.domains).forEach(k => {
      grandTotal += (summary.domains[k].total || 0);
      grandSynced += (summary.domains[k].synced || 0);
    });

    summary.success = true;
    summary.grand_total_records = grandTotal;
    summary.grand_total_synced = grandSynced;

    Logger.log("\n🎉 ========================================================");
    Logger.log(`   REKONSILIASI SELESAI DALAM ${durationSec} DETIK!`);
    Logger.log(`   Total Record Diproses: ${grandTotal}`);
    Logger.log(`   Total Record Berhasil Terkirim: ${grandSynced}`);
    Logger.log("   ========================================================");

    return summary;
  } catch (err) {
    Logger.log("❌ Terjadi kegagalan kritis pada orchestrator rekonsiliasi: " + err.message);
    summary.success = false;
    summary.error = err.message;
    return summary;
  }
}

/**
 * 7. Menu UI Interaktif di Google Spreadsheet
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("PPTQ Asnawiyyah")
      .addItem("🔄 Sinkronkan Seluruh Riwayat ke Supabase", "syncAllHistoricalSheetsToSupabase")
      .addSeparator()
      .addItem("👥 Sinkronkan Master Santri", "syncHistoricalStudentsToSupabase")
      .addItem("📖 Sinkronkan Capaian Tahfidz", "syncHistoricalTahfidzCapaianToSupabase")
      .addItem("📜 Sinkronkan Log Tahfidz", "syncHistoricalTahfidzLogsToSupabase")
      .addItem("🚗 Sinkronkan Izin Perpulangan", "syncHistoricalIzinPerpulanganToSupabase")
      .addItem("👔 Sinkronkan Data Pegawai / Asatidz", "syncHistoricalPegawaiToSupabase")
      .addItem("📰 Sinkronkan Berita & Artikel", "syncHistoricalBeritaToSupabase")
      .addItem("🔔 Sinkronkan Notifikasi & Pengumuman", "syncNotifikasiSheetToSupabase")
      .addItem("👨‍🏫 Sinkronkan Izin Asatidz & Badal", "syncIzinAsatidzSheetToSupabase")
      .addToUi();
  } catch (e) {
    // onOpen berjalan non-blokir jika dipanggil dalam konteks headless/API
  }
}

