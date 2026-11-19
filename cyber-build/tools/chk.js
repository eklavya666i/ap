const fs=require('fs'),D='/home/claude/apcyber/data/';const u=process.argv[2];
const U=JSON.parse(fs.readFileSync(D+`u${u}.json`)),X=JSON.parse(fs.readFileSync(D+`x${u}.json`));
let E={};for(const f of fs.readdirSync('expl').filter(f=>f.startsWith('u'+u)))Object.assign(E,JSON.parse(fs.readFileSync('expl/'+f)));
let ok=0,miss=[],bad=[];for(const t of U.topics)for(const i of t.items.concat(X.topics[t.id]||[])){const e=E[i.id];if(!e){miss.push(i.id);continue}
 const c=e.c||[i.opts[i.a],...i.opts.filter((_,k)=>k!==i.a)];if(c.length!==4||new Set(c).size!==4||!e.r||e.r.length!==4||!/^Correct/.test(e.r[0])||e.r.slice(1).some(x=>!/^Wrong/.test(x)))bad.push(i.id);else ok++}
console.log('unit',u,'ok',ok,'missing',miss.length,miss.slice(0,40).join(','),'bad',bad.join(','));
