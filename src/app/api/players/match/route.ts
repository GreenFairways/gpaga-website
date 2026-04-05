import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/players/match?firstName=X&lastName=Y — find unclaimed player profiles.
 *
 * Public endpoint for registration flow. Returns players who:
 * - Have no password_hash (admin-created, not yet claimed)
 * - Match the given name (case-insensitive, fuzzy)
 *
 * Returns minimal info (no email) to prevent enumeration.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const firstName = url.searchParams.get("firstName")?.trim();
  const lastName = url.searchParams.get("lastName")?.trim();

  if (!firstName || !lastName || firstName.length < 2 || lastName.length < 2) {
    return Response.json([]);
  }

  const firstPattern = `%${firstName}%`;
  const lastPattern = `%${lastName}%`;

  const { rows } = await sql`
    SELECT id, first_name, last_name, handicap_index, home_club, gender
    FROM players
    WHERE password_hash IS NULL
      AND first_name ILIKE ${firstPattern}
      AND last_name ILIKE ${lastPattern}
    ORDER BY last_name, first_name
    LIMIT 5
  `;

  return Response.json(
    rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      handicapIndex: r.handicap_index != null ? parseFloat(r.handicap_index) : null,
      homeClub: r.home_club || null,
      gender: r.gender,
    })),
  );
}
