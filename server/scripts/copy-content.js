// Copies the JSON config files into the build output so `node dist/index.js`
// can require them in production (tsc does not copy .json files by itself).
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'content');
const dest = path.join(__dirname, '..', 'dist', 'content');

fs.mkdirSync(dest, { recursive: true });
let n = 0;
for (const file of fs.readdirSync(src)) {
  if (file.endsWith('.json')) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    n++;
  }
}
console.log(`📦 ${n} fichiers de config copiés vers dist/content`);
