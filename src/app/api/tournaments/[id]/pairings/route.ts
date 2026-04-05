import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { canManageTournament } from "@/lib/auth/permissions";
import { mapRegistrationWithPlayer } from "@/lib/db/mappers";
import { generatePairings } from "@/lib/tournament/pairing";
import type { FlightConfig } from "@/lib/tournament/types";

/** GET /api/tournaments/[id]/pairings — view current pairings */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows: regs } = await sql`
    SELECT r.*, p.first_name, p.last_name, p.email, p.gender
    FROM registrations r
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${id}
    ORDER BY r.flight_number, r.group_number, r.tee_time
  `;

  const mapped = regs.map(mapRegistrationWithPlayer);

  // Group by flight
  const flights = new Map<number, typeof mapped>();
  for (const r of mapped) {
    if (r.flightNumber != null) {
      const arr = flights.get(r.flightNumber) || [];
      arr.push(r);
      flights.set(r.flightNumber, arr);
    }
  }

  // Group by group number
  const groups = new Map<number, typeof mapped>();
  for (const r of mapped) {
    if (r.groupNumber != null) {
      const arr = groups.get(r.groupNumber) || [];
      arr.push(r);
      groups.set(r.groupNumber, arr);
    }
  }

  return Response.json({
    registrations: mapped,
    flights: Object.fromEntries(flights),
    groups: Object.fromEntries(groups),
  });
}

/** POST /api/tournaments/[id]/pairings — generate and save pairings (admin only) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { startTime = "08:00", intervalMinutes = 10 } = body;

  // Get tournament
  const { rows: tRows } = await sql`SELECT * FROM tournaments WHERE id = ${id}`;
  if (tRows.length === 0) {
    return Response.json({ error: "Tournament not found" }, { status: 404 });
  }
  const tournament = tRows[0];

  // Get registrations with player info
  const { rows: regs } = await sql`
    SELECT r.*, p.first_name, p.last_name, p.email, p.gender
    FROM registrations r
    JOIN players p ON p.id = r.player_id
    WHERE r.tournament_id = ${id} AND r.status IN ('registered', 'confirmed')
    ORDER BY r.playing_handicap NULLS LAST
  `;

  const registrations = regs.map(mapRegistrationWithPlayer);

  if (registrations.length === 0) {
    return Response.json(
      { error: "No registrations to pair" },
      { status: 400 },
    );
  }

  // Generate pairings
  const result = generatePairings({
    registrations,
    flightConfig: tournament.flight_config as FlightConfig | null,
    startTime,
    intervalMinutes,
  });

  // Save to database: update each registration with flight, group, tee time
  for (const group of result.groups) {
    for (const regId of group.registrationIds) {
      await sql`
        UPDATE registrations
        SET flight_number = ${group.flightNumber},
            group_number = ${group.number},
            tee_time = ${group.teeTime}
        WHERE id = ${regId}
      `;
    }
  }

  return Response.json(result);
}
