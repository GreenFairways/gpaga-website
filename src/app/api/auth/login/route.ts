import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || typeof password !== "string") {
    return Response.json({ error: "Password required" }, { status: 400 });
  }

  const ok = await createSession(password);
  if (!ok) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
