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
  FormatConfig,
  Division,
  Team,
  Match,
  TournamentOrganizer,
  TournamentInvite,
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
    divisions: row.divisions as Division[] | null,
    formatConfig: (row.format_config as FormatConfig) || {},
    creatorId: row.creator_id || null,
    tournamentType: row.tournament_type || "official",
    visibility: row.visibility || "public",
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
    amgolfPeopleId: row.amgolf_people_id || null,
    dateOfBirth: row.date_of_birth instanceof Date
      ? row.date_of_birth.toISOString().split("T")[0]
      : row.date_of_birth || null,
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
    divisionLabel: row.division_label || null,
    teamId: row.team_id || null,
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

export function mapTeam(row: any): Team {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    teamHandicap: row.team_handicap != null ? parseFloat(row.team_handicap) : null,
    seed: row.seed,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

export function mapOrganizer(row: any): TournamentOrganizer {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    playerId: row.player_id,
    role: row.role,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

export function mapInvite(row: any): TournamentInvite {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    invitedPlayerId: row.invited_player_id || null,
    invitedEmail: row.invited_email || null,
    inviteCode: row.invite_code,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    respondedAt: row.responded_at?.toISOString?.() || row.responded_at || null,
  };
}

export function mapMatch(row: any): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    roundNumber: row.round_number,
    matchNumber: row.match_number,
    stage: row.stage || "main",
    sideAPlayerId: row.side_a_player_id || null,
    sideATeamId: row.side_a_team_id || null,
    sideBPlayerId: row.side_b_player_id || null,
    sideBTeamId: row.side_b_team_id || null,
    status: row.status,
    winnerPlayerId: row.winner_player_id || null,
    winnerTeamId: row.winner_team_id || null,
    resultText: row.result_text || null,
    nextMatchId: row.next_match_id || null,
    loserMatchId: row.loser_match_id || null,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}
