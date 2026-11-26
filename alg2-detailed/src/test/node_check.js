const fs=require('fs'),vm=require('vm');
const ctx={console,Math,Number,String,Array,Set,Object,JSON,isFinite,Error};vm.createContext(ctx);
for(const f of ['10-expr.js','20-templates.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','js',f),'utf8'),ctx);
vm.runInContext(`
function gradeItem(it,r){
  if(it.k==='er'){const a=gradeExpr(r.e,it.ans.e,it.traps);if(!a.ok)return a;return gradeRestr(r.v,it);}
  if(it.k==='e')return gradeExpr(r.e,it.ans.e,it.traps);
  if(it.k==='f')return gradeExpr(r.e,it.ans.e,it.traps,{factor:1});
  if(it.k==='v')return gradeVals(r.v,it);
  if(it.k==='s')return gradeSol(r.v,it);
  if(it.k==='p')return gradePairs(r.v,it);
  if(it.k==='n')return gradeNum(r.v,it);
}
function canon(it){
  if(it.k==='er')return{e:it.ans.e,v:it.rz.length?it.rz.join(','):'∅'};
  if(it.k==='e'||it.k==='f')return{e:it.ans.e};
  if(it.k==='v'||it.k==='s')return{v:it.ans.v.length?it.ans.v.join(','):'∅'};
  if(it.k==='p')return{v:it.ans.p.length?it.ans.p.map(p=>'('+p[0]+','+p[1]+')').join(''):'∅'};
  if(it.k==='n')return{v:String(it.ans.n)};
}
function trapResp(it,t){
  if(it.k==='er')return{e:t.e,v:(t.v||it.rz).length?(t.v||it.rz).join(','):'∅'};
  if(it.k==='e'||it.k==='f')return{e:t.e};
  if(it.k==='v'||it.k==='s')return{v:t.v.length?t.v.join(','):'∅'};
  if(it.k==='p')return{v:t.p.length?t.p.map(p=>'('+p[0]+','+p[1]+')').join(''):'∅'};
  if(it.k==='n')return{v:String(t.n)};
}
var OUT=[],BAD=[];
for(const T of TPLS){for(let seed=1;seed<=80;seed++){let it;try{it=T.make(rng(seed*7919+T.id.length));}catch(e){BAD.push([T.id,seed,'make',String(e)]);continue;}
  it.id=T.id;it.seed=seed;it.s=T.s;
  const g=gradeItem(it,canon(it));if(!g||!g.ok)BAD.push([T.id,seed,'canon rejected',JSON.stringify(g),JSON.stringify(canon(it))]);
  if(!it.traps||it.traps.length<3)BAD.push([T.id,seed,'traps<3']);
  (it.traps||[]).forEach((t,i)=>{const r=trapResp(it,t);const gg=gradeItem(it,r);if(gg&&gg.ok)BAD.push([T.id,seed,'trap '+i+' accepted',JSON.stringify(r)]);});
  if(!it.h||it.h.length<2||!it.x||!it.x.length)BAD.push([T.id,seed,'hints/steps']);
  OUT.push(it);}}
globalThis.R_={TPLS,OUT,BAD,DRILLS,drillQ};
`,ctx);
const X=ctx.R_;
fs.writeFileSync(require('path').join(__dirname,'items.json'),JSON.stringify(X.OUT));
console.log('templates:',X.TPLS.length,'items:',X.OUT.length,'problems:',X.BAD.length);
const by={};X.BAD.forEach(b=>{by[b[0]+' '+b[2]]=(by[b[0]+' '+b[2]]||0)+1});
console.log(by);X.BAD.slice(0,12).forEach(b=>console.log(JSON.stringify(b).slice(0,300)));
// drills
let dbad=0;for(const d of X.DRILLS){for(let k=0;k<200;k++){const q=X.drillQ(d);if(!q||q.c.length!==4)dbad++;}}
console.log('drills:',X.DRILLS.length,'drill failures:',dbad);
