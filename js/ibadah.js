        // ==================== PORTAL IBADAH MODAL ====================
        function openIbadahModal(type) {
            const titleEl = document.getElementById('ibadah-title');
            const tagEl = document.getElementById('ibadah-tag');
            const bodyEl = document.getElementById('ibadah-body');

            if (type === 'quran') {
                titleEl.innerHTML = `<i class="fa-solid fa-book-quran text-emerald-600 mr-2"></i> Al-Qur'an Digital`;
                tagEl.className = "text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase";
                tagEl.innerText = "114 Surah";
                bodyEl.innerHTML = `
                    <div class="space-y-3">
                        <p class="font-semibold text-slate-700">Surah Pilihan Santri:</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition">
                                <div><span class="font-bold text-xs text-slate-800">1. Al-Fatihah</span> <span class="text-[10px] text-slate-400 block">7 Ayat</span></div>
                                <span class="text-base font-semibold text-emerald-700">الفاتحة</span>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition">
                                <div><span class="font-bold text-xs text-slate-800">36. Yasin</span> <span class="text-[10px] text-slate-400 block">83 Ayat</span></div>
                                <span class="text-base font-semibold text-emerald-700">يس</span>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition">
                                <div><span class="font-bold text-xs text-slate-800">55. Ar-Rahman</span> <span class="text-[10px] text-slate-400 block">78 Ayat</span></div>
                                <span class="text-base font-semibold text-emerald-700">الرحمن</span>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-emerald-500 transition">
                                <div><span class="font-bold text-xs text-slate-800">67. Al-Mulk</span> <span class="text-[10px] text-slate-400 block">30 Ayat</span></div>
                                <span class="text-base font-semibold text-emerald-700">الملك</span>
                            </div>
                        </div>
                    </div>
                `;
            } else if (type === 'maulid') {
                titleEl.innerHTML = `<i class="fa-solid fa-kaaba text-purple-600 mr-2"></i> Kitab Maulid Nabi`;
                tagEl.className = "text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase";
                tagEl.innerText = "Diba' & Simtuddurar";
                bodyEl.innerHTML = `
                    <div class="space-y-3">
                        <p class="font-semibold text-slate-700">Pilih Kitab Maulid:</p>
                        <div class="space-y-2">
                            <div onclick="closeModal('ibadah-modal'); switchTab('maulid-index'); renderMaulidIndex();" class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-purple-500 transition">
                                <span class="font-bold text-xs text-slate-800">Maulid Ad-Diba'i (الإمام الديبعي)</span>
                                <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-purple-500 transition">
                                <span class="font-bold text-xs text-slate-800">Maulid Simtuddurar (سمط الدرر)</span>
                                <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-purple-500 transition">
                                <span class="font-bold text-xs text-slate-800">Maulid Al-Barzanji (البرزنجي)</span>
                                <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>
                            </div>
                        </div>
                    </div>
                `;
            } else if (type === 'burdah') {
                titleEl.innerHTML = `<i class="fa-solid fa-scroll text-amber-600 mr-2"></i> Qasidah Burdah`;
                tagEl.className = "text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase";
                tagEl.innerText = "Fashl 1 - 10";
                bodyEl.innerHTML = `
                    <div class="space-y-3 text-center">
                        <div class="p-4 bg-white rounded-2xl border border-amber-200 space-y-2">
                            <p class="text-base md:text-lg font-bold text-slate-800 font-serif leading-loose" dir="rtl">
                                مَوْلَايَ صَلِّ وَسَلِّمْ دَائِمًا أَبَدًا <br> عَلَى حَبِيبِكَ خَيْرِ الْخَلْقِ كُلِّهِمِ
                            </p>
                            <p class="text-[11px] text-slate-500 italic">"Ya Tuhanku, limpahkanlah shalawat dan salam selalu selama-lamanya kepada Kekasih-Mu, makhluk terbaik seluruhnya."</p>
                        </div>
                    </div>
                `;
            } else if (type === 'tahlil') {
                titleEl.innerHTML = `<i class="fa-solid fa-hands-holding text-blue-600 mr-2"></i> Tahlil & Surat Yasin`;
                tagEl.className = "text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase";
                tagEl.innerText = "Lengkap + Doa";
                bodyEl.innerHTML = `
                    <div class="space-y-2">
                        <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-blue-500 transition">
                            <span class="font-bold text-xs text-slate-800">1. Bacaan Surat Yasin</span>
                            <span class="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">Teks Arab</span>
                        </div>
                        <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-blue-500 transition">
                            <span class="font-bold text-xs text-slate-800">2. Susunan Bacaan Tahlil Lengkap</span>
                            <span class="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">Urutan Harian</span>
                        </div>
                        <div class="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:border-blue-500 transition">
                            <span class="font-bold text-xs text-slate-800">3. Doa Tahlil & Arwah</span>
                            <span class="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">Doa Penutup</span>
                        </div>
                    </div>
                `;
            }
        }
        // ==================== AL-QUR'AN FEATURE ====================
        let quranData = [];
        let currentAudio = null;
        let isLatinVisible = false;

        async function fetchQuranList() {
            const container = document.getElementById('quran-list-container');
            if (quranData.length > 0) return renderQuranList(quranData); // Already loaded

            try {
                const response = await fetch('https://equran.id/api/v2/surat');
                const data = await response.json();
                if (data.code === 200) {
                    quranData = data.data;
                    renderQuranList(quranData);
                }
            } catch (error) {
                console.error("Gagal memuat daftar surah:", error);
                container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Gagal memuat data. Periksa koneksi internet Anda.</div>`;
            }
        }

        function renderQuranList(list) {
            const container = document.getElementById('quran-list-container');
            container.innerHTML = '';

            if (list.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">Surah tidak ditemukan.</div>`;
                return;
            }

            list.forEach(surah => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition group";
                card.onclick = () => openQuranDetail(surah.nomor);

                card.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-slate-50 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-sm group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition relative overflow-hidden shrink-0">
                            <span class="relative z-10">${surah.nomor}</span>
                            <div class="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">${surah.namaLatin}</h3>
                            <p class="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 uppercase tracking-wider">${surah.tempatTurun} • ${surah.jumlahAyat} Ayat</p>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="font-arabic text-xl md:text-2xl text-emerald-700 dark:text-emerald-400">${surah.nama}</span>
                        <p class="text-[9px] text-slate-400 dark:text-slate-400 mt-1">${surah.arti}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function searchSurah() {
            const query = document.getElementById('quran-search').value.toLowerCase();
            const filtered = quranData.filter(s =>
                s.namaLatin.toLowerCase().includes(query) ||
                s.arti.toLowerCase().includes(query)
            );
            renderQuranList(filtered);
        }

        async function openQuranDetail(nomorSurah) {
            switchTab('quran-detail');
            const titleEl = document.getElementById('quran-detail-title');
            const subTitleEl = document.getElementById('quran-detail-subtitle');
            const bismillahEl = document.getElementById('quran-bismillah-container');
            const container = document.getElementById('quran-ayah-container');
            const audioPlayer = document.getElementById('quran-audio-player');
            const btnPlayAudio = document.getElementById('btn-play-audio');
            const iconPlayAudio = document.getElementById('icon-play-audio');
            const textPlayAudio = document.getElementById('text-play-audio');

            // Reset state
            titleEl.innerText = "Memuat...";
            subTitleEl.innerText = "Sabar, sedang mengambil data...";
            bismillahEl.classList.add('hidden');
            container.innerHTML = `<div class="bg-white dark:bg-[#15202d] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] text-center py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-emerald-500 mb-3"></i><p class="text-sm text-slate-500 dark:text-slate-400">Memuat ayat...</p></div>`;

            if (currentAudio) {
                currentAudio.pause();
                iconPlayAudio.className = "fa-solid fa-play";
                textPlayAudio.innerText = "Putar Murottal";
            }

            try {
                const response = await fetch(`https://equran.id/api/v2/surat/${nomorSurah}`);
                const data = await response.json();

                if (data.code === 200) {
                    const surah = data.data;
                    titleEl.innerText = surah.namaLatin;
                    subTitleEl.innerText = `${surah.arti} • ${surah.jumlahAyat} Ayat`;

                    // Show Bismillah if not Al-Fatihah or At-Taubah
                    if (nomorSurah !== 1 && nomorSurah !== 9) {
                        bismillahEl.classList.remove('hidden');
                    }

                    // Setup Audio
                    if (surah.audioFull && surah.audioFull['05']) {
                        audioPlayer.src = surah.audioFull['05']; // Mishary Rashid Alafasy
                        currentAudio = audioPlayer;
                        btnPlayAudio.classList.remove('hidden');
                    } else {
                        btnPlayAudio.classList.add('hidden');
                    }

                    // Render Ayah
                    container.innerHTML = '';
                    surah.ayat.forEach(ayat => {
                        const div = document.createElement('div');
                        div.className = "bg-white dark:bg-[#15202d] p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-4 hover:border-emerald-200 dark:hover:border-emerald-500/40 transition";
                        const latinDisplayClass = isLatinVisible ? "" : "hidden";
                        div.innerHTML = `
                            <div class="flex items-start justify-between gap-4">
                                <div class="w-8 h-8 shrink-0 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-100 dark:border-emerald-800/40">
                                    ${ayat.nomorAyat}
                                </div>
                                <p class="font-arabic text-2xl md:text-3xl text-slate-800 dark:text-slate-100 text-right leading-loose flex-1" style="line-height: 2.5;">
                                    ${ayat.teksArab}
                                </p>
                            </div>
                            <div class="pt-3 border-t border-slate-50 dark:border-slate-800 space-y-2">
                                <p class="latin-text text-emerald-700 dark:text-emerald-400 text-xs md:text-sm italic font-medium leading-relaxed ${latinDisplayClass}">${ayat.teksLatin}</p>
                                <p class="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed">${ayat.teksIndonesia}</p>
                            </div>
                        `;
                        container.appendChild(div);
                    });
                }
            } catch (error) {
                console.error("Gagal memuat detail surah:", error);
                container.innerHTML = `<div class="bg-white dark:bg-[#15202d] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] text-center py-10 text-red-500">Gagal memuat data. Periksa koneksi internet Anda.</div>`;
            }
        }

        function toggleLatin() {
            isLatinVisible = !isLatinVisible;

            const latinTexts = document.querySelectorAll('.latin-text');
            latinTexts.forEach(el => {
                if (isLatinVisible) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            const textToggleLatin = document.getElementById('text-toggle-latin');
            if (textToggleLatin) {
                textToggleLatin.innerText = isLatinVisible ? "Sembunyikan Latin" : "Tampilkan Latin";
            }
        }

        function toggleQuranAudio() {
            const iconPlayAudio = document.getElementById('icon-play-audio');
            const textPlayAudio = document.getElementById('text-play-audio');
            if (!currentAudio) return;

            if (currentAudio.paused) {
                currentAudio.play();
                iconPlayAudio.className = "fa-solid fa-pause";
                textPlayAudio.innerText = "Jeda Murottal";
            } else {
                currentAudio.pause();
                iconPlayAudio.className = "fa-solid fa-play";
                textPlayAudio.innerText = "Lanjut Putar";
            }
        }

        // Listener to auto-reset button when audio ends
        document.addEventListener('DOMContentLoaded', () => {
            const player = document.getElementById('quran-audio-player');
            if (player) {
                player.addEventListener('ended', function () {
                    document.getElementById('icon-play-audio').className = "fa-solid fa-play";
                    document.getElementById('text-play-audio').innerText = "Putar Murottal";
                });
            }
        });

        // ==================== MAULID FEATURE ====================
        function renderMaulidIndex() {
            const container = document.getElementById('maulid-list-container');
            if (!container) return;
            container.innerHTML = '';

            maulidDibai.forEach(chapter => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] flex items-center justify-between cursor-pointer hover:border-purple-500 hover:shadow-md transition group";
                card.onclick = () => openMaulidDetail(chapter.id);

                card.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-slate-50 dark:bg-[#1c2836] text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-sm group-hover:bg-purple-50 dark:group-hover:bg-purple-950/40 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition relative overflow-hidden shrink-0">
                            <span class="relative z-10">${chapter.id}</span>
                            <div class="absolute inset-0 bg-purple-100 dark:bg-purple-900/40 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-purple-700 dark:group-hover:text-purple-400 transition">${chapter.title}</h3>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <i class="fa-solid fa-chevron-right text-slate-400 dark:text-slate-400 group-hover:text-purple-500 transition"></i>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function openMaulidDetail(id) {
            const chapter = maulidDibai.find(c => c.id === id);
            if (!chapter) return;

            document.getElementById('maulid-detail-title').innerText = chapter.title;
            const container = document.getElementById('maulid-ayah-container');
            container.innerHTML = '';

            chapter.content.forEach((text) => {
                const div = document.createElement('div');
                div.className = "bg-white dark:bg-[#15202d] p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-4 hover:border-purple-200 dark:hover:border-purple-500/40 transition";
                div.innerHTML = `
                    <div class="flex items-start justify-between gap-4">
                        <p class="font-arabic text-2xl md:text-3xl text-slate-800 dark:text-slate-100 text-center md:text-right leading-loose flex-1 w-full" style="line-height: 2.5;" dir="rtl">
                            ${text}
                        </p>
                    </div>
                `;
                container.appendChild(div);
            });

            switchTab('maulid-detail');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ==================== QASIDAH BURDAH CONTROLLER ====================
        let currentBurdahBabId = 1;
        let burdahShowLatin = true;
        let burdahShowTranslation = true;

        function openBurdahIndex() {
            renderBurdahIndex();
            switchTab('burdah-index');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function renderBurdahIndex() {
            const container = document.getElementById('burdah-list-container');
            if (!container || typeof qasidahBurdah === 'undefined') return;

            container.innerHTML = '';
            qasidahBurdah.forEach(bab => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all duration-200 group";
                card.onclick = () => openBurdahDetail(bab.id);

                card.innerHTML = `
                    <div class="flex items-center space-x-3.5 min-w-0">
                        <div class="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center font-extrabold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shrink-0">
                            <span>${bab.id}</span>
                        </div>
                        <div class="min-w-0 space-y-0.5">
                            <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                                ${bab.title}
                            </h4>
                            <p class="text-[11px] font-arabic text-slate-400 dark:text-slate-400 truncate" dir="rtl">
                                ${bab.arabicTitle}
                            </p>
                        </div>
                    </div>
                    <div class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#1c2836] text-slate-400 dark:text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-400 flex items-center justify-center transition shrink-0 ml-2">
                        <i class="fa-solid fa-chevron-right text-xs"></i>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function openBurdahDetail(id) {
            if (typeof qasidahBurdah === 'undefined') return;
            const bab = qasidahBurdah.find(b => b.id === id);
            if (!bab) return;

            currentBurdahBabId = bab.id;

            // Set judul
            const titleElem = document.getElementById('burdah-detail-title');
            const subtitleElem = document.getElementById('burdah-detail-subtitle');
            if (titleElem) titleElem.innerText = bab.title;
            if (subtitleElem) subtitleElem.innerText = bab.arabicTitle;

            // Set Refrain
            const refrainBox = document.getElementById('burdah-refrain-container');
            if (refrainBox && bab.refrain) {
                refrainBox.innerHTML = `
                    <span class="inline-block px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                        Bait Pembuka (Reff)
                    </span>
                    <p class="font-arabic text-xl sm:text-2xl md:text-3xl text-emerald-950 dark:text-emerald-100 leading-loose" dir="rtl">
                        ${bab.refrain.arabic}
                    </p>
                    <p class="burdah-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 ${burdahShowLatin ? '' : 'hidden'}">
                        ${bab.refrain.latin}
                    </p>
                    <p class="burdah-translation text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto italic ${burdahShowTranslation ? '' : 'hidden'}">
                        "${bab.refrain.translation}"
                    </p>
                `;
            }

            // Render bait-bait
            const container = document.getElementById('burdah-verses-container');
            if (!container) return;
            container.innerHTML = '';

            bab.verses.forEach(v => {
                const div = document.createElement('div');
                div.className = "bg-white dark:bg-[#15202d] p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-3 hover:border-emerald-500/40 transition";
                div.innerHTML = `
                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#253447] pb-2 text-xs">
                        <span class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-[11px]">
                            ${v.no}
                        </span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bait ke-${v.no}</span>
                    </div>
                    <p class="font-arabic text-xl sm:text-2xl md:text-3xl text-slate-900 dark:text-slate-100 text-right leading-loose w-full" style="line-height: 2.2;" dir="rtl">
                        ${v.arabic}
                    </p>
                    <p class="burdah-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed ${burdahShowLatin ? '' : 'hidden'}">
                        ${v.latin}
                    </p>
                    <p class="burdah-translation text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${burdahShowTranslation ? '' : 'hidden'}">
                        ${v.translation}
                    </p>
                `;
                container.appendChild(div);
            });

            // Update tombol navigasi
            const btnPrev = document.getElementById('btn-burdah-prev');
            const btnNext = document.getElementById('btn-burdah-next');
            if (btnPrev) btnPrev.disabled = (currentBurdahBabId <= 1);
            if (btnNext) btnNext.disabled = (currentBurdahBabId >= qasidahBurdah.length);

            switchTab('burdah-detail');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function toggleBurdahLatin() {
            burdahShowLatin = !burdahShowLatin;
            const textElem = document.getElementById('text-toggle-burdah-latin');
            if (textElem) {
                textElem.innerText = burdahShowLatin ? "Sembunyikan Latin" : "Tampilkan Latin";
            }
            const latins = document.querySelectorAll('.burdah-latin');
            latins.forEach(el => {
                if (burdahShowLatin) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }

        function toggleBurdahTranslation() {
            burdahShowTranslation = !burdahShowTranslation;
            const textElem = document.getElementById('text-toggle-burdah-translation');
            if (textElem) {
                textElem.innerText = burdahShowTranslation ? "Sembunyikan Terjemah" : "Tampilkan Terjemah";
            }
            const translations = document.querySelectorAll('.burdah-translation');
            translations.forEach(el => {
                if (burdahShowTranslation) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }

        function navigateBurdahBab(direction) {
            if (typeof qasidahBurdah === 'undefined') return;
            const nextBabId = currentBurdahBabId + direction;
            if (nextBabId >= 1 && nextBabId <= qasidahBurdah.length) {
                openBurdahDetail(nextBabId);
            }
        }

        // ==================== FITUR TAHLIL & SURAT YASIN (QURAN NU ONLINE) ====================
        let currentTahlilYasinSubTab = 'tahlil';
        let tahlilShowLatin = true;
        let tahlilShowTranslation = true;
        let yasinAudioPlaying = false;

        function openTahlilYasinPage(subTab = 'tahlil') {
            switchTab('tahlil-yasin');
            switchTahlilYasinSubTab(subTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function switchTahlilYasinSubTab(tabName) {
            currentTahlilYasinSubTab = tabName;

            // Pause audio jika beralih dari Yasin
            const audioPlayer = document.getElementById('tahlil-yasin-audio-player');
            const audioWrapper = document.getElementById('yasin-audio-control-wrapper');
            if (tabName !== 'yasin') {
                if (audioPlayer && !audioPlayer.paused) {
                    audioPlayer.pause();
                }
                resetYasinAudioButton();
                if (audioWrapper) {
                    audioWrapper.classList.add('hidden');
                    audioWrapper.classList.remove('flex');
                }
            } else {
                if (audioWrapper) {
                    audioWrapper.classList.remove('hidden');
                    audioWrapper.classList.add('flex');
                }
            }

            // Update Segmented Pill Tabs UI
            const tabs = ['tahlil', 'yasin', 'doa'];
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-btn-${t}`);
                if (btn) {
                    if (t === tabName) {
                        btn.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 text-center flex items-center justify-center space-x-1.5 bg-white dark:bg-[#15202d] text-emerald-700 dark:text-emerald-400 shadow-sm";
                    } else {
                        btn.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 text-center flex items-center justify-center space-x-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100";
                    }
                }
            });

            // Update Header Title & Badge
            const titleElem = document.getElementById('tahlil-yasin-page-title');
            const badgeElem = document.getElementById('tahlil-yasin-badge');

            if (tabName === 'tahlil') {
                if (titleElem) titleElem.innerText = "Susunan Tahlil Lengkap";
                if (badgeElem) {
                    badgeElem.innerText = "Amaliah NU";
                    badgeElem.className = "text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider";
                }
                renderTahlilContent();
            } else if (tabName === 'yasin') {
                if (titleElem) titleElem.innerText = "Surat Yasin (83 Ayat)";
                if (badgeElem) {
                    badgeElem.innerText = "Makkiyah • 83 Ayat";
                    badgeElem.className = "text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider";
                }
                renderYasinContent();
            } else if (tabName === 'doa') {
                if (titleElem) titleElem.innerText = "Doa Tahlil & Arwah";
                if (badgeElem) {
                    badgeElem.innerText = "Doa & Munajat";
                    badgeElem.className = "text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider";
                }
                renderDoaTahlilContent();
            }
        }

        function renderTahlilContent() {
            const container = document.getElementById('tahlil-yasin-content-container');
            if (!container) return;
            if (typeof dataTahlil === 'undefined') {
                container.innerHTML = `<div class="p-8 text-center text-slate-400">Data Tahlil sedang dimuat...</div>`;
                return;
            }

            container.innerHTML = '';

            // Banner Pengantar Tahlil
            const introDiv = document.createElement('div');
            introDiv.className = "p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:to-transparent bg-white dark:bg-[#15202d] border border-blue-500/20 dark:border-blue-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3";
            introDiv.innerHTML = `
                <div class="space-y-1">
                    <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <i class="fa-solid fa-hands-holding text-blue-600"></i> Susunan Bacaan Tahlil Nahdlatul Ulama
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Dimulai dari hadhrah fatihah, surat-surat pendek, tahlil inti, istighfar, shalawat, hingga doa arwah.
                    </p>
                </div>
                <button type="button" onclick="switchTahlilYasinSubTab('yasin')"
                    class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-95 flex items-center space-x-1.5">
                    <i class="fa-solid fa-book-open"></i>
                    <span>Baca Surat Yasin Dulu</span>
                </button>
            `;
            container.appendChild(introDiv);

            dataTahlil.forEach((item, index) => {
                // Header pemisah khusus sebelum masuk Doa Tahlil (item no 36 / index 24)
                if (item.no === 36) {
                    const doaHeader = document.createElement('div');
                    doaHeader.className = "pt-4 pb-2";
                    doaHeader.innerHTML = `
                        <div class="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                            <div class="flex items-center space-x-2.5">
                                <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    <i class="fa-solid fa-hands-praying"></i>
                                </div>
                                <div>
                                    <h4 class="font-extrabold text-xs sm:text-sm text-amber-900 dark:text-amber-200">DOA TAHLIL / DOA ARWAH</h4>
                                    <p class="text-[11px] text-amber-700 dark:text-amber-400">Rangkaian doa penutup pengiriman pahala untuk almarhum / almarhumah</p>
                                </div>
                            </div>
                        </div>
                    `;
                    container.appendChild(doaHeader);
                }

                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-3 hover:border-emerald-500/40 transition";

                let badgeText = `Bacaan ke-${index + 1}`;
                if (item.no >= 36) {
                    badgeText = `Doa Tahlil • Bagian ${item.no - 35}`;
                }

                card.innerHTML = `
                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#253447] pb-2 text-xs">
                        <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-extrabold text-[11px]">
                            ${index + 1}
                        </span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">${badgeText}</span>
                    </div>
                    <p class="font-arabic text-xl sm:text-2xl md:text-3xl text-slate-900 dark:text-slate-100 text-right leading-loose w-full" style="line-height: 2.2;" dir="rtl">
                        ${item.arabic}
                    </p>
                    <p class="tahlil-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed ${tahlilShowLatin ? '' : 'hidden'}">
                        ${item.latin}
                    </p>
                    <p class="tahlil-translation text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${tahlilShowTranslation ? '' : 'hidden'}">
                        ${item.translation}
                    </p>
                `;
                container.appendChild(card);
            });
        }

        function renderYasinContent() {
            const container = document.getElementById('tahlil-yasin-content-container');
            if (!container) return;
            if (typeof dataYasin === 'undefined' || !dataYasin.ayahs) {
                container.innerHTML = `<div class="p-8 text-center text-slate-400">Data Surat Yasin sedang dimuat...</div>`;
                return;
            }

            container.innerHTML = '';

            // Banner Info Surah Yasin
            const banner = document.createElement('div');
            banner.className = "p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent dark:from-emerald-950/50 dark:to-transparent bg-white dark:bg-[#15202d] border border-emerald-500/20 dark:border-emerald-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4";
            banner.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                            Surat ke-36
                        </span>
                        <span class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            ${dataYasin.type} • ${dataYasin.totalAyah} Ayat
                        </span>
                    </div>
                    <h3 class="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100">
                        Surat Yasin (سورة يٰس)
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Jantung Al-Qur'an (Qalbul Qur'an), dibaca saat amaliah malam Jumat, ziarah kubur, tahlilan, dan hajat.
                    </p>
                </div>
                <div class="font-arabic text-3xl md:text-4xl text-emerald-800 dark:text-emerald-200 font-bold" dir="rtl">
                    يس
                </div>
            `;
            container.appendChild(banner);

            // Banner Basmalah Pembuka
            const basmalahCard = document.createElement('div');
            basmalahCard.className = "p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/30 dark:border-emerald-500/40 text-center space-y-2 shadow-sm";
            basmalahCard.innerHTML = `
                <p class="font-arabic text-2xl sm:text-3xl text-emerald-950 dark:text-emerald-100 leading-loose" dir="rtl">
                    بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <p class="tahlil-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 ${tahlilShowLatin ? '' : 'hidden'}">
                    Bismillâhir-raḫmânir-raḫîm
                </p>
                <p class="tahlil-translation text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto italic ${tahlilShowTranslation ? '' : 'hidden'}">
                    "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang."
                </p>
            `;
            container.appendChild(basmalahCard);

            // Loop 83 ayat Yasin
            dataYasin.ayahs.forEach(ayah => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-3 hover:border-emerald-500/40 transition";
                card.id = `yasin-ayah-${ayah.no}`;
                card.innerHTML = `
                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#253447] pb-2 text-xs">
                        <span class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-extrabold text-[11px]">
                            ${ayah.no}
                        </span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Ayat ${ayah.no}</span>
                    </div>
                    <p class="font-arabic text-xl sm:text-2xl md:text-3xl text-slate-900 dark:text-slate-100 text-right leading-loose w-full" style="line-height: 2.2;" dir="rtl">
                        ${ayah.arabic}
                    </p>
                    <p class="tahlil-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed ${tahlilShowLatin ? '' : 'hidden'}">
                        ${ayah.latin}
                    </p>
                    <p class="tahlil-translation text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${tahlilShowTranslation ? '' : 'hidden'}">
                        ${ayah.translation}
                    </p>
                `;
                container.appendChild(card);
            });
        }

        function renderDoaTahlilContent() {
            const container = document.getElementById('tahlil-yasin-content-container');
            if (!container) return;
            if (typeof dataTahlil === 'undefined') {
                container.innerHTML = `<div class="p-8 text-center text-slate-400">Data Doa Tahlil sedang dimuat...</div>`;
                return;
            }

            container.innerHTML = '';

            // Banner Pengantar Doa Arwah
            const banner = document.createElement('div');
            banner.className = "p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent dark:from-amber-950/40 dark:to-transparent bg-white dark:bg-[#15202d] border border-amber-500/20 dark:border-amber-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4";
            banner.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                            Doa Khusus Arwah
                        </span>
                        <span class="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Tradisi Pesantren Nahdlatul Ulama
                        </span>
                    </div>
                    <h3 class="font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100">
                        Doa Tahlil & Pengiriman Pahala Arwah
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Dipanjatkan untuk memohon ampunan, rahmat, dan kelapangan kubur bagi segenap almarhum/almarhumah, orang tua, dan para masyayikh.
                    </p>
                </div>
                <div class="font-arabic text-2xl md:text-3xl text-amber-800 dark:text-amber-200 font-bold" dir="rtl">
                    دعاء التّهليل
                </div>
            `;
            container.appendChild(banner);

            const doaItems = dataTahlil.filter(item => item.no >= 36);
            doaItems.forEach((item, idx) => {
                const card = document.createElement('div');
                card.className = "bg-white dark:bg-[#15202d] p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#253447] space-y-3 hover:border-amber-500/40 transition";
                card.innerHTML = `
                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-[#253447] pb-2 text-xs">
                        <span class="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-extrabold text-[11px]">
                            ${idx + 1}
                        </span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bagian ${idx + 1}</span>
                    </div>
                    <p class="font-arabic text-xl sm:text-2xl md:text-3xl text-slate-900 dark:text-slate-100 text-right leading-loose w-full" style="line-height: 2.2;" dir="rtl">
                        ${item.arabic}
                    </p>
                    <p class="tahlil-latin text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed ${tahlilShowLatin ? '' : 'hidden'}">
                        ${item.latin}
                    </p>
                    <p class="tahlil-translation text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${tahlilShowTranslation ? '' : 'hidden'}">
                        ${item.translation}
                    </p>
                `;
                container.appendChild(card);
            });
        }

        function toggleTahlilLatin() {
            tahlilShowLatin = !tahlilShowLatin;
            const textElem = document.getElementById('text-toggle-tahlil-latin');
            if (textElem) {
                textElem.innerText = tahlilShowLatin ? "Sembunyikan Latin" : "Tampilkan Latin";
            }
            const latins = document.querySelectorAll('.tahlil-latin');
            latins.forEach(el => {
                if (tahlilShowLatin) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }

        function toggleTahlilTranslation() {
            tahlilShowTranslation = !tahlilShowTranslation;
            const textElem = document.getElementById('text-toggle-tahlil-trans');
            if (textElem) {
                textElem.innerText = tahlilShowTranslation ? "Sembunyikan Terjemah" : "Tampilkan Terjemah";
            }
            const translations = document.querySelectorAll('.tahlil-translation');
            translations.forEach(el => {
                if (tahlilShowTranslation) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }

        function toggleYasinAudio() {
            const audioPlayer = document.getElementById('tahlil-yasin-audio-player');
            const playBtn = document.getElementById('btn-play-yasin-audio');
            const iconElem = document.getElementById('icon-play-yasin-audio');
            const textElem = document.getElementById('text-play-yasin-audio');
            if (!audioPlayer || typeof dataYasin === 'undefined') return;

            if (!audioPlayer.src || audioPlayer.src === '' || !audioPlayer.src.includes('.mp3')) {
                audioPlayer.src = dataYasin.audioUrl;
            }

            if (audioPlayer.paused) {
                audioPlayer.play().then(() => {
                    yasinAudioPlaying = true;
                    if (iconElem) {
                        iconElem.className = "fa-solid fa-pause text-xs";
                    }
                    if (textElem) {
                        textElem.innerText = "Jeda Murottal";
                    }
                    if (playBtn) {
                        playBtn.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition active:scale-95 animate-pulse";
                    }
                }).catch(err => {
                    console.warn("Audio play error:", err);
                });
            } else {
                audioPlayer.pause();
                resetYasinAudioButton();
            }

            audioPlayer.onended = () => {
                resetYasinAudioButton();
            };
            audioPlayer.onerror = () => {
                resetYasinAudioButton();
            };
        }

        function resetYasinAudioButton() {
            yasinAudioPlaying = false;
            const playBtn = document.getElementById('btn-play-yasin-audio');
            const iconElem = document.getElementById('icon-play-yasin-audio');
            const textElem = document.getElementById('text-play-yasin-audio');
            if (iconElem) {
                iconElem.className = "fa-solid fa-play text-xs";
            }
            if (textElem) {
                textElem.innerText = "Putar Murottal";
            }
            if (playBtn) {
                playBtn.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95";
            }
        }