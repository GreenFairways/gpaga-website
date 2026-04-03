import { isAdmin } from "@/lib/auth/session";
import { getPlayer } from "@/lib/amgolf";

/**
 * GET /api/amgolf/player/[id]
 * Fetch a player's profile from AmGolf by their people ID.
 * Admin only.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const player = await getPlayer(id);
    return Response.json(player);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
