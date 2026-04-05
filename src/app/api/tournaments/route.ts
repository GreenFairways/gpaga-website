import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { mapTournament } from "@/lib/db/mappers";
import type {
  TournamentFormat,
  TournamentType,
  TournamentVisibility,
  FlightConfig,
  FormatConfig,
  Division,
} from "@/lib/tournament/types";

/**
 * GET /api/tournaments — list tournaments with visibility filtering.
 *
 * Query params:
 * - type: "official" | "casual" (optional filter)
 * - mine: "true" (only tournaments I created/organize)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type");
  const mine = url.searchParams.get("mine") === "true";

  const admin = await isAdmin();
  const playerId = await getAuthenticatedPlayerId();

  if (admin) {
    // Admin sees everything
    let query = "SELECT * FROM tournaments";
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (typeFilter) {
      params.push(typeFilter);
      conditions.push(`tournament_type = $${params.length}`);
    }
    if (mine && playerId) {
      params.push(playerId);
      conditions.push(`creator_id = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY date DESC";

    const { rows } = await sql.query(query, params);
    return Response.json(rows.map(mapTournament));
  }

  if (playerId) {
    // Authenticated player: public + unlisted + private where involved
    if (mine) {
      const { rows } = await sql`
        SELECT t.* FROM tournaments t
        WHERE t.creator_id = ${playerId}
        ORDER BY t.date DESC
      `;
      return Response.json(rows.map(mapTournament));
    }

    const { rows } = await sql`
      SELECT DISTINCT t.* FROM tournaments t
      LEFT JOIN tournament_organizers o ON o.tournament_id = t.id AND o.player_id = ${playerId}
      LEFT JOIN tournament_invites i ON i.tournament_id = t.id AND i.invited_player_id = ${playerId} AND i.status IN ('pending', 'accepted')
      LEFT JOIN registrations r ON r.tournament_id = t.id AND r.player_id = ${playerId}
      WHERE t.visibility IN ('public', 'unlisted')
        OR o.id IS NOT NULL
        OR i.id IS NOT NULL
        OR r.id IS NOT NULL
      ORDER BY t.date DESC
    `;
    return Response.json(rows.map(mapTournament));
  }

  // Unauthenticated: only public tournaments
  const { rows } = await sql`
    SELECT * FROM tournaments
    WHERE visibility = 'public' OR visibility IS NULL
    ORDER BY date DESC
  `;
  return Response.json(rows.map(mapTournament));
}

/**
 * POST /api/tournaments — create a tournament.
 *
 * Admin: can create official or casual.
 * Authenticated player: can only create casual.
 */
export async function POST(request: Request) {
  const admin = await isAdmin();
  const playerId = await getAuthenticatedPlayerId();

  if (!admin && !playerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    date,
    courseId,
    teeName: rawTeeName,
    gender = "Mixed",
    format,
    maxPlayers = 80,
    entryFeeLari = 0,
    rules = "",
    handicapAllowance = 1.0,
    flightConfig = null,
    divisions = null,
    formatConfig = {},
    visibility = "public",
  } = body as {
    name: string;
    date: string;
    courseId: string;
    teeName?: string;
    gender?: string;
    format: TournamentFormat;
    maxPlayers?: number;
    entryFeeLari?: number;
    rules?: string;
    handicapAllowance?: number;
    flightConfig?: FlightConfig | null;
    divisions?: Division[] | null;
    formatConfig?: FormatConfig;
    visibility?: TournamentVisibility;
  };

  if (!name || !date || !courseId || !format) {
    return Response.json(
      { error: "Missing required fields: name, date, courseId, format" },
      { status: 400 },
    );
  }

  // Default tee: first tee of the course
  const teeName = rawTeeName || (await (async () => {
    const { courseInfos } = await import("@/data/courses/info");
    const course = courseInfos.find((c) => c.slug === courseId);
    return course?.teeNames[0] || "White";
  })());

  // Players can only create casual tournaments
  const tournamentType: TournamentType = admin
    ? (body.tournamentType || "official")
    : "casual";

  const creatorId = playerId || null;

  const { rows } = await sql`
    INSERT INTO tournaments (
      name, date, course_id, tee_name, gender, format,
      max_players, entry_fee_lari, rules, handicap_allowance,
      flight_config, divisions, format_config,
      creator_id, tournament_type, visibility
    )
    VALUES (
      ${name}, ${date}, ${courseId}, ${teeName}, ${gender}, ${format},
      ${maxPlayers}, ${entryFeeLari}, ${rules}, ${handicapAllowance},
      ${JSON.stringify(flightConfig)}, ${JSON.stringify(divisions)}, ${JSON.stringify(formatConfig)},
      ${creatorId}, ${tournamentType}, ${visibility}
    )
    RETURNING *
  `;

  const tournament = rows[0];

  // Auto-add creator as organizer
  if (creatorId) {
    await sql`
      INSERT INTO tournament_organizers (tournament_id, player_id, role)
      VALUES (${tournament.id}, ${creatorId}, 'creator')
    `;
  }

  return Response.json(mapTournament(tournament), { status: 201 });
}
