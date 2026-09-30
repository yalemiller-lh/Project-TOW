import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Every G./P./AI./F./A./BM. name a module uses must be exported by the module it refers to, so
// the page cannot call a function that does not exist (tests never load app.mjs itself).
const MODULES={F:'formats.mjs',A:'armies.mjs',G:'game.mjs',BM:'battlemarch.mjs',P:'presentation.mjs',AI:'ai.mjs'};
const exports={};for(const [alias,file]of Object.entries(MODULES))exports[alias]=new Set(Object.keys(await import('./dist/'+file)));
const missing=[];
for(const file of [...Object.values(MODULES),'app.mjs']){
 const source=readFileSync(new URL('./dist/'+file,import.meta.url),'utf8');
 for(const [alias,names]of Object.entries(exports))for(const m of source.matchAll(new RegExp(`(?<![\\w.$])${alias}\\.(\\w+)`,'g')))if(!names.has(m[1]))missing.push(`${file}: ${alias}.${m[1]}`);
}
assert.deepEqual([...new Set(missing)],[],'references to names the modules do not export');
console.log('PASS every module reference in the page exists');
