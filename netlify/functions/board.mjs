// Netlify Function: shared class leaderboard, stored in Netlify Blobs (one blob per profile).
// GET lists everyone; POST saves your own row; DELETE removes it. Each row is locked to a
// secret key the browser generated, so nobody else can overwrite or delete it.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const store = () => getStore({ name: "leaderboard", consistency: "strong" });
const hash = (k) => createHash("sha256").update(k).digest("hex");
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const ID = /^u[a-z0-9]{4,16}$/;
const TOKEN = /^[A-Za-z0-9-]{16,64}$/;
const WORD = /^[a-z0-9]{1,20}$/i;

// Keep only numbers, booleans and short plain words, a few levels deep. Stats never need more.
function clean(v, depth = 0) {
  if (typeof v === "number") return Number.isFinite(v) ? Math.max(-1e7, Math.min(1e7, Math.round(v))) : 0;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return WORD.test(v) ? v : undefined;
  if (depth >= 3 || v === null || typeof v !== "object") return undefined;
  if (Array.isArray(v)) return v.slice(0, 12).map((x) => clean(x, depth + 1)).filter((x) => x !== undefined);
  const out = {};
  for (const [k, x] of Object.entries(v).slice(0, 40)) {
    if (!WORD.test(k)) continue;
    const c = clean(x, depth + 1);
    if (c !== undefined) out[k] = c;
  }
  return out;
}
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f<>&"'`]/g, "").trim().slice(0, 24);

export default async (req) => {
  const s = store();

  if (req.method === "GET") {
    const { blobs } = await s.list();
    const rows = (await Promise.all(blobs.slice(0, 500).map((b) => s.get(b.key, { type: "json" }).catch(() => null))))
      .filter(Boolean)
      .map(({ id, name, avatar, st, t }) => ({ id, name, avatar, st, t }))
      .sort((a, b) => (b.st?.points || 0) - (a.st?.points || 0))
      .slice(0, 200);
    return json({ rows });
  }

  if (req.method !== "POST" && req.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
  const text = await req.text();
  if (text.length > 12000) return json({ error: "Too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }
  if (!ID.test(body.id || "") || !TOKEN.test(body.key || "")) return json({ error: "Bad id or key" }, 400);

  const existing = await s.get(body.id, { type: "json" });
  if (existing && existing.h !== hash(body.key)) return json({ error: "Not your row" }, 403);

  if (req.method === "DELETE") {
    await s.delete(body.id);
    return json({ ok: true });
  }

  const name = cleanName(body.name);
  if (!name) return json({ error: "Name required" }, 400);
  const st = clean(body.st) || {};
  if (!Array.isArray(st.perMod)) st.perMod = [];
  if (!Array.isArray(st.modPts)) st.modPts = [];
  await s.setJSON(body.id, { id: body.id, name, avatar: clean(body.avatar) || {}, st, h: hash(body.key), t: Date.now() });
  return json({ ok: true });
};

export const config = {
  path: "/api/board",
  rateLimit: { windowLimit: 600, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
