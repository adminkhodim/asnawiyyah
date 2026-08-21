const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const regex = /<section[^>]*id="([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[1]);
}
