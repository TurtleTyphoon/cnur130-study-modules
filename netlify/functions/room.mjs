// Netlify Function: live study-group games. The host creates a room and steps through the
// questions; players join with the room code, answer on their own screens and score points.
// Only the host writes the room record; each player's join and answer is its own blob,
// so many people answering at once never overwrite each other.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const store = () => getStore({ name: "rooms", consistency: "strong" });
const hash = (k) => createHash("sha256").update(k).digest("hex");
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const CODE = /^[A-Z2-9]{5}$/;
const PID = /^[a-z0-9]{4,24}$/;
const TOKEN = /^[A-Za-z0-9-]{16,64}$/;
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f<>&"'`]/g, "").trim().slice(0, 24);
const newCode = () => Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const QUESTION_MS = 20000;

const publicRoom = ({ h, ...room }) => room;

export default async (req) => {
  const s = store();
  const url = new URL(req.url);

  if (req.method === "GET") {
    const code = (url.searchParams.get("code") || "").toUpperCase();
    if (!CODE.test(code)) return json({ error: "Bad code" }, 400);
    let room = await s.get("room/" + code, { type: "json" });
    if (!room) return json({ error: "No room with that code" }, 404);
    const hostKey = req.headers.get("x-host-key") || "";
    if (!hostKey || hash(hostKey) !== room.h) return json({ room: publicRoom(room) });

    // Host poll: fold new players into the room and count answers for the current question.
    const { blobs } = await s.list({ prefix: "p/" + code + "/" });
    const known = room.names || {};
    const fresh = blobs.map((b) => b.key.split("/")[2]).filter((pid) => !known[pid]).slice(0, 60);
    if (fresh.length) {
      const got = await Promise.all(fresh.map((pid) => s.get("p/" + code + "/" + pid, { type: "json" }).catch(() => null)));
      const names = { ...known };
      got.filter(Boolean).forEach((p) => { names[p.pid] = p.name; });
      room = { ...room, names };
      await s.setJSON("room/" + code, room);
    }
    let answered = 0;
    if (room.phase === "question") answered = (await s.list({ prefix: "a/" + code + "/" + room.i + "/" })).blobs.length;
    return json({ room: publicRoom(room), answered });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const text = await req.text();
  if (text.length > 4000) return json({ error: "Too large" }, 413);
  let b;
  try { b = JSON.parse(text); } catch { return json({ error: "Bad JSON" }, 400); }

  if (b.action === "create") {
    const qs = Array.isArray(b.qs) ? b.qs : [];
    if (qs.length < 1 || qs.length > 30 || !qs.every((q) => Number.isInteger(q) && q >= 0 && q < 5000)) return json({ error: "Bad questions" }, 400);
    if (!TOKEN.test(b.hostKey || "")) return json({ error: "Bad host key" }, 400);
    let code = newCode();
    for (let i = 0; i < 5 && (await s.get("room/" + code)); i++) code = newCode();
    const room = { code, qs, host: cleanName(b.name) || "Host", i: -1, phase: "lobby", qAt: 0, names: {}, scores: {}, last: null, h: hash(b.hostKey), t: Date.now() };
    await s.setJSON("room/" + code, room);
    return json({ room: publicRoom(room) });
  }

  const code = String(b.code || "").toUpperCase();
  if (!CODE.test(code)) return json({ error: "Bad code" }, 400);
  const room = await s.get("room/" + code, { type: "json" });
  if (!room) return json({ error: "No room with that code" }, 404);

  if (b.action === "join") {
    if (!PID.test(b.pid || "")) return json({ error: "Bad player" }, 400);
    const name = cleanName(b.name);
    if (!name) return json({ error: "Enter a name" }, 400);
    if (room.phase === "done") return json({ error: "That game has ended" }, 409);
    await s.setJSON("p/" + code + "/" + b.pid, { pid: b.pid, name, t: Date.now() });
    return json({ room: publicRoom(room) });
  }

  if (b.action === "answer") {
    if (!PID.test(b.pid || "")) return json({ error: "Bad player" }, 400);
    if (room.phase !== "question" || room.i !== b.i) return json({ error: "Too late" }, 409);
    if (!Number.isInteger(b.a) || b.a < 0 || b.a > 7) return json({ error: "Bad answer" }, 400);
    const key = "a/" + code + "/" + room.i + "/" + b.pid;
    if (!(await s.get(key))) await s.setJSON(key, { pid: b.pid, a: b.a, at: Date.now() });
    return json({ ok: true });
  }

  if (b.action === "host") {
    if (!TOKEN.test(b.hostKey || "") || hash(b.hostKey) !== room.h) return json({ error: "Not the host" }, 403);
    let next = { ...room };
    if (b.cmd === "next" && (room.phase === "lobby" || room.phase === "reveal")) {
      next.i = room.i + 1;
      next = next.i >= room.qs.length ? { ...next, phase: "done" } : { ...next, phase: "question", qAt: Date.now(), last: null };
    } else if (b.cmd === "reveal" && room.phase === "question") {
      const c = Number.isInteger(b.c) ? b.c : -1;
      const { blobs } = await s.list({ prefix: "a/" + code + "/" + room.i + "/" });
      const answers = (await Promise.all(blobs.slice(0, 80).map((x) => s.get(x.key, { type: "json" }).catch(() => null)))).filter(Boolean);
      const counts = {}, gains = {}, scores = { ...room.scores };
      answers.forEach(({ pid, a, at }) => {
        counts[a] = (counts[a] || 0) + 1;
        const pts = a === c ? 100 + Math.round(50 * Math.max(0, 1 - (at - room.qAt) / QUESTION_MS)) : 0;
        gains[pid] = pts;
        scores[pid] = (scores[pid] || 0) + pts;
      });
      next = { ...next, phase: "reveal", scores, last: { c, counts, gains, picks: Object.fromEntries(answers.map((x) => [x.pid, x.a])) } };
    } else if (b.cmd === "end") {
      next.phase = "done";
    } else {
      return json({ room: publicRoom(room) });
    }
    await s.setJSON("room/" + code, next);
    return json({ room: publicRoom(next) });
  }
  return json({ error: "Unknown action" }, 400);
};

// Everyone in a classroom can share one IP address, and players poll every couple of seconds.
export const config = { path: "/api/room", rateLimit: { windowLimit: 2000, windowSize: 60, aggregateBy: ["ip", "domain"] } };
