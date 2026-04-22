export interface LeaderboardEntry {
  address: string;
  name: string;
  score: number;
  time: number;
  kills: number;
  wave: number;
  date: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function addScore(entry: Omit<LeaderboardEntry, 'date'>): Promise<void> {
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch { /* noop — best effort */ }
}
