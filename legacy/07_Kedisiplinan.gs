/**
 * ==============================================================================
 * MODUL 22: KEDISIPLINAN & TARBIYAH SANTRI (PPTQ ASNAWIYYAH)
 * ==============================================================================
 * File: 07_Kedisiplinan.gs
 * Cakupan:
 *  - Master Data Aturan & Tata Tertib Pesantren (CRUD)
 *  - Pencatatan Pelanggaran & Rekam Jejak Kedisiplinan Harian
 *  - Lifecycle Ta'zir & Pembinaan Edukatif (DIPROSES -> SEDANG_TAZIR -> TUNTAS)
 *  - Notifikasi Otomatis WhatsApp Santun ke Wali Santri
 *  - Replikasi Dual-Write Server-Side ke Supabase (kedisiplinan_master & kedisiplinan_logs)
 *  - Ringkasan Mutaba'ah Adab untuk Portal Wali & Monitoring Pengasuh
 * ==============================================================================
 */

const SHEET_KEDISIPLINAN_MASTER = "Kedisiplinan_Master";
const SHEET_KEDISIPLINAN_LOGS = "Kedisiplinan_Logs";

const HEADERS_KEDISIPLINAN_MASTER = [
  "rule_id", "kode_pasal", "nama_pelanggaran", "kategori",
  "poin_default", "rekomendasi_tazir", "status", "urutan",
  "created_at", "updated_at"
];

const HEADERS_KEDISIPLINAN_LOGS = [
  "record_id", "student_id", "nis", "student_name", "gender",
  "kamar_asrama", "nama_halaqah", "rule_id", "nama_pelanggaran", "kategori",
  "poin", "tanggal", "waktu", "lokasi", "kronologi",
  "bentuk_tazir", "status_tazir", "tanggal_tuntas",
  "pencatat_id", "nama_pencatat", "notif_wali_status", "notif_wali_time",
  "created_at", "updated_at"
];

/**
 * Inisialisasi Tab Kedisiplinan_Master dan Kedisiplinan_Logs di Google Spreadsheet
 * Dapat dijalankan langsung dengan menekan tombol 'Jalankan' di editor Google Apps Script.
 */
function initKedisiplinanSheets() {
  try {
    const ss = getDatabaseSpreadsheet();
    Logger.log("[INIT KEDISIPLINAN] Memeriksa & membuat sheet Kedisiplinan di Spreadsheet...");
    ensureKedisiplinanSchema(ss);
    Logger.log("🎉 [SUCCESS] Tab 'Kedisiplinan_Master' dan 'Kedisiplinan_Logs' telah siap di Google Spreadsheet!");
    return {
      status: "success",
      success: true,
      message: "Tab 'Kedisiplinan_Master' dan 'Kedisiplinan_Logs' berhasil disiapkan di Google Spreadsheet!"
    };
  } catch (err) {
    Logger.log("[INIT ERROR] " + err.message);
    console.error("[INIT KEDISIPLINAN ERROR]", err);
    return { status: "error", success: false, message: err.message };
  }
}

/**
 * Helper mendapatkan atau membuat sheet dengan header standar
 */
function getOrCreateKedisiplinanSheet(ss, sheetName, defaultHeaders, headerBgColor) {
  // Jika dipanggil manual tanpa argumen dari toolbar editor Apps Script
  if (!sheetName || !defaultHeaders) {
    Logger.log("[INFO] getOrCreateKedisiplinanSheet dipanggil tanpa parameter. Menjalankan initKedisiplinanSheets()...");
    return initKedisiplinanSheets();
  }

  if (!ss) ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold").setBackground(headerBgColor || "#059669").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    return sheet;
  }

  // Verifikasi kolom jika sheet sudah ada
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold").setBackground(headerBgColor || "#059669").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    return sheet;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim().toLowerCase());
  defaultHeaders.forEach(colName => {
    if (existingHeaders.indexOf(colName.toLowerCase()) === -1) {
      const nextCol = (sheet.getLastColumn() || 0) + 1;
      if (nextCol > sheet.getMaxColumns()) {
        sheet.insertColumnAfter(sheet.getMaxColumns());
      }
      sheet.getRange(1, nextCol).setValue(colName).setFontWeight("bold").setBackground(headerBgColor || "#059669").setFontColor("#ffffff");
      existingHeaders.push(colName.toLowerCase());
    }
  });

  return sheet;
}

/**
 * Inisialisasi awal skema dan data default aturan tata tertib
 */
function ensureKedisiplinanSchema(ss) {
  if (!ss) ss = getDatabaseSpreadsheet();
  const masterSheet = getOrCreateKedisiplinanSheet(ss, SHEET_KEDISIPLINAN_MASTER, HEADERS_KEDISIPLINAN_MASTER, "#047857");
  getOrCreateKedisiplinanSheet(ss, SHEET_KEDISIPLINAN_LOGS, HEADERS_KEDISIPLINAN_LOGS, "#065f46");

  // Jika master masih kosong, lakukan seeding 10 aturan standar pesantren
  if (masterSheet && masterSheet.getLastRow() <= 1) {
    const seedData = [
      ["RULE-001", "Pasal 3 Ayat 1", "Terlambat Mengikuti Sholat Berjamaah Maktubah", "RINGAN", 5, "Membaca Dzikir / Wirid Ba'da Sholat di Serambi Masjid", "AKTIF", 1, new Date().toISOString(), new Date().toISOString()],
      ["RULE-002", "Pasal 3 Ayat 2", "Tidak Hadir / Terlambat Masuk Halaqah Tahfidz", "RINGAN", 5, "Menambah Setoran Ziyadah 1 Halaman di Luar Jam Wajib", "AKTIF", 2, new Date().toISOString(), new Date().toISOString()],
      ["RULE-003", "Pasal 4 Ayat 1", "Tidak Mengenakan Peci / Busana Standar Santri", "RINGAN", 5, "Nasihat lisan & merapikan atribut seragam santri", "AKTIF", 3, new Date().toISOString(), new Date().toISOString()],
      ["RULE-004", "Pasal 4 Ayat 3", "Kamar / Loker Berantakan (Mengabaikan Piket)", "RINGAN", 10, "Membersihkan area lorong asrama selama 1 hari", "AKTIF", 4, new Date().toISOString(), new Date().toISOString()],
      ["RULE-005", "Pasal 5 Ayat 1", "Keluar Area Pondok Tanpa Surat Izin Resmi (Nglencer)", "SEDANG", 25, "Membaca Al-Qur'an 2 Juz di Serambi Masjid & Khidmah Ndalem", "AKTIF", 5, new Date().toISOString(), new Date().toISOString()],
      ["RULE-006", "Pasal 5 Ayat 4", "Membawa / Mengonsumsi Makanan di Kamar Tidur Santri", "SEDANG", 15, "Membersihkan ruang makan & dapur pondok", "AKTIF", 6, new Date().toISOString(), new Date().toISOString()],
      ["RULE-007", "Pasal 6 Ayat 1", "Membawa / Menyimpan HP Ilegal Tanpa Izin Pengurus", "BERAT", 50, "Penyitaan barang, penerbitan SP 1 & pemanggilan Wali Santri", "AKTIF", 7, new Date().toISOString(), new Date().toISOString()],
      ["RULE-008", "Pasal 6 Ayat 2", "Merokok / Menghisap Vape di Lingkungan Pondok", "BERAT", 75, "Penerbitan SP 2, ta'zir khidmah 3 hari & pemanggilan resmi Wali Santri", "AKTIF", 8, new Date().toISOString(), new Date().toISOString()],
      ["RULE-009", "Pasal 6 Ayat 3", "Perkelahian Fisik / Intimidasi (Bullying) Terhadap Teman", "BERAT", 75, "Mediasi khusus Ndalem Pengasuh, SP 2 & takzir pembinaan akhlak", "AKTIF", 9, new Date().toISOString(), new Date().toISOString()],
      ["RULE-010", "Pasal 6 Ayat 5", "Meninggalkan Pondok Tanpa Izin Berhari-hari (Kabur/Bolos)", "BERAT", 100, "Pemanggilan langsung Wali Santri ke Ndalem Pengasuh & evaluasi status santri", "AKTIF", 10, new Date().toISOString(), new Date().toISOString()]
    ];
    masterSheet.getRange(2, 1, seedData.length, seedData[0].length).setValues(seedData);
    Logger.log("[SCHEMA AUTO-INIT] Berhasil memasukkan 10 aturan default ke " + SHEET_KEDISIPLINAN_MASTER);
  }
}

/**
 * 1. Ambil Bank Data Aturan Master (Dropdown & Manajemen)
 */
function getKedisiplinanMasterList(token) {
  try {
    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_MASTER);
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) return { status: "success", success: true, data: [] };

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const rules = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const ruleId = String(row[headers.indexOf("rule_id")] || "").trim();
      if (!ruleId) continue;

      rules.push({
        ruleId: ruleId,
        kodePasal: String(row[headers.indexOf("kode_pasal")] || "").trim(),
        namaPelanggaran: String(row[headers.indexOf("nama_pelanggaran")] || "").trim(),
        kategori: String(row[headers.indexOf("kategori")] || "RINGAN").trim().toUpperCase(),
        poinDefault: Number(row[headers.indexOf("poin_default")]) || 5,
        rekomendasiTazir: String(row[headers.indexOf("rekomendasi_tazir")] || "").trim(),
        status: String(row[headers.indexOf("status")] || "AKTIF").trim().toUpperCase(),
        urutan: Number(row[headers.indexOf("urutan")]) || i,
        updatedAt: row[headers.indexOf("updated_at")] || ""
      });
    }

    rules.sort((a, b) => a.urutan - b.urutan);
    return { status: "success", success: true, data: rules };
  } catch (err) {
    console.error("[GET KEDISIPLINAN MASTER ERROR]", err);
    return { status: "error", success: false, message: "Gagal memuat aturan: " + err.message };
  }
}

/**
 * 2. Simpan / Perbarui Aturan Master (Admin / Kamtib)
 */
function saveKedisiplinanRule(payload, token) {
  try {
    const actor = authenticateSession(token);
    authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "KAMTIB", "PENGASUH"]);

    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_MASTER);

    const ruleId = String(payload.ruleId || payload.rule_id || ("RULE-" + Math.floor(100 + Math.random() * 900))).trim();
    const kodePasal = String(payload.kodePasal || payload.kode_pasal || "").trim();
    const namaPelanggaran = String(payload.namaPelanggaran || payload.nama_pelanggaran || "").trim();
    if (!namaPelanggaran) throw new Error("Nama pelanggaran wajib diisi.");

    const kategori = String(payload.kategori || "RINGAN").trim().toUpperCase();
    const poinDefault = Number(payload.poinDefault || payload.poin_default || 5);
    const rekomendasiTazir = String(payload.rekomendasiTazir || payload.rekomendasi_tazir || "").trim();
    const status = String(payload.status || "AKTIF").trim().toUpperCase();
    const urutan = Number(payload.urutan || (sheet.getLastRow() || 1));
    const now = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("rule_id");
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === ruleId) {
        foundRow = i + 1;
        break;
      }
    }

    const rowMap = {
      "rule_id": ruleId,
      "kode_pasal": kodePasal,
      "nama_pelanggaran": namaPelanggaran,
      "kategori": kategori,
      "poin_default": poinDefault,
      "rekomendasi_tazir": rekomendasiTazir,
      "status": status,
      "urutan": urutan,
      "created_at": foundRow > 0 ? (data[foundRow - 1][headers.indexOf("created_at")] || now) : now,
      "updated_at": now
    };

    const rowValues = headers.map(h => (rowMap[h] !== undefined && rowMap[h] !== null) ? rowMap[h] : "");

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    // Replikasi ke Supabase
    try {
      if (typeof replicateToSupabase === "function") {
        replicateToSupabase("/rest/v1/kedisiplinan_master?on_conflict=rule_id", "POST", {
          rule_id: ruleId,
          kode_pasal: kodePasal || null,
          nama_pelanggaran: namaPelanggaran,
          kategori: kategori,
          poin_default: poinDefault,
          rekomendasi_tazir: rekomendasiTazir || null,
          status: status,
          urutan: urutan,
          updated_at: now
        });
      }
    } catch (sbErr) {
      console.warn("[SUPABASE REPLICATION MASTER WARN]", sbErr);
    }

    return {
      status: "success",
      success: true,
      ruleId: ruleId,
      message: `Aturan '${namaPelanggaran}' berhasil disimpan!`
    };
  } catch (err) {
    console.error("[SAVE KEDISIPLINAN RULE ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyimpan aturan: " + err.message };
  }
}

/**
 * 3. Hapus Aturan Master
 */
function deleteKedisiplinanRule(ruleId, token) {
  try {
    const actor = authenticateSession(token);
    authorizeRole(actor, ["SUPER_ADMIN", "ADMIN"]);

    const cleanRuleId = String(ruleId || "").trim();
    if (!cleanRuleId) throw new Error("ruleId wajib diisi.");

    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_MASTER);
    if (!sheet) throw new Error("Sheet master tidak ditemukan.");

    const data = sheet.getDataRange().getValues();
    const idIdx = data[0].map(h => String(h || "").trim().toLowerCase()).indexOf("rule_id");
    let deleted = false;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === cleanRuleId) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    if (deleted && typeof replicateToSupabase === "function") {
      try {
        replicateToSupabase(`/rest/v1/kedisiplinan_master?rule_id=eq.${encodeURIComponent(cleanRuleId)}`, "DELETE");
      } catch (sbErr) {
        console.warn("[SUPABASE DELETE RULE WARN]", sbErr);
      }
    }

    return { status: "success", success: true, message: `Aturan ${cleanRuleId} berhasil dihapus.` };
  } catch (err) {
    console.error("[DELETE KEDISIPLINAN RULE ERROR]", err);
    return { status: "error", success: false, message: "Gagal menghapus aturan: " + err.message };
  }
}

/**
 * 3b. Ambil Daftar Log Pelanggaran Santri dengan Filter Fleksibel
 */
function getKedisiplinanLogs(filter, token) {
  try {
    let actor = null;
    try {
      actor = authenticateSession(token);
      authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "KAMTIB", "ASATIDZ", "PENGASUH"]);
    } catch (authErr) {
      if (!token) throw authErr;
    }

    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_LOGS);
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) return { status: "success", success: true, data: [] };

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const pFilter = filter || {};
    const fKategori = String(pFilter.kategori || "").trim().toUpperCase();
    const fStatus = String(pFilter.statusTazir || pFilter.status_tazir || "").trim().toUpperCase();
    const fStudentId = String(pFilter.studentId || pFilter.student_id || "").trim();
    const fGender = String(pFilter.gender || "").trim().toUpperCase();
    const limit = Number(pFilter.limit) || 200;

    const logs = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const recordId = String(row[headers.indexOf("record_id")] || "").trim();
      if (!recordId) continue;

      const cat = String(row[headers.indexOf("kategori")] || "").trim().toUpperCase();
      const st = String(row[headers.indexOf("status_tazir")] || "").trim().toUpperCase();
      const sId = String(row[headers.indexOf("student_id")] || "").trim();
      const sNis = String(row[headers.indexOf("nis")] || "").trim();
      const gen = String(row[headers.indexOf("gender")] || "").trim().toUpperCase();

      if (fKategori && fKategori !== "SEMUA" && cat !== fKategori) continue;
      if (fStatus && fStatus !== "SEMUA" && st !== fStatus) continue;
      if (fStudentId && sId !== fStudentId && sNis !== fStudentId) continue;
      if (fGender && fGender !== "SEMUA" && !gen.startsWith(fGender.substring(0, 1))) continue;

      logs.push({
        recordId: recordId,
        studentId: sId,
        nis: sNis,
        studentName: row[headers.indexOf("student_name")],
        gender: row[headers.indexOf("gender")],
        kamarAsrama: row[headers.indexOf("kamar_asrama")],
        namaHalaqah: row[headers.indexOf("nama_halaqah")],
        ruleId: row[headers.indexOf("rule_id")],
        namaPelanggaran: row[headers.indexOf("nama_pelanggaran")],
        kategori: cat,
        poin: Number(row[headers.indexOf("poin")]) || 0,
        tanggal: row[headers.indexOf("tanggal")],
        waktu: row[headers.indexOf("waktu")],
        lokasi: row[headers.indexOf("lokasi")],
        kronologi: row[headers.indexOf("kronologi")],
        bentukTazir: row[headers.indexOf("bentuk_tazir")],
        statusTazir: st,
        tanggalTuntas: row[headers.indexOf("tanggal_tuntas")],
        pencatatId: row[headers.indexOf("pencatat_id")],
        namaPencatat: row[headers.indexOf("nama_pencatat")],
        notifWaliStatus: row[headers.indexOf("notif_wali_status")],
        notifWaliTime: row[headers.indexOf("notif_wali_time")],
        createdAt: row[headers.indexOf("created_at")]
      });
    }

    logs.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    return { status: "success", success: true, data: logs.slice(0, limit) };
  } catch (err) {
    console.error("[GET KEDISIPLINAN LOGS ERROR]", err);
    return { status: "error", success: false, message: "Gagal memuat log: " + err.message };
  }
}

/**
 * 4. Catat Kejadian Pelanggaran Santri Baru (Mobile Input + Dual Write + WA)
 */
function saveKedisiplinanLog(payload, token) {
  try {
    let actor = null;
    try {
      actor = authenticateSession(token);
      authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "KAMTIB", "ASATIDZ", "PENGASUH"]);
    } catch (authErr) {
      if (!token) throw authErr;
    }

    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_LOGS);

    const studentId = String(payload.studentId || payload.student_id || "").trim();
    const nis = String(payload.nis || "").trim();
    const studentName = String(payload.studentName || payload.student_name || payload.name || "").trim();
    if (!studentId && !studentName) throw new Error("Santri wajib dipilih.");

    const padZ = (n) => String(n).padStart(2, "0");
    const dNow = new Date();
    const autoRecordId = `DSC-${dNow.getFullYear()}${padZ(dNow.getMonth() + 1)}${padZ(dNow.getDate())}-${padZ(dNow.getHours())}${padZ(dNow.getMinutes())}${padZ(dNow.getSeconds())}-${Math.floor(1000 + Math.random() * 9000)}`;

    const recordId = String(payload.recordId || payload.record_id || autoRecordId).trim();
    const gender = (payload.gender || "L").toUpperCase().startsWith("P") ? "Putri" : "Putra";
    const kamarAsrama = String(payload.kamarAsrama || payload.kamar_asrama || "").trim();
    const namaHalaqah = String(payload.namaHalaqah || payload.nama_halaqah || "").trim();

    const ruleId = String(payload.ruleId || payload.rule_id || "").trim();
    const namaPelanggaran = String(payload.namaPelanggaran || payload.nama_pelanggaran || "").trim();
    if (!namaPelanggaran) throw new Error("Nama pelanggaran wajib diisi.");

    const kategori = String(payload.kategori || "RINGAN").trim().toUpperCase();
    const poin = Number(payload.poin !== undefined ? payload.poin : (payload.poinDefault || 5));
    const tanggal = payload.tanggal ? normalizeDateString(payload.tanggal) : Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const waktu = String(payload.waktu || Utilities.formatDate(new Date(), "GMT+7", "HH:mm") + " WIB").trim();
    const lokasi = String(payload.lokasi || "Lingkungan Pondok").trim();
    const kronologi = String(payload.kronologi || "").trim();
    const bentukTazir = String(payload.bentukTazir || payload.bentuk_tazir || "Bimbingan & Nasihat Pengurus").trim();
    const statusTazir = String(payload.statusTazir || payload.status_tazir || "DIPROSES").trim().toUpperCase();
    const tanggalTuntas = statusTazir === "TUNTAS" ? (payload.tanggalTuntas || tanggal) : null;

    const pencatatId = actor ? actor.userId : String(payload.pencatatId || payload.pencatat_id || "KAMTIB").trim();
    const namaPencatat = actor ? actor.name : String(payload.namaPencatat || payload.nama_pencatat || "Pengurus Keamanan").trim();

    const now = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("record_id");
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === recordId) {
        foundRow = i + 1;
        break;
      }
    }

    // Resolusi Nomor HP Wali Santri untuk Notifikasi WhatsApp
    let notifWaliStatus = "PENDING";
    let notifWaliTime = null;
    let targetPhone = String(payload.phoneWali || payload.phone || "").trim();

    if (!targetPhone) {
      try {
        targetPhone = resolveParentPhoneByStudent_(ss, studentId, nis);
      } catch (pErr) {
        console.warn("[RESOLVE PARENT PHONE WARN]", pErr);
      }
    }

    if (targetPhone) {
      try {
        const waSent = sendKedisiplinanWhatsAppNotif_(
          targetPhone, studentName, nis, namaPelanggaran, kategori,
          poin, tanggal, waktu, lokasi, bentukTazir, statusTazir
        );
        if (waSent) {
          notifWaliStatus = "TERKIRIM";
          notifWaliTime = now;
        } else {
          notifWaliStatus = "GAGAL";
        }
      } catch (waErr) {
        console.warn("[WA DISPATCH WARN]", waErr);
        notifWaliStatus = "GAGAL";
      }
    }

    const rowMap = {
      "record_id": recordId,
      "student_id": studentId,
      "nis": nis,
      "student_name": studentName,
      "gender": gender,
      "kamar_asrama": kamarAsrama,
      "nama_halaqah": namaHalaqah,
      "rule_id": ruleId,
      "nama_pelanggaran": namaPelanggaran,
      "kategori": kategori,
      "poin": poin,
      "tanggal": tanggal,
      "waktu": waktu,
      "lokasi": lokasi,
      "kronologi": kronologi,
      "bentuk_tazir": bentukTazir,
      "status_tazir": statusTazir,
      "tanggal_tuntas": tanggalTuntas,
      "pencatat_id": pencatatId,
      "nama_pencatat": namaPencatat,
      "notif_wali_status": notifWaliStatus,
      "notif_wali_time": notifWaliTime,
      "created_at": foundRow > 0 ? (data[foundRow - 1][headers.indexOf("created_at")] || now) : now,
      "updated_at": now
    };

    const rowValues = headers.map(h => (rowMap[h] !== undefined && rowMap[h] !== null) ? rowMap[h] : "");

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    // Replikasi Dual-Write Server-Side ke Supabase
    try {
      if (typeof replicateToSupabase === "function") {
        replicateToSupabase("/rest/v1/kedisiplinan_logs?on_conflict=record_id", "POST", {
          record_id: recordId,
          student_id: studentId,
          nis: nis || null,
          student_name: studentName,
          gender: gender,
          kamar_asrama: kamarAsrama || null,
          nama_halaqah: namaHalaqah || null,
          rule_id: ruleId || null,
          nama_pelanggaran: namaPelanggaran,
          kategori: kategori,
          poin: poin,
          tanggal: tanggal,
          waktu: waktu || null,
          lokasi: lokasi || null,
          kronologi: kronologi || null,
          bentuk_tazir: bentukTazir || null,
          status_tazir: statusTazir,
          tanggal_tuntas: tanggalTuntas,
          pencatat_id: pencatatId || null,
          nama_pencatat: namaPencatat || null,
          notif_wali_status: notifWaliStatus,
          notif_wali_time: notifWaliTime,
          updated_at: now
        });
      }
    } catch (sbErr) {
      console.warn("[SUPABASE REPLICATION LOGS WARN]", sbErr);
    }

    return {
      status: "success",
      success: true,
      recordId: recordId,
      message: `Catatan kedisiplinan untuk ${studentName} berhasil disimpan (${statusTazir})!`,
      notifStatus: notifWaliStatus
    };
  } catch (err) {
    console.error("[SAVE KEDISIPLINAN LOG ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyimpan catatan: " + err.message };
  }
}

/**
 * 5. Update Status Ta'zir (Penyelesaian Pembinaan Edukatif)
 */
function updateStatusTazir(payload, token) {
  try {
    const actor = authenticateSession(token);
    authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "KAMTIB", "ASATIDZ", "PENGASUH"]);

    const recordId = String(payload.recordId || payload.record_id || "").trim();
    if (!recordId) throw new Error("recordId wajib diisi.");

    const statusTazir = String(payload.statusTazir || payload.status_tazir || "TUNTAS").trim().toUpperCase();
    const today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const tanggalTuntas = statusTazir === "TUNTAS" ? (payload.tanggalTuntas || today) : null;
    const now = new Date().toISOString();

    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_LOGS);
    if (!sheet) throw new Error("Sheet kedisiplinan logs tidak ditemukan.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("record_id");
    const stIdx = headers.indexOf("status_tazir");
    const ttIdx = headers.indexOf("tanggal_tuntas");
    const upIdx = headers.indexOf("updated_at");

    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === recordId) {
        if (stIdx !== -1) sheet.getRange(i + 1, stIdx + 1).setValue(statusTazir);
        if (ttIdx !== -1) sheet.getRange(i + 1, ttIdx + 1).setValue(tanggalTuntas || "");
        if (upIdx !== -1) sheet.getRange(i + 1, upIdx + 1).setValue(now);
        updated = true;
        break;
      }
    }

    if (!updated) throw new Error("Catatan dengan ID " + recordId + " tidak ditemukan.");

    // Replikasi ke Supabase
    try {
      if (typeof replicateToSupabase === "function") {
        replicateToSupabase(`/rest/v1/kedisiplinan_logs?record_id=eq.${encodeURIComponent(recordId)}`, "PATCH", {
          status_tazir: statusTazir,
          tanggal_tuntas: tanggalTuntas,
          updated_at: now
        });
      }
    } catch (sbErr) {
      console.warn("[SUPABASE UPDATE TAZIR WARN]", sbErr);
    }

    return {
      status: "success",
      success: true,
      recordId: recordId,
      statusTazir: statusTazir,
      message: `Status ta'zir santri berhasil diperbarui menjadi ${statusTazir}!`
    };
  } catch (err) {
    console.error("[UPDATE STATUS TAZIR ERROR]", err);
    return { status: "error", success: false, message: "Gagal memperbarui status: " + err.message };
  }
}

/**
 * 6. Riwayat & Ringkasan Kedisiplinan 1 Santri (Untuk Portal Wali & Profil Santri)
 */
function getKedisiplinanStudentSummary(studentIdOrNis, token) {
  try {
    const cleanId = String(studentIdOrNis || "").trim();
    if (!cleanId) throw new Error("studentId atau nis wajib disertakan.");

    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_LOGS);
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        status: "success",
        success: true,
        data: {
          totalPoin: 0,
          totalKasus: 0,
          tazirAktif: 0,
          statusAdab: "DISIPLIN",
          logs: []
        }
      };
    }

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("student_id");
    const nisIdx = headers.indexOf("nis");
    const poinIdx = headers.indexOf("poin");
    const stIdx = headers.indexOf("status_tazir");

    let totalPoin = 0;
    let totalKasus = 0;
    let tazirAktif = 0;
    const logs = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sId = String(row[idIdx] || "").trim();
      const sNis = String(row[nisIdx] || "").trim();

      if (sId === cleanId || sNis === cleanId) {
        totalKasus++;
        const p = Number(row[poinIdx]) || 0;
        totalPoin += p;

        const st = String(row[stIdx] || "DIPROSES").trim().toUpperCase();
        if (st !== "TUNTAS") tazirAktif++;

        logs.push({
          recordId: row[headers.indexOf("record_id")],
          namaPelanggaran: row[headers.indexOf("nama_pelanggaran")],
          kategori: row[headers.indexOf("kategori")],
          poin: p,
          tanggal: row[headers.indexOf("tanggal")],
          waktu: row[headers.indexOf("waktu")],
          lokasi: row[headers.indexOf("lokasi")],
          kronologi: row[headers.indexOf("kronologi")],
          bentukTazir: row[headers.indexOf("bentuk_tazir")],
          statusTazir: st,
          tanggalTuntas: row[headers.indexOf("tanggal_tuntas")],
          namaPencatat: row[headers.indexOf("nama_pencatat")]
        });
      }
    }

    // Urutkan riwayat dari yang terbaru
    logs.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    let statusAdab = "DISIPLIN";
    if (tazirAktif > 0) statusAdab = "DALAM_PEMBINAAN";
    if (totalPoin >= 50) statusAdab = "PERLU_PERHATIAN";

    return {
      status: "success",
      success: true,
      data: {
        totalPoin: totalPoin,
        totalKasus: totalKasus,
        tazirAktif: tazirAktif,
        statusAdab: statusAdab,
        logs: logs
      }
    };
  } catch (err) {
    console.error("[GET STUDENT DISCIPLINE SUMMARY ERROR]", err);
    return { status: "error", success: false, message: "Gagal mengambil data: " + err.message };
  }
}

/**
 * 7. Dashboard Eksekutif Kedisiplinan (Admin & Pengasuh)
 */
function getKedisiplinanDashboardSummary(token) {
  try {
    const actor = authenticateSession(token);
    authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "KAMTIB", "ASATIDZ", "PENGASUH"]);

    const ss = getDatabaseSpreadsheet();
    ensureKedisiplinanSchema(ss);
    const sheet = ss.getSheetByName(SHEET_KEDISIPLINAN_LOGS);
    const data = sheet.getDataRange().getValues();

    if (!data || data.length <= 1) {
      return {
        status: "success",
        success: true,
        data: {
          totalKasus: 0,
          tazirAktif: 0,
          santriPerhatianKhusus: 0,
          ringkasanSantriKritis: [],
          kategoriBreakdown: { RINGAN: 0, SEDANG: 0, BERAT: 0 }
        }
      };
    }

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const studentPointMap = {};
    let totalKasus = 0;
    let tazirAktif = 0;
    const catMap = { RINGAN: 0, SEDANG: 0, BERAT: 0 };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sId = String(row[headers.indexOf("student_id")] || "").trim();
      if (!sId) continue;

      totalKasus++;
      const p = Number(row[headers.indexOf("poin")]) || 0;
      const cat = String(row[headers.indexOf("kategori")] || "RINGAN").trim().toUpperCase();
      if (catMap[cat] !== undefined) catMap[cat]++;

      const st = String(row[headers.indexOf("status_tazir")] || "DIPROSES").trim().toUpperCase();
      if (st !== "TUNTAS") tazirAktif++;

      if (!studentPointMap[sId]) {
        studentPointMap[sId] = {
          studentId: sId,
          nis: row[headers.indexOf("nis")],
          studentName: row[headers.indexOf("student_name")],
          gender: row[headers.indexOf("gender")],
          kamarAsrama: row[headers.indexOf("kamar_asrama")],
          totalPoin: 0,
          kasusCount: 0
        };
      }
      studentPointMap[sId].totalPoin += p;
      studentPointMap[sId].kasusCount += 1;
    }

    const kritisList = Object.values(studentPointMap)
      .filter(s => s.totalPoin >= 30)
      .sort((a, b) => b.totalPoin - a.totalPoin);

    return {
      status: "success",
      success: true,
      data: {
        totalKasus: totalKasus,
        tazirAktif: tazirAktif,
        santriPerhatianKhusus: kritisList.filter(s => s.totalPoin >= 50).length,
        ringkasanSantriKritis: kritisList,
        kategoriBreakdown: catMap
      }
    };
  } catch (err) {
    console.error("[GET DASHBOARD DISCIPLINE SUMMARY ERROR]", err);
    return { status: "error", success: false, message: "Gagal memuat ringkasan: " + err.message };
  }
}

/**
 * Helper Resolusi Nomor HP Wali Santri berdasarkan Student ID atau NIS
 */
function resolveParentPhoneByStudent_(ss, studentId, nis) {
  if (!ss) ss = getDatabaseSpreadsheet();
  const mapSheet = ss.getSheetByName("Wali_Santri_Map");
  const usersSheet = ss.getSheetByName("Users");
  if (!mapSheet || !usersSheet) return "";

  const mapData = mapSheet.getDataRange().getValues();
  if (mapData.length <= 1) return "";
  const mapHeaders = mapData[0].map(h => String(h || "").trim().toLowerCase());
  const sIdIdx = mapHeaders.indexOf("student_id");
  const wIdIdx = mapHeaders.indexOf("wali_id");

  let targetWaliId = "";
  for (let i = 1; i < mapData.length; i++) {
    if (String(mapData[i][sIdIdx] || "").trim() === studentId) {
      targetWaliId = String(mapData[i][wIdIdx] || "").trim();
      break;
    }
  }

  if (!targetWaliId) return "";

  const uData = usersSheet.getDataRange().getValues();
  const uHeaders = uData[0].map(h => String(h || "").trim().toLowerCase());
  const uIdIdx = uHeaders.indexOf("user_id");
  const phoneIdx = uHeaders.indexOf("phone");

  for (let j = 1; j < uData.length; j++) {
    if (String(uData[j][uIdIdx] || "").trim() === targetWaliId) {
      return String(uData[j][phoneIdx] || "").trim();
    }
  }

  return "";
}

/**
 * Dispatcher WhatsApp Santun Khusus Kedisiplinan & Tarbiyah
 */
function sendKedisiplinanWhatsAppNotif_(targetPhone, studentName, nis, pelanggaran, kategori, poin, tanggal, waktu, lokasi, bentukTazir, statusTazir) {
  const gatewayUrl = getServerSecret("WA_GATEWAY_URL", "");
  const gatewayApiKey = getServerSecret("WA_GATEWAY_API_KEY", "");
  if (!gatewayUrl || !targetPhone) return false;

  const statusBadge = statusTazir === "TUNTAS" ? "✅ Telah Diselesaikan (Tuntas)" : "⏳ Sedang Dalam Pembinaan";

  const message =
    `*Assalamu'alaikum Warahmatullahi Wabarakatuh.*\n\n` +
    `Yth. Bapak/Ibu Wali dari Ananda:\n` +
    `👤 *${studentName}* (NIS: ${nis || "-"})\n\n` +
    `Kami dari Bagian Kedisiplinan & Tarbiyah PPTQ Asnawiyyah menginformasikan catatan mutaba'ah adab & ketertiban ananda:\n\n` +
    `📌 *Catatan:* ${pelanggaran}\n` +
    `⚖️ *Kategori:* ${kategori} (${poin} Poin)\n` +
    `📅 *Waktu:* ${tanggal}, Pukul ${waktu || "-"}\n` +
    `📍 *Lokasi:* ${lokasi}\n\n` +
    `🌱 *Bentuk Tarbiyah (Ta'zir Mendidik):*\n` +
    `"${bentukTazir}"\n\n` +
    `Status Pembinaan: *${statusBadge}*\n\n` +
    `Pemberitahuan ini kami sampaikan sebagai bentuk keterbukaan informasi agar Bapak/Ibu dapat bersama-sama membimbing dan mendoakan ananda dari rumah, demi terbentuknya pribadi santri penghafal Al-Qur'an yang beradab dan berakhlak mulia.\n\n` +
    `Pantau perkembangan ananda melalui Portal Resmi:\n` +
    `🔗 https://asnawiyyah.or.id\n\n` +
    `*Wassalamu'alaikum Warahmatullahi Wabarakatuh.*\n` +
    `_Pengurus Kedisiplinan & Tarbiyah PPTQ Asnawiyyah_`;

  const payload = {
    phone: targetPhone,
    message: message
  };

  const headers = { "Content-Type": "application/json" };
  if (gatewayApiKey) headers["Authorization"] = "Bearer " + gatewayApiKey;

  try {
    const res = UrlFetchApp.fetch(gatewayUrl, {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return res.getResponseCode() >= 200 && res.getResponseCode() < 300;
  } catch (e) {
    console.warn("[SEND WA KEDISIPLINAN ERROR]", e);
    return false;
  }
}
