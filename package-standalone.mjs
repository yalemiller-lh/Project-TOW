import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync(new URL('./dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./dist/style.css',import.meta.url),'utf8').replace(/^@import[^;]+;\s*/, '');
const game=readFileSync(new URL('./dist/game.mjs',import.meta.url),'utf8');
const names=[...game.matchAll(/export (?:const|function) (\w+)/g)].map(m=>m[1]);
const bundledGame=`const G=(()=>{${game.replace(/export /g,'')}\nreturn {${names.join(',')}};})();`;
const app=readFileSync(new URL('./dist/app.mjs',import.meta.url),'utf8').replace("import * as G from './game.mjs';",bundledGame);
writeFileSync(new URL('./Play.html',import.meta.url),html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="app.mjs"></script>',()=>`<script>\n${app}\n</script>`));
console.log('Created Play.html, a standalone offline game.');
