// Simulates daily 16-question sets with the app's selection rules to measure how long new questions last.
const RW = require("./rw_bank.js").concat(require("./rw_bank2.js"), require("./load_gen.js")());
const MATH = require("./math_gen.js");
const ORDER = ["CS","II","SEC","EOI","ALG","ADV","PSD","GEO"], RWD = ["CS","II","SEC","EOI"], PER = 2;
function run(acc, days, seed) {
  let r = seed; const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const S = { seen: {}, ms: {}, due: {} }, firstRepeat = {}, skillMix = {};
  for (let T = 1; T <= days; T++) {
    for (const d of ORDER) {
      if (RWD.includes(d)) {
        const pool = RW.filter(x => x.d === d), dueOf = x => S.due["r:" + x.id], got = [];
        const due = pool.filter(x => dueOf(x) && dueOf(x) <= T).sort((a, b) => dueOf(a) - dueOf(b));
        const fresh = pool.filter(x => S.seen[x.id] == null), old = pool.filter(x => S.seen[x.id] != null).sort((a, b) => S.seen[a.id] - S.seen[b.id]);
        for (let n = 0; n < PER; n++) {
          const used = new Set(got.map(g => g.it.id)), skills = new Set(got.map(g => g.it.s));
          const free = a => a.filter(x => !used.has(x.id)), pref = a => a.find(x => !skills.has(x.s)) || a[0];
          let it = free(due)[0], kind = it ? "retry" : "";
          if (!it) { it = pref(free(fresh)); kind = it ? "new" : ""; }
          if (!it) { it = pref(free(old)); kind = "repeat"; if (!firstRepeat[d]) firstRepeat[d] = T; }
          got.push({ it, kind });
        }
        for (const g of got) {
          const ok = rand() < acc; S.seen[g.it.id] = T; skillMix[d + ":" + g.it.s] = (skillMix[d + ":" + g.it.s] || 0) + (T <= 90 ? 1 : 0);
          if (ok) delete S.due["r:" + g.it.id]; else S.due["r:" + g.it.id] = T + 3;
        }
      } else {
        const keys = MATH.DOM[d];
        const lru = keys.slice().sort((a, b) => (S.ms[a] ?? -1) - (S.ms[b] ?? -1));
        for (const k of lru.slice(0, PER)) S.ms[k] = T;
      }
    }
  }
  return { firstRepeat, skillMix };
}
for (const acc of [0.6, 0.75, 0.9]) {
  const { firstRepeat } = run(acc, 200, 12345);
  console.log(`accuracy ${acc}: first day a Reading & Writing area has to repeat an old question →`, JSON.stringify(firstRepeat));
}
console.log("skill mix over 90 days at 75%:", JSON.stringify(run(0.75, 90, 7).skillMix));
