/**
 * Map database rows (snake_case) to TypeScript types (camelCase).
 */

import type {
  Tournament,
  Player,
  Registration,
  RegistrationWithPlayer,
  TournamentScore,
  FlightConfig,
} from "../tournament/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapTournament(row: any): Tournament {
  return {
    id: row.id,
    name: row.name,
    date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date,
    courseId: row.course_id,
    teeName: row.tee_name,
    gender: row.gender || "Mixed",
    format: row.format,
    status: row.status,
    maxPlayers: row.max_players,
    entryFeeLari: row.entry_fee_lari,
    rules: row.rules || "",
    handicapAllowance: parseFloat(row.handicap_allowance) || 0.95,
    flightConfig: row.flight_config as FlightConfig | null,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
  };
}

export function mapPlayer(row: any): Player {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || null,
    gender: row.gender,
    handicapIndex: row.handicap_index != null ? parseFloat(row.handicap_index) : null,
    handicapSource: row.handicap_source || "manual",
    homeClub: row.home_club || null,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

export function mapRegistration(row: any): Registration {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    playerId: row.player_id,
    status: row.status,
    handicapIndexAtReg: row.handicap_index_at_reg != null ? parseFloat(row.handicap_index_at_reg) : null,
    courseHandicap: row.course_handicap != null ? parseInt(row.course_handicap) : null,
    playingHandicap: row.playing_handicap != null ? parseInt(row.playing_handicap) : null,
    flightNumber: row.flight_number,
    groupNumber: row.group_number,
    teeTime: row.tee_time || null,
    registeredAt: row.registered_at?.toISOString?.() || row.registered_at,
    accessCode: row.access_code,
  };
}

export function mapRegistrationWithPlayer(row: any): RegistrationWithPlayer {
  return {
    ...mapRegistration(row),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    gender: row.gender,
  };
}

export function mapScore(row: any): TournamentScore {
  return {
    id: row.id,
    registrationId: row.registration_id,
    holeNumber: row.hole_number,
    rawScore: row.raw_score,
    adjustedScore: row.adjusted_score,
    stablefordPoints: row.stableford_points,
    enteredBy: row.entered_by,
    enteredAt: row.entered_at?.toISOString?.() || row.entered_at,
  };
}
