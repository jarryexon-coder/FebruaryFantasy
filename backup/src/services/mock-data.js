// Development data
export const mockPlayers = [
  {
    id: 1,
    name: 'LeBron James',
    team: 'LAL',
    points: 25.3,
    rebounds: 7.9,
    assists: 7.3,
    position: 'SF',
  },
  {
    id: 2,
    name: 'Stephen Curry',
    team: 'GSW',
    points: 28.1,
    rebounds: 5.2,
    assists: 6.7,
    position: 'PG',
  },
  {
    id: 3,
    name: 'Kevin Durant',
    team: 'PHX',
    points: 27.8,
    rebounds: 6.8,
    assists: 5.1,
    position: 'PF',
  },
];

export const mockGames = [
  {
    id: 1,
    homeTeam: 'LAL',
    awayTeam: 'GSW',
    homeScore: 112,
    awayScore: 108,
    status: 'Final',
    time: 'Q4 00:00',
  },
  {
    id: 2,
    homeTeam: 'BOS',
    awayTeam: 'MIA',
    homeScore: 98,
    awayScore: 95,
    status: 'Final',
    time: 'Q4 00:00',
  },
];

export const mockBettingOdds = [
  {
    game: 'LAL vs GSW',
    moneyline: { home: -150, away: +130 },
    spread: { home: -3.5, away: +3.5 },
    overUnder: 225.5,
  },
];

export const mockFantasyAdvice = [
  {
    player: 'LeBron James',
    recommendation: 'STRONG START',
    reason: 'High usage rate expected',
    confidence: 85,
  },
];
