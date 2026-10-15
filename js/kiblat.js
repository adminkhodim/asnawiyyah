/**
 * ====================================================================
 * ASNAWIYYAH KOMPAS KIBLAT ENGINE (v1.0)
 * Perhitungan Hisab Arah Kiblat Berdasarkan Falakiyah Geodesi Bola
 * Koordinat Ka'bah: 21° 25' 21" N, 39° 49' 34" E (Makkah al-Mukarramah)
 * ====================================================================
 */

const ASNKiblat = (function () {
    // 1. KOORDINAT KA'BAH MAKKAH AL-MUKARRAMAH
    const KAABA_COORDS = {
        lat: 21.422487,
        lng: 39.826206
    };

    // 2. DATABASE KOORDINAT DEFAULT KOTA
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

    // State Internal
    let currentCityKey = localStorage.getItem("asnawiyyah_prayer_city") || "demak";
    if (!CITIES[currentCityKey]) currentCityKey = "demak";

    let userCoords = {
        lat: CITIES[currentCityKey].lat,
        lng: CITIES[currentCityKey].lng,
        locationName: CITIES[currentCityKey].name,
        isGps: false
    };

    let qiblaBearing = 294.5;
    let qiblaDistance = 8342;
    let currentHeading = 0;
    let isCompassListening = false;
    let hasSensorSupport = false;
    let lastVibratedState = false;

    // ----------------------------------------------------------------
    // 3. FORMULA MATEMATIKA FALAK (SPHERICAL TRIGONOMETRY)
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

        // Jarak Haversine ke Ka'bah (Radius Bumi = 6371 km)
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
    // 4. HANDLER SENSOR ORIENTASI KOMPAS (MOBILE GYRO/MAGNETOMETER)
    // ----------------------------------------------------------------
    function handleOrientation(event) {
        hasSensorSupport = true;
        let heading = null;

        // iOS Safari WebKit Heading
        if (typeof event.webkitCompassHeading !== "undefined") {
            heading = event.webkitCompassHeading;
        } else if (event.alpha !== null) {
            // Android Chrome / Standard DeviceOrientationAbsolute
            if (event.absolute === true || typeof event.absolute === "undefined") {
                heading = 360 - event.alpha;
            } else {
                heading = 360 - event.alpha;
            }
        }

        if (heading === null || isNaN(heading)) return;

        // Normalisasi heading 0 - 360
        heading = (heading + 360) % 360;
        currentHeading = heading;
        updateCompassUI(heading);
    }

    // ----------------------------------------------------------------
    // 5. UPDATE TAMPILAN KOMPAS REAL-TIME
    // ----------------------------------------------------------------
    function updateCompassUI(heading) {
        const dialEl = document.getElementById("qibla-compass-dial");
        const needleEl = document.getElementById("qibla-compass-needle");
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
    // 6. MULAI & HENTIKAN PEMBACAAN SENSOR KOMPAS
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
    // 7. PENANGANAN KOORDINAT & GPS LOKAL
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
            const latStr = Math.abs(userCoords.lat).toFixed(4) + (userCoords.lat >= 0 ? "° N" : "° S");
            const lngStr = Math.abs(userCoords.lng).toFixed(4) + (userCoords.lng >= 0 ? "° E" : "° W");
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

    function changeCity(cityKey) {
        if (!CITIES[cityKey]) return;
        currentCityKey = cityKey;
        try {
            localStorage.setItem("asnawiyyah_prayer_city", cityKey);
        } catch (e) {}

        userCoords = {
            lat: CITIES[cityKey].lat,
            lng: CITIES[cityKey].lng,
            locationName: CITIES[cityKey].name,
            isGps: false
        };

        const gpsBadge = document.getElementById("qibla-gps-badge");
        if (gpsBadge) gpsBadge.classList.add("hidden");

        updateQiblaFromCurrentCoords();
    }

    function useGpsLocation() {
        if (!navigator.geolocation) {
            alert("Perangkat Anda tidak mendukung fitur lokasi GPS.");
            return;
        }

        const btnGps = document.getElementById("btn-qibla-use-gps");
        if (btnGps) {
            btnGps.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mendeteksi GPS...`;
            btnGps.disabled = true;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                if (btnGps) {
                    btnGps.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Gunakan GPS`;
                    btnGps.disabled = false;
                }

                userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    locationName: "Lokasi GPS Realtime",
                    isGps: true
                };

                const gpsBadge = document.getElementById("qibla-gps-badge");
                if (gpsBadge) gpsBadge.classList.remove("hidden");

                updateQiblaFromCurrentCoords();
                if (typeof showToast === "function") {
                    showToast("✅ Koordinat GPS berhasil disesuaikan secara akurat!");
                }
            },
            err => {
                if (btnGps) {
                    btnGps.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Gunakan GPS`;
                    btnGps.disabled = false;
                }
                alert("Gagal mengakses lokasi GPS: " + (err.message || "Izin ditolak"));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    // ----------------------------------------------------------------
    // 8. INISIALISASI HALAMAN KOMPAS KIBLAT
    // ----------------------------------------------------------------
    function init() {
        // Render dropdown kota
        const selectEl = document.getElementById("qibla-city-select");
        if (selectEl && selectEl.options.length <= 1) {
            selectEl.innerHTML = "";
            Object.keys(CITIES).forEach(key => {
                const opt = document.createElement("option");
                opt.value = key;
                opt.innerText = CITIES[key].name;
                if (key === currentCityKey) opt.selected = true;
                selectEl.appendChild(opt);
            });
        }

        updateQiblaFromCurrentCoords();
        startCompassListener();
    }

    return {
        init: init,
        calculateQibla: calculateQibla,
        changeCity: changeCity,
        useGpsLocation: useGpsLocation,
        requestIosSensorPermission: requestIosSensorPermission,
        startCompassListener: startCompassListener,
        stopCompassListener: stopCompassListener,
        getCities: () => CITIES
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
