import { destroySession } from "@/lib/auth/session";
import { destroyPlayerSession } from "@/lib/auth/player-session";

export async function POST() {
  await Promise.all([destroySession(), destroyPlayerSession()]);
  return Response.json({ ok: true });
}
