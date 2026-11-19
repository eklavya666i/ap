// Builds SAT Daily from app.html and the question banks.
//   ../index.html, ../sw.js, ../manifest.webmanifest   installable web app (GitHub Pages): iPad Home Screen, offline
//   SAT-Daily.html   single offline file for a laptop: fonts embedded, no network, backup/restore
//   sat-daily.html   version for the Claude artifact (Google Fonts, account sync)
// Run make_icons.py first if the icons in the repo root are missing.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const here = f => path.join(__dirname, f), root = f => path.join(__dirname, "..", f);
const FONTS = [here("node_modules/@fontsource-variable"), "/home/claude/fontpkg/node_modules/@fontsource-variable"].find(p => fs.existsSync(p));
if (!FONTS) throw new Error("fonts missing: run npm install in src/");
const strip = f => fs.readFileSync(here(f), "utf8").replace(/^if \(typeof module.*$/m, "").trim();

function embeddedFonts() {
  const pick = (cssFile, family, keep) => {
    const css = fs.readFileSync(`${FONTS}/${cssFile}`, "utf8");
    return [...css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[^}]*})/g)]
      .filter(m => keep.includes(m[1]))
      .map(m => m[2]
        .replace(/font-family: '[^']+'/, `font-family: '${family}'`)
        .replace(/url\(\.\/files\/([\w.-]+)\) format\('woff2-variations'\)/, (_, f) =>
          `url(data:font/woff2;base64,${fs.readFileSync(`${FONTS}/${cssFile.split("/")[0]}/files/${f}`).toString("base64")}) format('woff2')`));
  };
  const faces = [
    ...pick("archivo/wdth.css", "Archivo", ["archivo-latin-ext-wdth-normal", "archivo-latin-wdth-normal"]),
    ...pick("source-serif-4/wght.css", "Source Serif 4", ["source-serif-4-latin-ext-wght-normal", "source-serif-4-latin-wght-normal"]),
    ...pick("source-serif-4/wght-italic.css", "Source Serif 4", ["source-serif-4-latin-ext-wght-italic", "source-serif-4-latin-wght-italic"])
  ];
  if (faces.length !== 6) throw new Error("expected 6 font faces, got " + faces.length);
  return `<style>/* Archivo and Source Serif 4, SIL Open Font License 1.1 (openfontlicense.org) */\n${faces.join("\n")}</style>`;
}

const WEB_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,400..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..600;1,8..60,400..600&display=swap" rel="stylesheet">`;

const DESC = "Two questions from each of the eight SAT skill areas, every day, with an explanation for every answer. Works offline.";
const APP_HEAD = `<meta name="description" content="${DESC}">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SAT Daily">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#ffc72c" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#f0b91c" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">`;

const ICONS = ["icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const MANIFEST = JSON.stringify({
  name: "SAT Daily", short_name: "SAT Daily", description: DESC,
  id: "./", start_url: "./", scope: "./", display: "standalone", orientation: "any",
  background_color: "#ffffff", theme_color: "#ffc72c", lang: "en", categories: ["education"],
  icons: [
    {src: "icon-192.png", sizes: "192x192", type: "image/png"},
    {src: "icon-512.png", sizes: "512x512", type: "image/png"},
    {src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"}
  ]
}, null, 1);

const base = fs.readFileSync(here("app.html"), "utf8")
  .replace("/*__RW__*/", () => strip("rw_bank.js"))
  .replace("/*__RW2__*/", () => strip("rw_bank2.js"))
  .replace("/*__GEN__*/", () => ["gen_a.js", "gen_b.js", "gen_c.js", "gen_d.js", "gen_x.js"].map(strip).join("\n"))
  .replace("/*__MATH__*/", () => strip("math_gen.js"));
if (/\/\*__(RW|MATH|GEN)/.test(base)) throw new Error("placeholder left");

const fonts = embeddedFonts();
const web = base.replace("<!--__HEAD__-->\n", "").replace("<!--__FONTS__-->", () => WEB_FONTS);
const off = base.replace("<!--__HEAD__-->\n", "").replace("<!--__FONTS__-->", () => fonts).replace("/*__OFFLINE__*/false", "/*__OFFLINE__*/true");
const app = base.replace("<!--__HEAD__-->", () => APP_HEAD).replace("<!--__FONTS__-->", () => fonts)
  .replace("/*__OFFLINE__*/false", "/*__OFFLINE__*/true").replace("/*__PWA__*/false", "/*__PWA__*/true");
if (!off.includes("/*__OFFLINE__*/true") || !app.includes("/*__PWA__*/true") || web.includes("/*__PWA__*/true")) throw new Error("flags not set");

for (const f of ICONS) if (!fs.existsSync(root(f))) throw new Error(`${f} missing: run python3 make_icons.py`);
const h = crypto.createHash("sha256").update(app).update(MANIFEST);
for (const f of ICONS) h.update(fs.readFileSync(root(f)));
const version = h.digest("hex").slice(0, 12);
const sw = fs.readFileSync(here("sw.template.js"), "utf8")
  .replace("__VERSION__", version)
  .replace("__FILES__", JSON.stringify(["./", "index.html", "manifest.webmanifest", ...ICONS]));

fs.writeFileSync(here("sat-daily.html"), web);
fs.writeFileSync(here("SAT-Daily.html"), off);
fs.writeFileSync(root("index.html"), app);
fs.writeFileSync(root("manifest.webmanifest"), MANIFEST + "\n");
fs.writeFileSync(root("sw.js"), sw);
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
console.log(`app ${kb(app)} (cache satdaily-${version}); laptop file ${kb(off)}; artifact ${kb(web)}`);
