import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";

/** POST /api/tournaments/[id]/teams/[teamId]/scores — enter team scores (scramble) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, teamId } = await params;
  const body = await request.json();
  const { scores } = body as {
    scores: { holeNumber: number; rawScore: number }[];
  };

  if (!scores || !Array.isArray(scores)) {
    return Response.json({ error: "scores array is required" }, { status: 400 });
  }

  // Get a registration_id from this team to use as score anchor
  // (scores table requires registration_id for now, using team captain/first member)
  const { rows: regRows } = await sql`
    SELECT id FROM registrations
    WHERE team_id = ${teamId} AND tournament_id = ${id}
    ORDER BY registered_at ASC
    LIMIT 1
  `;

  if (regRows.length === 0) {
    return Response.json({ error: "No team members registered" }, { status: 400 });
  }

  const anchorRegId = regRows[0].id;

  // Upsert scores with validation
  let inserted = 0;
  let skipped = 0;
  for (const s of scores) {
    if (s.holeNumber < 1 || s.holeNumber > 18 || s.rawScore < 1 || s.rawScore > 20) {
      skipped++;
      continue;
    }

    await sql`
      INSERT INTO scores (registration_id, team_id, hole_number, raw_score, adjusted_score, entered_by)
      VALUES (${anchorRegId}, ${teamId}, ${s.holeNumber}, ${s.rawScore}, ${s.rawScore}, 'admin')
      ON CONFLICT (registration_id, hole_number)
      DO UPDATE SET raw_score = ${s.rawScore}, adjusted_score = ${s.rawScore}, team_id = ${teamId},
                    entered_at = NOW()
    `;
    inserted++;
  }

  return Response.json({ inserted, skipped, total: scores.length, teamId });
}

/** GET /api/tournaments/[id]/teams/[teamId]/scores — get team scores */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> },
) {
  const { teamId } = await params;

  const { rows } = await sql`
    SELECT hole_number, raw_score, adjusted_score
    FROM scores
    WHERE team_id = ${teamId}
    ORDER BY hole_number
  `;

  return Response.json(
    rows.map((r) => ({
      holeNumber: r.hole_number,
      rawScore: r.raw_score,
      adjustedScore: r.adjusted_score,
    })),
  );
}
