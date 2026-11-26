// Builds English 10H from app.html, content/*.js, lib/checker.js and js/NN-*.js. Copied from Math 6's build.
//   ../index.html, ../sw.js, ../manifest.webmanifest   installable web app (GitHub Pages): iPad Home Screen, offline
//   English-10H.html   single offline file: fonts embedded, no network, backup/restore
//   english-10h.html   version for a Claude artifact preview (Google Fonts)
// Run make_icons.py first if the icons are missing.
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

const DESC = "Honors English 10 (Issaquah): Lord of the Flies and critical lenses, reading checks, an essay coach, an offline draft checker and timed writes. Works offline.";
const APP_HEAD = `<meta name="description" content="${DESC}">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="English 10H">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#5b21b6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#b4a0ff" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">`;
const ICONS = ["icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const MANIFEST = JSON.stringify({
  name: "English 10H", short_name: "English 10H", description: DESC,
  id: "./", start_url: "./", scope: "./", display: "standalone", orientation: "any",
  background_color: "#fbfaf7", theme_color: "#5b21b6", lang: "en", categories: ["education"],
  icons: [
    {src: "icon-192.png", sizes: "192x192", type: "image/png"},
    {src: "icon-512.png", sizes: "512x512", type: "image/png"},
    {src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"}
  ]
}, null, 1);

const CONTENT = ["course.js", "lotf.js", "lenses.js", "terms.js", "writing.js", "coach.js"];
const appFiles = fs.readdirSync(here("js")).filter(f => /^\d\d-[\w-]+\.js$/.test(f)).sort();
const base = fs.readFileSync(here("app.html"), "utf8")
  .replace("/*__CONTENT__*/", () => CONTENT.map(f => `// ===== content/${f}\n` + strip("content/" + f)).join("\n"))
  .replace("/*__LIB__*/", () => strip("lib/checker.js"))
  .replace("/*__APP__*/", () => appFiles.map(f => `// ===== js/${f}\n` + fs.readFileSync(here("js/" + f), "utf8")).join("\n"));
if (/\/\*__(CONTENT|LIB|APP)__/.test(base)) throw new Error("placeholder left");

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

fs.writeFileSync(here("english-10h.html"), web);
fs.writeFileSync(here("English-10H.html"), off);
fs.writeFileSync(root("index.html"), app);
fs.writeFileSync(root("manifest.webmanifest"), MANIFEST + "\n");
fs.writeFileSync(root("sw.js"), sw);
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
console.log(`app ${kb(app)} (cache eng10h-${version}, ${CONTENT.length} content files, ${appFiles.length} app files); single file ${kb(off)}; artifact ${kb(web)}`);
