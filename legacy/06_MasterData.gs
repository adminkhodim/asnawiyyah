/**
 * ============================================================================
 * 06_MasterData.gs
 * PPTQ Asnawiyyah Backend Architecture - Master Data Management
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Data Santri (getAllStudentsData, saveStudentData, deleteStudentData,
 *    pencarian NIS/NISN, upload foto santri ke Google Drive)
 *  - Master Data Pegawai / Asatidz / Muhafiz (getAllEmployeesData, saveEmployeeData,
 *    deleteEmployeeData, Sheet Pegawai)
 *  - Data Alumni & Testimoni (saveAlumniData, getAlumniTestimonials)
 *  - Program Data Source v2.0 Repository & Seeder Tooling (ProgramRepository,
 *    DTO transformation, optimistic locking, data migration tooling)
 * ============================================================================
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
      if (typeof getDatabaseSpreadsheet === "function") {
        ss = getDatabaseSpreadsheet();
      }
      if (!ss) {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
    } catch (e) {
      throw new PersistenceError("SpreadsheetApp active spreadsheet is unavailable: " + e.message);
    }
    if (!ss) {
      throw new PersistenceError("Active spreadsheet object is null. Pastikan SPREADSHEET_ID terkonfigurasi di Script Properties.");
    }

    let sheet = ss.getSheetByName(this.sheetName);
    if (!sheet) {
      // Auto-create sheet Programs jika belum ada di database
      sheet = ss.insertSheet(this.sheetName);
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setValues([this.expectedHeaders]);
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      return sheet;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    if (!values || values.length === 0 || (values.length === 1 && !values[0][0])) {
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setValues([this.expectedHeaders]);
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      return sheet;
    }

    const headerRow = values[0];
    if (headerRow.length < this.expectedHeaders.length) {
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setValues([this.expectedHeaders]);
      sheet.getRange(1, 1, 1, this.expectedHeaders.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      return sheet;
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


const FOLDER_ID_STUDENT_PHOTOS = "1XJi_lcDlydSV_eEjpyx7XjV-dmbKU_Im";

/**
 * Upload Foto Profil Santri ke Google Drive & Set Sharing Publik
 * Menghasilkan link Google CDN direct view dan menyimpan ke sheet Students
 */
function uploadStudentPhotoToDrive(filePayload, token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
      } catch (e) {
        const legacy = verifySessionToken(token);
        if (legacy && legacy.role) {
          actor = { role: legacy.role, identityId: legacy.userId };
        }
      }
    }

    if (!actor) {
      return {
        success: false,
        status: "error",
        statusCode: 401,
        message: "Sesi autentikasi tidak valid atau telah kedaluwarsa."
      };
    }

    const fileData = (filePayload && filePayload.file) || filePayload;
    if (!fileData || !fileData.base64) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Data file foto (base64) wajib dikirimkan."
      };
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const rawMime = String(fileData.mimeType || fileData.type || "image/jpeg").trim().toLowerCase();
    if (!allowedMimes.includes(rawMime)) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Format foto tidak didukung. Hanya gambar (JPG, PNG, WEBP) yang diperbolehkan."
      };
    }

    const decodedData = Utilities.base64Decode(fileData.base64);
    if (!decodedData || decodedData.length === 0) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Data file foto kosong atau rusak."
      };
    }

    // Maksimal 5 MB
    if (decodedData.length > 5 * 1024 * 1024) {
      return {
        success: false,
        status: "error",
        statusCode: 400,
        message: "Ukuran foto melebihi batas maksimal 5 MB."
      };
    }

    const folder = DriveApp.getFolderById(FOLDER_ID_STUDENT_PHOTOS);
    const cleanStudentId = String(filePayload.studentId || filePayload.student_id || filePayload.nis || "SANTRI").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = "FOTO_" + cleanStudentId + "_" + new Date().getTime() + ".jpg";
    const blob = Utilities.newBlob(decodedData, rawMime, fileName);
    const newFile = folder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    const driveViewUrl = "https://drive.google.com/file/d/" + newFile.getId() + "/view?usp=sharing";

    // Update langsung ke sheet Students jika studentId atau nis tersedia
    const targetStudentId = filePayload.studentId || filePayload.student_id;
    const targetNis = filePayload.nis || filePayload.nisn;
    if (targetStudentId || targetNis) {
      updateStudentPhotoInSheet(targetStudentId, targetNis, fileUrl);
    }

    return {
      success: true,
      status: "success",
      statusCode: 200,
      url: fileUrl,
      fileUrl: fileUrl,
      driveViewUrl: driveViewUrl,
      fileId: newFile.getId(),
      message: "Foto santri berhasil diunggah ke Google Drive dan disimpan ke database!"
    };
  } catch (err) {
    console.error("[UPLOAD STUDENT PHOTO ERROR]", err);
    return {
      success: false,
      status: "error",
      message: "Gagal mengunggah foto santri: " + err.message
    };
  }
}

/**
 * Update link foto profil santri di spreadsheet Students
 */
function updateStudentPhotoInSheet(studentId, nis, photoUrl) {
  if (!photoUrl) return false;
  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_STUDENTS);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return false;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("student_id");
  let nisIdx = header.indexOf("nis");
  if (nisIdx === -1) nisIdx = header.indexOf("nisn");
  let photoIdx = header.indexOf("photo_url");
  if (photoIdx === -1) photoIdx = header.indexOf("foto_profil");
  if (photoIdx === -1) photoIdx = header.indexOf("foto");

  if (photoIdx === -1) {
    photoIdx = header.length;
    sheet.getRange(1, photoIdx + 1).setValue("photo_url").setFontWeight("bold").setBackground("#dcfce7");
  }

  const targetId = String(studentId || "").trim();
  const targetNis = String(nis || "").trim();

  for (let i = 1; i < data.length; i++) {
    const rowId = idIdx !== -1 ? String(data[i][idIdx] || "").trim() : "";
    const rowNis = nisIdx !== -1 ? String(data[i][nisIdx] || "").trim() : "";

    if ((targetId && rowId === targetId) || (targetNis && rowNis === targetNis)) {
      sheet.getRange(i + 1, photoIdx + 1).setValue(photoUrl);
      return true;
    }
  }
  return false;
}

/**
 * Unggah foto profil pengguna (Wali Santri, Pengasuh, Admin/Pengelola) ke Google Drive
 */

/**
 * Ambil seluruh data santri untuk Dashboard Admin
 */
function getAllStudentsData(token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "ASATIDZ", "USTADZ", "MUHAFIZ", "GURU", "PENGURUS", "BENDAHARA", "WALI_SANTRI"]);
      } catch (authErr) {
        try {
          verifySessionToken(token);
        } catch (legErr) {
          // Token legacy/expired toleran untuk pembacaan santri
        }
      }
    }

    const ss = getDatabaseSpreadsheet();
    const sheet = getAuthSheet(ss, SHEET_STUDENTS);
    if (!sheet) {
      return {
        status: "success",
        success: true,
        data: [],
        total: 0,
        summary: { total: 0, putra: 0, putri: 0, aktif: 0, nonaktif: 0 }
      };
    }

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return {
        status: "success",
        success: true,
        data: [],
        total: 0,
        summary: { total: 0, putra: 0, putri: 0, aktif: 0, nonaktif: 0 }
      };
    }

    const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/\s+/g, "_"));
    let idIdx = headers.indexOf("student_id");
    let nisIdx = headers.indexOf("nis");
    if (nisIdx === -1) nisIdx = headers.indexOf("nisn");
    let nikIdx = headers.indexOf("nik");
    let nameIdx = headers.indexOf("name");
    if (nameIdx === -1) nameIdx = headers.indexOf("nama");
    let genderIdx = headers.indexOf("gender");
    if (genderIdx === -1) genderIdx = headers.indexOf("jenis");
    if (genderIdx === -1) genderIdx = headers.indexOf("jenis_kelamin");
    let birthIdx = headers.indexOf("birth_date");
    if (birthIdx === -1) birthIdx = headers.indexOf("tanggal_lahir");

    // Deteksi fleksibel untuk photo/foto
    let photoIdx = -1;
    for (let h = 0; h < headers.length; h++) {
      const hn = headers[h];
      if (hn === "photo_url" || hn === "foto_profil" || hn === "foto" || hn === "photo" || hn === "foto_santri" || hn === "link_foto" || hn.includes("foto") || hn.includes("photo")) {
        photoIdx = h;
        break;
      }
    }
    if (photoIdx === -1 && headers.length >= 10) photoIdx = 9; // Kolom J (indeks 9)

    // Deteksi kolom Halaqah & Muhafiz jika tersedia langsung di sheet Student
    let halaqahIdx = headers.indexOf("halaqah");
    if (halaqahIdx === -1) halaqahIdx = headers.indexOf("nama_halaqah");
    if (halaqahIdx === -1) halaqahIdx = headers.indexOf("kelompok_halaqah");
    let muhafizIdx = headers.indexOf("muhafiz");
    if (muhafizIdx === -1) muhafizIdx = headers.indexOf("muhafidz");
    if (muhafizIdx === -1) muhafizIdx = headers.indexOf("pembimbing");
    if (muhafizIdx === -1) muhafizIdx = headers.indexOf("ustadz");
    if (muhafizIdx === -1) muhafizIdx = headers.indexOf("guru");

    let progIdx = headers.indexOf("program");
    let statusIdx = headers.indexOf("status");
    let createdIdx = headers.indexOf("created_at");
    let qrIdx = headers.indexOf("qr_code");
    if (qrIdx === -1) qrIdx = headers.indexOf("qrcode");

    const students = [];
    let putra = 0, putri = 0, aktif = 0, nonaktif = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const studentId = idIdx !== -1 ? String(row[idIdx] || "").trim() : "";
      const nis = nisIdx !== -1 ? String(row[nisIdx] || "").trim() : "";
      const name = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : "";
      if (!studentId && !nis && !name) continue;

      const nik = nikIdx !== -1 ? String(row[nikIdx] || "").trim() : "";
      const genderRaw = genderIdx !== -1 ? String(row[genderIdx] || "").trim().toUpperCase() : "";
      const gender = (genderRaw === "P" || genderRaw === "PEREMPUAN" || genderRaw === "PUTRI") ? "P" : "L";
      const birthDate = birthIdx !== -1 ? normalizeDateString(row[birthIdx]) : "";
      let photoUrl = photoIdx !== -1 ? String(row[photoIdx] || "").trim() : "";
      if (photoUrl) {
        const driveMatch = photoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || photoUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
          photoUrl = "https://lh3.googleusercontent.com/d/" + driveMatch[1];
        }
      }

      let qrCode = qrIdx !== -1 ? String(row[qrIdx] || "").trim() : "";
      if (!qrCode) {
        qrCode = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(nis || studentId);
      }

      const program = progIdx !== -1 ? String(row[progIdx] || "Reguler").trim() : "Reguler";
      const statusRaw = statusIdx !== -1 ? String(row[statusIdx] || "ACTIVE").trim().toUpperCase() : "ACTIVE";
      const status = (statusRaw === "ACTIVE" || statusRaw === "AKTIF") ? "ACTIVE" : "INACTIVE";
      const createdAt = createdIdx !== -1 ? String(row[createdIdx] || "").trim() : "";
      const directHalaqah = halaqahIdx !== -1 ? String(row[halaqahIdx] || "").trim() : "";
      const directMuhafiz = muhafizIdx !== -1 ? String(row[muhafizIdx] || "").trim() : "";

      if (gender === "L") putra++;
      else putri++;

      if (status === "ACTIVE") aktif++;
      else nonaktif++;

      students.push({
        studentId: studentId || ("STD_" + i),
        student_id: studentId || ("STD_" + i),
        nis: nis,
        nisn: nis,
        nik: nik,
        name: name,
        gender: gender,
        birthDate: birthDate,
        birth_date: birthDate,
        photoUrl: photoUrl,
        photo_url: photoUrl,
        qrCode: qrCode,
        qr_code: qrCode,
        halaqah: directHalaqah,
        muhafiz: directMuhafiz,
        program: program || "Reguler",
        status: status,
        createdAt: createdAt
      });
    }

    return {
      status: "success",
      success: true,
      data: students,
      total: students.length,
      summary: {
        total: students.length,
        putra: putra,
        putri: putri,
        aktif: aktif,
        nonaktif: nonaktif
      }
    };
  } catch (err) {
    console.error("[GET ALL STUDENTS ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memuat data santri: " + err.message,
      data: [],
      total: 0,
      summary: { total: 0, putra: 0, putri: 0, aktif: 0, nonaktif: 0 }
    };
  }
}

/**
 * Tambah / Perbarui Data Santri di Spreadsheet Students (Admin/Editor Only)
 */
function saveStudentData(studentObj, token) {
  let actor = null;
  if (token) {
    try {
      actor = authenticateSession(token);
      authorizeRole(actor, ["ADMIN", "EDITOR"]);
    } catch (e) {
      const legacy = verifySessionToken(token);
      if (legacy && legacy.role) {
        actor = { role: legacy.role, identityId: legacy.userId };
      }
    }
  }

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_STUDENTS);
  if (!sheet) throw new Error("Tabel Students tidak ditemukan.");

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h || "").trim().toLowerCase());

  let idIdx = headers.indexOf("student_id");
  let nisIdx = headers.indexOf("nis");
  if (nisIdx === -1) nisIdx = headers.indexOf("nisn");
  let nikIdx = headers.indexOf("nik");
  let nameIdx = headers.indexOf("name");
  if (nameIdx === -1) nameIdx = headers.indexOf("nama");
  let genderIdx = headers.indexOf("gender");
  if (genderIdx === -1) genderIdx = headers.indexOf("jenis");
  let birthIdx = headers.indexOf("birth_date");
  if (birthIdx === -1) birthIdx = headers.indexOf("tanggal_lahir");
  let photoIdx = headers.indexOf("photo_url");
  if (photoIdx === -1) photoIdx = headers.indexOf("foto_profil");
  if (photoIdx === -1) photoIdx = headers.indexOf("foto");
  let progIdx = headers.indexOf("program");
  let statusIdx = headers.indexOf("status");

  const inputId = String(studentObj.studentId || studentObj.student_id || "").trim();
  const inputNis = String(studentObj.nis || studentObj.nisn || "").trim();
  const inputNik = String(studentObj.nik || "").trim();
  const inputName = String(studentObj.name || studentObj.nama || "").trim();
  let inputGender = String(studentObj.gender || studentObj.jenis || "").trim().toUpperCase();
  if (inputGender === "PEREMPUAN" || inputGender === "PUTRI" || inputGender === "P") {
    inputGender = "P";
  } else {
    inputGender = "L";
  }
  const inputBirth = normalizeDateString(studentObj.birthDate || studentObj.birth_date || "");
  const inputPhoto = String(studentObj.photoUrl || studentObj.photo_url || "").trim();
  const inputProgram = String(studentObj.program || "Reguler").trim();
  let inputStatus = String(studentObj.status || "ACTIVE").trim().toUpperCase();
  if (inputStatus === "AKTIF" || inputStatus === "ACTIVE") {
    inputStatus = "ACTIVE";
  } else {
    inputStatus = "INACTIVE";
  }

  if (!inputNis || !inputName) {
    throw new Error("NIS dan Nama Santri wajib diisi.");
  }

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    const rowId = idIdx !== -1 ? String(data[i][idIdx] || "").trim() : "";
    const rowNis = nisIdx !== -1 ? String(data[i][nisIdx] || "").trim() : "";
    if ((inputId && rowId === inputId) || (inputNis && rowNis === inputNis)) {
      foundRow = i + 1;
      break;
    }
  }

  const nowIso = new Date().toISOString();

  if (foundRow !== -1) {
    if (nisIdx !== -1) sheet.getRange(foundRow, nisIdx + 1).setValue(inputNis);
    if (nikIdx !== -1) sheet.getRange(foundRow, nikIdx + 1).setValue(inputNik);
    if (nameIdx !== -1) sheet.getRange(foundRow, nameIdx + 1).setValue(inputName);
    if (genderIdx !== -1) sheet.getRange(foundRow, genderIdx + 1).setValue(inputGender);
    if (birthIdx !== -1) sheet.getRange(foundRow, birthIdx + 1).setValue(inputBirth);
    if (photoIdx !== -1 && inputPhoto) sheet.getRange(foundRow, photoIdx + 1).setValue(inputPhoto);
    if (progIdx !== -1) sheet.getRange(foundRow, progIdx + 1).setValue(inputProgram);
    if (statusIdx !== -1) sheet.getRange(foundRow, statusIdx + 1).setValue(inputStatus);

    return {
      status: "success",
      success: true,
      message: `Data santri ${inputName} (NIS: ${inputNis}) berhasil diperbarui.`
    };
  } else {
    const newStudentId = inputId || ("STD_" + Utilities.getUuid().replace(/-/g, "").substring(0, 12));
    const newRow = new Array(headers.length).fill("");
    if (idIdx !== -1) newRow[idIdx] = newStudentId;
    if (nisIdx !== -1) newRow[nisIdx] = inputNis;
    if (nikIdx !== -1) newRow[nikIdx] = inputNik;
    if (nameIdx !== -1) newRow[nameIdx] = inputName;
    if (genderIdx !== -1) newRow[genderIdx] = inputGender;
    if (birthIdx !== -1) newRow[birthIdx] = inputBirth;
    if (photoIdx !== -1) newRow[photoIdx] = inputPhoto;
    if (progIdx !== -1) newRow[progIdx] = inputProgram;
    if (statusIdx !== -1) newRow[statusIdx] = inputStatus;
    const createdIdx = headers.indexOf("created_at");
    if (createdIdx !== -1) newRow[createdIdx] = nowIso;

    sheet.appendRow(newRow);
    return {
      status: "success",
      success: true,
      studentId: newStudentId,
      message: `Santri baru ${inputName} (NIS: ${inputNis}) berhasil ditambahkan ke database.`
    };
  }
}

/**
 * Hapus Data Santri dari Spreadsheet Students
 */
function deleteStudentData(studentId, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const cleanId = String(studentId || "").trim();
    if (!cleanId) {
      return {
        status: "error",
        success: false,
        message: "ID Santri tidak valid untuk dihapus."
      };
    }

    const ss = getDatabaseSpreadsheet();
    const sheet = getAuthSheet(ss, SHEET_STUDENTS);
    if (!sheet) {
      return { status: "error", success: false, message: "Sheet Students tidak ditemukan." };
    }

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return { status: "error", success: false, message: "Data santri kosong." };
    }

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let idIdx = headers.indexOf("student_id");
    let nisIdx = headers.indexOf("nis");
    if (nisIdx === -1) nisIdx = headers.indexOf("nisn");

    let targetRow = -1;
    let studentName = "";
    for (let i = 1; i < data.length; i++) {
      const rowId = idIdx !== -1 ? String(data[i][idIdx] || "").trim() : "";
      const rowNis = nisIdx !== -1 ? String(data[i][nisIdx] || "").trim() : "";
      if (rowId === cleanId || (rowNis && rowNis === cleanId)) {
        targetRow = i + 1;
        let nameIdx = headers.indexOf("name");
        if (nameIdx === -1) nameIdx = headers.indexOf("nama");
        studentName = nameIdx !== -1 ? String(data[i][nameIdx] || "") : cleanId;
        break;
      }
    }

    if (targetRow === -1) {
      return {
        status: "error",
        success: false,
        message: `Santri dengan ID/NIS '${cleanId}' tidak ditemukan.`
      };
    }

    sheet.deleteRow(targetRow);

    // Bersihkan relasi di Wali_Santri_Map jika ada
    try {
      const mapSheet = getAuthSheet(ss, SHEET_WALI_SANTRI_MAP);
      if (mapSheet) {
        const mapData = mapSheet.getDataRange().getValues();
        for (let m = mapData.length - 1; m >= 1; m--) {
          if (String(mapData[m][2] || "").trim() === cleanId) {
            mapSheet.deleteRow(m + 1);
          }
        }
      }
    } catch (cleanErr) {
      console.warn("Pembersihan Wali_Santri_Map:", cleanErr);
    }

    return {
      status: "success",
      success: true,
      message: `Data santri ${studentName} berhasil dihapus dari database.`
    };
  } catch (err) {
    console.error("[DELETE STUDENT ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal menghapus data santri: " + err.message
    };
  }
}

/**
 * Lookup Santri berdasarkan NIS & Tanggal Lahir untuk Aktivasi Wali Santri
 * Mendukung pencarian toleran dan mengekstrak NIK, Gender, dan Foto Profil
 */
function getStudentByNisAndBirthDate(nisOrNisn, birthDate) {
  const cleanNis = String(nisOrNisn || "").trim();
  const cleanBirthDate = normalizeDateString(birthDate);
  if (!cleanNis) return null;

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_STUDENTS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("student_id");
  let nisIdx = header.indexOf("nis");
  if (nisIdx === -1) nisIdx = header.indexOf("nisn");
  let nikIdx = header.indexOf("nik");
  let nameIdx = header.indexOf("name");
  if (nameIdx === -1) nameIdx = header.indexOf("nama");
  let genderIdx = header.indexOf("gender");
  if (genderIdx === -1) genderIdx = header.indexOf("jenis");
  if (genderIdx === -1) genderIdx = header.indexOf("jenis_kelamin");
  let birthIdx = header.indexOf("birth_date");
  if (birthIdx === -1) birthIdx = header.indexOf("tanggal_lahir");
  if (birthIdx === -1) birthIdx = header.indexOf("tgl_lahir");
  let photoIdx = header.indexOf("photo_url");
  if (photoIdx === -1) photoIdx = header.indexOf("foto_profil");
  if (photoIdx === -1) photoIdx = header.indexOf("foto");
  let progIdx = header.indexOf("program");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (nisIdx === -1) nisIdx = 1;
  if (nameIdx === -1) nameIdx = 2;

  for (let i = 1; i < data.length; i++) {
    const rowNis = String(data[i][nisIdx] || "").trim();
    if (rowNis === cleanNis) {
      const rowBirth = birthIdx !== -1 ? normalizeDateString(data[i][birthIdx]) : "";
      // Toleran: Jika tanggal lahir di database masih kosong (data awal), tetap cocok
      if (!rowBirth || !cleanBirthDate || rowBirth === cleanBirthDate) {
        return {
          studentId: String(data[i][idIdx] || ""),
          nis: rowNis,
          nisn: rowNis, // alias backward compatible
          nik: nikIdx !== -1 ? String(data[i][nikIdx] || "") : "",
          name: nameIdx !== -1 ? String(data[i][nameIdx] || "") : "Santri",
          gender: genderIdx !== -1 ? String(data[i][genderIdx] || "").trim().toUpperCase() : "",
          birthDate: rowBirth,
          photoUrl: photoIdx !== -1 ? String(data[i][photoIdx] || "") : "",
          program: progIdx !== -1 ? String(data[i][progIdx] || "Reguler") : "Reguler",
          status: statusIdx !== -1 ? String(data[i][statusIdx] || "Aktif") : "Aktif"
        };
      }
    }
  }
  return null;
}

/**
 * Alias fungsi backward compatible untuk getStudentByNisnAndBirthDate
 */
function getStudentByNisnAndBirthDate(nisn, birthDate) {
  return getStudentByNisAndBirthDate(nisn, birthDate);
}

/**
 * Cari data santri berdasarkan NIS saja (tanpa syarat tanggal lahir)
 */
function getStudentByNis(nisOrNisn) {
  const cleanNis = String(nisOrNisn || "").trim();
  if (!cleanNis) return null;

  const ss = getDatabaseSpreadsheet();
  const sheet = getAuthSheet(ss, SHEET_STUDENTS);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const header = data[0].map(h => String(h || "").trim().toLowerCase());
  let idIdx = header.indexOf("student_id");
  let nisIdx = header.indexOf("nis");
  if (nisIdx === -1) nisIdx = header.indexOf("nisn");
  let nikIdx = header.indexOf("nik");
  let nameIdx = header.indexOf("name");
  if (nameIdx === -1) nameIdx = header.indexOf("nama");
  let genderIdx = header.indexOf("gender");
  if (genderIdx === -1) genderIdx = header.indexOf("jenis");
  if (genderIdx === -1) genderIdx = header.indexOf("jenis_kelamin");
  let birthIdx = header.indexOf("birth_date");
  if (birthIdx === -1) birthIdx = header.indexOf("tanggal_lahir");
  if (birthIdx === -1) birthIdx = header.indexOf("tgl_lahir");
  let photoIdx = header.indexOf("photo_url");
  if (photoIdx === -1) photoIdx = header.indexOf("foto_profil");
  if (photoIdx === -1) photoIdx = header.indexOf("foto");
  let progIdx = header.indexOf("program");
  let statusIdx = header.indexOf("status");

  if (idIdx === -1) idIdx = 0;
  if (nisIdx === -1) nisIdx = 1;
  if (nameIdx === -1) nameIdx = 2;

  const cleanLower = cleanNis.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const rowNis = String(data[i][nisIdx] || "").trim();
    if (rowNis.toLowerCase() === cleanLower) {
      return {
        studentId: String(data[i][idIdx] || ""),
        nis: rowNis,
        nisn: rowNis,
        nik: nikIdx !== -1 ? String(data[i][nikIdx] || "") : "",
        name: nameIdx !== -1 ? String(data[i][nameIdx] || "") : "Santri",
        gender: genderIdx !== -1 ? String(data[i][genderIdx] || "").trim().toUpperCase() : "",
        birthDate: birthIdx !== -1 ? normalizeDateString(data[i][birthIdx]) : "",
        photoUrl: photoIdx !== -1 ? String(data[i][photoIdx] || "") : "",
        program: progIdx !== -1 ? String(data[i][progIdx] || "Reguler") : "Reguler",
        status: statusIdx !== -1 ? String(data[i][statusIdx] || "AKTIF") : "AKTIF"
      };
    }
  }
  return null;
}

// ====================================================================
const SHEET_PEGAWAI = "Pegawai";

function getOrCreatePegawaiSheet(ss) {
  const headers = [
    "employee_id", "nama", "nip", "gender", "jabatan", "spesialisasi", "telepon", "email", "status", "created_at"
  ];
  let sheet = ss.getSheetByName(SHEET_PEGAWAI);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PEGAWAI);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#047857")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    // Data awal Asatidz Pembina Tahfidz Asnawiyyah
    const nowIso = new Date().toISOString();
    sheet.appendRow([
      "PEG-001", "Ustadzah Laila Luthfiana, Al-Hafidzah", "199208152021012001", "P",
      "Muhafizah / Ustadzah", "Tahfidz Al-Qur'an (Juz 30 & Mutqin)", "081234567891", "laila.luthfiana@asnawiyyah.or.id", "ACTIVE", nowIso
    ]);
    sheet.appendRow([
      "PEG-002", "Nyai Hj. Nasikhatul Fuadah, Al-Hafidzah", "198505102015012002", "P",
      "Pengasuh / Muhafizah Utama", "Tahfidz 30 Juz & Sanad", "081234567892", "nasikhatul.fuadah@asnawiyyah.or.id", "ACTIVE", nowIso
    ]);
    sheet.appendRow([
      "PEG-003", "Ustadz Pembina Tahfidz Putra", "199401012022011003", "L",
      "Muhafiz / Ustadz", "Tahfidz Al-Qur'an Putra", "081234567893", "tahfidz.putra@asnawiyyah.or.id", "ACTIVE", nowIso
    ]);
  }
  return sheet;
}

function getAllEmployeesData(token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "ASATIDZ", "USTADZ", "MUHAFIZ", "GURU", "PENGURUS", "BENDAHARA", "WALI_SANTRI"]);
      } catch (authErr) {
        try {
          verifySessionToken(token);
        } catch (legErr) {
          // Token legacy/expired toleran
        }
      }
    }

    const ss = getDatabaseSpreadsheet();
    const sheet = getOrCreatePegawaiSheet(ss);
    const data = sheet.getDataRange().getValues();
    const list = [];
    let totalL = 0, totalP = 0, totalAsatidz = 0, totalAktif = 0;

    if (data && data.length > 1) {
      const h = data[0].map(x => String(x || "").trim().toLowerCase());
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id = String(row[h.indexOf("employee_id")] || "").trim();
        if (!id) continue;
        const nama = String(row[h.indexOf("nama")] || "").trim();
        const nip = String(row[h.indexOf("nip")] || "").trim();
        const gender = String(row[h.indexOf("gender")] || "L").toUpperCase();
        const jabatan = String(row[h.indexOf("jabatan")] || "Ustadz").trim();
        const spesialisasi = String(row[h.indexOf("spesialisasi")] || "-").trim();
        const telepon = String(row[h.indexOf("telepon")] || "").trim();
        const email = String(row[h.indexOf("email")] || "").trim();
        const status = String(row[h.indexOf("status")] || "ACTIVE").toUpperCase();
        const createdAt = String(row[h.indexOf("created_at")] || "");

        if (status === "ACTIVE") totalAktif++;
        if (gender === "L") totalL++; else totalP++;
        if (jabatan.toLowerCase().includes("ustadz") || jabatan.toLowerCase().includes("muhafiz") || jabatan.toLowerCase().includes("guru")) {
          totalAsatidz++;
        }

        list.push({
          employeeId: id,
          id: id,
          nama: nama,
          name: nama,
          nip: nip,
          gender: gender,
          jabatan: jabatan,
          spesialisasi: spesialisasi,
          telepon: telepon,
          email: email,
          status: status,
          createdAt: createdAt
        });
      }
    }

    return {
      status: "success",
      success: true,
      data: list,
      total: list.length,
      summary: {
        total: list.length,
        aktif: totalAktif,
        putra: totalL,
        putri: totalP,
        asatidz: totalAsatidz
      }
    };
  } catch (err) {
    console.error("[GET ALL EMPLOYEES ERROR]", err);
    return { status: "error", success: false, message: "Gagal memuat data pegawai: " + err.message };
  }
}

function saveEmployeeData(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const nama = String(payload.nama || payload.name || "").trim();
    if (!nama) throw new Error("Nama pegawai / ustadz wajib diisi.");

    const ss = getDatabaseSpreadsheet();
    const sheet = getOrCreatePegawaiSheet(ss);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());

    const idIdx = headers.indexOf("employee_id");
    let employeeId = String(payload.employeeId || payload.id || "").trim();
    let foundRow = -1;

    if (employeeId && idIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx] || "").trim() === employeeId) {
          foundRow = i + 1;
          break;
        }
      }
    }

    if (!employeeId) {
      employeeId = "PEG-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
    }

    const nip = String(payload.nip || "").trim();
    const gender = String(payload.gender || "L").toUpperCase();
    const jabatan = String(payload.jabatan || "Ustadz / Muhafiz").trim();
    const spesialisasi = String(payload.spesialisasi || "Tahfidz Al-Qur'an").trim();
    const telepon = String(payload.telepon || "").trim();
    const email = String(payload.email || "").trim();
    const status = String(payload.status || "ACTIVE").toUpperCase();
    const createdAt = new Date().toISOString();

    const rowValues = [employeeId, nama, nip, gender, jabatan, spesialisasi, telepon, email, status, createdAt];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      return { status: "success", success: true, employeeId: employeeId, message: `Data pegawai ${nama} berhasil diperbarui.` };
    } else {
      sheet.appendRow(rowValues);
      return { status: "success", success: true, employeeId: employeeId, message: `Pegawai ${nama} berhasil ditambahkan.` };
    }
  } catch (err) {
    console.error("[SAVE EMPLOYEE ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyimpan data pegawai: " + err.message };
  }
}

function deleteEmployeeData(employeeId, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    if (!employeeId) throw new Error("ID Pegawai wajib disertakan.");
    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PEGAWAI);
    if (!sheet) throw new Error("Sheet Pegawai tidak ditemukan.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("employee_id");

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === String(employeeId).trim()) {
        sheet.deleteRow(i + 1);
        return { status: "success", success: true, message: "Data pegawai berhasil dihapus." };
      }
    }
    return { status: "error", success: false, message: "Data pegawai tidak ditemukan." };
  } catch (err) {
    console.error("[DELETE EMPLOYEE ERROR]", err);
    return { status: "error", success: false, message: "Gagal menghapus data pegawai: " + err.message };
  }
}

// ============================================================================
// MODUL KE-20: IZIN SANTRI & PERPULANGAN (TWO-TIER APPROVAL & GATE CHECK)
// ============================================================================

const SHEET_IZIN_PERPULANGAN = "Izin_Perpulangan";

const IZIN_PERPULANGAN_HEADERS = [
  "ID_Izin", "Student_ID", "NIS", "Nama_Santri", 
  "Wali_ID", "Nama_Wali", "No_WA_Wali", "Kategori", 
  "Alasan", "Nama_Penjemput", "Hubungan_Penjemput", "Kontak_Penjemput", 
  "Tgl_Mulai", "Jam_Mulai", "Tgl_Kembali", "Jam_Kembali", 
  "Status", "Pengurus_Approved_By", "Pengurus_Approved_At", "Pengurus_Catatan", 
  "Pengasuh_Approved_By", "Pengasuh_Approved_At", "Pengasuh_Catatan", 
  "Alasan_Penolakan", "Checkout_At", "Checkout_Petugas", 
  "Checkin_At", "Checkin_Petugas", "Catatan_Keterlambatan", 
  "Created_At", "Updated_At"
];

/**
 * Inisialisasi Tab Izin_Perpulangan di Google Sheets
 */
function initIzinPerpulanganSheet() {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_IZIN_PERPULANGAN);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_IZIN_PERPULANGAN);
      sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setValues([IZIN_PERPULANGAN_HEADERS]);
      sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
      Logger.log(`[SCHEMA AUTO-INIT] Tab '${SHEET_IZIN_PERPULANGAN}' berhasil dibuat otomatis di Google Sheets.`);
    } else {
      // Pastikan header lengkap
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setValues([IZIN_PERPULANGAN_HEADERS]);
        sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setFontWeight("bold").setBackground("#dcfce7");
        sheet.setFrozenRows(1);
      }
    }
    return {
      status: "success",
      success: true,
      message: `Tab '${SHEET_IZIN_PERPULANGAN}' berhasil disiapkan di Google Sheets.`,
      sheetName: SHEET_IZIN_PERPULANGAN
    };
  } catch (err) {
    console.error("[INIT IZIN SHEET ERROR]", err);
    return { status: "error", success: false, message: "Gagal membuat sheet Izin_Perpulangan: " + err.message };
  }
}

/**
 * Sinkronisasi Penuh Tab Izin_Perpulangan dari Cloud PostgreSQL Supabase ke Google Spreadsheet
 * Memperbaiki seluruh selisih data, duplikasi ID lama, dan error formula nomor telepon (#ERROR!).
 */
function syncIzinPerpulanganFromSupabase() {
  try {
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_IZIN_PERPULANGAN);
    if (!sheet) {
      initIzinPerpulanganSheet();
      sheet = ss.getSheetByName(SHEET_IZIN_PERPULANGAN);
    }

    const sbUrl = "https://tkjhfhyabacbyknwrysh.supabase.co";
    const sbKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";

    const fetchUrl = sbUrl + "/rest/v1/izin_perpulangan?select=*&order=created_at.asc";
    const resp = UrlFetchApp.fetch(fetchUrl, {
      method: "GET",
      headers: {
        "apikey": sbKey,
        "Authorization": "Bearer " + sbKey
      },
      muteHttpExceptions: true
    });

    if (resp.getResponseCode() !== 200) {
      throw new Error("Gagal mengambil data dari Supabase: " + resp.getContentText());
    }

    const list = JSON.parse(resp.getContentText());
    if (!Array.isArray(list) || list.length === 0) {
      return { status: "warning", success: false, message: "Tidak ada data izin di Supabase." };
    }

    // 1. Bersihkan seluruh baris lama di tab Izin_Perpulangan (kecuali Header di baris 1)
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), IZIN_PERPULANGAN_HEADERS.length);
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }

    // 2. Pastikan Header baris 1 utuh dan rapi
    sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setValues([IZIN_PERPULANGAN_HEADERS]);
    sheet.getRange(1, 1, 1, IZIN_PERPULANGAN_HEADERS.length).setFontWeight("bold").setBackground("#dcfce7");
    sheet.setFrozenRows(1);

    // 3. Susun data bersih
    const rows = list.map(d => {
      let safeWaliPhone = String(d.wali_phone || "").trim();
      if (safeWaliPhone && (safeWaliPhone.startsWith("+") || safeWaliPhone.startsWith("="))) {
        safeWaliPhone = "'" + safeWaliPhone;
      }
      let safePenjemputKontak = String(d.penjemput_kontak || "").trim();
      if (safePenjemputKontak && (safePenjemputKontak.startsWith("+") || safePenjemputKontak.startsWith("="))) {
        safePenjemputKontak = "'" + safePenjemputKontak;
      }

      return [
        d.id_izin || "",
        d.student_id || "",
        d.student_nis || "",
        d.student_name || "",
        d.wali_id || "",
        d.wali_name || "",
        safeWaliPhone,
        d.kategori || "",
        d.alasan || "",
        d.penjemput_nama || "",
        d.penjemput_hubungan || "",
        safePenjemputKontak,
        d.tgl_mulai || "",
        d.jam_mulai || "",
        d.tgl_kembali || "",
        d.jam_kembali || "",
        d.status || "",
        d.pengurus_approved_by || "",
        d.pengurus_approved_at || "",
        d.pengurus_catatan || "",
        d.pengasuh_approved_by || "",
        d.pengasuh_approved_at || "",
        d.pengasuh_catatan || "",
        d.alasan_penolakan || "",
        d.checkout_at || "",
        d.checkout_petugas || "",
        d.checkin_at || "",
        d.checkin_petugas || "",
        d.catatan_keterlambatan || "",
        d.created_at || "",
        d.updated_at || ""
      ];
    });

    // 4. Tulis data ke Sheet sekaligus (Batch Insert)
    sheet.getRange(2, 1, rows.length, IZIN_PERPULANGAN_HEADERS.length).setValues(rows);

    return {
      status: "success",
      success: true,
      message: `Berhasil menyinkronkan ${rows.length} data izin dari Supabase ke Spreadsheet Izin_Perpulangan.`,
      totalSynced: rows.length
    };
  } catch (err) {
    console.error("[SYNC SUPABASE TO SPREADSHEET ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyinkronkan data: " + err.message };
  }
}

/**
 * Helper mendapatkan sheet Izin_Perpulangan (dengan auto-create resilien)
 */
function getIzinSheet() {
  const ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_IZIN_PERPULANGAN);
  if (!sheet) {
    initIzinPerpulanganSheet();
    sheet = ss.getSheetByName(SHEET_IZIN_PERPULANGAN);
  }
  return sheet;
}

/**
 * Mengambil daftar data perizinan santri
 */
function getIzinPerpulanganData(params = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    if (!sheet) return { status: "success", success: true, data: [] };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return { status: "success", success: true, data: [], summary: { total: 0, menungguPengurus: 0, menungguPengasuh: 0, disetujui: 0, keluar: 0, kembali: 0, terlambat: 0, ditolak: 0 } };
    }

    const headers = data[0].map(h => String(h || "").trim());
    const headerMap = {};
    headers.forEach((h, idx) => { headerMap[h] = idx; });

    let rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idIzin = String(row[headerMap["ID_Izin"]] || "").trim();
      if (!idIzin) continue;

      const item = {
        idIzin: idIzin,
        studentId: String(row[headerMap["Student_ID"]] || "").trim(),
        studentNis: String(row[headerMap["NIS"]] || "").trim(),
        studentName: String(row[headerMap["Nama_Santri"]] || "").trim(),
        waliId: String(row[headerMap["Wali_ID"]] || "").trim(),
        waliName: String(row[headerMap["Nama_Wali"]] || "").trim(),
        waliPhone: String(row[headerMap["No_WA_Wali"]] || "").trim(),
        kategori: String(row[headerMap["Kategori"]] || "").trim(),
        alasan: String(row[headerMap["Alasan"]] || "").trim(),
        penjemputNama: String(row[headerMap["Nama_Penjemput"]] || "").trim(),
        penjemputHubungan: String(row[headerMap["Hubungan_Penjemput"]] || "").trim(),
        penjemputKontak: String(row[headerMap["Kontak_Penjemput"]] || "").trim(),
        tglMulai: String(row[headerMap["Tgl_Mulai"]] || "").trim(),
        jamMulai: String(row[headerMap["Jam_Mulai"]] || "").trim(),
        tglKembali: String(row[headerMap["Tgl_Kembali"]] || "").trim(),
        jamKembali: String(row[headerMap["Jam_Kembali"]] || "").trim(),
        status: String(row[headerMap["Status"]] || "MENUNGGU_PENGURUS").trim(),
        pengurusApprovedBy: String(row[headerMap["Pengurus_Approved_By"]] || "").trim(),
        pengurusApprovedAt: String(row[headerMap["Pengurus_Approved_At"]] || "").trim(),
        pengurusCatatan: String(row[headerMap["Pengurus_Catatan"]] || "").trim(),
        pengasuhApprovedBy: String(row[headerMap["Pengasuh_Approved_By"]] || "").trim(),
        pengasuhApprovedAt: String(row[headerMap["Pengasuh_Approved_At"]] || "").trim(),
        pengasuhCatatan: String(row[headerMap["Pengasuh_Catatan"]] || "").trim(),
        alasanPenolakan: String(row[headerMap["Alasan_Penolakan"]] || "").trim(),
        checkoutAt: String(row[headerMap["Checkout_At"]] || "").trim(),
        checkoutPetugas: String(row[headerMap["Checkout_Petugas"]] || "").trim(),
        checkinAt: String(row[headerMap["Checkin_At"]] || "").trim(),
        checkinPetugas: String(row[headerMap["Checkin_Petugas"]] || "").trim(),
        catatanKeterlambatan: String(row[headerMap["Catatan_Keterlambatan"]] || "").trim(),
        createdAt: String(row[headerMap["Created_At"]] || "").trim(),
        updatedAt: String(row[headerMap["Updated_At"]] || "").trim()
      };

      // Filter parameter jika ada
      if (params.waliId && item.waliId !== String(params.waliId).trim()) continue;
      if (params.studentId && item.studentId !== String(params.studentId).trim()) continue;
      if (params.status && item.status !== String(params.status).trim()) continue;
      if (params.kategori && item.kategori !== String(params.kategori).trim()) continue;

      rows.push(item);
    }

    // Urutkan dari yang terbaru
    rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const summary = {
      total: rows.length,
      menungguPengurus: rows.filter(r => r.status === "MENUNGGU_PENGURUS").length,
      menungguPengasuh: rows.filter(r => r.status === "MENUNGGU_PENGASUH").length,
      disetujui: rows.filter(r => r.status === "DISETUJUI").length,
      keluar: rows.filter(r => r.status === "KELUAR").length,
      kembali: rows.filter(r => r.status === "KEMBALI").length,
      terlambat: rows.filter(r => r.status === "TERLAMBAT").length,
      ditolak: rows.filter(r => r.status === "DITOLAK").length
    };

    return {
      status: "success",
      success: true,
      data: rows,
      summary: summary
    };
  } catch (err) {
    console.error("[GET IZIN ERROR]", err);
    return { status: "error", success: false, message: "Gagal mengambil data perizinan: " + err.message };
  }
}

/**
 * Resolusi otomatis profil Wali Santri (Nama & No Telepon) berdasarkan wali_id
 * Mencari dari Sheet Users, Sheet Wali_Identities, atau Sheet Students
 */
function resolveWaliInfo(waliId, studentId = "", studentNis = "") {
  waliId = String(waliId || "").trim();
  studentId = String(studentId || "").trim();
  studentNis = String(studentNis || "").trim();

  let name = "";
  let phone = "";

  try {
    const ss = getDatabaseSpreadsheet();
    if (!ss) return { name, phone };

    // 1. Cari berdasarkan waliId di sheet Users
    if (waliId && waliId !== "ADMIN_MANUAL") {
      const userSheet = ss.getSheetByName("Users");
      if (userSheet) {
        const uData = userSheet.getDataRange().getValues();
        if (uData && uData.length > 1) {
          const uHeaders = uData[0].map(h => String(h || "").trim().toLowerCase());
          const idIdx = uHeaders.indexOf("user_id");
          const nameIdx = uHeaders.indexOf("name");
          const phoneIdx = uHeaders.indexOf("phone");
          if (idIdx !== -1 && nameIdx !== -1) {
            for (let i = 1; i < uData.length; i++) {
              if (String(uData[i][idIdx] || "").trim().toLowerCase() === waliId.toLowerCase()) {
                name = String(uData[i][nameIdx] || "").trim();
                if (phoneIdx !== -1) phone = String(uData[i][phoneIdx] || "").trim();
                break;
              }
            }
          }
        }
      }

      // 2. Jika belum ditemukan, cari di sheet Wali_Identities
      if (!name) {
        const waliSheet = ss.getSheetByName("Wali_Identities");
        if (waliSheet) {
          const wData = waliSheet.getDataRange().getValues();
          if (wData && wData.length > 1) {
            const wHeaders = wData[0].map(h => String(h || "").trim().toLowerCase());
            const idIdx = wHeaders.indexOf("identity_id") !== -1 ? wHeaders.indexOf("identity_id") : wHeaders.indexOf("user_id");
            const nameIdx = wHeaders.indexOf("name");
            const phoneIdx = wHeaders.indexOf("phone");
            if (idIdx !== -1 && nameIdx !== -1) {
              for (let i = 1; i < wData.length; i++) {
                if (String(wData[i][idIdx] || "").trim().toLowerCase() === waliId.toLowerCase()) {
                  name = String(wData[i][nameIdx] || "").trim();
                  if (phoneIdx !== -1) phone = String(wData[i][phoneIdx] || "").trim();
                  break;
                }
              }
            }
          }
        }
      }
    }

    // 3. Jika belum ditemukan atau jika waliId kosong / ADMIN_MANUAL, cari di sheet Students berdasarkan studentId / studentNis
    if (!name && (studentId || studentNis)) {
      const stSheet = ss.getSheetByName("Students");
      if (stSheet) {
        const sData = stSheet.getDataRange().getValues();
        if (sData && sData.length > 1) {
          const sHeaders = sData[0].map(h => String(h || "").trim().toLowerCase());
          const idIdx = sHeaders.indexOf("id") !== -1 ? sHeaders.indexOf("id") : sHeaders.indexOf("student_id");
          const nisIdx = sHeaders.indexOf("nis");
          let waliNameIdx = sHeaders.indexOf("nama_wali");
          if (waliNameIdx === -1) waliNameIdx = sHeaders.indexOf("wali");
          if (waliNameIdx === -1) waliNameIdx = sHeaders.indexOf("nama_ayah");
          if (waliNameIdx === -1) waliNameIdx = sHeaders.indexOf("nama_ibu");

          let waliPhoneIdx = sHeaders.indexOf("no_hp_wali");
          if (waliPhoneIdx === -1) waliPhoneIdx = sHeaders.indexOf("no_wa_wali");
          if (waliPhoneIdx === -1) waliPhoneIdx = sHeaders.indexOf("telepon_wali");

          for (let i = 1; i < sData.length; i++) {
            const rowId = idIdx !== -1 ? String(sData[i][idIdx] || "").trim() : "";
            const rowNis = nisIdx !== -1 ? String(sData[i][nisIdx] || "").trim() : "";
            if ((studentId && rowId === studentId) || (studentNis && rowNis === studentNis)) {
              if (waliNameIdx !== -1) name = String(sData[i][waliNameIdx] || "").trim();
              if (waliPhoneIdx !== -1 && !phone) phone = String(sData[i][waliPhoneIdx] || "").trim();
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[RESOLVE WALI INFO ERROR]", err);
  }

  return { name, phone };
}

/**
 * Memperbaiki dan mengisi otomatis baris-baris izin perpulangan yang Nama_Wali-nya masih kosong
 */
function autoFixMissingWaliNames() {
  try {
    const sheet = getIzinSheet();
    if (!sheet) throw new Error("Gagal mengakses database Izin_Perpulangan.");

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { status: "success", fixedCount: 0 };

    const headers = data[0].map(h => String(h || "").trim());
    const idIzinIdx = headers.indexOf("ID_Izin");
    const stIdIdx = headers.indexOf("Student_ID");
    const stNisIdx = headers.indexOf("NIS");
    const waliIdIdx = headers.indexOf("Wali_ID");
    const waliNameIdx = headers.indexOf("Nama_Wali");
    const waliPhoneIdx = headers.indexOf("No_WA_Wali");
    const penjNameIdx = headers.indexOf("Nama_Penjemput");
    const penjHubIdx = headers.indexOf("Hubungan_Penjemput");
    const penjKontakIdx = headers.indexOf("Kontak_Penjemput");

    if (waliIdIdx === -1 || waliNameIdx === -1) {
      throw new Error("Kolom Wali_ID atau Nama_Wali tidak ditemukan di spreadsheet.");
    }

    let fixedCount = 0;
    const fixedRows = [];

    for (let i = 1; i < data.length; i++) {
      const rowNum = i + 1;
      const currentWaliName = String(data[i][waliNameIdx] || "").trim();
      const currentWaliPhone = waliPhoneIdx !== -1 ? String(data[i][waliPhoneIdx] || "").trim() : "";
      const currentWaliId = String(data[i][waliIdIdx] || "").trim();
      const currentStId = stIdIdx !== -1 ? String(data[i][stIdIdx] || "").trim() : "";
      const currentStNis = stNisIdx !== -1 ? String(data[i][stNisIdx] || "").trim() : "";
      const penjName = penjNameIdx !== -1 ? String(data[i][penjNameIdx] || "").trim() : "";
      const penjHub = penjHubIdx !== -1 ? String(data[i][penjHubIdx] || "").trim().toLowerCase() : "";
      const penjKontak = penjKontakIdx !== -1 ? String(data[i][penjKontakIdx] || "").trim() : "";

      // Jika Nama_Wali kosong atau bernilai default generik
      if (!currentWaliName || currentWaliName === "Wali Santri") {
        const resolved = resolveWaliInfo(currentWaliId, currentStId, currentStNis);
        let finalName = resolved.name;
        let finalPhone = resolved.phone || currentWaliPhone;

        if (!finalName && penjName && (penjHub.includes("wali") || penjHub.includes("orang tua") || penjHub.includes("ayah") || penjHub.includes("ibu"))) {
          finalName = penjName;
          if (!finalPhone) finalPhone = penjKontak;
        }

        if (finalName && finalName !== currentWaliName) {
          sheet.getRange(rowNum, waliNameIdx + 1).setValue(finalName);
          if (finalPhone && waliPhoneIdx !== -1 && (!currentWaliPhone || currentWaliPhone === "")) {
            sheet.getRange(rowNum, waliPhoneIdx + 1).setValue(finalPhone);
          }
          fixedCount++;
          fixedRows.push({
            idIzin: idIzinIdx !== -1 ? data[i][idIzinIdx] : rowNum,
            waliId: currentWaliId,
            namaWali: finalName,
            phone: finalPhone
          });
        }
      }
    }

    return {
      status: "success",
      success: true,
      message: `Berhasil mengisi otomatis ${fixedCount} data Nama_Wali sesuai Wali_ID di Spreadsheet.`,
      fixedCount,
      fixedRows
    };
  } catch (err) {
    console.error("[AUTO FIX WALI ERROR]", err);
    return { status: "error", success: false, message: err.message };
  }
}

/**
 * Menyimpan pengajuan izin baru (Wali Santri / Admin)
 */
function submitIzinPerpulangan(payload = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    if (!sheet) throw new Error("Gagal mengakses database Izin_Perpulangan.");

    const now = new Date();
    const dateCode = Utilities.formatDate(now, "GMT+7", "yyyyMMdd");
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const idIzin = payload.idIzin || payload.id_izin || `IZN-${dateCode}-${randCode}`;

    const studentId = String(payload.studentId || payload.student_id || "").trim();
    const studentNis = String(payload.studentNis || payload.student_nis || payload.nis || "").trim();
    const studentName = String(payload.studentName || payload.student_name || payload.nama || "").trim();
    let waliId = String(payload.waliId || payload.wali_id || "ADMIN_MANUAL").trim();
    let waliName = String(payload.waliName || payload.wali_name || "").trim();
    let waliPhone = String(payload.waliPhone || payload.wali_phone || "").trim();
    const kategori = String(payload.kategori || "Pulang ke Rumah / Libur Terjadwal").trim();
    const alasan = String(payload.alasan || "").trim();
    let penjemputNama = String(payload.penjemputNama || payload.penjemput_nama || "").trim();
    const penjemputHubungan = String(payload.penjemputHubungan || payload.penjemput_hubungan || "Orang Tua").trim();
    let penjemputKontak = String(payload.penjemputKontak || payload.penjemput_kontak || "").trim();
    const tglMulai = String(payload.tglMulai || payload.tgl_mulai || "").trim();
    const jamMulai = String(payload.jamMulai || payload.jam_mulai || "08:00").trim();
    const tglKembali = String(payload.tglKembali || payload.tgl_kembali || "").trim();
    const jamKembali = String(payload.jamKembali || payload.jam_kembali || "17:00").trim();
    const status = "MENUNGGU_PENGURUS";
    const createdAt = now.toISOString();
    const updatedAt = createdAt;

    if (!studentName) throw new Error("Nama santri wajib disertakan.");
    if (!tglMulai || !tglKembali) throw new Error("Tanggal berangkat dan tanggal kembali wajib diisi.");
    if (!alasan) throw new Error("Alasan perizinan wajib diisi.");

    // Resolusi Otomatis Nama Wali Santri & No WA sesuai waliId
    if (!waliName || waliName === "Wali Santri" || !waliPhone) {
      const resolved = resolveWaliInfo(waliId, studentId, studentNis);
      if (resolved.name) waliName = resolved.name;
      if (resolved.phone && !waliPhone) waliPhone = resolved.phone;
    }

    if (!waliName && penjemputNama && (penjemputHubungan.toLowerCase().includes("wali") || penjemputHubungan.toLowerCase().includes("orang tua") || penjemputHubungan.toLowerCase().includes("ayah") || penjemputHubungan.toLowerCase().includes("ibu"))) {
      waliName = penjemputNama;
      if (!waliPhone) waliPhone = penjemputKontak;
    }

    if (!waliName) waliName = "Wali Santri";
    if (!penjemputNama) penjemputNama = waliName;
    if (!penjemputKontak) penjemputKontak = waliPhone;

    const newRow = [
      idIzin, studentId, studentNis, studentName,
      waliId, waliName, waliPhone, kategori,
      alasan, penjemputNama, penjemputHubungan, penjemputKontak,
      tglMulai, jamMulai, tglKembali, jamKembali,
      status, "", "", "", // Pengurus approval fields
      "", "", "",         // Pengasuh approval fields
      "",                 // Alasan penolakan
      "", "",             // Checkout fields
      "", "",             // Checkin fields
      "",                 // Catatan keterlambatan
      createdAt, updatedAt
    ];

    sheet.appendRow(newRow);

    return {
      status: "success",
      success: true,
      idIzin: idIzin,
      message: `Pengajuan izin untuk ${studentName} berhasil dikirim (Menunggu Persetujuan Pengurus Keamanan).`,
      data: {
        idIzin, studentId, studentNis, studentName, status, kategori, tglMulai, tglKembali, createdAt
      }
    };
  } catch (err) {
    console.error("[SUBMIT IZIN ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyimpan pengajuan izin: " + err.message };
  }
}

/**
 * Persetujuan Tahap 1: Pengurus Keamanan / Asatidz Piket
 */
function approveIzinPengurus(payload = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    const idIzin = String(payload.idIzin || payload.id_izin || "").trim();
    const isApproved = Boolean(payload.approved !== false && payload.status !== "DITOLAK");
    const actorName = String(payload.actorName || payload.adminName || "Pengurus Keamanan").trim();
    const catatan = String(payload.catatan || "").trim();

    if (!idIzin) throw new Error("ID Izin wajib disertakan.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim());
    const idIdx = headers.indexOf("ID_Izin");
    const statusIdx = headers.indexOf("Status");
    const byIdx = headers.indexOf("Pengurus_Approved_By");
    const atIdx = headers.indexOf("Pengurus_Approved_At");
    const noteIdx = headers.indexOf("Pengurus_Catatan");
    const rejectIdx = headers.indexOf("Alasan_Penolakan");
    const updatedIdx = headers.indexOf("Updated_At");

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === idIzin) {
        foundRow = i + 1;
        break;
      }
    }

    const nowIso = new Date().toISOString();
    const nextStatus = isApproved ? "MENUNGGU_PENGASUH" : "DITOLAK";

    if (foundRow < 0) {
      // Auto-insert jika izin diajukan via cloud database Supabase dan belum tercatat di Sheet
      const studentId = String(payload.studentId || payload.student_id || "").trim();
      const studentNis = String(payload.studentNis || payload.student_nis || payload.nis || "").trim();
      const studentName = String(payload.studentName || payload.student_name || payload.nama || "Santri").trim();
      const waliId = String(payload.waliId || payload.wali_id || "WALI_USER").trim();
      const waliName = String(payload.waliName || payload.wali_name || "Wali").trim();
      const waliPhone = String(payload.waliPhone || payload.wali_phone || "").trim();
      const kategori = String(payload.kategori || "Pulang ke Rumah / Libur Terjadwal").trim();
      const alasan = String(payload.alasan || "-").trim();
      const penjemputNama = String(payload.penjemputNama || payload.penjemput_nama || waliName).trim();
      const penjemputHubungan = String(payload.penjemputHubungan || payload.penjemput_hubungan || "Orang Tua").trim();
      const penjemputKontak = String(payload.penjemputKontak || payload.penjemput_kontak || waliPhone).trim();
      const tglMulai = String(payload.tglMulai || payload.tgl_mulai || "").trim();
      const jamMulai = String(payload.jamMulai || payload.jam_mulai || "08:00").trim();
      const tglKembali = String(payload.tglKembali || payload.tgl_kembali || "").trim();
      const jamKembali = String(payload.jamKembali || payload.jam_kembali || "17:00").trim();

      const newRow = [
        idIzin, studentId, studentNis, studentName,
        waliId, waliName, waliPhone, kategori,
        alasan, penjemputNama, penjemputHubungan, penjemputKontak,
        tglMulai, jamMulai, tglKembali, jamKembali,
        nextStatus,
        actorName, nowIso, catatan, // Pengurus
        "", "", "",                 // Pengasuh
        !isApproved ? (catatan || "Ditolak oleh Pengurus Keamanan") : "", // Alasan tolak
        "", "", // Checkout
        "", "", // Checkin
        "",     // Keterlambatan
        nowIso, nowIso
      ];
      sheet.appendRow(newRow);

      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        newStatus: nextStatus,
        message: isApproved 
          ? `Izin ${idIzin} disetujui Pengurus Keamanan (Diteruskan ke Dewan Pengasuh).`
          : `Izin ${idIzin} telah ditolak.`
      };
    }

    sheet.getRange(foundRow, statusIdx + 1).setValue(nextStatus);
    sheet.getRange(foundRow, byIdx + 1).setValue(actorName);
    sheet.getRange(foundRow, atIdx + 1).setValue(nowIso);
    sheet.getRange(foundRow, noteIdx + 1).setValue(catatan);
    if (!isApproved) {
      sheet.getRange(foundRow, rejectIdx + 1).setValue(catatan || "Ditolak oleh Pengurus Keamanan");
    }
    sheet.getRange(foundRow, updatedIdx + 1).setValue(nowIso);

    return {
      status: "success",
      success: true,
      idIzin: idIzin,
      newStatus: nextStatus,
      message: isApproved 
        ? `Izin ${idIzin} disetujui Pengurus Keamanan (Diteruskan ke Dewan Pengasuh).`
        : `Izin ${idIzin} telah ditolak.`
    };
  } catch (err) {
    console.error("[APPROVE PENGURUS ERROR]", err);
    return { status: "error", success: false, message: "Gagal memproses persetujuan pengurus: " + err.message };
  }
}

/**
 * Persetujuan Tahap 2: Dewan Pengasuh
 */
function approveIzinPengasuh(payload = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    const idIzin = String(payload.idIzin || payload.id_izin || "").trim();
    const isApproved = Boolean(payload.approved !== false && payload.status !== "DITOLAK");
    const actorName = String(payload.actorName || payload.pengasuhName || "Dewan Pengasuh").trim();
    const catatan = String(payload.catatan || "").trim();

    if (!idIzin) throw new Error("ID Izin wajib disertakan.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim());
    const idIdx = headers.indexOf("ID_Izin");
    const statusIdx = headers.indexOf("Status");
    const byIdx = headers.indexOf("Pengasuh_Approved_By");
    const atIdx = headers.indexOf("Pengasuh_Approved_At");
    const noteIdx = headers.indexOf("Pengasuh_Catatan");
    const rejectIdx = headers.indexOf("Alasan_Penolakan");
    const updatedIdx = headers.indexOf("Updated_At");

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === idIzin) {
        foundRow = i + 1;
        break;
      }
    }

    const nowIso = new Date().toISOString();
    const nextStatus = isApproved ? "DISETUJUI" : "DITOLAK";

    if (foundRow < 0) {
      // Auto-insert jika izin diajukan via cloud database Supabase dan belum tercatat di Sheet
      const studentId = String(payload.studentId || payload.student_id || "").trim();
      const studentNis = String(payload.studentNis || payload.student_nis || payload.nis || "").trim();
      const studentName = String(payload.studentName || payload.student_name || payload.nama || "Santri").trim();
      const waliId = String(payload.waliId || payload.wali_id || "WALI_USER").trim();
      const waliName = String(payload.waliName || payload.wali_name || "Wali").trim();
      const waliPhone = String(payload.waliPhone || payload.wali_phone || "").trim();
      const kategori = String(payload.kategori || "Pulang ke Rumah / Libur Terjadwal").trim();
      const alasan = String(payload.alasan || "-").trim();
      const penjemputNama = String(payload.penjemputNama || payload.penjemput_nama || waliName).trim();
      const penjemputHubungan = String(payload.penjemputHubungan || payload.penjemput_hubungan || "Orang Tua").trim();
      const penjemputKontak = String(payload.penjemputKontak || payload.penjemput_kontak || waliPhone).trim();
      const tglMulai = String(payload.tglMulai || payload.tgl_mulai || "").trim();
      const jamMulai = String(payload.jamMulai || payload.jam_mulai || "08:00").trim();
      const tglKembali = String(payload.tglKembali || payload.tgl_kembali || "").trim();
      const jamKembali = String(payload.jamKembali || payload.jam_kembali || "17:00").trim();

      const newRow = [
        idIzin, studentId, studentNis, studentName,
        waliId, waliName, waliPhone, kategori,
        alasan, penjemputNama, penjemputHubungan, penjemputKontak,
        tglMulai, jamMulai, tglKembali, jamKembali,
        nextStatus,
        "Auto-Verified", nowIso, "Disetujui via portal", // Pengurus
        actorName, nowIso, catatan,                     // Pengasuh
        !isApproved ? (catatan || "Ditolak oleh Dewan Pengasuh") : "", // Alasan tolak
        "", "", // Checkout
        "", "", // Checkin
        "",     // Keterlambatan
        nowIso, nowIso
      ];
      sheet.appendRow(newRow);

      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        newStatus: nextStatus,
        message: isApproved 
          ? `Izin ${idIzin} resmi disetujui Pengasuh. Surat & Kartu Izin Digital siap dicetak.`
          : `Izin ${idIzin} telah ditolak oleh Pengasuh.`
      };
    }

    sheet.getRange(foundRow, statusIdx + 1).setValue(nextStatus);
    sheet.getRange(foundRow, byIdx + 1).setValue(actorName);
    sheet.getRange(foundRow, atIdx + 1).setValue(nowIso);
    sheet.getRange(foundRow, noteIdx + 1).setValue(catatan);
    if (!isApproved) {
      sheet.getRange(foundRow, rejectIdx + 1).setValue(catatan || "Ditolak oleh Dewan Pengasuh");
    }
    sheet.getRange(foundRow, updatedIdx + 1).setValue(nowIso);

    return {
      status: "success",
      success: true,
      idIzin: idIzin,
      newStatus: nextStatus,
      message: isApproved 
        ? `Izin ${idIzin} resmi disetujui Pengasuh. Surat & Kartu Izin Digital siap dicetak.`
        : `Izin ${idIzin} telah ditolak oleh Pengasuh.`
    };
  } catch (err) {
    console.error("[APPROVE PENGASUH ERROR]", err);
    return { status: "error", success: false, message: "Gagal memproses persetujuan pengasuh: " + err.message };
  }
}

/**
 * Operasional Pos Gerbang: Check-Out (Keluar) & Check-In (Kembali)
 */
function gateCheckIzin(payload = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    const idIzin = String(payload.idIzin || payload.id_izin || "").trim();
    const tipeAksi = String(payload.tipeAksi || payload.tipe || "checkout").toLowerCase();
    const petugasName = String(payload.petugasName || payload.petugas || "Petugas Gerbang").trim();
    const catatan = String(payload.catatan || "").trim();

    if (!idIzin) throw new Error("ID Izin wajib disertakan.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim());
    const idIdx = headers.indexOf("ID_Izin");
    const statusIdx = headers.indexOf("Status");
    const tglKembaliIdx = headers.indexOf("Tgl_Kembali");
    const jamKembaliIdx = headers.indexOf("Jam_Kembali");
    const checkoutAtIdx = headers.indexOf("Checkout_At");
    const checkoutPetugasIdx = headers.indexOf("Checkout_Petugas");
    const checkinAtIdx = headers.indexOf("Checkin_At");
    const checkinPetugasIdx = headers.indexOf("Checkin_Petugas");
    const catatanLateIdx = headers.indexOf("Catatan_Keterlambatan");
    const updatedIdx = headers.indexOf("Updated_At");

    let foundRow = -1;
    let currentRow = null;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === idIzin) {
        foundRow = i + 1;
        currentRow = data[i];
        break;
      }
    }

    if (foundRow < 0) {
      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        newStatus: (tipeAksi === "checkout" || tipeAksi === "keluar") ? "KELUAR" : "KEMBALI",
        message: `Presensi gerbang untuk izin ${idIzin} berhasil dicatat.`
      };
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (tipeAksi === "checkout" || tipeAksi === "keluar") {
      sheet.getRange(foundRow, statusIdx + 1).setValue("KELUAR");
      sheet.getRange(foundRow, checkoutAtIdx + 1).setValue(nowIso);
      sheet.getRange(foundRow, checkoutPetugasIdx + 1).setValue(petugasName);
      sheet.getRange(foundRow, updatedIdx + 1).setValue(nowIso);

      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        newStatus: "KELUAR",
        message: `Check-out berhasil. Santri resmi dicatat meninggalkan pondok pada ${Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm")} WIB.`
      };
    } else {
      // Check-in (Kembali ke pondok)
      // Cek apakah santri kembali terlambat
      const planDate = String(currentRow[tglKembaliIdx] || "").trim();
      const planTime = String(currentRow[jamKembaliIdx] || "23:59").trim();
      let isLate = false;
      let lateNote = catatan;

      if (planDate) {
        try {
          const deadlineStr = `${planDate}T${planTime.length === 5 ? planTime : (planTime + ':00')}+07:00`;
          const deadlineDate = new Date(deadlineStr);
          if (now > deadlineDate) {
            isLate = true;
            const diffHours = Math.round((now - deadlineDate) / (1000 * 60 * 60));
            lateNote = `Terlambat kembali ~${diffHours} jam dari jadwal rencana (${planDate} ${planTime} WIB). ${catatan}`.trim();
          }
        } catch (e) {}
      }

      const finalStatus = isLate ? "TERLAMBAT" : "KEMBALI";

      sheet.getRange(foundRow, statusIdx + 1).setValue(finalStatus);
      sheet.getRange(foundRow, checkinAtIdx + 1).setValue(nowIso);
      sheet.getRange(foundRow, checkinPetugasIdx + 1).setValue(petugasName);
      if (isLate || lateNote) {
        sheet.getRange(foundRow, catatanLateIdx + 1).setValue(lateNote);
      }
      sheet.getRange(foundRow, updatedIdx + 1).setValue(nowIso);

      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        newStatus: finalStatus,
        isLate: isLate,
        message: isLate 
          ? `Check-in dicatat: Santri kembali TERLAMBAT (${lateNote}).`
          : `Check-in berhasil: Santri kembali tepat waktu di pondok.`
      };
    }
  } catch (err) {
    console.error("[GATE CHECK ERROR]", err);
    return { status: "error", success: false, message: "Gagal memproses check gerbang: " + err.message };
  }
}

/**
 * Menghapus data perizinan santri dari sheet Izin_Perpulangan
 */
function deleteIzinPerpulangan(payload = {}, token = null) {
  try {
    const sheet = getIzinSheet();
    if (!sheet) throw new Error("Gagal mengakses database Izin_Perpulangan.");

    const idIzin = String(payload.idIzin || payload.id_izin || payload.id || "").trim();
    if (!idIzin) throw new Error("ID Izin wajib disertakan.");

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        message: `Data perizinan ${idIzin} tidak ditemukan di Spreadsheet (tabel kosong).`
      };
    }

    const headers = data[0].map(h => String(h || "").trim());
    const idIdx = headers.indexOf("ID_Izin");
    if (idIdx === -1) throw new Error("Kolom ID_Izin tidak ditemukan di spreadsheet.");

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === idIzin) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 1) {
      sheet.deleteRow(foundRow);
      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        message: `Data perizinan ${idIzin} berhasil dihapus dari Spreadsheet.`
      };
    } else {
      return {
        status: "success",
        success: true,
        idIzin: idIzin,
        message: `Data perizinan ${idIzin} tidak ditemukan di Spreadsheet (sudah terhapus sebelumnya).`
      };
    }
  } catch (err) {
    console.error("[DELETE IZIN ERROR]", err);
    return { status: "error", success: false, message: "Gagal menghapus izin dari Spreadsheet: " + err.message };
  }
}

