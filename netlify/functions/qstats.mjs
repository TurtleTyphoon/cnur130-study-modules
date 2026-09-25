// Netlify Function: class-wide question difficulty. Each player's first attempt at each
// question is stored in their own blob (so simultaneous writers never collide); the
// aggregate { questionId: [right, total] } is rebuilt at most every 10 minutes.
import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "qstats", consistency: "strong" });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const PID = /^[a-z0-9]{4,24}$/;
const QID = /^[A-Za-z0-9_-]{1,48}$/;
const MAX_PER_PLAYER = 1500;
const STALE_MS = 10 * 60 * 1000;

export default async (req) => {
  const s = store();

  if (req.method === "GET") {
    const cached = await s.get("agg", { type: "json" });
    if (cached && Date.now() - cached.t < STALE_MS) return json(cached);
    const { blobs } = await s.list({ prefix: "u/" });
    const agg = {};
    const players = await Promise.all(blobs.slice(0, 2000).map((b) => s.get(b.key, { type: "json" }).catch(() => null)));
    players.filter(Boolean).forEach((p) => Object.entries(p).forEach(([q, ok]) => { const a = agg[q] || (agg[q] = [0, 0]); a[1]++; if (ok === 1) a[0]++; }));
    const out = { t: Date.now(), players: players.filter(Boolean).length, agg };
    await s.setJSON("agg", out);
    return json(out);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const text = await req.text();
  if (text.length > 60000) return json({ error: "Too large" }, 413);
  let b;
  try { b = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }
  if (!PID.test(b.pid || "") || !b.res || typeof b.res !== "object") return json({ error: "Bad request" }, 400);
  const key = "u/" + b.pid, mine = (await s.get(key, { type: "json" })) || {};
  let added = 0;
  for (const [q, ok] of Object.entries(b.res)) {
    if (!QID.test(q) || (ok !== 0 && ok !== 1) || q in mine) continue; // first attempt only
    if (Object.keys(mine).length >= MAX_PER_PLAYER) break;
    mine[q] = ok; added++;
  }
  if (added) await s.setJSON(key, mine);
  return json({ ok: true, added });
};

export const config = { path: "/api/qstats", rateLimit: { windowLimit: 600, windowSize: 60, aggregateBy: ["ip", "domain"] } };
