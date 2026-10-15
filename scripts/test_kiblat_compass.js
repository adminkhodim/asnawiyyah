/**
 * Test Suite: Kompas Kiblat & Falak Geodesi Ka'bah Verification
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("▶️  RUNNING: Kompas Kiblat & Falak Geodesi Verification...");

// Load source code
const kiblatSource = fs.readFileSync(path.join(__dirname, '../js/kiblat.js'), 'utf8');

// Mock browser environment for node testing
const windowMock = {};
const documentMock = {
    getElementById: () => null,
    addEventListener: () => {}
};
const localStorageMock = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); }
};

// Evaluate in sandbox
const sandbox = {
    window: windowMock,
    document: documentMock,
    localStorage: localStorageMock,
    navigator: { vibrate: () => true },
    console: console,
    Math: Math
};

const fn = new Function('window', 'document', 'localStorage', 'navigator', 'console', kiblatSource);
fn(windowMock, documentMock, localStorageMock, sandbox.navigator, console);

const ASNKiblat = windowMock.ASNKiblat;
assert.ok(ASNKiblat, "ASNKiblat should be exported to window");

// 1. Uji Hisab Arah Kiblat Demak (PPTQ Asnawiyyah)
// Koordinat Demak: Lat -6.9535, Lng 110.6402
const qiblaDemak = ASNKiblat.calculateQibla(-6.9535, 110.6402);
console.log(`  - Arah Kiblat Demak: ${qiblaDemak.bearing}° | Jarak: ${qiblaDemak.distanceKm} km`);
assert.ok(qiblaDemak.bearing >= 294.0 && qiblaDemak.bearing <= 295.5, `Arah kiblat Demak harus ~294.5°, got: ${qiblaDemak.bearing}`);
assert.ok(qiblaDemak.distanceKm >= 8200 && qiblaDemak.distanceKm <= 8500, `Jarak ke Ka'bah harus ~8340 km, got: ${qiblaDemak.distanceKm}`);

// 2. Uji Hisab Arah Kiblat Jakarta
// Koordinat Jakarta: Lat -6.2088, Lng 106.8456
const qiblaJakarta = ASNKiblat.calculateQibla(-6.2088, 106.8456);
console.log(`  - Arah Kiblat Jakarta: ${qiblaJakarta.bearing}° | Jarak: ${qiblaJakarta.distanceKm} km`);
assert.ok(qiblaJakarta.bearing >= 295.0 && qiblaJakarta.bearing <= 296.0, `Arah kiblat Jakarta harus ~295.2°, got: ${qiblaJakarta.bearing}`);

// 3. Uji Hisab Arah Kiblat Surabaya
// Koordinat Surabaya: Lat -7.2575, Lng 112.7521
const qiblaSurabaya = ASNKiblat.calculateQibla(-7.2575, 112.7521);
console.log(`  - Arah Kiblat Surabaya: ${qiblaSurabaya.bearing}° | Jarak: ${qiblaSurabaya.distanceKm} km`);
assert.ok(qiblaSurabaya.bearing >= 293.5 && qiblaSurabaya.bearing <= 294.8, `Arah kiblat Surabaya harus ~294.0°, got: ${qiblaSurabaya.bearing}`);

// 4. Uji Verifikasi Database Kota
const cities = ASNKiblat.getCities();
assert.ok(cities.demak, "Kota Demak harus terdaftar");
assert.ok(cities.semarang, "Kota Semarang harus terdaftar");
assert.ok(cities.jakarta, "Kota Jakarta harus terdaftar");

// 5. Uji Integrasi Fitur Lokasi Perangkat (Geolocation API)
let mockGpsCalled = false;
sandbox.navigator.geolocation = {
    getCurrentPosition: (success, error, options) => {
        mockGpsCalled = true;
        success({
            coords: {
                latitude: -6.9541,
                longitude: 110.6408,
                accuracy: 6
            }
        });
    }
};

ASNKiblat.requestDeviceLocation(false);
assert.ok(mockGpsCalled, "Geolocation.getCurrentPosition harus dipanggil saat requestDeviceLocation()");

const userCoords = ASNKiblat.getUserCoords();
assert.strictEqual(userCoords.lat, -6.9541, "Latitude pengguna harus terupdate dari GPS");
assert.strictEqual(userCoords.lng, 110.6408, "Longitude pengguna harus terupdate dari GPS");
assert.strictEqual(userCoords.accuracy, 6, "Akurasi GPS pengguna harus terupdate (6m)");
assert.strictEqual(userCoords.isGps, true, "isGps harus true saat koordinat didapat dari perangkat");

console.log("  - Simulasi GPS Presisi: Lat -6.9541, Lng 110.6408 (Akurasi ±6m) -> Sukses!");
console.log("✅ [PASS] Kompas Kiblat & Falak Geodesi Verification (Passed)");

