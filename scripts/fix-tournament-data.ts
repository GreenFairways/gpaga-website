/**
 * Fix tournament data to match AmGolf source of truth.
 *
 * Based on AmGolf scorecard data for GPAGA Season Opening 2026, Round 2:
 * - Fix gender for 9 women (AmGolf confirms: gender=female)
 * - Fix HI to match AmGolf values at time of tournament
 * - Set DOB for seniors (White tee) and junior (Maximilian)
 * - Recalculate all PH + scores
 *
 * AmGolf scorecard data per player:
 * - Women (Green, CR=70.3, SR=128): Sofia, Victoria, Maka, Teele, Iryna, Sophie, Nana
 * - Seniors (White, CR=69, SR=126): Roger Gervais, Martin Pope, Janiko Kaplanishvili
 * - Junior (Silver, CR=71.8, SR=133): Maximilian Sindyukov
 * - Regular men (Silver, CR=71.8, SR=133): all others
 *
 * Usage: npx tsx scripts/fix-tournament-data.ts
 */

const API = "https://gpaga-website.vercel.app";
const ADMIN_SECRET = "gpaga-admin-2026";
const TOURNAMENT_ID = "8624fbca-79a6-4e62-9fd1-a62060cdfd3c";

// AmGolf verified data for all 30 Round 2 participants
const AMGOLF_DATA: Record<string, {
  name: string;
  hi: number;
  phcp: number;
  tee: string;
  gender: "M" | "F";
  senior?: boolean;
  junior?: boolean;
}> = {
  // Women — Green tee
  "18451753-dae7-4f3e-b7d8-71051bcd5110": { name: "Sofia Clifford", hi: 17.6, phcp: 18, tee: "Green", gender: "F" },
  "073edced-eb24-4e2d-8785-1b9aeaa5a443": { name: "Victoria Petrosian", hi: 20.4, phcp: 21, tee: "Green", gender: "F" },
  "295f377b-2be0-4487-89ee-ef5c3355519b": { name: "Maka Gotsiridze-Pope", hi: 20.4, phcp: 21, tee: "Green", gender: "F" },
  "fb016075-8069-4495-8b30-0bc4bad47baf": { name: "Teele Pohi", hi: 22, phcp: 23, tee: "Green", gender: "F" },
  "22c4ac68-42a1-43ca-9f25-19511f14d198": { name: "Iryna Levchenko", hi: 23.7, phcp: 25, tee: "Green", gender: "F" },
  "bf03f1e3-8da0-4620-bed5-2d2aa83e4045": { name: "Sophie Grimley", hi: 26.2, phcp: 28, tee: "Green", gender: "F" },
  "9ede59c8-5cb2-4629-b5ed-308889ebacc6": { name: "Nana Bezoiani", hi: 27.5, phcp: 29, tee: "Green", gender: "F" },
  // Women in Div C (no scores in AmGolf Round 2)
  "a2e18a51-94ef-4e1d-82b4-264667b1864f": { name: "Natia Julukhadze", hi: 44.5, phcp: 0, tee: "Green", gender: "F" },
  "6683adfc-5ab5-48b7-9eec-239a3edf8531": { name: "Tata Murtskhvaladze", hi: 54, phcp: 0, tee: "Green", gender: "F" },

  // Seniors — White tee
  "e75f3681-1cd3-43e9-9d91-838f4df9d847": { name: "Roger Gervais", hi: 29.2, phcp: 30, tee: "White", gender: "M", senior: true },
  "8381b113-d048-4499-978a-7a5dbe360f0c": { name: "Martin Pope", hi: 29.9, phcp: 30, tee: "White", gender: "M", senior: true },
  "3ecc786a-7919-47a6-8c0a-e7ec12d63d90": { name: "Janiko Kaplanishvili", hi: 15.4, phcp: 14, tee: "White", gender: "M", senior: true },

  // Junior — Silver tee (same as regular men, just different HI)
  "a941c953-284c-4b43-888e-04612b2d6c32": { name: "Maximilian Sindyukov", hi: 29.5, phcp: 35, tee: "Silver", gender: "M", junior: true },

  // Regular men — Silver tee (update HI where different)
  "dc1ee3d5-5160-4760-b126-9c1d65578893": { name: "Steven Fraga", hi: 2.8, phcp: 3, tee: "Silver", gender: "M" },
  "7f8c62b2-58a8-4a3b-95de-0423beab30ae": { name: "James Cook", hi: 3.4, phcp: 4, tee: "Silver", gender: "M" },
  "04092837-cada-4ba7-ab23-aef103b4a0ff": { name: "Tyrone Hammond", hi: 6.1, phcp: 7, tee: "Silver", gender: "M" },
  "6501a69d-9580-4435-9b9c-e210f5d4c81d": { name: "Zaur Gabaidze", hi: 6.7, phcp: 8, tee: "Silver", gender: "M" },
  "aa408eaf-280c-454a-a77d-1f770f539f2a": { name: "Irakli Chavleishvili", hi: 10.4, phcp: 12, tee: "Silver", gender: "M" },
  "99ee574e-f9b9-4661-b617-1396d3689a83": { name: "Gocha Diasamidze", hi: 11.2, phcp: 13, tee: "Silver", gender: "M" },
  "02f9bf8b-d0d7-43d1-bc5b-7dd48fd9c5b5": { name: "Paata Vardiashvili", hi: 11.4, phcp: 13, tee: "Silver", gender: "M" },
  "0084295b-860d-4099-84a8-7375d8a20954": { name: "Levan Charelishvili", hi: 12.8, phcp: 15, tee: "Silver", gender: "M" },
  "3f6ba3e1-7893-42b0-be9b-489899d8848b": { name: "Sandro Ilashvili", hi: 13.4, phcp: 16, tee: "Silver", gender: "M" },
  "6706864b-bd13-4146-8275-306e464d48b6": { name: "Kakha Okriashvili", hi: 19.3, phcp: 23, tee: "Silver", gender: "M" },
  "8cf6b466-5ddf-4534-99df-e6c67906846c": { name: "Frane Rak", hi: 19.7, phcp: 23, tee: "Silver", gender: "M" },
  "4cbb5670-9cee-4366-96fb-0c995b81a099": { name: "Stanislav Prikhodko", hi: 19.9, phcp: 23, tee: "Silver", gender: "M" },
  "fb60ae4a-4dff-4c53-8128-5212195265fa": { name: "David Slonimskii", hi: 20.4, phcp: 24, tee: "Silver", gender: "M" },
  "bad32d40-6e66-475e-9f2b-2ffd326e27e0": { name: "Merab Kumsiashvili", hi: 23.7, phcp: 28, tee: "Silver", gender: "M" },
  "6743e1d7-5d16-4ddb-ba61-d59c616aa1fd": { name: "Samuel Grant Brookes", hi: 23.8, phcp: 28, tee: "Silver", gender: "M" },
  "f72b426a-42b1-4275-9f04-1ae9670bfc77": { name: "Jochem De Lange", hi: 27, phcp: 32, tee: "Silver", gender: "M" },
};

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
  console.log("=== Fix Tournament Data (AmGolf Source of Truth) ===\n");

  // Step 1: Update player data (gender, HI, DOB for seniors/junior)
  console.log("1. Updating player data...");
  let updated = 0;
  for (const [playerId, data] of Object.entries(AMGOLF_DATA)) {
    const patch: Record<string, unknown> = {};

    // Always set gender
    patch.gender = data.gender;

    // Always set HI from AmGolf
    patch.handicapIndex = data.hi;

    // Set DOB for seniors (born 1960 → 66 years old on 2026-03-28)
    if (data.senior) {
      patch.dateOfBirth = "1960-01-01";
    }

    // Set DOB for junior (born 2010 → 16 years old on 2026-03-28)
    if (data.junior) {
      patch.dateOfBirth = "2010-01-01";
    }

    try {
      await api(`/api/players/${playerId}`, "PATCH", patch);
      const changes: string[] = [];
      if (data.gender === "F") changes.push("F");
      if (data.senior) changes.push("senior");
      if (data.junior) changes.push("junior");
      changes.push(`HI=${data.hi}`);
      console.log(`   ✓ ${data.name} [${changes.join(", ")}]`);
      updated++;
    } catch (e: any) {
      console.log(`   ✗ ${data.name}: ${e.message}`);
    }
  }
  console.log(`   Updated: ${updated}/${Object.keys(AMGOLF_DATA).length}\n`);

  // Step 2: Recalculate ALL registrations (not just women)
  console.log("2. Recalculating all registrations...");
  const result = await api(
    `/api/tournaments/${TOURNAMENT_ID}/recalculate`,
    "POST",
    {}, // no playerIds filter = recalculate ALL
  );
  console.log(`   Total: ${result.total}, Changed: ${result.changed}`);
  for (const d of result.details) {
    const amg = Object.values(AMGOLF_DATA).find(
      (a) => Object.keys(AMGOLF_DATA).find((k) => AMGOLF_DATA[k] === a) === d.playerName,
    );
    if (d.oldPH !== d.newPH || d.oldDiv !== d.newDiv) {
      const name = Object.entries(AMGOLF_DATA).find(([k]) => k === d.playerName)?.[1]?.name || d.playerName.substring(0, 8);
      console.log(`   ${name}: PH ${d.oldPH}→${d.newPH}, Div ${d.oldDiv}→${d.newDiv}, ${d.scoresUpdated} scores`);
    }
  }

  // Step 3: Verify against AmGolf
  console.log("\n3. Verifying against AmGolf...");
  const lb = await api(`/api/tournaments/${TOURNAMENT_ID}/leaderboard`);
  const regs: any[] = await api(`/api/tournaments/${TOURNAMENT_ID}/registrations`);
  const regByPlayer = new Map(regs.map((r: any) => [r.playerId, r]));

  let matches = 0;
  let mismatches = 0;

  if (lb.divisions) {
    for (const divLb of lb.divisions) {
      const d = divLb.division;
      console.log(`\n   ${d.name} (${d.format}):`);
      for (const e of divLb.entries) {
        const amg = AMGOLF_DATA[e.playerId];
        if (!amg) {
          console.log(`     ${e.playerName}: not in AmGolf data`);
          continue;
        }
        const reg = regByPlayer.get(e.playerId);
        const ourPH = reg?.playingHandicap ?? e.playingHandicap;
        const phMatch = ourPH === amg.phcp;

        if (phMatch) {
          matches++;
          console.log(`     ✓ ${e.playerName} PH=${ourPH}`);
        } else {
          mismatches++;
          console.log(`     ✗ ${e.playerName} PH=${ourPH} (AmGolf=${amg.phcp})`);
        }
      }
    }
  }

  console.log(`\n   Matches: ${matches}, Mismatches: ${mismatches}`);
  console.log("\n=== Done! ===");
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
