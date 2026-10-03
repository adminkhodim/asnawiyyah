        // ==================== RUNTIME PROGRAM DATA SOURCE & STATE MANAGEMENT ====================
        let RUNTIME_PROGRAM_DATA = [];
        let programRuntimeState = {
            status: "idle", // "idle" | "loading" | "ready" | "empty" | "error"
            error: null,
            requestId: null
        };

        function getProgramUiTheme(prog) {
            const id = prog ? (prog.id || "") : "";
            if (id === "sd-islam") {
                return {
                    berandaBadgeStyle: "bg-blue-600/90 text-white",
                    pilihanBadgeStyle: "bg-blue-500 text-white",
                    headerBadge: "Usia Sekolah Dasar (6 – 12 Tahun)",
                    headerTheme: "from-blue-900 via-blue-800 to-cyan-800",
                    headerIcon: "fa-school",
                    headerCategoryColor: "text-blue-700"
                };
            } else if (id === "tahfidz-anak") {
                return {
                    berandaBadgeStyle: "bg-emerald-800/90 text-white",
                    pilihanBadgeStyle: "bg-amber-500 text-brand-dark",
                    headerBadge: "Usia Sekolah Dasar / MI (6 – 12 Tahun)",
                    headerTheme: "from-brand-900 via-brand-800 to-emerald-800",
                    headerIcon: "fa-child-reaching",
                    headerCategoryColor: "text-brand-700"
                };
            } else if (id === "dewasa-putra") {
                return {
                    berandaBadgeStyle: "bg-slate-900/90 text-white",
                    pilihanBadgeStyle: "bg-brand-600 text-white",
                    headerBadge: "Lulusan SMA / MA / Mahasiswa / Umum (Dewasa)",
                    headerTheme: "from-brand-900 via-brand-800 to-emerald-800",
                    headerIcon: "fa-user-graduate",
                    headerCategoryColor: "text-brand-700"
                };
            } else if (id === "dewasa-putri") {
                return {
                    berandaBadgeStyle: "bg-purple-900/90 text-white",
                    pilihanBadgeStyle: "bg-purple-600 text-white",
                    headerBadge: "Khusus Santriwati Dewasa (Putri)",
                    headerTheme: "from-purple-900 via-purple-800 to-brand-900",
                    headerIcon: "fa-person-shelter",
                    headerCategoryColor: "text-purple-700"
                };
            }
            return {
                berandaBadgeStyle: (prog && prog.berandaBadgeStyle) || "bg-brand-800/90 text-white",
                pilihanBadgeStyle: (prog && prog.pilihanBadgeStyle) || "bg-brand-700 text-white",
                headerBadge: (prog && (prog.headerBadge || prog.badge)) || "Program Pesantren",
                headerTheme: (prog && prog.headerTheme) || "from-brand-900 via-brand-800 to-emerald-800",
                headerIcon: (prog && prog.headerIcon) || "fa-book-quran",
                headerCategoryColor: (prog && prog.headerCategoryColor) || "text-brand-700"
            };
        }

        // ==================== PROGRAM DATA RENDERERS ====================
        function getProgramById(programId) {
            return RUNTIME_PROGRAM_DATA.find(item => item.id === programId);
        }

        async function initializeProgramRuntime() {
            programRuntimeState.status = "loading";
            programRuntimeState.error = null;
            programRuntimeState.requestId = null;
            renderProgramLoadingState();

            if (!isApiConfigured()) {
                if (Array.isArray(PROGRAM_DATA) && PROGRAM_DATA.length > 0) {
                    console.warn("API Endpoint belum dikonfigurasi, menggunakan fallback data lokal PROGRAM_DATA.");
                    RUNTIME_PROGRAM_DATA = [...PROGRAM_DATA];
                    programRuntimeState.status = "ready";
                    renderProgramAllViews();
                    return;
                }
                programRuntimeState.status = "error";
                programRuntimeState.error = "API Endpoint belum dikonfigurasi.";
                renderProgramErrorState();
                return;
            }

            try {
                const response = await apiGet("program.listPublished");

                if (!response || typeof response !== "object") {
                    throw new Error("Format respons API tidak valid");
                }

                if (response.success !== true && response.status !== "success") {
                    const errObj = response.error || {};
                    const errCode = errObj.code || "SERVER_ERROR";
                    const errMsg = errObj.message || "Gagal memuat data program dari server.";
                    throw new Error(`[${errCode}] ${errMsg}`);
                }

                const rawList = response.data;
                if (!Array.isArray(rawList) || rawList.length === 0) {
                    throw new Error("Data program dari server kosong");
                }

                // Normalize items so highlights and detail are always present and parsed
                const data = rawList.map(prog => {
                    let highlights = prog.highlights;
                    if (typeof highlights === 'string') {
                        try { highlights = JSON.parse(highlights); } catch(e) { highlights = []; }
                    }
                    if (!Array.isArray(highlights)) {
                        let hJson = prog.highlights_json;
                        if (typeof hJson === 'string') {
                            try { hJson = JSON.parse(hJson); } catch(e) { hJson = []; }
                        }
                        highlights = Array.isArray(hJson) ? hJson : [];
                    }

                    let detail = prog.detail;
                    if (typeof detail === 'string') {
                        try { detail = JSON.parse(detail); } catch(e) { detail = null; }
                    }
                    if (!detail || typeof detail !== 'object') {
                        let dJson = prog.detail_json;
                        if (typeof dJson === 'string') {
                            try { dJson = JSON.parse(dJson); } catch(e) { dJson = null; }
                        }
                        detail = (dJson && typeof dJson === 'object') ? dJson : {};
                    }

                    return {
                        ...prog,
                        highlights,
                        detail
                    };
                });

                // Validate payload contract items (Fail-Closed per item)
                for (let idx = 0; idx < data.length; idx++) {
                    const prog = data[idx];
                    if (!prog || !prog.id || !prog.name || !prog.badge || !prog.image || !prog.description || !Array.isArray(prog.highlights) || !prog.detail) {
                        throw new Error(`Item program index ${idx} tidak memenuhi kontrak schema.`);
                    }
                }

                programRuntimeState.status = "ready";
                programRuntimeState.requestId = response.requestId || null;
                RUNTIME_PROGRAM_DATA = data;

                // Merge local PROGRAM_DATA for items not present in API (e.g., local dummy templates)
                PROGRAM_DATA.forEach(localProg => {
                    if (!RUNTIME_PROGRAM_DATA.find(p => p.id === localProg.id)) {
                        RUNTIME_PROGRAM_DATA.push(localProg);
                    }
                });

                renderProgramAllViews();

            } catch (err) {
                console.warn("Gagal memuat runtime PROGRAM_DATA via API, beralih ke fallback PROGRAM_DATA lokal:", err);
                if (Array.isArray(PROGRAM_DATA) && PROGRAM_DATA.length > 0) {
                    programRuntimeState.status = "ready";
                    programRuntimeState.error = null;
                    RUNTIME_PROGRAM_DATA = [...PROGRAM_DATA];
                    renderProgramAllViews();
                } else {
                    programRuntimeState.status = "error";
                    programRuntimeState.error = err.message || "Terjadi kesalahan koneksi server.";
                    renderProgramErrorState();
                }
            }
        }

        function renderProgramLoadingState() {
            const showcase = document.getElementById('beranda-program-showcase');
            const grid = document.getElementById('program-pilihan-grid');
            const skeletonHtml = `
                <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
                    <i class="fa-solid fa-spinner fa-spin text-brand-600 text-2xl"></i>
                    <p class="text-xs font-semibold text-slate-600">Memuat data program pesantren...</p>
                </div>
            `;
            if (showcase) showcase.innerHTML = skeletonHtml;
            if (grid) grid.innerHTML = skeletonHtml;
        }

        function renderProgramEmptyState() {
            const showcase = document.getElementById('beranda-program-showcase');
            const grid = document.getElementById('program-pilihan-grid');
            const emptyHtml = `
                <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <i class="fa-solid fa-folder-open text-slate-300 text-3xl"></i>
                    <p class="text-xs font-bold text-slate-600">Tidak ada program yang tersedia saat ini.</p>
                </div>
            `;
            if (showcase) showcase.innerHTML = emptyHtml;
            if (grid) grid.innerHTML = emptyHtml;
        }

        function renderProgramErrorState() {
            const showcase = document.getElementById('beranda-program-showcase');
            const grid = document.getElementById('program-pilihan-grid');
            const reqIdInfo = programRuntimeState.requestId ? `<span class="block text-[10px] text-slate-400 font-mono mt-1">Ref ID: ${escapeHtml(programRuntimeState.requestId)}</span>` : '';
            const errorHtml = `
                <div class="col-span-full p-8 text-center bg-rose-50/80 rounded-2xl border border-rose-200 shadow-sm space-y-2">
                    <i class="fa-solid fa-triangle-exclamation text-rose-500 text-2xl"></i>
                    <p class="text-xs font-bold text-rose-800">Gagal memuat data program pesantren.</p>
                    <p class="text-[11px] text-rose-600">${escapeHtml(programRuntimeState.error || 'Terjadi kesalahan sistem.')}</p>
                    ${reqIdInfo}
                </div>
            `;
            if (showcase) showcase.innerHTML = errorHtml;
            if (grid) grid.innerHTML = errorHtml;
        }

        function renderProgramShowcaseBeranda() {
            const container = document.getElementById('beranda-program-showcase');
            if (!container) return;

            if (programRuntimeState.status !== "ready" || RUNTIME_PROGRAM_DATA.length === 0) {
                return;
            }

            container.innerHTML = RUNTIME_PROGRAM_DATA.map(prog => {
                const theme = getProgramUiTheme(prog);
                return `
                <div onclick="switchTab('${prog.id}')"
                    class="group bg-white dark:bg-[#15202d] rounded-2xl border border-slate-200/80 dark:border-[#253447] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div class="relative h-48 overflow-hidden">
                        <img src="${prog.image}" alt="${prog.name}"
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                        <span
                            class="absolute top-4 left-4 ${theme.berandaBadgeStyle} text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
                            ${prog.badge}
                        </span>
                    </div>
                    <div class="p-6 space-y-3">
                        <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                            ${prog.name}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                            ${prog.description}
                        </p>
                        <ul class="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2">
                            ${prog.highlights.slice(0, 3).map(item => `<li class="flex items-center gap-2">✓ ${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `}).join('');
        }

        function renderProgramPilihanGrid() {
            const container = document.getElementById('program-pilihan-grid');
            if (!container) return;

            if (programRuntimeState.status !== "ready" || RUNTIME_PROGRAM_DATA.length === 0) {
                return;
            }

            container.innerHTML = RUNTIME_PROGRAM_DATA.map(prog => {
                const theme = getProgramUiTheme(prog);
                return `
                <div onclick="switchTab('${prog.id}')"
                    class="relative aspect-[21/9] md:aspect-[16/10] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm group border border-slate-100 dark:border-[#253447] transition hover:shadow-lg flex flex-col justify-end p-3 md:p-5 cursor-pointer">
                    <img src="${prog.image}" alt="${prog.name}"
                        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div class="relative z-10 space-y-1">
                        <div class="flex items-center justify-between">
                            <span class="${theme.pilihanBadgeStyle} text-[8px] md:text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-block shadow">${prog.badge}</span>
                            <span class="text-[10px] text-amber-300 font-bold">selengkapnya <i class="fa-solid fa-chevron-right text-[8px]"></i></span>
                        </div>
                        <h3 class="text-base md:text-2xl font-bold text-white leading-snug">${prog.name}</h3>
                        <p class="text-[10px] md:text-xs text-emerald-100 line-clamp-1 leading-normal">${prog.description}</p>
                    </div>
                </div>
            `}).join('');
        }

        function renderAllProgramDetails() {
            if (programRuntimeState.status !== "ready") return;

            RUNTIME_PROGRAM_DATA.forEach(prog => {
                const pageEl = document.getElementById(`page-${prog.id}`);
                if (!pageEl) return;

                let d = prog.detail;
                if (typeof d === 'string') {
                    try { d = JSON.parse(d); } catch (e) { d = {}; }
                }
                if (!d || typeof d !== 'object') d = {};

                const localFallback = (Array.isArray(PROGRAM_DATA) ? PROGRAM_DATA.find(p => p.id === prog.id) : null) || {};
                const fbDetail = (localFallback.detail && typeof localFallback.detail === 'object') ? localFallback.detail : {};

                const theme = getProgramUiTheme(prog);
                const categoryColor = theme.headerCategoryColor;

                const tagline = d.tagline || fbDetail.tagline || '';
                const summary = d.summary || fbDetail.summary || '';
                const videoUrl = d.video || fbDetail.video || '';
                const videoTitle = d.videoTitle || fbDetail.videoTitle || (prog.name ? `Video Profil ${prog.name}` : 'Video Profil Kegiatan');
                const keunggulanList = (Array.isArray(d.keunggulan) && d.keunggulan.length > 0) ? d.keunggulan : (Array.isArray(fbDetail.keunggulan) ? fbDetail.keunggulan : []);
                const targetOutputList = (Array.isArray(d.targetOutput) && d.targetOutput.length > 0) ? d.targetOutput : (Array.isArray(fbDetail.targetOutput) ? fbDetail.targetOutput : []);
                let rawGallery = (Array.isArray(d.gallery) && d.gallery.length > 0) ? d.gallery : (Array.isArray(fbDetail.gallery) ? fbDetail.gallery : []);
                let galleryList = rawGallery
                    .filter(g => g && ((typeof g.image === 'string' && g.image.trim() !== '') || (typeof g === 'string' && g.trim() !== '')))
                    .map((g, idx) => {
                        if (typeof g === 'string') {
                            return { image: g.trim(), caption: `Dokumentasi #${idx + 1}`, sliderId: `galeri-${prog.id}-${idx + 1}` };
                        }
                        return {
                            image: (g.image || '').trim(),
                            caption: (g.caption || '').trim() || `Dokumentasi #${idx + 1}`,
                            sliderId: g.sliderId || `galeri-${prog.id}-${idx + 1}`
                        };
                    });
                if (galleryList.length === 0 && prog.image) {
                    galleryList = [{ image: prog.image, caption: prog.name, sliderId: `galeri-${prog.id}-1` }];
                }
                const fasilitasList = (Array.isArray(d.fasilitas) && d.fasilitas.length > 0) ? d.fasilitas : (Array.isArray(fbDetail.fasilitas) ? fbDetail.fasilitas : []);
                const prosedurData = d.prosedur || fbDetail.prosedur || {};
                const persyaratanList = (Array.isArray(d.persyaratan) && d.persyaratan.length > 0) ? d.persyaratan : (Array.isArray(fbDetail.persyaratan) ? fbDetail.persyaratan : []);
                const biayaData = d.biaya || fbDetail.biaya || {};
                const ctaData = d.cta || fbDetail.cta || {};

                pageEl.innerHTML = `
                    <div class="bg-white dark:bg-[#15202d] p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-8">

                        <!-- BARIS KEMBALI & HEADER UTAMA -->
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#253447] pb-2 mb-1">
                            <div class="flex items-center space-x-2.5">
                                <button onclick="switchTab('program-pilihan')"
                                    class="w-8 h-8 bg-slate-100 dark:bg-[#1c2836] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center transition active:scale-95 shrink-0"
                                    title="Kembali">
                                    <i class="fa-solid fa-arrow-left text-xs"></i>
                                </button>
                                <span class="text-[11px] font-extrabold ${categoryColor} uppercase tracking-wider">Program Unggulan</span>
                            </div>
                            <button onclick="switchTab('ppdb')"
                                class="hidden md:flex px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-lg shadow transition items-center space-x-1.5">
                                <span>Daftar PPDB</span>
                                <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>

                        <!-- A. HEADER & TAGLINE PROGRAM -->
                        <section class="relative bg-gradient-to-r ${theme.headerTheme} text-white p-6 md:p-8 rounded-3xl overflow-hidden shadow-md">
                            <div class="absolute -right-8 -bottom-8 text-white/5 text-9xl pointer-events-none">
                                <i class="fa-solid ${theme.headerIcon}"></i>
                            </div>
                            <div class="relative z-10 space-y-2.5">
                                <span class="${theme.pilihanBadgeStyle} text-[10px] font-extrabold px-3 py-1 rounded-full uppercase inline-block shadow">${theme.headerBadge}</span>
                                <h1 class="text-xl md:text-3xl font-extrabold leading-tight">${escapeHtml(prog.name || '')}</h1>
                                ${tagline ? `<p class="text-xs md:text-sm text-amber-300 font-semibold italic">${escapeHtml(tagline)}</p>` : ''}
                            </div>
                        </section>

                        <!-- B. DESKRIPSI SINGKAT PROGRAM -->
                        <section class="bg-slate-50 dark:bg-[#1c2836] p-5 rounded-2xl border border-slate-100 dark:border-[#253447]">
                            <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                ${summary || 'Informasi deskripsi program akan segera diperbarui.'}
                            </p>
                        </section>

                        <!-- C. VIDEO CHANNEL YOUTUBE -->
                        <section class="space-y-2">
                            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Video Profil Kegiatan
                            </h3>
                            <div class="relative aspect-video rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-[#253447] bg-black">
                                <iframe class="w-full h-full" src="${(typeof formatYoutubeEmbedUrl === 'function') ? formatYoutubeEmbedUrl(videoUrl) : (videoUrl || 'https://www.youtube.com/embed/ZQZqPcAlrk0?rel=0')}" title="${escapeHtml(videoTitle)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                            </div>
                        </section>

                        <!-- D. KEUNGGULAN & METODE PEMBELAJARAN -->
                        <section class="space-y-3">
                            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Keunggulan & Metode Pembelajaran
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                ${keunggulanList.map(k => `
                                    <div class="p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] space-y-1.5">
                                        <div class="w-9 h-9 ${k.iconBg || 'bg-brand-100 text-brand-700'} rounded-xl flex items-center justify-center text-sm font-bold mb-2">
                                            <i class="fa-solid ${k.icon || 'fa-check'}"></i>
                                        </div>
                                        <h4 class="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-100">${escapeHtml(k.title || '')}</h4>
                                        <p class="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">${k.desc || ''}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </section>

                        <!-- E. TARGET CAPAIAN SANTRI -->
                        <section class="bg-emerald-700 text-white p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                            <h3 class="text-base font-bold text-center">Target Output Santri</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                ${targetOutputList.map(out => `
                                    <div class="flex items-start space-x-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                                        <i class="fa-solid fa-square-check text-amber-400 mt-0.5 text-base shrink-0"></i>
                                        <span>${escapeHtml(out || '')}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </section>

                        <!-- F. GALERI FOTO (INTERACTIVE SLIDER & THUMBNAILS) -->
                        <section class="space-y-3">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                    <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Galeri Dokumentasi Kegiatan
                                </h3>
                                ${galleryList.length > 1 ? `
                                    <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                                        ${galleryList.length} Foto Tersedia
                                    </span>
                                ` : ''}
                            </div>

                            <!-- Main Slider Frame -->
                            <div id="prog-gallery-frame-${prog.id}" class="relative aspect-video rounded-3xl overflow-hidden shadow-md bg-slate-900 group select-none">
                                <div id="prog-gallery-container-${prog.id}" class="w-full h-full relative">
                                    ${galleryList.map((g, idx) => `
                                        <div class="prog-gallery-slide prog-gallery-slide-${prog.id} absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out cursor-pointer ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}"
                                             data-index="${idx}"
                                             data-caption="${escapeHtml(g.caption || `Dokumentasi #${idx + 1}`)}"
                                             data-image="${escapeHtml(g.image || prog.image || '')}"
                                             onclick="openProgramGalleryLightbox('${prog.id}', ${idx})">
                                            <img src="${g.image || prog.image || ''}" alt="${escapeHtml(g.caption || prog.name || 'Dokumentasi Santri')}" class="w-full h-full object-cover">
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Floating Counter & Enlarge Button -->
                                <div class="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                                    ${galleryList.length > 1 ? `
                                        <div class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow border border-white/10 flex items-center gap-1">
                                            <i class="fa-solid fa-images text-amber-400"></i>
                                            <span id="prog-gallery-counter-${prog.id}">1</span> / ${galleryList.length}
                                        </div>
                                    ` : ''}
                                    <button onclick="openProgramGalleryLightbox('${prog.id}')"
                                        class="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow border border-white/10 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                        title="Perbesar Layar Penuh">
                                        <i class="fa-solid fa-expand text-[10px]"></i>
                                        <span class="hidden sm:inline">Perbesar</span>
                                    </button>
                                </div>

                                ${galleryList.length > 1 ? `
                                    <!-- Prev / Next Navigation Buttons -->
                                    <button onclick="event.stopPropagation(); changeProgramGallerySlide('${prog.id}', -1)"
                                        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-90 z-20 cursor-pointer border border-white/10 hover:scale-105"
                                        aria-label="Foto Sebelumnya">
                                        <i class="fa-solid fa-chevron-left text-xs md:text-sm"></i>
                                    </button>
                                    <button onclick="event.stopPropagation(); changeProgramGallerySlide('${prog.id}', 1)"
                                        class="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-90 z-20 cursor-pointer border border-white/10 hover:scale-105"
                                        aria-label="Foto Selanjutnya">
                                        <i class="fa-solid fa-chevron-right text-xs md:text-sm"></i>
                                    </button>
                                ` : ''}

                                <!-- Bottom Gradient & Caption -->
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 md:p-5 z-10 pointer-events-none">
                                    <p id="prog-gallery-caption-${prog.id}" class="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                                        <i class="fa-solid fa-camera text-amber-400 shrink-0"></i>
                                        <span class="line-clamp-2">${escapeHtml(galleryList[0]?.caption || 'Dokumentasi Santri')}</span>
                                    </p>
                                </div>
                            </div>

                            ${galleryList.length > 1 ? `
                                <!-- Thumbnail Navigation Strip -->
                                <div class="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x" id="prog-gallery-thumbs-${prog.id}">
                                    ${galleryList.map((g, idx) => `
                                        <button onclick="setProgramGallerySlide('${prog.id}', ${idx})"
                                            id="prog-gallery-thumb-${prog.id}-${idx}"
                                            class="prog-gallery-thumb-${prog.id} relative w-14 h-10 sm:w-16 sm:h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 snap-start cursor-pointer ${idx === 0 ? 'border-amber-400 ring-2 ring-amber-400/40 opacity-100 scale-105 shadow' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'}"
                                            title="${escapeHtml(g.caption || `Foto #${idx + 1}`)}">
                                            <img src="${g.image || prog.image || ''}" alt="${escapeHtml(g.caption || '')}" class="w-full h-full object-cover">
                                            <span class="absolute bottom-0.5 right-1 bg-black/75 text-[8px] font-bold text-white px-1 rounded">${idx + 1}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </section>

                        <!-- G. FASILITAS -->
                        <section class="space-y-3">
                            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                <span class="w-1.5 h-4 bg-brand-600 rounded-full mr-2"></span> Fasilitas Santri
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                ${fasilitasList.map(f => `
                                    <div class="p-3.5 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447] flex items-center space-x-3">
                                        <i class="${f.icon || 'fa-solid fa-check'} ${f.iconColor || 'text-brand-700'} text-lg"></i>
                                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(f.text || '')}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </section>

                        <!-- H. PROSEDUR PENDAFTARAN -->
                        <section class="bg-slate-50 dark:bg-[#1c2836] p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-[#253447] space-y-4">
                            <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 text-center">Prosedur Pendaftaran</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div class="space-y-3">
                                    ${(prosedurData.items || []).map((p, idx) => `
                                        <div class="flex items-start space-x-3">
                                            <i class="fa-solid fa-check text-brand-700 dark:text-emerald-400 font-bold text-sm mt-0.5 shrink-0"></i>
                                            <p class="text-xs text-slate-700 dark:text-slate-200 ${idx === 0 ? 'font-semibold' : ''}">${p.title ? `${p.step ? `${p.step}. ` : ''}${escapeHtml(p.title)}: ${escapeHtml(p.desc || '')}` : escapeHtml(String(p))}</p>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#253447] aspect-[4/3]">
                                    <img src="${prosedurData.image || prog.image}" alt="${escapeHtml(prosedurData.imageAlt || 'Prosedur PPDB')}" class="w-full h-full object-cover">
                                </div>
                            </div>
                        </section>

                        <!-- I. PERSYARATAN PENDAFTARAN -->
                        <section class="space-y-4">
                            <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 text-center">Persyaratan Pendaftaran</h3>
                            <div class="space-y-3 max-w-2xl mx-auto">
                                ${persyaratanList.map(req => `
                                    <div class="flex items-start space-x-4 p-4 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-slate-100 dark:border-[#253447]">
                                        <div class="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-lg shrink-0">
                                            <i class="fa-solid ${req.icon || 'fa-check'}"></i>
                                        </div>
                                        <div>
                                            <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">${escapeHtml(req.title || '')}</h4>
                                            <p class="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">${escapeHtml(req.desc || '')}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </section>

                        <!-- J. BIAYA PENDIDIKAN -->
                        <section class="space-y-4">
                            <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 text-center">Biaya Pendidikan</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <!-- Biaya Pendaftaran -->
                                <div class="bg-white dark:bg-[#1c2836] p-6 rounded-3xl border border-slate-200 dark:border-[#253447] shadow-sm space-y-4 text-center">
                                    <div>
                                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Biaya Pendaftaran</h4>
                                        <div class="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">${escapeHtml(biayaData.pendaftaran?.nominal || 'Rp.0')}</div>
                                        ${biayaData.pendaftaran?.note ? `<p class="text-[10px] text-slate-400 dark:text-slate-400 mt-1">${escapeHtml(biayaData.pendaftaran.note)}</p>` : ''}
                                    </div>
                                    ${Array.isArray(biayaData.pendaftaran?.items) && biayaData.pendaftaran.items.length > 0 ? `
                                        <div class="space-y-2 text-xs text-left pt-3 border-t border-slate-100 dark:border-[#253447]">
                                            ${biayaData.pendaftaran.items.map(item => `
                                                <div class="flex items-center space-x-2.5 text-slate-700 dark:text-slate-200">
                                                    <i class="fa-solid fa-check text-emerald-600 dark:text-emerald-400 font-bold"></i>
                                                    <span>${escapeHtml(item)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>

                                <!-- Biaya Bulanan -->
                                <div class="bg-white dark:bg-[#1c2836] p-6 rounded-3xl border border-slate-200 dark:border-[#253447] shadow-sm space-y-4 text-center">
                                    <div>
                                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Biaya Syahriyah (Bulanan)</h4>
                                        <div class="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">${escapeHtml(biayaData.syahriyah?.nominal || 'Rp.0')}</div>
                                        ${biayaData.syahriyah?.note ? `<p class="text-[10px] text-slate-400 dark:text-slate-400 mt-1">${escapeHtml(biayaData.syahriyah.note)}</p>` : ''}
                                    </div>
                                    ${Array.isArray(biayaData.syahriyah?.items) && biayaData.syahriyah.items.length > 0 ? `
                                        <div class="space-y-2 text-xs text-left pt-3 border-t border-slate-100 dark:border-[#253447]">
                                            ${biayaData.syahriyah.items.map(item => `
                                                <div class="flex items-center space-x-2.5 text-slate-700 dark:text-slate-200">
                                                    <i class="fa-solid fa-check text-emerald-600 dark:text-emerald-400 font-bold"></i>
                                                    <span>${escapeHtml(item)}</span>
                                                </div>
                                            `).join('')}
                                            ${Array.isArray(biayaData.syahriyah?.excludedItems) ? biayaData.syahriyah.excludedItems.map(item => `
                                                <div class="flex items-center space-x-2.5 text-slate-400 dark:text-slate-400 line-through">
                                                    <i class="fa-solid fa-xmark text-rose-500 font-bold"></i>
                                                    <span>${escapeHtml(item)}</span>
                                                </div>
                                            `).join('') : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </section>

                        <!-- K. CALL TO ACTION (CTA) -->
                        <section class="bg-gradient-to-r ${theme.headerTheme} text-white p-6 md:p-8 rounded-3xl shadow-lg text-center space-y-4">
                            <h3 class="text-lg md:text-xl font-bold">${escapeHtml(ctaData.title || 'Pendaftaran Santri Baru Dibuka')}</h3>
                            ${ctaData.description ? `<p class="text-xs text-emerald-100 max-w-md mx-auto leading-relaxed">${escapeHtml(ctaData.description)}</p>` : ''}
                            <div class="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                                <button onclick="switchTab('ppdb')"
                                    class="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-brand-dark font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2">
                                    <i class="fa-solid fa-file-signature"></i>
                                    <span>Daftar Sekarang ke Form PPDB</span>
                                </button>
                                <a href="${ctaData.waLink || 'https://wa.me/6281234567890'}" target="_blank"
                                    class="w-full sm:w-auto ${ctaData.waBtnClass || 'bg-emerald-600 text-white'} font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2 border">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                    <span>${escapeHtml(ctaData.waText || 'Konsultasi via WA')}</span>
                                </a>
                            </div>
                        </section>

                    </div>
                `;

                if (galleryList.length > 1) {
                    setTimeout(() => {
                        if (typeof window.initProgramGalleryTouch === 'function') {
                            window.initProgramGalleryTouch(prog.id);
                        }
                    }, 50);
                }
            });
        }

        function renderProgramAllViews() {
            renderProgramShowcaseBeranda();
            renderProgramPilihanGrid();
            renderAllProgramDetails();
        }

        // ==================== PROGRAM GALLERY CONTROLLER & LIGHTBOX ====================
        window.programGalleryState = window.programGalleryState || {};
        let activeLightboxProgId = null;
        let activeLightboxIndex = 0;

        window.setProgramGallerySlide = function(progId, targetIndex) {
            const container = document.getElementById(`prog-gallery-container-${progId}`);
            if (!container) return;
            const slides = container.querySelectorAll(`.prog-gallery-slide-${progId}`);
            if (!slides || slides.length === 0) return;

            const total = slides.length;
            const validIndex = ((targetIndex % total) + total) % total;
            window.programGalleryState[progId] = validIndex;

            slides.forEach((slide, idx) => {
                if (idx === validIndex) {
                    slide.classList.remove('opacity-0', 'pointer-events-none', 'z-0');
                    slide.classList.add('opacity-100', 'z-10');
                    const caption = slide.getAttribute('data-caption') || 'Dokumentasi Santri';
                    const captionEl = document.getElementById(`prog-gallery-caption-${progId}`);
                    if (captionEl) {
                        captionEl.innerHTML = `<i class="fa-solid fa-camera text-amber-400 shrink-0"></i> <span class="line-clamp-2">${escapeHtml(caption)}</span>`;
                    }
                } else {
                    slide.classList.remove('opacity-100', 'z-10');
                    slide.classList.add('opacity-0', 'pointer-events-none', 'z-0');
                }
            });

            const counterEl = document.getElementById(`prog-gallery-counter-${progId}`);
            if (counterEl) counterEl.textContent = `${validIndex + 1}`;

            // Update thumbnails
            const thumbs = document.querySelectorAll(`.prog-gallery-thumb-${progId}`);
            thumbs.forEach((thumb, idx) => {
                if (idx === validIndex) {
                    thumb.className = `prog-gallery-thumb-${progId} relative w-14 h-10 sm:w-16 sm:h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/40 opacity-100 scale-105 shadow transition-all duration-200 shrink-0 snap-start cursor-pointer`;
                    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    thumb.className = `prog-gallery-thumb-${progId} relative w-14 h-10 sm:w-16 sm:h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 transition-all duration-200 shrink-0 snap-start cursor-pointer`;
                }
            });
        };

        window.changeProgramGallerySlide = function(progId, delta) {
            const currentIndex = window.programGalleryState[progId] || 0;
            window.setProgramGallerySlide(progId, currentIndex + delta);
        };

        window.initProgramGalleryTouch = function(progId) {
            const frame = document.getElementById(`prog-gallery-frame-${progId}`);
            if (!frame || frame.dataset.touchInit === "true") return;
            frame.dataset.touchInit = "true";

            let startX = 0;
            let startY = 0;

            frame.addEventListener('touchstart', (e) => {
                if (!e.touches || e.touches.length === 0) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            frame.addEventListener('touchend', (e) => {
                if (!e.changedTouches || e.changedTouches.length === 0) return;
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;

                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
                    if (diffX > 0) {
                        window.changeProgramGallerySlide(progId, 1);
                    } else {
                        window.changeProgramGallerySlide(progId, -1);
                    }
                }
            }, { passive: true });
        };

        window.openProgramGalleryLightbox = function(progId, targetIdx = null) {
            const modal = document.getElementById('modal-program-gallery-lightbox');
            if (!modal) return;

            const prog = (Array.isArray(RUNTIME_PROGRAM_DATA) ? RUNTIME_PROGRAM_DATA.find(p => p.id === progId) : null) ||
                         (Array.isArray(PROGRAM_DATA) ? PROGRAM_DATA.find(p => p.id === progId) : null);
            if (!prog) return;

            const d = prog.detail || {};
            let rawGallery = (Array.isArray(d.gallery) && d.gallery.length > 0) ? d.gallery : (prog.image ? [{ image: prog.image, caption: prog.name }] : []);
            const galleryList = rawGallery.filter(g => g && (g.image || typeof g === 'string'));
            if (galleryList.length === 0) return;

            activeLightboxProgId = progId;
            const currentIdx = (targetIdx !== null) ? targetIdx : (window.programGalleryState[progId] || 0);
            activeLightboxIndex = Math.max(0, Math.min(currentIdx, galleryList.length - 1));

            updateLightboxView(prog, galleryList);

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        function updateLightboxView(prog, galleryList) {
            const imgEl = document.getElementById('lightbox-img');
            const titleEl = document.getElementById('lightbox-program-name');
            const counterEl = document.getElementById('lightbox-counter');
            const captionEl = document.getElementById('lightbox-caption');
            const prevBtn = document.getElementById('lightbox-prev-btn');
            const nextBtn = document.getElementById('lightbox-next-btn');

            const rawItem = galleryList[activeLightboxIndex] || galleryList[0];
            const item = typeof rawItem === 'string' ? { image: rawItem, caption: '' } : rawItem;

            if (imgEl && item) imgEl.src = item.image || '';
            if (titleEl) titleEl.textContent = prog.name || 'Dokumentasi Program';
            if (counterEl) counterEl.textContent = `${activeLightboxIndex + 1} / ${galleryList.length}`;
            if (captionEl && item) captionEl.textContent = item.caption || `Dokumentasi #${activeLightboxIndex + 1}`;

            if (galleryList.length <= 1) {
                if (prevBtn) prevBtn.classList.add('hidden');
                if (nextBtn) nextBtn.classList.add('hidden');
            } else {
                if (prevBtn) prevBtn.classList.remove('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            }
        }

        window.navigateProgramGalleryLightbox = function(delta) {
            if (!activeLightboxProgId) return;
            const prog = (Array.isArray(RUNTIME_PROGRAM_DATA) ? RUNTIME_PROGRAM_DATA.find(p => p.id === activeLightboxProgId) : null) ||
                         (Array.isArray(PROGRAM_DATA) ? PROGRAM_DATA.find(p => p.id === activeLightboxProgId) : null);
            if (!prog) return;

            const d = prog.detail || {};
            let rawGallery = (Array.isArray(d.gallery) && d.gallery.length > 0) ? d.gallery : (prog.image ? [{ image: prog.image, caption: prog.name }] : []);
            const galleryList = rawGallery.filter(g => g && (g.image || typeof g === 'string'));
            if (galleryList.length <= 1) return;

            activeLightboxIndex = ((activeLightboxIndex + delta + galleryList.length) % galleryList.length);
            updateLightboxView(prog, galleryList);

            window.setProgramGallerySlide(activeLightboxProgId, activeLightboxIndex);
        };

        window.closeProgramGalleryLightbox = function() {
            const modal = document.getElementById('modal-program-gallery-lightbox');
            if (modal) modal.classList.add('hidden');
            document.body.style.overflow = '';
            activeLightboxProgId = null;
        };

        // Lightbox keyboard shortcuts (ESC, Left, Right)
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('modal-program-gallery-lightbox');
            if (!modal || modal.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                window.closeProgramGalleryLightbox();
            } else if (e.key === 'ArrowLeft') {
                window.navigateProgramGalleryLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                window.navigateProgramGalleryLightbox(1);
            }
        });
