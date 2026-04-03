import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { processHoleScore } from "@/lib/tournament/scoring";
import { mapScore } from "@/lib/db/mappers";
import type { TournamentFormat } from "@/lib/tournament/types";

/** GET /api/tournaments/[id]/scores — all scores for a tournament */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { rows } = await sql`
    SELECT s.*
    FROM scores s
    JOIN registrations r ON r.id = s.registration_id
    WHERE r.tournament_id = ${id}
    ORDER BY s.registration_id, s.hole_number
  `;

  return Response.json(rows.map(mapScore));
}

/**
 * POST /api/tournaments/[id]/scores — enter or update a score
 *
 * Body: { registrationId, holeNumber, rawScore, accessCode? }
 *
 * Admin can enter scores without accessCode.
 * Players can enter with their accessCode.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { registrationId, holeNumber, rawScore, accessCode } = body;

  if (!registrationId || !holeNumber || rawScore == null) {
    return Response.json(
      { error: "Missing required fields: registrationId, holeNumber, rawScore" },
      { status: 400 },
    );
  }

  if (holeNumber < 1 || holeNumber > 18 || rawScore < 1 || rawScore > 20) {
    return Response.json(
      { error: "Invalid holeNumber (1-18) or rawScore (1-20)" },
      { status: 400 },
    );
  }

  // Determine auth: admin or player with accessCode
  const admin = await isAdmin();
  let enteredBy: "admin" | "player" = "admin";

  if (!admin) {
    if (!accessCode) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Verify access code
    const { rows: regCheck } = await sql`
      SELECT access_code FROM registrations WHERE id = ${registrationId}
    `;
    if (regCheck.length === 0 || regCheck[0].access_code !== accessCode) {
      return Response.json({ error: "Invalid access code" }, { status: 401 });
    }
    enteredBy = "player";
  }

  // Get tournament details for scoring
  const { rows: tRows } = await sql`
    SELECT t.course_id, t.format
    FROM tournaments t
    JOIN registrations r ON r.tournament_id = t.id
    WHERE r.id = ${registrationId} AND t.id = ${id}
  `;
  if (tRows.length === 0) {
    return Response.json({ error: "Registration not found" }, { status: 404 });
  }

  // Get playing handicap
  const { rows: regRows } = await sql`
    SELECT playing_handicap FROM registrations WHERE id = ${registrationId}
  `;
  const playingHandicap = regRows[0]?.playing_handicap ?? 0;

  // Process score through handicap engine
  const { adjustedScore, stablefordPoints } = processHoleScore(
    holeNumber,
    rawScore,
    playingHandicap,
    tRows[0].course_id,
    tRows[0].format as TournamentFormat,
  );

  // Upsert score (ON CONFLICT on registration_id + hole_number)
  const { rows: scoreRows } = await sql`
    INSERT INTO scores (registration_id, hole_number, raw_score, adjusted_score, stableford_points, entered_by)
    VALUES (${registrationId}, ${holeNumber}, ${rawScore}, ${adjustedScore}, ${stablefordPoints}, ${enteredBy})
    ON CONFLICT (registration_id, hole_number) DO UPDATE SET
      raw_score = EXCLUDED.raw_score,
      adjusted_score = EXCLUDED.adjusted_score,
      stableford_points = EXCLUDED.stableford_points,
      entered_by = EXCLUDED.entered_by,
      entered_at = NOW()
    RETURNING *
  `;

  return Response.json(mapScore(scoreRows[0]));
}
