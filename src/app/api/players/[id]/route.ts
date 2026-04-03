import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { mapPlayer } from "@/lib/db/mappers";

/** GET /api/players/[id] — get player details with tournament history */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows } = await sql`SELECT * FROM players WHERE id = ${id}`;
  if (rows.length === 0) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  // Get tournament history
  const { rows: history } = await sql`
    SELECT
      r.tournament_id,
      t.name AS tournament_name,
      t.date AS tournament_date,
      t.format,
      r.playing_handicap,
      r.flight_number,
      r.status AS registration_status
    FROM registrations r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.player_id = ${id}
    ORDER BY t.date DESC
  `;

  return Response.json({
    ...mapPlayer(rows[0]),
    tournamentHistory: history.map((h) => ({
      tournamentId: h.tournament_id,
      tournamentName: h.tournament_name,
      date: h.tournament_date instanceof Date ? h.tournament_date.toISOString().split("T")[0] : h.tournament_date,
      format: h.format,
      playingHandicap: h.playing_handicap,
      flightNumber: h.flight_number,
      registrationStatus: h.registration_status,
    })),
  });
}
