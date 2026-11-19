// print items of a unit: id | stem | correct | wrong options (in original order)
const fs=require('fs'),u=process.argv[2],t=process.argv[3];const D='/home/claude/apcyber/data/';
const U=JSON.parse(fs.readFileSync(D+`u${u}.json`)),X=JSON.parse(fs.readFileSync(D+`x${u}.json`));
for(const tp of U.topics){if(t&&tp.id!==t)continue;for(const i of tp.items.concat(X.topics[tp.id]||[])){const w=i.opts.map((o,k)=>k===i.a?null:o).filter(x=>x!==null);
console.log(`${i.id} | ${i.stem} | OK: ${i.opts[i.a]} | W: ${w.map((x,k)=>`(${k+1}) ${x}`).join(' ')}`)}}
