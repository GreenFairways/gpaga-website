# AmGolf API Reference

Reverse-engineered endpoints for app.am.golf SPA.
Base URL: `https://app.am.golf`
Auth: session cookie via POST login.

## Authentication

```
POST /am.golf/session.amg.model
Body: { "username": "...", "password": "...", "rememberme": false }
Response: Set-Cookie header with session cookie
```

## Data Format

All endpoints use `.amg.model` suffix for JSON, `.amg.html` for rendered pages.

Response structure:
```json
{
  "$href": "/path/to/resource.amg.model",
  "parent": { "$href": "..." },
  "content": { ... },
  "nested_resource": { "$href": "...", "content": [...] }
}
```

Lists have `content: []` array. Paginated lists have `next: { $href: "..." }`.

## Organizations

### Get org details
```
GET /am.golf/organizations/list/-/{orgId}.amg.model
```

### List org members (paginated by 20)
```
GET /am.golf/organizations/list/-/{orgId}/home/members/individuals/list.amg.model
```
Fields: firstName, lastName, exactHandicap, countryCode, homeClubName, hcpStatus, pro
Pagination: `next.$href` for next page

### List org events
```
GET /am.golf/organizations/list/-/{orgId}/home/events/list.amg.model
```
Note: Returns IDs only, names come empty in list view. Must fetch each event individually.

## Players

### Get player profile
```
GET /am.golf/people/list/-/{peopleId}.amg.model
```
Fields: firstName, lastName, name, exactHandicap, lowHandicapIndex, gender, countryCode, homeClubName, tournamentsPlayed, hcpStatus, pro

### Search players by name
```
GET /am.golf/people/list.amg.model?filter=playerName:{query}
```
URL-encode the query. Returns content[] array of player entries.

## Events

### List events (upcoming only in default view)
```
GET /am.golf/events/list.amg.model
```
Returns upcoming events. For completed: `?filter=status:completed` (returns thousands).

### Get event details
```
GET /am.golf/events/list/-/-/-/{eventId}.amg.model
```
Key fields:
- `content`: name, format, startDate (unix ms), endDate, rounds, eventStatus, participantsCount
- `divisions`: division configs (name, scoring, hcpLow/hcpHigh, holes, tiebreak, hcpAllowance)
- `scoring_formats`, `championships`, `awards`, `schedule`, `courses`

### Event status values
- `upcoming`, `live`, `final`

### Event format values
- `individual_stroke_play`, `teams_stroke_play`, etc.

## Participants

### List confirmed participants
```
GET /am.golf/events/list/-/-/-/{eventId}/home/participants/confirmed/list.amg.model
```
Fields: name, hcp, gender, countryCode, hcpStatus, isWithdrawn
Links: `people.$href` -> player profile, `rankings.$href`

Participant ID: extracted from `$href` (last path segment before .amg.model)

## Leaderboards

### Get division leaderboard
```
GET /am.golf/events/list/-/-/-/{eventId}/home/leaderboards/{divisionId}/list.amg.model
```
Division IDs come from event `divisions.content[].$href`.

Fields per entry: rank, name, score (gross for strokeplay / points for stableford), toPar, net, phcp, through, tied

## Scorecards

### Get scorecard redirect (to find scorecard ID)
```
GET /am.golf/events/list/-/-/-/{eventId}/home/participants/confirmed/list/{participantId}/scorecards.amg.model
```
Response contains `content.redirect` with full path including scorecard ID.

### Get full scorecard with hole-by-hole data
```
GET /am.golf/events/list/-/-/-/{eventId}/home/participants/confirmed/list/{participantId}/scorecards/{scorecardId}.amg.model
```

**Content fields:**
- `playerName`, `hcp` (handicap index), `phcp` (playing handicap), `tees`
- `strokes` (total gross), `phcpStrokes` (total net), `phcpPoints` (total stableford)
- `par`, `courseRating`, `slopeRating`, `scoreDiff`, `pcc`
- `through` (holes completed), `status`, `flight`, `round`
- `holes` (total holes: 18 or 9)

**Nested `scores.content[]` — hole-by-hole data:**
```json
{
  "content": {
    "hole": 1,
    "par": 5,
    "dif": 7,           // Stroke Index
    "len": 466,          // Length in meters
    "strokes": 6,        // Gross score
    "phcpStrokes": 5,    // Net score
    "phcpPoints": 2,     // Stableford points (net)
    "phcpShots": 1,      // Handicap strokes received on this hole
    "pickup": false,     // Player picked up (X)
    "points": 2          // Stableford points (gross? or same as phcpPoints)
  }
}
```

Note: Holes in scores array are NOT ordered by hole number. Sort by `content.hole`.

**Nested `course.content[]` — course data:**
- Tee info, pin positions, pace times

### HTML scorecard (public if privacy allows)
```
GET /am.golf/events/list/-/-/-/{eventId}/home/participants/confirmed/list/{participantId}/scorecards/{scorecardId}.amg.html
```

## Divisions Config

From `event.divisions.content[]`:
```json
{
  "name": "Division A",
  "scoring": "net_strokes",          // or "stableford_points"
  "hcpLow": -8,
  "hcpHigh": 18,
  "hcpAllowance": "100",
  "holes": 18,                       // or 9
  "filterHoles": "F9",               // Front 9, only for 9-hole divisions
  "tiebreak": "handicap",
  "tees": "standard",
  "sortBy": "to_par",
  "gender": "all",
  "rounds": 1
}
```

### Scoring values
- `net_strokes` — Net strokeplay (lower is better)
- `stableford_points` — Stableford (higher is better)

### Tiebreak values
- `handicap` — Lower handicap wins
- `none` — No tiebreak

## Known IDs

### Tbilisi Hills Golf Club
- Org ID: `60147f0dbe3c886fcbf82180`
- Course ID: `601480a8be3c886fcbf84e89`

### GPAGA Season Opening 2026, Round 2
- Event ID: `69b7bf9fb8f66d0859832554`
- Date: 2026-03-28
- Division A: `69b7c1aee7e5300371a8c5d2` (Net Strokes, HCP -8 to 18, 18h)
- Division B: `69b7c1bbb087c8692d1313dc` (Stableford, HCP 18.1-36, 18h)
- Division C: `69b7c1cd664334853cd0142c` (Stableford, HCP 36.1-54, 9h Front 9)

## Privacy Settings

Event-level privacy controls:
- `scoresPrivacy: "admins"` — Only event admins can see individual scores via API
- `leaderboardsPrivacy: "public"` — Leaderboards visible to all
- `scorecardsPrivacy: "public"` — Scorecards visible to all (HTML pages)
- `participantsPrivacy: "public"` — Participant list visible to all

Note: Even when `scoresPrivacy` is "admins", the full scorecard data is available via the scorecard `.amg.model` endpoint to authenticated users. The HTML scorecard pages are accessible based on `scorecardsPrivacy`.

## Rate Limiting

No observed rate limiting. Session cookies are valid for extended periods.
Recommended: cache session for 30 minutes, re-authenticate on 401.
