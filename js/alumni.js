        // ==================== FORM ALUMNI & LEAFLET ====================
        let alumniMap = null;
        // ==================== WILAYAH INDONESIA API ====================
        async function fetchWilayah(url, selectElementId, defaultText) {
            const select = document.getElementById(selectElementId);
            select.innerHTML = `<option value="" disabled selected>Memuat...</option>`;
            select.disabled = true;
            try {
                const response = await fetch(url);
                const data = await response.json();
                select.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
                data.forEach(item => {
                    const opt = document.createElement('option');
                    // Simpan NAMA sebagai value, dan ID sebagai data-id untuk berjenjang
                    opt.value = item.name;
                    opt.setAttribute('data-id', item.id);
                    opt.textContent = item.name;
                    select.appendChild(opt);
                });
                select.disabled = false;
            } catch (err) {
                console.error("Gagal memuat wilayah:", err);
                select.innerHTML = `<option value="" disabled selected>Gagal memuat data</option>`;
            }
        }

        function initWilayah() {
            const provSelect = document.getElementById('al-provinsi');
            const kabSelect = document.getElementById('al-kabupaten');
            const kecSelect = document.getElementById('al-kecamatan');
            const desaSelect = document.getElementById('al-desa');

            if (!provSelect) return;

            // Load Provinsi
            fetchWilayah('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json', 'al-provinsi', 'Pilih Provinsi');

            provSelect.addEventListener('change', function() {
                const id = this.options[this.selectedIndex].getAttribute('data-id');
                kabSelect.innerHTML = '<option value="" disabled selected>Pilih Kabupaten/Kota</option>';
                kecSelect.innerHTML = '<option value="" disabled selected>Pilih Kecamatan</option>';
                desaSelect.innerHTML = '<option value="" disabled selected>Pilih Desa/Kelurahan</option>';
                kabSelect.disabled = true; kecSelect.disabled = true; desaSelect.disabled = true;
                if(id) fetchWilayah(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`, 'al-kabupaten', 'Pilih Kabupaten/Kota');
            });

            kabSelect.addEventListener('change', function() {
                const id = this.options[this.selectedIndex].getAttribute('data-id');
                kecSelect.innerHTML = '<option value="" disabled selected>Pilih Kecamatan</option>';
                desaSelect.innerHTML = '<option value="" disabled selected>Pilih Desa/Kelurahan</option>';
                kecSelect.disabled = true; desaSelect.disabled = true;
                if(id) fetchWilayah(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`, 'al-kecamatan', 'Pilih Kecamatan');
            });

            kecSelect.addEventListener('change', function() {
                const id = this.options[this.selectedIndex].getAttribute('data-id');
                desaSelect.innerHTML = '<option value="" disabled selected>Pilih Desa/Kelurahan</option>';
                desaSelect.disabled = true;
                if(id) fetchWilayah(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`, 'al-desa', 'Pilih Desa/Kelurahan');
            });
        }


        function loadLeaflet(callback) {
            if (typeof L !== 'undefined') {
                if (typeof callback === 'function') callback();
                return;
            }
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => {
                if (typeof callback === 'function') callback();
            };
            script.onerror = () => {
                console.warn('Gagal memuat Leaflet map library secara on-demand.');
            };
            document.head.appendChild(script);
        }

        function initAlumniMap() {
            if (typeof L === 'undefined') {
                loadLeaflet(() => {
                    initAlumniMap();
                });
                return;
            }

            if (alumniMap) {
                setTimeout(() => { alumniMap.invalidateSize(); }, 300);
                return;
            }
            
            alumniMap = L.map('alumni-map', {
                center: [-6.9147, 110.6384],
                zoom: 10,
                zoomControl: false
            });
            
            L.control.zoom({ position: 'bottomleft' }).addTo(alumniMap);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(alumniMap);

            alumniMap.on('moveend', function() {
                const center = alumniMap.getCenter();
                document.getElementById('al-lat').value = center.lat;
                document.getElementById('al-lng').value = center.lng;
            });
            
            document.getElementById('al-lat').value = -6.9147;
            document.getElementById('al-lng').value = 110.6384;
        }

        function getGPSLocation() {
            if (navigator.geolocation) {
                const btn = document.querySelector('button[onclick="getGPSLocation()"]');
                const origHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        if (alumniMap) {
                            alumniMap.flyTo([lat, lng], 15);
                            document.getElementById('al-lat').value = lat;
                            document.getElementById('al-lng').value = lng;
                        }
                        btn.innerHTML = origHtml;
                    },
                    (error) => {
                        btn.innerHTML = origHtml;
                        showToast("⚠️ Gagal mendapat lokasi GPS. Geser peta secara manual.");
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                showToast("⚠️ Browser tidak mendukung Geolocation.");
            }
        }

        function nextAlumniStep(current) {
            const form = document.getElementById('alumni-form');
            if (current === 1) {
                if (!document.getElementById('al-nama').checkValidity()) {
                    document.getElementById('al-nama').reportValidity();
                    return;
                }
                if (!document.getElementById('al-jk').checkValidity()) {
                    document.getElementById('al-jk').reportValidity();
                    return;
                }
                if (!document.getElementById('al-wa').checkValidity()) {
                    document.getElementById('al-wa').reportValidity();
                    return;
                }
            } else if (current === 2) {
                if (!document.getElementById('al-masuk').checkValidity()) {
                    document.getElementById('al-masuk').reportValidity();
                    return;
                }
                if (!document.getElementById('al-lulus').checkValidity()) {
                    document.getElementById('al-lulus').reportValidity();
                    return;
                }
                if (!document.getElementById('al-program').checkValidity()) {
                    document.getElementById('al-program').reportValidity();
                    return;
                }
                if (!document.getElementById('al-kesibukan').checkValidity()) {
                    document.getElementById('al-kesibukan').reportValidity();
                    return;
                }
            }

            document.getElementById('alumni-step-' + current).classList.add('hidden');
            document.getElementById('alumni-step-' + current).classList.remove('block');
            
            const next = current + 1;
            document.getElementById('alumni-step-' + next).classList.remove('hidden');
            document.getElementById('alumni-step-' + next).classList.add('block');
            
            const prog = next === 2 ? 'w-2/3' : 'w-full';
            const bar = document.getElementById('alumni-progress-bar');
            bar.className = 'h-full bg-emerald-500 transition-all duration-300 ' + prog;
            
            if (next === 3) {
                initAlumniMap();
                setTimeout(() => { if(alumniMap) alumniMap.invalidateSize(); }, 200);
            }
            window.scrollTo({top: 0, behavior: 'smooth'});
        }

        function prevAlumniStep(current) {
            document.getElementById('alumni-step-' + current).classList.add('hidden');
            document.getElementById('alumni-step-' + current).classList.remove('block');
            
            const prev = current - 1;
            document.getElementById('alumni-step-' + prev).classList.remove('hidden');
            document.getElementById('alumni-step-' + prev).classList.add('block');
            
            const prog = prev === 1 ? 'w-1/3' : 'w-2/3';
            const bar = document.getElementById('alumni-progress-bar');
            bar.className = 'h-full bg-emerald-500 transition-all duration-300 ' + prog;
            window.scrollTo({top: 0, behavior: 'smooth'});
        }

        async function submitAlumniForm(e) {
            e.preventDefault();
            const btn = document.getElementById('al-submit-btn');
            const errBox = document.getElementById('alumni-error');
            
            errBox.classList.add('hidden');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Menyimpan...</span>';

            let fileData = null;
            const fileInput = document.getElementById('al-foto');
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64 = e.target.result.split(',')[1];
                        resolve({
                            base64: base64,
                            mimeType: file.type,
                            filename: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }

            const payload = {
                nama: document.getElementById('al-nama').value.trim(),
                jk: document.getElementById('al-jk').value,
                wa: document.getElementById('al-wa').value.trim(),
                medsos: document.getElementById('al-medsos').value.trim(),
                masuk: document.getElementById('al-masuk').value,
                lulus: document.getElementById('al-lulus').value,
                program: document.getElementById('al-program').value,
                kesibukan: document.getElementById('al-kesibukan').value,
                instansi: document.getElementById('al-instansi').value.trim(),
                kesan: document.getElementById('al-kesan').value.trim(),
                provinsi: document.getElementById('al-provinsi').value.trim(),
                kabupaten: document.getElementById('al-kabupaten').value.trim(),
                kecamatan: document.getElementById('al-kecamatan').value.trim(),
                desa: document.getElementById('al-desa').value.trim(),
                alamat: document.getElementById('al-alamat').value.trim(),
                lat: document.getElementById('al-lat').value,
                lng: document.getElementById('al-lng').value,
                izin: document.getElementById('al-izin').checked ? "Ya" : "Tidak",
                file: fileData
            };

            try {
                const res = await apiPost("alumni.create", payload);
                if (res.success) {
                    document.getElementById('alumni-form').classList.add('hidden');
                    document.getElementById('alumni-form-success').classList.remove('hidden');
                    document.getElementById('alumni-form').reset();
                    window.scrollTo({top: 0, behavior: 'smooth'});
                } else {
                    errBox.innerText = res.error?.message || "Gagal menyimpan data.";
                    errBox.classList.remove('hidden');
                }
            } catch (err) {
                console.error("Gagal menyimpan data alumni:", err);
                errBox.innerText = "Terjadi kendala koneksi ke database: " + (err.message || "Silakan periksa jaringan dan coba kembali.");
                errBox.classList.remove('hidden');
                errBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Simpan Data</span>';
            }
        }
    
        async function loadAlumniTestimonials() {
            const container = document.getElementById('alumni-testimonials-container');
            if (!container) return;

            try {
                const raw = await apiGet('alumni.getTestimonials');
                const data = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.data) ? raw.data : []);
                
                if (!data || data.length === 0) {
                    container.innerHTML = `
                        <div class="md:col-span-3 text-center py-10 bg-slate-50 dark:bg-[#1c2836] rounded-2xl border border-dashed border-slate-200 dark:border-[#253447] p-6 space-y-2">
                            <i class="fa-solid fa-comments text-3xl text-slate-300 dark:text-slate-600"></i>
                            <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada testimoni alumni yang dipublikasikan.</p>
                            <button onclick="switchTab('form-alumni')" class="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
                                <i class="fa-solid fa-pen-to-square"></i>
                                <span>Tulis Testimoni Pertama</span>
                            </button>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = '';
                const colorPalettes = [
                    { border: 'border-emerald-300 dark:border-emerald-700/50', bg: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-400', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' },
                    { border: 'border-amber-300 dark:border-amber-700/50', bg: 'bg-amber-600', text: 'text-amber-700 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' },
                    { border: 'border-blue-300 dark:border-blue-700/50', bg: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-400', badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' },
                    { border: 'border-purple-300 dark:border-purple-700/50', bg: 'bg-purple-600', text: 'text-purple-700 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' },
                    { border: 'border-teal-300 dark:border-teal-700/50', bg: 'bg-teal-600', text: 'text-teal-700 dark:text-teal-400', badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300' }
                ];

                data.forEach((item, index) => {
                    const palette = colorPalettes[index % colorPalettes.length];
                    const namaClean = String(item.nama || 'Alumni').trim();
                    const inisial = (namaClean.split(' ').map(w => w[0]).slice(0, 2).join('') || namaClean.substring(0, 2)).toUpperCase();
                    
                    let fotoUrl = item.foto && String(item.foto).trim() !== "" ? item.foto : null;
                    if (fotoUrl && fotoUrl.includes('drive.google.com')) {
                        const idMatch = fotoUrl.match(/id=([a-zA-Z0-9_-]+)/) || fotoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (idMatch && idMatch[1]) {
                            fotoUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
                        }
                    }

                    const avatarHtml = fotoUrl 
                        ? `<img src="${fotoUrl}" alt="${escapeHtml(namaClean)}" loading="lazy" onerror="this.outerHTML='<div class=\'w-12 h-12 ${palette.bg} text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm\'>${inisial}</div>'" class="w-12 h-12 rounded-full object-cover shrink-0 border-2 ${palette.border} shadow-sm">`
                        : `<div class="w-12 h-12 ${palette.bg} text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 ${palette.border} shadow-sm">${inisial}</div>`;

                    const angkatan = item.tahunLulus || item.tahunMasuk || item.angkatan || '-';
                    const pekerjaan = item.instansi || item.kesibukan || item.pekerjaan || 'Alumni';
                    const pesanTeks = item.kesan || item.pesan || '-';
                    
                    const cardHtml = `
                        <div class="bg-slate-50 dark:bg-[#1c2836] p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-[#253447] space-y-3 flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                            <div class="space-y-2.5">
                                <div class="flex items-center space-x-3">
                                    ${avatarHtml}
                                    <div class="min-w-0 flex-1">
                                        <h4 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(namaClean)}</h4>
                                        <p class="text-[10px] ${palette.text} font-semibold">Alumni Angkatan ${escapeHtml(angkatan)}</p>
                                    </div>
                                </div>
                                <div>
                                    <span class="inline-block ${palette.badgeBg} text-[9px] font-extrabold px-2.5 py-0.5 rounded-md truncate max-w-full">
                                        ${escapeHtml(pekerjaan)}
                                    </span>
                                </div>
                                <div class="relative">
                                    <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-4">
                                        "${escapeHtml(pesanTeks)}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                    container.innerHTML += cardHtml;
                });

            } catch (err) {
                console.error("Gagal load testimoni alumni:", err);
                container.innerHTML = '<div class="md:col-span-3 text-center text-xs text-rose-500 py-10">Gagal memuat testimoni alumni. Silakan periksa jaringan Anda.</div>';
            }
        }
