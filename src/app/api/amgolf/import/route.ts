import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";

interface ImportMember {
  amgolfId: string;
  firstName: string;
  lastName: string;
  exactHandicap: number | null;
  gender: string | null;
  countryCode: string;
  homeClubName: string | null;
}

/**
 * POST /api/amgolf/import
 * Bulk import players from AmGolf data. Admin only.
 *
 * Body: { members: ImportMember[] }
 *
 * Upserts by amgolf_people_id. Generates placeholder emails for players without one.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { members } = (await request.json()) as { members: ImportMember[] };

  if (!Array.isArray(members) || members.length === 0) {
    return Response.json(
      { error: "members array is required" },
      { status: 400 },
    );
  }

  let imported = 0;
  let updated = 0;
  const errors: { amgolfId: string; error: string }[] = [];

  for (const m of members) {
    try {
      const email = `${m.amgolfId}@amgolf.placeholder`;
      const gender = m.gender === "female" ? "F" : "M";
      const hi = m.exactHandicap;
      const club = m.homeClubName || null;

      const { rows } = await sql`
        INSERT INTO players (
          first_name, last_name, email, gender,
          handicap_index, handicap_source, home_club, amgolf_people_id
        )
        VALUES (
          ${m.firstName}, ${m.lastName}, ${email}, ${gender},
          ${hi}, 'amgolf', ${club}, ${m.amgolfId}
        )
        ON CONFLICT (amgolf_people_id) WHERE amgolf_people_id IS NOT NULL
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          handicap_index = EXCLUDED.handicap_index,
          home_club = COALESCE(EXCLUDED.home_club, players.home_club)
        RETURNING xmax
      `;

      // xmax = 0 means INSERT, > 0 means UPDATE
      if (rows[0] && parseInt(rows[0].xmax) === 0) {
        imported++;
      } else {
        updated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push({ amgolfId: m.amgolfId, error: msg });
    }
  }

  return Response.json({ imported, updated, errors, total: members.length });
}
