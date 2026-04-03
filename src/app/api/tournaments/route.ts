import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { mapTournament } from "@/lib/db/mappers";
import type { TournamentFormat, FlightConfig, FormatConfig, Division } from "@/lib/tournament/types";

/** GET /api/tournaments — list all tournaments, newest first */
export async function GET() {
  const { rows } = await sql`
    SELECT * FROM tournaments ORDER BY date DESC
  `;
  return Response.json(rows.map(mapTournament));
}

/** POST /api/tournaments — create a new tournament (admin only) */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    date,
    courseId,
    teeName,
    gender = "Mixed",
    format,
    maxPlayers = 80,
    entryFeeLari = 0,
    rules = "",
    handicapAllowance = 0.95,
    flightConfig = null,
    divisions = null,
    formatConfig = {},
  } = body as {
    name: string;
    date: string;
    courseId: string;
    teeName: string;
    gender?: string;
    format: TournamentFormat;
    maxPlayers?: number;
    entryFeeLari?: number;
    rules?: string;
    handicapAllowance?: number;
    flightConfig?: FlightConfig | null;
    divisions?: Division[] | null;
    formatConfig?: FormatConfig;
  };

  if (!name || !date || !courseId || !teeName || !format) {
    return Response.json(
      { error: "Missing required fields: name, date, courseId, teeName, format" },
      { status: 400 },
    );
  }

  const { rows } = await sql`
    INSERT INTO tournaments (name, date, course_id, tee_name, gender, format, max_players, entry_fee_lari, rules, handicap_allowance, flight_config, divisions, format_config)
    VALUES (${name}, ${date}, ${courseId}, ${teeName}, ${gender}, ${format}, ${maxPlayers}, ${entryFeeLari}, ${rules}, ${handicapAllowance}, ${JSON.stringify(flightConfig)}, ${JSON.stringify(divisions)}, ${JSON.stringify(formatConfig)})
    RETURNING *
  `;

  return Response.json(mapTournament(rows[0]), { status: 201 });
}
