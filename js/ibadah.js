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