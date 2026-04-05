import { createSession } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import {
  verifyPassword,
  createPlayerSession,
} from "@/lib/auth/player-session";

/**
 * POST /api/auth/login
 *
 * Two modes:
 * - Admin: { password } — existing admin login
 * - Player: { email, password } — player login
 */
export async function POST(request: Request) {
  const body = await request.json();

  // Player login (email + password)
  if (body.email) {
    const { email, password } = body;
    if (!password || typeof password !== "string") {
      return Response.json({ error: "Password required" }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT id, first_name, last_name, password_hash
      FROM players WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const player = rows[0];
    if (!player.password_hash) {
      return Response.json(
        { error: "No account set up. Please register first." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, player.password_hash);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createPlayerSession(player.id);
    return Response.json({
      ok: true,
      playerId: player.id,
      playerName: `${player.first_name} ${player.last_name}`,
    });
  }

  // Admin login (password only)
  const { password } = body;
  if (!password || typeof password !== "string") {
    return Response.json({ error: "Password required" }, { status: 400 });
  }

  const ok = await createSession(password);
  if (!ok) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
