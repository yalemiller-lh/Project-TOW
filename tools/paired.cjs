// Paired comparison of two self-play result files (same seeds): node paired.cjs base.json other.json
const fs=require('fs');const [a,b]=process.argv.slice(2).map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
const m=new Map(a.rows.map(r=>[r[0],r[2]-r[1]]));const d=b.rows.filter(r=>m.has(r[0])).map(r=>(r[2]-r[1])-m.get(r[0]));
const mean=d.reduce((x,y)=>x+y,0)/d.length,sd=Math.sqrt(d.reduce((x,y)=>x+(y-mean)**2,0)/(d.length-1));
console.log(JSON.stringify({pairs:d.length,meanGain:+mean.toFixed(1),se:+(sd/Math.sqrt(d.length)).toFixed(1),better:d.filter(x=>x>0).length,worse:d.filter(x=>x<0).length}));
