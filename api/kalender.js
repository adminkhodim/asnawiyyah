const SUPABASE_URL = process.env.SUPABASE_URL || "https://tkjhfhyabacbyknwrysh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRramhmaHlhYmFjYnlrbndyeXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDk1MDMsImV4cCI6MjEwNjM4NTUwM30.uIeUO_v29ztXFUyDAxb_50ybP62BO0ta_QEzgwWFdlo";
const GAS_API_URL = process.env.GAS_API_URL || "https://script.google.com/macros/s/AKfycbxIz6j4rpOTzR5JrLURjC17TZ8QNKtTIcEtOQRRsSrmKT8phmj0eq6Dfo6q_7tVlLEXZA/exec";

// Format tanggal iCalendar (YYYYMMDD)
function formatDateIcal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

// Format UTC timestamp (YYYYMMDDTHHMMSSZ)
function formatTimestampIcal(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Escape text untuk format RFC 5545
function escapeIcalText(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

// Format hari mingguan ke RFC 5545 RRULE BYDAY
function getByDayFromWaktu(waktu) {
    if (!waktu) return null;
    const lower = waktu.toLowerCase();
    const days = [];
    if (lower.includes('ahad') || lower.includes('minggu')) days.push('SU');
    if (lower.includes('senin')) days.push('MO');
    if (lower.includes('selasa')) days.push('TU');
    if (lower.includes('rabu')) days.push('WE');
    if (lower.includes('kamis')) days.push('TH');
    if (lower.includes('jumat') || lower.includes("jum'at")) days.push('FR');
    if (lower.includes('sabtu')) days.push('SA');
    return days.length > 0 ? days.join(',') : null;
}

// Konversi kode alarm admin ke trigger RFC 5545
function getAlarmTrigger(alarmCode) {
    switch (alarmCode) {
        case '3_days': return '-P3D';
        case '7_days': return '-P7D';
        case '2_hours': return '-PT2H';
        case 'none': return null;
        case '1_day':
        default: return '-P1D';
    }
}

// Ambil tanggal terdekat berikutnya untuk hari tertentu (0: Minggu, 1: Senin, ..., 5: Jumat, 6: Sabtu)
function getNextDayOfWeek(targetDayIndex) {
    const now = new Date();
    const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    const currentDay = result.getDay();
    const diff = (targetDayIndex - currentDay + 7) % 7;
    result.setDate(result.getDate() + diff);
    return result;
}


async function fetchJadwalKegiatan() {
    // 1. Ambil dari Supabase
    try {
        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/jadwal_kegiatan?status=eq.Aktif&order=urutan.asc`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            signal: AbortSignal.timeout(2500)
        });
        if (sbRes.ok) {
            const data = await sbRes.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.warn("Supabase fetch jadwal in ical failed:", e.message);
    }

    // 2. Fallback Google Apps Script
    try {
        const gasRes = await fetch(`${GAS_API_URL}?action=getJadwalKegiatan`, { signal: AbortSignal.timeout(3500) });
        const gasJson = await gasRes.json();
        if (gasJson && Array.isArray(gasJson.data) && gasJson.data.length > 0) {
            return gasJson.data.filter(j => (j.status || 'Aktif') === 'Aktif');
        }
    } catch (e2) {
        console.warn("GAS fetch jadwal in ical failed:", e2.message);
    }

    return [];
}

module.exports = async function handler(req, res) {
    try {
        const jadwalItems = await fetchJadwalKegiatan();
        const now = new Date();
        const nowStamp = formatTimestampIcal(now);
        const currentYear = now.getFullYear();

        let icsLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//PPTQ Asnawiyyah//Kalender Pesantren v1.0//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Agenda PPTQ Asnawiyyah',
            'X-WR-TIMEZONE:Asia/Jakarta',
            'X-WR-CALDESC:Kalender Resmi Kegiatan Santri\\, Hari Besar Islam\\, & Agenda PPTQ Asnawiyyah Demak'
        ];

        // 1. AGENDA NASIONAL & PESANTREN TAHUNAN TETAP
        const AGENDA_TETAP = [
            {
                uid: 'AGENDA_HARI_SANTRI@asnawiyyah.or.id',
                month: 10,
                day: 22,
                title: 'Hari Santri Nasional (HSN)',
                desc: 'Apel Akbar Hari Santri Nasional, Kirab Resolusi Jihad, & Refleksi Perjuangan Santri PPTQ Asnawiyyah.',
                alarmDays: 3
            },
            {
                uid: 'AGENDA_HUT_RI@asnawiyyah.or.id',
                month: 8,
                day: 17,
                title: 'HUT Kemerdekaan Republik Indonesia',
                desc: 'Upacara Bendera Kemerdekaan RI Santri & Dewan Asatidz PPTQ Asnawiyyah.',
                alarmDays: 1
            }
        ];

        AGENDA_TETAP.forEach(item => {
            const startDate = new Date(currentYear, item.month - 1, item.day);
            const endDate = new Date(currentYear, item.month - 1, item.day + 1);
            const dtStart = formatDateIcal(startDate);
            const dtEnd = formatDateIcal(endDate);

            icsLines.push('BEGIN:VEVENT');
            icsLines.push(`UID:${item.uid}`);
            icsLines.push(`DTSTAMP:${nowStamp}`);
            icsLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
            icsLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
            icsLines.push(`RRULE:FREQ=YEARLY`);
            icsLines.push(`SUMMARY:${escapeIcalText(item.title)}`);
            icsLines.push(`DESCRIPTION:${escapeIcalText(item.desc)}`);
            icsLines.push(`LOCATION:${escapeIcalText('PPTQ Asnawiyyah, Pilangwetan, Kebonagung, Demak')}`);
            icsLines.push(`URL:https://asnawiyyah.or.id/layanan/kalender`);

            // Notifikasi / Alarm H-1 atau H-3
            icsLines.push('BEGIN:VALARM');
            icsLines.push('ACTION:DISPLAY');
            icsLines.push(`DESCRIPTION:Pengingat: ${escapeIcalText(item.title)} - PPTQ Asnawiyyah`);
            icsLines.push(`TRIGGER:-P${item.alarmDays || 1}D`);
            icsLines.push('END:VALARM');

            icsLines.push('END:VEVENT');
        });

        // 2. AGENDA DINAMIS DARI DATABASE PESANTREN (JADWAL KEGIATAN)
        jadwalItems.forEach((item, index) => {
            const uid = `${item.id || ('JDW_' + index)}@asnawiyyah.or.id`;
            const title = item.kegiatan || 'Agenda Pesantren';
            const desc = `${item.deskripsi || ''}${item.waktu ? ` (Waktu: ${item.waktu})` : ''} - PPTQ Asnawiyyah`;
            const tipe = (item.tipe || 'mingguan').toLowerCase();

            // Tangani agenda mingguan berulang (e.g. Sambang Wali Santri, Ro'an Jumat, Puasa Senin-Kamis)
            if (tipe === 'mingguan') {
                const byDay = getByDayFromWaktu(item.waktu);
                if (byDay) {
                    const firstDayCode = byDay.split(',')[0];
                    const dayMap = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
                    const nextDate = getNextDayOfWeek(dayMap[firstDayCode] !== undefined ? dayMap[firstDayCode] : 0);
                    const dtStart = formatDateIcal(nextDate);
                    const dtEnd = formatDateIcal(new Date(nextDate.getTime() + 86400000));

                    icsLines.push('BEGIN:VEVENT');
                    icsLines.push(`UID:${uid}`);
                    icsLines.push(`DTSTAMP:${nowStamp}`);
                    icsLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
                    icsLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
                    icsLines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
                    icsLines.push(`SUMMARY:${escapeIcalText(title)}`);
                    icsLines.push(`DESCRIPTION:${escapeIcalText(desc)}`);
                    icsLines.push(`LOCATION:${escapeIcalText('PPTQ Asnawiyyah, Demak')}`);
                    icsLines.push(`URL:https://asnawiyyah.or.id/layanan/kalender`);

                    // Notifikasi Pengingat / Alarm Perangkat
                    const trigger = getAlarmTrigger(item.alarm);
                    if (trigger) {
                        icsLines.push('BEGIN:VALARM');
                        icsLines.push('ACTION:DISPLAY');
                        icsLines.push(`DESCRIPTION:Pengingat: ${escapeIcalText(title)} (PPTQ Asnawiyyah)`);
                        icsLines.push(`TRIGGER:${trigger}`);
                        icsLines.push('END:VALARM');
                    }

                    icsLines.push('END:VEVENT');
                }
            } 
            // Tangani agenda tahunan / periodik
            else if (tipe === 'tahunan' || tipe === 'bulanan') {
                // Buat event representatif per bulan/tahun
                const eventDate = new Date(currentYear, Math.min(11, index), 1);
                const dtStart = formatDateIcal(eventDate);
                const dtEnd = formatDateIcal(new Date(eventDate.getTime() + 86400000));

                icsLines.push('BEGIN:VEVENT');
                icsLines.push(`UID:${uid}`);
                icsLines.push(`DTSTAMP:${nowStamp}`);
                icsLines.push(`DTSTART;VALUE=DATE:${dtStart}`);
                icsLines.push(`DTEND;VALUE=DATE:${dtEnd}`);
                icsLines.push(`SUMMARY:${escapeIcalText(title)}`);
                icsLines.push(`DESCRIPTION:${escapeIcalText(desc)}`);
                icsLines.push(`LOCATION:${escapeIcalText('PPTQ Asnawiyyah, Demak')}`);
                icsLines.push(`URL:https://asnawiyyah.or.id/layanan/kalender`);

                const trigger = getAlarmTrigger(item.alarm);
                if (trigger) {
                    icsLines.push('BEGIN:VALARM');
                    icsLines.push('ACTION:DISPLAY');
                    icsLines.push(`DESCRIPTION:Pengingat: ${escapeIcalText(title)}`);
                    icsLines.push(`TRIGGER:${trigger}`);
                    icsLines.push('END:VALARM');
                }

                icsLines.push('END:VEVENT');
            }
        });

        icsLines.push('END:VCALENDAR');

        const icsContent = icsLines.join('\r\n');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="kalender-asnawiyyah.ics"');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
        res.status(200).send(icsContent);

    } catch (err) {
        console.error("Error generating iCalendar feed:", err);
        res.status(500).send("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PPTQ Asnawiyyah//Kalender//ID\r\nEND:VCALENDAR");
    }
};
