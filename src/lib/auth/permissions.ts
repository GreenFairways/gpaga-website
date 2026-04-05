/**
 * Centralized permission checks for tournament management.
 *
 * Three-level auth model:
 * 1. Admin — full access to everything
 * 2. Organizer — creator or co-organizer of a specific tournament
 * 3. Player — authenticated player (self-register, view, accept invites)
 */

import { isAdmin } from "./session";
import { getAuthenticatedPlayerId } from "./player-session";
import { sql } from "@/lib/db";

export interface AuthContext {
  isAdmin: boolean;
  playerId: string | null;
}

/** Get the full auth context for the current request. */
export async function getAuthContext(): Promise<AuthContext> {
  const [admin, playerId] = await Promise.all([
    isAdmin(),
    getAuthenticatedPlayerId(),
  ]);
  return { isAdmin: admin, playerId };
}

/**
 * Can this user manage the tournament?
 * True if admin OR creator OR co-organizer.
 */
export async function canManageTournament(
  tournamentId: string,
): Promise<boolean> {
  if (await isAdmin()) return true;

  const playerId = await getAuthenticatedPlayerId();
  if (!playerId) return false;

  const { rows } = await sql`
    SELECT 1 FROM tournament_organizers
    WHERE tournament_id = ${tournamentId} AND player_id = ${playerId}
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Is this user the creator or admin?
 * Used for destructive actions (DELETE) that co-organizers cannot perform.
 */
export async function isCreatorOrAdmin(
  tournamentId: string,
): Promise<boolean> {
  if (await isAdmin()) return true;

  const playerId = await getAuthenticatedPlayerId();
  if (!playerId) return false;

  const { rows } = await sql`
    SELECT 1 FROM tournament_organizers
    WHERE tournament_id = ${tournamentId}
      AND player_id = ${playerId}
      AND role = 'creator'
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Can this user view the tournament?
 * Public/unlisted — anyone. Private — admin, organizer, or invited player.
 */
export async function canViewTournament(
  tournamentId: string,
): Promise<boolean> {
  // Check visibility
  const { rows: tRows } = await sql`
    SELECT visibility FROM tournaments WHERE id = ${tournamentId}
  `;
  if (tRows.length === 0) return false;

  const visibility = tRows[0].visibility || "public";
  if (visibility === "public" || visibility === "unlisted") return true;

  // Private — need auth
  if (await isAdmin()) return true;

  const playerId = await getAuthenticatedPlayerId();
  if (!playerId) return false;

  // Check if organizer
  const { rows: orgRows } = await sql`
    SELECT 1 FROM tournament_organizers
    WHERE tournament_id = ${tournamentId} AND player_id = ${playerId}
    LIMIT 1
  `;
  if (orgRows.length > 0) return true;

  // Check if invited (accepted or pending)
  const { rows: invRows } = await sql`
    SELECT 1 FROM tournament_invites
    WHERE tournament_id = ${tournamentId}
      AND invited_player_id = ${playerId}
      AND status IN ('pending', 'accepted')
    LIMIT 1
  `;
  if (invRows.length > 0) return true;

  // Check if registered
  const { rows: regRows } = await sql`
    SELECT 1 FROM registrations
    WHERE tournament_id = ${tournamentId} AND player_id = ${playerId}
    LIMIT 1
  `;
  return regRows.length > 0;
}
