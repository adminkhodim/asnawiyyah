/**
 * ============================================================================
 * 04_Tahfidz.gs
 * PPTQ Asnawiyyah Backend Architecture - Modul Tahfidz Al-Qur'an Terintegrasi
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Mutaba'ah & Riwayat Setoran Tahfidz (saveTahfidzLog, deleteTahfidzLog)
 *  - Halaqah Management & Santri Plotting (saveTahfidzHalaqah, saveTahfidzPlotting)
 *  - Target Tahfidz Individu & Bulk Target (saveTahfidzTarget, saveBulkTahfidzTarget)
 *  - Rekap Capaian & Deduplikasi Real-Time (cleanTahfidzCapaianDuplicates)
 *  - Jadwal Sesi Tahfidz Waktu (saveTahfidzSesi, deleteTahfidzSesi)
 *  - Dashboard Agregat Makro & Detail Santri (getTahfidzDashboard, getTahfidzStudentDetail)
 *  - Inisialisasi Sheet & Migrasi Skema Standar Mubarokah (initTahfidzSheets)
 * ============================================================================
 */

// MODUL BACKEND: TAHFIDZ AL-QUR'AN (MUTABA'AH, HALAQAH, TARGET)
// Terinspirasi dari standar Khodim.com (Mushaf Pojok 20 Hlm/Juz)
// ====================================================================

/**
 * Normalisasi dan deteksi indeks kolom tab Tahfidz_Halaqah secara tangguh.
 * Menghindari bug jika header spreadsheet memiliki spasi, garis bawah, atau perbedaan penamaan.
 */
function getHalaqahColumnIndexes(headerRow) {
  if (!headerRow || !headerRow.length) return { id: -1, nama: -1, kategori: -1, muhafiz: -1, target: -1, studentIds: -1, createdAt: -1 };
  const normalized = headerRow.map(x => String(x || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
  const find = (keywords) => {
    for (let i = 0; i < keywords.length; i++) {
      const cleanK = keywords[i].replace(/[\s\-_]+/g, "");
      const idx = normalized.indexOf(cleanK);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return {
    id: find(["halaqah_id", "halaqahid", "id_halaqah", "idhalaqah", "id", "kode_halaqah", "kode"]),
    nama: find(["nama_halaqah", "namahalaqah", "nama", "halaqah", "nama_kelompok", "kelompok"]),
    kategori: find(["kategori", "category", "program"]),
    muhafiz: find(["muhafiz", "muhafidz", "pembina", "ustadz", "guru"]),
    target: find(["target_kurikulum", "targetkurikulum", "target", "kurikulum"]),
    studentIds: find(["student_ids", "studentids", "anggota", "santri_ids", "santri", "siswa"]),
    createdAt: find(["created_at", "createdat", "tanggal", "waktu"])
  };
}

/**
 * Otomatis migrasi header & susunan data sheet Tahfidz_Halaqah
 * Menghilangkan kolom nama_halaqah & kategori sesuai rancangan standar 5 kolom:
 * [halaqah_id, muhafiz, target_kurikulum, student_ids, created_at]
 */
function migrateTahfidzHalaqahSheet_(ss) {
  try {
    if (!ss) return;
    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (!data || data.length === 0) return;

    const targetHeaders = ["halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"];
    const currentHeaders = data[0].map(h => String(h || "").trim().toLowerCase());
    
    // Cek apakah sheet masih memiliki kolom 'nama_halaqah' atau 'kategori'
    const hasNama = currentHeaders.some(h => h.includes("nama_halaqah") || h === "nama" || h.includes("namahalaqah"));
    const hasKategori = currentHeaders.some(h => h === "kategori" || h === "category");

    // Jika sudah sesuai (hanya 5 kolom dan tidak ada nama_halaqah / kategori), lewati
    if (!hasNama && !hasKategori && data[0].length === targetHeaders.length) {
      return;
    }

    const colMap = getHalaqahColumnIndexes(data[0]);
    const migratedRows = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const hId = colMap.id !== -1 ? String(row[colMap.id] || "").trim() : "";
      let hMuh = colMap.muhafiz !== -1 ? String(row[colMap.muhafiz] || "").trim() : "";
      
      // Jika muhafiz kosong tapi nama_halaqah ada, kita fallback gunakan
      if (!hMuh && colMap.nama !== -1) {
        hMuh = String(row[colMap.nama] || "").trim();
      }

      if (!hId && !hMuh) continue;

      const hTarget = colMap.target !== -1 ? String(row[colMap.target] || "").trim() : "Tahfidz 30 Juz";
      const hStudents = colMap.studentIds !== -1 ? String(row[colMap.studentIds] || "").trim() : "";
      const hCreated = colMap.createdAt !== -1 ? String(row[colMap.createdAt] || "").trim() : new Date().toISOString();

      migratedRows.push([
        hId || ("HLQ-" + (i < 10 ? "0" + i : i)),
        hMuh || "Ustadz Pembina",
        hTarget || "Tahfidz 30 Juz",
        hStudents,
        hCreated
      ]);
    }

    // Bersihkan sheet dan pasang 5 kolom standar baru
    sheet.clear();
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    sheet.getRange(1, 1, 1, targetHeaders.length)
      .setBackground("#059669")
      .setFontColor("#ffffff")
      .setFontWeight("bold");

    if (migratedRows.length > 0) {
      sheet.getRange(2, 1, migratedRows.length, targetHeaders.length).setValues(migratedRows);
    }

    // Hapus sisa kolom jika sheet punya lebih dari 5 kolom
    const maxCols = sheet.getMaxColumns();
    if (maxCols > targetHeaders.length) {
      try {
        sheet.deleteColumns(targetHeaders.length + 1, maxCols - targetHeaders.length);
      } catch (colErr) {
        // Abaikan jika tidak diizinkan oleh spreadsheet
      }
    }

    console.log(`[MIGRATION SUCCESS] Tahfidz_Halaqah berhasil disesuaikan menjadi 5 kolom tanpa nama_halaqah & kategori (${migratedRows.length} baris).`);
  } catch (err) {
    console.error("[MIGRATE TAHFIDZ HALAQAH ERROR]", err);
  }
}

const SHEET_TAHFIDZ_LOGS = "Tahfidz_Logs";
const SHEET_TAHFIDZ_CAPAIAN = "Tahfidz_Capaian";
const SHEET_TAHFIDZ_TARGET = "Tahfidz_Target";
const SHEET_TAHFIDZ_HALAQAH = "Tahfidz_Halaqah";
const SHEET_TAHFIDZ_SESI = "Tahfidz_Jadwal_Sesi";
const SHEET_TAHFIDZ_PRESENSI = "Tahfidz_Presensi";
const SHEET_IZIN_ASATIDZ = "Izin_Asatidz";

const HEADERS_TAHFIDZ_PRESENSI = [
  "presensi_id", "tanggal", "sesi", "halaqah_id", "nama_halaqah",
  "student_id", "nis", "student_name", "status", "keterangan",
  "muhafiz", "updated_at"
];

const HEADERS_IZIN_ASATIDZ = [
  "id_izin", "asatidz_id", "nama_asatidz", "tanggal_mulai", "tanggal_selesai",
  "sesi", "kategori", "alasan", "badal_id", "nama_badal",
  "catatan_badal", "lampiran_url", "status", "pengasuh_approved_by",
  "pengasuh_approved_at", "catatan_pengasuh", "created_at", "updated_at"
];

// Urutan Kurikulum Tahfidz Pesantren (Mulai Juz 30 s/d 21, lalu Juz 1 s/d 20)
const TAHFIDZ_CURRICULUM_JUZ_ORDER = [
  30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];

function getTahfidzCurriculumRank_(juz) {
  var idx = TAHFIDZ_CURRICULUM_JUZ_ORDER.indexOf(Number(juz));
  return idx !== -1 ? idx : 0;
}

function getTahfidzCurriculumTotalTuntas_(juz, hal) {
  var rank = getTahfidzCurriculumRank_(juz);
  var h = Math.min(20, Math.max(1, Number(hal) || 1));
  return rank * 20 + parseTahfidzLatestPage_(hal);
}

function parseTahfidzLatestPage_(halVal) {
  if (halVal === null || halVal === undefined || halVal === "") return 1;
  if (typeof halVal === "number" && !isNaN(halVal)) {
    return Math.min(20, Math.max(1, Math.round(halVal)));
  }
  var str = String(halVal).trim();
  var matches = str.match(/\d+/g);
  if (!matches || matches.length === 0) return 1;
  var max = 1;
  for (var i = 0; i < matches.length; i++) {
    var n = Number(matches[i]);
    if (!isNaN(n) && n > max) max = n;
  }
  return Math.min(20, Math.max(1, max));
}

/**
 * Helper untuk mendapatkan atau membuat sheet tahfidz secara otomatis dengan styling header rapi
 */

/**
 * Auto-migration & Schema Check untuk Tahfidz_Logs (kolom status_setoran, satuan, ayat_mulai, ayat_sampai) & Sheet Tahfidz_Capaian
 */
function ensureTahfidzLogsAndCapaianSchema_(ss) {
  try {
    if (!ss) return;

    // 1. Pastikan kolom status_setoran, satuan, ayat_mulai, ayat_sampai ada di Tahfidz_Logs
    const logsSheet = ss.getSheetByName(SHEET_TAHFIDZ_LOGS);
    if (logsSheet) {
      let lastCol = logsSheet.getLastColumn();
      if (lastCol > 0) {
        let headers = logsSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim().toLowerCase());
        
        // 1a. Kolom status_setoran
        const statusIdx = headers.indexOf("status_setoran");
        if (statusIdx === -1) {
          const nextCol = lastCol + 1;
          if (nextCol > logsSheet.getMaxColumns()) {
            logsSheet.insertColumnAfter(logsSheet.getMaxColumns());
          }
          logsSheet.getRange(1, nextCol).setValue("status_setoran")
            .setFontWeight("bold")
            .setBackground("#059669")
            .setFontColor("#ffffff");

          // Backfill nilai default 'LANJUT' untuk baris data yang ada
          const lastRow = logsSheet.getLastRow();
          if (lastRow > 1) {
            const nilaiIdx = headers.indexOf("nilai");
            const values = [];
            if (nilaiIdx !== -1) {
              const nilaiData = logsSheet.getRange(2, nilaiIdx + 1, lastRow - 1, 1).getValues();
              for (let i = 0; i < nilaiData.length; i++) {
                const n = String(nilaiData[i][0] || "").trim().toUpperCase();
                values.push([n === "DHAIF" ? "ULANG" : "LANJUT"]);
              }
            } else {
              for (let i = 0; i < lastRow - 1; i++) {
                values.push(["LANJUT"]);
              }
            }
            logsSheet.getRange(2, nextCol, values.length, 1).setValues(values);
          }
          lastCol = nextCol;
          headers.push("status_setoran");
          console.log("[SCHEMA SUCCESS] Kolom status_setoran berhasil ditambahkan ke Tahfidz_Logs.");
        }

        // 1b. Kolom khusus Setoran Per Ayat (Tahfidz Anak): satuan, ayat_mulai, ayat_sampai
        const extraColumns = [
          { name: "satuan", defaultVal: "HALAMAN" },
          { name: "ayat_mulai", defaultVal: "" },
          { name: "ayat_sampai", defaultVal: "" }
        ];

        extraColumns.forEach(colObj => {
          if (headers.indexOf(colObj.name) === -1) {
            const nextCol = lastCol + 1;
            if (nextCol > logsSheet.getMaxColumns()) {
              logsSheet.insertColumnAfter(logsSheet.getMaxColumns());
            }
            logsSheet.getRange(1, nextCol).setValue(colObj.name)
              .setFontWeight("bold")
              .setBackground("#059669")
              .setFontColor("#ffffff");

            const lastRow = logsSheet.getLastRow();
            if (lastRow > 1) {
              const defaultVals = [];
              for (let i = 0; i < lastRow - 1; i++) {
                defaultVals.push([colObj.defaultVal]);
              }
              logsSheet.getRange(2, nextCol, defaultVals.length, 1).setValues(defaultVals);
            }
            lastCol = nextCol;
            headers.push(colObj.name);
            console.log(`[SCHEMA SUCCESS] Kolom ${colObj.name} berhasil ditambahkan ke Tahfidz_Logs.`);
          }
        });
      }
    }

    // 2. Pastikan sheet Tahfidz_Capaian sudah ada
    const headersCapaian = [
      "student_id", "student_name", "juz_aktif", "halaman_terakhir", "total_halaman_tuntas", "status_terakhir", "halaqah_id", "nama_halaqah", "muhafiz_pembina", "updated_at",
      "sabqi_halaman", "manzil_juz", "manzil_halaman", "manzil_putaran", "total_halaman_murojaah"
    ];
    let capaianSheet = ss.getSheetByName(SHEET_TAHFIDZ_CAPAIAN);
    if (!capaianSheet) {
      capaianSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_CAPAIAN, headersCapaian, "#059669");
      console.log("[SCHEMA SUCCESS] Sheet Tahfidz_Capaian berhasil dibuat.");
    }

    // 3. Sinkronisasikan data jika sheet baru dibuat / kosong
    if (!capaianSheet || capaianSheet.getLastRow() <= 1) {
      syncTahfidzCapaianSheet_(ss);
    }
  } catch (err) {
    console.error("[ENSURE TAHFIDZ SCHEMA ERROR]", err);
  }
}

/**
 * Sinkronisasi Komprehensif Seluruh Data Capaian Santri ke Sheet Tahfidz_Capaian
 * - Mengambil seluruh plotting halaqah dari Tahfidz_Halaqah (kolom halaqah_id, nama_halaqah, muhafiz)
 * - Mengambil setoran terakhir santri dari Tahfidz_Logs (Ziyadah, Sabqi, Manzil, Muroja'ah)
 * - Mengambil nama santri dari master Students jika belum ada di logs
 * - STANDAR TEPAT: 1 SANTRI = 1 BARIS (Bebas total dari data ganda & inkonsistensi huruf besar/kecil)
 * - Mengisi seluruh 15 kolom secara konsisten dan lengkap sesuai kurikulum baru (Juz 30-21, 1-20)
 */
function syncTahfidzCapaianSheet_(ss) {
  try {
    if (!ss) return;

    const headersCapaian = [
      "student_id", "student_name", "juz_aktif", "halaman_terakhir", "total_halaman_tuntas",
      "status_terakhir", "halaqah_id", "nama_halaqah", "muhafiz_pembina", "updated_at",
      "sabqi_halaman", "manzil_juz", "manzil_halaman", "manzil_putaran", "total_halaman_murojaah"
    ];

    const capaianSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_CAPAIAN, headersCapaian, "#059669");
    if (!capaianSheet) return;

    // 1. Peta resolusi alias ID -> Canonical ID (STD-xxx) & Master Nama Santri
    const studentNameMap = {};
    const aliasToCanonIdMap = {};

    try {
      const studentSheet = getAuthSheet(ss, SHEET_STUDENTS);
      if (studentSheet && studentSheet.getLastRow() > 1) {
        const sData = studentSheet.getDataRange().getValues();
        const sHeaders = sData[0].map(h => String(h || "").trim().toLowerCase().replace(/\s+/g, "_"));
        const sIdIdx = sHeaders.indexOf("student_id");
        const sNisIdx = sHeaders.indexOf("nis") !== -1 ? sHeaders.indexOf("nis") : sHeaders.indexOf("nisn");
        const sNameIdx = sHeaders.indexOf("name") !== -1 ? sHeaders.indexOf("name") : sHeaders.indexOf("nama");
        for (let i = 1; i < sData.length; i++) {
          const sid = sIdIdx !== -1 ? String(sData[i][sIdIdx] || "").trim() : "";
          const snis = sNisIdx !== -1 ? String(sData[i][sNisIdx] || "").trim() : "";
          const sname = sNameIdx !== -1 ? String(sData[i][sNameIdx] || "").trim() : "";
          const canonId = (sid || snis).toUpperCase();
          if (canonId) {
            aliasToCanonIdMap[canonId] = canonId;
            aliasToCanonIdMap[canonId.toLowerCase()] = canonId;
            if (sid) {
              aliasToCanonIdMap[sid.toUpperCase()] = canonId;
              aliasToCanonIdMap[sid.toLowerCase()] = canonId;
            }
            if (snis) {
              aliasToCanonIdMap[snis.toUpperCase()] = canonId;
              aliasToCanonIdMap[snis.toLowerCase()] = canonId;
            }
            if (sname) {
              studentNameMap[canonId] = sname;
              const normName = sname.toLowerCase().replace(/[^a-z0-9]/g, "");
              if (normName) aliasToCanonIdMap[normName] = canonId;
            }
          }
        }
      }
    } catch (e) {
      console.warn("[SYNC CAPAIAN MASTER STUDENTS WARN]", e);
    }

    // Helper penyelarasan ke ID Resmi santri
    const resolveCanonId = function(rawKey, rawName) {
      if (!rawKey && !rawName) return "";
      const k = String(rawKey || "").trim();
      if (k) {
        const kUpper = k.toUpperCase();
        if (aliasToCanonIdMap[kUpper]) return aliasToCanonIdMap[kUpper];
        if (aliasToCanonIdMap[k.toLowerCase()]) return aliasToCanonIdMap[k.toLowerCase()];
      }
      if (rawName) {
        const normName = String(rawName).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normName && aliasToCanonIdMap[normName]) return aliasToCanonIdMap[normName];
      }
      return k ? k.toUpperCase() : "";
    };

    // 2. Ambil data halaqah & buat peta santri -> halaqah (ternormalisasi canonical ID)
    migrateTahfidzHalaqahSheet_(ss);
    const halaqahSheet = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    const studentHalaqahMap = {};
    if (halaqahSheet && halaqahSheet.getLastRow() > 1) {
      const hData = halaqahSheet.getDataRange().getValues();
      const colMap = getHalaqahColumnIndexes(hData[0]);
      for (let i = 1; i < hData.length; i++) {
        const r = hData[i];
        const hId = colMap.id !== -1 ? String(r[colMap.id] || "").trim() : "";
        const hMuh = colMap.muhafiz !== -1 ? String(r[colMap.muhafiz] || "").trim() : "";
        if (!hId && !hMuh) continue;
        const finalHId = hId || ("HLQ-" + (i < 10 ? "0" + i : i));
        const finalHName = (colMap.nama !== -1 && r[colMap.nama]) ? String(r[colMap.nama]).trim() : (hMuh ? ("Halaqah " + hMuh) : ("Halaqah " + finalHId));
        const stIds = colMap.studentIds !== -1 ? String(r[colMap.studentIds] || "").split(",").map(x => x.trim()).filter(Boolean) : [];
        stIds.forEach(stId => {
          const canonId = resolveCanonId(stId);
          if (!canonId) return;
          studentHalaqahMap[canonId] = {
            halaqahId: finalHId,
            namaHalaqah: finalHName,
            muhafiz: hMuh || "Ustadz Pembina"
          };
        });
      }
    }

    // 3. Ambil seluruh log dari Tahfidz_Logs & kelompokkan per santri (unifikasi ke canonical ID)
    const logsSheet = ss.getSheetByName(SHEET_TAHFIDZ_LOGS);
    const studentLogsMap = {};
    if (logsSheet && logsSheet.getLastRow() > 1) {
      const lData = logsSheet.getDataRange().getValues();
      const lHeaders = lData[0].map(h => String(h || "").trim().toLowerCase());
      const sIdIdx = lHeaders.indexOf("student_id");
      const nisIdx = lHeaders.indexOf("nis");
      const nameIdx = lHeaders.indexOf("student_name");
      const tglIdx = lHeaders.indexOf("tanggal");
      const tipeIdx = lHeaders.indexOf("tipe");
      const juzIdx = lHeaders.indexOf("juz");
      const halIdx = lHeaders.indexOf("halaman_list");
      const totHalIdx = lHeaders.indexOf("total_halaman");
      const nilaiIdx = lHeaders.indexOf("nilai");
      const muhIdx = lHeaders.indexOf("muhafiz");
      const stIdx = lHeaders.indexOf("status_setoran");
      const crtIdx = lHeaders.indexOf("created_at");

      for (let i = 1; i < lData.length; i++) {
        const r = lData[i];
        const sid = sIdIdx !== -1 ? String(r[sIdIdx] || "").trim() : "";
        const snis = nisIdx !== -1 ? String(r[nisIdx] || "").trim() : "";
        const sname = nameIdx !== -1 ? String(r[nameIdx] || "").trim() : "";
        const canonKey = resolveCanonId(sid || snis, sname);
        if (!canonKey) continue;

        if (sname && !studentNameMap[canonKey]) {
          studentNameMap[canonKey] = sname;
        }

        if (!studentLogsMap[canonKey]) studentLogsMap[canonKey] = [];
        studentLogsMap[canonKey].push({
          logId: String(r[lHeaders.indexOf("log_id")] || "").trim(),
          tanggal: tglIdx !== -1 ? r[tglIdx] : "",
          createdAt: crtIdx !== -1 ? r[crtIdx] : "",
          tipe: tipeIdx !== -1 ? String(r[tipeIdx] || "ZIYADAH").trim().toUpperCase() : "ZIYADAH",
          juz: juzIdx !== -1 ? Number(r[juzIdx] || 1) : 1,
          halamanList: halIdx !== -1 ? String(r[halIdx] || "1").trim() : "1",
          totalHalaman: totHalIdx !== -1 ? Number(r[totHalIdx] || 1) : 1,
          nilai: nilaiIdx !== -1 ? String(r[nilaiIdx] || "").trim().toUpperCase() : "",
          muhafiz: muhIdx !== -1 ? String(r[muhIdx] || "").trim() : "",
          statusSetoran: stIdx !== -1 ? String(r[stIdx] || "LANJUT").trim().toUpperCase() : "LANJUT"
        });
      }
    }

    // 4. Baca data eksisting di Tahfidz_Capaian untuk merge & normalisasi jika ada data ganda
    const capaianData = capaianSheet.getDataRange().getValues();
    const existingCapaianMap = {};
    const allStudentIds = new Set();

    if (capaianData && capaianData.length > 1) {
      const cHeaders = capaianData[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      const cIdIdx = cHeaders.findIndex(h => h === "studentid" || h === "id");
      const cNameIdx = cHeaders.findIndex(h => h.includes("name") || h.includes("nama"));
      for (let i = 1; i < capaianData.length; i++) {
        const sid = cIdIdx !== -1 ? String(capaianData[i][cIdIdx] || "").trim() : "";
        const sname = cNameIdx !== -1 ? String(capaianData[i][cNameIdx] || "").trim() : "";
        const canonSid = resolveCanonId(sid, sname);
        if (canonSid) {
          if (sname && !studentNameMap[canonSid]) {
            studentNameMap[canonSid] = sname;
          }
          if (!existingCapaianMap[canonSid]) {
            existingCapaianMap[canonSid] = capaianData[i];
          } else {
            // MERGE BARIS GANDA EKSISTING: pertahankan data capaian tertinggi
            const prevTot = Number(existingCapaianMap[canonSid][4]) || 0;
            const currTot = Number(capaianData[i][4]) || 0;
            if (currTot >= prevTot) {
              existingCapaianMap[canonSid] = capaianData[i];
            }
          }
          allStudentIds.add(canonSid);
        }
      }
    }

    // 5. Kumpulkan seluruh ID santri unik (STANDAR UPPERCASE: 1 SANTRI = 1 BARIS)
    Object.keys(studentHalaqahMap).forEach(id => {
      const canon = resolveCanonId(id);
      if (canon) allStudentIds.add(canon);
    });
    Object.keys(studentLogsMap).forEach(id => {
      const canon = resolveCanonId(id);
      if (canon) allStudentIds.add(canon);
    });
    Object.keys(studentNameMap).forEach(id => {
      const canon = resolveCanonId(id);
      if (canon) allStudentIds.add(canon);
    });

    const rowsToSet = [];
    const nowIso = new Date().toISOString();

    allStudentIds.forEach(sId => {
      if (!sId) return;
      const sIdCanon = String(sId).trim().toUpperCase();
      const sName = studentNameMap[sIdCanon] || sIdCanon;
      const hlqInfo = studentHalaqahMap[sIdCanon] || null;

      // Ambil seluruh logs untuk santri ini
      const logs = studentLogsMap[sIdCanon] || [];
      // Urutkan logs dari yang paling baru
      logs.sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));

      let juzAktif = 30;
      let halTerakhir = 1;
      let totalTuntas = 0;
      let statusTerakhir = "LANJUT";
      let muhafizPembina = hlqInfo ? hlqInfo.muhafiz : "";
      let sabqiHal = "";
      let manzilJuz = "";
      let manzilHal = "";
      let manzilPutaran = 1;
      let totalMurojaah = 0;

      // Cari Ziyadah dengan capaian kurikulum tertinggi (yang tuntas)
      let maxRank = -1;
      let bestZiyadah = null;
      logs.forEach(l => {
        if (l.tipe === "ZIYADAH" && l.statusSetoran !== "ULANG") {
          const j = Number(l.juz) || 30;
          const r = getTahfidzCurriculumRank_(j);
          const h = parseTahfidzLatestPage_(l.halamanList);
          if (r > maxRank || (r === maxRank && (!bestZiyadah || h > bestZiyadah.halaman))) {
            maxRank = r;
            bestZiyadah = { juz: j, halaman: h, log: l };
          }
        }
      });

      if (bestZiyadah) {
        juzAktif = bestZiyadah.juz;
        halTerakhir = bestZiyadah.halaman;
        totalTuntas = getTahfidzCurriculumTotalTuntas_(juzAktif, halTerakhir);
        statusTerakhir = "LANJUT";
        if (!muhafizPembina && bestZiyadah.log.muhafiz) muhafizPembina = bestZiyadah.log.muhafiz;
      } else {
        const lastZiyadah = logs.find(l => l.tipe === "ZIYADAH");
        if (lastZiyadah) {
          juzAktif = lastZiyadah.juz || 30;
          halTerakhir = parseTahfidzLatestPage_(lastZiyadah.halamanList);
          totalTuntas = getTahfidzCurriculumTotalTuntas_(juzAktif, halTerakhir);
          statusTerakhir = lastZiyadah.statusSetoran || (lastZiyadah.nilai === "DHAIF" ? "ULANG" : "LANJUT");
          if (!muhafizPembina && lastZiyadah.muhafiz) muhafizPembina = lastZiyadah.muhafiz;
        }
      }

      // Cari Sabqi terakhir
      const lastSabqi = logs.find(l => l.tipe === "MURAJAAH_SABQI");
      if (lastSabqi) {
        sabqiHal = lastSabqi.halamanList;
        if (!muhafizPembina && lastSabqi.muhafiz) muhafizPembina = lastSabqi.muhafiz;
      }

      // Cari Manzil terakhir
      const lastManzil = logs.find(l => l.tipe === "MURAJAAH_MANZIL");
      if (lastManzil) {
        manzilJuz = lastManzil.juz || 1;
        manzilHal = parseTahfidzLatestPage_(lastManzil.halamanList);
        if (!muhafizPembina && lastManzil.muhafiz) muhafizPembina = lastManzil.muhafiz;
      }

      // Akumulasi total halaman murojaah
      logs.forEach(l => {
        if (l.tipe.indexOf("MURAJAAH") !== -1 || l.tipe === "TASMI") {
          totalMurojaah += Number(l.totalHalaman || 1);
        }
      });

      // Merge dengan data eksisting jika belum ada logs
      const existingRow = existingCapaianMap[sIdCanon];
      if (existingRow) {
        if (logs.length === 0) {
          juzAktif = Number(existingRow[2]) || 30;
          halTerakhir = Number(existingRow[3]) || 1;
          totalTuntas = Number(existingRow[4]) || 0;
          statusTerakhir = existingRow[5] || "LANJUT";
          sabqiHal = existingRow[10] || "";
          manzilJuz = existingRow[11] || "";
          manzilHal = existingRow[12] || "";
          manzilPutaran = Number(existingRow[13]) || 1;
          totalMurojaah = Number(existingRow[14]) || 0;
          if (!muhafizPembina) muhafizPembina = existingRow[8] || "";
        } else {
          // Jika ada putaran manzil yang dicatat manual sebelumnya
          if (existingRow[13]) manzilPutaran = Number(existingRow[13]) || 1;
        }
      }

      rowsToSet.push([
        sIdCanon,                                           // 0: student_id (HURUF KAPITAL STANDAR RESMI)
        sName,                                              // 1: student_name
        juzAktif,                                           // 2: juz_aktif
        halTerakhir,                                        // 3: halaman_terakhir
        totalTuntas,                                        // 4: total_halaman_tuntas
        statusTerakhir,                                     // 5: status_terakhir
        hlqInfo ? hlqInfo.halaqahId : "",                   // 6: halaqah_id
        hlqInfo ? hlqInfo.namaHalaqah : "",                 // 7: nama_halaqah
        muhafizPembina,                                     // 8: muhafiz_pembina
        nowIso,                                             // 9: updated_at
        sabqiHal,                                           // 10: sabqi_halaman
        manzilJuz,                                          // 11: manzil_juz
        manzilHal,                                          // 12: manzil_halaman
        manzilPutaran || 1,                                 // 13: manzil_putaran
        totalMurojaah                                       // 14: total_halaman_murojaah
      ]);
    });

    const lastRow = capaianSheet.getLastRow();
    const lastCol = Math.max(headersCapaian.length, capaianSheet.getLastColumn() || headersCapaian.length);

    if (rowsToSet.length > 0) {
      // Urutkan berdasarkan kelompok halaqah lalu nama santri
      rowsToSet.sort((a, b) => (a[6] || "").localeCompare(b[6] || "") || (a[1] || "").localeCompare(b[1] || ""));

      // 1. Bersihkan seluruh baris data eksisting (row 2 ke bawah) agar bersih total dari duplikat
      if (lastRow > 1) {
        capaianSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      }

      // 2. Tulis data baru yang sudah terdeduplikasi murni (1 santri = 1 baris)
      capaianSheet.getRange(2, 1, rowsToSet.length, headersCapaian.length).setValues(rowsToSet);

      // 3. Hapus baris sisa yang kosong di bawahnya
      if (lastRow > rowsToSet.length + 1) {
        try {
          capaianSheet.deleteRows(rowsToSet.length + 2, lastRow - (rowsToSet.length + 1));
        } catch (delErr) {
          console.warn("[CAPAIAN CLEANUP ROWS WARN]", delErr);
        }
      }
      console.log(`[SYNC TAHFIDZ CAPAIAN SUCCESS] Berhasil membersihkan duplikat & menyelaraskan ${rowsToSet.length} data capaian santri (1 baris per santri) ke sheet ${SHEET_TAHFIDZ_CAPAIAN}.`);
    } else if (lastRow > 1) {
      capaianSheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
  } catch (err) {
    console.error("[SYNC TAHFIDZ CAPAIAN ERROR]", err);
  }
}

function getOrCreateTahfidzSheet(ss, sheetName, defaultHeaders, headerBgColor) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
      sheet.getRange(1, 1, 1, defaultHeaders.length)
        .setFontWeight("bold")
        .setBackground(headerBgColor || "#059669")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  } else if (defaultHeaders && defaultHeaders.length > 0) {
    // Pastikan semua kolom default ada di row 1
    const lastCol = sheet.getLastColumn();
    if (lastCol > 0) {
      const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      let currentLastCol = lastCol;
      defaultHeaders.forEach(dh => {
        const cleanDh = String(dh).trim().toLowerCase().replace(/[\s\-_]+/g, "");
        if (existingHeaders.indexOf(cleanDh) === -1) {
          currentLastCol++;
          if (currentLastCol > sheet.getMaxColumns()) {
            sheet.insertColumnAfter(sheet.getMaxColumns());
          }
          sheet.getRange(1, currentLastCol).setValue(dh)
            .setFontWeight("bold")
            .setBackground(headerBgColor || "#059669")
            .setFontColor("#ffffff");
          existingHeaders.push(cleanDh);
        }
      });
    } else {
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders])
        .setFontWeight("bold")
        .setBackground(headerBgColor || "#059669")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * FUNGSI EKSEKUSI MANUAL DARI APPS SCRIPT EDITOR
 * Muncul di dropdown pilihan fungsi dengan nama: runTahfidzSchemaMigration
 * Jalankan fungsi ini langsung dari editor Google Apps Script tanpa memerlukan token web session.
 */
function runTahfidzSchemaMigration() {
  const ss = getDatabaseSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet database tidak ditemukan. Pastikan SPREADSHEET_ID sudah diatur di Script Properties atau script terhubung ke Spreadsheet.");
  }
  console.log("[SCHEMA MIGRATION] Memulai migrasi skema & sinkronisasi Tahfidz...");
  migrateTahfidzHalaqahSheet_(ss);
  ensureTahfidzLogsAndCapaianSchema_(ss);
  syncTahfidzCapaianSheet_(ss);
  try {
    getOrCreateRolesPermissionsSheet();
  } catch (rErr) {
    console.warn("[ROLES PERMS INIT WARN]", rErr);
  }
  console.log("[SCHEMA MIGRATION SUCCESS] Migrasi skema & sinkronisasi Tahfidz selesai.");
  return {
    status: "success",
    message: "Migrasi skema Tahfidz (Halaqah 5 kolom, Kolom status_setoran, satuan, ayat_mulai, ayat_sampai pada Tahfidz_Logs, Sinkronisasi Sheet Tahfidz_Capaian, & Sheet Roles_Permissions) berhasil."
  };
}

/**
 * Alias publik tanpa underscore agar muncul di menu dropdown fungsi Apps Script Editor
 */
function ensureTahfidzLogsAndCapaianSchema() {
  return runTahfidzSchemaMigration();
}

/**
 * FUNGSI PEMBERSIH DATA GANDA SHEET TAHFIDZ_CAPAIAN
 * Muncul di menu dropdown Run/Jalankan di Google Apps Script Editor dengan nama: cleanTahfidzCapaianDuplicates
 * Fungsi ini membersihkan dan menghapus seluruh duplikat santri di sheet Tahfidz_Capaian,
 * menggabungkan riwayat capaian tertinggi, dan menyelaraskan ke tepat 1 baris per santri.
 */
function cleanTahfidzCapaianDuplicates(token) {
  if (token) {
    try {
      const actor = authenticateSession(token);
      authorizeRole(actor, ["ADMIN", "EDITOR"]);
    } catch (authErr) {
      verifySessionToken(token);
    }
  }
  const ss = getDatabaseSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet database tidak ditemukan. Periksa konfigurasi SPREADSHEET_ID.");
  }
  console.log("[CLEAN DUPLICATES] Memulai pembersihan data ganda di sheet Tahfidz_Capaian...");
  syncTahfidzCapaianSheet_(ss);
  console.log("[CLEAN DUPLICATES SUCCESS] Sheet Tahfidz_Capaian berhasil dibersihkan dari duplikat (1 baris per santri).");
  return {
    status: "success",
    success: true,
    message: "Sheet Tahfidz_Capaian berhasil dibersihkan dari seluruh data ganda (1 santri = 1 baris)."
  };
}

/**
 * FUNGSI UTAMA INISIALISASI TAB SHEET TAHFIDZ
 * Dapat dijalankan langsung dari menu Run Apps Script Editor (pilih: initTahfidzSheets)
 * Atau dipanggil via API Frontend / Web App.
 * Membuat 4 tab sheet:
 * 1. Tahfidz_Logs (termasuk kolom status_setoran)
 * 2. Tahfidz_Capaian (snapshot capaian hafalan santri)
 * 3. Tahfidz_Target
 * 4. Tahfidz_Halaqah (5 kolom standar)
 * 5. Tahfidz_Jadwal_Sesi
 */
function initTahfidzSheets(token) {
  try {
    // Autentikasi hanya jika dipanggil melalui API Web (token disertakan).
    // Jika dijalankan manual dari Editor Apps Script, token bernilai undefined sehingga dilewati.
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "SUPER_ADMIN", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    } else {
      console.log("[INIT TAHFIDZ SHEETS] Dijalankan langsung dari editor Apps Script (tanpa web token). Menjalankan inisialisasi...");
    }

    const ss = getDatabaseSpreadsheet();
    if (!ss) {
      throw new Error("Spreadsheet database tidak ditemukan. Pastikan SPREADSHEET_ID sudah diatur di Script Properties atau script terhubung ke Spreadsheet.");
    }

    const created = [];
    const existing = [];

    // Auto-migration & Schema Update
    ensureTahfidzLogsAndCapaianSchema_(ss);

    // 1. Tab: Tahfidz_Logs
    const headersLogs = [
      "log_id", "student_id", "nis", "student_name", "gender",
      "tanggal", "sesi", "tipe", "juz", "surah",
      "halaman_list", "total_halaman", "nilai", "muhafiz", "catatan", "status_setoran",
      "satuan", "ayat_mulai", "ayat_sampai", "created_at"
    ];
    let sheetLogs = ss.getSheetByName(SHEET_TAHFIDZ_LOGS);
    if (!sheetLogs) {
      sheetLogs = ss.insertSheet(SHEET_TAHFIDZ_LOGS);
      sheetLogs.getRange(1, 1, 1, headersLogs.length).setValues([headersLogs]);
      sheetLogs.getRange(1, 1, 1, headersLogs.length)
        .setFontWeight("bold")
        .setBackground("#059669")
        .setFontColor("#ffffff");
      sheetLogs.setFrozenRows(1);
      created.push(SHEET_TAHFIDZ_LOGS);
    } else {
      // Pastikan kolom status_setoran sudah ada di baris 1
      const lastCol = sheetLogs.getLastColumn();
      if (lastCol > 0) {
        const existingHeaders = sheetLogs.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim().toLowerCase());
        if (existingHeaders.indexOf("status_setoran") === -1) {
          const nextCol = lastCol + 1;
          if (nextCol > sheetLogs.getMaxColumns()) {
            sheetLogs.insertColumnAfter(sheetLogs.getMaxColumns());
          }
          sheetLogs.getRange(1, nextCol).setValue("status_setoran").setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
        }
      }
      existing.push(SHEET_TAHFIDZ_LOGS);
    }

    // 1b. Tab: Tahfidz_Capaian (Snapshot posisi hafalan terakhir per santri)
    const headersCapaian = [
      "student_id", "student_name", "juz_aktif", "halaman_terakhir", "total_halaman_tuntas", "status_terakhir", "halaqah_id", "nama_halaqah", "muhafiz_pembina", "updated_at",
      "sabqi_halaman", "manzil_juz", "manzil_halaman", "manzil_putaran", "total_halaman_murojaah"
    ];
    let sheetCapaian = ss.getSheetByName(SHEET_TAHFIDZ_CAPAIAN);
    if (!sheetCapaian) {
      sheetCapaian = ss.insertSheet(SHEET_TAHFIDZ_CAPAIAN);
      sheetCapaian.getRange(1, 1, 1, headersCapaian.length).setValues([headersCapaian]);
      sheetCapaian.getRange(1, 1, 1, headersCapaian.length)
        .setFontWeight("bold")
        .setBackground("#059669")
        .setFontColor("#ffffff");
      sheetCapaian.setFrozenRows(1);
      created.push(SHEET_TAHFIDZ_CAPAIAN);
    } else {
      existing.push(SHEET_TAHFIDZ_CAPAIAN);
    }

    // 2. Tab: Tahfidz_Target
    const headersTarget = [
      "student_id", "student_name", "target_ziyadah_sesi", "target_ziyadah_pekan", "target_murajaah_sesi", "target_murajaah_pekan", "target_juz", "updated_at"
    ];
    let sheetTarget = ss.getSheetByName(SHEET_TAHFIDZ_TARGET);
    if (!sheetTarget) {
      sheetTarget = ss.insertSheet(SHEET_TAHFIDZ_TARGET);
      sheetTarget.getRange(1, 1, 1, headersTarget.length).setValues([headersTarget]);
      sheetTarget.getRange(1, 1, 1, headersTarget.length)
        .setFontWeight("bold")
        .setBackground("#0d9488")
        .setFontColor("#ffffff");
      sheetTarget.setFrozenRows(1);
      created.push(SHEET_TAHFIDZ_TARGET);
    } else {
      existing.push(SHEET_TAHFIDZ_TARGET);
    }

    // 3. Tab: Tahfidz_Halaqah (5 Kolom Standar Mubarokah)
    migrateTahfidzHalaqahSheet_(ss);
    const headersHalaqah = [
      "halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"
    ];
    let sheetHalaqah = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    if (!sheetHalaqah) {
      sheetHalaqah = ss.insertSheet(SHEET_TAHFIDZ_HALAQAH);
      sheetHalaqah.getRange(1, 1, 1, headersHalaqah.length).setValues([headersHalaqah]);
      sheetHalaqah.getRange(1, 1, 1, headersHalaqah.length)
        .setFontWeight("bold")
        .setBackground("#059669")
        .setFontColor("#ffffff");
      sheetHalaqah.setFrozenRows(1);
      created.push(SHEET_TAHFIDZ_HALAQAH);
    } else {
      existing.push(SHEET_TAHFIDZ_HALAQAH);
    }

    // 4. Tab: Tahfidz_Jadwal_Sesi
    const headersSesi = [
      "sesi_id", "nama_sesi", "jenis_sesi", "status", "jam_mulai", "jam_selesai", "hari_list", "created_at"
    ];
    let sheetSesi = ss.getSheetByName(SHEET_TAHFIDZ_SESI);
    if (!sheetSesi) {
      sheetSesi = ss.insertSheet(SHEET_TAHFIDZ_SESI);
      sheetSesi.getRange(1, 1, 1, headersSesi.length).setValues([headersSesi]);
      sheetSesi.getRange(1, 1, 1, headersSesi.length)
        .setFontWeight("bold")
        .setBackground("#4f46e5")
        .setFontColor("#ffffff");
      sheetSesi.setFrozenRows(1);

      // Default Sesi Waktu Awal
      const nowIso = new Date().toISOString();
      const defaultSesi = [
        ["SESI-20260912-1109", "Pagi (Ba'da Subuh)", "Muroja'ah (Pengulangan)", "Aktif Digunakan", "05:00", "06:15", "Sen,Sel,Rab,Kam,Sab", nowIso],
        ["SESI-20260912-1110", "Sore (Ba'da Ashar)", "Muroja'ah (Pengulangan)", "Aktif Digunakan", "15:30", "16:30", "Sen,Sel,Rab,Kam,Sab", nowIso],
        ["SESI-20260912-1112", "Malam (Ba'da magrib)", "Ziyadah (Setoran Hafalan Baru)", "Aktif Digunakan", "18:00", "19:30", "Sen,Sel,Rab,Jum,Sab,Min", nowIso]
      ];
      sheetSesi.getRange(2, 1, defaultSesi.length, headersSesi.length).setValues(defaultSesi);
      created.push(SHEET_TAHFIDZ_SESI);
    } else {
      existing.push(SHEET_TAHFIDZ_SESI);
    }

    // 4b. Tab: Tahfidz_Presensi (Presensi Kehadiran Halaqah)
    let sheetPresensi = ss.getSheetByName(SHEET_TAHFIDZ_PRESENSI);
    if (!sheetPresensi) {
      sheetPresensi = ss.insertSheet(SHEET_TAHFIDZ_PRESENSI);
      sheetPresensi.getRange(1, 1, 1, HEADERS_TAHFIDZ_PRESENSI.length).setValues([HEADERS_TAHFIDZ_PRESENSI]);
      sheetPresensi.getRange(1, 1, 1, HEADERS_TAHFIDZ_PRESENSI.length)
        .setFontWeight("bold")
        .setBackground("#059669")
        .setFontColor("#ffffff");
      sheetPresensi.setFrozenRows(1);
      created.push(SHEET_TAHFIDZ_PRESENSI);
    } else {
      existing.push(SHEET_TAHFIDZ_PRESENSI);
    }

    // 4c. Tab: Izin_Asatidz (Perizinan Asatidz & Kelangsungan Halaqah)
    let sheetIzinAsatidz = ss.getSheetByName(SHEET_IZIN_ASATIDZ);
    if (!sheetIzinAsatidz) {
      sheetIzinAsatidz = ss.insertSheet(SHEET_IZIN_ASATIDZ);
      sheetIzinAsatidz.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length).setValues([HEADERS_IZIN_ASATIDZ]);
      sheetIzinAsatidz.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length)
        .setFontWeight("bold")
        .setBackground("#047857")
        .setFontColor("#ffffff");
      sheetIzinAsatidz.setFrozenRows(1);
      created.push(SHEET_IZIN_ASATIDZ);
    } else {
      existing.push(SHEET_IZIN_ASATIDZ);
    }

    // 5. Tab: Roles_Permissions (RBAC Matrix)
    try {
      const rSheet = getOrCreateRolesPermissionsSheet();
      if (rSheet) created.push(SHEET_ROLES_PERMISSIONS);
    } catch (eRole) {
      console.warn("[INIT ROLES_PERMISSIONS WARN]", eRole);
    }

    const msg = created.length > 0
      ? "Tab sheet berhasil dibuat di Spreadsheet: " + created.join(", ") + (existing.length > 0 ? " (Sudah ada: " + existing.join(", ") + ")" : "")
      : "Semua tab sheet tahfidz (" + existing.join(", ") + ") sudah ada di Spreadsheet dan siap digunakan.";

    console.log("[INIT TAHFIDZ SHEETS]", msg);
    return {
      status: "success",
      success: true,
      message: msg,
      createdSheets: created,
      existingSheets: existing
    };
  } catch (err) {
    console.error("[INIT TAHFIDZ SHEETS ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal membuat tab sheet tahfidz: " + err.message
    };
  }
}

/**
 * 1. Ambil Data Dashboard Tahfidz (Admin, Pengasuh, Wali Santri)
 * Mengembalikan:
 * - 4 Ringkasan Makro (Khatam 30 Juz, Rata-rata Hafalan, Total Akumulasi Juz, Aktivitas Pekan Ini)
 * - Daftar Santri Lengkap dengan Target Capaian, Setoran Terakhir, Nilai & Progres 0-30 Juz
 * - Filter Master (Kategori, Halaqah, Muhafiz)
 */
function getTahfidzDashboard(token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
      } catch (authErr) {
        try {
          const leg = verifySessionToken(token);
          if (leg && leg.role) {
            actor = { role: leg.role, identityId: leg.userId };
          }
        } catch (legErr) {
          console.warn("[GET TAHFIDZ DASHBOARD AUTH FALLBACK]", legErr);
          actor = null;
        }
      }
    }

    const ss = getDatabaseSpreadsheet();

    // 1. Inisialisasi Sheet jika belum ada
    const logsSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_LOGS, [
      "log_id", "student_id", "nis", "student_name", "gender",
      "tanggal", "sesi", "tipe", "juz", "surah",
      "halaman_list", "total_halaman", "nilai", "muhafiz", "catatan", "status_setoran",
      "satuan", "ayat_mulai", "ayat_sampai", "created_at"
    ]);

    const targetSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_TARGET, [
      "student_id", "target_ziyadah_sesi", "target_ziyadah_pekan", "target_murajaah_sesi", "target_murajaah_pekan", "updated_at"
    ]);

    migrateTahfidzHalaqahSheet_(ss);
    const halaqahSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_HALAQAH, [
      "halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"
    ], "#059669");

    // 2. Ambil data master Santri (dengan proteksi tangguh & fallback langsung)
    let allStudents = [];
    try {
      const studentsRes = getAllStudentsData(token);
      allStudents = (studentsRes && studentsRes.data) || [];
    } catch (eSt) {
      console.warn("[GET ALL STUDENTS ERROR IN TAHFIDZ]", eSt);
    }
    if (!allStudents || allStudents.length === 0) {
      try {
        const sSheet = getAuthSheet(ss, SHEET_STUDENTS);
        if (sSheet) {
          const sData = sSheet.getDataRange().getValues();
          if (sData && sData.length > 1) {
            const sh = sData[0].map(x => String(x || "").trim().toLowerCase());
            for (let i = 1; i < sData.length; i++) {
              const r = sData[i];
              const sId = String(r[sh.indexOf("student_id")] || "").trim();
              if (sId) {
                allStudents.push({
                  studentId: sId,
                  nis: String(r[sh.indexOf("nis")] || "").trim(),
                  name: String(r[sh.indexOf("nama_lengkap")] || r[sh.indexOf("name")] || "").trim(),
                  gender: String(r[sh.indexOf("gender")] || "L").toUpperCase(),
                  status: String(r[sh.indexOf("status")] || "Aktif").trim(),
                  program: String(r[sh.indexOf("program")] || "Tahfidz").trim()
                });
              }
            }
          }
        }
      } catch (eFallback) {
        console.warn("[STUDENTS FALLBACK READ ERROR]", eFallback);
      }
    }

    // Filter khusus Wali Santri
    let filteredStudents = allStudents;
    if (actor && actor.role === "WALI_SANTRI") {
      const linked = getLinkedStudentsForWali(actor.identityId) || [];
      const allowedIds = linked.map(s => String(s.studentId || s.student_id || s.id || s.nis || "").trim().toLowerCase());
      filteredStudents = allStudents.filter(st => {
        const sId = String(st.studentId || st.student_id || "").trim().toLowerCase();
        const sNis = String(st.nis || "").trim().toLowerCase();
        return allowedIds.includes(sId) || allowedIds.includes(sNis);
      });
    }

    // 3. Baca Data Logs
    const logsData = logsSheet.getDataRange().getValues();
    const logRows = [];
    if (logsData && logsData.length > 1) {
      const hLogs = logsData[0].map(h => String(h || "").trim().toLowerCase());
      for (let i = 1; i < logsData.length; i++) {
        const r = logsData[i];
        const logId = String(r[hLogs.indexOf("log_id")] || "").trim();
        if (!logId) continue;
        logRows.push({
          logId: logId,
          studentId: String(r[hLogs.indexOf("student_id")] || "").trim(),
          nis: String(r[hLogs.indexOf("nis")] || "").trim(),
          studentName: String(r[hLogs.indexOf("student_name")] || "").trim(),
          gender: String(r[hLogs.indexOf("gender")] || "L").toUpperCase(),
          tanggal: normalizeDateString(r[hLogs.indexOf("tanggal")]),
          sesi: String(r[hLogs.indexOf("sesi")] || "Pagi (Ba'da Subuh)").trim(),
          tipe: String(r[hLogs.indexOf("tipe")] || "ZIYADAH").trim().toUpperCase(),
          juz: Number(r[hLogs.indexOf("juz")] || 1),
          surah: String(r[hLogs.indexOf("surah")] || "").trim(),
          satuan: hLogs.indexOf("satuan") !== -1 ? String(r[hLogs.indexOf("satuan")] || "HALAMAN").trim().toUpperCase() : "HALAMAN",
          ayatMulai: hLogs.indexOf("ayat_mulai") !== -1 && r[hLogs.indexOf("ayat_mulai")] !== "" ? Number(r[hLogs.indexOf("ayat_mulai")]) : null,
          ayatSampai: hLogs.indexOf("ayat_sampai") !== -1 && r[hLogs.indexOf("ayat_sampai")] !== "" ? Number(r[hLogs.indexOf("ayat_sampai")]) : null,
          halamanList: String(r[hLogs.indexOf("halaman_list")] || "1").trim(),
          totalHalaman: Number(r[hLogs.indexOf("total_halaman")] || 1),
          nilai: String(r[hLogs.indexOf("nilai")] || "MUMTAZ").trim().toUpperCase(),
          muhafiz: String(r[hLogs.indexOf("muhafiz")] || "").trim(),
          catatan: String(r[hLogs.indexOf("catatan")] || "").trim(),
          statusSetoran: hLogs.indexOf("status_setoran") !== -1 ? String(r[hLogs.indexOf("status_setoran")] || "LANJUT").trim().toUpperCase() : "LANJUT",
          createdAt: String(r[hLogs.indexOf("created_at")] || "")
        });
      }
    }

    // 4. Baca Data Target Santri
    const targetData = targetSheet.getDataRange().getValues();
    const targetMap = {};
    if (targetData && targetData.length > 1) {
      const hTarget = targetData[0].map(h => String(h || "").trim().toLowerCase());
      for (let i = 1; i < targetData.length; i++) {
        const sId = String(targetData[i][hTarget.indexOf("student_id")] || "").trim();
        if (!sId) continue;
        targetMap[sId] = {
          targetZiyadahSesi: Number(targetData[i][hTarget.indexOf("target_ziyadah_sesi")] || 1),
          targetZiyadahPekan: Number(targetData[i][hTarget.indexOf("target_ziyadah_pekan")] || 10),
          targetMurajaahSesi: Number(targetData[i][hTarget.indexOf("target_murajaah_sesi")] || 2),
          targetMurajaahPekan: Number(targetData[i][hTarget.indexOf("target_murajaah_pekan")] || 10)
        };
      }
    }

    // 5. Baca Data Halaqah (5 Kolom Standar Mubarokah)
    const halaqahData = halaqahSheet.getDataRange().getValues();
    const halaqahList = [];
    const studentHalaqahMap = {};
    if (halaqahData && halaqahData.length > 1) {
      const colMap = getHalaqahColumnIndexes(halaqahData[0]);
      for (let i = 1; i < halaqahData.length; i++) {
        const r = halaqahData[i];
        const rawId = colMap.id !== -1 ? String(r[colMap.id] || "").trim() : "";
        const hmuh = colMap.muhafiz !== -1 ? String(r[colMap.muhafiz] || "").trim() : "";
        if (!rawId && !hmuh) continue;

        const hid = rawId || ("HLQ-" + (i < 10 ? "0" + i : i));
        const hname = (colMap.nama !== -1 && r[colMap.nama]) ? String(r[colMap.nama]).trim() : (hmuh ? ("Halaqah " + hmuh) : `Halaqah ${i}`);
        const hkur = colMap.target !== -1 ? String(r[colMap.target] || "").trim() : "Tahfidz 30 Juz";
        const stIds = colMap.studentIds !== -1 ? String(r[colMap.studentIds] || "").split(",").map(x => x.trim()).filter(Boolean) : [];

        halaqahList.push({
          halaqahId: hid,
          namaHalaqah: hname,
          muhafiz: hmuh || "Ustadz Pembina",
          targetKurikulum: hkur,
          studentIds: stIds,
          studentCount: stIds.length
        });

        stIds.forEach(id => {
          const idClean = String(id).trim();
          const idLower = idClean.toLowerCase();
          const halaqahObj = {
            halaqahId: hid,
            namaHalaqah: hname,
            muhafiz: hmuh || "Ustadz Pembina"
          };
          studentHalaqahMap[idClean] = halaqahObj;
          studentHalaqahMap[idLower] = halaqahObj;
        });
      }
    }

    // Auto-populate default halaqahs jika sheet Tahfidz_Halaqah belum memiliki kelompok
    if (halaqahList.length === 0) {
      const defaultTeachers = [
        "Ustadz Faiz", "Ustadz Halim", "Ustadz Iqbal", "Ustadz Pendi",
        "Ustadzah Alfi", "Ustadzah Angelia", "Ustadzah Aya", "Ustadzah Fadhilah",
        "Ustadzah Fatim", "Ustadzah Iis", "Ustadzah Luthfi", "Ustadzah Mufti",
        "Ustadzah Muhim", "Ustadzah Shabrina", "Ustadzah Shofi", "Ustadzah Yusita"
      ];
      defaultTeachers.forEach((muh, idx) => {
        const hid = "HLQ-" + (idx < 9 ? "0" + (idx + 1) : (idx + 1));
        const hname = "Halaqah " + muh;
        halaqahList.push({
          halaqahId: hid,
          namaHalaqah: hname,
          muhafiz: muh,
          targetKurikulum: "Tahfidz 30 Juz",
          studentIds: [],
          studentCount: 0
        });
      });
    }

    // Periksa delegasi badal aktif (Izin Asatidz APPROVED untuk hari ini)
    let activeDelegations = [];
    try {
      activeDelegations = getActiveBadalDelegations();
      if (activeDelegations && activeDelegations.length > 0) {
        const delMap = {};
        activeDelegations.forEach(d => {
          const key = String(d.namaAsatidz || "").trim().toLowerCase();
          if (key) delMap[key] = d;
        });

        halaqahList.forEach(item => {
          const mKey = String(item.muhafiz || "").trim().toLowerCase();
          if (delMap[mKey]) {
            const d = delMap[mKey];
            item.delegation = {
              isDelegated: true,
              badalId: d.badalId,
              namaBadal: d.namaBadal,
              sesi: d.sesi,
              catatanBadal: d.catatanBadal,
              idIzin: d.idIzin
            };
          }
        });
      }
    } catch (eDel) {
      console.warn("[DASHBOARD HALAQAH DELEGATION CHECK WARN]", eDel);
    }

    // 6. Kelompokkan Logs per Santri & Agregasi Halaman Pekanan
    const logsByStudent = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let weeklyZiyadahCount = 0;
    let weeklyMurajaahCount = 0;
    let weeklyZiyadahPages = 0;
    let weeklyMurajaahPages = 0;

    const weeklyZiyadahPagesMap = {};
    const weeklyMurajaahPagesMap = {};
    const weeklySabqiPagesMap = {};
    const weeklyManzilPagesMap = {};

    logRows.forEach(l => {
      const sKey = l.studentId || l.nis;
      if (!logsByStudent[sKey]) logsByStudent[sKey] = [];
      logsByStudent[sKey].push(l);

      // Hitung aktivitas pekan ini
      const logDate = new Date(l.tanggal || l.createdAt);
      if (logDate >= oneWeekAgo) {
        const totalHal = Number(l.totalHalaman) || 1;
        if (l.tipe === "ZIYADAH") {
          weeklyZiyadahCount++;
          weeklyZiyadahPages += totalHal;
          [l.studentId, l.nis].filter(Boolean).forEach(k => {
            weeklyZiyadahPagesMap[k] = (weeklyZiyadahPagesMap[k] || 0) + totalHal;
          });
        } else if (l.tipe.indexOf("MURAJAAH") !== -1 || l.tipe === "TASMI") {
          weeklyMurajaahCount++;
          weeklyMurajaahPages += totalHal;
          [l.studentId, l.nis].filter(Boolean).forEach(k => {
            weeklyMurajaahPagesMap[k] = (weeklyMurajaahPagesMap[k] || 0) + totalHal;
            if (l.tipe === "MURAJAAH_SABQI") {
              weeklySabqiPagesMap[k] = (weeklySabqiPagesMap[k] || 0) + totalHal;
            } else if (l.tipe === "MURAJAAH_MANZIL") {
              weeklyManzilPagesMap[k] = (weeklyManzilPagesMap[k] || 0) + totalHal;
            }
          });
        }
      }
    });

    // 6b. Ambil snapshot presensi hari ini dari sheet Tahfidz_Presensi
    const todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const presenceMap = {};
    try {
      const presSheet = ss.getSheetByName(SHEET_TAHFIDZ_PRESENSI);
      if (presSheet && presSheet.getLastRow() > 1) {
        const presData = presSheet.getDataRange().getValues();
        const pHeaders = presData[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
        const pTglIdx = pHeaders.indexOf("tanggal");
        const pIdIdx = pHeaders.indexOf("student_id");
        const pNisIdx = pHeaders.indexOf("nis");
        const pStatusIdx = pHeaders.indexOf("status");
        const pKetIdx = pHeaders.indexOf("keterangan");

        for (let i = 1; i < presData.length; i++) {
          const row = presData[i];
          const tgl = pTglIdx !== -1 ? String(row[pTglIdx] || "").trim() : "";
          if (tgl === todayStr) {
            const sid = pIdIdx !== -1 ? String(row[pIdIdx] || "").trim() : "";
            const snis = pNisIdx !== -1 ? String(row[pNisIdx] || "").trim() : "";
            const st = pStatusIdx !== -1 ? String(row[pStatusIdx] || "HADIR").toUpperCase().trim() : "HADIR";
            const ket = pKetIdx !== -1 ? String(row[pKetIdx] || "").trim() : "";
            if (sid) presenceMap[sid] = { status: st, keterangan: ket };
            if (snis) presenceMap[snis] = { status: st, keterangan: ket };
          }
        }
      }
    } catch (ePres) {
      console.warn("[GET TAHFIDZ DASHBOARD PRESENSI WARN]", ePres);
    }

    // 7. Kalkulasi Data Santri Terintegrasi
    let totalJuzAllStudents = 0;
    let khatam30Count = 0;
    let santriTuntasMurojaahCount = 0;

    const enrichedStudents = filteredStudents.map(st => {
      const sId = String(st.studentId || st.student_id || "").trim();
      const sNis = String(st.nis || "").trim();
      const sLogs = logsByStudent[sId] || logsByStudent[sNis] || [];

      // Urutkan logs santri dari yang terbaru
      sLogs.sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));
      const latestLog = sLogs.length > 0 ? sLogs[0] : null;

      // Hitung capaian berbasis urutan kurikulum (Juz 30 s/d 21, lalu 1 s/d 20)
      let maxRank = -1;
      let currentJuz = 30;
      let currentHal = 1;
      let hasZiyadah = false;

      sLogs.forEach(lg => {
        if (lg.tipe === "ZIYADAH" && lg.statusSetoran !== "ULANG") {
          hasZiyadah = true;
          const j = Number(lg.juz) || 30;
          const r = getTahfidzCurriculumRank_(j);
          const h = parseTahfidzLatestPage_(lg.halamanList);
          if (r > maxRank || (r === maxRank && h > currentHal)) {
            maxRank = r;
            currentJuz = j;
            currentHal = h;
          }
        }
      });

      if (!hasZiyadah) {
        if (latestLog && latestLog.juz) {
          currentJuz = Number(latestLog.juz) || 30;
          currentHal = parseTahfidzLatestPage_(latestLog.halamanList);
          maxRank = getTahfidzCurriculumRank_(currentJuz);
        } else {
          currentJuz = 30;
          currentHal = 1;
          maxRank = 0;
        }
      }

      const totalTuntasPages = Math.min(600, maxRank * 20 + currentHal);
      const juzCompleted = maxRank + (currentHal >= 20 ? 1 : (currentHal / 20));
      const percent = Math.min(100, Math.max(1, Math.round((totalTuntasPages / 600) * 100)));
      const isKhatam30 = totalTuntasPages >= 600 || (maxRank === 29 && currentHal >= 20);

      if (isKhatam30) khatam30Count++;
      totalJuzAllStudents += juzCompleted;

      // Hitung setoran pekan ini
      let setoranPekanIni = 0;
      sLogs.forEach(lg => {
        const d = new Date(lg.tanggal || lg.createdAt);
        if (d >= oneWeekAgo) setoranPekanIni++;
      });

      // Status On-Track
      const onTrack = setoranPekanIni >= 2 ? `On-Track (${setoranPekanIni}x Pekan Ini)` : (setoranPekanIni === 1 ? `1x Setor Pekan Ini` : `Belum Setor`);

      // Target
      const target = targetMap[sId] || targetMap[sNis] || {
        targetZiyadahSesi: 1,
        targetZiyadahPekan: 10,
        targetMurajaahSesi: 2,
        targetMurajaahPekan: 10
      };

      // Halaqah
      let halaqah = studentHalaqahMap[sId] || studentHalaqahMap[sNis];
      let isInHalaqah = !!halaqah;

      if (!halaqah && st.halaqah && typeof st.halaqah === 'string' && st.halaqah.trim() !== '' && st.halaqah.trim().toLowerCase() !== 'belum masuk halaqah') {
        const hClean = st.halaqah.trim();
        const matched = halaqahList.find(h => 
          (h.namaHalaqah && h.namaHalaqah.toLowerCase() === hClean.toLowerCase()) ||
          (h.halaqahId && h.halaqahId.toLowerCase() === hClean.toLowerCase())
        );
        if (matched) {
          halaqah = {
            halaqahId: matched.halaqahId,
            namaHalaqah: matched.namaHalaqah,
            muhafiz: matched.muhafiz || st.muhafiz || "Pembina Tahfidz",
            kategori: matched.targetKurikulum || st.program || "Tahfidz"
          };
          isInHalaqah = true;
        } else {
          halaqah = {
            halaqahId: "",
            namaHalaqah: hClean,
            muhafiz: st.muhafiz || "Pembina Tahfidz",
            kategori: st.program || "Tahfidz"
          };
          isInHalaqah = true;
        }
      }

      if (!halaqah) {
        halaqah = {
          halaqahId: "",
          namaHalaqah: st.program || "Tahfidz Dewasa",
          kategori: st.program || "Tahfidz Dewasa",
          muhafiz: st.muhafiz || "Pembina Tahfidz"
        };
      }

      return {
        studentId: sId,
        nis: sNis,
        name: st.name || st.nama || "Santri",
        gender: st.gender || "L",
        photoUrl: st.photoUrl || st.photo_url || "",
        program: st.program || "Tahfidz",
        status: st.status || "ACTIVE",
        halaqah: halaqah,
        isInHalaqah: isInHalaqah,
        target: {
          ziyadahSesi: target.targetZiyadahSesi,
          ziyadahPekan: target.targetZiyadahPekan,
          ziyadahBulan: target.targetZiyadahPekan * 4,
          murajaahSesi: target.targetMurajaahSesi,
          murajaahPekan: target.targetMurajaahPekan,
          murajaahBulan: target.targetMurajaahPekan * 4
        },
        rekapPekan: (function() {
          const tZ = Number(target.targetZiyadahPekan) || 10;
          const tM = Number(target.targetMurajaahPekan) || 10;
          const rZ = weeklyZiyadahPagesMap[sId] || weeklyZiyadahPagesMap[sNis] || 0;
          const rM = weeklyMurajaahPagesMap[sId] || weeklyMurajaahPagesMap[sNis] || 0;
          const rSabqi = weeklySabqiPagesMap[sId] || weeklySabqiPagesMap[sNis] || 0;
          const rManzil = weeklyManzilPagesMap[sId] || weeklyManzilPagesMap[sNis] || 0;
          const isTuntasM = rM >= tM;
          if (isTuntasM) santriTuntasMurojaahCount++;
          return {
            ziyadah: {
              target: tZ,
              realita: rZ,
              isTuntas: rZ >= tZ
            },
            murojaah: {
              target: tM,
              realita: rM,
              sabqi: rSabqi,
              manzil: rManzil,
              persen: tM > 0 ? Math.round((rM / tM) * 100) : 0,
              isTuntas: isTuntasM,
              sisaHalaman: Math.max(0, tM - rM),
              statusText: isTuntasM ? "Tuntas Target Muroja'ah" : (rM > 0 ? ("Kurang " + (tM - rM) + " Hlm") : "Belum Muroja'ah")
            }
          };
        })(),
        setoranTerakhir: latestLog ? {
          juz: latestLog.juz,
          surah: latestLog.surah || `Juz ${latestLog.juz}`,
          halaman: latestLog.halamanList ? `Halaman ${latestLog.halamanList}` : "Halaman 1",
          totalHalaman: latestLog.totalHalaman || 1,
          tanggal: latestLog.tanggal,
          sesi: latestLog.sesi,
          tipe: latestLog.tipe,
          nilai: latestLog.nilai,
          muhafiz: latestLog.muhafiz || halaqah.muhafiz || "Ustadz Pembina"
        } : null,
        progress: {
          currentJuz: currentJuz,
          currentHalaman: currentHal,
          curriculumRank: maxRank + 1,
          totalHalamanTuntas: totalTuntasPages,
          totalJuz: 30,
          percent: percent,
          isKhatam: isKhatam30,
          onTrackStatus: onTrack
        },
        totalSetoran: sLogs.length,
        presensiStatus: (presenceMap[sId] || presenceMap[sNis]) ? (presenceMap[sId] || presenceMap[sNis]).status : "HADIR",
        presensiKeterangan: (presenceMap[sId] || presenceMap[sNis]) ? (presenceMap[sId] || presenceMap[sNis]).keterangan : ""
      };
    });

    // 8. Hitung Summary Makro
    const halaqahMembers = enrichedStudents.filter(st => st.isInHalaqah);
    const activeStudentCount = halaqahMembers.length > 0 ? halaqahMembers.length : (enrichedStudents.length || 1);
    let totalJuzHalaqahStudents = 0;
    let khatam30HalaqahCount = 0;
    halaqahMembers.forEach(st => {
      const p = st.progress;
      const jzComp = p ? ((p.curriculumRank - 1) + (p.currentHalaman >= 20 ? 1 : (p.currentHalaman / 20))) : 0;
      totalJuzHalaqahStudents += jzComp;
      if (p && p.isKhatam) khatam30HalaqahCount++;
    });

    const baseTotalJuz = totalJuzHalaqahStudents > 0 ? totalJuzHalaqahStudents : totalJuzAllStudents;
    const avgJuz = (baseTotalJuz / activeStudentCount).toFixed(1);
    const totalWeeklyActivity = weeklyZiyadahCount + weeklyMurajaahCount;
    const ziyadahPercent = totalWeeklyActivity > 0 ? Math.round((weeklyZiyadahCount / totalWeeklyActivity) * 100) : 100;
    const murajaahPercent = 100 - ziyadahPercent;

    return {
      status: "success",
      success: true,
      summary: {
        khatam30Juz: khatam30HalaqahCount > 0 ? khatam30HalaqahCount : khatam30Count,
        rataRataHafalan: `${avgJuz} Juz / Santri`,
        totalHafalanJuz: Number(baseTotalJuz.toFixed(1)),
        totalSantriHalaqah: halaqahMembers.length,
        aktivitasPekanIni: {
          ziyadahPercent: ziyadahPercent,
          murajaahPercent: murajaahPercent,
          totalSetoranPekanIni: totalWeeklyActivity,
          weeklyZiyadahPages: weeklyZiyadahPages,
          weeklyMurajaahPages: weeklyMurajaahPages,
          santriTuntasMurojaahCount: santriTuntasMurojaahCount,
          totalSantriAktif: halaqahMembers.length || enrichedStudents.length,
          persenTuntasMurojaah: (halaqahMembers.length || enrichedStudents.length) > 0 
            ? Math.round((santriTuntasMurojaahCount / (halaqahMembers.length || enrichedStudents.length)) * 100) 
            : 0
        }
      },
      students: enrichedStudents,
      totalStudents: enrichedStudents.length,
      categories: (function() {
        const programSet = new Set();
        allStudents.forEach(st => {
          const p = String(st.program || "").trim();
          if (p) programSet.add(p);
        });
        const uniquePrograms = Array.from(programSet).sort();
        return ["Semua Kategori", ...(uniquePrograms.length > 0 ? uniquePrograms : ["Tahfidz Intensif", "Tahfidz Dewasa", "Tahfidz Anak", "Kitab Kuning", "Reguler"])];
      })(),
      rawCategories: (function() {
        const programSet = new Set();
        allStudents.forEach(st => {
          const p = String(st.program || "").trim();
          if (p) programSet.add(p);
        });
        return Array.from(programSet).sort();
      })(),
      halaqahs: halaqahList,
      activeDelegations: activeDelegations,
      muhafizMatrix: (function() {
        return halaqahList.map((hlq, idx) => {
          const memberStudents = enrichedStudents.filter(st => {
            return (st.halaqah && st.halaqah.halaqahId === hlq.halaqahId) ||
                   (Array.isArray(hlq.studentIds) && (hlq.studentIds.includes(st.studentId) || hlq.studentIds.includes(st.nis)));
          });
          let totalJuz = 0;
          memberStudents.forEach(st => {
            totalJuz += (st.progress && st.progress.currentJuz) || 0;
          });
          const avgJuz = memberStudents.length > 0 ? (totalJuz / memberStudents.length).toFixed(1) : "0.0";

          return {
            index: idx + 1,
            huruf: String.fromCharCode(65 + (idx % 26)),
            muhafiz: hlq.muhafiz || "Belum Ditunjuk",
            halaqahId: hlq.halaqahId,
            namaHalaqah: hlq.namaHalaqah,
            kategori: hlq.kategori || "Tahfidz",
            binaanCount: memberStudents.length,
            rataRataCapaian: `Juz ${avgJuz} / 30`,
            avgJuzNum: Number(avgJuz)
          };
        });
      })(),
      sesiList: (function() {
        try {
          return getTahfidzSesiList(token).data || [];
        } catch(e) {
          return [];
        }
      })(),
      muhafizList: (function() {
        const muhafizSet = new Set();
        try {
          const empRes = getAllEmployeesData(token);
          const employees = (empRes && empRes.data) || [];
          employees.forEach(emp => {
            if (emp.status === "ACTIVE") {
              const j = (emp.jabatan || "").toLowerCase();
              const s = (emp.spesialisasi || "").toLowerCase();
              if (j.includes("muhafiz") || j.includes("ustadz") || j.includes("guru") || s.includes("tahfidz") || employees.length <= 20) {
                if (emp.nama) muhafizSet.add(emp.nama);
              }
            }
          });
        } catch (e) {
          console.warn("[MUHAFIZ LIST EMP ERROR]", e);
        }
        halaqahList.forEach(hlq => {
          if (hlq.muhafiz) muhafizSet.add(hlq.muhafiz);
        });
        return ["Semua Muhafiz", ...Array.from(muhafizSet).sort()];
      })()
    };

  } catch (err) {
    console.error("[GET TAHFIDZ DASHBOARD ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memuat dashboard tahfidz: " + err.message
    };
  }
}

/**
 * 2. Simpan Catatan Setoran Baru (Mutaba'ah Ziyadah, Muraja'ah, Tasmi')
 */
function saveTahfidzLog(payload, token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const ss = getDatabaseSpreadsheet();
    ensureTahfidzLogsAndCapaianSchema_(ss);
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_LOGS, [
      "log_id", "student_id", "nis", "student_name", "gender",
      "tanggal", "sesi", "tipe", "juz", "surah",
      "halaman_list", "total_halaman", "nilai", "muhafiz", "catatan", "status_setoran",
      "satuan", "ayat_mulai", "ayat_sampai", "created_at"
    ]);

    const studentId = String(payload.studentId || payload.student_id || "").trim();
    const nis = String(payload.nis || "").trim();
    const studentName = String(payload.studentName || payload.student_name || payload.name || "").trim();

    if (!studentId && !studentName) {
      throw new Error("Santri wajib dipilih.");
    }

    const logId = payload.logId || payload.log_id || ("TFZ-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + Math.floor(1000 + Math.random() * 9000));
    const tanggal = payload.tanggal ? normalizeDateString(payload.tanggal) : Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const sesi = String(payload.sesi || "Pagi (Ba'da Subuh)").trim();
    const tipe = String(payload.tipe || "ZIYADAH").trim().toUpperCase();
    const juz = Number(payload.juz || 1);
    const surah = String(payload.surah || `Juz ${juz}`).trim();
    const satuan = String(payload.satuan || (payload.ayatMulai || payload.ayat_mulai ? "AYAT" : "HALAMAN")).trim().toUpperCase();
    let ayatMulai = null;
    if (payload.ayatMulai !== undefined && payload.ayatMulai !== null && payload.ayatMulai !== "") {
      ayatMulai = Number(payload.ayatMulai);
    } else if (payload.ayat_mulai !== undefined && payload.ayat_mulai !== null && payload.ayat_mulai !== "") {
      ayatMulai = Number(payload.ayat_mulai);
    }

    let ayatSampai = null;
    if (payload.ayatSampai !== undefined && payload.ayatSampai !== null && payload.ayatSampai !== "") {
      ayatSampai = Number(payload.ayatSampai);
    } else if (payload.ayat_sampai !== undefined && payload.ayat_sampai !== null && payload.ayat_sampai !== "") {
      ayatSampai = Number(payload.ayat_sampai);
    }
    const halamanList = String(payload.halamanList || payload.halaman_list || payload.halaman || "1").trim();
    const totalHalaman = Number(payload.totalHalaman || payload.total_halaman || 1);
    const nilai = String(payload.nilai || "MUMTAZ").trim().toUpperCase();
    const muhafiz = String(payload.muhafiz || "").trim();
    const catatan = String(payload.catatan || "").trim();
    const gender = String(payload.gender || "L").toUpperCase();
    const createdAt = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    let idIdx = headers.indexOf("log_id");
    let foundRow = -1;

    if (idIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx] || "").trim() === logId) {
          foundRow = i + 1;
          break;
        }
      }
    }

    const statusSetoran = String(payload.statusSetoran || payload.status_setoran || (nilai === "DHAIF" ? "ULANG" : "LANJUT")).trim().toUpperCase();

    // Pastikan kolom baru (status_setoran, satuan, ayat_mulai, ayat_sampai) ada pada header
    const extraCols = ["status_setoran", "satuan", "ayat_mulai", "ayat_sampai"];
    extraCols.forEach(colName => {
      let colIdx = headers.indexOf(colName);
      if (colIdx === -1) {
        const nextCol = (sheet.getLastColumn() || 0) + 1;
        if (nextCol > sheet.getMaxColumns()) {
          sheet.insertColumnAfter(sheet.getMaxColumns());
        }
        sheet.getRange(1, nextCol).setValue(colName).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
        headers.push(colName);
      }
    });

    const rowMap = {
      "log_id": logId,
      "student_id": studentId,
      "nis": nis,
      "student_name": studentName,
      "gender": gender,
      "tanggal": tanggal,
      "sesi": sesi,
      "tipe": tipe,
      "juz": juz,
      "surah": surah,
      "satuan": satuan,
      "ayat_mulai": ayatMulai,
      "ayat_sampai": ayatSampai,
      "halaman_list": halamanList,
      "total_halaman": totalHalaman,
      "nilai": nilai,
      "muhafiz": muhafiz,
      "catatan": catatan,
      "status_setoran": statusSetoran,
      "created_at": createdAt
    };

    const rowValues = headers.map(h => (rowMap[h] !== undefined && rowMap[h] !== null) ? rowMap[h] : "");

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    // Auto-update / Sinkronisasi Komprehensif ke Sheet Tahfidz_Capaian (Bersih dari data ganda, 1 santri = 1 baris)
    try {
      syncTahfidzCapaianSheet_(ss);
    } catch (capErr) {
      console.warn("[SYNC CAPAIAN WARN]", capErr);
    }

    // Replikasi Server-Side ke Supabase (via service_role key)
    try {
      if (typeof replicateToSupabase === "function") {
        replicateToSupabase("/rest/v1/tahfidz_logs?on_conflict=log_id", "POST", {
          log_id: logId,
          student_id: studentId,
          nis: nis || null,
          student_name: studentName,
          gender: (gender === "L" || gender === "PUTRA") ? "Putra" : "Putri",
          tanggal: tanggal,
          sesi: sesi,
          tipe: tipe,
          juz: juz,
          surah: surah || null,
          satuan: satuan || "HALAMAN",
          ayat_mulai: ayatMulai !== null ? Number(ayatMulai) : null,
          ayat_sampai: ayatSampai !== null ? Number(ayatSampai) : null,
          halaman_list: halamanList || "1",
          total_halaman: totalHalaman,
          nilai: nilai,
          muhafiz: muhafiz || "Ustadz Pembina",
          catatan: catatan || null,
          status_setoran: statusSetoran,
          created_at: createdAt
        });
      }
    } catch (sbErr) {
      console.warn("[SUPABASE REPLICATION TAHFIDZ WARN]", sbErr);
    }

    return {
      status: "success",
      success: true,
      logId: logId,
      message: `Setoran ${tipe.toLowerCase()} untuk santri ${studentName} berhasil disimpan (${statusSetoran})!`
    };

  } catch (err) {
    console.error("[SAVE TAHFIDZ LOG ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan setoran: " + err.message
    };
  }
}

/**
 * 3. Hapus Catatan Setoran Tahfidz
 */
function deleteTahfidzLog(logId, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const cleanLogId = String(logId || "").trim();
    if (!cleanLogId) throw new Error("ID Setoran tidak valid.");

    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_LOGS);
    if (!sheet) throw new Error("Sheet Tahfidz Logs belum tersedia.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("log_id");

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === cleanLogId) {
        sheet.deleteRow(i + 1);
        try {
          syncTahfidzCapaianSheet_(ss);
        } catch (syncErr) {
          console.warn("[DELETE LOG SYNC ERROR]", syncErr);
        }

        // Replikasi Server-Side Hapus ke Supabase (via service_role key)
        try {
          replicateToSupabase(`/rest/v1/tahfidz_logs?log_id=eq.${encodeURIComponent(cleanLogId)}`, "DELETE");
        } catch (sbErr) {
          console.warn("[SUPABASE REPLICATION DELETE TAHFIDZ WARN]", sbErr);
        }

        return {
          status: "success",
          success: true,
          message: `Riwayat setoran ${cleanLogId} berhasil dihapus.`
        };
      }
    }

    return {
      status: "error",
      success: false,
      message: "Data setoran tidak ditemukan."
    };
  } catch (err) {
    return {
      status: "error",
      success: false,
      message: "Gagal menghapus setoran: " + err.message
    };
  }
}

/**
 * 4. Detail Mutaba'ah & Rekap Realita vs Target Santri (Screenshot 4)
 * Menghasilkan:
 * - Capaian saat ini, target capaian, total setoran, rata-rata nilai
 * - Progress bar 0 - 30 Juz
 * - 3 Indikator (Harian, Pekanan, Bulanan) Target vs Realita
 * - Riwayat kronologis setoran
 */
function getTahfidzStudentDetail(studentId, token) {
  try {
    const cleanId = String(studentId || "").trim();
    if (!cleanId) throw new Error("ID Santri wajib disertakan.");

    const ss = getDatabaseSpreadsheet();

    // 1. Ambil Data Santri (dengan proteksi tangguh & fallback langsung)
    let student = null;
    try {
      const studentsRes = getAllStudentsData(token);
      const students = (studentsRes && studentsRes.data) || [];
      student = students.find(s => {
        const sId = String(s.studentId || s.student_id || "").trim();
        const sNis = String(s.nis || "").trim();
        return sId === cleanId || sNis === cleanId;
      });
    } catch (eSt) {
      console.warn("[GET STUDENT DETAIL ALL STUDENTS ERROR]", eSt);
    }

    if (!student) {
      try {
        const sSheet = getAuthSheet(ss, SHEET_STUDENTS);
        if (sSheet) {
          const sData = sSheet.getDataRange().getValues();
          if (sData && sData.length > 1) {
            const sh = sData[0].map(x => String(x || "").trim().toLowerCase());
            for (let i = 1; i < sData.length; i++) {
              const r = sData[i];
              const sId = String(r[sh.indexOf("student_id")] || "").trim();
              const sNis = String(r[sh.indexOf("nis")] || "").trim();
              if (sId === cleanId || sNis === cleanId) {
                student = {
                  studentId: sId,
                  nis: sNis,
                  name: String(r[sh.indexOf("nama_lengkap")] || r[sh.indexOf("name")] || "").trim(),
                  gender: String(r[sh.indexOf("gender")] || "L").toUpperCase(),
                  status: String(r[sh.indexOf("status")] || "Aktif").trim(),
                  program: String(r[sh.indexOf("program")] || "Tahfidz").trim()
                };
                break;
              }
            }
          }
        }
      } catch (eFallback) {
        console.warn("[STUDENTS FALLBACK DETAIL ERROR]", eFallback);
      }
    }

    if (!student) {
      return {
        status: "error",
        success: false,
        message: `Data santri ID '${cleanId}' tidak ditemukan.`
      };
    }

    // 2. Ambil Target Santri
    const targetSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_TARGET, [
      "student_id", "target_ziyadah_sesi", "target_ziyadah_pekan", "target_murajaah_sesi", "target_murajaah_pekan", "updated_at"
    ]);
    const targetData = targetSheet.getDataRange().getValues();
    let target = {
      ziyadahSesi: 1,
      ziyadahPekan: 10,
      murajaahSesi: 2,
      murajaahPekan: 10
    };

    if (targetData && targetData.length > 1) {
      const hTarget = targetData[0].map(h => String(h || "").trim().toLowerCase());
      for (let i = 1; i < targetData.length; i++) {
        const sId = String(targetData[i][hTarget.indexOf("student_id")] || "").trim();
        if (sId === cleanId || sId === student.nis) {
          target = {
            ziyadahSesi: Number(targetData[i][hTarget.indexOf("target_ziyadah_sesi")] || 1),
            ziyadahPekan: Number(targetData[i][hTarget.indexOf("target_ziyadah_pekan")] || 10),
            murajaahSesi: Number(targetData[i][hTarget.indexOf("target_murajaah_sesi")] || 2),
            murajaahPekan: Number(targetData[i][hTarget.indexOf("target_murajaah_pekan")] || 10)
          };
          break;
        }
      }
    }

    // 3. Ambil Riwayat Logs Santri
    const logsSheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_LOGS, [
      "log_id", "student_id", "nis", "student_name", "gender",
      "tanggal", "sesi", "tipe", "juz", "surah",
      "halaman_list", "total_halaman", "nilai", "muhafiz", "catatan", "status_setoran",
      "satuan", "ayat_mulai", "ayat_sampai", "created_at"
    ]);
    const logsData = logsSheet.getDataRange().getValues();
    const riwayat = [];

    if (logsData && logsData.length > 1) {
      const hLogs = logsData[0].map(h => String(h || "").trim().toLowerCase());
      for (let i = 1; i < logsData.length; i++) {
        const r = logsData[i];
        const sId = String(r[hLogs.indexOf("student_id")] || "").trim();
        const sNis = String(r[hLogs.indexOf("nis")] || "").trim();

        if (sId === cleanId || sNis === student.nis || sId === student.studentId) {
          riwayat.push({
            logId: String(r[hLogs.indexOf("log_id")] || "").trim(),
            tanggal: normalizeDateString(r[hLogs.indexOf("tanggal")]),
            sesi: String(r[hLogs.indexOf("sesi")] || "Pagi").trim(),
            tipe: String(r[hLogs.indexOf("tipe")] || "ZIYADAH").trim().toUpperCase(),
            juz: Number(r[hLogs.indexOf("juz")] || 1),
            surah: String(r[hLogs.indexOf("surah")] || "").trim(),
            satuan: hLogs.indexOf("satuan") !== -1 ? String(r[hLogs.indexOf("satuan")] || "HALAMAN").trim().toUpperCase() : "HALAMAN",
            ayatMulai: hLogs.indexOf("ayat_mulai") !== -1 && r[hLogs.indexOf("ayat_mulai")] !== "" ? Number(r[hLogs.indexOf("ayat_mulai")]) : null,
            ayatSampai: hLogs.indexOf("ayat_sampai") !== -1 && r[hLogs.indexOf("ayat_sampai")] !== "" ? Number(r[hLogs.indexOf("ayat_sampai")]) : null,
            halamanList: String(r[hLogs.indexOf("halaman_list")] || "1").trim(),
            totalHalaman: Number(r[hLogs.indexOf("total_halaman")] || 1),
            nilai: String(r[hLogs.indexOf("nilai")] || "MUMTAZ").trim().toUpperCase(),
            muhafiz: String(r[hLogs.indexOf("muhafiz")] || "").trim(),
            catatan: String(r[hLogs.indexOf("catatan")] || "").trim(),
            statusSetoran: hLogs.indexOf("status_setoran") !== -1 ? String(r[hLogs.indexOf("status_setoran")] || "LANJUT").trim().toUpperCase() : "LANJUT",
            createdAt: String(r[hLogs.indexOf("created_at")] || "")
          });
        }
      }
    }

    // Urutkan riwayat dari yang terbaru
    riwayat.sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));

    // 3b. Ambil Riwayat Presensi Santri (dari sheet Tahfidz_Presensi)
    const riwayatPresensi = [];
    const presSheet = ss.getSheetByName(SHEET_TAHFIDZ_PRESENSI);
    if (presSheet && presSheet.getLastRow() > 1) {
      const presData = presSheet.getDataRange().getValues();
      const pHeaders = presData[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      const pColMap = {};
      HEADERS_TAHFIDZ_PRESENSI.forEach(dh => {
        pColMap[dh] = pHeaders.indexOf(dh.toLowerCase().replace(/[\s\-_]+/g, ""));
      });

      for (let i = 1; i < presData.length; i++) {
        const pr = presData[i];
        const sId = String(pr[pColMap["student_id"]] || "").trim();
        const sNis = String(pr[pColMap["nis"]] || "").trim();

        if (sId === cleanId || sNis === student.nis || sId === student.studentId) {
          riwayatPresensi.push({
            presensiId: String(pr[pColMap["presensi_id"]] || "").trim(),
            tanggal: normalizeDateString(pr[pColMap["tanggal"]]),
            sesi: String(pr[pColMap["sesi"]] || "Pagi").trim(),
            halaqahId: String(pr[pColMap["halaqah_id"]] || "").trim(),
            namaHalaqah: String(pr[pColMap["nama_halaqah"]] || "").trim(),
            studentId: sId,
            nis: sNis,
            studentName: String(pr[pColMap["student_name"]] || "").trim(),
            status: String(pr[pColMap["status"]] || "HADIR").trim().toUpperCase(),
            keterangan: String(pr[pColMap["keterangan"]] || "").trim(),
            muhafiz: String(pr[pColMap["muhafiz"]] || "").trim(),
            updatedAt: String(pr[pColMap["updated_at"]] || "")
          });
        }
      }
      riwayatPresensi.sort((a, b) => new Date(b.tanggal || b.updatedAt) - new Date(a.tanggal || a.updatedAt));
    }

    // 4. Hitung Capaian Saat Ini & Rata-rata Nilai Berdasarkan Urutan Kurikulum
    let maxRank = -1;
    let currentJuz = 30;
    let currentHal = 1;
    let totalScorePoints = 0;

    riwayat.forEach(r => {
      if (r.tipe === "ZIYADAH" && r.statusSetoran !== "ULANG") {
        const j = Number(r.juz) || 30;
        const rk = getTahfidzCurriculumRank_(j);
        const h = parseTahfidzLatestPage_(r.halamanList);
        if (rk > maxRank || (rk === maxRank && h > currentHal)) {
          maxRank = rk;
          currentJuz = j;
          currentHal = h;
        }
      }
      if (r.nilai === "MUMTAZ") totalScorePoints += 4;
      else if (r.nilai === "JAYYID_JIDDAN") totalScorePoints += 3;
      else if (r.nilai === "JAYYID") totalScorePoints += 2;
      else totalScorePoints += 1;
    });

    if (maxRank === -1) {
      if (riwayat.length > 0 && riwayat[0].juz) {
        currentJuz = Number(riwayat[0].juz) || 30;
        currentHal = parseTahfidzLatestPage_(riwayat[0].halamanList);
        maxRank = getTahfidzCurriculumRank_(currentJuz);
      } else {
        currentJuz = 30;
        currentHal = 1;
        maxRank = 0;
      }
    }

    const totalTuntas = Math.min(600, maxRank * 20 + currentHal);
    const percent = Math.min(100, Math.max(1, Math.round((totalTuntas / 600) * 100)));
    const curriculumJuzIndex = maxRank + 1;

    let avgNilaiText = "-";
    if (riwayat.length > 0) {
      const avgScore = totalScorePoints / riwayat.length;
      if (avgScore >= 3.5) avgNilaiText = "Mumtaz (A)";
      else if (avgScore >= 2.8) avgNilaiText = "Jayyid Jiddan (B+)";
      else if (avgScore >= 2.0) avgNilaiText = "Jayyid (B)";
      else avgNilaiText = "Dha'if (C)";
    }

    // 5. Kalkulasi 3 Indikator (Harian, Pekan, Bulan)
    const todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const todayDate = new Date();
    const startOfWeek = new Date();
    startOfWeek.setDate(todayDate.getDate() - 6);
    const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

    let harianZReal = 0, harianMReal = 0, harianCount = 0;
    let pekanZReal = 0, pekanMReal = 0, pekanCount = 0;
    let bulanZReal = 0, bulanMReal = 0, bulanCount = 0;

    riwayat.forEach(r => {
      const d = new Date(r.tanggal || r.createdAt);
      const hal = r.totalHalaman || 1;

      // Harian
      if (r.tanggal === todayStr) {
        harianCount++;
        if (r.tipe === "ZIYADAH") harianZReal += hal;
        else harianMReal += hal;
      }

      // Pekanan
      if (d >= startOfWeek) {
        pekanCount++;
        if (r.tipe === "ZIYADAH") pekanZReal += hal;
        else pekanMReal += hal;
      }

      // Bulanan
      if (d >= startOfMonth) {
        bulanCount++;
        if (r.tipe === "ZIYADAH") bulanZReal += hal;
        else bulanMReal += hal;
      }
    });

    const targetPekanTotal = target.ziyadahPekan + target.murajaahPekan;
    const realPekanTotal = pekanZReal + pekanMReal;
    const pekanPercent = targetPekanTotal > 0 ? Math.min(100, Math.round((realPekanTotal / targetPekanTotal) * 100)) : 0;

    const targetBulanTotal = (target.ziyadahPekan * 4) + (target.murajaahPekan * 4);
    const realBulanTotal = bulanZReal + bulanMReal;
    const bulanPercent = targetBulanTotal > 0 ? Math.min(100, Math.round((realBulanTotal / targetBulanTotal) * 100)) : 0;

    // 6. Ambil Data Halaqah & Muhafiz untuk Siswa Ini
    let studentHalaqah = student.halaqah || "";
    let studentMuhafiz = student.muhafiz || "";

    const halaqahSheet = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    const halaqahData = halaqahSheet ? halaqahSheet.getDataRange().getValues() : null;
    if (halaqahData && halaqahData.length > 1) {
      const hHal = halaqahData[0].map(h => String(h || "").trim().toLowerCase().replace(/\s+/g, "_"));
      const halNameIdx = hHal.indexOf("nama_halaqah") !== -1 ? hHal.indexOf("nama_halaqah") : hHal.indexOf("halaqah");
      const muhIdx = hHal.indexOf("muhafiz") !== -1 ? hHal.indexOf("muhafiz") : hHal.indexOf("muhafidz");
      const stIdsIdx = hHal.indexOf("student_ids") !== -1 ? hHal.indexOf("student_ids") : hHal.indexOf("anggota");

      for (let h = 1; h < halaqahData.length; h++) {
        const members = stIdsIdx !== -1 ? String(halaqahData[h][stIdsIdx] || "").split(",").map(m => m.trim().toLowerCase()) : [];
        const cleanIdLower = cleanId.toLowerCase();
        const cleanNisLower = String(student.nis || "").trim().toLowerCase();
        const cleanNameLower = String(student.name || "").trim().toLowerCase();

        const isMatch = members.some(m => {
          if (!m) return false;
          return m === cleanIdLower || 
                 m === cleanNisLower || 
                 (cleanNameLower && m === cleanNameLower) ||
                 m.replace(/[^a-z0-9]/g, "") === cleanIdLower.replace(/[^a-z0-9]/g, "");
        });

        if (isMatch) {
          if (!studentHalaqah && halNameIdx !== -1 && halaqahData[h][halNameIdx]) {
            studentHalaqah = String(halaqahData[h][halNameIdx]).trim();
          }
          if (!studentMuhafiz && muhIdx !== -1 && halaqahData[h][muhIdx]) {
            studentMuhafiz = String(halaqahData[h][muhIdx]).trim();
          }
          break;
        }
      }
    }

    if (!studentMuhafiz && riwayat.length > 0 && riwayat[0].muhafiz) {
      studentMuhafiz = riwayat[0].muhafiz;
    }

    if (!studentHalaqah && studentMuhafiz && halaqahData && halaqahData.length > 1) {
      const hHal = halaqahData[0].map(h => String(h || "").trim().toLowerCase().replace(/\s+/g, "_"));
      const halNameIdx = hHal.indexOf("nama_halaqah") !== -1 ? hHal.indexOf("nama_halaqah") : hHal.indexOf("halaqah");
      const muhIdx = hHal.indexOf("muhafiz") !== -1 ? hHal.indexOf("muhafiz") : hHal.indexOf("muhafidz");
      if (halNameIdx !== -1 && muhIdx !== -1) {
        for (let h = 1; h < halaqahData.length; h++) {
          if (String(halaqahData[h][muhIdx] || "").trim().toLowerCase() === studentMuhafiz.toLowerCase()) {
            studentHalaqah = String(halaqahData[h][halNameIdx] || "").trim();
            break;
          }
        }
      }
    }

    if (!studentHalaqah) studentHalaqah = "Belum Terplot";
    if (!studentMuhafiz) studentMuhafiz = "Menunggu Jadwal";

    return {
      status: "success",
      success: true,
      student: {
        studentId: student.studentId || cleanId,
        nis: student.nis || "-",
        name: student.name || "Santri",
        gender: student.gender || "L",
        photoUrl: student.photoUrl || "",
        program: student.program || "Tahfidz",
        status: student.status || "ACTIVE",
        halaqah: studentHalaqah,
        muhafiz: studentMuhafiz
      },
      halaqah: studentHalaqah,
      muhafiz: studentMuhafiz,
      stats: {
        capaianSaatIni: `Juz ${currentJuz} (${percent}%)`,
        targetCapaian: "30 Juz Mutqin",
        totalSetoran: `${riwayat.length} Kali`,
        rataRataNilai: avgNilaiText,
        progressJuz: currentJuz,
        progressHalaman: currentHal,
        curriculumJuzIndex: curriculumJuzIndex,
        totalHalamanTuntas: totalTuntas,
        progressMax: 30,
        progressPercent: percent
      },
      target: target,
      indikator: {
        harian: {
          targetText: `${target.ziyadahSesi} Halaman (Z) • ${target.murajaahSesi} Halaman (M)`,
          realitaText: `${harianZReal + harianMReal} Halaman (${harianCount}x Setor)`,
          ziyadahReal: harianZReal,
          murajaahReal: harianMReal,
          status: harianCount > 0 ? "Ada Setoran Hari Ini" : "Belum Ada Setoran"
        },
        pekanan: {
          targetText: `${target.ziyadahPekan} Halaman (Z) + ${target.murajaahPekan} Halaman (M)`,
          realitaText: `${realPekanTotal} Halaman (${pekanCount}x Setor)`,
          percent: pekanPercent,
          status: pekanPercent >= 100 ? "Target Pekan Tercapai" : (pekanPercent > 0 ? `${pekanPercent}% Capaian` : "0% Capaian")
        },
        bulanan: {
          targetText: `${target.ziyadahPekan * 4} Halaman (Z) + ${target.murajaahPekan * 4} Halaman (M)`,
          realitaText: `${realBulanTotal} Halaman (${bulanCount}x Setor)`,
          percent: bulanPercent,
          status: bulanPercent >= 100 ? "Target Bulan Tercapai" : (bulanPercent > 0 ? `${bulanPercent}% Capaian` : "0% Capaian")
        }
      },
      riwayat: riwayat,
      riwayatPresensi: riwayatPresensi
    };

  } catch (err) {
    console.error("[GET TAHFIDZ STUDENT DETAIL ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memuat detail mutaba'ah santri: " + err.message
    };
  }
}

/**
 * 5. Simpan / Perbarui Target Santri (Screenshot 3)
 */
function saveTahfidzTarget(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const studentId = String(payload.studentId || payload.student_id || "").trim();
    if (!studentId) throw new Error("ID Santri wajib disertakan.");

    const ss = getDatabaseSpreadsheet();
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_TARGET, [
      "student_id", "target_ziyadah_sesi", "target_ziyadah_pekan", "target_murajaah_sesi", "target_murajaah_pekan", "updated_at"
    ]);

    const zSesi = Number(payload.targetZiyadahSesi || payload.target_ziyadah_sesi || 1);
    const zPekan = Number(payload.targetZiyadahPekan || payload.target_ziyadah_pekan || (zSesi * 10));
    const mSesi = Number(payload.targetMurajaahSesi || payload.target_murajaah_sesi || 2);
    const mPekan = Number(payload.targetMurajaahPekan || payload.target_murajaah_pekan || (mSesi * 5));
    const updatedAt = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("student_id");
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === studentId) {
        foundRow = i + 1;
        break;
      }
    }

    const rowValues = [studentId, zSesi, zPekan, mSesi, mPekan, updatedAt];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return {
      status: "success",
      success: true,
      message: "Target mutaba'ah santri berhasil diperbarui."
    };
  } catch (err) {
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan target: " + err.message
    };
  }
}

/**
 * 5b. Simpan / Perbarui Target Santri Secara Massal (Bulk Target)
 */
function saveBulkTahfidzTarget(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const studentIds = Array.isArray(payload.studentIds) 
      ? payload.studentIds.map(id => String(id || "").trim()).filter(Boolean)
      : (payload.studentId ? [String(payload.studentId).trim()] : []);

    if (studentIds.length === 0) {
      throw new Error("Daftar ID Santri sasaran tidak boleh kosong.");
    }

    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_TARGET) || getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_TARGET, [
      "student_id", "target_ziyadah_sesi", "target_ziyadah_pekan", "target_murajaah_sesi", "target_murajaah_pekan", "updated_at"
    ]);

    const zSesi = Number(payload.targetZiyadahSesi || payload.target_ziyadah_sesi || 1);
    const zPekan = Number(payload.targetZiyadahPekan || payload.target_ziyadah_pekan || (zSesi * 10));
    const mSesi = Number(payload.targetMurajaahSesi || payload.target_murajaah_sesi || 2);
    const mPekan = Number(payload.targetMurajaahPekan || payload.target_murajaah_pekan || (mSesi * 5));
    const updatedAt = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
    const idIdx = headers.findIndex(h => h === "studentid" || h === "id");
    const zSesiIdx = headers.findIndex(h => h.includes("ziyadah") && h.includes("sesi"));
    const zPekanIdx = headers.findIndex(h => h.includes("ziyadah") && h.includes("pekan"));
    const mSesiIdx = headers.findIndex(h => h.includes("murajaah") && h.includes("sesi"));
    const mPekanIdx = headers.findIndex(h => h.includes("murajaah") && h.includes("pekan"));
    const updatedIdx = headers.findIndex(h => h.includes("updated") || h.includes("tanggal"));

    // Map existing rows: studentId -> rowIndex (0-based in data array)
    const existingRowMap = new Map();
    for (let i = 1; i < data.length; i++) {
      const sId = String(data[i][idIdx !== -1 ? idIdx : 0] || "").trim();
      if (sId) {
        existingRowMap.set(sId, i);
      }
    }

    const newRowsToAppend = [];
    const updatedStudentIds = new Set();

    studentIds.forEach(stId => {
      if (existingRowMap.has(stId)) {
        const rowIdx = existingRowMap.get(stId);
        if (zSesiIdx !== -1) data[rowIdx][zSesiIdx] = zSesi;
        if (zPekanIdx !== -1) data[rowIdx][zPekanIdx] = zPekan;
        if (mSesiIdx !== -1) data[rowIdx][mSesiIdx] = mSesi;
        if (mPekanIdx !== -1) data[rowIdx][mPekanIdx] = mPekan;
        if (updatedIdx !== -1) data[rowIdx][updatedIdx] = updatedAt;
        updatedStudentIds.add(stId);
      } else {
        const newRow = new Array(headers.length).fill("");
        if (idIdx !== -1) newRow[idIdx] = stId;
        if (zSesiIdx !== -1) newRow[zSesiIdx] = zSesi;
        if (zPekanIdx !== -1) newRow[zPekanIdx] = zPekan;
        if (mSesiIdx !== -1) newRow[mSesiIdx] = mSesi;
        if (mPekanIdx !== -1) newRow[mPekanIdx] = mPekan;
        if (updatedIdx !== -1) newRow[updatedIdx] = updatedAt;
        newRowsToAppend.push(newRow);
        updatedStudentIds.add(stId);
      }
    });

    // Batch update existing data range
    if (data.length > 1) {
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }

    // Batch append new rows if any
    if (newRowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, newRowsToAppend.length, newRowsToAppend[0].length).setValues(newRowsToAppend);
    }

    return {
      status: "success",
      success: true,
      message: `Target mutaba'ah untuk ${updatedStudentIds.size} santri berhasil diperbarui secara massal.`,
      updatedCount: updatedStudentIds.size,
      studentIds: Array.from(updatedStudentIds),
      target: {
        ziyadahSesi: zSesi,
        ziyadahPekan: zPekan,
        murajaahSesi: mSesi,
        murajaahPekan: mPekan
      }
    };
  } catch (err) {
    console.error("[SAVE BULK TAHFIDZ TARGET ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan target massal: " + err.message
    };
  }
}

/**
 * 6. Ambil Daftar Halaqah Aktif (Screenshot 2)
 */
function getTahfidzHalaqahList(token) {
  try {
    const ss = getDatabaseSpreadsheet();
    migrateTahfidzHalaqahSheet_(ss);

    const headersHalaqah = ["halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"];
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_HALAQAH, headersHalaqah, "#059669");

    const data = sheet.getDataRange().getValues();
    const list = [];
    if (data && data.length > 1) {
      const colMap = getHalaqahColumnIndexes(data[0]);
      for (let i = 1; i < data.length; i++) {
        const r = data[i];
        const rawId = colMap.id !== -1 ? String(r[colMap.id] || "").trim() : "";
        const hMuh = colMap.muhafiz !== -1 ? String(r[colMap.muhafiz] || "").trim() : "";
        if (!rawId && !hMuh) continue;

        const id = rawId || ("HLQ-" + (i < 10 ? "0" + i : i));
        const stIds = colMap.studentIds !== -1 ? String(r[colMap.studentIds] || "").split(",").map(s => s.trim()).filter(Boolean) : [];
        const hTarget = colMap.target !== -1 ? String(r[colMap.target] || "").trim() : "Tahfidz 30 Juz";
        const hName = (colMap.nama !== -1 && r[colMap.nama]) ? String(r[colMap.nama]).trim() : (hMuh ? ("Halaqah " + hMuh) : ("Halaqah " + id));

        list.push({
          halaqahId: id,
          namaHalaqah: hName,
          muhafiz: hMuh || "Ustadz Pembina",
          targetKurikulum: hTarget,
          studentIds: stIds,
          studentCount: stIds.length
        });
      }
    }

    // Periksa delegasi badal aktif (Izin Asatidz APPROVED untuk hari ini)
    let activeDelegations = [];
    try {
      activeDelegations = getActiveBadalDelegations();
      if (activeDelegations && activeDelegations.length > 0) {
        const delMap = {};
        activeDelegations.forEach(d => {
          const key = String(d.namaAsatidz || "").trim().toLowerCase();
          if (key) delMap[key] = d;
        });

        list.forEach(item => {
          const mKey = String(item.muhafiz || "").trim().toLowerCase();
          if (delMap[mKey]) {
            const d = delMap[mKey];
            item.delegation = {
              isDelegated: true,
              badalId: d.badalId,
              namaBadal: d.namaBadal,
              sesi: d.sesi,
              catatanBadal: d.catatanBadal,
              idIzin: d.idIzin
            };
          }
        });
      }
    } catch (eDel) {
      console.warn("[HALAQAH DELEGATION CHECK WARN]", eDel);
    }

    return {
      status: "success",
      success: true,
      data: list,
      activeDelegations: activeDelegations
    };
  } catch (err) {
    return { status: "error", success: false, message: err.message };
  }
}

/**
 * 7. Simpan / Buat Kelompok Halaqah Baru (5 Kolom Standar Mubarokah)
 */
function saveTahfidzHalaqah(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const muhafiz = String(payload.muhafiz || "").trim();
    if (!muhafiz) throw new Error("Ustadz Muhafiz Pembina wajib dipilih.");

    const ss = getDatabaseSpreadsheet();
    migrateTahfidzHalaqahSheet_(ss);

    const headersHalaqah = ["halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"];
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_HALAQAH, headersHalaqah, "#059669");

    const halaqahId = payload.halaqahId || payload.halaqah_id || ("HLQ-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + Math.floor(100 + Math.random() * 900));
    const targetKurikulum = String(payload.targetKurikulum || payload.target_kurikulum || "Tahfidz 30 Juz").trim();
    const studentIds = Array.isArray(payload.studentIds) ? payload.studentIds.join(",") : String(payload.studentIds || "");
    const createdAt = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const colMap = getHalaqahColumnIndexes(data[0]);

    let foundRow = -1;
    if (colMap.id !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colMap.id] || "").trim() === halaqahId) {
          foundRow = i + 1;
          break;
        }
      }
    }

    const rowValues = [halaqahId, muhafiz, targetKurikulum, studentIds, createdAt];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    // Sinkronisasi otomatis ke Sheet Tahfidz_Capaian
    syncTahfidzCapaianSheet_(ss);

    return {
      status: "success",
      success: true,
      halaqahId: halaqahId,
      message: `Halaqah ${muhafiz} berhasil disimpan.`
    };
  } catch (err) {
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan halaqah: " + err.message
    };
  }
}

/**
 * 7b. Simpan Plotting Santri Binaan ke Halaqah (5 Kolom Standar Mubarokah)
 */
function saveTahfidzPlotting(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const halaqahId = String(payload.halaqahId || payload.halaqah_id || "").trim();
    if (!halaqahId) throw new Error("ID Halaqah wajib disertakan.");

    let rawList = payload.studentIds || payload.student_ids || [];
    if (typeof rawList === "string") {
      rawList = rawList.split(",");
    }
    const cleanStudentIds = Array.isArray(rawList) ? rawList.map(s => String(s).trim()).filter(Boolean) : [];

    const ss = getDatabaseSpreadsheet();
    migrateTahfidzHalaqahSheet_(ss);

    const headersHalaqah = ["halaqah_id", "muhafiz", "target_kurikulum", "student_ids", "created_at"];
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_HALAQAH, headersHalaqah, "#059669");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) throw new Error("Data halaqah tidak ditemukan.");

    const colMap = getHalaqahColumnIndexes(data[0]);
    if (colMap.id === -1 || colMap.studentIds === -1) {
      throw new Error("Kolom halaqah_id atau student_ids tidak ditemukan pada sheet.");
    }

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const curId = String(data[i][colMap.id] || "").trim();
      const curMuh = colMap.muhafiz !== -1 ? String(data[i][colMap.muhafiz] || "").trim() : "";
      if (curId.toLowerCase() === halaqahId.toLowerCase() || (curMuh && curMuh.toLowerCase() === halaqahId.toLowerCase())) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow <= 0) throw new Error("Halaqah ID '" + halaqahId + "' tidak ditemukan.");

    sheet.getRange(foundRow, colMap.studentIds + 1).setValue(cleanStudentIds.join(","));
    if (typeof SpreadsheetApp !== "undefined" && SpreadsheetApp.flush) {
      SpreadsheetApp.flush();
    }

    // Sinkronisasi otomatis ke Sheet Tahfidz_Capaian
    syncTahfidzCapaianSheet_(ss);
    if (typeof SpreadsheetApp !== "undefined" && SpreadsheetApp.flush) {
      SpreadsheetApp.flush();
    }

    return {
      status: "success",
      success: true,
      halaqahId: halaqahId,
      totalPlotting: cleanStudentIds.length,
      message: `Berhasil mengatur ${cleanStudentIds.length} santri binaan ke halaqah.`
    };
  } catch (err) {
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan plotting santri: " + err.message
    };
  }
}

/**
 * 8. Hapus Kelompok Halaqah (5 Kolom Standar Mubarokah)
 */
function deleteTahfidzHalaqah(halaqahId, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const cleanId = String(halaqahId || "").trim();
    if (!cleanId) throw new Error("ID Halaqah wajib diisi.");

    const ss = getDatabaseSpreadsheet();
    migrateTahfidzHalaqahSheet_(ss);

    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    if (!sheet) throw new Error("Sheet halaqah belum dibuat.");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: "error", success: false, message: "Halaqah tidak ditemukan." };

    const colMap = getHalaqahColumnIndexes(data[0]);
    const idIdx = colMap.id;
    if (idIdx === -1) throw new Error("Kolom halaqah_id tidak ditemukan.");

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx] || "").trim() === cleanId) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.deleteRow(foundRow);
      // Sinkronisasi otomatis ke Sheet Tahfidz_Capaian
      syncTahfidzCapaianSheet_(ss);
      return {
        status: "success",
        success: true,
        message: "Kelompok halaqah berhasil dihapus."
      };
    }

    return { status: "error", success: false, message: "Halaqah tidak ditemukan." };
  } catch (err) {
    return { status: "error", success: false, message: "Gagal menghapus halaqah: " + err.message };
  }
}

// ====================================================================
// MODUL BACKEND: JADWAL & SESI WAKTU TAHFIDZ (SCREENSHOT 4)
// ====================================================================

/**
 * 9. Ambil Daftar Jadwal Sesi Waktu Aktif
 */
function getTahfidzSesiList(token) {
  try {
    const ss = getDatabaseSpreadsheet();
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_SESI, [
      "sesi_id", "nama_sesi", "jenis_sesi", "status", "jam_mulai", "jam_selesai", "hari_list", "created_at"
    ], "#4f46e5");

    const data = sheet.getDataRange().getValues();
    const list = [];
    if (data && data.length > 1) {
      const h = data[0].map(x => String(x || "").trim().toLowerCase());
      for (let i = 1; i < data.length; i++) {
        const id = String(data[i][h.indexOf("sesi_id")] || "").trim();
        if (!id) continue;
        list.push({
          sesiId: id,
          namaSesi: String(data[i][h.indexOf("nama_sesi")] || "").trim(),
          jenisSesi: String(data[i][h.indexOf("jenis_sesi")] || "Ziyadah (Setoran Hafalan Baru)").trim(),
          status: String(data[i][h.indexOf("status")] || "Aktif Digunakan").trim(),
          jamMulai: String(data[i][h.indexOf("jam_mulai")] || "").trim(),
          jamSelesai: String(data[i][h.indexOf("jam_selesai")] || "").trim(),
          hariList: String(data[i][h.indexOf("hari_list")] || "Sen,Sel,Rab,Kam,Jum,Sab,Min").split(",").map(x => x.trim()).filter(Boolean),
          createdAt: String(data[i][h.indexOf("created_at")] || "")
        });
      }
    }

    return {
      status: "success",
      success: true,
      data: list
    };
  } catch (err) {
    return { status: "error", success: false, message: err.message };
  }
}

/**
 * 10. Simpan / Perbarui Jadwal Sesi Waktu Baru
 */
function saveTahfidzSesi(payload, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const p = (payload && (payload.sesi || payload.data)) ? (payload.sesi || payload.data) : (payload || {});
    const namaSesi = String(p.namaSesi || p.nama_sesi || p.nama || "").trim();
    if (!namaSesi) throw new Error("Nama sesi wajib diisi.");

    const ss = getDatabaseSpreadsheet();
    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_SESI, [
      "sesi_id", "nama_sesi", "jenis_sesi", "status", "jam_mulai", "jam_selesai", "hari_list", "created_at"
    ], "#4f46e5");

    const rawId = String(p.sesiId || p.sesi_id || p.id || "").trim();
    const sesiId = rawId || ("SESI-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmm"));
    const jenisSesi = String(p.jenisSesi || p.jenis_sesi || p.jenis || "Ziyadah (Setoran Hafalan Baru)").trim();
    const status = String(p.status || "Aktif Digunakan").trim();
    const jamMulai = String(p.jamMulai || p.jam_mulai || "05:00").trim();
    const jamSelesai = String(p.jamSelesai || p.jam_selesai || "06:30").trim();
    const rawHari = p.hariList || p.hari || "Sen,Sel,Rab,Kam,Sab";
    const hariList = Array.isArray(rawHari) ? rawHari.join(",") : String(rawHari);
    const createdAt = new Date().toISOString();

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("sesi_id");
    let foundRow = -1;

    if (rawId && idIdx >= 0) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx] || "").trim() === rawId) {
          foundRow = i + 1;
          break;
        }
      }
    }

    const rowValues = [sesiId, namaSesi, jenisSesi, status, jamMulai, jamSelesai, hariList, createdAt];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return {
      status: "success",
      success: true,
      sesiId: sesiId,
      message: `Jadwal sesi ${namaSesi} berhasil disimpan.`
    };
  } catch (err) {
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan sesi: " + err.message
    };
  }
}

/**
 * 11. Hapus Jadwal Sesi Waktu
 */
function deleteTahfidzSesi(sesiId, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const cleanId = String((typeof sesiId === 'object' && sesiId ? (sesiId.sesiId || sesiId.id) : sesiId) || "").trim();
    if (!cleanId) throw new Error("ID Sesi wajib diisi.");

    const ss = getDatabaseSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_SESI);
    if (!sheet) throw new Error("Sheet sesi belum dibuat.");

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { status: "error", success: false, message: "Sesi tidak ditemukan." };

    const headers = data[0].map(h => String(h || "").trim().toLowerCase());
    const idIdx = headers.indexOf("sesi_id");
    let foundRow = -1;

    if (idIdx >= 0) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx] || "").trim() === cleanId) {
          foundRow = i + 1;
          break;
        }
      }
    }

    if (foundRow > 0) {
      sheet.deleteRow(foundRow);
      return {
        status: "success",
        success: true,
        message: "Jadwal sesi berhasil dihapus."
      };
    }
    return { status: "error", success: false, message: "Sesi tidak ditemukan." };
  } catch (err) {
    return { status: "error", success: false, message: err.message };
  }
}

/**
 * ====================================================================
 * MANAJEMEN PRESENSI CEPAT HALAQAH SANTRI (SPREADSHEET INTEGRATION)
 * ====================================================================
 */

/**
 * Menyimpan rekap presensi kehadiran halaqah santri ke sheet Tahfidz_Presensi (Upsert per tanggal + sesi + student_id)
 */
function saveTahfidzPresensi(payload, token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const p = (payload && payload.payload) ? payload.payload : ((payload && payload.data) ? payload.data : (payload || {}));
    const tanggal = String(p.tanggal || payload.tanggal || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd")).trim();
    const sesi = String(p.sesi || payload.sesi || "Pagi (Ba'da Subuh)").trim();
    const halaqahId = String(p.halaqahId || p.halaqah_id || payload.halaqahId || payload.halaqah_id || "").trim();
    const namaHalaqah = String(p.namaHalaqah || p.nama_halaqah || payload.namaHalaqah || payload.nama_halaqah || "").trim();
    const muhafiz = String(p.muhafiz || payload.muhafiz || (actor ? actor.name : "") || "Ustadz Pembina").trim();
    const rawRecords = Array.isArray(p.records) ? p.records : (Array.isArray(payload.records) ? payload.records : []);

    if (rawRecords.length === 0) {
      throw new Error("Daftar catatan kehadiran santri tidak boleh kosong.");
    }

    const ss = getDatabaseSpreadsheet();
    if (!ss) throw new Error("Spreadsheet database tidak ditemukan.");

    const sheet = getOrCreateTahfidzSheet(ss, SHEET_TAHFIDZ_PRESENSI, HEADERS_TAHFIDZ_PRESENSI, "#059669");

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    let existingData = [];
    let colMap = {};

    if (lastRow > 1 && lastCol > 0) {
      const allRows = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = allRows[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      HEADERS_TAHFIDZ_PRESENSI.forEach(dh => {
        const clean = dh.toLowerCase().replace(/[\s\-_]+/g, "");
        colMap[dh] = headers.indexOf(clean);
      });
      existingData = allRows.slice(1);
    } else {
      HEADERS_TAHFIDZ_PRESENSI.forEach((dh, idx) => {
        colMap[dh] = idx;
      });
    }

    // Peta indeks baris yang sudah ada: tanggal + sesi + student_id -> rowIndex (1-based di sheet)
    const existingIndexMap = {};
    for (let i = 0; i < existingData.length; i++) {
      const row = existingData[i];
      const rTgl = String(row[colMap["tanggal"]] || "").trim();
      const rSesi = String(row[colMap["sesi"]] || "").trim();
      const rId = String(row[colMap["student_id"]] || row[colMap["nis"]] || "").trim();
      if (rTgl && rSesi && rId) {
        const key = `${rTgl}_${rSesi}_${rId}`;
        existingIndexMap[key] = i + 2;
      }
    }

    const nowIso = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const newRows = [];
    const rowsToDelete = [];
    let updatedCount = 0;
    let insertedCount = 0;

    for (let j = 0; j < rawRecords.length; j++) {
      const item = rawRecords[j];
      const sId = String(item.studentId || item.student_id || item.nis || "").trim();
      const nis = String(item.nis || sId).trim();
      const sName = String(item.studentName || item.student_name || item.name || "").trim();
      const status = String(item.status || "HADIR").toUpperCase().trim();
      const ket = String(item.keterangan || "").trim();
      const itemHalId = String(item.halaqahId || item.halaqah_id || halaqahId).trim();
      const itemHalName = String(item.namaHalaqah || item.nama_halaqah || namaHalaqah).trim();

      const key = `${tanggal}_${sesi}_${sId}`;
      const existingRowIdx = existingIndexMap[key];

      if (status === "HADIR") {
        // Exception-based: Santri Hadir tidak perlu dicatat barisnya di sheet (hemat kapasitas 95%).
        // Jika sebelumnya ada baris udzur (misal Sakit/Izin lalu diralat jadi Hadir), hapus barisnya.
        if (existingRowIdx) {
          rowsToDelete.push(existingRowIdx);
        }
      } else {
        // Status selain HADIR (SAKIT, IZIN, PULANG): Simpan catatan udzur ke Spreadsheet
        if (existingRowIdx) {
          if (colMap["status"] !== -1) sheet.getRange(existingRowIdx, colMap["status"] + 1).setValue(status);
          if (colMap["keterangan"] !== -1) sheet.getRange(existingRowIdx, colMap["keterangan"] + 1).setValue(ket);
          if (colMap["updated_at"] !== -1) sheet.getRange(existingRowIdx, colMap["updated_at"] + 1).setValue(nowIso);
          if (colMap["muhafiz"] !== -1 && muhafiz) sheet.getRange(existingRowIdx, colMap["muhafiz"] + 1).setValue(muhafiz);
          updatedCount++;
        } else {
          const pId = "PRS-" + Utilities.formatDate(new Date(), "GMT+7", "yyMMddHHmmss") + "-" + (j + 1);
          const rowData = new Array(HEADERS_TAHFIDZ_PRESENSI.length).fill("");
          rowData[colMap["presensi_id"]] = pId;
          rowData[colMap["tanggal"]] = tanggal;
          rowData[colMap["sesi"]] = sesi;
          rowData[colMap["halaqah_id"]] = itemHalId;
          rowData[colMap["nama_halaqah"]] = itemHalName;
          rowData[colMap["student_id"]] = sId;
          rowData[colMap["nis"]] = nis;
          rowData[colMap["student_name"]] = sName;
          rowData[colMap["status"]] = status;
          rowData[colMap["keterangan"]] = ket;
          rowData[colMap["muhafiz"]] = muhafiz;
          rowData[colMap["updated_at"]] = nowIso;
          newRows.push(rowData);
          insertedCount++;
        }
      }
    }

    // 1. Masukkan baris baru untuk santri udzur (Sakit/Izin/Pulang)
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, HEADERS_TAHFIDZ_PRESENSI.length).setValues(newRows);
    }

    // 2. Hapus baris catatan udzur yang diralat kembali menjadi Hadir (urutkan dari baris terbesar ke terkecil)
    let deletedCount = 0;
    if (rowsToDelete.length > 0) {
      const uniqueRows = Array.from(new Set(rowsToDelete)).sort((a, b) => b - a);
      for (let k = 0; k < uniqueRows.length; k++) {
        sheet.deleteRow(uniqueRows[k]);
        deletedCount++;
      }
    }

    const savedCount = insertedCount + updatedCount;
    let infoMsg = `Presensi berhasil disimpan ke Spreadsheet.`;
    if (savedCount > 0) {
      infoMsg = `Presensi berhasil disimpan (${savedCount} santri berhalangan dicatat di Spreadsheet).`;
    } else {
      infoMsg = `Presensi berhasil disimpan. Semua santri halaqah hadir (bebas udzur).`;
    }

    return {
      status: "success",
      success: true,
      message: infoMsg,
      tanggal: tanggal,
      sesi: sesi,
      savedCount: savedCount,
      insertedCount: insertedCount,
      updatedCount: updatedCount,
      deletedCount: deletedCount
    };
  } catch (err) {
    console.error("[SAVE TAHFIDZ PRESENSI ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan presensi ke Spreadsheet: " + (err.message || err)
    };
  }
}

/**
 * Mengambil rekap presensi kehadiran dari sheet Tahfidz_Presensi
 */
function getTahfidzPresensi(params, token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const ss = getDatabaseSpreadsheet();
    if (!ss) return { status: "success", success: true, data: [] };

    const sheet = ss.getSheetByName(SHEET_TAHFIDZ_PRESENSI);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "success", success: true, data: [] };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
    const colMap = {};
    HEADERS_TAHFIDZ_PRESENSI.forEach(dh => {
      colMap[dh] = headers.indexOf(dh.toLowerCase().replace(/[\s\-_]+/g, ""));
    });

    const p = params || {};
    const filterDate = String(p.tanggal || p.date || "").trim();
    const filterSesi = String(p.sesi || "").trim();
    const filterHalaqah = String(p.halaqahId || p.halaqah_id || "").trim();

    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const tgl = String(row[colMap["tanggal"]] || "").trim();
      const sesi = String(row[colMap["sesi"]] || "").trim();
      const halId = String(row[colMap["halaqah_id"]] || "").trim();

      if (filterDate && tgl !== filterDate) continue;
      if (filterSesi && filterSesi !== "ALL" && sesi !== filterSesi) continue;
      if (filterHalaqah && filterHalaqah !== "ALL" && halId !== filterHalaqah) continue;

      results.push({
        presensiId: row[colMap["presensi_id"]],
        tanggal: tgl,
        sesi: sesi,
        halaqahId: halId,
        namaHalaqah: row[colMap["nama_halaqah"]],
        studentId: row[colMap["student_id"]],
        nis: row[colMap["nis"]],
        studentName: row[colMap["student_name"]],
        status: row[colMap["status"]],
        keterangan: row[colMap["keterangan"]],
        muhafiz: row[colMap["muhafiz"]],
        updatedAt: row[colMap["updated_at"]]
      });
    }

    return {
      status: "success",
      success: true,
      data: results
    };
  } catch (err) {
    console.error("[GET TAHFIDZ PRESENSI ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memuat presensi: " + err.message,
      data: []
    };
  }
}

/**
 * 12. Monitoring Keaktifan Asatidz & Sesi Tahfidz
 * Hak Akses Khusus: SUPER_ADMIN dan PENGASUH
 * Deteksi otomatis siapa saja yang menjalankan presensi tahfidz dan catat setoran tahfidz
 * Patokan jam deadline harian berdasarkan Jadwal & Sesi Tahfidz
 * Mendukung timeframe: 1 hari (hari ini / realtime), 7 hari terakhir, 1 bulan (30 hari) terakhir
 */
function getKeaktifanAsatidz(payload, token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const ss = getDatabaseSpreadsheet();
    if (!ss) throw new Error("Spreadsheet database tidak ditemukan.");

    const now = new Date();
    const todayStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");
    const currentTimeStr = Utilities.formatDate(now, "GMT+7", "HH:mm");
    
    // Map hari dalam bahasa Indonesia / singkatan sesi (Sen, Sel, Rab, Kam, Jum, Sab, Min)
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const currentDayCode = dayNames[now.getDay()];

    // 1. Ambil Sesi Tahfidz Aktif
    const sesiRes = getTahfidzSesiList(token);
    const rawSesiList = (sesiRes && sesiRes.data) || [];
    const activeSesiList = rawSesiList.filter(s => s.status === "Aktif Digunakan");

    // Evaluasi status timeline sesi untuk hari ini
    const todaySessions = activeSesiList.map(sesi => {
      const isDayActive = !sesi.hariList || sesi.hariList.length === 0 || sesi.hariList.includes(currentDayCode);
      const jamMulai = sesi.jamMulai || "00:00";
      const jamSelesai = sesi.jamSelesai || "23:59";
      
      let timelineStatus = "UPCOMING"; // UPCOMING, IN_PROGRESS, PASSED_DEADLINE
      if (currentTimeStr < jamMulai) {
        timelineStatus = "UPCOMING";
      } else if (currentTimeStr >= jamMulai && currentTimeStr <= jamSelesai) {
        timelineStatus = "IN_PROGRESS";
      } else {
        timelineStatus = "PASSED_DEADLINE";
      }

      return {
        sesiId: sesi.sesiId,
        namaSesi: sesi.namaSesi,
        jenisSesi: sesi.jenisSesi,
        jamMulai: jamMulai,
        jamSelesai: jamSelesai,
        isDayActive: isDayActive,
        timelineStatus: timelineStatus
      };
    });

    // 2. Ambil Master Halaqah
    const halaqahSheet = ss.getSheetByName(SHEET_TAHFIDZ_HALAQAH);
    let halaqahRows = [];
    if (halaqahSheet && halaqahSheet.getLastRow() > 1) {
      const hData = halaqahSheet.getDataRange().getValues();
      const colMap = getHalaqahColumnIndexes(hData[0]);
      for (let i = 1; i < hData.length; i++) {
        const r = hData[i];
        const hId = colMap.id !== -1 ? String(r[colMap.id] || "").trim() : "";
        const hMuh = colMap.muhafiz !== -1 ? String(r[colMap.muhafiz] || "").trim() : "";
        if (!hId && !hMuh) continue;
        const rawSt = colMap.studentIds !== -1 ? String(r[colMap.studentIds] || "") : "";
        const stIds = rawSt ? rawSt.split(",").map(x => x.trim()).filter(Boolean) : [];
        halaqahRows.push({
          halaqahId: hId,
          namaHalaqah: colMap.nama !== -1 && r[colMap.nama] ? String(r[colMap.nama]).trim() : ("Halaqah " + hMuh),
          muhafiz: hMuh || "Ustadz Pembina",
          studentIds: stIds,
          targetKurikulum: colMap.target !== -1 ? String(r[colMap.target] || "") : "Tahfidz 30 Juz"
        });
      }
    }

    // Default Fallback Teachers jika halaqah sheet belum diisi
    if (halaqahRows.length === 0) {
      const defaultTeachers = [
        "Ustadz Faiz", "Ustadz Halim", "Ustadz Iqbal", "Ustadz Pendi",
        "Ustadzah Alfi", "Ustadzah Angelia", "Ustadzah Aya", "Ustadzah Fadhilah",
        "Ustadzah Fatim", "Ustadzah Iis", "Ustadzah Luthfi", "Ustadzah Mufti",
        "Ustadzah Muhim", "Ustadzah Shabrina", "Ustadzah Shofi", "Ustadzah Yusita"
      ];
      defaultTeachers.forEach((muh, idx) => {
        halaqahRows.push({
          halaqahId: "HLQ-" + (idx < 9 ? "0" + (idx + 1) : (idx + 1)),
          namaHalaqah: "Halaqah " + muh,
          muhafiz: muh,
          studentIds: [],
          targetKurikulum: "Tahfidz 30 Juz"
        });
      });
    }

    // 3. Ambil Data Pegawai untuk nomor kontak / WhatsApp
    let employeeMap = {};
    try {
      const empRes = getAllEmployeesData(token);
      const employees = (empRes && empRes.data) || [];
      employees.forEach(emp => {
        const n = String(emp.nama || "").trim().toLowerCase();
        if (n) {
          employeeMap[n] = {
            telepon: emp.telepon || emp.no_hp || emp.phone || "",
            email: emp.email || "",
            foto: emp.foto || emp.photo_url || ""
          };
        }
      });
    } catch (eEmp) {}

    // 4. Hitung Tanggal Batas: 30 hari yang lalu & 7 hari yang lalu
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = Utilities.formatDate(thirtyDaysAgo, "GMT+7", "yyyy-MM-dd");
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const sevenDaysAgoStr = Utilities.formatDate(sevenDaysAgo, "GMT+7", "yyyy-MM-dd");

    // 5. Baca Sheet Tahfidz_Presensi (30 hari terakhir)
    const presensiSheet = ss.getSheetByName(SHEET_TAHFIDZ_PRESENSI);
    const presensiRecords = [];
    if (presensiSheet && presensiSheet.getLastRow() > 1) {
      const pData = presensiSheet.getDataRange().getValues();
      const pHeaders = pData[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      const pColMap = {};
      HEADERS_TAHFIDZ_PRESENSI.forEach(dh => {
        pColMap[dh] = pHeaders.indexOf(dh.toLowerCase().replace(/[\s\-_]+/g, ""));
      });
      for (let i = 1; i < pData.length; i++) {
        const r = pData[i];
        const rTgl = String(r[pColMap["tanggal"]] || "").trim();
        if (rTgl && rTgl >= thirtyDaysAgoStr) {
          presensiRecords.push({
            tanggal: rTgl,
            sesi: String(r[pColMap["sesi"]] || "").trim(),
            halaqahId: String(r[pColMap["halaqah_id"]] || "").trim(),
            studentId: String(r[pColMap["student_id"]] || "").trim(),
            status: String(r[pColMap["status"]] || "HADIR").trim().toUpperCase(),
            muhafiz: String(r[pColMap["muhafiz"]] || "").trim(),
            updatedAt: String(r[pColMap["updated_at"]] || "")
          });
        }
      }
    }

    // 6. Baca Sheet Tahfidz_Logs (Setoran 30 hari terakhir)
    const logsSheet = ss.getSheetByName(SHEET_TAHFIDZ_LOGS);
    const logsRecords = [];
    if (logsSheet && logsSheet.getLastRow() > 1) {
      const lData = logsSheet.getDataRange().getValues();
      const lHeaders = lData[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s\-_]+/g, ""));
      const lCol = {
        tanggal: lHeaders.indexOf("tanggal"),
        sesi: lHeaders.indexOf("sesi"),
        muhafiz: lHeaders.indexOf("muhafiz"),
        studentId: lHeaders.indexOf("studentid"),
        totalHalaman: lHeaders.indexOf("totalhalaman"),
        nilai: lHeaders.indexOf("nilai"),
        createdAt: lHeaders.indexOf("createdat")
      };
      for (let i = 1; i < lData.length; i++) {
        const r = lData[i];
        const rTgl = lCol.tanggal !== -1 ? String(r[lCol.tanggal] || "").trim() : "";
        if (rTgl && rTgl >= thirtyDaysAgoStr) {
          logsRecords.push({
            tanggal: rTgl,
            sesi: lCol.sesi !== -1 ? String(r[lCol.sesi] || "").trim() : "",
            muhafiz: lCol.muhafiz !== -1 ? String(r[lCol.muhafiz] || "").trim() : "",
            studentId: lCol.studentId !== -1 ? String(r[lCol.studentId] || "").trim() : "",
            totalHalaman: lCol.totalHalaman !== -1 ? Number(r[lCol.totalHalaman] || 1) : 1,
            nilai: lCol.nilai !== -1 ? String(r[lCol.nilai] || "MUMTAZ").trim() : "MUMTAZ",
            createdAt: lCol.createdAt !== -1 ? String(r[lCol.createdAt] || "") : ""
          });
        }
      }
    }

    // Helper untuk pencocokan nama ustadz fleksibel
    function cleanTeacherName(name) {
      return String(name || "").trim().toLowerCase()
        .replace(/^(ustadz|ustadzah|ust\.|ustd\.|kyai|nyai|gus|ning)\s+/i, "")
        .trim();
    }

    // 7. Agregasi Keaktifan per Ustadz
    const asatidzList = halaqahRows.map((hlq, idx) => {
      const muhName = hlq.muhafiz;
      const cleanMuh = cleanTeacherName(muhName);
      
      const empContact = employeeMap[cleanMuh] || employeeMap[muhName.toLowerCase()] || {};

      // Filter presensi ustadz ini
      const uPresensi = presensiRecords.filter(p => {
        const pClean = cleanTeacherName(p.muhafiz);
        return (pClean && cleanMuh && (pClean === cleanMuh || pClean.includes(cleanMuh) || cleanMuh.includes(pClean))) ||
               (p.halaqahId && p.halaqahId === hlq.halaqahId);
      });

      // Filter setoran ustadz ini
      const uLogs = logsRecords.filter(l => {
        const lClean = cleanTeacherName(l.muhafiz);
        return (lClean && cleanMuh && (lClean === cleanMuh || lClean.includes(cleanMuh) || cleanMuh.includes(lClean)));
      });

      // Perhitungan HARI INI (Realtime)
      const todayPresensi = uPresensi.filter(p => p.tanggal === todayStr);
      const todayLogs = uLogs.filter(l => l.tanggal === todayStr);

      const todayPresensiSantriCount = todayPresensi.length;
      const todayHadirSantriCount = todayPresensi.filter(p => p.status === "HADIR").length;
      const todaySetoranCount = todayLogs.length;
      const todayHalamanCount = todayLogs.reduce((acc, curr) => acc + (curr.totalHalaman || 1), 0);

      // Cari timestamp terakhir aktif hari ini
      let lastActiveTime = "";
      todayPresensi.forEach(p => {
        if (p.updatedAt && (!lastActiveTime || p.updatedAt > lastActiveTime)) lastActiveTime = p.updatedAt;
      });
      todayLogs.forEach(l => {
        if (l.createdAt && (!lastActiveTime || l.createdAt > lastActiveTime)) lastActiveTime = l.createdAt;
      });

      // Evaluasi Kepatuhan per Sesi Hari Ini Berdasarkan Deadline Jadwal
      let sesiSummary = [];
      let totalSesiHariIni = 0;
      let totalSesiTuntas = 0;
      let totalSesiLewatDeadline = 0;

      todaySessions.forEach(ts => {
        if (!ts.isDayActive) return;
        totalSesiHariIni++;

        const presensiInSesi = todayPresensi.filter(p => p.sesi === ts.namaSesi || (ts.namaSesi && p.sesi && (p.sesi.includes(ts.namaSesi) || ts.namaSesi.includes(p.sesi))));
        const logsInSesi = todayLogs.filter(l => l.sesi === ts.namaSesi || (ts.namaSesi && l.sesi && (l.sesi.includes(ts.namaSesi) || ts.namaSesi.includes(l.sesi))));

        const hasPresensi = presensiInSesi.length > 0;
        const hasSetoran = logsInSesi.length > 0;

        let statusKepatuhan = "WAITING";
        let inputTimestamp = "";

        if (hasPresensi) inputTimestamp = presensiInSesi[0].updatedAt;
        if (hasSetoran && (!inputTimestamp || logsInSesi[0].createdAt < inputTimestamp)) inputTimestamp = logsInSesi[0].createdAt;

        let inputTimeOnly = "";
        if (inputTimestamp) {
          try {
            const dt = new Date(inputTimestamp);
            inputTimeOnly = Utilities.formatDate(dt, "GMT+7", "HH:mm");
          } catch(e) {}
        }

        if (hasPresensi && hasSetoran) {
          if (inputTimeOnly && inputTimeOnly <= ts.jamSelesai) {
            statusKepatuhan = "ON_TIME";
            totalSesiTuntas++;
          } else {
            statusKepatuhan = "LATE";
            totalSesiTuntas++;
          }
        } else if (hasPresensi || hasSetoran) {
          statusKepatuhan = "PARTIAL";
        } else {
          if (ts.timelineStatus === "PASSED_DEADLINE") {
            statusKepatuhan = "MISSED_DEADLINE";
            totalSesiLewatDeadline++;
          } else if (ts.timelineStatus === "IN_PROGRESS") {
            statusKepatuhan = "IN_PROGRESS";
          } else {
            statusKepatuhan = "WAITING";
          }
        }

        sesiSummary.push({
          sesiId: ts.sesiId,
          namaSesi: ts.namaSesi,
          jamMulai: ts.jamMulai,
          jamSelesai: ts.jamSelesai,
          timelineStatus: ts.timelineStatus,
          hasPresensi: hasPresensi,
          hasSetoran: hasSetoran,
          statusKepatuhan: statusKepatuhan,
          inputTime: inputTimeOnly,
          presensiCount: presensiInSesi.length,
          setoranCount: logsInSesi.length
        });
      });

      let statusHariIni = "BELUM_MULAI";
      if (todayPresensiSantriCount > 0 && todaySetoranCount > 0) {
        statusHariIni = totalSesiLewatDeadline === 0 ? "AKTIF_LENGKAP" : "AKTIF_SEBAGIAN_TERLEWAT";
      } else if (todayPresensiSantriCount > 0 || todaySetoranCount > 0) {
        statusHariIni = "AKTIF_PARSIAL";
      } else if (totalSesiLewatDeadline > 0) {
        statusHariIni = "LEWAT_DEADLINE";
      } else {
        statusHariIni = "MENUNGGU_SESI";
      }

      // Perhitungan 7 HARI TERAKHIR
      const activeDays7d = new Set();
      let setoranCount7d = 0;
      let halamanCount7d = 0;
      let presensiCount7d = 0;

      uPresensi.forEach(p => {
        if (p.tanggal >= sevenDaysAgoStr && p.tanggal <= todayStr) {
          activeDays7d.add(p.tanggal);
          presensiCount7d++;
        }
      });
      uLogs.forEach(l => {
        if (l.tanggal >= sevenDaysAgoStr && l.tanggal <= todayStr) {
          activeDays7d.add(l.tanggal);
          setoranCount7d++;
          halamanCount7d += (l.totalHalaman || 1);
        }
      });

      // Perhitungan 30 HARI TERAKHIR
      const activeDays30d = new Set();
      let setoranCount30d = 0;
      let halamanCount30d = 0;
      let presensiCount30d = 0;

      uPresensi.forEach(p => {
        if (p.tanggal >= thirtyDaysAgoStr && p.tanggal <= todayStr) {
          activeDays30d.add(p.tanggal);
          presensiCount30d++;
        }
      });
      uLogs.forEach(l => {
        if (l.tanggal >= thirtyDaysAgoStr && l.tanggal <= todayStr) {
          activeDays30d.add(l.tanggal);
          setoranCount30d++;
          halamanCount30d += (l.totalHalaman || 1);
        }
      });

      return {
        id: "AST-" + (idx + 1),
        muhafiz: muhName,
        halaqahId: hlq.halaqahId,
        namaHalaqah: hlq.namaHalaqah,
        targetKurikulum: hlq.targetKurikulum,
        totalBinaan: hlq.studentIds ? hlq.studentIds.length : 0,
        telepon: empContact.telepon || "",
        email: empContact.email || "",
        hariIni: {
          status: statusHariIni,
          lastActiveTime: lastActiveTime,
          presensiSantriCount: todayPresensiSantriCount,
          hadirSantriCount: todayHadirSantriCount,
          setoranCount: todaySetoranCount,
          halamanCount: todayHalamanCount,
          sesiSummary: sesiSummary,
          totalSesiHariIni: totalSesiHariIni,
          totalSesiTuntas: totalSesiTuntas,
          totalSesiLewatDeadline: totalSesiLewatDeadline
        },
        pekanan: {
          activeDaysCount: activeDays7d.size,
          activePercentage: Math.round((activeDays7d.size / 7) * 100),
          presensiCount: presensiCount7d,
          setoranCount: setoranCount7d,
          halamanCount: halamanCount7d
        },
        bulanan: {
          activeDaysCount: activeDays30d.size,
          activePercentage: Math.round((activeDays30d.size / 30) * 100),
          presensiCount: presensiCount30d,
          setoranCount: setoranCount30d,
          halamanCount: halamanCount30d
        }
      };
    });

    const totalUstadz = asatidzList.length;
    const ustadzAktifHariIni = asatidzList.filter(a => a.hariIni.presensiSantriCount > 0 || a.hariIni.setoranCount > 0).length;
    const ustadzLewatDeadline = asatidzList.filter(a => a.hariIni.status === "LEWAT_DEADLINE" || a.hariIni.totalSesiLewatDeadline > 0).length;
    const totalSetoranHariIni = asatidzList.reduce((acc, a) => acc + a.hariIni.setoranCount, 0);
    const totalHalamanHariIni = asatidzList.reduce((acc, a) => acc + a.hariIni.halamanCount, 0);

    return {
      status: "success",
      success: true,
      data: {
        serverTime: currentTimeStr,
        serverDate: todayStr,
        serverDay: currentDayCode,
        summary: {
          totalUstadz: totalUstadz,
          ustadzAktifHariIni: ustadzAktifHariIni,
          persenAktifHariIni: totalUstadz > 0 ? Math.round((ustadzAktifHariIni / totalUstadz) * 100) : 0,
          ustadzLewatDeadline: ustadzLewatDeadline,
          totalSetoranHariIni: totalSetoranHariIni,
          totalHalamanHariIni: totalHalamanHariIni,
          totalSesiAktifHariIni: todaySessions.filter(s => s.isDayActive).length
        },
        todaySessions: todaySessions,
        asatidzList: asatidzList
      }
    };
  } catch (err) {
    console.error("[GET KEAKTIFAN ASATIDZ ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memproses data keaktifan asatidz: " + err.message
    };
  }
}

/**
 * Menyimpan konfigurasi urutan kurikulum 30 Juz per Program Pesantren ke PropertiesService
 */
function saveTahfidzCurriculumSettings(payload, token) {
  try {
    const rawMap = payload.curriculumMap || payload;
    const jsonStr = typeof rawMap === 'string' ? rawMap : JSON.stringify(rawMap);
    const props = PropertiesService.getScriptProperties();
    props.setProperty("TAHFIDZ_CURRICULUM_PROGRAMS", jsonStr);
    return {
      status: "success",
      success: true,
      message: "Pengaturan kurikulum tahfidz berhasil disimpan ke server.",
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("[SAVE TAHFIDZ CURRICULUM ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal menyimpan kurikulum: " + (err.message || err)
    };
  }
}

// ============================================================================
// MODUL KHUSUS: PERIZINAN ASATIDZ & KELANGSUNGAN HALAQAH TAHFIDZ (BADAL)
// ============================================================================

/**
 * 1. Inisialisasi Sheet Izin_Asatidz
 */
function initIzinAsatidzSheet(ss) {
  try {
    if (!ss) ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_IZIN_ASATIDZ);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_IZIN_ASATIDZ);
      sheet.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length).setValues([HEADERS_IZIN_ASATIDZ]);
      sheet.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length)
        .setFontWeight("bold")
        .setBackground("#047857")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      Logger.log(`[SCHEMA AUTO-INIT] Tab '${SHEET_IZIN_ASATIDZ}' berhasil dibuat otomatis di Google Sheets.`);
    } else {
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        sheet.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length).setValues([HEADERS_IZIN_ASATIDZ]);
        sheet.getRange(1, 1, 1, HEADERS_IZIN_ASATIDZ.length)
          .setFontWeight("bold")
          .setBackground("#047857")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
      }
    }
    return {
      status: "success",
      success: true,
      message: `Tab '${SHEET_IZIN_ASATIDZ}' berhasil disiapkan di Google Sheets.`,
      sheetName: SHEET_IZIN_ASATIDZ
    };
  } catch (err) {
    console.error("[INIT IZIN ASATIDZ ERROR]", err);
    return { status: "error", success: false, message: "Gagal menyiapkan tab Izin_Asatidz: " + err.message };
  }
}

/**
 * 2. Helper Mengakses Sheet Izin_Asatidz
 */
function getIzinAsatidzSheet() {
  const ss = getDatabaseSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_IZIN_ASATIDZ);
  if (!sheet) {
    initIzinAsatidzSheet(ss);
    sheet = ss.getSheetByName(SHEET_IZIN_ASATIDZ);
  }
  return sheet;
}

/**
 * 3. Mengajukan Izin Asatidz (Wajib Menunjuk Ustadz Badal)
 */
function submitIzinAsatidz(payload, token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }

    const data = payload || {};
    const asatidzId = String(data.asatidzId || (actor && actor.identityId) || "").trim();
    const namaAsatidz = String(data.namaAsatidz || (actor && actor.identity && (actor.identity.nama || actor.identity.name)) || "").trim();
    const tglMulai = String(data.tanggalMulai || data.tglMulai || "").trim();
    const tglSelesai = String(data.tanggalSelesai || data.tglSelesai || tglMulai).trim();
    const sesi = String(data.sesi || "FULL_DAY").trim().toUpperCase();
    const kategori = String(data.kategori || "SAKIT").trim().toUpperCase();
    const alasan = String(data.alasan || "").trim();
    const badalId = String(data.badalId || "").trim();
    const namaBadal = String(data.namaBadal || "").trim();
    const catatanBadal = String(data.catatanBadal || "").trim();
    const lampiranUrl = String(data.lampiranUrl || "").trim();

    if (!namaAsatidz) throw new Error("Nama Asatidz pemohon wajib diisi.");
    if (!tglMulai) throw new Error("Tanggal mulai izin wajib ditentukan.");
    if (!alasan) throw new Error("Alasan perizinan wajib disertakan.");
    if (!namaBadal) throw new Error("Ustadz Badal (pengganti) wajib dipilih untuk menjamin kelangsungan halaqah.");

    const sheet = getIzinAsatidzSheet();
    if (!sheet) throw new Error("Gagal mengakses database Izin_Asatidz.");

    const now = new Date();
    const yearMonth = Utilities.formatDate(now, "GMT+7", "yyyyMM");
    const count = Math.max(1, sheet.getLastRow());
    const idIzin = `IZA-${yearMonth}-${String(count).padStart(3, "0")}`;
    const timestamp = now.toISOString();

    const newRow = [
      idIzin,
      asatidzId,
      namaAsatidz,
      tglMulai,
      tglSelesai,
      sesi,
      kategori,
      alasan,
      badalId,
      namaBadal,
      catatanBadal,
      lampiranUrl,
      "PENDING",
      "",
      "",
      "",
      timestamp,
      timestamp
    ];

    sheet.appendRow(newRow);

    return {
      status: "success",
      success: true,
      message: "Permohonan izin mengajar berhasil diajukan dan menunggu persetujuan Dewan Pengasuh.",
      data: {
        idIzin: idIzin,
        namaAsatidz: namaAsatidz,
        namaBadal: namaBadal,
        tglMulai: tglMulai,
        tglSelesai: tglSelesai,
        sesi: sesi,
        status: "PENDING"
      }
    };
  } catch (err) {
    console.error("[SUBMIT IZIN ASATIDZ ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal mengajukan izin: " + err.message
    };
  }
}

/**
 * 4. Mengambil Daftar Data Izin Asatidz
 */
function getIzinAsatidzData(params = {}, token = null) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
      } catch (e) {
        verifySessionToken(token);
      }
    }

    const sheet = getIzinAsatidzSheet();
    if (!sheet) {
      return { status: "success", success: true, data: [], summary: { total: 0, pending: 0, approved: 0, rejected: 0 } };
    }

    const values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) {
      return { status: "success", success: true, data: [], summary: { total: 0, pending: 0, approved: 0, rejected: 0 } };
    }

    const headers = values[0].map(h => String(h || "").trim().toLowerCase());
    const col = {};
    headers.forEach((h, idx) => { col[h] = idx; });

    const list = [];
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      const idIzin = String(r[col["id_izin"]] || "").trim();
      if (!idIzin) continue;

      const item = {
        idIzin: idIzin,
        asatidzId: String(r[col["asatidz_id"]] || "").trim(),
        namaAsatidz: String(r[col["nama_asatidz"]] || "").trim(),
        tanggalMulai: String(r[col["tanggal_mulai"]] || "").trim(),
        tanggalSelesai: String(r[col["tanggal_selesai"]] || "").trim(),
        sesi: String(r[col["sesi"]] || "FULL_DAY").trim(),
        kategori: String(r[col["kategori"]] || "SAKIT").trim(),
        alasan: String(r[col["alasan"]] || "").trim(),
        badalId: String(r[col["badal_id"]] || "").trim(),
        namaBadal: String(r[col["nama_badal"]] || "").trim(),
        catatanBadal: String(r[col["catatan_badal"]] || "").trim(),
        lampiranUrl: String(r[col["lampiran_url"]] || "").trim(),
        status: String(r[col["status"]] || "PENDING").trim().toUpperCase(),
        pengasuhApprovedBy: String(r[col["pengasuh_approved_by"]] || "").trim(),
        pengasuhApprovedAt: String(r[col["pengasuh_approved_at"]] || "").trim(),
        catatanPengasuh: String(r[col["catatan_pengasuh"]] || "").trim(),
        createdAt: String(r[col["created_at"]] || "").trim(),
        updatedAt: String(r[col["updated_at"]] || "").trim()
      };

      if (item.status === "PENDING") pendingCount++;
      else if (item.status === "APPROVED") approvedCount++;
      else if (item.status === "REJECTED") rejectedCount++;

      // Filter jika parameter diberikan
      if (params.status && item.status !== String(params.status).trim().toUpperCase()) continue;
      if (params.asatidzId && item.asatidzId !== String(params.asatidzId).trim()) continue;
      if (params.badalId && item.badalId !== String(params.badalId).trim()) continue;
      if (params.tanggal && (item.tanggalMulai > params.tanggal || item.tanggalSelesai < params.tanggal)) continue;

      list.push(item);
    }

    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      status: "success",
      success: true,
      data: list,
      summary: {
        total: list.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    };
  } catch (err) {
    console.error("[GET IZIN ASATIDZ ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memuat data izin asatidz: " + err.message
    };
  }
}

/**
 * 5. Persetujuan Izin Asatidz oleh Dewan Pengasuh
 */
function approveIzinAsatidz(payload, token) {
  try {
    let approverName = "Dewan Pengasuh";
    if (token) {
      const actor = authenticateSession(token);
      authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "PENGASUH"]);
      if (actor.identity && (actor.identity.nama || actor.identity.name)) {
        approverName = actor.identity.nama || actor.identity.name;
      }
    }

    const data = payload || {};
    const idIzin = String(data.idIzin || data.id || "").trim();
    const decision = String(data.decision || data.status || "APPROVED").trim().toUpperCase();
    const catatan = String(data.catatan || data.catatanPengasuh || "").trim();

    if (!idIzin) throw new Error("ID Izin Asatidz wajib disertakan.");

    const sheet = getIzinAsatidzSheet();
    if (!sheet) throw new Error("Database Izin_Asatidz tidak ditemukan.");

    const values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) throw new Error("Data izin masih kosong.");

    const headers = values[0].map(h => String(h || "").trim().toLowerCase());
    const col = {};
    headers.forEach((h, idx) => { col[h] = idx; });

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][col["id_izin"]] || "").trim() === idIzin) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Data izin '${idIzin}' tidak ditemukan.`);
    }

    const nowISO = new Date().toISOString();
    const finalStatus = (decision === "REJECT" || decision === "REJECTED" || decision === "TOLAK") ? "REJECTED" : "APPROVED";

    sheet.getRange(rowIndex, col["status"] + 1).setValue(finalStatus);
    sheet.getRange(rowIndex, col["pengasuh_approved_by"] + 1).setValue(approverName);
    sheet.getRange(rowIndex, col["pengasuh_approved_at"] + 1).setValue(nowISO);
    sheet.getRange(rowIndex, col["catatan_pengasuh"] + 1).setValue(catatan);
    sheet.getRange(rowIndex, col["updated_at"] + 1).setValue(nowISO);

    return {
      status: "success",
      success: true,
      message: finalStatus === "APPROVED" 
        ? "Izin Asatidz berhasil disetujui (Qobul). Pendelegasian halaqah ke Ustadz Badal telah aktif."
        : "Izin Asatidz telah ditolak.",
      data: {
        idIzin: idIzin,
        status: finalStatus,
        approvedBy: approverName,
        approvedAt: nowISO
      }
    };
  } catch (err) {
    console.error("[APPROVE IZIN ASATIDZ ERROR]", err);
    return {
      status: "error",
      success: false,
      message: "Gagal memproses persetujuan izin: " + err.message
    };
  }
}

/**
 * 6. Mengambil Delegasi Badal Aktif pada Tanggal & Sesi Tertentu
 */
function getActiveBadalDelegations(dateStr, sesiStr) {
  try {
    const today = dateStr || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
    const sheet = getIzinAsatidzSheet();
    if (!sheet) return [];

    const values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) return [];

    const headers = values[0].map(h => String(h || "").trim().toLowerCase());
    const col = {};
    headers.forEach((h, idx) => { col[h] = idx; });

    const delegations = [];
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      const status = String(r[col["status"]] || "").trim().toUpperCase();
      if (status !== "APPROVED") continue;

      const tMulai = String(r[col["tanggal_mulai"]] || "").trim();
      const tSelesai = String(r[col["tanggal_selesai"]] || tMulai).trim();
      if (today < tMulai || today > tSelesai) continue;

      const sesi = String(r[col["sesi"]] || "FULL_DAY").trim().toUpperCase();
      if (sesiStr && sesi !== "FULL_DAY" && sesi !== String(sesiStr).trim().toUpperCase()) {
        continue;
      }

      delegations.push({
        idIzin: String(r[col["id_izin"]] || "").trim(),
        asatidzId: String(r[col["asatidz_id"]] || "").trim(),
        namaAsatidz: String(r[col["nama_asatidz"]] || "").trim(),
        badalId: String(r[col["badal_id"]] || "").trim(),
        namaBadal: String(r[col["nama_badal"]] || "").trim(),
        sesi: sesi,
        catatanBadal: String(r[col["catatan_badal"]] || "").trim(),
        tanggalMulai: tMulai,
        tanggalSelesai: tSelesai
      });
    }
    return delegations;
  } catch (e) {
    console.warn("[GET ACTIVE BADAL ERROR]", e);
    return [];
  }
}

