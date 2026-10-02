// Usage: node edit.cjs txt-edits.cjs  with EDITS=<file.txt>. The text file holds blocks:
// @@@ FILE <path>   (applies to the following edits)
// @@@ EDIT <exact text> @@@ TO <replacement> @@@ END
const fs = require('fs'), path = require('path');
const text = fs.readFileSync(path.resolve(__dirname, process.env.EDITS), 'utf8').replace(/\r\n/g, '\n');
const edits = [];
let file = null;
for (const part of text.split(/\n(?=@@@ (?:FILE|EDIT)\b)/)) {
  if (part.startsWith('@@@ FILE ')) { file = part.slice(9).split('\n')[0].trim(); continue; }
  if (!part.startsWith('@@@ EDIT\n')) continue;
  const body = part.slice('@@@ EDIT\n'.length), cut = body.indexOf('\n@@@ TO\n');
  const from = body.slice(0, cut), rest = body.slice(cut + '\n@@@ TO\n'.length);
  // An empty replacement has "@@@ END" straight after "@@@ TO".
  const to = rest.startsWith('@@@ END') ? '' : rest.slice(0, rest.indexOf('\n@@@ END'));
  if (cut < 0 || (!rest.startsWith('@@@ END') && rest.indexOf('\n@@@ END') < 0)) throw Error('Malformed edit block: ' + body.slice(0, 60));
  if (!file) throw Error('An edit comes before any @@@ FILE line.');
  edits.push([file, from, to]);
}
module.exports = edits;
