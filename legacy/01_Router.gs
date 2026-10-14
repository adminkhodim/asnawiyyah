/**
 * ============================================================================
 * 01_Router.gs
 * PPTQ Asnawiyyah Backend Architecture - HTTP Gateway & Request Router
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - HTTP POST Gateway (doPost): Action dispatcher, payload parsing,
 *    CORS handling, unified RBAC guards, dan payload routing ke domain handler.
 *  - HTTP GET Gateway (doGet): Public query dispatcher, fallback redirect
 *    ke portal Vercel resmi (https://asnawiyyah.vercel.app/) dan JSON status envelope.
 *  - Drive Permission Helper (mintaIzinDrive).
 * ============================================================================
 */

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
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "PENGURUS"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      return createJsonResponse(
        simpanBerita(payload.data || payload)
      );
    }

    if (action === "updateBerita") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "PENGURUS"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      return createJsonResponse(
        updateBerita(payload.data || payload)
      );
    }

    if (action === "deleteBerita") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "PENGURUS"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      return createJsonResponse(
        deleteBeritaData(payload.data || payload)
      );
    }

    if (action === "recordNewsView") {
      return createJsonResponse(
        recordNewsView(payload.data || payload)
      );
    }

    if (action === "migrateViewsColumn") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        migrasiKolomViewsBerita()
      );
    }

    if (action === "saveBanner") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        simpanBanner(payload.data || payload)
      );
    }

    if (action === "uploadMedia") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH", "PENGURUS"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        uploadMediaToDrive(payload.data || payload, token)
      );
    }

    if (action === "uploadStudentPhoto" || action === "student.uploadPhoto") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        uploadStudentPhotoToDrive(payload.data || payload, token)
      );
    }

    if (action === "getStudents" || action === "student.list") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(
        getAllStudentsData(token)
      );
    }

    if (action === "saveStudent" || action === "student.save") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        saveStudentData(payload.data || payload, token)
      );
    }

    if (action === "batchUpdateStudentProgram" || action === "student.batchUpdateProgram") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        batchUpdateStudentProgram(payload.data || payload, token)
      );
    }

    if (action === "batchUpdateStudentClassSchool" || action === "student.batchUpdateClassSchool") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(
        batchUpdateStudentClassSchool(payload.data || payload, token)
      );
    }

    if (action === "deleteStudent" || action === "student.delete") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const studentId = payload.studentId || payload.student_id || payload.id || (payload.data && (payload.data.studentId || payload.data.student_id || payload.data.id));
      return createJsonResponse(
        deleteStudentData(studentId, token)
      );
    }

    // ========================================================
    // MODUL KE-20: IZIN SANTRI & PERPULANGAN ACTIONS (doPost)
    // ========================================================
    if (action === "initIzinPerpulangan" || action === "perpulangan.initSheet") {
      return createJsonResponse(initIzinPerpulanganSheet());
    }

    if (action === "syncIzinPerpulanganFromSupabase" || action === "perpulangan.syncFromSupabase") {
      return createJsonResponse(syncIzinPerpulanganFromSupabase());
    }

    if (action === "getIzinPerpulangan" || action === "perpulangan.list") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getIzinPerpulanganData(payload.data || payload, token));
    }

    if (action === "submitIzinPerpulangan" || action === "perpulangan.submit") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(submitIzinPerpulangan(payload.data || payload, token));
    }

    if (action === "approveIzinPengurus" || action === "perpulangan.approvePengurus") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(approveIzinPengurus(payload.data || payload, token));
    }

    if (action === "approveIzinPengasuh" || action === "perpulangan.approvePengasuh") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(approveIzinPengasuh(payload.data || payload, token));
    }

    if (action === "gateCheckIzin" || action === "perpulangan.gateCheck") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(gateCheckIzin(payload.data || payload, token));
    }

    if (action === "deleteIzinPerpulangan" || action === "perpulangan.delete") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(deleteIzinPerpulangan(payload.data || payload, token));
    }

    if (action === "autoFixMissingWaliNames" || action === "perpulangan.autoFixWaliNames") {
      return createJsonResponse(autoFixMissingWaliNames());
    }

    // ========================================================
    // ========================================================
    // TAHFIDZ AL-QUR'AN ACTIONS (doPost)
    // ========================================================
    if (action === "getTahfidzDashboard" || action === "tahfidz.dashboard" || action === "auth.tahfidz.dashboard") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getTahfidzDashboard(token));
    }

    if (action === "saveTahfidzLog" || action === "tahfidz.saveLog" || action === "auth.tahfidz.saveLog") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzLog(payload.data || payload, token));
    }

    if (action === "deleteTahfidzLog" || action === "tahfidz.deleteLog" || action === "auth.tahfidz.deleteLog") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const logId = payload.logId || payload.log_id || (payload.data && (payload.data.logId || payload.data.log_id));
      return createJsonResponse(deleteTahfidzLog(logId, token));
    }

    if (action === "getTahfidzStudentDetail" || action === "tahfidz.studentDetail" || action === "auth.tahfidz.studentDetail") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      const studentId = payload.studentId || payload.student_id || (payload.data && (payload.data.studentId || payload.data.student_id));
      return createJsonResponse(getTahfidzStudentDetail(studentId, token));
    }

    if (action === "saveTahfidzTarget" || action === "tahfidz.saveTarget" || action === "auth.tahfidz.saveTarget") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzTarget(payload.data || payload, token));
    }

    if (action === "saveBulkTahfidzTarget" || action === "tahfidz.saveBulkTarget" || action === "saveTahfidzTargetBulk" || action === "auth.tahfidz.saveBulkTarget") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveBulkTahfidzTarget(payload.data || payload, token));
    }

    if (action === "getTahfidzHalaqahList" || action === "tahfidz.getHalaqah" || action === "auth.tahfidz.getHalaqah") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getTahfidzHalaqahList(token));
    }

    if (action === "saveTahfidzHalaqah" || action === "tahfidz.saveHalaqah" || action === "auth.tahfidz.saveHalaqah") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzHalaqah(payload.data || payload, token));
    }

    if (action === "saveTahfidzPlotting" || action === "tahfidz.savePlotting" || action === "auth.tahfidz.savePlotting") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzPlotting(payload.data || payload, token));
    }

    if (action === "saveTahfidzPresensi" || action === "tahfidz.savePresensi" || action === "auth.tahfidz.savePresensi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ", "PENGASUH"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const dataPayload = payload.payload || payload.data || payload;
      return createJsonResponse(saveTahfidzPresensi(dataPayload, token));
    }

    if (action === "getTahfidzPresensi" || action === "tahfidz.getPresensi" || action === "auth.tahfidz.getPresensi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      const dataPayload = payload.payload || payload.data || payload;
      return createJsonResponse(getTahfidzPresensi(dataPayload, token));
    }

    if (action === "deleteTahfidzHalaqah" || action === "tahfidz.deleteHalaqah" || action === "auth.tahfidz.deleteHalaqah") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const hId = payload.halaqahId || (payload.data && payload.data.halaqahId) || "";
      return createJsonResponse(deleteTahfidzHalaqah(hId, token));
    }

    if (action === "cleanTahfidzCapaianDuplicates" || action === "tahfidz.cleanDuplicates" || action === "syncTahfidzCapaian" || action === "auth.tahfidz.cleanDuplicates") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      } catch (authErr) {
        verifySessionToken(token);
      }
      return createJsonResponse(cleanTahfidzCapaianDuplicates(token));
    }

    if (action === "getKeaktifanAsatidz" || action === "keaktifan.getAsatidz" || action === "auth.keaktifan.getAsatidz") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "PENGASUH"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const dataPayload = payload.payload || payload.data || payload;
      return createJsonResponse(getKeaktifanAsatidz(dataPayload, token));
    }

    // ========================================================
    // MANAJEMEN PERAN & HAK AKSES (RBAC) ACTIONS (doPost)
    // ========================================================
    if (action === "auth.admin.getRolePermissions" || action === "admin.getRolePermissions" || action === "getRolePermissions") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getRolePermissionsBackend(token));
    }

    if (action === "auth.admin.saveRolePermissions" || action === "admin.saveRolePermissions" || action === "saveRolePermissions") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      const roleKey = payload.roleKey || (payload.data && payload.data.roleKey) || "";
      const permissions = payload.permissions || (payload.data && payload.data.permissions) || [];
      return createJsonResponse(saveRolePermissionsBackend(roleKey, permissions, token));
    }

    if (action === "initTahfidzSheets" || action === "tahfidz.initSheets" || action === "auth.tahfidz.initSheets") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(initTahfidzSheets(token));
    }

    if (action === "getTahfidzSesiList" || action === "tahfidz.getSesi" || action === "auth.tahfidz.getSesi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getTahfidzSesiList(token));
    }

    if (action === "saveTahfidzSesi" || action === "tahfidz.saveSesi" || action === "auth.tahfidz.saveSesi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "ASATIDZ"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzSesi(payload.data || payload.sesi || payload, token));
    }

    if (action === "deleteTahfidzSesi" || action === "tahfidz.deleteSesi" || action === "auth.tahfidz.deleteSesi") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const sId = payload.sesiId || payload.id || (payload.data && (payload.data.sesiId || payload.data.id)) || "";
      return createJsonResponse(deleteTahfidzSesi(sId, token));
    }

    if (action === "saveTahfidzCurriculumSettings" || action === "tahfidz.saveCurriculum" || action === "saveTahfidzCurriculum") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGASUH"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveTahfidzCurriculumSettings(payload.data || payload, token));
    }

    // ========================================================
    // DATA PEGAWAI (ASATIDZ & KARYAWAN) ACTIONS (doPost)
    // ========================================================
    if (action === "getEmployees" || action === "employee.list") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      return createJsonResponse(getAllEmployeesData(token));
    }

    if (action === "saveEmployee" || action === "employee.save") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(saveEmployeeData(payload.data || payload, token));
    }

    if (action === "deleteEmployee" || action === "employee.delete") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      const employeeId = payload.employeeId || payload.employee_id || payload.id || (payload.data && (payload.data.employeeId || payload.data.employee_id || payload.data.id));
      return createJsonResponse(deleteEmployeeData(employeeId, token));
    }

    if (action === "deleteBanner") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanGaleri(payload.data || payload));
    }

    if (action === "savePengaturan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanPengaturan(payload.data || payload));
    }

    if (action === "deleteGaleri") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
      } catch (authErr) {
        return createJsonResponse({ status: "error", message: authErr.message });
      }
      return createJsonResponse(simpanUnitKegiatan(payload.data || payload));
    }

    if (action === "deleteUnitKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      try {
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN", "EDITOR"]);
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

    
    // ========================================================
    // JADWAL KEGIATAN SANTRI API ROUTER (POST)
    // ========================================================
    if (action === "getJadwalKegiatan") {
      return createJsonResponse(getJadwalKegiatanData());
    }

    if (action === "saveJadwalKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGURUS", "PENGASUH"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      return createJsonResponse(simpanJadwalKegiatan(payload.data || payload));
    }

    if (action === "deleteJadwalKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGURUS", "PENGASUH"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      const jadwalId = payload.id || (payload.data && payload.data.id);
      if (!jadwalId) {
        return createJsonResponse({ status: "error", message: "ID Jadwal wajib diisi" });
      }
      return createJsonResponse(hapusJadwalKegiatan(jadwalId));
    }

    if (action === "toggleJadwalKegiatan") {
      const token = payload.token || (payload.data && payload.data.token) || null;
      var actor = null;
      if (token) {
        try {
          actor = authenticateSession(token);
        } catch (authErr) {
          try {
            const claims = verifySessionToken(token, false);
            if (claims && claims.role) {
              actor = { role: claims.role, identityId: claims.identityId || claims.sub || "ADMIN" };
            }
          } catch (e2) {}
        }
      }
      if (actor) {
        try {
          authorizeRole(actor, ["SUPER_ADMIN", "ADMIN", "EDITOR", "PENGURUS", "PENGASUH"]);
        } catch (roleErr) {
          return createJsonResponse({ status: "error", message: roleErr.message });
        }
      } else if (token) {
        return createJsonResponse({ status: "error", message: "Sesi admin tidak valid atau telah berakhir." });
      }
      const jadwalId = payload.id || (payload.data && payload.data.id);
      const newStatus = payload.newStatus || (payload.data && payload.data.newStatus);
      if (!jadwalId || !newStatus) {
        return createJsonResponse({ status: "error", message: "ID Jadwal dan status wajib diisi" });
      }
      return createJsonResponse(toggleStatusJadwalKegiatan(jadwalId, newStatus));
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
        const actor = authenticateSession(token);
        authorizeRole(actor, ["ADMIN"]);
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
  // DEFAULT GATEWAY / FALLBACK
  // Alihkan akses browser ke portal resmi Vercel, atau kirim status API jika dipanggil programmatically.
  // ==========================================================

  if (!action) {
    if (e && e.parameter && (e.parameter.format === "json" || e.parameter.output === "json")) {
      return createJsonResponse({
        status: "ok",
        name: "PPTQ Asnawiyyah API Gateway",
        message: "API Gateway is active. Please provide an action parameter.",
        portalUrl: "https://asnawiyyah.vercel.app/",
        timestamp: new Date().toISOString()
      });
    }

    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta http-equiv="refresh" content="0; url=https://asnawiyyah.vercel.app/">' +
      '<title>Mengalihkan ke Portal Resmi PPTQ Asnawiyyah...</title>' +
      '</head><body style="font-family:sans-serif;text-align:center;padding:50px;">' +
      '<h2>Portal Resmi PPTQ Asnawiyyah</h2>' +
      '<p>Mengalihkan ke portal resmi: <a href="https://asnawiyyah.vercel.app/">https://asnawiyyah.vercel.app/</a></p>' +
      '<script>window.location.replace("https://asnawiyyah.vercel.app/");</script>' +
      '</body></html>'
    ).setTitle("PPTQ Asnawiyyah").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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

    if (action === "recordNewsView") {
      return createJsonResponse(
        recordNewsView(e.parameter || {})
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

    if (action === "getJadwalKegiatan") {
      return createJsonResponse(
        getJadwalKegiatanData()
      );
    }


    if (action === "getStudents" || action === "student.list") {
      const token = e.parameter.token || null;
      return createJsonResponse(
        getAllStudentsData(token)
      );
    }

    if (action === "getTahfidzDashboard" || action === "tahfidz.dashboard") {
      const token = e.parameter.token || null;
      return createJsonResponse(
        getTahfidzDashboard(token)
      );
    }

    if (action === "getTahfidzStudentDetail" || action === "tahfidz.studentDetail") {
      const token = e.parameter.token || null;
      const studentId = e.parameter.studentId || e.parameter.student_id || null;
      return createJsonResponse(
        getTahfidzStudentDetail(studentId, token)
      );
    }

    if (action === "getTahfidzSesiList" || action === "tahfidz.getSesi") {
      const token = e.parameter.token || null;
      return createJsonResponse(getTahfidzSesiList(token));
    }

    if (action === "getTahfidzHalaqahList" || action === "tahfidz.getHalaqah") {
      const token = e.parameter.token || null;
      return createJsonResponse(getTahfidzHalaqahList(token));
    }

    if (action === "getTahfidzPresensi" || action === "tahfidz.getPresensi") {
      const token = e.parameter.token || null;
      return createJsonResponse(getTahfidzPresensi(e.parameter, token));
    }

    if (action === "getEmployees" || action === "employee.list") {
      const token = e.parameter.token || null;
      return createJsonResponse(
        getAllEmployeesData(token)
      );
    }

    // ========================================================
    // MODUL KE-20: IZIN SANTRI & PERPULANGAN ACTIONS (doGet)
    // ========================================================
    if (action === "initIzinPerpulangan" || action === "perpulangan.initSheet") {
      return createJsonResponse(initIzinPerpulanganSheet());
    }

    if (action === "getIzinPerpulangan" || action === "perpulangan.list") {
      const token = e.parameter.token || null;
      return createJsonResponse(getIzinPerpulanganData(e.parameter, token));
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

