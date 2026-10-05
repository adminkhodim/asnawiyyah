const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'js', 'tahfidz.js');
let content = fs.readFileSync(targetPath, 'utf8');

const target = `const TAHFIDZ_STORAGE_KEYS = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.storage && APP_CONFIG.storage.keys)
    ? APP_CONFIG.storage.keys
    : {
        adminToken: 'asnawiyyah_admin_token',
        parentToken: 'asnawiyyah_parent_token',
        pengasuhToken: 'asnawiyyah_pengasuh_token'
    };`;

const addition = `
// Urutan Kurikulum Tahfidz Pesantren (Mulai Juz 30 s/d 21, lalu Juz 1 s/d 20)
const TAHFIDZ_CURRICULUM_JUZ_ORDER = [
    30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(target) && !content.includes('TAHFIDZ_CURRICULUM_JUZ_ORDER')) {
    content = content.replace(target, target + addition);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('[SUCCESS] TAHFIDZ_CURRICULUM_JUZ_ORDER added to js/tahfidz.js');
} else {
    console.log('[INFO] Already present or target not found');
}
