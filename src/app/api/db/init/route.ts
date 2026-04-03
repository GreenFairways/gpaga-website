import { isAdmin } from "@/lib/auth/session";
import { initDatabase } from "@/lib/db";

export async function POST() {
  if (!(await isAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDatabase();
  return Response.json({ ok: true, message: "Database initialized" });
}
