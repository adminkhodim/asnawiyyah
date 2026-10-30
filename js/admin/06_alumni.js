/**
 * ============================================================================
 * 06_alumni.js - Rekapitulasi Data Alumni (Hasanah) & Initializer
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - Rekap Master Data Alumni Hasanah (Load, Render Tabel, Filter Tahun/Status)
 *  - Modal Tambah & Edit Data Alumni
 *  - Ekspor Data Alumni ke Excel
 *  - Window Export Finalizer & Auto-Initialize DOM Ready Analytics
 * ============================================================================
 */

        // =========================================================================
        // MODUL REKAP DATA ALUMNI (HASANAH) - CONTROLLER ADMIN
        // =========================================================================
        let adminAlumniData = [];

        /**
         * Memuat seluruh data master alumni dari Supabase Cloud DB (<50ms) dengan fallback GAS
         */
        async function loadAdminAlumniData() {
            const loader = document.getElementById('admin-alumni-loader');
            const tbody = document.getElementById('admin-alumni-table-tbody');
            const mobileList = document.getElementById('admin-alumni-mobile-list');
            const emptyState = document.getElementById('admin-alumni-empty-state');

            if (loader) loader.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('hidden');

            try {
                let response = null;
                if (typeof apiGet === 'function') {
                    response = await apiGet('alumni.getAll');
                }

                const list = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
                adminAlumniData = list;

                // Update Hub Count Badge
                const hubBadge = document.getElementById('admin-hub-alumni-count');
                if (hubBadge) {
                    hubBadge.innerText = `${adminAlumniData.length} Alumni`;
                }

                // Kalkulasi KPI Metrik
                const totalCount = adminAlumniData.length;
                const kerjaCount = adminAlumniData.filter(a => {
                    const k = (a.kesibukan || '').toLowerCase();
                    return k.includes('kerja') || k.includes('usaha') || k.includes('bisnis') || k.includes('wirausaha');
                }).length;
                const kuliahCount = adminAlumniData.filter(a => {
                    const k = (a.kesibukan || '').toLowerCase();
                    return k.includes('kuliah') || k.includes('mahasiswa') || k.includes('studi') || k.includes('pesantren');
                }).length;
                const izinCount = adminAlumniData.filter(a => (a.izin_publikasi || '').toLowerCase() === 'ya').length;

                const totalEl = document.getElementById('admin-alumni-stat-total');
                const kerjaEl = document.getElementById('admin-alumni-stat-kerja');
                const kuliahEl = document.getElementById('admin-alumni-stat-kuliah');
                const izinEl = document.getElementById('admin-alumni-stat-izin');

                if (totalEl) totalEl.innerText = totalCount;
                if (kerjaEl) kerjaEl.innerText = kerjaCount;
                if (kuliahEl) kuliahEl.innerText = kuliahCount;
                if (izinEl) izinEl.innerText = izinCount;

                // Populasi Dropdown Filter Angkatan
                populateAdminAlumniFilterAngkatan();

                // Filter & Render
                filterAdminAlumniList();

            } catch (err) {
                console.error("Gagal load data alumni:", err);
                if (typeof showToast === 'function') {
                    showToast("❌ Gagal memuat data alumni: " + (err.message || "Periksa jaringan Anda"));
                }
                if (emptyState) emptyState.classList.remove('hidden');
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }

        /**
         * Mengisi opsi pilihan filter angkatan / tahun lulus secara dinamis
         */
        function populateAdminAlumniFilterAngkatan() {
            const select = document.getElementById('admin-alumni-filter-angkatan');
            if (!select) return;

            const currentVal = select.value;
            const yearsSet = new Set();
            adminAlumniData.forEach(a => {
                if (a.tahun_lulus && String(a.tahun_lulus).trim() !== "") {
                    yearsSet.add(String(a.tahun_lulus).trim());
                } else if (a.tahun_masuk && String(a.tahun_masuk).trim() !== "") {
                    yearsSet.add(String(a.tahun_masuk).trim());
                }
            });

            const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
            
            let html = '<option value="all">Semua Angkatan</option>';
            sortedYears.forEach(yr => {
                html += `<option value="${yr}">Angkatan ${yr}</option>`;
            });
            select.innerHTML = html;
            if (yearsSet.has(currentVal)) {
                select.value = currentVal;
            }
        }

        /**
         * Memfilter daftar alumni berdasarkan kata kunci, angkatan, kesibukan, dan izin publikasi
         */
        function filterAdminAlumniList() {
            const searchInput = document.getElementById('admin-alumni-search');
            const angkatanSelect = document.getElementById('admin-alumni-filter-angkatan');
            const kesibukanSelect = document.getElementById('admin-alumni-filter-kesibukan');
            const izinSelect = document.getElementById('admin-alumni-filter-izin');

            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const angkatanVal = angkatanSelect ? angkatanSelect.value : 'all';
            const kesibukanVal = kesibukanSelect ? kesibukanSelect.value : 'all';
            const izinVal = izinSelect ? izinSelect.value : 'all';

            const filtered = adminAlumniData.filter(item => {
                // Filter Pencarian Teks
                if (query) {
                    const matchNama = (item.nama_lengkap || item.nama || '').toLowerCase().includes(query);
                    const matchWa = (item.no_whatsapp || '').toLowerCase().includes(query);
                    const matchInstansi = (item.instansi_perusahaan || '').toLowerCase().includes(query);
                    const matchKab = (item.kabupaten || '').toLowerCase().includes(query);
                    const matchProv = (item.provinsi || '').toLowerCase().includes(query);
                    const matchAlamat = (item.alamat_lengkap || '').toLowerCase().includes(query);
                    if (!matchNama && !matchWa && !matchInstansi && !matchKab && !matchProv && !matchAlamat) {
                        return false;
                    }
                }

                // Filter Angkatan
                if (angkatanVal !== 'all') {
                    const thnLulus = String(item.tahun_lulus || '').trim();
                    const thnMasuk = String(item.tahun_masuk || '').trim();
                    if (thnLulus !== angkatanVal && thnMasuk !== angkatanVal) {
                        return false;
                    }
                }

                // Filter Kesibukan
                if (kesibukanVal !== 'all') {
                    const k = (item.kesibukan || '').toLowerCase();
                    if (kesibukanVal === 'Kuliah' && !k.includes('kuliah') && !k.includes('mahasiswa') && !k.includes('studi')) return false;
                    if (kesibukanVal === 'Bekerja' && !k.includes('kerja') && !k.includes('karyawan') && !k.includes('pegawai')) return false;
                    if (kesibukanVal === 'Wirausaha' && !k.includes('usaha') && !k.includes('bisnis') && !k.includes('wirausaha')) return false;
                    if (kesibukanVal === 'Khidmat' && !k.includes('khidmat') && !k.includes('ajar') && !k.includes('santri')) return false;
                }

                // Filter Izin Publikasi
                if (izinVal !== 'all') {
                    const iz = (item.izin_publikasi || '').toLowerCase();
                    if (izinVal.toLowerCase() !== iz) return false;
                }

                return true;
            });

            renderAdminAlumniTable(filtered);
        }

        /**
         * Merender data alumni ke tampilan tabel desktop & kartu responsif mobile
         */
        function renderAdminAlumniTable(list) {
            const tbody = document.getElementById('admin-alumni-table-tbody');
            const mobileList = document.getElementById('admin-alumni-mobile-list');
            const emptyState = document.getElementById('admin-alumni-empty-state');

            if (!tbody || !mobileList) return;

            if (!list || list.length === 0) {
                tbody.innerHTML = '';
                mobileList.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            const colors = ['emerald', 'blue', 'amber', 'purple', 'teal'];

            // 1. Render Desktop Table
            let tableHtml = '';
            list.forEach((item, index) => {
                const color = colors[index % colors.length];
                const nama = item.nama_lengkap || item.nama || 'Alumni';
                const inisial = (nama.split(' ').map(w => w[0]).slice(0, 2).join('') || nama.substring(0, 2)).toUpperCase();
                
                let fotoUrl = item.foto && String(item.foto).trim() !== "" ? item.foto : null;
                if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                    const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (idMatch && idMatch[1]) fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                }

                const avatarHtml = fotoUrl
                    ? `<img src="${fotoUrl}" alt="${escapeHtml(nama)}" loading="lazy" onerror="this.outerHTML='<div class=\'w-8 h-8 rounded-full bg-${color}-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs\'>${inisial}</div>'" class="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-[#253447] shadow-xs">`
                    : `<div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">${inisial}</div>`;

                const gender = (item.jenis_kelamin || '').toLowerCase().includes('perempuan') ? 'P' : 'L';
                const genderBadgeClass = gender === 'P' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
                
                const angkatan = item.tahun_lulus ? `Lulus ${item.tahun_lulus}` : (item.tahun_masuk ? `Masuk ${item.tahun_masuk}` : '-');
                const program = item.program_terakhir || 'Reguler';
                const kesibukan = item.kesibukan || '-';
                const instansi = item.instansi_perusahaan || '-';
                const domisili = [item.kabupaten, item.provinsi].filter(Boolean).join(', ') || item.alamat_lengkap || '-';
                
                const isIzin = (item.izin_publikasi || '').toLowerCase() === 'ya';
                const izinBadge = isIzin 
                    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"><i class="fa-solid fa-check text-[9px] mr-1"></i> Ya</span>`
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Privat</span>`;

                tableHtml += `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-[#1c2836]/60 transition">
                        <td class="py-3 px-3.5 text-center font-bold text-slate-400">${index + 1}</td>
                        <td class="py-3 px-4">
                            <div class="flex items-center space-x-2.5">
                                ${avatarHtml}
                                <div class="min-w-0">
                                    <div class="flex items-center space-x-1.5">
                                        <span class="font-bold text-slate-800 dark:text-slate-100 truncate block max-w-[170px]">${escapeHtml(nama)}</span>
                                        <span class="text-[9px] font-black px-1.5 py-0.2 rounded-md ${genderBadgeClass}">${gender}</span>
                                    </div>
                                    <p class="text-[11px] text-slate-400 truncate max-w-[170px]">${escapeHtml(item.no_whatsapp || '-')}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-4">
                            <span class="font-bold text-emerald-700 dark:text-emerald-400 block">${escapeHtml(angkatan)}</span>
                            <span class="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[150px]">${escapeHtml(program)}</span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="font-semibold text-slate-700 dark:text-slate-200 block">${escapeHtml(kesibukan)}</span>
                            <span class="text-[11px] text-slate-400 truncate block max-w-[150px]">${escapeHtml(instansi)}</span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[170px]" title="${escapeHtml(domisili)}">${escapeHtml(domisili)}</span>
                        </td>
                        <td class="py-3 px-3 text-center">
                            ${izinBadge}
                        </td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex items-center justify-center space-x-1.5">
                                <button type="button" onclick="showAdminAlumniDetail('${item.id}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 shadow-2xs" title="Lihat detail profil & peta">
                                    <i class="fa-solid fa-eye text-[10px]"></i>
                                    <span>Detail</span>
                                </button>
                                <button type="button" onclick="deleteAdminAlumni('${item.id}', '${escapeHtml(nama)}')" class="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-lg transition flex items-center justify-center shadow-2xs" title="Hapus data alumni">
                                    <i class="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = tableHtml;

            // 2. Render Mobile Card List
            let mobileHtml = '';
            list.forEach((item, index) => {
                const nama = item.nama_lengkap || item.nama || 'Alumni';
                const inisial = (nama.split(' ').map(w => w[0]).slice(0, 2).join('') || nama.substring(0, 2)).toUpperCase();
                
                let fotoUrl = item.foto && String(item.foto).trim() !== "" ? item.foto : null;
                if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                    const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (idMatch && idMatch[1]) fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                }

                const avatarHtml = fotoUrl
                    ? `<img src="${fotoUrl}" alt="${escapeHtml(nama)}" loading="lazy" class="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 dark:border-[#253447] shadow-xs">`
                    : `<div class="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">${inisial}</div>`;

                const angkatan = item.tahun_lulus ? `Lulus ${item.tahun_lulus}` : (item.tahun_masuk ? `Masuk ${item.tahun_masuk}` : '-');
                const kesibukan = item.kesibukan || '-';
                const instansi = item.instansi_perusahaan ? ` • ${item.instansi_perusahaan}` : '';
                const domisili = [item.kabupaten, item.provinsi].filter(Boolean).join(', ') || '-';

                mobileHtml += `
                    <div class="bg-white dark:bg-[#15202d] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-3">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center space-x-3">
                                ${avatarHtml}
                                <div>
                                    <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${escapeHtml(nama)}</h4>
                                    <p class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">${escapeHtml(angkatan)} • ${escapeHtml(item.program_terakhir || 'Reguler')}</p>
                                </div>
                            </div>
                            <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full ${item.izin_publikasi === 'Ya' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                                ${item.izin_publikasi === 'Ya' ? 'Publik' : 'Privat'}
                            </span>
                        </div>
                        <div class="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-[#1c2836] p-2.5 rounded-xl">
                            <p><i class="fa-solid fa-briefcase text-slate-400 w-4 text-center mr-1"></i> <span class="font-semibold">${escapeHtml(kesibukan)}</span>${escapeHtml(instansi)}</p>
                            <p><i class="fa-solid fa-location-dot text-slate-400 w-4 text-center mr-1"></i> ${escapeHtml(domisili)}</p>
                            ${item.no_whatsapp ? `<p><i class="fa-brands fa-whatsapp text-emerald-600 w-4 text-center mr-1"></i> ${escapeHtml(item.no_whatsapp)}</p>` : ''}
                        </div>
                        <div class="flex items-center justify-end space-x-2 pt-1">
                            <button type="button" onclick="showAdminAlumniDetail('${item.id}')" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl font-bold text-xs transition flex items-center space-x-1.5">
                                <i class="fa-solid fa-eye text-xs"></i>
                                <span>Detail Profil</span>
                            </button>
                            <button type="button" onclick="deleteAdminAlumni('${item.id}', '${escapeHtml(nama)}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl font-bold text-xs transition flex items-center space-x-1.5">
                                <i class="fa-solid fa-trash text-xs"></i>
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                `;
            });
            mobileList.innerHTML = mobileHtml;
        }

        /**
         * Membuka modal popup detail informasi profil alumni lengkap
         */
        function showAdminAlumniDetail(id) {
            const item = adminAlumniData.find(a => String(a.id) === String(id));
            if (!item) return;

            const modal = document.getElementById('modal-detail-alumni');
            if (!modal) return;

            const nama = item.nama_lengkap || item.nama || 'Alumni';
            const inisial = (nama.split(' ').map(w => w[0]).slice(0, 2).join('') || nama.substring(0, 2)).toUpperCase();
            
            let fotoUrl = item.foto && String(item.foto).trim() !== "" ? item.foto : null;
            if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (idMatch && idMatch[1]) fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
            }

            const avatarContainer = document.getElementById('modal-alumni-avatar-container');
            if (avatarContainer) {
                avatarContainer.innerHTML = fotoUrl
                    ? `<img src="${fotoUrl}" alt="${escapeHtml(nama)}" class="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-300 dark:border-emerald-700 shadow-md">`
                    : `<div class="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-emerald-300 dark:border-emerald-700">${inisial}</div>`;
            }

            // Nama & Gender
            const namaEl = document.getElementById('modal-alumni-nama');
            if (namaEl) namaEl.innerText = nama;

            const genderBadge = document.getElementById('modal-alumni-gender-badge');
            if (genderBadge) genderBadge.innerText = item.jenis_kelamin || 'Laki-laki';

            // Program & Angkatan
            const programEl = document.getElementById('modal-alumni-program');
            if (programEl) programEl.innerText = item.program_terakhir || 'Program Reguler';

            const angkatanEl = document.getElementById('modal-alumni-angkatan');
            if (angkatanEl) {
                const masuk = item.tahun_masuk || '-';
                const lulus = item.tahun_lulus || '-';
                angkatanEl.innerText = `Tahun Masuk: ${masuk} • Tahun Lulus: ${lulus}`;
            }

            // WhatsApp Direct Action
            const waBtn = document.getElementById('modal-alumni-wa-btn');
            const waText = document.getElementById('modal-alumni-wa-text');
            if (waBtn) {
                let cleanWa = String(item.no_whatsapp || '').replace(/[^0-9]/g, '');
                if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.slice(1);
                if (cleanWa.startsWith('8')) cleanWa = '62' + cleanWa;

                if (cleanWa) {
                    waBtn.href = `https://wa.me/${cleanWa}?text=Assalamu'alaikum%20${encodeURIComponent(nama)},%20salam%20silaturahmi%20dari%20Pengurus%20PPTQ%20Asnawiyyah%20(HASANAH).`;
                    waBtn.classList.remove('opacity-50', 'pointer-events-none');
                    if (waText) waText.innerText = `WhatsApp (${item.no_whatsapp})`;
                } else {
                    waBtn.href = '#';
                    waBtn.classList.add('opacity-50', 'pointer-events-none');
                    if (waText) waText.innerText = 'No WhatsApp Tidak Ada';
                }
            }

            // Media Sosial
            const medsosEl = document.getElementById('modal-alumni-medsos');
            if (medsosEl) medsosEl.innerText = item.media_sosial || 'Tidak dicantumkan';

            // Kesibukan & Instansi
            const kesibukanEl = document.getElementById('modal-alumni-kesibukan');
            if (kesibukanEl) kesibukanEl.innerText = item.kesibukan || '-';

            const instansiEl = document.getElementById('modal-alumni-instansi');
            if (instansiEl) instansiEl.innerText = item.instansi_perusahaan || '-';

            // Izin & Timestamp
            const izinEl = document.getElementById('modal-alumni-izin');
            if (izinEl) {
                const isIzin = (item.izin_publikasi || '').toLowerCase() === 'ya';
                izinEl.innerText = isIzin ? 'Ya (Izin Publikasi)' : 'Tidak (Privat)';
                izinEl.className = isIzin ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-slate-500';
            }

            const timestampEl = document.getElementById('modal-alumni-timestamp');
            if (timestampEl) timestampEl.innerText = `Terdaftar: ${item.timestamp || '-'}`;

            // Alamat Lengkap & Badge Wilayah
            const alamatEl = document.getElementById('modal-alumni-alamat');
            if (alamatEl) alamatEl.innerText = item.alamat_lengkap || '-';

            const kabEl = document.getElementById('modal-alumni-kabupaten-badge');
            if (kabEl) kabEl.innerText = item.kabupaten || '-';

            const provEl = document.getElementById('modal-alumni-provinsi-badge');
            if (provEl) provEl.innerText = item.provinsi || '-';

            // Koordinat GPS & Peta
            const koordinatEl = document.getElementById('modal-alumni-koordinat');
            const mapsBtn = document.getElementById('modal-alumni-maps-btn');
            const lat = String(item.latitude || '').trim();
            const lng = String(item.longitude || '').trim();

            if (koordinatEl) {
                koordinatEl.innerText = (lat && lng) ? `${lat}, ${lng}` : 'Belum di-pin pada peta';
            }

            if (mapsBtn) {
                if (lat && lng) {
                    mapsBtn.href = `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;
                    mapsBtn.classList.remove('opacity-50', 'pointer-events-none');
                } else {
                    mapsBtn.href = '#';
                    mapsBtn.classList.add('opacity-50', 'pointer-events-none');
                }
            }

            // Pesan & Kesan
            const kesanEl = document.getElementById('modal-alumni-kesan');
            if (kesanEl) {
                kesanEl.innerText = item.kesan_pesan && String(item.kesan_pesan).trim() !== "" 
                    ? `"${item.kesan_pesan}"`
                    : '"(Tidak menyertakan kesan & pesan)"';
            }

            modal.classList.remove('hidden');
        }

        /**
         * Menutup modal popup detail alumni
         */
        function closeAdminAlumniDetail() {
            const modal = document.getElementById('modal-detail-alumni');
            if (modal) modal.classList.add('hidden');
        }

        /**
         * Menghapus data alumni dengan konfirmasi dan sinkronisasi Cloud Supabase
         */
        async function deleteAdminAlumni(id, nama) {
            if (!confirm(`Apakah Anda yakin ingin menghapus data alumni "${nama}"?\n\nData yang dihapus tidak dapat dipulihkan.`)) {
                return;
            }

            try {
                if (typeof showToast === 'function') showToast("Sedang menghapus data alumni...");

                if (typeof apiPost === 'function') {
                    await apiPost('alumni.delete', { id });
                }

                // Hapus lokal secara reaktif
                adminAlumniData = adminAlumniData.filter(a => String(a.id) !== String(id));
                filterAdminAlumniList();

                // Update Hub Count Badge
                const hubBadge = document.getElementById('admin-hub-alumni-count');
                if (hubBadge) {
                    hubBadge.innerText = `${adminAlumniData.length} Alumni`;
                }

                if (typeof showToast === 'function') {
                    showToast(`✅ Data alumni "${nama}" berhasil dihapus.`);
                }
            } catch (err) {
                console.error("Gagal menghapus alumni:", err);
                if (typeof showToast === 'function') {
                    showToast("❌ Gagal menghapus data: " + (err.message || "Kendala jaringan"));
                }
            }
        }

        /**
         * Ekspor data seluruh alumni ke format CSV UTF-8 kompatibel Microsoft Excel
         */
        function exportAdminAlumniCSV() {
            if (!adminAlumniData || adminAlumniData.length === 0) {
                if (typeof showToast === 'function') showToast("⚠️ Tidak ada data alumni untuk diekspor.");
                return;
            }

            const headers = [
                "No", "ID Alumni", "Timestamp Pendaftaran", "Nama Lengkap", "Jenis Kelamin",
                "No WhatsApp", "Media Sosial", "Tahun Masuk", "Tahun Lulus", "Program Terakhir",
                "Kesibukan", "Instansi / Perusahaan / Kampus", "Provinsi", "Kabupaten / Kota",
                "Kecamatan", "Desa / Kelurahan", "Alamat Lengkap", "Latitude", "Longitude",
                "Izin Publikasi", "Kesan & Pesan", "Foto URL"
            ];

            const rows = adminAlumniData.map((a, idx) => [
                idx + 1,
                `"${(a.id || '').replace(/"/g, '""')}"`,
                `"${(a.timestamp || '').replace(/"/g, '""')}"`,
                `"${(a.nama_lengkap || a.nama || '').replace(/"/g, '""')}"`,
                `"${(a.jenis_kelamin || '').replace(/"/g, '""')}"`,
                `"'${(a.no_whatsapp || '').replace(/"/g, '""')}"`, // Tanda petik tunggal agar angka diawali 0 tidak hilang di Excel
                `"${(a.media_sosial || '').replace(/"/g, '""')}"`,
                `"${(a.tahun_masuk || '').replace(/"/g, '""')}"`,
                `"${(a.tahun_lulus || '').replace(/"/g, '""')}"`,
                `"${(a.program_terakhir || '').replace(/"/g, '""')}"`,
                `"${(a.kesibukan || '').replace(/"/g, '""')}"`,
                `"${(a.instansi_perusahaan || '').replace(/"/g, '""')}"`,
                `"${(a.provinsi || '').replace(/"/g, '""')}"`,
                `"${(a.kabupaten || '').replace(/"/g, '""')}"`,
                `"${(a.kecamatan || '').replace(/"/g, '""')}"`,
                `"${(a.desa_kelurahan || '').replace(/"/g, '""')}"`,
                `"${(a.alamat_lengkap || '').replace(/"/g, '""')}"`,
                `"${(a.latitude || '').replace(/"/g, '""')}"`,
                `"${(a.longitude || '').replace(/"/g, '""')}"`,
                `"${(a.izin_publikasi || '').replace(/"/g, '""')}"`,
                `"${(a.kesan_pesan || '').replace(/"/g, '""')}"`,
                `"${(a.foto || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const dateStr = new Date().toISOString().slice(0, 10);
            link.setAttribute("href", url);
            link.setAttribute("download", `Rekap_Data_Alumni_HASANAH_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast(`✅ Berhasil mengunduh ${adminAlumniData.length} data alumni.`);
            }
        }

        // Ekspos ke scope global Window
        window.loadAdminAlumniData = loadAdminAlumniData;
        window.filterAdminAlumniList = filterAdminAlumniList;
        window.renderAdminAlumniTable = renderAdminAlumniTable;
        window.showAdminAlumniDetail = showAdminAlumniDetail;
        window.closeAdminAlumniDetail = closeAdminAlumniDetail;
        window.deleteAdminAlumni = deleteAdminAlumni;
        window.exportAdminAlumniCSV = exportAdminAlumniCSV;
        window.setAdminAnalyticsTimeRange = setAdminAnalyticsTimeRange;
        window.renderAdminAnalyticsChart = renderAdminAnalyticsChart;
        window.refreshAdminAnalyticsData = refreshAdminAnalyticsData;
        window.triggerAdminHubStaggerAnimation = triggerAdminHubStaggerAnimation;

        // Ekspos Manajemen Seleksi & Bulk Edit Santri
        window.toggleSelectAllAdminStudents = toggleSelectAllAdminStudents;
        window.handleStudentRowSelectionChange = handleStudentRowSelectionChange;
        window.clearSelectedAdminStudents = clearSelectedAdminStudents;
        window.openBulkEditProgramModal = openBulkEditProgramModal;
        window.closeBulkEditProgramModal = closeBulkEditProgramModal;
        window.submitBulkEditProgram = submitBulkEditProgram;
        window.openBulkEditClassSchoolModal = openBulkEditClassSchoolModal;
        window.closeBulkEditClassSchoolModal = closeBulkEditClassSchoolModal;
        window.submitBulkEditClassSchool = submitBulkEditClassSchool;

        // Auto-initialize analytics chart on DOM ready
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    renderAdminAnalyticsChart(currentAdminAnalyticsRange || '7d');
                });
            } else {
                renderAdminAnalyticsChart(currentAdminAnalyticsRange || '7d');
            }
        }



