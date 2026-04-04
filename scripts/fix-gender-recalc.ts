/**
 * Fix gender for women players and recalculate tournament scores.
 *
 * 1. PATCH gender to "F" for confirmed women players
 * 2. POST /recalculate to fix PH + scores
 * 3. Compare leaderboard before/after
 *
 * Usage: npx tsx scripts/fix-gender-recalc.ts
 */

const API = "https://gpaga-website.vercel.app";
const ADMIN_SECRET = "gpaga-admin-2026";
const TOURNAMENT_ID = "8624fbca-79a6-4e62-9fd1-a62060cdfd3c";

const WOMEN: { id: string; name: string }[] = [
  { id: "18451753-dae7-4f3e-b7d8-71051bcd5110", name: "Sofia Clifford" },
  { id: "073edced-eb24-4e2d-8785-1b9aeaa5a443", name: "Victoria Petrosian" },
  { id: "295f377b-2be0-4487-89ee-ef5c3355519b", name: "Maka Gotsiridze-Pope" },
  { id: "fb016075-8069-4495-8b30-0bc4bad47baf", name: "Teele Pohi" },
  { id: "22c4ac68-42a1-43ca-9f25-19511f14d198", name: "Iryna Levchenko" },
  { id: "bf03f1e3-8da0-4620-bed5-2d2aa83e4045", name: "Sophie Grimley" },
  { id: "9ede59c8-5cb2-4629-b5ed-308889ebacc6", name: "Nana Bezoiani" },
  { id: "a2e18a51-94ef-4e1d-82b4-264667b1864f", name: "Natia Julukhadze" },
  { id: "6683adfc-5ab5-48b7-9eec-239a3edf8531", name: "Tata Murtskhvaladze" },
];

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

async function printLeaderboard(label: string) {
  const lb = await api(`/api/tournaments/${TOURNAMENT_ID}/leaderboard`);
  console.log(`\n--- ${label} ---`);
  if (lb.divisions) {
    for (const divLb of lb.divisions) {
      const d = divLb.division;
      console.log(`\n  ${d.name} (${d.format}, ${d.holes}h):`);
      for (const e of divLb.entries) {
        const isWoman = WOMEN.some((w) => e.playerName?.includes(w.name.split(" ")[1]));
        const marker = isWoman ? " ♀" : "";
        const score =
          d.format === "stableford"
            ? `${e.stablefordTotal} pts`
            : `net ${e.netTotal} (${e.toPar >= 0 ? "+" : ""}${e.toPar})`;
        console.log(
          `    #${e.position}${e.tied ? "T" : ""} ${e.playerName} PH=${e.playingHandicap} — ${score}${marker}`,
        );
      }
    }
  }
}

async function run() {
  console.log("=== Fix Gender & Recalculate Scores ===\n");

  // 0. Print BEFORE leaderboard
  await printLeaderboard("BEFORE");

  // 1. Update gender
  console.log("\n\n1. Updating gender to F...");
  for (const w of WOMEN) {
    await api(`/api/players/${w.id}`, "PATCH", { gender: "F" });
    console.log(`   ✓ ${w.name}`);
  }

  // 2. Recalculate
  console.log("\n2. Recalculating...");
  const result = await api(
    `/api/tournaments/${TOURNAMENT_ID}/recalculate`,
    "POST",
    { playerIds: WOMEN.map((w) => w.id) },
  );
  console.log(`   Total: ${result.total}, Changed: ${result.changed}`);
  for (const d of result.details) {
    const w = WOMEN.find((w) => w.id === d.playerName);
    const name = w?.name || d.playerName;
    if (d.oldPH !== d.newPH) {
      console.log(
        `   ${name}: PH ${d.oldPH} → ${d.newPH} (${d.scoresUpdated} scores updated)`,
      );
    }
  }

  // 3. Print AFTER leaderboard
  await printLeaderboard("AFTER");

  console.log("\n\n=== Done! ===");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
