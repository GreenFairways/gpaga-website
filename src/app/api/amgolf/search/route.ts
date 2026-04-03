import { isAdmin } from "@/lib/auth/session";
import { searchPlayerByName } from "@/lib/amgolf";

/**
 * GET /api/amgolf/search?q=name
 * Search AmGolf players by name. Admin only.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || q.length < 2) {
    return Response.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    );
  }

  try {
    const player = await searchPlayerByName(q);
    return Response.json(player ? [player] : []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
