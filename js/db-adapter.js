/**
 * js/db-adapter.js
 * 
 * Abstraksi Antarmuka Database (Pluggable Database Driver Pattern)
 * Memungkinkan aplikasi beralih secara mulus antara Google Apps Script backend
 * dan Cloud Database (Supabase / PostgreSQL) tanpa mengubah business logic atau UI.
 * 
 * Konfigurasi diatur via window.ASNAWIYYAH_CONFIG.dbProvider ('gas' | 'supabase').
 */

(function (window) {
  'use strict';

  window.ASNAWIYYAH_CONFIG = window.ASNAWIYYAH_CONFIG || {};
  const config = window.ASNAWIYYAH_CONFIG;

  // Provider bawaan saat ini: Google Apps Script
  config.dbProvider = config.dbProvider || 'gas';

  /**
   * Driver 1: Google Apps Script (Production Current)
   */
  class GoogleAppsScriptDriver {
    constructor(apiUrl) {
      this.apiUrl = apiUrl;
    }

    async request(action, payload = {}, options = {}) {
      const url = this.apiUrl || window.ASNAWIYYAH_CONFIG.apiUrl;
      if (!url) throw new Error('API URL Google Apps Script belum dikonfigurasi.');

      const isPost = options.method === 'POST' || !options.method;
      if (isPost) {
        const body = { action, ...payload };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body)
        });
        return await res.json();
      } else {
        const queryParams = new URLSearchParams({ action, ...payload });
        const res = await fetch(`${url}?${queryParams.toString()}`);
        return await res.json();
      }
    }

    get tahfidz() {
      return {
        getDashboard: async (token) => this.request('getTahfidzDashboard', { token }),
        saveLog: async (data, token) => this.request('saveTahfidzLog', { data, token }),
        deleteLog: async (logId, token) => this.request('deleteTahfidzLog', { logId, token }),
        getStudentDetail: async (studentId, token) => this.request('getTahfidzStudentDetail', { studentId, token }),
        saveTarget: async (data, token) => this.request('saveTahfidzTarget', { data, token }),
        saveBulkTarget: async (data, token) => this.request('saveBulkTahfidzTarget', { data, token }),
        getHalaqahList: async (token) => this.request('getTahfidzHalaqahList', { token }),
        saveHalaqah: async (data, token) => this.request('saveTahfidzHalaqah', { data, token }),
        savePlotting: async (data, token) => this.request('saveTahfidzPlotting', { data, token }),
        deleteHalaqah: async (halaqahId, token) => this.request('deleteTahfidzHalaqah', { halaqahId, token })
      };
    }

    get notifications() {
      return {
        getAll: async () => this.request('getNotifikasi', {}, { method: 'GET' }),
        save: async (data, token) => this.request('simpanNotifikasi', { data, token }),
        delete: async (id, token) => this.request('deleteNotifikasi', { id, token })
      };
    }
  }

  /**
   * Driver 2: Supabase REST / PostgREST (Future Cloud DB)
   */
  class SupabaseDriver {
    constructor(supabaseUrl, supabaseKey) {
      this.supabaseUrl = supabaseUrl || window.ASNAWIYYAH_CONFIG.supabaseUrl;
      this.supabaseKey = supabaseKey || window.ASNAWIYYAH_CONFIG.supabaseKey;
    }

    getHeaders(token) {
      const headers = {
        'apikey': this.supabaseKey,
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }

    get tahfidz() {
      return {
        getDashboard: async (token) => {
          // Query capaian & ringkasan makro dari Supabase Views
          const res = await fetch(`${this.supabaseUrl}/rest/v1/tahfidz_capaian?select=*`, {
            headers: this.getHeaders(token)
          });
          const data = await res.json();
          return { status: 'success', data: { students: data } };
        },
        saveLog: async (logPayload, token) => {
          const body = {
            log_id: logPayload.log_id || logPayload.logId || `LOG_${Date.now()}`,
            student_id: logPayload.student_id || logPayload.studentId,
            student_name: logPayload.student_name || logPayload.studentName,
            nis: logPayload.nis || '',
            gender: logPayload.gender || '',
            tanggal: logPayload.tanggal || new Date().toISOString().split('T')[0],
            sesi: logPayload.sesi || 'Sesi 1',
            tipe: logPayload.tipe || 'Ziyadah',
            juz: Number(logPayload.juz) || 1,
            surah: logPayload.surah || '',
            halaman_list: logPayload.halaman_list || '',
            total_halaman: Number(logPayload.total_halaman) || 1.0,
            nilai: logPayload.nilai || 'A',
            muhafiz: logPayload.muhafiz || '',
            catatan: logPayload.catatan || '',
            status_setoran: logPayload.status_setoran || 'Lancar',
            satuan: logPayload.satuan || 'Halaman',
            ayat_mulai: logPayload.ayat_mulai ? Number(logPayload.ayat_mulai) : null,
            ayat_sampai: logPayload.ayat_sampai ? Number(logPayload.ayat_sampai) : null
          };

          const res = await fetch(`${this.supabaseUrl}/rest/v1/tahfidz_logs`, {
            method: 'POST',
            headers: { ...this.getHeaders(token), 'Prefer': 'return=representation' },
            body: JSON.stringify(body)
          });
          const inserted = await res.json();
          return { status: 'success', data: inserted[0] };
        },
        deleteLog: async (logId, token) => {
          await fetch(`${this.supabaseUrl}/rest/v1/tahfidz_logs?log_id=eq.${encodeURIComponent(logId)}`, {
            method: 'DELETE',
            headers: this.getHeaders(token)
          });
          return { status: 'success', message: 'Log berhasil dihapus dari Cloud DB' };
        }
      };
    }

    get notifications() {
      return {
        getAll: async () => {
          const res = await fetch(`${this.supabaseUrl}/rest/v1/notifikasi?status=eq.Aktif&order=tanggal.desc`, {
            headers: this.getHeaders()
          });
          const data = await res.json();
          return { status: 'success', data };
        }
      };
    }
  }

  /**
   * Factory Method Resolusi Driver Database
   */
  function getDatabaseDriver() {
    const provider = window.ASNAWIYYAH_CONFIG.dbProvider || 'gas';
    if (provider === 'supabase') {
      return new SupabaseDriver(window.ASNAWIYYAH_CONFIG.supabaseUrl, window.ASNAWIYYAH_CONFIG.supabaseKey);
    }
    return new GoogleAppsScriptDriver(window.ASNAWIYYAH_CONFIG.apiUrl);
  }

  // Ekspor ke window global
  window.AsnawiyyahDB = {
    getDriver: getDatabaseDriver,
    GoogleAppsScriptDriver,
    SupabaseDriver
  };

})(typeof window !== 'undefined' ? window : globalThis);
