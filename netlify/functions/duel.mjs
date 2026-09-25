// Netlify Function: head-to-head duels. One person creates a duel (a fixed set of NCLEX
// question numbers) and shares the code; everyone who plays it posts one result.
import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "duels", consistency: "strong" });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const CODE = /^[A-Z2-9]{6}$/;
const PID = /^[a-z0-9]{4,24}$/;
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f<>&"'`]/g, "").trim().slice(0, 24);
const newCode = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const MODS = ["all", "m1", "m2", "m3", "m4"];

export default async (req) => {
  const s = store();
  const url = new URL(req.url);

  if (req.method === "GET") {
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!CODE.test(code)) return json({ error: "Bad code" }, 400);
    const duel = await s.get("d/" + code, { type: "json" });
    if (!duel) return json({ error: "No duel with that code" }, 404);
    const { blobs } = await s.list({ prefix: "r/" + code + "/" });
    const results = (await Promise.all(blobs.slice(0, 60).map((b) => s.get(b.key, { type: "json" }).catch(() => null)))).filter(Boolean);
    return json({ duel, results });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const text = await req.text();
  if (text.length > 4000) return json({ error: "Too large" }, 413);
  let b;
  try { b = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }

  if (b.action === "create") {
    const qs = Array.isArray(b.qs) ? b.qs : [];
    if (qs.length < 3 || qs.length > 20 || !qs.every((q) => Number.isInteger(q) && q >= 0 && q < 5000)) return json({ error: "Bad questions" }, 400);
    const by = cleanName(b.name) || "Someone";
    let code = newCode();
    for (let i = 0; i < 5 && (await s.get("d/" + code)); i++) code = newCode();
    await s.setJSON("d/" + code, { code, qs, mod: MODS.includes(b.mod) ? b.mod : "all", by, t: Date.now() });
    return json({ code });
  }

  if (b.action === "result") {
    const code = String(b.code || "").toUpperCase();
    if (!CODE.test(code) || !PID.test(b.pid || "")) return json({ error: "Bad code or player" }, 400);
    const duel = await s.get("d/" + code, { type: "json" });
    if (!duel) return json({ error: "No duel with that code" }, 404);
    const key = "r/" + code + "/" + b.pid;
    if (await s.get(key)) return json({ ok: true, already: true });
    const picks = (Array.isArray(b.picks) ? b.picks : []).slice(0, duel.qs.length).map((p) => (Number.isInteger(p) && p >= 0 && p < 8 ? p : -1));
    const score = Math.max(0, Math.min(duel.qs.length, Number.isInteger(b.score) ? b.score : 0));
    const ms = Math.max(0, Math.min(3600000, Number.isFinite(b.ms) ? Math.round(b.ms) : 0));
    await s.setJSON(key, { pid: b.pid, name: cleanName(b.name) || "Player", score, picks, ms, t: Date.now() });
    return json({ ok: true });
  }
  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/duel", rateLimit: { windowLimit: 300, windowSize: 60, aggregateBy: ["ip", "domain"] } };
