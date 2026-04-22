export interface LeaderboardEntry {
  address: string;
  name: string;
  score: number;
  time: number;
  kills: number;
  wave: number;
  date: string;
  isGuest?: boolean;
}

export async function getPlayerEntry(address: string): Promise<LeaderboardEntry | null> {
  try {
    const res = await fetch(`/api/leaderboard?address=${encodeURIComponent(address)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function addScore(
  entry: Omit<LeaderboardEntry, 'date' | 'isGuest'>,
  guestAddress?: string,
): Promise<void> {
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, guestAddress }),
    });
  } catch { /* noop — best effort */ }
}
