// Usage: node edit.cjs <spec.cjs>
// The spec exports [[file, from, to], ...]. Each `from` must occur exactly once.
// Line endings are matched and written as CRLF, the convention of Project-TOW.
const fs = require('fs');
const path = require('path');
const root = 'C:/Users/MillYa/Desktop/Project-TOW';
const crlf = s => s.replace(/\r?\n/g, '\r\n');
const edits = require(path.resolve(process.argv[2]));
const files = new Map();
for (const [file, from, to] of edits) {
  const full = path.join(root, file);
  const text = files.get(full) ?? crlf(fs.readFileSync(full, 'utf8'));
  const needle = crlf(from);
  const count = text.split(needle).length - 1;
  if (count !== 1) throw Error(`${file}: expected 1 match, found ${count} for ${JSON.stringify(from.slice(0, 80))}`);
  files.set(full, text.replace(needle, () => crlf(to)));
}
for (const [full, text] of files) fs.writeFileSync(full, text);
console.log(`Applied ${edits.length} edit(s) to ${files.size} file(s).`);
