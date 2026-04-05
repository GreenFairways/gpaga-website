import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { canManageTournament } from "@/lib/auth/permissions";

/** DELETE /api/tournaments/[id]/registrations/[regId] — remove a registration (organizer/admin) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> },
) {
  const { id, regId } = await params;

  if (!(await canManageTournament(id))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete scores first, then registration
  await sql`DELETE FROM scores WHERE registration_id = ${regId}`;
  await sql`DELETE FROM registrations WHERE id = ${regId} AND tournament_id = ${id}`;

  return Response.json({ deleted: true });
}
