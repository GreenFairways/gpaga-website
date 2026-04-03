/**
 * AmGolf API client
 *
 * Authenticates via session cookie.
 * All data accessed via .amg.model JSON endpoints.
 */

const BASE = "https://app.am.golf";

interface AmGolfSession {
  cookie: string;
  expiresAt: number;
}

let cachedSession: AmGolfSession | null = null;

/**
 * Authenticate and get session cookie.
 * Caches session for 30 minutes.
 */
async function authenticate(): Promise<string> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.cookie;
  }

  const username = process.env.AMGOLF_USERNAME;
  const password = process.env.AMGOLF_PASSWORD;
  if (!username || !password) {
    throw new Error("AMGOLF_USERNAME and AMGOLF_PASSWORD must be set");
  }

  const res = await fetch(`${BASE}/am.golf/session.amg.model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, rememberme: false }),
  });

  if (!res.ok) {
    throw new Error(`AmGolf login failed: ${res.status}`);
  }

  // Extract session cookie (getSetCookie for Node 20+, fallback for older)
  const cookies =
    (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
    (res.headers.get("set-cookie")?.split(",").map((c) => c.trim()) || []);

  if (cookies.length === 0) {
    throw new Error("AmGolf login: no set-cookie header");
  }

  const cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  cachedSession = {
    cookie,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 min
  };

  return cookie;
}

/**
 * Fetch a .amg.model endpoint with authentication.
 */
async function amgolfFetch<T>(path: string): Promise<T> {
  const cookie = await authenticate();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) {
    throw new Error(`AmGolf API error: ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

// --- Public API ---

export interface AmGolfPlayer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  exactHandicap: number | null;
  lowHandicapIndex: number | null;
  gender: string;
  countryCode: string;
  homeClubName: string | null;
  tournamentsPlayed: number;
  hcpStatus: string;
  pro: boolean;
}

interface AmGolfPlayerResponse {
  $href: string;
  content: {
    firstName: string;
    lastName: string;
    name: string;
    exactHandicap?: number;
    lowHandicapIndex?: number;
    gender?: string;
    countryCode?: string;
    homeClubName?: string;
    tournamentsPlayed?: number;
    hcpStatus?: string;
    pro?: number | boolean;
  };
}

/**
 * Look up a player by their AmGolf people ID.
 */
export async function getPlayer(peopleId: string): Promise<AmGolfPlayer> {
  const data = await amgolfFetch<AmGolfPlayerResponse>(
    `/am.golf/people/list/-/${peopleId}.amg.model`,
  );
  const c = data.content;
  return {
    id: peopleId,
    firstName: c.firstName,
    lastName: c.lastName,
    name: c.name,
    exactHandicap: c.exactHandicap ?? null,
    lowHandicapIndex: c.lowHandicapIndex ?? null,
    gender: c.gender ?? "male",
    countryCode: c.countryCode ?? "",
    homeClubName: c.homeClubName ?? null,
    tournamentsPlayed: c.tournamentsPlayed ?? 0,
    hcpStatus: c.hcpStatus ?? "unknown",
    pro: !!c.pro,
  };
}

export interface AmGolfSearchResult {
  id: string;
  name: string;
  hcp: number | null;
  gender: string;
  countryCode: string;
  hcpStatus: string;
  peopleHref: string;
}

interface AmGolfParticipantEntry {
  $href: string;
  content: {
    name: string;
    hcp?: number;
    gender?: string;
    countryCode?: string;
    hcpStatus?: string;
  };
  people?: {
    $href: string;
  };
}

interface AmGolfListResponse {
  content: AmGolfParticipantEntry[];
  total: number;
}

/**
 * Get all participants of an AmGolf event with their HCP.
 */
export async function getEventParticipants(
  eventId: string,
): Promise<AmGolfSearchResult[]> {
  const data = await amgolfFetch<AmGolfListResponse>(
    `/am.golf/events/list/-/-/-/${eventId}/home/participants/confirmed/list.amg.model`,
  );
  return data.content.map((p) => {
    const href = p.$href;
    const id = href.split("/").pop()?.replace(".amg.model", "") ?? "";
    const peopleHref = p.people?.$href ?? "";
    const peopleId = peopleHref.split("/").pop()?.replace(".amg.model", "") ?? "";
    return {
      id,
      name: p.content.name,
      hcp: p.content.hcp ?? null,
      gender: p.content.gender ?? "male",
      countryCode: p.content.countryCode ?? "",
      hcpStatus: p.content.hcpStatus ?? "unknown",
      peopleHref,
      peopleId,
    };
  });
}

/**
 * Search players by name. Uses the event participants list as a proxy
 * since AmGolf doesn't expose a public player search endpoint easily.
 * For direct lookup, use getPlayer() with a known peopleId.
 */
export async function searchPlayerByName(
  name: string,
): Promise<AmGolfPlayer | null> {
  // AmGolf has a filter endpoint for searching
  const query = encodeURIComponent(name);
  try {
    const data = await amgolfFetch<{ content: AmGolfPlayerResponse[] }>(
      `/am.golf/people/list.amg.model?filter=playerName:${query}`,
    );
    if (data.content && data.content.length > 0) {
      const c = data.content[0].content;
      const href = data.content[0].$href;
      const id = href.split("/").pop()?.replace(".amg.model", "") ?? "";
      return {
        id,
        firstName: c.firstName,
        lastName: c.lastName,
        name: c.name,
        exactHandicap: c.exactHandicap ?? null,
        lowHandicapIndex: c.lowHandicapIndex ?? null,
        gender: c.gender ?? "male",
        countryCode: c.countryCode ?? "",
        homeClubName: c.homeClubName ?? null,
        tournamentsPlayed: c.tournamentsPlayed ?? 0,
        hcpStatus: c.hcpStatus ?? "unknown",
        pro: !!c.pro,
      };
    }
  } catch {
    // Search endpoint may not work with this filter — fall through
  }
  return null;
}

/**
 * Invalidate cached session (e.g., after auth error).
 */
export function clearSession(): void {
  cachedSession = null;
}
