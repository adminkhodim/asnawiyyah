const fs = require('fs');
const assert = require('assert');

// 1. Verify data-manaqib.js
const dataManaqib = require('../data-manaqib.js');
assert.strictEqual(Array.isArray(dataManaqib), true, 'dataManaqib must be an array');
assert.strictEqual(dataManaqib.length, 9, 'dataManaqib must have 9 chapters');

dataManaqib.forEach((bab, idx) => {
    assert.ok(bab.id, `Bab ${idx+1} must have id`);
    assert.ok(bab.title, `Bab ${idx+1} must have title`);
    assert.ok(bab.arabicTitle, `Bab ${idx+1} must have arabicTitle`);
    assert.ok(Array.isArray(bab.paragraphs), `Bab ${idx+1} paragraphs must be array`);
    assert.ok(bab.paragraphs.length > 0, `Bab ${idx+1} must have at least 1 paragraph`);
    
    // Ensure all paragraphs contain Arabic characters
    bab.paragraphs.forEach((p, pIdx) => {
        assert.ok(/[\u0600-\u06FF]/.test(p), `Bab ${idx+1} para ${pIdx+1} must contain Arabic text`);
    });
});
console.log('✅ 1. data-manaqib.js verified: 9 chapters with Arabic text.');

// 2. Verify index.html
const html = fs.readFileSync('index.html', 'utf8');
assert.ok(html.includes('id="page-manaqib"'), 'index.html must contain #page-manaqib');
assert.ok(html.includes('openManaqibPage()'), 'index.html must call openManaqibPage()');
assert.ok(html.includes('data-manaqib.js'), 'index.html must load data-manaqib.js');
assert.ok(html.includes('js/manaqib.js'), 'index.html must load js/manaqib.js');
assert.ok(!html.includes('openWiridCategoryModal(\'manaqib\')'), 'Manaqib card must NOT use openWiridCategoryModal');
console.log('✅ 2. index.html verified: Dedicated page container and card click handler.');

// 3. Verify js/main.js
const mainJs = fs.readFileSync('js/main.js', 'utf8');
assert.ok(mainJs.includes("tabId === 'manaqib'"), 'main.js switchTab must support tabId === manaqib');
assert.ok(mainJs.includes('/layanan/portal-ibadah/wirid/manaqib'), 'main.js must route /layanan/portal-ibadah/wirid/manaqib');
console.log('✅ 3. js/main.js verified: Routing and tab switching registered.');

// 4. Verify js/ibadah.js
const ibadahJs = fs.readFileSync('js/ibadah.js', 'utf8');
assert.ok(ibadahJs.includes("if (catKey === 'manaqib')"), 'ibadah.js openWiridCategoryModal must redirect manaqib');
console.log('✅ 4. js/ibadah.js verified: Modal redirection guard in place.');

console.log('🎉 ALL MANAQIB VERIFICATION TESTS PASSED!');
