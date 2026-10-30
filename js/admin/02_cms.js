/**
 * ============================================================================
 * 02_cms.js - Content Management System (CMS) & Lembaga
 * ============================================================================
 * Tanggung Jawab Domain:
 *  - PPDB Data Controller & Detail Modal (lines 1247-1276)
 *  - Profil Lembaga & Pengaturan Publik/Admin (Sejarah, Visi Misi, Pengurus)
 *  - Manajemen Berita (Kategori, Form, Draft, Publikasi, Hapus)
 *  - Manajemen Banner & Carousel Beranda
 *  - Manajemen Galeri Foto Dokumentasi Pesantren
 *  - Manajemen Unit Kegiatan Santri (UKS / Ekstrakurikuler)
 *  - Manajemen Jadwal Kegiatan Harian Santri
 *  - Manajemen Program Pesantren CMS & Galeri Program
 *  - Manajemen Notifikasi & Pengumuman Pop-up Beranda
 * ============================================================================
 */

        // ==================== DASHBOARD ADMIN: MANAJEMEN DATA PPDB ====================
        let mockPPDBData = [];
        let filteredPPDBData = [];

        async function loadAdminPPDBData() {
            if (!isApiConfigured()) {
                renderAdminPPDBList();
                return;
            }

            try {
                const response = await apiPost("getPPDB");
                if (response && response.status === "success" && Array.isArray(response.data)) {
                    mockPPDBData = response.data;
                } else if (Array.isArray(response)) {
                    mockPPDBData = response;
                }

                const hubBadge = document.getElementById('admin-hub-ppdb-count');
                if (hubBadge) hubBadge.innerText = `${mockPPDBData.length} Pendaftar`;

                updateAdminPPDBSummaryStats();
                filterAdminPPDBList();
            } catch (err) {
                console.error("Gagal memuat data PPDB:", err);
                showToast("❌ Gagal memuat data PPDB: " + err.message);
                renderAdminPPDBList();
            }
        }

        // ==================== RENDER PROFIL LEMBAGA (PUBLIK) ====================
        window.APP_CONFIG = window.APP_CONFIG || {};

        async function loadPublicProfilLembaga() {
            try {
                const data = await apiGet("getPengaturan");
                if (data && data.status === "success" && data.data) {
                    let config = data.data;
                    if (Array.isArray(config)) {
                        const dict = {};
                        config.forEach(r => { if (r && r.key) dict[r.key] = r.value; });
                        config = dict;
                    }
                    window.APP_CONFIG.sejarah = config.sejarah || "";
                    window.APP_CONFIG.visi_misi = config.visi_misi || "";
                    window.APP_CONFIG.struktur_kepengurusan = config.struktur_kepengurusan || "";
                    
                    renderPublicProfilLembaga();
                }
            } catch(e) {
                console.error("Gagal load profil publik:", e);
            }
        }

        function renderPublicProfilLembaga() {
            const containerSejarah = document.getElementById('public-sejarah-container');
            const containerVisiMisi = document.getElementById('public-visimisi-container');
            const containerPengurus = document.getElementById('public-pengurus-container');

            if (containerSejarah) {
                const textSejarah = window.APP_CONFIG.sejarah || "Sejarah belum ditambahkan.";
                const pTags = textSejarah.split('\n').filter(t => t.trim() !== '').map(p => `<p class="leading-relaxed mb-3 last:mb-0">${p}</p>`).join('');
                containerSejarah.innerHTML = pTags;
            }

            if (containerVisiMisi) {
                const textVisiMisi = window.APP_CONFIG.visi_misi || "Visi misi belum ditambahkan.";
                const pTags = textVisiMisi.split('\n').filter(t => t.trim() !== '').map(p => `<p class="leading-relaxed mb-3 last:mb-0">${p}</p>`).join('');
                containerVisiMisi.innerHTML = `
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-xl bg-white dark:bg-[#1c2836] border border-slate-100 dark:border-[#253447] flex items-center justify-center text-brand-600 dark:text-emerald-400 shadow-sm">
                            <i class="fa-solid fa-bullseye"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800 dark:text-slate-100">Arah & Tujuan</h4>
                        </div>
                    </div>
                    ${pTags}
                `;
            }

            if (containerPengurus) {
                containerPengurus.innerHTML = '';
                let struct = [];
                try {
                    const rawStruct = window.APP_CONFIG.struktur_kepengurusan;
                    struct = rawStruct ? (typeof rawStruct === 'string' ? JSON.parse(rawStruct) : rawStruct) : [];
                    if (!Array.isArray(struct)) struct = [];
                } catch(e) { struct = []; }

                if (struct.length === 0) {
                    containerPengurus.innerHTML = `<p class="col-span-full text-center text-xs text-slate-400 dark:text-slate-500 italic py-4">Data kepengurusan belum ditambahkan.</p>`;
                } else {
                    struct.forEach(p => {
                        const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nama || 'P') + '&background=047857&color=ffffff&bold=true';
                        const imgSrc = p.foto || fallbackAvatar;
                        containerPengurus.innerHTML += `
                            <div class="bg-slate-50 dark:bg-[#1c2836] rounded-3xl overflow-hidden border border-slate-100 dark:border-[#253447] p-4 text-center space-y-3 flex flex-col items-center hover:shadow-md transition">
                                <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-600 shadow-sm shrink-0 bg-white dark:bg-[#15202d]">
                                    <img src="${imgSrc}" alt="${p.nama}" class="w-full h-full object-cover" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackAvatar}'">
                                </div>
                                <div>
                                    <span class="bg-brand-100 dark:bg-emerald-950/40 text-brand-800 dark:text-emerald-300 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">${p.jabatan || 'Pengurus'}</span>
                                    <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">${p.nama || 'Tanpa Nama'}</h4>
                                </div>
                            </div>
                        `;
                    });
                }
            }
        }

        window.loadPublicProfilLembaga = loadPublicProfilLembaga;
        window.renderPublicProfilLembaga = renderPublicProfilLembaga;

        // ==================== DASHBOARD ADMIN: PROFIL LEMBAGA ====================
        let adminPengurusList = [];
        let currentAdminProfilTab = 'sejarah';

        function switchAdminProfilTab(tabName) {
            currentAdminProfilTab = tabName;
            const panels = {
                'sejarah': document.getElementById('admin-profil-panel-sejarah'),
                'visimisi': document.getElementById('admin-profil-panel-visimisi'),
                'pengurus': document.getElementById('admin-profil-panel-pengurus')
            };
            const tabBtns = {
                'sejarah': document.getElementById('tab-btn-profil-sejarah'),
                'visimisi': document.getElementById('tab-btn-profil-visimisi'),
                'pengurus': document.getElementById('tab-btn-profil-pengurus')
            };

            Object.keys(panels).forEach(key => {
                if (panels[key]) {
                    if (key === tabName) {
                        panels[key].classList.remove('hidden');
                    } else {
                        panels[key].classList.add('hidden');
                    }
                }
                if (tabBtns[key]) {
                    if (key === tabName) {
                        tabBtns[key].className = "admin-profil-nav-tab flex-1 min-w-[140px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 bg-teal-600 text-white shadow-sm";
                    } else {
                        tabBtns[key].className = "admin-profil-nav-tab flex-1 min-w-[140px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#253447]";
                    }
                }
            });
        }
        window.switchAdminProfilTab = switchAdminProfilTab;

        function updateProfilLembagaKPIs() {
            // 1. KPI Pengurus & Foto
            const kpiPengurus = document.getElementById('admin-profil-kpi-pengurus');
            const kpiFoto = document.getElementById('admin-profil-kpi-foto');
            const kpiFotoSub = document.getElementById('admin-profil-kpi-foto-sub');
            const tabBadge = document.getElementById('admin-profil-tab-pengurus-count');
            const badgeList = document.getElementById('admin-profil-pengurus-count-badge');

            const totalPengurus = Array.isArray(adminPengurusList) ? adminPengurusList.length : 0;
            const fotoCount = Array.isArray(adminPengurusList) ? adminPengurusList.filter(p => p.foto && p.foto.trim() !== '').length : 0;

            if (kpiPengurus) kpiPengurus.innerText = totalPengurus;
            if (kpiFoto) kpiFoto.innerText = fotoCount;
            if (kpiFotoSub) kpiFotoSub.innerText = `${fotoCount} dari ${totalPengurus} terpasang`;
            if (tabBadge) tabBadge.innerText = totalPengurus;
            if (badgeList) badgeList.innerText = `${totalPengurus} Orang`;

            // 2. KPI Sejarah
            const sejarahText = document.getElementById('input-profil-sejarah')?.value || "";
            const sejarahWords = sejarahText.trim() ? sejarahText.trim().split(/\s+/).length : 0;
            const sejarahParagraphs = sejarahText.split('\n').filter(p => p.trim() !== '').length;

            const kpiKataSejarah = document.getElementById('admin-profil-kpi-kata-sejarah');
            const kpiParagrafSejarah = document.getElementById('admin-profil-kpi-paragraf-sejarah');
            const wordCountEl = document.getElementById('sejarah-word-count');
            const charCountEl = document.getElementById('sejarah-char-count');

            if (kpiKataSejarah) kpiKataSejarah.innerText = sejarahWords;
            if (kpiParagrafSejarah) kpiParagrafSejarah.innerText = `${sejarahParagraphs} Paragraf`;
            if (wordCountEl) wordCountEl.innerText = sejarahWords;
            if (charCountEl) charCountEl.innerText = sejarahText.length;

            // 3. KPI Visi Misi
            const visiMisiText = document.getElementById('input-profil-visimisi')?.value || "";
            const visiMisiWords = visiMisiText.trim() ? visiMisiText.trim().split(/\s+/).length : 0;
            const visiMisiLines = visiMisiText.split('\n').filter(l => l.trim() !== '').length;

            const kpiVisiMisiStatus = document.getElementById('admin-profil-kpi-visimisi-status');
            const kpiPoinVisiMisi = document.getElementById('admin-profil-kpi-poin-visimisi');
            const visimisiWordCountEl = document.getElementById('visimisi-word-count');
            const visimisiPointsCountEl = document.getElementById('visimisi-points-count');

            if (kpiVisiMisiStatus) kpiVisiMisiStatus.innerText = visiMisiWords > 0 ? "Siap" : "Kosong";
            if (kpiPoinVisiMisi) kpiPoinVisiMisi.innerText = `${visiMisiLines} Butir Poin`;
            if (visimisiWordCountEl) visimisiWordCountEl.innerText = visiMisiWords;
            if (visimisiPointsCountEl) visimisiPointsCountEl.innerText = visiMisiLines;
        }
        window.updateProfilLembagaKPIs = updateProfilLembagaKPIs;

        function updateSejarahLivePreview() {
            const text = document.getElementById('input-profil-sejarah')?.value || "";
            const preview = document.getElementById('preview-profil-sejarah');
            if (!preview) return;

            if (!text.trim()) {
                preview.innerHTML = '<p class="text-slate-400 italic">Pratinjau narasi sejarah akan muncul di sini secara real-time.</p>';
            } else {
                const pTags = text.split('\n').filter(t => t.trim() !== '').map(p => `<p class="leading-relaxed">${escapeHtml(p)}</p>`).join('');
                preview.innerHTML = pTags;
            }
            updateProfilLembagaKPIs();
        }
        window.updateSejarahLivePreview = updateSejarahLivePreview;

        function updateVisiMisiLivePreview() {
            const text = document.getElementById('input-profil-visimisi')?.value || "";
            const preview = document.getElementById('preview-profil-visimisi');
            if (!preview) return;

            if (!text.trim()) {
                preview.innerHTML = '<p class="text-slate-400 italic">Pratinjau visi dan misi akan muncul di sini secara real-time.</p>';
            } else {
                const lines = text.split('\n').filter(t => t.trim() !== '');
                const formatted = lines.map(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+[\.\)]/.test(trimmed)) {
                        return `<li class="flex items-start gap-2"><span class="text-purple-600 dark:text-purple-400 font-bold">•</span><span>${escapeHtml(trimmed.replace(/^[-•\d+\.\)]\s*/, ''))}</span></li>`;
                    } else if (trimmed.toLowerCase().includes('visi') || trimmed.toLowerCase().includes('misi') || trimmed.toLowerCase().includes('tujuan')) {
                        return `<h5 class="font-bold text-xs uppercase tracking-wider pt-2 text-purple-700 dark:text-purple-400">${escapeHtml(trimmed)}</h5>`;
                    } else {
                        return `<p class="leading-relaxed">${escapeHtml(trimmed)}</p>`;
                    }
                }).join('');
                preview.innerHTML = formatted;
            }
            updateProfilLembagaKPIs();
        }
        window.updateVisiMisiLivePreview = updateVisiMisiLivePreview;

        function insertSejarahParagraphTemplate() {
            const textarea = document.getElementById('input-profil-sejarah');
            if (!textarea) return;
            const template = "\n\nSeiring dengan perjalanan waktu, PPTQ Asnawiyyah terus berikhtiar membenahi sarana dan prasarana demi kenyamanan para santri dalam menghafal Al-Qur'an.";
            textarea.value = (textarea.value.trim() ? textarea.value.trim() + template : template.trim());
            updateSejarahLivePreview();
            textarea.focus();
        }
        window.insertSejarahParagraphTemplate = insertSejarahParagraphTemplate;

        function formatSejarahText() {
            const textarea = document.getElementById('input-profil-sejarah');
            if (!textarea) return;
            textarea.value = textarea.value.replace(/\n{3,}/g, '\n\n').trim();
            updateSejarahLivePreview();
            showToast("✨ Format paragraf sejarah dirapikan.");
        }
        window.formatSejarahText = formatSejarahText;

        function insertVisiMisiBullet() {
            const textarea = document.getElementById('input-profil-visimisi');
            if (!textarea) return;
            const bullet = "\n• ";
            textarea.value = (textarea.value.trim() ? textarea.value.trim() + bullet : "• ");
            updateVisiMisiLivePreview();
            textarea.focus();
        }
        window.insertVisiMisiBullet = insertVisiMisiBullet;

        function formatVisiMisiText() {
            const textarea = document.getElementById('input-profil-visimisi');
            if (!textarea) return;
            textarea.value = textarea.value.replace(/\n{3,}/g, '\n\n').trim();
            updateVisiMisiLivePreview();
            showToast("✨ Format visi & misi dirapikan.");
        }
        window.formatVisiMisiText = formatVisiMisiText;

        function renderPengurusFields(filteredList = null) {
            const container = document.getElementById('container-pengurus');
            const emptyState = document.getElementById('admin-pengurus-empty-state');
            if (!container) return;
            container.innerHTML = '';

            const list = filteredList !== null ? filteredList : (adminPengurusList || []);

            if (list.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                updateProfilLembagaKPIs();
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            list.forEach((pengurus, idx) => {
                const originalIdx = adminPengurusList.findIndex(p => p === pengurus);
                const actualIndex = originalIdx >= 0 ? originalIdx : idx;

                const div = document.createElement('div');
                div.className = "p-3.5 md:p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2634] border border-slate-200 dark:border-[#253447] flex flex-col justify-between gap-3 relative hover:shadow-md transition group animate-fade-in-up";

                const imgSrc = pengurus.foto || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(pengurus.nama || 'P') + '&background=0d9488&color=ffffff&bold=true');

                div.innerHTML = `
                    <div class="flex gap-3 items-start">
                        <!-- 1:1 Square avatar foto -->
                        <div class="relative group/photo aspect-square w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-[#15202d] border border-slate-300 dark:border-[#2d4058] shrink-0 shadow-2xs">
                            <img id="preview-pengurus-${actualIndex}" src="${imgSrc}" class="w-full h-full object-cover" alt="Foto">
                            <label class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 cursor-pointer transition text-center p-1" title="Klik untuk mengunggah foto">
                                <i class="fa-solid fa-camera text-xs mb-0.5"></i>
                                <span class="text-[8px] font-bold">Ubah Foto</span>
                                <input type="file" accept="image/*" class="hidden" onchange="uploadPengurusFoto(event, ${actualIndex})">
                            </label>
                        </div>
                        <input type="hidden" id="input-pengurus-foto-${actualIndex}" value="${escapeHtml(pengurus.foto || '')}">

                        <!-- Info Inputs -->
                        <div class="flex-1 min-w-0 space-y-1.5">
                            <div>
                                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jabatan / Amanah</label>
                                <input type="text" id="input-pengurus-jabatan-${actualIndex}" value="${escapeHtml(pengurus.jabatan || '')}"
                                    oninput="syncPengurusList()"
                                    class="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#253447] bg-white dark:bg-[#15202d] text-slate-800 dark:text-slate-100 font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none transition" placeholder="Cth: Pengasuh Pesantren">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap & Gelar</label>
                                <input type="text" id="input-pengurus-nama-${actualIndex}" value="${escapeHtml(pengurus.nama || '')}"
                                    oninput="syncPengurusList()"
                                    class="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#253447] bg-white dark:bg-[#15202d] text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 focus:outline-none transition" placeholder="Cth: KH. Fulan bin Fulan">
                            </div>
                        </div>
                    </div>

                    <!-- Bottom toolbar card -->
                    <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#253447]/60 text-[11px]">
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <i class="fa-solid fa-hashtag text-[9px]"></i> #${actualIndex + 1}
                        </span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="movePengurusOrder(${actualIndex}, -1)" ${actualIndex === 0 ? 'disabled' : ''}
                                class="w-6 h-6 rounded-lg bg-white dark:bg-[#15202d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#253447] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shadow-2xs" title="Pindah Urutan ke Atas">
                                <i class="fa-solid fa-chevron-up text-[10px]"></i>
                            </button>
                            <button type="button" onclick="movePengurusOrder(${actualIndex}, 1)" ${actualIndex === adminPengurusList.length - 1 ? 'disabled' : ''}
                                class="w-6 h-6 rounded-lg bg-white dark:bg-[#15202d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#253447] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shadow-2xs" title="Pindah Urutan ke Bawah">
                                <i class="fa-solid fa-chevron-down text-[10px]"></i>
                            </button>
                            ${pengurus.foto ? `
                            <button type="button" onclick="removePengurusFoto(${actualIndex})"
                                class="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center justify-center transition ml-1" title="Hapus Foto">
                                <i class="fa-solid fa-image-slash text-[10px]"></i>
                            </button>
                            ` : ''}
                            <button type="button" onclick="removePengurusField(${actualIndex})"
                                class="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center transition ml-1" title="Hapus Pengurus">
                                <i class="fa-solid fa-trash text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });

            updateProfilLembagaKPIs();
        }
        window.renderPengurusFields = renderPengurusFields;

        function addPengurusField() {
            syncPengurusList();
            adminPengurusList.push({ nama: "", jabatan: "", foto: "" });
            renderPengurusFields();

            // Switch to pengurus tab if on other tab
            switchAdminProfilTab('pengurus');

            // Focus on newly added name input
            const newIndex = adminPengurusList.length - 1;
            setTimeout(() => {
                const el = document.getElementById(`input-pengurus-nama-${newIndex}`);
                if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
        window.addPengurusField = addPengurusField;

        function removePengurusField(index) {
            syncPengurusList();
            const p = adminPengurusList[index];
            const name = p?.nama ? `"${p.nama}"` : "pengurus ini";
            if (!confirm(`Yakin ingin menghapus ${name} dari daftar kepengurusan?`)) return;
            adminPengurusList.splice(index, 1);
            renderPengurusFields();
            showToast("🗑️ Data pengurus dihapus.");
        }
        window.removePengurusField = removePengurusField;

        function removePengurusFoto(index) {
            syncPengurusList();
            if (adminPengurusList[index]) {
                adminPengurusList[index].foto = "";
                renderPengurusFields();
                showToast("🗑️ Foto pengurus telah dihapus.");
            }
        }
        window.removePengurusFoto = removePengurusFoto;

        function movePengurusOrder(index, direction) {
            syncPengurusList();
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= adminPengurusList.length) return;
            const temp = adminPengurusList[index];
            adminPengurusList[index] = adminPengurusList[targetIndex];
            adminPengurusList[targetIndex] = temp;
            renderPengurusFields();
        }
        window.movePengurusOrder = movePengurusOrder;

        function filterAdminPengurusList() {
            const q = (document.getElementById('admin-pengurus-search')?.value || '').toLowerCase().trim();
            if (!q) {
                renderPengurusFields();
                return;
            }
            const filtered = adminPengurusList.filter(p => 
                (p.nama || '').toLowerCase().includes(q) ||
                (p.jabatan || '').toLowerCase().includes(q)
            );
            renderPengurusFields(filtered);
        }
        window.filterAdminPengurusList = filterAdminPengurusList;

        function syncPengurusList() {
            adminPengurusList = adminPengurusList.map((p, index) => {
                const inputNama = document.getElementById(`input-pengurus-nama-${index}`);
                const inputJabatan = document.getElementById(`input-pengurus-jabatan-${index}`);
                const inputFoto = document.getElementById(`input-pengurus-foto-${index}`);
                return {
                    nama: inputNama ? inputNama.value : p.nama,
                    jabatan: inputJabatan ? inputJabatan.value : p.jabatan,
                    foto: inputFoto ? inputFoto.value : p.foto
                };
            });
            updateProfilLembagaKPIs();
        }
        window.syncPengurusList = syncPengurusList;

        async function uploadPengurusFoto(event, index) {
            const file = event.target.files[0];
            if (!file) return;

            const previewImg = document.getElementById(`preview-pengurus-${index}`);
            const originalSrc = previewImg ? previewImg.src : "";
            if (previewImg) previewImg.src = "https://i.gifer.com/ZKZg.gif"; 

            try {
                const token = getAdminSessionToken();
                const fileData = await readFileAsBase64(file);
                fileData.prefix = "PENGURUS";

                const response = await apiPost("uploadMedia", { token, file: fileData });
                
                if (response && (response.success || response.status === "success")) {
                    const uploadedUrl = response.url || response.fileUrl || (response.data && response.data.url) || "";
                    if (!uploadedUrl) throw new Error("Server tidak mengembalikan URL gambar.");
                    
                    if (previewImg) previewImg.src = uploadedUrl;
                    const hiddenInput = document.getElementById(`input-pengurus-foto-${index}`);
                    if (hiddenInput) hiddenInput.value = uploadedUrl;
                    if (adminPengurusList[index]) adminPengurusList[index].foto = uploadedUrl;
                    syncPengurusList();
                    renderPengurusFields();
                    showToast("✅ Foto berhasil diunggah ke Google Drive!");
                } else {
                    throw new Error(response.message || "Gagal mengunggah foto.");
                }
            } catch (err) {
                console.error("Gagal upload foto pengurus:", err);
                if (previewImg) previewImg.src = originalSrc;
                showToast("❌ Gagal mengunggah foto pengurus.");
            }
        }
        window.uploadPengurusFoto = uploadPengurusFoto;

        async function loadAdminProfilLembaga() {
            try {
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memuat Data...`;
                }

                const data = await apiGet("getPengaturan");
                if (data && data.status === "success" && data.data) {
                    let config = data.data;
                    if (Array.isArray(config)) {
                        const dict = {};
                        config.forEach(r => { if (r && r.key) dict[r.key] = r.value; });
                        config = dict;
                    }
                    const sejarahInput = document.getElementById('input-profil-sejarah');
                    const visiMisiInput = document.getElementById('input-profil-visimisi');
                    if (sejarahInput) sejarahInput.value = config.sejarah || "";
                    if (visiMisiInput) visiMisiInput.value = config.visi_misi || "";
                    
                    try {
                        const struct = config.struktur_kepengurusan;
                        adminPengurusList = struct ? (typeof struct === 'string' ? JSON.parse(struct) : struct) : [];
                        if (!Array.isArray(adminPengurusList)) adminPengurusList = [];
                    } catch(e) {
                        adminPengurusList = [];
                    }
                }
                
                updateSejarahLivePreview();
                updateVisiMisiLivePreview();
                renderPengurusFields();
                updateProfilLembagaKPIs();

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Seluruh Profil`;
                }
            } catch (err) {
                console.error("Gagal memuat profil lembaga:", err);
                showToast("Gagal memuat profil lembaga.");
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Seluruh Profil`;
                }
            }
        }
        window.loadAdminProfilLembaga = loadAdminProfilLembaga;

        async function saveAdminProfilLembaga() {
            try {
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                const originalHtml = btnSubmit ? btnSubmit.innerHTML : "";
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...`;
                }

                syncPengurusList(); 

                const payload = {
                    sejarah: document.getElementById('input-profil-sejarah')?.value || "",
                    visi_misi: document.getElementById('input-profil-visimisi')?.value || "",
                    struktur_kepengurusan: JSON.stringify(adminPengurusList)
                };

                const response = await apiPost("savePengaturan", payload);
                if (response.success) {
                    showToast("✅ Profil & Kepengurusan berhasil disimpan!");
                    
                    window.APP_CONFIG.sejarah = payload.sejarah;
                    window.APP_CONFIG.visi_misi = payload.visi_misi;
                    window.APP_CONFIG.struktur_kepengurusan = payload.struktur_kepengurusan;
                    
                    if (typeof renderPublicProfilLembaga === 'function') {
                        renderPublicProfilLembaga();
                    }
                    updateProfilLembagaKPIs();
                } else {
                    showToast("❌ Gagal menyimpan: " + (response.message || "Unknown error"));
                }

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalHtml;
                }
            } catch (err) {
                console.error(err);
                showToast("❌ Terjadi kesalahan saat menyimpan.");
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk mr-2"></i> Simpan Seluruh Profil`;
                }
            }
        }
        window.saveAdminProfilLembaga = saveAdminProfilLembaga;

        // ==================== DASHBOARD ADMIN: PENGATURAN PROFIL ====================
        async function loadAdminPengaturan() {
            try {
                const btnSubmit = document.getElementById('btn-submit-pengaturan');
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memuat...`;
                }

                const data = await apiGet("getPengaturan");

                if (data && data.status === "success" && data.data) {
                    let config = data.data;
                    if (Array.isArray(config)) {
                        const dict = {};
                        config.forEach(r => { if (r && r.key) dict[r.key] = r.value; });
                        config = dict;
                    }
                    document.getElementById('input-video-highlight').value = config.video_highlight || "";
                    document.getElementById('input-link-instagram').value = config.link_instagram || "";
                    document.getElementById('input-link-youtube').value = config.link_youtube || "";
                    document.getElementById('input-link-facebook').value = config.link_facebook || "";
                }
            } catch (err) {
                console.error("Gagal memuat pengaturan:", err);
                showToast("Gagal memuat pengaturan profil.");
            } finally {
                const btnSubmit = document.getElementById('btn-submit-pengaturan');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-save mr-2"></i> Simpan Pengaturan`;
                }
            }
        }

        async function submitPengaturan(e) {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit-pengaturan');
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...`;

            try {
                const rawVideo = document.getElementById('input-video-highlight').value;
                const formattedVideo = (typeof formatYoutubeEmbedUrl === 'function') ? formatYoutubeEmbedUrl(rawVideo) : rawVideo;

                const payload = {
                    video_highlight: formattedVideo,
                    link_instagram: document.getElementById('input-link-instagram').value,
                    link_youtube: document.getElementById('input-link-youtube').value,
                    link_facebook: document.getElementById('input-link-facebook').value
                };

                const result = await apiPost("savePengaturan", payload);
                if (result.success) {
                    showToast("Pengaturan profil berhasil disimpan!");
                    loadPengaturan(); // Refresh client side
                } else {
                    showToast("Gagal menyimpan pengaturan: " + (result.message || "Unknown error"));
                }
            } catch (err) {
                console.error(err);
                showToast("Terjadi kesalahan koneksi.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }
        }

        async function loadPengaturan() {
            try {
                const data = await apiGet("getPengaturan");

                if (data && data.status === "success" && data.data) {
                    let config = data.data;
                    if (Array.isArray(config)) {
                        const dict = {};
                        config.forEach(r => { if (r && r.key) dict[r.key] = r.value; });
                        config = dict;
                    }

                    // Update iframe video highlight dengan URL embed resmi
                    const iframeVideo = document.getElementById('highlight-video-iframe') || document.querySelector('iframe[title="Video Dokumentasi PPTQ Asnawiyyah"]');
                    if (iframeVideo && config.video_highlight) {
                        const embedUrl = (typeof formatYoutubeEmbedUrl === 'function')
                            ? formatYoutubeEmbedUrl(config.video_highlight)
                            : config.video_highlight;
                        if (embedUrl && (embedUrl.includes('youtube.com/embed/') || embedUrl.includes('youtube-nocookie.com/embed/'))) {
                            iframeVideo.src = embedUrl;
                        }
                    }

                    // Update tautan eksternal YouTube
                    const externalLink = document.getElementById('highlight-video-external-link');
                    if (externalLink && config.video_highlight) {
                        externalLink.href = config.video_highlight;
                    }

                    // Update social links
                    const sosmedContainer = document.getElementById('galeri-social-links') || document.querySelector('.bg-slate-50.p-5.rounded-3xl.border.border-slate-100.text-center.space-y-3');
                    if (sosmedContainer) {
                        const igLink = sosmedContainer.querySelector('a[href*="instagram"]');
                        const ytLink = sosmedContainer.querySelector('a[href*="youtube"]');
                        const fbLink = sosmedContainer.querySelector('a[href*="facebook"]');

                        if (igLink && config.link_instagram) igLink.href = config.link_instagram;
                        if (ytLink && config.link_youtube) ytLink.href = config.link_youtube;
                        if (fbLink && config.link_facebook) fbLink.href = config.link_facebook;
                    }
                }
            } catch (err) {
                console.error("Gagal memuat pengaturan klien:", err);
            }
        }

        function updateAdminPPDBSummaryStats() {
            const total = mockPPDBData.length;
            const pending = mockPPDBData.filter(d => (d.status || 'Pending').toLowerCase() === 'pending').length;
            const diterima = mockPPDBData.filter(d => (d.status || '').toLowerCase() === 'diterima').length;
            const ditolak = mockPPDBData.filter(d => (d.status || '').toLowerCase() === 'ditolak').length;

            const statTotal = document.getElementById('admin-ppdb-stat-total');
            const statPending = document.getElementById('admin-ppdb-stat-pending');
            const statDiterima = document.getElementById('admin-ppdb-stat-diterima');
            const statDitolak = document.getElementById('admin-ppdb-stat-ditolak');

            if (statTotal) statTotal.innerText = total;
            if (statPending) statPending.innerText = pending;
            if (statDiterima) statDiterima.innerText = diterima;
            if (statDitolak) statDitolak.innerText = ditolak;
        }

        function filterAdminPPDBList() {
            const searchInput = document.getElementById('admin-ppdb-search');
            const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
            const statusFilter = document.getElementById('admin-ppdb-filter-status');
            const selectedStatus = statusFilter ? statusFilter.value : "ALL";

            filteredPPDBData = mockPPDBData.filter(item => {
                const matchesSearch = !query ||
                    (item.nama && item.nama.toLowerCase().includes(query)) ||
                    (item.nisn && String(item.nisn).toLowerCase().includes(query)) ||
                    (item.wali && item.wali.toLowerCase().includes(query)) ||
                    (item.program && item.program.toLowerCase().includes(query));

                const itemStatus = item.status || "Pending";
                const matchesStatus = selectedStatus === "ALL" ||
                    itemStatus.toLowerCase() === selectedStatus.toLowerCase();

                return matchesSearch && matchesStatus;
            });

            renderAdminPPDBList();
        }

        function renderAdminPPDBList() {
            const tbody = document.getElementById('admin-ppdb-table-tbody');
            const mobileList = document.getElementById('admin-ppdb-mobile-list');
            const emptyState = document.getElementById('admin-ppdb-empty-state');
            const countBadge = document.getElementById('admin-ppdb-list-count');

            if (countBadge) countBadge.innerText = `${filteredPPDBData.length} Data`;

            if (!tbody || !mobileList) return;

            tbody.innerHTML = "";
            mobileList.innerHTML = "";

            if (filteredPPDBData.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            } else {
                if (emptyState) emptyState.classList.add('hidden');
            }

            filteredPPDBData.forEach((item, index) => {
                const status = item.status || "Pending";
                let statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-200";
                if (status.toLowerCase() === "diterima") statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                if (status.toLowerCase() === "ditolak") statusBadgeClass = "bg-rose-100 text-rose-800 border-rose-200";

                // Desktop Table Row
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition";
                tr.innerHTML = `
                    <td class="py-3 px-3 font-bold text-slate-400">${index + 1}</td>
                    <td class="py-3 px-3 font-bold text-slate-800">${escapeHtml(item.nama)}</td>
                    <td class="py-3 px-3 font-mono text-slate-600">${escapeHtml(item.nisn)}</td>
                    <td class="py-3 px-3 text-slate-600">${escapeHtml(item.wali || '-')}</td>
                    <td class="py-3 px-3 text-brand-700 font-semibold">${escapeHtml(item.program || '-')}</td>
                    <td class="py-3 px-3 font-mono text-slate-600">${escapeHtml(item.whatsapp || '-')}</td>
                    <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}">${escapeHtml(status)}</span>
                    </td>
                    <td class="py-3 px-3 text-slate-400 text-[11px]">${escapeHtml(item.tanggalDaftar || '-')}</td>
                    <td class="py-3 px-3 text-center">
                        <button type="button" onclick="viewAdminPPDBDetail(${index})" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100 transition shadow-sm" title="Lihat Detail">
                            <i class="fa-solid fa-eye mr-1"></i> Detail
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Mobile Card
                const card = document.createElement('div');
                card.className = "bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5";
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">#${index + 1} • ${escapeHtml(item.tanggalDaftar || '-')}</span>
                            <h4 class="font-bold text-slate-800 text-sm">${escapeHtml(item.nama)}</h4>
                            <span class="text-xs font-mono text-slate-500">NISN: ${escapeHtml(item.nisn)}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}">${escapeHtml(status)}</span>
                    </div>
                    <div class="pt-2 border-t border-slate-200/60 text-xs space-y-1 text-slate-600">
                        <div><strong class="text-slate-500">Wali:</strong> ${escapeHtml(item.wali || '-')}</div>
                        <div><strong class="text-slate-500">Program:</strong> <span class="text-brand-700 font-semibold">${escapeHtml(item.program || '-')}</span></div>
                        <div><strong class="text-slate-500">No. WA:</strong> <span class="font-mono text-slate-700">${escapeHtml(item.whatsapp || '-')}</span></div>
                    </div>
                    <div class="pt-2 flex justify-end">
                        <button type="button" onclick="viewAdminPPDBDetail(${index})" class="w-full py-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-slate-200 transition shadow-sm text-center">
                            <i class="fa-solid fa-eye mr-1"></i> Lihat Detail Lengkap
                        </button>
                    </div>
                `;
                mobileList.appendChild(card);
            });
        }

        function viewAdminPPDBDetail(index) {
            const item = filteredPPDBData[index];
            if (!item) return;

            document.getElementById('modal-ppdb-nama').innerText = item.nama || '-';
            document.getElementById('modal-ppdb-nisn').innerText = item.nisn || '-';
            document.getElementById('modal-ppdb-wali').innerText = item.wali || '-';
            document.getElementById('modal-ppdb-program').innerText = item.program || '-';
            document.getElementById('modal-ppdb-whatsapp').innerText = item.whatsapp || '-';
            document.getElementById('modal-ppdb-tanggal').innerText = item.tanggalDaftar || '-';

            const status = item.status || "Pending";
            const badge = document.getElementById('modal-ppdb-status-badge');
            if (badge) {
                badge.innerText = status;
                let statusClass = "bg-amber-100 text-amber-800";
                if (status.toLowerCase() === "diterima") statusClass = "bg-emerald-100 text-emerald-800";
                if (status.toLowerCase() === "ditolak") statusClass = "bg-rose-100 text-rose-800";
                badge.className = `inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${statusClass}`;
            }

            const waLink = document.getElementById('modal-ppdb-wa-link');
            if (waLink) {
                let cleanPhone = String(item.whatsapp || "").replace(/\D/g, "");
                if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
                if (cleanPhone) {
                    waLink.href = `https://wa.me/${cleanPhone}?text=Assalamu'alaikum%20Calon%20Santri%20${encodeURIComponent(item.nama)}`;
                    waLink.classList.remove('hidden');
                } else {
                    waLink.classList.add('hidden');
                }
            }

            document.getElementById('adminPPDBDetailModal').classList.remove('hidden');
        }

        function closeAdminPPDBDetailModal() {
            document.getElementById('adminPPDBDetailModal').classList.add('hidden');
        }

        // Helper membaca file ke Base64
        function readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    base64: reader.result.split(',')[1],
                    mimeType: file.type,
                    name: file.name
                });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Helper kompresi gambar client-side sebelum upload ke Google Drive
        function compressImageFile(file, maxWidth = 1600, quality = 0.90) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    return resolve(readFileAsBase64(file));
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);

                        let mimeType = 'image/webp';
                        let dataUrl = canvas.toDataURL(mimeType, quality);
                        if (!dataUrl.startsWith('data:image/webp')) {
                            mimeType = 'image/jpeg';
                            dataUrl = canvas.toDataURL(mimeType, quality);
                        }

                        const base64 = dataUrl.split(',')[1];
                        const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
                        const cleanName = file.name.replace(/\.[^/.]+$/, "") + extension;

                        resolve({
                            base64: base64,
                            mimeType: mimeType,
                            name: cleanName
                        });
                    };
                    img.onerror = () => {
                        readFileAsBase64(file).then(resolve).catch(reject);
                    };
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // ==================== DASHBOARD ADMIN: MANAJEMEN BERITA ====================
        let adminNewsRawImage = null; // HTMLImageElement
        let adminNewsCroppedBase64 = null; // Base64 string foto 16:9 yang siap dikirim
        let adminNewsExistingGambar = ''; // Menyimpan URL foto lama saat edit berita
        let adminNewsCropState = {
            zoom: 1,
            panX: 0,
            panY: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };
        let adminNewsInlineSelectedBase64 = null;
        let adminNewsInlineRawImage = null;
        let adminNewsInlineCurrentRatio = 'original'; // 'original' | '16:9' | '4:3' | '1:1'

        let isAdminNewsFormOpen = false;
        let currentAdminNewsCategoryFilter = 'all';

        function toggleAdminNewsForm(forceState = null) {
            const formSection = document.getElementById('admin-news-form-section');
            const toggleIcon = document.getElementById('admin-news-toggle-icon');
            const toggleText = document.getElementById('admin-news-toggle-text');
            const toggleBtn = document.getElementById('admin-news-toggle-btn');
            if (!formSection) return;

            if (forceState !== null) {
                isAdminNewsFormOpen = forceState;
            } else {
                isAdminNewsFormOpen = !isAdminNewsFormOpen;
            }

            if (isAdminNewsFormOpen) {
                formSection.classList.remove('hidden');
                if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-up text-xs";
                if (toggleText) toggleText.innerText = "Tutup Form Editor";
                if (toggleBtn) {
                    toggleBtn.className = "px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95";
                }
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                    const judulInput = document.getElementById('admin-news-judul');
                    if (judulInput) judulInput.focus();
                }, 250);
            } else {
                formSection.classList.add('hidden');
                if (toggleIcon) toggleIcon.className = "fa-solid fa-plus text-xs";
                if (toggleText) toggleText.innerText = "Tulis Berita Baru";
                if (toggleBtn) {
                    toggleBtn.className = "px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95";
                }
            }
        }
        window.toggleAdminNewsForm = toggleAdminNewsForm;

        function setAdminNewsCategoryFilter(kategori) {
            currentAdminNewsCategoryFilter = kategori;
            document.querySelectorAll('.admin-news-filter-chip').forEach(btn => {
                const cat = btn.getAttribute('data-category');
                if (cat === kategori) {
                    btn.className = "admin-news-filter-chip px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm transition shrink-0";
                } else {
                    btn.className = "admin-news-filter-chip px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0";
                }
            });
            filterAdminNewsList();
        }
        window.setAdminNewsCategoryFilter = setAdminNewsCategoryFilter;

        function filterAdminNewsList() {
            const searchInput = document.getElementById('admin-news-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            let filtered = mockNewsData || [];

            if (currentAdminNewsCategoryFilter && currentAdminNewsCategoryFilter !== 'all') {
                filtered = filtered.filter(n => (n.kategori || '').toLowerCase() === currentAdminNewsCategoryFilter.toLowerCase());
            }

            if (query) {
                filtered = filtered.filter(n => 
                    (n.judul || '').toLowerCase().includes(query) ||
                    (n.penulis || '').toLowerCase().includes(query) ||
                    (n.kategori || '').toLowerCase().includes(query) ||
                    (n.ringkasan || '').toLowerCase().includes(query)
                );
            }

            renderAdminNewsList(filtered);
        }
        window.filterAdminNewsList = filterAdminNewsList;

        function renderAdminNewsList(itemsToRender = null) {
            const container = document.getElementById('admin-news-list');
            const totalBadge = document.getElementById('admin-total-news');
            const hubBadge = document.getElementById('admin-hub-news-count');
            const emptyState = document.getElementById('admin-news-empty-state');

            const totalCount = Array.isArray(mockNewsData) ? mockNewsData.length : 0;
            if (hubBadge) hubBadge.innerText = `${totalCount} Berita`;
            if (totalBadge) totalBadge.innerText = `${totalCount} Berita`;

            // Update KPI Cards
            const kpiTotal = document.getElementById('admin-news-kpi-total') || document.getElementById('admin-berita-kpi-total');
            const kpiViews = document.getElementById('admin-news-kpi-views') || document.getElementById('admin-berita-kpi-views');
            const kpiCategories = document.getElementById('admin-news-kpi-categories') || document.getElementById('admin-berita-kpi-categories');
            const kpiAuthors = document.getElementById('admin-news-kpi-authors') || document.getElementById('admin-berita-kpi-published');

            if (kpiTotal) kpiTotal.innerText = totalCount;
            if (kpiViews) {
                const totalViews = (mockNewsData || []).reduce((acc, n) => acc + (parseInt(n.views) || 0), 0);
                kpiViews.innerText = totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews;
            }
            if (kpiCategories) {
                const uniqueCats = new Set((mockNewsData || []).map(n => n.kategori).filter(Boolean));
                kpiCategories.innerText = uniqueCats.size || 1;
            }
            if (kpiAuthors) {
                const uniqueAuthors = new Set((mockNewsData || []).map(n => n.penulis).filter(Boolean));
                kpiAuthors.innerText = uniqueAuthors.size || 1;
            }

            if (!container) return;

            const list = itemsToRender !== null ? itemsToRender : (mockNewsData || []);

            if (list.length === 0) {
                container.innerHTML = "";
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            container.innerHTML = list.map((news) => {
                const thumbUrl = news.gambar && news.gambar.trim() !== '' 
                    ? news.gambar 
                    : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=600&auto=format&fit=crop';
                
                const viewsCount = typeof news.views !== 'undefined' ? Number(news.views).toLocaleString('id-ID') : '0';
                const ringkasanText = news.ringkasan || (news.isi ? news.isi.replace(/<[^>]*>/g, '').slice(0, 110) : '-');

                // Dynamic badge color based on kategori
                let badgeColor = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40";
                const katLower = (news.kategori || '').toLowerCase();
                if (katLower.includes('prestasi')) badgeColor = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40";
                else if (katLower.includes('kegiatan')) badgeColor = "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40";
                else if (katLower.includes('artikel')) badgeColor = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40";
                else if (katLower.includes('kajian')) badgeColor = "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40";

                return `
                    <div class="p-3.5 bg-slate-50/80 dark:bg-[#1a2634] hover:bg-white dark:hover:bg-[#1e2c3c] rounded-2xl border border-slate-200/80 dark:border-[#253447] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all duration-200 hover:shadow-md">
                        <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div class="w-24 sm:w-28 h-16 sm:h-18 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-[#253447] relative group">
                                <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(news.judul)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=600&auto=format&fit=crop'">
                            </div>
                            <div class="min-w-0 flex-1 space-y-1">
                                <div class="flex items-center flex-wrap gap-2">
                                    <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}">${escapeHtml(news.kategori || 'Umum')}</span>
                                    <span class="text-[10px] text-slate-400 font-medium flex items-center gap-1"><i class="fa-regular fa-calendar text-[9px]"></i> ${escapeHtml(news.tanggal || '-')}</span>
                                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md"><i class="fa-solid fa-eye text-[9px]"></i> ${viewsCount} views</span>
                                </div>
                                <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug hover:text-emerald-600 transition cursor-pointer" onclick="editAdminNews('${news.news_id}')" title="${escapeHtml(news.judul)}">${escapeHtml(news.judul)}</h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">${escapeHtml(ringkasanText)}</p>
                                <p class="text-[10px] text-slate-400 font-medium flex items-center gap-1"><i class="fa-solid fa-feather-pointed text-[9px]"></i> Penulis: <strong class="text-slate-600 dark:text-slate-300 font-semibold">${escapeHtml(news.penulis || 'Redaksi')}</strong></p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-[#253447] w-full sm:w-auto justify-end">
                            <button type="button" onclick="bacaBerita('${news.news_id || news.slug}')" class="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95" title="Lihat Tampilan Web Publik">
                                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                <span class="text-[10px] hidden md:inline">Pratinjau</span>
                            </button>
                            <button type="button" onclick="editAdminNews('${news.news_id}')" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95" title="Edit Berita">
                                <i class="fa-solid fa-pen text-[10px]"></i>
                                <span class="text-[10px]">Edit</span>
                            </button>
                            <button type="button" onclick="deleteAdminNews('${news.news_id}')" class="w-8 h-8 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-xl flex items-center justify-center text-xs transition active:scale-95" title="Hapus Berita">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ---------- SINKRONISASI & FORMATTING RICH TEXT CONTENT EDITOR ----------
        function formatNewsEditorText(command, value = null) {
            const editor = document.getElementById('admin-news-editor');
            if (editor) editor.focus();
            document.execCommand(command, false, value);
            syncAdminNewsEditorToTextarea();
        }

        function syncAdminNewsEditorToTextarea() {
            const editor = document.getElementById('admin-news-editor');
            const textarea = document.getElementById('admin-news-isi');
            if (editor && textarea) {
                textarea.value = editor.innerHTML.trim();
            }
        }

        // ---------- CROP 16:9 & KOMPRESI OTOMATIS <= 250KB ----------
        function handleAdminNewsFileSelected(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast("⚠️ Mohon pilih file gambar yang valid (JPG, PNG, WebP).");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    adminNewsRawImage = img;
                    resetAdminNewsCropPosition();
                    openAdminNewsCropModal();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function openAdminNewsCropModal() {
            if (!adminNewsRawImage) return;
            const modal = document.getElementById('modal-admin-news-crop');
            const content = document.getElementById('modal-admin-news-crop-content');
            if (!modal || !content) return;

            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
                initAdminNewsCropCanvas();
            }, 30);
        }

        function closeAdminNewsCropModal() {
            const modal = document.getElementById('modal-admin-news-crop');
            const content = document.getElementById('modal-admin-news-crop-content');
            if (!modal || !content) return;

            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }

        function resetAdminNewsCropPosition() {
            adminNewsCropState.zoom = 1;
            adminNewsCropState.panX = 0;
            adminNewsCropState.panY = 0;
            const zoomSlider = document.getElementById('admin-news-crop-zoom');
            if (zoomSlider) zoomSlider.value = "1";
            clampAdminNewsPan();
            drawAdminNewsCropCanvas();
        }

        function clampAdminNewsPan() {
            if (!adminNewsRawImage) return;
            const canvas = document.getElementById('admin-news-crop-canvas');
            if (!canvas) return;

            const baseScale = Math.max(canvas.width / adminNewsRawImage.width, canvas.height / adminNewsRawImage.height);
            const scale = baseScale * (adminNewsCropState.zoom || 1);
            const drawWidth = adminNewsRawImage.width * scale;
            const drawHeight = adminNewsRawImage.height * scale;

            if (drawWidth > canvas.width) {
                const maxPanX = (drawWidth - canvas.width) / 2;
                adminNewsCropState.panX = Math.min(maxPanX, Math.max(-maxPanX, adminNewsCropState.panX));
            } else {
                adminNewsCropState.panX = 0;
            }

            if (drawHeight > canvas.height) {
                const maxPanY = (drawHeight - canvas.height) / 2;
                adminNewsCropState.panY = Math.min(maxPanY, Math.max(-maxPanY, adminNewsCropState.panY));
            } else {
                adminNewsCropState.panY = 0;
            }
        }

        function initAdminNewsCropCanvas() {
            const canvas = document.getElementById('admin-news-crop-canvas');
            const viewport = document.getElementById('admin-news-crop-viewport');
            const zoomSlider = document.getElementById('admin-news-crop-zoom');
            if (!canvas || !viewport) return;

            // Target canvas 16:9 internal resolution
            canvas.width = 640;
            canvas.height = 360;

            if (zoomSlider && !zoomSlider._bound) {
                zoomSlider._bound = true;
                zoomSlider.addEventListener('input', function() {
                    adminNewsCropState.zoom = parseFloat(this.value) || 1;
                    clampAdminNewsPan();
                    drawAdminNewsCropCanvas();
                });
            }

            // Mouse & Touch Dragging Events
            if (!viewport._dragBound) {
                viewport._dragBound = true;

                let initialPinchDistance = 0;
                let initialPinchZoom = 1;

                const onPointerDown = (clientX, clientY) => {
                    adminNewsCropState.isDragging = true;
                    adminNewsCropState.lastClientX = clientX;
                    adminNewsCropState.lastClientY = clientY;
                };

                const onPointerMove = (clientX, clientY) => {
                    if (!adminNewsCropState.isDragging) return;
                    const rect = canvas.getBoundingClientRect();
                    const scaleFactorX = canvas.width / (rect.width || 1);
                    const scaleFactorY = canvas.height / (rect.height || 1);
                    const dx = (clientX - adminNewsCropState.lastClientX) * scaleFactorX;
                    const dy = (clientY - adminNewsCropState.lastClientY) * scaleFactorY;
                    adminNewsCropState.panX += dx;
                    adminNewsCropState.panY += dy;
                    adminNewsCropState.lastClientX = clientX;
                    adminNewsCropState.lastClientY = clientY;
                    clampAdminNewsPan();
                    drawAdminNewsCropCanvas();
                };

                const onPointerUp = () => {
                    adminNewsCropState.isDragging = false;
                };

                viewport.addEventListener('mousedown', e => onPointerDown(e.clientX, e.clientY));
                window.addEventListener('mousemove', e => onPointerMove(e.clientX, e.clientY));
                window.addEventListener('mouseup', onPointerUp);

                viewport.addEventListener('touchstart', e => {
                    if (e.touches.length === 1) {
                        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                    } else if (e.touches.length === 2) {
                        adminNewsCropState.isDragging = false;
                        initialPinchDistance = Math.hypot(
                            e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY
                        );
                        initialPinchZoom = adminNewsCropState.zoom || 1;
                    }
                }, { passive: true });

                window.addEventListener('touchmove', e => {
                    if (adminNewsCropState.isDragging && e.touches.length === 1) {
                        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
                        const dist = Math.hypot(
                            e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY
                        );
                        const factor = dist / initialPinchDistance;
                        let newZoom = Math.min(3, Math.max(0.5, initialPinchZoom * factor));
                        adminNewsCropState.zoom = Math.round(newZoom * 100) / 100;
                        if (zoomSlider) zoomSlider.value = adminNewsCropState.zoom;
                        clampAdminNewsPan();
                        drawAdminNewsCropCanvas();
                    }
                }, { passive: true });

                window.addEventListener('touchend', e => {
                    if (e.touches.length === 0) {
                        onPointerUp();
                        initialPinchDistance = 0;
                    } else if (e.touches.length === 1) {
                        initialPinchDistance = 0;
                        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                    }
                });

                viewport.addEventListener('wheel', e => {
                    e.preventDefault();
                    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
                    let newZoom = Math.min(3, Math.max(0.5, (adminNewsCropState.zoom || 1) + zoomDelta));
                    adminNewsCropState.zoom = Math.round(newZoom * 100) / 100;
                    if (zoomSlider) zoomSlider.value = adminNewsCropState.zoom;
                    clampAdminNewsPan();
                    drawAdminNewsCropCanvas();
                }, { passive: false });
            }

            clampAdminNewsPan();
            drawAdminNewsCropCanvas();
        }

        function drawAdminNewsCropCanvas() {
            const canvas = document.getElementById('admin-news-crop-canvas');
            if (!canvas || !adminNewsRawImage) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            clampAdminNewsPan();

            // Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Compute minimum scale to cover 16:9 area
            const baseScale = Math.max(canvas.width / adminNewsRawImage.width, canvas.height / adminNewsRawImage.height);
            const scale = baseScale * (adminNewsCropState.zoom || 1);

            const drawWidth = adminNewsRawImage.width * scale;
            const drawHeight = adminNewsRawImage.height * scale;

            // If zoomed out, draw aesthetic blurred backdrop to prevent empty gaps
            if (drawWidth < canvas.width || drawHeight < canvas.height) {
                ctx.save();
                ctx.filter = 'blur(16px) brightness(0.4)';
                const bgScale = Math.max(canvas.width / adminNewsRawImage.width, canvas.height / adminNewsRawImage.height);
                const bgW = adminNewsRawImage.width * bgScale;
                const bgH = adminNewsRawImage.height * bgScale;
                ctx.drawImage(adminNewsRawImage, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
                ctx.restore();
            }

            // Center image plus user pan offset
            const drawX = (canvas.width - drawWidth) / 2 + adminNewsCropState.panX;
            const drawY = (canvas.height - drawHeight) / 2 + adminNewsCropState.panY;

            ctx.drawImage(adminNewsRawImage, drawX, drawY, drawWidth, drawHeight);
        }

        // Iterative compression function - seimbang antara kualitas tajam & ringan untuk web modern (maks targetMaxKB, menjaga rasio asli tanpa melar)
        async function compressCanvasToMax250KB(sourceCanvas, targetMaxKB = 250) {
            const exportCanvas = document.createElement('canvas');
            let width = sourceCanvas.width || 800;
            let height = sourceCanvas.height || 600;
            const maxSide = 1600;
            if (width > maxSide || height > maxSide) {
                if (width > height) {
                    height = Math.round((height * maxSide) / width);
                    width = maxSide;
                } else {
                    width = Math.round((width * maxSide) / height);
                    height = maxSide;
                }
            }
            exportCanvas.width = width;
            exportCanvas.height = height;
            const ctx = exportCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(sourceCanvas, 0, 0, width, height);

            // Base64 limit calculation (1 byte ~ 1.37 base64 chars)
            const maxChars = targetMaxKB * 1024 * 1.37;

            let format = 'image/webp';
            let quality = 0.90;
            let base64 = exportCanvas.toDataURL(format, quality);

            // Fallback to jpeg if browser doesn't export webp
            if (!base64.startsWith('data:image/webp')) {
                format = 'image/jpeg';
                base64 = exportCanvas.toDataURL(format, quality);
            }

            // Quality loop — langkah kecil untuk menjaga detail tetap tajam
            while (base64.length > maxChars && quality > 0.55) {
                quality -= 0.04;
                base64 = exportCanvas.toDataURL(format, quality);
            }

            // If still above target, scale down dimension while strictly preserving aspect ratio
            if (base64.length > maxChars) {
                const scaleFactor = 0.85;
                exportCanvas.width = Math.max(200, Math.round(width * scaleFactor));
                exportCanvas.height = Math.max(200, Math.round(height * scaleFactor));
                const ctx2 = exportCanvas.getContext('2d');
                ctx2.imageSmoothingEnabled = true;
                ctx2.imageSmoothingQuality = 'high';
                ctx2.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
                quality = 0.82;
                base64 = exportCanvas.toDataURL(format, quality);
                while (base64.length > maxChars && quality > 0.50) {
                    quality -= 0.04;
                    base64 = exportCanvas.toDataURL(format, quality);
                }
            }

            return base64;
        }

        async function applyAdminNewsCrop() {
            const canvas = document.getElementById('admin-news-crop-canvas');
            if (!canvas || !adminNewsRawImage) return;

            try {
                // Render at high-res 16:9 offscreen (1600x900)
                const hiResCanvas = document.createElement('canvas');
                hiResCanvas.width = 1600;
                hiResCanvas.height = 900;
                const hiCtx = hiResCanvas.getContext('2d');
                hiCtx.imageSmoothingEnabled = true;
                hiCtx.imageSmoothingQuality = 'high';

                // Background
                hiCtx.fillStyle = '#0f172a';
                hiCtx.fillRect(0, 0, hiResCanvas.width, hiResCanvas.height);

                const ratio = hiResCanvas.width / canvas.width;
                const baseScale = Math.max(hiResCanvas.width / adminNewsRawImage.width, hiResCanvas.height / adminNewsRawImage.height);
                const scale = baseScale * (adminNewsCropState.zoom || 1);
                const drawWidth = adminNewsRawImage.width * scale;
                const drawHeight = adminNewsRawImage.height * scale;

                if (drawWidth < hiResCanvas.width || drawHeight < hiResCanvas.height) {
                    hiCtx.save();
                    hiCtx.filter = 'blur(24px) brightness(0.4)';
                    const bgScale = Math.max(hiResCanvas.width / adminNewsRawImage.width, hiResCanvas.height / adminNewsRawImage.height);
                    const bgW = adminNewsRawImage.width * bgScale;
                    const bgH = adminNewsRawImage.height * bgScale;
                    hiCtx.drawImage(adminNewsRawImage, (hiResCanvas.width - bgW) / 2, (hiResCanvas.height - bgH) / 2, bgW, bgH);
                    hiCtx.restore();
                }

                const drawX = (hiResCanvas.width - drawWidth) / 2 + (adminNewsCropState.panX * ratio);
                const drawY = (hiResCanvas.height - drawHeight) / 2 + (adminNewsCropState.panY * ratio);

                hiCtx.drawImage(adminNewsRawImage, drawX, drawY, drawWidth, drawHeight);

                // Compress with optimal target 250 KB — kualitas seimbang
                const compressedBase64 = await compressCanvasToMax250KB(hiResCanvas, 250);
                adminNewsCroppedBase64 = compressedBase64;

                const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);

                // Update UI preview
                const previewImg = document.getElementById('admin-news-preview-img');
                const placeholder = document.getElementById('admin-news-preview-placeholder');
                const sizeBadge = document.getElementById('admin-news-size-badge');
                const sizeText = document.getElementById('admin-news-size-text');
                const recropBtn = document.getElementById('admin-news-recrop-btn');
                const removeBtn = document.getElementById('admin-news-remove-img-btn');

                if (previewImg) {
                    previewImg.src = compressedBase64;
                    previewImg.classList.remove('hidden');
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (sizeText) sizeText.innerText = `Ukuran: ${sizeKB} KB (Ringan & Cepat)`;
                if (sizeBadge) sizeBadge.classList.remove('hidden');
                if (recropBtn) recropBtn.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');

                closeAdminNewsCropModal();
                showToast(`✅ Foto 16:9 berhasil dipotong & dioptimalkan (${sizeKB} KB)!`);
            } catch (err) {
                console.error("Gagal crop berita:", err);
                showToast("❌ Gagal memproses pemotongan gambar: " + err.message);
            }
        }

        function clearAdminNewsPhoto() {
            adminNewsRawImage = null;
            adminNewsCroppedBase64 = null;
            adminNewsExistingGambar = '';
            const fileInput = document.getElementById('admin-news-file');
            if (fileInput) fileInput.value = "";

            const previewImg = document.getElementById('admin-news-preview-img');
            const placeholder = document.getElementById('admin-news-preview-placeholder');
            const sizeBadge = document.getElementById('admin-news-size-badge');
            const recropBtn = document.getElementById('admin-news-recrop-btn');
            const removeBtn = document.getElementById('admin-news-remove-img-btn');

            if (previewImg) {
                previewImg.src = "";
                previewImg.classList.add('hidden');
            }
            if (placeholder) placeholder.classList.remove('hidden');
            if (sizeBadge) sizeBadge.classList.add('hidden');
            if (recropBtn) recropBtn.classList.add('hidden');
            if (removeBtn) removeBtn.classList.add('hidden');
        }

        // ---------- MODAL SISIPKAN GAMBAR DI TENGAH BERITA ----------
        function openAdminNewsInlineImageModal() {
            adminNewsInlineRawImage = null;
            adminNewsInlineSelectedBase64 = null;
            adminNewsInlineCurrentRatio = 'original';
            const modal = document.getElementById('modal-admin-news-inline-img');
            const content = document.getElementById('modal-admin-news-inline-content');
            const fileInput = document.getElementById('admin-news-inline-input');
            const captionInput = document.getElementById('admin-news-inline-caption');
            const previewWrap = document.getElementById('admin-news-inline-preview-wrap');
            const cropOptions = document.getElementById('admin-news-inline-crop-options');

            if (fileInput) fileInput.value = "";
            if (captionInput) captionInput.value = "";
            if (previewWrap) previewWrap.classList.add('hidden');
            if (cropOptions) cropOptions.classList.add('hidden');
            updateAdminNewsInlineCropRatioUI();

            if (!modal || !content) return;
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 30);
        }

        function closeAdminNewsInlineImageModal() {
            const modal = document.getElementById('modal-admin-news-inline-img');
            const content = document.getElementById('modal-admin-news-inline-content');
            if (!modal || !content) return;

            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }

        function updateAdminNewsInlineCropRatioUI() {
            const ratios = ['original', '16-9', '4-3', '1-1'];
            ratios.forEach(r => {
                const btn = document.getElementById(`btn-crop-inline-${r}`);
                if (!btn) return;
                const activeKey = adminNewsInlineCurrentRatio === '16:9' ? '16-9' : (adminNewsInlineCurrentRatio === '4:3' ? '4-3' : (adminNewsInlineCurrentRatio === '1:1' ? '1-1' : 'original'));
                if (r === activeKey) {
                    btn.className = "px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition text-center bg-emerald-600 text-white border-emerald-600 shadow-xs";
                } else {
                    btn.className = "px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center";
                }
            });
        }

        async function setAdminNewsInlineCropRatio(ratio) {
            adminNewsInlineCurrentRatio = ratio;
            updateAdminNewsInlineCropRatioUI();
            if (adminNewsInlineRawImage) {
                await processAdminNewsInlineImage();
            }
        }

        async function processAdminNewsInlineImage() {
            if (!adminNewsInlineRawImage) return;

            const rawW = adminNewsInlineRawImage.width;
            const rawH = adminNewsInlineRawImage.height;

            let cropX = 0;
            let cropY = 0;
            let cropW = rawW;
            let cropH = rawH;

            if (adminNewsInlineCurrentRatio === '16:9') {
                const targetAspect = 16 / 9;
                if (rawW / rawH > targetAspect) {
                    cropH = rawH;
                    cropW = Math.round(rawH * targetAspect);
                    cropX = Math.round((rawW - cropW) / 2);
                    cropY = 0;
                } else {
                    cropW = rawW;
                    cropH = Math.round(rawW / targetAspect);
                    cropX = 0;
                    cropY = Math.round((rawH - cropH) / 2);
                }
            } else if (adminNewsInlineCurrentRatio === '4:3') {
                const targetAspect = 4 / 3;
                if (rawW / rawH > targetAspect) {
                    cropH = rawH;
                    cropW = Math.round(rawH * targetAspect);
                    cropX = Math.round((rawW - cropW) / 2);
                    cropY = 0;
                } else {
                    cropW = rawW;
                    cropH = Math.round(rawW / targetAspect);
                    cropX = 0;
                    cropY = Math.round((rawH - cropH) / 2);
                }
            } else if (adminNewsInlineCurrentRatio === '1:1') {
                const minSide = Math.min(rawW, rawH);
                cropW = minSide;
                cropH = minSide;
                cropX = Math.round((rawW - minSide) / 2);
                cropY = Math.round((rawH - minSide) / 2);
            } // 'original' uses full uncropped image

            // Scale to max side 1200 for sharp detail & fast loading
            let targetW = cropW;
            let targetH = cropH;
            const maxDim = 1200;
            if (targetW > maxDim || targetH > maxDim) {
                if (targetW > targetH) {
                    targetH = Math.round((targetH * maxDim) / targetW);
                    targetW = maxDim;
                } else {
                    targetW = Math.round((targetW * maxDim) / targetH);
                    targetH = maxDim;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(adminNewsInlineRawImage, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

            const compressed = await compressCanvasToMax250KB(canvas, 150);
            adminNewsInlineSelectedBase64 = compressed;

            const previewImg = document.getElementById('admin-news-inline-preview-img');
            const previewWrap = document.getElementById('admin-news-inline-preview-wrap');
            const sizeBadge = document.getElementById('admin-news-inline-size-badge');

            if (previewImg) previewImg.src = compressed;
            if (previewWrap) previewWrap.classList.remove('hidden');
            const sizeKB = Math.round(compressed.length * 0.75 / 1024);
            const ratioName = adminNewsInlineCurrentRatio === 'original' ? 'Asli (Bebas)' : (adminNewsInlineCurrentRatio === '16:9' ? '16:9 Landscape' : (adminNewsInlineCurrentRatio === '4:3' ? '4:3 Standar' : '1:1 Kotak'));
            if (sizeBadge) {
                sizeBadge.innerHTML = `<span class="font-semibold text-slate-700 dark:text-slate-200">Dimensi: ${targetW} × ${targetH} px</span> • Rasio: <span class="text-emerald-600 dark:text-emerald-400 font-semibold">${ratioName}</span> • Ukuran: <span class="font-semibold">${sizeKB} KB</span>`;
            }
        }

        function handleAdminNewsInlineFileSelect(input) {
            const file = input.files && input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = async function() {
                    adminNewsInlineRawImage = img;
                    const cropOptions = document.getElementById('admin-news-inline-crop-options');
                    if (cropOptions) cropOptions.classList.remove('hidden');
                    await processAdminNewsInlineImage();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function confirmInsertInlineImageToEditor() {
            if (!adminNewsInlineSelectedBase64) {
                showToast("⚠️ Silakan pilih foto terlebih dahulu.");
                return;
            }

            const caption = (document.getElementById('admin-news-inline-caption').value || '').trim();
            const captionHtml = caption ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 mt-2 italic font-medium">${escapeHtml(caption)}</figcaption>` : '';
            const figureHtml = `<figure class="my-4 text-center select-none block clear-both"><img src="${adminNewsInlineSelectedBase64}" alt="${escapeHtml(caption || 'Foto Berita')}" class="max-w-full h-auto mx-auto rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 object-contain inline-block" style="max-height: 520px;">${captionHtml}</figure><p><br></p>`;

            const editor = document.getElementById('admin-news-editor');
            if (editor) {
                editor.focus();
                const inserted = document.execCommand('insertHTML', false, figureHtml);
                if (!inserted) {
                    editor.innerHTML += figureHtml;
                }
                syncAdminNewsEditorToTextarea();
            }

            closeAdminNewsInlineImageModal();
            showToast("✅ Foto sisipan berhasil ditambahkan dengan proporsi rapi!");
        }

        // ---------- SUBMIT FORM BERITA ----------
        async function handleAdminNewsSubmit(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-submit-btn');
            const btnIcon = document.getElementById('admin-submit-icon');
            const btnText = document.getElementById('admin-submit-text');

            // Pastikan textarea selalu sinkron dengan visual rich editor
            syncAdminNewsEditorToTextarea();

            const formId = document.getElementById('admin-news-id').value;
            const isiKonten = document.getElementById('admin-news-isi').value.trim();

            if (!isiKonten) {
                showToast("⚠️ Isi berita tidak boleh kosong.");
                return;
            }

            btn.disabled = true;
            btnIcon.className = "fa-solid fa-spinner animate-spin";
            btnText.innerText = "Mengunggah & Menyimpan Berita...";

            try {
                let fileData = adminNewsCroppedBase64;
                if (!fileData) {
                    const rawFile = document.getElementById('admin-news-file').files[0];
                    if (rawFile) {
                        fileData = await readFileAsBase64(rawFile);
                    }
                }

                // Foto sisipan di tengah berita (inline) TIDAK BOLEH menimpa foto utama.
                // fileData hanya berisi foto jika pengguna memilih/mengunggah foto utama baru.

                // Normalisasi fileData menjadi object { base64, mimeType, name }
                if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
                    const parts = fileData.split(',');
                    const mimeMatch = parts[0].match(/:(.*?);/);
                    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
                    const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
                    fileData = {
                        base64: parts[1],
                        mimeType: mimeType,
                        name: 'berita_' + Date.now() + ext
                    };
                }

                let existingViews = 0;
                if (formId && Array.isArray(mockNewsData)) {
                    const exItem = mockNewsData.find(n => String(n.news_id) === String(formId) || String(n.id) === String(formId));
                    if (exItem && typeof exItem.views !== 'undefined') {
                        existingViews = Number(exItem.views) || 0;
                    }
                }

                const token = getAdminSessionToken();
                const payload = {
                    news_id: formId,
                    judul: document.getElementById('admin-news-judul').value.trim(),
                    kategori: document.getElementById('admin-news-kategori').value,
                    penulis: document.getElementById('admin-news-penulis').value.trim(),
                    ringkasan: document.getElementById('admin-news-ringkasan').value.trim(),
                    isi: isiKonten,
                    gambarLama: adminNewsExistingGambar || '',
                    file: fileData,
                    views: existingViews
                };

                if (!isApiConfigured()) {
                    throw new Error("API backend belum dikonfigurasi.");
                }

                const actionName = formId ? "updateBerita" : "saveBerita";
                const response = await apiPost(actionName, { token, data: payload });

                btn.disabled = false;
                btnIcon.className = "fa-solid fa-paper-plane";
                btnText.innerText = formId ? "Simpan Perubahan Berita" : "Publikasikan Berita";

                if (response && response.success) {
                    showToast("✅ Berita berhasil disimpan!");
                    resetAdminNewsForm();
                    loadNews();
                } else {
                    showToast("❌ Gagal: " + (response ? response.message : "Terjadi kesalahan"));
                }

            } catch (err) {
                console.error("Submit Error: ", err);
                btn.disabled = false;
                btnIcon.className = "fa-solid fa-paper-plane";
                btnText.innerText = formId ? "Simpan Perubahan Berita" : "Publikasikan Berita";
                showToast("❌ Gagal memproses data: " + err.message);
            }
        }

        function editAdminNews(id) {
            const news = mockNewsData.find(n => n.news_id === id);
            if (!news) return;

            document.getElementById('admin-news-id').value = id;
            document.getElementById('admin-news-judul').value = news.judul || '';
            document.getElementById('admin-news-kategori').value = news.kategori || 'Kabar';
            document.getElementById('admin-news-penulis').value = news.penulis || 'Admin';
            document.getElementById('admin-news-ringkasan').value = news.ringkasan || '';
            
            // Format isi ke editor visual
            const editor = document.getElementById('admin-news-editor');
            const textarea = document.getElementById('admin-news-isi');
            let contentHtml = news.isi || '';
            // Jika konten lama berupa teks polos tanpa HTML tag, konversi newline ke <p> / <br>
            if (contentHtml && !/<[a-z][\s\S]*>/i.test(contentHtml)) {
                contentHtml = contentHtml.split('\n\n').map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
            }
            // Bersihkan inline style warna teks gelap/hitam statis agar adaptif & kontras tinggi di dark mode
            if (contentHtml) {
                contentHtml = contentHtml.replace(/style\s*=\s*["'][^"']*color\s*:\s*(?:#000000|#000|#111|#222|#333|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))[^"']*["']/gi, '');
                contentHtml = contentHtml.replace(/<font\s+color=["'](?:#000000|#000|#111|#222|#333|black)["']>([\s\S]*?)<\/font>/gi, '$1');
            }
            if (editor) editor.innerHTML = contentHtml;
            if (textarea) textarea.value = contentHtml;

            // Foto Berita
            clearAdminNewsPhoto();
            if (news.gambar && news.gambar.trim() !== '') {
                adminNewsExistingGambar = news.gambar;
                const previewImg = document.getElementById('admin-news-preview-img');
                const placeholder = document.getElementById('admin-news-preview-placeholder');
                const sizeBadge = document.getElementById('admin-news-size-badge');
                const sizeText = document.getElementById('admin-news-size-text');
                const removeBtn = document.getElementById('admin-news-remove-img-btn');

                if (previewImg) {
                    previewImg.src = news.gambar;
                    previewImg.classList.remove('hidden');
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (sizeText) sizeText.innerText = "Foto tersimpan di server";
                if (sizeBadge) sizeBadge.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
            }

            document.getElementById('admin-form-title').innerHTML = `<i class="fa-solid fa-pen text-amber-600 mr-2"></i> Edit Berita`;
            document.getElementById('admin-submit-text').innerText = "Simpan Perubahan Berita";
            document.getElementById('admin-cancel-edit-btn').classList.remove('hidden');

            toggleAdminNewsForm(true);
        }

        function resetAdminNewsForm() {
            document.getElementById('adminNewsForm').reset();
            document.getElementById('admin-news-id').value = "";
            
            const editor = document.getElementById('admin-news-editor');
            const textarea = document.getElementById('admin-news-isi');
            if (editor) editor.innerHTML = "";
            if (textarea) textarea.value = "";

            clearAdminNewsPhoto();

            document.getElementById('admin-form-title').innerHTML = `Tambah Berita Baru`;
            document.getElementById('admin-submit-text').innerText = "Publikasikan Berita";
            document.getElementById('admin-cancel-edit-btn').classList.add('hidden');
        }

        async function deleteAdminNews(id) {
            if (confirm("Apakah Anda yakin ingin menghapus berita ini?")) {
                try {
                    const token = getAdminSessionToken();
                    if (!isApiConfigured()) throw new Error("API belum dikonfigurasi.");
                    const response = await apiPost("deleteBerita", { token, data: { news_id: id } });
                    if (response && response.success) {
                        showToast("Berita berhasil dihapus.");
                        loadNews(); // Refresh from backend
                    } else {
                        showToast("❌ Gagal menghapus: " + (response ? response.message : "Error"));
                    }
                } catch (e) {
                    console.error("Gagal hapus:", e);
                    showToast("❌ Terjadi kesalahan jaringan.");
                }
            }
        }

        // ==================== DASHBOARD ADMIN: PENGATURAN BANNER ====================
        function previewBannerLive(event) {
            const input = event.target;
            const previewImg = document.getElementById('admin-banner-preview-img');
            const placeholder = document.getElementById('admin-banner-preview-placeholder');

            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewImg.src = e.target.result;
                    previewImg.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

        function toggleBannerActionInput(type) {
            const targetContainer = document.getElementById('admin-banner-target-container');
            const tabSelect = document.getElementById('admin-banner-target-tab');
            const urlInput = document.getElementById('admin-banner-target-url');
            const label = document.getElementById('admin-banner-target-label');

            if (type === 'tab') {
                targetContainer.classList.remove('hidden');
                tabSelect.classList.remove('hidden');
                urlInput.classList.add('hidden');
                label.innerText = "Pilih Tab Tujuan";
            } else if (type === 'url') {
                targetContainer.classList.remove('hidden');
                tabSelect.classList.add('hidden');
                urlInput.classList.remove('hidden');
                label.innerText = "Masukkan Link / URL Tujuan";
            } else {
                targetContainer.classList.add('hidden');
            }
        }

        let isAdminBannerFormOpen = false;
        let currentAdminBannerStatusFilter = 'all';

        function toggleAdminBannerForm(forceState = null) {
            const formSection = document.getElementById('admin-banner-form-section');
            const toggleIcon = document.getElementById('admin-banner-toggle-icon');
            const toggleText = document.getElementById('admin-banner-toggle-text');
            const toggleBtn = document.getElementById('admin-banner-toggle-btn');
            if (!formSection) return;

            if (forceState !== null) {
                isAdminBannerFormOpen = forceState;
            } else {
                isAdminBannerFormOpen = !isAdminBannerFormOpen;
            }

            if (isAdminBannerFormOpen) {
                formSection.classList.remove('hidden');
                if (toggleIcon) toggleIcon.className = "fa-solid fa-chevron-up text-xs";
                if (toggleText) toggleText.innerText = "Tutup Form Banner";
                if (toggleBtn) {
                    toggleBtn.className = "px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95";
                }
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                    const namaInput = document.getElementById('admin-banner-nama');
                    if (namaInput) namaInput.focus();
                }, 250);
            } else {
                formSection.classList.add('hidden');
                if (toggleIcon) toggleIcon.className = "fa-solid fa-plus text-xs";
                if (toggleText) toggleText.innerText = "Tambah Banner Baru";
                if (toggleBtn) {
                    toggleBtn.className = "px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm active:scale-95";
                }
            }
        }
        window.toggleAdminBannerForm = toggleAdminBannerForm;

        function setAdminBannerStatusFilter(status) {
            currentAdminBannerStatusFilter = status;
            document.querySelectorAll('.admin-banner-filter-chip').forEach(btn => {
                const s = btn.getAttribute('data-banner-status');
                if (s === status) {
                    btn.className = "admin-banner-filter-chip px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-slate-900 shadow-sm transition shrink-0";
                } else {
                    btn.className = "admin-banner-filter-chip px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0";
                }
            });
            filterAdminBannerList();
        }
        window.setAdminBannerStatusFilter = setAdminBannerStatusFilter;

        function filterAdminBannerList() {
            const searchInput = document.getElementById('admin-banner-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            let filtered = mockBannerData || [];

            if (currentAdminBannerStatusFilter && currentAdminBannerStatusFilter !== 'all') {
                filtered = filtered.filter(b => (b.status || 'Aktif').toLowerCase() === currentAdminBannerStatusFilter.toLowerCase());
            }

            if (query) {
                filtered = filtered.filter(b => 
                    (b.nama || '').toLowerCase().includes(query) ||
                    (b.targetAksi || '').toLowerCase().includes(query) ||
                    (b.tipeAksi || '').toLowerCase().includes(query)
                );
            }

            renderAdminBannerList(filtered);
        }
        window.filterAdminBannerList = filterAdminBannerList;

        function renderAdminBannerList(itemsToRender = null) {
            const listContainer = document.getElementById('admin-banner-list');
            const totalBadge = document.getElementById('admin-total-banners');
            const hubBadge = document.getElementById('admin-hub-banner-count');
            const emptyState = document.getElementById('admin-banner-empty-state');

            const totalBanners = Array.isArray(mockBannerData) ? mockBannerData.length : 0;
            const activeCount = (mockBannerData || []).filter(b => b.status === "Aktif").length;
            if (hubBadge) hubBadge.innerText = `${activeCount} Aktif`;
            if (totalBadge) totalBadge.innerText = `${totalBanners} Banner`;

            // Update KPI Cards
            const bannerKpiTotal = document.getElementById('admin-banner-kpi-total');
            const bannerKpiActive = document.getElementById('admin-banner-kpi-active');
            const bannerKpiInteractive = document.getElementById('admin-banner-kpi-interactive');
            const bannerKpiInactive = document.getElementById('admin-banner-kpi-inactive') || document.getElementById('admin-banner-kpi-draft');

            if (bannerKpiTotal) bannerKpiTotal.innerText = totalBanners;
            if (bannerKpiActive) bannerKpiActive.innerText = activeCount;
            if (bannerKpiInteractive) {
                const interactiveCount = (mockBannerData || []).filter(b => b.tipeAksi && b.tipeAksi !== 'none').length;
                bannerKpiInteractive.innerText = interactiveCount;
            }
            if (bannerKpiInactive) bannerKpiInactive.innerText = totalBanners - activeCount;

            if (!listContainer) return;

            const list = itemsToRender !== null ? itemsToRender : (mockBannerData || []);

            if (list.length === 0) {
                listContainer.innerHTML = "";
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            listContainer.innerHTML = list.map((banner, idx) => {
                const originalIdx = mockBannerData.findIndex(b => b.id === banner.id);
                const actualIdx = originalIdx >= 0 ? originalIdx : idx;

                const isAktif = banner.status === "Aktif";
                const statusBadge = isAktif
                    ? `<span class="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md uppercase">Aktif</span>`
                    : `<span class="text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-md uppercase">Draft</span>`;

                let actionBadge = `<span class="text-[10px] text-slate-400 flex items-center gap-1"><i class="fa-regular fa-image"></i> Gambar Statis</span>`;
                if (banner.tipeAksi === "tab") {
                    actionBadge = `<span class="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40"><i class="fa-solid fa-folder-open text-[9px]"></i> Tab: <strong>#${escapeHtml(banner.targetAksi)}</strong></span>`;
                } else if (banner.tipeAksi === "url") {
                    actionBadge = `<span class="text-[10px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-800/40"><i class="fa-solid fa-link text-[9px]"></i> Link: <strong class="truncate max-w-[120px]">${escapeHtml(banner.targetAksi)}</strong></span>`;
                }

                return `
                    <div class="p-3.5 bg-slate-50/80 dark:bg-[#1a2634] hover:bg-white dark:hover:bg-[#1e2c3c] rounded-2xl border border-slate-200/80 dark:border-[#253447] flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 transition-all duration-200 hover:shadow-md">
                        <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-black shrink-0 border border-amber-300/40 shadow-xs">
                                #${banner.urutan}
                            </div>
                            <div class="w-32 sm:w-36 aspect-[3/1] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-[#253447] shrink-0 group relative shadow-xs">
                                <img src="${escapeHtml(banner.gambar || '')}" alt="${escapeHtml(banner.nama)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=600&auto=format&fit=crop'">
                            </div>
                            <div class="min-w-0 flex-1 space-y-1">
                                <div class="flex items-center flex-wrap gap-2">
                                    ${statusBadge}
                                    ${actionBadge}
                                </div>
                                <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug cursor-pointer hover:text-amber-600 transition" onclick="editAdminBanner(${actualIdx})" title="${escapeHtml(banner.nama)}">${escapeHtml(banner.nama)}</h4>
                                <p class="text-[10px] text-slate-400 font-medium">Urutan Tampil: Ke-${banner.urutan} di Beranda Utama</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-[#253447] w-full md:w-auto justify-end">
                            <button type="button" onclick="toggleAdminBannerStatus('${banner.id}', '${isAktif ? 'Nonaktif' : 'Aktif'}')" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 dark:bg-[#1c2836] dark:hover:bg-[#253447] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-[#253447] shadow-xs transition flex items-center gap-1 active:scale-95" title="${isAktif ? 'Sembunyikan Banner' : 'Aktifkan Banner'}">
                                <i class="fa-solid ${isAktif ? 'fa-eye-slash text-amber-600' : 'fa-eye text-emerald-600'} text-xs"></i>
                                <span class="text-[10px] hidden sm:inline">${isAktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>
                            <button type="button" onclick="editAdminBanner(${actualIdx})" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95" title="Edit Data Banner">
                                <i class="fa-solid fa-pen text-[10px]"></i>
                                <span class="text-[10px]">Edit</span>
                            </button>
                            <button type="button" onclick="deleteAdminBanner('${banner.id}')" class="w-8 h-8 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-xl flex items-center justify-center text-xs transition active:scale-95" title="Hapus Banner">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function handleAdminBannerSubmit(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-banner-submit-btn');
            const btnIcon = document.getElementById('admin-banner-submit-icon');
            const btnText = document.getElementById('admin-banner-submit-text');

            const fileInput = document.getElementById('admin-banner-file');
            const file = fileInput.files[0];
            const oldImg = document.getElementById('admin-banner-old-img').value;

            if (!file && !oldImg) {
                showToast("Mohon pilih gambar banner terlebih dahulu!");
                return;
            }

            btn.disabled = true;
            btnIcon.className = "fa-solid fa-spinner animate-spin";
            btnText.innerText = "Mengunggah & Menyimpan Banner...";

            try {
                let fileData = null;
                if (file) {
                    fileData = await compressImageFile(file, 1600, 0.90);
                }

                const tipeAksi = document.getElementById('admin-banner-tipe-aksi').value;
                let targetAksi = "";
                if (tipeAksi === "tab") targetAksi = document.getElementById('admin-banner-target-tab').value;
                if (tipeAksi === "url") targetAksi = document.getElementById('admin-banner-target-url').value.trim();

                const payload = {
                    id: document.getElementById('admin-banner-id').value,
                    nama: document.getElementById('admin-banner-nama').value.trim(),
                    tipeAksi: tipeAksi,
                    targetAksi: targetAksi,
                    urutan: Number(document.getElementById('admin-banner-urutan').value) || 1,
                    status: document.getElementById('admin-banner-status').value,
                    gambarLama: oldImg,
                    file: fileData
                };

                if (!isApiConfigured()) {
                    throw new Error("API backend belum dikonfigurasi.");
                }

                const response = await apiPost("saveBanner", payload);

                btn.disabled = false;
                btnIcon.className = "fa-solid fa-cloud-arrow-up";
                btnText.innerText = "Simpan & Pasang Banner";

                if (response && response.success) {
                    showToast("✅ " + response.message);
                    resetAdminBannerForm();
                    if (typeof toggleAdminBannerForm === 'function') {
                        toggleAdminBannerForm(false);
                    }
                    try { localStorage.removeItem('asnawiyyah_banner_cache'); } catch (e) {}
                    loadBanners();
                } else {
                    showToast("❌ Gagal: " + (response ? response.message : "Terjadi kesalahan"));
                }

            } catch (err) {
                console.error("Banner Submit Error: ", err);
                btn.disabled = false;
                btnIcon.className = "fa-solid fa-cloud-arrow-up";
                btnText.innerText = "Simpan & Pasang Banner";
                showToast("❌ Gagal memproses banner: " + err.message);
            }
        }

        function editAdminBanner(index) {
            const banner = mockBannerData[index];
            if (!banner) return;

            document.getElementById('admin-banner-id').value = banner.id;
            document.getElementById('admin-banner-old-img').value = banner.gambar;
            document.getElementById('admin-banner-nama').value = banner.nama;
            document.getElementById('admin-banner-urutan').value = banner.urutan;
            document.getElementById('admin-banner-status').value = banner.status;

            document.getElementById('admin-banner-tipe-aksi').value = banner.tipeAksi;
            toggleBannerActionInput(banner.tipeAksi);

            if (banner.tipeAksi === "tab") {
                document.getElementById('admin-banner-target-tab').value = banner.targetAksi;
            } else if (banner.tipeAksi === "url") {
                document.getElementById('admin-banner-target-url').value = banner.targetAksi;
            }

            const previewImg = document.getElementById('admin-banner-preview-img');
            const placeholder = document.getElementById('admin-banner-preview-placeholder');
            if (banner.gambar) {
                previewImg.src = banner.gambar;
                previewImg.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }

            const titleEl = document.getElementById('admin-banner-form-title');
            if (titleEl) {
                titleEl.innerHTML = `<i class="fa-solid fa-pen text-amber-600 mr-2"></i> Edit Banner: #${banner.urutan} - ${escapeHtml(banner.nama)}`;
            }
            const submitText = document.getElementById('admin-banner-submit-text');
            if (submitText) {
                submitText.innerText = "Perbarui Data Banner";
            }
            const cancelBtn = document.getElementById('admin-cancel-banner-edit-btn');
            if (cancelBtn) {
                cancelBtn.classList.remove('hidden');
            }

            if (typeof toggleAdminBannerForm === 'function') {
                toggleAdminBannerForm(true);
            }
        }

        function resetAdminBannerForm() {
            const form = document.getElementById('adminBannerForm');
            if (form) form.reset();
            const idInput = document.getElementById('admin-banner-id');
            if (idInput) idInput.value = "";
            const oldImgInput = document.getElementById('admin-banner-old-img');
            if (oldImgInput) oldImgInput.value = "";

            const previewImg = document.getElementById('admin-banner-preview-img');
            const placeholder = document.getElementById('admin-banner-preview-placeholder');
            if (previewImg) {
                previewImg.src = "";
                previewImg.classList.add('hidden');
            }
            if (placeholder) {
                placeholder.classList.remove('hidden');
            }

            toggleBannerActionInput('tab');

            const titleEl = document.getElementById('admin-banner-form-title');
            if (titleEl) {
                titleEl.innerHTML = `<i class="fa-solid fa-plus-circle text-amber-600 mr-2"></i> Tambah Banner Baru`;
            }
            const submitText = document.getElementById('admin-banner-submit-text');
            if (submitText) {
                submitText.innerText = "Simpan & Pasang Banner";
            }
            const cancelBtn = document.getElementById('admin-cancel-banner-edit-btn');
            if (cancelBtn) {
                cancelBtn.classList.add('hidden');
            }
        }

        async function toggleAdminBannerStatus(bannerId, newStatus) {
            try {
                if (!isApiConfigured()) throw new Error("API backend belum dikonfigurasi.");

                const response = await apiPost("toggleBanner", { bannerId, newStatus });
                showToast(response && response.message ? response.message : "Status banner diperbarui.");

                if (response && response.success) {
                    try { localStorage.removeItem('asnawiyyah_banner_cache'); } catch (e) {}
                    await loadBanners();
                }
            } catch (err) {
                console.error("Gagal mengubah status banner:", err);
                showToast("❌ Gagal mengubah status banner: " + err.message);
            }
        }

        async function deleteAdminBanner(bannerId) {
            if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

            try {
                if (!isApiConfigured()) throw new Error("API backend belum dikonfigurasi.");

                const response = await apiPost("deleteBanner", { bannerId });
                showToast(response && response.message ? response.message : "Banner berhasil dihapus.");

                if (response && response.success) {
                    try { localStorage.removeItem('asnawiyyah_banner_cache'); } catch (e) {}
                    await loadBanners();
                }
            } catch (err) {
                console.error("Gagal menghapus banner:", err);
                showToast("❌ Gagal menghapus banner: " + err.message);
            }
        }

        // ==================== GALERI LOGIC (CLIENT & ADMIN) ====================
        let mockGaleriData = [];

        async function loadGaleri() {
            try {
                if (!isApiConfigured()) {
                    renderGaleriList();
                    if (document.getElementById('admin-galeri-list')) renderAdminGaleriList();
                    return;
                }

                const loader = document.getElementById('admin-galeri-loader');
                if (loader) loader.classList.remove('hidden');

                const response = await apiGet("getGaleri");
                if (loader) loader.classList.add('hidden');

                if (response && response.status === "success") {
                    mockGaleriData = response.data || [];
                }

                renderGaleriList();
                if (document.getElementById('admin-galeri-list')) renderAdminGaleriList();
            } catch (err) {
                console.error("Kesalahan jaringan saat memuat galeri:", err);
                const loader = document.getElementById('admin-galeri-loader');
                if (loader) loader.classList.add('hidden');
            }
        }

        // ==================== DASHBOARD ADMIN: MANAJEMEN GALERI ====================
        function renderAdminGaleriList() {
            const listContainer = document.getElementById('admin-galeri-list');
            const totalBadge = document.getElementById('admin-total-galeri');
            const hubBadge = document.getElementById('admin-hub-galeri-count');

            const activeCount = mockGaleriData.filter(g => g.status === "Aktif").length;
            if (hubBadge) hubBadge.innerText = `${activeCount} Aktif`;
            if (totalBadge) totalBadge.innerText = `${mockGaleriData.length} Foto`;

            // Update KPI Cards
            const galeriKpiTotal = document.getElementById('admin-galeri-kpi-total');
            const galeriKpiActive = document.getElementById('admin-galeri-kpi-active');
            const galeriKpiCategories = document.getElementById('admin-galeri-kpi-categories');
            const galeriKpiDraft = document.getElementById('admin-galeri-kpi-draft');

            if (galeriKpiTotal) galeriKpiTotal.innerText = mockGaleriData.length;
            if (galeriKpiActive) galeriKpiActive.innerText = activeCount;
            if (galeriKpiCategories) {
                const uniqueCats = new Set(mockGaleriData.map(g => g.kategori).filter(Boolean));
                galeriKpiCategories.innerText = uniqueCats.size || 1;
            }
            if (galeriKpiDraft) galeriKpiDraft.innerText = mockGaleriData.length - activeCount;

            if (!listContainer) return;
            listContainer.innerHTML = "";

            if (mockGaleriData.length === 0) {
                listContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">Belum ada foto galeri. Silakan tambah foto baru.</div>`;
                return;
            }

            mockGaleriData.forEach((galeri) => {
                const card = document.createElement('div');
                card.className = "p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5";

                const statusBadge = galeri.status === "Aktif"
                    ? `<span class="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase">Aktif</span>`
                    : `<span class="text-[9px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase">Draft</span>`;

                card.innerHTML = `
                    <div class="flex items-start gap-3">
                        <img src="${galeri.gambar}" alt="${galeri.judul}" class="w-20 h-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2">
                                <span class="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase shrink-0">${galeri.kategori}</span>
                                ${statusBadge}
                            </div>
                            <h4 class="text-xs font-bold text-slate-800 mt-1 truncate" title="${galeri.judul}">${galeri.judul}</h4>
                            <p class="text-[10px] text-slate-500 truncate">${galeri.keterangan || '-'}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-100/60 mt-1">
                        <button onclick="toggleAdminGaleriStatus('${galeri.id}', '${galeri.status === 'Aktif' ? 'Draft' : 'Aktif'}')" class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition">
                            ${galeri.status === 'Aktif' ? '<i class="fa-solid fa-eye-slash mr-1"></i> Sembunyikan' : '<i class="fa-solid fa-eye mr-1"></i> Tampilkan'}
                        </button>
                        <button onclick='editAdminGaleri(${JSON.stringify(galeri)})' class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 transition">
                            <i class="fa-solid fa-pen mr-1"></i> Edit
                        </button>
                        <button onclick="deleteAdminGaleri('${galeri.id}')" class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
                            <i class="fa-solid fa-trash mr-1"></i> Hapus
                        </button>
                    </div>
                `;
                listContainer.appendChild(card);
            });
        }

        async function handleAdminGaleriSubmit(event) {
            event.preventDefault();

            const id = document.getElementById('admin-galeri-id').value;
            const judul = document.getElementById('admin-galeri-judul').value;
            const kategori = document.getElementById('admin-galeri-kategori').value;
            const keterangan = document.getElementById('admin-galeri-keterangan').value;
            const status = document.getElementById('admin-galeri-status').value;
            const oldImg = document.getElementById('admin-galeri-gambar-lama').value;

            const fileInput = document.getElementById('admin-galeri-file');
            const file = fileInput.files[0];

            if (!file && !oldImg) {
                showToast("Mohon pilih gambar galeri terlebih dahulu!");
                return;
            }

            const btn = document.getElementById('admin-galeri-submit-btn');
            const originalBtnContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...';

            try {
                let fileData = null;
                if (file) fileData = await readFileAsBase64(file);

                const payload = {
                    id: id,
                    judul: judul,
                    kategori: kategori,
                    keterangan: keterangan,
                    status: status,
                    gambarLama: oldImg,
                    file: fileData
                };

                const response = await apiPost("saveGaleri", payload);

                if (response && response.success) {
                    showToast("Galeri berhasil disimpan!");
                    resetAdminGaleriForm();
                    await loadGaleri();
                } else {
                    showToast("❌ Gagal menyimpan galeri: " + (response ? response.message : "Terjadi kesalahan"));
                }
            } catch (err) {
                showToast("❌ Terjadi kesalahan: " + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalBtnContent;
            }
        }

        function editAdminGaleri(galeriData) {
            document.getElementById('admin-galeri-id').value = galeriData.id;
            document.getElementById('admin-galeri-judul').value = galeriData.judul;
            document.getElementById('admin-galeri-kategori').value = galeriData.kategori;
            document.getElementById('admin-galeri-keterangan').value = galeriData.keterangan;
            document.getElementById('admin-galeri-status').value = galeriData.status;
            document.getElementById('admin-galeri-gambar-lama').value = galeriData.gambar;

            document.getElementById('admin-galeri-file').removeAttribute('required');
            document.getElementById('req-galeri-img').classList.add('hidden');

            const previewContainer = document.getElementById('galeri-preview-container');
            const previewImg = document.getElementById('admin-galeri-preview-img');
            previewContainer.classList.remove('hidden');
            previewImg.src = galeriData.gambar;

            document.getElementById('admin-galeri-form-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-purple-700 mr-2"></i> Edit Galeri';
            document.getElementById('admin-cancel-galeri-btn').classList.remove('hidden');

            window.scrollTo({ top: document.getElementById('adminGaleriForm').offsetTop - 100, behavior: 'smooth' });
        }

        function resetAdminGaleriForm() {
            document.getElementById('adminGaleriForm').reset();
            document.getElementById('admin-galeri-id').value = "";
            document.getElementById('admin-galeri-gambar-lama').value = "";
            document.getElementById('admin-galeri-file').setAttribute('required', 'true');
            document.getElementById('req-galeri-img').classList.remove('hidden');

            document.getElementById('galeri-preview-container').classList.add('hidden');
            document.getElementById('admin-galeri-preview-img').src = "";

            document.getElementById('admin-galeri-form-title').innerHTML = '<i class="fa-solid fa-camera text-purple-700 mr-2"></i> Tambah Foto Galeri';
            document.getElementById('admin-cancel-galeri-btn').classList.add('hidden');
        }

        async function toggleAdminGaleriStatus(galeriId, newStatus) {
            try {
                const response = await apiPost("toggleGaleri", { galeriId, newStatus });
                showToast(response && response.message ? response.message : "Status diperbarui.");
                if (response && response.success) await loadGaleri();
            } catch (err) {
                showToast("❌ Gagal mengubah status galeri: " + err.message);
            }
        }

        async function deleteAdminGaleri(galeriId) {
            if (!confirm("Apakah Anda yakin ingin menghapus foto ini?")) return;
            try {
                const response = await apiPost("deleteGaleri", { galeriId });
                showToast(response && response.message ? response.message : "Galeri dihapus.");
                if (response && response.success) await loadGaleri();
            } catch (err) {
                showToast("❌ Gagal menghapus galeri: " + err.message);
            }
        }

        // ==================== UNIT KEGIATAN SANTRI (UKS) LOGIC (CLIENT & ADMIN) ====================
        let mockUnitKegiatanData = [
            {
                id: "UKS_01_SEMUT",
                nama: 'Teater "SEMUT"',
                kategori: "Divisi Teater HASANAH",
                jadwal: "2x Semesta / Tahun",
                deskripsi: "Unit kegiatan santri PPTQ Asnawiyyah yang berfokus pada pementasan drama atau teater di bawah naungan lembaga semi otonom HASANAH. Ditujukan sebagai wadah kreativitas untuk melatih mental dan rasa percaya diri santri saat berada di tengah masyarakat.",
                gambar: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop",
                urutan: 1,
                status: "Aktif"
            },
            {
                id: "UKS_02_MADING",
                nama: 'Mading "EL-Fata"',
                kategori: "Karya Literasi",
                jadwal: "Awal Bulan Hijriyah",
                deskripsi: "Unit kegiatan yang berfokus pada kreasi majalah dinding sebagai salah satu media untuk menampilkan karya seni, tulisan, dan kreativitas santri PPTQ Asnawiyyah yang terbit secara berkala setiap awal bulan Hijriyah.",
                gambar: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop",
                urutan: 2,
                status: "Aktif"
            },
            {
                id: "UKS_03_PERPUS",
                nama: 'Perpustakaan "Bait Al-Hikmah"',
                kategori: "Pusat Baca Santri",
                jadwal: "HASANAH",
                deskripsi: "Perpustakaan milik PPTQ Asnawiyyah yang berada di bawah naungan HASANAH. Dibangun guna melestarikan budaya membaca di kalangan santri serta menjadi jembatan penghubung antara santri dengan wawasan dunia luar lewat koleksi buku yang tersedia.",
                gambar: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop",
                urutan: 3,
                status: "Aktif"
            },
            {
                id: "UKS_04_REBANA",
                nama: 'Rebana "Az-Zahra"',
                kategori: "Seni Musik Islami",
                jadwal: "Malam Jumat & Event",
                deskripsi: "Unit kegiatan seni musik dengan aliran Hadroh Banjari Kontemporer (terbang, tam, darbuka, jidor). Ditampilkan rutin pada malam Jumat saat acara diba'an dan sebagai pembuka acara-acara penting di PPTQ Asnawiyyah.",
                gambar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
                urutan: 4,
                status: "Aktif"
            },
            {
                id: "UKS_05_PERS",
                nama: "Divisi PERS Asnawiyyah",
                kategori: "Media & Publikasi",
                jadwal: "Dokumentasi",
                deskripsi: "Divisi khusus yang berkonsentrasi pada media sosial resmi pesantren (Facebook, Instagram, YouTube, Twitter/X). Berperan mengabadikan dan mempublikasikan seluruh kegiatan serta event pesantren untuk mengenalkan PPTQ Asnawiyyah ke dunia luar.",
                gambar: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop",
                urutan: 5,
                status: "Aktif"
            }
        ];
        let filteredUnitKegiatanData = [];

        async function loadUnitKegiatan() {
            try {
                const loader = document.getElementById('admin-uks-loader');
                if (loader) loader.classList.remove('hidden');

                if (!isApiConfigured()) {
                    if (loader) loader.classList.add('hidden');
                    renderPublicUnitKegiatanList();
                    renderAdminUnitKegiatanList();
                    return;
                }

                const response = await apiGet("getUnitKegiatan");
                if (loader) loader.classList.add('hidden');

                if (response && response.status === "success" && Array.isArray(response.data) && response.data.length > 0) {
                    mockUnitKegiatanData = response.data;
                }

                renderPublicUnitKegiatanList();
                renderAdminUnitKegiatanList();
            } catch (err) {
                console.warn("Gagal memuat unit kegiatan dari server, menggunakan data lokal:", err);
                const loader = document.getElementById('admin-uks-loader');
                if (loader) loader.classList.add('hidden');
                renderPublicUnitKegiatanList();
                renderAdminUnitKegiatanList();
            }
        }

        function renderPublicUnitKegiatanList() {
            const container = document.getElementById('public-unit-kegiatan-container');
            if (!container) return;

            const activeItems = mockUnitKegiatanData.filter(item => item.status === "Aktif");
            if (activeItems.length === 0) {
                container.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Belum ada unit kegiatan santri yang dipublikasikan.</div>`;
                return;
            }

            container.innerHTML = activeItems.map((item, idx) => {
                const isEven = idx % 2 === 1;
                const flexDir = isEven ? "md:flex-row-reverse" : "md:flex-row";
                const imgUrl = item.gambar || "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop";

                return `
                    <div class="bg-slate-50 p-4 md:p-5 rounded-3xl border border-slate-100 flex flex-col ${flexDir} gap-4 items-center">
                        <div class="w-full md:w-48 h-36 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.nama)}" class="w-full h-full object-cover">
                        </div>
                        <div class="space-y-1.5 w-full">
                            <div class="flex items-center justify-between">
                                <span class="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">${escapeHtml(item.kategori || 'Unit Kegiatan')}</span>
                                <span class="text-[10px] text-slate-400 font-semibold"><i class="fa-solid fa-calendar-check mr-1"></i>${escapeHtml(item.jadwal || '-')}</span>
                            </div>
                            <h3 class="text-sm md:text-base font-bold text-slate-800">${escapeHtml(item.nama)}</h3>
                            <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(item.deskripsi)}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderAdminUnitKegiatanList(itemsToRender = null) {
            const container = document.getElementById('admin-uks-cards-container');
            const countBadge = document.getElementById('admin-uks-list-count');
            const hubBadge = document.getElementById('admin-hub-unit-kegiatan-count');
            const emptyState = document.getElementById('admin-uks-empty-state');

            const activeCount = mockUnitKegiatanData.filter(item => item.status === "Aktif").length;
            if (hubBadge) hubBadge.innerText = `${activeCount} Aktif`;
            if (countBadge) countBadge.innerText = `${mockUnitKegiatanData.length} Unit`;

            // Update KPI Cards
            const uksKpiTotal = document.getElementById('admin-uks-kpi-total');
            const uksKpiActive = document.getElementById('admin-uks-kpi-active');
            const uksKpiCategories = document.getElementById('admin-uks-kpi-categories');
            const uksKpiMentors = document.getElementById('admin-uks-kpi-mentors');

            if (uksKpiTotal) uksKpiTotal.innerText = mockUnitKegiatanData.length;
            if (uksKpiActive) uksKpiActive.innerText = activeCount;
            if (uksKpiCategories) {
                const uniqueCats = new Set(mockUnitKegiatanData.map(u => u.kategori).filter(Boolean));
                uksKpiCategories.innerText = uniqueCats.size || 1;
            }
            if (uksKpiMentors) {
                const mentorCount = mockUnitKegiatanData.filter(u => u.pembina && u.pembina.trim()).length;
                uksKpiMentors.innerText = mentorCount;
            }

            if (!container) return;
            container.innerHTML = "";

            const list = itemsToRender || mockUnitKegiatanData;

            if (list.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            list.forEach((item) => {
                const card = document.createElement('div');
                card.className = "p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between";

                const statusBadge = item.status === "Aktif"
                    ? `<span class="text-[9px] font-extrabold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md uppercase">Aktif</span>`
                    : `<span class="text-[9px] font-extrabold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-md uppercase">Nonaktif</span>`;

                const imgUrl = item.gambar || "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop";

                card.innerHTML = `
                    <div class="space-y-2.5">
                        <div class="flex items-start gap-3">
                            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.nama)}" class="w-20 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2">
                                    <span class="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase shrink-0">${escapeHtml(item.kategori || 'UKS')}</span>
                                    ${statusBadge}
                                    <span class="text-[10px] text-slate-400 font-bold ml-auto">#${item.urutan || 1}</span>
                                </div>
                                <h4 class="text-xs md:text-sm font-bold text-slate-800 mt-1 truncate" title="${escapeHtml(item.nama)}">${escapeHtml(item.nama)}</h4>
                                <p class="text-[10px] text-slate-500 font-semibold"><i class="fa-solid fa-clock text-slate-400 mr-1"></i>${escapeHtml(item.jadwal || '-')}</p>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">${escapeHtml(item.deskripsi || '')}</p>
                    </div>

                    <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                        <button onclick="toggleAdminUnitKegiatanStatus('${item.id}', '${item.status === 'Aktif' ? 'Nonaktif' : 'Aktif'}')" class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition">
                            ${item.status === 'Aktif' ? '<i class="fa-solid fa-eye-slash mr-1"></i> Nonaktifkan' : '<i class="fa-solid fa-eye mr-1"></i> Aktifkan'}
                        </button>
                        <button onclick='editAdminUnitKegiatan(${JSON.stringify(item)})' class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition">
                            <i class="fa-solid fa-pen mr-1"></i> Edit
                        </button>
                        <button onclick="deleteAdminUnitKegiatan('${item.id}')" class="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
                            <i class="fa-solid fa-trash mr-1"></i> Hapus
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function filterAdminUnitKegiatanList() {
            const query = (document.getElementById('admin-uks-search')?.value || '').toLowerCase().trim();
            if (!query) {
                renderAdminUnitKegiatanList();
                return;
            }

            const filtered = mockUnitKegiatanData.filter(item => {
                const nama = (item.nama || '').toLowerCase();
                const kategori = (item.kategori || '').toLowerCase();
                const jadwal = (item.jadwal || '').toLowerCase();
                const deskripsi = (item.deskripsi || '').toLowerCase();
                return nama.includes(query) || kategori.includes(query) || jadwal.includes(query) || deskripsi.includes(query);
            });

            renderAdminUnitKegiatanList(filtered);
        }

        function previewAdminUksImage(event) {
            const file = event.target.files[0];
            const preview = document.getElementById('admin-uks-preview-img');
            const placeholder = document.getElementById('admin-uks-preview-placeholder');

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        }

        async function submitAdminUnitKegiatan(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-uks-submit-btn');
            const btnIcon = document.getElementById('admin-uks-submit-icon');
            const btnText = document.getElementById('admin-uks-submit-text');

            const id = document.getElementById('admin-uks-id').value;
            const nama = document.getElementById('admin-uks-nama').value.trim();
            const kategori = document.getElementById('admin-uks-kategori').value.trim();
            const jadwal = document.getElementById('admin-uks-jadwal').value.trim();
            const urutan = Number(document.getElementById('admin-uks-urutan').value) || 1;
            const status = document.getElementById('admin-uks-status').value;
            const deskripsi = document.getElementById('admin-uks-deskripsi').value.trim();
            const oldImg = document.getElementById('admin-uks-old-img').value;

            const fileInput = document.getElementById('admin-uks-file');
            const file = fileInput.files[0];

            btn.disabled = true;
            btnIcon.className = "fa-solid fa-spinner fa-spin";
            btnText.innerText = "Menyimpan Data...";

            try {
                let fileData = null;
                if (file) {
                    fileData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result.split(',')[1];
                            resolve({
                                base64: base64,
                                mimeType: file.type,
                                name: file.name
                            });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }

                const payload = {
                    id: id,
                    nama: nama,
                    kategori: kategori,
                    jadwal: jadwal,
                    urutan: urutan,
                    status: status,
                    deskripsi: deskripsi,
                    gambarLama: oldImg,
                    file: fileData
                };

                if (!isApiConfigured()) {
                    if (id) {
                        const idx = mockUnitKegiatanData.findIndex(u => u.id === id);
                        if (idx >= 0) {
                            mockUnitKegiatanData[idx] = { ...mockUnitKegiatanData[idx], ...payload, gambar: oldImg };
                        }
                    } else {
                        mockUnitKegiatanData.push({
                            ...payload,
                            id: "UKS_" + new Date().getTime(),
                            gambar: oldImg || "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop"
                        });
                    }
                    showToast("✅ Unit Kegiatan disimpan (Mode Lokal).");
                    resetAdminUnitKegiatanForm();
                    renderPublicUnitKegiatanList();
                    renderAdminUnitKegiatanList();
                    btn.disabled = false;
                    btnIcon.className = "fa-solid fa-cloud-arrow-up";
                    btnText.innerText = "Simpan Unit Kegiatan";
                    return;
                }

                const response = await apiPost("saveUnitKegiatan", payload);

                btn.disabled = false;
                btnIcon.className = "fa-solid fa-cloud-arrow-up";
                btnText.innerText = "Simpan Unit Kegiatan";

                if (response && response.success) {
                    showToast("✅ " + response.message);
                    resetAdminUnitKegiatanForm();
                    await loadUnitKegiatan();
                } else {
                    showToast("❌ Gagal: " + (response ? response.message : "Terjadi kesalahan"));
                }
            } catch (err) {
                console.error("UKS Submit Error:", err);
                btn.disabled = false;
                btnIcon.className = "fa-solid fa-cloud-arrow-up";
                btnText.innerText = "Simpan Unit Kegiatan";
                showToast("❌ Gagal memproses data: " + err.message);
            }
        }

        function editAdminUnitKegiatan(item) {
            if (!item) return;

            document.getElementById('admin-uks-id').value = item.id;
            document.getElementById('admin-uks-old-img').value = item.gambar || "";
            document.getElementById('admin-uks-nama').value = item.nama || "";
            document.getElementById('admin-uks-kategori').value = item.kategori || "";
            document.getElementById('admin-uks-jadwal').value = item.jadwal || "";
            document.getElementById('admin-uks-urutan').value = item.urutan || 1;
            document.getElementById('admin-uks-status').value = item.status || "Aktif";
            document.getElementById('admin-uks-deskripsi').value = item.deskripsi || "";

            const preview = document.getElementById('admin-uks-preview-img');
            const placeholder = document.getElementById('admin-uks-preview-placeholder');

            if (item.gambar) {
                preview.src = item.gambar;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                preview.src = "";
                preview.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }

            document.getElementById('admin-uks-form-title').innerHTML = `<i class="fa-solid fa-pen text-teal-600 mr-2"></i> Edit Unit Kegiatan: ${escapeHtml(item.nama)}`;
            document.getElementById('admin-uks-submit-text').innerText = "Perbarui Unit Kegiatan";
            document.getElementById('admin-uks-cancel-edit-btn').classList.remove('hidden');

            window.scrollTo({ top: document.getElementById('adminUnitKegiatanForm').offsetTop - 100, behavior: 'smooth' });
        }

        function resetAdminUnitKegiatanForm() {
            document.getElementById('adminUnitKegiatanForm').reset();
            document.getElementById('admin-uks-id').value = "";
            document.getElementById('admin-uks-old-img').value = "";
            document.getElementById('admin-uks-urutan').value = 1;
            document.getElementById('admin-uks-status').value = "Aktif";

            const preview = document.getElementById('admin-uks-preview-img');
            const placeholder = document.getElementById('admin-uks-preview-placeholder');
            preview.src = "";
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');

            document.getElementById('admin-uks-form-title').innerHTML = '<i class="fa-solid fa-plus-circle text-teal-600 mr-2"></i> Tambah Unit Kegiatan Baru';
            document.getElementById('admin-uks-submit-text').innerText = "Simpan Unit Kegiatan";
            document.getElementById('admin-uks-cancel-edit-btn').classList.add('hidden');
        }

        async function toggleAdminUnitKegiatanStatus(id, newStatus) {
            try {
                if (!isApiConfigured()) {
                    const idx = mockUnitKegiatanData.findIndex(u => u.id === id);
                    if (idx >= 0) mockUnitKegiatanData[idx].status = newStatus;
                    renderPublicUnitKegiatanList();
                    renderAdminUnitKegiatanList();
                    showToast(`Status diubah ke ${newStatus}`);
                    return;
                }

                const response = await apiPost("toggleUnitKegiatan", { id, newStatus });
                showToast(response && response.message ? response.message : "Status diperbarui.");
                if (response && response.success) await loadUnitKegiatan();
            } catch (err) {
                showToast("❌ Gagal mengubah status: " + err.message);
            }
        }

        async function deleteAdminUnitKegiatan(id) {
            if (!confirm("Apakah Anda yakin ingin menghapus unit kegiatan ini?")) return;
            try {
                if (!isApiConfigured()) {
                    mockUnitKegiatanData = mockUnitKegiatanData.filter(u => u.id !== id);
                    renderPublicUnitKegiatanList();
                    renderAdminUnitKegiatanList();
                    showToast("Unit kegiatan berhasil dihapus.");
                    return;
                }

                const response = await apiPost("deleteUnitKegiatan", { id });
                showToast(response && response.message ? response.message : "Unit kegiatan dihapus.");
                if (response && response.success) await loadUnitKegiatan();
            } catch (err) {
                showToast("❌ Gagal menghapus unit kegiatan: " + err.message);
            }
        }

        // ==================== MANAJEMEN JADWAL KEGIATAN SANTRI (CLIENT & ADMIN) ====================
        let mockJadwalKegiatanData = [
            // --- HARIAN (11 Agenda) ---
            { id: "JDW_HARIAN_01", tipe: "harian", waktu: "03.30 – 04.30 WIB", kegiatan: "Bangun Pagi & Qiyamul Lail", deskripsi: "Shalat Tahajud, Hajat, Witir, & Persiapan Shalat Subuh.", badge: "24 Jam", urutan: 1, status: "Aktif" },
            { id: "JDW_HARIAN_02", tipe: "harian", waktu: "04.30 – 05.30 WIB", kegiatan: "Shalat Subuh Berjamaah & Zikir Pagi", deskripsi: "Shalat Subuh di Masjid Utama, dilanjutkan Pembacaan Zikir Ratib Pagi.", badge: "", urutan: 2, status: "Aktif" },
            { id: "JDW_HARIAN_03", tipe: "harian", waktu: "05.30 – 07.00 WIB", kegiatan: "Halaqah Hafalan Al-Qur'an (Pagi)", deskripsi: "Setoran Hafalan Baru (Sabaq) & Bimbingan Talaqqi bersama Asatidz.", badge: "Hafalan", urutan: 3, status: "Aktif" },
            { id: "JDW_HARIAN_04", tipe: "harian", waktu: "07.00 – 08.00 WIB", kegiatan: "Makan Pagi & Persiapan KBM", deskripsi: "Sarapan, MCK, dan persiapan masuk kelas formal/madrasah.", badge: "", urutan: 4, status: "Aktif" },
            { id: "JDW_HARIAN_05", tipe: "harian", waktu: "08.00 – 11.30 WIB", kegiatan: "Kegiatan Belajar Mengajar (KBM)", deskripsi: "Pelajaran Sekolah Formal / Pengajian Kitab Diniyah secara terstruktur.", badge: "", urutan: 5, status: "Aktif" },
            { id: "JDW_HARIAN_06", tipe: "harian", waktu: "11.30 – 12.30 WIB", kegiatan: "Shalat Dzuhur & Makan Siang", deskripsi: "Shalat Dzuhur Berjamaah dilanjutkan makan siang santri.", badge: "", urutan: 6, status: "Aktif" },
            { id: "JDW_HARIAN_07", tipe: "harian", waktu: "12.30 – 15.00 WIB", kegiatan: "Istirahat Siang (Qailulah)", deskripsi: "Tidur siang sunnah & Pendalaman materi hafalan mandiri.", badge: "", urutan: 7, status: "Aktif" },
            { id: "JDW_HARIAN_08", tipe: "harian", waktu: "15.00 – 17.30 WIB", kegiatan: "Shalat Ashar & Muraja'ah Sore", deskripsi: "Shalat Ashar Berjamaah, Muraja'ah Hafalan Pekanan, & Olahraga ringan.", badge: "", urutan: 8, status: "Aktif" },
            { id: "JDW_HARIAN_09", tipe: "harian", waktu: "17.30 – 19.30 WIB", kegiatan: "Maghrib, Ratib, & Kajian Kitab", deskripsi: "Shalat Maghrib Berjamaah, Pembacaan Ratib Al-Haddad, & Pengajian Kitab Kuning.", badge: "Kajian", urutan: 9, status: "Aktif" },
            { id: "JDW_HARIAN_10", tipe: "harian", waktu: "19.30 – 21.30 WIB", kegiatan: "Shalat Isya, Makan Malam & Belajar Mandiri", deskripsi: "Shalat Isya Berjamaah, Makan Malam, & Belajar Mandiri terpadu di asrama.", badge: "", urutan: 10, status: "Aktif" },
            { id: "JDW_HARIAN_11", tipe: "harian", waktu: "21.30 – 03.30 WIB", kegiatan: "Istirahat Malam (Jam Wajib Tidur)", deskripsi: "Seluruh fasilitas penerangan umum dimatikan untuk pengkondisian istirahat santri.", badge: "Wajib Tidur", urutan: 11, status: "Aktif" },

            // --- MINGGUAN (5 Agenda) ---
            { id: "JDW_MINGGUAN_01", tipe: "mingguan", waktu: "Senin & Kamis", kegiatan: "Puasa Sunnah & Buka Bersama", deskripsi: "Pelaksanaan Puasa Sunnah Senin-Kamis dilanjutkan doa & buka puasa bersama santri di aula.", badge: "Sunnah", urutan: 1, status: "Aktif" },
            { id: "JDW_MINGGUAN_02", tipe: "mingguan", waktu: "Selasa Kliwon", kegiatan: "Pengajian Akbar Ihya 'Ulumuddin", deskripsi: "Kajian rutin Seloso Kliwon pengajian kitab Ihya 'Ulumuddin bersama Pengasuh Utama.", badge: "Rutin", urutan: 2, status: "Aktif" },
            { id: "JDW_MINGGUAN_03", tipe: "mingguan", waktu: "Jumat (Sayyidul Ayyam)", kegiatan: "Ro'an Kebersihan & Al-Kahfi", deskripsi: "Kerja bakti lingkungan (Ro'an), pembacaan Surat Al-Kahfi, Yasin & Tahlil, serta Shalat Jumat Berjamaah.", badge: "Utama", urutan: 3, status: "Aktif" },
            { id: "JDW_MINGGUAN_04", tipe: "mingguan", waktu: "Sabtu", kegiatan: "Muhadharah & Seni Hadroh", deskripsi: "Latihan public speaking 3 bahasa (Muhadharah), seni rebana/hadroh, & keahlian IT santri.", badge: "Ekstrakurikuler", urutan: 4, status: "Aktif" },
            { id: "JDW_MINGGUAN_05", tipe: "mingguan", waktu: "Ahad", kegiatan: "Kunjungan Wali Santri & Olahraga", deskripsi: "Pagi hari olahraga bersama & kegiatan jalan sehat, dilanjutkan waktu kunjungan resmi wali santri.", badge: "Sambang Wali", urutan: 5, status: "Aktif" },

            // --- BULANAN (4 Agenda) ---
            { id: "JDW_BULANAN_01", tipe: "bulanan", waktu: "Pekan Ke-1", kegiatan: "Sema'an Al-Qur'an Bil-Ghaib", deskripsi: "Khataman Al-Qur'an hafalan santri secara bergantian dalam satu hari di majlis utama.", badge: "P-1", urutan: 1, status: "Aktif" },
            { id: "JDW_BULANAN_02", tipe: "bulanan", waktu: "Pekan Ke-2", kegiatan: "Ujian Hafalan Bulanan (Munaqasyah)", deskripsi: "Evaluasi ketercapaian target hafalan baru & kualitas tajwid santri langsung di depan Dewan Penguji.", badge: "P-2", urutan: 2, status: "Aktif" },
            { id: "JDW_BULANAN_03", tipe: "bulanan", waktu: "Pekan Ke-3", kegiatan: "Majlis Ta'lim & Silaturahmi Wali Santri", deskripsi: "Pengajian rutin bulanan khusus orang tua/wali santri bersama jajaran Pengasuh Pesantren.", badge: "P-3", urutan: 3, status: "Aktif" },
            { id: "JDW_BULANAN_04", tipe: "bulanan", waktu: "Pekan Ke-4", kegiatan: "Santunan Yatim & Bakti Sosial", deskripsi: "Kegiatan kepedulian sosial santri berbagi kepada anak yatim & warga sekitar lingkungan pesantren.", badge: "P-4", urutan: 4, status: "Aktif" },

            // --- TAHUNAN (5 Agenda) ---
            { id: "JDW_TAHUNAN_01", tipe: "tahunan", waktu: "Bulan Muharram", kegiatan: "Peringatan Tahun Baru Islam & Santunan", deskripsi: "Peringatan 1 Muharram 1448 H, pawai obor santri, dan santunan akbar anak yatim.", badge: "Muharram", urutan: 1, status: "Aktif" },
            { id: "JDW_TAHUNAN_02", tipe: "tahunan", waktu: "Bulan Rabiul Awal", kegiatan: "Peringatan Maulid Nabi Muhammad SAW", deskripsi: "Pembacaan Kitab Simtuddurar / Barzanji bersama habaib dan alim ulama Demak.", badge: "Maulid", urutan: 2, status: "Aktif" },
            { id: "JDW_TAHUNAN_03", tipe: "tahunan", waktu: "Rajab & Sya'ban", kegiatan: "Wisuda Tahfidz & Haul Pesantren", deskripsi: "Ujian Imtihan Akhirussanah, Wisuda Khotmil Qur'an, & Peringatan Haul Masyayikh PPTQ Asnawiyyah.", badge: "Wisuda", urutan: 3, status: "Aktif" },
            { id: "JDW_TAHUNAN_04", tipe: "tahunan", waktu: "Bulan Ramadhan", kegiatan: "Karantina Tahfidz & Pasaran Kitab", deskripsi: "Program percepatan hafalan Ramadhan & pengajian pasaran kitab kuning kilatan.", badge: "Ramadhan", urutan: 4, status: "Aktif" },
            { id: "JDW_TAHUNAN_05", tipe: "tahunan", waktu: "Bulan Syawal", kegiatan: "Libur Idul Fitri & Halal Bihalal", deskripsi: "Masa perpulangan libur Idul Fitri santri dan silaturahmi Halal Bihalal Keluarga Besar PPTQ Asnawiyyah.", badge: "Syawal", urutan: 5, status: "Aktif" }
        ];

        let currentAdminJadwalFilter = "all";

        async function loadJadwalKegiatan() {
            try {
                const cached = localStorage.getItem('asn_cached_jadwal_kegiatan');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            mockJadwalKegiatanData = parsed;
                        }
                    } catch (e) {}
                }

                renderPublicJadwalKegiatan();
                renderAdminJadwalKegiatanList();

                if (!isApiConfigured()) {
                    return;
                }

                const response = await apiGet("getJadwalKegiatan");
                if (response && response.status === "success" && Array.isArray(response.data) && response.data.length > 0) {
                    mockJadwalKegiatanData = response.data;
                    try {
                        localStorage.setItem('asn_cached_jadwal_kegiatan', JSON.stringify(mockJadwalKegiatanData));
                    } catch (e) {}
                    renderPublicJadwalKegiatan();
                    renderAdminJadwalKegiatanList();
                }
            } catch (err) {
                console.warn("Gagal memuat jadwal kegiatan dari server, menggunakan data lokal:", err);
                renderPublicJadwalKegiatan();
                renderAdminJadwalKegiatanList();
            }
        }

        function renderPublicJadwalKegiatan() {
            const harianContainer = document.getElementById('public-jadwal-harian-list');
            const mingguanContainer = document.getElementById('public-jadwal-mingguan-list');
            const bulananContainer = document.getElementById('public-jadwal-bulanan-list');
            const tahunanContainer = document.getElementById('public-jadwal-tahunan-list');

            const activeItems = mockJadwalKegiatanData.filter(j => (j.status || 'Aktif') === 'Aktif');

            // 1. Harian
            if (harianContainer) {
                const harianItems = activeItems.filter(j => j.tipe === 'harian').sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
                if (harianItems.length === 0) {
                    harianContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Belum ada agenda harian santri.</div>`;
                } else {
                    harianContainer.innerHTML = harianItems.map(item => {
                        const isHighlighted = item.badge && (item.badge.toLowerCase().includes('hafalan') || item.badge.toLowerCase().includes('kajian') || item.badge.toLowerCase().includes('quran'));
                        return `
                            <div class="relative group">
                                <div class="absolute -left-[21px] top-1 w-3 h-3 ${isHighlighted ? 'bg-amber-500' : 'bg-brand-600'} rounded-full border-2 border-white dark:border-[#15202d]"></div>
                                <div class="${isHighlighted ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40' : 'bg-slate-50 dark:bg-[#1c2836] border-slate-100 dark:border-[#253447]'} p-3 rounded-2xl border transition hover:shadow-xs">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-extrabold ${isHighlighted ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40' : 'text-brand-700 dark:text-emerald-400 bg-brand-50 dark:bg-emerald-950/40'} px-2 py-0.5 rounded-lg">${escapeHtml(item.waktu)}</span>
                                        ${item.badge ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isHighlighted ? 'bg-amber-200/60 text-amber-900 dark:bg-amber-900 dark:text-amber-200' : 'bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-emerald-300'}">${escapeHtml(item.badge)}</span>` : ''}
                                    </div>
                                    <h4 class="text-xs font-bold ${isHighlighted ? 'text-amber-900 dark:text-amber-300' : 'text-slate-800 dark:text-slate-100'} mt-1">${escapeHtml(item.kegiatan)}</h4>
                                    <p class="text-[11px] ${isHighlighted ? 'text-amber-800/80 dark:text-amber-400/80' : 'text-slate-500 dark:text-slate-400'} mt-0.5">${escapeHtml(item.deskripsi || '')}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // 2. Mingguan
            if (mingguanContainer) {
                const mingguanItems = activeItems.filter(j => j.tipe === 'mingguan').sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
                if (mingguanItems.length === 0) {
                    mingguanContainer.innerHTML = `<div class="col-span-full p-6 text-center text-slate-400 text-xs">Belum ada agenda mingguan santri.</div>`;
                } else {
                    mingguanContainer.innerHTML = mingguanItems.map(item => {
                        let badgeBg = 'bg-brand-100 text-brand-800 dark:bg-emerald-950/80 dark:text-emerald-300';
                        if (item.badge && item.badge.toLowerCase().includes('sunnah')) badgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                        if (item.badge && item.badge.toLowerCase().includes('rutin')) badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                        if (item.badge && item.badge.toLowerCase().includes('ekstra')) badgeBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                        if (item.badge && item.badge.toLowerCase().includes('wali')) badgeBg = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';

                        const safeTitle = (item.kegiatan || '').replace(/'/g, "\\'");
                        const safeDesc = (item.deskripsi || '').replace(/'/g, "\\'");
                        const safeWaktu = (item.waktu || '').replace(/'/g, "\\'");

                        return `
                            <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] space-y-1 hover:shadow-xs transition">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-bold text-brand-800 dark:text-emerald-400">${escapeHtml(item.waktu)}</span>
                                    <div class="flex items-center gap-1.5">
                                        ${item.badge ? `<span class="text-[9px] ${badgeBg} font-bold px-2 py-0.5 rounded-full">${escapeHtml(item.badge)}</span>` : ''}
                                        <button type="button" onclick="saveEventToPersonalCalendar('${safeTitle}', '${safeDesc}', '${safeWaktu}')"
                                            class="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                            title="Tambahkan Pengingat ke Kalender Saya">
                                            <i class="fa-regular fa-bell text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${escapeHtml(item.kegiatan)}</h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(item.deskripsi || '')}</p>
                            </div>
                        `;
                    }).join('');
                }
            }

            // 3. Bulanan
            if (bulananContainer) {
                const bulananItems = activeItems.filter(j => j.tipe === 'bulanan').sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
                if (bulananItems.length === 0) {
                    bulananContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Belum ada agenda bulanan santri.</div>`;
                } else {
                    const boxColors = [
                        'bg-brand-100 text-brand-700 dark:bg-emerald-950 dark:text-emerald-300',
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    ];

                    bulananContainer.innerHTML = bulananItems.map((item, idx) => {
                        const boxColor = boxColors[idx % boxColors.length];
                        const safeTitle = (item.kegiatan || '').replace(/'/g, "\\'");
                        const safeDesc = (item.deskripsi || '').replace(/'/g, "\\'");
                        const safeWaktu = (item.waktu || '').replace(/'/g, "\\'");

                        return `
                            <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] flex items-start space-x-3.5 hover:shadow-xs transition">
                                <div class="w-10 h-10 ${boxColor} rounded-2xl flex items-center justify-center font-bold text-sm shrink-0">
                                    ${escapeHtml(item.badge || ('P-' + (idx + 1)))}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="text-[10px] font-bold text-brand-700 dark:text-emerald-400 uppercase tracking-wider">${escapeHtml(item.waktu)}</span>
                                        <button type="button" onclick="saveEventToPersonalCalendar('${safeTitle}', '${safeDesc}', '${safeWaktu}')"
                                            class="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                            title="Tambahkan Pengingat ke Kalender Saya">
                                            <i class="fa-regular fa-bell text-xs"></i>
                                        </button>
                                    </div>
                                    <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">${escapeHtml(item.kegiatan)}</h4>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${escapeHtml(item.deskripsi || '')}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // 4. Tahunan
            if (tahunanContainer) {
                const tahunanItems = activeItems.filter(j => j.tipe === 'tahunan').sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
                if (tahunanItems.length === 0) {
                    tahunanContainer.innerHTML = `<div class="col-span-full p-6 text-center text-slate-400 text-xs">Belum ada agenda tahunan santri.</div>`;
                } else {
                    tahunanContainer.innerHTML = tahunanItems.map(item => {
                        let badgeBg = 'bg-brand-100 text-brand-700 dark:bg-emerald-950/80 dark:text-emerald-300';
                        if (item.waktu.toLowerCase().includes('muharram')) badgeBg = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
                        if (item.waktu.toLowerCase().includes('rajab') || item.waktu.toLowerCase().includes('sya')) badgeBg = 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
                        if (item.waktu.toLowerCase().includes('ramadhan')) badgeBg = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                        if (item.waktu.toLowerCase().includes('syawal')) badgeBg = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';

                        const safeTitle = (item.kegiatan || '').replace(/'/g, "\\'");
                        const safeDesc = (item.deskripsi || '').replace(/'/g, "\\'");
                        const safeWaktu = (item.waktu || '').replace(/'/g, "\\'");

                        return `
                            <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] space-y-1 hover:shadow-xs transition">
                                <div class="flex justify-between items-center">
                                    <span class="inline-block text-[10px] font-extrabold ${badgeBg} px-2 py-0.5 rounded-md">
                                        ${escapeHtml(item.waktu)}
                                    </span>
                                    <button type="button" onclick="saveEventToPersonalCalendar('${safeTitle}', '${safeDesc}', '${safeWaktu}')"
                                        class="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                        title="Tambahkan Pengingat ke Kalender Saya">
                                        <i class="fa-regular fa-bell text-xs"></i>
                                    </button>
                                </div>
                                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">${escapeHtml(item.kegiatan)}</h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(item.deskripsi || '')}</p>
                            </div>
                        `;
                    }).join('');
                }
            }
        }

        function renderAdminJadwalKegiatanList(itemsToRender = null) {
            const container = document.getElementById('admin-jadwal-kegiatan-list-container');
            const hubBadge = document.getElementById('admin-hub-jadwal-kegiatan-count');

            if (hubBadge) {
                hubBadge.innerText = `${mockJadwalKegiatanData.length} Agenda`;
            }

            // Update sub-tab counts
            const countAll = document.getElementById('admin-jdw-count-all');
            const countHarian = document.getElementById('admin-jdw-count-harian');
            const countMingguan = document.getElementById('admin-jdw-count-mingguan');
            const countBulanan = document.getElementById('admin-jdw-count-bulanan');
            const countTahunan = document.getElementById('admin-jdw-count-tahunan');

            if (countAll) countAll.innerText = mockJadwalKegiatanData.length;
            if (countHarian) countHarian.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'harian').length;
            if (countMingguan) countMingguan.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'mingguan').length;
            if (countBulanan) countBulanan.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'bulanan').length;
            if (countTahunan) countTahunan.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'tahunan').length;

            // Update KPI Cards
            const jdwKpiTotal = document.getElementById('admin-jadwal-kpi-total');
            const jdwKpiHarian = document.getElementById('admin-jadwal-kpi-harian');
            const jdwKpiMingguan = document.getElementById('admin-jadwal-kpi-mingguan');
            const jdwKpiPeriodik = document.getElementById('admin-jadwal-kpi-periodik');

            if (jdwKpiTotal) jdwKpiTotal.innerText = mockJadwalKegiatanData.length;
            if (jdwKpiHarian) jdwKpiHarian.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'harian').length;
            if (jdwKpiMingguan) jdwKpiMingguan.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'mingguan').length;
            if (jdwKpiPeriodik) jdwKpiPeriodik.innerText = mockJadwalKegiatanData.filter(j => j.tipe === 'bulanan' || j.tipe === 'tahunan').length;

            if (!container) return;

            const list = itemsToRender || (currentAdminJadwalFilter === 'all' 
                ? mockJadwalKegiatanData 
                : mockJadwalKegiatanData.filter(j => j.tipe === currentAdminJadwalFilter));

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="bg-white dark:bg-[#15202d] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-[#253447] space-y-2">
                        <i class="fa-solid fa-calendar-xmark text-3xl text-slate-300 dark:text-slate-600"></i>
                        <p class="text-xs">Tidak ada data jadwal kegiatan yang sesuai.</p>
                    </div>
                `;
                return;
            }

            const tipeBadges = {
                'harian': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                'mingguan': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                'bulanan': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                'tahunan': 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
            };

            container.innerHTML = list.map(item => {
                const isActive = (item.status || 'Aktif') === 'Aktif';
                const tipeClass = tipeBadges[item.tipe] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                const safeItem = JSON.stringify(item).replace(/'/g, "&#39;");

                return `
                    <div class="bg-white dark:bg-[#15202d] p-3.5 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition group">
                        <div class="space-y-1.5 flex-1 min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${tipeClass}">${escapeHtml(item.tipe || 'Harian')}</span>
                                <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">${escapeHtml(item.waktu)}</span>
                                ${item.badge ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${escapeHtml(item.badge)}</span>` : ''}
                                <span class="text-[10px] text-slate-400 font-medium">Urutan: ${item.urutan || 1}</span>
                            </div>
                            <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">${escapeHtml(item.kegiatan)}</h4>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">${escapeHtml(item.deskripsi || '-')}</p>
                        </div>
                        <div class="flex items-center space-x-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#253447] w-full md:w-auto justify-end">
                            <button type="button" onclick="toggleAdminJadwalKegiatanStatus('${item.id}', '${isActive ? 'Nonaktif' : 'Aktif'}')" class="text-[10px] px-2.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ${isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}">
                                <i class="fa-solid ${isActive ? 'fa-toggle-on text-emerald-600 text-xs' : 'fa-toggle-off text-slate-400 text-xs'}"></i>
                                <span>${isActive ? 'Aktif' : 'Nonaktif'}</span>
                            </button>
                            <button type="button" onclick='openAdminJadwalKegiatanModal(${safeItem})' class="text-[10px] px-2.5 py-1.5 rounded-xl font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 transition flex items-center space-x-1 active:scale-95" title="Edit">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                                <span>Edit</span>
                            </button>
                            <button type="button" onclick="deleteAdminJadwalKegiatan('${item.id}')" class="text-[10px] px-2.5 py-1.5 rounded-xl font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 transition flex items-center space-x-1 active:scale-95" title="Hapus">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setAdminJadwalFilter(filter) {
            currentAdminJadwalFilter = filter;
            document.querySelectorAll('.admin-jdw-filter-btn').forEach(btn => {
                btn.className = "admin-jdw-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-700 transition shrink-0";
            });
            const activeBtn = document.getElementById(`admin-jdw-tab-${filter}`);
            if (activeBtn) {
                activeBtn.className = "admin-jdw-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-[#253447] text-emerald-800 dark:text-emerald-300 shadow-sm transition shrink-0";
            }
            filterAdminJadwalKegiatanList();
        }

        function filterAdminJadwalKegiatanList() {
            const searchInput = document.getElementById('admin-jadwal-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            let items = currentAdminJadwalFilter === 'all' 
                ? mockJadwalKegiatanData 
                : mockJadwalKegiatanData.filter(j => j.tipe === currentAdminJadwalFilter);

            if (query) {
                items = items.filter(j => 
                    (j.kegiatan && j.kegiatan.toLowerCase().includes(query)) ||
                    (j.waktu && j.waktu.toLowerCase().includes(query)) ||
                    (j.deskripsi && j.deskripsi.toLowerCase().includes(query)) ||
                    (j.badge && j.badge.toLowerCase().includes(query))
                );
            }

            renderAdminJadwalKegiatanList(items);
        }

        function openAdminJadwalKegiatanModal(item = null) {
            const modal = document.getElementById('adminJadwalKegiatanModal');
            const content = document.getElementById('adminJadwalKegiatanContent');
            const form = document.getElementById('adminJadwalKegiatanForm');
            const titleEl = document.getElementById('admin-jadwal-modal-title');
            const submitText = document.getElementById('admin-jdw-submit-text');

            if (!modal || !content || !form) return;

            form.reset();

            if (item) {
                if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen text-emerald-600 mr-2"></i>Edit Jadwal: ${escapeHtml(item.kegiatan)}`;
                if (submitText) submitText.innerText = "Perbarui Jadwal";
                document.getElementById('admin-jdw-id').value = item.id || '';
                document.getElementById('admin-jdw-tipe').value = item.tipe || 'harian';
                document.getElementById('admin-jdw-status').value = item.status || 'Aktif';
                document.getElementById('admin-jdw-waktu').value = item.waktu || '';
                document.getElementById('admin-jdw-kegiatan').value = item.kegiatan || '';
                document.getElementById('admin-jdw-deskripsi').value = item.deskripsi || '';
                document.getElementById('admin-jdw-badge').value = item.badge || '';
                const alarmEl = document.getElementById('admin-jdw-alarm');
                if (alarmEl) alarmEl.value = item.alarm || '1_day';
                document.getElementById('admin-jdw-urutan').value = item.urutan || 1;
            } else {
                if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-plus-circle text-emerald-600 mr-2"></i>Tambah Jadwal Baru`;
                if (submitText) submitText.innerText = "Simpan Jadwal";
                document.getElementById('admin-jdw-id').value = '';
                document.getElementById('admin-jdw-tipe').value = (currentAdminJadwalFilter !== 'all' ? currentAdminJadwalFilter : 'harian');
                document.getElementById('admin-jdw-status').value = 'Aktif';
                document.getElementById('admin-jdw-waktu').value = '';
                document.getElementById('admin-jdw-kegiatan').value = '';
                document.getElementById('admin-jdw-deskripsi').value = '';
                document.getElementById('admin-jdw-badge').value = '';
                const alarmEl = document.getElementById('admin-jdw-alarm');
                if (alarmEl) alarmEl.value = '1_day';
                const maxUrutan = mockJadwalKegiatanData.filter(j => j.tipe === (currentAdminJadwalFilter !== 'all' ? currentAdminJadwalFilter : 'harian')).length + 1;
                document.getElementById('admin-jdw-urutan').value = maxUrutan;
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 30);
        }

        function closeAdminJadwalKegiatanModal() {
            const modal = document.getElementById('adminJadwalKegiatanModal');
            const content = document.getElementById('adminJadwalKegiatanContent');
            if (modal && content) {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 200);
            }
        }

        async function submitAdminJadwalKegiatan(event) {
            if (event) event.preventDefault();
            const id = document.getElementById('admin-jdw-id').value;
            const tipe = document.getElementById('admin-jdw-tipe').value;
            const status = document.getElementById('admin-jdw-status').value;
            const waktu = document.getElementById('admin-jdw-waktu').value.trim();
            const kegiatan = document.getElementById('admin-jdw-kegiatan').value.trim();
            const deskripsi = document.getElementById('admin-jdw-deskripsi').value.trim();
            const badge = document.getElementById('admin-jdw-badge').value.trim();
            const alarmEl = document.getElementById('admin-jdw-alarm');
            const alarm = alarmEl ? alarmEl.value : '1_day';
            const urutan = Number(document.getElementById('admin-jdw-urutan').value) || 1;

            if (!waktu || !kegiatan) {
                if (typeof showToast === 'function') showToast("⚠️ Waktu dan nama kegiatan wajib diisi!");
                return;
            }

            const isEdit = !!id;
            const payload = {
                id: id || ('JDW_' + tipe.toUpperCase() + '_' + Date.now()),
                tipe,
                waktu,
                kegiatan,
                deskripsi,
                badge,
                alarm,
                urutan,
                status
            };

            const submitBtn = document.getElementById('admin-jdw-submit-btn');
            const submitText = document.getElementById('admin-jdw-submit-text');
            if (submitBtn) submitBtn.disabled = true;
            if (submitText) submitText.innerText = "Menyimpan...";

            try {
                if (isEdit) {
                    const idx = mockJadwalKegiatanData.findIndex(j => j.id === id);
                    if (idx >= 0) {
                        mockJadwalKegiatanData[idx] = { ...mockJadwalKegiatanData[idx], ...payload };
                    }
                } else {
                    mockJadwalKegiatanData.push(payload);
                }

                try {
                    localStorage.setItem('asn_cached_jadwal_kegiatan', JSON.stringify(mockJadwalKegiatanData));
                } catch (e) {}

                renderPublicJadwalKegiatan();
                filterAdminJadwalKegiatanList();
                closeAdminJadwalKegiatanModal();

                if (typeof showToast === 'function') {
                    showToast(isEdit ? "✅ Jadwal kegiatan berhasil diperbarui!" : "✅ Jadwal kegiatan baru berhasil ditambahkan!");
                }

                if (isApiConfigured()) {
                    const token = getAdminSessionToken();
                    const serverPayload = { ...payload, token };
                    const apiRes = await apiPost("saveJadwalKegiatan", serverPayload);
                    if (apiRes && apiRes.status === "error" && !apiRes.success) {
                        console.warn("[JADWAL SAVE SERVER WARNING]", apiRes.message);
                    }
                }
            } catch (err) {
                console.warn("Gagal menyimpan jadwal ke server:", err);
                if (typeof showToast === 'function') showToast("⚠️ Disimpan secara lokal (offline mode)");
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                if (submitText) submitText.innerText = isEdit ? "Perbarui Jadwal" : "Simpan Jadwal";
            }
        }

        async function toggleAdminJadwalKegiatanStatus(id, newStatus) {
            try {
                const idx = mockJadwalKegiatanData.findIndex(j => j.id === id);
                if (idx >= 0) {
                    mockJadwalKegiatanData[idx].status = newStatus;
                    try {
                        localStorage.setItem('asn_cached_jadwal_kegiatan', JSON.stringify(mockJadwalKegiatanData));
                    } catch (e) {}
                    renderPublicJadwalKegiatan();
                    filterAdminJadwalKegiatanList();
                    if (typeof showToast === 'function') showToast(`Status jadwal diubah ke ${newStatus}`);
                }

                if (isApiConfigured()) {
                    const token = getAdminSessionToken();
                    await apiPost("toggleJadwalKegiatan", { id, newStatus, token });
                }
            } catch (err) {
                if (typeof showToast === 'function') showToast("❌ Gagal mengubah status: " + err.message);
            }
        }

        async function deleteAdminJadwalKegiatan(id) {
            const item = mockJadwalKegiatanData.find(j => j.id === id);
            const nama = item ? item.kegiatan : "jadwal ini";
            if (!confirm(`Apakah Anda yakin ingin menghapus agenda "${nama}"?`)) return;

            try {
                mockJadwalKegiatanData = mockJadwalKegiatanData.filter(j => j.id !== id);
                try {
                    localStorage.setItem('asn_cached_jadwal_kegiatan', JSON.stringify(mockJadwalKegiatanData));
                } catch (e) {}

                renderPublicJadwalKegiatan();
                filterAdminJadwalKegiatanList();
                if (typeof showToast === 'function') showToast("✅ Agenda jadwal berhasil dihapus.");

                if (isApiConfigured()) {
                    const token = getAdminSessionToken();
                    await apiPost("deleteJadwalKegiatan", { id, token });
                }
            } catch (err) {
                if (typeof showToast === 'function') showToast("❌ Gagal menghapus: " + err.message);
            }
        }

        // ==================== DASHBOARD ADMIN: MANAJEMEN PROGRAM PESANTREN (CMS) ====================
        let adminProgramData = [];
        let filteredAdminProgramData = [];
        let adminProgramFilterStatus = "ALL";
        let adminProgramSearchQuery = "";

        function getAdminSessionToken() {
            return (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem("asnawiyyah_admin_token") || sessionStorage.getItem("asnawiyyah_pengasuh_token"))) ||
                   (typeof localStorage !== 'undefined' && (localStorage.getItem("asnawiyyah_admin_token") || localStorage.getItem("asnawiyyah_pengasuh_token"))) || "";
        }
        if (typeof window !== 'undefined') {
            window.getAdminSessionToken = getAdminSessionToken;
        }

        function getAdminSessionRole() {
            const r = sessionStorage.getItem("ASN_ADMIN_ROLE") || 
                      sessionStorage.getItem("asnawiyyah_admin_role") || 
                      localStorage.getItem("asnawiyyah_admin_role") || 
                      (typeof ASNIdentity !== 'undefined' && ASNIdentity.currentRole) || 
                      "ADMIN";
            return String(r).toUpperCase().trim();
        }

        function isUserAdminRole() {
            if (typeof window.hasPermission === 'function') {
                return window.hasPermission('program.manage');
            }
            const r = getAdminSessionRole();
            return r === "ADMIN" || r === "SUPER_ADMIN" || r === "PENGASUH" || r === "ADMINISTRATOR";
        }

        async function loadAdminProgramList() {
            const stateContainer = document.getElementById('admin-program-state-container');
            const tbody = document.getElementById('admin-program-table-tbody');
            const mobileList = document.getElementById('admin-program-mobile-list');
            const countBadge = document.getElementById('admin-program-list-count');
            const hubCount = document.getElementById('admin-hub-program-count');

            if (!isApiConfigured()) {
                if (stateContainer) {
                    stateContainer.className = "py-8 text-center text-xs text-rose-600 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2";
                    stateContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xl"></i><p>API Endpoint belum dikonfigurasi.</p>`;
                    stateContainer.classList.remove('hidden');
                }
                return;
            }

            if (stateContainer) {
                stateContainer.className = "py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 animate-pulse";
                stateContainer.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xl text-emerald-600"></i><p>Memuat daftar program dari server...</p>`;
                stateContainer.classList.remove('hidden');
            }

            try {
                const token = getAdminSessionToken();
                const response = await apiPost("program.list", { token });

                if (!response || typeof response !== "object") {
                    throw new Error("Format respons API tidak valid.");
                }

                if (response.success !== true) {
                    const errObj = response.error || {};
                    const errCode = errObj.code || "SERVER_ERROR";
                    const errMsg = errObj.message || "Gagal memuat daftar program.";
                    const reqId = errObj.requestId || response.requestId || "";
                    if (stateContainer) {
                        stateContainer.className = "py-8 text-center text-xs text-rose-600 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2";
                        stateContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xl text-rose-500"></i><p class="font-bold">[${escapeHtml(errCode)}] ${escapeHtml(errMsg)}</p>${reqId ? `<span class="text-[10px] text-slate-400 font-mono block">Ref ID: ${escapeHtml(reqId)}</span>` : ''}`;
                        stateContainer.classList.remove('hidden');
                    }
                    if (tbody) tbody.innerHTML = "";
                    if (mobileList) mobileList.innerHTML = "";
                    return;
                }

                const rawAdminData = Array.isArray(response.data) ? response.data : [];
                adminProgramData = rawAdminData.map(p => {
                    let highlights = p.highlights;
                    if (typeof highlights === 'string') {
                        try { highlights = JSON.parse(highlights); } catch(e) { highlights = []; }
                    }
                    if (!Array.isArray(highlights)) {
                        let hJson = p.highlights_json;
                        if (typeof hJson === 'string') {
                            try { hJson = JSON.parse(hJson); } catch(e) { hJson = []; }
                        }
                        highlights = Array.isArray(hJson) ? hJson : [];
                    }

                    let detail = p.detail;
                    if (typeof detail === 'string') {
                        try { detail = JSON.parse(detail); } catch(e) { detail = null; }
                    }
                    if (!detail || typeof detail !== 'object') {
                        let dJson = p.detail_json;
                        if (typeof dJson === 'string') {
                            try { dJson = JSON.parse(dJson); } catch(e) { dJson = null; }
                        }
                        detail = (dJson && typeof dJson === 'object') ? dJson : {};
                    }

                    return {
                        ...p,
                        highlights,
                        detail
                    };
                });

                if (hubCount) hubCount.innerText = `${adminProgramData.length} Program`;
                if (countBadge) countBadge.innerText = `${adminProgramData.length} Program`;

                updateAdminProgramSummaryStats();
                filterAdminProgramList();

            } catch (err) {
                console.error("Gagal memuat program CMS:", err);
                if (stateContainer) {
                    stateContainer.className = "py-8 text-center text-xs text-rose-600 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2";
                    stateContainer.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xl text-rose-500"></i><p class="font-bold">Gagal memuat program dari server.</p><p class="text-[11px] text-rose-500">${escapeHtml(err.message)}</p>`;
                    stateContainer.classList.remove('hidden');
                }
                if (tbody) tbody.innerHTML = "";
                if (mobileList) mobileList.innerHTML = "";
            }
        }

        function updateAdminProgramSummaryStats() {
            const statTotal = document.getElementById('admin-program-stat-total');
            const statPub = document.getElementById('admin-program-stat-published');
            const statDraft = document.getElementById('admin-program-stat-draft');
            const statArch = document.getElementById('admin-program-stat-archived');

            let pubCount = 0;
            let draftCount = 0;
            let archCount = 0;

            adminProgramData.forEach(p => {
                const s = String(p.status || "").toLowerCase();
                if (s === "published") pubCount++;
                else if (s === "draft") draftCount++;
                else if (s === "archived") archCount++;
            });

            if (statTotal) statTotal.innerText = adminProgramData.length;
            if (statPub) statPub.innerText = pubCount;
            if (statDraft) statDraft.innerText = draftCount;
            if (statArch) statArch.innerText = archCount;
        }

        function filterAdminProgramList() {
            const searchInput = document.getElementById('admin-program-search');
            const filterSelect = document.getElementById('admin-program-filter-status');

            adminProgramSearchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
            adminProgramFilterStatus = filterSelect ? filterSelect.value : "ALL";

            filteredAdminProgramData = adminProgramData.filter(item => {
                const matchStatus = (adminProgramFilterStatus === "ALL") || (String(item.status || "").toLowerCase() === adminProgramFilterStatus.toLowerCase());
                const matchSearch = !adminProgramSearchQuery ||
                    (item.name && item.name.toLowerCase().includes(adminProgramSearchQuery)) ||
                    (item.id && item.id.toLowerCase().includes(adminProgramSearchQuery)) ||
                    (item.badge && item.badge.toLowerCase().includes(adminProgramSearchQuery));
                return matchStatus && matchSearch;
            });

            renderAdminProgramListTable(filteredAdminProgramData);
        }

        function renderAdminProgramListTable(list) {
            const tbody = document.getElementById('admin-program-table-tbody');
            const mobileList = document.getElementById('admin-program-mobile-list');
            const stateContainer = document.getElementById('admin-program-state-container');
            const countBadge = document.getElementById('admin-program-list-count');

            if (countBadge) countBadge.innerText = `${list.length} Program`;

            if (!tbody || !mobileList) return;

            tbody.innerHTML = "";
            mobileList.innerHTML = "";

            if (list.length === 0) {
                if (stateContainer) {
                    stateContainer.className = "py-8 text-center text-xs text-slate-500 space-y-2";
                    stateContainer.innerHTML = `<i class="fa-solid fa-folder-open text-slate-300 text-3xl"></i><p class="font-bold">Tidak ada program yang sesuai kriteria pencarian / filter.</p>`;
                    stateContainer.classList.remove('hidden');
                }
                return;
            }

            if (stateContainer) stateContainer.classList.add('hidden');

            const role = getAdminSessionRole();
            const isAdmin = isUserAdminRole();

            list.forEach((item, index) => {
                const status = String(item.status || "draft").toLowerCase();
                let statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-200";
                let statusLabel = "Draft";

                if (status === "published") {
                    statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                    statusLabel = "Published";
                } else if (status === "archived") {
                    statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                    statusLabel = "Archived";
                }

                const updatedDateStr = item.updated_at ? new Date(item.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
                const updatedByStr = item.updated_by || "system";

                // Desktop Row
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition duration-150";
                tr.innerHTML = `
                    <td class="py-3 px-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                <img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.name || '')}" class="w-full h-full object-cover">
                            </div>
                            <div class="min-w-0">
                                <h4 class="font-bold text-slate-800 text-xs truncate">${escapeHtml(item.name || '-')}</h4>
                                <span class="text-[10px] font-mono text-slate-400">ID: ${escapeHtml(item.id || '-')}</span>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-3 text-slate-600 font-semibold text-[11px]">${escapeHtml(item.badge || '-')}</td>
                    <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}">${statusLabel}</span>
                    </td>
                    <td class="py-3 px-3 font-mono text-xs font-bold text-slate-600">v${escapeHtml(item.version || 1)}</td>
                    <td class="py-3 px-3 text-[11px] text-slate-400">
                        <div>${updatedDateStr}</div>
                        <div class="text-[10px] text-slate-500">Oleh: ${escapeHtml(updatedByStr)}</div>
                    </td>
                    <td class="py-3 px-3 text-center">
                        <div class="flex items-center justify-center space-x-1.5">
                            <button type="button" onclick="openAdminProgramEditor('${item.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200/80 transition shadow-sm" title="Edit Program">
                                <i class="fa-solid fa-pen mr-1"></i> Edit
                            </button>
                            <button type="button" onclick="openAdminProgramPreview('${item.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition shadow-sm" title="Preview Tampilan">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            ${status === 'draft' ? `
                                <button type="button" onclick="handleAdminProgramPublish('${item.id}', ${item.version || 1})" ${!isAdmin ? 'disabled title="Hanya Admin yang dapat mempublikasikan"' : 'title="Publikasikan Program"'} class="px-2.5 py-1 ${isAdmin ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'} rounded-lg text-xs font-semibold border transition shadow-sm">
                                    <i class="fa-solid fa-paper-plane mr-1"></i> Publish
                                </button>
                            ` : ''}
                            ${status === 'published' ? `
                                <button type="button" onclick="handleAdminProgramUnpublish('${item.id}', ${item.version || 1})" ${!isAdmin ? 'disabled' : ''} class="px-2.5 py-1 ${isAdmin ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'} rounded-lg text-xs font-semibold border transition shadow-sm" title="Kembalikan ke Draft">
                                    Unpublish
                                </button>
                                <button type="button" onclick="handleAdminProgramArchive('${item.id}', ${item.version || 1})" ${!isAdmin ? 'disabled' : ''} class="px-2.5 py-1 ${isAdmin ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'} rounded-lg text-xs font-semibold border transition shadow-sm" title="Arsipkan Program">
                                    Arsipkan
                                </button>
                            ` : ''}
                            ${status === 'archived' ? `
                                <button type="button" onclick="handleAdminProgramUnpublish('${item.id}', ${item.version || 1})" ${!isAdmin ? 'disabled' : ''} class="px-2.5 py-1 ${isAdmin ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'} rounded-lg text-xs font-semibold border transition shadow-sm" title="Pulihkan ke Draft">
                                    Pulihkan
                                </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);

                // Mobile Card View
                const card = document.createElement('div');
                card.className = "bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5";
                card.innerHTML = `
                    <div class="flex justify-between items-start gap-2">
                        <div class="flex items-center space-x-2.5 min-w-0">
                            <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                                <img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.name || '')}" class="w-full h-full object-cover">
                            </div>
                            <div class="min-w-0">
                                <span class="text-[9px] font-bold text-slate-400 uppercase">v${escapeHtml(item.version || 1)} • ${escapeHtml(item.badge || '')}</span>
                                <h4 class="font-bold text-slate-800 text-xs truncate">${escapeHtml(item.name || '')}</h4>
                                <span class="text-[10px] font-mono text-slate-400">ID: ${escapeHtml(item.id || '')}</span>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusBadgeClass}">${statusLabel}</span>
                    </div>
                    <div class="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
                        <span>Update: ${updatedDateStr}</span>
                        <span>Oleh: ${escapeHtml(updatedByStr)}</span>
                    </div>
                    <div class="pt-2 flex flex-wrap gap-1.5 justify-end">
                        <button type="button" onclick="openAdminProgramEditor('${item.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                            <i class="fa-solid fa-pen mr-1"></i> Edit
                        </button>
                        <button type="button" onclick="openAdminProgramPreview('${item.id}')" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
                            <i class="fa-solid fa-eye mr-1"></i> Preview
                        </button>
                        ${status === 'draft' && isAdmin ? `
                            <button type="button" onclick="handleAdminProgramPublish('${item.id}', ${item.version || 1})" class="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm">
                                <i class="fa-solid fa-paper-plane mr-1"></i> Publish
                            </button>
                        ` : ''}
                        ${status === 'published' && isAdmin ? `
                            <button type="button" onclick="handleAdminProgramUnpublish('${item.id}', ${item.version || 1})" class="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm">
                                Unpublish
                            </button>
                            <button type="button" onclick="handleAdminProgramArchive('${item.id}', ${item.version || 1})" class="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm">
                                Arsipkan
                            </button>
                        ` : ''}
                        ${status === 'archived' && isAdmin ? `
                            <button type="button" onclick="handleAdminProgramUnpublish('${item.id}', ${item.version || 1})" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">
                                Pulihkan
                            </button>
                        ` : ''}
                    </div>
                `;
                mobileList.appendChild(card);
            });
        }

        function switchAdminProgramTab(tabName) {
            document.querySelectorAll('.admin-prog-tab-btn').forEach(btn => {
                btn.className = "admin-prog-tab-btn px-3.5 py-2 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition shrink-0";
            });
            document.querySelectorAll('.admin-prog-panel').forEach(panel => panel.classList.add('hidden'));

            const activeBtn = document.getElementById(`admin-prog-tab-btn-${tabName}`);
            const activePanel = document.getElementById(`admin-prog-panel-${tabName}`);

            if (activeBtn) activeBtn.className = "admin-prog-tab-btn px-3.5 py-2 text-xs font-bold border-b-2 border-emerald-600 text-emerald-800 transition shrink-0";
            if (activePanel) activePanel.classList.remove('hidden');
        }

        // ==================== DASHBOARD ADMIN: MANAJEMEN PROGRAM MEDIA & GALLERY ====================
        let adminProgramGalleryItems = [];

        function renderAdminProgramGalleryItems() {
            const container = document.getElementById('admin-prog-gallery-container');
            if (!container) return;

            container.innerHTML = "";

            if (adminProgramGalleryItems.length === 0) {
                container.innerHTML = `
                    <div class="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        <i class="fa-solid fa-images text-2xl text-slate-300 mb-1.5 block"></i>
                        Belum ada foto galeri. Klik <strong>Tambah Foto Galeri</strong> untuk mengunggah.
                    </div>
                `;
                return;
            }

            adminProgramGalleryItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = "p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3";
                card.innerHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span class="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                            Foto #${index + 1}
                        </span>
                        <button type="button" onclick="removeAdminProgramGalleryItem(${index})"
                            class="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center space-x-1">
                            <i class="fa-solid fa-trash-can text-[11px]"></i>
                            <span>Hapus</span>
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                        <!-- Preview Thumbnail -->
                        <div class="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                            <img src="${escapeHtml(item.image || '')}" alt="Galeri #${index + 1}"
                                class="w-full h-full object-cover ${item.image ? '' : 'hidden'}" id="admin-prog-gal-img-${index}">
                            <span class="text-[10px] text-slate-400 italic text-center p-2 ${item.image ? 'hidden' : ''}" id="admin-prog-gal-ph-${index}">
                                Belum ada foto
                            </span>
                            ${item.isUploading ? `
                                <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                                    <i class="fa-solid fa-spinner fa-spin text-lg text-emerald-400"></i>
                                    <span class="text-[9px] font-semibold">Mengunggah...</span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- File Input & Caption -->
                        <div class="md:col-span-2 space-y-2">
                            <div>
                                <label class="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Pilih File Foto (Drive)</label>
                                <input type="file" accept="image/*" onchange="handleAdminProgramGalleryUpload(event, ${index})"
                                    class="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 border border-slate-200 rounded-lg cursor-pointer bg-slate-50 p-1 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Keterangan / Caption Foto</label>
                                <input type="text" value="${escapeHtml(item.caption || '')}" oninput="updateAdminProgramGalleryCaption(${index}, this.value)"
                                    placeholder="Contoh: Suasana Belajar Halaqah Tahfidz"
                                    class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none">
                            </div>
                            ${item.image ? `
                                <div class="text-[9px] text-emerald-700 font-semibold flex items-center space-x-1">
                                    <i class="fa-solid fa-check-circle"></i>
                                    <span>Tersimpan di Google Drive</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function addAdminProgramGalleryItem(itemData = null) {
            adminProgramGalleryItems.push(itemData || {
                id: 'galeri-item-' + Date.now(),
                image: '',
                caption: '',
                isUploading: false
            });
            renderAdminProgramGalleryItems();
        }

        function removeAdminProgramGalleryItem(index) {
            adminProgramGalleryItems.splice(index, 1);
            renderAdminProgramGalleryItems();
        }

        function updateAdminProgramGalleryCaption(index, caption) {
            if (adminProgramGalleryItems[index]) {
                adminProgramGalleryItems[index].caption = caption;
            }
        }

        async function handleAdminProgramCoverUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const token = getAdminSessionToken();
            if (!token) {
                showToast("❌ Sesi admin tidak ditemukan. Silakan login kembali.");
                return;
            }

            // Client-side file size check (5 MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast("❌ Ukuran file maksimal 5 MB.");
                event.target.value = '';
                return;
            }

            // Client-side MIME check
            const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!allowedMimes.includes(file.type.toLowerCase())) {
                showToast("❌ Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
                event.target.value = '';
                return;
            }

            const spinner = document.getElementById('admin-prog-cover-spinner');
            const previewImg = document.getElementById('admin-prog-cover-preview-img');
            const placeholder = document.getElementById('admin-prog-cover-preview-placeholder');
            const statusBadge = document.getElementById('admin-prog-cover-upload-status');
            const hiddenInput = document.getElementById('admin-prog-image');

            if (spinner) spinner.classList.remove('hidden');
            if (statusBadge) statusBadge.classList.add('hidden');

            try {
                const fileData = await readFileAsBase64(file);
                fileData.prefix = "COVER";

                const response = await apiPost("uploadMedia", { token, file: fileData });

                if (response && (response.success || response.status === "success")) {
                    const uploadedUrl = response.url || response.fileUrl || (response.data && response.data.url) || "";
                    if (!uploadedUrl) throw new Error("Server tidak mengembalikan URL gambar.");

                    if (hiddenInput) hiddenInput.value = uploadedUrl;
                    if (previewImg) {
                        previewImg.src = uploadedUrl;
                        previewImg.classList.remove('hidden');
                    }
                    if (placeholder) placeholder.classList.add('hidden');
                    if (statusBadge) {
                        statusBadge.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Tersimpan di Drive`;
                        statusBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800";
                        statusBadge.classList.remove('hidden');
                    }
                    showToast("✅ Cover program berhasil diunggah ke Google Drive!");
                } else {
                    const errMsg = (response && response.message) || "Gagal mengunggah gambar ke Google Drive.";
                    throw new Error(errMsg);
                }
            } catch (err) {
                console.error("Gagal upload cover:", err);
                showToast("❌ Gagal upload cover: " + err.message);
                if (statusBadge) {
                    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Upload Gagal`;
                    statusBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800";
                    statusBadge.classList.remove('hidden');
                }
            } finally {
                if (spinner) spinner.classList.add('hidden');
            }
        }

        async function handleAdminProgramGalleryUpload(event, index) {
            const file = event.target.files[0];
            if (!file || !adminProgramGalleryItems[index]) return;

            const token = getAdminSessionToken();
            if (!token) {
                showToast("❌ Sesi admin tidak ditemukan. Silakan login kembali.");
                return;
            }

            // Client-side file size check (5 MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast("❌ Ukuran file maksimal 5 MB.");
                event.target.value = '';
                return;
            }

            // Client-side MIME check
            const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!allowedMimes.includes(file.type.toLowerCase())) {
                showToast("❌ Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
                event.target.value = '';
                return;
            }

            adminProgramGalleryItems[index].isUploading = true;
            renderAdminProgramGalleryItems();

            try {
                const fileData = await readFileAsBase64(file);
                fileData.prefix = "GALLERY";

                const response = await apiPost("uploadMedia", { token, file: fileData });

                if (response && (response.success || response.status === "success")) {
                    const uploadedUrl = response.url || response.fileUrl || (response.data && response.data.url) || "";
                    if (!uploadedUrl) throw new Error("Server tidak mengembalikan URL gambar.");

                    adminProgramGalleryItems[index].image = uploadedUrl;
                    showToast(`✅ Foto galeri #${index + 1} berhasil diunggah ke Google Drive!`);
                } else {
                    const errMsg = (response && response.message) || "Gagal mengunggah foto ke Google Drive.";
                    throw new Error(errMsg);
                }
            } catch (err) {
                console.error("Gagal upload foto galeri:", err);
                showToast("❌ Gagal upload foto galeri: " + err.message);
            } finally {
                if (adminProgramGalleryItems[index]) {
                    adminProgramGalleryItems[index].isUploading = false;
                }
                renderAdminProgramGalleryItems();
            }
        }

        async function handleAdminProgramProsedurUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const token = getAdminSessionToken();
            if (!token) {
                showToast("❌ Sesi admin tidak ditemukan. Silakan login kembali.");
                return;
            }

            // Client-side file size check (5 MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast("❌ Ukuran file maksimal 5 MB.");
                event.target.value = '';
                return;
            }

            // Client-side MIME check
            const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!allowedMimes.includes(file.type.toLowerCase())) {
                showToast("❌ Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.");
                event.target.value = '';
                return;
            }

            const spinner = document.getElementById('admin-prog-prosedur-spinner');
            const previewImg = document.getElementById('admin-prog-prosedur-preview-img');
            const placeholder = document.getElementById('admin-prog-prosedur-preview-placeholder');
            const statusBadge = document.getElementById('admin-prog-prosedur-upload-status');
            const hiddenInput = document.getElementById('admin-prog-prosedur-img');

            if (spinner) spinner.classList.remove('hidden');
            if (statusBadge) statusBadge.classList.add('hidden');

            try {
                const fileData = await readFileAsBase64(file);
                fileData.prefix = "PROSEDUR";

                const response = await apiPost("uploadMedia", { token, file: fileData });

                if (response && (response.success || response.status === "success")) {
                    const uploadedUrl = response.url || response.fileUrl || (response.data && response.data.url) || "";
                    if (!uploadedUrl) throw new Error("Server tidak mengembalikan URL gambar.");

                    if (hiddenInput) hiddenInput.value = uploadedUrl;
                    if (previewImg) {
                        previewImg.src = uploadedUrl;
                        previewImg.classList.remove('hidden');
                    }
                    if (placeholder) placeholder.classList.add('hidden');
                    if (statusBadge) {
                        statusBadge.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Tersimpan di Drive`;
                        statusBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800";
                        statusBadge.classList.remove('hidden');
                    }
                    showToast("✅ Gambar prosedur berhasil diunggah ke Google Drive!");
                } else {
                    const errMsg = (response && response.message) || "Gagal mengunggah gambar ke Google Drive.";
                    throw new Error(errMsg);
                }
            } catch (err) {
                console.error("Gagal upload gambar prosedur:", err);
                showToast("❌ Gagal upload gambar prosedur: " + err.message);
                if (statusBadge) {
                    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Upload Gagal`;
                    statusBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800";
                    statusBadge.classList.remove('hidden');
                }
            } finally {
                if (spinner) spinner.classList.add('hidden');
            }
        }

        function openAdminProgramEditor(programId) {
            const form = document.getElementById('adminProgramForm');
            if (form) form.reset();

            const alertBox = document.getElementById('admin-editor-alert');
            if (alertBox) {
                alertBox.className = "hidden p-3 rounded-xl border text-xs space-y-1";
                alertBox.innerHTML = "";
            }

            const titleEl = document.getElementById('admin-program-editor-title');
            const statusBadge = document.getElementById('admin-editor-status-badge');
            const versionBadge = document.getElementById('admin-editor-version-badge');
            const idInput = document.getElementById('admin-prog-id');
            const saveBtnText = document.getElementById('admin-prog-save-btn-text');
            const publishBtn = document.getElementById('admin-prog-publish-btn');
            const coverFileInput = document.getElementById('admin-prog-cover-file');
            const coverPreviewImg = document.getElementById('admin-prog-cover-preview-img');
            const coverPlaceholder = document.getElementById('admin-prog-cover-preview-placeholder');
            const coverStatus = document.getElementById('admin-prog-cover-upload-status');
            const prosedurFileInput = document.getElementById('admin-prog-prosedur-file');
            const prosedurPreviewImg = document.getElementById('admin-prog-prosedur-preview-img');
            const prosedurPlaceholder = document.getElementById('admin-prog-prosedur-preview-placeholder');
            const prosedurStatus = document.getElementById('admin-prog-prosedur-upload-status');
            const role = getAdminSessionRole();
            const isAdmin = isUserAdminRole();

            if (publishBtn) {
                if (isAdmin) publishBtn.classList.remove('hidden');
                else publishBtn.classList.add('hidden');
            }

            if (coverFileInput) coverFileInput.value = '';
            if (prosedurFileInput) prosedurFileInput.value = '';

            switchAdminProgramTab('umum');

            if (!programId) {
                // CREATE MODE
                document.getElementById('admin-prog-mode').value = "create";
                document.getElementById('admin-prog-server-version').value = "1";
                document.getElementById('admin-prog-image').value = "";
                document.getElementById('admin-prog-prosedur-img').value = "";
                if (titleEl) titleEl.innerText = "Tambah Program Baru";
                if (statusBadge) {
                    statusBadge.innerText = "Draft (Baru)";
                    statusBadge.className = "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800";
                }
                if (versionBadge) versionBadge.innerText = "v1";
                if (idInput) {
                    idInput.disabled = false;
                    idInput.readOnly = false;
                    idInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
                }
                if (coverPreviewImg) coverPreviewImg.classList.add('hidden');
                if (coverPlaceholder) coverPlaceholder.classList.remove('hidden');
                if (coverStatus) coverStatus.classList.add('hidden');

                if (prosedurPreviewImg) prosedurPreviewImg.classList.add('hidden');
                if (prosedurPlaceholder) prosedurPlaceholder.classList.remove('hidden');
                if (prosedurStatus) prosedurStatus.classList.add('hidden');

                // Inisialisasi galeri foto baru dengan 1 slot kosong
                adminProgramGalleryItems = [];
                addAdminProgramGalleryItem();

                if (saveBtnText) saveBtnText.innerText = "Simpan Draft Baru";
            } else {
                // EDIT MODE
                const existing = adminProgramData.find(p => p.id === programId);
                if (!existing) {
                    showToast("❌ Program tidak ditemukan dalam memori CMS.");
                    return;
                }

                document.getElementById('admin-prog-mode').value = "edit";
                document.getElementById('admin-prog-server-version').value = String(existing.version || 1);

                if (titleEl) titleEl.innerText = `Edit Program: ${existing.name}`;
                if (statusBadge) {
                    const st = String(existing.status || "draft").toLowerCase();
                    statusBadge.innerText = st.toUpperCase();
                    if (st === "published") statusBadge.className = "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800";
                    else if (st === "draft") statusBadge.className = "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800";
                    else statusBadge.className = "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-slate-200 text-slate-700";
                }
                if (versionBadge) versionBadge.innerText = `v${existing.version || 1}`;

                if (idInput) {
                    idInput.value = existing.id || "";
                    idInput.disabled = true;
                    idInput.readOnly = true;
                    idInput.classList.add('bg-slate-100', 'cursor-not-allowed');
                }

                // Populate Fields
                document.getElementById('admin-prog-badge').value = existing.badge || "";
                document.getElementById('admin-prog-name').value = existing.name || "";
                document.getElementById('admin-prog-desc').value = existing.description || "";
                let hl = existing.highlights;
                if (typeof hl === 'string') {
                    try { hl = JSON.parse(hl); } catch(e) { hl = []; }
                }
                if (!Array.isArray(hl) && existing.highlights_json) {
                    try { hl = JSON.parse(existing.highlights_json); } catch(e) { hl = []; }
                }
                document.getElementById('admin-prog-highlights').value = Array.isArray(hl) ? hl.join('\n') : "";
                document.getElementById('admin-prog-image').value = existing.image || "";

                // Cover Preview
                if (existing.image) {
                    if (coverPreviewImg) {
                        coverPreviewImg.src = existing.image;
                        coverPreviewImg.classList.remove('hidden');
                    }
                    if (coverPlaceholder) coverPlaceholder.classList.add('hidden');
                    if (coverStatus) {
                        coverStatus.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Tersimpan di Drive`;
                        coverStatus.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800";
                        coverStatus.classList.remove('hidden');
                    }
                } else {
                    if (coverPreviewImg) coverPreviewImg.classList.add('hidden');
                    if (coverPlaceholder) coverPlaceholder.classList.remove('hidden');
                    if (coverStatus) coverStatus.classList.add('hidden');
                }

                let d = existing.detail;
                if (typeof d === 'string') {
                    try { d = JSON.parse(d); } catch (e) { d = null; }
                }
                if (!d || typeof d !== 'object') {
                    let dJson = existing.detail_json;
                    if (typeof dJson === 'string') {
                        try { dJson = JSON.parse(dJson); } catch (e) { dJson = null; }
                    }
                    d = (dJson && typeof dJson === 'object') ? dJson : {};
                }
                document.getElementById('admin-prog-tagline').value = d.tagline || "";
                document.getElementById('admin-prog-summary').value = d.summary || "";
                document.getElementById('admin-prog-video').value = d.video || "";
                document.getElementById('admin-prog-video-title').value = d.videoTitle || "";

                // Populate Repeatable Gallery
                if (d.gallery && Array.isArray(d.gallery) && d.gallery.length > 0) {
                    adminProgramGalleryItems = d.gallery.map((g, idx) => ({
                        id: g.sliderId || 'galeri-' + (idx + 1),
                        image: g.image || '',
                        caption: g.caption || '',
                        isUploading: false
                    }));
                } else {
                    adminProgramGalleryItems = [];
                    addAdminProgramGalleryItem();
                }
                renderAdminProgramGalleryItems();

                if (d.keunggulan && Array.isArray(d.keunggulan)) {
                    if (d.keunggulan[0]) {
                        document.getElementById('admin-prog-k1-title').value = d.keunggulan[0].title || "";
                        document.getElementById('admin-prog-k1-desc').value = d.keunggulan[0].desc || "";
                    }
                    if (d.keunggulan[1]) {
                        document.getElementById('admin-prog-k2-title').value = d.keunggulan[1].title || "";
                        document.getElementById('admin-prog-k2-desc').value = d.keunggulan[1].desc || "";
                    }
                    if (d.keunggulan[2]) {
                        document.getElementById('admin-prog-k3-title').value = d.keunggulan[2].title || "";
                        document.getElementById('admin-prog-k3-desc').value = d.keunggulan[2].desc || "";
                    }
                }

                document.getElementById('admin-prog-target-output').value = Array.isArray(d.targetOutput) ? d.targetOutput.join('\n') : "";
                document.getElementById('admin-prog-fasilitas').value = Array.isArray(d.fasilitas) ? d.fasilitas.map(f => f.text || f).join('\n') : "";

                if (d.prosedur) {
                    document.getElementById('admin-prog-prosedur-items').value = Array.isArray((d.prosedur ? d.prosedur.items : [])) ? (d.prosedur ? d.prosedur.items : []).map(p => p.title ? `${p.title}: ${p.desc}` : p).join('\n') : "";
                    const pImg = d.prosedur?.image || "";
                    document.getElementById('admin-prog-prosedur-img').value = pImg;

                    if (pImg) {
                        if (prosedurPreviewImg) {
                            prosedurPreviewImg.src = pImg;
                            prosedurPreviewImg.classList.remove('hidden');
                        }
                        if (prosedurPlaceholder) prosedurPlaceholder.classList.add('hidden');
                        if (prosedurStatus) {
                            prosedurStatus.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Tersimpan di Drive`;
                            prosedurStatus.className = "text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800";
                            prosedurStatus.classList.remove('hidden');
                        }
                    } else {
                        if (prosedurPreviewImg) prosedurPreviewImg.classList.add('hidden');
                        if (prosedurPlaceholder) prosedurPlaceholder.classList.remove('hidden');
                        if (prosedurStatus) prosedurStatus.classList.add('hidden');
                    }
                } else {
                    document.getElementById('admin-prog-prosedur-img').value = "";
                    if (prosedurPreviewImg) prosedurPreviewImg.classList.add('hidden');
                    if (prosedurPlaceholder) prosedurPlaceholder.classList.remove('hidden');
                    if (prosedurStatus) prosedurStatus.classList.add('hidden');
                }

                if (Array.isArray(d.persyaratan)) {
                    document.getElementById('admin-prog-persyaratan').value = (d.persyaratan || []).map(r => `${r.title || ''} | ${r.desc || ''}`).join('\n');
                }

                if (d.biaya) {
                    if (d.biaya?.pendaftaran) {
                        document.getElementById('admin-prog-biaya-daftar-nominal').value = d.biaya?.pendaftaran?.nominal || "";
                        document.getElementById('admin-prog-biaya-daftar-note').value = d.biaya?.pendaftaran?.note || "";
                        document.getElementById('admin-prog-biaya-daftar-items').value = Array.isArray(d.biaya?.pendaftaran?.items) ? d.biaya?.pendaftaran?.items.join('\n') : "";
                    }
                    if (d.biaya?.syahriyah) {
                        document.getElementById('admin-prog-biaya-syahriyah-nominal').value = d.biaya?.syahriyah?.nominal || "";
                        document.getElementById('admin-prog-biaya-syahriyah-note').value = d.biaya?.syahriyah?.note || "";
                        document.getElementById('admin-prog-biaya-syahriyah-items').value = Array.isArray(d.biaya?.syahriyah?.items) ? d.biaya?.syahriyah?.items.join('\n') : "";
                        document.getElementById('admin-prog-biaya-syahriyah-excluded').value = Array.isArray(d.biaya?.syahriyah?.excludedItems) ? d.biaya?.syahriyah?.excludedItems.join('\n') : "";
                    }
                }

                if (d.cta) {
                    document.getElementById('admin-prog-cta-title').value = d.cta?.title || "";
                    document.getElementById('admin-prog-cta-desc').value = d.cta?.description || "";
                    document.getElementById('admin-prog-cta-wa-link').value = d.cta?.waLink || "";
                    document.getElementById('admin-prog-cta-wa-text').value = d.cta?.waText || "";
                }

                if (saveBtnText) saveBtnText.innerText = "Simpan Perubahan";
            }

            document.getElementById('adminProgramEditorModal').classList.remove('hidden');
        }

        function closeAdminProgramEditor() {
            document.getElementById('adminProgramEditorModal').classList.add('hidden');
        }

        function getProgramFromForm() {
            const id = document.getElementById('admin-prog-id').value.trim().toLowerCase();
            const name = document.getElementById('admin-prog-name').value.trim();
            const badge = document.getElementById('admin-prog-badge').value.trim();
            const image = document.getElementById('admin-prog-image').value.trim();
            const description = document.getElementById('admin-prog-desc').value.trim();
            const highlights = document.getElementById('admin-prog-highlights').value.split('\n').map(s => s.trim()).filter(Boolean);

            const keunggulan = [
                {
                    title: document.getElementById('admin-prog-k1-title').value.trim(),
                    desc: document.getElementById('admin-prog-k1-desc').value.trim(),
                    icon: "fa-book-quran",
                    iconBg: "bg-brand-100 text-brand-700"
                },
                {
                    title: document.getElementById('admin-prog-k2-title').value.trim(),
                    desc: document.getElementById('admin-prog-k2-desc').value.trim(),
                    icon: "fa-scroll",
                    iconBg: "bg-amber-100 text-amber-800"
                },
                {
                    title: document.getElementById('admin-prog-k3-title').value.trim(),
                    desc: document.getElementById('admin-prog-k3-desc').value.trim(),
                    icon: "fa-star-and-crescent",
                    iconBg: "bg-emerald-100 text-emerald-800"
                }
            ].filter(k => k.title);

            const targetOutput = document.getElementById('admin-prog-target-output').value.split('\n').map(s => s.trim()).filter(Boolean);
            const fasilitas = document.getElementById('admin-prog-fasilitas').value.split('\n').map(s => s.trim()).filter(Boolean).map(text => ({ text, icon: "fa-check", iconColor: "text-brand-700" }));

            // Map repeatable gallery items without fallback to cover (P1-FINDING-02)
            let gallery = adminProgramGalleryItems
                .filter(g => g.image && g.image.trim() !== '')
                .map((g, idx) => ({
                    sliderId: `galeri-${id || 'item'}-${idx + 1}`,
                    image: g.image.trim(),
                    caption: (g.caption || '').trim() || 'Dokumentasi Kegiatan Santri'
                }));

            const prosedurItems = document.getElementById('admin-prog-prosedur-items').value.split('\n').map(s => s.trim()).filter(Boolean);
            const prosedurImg = document.getElementById('admin-prog-prosedur-img').value.trim();

            const persyaratan = document.getElementById('admin-prog-persyaratan').value.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    title: parts[0] || "Berkas Persyaratan",
                    desc: parts[1] || parts[0] || "",
                    icon: "fa-copy"
                };
            });

            const biayaDaftarNominal = document.getElementById('admin-prog-biaya-daftar-nominal').value.trim() || "Rp.0";
            const biayaDaftarNote = document.getElementById('admin-prog-biaya-daftar-note').value.trim();
            const biayaDaftarItems = document.getElementById('admin-prog-biaya-daftar-items').value.split('\n').map(s => s.trim()).filter(Boolean);

            const biayaSyahriyahNominal = document.getElementById('admin-prog-biaya-syahriyah-nominal').value.trim() || "Rp.0";
            const biayaSyahriyahNote = document.getElementById('admin-prog-biaya-syahriyah-note').value.trim();
            const biayaSyahriyahItems = document.getElementById('admin-prog-biaya-syahriyah-items').value.split('\n').map(s => s.trim()).filter(Boolean);
            const biayaSyahriyahExcluded = document.getElementById('admin-prog-biaya-syahriyah-excluded').value.split('\n').map(s => s.trim()).filter(Boolean);

            const ctaTitle = document.getElementById('admin-prog-cta-title').value.trim() || "Pendaftaran Santri Baru Dibuka";
            const ctaDesc = document.getElementById('admin-prog-cta-desc').value.trim();
            const ctaWaLink = document.getElementById('admin-prog-cta-wa-link').value.trim() || "https://wa.me/6281234567890";
            const ctaWaText = document.getElementById('admin-prog-cta-wa-text').value.trim() || "Konsultasi via WA";

            return {
                id,
                name,
                badge,
                image,
                description,
                highlights,
                detail: {
                    tagline: document.getElementById('admin-prog-tagline').value.trim(),
                    summary: document.getElementById('admin-prog-summary').value.trim(),
                    video: document.getElementById('admin-prog-video').value.trim(),
                    videoTitle: document.getElementById('admin-prog-video-title').value.trim(),
                    keunggulan,
                    targetOutput,
                    fasilitas,
                    gallery,
                    prosedur: {
                        items: prosedurItems,
                        image: prosedurImg,
                        imageAlt: "Prosedur PPDB"
                    },
                    persyaratan,
                    biaya: {
                        pendaftaran: {
                            nominal: biayaDaftarNominal,
                            note: biayaDaftarNote,
                            items: biayaDaftarItems
                        },
                        syahriyah: {
                            nominal: biayaSyahriyahNominal,
                            note: biayaSyahriyahNote,
                            items: biayaSyahriyahItems,
                            excludedItems: biayaSyahriyahExcluded
                        }
                    },
                    cta: {
                        title: ctaTitle,
                        description: ctaDesc,
                        waLink: ctaWaLink,
                        waBtnClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
                        waText: ctaWaText
                    }
                }
            };
        }

        function renderProgramDetailPreview(prog) {
            const theme = getProgramUiTheme(prog);
            const d = prog.detail || {};

            return `
                <div class="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                    <!-- HEADER & TAGLINE -->
                    <section class="relative bg-gradient-to-r ${theme.headerTheme} text-white p-6 md:p-8 rounded-3xl overflow-hidden shadow-md">
                        <div class="absolute -right-8 -bottom-8 text-white/5 text-9xl pointer-events-none">
                            <i class="fa-solid ${theme.headerIcon}"></i>
                        </div>
                        <div class="relative z-10 space-y-2.5">
                            <span class="${theme.pilihanBadgeStyle} text-[10px] font-extrabold px-3 py-1 rounded-full uppercase inline-block shadow">${theme.headerBadge}</span>
                            <h1 class="text-xl md:text-3xl font-extrabold leading-tight">${escapeHtml(prog.name || '')}</h1>
                            <p class="text-xs md:text-sm text-amber-300 font-semibold italic">${escapeHtml(d.tagline || '')}</p>
                        </div>
                    </section>

                    <!-- SUMMARY -->
                    <section class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <p class="text-xs md:text-sm text-slate-600 leading-relaxed">${escapeHtml(d.summary || '')}</p>
                    </section>

                    <!-- VIDEO -->
                    ${d.video ? `
                    <section class="space-y-2">
                        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Video Profil Kegiatan
                        </h3>
                        <div class="relative aspect-video rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-black">
                            <iframe class="w-full h-full" src="${escapeHtml(d.video)}" title="${escapeHtml(d.videoTitle || '')}" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </section>` : ''}

                    <!-- KEUNGGULAN -->
                    ${Array.isArray(d.keunggulan) && d.keunggulan.length > 0 ? `
                    <section class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Keunggulan & Metode Pembelajaran
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${(d.keunggulan || []).map(k => `
                                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                    <div class="w-9 h-9 ${k.iconBg || 'bg-brand-100 text-brand-700'} rounded-xl flex items-center justify-center text-sm font-bold mb-2">
                                        <i class="fa-solid ${k.icon || 'fa-check'}"></i>
                                    </div>
                                    <h4 class="text-sm font-bold text-slate-800">${escapeHtml(k.title || '')}</h4>
                                    <p class="text-[11px] text-slate-500 leading-relaxed">${escapeHtml(k.desc || '')}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>` : ''}

                    <!-- TARGET OUTPUT -->
                    ${Array.isArray(d.targetOutput) && d.targetOutput.length > 0 ? `
                    <section class="bg-emerald-700 text-white p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                        <h3 class="text-base font-bold text-center">Target Output Santri</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            ${(d.targetOutput || []).map(out => `
                                <div class="flex items-start space-x-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                                    <i class="fa-solid fa-square-check text-amber-400 mt-0.5 text-base shrink-0"></i>
                                    <span>${escapeHtml(out)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </section>` : ''}

                    <!-- BIAYA PENDIDIKAN -->
                    ${d.biaya ? `
                    <section class="space-y-4">
                        <h3 class="text-base font-bold text-slate-800 text-center">Biaya Pendidikan</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-center">
                                <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Biaya Pendaftaran</h4>
                                <div class="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">${escapeHtml(d.biaya?.pendaftaran ? d.biaya?.pendaftaran?.nominal : '-')}</div>
                                ${d.biaya?.pendaftaran && d.biaya?.pendaftaran?.items ? `
                                    <div class="space-y-2 text-xs text-left pt-3 border-t border-slate-100">
                                        ${(d.biaya?.pendaftaran?.items || []).map(item => `
                                            <div class="flex items-center space-x-2.5 text-slate-700">
                                                <i class="fa-solid fa-check text-emerald-600 font-bold"></i>
                                                <span>${escapeHtml(item)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-center">
                                <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Biaya Syahriyah (Bulanan)</h4>
                                <div class="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2">${escapeHtml(d.biaya?.syahriyah ? d.biaya?.syahriyah?.nominal : '-')}</div>
                                ${d.biaya?.syahriyah && d.biaya?.syahriyah?.items ? `
                                    <div class="space-y-2 text-xs text-left pt-3 border-t border-slate-100">
                                        ${(d.biaya?.syahriyah?.items || []).map(item => `
                                            <div class="flex items-center space-x-2.5 text-slate-700">
                                                <i class="fa-solid fa-check text-emerald-600 font-bold"></i>
                                                <span>${escapeHtml(item)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </section>` : ''}

                    <!-- GALERI FOTO DOKUMENTASI -->
                    ${Array.isArray(d.gallery) && d.gallery.length > 0 && d.gallery[0].image ? `
                    <section class="space-y-3">
                        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Galeri Foto Dokumentasi
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${(d.gallery || []).filter(g => g.image).map(g => `
                                <div class="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 space-y-1.5 p-2">
                                    <div class="aspect-video rounded-xl overflow-hidden bg-slate-100">
                                        <img src="${escapeHtml(g.image)}" alt="${escapeHtml(g.caption || '')}" class="w-full h-full object-cover">
                                    </div>
                                    ${g.caption ? `<p class="text-[11px] text-slate-600 text-center font-medium px-1">${escapeHtml(g.caption)}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </section>` : ''}
                </div>
            `;
        }

        function previewAdminProgramForm() {
            const prog = getProgramFromForm();
            const body = document.getElementById('admin-program-preview-body');
            if (body) {
                body.innerHTML = renderProgramDetailPreview(prog);
            }
            document.getElementById('adminProgramPreviewModal').classList.remove('hidden');
        }

        function openAdminProgramPreview(programId) {
            const existing = adminProgramData.find(p => p.id === programId);
            if (!existing) return;
            const body = document.getElementById('admin-program-preview-body');
            if (body) {
                body.innerHTML = renderProgramDetailPreview(existing);
            }
            document.getElementById('adminProgramPreviewModal').classList.remove('hidden');
        }

        function closeAdminProgramPreview() {
            document.getElementById('adminProgramPreviewModal').classList.add('hidden');
        }

        async function submitAdminProgramForm(shouldPublish = false) {
            const alertBox = document.getElementById('admin-editor-alert');
            const saveBtn = document.getElementById('admin-prog-save-btn');
            const publishBtn = document.getElementById('admin-prog-publish-btn');
            const mode = document.getElementById('admin-prog-mode').value;
            const version = Number(document.getElementById('admin-prog-server-version').value) || 1;

            if (alertBox) alertBox.classList.add('hidden');

            const prog = getProgramFromForm();

            // Client Validation Checks
            if (!prog.id || !/^[a-z0-9-]+$/.test(prog.id)) {
                if (alertBox) {
                    alertBox.className = "p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs";
                    alertBox.innerHTML = `<strong>Validasi Gagal:</strong> ID Program wajib diisi dengan format slug huruf kecil dan tanda hubung (-).`;
                    alertBox.classList.remove('hidden');
                }
                switchAdminProgramTab('umum');
                return;
            }

            if (!prog.name || prog.name.length < 3) {
                if (alertBox) {
                    alertBox.className = "p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs";
                    alertBox.innerHTML = `<strong>Validasi Gagal:</strong> Nama Program wajib diisi (minimal 3 karakter).`;
                    alertBox.classList.remove('hidden');
                }
                switchAdminProgramTab('umum');
                return;
            }

            if (!prog.image) {
                if (alertBox) {
                    alertBox.className = "p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs";
                    alertBox.innerHTML = `<strong>Validasi Gagal:</strong> URL Gambar Cover wajib diisi.`;
                    alertBox.classList.remove('hidden');
                }
                switchAdminProgramTab('media');
                return;
            }

            const token = getAdminSessionToken();
            if (saveBtn) saveBtn.disabled = true;
            if (publishBtn) publishBtn.disabled = true;

            try {
                let actionName = (mode === "create") ? "program.create" : "program.update";
                let payload = {
                    id: prog.id,
                    name: prog.name,
                    badge: prog.badge,
                    image: prog.image,
                    description: prog.description,
                    highlights: prog.highlights,
                    detail: prog.detail
                };

                if (mode === "edit") {
                    payload.version = version;
                }

                const response = await apiPost(actionName, { token, payload });

                if (!response || typeof response !== "object") {
                    throw new Error("Format respons API tidak valid.");
                }

                if (response.success !== true) {
                    const errObj = response.error || {};
                    const errCode = errObj.code || "SERVER_ERROR";
                    const errMsg = errObj.message || "Gagal menyimpan program.";
                    const reqId = errObj.requestId || response.requestId || "";

                    if (errCode === "CONCURRENCY_CONFLICT") {
                        if (alertBox) {
                            alertBox.className = "p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1";
                            alertBox.innerHTML = `
                                <div class="flex items-center space-x-2 font-bold text-amber-800">
                                    <i class="fa-solid fa-triangle-exclamation text-base"></i>
                                    <span>Konflik Versi Data (Concurrency Conflict)</span>
                                </div>
                                <p>Program ini telah diperbarui oleh administrator lain. Perubahan formulir Anda tetap kami pertahankan di layar ini agar tidak hilang. Silakan periksa kembali sebelum menyimpan.</p>
                                ${reqId ? `<span class="text-[10px] text-slate-400 font-mono block">Ref ID: ${escapeHtml(reqId)}</span>` : ''}
                            `;
                            alertBox.classList.remove('hidden');
                        }
                        showToast("⚠️ Terjadi konflik versi program. Silakan periksa notifikasi.");
                        return;
                    }

                    if (errCode === "UNAUTHORIZED_TOKEN") {
                        showToast("Sesi administrator telah berakhir. Silakan login kembali.");
                        logoutAdmin();
                        return;
                    }

                    throw new Error(`[${errCode}] ${errMsg}`);
                }

                const savedProgram = response.data;
                const newVersion = savedProgram ? (savedProgram.version || version) : version;

                // If publish is requested
                if (shouldPublish) {
                    const pubRes = await apiPost("program.publish", { token, id: prog.id, version: newVersion });
                    if (pubRes && pubRes.success !== true) {
                        const pErr = (pubRes.error && pubRes.error.message) || "Gagal mempublikasikan program.";
                        showToast("⚠️ Data tersimpan sebagai draft, namun publikasi gagal: " + pErr);
                    } else {
                        showToast("Alhamdulillah! Program berhasil disimpan dan dipublikasikan.");
                    }
                } else {
                    showToast("Alhamdulillah! Program berhasil disimpan.");
                }

                closeAdminProgramEditor();
                await loadAdminProgramList();

            } catch (err) {
                console.error("Gagal menyimpan program CMS:", err);
                if (alertBox) {
                    alertBox.className = "p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs";
                    alertBox.innerHTML = `<strong>Gagal:</strong> ${escapeHtml(err.message)}`;
                    alertBox.classList.remove('hidden');
                }
                showToast("❌ " + err.message);
            } finally {
                if (saveBtn) saveBtn.disabled = false;
                if (publishBtn) publishBtn.disabled = false;
            }
        }

        async function handleAdminProgramPublish(id, version) {
            if (!confirm(`Publikasikan program '${id}' ke publik?`)) return;
            const token = getAdminSessionToken();
            try {
                const response = await apiPost("program.publish", { token, id, version });
                if (response && response.success) {
                    showToast("Alhamdulillah! Program berhasil dipublikasikan.");
                    await loadAdminProgramList();
                } else {
                    const errMsg = (response && response.error && response.error.message) || "Gagal mempublikasikan program.";
                    showToast("❌ " + errMsg);
                }
            } catch (err) {
                console.error("Gagal publish program:", err);
                showToast("❌ " + err.message);
            }
        }

        async function handleAdminProgramUnpublish(id, version) {
            if (!confirm(`Tarik program '${id}' kembali ke status Draft?`)) return;
            const token = getAdminSessionToken();
            try {
                const response = await apiPost("program.unpublish", { token, id, version });
                if (response && response.success) {
                    showToast("Status program diubah menjadi Draft.");
                    await loadAdminProgramList();
                } else {
                    const errMsg = (response && response.error && response.error.message) || "Gagal unpublish program.";
                    showToast("❌ " + errMsg);
                }
            } catch (err) {
                console.error("Gagal unpublish program:", err);
                showToast("❌ " + err.message);
            }
        }

        async function handleAdminProgramArchive(id, version) {
            if (!confirm(`Arsipkan program '${id}'? Program tidak akan tampil di website publik.`)) return;
            const token = getAdminSessionToken();
            try {
                const response = await apiPost("program.archive", { token, id, version });
                if (response && response.success) {
                    showToast("Program berhasil diarsipkan.");
                    await loadAdminProgramList();
                } else {
                    const errMsg = (response && response.error && response.error.message) || "Gagal mengarsipkan program.";
                    showToast("❌ " + errMsg);
                }
            } catch (err) {
                console.error("Gagal archive program:", err);
                showToast("❌ " + err.message);
            }
        }

        // ==================== DASHBOARD ADMIN: MANAJEMEN NOTIFIKASI & POP-UP BERANDA ====================
        let adminNotifikasiList = [];

        async function loadAdminNotifikasi() {
            const loader = document.getElementById('admin-notif-loader');
            const countBadge = document.getElementById('admin-notif-list-count');
            if (loader) loader.classList.remove('hidden');

            try {
                let response = null;
                if (typeof apiGet === 'function') {
                    response = await apiGet("getNotifikasi");
                } else if (typeof API_URL !== 'undefined') {
                    const res = await fetch(`${API_URL}?action=getNotifikasi`);
                    response = await res.json();
                }

                if (response && response.status === "success" && Array.isArray(response.data)) {
                    adminNotifikasiList = response.data;
                } else if (Array.isArray(response)) {
                    adminNotifikasiList = response;
                } else if (typeof notifikasiList !== 'undefined' && Array.isArray(notifikasiList)) {
                    adminNotifikasiList = notifikasiList;
                }

                if (countBadge) countBadge.innerText = `${adminNotifikasiList.length} Warta`;
                filterAdminNotifikasiList();
            } catch (err) {
                console.error("Gagal memuat warta notifikasi:", err);
                if (typeof showToast === 'function') showToast("❌ Gagal memuat data notifikasi: " + err.message);
                filterAdminNotifikasiList();
            } finally {
                if (loader) loader.classList.add('hidden');
            }
        }

        let adminNotifStatusFilter = 'all'; // 'all', 'Aktif', 'Nonaktif'

        function setAdminNotifStatusFilter(filter) {
            adminNotifStatusFilter = filter;
            document.querySelectorAll('.admin-notif-chip').forEach(btn => {
                btn.classList.remove('bg-rose-600', 'text-white', 'shadow-sm');
                btn.classList.add('bg-slate-100', 'dark:bg-[#1c2836]', 'text-slate-600', 'dark:text-slate-300');
            });

            const targetId = filter === 'all' ? 'admin-notif-filter-all' : (filter === 'Aktif' ? 'admin-notif-filter-aktif' : 'admin-notif-filter-nonaktif');
            const activeBtn = document.getElementById(targetId);
            if (activeBtn) {
                activeBtn.classList.remove('bg-slate-100', 'dark:bg-[#1c2836]', 'text-slate-600', 'dark:text-slate-300');
                activeBtn.classList.add('bg-rose-600', 'text-white', 'shadow-sm');
            }

            filterAdminNotifikasiList();
        }

        function filterAdminNotifikasiList() {
            const searchInput = document.getElementById('admin-notif-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            // Update badge counters
            const totalCount = adminNotifikasiList.length;
            const aktifCount = adminNotifikasiList.filter(n => (n.status || 'Aktif') === 'Aktif').length;
            const nonaktifCount = adminNotifikasiList.filter(n => (n.status || 'Aktif') !== 'Aktif').length;

            const countAllEl = document.getElementById('admin-notif-count-all');
            const countAktifEl = document.getElementById('admin-notif-count-aktif');
            const countNonaktifEl = document.getElementById('admin-notif-count-nonaktif');
            const countBadge = document.getElementById('admin-notif-list-count');

            if (countAllEl) countAllEl.innerText = totalCount;
            if (countAktifEl) countAktifEl.innerText = aktifCount;
            if (countNonaktifEl) countNonaktifEl.innerText = nonaktifCount;
            if (countBadge) countBadge.innerText = `${totalCount} Warta`;

            // Update KPI Cards
            const notifKpiTotal = document.getElementById('admin-notif-kpi-total');
            const notifKpiActive = document.getElementById('admin-notif-kpi-active');
            const notifKpiPopup = document.getElementById('admin-notif-kpi-popup');
            const notifKpiInactive = document.getElementById('admin-notif-kpi-inactive');

            if (notifKpiTotal) notifKpiTotal.innerText = totalCount;
            if (notifKpiActive) notifKpiActive.innerText = aktifCount;
            if (notifKpiPopup) {
                const popupCount = adminNotifikasiList.filter(n => Boolean(n.is_popup === true || n.is_popup === 1 || String(n.is_popup) === "1" || String(n.is_popup).toLowerCase() === "true" || n.isPopup === true || n.isPopup === 1 || String(n.isPopup) === "1" || String(n.isPopup).toLowerCase() === "true" || n.popupBeranda)).length;
                notifKpiPopup.innerText = popupCount;
            }
            if (notifKpiInactive) notifKpiInactive.innerText = nonaktifCount;

            let filtered = adminNotifikasiList;

            if (adminNotifStatusFilter === 'Aktif') {
                filtered = filtered.filter(item => (item.status || 'Aktif') === 'Aktif');
            } else if (adminNotifStatusFilter === 'Nonaktif') {
                filtered = filtered.filter(item => (item.status || 'Aktif') !== 'Aktif');
            }

            if (query) {
                filtered = filtered.filter(item => 
                    (item.judul || '').toLowerCase().includes(query) ||
                    (item.kategori || '').toLowerCase().includes(query) ||
                    (item.ringkasan || '').toLowerCase().includes(query)
                );
            }
            renderAdminNotifikasiList(filtered);
        }

        function renderAdminNotifikasiList(dataToRender) {
            const items = dataToRender || adminNotifikasiList;
            const container = document.getElementById('admin-notif-cards-container');
            const emptyState = document.getElementById('admin-notif-empty-state');
            if (!container) return;

            if (items.length === 0) {
                container.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');

            container.innerHTML = items.map(item => {
                const isPopup = Boolean(item.is_popup === true || item.is_popup === 1 || String(item.is_popup) === "1" || String(item.is_popup).toLowerCase() === "true" || item.isPopup === true || item.isPopup === 1 || String(item.isPopup) === "1" || String(item.isPopup).toLowerCase() === "true");
                const isAktif = (item.status || "Aktif") === "Aktif";

                const thumb = item.gambar 
                    ? `<img src="${item.gambar}" alt="" class="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-[#253447] shrink-0" onerror="this.style.display='none'">` 
                    : `<div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1c2836] text-slate-400 flex items-center justify-center shrink-0 text-base"><i class="fa-solid fa-bell"></i></div>`;

                let badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
                if (item.kategori === 'Kegiatan') badgeBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
                if (item.kategori === 'Pembayaran') badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

                return `
                    <div class="bg-slate-50 dark:bg-[#1c2836] p-4 rounded-2xl border border-slate-100 dark:border-[#253447] flex flex-col justify-between space-y-3 ${!isAktif ? 'opacity-85 border-dashed border-slate-300 dark:border-slate-700' : ''}">
                        <div class="flex items-start gap-3">
                            ${thumb}
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeBg}">
                                        ${item.kategori || 'Pengumuman'}
                                    </span>
                                    ${isPopup ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><i class="fa-solid fa-star text-[8px] mr-1"></i>Pop-up Beranda</span>` : ''}
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${isAktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
                                        <i class="fa-solid ${isAktif ? 'fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-circle-xmark text-slate-400'} text-[8px] mr-1"></i>${isAktif ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 mt-1 line-clamp-1 leading-snug">
                                    ${item.judul}
                                </h4>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                    ${item.ringkasan || item.isi}
                                </p>
                                <span class="text-[10px] text-slate-400 mt-1 block"><i class="fa-regular fa-clock mr-1"></i>${item.tanggal || '-'}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-200/60 dark:border-[#253447] flex-wrap gap-y-1">
                            <button type="button" onclick="previewAdminNotifikasi('${item.id}')" class="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 text-xs font-bold transition flex items-center space-x-1 active:scale-95" title="Lihat Pratinjau Tampilan Warta / Pop-up">
                                <i class="fa-solid fa-eye text-[10px]"></i>
                                <span>Preview</span>
                            </button>
                            <button type="button" onclick="toggleAdminNotifikasiStatus('${item.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 active:scale-95 ${isAktif ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60'}" title="${isAktif ? 'Nonaktifkan Warta' : 'Aktifkan Warta'}">
                                <i class="fa-solid ${isAktif ? 'fa-circle-xmark text-amber-600' : 'fa-circle-check text-emerald-600'} text-[10px]"></i>
                                <span>${isAktif ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>
                            <button type="button" onclick="openAdminNotifikasiEditor('${item.id}')" class="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15202d] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253447] text-xs font-bold transition flex items-center space-x-1 active:scale-95">
                                <i class="fa-solid fa-pen text-[10px] text-brand-600 dark:text-emerald-400"></i>
                                <span>Edit</span>
                            </button>
                            <button type="button" onclick="deleteAdminNotifikasi('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-xs font-bold transition flex items-center space-x-1 active:scale-95">
                                <i class="fa-solid fa-trash text-[10px]"></i>
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function toggleAdminNotifikasiStatus(id) {
            const item = adminNotifikasiList.find(n => String(n.id) === String(id));
            if (!item) return;

            const oldStatus = item.status || 'Aktif';
            const newStatus = oldStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
            item.status = newStatus;
            filterAdminNotifikasiList();

            try {
                const token = getAdminSessionToken();
                const payload = {
                    id: item.id,
                    judul: item.judul,
                    kategori: item.kategori,
                    tanggal: item.tanggal,
                    ringkasan: item.ringkasan,
                    isi: item.isi,
                    gambar: item.gambar || '',
                    gambarLama: item.gambar || '',
                    is_popup: Boolean(item.is_popup || item.isPopup),
                    status: newStatus
                };

                let response = null;
                if (typeof apiPost === 'function') {
                    response = await apiPost("saveNotifikasi", { token, data: payload, ...payload });
                } else {
                    const res = await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: "saveNotifikasi", token, data: payload })
                    });
                    response = await res.json();
                }

                if (response && (response.status === "success" || response.success)) {
                    if (typeof showToast === 'function') showToast(`Status warta berhasil diubah ke ${newStatus}!`);
                    try {
                        sessionStorage.removeItem('asn_dismissed_popup_' + item.id);
                        localStorage.removeItem('asn_cached_notifikasi');
                    } catch (e) {}
                    await loadAdminNotifikasi();
                    if (typeof loadNotifikasi === 'function') await loadNotifikasi();
                    if (typeof updateNotifBadge === 'function') updateNotifBadge();
                } else {
                    item.status = oldStatus;
                    filterAdminNotifikasiList();
                    if (typeof showToast === 'function') showToast("❌ Gagal memperbarui status: " + ((response && response.message) || 'Error'));
                }
            } catch (err) {
                item.status = oldStatus;
                filterAdminNotifikasiList();
                console.error("toggleAdminNotifikasiStatus error:", err);
                if (typeof showToast === 'function') showToast("❌ Gagal memperbarui status: " + err.message);
            }
        }

        function previewAdminNotifikasi(id) {
            const item = adminNotifikasiList.find(n => String(n.id) === String(id));
            if (!item) return;
            previewAdminNotifikasiObject(item);
        }

        function previewCurrentAdminNotifikasiForm() {
            const judul = (document.getElementById('admin-notif-judul') ? document.getElementById('admin-notif-judul').value : '').trim() || 'Judul Notifikasi (Pratinjau)';
            const kategori = (document.getElementById('admin-notif-kategori') ? document.getElementById('admin-notif-kategori').value : '') || 'Pengumuman';
            const tanggal = (document.getElementById('admin-notif-tanggal') ? document.getElementById('admin-notif-tanggal').value : '') || new Date().toISOString().split('T')[0];
            const ringkasan = (document.getElementById('admin-notif-ringkasan') ? document.getElementById('admin-notif-ringkasan').value : '').trim() || 'Ringkasan singkat warta pengumuman santri dan wali santri...';
            const isi = (document.getElementById('admin-notif-isi') ? document.getElementById('admin-notif-isi').value : '').trim() || ringkasan;
            const gambarUrl = (document.getElementById('admin-notif-gambar-url') ? document.getElementById('admin-notif-gambar-url').value : '').trim();
            const oldGambar = (document.getElementById('admin-notif-old-gambar') ? document.getElementById('admin-notif-old-gambar').value : '');
            const previewImg = document.getElementById('admin-notif-preview-img');
            const gambar = (previewImg && !previewImg.classList.contains('hidden') && previewImg.src) ? previewImg.src : (gambarUrl || oldGambar || '');
            const isPopupEl = document.getElementById('admin-notif-is-popup');
            const isPopup = isPopupEl ? isPopupEl.checked : false;

            const mockItem = {
                id: 'PREVIEW_TEMP',
                judul,
                kategori,
                tanggal,
                ringkasan,
                isi,
                gambar,
                is_popup: isPopup,
                isPopup: isPopup,
                status: 'Aktif'
            };

            previewAdminNotifikasiObject(mockItem);
        }

        function previewAdminNotifikasiObject(item) {
            if (!item) return;
            const isPopup = Boolean(item.is_popup === true || item.is_popup === 1 || String(item.is_popup) === "1" || String(item.is_popup).toLowerCase() === "true" || item.isPopup === true || item.isPopup === 1 || String(item.isPopup) === "1" || String(item.isPopup).toLowerCase() === "true");

            if (isPopup) {
                // Pratinjau Pop-up Beranda
                const modal = document.getElementById('homePosterModal');
                const content = document.getElementById('homePosterContent');
                const imgWrapper = document.getElementById('home-poster-img-wrapper');
                const imgEl = document.getElementById('home-poster-img');
                const textWrapper = document.getElementById('home-poster-text-wrapper');
                const titleEl = document.getElementById('home-poster-title');
                const summaryEl = document.getElementById('home-poster-summary');
                const badgeEl = document.getElementById('home-poster-badge');

                const hasValidImg = item.gambar && !String(item.gambar).includes('brand-header.png') && String(item.gambar).trim().length > 5;

                if (hasValidImg) {
                    if (imgEl) imgEl.src = item.gambar;
                    if (imgWrapper) imgWrapper.classList.remove('hidden');
                    if (textWrapper) textWrapper.classList.add('hidden');
                } else {
                    if (titleEl) titleEl.innerText = item.judul;
                    if (summaryEl) summaryEl.innerText = item.ringkasan || (item.isi ? item.isi.substring(0, 150) : '');
                    if (badgeEl) badgeEl.innerText = item.kategori || 'Pengumuman';
                    if (imgWrapper) imgWrapper.classList.add('hidden');
                    if (textWrapper) textWrapper.classList.remove('hidden');
                }

                if (modal && content) {
                    modal.dataset.notifId = item.id;
                    modal.dataset.isPreview = 'true';
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        content.classList.remove('scale-95', 'opacity-0');
                        content.classList.add('scale-100', 'opacity-100');
                    }, 50);
                }
            } else {
                // Pratinjau Detail Warta Pengumuman
                const modal = document.getElementById('notifikasiDetailModal');
                const content = document.getElementById('notifikasiDetailContent');
                const titleEl = document.getElementById('notif-detail-title');
                const bodyEl = document.getElementById('notif-detail-body');
                const dateEl = document.getElementById('notif-detail-date');
                const badgeEl = document.getElementById('notif-detail-badge');
                const imgWrapper = document.getElementById('notif-detail-img-wrapper');
                const imgEl = document.getElementById('notif-detail-img');

                if (titleEl) titleEl.innerText = item.judul;
                if (bodyEl) bodyEl.innerText = item.isi || item.ringkasan || '';
                if (dateEl) dateEl.innerText = item.tanggal || '';
                if (badgeEl) badgeEl.innerText = item.kategori || 'Pengumuman';

                if (imgWrapper && imgEl) {
                    if (item.gambar && String(item.gambar).trim().length > 5) {
                        imgEl.src = item.gambar;
                        imgWrapper.classList.remove('hidden');
                    } else {
                        imgWrapper.classList.add('hidden');
                    }
                }

                if (modal && content) {
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        content.classList.remove('scale-95', 'opacity-0');
                        content.classList.add('scale-100', 'opacity-100');
                    }, 20);
                }
            }
        }

        function openAdminNotifikasiEditor(id) {
            const item = adminNotifikasiList.find(n => String(n.id) === String(id));
            if (!item) return;

            document.getElementById('admin-notif-id').value = item.id;
            document.getElementById('admin-notif-judul').value = item.judul || '';
            document.getElementById('admin-notif-kategori').value = item.kategori || 'Pengumuman';
            document.getElementById('admin-notif-tanggal').value = item.tanggal || '';
            document.getElementById('admin-notif-ringkasan').value = item.ringkasan || '';
            document.getElementById('admin-notif-isi').value = item.isi || '';
            document.getElementById('admin-notif-gambar-url').value = item.gambar || '';
            document.getElementById('admin-notif-old-gambar').value = item.gambar || '';
            document.getElementById('admin-notif-is-popup').checked = Boolean(item.is_popup === true || item.is_popup === 1 || String(item.is_popup) === '1' || String(item.is_popup).toLowerCase() === 'true' || item.isPopup === true || item.isPopup === 1 || String(item.isPopup) === '1' || String(item.isPopup).toLowerCase() === 'true');
            document.getElementById('admin-notif-status').value = item.status || 'Aktif';

            const previewImg = document.getElementById('admin-notif-preview-img');
            const previewPlaceholder = document.getElementById('admin-notif-preview-placeholder');
            if (item.gambar) {
                if (previewImg) { previewImg.src = item.gambar; previewImg.classList.remove('hidden'); }
                if (previewPlaceholder) previewPlaceholder.classList.add('hidden');
            } else {
                if (previewImg) previewImg.classList.add('hidden');
                if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');
            }

            const title = document.getElementById('admin-notif-form-title');
            const cancelBtn = document.getElementById('admin-notif-cancel-btn');
            const submitText = document.getElementById('admin-notif-submit-text');
            if (title) title.innerHTML = '<i class="fa-solid fa-pen-to-square text-rose-600 mr-2"></i> Edit Notifikasi';
            if (cancelBtn) cancelBtn.classList.remove('hidden');
            if (submitText) submitText.innerText = 'Perbarui Notifikasi';

            const formEl = document.getElementById('adminNotifikasiForm');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function resetAdminNotifikasiForm() {
            const form = document.getElementById('adminNotifikasiForm');
            if (form) form.reset();

            document.getElementById('admin-notif-id').value = '';
            document.getElementById('admin-notif-old-gambar').value = '';
            document.getElementById('admin-notif-tanggal').value = new Date().toISOString().split('T')[0];

            const previewImg = document.getElementById('admin-notif-preview-img');
            const previewPlaceholder = document.getElementById('admin-notif-preview-placeholder');
            if (previewImg) previewImg.classList.add('hidden');
            if (previewPlaceholder) previewPlaceholder.classList.remove('hidden');

            const title = document.getElementById('admin-notif-form-title');
            const cancelBtn = document.getElementById('admin-notif-cancel-btn');
            const submitText = document.getElementById('admin-notif-submit-text');
            if (title) title.innerHTML = '<i class="fa-solid fa-bullhorn text-rose-600 mr-2"></i> Tambah Notifikasi Baru';
            if (cancelBtn) cancelBtn.classList.add('hidden');
            if (submitText) submitText.innerText = 'Simpan & Publikasikan';
        }

        function previewAdminNotifImage(event) {
            const file = event.target.files && event.target.files[0];
            const previewImg = document.getElementById('admin-notif-preview-img');
            const previewPlaceholder = document.getElementById('admin-notif-preview-placeholder');

            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) { previewImg.src = e.target.result; previewImg.classList.remove('hidden'); }
                    if (previewPlaceholder) previewPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        }

        async function handleAdminNotifikasiSubmit(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-notif-submit-btn');
            const btnIcon = document.getElementById('admin-notif-submit-icon');
            const btnText = document.getElementById('admin-notif-submit-text');

            const id = document.getElementById('admin-notif-id').value;
            const judul = document.getElementById('admin-notif-judul').value.trim();
            const kategori = document.getElementById('admin-notif-kategori').value;
            const tanggal = document.getElementById('admin-notif-tanggal').value || new Date().toISOString().split('T')[0];
            const ringkasan = document.getElementById('admin-notif-ringkasan').value.trim();
            const isi = document.getElementById('admin-notif-isi').value.trim();
            const gambarUrl = document.getElementById('admin-notif-gambar-url').value.trim();
            const oldGambar = document.getElementById('admin-notif-old-gambar').value;
            const isPopup = document.getElementById('admin-notif-is-popup').checked;
            const status = document.getElementById('admin-notif-status').value;

            const fileInput = document.getElementById('admin-notif-file');
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;

            btn.disabled = true;
            if (btnIcon) btnIcon.className = "fa-solid fa-spinner fa-spin";
            if (btnText) btnText.innerText = "Menyimpan Warta...";

            try {
                let fileData = null;
                if (file && typeof compressImageFile === 'function') {
                    fileData = await compressImageFile(file, 1600, 0.90);
                }

                const token = getAdminSessionToken();
                const payload = {
                    id: id || undefined,
                    judul,
                    kategori,
                    tanggal,
                    ringkasan,
                    isi,
                    gambar: gambarUrl || oldGambar || "",
                    gambarLama: oldGambar,
                    file: fileData,
                    is_popup: isPopup,
                    status
                };

                let response = null;
                if (typeof apiPost === 'function') {
                    response = await apiPost("saveNotifikasi", { token, data: payload, ...payload });
                } else {
                    const res = await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: "saveNotifikasi", token, data: payload })
                    });
                    response = await res.json();
                }

                if (response && (response.status === "success" || response.success)) {
                    if (typeof showToast === 'function') showToast(response.message || "Warta notifikasi berhasil disimpan!");
                    resetAdminNotifikasiForm();
                    try {
                        localStorage.removeItem('asn_cached_notifikasi');
                    } catch (e) {}
                    await loadAdminNotifikasi();
                    if (isPopup) {
                        try {
                            const newId = (response && (response.id || response.notifId)) || id;
                            if (newId) sessionStorage.removeItem('asn_dismissed_popup_' + newId);
                        } catch (e) {}
                    }
                    if (typeof loadNotifikasi === 'function') {
                        await loadNotifikasi();
                    }
                    if (typeof updateNotifBadge === 'function') {
                        updateNotifBadge();
                    }
                } else {
                    const msg = (response && response.message) || "Gagal menyimpan notifikasi.";
                    if (typeof showToast === 'function') showToast("❌ " + msg);
                }
            } catch (err) {
                console.error("Gagal simpan notifikasi:", err);
                if (typeof showToast === 'function') showToast("❌ " + err.message);
            } finally {
                btn.disabled = false;
                if (btnIcon) btnIcon.className = "fa-solid fa-paper-plane";
                if (btnText) btnText.innerText = id ? "Perbarui Notifikasi" : "Simpan & Publikasikan";
            }
        }

        async function deleteAdminNotifikasi(id) {
            if (!confirm("Apakah Anda yakin ingin menghapus warta notifikasi ini?")) return;

            const token = getAdminSessionToken();
            try {
                let response = null;
                const deletePayload = { token, id, notifId: id, data: { id, notifId: id } };
                if (typeof apiPost === 'function') {
                    response = await apiPost("deleteNotifikasi", deletePayload);
                } else {
                    const res = await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: "deleteNotifikasi", ...deletePayload })
                    });
                    response = await res.json();
                }

                if (response && (response.status === "success" || response.success)) {
                    if (typeof showToast === 'function') showToast("Warta notifikasi berhasil dihapus!");
                    try {
                        localStorage.removeItem('asn_cached_notifikasi');
                    } catch (e) {}
                    await loadAdminNotifikasi();
                    if (typeof loadNotifikasi === 'function') loadNotifikasi();
                } else {
                    const msg = (response && response.message) || "Gagal menghapus warta notifikasi.";
                    if (typeof showToast === 'function') showToast("❌ " + msg);
                }
            } catch (err) {
                console.error("Gagal hapus notifikasi:", err);
                if (typeof showToast === 'function') showToast("❌ " + err.message);
            }
        }

