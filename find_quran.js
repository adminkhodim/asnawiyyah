const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="page-quran-index"')) {
    console.log('page-quran-index start:', i + 1);
  }
  if (lines[i].includes('id="page-quran-detail"')) {
    console.log('page-quran-detail start:', i + 1);
  }
}
