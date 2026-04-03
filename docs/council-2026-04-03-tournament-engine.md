# Council Session: 2026-04-03 — Tournament Constructor Architecture

## Decisions (APPROVED by Stas)

### Architecture
- Single `format` field (expanded enum), not two axes
- `format_config JSONB` for format parameters (team_size, handicap_pct, bracket_size...)
- `teams` table + `team_id` in registrations and scores
- `matches` table for bracket tournaments
- `round_number` in scores for multi-round
- Strategy Pattern: `lib/scoring/strategies/{format}.ts`

### Tie-break Order (DEFAULT)
1. Lower handicap index wins
2. Countback: last 9 holes (10-18)
3. Countback: last 6 holes (13-18)
4. Countback: last 3 holes (16-18)
5. Countback: hole 18
6. Committee decision

### Handicap Formulas (defaults, overrideable by tournament director)
- Individual Stroke Play: 95% CH
- Individual Stableford: 95% CH
- Individual Match Play: 100% difference CH
- Scramble 2-ball: 35% low + 15% high
- Scramble 3-ball: 20% low + 15% mid + 10% high
- Scramble 4-ball: 25% of sum CH
- Best Ball: 85% CH each
- Greensome: 60% low + 40% high
- Foursomes: 47.5% each

### Implementation Waves
1. Refactor to Strategy Pattern + Vitest setup
2. Scramble (2/3/4-ball) — teams, team scores, team leaderboard
3. Countback + statuses (suspended, dns, dnf, dq)
4. Best Ball
5. Match Play brackets
6. Shotgun start, TV mode, PDF

### Format Priority
- P0 (done): strokeplay, stableford, divisions
- P1 (next): scramble
- P2: best ball, countback, statuses
- P3: match play brackets
- P4: greensome, foursomes
- P5: skins, ryder cup style
- NOT building: modified stableford, par/bogey, shamble, double elimination

## Council Members
- CTO/Architect, Golf Domain Expert, Product Lead, Head of Engineering, Clubhouse Caddy
