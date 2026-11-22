// Unit 1 — Ratios & Rates: lesson scripts, templates and models. Built in Phase 1.
// Each unit file registers only itself, so branches building different units never edit the same file.
//
// A lesson:   {prereq, vocab: [[word, meaning]], misconceptions: {CODE: message}, script: [step], alt: [step],
//              notes: {idea, examples, watch}, templates: [template]}
// A step:     {part: hook | idea | see | ido | wedo | watch | recap, say, board?, why?, check?: {item, miss}}
// A template: {id, type, tag: CONCEPT | PROCEDURE | APPLICATION, diff: 1-3, est: seconds, word?, make(R) → item,
//              verify(item) → true when the answer checks out a second way}
// Text is in screen notation (2:3, 3/4, $4.25, 30%); the voice reads it through M6.speak().
// Stems are HTML (use M6.fr for a stacked fraction); hints, solutions and choices are plain text.
{
const {ri, pick, shuffle, gcd, lcm, Q, fn, money} = M6;
const U1 = M6U[1] = {lessons: {},
  // Unit 5-minute test: one template from each slot; "W" is any word problem in the unit
  t5: [["1.2", "1.3"], ["1.2", "1.3"], ["1.5", "1.6"], ["1.5", "1.6"], ["1.8", "1.9", "1.10"], ["1.8", "1.9", "1.10"], ["1.11"], "W"]};
const add = (id, c) => { U1.lessons[id] = c; };

// ---------- helpers
const cap = s => s[0].toUpperCase() + s.slice(1);
const rat = (a, b) => `${a}:${b}`;
const usd = c => money(new Q(c, 100));                                         // cents → "$4.20"
const cash = c => ({pre: "$", ans: new Q(c, 100).dec(), show: usd(c).slice(1)});   // a money answer typed after a "$"
const twoDiff = (R, lo, hi) => { const a = ri(R, lo, hi); let b; do b = ri(R, lo, hi); while (b === a); return [a, b]; };
const coprime = (R, lo, hi) => { let a, b; do { a = ri(R, lo, hi); b = ri(R, lo, hi); } while (a === b || gcd(a, b) !== 1); return [a, b]; };
const eqRatio = (a, b, c, d) => Q.of(a).mul(d).eq(Q.of(b).mul(c));            // a:b and c:d are equivalent
const nums = s => String(s).replace(/,/g, "").match(/\d+(\.\d+)?/g).map(Number);
// Three wrong choices whose text differs from the right answer and from each other; more(k) tops up.
function three(right, cands, more) {
  const seen = new Set([String(right)]), out = [];
  const take = c => { if (c && out.length < 3 && !seen.has(String(c[0]))) { seen.add(String(c[0])); out.push(c); } };
  cands.forEach(take);
  for (let k = 1; out.length < 3 && k < 60; k++) take(more(k));
  return out;
}
// Traps that could never be mistaken for the answer: drop any equal to it or to an earlier trap.
function traps(ans, list) {
  const want = Array.isArray(ans) ? Q.of(ans[0]).div(ans[1]) : Q.of(ans), seen = [];
  return list.filter(t => {
    if (!t) return false;
    let v; try { v = Q.of(t[0]); } catch (e) { return false; }
    if (v.eq(want) || seen.some(s => s.eq(v))) return false;
    seen.push(v); return true;
  });
}

// =====================================================================================================
// 1.1 What a ratio means
const PLACES = [["in a bag", "red marbles", "blue marbles", "marbles"], ["at the shelter", "cats", "dogs", "animals"], ["in the fruit bowl", "apples", "oranges", "pieces of fruit"],
  ["in the cup", "pencils", "pens", "things in the cup"], ["in the band", "trumpets", "drums", "instruments"], ["in the fish tank", "goldfish", "guppies", "fish"]];
const WHOLES = [
  (a, b) => [`In a class, ${a} students walk to school and ${b} ride the bus.`, "students who walk", "students who ride the bus", "all the students in the class"],
  (a, b) => [`In a vote, ${a} students chose pizza and ${b} chose tacos.`, "students who chose pizza", "students who chose tacos", "all the students who voted"],
  (a, b) => [`A garden has ${a} red tulips and ${b} yellow tulips.`, "red tulips", "yellow tulips", "all the tulips"],
  (a, b) => [`A playlist has ${a} pop songs and ${b} rock songs.`, "pop songs", "rock songs", "all the songs"]];
add("1.1", {
  prereq: [],
  vocab: [["ratio", "A comparison of two quantities, like 4 red marbles to 6 blue marbles."],
    ["terms", "The two numbers in a ratio. In 4:6, the terms are 4 and 6."],
    ["part-to-part ratio", "Compares one part of a group to another part, like red marbles to blue marbles."],
    ["part-to-whole ratio", "Compares one part to the whole group, like red marbles to all the marbles."]],
  misconceptions: {
    RATIO_ORDER: "Order matters: red to blue is 4:6, but blue to red is 6:4.",
    PART_WHOLE: "Part-to-whole uses the total: red to all the marbles is 4:10, not 4:6.",
    RATIO_DIFF: "A ratio isn't a difference: 4:6 means 4 for every 6, not 2 more."
  },
  script: [
    {part: "hook", board: {m: "words", big: "4 red · 6 blue", small: "One bag of marbles"},
      say: "Here's a bag with 4 red marbles and 6 blue marbles. Your friend says there are more blue ones than red ones. That's true, but it doesn't tell you much. A ratio tells you exactly how two amounts compare. Today you'll learn what a ratio is, three ways to write one, and the difference between two kinds of ratios: part-to-part and part-to-whole."},
    {part: "idea", board: {m: "eq", lines: ["4 to 6", "4:6", "4/6"], hl: 1},
      say: "A ratio is a comparison of two quantities. In this bag there are 4 red marbles for every 6 blue marbles. You can write that ratio three ways. In words: 4 to 6. With a colon: 4:6. Or as a fraction, with 4 on top and 6 on the bottom. All three are read the same way, 4 to 6. The two numbers in a ratio are called its terms.",
      why: "A ratio compares amounts by saying how many of one thing go with how many of another, so both numbers matter."},
    {part: "see", board: {m: "tape", rows: [["Red", 4], ["Blue", 6]]},
      say: "Let's see it. Each box stands for one marble. The red row has 4 boxes and the blue row has 6. Lined up like this, you can see the comparison: 4 red for every 6 blue. Order matters. If the question says red to blue, red comes first, so the ratio is 4:6. If it says blue to red, blue comes first: 6:4. Same marbles, different order, different ratio."},
    {part: "see", board: {m: "tape", rows: [["Red", 4], ["Blue", 6], ["All", 10]]},
      say: "There are two kinds of ratios. Red to blue compares one part of the bag to another part. That's a part-to-part ratio, 4:6. Red to all the marbles compares a part to the whole group. That's a part-to-whole ratio. The whole is 4 plus 6, which is 10. So the ratio of red marbles to all the marbles is 4:10. You can also say that 4 out of 10 marbles are red.",
      why: "The whole is every marble in the bag, so it is the sum of the parts."},
    {part: "ido", board: {m: "eq", lines: ["girls : boys = 12:15", "whole = 12 + 15 = 27", "girls : all students = 12:27"], hl: 2},
      say: "Watch me do one. A class has 12 girls and 15 boys. What is the ratio of girls to all the students? First, the order: girls come first, then all the students. Next, the whole: 12 plus 15 is 27 students. So the ratio of girls to all the students is 12:27. I didn't write 12:15, because the question asks about all the students, not just the boys."},
    {part: "wedo", board: {m: "words", big: "20 players · 5 coaches"},
      say: "Your turn. A soccer camp has 20 players and 5 coaches. Write the ratio of players to coaches. Type the first number, tap the colon key, then type the second number.",
      check: {item: {type: "num", stem: "A soccer camp has 20 players and 5 coaches. Write the ratio of players to coaches.", ans: [20, 5],
        traps: [["1/4", "That's coaches to players. Players come first.", "RATIO_ORDER"]], sol: ["players : coaches = 20:5 | Players are named first."]},
        miss: "Players come first, so the ratio is 20 to 5. 5 to 20 would be coaches to players."}},
    {part: "wedo", board: {m: "words", big: "3 green pens · 7 black pens"},
      say: "Here's a part-to-whole one. A box has 3 green pens and 7 black pens. What is the ratio of green pens to all the pens in the box?",
      check: {item: {type: "mc", stem: "A box has 3 green pens and 7 black pens. What is the ratio of green pens to all the pens?", right: "3:10", whyRight: "All the pens is 3 + 7 = 10, and green comes first.",
        wrong: [["3:7", "That's green to black, a part-to-part ratio.", "PART_WHOLE"], ["7:10", "That's black pens to all the pens.", "PART_WHOLE"], ["10:3", "That's all the pens to green. The order is reversed.", "RATIO_ORDER"]],
        sol: ["3 + 7 = 10 | All the pens.", "3:10 | Green to all the pens."]},
        miss: "All the pens means the whole: 3 plus 7 is 10. Green to all the pens is 3 to 10."}},
    {part: "watch", board: {m: "eq", lines: ["red : blue = 4:6 ✓", "red : blue = 6:4 ✗", "red : all = 4:6 ✗"], strike: [1, 2]},
      say: "Watch out for two mistakes. First, order. The words tell you the order: red to blue means red first. Second, the whole. When a question says all, total, or out of, add the parts to find the whole before you write the ratio. And remember, a ratio isn't a difference. 4:6 doesn't mean there are two more blue marbles. It means 4 red for every 6 blue."},
    {part: "recap", board: {m: "words", big: "a to b · a:b · a/b", small: "part-to-part or part-to-whole"},
      say: "Let's recap. A ratio compares two quantities. You can write it with words, with a colon, or as a fraction. Keep the order the words give you. A part-to-part ratio compares two parts. A part-to-whole ratio compares one part to the total, so add the parts first. Now practice with new numbers. Three right in a row, with no hints, masters the lesson. If you get stuck, tap Hint, or come back and play this lesson again."}
  ],
  alt: [
    {part: "idea", board: {m: "rt", rows: [["Cups of juice", 2], ["Cups of water", 3]]},
      say: "Think of a recipe card. A drink uses 2 cups of juice and 3 cups of water. The ratio of juice to water is 2:3. The card lists juice first, so juice comes first in the ratio. Water to juice would be 3:2."},
    {part: "see", board: {m: "tape", rows: [["Juice", 2], ["Water", 3], ["Drink", 5]]},
      say: "Now pour everything into one pitcher. You have 5 cups of drink. Juice to the whole drink is 2:5, and water to the whole drink is 3:5. Each part compared to the whole pitcher is a part-to-whole ratio."},
    {part: "recap", board: {m: "words", big: "How much of the first for how much of the second?"},
      say: "So every ratio answers one question: how much of the first thing goes with how much of the second thing? Read the question's words in order, and write the numbers in that same order."}
  ],
  notes: {idea: "A ratio compares two quantities in a set order. Write it as a to b, with a colon, or as a fraction. Part-to-part compares two parts. Part-to-whole compares a part to the total.",
    examples: ["4 red, 6 blue: red to blue = 4:6, blue to red = 6:4", "4 red, 6 blue: red to all = 4:10", "12 girls, 15 boys: girls to all students = 12:27"],
    watch: "Take the order from the words. When you see all, total or out of, add the parts first."},
  templates: [
    {id: "1.1-which", type: "mc", tag: "CONCEPT", diff: 1, est: 20, make(R) {
      const [where, x, y, all] = pick(R, PLACES), [a, b] = twoDiff(R, 2, 9), flip = R() < 0.5;
      const [P, N, p, q] = flip ? [y, x, b, a] : [x, y, a, b], right = rat(p, q);
      return {stem: `There are ${a} ${x} and ${b} ${y} ${where}. Which ratio compares ${P} to ${N}?`, right, whyRight: `${cap(P)} come first, so the ratio is ${right}.`,
        wrong: three(right, [[rat(q, p), `That's ${N} to ${P}. The order is reversed.`, "RATIO_ORDER"], [rat(p, a + b), `That's ${P} to all ${a + b} ${all}, a part-to-whole ratio.`, "PART_WHOLE"],
          [rat(q, a + b), `That's ${N} to all the ${all}.`, "PART_WHOLE"]], k => [rat(p + k, q), "Count again.", null]),
        hints: [`Which comes first in the question: ${P} or ${N}?`, `Write the number of ${P}, a colon, then the number of ${N}.`],
        sol: [`${P} to ${N} = ${right} | The quantity named first goes first.`], p: {a, b, flip}};
    }, verify: it => it.right === (it.p.flip ? rat(it.p.b, it.p.a) : rat(it.p.a, it.p.b))},
    {id: "1.1-write", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const [where, x, y] = pick(R, [["A soccer camp", "players", "coaches"], ["A summer camp", "campers", "counselors"], ["A school", "students", "teachers"], ["A dance studio", "dancers", "teachers"]]);
      const a = ri(R, 8, 30), b = ri(R, 2, 6), ans = [a, b];
      return {stem: `${where} has ${a} ${x} and ${b} ${y}. Write the ratio of ${x} to ${y}.`, ans,
        traps: traps(ans, [[`${b}/${a}`, `That's ${y} to ${x}. ${cap(x)} come first.`, "RATIO_ORDER"], [`${a}/${a + b}`, `That's ${x} to everyone together. The question compares ${x} to ${y}.`, "PART_WHOLE"]]),
        hints: ["Type the first number, tap the colon key, then type the second number.", `${cap(x)} come first: ${a}, then the number of ${y}.`],
        sol: [`${x} : ${y} = ${rat(a, b)} | ${cap(x)} are named first.`], p: {a, b}};
    }, verify: it => eqRatio(it.ans[0], it.ans[1], it.p.a, it.p.b)},
    {id: "1.1-whole", type: "num", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const [a, b] = twoDiff(R, 3, 15), [s, x, y, all] = pick(R, WHOLES)(a, b), ans = [a, a + b];
      return {stem: `${s} Write the ratio of ${x} to ${all}.`, ans,
        traps: traps(ans, [[`${a}/${b}`, `That's ${x} to ${y}, a part-to-part ratio. "All" means add the parts first.`, "PART_WHOLE"], [`${a + b}/${a}`, `That's the whole to the part. ${cap(x)} come first.`, "RATIO_ORDER"]]),
        hints: ["The whole is everything put together. Add the parts.", `${a} + ${b} = ${a + b}. Now write ${x} to the whole.`],
        sol: [`${a} + ${b} = ${a + b} | Find the whole.`, `${rat(a, a + b)} | ${cap(x)} to the whole.`], p: {a, b}};
    }, verify: it => it.ans[0] === it.p.a && it.ans[1] - it.ans[0] === it.p.b},
    {id: "1.1-forms", type: "multi", tag: "CONCEPT", diff: 2, est: 35, make(R) {
      const [a, b] = twoDiff(R, 2, 9), [x, y] = pick(R, [["flour", "sugar"], ["sand", "water"], ["blue paint", "white paint"], ["oats", "milk"]]);
      return {stem: `A mix uses ${a} cups of ${x} and ${b} cups of ${y}. Which of these show the ratio of ${x} to ${y}? Choose all that apply.`,
        opts: [[`${a} to ${b}`, true, "Words work."], [rat(a, b), true, "A colon works."], [`${a}/${b}`, true, "A fraction works too."], [rat(b, a), false, `That's ${y} to ${x}.`], [rat(a, a + b), false, `That's ${x} to the whole mix.`]],
        hints: ["There are three ways to write a ratio.", `Every right choice has ${a} first and ${b} second.`],
        sol: [`${a} to ${b}, ${rat(a, b)}, ${a}/${b} | Words, a colon, or a fraction, with ${x} first.`], p: {a, b}};
    }, verify: it => it.opts.filter(o => o.ok).every(o => { const [x, y] = nums(o.t); return x === it.p.a && y === it.p.b; }) && it.opts.filter(o => o.ok).length === 3},
    {id: "1.1-true", type: "yn", tag: "CONCEPT", diff: 1, est: 30, make(R) {
      const [a, b] = twoDiff(R, 2, 9);
      const rows = shuffle(R, [[`The ratio of goldfish to guppies is ${rat(a, b)}.`, true, "Goldfish come first."], [`The ratio of guppies to goldfish is ${rat(a, b)}.`, false, `Guppies first: ${rat(b, a)}.`],
        [`The ratio of goldfish to all the fish is ${rat(a, a + b)}.`, true, `There are ${a + b} fish in all.`], [`The ratio of guppies to all the fish is ${rat(b, a)}.`, false, `All the fish is ${a + b}, so it's ${rat(b, a + b)}.`]]);
      return {stem: `A fish tank has ${a} goldfish and ${b} guppies. Is each statement true?`, rows,
        hints: ["Check the order in each statement, then check whether it means all the fish.", `All the fish: ${a} + ${b} = ${a + b}.`],
        sol: [`goldfish to guppies = ${rat(a, b)}, guppies to goldfish = ${rat(b, a)} | Order follows the words.`, `goldfish to all = ${rat(a, a + b)}, guppies to all = ${rat(b, a + b)} | The whole is ${a + b}.`], p: {a, b}};
    }, verify: it => it.rows.every(r => {
      const [x, y] = nums(r.t), first = /of goldfish/.test(r.t) ? it.p.a : it.p.b, second = /all the fish/.test(r.t) ? it.p.a + it.p.b : first === it.p.a ? it.p.b : it.p.a;
      return (x === first && y === second) === r.ok;
    })},
    {id: "1.1-mix", type: "num", tag: "APPLICATION", diff: 2, est: 50, word: true, make(R) {
      const n = ri(R, 2, 6), r = ri(R, 2, 6), z = ri(R, 1, 5), w = n + r + z, ans = [r, w];
      return {stem: `A trail mix recipe uses ${n} cups of nuts, ${r} cups of raisins and ${z} cups of pretzels. What is the ratio of raisins to the whole trail mix?`, ans,
        traps: traps(ans, [[`${r}/${n}`, "That compares raisins to nuts. The question asks about the whole mix.", "PART_WHOLE"], [`${r}/${n + z}`, "That's raisins to the other ingredients. The whole includes the raisins too.", "PART_WHOLE"],
          [`${w}/${r}`, "That's the whole to the raisins. Raisins come first.", "RATIO_ORDER"]]),
        frame: {find: ["The ratio of raisins to the whole mix", "How many more cups of raisins than nuts", "The total cups of nuts"],
          tool: ["Add all three parts to find the whole, then write raisins : whole", "Subtract the nuts from the raisins", "Multiply the three amounts"],
          check: `The second number, ${w}, is the total of all three ingredients, and raisins come first.`},
        hints: ["The whole mix is all three ingredients together.", `${n} + ${r} + ${z} = ${w} cups in all.`],
        sol: [`${n} + ${r} + ${z} = ${w} | The whole mix.`, `${rat(r, w)} | Raisins first, then the whole.`], p: {n, r, z}};
    }, verify: it => it.ans[0] === it.p.r && it.ans[1] === it.p.n + it.p.r + it.p.z},
    {id: "1.1-club", type: "mc", tag: "CONCEPT", diff: 3, est: 45, make(R) {
      const [p, q] = twoDiff(R, 2, 9), w = p + q, right = rat(p, q);
      return {stem: `In a club, the ratio of members who play chess to all the members is ${rat(p, w)}. What is the ratio of members who play chess to members who don't?`, right,
        whyRight: `Out of every ${w} members, ${p} play chess and ${w} − ${p} = ${q} don't.`,
        wrong: three(right, [[rat(p, w), "That's chess players to all the members, which the question already gave.", "PART_WHOLE"], [rat(q, p), "That's members who don't play to members who do. The order is reversed.", "RATIO_ORDER"],
          [rat(w, p), "That's all the members to chess players.", "RATIO_ORDER"]], k => [rat(p, q + k), "Subtract to find the members who don't play.", null]),
        hints: [`For every ${w} members, how many don't play chess?`, `${w} − ${p} = ${q} members don't play.`],
        sol: [`${w} − ${p} = ${q} | Members who don't play, out of every ${w}.`, `${right} | Chess players to members who don't play.`], p: {p, q}};
    }, verify: it => { const [x, y] = nums(it.right); return x === it.p.p && x + y === it.p.p + it.p.q; }}
  ]
});

// =====================================================================================================
// 1.2 Equivalent ratios
add("1.2", {
  prereq: ["1.1"],
  vocab: [["equivalent ratios", "Ratios that make the same comparison, like 2:3 and 4:6."],
    ["scale factor", "The number you multiply or divide both terms by."],
    ["simplest form", "A ratio whose terms have no common factor except 1, like 2:3."]],
  misconceptions: {
    ADD_SAME: "Adding the same number to both terms changes the ratio: 2:3 and 4:5 aren't equivalent. Multiply or divide both terms instead.",
    ONE_TERM_ONLY: "Change both terms by the same factor, not just one of them.",
    NOT_SIMPLEST: "Simplest form means dividing by the greatest common factor, so no common factor except 1 is left."
  },
  script: [
    {part: "hook", board: {m: "words", big: "2 scoops of mix : 3 cups of water", small: "Same taste, bigger batch?"},
      say: "A lemonade recipe uses 2 scoops of mix for every 3 cups of water. That makes one small pitcher. But what if you want enough lemonade for the whole class? You'll need more mix and more water, and the lemonade still has to taste exactly the same. Too much mix and it's too sweet. Too much water and it's watery. That's what equivalent ratios are for."},
    {part: "idea", board: {m: "eq", lines: ["2:3", "4:6", "6:9", "8:12"], hl: 1},
      say: "Equivalent ratios make the same comparison. To get an equivalent ratio, multiply both terms by the same number. 2:3 with both terms times 2 is 4:6. Times 3, it's 6:9. Times 4, it's 8:12. Every one of these pitchers tastes the same, because there are always 2 scoops for every 3 cups of water. The number you multiply by is called the scale factor.",
      why: "Multiplying both terms by the same number is the same as making more copies of the recipe, so the taste never changes."},
    {part: "see", board: {m: "rt", rows: [["Scoops of mix", 2, 4, 6, 8], ["Cups of water", 3, 6, 9, 12]], hl: 2},
      say: "Here are the batches side by side. Look down each column: 2 and 3, 4 and 6, 6 and 9, 8 and 12. Each column is the recipe made 1, 2, 3 or 4 times. The top row grows by 2 each time, and the bottom row grows by 3, always together."},
    {part: "see", board: {m: "tape", rows: [["Mix", 4], ["Water", 6]]},
      say: "Here's why it works. Picture one batch as 2 boxes of mix and 3 boxes of water. Two batches is just two copies of that: 4 boxes of mix and 6 boxes of water. Nothing about the taste changes. There's just more of it. That's why you have to multiply both terms. If you only add more water, the lemonade gets weaker, and if you only add more mix, it gets stronger."},
    {part: "ido", board: {m: "eq", lines: ["3:5 = ?:20", "5 × 4 = 20", "3 × 4 = 12", "3:5 = 12:20"], hl: 3},
      say: "Watch me find a missing term. 3:5 is equivalent to what number to 20? Ask: what turns 5 into 20? Multiply by 4. Whatever you do to one term, you do to the other term. 3 times 4 is 12. So 3:5 is equivalent to 12:20. Check it by going backward: 12 divided by 4 is 3, and 20 divided by 4 is 5. We're back to 3:5."},
    {part: "ido", board: {m: "eq", lines: ["18:24", "greatest common factor: 6", "18 ÷ 6 = 3 and 24 ÷ 6 = 4", "18:24 = 3:4"], hl: 3},
      say: "You can also divide both terms by the same number. To write 18:24 in simplest form, find the greatest number that divides both 18 and 24. That's 6, their greatest common factor. 18 divided by 6 is 3, and 24 divided by 6 is 4. So 18:24 in simplest form is 3:4. No number bigger than 1 divides both 3 and 4, so we're done.",
      why: "Dividing by the greatest common factor gets to simplest form in one step. Dividing by a smaller factor works too, but then you have to divide again."},
    {part: "wedo", board: {m: "eq", lines: ["2:7 = ?:21"]},
      say: "Your turn. 2:7 is equivalent to what number to 21? Think: what turns 7 into 21?",
      check: {item: {type: "num", stem: "2:7 is equivalent to what number to 21?", ans: 6, traps: [[16, "Adding 14 to both terms changes the ratio. 7 × 3 = 21, so multiply 2 by 3.", "ADD_SAME"]],
        sol: ["7 × 3 = 21 | The scale factor is 3.", "2 × 3 = 6 | Multiply the first term by 3 too."]},
        miss: "7 times 3 is 21, so multiply 2 by 3 as well. The answer is 6."}},
    {part: "wedo", board: {m: "eq", lines: ["4:5 = ?"]},
      say: "Which ratio is equivalent to 4:5? Check whether both terms were multiplied by the same number.",
      check: {item: {type: "mc", stem: "Which ratio is equivalent to 4:5?", right: "12:15", whyRight: "Both terms of 4:5 were multiplied by 3.",
        wrong: [["8:9", "That adds 4 to each term, and adding changes the ratio.", "ADD_SAME"], ["5:4", "The terms are switched.", "RATIO_ORDER"], ["8:5", "Only the first term was doubled.", "ONE_TERM_ONLY"]],
        sol: ["4 × 3 = 12 and 5 × 3 = 15 | Same factor for both terms."]},
        miss: "12:15 is 4:5 with both terms multiplied by 3. 8:9 adds 4 to each term, and adding changes the ratio."}},
    {part: "watch", board: {m: "eq", lines: ["2:3 → 4:5 ✗ added 2", "2:3 → 4:6 ✓ times 2"], strike: [0]},
      say: "Watch out. Adding the same number to both terms does not make an equivalent ratio. 2:3 and 4:5 look close, but 4:5 has more mix for each cup of water, so it would taste stronger. Always multiply or divide both terms by the same number. And when a question asks for simplest form, divide by the greatest common factor, so no common factor is left."},
    {part: "recap", board: {m: "words", big: "× or ÷ both terms by the same number", small: "2:3 = 4:6 = 6:9"},
      say: "Recap. Equivalent ratios make the same comparison. Multiply or divide both terms by the same number to find one. To find a missing term, figure out what changes the term you know, then do the same thing to the other term. Simplest form means no common factor except 1 is left. Now practice with fresh numbers. Three right in a row, with no hints, masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["Mix", 2], ["Water", 3]]},
      say: "Think of it as groups. One group is 2 scoops of mix and 3 cups of water. Two groups is 4 scoops and 6 cups. Three groups is 6 scoops and 9 cups. You're making more copies of the same group."},
    {part: "see", board: {m: "tape", rows: [["Mix", 6], ["Water", 9]]},
      say: "Every equivalent ratio is some number of copies of the same group. That's why both terms have to change together. If you add one scoop of mix without adding water, the group isn't the same anymore, and neither is the taste."},
    {part: "recap", board: {m: "eq", lines: ["6:9 ÷ 3 = 2:3"]},
      say: "Going backward works too. 6:9 is 3 copies of 2:3, so divide both terms by 3 to get back to 2:3. That's simplest form."}
  ],
  notes: {idea: "Equivalent ratios make the same comparison. Multiply or divide both terms by the same number.",
    examples: ["2:3 = 4:6 = 6:9 (times 2, times 3)", "3:5 = ?:20, 5 × 4 = 20, so 3 × 4 = 12: 3:5 = 12:20", "18:24 ÷ 6 = 3:4 (simplest form)"],
    watch: "Never add the same number to both terms: 2:3 and 4:5 are not equivalent."},
  templates: [
    {id: "1.2-which", type: "mc", tag: "CONCEPT", diff: 1, est: 25, make(R) {
      const [a, b] = coprime(R, 2, 9), k = ri(R, 2, 5), right = rat(a * k, b * k);
      return {stem: `Which ratio is equivalent to ${rat(a, b)}?`, right, whyRight: `Both terms of ${rat(a, b)} were multiplied by ${k}.`,
        wrong: three(right, [[rat(a + k, b + k), `That adds ${k} to both terms, and adding changes the ratio.`, "ADD_SAME"], [rat(a * k, b), "Only the first term was multiplied.", "ONE_TERM_ONLY"],
          [rat(b * k, a * k), "The terms are in the wrong order.", "RATIO_ORDER"]], j => [rat(a * k + j, b * k), "The terms weren't multiplied by the same number.", "ONE_TERM_ONLY"]),
        hints: ["Equivalent ratios multiply both terms by the same number.", `Try multiplying ${a} and ${b} by ${k}.`],
        sol: [`${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k} | Same factor for both terms.`], p: {a, b}};
    }, verify: it => { const [x, y] = nums(it.right); return eqRatio(x, y, it.p.a, it.p.b) && it.wrong.every(w => { const [u, v] = nums(w[0]); return !eqRatio(u, v, it.p.a, it.p.b) || w[2] === "RATIO_ORDER"; }); }},
    {id: "1.2-blank", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const [a, b] = twoDiff(R, 2, 9), k = ri(R, 2, 6), first = R() < 0.5;
      const ans = first ? a * k : b * k, from = first ? b : a, to = from * k, other = first ? a : b;
      return {stem: first ? `${rat(a, b)} is equivalent to what number to ${to}?` : `${rat(a, b)} is equivalent to ${to} to what number?`,
        board: {m: "eq", lines: [first ? `${rat(a, b)} = ?:${to}` : `${rat(a, b)} = ${to}:?`]}, ans,
        traps: traps(ans, [[other + to - from, `Adding ${to - from} to both terms changes the ratio. Multiply both terms by ${k} instead.`, "ADD_SAME"]]),
        hints: [`What do you multiply ${from} by to get ${to}?`, `${from} × ${k} = ${to}. Do the same to ${other}.`],
        sol: [`${from} × ${k} = ${to} | Find the scale factor.`, `${other} × ${k} = ${ans} | Multiply the other term by the same factor.`], p: {a, b, k, first}};
    }, verify: it => it.p.first ? eqRatio(it.p.a, it.p.b, it.ans, it.p.b * it.p.k) : eqRatio(it.p.a, it.p.b, it.p.a * it.p.k, it.ans)},
    {id: "1.2-simplest", type: "num", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const [a, b] = coprime(R, 1, 9), g = ri(R, 2, 9), ans = [a, b];
      return {stem: `Write ${rat(a * g, b * g)} in simplest form.`, ans, simplest: true,
        traps: traps(ans, [[`${b}/${a}`, "The terms are switched. Keep them in the same order.", "RATIO_ORDER"]]),
        hints: [`Find the greatest number that divides both ${a * g} and ${b * g}.`, `Both terms divide by ${g}.`],
        sol: [`${a * g} ÷ ${g} = ${a} and ${b * g} ÷ ${g} = ${b} | Divide both terms by their greatest common factor, ${g}.`, `${rat(a, b)} | No common factor except 1 is left.`], p: {a, b, g}};
    }, verify: it => gcd(it.ans[0], it.ans[1]) === 1 && eqRatio(it.ans[0], it.ans[1], it.p.a * it.p.g, it.p.b * it.p.g)},
    {id: "1.2-check", type: "yn", tag: "CONCEPT", diff: 2, est: 40, make(R) {
      let a, b, k, j, m; do { [a, b] = coprime(R, 2, 9); [k, j] = twoDiff(R, 2, 6); m = ri(R, 1, 5); } while (new Set([rat(a * k, b * k), rat(a + m, b + m), rat(a * j, b * j), rat(a * k, b * k + 1)]).size < 4);
      const rows = shuffle(R, [[rat(a * k, b * k), true, `Both terms times ${k}.`], [rat(a + m, b + m), false, `Adding ${m} to both terms changes the ratio.`],
        [rat(a * j, b * j), true, `Both terms times ${j}.`], [rat(a * k, b * k + 1), false, `${b} × ${k} = ${b * k}, not ${b * k + 1}.`]]);
      return {stem: `Is each ratio equivalent to ${rat(a, b)}?`, rows,
        hints: ["Check whether both terms were multiplied by the same number.", `For example, ${a} × ${k} = ${a * k}. Is ${b} × ${k} equal to ${b * k}?`],
        sol: [`${rat(a * k, b * k)} and ${rat(a * j, b * j)} are equivalent | Each multiplies both terms by the same number.`, `${rat(a + m, b + m)} and ${rat(a * k, b * k + 1)} are not | One adds, and the other changes only one term correctly.`], p: {a, b}};
    }, verify: it => it.rows.every(r => { const [x, y] = nums(r.t); return eqRatio(x, y, it.p.a, it.p.b) === r.ok; })},
    {id: "1.2-paint", type: "num", tag: "APPLICATION", diff: 2, est: 50, word: true, make(R) {
      const [a, b] = coprime(R, 2, 7), k = ri(R, 2, 6), [x, y] = pick(R, [["blue", "yellow"], ["red", "white"], ["green", "white"]]), who = pick(R, ["Jada", "Omar", "Priya", "Luis"]), ans = b * k;
      return {stem: `To make a paint color, ${who} mixes ${a} cups of ${x} paint with ${b} cups of ${y} paint. ${who} wants the same color using ${a * k} cups of ${x} paint. How many cups of ${y} paint are needed?`, ans, post: "cups",
        traps: traps(ans, [[b + a * k - a, `That adds ${a * k - a} cups to each color, which changes the color. Multiply both amounts by ${k}.`, "ADD_SAME"], [a * k, `That's the ${x} paint. The question asks for ${y}.`, null]]),
        frame: {find: [`Cups of ${y} paint to go with ${a * k} cups of ${x}`, `Cups of ${x} paint`, "Total cups of paint"],
          tool: ["Equivalent ratios: multiply both amounts by the same number", "Add the same amount to both colors", "Subtract the two amounts"],
          check: `${cap(x)} to ${y} should still simplify to ${rat(a, b)}.`},
        hints: [`What do you multiply ${a} by to get ${a * k}?`, `${a} × ${k} = ${a * k}, so multiply ${b} by ${k} too.`],
        sol: [`${a} × ${k} = ${a * k} | The ${x} paint was multiplied by ${k}.`, `${b} × ${k} = ${ans} | Multiply the ${y} paint by the same number.`], p: {a, b, k}};
    }, verify: it => eqRatio(it.p.a, it.p.b, it.p.a * it.p.k, it.ans)},
    {id: "1.2-fix", type: "mistake", tag: "CONCEPT", diff: 3, est: 55, make(R) {
      const [a, b] = coprime(R, 2, 7), k = ri(R, 2, 5), d = a * k - a, who = pick(R, ["Leo", "Maya", "Sam", "Ana"]);
      return {stem: `${who} tried to find a ratio equivalent to ${rat(a, b)} with a first term of ${a * k}. Which step has the mistake?`,
        steps: [`${rat(a, b)} = ${a * k}:?`, `${a} became ${a * k}, so add ${d} to ${b}.`, `${b} + ${d} = ${b + d}`, `Answer: ${rat(a * k, b + d)}`], wrong: 1,
        fixes: [[`${a} was multiplied by ${k}, so multiply ${b} by ${k}: ${rat(a * k, b * k)}`, true, "Equivalent ratios multiply both terms by the same number."],
          [`Add ${d} to ${a * k} as well`, false, "Adding never keeps a ratio the same."], [`Subtract ${d} from ${b} instead`, false, "Subtracting changes the ratio too."]],
        hints: ["Equivalent ratios come from multiplying or dividing, never adding.", `${a} × ${k} = ${a * k}. What should happen to ${b}?`],
        sol: [`${a} × ${k} = ${a * k} | The first term was multiplied by ${k}.`, `${b} × ${k} = ${b * k} | So multiply the second term by ${k} to get ${rat(a * k, b * k)}.`], p: {a, b, k}};
    }, verify: it => { const {a, b, k} = it.p; return !eqRatio(a, b, a * k, b + a * k - a) && eqRatio(a, b, a * k, b * k) && it.fixes.filter(f => f.ok).length === 1; }},
    {id: "1.2-scale", type: "num", tag: "PROCEDURE", diff: 3, est: 55, make(R) {
      const [a0, b0] = coprime(R, 1, 5), g = ri(R, 2, 4); let h; do h = ri(R, 2, 9); while (h % g === 0 || h === g);
      const a = a0 * g, b = b0 * g, c = b0 * h, ans = a0 * h;
      return {stem: `${rat(a, b)} is equivalent to what number to ${c}?`, board: {m: "eq", lines: [`${rat(a, b)} = ?:${c}`]}, ans,
        traps: traps(ans, [[a + c - b, "Adding or subtracting the same number from both terms changes the ratio.", "ADD_SAME"]]),
        hints: [`${b} doesn't go evenly into ${c}. Write ${rat(a, b)} in simplest form first.`, `${rat(a, b)} = ${rat(a0, b0)}. What do you multiply ${b0} by to get ${c}?`],
        sol: [`${rat(a, b)} = ${rat(a0, b0)} | Divide both terms by ${g}.`, `${b0} × ${h} = ${c} | The scale factor is ${h}.`, `${a0} × ${h} = ${ans} | Multiply the first term by ${h}.`], p: {a, b, c}};
    }, verify: it => eqRatio(it.p.a, it.p.b, it.ans, it.p.c)}
  ]
});

// =====================================================================================================
// 1.3 Ratio tables and double number lines
add("1.3", {
  prereq: ["1.2"],
  vocab: [["ratio table", "A table of equivalent ratios. Each column keeps the same comparison."],
    ["double number line", "Two number lines lined up so that matching amounts sit across from each other."],
    ["unit rate", "The amount for 1. If 3 notebooks cost $12, the unit rate is $4 for 1 notebook."]],
  misconceptions: {
    ADD_SAME: "Adding the same number to both rows changes the ratio. Multiply or divide a column, or add two whole columns.",
    SKIP_PATTERN: "Each row grows by its own amount: 1 more notebook adds the price of one notebook, not $1.",
    ZERO_START: "On a double number line, 0 lines up with 0, and equal steps on one line match equal steps on the other."
  },
  script: [
    {part: "hook", board: {m: "words", big: "3 notebooks cost $12", small: "What do 5 cost? What about 8?"},
      say: "At the school store, 3 notebooks cost $12. How much do 5 notebooks cost? What about 8? You could guess, but guessing at a store can cost you. There's a tool that keeps everything organized and makes questions like these easy. It's called a ratio table, and it's one of the most useful tools in this whole unit."},
    {part: "idea", board: {m: "rt", rows: [["Notebooks", 3, 6, 9], ["Cost ($)", 12, 24, 36]], hl: 2},
      say: "A ratio table lists equivalent ratios in columns. The top row is notebooks and the bottom row is dollars. 3 notebooks cost $12. Double both numbers: 6 notebooks cost $24. Triple both: 9 notebooks cost $36. Every column has the same ratio as 3 to 12, because we always multiply both rows by the same number.",
      why: "Each column is a whole number of copies of the first column, so every column makes the same comparison."},
    {part: "see", board: {m: "rt", rows: [["Notebooks", 3, 1, 5, 8], ["Cost ($)", 12, 4, 20, 32]], hl: 2},
      say: "Here's the trick for 5 and 8. First, find the cost of 1 notebook. Divide both rows by 3. 3 divided by 3 is 1, and 12 divided by 3 is 4. So 1 notebook costs $4. Now multiply. 5 notebooks cost 5 times 4, which is $20. 8 notebooks cost 8 times 4, which is $32. The column with a 1 in it is called the unit rate."},
    {part: "see", board: {m: "dnl", top: ["Notebooks", 0, 1, 2, 3, 4, 5], bot: ["Cost ($)", 0, 4, 8, 12, 16, 20], hl: 5},
      say: "A double number line shows the same thing as a picture. Notebooks go on the top line and dollars go on the bottom line. 0 notebooks cost $0, so 0 lines up with 0. Each step of 1 notebook on top matches a step of $4 on the bottom. Find 5 on the top line, look straight down, and you'll see $20."},
    {part: "see", board: {m: "rt", rows: [["Laps", 8, 4, 2], ["Minutes", 20, 10, 5]], hl: 3},
      say: "Dividing works too. If 8 laps take 20 minutes, then half of that is 4 laps in 10 minutes, and half again is 2 laps in 5 minutes. Divide both rows by the same number, and the pace stays the same. Multiplying and dividing whole columns never changes the ratio."},
    {part: "ido", board: {m: "rt", rows: [["Laps", 4, 2, 6], ["Minutes", 10, 5, 15]], hl: 3},
      say: "Watch me use a table another way. Sam runs 4 laps in 10 minutes. How long do 6 laps take? 6 isn't a multiple of 4, so I'll make a helpful column first. Halve both rows: 2 laps take 5 minutes. Now I can add two columns. 4 laps plus 2 laps is 6 laps, and 10 minutes plus 5 minutes is 15 minutes. You may add two whole columns together, because each column is an equivalent ratio.",
      why: "Adding two columns is like doing one run and then the other. The laps and the minutes both add up, so the pace stays the same."},
    {part: "wedo", board: {m: "rt", rows: [["Cups of flour", 2, 4, 6], ["Cookies", 24, "?", "?"]]},
      say: "Your turn. 2 cups of flour make 24 cookies. Fill in the number of cookies for 4 cups and for 6 cups. Tap a box, then type.",
      check: {item: {type: "table", stem: "2 cups of flour make 24 cookies. Fill in the table.", rows: [["Cups of flour", 2, 4, 6], ["Cookies", 24, 48, 72]], blanks: [[1, 2], [1, 3]],
        sol: ["4 = 2 × 2, so 24 × 2 = 48 | Double both rows.", "6 = 2 × 3, so 24 × 3 = 72 | Triple both rows."]},
        miss: "4 cups is 2 times 2 cups, so it makes 2 times 24, which is 48 cookies. 6 cups is 3 times as much: 72 cookies."}},
    {part: "wedo", board: {m: "dnl", top: ["Miles", 0, 3, 6, 9, 12], bot: ["Minutes", 0, 20, 40, 60, 80], hide: ["b4"], hl: 4},
      say: "Now a double number line. A cyclist rides 3 miles every 20 minutes. How many minutes does it take to ride 12 miles?",
      check: {item: {type: "num", stem: "A cyclist rides 3 miles every 20 minutes. How many minutes does it take to ride 12 miles?", ans: 80, post: "minutes",
        traps: [[29, "Adding 9 to the minutes treats miles and minutes the same. Each step of 3 miles adds 20 minutes.", "ADD_SAME"]],
        sol: ["12 ÷ 3 = 4 | 12 miles is 4 steps of 3 miles.", "4 × 20 = 80 | Each step is 20 minutes."]},
        miss: "12 miles is 4 steps of 3 miles. Each step takes 20 minutes, so 4 times 20 is 80 minutes."}},
    {part: "watch", board: {m: "eq", lines: ["3 notebooks: $12", "4 notebooks: $13 ✗", "4 notebooks: $16 ✓"], strike: [1]},
      say: "Watch out. Going from 3 notebooks to 4 notebooks adds 1 notebook, but it doesn't add $1. It adds the cost of one notebook, which is $4. Each row grows by its own amount. And on a double number line, 0 always lines up with 0, and the steps on each line have to be even. If the top line counts by 1 notebook, the bottom line counts by 4 dollars, every single step."},
    {part: "recap", board: {m: "words", big: "Multiply or divide a column, or add two columns", small: "Stuck? Find the column with a 1."},
      say: "Recap. A ratio table keeps equivalent ratios in columns. Multiply or divide a whole column by the same number, or add two columns together. When you're stuck, find the column with a 1 in it, the unit rate, and then multiply. A double number line shows the same thing, with 0 lined up with 0. Now try some practice. Three right in a row, with no hints, masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "rt", rows: [["Notebooks", 3], ["Cost ($)", 12]]},
      say: "Think of a ratio table as a price list in a store window. The store already shows that 3 notebooks cost $12."},
    {part: "see", board: {m: "rt", rows: [["Notebooks", 3, 1], ["Cost ($)", 12, 4]], hl: 2},
      say: "Split the 3 notebooks into single notebooks, and split the $12 the same way. Each notebook gets $4. That's the column with a 1 in it."},
    {part: "recap", board: {m: "rt", rows: [["Notebooks", 3, 1, 5, 8], ["Cost ($)", 12, 4, 20, 32]], hl: 3},
      say: "Once you know that 1 notebook costs $4, any amount is easy. Count the notebooks and multiply by 4. 5 notebooks cost $20, and 8 notebooks cost $32."}
  ],
  notes: {idea: "A ratio table lists equivalent ratios. Multiply or divide a column, or add two columns. Find the column with a 1 to get the unit rate.",
    examples: ["3 notebooks for $12, so 1 for $4, so 5 for $20", "4 laps in 10 min and 2 laps in 5 min, so 6 laps in 15 min", "Double number line: 0 lines up with 0; equal steps match"],
    watch: "Adding 1 to the top row doesn't add 1 to the bottom row. Each row grows by its own amount."},
  templates: [
    {id: "1.3-fill", type: "table", tag: "PROCEDURE", diff: 1, est: 35, make(R) {
      const [top, bot] = pick(R, [["Cups of flour", "Cookies"], ["Hours", "Miles"], ["Tickets", "Dollars"], ["Packs", "Stickers"], ["Bags", "Apples"]]);
      const [a, b] = twoDiff(R, 2, 12), times = [1, 2, 3, 5], cols = shuffle(R, [2, 3, 4]).slice(0, 2).sort();
      return {stem: "Fill in the ratio table.", rows: [[top, ...times.map(t => a * t)], [bot, ...times.map(t => b * t)]], blanks: cols.map(c => [1, c]),
        hints: ["Each column is the first column multiplied by the same number.", `The column with ${2 * a} on top is the first column times 2.`],
        sol: cols.map(c => `${a} × ${times[c - 1]} = ${a * times[c - 1]}, so ${b} × ${times[c - 1]} = ${b * times[c - 1]} | Multiply both rows by ${times[c - 1]}.`), p: {a, b}};
    }, verify: it => it.blanks.every(([, c]) => eqRatio(it.rows[0][c], it.rows[1][c], it.p.a, it.p.b))},
    {id: "1.3-line", type: "num", tag: "PROCEDURE", diff: 2, est: 40, make(R) {
      const [what, unit, top] = pick(R, [["A cyclist rides", "miles", "Miles"], ["A printer prints", "pages", "Pages"], ["A swimmer swims", "laps", "Laps"]]);
      let s, t; do { s = ri(R, 2, 6); t = 5 * ri(R, 1, 6); } while (s === t);
      const k = ri(R, 3, 5), steps = [0, 1, 2, 3, 4, 5], ans = k * t;
      return {stem: `${what} ${s} ${unit} every ${t} minutes. Use the double number line. How many minutes does it take for ${k * s} ${unit}?`, post: "minutes",
        board: {m: "dnl", top: [top, ...steps.map(i => i * s)], bot: ["Minutes", ...steps.map(i => i * t)], hide: ["b" + k], hl: k}, ans,
        traps: traps(ans, [[t + k * s - s, `Adding ${k * s - s} to the minutes treats ${unit} and minutes the same. Each step of ${s} ${unit} adds ${t} minutes.`, "ADD_SAME"]]),
        hints: [`How many steps of ${s} make ${k * s}?`, `${k * s} ÷ ${s} = ${k} steps. Each step is ${t} minutes.`],
        sol: [`${k * s} ÷ ${s} = ${k} | Count the steps.`, `${k} × ${t} = ${ans} | Each step adds ${t} minutes.`], p: {s, t, k}};
    }, verify: it => eqRatio(it.p.s, it.p.t, it.p.k * it.p.s, it.ans) && it.board.bot[it.p.k + 1] === it.ans},
    {id: "1.3-store", type: "num", tag: "APPLICATION", diff: 2, est: 55, word: true, make(R) {
      const [item, one, store] = pick(R, [["notebooks", "notebook", "the school store"], ["pens", "pen", "the book fair"], ["bracelets", "bracelet", "the craft fair"], ["muffins", "muffin", "the bake sale"]]);
      const a = ri(R, 2, 5), u = ri(R, 2, 9); let c; do c = ri(R, 4, 12); while (c % a === 0);
      const ans = c * u;
      return {stem: `At ${store}, ${a} ${item} cost $${a * u}. At that price, how much do ${c} ${item} cost?`, pre: "$", ans,
        traps: traps(ans, [[a * u + c - a, `Each extra ${one} adds $${u}, not $1.`, "SKIP_PATTERN"], [a * u * c, `That multiplies the price of ${a} ${item} by ${c}. Find the cost of 1 first.`, null]]),
        frame: {find: [`The cost of ${c} ${item}`, `The cost of 1 ${one}`, `How many ${item} $${a * u} buys`],
          tool: ["Find the cost of 1, then multiply", "Add $1 for each extra item", "Multiply the two numbers in the question"],
          check: `${c} ${item} should cost ${c} times as much as 1 ${one}.`},
        hints: [`Find the cost of 1 ${one} first.`, `$${a * u} ÷ ${a} = $${u} for each one.`],
        sol: [`$${a * u} ÷ ${a} = $${u} | The cost of 1.`, `${c} × $${u} = $${ans} | Multiply by the number of ${item}.`], p: {a, u, c}};
    }, verify: it => eqRatio(it.p.a, it.p.a * it.p.u, it.p.c, it.ans)},
    {id: "1.3-column", type: "mc", tag: "CONCEPT", diff: 2, est: 35, make(R) {
      const [a, b] = twoDiff(R, 2, 9), k = ri(R, 2, 6), m = ri(R, 1, 6), right = `${a * k} laps and ${b * k} minutes`;
      return {stem: `A ratio table starts with ${a} laps and ${b} minutes. Which pair could be another column in the table?`, right, whyRight: `Both numbers are multiplied by ${k}.`,
        wrong: three(right, [[`${a + m} laps and ${b + m} minutes`, `That adds ${m} to both rows, which changes the ratio.`, "ADD_SAME"], [`${a * k} laps and ${b + k} minutes`, `The laps were multiplied by ${k}, but the minutes weren't.`, "ONE_TERM_ONLY"],
          [`${b * k} laps and ${a * k} minutes`, "The rows are switched.", "RATIO_ORDER"]], j => [`${a * k} laps and ${b * k + j} minutes`, "The minutes don't match the laps.", null]),
        hints: ["Each column multiplies both rows by the same number.", `Look for a pair where laps ÷ ${a} and minutes ÷ ${b} give the same number.`],
        sol: [`${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k} | Both rows times ${k}.`], p: {a, b}};
    }, verify: it => { const [x, y] = nums(it.right); return eqRatio(x, y, it.p.a, it.p.b) && it.wrong.every(w => { const [u, v] = nums(w[0]); return !eqRatio(u, v, it.p.a, it.p.b); }); }},
    {id: "1.3-add", type: "num", tag: "PROCEDURE", diff: 3, est: 55, make(R) {
      const [c, d] = twoDiff(R, 2, 6), ans = 3 * d;
      return {stem: `${2 * c} laps take ${2 * d} minutes. At the same pace, how many minutes do ${3 * c} laps take?`, post: "minutes",
        board: {m: "rt", rows: [["Laps", 2 * c, c, 3 * c], ["Minutes", 2 * d, d, 3 * d]], hide: [[1, 2], [1, 3]]}, ans,
        traps: traps(ans, [[2 * d + c, `Adding ${c} laps doesn't add ${c} minutes. Find the minutes for ${c} laps first.`, "SKIP_PATTERN"]]),
        hints: [`Halve the first column: how long do ${c} laps take?`, `${c} laps take ${d} minutes, and ${3 * c} laps is ${2 * c} laps plus ${c} laps.`],
        sol: [`${2 * c} ÷ 2 = ${c} laps and ${2 * d} ÷ 2 = ${d} minutes | Halve both rows.`, `${2 * d} + ${d} = ${ans} | Add the two columns: ${2 * c} + ${c} = ${3 * c} laps.`], p: {c, d}};
    }, verify: it => eqRatio(2 * it.p.c, 2 * it.p.d, 3 * it.p.c, it.ans)},
    {id: "1.3-true", type: "yn", tag: "CONCEPT", diff: 1, est: 30, make(R) {
      const a = ri(R, 2, 4), u = ri(R, 2, 9), t = a * u;
      const rows = shuffle(R, [[`${2 * a} notebooks cost $${2 * t}.`, true, `Double both: ${2 * a} notebooks and $${2 * t}.`], [`${a + 1} notebooks cost $${t + 1}.`, false, `One more notebook adds $${u}, not $1.`],
        ["1 notebook costs $" + u + ".", true, `$${t} ÷ ${a} = $${u}.`], [`${3 * a} notebooks cost $${3 * t - u}.`, false, `${3 * a} is ${a} × 3, so the cost is 3 × $${t} = $${3 * t}.`]]);
      return {stem: `${a} notebooks cost $${t}. Is each statement true?`, rows,
        hints: ["Find the cost of 1 notebook first.", `$${t} ÷ ${a} = $${u} for each notebook.`],
        sol: [`$${t} ÷ ${a} = $${u} | The cost of 1 notebook.`, `Multiply $${u} by the number of notebooks | Then check each statement.`], p: {a, u}};
    }, verify: it => it.rows.every(r => { const [n, c] = nums(r.t); return (c === n * it.p.u) === r.ok; })}
  ]
});

// =====================================================================================================
// 1.4 Comparing ratios
add("1.4", {
  prereq: ["1.2", "1.3"],
  vocab: [["compare ratios", "Decide which ratio has more of the first quantity for the same amount of the second."],
    ["common term", "A matching number in two ratios, made with equivalent ratios, so the other terms are easy to compare."],
    ["stronger mix", "A mix with more of the flavor for the same amount of water."]],
  misconceptions: {
    DIFF_COMPARE: "Don't compare ratios by subtracting: 3:5 and 4:6 both differ by 2, but they aren't equivalent.",
    BIGGER_NUMBERS: "Bigger numbers don't mean a bigger ratio: 6:10 is exactly the same as 3:5.",
    RATIO_ORDER: "Keep the order of the ratio when you compare: juice to water, wins to losses."
  },
  script: [
    {part: "hook", board: {m: "words", big: "A: 2 scoops cocoa for 5 cups milk", small: "B: 3 scoops cocoa for 8 cups milk"},
      say: "Two hot cocoa recipes. Recipe A uses 2 scoops of cocoa for every 5 cups of milk. Recipe B uses 3 scoops of cocoa for every 8 cups of milk. Which one tastes more chocolatey? Recipe B has more cocoa, but it also has more milk. You can't just look at one number. To decide, you need to compare the ratios fairly."},
    {part: "idea", board: {m: "words", big: "Make one term match.", small: "Then compare the other term."},
      say: "Here's the big idea. To compare two ratios, use equivalent ratios to make one of the terms the same in both. Then compare the other term. It's like a fair race: everyone runs the same distance, and then you compare the times. Once the milk matches, the recipe with more cocoa is more chocolatey.",
      why: "When one term is the same, the only thing left that's different is the other term, so the comparison is fair."},
    {part: "see", board: {m: "rt", rows: [["A: cocoa", 2, 16], ["A: milk", 5, 40], ["B: cocoa", 3, 15], ["B: milk", 8, 40]], hl: 2},
      say: "5 and 8 both go into 40, so let's make the milk 40 cups in both recipes. Scale Recipe A by 8. 2 times 8 is 16 scoops for 5 times 8, which is 40 cups. Scale Recipe B by 5. 3 times 5 is 15 scoops for 8 times 5, which is 40 cups. Now the milk matches. Recipe A has 16 scoops and Recipe B has 15. Recipe A is more chocolatey, but just barely."},
    {part: "see", board: {m: "eq", lines: ["A: 2 ÷ 5 = 0.4 scoop per cup", "B: 3 ÷ 8 = 0.375 scoop per cup"], hl: 0},
      say: "There's a second way to make a term match: make it 1. Recipe A has 2 scoops for 5 cups, which is 0.4 of a scoop in each cup of milk. Recipe B has 3 scoops for 8 cups, which is 0.375 of a scoop in each cup. 0.4 is more than 0.375, so Recipe A wins again. Both ways always agree."},
    {part: "ido", board: {m: "eq", lines: ["Team A: 12 wins : 4 losses = 3:1 = 6:2", "Team B: 15 wins : 6 losses = 5:2", "6:2 beats 5:2"], hl: 2},
      say: "Watch me do another. Team A won 12 games and lost 4. Team B won 15 and lost 6. Which team has the better ratio of wins to losses? First I'll simplify. 12:4 is 3:1, and 15:6 is 5:2. Now make the losses match: 3:1 with both terms times 2 is 6:2. So for every 2 losses, Team A has 6 wins and Team B has 5. Team A's record is better, even though Team B won more games.",
      why: "Team B played more games, so it has bigger numbers. Matching the losses takes the extra games out of the comparison."},
    {part: "wedo", board: {m: "words", big: "A: 3 cups juice for 4 cups water", small: "B: 5 cups juice for 8 cups water"},
      say: "Your turn. Juice A uses 3 cups of orange juice for every 4 cups of water. Juice B uses 5 cups of orange juice for every 8 cups of water. Which juice is stronger? Make the water match first.",
      check: {item: {type: "mc", stem: "Juice A uses 3 cups of orange juice for every 4 cups of water. Juice B uses 5 cups of orange juice for every 8 cups of water. Which juice is stronger?", right: "Juice A",
        whyRight: "With 8 cups of water each, Juice A has 6 cups of orange juice and Juice B has 5.",
        wrong: [["Juice B", "Juice B has more juice, but also more water. With 8 cups of water each, it has only 5 cups of juice.", "BIGGER_NUMBERS"], ["They're the same strength", "With 8 cups of water each, the juice is 6 cups and 5 cups. That's not the same.", null]],
        sol: ["3:4 = 6:8 | Make the water 8 cups.", "6:8 beats 5:8 | More juice for the same water."]},
        miss: "Scale Juice A by 2 to get 6 cups of juice for 8 cups of water. Juice B has only 5 cups for the same 8 cups of water, so Juice A is stronger."}},
    {part: "wedo", board: {m: "eq", lines: ["2:3 = ?:15", "compare with 7:15"]},
      say: "Let's set up a comparison. To compare 2:3 with 7:15, first write 2:3 with a second term of 15. 2:3 is equivalent to what number to 15?",
      check: {item: {type: "num", stem: "2:3 is equivalent to what number to 15?", ans: 10, traps: [[14, "Adding 12 to both terms changes the ratio. 3 × 5 = 15, so multiply 2 by 5.", "ADD_SAME"]],
        sol: ["3 × 5 = 15 | The scale factor is 5.", "2 × 5 = 10 | So 2:3 = 10:15, which is more than 7:15."]},
        miss: "3 times 5 is 15, so 2 times 5 is 10. 2:3 is the same as 10:15, which has more than 7:15."}},
    {part: "watch", board: {m: "eq", lines: ["3:5 and 4:6: each differs by 2", "3:5 = 9:15 and 4:6 = 10:15", "Not the same!"], hl: 1},
      say: "Watch out for two traps. Don't compare ratios by subtracting. In 3:5 and 4:6, each ratio has a difference of 2, but they aren't equal. Scale them to 9:15 and 10:15, and you can see that 4:6 has more of the first quantity. And bigger numbers don't mean more. 6:10 is exactly the same as 3:5, it's just a bigger batch."},
    {part: "recap", board: {m: "words", big: "Match one term, compare the other", small: "or compare the amount for 1"},
      say: "Recap. To compare ratios, use equivalent ratios to make one term the same in both, often with a common multiple, like 40 for 5 and 8. Then compare the other term. Or find the amount for 1 of the second quantity and compare those. Don't compare by subtracting, and don't be fooled by bigger numbers. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["A cocoa", 2], ["A milk", 5], ["B cocoa", 3], ["B milk", 8]]},
      say: "Picture the recipes as boxes. Recipe A is 2 boxes of cocoa to 5 boxes of milk. Recipe B is 3 boxes of cocoa to 8 boxes of milk. The milk rows aren't the same length, so it's hard to compare the cocoa."},
    {part: "see", board: {m: "rt", rows: [["A: cocoa", 16], ["A: milk", 40], ["B: cocoa", 15], ["B: milk", 40]]},
      say: "Make 8 batches of A and 5 batches of B. Now both have 40 cups of milk. A has 16 scoops of cocoa and B has 15. With the milk rows the same length, it's easy to see that A has more cocoa."},
    {part: "recap", board: {m: "words", big: "Same milk, compare the cocoa"},
      say: "So the trick is always the same: get one of the amounts to match, then the comparison is fair."}
  ],
  notes: {idea: "To compare ratios, make one term match using equivalent ratios, then compare the other term. Or compare the amount for 1.",
    examples: ["2:5 compared with 3:8: 16:40 and 15:40, so 2:5 is greater", "12:4 = 6:2 and 15:6 = 5:2, so Team A's record is better", "3:4 compared with 5:8: 6:8 and 5:8"],
    watch: "Don't compare by subtracting, and bigger numbers don't mean a bigger ratio."},
  templates: [
    {id: "1.4-same", type: "mc", tag: "CONCEPT", diff: 1, est: 25, make(R) {
      const w = ri(R, 4, 10), [x, y] = twoDiff(R, 1, w - 1), right = x > y ? "Mix A" : "Mix B";
      return {stem: `Mix A uses ${x} cups of juice for every ${w} cups of water. Mix B uses ${y} cups of juice for every ${w} cups of water. Which mix is stronger?`, right,
        whyRight: `The water matches, so the mix with more juice, ${Math.max(x, y)} cups, is stronger.`,
        wrong: [[x > y ? "Mix B" : "Mix A", `With the same ${w} cups of water, ${Math.min(x, y)} cups of juice is weaker.`, null], ["They're the same strength", "The water is the same, but the juice isn't.", null], ["You can't tell", "When the water matches, you can compare the juice.", null]],
        hints: ["Which amount is the same in both mixes?", `Both use ${w} cups of water. Compare the juice.`],
        sol: [`${rat(x, w)} compared with ${rat(y, w)} | Same water, so compare the juice.`, `${right} is stronger | More juice for the same water.`], p: {x, y, w}};
    }, verify: it => (it.p.x > it.p.y) === (it.right === "Mix A")},
    {id: "1.4-common", type: "num", tag: "PROCEDURE", diff: 1, est: 30, make(R) {
      let a, b, d, L; do { [b, d] = twoDiff(R, 2, 9); L = lcm(b, d); a = ri(R, 1, 9); } while (L === b || L > 72 || a === b);
      const c = ri(R, 1, 9), ans = a * L / b;
      return {stem: `To compare ${rat(a, b)} with ${rat(c, d)}, make the second terms match. ${rat(a, b)} is equivalent to what number to ${L}?`,
        board: {m: "eq", lines: [`${rat(a, b)} = ?:${L}`, `${rat(c, d)} = ${rat(c * L / d, L)}`]}, ans,
        traps: traps(ans, [[a + L - b, `Adding ${L - b} to both terms changes the ratio. Multiply both terms by ${L / b}.`, "ADD_SAME"]]),
        hints: [`What do you multiply ${b} by to get ${L}?`, `${b} × ${L / b} = ${L}.`],
        sol: [`${b} × ${L / b} = ${L} | The scale factor.`, `${a} × ${L / b} = ${ans} | Same factor for the first term.`], p: {a, b, L}};
    }, verify: it => eqRatio(it.p.a, it.p.b, it.ans, it.p.L)},
    {id: "1.4-juice", type: "mc", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      let a, b, c, d; do { b = ri(R, 3, 9); d = ri(R, 3, 9); a = ri(R, 1, b - 1); c = ri(R, 1, d - 1); } while (b === d || a * d === b * c || lcm(b, d) > 72);
      const L = lcm(b, d), A = a * L / b, C = c * L / d, aWins = A > C, loser = aWins ? "Juice B" : "Juice A";
      const bigger = aWins ? c > a : a > c;
      return {stem: `Juice A uses ${a} cups of orange juice for every ${b} cups of water. Juice B uses ${c} cups of orange juice for every ${d} cups of water. Which juice is stronger?`,
        right: aWins ? "Juice A" : "Juice B", whyRight: `With ${L} cups of water each, Juice A has ${A} cups of orange juice and Juice B has ${C}.`,
        wrong: [[loser, `With ${L} cups of water each, ${loser} has only ${Math.min(A, C)} cups of orange juice.`, bigger ? "BIGGER_NUMBERS" : null],
          ["They're the same strength", `${A} cups and ${C} cups of orange juice aren't the same.`, b - a === d - c ? "DIFF_COMPARE" : null], ["You can't tell", "You can tell: make the water match, then compare the juice.", null]],
        hints: ["Make the cups of water match in both juices.", `${b} and ${d} both go into ${L}.`],
        sol: [`${rat(a, b)} = ${rat(A, L)} | Multiply both terms by ${L / b}.`, `${rat(c, d)} = ${rat(C, L)} | Multiply both terms by ${L / d}.`, `${Math.max(A, C)} cups beats ${Math.min(A, C)} cups | More juice for the same water.`], p: {a, b, c, d}};
    }, verify: it => (it.p.a * it.p.d > it.p.c * it.p.b) === (it.right === "Juice A")},
    {id: "1.4-teams", type: "mc", tag: "CONCEPT", diff: 3, est: 60, make(R) {
      let w1, l1, w2, l2, g1, g2; do { [w1, l1] = coprime(R, 1, 6); [w2, l2] = coprime(R, 1, 6); g1 = ri(R, 2, 4); g2 = ri(R, 2, 4); } while (w1 * l2 === w2 * l1 || w1 <= l1 && w2 <= l2);
      const W1 = w1 * g1, L1 = l1 * g1, W2 = w2 * g2, L2 = l2 * g2, aWins = W1 * L2 > W2 * L1, M = lcm(l1, l2);
      return {stem: `Team A won ${W1} games and lost ${L1}. Team B won ${W2} games and lost ${L2}. Which team has the greater ratio of wins to losses?`,
        right: aWins ? "Team A" : "Team B", whyRight: `For every ${M} losses, Team A has ${w1 * M / l1} wins and Team B has ${w2 * M / l2}.`,
        wrong: [[aWins ? "Team B" : "Team A", "Compare the wins for the same number of losses.", (aWins ? W2 > W1 : W1 > W2) ? "BIGGER_NUMBERS" : null],
          ["Their ratios are the same", `${rat(w1, l1)} and ${rat(w2, l2)} aren't equivalent.`, W1 - L1 === W2 - L2 ? "DIFF_COMPARE" : null], ["You can't tell without more games", "You can tell: compare equivalent ratios.", null]],
        hints: ["Write each record in simplest form.", `${rat(W1, L1)} = ${rat(w1, l1)} and ${rat(W2, L2)} = ${rat(w2, l2)}. Now make the losses match.`],
        sol: [`${rat(W1, L1)} = ${rat(w1, l1)} and ${rat(W2, L2)} = ${rat(w2, l2)} | Simplest form.`, `${rat(w1 * M / l1, M)} compared with ${rat(w2 * M / l2, M)} | Make the losses match at ${M}.`], p: {W1, L1, W2, L2}};
    }, verify: it => (it.p.W1 * it.p.L2 > it.p.W2 * it.p.L1) === (it.right === "Team A")},
    {id: "1.4-class", type: "mc", tag: "APPLICATION", diff: 2, est: 55, word: true, make(R) {
      let x1, y1, x2, y2; do { [x1, y1] = coprime(R, 1, 5); [x2, y2] = coprime(R, 1, 5); } while (x1 * y2 === x2 * y1 || lcm(y1, y2) > 20);
      const k1 = ri(R, 2, 5), k2 = ri(R, 2, 5), b1 = x1 * k1, g1 = y1 * k1, b2 = x2 * k2, g2 = y2 * k2, M = lcm(y1, y2), aWins = x1 * y2 > x2 * y1;
      return {stem: `Class A has ${b1} boys and ${g1} girls. Class B has ${b2} boys and ${g2} girls. In which class is the ratio of boys to girls greater?`,
        right: aWins ? "Class A" : "Class B", whyRight: `For every ${M} girls, Class A has ${x1 * M / y1} boys and Class B has ${x2 * M / y2}.`,
        wrong: [[aWins ? "Class B" : "Class A", "Compare the boys for the same number of girls.", (aWins ? b2 > b1 : b1 > b2) ? "BIGGER_NUMBERS" : null], ["The ratios are the same", `${rat(x1, y1)} and ${rat(x2, y2)} aren't equivalent.`, null], ["You can't tell without more students", "You can tell: compare equivalent ratios.", null]],
        frame: {find: ["Which class has more boys for each girl", "Which class has more students", "How many more girls than boys"],
          tool: ["Simplify each ratio, make the girls match, then compare the boys", "Subtract the boys from the girls in each class", "Add the two classes together"],
          check: "Compare the boys for the same number of girls in both classes."},
        hints: ["Write each class's ratio in simplest form.", `${rat(b1, g1)} = ${rat(x1, y1)} and ${rat(b2, g2)} = ${rat(x2, y2)}. Make the girls match.`],
        sol: [`${rat(b1, g1)} = ${rat(x1, y1)} and ${rat(b2, g2)} = ${rat(x2, y2)} | Simplest form.`, `${rat(x1 * M / y1, M)} compared with ${rat(x2 * M / y2, M)} | Make the girls match at ${M}.`], p: {b1, g1, b2, g2}};
    }, verify: it => (it.p.b1 * it.p.g2 > it.p.b2 * it.p.g1) === (it.right === "Class A")},
    {id: "1.4-order", type: "order", tag: "CONCEPT", diff: 3, est: 60, make(R) {
      let rs; do { rs = [0, 1, 2].map(() => { const w = ri(R, 2, 8); return [ri(R, 1, w - 1), w]; }); } while (new Set(rs.map(([a, b]) => a / b)).size < 3);
      const sorted = rs.slice().sort((p, q) => p[0] * q[1] - q[0] * p[1]);
      return {stem: "Each ratio is cups of juice to cups of water. Put them in order from weakest to strongest.", items: sorted.map(([a, b]) => rat(a, b)),
        hints: ["Find the juice for 1 cup of water: divide the juice by the water.", "The weakest mix has the smallest amount of juice for each cup of water."],
        sol: sorted.map(([a, b]) => `${rat(a, b)} means ${a}/${b} cup of juice for each cup of water | Smaller means weaker.`), p: {}};
    }, verify: it => it.items.every((t, i) => { if (!i) return true; const [a, b] = nums(it.items[i - 1]), [c, d] = nums(t); return a * d < c * b; })},
    {id: "1.4-true", type: "yn", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      // a random pair, a same-difference pair both ways round, and an equal pair
      let four, text; do {
        const [a, b] = coprime(R, 1, 8), [c, d] = coprime(R, 1, 8), m = ri(R, 2, 6), [e, f] = coprime(R, 1, 6), k = ri(R, 2, 3);
        four = [[a, b, c, d], [m, m + 2, m + 1, m + 3], [m + 1, m + 3, m, m + 2], [e * k, f * k, e, f]];
        text = four.map(([p, q, r, t]) => `${rat(p, q)} is greater than ${rat(r, t)}.`);
      } while (new Set(text).size < 4 || four[0][0] * four[0][3] === four[0][1] * four[0][2]);
      const rows = shuffle(R, four.map(([p, q, r, t], i) => { const L = lcm(q, t); return [text[i], p * t > q * r, `With ${L} as the second term: ${rat(p * L / q, L)} and ${rat(r * L / t, L)}.`]; }));
      return {stem: "Is each statement true?", rows,
        hints: ["Make the second terms match, then compare the first terms.", "Equivalent ratios are equal, so neither one is greater."],
        sol: ["Match the second terms, then compare the first terms | The bigger first term is the greater ratio."], p: {}};
    }, verify: it => it.rows.every(r => { const [p, q, s1, s2] = nums(r.t); return (p * s2 > q * s1) === r.ok; })}
  ]
});

// =====================================================================================================
// 1.5 Unit rates
const RATES = [["words", "minute", "minutes", "Kim types"], ["miles", "hour", "hours", "A bus travels"], ["pages", "day", "days", "Rosa reads"], ["laps", "minute", "minutes", "A runner jogs"], ["gallons", "minute", "minutes", "A hose fills"]];
add("1.5", {
  prereq: ["1.3"],
  vocab: [["rate", "A ratio that compares two different kinds of quantities, like miles and hours."],
    ["unit rate", "A rate for 1 unit of the second quantity, like 50 miles per hour."],
    ["per", "For each. Per hour means for each hour."]],
  misconceptions: {
    DIVIDE_BACKWARD: "The quantity before per goes on top: miles per hour is miles ÷ hours, not hours ÷ miles.",
    MULTIPLY_INSTEAD: "To find a unit rate, divide. Multiplying the two numbers doesn't give the amount for 1.",
    SKIP_PATTERN: "Each extra unit adds the unit rate, not 1: if 1 mile takes 9 minutes, each extra mile adds 9 minutes."
  },
  script: [
    {part: "hook", board: {m: "words", big: "Car: 150 miles in 3 hours", small: "Train: 200 miles in 4 hours"},
      say: "A car drives 150 miles in 3 hours. A train goes 200 miles in 4 hours. Which one is faster? It's hard to tell from those numbers, because the times are different. But if you knew how far each one goes in just 1 hour, the answer would jump right out. That's called a unit rate, and it's one of the most useful ideas in math."},
    {part: "idea", board: {m: "eq", lines: ["rate: 150 miles in 3 hours", "unit rate: 50 miles per 1 hour"], hl: 1},
      say: "A rate is a ratio that compares two different kinds of quantities, like miles and hours. A unit rate tells you how much for 1 unit of the second quantity. The word per means for each, so 50 miles per hour means 50 miles for each 1 hour. To find a unit rate, divide the first quantity by the second.",
      why: "Dividing splits the total into equal shares, one share for each unit. One share is the unit rate."},
    {part: "see", board: {m: "dnl", top: ["Hours", 0, 1, 2, 3], bot: ["Miles", 0, 50, 100, 150], hl: 1},
      say: "Here's the car on a double number line. 3 hours lines up with 150 miles. Split the 3 hours into 3 equal steps of 1 hour each. Split the 150 miles into 3 equal steps too: 150 divided by 3 is 50. So 1 hour lines up with 50 miles. The car's unit rate is 50 miles per hour."},
    {part: "see", board: {m: "rt", rows: [["Hours", 3, 1], ["Miles", 150, 50]], hl: 2},
      say: "A ratio table shows the same thing. Start with the column for 3 hours and 150 miles. Divide both rows by 3, the number of hours, so the hours become 1. 150 divided by 3 is 50. Whenever you want a unit rate, you're looking for the column with a 1 in the second row, and dividing gets you there."},
    {part: "ido", board: {m: "eq", lines: ["Train: 200 miles ÷ 4 hours", "= 50 miles per hour", "Car: 50 miles per hour", "Same speed!"], hl: 1},
      say: "Now the train: 200 miles in 4 hours. Divide: 200 divided by 4 is 50. The train also goes 50 miles per hour. They're the same speed! Notice that I divided miles by hours, because I wanted miles per hour. The quantity before the word per goes on top, and the quantity after per is the 1."},
    {part: "ido", board: {m: "eq", lines: ["$18 for 6 tickets", "18 ÷ 6 = 3", "$3 per ticket"], hl: 2},
      say: "Unit rates aren't only about speed. If 6 movie tickets cost $18, the price per ticket is 18 divided by 6, which is $3 per ticket. A price for 1 item is called a unit price. Speed, unit price, pages per minute, heartbeats per minute: they're all unit rates, and you find every one of them the same way, by dividing."},
    {part: "ido", board: {m: "eq", lines: ["3 pizzas ÷ 4 people", "= 3/4 pizza per person"], hl: 1},
      say: "Unit rates can be fractions, too. If 4 friends share 3 pizzas equally, each person gets 3 divided by 4, which is 3 fourths of a pizza. That's a unit rate: 3 fourths of a pizza per person. Dividing a smaller number by a bigger one is fine. The answer is just less than 1."},
    {part: "wedo", board: {m: "words", big: "96 pages in 4 hours"},
      say: "Your turn. Ana reads 96 pages in 4 hours. How many pages does she read per hour?",
      check: {item: {type: "num", stem: "Ana reads 96 pages in 4 hours. How many pages does she read per hour?", ans: 24, post: "pages per hour",
        traps: [[384, "That multiplies. Divide the pages by the hours.", "MULTIPLY_INSTEAD"], ["1/24", "That's hours per page. The question asks for pages per hour.", "DIVIDE_BACKWARD"]],
        sol: ["96 ÷ 4 = 24 | Pages divided by hours."]},
        miss: "Pages per hour means pages divided by hours: 96 divided by 4 is 24 pages per hour."}},
    {part: "wedo", board: {m: "words", big: "45 words in 3 minutes"},
      say: "Which is the unit rate for typing 45 words in 3 minutes?",
      check: {item: {type: "mc", stem: "Which is the unit rate for typing 45 words in 3 minutes?", right: "15 words per minute", whyRight: "45 ÷ 3 = 15 words for each minute.",
        wrong: [["135 words per minute", "That multiplies 45 by 3. Divide instead.", "MULTIPLY_INSTEAD"], ["42 words per minute", "That subtracts 3 from 45. Divide instead.", null], ["48 words per minute", "That adds 3 to 45. Divide instead.", null]],
        sol: ["45 ÷ 3 = 15 | Words divided by minutes."]},
        miss: "Words per minute means words divided by minutes: 45 divided by 3 is 15 words per minute."}},
    {part: "watch", board: {m: "eq", lines: ["miles per hour = miles ÷ hours", "hours per mile = hours ÷ miles"], hl: 0},
      say: "Watch out for the order. The word before per goes on top, and the word after per is the 1. Miles per hour is miles divided by hours. Hours per mile would be hours divided by miles, which is a different rate. And remember to divide. Multiplying 150 by 3 gives 450, and 450 doesn't mean anything useful here."},
    {part: "recap", board: {m: "words", big: "Unit rate = first quantity ÷ second quantity", small: "Per means for each 1."},
      say: "Recap. A rate compares two different quantities. A unit rate is the amount for 1 of the second quantity. Find it by dividing: the quantity before per, divided by the quantity after per. Once you have unit rates, comparing is easy, because everything is measured for 1. Now practice. Three right in a row, with no hints, masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["150 miles", 3, 50]]},
      say: "Picture the 150 miles as a long road split into 3 equal parts, one part for each hour. Each part is 150 divided by 3, which is 50 miles."},
    {part: "see", board: {m: "eq", lines: ["150 ÷ 3 = 50", "50 + 50 + 50 = 150"]},
      say: "Check it by adding back up: 50 plus 50 plus 50 is 150. So in each hour the car goes 50 miles. That one equal share is the unit rate."},
    {part: "recap", board: {m: "words", big: "One equal share for each 1"},
      say: "Any unit rate works this way. Share the total equally, one share for each unit, and one share is your answer."}
  ],
  notes: {idea: "A unit rate is the amount for 1 unit of the second quantity. Divide the first quantity by the second.",
    examples: ["150 miles in 3 hours: 150 ÷ 3 = 50 miles per hour", "$18 for 6 tickets: $3 per ticket", "96 pages in 4 hours: 24 pages per hour"],
    watch: "The quantity before per goes on top. Divide; don't multiply."},
  templates: [
    {id: "1.5-pick", type: "mc", tag: "CONCEPT", diff: 1, est: 25, make(R) {
      const [th, u1, un, who] = pick(R, RATES), n = ri(R, 2, 8), u = ri(R, 3, 15), T = n * u, right = `${u} ${th} per ${u1}`;
      return {stem: `${who} ${T} ${th} in ${n} ${un}. What is the unit rate?`, right, whyRight: `${T} ÷ ${n} = ${u} ${th} for each ${u1}.`,
        wrong: three(right, [[`${T * n} ${th} per ${u1}`, "That multiplies. Divide to find the amount for 1.", "MULTIPLY_INSTEAD"], [`${T - n} ${th} per ${u1}`, "That subtracts. Divide to find the amount for 1.", null],
          [`${T + n} ${th} per ${u1}`, "That adds. Divide to find the amount for 1.", null]], k => [`${u + k} ${th} per ${u1}`, `${u + k} × ${n} isn't ${T}.`, null]),
        hints: [`A unit rate is the amount for 1 ${u1}.`, `Divide: ${T} ÷ ${n}.`],
        sol: [`${T} ÷ ${n} = ${u} | ${cap(th)} divided by ${un}.`], p: {T, n}};
    }, verify: it => nums(it.right)[0] * it.p.n === it.p.T},
    {id: "1.5-per", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const [th, u1, un, who] = pick(R, RATES), n = ri(R, 2, 9), u = ri(R, 3, 25), T = n * u;
      return {stem: `${who} ${T} ${th} in ${n} ${un}. How many ${th} is that per ${u1}?`, ans: u, post: `${th} per ${u1}`,
        traps: traps(u, [[T * n, `That multiplies. Divide the ${th} by the ${un}.`, "MULTIPLY_INSTEAD"], [`${n}/${T}`, `That's ${un} per ${th.slice(0, -1)}. The question asks for ${th} per ${u1}.`, "DIVIDE_BACKWARD"]]),
        hints: [`Per ${u1} means for 1 ${u1}.`, `Divide: ${T} ÷ ${n}.`], sol: [`${T} ÷ ${n} = ${u} | ${cap(th)} divided by ${un}.`], p: {T, n}};
    }, verify: it => it.ans * it.p.n === it.p.T},
    {id: "1.5-price", type: "num", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const [item, one] = pick(R, [["tickets", "ticket"], ["notebooks", "notebook"], ["hats", "hat"], ["plants", "plant"]]), n = ri(R, 2, 8), c = 5 * ri(R, 21, 199), total = n * c;
      return {stem: `${n} ${item} cost ${usd(total)}. What is the price per ${one}?`, ...cash(c),
        traps: traps(new Q(c, 100), [[new Q(n * 100, total).frac(), `That's ${item} per dollar. Divide the price by the number of ${item}.`, "DIVIDE_BACKWARD"], [c, `That's the price in cents. ${c} cents is ${usd(c)}.`, null]]),
        hints: ["Divide the total price by the number of items.", `Work in cents: ${fn(total)} cents ÷ ${n}.`],
        sol: [`${fn(total)} cents ÷ ${n} = ${c} cents | Divide the price by the number of ${item}.`, `${c} cents = ${usd(c)} | The price for 1.`], p: {n, total}};
    }, verify: it => Q.of(it.ans).mul(it.p.n).mul(100).eq(it.p.total)},
    {id: "1.5-faster", type: "mc", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      let u1, u2, h1, h2; do { u1 = ri(R, 30, 70); u2 = ri(R, 30, 70); h1 = ri(R, 2, 6); h2 = ri(R, 2, 6); } while (u1 === u2 || h1 === h2);
      const D1 = u1 * h1, D2 = u2 * h2, aWins = u1 > u2;
      return {stem: `Car A drives ${D1} miles in ${h1} hours. Car B drives ${D2} miles in ${h2} hours. Which car is faster?`, right: aWins ? "Car A" : "Car B",
        whyRight: `Car A goes ${u1} miles per hour and Car B goes ${u2} miles per hour.`,
        wrong: [[aWins ? "Car B" : "Car A", `It goes only ${Math.min(u1, u2)} miles per hour.`, (aWins ? D2 > D1 : D1 > D2) ? "BIGGER_NUMBERS" : null], ["They go the same speed", `${u1} and ${u2} miles per hour aren't the same.`, null], ["You can't tell", "You can tell: compare miles per hour.", null]],
        hints: ["Find each car's miles per hour.", `Car A: ${D1} ÷ ${h1}. Car B: ${D2} ÷ ${h2}.`],
        sol: [`${D1} ÷ ${h1} = ${u1} | Car A, miles per hour.`, `${D2} ÷ ${h2} = ${u2} | Car B, miles per hour.`], p: {D1, h1, D2, h2}};
    }, verify: it => (it.p.D1 * it.p.h2 > it.p.D2 * it.p.h1) === (it.right === "Car A")},
    {id: "1.5-walk", type: "num", tag: "APPLICATION", diff: 2, est: 60, word: true, make(R) {
      const who = pick(R, ["Jo", "Ben", "Mia", "Raj"]), m = ri(R, 2, 4), u = ri(R, 6, 15); let M; do M = ri(R, 3, 10); while (M === m);
      const ans = M * u;
      return {stem: `${who} walks ${m} miles in ${m * u} minutes. At that rate, how many minutes will it take to walk ${M} miles?`, ans, post: "minutes",
        traps: traps(ans, [[m * u + M - m, `Each extra mile adds ${u} minutes, not 1.`, "SKIP_PATTERN"], [m * u * M, `That multiplies the whole time by ${M}. Find the minutes for 1 mile first.`, "MULTIPLY_INSTEAD"]]),
        frame: {find: [`Minutes to walk ${M} miles`, "Miles walked in 1 minute", "The total miles walked"], tool: ["Find the minutes per mile, then multiply", `Add ${M} to the minutes`, `Divide ${M} by ${m}`],
          check: `${ans} minutes for ${M} miles is ${u} minutes per mile, the same rate as before.`},
        hints: ["How many minutes does 1 mile take?", `${m * u} ÷ ${m} = ${u} minutes per mile.`],
        sol: [`${m * u} ÷ ${m} = ${u} | Minutes per mile.`, `${M} × ${u} = ${ans} | Minutes for ${M} miles.`], p: {m, u, M}};
    }, verify: it => eqRatio(it.p.m, it.p.m * it.p.u, it.p.M, it.ans)},
    {id: "1.5-snail", type: "num", tag: "PROCEDURE", diff: 3, est: 50, make(R) {
      let T, n; do { T = ri(R, 2, 15); n = ri(R, 2, 12); } while (T % n === 0);
      const [who, th, one, un, u1] = pick(R, [["A snail crawls", "feet", "foot", "minutes", "minute"], ["A faucet drips", "cups", "cup", "hours", "hour"], ["A plant grows", "inches", "inch", "weeks", "week"]]), q = new Q(T, n);
      return {stem: `${who} ${T} ${th} in ${n} ${un}. How many ${th} per ${u1} is that? You can write a fraction or a decimal.`, ans: q.frac(), keys: "frac dec",
        traps: traps(q, [[new Q(n, T).frac(), `That's ${un} per ${one}. Divide the ${th} by the ${un}.`, "DIVIDE_BACKWARD"]]),
        hints: [`Divide the ${th} by the ${un}: ${T} ÷ ${n}.`, `${T} ÷ ${n} can be written as the fraction ${T}/${n}.`],
        sol: [`${T} ÷ ${n} = ${q.mixed()} | ${cap(th)} per ${u1}.`].concat(q.dec() ? [`${q.mixed()} = ${q.dec()} | The same amount as a decimal.`] : []), p: {T, n}};
    }, verify: it => Q.of(it.ans).mul(it.p.n).eq(it.p.T)},
    {id: "1.5-printer", type: "multi", tag: "CONCEPT", diff: 2, est: 40, make(R) {
      let n, u, k; do { n = ri(R, 2, 6); u = ri(R, 6, 20); k = ri(R, 3, 10); } while (n * u + k === u * k || k === n);
      const T = n * u;
      return {stem: `A printer prints ${T} pages in ${n} minutes. Which statements are true? Choose all that apply.`,
        opts: [[`It prints ${u} pages per minute.`, true, `${T} ÷ ${n} = ${u}.`], [`It prints ${T * n} pages per minute.`, false, `That's ${T} × ${n}.`], [`Each page takes 1/${u} of a minute.`, true, `${n} ÷ ${T} = 1/${u} of a minute for each page.`],
          [`In ${k} minutes it prints ${u * k} pages.`, true, `${u} × ${k} = ${u * k}.`], [`In ${k} minutes it prints ${T + k} pages.`, false, `Each minute adds ${u} pages, not 1.`]],
        hints: ["Find the pages per minute first.", `${T} ÷ ${n} = ${u} pages per minute.`],
        sol: [`${T} ÷ ${n} = ${u} pages per minute | Pages divided by minutes.`, `${n} ÷ ${T} = 1/${u} of a minute per page | Minutes divided by pages.`], p: {n, u}};
    }, verify: it => it.opts.every(o => { const x = nums(o.t); return /pages per minute/.test(o.t) ? (x[0] === it.p.u) === o.ok : /takes/.test(o.t) ? o.ok : ((x[1] === it.p.u * x[0]) === o.ok); })}
  ]
});

// =====================================================================================================
// 1.6 Unit price and better buys
add("1.6", {
  prereq: ["1.5"],
  vocab: [["unit price", "The price for 1 unit, like the price per ounce or the price per item."],
    ["better buy", "The choice with the lower unit price: you pay less for each unit."],
    ["cent", "One hundredth of a dollar. $4.20 is 420 cents."]],
  misconceptions: {
    LOWER_TOTAL: "The lower total price isn't always the better buy. Compare the price per unit.",
    BIGGER_PACK: "A bigger package isn't always cheaper per unit. Check the unit price.",
    DIVIDE_BACKWARD: "Price per ounce is dollars ÷ ounces. Ounces ÷ dollars tells you ounces per dollar."
  },
  script: [
    {part: "hook", board: {m: "words", big: "12 ounces for $3.00", small: "or 20 ounces for $4.40?"},
      say: "At the store, a 12-ounce box of cereal costs $3.00 and a 20-ounce box costs $4.40. The small box costs less money, but you also get less cereal. Which one gives you more for your money? Stores put the answer on a tiny label on the shelf, but the label is sometimes missing or hard to read. Today you'll learn to work it out yourself, with unit price."},
    {part: "idea", board: {m: "eq", lines: ["unit price = price ÷ number of units"], hl: 0},
      say: "Unit price is the price for 1 unit: 1 ounce, 1 pound, 1 item. You find it by dividing the price by the number of units. Then you compare. The lower unit price is the better buy, because you pay less for each unit. Dividing money is often easier in cents, so $3.00 becomes 300 cents.",
      why: "Comparing prices for the same amount, 1 unit, makes the comparison fair, just like matching a term when you compare ratios."},
    {part: "see", board: {m: "rt", rows: [["Ounces", 12, 1], ["Price ($)", "3.00", "0.25"]], hl: 2},
      say: "Small box first. $3.00 is 300 cents. 300 cents divided by 12 ounces is 25 cents. So the small box costs 25 cents per ounce. In the ratio table, dividing both rows by 12 gives the column for 1 ounce."},
    {part: "see", board: {m: "eq", lines: ["$3.00 ÷ 12", "= 300 cents ÷ 12", "= 25 cents = $0.25"], hl: 1},
      say: "Why cents? Dividing 3 dollars by 12 is the same as dividing 300 cents by 12, but whole numbers are easier to divide. When you're done, you can change back: 25 cents is $0.25. Both say the same price."},
    {part: "ido", board: {m: "rt", rows: [["Ounces", 20, 1], ["Price ($)", "4.40", "0.22"]], hl: 2},
      say: "Now the big box. $4.40 is 440 cents. 440 cents divided by 20 ounces is 22 cents. So the big box costs 22 cents per ounce. 22 cents is less than 25 cents, so the big box is the better buy, even though its total price is higher. You pay 3 cents less for every single ounce."},
    {part: "ido", board: {m: "eq", lines: ["22 cents per ounce", "15 ounces × 22 cents", "= 330 cents = $3.30"], hl: 2},
      say: "A unit price also lets you find the cost of any amount. If cereal costs 22 cents per ounce, then 15 ounces costs 15 times 22 cents. That's 330 cents, which is $3.30. Unit price times the number of units gives the total price."},
    {part: "ido", board: {m: "eq", lines: ["2 batteries for $3.00: 150 cents each", "10 batteries for $16.00: 160 cents each", "The small pack wins!"], hl: 2},
      say: "Watch one more. A 2-pack of batteries costs $3.00, and a 10-pack costs $16.00. The 2-pack is 300 cents divided by 2, which is 150 cents each. The 10-pack is 1,600 cents divided by 10, which is 160 cents each. This time the small pack is the better buy, by 10 cents a battery. Bigger isn't always better."},
    {part: "wedo", board: {m: "words", big: "6 cans of juice for $4.20"},
      say: "Your turn. A 6-pack of juice costs $4.20. What is the price for one can, in cents? Remember that $4.20 is 420 cents.",
      check: {item: {type: "num", stem: "A 6-pack of juice costs $4.20. What is the price for one can, in cents?", ans: 70, post: "cents",
        traps: [[2520, "That multiplies. Divide the price by the number of cans.", "MULTIPLY_INSTEAD"]], sol: ["$4.20 = 420 cents | Change to cents.", "420 ÷ 6 = 70 | Cents divided by cans."]},
        miss: "420 cents divided by 6 cans is 70 cents per can."}},
    {part: "wedo", board: {m: "words", big: "A: 4 pens for $3.00", small: "B: 10 pens for $6.50"},
      say: "Which is the better buy? Pack A has 4 pens for $3.00. Pack B has 10 pens for $6.50.",
      check: {item: {type: "mc", stem: "Pack A has 4 pens for $3.00. Pack B has 10 pens for $6.50. Which is the better buy?", right: "Pack B", whyRight: "Pack A is 75 cents per pen. Pack B is 65 cents per pen.",
        wrong: [["Pack A", "Pack A costs less in total, but 75 cents per pen is more than 65 cents per pen.", "LOWER_TOTAL"], ["They cost the same per pen", "75 cents and 65 cents aren't the same.", null]],
        sol: ["300 ÷ 4 = 75 cents | Pack A, per pen.", "650 ÷ 10 = 65 cents | Pack B, per pen.", "Pack B | The lower unit price."]},
        miss: "Pack A is 300 cents divided by 4, which is 75 cents per pen. Pack B is 650 cents divided by 10, which is 65 cents per pen. Pack B is the better buy."}},
    {part: "watch", board: {m: "words", big: "Cheaper box isn't always the better buy", small: "Compare the price for 1 unit."},
      say: "Watch out for two traps. First, the lower total price isn't always the better buy. You have to compare unit prices. Second, the bigger package isn't always cheaper per unit either. Stores sometimes charge more per ounce for big sizes. Never guess. Always do the division and compare the price for 1."},
    {part: "recap", board: {m: "words", big: "Divide price by units.", small: "The lower unit price wins."},
      say: "Recap. Unit price is the price divided by the number of units. To find the better buy, compare unit prices: the lower one wins. Working in cents can make the division easier. And you can multiply a unit price by any amount to find what that amount costs. Next time you're at a store, try it on two sizes of the same thing. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "rt", rows: [["Ounces", 12, 60], ["Price ($)", "3.00", "15.00"]], hl: 2},
      say: "Another way: make the amounts match. 60 ounces is 5 small boxes, which cost 5 times $3.00, or $15.00."},
    {part: "see", board: {m: "rt", rows: [["Ounces", 20, 60], ["Price ($)", "4.40", "13.20"]], hl: 2},
      say: "60 ounces is also 3 big boxes, which cost 3 times $4.40, or $13.20. For the same 60 ounces, the big boxes cost less."},
    {part: "recap", board: {m: "words", big: "Same amount, compare the price"},
      say: "So the big box is the better buy, the same answer the unit prices gave. Matching the amount and finding the price for 1 always agree."}
  ],
  notes: {idea: "Unit price is the price divided by the number of units. The lower unit price is the better buy.",
    examples: ["$3.00 ÷ 12 ounces = 25 cents per ounce", "$4.40 ÷ 20 ounces = 22 cents per ounce, the better buy", "15 ounces × 22 cents = $3.30"],
    watch: "The lower total price is not always the better buy."},
  templates: [
    {id: "1.6-ounce", type: "num", tag: "PROCEDURE", diff: 1, est: 30, make(R) {
      const [item, unit, sizes, lo, hi] = pick(R, [["jar of peanut butter", "ounce", [12, 16, 18, 20], 10, 30], ["bag of rice", "pound", [2, 4, 5], 60, 200], ["bottle of juice", "ounce", [32, 48, 64], 4, 9], ["box of cereal", "ounce", [10, 12, 15, 20], 15, 40]]);
      const n = pick(R, sizes), c = unit === "pound" ? 5 * ri(R, lo / 5, hi / 5) : ri(R, lo, hi), total = n * c;
      return {stem: `A ${n}-${unit} ${item} costs ${usd(total)}. What is the price per ${unit}, in cents?`, ans: c, post: "cents",
        traps: traps(c, [[`1/${c}`, `That's ${unit}s per cent. Divide the price by the ${unit}s.`, "DIVIDE_BACKWARD"], [total * n, "That multiplies. Divide the price by the number of units.", "MULTIPLY_INSTEAD"]]),
        hints: [`Change the price to cents: ${usd(total)} is ${fn(total)} cents.`, `Divide: ${fn(total)} ÷ ${n}.`],
        sol: [`${fn(total)} ÷ ${n} = ${c} | Cents divided by ${unit}s.`], p: {n, total}};
    }, verify: it => it.ans * it.p.n === it.p.total},
    {id: "1.6-buy", type: "mc", tag: "CONCEPT", diff: 2, est: 50, make(R) {
      let n1, c1, n2, c2; do { n1 = ri(R, 2, 6); n2 = ri(R, 7, 12); c1 = 5 * ri(R, 8, 30); c2 = 5 * ri(R, 8, 30); } while (c1 === c2);
      const item = pick(R, ["pens", "granola bars", "juice boxes", "markers"]), swap = R() < 0.5;
      const [A, B] = swap ? [[n2, c2], [n1, c1]] : [[n1, c1], [n2, c2]], ta = A[0] * A[1], tb = B[0] * B[1], aBetter = A[1] < B[1];
      const lose = aBetter ? "Pack B" : "Pack A", loseTotalLower = aBetter ? tb < ta : ta < tb, loseBigger = aBetter ? B[0] > A[0] : A[0] > B[0];
      return {stem: `Pack A has ${A[0]} ${item} for ${usd(ta)}. Pack B has ${B[0]} ${item} for ${usd(tb)}. Which is the better buy?`,
        right: aBetter ? "Pack A" : "Pack B", whyRight: `Pack A costs ${A[1]} cents each and Pack B costs ${B[1]} cents each. The lower unit price wins.`,
        wrong: [[lose, `It costs ${Math.max(A[1], B[1])} cents for each item, more than ${Math.min(A[1], B[1])} cents.`, loseTotalLower ? "LOWER_TOTAL" : loseBigger ? "BIGGER_PACK" : null],
          ["They cost the same per item", `${A[1]} cents and ${B[1]} cents aren't the same.`, null], ["You can't tell", "You can: compare the price for 1 item.", null]],
        hints: ["Find the price for 1 item in each pack.", `Pack A: ${fn(ta)} cents ÷ ${A[0]}. Pack B: ${fn(tb)} cents ÷ ${B[0]}.`],
        sol: [`${fn(ta)} ÷ ${A[0]} = ${A[1]} cents | Pack A, for each item.`, `${fn(tb)} ÷ ${B[0]} = ${B[1]} cents | Pack B, for each item.`], p: {na: A[0], ta, nb: B[0], tb}};
    }, verify: it => (it.p.ta * it.p.nb < it.p.tb * it.p.na) === (it.right === "Pack A")},
    {id: "1.6-cost", type: "num", tag: "PROCEDURE", diff: 2, est: 40, make(R) {
      const [what, unit] = pick(R, [["Apples cost", "pound"], ["Grapes cost", "pound"], ["Ribbon costs", "yard"], ["Gas costs", "gallon"]]), c = 5 * ri(R, 15, 79), w = ri(R, 2, 9);
      return {stem: `${what} ${usd(c)} per ${unit}. How much do ${w} ${unit}s cost?`, ...cash(c * w),
        traps: traps(new Q(c * w, 100), [[c * w, `That's the cost in cents. ${fn(c * w)} cents is ${usd(c * w)}.`, null], [new Q(c, 100).add(w).dec(), "That adds. Multiply the price for 1 by the number of units.", null]]),
        hints: ["Multiply the unit price by the number of units.", `Work in cents: ${w} × ${c}.`],
        sol: [`${w} × ${c} = ${fn(c * w)} cents | Unit price times the amount.`, `${fn(c * w)} cents = ${usd(c * w)} | Change back to dollars.`], p: {c, w}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.c * it.p.w)},
    {id: "1.6-bars", type: "num", tag: "APPLICATION", diff: 2, est: 60, word: true, make(R) {
      const who = pick(R, ["Maria", "Dev", "Chloe", "Sam"]), [item, n] = pick(R, [["granola bars", 8], ["juice boxes", 6], ["yogurt cups", 4], ["pencils", 10]]), c = 5 * ri(R, 5, 19);
      let m; do m = ri(R, 3, 3 * n); while (m === n || m % n === 0);
      return {stem: `${who} buys a pack of ${n} ${item} for ${usd(n * c)}. At the same price for each item, how much would ${m} ${item} cost?`, ...cash(m * c),
        traps: traps(new Q(m * c, 100), [[new Q(n * c + 100 * (m - n), 100).dec(), `Each extra item adds ${c} cents, not $1.`, "SKIP_PATTERN"], [new Q(n * c * m, 100).dec(), `That multiplies the pack price by ${m}. Find the price of 1 first.`, "MULTIPLY_INSTEAD"]]),
        frame: {find: [`The cost of ${m} ${item}`, "The price of 1 item", `How many ${item} ${usd(n * c)} buys`], tool: ["Find the price for 1 item, then multiply", "Add $1 for each extra item", `Divide ${m} by ${n}`],
          check: `${m} items at ${c} cents each is ${m} × ${c} = ${fn(m * c)} cents.`},
        hints: ["Find the price of 1 item.", `${fn(n * c)} cents ÷ ${n} = ${c} cents each.`],
        sol: [`${fn(n * c)} ÷ ${n} = ${c} cents | The price for 1.`, `${m} × ${c} = ${fn(m * c)} cents = ${usd(m * c)} | The price for ${m}.`], p: {n, c, m}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.m * it.p.c)},
    {id: "1.6-save", type: "num", tag: "APPLICATION", diff: 3, est: 75, word: true, make(R) {
      const item = pick(R, ["notebooks", "folders", "erasers", "water bottles"]);
      let n1, n2, c1, c2; do { n1 = ri(R, 2, 5); n2 = ri(R, 6, 10); c1 = 5 * ri(R, 10, 40); c2 = 5 * ri(R, 10, 40); } while (c1 === c2 || Math.abs(n1 * c1 - n2 * c2) === Math.abs(c1 - c2));
      const ans = Math.abs(c1 - c2);
      return {stem: `Store A sells ${n1} ${item} for ${usd(n1 * c1)}. Store B sells ${n2} ${item} for ${usd(n2 * c2)}. At the store with the better buy, how many cents less do you pay for each item?`, ans, post: "cents",
        traps: traps(ans, [[Math.abs(n1 * c1 - n2 * c2), "That's the difference in total prices. Compare the price for each item.", "LOWER_TOTAL"]]),
        frame: {find: ["The difference in the price for each item", "The total cost at each store", `Which store sells more ${item}`], tool: ["Find each unit price, then subtract", "Subtract the two total prices", "Add the two prices"],
          check: `Each unit price times its number of ${item} gives back the store's total price.`},
        hints: ["Find the price for 1 item at each store, in cents.", `Store A: ${fn(n1 * c1)} ÷ ${n1}. Store B: ${fn(n2 * c2)} ÷ ${n2}.`],
        sol: [`${fn(n1 * c1)} ÷ ${n1} = ${c1} cents | Store A, for each item.`, `${fn(n2 * c2)} ÷ ${n2} = ${c2} cents | Store B, for each item.`, `${Math.max(c1, c2)} − ${Math.min(c1, c2)} = ${ans} cents | The savings for each item.`], p: {n1, n2, t1: n1 * c1, t2: n2 * c2}};
    }, verify: it => new Q(it.p.t1, it.p.n1).sub(new Q(it.p.t2, it.p.n2)).abs().eq(it.ans)},
    {id: "1.6-true", type: "yn", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      let s1, s2, c1, c2; do { s1 = pick(R, [32, 48, 64, 96]); s2 = pick(R, [16, 24, 32, 48]); c1 = ri(R, 3, 9); c2 = ri(R, 3, 9); } while (s1 === s2 || c1 === c2);
      const t1 = s1 * c1, t2 = s2 * c2, better = c1 < c2 ? "A" : "B";
      const rows = shuffle(R, [[`Juice A costs ${c1} cents per ounce.`, true, `${fn(t1)} ÷ ${s1} = ${c1}.`], [`Juice B costs ${c2 + 1} cents per ounce.`, false, `${fn(t2)} ÷ ${s2} = ${c2}, not ${c2 + 1}.`],
        [`Juice ${better} is the better buy.`, true, `${Math.min(c1, c2)} cents per ounce is less than ${Math.max(c1, c2)} cents.`], ["The juice with the lower total price is always the better buy.", false, "Compare unit prices, not total prices."]]);
      return {stem: `Juice A is ${s1} ounces for ${usd(t1)}. Juice B is ${s2} ounces for ${usd(t2)}. Is each statement true?`, rows,
        hints: ["Find the price per ounce of each juice, in cents.", `Juice A: ${fn(t1)} ÷ ${s1}. Juice B: ${fn(t2)} ÷ ${s2}.`],
        sol: [`${fn(t1)} ÷ ${s1} = ${c1} cents | Juice A, per ounce.`, `${fn(t2)} ÷ ${s2} = ${c2} cents | Juice B, per ounce.`], p: {s1, s2, t1, t2}};
    }, verify: it => it.rows.every(r => {
      const {s1, s2, t1, t2} = it.p, x = (r.t.match(/\d+/) || [])[0];
      if (/better buy/.test(r.t) && /Juice [AB]/.test(r.t)) return ((t1 * s2 < t2 * s1) === / A /.test(r.t)) === r.ok;
      if (/always/.test(r.t)) return r.ok === false;
      return (/Juice A/.test(r.t) ? Number(x) * s1 === t1 : Number(x) * s2 === t2) === r.ok;
    })}
  ]
});

// =====================================================================================================
// 1.7 Speed, distance and time
add("1.7", {
  prereq: ["1.5"],
  vocab: [["speed", "How far something goes in one unit of time, like 60 miles per hour."],
    ["distance", "How far something travels."],
    ["constant speed", "Going the same speed the whole time, never speeding up or slowing down."]],
  misconceptions: {
    DIVIDE_BACKWARD: "Speed is distance ÷ time, not time ÷ distance.",
    WRONG_OPERATION: "Pick the operation from what you know: distance = speed × time, and speed or time come from dividing.",
    UNIT_MIX: "Make the units match: if the speed is per hour, change minutes to hours first.",
    MIN_PER_MILE: "Fewer minutes per mile means faster, not slower."
  },
  script: [
    {part: "hook", board: {m: "words", big: "240 miles in 4 hours", small: "How far in 7 hours?"},
      say: "A train travels 240 miles in 4 hours at a constant speed. Constant speed means it never speeds up or slows down. How far will it go in 7 hours? How long would it take to go 420 miles? Trains, cars, runners, even snails: they all have a speed. And speed is a unit rate, so everything you've learned about rates works here too."},
    {part: "idea", board: {m: "eq", lines: ["speed = distance ÷ time", "distance = speed × time", "time = distance ÷ speed"], hl: 0},
      say: "Speed is distance per unit of time, like miles per hour. If you know the distance and the time, divide to find the speed. If you know the speed and the time, multiply to find the distance. And if you know the distance and the speed, divide the distance by the speed to find the time. Three facts, one idea. You don't need to memorize tricks if you remember that speed is a unit rate.",
      why: "All three come from one rate. Speed says how many miles go with each hour, so more hours means more miles."},
    {part: "see", board: {m: "dnl", top: ["Hours", 0, 1, 2, 3, 4, 5, 6, 7], bot: ["Miles", 0, 60, 120, 180, 240, 300, 360, 420], hl: 7},
      say: "On a double number line, 4 hours lines up with 240 miles. Each hour is 240 divided by 4, which is 60 miles. So the speed is 60 miles per hour. Now keep stepping along the line: 5 hours is 300 miles, 6 hours is 360 miles, and 7 hours is 420 miles. Notice that every step of 1 hour on the top line matches a step of 60 miles on the bottom line."},
    {part: "ido", board: {m: "eq", lines: ["60 miles per hour × 7 hours", "= 420 miles"], hl: 1},
      say: "The formula gets there faster. Distance is speed times time. 60 miles per hour times 7 hours is 420 miles. That matches the number line. When the numbers get big, the formula saves you from drawing a very long line."},
    {part: "ido", board: {m: "eq", lines: ["420 miles ÷ 60 miles per hour", "= 7 hours"], hl: 1},
      say: "Now backward. How long does it take to travel 420 miles at 60 miles per hour? Divide the distance by the speed. 420 divided by 60 is 7, so it takes 7 hours. Check it: 60 miles per hour for 7 hours is 60 times 7, which is 420 miles. It matches, so the answer is right."},
    {part: "see", board: {m: "eq", lines: ["Runner 1: 30 minutes ÷ 3 miles = 10 minutes per mile", "Runner 2: 36 minutes ÷ 4 miles = 9 minutes per mile", "Fewer minutes per mile is faster"], hl: 2},
      say: "Speed also lets you compare. A runner who covers 3 miles in 30 minutes takes 10 minutes for each mile. A runner who covers 4 miles in 36 minutes takes 9 minutes for each mile. Fewer minutes per mile means faster, so the second runner is faster. Minutes per mile is a rate too, just turned around."},
    {part: "ido", board: {m: "eq", lines: ["30 minutes = 1/2 hour", "60 × 1/2 = 30 miles"], hl: 1},
      say: "Watch the units. If the train runs for 30 minutes, don't multiply 60 by 30. That would give 1,800 miles in half an hour, which is impossible. The speed is per hour, so change 30 minutes to one half of an hour. 60 times one half is 30 miles.",
      why: "Units have to match. Miles per hour times hours gives miles. Miles per hour times minutes doesn't."},
    {part: "wedo", board: {m: "words", big: "36 miles in 3 hours"},
      say: "Your turn. A cyclist rides 36 miles in 3 hours at a constant speed. What is her speed, in miles per hour?",
      check: {item: {type: "num", stem: "A cyclist rides 36 miles in 3 hours at a constant speed. What is her speed?", ans: 12, post: "miles per hour",
        traps: [[108, "That multiplies. Speed is distance divided by time.", "WRONG_OPERATION"], ["1/12", "That's hours per mile. Speed is miles divided by hours.", "DIVIDE_BACKWARD"]],
        sol: ["36 ÷ 3 = 12 | Miles divided by hours."]},
        miss: "Speed is distance divided by time: 36 divided by 3 is 12 miles per hour."}},
    {part: "wedo", board: {m: "words", big: "55 miles per hour for 4 hours"},
      say: "A car drives at 55 miles per hour for 4 hours. How far does it go?",
      check: {item: {type: "num", stem: "A car drives at 55 miles per hour for 4 hours. How far does it go?", ans: 220, post: "miles",
        traps: [[59, "That adds. Distance is speed times time.", "WRONG_OPERATION"], ["55/4", "That divides. Distance is speed times time.", "WRONG_OPERATION"]],
        sol: ["55 × 4 = 220 | Speed times time."]},
        miss: "Distance is speed times time: 55 times 4 is 220 miles."}},
    {part: "watch", board: {m: "words", big: "Match the units first", small: "15 minutes = 1/4 hour · 30 minutes = 1/2 hour · 45 minutes = 3/4 hour"},
      say: "Watch out for two mistakes. Speed is distance divided by time, not time divided by distance. And make the units match before you calculate. If the speed is in miles per hour, the time has to be in hours. 15 minutes is one fourth of an hour, 30 minutes is one half, 45 minutes is three fourths, and 20 minutes is one third."},
    {part: "recap", board: {m: "eq", lines: ["speed = distance ÷ time", "distance = speed × time", "time = distance ÷ speed"]},
      say: "Recap. Speed is a unit rate: distance per unit of time. Divide distance by time to find speed. Multiply speed by time to find distance. Divide distance by speed to find time. Make sure the units match, and check your answer by working backward. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "rt", rows: [["Hours", 4, 1, 7], ["Miles", 240, 60, 420]], hl: 3},
      say: "Another way is a ratio table. 4 hours goes with 240 miles. Divide both rows by 4: 1 hour goes with 60 miles. Multiply both rows by 7: 7 hours goes with 420 miles."},
    {part: "see", board: {m: "rt", rows: [["Hours", 1, 7], ["Miles", 60, 420]], hl: 2},
      say: "Going backward, start from the 1-hour column and ask: 60 times what is 420? 60 times 7 is 420, so it takes 7 hours."},
    {part: "recap", board: {m: "words", big: "The table and the formula always agree"},
      say: "The ratio table and the speed formula always give the same answer. Use whichever one makes the numbers easier."}
  ],
  notes: {idea: "Speed is distance divided by time. Distance is speed times time. Time is distance divided by speed.",
    examples: ["240 miles in 4 hours: 60 miles per hour", "60 miles per hour × 7 hours = 420 miles", "420 miles ÷ 60 miles per hour = 7 hours", "30 minutes at 60 miles per hour: 60 × 1/2 = 30 miles"],
    watch: "Make the units match: change minutes to hours when the speed is per hour."},
  templates: [
    {id: "1.7-speed", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const who = pick(R, ["A train", "A car", "A bus", "A boat"]), h = ri(R, 2, 6), s = 5 * ri(R, 4, 14), D = s * h;
      return {stem: `${who} travels ${D} miles in ${h} hours at a constant speed. What is its speed?`, ans: s, post: "miles per hour",
        traps: traps(s, [[D * h, "That multiplies. Speed is distance divided by time.", "WRONG_OPERATION"], [`${h}/${D}`, "That's hours per mile. Speed is miles divided by hours.", "DIVIDE_BACKWARD"]]),
        hints: ["Speed = distance ÷ time.", `Divide: ${D} ÷ ${h}.`], sol: [`${D} ÷ ${h} = ${s} | Miles divided by hours.`], p: {D, h}};
    }, verify: it => it.ans * it.p.h === it.p.D},
    {id: "1.7-dist", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const who = pick(R, ["A cyclist rides", "A boat sails", "A horse gallops", "A runner runs"]), s = ri(R, 6, 20), t = ri(R, 2, 6), ans = s * t;
      return {stem: `${who} at ${s} miles per hour for ${t} hours. How far does it go?`, ans, post: "miles",
        traps: traps(ans, [[s + t, "That adds. Distance is speed times time.", "WRONG_OPERATION"], [new Q(s, t).frac(), "That divides. Distance is speed times time.", "WRONG_OPERATION"]]),
        hints: ["Distance = speed × time.", `Multiply: ${s} × ${t}.`], sol: [`${s} × ${t} = ${ans} | Speed times time.`], p: {s, t}};
    }, verify: it => Q.of(it.ans).div(it.p.t).eq(it.p.s)},
    {id: "1.7-time", type: "num", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const s = 5 * ri(R, 6, 14), t = ri(R, 2, 8), D = s * t;
      return {stem: `How long does it take to drive ${D} miles at ${s} miles per hour?`, ans: t, post: "hours",
        traps: traps(t, [[D * s, "That multiplies. Time is distance divided by speed.", "WRONG_OPERATION"], [`${s}/${D}`, "That divides the wrong way. Divide the distance by the speed.", "DIVIDE_BACKWARD"]]),
        hints: ["Time = distance ÷ speed.", `Divide: ${D} ÷ ${s}.`], sol: [`${D} ÷ ${s} = ${t} | Distance divided by speed.`, `Check: ${s} × ${t} = ${D} | Speed times time gives back the distance.`], p: {D, s}};
    }, verify: it => it.ans * it.p.s === it.p.D},
    {id: "1.7-minutes", type: "num", tag: "PROCEDURE", diff: 3, est: 50, make(R) {
      const s = 12 * ri(R, 2, 6), m = pick(R, [15, 20, 30, 40, 45, 90]), ans = s * m / 60, part = new Q(m, 60);
      return {stem: `A car travels at ${s} miles per hour. How far does it go in ${m} minutes?`, ans, post: "miles",
        traps: traps(ans, [[s * m, "The speed is per hour, but that multiplies by minutes. Change the minutes to hours first.", "UNIT_MIX"], [new Q(s, m).frac(), "That divides. Change the minutes to hours, then multiply.", "WRONG_OPERATION"]]),
        hints: [`Change ${m} minutes to hours: there are 60 minutes in an hour.`, `${m} minutes = ${part.mixed()} hour${part.value > 1 ? "s" : ""}. Now multiply by ${s}.`],
        sol: [`${m} minutes = ${m}/60 hour = ${part.mixed()} hour | 60 minutes is 1 hour.`, `${s} × ${part.mixed()} = ${ans} | Speed times time, both in hours.`], p: {s, m}};
    }, verify: it => Q.of(it.ans).mul(60).eq(it.p.s * it.p.m)},
    {id: "1.7-train", type: "num", tag: "APPLICATION", diff: 2, est: 55, word: true, make(R) {
      const s = 5 * ri(R, 8, 16), h1 = ri(R, 2, 4); let h2; do h2 = ri(R, 3, 9); while (h2 === h1);
      const D1 = s * h1, ans = s * h2;
      return {stem: `A train travels ${D1} miles in ${h1} hours. At the same speed, how far will it travel in ${h2} hours?`, ans, post: "miles",
        traps: traps(ans, [[D1 + h2 - h1, `Each extra hour adds ${s} miles, not 1.`, "SKIP_PATTERN"], [D1 * h2, `That multiplies the whole distance by ${h2}. Find the miles for 1 hour first.`, "MULTIPLY_INSTEAD"]]),
        frame: {find: [`The distance in ${h2} hours`, "The train's speed", "The time for the trip"], tool: [`Find the speed in miles per hour, then multiply by ${h2}`, "Add the hours to the miles", `Divide the miles by ${h2}`],
          check: `${ans} miles in ${h2} hours is ${s} miles per hour, the same speed as before.`},
        hints: ["Find the speed first: miles for 1 hour.", `${D1} ÷ ${h1} = ${s} miles per hour.`],
        sol: [`${D1} ÷ ${h1} = ${s} | The speed, in miles per hour.`, `${s} × ${h2} = ${ans} | Distance = speed × time.`], p: {D1, h1, h2}};
    }, verify: it => eqRatio(it.p.h1, it.p.D1, it.p.h2, it.ans)},
    {id: "1.7-runners", type: "mc", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      const [p1, p2] = twoDiff(R, 7, 12), m1 = ri(R, 2, 5), m2 = ri(R, 2, 5), [n1, n2] = pick(R, [["Ava", "Ben"], ["Lena", "Omar"], ["Kai", "Zoe"]]), aWins = p1 < p2;
      return {stem: `${n1} runs ${m1} miles in ${m1 * p1} minutes. ${n2} runs ${m2} miles in ${m2 * p2} minutes. Who is faster?`, right: aWins ? n1 : n2,
        whyRight: `${n1} takes ${p1} minutes per mile and ${n2} takes ${p2}. Fewer minutes per mile is faster.`,
        wrong: [[aWins ? n2 : n1, `${aWins ? n2 : n1} takes ${Math.max(p1, p2)} minutes for each mile, which is slower.`, "MIN_PER_MILE"], ["They run at the same speed", `${p1} and ${p2} minutes per mile aren't the same.`, null], ["You can't tell", "You can tell: compare the minutes for 1 mile.", null]],
        hints: ["Find each runner's minutes for 1 mile.", `${n1}: ${m1 * p1} ÷ ${m1}. ${n2}: ${m2 * p2} ÷ ${m2}.`],
        sol: [`${m1 * p1} ÷ ${m1} = ${p1} | ${n1}, minutes per mile.`, `${m2 * p2} ÷ ${m2} = ${p2} | ${n2}, minutes per mile.`, `${aWins ? n1 : n2} is faster | Fewer minutes for each mile.`], p: {m1, t1: m1 * p1, m2, t2: m2 * p2, n1}};
    }, verify: it => (it.p.t1 * it.p.m2 < it.p.t2 * it.p.m1) === (it.right === it.p.n1)},
    {id: "1.7-table", type: "table", tag: "PROCEDURE", diff: 1, est: 35, make(R) {
      const s = ri(R, 20, 75), hrs = [1, 2, 3, 5], cols = shuffle(R, [2, 3, 4]).slice(0, 2).sort();
      return {stem: `A car drives at a constant ${s} miles per hour. Fill in the table.`, rows: [["Hours", ...hrs], ["Miles", ...hrs.map(h => h * s)]], blanks: cols.map(c => [1, c]),
        hints: ["Each hour adds the same number of miles.", `Miles = ${s} × hours.`],
        sol: cols.map(c => `${s} × ${hrs[c - 1]} = ${s * hrs[c - 1]} | Speed times time.`), p: {s}};
    }, verify: it => it.blanks.every(([, c]) => it.rows[1][c] === it.p.s * it.rows[0][c])}
  ]
});

// =====================================================================================================
// 1.8 Percent as a rate per 100
const FP = [["1/2", 50], ["1/4", 25], ["3/4", 75], ["1/5", 20], ["2/5", 40], ["3/5", 60], ["4/5", 80], ["1/10", 10], ["3/10", 30], ["7/10", 70], ["9/10", 90], ["1/20", 5]];
add("1.8", {
  prereq: ["1.2"],
  vocab: [["percent", "A rate per 100. 30% means 30 out of 100."],
    ["percent sign", "The symbol written after a number to mean percent. 30% is read as 30 percent."],
    ["hundredths", "Parts of a whole split into 100 equal parts. 30 hundredths is 30%."]],
  misconceptions: {
    DIGITS_AS_PCT: "A fraction's digits aren't its percent: 3/4 is 75%, not 34%. Make the bottom 100 first.",
    DECIMAL_SHIFT: "Percent to decimal means dividing by 100: 7% is 0.07, not 0.7.",
    NOT_PER_100: "Percent always compares to 100: 30% means 30 out of 100."
  },
  script: [
    {part: "hook", board: {m: "grid", n: 30},
      say: "This grid has 100 squares, and 30 of them are shaded. What part of the grid is shaded? You could say 30 out of 100, or 30 hundredths. There's a shorter way to say it, and you've seen it on store signs, test scores and phone batteries: 30 percent."},
    {part: "idea", board: {m: "eq", lines: ["percent means per 100", "30% = 30 out of 100 = 30/100 = 0.30"], hl: 1},
      say: "Percent means per 100. The word comes from per cent, and cent means 100, like the 100 cents in a dollar. So 30 percent means 30 out of 100. You can write it as a percent with the percent sign, as the fraction 30 hundredths, or as the decimal 0.30. All three name the same amount.",
      why: "A percent is a rate, like miles per hour, except the second quantity is always 100."},
    {part: "see", board: {m: "grid", n: 50},
      say: "The whole grid is all 100 squares, so the whole is 100 percent. Half the grid is 50 squares, which is 50 percent. One square is 1 percent. Percents let you compare parts of different wholes, because every whole becomes 100. Percents are everywhere: a phone battery at 50 percent is half full, and a test score of 90 percent means 90 points out of every 100."},
    {part: "see", board: {m: "words", big: "$1 = 100 cents", small: "a quarter = 25 cents = 25% of a dollar"},
      say: "Money is a great way to think about percent. A dollar is 100 cents. A quarter is 25 cents, so it's 25 percent of a dollar. A dime is 10 percent of a dollar, and a penny is 1 percent. 3 quarters is 75 cents, which is 75 percent of a dollar, the same as 3 fourths of a dollar."},
    {part: "see", board: {m: "grid", n: 75},
      say: "What if the whole isn't 100? Say 3 out of 4 students like pizza. Make the whole 100 using an equivalent fraction. 4 times 25 is 100, so multiply the top by 25 too. 3 times 25 is 75. So 3 fourths is the same as 75 hundredths, and 3 out of 4 is 75 percent. Here are 75 of the 100 squares shaded."},
    {part: "ido", board: {m: "eq", lines: ["2/5 = ?/100", "5 × 20 = 100", "2 × 20 = 40", "2/5 = 40/100 = 40%"], hl: 3},
      say: "Watch me turn 2 fifths into a percent. What turns 5 into 100? Multiply by 20. Do the same to the top: 2 times 20 is 40. So 2 fifths is 40 hundredths, which is 40 percent. It's the same move as finding an equivalent ratio."},
    {part: "ido", board: {m: "eq", lines: ["45% = 45/100 = 0.45", "7% = 7/100 = 0.07", "100% = 1 whole"], hl: 1},
      say: "Percents also turn into decimals. Divide by 100, which moves the decimal point two places to the left. 45 percent is 45 hundredths, which is 0.45. Be careful with small percents. 7 percent is 7 hundredths, which is 0.07, not 0.7. And 100 percent is the whole thing, which is 1."},
    {part: "wedo", board: {m: "words", big: "Shade 35%"},
      say: "Your turn. Shade 35 percent of the grid. Tap a square to shade up to it, or use the row buttons.",
      check: {item: {type: "grid", stem: "Shade 35% of the grid.", n: 35, sol: ["35% = 35/100 | Shade 35 of the 100 squares: 3 rows of 10 and 5 more."]},
        miss: "35 percent is 35 out of 100 squares: 3 full rows of 10, and 5 more."}},
    {part: "wedo", board: {m: "eq", lines: ["3/4 = ?/100"]},
      say: "Write 3 fourths as a percent. Make the bottom number 100 first.",
      check: {item: {type: "num", stem: `Write ${M6.fr(3, 4)} as a percent.`, ans: 75, unit: "%",
        traps: [[34, "The digits of a fraction aren't its percent. Make the bottom number 100.", "DIGITS_AS_PCT"], ["0.75", "That's the decimal. A percent is out of 100, so it's 75%.", null]],
        sol: ["3/4 = 75/100 | Multiply the top and bottom by 25.", "75/100 = 75% | Per 100 means percent."]},
        miss: "4 times 25 is 100, so 3 times 25 is 75. 3 fourths is 75 hundredths, which is 75 percent."}},
    {part: "watch", board: {m: "eq", lines: ["3/4 → 34% ✗", "3/4 = 75/100 = 75% ✓", "7% = 0.07 ✓"], strike: [0]},
      say: "Watch out. The digits of a fraction aren't its percent. 3 fourths is 75 percent, not 34 percent. Always make the whole 100 first. And when you write a percent as a decimal, 7 percent is 0.07, with two places after the point, because it's 7 hundredths. 0.7 would be 70 percent."},
    {part: "recap", board: {m: "words", big: "Percent = out of 100", small: "50% is half, 25% is a fourth, 100% is the whole"},
      say: "Recap. Percent means per 100. To write a fraction as a percent, find an equivalent fraction with 100 on the bottom. To write a percent as a decimal, divide by 100. 100 percent is one whole, 50 percent is half, 25 percent is a fourth, and 1 percent is one square of the grid. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["100%", 10, "10%"]]},
      say: "Another way: picture a bar split into 10 equal parts. The whole bar is 100 percent, so each part is 10 percent."},
    {part: "see", board: {m: "tape", rows: [["100%", 10, "10%"], ["30%", 3, "10%"], ["70%", 7, "10%"]]},
      say: "3 parts is 30 percent, and 7 parts is 70 percent. Half the bar, 5 parts, is 50 percent."},
    {part: "recap", board: {m: "eq", lines: ["3 of 10 parts = 30/100 = 30%"]},
      say: "Each part is one tenth, and one tenth is 10 hundredths. So counting parts of 10 is the same as counting percent by tens."}
  ],
  notes: {idea: "Percent means per 100. To write a fraction as a percent, make the bottom 100. To write a percent as a decimal, divide by 100.",
    examples: ["30 of 100 squares = 30/100 = 30%", "3/4 = 75/100 = 75%", "2/5 = 40/100 = 40% = 0.40", "7% = 0.07"],
    watch: "3/4 is 75%, not 34%. 7% is 0.07, not 0.7."},
  templates: [
    {id: "1.8-shade", type: "grid", tag: "PROCEDURE", diff: 1, est: 30, make(R) {
      const n = ri(R, 5, 95);
      return {stem: `Shade ${n}% of the grid.`, n, hints: ["Percent means out of 100, and the grid has 100 squares.", `Shade ${Math.floor(n / 10)} full row${Math.floor(n / 10) === 1 ? "" : "s"} of 10${n % 10 ? `, then ${n % 10} more` : ""}.`],
        sol: [`${n}% = ${n}/100 | Shade ${n} of the 100 squares.`], p: {n}};
    }, verify: it => it.n === it.p.n},
    {id: "1.8-frac", type: "num", tag: "PROCEDURE", diff: 2, est: 30, make(R) {
      const b = pick(R, [2, 4, 5, 10, 20, 25, 50]); let a; do a = ri(R, 1, b - 1); while (b <= 10 && gcd(a, b) !== 1);
      const ans = a * 100 / b, dig = Number(`${a}${b}`);
      return {stem: `Write ${M6.fr(a, b)} as a percent.`, ans, unit: "%",
        traps: traps(ans, [[dig, "The digits of a fraction aren't its percent. Make the bottom number 100.", "DIGITS_AS_PCT"], [new Q(a, b).dec(), "That's the decimal. A percent is out of 100: multiply by 100.", null]]),
        hints: ["Find an equivalent fraction with 100 on the bottom.", `${b} × ${100 / b} = 100, so multiply ${a} by ${100 / b} too.`],
        sol: [`${a}/${b} = ${ans}/100 | Multiply the top and bottom by ${100 / b}.`, `${ans}/100 = ${ans}% | Per 100 means percent.`], p: {a, b}};
    }, verify: it => new Q(it.ans, 100).eq(new Q(it.p.a, it.p.b))},
    {id: "1.8-dec", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const p = pick(R, [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25, 30, 45, 60, 75, 82]), ans = new Q(p, 100).dec();
      return {stem: `Write ${p}% as a decimal.`, ans, form: "decimal",
        traps: traps(ans, [[new Q(p, 10).dec(), `${p}% is ${p} hundredths, so divide by 100, not 10.`, "DECIMAL_SHIFT"], [p, "That's the percent. Divide by 100 to write it as a decimal.", null]]),
        hints: ["Percent means hundredths.", `${p}% = ${p}/100.`],
        sol: [`${p}% = ${p}/100 = ${ans} | Divide by 100: move the decimal point two places left.`], p: {p}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.p)},
    {id: "1.8-equal", type: "multi", tag: "CONCEPT", diff: 2, est: 35, make(R) {
      const [f, p] = pick(R, FP.filter(x => x[1] >= 10).concat([["3/20", 15], ["7/20", 35], ["9/20", 45], ["11/20", 55], ["13/20", 65], ["17/20", 85], ["3/25", 12], ["6/25", 24]])), d = new Q(p, 100).dec(), small = new Q(p, 1000).dec();
      return {stem: `Which are equal to ${p}%? Choose all that apply.`,
        opts: [[`${p}/100`, true, "Percent means per 100."], [d, true, `${p} hundredths.`], [f, true, `${f} = ${p}/100.`], [small, false, `${small} is ${p} thousandths, which is only ${new Q(p, 10).dec()}%.`], [`${p}/10`, false, `${p}/10 is ${p} tenths, much more than ${p} hundredths.`]],
        hints: ["Write the percent as a fraction out of 100 first.", `${p}% = ${p}/100. Which choices have the same value?`],
        sol: [`${p}% = ${p}/100 = ${d} = ${f} | Three names for the same amount.`], p: {p}};
    }, verify: it => it.opts.every(o => Q.of(o.t).eq(new Q(it.p.p, 100)) === o.ok)},
    {id: "1.8-pets", type: "num", tag: "APPLICATION", diff: 2, est: 45, word: true, make(R) {
      const W = pick(R, [20, 25, 50]), a = ri(R, 1, W - 1), ans = a * 100 / W, [what, has] = pick(R, [["students", "have a pet"], ["students", "walk to school"], ["players", "wear glasses"]]);
      return {stem: `In a group of ${W} ${what}, ${a} ${has}. What percent of the group ${has.replace(/^have/, "has").replace(/^walk/, "walks").replace(/^wear/, "wears")}?`, ans, unit: "%",
        traps: traps(ans, [[a, `${a} is how many ${what}, not the percent. Write ${a} out of ${W} as a percent.`, "NOT_PER_100"], [(W - a) * 100 / W, `That's the percent who don't. The question asks about the ${what} who ${has}.`, null]]),
        frame: {find: [`The percent of ${what} who ${has}`, `How many ${what} ${has}`, `How many ${what} don't`], tool: ["Write the part over the whole, then make the bottom 100", `Subtract ${a} from ${W}`, `Multiply ${a} by ${W}`],
          check: `${ans}% of ${W} ${what} should be ${a} ${what}.`},
        hints: [`Write the fraction: ${a} out of ${W}.`, `${W} × ${100 / W} = 100, so multiply ${a} by ${100 / W} too.`],
        sol: [`${a}/${W} = ${ans}/100 | Multiply the top and bottom by ${100 / W}.`, `${ans}/100 = ${ans}% | Per 100 means percent.`], p: {a, W}};
    }, verify: it => new Q(it.ans, 100).eq(new Q(it.p.a, it.p.W))},
    {id: "1.8-match", type: "match", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      const four = shuffle(R, FP).slice(0, 4);
      return {stem: "Match each fraction to its percent.", pairs: four.map(([f, p]) => [f, `${p}%`]),
        hints: ["Make each bottom number 100.", `For example, ${four[0][0]} = ${four[0][1]}/100.`],
        sol: four.map(([f, p]) => `${f} = ${p}/100 = ${p}% | Same amount out of 100.`), p: {}};
    }, verify: it => it.pairs.every(([f, p]) => Q.of(f).mul(100).eq(Number(p.replace("%", ""))))},
    {id: "1.8-eighths", type: "num", tag: "PROCEDURE", diff: 3, est: 45, make(R) {
      const b = pick(R, [8, 40, 200]); let a; do a = ri(R, 1, b - 1); while (gcd(a, b) !== 1 || (a * 100) % b === 0);
      const d = new Q(a, b).dec(), ans = new Q(a * 100, b).dec();
      return {stem: `Write ${M6.fr(a, b)} as a percent.`, ans, unit: "%", keys: "dec",
        traps: traps(ans, [[d, "That's the decimal. Multiply by 100 to get the percent.", null]]),
        hints: ["Divide the top by the bottom to get a decimal, then multiply by 100.", `${a} ÷ ${b} = ${d}.`],
        sol: [`${a} ÷ ${b} = ${d} | Divide to get a decimal.`, `${d} × 100 = ${ans}% | Multiply by 100 for the percent.`], p: {a, b}};
    }, verify: it => Q.of(it.ans).eq(new Q(it.p.a * 100, it.p.b))}
  ]
});

// =====================================================================================================
// 1.9 Percent of a number
add("1.9", {
  prereq: ["1.8"],
  vocab: [["percent of a number", "A part of a number. 25% of 80 means 25/100 of 80, which is 20."],
    ["benchmark percents", "Easy percents to use: 50% is half, 25% is a fourth, 10% is a tenth, 1% is a hundredth."],
    ["discount", "The amount taken off a price."]],
  misconceptions: {
    DIVIDE_BY_PERCENT: "Don't divide by the percent: 20% of 60 isn't 60 ÷ 20. It's 20/100 × 60 = 12.",
    FORGOT_100: "Percent means hundredths: multiply by 20/100, not by 20.",
    PCT_AS_AMOUNT: "The percent isn't the amount: 20% of 60 is 12, not 20.",
    SALE_VS_SAVE: "The discount is what you save. The sale price is what's left to pay."
  },
  script: [
    {part: "hook", board: {m: "words", big: "25% off an $80 jacket", small: "How much do you save?"},
      say: "A jacket costs $80, and there's a sign that says 25 percent off. How much money do you save? To answer, you need to find 25 percent of 80. There are several smart ways to do it, and by the end of this lesson you'll be able to do many of them in your head, right there in the store."},
    {part: "idea", board: {m: "eq", lines: ["25% of 80 = 25/100 × 80", "= 1/4 × 80 = 20"], hl: 1},
      say: "25 percent of 80 means 25 hundredths of 80. And 25 hundredths simplifies to 1 fourth. So 25 percent of 80 is the same as one fourth of 80. 80 divided by 4 is 20, so you save $20. In math, the word of usually means multiply: 25 percent of 80 is 25 hundredths times 80.",
      why: "A percent is a rate per 100. 25 percent means 25 for every 100, so for 80 you get 25 hundredths of 80."},
    {part: "see", board: {m: "tape", rows: [["$80", 4, "$20"], ["25%", 1, "$20"]]},
      say: "Here's $80 split into 4 equal parts. Each part is $20. One part out of four is 25 percent. So 25 percent of $80 is one part, which is $20. Two parts would be 50 percent, or $40, and three parts would be 75 percent, or $60. Notice that 25 percent plus 75 percent is 100 percent, the whole price of the jacket."},
    {part: "idea", board: {m: "eq", lines: ["50%: half, ÷ 2", "25%: a fourth, ÷ 4", "10%: a tenth, ÷ 10", "1%: a hundredth, ÷ 100"]},
      say: "Some percents are benchmarks, because they're so easy to find. 50 percent is half, so divide by 2. 25 percent is a fourth, so divide by 4. 10 percent is a tenth, so divide by 10. And 1 percent is a hundredth, so divide by 100."},
    {part: "see", board: {m: "eq", lines: ["10% of 60 = 6", "30% of 60 = 3 × 6 = 18", "5% of 60 = half of 6 = 3"], hl: 1},
      say: "You can build other percents from the benchmarks. 10 percent of 60 is 60 divided by 10, which is 6. 30 percent is 3 times as much: 3 times 6 is 18. 5 percent is half of 10 percent: half of 6 is 3. So 35 percent of 60 would be 18 plus 3, which is 21."},
    {part: "ido", board: {m: "rt", rows: [["Percent", 100, 10, 30, 5, 35], ["Amount", 240, 24, 72, 12, 84]], hl: 5},
      say: "Watch me find 35 percent of 240 with a ratio table. 100 percent is 240. Divide both rows by 10: 10 percent is 24. Multiply by 3: 30 percent is 72. Half of 10 percent is 5 percent, which is 12. 30 percent plus 5 percent is 35 percent, so add: 72 plus 12 is 84. So 35 percent of 240 is 84."},
    {part: "ido", board: {m: "eq", lines: ["15% of 40 = 0.15 × 40 = 6", "10% of 40 = 4, 5% of 40 = 2", "4 + 2 = 6"], hl: 0},
      say: "You can also use decimals. 15 percent is 0.15, and 0.15 times 40 is 6. That's the same as 10 percent of 40, which is 4, plus 5 percent of 40, which is 2. Two ways, one answer."},
    {part: "wedo", board: {m: "words", big: "10% of 90"},
      say: "Your turn. What is 10 percent of 90?",
      check: {item: {type: "num", stem: "What is 10% of 90?", ans: 9, traps: [[900, "That's 10 times 90. 10% is a tenth: divide by 10.", "FORGOT_100"], [10, "10 is the percent, not the amount.", "PCT_AS_AMOUNT"]],
        sol: ["90 ÷ 10 = 9 | 10% is a tenth."]},
        miss: "10 percent is a tenth: 90 divided by 10 is 9."}},
    {part: "wedo", board: {m: "words", big: "20% of 45"},
      say: "Now find 20 percent of 45. Try finding 10 percent first, then double it.",
      check: {item: {type: "num", stem: "What is 20% of 45?", ans: 9, traps: [["2.25", "That divides 45 by 20. Don't divide by the percent.", "DIVIDE_BY_PERCENT"], [900, "That multiplies by 20. Multiply by 20/100 instead.", "FORGOT_100"]],
        sol: ["45 ÷ 10 = 4.5 | 10% of 45.", "4.5 × 2 = 9 | 20% is double 10%."]},
        miss: "10 percent of 45 is 4.5. Double it: 20 percent of 45 is 9."}},
    {part: "watch", board: {m: "eq", lines: ["20% of 60 is not 60 ÷ 20 ✗", "20% of 60 = 0.20 × 60 = 12 ✓"], strike: [0]},
      say: "Watch out. Don't divide by the percent: 20 percent of 60 is not 60 divided by 20. And don't forget the hundredths: 20 percent means 20 hundredths, so you multiply by 0.20, not by 20. Here's a quick check: 20 percent is less than half, so the answer must be less than half of 60, which is 30. And if the percent is less than 100 but your answer is bigger than the number you started with, something went wrong."},
    {part: "recap", board: {m: "words", big: "Percent of a number = percent/100 × number", small: "50% half · 25% a fourth · 10% a tenth · 1% a hundredth"},
      say: "Recap. To find a percent of a number, multiply the number by the percent as a fraction or a decimal. Benchmarks make it quick: 50 percent is half, 25 percent is a fourth, 10 percent is a tenth, and 1 percent is a hundredth. Build other percents from these. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "dnl", top: ["Percent", 0, 25, 50, 75, 100], bot: ["Dollars", 0, 20, 40, 60, 80], hl: 1},
      say: "On a double number line, 100 percent lines up with $80. Split both lines into 4 equal parts. 25 percent lines up with $20, 50 percent with $40, and 75 percent with $60."},
    {part: "see", board: {m: "eq", lines: ["25% of $80 = $20 saved", "$80 − $20 = $60 to pay"], hl: 1},
      say: "So the discount is $20, and you'd pay 80 minus 20, which is $60. That's 75 percent of the price, the part you still pay."},
    {part: "recap", board: {m: "words", big: "Percent off + percent you pay = 100%"},
      say: "The percent you save and the percent you pay always add up to 100 percent, because together they make the whole price."}
  ],
  notes: {idea: "A percent of a number is the percent, as a fraction out of 100, times the number. Use 50%, 25%, 10% and 1% as shortcuts.",
    examples: ["25% of 80 = 1/4 × 80 = 20", "10% of 60 = 6, so 30% of 60 = 18", "35% of 240 = 72 + 12 = 84", "15% of 40 = 0.15 × 40 = 6"],
    watch: "Don't divide by the percent, and remember that percent means hundredths."},
  templates: [
    {id: "1.9-ten", type: "num", tag: "PROCEDURE", diff: 1, est: 20, make(R) {
      const n = 10 * ri(R, 3, 90), ans = n / 10;
      return {stem: `What is 10% of ${fn(n)}?`, ans,
        traps: traps(ans, [[n * 10, "That multiplies by 10. 10% is a tenth: divide by 10.", "FORGOT_100"], [10, "10 is the percent, not the amount.", "PCT_AS_AMOUNT"]]),
        hints: ["10% is one tenth.", `Divide: ${fn(n)} ÷ 10.`], sol: [`${fn(n)} ÷ 10 = ${fn(ans)} | 10% is a tenth.`], p: {n}};
    }, verify: it => it.ans * 10 === it.p.n},
    {id: "1.9-bench", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const p = pick(R, [50, 25, 75, 20]), m = p === 50 ? 2 : p === 20 ? 5 : 4, n = m * ri(R, 3, 30), ans = p * n / 100, name = {50: "half", 25: "a fourth", 75: "three fourths", 20: "a fifth"}[p];
      return {stem: `What is ${p}% of ${n}?`, ans,
        traps: traps(ans, [[new Q(n, p).frac(), "That divides by the percent. Find the part instead.", "DIVIDE_BY_PERCENT"], [p * n, `That multiplies by ${p}. Multiply by ${p}/100 instead.`, "FORGOT_100"], [p, `${p} is the percent, not the amount.`, "PCT_AS_AMOUNT"]]),
        hints: [`${p}% is ${name}.`, p === 75 ? `A fourth of ${n} is ${n / 4}. Three fourths is 3 times that.` : `Divide: ${n} ÷ ${m}.`],
        sol: [p === 75 ? `${n} ÷ 4 = ${n / 4} | 25% is a fourth.` : `${n} ÷ ${m} = ${ans} | ${p}% is ${name}.`].concat(p === 75 ? [`3 × ${n / 4} = ${ans} | 75% is three fourths.`] : []), p: {p, n}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.p * it.p.n)},
    {id: "1.9-general", type: "num", tag: "PROCEDURE", diff: 2, est: 40, make(R) {
      const p = pick(R, [5, 15, 30, 35, 40, 45, 60, 70, 90]), n = 20 * ri(R, 2, 25), ans = p * n / 100, ten = n / 10;
      return {stem: `What is ${p}% of ${n}?`, ans,
        traps: traps(ans, [[new Q(n, p).frac(), "That divides by the percent. Find the part instead.", "DIVIDE_BY_PERCENT"], [p * n, `That multiplies by ${p}. Multiply by ${p}/100 instead.`, "FORGOT_100"]]),
        hints: [`Start with 10% of ${n}.`, `10% of ${n} is ${ten}. Build ${p}% from tens and fives.`],
        sol: [`10% of ${n} = ${ten} | Divide by 10.`, `${p}% of ${n} = ${p}/100 × ${n} = ${ans} | ${p / 10} groups of 10%.`], p: {p, n}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.p * it.p.n)},
    {id: "1.9-best", type: "mc", tag: "CONCEPT", diff: 2, est: 35, make(R) {
      const P = pick(R, [20, 30, 40, 60, 70, 80, 90]), N = 10 * ri(R, 2, 9), right = `Find 10% of ${N}, then multiply by ${P / 10}`;
      return {stem: `Which is a correct way to find ${P}% of ${N}?`, right, whyRight: `${P}% is ${P / 10} groups of 10%, and 10% of ${N} is ${N / 10}.`,
        wrong: [[`Divide ${N} by ${P}`, "That divides by the percent, which doesn't find a part of the number.", "DIVIDE_BY_PERCENT"], [`Multiply ${N} by ${P}`, `That forgets the hundredths. Multiply by ${P}/100.`, "FORGOT_100"], [`Subtract ${P} from ${N}`, "Subtracting the percent doesn't find a part of the number.", "PCT_AS_AMOUNT"]],
        hints: [`${P}% is made of groups of 10%.`, `10% of ${N} is ${N / 10}.`], sol: [`10% of ${N} = ${N / 10} | Divide by 10.`, `${P / 10} × ${N / 10} = ${P * N / 100} | ${P}% is ${P / 10} groups of 10%.`], p: {P, N}};
    }, verify: it => (it.p.N / 10) * (it.p.P / 10) === it.p.P * it.p.N / 100 && /10%/.test(it.right)},
    {id: "1.9-save", type: "num", tag: "APPLICATION", diff: 2, est: 55, word: true, make(R) {
      const item = pick(R, ["jacket", "pair of shoes", "skateboard", "backpack"]), P = 20 * ri(R, 2, 15), p = pick(R, [10, 20, 25, 30, 40, 50]), ans = p * P / 100;
      return {stem: `A ${item} costs $${P}. It's on sale for ${p}% off. How much money do you save?`, pre: "$", ans,
        traps: traps(ans, [[P - ans, "That's the sale price, what you still pay. The question asks how much you save.", "SALE_VS_SAVE"], [new Q(P, p).frac(), "That divides by the percent. Find the part instead.", "DIVIDE_BY_PERCENT"], [p, `${p} is the percent, not the dollars.`, "PCT_AS_AMOUNT"]]),
        frame: {find: ["The amount you save", "The sale price", "The percent off"], tool: [`Find ${p}% of $${P}`, `Divide $${P} by ${p}`, `Subtract ${p} from ${P}`],
          check: `The savings, $${ans}, should be less than half of $${P} when the discount is less than 50%.`},
        hints: [`You save ${p}% of the price.`, `10% of $${P} is $${P / 10}.`],
        sol: [`10% of $${P} = $${P / 10} | Divide by 10.`, `${p}% of $${P} = $${ans} | The discount is what you save.`], p: {P, p}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.P * it.p.p)},
    {id: "1.9-sale", type: "num", tag: "APPLICATION", diff: 3, est: 70, word: true, make(R) {
      const item = pick(R, ["video game", "lamp", "scooter", "board game"]), P = 20 * ri(R, 2, 15), p = pick(R, [10, 20, 25, 30, 40, 60, 75]), off = p * P / 100, ans = P - off;
      return {stem: `A ${item} costs $${P}. It's on sale for ${p}% off. What is the sale price?`, pre: "$", ans,
        traps: traps(ans, [[off, "That's the discount, the amount you save. Subtract it from the price.", "SALE_VS_SAVE"], [P - p, "That subtracts the percent, not the dollars.", "PCT_AS_AMOUNT"]]),
        frame: {find: ["The price after the discount", "The amount of the discount", "The percent you pay"], tool: [`Find ${p}% of $${P}, then subtract it from $${P}`, `Subtract ${p} from ${P}`, `Divide $${P} by ${p}`],
          check: `You pay ${100 - p}% of the price, and ${100 - p}% of $${P} should also be $${ans}.`},
        hints: [`First find the discount: ${p}% of $${P}.`, `The discount is $${off}. Subtract it from $${P}.`],
        sol: [`${p}% of $${P} = $${off} | The discount.`, `$${P} − $${off} = $${ans} | The sale price.`], p: {P, p}};
    }, verify: it => Q.of(it.ans).mul(100).eq(it.p.P * (100 - it.p.p))}
  ]
});

// =====================================================================================================
// 1.10 Finding the whole from a percent
add("1.10", {
  prereq: ["1.9"],
  vocab: [["whole", "The total amount. The whole is always 100%."],
    ["part", "Some of the whole. If 30% of the price is $45, the part is $45."],
    ["benchmark", "An easy percent to scale from, like 10%, 25%, 50% or 1%."]],
  misconceptions: {
    PCT_OF_PART: "If 30% is $45, the whole isn't 30% of $45. Scale up to 100% instead.",
    WHOLE_SMALLER: "The whole is 100%, so it's bigger than any part that's less than 100%.",
    DIVIDE_BY_PERCENT: "Dividing the part by the percent finds 1%, not the whole. Then multiply by 100."
  },
  script: [
    {part: "hook", board: {m: "words", big: "Maya has saved $45", small: "That's 30% of the price of a bike. What does the bike cost?"},
      say: "Maya has saved $45 for a new bike. Her mom says that's 30 percent of the price. How much does the bike cost? This time you know the part and the percent, and you need to find the whole. It's like the last lesson, but backward. Problems like this show up when you save money, read sports stats, and take tests."},
    {part: "idea", board: {m: "words", big: "The whole is always 100%.", small: "Know a part? Scale it up to 100%."},
      say: "The whole is always 100 percent. If you know what some percent is worth, you can scale it to 100 percent, just like scaling a ratio. Think of the percent and the amount as a ratio: 30 to 45. You want the equivalent ratio that starts with 100. A smart way is to find 10 percent or 1 percent first, then multiply up to 100 percent. Either way, you end at 100 percent.",
      why: "A percent and its amount form a ratio, so equivalent ratios take you from the percent you know to 100 percent."},
    {part: "see", board: {m: "dnl", top: ["Percent", 0, 10, 30, 100], bot: ["Dollars", 0, 15, 45, 150], hl: 3},
      say: "Here's a double number line. 30 percent lines up with $45. Divide both by 3: 10 percent lines up with $15. Then multiply both by 10: 100 percent lines up with $150. So the bike costs $150."},
    {part: "ido", board: {m: "rt", rows: [["Percent", 30, 10, 100], ["Dollars", 45, 15, 150]], hl: 3},
      say: "Here are the same steps in a ratio table. 30 percent is $45. Divide both rows by 3: 10 percent is $15. Multiply both rows by 10: 100 percent is $150. Now check it: 30 percent of 150 is 3 times 15, which is 45. It matches, so the bike costs $150."},
    {part: "ido", board: {m: "eq", lines: ["25% is 12 students", "100% = 4 × 25%", "4 × 12 = 48 students"], hl: 2},
      say: "Here's another one. 25 percent of a class is 12 students. How many students are in the whole class? 100 percent is 4 times 25 percent, so the whole class is 4 times 12, which is 48 students. Check: 25 percent of 48 is 48 divided by 4, which is 12. Benchmarks like 25 percent and 50 percent make it quick."},
    {part: "see", board: {m: "eq", lines: ["50% is 35 minutes", "100% = 2 × 50%", "2 × 35 = 70 minutes"], hl: 2},
      say: "Half is the easiest benchmark of all. If 50 percent of a movie is 35 minutes, the whole movie is twice as long: 70 minutes. And if 50 percent of a class is 14 students, the whole class is 28 students."},
    {part: "see", board: {m: "eq", lines: ["4% is 6 pages", "1% is 6 ÷ 4 = 1.5 pages", "100% is 1.5 × 100 = 150 pages"], hl: 2},
      say: "When the percent isn't a nice benchmark, go through 1 percent. Say 4 percent of a book is 6 pages. Divide by 4: 1 percent is 1.5 pages. Multiply by 100: the whole book is 150 pages. Going through 1 percent always works, even when the numbers are messy."},
    {part: "wedo", board: {m: "words", big: "10% of a number is 7"},
      say: "Your turn. 10 percent of a number is 7. What is the number?",
      check: {item: {type: "num", stem: "10% of a number is 7. What is the number?", ans: 70,
        traps: [["0.7", "That's 10% of 7. The whole is bigger than the part.", "PCT_OF_PART"], [17, "Adding 10 doesn't scale the percent. 100% is 10 times 10%.", null]],
        sol: ["100% = 10 × 10% | Scale up to 100%.", "10 × 7 = 70 | The whole."]},
        miss: "100 percent is 10 times 10 percent, so the number is 10 times 7, which is 70."}},
    {part: "wedo", board: {m: "words", big: "20% of the crowd is 30 people"},
      say: "30 people at a game wore hats. That's 20 percent of the crowd. How many people were at the game?",
      check: {item: {type: "num", stem: "30 people at a game wore hats. That's 20% of the crowd. How many people were at the game?", ans: 150, post: "people",
        traps: [[6, "That's 20% of 30. The crowd is bigger than the 30 people with hats.", "PCT_OF_PART"], ["3/2", "That divides 30 by 20, which finds 1%. Multiply by 100 for the whole.", "DIVIDE_BY_PERCENT"]],
        sol: ["30 ÷ 2 = 15 | 10% is half of 20%.", "15 × 10 = 150 | 100% is 10 times 10%."]},
        miss: "20 percent is 30 people, so 10 percent is 15 people, and 100 percent is 10 times 15, which is 150 people."}},
    {part: "watch", board: {m: "eq", lines: ["30% is $45, so 100% is $150 ✓", "30% of $45 = $13.50 ✗"], strike: [1]},
      say: "Watch out. When the question gives you the part, don't find the percent of the part. 30 percent of $45 is $13.50, which is less than Maya already saved, so it can't be the price of the bike. The whole is 100 percent, so it has to be bigger than any part that's less than 100 percent. If your answer is smaller than the part, you went the wrong way."},
    {part: "recap", board: {m: "words", big: "Know a part? Scale it to 100%."},
      say: "Recap. To find the whole from a part and its percent, scale the percent up to 100. Find 10 percent or 1 percent first, then multiply. A ratio table or a double number line keeps the steps organized. Then check two things: the whole is bigger than the part, and the percent of your answer gives back the part. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["Saved", 3, "$15", "30% = $45"], ["Price", 10, "$15", "100% = ?"]]},
      say: "Picture the price as 10 equal boxes, each worth 10 percent. Maya's $45 fills 3 of the boxes, so each box holds 45 divided by 3, which is $15."},
    {part: "see", board: {m: "tape", rows: [["Price", 10, "$15", "100% = $150"]]},
      say: "The whole price is all 10 boxes. 10 times $15 is $150."},
    {part: "recap", board: {m: "words", big: "Find one box, then count all the boxes"},
      say: "So find what one box is worth, then count all the boxes in the whole. That's the same as finding 10 percent and multiplying by 10."}
  ],
  notes: {idea: "The whole is 100 percent. Scale the percent you know to 10 percent or 1 percent, then up to 100 percent.",
    examples: ["30% is $45, so 10% is $15 and 100% is $150", "25% is 12, so 100% is 4 × 12 = 48", "4% is 6 pages, so 1% is 1.5 and 100% is 150 pages"],
    watch: "Don't take the percent of the part. The whole has to be bigger than the part."},
  templates: [
    {id: "1.10-ten", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const a = ri(R, 3, 95), ans = 10 * a;
      return {stem: `10% of a number is ${a}. What is the number?`, ans,
        traps: traps(ans, [[new Q(a, 10).dec(), `That's 10% of ${a}. The whole is bigger than the part.`, "PCT_OF_PART"], [100 * a, `That treats ${a} as 1%. It's 10%, so multiply by 10.`, null]]),
        hints: ["100% is how many groups of 10%?", `100% is 10 groups of 10%: 10 × ${a}.`], sol: [`10 × ${a} = ${ans} | 100% is 10 times 10%.`], p: {a}};
    }, verify: it => new Q(it.ans, 10).eq(it.p.a)},
    {id: "1.10-bench", type: "num", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const p = pick(R, [20, 25, 50, 75, 30, 40, 60]), W = 20 * ri(R, 2, 25), a = p * W / 100;
      const how = {20: [`20% is a fifth, so the whole is 5 times as much.`, `5 × ${a} = ${W}`], 25: [`25% is a fourth, so the whole is 4 times as much.`, `4 × ${a} = ${W}`], 50: [`50% is half, so the whole is twice as much.`, `2 × ${a} = ${W}`],
        75: [`75% is three fourths. Find 25% first: ${a} ÷ 3 = ${a / 3}.`, `4 × ${a / 3} = ${W}`], 30: [`Find 10% first: ${a} ÷ 3 = ${a / 3}.`, `10 × ${a / 3} = ${W}`], 40: [`Find 10% first: ${a} ÷ 4 = ${a / 4}.`, `10 × ${a / 4} = ${W}`], 60: [`Find 10% first: ${a} ÷ 6 = ${a / 6}.`, `10 × ${a / 6} = ${W}`]}[p];
      return {stem: `${p}% of a number is ${a}. What is the number?`, ans: W,
        traps: traps(W, [[new Q(p * a, 100).dec(), `That's ${p}% of ${a}. The whole is bigger than the part.`, "PCT_OF_PART"], [new Q(a, p).dec(), "That's 1% of the number. Multiply by 100 to get the whole.", "DIVIDE_BY_PERCENT"]]),
        hints: ["Scale the percent up to 100%.", how[0]], sol: [`${how[1]} | Scale ${p}% up to 100%.`, `Check: ${p}% of ${W} = ${a} | It gives back the part.`], p: {p, a}};
    }, verify: it => Q.of(it.ans).mul(it.p.p).eq(it.p.a * 100)},
    {id: "1.10-true", type: "yn", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      const p = pick(R, [10, 20, 25]), W = 20 * ri(R, 2, 20), a = p * W / 100, wrongW = new Q(p * a, 100).dec();
      const rows = shuffle(R, [[`The number is greater than ${a}.`, true, `${a} is only ${p}% of it.`], [`${2 * p}% of the number is ${2 * a}.`, true, `Twice the percent is twice the amount.`],
        [`The number is ${wrongW}.`, false, `That's ${p}% of ${a}, which goes the wrong way.`], [`The number is ${W}.`, true, `${p}% of ${W} is ${a}.`]]);
      return {stem: `${p}% of a number is ${a}. Is each statement true?`, rows,
        hints: ["The whole is 100%. Is it bigger or smaller than the part?", `100% is ${100 / p} times ${p}%.`],
        sol: [`${100 / p} × ${a} = ${W} | Scale ${p}% up to 100%.`], p: {p, a}};
    }, verify: it => it.rows.every(r => {
      const W = it.p.a * 100 / it.p.p, x = nums(r.t);
      if (/greater/.test(r.t)) return r.ok === (W > it.p.a);
      if (/% of the number is/.test(r.t)) return r.ok === (x[0] * W / 100 === x[1]);
      return r.ok === (x[0] === W);
    })},
    {id: "1.10-save", type: "num", tag: "APPLICATION", diff: 2, est: 60, word: true, make(R) {
      const [who, thing] = pick(R, [["Jay", "a game console"], ["Nia", "a bike"], ["Theo", "a tablet"], ["Ana", "a keyboard"]]), p = pick(R, [10, 20, 25, 40, 50]), W = 20 * ri(R, 4, 20), a = p * W / 100;
      return {stem: `${who} has saved $${a}. That's ${p}% of the price of ${thing}. What is the price?`, pre: "$", ans: W,
        traps: traps(W, [[new Q(p * a, 100).dec(), `That's ${p}% of $${a}. The price is bigger than what ${who} has saved.`, "PCT_OF_PART"], [a + 100 - p, "Adding doesn't scale the percent up to 100%.", null]]),
        frame: {find: ["The full price", `How much more ${who} needs`, `${p}% of $${a}`], tool: [`Scale ${p}% up to 100% with a ratio table`, `Find ${p}% of $${a}`, `Add ${p} to ${a}`],
          check: `${p}% of $${W} should be $${a}, the amount saved.`},
        hints: [`$${a} is ${p}% of the price. What is 10% or 1% of the price?`, p === 25 ? `25% is a fourth, so the price is 4 × $${a}.` : p === 50 ? `50% is half, so the price is 2 × $${a}.` : `10% is $${a / (p / 10)}.`],
        sol: [p === 25 ? `4 × $${a} = $${W} | 100% is 4 times 25%.` : p === 50 ? `2 × $${a} = $${W} | 100% is 2 times 50%.` : `$${a} ÷ ${p / 10} = $${a / (p / 10)} | 10% of the price.`].concat(p === 25 || p === 50 ? [] : [`10 × $${a / (p / 10)} = $${W} | 100% is 10 times 10%.`]), p: {p, a}};
    }, verify: it => Q.of(it.ans).mul(it.p.p).eq(it.p.a * 100)},
    {id: "1.10-club", type: "num", tag: "APPLICATION", diff: 3, est: 70, word: true, make(R) {
      const p = pick(R, [20, 25, 40, 60, 75, 80]), W = 20 * ri(R, 2, 10), g = p * W / 100, ans = W - g, [club, x, y] = pick(R, [["chess club", "girls", "boys"], ["band", "sixth graders", "seventh graders"], ["soccer team", "left-footed players", "right-footed players"]]);
      return {stem: `There are ${g} ${x} in the ${club}. They make up ${p}% of the ${club}. Everyone else is ${y}. How many ${y} are in the ${club}?`, ans,
        traps: traps(ans, [[W, `That's everyone in the ${club}. Subtract the ${x} to get the ${y}.`, null], [new Q(p * g, 100).dec(), `That's ${p}% of ${g}. Scale up to 100% to find everyone first.`, "PCT_OF_PART"]]),
        frame: {find: [`The number of ${y}`, `Everyone in the ${club}`, `${p}% of ${g}`], tool: [`Scale ${p}% up to 100% to find everyone, then subtract the ${x}`, `Find ${p}% of ${g}`, `Add ${p} to ${g}`],
          check: `${x} plus ${y} should equal everyone, and ${p}% of everyone should be ${g}.`},
        hints: [`First find everyone: ${g} is ${p}% of the ${club}.`, `Everyone is ${W}. Now subtract the ${x}.`],
        sol: [`${g} is ${p}%, so 100% is ${W} | Scale up to the whole ${club}.`, `${W} − ${g} = ${ans} | Everyone minus the ${x}.`], p: {p, g}};
    }, verify: it => Q.of(it.ans).add(it.p.g).mul(it.p.p).eq(it.p.g * 100)},
    {id: "1.10-one", type: "num", tag: "PROCEDURE", diff: 3, est: 50, make(R) {
      const p = pick(R, [3, 4, 6, 8, 12, 15]), k = ri(R, 1, 6), W = 100 * k, a = p * k, [noun, where] = pick(R, [["pages", "in a book"], ["seats", "in a theater"], ["tickets", "for a show"], ["songs", "on a playlist"]]);
      return {stem: `${a} ${noun} make up ${p}% of all the ${noun} ${where}. How many ${noun} are there ${where}?`, ans: W, post: noun,
        traps: traps(W, [[new Q(p * a, 100).dec(), `That's ${p}% of ${a}, which goes the wrong way.`, "PCT_OF_PART"], [k, "That's 1% of the total. Multiply by 100 for the whole.", "DIVIDE_BY_PERCENT"]]),
        hints: ["Find 1% first.", `${a} ÷ ${p} = ${k}, so 1% is ${k} ${noun}.`],
        sol: [`${a} ÷ ${p} = ${k} | 1% of the ${noun}.`, `${k} × 100 = ${W} | 100% is 100 times 1%.`], p: {p, a}};
    }, verify: it => Q.of(it.ans).mul(it.p.p).eq(it.p.a * 100)}
  ]
});

// =====================================================================================================
// 1.11 Converting measurements with ratios
const CONV = [["feet", "inches", 12, "foot", "inch"], ["yards", "feet", 3, "yard", "foot"], ["hours", "minutes", 60, "hour", "minute"], ["minutes", "seconds", 60, "minute", "second"],
  ["quarts", "cups", 4, "quart", "cup"], ["gallons", "quarts", 4, "gallon", "quart"], ["kilometers", "meters", 1000, "kilometer", "meter"], ["meters", "centimeters", 100, "meter", "centimeter"],
  ["pounds", "ounces", 16, "pound", "ounce"], ["days", "hours", 24, "day", "hour"], ["weeks", "days", 7, "week", "day"]];
add("1.11", {
  prereq: ["1.3", "1.5"],
  vocab: [["conversion factor", "A rate that says how two units compare, like 12 inches per foot."],
    ["unit", "What you measure in: inches, feet, cups, minutes."],
    ["metric system", "Units that go by tens, hundreds and thousands, like meters and kilometers."]],
  misconceptions: {
    MULT_TO_BIGGER: "Changing to a bigger unit makes the number smaller: 36 inches is 3 feet, so divide by 12.",
    DIV_TO_SMALLER: "Changing to a smaller unit makes the number bigger: 3 feet is 36 inches, so multiply by 12.",
    IGNORE_UNITS: "Compare in the same unit: 70 inches is less than 2 yards, even though 70 is bigger than 2."
  },
  script: [
    {part: "hook", board: {m: "words", big: "Shelf: 5 feet long", small: "Fish tank: 54 inches long. Will it fit?"},
      say: "A shelf is 5 feet long. Your fish tank is 54 inches long. Will the tank fit on the shelf? You can't compare feet and inches directly. It's like comparing apples and oranges. First you have to change one of them into the other unit. Cooks, builders and nurses convert units every day. Even recipes switch between cups and quarts. Ratios make it easy."},
    {part: "idea", board: {m: "rt", rows: [["Feet", 1, 2, 3, 4, 5], ["Inches", 12, 24, 36, 48, 60]], hl: 5},
      say: "1 foot is 12 inches. That's a ratio: 1 foot to 12 inches. Make a ratio table. 2 feet is 24 inches, 3 feet is 36 inches, and 5 feet is 60 inches. 60 inches is more than 54 inches, so the tank fits, with 6 inches to spare.",
      why: "A conversion is a rate, like 12 inches per foot, so a ratio table works just like it does for prices or speeds."},
    {part: "see", board: {m: "dnl", top: ["Feet", 0, 1, 2, 3], bot: ["Inches", 0, 12, 24, 36], hl: 3},
      say: "On a double number line, every step of 1 foot on the top matches a step of 12 inches on the bottom. 3 feet lines up with 36 inches. Going down from feet to inches means multiplying by 12, and going up from inches to feet means dividing by 12."},
    {part: "see", board: {m: "eq", lines: ["feet to inches: × 12", "inches to feet: ÷ 12"], hl: 0},
      say: "Here's the pattern. Inches are smaller than feet, so it takes more of them to cover the same length. When you change to a smaller unit, the number gets bigger, so multiply. When you change to a bigger unit, the number gets smaller, so divide."},
    {part: "ido", board: {m: "eq", lines: ["72 inches = ? feet", "72 ÷ 12 = 6", "72 inches = 6 feet"], hl: 2},
      say: "Watch me. How many feet is 72 inches? Feet are bigger than inches, so I expect a smaller number. Divide by 12: 72 divided by 12 is 6. So 72 inches is 6 feet, about the height of a tall adult. Check: 6 feet times 12 is 72 inches."},
    {part: "ido", board: {m: "eq", lines: ["3 hours = ? minutes", "3 × 60 = 180", "3 hours = 180 minutes"], hl: 2},
      say: "Time works the same way. There are 60 minutes in an hour. How many minutes are in 3 hours? Minutes are smaller, so multiply: 3 times 60 is 180 minutes. And going back, 180 minutes is 180 divided by 60, which is 3 hours."},
    {part: "see", board: {m: "eq", lines: ["2.5 kilometers = ? meters", "1 kilometer = 1,000 meters", "2.5 × 1,000 = 2,500 meters"], hl: 2},
      say: "Metric units work the same way, and they're even easier, because they go by tens, hundreds and thousands. 1 kilometer is 1,000 meters. To change 2.5 kilometers to meters, multiply by 1,000. That's 2,500 meters. And 1 meter is 100 centimeters, so 3 meters is 300 centimeters."},
    {part: "see", board: {m: "eq", lines: ["12 inches = 1 foot · 3 feet = 1 yard", "4 cups = 1 quart · 4 quarts = 1 gallon", "16 ounces = 1 pound", "60 minutes = 1 hour · 24 hours = 1 day"]},
      say: "Here are some conversions worth knowing. 12 inches in a foot, and 3 feet in a yard. 4 cups in a quart, and 4 quarts in a gallon. 16 ounces in a pound. 60 seconds in a minute, 60 minutes in an hour, and 24 hours in a day. You don't have to memorize them all today. The questions and hints will remind you."},
    {part: "wedo", board: {m: "words", big: "4 feet = ? inches"},
      say: "Your turn. How many inches are in 4 feet?",
      check: {item: {type: "num", stem: "How many inches are in 4 feet?", ans: 48, post: "inches",
        traps: [["1/3", "Inches are smaller, so the number should get bigger. Multiply by 12.", "DIV_TO_SMALLER"], [16, "That adds 12. Multiply by 12 instead.", null]],
        sol: ["4 × 12 = 48 | 12 inches in each foot."]},
        miss: "Each foot is 12 inches, so 4 feet is 4 times 12, which is 48 inches."}},
    {part: "wedo", board: {m: "words", big: "180 minutes = ? hours"},
      say: "How many hours is 180 minutes? Remember, hours are bigger than minutes.",
      check: {item: {type: "num", stem: "How many hours is 180 minutes?", ans: 3, post: "hours",
        traps: [[10800, "Hours are bigger, so the number should get smaller. Divide by 60.", "MULT_TO_BIGGER"]],
        sol: ["180 ÷ 60 = 3 | 60 minutes in each hour."]},
        miss: "There are 60 minutes in an hour, so divide: 180 divided by 60 is 3 hours."}},
    {part: "watch", board: {m: "eq", lines: ["3 yards = 9 feet ✓", "3 yards = 1 foot ✗"], strike: [1]},
      say: "Watch out for going the wrong way. Before you calculate, ask yourself: am I changing to a bigger unit or a smaller one? A yard is 3 feet, so 3 yards is 9 feet: a bigger number of smaller units. If your answer goes the wrong direction, like 3 yards turning into 1 foot, switch between multiplying and dividing. Asking which unit is bigger takes two seconds and saves a lot of mistakes."},
    {part: "recap", board: {m: "words", big: "To a smaller unit: multiply", small: "To a bigger unit: divide"},
      say: "Recap. A conversion factor is a rate, like 12 inches per foot. To change to a smaller unit, multiply. To change to a bigger unit, divide. A ratio table works for any conversion. And always check the direction: smaller units mean a bigger number. Now practice. Three right in a row masters the lesson."}
  ],
  alt: [
    {part: "idea", board: {m: "tape", rows: [["3 feet", 3, "12 in", "= 36 inches"]]},
      say: "Picture each foot as a box that holds 12 inches. 3 feet is 3 boxes, and 3 boxes of 12 inches is 36 inches."},
    {part: "see", board: {m: "tape", rows: [["36 inches", 3, "12 in", "= 3 feet"]]},
      say: "Going backward, pack 36 inches into boxes of 12. You can fill 36 divided by 12, which is 3 boxes. So 36 inches is 3 feet."},
    {part: "recap", board: {m: "words", big: "Multiply to fill boxes, divide to count them"},
      say: "Multiplying fills the boxes with the small unit. Dividing counts how many big boxes you can fill."}
  ],
  notes: {idea: "Use a conversion factor as a ratio. To change to a smaller unit, multiply. To change to a bigger unit, divide.",
    examples: ["5 feet = 5 × 12 = 60 inches", "72 inches = 72 ÷ 12 = 6 feet", "2.5 kilometers = 2.5 × 1,000 = 2,500 meters", "180 minutes = 180 ÷ 60 = 3 hours"],
    watch: "Check the direction: smaller units mean a bigger number."},
  templates: [
    {id: "1.11-down", type: "num", tag: "PROCEDURE", diff: 1, est: 25, make(R) {
      const [big, small, f, one] = pick(R, CONV), n = ri(R, 2, 9), ans = n * f;
      return {stem: `How many ${small} are in ${n} ${big}?`, ans, post: small,
        traps: traps(ans, [[new Q(n, f).frac(), `${cap(small)} are smaller, so the number should get bigger. Multiply by ${fn(f)}.`, "DIV_TO_SMALLER"], [n + f, `That adds ${fn(f)}. Multiply by ${fn(f)} instead.`, null]]),
        hints: [`There are ${fn(f)} ${small} in 1 ${one}.`, `Multiply: ${n} × ${fn(f)}.`], sol: [`${n} × ${fn(f)} = ${fn(ans)} | ${fn(f)} ${small} in each ${one}.`], p: {n, f}};
    }, verify: it => it.ans === it.p.n * it.p.f},
    {id: "1.11-up", type: "num", tag: "PROCEDURE", diff: 1, est: 30, make(R) {
      const [big, small, f, one] = pick(R, CONV), n = ri(R, 2, 9), m = n * f;
      return {stem: `How many ${big} is ${fn(m)} ${small}?`, ans: n, post: big,
        traps: traps(n, [[m * f, `${cap(big)} are bigger, so the number should get smaller. Divide by ${fn(f)}.`, "MULT_TO_BIGGER"], [m - f, `That subtracts ${fn(f)}. Divide by ${fn(f)} instead.`, null]]),
        hints: [`There are ${fn(f)} ${small} in 1 ${one}.`, `Divide: ${fn(m)} ÷ ${fn(f)}.`], sol: [`${fn(m)} ÷ ${fn(f)} = ${n} | ${fn(f)} ${small} make each ${one}.`], p: {m, f}};
    }, verify: it => it.ans * it.p.f === it.p.m},
    {id: "1.11-dir", type: "mc", tag: "CONCEPT", diff: 1, est: 20, make(R) {
      const [big, small, f] = pick(R, CONV), down = R() < 0.5, right = down ? `Multiply by ${fn(f)}` : `Divide by ${fn(f)}`;
      return {stem: down ? `To change ${big} to ${small}, what do you do?` : `To change ${small} to ${big}, what do you do?`, right,
        whyRight: down ? `${cap(small)} are smaller, so you need more of them.` : `${cap(big)} are bigger, so you need fewer of them.`,
        wrong: [[down ? `Divide by ${fn(f)}` : `Multiply by ${fn(f)}`, down ? `That would make the number smaller, but ${small} are the smaller unit.` : `That would make the number bigger, but ${big} are the bigger unit.`, down ? "DIV_TO_SMALLER" : "MULT_TO_BIGGER"],
          [`Add ${fn(f)}`, "Converting multiplies or divides by the conversion factor.", null], [`Subtract ${fn(f)}`, "Converting multiplies or divides by the conversion factor.", null]],
        hints: ["Are you changing to a smaller unit or a bigger one?", "Smaller units mean a bigger number."], sol: [`${right} | ${down ? "To a smaller unit, multiply." : "To a bigger unit, divide."}`], p: {down}};
    }, verify: it => (it.p.down ? /^Multiply/ : /^Divide/).test(it.right)},
    {id: "1.11-mixed", type: "num", tag: "PROCEDURE", diff: 2, est: 40, make(R) {
      const [big, small, f, one] = pick(R, CONV.filter(c => c[2] <= 60)), n = ri(R, 2, 6), r = ri(R, 1, f - 1), ans = n * f + r;
      return {stem: `How many ${small} are in ${n} ${big} and ${r} ${r === 1 ? CONV.find(c => c[1] === small)[4] : small}?`, ans, post: small,
        traps: traps(ans, [[n * f, `That's only the ${big}. Add the extra ${r}.`, null], [n + r, `Change the ${big} to ${small} first.`, "DIV_TO_SMALLER"]]),
        hints: [`Change the ${big} to ${small} first.`, `${n} × ${f} = ${n * f}. Then add ${r}.`],
        sol: [`${n} × ${f} = ${n * f} | ${f} ${small} in each ${one}.`, `${n * f} + ${r} = ${ans} | Add the extra ${small}.`], p: {n, f, r}};
    }, verify: it => it.ans === it.p.n * it.p.f + it.p.r},
    {id: "1.11-story", type: "num", tag: "APPLICATION", diff: 2, est: 55, word: true, make(R) {
      const [s, big, small, f] = pick(R, [[n => `A punch recipe needs ${n} quarts of juice. Your measuring cup holds 1 cup. How many cups of juice is that?`, "quarts", "cups", 4],
        [n => `A ribbon is ${n} feet long. How many inches long is it?`, "feet", "inches", 12], [n => `A road trip takes ${n} hours. How many minutes is that?`, "hours", "minutes", 60],
        [n => `A swimming pool is ${n} yards long. How many feet long is it?`, "yards", "feet", 3], [n => `A puppy weighs ${n} pounds. How many ounces is that?`, "pounds", "ounces", 16]]);
      const n = ri(R, 3, 9), ans = n * f;
      return {stem: s(n), ans, post: small,
        traps: traps(ans, [[new Q(n, f).frac(), `${cap(small)} are smaller than ${big}, so you need more of them. Multiply by ${f}.`, "DIV_TO_SMALLER"], [n + f, `That adds ${f}. Multiply by ${f} instead.`, null]]),
        frame: {find: [`How many ${small} make ${n} ${big}`, `How many ${big} there are`, "How much is left over"], tool: [`Multiply by ${f}, the ${small} in each of the ${big}`, `Divide ${n} by ${f}`, `Add ${f} to ${n}`],
          check: `${cap(small)} are smaller than ${big}, so the answer should be bigger than ${n}.`},
        hints: [`How many ${small} are in 1 of the ${big}?`, `There are ${f}, so multiply: ${n} × ${f}.`],
        sol: [`${n} × ${f} = ${ans} | ${f} ${small} in each.`], p: {n, f}};
    }, verify: it => it.ans === it.p.n * it.p.f},
    {id: "1.11-compare", type: "mc", tag: "CONCEPT", diff: 3, est: 50, make(R) {
      const [big, small, f, adj] = pick(R, [["yards", "inches", 36, "longer"], ["feet", "inches", 12, "longer"], ["hours", "minutes", 60, "longer"], ["gallons", "cups", 16, "more"], ["pounds", "ounces", 16, "heavier"]]);
      const a = ri(R, 2, 6); let d; do d = ri(R, 1 - f, f - 1); while (d === 0);
      const b = a * f + d, bigWins = d < 0, A = `${a} ${big}`, B = `${b} ${small}`;
      return {stem: `Which is ${adj}: ${A} or ${B}?`, right: bigWins ? A : B, whyRight: `${A} is ${a * f} ${small}, and ${a * f} is ${bigWins ? "more" : "less"} than ${b}.`,
        wrong: [[bigWins ? B : A, bigWins ? `${b} is a bigger number than ${a}, but ${small} are much smaller than ${big}. ${A} is ${a * f} ${small}.` : `${A} is only ${a * f} ${small}.`, bigWins ? "IGNORE_UNITS" : null],
          ["They're the same", `${A} is ${a * f} ${small}, not ${b}.`, null], ["You can't tell", "You can: change both to the same unit.", "IGNORE_UNITS"]],
        hints: ["Change both amounts to the same unit.", `${A} = ${a} × ${f} ${small}.`],
        sol: [`${a} × ${f} = ${a * f} | ${A} in ${small}.`, `${a * f} compared with ${b} | Same unit, now compare.`], p: {a, f, b, A}};
    }, verify: it => (it.p.a * it.p.f > it.p.b) === (it.right === it.p.A)},
    {id: "1.11-table", type: "table", tag: "PROCEDURE", diff: 2, est: 35, make(R) {
      const [big, small, f] = pick(R, CONV), times = pick(R, [[1, 2, 5, 10], [1, 3, 4, 8], [1, 2, 6, 9]]), cols = shuffle(R, [2, 3, 4]).slice(0, 2).sort();
      return {stem: `Fill in the conversion table.`, rows: [[cap(big), ...times], [cap(small), ...times.map(t => t * f)]], blanks: cols.map(c => [1, c]),
        hints: [`1 of the ${big} is ${fn(f)} ${small}.`, `Multiply the ${big} by ${fn(f)}.`],
        sol: cols.map(c => `${times[c - 1]} × ${fn(f)} = ${fn(times[c - 1] * f)} | ${fn(f)} ${small} in each.`), p: {f}};
    }, verify: it => it.blanks.every(([, c]) => it.rows[1][c] === it.rows[0][c] * it.p.f)}
  ]
});

// =====================================================================================================
// 1.12 Ratio word problems and graphs
add("1.12", {
  prereq: ["1.3", "1.4"],
  vocab: [["ordered pair", "Two numbers that name a point. The first is how far across, the second is how far up."],
    ["x-axis", "The number line across the bottom of a graph."],
    ["y-axis", "The number line up the side of a graph."],
    ["origin", "The point where the axes meet, at (0, 0)."]],
  misconceptions: {
    XY_SWAP: "Keep the ratio's order in the point: the first quantity goes across, the second goes up.",
    ONE_PART: "The total divided by the number of parts is one part. Multiply by the parts you need.",
    PART_WHOLE: "Read what the question compares: part to part, or part to the whole.",
    ADD_SAME: "Adding the same number to both quantities changes the ratio. Multiply instead."
  },
  script: [
    {part: "hook", board: {m: "words", big: "2 cups of flour for 3 eggs", small: "How many eggs for 8 cups of flour?"},
      say: "A pancake recipe uses 2 cups of flour for every 3 eggs. You want to make a giant batch for a class breakfast, with 8 cups of flour. How many eggs do you need? And what would all these equivalent ratios look like on a graph? This lesson puts the whole unit together."},
    {part: "idea", board: {m: "rt", rows: [["Cups of flour", 2, 4, 6, 8], ["Eggs", 3, 6, 9, 12]], hl: 4},
      say: "Start with a ratio table. 2 cups of flour for 3 eggs. Double: 4 cups for 6 eggs. Triple: 6 cups for 9 eggs. 8 cups is 4 times 2 cups, so you need 4 times 3 eggs, which is 12 eggs."},
    {part: "see", board: {m: "pts", pts: [[2, 3], [4, 6], [6, 9], [8, 12]], line: true, xl: "Cups of flour", yl: "Eggs"},
      say: "Now graph each column as a point. Flour goes across, on the x-axis, and eggs go up, on the y-axis. 2 cups and 3 eggs is the point 2, 3. Then 4, 6. Then 6, 9. Then 8, 12. Look: the points line up in a straight line, and the line goes right through 0, 0. That's what equivalent ratios always look like on a graph.",
      why: "0 cups of flour needs 0 eggs, so 0, 0 belongs to every recipe. Each extra cup adds the same number of eggs, so the points climb at a steady rate, in a straight line."},
    {part: "see", board: {m: "pts", pts: [[2, 3], [4, 6], [6, 9], [4, 5]], line: 1.5, xl: "Cups of flour", yl: "Eggs"},
      say: "If a point isn't on that line, its ratio is different. The point 4, 5 would mean 4 cups of flour with 5 eggs. That's not the same recipe: it's below the line, with fewer eggs for the flour. Any point on the line is an equivalent ratio, and any point off the line isn't."},
    {part: "ido", board: {m: "eq", lines: ["cats : dogs = 4:5", "4 + 5 = 9 parts", "27 ÷ 9 = 3 animals in each part", "cats: 4 × 3 = 12, dogs: 5 × 3 = 15"], hl: 3},
      say: "Here's a different kind of problem. At a shelter, the ratio of cats to dogs is 4:5. There are 27 animals in all. How many are cats? Think in parts. 4 parts cats and 5 parts dogs make 9 parts. 27 animals divided by 9 parts is 3 animals in each part. Cats are 4 parts: 4 times 3 is 12 cats. Dogs are 5 parts: 5 times 3 is 15 dogs. Check: 12 plus 15 is 27."},
    {part: "see", board: {m: "tape", rows: [["Cats", 4, 3, "= 12"], ["Dogs", 5, 3, "= 15"]]},
      say: "A tape diagram shows why it works. Each box is one part, and every box holds the same number of animals: 3. Four boxes of cats, five boxes of dogs, and nine boxes in all."},
    {part: "ido", board: {m: "eq", lines: ["boys : girls = 2:3", "3 parts − 2 parts = 1 part = 5 students", "boys: 2 × 5 = 10, girls: 3 × 5 = 15"], hl: 2},
      say: "One more kind. In a club, the ratio of boys to girls is 2:3, and there are 5 more girls than boys. How many boys are there? The difference is 3 parts minus 2 parts, which is 1 part. So 1 part is 5 students. Boys are 2 parts: 10 boys. Girls are 3 parts: 15 girls. And 15 is 5 more than 10, so it checks."},
    {part: "wedo", board: {m: "words", big: "3 cups of oats for 2 cups of raisins"},
      say: "Your turn. A granola recipe uses 3 cups of oats for every 2 cups of raisins. How many cups of oats go with 10 cups of raisins?",
      check: {item: {type: "num", stem: "A granola recipe uses 3 cups of oats for every 2 cups of raisins. How many cups of oats go with 10 cups of raisins?", ans: 15, post: "cups",
        traps: [[11, "That adds 8 to both amounts, which changes the recipe. Multiply both by 5.", "ADD_SAME"]],
        sol: ["2 × 5 = 10 | The raisins were multiplied by 5.", "3 × 5 = 15 | Multiply the oats by 5 too."]},
        miss: "10 is 5 times 2, so use 5 times 3, which is 15 cups of oats."}},
    {part: "wedo", board: {m: "pts", pts: [[2, 3], [4, 6]], line: true, xl: "Cups of flour", yl: "Eggs"},
      say: "Which point belongs on the graph of 2 cups of flour for every 3 eggs? Flour is the first number.",
      check: {item: {type: "mc", stem: "Which point is on the graph of 2 cups of flour for every 3 eggs?", right: "(10, 15)", whyRight: "10 cups is 5 times 2, and 15 eggs is 5 times 3.",
        wrong: [["(15, 10)", "Flour goes first, across. That point has 15 cups of flour.", "XY_SWAP"], ["(4, 5)", "That adds 2 to both numbers, which changes the ratio.", "ADD_SAME"], ["(3, 2)", "Flour goes first, and 3 cups of flour needs 4.5 eggs.", "XY_SWAP"]],
        sol: ["10 = 2 × 5 and 15 = 3 × 5 | Both multiplied by 5."]},
        miss: "10 cups of flour is 5 times 2, so it goes with 5 times 3, which is 15 eggs. That's the point 10, 15."}},
    {part: "watch", board: {m: "eq", lines: ["flour across, eggs up: (2, 3) ✓", "(3, 2) ✗ switched", "cats to all animals = 4:9, not 4:5"], strike: [1]},
      say: "Watch out. Keep the order of the ratio in the points: the first quantity goes across, and the second goes up. And in part problems, read carefully whether the question compares part to part or part to the whole. At the shelter, cats to all the animals is 4 to 9, not 4 to 5."},
    {part: "recap", board: {m: "words", big: "Table, then points, then a straight line through (0, 0)", small: "Total ÷ parts = one part"},
      say: "Recap. Use a ratio table to organize equivalent ratios. Each column is a point on a graph, and the points make a straight line through 0, 0. When you know a total, add the parts, divide to find one part, then multiply. When you know a difference, find how many parts the difference is. Now practice. Three right in a row masters the lesson, and then the unit test is waiting for you."}
  ],
  alt: [
    {part: "idea", board: {m: "dnl", top: ["Flour", 0, 2, 4, 6, 8], bot: ["Eggs", 0, 3, 6, 9, 12], hl: 4},
      say: "Another view: a double number line. Every 2 cups of flour lines up with 3 eggs. Count the jumps: 8 cups is 4 jumps of 2, so it lines up with 4 jumps of 3, which is 12 eggs."},
    {part: "see", board: {m: "pts", pts: [[2, 3], [8, 12]], line: true, xl: "Flour", yl: "Eggs"},
      say: "On a graph, the pairs from the number line sit on one straight line. Any point on that line, like 8 and 12, is an equivalent ratio."},
    {part: "recap", board: {m: "words", big: "Same ratio, same line"},
      say: "Tables, number lines and graphs are three pictures of the same idea: equivalent ratios grow together at a steady rate."}
  ],
  notes: {idea: "Organize equivalent ratios in a table. They graph as points on a straight line through the origin. For a total, find the value of one part.",
    examples: ["2 cups of flour for 3 eggs, so 8 cups for 12 eggs", "Points (2, 3), (4, 6), (6, 9) lie on one line through (0, 0)", "Cats to dogs 4:5 with 27 animals: 3 in each part, 12 cats and 15 dogs", "Boys to girls 2:3 with 5 more girls: 1 part is 5, so 10 boys"],
    watch: "First quantity across, second up. Part-to-part isn't part-to-whole."},
  templates: [
    {id: "1.12-point", type: "mc", tag: "CONCEPT", diff: 1, est: 30, make(R) {
      const [a, b] = twoDiff(R, 1, 6), k = ri(R, 2, 6), [x, y] = pick(R, [["cups of flour", "eggs"], ["hours", "dollars"], ["laps", "minutes"]]), right = `(${a * k}, ${b * k})`;
      return {stem: `A graph shows the ratio ${rat(a, b)} of ${x} to ${y}, with ${x} across. Which point is on the graph?`, right, whyRight: `Both numbers are ${rat(a, b)} multiplied by ${k}.`,
        wrong: three(right, [[`(${b * k}, ${a * k})`, `The numbers are switched: ${x} go across.`, "XY_SWAP"], [`(${a + k}, ${b + k})`, `That adds ${k} to both numbers, which changes the ratio.`, "ADD_SAME"], [`(${a * k}, ${b * k + 1})`, "That point is just off the line.", null]],
          j => [`(${a * k + j}, ${b * k})`, "That point is off the line.", null]),
        hints: [`Points on the graph are equivalent ratios of ${rat(a, b)}.`, `Look for a point where both numbers are ${a} and ${b} times the same number.`],
        sol: [`${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k} | Both times ${k}, in the same order.`], p: {a, b}};
    }, verify: it => { const [u, v] = nums(it.right); return eqRatio(u, v, it.p.a, it.p.b) && it.wrong.every(w => { const [s, t] = nums(w[0]); return !eqRatio(s, t, it.p.a, it.p.b); }); }},
    {id: "1.12-parts", type: "num", tag: "APPLICATION", diff: 2, est: 60, word: true, make(R) {
      const [x, y, all] = pick(R, [["cats", "dogs", "animals at the shelter"], ["red marbles", "blue marbles", "marbles in the bag"], ["fiction books", "nonfiction books", "books on the shelf"], ["boys", "girls", "students in the club"]]);
      const [a, b] = coprime(R, 1, 7), k = ri(R, 2, 9), T = (a + b) * k, ans = a * k;
      return {stem: `The ratio of ${x} to ${y} is ${rat(a, b)}. There are ${T} ${all} in all. How many ${x} are there?`, ans, post: x,
        traps: traps(ans, [[k, `That's the value of one part. The ${x} are ${a} parts.`, "ONE_PART"], [new Q(a * T, b).frac(), `That treats ${b} as the whole. The whole is ${a} + ${b} = ${a + b} parts.`, "PART_WHOLE"], [b * k, `That's the ${y}. The question asks for the ${x}.`, null]]),
        frame: {find: [`How many ${x}`, `How many parts in all`, `How many ${y}`], tool: [`Add the parts, divide the total by the parts, then multiply by the ${x} parts`, `Divide the total by ${a}`, `Multiply the total by ${a}`],
          check: `The ${x} plus the ${y} should equal ${T}, and their ratio should simplify to ${rat(a, b)}.`},
        hints: [`How many parts are there in all? ${a} + ${b}.`, `${T} ÷ ${a + b} = ${k} in each part.`],
        sol: [`${a} + ${b} = ${a + b} | Parts in all.`, `${T} ÷ ${a + b} = ${k} | One part.`, `${a} × ${k} = ${ans} | The ${x} are ${a} parts.`], p: {a, b, T}};
    }, verify: it => eqRatio(it.ans, it.p.T - it.ans, it.p.a, it.p.b)},
    {id: "1.12-scale", type: "num", tag: "APPLICATION", diff: 2, est: 50, word: true, make(R) {
      const [setup, ask, unit, x, y] = pick(R, [
        [(a, b) => `A granola recipe uses ${a} cups of oats for every ${b} cups of raisins.`, n => `How many cups of oats go with ${n} cups of raisins?`, "cups", "oats", "raisins"],
        [(a, b) => `A bracelet pattern uses ${a} blue beads for every ${b} white beads.`, n => `How many blue beads go with ${n} white beads?`, "beads", "blue beads", "white beads"],
        [(a, b) => `A lemonade recipe uses ${a} cups of lemon juice for every ${b} cups of water.`, n => `How many cups of lemon juice go with ${n} cups of water?`, "cups", "lemon juice", "water"],
        [(a, b) => `A concrete mix uses ${a} buckets of sand for every ${b} buckets of gravel.`, n => `How many buckets of sand go with ${n} buckets of gravel?`, "buckets", "sand", "gravel"]]);
      const [a, b] = twoDiff(R, 2, 7), k = ri(R, 2, 6), ans = a * k;
      return {stem: `${setup(a, b)} ${ask(b * k)}`, ans, post: unit,
        traps: traps(ans, [[a + b * k - b, `That adds ${b * k - b} to both, which changes the mix. Multiply both by ${k}.`, "ADD_SAME"], [b * k, `That's the ${y}. The question asks for the ${x}.`, null]]),
        frame: {find: [`The amount of ${x} needed`, `The amount of ${y}`, "The total amount"], tool: ["Find the scale factor, then multiply both amounts by it", "Add the same amount to both", "Subtract the two amounts"],
          check: `${ans} to ${b * k} should simplify back to ${a} to ${b}.`},
        hints: [`What do you multiply ${b} by to get ${b * k}?`, `${b} × ${k} = ${b * k}, so multiply ${a} by ${k} too.`],
        sol: [`${b} × ${k} = ${b * k} | The scale factor is ${k}.`, `${a} × ${k} = ${ans} | Multiply the first amount by ${k} too.`], p: {a, b, k}};
    }, verify: it => eqRatio(it.ans, it.p.b * it.p.k, it.p.a, it.p.b)},
    {id: "1.12-graph", type: "num", tag: "PROCEDURE", diff: 2, est: 45, make(R) {
      const u = ri(R, 5, 15), h = pick(R, [3, 5, 7, 8, 10]), ans = h * u;
      return {stem: `The graph shows hours worked and dollars earned, at the same pay for every hour. How many dollars are earned for ${h} hours?`, pre: "$", ans,
        board: {m: "pts", pts: [[2, 2 * u], [4, 4 * u], [6, 6 * u]], line: true, xl: "Hours worked", yl: "Dollars earned"},
        traps: traps(ans, [[h + u, "That adds. Find the dollars for 1 hour, then multiply.", null], [6 * u + h - 6, `Each extra hour adds $${u}, not $1.`, "SKIP_PATTERN"]]),
        hints: ["Use any point to find the dollars for 1 hour.", `(2, ${2 * u}) means 2 hours pay $${2 * u}, so 1 hour pays $${u}.`],
        sol: [`${2 * u} ÷ 2 = ${u} | Dollars for 1 hour.`, `${h} × ${u} = ${ans} | Dollars for ${h} hours.`], p: {u, h}};
    }, verify: it => it.ans === it.p.u * it.p.h},
    {id: "1.12-online", type: "yn", tag: "CONCEPT", diff: 2, est: 45, make(R) {
      let a, b, k, m; do { [a, b] = coprime(R, 1, 6); k = ri(R, 2, 5); m = ri(R, 1, 4); } while (new Set([`(${a * k}, ${b * k})`, `(${b}, ${a})`, `(${a + m}, ${b + m})`]).size < 3);
      const rows = shuffle(R, [[`(${a * k}, ${b * k})`, true, `Both numbers are ${a} and ${b} times ${k}.`], [`(${b}, ${a})`, false, "The numbers are switched."], [`(${a + m}, ${b + m})`, false, `That adds ${m} to both, which changes the ratio.`],
        ["(0, 0)", true, "Every graph of equivalent ratios goes through the origin."]]);
      return {stem: `A graph shows the ratio ${rat(a, b)}, with the first quantity across. Is each point on the graph?`, rows,
        hints: [`A point is on the graph if its numbers are an equivalent ratio to ${rat(a, b)}, in the same order.`, "Every graph of equivalent ratios passes through (0, 0)."],
        sol: [`Points on the graph are ${rat(a, b)} times the same number | In the same order, first across.`], p: {a, b}};
    }, verify: it => it.rows.every(r => { const [x, y] = nums(r.t); return (x === 0 && y === 0 ? true : eqRatio(x, y, it.p.a, it.p.b)) === r.ok; })},
    {id: "1.12-diff", type: "num", tag: "APPLICATION", diff: 3, est: 70, word: true, make(R) {
      let a, b; do { [a, b] = coprime(R, 1, 7); } while (b <= a);
      const k = ri(R, 2, 8), D = (b - a) * k, ans = a * k, [x, y, where] = pick(R, [["boys", "girls", "in a club"], ["adults", "kids", "at a picnic"], ["red cars", "blue cars", "in a parking lot"]]);
      return {stem: `The ratio of ${x} to ${y} ${where} is ${rat(a, b)}. There are ${D} more ${y} than ${x}. How many ${x} are there?`, ans, post: x,
        traps: traps(ans, [[k, `That's one part. The ${x} are ${a} parts.`, "ONE_PART"], [b * k, `That's the ${y}. The question asks for the ${x}.`, null], [new Q(D * a, b).frac(), "Find how many parts the difference is first.", "PART_WHOLE"]]),
        frame: {find: [`How many ${x}`, `How many more ${y} there are`, "The total number"], tool: [`The difference is ${b} − ${a} parts: find one part, then multiply by ${a}`, `Divide ${D} by ${a}`, `Add ${D} to ${a}`],
          check: `The ${y} minus the ${x} should be ${D}, and the ratio should simplify to ${rat(a, b)}.`},
        hints: [`The difference is ${b} parts minus ${a} parts.`, `${b - a} part${b - a > 1 ? "s" : ""} = ${D}, so one part is ${k}.`],
        sol: [`${b} − ${a} = ${b - a} | The difference in parts.`, `${D} ÷ ${b - a} = ${k} | One part.`, `${a} × ${k} = ${ans} | The ${x} are ${a} parts.`], p: {a, b, D}};
    }, verify: it => eqRatio(it.ans, it.ans + it.p.D, it.p.a, it.p.b)},
    {id: "1.12-total", type: "num", tag: "APPLICATION", diff: 3, est: 60, word: true, make(R) {
      const [a, b] = coprime(R, 1, 7), k = ri(R, 2, 9), Rr = a * k, ans = (a + b) * k, [x, y, all] = pick(R, [["red marbles", "blue marbles", "marbles"], ["roses", "tulips", "flowers"], ["dogs", "cats", "pets"]]);
      return {stem: `The ratio of ${x} to ${y} is ${rat(a, b)}. There are ${Rr} ${x}. How many ${all} are there in all?`, ans, post: all,
        traps: traps(ans, [[b * k, `That's the ${y}. Add the ${x} for the total.`, "PART_WHOLE"], [Rr + b, "Find the value of one part first.", "ONE_PART"]]),
        frame: {find: [`The total number of ${all}`, `How many ${y}`, `How many more ${y} than ${x}`], tool: [`Find one part from the ${x}, then multiply by all ${a + b} parts`, `Add ${b} to ${Rr}`, `Multiply ${Rr} by ${b}`],
          check: `The ${x} should be ${a} out of every ${a + b} ${all}.`},
        hints: [`${Rr} ${x} is ${a} part${a > 1 ? "s" : ""}. How much is one part?`, `One part is ${k}. There are ${a + b} parts in all.`],
        sol: [`${Rr} ÷ ${a} = ${k} | One part.`, `${a + b} × ${k} = ${ans} | All ${a + b} parts.`], p: {a, b, Rr}};
    }, verify: it => eqRatio(it.p.Rr, it.ans, it.p.a, it.p.a + it.p.b)}
  ]
});

}
