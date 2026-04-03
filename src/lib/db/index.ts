/**
 * Database client wrapper.
 * Uses @vercel/postgres in production, can be swapped for local dev.
 */

import { sql } from "@vercel/postgres";

export { sql };

/** Run the schema migration (idempotent — uses IF NOT EXISTS) */
export async function initDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
      handicap_index DECIMAL(4,1),
      handicap_source VARCHAR(10) DEFAULT 'manual',
      home_club VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      date DATE NOT NULL,
      course_id VARCHAR(50) NOT NULL,
      tee_name VARCHAR(50) NOT NULL,
      gender VARCHAR(5) DEFAULT 'Mixed',
      format VARCHAR(20) NOT NULL CHECK (format IN ('strokeplay', 'stableford', 'matchplay')),
      status VARCHAR(25) DEFAULT 'draft',
      max_players INT DEFAULT 80,
      entry_fee_lari INT DEFAULT 0,
      rules TEXT DEFAULT '',
      handicap_allowance DECIMAL(3,2) DEFAULT 0.95,
      flight_config JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'registered',
      handicap_index_at_reg DECIMAL(4,1),
      course_handicap INT,
      playing_handicap INT,
      flight_number INT,
      group_number INT,
      tee_time TIME,
      registered_at TIMESTAMPTZ DEFAULT NOW(),
      access_code CHAR(6) NOT NULL,
      UNIQUE(tournament_id, player_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      hole_number INT NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
      raw_score INT NOT NULL CHECK (raw_score BETWEEN 1 AND 20),
      adjusted_score INT NOT NULL,
      stableford_points INT,
      entered_by VARCHAR(10) DEFAULT 'admin',
      entered_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(registration_id, hole_number)
    )
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_tournament ON registrations(tournament_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_player ON registrations(player_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scores_registration ON scores(registration_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date)`;
}
