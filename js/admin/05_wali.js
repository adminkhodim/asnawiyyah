/**
 * ============================================================================
 * 05_wali.js - Data Wali Santri & Multi-Santri Mapping
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Master Akun & Identitas Wali Santri Terdaftar (Load, Render, Filter)
 *  - Mode Deteksi Santri Belum Terhubung (Unlinked) & Follow-Up WhatsApp Otomatis
 *  - Modal Detail Wali Santri & Relasi Keluarga Santri (Multi-Santri)
 *  - Hubungkan Santri Baru ke Akun Wali secara Mandiri/Manual
 *  - Pemeriksaan Izin Peran Santri & Users (applySantriRolePermissions)
 * ============================================================================
 */

        // =====================================================================
        // CONTROLLER KHUSUS: DATA WALI SANTRI & KELUARGA (MULTI-SANTRI)
        // =====================================================================
        let adminWaliList = [];
        let adminUnlinkedStudentsList = [];
        let adminWaliFilterType = 'ALL';
        let adminWaliSearchQuery = '';

        async function loadAdminWaliSantriData() {
            const loadingEl = document.getElementById('admin-wali-loading');
            const emptyEl = document.getElementById('admin-wali-empty');
            const tbody = document.getElementById('admin-wali-table-body');

            if (loadingEl) loadingEl.classList.remove('hidden');
            if (emptyEl) emptyEl.classList.add('hidden');
            if (tbody) tbody.innerHTML = '';

            try {
                const config = window.ASNAWIYYAH_CONFIG || {};
                const sbUrl = config.supabaseUrl;
                const sbKey = config.supabaseKey;

                let users = [];
                let maps = [];
                let students = [];

                if (sbUrl && sbKey) {
                    const headers = { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` };
                    
                    // 1. Ambil data wali santri dari users & wali_identities
                    try {
                        const uRes = await fetch(`${sbUrl}/rest/v1/users?role=eq.WALI_SANTRI&order=created_at.desc`, { headers });
                        if (uRes.ok) users = await uRes.json();
                    } catch (e) { console.warn('Fetch users fail:', e); }

                    // 2. Ambil data pemetaan wali ke santri
                    try {
                        const mRes = await fetch(`${sbUrl}/rest/v1/wali_santri_map?select=*`, { headers });
                        if (mRes.ok) maps = await mRes.json();
                    } catch (e) { console.warn('Fetch map fail:', e); }

                    // 3. Ambil data master santri untuk me-resolve nama & NIS anak
                    try {
                        const sRes = await fetch(`${sbUrl}/rest/v1/students?select=*`, { headers });
                        if (sRes.ok) students = await sRes.json();
                    } catch (e) { console.warn('Fetch students fail:', e); }
                }

                // Fallback jika users kosong (misal lewat authApiPost atau adminUsersList)
                if (users.length === 0 && typeof adminUsersList !== 'undefined' && adminUsersList.length > 0) {
                    users = adminUsersList.filter(u => u.role === 'WALI_SANTRI');
                }

                // Fallback master students jika dari supabase kosong/parsial
                if (!students || students.length === 0) {
                    if (typeof adminStudentsData !== 'undefined' && Array.isArray(adminStudentsData) && adminStudentsData.length > 0) {
                        students = adminStudentsData;
                    } else if (typeof window.adminStudentsData !== 'undefined' && Array.isArray(window.adminStudentsData) && window.adminStudentsData.length > 0) {
                        students = window.adminStudentsData;
                    } else {
                        try {
                            const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
                            if (cached) students = JSON.parse(cached);
                        } catch (e) {}
                    }
                }

                // Buat lookup dictionary santri
                const studentDict = {};
                (students || []).forEach(s => {
                    const sId = s.studentId || s.student_id || s.id;
                    if (sId) studentDict[sId] = s;
                    if (s.nis) studentDict[s.nis] = s;
                });

                // Pasangkan santri yang terhubung ke setiap akun wali
                adminWaliList = users.map(u => {
                    const uId = u.user_id || u.identity_id;
                    const userMaps = maps.filter(m => m.wali_id === uId);
                    const linked = userMaps.map(m => {
                        const sData = studentDict[m.student_id] || {};
                        return {
                            mapId: m.map_id,
                            studentId: m.student_id,
                            name: sData.name || sData.nama || m.student_id,
                            nis: sData.nis || sData.nisn || '',
                            kelas: sData.kelas || sData.program || '',
                            relationship: m.relationship || 'GUARDIAN'
                        };
                    });

                    return {
                        userId: uId,
                        name: u.name || 'Wali Santri',
                        email: u.email || '',
                        phone: u.phone || '',
                        status: u.status || 'ACTIVE',
                        created_at: u.created_at,
                        linkedStudents: linked,
                        studentCount: linked.length
                    };
                });

                // Kumpulkan set student ID & NIS yang sudah terhubung
                const linkedStudentIdSet = new Set();
                (maps || []).forEach(m => {
                    if (m.student_id) linkedStudentIdSet.add(String(m.student_id));
                });
                (adminWaliList || []).forEach(w => {
                    (w.linkedStudents || []).forEach(ls => {
                        if (ls.studentId) linkedStudentIdSet.add(String(ls.studentId));
                        if (ls.nis) linkedStudentIdSet.add(String(ls.nis));
                    });
                });

                // Deteksi santri aktif yang BELUM memiliki relasi ke akun wali manapun
                adminUnlinkedStudentsList = (students || []).filter(s => {
                    const sId = String(s.studentId || s.student_id || s.id || '');
                    const sNis = String(s.nis || s.nisn || '');
                    const statusRaw = String(s.status || 'ACTIVE').toUpperCase();
                    const isActive = statusRaw === 'ACTIVE' || statusRaw === 'AKTIF';
                    const isLinked = (sId && linkedStudentIdSet.has(sId)) || (sNis && linkedStudentIdSet.has(sNis));
                    return isActive && !isLinked;
                });

                // Update Metric Cards
                const totalWali = adminWaliList.length;
                const totalStudents = adminWaliList.reduce((acc, curr) => acc + curr.studentCount, 0);
                const multiWali = adminWaliList.filter(w => w.studentCount >= 2).length;
                const singleWali = adminWaliList.filter(w => w.studentCount === 1).length;
                const activeWali = adminWaliList.filter(w => w.status === 'ACTIVE').length;
                const unlinkedCount = adminUnlinkedStudentsList.length;

                const metricTotal = document.getElementById('wali-metric-total');
                const metricStudents = document.getElementById('wali-metric-students');
                const metricMulti = document.getElementById('wali-metric-multi');
                const metricActive = document.getElementById('wali-metric-active');
                const metricUnlinked = document.getElementById('wali-metric-unlinked');

                if (metricTotal) metricTotal.innerText = totalWali;
                if (metricStudents) metricStudents.innerText = totalStudents;
                if (metricMulti) metricMulti.innerText = multiWali;
                if (metricActive) metricActive.innerText = activeWali;
                if (metricUnlinked) metricUnlinked.innerText = unlinkedCount;

                const pillAll = document.getElementById('count-pill-wali-all');
                const pillMulti = document.getElementById('count-pill-wali-multi');
                const pillSingle = document.getElementById('count-pill-wali-single');
                const pillUnlinked = document.getElementById('count-pill-wali-unlinked');
                if (pillAll) pillAll.innerText = totalWali;
                if (pillMulti) pillMulti.innerText = multiWali;
                if (pillSingle) pillSingle.innerText = singleWali;
                if (pillUnlinked) pillUnlinked.innerText = unlinkedCount;

                // Render tabel
                renderAdminWaliSantriTable();
            } catch (err) {
                console.error('[LOAD WALI SANTRI ERROR]', err);
                if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-xs text-rose-500">Gagal memuat data: ${err.message}</td></tr>`;
            } finally {
                if (loadingEl) loadingEl.classList.add('hidden');
            }
        }

        function renderAdminWaliSantriTable() {
            const tbody = document.getElementById('admin-wali-table-body');
            const thead = document.getElementById('admin-wali-table-head');
            const emptyEl = document.getElementById('admin-wali-empty');
            if (!tbody) return;

            // =========================================================
            // MODE A: TAB SANTRI BELUM TERHUBUNG (PERLU FOLLOW-UP)
            // =========================================================
            if (adminWaliFilterType === 'UNLINKED') {
                if (thead) {
                    thead.innerHTML = `
                        <tr>
                            <th class="py-3 px-3.5">Santri (Belum Ada Akun)</th>
                            <th class="py-3 px-3.5">NIS & Program</th>
                            <th class="py-3 px-3.5">Kontak Wali / Orang Tua</th>
                            <th class="py-3 px-3.5 text-center">Status</th>
                            <th class="py-3 px-3.5 text-right">Aksi Follow-Up</th>
                        </tr>
                    `;
                }

                let list = adminUnlinkedStudentsList || [];

                // Search Filter pada daftar unlinked
                if (adminWaliSearchQuery) {
                    const q = adminWaliSearchQuery.toLowerCase().trim();
                    list = list.filter(s => {
                        const name = String(s.name || s.nama || '').toLowerCase();
                        const nis = String(s.nis || s.nisn || '').toLowerCase();
                        const prog = String(s.program || s.kelas || '').toLowerCase();
                        const phone = String(s.phone || s.no_hp || s.no_hp_wali || s.telepon || '').toLowerCase();
                        return name.includes(q) || nis.includes(q) || prog.includes(q) || phone.includes(q);
                    });
                }

                if (list.length === 0) {
                    tbody.innerHTML = '';
                    if (emptyEl) {
                        emptyEl.classList.remove('hidden');
                        emptyEl.innerHTML = `
                            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-lg">
                                <i class="fa-solid fa-circle-check"></i>
                            </div>
                            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">Semua Santri Sudah Terhubung! 🎉</h4>
                            <p class="text-[10px] text-slate-400 max-w-xs mx-auto">Alhamdulillah, seluruh wali dari santri aktif telah mengaktifkan atau terhubung ke akun portal wali santri.</p>
                        `;
                    }
                    return;
                }

                if (emptyEl) emptyEl.classList.add('hidden');

                tbody.innerHTML = list.map((s, idx) => {
                    const id = s.studentId || s.student_id || s.id || '';
                    const name = s.name || s.nama || 'Santri';
                    const safeName = escapeUserHtml(name);
                    const nis = s.nis || s.nisn || '-';
                    const safeNis = escapeUserHtml(nis);
                    const prog = s.program || s.kelas || 'Reguler';
                    const gender = (s.gender || 'L').toUpperCase() === 'P' ? 'Putri' : 'Putra';
                    const photoUrl = s.photoUrl || s.photo_url || '';
                    const rawPhone = String(s.phone || s.no_hp || s.no_hp_wali || s.telepon || s.waliPhone || '').replace(/[^0-9]/g, '');
                    const safePhone = escapeUserHtml(rawPhone || '');
                    const initial = (name || 'S').charAt(0).toUpperCase();

                    const avatarHtml = photoUrl
                        ? `<img src="${escapeHtml(photoUrl)}" alt="${safeName}" class="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-[#253447] shadow-xs" onerror="this.onerror=null;this.src='';this.className='hidden';">`
                        : `<div class="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">${initial}</div>`;

                    return `
                        <tr class="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition">
                            <!-- Santri Info -->
                            <td class="py-3 px-3.5 align-middle">
                                <div class="flex items-center space-x-2.5">
                                    ${avatarHtml}
                                    <div class="min-w-0">
                                        <div class="font-bold text-slate-800 dark:text-slate-100 truncate">${safeName}</div>
                                        <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                            <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold ${gender === 'Putri' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'}">${gender}</span>
                                            <span>•</span>
                                            <span>ID: ${escapeUserHtml(id)}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <!-- NIS & Program -->
                            <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                                <div class="font-mono font-bold text-emerald-700 dark:text-emerald-400">${safeNis}</div>
                                <div class="text-[10px] text-slate-400 mt-0.5">${escapeUserHtml(prog)}</div>
                            </td>

                            <!-- Kontak Wali -->
                            <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                                ${rawPhone ? `
                                    <div class="flex items-center space-x-1.5">
                                        <span class="font-mono text-slate-700 dark:text-slate-200 font-medium">${safePhone}</span>
                                        <button type="button" onclick="sendWaliFollowupWhatsApp('${escapeUserHtml(id)}', '${safeName.replace(/'/g, "\\'")}', '${safeNis.replace(/'/g, "\\'")}', '${safePhone}')" class="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-400 flex items-center justify-center text-xs transition active:scale-95" title="Kirim Follow-Up WhatsApp">
                                            <i class="fa-brands fa-whatsapp"></i>
                                        </button>
                                    </div>
                                ` : `
                                    <button type="button" onclick="sendWaliFollowupWhatsApp('${escapeUserHtml(id)}', '${safeName.replace(/'/g, "\\'")}', '${safeNis.replace(/'/g, "\\'")}', '')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:bg-[#1c2836] dark:hover:bg-emerald-950/40 dark:text-slate-400 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-[#253447] transition active:scale-95" title="Input nomor WA & follow-up">
                                        <i class="fa-brands fa-whatsapp text-emerald-500"></i>
                                        <span>Input WA & Chat</span>
                                    </button>
                                `}
                            </td>

                            <!-- Status Aktivasi -->
                            <td class="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                    <span>Belum Terhubung</span>
                                </span>
                            </td>

                            <!-- Aksi Follow-Up & Hubungkan -->
                            <td class="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                                <div class="flex items-center justify-end space-x-1.5">
                                    <button type="button" onclick="sendWaliFollowupWhatsApp('${escapeUserHtml(id)}', '${safeName.replace(/'/g, "\\'")}', '${safeNis.replace(/'/g, "\\'")}', '${safePhone}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shadow-xs active:scale-95" title="Kirim pesan WhatsApp ajakan aktivasi">
                                        <i class="fa-brands fa-whatsapp text-xs"></i>
                                        <span>Follow-Up WA</span>
                                    </button>
                                    <button type="button" onclick="openAdminConnectStudentModal('', '', '${escapeUserHtml(id)}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1c2836] dark:hover:bg-[#253447] dark:text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 active:scale-95" title="Tautkan manual ke akun wali">
                                        <i class="fa-solid fa-link text-[9px]"></i>
                                        <span>Hubungkan</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
                return;
            }

            // =========================================================
            // MODE B: TAB DAFTAR WALI SANTRI TERDAFTAR (ALL / MULTI / SINGLE)
            // =========================================================
            if (thead) {
                thead.innerHTML = `
                    <tr>
                        <th class="py-3 px-3.5">Wali Santri</th>
                        <th class="py-3 px-3.5">WhatsApp / HP</th>
                        <th class="py-3 px-3.5">Santri Terhubung (Anak Asuhan)</th>
                        <th class="py-3 px-3.5 text-center">Status</th>
                        <th class="py-3 px-3.5 text-right">Aksi</th>
                    </tr>
                `;
            }

            let list = adminWaliList || [];

            // Filter Pill Type
            if (adminWaliFilterType === 'MULTI') {
                list = list.filter(w => w.studentCount >= 2);
            } else if (adminWaliFilterType === 'SINGLE') {
                list = list.filter(w => w.studentCount === 1);
            }

            // Search Filter
            if (adminWaliSearchQuery) {
                const q = adminWaliSearchQuery.toLowerCase().trim();
                list = list.filter(w => {
                    const matchWali = String(w.name || '').toLowerCase().includes(q) ||
                                      String(w.email || '').toLowerCase().includes(q) ||
                                      String(w.phone || '').toLowerCase().includes(q) ||
                                      String(w.userId || '').toLowerCase().includes(q);
                    const matchStudent = (w.linkedStudents || []).some(s => 
                        String(s.name || '').toLowerCase().includes(q) ||
                        String(s.nis || '').toLowerCase().includes(q)
                    );
                    return matchWali || matchStudent;
                });
            }

            if (list.length === 0) {
                tbody.innerHTML = '';
                if (emptyEl) {
                    emptyEl.classList.remove('hidden');
                    emptyEl.innerHTML = `
                        <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1c2836] text-slate-400 flex items-center justify-center mx-auto text-lg">
                            <i class="fa-solid fa-users-slash"></i>
                        </div>
                        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">Tidak Ada Data Wali Santri</h4>
                        <p class="text-[10px] text-slate-400 max-w-xs mx-auto">Silakan sesuaikan kata kunci pencarian atau hubungkan santri baru.</p>
                    `;
                }
                return;
            }

            if (emptyEl) emptyEl.classList.add('hidden');

            const relationshipLabels = {
                'MOTHER': 'Ibu',
                'FATHER': 'Ayah',
                'GUARDIAN': 'Wali'
            };

            tbody.innerHTML = list.map(w => {
                const initial = (w.name || 'W').charAt(0).toUpperCase();
                const safeName = escapeUserHtml(w.name || 'Wali Santri');
                const safeEmail = escapeUserHtml(w.email || '-');
                const rawPhone = String(w.phone || '').replace(/[^0-9]/g, '');
                
                // Format nomor WhatsApp untuk direct link
                let waLink = '';
                let waDisplay = '-';
                if (rawPhone) {
                    let formattedPhone = rawPhone;
                    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.substring(1);
                    else if (!formattedPhone.startsWith('62')) formattedPhone = '62' + formattedPhone;
                    waLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Assalamu'alaikum Wr. Wb. Bapak/Ibu ${w.name}, kami dari Sekretariat PPTQ Asnawiyyah...`)}`;
                    waDisplay = rawPhone;
                }

                // Render badge anak-anak yang terhubung
                let studentsHtml = '';
                if (w.linkedStudents && w.linkedStudents.length > 0) {
                    const isMulti = w.linkedStudents.length >= 2;
                    const multiBadge = isMulti ? `
                        <div class="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 shadow-2xs">
                            <i class="fa-solid fa-people-arrows text-[8px]"></i>
                            <span>${w.linkedStudents.length} Santri (Kakak-Beradik)</span>
                        </div>
                    ` : '';

                    const chips = w.linkedStudents.map((s) => {
                        const rel = relationshipLabels[s.relationship] || s.relationship || 'Wali';
                        const nisStr = s.nis ? `<span class="text-slate-400 font-normal">(${escapeUserHtml(s.nis)})</span>` : '';
                        return `
                            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                                <i class="fa-solid fa-user-graduate text-[9px] text-emerald-600"></i>
                                <span class="font-bold">${escapeUserHtml(s.name)}</span>
                                ${nisStr}
                                <span class="px-1 py-0.2 rounded bg-white dark:bg-emerald-900 text-[8px] font-extrabold text-emerald-700 dark:text-emerald-200">${rel}</span>
                            </div>
                        `;
                    }).join(' ');

                    studentsHtml = `
                        <div class="flex flex-col items-start gap-1">
                            ${multiBadge}
                            <div class="flex flex-wrap gap-1">
                                ${chips}
                            </div>
                        </div>
                    `;
                } else {
                    studentsHtml = `
                        <span class="inline-flex items-center gap-1 text-[10px] text-slate-400 italic">
                            <i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Belum ada santri terhubung
                        </span>
                    `;
                }

                return `
                    <tr class="hover:bg-slate-50/70 dark:hover:bg-[#1a2533]/50 transition">
                        <!-- Profil Wali -->
                        <td class="py-3 px-3.5 align-middle">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    ${initial}
                                </div>
                                <div class="min-w-0">
                                    <div class="font-bold text-slate-800 dark:text-slate-100 truncate">${safeName}</div>
                                    <div class="text-[10px] text-slate-400 truncate">${safeEmail}</div>
                                </div>
                            </div>
                        </td>

                        <!-- WhatsApp / HP -->
                        <td class="py-3 px-3.5 align-middle whitespace-nowrap">
                            ${rawPhone ? `
                                <div class="flex items-center space-x-1.5">
                                    <span class="font-mono text-slate-700 dark:text-slate-200 font-medium">${escapeUserHtml(waDisplay)}</span>
                                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-400 flex items-center justify-center text-xs transition" title="Kirim Pesan WhatsApp">
                                        <i class="fa-brands fa-whatsapp"></i>
                                    </a>
                                </div>
                            ` : `<span class="text-slate-400 italic">-</span>`}
                        </td>

                        <!-- Santri Terhubung -->
                        <td class="py-3 px-3.5 align-middle">
                            ${studentsHtml}
                        </td>

                        <!-- Status Akun -->
                        <td class="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Aktif</span>
                            </span>
                        </td>

                        <!-- Aksi -->
                        <td class="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                            <div class="flex items-center justify-end space-x-1">
                                <button type="button" onclick="openAdminConnectStudentModal('${w.userId}', '${safeName.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 active:scale-95" title="Hubungkan Santri Baru ke Wali Ini">
                                    <i class="fa-solid fa-plus text-[9px]"></i>
                                    <span>Tambah Anak</span>
                                </button>
                                ${rawPhone ? `
                                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-[#1c2836] rounded-lg transition" title="Chat WhatsApp">
                                        <i class="fa-brands fa-whatsapp text-sm text-emerald-500"></i>
                                    </a>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function handleAdminWaliSearch(query) {
            adminWaliSearchQuery = query || '';
            renderAdminWaliSantriTable();
        }

        function setAdminWaliFilter(filterType) {
            adminWaliFilterType = filterType || 'ALL';

            const btnAll = document.getElementById('filter-wali-all');
            const btnMulti = document.getElementById('filter-wali-multi');
            const btnSingle = document.getElementById('filter-wali-single');
            const btnUnlinked = document.getElementById('filter-wali-unlinked');

            [btnAll, btnMulti, btnSingle].forEach(b => {
                if (!b) return;
                b.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-600 dark:text-slate-300 transition';
            });
            if (btnUnlinked) {
                btnUnlinked.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 transition inline-flex items-center gap-1.5';
            }

            if (filterType === 'MULTI' && btnMulti) {
                btnMulti.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white shadow-xs transition';
            } else if (filterType === 'SINGLE' && btnSingle) {
                btnSingle.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white shadow-xs transition';
            } else if (filterType === 'UNLINKED' && btnUnlinked) {
                btnUnlinked.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white shadow-xs border border-transparent transition inline-flex items-center gap-1.5';
            } else if (btnAll) {
                btnAll.className = 'px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white shadow-xs transition';
            }

            renderAdminWaliSantriTable();
        }

        /**
         * Kirim Template Pesan WhatsApp Follow-Up Aktivasi ke Wali Santri
         */
        function sendWaliFollowupWhatsApp(studentId, studentName, studentNis, existingPhone = '') {
            let phone = existingPhone ? String(existingPhone).replace(/[^0-9]/g, '') : '';
            if (!phone) {
                const input = prompt(`Masukkan nomor WhatsApp Orang Tua / Wali dari ananda ${studentName} (contoh: 081234567890):`);
                if (!input) return;
                phone = input.replace(/[^0-9]/g, '');
            }

            if (!phone) {
                if (typeof showToast === 'function') showToast('Nomor WhatsApp tidak valid.');
                return;
            }

            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            else if (!phone.startsWith('62')) phone = '62' + phone;

            const message = `Assalamu'alaikum Wr. Wb.\n` +
                `Yth. Bapak/Ibu Wali dari ananda *${studentName}* (NIS: *${studentNis || '-'}*), PPTQ Asnawiyyah Pilangwetan.\n\n` +
                `Mengingat seluruh layanan perizinan santri (keluar pondok/pulang), presensi kegiatan, dan mutaba'ah santri kini dilakukan secara terpadu melalui *Aplikasi PPTQ Asnawiyyah*, kami mengimbau Bapak/Ibu untuk segera mengaktifkan Akun Wali Santri.\n\n` +
                `📱 *Tautan Akses Aplikasi:* https://asnawiyyah.or.id/\n\n` +
                `*Panduan Singkat Aktivasi:*\n` +
                `1. Buka tautan di atas melalui browser HP\n` +
                `2. Pilih tombol *Login Wali Santri*\n` +
                `3. Masukkan NIS ananda: *${studentNis || '-'}*\n` +
                `4. Buat PIN pengaman akun dan ikuti langkah di layar\n\n` +
                `Bila Bapak/Ibu memerlukan bantuan teknis, silakan langsung membalas pesan ini.\n\n` +
                `Jazakumullah khairan katsiran.\nWassalamu'alaikum Wr. Wb.\n` +
                `_Pengurus PPTQ Asnawiyyah Pilangwetan_`;

            const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
        }

        async function openAdminConnectStudentModal(targetWaliId = '', targetWaliName = '', targetStudentId = '') {
            const modal = document.getElementById('modal-admin-connect-student');
            const waliSelect = document.getElementById('connect-wali-select');
            const studentSelect = document.getElementById('connect-student-select');
            const alertBox = document.getElementById('connect-student-alert');
            if (alertBox) alertBox.classList.add('hidden');

            if (waliSelect) {
                waliSelect.innerHTML = '<option value="">-- Pilih Akun Wali Santri --</option>' +
                    adminWaliList.map(w => `<option value="${w.userId}" ${w.userId === targetWaliId ? 'selected' : ''}>${escapeUserHtml(w.name)} (${escapeUserHtml(w.phone || w.email || '-')})</option>`).join('');
            }

            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">Memuat data santri...</option>';
                let students = [];
                if (typeof adminStudentsData !== 'undefined' && Array.isArray(adminStudentsData) && adminStudentsData.length > 0) {
                    students = adminStudentsData;
                } else if (typeof window.adminStudentsData !== 'undefined' && Array.isArray(window.adminStudentsData) && window.adminStudentsData.length > 0) {
                    students = window.adminStudentsData;
                } else {
                    try {
                        const cached = localStorage.getItem('ASNAWIYYAH_STUDENTS_CACHE');
                        if (cached) students = JSON.parse(cached);
                    } catch (e) {}
                    if (!students || students.length === 0) {
                        try {
                            const config = window.ASNAWIYYAH_CONFIG || {};
                            const headers = { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` };
                            const sRes = await fetch(`${config.supabaseUrl}/rest/v1/students?select=*&order=name.asc`, { headers });
                            if (sRes.ok) students = await sRes.json();
                        } catch (e) {}
                    }
                    if (!students || students.length === 0) {
                        try {
                            if (typeof apiGet === 'function') {
                                const resp = await apiGet('getStudents');
                                if (resp && (resp.data || resp.students)) students = resp.data || resp.students;
                            }
                        } catch (e) {}
                    }
                }

                studentSelect.innerHTML = '<option value="">-- Pilih Santri dari Database --</option>' +
                    (students || []).map(s => {
                        const sId = s.studentId || s.student_id;
                        const sName = s.name || s.nama || 'Tanpa Nama';
                        const sNis = s.nis || s.nisn || '-';
                        const sProg = s.program || s.kelas || '-';
                        const isSelected = String(sId) === String(targetStudentId) ? 'selected' : '';
                        return `<option value="${sId}" ${isSelected}>${escapeUserHtml(sName)} (NIS: ${escapeUserHtml(sNis)}) - ${escapeUserHtml(sProg)}</option>`;
                    }).join('');

                if (targetStudentId) {
                    studentSelect.value = targetStudentId;
                }
            }

            if (modal) modal.classList.remove('hidden');
        }

        function closeAdminConnectStudentModal() {
            const modal = document.getElementById('modal-admin-connect-student');
            if (modal) modal.classList.add('hidden');
        }

        async function handleSaveConnectStudent(e) {
            e.preventDefault();
            const btn = document.getElementById('btn-save-connect-student');
            const alertBox = document.getElementById('connect-student-alert');
            const alertText = document.getElementById('connect-student-alert-text');
            const waliSelect = document.getElementById('connect-wali-select');
            const studentSelect = document.getElementById('connect-student-select');
            const relSelect = document.getElementById('connect-relationship-select');

            const waliId = waliSelect ? waliSelect.value : '';
            const studentId = studentSelect ? studentSelect.value : '';
            const relationship = relSelect ? relSelect.value : 'GUARDIAN';

            if (!waliId || !studentId) {
                if (alertBox && alertText) {
                    alertText.innerText = 'Pilih Wali Santri dan Santri terlebih dahulu.';
                    alertBox.classList.remove('hidden');
                }
                return;
            }

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Menghubungkan...</span>`;
            }
            if (alertBox) alertBox.classList.add('hidden');

            try {
                const config = window.ASNAWIYYAH_CONFIG || {};
                const sbUrl = config.supabaseUrl;
                const sbKey = config.supabaseKey;

                if (!sbUrl || !sbKey) throw new Error('Konfigurasi database Supabase tidak ditemukan.');

                const headers = {
                    'apikey': sbKey,
                    'Authorization': `Bearer ${sbKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                };

                const nowIso = new Date().toISOString();
                const mapId = `MAP_${waliId.replace(/[^a-zA-Z0-9]/g, '')}_${studentId.replace(/[^a-zA-Z0-9]/g, '')}`;

                const res = await fetch(`${sbUrl}/rest/v1/wali_santri_map`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        map_id: mapId,
                        wali_id: waliId,
                        student_id: studentId,
                        relationship: relationship,
                        status: 'VERIFIED',
                        created_at: nowIso
                    })
                });

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || `Gagal menyimpan pemetaan santri (${res.status})`);
                }

                closeAdminConnectStudentModal();
                if (typeof showToast === 'function') {
                    showToast('Santri berhasil dihubungkan ke akun Wali Santri!');
                }
                await loadAdminWaliSantriData();
            } catch (err) {
                if (alertBox && alertText) {
                    alertText.innerText = err.message || 'Terjadi kesalahan saat menghubungkan santri.';
                    alertBox.classList.remove('hidden');
                }
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-check text-xs"></i><span>Hubungkan Santri</span>`;
                }
            }
        }

        // Window exports
        window.loadAdminWaliSantriData = loadAdminWaliSantriData;
        window.renderAdminWaliSantriTable = renderAdminWaliSantriTable;
        window.handleAdminWaliSearch = handleAdminWaliSearch;
        window.setAdminWaliFilter = setAdminWaliFilter;
        window.openAdminConnectStudentModal = openAdminConnectStudentModal;
        window.closeAdminConnectStudentModal = closeAdminConnectStudentModal;
        window.handleSaveConnectStudent = handleSaveConnectStudent;
        window.sendWaliFollowupWhatsApp = sendWaliFollowupWhatsApp;

        // Jadwal Kegiatan exports
        window.loadJadwalKegiatan = loadJadwalKegiatan;
        window.renderPublicJadwalKegiatan = renderPublicJadwalKegiatan;
        window.renderAdminJadwalKegiatanList = renderAdminJadwalKegiatanList;
        window.setAdminJadwalFilter = setAdminJadwalFilter;
        window.filterAdminJadwalKegiatanList = filterAdminJadwalKegiatanList;
        window.openAdminJadwalKegiatanModal = openAdminJadwalKegiatanModal;
        window.closeAdminJadwalKegiatanModal = closeAdminJadwalKegiatanModal;
        window.submitAdminJadwalKegiatan = submitAdminJadwalKegiatan;
        window.toggleAdminJadwalKegiatanStatus = toggleAdminJadwalKegiatanStatus;
        window.deleteAdminJadwalKegiatan = deleteAdminJadwalKegiatan;

        // Admin News Inline Image Modal exports
        window.openAdminNewsInlineImageModal = openAdminNewsInlineImageModal;
        window.closeAdminNewsInlineImageModal = closeAdminNewsInlineImageModal;
        window.handleAdminNewsInlineFileSelect = handleAdminNewsInlineFileSelect;
        window.setAdminNewsInlineCropRatio = setAdminNewsInlineCropRatio;
        window.confirmInsertInlineImageToEditor = confirmInsertInlineImageToEditor;

        /**
         * Terapkan Hak Akses Izin Role pada Antarmuka Master Data Santri
         */
        function applySantriRolePermissions(roleKey = null) {
            const canCreate = typeof window.hasPermission === 'function' ? window.hasPermission('santri.create', roleKey) : true;
            
            // Tombol Tambah Santri di header modul
            const addBtn = document.querySelector('button[onclick*="openAdminStudentModal()"]');
            if (addBtn) {
                if (canCreate) {
                    addBtn.classList.remove('hidden');
                    if (addBtn.style.display === 'none') addBtn.style.display = '';
                } else {
                    addBtn.classList.add('hidden');
                    addBtn.style.display = 'none';
                }
            }
        }

        /**
         * Terapkan Hak Akses Izin Role pada Antarmuka Manajemen Pengguna
         */
        function applyUsersRolePermissions(roleKey = null) {
            const canManage = typeof window.hasPermission === 'function' ? window.hasPermission('users.manage', roleKey) : true;

            // Tombol Tambah Pengguna di header modul
            const addBtn = document.querySelector('button[onclick*="openAdminUserModal()"]');
            if (addBtn) {
                if (canManage) {
                    addBtn.classList.remove('hidden');
                    if (addBtn.style.display === 'none') addBtn.style.display = '';
                } else {
                    addBtn.classList.add('hidden');
                    addBtn.style.display = 'none';
                }
            }
        }

        window.applySantriRolePermissions = applySantriRolePermissions;
        window.applyUsersRolePermissions = applyUsersRolePermissions;

