const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'legacy', '04_Tahfidz.gs');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target = `    // 1. Ambil Data Santri
    const studentsRes = getAllStudentsData(token);
    const students = (studentsRes && studentsRes.data) || [];
    const student = students.find(s => {
      const sId = String(s.studentId || s.student_id || "").trim();
      const sNis = String(s.nis || "").trim();
      return sId === cleanId || sNis === cleanId;
    });`;

const replacement = `    // 1. Ambil Data Santri (dengan proteksi tangguh & fallback langsung)
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
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[SUCCESS] getTahfidzStudentDetail student fallback updated');
} else {
  console.warn('[WARN] target not found in 04_Tahfidz.gs');
}
