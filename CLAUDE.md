# bonk-that-duck

## What to Build
AI Game Design Instruction

Create a Vampire Survivors-lite game set in the Good Vibes Club universe.

Core concept

The player controls a Good Vibes Club character in a bright, colorful, tropical island city.
The world is under attack by evil rubber ducks secretly working for Bad Vibes Guy.

The game should be:

simple
fun quickly
replayable
easy to build with modular systems
visually tied to GVC lore, traits, and badge ecosystem
Core gameplay loop

The gameplay loop is:

move around the map
automatically attack nearby enemies
survive waves of duck enemies
collect experience / vibe energy
level up and choose upgrades
become increasingly powerful while enemy swarms scale up

Keep the design arcade-like and lightweight, not overly deep or complicated.

Tone and style

The tone should be:

bright
playful
funny
stylish
chaotic in a satisfying way

This is not grim survival horror.
It should feel like good vibes under absurd attack.

World and Lore Rules
Player side

All standard GVC characters are inherently aligned with good vibes.

Characters can have different gameplay identities based on:

badges
traits
cosmetic themes
archetypes inferred from NFT art and lore
Enemy side

The main enemies are rubber ducks.
Rubber ducks are secretly evil and serve Bad Vibes Guy.

Duck variants can be invented freely as long as they fit the universe and remain visually readable.

Examples:

basic duck swarmers
tank ducks
surfer ducks
lifeguard ducks
toxic slime ducks
hypnotic ducks
bomb ducks
elite boss ducks
Upgrade System Rules

The upgrade system should heavily use GVC badges as upgrade choices.

Badges are not just collectibles — they should function like named power-ups / passive or active modifiers.

Use badge names from the GVC ecosystem as inspiration for upgrade design.

Examples of badge-based upgrades visible from the reference:

One of One
Marble Potential
Cosmic Guardian
Vibe Ranger
AstroBean
High Vibes
Get Pitted
SuperRare
Atomic Aura
Stellar Spheres
Shiba Syndicate
Pepe Posse
Hue Got This
Bubble Visionary
360 No Scope
Sugar Rush

Each badge should map to a gameplay effect that is:

easy to understand
flavorful
synergistic with other upgrades
appropriate for a survivors-like game
Example upgrade directions

These are examples only; feel free to refine them:

High Vibes → increased XP pickup radius or faster leveling
Atomic Aura → damaging aura around player
Stellar Spheres → orbiting projectile spheres
360 No Scope → random high-damage shots in all directions
Sugar Rush → temporary move speed and attack speed burst
Cosmic Guardian → shield or periodic protective pulse
Get Pitted → wave/surf-themed piercing attack
Bubble Visionary → bubble projectiles that trap or slow enemies
Vibe Ranger → improved ranged attacks / accuracy / projectile speed
Marble Potential → bouncing marble shots
AstroBean → bean-shaped energy projectile or summon
Pepe Posse / Shiba Syndicate → themed companion summons if lore-appropriate
SuperRare → stronger version of one random stat or rarer upgrade scaling
One of One → unique high-impact upgrade, limited or legendary tier
Hue Got This → color-based AoE burst or status effect
Bubble Visionary → vision/control/slow field
Sugar Rush → frenzy mode
Atomic Aura → damage aura
Trait-Based Upgrade Rule

In addition to badges, upgrades can also be based on character traits and asset themes from the NFT collection.

Examples:

sunglasses trait → crit chance / cool-headed dodge bonus
surfer vibe → movement and wave attacks
cosmic trait → energy bolts or orbitals
hoodie / street vibe → defense or close-range bruiser bonuses
bright color / aura traits → improved vibe meter or AoE
rare accessory traits → special passive bonuses

Trait-based upgrades should feel like extensions of the collection identity, not generic fantasy RPG perks.

Design Constraints

Keep everything:

easy to prototype
easy to balance
readable on screen
fun within the first minute

Avoid:

overly complex inventory systems
deep narrative systems
complicated crafting
excessive menus
slow early game

Prioritize:

fast feedback
satisfying progression
clean enemy readability
strong upgrade identity
simple but flavorful systems
Content Goals for Initial MVP

Design around a small first version with:

1 map
1 player character
4 to 6 duck enemy types
8 to 12 upgrades
1 core auto attack
1 simple level-up choice system
1 boss duck encounter
10 to 15 minute runs

The first version should prove:

movement feels good
duck swarms are fun to fight
badge upgrades feel unique and flavorful
the GVC identity comes through clearly
Output Expectations for the AI System

When generating content for this game, produce:

enemy concepts
upgrade concepts
character archetypes
weapon ideas
wave ideas
synergy ideas

Make sure all ideas remain consistent with:

GVC good-vibes identity
evil duck enemy theme
tropical island setting
arcade survivors-lite gameplay

Do not drift into generic fantasy or sci-fi unless it is clearly filtered through GVC style.

Short Version Prompt

If you want an even tighter version for repeated use:

Design a Vampire Survivors-lite game set in the Good Vibes Club universe. The player controls a good-aligned GVC character in a bright tropical island city while fighting swarms of evil rubber ducks serving Bad Vibes Guy. Upgrades should be based heavily on GVC badges and NFT traits, turning badge names into flavorful, readable gameplay powers. Keep the game simple, arcade-like, replayable, funny, and fast to prototype. Prioritize satisfying combat, strong upgrade identity, readable duck variants, and a fun 10–15 minute run structure.

## Starting Point
This project uses the **A game** pattern. Here's what Claude should build first:

Build a browser game with: a game board or play area, score display, moves/lives counter, game-over screen with final score, and a restart button. Add a leaderboard if that add-on is selected.

## Selected Power-ups
- **Stats and charts** -- animated counters, data cards, dashboards
- **Game starter kit** -- state machine, daily seed, save/resume, touch input, anti-cheat, share card
- **Badge collection** -- 101 GVC badges with tiers and glow effects
- **Blockchain lookups** -- check wallet balances and read smart contracts
- **User accounts** -- sign up, log in, and protected pages

## GVC Brand System

### Colors
- **Gold (primary):** #FFE048
- **Black (background):** #050505
- **Dark (cards/panels):** #121212
- **Gray (borders/subtle):** #1F1F1F
- **Pink accent:** #FF6B9D
- **Orange accent:** #FF5F1F
- **Green (success):** #2EFF2E

### Typography
- **Headlines:** Brice font (display), bold/black weight -- make them feel premium
- **Body text:** Mundial font, clean and readable, generous spacing
- CSS variables: `--font-brice` for display, `--font-mundial` for body
- Tailwind: `font-display` for headlines, `font-body` for text

### Design Language
- Dark-first design (#050505 background)
- Gold accents (#FFE048) for CTAs, highlights, important elements
- Gold shimmer effect on key headlines (`.text-shimmer` class)
- Gold glow on hover for cards (`.card-glow` class)
- Floating ember particles for ambient effect (`.ember` class)
- Rounded corners (12-16px), soft shadows
- Generous whitespace -- let things breathe
- Micro-animations on hover/interaction (scale, glow, fade)
- Use Framer Motion for entry animations

### CSS Utilities
- `.text-shimmer` -- animated gold gradient text
- `.card-glow` -- gold glow box shadow with hover enhancement
- `.ember` -- floating gold particle dot
- `.rising-particle` -- gold particles that float up from the bottom
- `.font-display` -- Brice headline font
- `.font-body` -- Mundial body font
- Grid texture background and gold bottom gradient are already applied to body
- Shaka icon (/shaka.png) should wiggle on hover. It is already set as the site favicon.
- Site titles should be UPPERCASE (all caps)

## GVC API (no API key needed)
All GVC collection data is available from: https://api-hazel-pi-72.vercel.app/api
- GET /stats -- returns: { floorPrice, floorPriceUsd, volume24h, volume24hUsd, numOwners, totalSales, avgPrice, marketCap, marketCapUsd, totalVolume, totalVolumeUsd }
- GET /sales?limit=10 -- returns: [{ txHash, priceEth, priceUsd, paymentSymbol, imageUrl, timestamp }]
- GET /sales/history?limit=100 -- same shape as /sales, max 1000
- GET /activity -- 30-day buys/sells, accumulator leaderboard
- GET /vibestr -- VIBESTR token data
- GET /vibestr/history -- daily VIBESTR price snapshots
- GET /market-depth -- bid/offer depth, floor price, lowest listing
- GET /traders -- 30-day trade stats
- GET /wallet/[address] -- ENS name, Twitter handle for a wallet
- GET /mentions -- recent X/Twitter mentions
Do NOT use the OpenSea API directly. Use the GVC API above instead.

## Contracts & Tokens (only use these)
- **GVC NFT:** 0xB8Ea78fcaCEf50d41375E44E6814ebbA36Bb33c4 (ERC-721, 6969 tokens)
- **HighKey Moments:** 0x74fcb6eb2a2d02207b36e804d800687ce78d210c (ERC-1155)
- **VIBESTR Token:** 0xd0cC2b0eFb168bFe1f94a948D8df70FA10257196 (ERC-20, 18 decimals)
- **ETH** is the base currency for all GVC transactions
- ETH price: https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
- VIBESTR price: https://api.dexscreener.com/latest/dex/tokens/0xd0cC2b0eFb168bFe1f94a948D8df70FA10257196
- Public RPC: https://ethereum-rpc.publicnode.com
Do NOT reference any other NFT collections, tokens, or contracts. This project is only about GVC.

## Code Patterns

### Animated Stat Card Component

```tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function StatCard({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glow rounded-2xl bg-[#121212] p-6">
      <p className="font-body text-sm text-gray-400">{label}</p>
      <p className="font-display text-3xl text-[#FFE048]">{display.toLocaleString()}{suffix}</p>
    </motion.div>
  );
}
```

### Game Starter Kit Pattern

Core primitives for a scored, shareable, resumable game. Everything below is decoupled so you can take only the pieces you need.

#### 1. State machine (`lib/gameEngine.ts`)

Keep game state out of React. A tiny reducer + custom hook gives you testable logic that won't get reshuffled by re-renders.

```ts
export type Phase = "waiting" | "playing" | "paused" | "ended";
export interface GameState {
  phase: Phase; score: number; moves: number; maxMoves: number;
  seed: string; board: number[][]; history: Move[];
}
export interface Move { at: number; kind: string; payload: unknown; }

export function initGame(seed: string, maxMoves = 30): GameState {
  return { phase: "waiting", score: 0, moves: 0, maxMoves, seed, board: makeBoard(seed), history: [] };
}
export function applyMove(state: GameState, move: Move): GameState {
  // pure function: validate, mutate a copy, return new state
}
```

Wrap with a `useGame()` hook that exposes `{state, start, move, pause, resume, end}` and dispatches through `applyMove`.

#### 2. Daily seed (`lib/daily-seed.ts`)

Wordle-style: everyone playing today gets the same starting board. Huge viral loop.

```ts
export function todaySeed(tz = "America/New_York"): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz }); // "2026-04-21"
}
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
```

Support `?seed=abc123` URL param so players can challenge friends with custom seeds.

#### 3. Save / resume

Persist `GameState` to `localStorage` on every change:

```ts
useEffect(() => {
  if (state.phase === "playing" || state.phase === "paused") {
    localStorage.setItem(`game-state-${projectName}`, JSON.stringify(state));
  } else if (state.phase === "ended") {
    localStorage.removeItem(`game-state-${projectName}`);
  }
}, [state]);
```

On mount, if there's a saved state, show a "Resume previous run?" card.

#### 4. Touch input

Unified input layer over keyboard + swipe. Don't rely on mouse-only.

```ts
export function useSwipe(handlers: { onLeft?(): void; onRight?(): void; onUp?(): void; onDown?(): void }) {
  useEffect(() => {
    let sx = 0, sy = 0;
    const onStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) (dx > 0 ? handlers.onRight : handlers.onLeft)?.();
      else (dy > 0 ? handlers.onDown : handlers.onUp)?.();
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [handlers]);
}
```

#### 5. Error boundary around the game surface

A crash in game logic shouldn't blank the whole app. Wrap `<GameBoard />` in a boundary that shows "Something broke — Restart" and logs to the console / analytics.

#### 6. Anti-cheat via move replay

When a score is submitted, send both the `seed` and the full `moves_json`. Server re-runs `applyMove` with the same seed and compares the final score. Reject mismatches. Pair with the rate-limit pattern in the `leaderboard` addon.

#### 7. Shareable OG score card (`app/api/og/score/route.tsx`)

Dynamic Next.js OG image via `ImageResponse`. When a score URL is shared on X/Farcaster, the link preview shows a branded card with the player's name + score.

```tsx
import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "Anonymous";
  const score = searchParams.get("score") ?? "0";
  return new ImageResponse(
    (<div style={{ width: 1200, height: 630, background: "#050505", color: "#FFE048", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 72 }}>
      <div style={{ fontSize: 32, opacity: 0.6 }}>GVC</div>
      <div>{name}</div>
      <div style={{ fontSize: 144 }}>{score}</div>
    </div>),
    { width: 1200, height: 630 }
  );
}
```

Then add the OG route as `<meta property="og:image" ... />` on the score page so links unfurl with the card.

#### 8. Debug overlay

Gate on `?debug=1`. Floats a panel showing phase/score/moves/FPS with an "Instant Win" button. Priceless for iteration.

#### 9. Responsive board

Wrap the game canvas in `aspect-square max-h-[min(80vh,90vw)] mx-auto`. Respect safe-area insets on notched phones with `padding-bottom: env(safe-area-inset-bottom)`.

### Badge-Token Map

The project includes `badge_token_map.json` which maps every GVC NFT (by token ID) to its earned badges.
- `badgeToTokens`: badge ID -> array of qualifying token IDs
- `tokenToBadges`: token ID -> array of earned badge IDs
- 68 badges across all 6,969 tokens (21,856 assignments)

Use it to look up a holder's badges, build leaderboards, or filter the collection by badge.

```ts
import { getHolderBadges } from "@/lib/badge-helpers";

const map = await fetch('/badge_token_map.json').then(r => r.json());

// Get ALL badges for a holder (individual + combos + milestones + VIBESTR tier)
const result = getHolderBadges(["142", "572", "3933"], map, 150000);
// result.allBadges includes everything
// result.comboBadges e.g. ["gradient_hatrick"] if 3+ gradient tokens
// result.collectorBadges e.g. ["five_badges"] if 5+ unique badges
// result.vibestrTierBadge e.g. "vibestr_silver_tier"
```

### Badge Card with Tier Glow

```tsx
const TIER_COLORS: Record<string, string> = {
  bronze: "shadow-orange-400/30",
  silver: "shadow-gray-300/30",
  gold: "shadow-[#FFE048]/40",
  diamond: "shadow-cyan-300/50",
};

export function BadgeCard({ name, tier, image }: { name: string; tier: string; image: string }) {
  return (
    <div className={`rounded-2xl bg-[#121212] p-4 shadow-lg ${TIER_COLORS[tier] ?? ""} hover:scale-105 transition-transform`}>
      <img src={image} alt={name} className="w-full rounded-xl" />
      <p className="mt-2 font-display text-sm text-[#FFE048]">{name}</p>
      <span className="text-xs text-gray-400 capitalize">{tier}</span>
    </div>
  );
}
```

### On-Chain Reads (Wallet Balances)

```ts
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({ chain: mainnet, transport: http("https://ethereum-rpc.publicnode.com") });

// Read ETH balance
const balance = await client.getBalance({ address: "0x..." });
console.log(formatEther(balance));
```

### User Accounts Pattern

Username + password auth with bcrypt + iron-session cookies. No external services, works anywhere Postgres is wired.

Install:

```bash
npm install bcryptjs iron-session
npm install -D @types/bcryptjs
```

#### Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
```

#### Session config (`lib/session.ts`)

```ts
import type { SessionOptions } from "iron-session";
export interface Session { userId?: string; username?: string; }
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,  // 32+ chars; set in Vercel env
  cookieName: "gvc_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" },
};
```

#### `POST /api/auth/register`

```ts
const { username, password } = await req.json();
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return NextResponse.json({ error: "Invalid username" }, { status: 400 });
if (password.length < 8) return NextResponse.json({ error: "Password must be 8+ chars" }, { status: 400 });
const hash = await bcrypt.hash(password, 10);
try {
  const { rows } = await pool.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
    [username, hash]
  );
  const session = await getIronSession<Session>(cookies(), sessionOptions);
  session.userId = rows[0].id; session.username = rows[0].username;
  await session.save();
  return NextResponse.json({ username: rows[0].username });
} catch (e: any) {
  if (e.code === "23505") return NextResponse.json({ error: "Username taken" }, { status: 409 });
  throw e;
}
```

#### `POST /api/auth/login`

Look up by `LOWER(username) = LOWER($1)`, `bcrypt.compare`, set session on success.

#### `GET /api/auth/session`

Returns `{ userId, username }` or `{}` for anonymous.

#### `POST /api/auth/logout`

`session.destroy()` + empty JSON.

#### Rate limits

`/register` and `/login` rate-limit by IP (5/min) to stop brute-force. Reuse the `submission_rate_log` pattern from prompt submissions.

#### Protect API routes

```ts
const session = await getIronSession<Session>(cookies(), sessionOptions);
if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

Don't allow username changes without a fresh password confirmation.

## Example Prompts to Try
- "Add sound effects when the player scores"
- "Create a difficulty selector (easy, medium, hard)"
- "Add a share button that posts your score to Twitter"
- "Build an animated stats row with counters that tick up on load"
- "Display all 101 GVC badges in a grid with tier filtering"
- "Wire up the game state machine, daily seed, and save/resume pattern from CLAUDE.md"
- "Add username/password auth with iron-session cookies and rate-limited /register and /login routes"
- "Make everything responsive and look great on mobile"

## Token Metadata (`public/gvc-metadata.json`)

Complete metadata for all 6,969 GVC tokens. Keyed by token ID (0-6968).

```ts
const metadata = await fetch('/gvc-metadata.json').then(r => r.json());

const token = metadata["142"];
// token.name    -> "Citizen of Vibetown #142"
// token.traits  -> { Type: "Robot", Face: "Laser Eyes", Hair: "Mohawk Gold", Body: "Hoodie Black", Background: "BG Mint" }
// token.image   -> "ipfs://QmY6JpwTYx6zZHgfJb3gPJRh1U897NX4RudtK5jhJ3sNDS/142.jpg"

// Trait types: Type, Face, Hair, Body, Background
// To display image: replace "ipfs://" with "https://ipfs.io/ipfs/"
```

Use cases: rarity checker, token lookup, trait filtering, collection search, trait-based galleries.

## Assets
- Fonts: /public/fonts/ (Brice for headlines, Mundial for body)
- Shaka icon: /public/shaka.png
- GVC logotype: /public/gvc-logotype.svg
- Background grid: /public/grid.svg (already applied via body::before in globals.css — do NOT add background-size or opacity overrides on top; the SVG ships with its own 10% white stroke, and extra opacity stacks to invisible)
- Token metadata: /public/gvc-metadata.json (all 6,969 tokens with traits + images)

## Brand Asset Library
Official GVC brand images (backgrounds, GIFs, characters, scenes, T-poses) hosted and available via API.
- Browse gallery: https://goodvibesclub.ai/library
- API: GET https://goodvibesclub.ai/api/brand (returns all assets)
- Filter by category: GET https://goodvibesclub.ai/api/brand?category=backgrounds
- Response shape: { assets: [{ id, filename, image_url, category }], categories: [...] }
- Use image_url values directly as src in <img> or next/image components

## Tech Stack
- Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion

## Important: Dev Server
The dev server is already running (the user started it before opening Claude Code). Do NOT run `npm run dev` -just edit the files and the browser will hot-reload automatically. If you need to install a new package, use `npm install <package>` and the dev server will pick it up.

## Project Structure
app/ -> Pages and layouts
components/ -> Reusable UI components
public/ -> Static assets
CLAUDE.md -> This file
README.md -> Human-readable docs
