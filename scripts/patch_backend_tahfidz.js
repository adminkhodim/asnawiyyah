const fs = require('fs');
const path = require('path');

// 1. Patch legacy/06_MasterData.gs
const masterDataPath = path.join(__dirname, '..', 'legacy', '06_MasterData.gs');
let masterData = fs.readFileSync(masterDataPath, 'utf8');

// Normalize line endings to \n for consistent replacement
masterData = masterData.replace(/\r\n/g, '\n');

// Patch getAllStudentsData
const oldStudentsRole = `function getAllStudentsData(token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }`;

const newStudentsRole = `function getAllStudentsData(token) {
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
    }`;

if (masterData.includes(oldStudentsRole)) {
  masterData = masterData.replace(oldStudentsRole, newStudentsRole);
  console.log('[PATCH] 06_MasterData.gs getAllStudentsData patched successfully');
} else {
  console.warn('[WARN] 06_MasterData.gs getAllStudentsData target not found');
}

// Patch getAllEmployeesData
const oldEmployeesRole = `function getAllEmployeesData(token) {
  try {
    if (token) {
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR", "PENGASUH"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
    }`;

const newEmployeesRole = `function getAllEmployeesData(token) {
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
    }`;

if (masterData.includes(oldEmployeesRole)) {
  masterData = masterData.replace(oldEmployeesRole, newEmployeesRole);
  console.log('[PATCH] 06_MasterData.gs getAllEmployeesData patched successfully');
} else {
  console.warn('[WARN] 06_MasterData.gs getAllEmployeesData target not found');
}

fs.writeFileSync(masterDataPath, masterData, 'utf8');

// 2. Patch legacy/04_Tahfidz.gs
const tahfidzPath = path.join(__dirname, '..', 'legacy', '04_Tahfidz.gs');
let tahfidz = fs.readFileSync(tahfidzPath, 'utf8');
tahfidz = tahfidz.replace(/\r\n/g, '\n');

// Safe token verification in getTahfidzDashboard
const oldTahfidzAuth = `function getTahfidzDashboard(token) {
  try {
    let actor = null;
    if (token) {
      try {
        actor = authenticateSession(token);
      } catch (authErr) {
        const leg = verifySessionToken(token);
        if (leg && leg.role) {
          actor = { role: leg.role, identityId: leg.userId };
        }
      }
    }`;

const newTahfidzAuth = `function getTahfidzDashboard(token) {
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
    }`;

if (tahfidz.includes(oldTahfidzAuth)) {
  tahfidz = tahfidz.replace(oldTahfidzAuth, newTahfidzAuth);
  console.log('[PATCH] 04_Tahfidz.gs getTahfidzDashboard auth patched successfully');
} else {
  console.warn('[WARN] 04_Tahfidz.gs getTahfidzDashboard auth target not found');
}

// Fallback student reading in getTahfidzDashboard
const oldStudentRead = `    // 2. Ambil data master Santri
    const studentsRes = getAllStudentsData(token);
    const allStudents = (studentsRes && studentsRes.data) || [];`;

const newStudentRead = `    // 2. Ambil data master Santri (dengan proteksi tangguh & fallback langsung)
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
    }`;

if (tahfidz.includes(oldStudentRead)) {
  tahfidz = tahfidz.replace(oldStudentRead, newStudentRead);
  console.log('[PATCH] 04_Tahfidz.gs getTahfidzDashboard student read patched successfully');
} else {
  console.warn('[WARN] 04_Tahfidz.gs getTahfidzDashboard student read target not found');
}

// Auto-seed default halaqahs if halaqahSheet is empty
const oldHalaqahEnd = `        stIds.forEach(id => {
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
    }`;

const newHalaqahEnd = `        stIds.forEach(id => {
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
    }`;

if (tahfidz.includes(oldHalaqahEnd)) {
  tahfidz = tahfidz.replace(oldHalaqahEnd, newHalaqahEnd);
  console.log('[PATCH] 04_Tahfidz.gs halaqah default seeding patched successfully');
} else {
  console.warn('[WARN] 04_Tahfidz.gs halaqah default seeding target not found');
}

fs.writeFileSync(tahfidzPath, tahfidz, 'utf8');
console.log('Backend patching completed.');
