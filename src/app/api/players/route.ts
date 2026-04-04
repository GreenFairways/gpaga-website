import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/session";
import { mapPlayer } from "@/lib/db/mappers";

/** GET /api/players — list all players (admin only) */
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await sql`
    SELECT * FROM players ORDER BY last_name, first_name
  `;
  return Response.json(rows.map(mapPlayer));
}

/** POST /api/players — create or upsert a player */
export async function POST(request: Request) {
  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    phone = null,
    gender,
    handicapIndex = null,
    handicapSource = "manual",
    homeClub = null,
    dateOfBirth = null,
  } = body;

  if (!firstName || !lastName || !email || !gender) {
    return Response.json(
      { error: "Missing required fields: firstName, lastName, email, gender" },
      { status: 400 },
    );
  }

  // Upsert by email
  const { rows } = await sql`
    INSERT INTO players (first_name, last_name, email, phone, gender, handicap_index, handicap_source, home_club, date_of_birth)
    VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${gender}, ${handicapIndex}, ${handicapSource}, ${homeClub}, ${dateOfBirth})
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = COALESCE(EXCLUDED.phone, players.phone),
      gender = EXCLUDED.gender,
      handicap_index = COALESCE(EXCLUDED.handicap_index, players.handicap_index),
      handicap_source = EXCLUDED.handicap_source,
      home_club = COALESCE(EXCLUDED.home_club, players.home_club),
      date_of_birth = COALESCE(EXCLUDED.date_of_birth, players.date_of_birth)
    RETURNING *
  `;

  return Response.json(mapPlayer(rows[0]), { status: 201 });
}
