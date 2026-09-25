// Netlify build step: unpack the self-extracting index.html into plain files so browsers
// load the page directly instead of decompressing it on every visit. Mirrors what the
// bundle's own loader does at runtime: decompress each embedded asset, point the template
// at it, strip integrity/crossorigin, and inject the window.__resources map.
// index.html stays the source of truth; the output goes to dist/.
import fs from "node:fs";
import zlib from "node:zlib";
import crypto from "node:crypto";

const src = fs.readFileSync("index.html", "utf8");
const block = (type) => {
  const open = `<script type="${type}">`, i = src.indexOf(open);
  if (i < 0) return null;
  return src.slice(i + open.length, src.indexOf("</script>", i));
};

const manifest = JSON.parse(block("__bundler/manifest"));
let template = JSON.parse(block("__bundler/template"));
const extResources = JSON.parse(block("__bundler/ext_resources") || "[]");
const pageOrder = JSON.parse(block("__bundler/page_order") || "[]");
if (pageOrder.length) throw new Error("Bundles with nested pages aren't supported by this build step.");

const EXT = { "application/javascript": "js", "text/javascript": "js", "text/css": "css", "application/json": "json", "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg", "font/woff2": "woff2", "font/woff": "woff" };
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/assets", { recursive: true });

const urls = {}, lazy = new Set();
for (const [uuid, entry] of Object.entries(manifest)) {
  let bytes = Buffer.from(entry.data, "base64");
  if (entry.compressed) bytes = zlib.gunzipSync(bytes);
  // Content-hashed names so the files can be cached forever.
  const name = `assets/${crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 16)}.${EXT[entry.mime] || "bin"}`;
  fs.writeFileSync(`dist/${name}`, bytes);
  urls[uuid] = name;
  // Mermaid (diagram library, ~3.5 MB) only draws diagrams and the app retries until it's
  // ready, so load it in the background instead of blocking the first paint.
  if (bytes.subarray(0, 200).toString().includes("mermaid")) lazy.add(name);
}
for (const [uuid, url] of Object.entries(urls)) template = template.split(uuid).join(url);
template = template.replace(/\s+integrity="[^"]*"/gi, "").replace(/\s+crossorigin="[^"]*"/gi, "");
for (const name of lazy) template = template.split(`<script src="${name}">`).join(`<script async src="${name}">`);

const resources = {};
for (const e of extResources) if (urls[e.uuid]) resources[e.id] = urls[e.uuid];
const head = template.match(/<head[^>]*>/i);
if (!head) throw new Error("Template has no <head>.");
const at = head.index + head[0].length;
template = template.slice(0, at) + "<script>window.__resources = " + JSON.stringify(resources).replace(/<\//g, "<\\/") + ";</script>" + template.slice(at);

fs.writeFileSync("dist/index.html", template);
console.log(`Unbundled ${Object.keys(urls).length} assets; dist/index.html is ${(template.length / 1024).toFixed(0)} KB.`);
