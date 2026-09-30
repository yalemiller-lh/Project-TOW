import {readFileSync,writeFileSync} from 'node:fs';
// Bundles dist/ into Play.html, a standalone offline game. Modules are listed in dependency
// order; each becomes `const Alias=(()=>{...; return {exports};})();` and every module must import
// the others as `import * as Alias from './file.mjs';` using the aliases below.
const MODULES=[['F','formats.mjs'],['A','armies.mjs'],['G','game.mjs'],['BM','battlemarch.mjs'],['P','presentation.mjs'],['AI','ai.mjs']];
const read=file=>readFileSync(new URL('./dist/'+file,import.meta.url),'utf8');
const aliasOf=Object.fromEntries(MODULES.map(([alias,file])=>[file,alias]));
function stripImports(source,file){
 return source.replace(/import \* as (\w+) from '\.\/([\w.-]+)';\s*/g,(_,alias,dep)=>{
  if(aliasOf[dep]!==alias)throw Error(`${file} imports ${dep} as ${alias}; the bundle expects ${aliasOf[dep]??'no such module'}.`);
  return '';
 });
}
// Export names come from Node's own module loader, so every exported binding reaches the page
// (including several declared in one `export const a=…,b=…` statement).
const bundle=(await Promise.all(MODULES.map(async([alias,file])=>{
 const source=stripImports(read(file),file),names=Object.keys(await import(new URL('./dist/'+file,import.meta.url)));
 if(/export (?!const |function )/.test(source))throw Error(`${file}: only "export const" and "export function" are supported by the bundler.`);
 return `const ${alias}=(()=>{${source.replace(/export (?=const|function)/g,'')}\nreturn {${names.join(',')}};})();`;
}))).join('\n');
const app=bundle+'\n'+stripImports(read('app.mjs'),'app.mjs');
const html=read('index.html'),css=read('style.css').replace(/^@import[^;]+;\s*/,'');
writeFileSync(new URL('./Play.html',import.meta.url),html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="app.mjs"></script>',()=>`<script>\n${app}\n</script>`));
console.log('Created Play.html, a standalone offline game.');
