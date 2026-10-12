const https = require('https');

const url = 'https://tkjhfhyabacbyknwrysh.supabase.co/rest/v1/izin_perpulangan?select=*&order=created_at.asc';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo';

https.get(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } }, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const list = JSON.parse(body);
    const rows = list.map(d => {
      // Bersihkan nomor kontak agar tidak dievaluasi sebagai formula di Google Sheets
      let safeWaliPhone = String(d.wali_phone || '').trim();
      if (safeWaliPhone && (safeWaliPhone.startsWith('+') || safeWaliPhone.startsWith('='))) {
        safeWaliPhone = "'" + safeWaliPhone;
      }
      let safePenjemputKontak = String(d.penjemput_kontak || '').trim();
      if (safePenjemputKontak && (safePenjemputKontak.startsWith('+') || safePenjemputKontak.startsWith('='))) {
        safePenjemputKontak = "'" + safePenjemputKontak;
      }

      return [
        d.id_izin || '',
        d.student_id || '',
        d.student_nis || '',
        d.student_name || '',
        d.wali_id || '',
        d.wali_name || '',
        safeWaliPhone,
        d.kategori || '',
        d.alasan || '',
        d.penjemput_nama || '',
        d.penjemput_hubungan || '',
        safePenjemputKontak,
        d.tgl_mulai || '',
        d.jam_mulai || '',
        d.tgl_kembali || '',
        d.jam_kembali || '',
        d.status || '',
        d.pengurus_approved_by || '',
        d.pengurus_approved_at || '',
        d.pengurus_catatan || '',
        d.pengasuh_approved_by || '',
        d.pengasuh_approved_at || '',
        d.pengasuh_catatan || '',
        d.alasan_penolakan || '',
        d.checkout_at || '',
        d.checkout_petugas || '',
        d.checkin_at || '',
        d.checkin_petugas || '',
        d.catatan_keterlambatan || '',
        d.created_at || '',
        d.updated_at || ''
      ];
    });

    console.log('TOTAL ROWS:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
  });
});
