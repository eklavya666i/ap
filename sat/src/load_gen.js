// Evaluates the generator files together (as the browser does) and returns RW_GEN.
const vm = require("vm"), fs = require("fs");
module.exports = function () {
  const ctx = {}; vm.createContext(ctx);
  const src = ["gen_a.js", "gen_b.js", "gen_c.js", "gen_d.js", "gen_x.js"].map(f => fs.readFileSync(__dirname + "/" + f, "utf8")).join("\n")
    .replace(/^if \(typeof module.*$/m, "") + "\n;this.RW_GEN = RW_GEN;";
  vm.runInContext(src, ctx);
  return ctx.RW_GEN;
};
