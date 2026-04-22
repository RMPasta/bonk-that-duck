export interface LeaderboardEntry {
  address: string;
  name: string;
  score: number;
  time: number;
  kills: number;
  wave: number;
  date: string;
}

const KEY = 'btd_leaderboard_v1';
const MAX = 50;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addScore(entry: LeaderboardEntry): LeaderboardEntry[] {
  const scores = getLeaderboard();
  // Replace existing entry for same address if new score is higher
  const idx = scores.findIndex(s => s.address === entry.address);
  if (idx >= 0) {
    if (entry.score > scores[idx].score) scores[idx] = entry;
  } else {
    scores.push(entry);
  }
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)); } catch { /* noop */ }
  return trimmed;
}
