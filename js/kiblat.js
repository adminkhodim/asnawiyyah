/**
 * ====================================================================
 * ASNAWIYYAH KOMPAS KIBLAT ENGINE (v2.0)
 * Perhitungan Hisab Arah Kiblat Geodesi Presisi Terhubung Lokasi Perangkat
 * Koordinat Ka'bah: 21° 25' 21" N, 39° 49' 34" E (Makkah al-Mukarramah)
 * ====================================================================
 */

const ASNKiblat = (function () {
    // 1. KOORDINAT TITIK PUSAT KA'BAH MAKKAH AL-MUKARRAMAH
    const KAABA_COORDS = {
        lat: 21.422487,
        lng: 39.826206
    };

    // 2. DATABASE KOORDINAT KOTA CADANGAN (Hanya sebagai opsi manual jika GPS dimatikan)
    const CITIES = {
        demak: { name: "Kab. Demak (PPTQ Asnawiyyah)", lat: -6.9535, lng: 110.6402 },
        semarang: { name: "Kota Semarang", lat: -6.9667, lng: 110.4167 },
        kudus: { name: "Kab. Kudus", lat: -6.8048, lng: 110.8405 },
        jepara: { name: "Kab. Jepara", lat: -6.5936, lng: 110.6783 },
        surakarta: { name: "Kota Surakarta (Solo)", lat: -7.5755, lng: 110.8243 },
        surabaya: { name: "Kota Surabaya", lat: -7.2575, lng: 112.7521 },
        jakarta: { name: "DKI Jakarta", lat: -6.2088, lng: 106.8456 },
        bandung: { name: "Kota Bandung", lat: -6.9175, lng: 107.6191 },
        yogyakarta: { name: "DI Yogyakarta", lat: -7.7956, lng: 110.3695 },
        makassar: { name: "Kota Makassar", lat: -5.1477, lng: 119.4327 },
        medan: { name: "Kota Medan", lat: 3.5952, lng: 98.6722 }
    };

    // 3. STATE LOKASI PENGGUNA (MEMPRIORITASKAN SENSOR GPS / LOKASI PERANGKAT)
    let savedLat = null;
    let savedLng = null;
    let savedLocName = null;
    let savedAccuracy = null;

    try {
        savedLat = localStorage.getItem("asnawiyyah_qibla_lat");
        savedLng = localStorage.getItem("asnawiyyah_qibla_lng");
        savedLocName = localStorage.getItem("asnawiyyah_qibla_loc_name");
        savedAccuracy = localStorage.getItem("asnawiyyah_qibla_acc");
    } catch (e) {}

    let userCoords = {
        lat: savedLat ? parseFloat(savedLat) : -6.9535,
        lng: savedLng ? parseFloat(savedLng) : 110.6402,
        accuracy: savedAccuracy ? parseFloat(savedAccuracy) : null,
        locationName: savedLocName || (savedLat ? "Lokasi Perangkat Terdeteksi" : "Menghubungkan Lokasi..."),
        isGps: !!savedLat,
        sourceType: savedLat ? "saved_gps" : "detecting" // 'detecting' | 'gps' | 'saved_gps' | 'manual'
    };

    let qiblaBearing = 294.5;
    let qiblaDistance = 8335;
    let currentHeading = 0;
    let isCompassListening = false;
    let hasSensorSupport = false;
    let lastVibratedState = false;
    let isRequestingLocation = false;

    // ----------------------------------------------------------------
    // 4. FORMULA MATEMATIKA FALAK (SPHERICAL TRIGONOMETRY)
    // ----------------------------------------------------------------
    function calculateQibla(lat, lng) {
        const toRad = deg => (deg * Math.PI) / 180;
        const toDeg = rad => (rad * 180) / Math.PI;

        const phi1 = toRad(lat);
        const phi2 = toRad(KAABA_COORDS.lat);
        const deltaLambda = toRad(KAABA_COORDS.lng - lng);

        const y = Math.sin(deltaLambda);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

        let qiblaRad = Math.atan2(y, x);
        let qiblaDeg = toDeg(qiblaRad);

        // Normalisasi ke 0° - 360°
        qiblaDeg = (qiblaDeg + 360) % 360;

        // Jarak Great Circle Haversine ke Ka'bah (Radius Bumi = 6371 km)
        const R = 6371;
        const dLat = phi2 - phi1;
        const dLng = deltaLambda;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Math.round(R * c);

        return {
            bearing: Number(qiblaDeg.toFixed(1)),
            distanceKm: distanceKm
        };
    }

    // ----------------------------------------------------------------
    // 5. KONEKSI KE FITUR LOKASI PERANGKAT (HTML5 GEOLOCATION API)
    // ----------------------------------------------------------------
    function requestDeviceLocation(interactive = false) {
        if (!navigator || !navigator.geolocation) {
            updateLocationStatusUI("unsupported", "Perangkat Tidak Mendukung GPS");
            if (interactive) {
                alert("Browser atau perangkat Anda tidak memiliki fitur akses lokasi Geolocation.");
            }
            return;
        }

        if (isRequestingLocation) return;
        isRequestingLocation = true;

        updateLocationStatusUI("requesting", "Mendeteksi Lokasi Perangkat...");

        const options = {
            enableHighAccuracy: true, // Gunakan chip GPS presisi tinggi ponsel
            timeout: 15000,
            maximumAge: interactive ? 0 : 60000
        };

        navigator.geolocation.getCurrentPosition(
            position => {
                isRequestingLocation = false;
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = Math.round(position.coords.accuracy || 0);

                userCoords.lat = lat;
                userCoords.lng = lng;
                userCoords.accuracy = accuracy;
                userCoords.isGps = true;
                userCoords.sourceType = "gps";

                try {
                    localStorage.setItem("asnawiyyah_qibla_lat", lat.toString());
                    localStorage.setItem("asnawiyyah_qibla_lng", lng.toString());
                    localStorage.setItem("asnawiyyah_qibla_acc", accuracy.toString());
                } catch (e) {}

                // Sembunyikan notifikasi izin lokasi jika sempat tampil
                showPermissionNotice(false);

                // Update UI lokasi terkoneksi
                updateLocationStatusUI("connected", "Lokasi Perangkat Aktif", accuracy);
                updateQiblaFromCurrentCoords();

                // Lakukan reverse geocoding untuk mengenali wilayah secara otomatis
                reverseGeocode(lat, lng);

                if (interactive && typeof showToast === "function") {
                    showToast(`📍 Lokasi perangkat terhubung presisi (Akurasi: ±${accuracy}m)`);
                }
            },
            err => {
                isRequestingLocation = false;
                console.warn("Geolocation warning:", err.code, err.message);

                let statusMsg = "Lokasi HP Belum Aktif";
                if (err.code === 1) { // PERMISSION_DENIED
                    statusMsg = "Izin Lokasi Belum Diberikan";
                    showPermissionNotice(true);
                } else if (err.code === 2) { // POSITION_UNAVAILABLE
                    statusMsg = "Sinyal GPS Tidak Tersedia";
                } else if (err.code === 3) { // TIMEOUT
                    statusMsg = "Waktu GPS Habis, Coba Lagi";
                }

                updateLocationStatusUI("denied", statusMsg);

                // Jika ada koordinat tersimpan sebelumnya di localStorage, tetap pakai itu
                if (savedLat && savedLng) {
                    updateLocationStatusUI("saved", "Memakai Lokasi Tersimpan Terakhir");
                } else {
                    updateQiblaFromCurrentCoords();
                }

                if (interactive) {
                    alert(`Tidak dapat mengakses fitur lokasi perangkat: ${statusMsg}.\n\nTips: Pastikan tombol Lokasi/GPS di smartphone Anda sudah aktif dan berikan izin 'Saat Aplikasi Digunakan' pada browser.`);
                }
            },
            options
        );
    }

    // Reverse Geocoding Client-Side Otomatis (Mengenali Nama Kota Tanpa Hardcode)
    async function reverseGeocode(lat, lng) {
        try {
            const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 4500) : null;
            
            const fetchOptions = controller ? { signal: controller.signal } : {};
            const resp = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
                fetchOptions
            );
            if (timeoutId) clearTimeout(timeoutId);

            if (resp.ok) {
                const data = await resp.json();
                let parts = [];
                if (data.locality) parts.push(data.locality);
                if (data.city && data.city !== data.locality) parts.push(data.city);
                else if (data.principalSubdivision) parts.push(data.principalSubdivision);

                let detectedName = parts.length > 0 ? parts.join(", ") : (data.city || data.locality || "Lokasi Perangkat Presisi");
                userCoords.locationName = detectedName;

                try {
                    localStorage.setItem("asnawiyyah_qibla_loc_name", detectedName);
                } catch (e) {}

                const locLabelEl = document.getElementById("qibla-current-location");
                if (locLabelEl) locLabelEl.innerText = detectedName;

                const locBtnText = document.getElementById("qibla-loc-text");
                if (locBtnText) locBtnText.innerText = detectedName;
            }
        } catch (e) {
            // Jika offline atau jaringan lambat, tetap tampilkan teks GPS Presisi
        }
    }

    function showPermissionNotice(show) {
        const noticeEl = document.getElementById("qibla-location-permission-notice");
        if (noticeEl) {
            if (show) noticeEl.classList.remove("hidden");
            else noticeEl.classList.add("hidden");
        }
    }

    function updateLocationStatusUI(status, label, accuracy = null) {
        const btnLoc = document.getElementById("btn-qibla-device-location");
        const iconLoc = document.getElementById("qibla-loc-icon");
        const textLoc = document.getElementById("qibla-loc-text");
        const accBadge = document.getElementById("qibla-loc-acc-badge");
        const gpsBadge = document.getElementById("qibla-gps-badge");
        const accLabel = document.getElementById("qibla-accuracy-label");

        if (textLoc) textLoc.innerText = label;

        if (status === "requesting") {
            if (iconLoc) iconLoc.className = "fa-solid fa-satellite-dish fa-spin text-amber-500";
            if (btnLoc) {
                btnLoc.className = "px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95";
            }
            if (accBadge) accBadge.classList.add("hidden");
        } else if (status === "connected" || status === "saved") {
            if (iconLoc) iconLoc.className = "fa-solid fa-location-crosshairs text-emerald-600 dark:text-emerald-400";
            if (btnLoc) {
                btnLoc.className = "px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95";
            }
            if (accBadge && accuracy) {
                accBadge.innerText = `±${accuracy}m`;
                accBadge.classList.remove("hidden");
            }
            if (gpsBadge) gpsBadge.classList.remove("hidden");
            if (accLabel && accuracy) {
                accLabel.innerText = `Akurasi GPS ±${accuracy}m`;
                accLabel.className = "text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold block";
            }
        } else {
            // denied / error
            if (iconLoc) iconLoc.className = "fa-solid fa-location-dot text-rose-500";
            if (btnLoc) {
                btnLoc.className = "px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95";
            }
            if (accBadge) accBadge.classList.add("hidden");
            if (gpsBadge) gpsBadge.classList.add("hidden");
            if (accLabel) {
                accLabel.innerText = "GPS Belum Aktif";
                accLabel.className = "text-[9.5px] text-rose-500 font-semibold block";
            }
        }
    }

    // ----------------------------------------------------------------
    // 6. HANDLER SENSOR ORIENTASI KOMPAS (MOBILE GYRO/MAGNETOMETER)
    // ----------------------------------------------------------------
    function handleOrientation(event) {
        hasSensorSupport = true;
        let heading = null;

        // iOS Safari WebKit Heading
        if (typeof event.webkitCompassHeading !== "undefined") {
            heading = event.webkitCompassHeading;
        } else if (event.alpha !== null) {
            // Android Chrome / Standard DeviceOrientationAbsolute
            heading = 360 - event.alpha;
        }

        if (heading === null || isNaN(heading)) return;

        // Normalisasi heading 0 - 360
        heading = (heading + 360) % 360;
        currentHeading = heading;
        updateCompassUI(heading);
    }

    // ----------------------------------------------------------------
    // 7. UPDATE TAMPILAN KOMPAS REAL-TIME
    // ----------------------------------------------------------------
    function updateCompassUI(heading) {
        const dialEl = document.getElementById("qibla-compass-dial");
        const headingDegEl = document.getElementById("qibla-current-heading-val");
        const statusBadgeEl = document.getElementById("qibla-status-badge");
        const statusTextEl = document.getElementById("qibla-status-text");
        const glowRingEl = document.getElementById("qibla-glow-ring");

        if (headingDegEl) {
            headingDegEl.innerText = Math.round(heading) + "°";
        }

        // Putar piringan kompas berlawanan dengan arah hadap hp
        if (dialEl) {
            dialEl.style.transform = `rotate(${-heading}deg)`;
        }

        // Sudut deviasi antara arah hadap smartphone dan arah kiblat
        const diff = Math.abs((heading - qiblaBearing + 360) % 360);
        const isFacingQibla = diff <= 3 || diff >= 357;

        if (statusBadgeEl && statusTextEl) {
            if (isFacingQibla) {
                statusBadgeEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md animate-pulse";
                statusBadgeEl.innerHTML = `<i class="fa-solid fa-kaaba text-amber-300"></i> Tepat Menghadap Kiblat`;
                statusTextEl.innerText = `Posisi sejajar sempurna dengan Ka'bah (Deviasi: ${diff.toFixed(1)}°)`;
                if (glowRingEl) {
                    glowRingEl.classList.remove("opacity-0");
                    glowRingEl.classList.add("opacity-100");
                }

                // Haptic Feedback saat pertama kali pas
                if (!lastVibratedState) {
                    lastVibratedState = true;
                    if (typeof navigator !== "undefined" && navigator.vibrate) {
                        try {
                            navigator.vibrate([40, 60, 40]);
                        } catch (e) {}
                    }
                }
            } else {
                lastVibratedState = false;
                statusBadgeEl.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#1c2836] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
                
                // Beri panduan putar kanan / kiri
                let turnDirection = "";
                let turnDiff = (qiblaBearing - heading + 360) % 360;
                if (turnDiff > 180) {
                    turnDirection = `Putar ponsel ke kiri ${(360 - turnDiff).toFixed(0)}°`;
                } else {
                    turnDirection = `Putar ponsel ke kanan ${turnDiff.toFixed(0)}°`;
                }

                statusBadgeEl.innerHTML = `<i class="fa-solid fa-compass text-emerald-600"></i> ${turnDirection}`;
                statusTextEl.innerText = `Arahkan tanda panah emas ke arah Ka'bah (Target: ${qiblaBearing}°)`;
                if (glowRingEl) {
                    glowRingEl.classList.remove("opacity-100");
                    glowRingEl.classList.add("opacity-0");
                }
            }
        }
    }

    // ----------------------------------------------------------------
    // 8. MULAI & HENTIKAN PEMBACAAN SENSOR KOMPAS
    // ----------------------------------------------------------------
    function startCompassListener() {
        if (isCompassListening) return;

        const setupListener = () => {
            if ("ondeviceorientationabsolute" in window) {
                window.addEventListener("deviceorientationabsolute", handleOrientation, true);
            } else if ("ondeviceorientation" in window) {
                window.addEventListener("deviceorientation", handleOrientation, true);
            }
            isCompassListening = true;

            // Cek setelah 1.5 detik jika tidak ada event sensor (desktop / sensor mati)
            setTimeout(() => {
                const noticeEl = document.getElementById("qibla-sensor-notice");
                if (!hasSensorSupport && noticeEl) {
                    noticeEl.classList.remove("hidden");
                }
            }, 1500);
        };

        // Permintaan Izin Sensor untuk iOS 13+
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            const btnIos = document.getElementById("btn-qibla-request-sensor");
            if (btnIos) btnIos.classList.remove("hidden");
        } else {
            setupListener();
        }
    }

    function requestIosSensorPermission() {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === "granted") {
                        const btnIos = document.getElementById("btn-qibla-request-sensor");
                        if (btnIos) btnIos.classList.add("hidden");
                        window.addEventListener("deviceorientation", handleOrientation, true);
                        isCompassListening = true;
                    } else {
                        alert("Izin sensor orientasi ditolak. Kompas tidak dapat berputar otomatis.");
                    }
                })
                .catch(err => {
                    console.warn("Gagal meminta izin sensor iOS:", err);
                });
        }
    }

    function stopCompassListener() {
        if (!isCompassListening) return;
        window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
        window.removeEventListener("deviceorientation", handleOrientation, true);
        isCompassListening = false;
    }

    // ----------------------------------------------------------------
    // 9. UPDATE PERHITUNGAN KIBLAT DARI KOORDINAT AKTIF
    // ----------------------------------------------------------------
    function updateQiblaFromCurrentCoords() {
        const result = calculateQibla(userCoords.lat, userCoords.lng);
        qiblaBearing = result.bearing;
        qiblaDistance = result.distanceKm;

        // Update Elemen Info UI
        const bearingTargetEl = document.getElementById("qibla-target-deg");
        const distanceEl = document.getElementById("qibla-target-distance");
        const locLabelEl = document.getElementById("qibla-current-location");
        const coordLabelEl = document.getElementById("qibla-current-coords");
        const needleEl = document.getElementById("qibla-compass-needle");

        if (bearingTargetEl) bearingTargetEl.innerText = `${qiblaBearing}°`;
        if (distanceEl) distanceEl.innerText = `${qiblaDistance.toLocaleString("id-ID")} km`;
        if (locLabelEl) locLabelEl.innerText = userCoords.locationName;
        if (coordLabelEl) {
            const latStr = Math.abs(userCoords.lat).toFixed(4) + (userCoords.lat >= 0 ? "° LU" : "° LS");
            const lngStr = Math.abs(userCoords.lng).toFixed(4) + (userCoords.lng >= 0 ? "° BT" : "° BB");
            coordLabelEl.innerText = `${latStr}, ${lngStr}`;
        }

        // Atur posisi jarum Ka'bah pada piringan kompas
        if (needleEl) {
            needleEl.style.transform = `rotate(${qiblaBearing}deg)`;
        }

        // Terapkan ke kompas static jika heading belum didapat
        if (!isCompassListening || currentHeading === 0) {
            updateCompassUI(0);
        }
    }

    // Opsi Manual: Pengguna sengaja memilih kota lain secara manual
    function changeCity(cityKey) {
        if (!cityKey) return;
        if (!CITIES[cityKey]) return;

        userCoords = {
            lat: CITIES[cityKey].lat,
            lng: CITIES[cityKey].lng,
            accuracy: null,
            locationName: CITIES[cityKey].name,
            isGps: false,
            sourceType: "manual"
        };

        updateLocationStatusUI("manual", CITIES[cityKey].name);
        showPermissionNotice(false);
        updateQiblaFromCurrentCoords();
    }

    // ----------------------------------------------------------------
    // 10. INISIALISASI HALAMAN KOMPAS KIBLAT
    // ----------------------------------------------------------------
    function init() {
        // Render dropdown kota manual jika belum terisi
        const selectEl = document.getElementById("qibla-city-select");
        if (selectEl && selectEl.options.length <= 1) {
            selectEl.innerHTML = `<option value="">-- Pilih Kota Manual --</option>`;
            Object.keys(CITIES).forEach(key => {
                const opt = document.createElement("option");
                opt.value = key;
                opt.innerText = CITIES[key].name;
                selectEl.appendChild(opt);
            });
        }

        // Update tampilan dari koordinat yang saat ini tersimpan di memory
        updateQiblaFromCurrentCoords();
        startCompassListener();

        // OTOMATIS HUBUNGKAN KE FITUR LOKASI PERANGKAT PRESISI (GPS)
        requestDeviceLocation(false);
    }

    return {
        init: init,
        calculateQibla: calculateQibla,
        changeCity: changeCity,
        requestDeviceLocation: requestDeviceLocation,
        useGpsLocation: () => requestDeviceLocation(true), // Alias kompatibilitas
        requestIosSensorPermission: requestIosSensorPermission,
        startCompassListener: startCompassListener,
        stopCompassListener: stopCompassListener,
        getCities: () => CITIES,
        getUserCoords: () => userCoords
    };
})();

// Helper navigasi pembuka tab dari menu Ibadah
function openKompasKiblatPage() {
    if (typeof switchTab === "function") {
        switchTab("kompas-kiblat");
    }
    if (typeof ASNKiblat !== "undefined") {
        ASNKiblat.init();
    }
}

// Global Window Exports
window.ASNKiblat = ASNKiblat;
window.openKompasKiblatPage = openKompasKiblatPage;
