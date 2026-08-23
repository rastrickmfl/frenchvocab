// Netlify Function (modern format) — stores teacher-authored vocab lists
// (words plus which classes/pupils each one is targeted at) as a single
// JSON blob. Mirrors classes.mjs's conventions exactly.
//
// GET  /api/teacher-lists?account=<any known account>   -> { lists: [...] }
//        Returns the saved lists, or [] if nothing's been saved yet.
// POST /api/teacher-lists?account=<a teacher account>    -> body is the
//        full lists array; replaces what's saved. Teacher accounts only —
//        a pupil account gets a 403.
//
// No pupil names ever pass through this app — targeting only ever
// references account codes and class ids, never real names.
//
// No seed data ships here on purpose (same reasoning as classes.mjs) —
// this file is source code, and could end up on GitHub or be handed to
// another teacher as a starting point, so nothing school-specific belongs
// in it. The real lists live only in this deployment's Netlify Blobs.

import { getStore } from "@netlify/blobs";

const ACCOUNTS = ["apple-57", "apricot-06", "apricot-24", "apricot-79", "apricot-94", "apricot-95", "austria-22", "badger-64", "badger-71", "baklava-38", "baklava-52", "baklava-95", "banana-10", "banana-64", "beaver-31", "belgium-24", "blackberry-02", "brazil-18", "brazil-67", "brownie-21", "brownie-46", "brownie-78", "brownie-86", "canada-32", "cheesecake-78", "cheetah-57", "cheetah-78", "cherry-50", "chile-49", "chile-53", "chile-54", "chile-61", "clementine-53", "coconut-28", "coconut-40", "coconut-77", "coconut-88", "cookie-27", "cookie-44", "cuba-08", "cuba-30", "cuba-38", "cuba-89", "cuba-92", "denmark-24", "dolphin-49", "doughnut-18", "doughnut-83", "doughnut-97", "eclair-75", "eclair-97", "egypt-29", "egypt-66", "egypt-69", "falcon-24", "falcon-39", "fig-81", "finland-70", "flapjack-07", "fox-18", "fox-48", "fox-56", "france-12", "france-67", "fudge-06", "fudge-33", "gecko-12", "gecko-26", "gingerbread-41", "gingerbread-81", "giraffe-24", "grape-24", "grape-50", "greece-29", "greece-46", "greece-93", "guava-20", "guava-37", "guava-38", "hedgehog-42", "hedgehog-86", "hedgehog-94", "heron-89", "hungary-23", "hungary-30", "hungary-32", "hungary-78", "ireland-75", "italy-13", "italy-44", "italy-92", "jaguar-30", "jaguar-48", "jamaica-13", "jamaica-23", "jamaica-93", "japan-89", "kenya-64", "kiwi-73", "lemon-02", "lemon-35", "lemon-62", "lemon-67", "lemur-08", "lemur-85", "lychee-65", "lynx-27", "lynx-63", "lynx-65", "macaron-50", "macaron-94", "malta-27", "mango-77", "mango-90", "marzipan-04", "marzipan-83", "meerkat-14", "melon-91", "meringue-36", "mexico-45", "moose-33", "mousse-34", "nectarine-82", "nectarine-97", "norway-22", "norway-61", "ocelot-04", "ocelot-09", "ocelot-95", "orange-52", "orange-56", "otter-72", "panama-58", "panda-26", "panther-05", "panther-64", "passionfruit-04", "passionfruit-64", "passionfruit-75", "pavlova-60", "pear-10", "pear-55", "pear-75", "penguin-56", "penguin-89", "pineapple-96", "poland-27", "poland-55", "pomegranate-38", "praline-44", "praline-46", "praline-68", "pudding-79", "rabbit-15", "raspberry-07", "raspberry-56", "raspberry-83", "raspberry-97", "seal-11", "senegal-54", "senegal-57", "senegal-87", "shortbread-14", "shortbread-20", "shortbread-51", "shortbread-70", "sorbet-08", "sorbet-16", "sorbet-70", "sparrow-37", "sparrow-85", "squirrel-06", "squirrel-07", "squirrel-78", "strawberry-85", "strudel-78", "sundae-26", "sweden-59", "sweden-92", "tangerine-07", "tangerine-52", "tangerine-84", "tiger-35", "tiger-95", "tiramisu-70", "tiramisu-95", "toffee-35", "toffee-45", "toffee-51", "toffee-56", "trifle-18", "trifle-58", "trifle-95", "uganda-89", "waffle-44", "whale-13", "whale-21", "whale-39", "zebra-61", "zebra-95"];
const ACCOUNT_SET = new Set(ACCOUNTS);

const TEACHER_ACCOUNTS = ["trifle-18", "trifle-58", "trifle-95"];
const TEACHER_SET = new Set(TEACHER_ACCOUNTS);

const DEFAULT_LISTS = [];

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

  const store = getStore("teacher-lists");

  if (req.method === "GET") {
    const data = await store.get("lists", { type: "json" });
    return json({ lists: data || DEFAULT_LISTS });
  }

  if (req.method === "POST") {
    if (!TEACHER_SET.has(account)) {
      return json({ error: "teacher accounts only" }, 403);
    }
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "bad json" }, 400);
    }
    if (!Array.isArray(body)) {
      return json({ error: "expected an array of lists" }, 400);
    }
    await store.setJSON("lists", body);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/teacher-lists" };
