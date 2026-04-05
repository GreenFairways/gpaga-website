import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { isAdmin } from "@/lib/auth/session";

/**
 * GET /api/players/search?q=name — search players by name or email.
 * Authenticated players or admin only. Returns minimal info for invite flow.
 */
export async function GET(request: NextRequest) {
  const admin = await isAdmin();
  const playerId = await getAuthenticatedPlayerId();

  if (!admin && !playerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length < 2) {
    return Response.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  const pattern = `%${query}%`;
  const { rows } = await sql`
    SELECT id, first_name, last_name, email, handicap_index, password_hash IS NOT NULL AS registered
    FROM players
    WHERE (first_name || ' ' || last_name) ILIKE ${pattern}
       OR (password_hash IS NOT NULL AND email ILIKE ${pattern})
    ORDER BY last_name, first_name
    LIMIT 20
  `;

  return Response.json(
    rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.registered ? r.email : null,
      handicapIndex: r.handicap_index != null ? parseFloat(r.handicap_index) : null,
      registered: r.registered,
    })),
  );
}
