import { sql } from "@/lib/db";
import {
  hashPassword,
  createPlayerSession,
} from "@/lib/auth/player-session";
import { mapPlayer } from "@/lib/db/mappers";

/**
 * POST /api/auth/register — Player sign up.
 *
 * If the email already exists with no password_hash (admin-created player),
 * sets the password and claims the account.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, firstName, lastName, gender, phone, handicapIndex, homeClub, claimPlayerId } = body;

  if (!email || !password || !firstName || !lastName || !gender) {
    return Response.json(
      { error: "Required: email, password, firstName, lastName, gender" },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (!["M", "F"].includes(gender)) {
    return Response.json(
      { error: "Gender must be M or F" },
      { status: 400 },
    );
  }

  // Check if email already exists
  const { rows: existing } = await sql`
    SELECT id, password_hash FROM players WHERE email = ${email}
  `;

  let playerId: string;

  if (existing.length > 0) {
    if (existing[0].password_hash) {
      return Response.json(
        { error: "Account already exists. Please log in." },
        { status: 409 },
      );
    }

    // Claim existing admin-created account (matched by email)
    const hash = await hashPassword(password);
    await sql`
      UPDATE players
      SET password_hash = ${hash}
      WHERE id = ${existing[0].id} AND password_hash IS NULL
    `;
    playerId = existing[0].id;
  } else if (claimPlayerId) {
    // Claim a specific unclaimed profile (matched by name during registration)
    const { rows: claimRows } = await sql`
      SELECT id, password_hash FROM players WHERE id = ${claimPlayerId}
    `;
    if (claimRows.length === 0) {
      return Response.json({ error: "Player profile not found" }, { status: 404 });
    }
    if (claimRows[0].password_hash) {
      return Response.json({ error: "This profile is already claimed" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    await sql`
      UPDATE players
      SET password_hash = ${hash}, email = ${email}
      WHERE id = ${claimPlayerId} AND password_hash IS NULL
    `;
    playerId = claimPlayerId;
  } else {
    // Create new player
    const hash = await hashPassword(password);
    const { rows } = await sql`
      INSERT INTO players (first_name, last_name, email, gender, phone, handicap_index, home_club, password_hash)
      VALUES (${firstName}, ${lastName}, ${email}, ${gender}, ${phone || null}, ${handicapIndex ?? null}, ${homeClub || null}, ${hash})
      RETURNING id
    `;
    playerId = rows[0].id;
  }

  await createPlayerSession(playerId);

  const { rows } = await sql`SELECT * FROM players WHERE id = ${playerId}`;
  return Response.json(mapPlayer(rows[0]), { status: 201 });
}
