const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e3f9e38b-8db7-4773-9ca8-1bcb0af1fcc9\\.system_generated\\steps\\1426\\content.md', 'utf8');

// Find the verse object which contains the chapter list
const startIndex = content.indexOf('{"verse":{"id"');
if(startIndex !== -1) {
    let braceCount = 0;
    let endIndex = startIndex;
    for(let i = startIndex; i < content.length; i++) {
        if(content[i] === '{') braceCount++;
        else if(content[i] === '}') braceCount--;
        
        if(braceCount === 0 && content[i] === '}') {
            endIndex = i + 1;
            break;
        }
    }
    
    let jsonStr = content.substring(startIndex, endIndex);
    // Unescape next.js string escaping
    jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    
    fs.writeFileSync('C:\\Users\\pc\\Documents\\APP\\asnawiyyah\\dibai.json', jsonStr);
    console.log('Extracted successfully');
} else {
    console.log('Could not find json start');
}
