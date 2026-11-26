const fs=require('fs'),vm=require('vm');
const ctx={console,Math,Number,String,Array,Set,Object,JSON,isFinite,Error};vm.createContext(ctx);
for(const f of ['10-expr.js','20-templates.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','js',f),'utf8'),ctx);
ctx.QS=JSON.parse(fs.readFileSync(require('path').join(__dirname,'bank_typed.json'),'utf8'));
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
var BAD=[],N=0,TR=0;
for(const q of QS){ if(!q.ta) continue; const it=Object.assign({},q.ta); N++;
  const canon = it.k==='er'?{e:it.ans.e,v:it.rz.length?it.rz.join(','):'∅'}: (it.k==='e'||it.k==='f')?{e:it.ans.e}: (it.k==='v'||it.k==='s')?{v:it.ans.v.length?it.ans.v.join(','):'∅'}: it.k==='p'?{v:it.ans.p.length?it.ans.p.map(p=>'('+p[0]+','+p[1]+')').join(''):'∅'}:{v:it.ans.n};
  const g=gradeItem(it,canon); if(!g.ok) BAD.push([q.id,'canon rejected',JSON.stringify(g).slice(0,160),JSON.stringify(canon)]);
  (it.traps||[]).forEach((t,i)=>{ if(t.eqv && it.k!=='f') return; let r;
    if(it.k==='er') r={e:t.e,v:(t.v||it.rz).length?(t.v||it.rz).join(','):'∅'}; else if(it.k==='e'||it.k==='f') r={e:t.e}; else if(it.k==='v'||it.k==='s') r={v:t.v.length?t.v.join(','):'∅'}; else if(it.k==='p') r={v:t.p.length?t.p.map(p=>'('+p[0]+','+p[1]+')').join(''):'∅'}; else r={v:String(t.n)};
    TR++; const gg=gradeItem(it,r); if(gg.ok) BAD.push([q.id,'trap '+i+' accepted',JSON.stringify(r)]); });
}
globalThis.R_={BAD,N,TR};
`,ctx);
const X=ctx.R_; console.log('bank typed items:',X.N,'traps tried:',X.TR,'problems:',X.BAD.length); X.BAD.slice(0,15).forEach(b=>console.log(JSON.stringify(b)));
