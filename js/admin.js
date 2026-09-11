        // ==================== DASHBOARD ADMIN: CORE & NAVIGASI ====================
        function openAdminLoginModal() {
            if (isAdminLoggedIn) {
                switchTab('admin');
                showAdminView('hub');
                renderAdminNewsList();
                renderAdminBannerList();
                loadAdminPPDBData();
                return;
            }
            if (typeof openAdminAuthModal === 'function') {
                openAdminAuthModal();
                return;
            }
            showToast("Modul autentikasi admin belum siap.");
        }

        function closeAdminLoginModal() {
            if (typeof closeAdminAuthModal === 'function') {
                closeAdminAuthModal();
            }
            const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
            if (activeTabEl && activeTabEl.id === 'page-admin' && !isAdminLoggedIn) {
                switchTab('beranda');
            }
        }

        function logoutAdmin() {
            isAdminLoggedIn = false;
            sessionStorage.removeItem("asnawiyyah_admin_token");
            sessionStorage.removeItem("asnawiyyah_admin_role");
            if (typeof ASNIdentity !== 'undefined' && typeof ASNIdentity.logout === 'function') {
                ASNIdentity.logout();
            }
            showToast("Keluar dari Mode Admin.");
            switchTab('beranda');
        }

        
        let adminSidebarCollapsed = false;
        function toggleAdminSidebar() {
            adminSidebarCollapsed = !adminSidebarCollapsed;
            const sidebar = document.getElementById('admin-sidebar');
            const icon = document.getElementById('admin-sidebar-icon');
            const texts = document.querySelectorAll('.sidebar-text');
            
            if (adminSidebarCollapsed) {
                sidebar.classList.remove('w-64');
                sidebar.classList.add('w-16');
                icon.classList.add('rotate-180');
                texts.forEach(el => {
                    el.classList.add('opacity-0', 'invisible', 'w-0');
                    el.classList.remove('opacity-100');
                });
            } else {
                sidebar.classList.remove('w-16');
                sidebar.classList.add('w-64');
                icon.classList.remove('rotate-180');
                texts.forEach(el => {
                    el.classList.remove('opacity-0', 'invisible', 'w-0');
                    el.classList.add('opacity-100');
                });
            }
        }

        function showAdminView(viewName) {
            // Update Sidebar Active state
            document.querySelectorAll('.admin-nav-item').forEach(btn => {
                if (btn.dataset.view === viewName) {
                    btn.classList.add('active', 'text-brand-700', 'bg-brand-50', 'font-bold');
                    btn.classList.remove('text-slate-500', 'font-semibold');
                } else {
                    btn.classList.remove('active', 'text-brand-700', 'bg-brand-50', 'font-bold');
                    btn.classList.add('text-slate-500', 'font-semibold');
                }
            });
            

            const hubView = document.getElementById('admin-menu-hub');
            const beritaView = document.getElementById('admin-view-berita');
            const bannerView = document.getElementById('admin-view-banner');
            const ppdbView = document.getElementById('admin-view-ppdb');
            const programView = document.getElementById('admin-view-program');
            const galeriView = document.getElementById('admin-view-galeri');
            const pengaturanView = document.getElementById('admin-view-pengaturan');
            const profilLembagaView = document.getElementById('admin-view-profil-lembaga');
            const unitKegiatanView = document.getElementById('admin-view-unit-kegiatan');
            const notifikasiView = document.getElementById('admin-view-notifikasi');

            if (!hubView || !beritaView || !bannerView) return;

            hubView.classList.add('hidden');
            beritaView.classList.add('hidden');
            bannerView.classList.add('hidden');
            if (ppdbView) ppdbView.classList.add('hidden');
            if (programView) programView.classList.add('hidden');
            if (galeriView) galeriView.classList.add('hidden');
            if (pengaturanView) pengaturanView.classList.add('hidden');
            if (profilLembagaView) profilLembagaView.classList.add('hidden');
            if (unitKegiatanView) unitKegiatanView.classList.add('hidden');
            if (notifikasiView) notifikasiView.classList.add('hidden');

            if (viewName === 'berita') {
                beritaView.classList.remove('hidden');
                renderAdminNewsList();
            } else if (viewName === 'banner') {
                bannerView.classList.remove('hidden');
                renderAdminBannerList();
            } else if (viewName === 'notifikasi') {
                if (notifikasiView) notifikasiView.classList.remove('hidden');
                loadAdminNotifikasi();
            } else if (viewName === 'galeri') {
                if (galeriView) galeriView.classList.remove('hidden');
                renderAdminGaleriList();
            } else if (viewName === 'pengaturan') {
                if (pengaturanView) pengaturanView.classList.remove('hidden');
                loadAdminPengaturan();
            } else if (viewName === 'ppdb') {
                if (ppdbView) ppdbView.classList.remove('hidden');
                loadAdminPPDBData();
            } else if (viewName === 'program') {
                if (programView) programView.classList.remove('hidden');
                loadAdminProgramList();
            } else if (viewName === 'profil-lembaga') {
                if (profilLembagaView) profilLembagaView.classList.remove('hidden');
                loadAdminProfilLembaga();
            } else if (viewName === 'unit-kegiatan') {
                if (unitKegiatanView) unitKegiatanView.classList.remove('hidden');
                renderAdminUnitKegiatanList();
            } else {
                hubView.classList.remove('hidden');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

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
                    const config = data.data;
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
                const pTags = textSejarah.split('\n').filter(t => t.trim() !== '').map(p => `<p>${p}</p>`).join('');
                containerSejarah.innerHTML = pTags;
            }

            if (containerVisiMisi) {
                const textVisiMisi = window.APP_CONFIG.visi_misi || "Visi misi belum ditambahkan.";
                const pTags = textVisiMisi.split('\n').filter(t => t.trim() !== '').map(p => `<p>${p}</p>`).join('');
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
                        const imgSrc = p.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nama || 'P') + '&background=e0e7ff&color=4f46e5';
                        containerPengurus.innerHTML += `
                            <div class="bg-slate-50 dark:bg-[#1c2836] rounded-3xl overflow-hidden border border-slate-100 dark:border-[#253447] p-4 text-center space-y-3 flex flex-col items-center hover:shadow-md transition">
                                <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-600 shadow-sm shrink-0 bg-white dark:bg-[#15202d]">
                                    <img src="${imgSrc}" alt="${p.nama}" class="w-full h-full object-cover">
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

        // ==================== DASHBOARD ADMIN: PROFIL LEMBAGA ====================
        let adminPengurusList = [];

        function renderPengurusFields() {
            const container = document.getElementById('container-pengurus');
            if (!container) return;
            container.innerHTML = '';
            
            if (adminPengurusList.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 italic py-2 text-center">Belum ada data pengurus. Klik "Tambah Pengurus".</p>`;
                return;
            }

            adminPengurusList.forEach((pengurus, index) => {
                const div = document.createElement('div');
                div.className = "p-4 border border-slate-200 rounded-xl bg-slate-50 relative flex gap-4 items-start";
                
                const imgSrc = pengurus.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(pengurus.nama || 'P') + '&background=e0e7ff&color=4f46e5';
                
                div.innerHTML = `
                    <div class="flex-shrink-0 w-16 md:w-20">
                        <div class="relative group aspect-square rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                            <img id="preview-pengurus-${index}" src="${imgSrc}" class="w-full h-full object-cover" alt="Foto">
                            <label class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                <i class="fa-solid fa-camera text-sm mb-1"></i>
                                <span class="text-[8px] font-bold">Ubah</span>
                                <input type="file" accept="image/*" class="hidden" onchange="uploadPengurusFoto(event, ${index})">
                            </label>
                        </div>
                        <input type="hidden" id="input-pengurus-foto-${index}" value="${pengurus.foto || ''}">
                    </div>
                    <div class="flex-1 space-y-3">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                            <input type="text" id="input-pengurus-nama-${index}" value="${pengurus.nama || ''}" 
                                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 text-sm outline-none" placeholder="Cth: KH. Fulan bin Fulan">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan</label>
                            <input type="text" id="input-pengurus-jabatan-${index}" value="${pengurus.jabatan || ''}" 
                                class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 text-sm outline-none" placeholder="Cth: Pengasuh Pesantren">
                        </div>
                    </div>
                    <button type="button" onclick="removePengurusField(${index})" class="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 w-7 h-7 rounded-lg flex items-center justify-center transition" title="Hapus">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                `;
                container.appendChild(div);
            });
        }

        function addPengurusField() {
            syncPengurusList();
            adminPengurusList.push({ nama: "", jabatan: "", foto: "" });
            renderPengurusFields();
        }

        function removePengurusField(index) {
            if(!confirm("Yakin ingin menghapus pengurus ini?")) return;
            syncPengurusList();
            adminPengurusList.splice(index, 1);
            renderPengurusFields();
        }

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
        }

        async function uploadPengurusFoto(event, index) {
            const file = event.target.files[0];
            if (!file) return;

            const previewImg = document.getElementById(`preview-pengurus-${index}`);
            const originalSrc = previewImg.src;
            previewImg.src = "https://i.gifer.com/ZKZg.gif"; 

            try {
                const token = getAdminSessionToken();
                const fileData = await readFileAsBase64(file);
                fileData.prefix = "PENGURUS";

                const response = await apiPost("uploadMedia", { token, file: fileData });
                
                if (response && (response.success || response.status === "success")) {
                    const uploadedUrl = response.url || response.fileUrl || (response.data && response.data.url) || "";
                    if (!uploadedUrl) throw new Error("Server tidak mengembalikan URL gambar.");
                    
                    previewImg.src = uploadedUrl;
                    const hiddenInput = document.getElementById(`input-pengurus-foto-${index}`);
                    if (hiddenInput) hiddenInput.value = uploadedUrl;
                    syncPengurusList();
                    showToast("✅ Foto berhasil diunggah ke Google Drive!");
                } else {
                    throw new Error(response.message || "Gagal mengunggah foto.");
                }
            } catch (err) {
                console.error("Gagal upload foto pengurus:", err);
                previewImg.src = originalSrc;
                showToast("❌ Gagal mengunggah foto pengurus.");
            }
        }

        async function loadAdminProfilLembaga() {
            try {
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memuat...`;
                }

                const data = await apiGet("getPengaturan");
                if (data && data.status === "success" && data.data) {
                    const config = data.data;
                    document.getElementById('input-profil-sejarah').value = config.sejarah || "";
                    document.getElementById('input-profil-visimisi').value = config.visi_misi || "";
                    
                    try {
                        const struct = config.struktur_kepengurusan;
                        adminPengurusList = struct ? (typeof struct === 'string' ? JSON.parse(struct) : struct) : [];
                        if (!Array.isArray(adminPengurusList)) adminPengurusList = [];
                    } catch(e) {
                        adminPengurusList = [];
                    }
                }
                
                renderPengurusFields();

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-save mr-2"></i> Simpan Profil`;
                }
            } catch (err) {
                console.error("Gagal memuat profil lembaga:", err);
                showToast("Gagal memuat profil lembaga.");
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-save mr-2"></i> Simpan Profil`;
                }
            }
        }

        async function saveAdminProfilLembaga() {
            try {
                const btnSubmit = document.getElementById('btn-submit-profil-lembaga');
                const originalHtml = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Menyimpan...`;

                syncPengurusList(); 

                const payload = {
                    sejarah: document.getElementById('input-profil-sejarah').value,
                    visi_misi: document.getElementById('input-profil-visimisi').value,
                    struktur_kepengurusan: JSON.stringify(adminPengurusList)
                };

                const response = await apiPost("savePengaturan", payload);
                if (response.success) {
                    showToast("Profil Lembaga berhasil disimpan!");
                    
                    window.APP_CONFIG.sejarah = payload.sejarah;
                    window.APP_CONFIG.visi_misi = payload.visi_misi;
                    window.APP_CONFIG.struktur_kepengurusan = payload.struktur_kepengurusan;
                    
                    if (typeof renderPublicProfilLembaga === 'function') {
                        renderPublicProfilLembaga();
                    }
                } else {
                    showToast("Gagal menyimpan: " + (response.message || "Unknown error"));
                }

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHtml;
            } catch (err) {
                console.error(err);
                showToast("❌ Terjadi kesalahan saat menyimpan.");
                document.getElementById('btn-submit-profil-lembaga').disabled = false;
                document.getElementById('btn-submit-profil-lembaga').innerHTML = `<i class="fa-solid fa-save mr-2"></i> Simpan Profil`;
            }
        }

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
                    const config = data.data;
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
                const payload = {
                    video_highlight: document.getElementById('input-video-highlight').value,
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
                    const config = data.data;

                    // Update iframe video highlight
                    const iframeVideo = document.querySelector('iframe[title="Video Dokumentasi PPTQ Asnawiyyah"]');
                    if (iframeVideo && config.video_highlight) {
                        iframeVideo.src = config.video_highlight;
                    }

                    // Update social links
                    const sosmedContainer = document.querySelector('.bg-slate-50.p-5.rounded-3xl.border.border-slate-100.text-center.space-y-3');
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
        function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
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
        function renderAdminNewsList() {
            const container = document.getElementById('admin-news-list');
            const totalBadge = document.getElementById('admin-total-news');
            const hubBadge = document.getElementById('admin-hub-news-count');

            if (hubBadge) hubBadge.innerText = `${mockNewsData.length} Berita`;
            if (totalBadge) totalBadge.innerText = `${mockNewsData.length} Berita`;
            if (!container) return;

            container.innerHTML = "";
            mockNewsData.forEach((news, idx) => {
                const item = document.createElement('div');
                item.className = "flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70 gap-3";
                item.innerHTML = `
                    <div class="min-w-0 flex-1">
                        <span class="text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md uppercase">${news.kategori}</span>
                        <h4 class="text-xs font-bold text-slate-800 truncate mt-1">${news.judul}</h4>
                        <p class="text-[10px] text-slate-400">${news.tanggal} • Oleh: ${news.penulis}</p>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0">
                        <button onclick="editAdminNews('${news.news_id}')" class="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-xs transition" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteAdminNews('${news.news_id}')" class="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center text-xs transition" title="Hapus">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        async function handleAdminNewsSubmit(event) {
            event.preventDefault();

            const btn = document.getElementById('admin-submit-btn');
            const btnIcon = document.getElementById('admin-submit-icon');
            const btnText = document.getElementById('admin-submit-text');

            const fileInput = document.getElementById('admin-news-file');
            const file = fileInput.files[0];

            btn.disabled = true;
            btnIcon.className = "fa-solid fa-spinner animate-spin";
            btnText.innerText = "Mengunggah & Menyimpan Berita...";

            try {
                let fileData = null;
                if (file) {
                    fileData = await readFileAsBase64(file);
                }

                const formId = document.getElementById('admin-news-id').value;
                const token = getAdminSessionToken();

                const payload = {
                    news_id: formId,
                    judul: document.getElementById('admin-news-judul').value.trim(),
                    kategori: document.getElementById('admin-news-kategori').value,
                    penulis: document.getElementById('admin-news-penulis').value.trim(),
                    ringkasan: document.getElementById('admin-news-ringkasan').value.trim(),
                    isi: document.getElementById('admin-news-isi').value.trim(),
                    file: fileData
                };

                if (!isApiConfigured()) {
                    throw new Error("API backend belum dikonfigurasi.");
                }

                const actionName = formId ? "updateBerita" : "saveBerita";
                const response = await apiPost(actionName, { token, data: payload });

                btn.disabled = false;
                btnIcon.className = "fa-solid fa-paper-plane";
                btnText.innerText = "Publikasikan Berita";

                if (response && response.success) {
                    showToast("✅ Berita dan gambar berhasil disimpan!");
                    resetAdminNewsForm();
                    loadNews();
                } else {
                    showToast("❌ Gagal: " + (response ? response.message : "Terjadi kesalahan"));
                }

            } catch (err) {
                console.error("Submit Error: ", err);
                btn.disabled = false;
                btnIcon.className = "fa-solid fa-paper-plane";
                btnText.innerText = "Publikasikan Berita";
                showToast("❌ Gagal memproses data: " + err.message);
            }
        }

        function editAdminNews(id) {
            const news = mockNewsData.find(n => n.news_id === id);
            if (!news) return;

            document.getElementById('admin-news-id').value = id;
            document.getElementById('admin-news-judul').value = news.judul;
            document.getElementById('admin-news-kategori').value = news.kategori;
            document.getElementById('admin-news-penulis').value = news.penulis;
            document.getElementById('admin-news-ringkasan').value = news.ringkasan;
            document.getElementById('admin-news-isi').value = news.isi;

            document.getElementById('admin-form-title').innerHTML = `<i class="fa-solid fa-pen text-amber-600 mr-2"></i> Edit Berita`;
            document.getElementById('admin-submit-text').innerText = "Simpan Perubahan Berita";
            document.getElementById('admin-cancel-edit-btn').classList.remove('hidden');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function resetAdminNewsForm() {
            document.getElementById('adminNewsForm').reset();
            document.getElementById('admin-news-id').value = "";
            document.getElementById('admin-form-title').innerHTML = `<i class="fa-solid fa-pen-to-square text-brand-700 mr-2"></i> Tambah Berita Baru`;
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

        function renderAdminBannerList() {
            const listContainer = document.getElementById('admin-banner-list');
            const totalBadge = document.getElementById('admin-total-banners');
            const hubBadge = document.getElementById('admin-hub-banner-count');

            const activeCount = mockBannerData.filter(b => b.status === "Aktif").length;
            if (hubBadge) hubBadge.innerText = `${activeCount} Aktif`;
            if (totalBadge) totalBadge.innerText = `${mockBannerData.length} Banner`;

            if (!listContainer) return;
            listContainer.innerHTML = "";

            mockBannerData.forEach((banner, idx) => {
                const card = document.createElement('div');
                card.className = "p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5";

                const statusBadge = banner.status === "Aktif"
                    ? `<span class="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase">Aktif</span>`
                    : `<span class="text-[9px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md uppercase">Nonaktif</span>`;

                let actionInfo = "Tidak ada aksi";
                if (banner.tipeAksi === "tab") actionInfo = `Buka Tab: <strong>#${banner.targetAksi}</strong>`;
                if (banner.tipeAksi === "url") actionInfo = `Tautan: <strong class="truncate block max-w-[150px]">${banner.targetAksi}</strong>`;

                card.innerHTML = `
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center space-x-2.5 min-w-0">
                            <span class="w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                ${banner.urutan}
                            </span>
                            <div class="min-w-0">
                                <h4 class="text-xs font-bold text-slate-800 truncate">${banner.nama}</h4>
                                <p class="text-[10px] text-slate-400 mt-0.5">${actionInfo}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1.5 shrink-0">
                            ${statusBadge}
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
                        <div class="w-28 aspect-[3/1] rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
                            <img src="${banner.gambar}" alt="${banner.nama}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex items-center space-x-1.5">
                            <button onclick="toggleAdminBannerStatus('${banner.id}', '${banner.status === 'Aktif' ? 'Nonaktif' : 'Aktif'}')" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-sm transition" title="Ubah Status">
                                <i class="fa-solid ${banner.status === 'Aktif' ? 'fa-eye-slash text-amber-600' : 'fa-eye text-emerald-600'}"></i>
                            </button>
                            <button onclick="editAdminBanner(${idx})" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100 transition" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteAdminBanner('${banner.id}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-100 transition" title="Hapus">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                listContainer.appendChild(card);
            });
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
                    fileData = await compressImageFile(file, 1200, 0.82);
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

            document.getElementById('admin-banner-form-title').innerHTML = `<i class="fa-solid fa-pen text-amber-600 mr-2"></i> Edit Banner: #${banner.urutan}`;
            document.getElementById('admin-banner-submit-text').innerText = "Perbarui Data Banner";
            document.getElementById('admin-cancel-banner-edit-btn').classList.remove('hidden');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function resetAdminBannerForm() {
            document.getElementById('adminBannerForm').reset();
            document.getElementById('admin-banner-id').value = "";
            document.getElementById('admin-banner-old-img').value = "";

            const previewImg = document.getElementById('admin-banner-preview-img');
            const placeholder = document.getElementById('admin-banner-preview-placeholder');
            previewImg.src = "";
            previewImg.classList.add('hidden');
            placeholder.classList.remove('hidden');

            toggleBannerActionInput('tab');

            document.getElementById('admin-banner-form-title').innerHTML = `<i class="fa-solid fa-plus-circle text-amber-600 mr-2"></i> Tambah Banner Baru`;
            document.getElementById('admin-banner-submit-text').innerText = "Simpan & Pasang Banner";
            document.getElementById('admin-cancel-banner-edit-btn').classList.add('hidden');
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
                kategori: "Divisi Teater IKASAPNA",
                jadwal: "2x Semesta / Tahun",
                deskripsi: "Unit kegiatan santri PPTQ Asnawiyyah yang berfokus pada pementasan drama atau teater di bawah naungan lembaga semi otonom IKASAPNA. Ditujukan sebagai wadah kreativitas untuk melatih mental dan rasa percaya diri santri saat berada di tengah masyarakat.",
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
                jadwal: "IKASAPNA",
                deskripsi: "Perpustakaan milik PPTQ Asnawiyyah yang berada di bawah naungan IKASAPNA. Dibangun guna melestarikan budaya membaca di kalangan santri serta menjadi jembatan penghubung antara santri dengan wawasan dunia luar lewat koleksi buku yang tersedia.",
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

        // ==================== DASHBOARD ADMIN: MANAJEMEN PROGRAM PESANTREN (CMS) ====================
        let adminProgramData = [];
        let filteredAdminProgramData = [];
        let adminProgramFilterStatus = "ALL";
        let adminProgramSearchQuery = "";

        function getAdminSessionToken() {
            return sessionStorage.getItem("asnawiyyah_admin_token") || "";
        }

        function getAdminSessionRole() {
            return sessionStorage.getItem("asnawiyyah_admin_role") || "admin";
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

                adminProgramData = Array.isArray(response.data) ? response.data : [];

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
            const isAdmin = (role === "admin");

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
            const isAdmin = (role === "admin");

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
                document.getElementById('admin-prog-highlights').value = Array.isArray(existing.highlights) ? existing.highlights.join('\n') : "";
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

                const d = existing.detail || {};
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

        function filterAdminNotifikasiList() {
            const searchInput = document.getElementById('admin-notif-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            let filtered = adminNotifikasiList;
            if (query) {
                filtered = adminNotifikasiList.filter(item => 
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
                const isPopup = (item.is_popup === true || item.is_popup === 1 || String(item.is_popup) === "1" || String(item.is_popup).toLowerCase() === "true");
                const isAktif = (item.status || "Aktif") === "Aktif";

                const thumb = item.gambar 
                    ? `<img src="${item.gambar}" alt="" class="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-[#253447] shrink-0" onerror="this.style.display='none'">` 
                    : `<div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1c2836] text-slate-400 flex items-center justify-center shrink-0 text-base"><i class="fa-solid fa-bell"></i></div>`;

                let badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
                if (item.kategori === 'Kegiatan') badgeBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
                if (item.kategori === 'Pembayaran') badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

                return `
                    <div class="bg-slate-50 dark:bg-[#1c2836] p-4 rounded-2xl border border-slate-100 dark:border-[#253447] flex flex-col justify-between space-y-3">
                        <div class="flex items-start gap-3">
                            ${thumb}
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeBg}">
                                        ${item.kategori || 'Pengumuman'}
                                    </span>
                                    ${isPopup ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><i class="fa-solid fa-star text-[8px] mr-1"></i>Pop-up Beranda</span>` : ''}
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${isAktif ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
                                        ${isAktif ? 'Aktif' : 'Nonaktif'}
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
                        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/60 dark:border-[#253447]">
                            <button type="button" onclick="openAdminNotifikasiEditor('${item.id}')" class="px-3 py-1.5 rounded-lg bg-white dark:bg-[#15202d] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253447] text-xs font-bold transition flex items-center space-x-1">
                                <i class="fa-solid fa-pen text-[10px] text-brand-600 dark:text-emerald-400"></i>
                                <span>Edit</span>
                            </button>
                            <button type="button" onclick="deleteAdminNotifikasi('${item.id}')" class="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-xs font-bold transition flex items-center space-x-1">
                                <i class="fa-solid fa-trash text-[10px]"></i>
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
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
            document.getElementById('admin-notif-is-popup').checked = (item.is_popup === true || item.is_popup === 1 || String(item.is_popup) === '1' || String(item.is_popup).toLowerCase() === 'true');
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
                    fileData = await compressImageFile(file, 1200, 0.82);
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
                    await loadAdminNotifikasi();
                    if (typeof loadNotifikasi === 'function') loadNotifikasi();
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
                if (typeof apiPost === 'function') {
                    response = await apiPost("deleteNotifikasi", { token, id });
                } else {
                    const res = await fetch(API_URL, {
                        method: 'POST',
                        body: JSON.stringify({ action: "deleteNotifikasi", token, id })
                    });
                    response = await res.json();
                }

                if (response && (response.status === "success" || response.success)) {
                    if (typeof showToast === 'function') showToast("Warta notifikasi berhasil dihapus!");
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
