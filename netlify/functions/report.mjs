// Netlify Function: "Report a problem". Anyone can send a report; only someone with the
// REPORTS_KEY (set in Netlify → Site configuration → Environment variables) can read or clear them.
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const store = () => getStore({ name: "reports", consistency: "strong" });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const clip = (v, n) => String(v || "").replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n);

function isAdmin(req) {
  const want = process.env.REPORTS_KEY || "";
  const got = req.headers.get("x-admin-key") || "";
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export default async (req) => {
  const s = store();

  if (req.method === "POST") {
    const text = await req.text();
    if (text.length > 6000) return json({ error: "Too large" }, 413);
    let b;
    try { b = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }
    const msg = clip(b.text, 1500);
    if (msg.length < 3) return json({ error: "Tell us what's wrong" }, 400);
    const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    await s.setJSON(id, { id, text: msg, where: clip(b.where, 200), item: clip(b.item, 400), mod: clip(b.mod, 20), ch: Number.isInteger(b.ch) ? b.ch : 0, name: clip(b.name, 24), t: Date.now() });
    return json({ ok: true });
  }

  if (!process.env.REPORTS_KEY) return json({ error: "REPORTS_KEY is not set in Netlify yet" }, 503);
  if (!isAdmin(req)) return json({ error: "Wrong key" }, 403);

  if (req.method === "GET") {
    const { blobs } = await s.list();
    const reports = (await Promise.all(blobs.slice(-300).map((b) => s.get(b.key, { type: "json" }).catch(() => null)))).filter(Boolean).sort((a, b) => b.t - a.t);
    return json({ reports });
  }
  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!/^[a-z0-9]+-[a-z0-9]+$/.test(id)) return json({ error: "Bad id" }, 400);
    await s.delete(id);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/report", rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] } };
