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

  // 0. Clean up failed attempts
  const existing: any[] = await api("/api/tournaments");
  for (const t of existing) {
    if (t.name.includes("[DELETE]") || t.name === "Test Scramble 2-Ball") {
      console.log(`Deleting: ${t.name}...`);
      await api(`/api/tournaments/${t.id}`, "DELETE");
    }
  }

  // 1. Create tournament with correct division format (hcpRange as array!)
  console.log("1. Creating tournament...");
  const divisions = [
    {
      label: "A", name: "Division A", format: "strokeplay", holes: 18,
      hcpRange: [-8, 18],
      tees: [{ gender: "M", teeName: "Silver" }, { gender: "M", teeName: "White", seniorAge: 60 }, { gender: "F", teeName: "Green" }],
      tieBreak: "lower-handicap",
    },
    {
      label: "B", name: "Division B", format: "stableford", holes: 18,
      hcpRange: [18.1, 36],
      tees: [{ gender: "M", teeName: "Silver" }, { gender: "M", teeName: "White", seniorAge: 60 }, { gender: "F", teeName: "Green" }],
      tieBreak: "lower-handicap",
    },
    {
      label: "C", name: "Division C", format: "stableford", holes: 9,
      hcpRange: [36.1, 54],
      tees: [{ gender: "M", teeName: "White" }, { gender: "F", teeName: "Green" }],
      tieBreak: "lower-handicap",
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
    rules: "Division A: Net Strokeplay (HCP 0-18, Silver/Green). Division B: Stableford (HCP 18.1-36, Silver/Green). Division C: Stableford 9h (HCP 36.1-54, White/Green). Tiebreak: lower handicap.",
    handicapAllowance: 1.0,
    divisions,
  });
  const tid = tournament.id;
  console.log(`   ID: ${tid}`);

  // 2. Register players
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "registration_open" });
  console.log("\n2. Registering players...");

  const players: any[] = await api("/api/players");
  const byAmgolf = new Map(players.filter((p: any) => p.amgolfPeopleId).map((p: any) => [p.amgolfPeopleId, p.id]));

  const regMap = new Map<string, string>();
  let ok = 0, skip = 0;

  for (const sc of scorecards) {
    const playerId = byAmgolf.get(sc.peopleId);
    if (!playerId) { console.log(`   ⚠ Not in DB: ${sc.name} (${sc.peopleId})`); skip++; continue; }
    try {
      const reg = await api(`/api/tournaments/${tid}/register`, "POST", { playerId });
      regMap.set(sc.peopleId, reg.id);

      // Log division + PH
      const divMatch = reg.divisionLabel === (sc.hcp <= 18 ? "A" : sc.hcp <= 36 ? "B" : "C");
      if (!divMatch) console.log(`   ⚠ Div mismatch: ${sc.name} HI=${sc.hcp} got div=${reg.divisionLabel}`);
      if (Math.abs(reg.playingHandicap - sc.phcp) > 1) {
        console.log(`   ⚠ PH diff: ${sc.name} ours=${reg.playingHandicap} amgolf=${sc.phcp} (HI=${sc.hcp})`);
      }
      ok++;
    } catch (e: any) {
      console.log(`   ✗ ${sc.name}: ${e.message}`);
      skip++;
    }
  }
  console.log(`   Registered: ${ok}, Skipped: ${skip}`);

  // 3. Enter scores
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "in_progress" });
  console.log("\n3. Entering scores...");

  const allScores: { registrationId: string; holeNumber: number; rawScore: number }[] = [];
  for (const sc of scorecards) {
    const regId = regMap.get(sc.peopleId);
    if (!regId) continue;
    for (const h of sc.holes) {
      if (!h.strokes || h.strokes === 0) continue;
      allScores.push({ registrationId: regId, holeNumber: h.hole, rawScore: h.strokes });
    }
  }

  const BATCH = 200;
  let totalInserted = 0;
  for (let i = 0; i < allScores.length; i += BATCH) {
    const batch = allScores.slice(i, i + BATCH);
    const result = await api(`/api/tournaments/${tid}/scores`, "PUT", { scores: batch });
    totalInserted += result.inserted;
  }
  console.log(`   Inserted: ${totalInserted}/${allScores.length}`);

  // 4. Complete
  await api(`/api/tournaments/${tid}`, "PATCH", { status: "completed" });
  console.log("\n4. Tournament completed!");

  // 5. Verify
  console.log("\n5. Leaderboard:");
  const lb = await api(`/api/tournaments/${tid}/leaderboard`);
  if (lb.divisions) {
    for (const divLb of lb.divisions) {
      const d = divLb.division;
      console.log(`\n   ${d.name} (${d.format}, ${d.holes}h):`);
      for (const e of divLb.entries.slice(0, 5)) {
        const score = d.format === "stableford"
          ? `${e.stablefordTotal} pts`
          : `net ${e.netTotal} (toPar ${e.toPar})`;
        console.log(`     #${e.position}${e.tied ? "T" : ""} ${e.playerName} — ${score}`);
      }
    }
  }

  console.log(`\n=== Done! ${API}/tournaments/${tid} ===`);
}

run().catch((e) => { console.error("FATAL:", e); process.exit(1); });
