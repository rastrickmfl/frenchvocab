// Netlify Function (modern format) — stores/retrieves each pupil account's
// progress as one JSON blob, keyed by their account name (e.g. "otter-14").
//
// GET  /api/state?account=otter-14   -> { state: <saved JSON or null> }
// POST /api/state?account=otter-14   -> body is the state object itself; saves it
//
// Only account names present in accounts.json (the same 200 baked into the
// pupil app) are accepted, so a stray/guessed name can't create junk data.

import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNTS = JSON.parse(readFileSync(join(__dirname, "accounts.json"), "utf-8"));
const ACCOUNT_SET = new Set(ACCOUNTS);

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const account = url.searchParams.get("account");

  if (!account || !ACCOUNT_SET.has(account)) {
    return json({ error: "unknown account" }, 400);
  }

  const store = getStore("pupil-progress");

  if (req.method === "GET") {
    const data = await store.get(account, { type: "json" });
    return json({ state: data || null });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "bad json" }, 400);
    }
    await store.setJSON(account, body);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/state" };
