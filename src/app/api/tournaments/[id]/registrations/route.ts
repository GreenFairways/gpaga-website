import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { mapRegistrationWithPlayer } from "@/lib/db/mappers";
import { canViewTournament } from "@/lib/auth/permissions";

/** GET /api/tournaments/[id]/registrations — list all registrations with player info */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth: must be able to view this tournament
  if (!(await canViewTournament(id))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { rows } = await sql`
    SELECT r.*, p.first_name, p.last_name, p.email, p.gender
    FROM registrations r
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${id}
    ORDER BY r.registered_at
  `;

  return Response.json(rows.map(mapRegistrationWithPlayer));
}
