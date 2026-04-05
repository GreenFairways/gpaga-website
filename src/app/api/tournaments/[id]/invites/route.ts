import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { canManageTournament } from "@/lib/auth/permissions";
import { getAuthenticatedPlayerId } from "@/lib/auth/player-session";
import { mapInvite } from "@/lib/db/mappers";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** GET /api/tournaments/[id]/invites — list invites (organizer or admin) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await sql`
    SELECT i.*, p.first_name, p.last_name
    FROM tournament_invites i
    LEFT JOIN players p ON p.id = i.invited_player_id
    WHERE i.tournament_id = ${id}
    ORDER BY i.created_at DESC
  `;

  return Response.json(
    rows.map((r) => ({
      ...mapInvite(r),
      invitedPlayerName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
    })),
  );
}

/** POST /api/tournaments/[id]/invites — create invite (organizer or admin) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitedBy = await getAuthenticatedPlayerId();
  if (!invitedBy) {
    return Response.json({ error: "Player auth required to invite" }, { status: 401 });
  }

  const body = await request.json();
  const { playerId, email } = body;

  if (!playerId && !email) {
    return Response.json(
      { error: "Provide playerId or email" },
      { status: 400 },
    );
  }

  // Check if already invited
  if (playerId) {
    const { rows: existing } = await sql`
      SELECT 1 FROM tournament_invites
      WHERE tournament_id = ${id} AND invited_player_id = ${playerId} AND status = 'pending'
    `;
    if (existing.length > 0) {
      return Response.json({ error: "Player already invited" }, { status: 409 });
    }
  }

  const inviteCode = generateInviteCode();

  const { rows } = await sql`
    INSERT INTO tournament_invites (tournament_id, invited_player_id, invited_email, invite_code, invited_by)
    VALUES (${id}, ${playerId || null}, ${email || null}, ${inviteCode}, ${invitedBy})
    RETURNING *
  `;

  return Response.json(mapInvite(rows[0]), { status: 201 });
}
