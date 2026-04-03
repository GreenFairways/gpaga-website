/**
 * Import GPAGA Season Opening 2026 Round 2 from AmGolf data
 *
 * Usage: npx tsx scripts/import-amgolf-tournament.ts
 */

const API = "https://gpaga-website.vercel.app";
const ADMIN_SECRET = "gpaga-admin-2026";

const scorecards: any[] = require("/tmp/gpaga-scorecards.json");

let sessionCookie: string | null = null;

async function getSession(): Promise<string> {
  if (sessionCookie) return sessionCookie;
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_SECRET }),
  });
  if (!res.ok) throw new Error("Login failed: " + res.status);
  const cookies = (res.headers as any).getSetCookie?.() ?? [];
  sessionCookie = cookies.map((c: string) => c.split(";")[0]).join("; ");
  return sessionCookie!;
}

async function api(path: string, method = "GET", body?: unknown) {
  const cookie = await getSession();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${method} ${path}: ${text}`);
  }
  return res.json();
}

async function run() {
  console.log("=== Importing GPAGA Season Opening 2026, Round 2 ===\n");

  // 1. Create tournament
  console.log("1. Creating tournament...");
  const divisions = [
    {
      label: "A", name: "Division A", format: "strokeplay", holes: 18,
      hcpRange: { min: -8, max: 18 },
      tees: [{ gender: "M", teeName: "Silver" }, { gender: "F", teeName: "Green" }],
      tieBreak: "handicap",
    },
    {
      label: "B", name: "Division B", format: "stableford", holes: 18,
      hcpRange: { min: 18.1, max: 36 },
      tees: [{ gender: "M", teeName: "Silver" }, { gender: "F", teeName: "Green" }],
      tieBreak: "handicap",
    },
    {
      label: "C", name: "Division C", format: "stableford", holes: 9,
      hcpRange: { min: 36.1, max: 54 },
      tees: [{ gender: "M", teeName: "White" }, { gender: "F", teeName: "Green" }],
      tieBreak: "handicap",
    },
  ];

  const tournament = await api("/api/tournaments", "POST", {
    name: "GPAGA Season Opening 2026, Round 2",
    date: "2026-03-28",
    courseId: "tbilisi-hills",
    teeName: "Silver",
    gender: "Mixed",
    format: "strokeplay",
    maxPlayers: 50,
    entryFeeLari: 0,
    rules: "Division A: Net Strokeplay (HCP 0-18). Division B: Stableford (HCP 18.1-36). Division C: Stableford 9h (HCP 36.1-54). Tiebreak: lower handicap.",
    handicapAllowance: 1.0,
    divisions,
  });
  const tid = tournament.id;
  console.log(`   ID: ${tid}`);

  // 2. Open registration + register players
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "registration_open" });
  console.log("\n2. Registering players...");

  const players: any[] = await api("/api/players");
  const byAmgolf = new Map(players.filter((p: any) => p.amgolfPeopleId).map((p: any) => [p.amgolfPeopleId, p.id]));

  const regMap = new Map<string, string>(); // amgolfPeopleId -> registrationId
  let ok = 0, skip = 0;

  for (const sc of scorecards) {
    const playerId = byAmgolf.get(sc.peopleId);
    if (!playerId) { console.log(`   ⚠ Not in DB: ${sc.name}`); skip++; continue; }
    try {
      const reg = await api(`/api/tournaments/${tid}/register`, "POST", { playerId });
      regMap.set(sc.peopleId, reg.id);
      ok++;
    } catch (e: any) {
      console.log(`   ✗ ${sc.name}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   Registered: ${ok}, Skipped: ${skip}`);

  // 3. Start tournament + bulk enter scores
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "in_progress" });
  console.log("\n3. Entering scores (bulk)...");

  const allScores: { registrationId: string; holeNumber: number; rawScore: number }[] = [];
  for (const sc of scorecards) {
    const regId = regMap.get(sc.peopleId);
    if (!regId) continue;
    for (const h of sc.holes) {
      if (!h.strokes || h.strokes === 0) continue;
      allScores.push({ registrationId: regId, holeNumber: h.hole, rawScore: h.strokes });
    }
  }

  console.log(`   Total score entries: ${allScores.length}`);

  // Send in batches of 200 to avoid request size limits
  const BATCH = 200;
  let totalInserted = 0;
  for (let i = 0; i < allScores.length; i += BATCH) {
    const batch = allScores.slice(i, i + BATCH);
    const result = await api(`/api/tournaments/${tid}/scores`, "PUT", { scores: batch });
    totalInserted += result.inserted;
    process.stderr.write(`   Batch ${Math.floor(i / BATCH) + 1}: ${result.inserted} inserted, ${result.errors} errors\n`);
  }
  console.log(`   Total inserted: ${totalInserted}`);

  // 4. Complete tournament
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "completed" });
  console.log("\n4. Tournament completed!");

  // 5. Verify leaderboard
  console.log("\n5. Leaderboard:");
  const lb = await api(`/api/tournaments/${tid}/leaderboard`);
  if (Array.isArray(lb)) {
    console.log(`   ${lb.length} entries`);
    for (const e of lb.slice(0, 5)) {
      console.log(`   #${e.position} ${e.playerName} — toPar: ${e.toPar}, net: ${e.netTotal}`);
    }
  } else {
    for (const [div, entries] of Object.entries(lb)) {
      const arr = entries as any[];
      console.log(`   ${div} (${arr.length} players):`);
      for (const e of arr.slice(0, 3)) {
        const score = e.stablefordTotal != null ? `${e.stablefordTotal} pts` : `net ${e.netTotal}`;
        console.log(`     #${e.position} ${e.playerName} — ${score}`);
      }
    }
  }

  console.log(`\n=== Done! ${API}/tournaments/${tid} ===`);
}

run().catch((e) => { console.error("FATAL:", e); process.exit(1); });
