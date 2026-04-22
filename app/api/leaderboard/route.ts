import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const LB_KEY = 'bonk:lb';
const TOP = 50;

export async function GET() {
  try {
    // Top 50 by score descending, with scores
    const raw = await kv.zrange(LB_KEY, 0, TOP - 1, { rev: true, withScores: true });
    // raw = [member, score, member, score, ...]
    const entries = [];
    for (let i = 0; i < raw.length; i += 2) {
      const address = raw[i] as string;
      const score = raw[i + 1] as number;
      const meta = await kv.hgetall<{ name: string; wave: string; time: string; kills: string; date: string }>(
        `bonk:player:${address}`
      );
      entries.push({
        address,
        name: meta?.name ?? address.slice(0, 6) + '…',
        score,
        wave: meta?.wave ? Number(meta.wave) : 0,
        time: meta?.time ? Number(meta.time) : 0,
        kills: meta?.kills ? Number(meta.kills) : 0,
        date: meta?.date ?? '',
      });
    }
    return NextResponse.json(entries, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('leaderboard GET error', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, name, score, wave, time, kills } = body as {
      address: string; name: string; score: number;
      wave: number; time: number; kills: number;
    };

    // Basic validation
    if (!address || typeof score !== 'number' || score < 0 || score > 1_000_000) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Rate limit: one submission per address per 45 seconds
    const rlKey = `bonk:rl:${address.toLowerCase()}`;
    const allowed = await kv.set(rlKey, 1, { ex: 45, nx: true });
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Only write if new score beats personal best
    const current = await kv.zscore(LB_KEY, address);
    if (current === null || score > current) {
      await kv.zadd(LB_KEY, { score, member: address });
      await kv.hset(`bonk:player:${address}`, {
        name: (name ?? address).slice(0, 42),
        score: String(score),
        wave: String(wave ?? 0),
        time: String(time ?? 0),
        kills: String(kills ?? 0),
        date: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('leaderboard POST error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
